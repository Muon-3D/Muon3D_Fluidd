import { describe, expect, it } from 'vitest'
import { gcodeShapeRendering, modelAnimates, modelDetail, modelRenderOptions } from '../render-options'

const base = { animations: null, reducedMotion: false, devicePixelRatio: 3, width: 1000 }

describe('modelRenderOptions', () => {
  it('draws high as it always did: up to 2x pixels (1.5x on a small stage), 1024 shadows, real glass', () => {
    expect(modelRenderOptions({ ...base, detail: 'high' })).toEqual({ pixelRatio: 2, shadows: true, shadowMapSize: 1024, cheapGlass: false, animate: true })
    expect(modelRenderOptions({ ...base, detail: 'high', width: 400 }).pixelRatio).toBe(1.5)
  })

  it('draws medium with fewer pixels, a smaller shadow and plain glass', () => {
    expect(modelRenderOptions({ ...base, detail: 'medium' })).toEqual({ pixelRatio: 1.25, shadows: true, shadowMapSize: 512, cheapGlass: true, animate: true })
  })

  it('draws low at one pixel a pixel, with no shadow', () => {
    expect(modelRenderOptions({ ...base, detail: 'low' })).toMatchObject({ pixelRatio: 1, shadows: false, cheapGlass: true })
  })

  it('never draws more pixels than the screen has', () => {
    expect(modelRenderOptions({ ...base, detail: 'high', devicePixelRatio: 1 }).pixelRatio).toBe(1)
    expect(modelRenderOptions({ ...base, detail: 'medium', devicePixelRatio: 0 }).pixelRatio).toBe(1)
  })

  it('reads an unknown or missing detail as high', () => {
    expect(modelDetail(undefined)).toBe('high')
    expect(modelDetail('ultra')).toBe('high')
    expect(modelRenderOptions({ ...base, detail: null }).shadowMapSize).toBe(1024)
  })
})

describe('animations', () => {
  it('follow prefers-reduced-motion until set', () => {
    expect(modelAnimates(null, false)).toBe(true)
    expect(modelAnimates(undefined, true)).toBe(false)
  })

  it('are what the setting says once it is set', () => {
    expect(modelAnimates(true, true)).toBe(true)
    expect(modelAnimates(false, false)).toBe(false)
    expect(modelRenderOptions({ ...base, detail: 'high', animations: false }).animate).toBe(false)
  })
})

describe('gcodeShapeRendering', () => {
  it('draws the preview for speed at low detail or while panning', () => {
    expect(gcodeShapeRendering('low', false)).toBe('optimizeSpeed')
    expect(gcodeShapeRendering('high', true)).toBe('optimizeSpeed')
    expect(gcodeShapeRendering('medium', false)).toBe('geometricPrecision')
  })
})
