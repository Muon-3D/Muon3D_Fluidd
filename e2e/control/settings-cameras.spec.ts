/**
 * Settings > Cameras: a list of cameras with a thumbnail, their stream type,
 * rotation and flips as pills, a show/hide switch and an order that is saved
 * on the printer; a camera opens into a detail view led by a preview.
 *
 * Each test serves its own `server.webcams.list`; nothing reaches the shared
 * mock's webcams. The cameras' addresses are unreachable on purpose: no video
 * streams, and the thumbnail's error state is what shows.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, type PrinterHandle } from './printer'

type Json = Record<string, any>

const camera = (uid: string, name: string, over: Json = {}): Json => ({
  uid,
  name,
  service: 'mjpegstreamer-adaptive',
  enabled: true,
  source: 'database',
  location: 'printer',
  icon: 'mdiWebcam',
  target_fps: 15,
  target_fps_idle: 5,
  stream_url: 'http://127.0.0.1:9/webcam/?action=stream',
  snapshot_url: 'http://127.0.0.1:9/webcam/?action=snapshot',
  flip_horizontal: false,
  flip_vertical: false,
  rotation: 0,
  aspect_ratio: '4:3',
  extra_data: {},
  ...over
})

const CHAMBER = camera('uid-chamber', 'Chamber', { service: 'webrtc-camerastreamer' })
const TOOLHEAD = camera('uid-toolhead', 'Toolhead', { rotation: 180, flip_horizontal: true })
const SHELF = camera('uid-shelf', 'Shelf webcam', { service: 'ipstream', enabled: false, source: 'config' })

/**
 * A printer whose webcams are these, answering the writes itself so none
 * reaches the shared mock. Database writes are kept per test too: the saved
 * camera order is read back by the page's next load of the fluidd namespace,
 * so a reload shows it and no other test's order is touched.
 */
async function withCameras (page: Page, cameras: Json[], order: string[] = []): Promise<PrinterHandle> {
  const printer = await usePrinter(page)
  const saved = { order }
  printer.state.answer['server.webcams.list'] = { webcams: cameras }
  printer.state.answers['server.webcams.post_item'] = (p: Json) => ({ item: p })
  printer.state.answers['server.webcams.delete_item'] = (p: Json) => ({ item: { uid: p.uid } })
  printer.state.answers['server.database.post_item'] = (p: Json) => {
    if (p.key === 'uiSettings.general.cameraOrder') saved.order = p.value
    return { namespace: p.namespace, key: p.key, value: p.value }
  }
  await page.route(/\/server\/database\/item\?namespace=fluidd$/, async route => {
    const response = await route.fetch()
    const body = await response.json()
    const value = body.result?.value ?? {}
    value.uiSettings = { ...value.uiSettings, general: { ...value.uiSettings?.general, cameraOrder: saved.order } }
    await route.fulfill({ response, json: { ...body, result: { ...body.result, value } } })
  })
  return printer
}

/** The order the camera list shows, by name. */
const names = (page: Page) => page.locator('[data-tid^="camera-row-"] b').allTextContents()

const savedOrder = (printer: PrinterHandle) =>
  printer.called('server.database.post_item').filter(p => p.key === 'uiSettings.general.cameraOrder').map(p => p.value)

async function openCameras (page: Page, open: (path: string) => Promise<void>) {
  await open('/settings#camera')
  await expect(page.getByTestId('cameras-settings')).toBeVisible()
}

test('no cameras: the standard empty state, with one button to add one', async ({ page, open }) => {
  const printer = await withCameras(page, [])
  await openCameras(page, open)
  const empty = page.getByTestId('cameras-empty')
  await expect(empty).toContainText('No cameras yet')
  await expect(empty).toContainText('Plug a USB camera into the printer, or add one by its address.')
  await expect(page.getByRole('button', { name: 'Add Camera' })).toHaveCount(1)
  await expect(page.getByTestId('cameras-list')).toHaveCount(0)
  expect(printer.called('server.webcams.post_item')).toEqual([])
})

