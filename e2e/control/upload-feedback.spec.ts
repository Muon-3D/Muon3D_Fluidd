/**
 * Upload feedback: the Upload button and a file dropped on the page both end
 * in a toast that says the file uploaded, or why it did not, in the printer's
 * (or muon-link's) own words. Harry, 11 Nov: an upload over the cloud route
 * failed and the page said nothing.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'

const REFUSAL = 'muon-link refused this upload: a remote session uploads to the gcodes root only'

/** Answers every upload the page sends: accepted, refused by muon-link, or the stream cut. */
async function uploads (page: Page, outcome: 'ok' | 'refused' | 'cut') {
  const seen: string[] = []
  await page.route('**/server/files/upload', route => {
    seen.push(route.request().postData() ?? '')
    if (outcome === 'ok') return route.fulfill({ json: { result: { item: { path: 'cube.gcode', root: 'gcodes' }, action: 'create_file' } } })
    if (outcome === 'refused') return route.fulfill({ status: 403, contentType: 'text/plain', body: REFUSAL })
    return route.abort('connectionreset')
  })
  return seen
}

async function pick (page: Page) {
  await page.getByTestId('jobs-upload-input').setInputFiles({ name: 'cube.gcode', mimeType: 'text/x-gcode', buffer: Buffer.from('G28\nG1 X10\n') })
}

async function drop (page: Page) {
  await page.evaluate(() => {
    const data = new DataTransfer()
    data.items.add(new File(['G28\nG1 X10\n'], 'cube.gcode', { type: 'text/x-gcode' }))
    window.dispatchEvent(new DragEvent('dragenter', { dataTransfer: data, bubbles: true, cancelable: true }))
    window.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
  })
}

const toast = (page: Page) => page.getByTestId('flash-message')

for (const [how, act] of [['the Upload button', pick], ['drag and drop', drop]] as const) {
  test(`${how}: a file the printer accepts says it uploaded`, async ({ page, open }) => {
    const seen = await uploads(page, 'ok')
    await open('/jobs')
    await act(page)
    await expect.poll(() => seen.length).toBe(1)
    expect(seen[0]).toContain('filename="cube.gcode"')
    await expect(toast(page)).toContainText('Uploaded cube.gcode')
  })

  test(`${how}: a refused upload says why, in muon-link's words`, async ({ page, open }) => {
    await uploads(page, 'refused')
    await open('/jobs')
    await act(page)
    await expect(toast(page)).toContainText(`Upload of cube.gcode failed: ${REFUSAL} (HTTP 403)`)
  })

  test(`${how}: a cut connection says the upload failed`, async ({ page, open }) => {
    await uploads(page, 'cut')
    await open('/jobs')
    await act(page)
    await expect(toast(page)).toContainText('Upload of cube.gcode failed:')
  })
}
