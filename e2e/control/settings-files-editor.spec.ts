/**
 * Settings › Files and editor (KAN-1994, KAN-1995): Save and restart is Ask,
 * Always or Never, the top bar's Save and restart lives here (moved from
 * General), and the editor's text is Small, Normal or Large. Each choice is
 * saved to the printer, survives a reload, and changes the editor itself.
 * The printer and its settings database are usePrinter / useDatabase's.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, useDatabase, PRESETS, type PrinterHandle } from './printer'

const NOW = Date.now() / 1000
const file = (filename: string) => ({ filename, modified: NOW - 3600, size: 2048, permissions: 'rw' })

async function setUp (page: Page) {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answers['server.files.get_directory'] = (params: Record<string, any>) => {
    const root = String(params.path).split('/')[0]
    return {
      dirs: [],
      files: root === 'calibration' ? [file('printer.cfg')] : [],
      disk_usage: { total: 29e9, used: 6e9, free: 23e9 },
      root_info: { name: root, permissions: 'rw' }
    }
  }
  printer.state.results['server.info'] = { registered_directories: ['config', 'calibration', 'defaults', 'logs', 'gcodes'] }
  printer.state.answers['printer.firmware_restart'] = () => 'ok'
  const db = await useDatabase(page, printer)
  await page.route('**/server/aux/dev_mode*', route => route.fulfill({ json: { enabled: false, guard_armed: false } }))
  await page.route('**/server/files/**', route => {
    if (route.request().method() === 'GET') return route.fulfill({ body: '[bed_mesh]\nmesh_min: 10, 7\n', contentType: 'text/plain' })
    return route.fallback()
  })
  const uploads: string[] = []
  await page.route('**/server/files/upload', route => {
    uploads.push(route.request().postData() ?? '')
    return route.fulfill({ json: { item: { path: 'printer.cfg', root: 'calibration' }, action: 'create_file' } })
  })
  return { printer, db, uploads }
}

const saves = (db: { posts: () => Array<Record<string, any>> }, key: string) => db.posts().filter(p => p.key === key).map(p => p.value)
const restarts = (printer: PrinterHandle) => printer.called('printer.firmware_restart').length
const settings = (page: Page) => page.getByTestId('editor-settings')

async function choose (page: Page, group: string, name: string) {
  await settings(page).getByTestId(group).getByRole('radio', { name, exact: true }).click()
  await expect(settings(page).getByTestId(group).getByRole('radio', { name, exact: true })).toHaveAttribute('aria-checked', 'true')
}

async function openPrinterCfg (page: Page, open: (path: string) => Promise<void>) {
  await open('/configure')
  await page.getByTestId('files-config').getByText('printer.cfg').click()
  await expect(page.locator('.monaco-editor, textarea').first()).toBeVisible({ timeout: 30_000 })
  await page.locator('.monaco-editor, textarea').first().click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('mesh_max: 190, 170')
}

test('Files and editor holds Save and restart, the top bar button and the text size; General no longer does', async ({ page, open }) => {
  await setUp(page)
  await open('/settings#general')
  await expect(page.getByTestId('general-settings')).toBeVisible()
  await expect(page.getByTestId('general-settings').getByText('Save and restart in the top bar')).toHaveCount(0)
  await open('/settings#editor')
  await page.reload()
  await expect(settings(page).getByTestId('editor-save-restart').getByRole('radio', { name: 'Ask' })).toHaveAttribute('aria-checked', 'true')
  await expect(settings(page).getByTestId('editor-text-size').getByRole('radio', { name: 'Normal' })).toHaveAttribute('aria-checked', 'true')
  await expect(settings(page).getByRole('switch', { name: 'Save and restart in the top bar' })).toBeVisible()
})

test('the top bar\'s Save and restart keeps the value saved under General', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#editor')
  const toggle = settings(page).getByRole('switch', { name: 'Save and restart in the top bar' })
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect.poll(() => saves(db, 'uiSettings.general.showSaveConfigAndRestart')).toEqual([false])
  await page.reload()
  await expect(settings(page).getByRole('switch', { name: 'Save and restart in the top bar' })).toHaveAttribute('aria-checked', 'false')
})

