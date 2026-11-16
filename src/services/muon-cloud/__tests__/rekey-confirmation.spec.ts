// A credential change gives this tab a new token for the same account: the confirmation moves with it, so the
// assertion cache keeps serving without a reload (account/client.ts adoptRekeyedSession).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, storeToken, storedToken } from '../api'
import { cloudState, resetReconcileForTests, signIn, signOut } from '../state'
import { accountRequest } from '@/services/account/client'
import { modelsAssertion } from '@/services/library/assertion'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
vi.mock('../centralLogin', async (importActual) => ({ ...await importActual<typeof import('../centralLogin')>(), signOutCentral: vi.fn() }))

const jack = { id: 'acct-jack', name: 'Jack', email: 'jack@example.test', created_at: 1 }
let issued = 0

function answer (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } } as unknown as Response
}

beforeEach(async () => {
  localStorage.clear()
  issued = 0
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  vi.spyOn(cloudApi, 'assertion').mockImplementation(async () => ({ assertion: `assertion-${++issued}`, expires_at: Date.now() / 1000 + 300 }))
  vi.spyOn(cloudApi, 'signIn').mockResolvedValue({ token: 'token-jack', account: jack })
  await signIn(jack.email, 'pw')
})

afterEach(async () => {
  resetReconcileForTests()
  await signOut()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('a password change', () => {
  it('keeps the assertion cache serving with the re-keyed token, without a reload', async () => {
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
    vi.stubGlobal('fetch', vi.fn(async () => answer(200, { ok: true, session: { access_token: 'token-jack-rekeyed', refresh_token: 'refresh-rekeyed' } })))
    await accountRequest('POST', '/v1/me/password', { password: 'new' })
    expect(storedToken()).toBe('token-jack-rekeyed')
    // The cache is keyed by the session too: the new token asks once more, and is served (not not-signed-in).
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-2')
  })

  it('asks /me when a token is stored where none was (a refresh cleared storage while the change was in flight)', async () => {
    const me = vi.spyOn(cloudApi, 'me').mockResolvedValue({ account: jack, endpoint_id: null })
    vi.stubGlobal('fetch', vi.fn(async () => {
      storeToken(null)
      return answer(200, { ok: true, session: { access_token: 'token-jack-rekeyed', refresh_token: 'refresh-rekeyed' } })
    }))
    await accountRequest('POST', '/v1/me/password', { password: 'new' })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(me).toHaveBeenCalledTimes(1)
    expect(cloudState.account?.id).toBe('acct-jack')
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
  })
})

describe('an e-mailed verify link', () => {
  it('does not carry this account\'s confirmation to the session it returns, which may be another account\'s', async () => {
    const harry = { id: 'acct-harry', name: 'Harry', email: 'harry@example.test', created_at: 2 }
    let answerMe: (value: { account: typeof harry, endpoint_id: null }) => void = () => {}
    const me = vi.spyOn(cloudApi, 'me').mockImplementation(() => new Promise(resolve => (answerMe = resolve)))
    expect((await modelsAssertion.getWithExpiry()).assertion).toBe('assertion-1')
    vi.stubGlobal('fetch', vi.fn(async () => answer(200, { ok: true, email: 'harry@example.test', session: { access_token: 'token-harry', refresh_token: 'refresh-harry' } })))
    await accountRequest('POST', '/v1/auth/email/verify', { token: 'link' }, { token: storedToken(), adopt: true })
    expect(storedToken()).toBe('token-harry')
    // Not confirmed for Jack: nothing is served until /me names the account.
    await expect(modelsAssertion.getWithExpiry()).rejects.toMatchObject({ code: 'not-signed-in' })
    expect(me).toHaveBeenCalled()
    answerMe({ account: harry, endpoint_id: null })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(cloudState.account?.id).toBe('acct-harry')
  })
})
