/**
 * Jack's bugs from testing live Control on 6 Nov 2026 (JACK-FEEDBACK-1106.md):
 * default materials, one wording for "no material loaded", job thumbnails,
 * the Quick actions icon, the logo behind the pages, and glass as the only theme.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

/** The printer's saved Control settings for this page only (what /server/database/item?namespace=fluidd returns). */
async function savedSettings (page: Page, value: Record<string, unknown>) {
  await page.route('**/server/database/item?namespace=fluidd', route => route.fulfill({
    json: { result: { namespace: 'fluidd', value: { uiSettings: value } } }
  }))
}

test.describe('materials', () => {
  test('a printer with no saved list starts with ABS, PETG, PLA and TPU', async ({ page, open }) => {
    await open(`${PRINTER}/settings#presets`)
    const pane = page.getByTestId('materials-settings')
    for (const name of ['ABS', 'PETG', 'PLA', 'TPU']) {
      await expect(pane.getByTestId(`material-row-${name}`), name).toBeVisible()
    }
    await expect(pane.getByTestId('material-add-usual')).toHaveCount(0)
    await expect(pane.getByText('No materials yet')).toHaveCount(0)
  })

  test('a list someone already saved is shown as saved, not replaced', async ({ page, open }) => {
    await savedSettings(page, {
      dashboard: {
        tempPresets: [{ id: 'n1', name: 'Nylon', values: { extruder: { value: 260, type: 'heater', active: true } } }]
      }
    })
    await open(`${PRINTER}/settings#presets`)
    const pane = page.getByTestId('materials-settings')
    await expect(pane.getByTestId('material-row-Nylon')).toBeVisible()
    await expect(pane.getByTestId('material-row-PLA')).toHaveCount(0)
  })
})

test.describe('theme', () => {
  test('Settings offers no flat theme: glass is the only one', async ({ page, open }) => {
    await open(`${PRINTER}/settings#theme`)
    const theme = page.getByTestId('theme-settings')
    await expect(theme).toBeVisible()
    await expect(theme.getByText('Panels')).toHaveCount(0)
    await expect(theme.getByText(/flat/i)).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-m3d-style', 'glass')
  })

  test('a printer that saved the flat theme gets glass', async ({ page, open }) => {
    await savedSettings(page, { theme: { color: '#80D6D1', isDark: true, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: false, style: 'flat' } })
    await open(`${PRINTER}/settings#theme`)
    await expect(page.locator('html')).toHaveAttribute('data-m3d-style', 'glass')
  })
})

test.describe('logo behind the pages', () => {
  test('Settings has no such switch, and a saved "on" shows no watermark', async ({ page, open }) => {
    // The switch drew the Fluidd logo at 4% opacity, mostly off the corner of the screen: it did nothing anyone could see.
    await savedSettings(page, { theme: { color: '#80D6D1', isDark: true, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: true, style: 'glass' } })
    await open(`${PRINTER}/settings#theme`)
    const theme = page.getByTestId('theme-settings')
    await expect(theme).toBeVisible()
    await expect(theme.getByText('Logo behind the pages')).toHaveCount(0)
    await expect(page.locator('.muon-background-logo')).toHaveCount(0)
  })
})

test.describe('quick actions icon', () => {
  test('is the same size as the other top-bar icons, with the bolt centred in its button', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The top bar icons are the desktop bar')
    await open('/jobs')
    const button = page.getByTestId('quick-actions')
    await expect(button).toBeVisible()
    const box = (await button.boundingBox())!
    const bolt = (await button.locator('svg').boundingBox())!
    expect(box.width).toBeCloseTo(40, 0)
    expect(box.height).toBeCloseTo(40, 0)
    expect(Math.abs((bolt.x + bolt.width / 2) - (box.x + box.width / 2))).toBeLessThanOrEqual(1)
    expect(Math.abs((bolt.y + bolt.height / 2) - (box.y + box.height / 2))).toBeLessThanOrEqual(1)

    // Level with the notifications bell beside it.
    const bell = (await page.getByRole('button', { name: 'Notifications' }).boundingBox())!
    expect(Math.abs(box.y - bell.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(box.height - bell.height)).toBeLessThanOrEqual(1)
  })
})

// A PNG that is one transparent pixel.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

const gcode = (filename: string, extra: Record<string, unknown> = {}) => ({
  filename,
  modified: Date.now() / 1000,
  size: 1_000_000,
  permissions: 'rw',
  filament_type: 'PLA',
  slicer: 'OrcaSlicer',
  estimated_time: 3600,
  ...extra
})

const listing = (files: unknown[]) => ({
  dirs: [],
  files,
  disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
  root_info: { name: 'gcodes', permissions: 'rw' }
})

