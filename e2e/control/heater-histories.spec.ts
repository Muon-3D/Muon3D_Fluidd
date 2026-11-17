import type { Locator } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { overlay, PRESETS, usePrinter } from './printer'

const status = () => overlay(PRESETS.idleHomed(), {
  extruder: { temperature: 198.4, target: 220 },
  heater_bed: { temperature: 54.2, target: 60 }
})

async function pronounced (reading: Locator, minimumSize: number) {
  const style = await reading.evaluate(el => {
    const s = getComputedStyle(el)
    const reference = document.createElement('span')
    reference.style.color = 'var(--m3d-text)'
    el.appendChild(reference)
    const neutral = getComputedStyle(reference).color
    reference.remove()
    return { color: s.color, neutral, weight: Number(s.fontWeight), size: parseFloat(s.fontSize) }
  })
  expect(style.color).toBe(style.neutral)
  expect(style.weight).toBeGreaterThanOrEqual(700)
  expect(style.size).toBeGreaterThanOrEqual(minimumSize)
}

test('Control names each heater history next to bold neutral current temperatures without sending', async ({ page, open }, testInfo) => {
  const printer = await usePrinter(page, status(), { ticks: false })
  await open('/control')
  const heat = page.getByTestId('control-heat')
  for (const name of ['Nozzle', 'Bed']) {
    const spark = heat.getByRole('img', { name: `${name} temperature history`, exact: true })
    await expect(spark).toHaveAttribute('data-state', 'line')
    await expect(spark.locator('path')).toHaveAttribute('d', /^M.* L/)
  }
  await expect(heat.getByTestId('heat-now').first()).toHaveText('198.4°')
  for (const reading of await heat.getByTestId('heat-now').all()) await pronounced(reading, 18)
  await heat.getByRole('button', { name: /^Other temperatures/ }).click()
  for (const reading of await heat.locator('.heat__other-now').all()) await pronounced(reading, 15)
  expect(await heat.getByRole('img').count()).toBeGreaterThan(2)
  expect(printer.gcode).toEqual([])
  if (process.env.E2E_SCREENSHOT_DIR) await heat.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/1698-control-${testInfo.project.name}.png` })
})

for (const failure of [false, true]) {
  test(`Control keeps current temperatures and honest empty histories when history is ${failure ? 'unavailable' : 'empty'}`, async ({ page, open }) => {
    const printer = await usePrinter(page, status(), { ticks: false })
    if (failure) printer.state.failOn['server.temperature_store'] = 'History unavailable'
    else printer.state.answers['server.temperature_store'] = {}
    await open('/control')
    const heat = page.getByTestId('control-heat')
    for (const name of ['Nozzle', 'Bed']) {
      const spark = heat.getByRole('img', { name: `${name} temperature history, no history yet`, exact: true })
      await expect(spark).toHaveAttribute('data-state', 'empty')
      await expect(spark.locator('path')).toHaveCount(0)
    }
    await expect(heat.getByTestId('heat-now').first()).toHaveText('198.4°')
    await pronounced(heat.getByTestId('heat-now').first(), 18)
    expect(printer.gcode).toEqual([])
  })
}

test('Overview keeps small tiles compact and gives roomier heaters their named history', async ({ page, open, isMobile }, testInfo) => {
  const printer = await usePrinter(page, status(), { ticks: false, database: true })
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  await open(PRINTER)
  await page.getByTestId('edit-open').click()
  await page.getByTestId('widget-sheet-open').click()
  await page.getByTestId('widget-add-hotend').click()
  await page.getByTestId('widget-sheet-close').click()
  await page.getByTestId('edit-done').click()
  const tile = page.locator('[data-cell="hotend"]')
  await expect(tile).toHaveAttribute('data-size', 'S')
  await expect(tile.getByRole('img')).toHaveCount(0)
  await expect(tile.getByTestId('heater-value')).toContainText('198.4°')
  await pronounced(tile.getByTestId('heater-value'), 18)
  if (!isMobile) {
    await page.getByTestId('edit-open').click()
    await tile.getByTestId('tile-grip').press('Shift+ArrowRight')
    await expect(tile).toHaveAttribute('data-size', 'M')
    await page.getByTestId('edit-done').click()
    await expect(tile.getByRole('img', { name: 'Hotend temperature history', exact: true })).toHaveAttribute('data-state', 'line')
    await pronounced(tile.getByTestId('heater-value'), 18)
  }
  expect(printer.gcode).toEqual([])
  if (process.env.E2E_SCREENSHOT_DIR) await tile.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/1698-overview-${testInfo.project.name}.png` })
})
