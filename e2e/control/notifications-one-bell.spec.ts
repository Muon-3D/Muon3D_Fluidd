/**
 * One notification icon (brief 9 Nov 2026, §2). Fluidd's bell and drawer and
 * the separate warning icon are gone; ours (`notices-bell`) carries the
 * printer's side: Moonraker announcements, the notifications store and
 * Klipper / Moonraker warnings, as well as the console's sharing notices.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { overlay, usePrinter, PRESETS } from './printer'

const ANNOUNCEMENT = {
  entry_id: 'arksine/moonlight/issue/7',
  url: 'https://github.com/Arksine/moonlight/issues/7',
  title: 'Moonraker announcement: test entry',
  description: 'A mocked announcement for the e2e suite.',
  priority: 'normal',
  date: Math.floor(Date.now() / 1000) - 60,
  dismissed: false,
  date_dismissed: null,
  dismiss_wake: null,
  source: 'moonlight',
  feed: 'moonraker'
}
const KLIPPER_WARNING = 'Option \'test_option\' in section \'printer\' is deprecated.'

async function warned (page: Page) {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), {
    configfile: { warnings: [{ type: 'deprecated_option', message: KLIPPER_WARNING, section: 'printer', option: 'test_option' }] }
  }))
  printer.state.answers['server.announcements.list'] = { entries: [ANNOUNCEMENT], feeds: ['moonraker'] }
  return printer
}

async function oneBell (page: Page) {
  await expect(page.getByTestId('notices-bell')).toHaveCount(1)
  await expect(page.getByRole('banner').getByRole('button', { name: /notif|notice|warning/i })).toHaveCount(1)
  await expect(page.getByTestId('notifications-open')).toHaveCount(0)
  await expect(page.getByTestId('notifications')).toHaveCount(0)
  await expect(page.locator('.toolbar-alerts')).toHaveCount(0)
}

for (const path of ['/', '/control', '/jobs', '/maintenance']) {
  test(`${path}: the top bar has exactly one notification button`, async ({ page, open }) => {
    await warned(page)
    await open(path)
    await expect(page.getByTestId('notices-bell')).toBeVisible()
    await oneBell(page)
  })
}

test('a mocked Moonraker announcement and a mocked Klipper warning both appear in it', async ({ page, open }) => {
  const printer = await warned(page)
  await open('/')
  await expect(page.getByTestId('notices-count')).toBeVisible()
  await page.getByTestId('notices-bell').click()
  const notices = page.getByTestId('notices')
  await expect(notices.getByTestId('printer-notice').filter({ hasText: ANNOUNCEMENT.title })).toBeVisible()
  await expect(notices.getByTestId('notice-warnings').filter({ hasText: KLIPPER_WARNING })).toBeVisible()
  await expect(notices.getByText('Klipper warnings found')).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('snoozing the announcement tells Moonraker and takes it out of the list', async ({ page, open }) => {
  const printer = await warned(page)
  let dismissed: unknown = null
  printer.state.answers['server.announcements.dismiss'] = (params: unknown) => { dismissed = params; return { entry_id: ANNOUNCEMENT.entry_id } }
  await open('/')
  await page.getByTestId('notices-bell').click()
  await page.getByTestId('notice-snooze-3600').click()
  await expect.poll(() => dismissed).toMatchObject({ entry_id: ANNOUNCEMENT.entry_id, wake_time: 3600 })
})

test('with nothing to say, the bell is still there and says so', async ({ page, open }) => {
  await usePrinter(page, overlay(PRESETS.idleHomed(), {
    configfile: { config: { 'gcode_macro CANCEL_PRINT': {}, virtual_sdcard: {}, pause_resume: {}, display_status: {} } }
  }))
  await open('/control')
  await oneBell(page)
  await page.getByTestId('notices-bell').click()
  await expect(page.getByTestId('notices')).toContainText('Nothing new on this printer')
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('still one notification button, with the printer\'s side and the account\'s notices', async ({ page, open }) => {
    await warned(page)
    await open('/')
    await oneBell(page)
    await page.getByTestId('notices-bell').click()
    await expect(page.getByTestId('notices').getByTestId('notice-warnings').filter({ hasText: KLIPPER_WARNING })).toBeVisible()
    await expect(page.getByTestId('notices')).toContainText('Shared with you')
  })
})
