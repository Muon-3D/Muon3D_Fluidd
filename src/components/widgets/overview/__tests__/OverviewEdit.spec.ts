import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Overview from '@/views/Overview.vue'
import { overviewTiles } from '../registry'
import { defaultLayout, layoutKey, serverLayoutKey } from '@/services/overview/layout'
import { widgetsFor } from '@/services/overview/widgets'
import { resetSocket, socket, tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const heavy = { 'overview-stage': true, 'thermal-graph': true, 'first-layer-nudges': true, 'material-picker': true, 'control-move': true }
const allIds = overviewTiles.map(t => t.id)
const defaults = defaultLayout(widgetsFor(overviewTiles, true))
const onIds = defaults.tiles.map(t => t.id)
const mine = { version: 1, savedAt: 5, tiles: [{ id: 'bed', span: 6, rows: 1 }, { id: 'stage', span: 12, rows: 2 }], hidden: allIds.filter(i => i !== 'bed' && i !== 'stage') }

function open (options: { printing?: boolean; layouts?: Record<string, unknown> } = {}) {
  const store = tileStore({ printing: options.printing })
  if (options.layouts) store.state.config.uiSettings.overview = { layouts: options.layouts }
  const w = mount(Overview, tileMount(store, { stubs: { ...tileMount(store).stubs, ...heavy } }))
  return { w, store }
}
const cells = (w: Wrapper<any>) => w.findAll('[data-cell]').wrappers.map(c => c.attributes('data-cell'))
const grip = (w: Wrapper<any>, id: string) => w.find(`[data-cell="${id}"] [data-tid="tile-grip"]`)
const saved = (key = layoutKey(null, 'http://mock.local')) => JSON.parse(localStorage.getItem(key) ?? 'null')

beforeEach(() => { localStorage.clear(); window.scrollBy = vi.fn() as unknown as typeof window.scrollBy })
afterEach(() => { resetSocket(); vi.restoreAllMocks() })

describe('Overview, normal mode', () => {
  it('has an Edit button and no handles, tray or Done', () => {
    const { w } = open()
    expect(w.find('[data-tid="edit-open"]').text()).toBe('Edit')
    for (const tid of ['tile-grip', 'tile-resize', 'tile-remove', 'widget-sheet-open', 'edit-done', 'edit-reset']) expect(w.find(`[data-tid="${tid}"]`).exists()).toBe(false)
    expect(w.find('[data-tid="tile-body"]').attributes('inert')).toBeUndefined()
    w.destroy()
  })

  it('shows a saved layout: order, size, and tiles put away', () => {
    const { w } = open({ layouts: { [serverLayoutKey(null, 'http://mock.local')]: mine } })
    expect(cells(w)).toEqual(['bed', 'stage'])
    expect(w.find('[data-cell="bed"]').attributes('style')).toContain('--span: 6')
    w.destroy()
  })

  it('falls back to the default for a bad saved layout and never blanks the page', () => {
    for (const bad of ['{not json', '{"tiles":[{"id":"ghost"}]}', 'null', '"x"', '{"tiles":7}']) {
      localStorage.setItem(layoutKey(null, 'http://mock.local'), bad)
      const { w } = open({ layouts: { [serverLayoutKey(null, 'http://mock.local')]: 'junk' } })
      expect(cells(w)).toEqual(onIds)
      w.destroy()
    }
  })

  it('drops unknown tiles in a saved layout and puts missing ones away', () => {
    localStorage.setItem(layoutKey(null, 'http://mock.local'), JSON.stringify({ version: 1, savedAt: 1, tiles: [{ id: 'ghost', span: 3 }, { id: 'jog', span: 40, rows: 9 }], hidden: [] }))
    const { w } = open()
    expect(cells(w)).toEqual(['jog'])
    // 40 by 9 is no size; the nearest the Jog widget offers is its L.
    expect(w.find('[data-cell="jog"]').attributes('style')).toContain('--span: 6')
    w.destroy()
  })
})

describe('Overview, edit mode', () => {
  it('shows a grip, a corner handle and a remove button on every tile, the tray, Reset and Done', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    expect(w.find('[data-tid="edit-open"]').exists()).toBe(false)
    expect(w.findAll('[data-tid="tile-grip"]')).toHaveLength(onIds.length)
    expect(w.findAll('[data-tid="tile-resize"]')).toHaveLength(onIds.length)
    expect(w.findAll('[data-tid="tile-remove"]')).toHaveLength(onIds.length)
    expect(w.find('[data-tid="widget-sheet-open"]').text()).toBe('Add widget')
    expect(w.find('[data-tid="edit-reset"]').text()).toBe('Reset layout')
    expect(w.find('[data-tid="edit-done"]').text()).toBe('Done')
    w.destroy()
  })

  it('makes tiles inert: nothing pressed in a tile reaches the printer', async () => {
    const { w } = open({ printing: true })
    await w.find('[data-tid="edit-open"]').trigger('click')
    expect(w.find('[data-cell="job"] [data-tid="tile-body"]').attributes('inert')).toBeDefined()
    expect(w.find('[data-cell="job"] [data-tid="tile-body"]').attributes('aria-hidden')).toBe('true')
    await w.find('[data-tid="job-pause"]').trigger('click')
    await w.find('[data-tid="job-stop"]').trigger('click')
    for (const b of w.findAll('[data-tid="tile-body"] button').wrappers) await b.trigger('click')
    for (const b of w.findAll('[data-tid="tile-body"] input').wrappers) await b.setValue('99')
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    expect(socket.printerPrintPause).not.toHaveBeenCalled()
    expect(socket.printerPrintCancel).not.toHaveBeenCalled()
    expect(socket.printerPrintResume).not.toHaveBeenCalled()
    w.destroy()
  })

  it('works again after Done', async () => {
    const { w } = open({ printing: true })
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-tid="edit-done"]').trigger('click')
    expect(w.find('[data-tid="tile-body"]').attributes('inert')).toBeUndefined()
    await w.find('[data-tid="job-pause"]').trigger('click')
    expect(socket.printerPrintPause).toHaveBeenCalledTimes(1)
    w.destroy()
  })

  it('puts a widget away and adds it back from the Add widget sheet, at the end', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-cell="position"] [data-tid="tile-remove"]').trigger('click')
    expect(cells(w)).not.toContain('position')
    await w.find('[data-tid="widget-sheet-open"]').trigger('click')
    expect(w.find('[data-tid="widget-card-position"]').text()).toContain('Position')
    await w.find('[data-tid="widget-add-position"]').trigger('click')
    expect(cells(w).slice(-1)).toEqual(['position'])
    expect(w.find('[data-tid="widget-remove-position"]').exists()).toBe(true)
    await w.find('[data-tid="widget-remove-position"]').trigger('click')
    expect(cells(w)).not.toContain('position')
    w.destroy()
  })

  it('adds a widget that is off by default at the size picked, and shows On for those on the page', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-tid="widget-sheet-open"]').trigger('click')
    expect(w.find('[data-tid="widget-remove-job"]').text()).toBe('−')
    expect(w.find('[data-tid="widget-sheet"]').text()).not.toMatch(/Add to Overview|\bOn\b/)
    expect(w.find('[data-tid="widget-add-job"]').exists()).toBe(false)
    expect(w.find('[data-tid="widget-size-console-S"]').exists()).toBe(false)
    await w.find('[data-tid="widget-size-camera-L"]').trigger('click')
    await w.find('[data-tid="widget-add-camera"]').trigger('click')
    expect(w.find('[data-cell="camera"]').attributes('style')).toContain('--span: 12')
    expect(w.find('[data-cell="camera"]').attributes('style')).toContain('--rows: 2')
    w.destroy()
  })

  it('never offers Z offset on a Muon printer (or one not yet known), and offers it on others', async () => {
    const muon = open()
    await muon.w.find('[data-tid="edit-open"]').trigger('click')
    await muon.w.find('[data-tid="widget-sheet-open"]').trigger('click')
    expect(muon.w.find('[data-tid="widget-card-zoffset"]').exists()).toBe(false)
    expect(muon.w.find('[data-tid="widget-card-fans"]').exists()).toBe(true)
    muon.w.destroy()
    const store = tileStore()
    ;(store.getters as any)['server/isMuonPrinter'] = false
    const other = mount(Overview, tileMount(store, { stubs: { ...tileMount(store).stubs, ...heavy } }))
    await other.find('[data-tid="edit-open"]').trigger('click')
    await other.find('[data-tid="widget-sheet-open"]').trigger('click')
    expect(other.find('[data-tid="widget-card-zoffset"]').exists()).toBe(true)
    expect(cells(other)).not.toContain('zoffset')
    other.destroy()
    const known = tileStore()
    ;(known.getters as any)['server/isMuonPrinter'] = true
    const muonKnown = mount(Overview, tileMount(known, { stubs: { ...tileMount(known).stubs, ...heavy } }))
    await muonKnown.find('[data-tid="edit-open"]').trigger('click')
    await muonKnown.find('[data-tid="widget-sheet-open"]').trigger('click')
    expect(muonKnown.find('[data-tid="widget-card-zoffset"]').exists()).toBe(false)
    muonKnown.destroy()
  })

  it('searches and filters the sheet by category', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-tid="widget-sheet-open"]').trigger('click')
    await w.find('[data-tid="widget-search"]').setValue('mesh')
    expect(w.findAll('[data-tid^="widget-card-"]').wrappers.map(c => c.attributes('data-tid'))).toEqual(['widget-card-bedmesh'])
    await w.find('[data-tid="widget-search"]').setValue('zzz')
    expect(w.find('[data-tid="widget-none"]').exists()).toBe(true)
    await w.find('[data-tid="widget-search"]').setValue('')
    await w.find('[data-tid="widget-cat-Motion"]').trigger('click')
    expect(w.findAll('[data-tid^="widget-card-"]').wrappers.map(c => c.attributes('data-tid'))).toEqual(['widget-card-position', 'widget-card-trackpad', 'widget-card-jog'])
    w.destroy()
  })

  it('lets the 3D view be hidden too', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-cell="stage"] [data-tid="tile-remove"]').trigger('click')
    expect(w.find('[data-tile="stage"]').exists()).toBe(false)
    await w.find('[data-tid="widget-sheet-open"]').trigger('click')
    expect(w.find('[data-tid="widget-add-stage"]').exists()).toBe(true)
    expect(w.find('[data-tid="widget-size-stage-S"]').exists()).toBe(false)
    w.destroy()
  })

  it('moves a tile with the arrow keys and resizes it with shift and the arrows', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    expect(grip(w, 'job').attributes('aria-label')).toContain('Move Print job')
    await grip(w, 'job').trigger('keydown', { key: 'ArrowRight' })
    expect(cells(w).slice(0, 3)).toEqual(['stage', 'filament', 'job'])
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft' })
    expect(cells(w).slice(0, 3)).toEqual(['stage', 'job', 'filament'])
    // Shift and the arrows step through the sizes the widget offers, never between them.
    await grip(w, 'job').trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--rows: 2')
    await grip(w, 'job').trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--rows: 1')
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--span: 3')
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--span: 3')
    expect(w.find('[data-tid="edit-status"]').text()).toContain('3 columns wide')
    w.destroy()
  })

  it('moves a tile by dragging its grip onto another tile', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    // The pointer finds a tile by its slot in the grid (jsdom lays nothing out, so give "mode" one).
    const target = w.find('[data-cell="mode"]').element
    const slot = { offsetParent: document.body, offsetLeft: 0, offsetTop: 0, offsetWidth: 100, offsetHeight: 100 }
    for (const [k, v] of Object.entries(slot)) Object.defineProperty(target, k, { configurable: true, get: () => v })
    await grip(w, 'graph').trigger('pointerdown', { button: 0 })
    // The others make room as it passes over them, before it is let go.
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 5, clientY: 5 }))
    await w.vm.$nextTick()
    expect(cells(w).indexOf('graph')).toBe(onIds.indexOf('mode'))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await w.vm.$nextTick()
    expect(cells(w).indexOf('graph')).toBe(onIds.indexOf('mode'))
    w.destroy()
  })

  it('resizes by dragging the corner handle, snapping to the nearest size the widget offers', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    const rect = (width: number, height: number) => ({ x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON: () => ({}) })
    vi.spyOn(w.find('[data-tid="overview-grid"]').element, 'getBoundingClientRect').mockReturnValue(rect(1184, 800))
    vi.spyOn(w.find('[data-cell="macros"]').element, 'getBoundingClientRect').mockReturnValue(rect(380, 120))
    // One column is (1184 + 16) / 12 = 100 px.
    await w.find('[data-cell="macros"] [data-tid="tile-resize"]').trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: -300, clientY: 0 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: -300, clientY: 0 }))
    await w.vm.$nextTick()
    expect(w.find('[data-cell="macros"]').attributes('style')).toContain('--span: 6')
    w.destroy()
  })

  it('snaps a drag to a size the widget offers when the size asked for does not exist', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    const rect = (width: number, height: number) => ({ x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON: () => ({}) })
    vi.spyOn(w.find('[data-tid="overview-grid"]').element, 'getBoundingClientRect').mockReturnValue(rect(1184, 800))
    vi.spyOn(w.find('[data-cell="stage"]').element, 'getBoundingClientRect').mockReturnValue(rect(780, 320))
    // The printer view has no 4 by 1; dragging it small lands on its M, 8 by 2.
    await w.find('[data-cell="stage"] [data-tid="tile-resize"]').trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: -400, clientY: -170 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: -400, clientY: -170 }))
    await w.vm.$nextTick()
    expect(w.find('[data-cell="stage"]').attributes('style')).toContain('--span: 8')
    expect(w.find('[data-cell="stage"]').attributes('style')).toContain('--rows: 2')
    w.destroy()
  })

  it('on a narrow screen offers reordering and hiding, but no resizing', async () => {
    const listeners: Array<(e: { matches: boolean }) => void> = []
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: (_: string, f: any) => listeners.push(f), removeEventListener: vi.fn() })))
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    expect(w.findAll('[data-tid="tile-resize"]')).toHaveLength(0)
    expect(w.findAll('[data-tid="tile-grip"]')).toHaveLength(onIds.length)
    expect(w.findAll('[data-tid="tile-remove"]')).toHaveLength(onIds.length)
    await grip(w, 'mode').trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(w.find('[data-cell="mode"]').attributes('style')).toContain('--span: 6')
    w.destroy()
    vi.unstubAllGlobals()
  })

  it('Done saves in the browser and to the printer settings, per person and printer', async () => {
    const { w, store } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await grip(w, 'graph').trigger('keydown', { key: 'ArrowLeft' })
    await w.find('[data-cell="macros"] [data-tid="tile-remove"]').trigger('click')
    expect(saved()).toBeNull()
    await w.find('[data-tid="edit-done"]').trigger('click')
    const local = saved()
    expect(local.hidden).toEqual([...defaults.hidden, 'macros'])
    expect(local.tiles.map((t: { id: string }) => t.id).slice(3, 6)).toEqual(['mode', 'graph', 'position'])
    expect(store.dispatch).toHaveBeenCalledWith('config/saveByPath', {
      // Only this person's own key: never the whole map, which could wipe another person's layout.
      path: `uiSettings.overview.layouts.${serverLayoutKey(null, 'http://mock.local')}`,
      value: local,
      server: true
    })
    expect(w.find('[data-tid="edit-open"]').exists()).toBe(true)
    // Opening the page again shows what was saved.
    const again = open()
    expect(cells(again.w)).not.toContain('macros')
    again.w.destroy()
    w.destroy()
  })

  it('does not save when nothing changed', async () => {
    const { w, store } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-tid="edit-done"]').trigger('click')
    expect(store.dispatch).not.toHaveBeenCalled()
    expect(saved()).toBeNull()
    w.destroy()
  })

  it('Reset layout brings every widget back to its start, and Done keeps that', async () => {
    const { w, store } = open({ layouts: { [serverLayoutKey(null, 'http://mock.local')]: mine } })
    expect(cells(w)).toEqual(['bed', 'stage'])
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-tid="edit-reset"]').trigger('click')
    expect(cells(w)).toEqual(onIds)
    expect(w.find('[data-cell="mode"]').attributes('style')).toContain('--span: 6')
    await w.find('[data-tid="edit-done"]').trigger('click')
    expect(saved().tiles).toEqual(defaultLayout(overviewTiles).tiles)
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    w.destroy()
  })
})
