import { describe, expect, it } from 'vitest'
import { changeFilamentPlan, loadUnloadPlan, macroHeat, type FilamentState } from '../filament-change'

const M600 = { name: 'M600', takesTemp: false }
const UNLOAD = { name: 'UNLOAD_FILAMENT', takesTemp: false, heatsTo: 250 }
const LOAD = { name: 'LOAD_FILAMENT', takesTemp: true, heatsTo: 220 }
const idle: FilamentState = { printing: false, paused: false, running: false, promptOpen: false }

describe('changeFilamentPlan', () => {
  it('idle, it sends nothing: it opens the material panel', () => {
    expect(changeFilamentPlan(idle, M600, 215)).toEqual({ kind: 'panel' })
  })

  it('idle opens the panel even when the printer has no M600', () => {
    expect(changeFilamentPlan(idle, null, 215)).toEqual({ kind: 'panel' })
  })

  it('mid-print pauses the print with M600, after asking', () => {
    const plan = changeFilamentPlan({ ...idle, printing: true }, M600, 215)
    if (plan.kind !== 'pause') throw new Error(plan.kind)
    expect(plan.command).toBe('M600')
    expect(plan.confirm.title).toBe('Pause the print to change filament?')
  })

  it.each([
    ['paused', { printing: true, paused: true }],
    ['showing a prompt', { promptOpen: true }],
    ['showing a prompt mid-print', { promptOpen: true, printing: true }]
  ])('sends nothing and opens nothing while %s', (_, over) => {
    expect(changeFilamentPlan({ ...idle, ...over }, M600, 215).kind).toBe('none')
  })

  it('mid-print with no change macro, it does nothing and says why', () => {
    const plan = changeFilamentPlan({ ...idle, printing: true }, null, 215)
    expect(plan).toEqual({ kind: 'none', reason: 'This printer has no filament change macro (M600).' })
  })
})

describe('loadUnloadPlan', () => {
  it('unload asks first, naming the heat the macro sets and that the extruder runs', () => {
    const plan = loadUnloadPlan(idle, 'unload', UNLOAD, 215)
    if (plan.kind !== 'unload') throw new Error(plan.kind)
    expect(plan.command).toBe('UNLOAD_FILAMENT')
    expect(plan.confirm.text).toMatch(/^Heats the nozzle to 250 °C, then runs the extruder/)
    expect(plan.confirm.no).toBe('Cancel')
  })

  it('a macro that takes TEMP is told the material heat, and the confirm names that heat', () => {
    const plan = loadUnloadPlan(idle, 'load', LOAD, 215)
    if (plan.kind !== 'load') throw new Error(plan.kind)
    expect(plan.command).toBe('LOAD_FILAMENT TEMP=215')
    expect(plan.confirm.text).toMatch(/^Heats the nozzle to 215 °C/)
    expect(plan.confirm.text).toContain('may home and move')
  })

  it.each([
    ['printing', { printing: true }],
    ['paused', { printing: true, paused: true }],
    ['showing a prompt', { promptOpen: true }],
    ['running another script, or just sent one', { running: true }]
  ])('sends nothing while %s', (_, over) => {
    expect(loadUnloadPlan({ ...idle, ...over }, 'unload', UNLOAD, 215).kind).toBe('none')
    expect(loadUnloadPlan({ ...idle, ...over }, 'load', LOAD, 215).kind).toBe('none')
  })

  it('with no macro, it does nothing and says which is missing', () => {
    expect(loadUnloadPlan(idle, 'unload', null, 215)).toEqual({ kind: 'none', reason: 'This printer has no UNLOAD_FILAMENT macro.' })
  })
})

describe('macroHeat', () => {
  it('reads the heat a macro sets itself', () => {
    expect(macroHeat('M104 S250\nTEMPERATURE_WAIT SENSOR=extruder MINIMUM=245')).toBe(250)
    expect(macroHeat('M109 S230')).toBe(230)
    expect(macroHeat('{% set t = params.TEMP|default(240)|int %}')).toBe(240)
    expect(macroHeat('SET_HEATER_TEMPERATURE HEATER=extruder TARGET=245')).toBe(245)
  })

  it('is null when the macro does not say', () => {
    expect(macroHeat('G1 E-40 F1200')).toBeNull()
  })
})
