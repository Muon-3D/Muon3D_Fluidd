/**
 * Settings › Macros: one list, each category a section and Uncategorised
 * the last. Selection follows File Explorer, a double-click (or Enter) opens
 * a macro's sheet, and macros move to another section by dragging or by
 * Move to…; moves are saved to Moonraker's database and kept after a reload.
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

/** Developer mode on (the mock's M1 has it off), so Edit in Files opens. */
async function developerMode (page: Page) {
  await page.route(new RegExp(`:${MOCK_PORT}/server/aux/dev_mode`), route => route.fulfill({ json: { enabled: true, guard_armed: false } }))
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
  await expect(section(page, FILAMENT.id)).toContainText('Drag a command here')
  await expect(panel.getByRole('button', { name: /^Read$/ })).toHaveCount(0)
  await expect(page.getByTestId('macro-edit-list')).toHaveCount(0)
  // The categories' controls are in the panel.
  await expect(panel.getByTestId('macro-add-category')).toBeVisible()
})

test('a click selects; a double-click opens a sheet with the code read-only, and Edit in Files opens at its line', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await developerMode(page)
  await openMacros(page, open)
  const load = row(page, 'load_filament')
  await expect(load).toContainText('macros.cfg:1')
  await expect(page.getByTestId('macro-selected-count')).toHaveCount(0)
  await load.click()
  await expect(load).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('macro-selected-count')).toHaveText('1 selected')
  await load.dblclick()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('LOAD_FILAMENT · macros.cfg line 1')
  for (const label of ['Name in Control', 'Section', 'Colour', 'Shown', 'Not while printing', 'What it does']) {
    await expect(sheet).toContainText(label)
  }
  await expect(page).toHaveURL(/\/settings/)
  await sheet.getByTestId('macro-sheet-edit').click()
  await expect(page).toHaveURL(/\/configure\?.*open=config%2Fmacros\.cfg.*line=1/)
})

test('on a Muon printer without developer mode, Edit in Files is locked and says why', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await expect(page.getByTestId('macro-edit-readonly')).toBeVisible()
  await row(page, 'load_filament').dblclick()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByTestId('macro-sheet-edit')).toBeDisabled()
  await expect(sheet.getByTestId('macro-sheet-lock')).toContainText('needs developer mode')
  await expect(sheet.getByRole('link', { name: 'Developer mode' })).toBeVisible()
})

test('Enter opens the selected macro\'s sheet; one not in the config files has Edit in Files locked, with the reason', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await developerMode(page)
  await openMacros(page, open)
  await row(page, 'clean_nozzle').click()
  await page.keyboard.press('Enter')
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('CLEAN_NOZZLE')
  await expect(sheet.getByTestId('macro-sheet-edit')).toBeDisabled()
  await expect(sheet.getByTestId('macro-sheet-lock')).toContainText("wasn't found")
})

test('Ctrl and Shift select several, the toolbar hides them all, and clicking empty space clears', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const names = await section(page, '0').locator('[data-tid^="macro-row-"]').evaluateAll(rows => rows.map(r => r.getAttribute('data-tid')!.slice('macro-row-'.length)))
  expect(names.length).toBeGreaterThanOrEqual(3)
  await row(page, names[0]).click()
  await row(page, names[2]).click({ modifiers: ['Shift'] })
  await expect(page.getByTestId('macro-selected-count')).toHaveText('3 selected')
  await row(page, names[1]).click({ modifiers: ['ControlOrMeta'] })
  await expect(page.getByTestId('macro-selected-count')).toHaveText('2 selected')
  await page.getByTestId('macro-toolbar-hide').click()
  await expect.poll(() => stored(printer).filter(m => [names[0], names[2]].includes(m.name)).map(m => m.visible)).toEqual([false, false])
  await page.getByTestId('macro-toolbar-done').click()
  await expect(page.getByTestId('macro-selected-count')).toHaveCount(0)
})

