/**
 * Screenshots of the year grid and spool ring beside the design-lab sections
 * they come from, light and dark. Not a test of anything: it runs only when
 * SHOTS_DIR names where to put them (and the lab is served on :8142):
 *
 *   SHOTS_DIR=/some/dir npm run test:e2e:year -- screenshots
 */
import type { Page } from '@playwright/test'
import { test } from '../fixtures'
import { usePrinter, PRESETS } from '../control/printer'
import { NOW, ZONE } from './jobs'

const DIR = process.env.SHOTS_DIR
const LAB = process.env.LAB_URL || 'http://localhost:8142/control.html'

test.use({ timezoneId: ZONE })
test.skip(!DIR, 'set SHOTS_DIR to take the screenshots')

/** A made-up year of printing: bursts, quiet weeks, a holiday. The same on every run. */
function madeUpYear () {
  let seed = 367
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
  const jobs = []
  const now = Date.parse(NOW)
  let burst = 0
  for (let back = 366; back >= 0; back--) {
    const day = new Date(now - back * 86_400_000)
    if (rand() < 0.06) burst = 3 + Math.floor(rand() * 8)
    const holiday = back < 215 && back > 200
    const want = holiday ? 0.03 : (burst > 0 ? 0.85 : 0.3) + ([0, 6].includes(day.getUTCDay()) ? 0.2 : 0)
    burst--
    if (rand() >= want) continue
    const n = 1 + Math.floor(rand() * rand() * 5)
    for (let k = 0; k < n; k++) {
      const hours = 0.3 + rand() * rand() * 7
      const start = Math.floor(day.getTime() / 1000) - (day.getUTCHours() - 8 - k) * 3600
      jobs.push({
        job_id: `m${back}-${k}`,
        filename: ['benchy', 'cable_clip_x12', 'fan_duct_v3', 'm1_bracket', 'phone_dock', 'plant_pot'][Math.floor(rand() * 6)] + '_PLA_0.2mm.gcode',
        status: rand() < 0.9 ? 'completed' : 'cancelled',
        start_time: start,
        end_time: start + hours * 3600,
        print_duration: hours * 3600,
        total_duration: hours * 3600,
        filament_used: Math.round(hours * (9 + rand() * 9) / 3 * 1000),
        exists: true,
        metadata: { size: 1_000_000, filament_type: 'PLA', filament_total: 1000, filament_weight_total: 3 }
      })
    }
  }
  return jobs
}

async function theme (page: Page, light: boolean) {
  await page.evaluate((isLight) => {
    const app = (document.getElementById('app') as unknown as { __vue__?: { $vuetify: { theme: { dark: boolean } } } })
    if (app.__vue__) app.__vue__.$vuetify.theme.dark = !isLight
  }, light)
}

for (const light of [false, true]) {
  const scheme = light ? 'light' : 'dark'

  test(`control ${scheme}`, async ({ page, open }, info) => {
    await page.clock.setFixedTime(new Date(NOW))
    const printer = await usePrinter(page, PRESETS.idleHomed())
    const jobs = madeUpYear()
    printer.state.answer['server.history.list'] = (params: Record<string, unknown>) => ({ count: jobs.length, jobs: params.since ? jobs : jobs.slice(-50) })
    await open('/history')
    const widget = page.getByTestId('year-glance')
    await widget.waitFor()
    await theme(page, light)
    await page.waitForTimeout(1500)
    for (const metric of ['Hours', 'Prints', 'Filament']) {
      await page.getByRole('radio', { name: metric }).click()
      await page.waitForTimeout(500)
      await page.getByTestId('year-day-cell').last().focus()
      await widget.screenshot({ path: `${DIR}/control-${scheme}-${info.project.name}-${metric.toLowerCase()}.png`, animations: 'disabled' })
    }
  })

  test(`lab ${scheme}`, async ({ page }, info) => {
    await page.goto(LAB)
    await page.evaluate((isLight) => {
      document.documentElement.dataset.theme = isLight ? 'light' : 'dark'
      window.dispatchEvent(new Event('lab-theme'))
    }, light)
    await page.waitForTimeout(3000)
    await page.locator('#activity .v').nth(0).screenshot({ path: `${DIR}/lab-A-${scheme}-${info.project.name}.png`, animations: 'disabled' })
    await page.locator('#activity .r2pick').screenshot({ path: `${DIR}/lab-C-${scheme}-${info.project.name}.png`, animations: 'disabled' })
  })
}
