/**
 * Which lines the temperature graph can draw, found the way Fluidd finds them:
 * from the objects Klipper reports (printer.objects.list, subscribed in full).
 * Pure functions only; nothing here reads the store or the DOM.
 */
export type SeriesKind = 'temp' | 'power' | 'speed'
/** Where a line belongs, in the order the legend and the graph list them. */
export type SeriesGroup = 'Toolhead' | 'Bed' | 'Chamber and system' | 'Fans' | 'Other'
export const GROUP_ORDER: readonly SeriesGroup[] = ['Toolhead', 'Bed', 'Chamber and system', 'Fans', 'Other']

export interface SeriesDef {
  /** The column in the recorded sample: the object name, plus Power or Speed. */
  key: string
  /** Klipper object this line reads. */
  object: string
  /** Field on that object. */
  field: 'temperature' | 'power' | 'speed'
  label: string
  group: SeriesGroup
  kind: SeriesKind
  /** Column holding this line's target, drawn dashed with it. */
  targetKey?: string
  /** 0 = temperature axis (left), 1 = percent axis (right). */
  axis: 0 | 1
  /** Multiplies the recorded value for display (power and speed are 0 to 1). */
  scale: number
  unit: '°C' | '%'
  color: string
  defaultOn: boolean
}

export type SeriesSelection = Record<string, boolean | undefined>

