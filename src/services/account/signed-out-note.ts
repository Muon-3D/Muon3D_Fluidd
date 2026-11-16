/**
 * What this tab remembers across the console's `/logout` (KAN-532): that it
 * signed out a moment ago, where, and whether the person wants to change
 * their password next, so the signed-out page can say so.
 *
 * The console sends a signed-out browser back to `/`, as it always has, and
 * the `/` route goes on to `/signed-out` while this is fresh. No imports: the
 * router reads it, and anything that opens printers would be a cycle there.
 */

/** Where the person signed out: this browser, every device, or the account went. */
export type SignedOutScope = 'browser' | 'everywhere' | 'deleted'

/** What the person changed that ended every session, this one included (KAN-1389). */
export type OwnChangeReason = 'password' | 'email' | 'two-step'

/**
 * Why the console says a session ended (KAN-2509): the wire strings of `GET /v1/me/session-events` and of a refused
 * refresh. A console may send one this build does not know; the page then says the generic line.
 */
export const WIRE_REASONS = [
  'password_changed', 'password_reset', 'email_changed', 'two_step_changed', 'passkey_changed', 'identity_changed',
  'signed_out_everywhere', 'signed_out', 'session_revoked', 'refresh_reuse', 'staff_action', 'account_deleted',
  'session_expired'
] as const
export type WireReason = typeof WIRE_REASONS[number]

export type SignedOutReason = OwnChangeReason | WireReason | string

export interface SignedOutNote {
  /** Milliseconds since 1970. */
  at: number;
  scope: SignedOutScope;
  /** The address that was signed out, for the page to name. */
  email?: string;
  /** "Change my password next" was ticked. */
  password?: boolean;
  /** KAN-1389: why the session ended (the person's own change, or the console's reason): the sign-in page says so. */
  reason?: SignedOutReason;
}

const SIGNED_OUT_PREFIX = 'You were signed out'

/**
 * The sentence for a reason (KAN-2509), in plain words with no raw key. Null for no reason, the generic ones
 * (`signed_out`, `session_expired`, a reason this build does not know) and `account_deleted`, which the page words
 * from its scope: the caller then says the line for the scope.
 */
export function reasonLine (reason: string | undefined): string | null {
  switch (reason) {
    case 'password_changed':
    case 'password_reset':
      return `${SIGNED_OUT_PREFIX} because your password changed.`
    case 'email_changed':
      return `${SIGNED_OUT_PREFIX} because your email address changed.`
    case 'two_step_changed':
      return `${SIGNED_OUT_PREFIX} because two-step sign-in changed.`
    case 'passkey_changed':
    case 'identity_changed':
      return `${SIGNED_OUT_PREFIX} because your sign-in methods changed.`
    case 'signed_out_everywhere':
      return 'You were signed out on every device.'
    case 'session_revoked':
      return 'This device was signed out from another device.'
    case 'refresh_reuse':
      return 'You were signed out to protect your account. Sign in again.'
    case 'staff_action':
      return 'You were signed out by Muon3D support.'
    default:
      return null
  }
}

/** The scope a pushed reason belongs to, for the checks and the account-deleted text the page keeps. */
export function scopeOfReason (reason: string): SignedOutScope {
  if (reason === 'account_deleted') return 'deleted'
  if (reason === 'signed_out_everywhere') return 'everywhere'
  return 'browser'
}

export const SIGNED_OUT_KEY = 'muon.account.signedOut'

/** Long enough for the console's logout page and its two-second wait, and for a tab that was asleep when its session ended (KAN-2509). */
const FRESH_MS = 15 * 60 * 1000

function tab (): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function noteSignedOut (note: Omit<SignedOutNote, 'at'>, now = Date.now()): void {
  try {
    tab()?.setItem(SIGNED_OUT_KEY, JSON.stringify({ ...note, at: now }))
  } catch { /* the page then says less */ }
}

/** The note, if this tab signed out in the last quarter hour. */
export function readSignedOut (now = Date.now()): SignedOutNote | null {
  try {
    const raw = tab()?.getItem(SIGNED_OUT_KEY)
    if (!raw) return null
    const note = JSON.parse(raw) as SignedOutNote
    if (typeof note?.at !== 'number' || now - note.at > FRESH_MS || now < note.at) return null
    if (!['browser', 'everywhere', 'deleted'].includes(note.scope)) return null
    return note
  } catch {
    return null
  }
}

export function forgetSignedOut (): void {
  try {
    tab()?.removeItem(SIGNED_OUT_KEY)
  } catch { /* nothing to forget */ }
}
