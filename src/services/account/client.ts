/**
 * Requests to the account console for the Account pages (KAN-532), beside
 * the muon-cloud client (`services/muon-cloud/api.ts`), which the printer
 * pages use. The same console, the same stored session and the same
 * refresh-once on a 401; what this adds is the answer's whole body on an
 * error, because the console says more than a sentence there:
 * `reauth_required` (confirm it's you), `mfa_required` with an `mfa_token`
 * (a two-step sign-in), and nothing at all for a route it doesn't have yet.
 *
 * A console older than the Account pages answers a route it lacks with a
 * 404 or 405 and no JSON error. `AccountError.missing` says so, and the
 * pages show "Coming soon" there instead of an error.
 */
import { CloudError, INSECURE_ORIGIN_MESSAGE, carryConfirmation, cloudBaseUrl, cloudSessionAllowed, refreshSession, storeRefreshToken, storeToken, storedToken } from '@/services/muon-cloud/api'
import { deletionRevision, observeDeletion } from '@/services/muon-cloud/deletion'

export class AccountError extends CloudError {
  constructor (message: string, status: number, body: Record<string, unknown> = {}) {
    super(message, status, undefined, body)
  }

  /** The console wants the person to confirm it's them (`403 reauth_required`). */
  get reauthRequired (): boolean {
    return this.status === 403 && this.body.reauth_required === true
  }

  /** A sign-in that needs a two-step code: the token to send with it. */
  get mfaToken (): string | null {
    return this.status === 403 && this.body.mfa_required === true && typeof this.body.mfa_token === 'string'
      ? this.body.mfa_token
      : null
  }

  /** The console doesn't have this route yet (an older build): no JSON error with it. */
  get missing (): boolean {
    return [404, 405, 501].includes(this.status) && typeof this.body.error !== 'string'
  }
}

/** Whether an error is an AccountError for a route the console doesn't have yet. */
export function isMissing (error: unknown): boolean {
  return error instanceof AccountError && error.missing
}

export interface RequestOptions {
  /** A token other than the stored session's (the sign-in page's own). Never refreshed. */
  token?: string | null;
  /** Answer the raw response (a download), not its JSON. */
  raw?: boolean;
  /**
   * `token` is the stored session's, sent on purpose (a mailed link opened in
   * a signed-in browser): adopt the re-keyed `session` the answer may carry.
   */
  adopt?: boolean;
}

/**
 * A credential change (password, email, two-step, recovery codes, a passkey,
 * a linked sign-in; muon-link-cloud KAN-1389) ends the account's other
 * sessions and gives this one new credentials: `session` in the answer holds
 * the new access and refresh token. The old pair no longer works, and using
 * the old refresh token would sign this device out, so the new pair replaces
 * it at once. The browser session's cookie comes back as `Set-Cookie`, which
 * a page the console serves takes without any option (same origin).
 */
export function adoptRekeyedSession (data: unknown, sameAccount = true) {
  const session = (data as { session?: { access_token?: unknown, refresh_token?: unknown } | null } | null)?.session
  if (!session || typeof session.access_token !== 'string' || !session.access_token) return
  const before = storedToken()
  storeToken(session.access_token)
  // The same account's new token: the confirmation moves with it (or /me is asked, when there was none to move).
  // A session that came from a link's token (e-mail verify) may be another account's: nothing moves, /me is asked.
  carryConfirmation(sameAccount ? before : null, session.access_token)
  if (typeof session.refresh_token === 'string' && session.refresh_token) storeRefreshToken(session.refresh_token)
}

async function send (method: string, path: string, body: unknown, token: string | null): Promise<Response> {
  // KAN-2192: every call here is an account call. A plain-HTTP page makes none:
  // no password, no token and no reset request leaves it.
  if (!cloudSessionAllowed()) throw new AccountError(INSECURE_ORIGIN_MESSAGE, 0)
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  try {
    return await fetch(`${cloudBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new AccountError('The Muon3D service could not be reached.', 0)
  }
}

async function errorOf (response: Response): Promise<AccountError> {
  let data: Record<string, unknown> = {}
  try {
    const text = await response.text()
    const parsed = text ? JSON.parse(text) : {}
    if (parsed && typeof parsed === 'object') data = parsed
  } catch { /* an HTML 404 from a console without the route: `missing` */ }
  const message = typeof data.error === 'string' ? sentence(data.error) : `The Muon3D service answered ${response.status}.`
  return new AccountError(message, response.status, data)
}

/** The console's errors are lower-case clauses ("that code is not right"): shown as sentences. */
export function sentence (text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const first = trimmed[0].toUpperCase() + trimmed.slice(1)
  return /[.!?]$/.test(first) ? first : `${first}.`
}

export async function accountRequest<T> (method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  let startedAt = deletionRevision()
  const ownToken = options.token !== undefined
  let token = ownToken ? options.token ?? null : storedToken()
  let response = await send(method, path, body, token)
  // A central-login access token lasts 15 minutes. Retry reads only: after a
  // mutation answers 401 its outcome is not safe to infer or repeat.
  if (response.status === 401 && method === 'GET' && !ownToken && token !== null) {
    const current = storedToken()
    if (current && (current !== token || await refreshSession())) {
      token = storedToken()
      startedAt = deletionRevision()
      response = await send(method, path, body, token)
    }
  }
  if (!response.ok) {
    const error = await errorOf(response)
    if (!ownToken && token !== null && token === storedToken()) observeDeletion(method, path, response.status, error.body, startedAt)
    throw error
  }
  if (options.raw) return response as unknown as T
  const text = await response.text()
  try {
    const data = text ? JSON.parse(text) : {}
    const now = storedToken()
    if ((!ownToken || options.adopt) && token !== null && token === now) {
      if (!ownToken) observeDeletion(method, path, response.status, data, startedAt)
      adoptRekeyedSession(data, !ownToken)
    } else if (!ownToken && token !== null && !now) {
      // A concurrent 401 refresh cleared storage while this change was in
      // flight: the rotated session is still this person's. A different,
      // non-empty token belongs to another sign-in and is left alone.
      adoptRekeyedSession(data)
    }
    return data as T
  } catch {
    throw new AccountError('The Muon3D service sent an unreadable answer.', response.status)
  }
}
