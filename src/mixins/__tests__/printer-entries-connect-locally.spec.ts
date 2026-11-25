/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2529: Connect locally from the hosted page.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import { connectInPlace } from '@/services/muon-cloud/connect-in-place'
import { forgetSecureReach } from '@/services/secure-origin/hosted'
import { discoveryState } from '@/services/muon-cloud/discovery'
import { bluetoothSupport } from '@/services/muon-ble/webBluetooth'
import { connectByAddress, LNA_PREPROMPT } from '@/services/muon-cloud/direct-address'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

vi.mock('@/services/muon-cloud/connect-in-place', async (orig) => ({ ...(await orig<object>()), connectInPlace: vi.fn() }))
const inPlace = vi.mocked(connectInPlace)
vi.mock('@/services/muon-cloud/direct-address', async (orig) => ({ ...(await orig<object>()), connectByAddress: vi.fn() }))
const direct = vi.mocked(connectByAddress)
vi.mock('@/services/muon-ble/webBluetooth', async (orig) => ({ ...(await orig<object>()), bluetoothSupport: vi.fn() }))
const bluetooth = vi.mocked(bluetoothSupport)
const withBluetooth = () => bluetooth.mockReturnValue({ supported: true })

const NAME = 'abcdefghijklmnopqrst.muonlan.net'

const entry = (secureName: string | null): DirectoryEntry => ({
  key: 'cloud:p1',
  section: 'cloud',
  name: 'Boxwood',
  endpointId: 'p1',
  health: 'online',
  detail: '',
  host: null,
  active: null,
  linkedTo: 'mine',
  saved: [],
  cloud: { id: 'p1', online: true, secure_name: secureName }
} as unknown as DirectoryEntry)

const component = () => ({
  notice: null as string | null,
  routeProblemEntry: null as unknown,
  askMuonLocal: false,
  accountDialog: false,
  routeProblemUrl: null as string | null,
  routeProblem: null as { line: string, detail?: string, choices: Array<{ id: string, label?: string }> } | null,
  failRoute: methods.failRoute,
  $store: { state: { socket: { open: false, ready: false } } },
  afterOpen: vi.fn(),
  run: vi.fn(async (_k: string, work: () => Promise<boolean>) => { await work() }),
  localRouteFor: methods.localRouteFor,
  connectLocalFromHostedPage: methods.connectLocalFromHostedPage,
  connectByAddressFor: methods.connectByAddressFor,
  connectCloud: vi.fn()
})

const action = (c: ReturnType<typeof component>, e: DirectoryEntry) =>
  (methods.cloudActions.call(c, e) as Array<{ id: string, disabled?: boolean, hint?: string }>).find(a => a.id === 'connect-local')!

const nav = vi.fn()
beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  nav.mockReset()
  inPlace.mockReset()
  inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
  bluetooth.mockReset()
  bluetooth.mockReturnValue({ supported: false, reason: 'unsupported' })
  direct.mockReset()
  direct.mockResolvedValue({ ok: false, why: 'unsupported' })
  discoveryState.cloud = []
  discoveryState.cloudChecked = true
  vi.unstubAllGlobals()
})

