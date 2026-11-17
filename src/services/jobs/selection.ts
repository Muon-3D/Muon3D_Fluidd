/**
 * Jobs' selection, as File Explorer does it.
 *
 * - `keys`: what is selected, in the order it was added.
 * - `anchor`: where a Shift range starts (the last plain or Ctrl click).
 * - `cursor`: the row that was last clicked or moved to with the keys.
 *
 * Every function takes the rows' keys in the order shown and returns a new
 * state; nothing is changed in place.
 */
export interface Selection {
  keys: string[];
  anchor: string | null;
  cursor: string | null;
}

export interface Modifiers {
  /** Ctrl, or Cmd on a Mac. */
  ctrl?: boolean;
  shift?: boolean;
}

export const NO_SELECTION: Selection = Object.freeze({ keys: [], anchor: null, cursor: null }) as Selection

/** Everything from `from` to `to` in the order shown, either way up; `to` alone with no `from` shown. */
export function rangeOf (order: string[], from: string | null, to: string): string[] {
  const end = order.indexOf(to)
  if (end < 0) return []
  const start = from === null ? -1 : order.indexOf(from)
  if (start < 0) return [to]
  const [lo, hi] = start < end ? [start, end] : [end, start]
  return order.slice(lo, hi + 1)
}

function union (a: string[], b: string[]): string[] {
  return [...a, ...b.filter(k => !a.includes(k))]
}

/**
 * A click on a row:
 * - plain: that row alone, and it becomes the anchor;
 * - Ctrl: that row in or out, and it becomes the anchor;
 * - Shift: the range from the anchor to it, instead of what was selected;
 * - Ctrl+Shift: the range added to what was selected.
 * Shift keeps the anchor, so the next Shift-click ranges from the same place.
 */
export function clickRow (state: Selection, order: string[], key: string, mods: Modifiers = {}): Selection {
  if (!order.includes(key)) return state
  const anchor = state.anchor !== null && order.includes(state.anchor) ? state.anchor : null
  if (mods.shift) {
    const range = rangeOf(order, anchor, key)
    return { keys: mods.ctrl ? union(state.keys, range) : range, anchor: anchor ?? key, cursor: key }
  }
  if (mods.ctrl) {
    const keys = state.keys.includes(key) ? state.keys.filter(k => k !== key) : [...state.keys, key]
    return { keys, anchor: key, cursor: key }
  }
  return { keys: [key], anchor: key, cursor: key }
}

/** A row's checkbox: the same as a Ctrl-click on it. */
export function toggleRow (state: Selection, order: string[], key: string): Selection {
  return clickRow(state, order, key, { ctrl: true })
}

/** A click on empty space in the list, or Escape: nothing selected. The cursor stays where it was. */
export function clearSelection (state: Selection): Selection {
  return { keys: [], anchor: null, cursor: state.cursor }
}

/** Ctrl+A, or the select-all checkbox. */
export function selectAll (state: Selection, order: string[]): Selection {
  return { keys: [...order], anchor: state.anchor ?? order[0] ?? null, cursor: state.cursor }
}

/** Whether every row shown is selected (the select-all box is ticked). */
export function allSelected (state: Selection, order: string[]): boolean {
  return order.length > 0 && order.every(k => state.keys.includes(k))
}

/** Some, but not all, of the rows shown are selected (the select-all box is half ticked). */
export function someSelected (state: Selection, order: string[]): boolean {
  return order.some(k => state.keys.includes(k)) && !allSelected(state, order)
}

/**
 * The arrow keys (and Home / End): the cursor moves `by` rows (or to `to`).
 * - plain: the row moved to, alone, and it becomes the anchor;
 * - Shift: the range from the anchor to it;
 * - Ctrl: the cursor moves and the selection stays (Space then toggles).
 */
export function moveCursor (state: Selection, order: string[], by: number, mods: Modifiers = {}, to?: number): Selection {
  if (!order.length) return state
  const at = state.cursor === null ? -1 : order.indexOf(state.cursor)
  const raw = to !== undefined ? to : at < 0 ? (by > 0 ? 0 : order.length - 1) : at + by
  const key = order[Math.max(0, Math.min(order.length - 1, raw))]
  if (mods.shift) {
    const anchor = state.anchor !== null && order.includes(state.anchor) ? state.anchor : state.cursor
    const range = rangeOf(order, anchor, key)
    return { keys: mods.ctrl ? union(state.keys, range) : range, anchor: anchor ?? key, cursor: key }
  }
  if (mods.ctrl) return { ...state, cursor: key }
  return { keys: [key], anchor: key, cursor: key }
}

/** Only the rows still shown stay selected; an anchor or cursor no longer shown goes. */
export function keepShown (state: Selection, order: string[]): Selection {
  const shown = new Set(order)
  const keys = state.keys.filter(k => shown.has(k))
  const anchor = state.anchor !== null && shown.has(state.anchor) ? state.anchor : null
  const cursor = state.cursor !== null && shown.has(state.cursor) ? state.cursor : null
  if (keys.length === state.keys.length && anchor === state.anchor && cursor === state.cursor) return state
  return { keys, anchor, cursor }
}
