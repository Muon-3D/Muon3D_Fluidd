import type { TemperaturePreset } from '@/store/config/types'

export interface LibraryRange {
  min: number;
  max: number;
  default: number;
}

/** One maker's filament, read-only. Temperatures are the maker's published range. */
export interface LibraryEntry {
  id: string;
  brand: string;
  name: string;
  type: string;
  colour: string;
  diameter: number;
  nozzle: LibraryRange;
  bed: LibraryRange;
  fan: number;
  abrasive: boolean;
  testedOnM1: boolean;
}

export interface LibraryChip {
  id: string;
  label: string;
  matches: (entry: LibraryEntry) => boolean;
}

const base = (type: string) => type.replace(/-(CF|GF)$/, '')

export const LIBRARY_CHIPS: LibraryChip[] = [
  { id: 'pla', label: 'PLA', matches: e => base(e.type) === 'PLA' },
  { id: 'petg', label: 'PETG', matches: e => ['PETG', 'PET'].includes(base(e.type)) },
  { id: 'abs', label: 'ABS/ASA', matches: e => ['ABS', 'ASA'].includes(base(e.type)) },
  { id: 'tpu', label: 'TPU', matches: e => base(e.type) === 'TPU' },
  { id: 'pa-pc', label: 'PA / PC', matches: e => ['PA', 'PC'].includes(base(e.type)) },
  { id: 'cf', label: 'Carbon fibre', matches: e => e.abrasive },
  { id: 'tested', label: 'Tested on M1', matches: e => e.testedOnM1 }
]

export interface LibraryQuery {
  text?: string;
  brand?: string | null;
  chips?: string[];
}

/** "PolyLite PLA" stays as is; a Generic entry is just its name. */
export function entryTitle (entry: LibraryEntry): string {
  return entry.name
}

/** The name a material gets on the printer, unique across brands. */
export function entryPresetName (entry: LibraryEntry): string {
  return entry.brand === 'Generic' ? entry.name : `${entry.brand} ${entry.name}`
}

export function entrySource (entry: LibraryEntry): string {
  return entry.brand === 'Generic' ? `Generic ${entry.name}` : `${entry.brand} ${entry.name}`
}

/** Search matches brand, name and type, every word; brand and chips stack on top. */
export function searchLibrary (entries: LibraryEntry[], query: LibraryQuery): LibraryEntry[] {
  const words = (query.text ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  const chips = LIBRARY_CHIPS.filter(c => query.chips?.includes(c.id))
  return entries.filter(entry => {
    if (query.brand && entry.brand !== query.brand) return false
    if (!chips.every(c => c.matches(entry))) return false
    const hay = `${entry.brand} ${entry.name} ${entry.type}`.toLowerCase()
    return words.every(w => hay.includes(w))
  })
}

export function brandCounts (entries: LibraryEntry[]): Array<{ brand: string, count: number }> {
  const counts = new Map<string, number>()
  entries.forEach(e => counts.set(e.brand, (counts.get(e.brand) ?? 0) + 1))
  return [...counts].map(([brand, count]) => ({ brand, count }))
}

export function rangeText (range: LibraryRange): string {
  return range.min === range.max ? `${range.min}°` : `${range.min}–${range.max}°`
}

/** The printer-local copy of a library entry; it works offline from here on. */
export function presetFromEntry (
  entry: LibraryEntry,
  extruder = 'extruder',
  bed: string | null = 'heater_bed'
): TemperaturePreset {
  const values: TemperaturePreset['values'] = {
    [extruder]: { value: entry.nozzle.default, type: 'heater', active: true }
  }
  if (bed) values[bed] = { value: entry.bed.default, type: 'heater', active: true }
  return {
    id: -1,
    name: entryPresetName(entry),
    values,
    gcode: '',
    origin: 'library',
    libraryId: entry.id,
    source: entrySource(entry),
    type: entry.type,
    colour: entry.colour,
    partFan: entry.fan,
    maker: {
      nozzle: [entry.nozzle.min, entry.nozzle.max],
      bed: [entry.bed.min, entry.bed.max]
    }
  }
}

type Loader = () => Promise<{ entries: LibraryEntry[] }>

/** Shipped with the app as its own file, fetched (not imported) so a failed load can be tried again. */
const LIBRARY_URL = new URL('./library.json', import.meta.url).href

const bundled: Loader = async () => {
  const response = await fetch(LIBRARY_URL)
  if (!response.ok) throw new Error(`The material library did not load (${response.status})`)
  return await response.json()
}

/**
 * The material library. Today it is bundled with the app; a cloud catalogue can
 * replace the loader later without the UI changing. A failed load is not cached,
 * so Retry tries again.
 */
export class MaterialLibrary {
  private pending: Promise<LibraryEntry[]> | null = null
  private readonly loader: Loader

  constructor (loader: Loader = bundled) {
    this.loader = loader
  }

  load (): Promise<LibraryEntry[]> {
    if (!this.pending) {
      this.pending = this.loader()
        .then(data => {
          if (!Array.isArray(data?.entries)) throw new Error('The material library is malformed')
          return data.entries
        })
        .catch(error => {
          this.pending = null
          throw error
        })
    }
    return this.pending
  }
}

export const materialLibrary = new MaterialLibrary()
