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
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

vi.mock('@/services/muon-cloud/connect-in-place', async (orig) => ({ ...(await orig<object>()), connectInPlace: vi.fn() }))
const inPlace = vi.mocked(connectInPlace)

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
  routeProblem: null as { line: string, choices: Array<{ id: string }> } | null,
  routeProblemEntry: null as unknown,
  askMuonLocal: false,
  failRoute: methods.failRoute,
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
  inPlace.mockReset()
  inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
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

  it('picked, with a secure name that does not answer: stays local, says so, offers the other routes, tries none', async () => {
    const c = component()
    await methods.connectLocal.call(c, entry(NAME))
    expect(nav).not.toHaveBeenCalled()
    expect(c.routeProblem?.line).toBe("Couldn't connect locally.")
    expect(c.routeProblem?.choices.map(x => x.id)).toEqual(['cloud', 'bluetooth', 'muon-local'])
    expect(c.connectCloud).not.toHaveBeenCalled()
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
