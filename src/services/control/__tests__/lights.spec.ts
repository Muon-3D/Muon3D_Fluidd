import { describe, expect, it, vi } from 'vitest'
import {
  BUILTIN_PRESETS,
  FAVOURITES_FULL,
  LED_MODE_CAPABILITIES,
  LedModeBackend,
  PREVIEW_FPS,
  PREVIEW_INTERVAL_MS,
  allPresets,
  asLedColour,
  createLatestWriter,
  hexToHue,
  hueToHex,
  ledModeCommand,
  patchLight,
  presetBoxes,
  previewStrip,
  readLedMode,
  toggleFavourite,
  type LightPreset,
  type LightState,
  type LightsTransport
} from '../lights'

const state = (over: Partial<LightState> = {}): LightState => ({ on: true, effect: 'solid', colors: ['#ff0000', '#0000ff'], brightness: 80, speed: 55, ...over })

describe('colour to hue', () => {
  it('turns the primaries and secondaries into their hue', () => {
    expect(hexToHue('#ff0000')).toBe(0)
    expect(hexToHue('#ffff00')).toBe(60)
    expect(hexToHue('#00ff00')).toBe(120)
    expect(hexToHue('#00ffff')).toBe(180)
    expect(hexToHue('#0000ff')).toBe(240)
    expect(hexToHue('#ff00ff')).toBe(300)
  })

  it('counts a grey, or anything that is not a colour, as hue 0', () => {
    expect(hexToHue('#808080')).toBe(0)
    expect(hexToHue('not a colour')).toBe(0)
  })

  it('round-trips a hue through the colour the strips show', () => {
    for (let h = 0; h < 360; h += 7) {
      const back = hexToHue(hueToHex(h))
      expect(Math.min(Math.abs(back - h), 360 - Math.abs(back - h)), `hue ${h}`).toBeLessThanOrEqual(1)
    }
  })

  it('snaps a picked colour to what the strips can show (fixed saturation and lightness)', () => {
    expect(asLedColour('#ffffff')).toBe(hueToHex(0))
    expect(hexToHue(asLedColour('#3366cc'))).toBe(hexToHue('#3366cc'))
  })
})

describe('the LED_MODE command', () => {
  it('sends mode, both hues, brightness and speed', () => {
    expect(ledModeCommand(state({ effect: 'gradient' }))).toBe('LED_MODE MODE=gradient H=0 H2=240 BRIGHT=80 SPEED=55')
  })

  it('uses one hue for a one-colour effect, whatever a second colour says', () => {
    expect(ledModeCommand(state({ effect: 'solid' }))).toBe('LED_MODE MODE=solid H=0 H2=0 BRIGHT=80 SPEED=55')
    expect(ledModeCommand(state({ effect: 'breathe' }))).toBe('LED_MODE MODE=breathe H=0 H2=0 BRIGHT=80 SPEED=55')
  })

  it('keeps brightness in 0-100 and speed in 5-100, as the macro does', () => {
    expect(ledModeCommand(state({ brightness: 140, speed: 0 }))).toContain('BRIGHT=100 SPEED=5')
    expect(ledModeCommand(state({ brightness: -9, speed: 400 }))).toContain('BRIGHT=0 SPEED=100')
    expect(ledModeCommand(state({ brightness: 33.6, speed: 12.4 }))).toContain('BRIGHT=34 SPEED=12')
  })

  it('turns the lights off with MODE=off alone, so the macro keeps what it had', () => {
    expect(ledModeCommand(state({ on: false }))).toBe('LED_MODE MODE=off')
  })

  it('never sends an effect LED_MODE lacks', () => {
    expect(ledModeCommand(state({ effect: 'comet' }))).toMatch(/^LED_MODE MODE=solid /)
    expect(ledModeCommand(state({ effect: 'progress' }))).toMatch(/^LED_MODE MODE=solid /)
  })
})

