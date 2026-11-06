/**
 * Settings › Macros: one panel, each category a section and Uncategorised
 * the last. A click chooses a macro, a double-click (or Enter) opens it, and
 * it moves to another section by dragging or by its Move to…; the move is
 * saved to Moonraker's database and is there after a reload.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { PRESETS, usePrinter, type PrinterHandle } from './printer'

const MACROS_CFG = '[gcode_macro LOAD_FILAMENT]\ngcode:\n  G1 E50 F300\n\n[gcode_macro PURGE_LINE]\ngcode:\n  G1 X10\n'
const FILAMENT = { id: 'filament-1', name: 'Filament' }

/** The printer's config folder: one macros.cfg, holding LOAD_FILAMENT at line 1. */
async function configFiles (page: Page, fail = false) {
  await page.route(new RegExp(`:${MOCK_PORT}/server/files/list\\?root=config`), route => fail
    ? route.fulfill({ status: 500, json: { error: { code: 500, message: 'no' } } })
    : route.fulfill({ json: { result: [{ path: 'macros.cfg', size: MACROS_CFG.length, modified: 1 }] } }))
  await page.route(new RegExp(`:${MOCK_PORT}/server/files/config/macros\\.cfg`), route => route.fulfill({ body: MACROS_CFG, contentType: 'text/plain' }))
}

/** A printer with a Filament category, its macros database this test's own. */
async function macrosPrinter (page: Page): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  printer.database.fluidd = { macros: { categories: [FILAMENT], stored: [], expanded: [] } }
  return printer
}

async function openMacros (page: Page, open: (path: string) => Promise<void>) {
  await open('/settings#macros')
  await expect(page.getByTestId('macro-panel')).toBeVisible()
}

const section = (page: Page, id: string) => page.getByTestId(`macro-section-${id}`)
const row = (page: Page, name: string) => page.getByTestId(`macro-row-${name}`)

/** The macros last saved to Moonraker, by name. */
function stored (printer: PrinterHandle): Array<Record<string, any>> {
  const writes = printer.called('server.database.post_item').filter(p => p.namespace === 'fluidd' && p.key === 'macros.stored')
  return (writes.at(-1)?.value ?? []) as Array<Record<string, any>>
}

test('one panel: each category a section, Uncategorised a section in it, and no Read or Edit button', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const panel = page.getByTestId('macro-panel')
  await expect(panel.locator('[data-section]')).toHaveCount(2)
  await expect(section(page, FILAMENT.id)).toHaveAttribute('data-section', 'Filament')
  await expect(section(page, '0')).toHaveAttribute('data-section', /Uncategori[sz]ed/)
  await expect(section(page, '0').getByTestId('macro-row-load_filament')).toBeVisible()
  await expect(section(page, FILAMENT.id)).toContainText('Drag a macro here')
  await expect(panel.getByRole('button', { name: /^(Read|Edit)$/ })).toHaveCount(0)
  await expect(page.getByTestId('macro-edit-list')).toHaveCount(0)
  // The categories' controls are in the panel.
  await expect(panel.getByTestId('macro-add-category')).toBeVisible()
})

test('a click chooses a macro; a double-click opens it in the editor at its line', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const load = row(page, 'load_filament')
  await expect(load).toContainText('macros.cfg:1')
  await load.click()
  await expect(load).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/\/settings/)
  await load.dblclick()
  await expect(page).toHaveURL(/\/configure\?.*open=config%2Fmacros\.cfg.*line=1/)
})

test('Enter opens the chosen macro; one not in the config files opens its details', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await row(page, 'clean_nozzle').click()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('CLEAN_NOZZLE')
  await page.keyboard.press('Escape')
  await row(page, 'load_filament').click()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/configure\?.*line=1/)
})

test('a macro dragged into a category moves there, is saved, and is still there after a reload', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await row(page, 'load_filament').dragTo(section(page, FILAMENT.id))
  await expect(section(page, FILAMENT.id).getByTestId('macro-row-load_filament')).toBeVisible()
  await expect(section(page, '0').getByTestId('macro-row-load_filament')).toHaveCount(0)
  await expect.poll(() => stored(printer).find(m => m.name === 'load_filament')?.categoryId).toBe(FILAMENT.id)

  await page.reload()
  await expect(page.getByTestId('macro-panel')).toBeVisible({ timeout: 60_000 })
  await expect(section(page, FILAMENT.id).getByTestId('macro-row-load_filament')).toBeVisible()
})

