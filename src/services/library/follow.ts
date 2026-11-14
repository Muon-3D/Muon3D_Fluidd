/**
 * Following public collections (Library M6). The model service's routes
 * (src/saves.rs): `PUT/DELETE /v1/community/collections/:id/follow` (204; at
 * 500 follows a new one is refused 400 `follow_limit` with the service's own
 * words; one that is not public, or that its owner has withdrawn, is 404),
 * `GET /v1/community/collections/followed` (`{collections}`, the public view
 * of each without items) and the public read `GET /v1/public/collections/:id`
 * (no account, no assertion), which carries the items with their cards.
 *
 * The service names no owner on a collection, so none is shown.
 */
import { MODELS_URL, type CommunityCollection, type CommunityCollectionDetail } from './api'

/** A collection that is missing, private, or whose owner has gone: the one "not available" state. */
export class CollectionUnavailable extends Error {
  constructor () {
    super('This collection is not available.')
    this.name = 'CollectionUnavailable'
  }
}

/** Read `GET /v1/public/collections/:id` (404 is "not available"; anything else is a failure to retry). */
export async function loadPublicCollection (id: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<CommunityCollectionDetail> {
  let response: Response
  try {
    response = await fetcher(`${MODELS_URL}/v1/public/collections/${encodeURIComponent(id)}`, { method: 'GET', credentials: 'omit', signal })
  } catch {
    throw new Error('The Library can\'t be reached. Check this computer\'s internet connection.')
  }
  if (response.status === 404) throw new CollectionUnavailable()
  if (!response.ok) throw new Error('The Library didn\'t answer. Try again.')
  const body = await response.json().catch(() => null) as CommunityCollectionDetail | null
  if (!body || typeof body.id !== 'string' || typeof body.name !== 'string' || !Array.isArray(body.items)) {
    throw new Error('The Library sent an answer this version of Control can\'t read.')
  }
  return body
}

/** The followed collections from an answer, only well-formed ones. */
export function followedList (value: unknown): CommunityCollection[] {
  const list = (value as { collections?: unknown } | null)?.collections
  if (!Array.isArray(list)) return []
  return list.filter((c): c is CommunityCollection => !!c && typeof c === 'object' && typeof (c as CommunityCollection).id === 'string' && typeof (c as CommunityCollection).name === 'string')
}

/** "3 prints", "1 print". */
export function printCount (n: number): string {
  return `${n} ${n === 1 ? 'print' : 'prints'}`
}
