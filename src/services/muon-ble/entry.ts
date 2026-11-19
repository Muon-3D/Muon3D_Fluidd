/**
 * How a printer lets a stranger in (D-166, Jack 17 Nov: "the printer should
 * be open by default"). The printer's `GET /pairing` says `entry: "open"` or
 * `"protected"`. An Open printer admits any browser over a local path
 * (Bluetooth, LAN) as an Operator guest, with no code, no prompt and no grant.
 * A protected one keeps the code and share flow.
 *
 * Anything else (a missing field, an older printer, an unreadable answer) is
 * protected: a missing field is never read as open.
 */
import { policyRefusedText } from '@/services/managed-transport/refusal'
import { parseProtectionStatus } from '@/store/protection/helpers'
import { LEVEL_OPEN } from '@/store/protection/types'

export type PairingEntry = 'open' | 'protected'

/** Where a connected printer answers; muon-link serves it under this prefix on every route. */
export const PAIRING_PATH = '/muon-link/pairing'

/** The entry mode in a `GET /pairing` answer; anything but the exact word "open" is protected. */
export function entryOf (body: unknown): PairingEntry {
  const entry = (body as { entry?: unknown } | null)?.entry
  return entry === 'open' ? 'open' : 'protected'
}

interface Answerable {
  fetch (method: string, path: string, headers: string[], body: Uint8Array): Promise<{ status: number, body: Uint8Array }>;
}

/** Moonraker's protection answer (`GET /server/muon/protection`), bare or wrapped in `result`: true only for exactly level 0. */
export const PROTECTION_PATH = '/server/muon/protection'
export function openByProtection (body: unknown): boolean {
  const inner = (body as { result?: unknown } | null)?.result ?? body
  return parseProtectionStatus(inner)?.level === LEVEL_OPEN
}

export interface ReadEntryOptions {
  /**
   * Whether the printer really let this browser in over Bluetooth (the radio carries the session). Without it a policy
   * refusal never reads as open: only a session that is admitted and carried over the radio can be an Open printer's guest.
   */
  carried?: () => boolean | Promise<boolean>;
}

/**
 * Reads `GET /pairing` over an open session. Any failure reads as protected, except one: muon-link's Owner-only
 * policy refusing a 403 on a session it has already admitted over Bluetooth. That alone is not enough, because a
 * Viewer admitted by a paired key on a Protected printer is refused the same way; so the printer must also say it is
 * Open (`GET /server/muon/protection`, level 0). A refusal without both reads as protected.
 */
export async function readPairingEntry (session: Answerable, options: ReadEntryOptions = {}): Promise<PairingEntry> {
  try {
    const answer = await session.fetch('GET', PAIRING_PATH, [], new Uint8Array())
    if (answer.status === 403 && policyRefusedText(new TextDecoder().decode(answer.body))) {
      if (!options.carried || !(await options.carried())) return 'protected'
      const level = await session.fetch('GET', PROTECTION_PATH, [], new Uint8Array())
      if (level.status < 200 || level.status >= 300) return 'protected'
      return openByProtection(JSON.parse(new TextDecoder().decode(level.body))) ? 'open' : 'protected'
    }
    if (answer.status < 200 || answer.status >= 300) return 'protected'
    return entryOf(JSON.parse(new TextDecoder().decode(answer.body)))
  } catch {
    return 'protected'
  }
}