test.describe('job thumbnails', () => {
  test('a thumbnail in .thumbs shows, and a file with none, or one that will not load, gets the placeholder', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    printer.state.answers['server.files.get_directory'] = listing([
      gcode('with_picture.gcode', { thumbnails: [{ width: 32, height: 32, size: 900, relative_path: '.thumbs/with_picture-32x32.png' }, { width: 300, height: 300, size: 9000, relative_path: '.thumbs/with_picture-300x300.png' }] }),
      gcode('no_picture.gcode', { thumbnails: [] }),
      gcode('no_metadata.gcode', { filament_type: undefined, slicer: undefined, estimated_time: undefined }),
      gcode('gone_picture.gcode', { thumbnails: [{ width: 300, height: 300, size: 9000, relative_path: '.thumbs/gone-300x300.png' }] })
    ])
    const asked: string[] = []
    await page.route(/\/server\/files\/gcodes\/\.thumbs\//, route => {
      const url = new URL(route.request().url())
      asked.push(url.pathname)
      return url.pathname.includes('with_picture')
        ? route.fulfill({ body: PNG, contentType: 'image/png' })
        : route.fulfill({ status: 404, body: 'Not found' })
    })
    await open('/jobs')
    const picture = (name: string) => page.getByTestId('jobs-row').filter({ hasText: name }).getByTestId('job-picture')

    await expect(picture('With picture')).toHaveAttribute('data-state', 'image')
    await expect(picture('No picture')).toHaveAttribute('data-state', 'placeholder')
    await expect(picture('No picture')).toBeVisible()
    await expect(picture('No metadata')).toHaveAttribute('data-state', 'placeholder')
    // The biggest thumbnail is the one asked for, from the file's own .thumbs folder.
    expect(asked).toContain('/server/files/gcodes/.thumbs/with_picture-300x300.png')
    // A thumbnail the printer does not have is a placeholder, not a broken image.
    await expect(picture('Gone picture')).toHaveAttribute('data-state', 'placeholder')
  })
})

const SENSOR = 'filament_switch_sensor filament_sensor_toolhead'

async function jobsWithPla (page: Page, status: Record<string, unknown>) {
  const printer = await usePrinter(page, { ...PRESETS.idleHomed(), ...status })
  printer.state.answers['server.files.get_directory'] = listing([gcode('needs_pla.gcode', { thumbnails: [], slicer: 'Muon3D Slicer' })])
  return printer
}

test.describe('no material loaded', () => {
  test('Jobs says "No material loaded" with a small warning icon when the sensor sees no filament, even with a material preset chosen', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone has no detail pane: its warnings are not shown there')
    // The old wording said "no material is set" whenever the heater targets matched no preset, which says nothing about filament.
    // Here the targets match PLA, and the sensor says nothing is loaded.
    await jobsWithPla(page, {
      extruder: { target: 215 },
      heater_bed: { target: 60 },
      [SENSOR]: { filament_detected: false, enabled: true }
    })
    await open('/jobs')
    await page.getByTestId('jobs-row').filter({ hasText: 'Needs pla' }).click()
    const warnings = page.getByTestId('jobs-warnings')
    await expect(warnings).toContainText('No material loaded')
    await expect(warnings).not.toContainText(/is set/i)
    await expect(warnings.locator('.v-icon').first()).toBeVisible()
    // Warning-coloured, not the error red.
    const [iconColour, warning, danger] = await page.evaluate(() => {
      const colour = (v: string) => {
        const e = document.createElement('i')
        e.style.color = `var(${v})`
        document.body.appendChild(e)
        const c = getComputedStyle(e).color
        e.remove()
        return c
      }
      return [getComputedStyle(document.querySelector('[data-tid="jobs-warnings"] .v-icon')!).color, colour('--m3d-warning'), colour('--m3d-danger')]
    })
    expect(iconColour).toBe(warning)
    expect(iconColour).not.toBe(danger)
  })

  test('Jobs does not warn when the sensor sees filament and the loaded material is the one needed', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone has no detail pane: its warnings are not shown there')
    await jobsWithPla(page, {
      [SENSOR]: { filament_detected: true, enabled: true },
      save_variables: { variables: { muon_material: '"PLA"' } }
    })
    await open('/jobs')
    await page.getByTestId('jobs-row').filter({ hasText: 'Needs pla' }).click()
    await expect(page.getByTestId('jobs-warnings')).toHaveCount(0)
  })

  test('the Overview filament tile says the same, with the same icon', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), [SENSOR]: { filament_detected: false, enabled: true } })
    await open('/')
    await expect(page.getByTestId('filament-type')).toHaveText('No material loaded')
    await expect(page.getByTestId('filament-warning')).toBeVisible()
  })

  test('the Overview filament tile does not say it when the sensor sees filament', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), [SENSOR]: { filament_detected: true, enabled: true } })
    await open('/')
    await expect(page.getByTestId('filament-type')).toHaveText('Filament loaded')
    await expect(page.getByTestId('filament-warning')).toHaveCount(0)
  })
})
