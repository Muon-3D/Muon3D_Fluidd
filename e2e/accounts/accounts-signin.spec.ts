/**
 * KAN-7197: Control signs in through accounts.muon3d.com (code + PKCE S256). Runs against a vite built with
 * VITE_CONTROL_ACCOUNTS_SIGNIN=true on this origin (playwright.accounts.config.ts); the accounts issuer is a fake
 * served by the test at <origin>/accounts.
 */
import type { Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { test, expect } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'

const PORT = Number(process.env.E2E_ACCOUNTS_PORT || 8092)
const ORIGIN = `http://localhost:${PORT}`
const ISS = `${ORIGIN}/accounts`

interface Seen { authorize: URLSearchParams[], token: URLSearchParams[] }

/** What the fake issuer does with each /authorize: `answer` returns the query of the redirect back. */
async function fakeAccounts (page: Page, answer: (q: URLSearchParams, n: number) => Record<string, string>): Promise<Seen> {
  const seen: Seen = { authorize: [], token: [] }
  await page.route(`${ISS}/authorize**`, route => {
    const q = new URL(route.request().url()).searchParams
    seen.authorize.push(q)
    const back = new URLSearchParams(answer(q, seen.authorize.length))
    route.fulfill({ status: 303, headers: { location: `${ORIGIN}/?${back.toString()}` } })
  })
  await page.route(`${ISS}/token`, route => {
    seen.token.push(new URLSearchParams(route.request().postData() ?? ''))
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ access_token: 'issued-access', refresh_token: 'issued-refresh', token_type: 'Bearer', expires_in: 900 }) })
  })
  return seen
}

test.beforeEach(async ({ page, account }) => {
  await serveConsoleHere(page, account, ORIGIN)
})

const granted = (q: URLSearchParams) => ({ code: 'code-1', state: q.get('state')!, iss: ISS })
const tokens = (page: Page) => page.evaluate(() => ({ access: localStorage.getItem('muon.cloud.token'), refresh: localStorage.getItem('muon.cloud.refresh') }))

test('with no session, Control bounces to accounts (prompt=none) and comes back signed in', async ({ page, open }) => {
  const seen = await fakeAccounts(page, granted)
  await open('/')
  await expect.poll(async () => (await tokens(page)).access).toBe('issued-access')
  expect((await tokens(page)).refresh).toBe('issued-refresh')
  const q = seen.authorize[0]
  expect(q.get('prompt')).toBe('none')
  expect(q.get('client_id')).toBe('fluidd')
  expect(q.get('code_challenge_method')).toBe('S256')
  expect(q.get('redirect_uri')).toBe(`${ORIGIN}/`)
  expect(q.has('nonce')).toBe(false)
  expect(q.get('scope') ?? '').not.toContain('openid')
  // The code is redeemed at accounts with the verifier whose S256 is the challenge, and nothing is left in storage.
  expect(seen.token).toHaveLength(1)
  const verifier = seen.token[0].get('code_verifier')!
  expect(createHash('sha256').update(verifier).digest('base64url')).toBe(q.get('code_challenge'))
  expect(seen.token[0].get('client_id')).toBe('fluidd')
  const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage }))
  expect(stored).not.toContain(verifier)
  // code, state and iss are gone from the address.
  expect(page.url()).not.toMatch(/[?&](code|state|iss)=/)
})

test('login_required after the bounce goes on to accounts\' own sign-in (no prompt), then signs in', async ({ page, open }) => {
  const seen = await fakeAccounts(page, (q, n) => n === 1 ? { error: 'login_required', state: q.get('state')!, iss: ISS } : granted(q))
  await open('/')
  await expect.poll(async () => (await tokens(page)).access).toBe('issued-access')
  expect(seen.authorize).toHaveLength(2)
  expect(seen.authorize[0].get('prompt')).toBe('none')
  expect(seen.authorize[1].has('prompt')).toBe(false)
})

test('a return with the wrong state redeems nothing and leaves no code in the address', async ({ page, open }) => {
  const seen = await fakeAccounts(page, () => ({ code: 'code-1', state: 'not-ours', iss: ISS }))
  await open('/')
  await expect.poll(() => page.url()).not.toContain('code=')
  expect(seen.token).toHaveLength(0)
  expect((await tokens(page)).access).toBeNull()
})

test('a return from the wrong issuer redeems nothing', async ({ page, open }) => {
  const seen = await fakeAccounts(page, q => ({ code: 'code-1', state: q.get('state')!, iss: 'https://control.muon3d.com' }))
  await open('/')
  await expect.poll(() => page.url()).not.toContain('code=')
  expect(seen.token).toHaveLength(0)
  expect((await tokens(page)).access).toBeNull()
})
