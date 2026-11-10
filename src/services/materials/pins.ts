/** The filament picker shows at most this many materials, in this order. */
export const MAX_PINS = 6

/** What a printer pins before anyone has chosen: the four materials every printer has. */
export const DEFAULT_PINS = ['PLA', 'PETG', 'ABS', 'TPU']

const key = (name: string) => name.trim().toLowerCase()

export function samePin (a: string, b: string): boolean {
  return key(a) === key(b)
}

/** The saved pin list, else the defaults; never more than MAX_PINS. */
export function pinnedNames (saved: string[] | null | undefined): string[] {
  return (saved ?? DEFAULT_PINS).slice(0, MAX_PINS)
}

export function isPinned (pins: string[], name: string): boolean {
  return pins.some(p => samePin(p, name))
}

/** Pin or unpin; pinning past the cap does nothing (null) so the caller can say why. */
export function togglePin (pins: string[], name: string): string[] | null {
  if (isPinned(pins, name)) return pins.filter(p => !samePin(p, name))
  if (pins.length >= MAX_PINS) return null
  return [...pins, name]
}

/** Move a pinned name to another pinned name's place (drag and drop). */
export function movePin (pins: string[], from: string, to: string): string[] {
  const i = pins.findIndex(p => samePin(p, from))
  const j = pins.findIndex(p => samePin(p, to))
  if (i < 0 || j < 0 || i === j) return pins
  const next = [...pins]
  const [moved] = next.splice(i, 1)
  next.splice(j, 0, moved)
  return next
}

/** Move a pinned name one place up (-1) or down (+1), for the keyboard. */
export function nudgePin (pins: string[], name: string, by: -1 | 1): string[] {
  const i = pins.findIndex(p => samePin(p, name))
  const j = i + by
  if (i < 0 || j < 0 || j >= pins.length) return pins
  return movePin(pins, pins[i], pins[j])
}

/** When a preset is renamed its pin follows it. */
export function renamePin (pins: string[], from: string, to: string): string[] {
  return pins.map(p => (samePin(p, from) ? to : p))
}

/** Pinned first in pin order, then the rest by name. */
export function byPins<T extends { name: string }> (items: T[], pins: string[]): T[] {
  const rank = (n: string) => {
    const i = pins.findIndex(p => samePin(p, n))
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  return [...items].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
}
