/**
 * Fluidd systems our UI replaced are gone, not hidden (brief 9 Nov 2026, §3):
 * the unrouted Fluidd dashboard, its cards and its layout-edit bar. No page
 * reaches any of them. (The old bell and the "Set the filament" dialog have
 * their own checks in notifications-one-bell and filament-one-panel.)
 */
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

for (const path of ['/', '/control', '/jobs', '/maintenance', '/settings', '/console']) {
  test(`${path}: no Fluidd layout-edit bar`, async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open(`${PRINTER}${path === '/' ? '' : path}`)
    await expect(page.locator('.v-app-bar')).toBeVisible()
    await expect(page.locator('.layout-action')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /exit layout|reset layout|default layout/i })).toHaveCount(0)
  })
}

test('the Overview route is ours: no Fluidd dashboard behind it', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open(PRINTER)
  await expect(page.getByTestId('filament-row').or(page.getByTestId('tile-filament')).first()).toBeVisible()
  await expect(page.locator('#dashboard, .dashboard-container')).toHaveCount(0)
})
