import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'
import { useUsb, type UsbFile, type UsbHandle, type UsbInit } from '../fakes/usb'

/**
 * The printer's USB stick in Control (KAN-4815, I-520): browse it, print from
 * it, download from it, copy to and from the printer (one, several or all)
 * with progress and Cancel, and eject. The printer is the fake in
 * e2e/fakes/usb.ts, which follows the API KAN-4814 defines; nothing here
 * reaches a real printer.
 */

const day = 86400
const now = Date.now() / 1000

const FILES: UsbFile[] = [
  { rel: 'benchy.gcode', size: 2_400_000, modified: now - day },
  { rel: 'gear.gcode', size: 800_000, modified: now - 2 * day },
  { rel: 'parts/bracket.gcode', size: 120_000, modified: now - 3 * day },
  { rel: 'parts/clip.gcode', size: 60_000, modified: now - 4 * day }
]

async function withUsb (page: Page, init: UsbInit = {}): Promise<{ printer: PrinterHandle, usb: UsbHandle }> {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const usb = await useUsb(page, printer, { files: FILES, ...init })
  return { printer, usb }
}

const rows = (page: Page) => page.getByTestId('usb-row')
const row = (page: Page, name: string) => page.locator(`[data-tid="usb-row"][data-name="${name}"]`)
const check = (page: Page, name: string) => row(page, name).getByTestId('usb-row-check')

async function openUsb (page: Page, open: (path: string) => Promise<unknown>) {
  await open('/jobs?view=usb')
  await expect(page.getByTestId('usb-view')).toBeVisible({ timeout: 30_000 })
}

test('with a stick in, the printer\'s files get a USB view that lists folders first, with sizes and free space', async ({ page, open }) => {
  await withUsb(page)
  await open('/jobs')
  await expect(page.getByTestId('jobs-source-usb')).toBeVisible({ timeout: 30_000 })
  await page.getByTestId('jobs-source-usb').click()
  await expect(rows(page)).toHaveCount(3)
  await expect.poll(() => rows(page).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.name))).toEqual(['parts', 'benchy.gcode', 'gear.gcode'])
  await expect(row(page, 'benchy.gcode')).toContainText('2.4 MB')
  await expect(page.getByTestId('usb-space')).toContainText('12.3 GB free of 32 GB')

  await row(page, 'parts').getByTestId('usb-open-folder').click()
  await expect(rows(page)).toHaveCount(2)
  await expect(row(page, 'bracket.gcode')).toBeVisible()
  await page.getByTestId('usb-crumb').first().click()
  await expect(rows(page)).toHaveCount(3)
})

test('a long folder comes a page at a time', async ({ page, open }) => {
  const many: UsbFile[] = Array.from({ length: 150 }, (_, i) => ({ rel: `part-${String(i).padStart(3, '0')}.gcode`, size: 1000 + i, modified: now - i }))
  const { usb } = await withUsb(page, { files: many })
  await openUsb(page, open)
  await expect(rows(page)).toHaveCount(100)
  await expect(page.getByTestId('usb-count')).toHaveText('Showing 100 of 150')
  await page.getByTestId('usb-more').click()
  await expect(rows(page)).toHaveCount(150)
  await expect(page.getByTestId('usb-more')).toHaveCount(0)
  expect(usb.called('GET', 'list').map(c => [c.query.offset, c.query.limit])).toEqual([['0', '100'], ['100', '100']])
})

