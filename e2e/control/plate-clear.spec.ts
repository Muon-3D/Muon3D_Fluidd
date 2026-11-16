/**
 * Confirm the plate is clear from Control (CT-14, KAN-2187).
 *
 * The printer reports `m1_machine.conditions.plate_cleared`; false means it
 * refuses the next print until someone confirms. Control shows a notice on
 * Overview and Control, asks "Is the plate clear?", and sends one POST to
 * /server/aux/plate/clear (no body, never G-code). The printer's answers are
 * faked per test with page.route, so the shared mock never changes. (The
 * /muon-link route of a managed session is covered in the unit test of the
 * path choice, src/services/plate/__tests__/clear.spec.ts: e2e has no
 * managed session.)
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']

const machine = (plate_cleared?: boolean) => ({
  m1_machine: {
    activity: 'idle',
    conditions: plate_cleared === undefined ? { plate: 'present' } : { plate: 'present', plate_cleared },
    missing: {},
    ready: {},
    faults: [],
    pause_reason: null
  }
})

interface Answer { status: number, json: unknown }

/** An idle M1 whose plate state is `plate_cleared`; the confirm answers as given (200 by default, then the printer reports cleared). */
async function printerWith (page: Page, plate: boolean | undefined, answer: Answer = { status: 200, json: { cleared: true } }, extra: Record<string, unknown> = {}) {
  const status = { ...PRESETS.idleHomed(), ...machine(plate), ...extra }
  const printer = await usePrinter(page, status, { components: MUON })
  const posts: Array<string | null> = []
  await page.route(new RegExp(`:${MOCK_PORT}/server/aux/plate/clear`), async route => {
    posts.push(route.request().postData())
    await route.fulfill(answer)
    if (answer.status === 200) printer.report({ ...status, ...machine(true) })
  })
  return { printer, posts }
}

const notice = (page: Page) => page.getByTestId('plate-clear-notice')
const ask = async (page: Page) => {
  await notice(page).getByTestId('plate-clear-btn').click()
  await expect(page.getByTestId('confirm')).toBeVisible()
}

