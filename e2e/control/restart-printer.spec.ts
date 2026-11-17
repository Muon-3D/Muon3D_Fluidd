import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test('Control has one friendly restart, asks before sending, and keeps technical restarts out of Quick commands', async ({ page, open }, testInfo) => {
  const status = PRESETS.idleHomed()
  status.configfile.save_config_pending = true
  for (const name of ['RESTART', 'FIRMWARE_RESTART', 'SAVE_CONFIG']) {
    status.configfile.settings[`gcode_macro ${name}`] = { gcode: 'M118 hi' }
  }
  const printer = await usePrinter(page, status, { ticks: false })
  await open('/control')
  const actions = page.getByTestId('control-actions')
  if (testInfo.project.name === 'phone') await actions.locator('summary').click()
  const restart = actions.getByRole('button', { name: 'Restart printer', exact: true })
  await expect(restart).toHaveCount(1)
  await expect(restart).toBeEnabled()
  await expect(page.getByRole('button', { name: /Save config.*restart/i })).toHaveCount(0)
  if (testInfo.project.name === 'phone') {
    const menu = await actions.locator('.control-actions__menu').boundingBox()
    if (!menu) throw new Error('The restart menu is not visible')
    expect(menu.x).toBeGreaterThanOrEqual(0)
    expect(menu.x + menu.width).toBeLessThanOrEqual(390)
  }
  for (const id of ['restart-klipper', 'restart-firmware', 'save-config', 'qc-RESTART', 'qc-FIRMWARE_RESTART', 'qc-SAVE_CONFIG']) {
    await expect(page.getByTestId(id)).toHaveCount(0)
  }
  if (process.env.E2E_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2086-${testInfo.project.name}.png` })
  }
  expect(printer.gcode).toEqual([])
  await restart.click()
  await expect(page.getByText('Restart printer?', { exact: true })).toBeVisible()
  await expect(page.getByTestId('confirm')).toContainText("restarts the printer's firmware")
  expect(printer.gcode).toEqual([])
  if (process.env.E2E_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2086-${testInfo.project.name}-confirm.png` })
  }
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toBeHidden()
  expect(printer.gcode).toEqual([])
  await restart.click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.gcode).toEqual(['FIRMWARE_RESTART'])
  expect(printer.moves()).toEqual([])
})

for (const state of ['printing', 'paused']) {
  test(`Restart printer is unavailable while ${state}`, async ({ page, open }, testInfo) => {
    const printer = await usePrinter(page, {
      ...PRESETS.idleHomed(),
      print_stats: { state, filename: 'cube.gcode' },
      pause_resume: { is_paused: state === 'paused' },
      idle_timeout: { state: state === 'printing' ? 'Printing' : 'Ready' },
      virtual_sdcard: { is_active: state === 'printing' }
    }, { ticks: false })
    await open('/control')
    const actions = page.getByTestId('control-actions')
    if (testInfo.project.name === 'phone') await actions.locator('summary').click()
    const restart = actions.getByRole('button', { name: 'Restart printer', exact: true })
    await expect(restart).toBeDisabled()
    await expect(restart).toHaveAttribute('title', /Wait until the printer has finished/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(printer.gcode).toEqual([])
  })
}

test('losing the connection disables Restart printer rather than offering an unconfirmed recovery', async ({ page, open }, testInfo) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await open('/control')
  const actions = page.getByTestId('control-actions')
  if (testInfo.project.name === 'phone') await actions.locator('summary').click()
  const restart = actions.getByRole('button', { name: 'Restart printer', exact: true })
  await expect(restart).toBeEnabled()
  await printer.offline()
  await expect(restart).toBeDisabled()
  await expect(restart).toHaveAttribute('title', /Connect to a printer you can control/)
  expect(printer.gcode).toEqual([])
})
