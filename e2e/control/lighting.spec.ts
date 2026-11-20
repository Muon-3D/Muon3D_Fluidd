/**
 * Lighting (KAN-4767): the Lighting page under Control and the Lighting widget
 * at S, M and L, against a mocked Moonraker that reports an LED_MODE macro.
 *
 * The printer is Boxwood's mock with `gcode_macro LED_MODE` laid over it, and
 * its database kept per test (`database: true`), so presets and favourites are
 * seeded and read back without touching the shared mock. Every G-code script
 * the page sends is recorded, so each test checks the exact LED_MODE line.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'
import { hexToHue, hueToHex, BUILTIN_PRESETS } from '../../src/services/control/lights'
import { MOCK_PORT } from '../ports'

/** Solid red, 80%: hues 0 and 240 round-trip exactly. */
const LED = { 'gcode_macro LED_MODE': { mode: 'solid', h: 0, h2: 240, bright: 80, speed: 55 } }
const idle = () => overlay(PRESETS.idleHomed(), LED)
const ledScripts = (gcode: string[]) => gcode.filter(s => s.startsWith('LED_MODE'))

const saved = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `u${i}`, name: `Mine ${i}`, effect: 'gradient', colors: [hueToHex(10 + i * 20), hueToHex(200 + i * 10)] }))

async function lightsPrinter (page: Page, options: { presets?: number; favourites?: string[]; status?: Record<string, unknown>; stamps?: number[] } = {}) {
  const stamps = options.stamps
  const printer = await usePrinter(page, options.status ?? idle(), {
    database: true,
    onSocketEvent: (event, method) => { if (stamps && event === 'send' && method === 'printer.gcode.script') stamps.push(Date.now()) }
  })
  // The library lives in Control's own namespace, where muon-link lets a guest write: fluidd, lights.library.
  const library: Record<string, unknown> = {}
  if (options.presets) library.presets = saved(options.presets)
  if (options.favourites) library.favourites = options.favourites
  printer.database.fluidd = { lights: { library } }
  return printer
}

const stored = (printer: { database: Record<string, any> }) => printer.database.fluidd.lights.library as Record<string, any>
const cell = (page: Page, id: string) => page.locator(`[data-cell="${id}"]`)

/** Lighting is on the Overview by default at L (I-542): L is already there; a smaller one is put away and added again at that size. */
async function addLightingWidget (page: Page, size: 'S' | 'M' | 'L') {
  if (size === 'L') { await expect(page.locator('[data-tile="lighting"]')).toBeVisible(); return }
  await page.getByTestId('edit-open').click()
  await cell(page, 'lighting').getByTestId('tile-remove').click()
  await page.getByTestId('widget-sheet-open').click()
  await page.getByTestId(`widget-size-lighting-${size}`).click()
  await page.getByTestId('widget-add-lighting').click()
  await page.getByTestId('widget-sheet-close').click()
  await page.getByTestId('edit-done').click()
  await expect(page.locator('[data-tile="lighting"]')).toBeVisible()
}

