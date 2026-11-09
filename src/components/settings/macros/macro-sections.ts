import type { Macro, MacroCategory } from '@/store/macros/types'

/** A section of Settings › Macros: a category, or Uncategorised (id '0'). */
export interface MacroSection {
  id: string;
  name: string;
  /** All its macros, and how many of them the dashboard shows, whatever the search. */
  count: number;
  visible: number;
  /** Its macros the search finds, in their order. */
  macros: Macro[];
}

function matches (m: Macro, q: string): boolean {
  return [m.name, m.alias ?? '', String(m.config?.description ?? '')].some(s => s.toLowerCase().includes(q))
}

/** The panel's sections: each category, then Uncategorised. */
export function macroSections (
  categories: MacroCategory[],
  macrosIn: (id: string) => Macro[],
  uncategorised: string,
  query = ''
): MacroSection[] {
  const q = query.trim().toLowerCase()
  return [...categories, { id: '0', name: uncategorised }].map(({ id, name }) => {
    const all = macrosIn(id)
    return {
      id,
      name,
      count: all.length,
      visible: all.filter(m => m.visible).length,
      macros: q ? all.filter(m => matches(m, q)) : all
    }
  })
}

/**
 * The section's macros once `names` are moved in, together and in the
 * order given, before `before` or else last, each in its new category:
 * what's saved as the section's order. Null when there is nothing to move.
 */
export function macrosMovedTo (
  all: Macro[],
  macrosIn: (id: string) => Macro[],
  names: string | string[],
  sectionId: string,
  before?: string
): Macro[] | null {
  const list = Array.isArray(names) ? names : [names]
  const moving = list
    .map(n => all.find(m => m.name === n))
    .filter((m): m is Macro => !!m)
  if (!moving.length || (before && list.includes(before) && moving.length === 1)) return null
  const rest = macrosIn(sectionId).filter(m => !list.includes(m.name))
  const at = before && !list.includes(before) ? rest.findIndex(m => m.name === before) : -1
  const moved = moving.map(m => ({ ...m, categoryId: sectionId }))
  if (at < 0) rest.push(...moved)
  else rest.splice(at, 0, ...moved)
  return rest
}

/** The names from `a` to `b`, either way round, in the panel's order: a Shift-click's range. */
export function rangeOf (order: string[], a: string, b: string): string[] {
  const i = order.indexOf(a)
  const j = order.indexOf(b)
  if (i < 0 || j < 0) return [b]
  return order.slice(Math.min(i, j), Math.max(i, j) + 1)
}

/** The categories' ids once `id` is dragged before `before` (or last). */
export function sectionsMoved (ids: string[], id: string, before?: string): string[] | null {
  if (!ids.includes(id) || id === before) return null
  const rest = ids.filter(i => i !== id)
  const at = before ? rest.indexOf(before) : -1
  if (at < 0) rest.push(id)
  else rest.splice(at, 0, id)
  return rest.join() === ids.join() ? null : rest
}