test('one camera: a row with its thumbnail, stream type and an on switch', async ({ page, open }) => {
  await withCameras(page, [CHAMBER])
  await openCameras(page, open)
  const row = page.getByTestId('camera-row-Chamber')
  await expect(page.getByTestId('cameras-list')).toContainText('Cameras · 1')
  await expect(row).toContainText('WebRTC (camera-streamer)')
  await expect(row).toContainText('Opens first')
  await expect(row.getByTestId('camera-thumb')).toBeVisible()
  // The address does not answer: a plain "No picture", not a broken image.
  await expect(row.getByTestId('camera-thumb-none')).toBeVisible()
  await expect(row.getByTestId('camera-show-Chamber')).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('cameras-empty')).toHaveCount(0)
})

test('several cameras: pills for rotation, flips and moonraker.conf; a switch off for a hidden one', async ({ page, open, isMobile }) => {
  await withCameras(page, [CHAMBER, TOOLHEAD, SHELF])
  await openCameras(page, open)
  await expect(page.getByTestId('cameras-list')).toContainText('Cameras · 3')
  expect(await names(page)).toEqual(['Chamber', 'Shelf webcam', 'Toolhead'])

  const toolhead = page.getByTestId('camera-row-Toolhead')
  await expect(toolhead).toContainText('MJPEG Adaptive · 15 fps, 5 when not in focus')
  await expect(toolhead).toContainText('180°')
  await expect(toolhead).toContainText('Flipped ↔')

  const shelf = page.getByTestId('camera-row-Shelf webcam')
  await expect(shelf).toContainText('IP Camera · switched off')
  await expect(shelf).toContainText('From moonraker.conf')
  await expect(shelf).not.toContainText('Opens first')
  if (!isMobile) await expect(shelf.getByTestId('camera-show-Shelf webcam')).toHaveAttribute('aria-checked', 'false')
})

test('the show switch saves at once, and sends the camera as it was with the change', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'The phone shows the switch in the detail view')
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-show-Toolhead').click()
  await expect.poll(() => printer.called('server.webcams.post_item')).toHaveLength(1)
  expect(printer.called('server.webcams.post_item')[0]).toEqual({ ...TOOLHEAD, enabled: false })
})

test('adding starts with the stream types as cards, then the detail view pre-filled', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER])
  await openCameras(page, open)
  await page.getByTestId('camera-add').click()
  const types = page.getByTestId('camera-types')
  await expect(types).toContainText('Add Camera')
  for (const name of ['MJPEG Adaptive', 'MJPEG Stream', 'WebRTC (camera-streamer)', 'WebRTC (go2rtc)', 'WebRTC (MediaMTX)', 'HLS Stream', 'IP Camera', 'HTTP page']) {
    await expect(types.getByRole('button', { name: new RegExp(name.replace(/[()]/g, '\\$&')) })).toBeVisible()
  }

  await types.getByTestId('camera-type-webrtc-go2rtc').click()
  await expect(page.getByTestId('camera-detail')).toBeVisible()
  await expect(page.getByTestId('camera-type')).toHaveValue('webrtc-go2rtc')
  await expect(page.getByTestId('camera-stream-url')).toHaveValue('/webcam/?action=stream')
  await expect(page.getByTestId('camera-snapshot-url')).toHaveValue('/webcam/?action=snapshot')
  // A new camera has nothing to remove.
  await expect(page.getByTestId('camera-remove')).toHaveCount(0)

  // The name is required: nothing is sent without it.
  await page.getByTestId('camera-save').click()
  await expect(page.getByTestId('camera-problem')).toHaveText('Give the camera a name.')
  expect(printer.called('server.webcams.post_item')).toEqual([])

  await page.getByTestId('camera-name').fill('Door')
  await page.getByTestId('camera-save').click()
  await expect.poll(() => printer.called('server.webcams.post_item')).toHaveLength(1)
  // Exactly what the old dialog sent for a new camera: no uid, location, icon or aspect ratio.
  expect(printer.called('server.webcams.post_item')[0]).toEqual({
    name: 'Door',
    enabled: true,
    service: 'webrtc-go2rtc',
    stream_url: '/webcam/?action=stream',
    snapshot_url: '/webcam/?action=snapshot',
    target_fps: 15,
    target_fps_idle: 5,
    flip_horizontal: false,
    flip_vertical: false,
    rotation: 0
  })
  await expect(page.getByTestId('cameras-list')).toBeVisible()
  await expect(page.getByTestId('camera-row-Door')).toBeVisible()
})