test.describe('the Lighting page, under Control', () => {
  test('is a tab beside Control and opens the lights', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/control')
    await page.getByRole('link', { name: 'Lighting' }).first().click()
    await expect(page).toHaveURL(/\/lighting$/)
    await expect(page.getByTestId('lighting-page')).toBeVisible()
    await expect(page.getByTestId('lights-plan')).toBeVisible()
    await expect(page.getByTestId('lighting-summary')).toHaveText('Solid · 80%')
  })

  test('says so on a printer with no LED_MODE, and offers nothing to set', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/lighting')
    await expect(page.getByTestId('lighting-unavailable')).toBeVisible()
    await expect(page.getByTestId('lighting-master')).toHaveCount(0)
  })

  test('an effect, a swatch and the switch each send the right LED_MODE line', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    await open('/lighting')
    await page.getByTestId('effect-gradient').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe('LED_MODE MODE=gradient H=0 H2=240 BRIGHT=80 SPEED=55')

    // Swatch 4 is hue 72 (15 hues, 24 apart), for the first colour.
    await page.getByTestId('swatch-3').click()
    const h = hexToHue(hueToHex(72))
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toBe(`LED_MODE MODE=gradient H=${h} H2=240 BRIGHT=80 SPEED=55`)

    await page.getByTestId('lighting-master').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toBe('LED_MODE MODE=off')
    await expect(page.getByTestId('lighting-master')).toHaveAttribute('aria-checked', 'false')
  })

  test('hides what LED_MODE cannot do instead of faking it', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    // No per-strip zones: nothing to tap, and it says both strips.
    await expect(page.getByRole('button', { name: /Select the (Left|Right) strip/ })).toHaveCount(0)
    await expect(page.getByTestId('lighting-zones')).toContainText('Both strips')
    // Only the effects the macro has.
    const effects = page.getByTestId('lighting-effect').getByRole('radio')
    await expect(effects).toHaveText(['Solid', 'Gradient', 'Rainbow', 'Breathe', 'Chase', 'Status'])
    for (const missing of ['Comet', 'Wave', 'Sparkle', 'Progress']) await expect(page.getByRole('radio', { name: missing })).toHaveCount(0)
    // One colour for Solid; two, never more, for Gradient; and no Add colour.
    await expect(page.getByTestId('lighting-colour').locator('input[type=color]')).toHaveCount(1)
    await page.getByTestId('effect-gradient').click()
    await expect(page.getByTestId('lighting-colour').locator('input[type=color]')).toHaveCount(2)
    await expect(page.getByRole('button', { name: /Add colour/i })).toHaveCount(0)
    // The API card has Settings only, and says frames come with the printer update.
    await expect(page.getByTestId('lighting-api').getByRole('tab')).toHaveText(['Settings', 'Read'])
    await expect(page.getByTestId('swatch-white')).toHaveCount(0)
    await expect(page.getByText(/no white/i)).toHaveCount(0)
    await expect(page.getByTestId('lighting-api')).toContainText('Per-LED frames come with the printer update')
    await expect(page.getByTestId('api-text')).toContainText('LED_MODE MODE=gradient')
  })

  test('Speed is off for an effect that has none', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    await expect(page.getByTestId('speed')).toBeDisabled()
    await page.getByTestId('effect-breathe').click()
    await expect(page.getByTestId('speed')).toBeEnabled()
  })

  test('a dragged slider reaches the printer at no more than three a second, the latest last', async ({ page, open }) => {
    const stamps: number[] = []
    const printer = await lightsPrinter(page, { stamps })
    await open('/lighting')
    const events = await page.getByTestId('brightness').evaluate(async el => {
      const input = el as HTMLInputElement
      let n = 0
      for (let v = 10; v <= 90; v += 2) {
        input.value = String(v)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        n++
        await new Promise(resolve => setTimeout(resolve, 25))
      }
      return n
    })
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toBe('LED_MODE MODE=solid H=0 H2=0 BRIGHT=90 SPEED=55')
    const sent = ledScripts(printer.gcode)
    expect(events).toBe(41)
    // Negative control: unthrottled, every one of the 41 changes would have gone.
    expect(sent.length).toBeGreaterThan(1)
    expect(sent.length).toBeLessThan(events / 5)
    for (const t of stamps) expect(stamps.filter(u => u >= t && u < t + 1000).length).toBeLessThanOrEqual(3)
  })

  test('says lights show after the print while printing', async ({ page, open }) => {
    await lightsPrinter(page, { status: overlay(idle(), { print_stats: { state: 'printing', filename: 'part.gcode' }, idle_timeout: { state: 'Printing' } }) })
    await open('/lighting')
    await expect(page.getByTestId('lighting-printing')).toBeVisible()
  })

  test('has no sideways scroll at 390 px, with the presets popup open too', async ({ page, open }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await lightsPrinter(page, { presets: 6 })
    await open('/lighting')
    await expect(page.getByTestId('lighting-page')).toBeVisible()
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(await overflow()).toBeLessThanOrEqual(0)
    await page.getByTestId('presets-more').click()
    await expect(page.getByTestId('presets-popup')).toBeVisible()
    expect(await overflow()).toBeLessThanOrEqual(0)
  })
})

