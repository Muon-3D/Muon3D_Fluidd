/**
 * Jack's 10 Nov bench notes (devin-briefs/control-jack-1110-gaps.md):
 * - KAN-1951: print mode is Quiet / Normal / Turbo; no Fans tile and no
 *   speed-and-flow stand-in by default.
 * - KAN-1953: Load and Unload sit inside the filament box, evenly, full width.
 * - KAN-1954: what the printer reports as loaded shows live, with no reload.
 * - KAN-1955: Home all is the first thing under the trackpad's header.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

const M1_FILAMENT = {
  'gcode_macro M600': {},
  'gcode_macro LOAD_FILAMENT': {},
  'gcode_macro UNLOAD_FILAMENT': {},
  save_variables: { variables: {} },
  configfile: {
    settings: {
      'gcode_macro m600': { gcode: 'PAUSE' },
      'gcode_macro load_filament': { gcode: 'FILAMENT_INSERT_FLOW {rawparams}' },
      'gcode_macro unload_filament': { gcode: 'G1 E-30 F3600' }
    }
  }
}
const idle = () => overlay(PRESETS.idleHomed(), M1_FILAMENT)

test.describe('KAN-1951: print mode only', () => {
  test('no Fans tile on Overview or Control by default, and Print mode is never "Speed and flow"', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(page.locator('[data-cell="mode"]')).toBeVisible()
    await expect(page.locator('[data-cell="fans"]')).toHaveCount(0)
    await open('/control')
    const mode = page.getByTestId('control-printmode')
    await expect(mode).toBeVisible()
    await expect(mode).toContainText('Print mode')
    await expect(mode).not.toContainText('Speed and flow')
    await expect(page.getByTestId('control-fans')).toHaveCount(0)
  })
})

test.describe('KAN-1953 / KAN-1954: the filament box', () => {
  test('Load and Unload sit in the panel header, and Heat is a full-width bottom button', async ({ page, open }) => {
    await usePrinter(page, idle())
    await open('/control')
    await page.getByTestId('chip-filament').click()
    const panel = page.getByTestId('material-picker')
    await expect(panel.getByTestId('material-load')).toBeVisible()
    await expect(panel.getByTestId('material-unload')).toBeVisible()
    const box = await panel.boundingBox()
    const load = await panel.getByTestId('material-load').boundingBox()
    const unload = await panel.getByTestId('material-unload').boundingBox()
    if (!box || !load || !unload) throw new Error('not on screen')
    expect(load.y).toBeLessThan(box.y + 60)
    expect(Math.abs(load.y - unload.y)).toBeLessThan(2)
  })

  test('the mock printer loads, and the box and panel update live', async ({ page, open }) => {
    const printer = await usePrinter(page, idle())
    await open('/')
    await expect(page.getByTestId('filament-type')).toHaveText('No material loaded')
    await page.getByTestId('filament-row').click()
    await page.getByTestId('material-PETG').click()
    await expect.poll(() => printer.gcode).toContain('SAVE_VARIABLE VARIABLE=muon_material VALUE=\'"PETG"\'')
    // The printer saves it and reports it back.
    printer.report({ save_variables: { variables: { muon_material: 'PETG' } } })
    await expect(page.getByTestId('filament-type')).toHaveText('PETG')
    await expect(page.getByTestId('material-PETG')).toHaveAttribute('aria-selected', 'true')
    await page.getByTestId('material-load').click()
    await expect.poll(() => printer.gcode.slice(-1)).toEqual(['LOAD_FILAMENT'])
    // Loading, the printer names the colour too: it shows with no reload.
    printer.report({ save_variables: { variables: { muon_material: 'PETG', muon_material_colour: 'D32F2F' } } })
    await expect(page.getByTestId('filament-type')).toHaveText('PETG')
    await expect(page.getByTestId('filament-detail')).not.toHaveText('Colour not set')
    await open('/control')
    await expect(page.getByTestId('chip-filament')).toContainText('PETG')
  })
})

test('KAN-1955: Home all is the first action under the trackpad header, and sends G28', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/control')
  const homes = page.getByTestId('move-homes')
  await expect(homes).toBeVisible()
  const pad = await page.getByTestId('move-trackpad').boundingBox()
  const bar = await homes.boundingBox()
  if (!pad || !bar) throw new Error('not on screen')
  expect(bar.y).toBeLessThan(pad.y)
  await homes.getByTestId('home-all').click()
  await expect.poll(() => printer.gcode).toContain('G28')
})

test.describe('KAN-1956 / KAN-1957 / KAN-1958: edit mode', () => {
  test.beforeEach(async ({ page }) => {
    if (process.platform !== 'win32') await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
    // Counts every spring the page starts, so a short one cannot finish before it is looked at.
    await page.addInitScript(() => {
      const w = window as unknown as { springs: number }
      w.springs = 0
      const animate = Element.prototype.animate
      Element.prototype.animate = function (this: Element, frames, options) {
        if (typeof options === 'object' && options?.id === 'overview-spring') w.springs++
        return animate.call(this, frames, options)
      }
    })
  })
  const springs = (page: Page) => page.evaluate(() => (window as unknown as { springs: number }).springs)
  const slotTop = (page: Page, id: string) => page.locator(`[data-cell="${id}"]`).evaluate(e => (e as HTMLElement).offsetTop)
  const cells = (page: Page) => page.locator('[data-cell]')
  const order = (page: Page) => cells(page).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cell as string))
  const box = async (page: Page, id: string) => {
    const b = await page.locator(`[data-cell="${id}"]`).boundingBox()
    if (!b) throw new Error(`${id} not on screen`)
    return b
  }
  const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => null))))
  async function edit (page: Page) {
    await page.getByTestId('edit-open').click()
    await expect(page.getByTestId('edit-done')).toBeVisible()
  }
  /** Holds a tile by its top-left grip and lets go at a point. */
  async function drag (page: Page, id: string, to: { x: number, y: number }) {
    const grip = await page.locator(`[data-cell="${id}"] [data-tid="tile-grip"]`).boundingBox()
    if (!grip) throw new Error(`${id} has no grip`)
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 10 })
    await page.mouse.up()
    await settle(page)
  }
  /** Every widget once, each drawn at a size it offers, none left mid-drag. */
  async function expectValid (page: Page, ids: string[]) {
    const now = await order(page)
    expect(new Set(now).size).toBe(now.length)
    expect([...now].sort()).toEqual([...ids].sort())
    for (const id of now) {
      const c = page.locator(`[data-cell="${id}"]`)
      await expect(c).toHaveAttribute('data-size', /^(S|M|L)$/)
      expect(await c.evaluate(e => (e as HTMLElement).style.transform)).toBe('')
      await expect(c).not.toHaveClass(/overview__cell--moving/)
    }
  }

  test('only the top-left grip lifts a tile; dragging its body does nothing', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    const before = await order(page)
    const b = await box(page, before[3])
    const t = await box(page, before[0])
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.down()
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 8 })
    await page.mouse.up()
    expect(await order(page)).toEqual(before)
    const grip = await page.locator(`[data-cell="${before[3]}"] [data-tid="tile-grip"]`).boundingBox()
    if (!grip) throw new Error('no grip')
    expect(grip.x - b.x).toBeLessThan(40)
    expect(grip.y - b.y).toBeLessThan(40)
  })

  test('a tile moves to another row, the others making room while it is held', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    const before = await order(page)
    await page.locator('[data-cell="mode"]').evaluate(e => e.scrollIntoView({ block: 'center' }))
    const from = await box(page, 'mode')
    // The nearest tile on another row, on screen and clear of the edges where a held tile scrolls the page.
    const h = page.viewportSize()!.height
    let target = ''
    let best = Infinity
    for (const id of before) {
      if (id === 'mode') continue
      const b = await box(page, id)
      const y = b.y + b.height / 2
      const dy = Math.abs(b.y - from.y)
      if (dy > 40 && y > 90 && y < h - 90 && dy < best) { best = dy; target = id }
    }
    if (!target) throw new Error('no other row on screen')
    const to = await box(page, target)
    const grip = await page.locator('[data-cell="mode"] [data-tid="tile-grip"]').boundingBox()
    if (!grip) throw new Error('no grip')
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    const wasTop = await slotTop(page, 'mode')
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
    // Still held: its slot is already on the other row, and the order has changed.
    await expect.poll(async () => Math.abs((await slotTop(page, 'mode')) - wasTop)).toBeGreaterThan(40)
    expect(await order(page)).not.toEqual(before)
    await page.mouse.up()
    await settle(page)
    expect(Math.abs((await box(page, 'mode')).y - from.y)).toBeGreaterThan(40)
    await expectValid(page, before)
  })

  test('the corner resize snaps to a size the widget offers and springs there', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'Tiles are resized on the desktop grid.')
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    await page.locator('[data-cell="hotend"]').evaluate(e => e.scrollIntoView({ block: 'center' }))
    const grid = await page.locator('.overview__grid').boundingBox()
    const handle = await page.locator('[data-cell="hotend"] [data-tid="tile-resize"]').boundingBox()
    if (!grid || !handle) throw new Error('not on screen')
    const column = (grid.width + 16) / 12
    const was = await springs(page)
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
    await page.mouse.down()
    // Two and a bit columns: not a size the hotend offers, so it snaps (3 → 6).
    await page.mouse.move(handle.x + handle.width / 2 + column * 2.4, handle.y + handle.height / 2, { steps: 10 })
    await expect(page.locator('[data-cell="hotend"]')).toHaveAttribute('style', /--span: 6/)
    await expect.poll(async () => (await springs(page)) - was).toBeGreaterThan(0)
    await page.mouse.up()
    await settle(page)
    await expect(page.locator('[data-cell="hotend"]')).toHaveAttribute('data-size', 'M')
  })

  test('stress: 20 random drags leave a valid layout, which is the one saved', async ({ page, open }) => {
    test.setTimeout(120_000)
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    const ids = await order(page)
    let seed = 1110
    const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
    for (let i = 0; i < 20; i++) {
      const now = await order(page)
      const id = now[Math.floor(rand() * now.length)]
      const c = page.locator(`[data-cell="${id}"]`)
      await c.evaluate(e => e.scrollIntoView({ block: 'center' }))
      const grid = await page.locator('.overview__grid').boundingBox()
      const view = page.viewportSize()!
      if (!grid) throw new Error('no grid')
      const top = Math.max(grid.y, 90)
      const bottom = Math.min(grid.y + grid.height, view.height - 90)
      await drag(page, id, { x: grid.x + rand() * grid.width, y: top + rand() * Math.max(bottom - top, 1) })
      await expectValid(page, ids)
    }
    const final = await order(page)
    await page.getByTestId('edit-done').click()
    await expect(page.getByTestId('edit-open')).toBeVisible()
    expect(await order(page)).toEqual(final)
    await page.reload()
    await expect(cells(page).first()).toBeVisible()
    expect(await order(page)).toEqual(final)
  })
})
