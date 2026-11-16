/**
 * @vitest-environment-options { "url": "https://abcdefghijklmnopqrst.lan.muon3d.com/" }
 *
 * KAN-2756: the console refuses a `/logout` post from a printer's own page,
 * and a printer page must not end the person's console session anyway. So
 * signing out there is local: this page's session only, no form post.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
const signOutCentral = vi.hoisted(() => vi.fn())
vi.mock('../centralLogin', async (actual) => ({ ...(await actual() as object), signOutCentral }))

const CONSOLE = 'https://control.muon3d.com'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  signOutCentral.mockClear()
  vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('signing out on a printer\'s own address', () => {
  it('ends this page\'s session only and posts nothing to the console', async () => {
    vi.resetModules()
    const api = await import('../api')
    const login = await import('../centralLogin')
    const state = await import('../state')
    expect(login.centralLoginEnabled()).toBe(true)
    api.storeToken('access-1')
    expect(api.storedToken()).toBe('access-1')
    const createElement = vi.spyOn(document, 'createElement')

    await expect(state.signOut()).resolves.toBe(false)

    expect(api.storedToken()).toBeNull()
    expect(signOutCentral).not.toHaveBeenCalled()
    expect(createElement).not.toHaveBeenCalledWith('form')
    // No silent sign-in straight after; the sign-in button still starts a trip.
    expect(sessionStorage.getItem('muon.cloud.silent')).toBe('1')
  })
})
