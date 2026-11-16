import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FilamentTile from '../tiles/FilamentTile.vue'
import { tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const mountIt = (store: ReturnType<typeof tileStore>) => mount(FilamentTile, tileMount(store, { stubs: { ...tileMount(store).stubs, 'material-picker': true } }))

describe('FilamentTile', () => {
  it('says "No material loaded" with a warning icon when there is no data, and shows no amount', () => {
    const w = mountIt(tileStore({ empty: true }))
    expect(w.text()).toContain('Filament')
    expect(w.text()).toContain('No material loaded')
    expect(w.find('[data-tid="filament-warning"]').exists()).toBe(true)
    expect(w.text()).not.toMatch(/\d\s?%|\d\s?g\b|remaining/i)
    w.destroy()
  })

  it('is one row: the type and a colour icon from what is loaded', () => {
    const store = tileStore()
    store.state.config.uiSettings.general.loadedMaterial = 'PLA'
    store.state.config.uiSettings.general.loadedMaterialColour = '#80D6D1'
    Vue.set(store.getters, 'config/getTempPresets', [{ id: 1, name: 'PLA', gcode: '', values: { extruder: { active: true, type: 'heater', value: 215 }, heater_bed: { active: true, type: 'heater', value: 60 } } }])
    const w = mountIt(store)
    expect(w.findAll('[data-tid="filament-row"]')).toHaveLength(1)
    expect(w.find('[data-tid="filament-type"]').text()).toBe('PLA')
    expect(w.find('[data-tid="filament-swatch"]').attributes('style')).toContain('rgb(128, 214, 209)')
    w.destroy()
  })

  it('uses the active Spoolman spool first', () => {
    const store = tileStore()
    Vue.set(store.getters, 'spoolman/getActiveSpool', { filament: { material: 'PETG', name: 'Black', color_hex: '2b2f31' } })
    const w = mountIt(store)
    expect(w.find('[data-tid="filament-type"]').text()).toBe('PETG')
    expect(w.text()).toContain('Black')
    w.destroy()
  })

  it('falls back to what the print file was sliced for', () => {
    const store = tileStore({ printing: true })
    Vue.set(store.state.printer.printer, 'current_file', { filament_type: 'ABS' })
    const w = mountIt(store)
    expect(w.find('[data-tid="filament-type"]').text()).toBe('ABS')
    expect(w.text()).toContain('from the print file')
    w.destroy()
  })

  it('keeps load, sensors and Spoolman behind the three dots', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'spoolman/getAvailable', true)
    const w = mountIt(store)
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['material', 'load', 'sensors', 'spoolman'])
    await w.find('[data-menu="spoolman"]').trigger('click')
    expect(store.commit).toHaveBeenCalledWith('spoolman/setDialogState', { show: true })
    w.destroy()
  })

  it('opens the material panel itself from ⋯ Set material and Load or unload, with no dialog of its own', async () => {
    const w = mountIt(tileStore())
    const picker = w.findComponent({ name: 'MaterialPicker' }).exists()
      ? w.findComponent({ name: 'MaterialPicker' })
      : w.find('material-picker-stub')
    expect(picker.exists()).toBe(true)
    expect(w.find('[data-tid="tile-dialog"]').exists()).toBe(false)
    const section = w.findComponent({ name: 'FilamentSection' })
    expect(section.exists()).toBe(true)
    for (const id of ['material', 'load']) {
      const vm = section.vm as unknown as { $refs: { picker: { open: boolean } } }
      vm.$refs.picker = { open: false } as never
      await w.find('[data-tid="tile-more"]').trigger('click')
      await w.find(`[data-menu="${id}"]`).trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(vm.$refs.picker.open).toBe(true)
    }
    w.destroy()
  })
})
