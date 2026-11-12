/**
 * Settings › Files and editor (KAN-1960, files storyboard): on a Muon printer
 * with Developer mode off the page says up front what that means for config
 * files, with a link to Developer mode; nothing is said otherwise.
 */
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

const MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']
const NOT_MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization']

for (const [what, components, enabled, shown] of [
  ['a Muon printer, developer mode off', MUON, false, true],
  ['a Muon printer, developer mode on', MUON, true, false],
  ['a printer that is not a Muon', NOT_MUON, false, false]
] as const) {
  test(`files and editor on ${what}`, async ({ page, open }) => {
    await usePrinter(page, {}, { components: [...components] })
    await page.route('**/server/aux/dev_mode*', route => route.fulfill({ json: { enabled, guard_armed: false } }))
    await open('/settings#browser')
    await expect(page.locator('#browser')).toBeVisible()
    const note = page.getByTestId('files-devmode-note')
    if (!shown) {
      await expect(note).toHaveCount(0)
      return
    }
    await expect(note).toContainText('Developer mode is off.')
    await expect(note).toContainText("Your print files in Jobs aren't affected.")
    await page.getByTestId('files-devmode-link').click()
    await expect(page).toHaveURL(/#developer$/)
  })
}