test('several files copy to the printer with progress, and the conflict choice goes to the printer', async ({ page, open }) => {
  const { usb } = await withUsb(page, { existing: ['gear.gcode'] })
  await openUsb(page, open)
  await expect(rows(page)).toHaveCount(3)

  await check(page, 'benchy.gcode').check()
  await check(page, 'gear.gcode').check()
  await page.getByTestId('usb-copy-to-printer').click()
  await expect(page.getByTestId('usb-conflict')).toBeVisible()
  await page.getByTestId('usb-conflict-skip').check()
  await page.getByTestId('usb-conflict-confirm').click()

  await expect(page.getByTestId('usb-job')).toHaveAttribute('data-state', 'running')
  expect(usb.called('POST', 'copy')[0].body).toEqual({ direction: 'to_printer', stick: 'SANDISK', items: ['usb/SANDISK/benchy.gcode', 'usb/SANDISK/gear.gcode'], on_conflict: 'skip' })
  // gear.gcode was already on the printer, so it was skipped and the job is the one file.
  await expect(page.getByTestId('usb-job-headline')).toContainText('Copying 0 of 2 files to the printer')

  usb.progress(0.5)
  await expect(page.getByTestId('usb-job-percent')).toHaveText('50%')
  await expect(page.getByTestId('usb-job-item').first()).toContainText('benchy.gcode')
  await expect(page.getByTestId('usb-job-item').first()).toContainText('Copying')
  await expect(page.getByTestId('usb-job-item').nth(1)).toContainText('Skipped')
  await expect(page.getByTestId('usb-job-item').nth(1).getByTestId('usb-job-item-error')).toContainText('already there')

  usb.complete()
  await expect(page.getByTestId('usb-job-percent')).toHaveText('100%')
  await expect(page.getByTestId('usb-job-headline')).toContainText('Finished copying to the printer, with some left out')
  await page.getByTestId('usb-job-dismiss').click()
  await expect(page.getByTestId('usb-job')).toHaveCount(0)
})

test('Copy all sends everything on the stick, and a failed file says why in plain words', async ({ page, open }) => {
  const { usb } = await withUsb(page)
  await openUsb(page, open)
  await page.getByTestId('usb-copy-all').click()
  await page.getByTestId('usb-conflict-confirm').click()
  await expect(page.getByTestId('usb-job')).toBeVisible()
  expect(usb.called('POST', 'copy')[0].body).toMatchObject({ direction: 'to_printer', items: ['usb/SANDISK'], on_conflict: 'rename' })
  await expect(page.getByTestId('usb-job-headline')).toContainText('of 4 files')

  usb.progress(0.4)
  usb.fail('no_space', 'no_space')
  await expect(page.getByTestId('usb-job')).toHaveAttribute('data-state', 'failed')
  await expect(page.getByTestId('usb-job-headline')).toContainText('There is not enough space.')
  await expect(page.getByTestId('usb-job-item-error').first()).toContainText('There is not enough space.')
})

test('Cancel stops a copy, and Eject is off while it runs', async ({ page, open }) => {
  const { usb } = await withUsb(page)
  await openUsb(page, open)
  await check(page, 'benchy.gcode').check()
  await page.getByTestId('usb-copy-to-printer').click()
  await page.getByTestId('usb-conflict-confirm').click()
  await expect(page.getByTestId('usb-job')).toHaveAttribute('data-state', 'running')
  usb.progress(0.25)
  await expect(page.getByTestId('usb-job-percent')).toHaveText('25%')
  await expect(page.getByTestId('usb-eject')).toBeDisabled()

  await page.getByTestId('usb-job-cancel').click()
  await expect(page.getByTestId('usb-job')).toHaveAttribute('data-state', 'cancelled')
  await expect(page.getByTestId('usb-job-headline')).toContainText('Cancelled')
  expect(usb.called('POST', 'job/cancel')[0].body).toMatchObject({ job_id: usb.job?.id })
  await expect(page.getByTestId('usb-eject')).toBeEnabled()
})

test('Eject says when it is safe to take the stick out', async ({ page, open }) => {
  const { usb } = await withUsb(page)
  await openUsb(page, open)
  await page.getByTestId('usb-eject').click()
  await expect(page.getByTestId('usb-ejected')).toContainText('Safe to remove')
  expect(usb.called('POST', 'eject')[0].body).toEqual({ stick: 'SANDISK' })
})

