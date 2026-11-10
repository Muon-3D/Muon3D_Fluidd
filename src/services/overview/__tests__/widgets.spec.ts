import { describe, expect, it } from 'vitest'
import { overviewTiles } from '@/components/widgets/overview/registry'
import { addTile, defaultLayout, nudgeSize, readLayout, removeTile, resizeTile, sizeKeyOf, snapSize, type TileDefault } from '../layout'
import { muonHidden, treatAsMuon, searchWidgets, widgetCategories, widgetMeta, widgetsFor } from '../widgets'

const defs: TileDefault[] = overviewTiles
const byId = (id: string) => overviewTiles.find(t => t.id === id)!

describe('the default layout', () => {
  const layout = defaultLayout(defs)
  const ids = layout.tiles.map(t => t.id)
  const at = (id: string) => layout.tiles.find(t => t.id === id)!

  it('keeps the current Overview: the printer wider on the left, job and filament stacked on the right', () => {
    expect(ids.slice(0, 3)).toEqual(['stage', 'job', 'filament'])
    expect(at('stage')).toMatchObject({ span: 8, rows: 2 })
    expect(at('job')).toMatchObject({ span: 4, rows: 1 })
    expect(at('filament')).toMatchObject({ span: 4, rows: 1 })
    expect(at('stage').span).toBeGreaterThan(at('job').span)
  })

  it('has a row under them: hotend, bed and print mode (no Fans, KAN-1951)', () => {
    expect(ids.slice(3, 6)).toEqual(['hotend', 'bed', 'mode'])
    for (const id of ['hotend', 'bed']) expect(at(id)).toMatchObject({ span: 3, rows: 1 })
    expect(at('mode')).toMatchObject({ span: 6, rows: 1 })
  })

  it('has the Movement trackpad, then jog and position, quick commands and the temperatures', () => {
    expect(ids.slice(6)).toEqual(['trackpad', 'jog', 'position', 'macros', 'graph'])
    expect(at('trackpad')).toMatchObject({ span: 8, rows: 2 })
    expect(at('jog')).toMatchObject({ span: 4, rows: 2 })
  })

  it('puts everything else away until it is added', () => {
    expect(layout.hidden).toEqual(['fans', 'zoffset', 'camera', 'bedmesh', 'console', 'system', 'care', 'library'])
    expect(ids.length + layout.hidden.length).toBe(overviewTiles.length)
  })

  it('has the first four rows no wider than the 12 columns', () => {
    expect(at('hotend').span + at('bed').span + at('mode').span).toBe(12)
    expect(at('stage').span + at('job').span).toBe(12)
  })
})

describe('the catalogue', () => {
  it('has unique ids, a category from the list, and S, M or L sizes inside the grid', () => {
    expect(new Set(widgetMeta.map(w => w.id)).size).toBe(widgetMeta.length)
    for (const w of widgetMeta) {
      expect(widgetCategories).toContain(w.category)
      expect(w.sizes.length).toBeGreaterThanOrEqual(2)
      for (const z of w.sizes) {
        expect(['S', 'M', 'L']).toContain(z.key)
        expect(z.span).toBeGreaterThanOrEqual(3); expect(z.span).toBeLessThanOrEqual(12)
        expect(z.rows).toBeGreaterThanOrEqual(1); expect(z.rows).toBeLessThanOrEqual(4)
      }
      expect(w.sizes.map(z => z.key)).toContain(w.size)
    }
  })

  it('gives S exactly 3 columns', () => {
    for (const w of widgetMeta) for (const z of w.sizes.filter(s => s.key === 'S')) expect(z.span).toBe(3)
  })

  it('offers the 3D printer only at M, 8 by 2, and L, 12 by 2', () => {
    expect(byId('stage').sizes).toEqual([{ key: 'M', span: 8, rows: 2 }, { key: 'L', span: 12, rows: 2 }])
  })

  it('has Movement, Jog and Position as three separate widgets', () => {
    expect(['trackpad', 'jog', 'position'].every(id => overviewTiles.some(t => t.id === id))).toBe(true)
    expect(byId('trackpad').defaultOn).toBe(true)
    expect(byId('macros').title).toBe('Quick commands')
  })

  it('draws every widget with a component, and defaults to the size it declares', () => {
    for (const t of overviewTiles) {
      expect(t.component).toBeTruthy()
      expect({ span: t.span, rows: t.rows }).toEqual(t.sizes.find(s => s.key === t.size) && { span: t.sizes.find(s => s.key === t.size)!.span, rows: t.sizes.find(s => s.key === t.size)!.rows })
    }
  })

  it('searches by title, blurb and category', () => {
    expect(searchWidgets(widgetMeta, 'mesh', null).map(w => w.id)).toEqual(['bedmesh'])
    expect(searchWidgets(widgetMeta, '', 'Library').map(w => w.id)).toEqual(['library'])
    expect(searchWidgets(widgetMeta, 'bed', 'Print').map(w => w.id)).toEqual(['bedmesh'])
    expect(searchWidgets(widgetMeta, '  ', null)).toHaveLength(widgetMeta.length)
  })
})

