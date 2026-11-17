import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VueI18n from 'vue-i18n'
import Vue from 'vue'
import messages from '@/locales/en.yaml'
import PrintOnDialog from '../PrintOnDialog.vue'
import type { TargetRow } from '@/services/library/print-targets'
import type { ItemSetup } from '@/services/library/api'

const sendToPrinter = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/services/library/print-on', async (actual) => ({ ...(await actual() as object), sendToPrinter }))

Vue.use(VueI18n)
const i18n = new VueI18n({ locale: 'en', messages: { en: messages } })

const setup: ItemSetup = { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA', print_seconds: 600, filament_g: 3, file_id: 'f' }

function row (over: Partial<TargetRow>): TargetRow {
  return {
    id: 'h',
    name: 'Hazel',
    slug: 'hazel-52be',
    active: true,
    fit: { kind: 'ready', setup },
    status: 'Ready',
    detail: 'PLA loaded · 0.4 mm nozzle. Sliced for exactly this.',
    note: '10m · 3 g',
    action: 'print',
    reslice: '',
    tone: 'ok',
    ...over
  }
}

function open (rows: TargetRow[]) {
  return mount(PrintOnDialog, {
    propsData: { item: { id: 'item-1', name: 'Hinge bracket', setups: [setup], versioned: true, version: 1 } },
    computed: { rows: () => rows },
    mocks: {
      $store: { state: { config: { apiUrl: '', instances: [] }, printer: { printer: {} } }, getters: {} }
    },
    stubs: {
      'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' },
      'printer-thumb': true,
      'router-link': { template: '<a><slot /></a>' },
      'v-progress-circular': true
    },
    i18n,
    attachTo: document.body
  })
}

const tid = (wrapper: ReturnType<typeof open>, id: string) => wrapper.find(`[data-tid="${id}"]`)

