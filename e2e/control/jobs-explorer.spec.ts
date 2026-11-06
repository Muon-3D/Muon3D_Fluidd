import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

/**
 * Jobs as File Explorer: clicks and keys that select, a checkbox on every
 * row, the toolbar that shows what can be done to the selection, column
 * headers that sort, and folders. Each test serves its own files through
 * the page's printer, so the shared mock is left as it is.
 */

const now = Date.now() / 1000
const day = 86400

/** A folder and three files that differ in every column. */
const FILES = [
  { filename: 'alpha_block.gcode', size: 300_000, modified: now - 3 * day, estimated_time: 3600, filament_type: 'PLA', print_start_time: now - 20 * day },
  { filename: 'bravo_hook.gcode', size: 100_000, modified: now - day, estimated_time: 7200, filament_type: 'PETG', print_start_time: now - 2 * day },
  { filename: 'charlie_clip.gcode', size: 200_000, modified: now - 2 * day, estimated_time: 1800, filament_type: 'ABS' }
]

function listing (path: string, files: any[], dirs: any[] = []) {
  return {
    dirs,
    files: files.map(f => ({ permissions: 'rw', ...f })),
    disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
    root_info: { name: path.split('/')[0], permissions: 'rw' }
  }
}

/** The page's printer, idle, with FILES in gcodes/ and one file in gcodes/parts/. */
async function withFiles (page: Page): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answers['server.files.get_directory'] = (params: any) => {
    const path = String(params.path ?? 'gcodes')
    if (path === 'gcodes/parts') return listing(path, [{ filename: 'delta_gear.gcode', size: 50_000, modified: now - day }])
    if (path !== 'gcodes') return listing(path, [])
    return listing(path, FILES, [{ dirname: 'parts', modified: now - 10 * day, size: 4096, permissions: 'rw' }])
  }
  printer.state.answers['server.files.metadata'] = (params: any) => {
    const f = FILES.find(x => x.filename === params.filename) ?? { filename: params.filename, size: 1, modified: now }
    return { ...f, slicer: 'OrcaSlicer', layer_height: 0.2, thumbnails: [] }
  }
  printer.state.answers['server.files.post_directory'] = (params: any) => ({ item: { path: params.path, root: 'gcodes' }, action: 'create_dir' })
  printer.state.answers['server.files.move'] = (params: any) => ({ item: { path: params.dest, root: 'gcodes' }, action: 'move_file' })
  printer.state.answers['server.files.delete_file'] = (params: any) => ({ item: { path: params.path, root: 'gcodes' }, action: 'delete_file' })
  return printer
}

const rows = (page: Page) => page.getByTestId('jobs-row')
const row = (page: Page, key: string) => page.locator(`[data-tid="jobs-row"][data-key="${key}"]`)
const order = (page: Page) => rows(page).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.key))
const selected = (page: Page) => page.locator('[data-tid="jobs-row"][aria-selected="true"]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.key).sort())

const A = 'alpha_block.gcode'
const B = 'bravo_hook.gcode'
const C = 'charlie_clip.gcode'

/** The list is up and the printer takes commands (the page has settled on its printer). */
async function settled (page: Page, count: number) {
  await expect(rows(page)).toHaveCount(count, { timeout: 30_000 })
  await expect(page.getByTestId('jobs-toolbar-new-folder')).toBeEnabled({ timeout: 30_000 })
}

async function openSortedByName (page: Page, open: (path: string) => Promise<unknown>) {
  await open('/jobs')
  await settled(page, 4)
  const name = page.getByTestId('jobs-col-name')
  await name.click()
  if (await name.getAttribute('data-sort') !== 'asc') await name.click()
  await expect.poll(() => order(page)).toEqual(['parts', A, B, C])
}

test('a click selects one, Ctrl toggles, Shift ranges from the last click, Ctrl+Shift adds the range', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'Ctrl and Shift are a keyboard\'s; a phone has the checkboxes')
  await withFiles(page)
  await openSortedByName(page, open)
  const mod = 'ControlOrMeta' as const

  await row(page, A).click()
  await expect.poll(() => selected(page)).toEqual([A])
  await row(page, B).click()
  await expect.poll(() => selected(page)).toEqual([B])
  await row(page, C).click({ modifiers: [mod] })
  await expect.poll(() => selected(page)).toEqual([B, C])
  await row(page, B).click({ modifiers: [mod] })
  await expect.poll(() => selected(page)).toEqual([C])

  // Shift ranges from the last plain or Ctrl click (the anchor), in place of what was selected.
  await row(page, A).click()
  await row(page, C).click({ modifiers: ['Shift'] })
  await expect.poll(() => selected(page)).toEqual([A, B, C])
  await row(page, 'parts').click({ modifiers: ['Shift'] })
  await expect.poll(() => selected(page)).toEqual(['parts', A].sort())

  // Ctrl+Shift adds the range to what is selected.
  await row(page, 'parts').click()
  await row(page, B).click({ modifiers: [mod] })
  await row(page, C).click({ modifiers: [mod, 'Shift'] })
  await expect.poll(() => selected(page)).toEqual(['parts', B, C].sort())

  // A click where there is no row lets go of everything.
  const list = page.getByTestId('jobs-rows')
  const box = await list.boundingBox()
  await list.click({ position: { x: 40, y: box!.height - 6 } })
  await expect.poll(() => selected(page)).toEqual([])
  await expect(page.getByTestId('jobs-sel-count')).toHaveCount(0)
})

