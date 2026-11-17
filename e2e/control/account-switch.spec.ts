import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { switchingAccounts } from '../fakes/accountSwitch'
import { routeCounts, useAllRoutes } from '../fakes/routes'
import { VITE_PORT } from '../ports'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block' })

const refreshPrinters = (page: Page) => page.evaluate(async () => {
  const state = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'state.ts'].join('/'))
  await state.refreshPrinters()
})

async function signOut (page: Page) {
  if (await page.getByTestId('tab-more').isVisible()) await page.getByTestId('tab-more').click()
  await page.getByRole('button', { name: 'Account', exact: true }).click()
  await page.getByRole('menuitem', { name: /^Sign out/ }).click()
  await expect(page.getByTestId('signed-out-page')).toBeVisible()
}

async function inlineSignIn (page: Page) {
  await page.getByTestId('signed-out-sign-in').click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Email', { exact: true }).fill('bob@example.test')
  await dialog.getByLabel('Password', { exact: true }).fill('a valid password')
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Bob only', { exact: true })).toBeVisible()
}

async function onlyBob (page: Page) {
  await expect(page.getByText('Bob only', { exact: true })).toBeVisible()
  await expect(page.getByText('Alice only', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Account', exact: true }).click()
  await expect(page.getByRole('menu', { name: 'Account', exact: true })).toContainText('bob@example.test')
  await expect(page.getByRole('menu', { name: 'Account', exact: true })).not.toContainText('alice@example.test')
  await page.keyboard.press('Escape')
}

for (const kind of ['refresh', 'printers'] as const) {
  test(`a late account-1 ${kind} cannot replace account 2 after same-tab sign-out and sign-in`, async ({ page }) => {
    // A remote console uses Control's existing inline sign-in, keeping the document (and the old fetch) alive.
    const console = await switchingAccounts(page)
    await usePrinter(page, PRESETS.idleHomed())
    await page.goto('/')
    await ready(page)
    await expect(page.getByText('Alice only', { exact: true })).toBeVisible()
    const local = page.locator('[data-tid^="printer-tile-"]').filter({ hasText: 'Boxwood' })
    await expect(local).toContainText('Ready')
    console.hold(kind)
    // Run the real periodic refresh now, and await its continuation after releasing the network response.
    const pending = refreshPrinters(page)
    await expect.poll(console.waiting, { timeout: 20_000 }).toBe(true)
    await signOut(page)
    await inlineSignIn(page)
    console.release()
    await pending
    await expect.poll(console.released).toBe(true)
    expect(await page.getByText('Alice only', { exact: true }).count()).toBe(0)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('muon.cloud.token'))).toBe('access-bob')
    await onlyBob(page)
    await expect(local).toContainText('Ready')
    await expect(local).not.toContainText('Offline')
    const after = console.seen.length
    await refreshPrinters(page)
    expect(console.seen.slice(after).some(call => call.path === '/v1/printers' && call.token === 'access-bob')).toBe(true)
    expect(console.seen.slice(after).some(call => call.token.includes('alice'))).toBe(false)
    await onlyBob(page)
    await local.click()
    await expect(page).toHaveURL(/\/boxwood-367a$/)
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
    await expect(page.getByText('Offline', { exact: true })).toHaveCount(0)
  })
}

test('signing out closes account 1\'s open cloud printer and account 2 never reopens its route', async ({ page }) => {
  const console = await switchingAccounts(page)
  await useAllRoutes(page, console.alice)
  console.alice.printers[0].name = 'Alice only'
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Options for Alice only', exact: true }).click()
  await page.locator('.v-list-item').getByText('Connect through Muon3D', { exact: true }).click()
  await expect.poll(async () => (await routeCounts(page)).routes.at(-1)).toBe('cloud')
  await expect(page).toHaveURL(/\/alice-only$/)
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
  const oldRoute = new URL(page.url()).pathname
  await signOut(page)
  await inlineSignIn(page)
  await onlyBob(page)
  expect(new URL(page.url()).pathname).not.toBe(oldRoute)
  const after = console.seen.length
  await refreshPrinters(page)
  expect(console.seen.slice(after).some(call => /\/printers\/.+\/access$/.test(call.path))).toBe(false)
  expect((await routeCounts(page)).routes).toEqual([])
})

test('console sign-out and sign-in as another account show its printers and nonblank Account details', async ({ page }) => {
  const console = await switchingAccounts(page, `http://localhost:${VITE_PORT}`)
  await usePrinter(page, PRESETS.idleHomed())
  await page.goto('/account/profile')
  await ready(page)
  await expect(page.getByTestId('profile-email')).toHaveText('alice@example.test')
  await expect(page.getByTestId('profile-name-value')).toHaveText('Alice')
  await signOut(page)
  await page.getByTestId('signed-out-sign-in').click()
  await expect(page.getByRole('heading', { name: 'Console sign-in' })).toBeVisible()
  await page.getByRole('link', { name: 'Sign in as Bob' }).click()
  await onlyBob(page)
  await page.getByRole('button', { name: 'Account', exact: true }).click()
  await page.getByTestId('account-open').click()
  await page.getByTestId('account-nav-profile').click()
  await expect(page.getByTestId('account-profile')).toBeVisible()
  await expect(page.getByTestId('profile-email')).toHaveText('bob@example.test')
  await expect(page.getByTestId('profile-name-value')).toHaveText('Bob')
  expect(console.seen.filter(call => call.path === '/v1/me').at(-1)?.token).toBe('access-bob')
})
