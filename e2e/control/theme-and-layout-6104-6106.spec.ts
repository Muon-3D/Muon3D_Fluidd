/**
 * KAN-6104, 6105, 6106 (Jack, 24 Nov): the Bluetooth icon is readable on its
 * button in both themes; a sun/moon switch at the top right of the bar flips
 * light and dark, on a phone too; the theme lives in Account settings and the
 * layout in the printer's settings. Desktop and phone both run every test.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready, PRINTER } from '../fixtures'
import { CONSOLE, serveConsoleHere } from '../fakes/console'
import { OPEN_PRINTER, useNearbyPrinters } from '../fakes/blePair'
import { usePrinter, PRESETS } from './printer'

const app = (page: Page) => page.locator('.v-application').first()
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('muon3d.appearance'))
const storedJson = async (page: Page) => JSON.parse((await stored(page)) ?? '{}')

/** The printer's own saved settings for this page only: what a printer that chose a theme before the move holds. */
async function savedSettings (page: Page, value: Record<string, unknown>) {
  await page.route('**/server/database/item?namespace=fluidd', route => route.fulfill({
    json: { result: { namespace: 'fluidd', value: { uiSettings: value } } }
  }))
}

test.describe('the light/dark switch (KAN-6105)', () => {
  // On a phone the bar of an open printer is full beside STOP, so the switch is on the pages that are not a printer's.
  const toggleHere = async (page: Page) => {
    await page.goto('/account/appearance')
    await ready(page)
  }

  test('flips the theme and is still flipped after a reload', async ({ page }) => {
    await toggleHere(page)
    const toggle = page.getByTestId('theme-toggle')
    await expect(toggle).toBeVisible()
    await expect(app(page)).toHaveClass(/theme--dark/)
    await expect(toggle).toHaveAttribute('aria-checked', 'true')

    await toggle.click()
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect(toggle).toHaveAttribute('aria-checked', 'false')

    await page.reload()
    await ready(page)
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-checked', 'false')

    await page.getByTestId('theme-toggle').click()
    await expect(app(page)).toHaveClass(/theme--dark/)
  })

  test('light is the thumb on the left with the sun, dark on the right with the moon', async ({ page }) => {
    await toggleHere(page)
    const toggle = page.getByTestId('theme-toggle')
    const side = async () => {
      const track = (await toggle.locator('.theme-toggle__track').boundingBox())!
      const thumb = (await toggle.locator('.theme-toggle__thumb').boundingBox())!
      return (thumb.x + thumb.width / 2) < (track.x + track.width / 2) ? 'left' : 'right'
    }
    await expect.poll(side).toBe('right')
    await toggle.click()
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect.poll(side).toBe('left')
  })

  test('sits at the right of the bar, inside the screen', async ({ page }) => {
    await toggleHere(page)
    const box = (await page.getByTestId('theme-toggle').boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.y).toBeLessThan(80)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.x + box.width).toBeGreaterThan(viewport.width / 2)
  })

  test('has no motion when the person asks for none', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await toggleHere(page)
    const thumb = page.getByTestId('theme-toggle').locator('.theme-toggle__thumb')
    await expect(thumb).toBeVisible()
    expect(await thumb.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s')
  })

  test('does the same as Account > Appearance, which shows it', async ({ page }) => {
    await toggleHere(page)
    const mode = page.getByTestId('setting-theme-mode')
    await expect(mode.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('theme-toggle').click()
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect(mode.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true')
  })

  test('with a printer open: on a computer the switch is in the bar; on a phone it is left out and STOP and the bar buttons fit', async ({ page, open, isMobile }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    const viewport = page.viewportSize()!
    const estop = page.getByTestId('estop').first()
    await expect(estop).toBeVisible()
    if (isMobile) {
      await expect(page.getByTestId('theme-toggle')).toHaveCount(0)
    } else {
      await expect(page.getByTestId('theme-toggle')).toBeVisible()
    }
    // Every button in the bar is whole on screen, and none sits on another.
    const boxes: Array<{ x: number, y: number, width: number, height: number }> = []
    const buttons = page.locator('.app-header button:visible, .app-header a:visible')
    for (let i = 0; i < await buttons.count(); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (!box) continue
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5)
      boxes.push(box)
    }
    const stop = (await estop.boundingBox())!
    for (const other of boxes) {
      if (Math.abs(other.x - stop.x) < 1 && Math.abs(other.y - stop.y) < 1) continue
      const apart = other.x + other.width <= stop.x + 0.5 || stop.x + stop.width <= other.x + 0.5 || other.y + other.height <= stop.y + 0.5 || stop.y + stop.height <= other.y + 0.5
      expect(apart).toBe(true)
    }
  })
})

