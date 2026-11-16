/**
 * @vitest-environment-options { "url": "http://192.168.1.20/" }
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { discoverPrinters, resetPageBlockCheck } from '../discovery'

vi.mock('@/store', () => ({ default: { getters: { get 'config/getInstances' () { return [] } } } }))
vi.mock('../api', () => ({ cloudApi: { nearby: vi.fn(async () => ({ printers: [] })) } }))

afterEach(() => { vi.unstubAllGlobals(); resetPageBlockCheck() })

describe('served from the printer over http', () => {
  it('still runs the local discovery', async () => {
    const urls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: unknown) => { urls.push(String(url)); throw new TypeError('no') }))
    await discoverPrinters(true, { nearby: false })
    expect(urls.some(u => u.startsWith('http://192.168.1.20/server/muon/identity'))).toBe(true)
    expect(urls.length).toBeGreaterThan(100)
  }, 60000)
})