test.describe('presets and favourites', () => {
  test('with exactly eight there is no More', async ({ page, open }) => {
    await lightsPrinter(page, { presets: 2 })
    await open('/lighting')
    await expect(page.getByTestId('preset-grid').getByRole('button')).toHaveCount(8)
    await expect(page.getByTestId('presets-more')).toHaveCount(0)
  })

  test('with twelve there are seven favourites and +5 More, which opens the list', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { presets: 6 })
    await open('/lighting')
    await expect(page.getByTestId('presets-more')).toContainText('+5')
    await expect(page.getByTestId('preset-grid').getByRole('button')).toHaveCount(8)
    await expect(page.getByTestId('preset-grid').locator('[aria-pressed]')).toHaveCount(7)
    await page.getByTestId('presets-more').click()
    await expect(page.getByTestId('presets-count')).toHaveText('Favourites 7 of 7')
    await expect(page.locator('[data-tid^="preset-tile-"]')).toHaveCount(12)

    // An eighth star is refused, and says why.
    const unstarred = page.getByTestId('preset-star-u1')
    await expect(unstarred).toHaveAttribute('aria-pressed', 'false')
    await unstarred.click()
    await expect(page.getByTestId('presets-hint')).toHaveText('You can have 7 favourites. Remove one to add another.')
    await expect(page.getByTestId('presets-count')).toHaveText('Favourites 7 of 7')
    await expect(page.locator('[data-tid^="preset-star-"][aria-pressed="true"]')).toHaveCount(7)

    // Negative control: take one off and the same star now works.
    await page.getByTestId('preset-star-b0').click()
    await expect(page.getByTestId('presets-count')).toHaveText('Favourites 6 of 7')
    await unstarred.click()
    await expect(page.getByTestId('presets-count')).toHaveText('Favourites 7 of 7')
    await expect(page.getByTestId('presets-hint')).toHaveText('')

    await page.getByTestId('presets-done').click()
    await expect(page.getByTestId('presets-popup')).toHaveCount(0)
    await expect.poll(() => (stored(printer).favourites as string[] | undefined)?.length).toBe(7)
    expect(stored(printer).favourites).not.toContain('b0')
    expect(stored(printer).favourites).toContain('u1')
  })

  test('Cancel keeps the favourites as they were', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { presets: 6, favourites: ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'u0'] })
    await open('/lighting')
    await page.getByTestId('presets-more').click()
    await page.getByTestId('preset-star-b0').click()
    await expect(page.getByTestId('presets-count')).toHaveText('Favourites 6 of 7')
    await page.getByTestId('presets-cancel').click()
    await expect(page.getByTestId('preset-b0')).toBeVisible()
    expect(stored(printer).favourites).toEqual(['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'u0'])
  })

  test('a preset box sends its LED_MODE line', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    await open('/lighting')
    await page.getByTestId('preset-b4').click()
    const sunset = BUILTIN_PRESETS.find(p => p.id === 'b4')!
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe(`LED_MODE MODE=gradient H=${hexToHue(sunset.colors[0])} H2=${hexToHue(sunset.colors[1])} BRIGHT=80 SPEED=55`)
  })

  test('saving the lights as a preset keeps it in Moonraker and stars it', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { favourites: ['b0'] })
    await open('/lighting')
    await page.getByTestId('effect-breathe').click()
    await page.getByTestId('preset-name').fill('Night shift')
    await page.getByTestId('preset-save').click()
    await expect(page.getByTestId('preset-note')).toHaveText('Saved, and added to your presets.')
    await expect(page.getByTestId('lighting-presets')).toContainText('Night shift')
    const mine = stored(printer).presets as Array<{ name: string; effect: string }>
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({ name: 'Night shift', effect: 'breathe' })
    expect(stored(printer).favourites).toHaveLength(2)
  })
})

test.describe('the preview', () => {
  const RAINBOW = overlay(PRESETS.idleHomed(), { 'gcode_macro LED_MODE': { mode: 'rainbow', h: 0, h2: 0, bright: 80, speed: 90 } })

  async function redraws (page: Page, ms: number) {
    return page.getByTestId('lights-plan').evaluate((plan, wait) => new Promise<number>(resolve => {
      const dot = plan.querySelector('[data-tid="lights-dot"]')!
      let n = 0
      const watch = new MutationObserver(records => { n += records.filter(r => r.attributeName === 'fill').length })
      watch.observe(dot, { attributes: true })
      setTimeout(() => { watch.disconnect(); resolve(n) }, wait)
    }), ms)
  }

  test('animates the current effect at no more than 15 frames a second, and reads nothing from the printer per frame', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { status: RAINBOW })
    await open('/lighting')
    await expect(page.getByTestId('lights-plan')).toBeVisible()
    const callsBefore = printer.calls.length
    const frames = await redraws(page, 2000)
    expect(frames).toBeGreaterThan(8)
    expect(frames).toBeLessThanOrEqual(2 * 15 + 1)
    // Only the printer's own status pushes arrive: nothing is asked for.
    const asked = printer.calls.slice(callsBefore).map(c => c.method)
    expect(asked.filter(m => m === 'printer.gcode.script' || m.startsWith('server.database') || m === 'printer.objects.query')).toEqual([])
  })

  test('negative control: under reduced motion it draws one still frame', async ({ page, open }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await lightsPrinter(page, { status: RAINBOW })
    await open('/lighting')
    await expect(page.getByTestId('lights-plan')).toBeVisible()
    expect(await redraws(page, 1200)).toBe(0)
  })

  test('is the current effect: solid stays still', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    await expect(page.getByTestId('lights-plan')).toBeVisible()
    expect(await redraws(page, 1000)).toBe(0)
  })
})

