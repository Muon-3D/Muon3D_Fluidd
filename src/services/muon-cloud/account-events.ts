/**
 * Who is signed in to Muon3D, announced at the moment it changes.
 *
 * muon-cloud/state.ts calls `announceAccount` synchronously, before it clears
 * or replaces the session (sign-out, a session the console refused, another
 * tab's sign-out, a sign-in as a different account). Listeners run in two
 * phases, in this order, so no await and no Vue flush lies between the change
 * and what hears of it:
 *
 *  1. `onAccountChange`: who must be told first (the slicer frame's
 *     `account.status`, which lets the bridge host drop an answer it was
 *     still preparing for the account that left);
 *  2. `onAccountCleared`: what must forget the account (the assertion cache).
 *
 * It is a plain registry, not a Vue watcher: a watcher runs after the change
 * and, unless made `sync`, later still.
 */

/** The account as the bridge's `account.status` carries it; signed out, both null. */
export interface AccountIdentity {
  signedIn: boolean;
  id: string | null;
  name: string | null;
}

export const SIGNED_OUT: AccountIdentity = Object.freeze({ signedIn: false, id: null, name: null })

type Listener = (next: AccountIdentity) => void

const announcers = new Set<Listener>()
const forgetters = new Set<Listener>()

/** Hears of a change first. Returns its remover. */
export function onAccountChange (listener: Listener): () => void {
  announcers.add(listener)
  return () => { announcers.delete(listener) }
}

/** Forgets what belonged to the account that left, once the announcers have run. */
export function onAccountCleared (listener: Listener): () => void {
  forgetters.add(listener)
  return () => { forgetters.delete(listener) }
}

let current: AccountIdentity = SIGNED_OUT

/** Who the last announcement named (nobody before the first). */
export const currentAccount = (): AccountIdentity => current

export function announceAccount (next: AccountIdentity) {
  current = next
  // One listener's failure never stops the rest, and the cache is forgotten whatever the announcers did: a stale
  // assertion is worse than a missed announcement.
  try {
    for (const listener of [...announcers]) {
      try { listener(next) } catch { /* the next listener still hears */ }
    }
  } finally {
    for (const listener of [...forgetters]) {
      try { listener(next) } catch { /* the next one still forgets */ }
    }
  }
}

/** The identity a console account has: its name, or its e-mail address. */
export function identityOf (account: { id: string, name?: string, email?: string } | null | undefined): AccountIdentity {
  if (!account) return SIGNED_OUT
  return { signedIn: true, id: account.id, name: account.name || account.email || null }
}

/**
 * The stored token that /me last confirmed belongs to the account on screen. While the stored token is another one (a
 * reconcile after another tab's switch is pending or failed), the account and the token may not match: nothing is
 * served from the account's assertion cache and nothing reported for it (`confirmedAccountId` answers null).
 */
let confirmedToken: string | null = null

export function confirmToken (token: string | null) {
  confirmedToken = token
}

/** This tab's own refresh rotated the token of the account it confirmed: the new one is as confirmed as the old. */
export function rotateConfirmed (from: string | null, to: string) {
  if (confirmedToken !== null && confirmedToken === from) confirmedToken = to
}

/** The account's id only while `token` (the stored one) is the token confirmed for it; else null. */
export function confirmedAccountId (token: string | null): string | null {
  return token !== null && token === confirmedToken ? current.id : null
}
