/**
 * Control: hand moves keep out of the M1's bed notch.
 *
 * The notch (x 75–125, y 0–34) must be crossed at Z ≥ 6. A jog that would
 * drag the nozzle through it low down lifts first; one that would end over it
 * is refused and says why. Nothing here reaches the shared mock printer: the
 * page's G-code is answered and recorded by usePrinter.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

async function chooseStep (page: import('@playwright/test').Page, mm: string) {
  const move = page.getByTestId('control-move')
  await move.getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: mm }).click()
}

test('a jog through the notch lifts to the traverse height, crosses, and comes back down', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [60, 40, 1] }))
  await open('/control')
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()

  // The mock has a mesh active, so the crossing height is 6 mm plus the mesh's spread.
  await expect.poll(() => printer.moves().length).toBe(3)
  const [lift, across, down] = printer.moves()
  const liftZ = Number(/^G1 Z([\d.]+) F600$/.exec(lift)?.[1])
  expect(liftZ).toBeGreaterThanOrEqual(6)
  expect(liftZ).toBeLessThan(7)
  expect([across, down]).toEqual(['G1 X110 Y40 F7800', 'G1 Z1 F600'])
})

test('a jog that would end over the notch is refused, says why, and sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [70, 7, 1] }))
  await open('/control')
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()

  await expect(page.getByText(/That spot is over the bed notch/)).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('an ordinary jog away from the notch is one move, as before', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
  await open('/control')
  await chooseStep(page, '10')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()

  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X10 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
})

test('while printing, the move controls are locked and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page) // the mock as it is: mid-print
  await open('/control')
  // v4: while printing the tile shows the live position only; there is nothing to press.
  await expect(page.getByTestId('control-move').getByText('Locked while printing')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Head right (X+)' })).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})

test('two jog sources cannot interleave: Move here on the trackpad waits for the arrow move to land', async ({ page, open }) => {
  // The fixture holds the reported head still, so the arrow move never "arrives".
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [150, 100, 10] }))
  await open('/control')
  await chooseStep(page, '10')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode.length).toBe(1)

  const pad = page.getByTestId('move-trackpad')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5)

  await expect(page.getByTestId('trackpad-note')).toHaveText('Wait for the head to finish moving.')
  await expect(page.getByTestId('trackpad-move')).toBeDisabled()
  await page.getByTestId('trackpad-move').click({ force: true })
  await page.waitForTimeout(300)
  expect(printer.gcode).toHaveLength(1)
})

test('once the printer reports the head there, the next move goes', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [150, 100, 10] }))
  await open('/control')
  await chooseStep(page, '10')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode.length).toBe(1)
  // The printer reports the head at X160.
  printer.report(PRESETS.idleHomed({ position: [160, 100, 10] }))
  // The page has the report (its X readout shows 160), so the wait on the head is over because it ARRIVED,
  // not because the 8 s expiry ran out: that is what this test is about.
  await expect(page.getByTestId('pos-x').first()).toHaveText(/^X160(\.0+)?\s*$/)
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode.length).toBe(2)
  expect(printer.gcode[1]).toContain('G1 X10 F7800')
})
