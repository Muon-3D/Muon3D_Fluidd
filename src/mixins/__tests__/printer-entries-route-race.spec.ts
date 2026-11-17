import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import { activateCloudPrinter, activateLocalPrinter } from '@/services/muon-cloud/activate'
import { chooseRouteMode, routeMode } from '@/services/muon-cloud/route-choice'
import { stopUsingBluetoothFor, useBluetoothFor, wantsBluetoothFor } from '@/services/muon-ble/link'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

vi.mock('@/services/muon-cloud/activate', async original => ({
  ...await original<typeof import('@/services/muon-cloud/activate')>(),
  activateLocalPrinter: vi.fn(),
  activateCloudPrinter: vi.fn(async () => {})
}))
vi.mock('@/services/muon-cloud/state', async original => ({
  ...await original<typeof import('@/services/muon-cloud/state')>(),
  dropCloudConnection: vi.fn()
}))

type Fn = (this: unknown, ...args: any[]) => any
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods
const id = 'walnut'
const entry = { key: `cloud:${id}`, endpointId: id, cloud: { id, online: true } } as DirectoryEntry
const device = { addEventListener () {}, removeEventListener () {} } as any
const component = () => ({
  busyKey: null,
  afterOpen: vi.fn(),
  run: methods.run,
  localInstance: () => ({ name: 'Walnut', apiUrl: 'http://walnut.local', socketUrl: 'ws://walnut.local/websocket' })
})

beforeEach(() => {
  vi.clearAllMocks()
  stopUsingBluetoothFor(id)
  chooseRouteMode(id, 'auto')
})

describe('an automatic LAN open finishing after a new route choice', () => {
  it.each(['auto', 'ble'] as const)('keeps Bluetooth during the LAN probe and respects a later %s choice', async mode => {
    let finish!: (connected: boolean) => void
    vi.mocked(activateLocalPrinter).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    useBluetoothFor(id, device)
    const opening = methods.connectLocal.call(component(), entry, true)
    expect(wantsBluetoothFor(id)).toBe(true)
    chooseRouteMode(id, mode)
    finish(true)
    await opening
    expect(wantsBluetoothFor(id)).toBe(mode === 'ble')
  })
  it('ignores an automatic LAN move dispatched after Bluetooth was chosen', async () => {
    chooseRouteMode(id, 'ble')
    useBluetoothFor(id, device)
    await methods.connectLocal.call(component(), entry, true)
    expect(activateLocalPrinter).not.toHaveBeenCalled()
    expect(activateCloudPrinter).not.toHaveBeenCalled()
    expect(wantsBluetoothFor(id)).toBe(true)
  })
  it('ignores an automatic cloud move dispatched after Bluetooth was chosen', async () => {
    chooseRouteMode(id, 'ble')
    useBluetoothFor(id, device)
    await methods.connectCloud.call(component(), entry, 'relay', true)
    expect(activateCloudPrinter).not.toHaveBeenCalled()
    expect(wantsBluetoothFor(id)).toBe(true)
  })
  it.each(['ble', 'cloud', 'lan'] as const)('cannot fall through to Muon3D after %s was chosen', async mode => {
    let finish!: (connected: boolean) => void
    vi.mocked(activateLocalPrinter).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const opening = methods.connectLocal.call(component(), entry, true)
    chooseRouteMode(id, mode)
    if (mode === 'ble') useBluetoothFor(id, device)
    finish(false)
    await opening
    expect(activateCloudPrinter).not.toHaveBeenCalled()
    expect(routeMode(id)).toBe(mode)
    if (mode === 'ble') expect(wantsBluetoothFor(id)).toBe(true)
  })

  it('still falls through when LAN failed and the route remains Auto', async () => {
    vi.mocked(activateLocalPrinter).mockResolvedValueOnce(false)
    await methods.connectLocal.call(component(), entry, true)
    expect(activateCloudPrinter).toHaveBeenCalledOnce()
    expect(routeMode(id)).toBe('auto')
  })

  it('does not dial Muon3D when LAN succeeded', async () => {
    vi.mocked(activateLocalPrinter).mockResolvedValueOnce(true)
    await methods.connectLocal.call(component(), entry, true)
    expect(activateCloudPrinter).not.toHaveBeenCalled()
  })

  it('does not turn a thrown LAN error into a different route', async () => {
    vi.mocked(activateLocalPrinter).mockRejectedValueOnce(new Error('LAN refused'))
    await methods.connectLocal.call(component(), entry, true)
    expect(activateCloudPrinter).not.toHaveBeenCalled()
  })
})
