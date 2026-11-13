/**
 * KAN-1961: Discover with the model service letting in only the origins it
 * lists, as models.muon3d.com does (MODELS_CORS_ORIGINS). A listed origin
 * (control.muon3d.com) loads; an unlisted one (Control served by the printer
 * at <name>.local or its address) is refused by the browser, and Discover says
 * it can't be reached from here rather than that you're offline.
 */
import { test, expect } from '../fixtures'

test('an origin the Library lets in loads Discover', async ({ page, models, open, baseURL }) => {
  models.corsOrigins = [new URL(baseURL ?? '').origin]
  await open('/library?view=discover')
  await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 11')
  await expect(page.getByTestId('library-discover-state')).toHaveCount(0)
})

test('an origin the Library turns away says so, not "offline", and Try again reads it again', async ({ page, models, open, baseURL }) => {
  models.corsOrigins = ['https://control.muon3d.com']
  await open('/library?view=discover')
  const state = page.getByTestId('library-discover-state')
  await expect(state).toContainText("The Library can't be reached from here")
  await expect(state).not.toContainText("You're offline")
  models.corsOrigins = [new URL(baseURL ?? '').origin]
  await state.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 11')
})
