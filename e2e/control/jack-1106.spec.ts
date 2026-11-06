/**
 * Jack's bugs from testing live Control on 6 Nov 2026 (JACK-FEEDBACK-1106.md):
 * default materials, one wording for "no material loaded", job thumbnails,
 * the Quick actions icon, the logo behind the pages, and glass as the only theme.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter, overlay, PRESETS } from './printer'

/** The printer's saved Control settings for this page only (what /server/database/item?namespace=fluidd returns). */
async function savedSettings (page: Page, value: Record<string, unknown>) {
  await page.route('**/server/database/item?namespace=fluidd', route => route.fulfill({
    json: { result: { namespace: 'fluidd', value: { uiSettings: value } } }
  }))
}

/** The app's own store, for what a screen cannot show. */
const storeValue = (page: Page, path: string) => page.evaluate((p) => {
  const root = document.querySelector('.v-application') as unknown as { __vue__: { $store: { state: unknown } } }
  return p.split('.').reduce((o: any, k) => o?.[k], root.__vue__.$store.state)
}, path)

test.describe('materials', () => {
  test('a printer with no saved list starts with ABS, PETG, PLA and TPU, and writes nothing on load', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open(`${PRINTER}/settings#presets`)
    const pane = page.getByTestId('materials-settings')
    for (const name of ['ABS', 'PETG', 'PLA', 'TPU']) {
      await expect(pane.getByTestId(`material-row-${name}`), name).toBeVisible()
    }
    await expect(pane.getByTestId('material-add-usual')).toHaveCount(0)
    await expect(pane.getByText('No materials yet')).toHaveCount(0)
    // Loading the page must not save the defaults over anything.
    expect(printer.called('server.database.post_item')).toEqual([])
  })

  test('a list someone already saved is shown as saved, not replaced', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await savedSettings(page, {
      dashboard: {
        tempPresets: [{ id: 'n1', name: 'Nylon', values: { extruder: { value: 260, type: 'heater', active: true } } }]
      }
    })
    await open(`${PRINTER}/settings#presets`)
    const pane = page.getByTestId('materials-settings')
    await expect(pane.getByTestId('material-row-Nylon')).toBeVisible()
    await expect(pane.getByTestId('material-row-PLA')).toHaveCount(0)
    expect(printer.called('server.database.post_item')).toEqual([])
  })

  test('a list someone emptied stays empty: the defaults are not put back', async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await savedSettings(page, { dashboard: { tempPresets: [] } })
    await open(`${PRINTER}/settings#presets`)
    const pane = page.getByTestId('materials-settings')
    await expect(pane).toBeVisible()
    await expect(pane.locator('[data-tid^="material-row-"]')).toHaveCount(0)
    expect(await storeValue(page, 'config.uiSettings.dashboard.tempPresets')).toEqual([])
    expect(printer.called('server.database.post_item')).toEqual([])
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
    expect(await storeValue(page, 'config.uiSettings.theme.style')).toBe('glass')
  })

  test('a printer that saved the flat theme gets glass, in the store as well as on screen', async ({ page, open }) => {
    await savedSettings(page, { theme: { color: '#80D6D1', isDark: true, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: false, style: 'flat' } })
    await open(`${PRINTER}/settings#theme`)
    await expect(page.locator('html')).toHaveAttribute('data-m3d-style', 'glass')
    expect(await storeValue(page, 'config.uiSettings.theme.style')).toBe('glass')
    expect(await page.evaluate(() => localStorage.getItem('muon.uiStyle'))).toBe('glass')
  })
})

test.describe('logo behind the pages', () => {
  test('Settings has no such switch, and a printer that saved it on shows no watermark', async ({ page, open }) => {
    // The switch drew the Fluidd logo at 4% opacity, mostly off the corner of the screen: it did nothing anyone could see.
    await savedSettings(page, { theme: { color: '#80D6D1', isDark: true, logo: { src: 'logo_fluidd.svg' }, backgroundLogo: true, style: 'glass' } })
    await open(`${PRINTER}/settings#theme`)
    const theme = page.getByTestId('theme-settings')
    await expect(theme).toBeVisible()
    // The saved "on" did load, so the missing watermark is not for want of the setting.
    expect(await storeValue(page, 'config.uiSettings.theme.backgroundLogo')).toBe(true)
    await expect(theme.getByText('Logo behind the pages')).toHaveCount(0)
    await expect(page.locator('.muon-background-logo')).toHaveCount(0)
  })
})

