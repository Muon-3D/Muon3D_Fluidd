/**
 * One sign-in (`/sign-in`, control-v3 sign-in storyboard): the account's card,
 * with Sign in and Create account as a segment, the two-step code and Forgot
 * password in the same card, and a quiet line to the printer's own login.
 * The console's auth API is faked here; nothing reaches a real account.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { CONSOLE } from '../fakes/console'

interface AuthCall { path: string, body: Record<string, unknown> }

/** The console's sign-in endpoints: a wrong password, then a two-step code, as a test asks. */
async function fakeAuth (page: Page, answer: (path: string, body: Record<string, unknown>) => { status: number, body: unknown }) {
  const calls: AuthCall[] = []
  await page.route(`${CONSOLE}/v1/auth/**`, async route => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    }
    const path = new URL(request.url()).pathname
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>
    calls.push({ path, body })
    const { status, body: reply } = answer(path, body)
    return route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply) })
  })
  return calls
}

async function openSignIn (page: Page) {
  await page.goto('/sign-in?continue=%2Fauthorize%3Fclient_id%3Dfluidd')
  await expect(page.getByTestId('auth-card')).toBeVisible()
}

test('one card: Sign in and Create account are a segment, and the printer path sits under Continue', async ({ page }, info) => {
  await openSignIn(page)
  const card = page.getByTestId('auth-card')
  await expect(card.getByRole('heading', { level: 1 })).toHaveText('Sign in to Muon3D')
  await expect(page.getByTestId('sign-in-tab')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('sign-in-submit')).toHaveText('Continue')
  await expect(page.getByTestId('sign-in-printer')).toHaveAttribute('href', /\/login$/)
  await expect(card).toContainText('Printing on this network only?')
  // No printer chrome on the account's own page.
  await expect(page.locator('.muon-background-logo')).toHaveCount(0)

  const box = (await card.boundingBox())!
  const width = page.viewportSize()!.width
  if (info.project.name === 'phone') {
    // Fills the width and sits near the top, above the keyboard.
    expect(box.width).toBeGreaterThan(width - 40)
    expect(box.y).toBeLessThan(40)
  } else {
    expect(Math.round(box.width)).toBe(440)
  }

  await page.getByTestId('sign-up-tab').click()
  await expect(card.getByRole('heading', { level: 1 })).toHaveText('Create your Muon3D account')
  await expect(page.getByTestId('sign-up-tab')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('sign-up-age')).toBeVisible()
  await expect(page.getByTestId('sign-in-submit')).toHaveText('Create account')
  await page.getByTestId('sign-in-tab').click()
  await expect(card.getByRole('heading', { level: 1 })).toHaveText('Sign in to Muon3D')
})

test('a wrong password says so in the card, and a two-step account asks for its code there', async ({ page }) => {
  let tries = 0
  const calls = await fakeAuth(page, path => {
    if (path === '/v1/auth/sign-in') {
      tries++
      return tries === 1
        ? { status: 401, body: { error: 'that email or password is not right' } }
        : { status: 403, body: { error: 'enter the code', mfa_required: true, mfa_token: 'mfa-1' } }
    }
    return { status: 400, body: { error: 'that code is not right' } }
  })
  await openSignIn(page)
  await page.getByTestId('sign-in-email').fill('jack@muon3d.com')
  await page.getByTestId('sign-in-password').fill('wrong')
  await page.getByTestId('sign-in-submit').click()
  await expect(page.getByTestId('sign-in-error')).toBeVisible()

  await page.getByTestId('sign-in-password').fill('correct horse')
  await page.getByTestId('sign-in-submit').click()
  await expect(page.getByTestId('auth-card').getByRole('heading', { level: 1 })).toHaveText('Enter your code')
  await expect(page.getByTestId('sign-in-tab')).toHaveCount(0)
  await page.getByTestId('sign-in-code').fill('482 913')
  await page.getByTestId('sign-in-submit').click()
  await expect(page.getByTestId('sign-in-error')).toBeVisible()

  expect(calls.map(c => c.path)).toEqual(['/v1/auth/sign-in', '/v1/auth/sign-in', '/v1/auth/mfa'])
  expect(calls[2].body).toMatchObject({ mfa_token: 'mfa-1', code: '482913' })

  await page.getByTestId('sign-in-back').click()
  await expect(page.getByTestId('sign-in-tab')).toBeVisible()
})

test('Forgot? sits in the password field and sends the link from the same card', async ({ page }) => {
  const calls = await fakeAuth(page, () => ({ status: 200, body: {} }))
  await openSignIn(page)
  await page.getByTestId('sign-in-forgot').click()
  const card = page.getByTestId('auth-card')
  await expect(card.getByRole('heading', { level: 1 })).toHaveText('Forgot your password?')
  await expect(page.getByTestId('sign-in-password')).toHaveCount(0)
  await page.getByTestId('sign-in-email').fill('someone@example.com')
  await page.getByTestId('sign-in-submit').click()
  await expect(page.getByTestId('sign-in-sent')).toContainText('If there\'s an account for someone@example.com')
  expect(calls).toEqual([{ path: '/v1/auth/password/forgot', body: { email: 'someone@example.com' } }])
})

test('the console unreachable says so in the card', async ({ page }) => {
  await page.route(`${CONSOLE}/v1/auth/**`, route => route.abort('internetdisconnected'))
  await openSignIn(page)
  await page.getByTestId('sign-in-email').fill('jack@muon3d.com')
  await page.getByTestId('sign-in-password').fill('correct horse')
  await page.getByTestId('sign-in-submit').click()
  await expect(page.getByTestId('sign-in-error')).toBeVisible()
  await expect(page.getByTestId('sign-in-submit')).toBeEnabled()
})
