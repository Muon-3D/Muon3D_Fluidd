/**
 * Settings › Developer mode, to its storyboard (KAN-2031): the state of this
 * printer, who may change it, what it unlocks (each linking to the page where
 * its locked row lives), and what is on offer while it is on.
 *
 * Rules these tests hold (Jack, 17 Nov): developer mode is turned on and off from
 * Control over any route. Only the FIRST release of the warranty is confirmed on
 * the printer's own screen: Control shows the terms, then "Confirm on the
 * printer", and waits. After that a change does not wait. The printer's refusals
 * are shown in its own words. A request the printer refuses is answered by this
 * test, as Moonraker does: `dev-mode:<code>: <why>`.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

const OWNER = 'jack@example.com'
const REQUEST = '**/server/muon/dev_mode/request*'

const CHALLENGE = 'Zb3s0VJpXkq2c1yN8dRtLw4mPa7oQe6F'
const WAIVER = { version: 'w-1', text: "The printer's own waiver terms." }

/**
 * What the printer says about developer mode and who may ask, and what it does
 * with a change. `confirm()` is the person at the printer pressing the knob. A
 * printer takes a later change at once (no challenge) unless `alwaysConfirm`.
 */
async function printerSays (page: Page, opts: { enabled: boolean, everEnabled?: boolean, guardArmed?: boolean, mayAsk?: boolean, linked?: boolean, refuse?: string, alwaysConfirm?: boolean, declined?: boolean, precondition?: boolean, postOnly?: 405 | 403 }) {
  const printer = { enabled: opts.enabled, everEnabled: !!opts.everEnabled, confirmed: false }
  await page.route('**/server/aux/dev_mode*', route => opts.postOnly === 403
    // Over Bluetooth or the relay muon-link keeps /server/aux/ closed to every role.
    ? route.fulfill({ status: 403, json: { error: { code: 403, message: 'Forbidden' } } })
    : route.fulfill({ json: { enabled: printer.enabled, guard_armed: opts.guardArmed !== false, ever_enabled: printer.everEnabled, otp_record_armed: false } }))
  // The read-only state every route can read (Moonraker's /server/muon/dev_mode).
  await page.route('**/server/muon/dev_mode', route => route.fulfill({ json: { result: { enabled: printer.enabled } } }))
  const posts: string[] = []
  let polls = 0
  await page.route(REQUEST, route => {
    const request = route.request()
    if (opts.postOnly && request.method() !== 'POST') {
      // What train 17 ships: Moonraker registers the route for POST alone (aux_api_proxy.py), so a GET is
      // Tornado's 405 on the printer's own page; over Bluetooth muon-link's policy.rs has no GET rule for it, so 403.
      return route.fulfill(opts.postOnly === 405
        ? { status: 405, contentType: 'text/html', body: '<html><title>405: Method Not Allowed</title><body>405: Method Not Allowed</body></html>' }
        : { status: 403, json: { error: { code: 403, message: 'Forbidden' } } })
    }
    if (request.method() === 'POST') {
      const raw = request.postData() ?? ''
      posts.push(raw)
      if (opts.refuse) {
        return route.fulfill({ status: 403, json: { error: { code: 403, message: opts.refuse } } })
      }
      const body = JSON.parse(raw) as { enabled: boolean, challenge_id?: string }
      if (!body.challenge_id) {
        if (printer.everEnabled && !opts.alwaysConfirm) {
          printer.enabled = body.enabled
          return route.fulfill({ json: { result: { enabled: printer.enabled } } })
        }
        // 428: the warranty release must be signed on the printer's screen first; no challenge is named.
        if (opts.precondition && !printer.everEnabled) return route.fulfill({ status: 428, json: { error: { code: 428, message: "dev-mode:confirmation_required: Sign the warranty release on the printer's screen first." } } })
        // Train 17's Moonraker answers the id and nothing else.
        if (opts.postOnly) return route.fulfill({ json: { result: { challenge_id: CHALLENGE } } })
        return route.fulfill({ json: { result: { challenge_id: CHALLENGE, expires_in_seconds: 120, enabled: body.enabled, instruction: 'Press the knob on the printer to confirm.', waiver: WAIVER } } })
      }
      if (!printer.confirmed) return route.fulfill({ status: 428, json: { error: { code: 428, message: "dev-mode:confirmation_required: Confirm this on the printer's panel first." } } })
      printer.enabled = body.enabled
      if (body.enabled) printer.everEnabled = true
      return route.fulfill({ json: { result: { enabled: printer.enabled, released: true } } })
    }
    if (request.url().includes('challenge_id=')) {
      polls++
      return route.fulfill({ json: { result: { challenge_id: CHALLENGE, confirmed: printer.confirmed, refused: !!opts.declined, enabled: !printer.enabled } } })
    }
    return route.fulfill({
      json: { result: { as_owner: opts.mayAsk !== false, owner: { linked: opts.linked !== false, account: OWNER }, may_ask: opts.mayAsk !== false, waiver: WAIVER } }
    })
  })
  // Anything sent to ask for a change, from any call.
  const sent: string[] = []
  page.on('request', r => { if (r.method() === 'POST' && /dev_mode/.test(r.url())) sent.push(r.url()) })
  return {
    posts,
    sent,
    printer,
    polls: () => polls,
    // On a POST-only printer the person at the screen redeems it: no second POST comes from Control.
    confirm: () => { printer.confirmed = true; if (opts.postOnly) { printer.enabled = true; printer.everEnabled = true } }
  }
}

