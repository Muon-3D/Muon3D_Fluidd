import { afterEach, describe, expect, it, vi } from 'vitest'
import { PanelBridge, type BridgeHost } from '../bridge'
import { auxVerdict, readVerb, rpcVerdict, ON_PRINTER } from '../allow'
import { HELLO_TYPE, PORT_TYPE, PROTOCOL_VERSION, isBridgeInput } from '../protocol'

describe('allowlist', () => {
  it('forwards reads and the print controls Control already has', () => {
    for (const m of ['printer.info', 'printer.objects.query', 'printer.print.pause', 'printer.emergency_stop']) expect(rpcVerdict(m)).toBe('forward')
  })

  it('answers subscribe and identify itself', () => {
    expect(rpcVerdict('printer.objects.subscribe')).toBe('local')
    expect(rpcVerdict('server.connection.identify')).toBe('local')
  })

  it('refuses setup, access, power and anything unknown', () => {
    for (const m of ['printer.gcode.script', 'server.muon.setup.network', 'server.muon.access.answer', 'server.muon.protection', 'machine.reboot', 'machine.services.restart', 'machine.update.full', 'server.aux.proxy', 'printer.restart', '', 42, undefined]) {
      expect(rpcVerdict(m)).toBe('refuse')
    }
  })

  it('forwards listed Aux reads only, never a write, never out of /server/aux', () => {
    expect(auxVerdict('GET', '/wifi/current')).toBe('forward')
    expect(auxVerdict('GET', '/update/status?x=1')).toBe('forward')
    const refused: Array<[string, string]> = [
      ['POST', '/wifi/ap/down'], ['POST', '/wifi/ap/up'], ['POST', '/wifi/connect'], ['POST', '/update/install'],
      ['GET', '/wifi/ap/show'], ['GET', '/wifi/show'], ['GET', '/consent/pending'], ['GET', '/wifi/current#x'], ['GET', '/dev_mode'], ['POST', '/display/brightness'],
      ['GET', '/wifi/current/../../dev_mode'], ['GET', '/wifi%2Fcurrent'], ['GET', '//wifi/current'], ['GET', 'wifi/current']
    ]
    for (const [m, p] of refused) expect(auxVerdict(m, p)).toBe('refuse')
  })
})

