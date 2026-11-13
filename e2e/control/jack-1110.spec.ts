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
  test('FM-02/03: Load and Unload are inside the filament box, side by side at the same width', async ({ page, open }) => {
    await usePrinter(page, idle())
    await open('/')
    const tile = page.locator('[data-tile="filament"]')
    const box = await tile.boundingBox()
    const load = await tile.getByTestId('overview-load-filament').boundingBox()
    const unload = await tile.getByTestId('overview-unload-filament').boundingBox()
    if (!box || !load || !unload) throw new Error('not on screen')
    expect(Math.abs(load.y - unload.y)).toBeLessThan(2)
    expect(Math.abs(load.width - unload.width)).toBeLessThan(2)
    expect(load.x).toBeGreaterThanOrEqual(box.x)
    expect(unload.x + unload.width).toBeLessThanOrEqual(box.x + box.width + 1)
  })

  test('Load and Unload sit in the panel header', async ({ page, open }) => {
    await usePrinter(page, idle())
    await open('/control')
    await page.getByTestId('filament-row').click()
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
    await expect(page.getByTestId('filament-type')).toHaveText('PETG')
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
    // The photoreal M1 stalls software WebGL for seconds a frame; the simple model keeps a drag quick.
    await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
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
  /**
   * Scrolls `selector` to the middle of the screen and waits until it is inside the viewport and has stopped moving.
   * Tiles above can still grow just after edit mode opens (a busy CI runner draws them late), which left a measured
   * resize handle at y 1083 on a 900 px screen: the press then landed on nothing and the tile never resized.
   */
  async function toCentre (page: Page, selector: string) {
    const target = page.locator(selector)
    const height = page.viewportSize()!.height
    let last = ''
    await expect.poll(async () => {
      await target.evaluate(e => e.scrollIntoView({ block: 'center' }))
      const b = await target.boundingBox()
      const at = b ? `${Math.round(b.x)},${Math.round(b.y)}` : ''
      const steady = !!b && b.y >= 0 && b.y + b.height <= height && at === last
      last = at
      return steady
    }, { timeout: 15_000, intervals: [100, 250, 500] }).toBe(true)
  }
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
  /** Every widget once, each drawn at a size it offers, none left mid-drag (one round trip to the page). */
  async function expectValid (page: Page, ids: string[]) {
    const cellsNow = await cells(page).evaluateAll(els => els.map(e => {
      const el = e as HTMLElement
      return { id: el.dataset.cell as string, size: el.dataset.size ?? '', transform: el.style.transform, moving: el.classList.contains('overview__cell--moving') }
    }))
    const now = cellsNow.map(c => c.id)
    expect(new Set(now).size).toBe(now.length)
    expect([...now].sort()).toEqual([...ids].sort())
    for (const c of cellsNow) {
      expect(c.size, `${c.id} is drawn at a size it offers`).toMatch(/^(S|M|L)$/)
      expect(c.transform, `${c.id} has no leftover transform`).toBe('')
      expect(c.moving, `${c.id} is no longer held`).toBe(false)
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
    await toCentre(page, '[data-cell="mode"]')
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
    await toCentre(page, '[data-cell="macros"] [data-tid="tile-resize"]')
    const grid = await page.locator('.overview__grid').boundingBox()
    const handle = await page.locator('[data-cell="macros"] [data-tid="tile-resize"]').boundingBox()
    if (!grid || !handle) throw new Error('not on screen')
    const column = (grid.width + 16) / 12
    const was = await springs(page)
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
    await page.mouse.down()
    // Three and a bit columns narrower: 4.6 is not a size Quick commands offers, so it snaps to the nearest (8 to 3).
    await page.mouse.move(handle.x + handle.width / 2 - column * 3.4, handle.y + handle.height / 2, { steps: 10 })
    await expect(page.locator('[data-cell="macros"]')).toHaveAttribute('style', /--span: 3;/)
    await expect.poll(async () => (await springs(page)) - was).toBeGreaterThan(0)
    await page.mouse.up()
    await settle(page)
    await expect(page.locator('[data-cell="macros"]')).toHaveAttribute('data-size', 'S')
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

/* KAN-2029: Jack's own default Overview, and that a person can build it again by hand. */
const JACK_ORDER = ['stage', 'job', 'filament', 'mode', 'position', 'graph', 'trackpad', 'jog', 'macros']

async function boxOf (page: Page, id: string) {
  const b = await page.locator(`[data-cell="${id}"]`).boundingBox()
  if (!b) throw new Error(`${id} not on screen`)
  return b
}
const idsOf = (page: Page) => page.locator('[data-cell]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cell as string))

/** Row 1 Print mode and Position side by side; row 2 Temperatures across; then the Trackpad, Jog, and Quick commands under Jog (OV-19, OV-29). */
async function expectJackLayout (page: Page) {
  expect(await idsOf(page)).toEqual(JACK_ORDER)
  const grid = (await page.locator('.overview__grid').boundingBox())!
  const [mode, position, graph, trackpad, jog, macros] = await Promise.all(['mode', 'position', 'graph', 'trackpad', 'jog', 'macros'].map(id => boxOf(page, id)))
  const stage = await boxOf(page, 'stage')
  const filament = await boxOf(page, 'filament')
  // The printer, job and filament stay on top.
  expect(mode.y).toBeGreaterThan(stage.y + stage.height - 2)
  expect(mode.y).toBeGreaterThan(filament.y + filament.height - 2)
  // Row 1: Print mode and Position side by side, filling the row.
  expect(Math.abs(mode.y - position.y)).toBeLessThan(2)
  expect(position.x).toBeGreaterThan(mode.x + mode.width - 2)
  expect(Math.abs(mode.x - grid.x)).toBeLessThan(2)
  expect(Math.abs(position.x + position.width - (grid.x + grid.width))).toBeLessThan(2)
  // Row 2: Temperatures, all the way across.
  expect(graph.y).toBeGreaterThan(Math.max(mode.y + mode.height, position.y + position.height) - 2)
  expect(Math.abs(graph.x - grid.x)).toBeLessThan(2)
  expect(Math.abs(graph.width - grid.width)).toBeLessThan(2)
  // Then the Trackpad, Jog on its right, and Quick commands under Jog: out to the right edge and down to the Trackpad's floor (OV-19, OV-29).
  expect(trackpad.y).toBeGreaterThan(graph.y + graph.height - 2)
  expect(jog.x).toBeGreaterThan(trackpad.x + trackpad.width - 2)
  expect(Math.abs(jog.y - trackpad.y)).toBeLessThan(2)
  expect(Math.abs(macros.x - jog.x)).toBeLessThan(2)
  expect(Math.abs(macros.x + macros.width - (grid.x + grid.width))).toBeLessThan(2)
  expect(macros.y).toBeGreaterThan(jog.y + jog.height - 2)
  expect(Math.abs(macros.y + macros.height - (trackpad.y + trackpad.height))).toBeLessThan(2)
}

test.describe('KAN-2029: the default layout', () => {
  test('a fresh printer shows the layout, by tile positions (desktop) and reading order (phone)', async ({ page, open, isMobile }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(page.locator('[data-cell]')).toHaveCount(JACK_ORDER.length)
    if (isMobile) {
      // Same reading order, top to bottom.
      expect(await idsOf(page)).toEqual(JACK_ORDER)
      const ys: number[] = []
      for (const id of JACK_ORDER) ys.push((await boxOf(page, id)).y)
      // Boxes are in the viewport's frame, so compare how the page scrolled to reach each one instead.
      const tops = await page.locator('[data-cell]').evaluateAll(els => els.map(e => e.getBoundingClientRect().top + window.scrollY))
      for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThanOrEqual(tops[i - 1] - 2)
      return
    }
    await expectJackLayout(page)
  })

  test('from any layout, dragging and resizing builds it again', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'Tiles are resized on the desktop grid.')
    test.setTimeout(180_000)
    // The widths and heights (columns, rows) of the sizes each tile offers.
    const SIZES: Record<string, Record<string, [number, number]>> = {
      graph: { S: [3, 1], M: [6, 1], L: [12, 1] },
      mode: { S: [3, 1], M: [6, 1] },
      macros: { S: [3, 1], M: [8, 1], L: [12, 1] }
    }
    // This test is about where tiles go, not the 3D view: with no WebGL the stage draws its fallback at the same size,
    // and a tall page does not stall on software GL.
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        return /webgl/i.test(type) ? null : getContext.call(this, type, ...rest)
      } as typeof HTMLCanvasElement.prototype.getContext
    })
    // The whole grid on screen, so a drag never has to scroll.
    await page.setViewportSize({ width: 1440, height: 2800 })
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await page.getByTestId('edit-open').click()
    await expect(page.getByTestId('edit-done')).toBeVisible()

    const settled = () => page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => null))))
    const hold = async (id: string, onto: string) => {
      const grip = await page.locator(`[data-cell="${id}"] [data-tid="tile-grip"]`).boundingBox()
      const to = await boxOf(page, onto)
      if (!grip) throw new Error(`${id} has no grip`)
      await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
      await page.mouse.down()
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
      await page.mouse.up()
      await settled()
    }
    const sizeOf = (id: string) => page.locator(`[data-cell="${id}"]`).getAttribute('data-size')
    const resizeTo = async (id: string, key: string) => {
      for (let tries = 0; tries < 4 && (await sizeOf(id)) !== key; tries++) {
        const style = (await page.locator(`[data-cell="${id}"]`).getAttribute('style')) ?? ''
        const span = Number(style.match(/--span: (\d+)/)?.[1])
        const rows = Number(style.match(/--rows: (\d+)/)?.[1])
        const want = SIZES[id][key]
        const grid = (await page.locator('.overview__grid').boundingBox())!
        const handle = (await page.locator(`[data-cell="${id}"] [data-tid="tile-resize"]`).boundingBox())!
        const b = await boxOf(page, id)
        const column = (grid.width + 16) / 12
        const row = (b.height + 16) / rows
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
        await page.mouse.down()
        await page.mouse.move(handle.x + handle.width / 2 + (want[0] - span) * column, handle.y + handle.height / 2 + (want[1] - rows) * row, { steps: 8 })
        await page.mouse.up()
        await settled()
      }
      expect(await sizeOf(id)).toBe(key)
    }

    // Scramble it: Position to the end, Temperatures to the front, a few sizes changed.
    await hold('position', 'macros')
    await hold('graph', 'stage')
    await resizeTo('macros', 'L')
    await resizeTo('mode', 'S')
    await resizeTo('graph', 'S')
    expect(await idsOf(page)).not.toEqual(JACK_ORDER)

    // Rebuild: sizes first, then each place in turn gets the tile that belongs there.
    await resizeTo('graph', 'L')
    await resizeTo('mode', 'M')
    await resizeTo('macros', 'M')
    for (let i = 0; i < JACK_ORDER.length; i++) {
      const now = await idsOf(page)
      if (now[i] !== JACK_ORDER[i]) await hold(JACK_ORDER[i], now[i])
    }
    await page.getByTestId('edit-done').click()
    await expect(page.getByTestId('edit-open')).toBeVisible()
    await expectJackLayout(page)
  })
})

