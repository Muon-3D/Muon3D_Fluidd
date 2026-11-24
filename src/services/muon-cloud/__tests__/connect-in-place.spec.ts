/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-5459: Control connects to a printer on this network in place, over its secure name, from the hosted page.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const activate = vi.hoisted(() => ({ local: vi.fn(), cloud: vi.fn() }))
vi.mock('../activate', () => ({ activateLocalPrinter: activate.local, activateCloudPrinter: activate.cloud, activationState: { pairing: null as string | null } }))

const ble = vi.hoisted(() => ({
  permitted: vi.fn(),
  use: vi.fn(),
  release: vi.fn(),
  reconnect: vi.fn(),
  stop: vi.fn(),
  pair: vi.fn(),
  retry: vi.fn(),
  heard: [] as unknown[]
}))
vi.mock('@/services/muon-ble/nearby', () => ({
  isPrinter: (p: { endpointId: string }, id: string) => p.endpointId === id,
  nearbyState: { get printers () { return ble.heard } },
  permittedPrinterFor: ble.permitted
}))
vi.mock('@/services/muon-ble/link', () => ({
  useBluetoothFor: ble.use, releaseBluetoothLink: ble.release, reconnectBluetooth: ble.reconnect, stopUsingBluetoothFor: ble.stop
}))
vi.mock('@/services/muon-ble/pairing', () => ({ startPairing: ble.pair }))
vi.mock('@/services/muon-ble/retry', () => ({ retryBluetooth: ble.retry }))

const { connectInPlace, openOnNetwork, probeSecureApi, secureInstance, openMuonLocal, setLeave, MUON_LOCAL_URL, LOCAL_ACCESS_BLOCKED } =
  await import('../connect-in-place')
const { cloudState } = await import('../state')
const { discoveryState } = await import('../discovery')

const NAME = 'abcdefghijklmnopqrst.muonlan.net'

const answers = () => vi.fn(async () => new Response('{"result":{}}', { status: 200 }))
const refuses = () => vi.fn(async () => { throw new TypeError('Failed to fetch') })
const permission = (state: string) => vi.stubGlobal('navigator', { permissions: { query: async () => ({ state }) } })

beforeEach(() => {
  vi.unstubAllGlobals()
  activate.local.mockReset().mockResolvedValue(true)
  activate.cloud.mockReset().mockResolvedValue(true)
  cloudState.printers = []
  sessionStorage.clear()
  ble.heard = []
  ble.permitted.mockReset().mockResolvedValue(null)
  for (const k of ['use', 'release', 'reconnect', 'stop', 'pair', 'retry'] as const) ble[k].mockReset().mockResolvedValue(undefined)
})

describe('the instance', () => {
  it('is wss://<name>/websocket and https://<name>, only for a name in our zone', () => {
    expect(secureInstance(NAME, 'Sloe', 'p1')).toMatchObject({ apiUrl: `https://${NAME}`, socketUrl: `wss://${NAME}/websocket`, name: 'Sloe' })
    expect(secureInstance('abcdefghijklmnopqrst.example.com', 'x')).toBeNull()
    expect(secureInstance(`${NAME}.evil.com`, 'x')).toBeNull()
    expect(secureInstance('muon-sloe-b26d.local', 'x')).toBeNull()
  })
})

