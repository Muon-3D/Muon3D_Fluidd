import { describe, expect, it, vi } from 'vitest'
import { buildCacheNames, buildSuffix, deleteStaleCaches } from '@/swCaches'
import swSource from '@/sw.ts?raw'

const SHA = '745987ae0c1d2e3f4a5b6c7d8e9f001122334455'

describe('the service worker caches', () => {
  it('carry the build sha in every name', () => {
    const names = buildCacheNames(SHA)
    expect(buildSuffix(SHA)).toBe('745987ae0c1d')
    for (const name of Object.values(names)) expect(name).toContain('745987ae0c1d')
    expect(buildCacheNames('aaaaaaaaaaaa1111').precache).not.toBe(names.precache)
  })

  it('delete every cache of another build on activate, and keep the current ones', async () => {
    const names = buildCacheNames(SHA)
    const existing = [
      'workbox-precache-v2-https://control.muon3d.com/',
      'config', 'muon-assets',
      buildCacheNames('aaaaaaaaaaaa1111').precache,
      names.precache, names.config, names.assets
    ]
    const store = { keys: vi.fn(async () => existing), delete: vi.fn(async () => true) }
    const removed = await deleteStaleCaches(store, SHA)
    expect(removed.sort()).toEqual(existing.slice(0, 4).sort())
    expect(store.delete).toHaveBeenCalledTimes(4)
    expect(store.delete).not.toHaveBeenCalledWith(names.precache)
  })
})

describe('sw.ts', () => {
  it('names its caches by build, takes over at once and cleans up on activate', () => {
    expect(swSource).toMatch(/setCacheNameDetails\(/)
    expect(swSource).toMatch(/self\.skipWaiting\(\)/)
    expect(swSource).toMatch(/clientsClaim\(\)/)
    expect(swSource).toMatch(/addEventListener\('activate'/)
    expect(swSource).toMatch(/deleteStaleCaches\(/)
    expect(swSource).toMatch(/cleanupOutdatedCaches\(\)/)
  })
})
