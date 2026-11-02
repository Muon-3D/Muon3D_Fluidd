import { mount, shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const service = vi.hoisted(() => ({
  pairingState: { phase: 'idle', printerId: null as string | null, comparison: '', message: null as string | null },
  startPairing: vi.fn(async () => {}),
  submitPairingCode: vi.fn(async () => {}),
  cancelPairing: vi.fn()
}))
vi.mock('@/services/muon-ble/pairing', () => service)
const source = vi.hoisted(() => ({
  cloudState: { ready: true, account: { id: 'account' }, printers: [{ id: 'boxwood', name: 'Boxwood', online: false, last_seen: 0 }], status: {} },
  activationState: { switching: null as string | null, error: null as string | null, fallbackUrl: null, pairing: null as string | null }
}))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: source.cloudState }))
vi.mock('@/services/muon-cloud/activate', () => ({ activationState: source.activationState }))
vi.mock('@/services/printer-pages', () => ({ resolveSlug: () => ({ kind: 'cloud', printerId: 'boxwood' }), printerPagesState: { missing: null }, openPrinterAt: vi.fn() }))

const { default: BluetoothPairDialog } = await import('../BluetoothPairDialog.vue')
const { default: PrinterOpening } = await import('@/components/muon-cloud/PrinterOpening.vue')

const slot = { template: '<div><slot /></div>' }
const stubs = { 'v-dialog': slot, 'v-card': slot, 'v-card-text': slot, 'v-card-actions': slot, 'v-icon': slot, 'v-spacer': slot, 'v-progress-circular': slot, 'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'app-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'v-text-field': { props: ['value'], template: '<input :value="value" @input="$emit(\'input\', $event.target.value)">' } }

afterEach(() => {
  service.pairingState.phase = 'idle'
  service.pairingState.message = null
  source.activationState.pairing = null
  source.activationState.error = null
  vi.clearAllMocks()
})

describe('the pairing dialog (KAN-1253)', () => {
  it('tells the person to open Add a device on the printer, shows the six symbols and takes the eight digits', async () => {
    service.pairingState.phase = 'code'
    service.pairingState.comparison = 'F6Q TDH'
    const wrapper = mount(BluetoothPairDialog, { stubs })

    expect(wrapper.text()).toContain('Settings > Add a device')
    expect(wrapper.text()).toContain('Control')
    expect(wrapper.find('[data-tid="pair-sas"]').text().replace(/\s/g, '')).toBe('F6QTDH')

    await wrapper.find('[data-tid="pair-code"] input, input[data-tid="pair-code"]').setValue('1234 5678')
    await wrapper.find('[data-tid="pair-submit"]').trigger('click')
    expect(service.submitPairingCode).toHaveBeenCalledWith('1234 5678')
  })

  it('can be cancelled at every step', async () => {
    for (const phase of ['connecting', 'code', 'waiting']) {
      service.pairingState.phase = phase
      const wrapper = mount(BluetoothPairDialog, { stubs })
      await wrapper.find('[data-tid="pair-cancel"]').trigger('click')
      wrapper.destroy()
    }
    expect(service.cancelPairing).toHaveBeenCalledTimes(3)
  })

  it('shows the plain-words reason when pairing failed', () => {
    service.pairingState.phase = 'error'
    service.pairingState.message = 'No pairing window is open on the printer.'
    const wrapper = mount(BluetoothPairDialog, { stubs })
    expect(wrapper.find('[data-tid="pair-message"]').text()).toContain('No pairing window is open')
  })
})

describe('the offer on a printer that refused this browser (KAN-1253)', () => {
  const options = { propsData: { slug: 'boxwood' }, stubs: { 'v-icon': slot, 'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'v-progress-circular': slot } }

  it('shows "Pair this browser" and starts pairing for that printer', async () => {
    source.activationState.error = 'Control is not paired with this printer yet.'
    source.activationState.pairing = 'boxwood'
    const wrapper = shallowMount(PrinterOpening, options)
    await wrapper.find('[data-tid="pair-offer"]').trigger('click')
    expect(wrapper.find('[data-tid="pair-offer"]').text()).toBe('Pair this browser')
    expect(service.startPairing).toHaveBeenCalledWith('boxwood')
  })

  it('shows no offer for an ordinary error', () => {
    source.activationState.error = 'Forbidden'
    const wrapper = shallowMount(PrinterOpening, options)
    expect(wrapper.find('[data-tid="pair-offer"]').exists()).toBe(false)
  })
})
