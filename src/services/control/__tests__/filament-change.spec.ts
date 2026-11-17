import { describe, expect, it } from 'vitest'
import { changeFilamentPlan, loadUnloadPlan, SENDING, type FilamentState } from '../filament-change'

const M600 = { name: 'M600', takesTemp: false }
const UNLOAD = { name: 'UNLOAD_FILAMENT', takesTemp: false }
const LOAD = { name: 'LOAD_FILAMENT', takesTemp: true }
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
    ['showing a prompt mid-print', { promptOpen: true, printing: true }],
    ['mid-print, inside the send window (a second M600)', { printing: true, sending: true }]
  ])('sends nothing and opens nothing while %s', (_, over) => {
    expect(changeFilamentPlan({ ...idle, ...over }, M600, 215).kind).toBe('none')
  })

  it('inside the send window it says why', () => {
    expect(changeFilamentPlan({ ...idle, printing: true, sending: true }, M600, 215)).toEqual({ kind: 'none', reason: SENDING })
  })

  it('mid-print with no change macro, it does nothing and says why', () => {
    const plan = changeFilamentPlan({ ...idle, printing: true }, null, 215)
    expect(plan).toEqual({ kind: 'none', reason: 'This printer has no filament change command (M600).' })
  })
})

describe('loadUnloadPlan', () => {
  it('unload sends its macro at once, with no confirm', () => {
    expect(loadUnloadPlan(idle, 'unload', UNLOAD, 215)).toEqual({ kind: 'unload', command: 'UNLOAD_FILAMENT' })
  })

  it('a macro that takes TEMP is told the material heat', () => {
    expect(loadUnloadPlan(idle, 'load', LOAD, 215)).toEqual({ kind: 'load', command: 'LOAD_FILAMENT TEMP=215' })
  })

  it.each([
    ['printing', { printing: true }],
    ['paused', { printing: true, paused: true }],
    ['showing a prompt', { promptOpen: true }],
    ['running another script', { running: true }],
    ['inside the send window', { sending: true }]
  ])('sends nothing while %s', (_, over) => {
    expect(loadUnloadPlan({ ...idle, ...over }, 'unload', UNLOAD, 215).kind).toBe('none')
    expect(loadUnloadPlan({ ...idle, ...over }, 'load', LOAD, 215).kind).toBe('none')
  })

  it('with no macro, it does nothing and says which is missing', () => {
    expect(loadUnloadPlan(idle, 'unload', null, 215)).toEqual({ kind: 'none', reason: 'This printer has no UNLOAD_FILAMENT macro.' })
  })
})
