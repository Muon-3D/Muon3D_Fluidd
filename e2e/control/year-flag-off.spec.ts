/**
 * The year grid and spool ring are behind VITE_CONTROL_YEAR_SPOOL, off by
 * default: with it off, History is as it was, and Control asks the printer for
 * no extra history. (The flag-on specs are e2e/year, run by playwright.year.config.ts.)
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const DAY = 86400

test('with the flag off, History draws no year grid or ring and asks for no year', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const asked: Array<Record<string, unknown>> = []
  const start = Math.floor(Date.now() / 1000) - DAY
  printer.state.answer['server.history.list'] = (params: Record<string, unknown>) => {
    asked.push(params)
    return {
      count: 1,
      jobs: [{ job_id: 'a1', filename: 'cable_clip_x6_PLA_0.2mm.gcode', status: 'completed', start_time: start, end_time: start + 2400, print_duration: 2280, total_duration: 2400, filament_used: 3800, exists: true, metadata: { size: 2_000_000, filament_type: 'PLA' } }]
    }
  }
  await open('/history')
  await expect(page.getByTestId('history-page')).toBeVisible()
  await expect(page.getByTestId('history-totals')).toBeVisible()

  await expect(page.getByTestId('year-glance')).toHaveCount(0)
  await expect(page.getByTestId('year-grid')).toHaveCount(0)
  await expect(page.getByTestId('year-ring')).toHaveCount(0)
  expect(asked.length).toBeGreaterThan(0)
  expect(asked.some(p => 'since' in p)).toBe(false)
})
