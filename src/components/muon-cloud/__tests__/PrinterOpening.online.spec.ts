import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuetify from 'vuetify'

import PrinterOpening from '../PrinterOpening.vue'
import { activationState } from '@/services/muon-cloud/activate'
import { cloudState } from '@/services/muon-cloud/state'

const openPrinterAt = vi.fn(() => Promise.resolve())
vi.mock('@/services/printer-pages', () => ({
  openPrinterAt: (...a: unknown[]) => openPrinterAt(...(a as [])),
  printerPagesState: { missing: null },
  resolveSlug: () => ({ kind: 'cloud', printerId: 'p1' })
}))
vi.mock('@/services/muon-ble/pairing', () => ({ startPairing: vi.fn() }))

Vue.use(Vuetify)
const localVue = createLocalVue()

const printer = (online: boolean) => ({ id: 'p1', name: 'Boxwood', model: 'M1', state: online ? 'ready' : 'offline', online, last_seen: 0 })

describe('PrinterOpening: the printer comes online (KAN-3783)', () => {
  beforeEach(() => {
    openPrinterAt.mockClear()
    cloudState.printers = [printer(false)] as never
    cloudState.status = {}
    activationState.switching = null
    activationState.pairing = null
    activationState.error = 'Printer is offline'
  })

  it('opens it again when the list says online, once', async () => {
    shallowMount(PrinterOpening, { localVue, vuetify: new Vuetify(), propsData: { slug: 'boxwood-367a' } })
    cloudState.printers = [printer(true)] as never
    await Vue.nextTick()
    await Vue.nextTick()
    expect(openPrinterAt).toHaveBeenCalledTimes(1)
  })

  it('does not retry while it stays offline, or when there is no error', async () => {
    shallowMount(PrinterOpening, { localVue, vuetify: new Vuetify(), propsData: { slug: 'boxwood-367a' } })
    cloudState.printers = [printer(false)] as never
    await Vue.nextTick()
    expect(openPrinterAt).not.toHaveBeenCalled()
    activationState.error = null
    cloudState.printers = [printer(true)] as never
    await Vue.nextTick()
    expect(openPrinterAt).not.toHaveBeenCalled()
  })
})
