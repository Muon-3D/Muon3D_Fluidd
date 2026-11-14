/**
 * A fake muon_setup for `/setup` tests: the printer's setup state machine,
 * behind `page.route`, on the page's own origin (the hotspot page talks only
 * to the printer that served it). Starts from the new-printer fixture the unit
 * tests use; every POST is recorded, and answers with the state it made.
 *
 *   const printer = await setupPrinter(page)
 *   ...
 *   expect(printer.posts.map(p => p.path)).toContain('network')
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page, Route } from '@playwright/test'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../src/services/muon-setup/__tests__/fixtures')
const fixture = (name: string) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'))

/** The password the fake network refuses. */
export const WRONG_PASSWORD = 'not-the-password'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type State = any

export interface SetupPrinter {
  state: State;
  posts: Array<{ path: string, body: Record<string, unknown> }>;
  networks: State;
  /** The printer's screen finishes what is left: the first calibration. */
  finishAtPanel (): void;
}

const ORDER = ['language', 'network', 'name', 'update', 'remote', 'ready']

export async function setupPrinter (page: Page, opts: { networks?: State } = {}): Promise<SetupPrinter> {
  const state: State = fixture('state.01-new.json')
  const printer: SetupPrinter = {
    state,
    posts: [],
    networks: opts.networks ?? fixture('networks.eu-unit.json'),
    finishAtPanel () {
      for (const item of state.steps.ready.items) item.status = 'done'
      state.steps.ready.status = 'done'
      state.cursor = 'finish'
      state.state = 'complete'
      state.rev++
    }
  }
  const options = fixture('options.picker-eu.json')

  const advance = () => {
    state.cursor = ORDER.find(step => state.steps[step].status === 'pending') ?? 'finish'
  }
  const ok = (route: Route) => route.fulfill({ json: { result: { ok: true, error: null, state } } })

  await page.route('**/websocket*', route => route.abort())
  await page.route('**/access/oneshot_token', route => route.fulfill({ status: 404, json: {} }))
  await page.route('**/server/muon/setup**', async route => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace(/^\/server\/muon\/setup\/?/, '')
    if (route.request().method() === 'GET') {
      if (path === '') return route.fulfill({ json: { result: state } })
      if (path === 'options') return route.fulfill({ json: { result: options } })
      if (path === 'networks') return route.fulfill({ json: { result: printer.networks } })
      return route.fulfill({ status: 404, json: { error: { message: 'Not found' } } })
    }
    const body = route.request().postDataJSON() ?? {}
    printer.posts.push({ path, body })
    if (path !== 'clock') state.rev++
    switch (path) {
      case 'clock':
        break
      case 'language':
        state.steps.language = { status: 'done', value: body.code, source: 'phone' }
        advance()
        break
      case 'driver':
        state.driver = { kind: body.kind, client_id: body.client_id, since: 1, renewed: 1, lapsed: false }
        break
      case 'network': {
        const net = state.steps.network
        if (body.psk === WRONG_PASSWORD) {
          Object.assign(net, { status: 'pending', error: { code: 'wrong_password', at_phase: 'authenticating', detail: { ssid: body.ssid } } })
        } else {
          Object.assign(net, {
            status: 'done',
            kind: 'wifi',
            ssid: body.ssid,
            addresses: ['192.168.1.37'],
            hostname_local: 'Muon-walnut-8987.local',
            internet: true,
            error: null,
            region_confirmed: true
          })
          state.clock.synced = true
          // Joining checks for updates (02 §5.7): this one has one waiting.
          state.steps.update.available = '1.4.0'
          advance()
        }
        break
      }
      case 'skip':
        state.steps[body.step].status = 'skipped'
        advance()
        break
      case 'goto':
        state.cursor = body.step
        break
      case 'name':
        state.steps.name = { ...state.steps.name, status: 'done', value: body.name }
        state.printer.name = body.name
        advance()
        break
      case 'update':
        state.steps.update.status = body.action === 'later' ? 'skipped' : 'done'
        advance()
        break
      case 'remote':
        if (body.mode === 'cloud') {
          state.steps.remote = {
            status: 'pending',
            mode: 'cloud',
            error: null,
            link: { phase: 'code', code: '482913', expires_at: 1790251620, url: 'https://control.muon3d.com/link?code=482913' }
          }
        } else {
          state.steps.remote = { status: body.mode === 'local' ? 'done' : 'skipped', mode: body.mode, link: null, error: null }
          advance()
        }
        break
      case 'remote/cancel':
        state.steps.remote = { status: 'pending', mode: null, link: null, error: null }
        break
      case 'ready': {
        const item = state.steps.ready.items.find((i: State) => i.id === body.item)
        if (item && body.action === 'skip') item.status = 'skipped'
        break
      }
    }
    return ok(route)
  })
  return printer
}