test.describe('the Lighting widget', () => {
  test.skip(({ isMobile }) => isMobile, 'Sizes are chosen on the desktop grid.')

  test('Small: the switch turns the lights off, a tap goes to the next preset', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    await open('/')
    await addLightingWidget(page, 'S')
    const tile = page.locator('[data-tile="lighting"]')
    await expect(tile).toContainText('Tap for next')
    await expect(tile.getByTestId('lights-strip')).toHaveCount(0)
    await tile.getByTestId('lighting-power').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe('LED_MODE MODE=off')
    await expect(tile.getByTestId('lighting-power')).toHaveAttribute('aria-pressed', 'false')
    // Next preset from the first one, turning the lights back on.
    await tile.getByTestId('lighting-next').click()
    const first = BUILTIN_PRESETS[0]
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe(`LED_MODE MODE=${first.effect} H=${hexToHue(first.colors[0])} H2=${hexToHue(first.colors[0])} BRIGHT=80 SPEED=55`)
    await expect(tile.getByTestId('lighting-power')).toHaveAttribute('aria-pressed', 'true')
  })

  test('Medium: the strip, the brightness and the preset pills', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    await open('/')
    await addLightingWidget(page, 'M')
    const tile = page.locator('[data-tile="lighting"]')
    await expect(tile.getByTestId('lights-strip')).toBeVisible()
    await expect(tile.getByTestId('lighting-swatch-0')).toHaveCount(0)
    await expect(tile.getByTestId('lighting-pill-b3')).toBeVisible()
    await tile.getByTestId('lighting-pill-b3').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe(`LED_MODE MODE=breathe H=${hexToHue(BUILTIN_PRESETS[3].colors[0])} H2=${hexToHue(BUILTIN_PRESETS[3].colors[0])} BRIGHT=80 SPEED=55`)
    await expect(tile.getByTestId('lighting-pill-b3')).toHaveAttribute('aria-pressed', 'true')
    await tile.getByTestId('lighting-brightness').fill('35')
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toContain('BRIGHT=35')
  })

  test('Large: the colour ring, speed and the effect list', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    await open('/')
    await addLightingWidget(page, 'L')
    const tile = page.locator('[data-tile="lighting"]')
    await tile.getByTestId('lighting-swatch-5').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe(`LED_MODE MODE=solid H=${hexToHue(hueToHex(180))} H2=${hexToHue(hueToHex(180))} BRIGHT=80 SPEED=55`)

    await tile.getByTestId('lighting-effect').click()
    await expect(tile.getByRole('option')).toHaveText(['Solid', 'Gradient', 'Rainbow', 'Breathe', 'Chase', 'Status'])
    await tile.getByTestId('lighting-effect-chase').click()
    await expect(tile.getByRole('listbox')).toHaveCount(0)
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toMatch(/^LED_MODE MODE=chase H=\d+ H2=240 BRIGHT=80 SPEED=55$/)

    await tile.getByTestId('lighting-speed').fill('90')
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toContain('SPEED=90')
  })

  test('negative control: with no LED_MODE the widget sets nothing', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await addLightingWidget(page, 'M')
    const tile = page.locator('[data-tile="lighting"]')
    await expect(tile.getByTestId('lighting-unavailable')).toBeVisible()
    await expect(tile.getByTestId('lighting-power')).toHaveCount(0)
    expect(ledScripts(printer.gcode)).toEqual([])
  })
})

