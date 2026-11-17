import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AddPrinterSheet from '../AddPrinterSheet.vue'
import FoundList from '../FoundList.vue'

const sheet = (value = true) => shallowMount(AddPrinterSheet, {
  propsData: { value },
  mocks: { $vuetify: { breakpoint: { xsOnly: false } } },
  stubs: { 'v-dialog': { template: '<div><slot /></div>' }, 'router-link': true }
})
const tile = (over: Record<string, unknown> = {}) => ({
  key: 'found:hazel',
  name: 'Hazel',
  state: 'printing',
  tone: 'run',
  label: 'Printing',
  entry: { host: '192.168.1.37', row: { action: 'open' } },
  ...over
}) as never

describe('printer onboarding presentation', () => {
  it('routes new and existing printers to the existing setup and code flows', () => {
    const w = sheet()
    expect(w.find('[data-tid="add-new-printer"]').attributes('to')).toBe('/setup')
    expect(w.find('[data-tid="add-existing-printer"]').attributes('to')).toBe('/link')
    expect(w.text()).toContain("Join the new printer's Muon- Wi-Fi first")
    expect(w.text()).toContain('open their invite link')
    w.destroy()
  })

  it('removes closed sheet content from the DOM and restores exactly one copy', async () => {
    const w = sheet(false)
    expect(w.find('[data-tid="add-printer-sheet"]').exists()).toBe(false)
    await w.setProps({ value: true })
    expect(w.findAll('[data-tid="add-existing-printer"]')).toHaveLength(1)
    await w.setProps({ value: false })
    expect(w.find('[data-tid="add-new-printer"]').exists()).toBe(false)
    w.destroy()
  })

  it('keeps both entry paths available without Bluetooth or any discovered printers', () => {
    const w = sheet()
    expect(w.findAll('router-link-stub')).toHaveLength(2)
    expect(w.find('[data-tid="look-nearby"]').exists()).toBe(false)
    expect(w.text()).toContain('Nothing new found yet')
    w.destroy()
  })

  it('identifies unowned network printers, preserves local Open and linking, and rejects physical actions', async () => {
    const t = tile()
    const w = shallowMount(FoundList, {
      propsData: {
        tiles: [t],
        actionsFor: () => [
          { id: 'connect', label: 'Connect' }, { id: 'link', label: 'Link to my account' }, { id: 'pair-browser', label: 'Pair this browser' },
          { id: 'pause', label: 'Pause' }, { id: 'resume', label: 'Resume' }, { id: 'stop', label: 'Stop' }
        ]
      }
    })
    expect(w.find('[data-tid="found-ownership"]').text()).toContain('Not in your account or shared with you')
    expect(w.findAll('button').wrappers.map(b => b.text())).toEqual(['Link to my account', 'Pair this browser', 'Open'])
    await w.find('[data-tid="found-connect"]').trigger('click')
    expect(w.emitted('action')![0]).toEqual([t, 'connect'])
    w.destroy()
  })

  it('retains disabled access requests and busy local Open without printing controls', () => {
    const w = shallowMount(FoundList, {
      propsData: {
        tiles: [tile()],
        busyKey: 'found:hazel',
        actionsFor: () => [
          { id: 'connect', label: 'Connect' }, { id: 'ask', label: 'Ask for access', disabled: true }, { id: 'cancel', label: 'Cancel print' }
        ]
      },
      stubs: { 'v-progress-circular': true }
    })
    expect(w.find('[data-tid="found-ask"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-tid="found-connect"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-tid="found-cancel"]').exists()).toBe(false)
    w.destroy()
  })

  it('does not invent network ownership labels for empty or Bluetooth-only discovery', () => {
    const empty = shallowMount(FoundList, { propsData: { tiles: [], actionsFor: () => [] } })
    expect(empty.find('[data-tid="found-ownership"]').exists()).toBe(false)
    expect(empty.findAll('button')).toHaveLength(0)
    empty.destroy()
    const nearby = shallowMount(FoundList, { propsData: { tiles: [tile({ entry: { row: { action: 'nearby-info' } } })], actionsFor: () => [] } })
    expect(nearby.find('[data-tid="found-ownership"]').exists()).toBe(false)
    nearby.destroy()
  })
})
