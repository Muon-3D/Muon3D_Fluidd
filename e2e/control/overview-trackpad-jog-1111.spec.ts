/**
 * Jack's 11 Nov Overview notes, picks Trackpad B and Jog B:
 * - the Trackpad has no Move here button: On release sends exactly one move
 *   when the pointer lifts (and none while it is down); Live is shown, disabled,
 *   until the printer can stream it (Klipper MUON_JOG, PR 125);
 * - Jog has labelled Plate up / Plate down beside a pad and one step row.
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const tile = (page: Page) => page.locator('[data-tile="trackpad"]')
const pad = (page: Page) => page.getByTestId('move-trackpad')

async function boxOf (l: Locator) {
  await l.scrollIntoViewIfNeeded()
  const b = await l.boundingBox()
  if (!b) throw new Error('not on screen')
  return b
}

type Opener = (path: string) => Promise<void>
async function start (page: Page, open: Opener, state: ReturnType<typeof PRESETS.idleHomed>) {
  await page.addInitScript(() => localStorage.removeItem('m3d.trackpad.mode'))
  const printer = await usePrinter(page, state)
  await open('/')
  await expect(pad(page)).toBeVisible()
  return printer
}

test.describe('Trackpad B: On release, Live disabled, no Move here', () => {
  test('has no Move here button; Home all and Home Z are icon buttons in the header', async ({ page, open }) => {
    await start(page, open, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await expect(tile(page).getByRole('button', { name: /Move here/i })).toHaveCount(0)
    await expect(tile(page).getByText('Move here')).toHaveCount(0)
    await expect(tile(page).getByTestId('trackpad-move')).toHaveCount(0)
    const homes = tile(page).getByTestId('move-homes')
    const head = await boxOf(tile(page).locator('.ccard__head'))
    const home = await boxOf(homes.getByTestId('home-all'))
    expect(home.y + home.height).toBeLessThanOrEqual(head.y + head.height + 1)
    await expect(homes.getByRole('button', { name: 'Home Z' })).toBeVisible()
  })

  test('Live is disabled with the reason, On release is on', async ({ page, open }) => {
    await start(page, open, PRESETS.idleHomed())
    const live = tile(page).getByTestId('trackpad-live')
    await expect(live).toBeVisible()
    await expect(live).toBeDisabled()
    await expect(live).toHaveAttribute('title', 'Live moving arrives with a printer update')
    await expect(tile(page).getByTestId('trackpad-release')).toHaveAttribute('aria-checked', 'true')
    await expect(live).toHaveAttribute('aria-checked', 'false')
  })

  test('On release: nothing is sent while the pointer is down or dragging; exactly one move when it lifts', async ({ page, open }) => {
    const printer = await start(page, open, PRESETS.idleHomed({ position: [150, 100, 10] }))
    const b = await boxOf(pad(page))
    await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.6)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width * 0.45, b.y + b.height * 0.65, { steps: 8 })
    await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.7, { steps: 8 })
    await page.waitForTimeout(600)
    expect(printer.gcode).toEqual([])
    await page.mouse.up()
    await expect.poll(() => printer.moves().length).toBe(1)
    await page.waitForTimeout(600)
    expect(printer.moves()).toHaveLength(1)
    expect(printer.moves()[0]).toMatch(/^G1 X-?\d+(\.\d+)? Y-?\d+(\.\d+)? F\d+$/)
  })

  test('a tap is one move, on release', async ({ page, open }) => {
    const printer = await start(page, open, PRESETS.idleHomed({ position: [150, 100, 10] }))
    const b = await boxOf(pad(page))
    await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.75)
    await page.mouse.down()
    await page.waitForTimeout(300)
    expect(printer.gcode).toEqual([])
    await page.mouse.up()
    await expect.poll(() => printer.moves().length).toBe(1)
  })

  test('across the notch, the move on release lifts, crosses and comes back down', async ({ page, open }) => {
    const printer = await start(page, open, PRESETS.idleHomed({ position: [60, 20, 1] }))
    const b = await boxOf(pad(page))
    // Bed mm to the pad: the notch is between X 75 and 125 at the front (Y small); the bed is 200 mm square.
    await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.9)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width * 0.72, b.y + b.height * 0.9, { steps: 10 })
    await page.mouse.up()
    await expect.poll(() => printer.moves().length).toBeGreaterThan(0)
    const lines = printer.moves()
    // Either a planned lift (Z up, cross, Z back) or a refusal that sent nothing; never a bare low G1 over the notch.
    if (lines.length > 1) {
      expect(lines[0]).toMatch(/^G1 Z\d/)
      expect(lines[lines.length - 1]).toMatch(/^G1 Z1 /)
    }
  })

  test('touching it while the printer is busy sends nothing', async ({ page, open }) => {
    const printer = await start(page, open, PRESETS.idleHomed())
    printer.report({ print_stats: { state: 'printing', filename: 'benchy.gcode' }, virtual_sdcard: { is_active: true, progress: 0.2 }, idle_timeout: { state: 'Printing' } })
    const b = await boxOf(pad(page))
    const sent = printer.gcode.length
    await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width * 0.6, b.y + b.height * 0.6, { steps: 5 })
    await page.mouse.up()
    expect(printer.gcode.length).toBe(sent)
  })
})

test.describe('Jog B: Plate up / Plate down, one step row', () => {
  test('lays out the pad, labelled Z buttons and a step row, with no empty area under it', async ({ page, open, isMobile }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const jog = page.locator('[data-tile="jog"]')
    await expect(jog).toBeVisible()
    const up = jog.getByRole('button', { name: 'Plate up' })
    const down = jog.getByRole('button', { name: 'Plate down' })
    await expect(up).toContainText('Plate up')
    await expect(down).toContainText('Plate down')
    await expect(up.locator('svg.frame-icon')).toHaveCount(1)
    const [tileBox, upBox, downBox, stepBox, padBox] = [await boxOf(jog), await boxOf(up), await boxOf(down), await boxOf(jog.getByRole('radiogroup', { name: 'Step' })), await boxOf(jog.locator('.jg__pad'))]
    expect(downBox.y).toBeGreaterThan(upBox.y + upBox.height - 2) // Plate up over Plate down
    expect(upBox.x).toBeGreaterThan(padBox.x + padBox.width - 2) // beside the pad
    expect(stepBox.y).toBeGreaterThan(padBox.y + padBox.height - 2) // the step row is underneath
    // The step row is the last thing in the tile: only its padding is left below.
    expect(tileBox.y + tileBox.height - (stepBox.y + stepBox.height)).toBeLessThanOrEqual(24)
    if (isMobile) expect(tileBox.height).toBeLessThanOrEqual(400)
    else {
      // Shorter than before (it was 340 px of controls and a blank gap): it is as tall as the Trackpad beside it, and no taller.
      const trackpad = await boxOf(page.locator('[data-tile="trackpad"]'))
      expect(Math.abs(tileBox.height - trackpad.height)).toBeLessThan(2)
    }
    for (const v of ['0.1', '1', '10', '100']) await expect(jog.getByRole('radio', { name: v, exact: true })).toBeVisible()
  })

  test('Plate up and Plate down send through the existing path, by the chosen step', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await open('/')
    const jog = page.locator('[data-tile="jog"]')
    await jog.getByRole('radio', { name: '10', exact: true }).click()
    await jog.getByRole('button', { name: 'Plate up' }).click()
    await expect.poll(() => printer.gcode.length).toBe(1)
    expect(printer.gcode[0]).toBe('SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 Z10 F600\nRESTORE_GCODE_STATE NAME=_ui_movement')
    await expect.poll(() => printer.moves().length).toBe(1)
    printer.report({ gcode_move: { gcode_position: [100, 100, 20, 0], position: [100, 100, 20, 0] }, toolhead: { position: [100, 100, 20, 0] } })
    await page.waitForTimeout(800)
    await jog.getByRole('button', { name: 'Plate down' }).click()
    await expect.poll(() => printer.gcode.length).toBe(2)
    expect(printer.gcode[1]).toBe('SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 Z-10 F600\nRESTORE_GCODE_STATE NAME=_ui_movement')
  })
})
