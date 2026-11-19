/**
 * Overview, the 3D view (KAN-4816, KAN-4817; Jack's I-515 and I-516).
 *
 * 1. Moving the toolhead must not kick the person out of the top-down view they chose: the printer reports busy while the
 *    head moves, which used to make the stage let the part go.
 * 2. The no-go zone (the M1's front notch, Z 0 to the traverse height) is drawn only where the head really can't go at
 *    the current height: shown low, hidden once Z is at the traverse height or above.
 *
 * Every script the page sends is answered by usePrinter, so nothing reaches a real printer. Like the other top-down
 * specs this needs the accurate model, which only the GPU draws (software WebGL stalls on it), so it is skipped in CI.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test.use({ webgl: true })

const GPU = process.platform === 'win32' && !process.env.E2E_NO_GPU
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.skip(!GPU, 'the top-down view needs the accurate model, which software WebGL stalls on')

const at = (position: [number, number, number], busy = false) => ({
  ...PRESETS.idleHomed({ position }),
  idle_timeout: { state: busy ? 'Printing' : 'Ready' }
})

async function ready (page: Page) {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(page.getByTestId('m1-parts')).toBeAttached()
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
}

test('a toolhead jog keeps the top-down view', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-pad-e').click()
  await expect.poll(() => printer.moves()).toEqual(['G1 X10 F7800'])

  // The head is on its way: the printer reports busy and the position changes under the page, as Klipper does mid-move.
  for (const x of [105, 110, 115, 120]) {
    printer.report(at([x, 100, 10], true))
    await page.waitForTimeout(150)
    await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
  }
  printer.report(at([120, 100, 10]))
  await page.waitForTimeout(300)
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
})

test('a real print still lets the top-down view go (negative control for the hold)', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await ready(page)
  printer.report({ ...at([100, 100, 10], true), print_stats: { state: 'printing', filename: 'x.gcode', message: '' } })
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'free')
})

test('the no-go zone shows only at heights where the head cannot go', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 100] }))
  await open('/')
  await ready(page)
  // Z at the top: nothing to avoid, so no zone and no label.
  await expect(page.getByTestId('m1-bounds')).toBeAttached()
  await expect(page.getByTestId('m1-notch')).toHaveCount(0)
  await expect(page.getByTestId('m1-notch-label')).toHaveCount(0)

  // Z low: the notch is drawn, with its label.
  printer.report(at([100, 100, 2]))
  await expect(page.getByTestId('m1-notch')).toHaveCount(1)
  await expect(page.getByTestId('m1-notch-label')).toHaveText('No-go: front notch')
  if (process.env.SHOTS) await page.getByTestId('m1-parts').screenshot({ path: `${process.env.SHOTS}/zone-low-${test.info().project.name}.png` })

  // Back up to the traverse height: gone again.
  printer.report(at([100, 100, 6]))
  await expect(page.getByTestId('m1-notch')).toHaveCount(0)
  if (process.env.SHOTS) await page.getByTestId('m1-parts').screenshot({ path: `${process.env.SHOTS}/zone-top-${test.info().project.name}.png` })
  expect(printer.gcode).toEqual([])
})
