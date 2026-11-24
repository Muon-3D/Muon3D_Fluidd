import Vue from 'vue'
import type { StartupFacts } from './progress'

/**
 * The thin, always-loaded side of first paint (KAN-5929): whether the loader
 * is being held for it, and a place for App to report what start-up has
 * reached. The drawing and the model load only when the flag is on
 * (view.ts), so with the flag off none of it is fetched or run.
 */
export const firstPaintState = Vue.observable({ holding: false })

let sink: ((facts: StartupFacts) => void) | null = null
let latest: StartupFacts | null = null

/** From now the index.html loader stays until first paint says it is done. */
export function holdLoaderForFirstPaint (): void {
  firstPaintState.holding = true
}

export function releaseLoaderFromFirstPaint (): void {
  firstPaintState.holding = false
  sink = null
}

/** App: what start-up has reached. */
export function reportStartup (facts: StartupFacts): void {
  latest = facts
  sink?.(facts)
}

/** The view: be told what start-up has reached, starting with the last report. */
export function followStartupFacts (cb: (facts: StartupFacts) => void): void {
  sink = cb
  if (latest) cb(latest)
}

/** Starts first paint: the loader waits, and the view is fetched. If it can't be, the loader goes as it always did. */
export function startFirstPaint (): void {
  holdLoaderForFirstPaint()
  import('./view').then(m => m.mountFirstPaint({ follow: followStartupFacts, release: releaseLoaderFromFirstPaint })).catch(() => releaseLoaderFromFirstPaint())
}