test('Move to… moves a macro without dragging, and saves it', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await page.getByTestId('macro-menu-print_start').click()
  await page.getByTestId('macro-move').click()
  await expect(page.getByTestId('macro-move-to-0')).toHaveAttribute('aria-disabled', 'true')
  await page.getByTestId(`macro-move-to-${FILAMENT.id}`).click()
  await expect(section(page, FILAMENT.id).getByTestId('macro-row-print_start')).toBeVisible()
  await expect.poll(() => stored(printer).find(m => m.name === 'print_start')?.categoryId).toBe(FILAMENT.id)

  // And back again, to Uncategorised.
  await page.getByTestId('macro-menu-print_start').click()
  await page.getByTestId('macro-move').click()
  await page.getByTestId('macro-move-to-0').click()
  await expect(section(page, '0').getByTestId('macro-row-print_start')).toBeVisible()
  await expect.poll(() => stored(printer).find(m => m.name === 'print_start')?.categoryId).toBe('0')
})

test('hiding a macro from the dashboard is saved, and counted in its section', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const count = page.getByTestId('macro-section-count-0')
  await expect(count).toHaveText('8 of 8 shown')
  await page.getByRole('switch', { name: 'Show PAUSE on the dashboard' }).click({ force: true })
  await expect(count).toHaveText('7 of 8 shown')
  await expect.poll(() => stored(printer).find(m => m.name === 'pause')?.visible).toBe(false)
})

test('a category is added, renamed and removed from the panel, each saved', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await page.getByTestId('macro-add-category').click()
  await page.getByRole('dialog').locator('input').fill('Cleaning')
  await page.getByRole('dialog').getByRole('button', { name: /save/i }).click()
  await expect(page.locator('[data-section="Cleaning"]')).toBeVisible()
  await expect.poll(() => printer.called('server.database.post_item').some(p => p.key === 'macros.categories')).toBe(true)

  await page.getByTestId(`macro-section-menu-${FILAMENT.id}`).click()
  await page.getByTestId('macro-category-rename').click()
  await page.getByRole('dialog').locator('input').fill('Spools')
  await page.getByRole('dialog').getByRole('button', { name: /save/i }).click()
  await expect(section(page, FILAMENT.id)).toHaveAttribute('data-section', 'Spools')

  await page.getByTestId(`macro-section-menu-${FILAMENT.id}`).click()
  await page.getByTestId('macro-category-remove').click()
  await expect(section(page, FILAMENT.id)).toHaveCount(0)
  await expect.poll(() => (printer.database.fluidd?.macros?.categories ?? []).map((c: { name: string }) => c.name)).toEqual(['Cleaning'])
})

test('the find narrows every section', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await page.getByRole('searchbox', { name: 'Find a macro' }).fill('filament')
  await expect(section(page, '0').locator('[role="option"]')).toHaveCount(2)
  await expect(section(page, FILAMENT.id)).toContainText('None found here.')
})

test('error: the config files not listed says so in the panel, and the macros are still there to move', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page, true)
  await openMacros(page, open)
  await expect(page.getByTestId('macro-panel-error')).toContainText("didn't list its config files")
  await expect(row(page, 'load_filament')).toBeVisible()
  await expect(row(page, 'load_filament')).not.toContainText('macros.cfg')
})

const MOCK_MACROS = ['PRINT_START', 'PRINT_END', 'LOAD_FILAMENT', 'UNLOAD_FILAMENT', 'CLEAN_NOZZLE', 'PAUSE', 'RESUME', 'CANCEL_PRINT']

test('empty: a printer with no macros says so, and still shows Uncategorised', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  printer.state.without = MOCK_MACROS.map(n => `gcode_macro ${n}`)
  await configFiles(page)
  await openMacros(page, open)
  await expect(page.getByTestId('macro-panel-empty')).toContainText('no macros yet')
  await expect(page.getByTestId('macro-panel').locator('[role="option"]')).toHaveCount(0)
  await expect(section(page, '0')).toBeVisible()
  expect(printer.called('server.database.post_item').filter(p => p.key === 'macros.stored')).toEqual([])
})

test('offline: with the printer gone the panel keeps its last view, says so, and nothing can be moved or saved', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const writes = printer.called('server.database.post_item').length
  printer.disconnect()
  await expect(page.getByText('Reconnecting', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('macro-panel-offline')).toContainText("isn't connected")
  await expect(row(page, 'load_filament')).toBeVisible()
  await expect(row(page, 'load_filament')).toHaveAttribute('draggable', 'false')
  await expect(page.getByTestId('macro-add-category')).toBeDisabled()
  await expect(page.getByRole('switch', { name: 'Show PAUSE on the dashboard' })).toBeDisabled()
  await row(page, 'load_filament').dragTo(section(page, FILAMENT.id), { force: true })
  await expect(section(page, FILAMENT.id).getByTestId('macro-row-load_filament')).toHaveCount(0)
  expect(printer.called('server.database.post_item')).toHaveLength(writes)
})
