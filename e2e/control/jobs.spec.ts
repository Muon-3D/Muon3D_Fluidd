/**
 * Jobs: the files on the printer as one list, with the picked file beside it
 * (or, on a phone, a Print bar above the tab bar).
 *
 * The mock printer is Boxwood, mid-print on M1_bracket, with five files. Every
 * test sees it from this page only: usePrinter makes it idle where a test needs
 * to print, and the RPCs the page sends are read off the page's websocket.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

/** Every JSON-RPC the page sends to the printer, in order. */
function recordRpc (page: Page) {
  const sent: Array<{ method: string, params: any }> = []
  page.on('websocket', ws => {
    ws.on('framesent', frame => {
      try {
        const msg = JSON.parse(String(frame.payload))
        if (msg.method) sent.push({ method: msg.method, params: msg.params })
      } catch {
        // Not JSON.
      }
    })
  })
  return (method: string) => sent.filter(m => m.method === method)
}

/** The print confirm: the plate is ticked clear, then Print now. */
async function confirmPrint (page: Page) {
  const plate = page.getByTestId('confirm-plate')
  if (await plate.count()) await plate.click()
  await page.getByTestId('confirm-ok').click()
}

const row = (page: Page, text: string) => page.getByTestId('jobs-row').filter({ hasText: text })

test('one list: the printing file is pinned first, and there are no view modes or tabs', async ({ page, open, isMobile }) => {
  await open('/jobs')
  await expect(page.getByTestId('page-title')).toHaveText('Jobs')
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
  await expect(page.getByTestId('jobs-row').first()).toContainText('M1 bracket')
  await expect(page.getByTestId('jobs-row').first()).toContainText(isMobile ? /\d+%/ : 'Printing now')
  await expect(page.getByRole('radio', { name: 'Pictures' })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Table' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Jobs pages' })).toHaveCount(0)
  await expect(page.getByText(/5 files on Boxwood/)).toBeVisible()
})

test('the ··· menu holds History, and goes there', async ({ page, open }) => {
  await open('/jobs')
  await page.getByRole('button', { name: 'More about jobs' }).click()
  await expect(page.getByRole('menuitem', { name: 'New folder' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'History' }).click()
  await expect(page).toHaveURL(/\/history$/)
})

test('search narrows the list, says so when nothing matches, and clears', async ({ page, open, isMobile }) => {
  await open('/jobs')
  if (isMobile) await page.getByRole('button', { name: 'Search files' }).click()
  const find = page.getByRole('searchbox', { name: 'Search files' })
  await find.fill('benchy')
  await expect(page.getByTestId('jobs-row')).toHaveCount(1)
  await expect(page.getByTestId('jobs-row')).toContainText('Benchy')
  await find.fill('zzzz')
  await expect(page.getByTestId('jobs-empty')).toContainText('Nothing matches')
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
})

test('the order: Name puts the files A to Z under the one that is printing', async ({ page, open }) => {
  await open('/jobs')
  await page.getByRole('radiogroup', { name: 'Order' }).getByRole('radio', { name: 'Name' }).click()
  const names = await page.getByTestId('jobs-row').locator('b').allTextContents()
  expect(names[0]).toContain('M1 bracket')
  expect(names.slice(1)).toEqual([...names.slice(1)].sort((a, b) => a.localeCompare(b)))
})

test('desktop: the picked file has its tile, and Print asks before it starts the print', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'The tile is the desktop layout; the phone has the Print bar')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const rpc = recordRpc(page)
  await open('/jobs')
  const tile = page.getByTestId('jobs-detail')
  await expect(tile).toBeVisible()
  await row(page, 'Benchy').click()
  await expect(tile).toContainText('Benchy')
  await expect(tile.getByText('benchy_0.16mm_PETG.gcode')).toBeVisible()
  await expect(tile.getByText('Print time')).toBeVisible()

  await tile.getByRole('button', { name: 'Print', exact: true }).click()
  // It asks first: nothing has been sent.
  await expect(page.getByTestId('confirm')).toContainText('Print benchy_0.16mm_PETG')
  expect(rpc('printer.print.start')).toHaveLength(0)
  await confirmPrint(page)
  await expect.poll(() => rpc('printer.print.start').map(m => m.params)).toEqual([{ filename: 'benchy_0.16mm_PETG.gcode' }])
  expect(printer.gcode).toEqual([])
})

