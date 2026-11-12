/**
 * The error-code UI (NC-19 / KAN-2085), from the user's side: a known error
 * shows its code and one friendly line; dev mode also shows the printer's full
 * message; an unknown error still says something sensible and keeps its text.
 * The errors reach Control as Klipper's shutdown message in the notices bell.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { overlay, usePrinter, PRESETS } from './printer'

const KNOWN = 'Error: nozzle is touching the plate, lift Z before moving X and Y'
const UNKNOWN = 'Widget exploded at frame 9'

async function shutDownWith (page: Page, message: string) {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), {
    webhooks: { state: 'shutdown', state_message: message }
  }))
  // Klipper has shut down: Control reads that from server.info.
  printer.state.answers['server.info'] = {
    klippy_connected: true,
    klippy_state: 'shutdown',
    components: ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'job_state', 'job_queue', 'history', 'authorization'],
    failed_components: [],
    registered_directories: ['config', 'logs', 'gcodes'],
    warnings: [],
    websocket_count: 1,
    moonraker_version: 'v0.9.3-muon',
    api_version: [1, 5, 0],
    api_version_string: '1.5.0'
  }
  printer.state.results['printer.info'] = { state: 'shutdown', state_message: message }
  return printer
}

async function devMode (page: Page, enabled: boolean) {
  await page.route(new RegExp(`:${MOCK_PORT}/server/aux/dev_mode`), route => route.fulfill({ json: { enabled, guard_armed: false } }))
}

/** With NC19_SHOT_DIR set, saves the open notices menu as the done-1112 screenshot. */
async function shoot (page: Page, prefix: string) {
  const dir = process.env.NC19_SHOT_DIR
  if (dir) await page.screenshot({ path: `${dir}/NC-19-${prefix}${test.info().project.name}.png` })
}

async function openNotice (page: Page, open: (path: string) => Promise<unknown>) {
  await open('/')
  await page.getByTestId('notices-bell').click()
  const notice = page.getByTestId('notice-klippy').getByTestId('error-notice')
  await expect(notice).toBeVisible()
  return notice
}

test('a known error shows its code and the friendly line, not the printer\'s message', async ({ page, open }) => {
  await devMode(page, false)
  await shutDownWith(page, KNOWN)
  const notice = await openNotice(page, open)
  await expect(notice.getByTestId('error-code')).toHaveText('MU-MOTION-0001')
  await expect(notice.getByTestId('error-short')).toHaveText('Lift the nozzle first, then move sideways.')
  await notice.getByText('What to do').click()
  await expect(notice.getByTestId('error-what-to-do')).toContainText('Raise the nozzle')
  await expect(notice.getByTestId('error-full')).toHaveCount(0)
  await expect(page.getByTestId('notice-klippy')).not.toContainText('touching the plate')
  await shoot(page, '')
})

test('dev mode also shows the full message', async ({ page, open }) => {
  await devMode(page, true)
  await shutDownWith(page, KNOWN)
  const notice = await openNotice(page, open)
  await expect(notice.getByTestId('error-code')).toHaveText('MU-MOTION-0001')
  await expect(notice.getByTestId('error-short')).toHaveText('Lift the nozzle first, then move sideways.')
  await expect(notice.getByTestId('error-full')).toContainText('nozzle is touching the plate, lift Z before moving X and Y')
  await shoot(page, 'devmode-')
})

test('an unknown error gets the generic line and its text under Details', async ({ page, open }) => {
  await devMode(page, false)
  await shutDownWith(page, UNKNOWN)
  const notice = await openNotice(page, open)
  await expect(notice.getByTestId('error-code')).toHaveCount(0)
  await expect(notice.getByTestId('error-short')).toHaveText('Something went wrong on the printer.')
  await notice.getByText('Details').click()
  await expect(notice.getByTestId('error-details')).toContainText(UNKNOWN)
})
