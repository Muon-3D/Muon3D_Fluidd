/**
 * Camera: the printer's camera full-bleed in a 9-column tile, Snapshot and
 * Full screen on the picture, a chip per camera when there are several, and
 * the stream's details in a side tile (on a phone, in the tile's ··· menu).
 *
 * The cameras come from Moonraker's server.webcams.list, answered per test;
 * their pictures from an address the test serves (or refuses), never a real
 * camera.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAE0lEQVR4nGPQiAogCTGMahgUGgCvtHYhDo2f2wAAAABJRU5ErkJggg==', 'base64')

function webcam (uid: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    uid,
    name,
    location: 'printer',
    service: 'mjpegstreamer',
    enabled: true,
    icon: 'mdiWebcam',
    target_fps: 15,
    target_fps_idle: 5,
    stream_url: `http://camera.e2e/${uid}/stream`,
    snapshot_url: `http://camera.e2e/${uid}/snapshot`,
    flip_horizontal: false,
    flip_vertical: false,
    rotation: 0,
    aspect_ratio: '16:9',
    source: 'database',
    extra_data: {},
    ...extra
  }
}

const CHAMBER = webcam('chamber', 'Chamber')
const TOOLHEAD = webcam('toolhead', 'Toolhead')
const BED = webcam('bed', 'Bed', { target_fps: 30 })

/** Answers every camera address with a picture, or refuses it (the camera is unplugged). */
async function serveCameras (page: Page, reachable = true) {
  // On the context, so a snapshot opened in a new tab is answered too.
  await page.context().route('http://camera.e2e/**', route => reachable
    ? route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
    : route.abort('connectionrefused'))
}

async function withCameras (page: Page, cameras: unknown[], reachable = true) {
  await serveCameras(page, reachable)
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answer['server.webcams.list'] = { webcams: cameras }
  return printer
}

test('no camera: the page says so and offers to add one, with nothing to snapshot', async ({ page, open }) => {
  await withCameras(page, [])
  await open('/camera')
  const empty = page.getByTestId('camera-empty')
  await expect(empty).toContainText('This printer has no camera set up')
  await expect(page.getByTestId('camera-tile')).toHaveCount(0)
  await expect(page.getByTestId('camera-snapshot')).toHaveCount(0)
  await empty.getByRole('link', { name: 'Add a camera' }).click()
  await expect(page).toHaveURL(/\/boxwood-367a\/settings#camera$/)
})

test('no camera: Camera is not in the printer\'s pages', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'the rail is the desktop\'s list of pages')
  await withCameras(page, [])
  await open('/control')
  await expect(page.getByRole('link', { name: 'Control' }).first()).toBeVisible()
  await expect(page.locator('nav').getByRole('link', { name: 'Camera', exact: true })).toHaveCount(0)
})

test('one camera: its picture fills a wide tile, with no chips, the header line and the actions', async ({ page, open, isMobile }) => {
  const printer = await withCameras(page, [CHAMBER])
  await open('/camera')
  await expect(page.getByTestId('page-title')).toHaveText('Camera')
  await expect(page.getByText('Live view of Boxwood')).toBeVisible()
  const tile = page.getByTestId('camera-tile')
  await expect(tile.locator('img')).toHaveAttribute('src', /camera\.e2e\/chamber\/stream/)
  await expect(page.getByTestId('camera-live')).toContainText('Live')
  await expect(page.getByTestId('camera-live')).toContainText('15 fps')
  await expect(page.getByTestId('camera-chips')).toHaveCount(0)
  await expect(page.getByTestId('camera-stage-snapshot')).toBeVisible()
  await expect(page.getByTestId('camera-stage-fullscreen')).toBeVisible()
  await expect(page.getByTestId('camera-snapshot')).toBeVisible()
  expect(printer.called('server.webcams.list').length).toBeGreaterThan(0)

  const box = await tile.boundingBox()
  const viewport = page.viewportSize()!
  if (isMobile) {
    expect(box!.width).toBeGreaterThan(viewport.width * 0.85)
    await expect(page.getByTestId('camera-info')).toHaveCount(0)
  } else {
    // Nine of twelve columns, the side tile the other three.
    const info = await page.getByTestId('camera-info').boundingBox()
    expect(box!.width).toBeGreaterThan(info!.width * 2.5)
    expect(info!.x).toBeGreaterThan(box!.x + box!.width)
  }
})

