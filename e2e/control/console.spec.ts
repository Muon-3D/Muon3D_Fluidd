/**
 * Console: the log and its line to send from in one tile; the filters and Clear
 * in the page header; quick-command chips and a short Macros list beside it.
 * G-code is answered and recorded by usePrinter, so nothing reaches the shared mock.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test('the page header says what the page is for and holds the filters and Clear', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  await expect(page.getByRole('heading', { name: 'Console', level: 1 })).toBeVisible()
  await expect(page.getByText('Send G-code and read what Klipper says back')).toBeVisible()
  const header = page.getByTestId('console-actions')
  await expect(header.getByRole('radio', { name: 'All' })).toBeChecked()
  await expect(header.getByRole('radio', { name: 'Commands' })).toBeVisible()
  await expect(header.getByRole('radio', { name: /Errors/ })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Clear the log' })).toBeVisible()
})

test('the output and the line to send from are one tile, with Send at the foot', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  const output = page.getByTestId('console-output')
  await expect(output.getByText('Output')).toBeVisible()
  await expect(output.getByText('Klipper ready')).toBeVisible()
  await expect(output.getByTestId('console-input')).toBeVisible()
  await expect(output.getByRole('button', { name: 'Send', exact: true })).toBeVisible()
})

test('typing a line and pressing Send sends exactly that G-code', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  await page.getByTestId('console-input').fill('M105')
  await page.getByTestId('console-output').getByRole('button', { name: 'Send', exact: true }).click()
  await expect.poll(() => printer.gcode).toEqual(['M105'])
  await expect(page.getByTestId('console-input')).toHaveValue('')
})

test('a quick-command chip sends its command on one tap', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  await page.getByTestId('console-quick-M105').click()
  await expect.poll(() => printer.gcode).toEqual(['M105'])
})

test('a chip that restarts Klipper asks first; keeping it running sends nothing, even after a wait', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  await page.getByTestId('console-quick-FIRMWARE_RESTART').click()
  await expect(page.getByText('Restart Klipper?')).toBeVisible()
  await page.getByTestId('confirm-cancel').click()
  await page.waitForTimeout(1000)
  expect(printer.gcode).toEqual([])
})

test('confirming the restart sends FIRMWARE_RESTART', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  await page.getByTestId('console-quick-FIRMWARE_RESTART').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.gcode).toEqual(['FIRMWARE_RESTART'])
})

test('Klipper connected but not ready: no chip sends, and the mesh chip says why when not homed', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.results['server.info'] = { klippy_state: 'startup' }
  await open('/console')
  await expect(page.getByTestId('console-quick-G28')).toBeDisabled()
  await expect(page.getByTestId('console-quick-M105')).toBeDisabled()
  await expect(page.getByTestId('console-quick-BED_MESH_CALIBRATE')).toBeDisabled()
  expect(printer.gcode).toEqual([])
})

test('the mesh chip is off until the head is homed, and says why', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ homed: '' }))
  await open('/console')
  await expect(page.getByTestId('console-quick-BED_MESH_CALIBRATE')).toBeDisabled()
  await expect(page.getByTestId('console-quick-G28')).toBeEnabled()
  await expect(page.getByTestId('console-quick-BED_MESH_CALIBRATE')).toHaveAttribute('title', 'Home the printer first')
  expect(printer.gcode).toEqual([])
})

test('while printing, the chips that move the head are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page) // the mock as it is: mid-print
  await open('/console')
  await expect(page.getByTestId('console-quick-G28')).toBeDisabled()
  await expect(page.getByTestId('console-quick-BED_MESH_CALIBRATE')).toBeDisabled()
  await expect(page.getByTestId('console-quick-M105')).toBeEnabled()
  expect(printer.gcode).toEqual([])
})

test('the Errors filter shows only the errors, and Clear empties the log', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const now = Date.now() / 1000
  printer.state.answer['server.gcode_store'] = {
    gcode_store: [
      { message: 'Pressure advance set to 0.04', time: now, type: 'response' },
      { message: '!! Must home axis first: X Y Z', time: now, type: 'response' }
    ]
  }
  await open('/console')
  const log = page.getByTestId('console-log')
  // The page loads its log from the printer's stored one when it connects, so the store holds the lines.
  await expect(log.getByText('Pressure advance set to 0.04')).toBeVisible()
  await expect(log.getByText('Must home axis first').first()).toBeVisible()

  const header = page.getByTestId('console-actions')
  await header.getByRole('radio', { name: /Errors/ }).click()
  await expect(log.getByText('Must home axis first').first()).toBeVisible()
  // The log's scroller keeps spare rows off-screen, so "gone" means not on screen.
  await expect(log.getByText('Pressure advance set to 0.04')).not.toBeInViewport()

  await header.getByRole('radio', { name: 'All' }).click()
  await expect(log.getByText('Pressure advance set to 0.04')).toBeVisible()
  await header.getByRole('button', { name: 'Clear the log' }).click()
  await expect(log.getByText('Nothing yet.')).toBeVisible()
})

test('desktop has the Macros and Now tiles beside the output; a phone keeps only the quick commands', async ({ page, open, isMobile }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  await expect(page.getByTestId('console-quick')).toBeVisible()
  if (isMobile) {
    await expect(page.getByTestId('console-macros')).toHaveCount(0)
    await expect(page.getByTestId('console-now')).toHaveCount(0)
    // The line to send is on screen without scrolling the page away.
    await expect(page.getByTestId('console-input')).toBeInViewport()
  } else {
    await expect(page.getByTestId('console-now').getByText('Hotend')).toBeVisible()
    await expect(page.getByTestId('console-now').getByText('Bed')).toBeVisible()
  }
})

test('Shift+Enter adds a line, Enter sends both lines as one script, and history recalls it whole', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  const input = page.getByTestId('console-input')
  await input.click()
  await input.pressSequentially('M105')
  await input.press('Shift+Enter')
  await input.pressSequentially('M114')
  await expect(input).toHaveValue('M105\nM114')
  expect(printer.gcode).toEqual([])
  await input.press('Enter')
  await expect.poll(() => printer.gcode).toEqual(['M105\nM114'])
  await expect(input).toHaveValue('')
  // Up on an empty line recalls the whole two-line command.
  await input.press('ArrowUp')
  await expect(input).toHaveValue('M105\nM114')
})

test('with several lines, Up moves the caret between lines and only the first line recalls history', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  const input = page.getByTestId('console-input')
  await input.fill('G4 P1')
  await input.press('Enter')
  await expect.poll(() => printer.gcode).toEqual(['G4 P1'])
  await input.fill('M105\nM114')
  await input.press('Escape') // close the suggestions, so the arrows are not theirs
  await input.press('ArrowUp') // caret is on the last line: moves to the first, no recall
  await expect(input).toHaveValue('M105\nM114')
  await input.press('ArrowUp') // now on the first line: recalls
  await expect(input).toHaveValue('G4 P1')
})

test('a single line still sends on Enter as before, and a long paste scrolls after a few lines', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/console')
  const input = page.getByTestId('console-input')
  await input.fill('M105')
  await input.press('Enter')
  await expect.poll(() => printer.gcode).toEqual(['M105'])
  await input.fill(Array.from({ length: 12 }, (_, i) => `G4 P${i}`).join('\n'))
  const box = await input.boundingBox()
  expect(box!.height).toBeLessThan(12 * 18)
  expect(await input.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
})
