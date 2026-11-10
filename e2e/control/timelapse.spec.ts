/**
 * Timelapse: a page to watch. The videos four across (two on a phone), this
 * print's card while it renders, each video's ··· (download, rename,
 * delete), the header's link to Settings › Timelapse, and the empty, error,
 * offline and not-installed states.
 *
 * The timelapse folder and moonraker-timelapse are answered per test by
 * usePrinter, so nothing here changes what the shared mock tells other tests.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'
import type { Page } from '@playwright/test'

const COMPONENTS = [
  'database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'shell_command', 'proc_stats',
  'job_state', 'job_queue', 'http_client', 'announcements', 'webcam', 'extensions', 'update_manager',
  'history', 'authorization', 'muon_floor', 'aux_api_proxy', 'muon_protection'
]

const NOW = Date.now() / 1000
const VIDEOS = [
  ['M1_bracket_PLA_0.2mm', '20261104_0912', 84_000_000],
  ['cable_clip_x6_PLA_0.2mm', '20261103_1720', 46_000_000],
  ['benchy_PETG_0.16mm', '20261102_1410', 120_000_000],
  ['fan_duct_v3_PLA_0.2mm', '20261101_0830', 60_000_000],
  ['calibration_cube_PLA_0.2mm', '20261031_1900', 12_000_000]
] as const

function folder (files: Array<{ filename: string, size: number, modified: number }>) {
  return {
    dirs: [],
    files: files.map(f => ({ ...f, permissions: 'rw' })),
    disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
    root_info: { name: 'timelapse', permissions: 'rw' }
  }
}

const videoFiles = () => VIDEOS.flatMap(([name, at, size], i) => [
  { filename: `timelapse_${name}_${at}.mp4`, size, modified: NOW - i * 86400 },
  { filename: `timelapse_${name}_${at}.jpg`, size: 200_000, modified: NOW - i * 86400 }
])

/** A printer with moonraker-timelapse, its folder holding `files`. */
async function timelapsePrinter (page: Page, files = videoFiles(), components = [...COMPONENTS, 'timelapse']): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { components })
  printer.state.answers['machine.timelapse.get_settings'] = {
    enabled: true, autorender: true, camera: '', mode: 'layermacro', blockedsettings: [], stream_delay_compensation: 0.05
  }
  printer.state.answers['machine.timelapse.lastframeinfo'] = { count: 0, lastframefile: '' }
  printer.state.answers['server.files.get_directory'] = (params: Record<string, unknown>) => {
    if (String(params.path ?? '').startsWith('timelapse')) return folder(files)
    return { ...folder([{ filename: 'M1_bracket_PLA_0.2mm.gcode', size: 4_000_000, modified: NOW }]), root_info: { name: 'gcodes', permissions: 'rw' } }
  }
  await page.route('**/server/files/timelapse/**', route => route.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }))
  return printer
}

async function openTimelapse (page: Page, open: (path: string) => Promise<void>, drawn = 'timelapse-videos') {
  await open('/timelapse')
  await expect(page.getByTestId(drawn)).toBeVisible()
}

/** How many cards sit on the grid's first row. */
async function firstRow (page: Page): Promise<number> {
  const tops = await page.locator('[data-tid="timelapse-videos"] > article').evaluateAll(cards => cards.map(c => Math.round(c.getBoundingClientRect().top)))
  return tops.filter(top => top === tops[0]).length
}

test('the videos, four across on a desktop and two on a phone, read from the timelapse folder', async ({ page, open }, testInfo) => {
  const printer = await timelapsePrinter(page)
  await openTimelapse(page, open)
  await expect(page.getByTestId('page-title')).toHaveText('Timelapse')
  await expect(page.locator('.app-page-header__subtitle')).toContainText('5 videos · ')
  await expect(page.locator('.app-page-header__subtitle')).toContainText('on Boxwood')
  await expect(page.locator('[data-tid="timelapse-videos"] > article')).toHaveCount(5)
  await expect(page.getByRole('button', { name: /^Play M1 bracket/ })).toBeVisible()
  expect(await firstRow(page)).toBe(testInfo.project.name === 'phone' ? 2 : 4)
  expect(printer.called('server.files.get_directory').some(p => p.root === 'timelapse' && p.path === 'timelapse')).toBe(true)
  // The settings live in Settings, not on the page.
  await expect(page.getByText('Take a timelapse')).toHaveCount(0)
})

