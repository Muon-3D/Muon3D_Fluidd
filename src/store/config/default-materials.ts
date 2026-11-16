import type { TemperaturePreset } from '@/store/config/types'

/**
 * The materials every printer has: ABS, PETG, PLA and TPU, at the temperatures
 * the M1 prints them. They are always on the printer's list (they can be
 * changed and unpinned, not deleted), so the store adds back any a saved list
 * lacks without writing them.
 */
export const DEFAULT_MATERIALS: ReadonlyArray<{ id: string, name: string, nozzle: number, bed: number, fan: number, colour: string, maker: { nozzle: [number, number], bed: [number, number] } }> = [
  { id: 'ec3bf8a9-bb0e-593f-b435-7eaef384fd1f', name: 'ABS', nozzle: 250, bed: 100, fan: 0, colour: '#E0C060', maker: { nozzle: [230, 270], bed: [90, 110] } },
  { id: '9771ab0e-eb1e-57b9-939f-e357b5c9a4c6', name: 'PETG', nozzle: 240, bed: 80, fan: 40, colour: '#5FB0D8', maker: { nozzle: [220, 260], bed: [70, 90] } },
  { id: 'f9be6abd-3268-5e8a-b701-42813d81ad49', name: 'PLA', nozzle: 215, bed: 60, fan: 100, colour: '#F2F2EE', maker: { nozzle: [190, 240], bed: [50, 70] } },
  { id: '7b524586-3530-5e59-8533-460607ec7af8', name: 'TPU', nozzle: 225, bed: 50, fan: 50, colour: '#D86A6A', maker: { nozzle: [210, 240], bed: [40, 60] } }
]

const DEFAULT_IDS = new Set(DEFAULT_MATERIALS.map(m => m.id))
const DEFAULT_NAMES = new Set(DEFAULT_MATERIALS.map(m => m.name.toLowerCase()))

/** True for PLA, PETG, ABS and TPU, the ones that cannot be deleted. */
export const isDefaultMaterial = (preset: Pick<TemperaturePreset, 'id' | 'name'>): boolean =>
  DEFAULT_IDS.has(String(preset.id)) || DEFAULT_NAMES.has(preset.name.trim().toLowerCase())

// Ids are uuid-like strings, as a preset added in Settings gets (the type says number, but setPreset writes a uuid).
export const defaultMaterials = (): TemperaturePreset[] => DEFAULT_MATERIALS.map(m => ({
  id: m.id as unknown as number,
  name: m.name,
  origin: 'default',
  source: `Generic ${m.name}`,
  type: m.name,
  colour: m.colour,
  partFan: m.fan,
  maker: { nozzle: [...m.maker.nozzle], bed: [...m.maker.bed] },
  values: {
    extruder: { value: m.nozzle, type: 'heater', active: true },
    heater_bed: { value: m.bed, type: 'heater', active: true }
  }
}))

/** The saved list with any default it lacks added back (not written until changed). */
export function withDefaultMaterials (saved: TemperaturePreset[]): TemperaturePreset[] {
  const missing = defaultMaterials().filter(d => !saved.some(p => String(p.id) === String(d.id) || p.name.trim().toLowerCase() === d.name.toLowerCase()))
  return [
    ...saved.map(p => (isDefaultMaterial(p) && !p.origin ? { ...p, origin: 'default' as const } : p)),
    ...missing
  ]
}