/* KAN-2038 / KAN-2039 / KAN-1955 / KAN-2023: the Trackpad panel, and the one Home all. */
test.describe('the Trackpad panel', () => {
  test('is only the trackpad and Home all: no jog, no position bar', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const tile = page.locator('[data-tile="trackpad"]')
    await tile.scrollIntoViewIfNeeded()
    await expect(tile.getByTestId('move-trackpad')).toBeVisible()
    await expect(tile.getByTestId('move-homes')).toBeVisible()
    await expect(tile.getByTestId('move-pad')).toHaveCount(0)
    await expect(tile.getByTestId('move-position')).toHaveCount(0)
    await expect(tile.getByText('Fine jog')).toHaveCount(0)
  })

  test('greys out and is disabled while the printer is moving, and is still there', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const tile = page.locator('[data-tile="trackpad"]')
    const pad = tile.getByTestId('move-trackpad')
    await pad.scrollIntoViewIfNeeded()
    await expect(pad).toBeVisible()
    await expect(pad).not.toHaveAttribute('aria-disabled', 'true')
    const sent = printer.gcode.length
    printer.report({ print_stats: { state: 'printing', filename: 'benchy.gcode' }, virtual_sdcard: { is_active: true, progress: 0.2 }, idle_timeout: { state: 'Printing' } })
    await expect(pad).toBeVisible()
    await expect(pad).toHaveAttribute('aria-disabled', 'true')
    await expect.poll(() => pad.evaluate(e => Number(getComputedStyle(e).opacity))).toBeLessThan(0.8)
    await expect(tile.getByTestId('home-all')).toBeDisabled()
    const b = (await pad.boundingBox())!
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.move(b.x + 20, b.y + 20)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width - 20, b.y + b.height - 20, { steps: 6 })
    await page.mouse.up()
    // Nothing was sent by touching it.
    expect(printer.gcode.length).toBe(sent)
    // And it comes back when the print is over.
    printer.report({ print_stats: { state: 'standby', filename: '' }, virtual_sdcard: { is_active: false, progress: 0 }, idle_timeout: { state: 'Ready' } })
    await expect(pad).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('there is one Home all on the Overview, and it sends a full G28', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(page.locator('[data-cell="jog"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Home all' })).toHaveCount(1)
    await page.getByRole('button', { name: 'Home all' }).click()
    await expect.poll(() => printer.gcode).toContain('G28')
    expect(printer.gcode.filter(g => /^G28 /.test(g))).toEqual([])
  })

  test('on Control, too: one Home all', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/control')
    await expect(page.getByTestId('control-move').getByRole('button', { name: 'Home all' })).toHaveCount(1)
  })
})