test('the header links to Timelapse settings, where turning timelapse off is sent to the printer', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  await openTimelapse(page, open)
  await page.getByTestId('timelapse-settings-link').click()
  await expect(page).toHaveURL(/\/settings#timelapse$/)
  const enabled = page.getByTestId('timelapse-setting-enabled')
  await expect(enabled).toBeVisible()
  await enabled.click()
  await expect.poll(() => printer.called('machine.timelapse.post_settings').at(-1)).toMatchObject({ enabled: false })
})

test('a video\'s ··· renames it with its picture, and deletes it after asking', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  await openTimelapse(page, open)
  const card = page.locator('[data-file="timelapse_M1_bracket_PLA_0.2mm_20261104_0912.mp4"]')
  await card.getByTestId('timelapse-item-more').click()
  await page.getByTestId('timelapse-rename').click()
  await page.getByTestId('file-name-input').fill('bracket_run')
  await page.getByTestId('file-name-save').click()
  await expect.poll(() => printer.called('server.files.move')).toEqual([
    { source: 'timelapse/timelapse_M1_bracket_PLA_0.2mm_20261104_0912.mp4', dest: 'timelapse/bracket_run.mp4' },
    { source: 'timelapse/timelapse_M1_bracket_PLA_0.2mm_20261104_0912.jpg', dest: 'timelapse/bracket_run.jpg' }
  ])

  await card.getByTestId('timelapse-item-more').click()
  await page.getByTestId('timelapse-delete').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.called('server.files.delete_file').map(p => p.path)).toEqual([
    'timelapse/timelapse_M1_bracket_PLA_0.2mm_20261104_0912.mp4',
    'timelapse/timelapse_M1_bracket_PLA_0.2mm_20261104_0912.jpg'
  ])
})

const BRACKET = 'timelapse_M1_bracket_PLA_0.2mm_20261104_0912'

/** Opens the rename box on the bracket video and types `name` in it. */
async function renameBracket (page: Page, name: string) {
  const card = page.locator(`[data-file="${BRACKET}.mp4"]`)
  await card.getByTestId('timelapse-item-more').click()
  await page.getByTestId('timelapse-rename').click()
  await page.getByTestId('file-name-input').fill(name)
  await page.getByTestId('file-name-save').click()
}

test('a rename the printer refuses says so, and the picture is not moved after it', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  printer.state.failOn['server.files.move'] = 'The file is in use'
  await openTimelapse(page, open)
  await renameBracket(page, 'bracket_run')
  await expect(page.getByTestId('timelapse-rename-note')).toContainText("Couldn't rename M1 bracket")
  // The video was tried once; the picture beside it was left alone.
  expect(printer.called('server.files.move')).toEqual([{ source: `timelapse/${BRACKET}.mp4`, dest: 'timelapse/bracket_run.mp4' }])
  await expect(page.locator(`[data-file="${BRACKET}.mp4"]`)).toBeVisible()
})

test('a name the folder already holds is refused with a message, and nothing is moved', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  await openTimelapse(page, open)
  await renameBracket(page, 'timelapse_cable_clip_x6_PLA_0.2mm_20261103_1720')
  await expect(page.getByTestId('timelapse-rename-note')).toContainText("There's already a file called timelapse_cable_clip_x6_PLA_0.2mm_20261103_1720.mp4")
  expect(printer.called('server.files.move')).toEqual([])
})

test('a picture that is not a .jpg is renamed with its own extension', async ({ page, open }) => {
  const printer = await timelapsePrinter(page, [
    { filename: 'clip.mp4', size: 1_000_000, modified: NOW },
    { filename: 'clip.png', size: 200_000, modified: NOW }
  ])
  await openTimelapse(page, open)
  const card = page.locator('[data-file="clip.mp4"]')
  await card.getByTestId('timelapse-item-more').click()
  await page.getByTestId('timelapse-rename').click()
  await page.getByTestId('file-name-input').fill('bracket_run')
  await page.getByTestId('file-name-save').click()
  await expect.poll(() => printer.called('server.files.move')).toEqual([
    { source: 'timelapse/clip.mp4', dest: 'timelapse/bracket_run.mp4' },
    { source: 'timelapse/clip.png', dest: 'timelapse/bracket_run.png' }
  ])
})

