import { test, expect } from '../fixtures'
import { overlay, PRESETS, usePrinter } from './printer'

const cold = (material: string) => overlay(PRESETS.idleHomed(), {
  extruder: { temperature: 24, target: 0, can_extrude: false },
  save_variables: { variables: { muon_material: material } }
})

for (const material of ['PETG', '']) {
  test(`manual extrusion heats ${material || 'the default material'} without extruding, then allows both directions only when ready`, async ({ page, open }, testInfo) => {
    const status = cold(material)
    const printer = await usePrinter(page, status, { ticks: false })
    await open('/control')
    const card = page.getByTestId('control-filament')
    await card.getByRole('button', { name: /^Extrude by hand/ }).click()
    const heat = card.getByRole('button', { name: 'Heat nozzle for extruding', exact: true })
    const field = card.getByRole('textbox', { name: 'Extrude temperature', exact: true })
    const extrude = card.getByRole('button', { name: 'Extrude', exact: true })
    const retract = card.getByRole('button', { name: 'Retract', exact: true })
    await expect(field).toHaveValue(material ? '240' : '215')
    await expect(card).not.toContainText(/heat the nozzle first/i)
    await expect(extrude).toBeDisabled()
    await expect(retract).toBeDisabled()
    expect(printer.gcode).toEqual([])
    await heat.click()
    await expect.poll(() => printer.gcode).toEqual([`SET_HEATER_TEMPERATURE HEATER=extruder TARGET=${material ? 240 : 215}`])
    await field.fill('232')
    await field.press('Enter')
    await heat.click()
    await expect.poll(() => printer.gcode).toHaveLength(2)
    expect(printer.gcode[1]).toBe('SET_HEATER_TEMPERATURE HEATER=extruder TARGET=232')
    printer.report({ extruder: { temperature: 232, target: 232, can_extrude: false } })
    await expect(card.getByTestId('extrude-reason')).toContainText("Klipper isn't allowing extrusion yet")
    await expect(extrude).toBeDisabled()
    await expect(retract).toBeDisabled()
    if (material && process.env.E2E_SCREENSHOT_DIR) await card.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/1713-${testInfo.project.name}.png` })
    printer.report({ extruder: { temperature: 232, target: 232, can_extrude: true } })
    await expect(extrude).toBeEnabled()
    await extrude.click()
    await retract.click()
    await expect.poll(() => printer.gcode.length).toBe(4)
    expect(printer.gcode[2]).toMatch(/\nM83\nG1 E10 F300\n/)
    expect(printer.gcode[3]).toMatch(/\nM83\nG1 E-10 F300\n/)
    expect(printer.gcode.join('\n')).not.toMatch(/G(?:0|1) [XYZ]|G28|M17|M84/)
  })
}

test('disconnecting leaves the heat and extrusion actions unavailable', async ({ page, open }) => {
  const printer = await usePrinter(page, cold('PETG'), { ticks: false })
  await open('/control')
  const card = page.getByTestId('control-filament')
  await card.getByRole('button', { name: /^Extrude by hand/ }).click()
  const heat = card.getByRole('button', { name: 'Heat nozzle for extruding', exact: true })
  await expect(heat).toBeEnabled()
  await printer.offline()
  for (const button of [heat, card.getByRole('button', { name: 'Extrude', exact: true }), card.getByRole('button', { name: 'Retract', exact: true })]) await expect(button).toBeDisabled()
  expect(printer.gcode).toEqual([])
})

test('All commands is a real disclosure, with no macro count and no commands sent on opening', async ({ page, open }) => {
  const macros = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`gcode_macro USER_COMMAND_${i + 1}`, {}]))
  const status = overlay(PRESETS.idleHomed(), macros)
  for (const name of Object.keys(macros)) status.configfile.settings[name.toLowerCase()] = { gcode: 'M118 example' }
  const printer = await usePrinter(page, status, { ticks: false })
  await open('/control')
  const quick = page.getByTestId('control-quick')
  const all = quick.getByRole('button', { name: 'All commands', exact: true })
  await expect(all).toBeVisible()
  await expect(all).toHaveAttribute('aria-expanded', 'false')
  await all.click()
  await expect(quick.getByRole('button', { name: 'Fewer', exact: true })).toHaveAttribute('aria-expanded', 'true')
  for (let i = 1; i <= 12; i++) await expect(quick.getByTestId(`qc-USER_COMMAND_${i}`)).toBeVisible()
  await expect(quick).not.toContainText(/All\s+\d+\s+macros/i)
  expect(printer.gcode).toEqual([])
})
