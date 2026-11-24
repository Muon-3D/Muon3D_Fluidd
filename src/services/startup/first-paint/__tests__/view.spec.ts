import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountFirstPaint } from '../view'
import type { StartupFacts } from '../progress'

const noop = () => {}
const fakeContext = new Proxy({}, { get: (_t, key) => key === 'canvas' ? undefined : noop, set: () => true }) as unknown as CanvasRenderingContext2D

const up: StartupFacts = { loaderMark: 0.8, routerReady: true, screen: null, socketOpen: true, klippyState: 'ready', klippyConnected: true, socketReady: true }
const starting: StartupFacts = { ...up, klippyState: 'startup', klippyConnected: false, socketReady: false }
const unreachable: StartupFacts = { ...up, screen: 'unreachable', socketOpen: false }

function setup () {
  document.body.innerHTML = '<div id="muon-loader" role="progressbar"><div class="muon-loader__bar"></div><div class="muon-loader__word"></div></div>'
  let push: (f: StartupFacts) => void = noop
  const release = vi.fn()
  const follow = (cb: (f: StartupFacts) => void) => { push = cb }
  mountFirstPaint({ follow, release })
  return { push: (f: StartupFacts) => push(f), release, loader: document.getElementById('muon-loader')!, box: () => document.querySelector<HTMLElement>('[data-tid=first-paint]')!, label: () => document.querySelector('[data-tid=first-paint-label]')!.textContent }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext as never)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.documentElement.classList.remove('m3d-reduced-motion')
  document.head.querySelectorAll('style[data-first-paint]').forEach(s => s.remove())
  document.body.innerHTML = ''
})

describe('first paint, on screen', () => {
  it("takes the loader's place: a canvas and the real step's name as text", () => {
    const s = setup()
    expect(s.loader.classList.contains('muon-loader--first-paint')).toBe(true)
    expect(s.box().querySelector('canvas')).not.toBeNull()
    expect(s.label()).toBe('Opening Control')
    s.push(starting)
    vi.advanceTimersByTime(50)
    expect(s.label()).toBe('Starting Klipper')
    expect(s.box().dataset.stage).toBe('2')
    expect(s.box().dataset.target).toBe('0.50')
    expect(s.loader.getAttribute('aria-valuetext')).toBe('Starting Klipper')
    expect(s.release).not.toHaveBeenCalled()
  })

  it('keeps drawing while start-up stalls, and lets go once it is ready and the logo is done', () => {
    const s = setup()
    const frames = vi.fn()
    const raf = window.requestAnimationFrame
    window.requestAnimationFrame = cb => { frames(); return raf(cb) }
    s.push(starting)
    vi.advanceTimersByTime(3000)
    expect(s.release).not.toHaveBeenCalled()
    expect(s.box().dataset.target).toBe('0.50')
    s.push(up)
    vi.advanceTimersByTime(1000)
    // The logo takes its full time even though the printer was quick.
    expect(s.release).not.toHaveBeenCalled()
    vi.advanceTimersByTime(4000)
    expect(s.release).toHaveBeenCalledTimes(1)
    expect(s.label()).toBe('Ready')
    expect(s.box().dataset.done).toBe('true')
    // No animation frame is asked for after it is done.
    const after = frames.mock.calls.length
    vi.advanceTimersByTime(2000)
    expect(frames.mock.calls.length).toBe(after)
  })

  it('hands over at once when the printer cannot be reached', () => {
    const s = setup()
    s.push(unreachable)
    vi.advanceTimersByTime(50)
    expect(s.release).toHaveBeenCalledTimes(1)
  })

  it('lets go after the give-up time if nothing ever reports', () => {
    const s = setup()
    vi.advanceTimersByTime(19_000)
    expect(s.release).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000)
    expect(s.release).toHaveBeenCalledTimes(1)
  })

  it('under reduced motion it asks for no animation frame at all, and does not wait for the logo', () => {
    document.documentElement.classList.add('m3d-reduced-motion')
    const frames = vi.spyOn(window, 'requestAnimationFrame')
    const s = setup()
    expect(s.box().dataset.animating).toBe('false')
    s.push(starting)
    vi.advanceTimersByTime(2000)
    expect(s.box().dataset.target).toBe('0.50')
    s.push(up)
    expect(s.release).toHaveBeenCalledTimes(1)
    expect(s.label()).toBe('Ready')
    expect(frames).not.toHaveBeenCalled()
  })

  it('does nothing, and lets the loader go, when there is no loader', () => {
    document.body.innerHTML = ''
    const release = vi.fn()
    mountFirstPaint({ follow: noop, release })
    expect(release).toHaveBeenCalledTimes(1)
  })
})
