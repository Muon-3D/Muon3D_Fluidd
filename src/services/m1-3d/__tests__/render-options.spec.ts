import { describe, expect, it } from 'vitest'
import { gcodeShapeRendering, glassChoice, modelAnimates, modelDetail, modelGlass, modelRenderOptions } from '../render-options'

const base = { animations: null, reducedMotion: false, devicePixelRatio: 3, width: 1200 }

describe('modelRenderOptions', () => {
  it('draws on Auto as it always has: the accurate model if it loads in time, at up to 2x', () => {
    expect(modelRenderOptions({ ...base, detail: 'auto' })).toEqual({
      pixelRatio: 2, shadows: true, shadowMapSize: 1024, model: 'accurate', loadTimeout: true, animate: true
    })
  })

  it('waits for the accurate model on High', () => {
    const o = modelRenderOptions({ ...base, detail: 'high' })
    expect(o.model).toBe('accurate')
    expect(o.loadTimeout).toBe(false)
    expect(o.pixelRatio).toBe(2)
  })

  it('draws the simple model on Low, one pixel per pixel, with no shadow', () => {
    expect(modelRenderOptions({ ...base, detail: 'low' })).toMatchObject({
      pixelRatio: 1, shadows: false, shadowMapSize: 512, model: 'simple'
    })
  })

  it('keeps a small screen under 1.5x and never above the device', () => {
    expect(modelRenderOptions({ ...base, detail: 'auto', width: 390 }).pixelRatio).toBe(1.5)
    expect(modelRenderOptions({ ...base, detail: 'high', devicePixelRatio: 1 }).pixelRatio).toBe(1)
  })

  it('reads anything unknown (Medium included) as Auto', () => {
    expect(modelDetail('medium')).toBe('auto')
    expect(modelDetail(undefined)).toBe('auto')
    expect(modelGlass('frosted')).toBe('auto')
  })
})

describe('glassChoice', () => {
  it('lets ?m1glass= win over the setting, for measuring', () => {
    expect(glassChoice('real', 'cheap')).toBe('plain')
    expect(glassChoice('plain', 'real')).toBe('real')
    expect(glassChoice('plain', null)).toBe('plain')
    expect(glassChoice('auto', null)).toBe('auto')
  })
})

describe('modelAnimates', () => {
  it('follows reduce-motion until set, then the setting', () => {
    expect(modelAnimates(null, false)).toBe(true)
    expect(modelAnimates(null, true)).toBe(false)
    expect(modelAnimates(true, true)).toBe(true)
    expect(modelAnimates(false, false)).toBe(false)
  })
})

describe('gcodeShapeRendering', () => {
  it('draws for speed on Low or while panning', () => {
    expect(gcodeShapeRendering('low', false)).toBe('optimizeSpeed')
    expect(gcodeShapeRendering('auto', true)).toBe('optimizeSpeed')
    expect(gcodeShapeRendering('high', false)).toBe('geometricPrecision')
  })
})
