/**
 * The account console's routes the Account pages use (KAN-532), typed. The
 * routes are muon-link-cloud's `crates/muon-console` (`http.rs` lists them).
 * Fields marked "new" come with the console's KAN-533 changes; an older
 * console leaves them out, and the pages say "Coming soon" for them.
 */
import { accountRequest } from './client'
import type { CreatedToken, CreateTokenBody, PersonalToken } from './tokenTypes'
import type { ConnectedApp } from './connectedAppTypes'

/** `GET /v1/me`'s account. */
export interface AccountDetails {
  id: string;
  email: string;
  name: string;
  /** Seconds. */
  created_at: number;
  email_verified?: boolean;
  has_password?: boolean;
  two_step?: boolean;
  /** New: 'email' when the console made the name from the address. */
  name_source?: 'email' | 'person';
  /** New: an address change waiting for its link. */
  email_pending?: { address: string, expires_at: number } | null;
  /** New: a deletion waiting out its 14 days. Absent on a console that deletes at once. */
  deletion?: { requested_at: number, delete_after: number } | null;
}

export interface SignInMethods {
  password: boolean;
  passkeys: number;
  identities: string[];
  two_step: boolean;
  /** New: recovery codes not yet used. */
  recovery_left?: number;
}

export interface Me {
  account: AccountDetails;
  endpoint_id: string | null;
  endpoint_proven?: boolean;
  session_id?: string;
  sign_in?: SignInMethods;
  /** New (#27): two-step sign-in's recovery codes, at the top level. */
  two_step?: { enabled: boolean, recovery_left: number | null, recovery_generated_at: number | null } | null;
  /** New (#27): an address change waiting, at the top level. */
  email_pending?: { address: string, expires_at: number } | null;
}

/**
 * `GET /v1/me` as the pages read it: the console (#27) answers the pending
 * address and the recovery codes left beside `account`, and the pages read
 * them from `account` and `sign_in`.
 */
export function meFrom (me: Me): Me {
  const out: Me = { ...me, account: { ...me.account } }
  if (me.email_pending !== undefined && out.account.email_pending === undefined) out.account.email_pending = me.email_pending
  const left = me.two_step?.recovery_left
  if (out.sign_in && typeof left === 'number' && out.sign_in.recovery_left === undefined) out.sign_in = { ...out.sign_in, recovery_left: left }
  return out
}

/** `GET` and `PUT /v1/me/preferences` answer `{preferences: {...}}`. */
function preferencesFrom (answer: EmailPreferences | { preferences: EmailPreferences }): EmailPreferences {
  return 'preferences' in answer ? answer.preferences : answer
}

export interface Session {
  id: string;
  device: string;
  endpoint_id: string | null;
  endpoint_proven?: boolean;
  kind: 'legacy' | 'rotating' | 'browser';
  client_id: string | null;
  created_at: number;
  last_used_at: number | null;
  expires_at: number;
  current: boolean;
  /** New: "Chrome on Windows", from the browser at sign-in. */
  device_label?: string | null;
  /** The browser session a client's session came from, when the console says. */
  parent_id?: string | null;
}

export interface AccountEvent {
  id: string;
  kind: string;
  detail: Record<string, unknown>;
  /** Seconds. */
  at: number;
}

export interface Passkey {
  id: string;
  name: string;
  created_at: number;
  last_used_at: number | null;
}

export interface Identity {
  provider: 'apple' | 'google' | string;
  email: string | null;
  created_at: number;
}

export interface ConsoleConfig {
  passkey_rp_id?: string;
  social?: { apple?: boolean, google?: boolean };
  push?: boolean;
}

/** What a sensitive change takes: the password, and a code with two-step sign-in on. */
export interface Reauth {
  password?: string;
  code?: string;
}

/** New: the account's email preferences. */
export interface EmailPreferences {
  email_access_requests: boolean;
  email_shared_with_you: boolean;
  email_community: boolean;
  email_news: boolean;
  /** KAN-1886: absent reads as private, licence not chosen. */
  library_defaults?: LibraryDefaults;
}

/**
 * KAN-1886: the starting choices for new things in the Library, saved per
 * account in `/v1/me/preferences`, as proj-api confirmed (console muon-link-cloud #130).
 * Change the shape here and nowhere else. `licence` is an SPDX id; null
 * is "not chosen", and the suggestion is never saved for the person.
 */