describe('connecting in place', () => {
  it('a name that answers connects in place: the socket is wss://<name>/websocket and the address does not change', async () => {
    vi.stubGlobal('fetch', answers())
    const before = window.location.href
    expect(await connectInPlace({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ ok: true })
    expect(activate.local).toHaveBeenCalledWith(expect.objectContaining({ apiUrl: `https://${NAME}`, socketUrl: `wss://${NAME}/websocket` }), 'p1')
    expect(window.location.href).toBe(before)
  })

  it('the probe sends no credentials, no token and no headers, and refuses redirects', async () => {
    const f = answers()
    vi.stubGlobal('fetch', f)
    expect(await probeSecureApi(NAME)).toBe('reached')
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`https://${NAME}/server/info`)
    expect(init.credentials).toBe('omit')
    expect(init.redirect).toBe('error')
    expect(init.headers).toBeUndefined()
  })

  it('never dials a name outside the zone', async () => {
    const f = answers()
    vi.stubGlobal('fetch', f)
    expect(await connectInPlace({ name: 'abcdefghijklmnopqrst.example.com', label: 'x' })).toEqual({ ok: false, why: 'bad-name' })
    expect(await probeSecureApi('evil.example.com')).toBe('unreachable')
    expect(f).not.toHaveBeenCalled()
    expect(activate.local).not.toHaveBeenCalled()
  })

  it('a probe that fails opens nothing', async () => {
    vi.stubGlobal('fetch', refuses())
    expect(await connectInPlace({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ ok: false, why: 'unreachable' })
    expect(activate.local).not.toHaveBeenCalled()
  })

  it('a refused local-network permission is told apart from an unreachable printer', async () => {
    vi.stubGlobal('fetch', refuses())
    permission('denied')
    expect(await probeSecureApi(NAME)).toBe('blocked')
    expect(LOCAL_ACCESS_BLOCKED).toMatch(/blocked access to printers on your network/)
  })
})

describe('opening from a scan result or the sign-in list (Auto)', () => {
  it('connects in place first', async () => {
    vi.stubGlobal('fetch', answers())
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: true, line: null, ask: false })
    expect(activate.cloud).not.toHaveBeenCalled()
  })

  it('then Muon3D when the account holds it online', async () => {
    vi.stubGlobal('fetch', refuses())
    cloudState.printers = [{ id: 'p1', online: true } as never]
    const r = await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })
    expect(r).toMatchObject({ opened: true, ask: false })
    expect(activate.cloud).toHaveBeenCalledWith('p1')
  })

  it('then asks about muon3d.local, and says the permission line when it was refused', async () => {
    vi.stubGlobal('fetch', refuses())
    permission('denied')
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: false, line: LOCAL_ACCESS_BLOCKED, ask: true })
  })

  it('a printer beside this browser whose name does not resolve: the router blocks it (KAN-6283), and the question stays', async () => {
    vi.stubGlobal('fetch', refuses())
    permission('granted')
    discoveryState.cloud = [{ printerId: 'p1', name: 'Sloe', model: 'M1', linked: true, localAddrs: ['192.168.137.178'] }]
    discoveryState.cloudChecked = true
    const r = await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })
    expect(r.line).toMatch(/^Your network's router is blocking the printer's secure address \(DNS rebinding protection\)\. To fix it, allow muonlan\.net/)
    expect(r.ask).toBe(true)
    discoveryState.cloud = []
  })

  it('a printer the service does not put on this network: says so, with no muon3d.local question', async () => {
    vi.stubGlobal('fetch', refuses())
    permission('granted')
    discoveryState.cloud = []
    discoveryState.cloudChecked = true
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: false, line: "This printer isn't on your network.", ask: false })
    discoveryState.cloudChecked = false
  })
})

describe('Bluetooth between the relay and the question (KAN-5715)', () => {
  const heard = { device: { id: 'd1' }, endpointId: 'p1', display: 'Sloe', localName: 'sloe', heardAt: Date.now() }

  it('this network failing and Muon3D failing, a printer detected nearby opens over Bluetooth, with no question', async () => {
    vi.stubGlobal('fetch', refuses())
    cloudState.printers = [{ id: 'p1', online: true } as never]
    activate.cloud.mockRejectedValueOnce(new Error('relay down')).mockResolvedValue(true)
    ble.heard = [heard]
    const r = await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })
    expect(r).toEqual({ opened: true, line: null, ask: false })
    expect(ble.use).toHaveBeenCalledWith('p1', heard.device)
    expect(activate.cloud).toHaveBeenCalledTimes(2)
  })

  it('a device this browser may already use counts as detected', async () => {
    vi.stubGlobal('fetch', refuses())
    ble.permitted.mockResolvedValue(heard)
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: true, line: null, ask: false })
  })

  it('signed out (no relay): this network, then Bluetooth, then the question', async () => {
    vi.stubGlobal('fetch', refuses())
    ble.heard = [heard]
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toMatchObject({ opened: true, ask: false })
    expect(activate.cloud).toHaveBeenCalledTimes(1)
  })

  it('not detected nearby: asks, as before, and the chooser is never opened', async () => {
    vi.stubGlobal('fetch', refuses())
    ble.heard = [{ ...heard, heardAt: Date.now() - 60_000 }]
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: false, line: null, ask: true })
    expect(ble.use).not.toHaveBeenCalled()
    expect(activate.cloud).not.toHaveBeenCalled()
  })

  it('Bluetooth failing leaves no held route and falls to the question', async () => {
    vi.stubGlobal('fetch', refuses())
    ble.heard = [heard]
    activate.cloud.mockRejectedValue(new Error('no link'))
    expect(await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })).toEqual({ opened: false, line: null, ask: true })
    expect(ble.stop).toHaveBeenCalledWith('p1')
  })

  it('this network answering never tries Bluetooth', async () => {
    vi.stubGlobal('fetch', answers())
    ble.heard = [heard]
    await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })
    expect(ble.permitted).not.toHaveBeenCalled()
    expect(ble.use).not.toHaveBeenCalled()
  })

  it('never navigates to the printer', async () => {
    vi.stubGlobal('fetch', refuses())
    ble.heard = [heard]
    const before = window.location.href
    await openOnNetwork({ name: NAME, label: 'Sloe', printerId: 'p1' })
    expect(window.location.href).toBe(before)
  })
})

describe('muon3d.local', () => {
  it('is the only address the tab is sent to, and only when asked for', () => {
    const go = vi.fn()
    setLeave(go)
    expect(go).not.toHaveBeenCalled()
    openMuonLocal()
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(MUON_LOCAL_URL)
    expect(MUON_LOCAL_URL).toBe('http://muon3d.local/')
  })
})
