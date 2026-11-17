/**
 * The printer's machine faults in Control (KAN-3418).
 *
 * The printer reports `m1_machine.faults` (bare codes: bed_power_fault first).
 * Control shows them on Overview and Control in the panel's words, and offers
 * Reset (Z_POWER_RESET) for the bed power fault only after a confirm. If the
 * fault comes back after Reset it says so and does not offer Reset again.
 * While a print runs Reset is not offered (Klipper refuses it). A printer
 * without m1_machine shows nothing. Object shape: Muon3D_Klipper #114
 * (klippy/extras/m1_machine.py). The printer's answers are faked per test.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']

const BED = 'Bed power cut, check the bed and its cable, then Reset'
const AGAIN = 'Bed power cut again: turn it off and check'

const machine = (faults: string[], conditions: Record<string, unknown> = {}) => ({
  m1_machine: { activity: faults.length ? 'fault' : 'idle', conditions: { plate_cleared: true, ...conditions }, missing: {}, ready: {}, faults, pause_reason: null }
})

async function printerWith (page: Page, faults: string[] | null, extra: Record<string, unknown> = {}, conditions: Record<string, unknown> = {}) {
  const status = { ...PRESETS.idleHomed(), ...(faults ? machine(faults, conditions) : {}), ...extra }
  const printer = await usePrinter(page, status, { components: MUON })
  return { printer, status }
}

const bar = (page: Page) => page.getByTestId('machine-fault-bar')
const reset = (page: Page) => page.getByTestId('machine-fault-reset')
const ask = async (page: Page) => {
  await reset(page).click()
  await expect(page.getByTestId('confirm')).toBeVisible()
}

for (const path of ['/', '/control']) {
  test.describe(`on ${path === '/' ? 'Overview' : 'Control'}`, () => {
    test('a bed power fault shows the panel words and a Reset button', async ({ page, open }) => {
      await printerWith(page, ['bed_power_fault'])
      await open(path)
      await expect(bar(page)).toBeVisible()
      await expect(page.getByTestId('machine-fault-text')).toHaveText(BED)
      await expect(reset(page)).toHaveText('Reset')
    })

    test('the printer plain reason shows under the words', async ({ page, open }) => {
      await printerWith(page, ['bed_power_fault'], {}, { bed_power_reason: 'The bed cable may be loose.' })
      await open(path)
      await expect(page.getByTestId('machine-fault-detail')).toHaveText('The bed cable may be loose.')
    })

    test('engineering text from the printer is not shown', async ({ page, open }) => {
      await printerWith(page, ['bed_power_fault'], {}, { bed_power_reason: 'PGOOD dropped (eFuse tripped, 0.00 A)' })
      await open(path)
      await expect(bar(page)).toBeVisible()
      await expect(page.getByTestId('machine-fault-detail')).toHaveCount(0)
      await expect(bar(page)).not.toContainText('PGOOD')
    })

    test('Reset asks first; Cancel sends nothing', async ({ page, open }) => {
      const { printer } = await printerWith(page, ['bed_power_fault'])
      await open(path)
      await ask(page)
      await expect(page.getByTestId('confirm')).toContainText('Reset bed power?')
      await expect(page.getByTestId('confirm-message')).toContainText('This turns the bed power back on.')
      await expect(page.getByTestId('confirm-cancel')).toHaveText('Cancel')
      await page.getByTestId('confirm-cancel').click()
      await expect(page.getByTestId('confirm')).toHaveCount(0)
      await expect(bar(page)).toBeVisible()
      expect(printer.gcode).toEqual([])
    })

    test('Confirm sends one Z_POWER_RESET, and the banner goes only when the printer says the fault is gone', async ({ page, open }) => {
      const { printer, status } = await printerWith(page, ['bed_power_fault'])
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect.poll(() => printer.gcode).toEqual(['Z_POWER_RESET'])
      // The press alone removes nothing: the printer has not said so yet.
      await expect(bar(page)).toBeVisible()
      printer.report({ ...status, ...machine([]) })
      await expect(bar(page)).toHaveCount(0)
      expect(printer.gcode).toEqual(['Z_POWER_RESET'])
    })

    test('the fault clearing by itself (a Klipper restart) removes the banner', async ({ page, open }) => {
      const { printer, status } = await printerWith(page, ['bed_power_fault'])
      await open(path)
      await expect(bar(page)).toBeVisible()
      printer.report({ ...status, ...machine([]) })
      await expect(bar(page)).toHaveCount(0)
      expect(printer.gcode).toEqual([])
    })

    test('a fault that comes back after Reset says so, and Reset is not offered again', async ({ page, open }) => {
      const { printer, status } = await printerWith(page, ['bed_power_fault'])
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect.poll(() => printer.gcode).toEqual(['Z_POWER_RESET'])
      printer.report({ ...status, ...machine([]) })
      await expect(bar(page)).toHaveCount(0)
      printer.report({ ...status, ...machine(['bed_power_fault']) })
      await expect(page.getByTestId('machine-fault-text')).toHaveText(AGAIN)
      await expect(reset(page)).toHaveCount(0)
      expect(printer.gcode).toEqual(['Z_POWER_RESET'])
    })

    test('a fault that never clears after Reset is shown as back, with no Reset', async ({ page, open }) => {
      const { printer } = await printerWith(page, ['bed_power_fault'])
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect(page.getByTestId('machine-fault-text')).toHaveText(AGAIN, { timeout: 10_000 })
      await expect(reset(page)).toHaveCount(0)
      expect(printer.gcode).toEqual(['Z_POWER_RESET'])
    })

    test('while printing, Reset is not offered and the words stay', async ({ page, open }) => {
      await printerWith(page, ['bed_power_fault'], {
        print_stats: { state: 'printing', filename: 'benchy.gcode' },
        idle_timeout: { state: 'Printing' },
        virtual_sdcard: { is_active: true, progress: 0.4 }
      })
      await open(path)
      await expect(page.getByTestId('machine-fault-text')).toHaveText(BED)
      await expect(reset(page)).toHaveCount(0)
      await expect(page.getByTestId('machine-fault-printing')).toBeVisible()
    })

    test('the printer refusing Z_POWER_RESET is shown in its words and the banner stays', async ({ page, open }) => {
      const { printer } = await printerWith(page, ['bed_power_fault'])
      printer.state.failOn['printer.gcode.script'] = 'Z_POWER_RESET refused: a print is running'
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect(page.getByTestId('machine-fault-message')).toContainText('Z_POWER_RESET refused: a print is running')
      await expect(bar(page)).toBeVisible()
    })

    test('other faults show their words and no Reset', async ({ page, open }) => {
      await printerWith(page, ['fan_fault'])
      await open(path)
      await expect(page.getByTestId('machine-fault-text')).toHaveText('Hot-end fan fault, check the fan')
      await expect(reset(page)).toHaveCount(0)
    })

    test('no faults: no banner', async ({ page, open }) => {
      await printerWith(page, [])
      await open(path)
      await expect(page.getByTestId(path === '/' ? 'overview-page' : 'control-page')).toBeVisible()
      await expect(bar(page)).toHaveCount(0)
    })

    test('a printer without m1_machine shows nothing and raises no error', async ({ page, open }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(e.message))
      await printerWith(page, null)
      await open(path)
      await expect(page.getByTestId(path === '/' ? 'overview-page' : 'control-page')).toBeVisible()
      await expect(bar(page)).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test('the printer switch says the printer has a fault', async ({ page, open }) => {
  await printerWith(page, ['bed_power_fault'])
  await open('/')
  await expect(page.getByTestId('printer-switch')).toContainText('Bed power cut')
})
