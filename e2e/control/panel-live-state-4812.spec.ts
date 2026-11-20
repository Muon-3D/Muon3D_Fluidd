/**
 * KAN-4812 part 3: the printer's screen in Control follows the real panel, and Control's navigation reaches it.
 *
 * Jack, 19 Nov: what happens on the panel shows in Control, and what Control does shows on the panel. The printer
 * publishes one panel state (GET /server/muon/panel/state and the websocket's notify_muon_panel_state) and takes
 * POST /server/muon/panel/navigate. Here a fake printer state machine plays that; a stub page plays MuonUI's embed
 * (it is not in this repo). The stub speaks protocol version 2 and records every message the port delivers.
 *
 * - A change on the "panel" reaches the embed, with no polling while the websocket works.
 * - The embed's navigate reaches the fake with the seq Control last saw; the fake's echo comes back.
 * - A stale seq (409) re-syncs; a busy panel (423) says so in words; no endpoint says "Live screen needs a printer update."
 * - Negative control: an embed that said version 1 gets no panel messages.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

test.use({ webgl: true })

const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

const stub = (version: number) => `<!doctype html><html><body><script>
  window.results = []
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !e.data) return
    if (e.data.type === 'muon-panel-port') {
      const port = e.ports[0]
      window.port = port
      port.onmessage = m => { window.results.push(m.data); window.parent.postMessage({ type: 'stub-results', results: window.results }, '*') }
    } else if (e.data.type === 'stub-do' && window.port) window.port.postMessage(e.data.msg)
  })
  window.parent.postMessage({ type: 'muon-panel-hello', version: ${version} }, '*')
</script></body></html>`

type Panel = { seq: number, screen: string, params: Record<string, unknown>, modal: { id: string, step?: number } | null, busy: boolean, updated_at: number }
type Seen = { id?: number, ok?: boolean, error?: { message: string, status?: number }, result?: { seq: number | null }, kind?: string, supported?: boolean, state?: Panel | null }

/** The printer's panel as a state machine: what it is on, who asked it to move, and how often it was read. */
async function fakePanel (page: Page, printer: PrinterHandle, options: { supported?: boolean } = {}) {
  const supported = options.supported ?? true
  const f = {
    state: { seq: 1, screen: 'home', params: {}, modal: null, busy: false, updated_at: 1 } as Panel,
    gets: 0,
    posts: [] as Array<Record<string, unknown>>,
    /** The panel changed on the printer (someone touched it); `push` false: the websocket has not told Control yet. */
    set (patch: Partial<Panel>, push = true) {
      f.state = { ...f.state, ...patch, seq: f.state.seq + 1, updated_at: f.state.updated_at + 1 }
      if (push) printer.notify('notify_muon_panel_state', f.state)
    }
  }
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  await page.route(url => url.pathname === '/server/muon/panel/state' || url.pathname === '/server/muon/panel/navigate', async route => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const path = new URL(req.url()).pathname
    if (!supported) return route.fulfill({ status: 404, headers: cors, json: { error: { message: 'Not Found' } } })
    if (path.endsWith('/state')) {
      f.gets++
      return route.fulfill({ status: 200, headers: cors, json: { result: f.state } })
    }
    const body = req.postDataJSON() as { screen: string, params?: Record<string, unknown>, if_seq?: number }
    f.posts.push(body)
    if (body.if_seq !== undefined && body.if_seq !== f.state.seq) return route.fulfill({ status: 409, headers: cors, json: { reason: 'stale_seq', seq: f.state.seq } })
    if (body.screen === 'access') return route.fulfill({ status: 403, headers: cors, json: { reason: 'owner_only' } })
    if (f.state.modal) return route.fulfill({ status: 423, headers: cors, json: { reason: 'modal' } })
    f.set({ screen: body.screen, params: body.params ?? {} })
    return route.fulfill({ status: 200, headers: cors, json: { result: { seq: f.state.seq } } })
  })
  return f
}

async function openScreen (page: Page, open: (path: string) => Promise<unknown>, embedVersion: number, options: { supported?: boolean } = {}) {
  await page.addInitScript(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === 'stub-results') (window as unknown as { stubResults: unknown }).stubResults = e.data.results
    })
  })
  const printer = await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  printer.state.answers['printer.info'] = { state: 'ready', state_message: 'Printer is ready', hostname: 'm1' }
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: stub(embedVersion) }))
  const panel = await fakePanel(page, printer, options)
  await open('/')
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(page.getByTestId('m1-parts')).toBeAttached()
  const chip = page.getByTestId('m1-part-screen')
  await chip.focus()
  await chip.press('Enter')
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  return { printer, panel }
}

