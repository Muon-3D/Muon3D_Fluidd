/**
 * Lighting (KAN-4767): what the M1's two light strips can do, and how Control
 * asks for it. This module is pure: no store, no socket. The reactive side is
 * lights-store.ts, which owns the I/O and holds one `LightsBackend`.
 *
 * Today's backend drives the printer's LED_MODE macro (Muon3D_Klipper,
 * core/M1/macros/led_modes.cfg): MODE solid, gradient, rainbow, breathe, chase,
 * status or off, two hues (H, H2), BRIGHT 0-100 and SPEED 5-100, for both strips
 * together. The `server.lights` API will do more (zones, four colours, more
 * effects, per-LED frames). Until it lands, what LED_MODE cannot do is not
 * offered: `capabilities` says so and the screens read it. A new backend only
 * has to answer `capabilities` differently.
 */

export type EffectId = 'solid' | 'gradient' | 'rainbow' | 'breathe' | 'chase' | 'status' | 'comet' | 'wave' | 'sparkle' | 'progress'

export interface EffectInfo {
  id: EffectId;
  label: string;
  /** One plain line under the effect picker. */
  blurb: string;
  /** How many colours the effect takes: 0 picks its own. */
  colours: number;
  /** Whether Speed does anything. */
  speed: boolean;
}

/** Every effect the design names. Only the ones a backend lists in `capabilities.effects` are shown. */
export const EFFECT_CATALOGUE: EffectInfo[] = [
  { id: 'solid', label: 'Solid', blurb: 'One colour, held steady.', colours: 1, speed: false },
  { id: 'gradient', label: 'Gradient', blurb: 'Blends two colours along each strip.', colours: 2, speed: false },
  { id: 'rainbow', label: 'Rainbow', blurb: 'Cycles the hue along the strip.', colours: 0, speed: true },
  { id: 'breathe', label: 'Breathe', blurb: 'Fades up and down between dim and full.', colours: 1, speed: true },
  { id: 'chase', label: 'Chase', blurb: 'Evenly spaced dots run along the strip.', colours: 2, speed: true },
  { id: 'comet', label: 'Comet', blurb: 'A bright head with a tail runs along the strip.', colours: 2, speed: true },
  { id: 'wave', label: 'Wave', blurb: 'A soft swell of brightness rolls along the strip.', colours: 2, speed: true },
  { id: 'sparkle', label: 'Sparkle', blurb: 'Random LEDs flash and fade.', colours: 2, speed: true },
  { id: 'progress', label: 'Progress', blurb: 'Lights the strips as the print advances.', colours: 2, speed: false },
  { id: 'status', label: 'Status', blurb: 'Shows the printer state: green when ready.', colours: 0, speed: false }
]

export interface LightsCapabilities {
  /** Per-strip settings. */
  zones: boolean;
  /** How many colours one setting can carry. */
  maxColours: number;
  effects: EffectInfo[];
  /** Per-LED frames (the streaming API). */
  frames: boolean;
  speedMin: number;
  /** The most settings sent per second. */
  writesPerSecond: number;
}

/** What the LED_MODE macro can do. */
export const LED_MODE_CAPABILITIES: LightsCapabilities = {
  zones: false,
  maxColours: 2,
  effects: EFFECT_CATALOGUE.filter(e => ['solid', 'gradient', 'rainbow', 'breathe', 'chase', 'status'].includes(e.id)),
  frames: false,
  speedMin: 5,
  writesPerSecond: 3
}

export interface LightState {
  on: boolean;
  effect: EffectId;
  /** `#rrggbb`, as many as the effect takes (at least one). */
  colors: string[];
  /** 0-100. */
  brightness: number;
  /** 5-100 on LED_MODE. */
  speed: number;
}

export const DEFAULT_LIGHT: LightState = { on: true, effect: 'solid', colors: ['#f7b24a', '#f7b24a'], brightness: 80, speed: 55 }

