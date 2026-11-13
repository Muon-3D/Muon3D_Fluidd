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
