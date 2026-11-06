/**
 * Files: Config files beside Other files, each a tile with its folders as a
 * segment, filter / New / Upload / Refresh, a bulk bar, and the editor as a
 * sheet over the page. A phone shows one tile, chosen in the page header.
 * Moonraker's directory listings are answered per test by usePrinter, so the
 * shared mock is untouched; every RPC the page sends is asserted.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

const NOW = Date.now() / 1000
const file = (filename: string, size = 2048) => ({ filename, modified: NOW - 3600, size, permissions: 'rw' })
const dir = (dirname: string) => ({ dirname, modified: NOW - 86400, size: 0, permissions: 'rw' })

const LISTINGS: Record<string, { dirs: unknown[], files: unknown[] }> = {
  calibration: { dirs: [dir('backups')], files: [file('printer.cfg', 12_400), file('macros.cfg', 6100), file('probe.cfg')] },
  defaults: { dirs: [], files: [file('m1.cfg')] },
  config: { dirs: [], files: [file('moonraker.conf')] },
  logs: { dirs: [], files: [file('klippy.log', 4_200_000), file('moonraker.log', 1_800_000)] },
  docs: { dirs: [], files: [file('README.md')] },
  config_examples: { dirs: [], files: [file('example.cfg')] }
}

async function files (page: Page, options: { devMode?: boolean } = {}): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answers['server.files.get_directory'] = (params: Record<string, any>) => {
    const root = String(params.path).split('/')[0]
    return {
      ...(LISTINGS[root] ?? { dirs: [], files: [] }),
      disk_usage: { total: 29e9, used: 6e9, free: 23e9 },
      root_info: { name: root, permissions: 'rw' }
    }
  }
  // The mock registers config, logs, gcodes, config_examples and docs; MuonOS adds these.
  printer.state.results['server.info'] = { registered_directories: ['config', 'calibration', 'defaults', 'logs', 'gcodes', 'config_examples', 'docs'] }
  await page.route('**/server/aux/dev_mode*', route => route.fulfill({ json: { enabled: !!options.devMode, guard_armed: false } }))
  await page.route('**/server/files/**', route => {
    const request = route.request()
    if (request.method() === 'GET') return route.fulfill({ body: '[include macros.cfg]\n[bed_mesh]\nmesh_min: 10, 7\n', contentType: 'text/plain' })
    return route.fallback()
  })
  return printer
}

/** A phone shows one tile at a time: the header segment picks the other one. */
async function showOther (page: Page, isMobile: boolean) {
  if (isMobile) await page.getByTestId('files-actions').getByRole('radio', { name: 'Other files' }).click()
}

/** The editor holds the file: Monaco on a desktop, a plain text box on a phone. */
async function editorOpen (page: Page) {
  await expect(page.locator('.monaco-editor, textarea').first()).toBeVisible({ timeout: 30_000 })
}

const config = (page: Page) => page.getByTestId('files-config')
const other = (page: Page) => page.getByTestId('files-other')

test('the header says what the page is for; Config files and Other files are two tiles', async ({ page, open, isMobile }) => {
  await files(page)
  await open('/configure')
  await expect(page.getByTestId('page-title')).toHaveText('Files')
  await expect(page.locator('.app-page-header__subtitle')).toContainText('config and other files')
  if (isMobile) {
    await expect(other(page)).toBeHidden()
    await expect(page.getByTestId('files-actions').getByRole('radio', { name: 'Config files' })).toBeChecked()
  } else {
    await expect(config(page)).toBeVisible()
    await expect(other(page)).toBeVisible()
    await expect(page.getByTestId('files-actions')).toHaveCount(0)
  }
})

test('on a phone the header segment switches between the two lists', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'a phone shows one tile at a time')
  await files(page)
  await open('/configure')
  await expect(config(page).getByText('printer.cfg')).toBeVisible()
  await page.getByTestId('files-actions').getByRole('radio', { name: 'Other files' }).click()
  await expect(config(page)).toBeHidden()
  await expect(other(page).getByText('klippy.log')).toBeVisible()
  await page.getByTestId('files-actions').getByRole('radio', { name: 'Config files' }).click()
  await expect(config(page)).toBeVisible()
})

test('config shows calibration and defaults, and the whole config only in Developer mode', async ({ page, open }) => {
  await files(page)
  await open('/configure')
  const roots = config(page).getByRole('radiogroup', { name: 'Config folder' })
  await expect(roots.getByRole('radio')).toHaveText(['calibration', 'defaults'])
  await expect(config(page).getByTestId('files-dev-mode')).toHaveText('config is shown in Developer mode')
})

test('Developer mode adds the config folder, first', async ({ page, open }) => {
  await files(page, { devMode: true })
  await open('/configure')
  const roots = config(page).getByRole('radiogroup', { name: 'Config folder' })
  await expect(roots.getByRole('radio')).toHaveText(['config', 'calibration', 'defaults'])
  await expect(config(page).getByTestId('files-dev-mode')).toContainText('Developer mode is on')
})

