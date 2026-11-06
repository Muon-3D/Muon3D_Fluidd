import type { TemperaturePreset } from '@/store/config/types'

/**
 * The materials every printer starts with: ABS, PETG, PLA and TPU, at the
 * temperatures the M1 prints them. They are only the starting list: once a
 * list has been saved to the printer (even after removing some of these) the
 * saved list is the whole truth and these are not added back.
 */
const DEFAULTS: Array<{ id: number, name: string, nozzle: number, bed: number }> = [
  { id: 9001, name: 'ABS', nozzle: 250, bed: 100 },
  { id: 9002, name: 'PETG', nozzle: 240, bed: 80 },
  { id: 9003, name: 'PLA', nozzle: 215, bed: 60 },
  { id: 9004, name: 'TPU', nozzle: 225, bed: 50 }
]

export const defaultMaterials = (): TemperaturePreset[] => DEFAULTS.map(m => ({
  id: m.id,
  name: m.name,
  values: {
    extruder: { value: m.nozzle, type: 'heater', active: true },
    heater_bed: { value: m.bed, type: 'heater', active: true }
  }
}))