const PALETTE = ['#ff8c42', '#6aa8ff', '#b38cff', '#4fd1a5', '#e6c84a', '#ff6b9a', '#8ab4c8', '#c49a6c', '#7bd36b', '#e0705e', '#5fc8e0', '#d08cd0']

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const ACRONYMS = new Set(['mcu', 'cpu', 'soc', 'gpu', 'ntc', 'pcb', 'adc', 'led', 'psu', 'usb'])
const pretty = (name: string): string => {
  const words = name.replace(/_/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return name
  const out = words.map((w, i) => ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : /^[xyz]$/.test(w) ? w.toUpperCase() : i === 0 ? w[0].toUpperCase() + w.slice(1) : w)
  return out.join(' ')
}
const split = (key: string): [string, string] => {
  const i = key.indexOf(' ')
  return i < 0 ? [key, ''] : [key.slice(0, i), key.slice(i + 1)]
}
const numericSuffix = (key: string): number => Number(/^extruder(\d+)$/.exec(key)?.[1] ?? 0)

const FAN_PREFIXES = new Set(['heater_fan', 'controller_fan', 'fan_generic', 'power_fan'])
const HOST_NAME = /(^|[\s_-])(mcu|host|rpi|raspberry|pi|cpu|soc|board|chip)([\s_-]|$)/i
/** Klipper's own default for a temperature_host sensor_path. */
const DEFAULT_HOST_PATH = '/sys/class/thermal/thermal_zone0/temp'
const SKIP = new Set(['configfile', 'heaters', 'toolhead', 'print_stats', 'virtual_sdcard', 'webhooks', 'motion_report', 'system_stats'])

function sensorType (printer: Record<string, any>, key: string): Record<string, any> | undefined {
  return printer.configfile?.settings?.[key.toLowerCase()] ?? printer.configfile?.settings?.[key]
}

/**
 * The chip a host or MCU temperature is read from. Klipper lets several
 * sections read the same one (a `temperature_fan` that cools the CPU and a
 * `temperature_sensor` for it, both `temperature_host`), which drew the same
 * CPU temperature twice. Null for anything that is its own sensor.
 */
export function sameChip (printer: Record<string, any>, key: string): string | null {
  // Muon's Klipper also reports a bare `temperature_host CPU` object, which has no config section of its own.
  if (split(key)[0] === 'temperature_host') return `host:${DEFAULT_HOST_PATH}`
  const settings = sensorType(printer, key)
  if (settings?.sensor_type === 'temperature_host') return `host:${settings.sensor_path ?? DEFAULT_HOST_PATH}`
  if (settings?.sensor_type === 'temperature_mcu') return `mcu:${settings.sensor_mcu ?? 'mcu'}`
  return null
}

function boardOrHost (printer: Record<string, any>, key: string, name: string): boolean {
  if (split(key)[0] === 'temperature_host') return true
  const type = sensorType(printer, key)?.sensor_type
  if (type === 'temperature_mcu' || type === 'temperature_host') return true
  return HOST_NAME.test(name)
}

const TOOLHEAD_NAME = /toolhead|hotend|extruder|nozzle|heatsink/i

/**
 * The part of the printer a line belongs to: everything on the toolhead
 * together, the bed together, then the chamber and the machine itself (one
 * CPU, the boards, the drivers, the power supply), fans, anything else.
 */
export function groupOf (key: string, system = false): SeriesGroup {
  const [prefix, name] = split(key)
  if (/^extruder\d*$/.test(key)) return 'Toolhead'
  if (key === 'heater_bed' || /(^|[\s_-])bed([\s_-]|$)/i.test(name)) return 'Bed'
  if (/chamber/i.test(key)) return 'Chamber and system'
  if (TOOLHEAD_NAME.test(name)) return 'Toolhead'
  if (prefix === 'heater_fan') return 'Toolhead'
  if (system || HOST_NAME.test(name) || /^(temperature_host|temperature_mcu|tmc\d+|controller_fan|power_fan)$/.test(prefix) || /driver|power|supply/i.test(name)) return 'Chamber and system'
  if (key === 'fan' || prefix === 'fan_generic' || prefix === 'fan') return 'Fans'
  return prefix === 'temperature_fan' || /^tmc\d+$/.test(prefix) ? 'Chamber and system' : 'Other'
}

function heaterLabel (key: string): string {
  if (key === 'extruder') return 'Nozzle'
  if (key === 'heater_bed') return 'Bed'
  const n = /^extruder(\d+)$/.exec(key)
  if (n) return `Nozzle ${Number(n[1]) + 1}`
  return pretty(split(key)[1] || key)
}

/**
 * The lines drawn until someone picks others: the hotend(s), the bed and the
 * chamber when there is one. Everything else is a click away on its chip.
 */
export function essential (key: string): boolean {
  return /^extruder\d*$/.test(key) || key === 'heater_bed' || /chamber/i.test(key)
}

function fanLabel (key: string): string {
  if (key === 'fan') return 'Part fan'
  const name = pretty(split(key)[1] || key)
  return /fan/i.test(name) ? name : `${name} fan`
}

/** Every line the graph can draw, in display order: temperatures first, then power and speed. */
export function discoverSeries (printer: Record<string, any>): SeriesDef[] {
  const temps: Array<Omit<SeriesDef, 'color'>> = []
  const powers: Array<Omit<SeriesDef, 'color'> & { parentKey: string }> = []
  const speeds: Array<Omit<SeriesDef, 'color'> & { parentKey?: string }> = []

  const keys = Object.keys(printer)
  const base = { axis: 0 as const, scale: 1, unit: '°C' as const, kind: 'temp' as const, field: 'temperature' as const }

  const heaters = keys
    .filter(k => /^(extruder\d*|heater_bed|heater_generic .+)$/.test(k) && isNum(printer[k]?.temperature))
    .sort((a, b) => {
      const rank = (k: string) => k === 'extruder' ? 0 : k === 'heater_bed' ? 1 : k.startsWith('extruder') ? 2 : 3
      return rank(a) - rank(b) || numericSuffix(a) - numericSuffix(b) || a.localeCompare(b)
    })
  for (const key of heaters) {
    const label = heaterLabel(key)
    temps.push({ ...base, key, object: key, label, group: groupOf(key), targetKey: isNum(printer[key].target) ? `${key}Target` : undefined, defaultOn: essential(key) })
    if (isNum(printer[key].power)) powers.push({ key: `${key}Power`, object: key, field: 'power', label: `${label} power`, group: groupOf(key), kind: 'power', axis: 1, scale: 100, unit: '%', defaultOn: false, parentKey: key })
  }

  const handled = new Set(heaters)
  // One line per chip: the first section that reads it (a temperature fan before a plain sensor) keeps it.
  const chips = new Set<string>()
  const repeat = (key: string): boolean => {
    const chip = sameChip(printer, key)
    if (!chip) return false
    if (chips.has(chip)) return true
    chips.add(chip)
    return false
  }
  const fans = keys.filter(k => /^temperature_fan .+/.test(k) && isNum(printer[k]?.temperature)).sort((a, b) => a.localeCompare(b))
  for (const key of fans) {
    handled.add(key)
    if (repeat(key)) continue
    const label = pretty(split(key)[1])
    temps.push({ ...base, key, object: key, label, group: groupOf(key), targetKey: isNum(printer[key].target) ? `${key}Target` : undefined, defaultOn: essential(key) })
    if (isNum(printer[key].speed)) speeds.push({ key: `${key}Speed`, object: key, field: 'speed', label: `${label} speed`, group: groupOf(key), kind: 'speed', axis: 1, scale: 100, unit: '%', defaultOn: false, parentKey: key })
  }

  const sensors = keys
    .filter(k => !handled.has(k) && !SKIP.has(k) && !k.startsWith('gcode_macro ') && isNum(printer[k]?.temperature))
    .sort((a, b) => a.localeCompare(b))
    .filter(k => !repeat(k))
  const sensorDefs = sensors.map(key => {
    const [prefix, name] = split(key)
    const board = (prefix === 'temperature_sensor' || prefix === 'temperature_host') && boardOrHost(printer, key, name)
    const driver = /^tmc\d+$/.test(prefix)
    const group: SeriesGroup = groupOf(key, board || driver)
    const label = name ? (driver ? `${pretty(name)} driver` : pretty(name)) : pretty(prefix)
    return { ...base, key, object: key, label, group, defaultOn: essential(key) } as Omit<SeriesDef, 'color'>
  })
  temps.push(...sensorDefs)

  const plainFans = keys
    .filter(k => (k === 'fan' || FAN_PREFIXES.has(split(k)[0])) && isNum(printer[k]?.speed))
    .sort((a, b) => (a === 'fan' ? -1 : b === 'fan' ? 1 : a.localeCompare(b)))
  for (const key of plainFans) {
    speeds.push({ key: `${key}Speed`, object: key, field: 'speed', label: fanLabel(key), group: groupOf(key), kind: 'speed', axis: 1, scale: 100, unit: '%', defaultOn: false })
  }

  // Colours follow the order lines are found in, so adding a sensor never recolours the ones before it.
  const colors = new Map<string, string>()
  temps.forEach((d, i) => colors.set(d.key, PALETTE[i % PALETTE.length]))
  let next = temps.length
  const out: SeriesDef[] = temps.map(d => ({ ...d, color: colors.get(d.key)! }))
  for (const d of powers) out.push({ ...d, color: colors.get(d.parentKey)! })
  for (const d of speeds) {
    const parent = d.parentKey ? colors.get(d.parentKey) : undefined
    out.push({ ...d, color: parent ?? PALETTE[next++ % PALETTE.length] })
  }
  return arrange(out, heaters)
}

/**
 * Lines by part of the printer (GROUP_ORDER); inside a part the heater, then
 * its power, then the other sensors, then fan speeds. Stable otherwise.
 */
function arrange (defs: SeriesDef[], heaters: string[]): SeriesDef[] {
  const isHeater = new Set(heaters)
  const tier = (d: SeriesDef): number => {
    if (isHeater.has(d.key)) return 0
    if (d.kind === 'power') return 1
    return d.kind === 'temp' ? 2 : 3
  }
  return defs
    .map((d, i) => ({ d, i }))
    .sort((a, b) => GROUP_ORDER.indexOf(a.d.group) - GROUP_ORDER.indexOf(b.d.group) || tier(a.d) - tier(b.d) || a.i - b.i)
    .map(x => x.d)
}

/** Whether a line is drawn: the saved choice, else its default. */
export function isSeriesOn (def: SeriesDef, selected: SeriesSelection | undefined): boolean {
  const saved = selected?.[def.key]
  return typeof saved === 'boolean' ? saved : def.defaultOn
}

/** One history sample: a column per line and per target, as Klipper reports them. */
export function recordSample (printer: Record<string, any>, defs: SeriesDef[], date: Date = new Date()): { date: Date, [key: string]: number | Date } {
  const row: { date: Date, [key: string]: number | Date } = { date }
  for (const def of defs) {
    const object = printer[def.object]
    const value = object?.[def.field]
    if (isNum(value)) row[def.key] = value
    if (def.targetKey && isNum(object?.target)) row[def.targetKey] = object.target
  }
  return row
}
