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

/**
 * Reads `GET /pairing` over an open session. Any failure reads as protected, except one: muon-link's Owner-only
 * policy refusing a session it has already admitted. A protected printer refuses a stranger's key before any request,
 * so a policy refusal here means the printer let this browser in as an Open printer's guest (it is not the owner, so
 * it may not read the pairing state). The caller still checks the link is Bluetooth.
 */
export async function readPairingEntry (session: Answerable): Promise<PairingEntry> {
  try {
    const answer = await session.fetch('GET', PAIRING_PATH, [], new Uint8Array())
    if (answer.status === 403 && policyRefusedText(new TextDecoder().decode(answer.body))) return 'open'
    if (answer.status < 200 || answer.status >= 300) return 'protected'
    return entryOf(JSON.parse(new TextDecoder().decode(answer.body)))
  } catch {
    return 'protected'
  }
}
