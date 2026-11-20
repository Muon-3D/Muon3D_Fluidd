import { cloudBaseUrl, storedToken, refreshSession } from '@/services/muon-cloud/api'
import { usePasskey } from '@/services/account/webauthn'
import { MODELS_AUDIENCE, MODELS_SERVICE_URL } from '@/services/library/transport'

export interface StaffSession { actor: string; staff_expires_at: number }
export interface AdminAccount {
  id: string; name: string; email: string; email_verified: boolean;
  created_at: number; delete_after: number | null; sessions: number;
  admin_version?: number; staff_suspended?: boolean;
}
export interface Lookup { account: AdminAccount | null; staff_expires_at: number }
export interface AuditEntry { id: number; actor: string; action: string; target?: string | null; reason: string; result: string; at: number }
export interface AuditPage { entries: AuditEntry[]; next: number | null; staff_expires_at?: number }
export class AdminError extends Error {
  constructor (message: string, readonly status: number, readonly expired = false) { super(message) }
}

export function adminAvailable (page = window.location.href, console = cloudBaseUrl(), framed = window.top !== window.self): boolean {
  const origin = new URL(page).origin
  return !framed && ['https://control.muon3d.com', 'https://app.muon3d.com'].includes(origin) && console === origin
}

const FLEET_NOT_ON = 'Fleet sign-in is not turned on yet.'

async function send<T> (origin: string, path: string, token: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer'
    })
  } catch { throw new AdminError('Staff tools could not be reached. Try again.', 0) }
  let data: any
  try { data = JSON.parse(await response.text()) } catch { throw new AdminError('Staff tools sent an unreadable answer.', response.status) }
  if (!response.ok) {
    const expired = response.status === 401 || data.staff_reauth_required === true
    if (response.status === 400 && /not turned on/i.test(String(data?.error ?? data?.message ?? data?.detail ?? ''))) throw new AdminError(FLEET_NOT_ON, 400)
    throw new AdminError(expired
      ? 'Confirm staff access again.'
      : response.status === 403
        ? 'Staff access is required on Control.'
        : response.status === 429
          ? 'Too many requests. Try again in a minute.'
          : 'The request could not be completed. Check your details and try again.', response.status, expired)
  }
  return data as T
}

async function consoleRequest<T> (path: string, body: unknown, retry401 = true): Promise<T> {
  if (!adminAvailable()) throw new AdminError('Open staff tools on Control.', 403)
  let token = storedToken()
  if (!token) throw new AdminError('Sign in to use staff tools.', 401, true)
  try { return await send<T>(cloudBaseUrl(), path, token, body) } catch (error) {
    if (!retry401 || !(error instanceof AdminError) || error.status !== 401 || !await refreshSession()) throw error
    token = storedToken()
    if (!token) throw error
    return await send<T>(cloudBaseUrl(), path, token, body)
  }
}

/** A real #36 ceremony, explicitly for staff; membership is checked afterwards. */
export async function confirmStaff (): Promise<StaffSession> {
  const options = await consoleRequest<{ ceremony_id: string; options: { publicKey: Record<string, any> }; expires_at: number }>(
    '/v1/me/reauth/passkey/options', { purpose: 'staff' })
  const check = () => {
    if (options.expires_at * 1000 <= Date.now()) throw new AdminError('Passkey confirmation expired. Try again.', 403, true)
  }
  check()
  const credential = await usePasskey(options.options.publicKey)
  check()
  await consoleRequest('/v1/me/reauth/passkey', { ceremony_id: options.ceremony_id, credential })
  return await consoleRequest<StaffSession>('/v1/admin/session', {})
}

export const lookupAccount = (query: string, reason: string): Promise<Lookup> =>
  consoleRequest('/v1/admin/accounts/lookup', { query, reason })

export async function readAudit (source: 'console' | 'community', before: number | null, reason: string): Promise<AuditPage> {
  if (source === 'console') return await consoleRequest('/v1/admin/audit/read', { before, reason })
  // Local to this call only: never a URL, storage entry or refresh token.
  const proof = await staffAssertion(MODELS_AUDIENCE)
  return await send<AuditPage>(MODELS_SERVICE_URL, '/v1/admin/audit/read', proof, { before, reason })
}

/** Mints a short-lived staff assertion for one audience. Callers keep it in a local only: never log, store or put it in a query. */
async function staffAssertion (audience: string): Promise<string> {
  const proof = await consoleRequest<{ assertion: string; expires_at: number }>('/v1/me/staff/assertion', { audience })
  if (proof.expires_at * 1000 <= Date.now()) throw new AdminError('Staff confirmation expired.', 401, true)
  return proof.assertion
}

export const FLEET_AUDIENCE = 'https://fleet.muon3d.com'
export const fleetSignInUrl = (assertion: string): string => `${FLEET_AUDIENCE}/sign-in#assertion=${encodeURIComponent(assertion)}`

