/**
 * Print on… (Library v3, page 10): the print's name, each printer in the
 * account once with what it is doing and whether this print can go there,
 * Cancel plus one primary, and where to add a printer. Choosing a ready
 * printer, the plate switch and Print now are PrintOnDialog.spec (the mock
 * printer is not one of the account's here).
 */
import { test, expect } from '../fixtures'
import { ownItem } from '../fakes/models'
import type { Page } from '@playwright/test'

test.use({ signedIn: true })

const dialog = (page: Page) => page.getByTestId('print-on')

/** An account printer the console lists, as the console sends it. */
const printer = (id: string, name: string, online = false) => ({
  id, name, model: 'Muon3D M1', state: online ? 'online' : 'offline', version: '1', linked_at: 0, last_seen: 0, online, online_since: null
})

test('from Yours: the print\'s name, no printers yet, and Add a printer goes to your printers', async ({ page, models, open }) => {
  models.items.push(ownItem('a', { name: 'Hex planter' }))
  await open('/library?view=mine')
  await page.getByTestId('library-shelf-sliced').getByRole('button', { name: 'Print on Boxwood: Hex planter' }).click()
  await expect(dialog(page)).toContainText('Print from your Library')
  await expect(dialog(page).getByRole('heading', { name: 'Hex planter' })).toBeVisible()
  await expect(page.getByTestId('print-on-none')).toContainText('There are no printers in your account yet')
  // No printer to send to: no Print now and no Save, only Cancel.
  await expect(page.getByTestId('print-on-print')).toHaveCount(0)
  await expect(page.getByTestId('print-on-save')).toHaveCount(0)
  await page.getByTestId('print-on-add-printer').click()
  await expect(dialog(page)).toBeHidden()
  await expect(page).not.toHaveURL(/\/library/)
})

test('each printer once, with what it is doing; an offline one cannot be chosen, so nothing can be sent', async ({ page, models, account, open }) => {
  models.items.push(ownItem('a', { name: 'Hex planter' }))
  account.printers.push(printer('p-walnut', 'Walnut') as never, printer('p-hazel', 'Hazel') as never)
  await open('/library?view=mine')
  await page.getByTestId('library-shelf-sliced').getByRole('button', { name: 'Print on Boxwood: Hex planter' }).click()
  const rows = dialog(page).locator('.print-on__row')
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('Walnut')
  await expect(rows.nth(1)).toContainText('Hazel')
  await expect(rows.nth(0)).toContainText('Offline')
  // Said once, by the pill.
  await expect(rows.nth(0).getByText('Offline')).toHaveCount(1)
  await expect(dialog(page).getByRole('radio')).toHaveCount(0)
  await expect(page.getByTestId('print-on-print')).toBeDisabled()
  await expect(page.getByTestId('print-on-save')).toBeDisabled()
  await expect(page.getByTestId('print-on-plate')).toHaveCount(0)
  await expect(page.getByTestId('print-on-fine')).toContainText('comes from your Library')
  await page.getByTestId('print-on-cancel').click()
  await expect(dialog(page)).toBeHidden()
})

test('from Discover it says the file is checked against what its maker published', async ({ page, account, open }) => {
  account.printers.push(printer('p-walnut', 'Walnut') as never)
  await open('/library?view=discover')
  await page.getByTestId('library-shelf-popular').getByRole('button', { name: 'Print Print 11 on Boxwood' }).click()
  await expect(dialog(page)).toContainText('Print from Discover')
  await expect(dialog(page).getByRole('heading', { name: 'Print 11' })).toBeVisible()
  await expect(page.getByTestId('print-on-fine')).toContainText('checked against what its maker published')
})
