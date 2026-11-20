/**
 * KAN-4309, Jack's ruling D-166: an open printer means everything is doable
 * from Control over any route. muon-link admits a Bluetooth stranger on an
 * Open printer as an OpenGuest with the Operator role, so a signed-out
 * browser that connected over Bluetooth with no code must be able to Print,
 * Upload, Rename and Delete, not read the Jobs page as "isn't taking commands".
 *
 * Nobody is signed in. The radio and the wasm client are faked at their edges
 * (e2e/fakes/blePair.ts); Control's own code does the rest. Desktop and phone.
 *
 * - Open printer over Bluetooth: Jobs Upload is on, and a small file's upload starts.
 * - A protected printer this browser was paired with (the printer says nothing
 *   of Open): still no commands, as before.
 * - A protected printer that refuses the stranger never opens at all.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { OPEN_PRINTER, PAIRED_BEFORE, PROTECTED_PRINTER, pairEvents, setPairingGate, useNearbyPrinters, type NearbyFake } from '../fakes/blePair'

test.use({ signedIn: false, serviceWorkers: 'block' })

async function openOverBluetooth (page: Page, printer: NearbyFake, slug: string) {
  const heardAdvertising = printer.kind !== 'paired'
  await useNearbyPrinters(page, printer, { advertise: heardAdvertising })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await setPairingGate(page, true)
  if (heardAdvertising) {
    await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
    await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  } else {
    // One this browser was paired with before: chosen in Chrome's chooser, then Pair over Bluetooth opens it with no code.
    await page.getByTestId('found-set-up').click()
  }
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${printer.advertised}`)
  await expect(page).toHaveURL(new RegExp(`/${slug}(/|$)`))
  // Moved by the page's own router, so the Bluetooth session stays (a reload would drop it).
  await page.evaluate(async slug => {
    const { default: router } = await import(/* @vite-ignore */ /* eslint-disable-line import/no-absolute-path */ '/src/router/index.ts')
    await router.push(`/${slug}/jobs`)
  }, slug)
}

test('an Open printer opened over Bluetooth, signed out, takes Upload and Print: the person is an Operator', async ({ page }) => {
  await openOverBluetooth(page, OPEN_PRINTER, 'alder-6601')
  await expect.poll(() => page.evaluate(async id => {
    const { remoteRouteLabel } = await import(/* @vite-ignore */ /* eslint-disable-line import/no-absolute-path */ '/src/services/muon-ble/link.ts')
    return remoteRouteLabel(id)
  }, OPEN_PRINTER.id), { timeout: 30_000 }).toBe('Via Bluetooth')
  await expect(page.getByTestId('jobs-readonly')).toHaveCount(0)
  await expect(page.getByTestId('jobs-upload')).toBeEnabled()
  await expect(page.locator('body')).not.toContainText("isn't taking commands")

  const upload = page.waitForRequest(r => r.method() === 'POST' && r.url().includes('/server/files/upload'), { timeout: 30_000 })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'open-bluetooth.gcode', mimeType: 'text/x-gcode', buffer: Buffer.from('G28\nG1 X10\n') })
  await upload
})

test('a protected printer this browser was paired with still takes no commands', async ({ page }) => {
  await openOverBluetooth(page, PAIRED_BEFORE, 'boxwood-367a')
  await expect(page.getByTestId('jobs-readonly')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('jobs-readonly')).toContainText("isn't taking commands")
  await expect(page.getByTestId('jobs-upload')).toBeDisabled()
})

test('a protected printer that refuses the stranger is not opened, so nothing can be sent to it', async ({ page }) => {
  await useNearbyPrinters(page, PROTECTED_PRINTER, { advertise: true })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await setPairingGate(page, true)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect(page.getByTestId('pair-code-step')).toBeVisible()
  const events = await pairEvents(page)
  expect(events).toContain(`refused ${PROTECTED_PRINTER.advertised}`)
  expect(events).not.toContain(`connect ${PROTECTED_PRINTER.advertised}`)
  await expect(page.getByTestId('jobs-upload')).toHaveCount(0)
})
