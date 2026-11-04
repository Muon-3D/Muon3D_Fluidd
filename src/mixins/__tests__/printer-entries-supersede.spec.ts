import { afterEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import * as cloudStateModule from '@/services/muon-cloud/state'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import { stopUsingBluetoothFor, wantsBluetoothFor } from '@/services/muon-ble/link'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

vi.mock('@/services/muon-cloud/activate', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/muon-cloud/activate')>(),
  activateCloudPrinter: vi.fn(async () => {})
}))
const activate = vi.mocked(activateCloudPrinter)
vi.spyOn(cloudStateModule, 'dropCloudConnection').mockImplementation(() => {})

type Methods = Record<'run' | 'connectCloud', (...args: any[]) => any>
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Methods } }).options.methods

const entry = { key: 'cloud:walnut', name: 'Walnut', cloud: { id: 'walnut', online: true } } as unknown as DirectoryEntry
const device = { addEventListener () {}, removeEventListener () {} } as any

afterEach(() => { stopUsingBluetoothFor('walnut'); activate.mockClear() })

describe('choosing Bluetooth while a cloud open is in flight (I-133)', () => {
  it('takes over: no busy guard, one dial, and the Bluetooth route is chosen', async () => {
    const c: any = { busyKey: 'cloud:walnut', notice: null, afterOpen: vi.fn() }
    c.run = methods.run
    await methods.connectCloud.call(c, entry, device)
    expect(c.notice).toBeNull()
    expect(activate).toHaveBeenCalledTimes(1)
    expect(wantsBluetoothFor('walnut')).toBe(true)
    expect(c.busyKey).toBeNull()
    expect(c.afterOpen).toHaveBeenCalledOnce()
  })

  it('a plain open of the same row is still refused while one is in flight', async () => {
    const c: any = { busyKey: 'cloud:walnut', notice: null, afterOpen: vi.fn() }
    c.run = methods.run
    await methods.connectCloud.call(c, entry)
    expect(activate).not.toHaveBeenCalled()
    expect(c.notice).toMatch(/Still opening/)
  })

  it('the earlier open finishing late does not clear the row of the one that took over', async () => {
    let finishCloud!: () => void
    activate.mockImplementationOnce(() => new Promise<void>(resolve => { finishCloud = resolve }))
    let finishBle!: () => void
    activate.mockImplementationOnce(() => new Promise<void>(resolve => { finishBle = resolve }))
    const c: any = { busyKey: null, notice: null, afterOpen: vi.fn(), $emit: vi.fn() }
    c.run = methods.run
    const first = methods.connectCloud.call(c, entry, 'relay')
    const second = methods.connectCloud.call(c, entry, device)
    finishCloud()
    await first
    expect(c.busyKey).toBe('cloud:walnut')
    finishBle()
    await second
    expect(c.busyKey).toBeNull()
  })
})
