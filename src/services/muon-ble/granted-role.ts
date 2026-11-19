/**
 * The role an Open printer granted this browser over Bluetooth (D-166, KAN-4309).
 *
 * muon-link admits a stranger on an Open printer as an OpenGuest with the
 * Operator role. No account holds such a printer, so `cloudState.printers`
 * has no entry with a role for it; this is where Control records what the
 * printer itself said, read from `GET /muon-link/pairing`. It lives in memory
 * only, per connect: a reload or a new connect asks the printer again, so a
 * printer that has since been locked down is never remembered as open.
 *
 * Only an answer of `entry: "open"` grants anything. A protected printer, a
 * refusal, a missing field or an unreadable answer records nothing. The role
 * is never above Operator: an explicit `role` in the answer can only lower it.
 */
import Vue from 'vue'
import { entryOf, openByProtection, PAIRING_PATH, PROTECTION_PATH } from './entry'
import { policyRefusedText } from '@/services/managed-transport/refusal'

export type GrantedRole = 'operator' | 'viewer'

const granted = Vue.observable({ roles: {} as Record<string, GrantedRole> })

/** The role an Open printer's pairing answer grants a stranger; null when it grants none. */
export function grantedRoleOf (body: unknown): GrantedRole | null {
  if (entryOf(body) !== 'open') return null
  const role = (body as { role?: unknown } | null)?.role
  if (role === undefined || role === null) return 'operator'
  return role === 'operator' || role === 'viewer' ? role : null
}

/** What `printerId` granted this browser, or null. */
export function grantedRoleFor (printerId: string | null | undefined): GrantedRole | null {
  return printerId ? granted.roles[printerId.toLowerCase()] ?? null : null
}

export function forgetGrantedRole (printerId: string) {
  Vue.delete(granted.roles, printerId.toLowerCase())
}

/** Waits before the 2nd and 3rd reads of the grant: short, because the person is looking at a read-only phone. */
export const GRANT_RETRY_DELAYS_MS = [400, 1200]

export interface ReadGrantOptions {
  /** Waits between tries; tests pass zeros. */
  delaysMs?: number[]
  /** A re-read after a reconnect: a grant already held stays unless the printer answers that it grants none. */
  keep?: boolean
  /**
   * True once the printer has let this browser in and the session really travels over Bluetooth (`bluetoothCarrying`),
   * not merely that the person chose Bluetooth. Only then may muon-link's Owner-only policy refusing the pairing read
   * mean "an Open printer's guest, not its owner". It is not enough alone: a Viewer admitted by a paired key on a
   * Protected printer is refused the same way, so the printer must also say it is Open (`/server/muon/protection`,
   * level 0). A printer that refuses that read too (older muon-link) grants nothing: read-only.
   */
  admitted?: boolean | (() => boolean | Promise<boolean>)
}

/** An Operator guest only where the printer itself says it is Open; any other answer or a refusal is no grant. */
async function openGuestRole (fetchPath: (path: string) => Promise<Response>): Promise<GrantedRole | null> {
  try {
    const answer = await fetchPath(PROTECTION_PATH)
    return answer.ok && openByProtection(await answer.json()) ? 'operator' : null
  } catch {
    return null
  }
}

/**
 * Asks the connected printer what it granted, and records it. A transient failure (nothing came back, a 5xx or an
 * unreadable body) is tried again after a short wait; a printer's own answer, a refusal included, is final. Anything
 * unreadable at the end records nothing: only an `entry: "open"` answer ever grants a role.
 */
export async function readGrantedRole (printerId: string, fetchPath: (path: string) => Promise<Response>, options: ReadGrantOptions = {}): Promise<GrantedRole | null> {
  const delays = options.delaysMs ?? GRANT_RETRY_DELAYS_MS
  if (!options.keep) forgetGrantedRole(printerId)
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    let role: GrantedRole | null = null
    let final = false
    try {
      const answer = await fetchPath(PAIRING_PATH)
      if (answer.ok) {
        role = grantedRoleOf(await answer.json())
        final = true
      } else if (answer.status < 500) {
        final = true
        if (answer.status === 403 && policyRefusedText(await answer.text().catch(() => ''))) {
          const admitted = typeof options.admitted === 'function' ? await options.admitted() : options.admitted
          if (admitted) role = await openGuestRole(fetchPath)
        }
      }
    } catch { /* an unreadable answer grants nothing, and is asked again */ }
    if (final) {
      if (role) Vue.set(granted.roles, printerId.toLowerCase(), role)
      else forgetGrantedRole(printerId)
      return role
    }
    if (attempt < delays.length) await new Promise(resolve => setTimeout(resolve, delays[attempt]))
  }
  return grantedRoleFor(printerId)
}
