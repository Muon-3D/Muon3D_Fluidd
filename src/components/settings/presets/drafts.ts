import type { TemperaturePreset } from '@/store/config/types'

/**
 * A new preset of your own: blank (temperatures to fill in), or a copy of a
 * library entry that keeps where it came from but is yours to change.
 */
export function ownDraft (from: TemperaturePreset | null, heaters: string[]): TemperaturePreset {
  if (from) {
    return { ...from, id: -1, name: `${from.name} (mine)`, origin: 'own' }
  }
  const values: TemperaturePreset['values'] = {
    extruder: { value: '' as unknown as number, type: 'heater', active: true }
  }
  if (!heaters.length || heaters.includes('heater_bed')) values.heater_bed = { value: '' as unknown as number, type: 'heater', active: true }
  return { id: -1, name: '', values, gcode: '', origin: 'own', partFan: 100 }
}