test.describe('what the printer refuses', () => {
  const refuse = (page: Page) => page.route(/\/server\/database\/item/, route => route.request().method() === 'POST'
    ? route.fulfill({ status: 403, json: { error: { code: 403, message: 'Forbidden' } } })
    : route.fallback())

  test('a refused save says so plainly, not that the printer may be unreachable', async ({ page, open }) => {
    await lightsPrinter(page)
    await refuse(page)
    await open('/lighting')
    await page.getByTestId('preset-name').fill('Night shift')
    await page.getByTestId('preset-save').click()
    await expect(page.getByTestId('lighting-error')).toContainText('The printer refused that save')
    await expect(page.getByTestId('lighting-error')).not.toContainText(/reachable/i)
    await expect(page.getByTestId('lighting-presets')).not.toContainText('Night shift')
  })

  test('negative control: with saves allowed there is no message', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    await page.getByTestId('preset-name').fill('Night shift')
    await page.getByTestId('preset-save').click()
    await expect(page.getByTestId('lighting-presets')).toContainText('Night shift')
    await expect(page.getByTestId('lighting-error')).toHaveCount(0)
  })

  test('a refused change shows an inline message and raises no error', async ({ page, open }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    const printer = await lightsPrinter(page)
    await open('/lighting')
    await page.getByTestId('effect-gradient').click()
    await expect.poll(() => ledScripts(printer.gcode).length).toBe(1)
    await expect(page.getByTestId('lighting-error')).toHaveCount(0)
    printer.state.failOn['printer.gcode.script'] = 'Forbidden'
    await page.getByTestId('effect-chase').click()
    await expect(page.getByTestId('lighting-error')).toHaveText('The printer refused that change.')
    expect(errors).toEqual([])
  })
})

test.describe('the library moves to the fluidd namespace', () => {
  test('one time: a library in the old muon_lights namespace is read, and written to the new key', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    printer.database.fluidd = {}
    printer.database.muon_lights = { presets: saved(6), favourites: ['b3', 'b2', 'u0', 'b4', 'b0', 'b1', 'b5'] }
    await open('/lighting')
    await expect(page.getByTestId('presets-more')).toContainText('+5')
    await expect.poll(() => (printer.database.fluidd.lights?.library?.presets ?? []).length).toBe(6)
  })

  test('negative control: with a library in the new place the old one is ignored', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { presets: 2 })
    printer.database.muon_lights = { presets: saved(6) }
    await open('/lighting')
    await expect(page.getByTestId('preset-grid').getByRole('button')).toHaveCount(8)
    await expect(page.getByTestId('presets-more')).toHaveCount(0)
    expect(stored(printer).presets).toHaveLength(2)
  })
})

const SAT_LED = { 'gcode_macro LED_MODE': { mode: 'solid', h: 0, h2: 240, bright: 80, speed: 55, sat: 100 } }

test.describe('the preview, stripped back', () => {
  test('has no labels, no stray dot and no caption', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    const plan = page.getByTestId('lights-plan')
    await expect(plan).toBeVisible()
    for (const text of ['Spine', 'Display', 'Left · 40', 'Right · 40', 'M1 from above']) await expect(plan).not.toContainText(text)
    await expect(plan.locator('text')).toHaveCount(0)
    await expect(plan.locator('.lp__dot')).toHaveCount(0)
    await expect(page.getByText('Plan view from above')).toHaveCount(0)
  })

  test('both strips and every LED with its glow sit inside the slot, at this width', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    await expect(page.getByTestId('lights-plan')).toBeVisible()
    const result = await page.getByTestId('lights-plan').evaluate(plan => {
      const slot = plan.querySelector('.lp__slot') as unknown as SVGGeometryElement
      const inside = (x: number, y: number) => slot.isPointInFill(new DOMPoint(x, y))
      const outside: string[] = []
      for (const strip of Array.from(plan.querySelectorAll('.lp__strip')) as SVGPolygonElement[]) {
        for (const p of Array.from(strip.points)) if (!inside(p.x, p.y)) outside.push(`strip ${p.x},${p.y}`)
      }
      const dots = Array.from(plan.querySelectorAll('[data-tid="lights-dot"]')) as SVGCircleElement[]
      for (const d of dots) {
        const cx = d.cx.baseVal.value
        const cy = d.cy.baseVal.value
        const r = 4.6
        for (const [x, y] of [[cx - r, cy - r], [cx + r, cy - r], [cx - r, cy + r], [cx + r, cy + r]]) if (!inside(x, y)) outside.push(`led ${cx},${cy}`)
      }
      // The check can fail: a point beyond the end of the slot is outside.
      const canFail = !inside(160, 150 - 120)
      return { outside, dots: dots.length, canFail }
    })
    expect(result.dots).toBe(80)
    expect(result.canFail).toBe(true)
    expect(result.outside).toEqual([])
  })
})

