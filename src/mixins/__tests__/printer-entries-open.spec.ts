import { describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

type Methods = {
  openCloudEntry: (this: unknown, e: DirectoryEntry) => unknown
}
const openCloudEntry = (PrinterEntriesMixin as unknown as { options: { methods: Methods } }).options.methods.openCloudEntry

const entry = (active: DirectoryEntry['active']): DirectoryEntry => ({
  key: 'cloud:f1f6',
  section: 'cloud',
  name: 'Boxwood · 367A',
  endpointId: 'f1f6',
  health: 'online',
  detail: '',
  host: null,
  active,
  linkedTo: 'mine',
  saved: [],
  cloud: { id: 'f1f6', online: true } as DirectoryEntry['cloud']
})

const component = (socket: { open: boolean, ready: boolean }) => ({
  $store: { state: { socket } },
  afterOpen: vi.fn(),
  connectCloud: vi.fn(),
  connectLocal: vi.fn()
})

describe('opening an account printer (KAN-1279)', () => {
  it('Auto prefers a LAN answer over an online cloud printer', () => {
    const c = component({ open: false, ready: false })
    const e = entry(null)
    e.lan = { host: '192.0.2.1' } as DirectoryEntry['lan']
    openCloudEntry.call(c, e)
    expect(c.connectLocal).toHaveBeenCalledOnce()
    expect(c.connectCloud).not.toHaveBeenCalled()
  })
  it('connects when the entry is marked active but its socket is not ready', () => {
    const c = component({ open: false, ready: false })
    openCloudEntry.call(c, entry('cloud'))
    expect(c.afterOpen).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('connects when the socket is open but has not had its first data', () => {
    const c = component({ open: true, ready: false })
    openCloudEntry.call(c, entry('cloud'))
    expect(c.connectCloud).toHaveBeenCalledOnce()
  })

  it('just goes to the printer when it is really connected', () => {
    const c = component({ open: true, ready: true })
    openCloudEntry.call(c, entry('cloud'))
    expect(c.afterOpen).toHaveBeenCalledOnce()
    expect(c.connectCloud).not.toHaveBeenCalled()
  })
})