describe('snapSize', () => {
  const sizes = [{ key: 'S', span: 3, rows: 1 }, { key: 'M', span: 6, rows: 1 }, { key: 'L', span: 12, rows: 2 }]

  it('returns the size asked for when the widget offers it', () => {
    expect(snapSize(sizes, 6, 1)).toEqual(sizes[1])
  })

  it('snaps one that does not exist to the nearest', () => {
    expect(snapSize(sizes, 4, 1)).toEqual(sizes[0])
    expect(snapSize(sizes, 5, 1)).toEqual(sizes[1])
    expect(snapSize(sizes, 11, 2)).toEqual(sizes[2])
    expect(snapSize(sizes, 9, 4)).toEqual(sizes[2])
  })

  it('weighs rows above columns', () => {
    expect(snapSize([{ key: 'M', span: 6, rows: 1 }, { key: 'L', span: 8, rows: 2 }], 6, 2)?.key).toBe('L')
  })

  it('goes to the smaller on a tie', () => {
    expect(snapSize(sizes.slice(0, 2), 4.5 as number, 1)?.key).toBe('S')
  })

  it('never allows a size wider than the room it is placed in', () => {
    expect(snapSize(sizes, 12, 2, 6)).toEqual(sizes[1])
    expect(snapSize(sizes, 12, 2, 3)).toEqual(sizes[0])
  })

  it('uses the narrowest size rather than none when nothing fits', () => {
    expect(snapSize([{ key: 'M', span: 8, rows: 2 }, { key: 'L', span: 12, rows: 2 }], 12, 2, 4)?.key).toBe('M')
  })

  it('says nothing when the widget has no sizes', () => {
    expect(snapSize([], 4, 1)).toBeNull()
  })

  it('finds which named size a placed tile is', () => {
    expect(sizeKeyOf({ sizes }, { span: 12, rows: 2 })).toBe('L')
    expect(sizeKeyOf({ sizes }, { span: 7, rows: 1 })).toBeNull()
    expect(sizeKeyOf({}, { span: 7, rows: 1 })).toBeNull()
  })
})

