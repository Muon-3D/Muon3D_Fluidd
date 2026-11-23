/**
 * History's year at a glance (design-lab A) and spool ring (C), flag ON
 * (playwright.year.config.ts). The printer's history is a fixed set of jobs
 * (./jobs.ts); the page's clock is fixed to the same "now".
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from '../control/printer'
import { NOW, ZONE, YEAR_JOBS } from './jobs'

test.use({ timezoneId: ZONE })

async function openYear (page: Page, open: (path: string) => Promise<void>) {
  await page.clock.setFixedTime(new Date(NOW))
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const asked: Array<Record<string, unknown>> = []
  // The list History shows holds only the newest print; the year is asked for apart, by `since`.
  printer.state.answer['server.history.list'] = (params: Record<string, unknown>) => {
    asked.push(params)
    return params.since ? { count: YEAR_JOBS.length, jobs: YEAR_JOBS } : { count: YEAR_JOBS.length, jobs: [YEAR_JOBS[0]] }
  }
  printer.state.answer['server.history.totals'] = {
    job_totals: { total_jobs: 48, total_time: 612000, total_print_time: 590000, total_filament_used: 188000, longest_job: 36000, longest_print: 35000 }
  }
  await open('/history')
  await expect(page.getByTestId('year-glance')).toBeVisible()
  return { printer, asked }
}

const cell = (page: Page, date: string) => page.locator(`[data-tid="year-day-cell"][data-date="${date}"]`)

test('shows the year as a grid, with the totals and streaks in words', async ({ page, open }) => {
  const { asked } = await openYear(page, open)

  // One cell per day, from Monday 10 Nov 2025 to today: 52 weeks and 4 days, and today.
  await expect(page.getByTestId('year-day-cell')).toHaveCount(52 * 7 + 4)
  await expect(page.getByTestId('year-grid')).toHaveAttribute('role', 'grid')

  // The totals count only this year's prints (j7 is a year and a day old).
  await expect(page.getByTestId('year-prints')).toHaveText('5')
  await expect(page.getByTestId('year-hours')).toHaveText('17 h 30 min')
  await expect(page.getByTestId('year-filament')).toHaveText('420 g')
  await expect(page.getByTestId('year-longest')).toHaveText('3 days')
  await expect(page.getByTestId('year-current')).toHaveText('3 days')
  await expect(page.getByTestId('year-zone')).toContainText('Europe/London')

  // Each day says its date and its numbers.
  await expect(cell(page, '2026-11-10')).toHaveAttribute('aria-label', 'Tue 10 Nov 2026: 2 prints, 3 h 30 min, 18 g of filament')
  await expect(cell(page, '2026-11-09')).toHaveAttribute('aria-label', 'Mon 9 Nov 2026: no prints')
  await expect(cell(page, '2026-11-08')).toHaveAttribute('aria-label', 'Sun 8 Nov 2026: 0 prints, 1 h, 12 g of filament')

  // The year was asked for by `since`: a year back, to the Monday.
  await expect.poll(() => asked.some(p => p.since === Date.parse('2025-11-10T00:00:00Z') / 1000)).toBe(true)
})

test('Hours, Prints and Filament change the grid and the ring together', async ({ page, open }) => {
  await openYear(page, open)
  const ring = page.getByTestId('year-ring')
  const total = page.getByTestId('year-ring-total')
  const tenth = cell(page, '2026-11-10')

  // Hours is the first choice: 3.5 h is the second shade.
  await expect(page.getByRole('radio', { name: 'Hours' })).toHaveAttribute('aria-checked', 'true')
  await expect(tenth).toHaveAttribute('data-level', '2')
  await expect(total).toHaveText('18 h')
  await expect(ring).toHaveAttribute('aria-label', /17 h 30 min of printing/)

  await page.getByRole('radio', { name: 'Prints' }).click()
  await expect(page.getByRole('radio', { name: 'Prints' })).toHaveAttribute('aria-checked', 'true')
  await expect(tenth).toHaveAttribute('data-level', '3') // two prints
  await expect(cell(page, '2026-11-11')).toHaveAttribute('data-level', '2') // one print
  await expect(total).toHaveText('5')
  await expect(ring).toHaveAttribute('aria-label', /5 finished prints/)

  await page.getByRole('radio', { name: 'Filament' }).click()
  await expect(tenth).toHaveAttribute('data-level', '1') // 18 g
  await expect(cell(page, '2026-11-11')).toHaveAttribute('data-level', '3') // 60 g
  await expect(cell(page, '2026-08-01')).toHaveAttribute('data-level', '4') // 300 g
  await expect(total).toHaveText('0.4 kg')
  await expect(ring).toHaveAttribute('aria-label', /420 g of filament/)

  // The ring's bands change with it: only the sector for 1 Aug is the brightest.
  await expect(page.locator('.yr__sector.lv4')).toHaveCount(1)

  await page.getByRole('radio', { name: 'Hours' }).click()
  await expect(total).toHaveText('18 h')
  await expect(tenth).toHaveAttribute('data-level', '2')
})

test('the days can be walked with the keyboard and opened', async ({ page, open }) => {
  await openYear(page, open)

  // Tab reaches the grid at today, from the last button before it.
  await page.getByRole('radio', { name: 'Filament' }).focus()
  await page.keyboard.press('Tab')
  await expect(cell(page, '2026-11-12')).toBeFocused()
  // Only one cell is in the tab order.
  await expect(page.locator('[data-tid="year-day-cell"][tabindex="0"]')).toHaveCount(1)

  await page.keyboard.press('ArrowLeft') // a week back, the same weekday
  await expect(cell(page, '2026-11-05')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(cell(page, '2026-11-06')).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(cell(page, '2026-11-04')).toBeFocused()
  await page.keyboard.press('Home') // Monday of that week
  await expect(cell(page, '2026-11-02')).toBeFocused()
  await page.keyboard.press('End')
  await expect(cell(page, '2026-11-08')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(cell(page, '2026-11-08')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('year-day')).toContainText('Sun 8 Nov 2026')
  await expect(page.getByTestId('year-day')).toContainText('Old benchy')
  await expect(page.getByTestId('year-day')).toContainText('Not finished')

  // The right edge: nothing past today.
  await page.keyboard.press('Control+End')
  await expect(cell(page, '2026-11-12')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(cell(page, '2026-11-12')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(cell(page, '2026-11-12')).toBeFocused()

  // A click opens a day too, and lists its prints.
  await cell(page, '2026-11-10').click()
  await expect(page.getByTestId('year-day')).toContainText('Tue 10 Nov 2026')
  await expect(page.getByTestId('year-day')).toContainText('Gear housing')
  await expect(page.getByTestId('year-day')).toContainText('Fan duct')
})

test('fits the screen, with the grid scrolling and today in view', async ({ page, open }) => {
  await openYear(page, open)
  const box = page.viewportSize()!

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  // Today is at the right end of the grid and is scrolled into view.
  const today = await cell(page, '2026-11-12').boundingBox()
  expect(today).not.toBeNull()
  expect(today!.x).toBeGreaterThanOrEqual(0)
  expect(today!.x + today!.width).toBeLessThanOrEqual(box.width)

  // The ring is whole and inside the screen.
  const ring = await page.getByTestId('year-ring').boundingBox()
  expect(ring!.x).toBeGreaterThanOrEqual(0)
  expect(ring!.x + ring!.width).toBeLessThanOrEqual(box.width)

  // On a phone the grid scrolls sideways inside its card, never the page.
  if (box.width <= 400) {
    const scrolls = await page.locator('.yr__scroller').evaluate(el => el.scrollWidth > el.clientWidth)
    expect(scrolls).toBe(true)
  }
})

test('with reduced motion nothing animates, and at rest nothing is running', async ({ page, open }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openYear(page, open)
  const name = await page.locator('.yr__cell').first().evaluate(el => getComputedStyle(el).animationName)
  expect(name).toBe('none')
  const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && (a.effect as KeyframeEffect | null)?.target?.closest?.('.yr')).length)
  expect(running).toBe(0)
})

test('with the flag on but no history, nothing is drawn', async ({ page, open }) => {
  await page.clock.setFixedTime(new Date(NOW))
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answer['server.history.list'] = { count: 0, jobs: [] }
  await open('/history')
  await expect(page.getByTestId('history-page')).toBeVisible()
  await expect(page.getByTestId('year-glance')).toHaveCount(0)
})