test.describe('white', () => {
  test('a printer with SAT shows White and sends SAT=0, then SAT=100 for a colour', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { status: overlay(PRESETS.idleHomed(), SAT_LED) })
    await open('/lighting')
    await expect(page.getByTestId('swatch-white')).toBeVisible()
    await page.getByTestId('swatch-white').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe('LED_MODE MODE=solid H=0 H2=0 BRIGHT=80 SPEED=55 SAT=0')
    await expect(page.getByText(/no white|colour only/i)).toHaveCount(0)
    await page.getByTestId('swatch-5').click()
    await expect.poll(() => ledScripts(printer.gcode).at(-1), { timeout: 5000 }).toBe(`LED_MODE MODE=solid H=${hexToHue(hueToHex(120))} H2=${hexToHue(hueToHex(120))} BRIGHT=80 SPEED=55 SAT=100`)
  })

  test('negative control: a printer without SAT shows no White and sends no SAT', async ({ page, open }) => {
    const printer = await lightsPrinter(page)
    await open('/lighting')
    await expect(page.getByTestId('swatch-5')).toBeVisible()
    await expect(page.getByTestId('swatch-white')).toHaveCount(0)
    await page.getByTestId('swatch-5').click()
    await expect.poll(() => ledScripts(printer.gcode).length).toBeGreaterThan(0)
    expect(ledScripts(printer.gcode).at(-1)).not.toContain('SAT')
  })

  test('there are more colours than before', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    await expect(page.getByTestId('lighting-colour').locator('[data-tid^="swatch-"]')).toHaveCount(15)
  })
})

test.describe('presets, reorganised', () => {
  test('Save current colour as a preset is at the top of the card, above the presets', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    const save = await page.getByTestId('preset-save').boundingBox()
    const grid = await page.getByTestId('preset-grid').boundingBox()
    expect(save!.y).toBeLessThan(grid!.y)
    await expect(page.getByTestId('preset-save')).toHaveText('Save current colour as a preset')
  })

  test('Printer status comes first and wears a Default badge; no other preset does', async ({ page, open }) => {
    await lightsPrinter(page, { presets: 6 })
    await open('/lighting')
    await expect(page.getByTestId('preset-grid').getByRole('button').first()).toContainText('Printer status')
    await expect(page.getByTestId('preset-default')).toHaveCount(1)
    await expect(page.getByTestId('preset-b2').getByTestId('preset-default')).toHaveText('Default')
  })

  test('All presets opens a list that scrolls when there are many', async ({ page, open }) => {
    await lightsPrinter(page, { presets: 24 })
    await open('/lighting')
    await page.getByTestId('presets-browse').click()
    await expect(page.getByTestId('presets-popup')).toBeVisible()
    await expect(page.locator('[data-tid^="preset-tile-"]')).toHaveCount(30)
    expect(await page.locator('[role="dialog"]').evaluate(el => el.scrollHeight > el.clientHeight + 4)).toBe(true)
  })

  test('negative control: with a few presets the list does not scroll', async ({ page, open }) => {
    await lightsPrinter(page, { presets: 2 })
    await open('/lighting')
    await page.getByTestId('presets-browse').click()
    await expect(page.locator('[data-tid^="preset-tile-"]')).toHaveCount(8)
    expect(await page.locator('[role="dialog"]').evaluate(el => el.scrollHeight > el.clientHeight + 4)).toBe(false)
  })
})

test.describe('the API card', () => {
  test('Settings and Read are real tabs, and the text carries this printer own address', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    const api = page.getByTestId('lighting-api')
    const base = `http://localhost:${MOCK_PORT}`
    await expect(api.getByTestId('api-address')).toContainText(base)
    await expect(api.getByTestId('api-text')).toContainText(`POST ${base}/printer/gcode/script`)
    await expect(api.getByTestId('api-tab-set')).toHaveAttribute('aria-selected', 'true')
    await api.getByTestId('api-tab-read').click()
    await expect(api.getByTestId('api-tab-read')).toHaveAttribute('aria-selected', 'true')
    await expect(api.getByTestId('api-text')).toContainText(`GET ${base}/printer/objects/query?gcode_macro%20LED_MODE`)
    await expect(api.getByTestId('api-text')).not.toContainText('POST')
    await api.getByTestId('api-tab-set').click()
    await expect(api.getByTestId('api-text')).toContainText('POST')
  })

  test('has no API key lock', async ({ page, open }) => {
    await lightsPrinter(page)
    await open('/lighting')
    await expect(page.getByTestId('lighting-api').getByText(/api key|lock/i)).toHaveCount(0)
  })
})
