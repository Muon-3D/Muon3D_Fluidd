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
  printer.database.muon_lights = {}
  if (options.presets) printer.database.muon_lights.presets = saved(options.presets)
  if (options.favourites) printer.database.muon_lights.favourites = options.favourites
  return printer
}

const cell = (page: Page, id: string) => page.locator(`[data-cell="${id}"]`)

async function addLightingWidget (page: Page, size: 'S' | 'M' | 'L') {
  await page.getByTestId('edit-open').click()
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

    // Swatch 4 is hue 108 (10 hues, 36 apart), for the first colour.
    await page.getByTestId('swatch-3').click()
    const h = hexToHue(hueToHex(108))
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
    await expect(page.getByTestId('lighting-api').getByRole('tab')).toHaveText(['Settings'])
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
    await expect.poll(() => (printer.database.muon_lights.favourites as string[] | undefined)?.length).toBe(7)
    expect(printer.database.muon_lights.favourites).not.toContain('b0')
    expect(printer.database.muon_lights.favourites).toContain('u1')
  })

  test('Cancel keeps the favourites as they were', async ({ page, open }) => {
    const printer = await lightsPrinter(page, { presets: 6, favourites: ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'u0'] })
    await open('/lighting')
    await page.getByTestId('presets-more').click()
    await page.getByTestId('preset-star-b0').click()
    await expect(page.getByTestId('presets-count')).toHaveText('Favourites 6 of 7')
    await page.getByTestId('presets-cancel').click()
    await expect(page.getByTestId('preset-b0')).toBeVisible()
    expect(printer.database.muon_lights.favourites).toEqual(['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'u0'])
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
    const stored = printer.database.muon_lights.presets as Array<{ name: string; effect: string }>
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ name: 'Night shift', effect: 'breathe' })
    expect(printer.database.muon_lights.favourites).toHaveLength(2)
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
    await expect.poll(() => ledScripts(printer.gcode).at(-1)).toBe(`LED_MODE MODE=solid H=${hexToHue(first.colors[0])} H2=${hexToHue(first.colors[0])} BRIGHT=80 SPEED=55`)
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
