/**
 * Jack's picks B for the Overview's Trackpad and Jog (12 Nov brief, section B):
 * - OV-25 / KAN-2077: just a Trackpad, compact, no "Move here"; Live / On
 *   release, On release by default; On release is exactly one planned move
 *   when the pointer lifts; Live is shown but disabled until the printer can
 *   stream it (Klipper MUON_JOG, the motion project), never a run of G1s.
 * - OV-28 / KAN-2120: the person's own moves never lock the panel with
 *   "printing"; only a real print does. A second drag mid-move is taken and
 *   goes as soon as the first lands (the Klipper half, turning mid-move, is
 *   the motion project's).
 * - OV-27 / KAN-2119: Jog B at S, M and L: the cross pad, Plate up and Plate
 *   down, one step row, no blank space at the bottom.
 * - CT-03 / KAN-1955 / KAN-2023: one Home control, a full G28.
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, useDatabase, PRESETS, type PrinterHandle } from './printer'

/** Slow hand moves (5 mm/s across, 5 mm/s for the plate), so a move is still in flight while the test acts, however slow the machine. */
async function slowMoves (page: Page, printer: PrinterHandle) {
  const db = await useDatabase(page, printer)
  db.saved.uiSettings = { general: { defaultToolheadXYSpeed: 5, defaultToolheadZSpeed: 5 } }
}

const trackpadTile = (page: Page) => page.locator('[data-tile="trackpad"]')

/** A saved Overview layout for this page (only the tiles named), read wherever the page looks for one. */
async function withLayout (page: Page, tiles: Array<{ id: string, span: number, rows: number }>) {
  await page.addInitScript((json: string) => {
    const get = Storage.prototype.getItem
    Storage.prototype.getItem = function (this: Storage, key: string) {
      return key.startsWith('muon.overview.layout.v3') ? json : get.call(this, key)
    }
  }, JSON.stringify({ version: 1, savedAt: 1, tiles, hidden: [] }))
}

/** Drag on the pad from one fraction of it to another, without lifting; returns the readout shown under the pointer. */
async function dragOnPad (page: Page, pad: Locator, from: [number, number], to: [number, number]) {
  await pad.scrollIntoViewIfNeeded()
  const b = (await pad.boundingBox())!
  await page.mouse.move(b.x + b.width * from[0], b.y + b.height * from[1])
  await page.mouse.down()
  await page.mouse.move(b.x + b.width * to[0], b.y + b.height * to[1], { steps: 8 })
}

/** The X and Y the readout on the pad shows. */
async function readout (page: Page): Promise<[number, number]> {
  const text = await trackpadTile(page).getByTestId('trackpad-readout').innerText()
  const m = /X\s*([\d.]+)\s*·\s*Y\s*([\d.]+)/.exec(text)
  if (!m) throw new Error(`readout: ${text}`)
  return [Number(m[1]), Number(m[2])]
}

/** The X and Y of a G1 line. */
const xyOf = (line: string): [number, number] => {
  const m = /X(-?[\d.]+) Y(-?[\d.]+)/.exec(line)
  if (!m) throw new Error(`not an XY move: ${line}`)
  return [Number(m[1]), Number(m[2])]
}

async function noPrintingWords (page: Page) {
  const tile = trackpadTile(page)
  await expect(tile.getByText(/printing/i)).toHaveCount(0)
  await expect(page.locator('[data-tile="jog"]').getByText(/printing/i)).toHaveCount(0)
}

