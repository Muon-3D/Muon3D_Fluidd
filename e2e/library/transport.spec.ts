import { test, expect, ready, PRINTER } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { MODELS } from '../fakes/models'

for (const printerHosted of [false, true]) {
  test.describe(printerHosted ? 'printer-hosted Library' : 'hosted Library', () => {
    test.use({ printerHosted, signedIn: true, serviceWorkers: 'block' })

    for (const prefix of ['', PRINTER]) {
      test(`${prefix || 'root'} uses the correct requests, images and assertion audience`, async ({ page, baseURL, models }) => {
        const base = printerHosted ? `${baseURL}/models` : MODELS
        const requests: string[] = []
        const audiences: unknown[] = []
        page.on('request', request => {
          if (request.url().startsWith(`${CONSOLE}/v1/me/assertion`)) audiences.push(request.postDataJSON().audience)
          if (request.url().startsWith(MODELS) || request.url().startsWith(`${baseURL}/models/`)) requests.push(request.url())
        })
        // A real proxy strips the prefix and does not need a LAN CORS exception.
        models.corsOrigins = printerHosted ? ['https://control.muon3d.com'] : [baseURL!]
        await page.goto(`${prefix}/library?view=discover`)
        await ready(page)
        const shelf = page.getByTestId('library-shelf-popular')
        await expect(shelf).toContainText('Print 11')
        const image = shelf.locator('img').first()
        const print = models.publications.find(p => p.title === 'Print 11')!
        await expect(image).toHaveAttribute('src', `${base}/v1/public/publications/${print.id}/images/thumb`)
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
        await expect.poll(() => audiences.length).toBeGreaterThan(0)
        expect(audiences.every(audience => audience === MODELS)).toBe(true)
        expect(requests).toContain(`${base}/v1/public/publications?sort=trending&limit=12`)
        expect(requests.some(url => url === `${base}/v1/library`)).toBe(true)
        expect(requests.every(url => url.startsWith(`${base}/`))).toBe(true)
      })

      test(`${prefix || 'root'} recovers from 502 and a network failure`, async ({ page, models, baseURL }) => {
        const base = printerHosted ? `${baseURL}/models` : MODELS
        models.failWith = 502
        await page.goto(`${prefix}/library?view=discover`)
        await ready(page)
        const state = page.getByTestId('library-discover-state')
        await expect(state).toContainText("The Library didn't answer")
        await expect(state).not.toContainText("You're offline")
        models.failWith = null
        await state.getByRole('button', { name: 'Try again' }).click()
        await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 11')
        await page.route(`${base}/**`, route => route.abort('failed'))
        await page.reload()
        await expect(state).toContainText("The Library can't be reached from here")
        await expect(state).not.toContainText("You're offline")
        await page.unroute(`${base}/**`)
        await state.getByRole('button', { name: 'Try again' }).click()
        await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 11')
      })
    }
  })
}