describe('reading LED_MODE', () => {
  it('reads the macro variables', () => {
    const read = readLedMode({ mode: 'gradient', h: 30, h2: 200, bright: 70, speed: 40 })
    expect(read).toMatchObject({ on: true, effect: 'gradient', brightness: 70, speed: 40 })
    expect(read?.colors).toEqual([hueToHex(30), hueToHex(200)])
  })

  it('says off for MODE off and comes back to the effect it had', () => {
    expect(readLedMode({ mode: 'off', h: 0, h2: 0, bright: 50, speed: 50 }, 'chase')).toMatchObject({ on: false, effect: 'chase' })
  })

  it('has nothing to read on a printer without the macro', () => {
    expect(readLedMode(undefined)).toBeNull()
    expect(readLedMode({})).toBeNull()
  })

  it('clamps what it reads to the ranges the screens use', () => {
    expect(readLedMode({ mode: 'solid', h: 0, h2: 0, bright: 250, speed: 1 })).toMatchObject({ brightness: 100, speed: 5 })
  })

  it('reads what it sends', () => {
    const sent = state({ effect: 'gradient', colors: [hueToHex(20), hueToHex(300)], brightness: 45, speed: 60 })
    const echoed = readLedMode({ mode: 'gradient', h: 20, h2: 300, bright: 45, speed: 60 })
    expect(ledModeCommand(echoed as LightState)).toBe(ledModeCommand(sent))
  })
})

describe('what LED_MODE cannot do is not offered', () => {
  const caps = LED_MODE_CAPABILITIES

  it('lists only the effects the macro has', () => {
    expect(caps.effects.map(e => e.id)).toEqual(['solid', 'gradient', 'rainbow', 'breathe', 'chase', 'status'])
    for (const missing of ['comet', 'wave', 'sparkle', 'progress']) expect(caps.effects.map(e => e.id)).not.toContain(missing)
  })

  it('has no zones, at most two colours and no frames', () => {
    expect(caps.zones).toBe(false)
    expect(caps.maxColours).toBe(2)
    expect(caps.frames).toBe(false)
  })

  it('cuts a third and fourth colour', () => {
    expect(patchLight(state(), { colors: ['#ff0000', '#00ff00', '#0000ff', '#ffffff'] }).colors).toHaveLength(2)
  })

  it('drops a preset saved with an effect it cannot show, and keeps the rest', () => {
    const saved = [
      { id: 'u0', name: 'Fine', effect: 'chase', colors: ['#ff0000'] },
      { id: 'u1', name: 'Comet', effect: 'comet', colors: ['#ff0000', '#00ff00'] },
      { id: 'u2', name: 'No colours', effect: 'solid', colors: [] },
      'junk'
    ]
    expect(allPresets(saved).map(p => p.id)).toEqual([...BUILTIN_PRESETS.map(p => p.id), 'u0'])
  })

  it('has only built-in presets LED_MODE can draw', () => {
    for (const p of BUILTIN_PRESETS) expect(caps.effects.map(e => e.id)).toContain(p.effect)
  })
})

describe('writes: at most three a second, the latest winning', () => {
  function clock () {
    let now = 1_000_000
    const timers: Array<{ at: number; fn: () => void; id: number }> = []
    let ids = 0
    return {
      now: () => now,
      setTimeout: (fn: () => void, ms: number) => { const id = ++ids; timers.push({ at: now + ms, fn, id }); return id },
      clearTimeout: (id: unknown) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1) },
      advance (ms: number) {
        const end = now + ms
        for (;;) {
          timers.sort((a, b) => a.at - b.at)
          const next = timers[0]
          if (!next || next.at > end) break
          timers.shift()
          now = next.at
          next.fn()
        }
        now = end
      }
    }
  }

  it('sends the first value at once', () => {
    const c = clock(); const send = vi.fn()
    createLatestWriter<number>(send, 3, c).push(1)
    expect(send).toHaveBeenCalledWith(1)
  })

  it('collapses a burst to the first and the last', () => {
    const c = clock(); const send = vi.fn()
    const w = createLatestWriter<number>(send, 3, c)
    for (let i = 1; i <= 50; i++) { w.push(i); c.advance(5) }
    c.advance(1000)
    expect(send.mock.calls.map(a => a[0])).toEqual([1, 50])
  })

  it('never sends more than three in any second, however long a slider is dragged', () => {
    const c = clock(); const times: number[] = []
    const w = createLatestWriter<number>(() => times.push(c.now()), 3, c)
    for (let i = 0; i < 400; i++) { w.push(i); c.advance(10) }
    c.advance(2000)
    expect(times.length).toBeGreaterThan(6)
    for (let i = 0; i < times.length; i++) {
      const inWindow = times.filter(t => t >= times[i] && t < times[i] + 1000).length
      expect(inWindow, `window from send ${i}`).toBeLessThanOrEqual(3)
    }
  })

  it('sends the latest value last, never an old one', () => {
    const c = clock(); const send = vi.fn()
    const w = createLatestWriter<string>(send, 3, c)
    w.push('a'); w.push('b'); w.push('c')
    c.advance(1000)
    expect(send.mock.calls.map(a => a[0])).toEqual(['a', 'c'])
  })

  it('a cancelled value is not sent', () => {
    const c = clock(); const send = vi.fn()
    const w = createLatestWriter<number>(send, 3, c)
    w.push(1); w.push(2); w.cancel()
    c.advance(1000)
    expect(send.mock.calls.map(a => a[0])).toEqual([1])
  })

  it('negative control: without the limit, the same drag sends every change', () => {
    const c = clock(); const send = vi.fn()
    for (let i = 0; i < 60; i++) { send(i); c.advance(10) }
    expect(send).toHaveBeenCalledTimes(60)
  })
})