test.describe('OV-25: the Trackpad is just a trackpad', () => {
  test('one pad, one Home, no Move here; On release is on, Live is shown but cannot be picked yet', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const tile = trackpadTile(page)
    await tile.scrollIntoViewIfNeeded()
    await expect(tile.getByTestId('move-trackpad')).toBeVisible()
    await expect(tile.getByRole('button', { name: 'Move here' })).toHaveCount(0)
    await expect(tile.getByTestId('trackpad-move')).toHaveCount(0)
    await expect(tile.getByTestId('move-pad')).toHaveCount(0)
    await expect(tile.getByTestId('move-position')).toHaveCount(0)
    const mode = tile.getByRole('radiogroup', { name: 'How the trackpad moves' })
    await expect(mode.getByRole('radio', { name: 'On release' })).toHaveAttribute('aria-checked', 'true')
    const live = mode.getByRole('radio', { name: 'Live' })
    await expect(live).toBeDisabled()
    await expect(live).toHaveAttribute('aria-checked', 'false')
    await expect(tile.getByTestId('trackpad-live-wrap')).toHaveAttribute('title', /printer update/)
  })

  test('On release is remembered on this device, and a remembered Live is not used until the printer can stream it', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await page.addInitScript(() => { try { localStorage.setItem('m3d.trackpad.mode', 'live') } catch {} })
    await open('/')
    const mode = trackpadTile(page).getByRole('radiogroup', { name: 'How the trackpad moves' })
    await mode.scrollIntoViewIfNeeded()
    await expect(mode.getByRole('radio', { name: 'On release' })).toHaveAttribute('aria-checked', 'true')
    await mode.getByRole('radio', { name: 'On release' }).click()
    expect(await page.evaluate(() => localStorage.getItem('m3d.trackpad.mode'))).toBe('release')
  })

  test('On release: nothing is sent while the pointer is down, then exactly one planned move to where it was let go', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await open('/')
    const pad = trackpadTile(page).getByTestId('move-trackpad')
    await dragOnPad(page, pad, [0.3, 0.8], [0.7, 0.6])
    const at = await readout(page)
    await page.waitForTimeout(300)
    expect(printer.gcode).toEqual([])
    await page.mouse.up()
    await expect.poll(() => printer.moves().length).toBe(1)
    await page.waitForTimeout(300)
    expect(printer.moves()).toHaveLength(1)
    const [x, y] = xyOf(printer.moves()[0])
    expect(Math.abs(x - at[0])).toBeLessThan(0.11)
    expect(Math.abs(y - at[1])).toBeLessThan(0.11)
    // A planned move, in absolute coordinates, and nothing else.
    expect(printer.gcode).toHaveLength(1)
    expect(printer.gcode[0]).toContain('G90')
  })

  test('a press the system takes away sends nothing', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await open('/')
    const pad = trackpadTile(page).getByTestId('move-trackpad')
    await dragOnPad(page, pad, [0.3, 0.8], [0.7, 0.6])
    await pad.dispatchEvent('pointercancel', { pointerId: 1, bubbles: true })
    await page.mouse.up()
    await page.waitForTimeout(400)
    expect(printer.gcode).toEqual([])
  })
})

