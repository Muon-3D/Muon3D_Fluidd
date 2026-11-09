/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-1800: on the console's own secure origin, cloud tokens stay in
 * localStorage as before, so a reload keeps the session.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

async function load () {
  vi.resetModules()
  return import('../api')
}

beforeEach(() => localStorage.clear())

describe('cloud tokens on a secure origin', () => {
  it('stores both tokens in localStorage', async () => {
    const api = await load()
    api.storeToken('access-1')
    api.storeRefreshToken('refresh-1')
    expect(localStorage.getItem(api.TOKEN_KEY)).toBe('access-1')
    expect(localStorage.getItem(api.REFRESH_KEY)).toBe('refresh-1')
  })

  it('keeps tokens already stored across a load', async () => {
    localStorage.setItem('muon.cloud.token', 'kept-access')
    localStorage.setItem('muon.cloud.refresh', 'kept-refresh')
    const api = await load()
    expect(api.storedToken()).toBe('kept-access')
    expect(api.storedRefreshToken()).toBe('kept-refresh')
  })
})
