import { test, expect } from '../fixtures'
import { serveCatalogue } from './catalogue-fixture'

test('project-only models have a primary Slice and print handoff', async ({ page, models, open }) => {
  const p = models.publications[10]
  p.gcode = false
  await open(`/library?view=discover&print=${p.id}`)
  const slice = page.getByTestId('library-print-slice')
  await expect(slice).toBeVisible()
  await expect(slice).toHaveAttribute('href', /https:\/\/slicer\.muon3d\.com\/\?publication=/)
  await page.context().route('https://slicer.muon3d.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Slice handoff</h1>' }))
  const popup = page.waitForEvent('popup')
  await slice.click()
  const target = await popup
  await expect(target.getByRole('heading', { name: 'Slice handoff' })).toBeVisible()
  await target.close()
})

test.describe('model page', () => {
  test.use({ signedIn: true })

  test('reviewed profile, private history, owner versions, similar models and report handoff', async ({ page, models, open }) => {
    await serveCatalogue(page, models)
    const p = models.publications[10]
    await page.route('**/v1/library/publications/*/context', route => {
      expect(route.request().headers().authorization).toBeTruthy()
      return route.fulfill({ json: { owner: true, state: 'approved', pinned_version: 1, versions: [{ number: 2, origin: 'save', created_at: '2026-11-09T12:00:00Z' }, { number: 1, origin: 'save' }], runs: [{ id: 'own-run', printer_name: 'My private printer', started_at: '2026-11-10T12:00:00Z', outcome: 'completed' }] } })
    })
    await open(`/library?view=discover&print=${p.id}`)
    await expect(page.getByTestId('library-print-profile')).toContainText('Layer height')
    await expect(page.getByTestId('library-print-profile')).toContainText('Estimated filament')
    await expect(page.getByTestId('library-print-profile')).toContainText('Not provided')
    await expect(page.getByTestId('library-print-versions')).toContainText('Version 1')
    await expect(page.getByTestId('library-print-versions')).toContainText('Saved, not published')
    await expect(page.getByTestId('library-print-versions')).toContainText('Version 2')
    await expect(page.getByTestId('library-print-history')).toContainText('My private printer')
    await expect(page.getByTestId('library-shelf-similar').getByRole('button', { name: /Quick look at/ }).first()).toBeVisible()
    await expect(page.getByTestId('library-shelf-similar')).not.toContainText(p.title)
    await page.getByTestId('library-shelf-similar').getByRole('button', { name: /Quick look at/ }).first().click()
    await expect(page.getByTestId('library-quick-look')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByTestId('library-print-heart').click()
    await expect(page.getByTestId('library-print-heart')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('library-print-panel-heart')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('library-print-history')).toContainText('10 Nov 2026')
    await expect(page.getByTestId('library-print-history')).toContainText('Completed')
    await page.getByTestId('library-print-print').click()
    await expect(page.getByTestId('print-on')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('library-print-maker-link')).toHaveAttribute('href', /\/@maker3$/)
    await page.context().route('https://library.muon3d.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Report this model</h1>' }))
    const makerPopup = page.waitForEvent('popup')
    await page.getByTestId('library-print-maker-link').click()
    const maker = await makerPopup
    await expect(maker).toHaveURL(/\/@maker3$/)
    await maker.close()
    const popup = page.waitForEvent('popup')
    await page.getByTestId('library-print-report').click()
    const report = await popup
    await expect(report).toHaveURL(/#report$/)
    await report.close()
  })

  test('history with the Library off says to turn it on, links to the settings, and has no Try again', async ({ page, models, open }) => {
    await page.route('**/v1/library/publications/*/context', route => route.fulfill({ status: 403, json: { error: { code: 'consent_required', message: 'Turn on your Library.' } } }))
    await open(`/library?view=discover&print=${models.publications[10].id}`)
    const history = page.getByTestId('library-print-history')
    await expect(history).toContainText('Turn on Library saving to keep a private history of your prints of this model.')
    await expect(history.getByRole('button', { name: 'Try again' })).toHaveCount(0)
    await history.getByRole('link', { name: 'Library settings' }).click()
    await expect(page).toHaveURL(/\/account\/library/)
  })

  test('history failure retries, empty history is distinct and others see only the pinned version', async ({ page, models, open }) => {
    let failing = true
    await page.route('**/v1/library/publications/*/context', route => route.fulfill({ status: failing ? 503 : 200, json: failing ? {} : { owner: false, state: 'approved', pinned_version: 1, versions: [{ number: 1 }], runs: [] } }))
    await open(`/library?view=discover&print=${models.publications[10].id}`)
    const history = page.getByTestId('library-print-history')
    await expect(history).toContainText('Your print history could not be loaded just now.')
    failing = false
    await history.getByRole('button', { name: 'Try again' }).click()
    await expect(history).toContainText('No prints recorded for this model yet.')
    await expect(page.getByText('Your version history', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('library-print-versions')).not.toContainText('Version 2')
  })

  test('an owner can distinguish review from a missing public model without publishing private versions', async ({ page, models, open }) => {
    const id = models.publications[10].id
    models.failOn = request => request === `GET /v1/public/publications/${id}` ? 404 : null
    await page.route('**/v1/library/publications/*/context', route => route.fulfill({ json: { owner: true, state: 'pending', pinned_version: 1, versions: [{ number: 2 }], runs: [] } }))
    await open(`/library?view=discover&print=${id}`)
    await expect(page.getByTestId('library-print-unavailable')).toContainText('Your model is under review')
    await expect(page.getByTestId('library-print-versions')).toHaveCount(0)
    await page.getByTestId('library-print-unavailable').getByRole('button', { name: 'Back to Discover' }).click()
    await expect(page).not.toHaveURL(/print=/)
  })
})

test('anonymous missing models never request private context', async ({ page, models, open }) => {
  const id = models.publications[10].id
  models.failOn = request => request === `GET /v1/public/publications/${id}` ? 404 : null
  let privateCalls = 0
  page.on('request', request => { if (request.url().includes('/context')) privateCalls++ })
  await open(`/library?view=discover&print=${id}`)
  await expect(page.getByTestId('library-print-unavailable')).toContainText('Model not found')
  expect(privateCalls).toBe(0)
})
