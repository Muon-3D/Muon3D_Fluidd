import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PrintersHeader from '../PrintersHeader.vue'
import PrintersSection from '../PrintersSection.vue'
import FoundList from '../FoundList.vue'
import PrintersWelcome from '../PrintersWelcome.vue'
import AddPrinterSheet from '../AddPrinterSheet.vue'
import OfflineList from '../OfflineList.vue'
import PrintingNowCard from '../PrintingNowCard.vue'

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
  it('shows Connect over Bluetooth only where Web Bluetooth exists, else one quiet line (KAN-2470)', async () => {
    const yes = shallowMount(PrintersHeader, { propsData: { bluetoothSearch: true } })
    await yes.find('[data-tid="connect-bluetooth"]').trigger('click')
    expect(yes.emitted('connect-bluetooth')).toHaveLength(1)
    expect(yes.find('[data-tid="bluetooth-needs-chrome"]').exists()).toBe(false)
    const no = shallowMount(PrintersHeader, { propsData: { bluetoothSearch: false } })
    expect(no.find('[data-tid="connect-bluetooth"]').exists()).toBe(false)
    expect(no.find('[data-tid="bluetooth-needs-chrome"]').text()).toMatch(/Chrome or Edge/)
  })

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
  it('puts Open on the row for a printer it can open (it opens it, it does not just save it), and sends its id', async () => {
    const tile = found()
    const w = shallowMount(FoundList, {
      propsData: { tiles: [tile], actionsFor: () => [{ id: 'connect', label: 'Connect', icon: '' }] },
      stubs: { 'v-progress-circular': true }
    })
    expect(w.text()).toContain('192.168.1.37')
    const add = w.find('[data-tid="found-connect"]')
    expect(add.text()).toContain('Open')
    expect(add.text()).not.toContain('Add')
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

describe('a printer found over Bluetooth that is set up already (KAN-2123)', () => {
  const tile = (endpointId: string | null) => found({
    entry: { row: { action: 'nearby-info', nearby: { endpointId } } }
  })

  it('offers Pair over Bluetooth, not just what it is, when its id is known (signed in or not)', async () => {
    const t = tile('cafe'.repeat(16))
    const w = shallowMount(FoundList, { propsData: { tiles: [t], actionsFor: () => [] } })
    const primary = w.find('.btn--primary')
    expect(primary.text()).toContain('Pair over Bluetooth')
    await primary.trigger('click')
    expect(w.emitted('action')![0]).toEqual([t, 'pair-bluetooth'])
  })

  it('still only says what it is when the sighting has no id to pair with', () => {
    const w = shallowMount(FoundList, { propsData: { tiles: [tile(null)], actionsFor: () => [] } })
    expect(w.find('.btn--primary').text()).toContain('What is this?')
  })
})

describe('the found row text', () => {
  it('keeps the printer own detail line', () => {
    const w = shallowMount(FoundList, { propsData: { tiles: [found({ entry: { host: '192.168.1.37', detail: '192.168.1.37 · not linked to an account', row: { action: 'open' } } })], actionsFor: () => [] } })
    expect(w.text()).toContain('not linked to an account')
  })
})

describe('the offline row', () => {
  const offline = (seen: number) => ({ key: 'cloud:pine', name: 'Pine', state: 'offline', tone: 'off', label: 'Offline', detail: 'Offline', groupName: 'Workshop', entry: { cloud: { last_seen: seen } } }) as never

  it('says when it was last seen, and in which group', () => {
    const w = shallowMount(OfflineList, { propsData: { tiles: [offline(Date.now() / 1000 - 3 * 86400)], actionsFor: () => [] }, stubs: { 'v-menu': true } })
    expect(w.find('[data-tid="offline-reason"]').text()).toContain('Last seen 3 days ago · Workshop')
  })

  it('falls back to what the page knows when no time is known', () => {
    const w = shallowMount(OfflineList, { propsData: { tiles: [offline(0)], actionsFor: () => [] }, stubs: { 'v-menu': true } })
    expect(w.find('[data-tid="offline-reason"]').text()).toContain('Offline · Workshop')
  })
})

describe('the printing card', () => {
  const printing = (label: string, state = 'printing') => ({ key: 'a', name: 'Boxwood', state, tone: 'run', label, detail: 'bracket', remote: false, groupName: null, job: { file: 'bracket.gcode', progress: 44, secondsLeft: 600 } }) as never
  const mountCard = (propsData: Record<string, unknown>) => shallowMount(PrintingNowCard, { propsData, stubs: { 'v-icon': true, 'frame-icon': true } })

  it('reads its pill from the label: Paused for a paused print, Printing when the label is the percent', () => {
    expect(mountCard({ tile: printing('Paused', 'paused'), variant: 'card' }).findComponent({ name: 'TonePill' }).text()).toBe('Paused')
    expect(mountCard({ tile: printing('44%'), variant: 'card' }).findComponent({ name: 'TonePill' }).text()).toBe('Printing')
  })

  it('waits while a control is busy, so a second click is not sent', () => {
    const w = mountCard({ tile: printing('44%'), variant: 'card', controllable: true, busy: true })
    expect(w.find('[data-tid="printing-now-pause"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-tid="printing-now-stop"]').attributes('disabled')).toBeDefined()
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

  it('leaves the Sign in way out for someone signed in', () => {
    const w = shallowMount(PrintersWelcome, { propsData: { signedIn: true } })
    expect(w.find('[data-tid="sign-in"]').exists()).toBe(false)
    expect(w.find('[data-tid="enter-address"]').exists()).toBe(true)
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
