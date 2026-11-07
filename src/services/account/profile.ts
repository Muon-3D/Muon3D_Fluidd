/**
 * What Account › Profile says (Control v3, one identity), worked out from
 * what the console and the model service answer: plain functions, so the
 * page only lays them out and the rules are tested here.
 */
import type { CommunityIdentity, CommunityProfile } from './community'

export const HANDLE_MIN = 3
export const HANDLE_MAX = 24
/** A username can change once in this many days (the model service's rule). */
export const HANDLE_COOLDOWN_DAYS = 30
/** Names the service keeps for staff. The service decides; this refuses the obvious one before asking. */
export const RESERVED_HANDLES: readonly string[] = ['muon3d']
/** How long the Library may show the old name or privacy after a change (the identity lease). */
export const PROJECTION_WINDOW_MS = 120_000
export const LIBRARY_ORIGIN = 'https://library.muon3d.com'
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024
export const PHOTO_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/webp']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "jack", from "@Jack " (no "@", no spaces). */
export function cleanHandle (raw: string): string {
  return raw.trim().replace(/^@+/, '')
}

/** Why this username cannot be asked for, in words, or null when it can. */
export function handleProblem (raw: string): string | null {
  const handle = cleanHandle(raw)
  if (!handle) return 'Enter a username.'
  if (RESERVED_HANDLES.includes(handle.toLowerCase())) return 'That username is reserved.'
  if (!/^[A-Za-z0-9._]+$/.test(handle) || handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) {
    return `Use ${HANDLE_MIN}–${HANDLE_MAX} letters, digits, dots or underscores.`
  }
  return null
}

/** What the service's answer means for a username, in words (null: it is free). */
export function handleStatusText (status: string): string | null {
  switch (status) {
    case 'available': return null
    case 'taken': return 'That username is taken.'
    case 'reserved': return 'That username is reserved.'
    case 'held': return 'That username is held for its last owner for now.'
    default: return null
  }
}

/** When the username can change again (ms), or null when it can now. */
export function handleChangeableAt (changedAt: string | null | undefined, now: number = Date.now()): number | null {
  if (!changedAt) return null
  const at = Date.parse(changedAt)
  if (Number.isNaN(at)) return null
  const next = at + HANDLE_COOLDOWN_DAYS * 86_400_000
  return next > now ? next : null
}

/** "6 December". */
export function longDay (ms: number): string {
  const d = new Date(ms)
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`
}

/** "Oct 2026", from the account's creation (seconds). */
export function makerSince (seconds: number | null | undefined): string | null {
  if (!seconds) return null
  const d = new Date(seconds * 1000)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** The public page's address, linked by handle (old handles redirect to the current one). */
export function pageAddress (handle: string): string {
  return `library.muon3d.com/@${handle}`
}
export function pageUrl (handle: string): string {
  return `${LIBRARY_ORIGIN}/@${encodeURIComponent(handle)}`
}

/**
 * What still stops the page going public, in plain words, or null when
 * nothing does. A public page needs a handle, can_community, can_public,
 * identity_public and page_on (community/guard.rs). Only meant to be read
 * once Public is chosen. The client never sets page_on: the service decides.
 */
export function missingForPublic (identity: CommunityIdentity | null, profile: CommunityProfile | null): string | null {
  if (!identity) return null
  if (!identity.can_community) return 'Confirm your age first, under Private to you.'
  if (!identity.can_public) return 'Public pages are for people 18 and over.'
  if (!profile?.handle) return 'Choose a username first.'
  if (!identity.identity_public) return 'Choose Public to turn your page on.'
  if (!profile.page_on) return "Your page isn't on yet. Turn it on in your page settings in the Library."
  return null
}

/** The name or the photo is being checked (the service's community case). */
export function underReview (profile: CommunityProfile | null): { name: boolean, photo: boolean } {
  return { name: !!profile?.review?.name, photo: !!profile?.review?.photo }
}

/** A change the Library hasn't caught up with yet: what the console now has, and when it was saved. */
export interface PendingChange {
  name?: string;
  identityPublic?: boolean;
  since: number;
}

/**
 * "Updating the Library…": a rename or a privacy change was saved, and
 * /v1/community/profile doesn't yet report the new public_name /
 * identity_public, for at most 2 minutes.
 */
export function libraryUpdating (pending: PendingChange | null, profile: CommunityProfile | null, now: number = Date.now()): boolean {
  if (!pending || !profile) return false
  if (now - pending.since >= PROJECTION_WINDOW_MS) return false
  // A private profile may report no public name at all: only wait on the name when it is shown.
  if (pending.name !== undefined && profile.identity_public && profile.public_name !== pending.name) return true
  if (pending.identityPublic !== undefined && profile.identity_public !== pending.identityPublic) return true
  return false
}

/** "Over 18" or "Under 18": the status line once the age is confirmed (the number itself is never shown). */
export function ageText (declaredAge: number | null | undefined): string | null {
  if (typeof declaredAge !== 'number') return null
  return declaredAge >= 18 ? 'Over 18' : 'Under 18'
}

/**
 * Photo Remove waits for the model service's route (KAN-1594; there is none
 * today). Off unless VITE_PROFILE_PHOTO_REMOVE is "true".
 */
export function photoRemoveEnabled (): boolean {
  return import.meta.env.VITE_PROFILE_PHOTO_REMOVE === 'true'
}

/** What the service's photo refusals say, in words. */
export function photoRefusal (code: string): string | null {
  switch (code) {
    case 'avatar_too_large': return 'Choose a photo of at most 4 MB.'
    case 'avatar_format': return 'Choose a JPEG, PNG or WebP photo.'
    case 'avatar_invalid': return 'That photo could not be read. Try another one.'
    default: return null
  }
}

/** The error from an upload that can be refused before sending it, or null. */
export function photoProblem (file: { type: string, size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP photo.'
  if (file.size > PHOTO_MAX_BYTES) return 'Choose a photo of at most 4 MB.'
  return null
}
