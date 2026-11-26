import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import type { PrinterTile } from '@/services/printers-page/model'
import PrinterBench from '../PrinterBench.vue'

const tile = (state: PrinterTile['state'], tone: PrinterTile['tone'], job: PrinterTile['job'] = null) => ({ state, tone, job }) as PrinterTile
const heating = { nozzle: 180, nozzleTarget: 220, bed: 60, bedTarget: 60 } as PrinterTile['job']
const show = (tiles: PrinterTile[] = []) => shallowMount(PrinterBench, {
  propsData: { benchId: 'workshop', title: 'Workshop', tiles },
  slots: { default: '<button data-tid="printer-tile-one">Open Rowan</button>' }
})

describe('provisional printer benches', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { vi.restoreAllMocks() })

  it('names the group and removes folded printer controls from the DOM, retaining the summary', async () => {
    const w = show([tile('ready', 'ok')])
    expect(w.attributes('aria-label')).toBe('Workshop')
    expect(w.findAll('[data-tid="printer-tile-one"]')).toHaveLength(1)
    await w.find('[data-tid="bench-fold"]').trigger('click')
    expect(w.find('[data-tid="bench-fold"]').attributes('aria-expanded')).toBe('false')
    expect(w.find('[data-tid="printer-tile-one"]').exists()).toBe(false)
    expect(w.find('[data-tid="bench-summary"]').text()).toContain('1 ready')
    w.destroy()
    const restored = show()
    expect(restored.find('[data-tid="printer-tile-one"]').exists()).toBe(false)
    await restored.find('[data-tid="bench-fold"]').trigger('click')
    expect(restored.findAll('[data-tid="printer-tile-one"]')).toHaveLength(1)
    restored.destroy()
  })

  it('counts heating separately and combines paused and fault in the red need-you count', () => {
    const w = show([tile('printing', 'run'), tile('printing', 'run', heating), tile('ready', 'ok'), tile('paused', 'warn'), tile('error', 'err'), tile('offline', 'off'), tile('new', 'info')])
    expect(w.findAll('.bench__dot').wrappers.map(d => d.text())).toEqual(['1 printing', '1 ready', '1 heating', '2 need you', '1 asleep', '1 new'])
    expect(w.find('.bench__dot--warn').text()).toBe('1 heating')
    expect(w.find('.bench__dot--err').text()).toBe('2 need you')
    w.destroy()
  })

  it('labels an empty bench honestly', () => {
    const w = show()
    expect(w.find('[data-tid="bench-summary"]').text()).toBe('Empty')
    expect(w.findAll('.bench__dot')).toHaveLength(0)
    w.destroy()
  })

  it('keeps reconnecting and locked printers waiting, not in the red fault count', () => {
    const w = show([tile('reconnecting', 'warn'), tile('locked', 'warn')])
    expect(w.findAll('.bench__dot').wrappers.map(d => d.text())).toEqual(['2 waiting'])
    expect(w.find('.bench__dot--err').exists()).toBe(false)
    w.destroy()
  })

  it('does not invent heating when the reported temperature is invalid', () => {
    const w = show([tile('printing', 'run', { ...heating!, nozzle: NaN })])
    expect(w.find('.bench__dot--warn').exists()).toBe(false)
    expect(w.find('.bench__dot--run').text()).toBe('1 printing')
    w.destroy()
  })

  it('still folds and reopens for this visit when saving the fold fails', async () => {
    const w = show()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked') })
    await w.find('[data-tid="bench-fold"]').trigger('click')
    expect(w.find('[data-tid="printer-tile-one"]').exists()).toBe(false)
    await w.find('[data-tid="bench-fold"]').trigger('click')
    expect(w.findAll('[data-tid="printer-tile-one"]')).toHaveLength(1)
    w.destroy()
  })
})
