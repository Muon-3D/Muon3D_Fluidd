import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PrintersHeader from '../PrintersHeader.vue'
import PrintersSection from '../PrintersSection.vue'
import FoundList from '../FoundList.vue'
import PrintersWelcome from '../PrintersWelcome.vue'
import AddPrinterSheet from '../AddPrinterSheet.vue'

const found = (over: Record<string, unknown> = {}) => ({
  key: 'found:hazel',
  name: 'Hazel',
  state: 'ready',
  tone: 'ok',
  label: 'Ready',
  detail: '',
  entry: { host: '192.168.1.37', row: { action: 'open' } },
  ...over
}) as never

describe('the page header', () => {
  it('has one primary button, and says Add when it is pressed', async () => {
    const w = shallowMount(PrintersHeader, { propsData: { summary: '7 printers', showSearch: true, showView: true } })
    expect(w.find('h1').text()).toBe('All printers')
    expect(w.find('[data-tid="printers-summary"]').text()).toBe('7 printers')
    expect(w.findAll('.btn--primary')).toHaveLength(1)
    await w.find('[data-tid="add-printer"]').trigger('click')
    expect(w.emitted('add')).toHaveLength(1)
  })

  it('sends what is typed in search, and the view that is picked', async () => {
    const w = shallowMount(PrintersHeader, { propsData: { showSearch: true, showView: true } })
    const input = w.find('input')
    ;(input.element as HTMLInputElement).value = 'elm'
    await input.trigger('input')
    expect(w.emitted('update:search')![0]).toEqual(['elm'])
    await w.find('[data-tid="view-list"]').trigger('click')
    expect(w.emitted('update:view')![0]).toEqual(['list'])
  })

  it('leaves search and the view switch out when there is nothing to search', () => {
    const w = shallowMount(PrintersHeader, { propsData: {} })
    expect(w.find('input').exists()).toBe(false)
    expect(w.find('.seg').exists()).toBe(false)
  })
})

describe('a section', () => {
  it('has its title, a muted count and a note', () => {
    const w = shallowMount(PrintersSection, { propsData: { title: 'Lab', count: 1, note: 'Walnut is printing, shown above' } })
    expect(w.find('h2').text()).toBe('Lab')
    expect(w.find('[data-tid="section-count"]').text()).toBe('1')
    expect(w.text()).toContain('Walnut is printing, shown above')
  })
})

describe('the found list', () => {
  it('puts Add on the row for a printer it can open, and sends its id', async () => {
    const tile = found()
    const w = shallowMount(FoundList, {
      propsData: { tiles: [tile], actionsFor: () => [{ id: 'connect', label: 'Connect', icon: '' }] },
      stubs: { 'v-progress-circular': true }
    })
    expect(w.text()).toContain('192.168.1.37')
    const add = w.find('[data-tid="found-connect"]')
    expect(add.text()).toContain('Add')
    await add.trigger('click')
    expect(w.emitted('action')![0]).toEqual([tile, 'connect'])
  })

  it('offers Set it up for a printer that is new, and nothing for one with no action', () => {
    const fresh = shallowMount(FoundList, { propsData: { tiles: [found({ state: 'new', label: 'New', tone: 'info' })], actionsFor: () => [] } })
    expect(fresh.find('[data-tid="found-set-up"]').exists()).toBe(true)
    const none = shallowMount(FoundList, { propsData: { tiles: [found()], actionsFor: () => [] } })
    expect(none.find('.btn--primary').exists()).toBe(false)
  })
})

describe('the empty state', () => {
  it('names what is missing, and asks to search again, add by address and sign in', async () => {
    const w = shallowMount(PrintersWelcome, { propsData: { bluetoothSearch: true }, stubs: { 'v-progress-circular': true } })
    expect(w.find('h1').text()).toBe('No printers yet')
    await w.find('[data-tid="search-again"]').trigger('click')
    await w.find('[data-tid="enter-address"]').trigger('click')
    await w.find('[data-tid="sign-in"]').trigger('click')
    await w.find('[data-tid="look-nearby"]').trigger('click')
    expect(w.emitted('rescan')).toHaveLength(1)
    expect(w.emitted('address')).toHaveLength(1)
    expect(w.emitted('sign-in')).toHaveLength(1)
    expect(w.emitted('look-nearby')).toHaveLength(1)
  })

  it('hides Look nearby when Bluetooth is off', () => {
    const w = shallowMount(PrintersWelcome, { propsData: { bluetoothSearch: true, bluetoothOff: true } })
    expect(w.find('[data-tid="look-nearby"]').exists()).toBe(false)
  })
})

describe('the Add printer sheet', () => {
  const mount = (propsData: Record<string, unknown>) => shallowMount(AddPrinterSheet, {
    propsData: { value: true, ...propsData },
    mocks: { $vuetify: { breakpoint: { xsOnly: false } } },
    stubs: { 'v-dialog': { template: '<div><slot /></div>' } }
  })

  it('offers the network and an address, and Bluetooth when the browser has it', () => {
    expect(mount({}).find('[data-tid="look-nearby"]').exists()).toBe(false)
    const w = mount({ bluetoothSearch: true, found: 2 })
    expect(w.find('[data-tid="look-nearby"]').exists()).toBe(true)
    expect(w.text()).toContain('2 found')
    expect(w.find('[data-tid="enter-address"]').exists()).toBe(true)
  })

  it('searches again from the sheet, but not while it is looking', async () => {
    const w = mount({ searching: true })
    expect(w.find('[data-tid="search-again"]').attributes('disabled')).toBeDefined()
    const idle = mount({})
    await idle.find('[data-tid="search-again"]').trigger('click')
    expect(idle.emitted('rescan')).toHaveLength(1)
  })
})
