import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BluetoothSheet from '../BluetoothSheet.vue'
import BluetoothCodeBoxes from '../BluetoothCodeBoxes.vue'
import BluetoothPrinterRow from '../BluetoothPrinterRow.vue'

const slot = { template: '<div><slot /></div>' }
const stubs = { 'v-dialog': slot, 'frame-icon': true, 'v-progress-circular': true }

describe('the Bluetooth sheet (v3 bluetooth storyboard)', () => {
  it('says Step n of N on top, with one dot lit per step reached', () => {
    const w = mount(BluetoothSheet, { propsData: { value: true, step: 2, of: 3 }, stubs, slots: { default: '<p>inside</p>' } })
    expect(w.find('[data-tid="ble-sheet-step"]').text()).toBe('Step 2 of 3')
    const dots = w.findAll('[data-tid="ble-sheet-dots"] i')
    expect(dots).toHaveLength(3)
    expect(dots.wrappers.map(d => d.classes().includes('is-on'))).toEqual([true, true, false])
    expect(w.text()).toContain('inside')
  })

  it('asks its parent to close from ✕, under the id it is given', async () => {
    const w = mount(BluetoothSheet, { propsData: { value: true, step: 1, closeTid: 'pair-close' }, stubs })
    await w.find('[data-tid="pair-close"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('shows the six characters one to a box, with the gap after three', () => {
    const w = mount(BluetoothCodeBoxes, { propsData: { code: 'F6Q TDH' } })
    const boxes = w.findAll('span')
    expect(boxes.wrappers.map(b => b.text())).toEqual(['F', '6', 'Q', 'T', 'D', 'H'])
    expect(boxes.at(3).classes()).toContain('is-gap')
    expect(w.attributes('aria-label')).toBe('F 6 Q T D H')
  })

  it('shows the printer being found as the selected row, with what it is doing', () => {
    const w = mount(BluetoothPrinterRow, { propsData: { name: 'Walnut · 8987', line: 'New, not set up', busy: 'Connecting…' }, stubs })
    expect(w.text()).toContain('Walnut · 8987')
    expect(w.text()).toContain('New, not set up')
    expect(w.text()).toContain('Connecting…')
  })
})
