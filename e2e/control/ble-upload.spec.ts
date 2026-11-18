import { createHash } from 'node:crypto'
import { test, expect, PRINTER } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS } from './printer'
import { BLUETOOTH_UPLOAD_STALLED, BLUETOOTH_UPLOAD_STALL_MS, bluetoothLargeFileMessage, MAX_BLUETOOTH_UPLOAD_BYTES } from '../../src/services/muon-ble/upload'

test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page, open }) => {
  await page.clock.install()
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await open('/system')
  await page.evaluate(async ({ port, prefix }) => {
    const fixture = await import(/* @vite-ignore */ '/e2e/fakes/managedBluetooth.ts')
    ;(window as any).managedBle = await fixture.managedBluetooth(`http://localhost:${port}`, { operator: true })
    const { default: router } = await import(/* @vite-ignore */ '/src/router/index.ts')
    await router.push(`${prefix}/jobs`)
  }, { port: MOCK_PORT, prefix: PRINTER })
  await expect.poll(() => page.evaluate(() => (window as any).managedBle.label())).toBe('Via Bluetooth')
  await expect(page.getByTestId('jobs-upload-input')).toBeAttached()
  await expect(page.getByTestId('jobs-upload')).toBeEnabled()
  const flash = page.getByTestId('flash-message')
  if (await flash.isVisible()) await flash.getByRole('button', { name: 'Close', exact: true }).click()
})

test('small G-code uses BLE byte progress and appears in Jobs', async ({ page }, info) => {
  await page.evaluate(() => { (window as any).managedBle.upload.pause = true })
  const bytes = Buffer.alloc(384 * 1024, 'G')
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bluetooth-small.gcode', mimeType: 'text/x-gcode', buffer: bytes })
  const panel = page.getByTestId('upload-progress')
  const progress = panel.getByRole('progressbar')
  await expect(async () => {
    const value = Number(await progress.getAttribute('value'))
    expect(value).toBeGreaterThan(0)
    expect(value).toBeLessThan(100)
  }).toPass({ timeout: 15_000 })
  await expect(panel.getByRole('status')).toContainText(/%.*\/.*kB/)
  await page.screenshot({ path: info.outputPath(`ble-upload-progress-${info.project.name}.png`) })
  expect(await page.evaluate(() => (window as any).managedBle.label())).toBe('Via Bluetooth')
  await page.evaluate(() => { (window as any).managedBle.upload.pause = false })
  await expect(page.getByTestId('flash-message')).toContainText('Uploaded bluetooth-small.gcode')
  await expect(panel).toBeHidden()
  await page.getByTestId('job-ready-keep').click()
  await expect(page.getByTestId('jobs-row').filter({ hasText: 'Bluetooth small' })).toBeVisible()
  expect(await page.evaluate(() => (window as any).managedBle.upload.attempts)).toEqual([
    expect.objectContaining({ name: 'bluetooth-small.gcode', size: bytes.length, checksum: createHash('sha256').update(bytes).digest('hex'), completed: true })
  ])
})

test('a 2 MB G-code goes over Bluetooth with progress, a time estimate and the hotspot hint', async ({ page }, info) => {
  await page.evaluate(() => { (window as any).managedBle.upload.pause = true })
  const bytes = Buffer.alloc(2 * 1024 * 1024, 'G')
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bluetooth-real.gcode', mimeType: 'text/x-gcode', buffer: bytes })
  await expect(page.getByTestId('flash-message')).toContainText("This file is large for Bluetooth (about 7 min). Join the printer's hotspot and upload from there for a faster transfer.")
  const panel = page.getByTestId('upload-progress')
  await expect(async () => {
    const value = Number(await panel.getByRole('progressbar').getAttribute('value'))
    expect(value).toBeGreaterThan(0)
    expect(value).toBeLessThan(100)
  }).toPass({ timeout: 15_000 })
  await expect(panel.getByRole('status')).toContainText(/%.*\/.*MB/)
  await expect(panel.getByTestId('upload-cancel')).toBeVisible()
  await page.screenshot({ path: info.outputPath(`ble-upload-2mb-${info.project.name}.png`) })
  await page.evaluate(() => { (window as any).managedBle.upload.pause = false })
  await expect(page.getByTestId('flash-message')).toContainText('Uploaded bluetooth-real.gcode')
  await expect(panel).toBeHidden()
  expect(await page.evaluate(() => (window as any).managedBle.upload.attempts)).toEqual([
    expect.objectContaining({ name: 'bluetooth-real.gcode', size: bytes.length, checksum: createHash('sha256').update(bytes).digest('hex'), completed: true })
  ])
})

