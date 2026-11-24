/**
 * KAN-5988 (I-597): a printer the service lists beside this browser is shown even when it gave no usable address
 * (empty local_addrs, or only its own setup hotspot) and no secure name. It used to be dropped without a word.
 */
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'

test.use({ signedIn: false, serviceWorkers: 'block' })

test('a same-network printer with no address and no secure name is listed with an honest state', async ({ page }) => {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' },
    body: JSON.stringify({
      printers: [
        { printer_id: 'otter-4b2c', name: 'Otter 4b2c', model: 'M1', linked: false, local_addrs: [] },
        { printer_id: 'sloe-11aa', name: 'Sloe 11aa', model: 'M1', linked: false, local_addrs: ['10.42.0.1'] }
      ]
    })
  }))
  await page.goto('/')
  await ready(page)
  const nearby = page.getByTestId('signed-out-nearby')
  await expect(nearby).toContainText('Otter')
  await expect(nearby).toContainText('Sloe')
  await expect(nearby.getByTestId('nearby-open')).toHaveCount(2)
})
