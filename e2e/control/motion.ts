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

/** What an element's transition was at the moment a class appeared (or went), read synchronously. */
export interface ClassSeen {
  duration: string;
  easing: string;
  property: string;
  /** The computed transform, as the page reports it. */
  transform: string;
  /** The x scale of that transform (1 when none). */
  scale: number;
  /** The y translation of that transform, px (0 when none). */
  ty: number;
  /**
   * The x scale the element's classes declare, read from a probe element with
   * the same classes and `transition: none` (so it is the end value of a
   * -leave-to rule, not a point part-way along the transition).
   */
  declaredScale: number;
  /** The element's height, px. */
  height: number;
  /** Every class the element had at that moment. */
  classes: string[];
}

/**
 * Watches the document for an element matching `selector` that gets the class
 * `cls` (or, with a leading "!", loses it or is without it after a class
 * change), and records its computed transition and transform inside the
 * MutationObserver callback, before the browser has painted or a frame could
 * be skipped. The observer is installed when this resolves, so call it, act,
 * then call the function it returns for the first record (null after `ms`).
 *
 * `mark` sets `data-m3d-watch` on the element it found, so a later watch can
 * follow that very element (`[data-m3d-watch="1"]`).
 */
export async function watchClass (page: Page, selector: string, cls: string, ms = 8000, mark?: string): Promise<() => Promise<ClassSeen | null>> {
  const key = `w${Math.random().toString(36).slice(2)}`
  await page.evaluate(([sel, c, k, timeout, marker]) => {
    const absent = c.startsWith('!')
    const name = absent ? c.slice(1) : c
    const w = window as unknown as { __m3dWatch?: Record<string, Promise<ClassSeen | null>> }
    ;(w.__m3dWatch ??= {})[k] = new Promise<ClassSeen | null>(resolve => {
      const take = (el: Element): boolean => {
        if (!el.matches(sel) || el.classList.contains(name) === absent) return false
        const s = getComputedStyle(el)
        const m = s.transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(s.transform)
        // A probe with the same classes and no transition shows the value the
        // element's rules declare, whatever point its own transition is at.
        let declaredScale = m.a
        if (el.parentElement) {
          const probe = document.createElement('div')
          probe.className = el.className
          probe.style.transition = 'none'
          el.parentElement.appendChild(probe)
          const pt = getComputedStyle(probe).transform
          declaredScale = pt === 'none' ? 1 : new DOMMatrixReadOnly(pt).a
          probe.remove()
        }
        if (marker) (el as HTMLElement).dataset.m3dWatch = marker
        resolve({
          duration: s.transitionDuration,
          easing: s.transitionTimingFunction,
          property: s.transitionProperty,
          transform: s.transform,
          scale: +m.a.toFixed(3),
          ty: +m.f.toFixed(1),
          declaredScale: +declaredScale.toFixed(3),
          height: el.getBoundingClientRect().height,
          classes: Array.from(el.classList)
        })
        return true
      }
      const obs = new MutationObserver(records => {
        for (const r of records) {
          const nodes = r.type === 'attributes' ? [r.target] : Array.from(r.addedNodes)
          for (const n of nodes) {
            if (!(n instanceof Element)) continue
            const found = take(n) || (r.type === 'childList' && !absent && Array.from(n.querySelectorAll(sel)).some(take))
            if (found) return obs.disconnect()
          }
        }
      })
      obs.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
      setTimeout(() => { obs.disconnect(); resolve(null) }, timeout)
    })
  }, [selector, cls, key, ms, mark ?? ''] as const)
  return () => page.evaluate(k => (window as unknown as { __m3dWatch: Record<string, Promise<ClassSeen | null>> }).__m3dWatch[k], key)
}