test('the keys: arrows move, Shift+arrows extend, Ctrl+A selects all, Escape lets go, and none of them while typing', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'Keys are a desktop thing')
  await withFiles(page)
  await openSortedByName(page, open)
  const mod = 'ControlOrMeta' as const

  await row(page, A).click()
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => selected(page)).toEqual([B])
  await page.keyboard.press('Shift+ArrowDown')
  await expect.poll(() => selected(page)).toEqual([B, C])
  await page.keyboard.press('Shift+ArrowUp')
  await page.keyboard.press('Shift+ArrowUp')
  await expect.poll(() => selected(page)).toEqual([A, B])
  await page.keyboard.press(`${mod}+a`)
  await expect.poll(() => selected(page)).toEqual(['parts', A, B, C].sort())
  await expect(page.getByTestId('jobs-sel-count')).toContainText('4 selected')
  await page.keyboard.press('Escape')
  await expect.poll(() => selected(page)).toEqual([])

  // In the search field, the keys are the field's.
  const search = page.getByRole('searchbox', { name: 'Search files' }).first()
  await search.fill('a')
  await page.keyboard.press(`${mod}+a`)
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => selected(page)).toEqual([])
})

test('every row has a checkbox, and Select all is in the Name header; each has a name', async ({ page, open, isMobile }) => {
  await withFiles(page)
  await openSortedByName(page, open)
  await expect(page.getByTestId('jobs-row-check')).toHaveCount(4)
  await expect(page.getByRole('checkbox', { name: 'Select all' })).toBeVisible()
  for (const name of ['parts', 'Alpha block', 'Bravo hook', 'Charlie clip']) {
    await expect(page.getByRole('checkbox', { name: new RegExp(`^Select ${name}`, 'i') })).toHaveCount(1)
  }

  await row(page, A).getByTestId('jobs-row-check').check()
  await row(page, C).getByTestId('jobs-row-check').check()
  await expect.poll(() => selected(page)).toEqual([A, C])
  // A tick is not a tap: a phone's Print bar stays shut.
  if (isMobile) await expect(page.getByTestId('jobs-sticky')).toHaveCount(0)
  await row(page, A).getByTestId('jobs-row-check').uncheck()
  await expect.poll(() => selected(page)).toEqual([C])

  await page.getByTestId('jobs-select-all').check()
  await expect.poll(() => selected(page)).toEqual(['parts', A, B, C].sort())
  await page.getByTestId('jobs-select-all').uncheck()
  await expect.poll(() => selected(page)).toEqual([])
})

