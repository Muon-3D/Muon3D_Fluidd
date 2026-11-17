import { readFileSync, existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test, expect } from '../fixtures'

const repo = resolve(process.env.SLICER_REPO ?? '../muon3d-slicer')
const dist = resolve(process.env.REAL_SLICER_DIR ?? `${repo}/data/printer/slicer`)
test.use({ webgl: true, serviceWorkers: 'block' })
test.skip(!existsSync(`${dist}/embed.html`), 'Build the printer copy in muon3d-slicer: node scripts/build-printer.mjs')

for (const how of ['picker', 'drop'] as const) {
  for (const extension of ['stl', '3mf'] as const) {
    test(`${how} ${extension}: real slicer receives the model on its plate`, async ({ page, open }, info) => {
      const { createMockM1, AFTER_SETUP_DATABASE } = await import(pathToFileURL(`${repo}/e2e/fixtures/mockM1.mjs`).href)
      const printer = createMockM1({ identity: { name: 'Boxwood', suffix: '367a' }, database: AFTER_SETUP_DATABASE, corsDomains: [new URL(info.project.use.baseURL!).origin] })
      const origin = await printer.listen()
      await page.route('**/config.json', async route => {
        const response = await route.fetch()
        const config = await response.json()
        config.endpoints = [origin]
        await route.fulfill({ response, json: config })
      })
      try {
        await page.route('**/slicer/**', async route => {
          if (!new URL(route.request().url()).pathname.startsWith('/slicer/')) return route.fallback()
          const file = resolve(dist, decodeURIComponent(new URL(route.request().url()).pathname.slice('/slicer/'.length)))
          if (!file.startsWith(dist + sep) || !existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' })
          await route.fulfill({ path: file, headers: { 'Cross-Origin-Resource-Policy': 'same-origin' } })
        })
        const posts: string[] = []
        page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/server/files/upload')) posts.push(request.url()) })
        const file = extension === 'stl' ? `${repo}/e2e/fixtures/cube20.stl` : `${repo}/web/src/project/fixtures/orca-2.5-cubes-sliced.3mf`
        const buffer = readFileSync(file)
        const name = `handoff.${extension}`
        await open('/jobs')
        if (how === 'picker') {
          await expect(page.getByTestId('jobs-upload-input')).toBeAttached({ timeout: 20_000 })
          await page.getByTestId('jobs-upload-input').setInputFiles({ name, mimeType: 'application/octet-stream', buffer })
        } else {
          await page.evaluate(({ bytes, name }) => {
            const file = new File([new Uint8Array(bytes)], name)
            for (const type of ['dragenter', 'drop']) {
              const event = new DragEvent(type, { bubbles: true, cancelable: true })
              Object.defineProperty(event, 'dataTransfer', { value: { items: [], files: [file], types: ['Files'], dropEffect: 'none' } })
              window.dispatchEvent(event)
            }
          }, { bytes: [...buffer], name })
        }
        await page.getByTestId('job-ready').getByTestId('job-ready-open-slice').click({ timeout: 20_000 })
        const frame = page.frameLocator('iframe[title="Muon3D Slicer"]')
        await expect(frame.locator('#ws-outline-chip')).toContainText(extension === 'stl' ? '1 object' : '3 objects', { timeout: 30_000 })
        await expect(frame.locator('canvas').first()).toBeVisible()
        expect(posts).toEqual([])
        await page.screenshot({ path: info.outputPath(`${how}-${extension}-plate.png`) })
        if (how === 'picker' && extension === 'stl') {
          const primary = frame.locator('.ws-inspector .ws-primary__go').first()
          const label = frame.locator('.ws-inspector .ws-primary__label').first()
          const deadline = Date.now() + 120_000
          for (let clicked = ''; ;) {
            const text = (await label.textContent())?.trim() ?? ''
            if (/^Print on Boxwood/.test(text) && await primary.getAttribute('aria-disabled') !== 'true') break
            if (Date.now() > deadline) throw new Error(`Slicer did not become printable: ${text}`)
            if (/^Slice/.test(text) && text !== clicked && await primary.getAttribute('aria-disabled') !== 'true') {
              clicked = text
              await primary.click()
            }
            await page.waitForTimeout(250)
          }
          await primary.click()
          const dialog = page.getByTestId('slicer-confirm')
          await expect(dialog).toBeVisible()
          const plate = dialog.locator('[data-test="slicer-confirm-plate"] input')
          if (await plate.count()) await plate.check({ force: true })
          await dialog.locator('[data-test="slicer-confirm-print"]').click()
          await expect.poll(() => printer.events.filter((event: any) => event.kind === 'start').length, { timeout: 90_000 }).toBe(1)
          const upload = printer.events.find((event: any) => event.kind === 'upload' && event.status === 201)
          expect(upload).toBeTruthy()
          expect(printer.events.find((event: any) => event.kind === 'start').filename).toBe(upload.path)
        }
      } finally {
        await printer.close()
      }
    })
  }
}