const pane = (page: Page) => page.getByTestId('settings-pane')

async function openDeveloperMode (page: Page, open: (path: string) => Promise<unknown>) {
  await open('/settings#developer')
  await expect(page.getByTestId('page-title')).toHaveText('Developer mode')
  await expect(pane(page).getByTestId('developer-mode-card')).toBeVisible()
}

test('the owner sees the state, what it is, the warranty line, and how to turn it off', async ({ page, open }) => {
  await printerSays(page, { enabled: true, everEnabled: true })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
  await expect(p.getByTestId('developer-mode-what')).toContainText('running your copy of its configuration')
  await expect(p.getByTestId('developer-mode-warranty')).toContainText('warranty ended')
  await expect(p.getByTestId('developer-mode-off-how')).toContainText('Turn it off with the switch')
  await expect(p.getByTestId('developer-mode-switch')).toBeVisible()
  await expect(p.getByTestId('developer-mode-unlocks')).toHaveCount(0)
  await expect(p.getByTestId('developer-backup')).toBeEnabled()
  await expect(p.getByTestId('developer-reset')).toBeEnabled()
})

test("turning it on the first time shows the terms, then waits for the printer's screen", async ({ page, open }) => {
  const fake = await printerSays(page, { enabled: false })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
  await expect(p.getByTestId('developer-mode-warranty')).toContainText('the warranty ends')
  // Back up and Start again are there only while it is on.
  await expect(p.getByTestId('developer-backup')).toHaveCount(0)
  await expect(p.getByTestId('developer-reset')).toHaveCount(0)
  await p.getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-enable-dialog')
  await expect(dialog.getByTestId('developer-terms')).toContainText("The printer's own waiver terms.")
  // Nothing is asked of the printer until the terms are accepted.
  await expect(dialog.getByTestId('developer-confirm')).toBeDisabled()
  expect(fake.posts).toEqual([])
  await dialog.getByTestId('developer-accept').check()
  await dialog.getByTestId('developer-confirm').click()
  await expect(dialog.getByTestId('developer-press-knob')).toContainText("Sign the warranty release on the printer's screen to turn on developer mode for the first time.")
  expect(fake.posts.map(x => JSON.parse(x))).toEqual([{ enabled: true }])
  // It waits: nothing is completed, and it is still off, until the knob is pressed.
  await page.waitForTimeout(2500)
  expect(fake.posts).toHaveLength(1)
  expect(fake.printer.enabled).toBe(false)
  fake.confirm()
  await expect(dialog).toBeHidden()
  expect(fake.posts.map(x => JSON.parse(x))).toEqual([
    { enabled: true },
    { enabled: true, challenge_id: CHALLENGE, waiver_acknowledged: true, waiver_version: 'w-1' }
  ])
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
  await expect(p.getByTestId('developer-backup')).toBeEnabled()
})

test('after it was accepted before, a turn-on goes straight through with no wait', async ({ page, open }) => {
  const fake = await printerSays(page, { enabled: false, everEnabled: true })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await p.getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-enable-dialog')
  // No terms again, no knob press.
  await expect(dialog.getByTestId('developer-terms')).toHaveCount(0)
  await dialog.getByTestId('developer-confirm').click()
  await expect(dialog).toBeHidden()
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
  expect(fake.posts.map(x => JSON.parse(x))).toEqual([{ enabled: true }])
  expect(fake.polls()).toBe(0)
  // And off again without waiting either.
  await p.getByTestId('developer-mode-switch').click()
  await page.getByTestId('developer-disable-dialog').getByTestId('developer-confirm').click()
  await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
  expect(fake.posts.map(x => JSON.parse(x))).toEqual([{ enabled: true }, { enabled: false }])
  expect(fake.polls()).toBe(0)
})

