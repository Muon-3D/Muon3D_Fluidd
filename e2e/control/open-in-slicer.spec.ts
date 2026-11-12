/**
 * Open in Slice loads the model (KAN-2191). Jack, 12 Nov, at the bench: "I
 * just tried to upload and it said open in slice, i clicked it and the slicer
 * opened but the print didn't load into it."
 *
 * A model dropped on a printer's page, or picked with Upload, is offered to
 * Slice; Open Slice opens /slice and hands the slicer the file itself
 * (printer-bridge/1's models.open, printer-client 0.5.0), so it arrives with
 * its name and every byte. The slicer here is a stub at this origin's
 * /slicer/embed.html that says hello as the real one does, listing
 * `models.open`, and shows what it was sent. A stub that lists no models.open
 * (an older slicer) is sent nothing, and the page says to use Add model.
 */
import type { Page, Route } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const MODEL = 'solid bracket\nfacet normal 0 0 1\nendsolid bracket\n'

/** A slicer that says hello (with `features`) until it is welcomed, and lists each models.open file it hears. */
function stubSlicer (features: string[]): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="muon3d-embed-hosts" content="'self'"><title>Muon3D Slicer</title></head>
<body style="margin:0;background:#123;color:#fff"><p id="state">waiting</p><p id="received"></p>
<script>
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')
  const received = []
  let welcomed = false
  addEventListener('message', (e) => {
    const d = e.data
    if (welcomed || e.source !== parent || !d || d.type !== 'welcome' || d.nonce !== nonce || !e.ports[0]) return
    welcomed = true
    document.getElementById('state').textContent = 'welcomed'
    e.ports[0].onmessage = (m) => {
      const msg = m.data
      if (!msg || msg.event !== 'models.open') return
      for (const f of msg.data.files) {
        received.push(f.name + ' · ' + f.bytes.byteLength + ' bytes · ' + new TextDecoder().decode(new Uint8Array(f.bytes)).split('\\n')[0])
      }
      document.getElementById('received').textContent = received.join(' | ')
    }
  })
  const hello = () => { if (!welcomed) parent.postMessage({ protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'stub-slicer', appVersion: '1', nonce, features: ${JSON.stringify(features)} }, location.origin) }
  hello()
  const timer = setInterval(() => { welcomed ? clearInterval(timer) : hello() }, 200)
</script></body></html>`
}

async function serveSlicer (page: Page, features: string[]) {
  await page.route('**/slicer/embed.html*', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: stubSlicer(features) }))
}

/** Every upload the page sends to the printer. */
async function uploads (page: Page) {
  const seen: string[] = []
  await page.route('**/server/files/upload', route => {
    seen.push(route.request().postData() ?? '')
    return route.fulfill({ json: { result: { item: { path: 'x', root: 'gcodes' }, action: 'create_file' } } })
  })
  return seen
}

async function drop (page: Page) {
  await page.evaluate((text) => {
    // A synthetic DataTransfer has no file-system entries, so the drop carries
    // its file in `files`, as a browser does when there are no items.
    const file = new File([text], 'bracket.stl', { type: 'model/stl' })
    const data = { items: [], files: [file], types: ['Files'], dropEffect: 'none' }
    for (const type of ['dragenter', 'drop']) {
      const event = new DragEvent(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'dataTransfer', { value: data })
      window.dispatchEvent(event)
    }
  }, MODEL)
}

async function pick (page: Page) {
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bracket.stl', mimeType: 'model/stl', buffer: Buffer.from(MODEL) })
}

const slicer = (page: Page) => page.frameLocator('iframe[title="Muon3D Slicer"]')
const RECEIVED = `bracket.stl · ${Buffer.byteLength(MODEL)} bytes · solid bracket`

for (const [how, act] of [['drag and drop', drop], ['the Upload button', pick]] as const) {
  test(`${how}: Open Slice opens the slicer with the model in it`, async ({ page, open }) => {
    await serveSlicer(page, ['models.open'])
    const seen = await uploads(page)
    await usePrinter(page, PRESETS.idleHomed())
    await open('/jobs')
    await act(page)

    const offer = page.getByTestId('job-ready')
    await expect(offer).toContainText('bracket.stl')
    await offer.getByTestId('job-ready-open-slice').click()

    await expect(page).toHaveURL(/\/slice$/)
    await expect(slicer(page).locator('#state')).toHaveText('welcomed', { timeout: 20_000 })
    await expect(slicer(page).locator('#received')).toHaveText(RECEIVED)
    // A model is the slicer's, never a file for the printer.
    expect(seen).toHaveLength(0)

    // Sent once: a reload of /slice doesn't add it again.
    await page.reload()
    await expect(slicer(page).locator('#state')).toHaveText('welcomed', { timeout: 20_000 })
    await expect(slicer(page).locator('#received')).toHaveText('')
  })
}

test('an older slicer (no models.open) is sent nothing, and the page says to add the model with Add model', async ({ page, open }) => {
  await serveSlicer(page, ['ui.mode'])
  await usePrinter(page, PRESETS.idleHomed())
  await open('/jobs')
  await drop(page)
  await page.getByTestId('job-ready').getByTestId('job-ready-open-slice').click()
  await expect(slicer(page).locator('#state')).toHaveText('welcomed', { timeout: 20_000 })
  await expect(page.getByTestId('flash-message')).toContainText('add bracket.stl with Add model', { timeout: 20_000 })
  await expect(slicer(page).locator('#received')).toHaveText('')
})
