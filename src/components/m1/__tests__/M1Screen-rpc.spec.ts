import { describe, expect, it } from 'vitest'
import M1Screen from '../M1Screen.vue'

/** The gate a print call from the framed screen passes before Control sends it. */
type Ctx = {
  controlReady: boolean, controlLock: string, busy: boolean,
  printerPrinting: boolean, printerPaused: boolean,
  authenticated: boolean, socketConnected: boolean, klippyReady: boolean, notReadyReason: string
}
const ctx = (over: Partial<Ctx> = {}): Ctx => ({
  controlReady: true,
  controlLock: '',
  busy: false,
  printerPrinting: false,
  printerPaused: false,
  authenticated: true,
  socketConnected: true,
  klippyReady: true,
  notReadyReason: 'Klippy not ready',
  ...over
})
const refusal = (method: string, c: Ctx): string =>
  ((M1Screen as unknown as { options: { methods: { rpcRefusal: (m: string) => string } } }).options.methods.rpcRefusal).call(c, method)

const PRINT = ['printer.print.start', 'printer.print.pause', 'printer.print.resume', 'printer.print.cancel']

describe('print calls from the printer screen', () => {
  it('are refused while Control is locked', () => {
    const c = ctx({ controlReady: false, controlLock: 'Connect to a printer you can control first.', printerPrinting: true })
    for (const m of PRINT) expect(refusal(m, c)).toBe('Connect to a printer you can control first.')
  })

  it('start is refused while busy; pause, resume and cancel only fit the state', () => {
    expect(refusal('printer.print.start', ctx({ busy: true, printerPrinting: true }))).toMatch(/busy/)
    expect(refusal('printer.print.start', ctx())).toBe('')
    expect(refusal('printer.print.pause', ctx())).not.toBe('')
    expect(refusal('printer.print.pause', ctx({ busy: true, printerPrinting: true }))).toBe('')
    expect(refusal('printer.print.resume', ctx({ busy: true, printerPaused: true }))).toBe('')
    expect(refusal('printer.print.resume', ctx())).not.toBe('')
    expect(refusal('printer.print.cancel', ctx())).not.toBe('')
    expect(refusal('printer.print.cancel', ctx({ busy: true, printerPaused: true }))).toBe('')
  })

  it('emergency stop follows Control\'s own E-STOP: signed in, connected, Klipper ready', () => {
    expect(refusal('printer.emergency_stop', ctx({ busy: true, printerPrinting: true }))).toBe('')
    expect(refusal('printer.emergency_stop', ctx({ controlReady: false }))).toBe('')
    expect(refusal('printer.emergency_stop', ctx({ klippyReady: false }))).not.toBe('')
    expect(refusal('printer.emergency_stop', ctx({ socketConnected: false }))).not.toBe('')
    expect(refusal('printer.emergency_stop', ctx({ authenticated: false }))).not.toBe('')
  })

  it('reads are not gated', () => {
    expect(refusal('printer.info', ctx({ controlReady: false }))).toBe('')
  })
})

describe('heat targets from the printer screen', () => {
  const heatRefusal = (settings: unknown, heater: string, target: number): string =>
    ((M1Screen as unknown as { options: { methods: { heatRefusal: (h: string, t: number) => string } } }).options.methods.heatRefusal)
      .call({ $store: { state: { printer: { printer: { configfile: { settings } } } } } }, heater, target)
  const settings = { extruder: { max_temp: 300 }, heater_bed: { max_temp: 110 } }

  it('go at or below the heater own max_temp', () => {
    expect(heatRefusal(settings, 'extruder', 300)).toBe('')
    expect(heatRefusal(settings, 'extruder', 0)).toBe('')
    expect(heatRefusal(settings, 'heater_bed', 110)).toBe('')
  })

  it('are refused above it, each heater by its own limit', () => {
    expect(heatRefusal(settings, 'extruder', 301)).toMatch(/hotter/)
    expect(heatRefusal(settings, 'heater_bed', 111)).toMatch(/hotter/)
    expect(heatRefusal({ extruder: { max_temp: 500 } }, 'extruder', 400)).toBe('')
  })

  it('are refused when the limit is not known, and for a bad number', () => {
    expect(heatRefusal({}, 'extruder', 50)).toMatch(/not said/)
    expect(heatRefusal({ extruder: {} }, 'extruder', 50)).toMatch(/not said/)
    expect(heatRefusal(undefined, 'extruder', 50)).toMatch(/not said/)
    expect(heatRefusal(settings, 'extruder', -5)).not.toBe('')
    expect(heatRefusal(settings, 'extruder', Number.NaN)).not.toBe('')
  })
})

describe('tuning verbs from the printer screen', () => {
  type VerbCtx = Record<string, unknown> & { calls: string[] }
  const run = (v: object, over: Record<string, unknown> = {}): { why: string, calls: string[] } => {
    const calls: string[] = []
    const c = {
      controlReady: true,
      controlLock: 'locked',
      busy: false,
      isHomed: () => true,
      setSpeed: (p: number) => calls.push(`speed ${p}`),
      setFlow: (p: number) => calls.push(`flow ${p}`),
      motorsOff: () => calls.push('motors_off'),
      adjustZ: (b: number) => calls.push(`zadjust ${b}`),
      ...over
    } as unknown as VerbCtx
    const why = ((M1Screen as unknown as { options: { methods: { runVerb: (v: object) => string } } }).options.methods.runVerb).call(c, v)
    return { why, calls }
  }

  it('speed and flow call Control own setters, also while printing', () => {
    expect(run({ verb: 'speed', percent: 120 }, { busy: true })).toEqual({ why: '', calls: ['speed 120'] })
    expect(run({ verb: 'flow', percent: 95 }, { busy: true })).toEqual({ why: '', calls: ['flow 95'] })
  })

  it('the Z nudge calls adjustZ, also while printing, and needs Z homed', () => {
    expect(run({ verb: 'zadjust', by: -0.05 }, { busy: true })).toEqual({ why: '', calls: ['zadjust -0.05'] })
    expect(run({ verb: 'zadjust', by: 0.05 }, { isHomed: () => false })).toEqual({ why: 'Home the printer first.', calls: [] })
  })

  it('motors off is refused while busy, else Control motorsOff', () => {
    expect(run({ verb: 'motors_off' }, { busy: true })).toEqual({ why: 'Not while the printer is busy.', calls: [] })
    expect(run({ verb: 'motors_off' })).toEqual({ why: '', calls: ['motors_off'] })
  })

  it('every one is refused while Control is locked', () => {
    for (const v of [{ verb: 'speed', percent: 100 }, { verb: 'flow', percent: 100 }, { verb: 'zadjust', by: 0.05 }, { verb: 'motors_off' }]) {
      expect(run(v, { controlReady: false })).toEqual({ why: 'locked', calls: [] })
    }
  })
})
