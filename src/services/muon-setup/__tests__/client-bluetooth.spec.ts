import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSetupClient, POLL_INTERVAL_MS, WRITE_TIMEOUT_MS } from '../client'
import { resetSetupState, setupState } from '../state'
import type { SetupState } from '../types'
import newState from './fixtures/state.01-new.json'

const copy = (fixture: unknown): SetupState => JSON.parse(JSON.stringify(fixture))

/** The Iroh session: every request by path, as `IrohPrinter.fetch` takes it. */
function transport (answer: (path: string, init?: RequestInit) => Promise<Response> | Response) {
  const calls: Array<{ path: string, init?: RequestInit }> = []
  return {
    calls,
    fetch: vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({ path, init })
      return answer(path, init)
    })
  }
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

beforeEach(() => {
  resetSetupState()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the setup client over Bluetooth (ADR 0032 D7)', () => {
  it('opens no websocket, and reads the state by path through the session every 2 s', async () => {
    const WebSocketImpl = vi.fn()
    const t = transport(() => json({ result: copy(newState) }))
    const client = createSetupClient({ transport: t, overBluetooth: true, WebSocketImpl: WebSocketImpl as unknown as typeof WebSocket })
    client.start()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2 + 10)
    client.stop()
    expect(WebSocketImpl).not.toHaveBeenCalled()
    expect(t.calls.length).toBeGreaterThanOrEqual(3)
    expect(new Set(t.calls.map(c => c.path))).toEqual(new Set(['/server/muon/setup']))
    expect(setupState.state?.rev).toBe(newState.rev)
  })

  it('claims the driver as web: Moonraker stores a Bluetooth caller as bluetooth', async () => {
    const t = transport(() => json({ result: { ok: true, error: null, state: copy(newState) } }))
    const client = createSetupClient({ transport: t, overBluetooth: true })
    await client.claimDriver()
    const body = JSON.parse(String(t.calls[0].init?.body))
    expect(t.calls[0].path).toBe('/server/muon/setup/driver')
    expect(body.kind).toBe('web')
    expect(t.calls[0].init?.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it("posts the owner's clock without a rev", async () => {
    const t = transport(() => json({ result: { ok: true, error: null, state: null } }))
    const client = createSetupClient({ transport: t, overBluetooth: true })
    await client.postClock()
    const body = JSON.parse(String(t.calls[0].init?.body))
    expect(t.calls[0].path).toBe('/server/muon/setup/clock')
    expect(typeof body.epoch_ms).toBe('number')
    expect(body).not.toHaveProperty('rev')
  })

  it('abandons a request the session never answers, as a lost write', async () => {
    const t = transport(() => new Promise<Response>(() => {}))
    const client = createSetupClient({ transport: t, overBluetooth: true })
    const posted = client.post('language', { code: 'en' })
    await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS + 10)
    expect(await posted).toBeNull()
    expect(setupState.lostWrite).toEqual({ step: 'language', failed: false })
  })
})
