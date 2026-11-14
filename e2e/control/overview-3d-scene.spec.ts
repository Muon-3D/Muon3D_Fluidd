/**
 * Overview, the 3D scene (KAN-2079): the toolhead's axes sit inside the
 * screen, along the head's reach; the filament has a hover with its actions;
 * and nothing here moves the printer on its own.
 *
 * Every script the page sends is answered by usePrinter, so nothing reaches
 * the shared mock. The filament actions go through runFilamentPlan only, so
 * the one thing a click may send is LOAD_FILAMENT / UNLOAD_FILAMENT.
 * (Where the strand ends is a unit test: accurate-spool.spec.ts.)
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

// About the 3D stage: it needs WebGL, which the e2e fixtures turn off by default (KAN-2781).
test.use({ webgl: true })

const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})
test.slow(!GPU, 'software WebGL')

/** The M1's LOAD_FILAMENT and UNLOAD_FILAMENT, as macros the page can see (as filament-change.spec.ts). */
const M1_MACROS = {
  'gcode_macro LOAD_FILAMENT': {},
  'gcode_macro UNLOAD_FILAMENT': {},
  configfile: {
    settings: {
      'gcode_macro load_filament': { gcode: 'FILAMENT_INSERT_FLOW {rawparams}' },
      'gcode_macro unload_filament': { gcode: 'M104 S250\nG1 E-30 F3600' }
    }
  }
}

async function partsReady (page: Page): Promise<Locator> {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  const parts = page.getByTestId('m1-parts')
  await expect(parts).toBeAttached()
  return parts
}

test('the axes sit inside the screen, along the head\'s reach, not at the stage edge', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'the top-down view is the desktop pointer path')
  test.skip(!GPU, 'the top-down view needs the accurate model (viewer.accurate), which software WebGL stalls on; the simple model stays in the free view')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await partsReady(page)
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
  await expect(page.getByTestId('m1-axes')).toContainText('100')
  const bounds = page.getByTestId('m1-bounds')
  await expect(bounds).toBeAttached()
  await expect(bounds.locator('.m1-parts__bounds-corners')).toHaveAttribute('d', /^M\d/)

  await page.waitForTimeout(1500)
  const geometry = await page.getByTestId('m1-parts').evaluate(el => {
    const stage = el.getBoundingClientRect()
    const rel = (r: DOMRect) => ({ left: r.left - stage.left, right: r.right - stage.left, top: r.top - stage.top, bottom: r.bottom - stage.top })
    const corners = el.querySelector('.m1-parts__bounds-corners') as SVGGraphicsElement
    return {
      stage: { width: stage.width, height: stage.height },
      reach: rel(corners.getBoundingClientRect()),
      xTicks: [...el.querySelectorAll('.m1-parts__tick--x')].map(t => rel(t.getBoundingClientRect())),
      yTicks: [...el.querySelectorAll('.m1-parts__tick--y')].map(t => rel(t.getBoundingClientRect())),
      xName: rel(el.querySelector('.m1-parts__axis-name--x')!.getBoundingClientRect()),
      yName: rel(el.querySelector('.m1-parts__axis-name--y')!.getBoundingClientRect())
    }
  })
  const slack = 40
  // The marks follow the reach's own outline, a little outside it: not parked at the stage's bottom and left.
  for (const t of geometry.xTicks) {
    expect(t.top).toBeGreaterThan(geometry.reach.top - slack)
    expect(t.top).toBeLessThan(geometry.reach.bottom + slack)
  }
  for (const t of geometry.yTicks) {
    expect(t.left).toBeGreaterThan(geometry.reach.left - slack - 40)
    expect(t.right).toBeLessThan(geometry.reach.right + slack)
  }
  expect(geometry.xTicks.length).toBeGreaterThan(1)
  expect(geometry.yTicks.length).toBeGreaterThan(1)
  // And every mark and name is on the stage.
  for (const r of [...geometry.xTicks, ...geometry.yTicks, geometry.xName, geometry.yName]) {
    expect(r.left).toBeGreaterThanOrEqual(0)
    expect(r.top).toBeGreaterThanOrEqual(0)
    expect(r.right).toBeLessThanOrEqual(geometry.stage.width)
    expect(r.bottom).toBeLessThanOrEqual(geometry.stage.height)
  }
  expect(printer.gcode).toEqual([])
})

test('hovering the filament lights it, and a click offers Load, Unload and the material', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'hover is a desktop pointer thing; the phone test below taps the chip')
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), M1_MACROS))
  await open('/')
  const parts = await partsReady(page)
  await expect(parts).toHaveAttribute('data-interactive', 'on')

  // Sweep the stage for the filament (the spool and the hose, wherever the camera has them) until the pointer lights it.
  // A pick answers the next frame, so each stop moves twice and reads after the second.
  const box = (await page.locator('.m1-live__canvas').boundingBox())!
  let at: { x: number, y: number } | null = null
  for (let y = box.y + box.height * 0.2; y < box.y + box.height * 0.95 && !at; y += 30) {
    for (let x = box.x + box.width * 0.2; x < box.x + box.width * 0.85 && !at; x += 30) {
      await page.mouse.move(x, y)
      await page.waitForTimeout(50)
      await page.mouse.move(x + 1, y)
      await page.waitForTimeout(70)
      if (await parts.getAttribute('data-hovered') === 'filament') at = { x: x + 1, y }
    }
  }
  expect(at, 'the filament lights somewhere on the stage').not.toBeNull()
  // Off the printer it goes out; back on it, it lights again.
  await page.mouse.move(5, 5)
  await expect(parts).toHaveAttribute('data-hovered', '')
  await page.mouse.move(at!.x - 1, at!.y)
  await page.mouse.move(at!.x, at!.y)
  await expect(parts).toHaveAttribute('data-hovered', 'filament')
  await page.mouse.click(at!.x, at!.y)
  await expect(page.getByTestId('m1-options-filament')).toBeVisible()
  await expect(page.getByTestId('m1-load')).toBeEnabled()
  await expect(page.getByTestId('m1-unload')).toBeEnabled()
  await expect(page.getByTestId('m1-material')).toBeVisible()
  // Hover and selecting send nothing.
  expect(printer.gcode).toEqual([])

  await page.getByTestId('m1-load').click()
  await expect.poll(() => printer.gcode).toEqual(['LOAD_FILAMENT'])
  await page.getByTestId('m1-unload').click()
  await expect.poll(() => printer.gcode).toEqual(['LOAD_FILAMENT', 'UNLOAD_FILAMENT'])
  // Nothing but the filament plans, and no motion.
  expect(printer.moves()).toEqual([])
})

test('on a phone, the filament chip offers Load and Unload through the same plans', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'the chip row is the touch path')
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), M1_MACROS))
  await open('/')
  await partsReady(page)
  await page.getByTestId('m1-part-filament').tap()
  await expect(page.getByTestId('m1-options-filament')).toBeVisible()
  expect(printer.gcode).toEqual([])
  await page.getByTestId('m1-load').tap()
  await expect.poll(() => printer.gcode).toEqual(['LOAD_FILAMENT'])
  expect(printer.moves()).toEqual([])
})