describe('presets: favourites and More', () => {
  const make = (n: number): LightPreset[] => [
    ...BUILTIN_PRESETS,
    ...Array.from({ length: n - BUILTIN_PRESETS.length }, (_, i) => ({ id: `u${i}`, name: `Mine ${i}`, effect: 'solid' as const, colors: ['#ff0000'] }))
  ]

  it('shows every preset and no More with eight or fewer', () => {
    for (const n of [6, 7, 8]) {
      const boxes = presetBoxes(make(n), ['b0'])
      expect(boxes).toHaveLength(n)
      expect(boxes.some(b => b.more !== undefined)).toBe(false)
    }
  })

  it('with twelve shows seven favourites and +5 More', () => {
    const boxes = presetBoxes(make(12), ['b3', 'b2', 'u0', 'b4', 'b0', 'b1', 'b5'])
    expect(boxes).toHaveLength(8)
    expect(boxes.slice(0, 7).map(b => b.preset?.id)).toEqual(['b3', 'b2', 'u0', 'b4', 'b0', 'b1', 'b5'])
    expect(boxes[7]).toEqual({ preset: null, more: 5 })
  })

  it('tops favourites up from the list when there are fewer than seven', () => {
    const boxes = presetBoxes(make(12), ['b3'])
    expect(boxes).toHaveLength(8)
    expect(boxes[0].preset?.id).toBe('b3')
    expect(new Set(boxes.slice(0, 7).map(b => b.preset?.id)).size).toBe(7)
  })

  it('stars up to seven and refuses an eighth, saying why', () => {
    let draft: string[] = []
    for (const id of ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'u0']) draft = toggleFavourite(draft, id).draft
    expect(draft).toHaveLength(7)
    const eighth = toggleFavourite(draft, 'u1')
    expect(eighth.blocked).toBe(true)
    expect(eighth.draft).toEqual(draft)
    expect(eighth.hint).toBe(FAVOURITES_FULL)
  })

  it('removing a star makes room for another', () => {
    const full = ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'u0']
    const room = toggleFavourite(full, 'b2')
    expect(room.draft).toHaveLength(6)
    expect(toggleFavourite(room.draft, 'u1').blocked).toBe(false)
  })
})

describe('the preview', () => {
  it('draws at no more than 15 frames a second', () => {
    expect(PREVIEW_FPS).toBe(15)
    expect(1000 / PREVIEW_INTERVAL_MS).toBeLessThanOrEqual(15)
  })

  it('draws 40 LEDs, dark when off', () => {
    expect(previewStrip(state(), 0)).toHaveLength(40)
    expect(new Set(previewStrip(state({ on: false }), 0).map(d => d.fill)).size).toBe(1)
  })

  it('moves rainbow, breathe and chase over time and holds solid and gradient still', () => {
    for (const effect of ['rainbow', 'breathe', 'chase'] as const) {
      expect(JSON.stringify(previewStrip(state({ effect }), 0.3)), effect).not.toBe(JSON.stringify(previewStrip(state({ effect }), 0.9)))
    }
    for (const effect of ['solid', 'gradient'] as const) {
      expect(JSON.stringify(previewStrip(state({ effect }), 0.3)), effect).toBe(JSON.stringify(previewStrip(state({ effect }), 0.9)))
    }
  })
})

