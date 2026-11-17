/**
 * Overview: the page is usable before the live M1 (KAN-2013). The stage
 * first shows its picture at the same size; the live M1, its own chunk,
 * mounts in its place later, with no layout jump.
 *
 * The live M1's chunk is held back here until the Overview has taken a click.
 */
import type { Route } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const GPU = process.platform === 'win32'
// A service worker would answer the chunk without the route seeing it.
test.use({ serviceWorkers: 'block', launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  await usePrinter(page, PRESETS.idleHomed())
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

test('the Overview takes clicks with the stage\'s picture up, then the live M1 takes its place', async ({ page, open }) => {
  const held: Route[] = []
  let release = false
  // The dev server's M1Live.vue and the production build's M1Live-<hash>.js.
  await page.context().route(/\/M1Live[.-][^/]*$/, route => (release ? route.continue() : held.push(route)))

  await open('/')
  const stage = page.locator('[data-cell="stage"]')
  const picture = page.getByTestId('m1-placeholder')
  await expect(picture).toBeVisible()
  await expect(picture.locator('img')).toHaveJSProperty('complete', true)
  await expect(page.getByTestId('m1-live')).toHaveCount(0)

  // Interactive while the live M1 has not loaded: Edit mode opens and closes.
  await page.getByTestId('edit-open').click()
  await expect(page.getByTestId('edit-done')).toBeVisible()
  await page.getByTestId('edit-done').click()
  await expect(page.getByTestId('edit-open')).toBeVisible()
  await expect(page.getByTestId('m1-live')).toHaveCount(0)
  await expect(picture).toBeVisible()

  const before = await stage.boundingBox()
  await expect.poll(() => held.length, { timeout: 30_000 }).toBeGreaterThan(0)
  release = true
  for (const route of held.splice(0)) await route.continue()

  await expect(page.getByTestId('m1-live')).toBeVisible({ timeout: 60_000 })
  await expect(picture).toHaveCount(0)
  expect(await stage.boundingBox()).toEqual(before)
})
