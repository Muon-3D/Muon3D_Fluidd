/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { storedToken } from '../api'
import { signIn, signInWithCode } from '../state'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

function answer (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body), headers: { get: () => null } } as unknown as Response
}

beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('two-step sign-in against the console', () => {
  it('hands back the mfa token when the console asks for the code, storing nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer(403, { error: 'enter the code from your authenticator app', mfa_required: true, mfa_token: 'mfa-1' })))
    expect(await signIn('jack@example.test', 'pw')).toBe('mfa-1')
    expect(storedToken()).toBeNull()
  })

  it('still throws every other failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer(401, { error: 'wrong email or password' })))
    await expect(signIn('jack@example.test', 'pw')).rejects.toThrow('wrong email or password')
  })

  it('posts the token and the code (spaces removed) to /v1/auth/mfa', async () => {
    const fetch = vi.fn(async () => answer(401, { error: 'that code is not right' }))
    vi.stubGlobal('fetch', fetch)
    await expect(signInWithCode('mfa-1', '482 913')).rejects.toThrow('that code is not right')
    expect(new URL((fetch.mock.calls[0] as unknown as [string])[0]).pathname).toBe('/v1/auth/mfa')
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ mfa_token: 'mfa-1', code: '482913' })
  })
})