describe('the LED_MODE backend', () => {
  function transport () {
    const db: Record<string, Record<string, unknown>> = {}
    const gcode: string[] = []
    const t: LightsTransport = {
      gcode: s => { gcode.push(s) },
      dbRead: async ns => db[ns] ?? {},
      dbWrite: async (ns, key, value) => { (db[ns] ??= {})[key] = value }
    }
    return { t, db, gcode }
  }

  it('sends the state as LED_MODE G-code', () => {
    const { t, gcode } = transport()
    new LedModeBackend(t).apply(state({ effect: 'chase', brightness: 20 }))
    expect(gcode).toEqual(['LED_MODE MODE=chase H=0 H2=240 BRIGHT=20 SPEED=55'])
  })

  it('reads the report from the printer object', () => {
    const { t } = transport()
    const read = new LedModeBackend(t).read({ 'gcode_macro LED_MODE': { mode: 'rainbow', h: 0, h2: 0, bright: 60, speed: 50 } })
    expect(read).toMatchObject({ on: true, effect: 'rainbow' })
    expect(new LedModeBackend(t).read({})).toBeNull()
  })

  it('keeps presets and favourites in the fluidd namespace under lights.library, and not the built-ins', async () => {
    const { t, db } = transport()
    const backend = new LedModeBackend(t)
    await backend.saveLibrary([...BUILTIN_PRESETS, { id: 'u0', name: 'Mine', effect: 'solid', colors: ['#ff0000'] }], ['b0', 'u0'])
    expect(Object.keys(db)).toEqual(['fluidd'])
    expect(db.fluidd['lights.library']).toEqual({ presets: [{ id: 'u0', name: 'Mine', effect: 'solid', colors: ['#ff0000'] }], favourites: ['b0', 'u0'] })
    // The fake stores a dotted key flat; Moonraker nests it, so read it back the way Moonraker would.
    const nested = { ...t, dbRead: async (ns: string) => ns === 'fluidd' ? { lights: { library: db.fluidd['lights.library'] } } : {} }
    const library = await new LedModeBackend(nested).loadLibrary()
    expect(library.presets.map(p => p.id)).toContain('u0')
    expect(library.favourites).toEqual(['b0', 'u0'])
  })

  it('moves a library found in the old muon_lights namespace to the new one, once', async () => {
    const { t, db } = transport()
    db.muon_lights = { presets: [{ id: 'u0', name: 'Old', effect: 'solid', colors: ['#ff0000'] }], favourites: ['b0', 'u0'] }
    const library = await new LedModeBackend(t).loadLibrary()
    expect(library.presets.map(p => p.id)).toContain('u0')
    expect(library.favourites).toEqual(['b0', 'u0'])
    expect(db.fluidd['lights.library']).toEqual({ presets: [{ id: 'u0', name: 'Old', effect: 'solid', colors: [asLedColour('#ff0000')] }], favourites: ['b0', 'u0'] })
  })

  it('negative control: with a library in the new place it neither reads nor moves the old one', async () => {
    const { t, db } = transport()
    db.muon_lights = { presets: [{ id: 'u9', name: 'Old', effect: 'solid', colors: ['#ff0000'] }], favourites: ['u9'] }
    const read = vi.fn(async (ns: string) => ns === 'fluidd' ? { lights: { library: { presets: [{ id: 'u1', name: 'New', effect: 'solid', colors: ['#00ff00'] }], favourites: ['u1'] } } } : (db[ns] ?? {}))
    const write = vi.fn(t.dbWrite)
    const library = await new LedModeBackend({ ...t, dbRead: read, dbWrite: write }).loadLibrary()
    expect(library.presets.map(p => p.id)).toContain('u1')
    expect(library.presets.map(p => p.id)).not.toContain('u9')
    expect(read).not.toHaveBeenCalledWith('muon_lights')
    expect(write).not.toHaveBeenCalled()
  })

  it('a refused migration write still returns the old library', async () => {
    const { t, db } = transport()
    db.muon_lights = { presets: [{ id: 'u0', name: 'Old', effect: 'solid', colors: ['#ff0000'] }], favourites: ['u0'] }
    const library = await new LedModeBackend({ ...t, dbWrite: async () => { throw Object.assign(new Error('no'), { response: { status: 403 } }) } }).loadLibrary()
    expect(library.presets.map(p => p.id)).toContain('u0')
  })

  it('starts with the default favourites when nothing is saved, and survives a failed read', async () => {
    const { t } = transport()
    const library = await new LedModeBackend(t).loadLibrary()
    expect(library.favourites).toEqual(['b3', 'b2', 'b4', 'b0', 'b1', 'b5'])
    const broken = await new LedModeBackend({ ...t, dbRead: async () => { throw new Error('offline') } }).loadLibrary()
    expect(broken.presets.map(p => p.id)).toEqual(BUILTIN_PRESETS.map(p => p.id))
  })

  it('describes the call for the API card', () => {
    const { t } = transport()
    expect(new LedModeBackend(t).describe(state())).toBe('POST /printer/gcode/script\n{"script":"LED_MODE MODE=solid H=0 H2=0 BRIGHT=80 SPEED=55"}')
  })
})