for (const path of ['/', '/control']) {
  test.describe(`on ${path === '/' ? 'Overview' : 'Control'}`, () => {
    test('plate_cleared false: the notice shows; confirming sends one POST with no body and no G-code, then the notice goes', async ({ page, open }) => {
      const { printer, posts } = await printerWith(page, false)
      await open(path)
      await expect(notice(page)).toBeVisible()
      await expect(notice(page)).toContainText('Clear the plate before the next print.')
      // Two presses in the same instant open one confirm: the button is busy after the first.
      await notice(page).getByTestId('plate-clear-btn').evaluate((el: HTMLElement) => { el.click(); el.click() })
      await expect(page.getByTestId('confirm')).toBeVisible()
      await expect(page.getByTestId('confirm')).toHaveCount(1)
      await expect(page.getByTestId('confirm')).toContainText('Is the plate clear?')
      await expect(page.getByTestId('confirm-message')).toHaveText('Check that nothing from the last print is still on it, then confirm.')
      await expect(page.getByTestId('confirm-cancel')).toHaveText('Cancel')
      await expect(page.getByTestId('confirm-ok')).toHaveText('The plate is clear')
      await page.getByTestId('confirm-ok').click()
      await expect(notice(page)).toHaveCount(0)
      expect(posts).toEqual([null])
      expect(printer.gcode).toEqual([])
    })

    test('Cancel in the confirm sends nothing and the notice stays', async ({ page, open }) => {
      const { printer, posts } = await printerWith(page, false)
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-cancel').click()
      await expect(page.getByTestId('confirm')).toHaveCount(0)
      await expect(notice(page)).toBeVisible()
      expect(posts).toEqual([])
      expect(printer.gcode).toEqual([])
    })

    test('403 permission_restricted: the printer words show, with a Settings link for the owner, and the notice stays', async ({ page, open }) => {
      const message = 'Only the owner can confirm the plate on this printer.'
      const { posts } = await printerWith(page, false, { status: 403, json: { detail: { code: 'permission_restricted', knob: 'plate_clear', required: 'owner', allowed: false, message } } })
      await page.route(new RegExp(`:${MOCK_PORT}/server/muon/access/capabilities`), route => route.fulfill({ json: { result: { actions: { protection: 'allowed' } } } }))
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect(page.getByTestId('plate-clear-message')).toContainText(message)
      await expect(page.getByTestId('plate-clear-settings')).toBeVisible()
      await expect(notice(page)).toBeVisible()
      expect(posts).toHaveLength(1)
    })

    test('403 for someone who is not the owner: the words show with no link to Settings', async ({ page, open }) => {
      const message = 'Ask the owner to confirm the plate.'
      await printerWith(page, false, { status: 403, json: { detail: { code: 'permission_restricted', knob: 'plate_clear', required: 'owner', allowed: false, message } } })
      await page.route(new RegExp(`:${MOCK_PORT}/server/muon/access/capabilities`), route => route.fulfill({ json: { result: { actions: { protection: 'refused' } } } }))
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect(page.getByTestId('plate-clear-message')).toContainText(message)
      await expect(page.getByTestId('plate-clear-settings')).toHaveCount(0)
    })

    test('503 plate_clear_unavailable: the printer words show and the notice stays', async ({ page, open }) => {
      const message = 'This printer cannot take that confirmation yet.'
      await printerWith(page, false, { status: 503, json: { detail: { code: 'plate_clear_unavailable', message } } })
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect(page.getByTestId('plate-clear-message')).toContainText(message)
      await expect(notice(page)).toBeVisible()
    })

    test('any other answer is one plain sentence and the notice stays', async ({ page, open }) => {
      await printerWith(page, false, { status: 500, json: { error: 'boom' } })
      await open(path)
      await ask(page)
      await page.getByTestId('confirm-ok').click()
      await expect(page.getByTestId('plate-clear-message')).toContainText("Couldn't confirm the plate is clear.")
      await expect(notice(page)).toBeVisible()
    })

    test('plate_cleared true: no notice', async ({ page, open }) => {
      await printerWith(page, true)
      await open(path)
      await expect(page.getByTestId(path === '/' ? 'overview-page' : 'control-page')).toBeVisible()
      await expect(notice(page)).toHaveCount(0)
    })

    test('the field missing: no notice', async ({ page, open }) => {
      await printerWith(page, undefined)
      await open(path)
      await expect(page.getByTestId(path === '/' ? 'overview-page' : 'control-page')).toBeVisible()
      await expect(notice(page)).toHaveCount(0)
    })

    test('while printing: no notice', async ({ page, open }) => {
      await printerWith(page, false, undefined, {
        print_stats: { state: 'printing', filename: 'benchy.gcode' },
        idle_timeout: { state: 'Printing' },
        virtual_sdcard: { is_active: true, progress: 0.4 }
      })
      await open(path)
      await expect(page.getByTestId(path === '/' ? 'overview-page' : 'control-page')).toBeVisible()
      await expect(notice(page)).toHaveCount(0)
    })
  })
}

test('the print sheet shows the notice inline and Print does not clear the plate by itself', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'The tile is the desktop layout; the phone has the Print bar')
  const { printer, posts } = await printerWith(page, false)
  const sent: string[] = []
  page.on('websocket', ws => ws.on('framesent', f => { try { const m = JSON.parse(String(f.payload)); if (m.method === 'printer.print.start') sent.push(m.params.filename) } catch { /* not JSON */ } }))
  await open('/jobs')
  const tile = page.getByTestId('jobs-detail')
  await page.getByTestId('jobs-row').filter({ hasText: 'Benchy' }).click()
  await tile.getByRole('button', { name: 'Print', exact: true }).click()
  const sheet = page.getByTestId('confirm')
  await expect(sheet.getByTestId('plate-clear-notice')).toBeVisible()
  await expect(sheet.getByTestId('plate-clear-notice')).toContainText('Clear the plate before the next print.')
  expect(posts).toEqual([])
  await sheet.getByTestId('confirm-plate').check()
  await sheet.getByTestId('confirm-ok').click()
  await expect.poll(() => sent).toEqual(['benchy_0.16mm_PETG.gcode'])
  expect(posts).toEqual([])
  expect(printer.gcode).toEqual([])
})
