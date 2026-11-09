/**
 * Cloud parity: the same printer, opened two ways, does the same things.
 *
 * - local: Control reaches the mock printer by its address, as on the
 *   printer's own network;
 * - cloud: Control reaches the same mock only through Muon3D (the console's
 *   grant, then muon-link over Iroh: e2e/fakes/cloud.ts). Nothing knows its
 *   address, and the gateway refuses what it refuses every remote session.
 *
 * Each action is one test run on both routes, at desktop and phone sizes.
 * Where the gateway can't carry something yet (a camera on the printer), the
 * cloud route says so instead of drawing a broken picture.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import type { ConsoleState } from '../fakes/console'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'
import { useCloudRoute, type CloudRoute } from '../fakes/cloud'
import { MOCK_PORT } from '../ports'

test.use({ signedIn: true })

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAE0lEQVR4nGPQiAogCTGMahgUGgCvtHYhDo2f2wAAAABJRU5ErkJggg==', 'base64')
const NOW = Date.now() / 1000

type Route = 'local' | 'cloud'
const ROUTES: Route[] = ['local', 'cloud']

/** The route under test; for the cloud, what went through the gateway. */
async function useRoute (page: Page, account: ConsoleState, route: Route): Promise<CloudRoute | null> {
  return route === 'cloud' ? await useCloudRoute(page, account) : null
}

/** The page reached the printer the way the route says, and only that way. */
async function expectRoute (page: Page, cloud: CloudRoute | null) {
  if (cloud) {
    await expect.poll(() => cloud.requests).toContain('GET /websocket')
  }
  expect(await page.evaluate(() => typeof (window as { __e2eCloud?: unknown }).__e2eCloud === 'function')).toBe(!!cloud)
}

function webcam (uid: string, name: string, streamUrl: string, snapshotUrl: string) {
  return {
    uid, name, location: 'printer', service: 'mjpegstreamer', enabled: true, icon: 'mdiWebcam',
    target_fps: 15, target_fps_idle: 5, stream_url: streamUrl, snapshot_url: snapshotUrl,
    flip_horizontal: false, flip_vertical: false, rotation: 0, aspect_ratio: '16:9', source: 'database', extra_data: {}
  }
}

/** The print confirm: the plate is ticked clear, then Print now. */
async function confirmPrint (page: Page) {
  const plate = page.getByTestId('confirm-plate')
  if (await plate.count()) await plate.click()
  const ok = page.getByTestId('confirm-ok')
  if (await ok.count()) await ok.click()
}

/** The printer takes uploads into gcodes/, and lists what it took. */
async function takeUploads (page: Page, printer: PrinterHandle) {
  const uploaded: string[] = []
  await page.route(new RegExp(`:${MOCK_PORT}/server/files/upload`), async route => {
    const body = route.request().postDataBuffer()?.toString('latin1') ?? ''
    const name = /filename="([^"]+)"/.exec(body)?.[1] ?? ''
    uploaded.push(name)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ result: { item: { path: name, root: 'gcodes', modified: NOW, size: body.length, permissions: 'rw' }, print_started: false, print_queued: false, action: 'create_file' } })
    })
  })
  printer.state.answers['server.files.get_directory'] = (params: Record<string, unknown>) => ({
    dirs: [],
    files: [
      { filename: 'benchy_0.16mm_PETG.gcode', size: 7_200_000, modified: NOW - 86400, permissions: 'rw' },
      ...uploaded.map(filename => ({ filename, size: 1200, modified: NOW, permissions: 'rw' }))
    ],
    disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
    root_info: { name: String(params.path ?? 'gcodes').split('/')[0], permissions: 'rw' }
  })
  return uploaded
}

