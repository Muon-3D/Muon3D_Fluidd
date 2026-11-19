/**
 * Hotfix, 19 Nov 2026 (Jack at the printer): a signed-in person who is NOT the owner opens an Open printer over
 * Bluetooth. muon-link admits him as an OpenGuest (Operator), then refuses what is Owner-only by policy
 * ("not on the remote allowlist; unlisted endpoints are Owner-only by default"): GET /muon-link/pairing,
 * /server/muon/identity, /server/muon/access, and the JSON-RPC server.config, server.muon.get_protection and
 * machine.update.status. Control read the refused pairing read as "no grant" and gave up (50 s, then a timeout).
 *
 * Expected: the person lands on a working printer page, as an Operator, with Jobs, Upload and Print enabled, and
 * nothing granted that the printer did not give. The radio and wasm client are faked (e2e/fakes/blePair.ts); no
 * printer is touched. Desktop and phone.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { OPEN_PRINTER, ownerOnlyRefusals, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

test.use({ signedIn: true, serviceWorkers: 'block' })

async function openAsNonOwner (page: Page, ownerOnly: boolean | 'after-160') {
  await useNearbyPrinters(page, OPEN_PRINTER, { advertise: true, ownerOnly })
  // Signed in (the fixture's account), and Alder is not among its printers.
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${OPEN_PRINTER.advertised}`)
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
  await page.evaluate(async () => {
    const { default: router } = await import(/* @vite-ignore */ /* eslint-disable-line import/no-absolute-path */ '/src/router/index.ts')
    await router.push('/alder-6601/jobs')
  })
}

test('a signed-in non-owner on an Open printer, refused every Owner-only read, still gets a working Jobs page', async ({ page }) => {
  await openAsNonOwner(page, true)
  await expect(page.getByTestId('pair-code-step')).toHaveCount(0)
  await expect(page.getByTestId('jobs-readonly')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByTestId('jobs-upload')).toBeEnabled({ timeout: 30_000 })
  await expect(page.locator('body')).not.toContainText("isn't taking commands")
  // The refusals really happened, so this is not a printer that answered everything.
  const refused = await ownerOnlyRefusals(page)
  expect(refused.paths.some(p => p.startsWith('/muon-link/pairing'))).toBe(true)
  expect(refused.methods).toEqual(expect.arrayContaining(['server.config', 'machine.update.status']))
  // No error toast for what is simply not this person's to read.
  await expect(page.locator('body')).not.toContainText('Owner-only')

  const upload = page.waitForRequest(r => r.method() === 'POST' && r.url().includes('/server/files/upload'), { timeout: 30_000 })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'guest.gcode', mimeType: 'text/x-gcode', buffer: Buffer.from('G28\nG1 X10\n') })
  await upload
})

test('after muon-link #160 (identity, protection, capabilities, update status allowed; server.config, access/get, pairing, permissions still refused) the page works too', async ({ page }) => {
  await openAsNonOwner(page, 'after-160')
  await expect(page.getByTestId('jobs-readonly')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByTestId('jobs-upload')).toBeEnabled({ timeout: 30_000 })
  const refused = await ownerOnlyRefusals(page)
  expect(refused.paths.some(p => p.startsWith('/muon-link/pairing'))).toBe(true)
  expect(refused.methods).toContain('server.config')
  expect(refused.methods).not.toContain('machine.update.status')
  expect(refused.paths.some(p => p.startsWith('/server/muon/identity'))).toBe(false)
})

test('control: with no refusals the same person gets the same page (the fake itself is not the cause)', async ({ page }) => {
  await openAsNonOwner(page, false)
  await expect(page.getByTestId('jobs-upload')).toBeEnabled({ timeout: 30_000 })
  const refused = await ownerOnlyRefusals(page)
  expect(refused.paths).toEqual([])
})
