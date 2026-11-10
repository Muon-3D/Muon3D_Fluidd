import { appPainted } from '@/services/startup/idle'

/**
 * When the Overview puts up the live M1 (KAN-2013). Building it (three.js,
 * the model, its shaders) holds the page for seconds on a slow device, so
 * the Overview first draws with the stage's picture and becomes usable;
 * the live stage mounts once the app has painted, the browser is idle and
 * the page has been quiet (no input) for QUIET_INPUT_MS since the Overview
 * asked, or after MAX_WAIT_MS whatever happens. So the Overview always has
 * a usable stretch before the build, and a person busy with it is not
 * frozen mid-click.
 */

/** No pointer, key, wheel or touch for this long (counted from the ask) and the live stage may mount. */
export const QUIET_INPUT_MS = 1200
/** The live stage never waits longer than this after the app has painted. */
export const MAX_WAIT_MS = 10_000

const INPUTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

let lastInput = 0
let listening = false
const noteInput = () => { lastInput = performance.now() }

function listen () {
  if (listening || typeof window === 'undefined') return
  listening = true
  for (const type of INPUTS) window.addEventListener(type, noteInput, { capture: true, passive: true })
}
listen()

const idle = (timeout: number): Promise<void> => new Promise(resolve => {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback
  if (ric) ric(() => resolve(), { timeout })
  else setTimeout(resolve, Math.min(timeout, 200))
})

/** Resolves when the live stage may mount: see the module comment. */
export async function liveStageMayMount (): Promise<void> {
  const asked = performance.now()
  await appPainted()
  const deadline = performance.now() + MAX_WAIT_MS
  for (;;) {
    const left = deadline - performance.now()
    if (left <= 0) return
    await idle(Math.max(1, Math.min(left, 3000)))
    const quietFor = performance.now() - Math.max(lastInput, asked)
    if (quietFor >= QUIET_INPUT_MS || performance.now() >= deadline) return
    await new Promise(resolve => setTimeout(resolve, Math.min(QUIET_INPUT_MS - quietFor, Math.max(0, deadline - performance.now()))))
  }
}

let liveStage: Promise<typeof import('@/components/m1/M1Live.vue')> | null = null
/** The live M1's component, in its own chunk with what only it needs. */
export const loadLiveStage = () => (liveStage ??= import('@/components/m1/M1Live.vue'))