test.describe('OV-28 / KAN-2120: your own moves never lock the panel', () => {
  /** The printer reports the head commanded to `xy` and still physically moving: idle_timeout Printing, no print. */
  const moving = (printer: PrinterHandle, xy: [number, number]) => printer.report(overlay(PRESETS.idleHomed({ position: [xy[0], xy[1], 10] }), { idle_timeout: { state: 'Printing' } }))

  test('mid-move: no "printing", nothing greyed out, and a second drag goes as soon as the first lands', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await slowMoves(page, printer)
    await open('/')
    const tile = trackpadTile(page)
    const pad = tile.getByTestId('move-trackpad')

    // First drag: one move.
    await dragOnPad(page, pad, [0.3, 0.8], [0.25, 0.75])
    await page.mouse.up()
    await expect.poll(() => printer.moves().length).toBe(1)
    const first = xyOf(printer.moves()[0])

    // The head is on its way: Klipper's idle_timeout says Printing, but nothing is printing.
    printer.report(overlay(PRESETS.idleHomed({ position: [100, 100, 10] }), { idle_timeout: { state: 'Printing' } }))
    await page.waitForTimeout(500)
    await expect(pad).not.toHaveAttribute('aria-disabled', 'true')
    await expect(tile.getByTestId('tile-pill')).not.toHaveText(/printing/i)
    await noPrintingWords(page)
    await expect(page.locator('[data-tile="jog"]').getByRole('button', { name: 'Head right' })).toBeEnabled()

    // Second drag while the first hasn't landed: taken, and held until it does.
    await dragOnPad(page, pad, [0.7, 0.8], [0.75, 0.7])
    const second = await readout(page)
    await page.mouse.up()
    await expect(tile.getByTestId('trackpad-note')).toHaveText(/as soon as the current move lands/)
    await page.waitForTimeout(300)
    expect(printer.moves()).toHaveLength(1)
    await noPrintingWords(page)

    // The printer reports the first move commanded (the head still physically moving): the second goes.
    moving(printer, first)
    await expect.poll(() => printer.moves().length).toBe(2)
    const [x, y] = xyOf(printer.moves()[1])
    expect(Math.abs(x - second[0])).toBeLessThan(0.11)
    expect(Math.abs(y - second[1])).toBeLessThan(0.11)
    await expect(pad).not.toHaveAttribute('aria-disabled', 'true')
    await noPrintingWords(page)
  })

  test('the same on Control: a jog in flight never says "Locked while printing"', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await slowMoves(page, printer)
    await open('/control')
    const move = page.getByTestId('control-move')
    await move.getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: '50 mm' }).click()
    await page.getByRole('button', { name: 'Head right (X+)' }).click()
    await expect.poll(() => printer.gcode.length).toBe(1)
    moving(printer, [150, 100])
    await page.waitForTimeout(500)
    await expect(move.getByText(/printing/i)).toHaveCount(0)
    await expect(move.getByTestId('move-trackpad')).not.toHaveAttribute('aria-disabled', 'true')
    // And the next jog is taken, queued behind the first by the printer.
    await page.getByRole('button', { name: 'Head right (X+)' }).click()
    await expect.poll(() => printer.gcode.length).toBe(2)
  })

  test('a macro started elsewhere after your move has finished locks it again, and nothing is sent', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
    await slowMoves(page, printer)
    await open('/')
    const tile = trackpadTile(page)
    const pad = tile.getByTestId('move-trackpad')
    await dragOnPad(page, pad, [0.3, 0.8], [0.25, 0.75])
    await page.mouse.up()
    await expect.poll(() => printer.moves().length).toBe(1)
    const first = xyOf(printer.moves()[0])
    // Your move runs, then the printer goes idle: the move is over.
    moving(printer, first)
    await expect(pad).not.toHaveAttribute('aria-disabled', 'true')
    printer.report(PRESETS.idleHomed({ position: [first[0], first[1], 10] }))
    await page.waitForTimeout(500)
    // A macro starts elsewhere (the panel, the console, another client), well inside the old move's travel time.
    printer.report(overlay(PRESETS.idleHomed({ position: [first[0], first[1], 10] }), { idle_timeout: { state: 'Printing' } }))
    await expect(pad).toHaveAttribute('aria-disabled', 'true')
    await expect(tile.getByTestId('tile-pill')).toHaveText('Busy')
    const jogRight = page.locator('[data-tile="jog"]').getByRole('button', { name: 'Head right' })
    await expect(jogRight).toBeDisabled()
    const sent = printer.gcode.length
    await jogRight.click({ force: true })
    const b = (await pad.boundingBox())!
    await page.mouse.move(b.x + b.width * 0.6, b.y + b.height * 0.7); await page.mouse.down(); await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.6, { steps: 4 }); await page.mouse.up()
    await page.waitForTimeout(500)
    expect(printer.gcode.length).toBe(sent)
    await noPrintingWords(page)
  })
  test('a real print still locks it, and says so', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const tile = trackpadTile(page)
    const pad = tile.getByTestId('move-trackpad')
    await pad.scrollIntoViewIfNeeded()
    printer.report({ print_stats: { state: 'printing', filename: 'benchy.gcode' }, virtual_sdcard: { is_active: true, progress: 0.2 }, idle_timeout: { state: 'Printing' } })
    await expect(pad).toHaveAttribute('aria-disabled', 'true')
    await expect(tile.getByText('Locked while printing')).toBeVisible()
    await expect(page.locator('[data-tile="jog"]').getByRole('button', { name: 'Head right' })).toBeDisabled()
  })

  test('busy with something that is not your move (homing, a macro): greyed out, but not "printing"', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const tile = trackpadTile(page)
    const pad = tile.getByTestId('move-trackpad')
    await pad.scrollIntoViewIfNeeded()
    printer.report({ idle_timeout: { state: 'Printing' } })
    await expect(pad).toHaveAttribute('aria-disabled', 'true')
    await expect(pad).toBeVisible()
    await expect(tile.getByText('Busy', { exact: true })).toBeVisible()
    await noPrintingWords(page)
  })
})

