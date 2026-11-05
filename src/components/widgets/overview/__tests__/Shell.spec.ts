import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TileShell from '../tiles/TileShell.vue'
import TileMenu from '../tiles/TileMenu.vue'

const stubs = { 'frame-icon': true, 'router-link': { props: ['to'], template: '<a :href="to" @click="$emit(\'click\')"><slot /></a>' } }

describe('TileMenu', () => {
  it('opens on the three dots, runs an item and closes', async () => {
    const action = vi.fn()
    const w = mount(TileMenu, { stubs, propsData: { label: 'Hotend', items: [{ id: 'a', label: 'Do it', action }, { id: 'b', label: 'Go', to: '/x/y' }] } })
    expect(w.find('[data-tid="tile-menu"]').exists()).toBe(false)
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.find('[data-tid="tile-more"]').attributes('aria-label')).toBe('More for Hotend')
    expect(w.findAll('[role="menuitem"]')).toHaveLength(2)
    await w.find('[data-menu="a"]').trigger('click')
    expect(action).toHaveBeenCalledTimes(1)
    expect(w.find('[data-tid="tile-menu"]').exists()).toBe(false)
    w.destroy()
  })
  it('keeps a switch open and says which way it is; refuses a disabled item', async () => {
    const flip = vi.fn(); const no = vi.fn()
    const w = mount(TileMenu, { stubs, propsData: { items: [{ id: 't', label: 'Show on graph', toggle: true, on: true, action: flip }, { id: 'd', label: 'Nope', disabled: true, action: no }] } })
    await w.find('[data-tid="tile-more"]').trigger('click')
    await w.find('[data-menu="t"]').trigger('click')
    expect(flip).toHaveBeenCalled()
    expect(w.find('[data-tid="tile-menu"]').exists()).toBe(true)
    expect(w.find('[data-menu="t"]').text()).toContain('On')
    await w.find('[data-menu="d"]').trigger('click')
    expect(no).not.toHaveBeenCalled()
    w.destroy()
  })
  it('closes on a press anywhere else', async () => {
    const w = mount(TileMenu, { stubs, attachTo: document.body, propsData: { items: [{ id: 'a', label: 'A' }] } })
    await w.find('[data-tid="tile-more"]').trigger('click')
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('[data-tid="tile-menu"]').exists()).toBe(false)
    w.destroy()
  })
})

describe('TileShell', () => {
  it('shows its title, state and a menu only when it has items', () => {
    const w = mount(TileShell, { stubs, propsData: { tile: 'x', title: 'Hotend', state: 'Heating', tone: 'warm' } })
    expect(w.text()).toContain('Hotend')
    expect(w.find('[data-tid="tile-state"]').classes()).toContain('ot__state--warm')
    expect(w.find('[data-tid="tile-more"]').exists()).toBe(false)
    w.destroy()
  })
  it('is a button door with a popover only when it has one, and asks to toggle', async () => {
    const w = mount(TileShell, {
      stubs,
      propsData: { tile: 'x', title: 'Bed', open: true, menu: [{ id: 'a', label: 'A' }] },
      scopedSlots: { popover: '<p data-pop>full controls</p>' }
    })
    const door = w.find('[data-tid="tile-door"]')
    expect(door.element.tagName).toBe('BUTTON')
    expect(door.attributes('aria-expanded')).toBe('true')
    expect(w.find('[data-tid="tile-popover"] [data-pop]').exists()).toBe(true)
    await door.trigger('click')
    expect(w.emitted('toggle')).toHaveLength(1)
    await w.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('toggle')).toHaveLength(2)
    w.destroy()
  })
  it('has no door button without a popover', () => {
    const w = mount(TileShell, { stubs, propsData: { tile: 'x', title: 'Macros' } })
    expect(w.find('[data-tid="tile-door"]').element.tagName).toBe('DIV')
    w.destroy()
  })
})