describe('PanelBridge', () => {
  let bridge: PanelBridge | null = null
  afterEach(() => {
    bridge?.dispose()
    bridge = null
    document.body.innerHTML = ''
  })

  function setup (overrides: Partial<BridgeHost> = {}) {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    const host: BridgeHost = {
      rpc: vi.fn(async () => ({ ok: 1 })),
      auxGet: vi.fn(async () => ({ ssid: 'home' })),
      status: () => ({ extruder: { temperature: 210 }, heater_bed: { temperature: 60 } }),
      connectionId: () => 7,
      verb: vi.fn(() => ''),
      ...overrides
    }
    const onRefused = vi.fn()
    bridge = new PanelBridge(frame, host, { onRefused })
    return { frame, host, onRefused }
  }

  /** The sandboxed frame's hello: its origin is opaque, "null". */
  function hello (frame: HTMLIFrameElement, origin = 'null', source: unknown = frame.contentWindow) {
    window.dispatchEvent(new MessageEvent('message', { data: { type: HELLO_TYPE, version: PROTOCOL_VERSION }, origin, source: source as Window }))
  }

  /** Every reply the bridge sends to the embed. */
  function replies (): unknown[] {
    const out: unknown[] = []
    ;(bridge as unknown as { port: MessagePort }).port.postMessage = (m: unknown) => { out.push(m) }
    return out
  }

  it('hands a port only to its own sandboxed frame, and a new one when that frame reloads', () => {
    const { frame } = setup()
    const post = vi.spyOn(frame.contentWindow as Window, 'postMessage')
    hello(frame, 'https://evil.example')
    hello(frame, 'http://localhost')
    hello(frame, 'null', window)
    expect(post).not.toHaveBeenCalled()
    hello(frame)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toEqual({ type: PORT_TYPE })
    const first = (bridge as unknown as { port: MessagePort }).port
    const closed = vi.spyOn(first, 'close')
    hello(frame)
    expect(post).toHaveBeenCalledTimes(2)
    expect(closed).toHaveBeenCalled()
    expect((bridge as unknown as { port: MessagePort }).port).not.toBe(first)
  })

  it("forwards an allowed call on Control's connection and refuses the rest without sending", async () => {
    const { frame, host, onRefused } = setup()
    hello(frame)
    const out = replies()
    await bridge!.handle({ id: 1, kind: 'rpc', method: 'printer.info' })
    await bridge!.handle({ id: 2, kind: 'rpc', method: 'machine.reboot' })
    await bridge!.handle({ id: 3, kind: 'aux', method: 'POST', path: '/wifi/ap/down' })
    await bridge!.handle({ id: 4, kind: 'aux', method: 'GET', path: '/wifi/current' })
    expect(host.rpc).toHaveBeenCalledTimes(1)
    expect(host.rpc).toHaveBeenCalledWith('printer.info', undefined)
    expect(host.auxGet).toHaveBeenCalledWith('/wifi/current')
    expect(onRefused).toHaveBeenCalledTimes(2)
    expect(out).toEqual([
      { id: 1, ok: true, result: { ok: 1 } },
      { id: 2, ok: false, error: { message: ON_PRINTER, code: -32601, status: 403 } },
      { id: 3, ok: false, error: { message: ON_PRINTER, code: -32601, status: 403 } },
      { id: 4, ok: true, result: { ssid: 'home' } }
    ])
  })

  it("answers subscribe from Control's state and forwards only those objects' updates", async () => {
    const { frame, host } = setup()
    hello(frame)
    const out = replies() as Array<{ result?: { status: unknown } }>
    await bridge!.handle({ id: 5, kind: 'rpc', method: 'printer.objects.subscribe', params: { objects: { extruder: null } } })
    expect(host.rpc).not.toHaveBeenCalled()
    expect(out[0].result?.status).toEqual({ extruder: { temperature: 210 } })
    bridge!.notify('notify_status_update', [{ extruder: { temperature: 211 }, heater_bed: { temperature: 61 } }, 12])
    bridge!.notify('notify_status_update', [{ heater_bed: { temperature: 62 } }, 13])
    bridge!.notify('notify_gcode_response', ['M117 secret'])
    bridge!.notify('notify_history_changed', [{}])
    expect(out.slice(1)).toEqual([{ kind: 'notify', method: 'notify_status_update', params: [{ extruder: { temperature: 211 } }, 12] }])
  })

  it('passes nothing on for a subscribe that names no objects, or names a prototype key', async () => {
    const { frame } = setup()
    hello(frame)
    const out = replies() as Array<{ result?: { status: unknown } }>
    await bridge!.handle({ id: 8, kind: 'rpc', method: 'printer.objects.subscribe', params: {} })
    await bridge!.handle({ id: 9, kind: 'rpc', method: 'printer.objects.subscribe', params: { objects: { constructor: null, toString: null } } })
    expect(out[0].result?.status).toEqual({})
    expect(out[1].result?.status).toEqual({})
  })

  it("identify gets Control's own connection id and is never sent", async () => {
    const { frame, host } = setup()
    hello(frame)
    const out = replies()
    await bridge!.handle({ id: 6, kind: 'rpc', method: 'server.connection.identify', params: { client_name: 'x', access_token: 'stolen' } })
    expect(host.rpc).not.toHaveBeenCalled()
    expect(out[0]).toEqual({ id: 6, ok: true, result: { connection_id: 7 } })
  })

  it('runs a checked verb on the host, and passes its refusal back', async () => {
    const { frame, host } = setup({ verb: vi.fn((v: { verb: string }) => (v.verb === 'heat' ? 'Not while the printer is busy.' : '')) })
    hello(frame)
    const out = replies()
    await bridge!.handle({ id: 10, kind: 'verb', verb: 'jog', axis: 'X', by: 10, script: 'G1 Z0' })
    await bridge!.handle({ id: 11, kind: 'verb', verb: 'heat', heater: 'extruder', target: 215 })
    await bridge!.handle({ id: 12, kind: 'verb', verb: 'gcode', script: 'SAVE_CONFIG' })
    expect(host.verb).toHaveBeenCalledTimes(2)
    expect(host.verb).toHaveBeenNthCalledWith(1, { verb: 'jog', axis: 'X', by: 10 })
    expect(host.rpc).not.toHaveBeenCalled()
    expect(out).toEqual([
      { id: 10, ok: true, result: null },
      { id: 11, ok: false, error: { message: 'Not while the printer is busy.', status: 409 } },
      { id: 12, ok: false, error: { message: ON_PRINTER, code: -32601, status: 403 } }
    ])
  })

  it("passes the model's knob to the screen as its knob, and nothing to the printer", () => {
    const { frame, host } = setup()
    // Before the hello there is no port: nothing goes anywhere.
    bridge!.knob({ press: true })
    hello(frame)
    const out = replies()
    bridge!.knob({ turn: 3 })
    bridge!.knob({ turn: -1 })
    bridge!.knob({ press: true })
    bridge!.knob({ turn: 0 })
    bridge!.knob({ turn: Number.NaN })
    expect(out).toEqual([
      { kind: 'input', input: 'turn', detents: 3 },
      { kind: 'input', input: 'turn', detents: -1 },
      { kind: 'input', input: 'press' }
    ])
    expect(out.every(isBridgeInput)).toBe(true)
    expect(host.rpc).not.toHaveBeenCalled()
    expect(host.verb).not.toHaveBeenCalled()
  })

  it('sends nothing before the handshake', async () => {
    const { host } = setup()
    bridge!.notify('notify_status_update', [{ extruder: {} }])
    expect(host.rpc).not.toHaveBeenCalled()
  })
})

describe('verbs', () => {
  it('rebuilds a verb from known values only', () => {
    expect(readVerb({ verb: 'jog', axis: 'X', by: 10, script: 'SAVE_CONFIG' })).toEqual({ verb: 'jog', axis: 'X', by: 10 })
    expect(readVerb({ verb: 'home', axes: 'XY' })).toEqual({ verb: 'home', axes: 'XY' })
    expect(readVerb({ verb: 'heat', heater: 'extruder', target: 215.4 })).toEqual({ verb: 'heat', heater: 'extruder', target: 215 })
    expect(readVerb({ verb: 'filament', action: 'load' })).toEqual({ verb: 'filament', action: 'load' })
  })

  it('refuses anything else', () => {
    for (const v of [
      { verb: 'jog', axis: 'E', by: 5 }, { verb: 'jog', axis: 'X', by: 51 }, { verb: 'jog', axis: 'X', by: 0 },
      { verb: 'jog', axis: 'X', by: Number.NaN }, { verb: 'jog', axis: 'X', by: '10' },
      { verb: 'home', axes: 'XYZE' }, { verb: 'heat', heater: 'heater_generic chamber', target: 50 },
      { verb: 'heat', heater: 'extruder', target: -1 }, { verb: 'filament', action: 'purge' },
      { verb: 'gcode', script: 'G1 X0' }, { verb: 'macro', name: 'SAVE_CONFIG' }, null, 'jog'
    ]) expect(readVerb(v)).toBeNull()
  })
})
