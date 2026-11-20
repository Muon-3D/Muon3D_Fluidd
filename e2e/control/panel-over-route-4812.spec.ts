/**
 * KAN-4812 (and KAN-3635): the printer's screen in Control works over any route, hosted or not.
 *
 * Jack, 19 Nov: "controlling the printer's screen only works when connected locally ... every action has a toast
 * saying 'do this on the printer itself' and nothing actually moves on the printer".
 *
 * Here Control is the hosted page (control.muon3d.com serves no /panel/) and reaches the printer over Bluetooth as an
 * Operator (an Open printer's guest). The radio is faked at its edge (e2e/fakes/managedBluetooth.ts); Control's own
 * transport, loader and bridge do the rest. A stub page plays MuonUI's embed build: it does the real handshake, jogs,
 * sends a raw move, and tries a developer-mode release.
 *
 * - The screen is fetched from the printer over the route and framed, with no "Connect locally" detour.
 * - A jog from the screen reaches the printer, as Control's own jog.
 * - An owner-only action is refused in plain words, and never reaches the printer.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'
import { MOCK_PORT } from '../ports'

test.use({ webgl: true })

const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

const STUB = `<!doctype html><html><body><script>
  window.results = []
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data || e.data.type !== 'muon-panel-port') return
    const port = e.ports[0]
    port.onmessage = m => { window.results.push(m.data); window.parent.postMessage({ type: 'stub-results', results: window.results }, '*') }
    port.postMessage({ id: 1, kind: 'verb', verb: 'jog', axis: 'X', by: 10 })
    port.postMessage({ id: 2, kind: 'rpc', method: 'printer.gcode.script', params: { script: 'M106 S128' } })
    port.postMessage({ id: 3, kind: 'rpc', method: 'printer.gcode.script', params: { script: 'G1 X100 Y10' } })
    port.postMessage({ id: 4, kind: 'aux', method: 'POST', path: '/dev_mode/enter', body: { confirm: true } })
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: 1 }, '*')
</script></body></html>`

type StubResult = { id: number, ok: boolean, error?: { message: string } }

const stubResults = (page: Page) => page.evaluate(() => (window as unknown as { stubResults?: StubResult[] }).stubResults ?? [])

async function openHostedOverBluetooth (page: Page, open: (path: string) => Promise<unknown>, stubBody: string | null) {
  await page.addInitScript(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === 'stub-results') (window as unknown as { stubResults: unknown }).stubResults = e.data.results
    })
  })
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  printer.state.answers['printer.info'] = { state: 'ready', state_message: 'Printer is ready', hostname: 'm1' }
  const asked: string[] = []
  // The page's own origin serves no /panel/ (hosted Control); only the printer, over its route (the Moonraker endpoint, as the gateway reaches it), has it.
  await page.route(url => url.pathname.startsWith('/panel/') && url.port !== String(MOCK_PORT), route => { asked.push(route.request().url()); return route.fulfill({ status: 404, body: '' }) })
  await page.route(url => (url.pathname.startsWith('/panel/') || url.pathname === '/server/muon/panel/index.html') && url.port === String(MOCK_PORT), route => stubBody === null
    ? route.fulfill({ status: 404, body: '' })
    : route.fulfill({ status: 200, contentType: 'text/html', headers: { 'access-control-allow-origin': '*', etag: '"stub-1"' }, body: stubBody }))
  await open('/')
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await page.evaluate(async port => {
    const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
    store.state.config.hostConfig.hosted = true
    const fixture = await import(/* @vite-ignore */ '../../../../e2e/fakes/managedBluetooth.ts')
    ;(window as any).managedBle = await fixture.managedBluetooth(`http://localhost:${port}`, { operator: true })
  }, MOCK_PORT)
  await expect.poll(() => page.evaluate(() => (window as any).managedBle.label())).toBe('Via Bluetooth')
  await expect(page.getByTestId('m1-parts')).toBeAttached()
  const chip = page.getByTestId('m1-part-screen')
  await chip.focus()
  await chip.press('Enter')
  return { printer, asked }
}

test('hosted Control over Bluetooth: the screen loads from the printer, a jog moves it, an owner-only action is refused in plain words', async ({ page, open }) => {
  test.slow()
  const { printer, asked } = await openHostedOverBluetooth(page, open, STUB)
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  // Framed from what the printer sent over its route: no Connect locally, no "needs an update".
  await expect(page.getByTestId('m1-screen-frame')).toBeAttached()
  await expect(page.getByTestId('m1-screen-frame')).toHaveAttribute('sandbox', 'allow-scripts')
  await expect(page.getByTestId('m1-screen-local')).toHaveCount(0)
  await expect(page.getByTestId('m1-screen-hosted')).toHaveCount(0)
  await expect(page.getByTestId('m1-screen-empty')).toHaveCount(0)
  expect(asked).toEqual([])

  await expect.poll(() => stubResults(page).then(rs => rs.map(r => r.id).sort()), { timeout: 60_000 }).toEqual([1, 2, 3, 4])
  const byId = Object.fromEntries((await stubResults(page)).map(r => [r.id, r]))
  // The jog and a plain G-code line went to the printer; the raw move did not (moves are the jog verb, through the no-go planner).
  expect(byId[1].ok).toBe(true)
  expect(byId[2].ok).toBe(true)
  expect(byId[3]).toMatchObject({ ok: false, error: { message: "Control doesn't run that G-code from the screen. Use the screen's own buttons." } })
  await expect.poll(() => printer.gcode.flatMap(g => g.split('\n')).filter(l => l.startsWith('G1 ') || l.startsWith('M106'))).toEqual(['G1 X10 F7800', 'M106 S128'])
  // An owner-only action is refused, named in plain words, and never sent.
  expect(byId[4]).toMatchObject({ ok: false, error: { message: 'Do this on the printer itself' } })
  await expect(page.getByTestId('m1-screen-refused')).toContainText('Developer mode is done on the printer itself')
  await expect(page.getByTestId('m1-screen-refused')).not.toContainText('dev_mode')
  expect(JSON.stringify([printer.calls, printer.gcode])).not.toMatch(/dev_mode/)
  expect(await page.evaluate(() => (window as any).managedBle.counts.aux)).toBe(0)
})

test('a printer with no screen build says so plainly, over the same route', async ({ page, open }) => {
  const { printer } = await openHostedOverBluetooth(page, open, null)
  await expect(page.getByTestId('m1-screen-empty')).toHaveText('Your printer needs an update to show its screen here')
  await expect(page.getByTestId('m1-screen-frame')).toHaveCount(0)
  await expect(page.getByTestId('m1-screen-local')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})