test('the toolbar: New folder always; Move to, Download and Delete only while something is selected', async ({ page, open, isMobile }) => {
  await withFiles(page)
  await openSortedByName(page, open)
  const bar = page.getByTestId('jobs-toolbar')
  await expect(bar.getByRole('button', { name: 'New folder' })).toBeVisible()
  for (const tid of ['jobs-sel-count', 'jobs-sel-move', 'jobs-sel-download', 'jobs-sel-delete']) await expect(page.getByTestId(tid)).toHaveCount(0)
  await expect(page.getByText('0 selected')).toHaveCount(0)
  const headTop = async () => (await page.getByTestId('jobs-head').boundingBox())?.y

  const before = await headTop()
  await row(page, A).getByTestId('jobs-row-check').check()
  await expect(page.getByTestId('jobs-sel-count')).toContainText('1 selected')
  // On a desktop the toolbar grows in place: picking never moves the list.
  if (!isMobile) expect(await headTop()).toBe(before)
  await expect(bar.getByRole('button', { name: 'Move to' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Download' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Delete' })).toBeVisible()

  // A folder can be moved and deleted, not downloaded.
  await row(page, A).getByTestId('jobs-row-check').uncheck()
  await row(page, 'parts').getByTestId('jobs-row-check').check()
  await expect(page.getByTestId('jobs-sel-download')).toHaveCount(0)
  await expect(page.getByTestId('jobs-sel-move')).toBeVisible()

  // The count clears the selection, and the actions go.
  await page.getByTestId('jobs-sel-count').click()
  for (const tid of ['jobs-sel-count', 'jobs-sel-move', 'jobs-sel-download', 'jobs-sel-delete']) await expect(page.getByTestId(tid)).toHaveCount(0)
  await expect(bar.getByRole('button', { name: 'New folder' })).toBeVisible()
})

test('each column sorts, a second click turns it round, and the arrow shows which way', async ({ page, open }) => {
  await withFiles(page)
  await open('/jobs')
  await settled(page, 4)
  const cases: Array<[string, string, string[], string[]]> = [
    ['name', 'Name', [A, B, C], [C, B, A]],
    ['material', 'Material', [C, B, A], [A, B, C]],
    ['longest', 'Time', [B, A, C], [C, A, B]],
    ['size', 'Size', [A, C, B], [B, C, A]],
    ['printed', 'Last printed', [B, A, C], [A, B, C]]
  ]
  for (const [col, label, first, second] of cases) {
    const head = page.getByTestId(`jobs-col-${col}`)
    await expect(head).toContainText(label)
    await head.click()
    await expect(head).toHaveAttribute('aria-pressed', 'true')
    await expect(head.locator('.jobs__arrow')).toBeVisible()
    const firstWay = await head.getAttribute('data-sort')
    await expect.poll(async () => (await order(page)).slice(1), { message: `${label}, first click` }).toEqual(first)
    await head.click()
    await expect(head).toHaveAttribute('data-sort', firstWay === 'asc' ? 'desc' : 'asc')
    await expect.poll(async () => (await order(page)).slice(1), { message: `${label}, second click` }).toEqual(second)
    // The folder stays on top, and only the column sorted has an arrow.
    expect((await order(page))[0]).toBe('parts')
    await expect(page.locator('[data-tid="jobs-head"] .jobs__arrow')).toHaveCount(1)
  }
})

test('New folder asks for a name and makes it where the list is', async ({ page, open }) => {
  const printer = await withFiles(page)
  await open('/jobs')
  await settled(page, 4)
  await page.getByTestId('jobs-toolbar').getByRole('button', { name: 'New folder' }).click()
  await page.getByTestId('file-name-input').fill('Brackets')
  expect(printer.called('server.files.post_directory')).toHaveLength(0)
  await page.getByTestId('file-name-save').click()
  await expect.poll(() => printer.called('server.files.post_directory')).toEqual([{ path: 'gcodes/Brackets' }])
})

test('Move to puts the selection in the folder picked', async ({ page, open }) => {
  const printer = await withFiles(page)
  await openSortedByName(page, open)
  await row(page, A).getByTestId('jobs-row-check').check()
  await row(page, C).getByTestId('jobs-row-check').check()
  await page.getByTestId('jobs-sel-move').click()
  const dialog = page.getByTestId('jobs-move-dialog')
  await expect(dialog).toContainText('Move 2 items to')
  expect(printer.called('server.files.move')).toHaveLength(0)
  await dialog.getByRole('button', { name: 'gcodes/parts/' }).click()
  await expect.poll(() => printer.called('server.files.move')).toEqual([
    { source: `gcodes/${A}`, dest: `gcodes/parts/${A}` },
    { source: `gcodes/${C}`, dest: `gcodes/parts/${C}` }
  ])
  await expect(page.getByTestId('jobs-sel-count')).toHaveCount(0)
})

