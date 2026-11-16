import { describe, expect, it } from 'vitest'
import { NO_SELECTION, allSelected, clearSelection, clickRow, keepShown, moveCursor, rangeOf, selectAll, someSelected, toggleRow } from '../selection'

const order = ['a', 'b', 'c', 'd', 'e']

describe('clickRow, as File Explorer does it', () => {
  it('a plain click selects that row alone and makes it the anchor', () => {
    const one = clickRow({ keys: ['a', 'c'], anchor: 'a', cursor: 'c' }, order, 'd')
    expect(one).toEqual({ keys: ['d'], anchor: 'd', cursor: 'd' })
  })

  it('Ctrl-click toggles one row and moves the anchor to it', () => {
    let s = clickRow(NO_SELECTION, order, 'b')
    s = clickRow(s, order, 'd', { ctrl: true })
    expect(s).toEqual({ keys: ['b', 'd'], anchor: 'd', cursor: 'd' })
    s = clickRow(s, order, 'b', { ctrl: true })
    expect(s).toEqual({ keys: ['d'], anchor: 'b', cursor: 'b' })
  })

  it('Shift-click selects the range from the anchor in place of what was selected, and keeps the anchor', () => {
    let s = clickRow(NO_SELECTION, order, 'b')
    s = clickRow(s, order, 'e', { ctrl: true })
    s = clickRow(s, order, 'c', { shift: true })
    expect(s).toEqual({ keys: ['c', 'd', 'e'], anchor: 'e', cursor: 'c' })
    s = clickRow(s, order, 'a', { shift: true })
    expect(s.keys).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(s.anchor).toBe('e')
  })

  it('Ctrl+Shift-click adds the range to what was selected', () => {
    let s = clickRow(NO_SELECTION, order, 'a')
    s = clickRow(s, order, 'd', { ctrl: true })
    s = clickRow(s, order, 'e', { ctrl: true, shift: true })
    expect(s.keys).toEqual(['a', 'd', 'e'])
  })

  it('the first Shift-click, with no anchor, selects just that row and anchors there', () => {
    expect(clickRow(NO_SELECTION, order, 'c', { shift: true })).toEqual({ keys: ['c'], anchor: 'c', cursor: 'c' })
  })

  it('an anchor no longer shown counts as none, and a row not shown is ignored', () => {
    expect(clickRow({ keys: [], anchor: 'gone', cursor: null }, order, 'b', { shift: true }).keys).toEqual(['b'])
    const s = { keys: ['a'], anchor: 'a', cursor: 'a' }
    expect(clickRow(s, order, 'gone')).toBe(s)
  })

  it('a checkbox toggles like Ctrl-click', () => {
    let s = toggleRow(NO_SELECTION, order, 'b')
    s = toggleRow(s, order, 'c')
    expect(s.keys).toEqual(['b', 'c'])
    expect(toggleRow(s, order, 'b').keys).toEqual(['c'])
  })
})

describe('the rest of the selection', () => {
  it('a click on empty space (or Escape) clears it and drops the anchor', () => {
    expect(clearSelection({ keys: ['a', 'b'], anchor: 'a', cursor: 'b' })).toEqual({ keys: [], anchor: null, cursor: 'b' })
  })

  it('select all, and the header box ticked or half ticked', () => {
    const s = selectAll(NO_SELECTION, order)
    expect(s.keys).toEqual(order)
    expect(allSelected(s, order)).toBe(true)
    expect(someSelected(s, order)).toBe(false)
    expect(someSelected({ ...s, keys: ['a'] }, order)).toBe(true)
    expect(allSelected(NO_SELECTION, [])).toBe(false)
  })

  it('arrows move, Shift+arrows extend from the anchor, Ctrl+arrows only move', () => {
    let s = clickRow(NO_SELECTION, order, 'b')
    s = moveCursor(s, order, 1)
    expect(s).toEqual({ keys: ['c'], anchor: 'c', cursor: 'c' })
    s = moveCursor(s, order, 1, { shift: true })
    s = moveCursor(s, order, 1, { shift: true })
    expect(s.keys).toEqual(['c', 'd', 'e'])
    s = moveCursor(s, order, 1, { shift: true })
    expect(s.cursor).toBe('e')
    s = moveCursor(s, order, -3, { shift: true })
    expect(s.keys).toEqual(['b', 'c'])
    s = moveCursor(s, order, 1, { ctrl: true })
    expect(s.keys).toEqual(['b', 'c'])
    expect(s.cursor).toBe('c')
    expect(moveCursor(NO_SELECTION, order, 1).cursor).toBe('a')
    expect(moveCursor(NO_SELECTION, order, -1).cursor).toBe('e')
    expect(moveCursor(s, order, 0, {}, order.length - 1).cursor).toBe('e')
  })

  it('a range runs either way', () => {
    expect(rangeOf(order, 'd', 'b')).toEqual(['b', 'c', 'd'])
    expect(rangeOf(order, null, 'b')).toEqual(['b'])
  })

  it('keeps only the rows still shown', () => {
    const s = { keys: ['a', 'x'], anchor: 'x', cursor: 'a' }
    expect(keepShown(s, order)).toEqual({ keys: ['a'], anchor: null, cursor: 'a' })
    const same = { keys: ['a'], anchor: 'a', cursor: 'a' }
    expect(keepShown(same, order)).toBe(same)
  })
})
