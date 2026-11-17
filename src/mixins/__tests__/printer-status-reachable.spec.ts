import { describe, expect, it } from 'vitest'
import PrinterStatusMixin from '../printer-status'
import { startup } from '@/services/startup/heard'

const computed = (PrinterStatusMixin as unknown as { options: { computed: Record<string, { get: (this: unknown) => unknown }> } }).options.computed

describe('a disconnected socket is not the printer being offline', () => {
  it('says Connecting while another route can reach the printer', () => {
    startup.heard = true
    const context = { socketConnected: false, printerReachable: true }
    expect(computed.statusText.get.call(context)).toBe('Connecting…')
    expect(computed.statusTone.get.call(context)).toBe('warn')
  })

  it('says Offline only after a previous answer and no reachable route', () => {
    startup.heard = true
    const context = { socketConnected: false, printerReachable: false }
    expect(computed.statusText.get.call(context)).toBe('Offline')
    expect(computed.statusTone.get.call(context)).toBe('off')
    startup.heard = false
    expect(computed.statusText.get.call(context)).toBe('Connecting…')
  })

  it('preserves Klipper errors and live print status', () => {
    expect(computed.statusText.get.call({ socketConnected: true, klippyReady: false, klippyState: 'shutdown' })).toBe('Klipper shutdown')
    expect(computed.statusText.get.call({ socketConnected: true, klippyReady: true, printerState: 'printing', printerPrinting: true, printProgress: 42 })).toBe('Printing · 42%')
  })
})
