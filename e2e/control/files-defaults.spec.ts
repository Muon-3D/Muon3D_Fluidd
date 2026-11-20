import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

async function defaults (page: Page, options: { printing?: boolean, enabled?: boolean, empty?: boolean, failRead?: boolean } = {}) {
  const status = PRESETS.idleHomed()
  if (options.printing) {
    Object.assign(status, { print_stats: { state: 'printing', filename: 'demo.gcode' }, idle_timeout: { state: 'Printing' }, virtual_sdcard: { is_active: true, progress: 0.2 } })
  }
  const printer = await usePrinter(page, status)
  const original = options.empty ? '' : '# Muon3D default\n'
  let reset = false
  const seen: string[] = []
  const entry = (path: string, size: number) => ({ path, modified: 1, size, permissions: 'rw' })
  const originals = [entry('changed.cfg', original.length), entry('same.cfg', 5), entry('macros/start.cfg', 4)]
  const mine = () => [entry('changed.cfg', reset ? original.length : original.length + 10), entry('same.cfg', 5), entry('yours.cfg', 3), entry('macros/start.cfg', 8)]
  printer.state.results['server.info'] = { registered_directories: ['config', 'calibration', 'defaults', 'logs', 'gcodes', 'docs'] }
  printer.state.answers['server.files.list'] = (params: Record<string, unknown>) => params.root === 'config' ? mine() : params.root === 'defaults' ? originals : []
  printer.state.answers['server.files.get_directory'] = (params: Record<string, unknown>) => {
    const root = String(params.path).split('/')[0]
    const entries = root === 'config' ? mine() : root === 'defaults' ? originals : []
    return {
      dirs: root === 'config' ? [{ dirname: 'macros', modified: 1, size: 0, permissions: 'rw' }] : [],
      files: entries.filter(f => !f.path.includes('/')).map(({ path, ...f }) => ({ filename: path, ...f })),
      disk_usage: { total: 1e9, used: 1e8, free: 9e8 }, root_info: { name: root, permissions: 'rw' }
    }
  }
  printer.state.answers['printer.firmware_restart'] = 'ok'
  await page.route('**/server/aux/dev_mode*', route => route.fulfill({ json: { enabled: options.enabled !== false, guard_armed: false } }))
  await page.route('**/server/files/**', route => {
    const request = route.request()
    if (request.method() === 'POST' && request.url().endsWith('/upload')) {
      seen.push(request.postData() ?? '')
      reset = true
      return route.fulfill({ json: { item: { path: 'changed.cfg', root: 'config' }, action: 'modify_file' } })
    }
    if (request.method() === 'GET') {
      const isDefault = request.url().includes('/defaults/')
      if (isDefault && options.failRead) return route.fulfill({ status: 500, body: 'Cannot read the default' })
      return route.fulfill({ contentType: 'text/plain', body: isDefault || reset ? original : '# edited configuration\n' })
    }
    return route.fallback()
  })
  return { printer, seen, original }
}

async function chooseConfig (page: Page) {
  const config = page.getByTestId('files-config')
  await config.getByRole('radio', { name: 'config', exact: true }).click()
  await expect(config.getByRole('row', { name: /changed\.cfg/ }).getByTestId('files-default-status')).toHaveText('changed')
  return config
}

test('compares the current configuration and resets only after confirmation, then asks before restarting', async ({ page, open }) => {
  const { printer, seen, original } = await defaults(page)
  await open('/configure')
  const config = await chooseConfig(page)
  await expect(config.getByRole('row', { name: /macros/ }).getByTestId('files-default-status')).toHaveText('changed')
  await expect(config.getByRole('row', { name: /yours\.cfg/ }).getByTestId('files-default-status')).toHaveText('yours')
  await expect(config.getByRole('row', { name: /same\.cfg/ }).getByTestId('files-default-status')).toHaveCount(0)
  await config.getByText('changed.cfg', { exact: true }).click()
  await expect(page.locator('.monaco-editor, textarea').first()).toBeVisible()
  await page.getByTestId('files-reset-default').click()
  await page.getByTestId('confirm-cancel').last().click()
  expect(seen).toEqual([])
  await page.getByTestId('files-reset-default').click()
  await page.getByTestId('confirm-ok').last().click()
  await expect.poll(() => seen.length).toBe(1)
  expect(seen[0]).toContain(original)
  await expect(page.getByText('Restart Klipper now?', { exact: true })).toBeVisible()
  expect(printer.called('printer.firmware_restart')).toEqual([])
  await page.getByTestId('confirm-ok').last().click()
  await expect.poll(() => printer.called('printer.firmware_restart').length).toBe(1)
})

test('an empty default is saved during a print without offering or sending a restart', async ({ page, open }) => {
  const { printer, seen } = await defaults(page, { printing: true, empty: true })
  await open('/configure')
  const config = await chooseConfig(page)
  await config.getByText('changed.cfg', { exact: true }).click()
  await expect(page.locator('.monaco-editor, textarea').first()).toBeVisible()
  await page.getByTestId('files-reset-default').click()
  await page.getByTestId('confirm-ok').last().click()
  await expect.poll(() => seen.length).toBe(1)
  expect(seen[0]).not.toContain('# edited configuration')
  await expect(page.getByTestId('files-reset-default')).toHaveCount(0)
  await expect(page.getByText('Restart Klipper now?', { exact: true })).toHaveCount(0)
  expect(printer.called('printer.firmware_restart')).toEqual([])
  await expect(page.getByTestId('files-unsaved')).toHaveCount(0)
})

test('a failed default read never uploads or restarts and is explained in the editor', async ({ page, open }) => {
  const { printer, seen } = await defaults(page, { failRead: true })
  await open('/configure')
  const config = await chooseConfig(page)
  await config.getByText('changed.cfg', { exact: true }).click()
  await expect(page.locator('.monaco-editor, textarea').first()).toBeVisible()
  await page.getByTestId('files-reset-default').click()
  await page.getByTestId('confirm-ok').last().click()
  await expect(page.getByTestId('files-default-error').last()).toContainText('Could not complete')
  expect(seen).toEqual([])
  expect(printer.called('printer.firmware_restart')).toEqual([])
})

test('personal files have no reset and Developer mode off has no configuration-copy control', async ({ page, open }) => {
  await defaults(page)
  await open('/configure')
  const config = await chooseConfig(page)
  await config.getByText('yours.cfg', { exact: true }).click()
  await expect(page.getByTestId('files-editor-default-status')).toContainText('no default')
  await expect(page.getByTestId('files-reset-default')).toHaveCount(0)
  await page.getByTestId('files-close').click()
  await page.route('**/server/aux/dev_mode*', route => route.fulfill({ json: { enabled: false, guard_armed: false } }))
  await page.reload()
  await expect(page.getByTestId('files-config')).toBeVisible()
  await expect(page.getByTestId('files-config').getByRole('radio', { name: 'config', exact: true })).toHaveCount(0)
  await expect(page.getByTestId('files-reset-default')).toHaveCount(0)
})