test('the file printing, or a folder holding it, cannot be moved or deleted', async ({ page, open }) => {
  const rpc: string[] = []
  page.on('websocket', ws => ws.on('framesent', f => { try { const m = JSON.parse(String(f.payload)); if (m.method) rpc.push(m.method) } catch {} }))
  await open('/jobs')
  await settled(page, 5)
  const printing = page.locator('[data-tid="jobs-row"][data-key="M1_bracket_PLA_0.2mm.gcode"]')
  await printing.getByTestId('jobs-row-check').check()
  await expect(page.getByTestId('jobs-sel-count')).toContainText('1 selected')
  await expect(page.getByTestId('jobs-sel-move')).toHaveCount(0)
  await expect(page.getByTestId('jobs-sel-delete')).toHaveCount(0)
  await expect(page.getByTestId('jobs-toolbar')).toContainText('is printing, so it stays')

  // With others: they move, it stays.
  await page.getByTestId('jobs-select-all').check()
  await page.getByTestId('jobs-sel-move').click()
  await expect(page.getByTestId('jobs-move-dialog')).toContainText('Move 4 items to')
  await page.getByTestId('jobs-move-dialog').getByRole('button', { name: 'Cancel' }).click()
  expect(rpc.filter(m => m === 'server.files.move')).toHaveLength(0)
})

test('Delete in the toolbar asks first: Cancel sends nothing, Delete removes them', async ({ page, open }) => {
  const printer = await withFiles(page)
  await openSortedByName(page, open)
  await row(page, A).getByTestId('jobs-row-check').check()
  await row(page, B).getByTestId('jobs-row-check').check()
  await page.getByTestId('jobs-sel-delete').click()
  await expect(page.getByTestId('confirm')).toContainText('Delete 2 files?')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(printer.called('server.files.delete_file')).toHaveLength(0)
  await expect(page.getByTestId('jobs-sel-count')).toContainText('2 selected')

  await page.getByTestId('jobs-sel-delete').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.called('server.files.delete_file').map(p => p.path).sort()).toEqual([`gcodes/${A}`, `gcodes/${B}`])
})

test('folders open, and the breadcrumbs go back up', async ({ page, open, isMobile }) => {
  await withFiles(page)
  await open('/jobs')
  await settled(page, 4)
  if (isMobile) await row(page, 'parts').click()
  else await row(page, 'parts').dblclick()
  await expect(page.getByRole('navigation', { name: 'Folder' })).toContainText('parts')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page)).toContainText(/delta gear/i)
  await page.getByTestId('jobs-crumb').filter({ hasText: 'gcodes' }).click()
  await expect(rows(page)).toHaveCount(4)
})

test('no files: the list says so and offers Upload', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answers['server.files.get_directory'] = (params: any) => listing(String(params.path ?? 'gcodes'), [])
  await open('/jobs')
  await expect(page.getByTestId('jobs-empty')).toContainText('No G-code on the printer yet')
  await expect(page.getByTestId('jobs-empty-upload')).toBeVisible()
  await expect(page.getByTestId('jobs-sel-count')).toHaveCount(0)
})

test('the listing fails: the list says why, and Try again brings the files', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.failOn['server.files.get_directory'] = 'The SD card is not mounted'
  await open('/jobs')
  await expect(page.getByTestId('jobs-error')).toContainText('Couldn\'t load the files')
  await expect(page.getByTestId('jobs-error')).toContainText('The SD card is not mounted')
  delete printer.state.failOn['server.files.get_directory']
  await page.getByTestId('jobs-retry').click()
  await expect(page.getByTestId('jobs-error')).toHaveCount(0)
  await expect(rows(page)).toHaveCount(5)
})

test('offline: Jobs says it is connecting and lists nothing, and the files come back with the printer', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await printer.offline()
  await open('/jobs')
  await expect(page.getByText('Connecting to Boxwood')).toBeVisible({ timeout: 30_000 })
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByTestId('jobs-sel-delete')).toHaveCount(0)
  printer.online()
  await page.getByTestId('connection-try-again').click()
  await settled(page, 5)
})