test('phone: a tap picks a file and opens the Print bar; a second tap closes it', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'The Print bar is the phone layout')
  await usePrinter(page, PRESETS.idleHomed())
  const rpc = recordRpc(page)
  await open('/jobs')
  await expect(page.getByTestId('jobs-sticky')).toHaveCount(0)
  await row(page, 'Benchy').click()
  const bar = page.getByTestId('jobs-sticky')
  await expect(bar).toContainText('Print Benchy')
  await bar.getByRole('button', { name: 'Options for Benchy' }).click()
  await expect(page.getByRole('menuitem', { name: 'Preview' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await page.keyboard.press('Escape')

  await bar.getByRole('button', { name: /^Print Benchy/ }).click()
  await confirmPrint(page)
  await expect.poll(() => rpc('printer.print.start').length).toBe(1)
})

test('Delete asks first, and Cancel sends nothing', async ({ page, open }) => {
  const rpc = recordRpc(page)
  await open('/jobs')
  await row(page, 'Fan duct').getByRole('button', { name: 'Options for Fan duct v3' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByTestId('confirm')).toContainText('Delete Fan duct v3?')
  await page.getByTestId('confirm').getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(rpc('server.files.delete_file')).toHaveLength(0)

  await row(page, 'Fan duct').getByRole('button', { name: 'Options for Fan duct v3' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => rpc('server.files.delete_file').map(m => m.params)).toEqual([{ path: 'gcodes/fan_duct_v3.gcode' }])
})

test('the file that is printing cannot be renamed, moved or deleted', async ({ page, open }) => {
  await open('/jobs')
  await row(page, 'M1 bracket').getByRole('button', { name: 'Options for M1 bracket' }).click()
  for (const action of ['rename', 'move', 'delete']) {
    await expect(page.locator(`[data-action="${action}"]`)).toHaveClass(/v-list-item--disabled/)
  }
  // Download and Preview stay.
  await expect(page.locator('[data-action="download"]')).not.toHaveClass(/v-list-item--disabled/)
})

test('Upload opens the file picker with the printer files accepted', async ({ page, open }) => {
  await open('/jobs')
  const chooser = page.waitForEvent('filechooser')
  await page.getByTestId('jobs-upload').click()
  expect((await chooser).isMultiple()).toBe(true)
})

/** The mock's gcodes folder, with the two files that printed before given a print time. */
function filesPrintedBefore (): (params: any) => unknown {
  const now = Date.now() / 1000
  const names: Array<[string, number, number | null]> = [
    ['M1_bracket_PLA_0.2mm.gcode', 4_000_000, null], ['calibration_cube.gcode', 420_000, now - 90000],
    ['benchy_0.16mm_PETG.gcode', 7_200_000, now - 180000], ['fan_duct_v3.gcode', 2_100_000, null],
    ['cable_clip_x12.gcode', 900_000, null]
  ]
  return () => ({
    dirs: [],
    files: names.map(([filename, size, printed], i) => ({ filename, size, modified: now - i * 86400, permissions: 'rw', ...(printed ? { print_start_time: printed } : {}) })),
    disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
    root_info: { name: 'gcodes', permissions: 'rw' }
  })
}

test('a printer that takes no commands: the actions are off and the page says why, the files can still be looked at', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  // Klipper has shut down: the files are still there, but nothing can be told to move or print.
  printer.state.answers['server.info'] = {
    klippy_connected: true,
    klippy_state: 'shutdown',
    components: ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'job_state', 'job_queue', 'history', 'authorization'],
    failed_components: [],
    registered_directories: ['config', 'logs', 'gcodes'],
    warnings: [],
    websocket_count: 1,
    moonraker_version: 'v0.9.3-muon',
    api_version: [1, 5, 0],
    api_version_string: '1.5.0'
  }
  await open('/jobs')
  await expect(page.getByTestId('jobs-readonly')).toBeVisible()
  await expect(page.getByTestId('jobs-upload')).toBeDisabled()
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
  await row(page, 'Fan duct').getByRole('button', { name: 'Options for Fan duct v3' }).click()
  await expect(page.locator('[data-action="delete"]')).toHaveClass(/v-list-item--disabled/)
  await expect(page.locator('[data-action="rename"]')).toHaveClass(/v-list-item--disabled/)
})

test('the Delete key on the printing file does nothing, and on another file it asks first', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'Keys are a desktop thing')
  const rpc = recordRpc(page)
  await open('/jobs')
  await row(page, 'M1 bracket').click()
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  await row(page, 'Fan duct').click()
  // Focus on a row's menu button: its keys are its own.
  await row(page, 'Fan duct').getByRole('button', { name: 'Options for Fan duct v3' }).focus()
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  await page.getByTestId('jobs-rows').focus()
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('confirm')).toContainText('Delete Fan duct v3?')
  await page.getByTestId('confirm-cancel').click()
  expect(rpc('server.files.delete_file')).toHaveLength(0)
})

