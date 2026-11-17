import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const EMBED = `<!doctype html><html><head><meta name="muon3d-embed-hosts" content="'self'"><title>Muon3D Design</title></head>
<body style="margin:0;background:#123;color:white"><h1>Fake Design</h1><p id="caps"></p><p id="library"></p><p id="printer"></p><button id="browse">Browse Library</button>
<script>
  const nonce = '1234567890abcdef1234567890abcdef'
  let welcomed = false, port
  addEventListener('message', e => {
    if (welcomed || e.source !== parent || e.data?.type !== 'welcome' || e.data.nonce !== nonce || !e.ports[0]) return
    welcomed = true
    port = e.ports[0]
    document.getElementById('caps').textContent = JSON.stringify(e.data.capabilities)
    port.onmessage = m => {
      if (m.data.re === 1) document.getElementById('library').textContent = JSON.stringify(m.data.result ?? m.data.error)
      if (m.data.re === 2) document.getElementById('printer').textContent = m.data.error?.kind ?? 'unexpected printer access'
    }
    port.postMessage({ v: 1, id: 1, op: 'library.status', printer: null, params: { printer: null } })
    port.postMessage({ v: 1, id: 2, op: 'printer.get', printer: null, params: { printer: null } })
  })
  document.getElementById('browse').onclick = () => port?.postMessage({ v: 1, id: 3, op: 'library.browse', printer: null, params: { printer: null } })
  const hello = () => parent.postMessage({ protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'fake-design', appVersion: '1', nonce, features: ['ui.look', 'library'] }, location.origin)
  hello()
  const timer = setInterval(() => welcomed ? clearInterval(timer) : hello(), 200)
</script></body></html>`

async function serveDesign (page: Page, kind: 'present' | 'held' | 'absent' | 'error') {
  let release = () => {}
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/design/embed.html*', async route => {
    if (kind === 'absent' || kind === 'error') return route.fulfill({ status: kind === 'absent' ? 404 : 500, body: 'Unavailable' })
    if (kind === 'held' && route.request().resourceType() === 'document') await held
    return route.fulfill({ contentType: 'text/html', body: EMBED })
  })
  return release
}

const iframe = (page: Page) => page.getByTestId('design-view').locator('iframe')
const design = (page: Page) => page.frameLocator('iframe[title="Muon3D Design"]')

test('Design fills the page and grants only the look and Library, never a printer', async ({ page, open, isMobile }) => {
  await serveDesign(page, 'present')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/design')
  await expect(page.getByTestId('page-title')).toHaveText('Design')
  await expect(iframe(page)).toBeVisible()
  await expect(design(page).locator('#caps')).toHaveText('["ui.look","library"]')
  await expect(design(page).locator('#library')).toContainText('"signedIn":false')
  await expect(design(page).locator('#printer')).toHaveText('not-allowed')
  await expect(page.getByTestId('design-opening')).toHaveCount(0)
  const box = (await iframe(page).boundingBox())!
  const bar = (await page.locator('.v-app-bar').first().boundingBox())!
  const view = page.viewportSize()!
  expect(Math.abs(box.y - bar.y - bar.height)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.x + box.width - view.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y + box.height - view.height)).toBeLessThanOrEqual(1)
  if (isMobile) expect(box.x).toBeLessThanOrEqual(1)
  else {
    const rail = (await page.locator('nav').first().boundingBox())!
    expect(Math.abs(box.x - rail.x - rail.width)).toBeLessThanOrEqual(1)
    await expect(page.locator('nav').getByRole('link', { name: /^Design(?: G D)?$/ })).toBeVisible()
  }
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= innerHeight + 1)).toBe(true)
  expect(printer.called('printer.print.start')).toEqual([])
  expect(printer.called('printer.gcode.script')).toEqual([])
})

test('Design stays hidden behind Opening until its frame loads', async ({ page, open }) => {
  const release = await serveDesign(page, 'held')
  await usePrinter(page, PRESETS.idleHomed())
  await open('/design')
  await expect(page.getByTestId('design-opening')).toContainText('Opening Design')
  await expect(iframe(page)).toBeHidden()
  release()
  await expect(iframe(page)).toBeVisible()
  await expect(page.getByTestId('design-opening')).toHaveCount(0)
})

for (const kind of ['absent', 'error'] as const) {
  test(`an ${kind} Design install is explained without a frame or navigation entry`, async ({ page, open, isMobile }) => {
    await serveDesign(page, kind)
    await usePrinter(page, PRESETS.idleHomed())
    await open('/design')
    await expect(page.getByTestId('design-absent')).toHaveText('Design is not installed here.')
    await expect(iframe(page)).toHaveCount(0)
    await expect(page.getByTestId('design-opening')).toHaveCount(0)
    if (!isMobile) await expect(page.locator('nav').getByRole('link', { name: /^Design(?: G D)?$/ })).toHaveCount(0)
  })
}

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Design receives the account Library status and opens the existing Library', async ({ page, open }) => {
    await serveDesign(page, 'present')
    await usePrinter(page, PRESETS.idleHomed())
    await open('/design')
    await expect(design(page).locator('#library')).toContainText('"signedIn":true')
    await design(page).getByRole('button', { name: 'Browse Library' }).click()
    await expect(page).toHaveURL(/\/library$/)
    await expect(page.getByTestId('design-view')).toHaveCount(0)
  })
})
