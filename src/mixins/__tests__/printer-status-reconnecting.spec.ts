import { afterEach, describe, expect, it } from 'vitest'
import PrinterStatusMixin from '../printer-status'
import AppPageTitle from '@/components/layout/AppPageTitle.vue'
import { startup } from '@/services/startup/heard'
import { hostPower } from '@/services/system/restart'

const computed = (PrinterStatusMixin as unknown as { options: { computed: Record<string, { get: (this: unknown) => unknown }> } }).options.computed
const heard = startup.heard
const offAt = hostPower.offAt
const header = (AppPageTitle as unknown as { options: { computed: Record<string, { get: (this: unknown) => unknown }> } }).options.computed

afterEach(() => {
  startup.heard = heard
  hostPower.offAt = offAt
})

describe('printer status while the websocket reconnects', () => {
  it('says Reconnecting with a warning tone after a previous answer', () => {
    startup.heard = true
    const context = { socketConnected: false, socketConnecting: true }
    expect(computed.statusText.get.call(context)).toBe('Reconnecting…')
    expect(computed.statusTone.get.call(context)).toBe('warn')
  })

  it('keeps Offline for a previously heard printer that is not being connected', () => {
    startup.heard = true
    const context = { socketConnected: false, socketConnecting: false }
    expect(computed.statusText.get.call(context)).toBe('Offline')
    expect(computed.statusTone.get.call(context)).toBe('off')
  })

  it('keeps an unanswered printer Connecting rather than Offline', () => {
    startup.heard = false
    expect(computed.statusText.get.call({ socketConnected: false, socketConnecting: false })).toBe('Connecting…')
    expect(computed.statusText.get.call({ socketConnected: false, socketConnecting: true })).toBe('Connecting…')
  })

  it('preserves live status and Klipper failures', () => {
    expect(computed.statusText.get.call({ socketConnected: true, klippyReady: false, klippyState: 'shutdown' })).toBe('Klipper shutdown')
    expect(computed.statusText.get.call({ socketConnected: true, klippyReady: true, printerState: 'printing', printerPrinting: true, printProgress: 42 })).toBe('Printing · 42%')
    expect(computed.statusTone.get.call({ socketConnected: true, klippyReady: true, printerState: 'paused' })).toBe('warn')
  })

  it('uses the shared disconnected status in the page header, except for an intentional shutdown', () => {
    hostPower.offAt = null
    const context = { socketConnected: false, statusText: 'Reconnecting…' }
    expect(header.pillText.get.call(context)).toBe('Reconnecting…')
    hostPower.offAt = Date.now()
    expect(header.pillText.get.call(context)).toBe('Off')
  })
})
