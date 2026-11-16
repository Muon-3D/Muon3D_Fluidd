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

test('Files and editor rows are in the storyboard\'s words, and Sort names and Reopen where I left off keep their choice', async ({ page, open }) => {
  const printer = await usePrinter(page, {}, { components: [...NOT_MUON], database: true })
  await open('/settings#browser')
  const lists = page.getByTestId('files-lists')
  await expect(lists.getByRole('heading', { name: 'Lists of files' })).toBeVisible()
  await expect(lists).toContainText('Numbers in order means "part 2" comes before "part 10".')
  await expect(lists.getByRole('radio')).toHaveText(['A–Z', 'Numbers in order', 'Versions'])
  await lists.getByRole('radio', { name: 'Numbers in order' }).click()
  await expect(lists.getByRole('radio', { name: 'Numbers in order' })).toHaveAttribute('aria-checked', 'true')
  await expect.poll(() => printer.called('server.database.post_item').filter(p => p.key === 'uiSettings.general.textSortOrder').map(p => p.value)).toEqual(['numeric-prefix'])

  const editor = page.getByTestId('editor-settings')
  for (const label of ['Save and restart', 'Text size', 'Open these as text', 'Ask before closing with unsaved changes', 'Reopen where I left off', 'Hints above sections']) {
    await expect(editor.getByText(label, { exact: true }).first(), label).toBeVisible()
  }
  await expect(editor).toContainText('Links to the Klipper docs above each [section].')
  await editor.getByTestId('editor-restore-view').getByRole('radio', { name: 'Always' }).click()
  await expect.poll(() => printer.called('server.database.post_item').filter(p => p.key === 'uiSettings.editor.restoreViewState').map(p => p.value)).toEqual(['local'])
})
