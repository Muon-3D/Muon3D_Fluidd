import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountApi } from '../api'
import { accountRequest } from '../client'
import { verifyEmail } from '../sign-in'

const BASE = 'https://control.example.test'

function answer (status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const SESSION = { access_token: 'access-2', refresh_token: 'refresh-2', session_id: 's1' }

// muon-link-cloud KAN-1389: a credential change ends the account's other
// sessions and re-keys this one. The new pair comes in `session`.
describe('a re-keyed session', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', BASE)
    localStorage.setItem('muon.cloud.token', 'access-1')
    localStorage.setItem('muon.cloud.refresh', 'refresh-1')
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  const stored = () => [localStorage.getItem('muon.cloud.token'), localStorage.getItem('muon.cloud.refresh')]

  it.each([
    ['changes the password', () => accountApi.changePassword('new pw', { password: 'old' })],
    ['confirms two-step sign-in', () => accountApi.totpConfirm('123456')],
    ['turns two-step sign-in off', () => accountApi.totpOff('123456')],
    ['makes new recovery codes', () => accountApi.newRecoveryCodes({})],
    ['adds a passkey', () => accountApi.passkeyCreate('c1', {}, 'Laptop')],
    ['removes a passkey', () => accountApi.removePasskey('p1')],
    ['unlinks a sign-in', () => accountApi.unlinkIdentity('google')],
    ['begins a two-step setup that replaces an unreadable secret', () => accountApi.totpBegin({})]
  ])('replaces the stored pair when the person %s', async (_name, call) => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, session: SESSION }))
    await call()
    expect(stored()).toEqual(['access-2', 'refresh-2'])
  })

  it('leaves the pair alone when there is nothing to re-key', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, session: null }))
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(stored()).toEqual(['access-1', 'refresh-1'])
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true }))
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(stored()).toEqual(['access-1', 'refresh-1'])
  })

  it('keeps the old refresh token when the answer carries only an access token', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, session: { access_token: 'access-2' } }))
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(stored()).toEqual(['access-2', 'refresh-1'])
  })

  it('does not store a pair from a failed change', async () => {
    fetchMock.mockResolvedValueOnce(answer(403, { error: 'that password is not right', reauth_required: true, session: SESSION }))
    await accountApi.changePassword('new pw', { password: 'bad' }).catch(() => undefined)
    expect(stored()).toEqual(['access-1', 'refresh-1'])
  })

  it('does not store a pair for a token it was handed (the sign-in page\'s own)', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, session: SESSION }))
    await accountRequest('PUT', '/v1/me/password', {}, { token: 'page-token' })
    expect(stored()).toEqual(['access-1', 'refresh-1'])
  })

  it('does not store a pair when the session changed while the request was in flight', async () => {
    fetchMock.mockImplementationOnce(async () => {
      localStorage.setItem('muon.cloud.token', 'signed-in-again')
      return answer(200, { ok: true, session: SESSION })
    })
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(localStorage.getItem('muon.cloud.token')).toBe('signed-in-again')
  })

  it('adopts the pair when storage was cleared while the request was in flight', async () => {
    fetchMock.mockImplementationOnce(async () => {
      localStorage.removeItem('muon.cloud.token')
      localStorage.removeItem('muon.cloud.refresh')
      return answer(200, { ok: true, session: SESSION })
    })
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(stored()).toEqual(['access-2', 'refresh-2'])
  })

  it('adopts the pair when the stored token is unchanged', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, session: SESSION }))
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(stored()).toEqual(['access-2', 'refresh-2'])
  })

  it('stays signed in on this device when a signed-in browser confirms a new address', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, email: 'new@example.test', session: SESSION }))
    await expect(verifyEmail('link-token')).resolves.toBe('new@example.test')
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.authorization).toBe('Bearer access-1')
    expect(stored()).toEqual(['access-2', 'refresh-2'])
  })

  it('sends no session when nobody is signed in, and stores nothing', async () => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', BASE)
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, email: 'new@example.test' }))
    await verifyEmail('link-token')
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBeUndefined()
    expect(stored()).toEqual([null, null])
  })

  it('does not ask the browser to send credentials cross-origin', async () => {
    // A page the console serves is same-origin, and the default sends and
    // takes the cookie. The console allows any origin without credentials,
    // so `include` would make every call from another origin fail.
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, session: SESSION }))
    await accountApi.changePassword('new pw', { password: 'old' })
    expect(fetchMock.mock.calls[0][1].credentials).toBeUndefined()
  })
})
