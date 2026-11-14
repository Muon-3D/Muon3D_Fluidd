/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-1913 x KAN-2529: the held route and Connect locally from the hosted page.
 * An automatic move records no choice and never opens a tab; a person's click does.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin, { setNavigate, setOpenTab } from '../printer-entries'
import { forgetSecureReach } from '@/services/secure-origin/hosted'
import { discoveryState } from '@/services/muon-cloud/discovery'
import { chooseRouteMode, routeMode } from '@/services/muon-cloud/route-choice'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: unknown[]) => unknown
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

const entry = (extra: Record<string, unknown> = {}): DirectoryEntry => ({
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
  cloud: { id: 'p1', online: true, secure_name: null },
  ...extra
} as unknown as DirectoryEntry)

const component = () => ({
  notice: null as string | null,
  $store: { state: { socket: { open: false, ready: false } } },
  afterOpen: vi.fn(),
  run: vi.fn(async (_k: string, work: () => Promise<boolean>) => { await work() }),
  localRouteFor: methods.localRouteFor,
  connectLocalFromHostedPage: methods.connectLocalFromHostedPage,
  localInstance: methods.localInstance,
  connectOverBluetooth: vi.fn(),
  connectCloud: vi.fn()
})

const tab = vi.fn(() => true)
beforeEach(() => {
  forgetSecureReach()
  sessionStorage.clear()
  chooseRouteMode('p1', 'auto')
  tab.mockReset().mockReturnValue(true)
  setNavigate(vi.fn())
  setOpenTab(tab)
  discoveryState.cloud = [{ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] }]
  discoveryState.cloudChecked = true
  vi.unstubAllGlobals()
})

describe('route hold on the hosted page', () => {
  it('an automatic connectLocal on https opens no tab and records no choice', async () => {
    await methods.connectLocal.call(component(), entry(), true)
    expect(tab).not.toHaveBeenCalled()
    expect(routeMode('p1')).toBe('auto')
  })

  it('an automatic connectLocal on https goes through Muon3D, not a blocked local dial', async () => {
    const c = component()
    await methods.connectLocal.call(c, entry({ host: '192.168.1.20' }), true)
    expect(c.connectCloud).toHaveBeenCalledTimes(1)
    expect(c.run).not.toHaveBeenCalled()
    expect(routeMode('p1')).toBe('auto')
  })

  it('an explicit Connect locally that opens a tab holds the local route', async () => {
    await methods.connectLocal.call(component(), entry())
    expect(tab).toHaveBeenCalledWith('http://192.168.1.20/')
    expect(routeMode('p1')).toBe('lan')
  })

  it('tapping a printer heard over Bluetooth is an automatic move: it records no choice', async () => {
    const device = { id: 'dev' }
    const nearby = { device, endpointId: 'p1', localName: 'Boxwood' }
    const c = component()
    await methods.openCloudEntry.call(c, entry({ health: 'nearby', nearby }))
    expect(c.connectOverBluetooth).toHaveBeenCalledWith(expect.anything(), nearby, true)
    // And an automatic Bluetooth open records nothing; a chosen one does.
    c.run = vi.fn()
    await methods.connectCloud.call(c, entry(), device, true)
    expect(routeMode('p1')).toBe('auto')
    await methods.connectCloud.call(c, entry(), device)
    expect(routeMode('p1')).toBe('ble')
  })
})