export const effectInfo = (id: string): EffectInfo | undefined => EFFECT_CATALOGUE.find(e => e.id === id)

/** The effect, or the first one the backend offers when it does not know it. */
export function effectFor (caps: LightsCapabilities, id: string): EffectInfo {
  return caps.effects.find(e => e.id === id) ?? caps.effects[0]
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))
const num = (v: unknown, fallback: number): number => typeof v === 'number' && Number.isFinite(v) ? v : fallback

// ---- colour ----------------------------------------------------------------

/** What `_LED_MODE_APPLY` does with a hue: HSL(h, 85%, 55%). The strips show exactly this colour, so the screens do too. */
export const LED_SATURATION = 0.85
export const LED_LIGHTNESS = 0.55

function hslToRgb (h: number, s: number, l: number): [number, number, number] {
  const hh = (((h % 360) + 360) % 360) / 60
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((hh % 2) - 1))
  const m = l - c / 2
  const rgb: [number, number, number] = hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] : hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] : hh < 5 ? [x, 0, c] : [c, 0, x]
  return [Math.round((rgb[0] + m) * 255), Math.round((rgb[1] + m) * 255), Math.round((rgb[2] + m) * 255)]
}

const hex2 = (n: number): string => n.toString(16).padStart(2, '0')

/** The colour the strips show for a hue (0-360). */
export function hueToHex (hue: number): string {
  const [r, g, b] = hslToRgb(hue, LED_SATURATION, LED_LIGHTNESS)
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`
}

export function parseHex (hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * The hue (0-359) of a colour, which is all LED_MODE takes: its saturation and
 * lightness are fixed. A grey has no hue and counts as 0 (red). Anything that
 * is not a hex colour is 0 as well.
 */
export function hexToHue (hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(v => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  return Math.round(h) % 360
}

/** A colour as the strips will show it: its hue at the fixed saturation and lightness. */
export const asLedColour = (hex: string): string => hueToHex(hexToHue(hex))

// ---- LED_MODE ---------------------------------------------------------------

/** The variables of the `gcode_macro LED_MODE` object (led_modes.cfg:17-23). */
export interface LedModeVars { mode?: unknown; h?: unknown; h2?: unknown; bright?: unknown; speed?: unknown }

/**
 * The state LED_MODE reports. `null` when the printer has no LED_MODE (not an
 * M1, or Klipper has not told us yet). `resume` is the effect to come back to
 * when the mode is `off`, which keeps no effect of its own.
 */
export function readLedMode (vars: LedModeVars | undefined | null, resume: EffectId = 'solid', caps: LightsCapabilities = LED_MODE_CAPABILITIES): LightState | null {
  if (!vars || typeof vars !== 'object' || vars.mode === undefined) return null
  const mode = String(vars.mode).toLowerCase()
  const on = mode !== 'off'
  const wanted = on ? mode : resume
  const effect = effectFor(caps, wanted).id
  const h = num(vars.h, 0)
  const h2 = num(vars.h2, 180)
  return {
    on,
    effect,
    colors: [hueToHex(h), hueToHex(h2)].slice(0, caps.maxColours),
    brightness: Math.round(clamp(num(vars.bright, 60), 0, 100)),
    speed: Math.round(clamp(num(vars.speed, 50), caps.speedMin, 100))
  }
}

/** One decimal-free hue for the macro: 0-359. */
const hueParam = (hex: string | undefined, fallback: string): number => hexToHue(hex ?? fallback)

/**
 * The G-code for a state. Off is `MODE=off` alone, so the macro keeps its
 * hues, brightness and speed for when the lights come back.
 */
export function ledModeCommand (state: LightState, caps: LightsCapabilities = LED_MODE_CAPABILITIES): string {
  if (!state.on) return 'LED_MODE MODE=off'
  const effect = effectFor(caps, state.effect)
  const first = state.colors[0] ?? DEFAULT_LIGHT.colors[0]
  const h = hueParam(first, DEFAULT_LIGHT.colors[0])
  const h2 = effect.colours > 1 ? hueParam(state.colors[1], first) : h
  const bright = Math.round(clamp(num(state.brightness, 80), 0, 100))
  const speed = Math.round(clamp(num(state.speed, 50), caps.speedMin, 100))
  return `LED_MODE MODE=${effect.id} H=${h} H2=${h2} BRIGHT=${bright} SPEED=${speed}`
}

/** `state` with `patch` laid on it, kept inside what the backend allows. */
export function patchLight (state: LightState, patch: Partial<LightState>, caps: LightsCapabilities = LED_MODE_CAPABILITIES): LightState {
  const next: LightState = { ...state, ...patch }
  next.effect = effectFor(caps, next.effect).id
  next.colors = (next.colors.length ? next.colors : DEFAULT_LIGHT.colors).slice(0, caps.maxColours).map(c => parseHex(c) ? c.toLowerCase() : DEFAULT_LIGHT.colors[0])
  while (next.colors.length < Math.min(2, caps.maxColours)) next.colors.push(next.colors[next.colors.length - 1])
  next.brightness = Math.round(clamp(num(next.brightness, 80), 0, 100))
  next.speed = Math.round(clamp(num(next.speed, 50), caps.speedMin, 100))
  return next
}

// ---- writes -----------------------------------------------------------------

export interface LatestWriter<T> {
  /** Ask for this value to be sent; a newer one replaces it if it has not gone yet. */
  push: (value: T) => void;
  /** Drop anything waiting. */
  cancel: () => void;
}

/**
 * Sends the latest value at most `perSecond` times a second. The first value
 * goes at once; while a send is cooling down, newer values replace the waiting
 * one, and the last goes when the cool-down ends (leading and trailing, latest
 * wins). `now` and the timer are injectable so a test can drive time.
 */
export function createLatestWriter<T> (send: (value: T) => void, perSecond = 3, clock: { now: () => number, setTimeout: (fn: () => void, ms: number) => unknown, clearTimeout: (id: unknown) => void } = { now: () => Date.now(), setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: id => clearTimeout(id as ReturnType<typeof setTimeout>) }): LatestWriter<T> {
  // A little over 1000 / perSecond so a sliding second never holds more than `perSecond` sends.
  const gap = Math.ceil(1000 / perSecond) + 40
  let last = -Infinity
  let waiting: { value: T } | null = null
  let timer: unknown = null
  const fire = () => {
    timer = null
    if (!waiting) return
    const { value } = waiting
    waiting = null
    last = clock.now()
    send(value)
  }
  return {
    push (value: T) {
      waiting = { value }
      if (timer !== null) return
      const wait = last + gap - clock.now()
      if (wait <= 0) fire()
      else timer = clock.setTimeout(fire, wait)
    },
    cancel () {
      if (timer !== null) clock.clearTimeout(timer)
      timer = null
      waiting = null
    }
  }
}

// ---- presets ----------------------------------------------------------------

export interface LightPreset {
  id: string;
  name: string;
  effect: EffectId;
  colors: string[];
  builtin?: boolean;
}

/**
 * The presets that come with Control, written for what LED_MODE can do (the
 * canvas's Print progress, Sunset, Desk warm... that need comet, progress or a
 * third colour are mapped onto the nearest LED_MODE effect, with the name kept
 * honest). The colours are hues; `hueToHex` gives what the strips show.
 */
export const BUILTIN_PRESETS: LightPreset[] = [
  { id: 'b0', name: 'Warm white', effect: 'solid', colors: [hueToHex(36)], builtin: true },
  { id: 'b1', name: 'Cool focus', effect: 'solid', colors: [hueToHex(205)], builtin: true },
  { id: 'b2', name: 'Printer status', effect: 'status', colors: [hueToHex(140)], builtin: true },
  { id: 'b3', name: 'Aurora', effect: 'breathe', colors: [hueToHex(170)], builtin: true },
  { id: 'b4', name: 'Sunset', effect: 'gradient', colors: [hueToHex(28), hueToHex(340)], builtin: true },
  { id: 'b5', name: 'Rainbow', effect: 'rainbow', colors: [hueToHex(0), hueToHex(240)], builtin: true }
]

/** The favourites a person starts with, in order: the ones that exist. */
export const DEFAULT_FAVOURITES = ['b3', 'b2', 'u0', 'b4', 'b0', 'b1', 'b5']

export const MAX_FAVOURITES = 7
export const MAX_BOXES = 8
export const MAX_SAVED_PRESETS = 24
export const PRESET_NAME_MAX = 24

export const FAVOURITES_FULL = 'You can have 7 favourites. Remove one to add another.'

/** A preset read back from the database, or null when it is not one this backend can show. */
export function cleanPreset (raw: unknown, caps: LightsCapabilities = LED_MODE_CAPABILITIES): LightPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.id !== 'string' || !p.id || typeof p.name !== 'string') return null
  const effect = caps.effects.find(e => e.id === p.effect)
  if (!effect) return null
  const colors = Array.isArray(p.colors) ? p.colors.filter((c): c is string => typeof c === 'string' && !!parseHex(c)).slice(0, caps.maxColours).map(c => asLedColour(c)) : []
  if (!colors.length) return null
  return { id: p.id, name: p.name.slice(0, PRESET_NAME_MAX), effect: effect.id, colors }
}

/** Built-in presets, then the person's own. */
export function allPresets (saved: unknown, caps: LightsCapabilities = LED_MODE_CAPABILITIES): LightPreset[] {
  const mine = (Array.isArray(saved) ? saved : []).map(p => cleanPreset(p, caps)).filter((p): p is LightPreset => !!p)
  const seen = new Set(BUILTIN_PRESETS.map(p => p.id))
  return [...BUILTIN_PRESETS.filter(p => caps.effects.some(e => e.id === p.effect)), ...mine.filter(p => !seen.has(p.id) && seen.add(p.id)).slice(0, MAX_SAVED_PRESETS)]
}

export interface PresetBox { preset: LightPreset | null; more?: number }

/**
 * The preset grid: up to eight boxes. With eight presets or fewer they all show
 * and there is no More. With more, the favourites (up to seven, topped up from
 * the list when there are fewer) and an eighth box, `+N More`, that opens the
 * list to star from.
 */
export function presetBoxes (presets: LightPreset[], favourites: string[] | null | undefined): PresetBox[] {
  if (presets.length <= MAX_BOXES) return presets.map(preset => ({ preset }))
  const byId = new Map(presets.map(p => [p.id, p]))
  const picked: LightPreset[] = []
  for (const id of favourites ?? DEFAULT_FAVOURITES) {
    const p = byId.get(id)
    if (p && !picked.includes(p) && picked.length < MAX_FAVOURITES) picked.push(p)
  }
  for (const p of presets) if (picked.length < MAX_FAVOURITES && !picked.includes(p)) picked.push(p)
  return [...picked.map(preset => ({ preset })), { preset: null, more: presets.length - MAX_FAVOURITES }]
}

/** Stars or unstars one preset in a draft list. At seven, a new star is refused and says why. */
export function toggleFavourite (draft: string[], id: string): { draft: string[]; blocked: boolean; hint: string } {
  if (draft.includes(id)) return { draft: draft.filter(x => x !== id), blocked: false, hint: '' }
  if (draft.length >= MAX_FAVOURITES) return { draft, blocked: true, hint: FAVOURITES_FULL }
  return { draft: [...draft, id], blocked: false, hint: '' }
}

/** The favourites that still exist, in order, at most seven. */
export function cleanFavourites (raw: unknown, presets: LightPreset[]): string[] {
  const ids = new Set(presets.map(p => p.id))
  const source = Array.isArray(raw) ? raw : DEFAULT_FAVOURITES
  const out: string[] = []
  for (const id of source) if (typeof id === 'string' && ids.has(id) && !out.includes(id) && out.length < MAX_FAVOURITES) out.push(id)
  return out
}

/** The state a preset sets: its effect and colours, with the brightness and speed already on. */
export function presetState (preset: LightPreset, current: LightState, caps: LightsCapabilities = LED_MODE_CAPABILITIES): LightState {
  return patchLight(current, { on: true, effect: preset.effect, colors: preset.colors }, caps)
}

export function newPresetId (existing: LightPreset[]): string {
  let n = existing.length
  while (existing.some(p => p.id === `u${n}`)) n++
  return `u${n}`
}

// ---- the preview ------------------------------------------------------------

/** The LEDs on each strip. */
export const LEDS_PER_STRIP = 40

/** The preview never draws more often than this. */
export const PREVIEW_FPS = 15
export const PREVIEW_INTERVAL_MS = Math.ceil(1000 / PREVIEW_FPS) + 4

export interface LedDot { fill: string; opacity: number }

const hueRgb = (h: number): string => {
  const hh = ((h % 360) + 360) % 360
  const f = (n: number) => { const k = (n + hh / 30) % 12; return Math.round(255 * (0.62 - 0.342 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))) }
  return `rgb(${f(0)},${f(8)},${f(4)})`
}

function mix (a: string, b: string, t: number): string {
  const A = parseHex(a) ?? [255, 255, 255]
  const B = parseHex(b) ?? A
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`
}

