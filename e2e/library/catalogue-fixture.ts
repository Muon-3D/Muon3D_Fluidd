import type { Page } from '@playwright/test'
import { test as base, expect } from '../fixtures'
import { MODELS, type ModelServiceState, type FakePublication } from '../fakes/models'

export interface CatalogueState { urls: URL[], ratings: boolean }

export async function serveCatalogue (page: Page, models: ModelServiceState): Promise<CatalogueState> {
  const state: CatalogueState = { urls: [], ratings: false }
  const summary = (p: FakePublication) => ({ ...p, thumbnail_url: `${MODELS}/v1/public/publications/${p.id}/images/thumb`, size_mm: [40, 30, 20], material: 'PLA', print_profile: { material: 'PLA', estimated_seconds: 600 }, licence: 'CC0-1.0' })
  const categories = () => ['home', 'workshop', 'tools', 'art'].map(slug => ({ slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), description: `Original ideas for ${slug}.`, count: models.publications.filter(p => p.category === slug).length }))
  await page.route(url => /^\/v1\/public\/(discover$|categories($|\/)|search($|\/))/.test(url.pathname.replace(/^\/models/, '')), async route => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace(/^\/models/, '')
    state.urls.push(url)
    const headers = { 'access-control-allow-origin': '*' }
    if (models.failWith) return route.fulfill({ status: models.failWith, headers, json: {} })
    const items = models.publications.map(summary)
    if (path === '/v1/public/discover') {
      const slot = { headline: 'Small prints. Everyday possibilities.', target_kind: 'publication', target: items[0] }
      return route.fulfill({ headers, json: { hero: slot, shelves: [{ slug: 'everyday', title: 'A little more useful', description: 'Simple ideas that earn their place.', items: items.map(target => ({ target_kind: 'publication', target })) }], m1_ready: [], trending: items, new: items, new_this_week: { window_seconds: 604800, items }, made_for_m1: { basis: 'publisher_tag_not_hardware_verification', items: items.filter(p => p.tags.includes('m1-ready')) } } })
    }
    if (path === '/v1/public/categories') return route.fulfill({ headers, json: { categories: categories() } })
    const q = url.searchParams.get('q')?.toLowerCase() || ''
    const category = path.startsWith('/v1/public/categories/') ? path.split('/').pop() : null
    const found = items.filter(p => (!category || p.category === category) && (!q || [p.title, p.creator.display_name, ...p.tags].join(' ').toLowerCase().includes(q)) && (!url.searchParams.get('material') || p.material === url.searchParams.get('material')) && (!url.searchParams.get('max_size') || 40 <= Number(url.searchParams.get('max_size'))) && (!url.searchParams.get('max_seconds') || 600 <= Number(url.searchParams.get('max_seconds'))))
    return route.fulfill({ headers, json: { items: found, next_cursor: null, ratings_available: state.ratings, empty_help: found.length ? null : { message: 'Try a shorter search or browse a category.', categories: categories() } } })
  })
  return state
}

export const test = base.extend<{ catalogue: CatalogueState }>({ catalogue: [async ({ page, models }, use) => { await use(await serveCatalogue(page, models)) }, { auto: true }] })
export { expect }