test.describe('the theme is the account\'s, the layout the printer\'s (KAN-6106)', () => {
  test.use({ signedIn: true })

  test.beforeEach(async ({ page, account, baseURL }) => {
    await serveConsoleHere(page, account, new URL(baseURL!).origin)
  })

  test('Account settings has Appearance, and a choice made there is kept after a reload', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/account/appearance')
    const appearance = page.getByTestId('account-appearance')
    await expect(appearance).toBeVisible()
    await expect(appearance.getByRole('radio', { name: 'Teal' })).toHaveAttribute('aria-checked', 'true')

    await appearance.getByRole('radio', { name: 'Blue' }).click()
    await appearance.getByTestId('setting-theme-mode').getByRole('radio', { name: 'Light' }).click()
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect.poll(() => storedJson(page)).toEqual({ color: '#7aa7ff', mode: 'light' })

    await page.reload()
    await ready(page)
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect(page.getByTestId('account-appearance').getByRole('radio', { name: 'Blue' })).toHaveAttribute('aria-checked', 'true')
  })

  test('the printer\'s General settings no longer hold the theme, and hold the layout', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/settings#general')
    const general = page.getByTestId('general-settings')
    await expect(general).toBeVisible()
    await expect(general.getByRole('heading', { name: 'Layout', exact: true })).toBeVisible()
    await expect(page.getByTestId('layout-settings')).toBeVisible()
    await expect(general.getByRole('heading', { name: 'Look', exact: true })).toHaveCount(0)
    await expect(page.getByTestId('theme-settings')).toHaveCount(0)
    await expect(page.getByTestId('setting-theme-mode')).toHaveCount(0)
    await expect(general.getByText('Accent colour')).toHaveCount(0)
    await expect(general.getByText('Light or dark')).toHaveCount(0)
    // Nothing arranged yet: it says Default, and there is nothing to reset.
    await expect(page.getByTestId('layout-note-overview')).toHaveText('Default')
    await expect(page.getByTestId('layout-reset-overview')).toBeDisabled()
    await expect(page.getByTestId('layout-reset-control')).toBeDisabled()
    // Edit opens the page already editing.
    await page.getByTestId('layout-edit-control').click()
    await expect(page).toHaveURL(/\/control\?edit=1/)
    await expect(page.getByTestId('edit-status')).toContainText('Editing the Control layout.')
  })

  test('a theme a printer saved before the move is kept: shown, and handed to this browser', async ({ page, open }) => {
    await savedSettings(page, { theme: { color: '#7aa7ff', isDark: false, mode: 'light', logo: { src: 'logo_fluidd.svg' }, backgroundLogo: false, style: 'glass' } })
    await open(`${PRINTER}/account/appearance`)
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect(page.getByTestId('account-appearance').getByRole('radio', { name: 'Blue' })).toHaveAttribute('aria-checked', 'true')
    await expect.poll(() => storedJson(page)).toEqual({ color: '#7aa7ff', mode: 'light' })
  })
})

test.describe('the Bluetooth icon (KAN-6104)', () => {
  test.use({ signedIn: true })

  function cloudPrinter (id: string, name: string) {
    const now = Math.floor(Date.now() / 1000)
    return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator' }
  }

  /** The glyph's and the button fill's computed colours: which is lighter, and the WCAG ratio between them. */
  async function contrast (page: Page) {
    return page.getByTestId('connect-bluetooth').evaluate(button => {
      const parse = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
      const channel = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
      const lum = (rgb: number[]) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
      const glyph = button.querySelector('.v-icon')!
      const fill = lum(parse(getComputedStyle(button).backgroundColor))
      const ink = lum(parse(getComputedStyle(glyph).color))
      return { glyphLighter: ink > fill, ratio: (Math.max(fill, ink) + 0.05) / (Math.min(fill, ink) + 0.05) }
    })
  }

  test('a dark glyph on the light fill in dark, a white glyph on the deep fill in light', async ({ page }) => {
    await useNearbyPrinters(page, OPEN_PRINTER)
    await page.route(`${CONSOLE}/v1/printers`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers: [cloudPrinter(OPEN_PRINTER.id, 'Alder')] }) }))
    await page.goto('/')
    await ready(page)
    await expect(page.getByTestId('connect-bluetooth')).toBeEnabled()

    await expect(app(page)).toHaveClass(/theme--dark/)
    await expect.poll(async () => (await contrast(page)).glyphLighter).toBe(false)
    expect((await contrast(page)).ratio).toBeGreaterThanOrEqual(4.5)

    await page.getByTestId('theme-toggle').click()
    await expect(app(page)).toHaveClass(/theme--light/)
    await expect.poll(async () => (await contrast(page)).glyphLighter).toBe(true)
    expect((await contrast(page)).ratio).toBeGreaterThanOrEqual(3)
  })
})
