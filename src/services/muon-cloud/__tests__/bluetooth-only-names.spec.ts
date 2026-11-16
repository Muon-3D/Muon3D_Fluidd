import { beforeEach, describe, expect, it, vi } from 'vitest'

// Printers opened over Bluetooth that no account holds: the name that gives the
// page its address has to outlive a reload (KAN-2123).
describe('names of printers opened over Bluetooth that no account holds', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('are still known after the page is reloaded', async () => {
    const first = await import('../state')
    first.rememberBluetoothOnly('cafe'.repeat(16), 'sloe-5522')
    expect(first.printerName('cafe'.repeat(16))).toBe('sloe-5522')

    vi.resetModules()
    const reloaded = await import('../state')
    expect(reloaded.reachablePrinters()).toEqual([{ id: 'cafe'.repeat(16), name: 'sloe-5522' }])
    expect(reloaded.printerName('cafe'.repeat(16))).toBe('sloe-5522')
  })

  it('keep nothing but ids and names, and ignore storage that is not that', async () => {
    const first = await import('../state')
    first.rememberBluetoothOnly('beef'.repeat(16), 'walnut-8987')
    expect(JSON.parse(localStorage.getItem('muon.ble.printer-names')!)).toEqual({ ['beef'.repeat(16)]: 'walnut-8987' })

    localStorage.setItem('muon.ble.printer-names', '[1,"x"')
    vi.resetModules()
    const broken = await import('../state')
    expect(broken.reachablePrinters()).toEqual([])
  })
})
