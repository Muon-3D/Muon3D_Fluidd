/**
 * The connection itself: a printer that answers on its address but won't take
 * the socket (KAN-1461), and a socket that drops and comes back.
 * usePrinter's offline() refuses the page's socket until online().
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

test.describe("a printer that won't take the socket", () => {
  test('All printers and its page say they can\'t reach it and why, and Try again connects', async ({ page }) => {
    const printer = await usePrinter(page)
    await printer.offline()
    await page.goto('/')
    await ready(page)
    // Its tile says why too, rather than "Connecting…" for good, and opens it.
    const tile = page.getByRole('button', { name: /^Boxwood Unreachable Can't reach it: it didn't accept the connection/ })
    await expect(tile).toBeVisible({ timeout: 15_000 })
    await tile.click()
    await expect(page).toHaveURL(/\/boxwood-367a/)

    const unreachable = page.getByTestId('connection-unreachable')
    await expect(unreachable).toBeVisible({ timeout: 15_000 })
    await expect(unreachable.getByRole('heading', { level: 1 })).toHaveText("Can't reach Boxwood: it didn't accept the connection")
    await expect(unreachable.getByRole('progressbar')).toHaveCount(0)
    await expect(unreachable.getByTestId('connection-help')).toBeVisible()

    // Still refused: Try again shows it trying, then says so again.
    await unreachable.getByTestId('connection-try-again').click()
    await expect(page.getByTestId('connection-unreachable')).toBeVisible({ timeout: 10_000 })
    expect(printer.called('server.info')).toHaveLength(0)

    printer.online()
    await page.getByTestId('connection-try-again').click()
    await expect(page.getByTestId('connection-unreachable')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByTestId('connection-connecting')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    await expect.poll(() => printer.called('server.info').length).toBeGreaterThan(0)
  })

  test('opened at its address, the same: no endless Connecting', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await printer.offline()
    await open('/')
    await expect(page.getByTestId('connection-unreachable').getByRole('heading', { level: 1 })).toHaveText(/^\s*Can't reach Boxwood: /, { timeout: 15_000 })
    await expect(page.getByTestId('connection-next-try')).toContainText('Trying again by itself in')
  })
})

const PRINTING = {
  ...PRESETS.idleHomed(),
  idle_timeout: { state: 'Printing' },
  print_stats: { state: 'printing', filename: 'part.gcode', message: '', print_duration: 600 },
  virtual_sdcard: { is_active: true, progress: 0.4, file_path: 'part.gcode' }
}
const FINISHED = {
  ...PRESETS.idleHomed(),
  print_stats: { state: 'complete', filename: 'part.gcode', message: '' },
  virtual_sdcard: { is_active: false, progress: 1, file_path: 'part.gcode' }
}

/** The socket drops; while it is down `meanwhile` changes the printer; then it is back and the page reconnects without a reload. */
async function dropAndRestore (page: Page, printer: PrinterHandle, meanwhile: () => void = () => {}, { klipperReady = true } = {}) {
  const subscribed = printer.called('printer.objects.subscribe').length
  await printer.offline()
  await expect(page.getByTestId('connection-reconnecting')).toBeVisible()
  meanwhile()
  printer.online()
  // It tries again by itself.
  await expect(page.getByTestId('connection-reconnecting')).toHaveCount(0, { timeout: 30_000 })
  // Subscribed again, once (Klipper not ready: not at all).
  if (!klipperReady) return
  await expect.poll(() => printer.called('printer.objects.subscribe').length).toBe(subscribed + 1)
}

test.describe('a socket that drops and comes back', () => {
  test('Overview: the print that finished meanwhile is not shown printing, and live readings come back', async ({ page, open }) => {
    const printer = await usePrinter(page, PRINTING)
    await open('/')
    const percent = page.getByTestId('job-percent')
    await expect(percent).toContainText('40')
    await dropAndRestore(page, printer, () => { printer.state.status = FINISHED })
    await expect(percent).toHaveCount(0)
    await expect(page.getByText('Nothing is printing')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0)
    printer.report({ ...FINISHED, extruder: { temperature: 151.5 } })
    await expect(page.getByText('151.5°')).toBeVisible()
  })

  test('Overview: Klipper shut down meanwhile, so the print is not shown going on', async ({ page, open }) => {
    const printer = await usePrinter(page, PRINTING)
    await open('/')
    const percent = page.getByTestId('job-percent')
    await expect(percent).toContainText('40')
    const switcher = page.getByRole('button', { name: 'Switch printer' })
    await expect(switcher).toContainText('left')
    await dropAndRestore(page, printer, () => { printer.state.results['server.info'] = { klippy_state: 'shutdown' } }, { klipperReady: false })
    await expect(switcher).toContainText('Klipper Shutdown')
    await expect(switcher).not.toContainText('left')
    await expect(percent).toHaveCount(0)
    await expect(page.getByText('Nothing is printing')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0)
  })

  test('Control: moves wait out the drop, then work again without a reload', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    const right = page.getByRole('button', { name: 'Head right (X+)' })
    await right.click()
    await expect.poll(() => printer.moves().length).toBe(1)
    await printer.offline()
    await expect(page.getByTestId('connection-reconnecting')).toBeVisible()
    await right.click({ force: true })
    await page.waitForTimeout(300)
    expect(printer.moves()).toHaveLength(1)
    printer.online()
    await expect(page.getByTestId('connection-reconnecting')).toHaveCount(0, { timeout: 30_000 })
    await expect(right).toBeEnabled()
    await right.click()
    await expect.poll(() => printer.moves().length).toBe(2)
    expect(printer.called('printer.objects.subscribe')).toHaveLength(2)
  })

  test('Jobs: the list is read again, with what changed meanwhile', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/jobs')
    const rows = page.getByTestId('jobs-row')
    await expect(rows.first()).toBeVisible()
    const before = await rows.count()
    await dropAndRestore(page, printer, () => {
      printer.state.answers['server.files.get_directory'] = () => ({
        dirs: [],
        files: [{ filename: 'came_back.gcode', size: 1000, modified: Date.now() / 1000, permissions: 'rw' }],
        disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
        root_info: { name: 'gcodes', permissions: 'rw' }
      })
    })
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText(/came.back/i)
    expect(before).toBeGreaterThan(1)
  })

  test('Console: after three drops each line still arrives once, and the chips send again', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/console')
    const log = page.getByTestId('console-log')
    await expect(page.getByTestId('console-quick-M105')).toBeEnabled()
    for (let i = 0; i < 3; i++) await dropAndRestore(page, printer)
    printer.say('// back again')
    await expect(log.getByText('// back again')).toHaveCount(1)
    await page.waitForTimeout(500)
    await expect(log.getByText('// back again')).toHaveCount(1)
    await page.getByTestId('console-quick-M105').click()
    await expect.poll(() => printer.gcode).toEqual(['M105'])
  })
})
