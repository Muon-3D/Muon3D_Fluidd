/**
 * Links from outside (control-v3 link storyboard) and the 404 state: /link,
 * /join and /print each land on one centred card, with one primary. Linking
 * and joining are presses, never something opening the link does. The
 * console is the e2e fake; its join answer is set per test here.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'

const card = (page: Page) => page.getByTestId('landing-card')

async function land (page: Page, path: string) {
  await page.goto(path)
  await ready(page)
  await expect(card(page)).toBeVisible()
}

/** The card is centred at its own width on a desktop, and fills a phone's. */
async function expectCardShape (page: Page) {
  const box = (await card(page).boundingBox())!
  const width = page.viewportSize()!.width
  if (width >= 1024) {
    expect(box.width).toBeLessThanOrEqual(461)
    expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(160)
  } else {
    expect(box.width).toBeGreaterThan(width - 40)
  }
}

/** The console's join and approval endpoints, answered as the test says; every request is kept. */
async function fakeJoin (page: Page, answer: { status: number, body: unknown }) {
  const calls: string[] = []
  await page.route(`${CONSOLE}/v1/links/join/**`, route => {
    const request = route.request()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    calls.push(`${request.method()} ${new URL(request.url()).pathname}`)
    return route.fulfill({ status: answer.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(answer.body) })
  })
  return calls
}

const APPROVAL = { id: 'ap1', kind: 'link_join', printer_id: 'p1', printer_name: 'Birch', link_id: 'l1', role: 'viewer', state: 'pending', created_at: 1, expires_at: 4_000_000_000, answered_at: null }

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('/link: the code from the link fills the boxes, and only Link printer claims it', async ({ page, account }) => {
    await land(page, '/link?code=472913')
    await expectCardShape(page)
    await expect(page.getByRole('heading', { name: 'Link a printer' })).toBeVisible()
    const boxes = page.getByTestId('link-code')
    await expect(boxes).toHaveCount(6)
    await expect(boxes.first()).toHaveValue('4')
    await expect(boxes.last()).toHaveValue('3')
    expect(account.changes.filter(c => c.call === 'POST /v1/links/claim')).toEqual([])

    await page.getByTestId('link-button').click()
    await expect.poll(() => account.changes.filter(c => c.call === 'POST /v1/links/claim')).toEqual([{ call: 'POST /v1/links/claim', body: { code: '472913' } }])
    await expect(page.getByText('Confirm on the printer').first()).toBeVisible()
  })

  test('/link with no code: Link printer waits for six digits', async ({ page, account }) => {
    await land(page, '/link')
    await expect(page.getByTestId('link-button')).toBeDisabled()
    await page.getByTestId('link-code').first().click()
    await page.keyboard.type('47291')
    await expect(page.getByTestId('link-button')).toBeDisabled()
    expect(account.changes).toEqual([])
  })

  test('/join: the invite, Not now and Accept; Accept posts the code once and waits for the owner', async ({ page }) => {
    const calls = await fakeJoin(page, { status: 200, body: { state: 'pending', printer_id: 'p1', approval: APPROVAL } })
    await land(page, '/join?code=7kq2m-9xdpf')
    await expectCardShape(page)
    await expect(page.getByTestId('join-invite')).toContainText('7KQ2M-9XDPF')
    await expect(page.getByTestId('join-button')).toHaveText('Accept invite')
    expect(calls).toEqual([])

    await page.getByTestId('join-button').click()
    await expect(page.getByRole('heading', { name: 'Waiting for the owner' })).toBeVisible()
    await expect(page.getByTestId('join-pending')).toContainText('Waiting for the owner of Birch to approve')
    expect(calls).toEqual(['POST /v1/links/join/7KQ2M9XDPF'])
  })

  test('/join: a used-up link says so in the card, and Accept stays', async ({ page }) => {
    await fakeJoin(page, { status: 410, body: { error: { code: 'gone', message: 'gone' } } })
    await land(page, '/join?code=7kq2m-9xdpf')
    await page.getByTestId('join-button').click()
    await expect(page.getByTestId('join-error')).toBeVisible()
    await expect(page.getByTestId('join-button')).toBeEnabled()
  })

  test('/join: Not now leaves without joining', async ({ page }) => {
    const calls = await fakeJoin(page, { status: 200, body: {} })
    await land(page, '/join?code=7kq2m-9xdpf')
    await page.getByTestId('join-not-now').click()
    await expect(page).not.toHaveURL(/\/join/)
    expect(calls).toEqual([])
  })

  test('/join with a broken code says it is incomplete, and asks nothing', async ({ page }) => {
    const calls = await fakeJoin(page, { status: 200, body: {} })
    await land(page, '/join?code=nope')
    await expect(page.getByTestId('join-bad-code')).toBeVisible()
    await expect(page.getByTestId('join-button')).toHaveCount(0)
    expect(calls).toEqual([])
  })

  test('404: the empty-state card, and Back to printers', async ({ page }) => {
    await land(page, '/no/such/page')
    await expectCardShape(page)
    await expect(page.getByRole('heading', { name: "That page isn't here" })).toBeVisible()
    await page.getByTestId('not-found-back').click()
    await expect(page).not.toHaveURL(/no\/such\/page/)
  })
})

test.describe('signed out', () => {
  test('/join and /print ask for the account first, and post nothing', async ({ page }) => {
    const calls = await fakeJoin(page, { status: 200, body: {} })
    await land(page, '/join?code=7kq2m-9xdpf')
    await expect(page.getByTestId('join-sign-in')).toBeVisible()
    await expect(page.getByTestId('join-sign-in-button')).toBeVisible()

    await land(page, '/print?library=item&version=1')
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible()
    await expect(page.getByTestId('handoff-sign-in')).toBeVisible()
    expect(calls).toEqual([])
  })
})