describe('sizes in the layout', () => {
  const layout = defaultLayout(defs)

  it('resizing snaps to a size the widget offers', () => {
    const next = resizeTile(layout, 'stage', 4, 1, defs)
    expect(next.tiles.find(t => t.id === 'stage')).toMatchObject({ span: 8, rows: 2 })
    const wide = resizeTile(layout, 'stage', 12, 4, defs)
    expect(wide.tiles.find(t => t.id === 'stage')).toMatchObject({ span: 12, rows: 2 })
  })

  it('steps through the sizes with the arrows, and stops at the ends', () => {
    const up = nudgeSize(layout, 'hotend', 1, 0, defs)
    expect(up.tiles.find(t => t.id === 'hotend')).toMatchObject({ span: 6, rows: 1 })
    const same = nudgeSize(up, 'hotend', 1, 0, defs)
    expect(same.tiles.find(t => t.id === 'hotend')).toMatchObject({ span: 6, rows: 1 })
    const down = nudgeSize(up, 'hotend', -1, 0, defs)
    expect(down.tiles.find(t => t.id === 'hotend')).toMatchObject({ span: 3, rows: 1 })
    const tall = nudgeSize(layout, 'job', 0, 1, defs)
    expect(tall.tiles.find(t => t.id === 'job')).toMatchObject({ span: 4, rows: 2 })
  })

  it('adds a widget at the size picked, or its default', () => {
    expect(addTile(layout, 'camera', defs, undefined, 'L').tiles.slice(-1)[0]).toEqual({ id: 'camera', span: 12, rows: 2 })
    expect(addTile(layout, 'zoffset', defs).tiles.slice(-1)[0]).toEqual({ id: 'zoffset', span: 3, rows: 1 })
    expect(addTile(layout, 'console', defs, undefined, 'S').tiles.slice(-1)[0]).toEqual({ id: 'console', span: 6, rows: 2 })
  })

  it('snaps a size that does not fit the room when adding', () => {
    expect(addTile(layout, 'camera', defs, undefined, 'L', 6).tiles.slice(-1)[0]).toEqual({ id: 'camera', span: 6, rows: 2 })
  })

  it('removes a widget into the hidden list so Add widget offers it again', () => {
    const next = removeTile(layout, 'bed')
    expect(next.hidden).toContain('bed')
    expect(addTile(next, 'bed', defs).tiles.slice(-1)[0].id).toBe('bed')
  })

  it('leaves a list without sizes behaving as before (the Control page)', () => {
    const plain: TileDefault[] = [{ id: 'a', span: 6 }, { id: 'b', span: 4, rows: 2 }]
    expect(defaultLayout(plain).hidden).toEqual([])
    expect(resizeTile(defaultLayout(plain), 'a', 5, 3, plain).tiles[0]).toEqual({ id: 'a', span: 5, rows: 3 })
    expect(nudgeSize(defaultLayout(plain), 'a', 1, 0, plain).tiles[0].span).toBe(7)
  })
})

describe('migrating a saved layout', () => {
  const saved = (tiles: Array<Record<string, unknown>>, hidden: unknown[] = []) => ({ version: 1, savedAt: 1, tiles, hidden })

  it('maps the old Speed / flow tile to Print mode, in the same place', () => {
    const out = readLayout(saved([{ id: 'job', span: 5, rows: 1 }, { id: 'speed', span: 3, rows: 1 }, { id: 'graph', span: 12, rows: 1 }]), defs)!
    expect(out.tiles.map(t => t.id)).toEqual(['job', 'mode', 'graph'])
    expect(out.tiles[1]).toEqual({ id: 'mode', span: 6, rows: 1 })
    expect(out.hidden).not.toContain('speed')
    expect(out.hidden).not.toContain('mode')
  })

  it('maps a hidden Speed / flow to a hidden Print mode', () => {
    const out = readLayout(saved([{ id: 'job' }], ['speed']), defs)!
    expect(out.hidden).toContain('mode')
    expect(out.hidden.filter(h => h === 'mode')).toHaveLength(1)
  })

  it('keeps the ids that still exist (jog, position, zoffset, macros, graph, hotend, bed, fans)', () => {
    const old = ['stage', 'job', 'filament', 'hotend', 'bed', 'fans', 'speed', 'jog', 'position', 'zoffset', 'macros', 'graph']
    const out = readLayout(saved(old.map(id => ({ id, span: 4, rows: 1 }))), defs)!
    expect(out.tiles.map(t => t.id)).toEqual(old.map(id => (id === 'speed' ? 'mode' : id)))
    expect(out.hidden).toEqual(['trackpad', 'camera', 'bedmesh', 'console', 'system', 'care', 'library'])
  })

  it('drops unknown ids quietly', () => {
    const out = readLayout(saved([{ id: 'ghost' }, { id: 'job', span: 4 }, { id: 'zoomer' }], ['phantom']), defs)!
    expect(out.tiles.map(t => t.id)).toEqual(['job'])
    expect(out.hidden).not.toContain('ghost'); expect(out.hidden).not.toContain('phantom')
  })

  it('does not draw a widget twice when both its old and new id are saved', () => {
    const out = readLayout(saved([{ id: 'mode', span: 6, rows: 1 }, { id: 'speed', span: 3, rows: 1 }]), defs)!
    expect(out.tiles).toEqual([{ id: 'mode', span: 6, rows: 1 }])
  })

  it('snaps the sizes of an old layout to ones the widgets offer', () => {
    const out = readLayout(saved([{ id: 'stage', span: 7, rows: 2 }, { id: 'job', span: 5, rows: 1 }, { id: 'jog', span: 4, rows: 2 }]), defs)!
    expect(out.tiles).toEqual([{ id: 'stage', span: 8, rows: 2 }, { id: 'job', span: 4, rows: 1 }, { id: 'jog', span: 4, rows: 2 }])
  })

  it('refuses a layout with nothing usable in it, so the default is used', () => {
    expect(readLayout(saved([{ id: 'ghost' }]), defs)).toBeNull()
  })

  it('brings widgets the saved copy never heard of back hidden, not on the page', () => {
    const out = readLayout(saved([{ id: 'job', span: 4 }]), defs)!
    expect(out.hidden).toContain('trackpad')
    expect(out.tiles).toHaveLength(1)
  })
})

