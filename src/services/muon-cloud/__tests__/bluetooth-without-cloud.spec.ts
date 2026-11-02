import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { borrowCloudPrinter, cloudState } from '../state'
import { CloudError, storeToken } from '../api'
import { deletionState } from '../deletion'
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
// Every session the managed endpoint was asked to dial.
const sessions: any[] = []

vi.mock('../iroh', async () => {
  const real = await vi.importActual<typeof import('../iroh')>('../iroh')
  const endpoint = () => ({ ...ble.endpoint, endpointId: () => 'me', secretKey: () => new Uint8Array(32), connect, close: async () => {} }) as any
  return {
    ...real,
    browserEndpoint: vi.fn(async () => endpoint()),
    managedEndpointFactory: () => Promise.resolve({
      async openRelay (session: { printerId: string }) {
        sessions.push(session)
        return new real.IrohPrinter(await real.dialPrinter(endpoint(), session.printerId))
      },
      close () {}
    })
  }
})

const printer = (online: boolean) => ({
  id: EID, name: 'Boxwood', model: 'M1', version: '1', linked_at: 1, last_seen: online ? Date.now() / 1000 : 1, online, online_since: null
}) as any

const unreachable = () => new Response(JSON.stringify({ error: 'device_unreachable' }), { status: 503 })
const granted = () => new Response(JSON.stringify({
  grant_id: 'g1', printer_id: EID, relay_url: 'https://relay.example.test', expires_at: Math.floor(Date.now() / 1000) + 600
}), { status: 200 })

/** Stubs the console. `access` may answer late. */
function cloud (access: () => Response | Promise<Response>) {
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

const accessCalls = (calls: string[]) => calls.filter(c => c === `POST /v1/printers/${EID}/access`).length

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
    deletionState.deleteAfter = null
    sessions.length = 0
    ble.endpoint.addLink.mockClear()
    connect.mockClear()
  })
  afterEach(() => {
    vi.useRealTimers()
    stopUsingBluetoothFor(EID)
    deletionState.deleteAfter = null
    // Signing out in another tab: state.ts aborts every pending ask, and
    // empties its grants and open connections, whatever the test left.
    storeToken(null)
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    vi.unstubAllGlobals()
  })

  it('opens the Bluetooth link and reaches the printer, never saying it is offline', async () => {
    cloudState.printers = [printer(false)]
    cloud(unreachable)
    useBluetoothFor(EID, fakePrinter().device)

    const transport = await borrowCloudPrinter(EID)
    const response = await transport.fetch('/printer/info')

    expect(response.status).toBe(200)
    expect(ble.endpoint.addLink).toHaveBeenCalledTimes(1)
    expect(connect).toHaveBeenCalledWith(EID)
    expect(sessions[0].grantless).toBe(true)
  })

  it('takes the cloud grant for an online printer, and links Bluetooth as well', async () => {
    cloudState.printers = [printer(true)]
    const calls = cloud(granted)
    useBluetoothFor(EID, fakePrinter().device)

    const transport = await borrowCloudPrinter(EID)
    expect((await transport.fetch('/printer/info')).status).toBe(200)

    expect(accessCalls(calls)).toBe(1)
    expect(sessions[0].sessionId).toBe('g1')
    expect(sessions[0].grantless).toBeUndefined()
    expect(ble.endpoint.addLink).toHaveBeenCalledTimes(1)
  })

  it('waits longer than 4 s for the grant of a printer the service calls online', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    cloudState.printers = [printer(true)]
    cloud(() => new Promise(resolve => setTimeout(() => resolve(granted()), 6_000)))
    useBluetoothFor(EID, fakePrinter().device)

    const opening = borrowCloudPrinter(EID)
    await vi.advanceTimersByTimeAsync(7_000)
    const transport = await opening
    expect((await transport.fetch('/printer/info')).status).toBe(200)

    expect(sessions[0].sessionId).toBe('g1')
  }, 15_000)

  it('gives up on a printer the service calls online but keeps refusing, and stops asking', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    cloudState.printers = [printer(true)]
    const calls = cloud(unreachable)
    useBluetoothFor(EID, fakePrinter().device)

    const opening = borrowCloudPrinter(EID)
    await vi.advanceTimersByTimeAsync(21_000)
    const transport = await opening
    expect((await transport.fetch('/printer/info')).status).toBe(200)
    expect(sessions[0].grantless).toBe(true)

    // The retry loop was aborted with the wait: no more asks, long after.
    const asked = accessCalls(calls)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(accessCalls(calls)).toBe(asked)
  }, 20_000)

  it('does not go on without a grant when the console refuses the account (403)', async () => {
    cloudState.printers = [printer(true)]
    cloud(() => new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 }))
    useBluetoothFor(EID, fakePrinter().device)

    const error = await borrowCloudPrinter(EID).catch(e => e)

    expect(error).toBeInstanceOf(CloudError)
    expect(error.status).toBe(403)
    expect(ble.endpoint.addLink).not.toHaveBeenCalled()
  })

  it('does not go on without a grant when the console says it knows no such printer (404)', async () => {
    // Presence "offline" is a 503 of its own, so the list calls it online.
    cloudState.printers = [printer(true)]
    cloud(() => new Response(JSON.stringify({ error: 'not_found' }), { status: 404 }))
    useBluetoothFor(EID, fakePrinter().device)

    const error = await borrowCloudPrinter(EID).catch(e => e)

    expect(error).toBeInstanceOf(CloudError)
    expect(error.status).toBe(404)
    expect(ble.endpoint.addLink).not.toHaveBeenCalled()
  })

  it('stays blocked while the account is waiting to be deleted', async () => {
    cloudState.printers = [printer(false)]
    const calls = cloud(unreachable)
    deletionState.deleteAfter = 1800000000
    useBluetoothFor(EID, fakePrinter().device)

    const error = await borrowCloudPrinter(EID).catch(e => e)

    expect(error).toBeInstanceOf(CloudError)
    expect(error.deletionPending).toBe(true)
    expect(accessCalls(calls)).toBe(0)
    expect(ble.endpoint.addLink).not.toHaveBeenCalled()
  })

  it('leaves the relay route alone: no Bluetooth asked for, an offline printer is still offline', async () => {
    cloudState.printers = [printer(false)]
    cloud(unreachable)
    await expect(borrowCloudPrinter(EID)).rejects.toThrow('Printer is offline')
    expect(ble.endpoint.addLink).not.toHaveBeenCalled()
  })
})
