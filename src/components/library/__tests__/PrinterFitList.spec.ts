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
  it('a ready printer has a direct Print button; Queue and Offline are pills; Re-slice is a button', async () => {
    const w = list([{}, { status: 'Queue', action: 'queue', tone: 'run' }, { status: 'Offline', action: null, tone: 'off' }, { status: '', action: 'reslice', reslice: 'Re-slice for PETG', tone: 'warn' }])
    const pills = w.findAll('[data-tid="library-fit-status"]')
    expect(pills.wrappers.map(p => [p.element.tagName, p.text()])).toEqual([['SPAN', 'Queue'], ['SPAN', 'Offline']])
    expect(w.findAll('button').wrappers.map(b => b.text())).toEqual(['Print', 'Re-slice for PETG'])
    const print = w.find('[data-tid="library-fit-print"]')
    expect(print.attributes('aria-label')).toBe('Print on P0')
    await print.trigger('click')
    // The row itself, so the page prints on that printer and no other (KAN-2021).
    expect(w.emitted('print')).toHaveLength(1)
    expect(w.emitted('print')![0][0]).toMatchObject({ id: 'p0', name: 'P0' })
    expect(w.emitted('reslice')).toBeUndefined()
    await w.findAll('button').at(1).trigger('click')
    expect(w.emitted('reslice')).toHaveLength(1)
  })

  it('a printer that cannot print it now has no Print button', () => {
    const w = list([{ status: 'Queue', action: 'queue', tone: 'run' }, { status: 'Offline', action: null, tone: 'off' }])
    expect(w.find('[data-tid="library-fit-print"]').exists()).toBe(false)
    expect(w.findAll('button')).toHaveLength(0)
  })

  it('with no printers yet it links to where to add one', () => {
    expect(list([]).find('a').text()).toBe('Add a printer ›')
  })
})
