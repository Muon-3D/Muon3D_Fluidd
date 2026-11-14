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

// About the 3D stage: it needs WebGL, which the e2e fixtures turn off by default (KAN-2781).
test.use({ webgl: true })
import { usePrinter, PRESETS, M1_NO_GO } from './printer'

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

// The bridge is under test, not the mock's ticks: the shared mock is a hot, mid-print M1 whose status ticks (several a
// second) kept a desktop page on a loaded CI runner so busy that the stub's answers, one message hop each, took longer
// than the poll (reproduced at a 4x CPU throttle: 16 s from the hello to the first answer). The page holds still instead.
const STILL = { ticks: false }

type StubResult = { id: number, ok: boolean, error?: { message: string } }

/** What the stub got back, as it tells Control's page (no reaching into the sandboxed frame). */
async function stubResults (page: Page): Promise<StubResult[]> {
  return await page.evaluate(() => (window as unknown as { stubResults?: StubResult[] }).stubResults ?? [])
}

// A panel screen with a physical-presence confirmation: the embed shows it as a disabled "Confirm on the printer" tag,
// and any attempt to answer it from here (consent, dev mode, knob press) is a call Control must refuse and never send.
const STUB_CONFIRM = `<!doctype html><html><body><button disabled data-tid="stub-confirm-tag">Confirm on the printer</button><script>
  window.results = []
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data || e.data.type !== 'muon-panel-port') return
    const port = e.ports[0]
    port.onmessage = m => { window.results.push(m.data); window.parent.postMessage({ type: 'stub-results', results: window.results }, '*') }
    port.postMessage({ id: 10, kind: 'aux', method: 'POST', path: '/consent/accept', body: {} })
    port.postMessage({ id: 11, kind: 'aux', method: 'POST', path: '/dev_mode/enter', body: { confirm: true } })
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: 1 }, '*')
</script></body></html>`

// A panel that asks for heat targets either side of each heater's limit.
const STUB_HEAT = `<!doctype html><html><body><script>
  window.results = []
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data || e.data.type !== 'muon-panel-port') return
    const port = e.ports[0]
    port.onmessage = m => { window.results.push(m.data); window.parent.postMessage({ type: 'stub-results', results: window.results }, '*') }
    port.postMessage({ id: 20, kind: 'verb', verb: 'heat', heater: 'extruder', target: 301 })
    port.postMessage({ id: 21, kind: 'verb', verb: 'heat', heater: 'extruder', target: 250 })
    port.postMessage({ id: 22, kind: 'verb', verb: 'heat', heater: 'heater_bed', target: 111 })
    port.postMessage({ id: 23, kind: 'verb', verb: 'heat', heater: 'heater_bed', target: 110 })
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: 1 }, '*')
</script></body></html>`

/** An idle, homed M1 with both heaters; the limits are the printer's own config (not a number: not known). */
function heated (limits: Record<string, unknown>) {
  return {
    ...PRESETS.idleHomed(),
    heaters: { available_heaters: ['extruder', 'heater_bed'] },
    extruder: { temperature: 25, target: 0, power: 0 },
    heater_bed: { temperature: 25, target: 0, power: 0 },
    configfile: { settings: { bed_mesh: M1_NO_GO, ...limits } }
  }
}

async function servePanel (page: Page, body = STUB) {
  await page.addInitScript(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === 'stub-results') (window as unknown as { stubResults: unknown }).stubResults = e.data.results
    })
  })
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body }))
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
  const printer = await usePrinter(page, PRESETS.idleHomed(), STILL)
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
  const printer = await usePrinter(page, PRESETS.idleHomed(), STILL)
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
  await page.mouse.click(box.x + 12, box.y + box.height * 0.6)
  await expect(screen).toHaveCount(0)
  // The stub's own jog went out by name, through moveBy; flying in and out sent nothing.
  expect(printer.moves().every(l => l === 'G1 X10 F7800')).toBe(true)
})

test('without a /panel/ build the screen says so, and frames nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), STILL)
  await page.route('**/panel/**', route => route.fulfill({ status: 404, body: '' }))
  await open('/')
  await ready(page)
  await clickScreen(page)
  await expect(page.getByTestId('m1-screen-empty')).toHaveText('Your printer needs an update to show its screen here')
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

test('a confirmation that must be done on the printer stays blocked: tagged, and Control sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), STILL)
  await servePanel(page, STUB_CONFIRM)
  await open('/')
  await ready(page)
  await clickScreen(page)
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  // Consent and dev-mode answers are refused and never sent; Control says why, in the tag's words.
  await expect.poll(() => stubResults(page).then(rs => rs.filter(r => r.id === 10 || r.id === 11).length)).toBe(2)
  const results = await stubResults(page)
  for (const id of [10, 11]) {
    expect(results.find(r => r.id === id)).toMatchObject({ ok: false, error: { message: 'Do this on the printer itself' } })
  }
  await expect(page.getByTestId('m1-screen-refused')).toContainText('Confirm on the printer')
  const sent = JSON.stringify([printer.calls, printer.gcode])
  expect(sent).not.toMatch(/consent|dev_mode/)
  expect(printer.gcode).toEqual([])
})

test('a heat target above the max_temp in the printer config is refused and never sent', async ({ page, open }) => {
  const printer = await usePrinter(page, heated({ extruder: { max_temp: 300 }, heater_bed: { max_temp: 110 } }), STILL)
  await servePanel(page, STUB_HEAT)
  await open('/')
  await ready(page)
  await clickScreen(page)
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  await expect.poll(() => stubResults(page).then(rs => rs.length)).toBe(4)
  const byId = Object.fromEntries((await stubResults(page)).map(r => [r.id, r]))
  expect(byId[20]).toMatchObject({ ok: false, error: { message: 'That is hotter than this heater goes.' } })
  expect(byId[21].ok).toBe(true)
  expect(byId[22]).toMatchObject({ ok: false, error: { message: 'That is hotter than this heater goes.' } })
  expect(byId[23].ok).toBe(true)
  await expect(page.getByTestId('m1-screen-refused')).toContainText('hotter than this heater goes')
  // At or below the limit went out, as Control's own heater command; above it, nothing.
  expect(printer.gcode.filter(l => l.includes('SET_HEATER_TEMPERATURE')).sort()).toEqual([
    'SET_HEATER_TEMPERATURE HEATER=extruder TARGET=250',
    'SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=110'
  ])
})

test('with no max_temp known for a heater, the screen cannot heat it', async ({ page, open }) => {
  const printer = await usePrinter(page, heated({ extruder: { max_temp: 'unknown' }, heater_bed: { max_temp: 'unknown' } }), STILL)
  await servePanel(page, STUB_HEAT)
  await open('/')
  await ready(page)
  await clickScreen(page)
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  await expect.poll(() => stubResults(page).then(rs => rs.length)).toBe(4)
  const results = await stubResults(page)
  for (const r of results) expect(r).toMatchObject({ ok: false, error: { message: 'This printer has not said how hot that heater may go.' } })
  expect(printer.gcode.some(l => l.includes('SET_HEATER_TEMPERATURE'))).toBe(false)
})