test('the frame rates show only for MJPEG Adaptive, the aspect ratio only for an HTTP page', async ({ page, open }) => {
  await withCameras(page, [TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Toolhead').click()
  await expect(page.getByTestId('camera-fps')).toHaveValue('15')
  await expect(page.getByTestId('camera-fps-idle')).toHaveValue('5')
  await expect(page.getByTestId('camera-aspect')).toHaveCount(0)

  await page.getByTestId('camera-type').selectOption('iframe')
  await expect(page.getByTestId('camera-fps')).toHaveCount(0)
  await expect(page.getByTestId('camera-fps-idle')).toHaveCount(0)
  await expect(page.getByTestId('camera-aspect')).toBeVisible()

  await page.getByTestId('camera-type').selectOption('hlsstream')
  await expect(page.getByTestId('camera-fps')).toHaveCount(0)
  await expect(page.getByTestId('camera-aspect')).toHaveCount(0)
})

test('editing rotation and flips: the preview follows, and Save sends the camera', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Chamber').click()
  const detail = page.getByTestId('camera-detail')
  await expect(detail).toContainText('Preview shows rotation and flips as you change them')
  await expect(page.getByTestId('camera-preview')).toBeVisible()

  // Nothing is sent while it is being changed.
  await detail.getByRole('radio', { name: '90°' }).click()
  await expect(detail.getByRole('radio', { name: '90°' })).toHaveAttribute('aria-checked', 'true')
  await detail.getByRole('switch', { name: 'Flip vertically' }).click()
  await page.getByTestId('camera-glass-flip-x').click()
  await expect(page.getByTestId('camera-glass-flip-x')).toHaveAttribute('aria-pressed', 'true')
  await expect(detail.getByRole('switch', { name: 'Flip horizontally' })).toHaveAttribute('aria-checked', 'true')
  expect(printer.called('server.webcams.post_item')).toEqual([])

  // The glass Rotate steps on from 90.
  await page.getByTestId('camera-glass-rotate').click()
  await expect(detail.getByRole('radio', { name: '180°' })).toHaveAttribute('aria-checked', 'true')
  await detail.getByRole('radio', { name: '90°' }).click()

  await page.getByTestId('camera-save').click()
  await expect.poll(() => printer.called('server.webcams.post_item')).toHaveLength(1)
  // Every field of the camera goes back, with what changed: uid, location, icon, aspect ratio and all.
  expect(printer.called('server.webcams.post_item')[0]).toEqual({ ...CHAMBER, rotation: 90, flip_horizontal: true, flip_vertical: true })
  await expect(page.getByTestId('cameras-list')).toBeVisible()
})

test('an HTTP page: the aspect ratio is asked for and sent with the rest', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER])
  await openCameras(page, open)
  await page.getByTestId('camera-add').click()
  await page.getByTestId('camera-type-iframe').click()
  await expect(page.getByTestId('camera-type')).toHaveValue('iframe')
  await expect(page.getByTestId('camera-aspect')).toHaveValue('4:3')
  await expect(page.getByTestId('camera-fps')).toHaveCount(0)

  await page.getByTestId('camera-name').fill('Dashboard')
  await page.getByTestId('camera-stream-url').fill('http://127.0.0.1:9/page')
  await page.getByTestId('camera-snapshot-url').fill('http://127.0.0.1:9/shot')
  await page.getByTestId('camera-aspect').fill('16:9')
  await page.getByTestId('camera-save').click()
  await expect.poll(() => printer.called('server.webcams.post_item')).toHaveLength(1)
  expect(printer.called('server.webcams.post_item')[0]).toEqual({
    name: 'Dashboard',
    enabled: true,
    service: 'iframe',
    stream_url: 'http://127.0.0.1:9/page',
    snapshot_url: 'http://127.0.0.1:9/shot',
    target_fps: 15,
    target_fps_idle: 5,
    aspect_ratio: '16:9',
    flip_horizontal: false,
    flip_vertical: false,
    rotation: 0
  })
})

