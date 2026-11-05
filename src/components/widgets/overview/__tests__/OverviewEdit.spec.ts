import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Overview from '@/views/Overview.vue'
import { overviewTiles } from '../registry'
import { defaultLayout, layoutKey, serverLayoutKey } from '@/services/overview/layout'
import { resetSocket, socket, tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const heavy = { 'overview-stage': true, 'thermal-graph': true, 'first-layer-nudges': true, 'material-picker': true }
const allIds = overviewTiles.map(t => t.id)
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
    for (const tid of ['tile-grip', 'tile-resize', 'tile-remove', 'add-tile-tray', 'edit-done', 'edit-reset']) expect(w.find(`[data-tid="${tid}"]`).exists()).toBe(false)
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
      expect(cells(w)).toEqual(allIds)
      w.destroy()
    }
  })

  it('drops unknown tiles in a saved layout and puts missing ones away', () => {
    localStorage.setItem(layoutKey(null, 'http://mock.local'), JSON.stringify({ version: 1, savedAt: 1, tiles: [{ id: 'ghost', span: 3 }, { id: 'jog', span: 40, rows: 9 }], hidden: [] }))
    const { w } = open()
    expect(cells(w)).toEqual(['jog'])
    expect(w.find('[data-cell="jog"]').attributes('style')).toContain('--span: 12')
    w.destroy()
  })
})

describe('Overview, edit mode', () => {
  it('shows a grip, a corner handle and a remove button on every tile, the tray, Reset and Done', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    expect(w.find('[data-tid="edit-open"]').exists()).toBe(false)
    expect(w.findAll('[data-tid="tile-grip"]')).toHaveLength(allIds.length)
    expect(w.findAll('[data-tid="tile-resize"]')).toHaveLength(allIds.length)
    expect(w.findAll('[data-tid="tile-remove"]')).toHaveLength(allIds.length)
    expect(w.find('[data-tid="add-tile-tray"]').exists()).toBe(true)
    expect(w.find('[data-tid="add-none"]').text()).toContain('Every tile is on the page')
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

  it('removes a tile into the tray and adds it back at the end', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-cell="hotend"] [data-tid="tile-remove"]').trigger('click')
    expect(cells(w)).not.toContain('hotend')
    expect(w.find('[data-tid="add-hotend"]').text()).toContain('Hotend')
    await w.find('[data-tid="add-hotend"]').trigger('click')
    expect(cells(w).slice(-1)).toEqual(['hotend'])
    expect(w.find('[data-tid="add-hotend"]').exists()).toBe(false)
    w.destroy()
  })

  it('lets the 3D view be hidden too', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-cell="stage"] [data-tid="tile-remove"]').trigger('click')
    expect(w.find('[data-tile="stage"]').exists()).toBe(false)
    expect(w.find('[data-tid="add-stage"]').exists()).toBe(true)
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
    await grip(w, 'job').trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--span: 6')
    await grip(w, 'job').trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--rows: 2')
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    await grip(w, 'job').trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    expect(w.find('[data-cell="job"]').attributes('style')).toContain('--span: 3')
    expect(w.find('[data-tid="edit-status"]').text()).toContain('3 columns wide')
    w.destroy()
  })

  it('moves a tile by dragging its grip onto another tile', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    const target = w.find('[data-cell="speed"]').element
    document.elementFromPoint = vi.fn(() => target)
    await grip(w, 'graph').trigger('pointerdown', { button: 0 })
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await w.vm.$nextTick()
    expect(cells(w).indexOf('graph')).toBe(allIds.indexOf('speed'))
    w.destroy()
  })

  it('resizes by dragging the corner handle in grid steps', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    const rect = (width: number, height: number) => ({ x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON: () => ({}) })
    vi.spyOn(w.find('[data-tid="overview-grid"]').element, 'getBoundingClientRect').mockReturnValue(rect(1184, 800))
    vi.spyOn(w.find('[data-cell="hotend"]').element, 'getBoundingClientRect').mockReturnValue(rect(280, 120))
    // One column is (1184 + 16) / 12 = 100 px.
    await w.find('[data-cell="hotend"] [data-tid="tile-resize"]').trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 0 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 200, clientY: 0 }))
    await w.vm.$nextTick()
    expect(w.find('[data-cell="hotend"]').attributes('style')).toContain('--span: 5')
    w.destroy()
  })

  it('adds a tile by dragging it from the tray onto the page', async () => {
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-cell="fans"] [data-tid="tile-remove"]').trigger('click')
    const target = w.find('[data-cell="job"]').element
    document.elementFromPoint = vi.fn(() => target)
    vi.spyOn(w.find('[data-tid="overview-grid"]').element, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 900, bottom: 900, width: 900, height: 900, toJSON: () => ({}) })
    await w.find('[data-tid="add-fans"]').trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, clientY: 300 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 300, clientY: 300 }))
    await w.vm.$nextTick()
    expect(cells(w).indexOf('fans')).toBe(1)
    w.destroy()
  })

  it('on a narrow screen offers reordering and hiding, but no resizing', async () => {
    const listeners: Array<(e: { matches: boolean }) => void> = []
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: (_: string, f: any) => listeners.push(f), removeEventListener: vi.fn() })))
    const { w } = open()
    await w.find('[data-tid="edit-open"]').trigger('click')
    expect(w.findAll('[data-tid="tile-resize"]')).toHaveLength(0)
    expect(w.findAll('[data-tid="tile-grip"]')).toHaveLength(allIds.length)
    expect(w.findAll('[data-tid="tile-remove"]')).toHaveLength(allIds.length)
    await grip(w, 'hotend').trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(w.find('[data-cell="hotend"]').attributes('style')).toContain('--span: 3')
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
    expect(local.hidden).toEqual(['macros'])
    expect(local.tiles.map((t: { id: string }) => t.id).slice(-2)).toEqual(['zoffset', 'graph'])
    expect(store.dispatch).toHaveBeenCalledWith('config/saveByPath', {
      path: 'uiSettings.overview.layouts',
      value: { [serverLayoutKey(null, 'http://mock.local')]: local },
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

  it('Reset layout brings every tile back to its start, and Done keeps that', async () => {
    const { w, store } = open({ layouts: { [serverLayoutKey(null, 'http://mock.local')]: mine } })
    expect(cells(w)).toEqual(['bed', 'stage'])
    await w.find('[data-tid="edit-open"]').trigger('click')
    await w.find('[data-tid="edit-reset"]').trigger('click')
    expect(cells(w)).toEqual(allIds)
    expect(w.find('[data-cell="hotend"]').attributes('style')).toContain('--span: 3')
    await w.find('[data-tid="edit-done"]').trigger('click')
    expect(saved().tiles).toEqual(defaultLayout(overviewTiles).tiles)
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    w.destroy()
  })
})
