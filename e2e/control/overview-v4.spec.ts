/**
 * Overview v4, to Jack's spec (OVERVIEW-V4-JACK-SPEC, 9 Nov 2026): the real
 * print mode picker, the full filament box, no Z offset on a Muon printer,
 * S/M/L that draw different things, springs, and one CPU temperature.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

// The photoreal M1 stalls software WebGL for seconds a frame (see overview-parts.spec.ts).
test.beforeEach(async ({ page }) => {
  if (process.platform !== 'win32') await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

const cell = (page: Page, id: string) => page.locator(`[data-cell="${id}"]`)
const ids = async (page: Page) => page.locator('[data-cell]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cell))
const FAN_MODES = { mode: 'normal', modes: ['normal', 'quiet', 'turbo'] }

/** Hotend and Bed are off by default (the Temperatures graph shows both); put one on the page through Add widget. */
async function addWidget (page: Page, id: string) {
  await edit(page)
  await page.getByTestId('widget-sheet-open').click()
  await page.getByTestId(`widget-add-${id}`).click()
  await page.getByTestId('widget-sheet-close').click()
  await page.getByTestId('edit-done').click()
  await expect(page.getByTestId('edit-open')).toBeVisible()
}

async function edit (page: Page) {
  await page.getByTestId('edit-open').click()
  await expect(page.getByTestId('edit-done')).toBeVisible()
}

test.describe('Print mode widget', () => {
  test('Turbo sends SET_PRINT_MODE MODE=turbo', async ({ page, open }) => {
    const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), { fan_modes: FAN_MODES }))
    printer.state.results['printer.gcode.help'] = { SET_PRINT_MODE: 'Select the print mode (normal, quiet, turbo)' }
    await open('/')
    const tile = page.locator('[data-tile="mode"]')
    await expect(tile.getByTestId('overview-mode-normal')).toHaveAttribute('aria-checked', 'true')
    await tile.getByTestId('overview-mode-turbo').click()
    await expect.poll(() => printer.gcode).toEqual(['SET_PRINT_MODE MODE=turbo'])
    printer.report(overlay(PRESETS.idleHomed(), { fan_modes: { ...FAN_MODES, mode: 'turbo' } }))
    await expect(tile.getByTestId('overview-mode-turbo')).toHaveAttribute('aria-checked', 'true')
  })

  test('a printer without fan_modes says it is not available, not speed and flow', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const tile = page.locator('[data-tile="mode"]')
    await expect(tile.getByTestId('mode-unavailable')).toContainText('Not available on this printer')
    await expect(tile).not.toContainText(/speed|flow/i)
    await expect(tile.locator('[data-tid^="overview-mode-"]')).toHaveCount(0)
  })
})

test('Filament is the full filament box: Change opens the one material panel, with Load and Unload, sending nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const tile = page.locator('[data-tile="filament"]')
  for (const tid of ['overview-change-filament', 'overview-load-filament', 'overview-unload-filament']) await expect(tile.getByTestId(tid)).toBeVisible()
  await tile.getByTestId('overview-change-filament').click()
  await expect(page.getByTestId('material-picker')).toBeVisible()
  await expect(page.getByTestId('material-load')).toBeVisible()
  await expect(page.getByTestId('material-unload')).toBeVisible()
  await page.waitForTimeout(300)
  expect(printer.gcode).toEqual([])
})

test.describe('Z offset on a Muon printer', () => {
  test('is not in Add widget, and a saved layout with it does not draw it', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed(), { components: ['file_manager', 'history', 'muon_protection'], database: true })
    await open('/')
    await expect(cell(page, 'zoffset')).toHaveCount(0)
    await edit(page)
    await page.getByTestId('widget-sheet-open').click()
    await page.getByTestId('widget-search').fill('offset')
    await expect(page.getByTestId('widget-card-zoffset')).toHaveCount(0)
    await page.getByTestId('widget-search').fill('')
    // In the catalogue, not on by default.
    for (const id of ['bedmesh', 'care', 'library']) {
      await expect(page.getByTestId(`widget-card-${id}`)).toBeVisible()
      await expect(page.getByTestId(`widget-add-${id}`)).toBeVisible()
    }
  })

  test('is offered on a printer that is not a Muon one', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed(), { components: ['file_manager', 'history'], database: true })
    await open('/')
    await edit(page)
    await page.getByTestId('widget-sheet-open').click()
    await expect(page.getByTestId('widget-card-zoffset')).toBeVisible()
  })
})

