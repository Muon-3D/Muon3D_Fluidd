import { mount, shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as service from '@/services/muon-ble/pairing'

// The state is reactive, as the real one is, so a step change re-renders.
vi.mock('@/services/muon-ble/pairing', async () => {
  const Vue = (await import('vue')).default
  return {
    pairingState: Vue.observable({ phase: 'idle', printerId: null as string | null, comparison: '', message: null as string | null }),
    startPairing: vi.fn(async () => {}),
    submitPairingCode: vi.fn(async () => {}),
    cancelPairing: vi.fn()
  }
})
const state = service.pairingState as { phase: string, printerId: string | null, comparison: string, message: string | null }

const source = vi.hoisted(() => ({
  cloudState: { ready: true, activePrinterId: null as string | null, account: { id: 'account' }, printers: [{ id: 'boxwood', name: 'Boxwood', online: false, last_seen: 0 }], status: {} },
  activationState: { switching: null as string | null, error: null as string | null, fallbackUrl: null, pairing: null as string | null }
}))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: source.cloudState, reachablePrinters: () => source.cloudState.printers }))
vi.mock('@/services/muon-cloud/activate', () => ({ activationState: source.activationState }))
vi.mock('@/services/printer-pages', () => ({ resolveSlug: () => ({ kind: 'cloud', printerId: 'boxwood' }), printerPagesState: { missing: null }, openPrinterAt: vi.fn(), printerHomePath: () => '/boxwood-367a' }))

const { default: BluetoothPairDialog } = await import('../BluetoothPairDialog.vue')
const { default: PrinterOpening } = await import('@/components/muon-cloud/PrinterOpening.vue')

