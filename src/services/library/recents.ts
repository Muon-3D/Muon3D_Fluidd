import Vue from 'vue'

/**
 * Continue is what this device opened (Jack, 12 Nov 2026): a short list kept
 * in this browser only, until a cross-device history contract exists. Each
 * entry holds just what a card needs to show and to open the print again, and
 * nothing private: no account, no file, no link with a key.
 */
export const RECENTS_KEY = 'm3d.control.library.recents.v1'

/** The most prints kept. */
export const RECENTS_MAX = 12

export interface RecentEntry {
  /** The own print's id, or the public model's id. */
  id: string;
  /** `own` is one of your prints (`/library/<id>`), `publication` a public model's page. */
  kind: 'own' | 'publication';
  title: string;
  /** A picture address, or null. */
  thumbnail: string | null;
  /** Who made it, for a public model; null for your own. */
  maker: string | null;
  /** When it was opened here, in milliseconds since 1970. */
  opened_at: number;
}

/** Bumped on every change, so a computed that reads it follows the list. */
const changes = Vue.observable({ rev: 0 })

function storage (): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // A refused store (blocked site data) throws on the property itself.
    return null
  }
}

const text = (value: unknown): string => typeof value === 'string' ? value : ''

/** One stored entry, or null when it is not a well-formed one. */
function valid (value: unknown): RecentEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = text(raw.id).trim()
  const title = text(raw.title).trim()
  if (!id || !title || id.length > 200) return null
  if (raw.kind !== 'own' && raw.kind !== 'publication') return null
  if (typeof raw.opened_at !== 'number' || !Number.isFinite(raw.opened_at) || raw.opened_at < 0) return null
  const thumbnail = text(raw.thumbnail).trim()
  // Only a public picture address: never a blob, a data URL, or a signed link (your own prints' pictures are asked for again when drawn).
  const picture = raw.kind === 'publication' && /^https:\/\//i.test(thumbnail) && thumbnail.length <= 2000 && !/signature|token|x-amz/i.test(thumbnail)
  const maker = text(raw.maker).trim()
  return {
    id,
    kind: raw.kind,
    title: title.slice(0, 200),
    thumbnail: picture ? thumbnail : null,
    maker: maker ? maker.slice(0, 120) : null,
    opened_at: raw.opened_at
  }
}

/** What this device opened, newest first. A missing, refused or damaged store is an empty list. */
export function readRecents (): RecentEntry[] {
  // Reading the counter (it is never negative) makes a caller inside a computed follow later changes.
  if (changes.rev < 0) return []
  try {
    const raw = storage()?.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const list: RecentEntry[] = []
    for (const value of parsed) {
      const entry = valid(value)
      if (!entry) continue
      const key = `${entry.kind}:${entry.id}`
      if (seen.has(key)) continue
      seen.add(key)
      list.push(entry)
    }
    return list.sort((a, b) => b.opened_at - a.opened_at).slice(0, RECENTS_MAX)
  } catch {
    return []
  }
}

/**
 * Forgets the prints of yours this device opened, keeping public models.
 * Called when the signed-in account changes: your own prints are the
 * account's, not the browser's. Never throws.
 */
export function forgetOwnRecents (): void {
  try {
    const kept = readRecents().filter(entry => entry.kind !== 'own')
    if (kept.length) storage()?.setItem(RECENTS_KEY, JSON.stringify(kept))
    else storage()?.removeItem(RECENTS_KEY)
  } catch {
    // Nothing to forget.
  }
  changes.rev++
}

/** The one to Continue with, or null when nothing was opened here. */
export function latestRecent (): RecentEntry | null {
  return readRecents()[0] ?? null
}

/**
 * This print was opened here: it goes first, and its old place goes. A
 * title is needed to draw it later, so an entry without one is not kept.
 * Never throws: a store that refuses the write loses the entry, not the page.
 */
export function recordRecent (entry: { id: string, kind: 'own' | 'publication', title: string, thumbnail?: string | null, maker?: string | null }, now: number = Date.now()): void {
  const fresh = valid({ id: entry.id, kind: entry.kind, title: entry.title, thumbnail: entry.thumbnail ?? null, maker: entry.maker ?? null, opened_at: now })
  if (!fresh) return
  try {
    const rest = readRecents().filter(old => !(old.kind === fresh.kind && old.id === fresh.id))
    storage()?.setItem(RECENTS_KEY, JSON.stringify([fresh, ...rest].slice(0, RECENTS_MAX)))
  } catch {
    // Not kept.
  }
  changes.rev++
}