test.describe('CT-03: one Home control, a full G28', () => {
  test('the Overview has one Home, in the Trackpad header, and it sends G28', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(page.locator('[data-cell="jog"]')).toBeVisible()
    const homes = page.getByRole('button', { name: 'Home all' })
    await expect(homes).toHaveCount(1)
    const head = await trackpadTile(page).getByTestId('move-homes').boundingBox()
    const pad = await trackpadTile(page).getByTestId('move-trackpad').boundingBox()
    expect(head!.y + head!.height).toBeLessThan(pad!.y)
    await homes.click()
    await expect.poll(() => printer.gcode).toEqual(['G28'])
  })

  test('Control has one Home all, in the Movement header above the pad, and no second Home Z in the menu', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    const move = page.getByTestId('control-move')
    await expect(move.getByRole('button', { name: 'Home all' })).toHaveCount(1)
    const homes = (await move.getByTestId('move-homes').boundingBox())!
    const pad = (await move.getByTestId('move-trackpad').boundingBox())!
    expect(homes.y + homes.height).toBeLessThan(pad.y)
    await move.getByTestId('move-more').click()
    await expect(page.getByRole('menuitem', { name: /Home/ })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await move.getByRole('button', { name: 'Home all' }).click()
    await expect.poll(() => printer.gcode).toEqual(['G28'])
  })
})

test.describe('OV-27 / KAN-2119: Jog B at every size', () => {
  for (const [size, span, rows] of [['S', 3, 2], ['M', 4, 2], ['L', 8, 2]] as const) {
    test(`${size}: the cross pad, Plate up and Plate down, one step row, nothing blank under it`, async ({ page, open }) => {
      await withLayout(page, [{ id: 'trackpad', span: 4, rows: 3 }, { id: 'jog', span, rows }])
      const printer = await usePrinter(page, PRESETS.idleHomed())
      await open('/')
      const jog = page.locator('[data-tile="jog"]')
      await jog.scrollIntoViewIfNeeded()
      await expect(page.locator('[data-cell="jog"]')).toHaveAttribute('data-size', size)
      for (const name of ['Head back', 'Head left', 'Head right', 'Head forward']) await expect(jog.getByRole('button', { name })).toBeVisible()
      await expect(jog.getByRole('button', { name: /^Plate up/ })).toContainText('Plate up')
      await expect(jog.getByRole('button', { name: /^Plate down/ })).toContainText('Plate down')
      const steps = jog.getByRole('radiogroup', { name: 'Step' })
      await expect(steps.getByRole('radio')).toHaveCount(4)
      // Nothing blank at the bottom: the lowest control ends within the tile's own padding.
      const tile = (await jog.boundingBox())!
      const lowest = Math.max(...await jog.locator('button').evaluateAll(els => els.map(e => e.getBoundingClientRect().bottom)))
      expect(tile.y + tile.height - lowest).toBeLessThanOrEqual(24)
      // Plate up is one relative Z+ move of the step.
      await steps.getByRole('radio', { name: /^10( mm)?$/ }).click()
      await jog.getByRole('button', { name: /^Plate up/ }).click()
      await expect.poll(() => printer.moves()).toEqual(['G1 Z10 F600'])
    })
  }
})