const seen = (page: Page) => page.evaluate(() => (window as unknown as { stubResults?: Seen[] }).stubResults ?? [])
const states = async (page: Page) => (await seen(page)).filter(m => m.kind === 'panel-state')
const lastState = async (page: Page) => (await states(page)).at(-1)

/** The embed asks to navigate, as the stub does for MuonUI. */
const navigate = (page: Page, id: number, screen: string) => page.evaluate(([i, s]) => {
  const frame = document.querySelector('[data-tid="m1-screen-frame"]') as HTMLIFrameElement
  frame.contentWindow?.postMessage({ type: 'stub-do', msg: { id: i, kind: 'navigate', screen: s } }, '*')
}, [id, screen] as const)

const answer = async (page: Page, id: number) => (await seen(page)).find(m => m.id === id)

test('the panel moves on the printer, the embed gets it; the embed navigates, the printer follows; nothing polls', async ({ page, open }) => {
  test.slow()
  const { panel } = await openScreen(page, open, 2)
  await expect.poll(async () => (await lastState(page))?.state?.screen, { timeout: 60_000 }).toBe('home')
  expect((await lastState(page))?.supported).toBe(true)

  panel.set({ screen: 'move', params: { tab: 'jog' } })
  await expect.poll(async () => (await lastState(page))?.state).toMatchObject({ screen: 'move', params: { tab: 'jog' }, seq: 2 })

  await navigate(page, 41, 'heat')
  await expect.poll(() => answer(page, 41)).toMatchObject({ ok: true })
  expect(panel.posts).toEqual([{ screen: 'heat', if_seq: 2 }])
  // The printer's echo is what the embed shows.
  await expect.poll(async () => (await lastState(page))?.state).toMatchObject({ screen: 'heat', seq: 3 })

  // The websocket works, so the state was read once (on opening) and never polled.
  await page.waitForTimeout(5000)
  expect(panel.gets).toBe(1)
})

test('a stale seq re-syncs the embed; a busy panel says why in words', async ({ page, open }) => {
  test.slow()
  const { panel } = await openScreen(page, open, 2)
  await expect.poll(async () => (await lastState(page))?.state?.seq, { timeout: 60_000 }).toBe(1)

  // Someone touched the panel and the websocket has not told Control yet: Control's seq is stale.
  panel.set({ screen: 'files' }, false)
  await navigate(page, 51, 'heat')
  await expect.poll(() => answer(page, 51)).toMatchObject({ ok: false, error: { status: 409 } })
  await expect.poll(async () => (await lastState(page))?.state).toMatchObject({ screen: 'files', seq: 2 })

  panel.set({ modal: { id: 'filament-load', step: 2 } })
  await navigate(page, 52, 'heat')
  await expect.poll(() => answer(page, 52)).toMatchObject({ ok: false, error: { status: 423, message: "The printer's screen is busy with filament load" } })
  expect(panel.state.screen).toBe('files')

  // An owner-only screen is refused in words, and Control does not re-read.
  const reads = panel.gets
  await navigate(page, 53, 'access')
  await expect.poll(() => answer(page, 53)).toMatchObject({ ok: false, error: { status: 403, message: "Only the printer's owner can open that screen" } })
  expect(panel.gets).toBe(reads)
})

test('a printer without the panel endpoint keeps today\'s screen and says "Live screen needs a printer update."', async ({ page, open }) => {
  test.slow()
  const { panel } = await openScreen(page, open, 2, { supported: false })
  await expect(page.getByTestId('m1-screen-live-note')).toHaveText('Live screen needs a printer update.', { timeout: 60_000 })
  await expect(page.getByTestId('m1-screen-frame')).toBeAttached()
  expect(await lastState(page)).toMatchObject({ supported: false, state: null })
  await navigate(page, 61, 'heat')
  await expect.poll(() => answer(page, 61)).toMatchObject({ ok: false, error: { status: 404, message: 'Live screen needs a printer update.' } })
  expect(panel.posts).toEqual([])
})

// Negative control: an embed that only knows version 1 is still served, and is sent nothing it does not know.
test('an older (version 1) embed still loads and gets no panel messages', async ({ page, open }) => {
  test.slow()
  const { panel } = await openScreen(page, open, 1)
  await expect(page.getByTestId('m1-screen-frame')).toBeAttached()
  panel.set({ screen: 'move' })
  await page.waitForTimeout(3000)
  expect(await states(page)).toEqual([])
  expect(panel.gets).toBe(0)
  await expect(page.getByTestId('m1-screen-live-note')).toHaveCount(0)
})
