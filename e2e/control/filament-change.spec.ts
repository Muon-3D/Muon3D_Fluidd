/**
 * The filament buttons must not heat or move without asking (KAN-1700, the
 * Control side of KAN-1699; Jack, 6 Nov 2026: "Change filament" energised
 * the motors and the contact guard said the nozzle was touching the plate).
 * On the M1, M600 is PAUSE, which lifts Z and parks X/Y even with no print.
 * - Idle, Change filament sends nothing: it opens the material panel.
 * - Load and Unload ask first, naming the heat; a double click sends once.
 * - Mid-print, Change filament is M600 after its confirm.
 * - Paused or prompting: nothing is sent.
 */
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

/** The M1's own M600 and UNLOAD_FILAMENT (core/M1/macros/filament.cfg), as macros the page can see. */
const M1_MACROS = {
  'gcode_macro M600': {},
  configfile: {
    settings: {
      'gcode_macro m600': { gcode: 'PAUSE\nRESPOND TYPE=command MSG="action:prompt_begin Change filament"' },
      'gcode_macro unload_filament': { gcode: 'M104 S250\nTEMPERATURE_WAIT SENSOR=extruder MINIMUM=245\nM83\nG1 E10 F300\nG1 E-30 F3600' }
    }
  }
}
const idle = () => overlay(PRESETS.idleHomed(), M1_MACROS)

test('idle, Change filament sends nothing and opens the material panel', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('change-filament').click()
  await expect(page.getByTestId('material-picker')).toBeVisible()
  await expect(page.getByTestId('material-unload')).toBeVisible()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('Unload in the panel asks first, naming 250 °C, and sends only after the confirm', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('change-filament').click()
  await page.getByTestId('material-unload').click()
  const dialog = page.getByRole('dialog', { name: 'Unload the filament?' })
  await expect(dialog).toContainText('Heats the nozzle to 250 °C')
  expect(printer.gcode).toEqual([])
  await dialog.getByRole('button', { name: 'Heat and unload' }).click()
  await expect.poll(() => printer.gcode).toEqual(['UNLOAD_FILAMENT'])
})

test('Cancel sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('unload-filament').click()
  await page.getByRole('dialog', { name: 'Unload the filament?' }).getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog', { name: 'Unload the filament?' })).toHaveCount(0)
  await page.waitForTimeout(300)
  expect(printer.gcode).toEqual([])
})

test('a double click on Unload sends it once', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await page.getByTestId('unload-filament').dblclick()
  // However many dialogs the double click opened, confirm every one.
  const yes = page.getByRole('button', { name: 'Heat and unload' })
  await expect(yes.first()).toBeVisible()
  while (await yes.count()) await yes.first().click()
  await expect.poll(() => printer.gcode.length).toBe(1)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual(['UNLOAD_FILAMENT'])
  await expect(page.getByTestId('unload-filament')).toBeDisabled()
})

test('idle, Quick actions → Change filament sends nothing and opens the panel on Control', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/')
  await page.getByTestId('quick-actions').first().click()
  await page.getByTestId('quick-filament').click()
  await expect(page).toHaveURL(/\/control\?filament=open/)
  await expect(page.getByTestId('material-picker')).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('mid-print, Quick actions → Change filament asks, then sends M600 to pause the print', async ({ page, open }) => {
  const printer = await usePrinter(page, M1_MACROS) // the shared mock as it is: mid-print
  await open('/')
  await page.getByTestId('quick-actions').first().click()
  await page.getByTestId('quick-filament').click()
  const dialog = page.getByRole('dialog', { name: 'Pause the print to change filament?' })
  await expect(dialog).toBeVisible()
  expect(printer.gcode).toEqual([])
  await dialog.getByRole('button', { name: 'Pause and change' }).click()
  await expect.poll(() => printer.gcode).toEqual(['M600'])
})

test('paused, Change filament, Load and Unload are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, overlay(M1_MACROS, {
    print_stats: { state: 'paused' },
    pause_resume: { is_paused: true }
  }))
  await open('/control')
  for (const id of ['change-filament', 'unload-filament']) await expect(page.getByTestId(id)).toBeDisabled()
  await page.getByTestId('change-filament').click({ force: true })
  await page.waitForTimeout(300)
  expect(printer.gcode).toEqual([])
})

test('while the printer shows its own prompt, Change filament and Unload are off', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  await expect(page.getByTestId('change-filament')).toBeEnabled()
  printer.say('// action:prompt_begin Change filament', '// action:prompt_button Unload|_DO_UNLOAD_M600', '// action:prompt_show')
  await expect(page.getByTestId('change-filament')).toBeDisabled()
  await expect(page.getByTestId('unload-filament')).toBeDisabled()
  expect(printer.gcode).toEqual([])
})
