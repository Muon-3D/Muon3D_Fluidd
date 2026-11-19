import { afterEach, describe, expect, it, vi } from 'vitest'
import { PanelBridge, type BridgeHost } from '../bridge'
import { auxVerdict, gcodeRefusal, gcodeWord, readVerb, refusalNote, rpcVerdict, ON_PRINTER } from '../allow'
import { HELLO_TYPE, PORT_TYPE, PROTOCOL_VERSION } from '../protocol'

describe('allowlist', () => {
  it('forwards reads and the print controls Control already has', () => {
    for (const m of ['printer.info', 'printer.objects.query', 'printer.print.pause', 'printer.emergency_stop']) expect(rpcVerdict(m)).toBe('forward')
  })

  // muon-link GATE-7 (crates/muon-link-device/src/policy.rs): what an Operator, and so an Open printer's guest, may do.
  it('forwards the Operator surface: print, queue, listed G-code, the reads the screen needs', () => {
    for (const m of [
      'printer.print.start', 'printer.print.pause', 'printer.print.resume', 'printer.print.cancel', 'printer.emergency_stop',
      'printer.gcode.script', 'printer.query_endstops.status',
      'server.job_queue.status', 'server.job_queue.post_job', 'server.job_queue.start', 'server.job_queue.pause', 'server.job_queue.jump',
      'server.files.list', 'server.files.roots', 'server.files.thumbnails', 'server.history.list', 'server.temperature_store', 'server.gcode_store'
    ]) expect(rpcVerdict(m)).toBe('forward')
  })

  it('reads fan and the other verbs by name, field by field', () => {
    expect(readVerb({ verb: 'fan', fan: 'part', percent: 40.4 })).toEqual({ verb: 'fan', fan: 'part', percent: 40 })
    for (const bad of [{ fan: 'part', percent: 101 }, { fan: 'part', percent: -1 }, { fan: 'a b', percent: 5 }, { fan: 7, percent: 5 }, { fan: 'part' }]) {
      expect(readVerb({ verb: 'fan', ...bad })).toBeNull()
    }
  })

  it('runs only an exact list of command words, and refuses every way around it', () => {
    for (const ok of ['M106 S128', 'M107', 'm106 s1 ; fan', 'SET_FAN_SPEED FAN=chamber SPEED=0.5', 'M220 S100\nM221 S100', "SAVE_VARIABLE VARIABLE=muon_material_colour VALUE='\"#fff\"'"]) {
      expect(gcodeRefusal(ok)).toBe('')
    }
    const bypasses = [
      'N1 G1 X100', 'G 1 X100', 'G01 X1', 'g0 Z5', 'G28', 'G92 X0', 'G2 X1 Y1 I1', 'M104 S300', 'M140 S200', 'M109 S250', 'SET_HEATER_TEMPERATURE HEATER=extruder TARGET=500',
      'MANUAL_STEPPER STEPPER=x MOVE=10', 'STEPPER_BUZZ STEPPER=stepper_x', 'PROBE', 'PROBE_ACCURACY', 'BED_MESH_CALIBRATE', 'QUAD_GANTRY_LEVEL', 'Z_TILT_ADJUST',
      'SHAPER_CALIBRATE', 'TEST_RESONANCES AXIS=X', 'SAVE_CONFIG', 'SET_KINEMATIC_POSITION X=0', 'FORCE_MOVE STEPPER=x DISTANCE=1 VELOCITY=1', 'SET_GCODE_OFFSET Z=-5',
      'FIRMWARE_RESTART', 'RESTART', 'M112', 'M999', 'LOAD_FILAMENT', 'MY_MOVING_MACRO', 'M106 S1\nG1 X5', 'M106 S1\n\nN9 G 1 Y1', 'M106;\nG1 X1',
      'SAVE_VARIABLE VARIABLE=other VALUE=1', 'SET_PIN PIN=relay VALUE=1', 'SET_PIN PIN=led VALUE=0',
      'SAVE_VARIABLE VARIABLE=muon_x VALUE=1 VARIABLE=bed_offset', 'SAVE_VARIABLE VARIABLE=bed_offset VARIABLE=muon_x VALUE=1', 'SAVE_VARIABLE VARIABLE=muon_x VALUE=1 EXTRA=2',
      'SAVE_VARIABLE VARIABLE=muon_x VALUE=1 VALUE=2', 'SAVE_VARIABLE VARIABLE=muon_x', 'SAVE_VARIABLE VARIABLE=muon_X-y VALUE=1', 'SAVE_VARIABLE VARIABLE=muon_ VALUE=1', 'SAVE_VARIABLE VARIABLE=muon_x VALUE=1\nSAVE_VARIABLE VARIABLE=bed_offset VALUE=1', 'G1X10', '%', 'M106 S1\n'.repeat(9)
    ]
    for (const bad of bypasses) expect(gcodeRefusal(bad), bad).not.toBe('')
    for (const bad of [undefined, 5, '', '  ', 'M106 S1'.repeat(100)]) expect(gcodeRefusal(bad)).not.toBe('')
    expect(gcodeWord('N12 G 1 X5 *71')).toBe('G1')
    expect(gcodeWord('  ; only a comment')).toBe('')
  })

  it('names a refused action in plain words, never a method', () => {
    expect(refusalNote('POST /dev_mode/enter')).toBe("Developer mode is done on the printer itself. Control can't do it for you.")
    expect(refusalNote('server.muon.protection')).toContain('Changing who can use the printer')
    expect(refusalNote('POST /update/install')).toContain('Installing an update')
    expect(refusalNote('POST /wifi/connect')).toContain('Changing the Wi-Fi')
    expect(refusalNote('machine.reboot')).toContain('Restarting or powering off')
    expect(refusalNote('something.odd')).toBe("That is done on the printer itself. Control can't do it for you.")
  })

  it('answers subscribe and identify itself', () => {
    expect(rpcVerdict('printer.objects.subscribe')).toBe('local')
    expect(rpcVerdict('server.connection.identify')).toBe('local')
  })

  it('refuses setup, access, power and anything unknown', () => {
    for (const m of ['server.muon.setup.network', 'server.muon.access.answer', 'server.muon.protection', 'machine.reboot', 'machine.services.restart', 'machine.update.full', 'server.aux.proxy', 'server.files.delete_file', 'server.database.post_item', 'printer.restart', 'printer.firmware_restart', '', 42, undefined]) {
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

  it('treats a srcdoc frame (opaque origin) as its own window only, and never one that shares the page origin', () => {
    const { frame } = setup()
    frame.setAttribute('sandbox', 'allow-scripts')
    frame.srcdoc = '<!doctype html><body>screen</body>'
    const post = vi.spyOn(frame.contentWindow as Window, 'postMessage')
    hello(frame, 'null', window)
    hello(frame, window.location.origin)
    expect(post).not.toHaveBeenCalled()
    hello(frame)
    expect(post).toHaveBeenCalledTimes(1)
    post.mockClear()
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    hello(frame)
    expect(post).not.toHaveBeenCalled()
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