export type LibraryVisibility = 'private' | 'public'
export interface LibraryDefaults {
  visibility: LibraryVisibility;
  licence: string | null;
}

export const DEFAULT_LIBRARY_VISIBILITY: LibraryVisibility = 'private'
export const SUGGESTED_LICENCE = 'CC-BY-4.0'
export const LICENCES: Array<{ id: string, label: string }> = [
  { id: 'CC-BY-4.0', label: 'CC BY 4.0' },
  { id: 'CC-BY-SA-4.0', label: 'CC BY-SA 4.0' },
  { id: 'CC-BY-NC-4.0', label: 'CC BY-NC 4.0' },
  { id: 'CC-BY-NC-SA-4.0', label: 'CC BY-NC-SA 4.0' },
  { id: 'CC0-1.0', label: 'CC0 1.0 (public domain)' }
]

/**
 * What the page shows: the saved choice, else the default and the suggestion
 * (marked as not chosen). A console that answers preferences without the
 * object reads as private and not chosen; no answer at all is unsupported.
 */
export function libraryDefaultsView (preferences: { library_defaults?: LibraryDefaults } | null | undefined) {
  const saved = preferences?.library_defaults
  return {
    supported: !!preferences,
    visibility: saved?.visibility ?? DEFAULT_LIBRARY_VISIBILITY,
    licence: saved?.licence ?? SUGGESTED_LICENCE,
    licenceChosen: !!saved?.licence
  }
}

export interface PrinterShare {
  id: string;
  printer_id: string;
  email: string;
  role: 'operator' | 'viewer' | string;
  level?: string;
  ends_at: number | null;
  created_at: number;
  accepted?: boolean;
  /** Their profile name, when the console knows it. */
  name?: string;
  /** Their public photo (`/v1/public/avatars/:id`); 404s while their profile isn't visible. */
  avatar_url?: string | null;
}

export interface PrinterInvite {
  id: string;
  printer_id: string;
  email: string;
  role: string;
  ends_at: number | null;
  created_at: number;
}

export interface InviteLink {
  id: string;
  printer_id: string;
  role: string;
  approve_each: boolean;
  max_uses: number | null;
  uses?: number;
  expires_at: number | null;
  created_at: number;
  name?: string;
  url?: string;
}

export interface JoinApproval {
  id: string;
  kind: 'link_join';
  printer_id: string;
  printer_name?: string;
  link_id: string;
  role: string;
  state: 'pending' | 'allowed' | 'refused' | 'expired';
  requester?: { name?: string, email: string, avatar_url?: string | null };
  created_at: number;
  expires_at: number;
}

/** A session the sign-in page gets: kept only for the handoff. */
export interface SignInAnswer {
  token: string;
  refresh_token?: string;
  account: AccountDetails;
}

/**
 * New (muon-link-cloud KAN-1389): a credential change answers `session`, the
 * caller's new access and refresh token, and `null` when there is nothing to
 * re-key. `accountRequest` stores it.
 */
export interface Rekeyed {
  session?: { access_token: string, refresh_token?: string, session_id?: string } | null;
}

const json = <T>(method: string, path: string, body?: unknown) => accountRequest<T>(method, path, body)

