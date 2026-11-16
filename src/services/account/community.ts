import { accountRequest } from './client'
import { modelsAssertion } from '@/services/library/assertion'
import { MODELS_URL, libraryErrorFrom } from '@/services/library/api'

export interface CommunityIdentity {
  declared_age: number | null;
  declared_at: number | null;
  can_community: boolean;
  can_public: boolean;
  identity_public: boolean;
  revision: number;
  projection_pending: boolean;
}
export interface CommunityProfile {
  handle: string | null;
  public_name: string | null;
  identity_public: boolean;
  can_community: boolean;
  can_public: boolean;
  page_on: boolean;
  bio: string | null;
  /** RFC 3339: when the handle last changed (the 30-day limit). */
  handle_changed_at?: string | null;
  /** The processed photo, when there is one. */
  avatar_url?: string | null;
  /** Open community cases on this profile (`target_kind 'profile'`): the name or the photo is being checked. */
  review?: { name?: boolean, photo?: boolean } | null;
}
/** `GET /v1/community/handles/:h`. */
export type HandleStatus = 'available' | 'taken' | 'reserved' | 'held'

async function models<T> (method: string, path: string, body?: unknown, raw?: Blob): Promise<T> {
  const proof = await modelsAssertion.get()
  const headers: Record<string, string> = { authorization: `Bearer ${proof}` }
  if (raw) headers['content-type'] = raw.type
  else if (body !== undefined) headers['content-type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(`${MODELS_URL}${path}`, {
      method,
      credentials: 'omit',
      cache: 'no-store',
      headers,
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body))
    })
  } catch {
    throw libraryErrorFrom(0, { error: { code: 'offline', message: "Your Library can't be reached. Check this computer's internet connection." } })
  }
  const text = await response.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!response.ok) {
    if (response.status === 401) modelsAssertion.drop()
    throw libraryErrorFrom(response.status, data)
  }
  return data as T
}

/** Your own photo, as the service keeps it (it is only public while the page is). */
async function ownPhoto (): Promise<Blob> {
  const proof = await modelsAssertion.get()
  let response: Response
  try {
    response = await fetch(`${MODELS_URL}/v1/community/profile/avatar`, { credentials: 'omit', cache: 'no-store', headers: { authorization: `Bearer ${proof}` } })
  } catch {
    throw libraryErrorFrom(0, { error: { code: 'offline', message: "Your Library can't be reached. Check this computer's internet connection." } })
  }
  if (!response.ok) throw libraryErrorFrom(response.status, null)
  return response.blob()
}

export const communityApi = {
  identity: () => accountRequest<CommunityIdentity>('GET', '/v1/me/community-identity'),
  saveIdentity: (body: { declared_age?: number, identity_public?: boolean }) => accountRequest<CommunityIdentity>('PATCH', '/v1/me/community-identity', body),
  profile: () => models<CommunityProfile>('GET', '/v1/community/profile'),
  claim: (handle: string) => models<CommunityProfile>('PUT', '/v1/community/profile/handle', { handle }),
  available: (handle: string) => models<{ handle: string, status: HandleStatus }>('GET', `/v1/community/handles/${encodeURIComponent(handle)}`),
  saveAbout: (bio: string) => models<CommunityProfile>('PUT', '/v1/community/profile', { bio }),
  uploadPhoto: (photo: Blob) => models<CommunityProfile>('PUT', '/v1/community/profile/avatar', undefined, photo),
  removePhoto: () => models<CommunityProfile>('DELETE', '/v1/community/profile/avatar'),
  photo: ownPhoto
}
