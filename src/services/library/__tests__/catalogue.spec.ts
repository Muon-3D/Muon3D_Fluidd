/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest'
import { browse, categories, dimensionFit, suggestions } from '../catalogue'
import { loadShelves } from '../shelves'

const item = { id: 'one', slug: 'one', title: 'Original spacer', category: 'tools', creator: { handle: 'muon3d', display_name: 'Muon3D' }, tags: [], size_mm: [25, 15, 3], created_at: '2026-11-10T10:00:00Z', thumbnail_url: 'https://models.muon3d.com/one.png' }
const fetcher = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('M3 catalogue', () => {
  it('uses Discover alone when the new seven-day contract is present, including hero, editorial and M1 candidates', async () => {
    const read = fetcher({ m1_ready: [], trending: [item], new: [], hero: { headline: 'Start small', target_kind: 'publication', target: item }, shelves: [{ slug: 'official', title: 'Start making', description: 'Your first project', items: [{ target_kind: 'publication', target: item }] }], made_for_m1: { basis: 'publisher_tag_not_hardware_verification', items: [item] }, new_this_week: { window_seconds: 604800, items: [item] } })
    const result = await loadShelves(read)
    expect(read).toHaveBeenCalledTimes(1)
    expect(result.catalogue?.hero?.headline).toBe('Start small')
    expect(result.catalogue?.shelves[0].cards[0].picture).toMatch(/one.png/)
    expect(result.catalogue?.week[0].size).toEqual([25, 15, 3])
    expect(result.m1).toHaveLength(1)
  })
  it('reads category metadata/counts and gracefully names categories on an older service', async () => {
    expect(await categories(undefined, fetcher({ categories: [{ slug: 'tools', name: 'Tools', description: 'Useful prints', count: 2 }] }))).toHaveLength(1)
    const fallback = await categories(undefined, fetcher({}, 404))
    expect(fallback).toHaveLength(9)
    expect(fallback.every(c => c.count === null)).toBe(true)
    expect(await categories(undefined, fetcher({ categories: [] }))).toEqual([])
    await expect(categories(undefined, fetcher({}, 502))).rejects.toThrow(/Try again/)
  })
  it('sends all filters and the exact cursor to the category page, retaining help and genuine ratings capability', async () => {
    const read = fetcher({ items: [], next_cursor: 'c:bound:24', ratings_available: false, empty_help: { message: 'Remove a filter', categories: [{ slug: 'home', name: 'Home', count: 3 }] } })
    const result = await browse('tools', '', { sort: 'trending', fits: '200,200,200', material: 'PLA', licence: 'CC0-1.0', min_size: '10', max_size: '50', min_seconds: '0', max_seconds: '3600' }, 'c:bound:12', undefined, read)
    const url = new URL(vi.mocked(read).mock.calls[0][0] as string)
    expect(url.pathname).toBe('/v1/public/categories/tools')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ fits: '200,200,200', material: 'PLA', min_seconds: '0', max_seconds: '3600', min_size: '10', max_size: '50', licence: 'CC0-1.0', cursor: 'c:bound:12', sort: 'trending' })
    expect(result.help?.message).toBe('Remove a filter')
    expect(result.ratings).toBe(false)
  })
  it('reads bounded suggestions, accepts an empty result, and surfaces read errors', async () => {
    expect(await suggestions('spacer', undefined, fetcher({ items: [item] }))).toHaveLength(1)
    expect(await suggestions('spacer', undefined, fetcher({ items: [] }))).toEqual([])
    expect(await suggestions('spacer', undefined, fetcher({}, 404))).toEqual([])
    await expect(suggestions('spacer', undefined, fetcher({}, 429))).rejects.toThrow(/still search/)
    await expect(browse(null, 'spacer', { sort: 'new' }, null, undefined, fetcher({}, 502))).rejects.toThrow(/Try again/)
  })
  it('falls back to public publications on an older category service without claiming advanced filtering', async () => {
    const read = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 404 })).mockResolvedValueOnce(new Response(JSON.stringify({ items: [item], next_cursor: null }))) as unknown as typeof fetch
    const result = await browse('tools', 'spacer', { sort: 'new' }, null, undefined, read)
    expect(result.legacy).toBe(true)
    expect(result.cards.map(c => c.title)).toEqual(['Original spacer'])
    expect(result.ratings).toBe(false)
  })
  it('checks all three real dimensions without treating an M1 tag or unknown measurements as proof', () => {
    const volume = { x: 200, y: 200, z: 200 }
    expect(dimensionFit([25, 15, 3], volume)).toBe(true)
    expect(dimensionFit([25, 15, 201], volume)).toBe(false)
    expect(dimensionFit(null, volume)).toBeNull()
    expect(dimensionFit([NaN, 2, 3], volume)).toBeNull()
    expect(dimensionFit([2, 3, 4], null)).toBeNull()
  })
})