describe('Muon printers', () => {
  const muonDefs = widgetsFor(defs as Array<TileDefault & { id: string }>, true)

  it('knows a Muon printer by its components, and treats an unknown list as Muon', () => {
    expect(treatAsMuon(true)).toBe(true)
    expect(treatAsMuon(false)).toBe(false)
    // Not known yet: counts as Muon, so Z offset never flashes up on one.
    expect(treatAsMuon(null)).toBe(true)
    expect(treatAsMuon(undefined)).toBe(true)
  })

  it('never offers Z offset on a Muon printer, and keeps it elsewhere', () => {
    expect(muonHidden).toEqual(['zoffset'])
    expect(muonDefs.some(d => d.id === 'zoffset')).toBe(false)
    expect(widgetsFor(overviewTiles, true).some(w => w.id === 'zoffset')).toBe(false)
    expect(searchWidgets(widgetsFor(overviewTiles, true), '', null).some(w => w.id === 'zoffset')).toBe(false)
    expect(widgetsFor(overviewTiles, false).some(w => w.id === 'zoffset')).toBe(true)
    expect(widgetsFor(overviewTiles, false)).toHaveLength(overviewTiles.length)
  })

  it('has no Z offset in the default layout or the hidden list on a Muon printer', () => {
    const layout = defaultLayout(muonDefs)
    expect(layout.tiles.some(t => t.id === 'zoffset')).toBe(false)
    expect(layout.hidden).not.toContain('zoffset')
  })

  it('drops a saved Z offset widget, placed or put away, on a Muon printer', () => {
    const saved = { version: 1, savedAt: 1, tiles: [{ id: 'job', span: 4, rows: 1 }, { id: 'zoffset', span: 3, rows: 1 }, { id: 'graph', span: 12, rows: 1 }], hidden: [] }
    const out = readLayout(saved, muonDefs)!
    expect(out.tiles.map(t => t.id)).toEqual(['job', 'graph'])
    expect(out.hidden).not.toContain('zoffset')
    const away = readLayout({ ...saved, tiles: [saved.tiles[0]], hidden: ['zoffset'] }, muonDefs)!
    expect(away.hidden).not.toContain('zoffset')
  })

  it('keeps a saved Z offset widget on a printer that is not Muon', () => {
    const saved = { version: 1, savedAt: 1, tiles: [{ id: 'job', span: 4, rows: 1 }, { id: 'zoffset', span: 3, rows: 1 }], hidden: [] }
    expect(readLayout(saved, defs)!.tiles.map(t => t.id)).toEqual(['job', 'zoffset'])
  })
})
