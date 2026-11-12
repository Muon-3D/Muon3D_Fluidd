/**
 * Control: hand moves keep out of the M1's bed notch.
 *
 * The notch is read live from [bed_mesh] (here x 75–125, y 0–34, traverse
 * Z 6). Klipper's rule: it only matters while the plate is within notch
 * height, toolhead Z < no_go_traverse_z, or Z is not homed. Then a jog that
 * would drag the nozzle through it lifts first and one that would end over it
 * is refused and says why; with the plate lower, moves are free. Nothing here reaches the shared mock printer: the
 * page's G-code is answered and recorded by usePrinter.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

async function chooseStep (page: import('@playwright/test').Page, mm: string) {
  const move = page.getByTestId('control-move')
  await move.getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: mm }).click()
}

test('a low move across the notch lifts to the traverse height, crosses, and comes back down', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [60, 20, 1] }))
  await open('/control')
  await page.getByTestId('move-goto').click()
  const form = page.getByTestId('move-go-form')
  await form.getByLabel('X to go to').fill('160')
  await form.getByLabel('X to go to').press('Tab')
  await page.getByTestId('move-go').click()

  // The mock has a mesh active, so the crossing height is 6 mm plus the mesh's spread.
  await expect.poll(() => printer.moves().length).toBe(3)
  const [lift, across, down] = printer.moves()
  const liftZ = Number(/^G1 Z([\d.]+) F600$/.exec(lift)?.[1])
  expect(liftZ).toBeGreaterThanOrEqual(6)
  expect(liftZ).toBeLessThan(7)
  expect([across, down]).toEqual(['G1 X160 Y20 F7800', 'G1 Z1 F600'])
})

test('a jog that would end over the notch is refused, says why, and sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [70, 7, 1] }))
  await open('/control')
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()

  await expect(page.getByText(/That spot is over the bed notch/)).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('the notch is drawn at its real size and labelled "notch", with no band around it', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed({ position: [150, 100, 10] }))
  await open('/control')
  const pad = page.getByTestId('move-trackpad')
  const notch = page.getByTestId('trackpad-notch')
  await expect(notch).toHaveText('notch')
  await expect(pad.getByText(/no-go/i)).toHaveCount(0)
  const [p, n] = [await pad.boundingBox(), await notch.boundingBox()]
  if (!p || !n) throw new Error('no trackpad')
  // 200 mm bed: x 75–125 centred on the Y=0 edge, 34 mm deep.
  expect(Math.abs((n.x - p.x) / p.width * 200 - 75)).toBeLessThan(1)
  expect(Math.abs(n.width / p.width * 200 - 50)).toBeLessThan(1)
  expect(Math.abs(n.height / p.height * 200 - 34)).toBeLessThan(1)
  await expect(page.locator('.tpad__band')).toHaveCount(0)
})

test('a low jog inside the old zone but outside the notch is one plain move', async ({ page, open }) => {
  // x 130 is 5 mm past the notch: inside the old 10 mm band, outside the notch.
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [130, 30, 1] }))
  await open('/control')
  await chooseStep(page, '10')
  await page.getByRole('button', { name: 'Head back (Y−)' }).click()
  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 Y-10 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
})

test('the same jog into the notch is allowed with the plate lower (Z at notch height or more)', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [70, 7, 10] }))
  await open('/control')
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X50 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
})

test('with Z not homed the plate height is unknown, so a jog into the notch is refused', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [70, 7, 20], homed: 'xy' }))
  await open('/control')
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect(page.getByText(/Home Z first/)).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('the notch is read live from the printer: another size and height are drawn and enforced as declared', async ({ page, open }) => {
  // Not the M1's numbers: a notch at x 20–60, y 150–180, notch height 3, so nothing hard-coded can pass this.
  const status = PRESETS.idleHomed({ position: [10, 160, 2] })
  status.configfile = { settings: { bed_mesh: { no_go_region_1_min: '20, 150', no_go_region_1_max: '60, 180', no_go_traverse_z: 3 } } }
  const printer = await usePrinter(page, status)
  await open('/control')
  const pad = page.getByTestId('move-trackpad')
  const notch = page.getByTestId('trackpad-notch')
  await expect(notch).toHaveText('notch')
  const [p, n] = [await pad.boundingBox(), await notch.boundingBox()]
  if (!p || !n) throw new Error('no trackpad')
  expect(Math.abs((n.x - p.x) / p.width * 200 - 20)).toBeLessThan(1)
  expect(Math.abs(n.width / p.width * 200 - 40)).toBeLessThan(1)
  // Z 2 is within this notch's height (3): a jog that ends inside it is refused.
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect(page.getByText(/That spot is over the bed notch/)).toBeVisible()
  expect(printer.gcode).toEqual([])
  // With the plate above notch height (Z 4: the 3 mm notch height plus the active mesh's spread, under 1 mm here), the same jog goes.
  printer.report({ ...PRESETS.idleHomed({ position: [10, 160, 4] }), configfile: status.configfile })
  // The readout eases toward the new height; past 3 means the report (Z 4, what the planner reads) has arrived.
  await expect(page.getByTestId('pos-z').first()).toHaveText(/^Z\s*(3\.\d+|4(\.0+)?)\s*$/)
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X50 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
})

test('a printer that declares no notch has none: nothing drawn, and a low jog there is one plain move', async ({ page, open }) => {
  const status = PRESETS.idleHomed({ position: [70, 7, 1] })
  // No [bed_mesh] notch keys at all (null replaces the mock's own bed_mesh settings).
  status.configfile = { settings: { bed_mesh: null } }
  const printer = await usePrinter(page, status)
  await open('/control')
  await expect(page.getByTestId('move-trackpad')).toBeVisible()
  await expect(page.getByTestId('trackpad-notch')).toHaveCount(0)
  await chooseStep(page, '50 mm')
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X50 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
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
  // While printing the trackpad and jog stay on the page, greyed out and disabled (KAN-2039).
  await expect(page.getByTestId('control-move').getByText('Locked while printing')).toBeVisible()
  await expect(page.getByTestId('move-trackpad')).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('button', { name: 'Head right (X+)' })).toBeDisabled()
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
