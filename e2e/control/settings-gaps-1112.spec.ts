/**
 * The last Settings storyboard gaps (ST-01, 12 Nov): System's four facts, Files and
 * editor's header button and Show hidden files, Wi-Fi's route pill and Bluetooth
 * row, Cameras' header "Add a camera", Timelapse's header Videos button and the
 * print sheet's "Film it". All on the mock printer: nothing here moves or heats it.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const OTHER = ['database', 'file_manager', 'klippy_apis', 'machine', 'history', 'authorization', 'webcam']

test('System starts with four facts: the computer, memory, storage and the boards', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/system')
  const facts = page.getByTestId('system-facts')
  await expect(facts.locator('[data-fact]')).toHaveCount(4)
  await expect(facts.locator('[data-fact="computer"]')).toContainText('Computer')
  await expect(facts.locator('[data-fact="memory"]')).toContainText('Memory')
  await expect(facts.locator('[data-fact="storage"]')).toContainText('Storage')
  await expect(facts.locator('[data-fact="boards"]')).toContainText(/Boards?/)
  await expect(facts.locator('[data-fact="boards"] b')).toHaveText(/^\d+$/)
})

test('Files and editor: Show hidden files is off, keeps its choice, and the header opens Files', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, {}, { components: OTHER, database: true })
  await open('/settings#browser')
  const hidden = page.getByRole('switch', { name: 'Show hidden files' })
  await expect(hidden).toHaveAttribute('aria-checked', 'false')
  await hidden.click()
  await expect(hidden).toHaveAttribute('aria-checked', 'true')
  await expect.poll(() => printer.called('server.database.post_item').filter(p => p.key === 'uiSettings.fileSystem.showHiddenFiles').map(p => p.value)).toEqual([true])
  if (isMobile) {
    await expect(page.getByTestId('settings-open-files')).toHaveCount(0)
    return
  }
  await page.getByTestId('settings-open-files').click()
  await expect(page).toHaveURL(/\/configure$/)
})

test('Wi-Fi and network: the route pill says how Control reaches the printer, and Bluetooth has a row', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/wifi')
  await expect(page.getByTestId('wifi-route-pill')).toHaveText('On this network')
  await expect(page.getByTestId('wifi-bluetooth')).toContainText('Bluetooth')
  await expect(page.getByTestId('wifi-bluetooth-line')).toContainText('Not carrying this connection')
  // Still no Ethernet entry (the M1 has none).
  await expect(page.getByTestId('wifi-page')).not.toContainText('Ethernet')
})

test('Cameras: the header has the one primary "Add a camera", which opens the stream types', async ({ page, open, isMobile }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/settings#camera')
  if (isMobile) {
    await expect(page.getByTestId('settings-add-camera')).toHaveCount(0)
    return
  }
  await page.getByTestId('settings-add-camera').click()
  await expect(page.getByTestId('camera-types')).toBeVisible()
  await expect(page).not.toHaveURL(/add=1/)
})

test('Timelapse: the header has Videos, which opens the videos', async ({ page, open, isMobile }) => {
  await usePrinter(page, PRESETS.idleHomed(), { components: [...OTHER, 'timelapse'] })
  await open('/settings#timelapse')
  if (isMobile) {
    await expect(page.getByTestId('settings-open-videos')).toHaveCount(0)
    return
  }
  await page.getByTestId('settings-open-videos').click()
  await expect(page).toHaveURL(/\/timelapse$/)
})

test('the print sheet has Film it: it starts as the printer\'s setting, and changing it sets the timelapse before the print starts', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { components: [...OTHER, 'timelapse'] })
  printer.state.answers['machine.timelapse.get_settings'] = { enabled: false, mode: 'layermacro', blockedsettings: [] }
  printer.state.answer['server.history.list'] = { count: 1, jobs: [{ job_id: '000001', filename: 'cable_clip.gcode', status: 'completed', start_time: Date.now() / 1000 - 90000, end_time: Date.now() / 1000 - 85000, print_duration: 5000, total_duration: 5200, filament_used: 900, exists: true, metadata: {} }] }
  await open('/history')
  await page.getByRole('button', { name: /More for cable clip/i }).click()
  await page.getByRole('menuitem', { name: 'Print again' }).click()
  const film = page.getByTestId('confirm-film')
  await expect(film).toContainText('Film it')
  await expect(film).toContainText('Each layer')
  const sw = page.getByTestId('confirm-film-switch')
  await expect(sw).toHaveAttribute('aria-checked', 'false')
  await sw.click()
  await page.getByTestId('confirm-plate').check()
  await page.getByRole('button', { name: 'Print now' }).click()
  await expect.poll(() => printer.called('machine.timelapse.post_settings')).toEqual([{ enabled: true }])
  await expect.poll(() => printer.calls.filter(c => c.method === 'printer.print.start').length).toBe(1)
})

test('the print sheet has no Film it on a printer without timelapse', async ({ page, open }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'the history row menu is the desktop layout')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.answer['server.history.list'] = { count: 1, jobs: [{ job_id: '000001', filename: 'cable_clip.gcode', status: 'completed', start_time: Date.now() / 1000 - 90000, end_time: Date.now() / 1000 - 85000, print_duration: 5000, total_duration: 5200, filament_used: 900, exists: true, metadata: {} }] }
  await open('/history')
  await page.getByRole('button', { name: /More for cable clip/i }).click()
  await page.getByRole('menuitem', { name: 'Print again' }).click()
  await expect(page.getByTestId('confirm-plate')).toBeVisible()
  await expect(page.getByTestId('confirm-film')).toHaveCount(0)
})
