import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PrinterFitList from '../PrinterFitList.vue'
import type { TargetRow } from '@/services/library/print-targets'

const setup = { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA', print_seconds: 600, filament_g: 3, file_id: 'f' }

function list (rows: Array<Partial<TargetRow>>) {
  return mount(PrinterFitList, {
    propsData: { item: { id: 'a', name: 'A', setups: [setup], version: 1 } },
    computed: { rows: () => rows.map((r, i) => ({ id: `p${i}`, name: `P${i}`, slug: `p${i}`, active: false, fit: { kind: 'ready', setup }, status: 'Ready', detail: '', note: '', action: 'print', reslice: '', tone: 'ok', ...r })) },
    mocks: { $store: { state: { config: { apiUrl: '', instances: [] }, printer: { printer: {} } }, getters: {} } },
    stubs: { 'printer-thumb': true, 'router-link': { template: '<a><slot /></a>' } }
  })
}

describe('Your printers on one of your prints (Library v3, page 9)', () => {
  it('says what each can do as a pill, not a button; Re-slice is the one button', async () => {
    const w = list([{}, { status: 'Queue', action: 'queue', tone: 'run' }, { status: '', action: 'reslice', reslice: 'Re-slice for PETG', tone: 'warn' }])
    const pills = w.findAll('[data-tid="library-fit-status"]')
    expect(pills.wrappers.map(p => [p.element.tagName, p.text()])).toEqual([['SPAN', 'Ready'], ['SPAN', 'Queue']])
    expect(w.findAll('button').wrappers.map(b => b.text())).toEqual(['Re-slice for PETG'])
    await w.find('button').trigger('click')
    expect(w.emitted('reslice')).toHaveLength(1)
  })

  it('with no printers yet it links to where to add one', () => {
    expect(list([]).find('a').text()).toBe('Add a printer ›')
  })
})
