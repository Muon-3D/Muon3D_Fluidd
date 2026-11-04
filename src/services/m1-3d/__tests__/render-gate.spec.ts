import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderGate } from '../render-gate'

let hidden = false
let intersect: ((e: Partial<IntersectionObserverEntry>[]) => void) | null = null

beforeEach(() => {
  hidden = false
  intersect = null
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') })
  vi.stubGlobal('IntersectionObserver', class {
    constructor (cb: (e: Partial<IntersectionObserverEntry>[]) => void) { intersect = cb }
    observe () {}
    disconnect () {}
  })
})
afterEach(() => { vi.unstubAllGlobals() })

describe('the 3D view render gate', () => {
  it('closes when the tab is hidden and opens when it shows again', () => {
    const seen: boolean[] = []
    const gate = createRenderGate(document.createElement('canvas'), o => seen.push(o))
    expect(gate.open).toBe(true)
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    expect(gate.open).toBe(false)
    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    expect(gate.open).toBe(true)
    expect(seen).toEqual([false, true])
    gate.dispose()
  })

  it('closes while the canvas is off screen', () => {
    const seen: boolean[] = []
    const gate = createRenderGate(document.createElement('canvas'), o => seen.push(o))
    intersect?.([{ isIntersecting: false }])
    expect(gate.open).toBe(false)
    intersect?.([{ isIntersecting: true }])
    expect(seen).toEqual([false, true])
    gate.dispose()
  })

  it('stays closed while switched off, however visible', () => {
    const seen: boolean[] = []
    const gate = createRenderGate(document.createElement('canvas'), o => seen.push(o))
    gate.setActive(false)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(gate.open).toBe(false)
    expect(seen).toEqual([false])
    gate.dispose()
  })

  it('stops listening once disposed', () => {
    const seen: boolean[] = []
    const gate = createRenderGate(document.createElement('canvas'), o => seen.push(o))
    gate.dispose()
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    expect(seen).toEqual([])
  })
})
