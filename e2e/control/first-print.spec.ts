/**
 * The first print (control-onboarding-1109, journey step 4): a printer with
 * nothing printed yet arrives at Overview with Print something. A sample is
 * in the Library; an upload goes up, Ready to print opens, and the print
 * starts only after the plate check and Print now.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

async function freshPrinter (page: Page): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answer['server.history.list'] = { count: 0, jobs: [] }
  printer.state.answer['server.history.totals'] = {
    job_totals: { total_jobs: 0, total_time: 0, total_print_time: 0, total_filament_used: 0, longest_job: 0, longest_print: 0 }
  }
  return printer
}

/** Catches uploads to the printer: the page's POST lands here and is answered as Moonraker does. */
async function uploads (page: Page, name: string) {
  const seen: string[] = []
  await page.route('**/server/files/upload', route => {
    seen.push(route.request().postData() ?? '')
    return route.fulfill({ json: { item: { path: name, root: 'gcodes' }, action: 'create_file' } })
  })
  return seen
}

const first = (page: Page) => page.getByTestId('first-print')

test('a printer with nothing printed yet offers Print something on Overview', async ({ page, open }) => {
  await freshPrinter(page)
  await open('/')
  await expect(first(page)).toBeVisible()
  await expect(first(page)).toContainText('Print something')
  await expect(first(page)).toContainText('check the plate before it starts')
  await expect(page.getByTestId('first-print-sample')).toHaveText('Print a sample')
  await expect(page.getByTestId('first-print-upload')).toBeEnabled()
  await expect(page.getByText('Pick something to print again')).toHaveCount(0)
})

test('Print a sample opens this printer\'s Library', async ({ page, open }) => {
  const printer = await freshPrinter(page)
  await open('/')
  await page.getByTestId('first-print-sample').click()
  await expect(page).toHaveURL(/\/library$/)
  expect(printer.called('printer.print.start')).toHaveLength(0)
})

test('Upload a file: the file goes up, Ready to print opens, and it starts only after the plate check', async ({ page, open }) => {
  const printer = await freshPrinter(page)
  const seen = await uploads(page, 'calibration_cube.gcode')
  await open('/')
  const chooser = page.waitForEvent('filechooser')
  await page.getByTestId('first-print-upload').click()
  await (await chooser).setFiles({ name: 'calibration_cube.gcode', mimeType: 'text/plain', buffer: Buffer.from('G28\nG1 X10\n') })
  await expect.poll(() => seen.length).toBe(1)

  const ready = page.getByTestId('job-ready')
  await expect(ready).toBeVisible()
  expect(printer.called('printer.print.start')).toHaveLength(0)
  await page.getByTestId('job-ready-print').click()

  // The plate check stays: nothing has been on this plate Control knows of, so it asks.
  await expect(page.getByTestId('confirm-plate')).toBeVisible()
  await expect(page.getByTestId('confirm-ok')).toBeDisabled()
  expect(printer.called('printer.print.start')).toHaveLength(0)
  await page.getByTestId('confirm-plate').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.called('printer.print.start')).toEqual([{ filename: 'calibration_cube.gcode' }])
})

test('a printer that has printed before offers its jobs again, not Print something', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await expect(page.getByTestId('print-again-0')).toBeVisible()
  await expect(first(page)).toHaveCount(0)
})

test('while the printer is offline, Upload a file waits', async ({ page, open }) => {
  const printer = await freshPrinter(page)
  await open('/')
  await expect(page.getByTestId('first-print-upload')).toBeEnabled()
  await printer.offline()
  await expect(page.getByTestId('first-print-upload')).toBeDisabled()
})
