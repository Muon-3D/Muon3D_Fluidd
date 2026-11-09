/**
 * Overview: pointing at the parts of the 3D M1 (control-mockups/v3/overview-3d).
 *
 * Hovering the plate or the toolhead glows it; a click (or the keyboard, or
 * a chip) selects it, and only then a panel names it with one live fact,
 * joined to the part by a hairline; while it prints a part is only named. Nothing here sends anything to the printer: step 1 has no
 * options yet, and every test checks the page sent no G-code.
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

/**
 * The photoreal M1 in software WebGL (SwiftShader) costs seconds a frame and
 * stalls the page, so on Windows the browser draws on the real GPU. Elsewhere
 * (Linux CI, no GPU) the stage uses the simple model with plain glass, which
 * has the same four parts under other node names (parts.ts).
 */
const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})
// Software WebGL under the whole default Overview (Movement included) takes seconds a step on a CI runner.
test.slow(!GPU, 'software WebGL')

/** The live M1 has drawn and its parts layer is up. */
async function partsReady (page: Page): Promise<Locator> {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  const parts = page.getByTestId('m1-parts')
  await expect(parts).toBeAttached()
  return parts
}

/** The part's middle on the page: where the label's hairline starts once the part is selected by its chip. */
async function partPoint (page: Page, part: string): Promise<{ x: number, y: number }> {
  await page.getByTestId(`m1-part-${part}`).focus()
  const label = page.getByTestId('m1-parts-label')
  await expect(label).toHaveAttribute('data-part', part)
  // Let the line follow the camera's lean to rest.
  await page.waitForTimeout(900)
  const point = await page.getByTestId('m1-parts').evaluate(el => {
    const dot = el.querySelector('.m1-parts__leader circle')!
    const stage = el.getBoundingClientRect()
    return { x: stage.left + Number(dot.getAttribute('cx')), y: stage.top + Number(dot.getAttribute('cy')) }
  })
  await page.keyboard.press('Escape')
  await page.getByTestId(`m1-part-${part}`).blur()
  await expect(label).toHaveCount(0)
  return point
}

test.describe('desktop pointer', () => {
  test.skip(({ isMobile }) => isMobile, 'hover is a desktop pointer thing')

  test('hovering the plate glows it without a label, and leaving puts it out', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const parts = await partsReady(page)
    await expect(parts).toHaveAttribute('data-interactive', 'on')

    const at = await partPoint(page, 'plate')
    await page.mouse.move(at.x, at.y)
    await expect(parts).toHaveAttribute('data-hovered', 'plate')
    await expect(page.getByTestId('m1-parts-label')).toHaveCount(0)
    await expect(page.locator('.m1-live__canvas')).toHaveCSS('cursor', 'pointer')

    // Off the printer, into the page's margin: out after the leave delay.
    await page.mouse.move(5, 5)
    await expect(parts).toHaveAttribute('data-hovered', '')
    expect(printer.gcode).toEqual([])
  })

  test('a click selects a part and Esc lets it go; a drag selects nothing', async ({ page, open }) => {
    // A drag turns the model, redrawing every frame: in software WebGL (CI) that stalls the page for seconds.
    test.skip(!GPU, 'turning the model needs the GPU')
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await partsReady(page)
    const at = await partPoint(page, 'plate')

    await page.mouse.click(at.x, at.y)
    await expect(page.getByTestId('m1-part-plate')).toHaveAttribute('aria-pressed', 'true')
    const label = page.getByTestId('m1-parts-label')
    await expect(label).toContainText('Build plate')
    await expect(label).toContainText(/°C · (mesh loaded|no mesh)/)
    await expect(page.locator('.m1-parts__leader line')).toHaveCount(1)
    await page.mouse.move(5, 5)
    // Selected, so it stays named after the pointer has gone.
    await page.waitForTimeout(800)
    await expect(page.getByTestId('m1-parts-label')).toHaveAttribute('data-part', 'plate')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('m1-parts-label')).toHaveCount(0)

    // With nothing selected, a drag that starts on the part turns the model and selects nothing.
    // (The toolhead is not used here: selecting it looks straight down.)
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 80, at.y + 10, { steps: 6 })
    await page.mouse.up()
    await expect(page.getByTestId('m1-part-plate')).toHaveAttribute('aria-pressed', 'false')
    expect(printer.gcode).toEqual([])
  })
})

test('the keyboard reaches every part: arrows and 1–4 move, Esc clears', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'the keyboard path is the desktop one')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await partsReady(page)

  const chips = page.getByTestId('m1-parts').getByRole('toolbar')
  await page.getByTestId('m1-part-plate').focus()
  await expect(chips).toBeVisible()
  const label = page.getByTestId('m1-parts-label')
  await expect(label).toHaveAttribute('data-part', 'plate')

  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('m1-part-toolhead')).toBeFocused()
  await expect(label).toHaveAttribute('data-part', 'toolhead')
  await expect(page.getByTestId('m1-part-toolhead')).toHaveAttribute('aria-label', /^Toolhead, \d+ °C · (homed|not homed)$/)

  await page.keyboard.press('4')
  await expect(page.getByTestId('m1-part-screen')).toBeFocused()
  await expect(label).toHaveAttribute('data-part', 'screen')

  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('m1-part-plate')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(label).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})

test('while it prints, a part is only named: white, and no options', async ({ page, open }) => {
  const printer = await usePrinter(page) // the shared mock as it is: mid-print
  await open('/')
  const parts = await partsReady(page)
  await expect(parts).toHaveAttribute('data-interactive', 'off')

  await page.getByTestId('m1-part-filament').focus()
  const label = page.getByTestId('m1-parts-label')
  await expect(label).toHaveAttribute('data-part', 'filament')
  await expect(label).toHaveClass(/m1-parts__label--info/)
  expect(printer.gcode).toEqual([])
})

test('on a phone the parts are chips under the model; a tap names one', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'the chip row is the touch path')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await partsReady(page)

  const chip = page.getByTestId('m1-part-filament')
  await expect(chip).toBeVisible()
  await chip.tap()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('m1-parts-label')).toContainText('Filament')
  expect(printer.gcode).toEqual([])
})
