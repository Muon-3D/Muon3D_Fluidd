/**
 * Overview: the default layout, Edit mode and the Add widget catalogue.
 *
 * Layouts are kept per person and printer in the browser (and the printer's
 * settings), so each test starts from a fresh browser context.
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

/**
 * The photoreal M1 in software WebGL (SwiftShader) costs seconds a frame and
 * stalls the page, so clicks never see a stable element. On Windows the
 * browser draws on the real GPU; elsewhere (Linux CI, no GPU) the stage uses
 * the simple model, as in overview-parts.spec.ts.
 */
const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  // An idle printer: the mid-print mock keeps the stage drawing a live toolpath every frame, which on a CI runner
  // without a GPU leaves the page too busy to take a click (the layout is the same either way).
  // The layout these tests save stays with this page ({ database: true }): saved to the shared mock it
  // reached the tests running beside it, which then opened on another test's layout (no Position).
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

const cell = (page: Page, id: string) => page.locator(`[data-cell="${id}"]`)
const ids = async (page: Page) => page.locator('[data-cell]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cell))
const box = async (l: Locator) => {
  const b = await l.boundingBox()
  if (!b) throw new Error('not on screen')
  return b
}

/** The tiles' glide to a new size has finished: a box read before that is where the tile was passing, not where it is. */
const glided = async (page: Page) => page.evaluate(() => Promise.all([...document.querySelectorAll('[data-cell]')].flatMap(e => e.getAnimations()).map(a => a.finished)))

async function edit (page: Page) {
  await page.getByTestId('edit-open').click()
  await expect(page.getByTestId('edit-done')).toBeVisible()
}

test('the default layout: the printer left and wider, job and filament stacked on the right, then four tiles', async ({ page, open, isMobile }) => {
  await open('/')
  await expect(page.getByTestId('overview-page')).toBeVisible()
  expect(await ids(page)).toEqual(['stage', 'job', 'filament', 'mode', 'position', 'graph', 'trackpad', 'jog', 'macros'])
  // Off by default, found in Add widget.
  for (const id of ['hotend', 'bed', 'fans', 'zoffset', 'camera', 'bedmesh', 'console', 'system', 'care', 'library']) await expect(cell(page, id)).toHaveCount(0)
  if (isMobile) return
  const stage = await box(cell(page, 'stage'))
  const job = await box(cell(page, 'job'))
  const filament = await box(cell(page, 'filament'))
  expect(stage.x).toBeLessThan(job.x)
  expect(stage.width).toBeGreaterThan(job.width * 1.5)
  expect(Math.abs(job.x - filament.x)).toBeLessThan(2)
  expect(filament.y).toBeGreaterThan(job.y)
  const row = await Promise.all(['mode', 'position'].map(id => box(cell(page, id))))
  for (const b of row) expect(Math.abs(b.y - row[0].y)).toBeLessThan(2)
  expect(row[0].y).toBeGreaterThan(stage.y + stage.height - 2)
  // The Movement trackpad, then Jog and Position as their own widgets.
  await expect(page.locator('[data-tile="trackpad"]')).toBeVisible()
  await expect(page.locator('[data-tile="jog"]')).toBeVisible()
  await expect(page.locator('[data-tile="position"]')).toBeVisible()
})

test('Add widget lists the catalogue by category with the sizes each offers, and adds one', async ({ page, open }) => {
  await open('/')
  await edit(page)
  await page.getByTestId('widget-sheet-open').click()
  await expect(page.getByTestId('widget-sheet')).toBeVisible()
  // KAN-1959: no "Add to Overview" and no "On": a plain + when hidden, − when on the page.
  await expect(page.getByTestId('widget-sheet').getByText('Add to Overview')).toHaveCount(0)
  await expect(page.getByTestId('widget-sheet').getByText('On', { exact: true })).toHaveCount(0)
  await expect(page.getByTestId('widget-remove-job')).toHaveText('−')
  await expect(page.getByTestId('widget-add-job')).toHaveCount(0)
  // The 3D printer has no S.
  await expect(page.getByTestId('widget-size-stage-S')).toHaveCount(0)
  await page.getByTestId('widget-search').fill('cam')
  await expect(page.getByTestId('widget-card-camera')).toBeVisible()
  await expect(page.getByTestId('widget-card-jog')).toHaveCount(0)
  await page.getByTestId('widget-size-camera-M').click()
  await expect(page.getByTestId('widget-add-camera')).toHaveText('+')
  await page.getByTestId('widget-add-camera').click()
  // The sheet stays open and the row now offers −.
  await expect(page.getByTestId('widget-remove-camera')).toBeVisible()
  await page.getByTestId('widget-sheet-close').click()
  await expect(page.getByTestId('widget-sheet')).toHaveCount(0)
  await expect(cell(page, 'camera')).toBeVisible()
  expect((await ids(page)).slice(-1)).toEqual(['camera'])
  await expect(cell(page, 'camera')).toHaveAttribute('style', /--span: 6/)
})

test('a widget can be removed, and comes back from Add widget', async ({ page, open }) => {
  await open('/')
  await edit(page)
  await cell(page, 'position').getByTestId('tile-remove').click()
  await expect(cell(page, 'position')).toHaveCount(0)
  await page.getByTestId('widget-sheet-open').click()
  await expect(page.getByTestId('widget-add-position')).toBeVisible()
  await page.getByTestId('widget-add-position').click()
  await expect(cell(page, 'position')).toBeVisible()
  // And − in the sheet takes it off again.
  await page.getByTestId('widget-remove-position').click()
  await expect(cell(page, 'position')).toHaveCount(0)
  await expect(page.getByTestId('widget-add-position')).toBeVisible()
})

test('a size that does not exist snaps to the nearest one the widget offers', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'Tiles cannot be resized below 1100 px; the sheet picks the size there.')
  await open('/')
  await edit(page)
  const grip = cell(page, 'position').getByTestId('tile-grip')
  const span = async () => (await cell(page, 'position').getAttribute('style'))?.match(/--span: (\d+)/)?.[1]
  expect(await span()).toBe('6')
  // The arrows step through S, M and L only.
  await grip.focus()
  await grip.press('Shift+ArrowRight')
  expect(await span()).toBe('8')
  await grip.press('Shift+ArrowRight')
  expect(await span()).toBe('8')
  // Dragging the corner to about 6.5 columns lands on M (6), not on 6.5. Measured once the tile has sprung to its size.
  await glided(page)
  await cell(page, 'position').evaluate(e => e.scrollIntoView({ block: 'center' }))
  const handle = cell(page, 'position').getByTestId('tile-resize')
  const hb = await box(handle)
  const column = (await box(page.getByTestId('overview-grid'))).width / 12
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await page.mouse.down()
  await page.mouse.move(hb.x + hb.width / 2 - column * 1.5, hb.y + hb.height / 2, { steps: 6 })
  await page.mouse.up()
  expect(await span()).toBe('6')
  // The printer view has no small size: asking for one gives its M.
  const stageGrip = cell(page, 'stage').getByTestId('tile-grip')
  await stageGrip.focus()
  await stageGrip.press('Shift+ArrowLeft')
  await expect(cell(page, 'stage')).toHaveAttribute('style', /--span: 8/)
  await expect(cell(page, 'stage')).toHaveAttribute('style', /--rows: 2/)
})

