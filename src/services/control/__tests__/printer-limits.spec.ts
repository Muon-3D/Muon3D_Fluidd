import { describe, expect, it } from 'vitest'
import { hotendLimitReason, saveMaterialColourCommand, saveMaterialCommand, PANEL_MATERIALS } from '../model'
import { changeFilamentPlan, loadUnloadPlan, type FilamentState } from '../filament-change'

describe('the variables Control saves (Klipper#112 allowlist: MUON_MATERIAL, MUON_MATERIAL_COLOUR)', () => {
  // Klipper reads variable names case-insensitively, so lowercase is allowed today. These pin the
  // exact strings so a change of case, name or quoting is a decision, not an accident.
  it('saves the material as exactly this string', () => {
    expect(saveMaterialCommand('PLA')).toBe('SAVE_VARIABLE VARIABLE=muon_material VALUE=\'"PLA"\'')
  })

  it('saves the colour as exactly this string', () => {
    expect(saveMaterialColourCommand('#f07b22')).toBe('SAVE_VARIABLE VARIABLE=muon_material_colour VALUE=\'"F07B22"\'')
  })

  it('names only the two allowlisted variables, whatever the case', () => {
    const names = [saveMaterialCommand('PETG'), saveMaterialColourCommand('#202022')].map(c => /VARIABLE=(\S+)/.exec(c)?.[1].toUpperCase())
    expect(names).toEqual(['MUON_MATERIAL', 'MUON_MATERIAL_COLOUR'])
  })
})

describe('a material hotter than the hotend', () => {
  const pc = PANEL_MATERIALS.find(m => m.name === 'PC')!
  const idle: FilamentState = { printing: false, paused: false, running: false, promptOpen: false, sending: false }
  const unload = { name: 'UNLOAD_FILAMENT', takesTemp: true } as any

  it('PC (270) is refused on the M1 (max_temp 265) with a plain reason', () => {
    expect(hotendLimitReason('PC', pc.nozzle, 265)).toBe('PC needs a higher-temperature hotend')
  })

  it('anything at or under the limit, an unknown limit or no temperature is fine', () => {
    expect(hotendLimitReason('PA', 260, 265)).toBeNull()
    expect(hotendLimitReason('X', 265, 265)).toBeNull()
    expect(hotendLimitReason('PC', 270, null)).toBeNull()
    expect(hotendLimitReason('PC', null, 265)).toBeNull()
  })

  it('load and unload send nothing and say why; change filament too', () => {
    const reason = hotendLimitReason('PC', 270, 265)
    expect(unloadPlan(reason)).toEqual({ kind: 'none', reason: 'PC needs a higher-temperature hotend' })
    expect(loadUnloadPlan(idle, 'load', { name: 'LOAD_FILAMENT', takesTemp: true } as any, 270, reason)).toEqual({ kind: 'none', reason: 'PC needs a higher-temperature hotend' })
    expect(changeFilamentPlan({ ...idle, printing: true }, { name: 'M600', takesTemp: true } as any, 270, reason)).toEqual({ kind: 'none', reason: 'PC needs a higher-temperature hotend' })
  })

  it('a material the hotend can reach still sends its TEMP', () => {
    expect(loadUnloadPlan(idle, 'unload', unload, 260, null)).toEqual({ kind: 'unload', command: 'UNLOAD_FILAMENT TEMP=260' })
  })

  function unloadPlan (reason: string | null) {
    return loadUnloadPlan(idle, 'unload', unload, 270, reason)
  }
})