test('S, M and L draw different things, not the same thing scaled', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'Sizes are changed on the desktop grid.')
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await addWidget(page, 'hotend')
  const hotend = cell(page, 'hotend')
  await expect(hotend).toHaveAttribute('data-size', 'S')
  await expect(hotend.getByTestId('heater-inline-presets')).toHaveCount(0)
  await edit(page)
  await hotend.getByTestId('tile-grip').focus()
  await hotend.getByTestId('tile-grip').press('Shift+ArrowRight')
  await expect(hotend).toHaveAttribute('data-size', 'M')
  await page.getByTestId('edit-done').click()
  await expect(hotend.getByTestId('heater-inline-presets')).toBeVisible()
  // Temperatures: L is the graph with its time range, S just the numbers.
  const graph = cell(page, 'graph')
  await expect(graph.getByTestId('graph-range')).toBeVisible()
  await edit(page)
  const grip = graph.getByTestId('tile-grip')
  await grip.focus()
  await grip.press('Shift+ArrowLeft')
  await grip.press('Shift+ArrowLeft')
  await expect(graph).toHaveAttribute('data-size', 'S')
  await page.getByTestId('edit-done').click()
  await expect(graph.getByTestId('graph-table')).toBeVisible()
  await expect(graph.getByTestId('thermal-graph')).toHaveCount(0)
})

test.describe('springs', () => {
  // Counts every spring the page starts, so a short one cannot finish before it is looked at.
  test.beforeEach(async ({ page }) => {
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
  const started = (page: Page) => page.evaluate(() => (window as unknown as { springs: number }).springs)
  const animating = (page: Page) => page.locator('[data-cell]').evaluateAll(els => els.filter(e => e.getAnimations().some(a => a.id === 'overview-spring')).length)

  test('a resize snaps to a size and springs there; the others make room', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'Tiles are resized on the desktop grid.')
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    const grip = cell(page, 'position').getByTestId('tile-grip')
    await grip.focus()
    const was = await started(page)
    await grip.press('Shift+ArrowRight')
    await expect(cell(page, 'position')).toHaveAttribute('style', /--span: 8/)
    // The resized one and the ones it pushed along.
    await expect.poll(async () => (await started(page)) - was).toBeGreaterThan(1)
    // Each one finishes (waited for, not timed: a busy runner may not draw a frame for seconds).
    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.id === 'overview-spring').map(a => a.finished)))
    expect(await animating(page)).toBe(0)
  })

  test('with reduced motion nothing animates', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'Tiles are resized on the desktop grid.')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    const grip = cell(page, 'position').getByTestId('tile-grip')
    await grip.focus()
    await grip.press('Shift+ArrowRight')
    await expect(cell(page, 'position')).toHaveAttribute('style', /--span: 8/)
    await page.waitForTimeout(100)
    expect(await started(page)).toBe(0)
    expect(await animating(page)).toBe(0)
  })

  test('the others move out of the way while a widget is dragged, and it settles where it is let go', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await edit(page)
    const before = await ids(page)
    // Clear of the top and bottom edges, where a held tile scrolls the page.
    await cell(page, 'mode').evaluate(e => e.scrollIntoView({ block: 'center' }))
    const from = await cell(page, 'mode').getByTestId('tile-grip').boundingBox()
    const to = await cell(page, 'graph').boundingBox()
    if (!from || !to) throw new Error('not on screen')
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
    // Still held: the order has already changed.
    await expect.poll(async () => (await ids(page)).indexOf('mode')).toBe(before.indexOf('graph'))
    expect(await cell(page, 'mode').evaluate(e => (e as HTMLElement).style.transform)).toMatch(/translate/)
    await page.mouse.up()
    await expect(cell(page, 'mode')).not.toHaveAttribute('style', /transform: translate/)
    expect((await ids(page)).indexOf('mode')).toBe(before.indexOf('graph'))
  })
})

test('the temperature graph draws the CPU once', async ({ page, open }) => {
  const status = overlay(PRESETS.idleHomed(), {
    'temperature_fan CPU': { temperature: 51.2, target: 60, speed: 0.3 },
    'temperature_sensor cm4': { temperature: 51.2 }
  })
  status.configfile = { ...status.configfile, settings: { ...status.configfile?.settings, 'temperature_fan cpu': { sensor_type: 'temperature_host' }, 'temperature_sensor cm4': { sensor_type: 'temperature_host' } } }
  await usePrinter(page, status)
  await open('/')
  const graph = cell(page, 'graph').getByTestId('thermal-graph')
  // The graph only reads the printer while it is on screen, and the tiles above it can still be growing.
  await expect(async () => {
    await graph.scrollIntoViewIfNeeded()
    await expect(graph.locator('[data-legend]').first()).toBeVisible({ timeout: 2000 })
  }).toPass()
  const more = graph.getByTestId('legend-more')
  if (await more.count()) await more.click()
  await expect(graph.locator('[data-legend="temperature_fan CPU"]')).toHaveCount(1)
  await expect(graph.locator('[data-legend="temperature_sensor cm4"]')).toHaveCount(0)
})