test.describe('quick actions icon', () => {
  test('is the same size as the other top-bar icons, with the bolt centred in its button', async ({ page, open }) => {
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
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const PNG = Buffer.from(PNG_BASE64, 'base64')

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

const withThumb = (filename: string) => gcode(filename, {
  thumbnails: [{ width: 300, height: 300, size: 9000, relative_path: `.thumbs/${filename.replace('.gcode', '')}-300x300.png` }]
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

  test('over the remote route a failed read is tried again and recovers, a few at a time, and gives up after three', async ({ page, open }) => {
    // The remote route has no address to link: each picture is read as bytes through the transport.
    // There is no Iroh here (and a page cannot be moved onto that route without reloading it), so the
    // Jobs page is switched to the remote read, with its transport a stub, and left to draw its rows.
    const printer = await usePrinter(page, PRESETS.idleHomed())
    const files = [...Array.from({ length: 8 }, (_, i) => withThumb(`part_${i}.gcode`)), withThumb('flaky.gcode'), withThumb('dead.gcode')]
    printer.state.answers['server.files.get_directory'] = listing(files)
    await open('/jobs')
    await expect(page.getByTestId('jobs-row')).toHaveCount(files.length)

    await page.evaluate(async (png) => {
      const bytes = Uint8Array.from(atob(png), c => c.charCodeAt(0))
      const w = window as any
      w.__reads = { calls: {} as Record<string, number>, open: 0, peak: 0 }
      const thumbnails = await import(/* @vite-ignore */ '../../../../src/services/jobs/thumbnail.ts')
      // The Jobs page: the nearest component above a row.
      let el = document.querySelector('[data-tid="jobs-row"]') as any
      while (el && !el.__vue__) el = el.parentElement
      const jobs = el.__vue__
      const read = async (path: string) => {
        const r = w.__reads
        r.calls[path] = (r.calls[path] ?? 0) + 1
        r.open++
        r.peak = Math.max(r.peak, r.open)
        await new Promise(resolve => setTimeout(resolve, 150))
        r.open--
        const fail = () => Object.assign(new Error('HTTP 500'), { response: { status: 500 } })
        if (path.includes('dead')) throw fail()
        if (path.includes('flaky') && r.calls[path] === 1) throw fail()
        return new Blob([bytes], { type: 'image/png' })
      }
      jobs.jobPictureUrl = (f: any) => {
        const path = thumbnails.jobThumbnailPath(f, f.path)
        return path ? thumbnails.remoteJobThumbnail('e2e', path, f.modified, read) : ''
      }
      jobs.$forceUpdate()
    }, PNG_BASE64)

    const picture = (name: string) => page.getByTestId('jobs-row').filter({ hasText: name }).getByTestId('job-picture')
    await expect(picture('Part 0')).toHaveAttribute('data-state', 'image', { timeout: 30_000 })
    // A 500 and then a 200: the picture arrives.
    await expect(picture('Flaky')).toHaveAttribute('data-state', 'image', { timeout: 30_000 })
    // Three tries, then it stops and the row keeps its placeholder.
    await expect.poll(() => page.evaluate(() => Object.entries((window as any).__reads.calls).filter(([p]) => p.includes('dead')).map(([, n]) => n)), { timeout: 30_000 }).toEqual([3])
    await expect(picture('Dead')).toHaveAttribute('data-state', 'placeholder')
    await page.waitForTimeout(4000)
    const reads = await page.evaluate(() => (window as any).__reads)
    expect(Object.entries(reads.calls).filter(([p]) => p.includes('dead')).map(([, n]) => n)).toEqual([3])
    expect(reads.calls[Object.keys(reads.calls).find(p => p.includes('flaky'))!]).toBe(2)
    // Never more than four reads at once.
    expect(reads.peak).toBeGreaterThan(1)
    expect(reads.peak).toBeLessThanOrEqual(4)
  })
})

const SENSOR = 'filament_switch_sensor filament_sensor_toolhead'
const MOTION = 'filament_motion_sensor encoder'

/** The printer reports these filament sensors (and its settings name them, as the printer's real ones are). */
const sensors = (reports: Record<string, { filament_detected: boolean, enabled: boolean }>, extra: Record<string, unknown> = {}) => overlay(
  PRESETS.idleHomed(),
  {
    ...reports,
    configfile: { settings: Object.fromEntries(Object.keys(reports).map(k => [k, { pause_on_runout: 'False' }])) },
    ...extra
  }
)

async function jobsWithPla (page: Page, status: Record<string, unknown>) {
  const printer = await usePrinter(page, status)
  printer.state.answers['server.files.get_directory'] = listing([gcode('needs_pla.gcode', { thumbnails: [], slicer: 'Muon3D Slicer' })])
  return printer
}

test.describe('no material loaded', () => {
  test('Jobs says "No material loaded" with a small warning icon when the sensor sees no filament, even with a material preset chosen', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone has no detail pane: its warnings are not shown there')
    // The old wording said "no material is set" whenever the heater targets matched no preset, which says nothing about filament.
    // Here the targets match PLA, and the sensor says nothing is loaded.
    await jobsWithPla(page, sensors({ [SENSOR]: { filament_detected: false, enabled: true } }, { extruder: { target: 215 }, heater_bed: { target: 60 } }))
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

  test('Jobs warns when the sensor sees no filament although a material is named', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone has no detail pane: its warnings are not shown there')
    await jobsWithPla(page, sensors({ [SENSOR]: { filament_detected: false, enabled: true } }, { save_variables: { variables: { muon_material: '"PLA"' } } }))
    await open('/jobs')
    await page.getByTestId('jobs-row').filter({ hasText: 'Needs pla' }).click()
    await expect(page.getByTestId('jobs-warnings')).toContainText('No material loaded')
  })

  test('Jobs does not warn when the sensor sees filament and the loaded material is the one needed', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone has no detail pane: its warnings are not shown there')
    await jobsWithPla(page, sensors({ [SENSOR]: { filament_detected: true, enabled: true } }, { save_variables: { variables: { muon_material: '"PLA"' } } }))
    await open('/jobs')
    await page.getByTestId('jobs-row').filter({ hasText: 'Needs pla' }).click()
    await expect(page.getByTestId('jobs-warnings')).toHaveCount(0)
  })

  test('an idle motion sensor does not make a loaded printer "No material loaded"', async ({ page, open, isMobile }) => {
    test.skip(isMobile, 'The phone has no detail pane: its warnings are not shown there')
    // A motion sensor reports filament_detected false until filament moves, loaded or not.
    await jobsWithPla(page, sensors({ [MOTION]: { filament_detected: false, enabled: true } }, { save_variables: { variables: { muon_material: '"PLA"' } } }))
    await open('/jobs')
    await page.getByTestId('jobs-row').filter({ hasText: 'Needs pla' }).click()
    await expect(page.getByTestId('jobs-warnings')).toHaveCount(0)
  })

  test('the Overview filament tile says the same, with the same icon', async ({ page, open }) => {
    await usePrinter(page, sensors({ [SENSOR]: { filament_detected: false, enabled: true } }))
    await open('/')
    await expect(page.getByTestId('filament-type')).toHaveText('No material loaded')
    await expect(page.getByTestId('filament-warning')).toBeVisible()
  })

  test('the Overview filament tile does not say it when the sensor sees filament', async ({ page, open }) => {
    await usePrinter(page, sensors({ [SENSOR]: { filament_detected: true, enabled: true } }))
    await open('/')
    await expect(page.getByTestId('filament-type')).toHaveText('Filament loaded')
    await expect(page.getByTestId('filament-warning')).toHaveCount(0)
  })

  test('the filament picker says what the tile says, with no sensor reading and with filament seen', async ({ page, open }) => {
    const none = await usePrinter(page, sensors({ [SENSOR]: { filament_detected: false, enabled: true } }))
    await open('/')
    await page.getByRole('button', { name: 'More for Filament' }).click()
    await page.getByRole('menuitem', { name: /Set material and colour/ }).click()
    await expect(page.getByTestId('tile-filament').getByTestId('material-name')).toHaveText('No material loaded')
    await expect(page.getByTestId('material-warning')).toBeVisible()
    expect(none.gcode).toEqual([])
  })

  test('the filament picker says "Filament loaded", without the warning, when the sensor sees filament', async ({ page, open }) => {
    await usePrinter(page, sensors({ [SENSOR]: { filament_detected: true, enabled: true } }))
    await open('/')
    await page.getByRole('button', { name: 'More for Filament' }).click()
    await page.getByRole('menuitem', { name: /Set material and colour/ }).click()
    await expect(page.getByTestId('tile-filament').getByTestId('material-name')).toHaveText('Filament loaded')
    await expect(page.getByTestId('material-warning')).toHaveCount(0)
  })
})
