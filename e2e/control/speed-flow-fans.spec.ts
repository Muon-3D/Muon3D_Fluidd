import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test('one Print mode group adjusts speed, flow and fan while printing, without enabling a separate Fans tile', async ({ page, open }, testInfo) => {
  const status = {
    ...PRESETS.idleHomed(),
    print_stats: { state: 'printing', filename: 'cube.gcode' },
    idle_timeout: { state: 'Printing' },
    virtual_sdcard: { is_active: true },
    gcode_move: { speed_factor: 1, extrude_factor: 1 },
    fan: { speed: 0.8 }
  }
  const printer = await usePrinter(page, status, { ticks: false })
  await open('/control')
  const tile = page.getByTestId('control-printmode')
  const group = tile.getByRole('group', { name: 'Speed, flow and fans', exact: true })
  await expect(group).toBeHidden()
  await tile.getByRole('button', { name: /^Speed, flow and fans/ }).click()
  await expect(group).toBeVisible()
  await expect(group.getByRole('slider')).toHaveCount(3)
  await expect(page.getByTestId('control-fans')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
  for (const label of ['Speed', 'Flow', 'Part fan']) {
    await group.getByRole('slider', { name: label, exact: true }).press('ArrowRight')
  }
  await expect.poll(() => printer.gcode).toEqual(['M220 S105', 'M221 S101', 'M106 S217'])
  printer.report({ ...status, gcode_move: { speed_factor: 1.05, extrude_factor: 1.01 }, fan: { speed: 0.85 } })
  await expect(tile.getByTestId('advanced-summary')).toContainText('Speed 105% · Flow 101% · Fan 85%')
  if (process.env.E2E_SCREENSHOT_DIR) {
    await tile.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/1976-${testInfo.project.name}.png` })
  }
  expect(printer.moves()).toEqual([])
})

test('hardware without a part fan still has usable speed and flow in the same group', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  printer.state.without = ['fan']
  await open('/control')
  const tile = page.getByTestId('control-printmode')
  await tile.getByRole('button', { name: /^Speed, flow and fans/ }).click()
  const group = tile.getByRole('group', { name: 'Speed, flow and fans', exact: true })
  await expect(group.getByRole('slider')).toHaveCount(2)
  await expect(group.getByRole('slider', { name: 'Part fan', exact: true })).toHaveCount(0)
  await group.getByRole('slider', { name: 'Speed', exact: true }).press('ArrowRight')
  await group.getByRole('slider', { name: 'Flow', exact: true }).press('ArrowRight')
  await expect.poll(() => printer.gcode).toEqual(['M220 S105', 'M221 S101'])
})

test('losing the printer connection disables every grouped control without sending', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await open('/control')
  const tile = page.getByTestId('control-printmode')
  await tile.getByRole('button', { name: /^Speed, flow and fans/ }).click()
  const group = tile.getByRole('group', { name: 'Speed, flow and fans', exact: true })
  await expect(group.getByRole('slider')).toHaveCount(3)
  await printer.offline()
  for (const label of ['Speed', 'Flow', 'Part fan']) {
    await expect(group.getByRole('slider', { name: label, exact: true })).toBeDisabled()
  }
  expect(printer.gcode).toEqual([])
})
