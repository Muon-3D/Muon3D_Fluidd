import { afterEach, describe, expect, it, vi } from 'vitest'
import { LEGACY_ANIMATIONS_KEY, MODEL_SETTINGS_DEFAULTS, MODEL_SETTINGS_KEY, liveRenderOptions, migrateLegacyAnimations, modelSettings, parseModelSettings, setModelSetting } from '../device-settings'
import { glassChoice } from '../render-options'

describe('parseModelSettings', () => {
  it('gives the defaults for nothing stored, or something broken', () => {
    expect(parseModelSettings(null)).toEqual(MODEL_SETTINGS_DEFAULTS)
    expect(parseModelSettings('{not json')).toEqual(MODEL_SETTINGS_DEFAULTS)
    expect(MODEL_SETTINGS_DEFAULTS).toMatchObject({ show: true, detail: 'auto', glass: 'auto', animations: null, opensOn: '3d' })
  })

  it('keeps known values and drops unknown ones', () => {
    expect(parseModelSettings(JSON.stringify({ show: false, detail: 'medium', glass: 'plain', animations: false, opensOn: 'camera' })))
      .toEqual({ ...MODEL_SETTINGS_DEFAULTS, show: false, glass: 'plain', animations: false, opensOn: 'camera' })
  })
})

describe('setModelSetting', () => {
  it('saves to this device, not the printer', () => {
    setModelSetting('detail', 'low')
    expect(modelSettings.detail).toBe('low')
    expect(JSON.parse(localStorage.getItem(MODEL_SETTINGS_KEY) ?? '{}').detail).toBe('low')
    setModelSetting('detail', 'auto')
  })
})

describe('liveRenderOptions: the settings as the renderer reads them', () => {
  const reduceMotion = (reduce: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reduce }))

  afterEach(() => {
    vi.unstubAllGlobals()
    setModelSetting('detail', 'auto')
    setModelSetting('glass', 'auto')
    setModelSetting('animations', null)
  })

  it('Low draws the simple model, one pixel per pixel, without the shadow', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    setModelSetting('detail', 'low')
    expect(liveRenderOptions(1200)).toMatchObject({ model: 'simple', pixelRatio: 1, shadows: false, shadowMapSize: 512 })
  })

  it('High waits for the accurate model, with no fall-back timeout', () => {
    setModelSetting('detail', 'high')
    expect(liveRenderOptions(1200)).toMatchObject({ model: 'accurate', loadTimeout: false, shadows: true })
  })

  it('Auto is how it always drew', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    expect(liveRenderOptions(1200)).toMatchObject({ model: 'accurate', loadTimeout: true, shadows: true, pixelRatio: 2 })
    expect(liveRenderOptions(400).pixelRatio).toBe(1.5)
  })

  it('animations follow the device until set, then the setting', () => {
    reduceMotion(true)
    expect(liveRenderOptions(800).animate).toBe(false)
    reduceMotion(false)
    expect(liveRenderOptions(800).animate).toBe(true)
    reduceMotion(true)
    setModelSetting('animations', true)
    expect(liveRenderOptions(800).animate).toBe(true)
    reduceMotion(false)
    setModelSetting('animations', false)
    expect(liveRenderOptions(800).animate).toBe(false)
  })

  it('the glass setting yields to a ?m1glass= flag', () => {
    expect(glassChoice('plain', null)).toBe('plain')
    expect(glassChoice('plain', 'real')).toBe('real')
    expect(glassChoice('real', 'cheap')).toBe('plain')
    expect(glassChoice('auto', null)).toBe('auto')
  })
})

describe('migrateLegacyAnimations: the old per-printer Animations choice', () => {
  const fresh = () => {
    localStorage.removeItem(LEGACY_ANIMATIONS_KEY)
    setModelSetting('animations', null)
  }
  afterEach(fresh)

  it('starts a device that has not chosen from a saved off', () => {
    fresh()
    migrateLegacyAnimations(false)
    expect(modelSettings.animations).toBe(false)
  })

  it('leaves a device that has chosen alone', () => {
    fresh()
    setModelSetting('animations', true)
    migrateLegacyAnimations(false)
    expect(modelSettings.animations).toBe(true)
  })

  it('leaves the default (on) following the device, and ignores a missing value', () => {
    fresh()
    migrateLegacyAnimations(true)
    migrateLegacyAnimations(undefined)
    expect(modelSettings.animations).toBeNull()
  })

  it('happens once, so choosing "Like this device" afterwards sticks', () => {
    fresh()
    migrateLegacyAnimations(false)
    setModelSetting('animations', null)
    migrateLegacyAnimations(false)
    expect(modelSettings.animations).toBeNull()
  })
})
