/**
 * History: the rollup tiles, the table (rows on a phone), the filters and the
 * empty states, and what each print's ··· asks the printer to do.
 *
 * The printer's history is answered per test by usePrinter, so nothing here
 * changes what the shared mock tells other tests.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'
import { MOCK_PORT } from '../ports'

const DAY = 86400

/** The plate check must be ticked before Print now goes. */
async function confirmPrint (page: import('@playwright/test').Page) {
  await page.getByTestId('confirm-plate').check()
  await page.getByRole('button', { name: 'Print now' }).click()
}

/**
 * History, drawn and settled. Vite's dependency optimiser (or the app's
 * one-per-tab stale-chunk recovery) can reload the page once while a cold
 * server warms up, which drops anything typed into it: so wait for the
 * page to be there before acting (the network never goes idle: the socket
 * and the status polls keep talking), and retry typing where it matters.
 */
async function openHistory (page: import('@playwright/test').Page, open: (path: string) => Promise<void>, drawn = 'history-page') {
  await open('/history')
  await expect(page.getByTestId(drawn)).toBeVisible()
}

// The table and the row menus are the desktop layout; the phone has its own test below.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === 'phone' && !testInfo.title.includes('phone') && !/empty state|no match|a name finds/.test(testInfo.title), 'desktop layout')
})

function job (id: string, file: string, status: string, daysAgo: number, printSeconds: number, mm: number, extra: Record<string, unknown> = {}) {
  const start = Math.floor(Date.now() / 1000) - daysAgo * DAY
  return {
    job_id: id,
    filename: file,
    status,
    start_time: start,
    end_time: start + printSeconds + 120,
    print_duration: printSeconds,
    total_duration: printSeconds + 120,
    filament_used: mm,
    exists: true,
    metadata: { size: 2_000_000, filament_type: 'PLA', filament_colors: ['#80d6d1'], slicer: 'OrcaSlicer', slicer_version: '2.3.0', layer_height: 0.2 },
    ...extra
  }
}

const JOBS = [
  job('a1', 'cable_clip_x6_PLA_0.2mm.gcode', 'completed', 1, 2280, 3800),
  job('b2', 'phone_stand_PLA_0.2mm.gcode', 'completed', 3, 9900, 13800, { metadata: { size: 2_000_000, filament_type: 'PLA', filament_colors: ['#ffffff'], filament_total: 13800, filament_weight_total: 41 } }),
  job('c3', 'gear_housing_v3_PLA_0.16mm.gcode', 'error', 10, 4320, 6000),
  job('d4', 'fan_duct_left_PLA_0.2mm.gcode', 'cancelled', 20, 840, 1000, { metadata: { size: 1_000_000, filament_type: 'PLA', filament_total: 2000 } }),
  job('e5', 'old_benchy_PLA_0.2mm.gcode', 'completed', 60, 5400, 7000)
]

async function withHistory (page: import('@playwright/test').Page, jobs = JOBS, status = PRESETS.idleHomed()): Promise<PrinterHandle> {
  const printer = await usePrinter(page, status)
  printer.state.answer['server.history.list'] = { count: jobs.length, jobs }
  printer.state.answer['server.history.totals'] = {
    job_totals: { total_jobs: 48, total_time: 612000, total_print_time: 590000, total_filament_used: 188000, longest_job: 36000, longest_print: 35000 }
  }
  return printer
}

