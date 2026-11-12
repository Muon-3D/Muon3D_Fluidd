/**
 * Shared helpers for the motion e2e tests (KAN-2257).
 */
import type { Page } from '@playwright/test'

export interface FrameTimes {
  frames: number;
  /** Median frame interval, ms. */
  p50: number;
  /** 95th percentile frame interval, ms. */
  p95: number;
  /** Longest frame interval, ms. */
  worst: number;
}

/**
 * Starts recording requestAnimationFrame intervals in the page now and
 * resolves with their spread after `ms`. Start it, act, then await it.
 */
export function frameTimes (page: Page, ms: number): Promise<FrameTimes> {
  return page.evaluate(duration => new Promise<FrameTimes>(resolve => {
    const gaps: number[] = []
    let last = 0
    const end = performance.now() + duration
    const tick = (now: number) => {
      if (last) gaps.push(now - last)
      last = now
      if (now < end) return requestAnimationFrame(tick)
      gaps.sort((a, b) => a - b)
      const at = (q: number) => +(gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))] ?? 0).toFixed(1)
      resolve({ frames: gaps.length, p50: at(0.5), p95: at(0.95), worst: at(1) })
    }
    requestAnimationFrame(tick)
  }), ms)
}

export interface MotionSample {
  /** ms since the element appeared. */
  t: number;
  opacity: number;
  /** The x scale of the element's transform (1 when none). */
  scale: number;
  /** The y translation of the element's transform, px. */
  y: number;
  /** Whether any of it is inside the viewport (a menu is measured off screen first). */
  onScreen: boolean;
}

/**
 * Starts watching for the first element matching `selector` and samples its
 * opacity and transform every frame for `ms` once it is first on screen. Start it, act,
 * then await it.
 */
export function sampleMotion (page: Page, selector: string, ms: number): Promise<MotionSample[]> {
  return page.evaluate(([sel, duration]) => new Promise<MotionSample[]>(resolve => {
    const out: MotionSample[] = []
    let t0 = 0
    const read = (el: Element, now: number) => {
      const s = getComputedStyle(el)
      const m = s.transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(s.transform)
      const r = el.getBoundingClientRect()
      const onScreen = r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight && s.visibility !== 'hidden'
      out.push({ t: Math.round(now - t0), opacity: +(+s.opacity).toFixed(3), scale: +m.a.toFixed(3), y: +m.f.toFixed(1), onScreen })
    }
    const tick = (now: number) => {
      const el = Array.from(document.querySelectorAll(sel)).find(e => (e as HTMLElement).offsetParent !== null || getComputedStyle(e).position === 'fixed')
      if (el) {
        const r = el.getBoundingClientRect()
        const visible = r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight
        // Before it is first on screen (Vuetify measures a menu off screen), nothing counts.
        if (!t0 && visible) t0 = now
        if (t0) read(el, now)
      }
      if (t0 && now - t0 > duration) return resolve(out)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    setTimeout(() => resolve(out), duration + 10000)
  }), [selector, ms] as const)
}
