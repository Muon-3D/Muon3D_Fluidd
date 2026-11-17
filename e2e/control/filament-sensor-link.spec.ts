import { test, expect, PRINTER } from '../fixtures'
import { overlay, PRESETS, usePrinter } from './printer'

const SENSOR = 'filament_switch_sensor runout'
for (const path of ['/control', PRINTER]) {
  test(`${path}: filament sensor link opens the actual Health fold without sending printer commands`, async ({ page, open }, testInfo) => {
    const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), {
      [SENSOR]: { enabled: true, filament_detected: true },
      configfile: { settings: { [SENSOR]: { pause_on_runout: true } } }
    }), { ticks: false })
    await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
    await open('/maintenance')
    await expect(page.getByRole('button', { name: /^Switches and sensors/ })).toHaveAttribute('aria-expanded', 'false')
    await open(path)
    if (path === '/control') await page.getByTestId('filament-sensors-link').click()
    else {
      await page.getByRole('button', { name: 'More for Filament' }).click()
      await page.getByRole('menuitem', { name: /Filament sensors/ }).click()
    }
    await expect(page).toHaveURL(/\/boxwood-367a\/maintenance\?sensors=open$/)
    const fold = page.getByTestId('maintenance-sensors')
    const button = fold.getByRole('button', { name: /^Switches and sensors/ })
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(fold.locator('.task-fold__panel')).toBeVisible()
    if (path === '/control' && process.env.E2E_SCREENSHOT_DIR) await fold.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/1697-health-${testInfo.project.name}.png` })
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(printer.calls.filter(c => /^printer\.(gcode\.script|emergency_stop|restart|firmware_restart|print\.)|^machine\.(reboot|services)/.test(c.method))).toEqual([])
  })
}

test('without sensors there is no filament sensor link and an unrelated query does not expand Health', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await open('/control')
  await expect(page.getByTestId('filament-sensors-link')).toHaveCount(0)
  await open('/maintenance?filament=open')
  await expect(page.getByRole('button', { name: /^Switches and sensors/ })).toHaveAttribute('aria-expanded', 'false')
  expect(printer.gcode).toEqual([])
})
