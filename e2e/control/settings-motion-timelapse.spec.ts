/**
 * Settings › Moving and extruding, and Settings › Timelapse (the v3
 * storyboards settings/motion.md and settings/timelapse.md). On a Muon
 * printer anything that could damage it is a locked row under Developer
 * mode until developer mode is on; any other printer gets plain fields,
 * capped at its own config's limits. Reverse Z is gone for every printer.
 * What the page sends is recorded by usePrinter and the settings database by
 * useDatabase, so nothing reaches the shared mock.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { M1_NO_GO, PRESETS, overlay, useDatabase, usePrinter, type PrinterHandle } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'webcam', 'history', 'authorization', 'muon_floor', 'aux_api_proxy', 'muon_protection', 'muon_access', 'timelapse']
const OTHER = ['database', 'file_manager', 'klippy_apis', 'machine', 'webcam', 'history', 'authorization', 'timelapse']

const status = (printer: Record<string, unknown>) => overlay(PRESETS.idleHomed(), {
  configfile: { settings: { bed_mesh: M1_NO_GO, printer, force_move: { enable_force_move: true } } }
})

async function developerMode (page: Page, enabled: boolean) {
  await page.route(new RegExp(`:${MOCK_PORT}/server/aux/dev_mode`), route => route.fulfill({ json: { enabled, guard_armed: false } }))
}

async function setUp (page: Page, { muon = true, dev = false, timelapse = {} as Record<string, unknown> } = {}) {
  const printer = await usePrinter(page, status(muon ? { max_velocity: 300, max_z_velocity: 15 } : { max_velocity: 500, max_z_velocity: 20 }), { components: muon ? MUON : OTHER })
  await developerMode(page, dev)
  printer.state.answers['machine.timelapse.get_settings'] = {
    enabled: false,
    autorender: true,
    camera: '',
    mode: 'layermacro',
    parkhead: true,
    parkpos: 'back_left',
    blockedsettings: [],
    stream_delay_compensation: 0.05,
    variable_fps: false,
    output_framerate: 30,
    targetlength: 10,
    constant_rate_factor: 23,
    ...timelapse
  }
  const db = await useDatabase(page, printer)
  return { printer, db }
}

const saves = (printer: PrinterHandle, key: string) => printer.called('server.database.post_item').filter(p => p.namespace === 'fluidd' && p.key === key).map(p => p.value)
const moving = (page: Page) => page.getByTestId('moving-settings')
const timelapse = (page: Page) => page.getByTestId('timelapse-settings')

async function typeInto (page: Page, label: string, value: string) {
  const input = moving(page).getByRole('textbox', { name: label, exact: true })
  await input.fill(value)
  await input.press('Enter')
}

test('Muon, developer mode off: the callout, Gentle/Normal/Fast from max_velocity, capped extruding, locked rows, no Reverse Z', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#toolhead')
  await expect(page.getByTestId('moving-muon-callout')).toHaveText(/is a Muon printer\. Speeds stay inside what the M1 is built for\. Anything that could damage it is under Developer mode\./)
  const presets = page.getByTestId('moving-head-presets')
  await expect(presets.getByRole('radio')).toHaveText(['Gentle', 'Normal', 'Fast'])
  await presets.getByRole('radio', { name: 'Fast' }).click()
  await expect.poll(() => saves(printer, 'uiSettings.general.defaultToolheadXYSpeed')).toEqual([240])
  await expect(presets.getByRole('radio', { name: 'Fast' })).toHaveAttribute('aria-checked', 'true')

  // The mock's extruder sets max_extrude_only_distance (100 mm), so that is the cap; it sets no extrude speed, so 8 mm/s is.
  await expect(moving(page)).toContainText('Up to 100 mm on an M1.')
  await expect(moving(page)).toContainText('Up to 8 mm/s on an M1')
  await typeInto(page, 'Length per press', '150')
  await typeInto(page, 'Extrude speed', '6')
  await expect.poll(() => saves(printer, 'uiSettings.general.defaultExtrudeSpeed')).toEqual([6])
  expect(saves(printer, 'uiSettings.general.defaultExtrudeLength').filter(v => Number(v) > 100)).toEqual([])
  await expect(moving(page)).toContainText('From the material')

  const locked = page.getByTestId('moving-developer').getByTestId('locked-row-label')
  await expect(locked).toHaveText(['Reverse X or Y', 'Plate speed', "Speeds above the M1's limits", 'Move without homing (FORCE_MOVE)'])
  await expect(page.getByTestId('moving-developer')).toContainText("An M1's directions are fixed. Only for a modified machine.")
  await expect(page.getByTestId('moving-reverse-x')).toHaveCount(0)
  await expect(page.getByTestId('moving-reverse-z')).toHaveCount(0)
  await expect(moving(page).getByText(/Reverse Z|^Z$/)).toHaveCount(0)

  await page.getByTestId('moving-developer').getByTestId('locked-row').first().click()
  await expect(page).toHaveURL(/\/settings#developer$/)
})

test('Muon, developer mode on: the locked rows are real controls', async ({ page, open }) => {
  await setUp(page, { dev: true })
  await open('/settings#toolhead')
  const developer = page.getByTestId('moving-developer')
  await expect(page.getByTestId('moving-reverse-x')).toBeVisible()
  await expect(developer.getByTestId('locked-row')).toHaveCount(0)
  await expect(developer.getByRole('textbox', { name: 'Plate speed' })).toBeVisible()
  await expect(developer.getByRole('textbox', { name: 'Head speed' })).toBeVisible()
  await expect(developer.getByRole('switch', { name: 'Warn before FORCE_MOVE' })).toBeVisible()
  await expect(page.getByTestId('moving-reverse-z')).toHaveCount(0)
})

test('another printer: plain fields capped at its own limits, Reverse X and Y ask first, no locks, no Reverse Z', async ({ page, open }) => {
  const { printer } = await setUp(page, { muon: false })
  await open('/settings#toolhead')
  await expect(page.getByTestId('moving-reverse-x')).toBeVisible()
  await expect(page.getByTestId('moving-muon-callout')).toHaveCount(0)
  await expect(moving(page).getByTestId('locked-row')).toHaveCount(0)
  await expect(page.getByTestId('moving-reverse-z')).toHaveCount(0)
  await expect(moving(page)).toContainText("Up to 500 mm/s, this printer's max_velocity.")
  await expect(moving(page)).toContainText('Up to 20 mm/s.')
  await typeInto(page, 'Head speed', '900')
  await typeInto(page, 'Plate speed', '12')
  await expect.poll(() => saves(printer, 'uiSettings.general.defaultToolheadZSpeed')).toEqual([12])
  expect(saves(printer, 'uiSettings.general.defaultToolheadXYSpeed').filter(v => Number(v) > 500)).toEqual([])

  await page.getByTestId('moving-reverse-x').check()
  const dialog = page.getByTestId('confirm')
  await expect(dialog).toContainText('Reverse X?')
  await dialog.getByRole('button', { name: 'Reverse X' }).click()
  await expect.poll(() => saves(printer, 'uiSettings.general.axis.x.inverted')).toEqual([true])
  await expect(page.getByTestId('moving-reverse-x')).toBeChecked()
})

test('step sizes added with + are saved to the printer and still there after a reload', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#toolhead')
  await page.getByTestId('moving-steps-head-add').click()
  await page.getByTestId('moving-steps-head-input').fill('5')
  await page.getByTestId('moving-steps-head-input').press('Enter')
  await page.getByTestId('moving-steps-fine-add').click()
  await page.getByTestId('moving-steps-fine-input').fill('0.1')
  await page.getByTestId('moving-steps-fine-input').press('Enter')
  await expect.poll(() => saves(printer, 'uiSettings.general.toolheadXYMoveDistances').at(-1)).toEqual([1, 5, 10, 50])
  await expect.poll(() => saves(printer, 'uiSettings.general.zAdjustDistances').at(-1)).toEqual([0.005, 0.01, 0.025, 0.05, 0.1])
  await page.reload()
  await expect(page.getByTestId('moving-steps-head-chip')).toHaveText(['1', '5', '10', '50'])
  await expect(page.getByTestId('moving-steps-fine-chip')).toHaveText(['0.005', '0.01', '0.025', '0.05', '0.1'])
})

test('offline: the settings keep their last view, say so, and can\'t be changed', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#toolhead')
  await expect(page.getByTestId('moving-head-presets')).toBeVisible()
  await printer.offline()
  await expect(page.getByTestId('moving-offline')).toContainText("isn't connected")
  await expect(page.getByTestId('moving-head-presets').getByRole('radio', { name: 'Fast' })).toBeDisabled()
  await expect(page.getByTestId('moving-steps-head-add')).toBeDisabled()
})

test('Timelapse on a Muon printer: Filming and The video, Muon default parking, and the details locked', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#timelapse')
  await expect(timelapse(page).getByRole('heading')).toHaveText(['Filming', 'The video', 'Developer mode only'])
  await expect(page.getByTestId('timelapse-parkpos-muon')).toHaveText('Muon default')
  await expect(page.getByTestId('timelapse-developer').getByTestId('locked-row-label')).toHaveText([
    'Custom park position, Z-hop and park speed', 'Retract and push back while parked', 'Delay compensation and verbose G-code'
  ])
  await expect(page.getByTestId('timelapse-zhop')).toHaveCount(0)
  await expect(page.getByTestId('timelapse-length').getByRole('radio', { name: 'Every frame at 30 fps' })).toHaveAttribute('aria-checked', 'true')
  await page.getByTestId('timelapse-length').getByRole('radio', { name: '20 s' }).click()
  await expect.poll(() => printer.called('machine.timelapse.post_settings').at(-1)).toEqual({ variable_fps: true, targetlength: 20 })
  await page.getByTestId('timelapse-mode').getByRole('radio', { name: /^Every \d+ s$/ }).click()
  await expect.poll(() => printer.called('machine.timelapse.post_settings').at(-1)).toEqual({ mode: 'hyperlapse' })
})

test('Timelapse: Every 5 s hides parking', async ({ page, open }) => {
  await setUp(page, { timelapse: { mode: 'hyperlapse', hyperlapse_cycle: 5 } })
  await open('/settings#timelapse')
  await expect(page.getByTestId('timelapse-mode').getByRole('radio', { name: 'Every 5 s' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('timelapse-cycle')).toBeVisible()
  await expect(page.getByTestId('timelapse-parkhead-row')).toHaveCount(0)
  await expect(page.getByTestId('timelapse-parkpos-row')).toHaveCount(0)
})

test('Timelapse on another printer: the details are plain rows, and what moonraker.conf sets is greyed out', async ({ page, open }) => {
  await setUp(page, { muon: false, timelapse: { blockedsettings: ['camera', 'gcode_verbose'] } })
  await open('/settings#timelapse')
  await expect(page.getByTestId('timelapse-developer')).toContainText('Parking and G-code')
  await expect(page.getByTestId('timelapse-developer').getByTestId('locked-row')).toHaveCount(0)
  await expect(page.getByTestId('timelapse-parkpos')).toBeVisible()
  await expect(page.getByTestId('timelapse-zhop')).toBeVisible()
  await expect(page.getByTestId('timelapse-delay')).toBeVisible()
  await expect(page.getByTestId('timelapse-verbose')).toBeDisabled()
  await expect(page.getByTestId('timelapse-camera').locator('input').first()).toBeDisabled()
  await expect(timelapse(page)).toContainText('Set in moonraker.conf')
})

test('Timelapse with developer mode on a Muon printer: the details are real controls', async ({ page, open }) => {
  await setUp(page, { dev: true })
  await open('/settings#timelapse')
  await expect(page.getByTestId('timelapse-zhop')).toBeVisible()
  await expect(page.getByTestId('timelapse-developer').getByTestId('locked-row')).toHaveCount(0)
  await expect(page.getByTestId('timelapse-parkpos')).toBeVisible()
})

test('Timelapse error: when the printer can\'t read its timelapse settings the rows still show and nothing is sent', async ({ page, open }) => {
  const { printer } = await setUp(page)
  printer.state.failOn['machine.timelapse.get_settings'] = 'timelapse is unavailable'
  await open('/settings#timelapse')
  await expect(page.getByTestId('timelapse-setting-enabled')).toBeVisible()
  expect(printer.called('machine.timelapse.post_settings')).toEqual([])
})

test('Timelapse empty: a printer without moonraker-timelapse has no Timelapse settings', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed(), { components: OTHER.filter(c => c !== 'timelapse') })
  await open('/settings#toolhead')
  await expect(moving(page)).toBeVisible()
  await open('/settings#timelapse')
  await expect(timelapse(page)).toHaveCount(0)
})

// Settings shows a section only for a component the printer reports, and a
// printer gone reports none until it is back: Timelapse leaves the list
// (Settings' own behaviour, not this page's), and nothing is sent meanwhile.
test('Timelapse offline: the section goes until the printer is back, and nothing is sent', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#timelapse')
  await expect(page.getByTestId('timelapse-setting-enabled')).toBeVisible()
  await printer.offline()
  await expect(page.getByText('Reconnecting', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(timelapse(page)).toHaveCount(0)
  expect(printer.called('machine.timelapse.post_settings')).toEqual([])
})