test('a file downloads to this computer, and a print starts from the stick', async ({ page, open }) => {
  const { usb } = await withUsb(page)
  await openUsb(page, open)
  await check(page, 'benchy.gcode').check()

  const download = page.waitForEvent('download')
  await page.getByTestId('usb-download').click()
  expect((await download).suggestedFilename()).toBe('benchy.gcode')
  expect(usb.called('GET', 'file')[0].query.path).toBe('usb/SANDISK/benchy.gcode')

  await page.getByTestId('usb-print').click()
  await page.getByTestId('usb-print-confirm-go').click()
  await expect(page.getByTestId('usb-notice')).toContainText('Started printing benchy.gcode')
  expect(usb.called('POST', 'print')[0].body).toEqual({ path: 'usb/SANDISK/benchy.gcode' })
})

test('files on the printer copy to the stick, one, several or everything', async ({ page, open }) => {
  const { printer, usb } = await withUsb(page, { printerFiles: [{ rel: 'cube.gcode', size: 500_000 }, { rel: 'vase.gcode', size: 700_000 }] })
  const listing = {
    dirs: [],
    files: [{ filename: 'cube.gcode', size: 500_000, modified: now, permissions: 'rw' }, { filename: 'vase.gcode', size: 700_000, modified: now, permissions: 'rw' }],
    disk_usage: { total: 29_000_000_000, used: 6_100_000_000, free: 22_900_000_000 },
    root_info: { name: 'gcodes', permissions: 'rw' }
  }
  printer.state.answers['server.files.get_directory'] = () => listing
  await openUsb(page, open)

  await page.getByTestId('usb-copy-from-printer').click()
  await expect(page.getByTestId('usb-picker')).toBeVisible()
  await page.locator('[data-tid="usb-picker-row"][data-name="cube.gcode"]').check()
  await page.getByTestId('usb-picker-next').click()
  await page.getByTestId('usb-conflict-confirm').click()
  await expect(page.getByTestId('usb-job-headline')).toContainText('to the USB stick')
  expect(usb.called('POST', 'copy')[0].body).toEqual({ direction: 'to_usb', stick: 'SANDISK', items: ['cube.gcode'], on_conflict: 'rename' })
  usb.complete()
  await expect(page.getByTestId('usb-job')).toHaveAttribute('data-state', 'done')
  await page.getByTestId('usb-job-dismiss').click()

  await page.getByTestId('usb-copy-from-printer').click()
  await page.getByTestId('usb-picker-all').check()
  await page.getByTestId('usb-picker-next').click()
  await page.getByTestId('usb-conflict-confirm').click()
  await expect(page.getByTestId('usb-job')).toBeVisible()
  expect(usb.called('POST', 'copy')[1].body).toMatchObject({ direction: 'to_usb', items: ['/'] })
})

test('no stick: the page says so in plain words, and a stick pulled out while it is open gets the same words', async ({ page, open }) => {
  const { usb } = await withUsb(page, { stick: null })
  await openUsb(page, open)
  await expect(page.getByTestId('usb-none')).toContainText('No USB stick in the printer')
  expect(usb.called('GET', 'status').length).toBeGreaterThan(0)

  usb.insertStick()
  await expect(rows(page)).toHaveCount(3, { timeout: 15_000 })
  usb.removeStick()
  await expect(page.getByTestId('usb-none')).toBeVisible({ timeout: 15_000 })
})

test('a read-only stick can be read but not copied onto', async ({ page, open }) => {
  await withUsb(page, { readOnly: true })
  await openUsb(page, open)
  await expect(page.getByTestId('usb-readonly')).toContainText('read-only')
  await expect(page.getByTestId('usb-copy-from-printer')).toBeDisabled()
  await expect(page.getByTestId('usb-copy-all')).toBeEnabled()
})

test('a printer without the USB routes shows no USB view at all', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/jobs')
  await expect(page.getByTestId('jobs-page')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('jobs-source')).toHaveCount(0)
  await expect(page.getByTestId('usb-view')).toHaveCount(0)
})
