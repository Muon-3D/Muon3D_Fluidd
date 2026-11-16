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

/**
 * A slicer that says hello (with `features`) until it is welcomed, and lists
 * each models.open file it hears. `null`: one that never says hello.
 */
function stubSlicer (features: string[] | null): string {
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
  const features = ${JSON.stringify(features)}
  const hello = () => { if (!welcomed && features) parent.postMessage({ protocol: 'printer-bridge', type: 'hello', versions: [1], app: 'stub-slicer', appVersion: '1', nonce, features }, location.origin) }
  hello()
  const timer = setInterval(() => { welcomed ? clearInterval(timer) : hello() }, 200)
</script></body></html>`
}

async function serveSlicer (page: Page, features: string[] | null) {
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

async function drop (page: Page, name = 'bracket.stl') {
  await page.evaluate(([text, name]) => {
    // A synthetic DataTransfer has no file-system entries, so the drop carries
    // its file in `files`, as a browser does when there are no items.
    const file = new File([text], name, { type: 'model/stl' })
    const data = { items: [], files: [file], types: ['Files'], dropEffect: 'none' }
    for (const type of ['dragenter', 'drop']) {
      const event = new DragEvent(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'dataTransfer', { value: data })
      window.dispatchEvent(event)
    }
  }, [MODEL, name])
}

async function pick (page: Page) {
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'bracket.stl', mimeType: 'model/stl', buffer: Buffer.from(MODEL) })
}

/**
 * Every toast's text, in order. The page has one toast slot, and its own
 * "saved on this device" notice can take it, so the slot is watched rather
 * than read once.
 */
async function toasts (page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = []
    ;(window as any).__toasts = seen
    new MutationObserver(() => {
      for (const el of document.querySelectorAll('[data-tid="flash-message"]')) {
        const text = (el.textContent ?? '').trim()
        if (text && seen[seen.length - 1] !== text) seen.push(text)
      }
    }).observe(document, { subtree: true, childList: true, characterData: true })
  })
  return () => page.evaluate(() => ((window as any).__toasts as string[]).join(' | '))
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
  const said = await toasts(page)
  await usePrinter(page, PRESETS.idleHomed())
  await open('/jobs')
  await drop(page)
  await page.getByTestId('job-ready').getByTestId('job-ready-open-slice').click()
  await expect(slicer(page).locator('#state')).toHaveText('welcomed', { timeout: 20_000 })
  await expect.poll(said, { timeout: 20_000 }).toContain('add bracket.stl with Add model')
  await expect(slicer(page).locator('#received')).toHaveText('')
})

test('leaving Slice before the slicer says hello: the models are let go with the Add model message, and a later visit adds nothing', async ({ page, open }) => {
  let features: string[] | null = null
  await page.route('**/slicer/embed.html*', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: stubSlicer(features) }))
  const said = await toasts(page)
  await usePrinter(page, PRESETS.idleHomed())
  await open('/jobs')
  await drop(page)
  await page.getByTestId('job-ready').getByTestId('job-ready-open-slice').click()
  await expect(page).toHaveURL(/\/slice$/)
  await expect(slicer(page).locator('#state')).toHaveText('waiting')

  // Back to Jobs before any hello: the models are let go, and said so, at once.
  await page.goBack()
  await expect(page).toHaveURL(/\/jobs$/)
  await expect.poll(said).toContain('add bracket.stl with Add model')

  // Slice again, in this page, now with a slicer that would take models: none are held any more.
  features = ['models.open']
  await page.goForward()
  await expect(slicer(page).locator('#state')).toHaveText('welcomed', { timeout: 20_000 })
  await page.waitForTimeout(1000)
  await expect(slicer(page).locator('#received')).toHaveText('')
})

test('a slicer that never says hello: the models are let go with the Add model message', async ({ page, open }) => {
  await serveSlicer(page, null)
  const said = await toasts(page)
  await usePrinter(page, PRESETS.idleHomed())
  await open('/jobs')
  await drop(page)
  await page.getByTestId('job-ready').getByTestId('job-ready-open-slice').click()
  await expect(page).toHaveURL(/\/slice$/)
  await expect.poll(said, { timeout: 45_000 }).toContain('add bracket.stl with Add model')
  await expect(slicer(page).locator('#state')).toHaveText('waiting')
})

test('a STEP model is not promised to Slice: the card says to export STL, OBJ or 3MF, with no Open Slice, and nothing is uploaded', async ({ page, open }) => {
  await serveSlicer(page, ['models.open'])
  const seen = await uploads(page)
  await usePrinter(page, PRESETS.idleHomed())
  await open('/jobs')
  await drop(page, 'bracket.step')
  const card = page.getByTestId('job-ready')
  await expect(card.getByTestId('job-ready-unsliceable')).toContainText('Slice can\'t open bracket.step: it takes STL, OBJ and 3MF')
  await expect(card.getByTestId('job-ready-open-slice')).toHaveCount(0)
  expect(seen).toHaveLength(0)
})
