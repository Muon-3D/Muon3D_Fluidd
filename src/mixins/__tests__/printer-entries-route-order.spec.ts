/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-5459 (Jack, 23 Nov): from control.muon3d.com, Auto tries this network, then Muon3D, then Bluetooth, then asks
 * about muon3d.local, all in the same tab. A route the person PICKED is held strictly: when it fails it says so and
 * offers the others as buttons; nothing switches by itself.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import { connectInPlace } from '@/services/muon-cloud/connect-in-place'
import { chooseRouteMode, routeMode } from '@/services/muon-cloud/route-choice'
import { forgetSecureReach } from '@/services/secure-origin/hosted'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

vi.mock('@/services/muon-cloud/connect-in-place', async (orig) => ({ ...(await orig<object>()), connectInPlace: vi.fn() }))
const inPlace = vi.mocked(connectInPlace)

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const NAME = 'abcdefghijklmnopqrst.muonlan.net'
const entry = (extra: Record<string, unknown> = {}): DirectoryEntry => ({
  key: 'cloud:p1',
  section: 'cloud',
  name: 'Sloe',
  endpointId: 'p1',
  health: 'online',
  detail: '',
  host: null,
  active: null,
  linkedTo: 'mine',
  saved: [],
  cloud: { id: 'p1', online: true, secure_name: NAME },
  ...extra
} as unknown as DirectoryEntry)

const component = (outcome: boolean | undefined = true, exec = true) => ({
  $store: { state: { socket: { open: false, ready: false } } },
  notice: null as string | null,
  askMuonLocal: false,
  routeProblem: null as { line: string, choices: Array<{ id: string }> } | null,
  routeProblemEntry: null as unknown,
  failRoute: methods.failRoute,
  afterOpen: vi.fn(),
  run: vi.fn(async (_k: string, work: () => Promise<boolean>) => { if (exec) await work(); return outcome }),
  connectCloud: vi.fn(async () => outcome),
  connectLocal: vi.fn(),
  connectOverBluetooth: vi.fn()
})

beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  chooseRouteMode('p1', 'auto')
  inPlace.mockReset()
})

describe('Auto order on the hosted page', () => {
  it('(a) this network first: connected in place, nothing else tried, no question', async () => {
    inPlace.mockResolvedValue({ ok: true })
    const c = component()
    expect(await methods.openCloudEntry.call(c, entry())).toBe(true)
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.askMuonLocal).toBe(false)
  })

  it('(b) then Muon3D, as a plain dial with no route named, so Bluetooth (c) follows by itself when it is heard', async () => {
    inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
    const c = component(true)
    await methods.openCloudEntry.call(c, entry())
    expect(inPlace).toHaveBeenCalledTimes(1)
    expect(c.connectCloud).toHaveBeenCalledTimes(1)
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything())
    expect(c.askMuonLocal).toBe(false)
  })

  it('(d) when none of them opens it, asks about muon3d.local and goes nowhere', async () => {
    inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
    const c = component(false)
    await methods.openCloudEntry.call(c, entry())
    expect(c.askMuonLocal).toBe(true)
  })

  it('a click that another open took over asks nothing', async () => {
    inPlace.mockResolvedValue({ ok: false, why: 'unreachable' })
    const c = component(undefined)
    await methods.openCloudEntry.call(c, entry())
    expect(c.askMuonLocal).toBe(false)
  })
})

describe('a picked route is held strictly', () => {
  it('picked Bluetooth that fails: still Bluetooth, told plainly, the others offered as buttons, no relay or LAN dial', async () => {
    const c = component(false, false)
    await methods.connectCloud.call(c, entry({ nearby: { device: {} } }), { id: 'dev' })
    expect(routeMode('p1')).toBe('ble')
    expect(c.routeProblem?.line).toBe("Couldn't connect over Bluetooth.")
    expect(c.routeProblem?.choices.map(x => x.id)).toEqual(['cloud', 'local', 'muon-local'])
    expect(inPlace).not.toHaveBeenCalled()
    expect(c.askMuonLocal).toBe(false)
  })

  it('picked Muon3D that fails: still Muon3D, told plainly, Bluetooth and this network offered', async () => {
    const c = component(false, false)
    await methods.connectCloud.call(c, entry(), 'relay')
    expect(routeMode('p1')).toBe('cloud')
    expect(c.routeProblem?.line).toBe("Couldn't connect over Muon3D.")
    expect(c.routeProblem?.choices.map(x => x.id)).toEqual(['bluetooth', 'local', 'muon-local'])
    expect(inPlace).not.toHaveBeenCalled()
  })

  it('a button is the person\'s choice: it picks that route', async () => {
    const c = { ...component(true), routeProblemEntry: entry(), routeProblem: { line: 'x', choices: [] }, connectCloud: vi.fn() }
    await methods.onProblemChoice.call(c, 'cloud')
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), 'relay')
    expect(c.routeProblem).toBeNull()
  })

  it('the muon3d.local button only asks; it does not leave', async () => {
    const c = { ...component(true), routeProblemEntry: entry(), routeProblem: { line: 'x', choices: [] } }
    await methods.onProblemChoice.call(c, 'muon-local')
    expect(c.askMuonLocal).toBe(true)
  })
})
