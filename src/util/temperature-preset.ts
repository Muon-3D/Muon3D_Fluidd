import type { TemperaturePreset } from '@/store/config/types'
import { DEFAULT_MATERIALS } from '@/store/config/default-materials'

/** The G-code a temperature preset sends: each active heater and fan target, then its own G-code. */
export function presetCommands (preset: TemperaturePreset): string[] {
  const commands: string[] = []
  for (const key in preset.values ?? {}) {
    const item = preset.values[key]
    if (!item.active || item.value <= -1) continue
    if (item.type === 'heater') commands.push(`SET_HEATER_TEMPERATURE HEATER=${key} TARGET=${item.value}`)
    if (item.type === 'fan') commands.push(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${key} TARGET=${item.value}`)
  }
  if (preset.gcode) commands.push(preset.gcode)
  return commands
}

/** "215° / 60°": the active heaters' targets, nozzle first. */
export function presetSummary (preset: TemperaturePreset): string {
  return Object.entries(preset.values ?? {})
    .filter(([, v]) => v.type === 'heater' && v.active && v.value > -1)
    .sort(([a], [b]) => (a === 'extruder' ? -1 : b === 'extruder' ? 1 : a.localeCompare(b)))
    .map(([, v]) => `${v.value}°`)
    .join(' / ')
}

export interface ExtrudeTemperature {
  /** The nozzle target for extruding by hand. */
  temp: number
  /** The material it is for, or null when none says. */
  material: string | null
}

const nozzleOf = (preset: TemperaturePreset | undefined): number | null => {
  const v = preset?.values?.extruder
  return v && v.active && v.type === 'heater' && v.value > 0 ? v.value : null
}

const named = (presets: TemperaturePreset[], name: string) =>
  presets.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase())

/**
 * What Extrude by hand heats the nozzle to (KAN-1967): the loaded
 * material's nozzle temperature from the printer's materials, else the
 * printer's default material (PLA, one of the defaults every printer has),
 * kept between the extruder's minimum extrude temperature and its maximum.
 */
export function extrudeTemperature (presets: TemperaturePreset[], loaded: string | null, limits: { min: number, max: number }): ExtrudeTemperature {
  const fallback = DEFAULT_MATERIALS.find(m => m.name === 'PLA') ?? DEFAULT_MATERIALS[0]
  const loadedTemp = loaded ? nozzleOf(named(presets, loaded)) : null
  const choice = loadedTemp !== null
    ? { temp: loadedTemp, material: named(presets, loaded as string)?.name ?? loaded }
    : { temp: nozzleOf(named(presets, fallback.name)) ?? fallback.nozzle, material: fallback.name }
  const temp = Math.round(Math.min(limits.max, Math.max(limits.min, choice.temp)))
  return { temp, material: choice.material }
}