test('the layout persists after a reload, and Reset brings the default back', async ({ page, open }) => {
  await open('/')
  await edit(page)
  await cell(page, 'position').getByTestId('tile-remove').click()
  await page.getByTestId('widget-sheet-open').click()
  await page.getByTestId('widget-add-camera').click()
  await page.getByTestId('widget-sheet-close').click()
  await page.getByTestId('edit-done').click()
  await expect(page.getByTestId('edit-open')).toBeVisible()
  const after = await ids(page)
  expect(after).not.toContain('position')
  expect(after.slice(-1)).toEqual(['camera'])
  await page.reload()
  await expect(page.getByTestId('overview-page')).toBeVisible()
  expect(await ids(page)).toEqual(after)
  await edit(page)
  await page.getByTestId('edit-reset').click()
  await page.getByTestId('edit-done').click()
  expect(await ids(page)).toEqual(['stage', 'job', 'filament', 'mode', 'position', 'graph', 'trackpad', 'jog', 'macros'])
})

test('the phone layout: one column, small widgets two to a row, the Add widget sheet from the bottom', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'Phone only.')
  await open('/')
  const stage = await box(cell(page, 'stage'))
  const job = await box(cell(page, 'job'))
  expect(job.width).toBeGreaterThan(stage.width * 0.9)
  await edit(page)
  await expect(page.getByTestId('tile-resize')).toHaveCount(0)
  await page.getByTestId('widget-sheet-open').click()
  const sheet = await box(page.getByTestId('widget-sheet').locator('.overview__sheet-card'))
  const viewport = page.viewportSize()!
  // Anchored to the bottom, and clear of the tab bar so its buttons can be pressed.
  const tabs = await box(page.getByRole('navigation', { name: 'Pages' }))
  expect(sheet.y + sheet.height).toBeLessThanOrEqual(tabs.y + 1)
  expect(sheet.y + sheet.height).toBeGreaterThan(tabs.y - 40)
  expect(sheet.width).toBeGreaterThan(viewport.width * 0.95)
  await page.getByTestId('widget-add-care').click()
  await expect(cell(page, 'care')).toBeVisible()
})

test('Jog and Position at size L have no Home all of their own (KAN-1955 / KAN-2023); Position keeps Home Z', async ({ page, open }) => {
  await open('/')
  await edit(page)
  // Put both back at size L through Add widget (works on the desktop grid and on a phone alike).
  for (const id of ['jog', 'position']) {
    await cell(page, id).getByTestId('tile-remove').click()
    await page.getByTestId('widget-sheet-open').click()
    await page.getByTestId(`widget-size-${id}-L`).click()
    await page.getByTestId(`widget-add-${id}`).click()
    await page.getByTestId('widget-sheet-close').click()
    await expect(cell(page, id)).toBeVisible()
  }
  await page.getByTestId('edit-done').click()
  await expect(page.locator('[data-tile="jog"]').getByRole('button', { name: /Home all/i })).toHaveCount(0)
  await expect(page.locator('[data-tile="position"]').getByTestId('position-homes').getByRole('button', { name: 'Home Z' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Home X ?Y/i })).toHaveCount(0)
})
