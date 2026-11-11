import { describe, expect, it } from 'vitest'
import {
  dropIndex,
  addTile, defaultLayout, layoutKey, moveBy, moveTile, nudgeSize, readLayout, removeTile, resizeTile, serverLayoutKey,
  MAX_ROWS, MAX_SPAN, MIN_ROWS, MIN_SPAN, type TileDefault
} from '../layout'

const defs: TileDefault[] = [
  { id: 'stage', span: 7, rows: 2 }, { id: 'job', span: 5 }, { id: 'hotend', span: 3 }, { id: 'bed', span: 3 }, { id: 'graph', span: 12 }
]
const ids = (l: { tiles: { id: string }[] }) => l.tiles.map(t => t.id)

describe('the default layout', () => {
  it('lists every tile in order at its own size, with nothing hidden', () => {
    const l = defaultLayout(defs)
    expect(ids(l)).toEqual(['stage', 'job', 'hotend', 'bed', 'graph'])
    expect(l.tiles[0]).toEqual({ id: 'stage', span: 7, rows: 2 })
    expect(l.tiles[1]).toEqual({ id: 'job', span: 5, rows: 1 })
    expect(l.hidden).toEqual([])
  })
})

describe('moving tiles', () => {
  it('moves a tile to a place in the order', () => {
    expect(ids(moveTile(defaultLayout(defs), 'graph', 0))).toEqual(['graph', 'stage', 'job', 'hotend', 'bed'])
    expect(ids(moveTile(defaultLayout(defs), 'stage', 3))).toEqual(['job', 'hotend', 'bed', 'stage', 'graph'])
  })
  it('moves a tile one step and stops at the ends', () => {
    expect(ids(moveBy(defaultLayout(defs), 'job', 1))).toEqual(['stage', 'hotend', 'job', 'bed', 'graph'])
    expect(ids(moveBy(defaultLayout(defs), 'stage', -1))).toEqual(['stage', 'job', 'hotend', 'bed', 'graph'])
    expect(ids(moveBy(defaultLayout(defs), 'graph', 1))).toEqual(['stage', 'job', 'hotend', 'bed', 'graph'])
  })
  it('ignores a tile that is not on the page, and never changes the old layout', () => {
    const l = removeTile(defaultLayout(defs), 'bed')
    expect(moveTile(l, 'bed', 0)).toEqual(l)
    const before = JSON.stringify(l)
    moveTile(l, 'graph', 0)
    expect(JSON.stringify(l)).toBe(before)
  })
})

describe('dropping a held tile on no tile (KAN-1958)', () => {
  // Two rows: a b c on top (c ends at 600), d e below (e ends at 400).
  const slots = [
    { id: 'a', left: 0, top: 0, width: 200, height: 100 },
    { id: 'b', left: 200, top: 0, width: 200, height: 100 },
    { id: 'c', left: 400, top: 0, width: 200, height: 100 },
    { id: 'd', left: 0, top: 120, width: 200, height: 100 },
    { id: 'e', left: 200, top: 120, width: 200, height: 100 }
  ]
  it('goes to the empty end of the row it is in', () => {
    expect(dropIndex(slots, 'a', 700, 150)).toBe(4)
    expect(dropIndex(slots, 'e', 700, 50)).toBe(3)
  })
  it('goes before the first tile of a row when left of it, after the ones left of the pointer', () => {
    expect(dropIndex(slots, 'e', -10, 50)).toBe(0)
    expect(dropIndex(slots, 'a', 350, 150)).toBe(4)
  })
  it('goes first above every tile, last below them, and nowhere in a gap between rows', () => {
    expect(dropIndex(slots, 'c', 10, -20)).toBe(0)
    expect(dropIndex(slots, 'a', 10, 400)).toBe(4)
    expect(dropIndex(slots, 'a', 10, 110)).toBeNull()
  })
  it('a tile moved with dropIndex is never lost or repeated', () => {
    const layout = { tiles: slots.map(s => ({ id: s.id, span: 3, rows: 1 })), hidden: [] }
    const out = moveTile(layout, 'a', dropIndex(slots, 'a', 700, 150)!)
    expect(out.tiles.map(t => t.id)).toEqual(['b', 'c', 'd', 'e', 'a'])
  })
})

