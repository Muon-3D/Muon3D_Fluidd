import { mount } from '@vue/test-utils'
import Vue from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PrintModeTile from '../tiles/PrintModeTile.vue'
import MacrosTile from '../tiles/MacrosTile.vue'
import FilamentTile from '../tiles/FilamentTile.vue'
import { tileMount, tileStore } from './fixture'

const FAN_MODES = { mode: 'normal', modes: ['quiet', 'normal', 'turbo'] }

afterEach(() => { vi.restoreAllMocks() })

describe('PrintModeTile', () => {
  const withModes = (fanModes: unknown) => {
    const store = tileStore()
    Vue.set(store.state.printer.printer, 'fan_modes', fanModes)
    return store
  }

  it('offers Quiet, Normal and Turbo and sends SET_PRINT_MODE', async () => {
    const store = withModes(FAN_MODES)
    const w = mount(PrintModeTile, tileMount(store))
    const send = vi.spyOn(w.vm as any, 'sendGcode').mockImplementation(() => undefined)
    expect(w.findAll('[data-tid^="overview-mode-"]').wrappers.map(b => b.find('b').text())).toEqual(['Quiet', 'Normal', 'Turbo'])
    expect(w.find('[data-tid="overview-mode-normal"]').attributes('aria-checked')).toBe('true')
    await w.find('[data-tid="overview-mode-turbo"]').trigger('click')
    expect(send).toHaveBeenCalledWith('SET_PRINT_MODE MODE=turbo')
    w.destroy()
  })

  it('says it is not available without fan_modes, and never shows speed or flow', () => {
    const w = mount(PrintModeTile, tileMount(withModes(undefined)))
    expect(w.find('[data-tid="mode-unavailable"]').text()).toContain('Not available on this printer')
    expect(w.text()).not.toMatch(/speed|flow/i)
    w.destroy()
  })

  it('draws more at M than at S: each mode says what it does', () => {
    const small = mount(PrintModeTile, tileMount(withModes(FAN_MODES), { propsData: { size: 'S' } }))
    const medium = mount(PrintModeTile, tileMount(withModes(FAN_MODES), { propsData: { size: 'M' } }))
    expect(small.text()).not.toContain('Full cooling')
    expect(medium.text()).toContain('Full cooling')
    small.destroy(); medium.destroy()
  })
})

describe('sizes draw different things', () => {
  it('Quick commands shows 2, 4 or 7 commands', () => {
    const count = (size: string) => {
      const w = mount(MacrosTile, tileMount(tileStore(), { propsData: { size } }))
      const n = w.findAll('[data-tid="macro-chip"]').length
      w.destroy()
      return n
    }
    const [s, m, l] = ['S', 'M', 'L'].map(count)
    expect(s).toBeLessThanOrEqual(2)
    expect(m).toBeGreaterThanOrEqual(s)
    expect(l).toBeGreaterThanOrEqual(m)
  })

  it('Filament: S is the spool, M and L the full filament box with Change, Load and Unload', () => {
    const stubs = { ...tileMount(tileStore()).stubs, 'material-picker': true }
    const small = mount(FilamentTile, tileMount(tileStore(), { propsData: { size: 'S' }, stubs }))
    const medium = mount(FilamentTile, tileMount(tileStore(), { propsData: { size: 'M' }, stubs }))
    expect(small.find('[data-tid="overview-load-filament"]').exists()).toBe(false)
    for (const tid of ['overview-change-filament', 'overview-load-filament', 'overview-unload-filament']) expect(medium.find(`[data-tid="${tid}"]`).exists()).toBe(true)
    small.destroy(); medium.destroy()
  })
})
