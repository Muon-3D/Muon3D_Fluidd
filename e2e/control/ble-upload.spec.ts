import { createHash } from 'node:crypto'
import { test, expect, PRINTER } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS } from './printer'
import { BLUETOOTH_UPLOAD_STALLED, BLUETOOTH_UPLOAD_STALL_MS, BLUETOOTH_UPLOAD_TOO_BIG, MAX_BLUETOOTH_UPLOAD_BYTES } from '../../src/services/muon-ble/upload'

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

test('over-threshold BLE file explains Wi-Fi before any upload request', async ({ page }) => {
  const posts: string[] = []
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/server/files/upload')) posts.push(request.url()) })
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bluetooth-large.gcode', mimeType: 'text/x-gcode', buffer: Buffer.alloc(MAX_BLUETOOTH_UPLOAD_BYTES + 1, 'G') })
  await expect(page.getByTestId('flash-message')).toContainText(BLUETOOTH_UPLOAD_TOO_BIG)
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