describe('resizing tiles', () => {
  it('sets a size and keeps it inside the grid', () => {
    const l = resizeTile(defaultLayout(defs), 'hotend', 6, 2)
    expect(l.tiles.find(t => t.id === 'hotend')).toEqual({ id: 'hotend', span: 6, rows: 2 })
    const big = resizeTile(defaultLayout(defs), 'hotend', 99, 99).tiles.find(t => t.id === 'hotend')!
    expect([big.span, big.rows]).toEqual([MAX_SPAN, MAX_ROWS])
    const small = resizeTile(defaultLayout(defs), 'hotend', -4, 0).tiles.find(t => t.id === 'hotend')!
    expect([small.span, small.rows]).toEqual([MIN_SPAN, MIN_ROWS])
  })
  it('rounds to whole grid steps and ignores nonsense', () => {
    expect(resizeTile(defaultLayout(defs), 'hotend', 4.6, 1.2).tiles[2]).toEqual({ id: 'hotend', span: 5, rows: 1 })
    expect(resizeTile(defaultLayout(defs), 'hotend', Number.NaN, Number.NaN).tiles[2]).toEqual({ id: 'hotend', span: 3, rows: 1 })
  })
  it('nudges by steps and clamps', () => {
    expect(nudgeSize(defaultLayout(defs), 'hotend', 1, 1).tiles[2]).toEqual({ id: 'hotend', span: 4, rows: 2 })
    expect(nudgeSize(defaultLayout(defs), 'graph', 1, 0).tiles[4].span).toBe(12)
    expect(nudgeSize(defaultLayout(defs), 'hotend', -1, -1).tiles[2]).toEqual({ id: 'hotend', span: 3, rows: 1 })
  })
})

describe('adding and removing tiles', () => {
  it('removing hides a tile; adding puts it at the end at its own default size', () => {
    const removed = removeTile(resizeTile(defaultLayout(defs), 'stage', 12, 3), 'stage')
    expect(ids(removed)).toEqual(['job', 'hotend', 'bed', 'graph'])
    expect(removed.hidden).toEqual(['stage'])
    const added = addTile(removed, 'stage', defs)
    expect(ids(added)).toEqual(['job', 'hotend', 'bed', 'graph', 'stage'])
    expect(added.tiles[4]).toEqual({ id: 'stage', span: 7, rows: 2 })
    expect(added.hidden).toEqual([])
  })
  it('can add a tile at a given place', () => {
    const removed = removeTile(defaultLayout(defs), 'bed')
    expect(ids(addTile(removed, 'bed', defs, 1))).toEqual(['stage', 'bed', 'job', 'hotend', 'graph'])
  })
  it('does nothing for an unknown tile or one already shown', () => {
    const l = defaultLayout(defs)
    expect(addTile(l, 'stage', defs)).toEqual(l)
    expect(addTile(l, 'nope', defs)).toEqual(l)
    expect(removeTile(l, 'nope')).toEqual(l)
  })
})

describe('reading a saved layout', () => {
  it('keeps a good one as it is', () => {
    const saved = { tiles: [{ id: 'bed', span: 6, rows: 1 }, { id: 'stage', span: 12, rows: 2 }], hidden: ['job', 'hotend', 'graph'] }
    expect(readLayout(saved, defs)).toEqual(saved)
  })
  it('drops unknown tiles and repeats, restores missing tiles as hidden, clamps sizes', () => {
    const l = readLayout({ tiles: [{ id: 'ghost', span: 4 }, { id: 'bed', span: 99, rows: -3 }, { id: 'bed', span: 5 }, { id: 'job', span: 'wide' }], hidden: ['ghost', 'job', 'stage'] }, defs)!
    expect(l.tiles).toEqual([{ id: 'bed', span: MAX_SPAN, rows: MIN_ROWS }, { id: 'job', span: 5, rows: 1 }])
    expect(l.hidden).toEqual(['stage', 'hotend', 'graph'])
  })
  it('lets a person hide every tile on purpose', () => {
    const l = readLayout({ tiles: [], hidden: ['stage', 'job', 'hotend', 'bed', 'graph'] }, defs)!
    expect(l.tiles).toEqual([])
  })
  it('refuses anything it cannot use, so the page falls back to the default', () => {
    for (const bad of [null, undefined, 7, 'x', [], {}, { tiles: 'a' }, { tiles: [{ id: 'ghost' }] }, { tiles: [null, 3] }, { tiles: [] }]) {
      expect(readLayout(bad, defs)).toBeNull()
    }
  })
})

describe('where a layout is kept', () => {
  it('has a different key for each person and printer', () => {
    expect(layoutKey('acc-1', 'boxwood')).not.toBe(layoutKey('acc-2', 'boxwood'))
    expect(layoutKey('acc-1', 'boxwood')).not.toBe(layoutKey('acc-1', 'walnut'))
    expect(layoutKey(null, 'boxwood')).toBe(layoutKey(null, 'boxwood'))
    expect(layoutKey(null, 'boxwood')).not.toBe(layoutKey('acc-1', 'boxwood'))
  })
  it('makes a server key with no dots or slashes, since those split a settings path', () => {
    expect(serverLayoutKey('a.b/c d', 'x.y')).toMatch(/^[a-z0-9_-]+$/i)
    expect(serverLayoutKey('acc-1', 'boxwood')).not.toBe(serverLayoutKey('acc-2', 'boxwood'))
  })
})