test('phone: the default layout has Movement, the print mode and the filament box', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'Phone only.')
  await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await expect.poll(() => ids(page)).toEqual(['stage', 'job', 'filament', 'mode', 'position', 'graph', 'trackpad', 'jog', 'macros'])
  await expect(page.locator('[data-tile="trackpad"]')).toBeVisible()
  await expect(page.getByTestId('mode-unavailable')).toBeVisible()
  await expect(page.getByTestId('overview-load-filament')).toBeVisible()
  await expect(cell(page, 'zoffset')).toHaveCount(0)
})

// Boxwood's real sensors come from the shared mock (e2e/mock/moonraker.py): the CPU is both a
// `temperature_fan CPU` and a bare `temperature_host CPU`, and there are toolhead and driver sensors.
async function graphOf (page: Page) {
  const graph = cell(page, 'graph').getByTestId('thermal-graph')
  await expect(async () => {
    await graph.scrollIntoViewIfNeeded()
    await expect(graph.locator('[data-legend]').first()).toBeVisible({ timeout: 2000 })
  }).toPass()
  return graph
}

test('Boxwood sensors: one CPU, and only the nozzle and bed drawn by default', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const graph = await graphOf(page)
  // Essentials only: the nozzle, the bed and (the shared mock also has one) a chamber. No CPU, drivers or toolhead sensors.
  const shown = await graph.locator('[data-legend]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.legend))
  expect(shown.slice(0, 2)).toEqual(['extruder', 'heater_bed'])
  expect(shown.filter(k => !['extruder', 'heater_bed', 'temperature_sensor chamber'].includes(k ?? ''))).toEqual([])
  await graph.getByTestId('legend-more').click()
  const labels = await graph.locator('[data-legend] .tg__name').allTextContents()
  expect(labels.filter(l => l.trim().toUpperCase() === 'CPU')).toHaveLength(1)
  await expect(graph.locator('[data-legend="temperature_host CPU"]')).toHaveCount(0)
  await expect(graph.locator('[data-legend="temperature_fan CPU"]')).toHaveCount(1)
})

test('the graph legend is grouped by part: toolhead, bed, then chamber and system', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const graph = await graphOf(page)
  await graph.getByTestId('legend-more').click()
  const groups = await graph.locator('[data-group]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.group))
  expect(groups.slice(0, 3)).toEqual(['Toolhead', 'Bed', 'Chamber and system'])
  const toolhead = await graph.locator('[data-group="Toolhead"] [data-legend]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.legend))
  expect(toolhead.slice(0, 2)).toEqual(['extruder', 'extruderPower'])
  expect(toolhead).toEqual(expect.arrayContaining(['temperature_sensor toolhead_fan_air', 'temperature_fan toolhead_heatsink', 'heater_fan hotend_fanSpeed']))
  expect(await graph.locator('[data-group="Bed"] [data-legend]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.legend))).toEqual(['heater_bed', 'heater_bedPower'])
  // Visible order on the page is the same as the data order.
  const tops = await graph.locator('[data-group]').evaluateAll(els => els.map(e => e.getBoundingClientRect().top * 10000 + e.getBoundingClientRect().left))
  expect(tops).toEqual([...tops].sort((a, b) => a - b))
})

type Box = { x: number, y: number, width: number, height: number }
function apart (boxes: Box[], gap = 4) {
  expect(boxes.length).toBeGreaterThanOrEqual(3)
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]; const b = boxes[j]
      const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width))
      const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height))
      expect(Math.max(dx, dy), `bubbles ${i} and ${j} are at least ${gap}px apart`).toBeGreaterThanOrEqual(gap)
    }
  }
}
const boxesOf = (page: Page, selector: string) => page.locator(selector).evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }))

test('Position X, Y and Z bubbles do not touch, at S, M and L', async ({ page, open, isMobile }) => {
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  const tile = cell(page, 'position')
  await tile.scrollIntoViewIfNeeded()
  const seen = new Set<string>()
  const measure = async () => {
    seen.add((await tile.getAttribute('data-size')) ?? '')
    await expect(tile.locator('[data-tid="axis"]')).toHaveCount(3)
    apart(await boxesOf(page, '[data-cell="position"] [data-tid="axis"]'))
  }
  await measure()
  if (!isMobile) {
    await edit(page)
    const grip = tile.getByTestId('tile-grip')
    await grip.focus()
    // Down to S first, then back up through M to L.
    await grip.press('Shift+ArrowLeft')
    await grip.press('Shift+ArrowLeft')
    await expect(tile).toHaveAttribute('data-size', 'S')
    await measure()
    for (let i = 0; i < 2; i++) {
      await grip.press('Shift+ArrowRight')
      await page.waitForTimeout(400)
      await measure()
    }
    await page.getByTestId('edit-done').click()
    expect([...seen].sort()).toEqual(['L', 'M', 'S'])
  }
})

test('Control: the X, Y and Z readout bubbles do not touch', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/control')
  const readout = page.getByTestId("move-position")
  await expect(readout).toBeVisible()
  apart(await boxesOf(page, '[data-tid="move-position"] [data-tid^="pos-"]'))
})
