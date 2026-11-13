/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2529: Connect locally from the hosted page.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin, { setNavigate, setOpenTab } from '../printer-entries'
import { chooseRelay, forgetSecureReach, relayChosen } from '@/services/secure-origin/hosted'
import * as link from '@/services/muon-ble/link'
import { discoveryState } from '@/services/muon-cloud/discovery'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.lan.muon3d.com'
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
const tab = vi.fn(() => true)
beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  nav.mockReset()
  tab.mockReset().mockReturnValue(true)
  setNavigate(nav)
  setOpenTab(tab)
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
    expect(tab).not.toHaveBeenCalled()
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
    expect(tab).toHaveBeenCalledWith('http://192.168.1.20/')
  })

  it('with only the service\'s addresses: enabled, and opens http://<addr>/ in a new tab (not the hotspot)', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['10.42.0.1', '192.168.1.20'] }]
    const c = component()
    const e = entry(null)
    expect(action(c, e)).toMatchObject({ disabled: false, hint: "Opens the printer's own page in a new tab" })
    await methods.connectLocal.call(c, e)
    expect(tab).toHaveBeenCalledWith('http://192.168.1.20/')
    expect(nav).not.toHaveBeenCalled()
  })

  it('the new-tab path leaves this page route alone: no Bluetooth drop, no held choice cleared', async () => {
    const stop = vi.spyOn(link, 'stopUsingBluetoothFor')
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    chooseRelay('p1')
    await methods.connectLocal.call(component(), entry(null))
    expect(tab).toHaveBeenCalled()
    expect(stop).not.toHaveBeenCalled()
    expect(relayChosen('p1')).toBe(true)
    stop.mockRestore()
  })

  it('a blocked popup shows the address as a link and does not say it opened', async () => {
    tab.mockReturnValue(false)
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
    const c = component() as ReturnType<typeof component> & { noticeLink: string | null }
    await methods.connectLocal.call(c, entry(null))
    expect(c.notice).not.toMatch(/^Opened/)
    expect(c.notice).toMatch(/blocked the new tab/)
    expect(c.noticeLink).toBe('http://192.168.1.20/')
  })

  it('a bad address from the console is never opened', async () => {
    discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['evil.example', 'a@evil'] }]
    await methods.connectLocal.call(component(), entry(null))
    expect(tab).not.toHaveBeenCalled()
  })

  it('a busy row keeps "Still opening" instead of the unreachable notice', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const c = { ...component(), busyKey: 'cloud:other' }
    c.run = vi.fn(async (_k: string, _w: () => Promise<boolean>) => { c.notice = 'Still opening a printer. Give it a moment.' })
    await methods.connectLocal.call(c, entry(NAME))
    expect(c.notice).toMatch(/^Still opening/)
  })

  it('a Nearby tile opens over Bluetooth, not through the relay', async () => {
    const c = { ...component(), connectOverBluetooth: vi.fn() }
    const e = { ...entry(null), health: 'nearby', nearby: { device: {} } } as unknown as DirectoryEntry
    await methods.openCloudEntry.call(c, e)
    expect(c.connectOverBluetooth).toHaveBeenCalledWith(e, e.nearby)
    expect(c.connectCloud).not.toHaveBeenCalled()
  })

  it('with neither: greyed out with an honest reason', () => {
    const c = component()
    expect(action(c, entry(null))).toMatchObject({ disabled: true, hint: 'Not found on this network' })
    discoveryState.cloudChecked = false
    expect(action(c, entry(null))).toMatchObject({ disabled: true, hint: "This browser can't reach it from this page" })
  })
})
