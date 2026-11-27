import type { LogoData } from './logo'
import { LEAD, LOGO_S, type Frame } from './progress'

/**
 * The picture, on a 480 x 480 canvas (design lab r2-loading.js, ported: the
 * rim and the printed wordmark; the step's name is real text in the page).
 */
export const SIZE = 480
const C = SIZE / 2
const TAU = Math.PI * 2

export interface Palette {
  ink: string;
  mute: string;
  faint: string;
  line: string;
  teal: string;
  amber: string;
  /** What the nozzle is filled with: the page's own background. */
  bg: string;
}

/** Control's glass tokens (muon3d-glass.scss), with the lab's amber for a fresh layer. */
export const PALETTES: Record<'dark' | 'light', Palette> = {
  dark: { bg: '#000000', ink: '#f5f5f7', mute: '#98989d', faint: 'rgba(255,255,255,.07)', line: 'rgba(255,255,255,.16)', teal: '#80d6d1', amber: '#e8b04b' },
  light: { bg: '#f2f2f7', ink: '#1d1d1f', mute: '#6e6e73', faint: 'rgba(15,23,25,.08)', line: 'rgba(15,23,25,.18)', teal: '#1e7f79', amber: '#d38d1b' }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const ease = (t: number) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)

/** The rim: 132 dots in three rows. `p` is filled, `head` is the comet, `fin` the closing sweep. */
export function drawRim (ctx: CanvasRenderingContext2D, pal: Palette, p: number, head: number, fin: number): void {
  const N = 132
  const ROWS = 3
  for (let i = 0; i < N; i++) {
    const f = i / N
    const a = -Math.PI / 2 + f * TAU
    const done = f < p
    let glow = 0
    if (fin < 0 && head >= 0) {
      glow = (head - f + 1) % 1
      glow = glow < 0.16 ? 1 - glow / 0.16 : 0
    }
    const swept = fin >= 0 && f < fin
    const hot = swept && f > fin - 0.2 && fin < 1.2
    for (let r = 0; r < ROWS; r++) {
      const dither = glow > 0 && ((i + r) % 2 === 0 || glow > 0.55)
      const on = swept || (done ? (r < 2 || dither) : dither && glow > (r + 1) / 4)
      if (!on && r !== 0) continue
      const rr = 226 - r * 6.2
      ctx.save()
      ctx.translate(C + Math.cos(a) * rr, C + Math.sin(a) * rr)
      ctx.rotate(a)
      ctx.fillStyle = !on ? pal.faint : hot || (dither && glow > 0) ? pal.teal : pal.ink
      ctx.globalAlpha = on && !done && !swept ? glow : 1
      ctx.fillRect(-2.4, -2.4, 4.8, 4.8)
      ctx.restore()
    }
  }
  ctx.globalAlpha = 1
}

/**
 * The wordmark printed hanging from the plate, with the nozzle below it. `t`
 * is seconds since the logo began; `finished` skips the print and shows the
 * whole mark (reduced motion).
 */
export function drawLogo (ctx: CanvasRenderingContext2D, pal: Palette, G: LogoData, t: number, finished: boolean, leaving: number): void {
  const S = 2.5
  const x0 = C - G.W / 2 * S
  const yN = 214 + G.L * S / 2
  const tt = t - LEAD
  const li = clamp(Math.floor(tt / G.slot), 0, G.L - 1)
  const f = clamp((tt - li * G.slot) / G.slot, 0, 1)
  const started = finished || tt >= LOGO_S ? G.L : tt < 0 ? 0 : li + (f < G.Z ? ease(f / G.Z) : 1)
  const yTop = yN - started * S
  const lay = G.layers[li]
  const startX = (l: { lo: number, hi: number, dir: number }) => l.dir > 0 ? l.lo : l.hi
  const endX = (l: { lo: number, hi: number, dir: number }) => l.dir > 0 ? l.hi : l.lo
  let nx: number
  if (tt < 0) nx = startX(G.layers[0]) - 60 * (1 - easeOut(1 + tt / LEAD))
  else if (tt >= LOGO_S) nx = endX(G.layers[G.L - 1])
  else if (f < G.Z) {
    const from = li ? endX(G.layers[li - 1]) : startX(lay)
    nx = from + (startX(lay) - from) * ease(f / G.Z)
  } else nx = startX(lay) + (endX(lay) - startX(lay)) * (f - G.Z) / (1 - G.Z)
  // The nozzle and plate leave once the logo is done (or never show, finished).
  const away = finished ? 1 : clamp((t - (LEAD + LOGO_S)) / 0.5, 0, 1)

  if (away < 1) {
    ctx.globalAlpha = (1 - away) * clamp(t / 0.3, 0, 1)
    ctx.fillStyle = pal.mute
    ctx.fillRect(x0 + 6, yTop - 5, G.W * S - 12, 2.5)
    ctx.fillStyle = pal.line
    ctx.fillRect(x0 + 6, yN + 25, G.W * S - 12, 1.5)
    ctx.globalAlpha = 1
  }
  // The logo so far. A fresh pixel is hot, then cools to ink.
  const glint = !finished && leaving < 0 && tt > LOGO_S + 0.8 ? ((t - (LEAD + LOGO_S)) % 2.6) / 0.7 : -1
  for (const q of G.px) {
    const age = finished ? Infinity : t - q.at
    if (age < 0) continue
    const x = x0 + q.x * S
    const y = yTop + q.li * S
    ctx.fillStyle = pal.ink
    ctx.fillRect(x, y, S - 0.4, S - 0.4)
    if (age < 0.55) {
      ctx.globalAlpha = 1 - age / 0.55
      ctx.fillStyle = pal.amber
      ctx.fillRect(x, y, S - 0.4, S - 0.4)
      ctx.globalAlpha = 1
    } else if (glint >= 0 && glint < 1) {
      const band = Math.abs((q.x + q.li * 1.4) / (G.W + 20) - glint)
      if (band < 0.035) {
        ctx.fillStyle = pal.teal
        ctx.fillRect(x, y, S - 0.4, S - 0.4)
      }
    }
  }
  // The nozzle, pointing up. It stays at one height: the plate does the rising.
  if (away < 1) {
    const sx = x0 + nx * S + S / 2
    const sy = yN + 1.5 + away * 16
    ctx.globalAlpha = 1 - away
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx - 6, sy + 9.5)
    ctx.lineTo(sx - 6, sy + 23)
    ctx.lineTo(sx + 6, sy + 23)
    ctx.lineTo(sx + 6, sy + 9.5)
    ctx.closePath()
    ctx.fillStyle = pal.bg
    ctx.fill()
    ctx.strokeStyle = pal.ink
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
    if (tt >= 0 && tt < LOGO_S && f >= G.Z) {
      ctx.fillStyle = pal.amber
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3)
    }
    ctx.globalAlpha = 1
  }
}

/** One frame. The canvas is transparent: the loader's own background shows through. */
export function drawFrame (ctx: CanvasRenderingContext2D, pal: Palette, logo: LogoData | null, frame: Frame, reduced: boolean): void {
  ctx.clearRect(0, 0, SIZE, SIZE)
  drawRim(ctx, pal, frame.rim, frame.head, frame.fin)
  if (logo) drawLogo(ctx, pal, logo, frame.logoT, reduced, frame.fin)
}
