import { test, expect } from '../fixtures'
import { PRESETS, usePrinter } from './printer'

const cell = (page: import('@playwright/test').Page, id: string) => page.locator(`[data-cell="${id}"]`)
async function seed (page: import('@playwright/test').Page, mode: 'normal' | 'empty' | 'invalid' = 'normal') {
  await page.evaluate(async mode => {
    const { seedHeat } = await import('/e2e/fakes/overviewHeat.ts')
    await seedHeat(mode)
  }, mode)
}

test('twin and heaters stay left, job, speed and position stay right, with a smooth finish dial', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, { extruder: { temperature: 220, target: 200 }, heater_bed: { temperature: 70, target: 60 } }, { ticks: false, database: true })
  await open('/')
  await seed(page)
  await expect(cell(page, 'hotend').locator('.ot__title')).toContainText('Nozzle')
  await expect(cell(page, 'bed').locator('.ot__title')).toContainText('Plate')
  await expect(page.getByTestId('finish-clock')).toBeVisible()
  await expect(page.getByTestId('finish-clock')).toHaveAttribute('aria-label', /Estimated finish.+24-hour clock/)
  for (const id of ['job-name', 'job-percent', 'job-elapsed', 'job-remaining', 'job-done', 'job-pause', 'job-stop']) await expect(page.getByTestId(id)).toBeVisible()
  for (const id of ['hotend', 'bed']) {
    const stripe = cell(page, id).getByTestId('heat-stripe')
    await expect(stripe.locator('[data-state]')).toHaveCount(4)
    expect(await stripe.locator('[data-state]').evaluateAll(els => els.map(e => e.getAttribute('data-state')))).toEqual(['cold', 'heating', 'ready', 'over'])
    expect(await stripe.locator('[data-state]').evaluateAll(els => els.map(e => Number(e.getAttribute('x'))))).toEqual([0, 150, 300, 450])
  }
  const box = async (id: string) => (await cell(page, id).boundingBox())!
  const stage = await box('stage')
  const nozzle = await box('hotend')
  const plate = await box('bed')
  expect(nozzle.y).toBeGreaterThanOrEqual(stage.y + stage.height - 1)
  expect(plate.y).toBeGreaterThanOrEqual(stage.y + stage.height - 1)
  if (!isMobile) {
    expect(Math.abs(nozzle.y - plate.y)).toBeLessThan(2)
    for (const id of ['job', 'rates', 'position']) expect((await box(id)).x).toBeGreaterThan(stage.x + stage.width - 1)
    expect(Math.abs((await box('position')).y - nozzle.y)).toBeLessThan(2)
  } else {
    expect(nozzle.x).toBeGreaterThanOrEqual(0)
    expect(nozzle.x + nozzle.width).toBeLessThanOrEqual(390)
  }
  await page.getByTestId('toast-close').click({ timeout: 500 }).catch(() => {})
  if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2234-overview-${isMobile ? 'phone' : 'desktop'}.png`, fullPage: true })
  expect(printer.gcode).toEqual([])
})

test('both themes use the written heat colours and keep measurements neutral', async ({ page, open, isMobile }) => {
  await usePrinter(page, {}, { ticks: false, database: true })
  await open('/')
  await seed(page)
  for (const light of [false, true]) {
    await page.evaluate(async light => (await import('/e2e/fakes/overviewHeat.ts')).lightTheme(light), light)
    const colours = light ? ['rgb(174, 174, 178)', 'rgb(201, 52, 0)', 'rgb(0, 137, 50)', 'rgb(215, 0, 21)'] : ['rgb(99, 99, 102)', 'rgb(255, 146, 48)', 'rgb(48, 209, 88)', 'rgb(255, 66, 69)']
    for (const id of ['hotend', 'bed']) {
      const stripe = cell(page, id).getByTestId('heat-stripe')
      await expect.poll(() => stripe.locator('[data-state]').evaluateAll(els => els.map(e => getComputedStyle(e).fill))).toEqual(colours)
      expect(await cell(page, id).getByTestId('heater-value').evaluate(e => Number(getComputedStyle(e).fontWeight))).toBeGreaterThanOrEqual(700)
    }
  }
  await cell(page, 'hotend').scrollIntoViewIfNeeded()
  await page.getByTestId('toast-close').click({ timeout: 500 }).catch(() => {})
  if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2234-heat-light-${isMobile ? 'phone' : 'desktop'}.png` })
})

test('missing or invalid history and an unknown, paused or idle ETA never manufacture heat or finish times', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, {}, { ticks: false, database: true })
  await open('/')
  for (const mode of ['empty', 'invalid'] as const) {
    await seed(page, mode)
    for (const id of ['hotend', 'bed']) {
      const stripe = cell(page, id).getByTestId('heat-stripe')
      await expect(stripe.locator('[data-state]')).toHaveCount(0)
      await expect(stripe.locator('svg')).toHaveAttribute('aria-label', /no history yet/)
    }
  }
  printer.report({ print_stats: { state: 'paused' }, pause_resume: { is_paused: true } })
  await expect(page.getByTestId('job-pause')).toHaveText(/Resume/)
  await expect(page.getByTestId('finish-clock')).toHaveCount(0)
  printer.report({ print_stats: { state: 'printing', print_duration: 0, total_duration: 0 }, pause_resume: { is_paused: false }, virtual_sdcard: { progress: 0, file_position: 0 } })
  await expect(page.getByTestId('job-pause')).toHaveText(/Pause/)
  await page.evaluate(async () => (await import('/e2e/fakes/overviewHeat.ts')).forgetFileEstimate())
  await expect(page.getByTestId('finish-clock')).toHaveCount(0)
  await expect(page.getByTestId('job-done')).toHaveText('—')
  if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2234-empty-${isMobile ? 'phone' : 'desktop'}.png`, fullPage: true })
  printer.report(PRESETS.idleHomed())
  await expect(page.getByTestId('job-pause')).toHaveCount(0)
  await expect(page.getByTestId('finish-clock')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})