for (const route of ROUTES) {
  test.describe(`${route} route`, () => {
    test('move: a jog is one relative move', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      const printer = await usePrinter(page, PRESETS.idleHomed({ position: [150, 100, 10] }))
      await open('/control')
      await expectRoute(page, cloud)
      await page.getByTestId('control-move').getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: '0.1', exact: true }).click()
      await page.getByRole('button', { name: 'Head right (X+)' }).click()
      await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X0.1 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
    })

    test('heat: hotter on the nozzle sets its target', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      const printer = await usePrinter(page, PRESETS.idleHomed())
      await open('/control')
      await expectRoute(page, cloud)
      await page.getByTestId('control-heat').getByRole('button', { name: 'Nozzle hotter' }).click()
      await expect.poll(() => printer.gcode.length).toBeGreaterThan(0)
      expect(printer.gcode.every(g => /^SET_HEATER_TEMPERATURE HEATER=extruder TARGET=\d+$/.test(g))).toBe(true)
    })

    test('upload and start: an uploaded file is offered, and Print now starts it', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      const printer = await usePrinter(page, PRESETS.idleHomed())
      const uploaded = await takeUploads(page, printer)
      await open('/jobs')
      await expectRoute(page, cloud)
      await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'parity_cube.gcode', mimeType: 'text/x-gcode', buffer: Buffer.from('; parity\nG28\n') })
      await expect.poll(() => uploaded).toEqual(['parity_cube.gcode'])
      if (cloud) expect(cloud.requests).toContain('POST /server/files/upload')
      const ready = page.getByTestId('job-ready')
      await expect(ready).toBeVisible()
      await ready.getByTestId('job-ready-print').click()
      await confirmPrint(page)
      await expect.poll(() => printer.called('printer.print.start')).toEqual([{ filename: 'parity_cube.gcode' }])
    })

    test('console: a typed line is sent as G-code', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      const printer = await usePrinter(page, PRESETS.idleHomed())
      await open('/console')
      await expectRoute(page, cloud)
      await page.getByTestId('console-input').fill('M105')
      await page.getByTestId('console-output').getByRole('button', { name: 'Send', exact: true }).click()
      await expect.poll(() => printer.gcode).toEqual(['M105'])
    })

    test('camera: a camera with its own address is drawn on both routes', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      await page.context().route('http://camera.e2e/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
      const printer = await usePrinter(page, PRESETS.idleHomed())
      printer.state.answer['server.webcams.list'] = { webcams: [webcam('chamber', 'Chamber', 'http://camera.e2e/chamber/stream', 'http://camera.e2e/chamber/snapshot')] }
      await open('/camera')
      await expectRoute(page, cloud)
      await expect(page.getByTestId('camera-tile').locator('img')).toHaveAttribute('src', /camera\.e2e\/chamber\/stream/)
      await expect(page.getByTestId('camera-live')).toContainText('Live')
      await expect(page.getByTestId('camera-stage-snapshot')).toBeVisible()
      await expect(page.getByTestId('camera-remote')).toHaveCount(0)
    })

    test('camera: one on the printer is drawn on its network; through Muon3D the page says it can\'t be', async ({ page, open, account, isMobile }) => {
      const cloud = await useRoute(page, account, route)
      await page.route(/\/webcam\/\?action=/, r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
      const printer = await usePrinter(page, PRESETS.idleHomed())
      printer.state.answer['server.webcams.list'] = { webcams: [webcam('chamber', 'Chamber', '/webcam/?action=stream', '/webcam/?action=snapshot')] }
      await open('/camera')
      await expectRoute(page, cloud)
      const tile = page.getByTestId('camera-tile')
      if (cloud) {
        await expect(tile.getByTestId('camera-remote')).toContainText('Chamber shows on the printer\'s network')
        await expect(tile.getByTestId('camera-remote')).toContainText('Muon3D doesn\'t carry camera pictures yet')
        await expect(tile.locator('img')).toHaveCount(0)
        await expect(page.getByTestId('camera-live')).toHaveCount(0)
        await expect(page.getByTestId('camera-stage-snapshot')).toHaveCount(0)
        await expect(page.getByTestId('camera-error')).toHaveCount(0)
        if (!isMobile) {
          await page.getByTestId('camera-snapshot').click()
          await expect(page.getByTestId('flash-message')).toContainText('Chamber shows on the printer\'s network only')
        }
      } else {
        await expect(tile.locator('img')).toHaveAttribute('src', /\/webcam\/\?action=stream/)
        await expect(page.getByTestId('camera-live')).toContainText('Live')
        await expect(page.getByTestId('camera-remote')).toHaveCount(0)
      }
    })

    test('timelapse: a video\'s picture is drawn and the video downloads', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      const printer = await usePrinter(page, PRESETS.idleHomed(), {
        components: ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'history', 'authorization', 'timelapse']
      })
      const video = 'timelapse_parity_20261109_1200'
      printer.state.answers['machine.timelapse.get_settings'] = { enabled: true, autorender: true, camera: '', mode: 'layermacro', blockedsettings: [], stream_delay_compensation: 0.05 }
      printer.state.answers['machine.timelapse.lastframeinfo'] = { count: 0, lastframefile: '' }
      printer.state.answers['server.files.get_directory'] = (params: Record<string, unknown>) => ({
        dirs: [],
        files: String(params.path ?? '').startsWith('timelapse')
          ? [{ filename: `${video}.mp4`, size: 2_000_000, modified: NOW, permissions: 'rw' }, { filename: `${video}.jpg`, size: 2000, modified: NOW, permissions: 'rw' }]
          : [],
        disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
        root_info: { name: String(params.path ?? 'gcodes').split('/')[0], permissions: 'rw' }
      })
      await page.route(new RegExp(`:${MOCK_PORT}/server/files/timelapse/`), r => r.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*' },
        contentType: r.request().url().includes('.mp4') ? 'video/mp4' : 'image/png',
        body: r.request().url().includes('.mp4') ? Buffer.from('not really a video') : PNG
      }))
      await open('/timelapse')
      await expectRoute(page, cloud)
      const card = page.locator(`[data-file="${video}.mp4"]`)
      const picture = card.locator('img').first()
      await expect(picture).toHaveAttribute('src', cloud ? /^blob:/ : new RegExp(`:${MOCK_PORT}/server/files/timelapse/${video}\\.jpg`))
      await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0)
      if (cloud) expect(cloud.requests).toContain(`GET /server/files/timelapse/${video}.jpg`)

      await card.getByTestId('timelapse-item-more').click()
      if (cloud) {
        // Read through the gateway into this tab, then saved under its own name.
        const download = page.waitForEvent('download')
        await page.getByTestId('timelapse-download').click()
        expect((await download).suggestedFilename()).toBe(`${video}.mp4`)
        expect(cloud.requests).toContain(`GET /server/files/timelapse/${video}.mp4`)
      } else {
        // By the printer's address, in a new tab.
        const opened = page.context().waitForEvent('request', r => r.url().includes(`/server/files/timelapse/${video}.mp4`))
        await page.getByTestId('timelapse-download').click()
        expect((await opened).url()).toMatch(new RegExp(`:${MOCK_PORT}/server/files/timelapse/${video}\\.mp4\\?date=\\d+(&token=[^&]+)?$`))
      }
    })

    test('Wi-Fi: changed on the printer\'s network; through Muon3D it says it can\'t be', async ({ page, open, account }) => {
      const cloud = await useRoute(page, account, route)
      await usePrinter(page, PRESETS.idleHomed())
      await open('/wifi')
      await expectRoute(page, cloud)
      const card = page.getByTestId('wifi-card')
      await expect(card).toBeVisible()
      if (cloud) {
        await expect(card).toContainText('Wi-Fi can only be changed on the printer\'s own network.')
        await expect(card.getByTestId('wifi-available')).toHaveCount(0)
        // The gateway refuses the Aux API to every remote session; Control asks nothing it can't have.
        expect(cloud.refused.filter(r => !r.startsWith('GET '))).toEqual([])
      } else {
        await expect(card).not.toContainText('Wi-Fi can only be changed on the printer\'s own network.')
      }
    })
  })
}
