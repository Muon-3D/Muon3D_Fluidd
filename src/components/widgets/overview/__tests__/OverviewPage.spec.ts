import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Overview from '@/views/Overview.vue'
import { overviewTiles } from '../registry'
import { tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const heavy = { 'overview-stage': true, 'thermal-graph': true, 'first-layer-nudges': true, 'material-picker': true }

describe('the tile list', () => {
  it('has unique ids, a width on every screen, and the order the brief gives', () => {
    const ids = overviewTiles.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(['stage', 'job', 'filament', 'hotend', 'bed', 'mode', 'fans', 'jog', 'position', 'macros', 'graph', 'trackpad', 'zoffset', 'camera', 'bedmesh', 'console', 'system', 'care', 'library'])
    for (const t of overviewTiles) {
      expect(t.span).toBeGreaterThan(0); expect(t.span).toBeLessThanOrEqual(12)
      expect([6, 12]).toContain(t.tablet); expect([1, 2]).toContain(t.phone)
    }
  })
})

describe('Overview page', () => {
  it('draws every tile once, in order, with nothing from the old page', () => {
    const store = tileStore({ printing: true })
    const w = mount(Overview, tileMount(store, { stubs: { ...tileMount(store).stubs, ...heavy } }))
    expect(w.findAll('[data-cell]').wrappers.map(c => c.attributes('data-cell'))).toEqual(overviewTiles.filter(t => t.defaultOn).map(t => t.id))
    for (const id of ['stage', 'job', 'filament', 'hotend', 'bed', 'speed', 'fans', 'jog', 'position', 'macros', 'graph']) {
      expect(w.findAll(`[data-tile="${id}"]`)).toHaveLength(1)
    }
    expect(w.find('[data-tid="overview-customise"]').exists()).toBe(false)
    w.destroy()
  })

  it('renders every tile on a printer that reports nothing', () => {
    const store = tileStore({ empty: true })
    const w = mount(Overview, tileMount(store, { stubs: { ...tileMount(store).stubs, ...heavy } }))
    expect(w.findAll('[data-tile]')).toHaveLength(overviewTiles.filter(t => t.defaultOn).length)
    expect(w.find('[data-tile="filament"]').text()).toContain('Unknown')
    w.destroy()
  })

  it('gives each cell its widths for the three screen sizes', () => {
    const store = tileStore()
    const w = mount(Overview, tileMount(store, { stubs: { ...tileMount(store).stubs, ...heavy } }))
    const style = w.find('[data-cell="hotend"]').attributes('style')
    expect(style).toContain('--span: 3'); expect(style).toContain('--tablet: 6'); expect(style).toContain('--phone: 1')
    w.destroy()
  })
})