test('the tiles say how the last 30 days went, and the table lists those prints, newest first', async ({ page, open }) => {
  await withHistory(page)
  await openHistory(page, open)

  const tiles = page.getByTestId('history-totals')
  await expect(tiles).toContainText('Prints')
  await expect(tiles).toContainText('in the last 30 days')
  await expect(tiles).toContainText('Success rate')
  await expect(tiles).toContainText('50 %')
  await expect(tiles).toContainText('2 done · 2 not')
  await expect(tiles).toContainText('Print time')
  await expect(tiles).toContainText('4.8 h')
  await expect(tiles).toContainText('avg 1 h 12 min')
  await expect(tiles).toContainText('PLA')

  const table = page.getByTestId('history-table')
  await expect(table.getByRole('columnheader')).toHaveText(['File', 'Result', 'Material', 'Duration', 'Filament', 'Finished', 'Actions'])
  const rows = page.getByTestId('history-row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('Cable clip')
  await expect(rows.nth(0)).toContainText('Done')
  await expect(rows.nth(0)).toContainText('38 m')
  await expect(rows.nth(0)).toContainText('~11.3 g')
  await expect(rows.nth(1)).toContainText('41 g')
  await expect(rows.nth(1)).not.toContainText('~')
  await expect(tiles).toContainText('~')
  await expect(rows.nth(0)).toContainText(/Yesterday|Today/)
  await expect(rows.nth(2)).toContainText('Failed')
  await expect(rows.nth(3)).toContainText('Cancelled')
  await expect(rows.nth(3)).toContainText('14 m')
  await expect(page.getByText('old_benchy', { exact: false })).toHaveCount(0)
})

test('the result segment and the date range narrow the table; the tiles follow the range only', async ({ page, open }) => {
  await withHistory(page)
  await openHistory(page, open)
  const rows = page.getByTestId('history-row')

  await page.getByRole('radiogroup', { name: 'Show' }).getByRole('radio', { name: 'Failed' }).click()
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('Gear housing')
  await expect(page.getByTestId('history-totals')).toContainText('2 done · 2 not')

  await page.getByRole('radiogroup', { name: 'Show' }).getByRole('radio', { name: 'Cancelled' }).click()
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('Fan duct')

  await page.getByRole('radiogroup', { name: 'Show' }).getByRole('radio', { name: 'All' }).click()
  await page.getByTestId('history-range').click()
  await page.getByTestId('history-range-0').click()
  await expect(page.getByTestId('history-range')).toContainText('All time')
  await expect(rows).toHaveCount(5)
  await expect(page.getByTestId('history-totals')).toContainText('all time')
})

test('a name finds a print', async ({ page, open }) => {
  await withHistory(page)
  await openHistory(page, open)
  // If the page reloads under the typing, type it again rather than race.
  await expect(async () => {
    await page.getByTestId('history-find').fill('gear')
    await expect(page.getByTestId('history-row')).toHaveCount(1, { timeout: 3000 })
  }).toPass()
  await expect(async () => {
    await page.getByTestId('history-find').fill('zzz')
    await expect(page.getByTestId('history-no-match')).toContainText('No print matches "zzz"', { timeout: 3000 })
  }).toPass()
})

test('a filter with no match says so instead of an empty table, and Clear filters brings everything back', async ({ page, open }) => {
  await withHistory(page, [JOBS[0], JOBS[1], JOBS[4]])
  await openHistory(page, open)

  await page.getByRole('radiogroup', { name: 'Show' }).getByRole('radio', { name: 'Failed' }).click()
  const empty = page.getByTestId('history-no-match')
  await expect(empty).toContainText('No failed prints in the last 30 days')
  await expect(empty).toContainText('Try a wider date range.')
  await expect(page.getByTestId('history-table')).toHaveCount(0)

  await empty.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByTestId('history-row')).toHaveCount(3)
})

test('a printer with no prints shows the empty state and a way to Jobs, never a table of headers', async ({ page, open }) => {
  await withHistory(page, [])
  await openHistory(page, open)

  const empty = page.getByTestId('history-empty')
  await expect(empty).toContainText('No prints yet')
  await expect(empty).toContainText('Finished, failed and cancelled prints land here.')
  await expect(page.getByTestId('history-table')).toHaveCount(0)
  await expect(page.getByRole('columnheader')).toHaveCount(0)

  await empty.getByRole('link', { name: 'Go to Jobs' }).click()
  await expect(page).toHaveURL(/\/jobs$/)
})

test('Print again, from the row menu, asks first and then starts that file', async ({ page, open }) => {
  const printer = await withHistory(page)
  await openHistory(page, open)

  await page.getByRole('button', { name: /More for Cable clip/ }).click()
  await page.getByRole('menuitem', { name: 'Print again' }).click()
  expect(printer.calls.filter(c => c.method === 'printer.print.start')).toEqual([])

  await confirmPrint(page)
  await expect.poll(() => printer.calls.filter(c => c.method === 'printer.print.start').map(c => c.params))
    .toEqual([{ filename: 'cable_clip_x6_PLA_0.2mm.gcode' }])
})

test('Remove from history asks first, then deletes only that print', async ({ page, open }) => {
  const printer = await withHistory(page)
  await openHistory(page, open)

  await page.getByRole('button', { name: /More for Gear housing/ }).click()
  await page.getByRole('menuitem', { name: 'Remove from history' }).click()
  await expect(page.getByText(/Remove Gear housing/)).toBeVisible()
  expect(printer.calls.filter(c => c.method === 'server.history.delete_job')).toEqual([])

  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect.poll(() => printer.calls.filter(c => c.method === 'server.history.delete_job').map(c => c.params)).toEqual([{ uid: 'c3' }])
})

test('Details opens a print\'s times, filament and slicer settings; a cancelled one says how far it got', async ({ page, open }) => {
  await withHistory(page)
  await openHistory(page, open)

  await page.getByRole('button', { name: /More for Fan duct/ }).click()
  await page.getByRole('menuitem', { name: 'Details' }).click()
  const detail = page.getByTestId('history-detail')
  await expect(detail).toContainText('Cancelled')
  await expect(detail).toContainText('Stopped at 50%')
  await expect(detail).toContainText('With the warm-up')
  await expect(detail).toContainText('Filament used')
  await detail.getByRole('button', { name: 'Close' }).click()
  await expect(detail).toHaveCount(0)
})

