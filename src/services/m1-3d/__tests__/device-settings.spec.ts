import { describe, expect, it } from 'vitest'
import { MODEL_SETTINGS_DEFAULTS, MODEL_SETTINGS_KEY, modelSettings, parseModelSettings, setModelSetting } from '../device-settings'

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