test('other files lists logs, docs and every other registered folder', async ({ page, open, isMobile }) => {
  const printer = await files(page)
  await open('/configure')
  await showOther(page, isMobile)
  const roots = other(page).getByRole('radiogroup', { name: 'Other folder' })
  await expect(roots.getByRole('radio')).toHaveText(['logs', 'docs', 'config_examples'])
  await expect(other(page).getByText('klippy.log')).toBeVisible()
  await roots.getByRole('radio', { name: 'docs' }).click()
  await expect(other(page).getByText('README.md')).toBeVisible()
  expect(printer.called('server.files.get_directory').map(p => p.path)).toEqual(expect.arrayContaining(['calibration', 'logs', 'docs']))
})

test('a folder lists its files with size, and a folder row you can open', async ({ page, open }) => {
  await files(page)
  await open('/configure')
  const tile = config(page)
  await expect(tile.getByText('printer.cfg')).toBeVisible()
  await expect(tile.getByText('backups')).toBeVisible()
  await expect(tile.getByText('12.1 kB')).toBeVisible()
  await expect(tile.getByTestId('files-crumbs')).toContainText('calibration')
})

test('the filter narrows the list; Refresh asks the printer again', async ({ page, open }) => {
  const printer = await files(page)
  await open('/configure')
  const tile = config(page)
  await tile.getByTestId('files-filter').fill('probe')
  await expect(tile.getByText('probe.cfg')).toBeVisible()
  await expect(tile.getByText('macros.cfg')).toHaveCount(0)
  const before = printer.called('server.files.get_directory').length
  await tile.getByTestId('files-refresh').click()
  await expect.poll(() => printer.called('server.files.get_directory').length).toBeGreaterThan(before)
})

test('a read-only folder has no New or Upload', async ({ page, open, isMobile }) => {
  await files(page)
  await open('/configure')
  await expect(config(page).getByRole('button', { name: 'Add' })).toBeVisible()
  await showOther(page, isMobile)
  await expect(other(page).getByTestId('files-refresh')).toBeVisible()
  await expect(other(page).getByRole('button', { name: 'Add' })).toHaveCount(0)
})

test('New folder asks for a name and sends it to the printer', async ({ page, open }) => {
  const printer = await files(page)
  await open('/configure')
  await config(page).getByRole('button', { name: 'Add' }).click()
  await page.getByRole('menuitem', { name: /Add Directory/i }).click()
  await page.getByRole('textbox').last().fill('spare')
  await page.getByRole('button', { name: /^(Save|Create|OK)$/i }).click()
  await expect.poll(() => printer.called('server.files.post_directory').map(p => p.path)).toEqual(['calibration/spare'])
})

test('a file opens in the editor sheet with its contents, and closes', async ({ page, open }) => {
  await files(page)
  await open('/configure')
  await config(page).getByText('printer.cfg').click()
  const title = page.getByTestId('files-editor-title')
  await expect(title).toContainText('printer.cfg')
  await editorOpen(page)
  await page.getByTestId('files-close').click()
  await expect(title).toHaveCount(0)
  await expect(config(page)).toBeVisible()
})

test('Save sends the file back to the printer', async ({ page, open }) => {
  await files(page)
  let upload = ''
  await page.route('**/server/files/upload', route => {
    upload = route.request().postData() ?? ''
    return route.fulfill({ json: { item: { path: 'printer.cfg', root: 'calibration' }, action: 'create_file' } })
  })
  await open('/configure')
  await config(page).getByText('printer.cfg').click()
  await editorOpen(page)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect.poll(() => upload).toContain('printer.cfg')
  expect(upload).toContain('mesh_min')
  expect(upload).toContain('calibration')
})

test('defaults are read only: no Save in the editor', async ({ page, open }) => {
  await files(page)
  await open('/configure')
  await config(page).getByRole('radio', { name: 'defaults' }).click()
  await config(page).getByText('m1.cfg').click()
  await expect(page.getByTestId('files-editor-title')).toContainText('m1.cfg')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0)
})

test('?open= opens that file in the editor (a macro Edit)', async ({ page, open }) => {
  await files(page)
  await open('/configure?open=calibration/macros.cfg&line=2')
  await expect(page.getByTestId('files-editor-title')).toContainText('macros.cfg')
  await editorOpen(page)
})

test('ticking files shows the bulk bar; Delete asks, then deletes each', async ({ page, open }) => {
  const printer = await files(page)
  await open('/configure')
  const tile = config(page)
  await tile.getByRole('row', { name: /macros\.cfg/ }).locator('.v-simple-checkbox').click()
  await tile.getByRole('row', { name: /probe\.cfg/ }).locator('.v-simple-checkbox').click()
  await expect(tile.getByTestId('files-selected')).toHaveText('2 selected')
  await expect(tile.getByTestId('files-bulk-download')).toBeVisible()
  await tile.getByTestId('files-bulk-delete').click()
  await page.getByTestId('confirm-cancel').last().click()
  expect(printer.called('server.files.delete_file')).toEqual([])
  await tile.getByTestId('files-bulk-delete').click()
  await page.getByTestId('confirm-ok').last().click()
  await expect.poll(() => printer.called('server.files.delete_file').map(p => p.path).sort())
    .toEqual(['calibration/macros.cfg', 'calibration/probe.cfg'])
})

test('Clear drops the selection and the bar', async ({ page, open }) => {
  await files(page)
  await open('/configure')
  const tile = config(page)
  await tile.getByRole('row', { name: /macros\.cfg/ }).locator('.v-simple-checkbox').click()
  await tile.getByTestId('files-clear-selection').click()
  await expect(tile.getByTestId('files-bulk')).toHaveCount(0)
})
