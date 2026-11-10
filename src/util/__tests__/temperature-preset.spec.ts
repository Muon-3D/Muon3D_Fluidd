import { describe, expect, it } from 'vitest'
import type { TemperaturePreset } from '@/store/config/types'
import { extrudeTemperature, presetCommands, presetSummary } from '../temperature-preset'

const pla: TemperaturePreset = {
  id: 1,
  name: 'PLA',
  values: {
    heater_bed: { value: 60, type: 'heater', active: true },
    extruder: { value: 215, type: 'heater', active: true },
    chamber_fan: { value: 35, type: 'fan', active: true },
    extruder1: { value: 200, type: 'heater', active: false }
  },
  gcode: 'M117 PLA'
}

describe('a temperature preset', () => {
  it('sends each active target, then its own G-code', () => {
    expect(presetCommands(pla)).toEqual([
      'SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=60',
      'SET_HEATER_TEMPERATURE HEATER=extruder TARGET=215',
      'SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=chamber_fan TARGET=35',
      'M117 PLA'
    ])
  })

  it('reads as nozzle then bed', () => {
    expect(presetSummary(pla)).toBe('215° / 60°')
  })
})

describe('extrudeTemperature', () => {
  const petg: TemperaturePreset = { id: 2, name: 'PETG', gcode: '', values: { extruder: { value: 240, type: 'heater', active: true }, heater_bed: { value: 80, type: 'heater', active: true } } } as TemperaturePreset
  const limits = { min: 170, max: 265 }

  it('heats for the loaded material, by name', () => {
    expect(extrudeTemperature([pla, petg], 'petg', limits)).toEqual({ temp: 240, material: 'PETG' })
  })

  it('uses the printer default (PLA) when nothing is loaded or the loaded one has no nozzle heat', () => {
    expect(extrudeTemperature([pla, petg], null, limits)).toEqual({ temp: 215, material: 'PLA' })
    expect(extrudeTemperature([], 'Mystery', limits)).toEqual({ temp: 215, material: 'PLA' })
  })

  it('stays within the extruder limits', () => {
    const hot = { ...petg, name: 'PC', values: { extruder: { value: 300, type: 'heater', active: true } } } as TemperaturePreset
    expect(extrudeTemperature([hot], 'PC', limits).temp).toBe(265)
    expect(extrudeTemperature([], null, { min: 230, max: 265 }).temp).toBe(230)
  })
})
