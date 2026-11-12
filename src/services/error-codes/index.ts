import book from './catalogue.json'
import { MESSAGE_MATCHERS } from './matchers'
import type { ErrorBook, ErrorBookEntry, RawError, ResolvedError } from './types'

export type { ErrorBook, ErrorBookEntry, RawError, ResolvedError } from './types'

/**
 * The book Control reads. `catalogue.json` is seed data; the error code book's
 * generated JSON bundle (same shape, `{ version, entries }`) replaces that one
 * file, or is passed to `useErrorBook` in tests.
 */
let current: ErrorBook = book as ErrorBook

export function useErrorBook (next: ErrorBook): void {
  current = next
}

export function resetErrorBook (): void {
  current = book as ErrorBook
}

/** `MU-<AREA>-<NNNN>`, case-insensitive; returns the canonical form or null. */
export function normaliseCode (code: unknown): string | null {
  if (typeof code !== 'string') return null
  const c = code.trim().toUpperCase()
  return /^MU-[A-Z]+-\d{4}$/.test(c) ? c : null
}

export function lookupCode (code: unknown): ErrorBookEntry | null {
  const c = normaliseCode(code)
  if (c === null) return null
  return current.entries.find(e => e.code === c && e.status !== 'retired') ?? null
}

export function matchMessage (message: string): ErrorBookEntry | null {
  for (const m of MESSAGE_MATCHERS) {
    if (m.pattern.test(message)) return lookupCode(m.code)
  }
  return null
}

export const GENERIC_SHORT = 'Something went wrong on the printer.'

/** Where a public entry's page lives. Only public entries link. */
export function docsUrl (entry: ErrorBookEntry | null): string | null {
  return entry !== null && entry.public ? `https://muon3d.com/errors/${entry.code}` : null
}

/** Strip markup a device message may carry (Klipper text arrives with <br />). */
function plain (text: string): string {
  return text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
}

/**
 * Map a failure to what the user sees. An explicit, known `code` wins; a code
 * the book does not know falls back to the message match, then to the generic
 * line. `full` always holds everything the device said and is never blank.
 */
export function resolveError (raw: RawError): ResolvedError {
  const message = plain(raw.message ?? '')
  const detail = plain(raw.detail ?? '')
  const explicit = typeof raw.code === 'string' ? raw.code.trim() : ''
  const parts = [message, detail].filter((p, i, all) => p !== '' && all.indexOf(p) === i)
  if (explicit !== '' && !parts.some(p => p.includes(explicit))) parts.push(`(${explicit})`)
  const full = parts.length ? parts.join('\n') : 'No further detail was reported.'

  const byCode = lookupCode(raw.code)
  if (byCode) return { entry: byCode, code: byCode.code, short: byCode.short_line, full, via: 'code' }
  const byMessage = matchMessage(`${message}\n${detail}`)
  if (byMessage) return { entry: byMessage, code: byMessage.code, short: byMessage.short_line, full, via: 'message' }
  return { entry: null, code: null, short: GENERIC_SHORT, full, via: 'none' }
}
