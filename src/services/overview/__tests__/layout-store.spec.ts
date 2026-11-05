import { describe, expect, it } from 'vitest'
import { defaultLayout, layoutKey, serverLayoutKey, type TileDefault } from '../layout'
import { loadLayout, saveLayout } from '../layout-store'

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
    expect(record).toEqual({ version: 1, savedAt: 123, ...mine })
  })

  it('follows the person to another browser through the printer settings', () => {
    const saved = saveLayout(ctx, mine, memory(), 5)
    const fresh = memory()
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: saved }, fresh, defs)).toEqual(mine)
    expect(loadLayout({ accountId: 'acc-2', printerId: 'boxwood' }, { [serverLayoutKey('acc-1', 'boxwood')]: saved }, fresh, defs)).toEqual(defaultLayout(defs))
  })

  it('uses whichever copy was saved last', () => {
    const older = saveLayout(ctx, defaultLayout(defs), memory(), 1)
    const storage = memory()
    saveLayout(ctx, mine, storage, 9)
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: older }, storage, defs)).toEqual(mine)
    const newer = saveLayout(ctx, defaultLayout(defs), memory(), 20)
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: newer }, storage, defs)).toEqual(defaultLayout(defs))
  })

  it('ignores a bad copy and uses the other one, or the default', () => {
    const good = saveLayout(ctx, mine, memory(), 5)
    const key = layoutKey('acc-1', 'boxwood')
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: good }, memory({ [key]: '{not json' }), defs)).toEqual(mine)
    expect(loadLayout(ctx, { [serverLayoutKey('acc-1', 'boxwood')]: { tiles: 4 } }, memory({ [key]: JSON.stringify({ tiles: [{ id: 'ghost' }] }) }), defs)).toEqual(defaultLayout(defs))
    expect(loadLayout(ctx, 'junk', memory({ [key]: 'null' }), defs)).toEqual(defaultLayout(defs))
  })

  it('cleans a saved copy that names tiles it should not', () => {
    const storage = memory({ [layoutKey('acc-1', 'boxwood')]: JSON.stringify({ version: 1, savedAt: 1, tiles: [{ id: 'ghost', span: 4 }, { id: 'job', span: 40, rows: 9 }], hidden: [] }) })
    expect(loadLayout(ctx, undefined, storage, defs)).toEqual({ tiles: [{ id: 'job', span: 12, rows: 4 }], hidden: ['stage', 'bed'] })
  })

  it('survives a browser that will not store or read', () => {
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') } }
    expect(() => saveLayout(ctx, mine, broken, 1)).not.toThrow()
    expect(loadLayout(ctx, undefined, broken, defs)).toEqual(defaultLayout(defs))
  })
})
