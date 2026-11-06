import type { TemperaturePreset } from '@/store/config/types'

/**
 * The materials every printer starts with: ABS, PETG, PLA and TPU, at the
 * temperatures the M1 prints them. They are only the starting list: once a
 * list has been saved to the printer (even after removing some of these) the
 * saved list is the whole truth and these are not added back.
 */
const DEFAULTS: Array<{ id: string, name: string, nozzle: number, bed: number }> = [
  { id: 'ec3bf8a9-bb0e-593f-b435-7eaef384fd1f', name: 'ABS', nozzle: 250, bed: 100 },
  { id: '9771ab0e-eb1e-57b9-939f-e357b5c9a4c6', name: 'PETG', nozzle: 240, bed: 80 },
  { id: 'f9be6abd-3268-5e8a-b701-42813d81ad49', name: 'PLA', nozzle: 215, bed: 60 },
  { id: '7b524586-3530-5e59-8533-460607ec7af8', name: 'TPU', nozzle: 225, bed: 50 }
]

// Ids are uuid-like strings, as a preset added in Settings gets (the type says number, but setPreset writes a uuid).
export const defaultMaterials = (): TemperaturePreset[] => DEFAULTS.map(m => ({
  id: m.id as unknown as number,
  name: m.name,
  values: {
    extruder: { value: m.nozzle, type: 'heater', active: true },
    heater_bed: { value: m.bed, type: 'heater', active: true }
  }
}))
