/**
 * KAN-3782: Slice opens the slicer, in this tab. Jack clicked Slice on a print
 * with no G-code and landed on library.muon3d.com.
 */
import { test, expect } from '../fixtures'

test('Slice on a print with no G-code opens the slicer in this tab, not library.muon3d.com', async ({ page, models, open }) => {
  models.publications[10].gcode = false
  await open('/library?view=discover')
  const start = new URL(page.url()).origin
  let popup = false
  page.on('popup', () => { popup = true })
  await page.getByTestId('library-shelf-popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  const slice = page.getByTestId('library-quick-look-slice')
  await expect(slice).toBeVisible()
  await expect(slice).toHaveText('Slice it')
  await expect(slice).not.toHaveAttribute('target', '_blank')
  await expect(slice).not.toHaveAttribute('href', /library\.muon3d\.com/)
  await slice.click()
  await expect(page).toHaveURL(/\/slice\?.*library=/)
  const now = new URL(page.url())
  expect(now.origin).toBe(start)
  expect(now.hostname).not.toContain('library.muon3d.com')
  expect(popup).toBe(false)
})
