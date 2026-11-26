import { LEAD, LOGO_S } from './progress'

/**
 * The wordmark as pixels, each with the moment the nozzle lays it
 * (r2-loading.js). It is printed upside down, hanging from the plate: row 0 is
 * laid first and the plate rises one layer at a time.
 */
export interface LogoPixel { x: number; y: number; li: number; at: number }
export interface LogoLayer { lo: number; hi: number; dir: 1 | -1 }
export interface LogoData {
  px: LogoPixel[];
  /** Layer count: rows of the wordmark. */
  L: number;
  /** Seconds a layer takes. */
  slot: number;
  /** The share of a layer the nozzle spends moving to its start. */
  Z: number;
  layers: LogoLayer[];
  /** The raster's width in pixels. */
  W: number;
}

export const Z = 0.2
const RASTER_W = 150
const RASTER_H = 24

/**
 * Times every pixel. The first layer starts at LEAD and the last one ends at
 * LEAD + LOGO_S whatever the mask: the wordmark always takes the same time.
 */
export function layoutLogo (mask: Array<{ x: number, y: number }>, W: number): LogoData | null {
  if (!mask.length) return null
  const y0 = Math.min(...mask.map(q => q.y))
  const L = Math.max(...mask.map(q => q.y)) - y0 + 1
  const slot = LOGO_S / L
  const px: LogoPixel[] = mask.map(q => ({ x: q.x, y: q.y, li: q.y - y0, at: 0 }))
  const layers: LogoLayer[] = []
  for (let li = 0; li < L; li++) {
    const row = px.filter(q => q.li === li)
    const dir: 1 | -1 = li % 2 ? -1 : 1
    if (!row.length) {
      layers.push({ lo: 0, hi: 0, dir })
      continue
    }
    const lo = Math.min(...row.map(q => q.x))
    const hi = Math.max(...row.map(q => q.x))
    layers.push({ lo, hi, dir })
    for (const q of row) {
      const f = dir > 0 ? (q.x - lo) / (hi - lo || 1) : (hi - q.x) / (hi - lo || 1)
      q.at = LEAD + li * slot + slot * (Z + (1 - Z) * f)
    }
  }
  return { px, L, slot, Z, layers, W }
}

/** Draws MUON3D in Krona One into a small canvas and reads the lit pixels back. */
export function rasterWordmark (): LogoData | null {
  try {
    return readWordmark()
  } catch {
    // A browser that blocks reading a canvas back: the rim shows without the mark.
    return null
  }
}

function readWordmark (): LogoData | null {
  if (typeof document === 'undefined') return null
  const o = document.createElement('canvas')
  o.width = RASTER_W
  o.height = RASTER_H
  const g = o.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.font = '400 17px "Krona One", sans-serif'
  g.textBaseline = 'middle'
  g.textAlign = 'center'
  g.fillText('MUON3D', RASTER_W / 2, RASTER_H / 2)
  const d = g.getImageData(0, 0, RASTER_W, RASTER_H).data
  const mask: Array<{ x: number, y: number }> = []
  for (let y = 0; y < RASTER_H; y++) {
    for (let x = 0; x < RASTER_W; x++) {
      if (d[(y * RASTER_W + x) * 4 + 3] > 110) mask.push({ x, y })
    }
  }
  return layoutLogo(mask, RASTER_W)
}
