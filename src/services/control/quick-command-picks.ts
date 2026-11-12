/**
 * Which commands the Quick commands tile (Overview) and card (Control) show
 * (KAN-2122). Chosen on the Macros page's "Quick commands" section and kept in
 * the printer's settings (`uiSettings.general.quickCommands`), so every
 * device that opens this printer shows the same ones.
 *
 * `null` (nothing chosen yet) keeps the automatic pick: the best of each
 * group. A list is the person's own choice, newest first; `[]` deliberately
 * shows none. Names are matched without case, as Klipper does.
 */
export type QuickCommandPicks = string[] | null

export function normalisePicks (raw: unknown): QuickCommandPicks {
  if (!Array.isArray(raw)) return null
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of raw) {
    if (typeof v !== 'string') continue
    const name = v.trim().toUpperCase()
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

/** Whether `name` is on the tile under these picks (`auto` is the automatic pick's names). */
export function isPicked (picks: QuickCommandPicks, name: string, auto: string[]): boolean {
  const n = name.toUpperCase()
  return (picks ?? auto.map(a => a.toUpperCase())).includes(n)
}

/**
 * The picks after ticking or unticking `name`. The first change starts from
 * what the tile shows now (the automatic pick), so nothing else moves. A newly
 * ticked one goes first: the tile shows the first few, so it always appears.
 */
export function togglePick (picks: QuickCommandPicks, name: string, on: boolean, auto: string[]): string[] {
  const n = name.toUpperCase()
  const base = picks ?? auto.map(a => a.toUpperCase())
  const without = base.filter(p => p !== n)
  return on ? [n, ...without] : without
}

/**
 * The macros to show, best first: the person's picks in their order (those
 * the printer still has), else the automatic pick; at most `count`.
 */
export function pickedMacros<T extends { name: string }> (macros: T[], picks: QuickCommandPicks, auto: (count: number) => T[], count: number): T[] {
  if (picks === null) return auto(count)
  const byName = new Map(macros.map(m => [m.name.toUpperCase(), m]))
  return picks.map(p => byName.get(p)).filter((m): m is T => !!m).slice(0, count)
}

/**
 * Whether a command may be a Quick command at all: never the ones the printer
 * runs itself or the print controls (start, pause, resume, cancel), which keep
 * their own buttons on the print. The same rule as the automatic pick and
 * Control's card, so ticking can't put Cancel print on the Overview as a
 * one-tap button.
 */
export function quickCommandEligible (m: { group: string }): boolean {
  return m.group !== 'printer' && m.group !== 'printing'
}