test('Clear history and Reset the totals both ask first', async ({ page, open }) => {
  const printer = await withHistory(page)
  await openHistory(page, open)
  await expect(page.locator('.hist__foot')).toContainText('All time on')

  await page.getByTestId('history-reset-totals').click()
  await expect(page.getByText(/back to zero/)).toBeVisible()
  expect(printer.calls.filter(c => c.method === 'server.history.reset_totals')).toEqual([])
  await page.getByRole('button', { name: 'Reset the totals' }).last().click()
  await expect.poll(() => printer.calls.filter(c => c.method === 'server.history.reset_totals').length).toBe(1)

  await page.getByTestId('history-clear').click()
  await page.getByRole('button', { name: 'Clear history' }).last().click()
  await expect.poll(() => printer.calls.filter(c => c.method === 'server.history.delete_job').map(c => c.params)).toEqual([{ all: true }])
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the prints are rows with the result as a pill, and a tap opens the print\'s details and actions', async ({ page, open }) => {
    const printer = await withHistory(page)
    await openHistory(page, open)

    await expect(page.getByTestId('history-table')).toHaveCount(0)
    await expect(page.getByTestId('history-totals')).toContainText('Success rate')
    const rows = page.getByTestId('history-row')
    await expect(rows).toHaveCount(4)
    await expect(rows.first()).toContainText('Cable clip')
    await expect(rows.first()).toContainText('38 m · ~11.3 g')
    await expect(rows.first()).toContainText('Done')
    await expect(rows.nth(2)).toContainText('Failed')

    await rows.nth(1).click()
    const detail = page.getByTestId('history-detail')
    await expect(detail).toContainText('Phone stand')
    await detail.getByTestId('history-detail-print-again').click()
    await confirmPrint(page)
    await expect.poll(() => printer.calls.filter(c => c.method === 'printer.print.start').length).toBe(1)

    // Nothing runs off the side of the phone.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('desktop menus', () => {
  test('a search the date range hides says so, offers all time, and keeps the query', async ({ page, open }) => {
    await withHistory(page)
    await openHistory(page, open)

    await page.getByTestId('history-find').fill('old_benchy')
    const empty = page.getByTestId('history-no-match')
    await expect(empty).toContainText('No print matches "old_benchy" in the last 30 days')
    await expect(empty).toContainText('1 older print matches.')
    await expect(empty).not.toContainText('spelling')

    await empty.getByRole('button', { name: 'Show all time' }).click()
    await expect(page.getByTestId('history-row')).toHaveCount(1)
    await expect(page.getByTestId('history-row')).toContainText('Old benchy')
    await expect(page.getByTestId('history-find')).toHaveValue('old_benchy')
    await expect(page.getByTestId('history-range')).toContainText('All time')
  })

  test('with only older prints, it says so and one click shows them', async ({ page, open }) => {
    await withHistory(page, [JOBS[4]])
    await openHistory(page, open)

    const empty = page.getByTestId('history-no-match')
    await expect(empty).toContainText('No prints in the last 30 days')
    await expect(empty).toContainText('1 older print is in the history.')
    await expect(page.getByTestId('history-table')).toHaveCount(0)
    await expect(page.getByTestId('history-totals')).toContainText('Prints')

    await empty.getByRole('button', { name: 'Show all time' }).click()
    await expect(page.getByTestId('history-row')).toHaveCount(1)
  })

  test('a print still in progress counts as a print and its time, but not toward the success rate', async ({ page, open }) => {
    await withHistory(page, [JOBS[0], JOBS[2], job('p9', 'live_PLA_0.2mm.gcode', 'in_progress', 0, 1200, 500)])
    await openHistory(page, open)

    const tiles = page.getByTestId('history-totals')
    await expect(tiles.locator('.hist__tile').nth(0)).toContainText('3')
    await expect(tiles).toContainText('50 %')
    await expect(tiles).toContainText('1 done · 1 not')
    await expect(page.getByTestId('history-row').filter({ hasText: 'Live' })).toContainText('Printing')
  })

  test('a print whose file is gone cannot be printed again, and says why', async ({ page, open }) => {
    await withHistory(page, [job('g1', 'gone_PLA_0.2mm.gcode', 'completed', 1, 600, 1000, { exists: false })])
    await openHistory(page, open)

    await page.getByRole('button', { name: /More for Gone/ }).click()
    await expect(page.getByRole('menuitem', { name: 'Details' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Print again' })).toHaveCount(0)
    await page.getByRole('menuitem', { name: 'Details' }).click()
    await expect(page.getByTestId('history-detail')).toContainText("can't print again from here")
    await expect(page.getByTestId('history-detail-print-again')).toHaveCount(0)
  })

  test('Print again is off when the printer cannot be controlled, not just when Klipper is down', async ({ page, open }) => {
    const printer = await withHistory(page)
    // Klipper is ready, but Moonraker says it has no connection to it.
    const info = await (await page.request.get(`http://localhost:${MOCK_PORT}/server/info`)).json()
    printer.state.answer['server.info'] = { ...(info.result ?? info), klippy_connected: false }
    await openHistory(page, open)

    await page.getByRole('button', { name: /More for Cable clip/ }).click()
    await expect(page.getByRole('menuitem', { name: 'Print again' })).toBeDisabled()
    await page.getByRole('menuitem', { name: 'Details' }).click()
    await expect(page.getByTestId('history-detail-print-again')).toBeDisabled()
    expect(printer.calls.filter(c => c.method === 'printer.print.start')).toEqual([])
  })
})
