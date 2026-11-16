/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2756: where the console serves Control, signing out still posts the
 * console's `/logout` form and says the page is navigating away.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
const signOutCentral = vi.hoisted(() => vi.fn())
vi.mock('../centralLogin', async (actual) => ({ ...(await actual() as object), signOutCentral }))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  signOutCentral.mockClear()
  vi.stubEnv('VUE_MUON_CLOUD_URL', 'https://control.muon3d.com')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('signing out on the console\'s own Control', () => {
  it('still posts the console\'s logout form', async () => {
    vi.resetModules()
    const login = await import('../centralLogin')
    const state = await import('../state')
    expect(login.centralLoginEnabled()).toBe(true)

    await expect(state.signOut()).resolves.toBe(true)

    expect(signOutCentral).toHaveBeenCalledTimes(1)
  })
})
