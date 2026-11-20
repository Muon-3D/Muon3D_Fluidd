import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PanelBridge, PANEL_POLL_MS, type BridgeHost } from '../bridge'
import { HELLO_TYPE, readNavigate, readPanelState } from '../protocol'

const state = (seq: number, screen = 'home', extra: Record<string, unknown> = {}) => ({ seq, screen, params: {}, modal: null, busy: false, updated_at: 1, ...extra })

describe('panel state over the bridge (KAN-4812)', () => {
  let bridge: PanelBridge | null = null
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    bridge?.dispose()
    bridge = null
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  function setup (host: Partial<BridgeHost> = {}, version = 2) {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    const full: BridgeHost = {
      rpc: vi.fn(async () => ({})),
      auxGet: vi.fn(async () => ({})),
      status: () => ({}),
      connectionId: () => 1,
      verb: () => '',
      panelGet: vi.fn(async () => ({ status: 200, body: { result: state(5, 'move') } })),
      panelPost: vi.fn(async () => ({ status: 200, body: { result: { seq: 6 } } })),
      ...host
    }
    const onSupport = vi.fn()
    bridge = new PanelBridge(frame, full, { onSupport })
    const out: unknown[] = []
    window.dispatchEvent(new MessageEvent('message', { data: { type: HELLO_TYPE, version }, origin: 'null', source: frame.contentWindow as Window }))
    ;(bridge as unknown as { port: MessagePort }).port.postMessage = (m: unknown) => { out.push(m) }
    return { host: full, out, onSupport }
  }

  it('reads the state when a version 2 embed arrives and forwards it, then each notification once', async () => {
    const { host, out } = setup()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.panelGet).toHaveBeenCalledTimes(1)
    expect(out).toEqual([{ kind: 'panel-state', supported: true, state: state(5, 'move') }])
    bridge!.panelNotify(state(6, 'heat'))
    bridge!.panelNotify(state(6, 'heat'))
    bridge!.panelNotify({ seq: 'x', screen: '../etc' })
    expect(out.slice(1)).toEqual([{ kind: 'panel-state', supported: true, state: state(6, 'heat') }])
    expect(host.panelGet).toHaveBeenCalledTimes(1)
  })

  it('sends a version 1 embed nothing new, and still takes its hello', async () => {
    const { out, host } = setup({}, 1)
    await vi.advanceTimersByTimeAsync(0)
    bridge!.panelNotify(state(9))
    expect(out).toEqual([])
    expect(host.panelGet).not.toHaveBeenCalled()
  })

  it('navigates with the last seq, and answers with the printer\'s seq', async () => {
    const { host, out } = setup()
    await vi.advanceTimersByTimeAsync(0)
    await bridge!.handle({ id: 1, kind: 'navigate', screen: 'heat', params: { tab: 'bed' } })
    expect(host.panelPost).toHaveBeenCalledWith({ screen: 'heat', params: { tab: 'bed' }, if_seq: 5 })
    expect(out.at(-1)).toEqual({ id: 1, ok: true, result: { seq: 6 } })
  })

  it('a stale seq (409) re-reads the state, pushes it, and tells the embed', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce({ status: 200, body: state(5, 'move') })
      .mockResolvedValueOnce({ status: 200, body: state(8, 'files') })
    const { out } = setup({ panelGet: get, panelPost: vi.fn(async () => ({ status: 409, body: { reason: 'stale_seq', seq: 8 } })) })
    await vi.advanceTimersByTimeAsync(0)
    await bridge!.handle({ id: 2, kind: 'navigate', screen: 'heat' })
    expect(get).toHaveBeenCalledTimes(2)
    expect(out.slice(-2)).toEqual([
      { kind: 'panel-state', supported: true, state: state(8, 'files') },
      { id: 2, ok: false, error: { message: "The printer's screen has moved on.", status: 409 } }
    ])
  })

  it('a busy panel (423) says why in plain words, naming the modal', async () => {
    const get = vi.fn().mockResolvedValue({ status: 200, body: state(5, 'move', { modal: { id: 'filament-load', step: 2 } }) })
    const { out } = setup({ panelGet: get, panelPost: vi.fn(async () => ({ status: 423, body: { reason: 'modal' } })) })
    await vi.advanceTimersByTimeAsync(0)
    await bridge!.handle({ id: 3, kind: 'navigate', screen: 'heat' })
    expect(out.at(-1)).toEqual({ id: 3, ok: false, error: { message: "The printer's screen is busy with filament load", status: 423 } })
  })

  it('an owner-only screen (403) says so in words, and does not re-sync', async () => {
    const { out, host } = setup({ panelPost: vi.fn(async () => ({ status: 403, body: { reason: 'owner_only' } })) })
    await vi.advanceTimersByTimeAsync(0)
    await bridge!.handle({ id: 8, kind: 'navigate', screen: 'access' })
    expect(host.panelGet).toHaveBeenCalledTimes(1)
    expect(out.at(-1)).toEqual({ id: 8, ok: false, error: { message: "Only the printer's owner can open that screen", status: 403 } })
  })

  it('a panel that does not answer (504) says so', async () => {
    const { out } = setup({ panelPost: vi.fn(async () => ({ status: 504, body: {} })) })
    await bridge!.handle({ id: 4, kind: 'navigate', screen: 'heat' })
    expect(out.at(-1)).toMatchObject({ id: 4, ok: false, error: { message: "The printer's screen isn't responding", status: 504 } })
  })

  it('a printer without the endpoint: unsupported once, no navigate sent, the embed told', async () => {
    const post = vi.fn()
    const { out, onSupport } = setup({ panelGet: vi.fn(async () => ({ status: 404, body: {} })), panelPost: post })
    await vi.advanceTimersByTimeAsync(0)
    expect(onSupport).toHaveBeenCalledWith(false)
    expect(out).toEqual([{ kind: 'panel-state', supported: false, state: null }])
    await bridge!.handle({ id: 5, kind: 'navigate', screen: 'heat' })
    expect(post).not.toHaveBeenCalled()
    expect(out.at(-1)).toMatchObject({ id: 5, ok: false, error: { message: 'Live screen needs a printer update.', status: 404 } })
  })

  it('refuses a malformed navigate without sending it', async () => {
    const { host, out } = setup()
    for (const bad of [{ screen: '../x' }, { screen: 5 }, { screen: 'a', params: [1] }, { screen: 'a', params: { big: 'x'.repeat(2000) } }]) {
      await bridge!.handle({ id: 7, kind: 'navigate', ...bad })
    }
    expect(host.panelPost).not.toHaveBeenCalled()
    expect(out.filter(m => 'id' in (m as object)).every(m => (m as { ok?: boolean }).ok === false)).toBe(true)
  })

  it('polls every 2 s only while told the websocket is down', async () => {
    const { host } = setup()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(PANEL_POLL_MS * 3)
    expect(host.panelGet).toHaveBeenCalledTimes(1)
    bridge!.setPolling(true)
    await vi.advanceTimersByTimeAsync(PANEL_POLL_MS * 3)
    expect(host.panelGet).toHaveBeenCalledTimes(4)
    bridge!.setPolling(false)
    await vi.advanceTimersByTimeAsync(PANEL_POLL_MS * 3)
    expect(host.panelGet).toHaveBeenCalledTimes(4)
  })

  it('rebuilds state and navigate from known fields only', () => {
    expect(readPanelState({ ...state(1), extra: 'x', modal: { id: 'm', step: 'no', x: 1 } })).toEqual(state(1, 'home', { modal: { id: 'm' } }))
    expect(readPanelState(null)).toBeNull()
    expect(readNavigate({ screen: 'move', params: { a: 1 }, kind: 'navigate', evil: 1 })).toEqual({ screen: 'move', params: { a: 1 } })
  })
})
