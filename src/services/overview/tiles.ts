import { colourName, normaliseColour } from '@/services/control/model'

/** One line in a tile's ⋯ menu or a popover's list. */
export interface TileMenuItem {
  id: string;
  label: string;
  /** A page to go to (the printer's own, already scoped). */
  to?: string;
  /** Something to do. */
  action?: () => void;
  disabled?: boolean;
  /** A switch: `on` says which way it is. */
  toggle?: boolean;
  on?: boolean;
  /** A few words on the right ("max 300°"). */
  hint?: string;
}

/** What the Filament tile shows: one spool, by type and colour. Never an amount. */
export interface FilamentView {
  /** "PLA", or "Unknown" when nothing says. */
  type: string;
  /** "Matte Teal", "Black", or a line saying where it came from. */
  detail: string;
  colour: string | null;
  source: 'spoolman' | 'printer' | 'file' | 'none';
}

interface SpoolLike {
  filament?: { name?: string, material?: string, color_hex?: string, vendor?: { name?: string } }
}

/**
 * The spool in the printer, from the most trusted source down: the active
 * Spoolman spool, what someone said is loaded, what the print file was
 * sliced for. Nothing known says "Unknown" plainly.
 */
export function filamentView (
  spool: SpoolLike | null | undefined,
  loaded: { name: string, colour: string | null } | null,
  fromFile: { name: string, colour: string | null } | null
): FilamentView {
  const f = spool?.filament
  if (f && (f.material || f.name)) {
    const colour = normaliseColour(f.color_hex)
    const detail = [f.vendor?.name, f.name].filter(Boolean).join(' ') || colourName(colour) || 'From Spoolman'
    return { type: f.material || f.name || 'Unknown', detail, colour, source: 'spoolman' }
  }
  if (loaded?.name) {
    const colour = normaliseColour(loaded.colour)
    return { type: loaded.name, detail: colourName(colour) || 'Colour not set', colour, source: 'printer' }
  }
  if (fromFile?.name) {
    const colour = normaliseColour(fromFile.colour)
    return { type: fromFile.name, detail: [colourName(colour), 'from the print file'].filter(Boolean).join(' · '), colour, source: 'file' }
  }
  return { type: 'No material loaded', detail: 'Set it from the ⋯ menu', colour: null, source: 'none' }
}

/** Black or white writing for a spool of this colour, whichever reads. */
export function inkFor (colour: string | null): string {
  const hex = normaliseColour(colour)
  if (!hex) return 'var(--m3d-text-subtle)'
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1d1d1f' : '#f5f5f7'
}

/** "−0.045" with a real minus, three decimals. */
export function signed (value: number, decimals = 3): string {
  return `${value < 0 ? '−' : value > 0 ? '+' : ''}${Math.abs(value).toFixed(decimals)}`
}

/** "12 min", "1 h 5 min" for the job tile; "—" when not known. */
export function spanText (seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '—'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
