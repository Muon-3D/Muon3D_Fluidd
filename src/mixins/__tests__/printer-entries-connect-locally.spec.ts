/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2529: Connect locally from the hosted page.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin, { setNavigate } from '../printer-entries'
import { forgetSecureReach } from '@/services/secure-origin/hosted'
import { discoveryState } from '@/services/muon-cloud/discovery'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.muonlan.net'
const MARKER = 'muon3d-secure-origin-1'

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
  $store: { state: { socket: { open: false, ready: false } } },
  afterOpen: vi.fn(),
  run: vi.fn(async (_k: string, work: () => Promise<boolean>) => { await work() }),
  localRouteFor: methods.localRouteFor,
  connectLocalFromHostedPage: methods.connectLocalFromHostedPage,
  connectCloud: vi.fn()
})

const action = (c: ReturnType<typeof component>, e: DirectoryEntry) =>
  (methods.cloudActions.call(c, e) as Array<{ id: string, disabled?: boolean, hint?: string }>).find(a => a.id === 'connect-local')!

const nav = vi.fn()
beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  nav.mockReset()
  setNavigate(nav)
  discoveryState.cloud = []
  discoveryState.cloudChecked = true
  vi.unstubAllGlobals()
})

describe('Connect locally on the hosted page (KAN-2529)', () => {
  it('with a secure name: enabled, probes it, then opens it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => MARKER })))
    const c = component()
    const e = entry(NAME)
    expect(action(c, e)).toMatchObject({ disabled: false, hint: 'Opens its secure address' })
    await methods.connectLocal.call(c, e)
    expect(nav).toHaveBeenCalledWith(`https://${NAME}/`)
  })

  it('with a secure name that does not answer: falls to the service address, else says why', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(nav).not.toHaveBeenCalled()
    expect(c.notice).toMatch(/Couldn't reach Boxwood at its secure address/)
    expect(c.connectCloud).not.toHaveBeenCalled()
    forgetSecureReach()
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    await methods.connectLocal.call(c, entry(NAME))
    expect(nav).toHaveBeenCalledWith('http://192.168.1.20/')
  })

  it('with only the service\'s addresses: enabled, and navigates THIS tab to http://<addr>/ (not the hotspot), with no popup', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['10.42.0.1', '192.168.1.20'] }]
    const c = component()
    const e = entry(null)
    expect(action(c, e)).toMatchObject({ disabled: false, hint: "Opens the printer's own page on your network, in this tab" })
    await methods.connectLocal.call(c, e)
    expect(nav).toHaveBeenCalledWith('http://192.168.1.20/')
  })

  it('opens the printer by its .local name in this tab when the name is known, never window.open', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    discoveryState.cloud = [{ printerId: 'p1', name: 'Sloe b26d', model: 'M1', linked: true, localAddrs: ['192.168.1.78'] }]
    const e = entry(null)
    e.name = 'Sloe b26d'
    e.cloud = { ...e.cloud, name: 'Sloe b26d' } as never
    await methods.connectLocal.call(component(), e)
    expect(nav).toHaveBeenCalledWith('http://muon-sloe-b26d.local/')
    expect(open).not.toHaveBeenCalled()
  })

  it('matches the printer id from the service without case, so a printer beside this browser is found (KAN-3581)', async () => {
    discoveryState.cloud = [{ printerId: 'P1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    await methods.connectLocal.call(component(), entry(null))
    expect(nav).toHaveBeenCalledWith('http://192.168.1.20/')
  })

  it('a bad address from the console is never opened', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['evil.example', 'a@evil'] }]
    await methods.connectLocal.call(component(), entry(null))
    expect(nav).not.toHaveBeenCalled()
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
    expect(action(c, entry(null))).toMatchObject({ disabled: true, hint: 'Not found on this network' })
    discoveryState.cloudChecked = false
    expect(action(c, entry(null))).toMatchObject({ disabled: true, hint: "This browser can't reach it from this page" })
  })
})
