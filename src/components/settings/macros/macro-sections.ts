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
 * The section's macros once `name` is moved in, before `before` or else
 * last, the moved one in its new category: what's saved as the section's
 * order. Null when there is nothing to move.
 */
export function macrosMovedTo (
  all: Macro[],
  macrosIn: (id: string) => Macro[],
  name: string,
  sectionId: string,
  before?: string
): Macro[] | null {
  const macro = all.find(m => m.name === name)
  if (!macro || before === name) return null
  const rest = macrosIn(sectionId).filter(m => m.name !== name)
  const at = before ? rest.findIndex(m => m.name === before) : -1
  const moved = { ...macro, categoryId: sectionId }
  if (at < 0) rest.push(moved)
  else rest.splice(at, 0, moved)
  return rest
}
