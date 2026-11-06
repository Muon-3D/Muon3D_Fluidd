/**
 * Overview: using the printer's own screen from Control (SCREEN-PLAN.md).
 *
 * /panel/ is MuonUI's embed build in production; here a stub page plays it:
 * it does the real handshake, then asks for one allowed call and two that
 * must stay on the printer. The test checks what reached the printer
 * (usePrinter records every call), and that the refusals came back.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

// Sandboxed (allow-scripts only), so its own origin is opaque: it trusts the port by its source, the parent.
const STUB = `<!doctype html><html><body><script>
  window.results = []
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data || e.data.type !== 'muon-panel-port') return
    const port = e.ports[0]
    port.onmessage = m => { window.results.push(m.data) }
    port.postMessage({ id: 1, kind: 'rpc', method: 'printer.info' })
    port.postMessage({ id: 2, kind: 'rpc', method: 'printer.gcode.script', params: { script: 'G1 X100 Y10 Z0' } })
    port.postMessage({ id: 3, kind: 'aux', method: 'POST', path: '/wifi/ap/down', body: {} })
    port.postMessage({ id: 4, kind: 'verb', verb: 'jog', axis: 'X', by: 10, script: 'G1 Z0' })
    port.postMessage({ id: 5, kind: 'verb', verb: 'gcode', script: 'SAVE_CONFIG' })
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: 1 }, '*')
</script></body></html>`

async function servePanel (page: Page) {
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: STUB }))
}

async function ready (page: Page) {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(page.getByTestId('m1-parts')).toBeAttached()
}

test('the screen opens the printer\'s own screen; only allowed calls reach the printer', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await servePanel(page)
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-screen').focus()
  await page.getByTestId('m1-use-screen').click()
  await expect(page.getByTestId('m1-screen')).toBeVisible()

  const frame = page.frameLocator('[data-tid="m1-screen-frame"]')
  await expect.poll(() => frame.locator('body').evaluate(() => (window as unknown as { results: unknown[] }).results.length)).toBe(5)
  const results = await frame.locator('body').evaluate(() => (window as unknown as { results: Array<{ id: number, ok: boolean, error?: { message: string } }> }).results)
  const byId = Object.fromEntries(results.map(r => [r.id, r]))
  expect(byId[1].ok).toBe(true)
  expect(byId[2]).toMatchObject({ ok: false, error: { message: 'Do this on the printer itself' } })
  expect(byId[3]).toMatchObject({ ok: false, error: { message: 'Do this on the printer itself' } })
  // A jog by name runs as Control's own jog (moveBy, through the planner); a made-up verb does not.
  expect(byId[4].ok).toBe(true)
  expect(byId[5]).toMatchObject({ ok: false, error: { message: 'Do this on the printer itself' } })

  // Only printer.info and the jog went out (the jog as Control's own: moveBy); nothing raw.
  expect(printer.calls.map(c => c.method)).toContain('printer.info')
  const lines = printer.gcode.flatMap(g => g.split('\n'))
  expect(lines.filter(l => l.startsWith('G1 '))).toEqual(['G1 X10 F7800'])
  expect(lines.some(l => /SAVE_CONFIG|G1 Z0/.test(l))).toBe(false)
  // Sandboxed: the frame has no way to Control's storage or window.
  await expect(page.getByTestId('m1-screen-frame')).toHaveAttribute('sandbox', 'allow-scripts')
  await expect(page.getByTestId('m1-screen-refused')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('m1-screen')).toHaveCount(0)
})

test('without a /panel/ build the screen offers nothing to open', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await page.route('**/panel/**', route => route.fulfill({ status: 404, body: '' }))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-screen').focus()
  await expect(page.getByTestId('m1-parts-label')).toHaveAttribute('data-part', 'screen')
  await page.waitForTimeout(800)
  await expect(page.getByTestId('m1-use-screen')).toHaveCount(0)
})

test('while it prints the screen cannot be opened', async ({ page, open }) => {
  await usePrinter(page)
  await servePanel(page)
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-screen').focus()
  await page.waitForTimeout(800)
  await expect(page.getByTestId('m1-use-screen')).toHaveCount(0)
})