test('the address fields are URL fields without spellcheck', async ({ page, open }) => {
  await withCameras(page, [TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Toolhead').click()
  for (const id of ['camera-stream-url', 'camera-snapshot-url']) {
    await expect(page.getByTestId(id)).toHaveAttribute('type', 'url')
    await expect(page.getByTestId(id)).toHaveAttribute('spellcheck', 'false')
  }
})

test('Save needs what the old dialog needed: nothing is sent until each field is right', async ({ page, open }) => {
  const printer = await withCameras(page, [TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Toolhead').click()
  const save = page.getByTestId('camera-save')
  const problem = page.getByTestId('camera-problem')
  const sent = () => printer.called('server.webcams.post_item')

  // Each field in turn: wrong, refused with its own reason, then put right.
  const cases: Array<[string, string, string, string]> = [
    ['camera-name', '', 'Give the camera a name.', 'Toolhead'],
    ['camera-stream-url', '', 'Enter the stream address.', TOOLHEAD.stream_url],
    ['camera-snapshot-url', '', 'Enter the snapshot address.', TOOLHEAD.snapshot_url],
    ['camera-fps', '', 'Enter the frame rate as a whole number, 1 or more.', '15'],
    ['camera-fps', '0', 'Enter the frame rate as a whole number, 1 or more.', '15'],
    ['camera-fps', '2.5', 'Enter the frame rate as a whole number, 1 or more.', '15'],
    ['camera-fps-idle', '0', 'Enter the background frame rate as a whole number, 1 or more, or leave it empty.', '5'],
    ['camera-fps-idle', '1.5', 'Enter the background frame rate as a whole number, 1 or more, or leave it empty.', '5']
  ]
  for (const [id, bad, message, good] of cases) {
    await page.getByTestId(id).fill(bad)
    await page.getByTestId(id).blur()
    await save.click()
    await expect(problem, `${id} = '${bad}'`).toHaveText(message)
    await expect(page.getByTestId(id)).toHaveAttribute('aria-invalid', 'true')
    expect(sent()).toEqual([])
    await page.getByTestId(id).fill(good)
    await page.getByTestId(id).blur()
    await expect(page.getByTestId(id)).not.toHaveAttribute('aria-invalid', 'true')
  }

  // An empty idle rate is allowed, and is left out, not posted as ''.
  await page.getByTestId('camera-fps-idle').fill('')
  await save.click()
  await expect.poll(sent).toHaveLength(1)
  const { target_fps_idle: idle, ...rest } = TOOLHEAD
  expect(idle).toBe(5)
  expect(sent()[0]).toEqual(rest)
})

test('an HTTP page needs its aspect ratio as width:height', async ({ page, open }) => {
  const printer = await withCameras(page, [camera('uid-web', 'Web', { service: 'iframe', aspect_ratio: '16:9' })])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Web').click()
  for (const bad of ['', '16', 'wide', '16:']) {
    await page.getByTestId('camera-aspect').fill(bad)
    await page.getByTestId('camera-save').click()
    await expect(page.getByTestId('camera-problem'), `'${bad}'`).toHaveText('Enter the aspect ratio as width:height, like 16:9.')
    await expect(page.getByTestId('camera-aspect')).toHaveAttribute('aria-invalid', 'true')
  }
  expect(printer.called('server.webcams.post_item')).toEqual([])
  await page.getByTestId('camera-aspect').fill('21:9')
  await page.getByTestId('camera-save').click()
  await expect.poll(() => printer.called('server.webcams.post_item')).toHaveLength(1)
  expect(printer.called('server.webcams.post_item')[0]).toMatchObject({ uid: 'uid-web', service: 'iframe', aspect_ratio: '21:9' })
})

test('the saved order is the default camera on the Camera page and on Overview', async ({ page, open, isMobile }) => {
  // Alphabetical would open Chamber; the saved order puts Toolhead first.
  await withCameras(page, [CHAMBER, TOOLHEAD], ['uid-toolhead', 'uid-chamber'])
  await open('/camera')
  // A stream that never answers leaves the stage empty, so it is attached, not necessarily visible.
  await expect(page.getByTestId('camera-stage')).toBeAttached()
  await expect(page.getByTestId('camera-stage').locator('.camera-name')).toHaveText('Toolhead')
  await expect(page.getByTestId('camera-chips').getByRole('link').first()).toHaveText('Toolhead')

  await open('/')
  await page.getByTestId('view-toggle').getByRole('button', { name: 'Camera' }).click()
  await expect(page.getByTestId('stage-camera').locator('.camera-name')).toHaveText('Toolhead')
})

test('Cancel leaves the camera as it was and sends nothing', async ({ page, open }) => {
  const printer = await withCameras(page, [TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Toolhead').click()
  await page.getByTestId('camera-name').fill('Renamed')
  await page.getByTestId('camera-cancel').click()
  await expect(page.getByTestId('camera-row-Toolhead')).toBeVisible()
  expect(printer.called('server.webcams.post_item')).toEqual([])
})

test('removing asks first: nothing is sent until the confirm', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD])
  await openCameras(page, open)
  await page.getByTestId('camera-open-Toolhead').click()
  await page.getByTestId('camera-remove').click()
  const confirm = page.getByTestId('confirm')
  await expect(confirm).toContainText('Remove Toolhead?')
  expect(printer.called('server.webcams.delete_item')).toEqual([])

  await confirm.getByTestId('confirm-cancel').click()
  await expect(confirm).toHaveCount(0)
  expect(printer.called('server.webcams.delete_item')).toEqual([])
  await expect(page.getByTestId('camera-detail')).toBeVisible()

  await page.getByTestId('camera-remove').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.called('server.webcams.delete_item')).toEqual([{ uid: 'uid-toolhead' }])
  await expect(page.getByTestId('camera-row-Toolhead')).toHaveCount(0)
  await expect(page.getByTestId('camera-row-Chamber')).toBeVisible()
})

test('the arrows move a camera and save the order on the printer; it is kept after a reload', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD, SHELF])
  await openCameras(page, open)
  expect(await names(page)).toEqual(['Chamber', 'Shelf webcam', 'Toolhead'])

  await page.getByTestId('camera-down-Chamber').click()
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Chamber', 'Toolhead'])
  expect(savedOrder(printer)).toEqual([['uid-shelf', 'uid-chamber', 'uid-toolhead']])

  await page.getByTestId('camera-up-Toolhead').click()
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Toolhead', 'Chamber'])
  expect(savedOrder(printer).at(-1)).toEqual(['uid-shelf', 'uid-toolhead', 'uid-chamber'])
  // The first one that is shown opens by default, and says so.
  await expect(page.getByTestId('camera-row-Shelf webcam')).not.toContainText('Opens first')
  await expect(page.getByTestId('camera-row-Toolhead')).toContainText('Opens first')

  // The order is a UI setting only: Moonraker's webcam records are not written.
  expect(printer.called('server.webcams.post_item')).toEqual([])

  await page.reload()
  await expect(page.getByTestId('cameras-list')).toBeVisible({ timeout: 60_000 })
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Toolhead', 'Chamber'])
})

