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

/**
 * A point the pointer finds the part at: its middle (the hairline's dot),
 * else rings around it. (A part's middle can sit behind another part, as the
 * filament's does behind the plate, so the dot is not always on it.)
 */
async function pointOn (page: Page, part: string): Promise<{ x: number, y: number }> {
  const parts = page.getByTestId('m1-parts')
  const middle = await partPoint(page, part)
  const box = (await parts.boundingBox())!
  const off = { x: box.x + 4, y: box.y + 4 }
  const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const tries = [middle]
  for (const r of [24, 48, 80, 120]) {
    for (let k = 0; k < 8; k++) tries.push({ x: middle.x + r * Math.cos(k * Math.PI / 4), y: middle.y + r * Math.sin(k * Math.PI / 4) })
  }
  for (const at of tries) {
    if (at.x < box.x || at.y < box.y || at.x > box.x + box.width || at.y > box.y + box.height) continue
    // From off the model each time, so a glow left over from the last point can't pass for this one.
    await page.mouse.move(off.x, off.y)
    await expect(parts).toHaveAttribute('data-hovered', '')
    await page.mouse.move(at.x, at.y)
    await frame()
    if (await parts.getAttribute('data-hovered') === part) return at
  }
  throw new Error(`the pointer found no ${part} near its middle`)
}

/** A point on the stage well away from the model, the label (top right) and the chips (along the bottom once focused): its top left. */
async function emptyPoint (page: Page): Promise<{ x: number, y: number }> {
  const box = (await page.getByTestId('m1-parts').boundingBox())!
  return { x: box.x + 28, y: box.y + 28 }
}

/** Where the label's hairline meets the selected part, on the page. */
async function leaderDot (page: Page): Promise<{ x: number, y: number }> {
  return page.getByTestId('m1-parts').evaluate(el => {
    const dot = el.querySelector('.m1-parts__leader circle')!
    return { x: Number(dot.getAttribute('cx')), y: Number(dot.getAttribute('cy')) }
  })
}

test.describe('desktop pointer', () => {
  test.skip(({ isMobile }) => isMobile, 'hover is a desktop pointer thing')
  // Without the camera's lean to a selection, a part is where it was measured once it is let go.
  test.beforeEach(async ({ page }) => {
    // Pointer sweeps in software WebGL on a loaded CI runner outlast the default 90 s.
    test.slow()
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

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
  for (const part of ['plate', 'toolhead', 'filament', 'screen']) {
    test(`the ${part} selected stays selected off it, and a click on empty stage lets it go`, async ({ page, open }) => {
      const printer = await usePrinter(page, PRESETS.idleHomed())
      await open('/')
      const parts = await partsReady(page)
      const empty = await emptyPoint(page)
      const label = page.getByTestId('m1-parts-label')
      // On the simple model (no GPU) the spool and the screen sit behind the plate from most of the
      // stage, and sweeping for them in software WebGL outlasts the test: their chips select them.
      // A click on the screen zooms into it (its own test below): the screen is selected by its chip here.
      if (part !== 'screen' && (GPU || part === 'plate' || part === 'toolhead')) {
        const at = await pointOn(page, part)
        await page.mouse.click(at.x, at.y)
      } else {
        await page.getByTestId(`m1-part-${part}`).focus()
      }
      await expect(label).toHaveAttribute('data-part', part)

      // Off the part: still selected, however long the pointer stays away.
      await page.mouse.move(empty.x, empty.y)
      await page.waitForTimeout(500)
      await expect(label).toHaveAttribute('data-part', part)

      await page.mouse.click(empty.x, empty.y)
      await expect(label).toHaveCount(0)
      await expect(parts).toHaveAttribute('data-hovered', '')
      await expect(page.getByTestId(`m1-part-${part}`)).toHaveAttribute('aria-pressed', 'false')
      expect(printer.gcode).toEqual([])
    })
  }

  test('hover is instant and leaving an unselected part puts its glow out at once', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const parts = await partsReady(page)
    const at = await partPoint(page, 'plate')
    const empty = await emptyPoint(page)

    await page.mouse.move(at.x, at.y)
    await expect(parts).toHaveAttribute('data-hovered', 'plate', { timeout: 300 })
    await page.mouse.move(empty.x, empty.y)
    await expect(parts).toHaveAttribute('data-hovered', '', { timeout: 1500 })
    await expect(page.locator('.m1-live__canvas')).not.toHaveCSS('cursor', 'pointer')
    expect(printer.gcode).toEqual([])
  })

  test('a click on another part switches the selection to it', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await partsReady(page)
    // On the accurate model the toolhead turns the view straight down, moving the plate: use the spool there.
    const other = GPU ? 'filament' : 'toolhead'
    const plate = await pointOn(page, 'plate')
    const there = await pointOn(page, other)

    await page.mouse.click(there.x, there.y)
    const label = page.getByTestId('m1-parts-label')
    await expect(label).toHaveAttribute('data-part', other)
    await page.mouse.click(plate.x, plate.y)
    await expect(label).toHaveAttribute('data-part', 'plate')
    await expect(page.getByTestId(`m1-part-${other}`)).toHaveAttribute('aria-pressed', 'false')
    expect(printer.gcode).toEqual([])
  })

  test('the plate selected holds the camera: a drag on empty stage keeps it selected and the view still', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await partsReady(page)
    const at = await partPoint(page, 'plate')
    const empty = await emptyPoint(page)

    await page.mouse.click(at.x, at.y)
    const label = page.getByTestId('m1-parts-label')
    await expect(label).toHaveAttribute('data-part', 'plate')
    // The handle is on the accurate model, whose millimetres a drag is read in.
    if (GPU) await expect(page.getByTestId('m1-plate-handle')).toBeVisible()
    await page.waitForTimeout(900)
    const before = await leaderDot(page)

    await page.mouse.move(empty.x, empty.y)
    await page.mouse.down()
    await page.mouse.move(empty.x + 120, empty.y - 30, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    await expect(label).toHaveAttribute('data-part', 'plate')
    const after = await leaderDot(page)
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(2)
    expect(printer.gcode).toEqual([])
  })
})