export const LED_OFF = '#3a3a3c'

/**
 * One strip as it looks at `seconds` into the effect: 40 dots. The same maths
 * as the macro's led_effect (breathe period (105 - speed) / 20 s, chase and
 * rainbow rates from speed), drawn in the browser from the state alone, so the
 * preview asks the printer for nothing per frame.
 */
export function previewStrip (state: LightState, seconds: number): LedDot[] {
  const n = LEDS_PER_STRIP
  const dots: LedDot[] = []
  const c1 = state.colors[0] ?? DEFAULT_LIGHT.colors[0]
  const c2 = state.colors[1] ?? c1
  const speed = clamp(state.speed, 5, 100)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    if (!state.on) { dots.push({ fill: LED_OFF, opacity: 1 }); continue }
    let fill = c1
    let opacity = 1
    switch (state.effect) {
      case 'gradient': fill = mix(c1, c2, t); break
      case 'rainbow': fill = hueRgb(t * 360 + seconds * (0.05 + speed / 100 * 0.45) * 360); break
      case 'breathe': {
        const period = (105 - speed) / 20
        opacity = 0.4 + 0.6 * (0.5 - 0.5 * Math.cos((seconds / period) * Math.PI * 2))
        break
      }
      case 'chase': {
        const rate = 0.2 + speed / 100 * 3
        const phase = (((i / 8) - seconds * rate / 3) % 1 + 1) % 1
        fill = mix(c1, c2, t)
        opacity = phase < 0.35 ? 1 : 0.12
        break
      }
      case 'status': {
        fill = '#30d158'
        opacity = 0.4 + 0.6 * (0.5 - 0.5 * Math.cos(seconds / 2.4 * Math.PI * 2))
        break
      }
      default: break
    }
    dots.push({ fill, opacity: Math.round(opacity * 100) / 100 })
  }
  return dots
}

