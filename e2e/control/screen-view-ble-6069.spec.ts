/**
 * KAN-6069 and KAN-6062: the Screen view over Bluetooth, and on a printer-served Control.
 *
 * Jack, 24 Nov (Sloe): the Screen view over Bluetooth loaded for ages, the radio link dropped and the screen went black.
 * The embed is 1.9 MB; the radio must never carry it. Over Bluetooth Control shows a kept copy, or says it needs a
 * network; after a reconnect the frame is made again so the embed says hello and gets a new port. The radio is faked at
 * its edge (e2e/fakes/managedBluetooth.ts); Control's own transport, loader and bridge do the rest.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'
import { MOCK_PORT } from '../ports'

test.use({ webgl: true })

const GPU = process.platform === 'win32'
// Only on a GPU host: an empty launchOptions override still puts the file in its own worker bucket (KAN-4847, KAN-5192).
if (GPU) test.use({ launchOptions: { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

const STUB = `<!doctype html><html><body>kept screen<script>
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data || e.data.type !== 'muon-panel-port') return
    const port = e.ports[0]
    port.onmessage = () => {}
    port.postMessage({ id: 1, kind: 'rpc', method: 'server.connection.identify', params: {} })
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: 1 }, '*')
</script></body></html>`

const hellos = (page: Page) => page.evaluate(() => (window as unknown as { hellos?: number }).hellos ?? 0)

async function openScreen (page: Page) {
  await expect(page.getByTestId('m1-parts')).toBeAttached()
  const chip = page.getByTestId('m1-part-screen')
  await chip.focus()
  await chip.press('Enter')
}

async function openOverBluetooth (page: Page, open: (path: string) => Promise<unknown>, options: { kept: boolean }) {
  await page.addInitScript(() => {
    ;(window as unknown as { hellos: number }).hellos = 0
    window.addEventListener('message', e => {
      if (e.data?.type === 'muon-panel-hello') (window as unknown as { hellos: number }).hellos++
    })
  })
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  printer.state.answers['printer.info'] = { state: 'ready', state_message: 'Printer is ready', hostname: 'm1' }
  const asked: string[] = []
  await page.route(url => url.pathname.startsWith('/panel/') || url.pathname === '/server/muon/panel/index.html', route => {
    asked.push(route.request().url())
    return route.fulfill({ status: 200, contentType: 'text/html', headers: { 'access-control-allow-origin': '*', etag: '"stub-1"' }, body: STUB })
  })
  await open('/')
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await page.evaluate(async port => {
    const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
    store.state.config.hostConfig.hosted = true
    const fixture = await import(/* @vite-ignore */ '../../../../e2e/fakes/managedBluetooth.ts')
    ;(window as any).managedBle = await fixture.managedBluetooth(`http://localhost:${port}`, { operator: true })
  }, MOCK_PORT)
  await expect.poll(() => page.evaluate(() => (window as any).managedBle.label())).toBe('Via Bluetooth')
  if (options.kept) {
    // The page was kept by an earlier open over another route: put the same copy where Control keeps it.
    await page.evaluate(async html => {
      const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
      const { cloudState } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'state.ts'].join('/'))
      const { defaultCopies } = await import(/* @vite-ignore */ ['', 'src', 'services', 'panel-embed', 'bundle.ts'].join('/'))
      const { sha256Hex } = await import(/* @vite-ignore */ ['', 'src', 'services', 'panel-embed', 'sha256.ts'].join('/'))
      await defaultCopies.keep(`${store.state.config.apiUrl ?? ''}|${cloudState.activePrinterId}`, { etag: '"stub-1"', html, sha256: sha256Hex(html) })
    }, STUB)
  }
  await openScreen(page)
  return { printer, asked }
}

test('over Bluetooth with no kept copy the screen says it needs a network, and the radio is asked for nothing', async ({ page, open }) => {
  test.slow()
  const { asked } = await openOverBluetooth(page, open, { kept: false })
  await expect(page.getByTestId('m1-screen-needs-network')).toHaveText('Screen view needs a network connection')
  await expect(page.getByTestId('m1-screen-loading')).toHaveCount(0)
  await expect(page.getByTestId('m1-screen-frame')).toHaveCount(0)
  expect(asked).toEqual([])
})

test('over Bluetooth a kept copy is shown, with no request for the page', async ({ page, open }) => {
  test.slow()
  const { asked } = await openOverBluetooth(page, open, { kept: true })
  await expect(page.getByTestId('m1-screen-frame')).toBeAttached()
  await expect(page.getByTestId('m1-screen-needs-network')).toHaveCount(0)
  await expect.poll(() => hellos(page), { timeout: 60_000 }).toBeGreaterThanOrEqual(1)
  expect(asked).toEqual([])
})

test('after a reconnect the hello and port handshake runs again', async ({ page, open }) => {
  test.slow()
  await openOverBluetooth(page, open, { kept: true })
  await expect.poll(() => hellos(page), { timeout: 60_000 }).toBe(1)
  // The socket comes back on a new connection, as after a Bluetooth reconnect.
  await page.evaluate(async () => {
    const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
    store.state.socket.connectionId = (store.state.socket.connectionId ?? 0) + 1000
  })
  await expect.poll(() => hellos(page), { timeout: 30_000 }).toBe(2)
  await expect(page.getByTestId('m1-screen-frame')).toBeAttached()
})

// KAN-6062: Control served by the printer asks its OWN origin for the screen first (whether that is the IP, muon3d.local
// or the secure name), and frames what it got from memory: nothing is framed from another origin.
test('Control served by the printer asks its own origin for the screen first', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  const asked: string[] = []
  await page.route('**/panel/index.html', route => {
    asked.push(route.request().url())
    return route.fulfill({ status: 200, contentType: 'text/html', headers: { 'access-control-allow-origin': '*' }, body: STUB })
  })
  await open('/')
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await openScreen(page)
  await expect(page.getByTestId('m1-screen-frame')).toBeAttached()
  const origin = new URL(page.url()).origin
  expect(new URL(asked[0]).origin).toBe(origin)
  expect(asked.every(u => !u.includes('muonlan.net'))).toBe(true)
  await expect(page.getByTestId('m1-screen-frame')).toHaveAttribute('sandbox', 'allow-scripts')
  await expect(page.getByTestId('m1-screen-frame')).not.toHaveAttribute('src', /.+/)
})
