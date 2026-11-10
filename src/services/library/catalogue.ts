import { MODELS_URL } from './api'
import { isSummary, loadPublications, summaryCard, type ShelfCard, type PublicationSummary } from './shelves'

export interface Category { slug: string, name: string, description: string, count: number | null }
export interface CatalogueFilters {
  sort: 'relevance' | 'popular' | 'new' | 'trending';
  fits?: string;
  material?: string;
  licence?: string;
  min_size?: string;
  max_size?: string;
  min_seconds?: string;
  max_seconds?: string;
  rating?: string;
}
export interface BrowsePage {
  cards: ShelfCard[];
  cursor: string | null;
  help: { message: string, categories: Category[] } | null;
  ratings: boolean;
  legacy: boolean;
}

const CATEGORY_NAMES = [['home', 'Home'], ['workshop', 'Workshop'], ['toys-games', 'Toys and games'], ['cosplay', 'Cosplay'], ['tools', 'Tools'], ['art', 'Art'], ['spare-parts', 'Spare parts'], ['education', 'Education'], ['other', 'Other']]

export async function categories (signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<Category[]> {
  const response = await fetcher(`${MODELS_URL}/v1/public/categories`, { credentials: 'omit', signal })
  if (response.status === 404) return CATEGORY_NAMES.map(([slug, name]) => ({ slug, name, description: '', count: null }))
  if (!response.ok) throw new Error('Categories did not answer. Try again.')
  const body = await response.json()
  if (!Array.isArray(body?.categories)) throw new Error('Categories could not be read. Try again.')
  return body.categories.filter((c: Category) => c && typeof c.slug === 'string' && typeof c.name === 'string')
}

export async function browse (category: string | null, query: string, filters: CatalogueFilters, cursor: string | null, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<BrowsePage> {
  const params = new URLSearchParams({ limit: '24' })
  if (query.trim()) params.set('q', query.trim())
  if (cursor) params.set('cursor', cursor)
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  const path = category ? `/v1/public/categories/${encodeURIComponent(category)}` : '/v1/public/search'
  const response = await fetcher(`${MODELS_URL}${path}?${params}`, { credentials: 'omit', signal })
  if (response.status === 404) {
    const page = await loadPublications({ category: category ?? undefined, sort: filters.sort === 'relevance' ? 'new' : filters.sort, limit: 24 }, fetcher, signal)
    return { cards: page.items.map(summaryCard).filter(c => !query || [c.title, c.creator, ...c.tags].join(' ').toLowerCase().includes(query.toLowerCase())), cursor: null, help: null, ratings: false, legacy: true }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message || (response.status === 429 ? 'Too many searches. Try again in a minute.' : 'The Library did not answer. Try again.'))
  }
  const body = await response.json()
  if (!Array.isArray(body?.items)) throw new Error('The Library could not be read. Try again.')
  return { cards: body.items.filter(isSummary).map(summaryCard), cursor: typeof body.next_cursor === 'string' ? body.next_cursor : null, help: body.empty_help && typeof body.empty_help.message === 'string' ? { message: body.empty_help.message, categories: Array.isArray(body.empty_help.categories) ? body.empty_help.categories : [] } : null, ratings: body.ratings_available === true, legacy: false }
}

export async function suggestions (query: string, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<PublicationSummary[]> {
  const response = await fetcher(`${MODELS_URL}/v1/public/search/suggestions?q=${encodeURIComponent(query.trim())}`, { credentials: 'omit', signal })
  if (response.status === 404) return []
  if (!response.ok) throw new Error('Suggestions are unavailable. You can still search.')
  const body = await response.json()
  if (!Array.isArray(body?.items)) throw new Error('Suggestions could not be read. You can still search.')
  return body.items.filter(isSummary).slice(0, 6)
}

export function dimensionFit (size: number[] | null | undefined, volume: { x: number, y: number, z: number } | null): boolean | null {
  if (!volume || !size || size.length !== 3 || size.some(v => !Number.isFinite(v) || v <= 0)) return null
  return size.every((v, i) => v <= [volume.x, volume.y, volume.z][i])
}