/** The overall brightness the preview wears, as the canvas does: dim at 0, full at 100. */
export const previewLuminance = (state: LightState): number => state.on ? Math.round((0.3 + 0.7 * state.brightness / 100) * 100) / 100 : 1

// ---- the backend --------------------------------------------------------------

/** What the screens need from the printer, so the LED_MODE backend can be swapped for `server.lights`. */
export interface LightsTransport {
  /** Runs a G-code script (printer.gcode.script). Not echoed to the console. */
  gcode: (script: string) => void | Promise<unknown>;
  /** A whole namespace of Moonraker's database. A namespace that does not exist yet is `{}`. */
  dbRead: (namespace: string) => Promise<Record<string, unknown>>;
  dbWrite: (namespace: string, key: string, value: unknown) => Promise<unknown>;
}

export interface LightsLibrary { presets: LightPreset[]; favourites: string[] }

export interface LightsBackend {
  readonly capabilities: LightsCapabilities;
  /** The state the printer reports, from its objects. null: no lights here. */
  read: (printer: Record<string, any> | undefined, resume?: EffectId) => LightState | null;
  /** The G-code or call a state becomes, for the API card. */
  describe: (state: LightState) => string;
  /** Sends the state now. Rate limiting is the caller's (createLatestWriter). */
  apply: (state: LightState) => void | Promise<unknown>;
  loadLibrary: () => Promise<LightsLibrary>;
  /** Keeps the presets of your own and the favourites, in one write. */
  saveLibrary: (presets: LightPreset[], favourites: string[]) => Promise<unknown>;
}