test('the header has a way back to History', async ({ page, open }) => {
  await timelapsePrinter(page)
  await openTimelapse(page, open)
  await expect(page.getByTestId('page-back')).toHaveAttribute('aria-label', 'Back to History')
  await page.getByTestId('page-back').click()
  await expect(page).toHaveURL(/\/boxwood-367a\/history$/)
})

test('this print comes first while it renders, with its progress and no play button; its frames can be saved', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  printer.state.answers['machine.timelapse.lastframeinfo'] = { count: 240, lastframefile: 'frame000240.jpg' }
  await page.route('**/server/files/timelapse_frames/**', route => route.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }))
  await openTimelapse(page, open)
  const now = page.getByTestId('timelapse-status')
  await expect(now).toContainText('240 frames so far')
  await expect(page.locator('[data-tid="timelapse-videos"] > article').first()).toHaveAttribute('data-tid', 'timelapse-status')

  await now.getByTestId('timelapse-frames-open').click()
  await page.getByTestId('timelapse-frames-save').click()
  await expect.poll(() => printer.called('machine.timelapse.saveframes').length).toBe(1)
  await page.keyboard.press('Escape')

  printer.notify('notify_timelapse_event', { action: 'render', status: 'running', progress: 62 })
  await expect(now.getByTestId('timelapse-rendering')).toHaveText('Rendering · 62%')
  await expect(now.locator('.tl__play')).toHaveCount(0)
  await expect(now.getByTestId('timelapse-frames-open')).toBeDisabled()
})

test('empty state: no videos yet, and the way to turn timelapse on', async ({ page, open }) => {
  await timelapsePrinter(page, [])
  await openTimelapse(page, open, 'timelapse-empty')
  await expect(page.getByTestId('timelapse-empty')).toContainText('No timelapses yet')
  await expect(page.locator('.app-page-header__subtitle')).toContainText('0 videos')
  await page.getByTestId('timelapse-empty').getByRole('link', { name: 'Timelapse settings' }).click()
  await expect(page).toHaveURL(/\/settings#timelapse$/)
})

test('error state: the folder didn\'t come, and Retry reads it again', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  const folderAnswer = printer.state.answers['server.files.get_directory']
  delete printer.state.answers['server.files.get_directory']
  printer.state.failOn['server.files.get_directory'] = 'Access Denied'
  await openTimelapse(page, open, 'timelapse-error')
  await expect(page.getByTestId('timelapse-error')).toContainText("Couldn't read the timelapse folder")
  delete printer.state.failOn['server.files.get_directory']
  printer.state.answers['server.files.get_directory'] = folderAnswer
  await page.getByTestId('timelapse-retry').click()
  await expect(page.locator('[data-tid="timelapse-videos"] > article')).toHaveCount(5)
})

test('offline state: it says so, and the videos can\'t be played or changed', async ({ page, open }) => {
  const printer = await timelapsePrinter(page)
  await openTimelapse(page, open)
  await printer.offline()
  await expect(page.getByTestId('timelapse-offline')).toContainText('Boxwood is offline')
  await expect(page.getByRole('button', { name: /^Play M1 bracket/ })).toBeDisabled()
  printer.online()
})

test('Timelapse is only there with moonraker-timelapse: Jobs\' ··· lists it, and the page says when it isn\'t set up', async ({ page, open }) => {
  await timelapsePrinter(page, videoFiles(), COMPONENTS)
  await open('/jobs')
  await page.getByTestId('jobs-more').click()
  await expect(page.getByTestId('jobs-more-preview')).toBeVisible()
  await expect(page.getByTestId('jobs-more-timelapse')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await open('/timelapse')
  await expect(page.getByTestId('timelapse-unsupported')).toContainText("Timelapse isn't set up on Boxwood")
})

test('with moonraker-timelapse, Jobs\' ··· opens Timelapse', async ({ page, open }) => {
  await timelapsePrinter(page)
  await open('/jobs')
  await page.getByTestId('jobs-more').click()
  await page.getByTestId('jobs-more-timelapse').click()
  await expect(page.getByTestId('timelapse-videos')).toBeVisible()
})