/** One plain sentence for any failure of openFleet. */
export function fleetFailure (error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'The passkey was cancelled, so Fleet was not opened.'
  if (error instanceof DOMException && (error.name === 'NotSupportedError' || error.name === 'SecurityError')) return 'Passkeys are unavailable in this browser, so Fleet was not opened.'
  if (error instanceof AdminError) {
    if (error.message === FLEET_NOT_ON) return error.message
    if (error.status === 403) return 'Your account is not Muon staff, so Fleet was not opened.'
    if (error.status === 0) return 'Fleet could not be reached. Check your connection and try again.'
    if (error.expired) return 'Staff confirmation expired. Try again.'
  }
  return 'Fleet could not be opened. Try again.'
}

/**
 * Staff-only hand-off to Fleet. Unless a passkey confirmation is already fresh,
 * confirm with the passkey, mint an assertion for the Fleet audience, then send
 * this same tab to Fleet's sign-in with the assertion in the fragment.
 */
export async function openFleet (opts: { confirmed?: boolean; onStage?: (stage: 'passkey' | 'opening') => void; navigate?: (url: string) => void } = {}): Promise<void> {
  const navigate = opts.navigate ?? ((url: string) => window.location.assign(url))
  if (!opts.confirmed) { opts.onStage?.('passkey'); await confirmStaff() }
  opts.onStage?.('opening')
  const assertion = await staffAssertion(FLEET_AUDIENCE)
  navigate(fleetSignInUrl(assertion))
}

export interface StaffCommand { command: string; action: string; target: string; version: number; reason: string; details: Record<string, unknown> }
export interface CaseSummary { id: string; title: string; kind: string; state: string; version: number; assignee: string; at: number }
export interface CaseDetail extends CaseSummary, CasePublication { share_id: string; owner: string; hidden_by: string | null; action_due_at?: number | null; decision_due_at?: number | null; restore_after?: number | null; legal_hold?: boolean; resolved?: boolean; notices?: Array<{ id: number; reason: string; complete: boolean; decision: string | null; sender?: string }>; events: Array<{ id: number; actor: string; kind: string; text: string; at: number }> }
export interface Reservation { pattern: string; reason: string; managed: boolean; active: boolean; version: number; owner: string | null; expires_at: number | null }
export interface CommandResult extends SourceResult { cases?: CaseSummary[]; case?: CaseDetail; reservations?: Reservation[]; account?: Partial<AdminAccount>; saved?: boolean }
export const newCommandId = (): string => crypto.randomUUID().replace(/-/g, '')
export interface SourceFile { id: string; role: string; format: string; encoding: string; size_bytes: number; sha256: string }
interface CasePublication { publication?: { licence: string; credit: { author?: string; site: string } | null; files: SourceFile[]; manifest: string; reviewed_by: string | null; reviewed_version: number | null } | null; profile?: { content: { name: string | null; handle: string | null; bio: string | null; links: string[]; avatar: string | null }; digest: string } }
interface SourceResult { source?: { file: SourceFile; manifest: string; bytes: string } }
export function isStaffMutation (action: string): boolean { return !['queue', 'case', 'reservations', 'source'].includes(action) }
export async function sourceBlob (source: NonNullable<CommandResult['source']>, expected: SourceFile, manifest: string): Promise<Blob> {
  if (source.manifest !== manifest || source.file.id !== expected.id || source.file.sha256 !== expected.sha256 || source.bytes.length > 12 * 1024 * 1024 || expected.size_bytes > 8 * 1024 * 1024) throw new AdminError('Source snapshot changed. Reload this case.', 409)
  const bytes = Uint8Array.from(atob(source.bytes), c => c.charCodeAt(0))
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(n => n.toString(16).padStart(2, '0')).join('')
  if (bytes.length !== expected.size_bytes || digest !== expected.sha256) throw new AdminError('Source bytes did not match. Nothing was prepared.', 409)
  return new Blob([bytes], { type: 'application/octet-stream' })
}

/** A fresh ceremony for every mutation. No write proof reaches this client and no mutation retries automatically. */
export async function staffCommand (command: StaffCommand, account = false, current: () => boolean = () => true): Promise<CommandResult> {
  if (isStaffMutation(command.action)) await confirmStaff()
  if (!current()) throw new AdminError('The page changed. No command was sent.', 0)
  try {
    return await consoleRequest<CommandResult>(account ? '/v1/admin/accounts/action' : '/v1/admin/community', command, false)
  } catch (error) {
    if (error instanceof AdminError && error.status === 409) throw new AdminError('This changed while you were reviewing it. Reload before deciding again.', 409)
    if (error instanceof AdminError && (error.status === 0 || error.status < 300 || error.status >= 500)) throw new AdminError('The outcome is uncertain. It may have saved. Refresh the case and audit before deciding again.', error.status)
    throw error
  }
}