export const accountApi = {
  config: () => json<ConsoleConfig>('GET', '/v1/config'),
  me: async () => meFrom(await json<Me>('GET', '/v1/me')),
  rename: (name: string) => json<{ account: AccountDetails }>('PATCH', '/v1/me', { name }),

  sessions: () => json<{ sessions: Session[] }>('GET', '/v1/me/sessions'),
  endSession: (id: string) => json<{ ok: boolean }>('DELETE', `/v1/me/sessions/${encodeURIComponent(id)}`),
  /** Ends the named browser and all its clients, even when given a child session ID. */
  endDevice: (id: string) => json<{ ok: boolean, ended: number }>('DELETE', `/v1/me/devices/${encodeURIComponent(id)}`),
  /** New: every session but this one (`others`), or every one (`all`). */
  endSessions: (scope: 'others' | 'all') => json<{ ok: boolean, ended?: number }>('DELETE', `/v1/me/sessions?scope=${scope}`),
  events: () => json<{ events: AccountEvent[] }>('GET', '/v1/me/events'),

  passkeys: () => json<{ passkeys: Passkey[] }>('GET', '/v1/me/passkeys'),
  passkeyCreateOptions: () => json<{ ceremony_id: string, options: { publicKey: Record<string, unknown> } }>('POST', '/v1/me/passkeys/options'),
  passkeyCreate: (ceremonyId: string, credential: unknown, name: string, reauth: Reauth = {}) =>
    json<{ id: string, name: string } & Rekeyed>('POST', '/v1/me/passkeys', { ceremony_id: ceremonyId, credential, name, ...reauth }),
  /** New. */
  renamePasskey: (id: string, name: string, reauth: Reauth = {}) => json<{ id: string, name: string }>('PATCH', `/v1/me/passkeys/${encodeURIComponent(id)}`, { name, ...reauth }),
  removePasskey: (id: string, reauth: Reauth = {}) => json<{ ok: boolean } & Rekeyed>('DELETE', `/v1/me/passkeys/${encodeURIComponent(id)}`, reauth),

  identities: () => json<{ identities: Identity[] }>('GET', '/v1/me/identities'),
  unlinkIdentity: (provider: string, reauth: Reauth = {}) => json<{ ok: boolean } & Rekeyed>('DELETE', `/v1/me/identities/${encodeURIComponent(provider)}`, reauth),

  totpBegin: (reauth: Reauth = {}) => json<{ secret: string, otpauth_url: string } & Rekeyed>('POST', '/v1/me/totp', reauth),
  totpConfirm: (code: string) => json<{ ok: boolean, recovery_codes: string[] } & Rekeyed>('POST', '/v1/me/totp/confirm', { code }),
  totpOff: (code: string) => json<{ ok: boolean } & Rekeyed>('DELETE', '/v1/me/totp', { code }),
  /** New. */
  newRecoveryCodes: (reauth: Reauth = {}) => json<{ ok: boolean, recovery_codes: string[], recovery_generated_at?: number } & Rekeyed>('POST', '/v1/me/totp/recovery-codes', reauth),

  changePassword: (newPassword: string, reauth: Reauth = {}) => json<{ ok: boolean } & Rekeyed>('PUT', '/v1/me/password', { new_password: newPassword, ...reauth }),
  changeEmail: (email: string, reauth: Reauth = {}) => json<{ ok: boolean }>('PUT', '/v1/me/email', { email, ...reauth }),
  /** New. */
  cancelEmailChange: () => json<{ ok: boolean }>('DELETE', '/v1/me/email/pending'),
  resendVerification: () => json<{ ok: boolean, already_verified?: boolean }>('POST', '/v1/me/email/verification'),

  /** New. */
  preferences: async () => preferencesFrom(await json<{ preferences: EmailPreferences }>('GET', '/v1/me/preferences')),
  /** Any of the four, flat. */
  setPreferences: async (patch: Partial<Omit<EmailPreferences, 'library_defaults'>>) => preferencesFrom(await json<{ preferences: EmailPreferences }>('PUT', '/v1/me/preferences', patch)),
  /** KAN-1886: only the part changed (a partial PUT; an unknown value is a 400). */
  setLibraryDefaults: async (patch: Partial<LibraryDefaults>) => preferencesFrom(await json<{ preferences: EmailPreferences }>('PUT', '/v1/me/preferences', { library_defaults: patch })),

  /**
   * The whole account as one JSON file: the raw response, to save. A console
   * that wants a fresh sign-in for it answers `reauth_required`; the password
   * then goes in a POST, since a GET has no body.
   */
  exportAccount: (reauth?: Reauth) => reauth
    ? accountRequest<Response>('POST', '/v1/me/export', reauth, { raw: true })
    : accountRequest<Response>('GET', '/v1/me/export', undefined, { raw: true }),
  retention: () => json<Record<string, unknown>>('GET', '/v1/retention'),
  /** The plan, credits left and when they renew (the console's proxy of the model service). */
  plan: () => json<PlanSummary>('GET', '/v1/me/plan'),
  /** Asks for the data export to be built and emailed. Takes the same confirmation as deleting the account. 202; 409 one is open; 429 once a day. */
  requestExport: (reauth: Reauth = {}, choice: { parts?: string[], format?: string } = {}) =>
    json<ExportRequest>('POST', '/v1/me/exports', { ...choice, ...reauth }),
  /** The last few export requests: a list, or `{exports: []}`. */
  exports: () => json<ExportRequest[] | { exports: ExportRequest[] }>('GET', '/v1/me/exports'),

  /**
   * Schedules deletion with a 14-day grace period. The page requires the
   * console's grace-period capability before offering this action.
   */
  deleteAccount: (reauth: Reauth) =>
    json<{ ok: boolean, delete_after?: number, unlinked?: number }>('DELETE', '/v1/me', reauth),
  /** New. */
  cancelDeletion: () => json<{ ok: boolean, account?: AccountDetails }>('POST', '/v1/me/deletion/cancel'),

  /** Personal access tokens (KAN-904): a signed-in session only. */
  tokens: () => json<{ tokens: PersonalToken[] }>('GET', '/v1/tokens'),
  /** The token is in the answer and nowhere else. `reauth` is the fresh two-step code a strong token takes. */
  createToken: (body: CreateTokenBody, reauth: Reauth = {}) =>
    json<CreatedToken>('POST', '/v1/tokens', Object.keys(reauth).length ? { ...body, reauth } : body),
  revokeToken: (id: string) => json<{ id: string, revoked: boolean }>('DELETE', `/v1/tokens/${encodeURIComponent(id)}`),

  /** Connected apps (KAN-905): the OAuth apps the account let in. A signed-in session only. */
  connectedApps: () => json<{ apps: ConnectedApp[] }>('GET', '/v1/me/connected-apps'),
  /** Ends every session the app holds for this account and removes its approval. */
  disconnectApp: (clientId: string) =>
    json<{ ok: boolean, client_id: string, sessions_ended: number }>('DELETE', `/v1/me/connected-apps/${encodeURIComponent(clientId)}`),

  shares: (printerId: string) => json<{ shares: PrinterShare[] }>('GET', `/v1/printers/${encodeURIComponent(printerId)}/shares`),
  share: (printerId: string, email: string, role: string, endsAt: number | null) =>
    json<{ share: PrinterShare }>('POST', `/v1/printers/${encodeURIComponent(printerId)}/shares`, { email, role, ends_at: endsAt }),
  removeShare: (printerId: string, shareId: string) =>
    json<{ ok: boolean }>('DELETE', `/v1/printers/${encodeURIComponent(printerId)}/shares/${encodeURIComponent(shareId)}`),
  invites: (printerId: string) => json<{ invites: PrinterInvite[] }>('GET', `/v1/printers/${encodeURIComponent(printerId)}/invites`),
  sendInvite: (printerId: string, email: string, role: string, endsAt: number | null) =>
    json<{ invite: PrinterInvite }>('POST', `/v1/printers/${encodeURIComponent(printerId)}/invites`, { email, role, ends_at: endsAt }),
  withdrawInvite: (printerId: string, inviteId: string) =>
    json<{ ok: boolean }>('DELETE', `/v1/printers/${encodeURIComponent(printerId)}/invites/${encodeURIComponent(inviteId)}`),
  links: (printerId: string) => json<{ links: InviteLink[] }>('GET', `/v1/printers/${encodeURIComponent(printerId)}/links`),
  revokeLink: (printerId: string, linkId: string) =>
    json<{ ok: boolean }>('DELETE', `/v1/printers/${encodeURIComponent(printerId)}/links/${encodeURIComponent(linkId)}`),
  approvals: () => json<{ approvals: JoinApproval[] }>('GET', '/v1/approvals'),
  answerApproval: (id: string, allow: boolean) =>
    json<{ approval: JoinApproval }>('POST', `/v1/approvals/${encodeURIComponent(id)}`, { allow })
}

/** One emailed data export (`GET /v1/me/exports`). Helpers are in plan-export.ts. */
export interface ExportRequest {
  id: string;
  status: 'queued' | 'building' | 'ready' | 'failed' | 'expired';
  requested_at?: number | string | null;
  ready_at?: number | string | null;
  expires_at?: number | string | null;
  size_bytes?: number | null;
}

/** `GET /v1/me/plan`. Helpers are in plan-export.ts. */
export interface PlanSummary {
  plan: { id?: string, name: string, renews_at?: string | number | null, will_renew?: boolean };
  credits?: {
    balance: number | null;
    unit?: string;
    weekly?: { used: number, limit: number, resets_at?: string | number | null };
    monthly?: { left: number, allowance: number };
  };
  /** Where the full credit history can be read. */
  ledger_url?: string | null;
  limits?: { jobs_at_once?: number };
  source?: 'model-service' | 'unavailable';
}