describe('Connect locally on the hosted page (KAN-2529, KAN-5459)', () => {
  it('with a secure name: enabled, and connects in place, with no change of address', async () => {
    inPlace.mockResolvedValue({ ok: true })
    const c = component()
    const e = entry(NAME)
    expect(action(c, e)).toMatchObject({ disabled: false, hint: 'Connects on your network, in this tab' })
    await methods.connectLocal.call(c, e)
    expect(inPlace).toHaveBeenCalledWith(expect.objectContaining({ name: NAME }))
    expect(nav).not.toHaveBeenCalled()
    expect(c.routeProblem).toBeNull()
  })

  it('picked, a secure name that does not answer for a printer the service does not put here: another network, no sign-in, no muon3d.local', async () => {
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(nav).not.toHaveBeenCalled()
    expect(c.routeProblem?.line).toBe("This printer isn't on your network.")
    expect(c.routeProblem?.choices.map(x => x.id)).toEqual(['cloud'])
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.accountDialog).toBe(false)
  })

  it('picked, a secure name that does not answer for a printer beside this browser: the router blocks the name (KAN-6283)', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(c.routeProblem?.line).toBe("Your network's router is blocking the printer's secure address (DNS rebinding protection).")
    expect(c.routeProblem?.detail).toMatch(/allow muonlan\.net in the router's DNS rebind exceptions/)
    // KAN-6283 (B): the printer's own page first; Bluetooth only where the browser has it.
    expect(c.routeProblem?.choices).toEqual([{ id: 'open-page', label: 'Open Boxwood on this network' }, { id: 'cloud', label: 'Over Muon3D' }])
    expect(c.routeProblemUrl).toBe('http://192.168.1.20/')
    expect(c.connectCloud).not.toHaveBeenCalled()
  })

  it('picked, the name blocked, in a browser with Web Bluetooth: Open on this network, then Connect over Bluetooth', async () => {
    withBluetooth()
    discoveryState.cloud = [{ printerId: 'p1', name: 'Sloe b26d', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(c.routeProblem?.choices.map(x => x.label)).toEqual(['Open Boxwood on this network', 'Connect over Bluetooth', 'Over Muon3D'])
    // the printer's own route, from its name
    expect(c.routeProblemUrl).toBe('http://192.168.1.20/sloe-b26d')
  })

  it('the name blocked: the printer address is tried in place, with the browser question explained first (KAN-6283)', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['8.8.8.8', '192.168.1.20'] }]
    direct.mockImplementation(async o => {
      o.onAsking?.()
      return { ok: true, host: '192.168.1.20' }
    })
    const c = component()
    expect(await methods.connectLocal.call(c, entry(NAME))).toBe(true)
    expect(direct).toHaveBeenCalledOnce()
    expect(direct.mock.calls[0][0]).toMatchObject({ printerId: 'p1', label: 'Boxwood' })
    // Only what the service listed is offered; the filter for private ranges is the service's own (direct-address.spec).
    expect(direct.mock.calls[0][0].addrs).toContain('192.168.1.20')
    expect(c.notice).toBeNull()
    expect(c.routeProblem).toBeNull()
    expect(c.connectCloud).not.toHaveBeenCalled()
  })

  it('the address attempt says what the browser is about to ask', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    let said: string | null = null
    const c = component()
    direct.mockImplementation(async o => {
      o.onAsking?.()
      said = c.notice
      return { ok: false, why: 'unreachable' }
    })
    await methods.connectLocal.call(c, entry(NAME))
    expect(said).toBe(LNA_PREPROMPT)
    expect(c.notice).toBeNull()
    expect(c.routeProblem?.choices[0].id).toBe('open-page')
  })

  it('the person refuses the address attempt: the permission line, and the printer page is still offered', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    direct.mockResolvedValue({ ok: false, why: 'blocked' })
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(c.routeProblem?.line).toMatch(/blocked access to printers on your network/)
    expect(c.routeProblem?.choices[0]).toMatchObject({ id: 'open-page' })
  })

  it('Auto, the name blocked and the address attempt succeeding: connected before Muon3D or Bluetooth are tried', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    direct.mockResolvedValue({ ok: true, host: '192.168.1.20' })
    const c = component()
    expect(await methods.connectLocal.call(c, entry(NAME), false, false)).toBe(true)
    expect(c.connectCloud).not.toHaveBeenCalled()
  })

  it('Auto, with the name blocked: says why, then goes on to Muon3D', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    const c = component()
    await methods.connectLocal.call(c, entry(NAME), false, false)
    expect(c.notice).toMatch(/DNS rebinding protection\)\. To fix it, allow muonlan\.net/)
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('Auto, on another network with Muon3D offline: its own line and no muon3d.local question', async () => {
    const c = component()
    const e = entry(NAME)
    ;(e.cloud as { online: boolean }).online = false
    await methods.connectLocal.call(c, e, false, false)
    expect(c.routeProblem?.line).toBe("This printer isn't on your network.")
    expect(c.askMuonLocal).toBe(false)
    expect(c.accountDialog).toBe(false)
  })

  it('picked, with the browser refusing local network access: the one plain line', async () => {
    inPlace.mockResolvedValue({ ok: false, why: 'blocked' })
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(c.routeProblem?.line).toBe(
      "Your browser blocked access to printers on your network. Allow 'local network access' for control.muon3d.com in the address bar, then try again."
    )
  })

  it('with only the addresses from the service (no secure name): not usable from this page, and never opens an address', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['10.42.0.1', '192.168.1.20'] }]
    const c = component()
    const e = entry(null)
    expect(action(c, e)).toMatchObject({ disabled: true })
    await methods.connectLocal.call(c, e)
    expect(nav).not.toHaveBeenCalled()
    expect(inPlace).not.toHaveBeenCalled()
  })

  it('no secure name from the service (a reset printer), on a Windows hotspot range: its address is tried in place (KAN-6743)', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: false, localAddrs: ['10.42.0.1', '192.168.137.178'] }]
    direct.mockResolvedValue({ ok: true, host: '192.168.137.178' })
    const c = component()
    expect(await methods.connectLocal.call(c, entry(null))).toBe(true)
    expect(inPlace).not.toHaveBeenCalled()
    expect(direct).toHaveBeenCalledOnce()
    expect(direct.mock.calls[0][0].addrs).toContain('192.168.137.178')
    expect(c.routeProblem).toBeNull()
  })

  it('a busy row keeps "Still opening" instead of the unreachable notice', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const c = { ...component(), busyKey: 'cloud:other' }
    c.run = vi.fn(async () => { c.notice = 'Still opening a printer. Give it a moment.' }) as unknown as typeof c.run
    await methods.connectLocal.call(c, entry(NAME))
    expect(c.notice).toMatch(/^Still opening/)
  })

  it('a Nearby tile opens over Bluetooth, not through the relay', async () => {
    const c = { ...component(), connectOverBluetooth: vi.fn() }
    const e = { ...entry(null), health: 'nearby', nearby: { device: {} } } as unknown as DirectoryEntry
    await methods.openCloudEntry.call(c, e)
    expect(c.connectOverBluetooth).toHaveBeenCalledWith(e, e.nearby, true)
    expect(c.connectCloud).not.toHaveBeenCalled()
  })

  it('with neither: greyed out with an honest reason', () => {
    const c = component()
    expect(action(c, entry(null))).toMatchObject({ disabled: true })
  })
})