test('the stream\'s details: in the side tile, or the tile\'s ··· menu on a phone, without the address\'s secrets', async ({ page, open, isMobile }) => {
  await withCameras(page, [webcam('chamber', 'Chamber', { stream_url: 'http://viewer:hunter2@camera.e2e/chamber/stream?token=abc' })])
  await open('/camera')
  if (isMobile) {
    await page.getByTestId('camera-details-trigger').click()
  }
  const details = page.locator('#camera-details')
  await expect(details).toBeVisible()
  await expect(details).toContainText('mjpegstreamer')
  await expect(details).toContainText('15 fps, 5 idle')
  await expect(details).toContainText('Not turned')
  await expect(details).not.toContainText('hunter2')
  await expect(details).not.toContainText('abc')
  if (isMobile) {
    await page.keyboard.press('Escape')
    await expect(details).toBeHidden()
  } else {
    await expect(page.getByTestId('camera-info')).toContainText('Chamber')
    await page.getByTestId('camera-settings').click()
    await expect(page).toHaveURL(/\/boxwood-367a\/settings#camera$/)
  }
})

test('several cameras: a chip each, the open one marked, and a chip switches the picture', async ({ page, open }) => {
  await withCameras(page, [CHAMBER, TOOLHEAD, BED])
  await open('/camera')
  const chips = page.getByTestId('camera-chips').getByRole('link')
  // In name order; the first opens.
  await expect(chips).toHaveText(['Bed', 'Chamber', 'Toolhead'])
  await expect(chips.nth(0)).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('camera-live')).toContainText('30 fps')
  await chips.getByText('Toolhead').click()
  await expect(page).toHaveURL(/\/boxwood-367a\/camera\/toolhead$/)
  await expect(chips.nth(2)).toHaveAttribute('aria-current', 'page')
  await expect(chips.nth(0)).not.toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('camera-tile').locator('img')).toHaveAttribute('src', /camera\.e2e\/toolhead\/stream/)
  await expect(page.getByTestId('camera-live')).toContainText('15 fps')
})

test('a camera by its address opens that camera', async ({ page, open }) => {
  await withCameras(page, [CHAMBER, TOOLHEAD])
  await open('/camera/toolhead')
  await expect(page.getByTestId('camera-chips').getByRole('link', { name: 'Toolhead' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('camera-tile').locator('img')).toHaveAttribute('src', /toolhead\/stream/)
})

test('a camera that does not answer: the tile says so, and Retry draws it again once it does', async ({ page, open }) => {
  let reachable = false
  await page.route('http://camera.e2e/**', route => reachable
    ? route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
    : route.abort('connectionrefused'))
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answer['server.webcams.list'] = { webcams: [CHAMBER] }
  await open('/camera')
  const error = page.getByTestId('camera-error')
  await expect(error).toContainText('Can\'t reach Chamber')
  await expect(page.getByTestId('camera-live')).toHaveCount(0)
  await expect(page.getByTestId('camera-stage-snapshot')).toHaveCount(0)
  reachable = true
  await error.getByRole('button', { name: 'Retry' }).click()
  await expect(error).toHaveCount(0)
  await expect(page.getByTestId('camera-live')).toContainText('Live')
})

test('Snapshot on the picture saves the camera\'s snapshot', async ({ page, open }) => {
  await withCameras(page, [CHAMBER])
  await open('/camera')
  await expect(page.getByTestId('camera-live')).toBeVisible()
  // The picture comes from another address, so the page opens the camera's own snapshot.
  const opened = page.context().waitForEvent('page')
  await page.getByTestId('camera-stage-snapshot').click()
  expect((await opened).url()).toBe('http://camera.e2e/chamber/snapshot')
})

test('the header\'s ··· menu: Full screen, the camera settings and adding a camera', async ({ page, open }) => {
  await withCameras(page, [CHAMBER])
  await open('/camera')
  await page.getByTestId('camera-more').click()
  await expect(page.getByTestId('camera-fullscreen')).toBeVisible()
  await expect(page.getByTestId('camera-more-settings')).toBeVisible()
  await page.getByTestId('camera-more-add').click()
  await expect(page).toHaveURL(/\/boxwood-367a\/settings#camera$/)
})

test('Timelapse is in the header when the printer records them', async ({ page, open }) => {
  await serveCameras(page)
  const printer = await usePrinter(page, PRESETS.idleHomed(), {
    components: ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'history', 'timelapse', 'authorization']
  })
  printer.state.answer['server.webcams.list'] = { webcams: [CHAMBER] }
  printer.state.answer['machine.timelapse.get_settings'] = { enabled: true }
  await open('/camera')
  await page.getByTestId('camera-timelapse').click()
  await expect(page).toHaveURL(/\/boxwood-367a\/timelapse$/)
})

test('offline: the page says the printer is unreachable and keeps the last view', async ({ page, open }) => {
  await withCameras(page, [CHAMBER])
  await open('/camera')
  await expect(page.getByTestId('camera-live')).toBeVisible()
  await page.context().setOffline(true)
  await expect(page.locator('[data-tid^="connection-"]').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('camera-tile')).toBeVisible()
  await page.context().setOffline(false)
})