test('Cancel stops a long Bluetooth upload and closes the radio session', async ({ page }) => {
  await page.evaluate(() => { (window as any).managedBle.upload.pause = true })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bluetooth-cancel.gcode', mimeType: 'text/x-gcode', buffer: Buffer.alloc(2 * 1024 * 1024, 'G') })
  const panel = page.getByTestId('upload-progress')
  await expect(panel.getByRole('progressbar')).toHaveAttribute('value', /[1-9]\d?/)
  // Cancel and read in one tick, before any reconnect can paper over a dead cached session.
  const status = await page.evaluate(async () => {
    (document.querySelector('[data-tid="upload-cancel"]') as HTMLElement).click()
    return (await (window as any).managedBle.query()).status
  })
  expect(status).toBe(200)
  await expect(panel).toBeHidden()
  await expect.poll(() => page.evaluate(() => (window as any).managedBle.counts.closes)).toBeGreaterThan(0)
  expect(await page.evaluate(() => (window as any).managedBle.upload.attempts)).toEqual([
    expect.objectContaining({ name: 'bluetooth-cancel.gcode', completed: false })
  ])
  await expect(page.getByTestId('flash-message')).not.toContainText('failed')
  // The closed session must not linger as the cached relay: the very next read works on a fresh session, with no failed first attempt.
  await expect(page.getByTestId('jobs-row').filter({ hasText: 'Bluetooth cancel' })).toHaveCount(0)
})

test('over-limit BLE file shows the hotspot hint before any upload request', async ({ page }) => {
  const posts: string[] = []
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/server/files/upload')) posts.push(request.url()) })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bluetooth-large.gcode', mimeType: 'text/x-gcode', buffer: Buffer.alloc(MAX_BLUETOOTH_UPLOAD_BYTES + 1, 'G') })
  await expect(page.getByTestId('flash-message')).toContainText(bluetoothLargeFileMessage(MAX_BLUETOOTH_UPLOAD_BYTES + 1))
  expect(await page.evaluate(() => (window as any).managedBle.upload.calls)).toBe(0)
  expect(await page.evaluate(() => (window as any).managedBle.upload.attempts)).toEqual([])
  expect(posts).toEqual([])
  expect(await page.evaluate(() => (window as any).managedBle.counts.closes)).toBe(0)
  await expect(page.getByTestId('upload-progress')).toBeHidden()
})

test('BLE upload with live radio but no new file bytes fails clearly', async ({ page }) => {
  await page.evaluate(() => { (window as any).managedBle.upload.stall = true })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bluetooth-stalled.gcode', mimeType: 'text/x-gcode', buffer: Buffer.alloc(384 * 1024, 'G') })
  await expect(page.getByTestId('upload-progress').getByRole('progressbar')).toHaveAttribute('value', /[1-9]\d?/)
  await page.clock.runFor(BLUETOOTH_UPLOAD_STALL_MS + 1000)
  await expect(page.getByTestId('flash-message')).toContainText(BLUETOOTH_UPLOAD_STALLED)
  await expect(page.getByTestId('upload-progress')).toBeHidden()
  const result = await page.evaluate(() => ({ attempts: (window as any).managedBle.upload.attempts, closes: (window as any).managedBle.counts.closes }))
  expect(result.attempts).toEqual([expect.objectContaining({ name: 'bluetooth-stalled.gcode', completed: false })])
  expect(result.closes).toBeGreaterThan(0)
  await expect(page.getByTestId('jobs-row').filter({ hasText: 'Bluetooth stalled' })).toHaveCount(0)
})