test('the keyboard moves a camera: arrow keys on its handle', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD, SHELF])
  await openCameras(page, open)
  const grip = page.getByTestId('camera-grip-Chamber')
  await grip.focus()
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Chamber', 'Toolhead'])
  // Focus stays on the moved camera, so the next press moves it on.
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Toolhead', 'Chamber'])
  expect(savedOrder(printer).at(-1)).toEqual(['uid-shelf', 'uid-toolhead', 'uid-chamber'])
  // The ends hold.
  await page.keyboard.press('ArrowDown')
  expect(await names(page)).toEqual(['Shelf webcam', 'Toolhead', 'Chamber'])
})

test('dragging a camera onto another moves it and saves the order', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'Touch uses the arrows')
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD, SHELF])
  await openCameras(page, open)
  await page.getByTestId('camera-row-Toolhead').dragTo(page.getByTestId('camera-row-Chamber'))
  await expect.poll(() => names(page)).toEqual(['Toolhead', 'Chamber', 'Shelf webcam'])
  expect(savedOrder(printer).at(-1)).toEqual(['uid-toolhead', 'uid-chamber', 'uid-shelf'])
})

test('cameras missing from the saved order come last, by name', async ({ page, open }) => {
  await withCameras(page, [CHAMBER, TOOLHEAD, SHELF], ['uid-toolhead', 'uid-gone'])
  await openCameras(page, open)
  await expect.poll(() => names(page)).toEqual(['Toolhead', 'Chamber', 'Shelf webcam'])
})