/**
 * Where the library lives: Control's own `fluidd` namespace, under `lights.library`. That is one of the two
 * namespaces muon-link lets a guest or operator write over Bluetooth and the relay, so their saves work too.
 */
export const LIGHTS_NAMESPACE = 'fluidd'
export const LIGHTS_KEY = 'lights.library'
/** Where the first build kept it. Read once, then moved. */
export const LEGACY_LIGHTS_NAMESPACE = 'muon_lights'

/** Today's backend: the LED_MODE macro through Moonraker, and the library in Moonraker's database. */
export class LedModeBackend implements LightsBackend {
  readonly capabilities = LED_MODE_CAPABILITIES
  private transport: LightsTransport

  constructor (transport: LightsTransport) { this.transport = transport }

  read (printer: Record<string, any> | undefined, resume: EffectId = 'solid'): LightState | null {
    return readLedMode(printer?.['gcode_macro LED_MODE'], resume, this.capabilities)
  }

  describe (state: LightState): string {
    return `POST /printer/gcode/script\n${JSON.stringify({ script: ledModeCommand(state, this.capabilities) })}`
  }

  apply (state: LightState) { return this.transport.gcode(ledModeCommand(state, this.capabilities)) }

  async loadLibrary (): Promise<LightsLibrary> {
    const fluidd: Record<string, unknown> = await this.transport.dbRead(LIGHTS_NAMESPACE).catch(() => ({}))
    const lights = fluidd.lights as { library?: unknown } | undefined
    let stored = lights?.library as Record<string, unknown> | undefined
    let migrate = false
    if (!stored || typeof stored !== 'object') {
      // One time: a library kept in the first build's namespace moves to the new one.
      const old: Record<string, unknown> = await this.transport.dbRead(LEGACY_LIGHTS_NAMESPACE).catch(() => ({}))
      if (old && (Array.isArray(old.presets) || Array.isArray(old.favourites))) { stored = old; migrate = true } else stored = {}
    }
    const presets = allPresets(stored.presets, this.capabilities)
    const library = { presets, favourites: cleanFavourites(stored.favourites, presets) }
    if (migrate) await this.saveLibrary(presets, library.favourites).catch(() => undefined)
    return library
  }

  saveLibrary (presets: LightPreset[], favourites: string[]) {
    return this.transport.dbWrite(LIGHTS_NAMESPACE, LIGHTS_KEY, {
      presets: presets.filter(p => !p.builtin).map(p => ({ id: p.id, name: p.name, effect: p.effect, colors: p.colors })),
      favourites: favourites.slice(0, MAX_FAVOURITES)
    })
  }
}