test('someone who is not the owner sees it read-only, with the reason', async ({ page, open }) => {
  await printerSays(page, { enabled: true, mayAsk: false })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
  await expect(p.getByTestId('developer-mode-switch')).toHaveCount(0)
  await expect(p.getByTestId('developer-mode-who')).toContainText(`Only ${OWNER} can change developer mode on this printer`)
})

test('an older printer that only takes the change at its own screen says so, and nothing waits', async ({ page, open }) => {
  const { posts } = await printerSays(page, { enabled: true, refuse: "dev-mode:panel_only: This change is only taken on the printer's own screen." })
  await openDeveloperMode(page, open)
  await pane(page).getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-disable-dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByTestId('developer-confirm').click()
  await expect(dialog).toContainText('only takes this at its own screen')
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
  await dialog.getByTestId('developer-confirm').click()
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

/** Words a person can read on the card: no SSH address (a value, not copy). */
async function visibleWords (page: Page) {
  const card = page.getByTestId('developer-mode-card')
  let text = await card.innerText()
  const address = page.getByTestId('developer-mode-ssh-address')
  if (await address.count()) text = text.replace(await address.innerText(), '')
  return text.split(/\s+/).filter(Boolean).length
}

async function withHostname (page: Page, hostname: string) {
  const printer = await usePrinter(page, {})
  printer.state.answers['printer.info'] = { state: 'ready', state_message: 'Printer is ready', hostname }
}

for (const build of [{ name: 'release', guardArmed: true }, { name: 'admin', guardArmed: false }]) {
  for (const enabled of [false, true]) {
    test(`${build.name} build, developer mode ${enabled ? 'on' : 'off'}: 50 to 90 words`, async ({ page, open }) => {
      await printerSays(page, { enabled, everEnabled: true, guardArmed: build.guardArmed })
      await withHostname(page, 'm1-4f2a')
      await openDeveloperMode(page, open)
      await expect(pane(page).getByTestId('developer-mode-state')).toHaveText(enabled ? 'On' : 'Off')
      const words = await visibleWords(page)
      expect(words).toBeGreaterThanOrEqual(50)
      expect(words).toBeLessThanOrEqual(90)
    })
  }
}

test('a release build never shows SSH, off or on', async ({ page, open }) => {
  await printerSays(page, { enabled: true, everEnabled: true, guardArmed: true })
  await withHostname(page, 'm1-4f2a')
  await openDeveloperMode(page, open)
  await expect(pane(page).getByTestId('developer-mode-ssh')).toHaveCount(0)
  await expect(pane(page).getByText(/ssh/i)).toHaveCount(0)
  await expect(pane(page).getByTestId('developer-mode-warranty')).toBeVisible()
})

test('an admin build with it on shows the SSH address with Copy, and no warranty line', async ({ page, open }) => {
  await printerSays(page, { enabled: true, everEnabled: true, guardArmed: false })
  await withHostname(page, 'm1-4f2a')
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-ssh-address')).toHaveText('ssh root@m1-4f2a.local')
  await expect(p.getByTestId('developer-mode-ssh-copy')).toBeVisible()
  await expect(p.getByTestId('developer-mode-warranty')).toHaveCount(0)
})

test('an admin build with it off shows no SSH yet', async ({ page, open }) => {
  await printerSays(page, { enabled: false, everEnabled: true, guardArmed: false })
  await withHostname(page, 'm1-4f2a')
  await openDeveloperMode(page, open)
  await expect(pane(page).getByTestId('developer-mode-ssh')).toHaveCount(0)
})

// KAN-4351: train 17's route takes POST only. Jack saw "Method Not Allowed" on the printer's own page and
// 403 over Bluetooth, and no way to turn developer mode on: Control asked with a GET first.
for (const [status, route] of [[405, "the printer's own page"], [403, 'Bluetooth']] as const) {
  test(`${route}: a POST-only printer still gets developer mode turned on and off`, async ({ page, open }) => {
    const fake = await printerSays(page, { enabled: false, everEnabled: true, postOnly: status })
    await openDeveloperMode(page, open)
    const p = pane(page)
    // No error text from the GET, and the switch is there: the printer decides when it is asked.
    await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
    await expect(p.getByTestId('developer-mode-who')).toHaveCount(0)
    await expect(p.getByText('Method Not Allowed')).toHaveCount(0)
    await expect(p.getByTestId('developer-mode-switch')).toBeVisible()
    await p.getByTestId('developer-mode-switch').click()
    const enable = page.getByTestId('developer-enable-dialog')
    // Over Bluetooth /server/aux/ is closed, so Control can't read that it was released before and shows the terms;
    // the printer still takes the change with no challenge.
    if (status === 403) await enable.getByTestId('developer-accept').check()
    await enable.getByTestId('developer-confirm').click()
    await expect(enable).toBeHidden()
    await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
    await p.getByTestId('developer-mode-switch').click()
    await page.getByTestId('developer-disable-dialog').getByTestId('developer-confirm').click()
    await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
    expect(fake.posts.map(x => JSON.parse(x))).toEqual([{ enabled: true }, { enabled: false }])
  })
}

test('a POST-only printer: the first release waits for the screen by watching the state, and asks once', async ({ page, open }) => {
  const fake = await printerSays(page, { enabled: false, postOnly: 405 })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await p.getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-enable-dialog')
  await dialog.getByTestId('developer-accept').check()
  await dialog.getByTestId('developer-confirm').click()
  // The id came with no wait time or words: Control says what to do and does not give up at once.
  await expect(dialog.getByTestId('developer-press-knob')).toContainText('Confirm')
  await page.waitForTimeout(2500)
  await expect(dialog.getByTestId('developer-press-knob')).toBeVisible()
  fake.confirm()
  await expect(dialog).toBeHidden()
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
  // One request only: a second POST would open a second challenge on the printer.
  expect(fake.posts.map(x => JSON.parse(x))).toEqual([{ enabled: true }])
})

// KAN-4772 (Jack, 19 Nov): anyone may switch developer mode on an Open printer; only the first release of the
// warranty is signed on the printer's screen, and nothing shows as changed until the printer says so.
async function firstEnable (page: Page, p: ReturnType<typeof pane>) {
  await p.getByTestId('developer-mode-switch').click()
  const dialog = page.getByTestId('developer-enable-dialog')
  await dialog.getByTestId('developer-accept').check()
  await dialog.getByTestId('developer-confirm').click()
  return dialog
}

test('an Open printer shows the switch to a non-owner; the first turn-on waits for the screen, then shows ON', async ({ page, open }) => {
  // as_owner false, may_ask true: someone who is not the owner on an Open printer.
  const fake = await printerSays(page, { enabled: false, linked: false })
  await page.route(REQUEST, async route => {
    if (route.request().method() === 'GET' && !route.request().url().includes('challenge_id=')) {
      return route.fulfill({ json: { result: { as_owner: false, owner: { linked: false, account: null }, may_ask: true, waiver: WAIVER } } })
    }
    return route.fallback()
  })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await expect(p.getByTestId('developer-mode-switch')).toBeVisible()
  await expect(p.getByTestId('developer-mode-who')).toHaveCount(0)
  const dialog = await firstEnable(page, p)
  await expect(dialog.getByTestId('developer-press-knob')).toContainText("Sign the warranty release on the printer's screen")
  await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
  fake.confirm()
  await expect(dialog).toBeHidden()
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
})

test('declined on the printer: nothing changed, in plain words, and it stays Off', async ({ page, open }) => {
  await printerSays(page, { enabled: false, declined: true })
  await openDeveloperMode(page, open)
  const p = pane(page)
  const dialog = await firstEnable(page, p)
  await expect(dialog.getByTestId('developer-error')).toHaveText("It was declined on the printer's screen. Nothing changed.")
  await expect(dialog.getByTestId('developer-press-knob')).toHaveCount(0)
  await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
})

test('a 428 on the first turn-on starts the signing wait instead of an error', async ({ page, open }) => {
  const fake = await printerSays(page, { enabled: false, precondition: true })
  await openDeveloperMode(page, open)
  const p = pane(page)
  const dialog = await firstEnable(page, p)
  await expect(dialog.getByTestId('developer-press-knob')).toContainText("Sign the warranty release on the printer's screen")
  await expect(dialog.getByTestId('developer-error')).toHaveCount(0)
  await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
  // The person signs at the printer: its state now reads On, and Control follows it.
  fake.printer.enabled = true
  fake.printer.everEnabled = true
  await expect(dialog).toBeHidden()
  await expect(p.getByTestId('developer-mode-state')).toHaveText('On')
})

test('a Protected printer shows a non-owner no switch, and says why', async ({ page, open }) => {
  await printerSays(page, { enabled: false, everEnabled: true, mayAsk: false })
  await openDeveloperMode(page, open)
  await expect(pane(page).getByTestId('developer-mode-switch')).toHaveCount(0)
  await expect(pane(page).getByTestId('developer-mode-who')).toContainText('Only')
})

// Negative control: the switch is bound to the printer's state, not to the click, so with a printer that never
// confirms the state must stay Off. Reverting to an optimistic flip makes this fail on the final assertion.
test('negative control: with nobody at the printer the switch never reads On', async ({ page, open }) => {
  await printerSays(page, { enabled: false })
  await openDeveloperMode(page, open)
  const p = pane(page)
  await firstEnable(page, p)
  await page.waitForTimeout(3500)
  await expect(p.getByTestId('developer-mode-state')).toHaveText('Off')
})