test('a camera from moonraker.conf opens read-only, with a lock note and no Save or Remove', async ({ page, open }) => {
  const printer = await withCameras(page, [CHAMBER, SHELF])
  await openCameras(page, open)
  const row = page.getByTestId('camera-row-Shelf webcam')
  await expect(row.getByTestId('camera-show-Shelf webcam')).toBeDisabled()
  await row.getByTestId('camera-open-Shelf webcam').click()

  const detail = page.getByTestId('camera-detail')
  await expect(page.getByTestId('camera-locked')).toContainText('Managed by your Moonraker configuration.')
  await expect(page.getByTestId('camera-locked')).toContainText('Change it in moonraker.conf; Control can only show it.')
  await expect(page.getByTestId('camera-name')).toBeDisabled()
  await expect(page.getByTestId('camera-type')).toBeDisabled()
  await expect(detail.getByRole('radio', { name: '90°' })).toBeDisabled()
  await expect(detail.getByRole('switch', { name: 'Flip horizontally' })).toBeDisabled()
  await expect(page.getByTestId('camera-save')).toHaveCount(0)
  await expect(page.getByTestId('camera-remove')).toHaveCount(0)
  await expect(page.getByTestId('camera-glass-rotate')).toHaveCount(0)

  await page.getByTestId('camera-back').click()
  // It can still be moved in the order.
  await page.getByTestId('camera-up-Shelf webcam').click()
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Chamber'])
  expect(savedOrder(printer).at(-1)).toEqual(['uid-shelf', 'uid-chamber'])
  expect(printer.called('server.webcams.post_item')).toEqual([])
})

test('Viewing: Fullscreen action is a segmented row that saves, and Camera on Overview links to General', async ({ page, open, isMobile }) => {
  const printer = await withCameras(page, [CHAMBER])
  await openCameras(page, open)
  const fullscreen = page.getByRole('radiogroup', { name: 'Fullscreen action' })
  await expect(fullscreen.getByRole('radio', { name: 'Embed' })).toHaveAttribute('aria-checked', 'true')
  await fullscreen.getByRole('radio', { name: 'Raw stream' }).click()
  await expect(fullscreen.getByRole('radio', { name: 'Raw stream' })).toHaveAttribute('aria-checked', 'true')
  await expect.poll(() => printer.called('server.database.post_item').filter(p => p.key === 'uiSettings.general.cameraFullscreenAction').map(p => p.value)).toEqual(['rawstream'])

  await page.getByTestId('camera-overview-link').click()
  await expect(page).toHaveURL(/\/settings#general$/)
  // Desktop marks General in the list beside it; the phone shows the section with a way back.
  if (isMobile) await expect(page.getByTestId('cameras-settings')).toHaveCount(0)
  else await expect(page.getByTestId('settings-general')).toHaveAttribute('aria-current', 'page')
})

test('phone: no sideways scroll, the arrows work by touch, and a camera opens with a way back', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'The phone layout')
  const printer = await withCameras(page, [CHAMBER, TOOLHEAD, SHELF])
  await openCameras(page, open)
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(await overflow()).toBeLessThanOrEqual(0)

  await page.getByTestId('camera-down-Chamber').tap()
  await expect.poll(() => names(page)).toEqual(['Shelf webcam', 'Chamber', 'Toolhead'])
  expect(savedOrder(printer).at(-1)).toEqual(['uid-shelf', 'uid-chamber', 'uid-toolhead'])

  await page.getByTestId('camera-open-Toolhead').tap()
  await expect(page.getByTestId('camera-preview')).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Enable' })).toBeVisible()
  expect(await overflow()).toBeLessThanOrEqual(0)
  const [preview, name] = [await page.getByTestId('camera-preview').boundingBox(), await page.getByTestId('camera-name').boundingBox()]
  expect(preview!.y).toBeLessThan(name!.y)
  await page.getByTestId('camera-back').tap()
  await expect(page.getByTestId('cameras-list')).toBeVisible()
})
