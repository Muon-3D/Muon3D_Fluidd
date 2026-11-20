import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { test, expect, ready, PRINTER } from '../fixtures'
import { routeCounts, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { usePrinter, PRESETS } from './printer'

let printer: Awaited<ReturnType<typeof usePrinter>>

test.use({ signedIn: true, serviceWorkers: 'block' })

test.beforeEach(async ({ page, account }) => {
  await useAllRoutes(page, account)
  printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await page.goto('/')
  await ready(page)
  await page.evaluate(async id => {
    const { chooseRouteMode } = await import(/* @vite-ignore */ '../../../../../../../../src/services/muon-cloud/route-choice.ts')
    const { activateCloudPrinter } = await import(/* @vite-ignore */ '../../../../../../../../src/services/muon-cloud/activate.ts')
    chooseRouteMode(id, 'cloud')
    await activateCloudPrinter(id)
  }, ROUTE_PRINTER.id)
  await expect.poll(async () => (await routeCounts(page)).routes.at(-1)).toBe('cloud')
  await expect.poll(() => page.evaluate(async () => {
    const actions = await import(/* @vite-ignore */ '../../../../../../../../e2e/fakes/routeActions.ts')
    return actions.where()
  })).toMatchObject({ switching: null, socketOpen: true, activeCloud: ROUTE_PRINTER.id })
  await page.evaluate(async path => {
    const { default: router } = await import(/* @vite-ignore */ '../../../../../../../../src/router/index.ts')
    await router.push(`${path}/jobs`)
    ;(window as any).__e2eRoute.upload = { outcome: 'ok', maxStep: 4, attempts: [], listings: [] }
  }, PRINTER)
  await expect(page.getByTestId('jobs-upload-input')).toBeAttached()
})

test('52 MiB through Muon3D shows intermediate byte progress and publishes the file', async ({ page }, info) => {
  await page.evaluate(() => { (window as any).__e2eRoute.upload.maxStep = 1 })
  const bytes = Buffer.alloc(52 * 1024 * 1024, 'G')
  const file = info.outputPath('relay-52mib.gcode')
  await writeFile(file, bytes)
  await page.getByTestId('jobs-upload-input').setInputFiles(file)
  const panel = page.getByTestId('upload-progress')
  await expect(panel).toContainText('25%')
  await expect(panel).toContainText('/')
  await expect(panel.getByRole('progressbar')).toHaveAttribute('value', '25')
  await page.screenshot({ path: info.outputPath(`relay-progress-${info.project.name}.png`) })
  await page.evaluate(() => { (window as any).__e2eRoute.upload.maxStep = 2 })
  await expect(panel).toContainText('50%')
  await page.evaluate(() => { (window as any).__e2eRoute.upload.maxStep = 4 })
  await expect(panel).toBeHidden()
  await expect(page.getByTestId('flash-message')).toContainText('Uploaded relay-52mib.gcode')
  await expect(page.getByTestId('jobs-page').getByText('Relay 52mib', { exact: true }).first()).toBeVisible()
  const attempts = await page.evaluate(() => (window as any).__e2eRoute.upload.attempts)
  expect(attempts).toEqual([expect.objectContaining({ size: 52 * 1024 * 1024, checksum: createHash('sha256').update(bytes).digest('hex'), completed: true })])
})

test('upload then Print starts the exact uploaded file', async ({ page }) => {
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'print-upload.gcode', mimeType: 'text/x-gcode', buffer: Buffer.from('G28\n') })
  await page.getByTestId('job-ready-print').click()
  const plate = page.getByTestId('confirm-plate')
  if (await plate.count()) await plate.click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.called('printer.print.start')).toEqual([{ filename: 'print-upload.gcode' }])
})

test('a mid-transfer cut publishes neither the file nor any temporary entry, even after refresh', async ({ page }) => {
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
  const names = await page.getByTestId('jobs-row').locator('b').allTextContents()
  const filenames = await page.evaluate(async () => {
    const { default: store } = await import(/* @vite-ignore */ '../../../../../../../../src/store/index.ts')
    return store.state.files.pathFiles.gcodes.files.map((file: any) => file.filename)
  })
  await page.evaluate(() => { (window as any).__e2eRoute.upload.outcome = 'cut' })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'unfinished.gcode', mimeType: 'text/x-gcode', buffer: Buffer.alloc(1024 * 1024, 'G') })
  await expect(page.getByTestId('flash-message')).toContainText('failed')
  expect(await page.getByTestId('jobs-row').locator('b').allTextContents()).toEqual(names)
  const count = await page.evaluate(async () => {
    const state = (window as any).__e2eRoute.upload
    const count = state.listings.length
    const { SocketActions } = await import(/* @vite-ignore */ '../../../../../../../../src/api/socketActions.ts')
    await SocketActions.serverFilesGetDirectory('gcodes', 'gcodes')
    return count
  })
  await expect.poll(() => page.evaluate(() => (window as any).__e2eRoute.upload.listings.length)).toBeGreaterThan(count)
  const refreshed = await page.evaluate(() => (window as any).__e2eRoute.upload.listings.at(-1).files)
  expect(refreshed).toEqual(filenames)
  expect(await page.getByTestId('jobs-row').locator('b').allTextContents()).toEqual(names)
})

test('a cut transfer gives a reason and Try again uploads the same file and folder', async ({ page }) => {
  await page.evaluate(() => { (window as any).__e2eRoute.upload.outcome = 'cut' })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'retry.gcode', mimeType: 'text/x-gcode', buffer: Buffer.from('G28\n') })
  const toast = page.getByTestId('flash-message')
  await expect(toast).toContainText('Connection cut during upload')
  await expect(page.getByTestId('flash-action')).toHaveText('Try again')
  await page.evaluate(() => { (window as any).__e2eRoute.upload.outcome = 'ok' })
  await page.getByTestId('flash-action').click()
  await expect(toast).toContainText('Uploaded retry.gcode')
  const attempts = await page.evaluate(() => (window as any).__e2eRoute.upload.attempts)
  expect(attempts).toHaveLength(2)
  expect(attempts[0].completed).toBe(false)
  expect(attempts[1]).toEqual({ ...attempts[0], completed: true })
})

test('checksum is SHA256 without WebCrypto and a 422 names the integrity failure', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: undefined })
    ;(window as any).__e2eRoute.upload.outcome = 'mismatch'
  })
  const bytes = Buffer.from('G28\nG1 X12\n')
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'checksum.gcode', mimeType: 'text/x-gcode', buffer: bytes })
  await expect(page.getByTestId('flash-message')).toContainText('Checksum mismatch')
  await expect(page.getByTestId('flash-message')).toContainText('HTTP 422')
  const attempts = await page.evaluate(() => (window as any).__e2eRoute.upload.attempts)
  expect(attempts[0].checksum).toBe(createHash('sha256').update(bytes).digest('hex'))
  expect(attempts[0].completed).toBe(false)
  await expect(page.getByTestId('flash-action')).toHaveText('Try again')
})
