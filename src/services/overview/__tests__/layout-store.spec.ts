import { describe, expect, it } from 'vitest'
import { defaultLayout, layoutKey, serverLayoutKey, type TileDefault } from '../layout'
import { loadLayout, saveLayout, staleLayout } from '../layout-store'

const defs: TileDefault[] = [{ id: 'stage', span: 7, rows: 2 }, { id: 'job', span: 5 }, { id: 'bed', span: 3 }]
const ctx = { accountId: 'acc-1', printerId: 'boxwood' }

function memory (initial: Record<string, string> = {}) {
  const data = { ...initial }
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v } }
}
const mine = { tiles: [{ id: 'bed', span: 6, rows: 1 }], hidden: ['stage', 'job'] }

describe('saving and loading the Overview layout', () => {
  it('shows the default when nothing is saved', () => {
    expect(loadLayout(ctx, undefined, memory(), defs)).toEqual(defaultLayout(defs))
  })

  it('keeps it in the browser per person and per printer', () => {
    const storage = memory()
    saveLayout(ctx, mine, storage, 5)
    expect(Object.keys(storage.data)).toEqual([layoutKey('acc-1', 'boxwood')])
    expect(loadLayout(ctx, undefined, storage, defs)).toEqual(mine)
    expect(loadLayout({ accountId: 'acc-2', printerId: 'boxwood' }, undefined, storage, defs)).toEqual(defaultLayout(defs))
    expect(loadLayout({ accountId: 'acc-1', printerId: 'walnut' }, undefined, storage, defs)).toEqual(defaultLayout(defs))
  })

  it('returns the copy to send to the printer settings', () => {
    const record = saveLayout(ctx, mine, memory(), 123)
    expect(record).toEqual({ version: 3, savedAt: 123, ...mine })
  })

  it('follows the person to another browser through the printer settings', () => {
    const saved = saveLayout(ctx, mine, memory(), 5)
    const fresh = memory()
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: saved }, fresh, defs)).toEqual(mine)
    expect(loadLayout({ accountId: 'acc-2', printerId: 'boxwood' }, { [serverLayoutKey('acc-1', 'boxwood')]: saved }, fresh, defs)).toEqual(defaultLayout(defs))
  })

  it("uses the printer's copy over this browser's, whatever the clocks say", () => {
    // A device with a fast clock must not pin its layout over a later save elsewhere.
    const storage = memory()
    saveLayout(ctx, mine, storage, 9_999_999_999_999)
    const server = saveLayout(ctx, defaultLayout(defs), memory(), 1)
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: server }, storage, defs)).toEqual(defaultLayout(defs))
    // With no copy on the printer, this browser's copy is used.
    expect(loadLayout(ctx, {}, storage, defs)).toEqual(mine)
  })

  it('ignores a bad copy and uses the other one, or the default', () => {
    const good = saveLayout(ctx, mine, memory(), 5)
    const key = layoutKey('acc-1', 'boxwood')
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: good }, memory({ [key]: '{not json' }), defs)).toEqual(mine)
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: { tiles: 4 } }, memory({ [key]: JSON.stringify({ tiles: [{ id: 'ghost' }] }) }), defs)).toEqual(defaultLayout(defs))
    expect(loadLayout(ctx, 'junk', memory({ [key]: 'null' }), defs)).toEqual(defaultLayout(defs))
  })

  it('cleans a saved copy that names tiles it should not', () => {
    const storage = memory({ [layoutKey('acc-1', 'boxwood')]: JSON.stringify({ version: 2, savedAt: 1, tiles: [{ id: 'ghost', span: 4 }, { id: 'job', span: 40, rows: 9 }], hidden: [] }) })
    expect(loadLayout(ctx, undefined, storage, defs)).toEqual({ tiles: [{ id: 'job', span: 12, rows: 4 }], hidden: ['stage', 'bed'] })
  })

  it('KAN-5979: a version 2 copy is read with the four panels set to equal widths, and nothing else touched', () => {
    const four = ['hotend', 'bed', 'position', 'mode']
    const d: TileDefault[] = [{ id: 'stage', span: 7, rows: 2 }, { id: 'job', span: 5 }, { id: 'hotend', span: 3 }, { id: 'bed', span: 3 }, { id: 'position', span: 3 }, { id: 'mode', span: 3 }, { id: 'graph', span: 12 }]
    const old = { version: 2, savedAt: 1, tiles: [{ id: 'job', span: 5, rows: 1 }, { id: 'mode', span: 5, rows: 1 }, { id: 'hotend', span: 2, rows: 1 }, { id: 'graph', span: 6, rows: 1 }, { id: 'bed', span: 2, rows: 1 }, { id: 'position', span: 4, rows: 1 }], hidden: ['stage'] }
    const storage = memory({ [layoutKey('acc-1', 'boxwood')]: JSON.stringify(old) })
    const out = loadLayout(ctx, undefined, storage, d)
    expect(out.tiles.map(t => t.id)).toEqual(['job', 'mode', 'hotend', 'graph', 'bed', 'position'])
    expect(out.tiles.filter(t => four.includes(t.id)).map(t => t.span)).toEqual([3, 3, 3, 3])
    expect(out.tiles.find(t => t.id === 'job')).toEqual({ id: 'job', span: 5, rows: 1 })
    expect(out.tiles.find(t => t.id === 'graph')).toEqual({ id: 'graph', span: 6, rows: 1 })
    expect(out.hidden).toEqual(['stage'])
    // No "new layout" notice for it, and the same from the printer's copy.
    expect(staleLayout(ctx, undefined, storage, d)).toBe(false)
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: old }, memory(), d).tiles.find(t => t.id === 'mode')!.span).toBe(3)
  })

  it('KAN-5979: a version 3 copy keeps a width the person chose for those panels (negative control)', () => {
    const d: TileDefault[] = [{ id: 'hotend', span: 3 }, { id: 'bed', span: 3 }]
    const storage = memory({ [layoutKey('acc-1', 'boxwood')]: JSON.stringify({ version: 3, savedAt: 1, tiles: [{ id: 'hotend', span: 6, rows: 1 }, { id: 'bed', span: 3, rows: 1 }], hidden: [] }) })
    expect(loadLayout(ctx, undefined, storage, d).tiles[0].span).toBe(6)
  })

  it('survives a browser that will not store or read', () => {
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') } }
    expect(() => saveLayout(ctx, mine, broken, 1)).not.toThrow()
    expect(loadLayout(ctx, undefined, broken, defs)).toEqual(defaultLayout(defs))
  })
})
