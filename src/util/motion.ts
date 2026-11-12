// Muon3D motion tokens, for code that animates with the Web Animations API.
// The same values are CSS custom properties in `src/scss/muon3d.scss`
// (`--m3d-motion-*`, `--m3d-ease-*`, `--m3d-spring-*`); a unit test keeps the
// two in step. The motion gallery (`src/dev/motion-gallery/`) shows each one.

export const MOTION = {
  instant: 80, // a press
  fast: 160, // hover, toggles, small things leaving
  base: 240, // menus, toasts, text swaps
  slow: 340, // panels, pages
  slower: 520, // large surfaces
  camera: 800, // the 3D camera
  stagger: 40 // between items revealed together, six at most
} as const

// Exits run at three quarters of the entry.
export const EXIT_SCALE = 0.75

export const EASE = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)', // moves that stay on screen
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)', // arrivals
  exit: 'cubic-bezier(0.4, 0, 1, 1)' // departures
} as const

export interface Spring {
  /** A CSS `linear()` easing that follows the spring. */
  css: string
  /** How long the spring takes to settle, in ms. */
  ms: number
  /** Progress at fraction `p` of `ms`. */
  at: (p: number) => number
}

// A spring as a CSS linear() curve: unit mass, the response to a step of 1,
// sampled at 33 points until it is within 0.1 % of rest.
export function spring (stiffness: number, damping: number): Spring {
  const w0 = Math.sqrt(stiffness)
  const settle = Math.log(1000) / (Math.min(damping, 1) * w0)
  const step = (t: number) => {
    if (damping >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    const wd = w0 * Math.sqrt(1 - damping * damping)
    return 1 - Math.exp(-damping * w0 * t) * (Math.cos(wd * t) + (damping * w0 / wd) * Math.sin(wd * t))
  }
  const n = 32
  const points = Array.from({ length: n + 1 }, (_, i) => i === n ? 1 : +step(settle * i / n).toFixed(4))
  return {
    css: `linear(${points.join(', ')})`,
    ms: Math.round(settle * 1000),
    at: (p: number) => p >= 1 ? 1 : step(settle * p)
  }
}

export const SPRINGS = {
  snappy: spring(520, 1), // things you touch: no overshoot
  gentle: spring(260, 0.8), // dialogs and sheets: about 1.5 % over
  bouncy: spring(300, 0.55) // the one celebration (a finished print): about 13 % over
} as const

/**
 * True when Control asks for less motion. `followMotionSetting()` (main.ts)
 * puts `m3d-reduced-motion` on the root from the Animations setting, which
 * already folds in the system's prefers-reduced-motion when set to "Like this
 * device", so the class is the one answer; reading the media query here too
 * would overrule someone who turned animations on.
 */
export function reducedMotion (): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('m3d-reduced-motion')
}

/**
 * One animation with the house rules: under reduced motion only opacity moves,
 * for at most 120 ms, with no delay.
 */
export function animate (el: Element, frames: Keyframe[], ms: number, easing: string = EASE.standard, options: KeyframeAnimationOptions = {}): Animation | null {
  if (typeof el.animate !== 'function') return null
  if (reducedMotion()) {
    frames = frames.map(f => ({ opacity: f.opacity ?? 1 }))
    ms = Math.min(ms, 120)
    easing = 'linear'
    options = { ...options, delay: 0 }
  }
  return el.animate(frames, { duration: ms, easing, fill: 'both', ...options })
}