test('Select: tick files, one bar, one confirm, and the printing file is left out', async ({ page, open }) => {
  const rpc = recordRpc(page)
  await open('/jobs')
  await page.getByRole('button', { name: 'More about jobs' }).click()
  await page.getByTestId('jobs-select').click()
  await expect(page.getByTestId('jobs-selection')).toContainText('0 selected')
  await page.getByTestId('jobs-select-all').check()
  await expect(page.getByTestId('jobs-selection')).toContainText('5 selected')
  await expect(page.getByTestId('jobs-selection')).toContainText('is printing, so it stays where it is')
  await page.getByTestId('jobs-select-all').uncheck()
  await row(page, 'Fan duct').getByTestId('jobs-row-check').check()
  await row(page, 'Cable clip').getByTestId('jobs-row-check').check()
  await page.getByTestId('jobs-sel-delete').click()
  await expect(page.getByTestId('confirm')).toContainText('Delete 2 files?')
  expect(rpc('server.files.delete_file')).toHaveLength(0)
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => rpc('server.files.delete_file').map(m => m.params.path).sort()).toEqual(['gcodes/cable_clip_x12.gcode', 'gcodes/fan_duct_v3.gcode'])
  await expect(page.getByTestId('jobs-selection')).toHaveCount(0)
})

test('the filter shows only files never printed, or printed before', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answers['server.files.get_directory'] = filesPrintedBefore()
  await open('/jobs')
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
  await page.getByRole('button', { name: 'More about jobs' }).click()
  await page.getByTestId('jobs-filter-never').click()
  await expect(page.getByTestId('jobs-row')).toHaveCount(3)
  await expect(page.getByTestId('jobs-row').filter({ hasText: 'Benchy' })).toHaveCount(0)
  await page.getByRole('button', { name: 'More about jobs' }).click()
  await page.getByTestId('jobs-filter-before').click()
  await expect(page.getByTestId('jobs-row')).toHaveCount(2)
  await expect(page.getByTestId('jobs-row').filter({ hasText: 'Benchy' })).toHaveCount(1)
})

test('Up next: move a job later, and take one out', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const queued = [
    { job_id: 'q1', filename: 'cable_clip_x12.gcode', time_added: 1, time_in_queue: 0 },
    { job_id: 'q2', filename: 'fan_duct_v3.gcode', time_added: 2, time_in_queue: 0 }
  ]
  const status = () => ({ queued_jobs: queued, queue_state: 'ready' })
  for (const method of ['server.job_queue.status', 'server.job_queue.post_job', 'server.job_queue.delete_job']) printer.state.answers[method] = status
  await open('/jobs')
  const next = page.getByTestId('jobs-up-next')
  await expect(next).toContainText('Cable clip x12')
  await next.getByRole('button', { name: 'Move Cable clip x12 later' }).click()
  await expect.poll(() => printer.called('server.job_queue.post_job')).toEqual([{ filenames: ['fan_duct_v3.gcode', 'cable_clip_x12.gcode'], reset: true }])
  await next.getByRole('button', { name: 'Take Cable clip x12 out of the queue' }).click()
  await expect.poll(() => printer.called('server.job_queue.delete_job')).toEqual([{ job_ids: ['q1'] }])
})

test('the printing row links to Overview', async ({ page, open }) => {
  await open('/jobs')
  await page.getByTestId('jobs-printing-link').first().click()
  await expect(page).toHaveURL(/boxwood-367a\/?$/)
})
