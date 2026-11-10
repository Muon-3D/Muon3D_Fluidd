import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureModelsTransport, MODELS_AUDIENCE, MODELS_URL, modelsResourceUrl, resolveModelsUrl } from '../transport'
import { createLibraryClient } from '../api'
import { safePicture } from '../discover'

const printer = { hosted: false, blacklist: [] }
const hosted = { hosted: true, blacklist: [] }
const page = { origin: 'http://boxwood.local', hostname: 'boxwood.local' }

afterEach(() => configureModelsTransport(hosted))

describe('Library transport', () => {
  it('uses host configuration, not the selected printer or route', () => {
    expect(resolveModelsUrl(printer, page)).toBe('http://boxwood.local/models')
    expect(resolveModelsUrl(hosted, page)).toBe(MODELS_AUDIENCE)
    expect(resolveModelsUrl({ ...printer, blacklist: ['boxwood.local'] }, page)).toBe(MODELS_AUDIENCE)
    expect(resolveModelsUrl(hosted, page, 'http://localhost:8091///')).toBe('http://localhost:8091')
    expect(resolveModelsUrl(printer, page, 'http://localhost:8091')).toBe('http://boxwood.local/models')
  })

  it('rewrites only service-owned resources and preserves encoded paths and signatures', () => {
    const base = 'http://boxwood.local/models'
    expect(modelsResourceUrl('/v1/files/a%2Fb?key=x%2Fy', base)).toBe(`${base}/v1/files/a%2Fb?key=x%2Fy`)
    expect(modelsResourceUrl(`${MODELS_AUDIENCE}/v1/images/a`, base)).toBe(`${base}/v1/images/a`)
    expect(modelsResourceUrl('https://bucket.example/a?X-Signature=a%2Fb', base)).toBe('https://bucket.example/a?X-Signature=a%2Fb')
    expect(modelsResourceUrl('https://models.muon3d.com.evil.test/a', base)).toBe('https://models.muon3d.com.evil.test/a')
    expect(modelsResourceUrl('/v1/a', 'http://localhost:8091', 'http://localhost:8091')).toBe('http://localhost:8091/v1/a')
    expect(() => modelsResourceUrl('https://[')).toThrow()
  })

  it('updates clients created before host configuration, without changing the audience', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'))
    const client = createLibraryClient({ assertion: { get: async () => 'assertion', drop: vi.fn() }, fetch: fetcher })
    configureModelsTransport(printer)
    expect(client.base).toBe(`${window.location.origin}/models`)
    expect(MODELS_AUDIENCE).toBe('https://models.muon3d.com')
    await client.info()
    expect(fetcher).toHaveBeenCalledWith(`${MODELS_URL}/v1/library`, expect.objectContaining({ headers: { authorization: 'Bearer assertion' } }))
    expect(safePicture(`${MODELS_AUDIENCE}/v1/images/a`)).toBe(`${MODELS_URL}/v1/images/a`)
    expect(safePicture('')).toBeNull()
    expect(safePicture('javascript:alert(1)')).toBeNull()
    expect(safePicture('http://elsewhere.test/a')).toBeNull()
  })

  it('routes service transfers through the proxy but leaves bucket transfers unauthenticated', async () => {
    configureModelsTransport(printer)
    const fetcher = vi.fn().mockImplementation(async () => new Response('bytes'))
    const send = vi.fn().mockResolvedValue(200)
    const client = createLibraryClient({ assertion: { get: async () => 'assertion', drop: vi.fn() }, fetch: fetcher, send })
    const transfer = { method: 'GET', url: `${MODELS_AUDIENCE}/v1/files/a`, needs_auth: true, expires_at: '' }
    await client.get(transfer)
    await client.put(transfer, new Uint8Array([1]))
    expect(fetcher).toHaveBeenCalledWith(`${MODELS_URL}/v1/files/a`, expect.objectContaining({ headers: { authorization: 'Bearer assertion' } }))
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ url: `${MODELS_URL}/v1/files/a`, headers: { authorization: 'Bearer assertion' } }))
    await client.get({ ...transfer, url: 'https://bucket.example/a?sig=1', needs_auth: false })
    expect(fetcher).toHaveBeenLastCalledWith('https://bucket.example/a?sig=1', { method: 'GET' })
    await client.put({ ...transfer, url: 'https://bucket.example/a?sig=1', needs_auth: false }, new Uint8Array([1]))
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'https://bucket.example/a?sig=1', headers: {} }))
  })
})
