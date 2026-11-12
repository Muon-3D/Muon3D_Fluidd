import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureModelsTransport, MODELS_AUDIENCE, MODELS_SERVICE_URL, MODELS_URL, modelsResourceUrl, resolveModelsUrl } from '../transport'
import { createLibraryClient } from '../api'
import { safePicture } from '../discover'

const printer = { hosted: false, blacklist: [] }
const hosted = { hosted: true, blacklist: [] }
const page = { origin: 'http://boxwood.local', hostname: 'boxwood.local' }

// Written out, not imported: these are the production values the build ships
// when no VITE_MODELS_* is set, and the test is that the constants hold them.
const SERVICE = 'https://library.muon3d.com/models'
const AUDIENCE = 'https://models.muon3d.com'

afterEach(() => configureModelsTransport(hosted))

describe('Library transport', () => {
  it('addresses the service at the Library site, and keeps the audience as its own identifier', () => {
    expect(MODELS_SERVICE_URL).toBe(SERVICE)
    expect(MODELS_AUDIENCE).toBe(AUDIENCE)
    expect(MODELS_URL).toBe(SERVICE)
  })

  it('uses host configuration, not the selected printer or route', () => {
    expect(resolveModelsUrl(printer, page)).toBe('http://boxwood.local/models')
    expect(resolveModelsUrl(hosted, page)).toBe(SERVICE)
    expect(resolveModelsUrl({ ...printer, blacklist: ['boxwood.local'] }, page)).toBe(SERVICE)
    expect(resolveModelsUrl(hosted, page, 'http://localhost:8091///')).toBe('http://localhost:8091')
    expect(resolveModelsUrl(printer, page, 'http://localhost:8091')).toBe('http://boxwood.local/models')
  })

  it('rewrites only service-owned resources and preserves encoded paths and signatures', () => {
    const base = 'http://boxwood.local/models'
    expect(modelsResourceUrl('/v1/files/a%2Fb?key=x%2Fy', base)).toBe(`${base}/v1/files/a%2Fb?key=x%2Fy`)
    // The service's address, and the name older deployments still write into links.
    expect(modelsResourceUrl(`${SERVICE}/v1/images/a`, base)).toBe(`${base}/v1/images/a`)
    expect(modelsResourceUrl(`${AUDIENCE}/v1/images/a`, base)).toBe(`${base}/v1/images/a`)
    expect(modelsResourceUrl(`${SERVICE}/v1/images/a?x=1#y`, base)).toBe(`${base}/v1/images/a?x=1#y`)
    // The Library site itself is not the service: only what is under /models.
    expect(modelsResourceUrl('https://library.muon3d.com/p/a-print', base)).toBe('https://library.muon3d.com/p/a-print')
    expect(modelsResourceUrl('https://library.muon3d.com/modelsx/v1/a', base)).toBe('https://library.muon3d.com/modelsx/v1/a')
    expect(modelsResourceUrl('https://bucket.example/a?X-Signature=a%2Fb', base)).toBe('https://bucket.example/a?X-Signature=a%2Fb')
    expect(modelsResourceUrl('https://models.muon3d.com.evil.test/a', base)).toBe('https://models.muon3d.com.evil.test/a')
    expect(modelsResourceUrl('https://library.muon3d.com.evil.test/models/v1/a', base)).toBe('https://library.muon3d.com.evil.test/models/v1/a')
    expect(modelsResourceUrl('/v1/a', 'http://localhost:8091', 'http://localhost:8091')).toBe('http://localhost:8091/v1/a')
    expect(() => modelsResourceUrl('https://[')).toThrow()
  })

  it('hosted Control reaches service links at the service address, whichever name they were written with', () => {
    expect(modelsResourceUrl(`${AUDIENCE}/v1/images/a`)).toBe(`${SERVICE}/v1/images/a`)
    expect(modelsResourceUrl(`${SERVICE}/v1/images/a`)).toBe(`${SERVICE}/v1/images/a`)
    expect(modelsResourceUrl('/v1/images/a')).toBe(`${SERVICE}/v1/images/a`)
  })

  it('updates clients created before host configuration, without changing the audience', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'))
    const client = createLibraryClient({ assertion: { get: async () => 'assertion', drop: vi.fn() }, fetch: fetcher })
    configureModelsTransport(printer)
    expect(client.base).toBe(`${window.location.origin}/models`)
    expect(MODELS_AUDIENCE).toBe(AUDIENCE)
    await client.info()
    expect(fetcher).toHaveBeenCalledWith(`${window.location.origin}/models/v1/library`, expect.objectContaining({ headers: { authorization: 'Bearer assertion' } }))
    expect(safePicture(`${AUDIENCE}/v1/images/a`)).toBe(`${window.location.origin}/models/v1/images/a`)
    expect(safePicture(`${SERVICE}/v1/images/a`)).toBe(`${window.location.origin}/models/v1/images/a`)
    expect(safePicture('')).toBeNull()
    expect(safePicture('javascript:alert(1)')).toBeNull()
    expect(safePicture('http://elsewhere.test/a')).toBeNull()
  })

  it('routes service transfers through the proxy but leaves bucket transfers unauthenticated', async () => {
    configureModelsTransport(printer)
    const proxy = `${window.location.origin}/models`
    const fetcher = vi.fn().mockImplementation(async () => new Response('bytes'))
    const send = vi.fn().mockResolvedValue(200)
    const client = createLibraryClient({ assertion: { get: async () => 'assertion', drop: vi.fn() }, fetch: fetcher, send })
    for (const origin of [AUDIENCE, SERVICE]) {
      const transfer = { method: 'GET', url: `${origin}/v1/files/a`, needs_auth: true, expires_at: '' }
      await client.get(transfer)
      await client.put(transfer, new Uint8Array([1]))
      expect(fetcher).toHaveBeenLastCalledWith(`${proxy}/v1/files/a`, expect.objectContaining({ headers: { authorization: 'Bearer assertion' } }))
      expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ url: `${proxy}/v1/files/a`, headers: { authorization: 'Bearer assertion' } }))
    }
    const bucket = { method: 'GET', url: 'https://bucket.example/a?sig=1', needs_auth: false, expires_at: '' }
    await client.get(bucket)
    expect(fetcher).toHaveBeenLastCalledWith('https://bucket.example/a?sig=1', { method: 'GET' })
    await client.put(bucket, new Uint8Array([1]))
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'https://bucket.example/a?sig=1', headers: {} }))
  })
})
