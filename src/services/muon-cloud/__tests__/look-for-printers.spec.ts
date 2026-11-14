/**
 * KAN-2487: known printers are looked for when a menu opens or the page loads,
 * not only after a session to the printer is open.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const nearby = vi.hoisted(() => vi.fn(async () => ({ printers: [] as unknown[] })))
vi.mock('@/store', () => ({ default: { getters: { get 'config/getInstances' () { return [{ name: 'Sloe', apiUrl: 'http://sloe.local:7125' }] } } } }))
vi.mock('../api', () => ({ cloudApi: { nearby } }))

const { discoveryState, lookForPrinters } = await import('../discovery')

beforeEach(() => {
  nearby.mockClear()
  discoveryState.finishedAt = 0
  discoveryState.cloudChecked = false
})
afterEach(() => { vi.unstubAllGlobals() })

describe('looking for known printers (KAN-2487)', () => {
  it('asks the service who is beside this browser, and asks the saved printer, with no session open', async () => {
    const urls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: unknown) => { urls.push(String(url)); throw new TypeError('no') }))
    await lookForPrinters()
    expect(nearby).toHaveBeenCalledOnce()
    expect(discoveryState.cloudChecked).toBe(true)
    expect(urls.some(u => /^http:\/\/sloe\.local(:\d+)?\/server\/muon\/identity/.test(u))).toBe(true)
  }, 60000)

  it('does not ask the printers again inside the minute a search stays fresh (no hammering)', async () => {
    const fetchMock = vi.fn(async () => { throw new TypeError('no') })
    vi.stubGlobal('fetch', fetchMock)
    discoveryState.finishedAt = Date.now()
    await lookForPrinters()
    expect(nearby).toHaveBeenCalledOnce()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
