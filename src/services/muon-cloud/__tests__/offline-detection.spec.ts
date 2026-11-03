import Vue from 'vue'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, storeToken, type CloudPrinter } from '../api'
import * as state from '../state'

const fake = vi.hoisted(() => ({
  down: false,
  dials: 0,
  closes: 0,
  sockets: [] as any[],
  grantTimes: [] as number[],
  fetchPause: null as Promise<void> | null
}))

vi.mock('../iroh', async () => {
  const actual = await vi.importActual<typeof import('../iroh')>('../iroh')
  const endpoint = {
    endpointId: () => 'browser',
    async connect () {
      fake.dials++
      if (fake.down) throw new Error('connection lost')
      let closed = false
      return {
        printerId: () => 'boxwood',
        async fetch () {
          if (fake.down || closed) throw new Error('connection lost')
          if (fake.fetchPause) await fake.fetchPause
          return {
            status: 200,
            headers: [],
            body: new TextEncoder().encode(JSON.stringify({
              result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'printing', filename: 'part.gcode' }, virtual_sdcard: { progress: 0.42 } } }
            }))
          }
        },
        async openWebSocket () { throw new Error('use the endpoint socket fake') },
        close () { closed = true; fake.closes++ }
      }
    }
  }
  return {
    ...actual,
    browserEndpoint: async () => endpoint,
    managedEndpointFactory: async () => ({
      async openRelay () {
        const printer = new actual.IrohPrinter(await endpoint.connect())
        return {
          fetch: (path: string, init?: RequestInit) => printer.fetch(path, init),
          async openWebSocket () {
            if (fake.down) throw new Error('connection lost')
            const listeners = new Map<string, Array<(event: any) => void>>()
            const socket = {
              readyState: 1,
              send () {},
              emit (name: string, event: any) { if (name === 'close') this.readyState = 3; for (const fn of listeners.get(name) ?? []) fn(event) },
              close () { this.emit('close', { code: 1000, reason: '', wasClean: true }) },
              addEventListener: (name: string, fn: any) => listeners.set(name, [...(listeners.get(name) ?? []), fn])
            }
            fake.sockets.push(socket)
            return socket
          },
          close: () => printer.close()
        }
      },
      close () {}
    })
  }
})
vi.mock('@/store', () => ({ default: { state: { config: { hostConfig: {} } } } }))
vi.mock('@/init', () => ({ appInit: vi.fn(async () => ({})) }))
// Adopted Iroh sockets do not ask Moonraker for a LAN one-shot token.
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: { accessOneshotTokenGet: async () => { throw new Error('Unexpected LAN token request') } } }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ bindHttpClientToPrinterTransport: () => () => {} }))
vi.mock('../centralLogin', async () => ({ ...await vi.importActual<any>('../centralLogin'), centralLoginEnabled: () => false }))

const printer: CloudPrinter = { id: 'boxwood', name: 'Boxwood', model: 'M1', version: '1', linked_at: 1, last_seen: 0, online: true, online_since: 1 }

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
  fake.down = false
  fake.dials = fake.closes = 0
  fake.sockets = []
  fake.grantTimes = []
  fake.fetchPause = null
  // Start with no printers so each test controls the first status poll.
  storeToken('test-session')
  vi.spyOn(cloudApi, 'me').mockResolvedValue({ account: { id: 'account', name: 'Jack', email: 'jack@example.test', created_at: 1 }, endpoint_id: null })
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'config').mockResolvedValue({ relay_url: 'https://relay.example.test', orchestrator_id: 'console', authority_key: 'authority' })
  vi.spyOn(cloudApi, 'registerEndpoint').mockResolvedValue({ endpoint_id: 'browser' })
  vi.spyOn(cloudApi, 'access').mockImplementation(async () => {
    fake.grantTimes.push(Date.now())
    if (fake.down) throw new CloudError('printer temporarily unavailable', 503)
    return { printer_id: 'boxwood', relay_url: 'https://relay.example.test', role: 'operator', grant_id: 'grant', expires_at: Date.now() / 1000 + 3600 }
  })
  await state.initCloud()
  state.cloudState.printers = [{ ...printer, last_seen: Date.now() / 1000 }]
  vi.mocked(cloudApi.printers).mockImplementation(async () => ({ printers: state.cloudState.printers }))
  ;(Vue as any).$socket = { releaseTransportSocket () {}, adoptTransportSocket () {} }
}, 60000)

afterEach(async () => {
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  await state.signOut()
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})

it('shows Offline within 10 seconds when the relay goes silent, and flips back when it answers (I-133)', async () => {
  await vi.advanceTimersByTimeAsync(3000)
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: true })
  // The relay is blocked: reads never answer and nothing closes.
  fake.fetchPause = new Promise<void>(() => {})
  await vi.advanceTimersByTimeAsync(10_000)
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: false, error: 'offline' })
  // The relay is back.
  fake.fetchPause = null
  await vi.advanceTimersByTimeAsync(9000)
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: true })
})

it('does not call one slow read Offline', async () => {
  await vi.advanceTimersByTimeAsync(3000)
  fake.fetchPause = new Promise<void>(resolve => setTimeout(resolve, 5000))
  await vi.advanceTimersByTimeAsync(5500)
  expect(state.cloudState.status.boxwood.error).not.toBe('offline')
})
