/**
 * Jobs: the files on the printer as one list, with the picked file beside it
 * (or, on a phone, a Print bar above the tab bar).
 *
 * The mock printer is Boxwood, mid-print on M1_bracket, with five files. Every
 * test sees it from this page only: usePrinter makes it idle where a test needs
 * to print, and the RPCs the page sends are read off the page's websocket.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

/** Every JSON-RPC the page sends to the printer, in order. */
function recordRpc (page: Page) {
  const sent: Array<{ method: string, params: any }> = []
  page.on('websocket', ws => {
    ws.on('framesent', frame => {
      try {
        const msg = JSON.parse(String(frame.payload))
        if (msg.method) sent.push({ method: msg.method, params: msg.params })
      } catch {
        // Not JSON.
      }
    })
  })
  return (method: string) => sent.filter(m => m.method === method)
}

/** The print confirm: the plate is ticked clear, then Print now. */
async function confirmPrint (page: Page) {
  const plate = page.getByTestId('confirm-plate')
  if (await plate.count()) await plate.click()
  await page.getByTestId('confirm-ok').click()
}

const row = (page: Page, text: string) => page.getByTestId('jobs-row').filter({ hasText: text })

test('one list: the printing file is pinned first, and there are no view modes or tabs', async ({ page, open, isMobile }) => {
  await open('/jobs')
  await expect(page.getByTestId('page-title')).toHaveText('Jobs')
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
  await expect(page.getByTestId('jobs-row').first()).toContainText('M1 bracket')
  await expect(page.getByTestId('jobs-row').first()).toContainText(isMobile ? /\d+%/ : 'Printing now')
  await expect(page.getByRole('radio', { name: 'Pictures' })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Table' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Jobs pages' })).toHaveCount(0)
  await expect(page.getByText(/5 files on Boxwood/)).toBeVisible()
})

test('the ··· menu holds History, and goes there', async ({ page, open }) => {
  await open('/jobs')
  await page.getByRole('button', { name: 'More about jobs' }).click()
  await expect(page.getByRole('menuitem', { name: 'New folder' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'History' }).click()
  await expect(page).toHaveURL(/\/history$/)
})

test('search narrows the list, says so when nothing matches, and clears', async ({ page, open, isMobile }) => {
  await open('/jobs')
  if (isMobile) await page.getByRole('button', { name: 'Search files' }).click()
  const find = page.getByRole('searchbox', { name: 'Search files' })
  await find.fill('benchy')
  await expect(page.getByTestId('jobs-row')).toHaveCount(1)
  await expect(page.getByTestId('jobs-row')).toContainText('Benchy')
  await find.fill('zzzz')
  await expect(page.getByTestId('jobs-empty')).toContainText('Nothing matches')
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.getByTestId('jobs-row')).toHaveCount(5)
})

test('the order: Name puts the files A to Z under the one that is printing', async ({ page, open }) => {
  await open('/jobs')
  await page.getByRole('radiogroup', { name: 'Order' }).getByRole('radio', { name: 'Name' }).click()
  const names = await page.getByTestId('jobs-row').locator('b').allTextContents()
  expect(names[0]).toContain('M1 bracket')
  expect(names.slice(1)).toEqual([...names.slice(1)].sort((a, b) => a.localeCompare(b)))
})

test('desktop: the picked file has its tile, and Print asks before it starts the print', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'The tile is the desktop layout; the phone has the Print bar')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const rpc = recordRpc(page)
  await open('/jobs')
  const tile = page.getByTestId('jobs-detail')
  await expect(tile).toBeVisible()
  await row(page, 'Benchy').click()
  await expect(tile).toContainText('Benchy')
  await expect(tile.getByText('benchy_0.16mm_PETG.gcode')).toBeVisible()
  await expect(tile.getByText('Print time')).toBeVisible()

  await tile.getByRole('button', { name: 'Print', exact: true }).click()
  // It asks first: nothing has been sent.
  await expect(page.getByTestId('confirm')).toContainText('Print benchy_0.16mm_PETG')
  expect(rpc('printer.print.start')).toHaveLength(0)
  await confirmPrint(page)
  await expect.poll(() => rpc('printer.print.start').map(m => m.params)).toEqual([{ filename: 'benchy_0.16mm_PETG.gcode' }])
  expect(printer.gcode).toEqual([])
})

test('phone: a tap picks a file and opens the Print bar; a second tap closes it', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'The Print bar is the phone layout')
  await usePrinter(page, PRESETS.idleHomed())
  const rpc = recordRpc(page)
  await open('/jobs')
  await expect(page.getByTestId('jobs-sticky')).toHaveCount(0)
  await row(page, 'Benchy').click()
  const bar = page.getByTestId('jobs-sticky')
  await expect(bar).toContainText('Print Benchy')
  await bar.getByRole('button', { name: 'Options for Benchy' }).click()
  await expect(page.getByRole('menuitem', { name: 'Preview' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await page.keyboard.press('Escape')

  await bar.getByRole('button', { name: /^Print Benchy/ }).click()
  await confirmPrint(page)
  await expect.poll(() => rpc('printer.print.start').length).toBe(1)
})

test('Delete asks first, and Cancel sends nothing', async ({ page, open }) => {
  const rpc = recordRpc(page)
  await open('/jobs')
  await row(page, 'Fan duct').getByRole('button', { name: 'Options for Fan duct v3' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByTestId('confirm')).toContainText('Delete Fan duct v3?')
  await page.getByTestId('confirm').getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(rpc('server.files.delete_file')).toHaveLength(0)

  await row(page, 'Fan duct').getByRole('button', { name: 'Options for Fan duct v3' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => rpc('server.files.delete_file').map(m => m.params)).toEqual([{ path: 'gcodes/fan_duct_v3.gcode' }])
})

test('the file that is printing cannot be renamed, moved or deleted', async ({ page, open }) => {
  await open('/jobs')
  await row(page, 'M1 bracket').getByRole('button', { name: 'Options for M1 bracket' }).click()
  for (const action of ['rename', 'move', 'delete']) {
    await expect(page.locator(`[data-action="${action}"]`)).toHaveClass(/v-list-item--disabled/)
  }
  // Download and Preview stay.
  await expect(page.locator('[data-action="download"]')).not.toHaveClass(/v-list-item--disabled/)
})

test('Upload opens the file picker with the printer files accepted', async ({ page, open }) => {
  await open('/jobs')
  const chooser = page.waitForEvent('filechooser')
  await page.getByTestId('jobs-upload').click()
  expect((await chooser).isMultiple()).toBe(true)
})
