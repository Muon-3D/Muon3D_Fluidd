import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { borrowCloudPrinter, cloudState, dropCloudConnection } from '../state'
import { storeToken } from '../api'
import { stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { EID, fakeEndpoint, fakePrinter } from '@/services/muon-ble/__tests__/fakes'

// One fake endpoint stands for the tab's Iroh endpoint: the Bluetooth link is
// added to it, and connect() answers as the printer does once a path exists.
const ble = fakeEndpoint()
const connect = vi.fn(async (id: string) => ({
  printerId: () => id,
  fetch: async () => ({ status: 200, headers: [] as string[], body: new Uint8Array() }),
  openWebSocket: async () => { throw new Error('unused') },
  close: () => {}
}))

vi.mock('../iroh', async () => {
  const real = await vi.importActual<typeof import('../iroh')>('../iroh')
  const endpoint = () => ({ ...ble.endpoint, endpointId: () => 'me', secretKey: () => new Uint8Array(32), connect, close: async () => {} }) as any
  return {
    ...real,
    browserEndpoint: vi.fn(async () => endpoint()),
    managedEndpointFactory: () => Promise.resolve({
      async openRelay (session: { printerId: string }) {
        return new real.IrohPrinter(await real.dialPrinter(endpoint(), session.printerId))
      },
      close () {}
    })
  }
})

const printer = (online: boolean) => ({
  id: EID, name: 'Boxwood', model: 'M1', version: '1', linked_at: 1, last_seen: online ? Date.now() / 1000 : 1, online, online_since: null
}) as any

function cloud (access: () => Response) {
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname
    calls.push(`${init?.method ?? 'GET'} ${path}`)
    if (path === '/v1/config') return new Response(JSON.stringify({ relay_url: 'https://relay.example.test' }), { status: 200 })
    if (path === '/v1/me/endpoint') return new Response(JSON.stringify({ endpoint_id: 'me' }), { status: 200 })
    if (path === `/v1/printers/${EID}/access`) return access()
    return new Response('{}', { status: 404 })
  }))
  return calls
}

describe('Connect over Bluetooth with the cloud saying the printer is offline (KAN-1253)', () => {
  beforeEach(() => {
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key)
    })
    localStorage.setItem('muon.cloud.url', 'https://console.example.test')
    storeToken('mock-session')
    cloudState.account = { id: 'sample', name: 'Sample', email: 'sample@example.test', created_at: 0 }
    cloudState.config = null
    cloudState.endpointId = null
    ble.endpoint.addLink.mockClear()
    connect.mockClear()
  })
  afterEach(() => {
    dropCloudConnection(EID)
    stopUsingBluetoothFor(EID)
    storeToken(null)
    cloudState.account = null
    cloudState.printers = []
    cloudState.config = null
    vi.unstubAllGlobals()
  })

  it('opens the Bluetooth link and reaches the printer, never saying it is offline', async () => {
    cloudState.printers = [printer(false)]
    cloud(() => new Response(JSON.stringify({ error: 'device_unreachable' }), { status: 503 }))
    useBluetoothFor(EID, fakePrinter().device)

    const transport = await borrowCloudPrinter(EID)
    const response = await transport.fetch('/printer/info')

    expect(response.status).toBe(200)
    expect(ble.endpoint.addLink).toHaveBeenCalledTimes(1)
    expect(connect).toHaveBeenCalledWith(EID)
  })

  it('still takes the cloud grant first for an online printer, and links Bluetooth as well', async () => {
    cloudState.printers = [printer(true)]
    const calls = cloud(() => new Response(JSON.stringify({
      grant_id: 'g1', printer_id: EID, relay_url: 'https://relay.example.test', expires_at: Math.floor(Date.now() / 1000) + 600
    }), { status: 200 }))
    useBluetoothFor(EID, fakePrinter().device)

    const transport = await borrowCloudPrinter(EID)
    expect((await transport.fetch('/printer/info')).status).toBe(200)

    expect(calls).toContain(`POST /v1/printers/${EID}/access`)
    expect(ble.endpoint.addLink).toHaveBeenCalledTimes(1)
  })

  it('leaves the relay route alone: no Bluetooth asked for, an offline printer is still offline', async () => {
    cloudState.printers = [printer(false)]
    cloud(() => new Response(JSON.stringify({ error: 'device_unreachable' }), { status: 503 }))
    await expect(borrowCloudPrinter(EID)).rejects.toThrow('Printer is offline')
    expect(ble.endpoint.addLink).not.toHaveBeenCalled()
  })

  // Last: the grant request retries 503 for good, and a later test would borrow it.
  it('does the same when the service answers 503 for a printer it lists as online', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      cloudState.printers = [printer(true)]
      cloud(() => new Response(JSON.stringify({ error: 'device_unreachable' }), { status: 503 }))
      useBluetoothFor(EID, fakePrinter().device)
      const opening = borrowCloudPrinter(EID)
      await vi.advanceTimersByTimeAsync(6_000)
      const transport = await opening
      expect((await transport.fetch('/printer/info')).status).toBe(200)
      expect(ble.endpoint.addLink).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  }, 15_000)
})
