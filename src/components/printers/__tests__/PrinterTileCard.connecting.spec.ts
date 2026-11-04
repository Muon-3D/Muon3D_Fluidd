import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PrinterTileCard from '../PrinterTileCard.vue'

const tile = { key: 'cloud:walnut', name: 'Walnut', state: 'ready', label: 'Ready', detail: 'Idle', entry: {} } as never

const mount = (busy: boolean) => shallowMount(PrinterTileCard, {
  propsData: { tile, busy },
  stubs: { 'v-progress-circular': true, 'v-menu': true, 'v-list': true, 'v-list-item': true, 'v-list-item-title': true }
})

describe('a card while its printer opens (I-129)', () => {
  it('says Connecting… with a spinner while its open is in flight', () => {
    const w = mount(true)
    expect(w.text()).toContain('Connecting…')
    expect(w.find('v-progress-circular-stub').exists()).toBe(true)
  })

  it('drops it when the open is over', () => {
    const w = mount(false)
    expect(w.text()).not.toContain('Connecting…')
    expect(w.find('v-progress-circular-stub').exists()).toBe(false)
  })
})
