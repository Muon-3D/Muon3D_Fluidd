import { describe, expect, it } from 'vitest'
import { defaultState } from '../state'
import { mutations } from '../mutations'
import { materialsFrom } from '@/services/control/model'
import type { UiSettings } from '../types'

const names = (state: ReturnType<typeof defaultState>) => state.uiSettings.dashboard.tempPresets.map(p => p.name)

describe('default materials', () => {
  it('a new state lists ABS, PETG, PLA and TPU with nozzle and bed temperatures', () => {
    const state = defaultState()
    expect(names(state)).toEqual(['ABS', 'PETG', 'PLA', 'TPU'])
    expect(materialsFrom(state.uiSettings.dashboard.tempPresets)).toEqual([
      expect.objectContaining({ name: 'ABS', nozzle: 250, bed: 100 }),
      expect.objectContaining({ name: 'PETG', nozzle: 240, bed: 80 }),
      expect.objectContaining({ name: 'PLA', nozzle: 215, bed: 60 }),
      expect.objectContaining({ name: 'TPU', nozzle: 225, bed: 50 })
    ])
  })

  it('gives the defaults uuid-like string ids, as presets added in Settings have', () => {
    const ids = defaultState().uiSettings.dashboard.tempPresets.map(p => p.id as unknown as string)
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(new Set(ids).size).toBe(4)
  })

  it('removing a preset that is not there removes nothing', () => {
    const state = defaultState()
    mutations.setRemovePreset(state, { id: 'missing' } as never)
    expect(names(state)).toEqual(['ABS', 'PETG', 'PLA', 'TPU'])
  })

  it('removing a preset removes just that one', () => {
    const state = defaultState()
    mutations.setRemovePreset(state, state.uiSettings.dashboard.tempPresets[1])
    expect(names(state)).toEqual(['ABS', 'PLA', 'TPU'])
  })

  it('every call returns fresh objects, so editing one printer\'s list cannot change another\'s', () => {
    const a = defaultState()
    a.uiSettings.dashboard.tempPresets[0].name = 'changed'
    expect(names(defaultState())[0]).toBe('ABS')
  })

  it('settings saved without a list keep the defaults', () => {
    const state = defaultState()
    mutations.setInitUiSettings(state, { general: { locale: 'en' } } as unknown as Partial<UiSettings>)
    expect(names(state)).toEqual(['ABS', 'PETG', 'PLA', 'TPU'])
  })

  it('a saved list is kept exactly: not wiped, and the defaults are not added back', () => {
    const state = defaultState()
    mutations.setInitUiSettings(state, {
      dashboard: { tempPresets: [{ id: 'x' as unknown as number, name: 'Nylon', values: {} }] }
    } as unknown as Partial<UiSettings>)
    expect(names(state)).toEqual(['Nylon'])
  })

  it('a list someone emptied on purpose stays empty', () => {
    const state = defaultState()
    mutations.setInitUiSettings(state, { dashboard: { tempPresets: [] } } as unknown as Partial<UiSettings>)
    expect(names(state)).toEqual([])
  })
})
