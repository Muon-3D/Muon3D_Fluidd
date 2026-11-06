/**
 * The filament buttons (KAN-1700, the Control side of KAN-1699; Jack,
 * 6 Nov 2026: "Change filament" energised the motors and the contact guard
 * said the nozzle was touching the plate). On the M1, M600 is PAUSE, which
 * lifts Z and parks X/Y even with no print.
 * - Idle, Change filament sends nothing: it opens the material panel.
 * - Load and Unload send at once, as they always did; a double click sends once.
 * - Mid-print, Change filament is M600 after its confirm; two confirms send one M600.
 * - Paused, prompting, or Klipper busy (a cancelled print included): nothing is sent.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { overlay, usePrinter, PRESETS, type PrinterHandle } from './printer'

/** The M1's own M600, LOAD_FILAMENT and UNLOAD_FILAMENT (core/M1/macros/filament.cfg), as macros the page can see. */
const M1_MACROS = {
  'gcode_macro M600': {},
  'gcode_macro LOAD_FILAMENT': {},
  'gcode_macro UNLOAD_FILAMENT': {},
  configfile: {
    settings: {
      'gcode_macro m600': { gcode: 'PAUSE\nRESPOND TYPE=command MSG="action:prompt_begin Change filament"' },
      'gcode_macro load_filament': { gcode: 'FILAMENT_INSERT_FLOW {rawparams}' },
      'gcode_macro unload_filament': { gcode: '{% set EXTRUDER_TEMP = params.TEMP|default(250)|int %}\nM104 S{EXTRUDER_TEMP}\nM83\nG1 E10 F300\nG1 E-30 F3600' }
    }
  }
}
const idle = () => overlay(PRESETS.idleHomed(), M1_MACROS)

async function nothingSent (page: Page, printer: PrinterHandle) {
  await page.waitForTimeout(400)
  expect(printer.gcode).toEqual([])
}

test('idle, Change filament sends nothing and opens the material panel', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('change-filament').click()
  await expect(page.getByTestId('material-picker')).toBeVisible()
  await expect(page.getByTestId('material-unload')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await nothingSent(page, printer)
})

test('Unload in the panel sends UNLOAD_FILAMENT at once, with no confirm', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('change-filament').click()
  await page.getByTestId('material-unload').click()
  await expect.poll(() => printer.gcode).toEqual(['UNLOAD_FILAMENT'])
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('Load on the Filament card sends LOAD_FILAMENT at once, with no confirm', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('load-filament').click()
  await expect.poll(() => printer.gcode).toEqual(['LOAD_FILAMENT'])
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('a double click on Unload sends it once', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('unload-filament').dblclick()
  await expect.poll(() => printer.gcode.length).toBe(1)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual(['UNLOAD_FILAMENT'])
  await expect(page.getByTestId('unload-filament')).toBeDisabled()
})

test('Unload on the card, then at once in the panel: one send (the guard is page-wide)', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('unload-filament').dispatchEvent('click')
  await page.getByTestId('load-filament').dispatchEvent('click')
  await page.waitForTimeout(600)
  expect(printer.gcode).toEqual(['UNLOAD_FILAMENT'])
})

test('idle, Quick actions → Change filament sends nothing and opens the panel on Control', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/')
  await page.getByTestId('quick-actions').first().click()
  await page.getByTestId('quick-filament').click()
  await expect(page).toHaveURL(/\/control/)
  await expect(page.getByTestId('material-picker')).toBeVisible()
  await nothingSent(page, printer)
})

test('already on Control, Quick actions → Change filament opens the panel, every time', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('quick-actions').first().click()
    await page.getByTestId('quick-filament').click()
    await expect(page.getByTestId('material-picker')).toBeVisible()
    // The query is dropped once the panel is open, so the next press changes the route again.
    await expect(page).not.toHaveURL(/filament=open/)
    await page.mouse.click(2, 2)
    await expect(page.getByTestId('material-picker')).toBeHidden()
  }
  await nothingSent(page, printer)
})

test('mid-print, Quick actions → Change filament asks, then sends M600 to pause the print', async ({ page, open }) => {
  const printer = await usePrinter(page, M1_MACROS) // the shared mock as it is: mid-print
  await open('/')
  await page.getByTestId('quick-actions').first().click()
  await page.getByTestId('quick-filament').click()
  const dialog = page.getByRole('dialog', { name: 'Pause the print to change filament?' })
  await expect(dialog).toBeVisible()
  await nothingSent(page, printer)
  await dialog.getByRole('button', { name: 'Pause and change' }).click()
  await expect.poll(() => printer.gcode).toEqual(['M600'])
})

test('mid-print, Keep printing sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, M1_MACROS)
  await open('/control')
  await page.getByTestId('change-filament').click()
  const dialog = page.getByRole('dialog', { name: 'Pause the print to change filament?' })
  await dialog.getByTestId('confirm-cancel').click()
  await expect(dialog).toHaveCount(0)
  await nothingSent(page, printer)
})

test('mid-print, a double click on Change filament: every dialog confirmed, one M600', async ({ page, open }) => {
  const printer = await usePrinter(page, M1_MACROS)
  await open('/control')
  await page.getByTestId('change-filament').dispatchEvent('click')
  await page.getByTestId('change-filament').dispatchEvent('click')
  const dialogs = page.getByRole('dialog', { name: 'Pause the print to change filament?' })
  await expect(dialogs).toHaveCount(2)
  // Both answered yes (dispatched, so neither dialog's overlay takes the other's click).
  const oks = page.getByTestId('confirm-ok')
  await expect(oks).toHaveCount(2)
  await oks.nth(1).dispatchEvent('click')
  await oks.nth(0).dispatchEvent('click')
  await expect(dialogs).toHaveCount(0)
  await page.waitForTimeout(600)
  expect(printer.gcode).toEqual(['M600'])
})

test('paused, Change filament, Load and Unload are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, overlay(M1_MACROS, {
    print_stats: { state: 'paused' },
    pause_resume: { is_paused: true }
  }))
  await open('/control')
  for (const id of ['change-filament', 'load-filament', 'unload-filament']) await expect(page.getByTestId(id)).toBeDisabled()
  // What is sent, not only the disabled look: the clicks dispatched past the disabled attribute.
  for (const id of ['change-filament', 'load-filament', 'unload-filament']) await page.getByTestId(id).dispatchEvent('click')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await nothingSent(page, printer)
})

test('while the printer shows its own prompt, Change filament, Load and Unload are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await expect(page.getByTestId('change-filament')).toBeEnabled()
  printer.say('// action:prompt_begin Change filament', '// action:prompt_button Unload|_DO_UNLOAD_M600', '// action:prompt_show')
  for (const id of ['change-filament', 'load-filament', 'unload-filament']) await expect(page.getByTestId(id)).toBeDisabled()
  for (const id of ['load-filament', 'unload-filament']) await page.getByTestId(id).dispatchEvent('click')
  await nothingSent(page, printer)
})

test('after a cancelled print, while Klipper still runs a script, Load and Unload are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, overlay(idle(), { print_stats: { state: 'cancelled' }, idle_timeout: { state: 'Printing' } }))
  await open('/control')
  for (const id of ['load-filament', 'unload-filament']) await expect(page.getByTestId(id)).toBeDisabled()
  await expect(page.getByTestId('unload-filament')).toHaveAttribute('title', "Wait until the printer finishes what it's doing.")
  for (const id of ['load-filament', 'unload-filament']) await page.getByTestId(id).dispatchEvent('click')
  await nothingSent(page, printer)
})