describe('Print on…', () => {
  it('starts nothing until the plate check is ticked, then prints on the chosen printer', async () => {
    const wrapper = open([row({})])
    const print = tid(wrapper, 'print-on-print')
    expect(print.text()).toBe('Print now')
    expect(print.attributes('disabled')).toBe('disabled')
    await print.trigger('click')
    expect(sendToPrinter).not.toHaveBeenCalled()

    await wrapper.find('[data-tid="print-on-plate"] input').setChecked(true)
    expect(tid(wrapper, 'print-on-print').attributes('disabled')).toBeUndefined()
    await tid(wrapper, 'print-on-print').trigger('click')
    expect(sendToPrinter).toHaveBeenCalledWith(expect.objectContaining({ mode: 'print', setup, target: expect.objectContaining({ id: 'h' }) }))
    wrapper.destroy()
  })

  it('queues on a busy printer without the plate check: its queue waits for a clear plate', async () => {
    sendToPrinter.mockClear()
    const wrapper = open([row({ action: 'queue', status: 'Queue', tone: 'run' })])
    expect(tid(wrapper, 'print-on-plate').exists()).toBe(false)
    expect(tid(wrapper, 'print-on-print').text()).toBe('Add to queue')
    await tid(wrapper, 'print-on-print').trigger('click')
    expect(sendToPrinter).toHaveBeenCalledWith(expect.objectContaining({ mode: 'queue' }))
    wrapper.destroy()
  })

  it('chooses no printer the print does not fit, and offers Re-slice there instead', async () => {
    sendToPrinter.mockClear()
    const wrapper = open([row({ fit: { kind: 'material', setup, loaded: 'PETG' }, action: 'reslice', reslice: 'Re-slice for PETG', tone: 'warn', status: '' })])
    const reslice = vi.fn()
    ;(wrapper.vm as any).reslice = reslice
    expect(tid(wrapper, 'print-on-print').attributes('disabled')).toBe('disabled')
    expect(tid(wrapper, 'print-on-save').attributes('disabled')).toBe('disabled')
    await tid(wrapper, 'print-on-reslice').trigger('click')
    expect(reslice).toHaveBeenCalledWith(expect.objectContaining({ slug: 'hazel-52be', reslice: 'Re-slice for PETG' }))
    expect(sendToPrinter).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('saves to the printer without asking the plate check: nothing starts', async () => {
    sendToPrinter.mockClear()
    const wrapper = open([row({})])
    await tid(wrapper, 'print-on-save').trigger('click')
    expect(sendToPrinter).toHaveBeenCalledWith(expect.objectContaining({ mode: 'save' }))
    wrapper.destroy()
  })
})

describe('Print on… (Library v3, page 10): how it reads', () => {
  it('is titled with the print, names the printer you are on as here, and says on one line what each has and does', () => {
    const wrapper = open([row({}), row({ id: 'w', name: 'Walnut', slug: 'walnut', active: false, status: 'Queue', tone: 'run', action: 'queue', detail: 'Printing Cube now', note: 'Queued prints start once the plate has been cleared.' })])
    expect(wrapper.find('.m3-dlg__title, h2').text()).toBe('Hinge bracket')
    const rows = wrapper.findAll('.print-on__row')
    expect(rows.at(0).text()).toContain('Hazel · here')
    expect(rows.at(0).find('[data-tid="print-on-fit"]').text()).toBe('PLA loaded · 0.4 mm nozzle. Sliced for exactly this. · 10m · 3 g')
    expect(rows.at(0).text()).toContain('Ready')
    expect(rows.at(1).text()).not.toContain('· here')
    expect(rows.at(1).text()).toContain('Queue')
    // Both can be chosen: one row, one radio each.
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(2)
    wrapper.destroy()
  })

  it('names the printer in the plate switch, and Cancel closes', async () => {
    const wrapper = open([row({})])
    expect(tid(wrapper, 'print-on-plate').text()).toBe('The plate on Hazel is clear')
    // Why it matters stays with it: the M1 prints upside down onto its plate.
    expect(tid(wrapper, 'print-on-plate-why').text()).toContain('upside down')
    expect(tid(wrapper, 'print-on-plate').find('input').attributes('role')).toBe('switch')
    await tid(wrapper, 'print-on-cancel').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.destroy()
  })

  it('Enter on Re-slice re-slices; Enter on a row chooses it', async () => {
    const wrapper = open([row({ id: 'a', slug: 'a', name: 'A' }), row({ id: 'b', slug: 'b', name: 'B', action: 'reslice', reslice: 'Re-slice', tone: 'warn', status: '' })])
    // Enter on the button is not cancelled by its row, so the browser turns it into the button's click.
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    tid(wrapper, 'print-on-reslice').element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(false)
    // Enter on a row itself chooses it (and is not left to scroll the page).
    const onRow = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    wrapper.findAll('[role="radio"]').at(0).element.dispatchEvent(onRow)
    expect(onRow.defaultPrevented).toBe(true)
    // Space too, both ways.
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    tid(wrapper, 'print-on-reslice').element.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(false)
    const spaceOnRow = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    wrapper.findAll('[role="radio"]').at(0).element.dispatchEvent(spaceOnRow)
    expect(spaceOnRow.defaultPrevented).toBe(true)
    expect(wrapper.findAll('[role="radio"]').at(0).attributes('aria-checked')).toBe('true')
    wrapper.destroy()
  })

  it('offers no way off the dialog while it is sending', async () => {
    const wrapper = open([row({})])
    ;(wrapper.vm as any).sending = true
    await Vue.nextTick()
    expect(tid(wrapper, 'print-on-fine').find('a').exists()).toBe(false)
    wrapper.destroy()
  })

  it('a print that needs re-slicing there says what is loaded, not how long it would take', () => {
    const wrapper = open([row({ fit: { kind: 'material', setup, loaded: 'PETG' }, action: 'reslice', reslice: 'Re-slice for PETG', tone: 'warn', status: '', detail: 'PETG loaded · this was sliced for PLA', note: 'Re-slicing opens it in Slice for Hazel and saves a version.' })])
    expect(tid(wrapper, 'print-on-fit').text()).toBe('PETG loaded · this was sliced for PLA')
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(0)
    wrapper.destroy()
  })
})