test('clicking any empty space in the panel clears the selection, and Ctrl+A selects every macro', async ({ page, open }) => {
  await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const count = page.getByTestId('macro-selected-count')
  const first = page.locator('[data-tid^="macro-row-"]').first()
  await first.click()
  await page.keyboard.press('ControlOrMeta+a')
  const all = await page.locator('[role="option"]').count()
  await expect(count).toHaveText(`${all} selected`)
  // The panel's own padding, a section's heading row, the gap beside a row and the text under the title.
  const empty = [page.getByTestId('macro-panel'), page.locator('[data-tid^="macro-section-head-"]').first(), page.locator('[role="listbox"]').first(), page.getByTestId('macro-panel').getByRole('heading', { name: 'Quick commands' })]
  for (const target of empty) {
    await first.click()
    await expect(count).toHaveText('1 selected')
    // A click whose target is the element itself is a click on its own padding; a toast may cover its corner on screen.
    await target.dispatchEvent('click')
    await expect(count).toHaveCount(0)
  }
})

test('the checkboxes select without a keyboard, and the toolbar\'s Move to… moves them all', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  await page.getByTestId('macro-check-load_filament').click()
  await page.getByTestId('macro-check-clean_nozzle').click()
  await expect(page.getByTestId('macro-selected-count')).toHaveText('2 selected')
  await page.getByTestId('macro-toolbar-move').click()
  await expect(page.getByRole('dialog')).toContainText('Move 2 commands to')
  await page.getByTestId(`macro-move-to-${FILAMENT.id}`).click()
  await expect(section(page, FILAMENT.id).getByTestId('macro-row-load_filament')).toBeVisible()
  await expect(section(page, FILAMENT.id).getByTestId('macro-row-clean_nozzle')).toBeVisible()
  await expect.poll(() => stored(printer).filter(m => ['load_filament', 'clean_nozzle'].includes(m.name)).map(m => m.categoryId)).toEqual([FILAMENT.id, FILAMENT.id])
})

test('a section is dragged by its header to a new place, and that order is saved', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  printer.database.fluidd = { macros: { categories: [FILAMENT, { id: 'cal-1', name: 'Calibration' }], stored: [], expanded: [] } }
  await configFiles(page)
  await openMacros(page, open)
  const order = () => page.getByTestId('macro-panel').locator('[data-section]').evaluateAll(s => s.map(e => e.getAttribute('data-section')))
  await expect.poll(order).toEqual(['Calibration', 'Filament', expect.stringMatching(/Uncategori[sz]ed/)])
  await page.getByTestId(`macro-section-head-${FILAMENT.id}`).dragTo(page.getByTestId('macro-section-head-cal-1'))
  await expect.poll(order).toEqual(['Filament', 'Calibration', expect.stringMatching(/Uncategori[sz]ed/)])
  await expect.poll(() => (printer.database.fluidd?.macros?.categories ?? []).map((c: { id: string, order?: number }) => [c.id, c.order]))
    .toEqual([[FILAMENT.id, 0], ['cal-1', 1]])
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
  await page.getByRole('searchbox', { name: 'Find a quick command' }).fill('filament')
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
  await expect(page.getByTestId('macro-panel-empty')).toContainText('no quick commands yet')
  await expect(page.getByTestId('macro-panel').locator('[role="option"]')).toHaveCount(0)
  await expect(section(page, '0')).toBeVisible()
  expect(printer.called('server.database.post_item').filter(p => p.key === 'macros.stored')).toEqual([])
})

test('offline: with the printer gone the panel keeps its last view, says so, and nothing can be moved or saved', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  await configFiles(page)
  await openMacros(page, open)
  const writes = printer.called('server.database.post_item').length
  await printer.offline()
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

test('macros starting with _ are listed locked under Uncategorised, and can\'t be shown', async ({ page, open }) => {
  const printer = await macrosPrinter(page)
  printer.state.status['gcode_macro _PROBE_HELPER'] = {}
  await configFiles(page)
  await openMacros(page, open)
  const hidden = section(page, '0').getByTestId('macro-hidden-_PROBE_HELPER')
  await expect(hidden).toContainText("can't be shown")
  await expect(hidden.getByRole('switch')).toHaveCount(0)
  await expect(row(page, '_probe_helper')).toHaveCount(0)
})