/** Click the screen by its chip (hidden on a desktop until focused): on the simple model the screen itself is small. */
async function clickScreen (page: Page) {
  const chip = page.getByTestId('m1-part-screen')
  await chip.focus()
  await chip.press('Enter')
}

test('a click on the screen flies the camera in to it and shows its empty state; Esc flies back', async ({ page, open }) => {
  test.slow()
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const parts = await partsReady(page)
  const screen = page.getByTestId('m1-screen')

  await clickScreen(page)
  await expect(screen).toHaveAttribute('data-phase', 'open')
  await expect(parts).toHaveAttribute('data-view', 'screen')
  await expect(page.getByTestId('m1-screen-empty')).toHaveText("The printer's screen isn't available here yet")
  // It zooms out of where the screen is on the model.
  const fly = await screen.evaluate(el => [el.style.getPropertyValue('--fly-x'), el.style.getPropertyValue('--fly-y')])
  expect(fly.every(v => /^-?\d+px$/.test(v))).toBe(true)

  // Esc flies back out to the model; the screen stays selected there.
  await page.keyboard.press('Escape')
  await expect(screen).toHaveCount(0)
  await expect(parts).toHaveAttribute('data-view', 'free')
  await expect(page.getByTestId('m1-parts-label')).toHaveAttribute('data-part', 'screen')
  expect(printer.gcode).toEqual([])
})

test('Done or a click outside the screen fly back out too', async ({ page, open }) => {
  test.slow()
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const parts = await partsReady(page)
  const screen = page.getByTestId('m1-screen')

  await clickScreen(page)
  await expect(screen).toHaveAttribute('data-phase', 'open')
  await page.getByTestId('m1-screen-done').click()
  await expect(screen).toHaveCount(0)
  await expect(parts).toHaveAttribute('data-view', 'free')

  await clickScreen(page)
  await expect(screen).toHaveAttribute('data-phase', 'open')
  const box = (await screen.boundingBox())!
  await page.mouse.click(box.x + 20, box.y + box.height - 20)
  await expect(screen).toHaveCount(0)
  await expect(parts).toHaveAttribute('data-view', 'free')
  expect(printer.gcode).toEqual([])
})

test('while it prints, a click on the screen does not zoom into it', async ({ page, open }) => {
  const printer = await usePrinter(page) // the shared mock as it is: mid-print
  await open('/')
  const parts = await partsReady(page)
  await expect(parts).toHaveAttribute('data-interactive', 'off')
  await clickScreen(page)
  await expect(page.getByTestId('m1-parts-label')).toHaveAttribute('data-part', 'screen')
  await page.waitForTimeout(800)
  await expect(page.getByTestId('m1-screen')).toHaveCount(0)
  await expect(parts).not.toHaveAttribute('data-view', 'screen')
  expect(printer.gcode).toEqual([])
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
  await expect(page.getByTestId('m1-part-toolhead')).toHaveAttribute('aria-label', /^Toolhead, \d+ °C · (X \d+ Y \d+|not homed)$/)

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