const slot = { template: '<div><slot /></div>' }
const stubs = { 'v-dialog': slot, 'v-card': slot, 'v-card-text': slot, 'v-card-actions': slot, 'v-icon': slot, 'v-spacer': slot, 'v-progress-circular': slot, 'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'app-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, AppBtn: { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'v-text-field': { props: ['value'], template: '<input :value="value" @input="$emit(\'input\', $event.target.value)">' } }

afterEach(() => {
  state.phase = 'idle'
  state.message = null
  state.comparison = ''
  source.activationState.pairing = null
  source.activationState.error = null
  vi.clearAllMocks()
})

describe('the pairing dialog (KAN-1253)', () => {
  it('tells the person to open Add a device on the printer, shows the six symbols and takes the eight digits', async () => {
    state.phase = 'code'
    state.comparison = 'F6Q TDH'
    const wrapper = mount(BluetoothPairDialog, { stubs })

    expect(wrapper.text()).toContain('Settings > Add a device')
    expect(wrapper.text()).toContain('Control')
    expect(wrapper.find('[data-tid="pair-sas"]').text().replace(/\s/g, '')).toBe('F6QTDH')

    await wrapper.find('[data-tid="pair-code"] input, input[data-tid="pair-code"]').setValue('1234 5678')
    await wrapper.find('[data-tid="pair-submit"]').trigger('click')
    expect(service.submitPairingCode).toHaveBeenCalledWith('1234 5678')
  })

  it('goes to the printer once it is paired and open, signed in or not', async () => {
    state.phase = 'code'
    state.printerId = 'boxwood'
    source.cloudState.activePrinterId = null
    const push = vi.fn(async () => {})
    const wrapper = mount(BluetoothPairDialog, { stubs })
    // Whether or not another file in this worker installed the real router on Vue.
    Object.defineProperty(wrapper.vm, '$router', { configurable: true, value: { push } })
    ;(service.submitPairingCode as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      state.phase = 'idle'
      source.cloudState.activePrinterId = 'boxwood'
    })
    await wrapper.find('[data-tid="pair-code"] input, input[data-tid="pair-code"]').setValue('12345678')
    await wrapper.find('[data-tid="pair-submit"]').trigger('click')
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/boxwood-367a'))
    state.printerId = null
  })

  it('stays where it is when the code was wrong', async () => {
    state.phase = 'code'
    state.printerId = 'boxwood'
    const push = vi.fn(async () => {})
    const wrapper = mount(BluetoothPairDialog, { stubs })
    // Whether or not another file in this worker installed the real router on Vue.
    Object.defineProperty(wrapper.vm, '$router', { configurable: true, value: { push } })
    await wrapper.find('[data-tid="pair-code"] input, input[data-tid="pair-code"]').setValue('87654321')
    await wrapper.find('[data-tid="pair-submit"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(push).not.toHaveBeenCalled()
    state.printerId = null
  })

  it('can be cancelled at every step', async () => {
    for (const phase of ['connecting', 'code', 'waiting']) {
      state.phase = phase
      const wrapper = mount(BluetoothPairDialog, { stubs })
      await wrapper.find('[data-tid="pair-cancel"]').trigger('click')
      wrapper.destroy()
    }
    expect(service.cancelPairing).toHaveBeenCalledTimes(3)
  })

  it('says to open Add a device on the printer while it connects, before the pairing starts', () => {
    state.phase = 'connecting'
    const wrapper = mount(BluetoothPairDialog, { stubs })
    expect(wrapper.find('[data-tid="pair-connecting"]').text()).toContain('Settings > Add a device')
  })

  it('still shows the six symbols while it waits for the panel, so they can be compared', () => {
    state.phase = 'waiting'
    state.comparison = 'F6Q TDH'
    const wrapper = mount(BluetoothPairDialog, { stubs })
    const waiting = wrapper.find('[data-tid="pair-waiting"]')
    expect(waiting.text().replace(/\s/g, '')).toContain('F6QTDH')
    expect(waiting.text()).toContain('Confirm')
  })

  it('clears the code field when the step changes, so a wrong code is not left in it', async () => {
    state.phase = 'code'
    const wrapper = mount(BluetoothPairDialog, { stubs })
    const field = () => wrapper.find('input[data-tid="pair-code"]')
    await field().setValue('11112222')
    expect((field().element as HTMLInputElement).value).toBe('11112222')

    state.phase = 'waiting'
    await wrapper.vm.$nextTick()
    state.phase = 'code'
    await wrapper.vm.$nextTick()

    expect((field().element as HTMLInputElement).value).toBe('')
  })

  it('shows the plain-words reason when pairing failed, without claiming nothing was added', () => {
    state.phase = 'error'
    state.message = 'No pairing window is open on the printer.'
    const wrapper = mount(BluetoothPairDialog, { stubs })
    expect(wrapper.find('[data-tid="pair-message"]').text()).toContain('No pairing window is open')
    expect(wrapper.text()).not.toMatch(/Nothing was added/)
  })
})

describe('the offer on a printer that refused this browser (KAN-1253)', () => {
  const options = { propsData: { slug: 'boxwood' }, stubs: { 'v-icon': slot, 'v-btn': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'v-progress-circular': slot } }

  it('shows "Pair this browser" with the reminder to open Add a device first, and starts pairing for that printer', async () => {
    source.activationState.error = 'Control is not paired with this printer yet.'
    source.activationState.pairing = 'boxwood'
    const wrapper = shallowMount(PrinterOpening, options)
    await wrapper.find('[data-tid="pair-offer"]').trigger('click')
    expect(wrapper.find('[data-tid="pair-offer"]').text()).toBe('Pair this browser')
    expect(wrapper.find('[data-tid="pair-hint"]').text()).toContain('Settings > Add a device')
    expect(service.startPairing).toHaveBeenCalledWith('boxwood')
  })

  it('shows no offer for an ordinary error', () => {
    source.activationState.error = 'Forbidden'
    const wrapper = shallowMount(PrinterOpening, options)
    expect(wrapper.find('[data-tid="pair-offer"]').exists()).toBe(false)
  })
})

describe('the pairing dialog as the Bluetooth sheet', () => {
  it('finds the printer as step 1, then the code and the Confirm are step 2, by name', async () => {
    state.printerId = 'boxwood'
    state.phase = 'connecting'
    const wrapper = mount(BluetoothPairDialog, { stubs: { ...stubs, 'frame-icon': true } })
    expect(wrapper.find('[data-tid="ble-sheet-step"]').text()).toBe('Step 1 of 2')
    expect(wrapper.find('[data-tid="pair-connecting"]').text()).toContain('Find your printer')
    expect(wrapper.find('[data-tid="ble-printer-row"]').text()).toContain('Boxwood')
    state.phase = 'code'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-tid="ble-sheet-step"]').text()).toBe('Step 2 of 2')
    expect(wrapper.find('[data-tid="pair-code-step"]').text()).toContain('Check the code')
    state.phase = 'waiting'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-tid="ble-sheet-step"]').text()).toBe('Step 2 of 2')
    state.printerId = null
  })

  it('✕ cancels, as Cancel does', async () => {
    state.phase = 'code'
    const wrapper = mount(BluetoothPairDialog, { stubs: { ...stubs, 'frame-icon': true } })
    await wrapper.find('[data-tid="pair-close"]').trigger('click')
    expect(service.cancelPairing).toHaveBeenCalledTimes(1)
  })
})
