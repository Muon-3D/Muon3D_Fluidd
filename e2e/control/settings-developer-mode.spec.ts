/**
 * Settings › Developer mode, to its storyboard (KAN-2031): the state of this
 * printer, who may change it, what it unlocks (each linking to the page where
 * its locked row lives), and what is on offer while it is on.
 *
 * Gate rules these tests hold: Control never turns developer mode on (the first
 * turn-on is done at the printer's own screen, with the waiver), never sends a
 * change while it is off, and shows the printer's refusals in the printer's own
 * words. A request the printer refuses is answered by this test, as Moonraker
 * does: `dev-mode:<code>: <why>`.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

const OWNER = 'jack@example.com'
const REQUEST = '**/server/muon/dev_mode/request*'

/** What the printer says about developer mode and about who may ask. */
async function printerSays (page: Page, opts: { enabled: boolean, everEnabled?: boolean, mayAsk?: boolean, linked?: boolean, refuse?: string }) {
  await page.route('**/server/aux/dev_mode*', route => route.fulfill({
    json: { enabled: opts.enabled, guard_armed: true, ever_enabled: !!opts.everEnabled, otp_record_armed: false }
  }))
  const posts: string[] = []
  await page.route(REQUEST, route => {
    const request = route.request()
    if (request.method() === 'POST') {
      posts.push(request.postData() ?? '')
      return route.fulfill({
        status: 403,
        json: { error: { code: 403, message: opts.refuse ?? 'dev-mode:panel_only: This change is only taken on the printer\'s own screen.' } }
      })
    }
    return route.fulfill({
      json: { result: { as_owner: opts.mayAsk !== false, owner: { linked: opts.linked !== false, account: OWNER }, may_ask: opts.mayAsk !== false, waiver: null } }
    })
  })
  // Anything sent to ask for a change, from any call.
  const sent: string[] = []
  page.on('request', r => { if (r.method() === 'POST' && /dev_mode/.test(r.url())) sent.push(r.url()) })
  return { posts, sent }
}

const pane = (page: Page) => page.getByTestId('settings-pane')

async function openDeveloperMode (page: Page, open: (path: string) => Promise<unknown>) {
  await open('/settings#developer')
  await expect(page.getByTestId('page-title')).toHaveText('Developer mode')
  await expect(pane(page).getByTestId('developer-mode-card')).toBeVisible()
}

test('the owner sees the state, who can change it, and what it unlocks', async ({ page, open }) => {
  await printerSays(page, { enabled: true, everEnabled: true })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-eyebrow')).toHaveText('On')
  await expect(p.getByTestId('developer-mode-state')).toContainText('runs your copy of its configuration')
  await expect(p.getByTestId('developer-mode-who-line')).toContainText(`Only ${OWNER} (the owner) can change it`)
  await expect(p.getByTestId('developer-mode-warranty')).toContainText('warranty ends')
  await expect(p.getByTestId('developer-mode-switch')).toBeVisible()
  await expect(p.getByTestId('developer-mode-go-to-printer')).toHaveCount(0)
  await expect(p.getByText('What it unlocks · 8')).toBeVisible()
  await expect(p.getByTestId('developer-mode-unlocks').getByRole('link')).toHaveCount(8)
  await expect(p.getByTestId('developer-backup')).toBeEnabled()
  await expect(p.getByTestId('developer-reset')).toBeEnabled()
})

test('every unlock links to the page where its row lives', async ({ page, open }) => {
  await printerSays(page, { enabled: false })
  await openDeveloperMode(page, open)
  await expect(pane(page).getByTestId('developer-unlock-config')).toHaveAttribute('href', /\/configure$/)
  await expect(pane(page).getByTestId('developer-unlock-updates')).toHaveAttribute('href', /\/settings#versions$/)
  await pane(page).getByTestId('developer-unlock-macros').click()
  await expect(page).toHaveURL(/\/settings#macros$/)
  // Jack, OV-30 (11 Nov, later than KAN-1970): the management page is called Macros; it holds the Quick commands section.
  await expect(page.getByTestId('page-title')).toHaveText('Macros')
})

test('off the first time: says to do it at the printer, offers no switch and sends nothing', async ({ page, open }) => {
  const { posts, sent } = await printerSays(page, { enabled: false })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-eyebrow')).toHaveText('Off')
  const go = p.getByTestId('developer-mode-go-to-printer')
  await expect(go).toContainText("Go to the printer's screen to turn on developer mode")
  await expect(go).toContainText('System, then Protection, then Developer mode')
  await expect(go).toContainText('ends the warranty')
  await expect(p.getByTestId('developer-mode-switch')).toHaveCount(0)
  await expect(p.getByRole('button', { name: 'Turn on' })).toHaveCount(0)
  await expect(p.getByTestId('developer-backup')).toBeDisabled()
  await expect(p.getByTestId('developer-reset')).toBeDisabled()
  await page.waitForTimeout(500)
  expect(posts).toEqual([])
  expect(sent).toEqual([])
})

test('off after it was accepted before: still turned on at the printer, nothing sent', async ({ page, open }) => {
  const { posts, sent } = await printerSays(page, { enabled: false, everEnabled: true })
  await openDeveloperMode(page, open)
  const go = pane(page).getByTestId('developer-mode-go-to-printer')
  await expect(go).toContainText('accepted the terms on this printer before')
  await expect(go).toContainText('still done at the printer')
  await expect(pane(page).getByTestId('developer-mode-switch')).toHaveCount(0)
  await page.waitForTimeout(500)
  expect(posts).toEqual([])
  expect(sent).toEqual([])
})

test('someone who is not the owner sees it read-only, with the reason', async ({ page, open }) => {
  await printerSays(page, { enabled: true, mayAsk: false })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-eyebrow')).toHaveText('On')
  await expect(p.getByTestId('developer-mode-switch')).toHaveCount(0)
  await expect(p.getByTestId('developer-mode-who')).toContainText(`Only ${OWNER} can change developer mode on this printer`)
  await expect(p.getByTestId('developer-mode-unlocks').getByRole('link')).toHaveCount(8)
})

test('a printer that only takes the change at its own screen says so, and nothing waits', async ({ page, open }) => {
  const { posts } = await printerSays(page, { enabled: true })
  await openDeveloperMode(page, open)
  await pane(page).getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-disable-dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByTestId('developer-disable').click()
  await expect(dialog).toContainText('The printer only takes this at its own screen. Go there: System, then Protection, then Developer mode.')
  // Control asked to turn it off, once, and nothing opened a wait for a press.
  expect(posts).toHaveLength(1)
  expect(JSON.parse(posts[0])).toEqual({ enabled: false })
  await expect(dialog.getByTestId('developer-press-knob')).toHaveCount(0)
})

test("an owner-required refusal is shown in the printer's own words", async ({ page, open }) => {
  await printerSays(page, { enabled: true, refuse: 'dev-mode:owner_required: Only jack@example.com can change developer mode on this printer. Do it at the printer.' })
  await openDeveloperMode(page, open)
  await pane(page).getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-disable-dialog')
  await dialog.getByTestId('developer-disable').click()
  await expect(dialog).toContainText('Only jack@example.com can change developer mode on this printer. Do it at the printer.')
})

test('a printer that is not a Muon has no developer mode page', async ({ page, open }) => {
  await usePrinter(page, {}, { components: ['update_manager'] })
  await open('/settings')
  await expect(page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: /^General/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Developer mode' })).toHaveCount(0)
  await open('/settings#developer')
  await expect(page.getByTestId('developer-mode-card')).toHaveCount(0)
})
