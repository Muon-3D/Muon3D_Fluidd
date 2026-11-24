import { loaderGone, LOADER_ID } from '../loader'
import { reducedMotion } from '@/util/motion'
import { drawFrame, PALETTES, SIZE } from './draw'
import { rasterWordmark, type LogoData } from './logo'
import { FirstPaint, LEAD, LOGO_S, type Frame, type StartupFacts } from './progress'

/**
 * First paint, on screen (KAN-5929): the rim and the printed wordmark in
 * #muon-loader, in place of its bar and wordmark. It draws on one canvas, with
 * no library; every animation frame stops when it is done, and under reduced
 * motion nothing animates at all (a still rim, the finished wordmark).
 */

const CSS = `
#${LOADER_ID}.muon-loader--first-paint .muon-loader__bar,
#${LOADER_ID}.muon-loader--first-paint .muon-loader__word,
#${LOADER_ID}.muon-loader--first-paint .muon-loader__cached { display: none !important; }
.muon-first-paint { position: relative; width: var(--muon-first-paint-size, 320px); height: var(--muon-first-paint-size, 320px); }
.muon-first-paint canvas { display: block; width: 100%; height: 100%; }
.muon-first-paint__label {
  position: absolute; left: 0; right: 0; top: 60.8%; margin: 0; transform: translateY(-50%);
  text-align: center; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.14em;
  font: 500 12px/1 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--muon-loader-muted);
}
.muon-first-paint__label[data-state=ready] { color: inherit; }
`

const FONT = '17px "Krona One"'
/** How long the wordmark waits for its typeface before it prints in the fallback. */
const FONT_WAIT_MS = 300

const now = () => performance.now() / 1000

function theme (): 'dark' | 'light' {
  return document.documentElement.dataset.muonTheme === 'light' ? 'light' : 'dark'
}

function readMark (loader: HTMLElement): number {
  const v = parseFloat(loader.style.getPropertyValue('--muon-loader-progress'))
  return Number.isFinite(v) ? v : 0
}

/** What the view needs from state.ts, passed in so the two never import each other. */
export interface Hooks {
  follow: (cb: (facts: StartupFacts) => void) => void;
  release: () => void;
}

export function mountFirstPaint ({ follow, release }: Hooks): void {
  const loader = document.getElementById(LOADER_ID)
  if (!loader) {
    release()
    return
  }
  const reduced = reducedMotion()
  const style = document.createElement('style')
  style.dataset.firstPaint = ''
  style.textContent = CSS
  document.head.appendChild(style)

  const box = document.createElement('div')
  box.className = 'muon-first-paint'
  box.dataset.tid = 'first-paint'
  box.dataset.animating = String(!reduced)
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const label = document.createElement('p')
  label.className = 'muon-first-paint__label'
  label.dataset.tid = 'first-paint-label'
  box.append(canvas, label)
  loader.classList.add('muon-loader--first-paint')
  loader.appendChild(box)
  // The page under the splash is not ready to be read until it goes.
  const app = document.getElementById('app')
  app?.setAttribute('aria-busy', 'true')
  loader.setAttribute('aria-valuemin', '0')
  loader.setAttribute('aria-valuemax', '100')

  const ctx = canvas.getContext('2d')
  const model = new FirstPaint(now(), { reduced, loaderMark: readMark(loader) })
  let logo: LogoData | null = null
  let raf = 0
  let giveUp = 0
  let finished = false
  let last: Frame | null = null

  const size = () => Math.round(Math.min(460, Math.max(240, Math.min(window.innerWidth, window.innerHeight) - 32)))
  const fit = () => {
    const css = size()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    box.style.setProperty('--muon-first-paint-size', `${css}px`)
    canvas.width = Math.round(css * dpr)
    canvas.height = Math.round(css * dpr)
  }

  const publish = (frame: Frame) => {
    if (!last || last.label !== frame.label) {
      label.textContent = frame.label
      label.dataset.state = frame.label === 'Ready' ? 'ready' : 'busy'
      loader.setAttribute('aria-valuetext', frame.label)
    }
    if (!last || last.target !== frame.target || last.stage !== frame.stage || last.outcome !== frame.outcome) {
      box.dataset.stage = String(frame.stage)
      box.dataset.target = frame.target.toFixed(2)
      box.dataset.outcome = frame.outcome
      loader.setAttribute('aria-valuenow', String(Math.round(frame.target * 100)))
    }
    if (logo) box.dataset.logo = reduced || frame.logoT >= LEAD + LOGO_S ? 'done' : 'printing'
    last = frame
  }

  const paint = (frame: Frame) => {
    if (!ctx) return
    ctx.setTransform(canvas.width / SIZE, 0, 0, canvas.height / SIZE, 0, 0)
    drawFrame(ctx, PALETTES[theme()], logo, frame, reduced)
  }

  const finish = () => {
    if (finished) return
    finished = true
    cancelAnimationFrame(raf)
    clearInterval(giveUp)
    window.removeEventListener('resize', onResize)
    box.dataset.animating = 'false'
    box.dataset.done = 'true'
    app?.removeAttribute('aria-busy')
    // The loader leaves; its fade is App's (removeLoader), which now isn't held.
    release()
    loaderGone.then(() => style.remove())
  }

  const step = () => {
    const frame = model.frame(now())
    publish(frame)
    paint(frame)
    if (frame.done) finish()
    else if (!reduced) raf = requestAnimationFrame(step)
  }
  const onResize = () => {
    fit()
    if (last) paint(last)
  }

  fit()
  window.addEventListener('resize', onResize)
  follow(facts => {
    if (finished) return
    model.update(facts, now())
    // Without animation nothing runs a loop: a change of state is the only moment to look again.
    if (reduced) step()
  })
  // Under reduced motion no loop runs, so a printer that never answers is looked at once a second.
  if (reduced) giveUp = window.setInterval(step, 1000)
  step()

  // The wordmark prints in Krona One once the face is there; its clock starts when it can be drawn.
  const typeface = document.fonts?.load ? Promise.race([document.fonts.load(FONT), new Promise(resolve => setTimeout(resolve, FONT_WAIT_MS))]) : Promise.resolve()
  typeface.catch(() => {}).then(() => {
    if (finished) return
    logo = rasterWordmark()
    model.startLogo(now())
    if (reduced) step()
  })
}