for (const name of ['Ask', 'Always', 'Never']) {
  test(`Save and restart: ${name} is saved and still chosen after a reload`, async ({ page, open }) => {
    const { db } = await setUp(page)
    await open('/settings#editor')
    await choose(page, 'editor-save-restart', name === 'Ask' ? 'Always' : name)
    if (name === 'Ask') await choose(page, 'editor-save-restart', 'Ask')
    await expect.poll(() => saves(db, 'uiSettings.editor.saveAndRestart').at(-1)).toBe(name.toLowerCase())
    await page.reload()
    await expect(settings(page).getByTestId('editor-save-restart').getByRole('radio', { name })).toHaveAttribute('aria-checked', 'true')
  })
}

test('Ask: Save and restart says what changes and restarts only after OK', async ({ page, open }) => {
  const { printer, uploads } = await setUp(page)
  await openPrinterCfg(page, open)
  await page.getByTestId('files-save-restart').click()
  const confirm = page.getByTestId('confirm')
  await expect(confirm.last()).toContainText('Save and restart klipper?')
  await expect(page.getByTestId('confirm-message').last()).toContainText('in printer.cfg')
  await page.getByTestId('confirm-cancel').last().click()
  expect(uploads).toHaveLength(0)
  expect(restarts(printer)).toBe(0)

  await page.getByTestId('files-save-restart').click()
  await page.getByTestId('confirm-ok').last().click()
  await expect.poll(() => uploads.length).toBe(1)
  expect(uploads[0]).toContain('mesh_max: 190, 170')
  await expect.poll(() => restarts(printer)).toBe(1)
})

test('Always: Save and restart saves and restarts with no question', async ({ page, open }) => {
  const { printer, uploads } = await setUp(page)
  await open('/settings#editor')
  await choose(page, 'editor-save-restart', 'Always')
  await openPrinterCfg(page, open)
  await page.getByTestId('files-save-restart').click()
  await expect.poll(() => uploads.length).toBe(1)
  await expect.poll(() => restarts(printer)).toBe(1)
  await expect(page.getByTestId('confirm')).toHaveCount(0)
})

test('Never: no Save and restart; Save writes the file and nothing restarts', async ({ page, open }) => {
  const { printer, uploads } = await setUp(page)
  await open('/settings#editor')
  await choose(page, 'editor-save-restart', 'Never')
  await openPrinterCfg(page, open)
  await expect(page.getByTestId('files-save-restart')).toHaveCount(0)
  await page.getByTestId('files-save').click()
  await expect.poll(() => uploads.length).toBe(1)
  await page.waitForTimeout(500)
  expect(restarts(printer)).toBe(0)
})

test('Text size: Large makes the editor\'s text bigger, and stays after a reload', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#editor')
  const preview = settings(page).getByTestId('editor-text-size-preview')
  await expect(preview).toHaveCSS('font-size', '16px')
  await choose(page, 'editor-text-size', 'Large')
  await expect(preview).toHaveCSS('font-size', '20px')
  await expect.poll(() => saves(db, 'uiSettings.editor.textSize')).toEqual(['large'])

  await page.reload()
  await expect(settings(page).getByTestId('editor-text-size').getByRole('radio', { name: 'Large' })).toHaveAttribute('aria-checked', 'true')
  await openPrinterCfg(page, open)
  const text = page.locator('.monaco-editor .view-lines, textarea').first()
  await expect(text).toHaveCSS('font-size', '20px')
})

test('Text size: Small makes the editor\'s text smaller', async ({ page, open }) => {
  await setUp(page)
  await open('/settings#editor')
  await choose(page, 'editor-text-size', 'Small')
  await openPrinterCfg(page, open)
  await expect(page.locator('.monaco-editor .view-lines, textarea').first()).toHaveCSS('font-size', '13px')
})
