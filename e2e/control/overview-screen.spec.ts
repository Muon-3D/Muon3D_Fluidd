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
    port.onmessage = m => { window.results.push(m.data); window.parent.postMessage({ type: 'stub-results', results: window.results }, '*') }
    port.postMessage({ id: 1, kind: 'rpc', method: 'printer.info' })
    port.postMessage({ id: 2, kind: 'rpc', method: 'printer.gcode.script', params: { script: 'G1 X100 Y10 Z0' } })
    port.postMessage({ id: 3, kind: 'aux', method: 'POST', path: '/wifi/ap/down', body: {} })
    port.postMessage({ id: 4, kind: 'verb', verb: 'jog', axis: 'X', by: 10, script: 'G1 Z0' })
    port.postMessage({ id: 5, kind: 'verb', verb: 'gcode', script: 'SAVE_CONFIG' })
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: 1 }, '*')
</script></body></html>`

type StubResult = { id: number, ok: boolean, error?: { message: string } }

/** What the stub got back, as it tells Control's page (no reaching into the sandboxed frame). */
async function stubResults (page: Page): Promise<StubResult[]> {
  return await page.evaluate(() => (window as unknown as { stubResults?: StubResult[] }).stubResults ?? [])
}

async function servePanel (page: Page) {
  await page.addInitScript(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === 'stub-results') (window as unknown as { stubResults: unknown }).stubResults = e.data.results
    })
  })
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: STUB }))
}

/** Click the screen: its chip (hidden on a desktop until focused), as on the simple model the screen itself is small. */
async function clickScreen (page: Page) {
  const chip = page.getByTestId('m1-part-screen')
  await chip.focus()
  await chip.press('Enter')
}

async function ready (page: Page) {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(page.getByTestId('m1-parts')).toBeAttached()
}

test('the screen opens the printer\'s own screen; only allowed calls reach the printer', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  // Answered here, not by the shared mock, which can fall behind on a loaded CI runner.
  printer.state.answers['printer.info'] = { state: 'ready', state_message: 'Printer is ready', hostname: 'm1' }
  await servePanel(page)
  await open('/')
  await ready(page)
  // The refusals are said: a few seconds' note in the strip, watched for from the start.
  const refusedSaid = page.getByTestId('m1-screen-refused').waitFor({ timeout: 60_000 })
  // A click on the screen goes into it.
  await clickScreen(page)
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')

  await expect.poll(() => stubResults(page).then(rs => rs.map(r => r.id).sort())).toEqual([1, 2, 3, 4, 5])
  await refusedSaid
  const results = await stubResults(page)
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

  // Esc flies back out to the model; the screen stays selected there.
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('m1-screen')).toHaveCount(0)
  await expect(page.getByTestId('m1-parts-label')).toHaveAttribute('data-part', 'screen')
})

test('it zooms in from the screen on the model, and Done or a click outside fly back out', async ({ page, open }) => {
  // Three flights in and three out, each a few software-WebGL frames on a loaded CI runner.
  test.slow()
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await servePanel(page)
  await open('/')
  await ready(page)
  const screen = page.getByTestId('m1-screen')

  await clickScreen(page)
  // Starts small, at the model's screen, then opens.
  await expect(screen).toHaveAttribute('data-phase', 'open')
  // The camera flies in to the model's screen; the panel zooms out of it.
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'screen')
  const fly = await screen.evaluate(el => [el.style.getPropertyValue('--fly-x'), el.style.getPropertyValue('--fly-y')])
  expect(fly.every(v => /^-?\d+px$/.test(v))).toBe(true)
  await page.getByTestId('m1-screen-done').click()
  await expect(screen).toHaveCount(0)
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'free')

  // The part's own button goes in too.
  await page.getByTestId('m1-use-screen').click()
  await expect(screen).toHaveAttribute('data-phase', 'open')
  const box = (await screen.boundingBox())!
  await page.mouse.click(box.x + 20, box.y + box.height - 20)
  await expect(screen).toHaveCount(0)
  // The stub's own jog went out by name, through moveBy; flying in and out sent nothing.
  expect(printer.moves().every(l => l === 'G1 X10 F7800')).toBe(true)
})

test('without a /panel/ build the screen says so, and frames nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await page.route('**/panel/**', route => route.fulfill({ status: 404, body: '' }))
  await open('/')
  await ready(page)
  await clickScreen(page)
  await expect(page.getByTestId('m1-screen-empty')).toHaveText("The printer's screen isn't available here yet")
  await expect(page.getByTestId('m1-screen-frame')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('m1-screen')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})

test('while it prints the screen cannot be opened', async ({ page, open }) => {
  await usePrinter(page)
  await servePanel(page)
  await open('/')
  await ready(page)
  await clickScreen(page)
  await page.waitForTimeout(800)
  await expect(page.getByTestId('m1-use-screen')).toHaveCount(0)
  await expect(page.getByTestId('m1-screen')).toHaveCount(0)
})
