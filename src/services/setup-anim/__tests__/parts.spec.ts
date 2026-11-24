import { describe, expect, it } from 'vitest'
import { gateMissing, missingFor } from '../parts'

const machine = (m1_machine: Record<string, unknown>) => ({ m1_machine })

describe('missingFor', () => {
  it('turns the printer reason codes into setup steps, in the order a person does them', () => {
    const status = machine({ missing: { home_z: ['column_absent', 'column_unlocked', 'plate_absent', 'toolhead_disconnected'] } })
    expect(missingFor(status, 'home_z')).toEqual(['toolhead', 'spine', 'lever', 'plate'])
  })
  it('a part way lever is the lever step', () => {
    expect(missingFor(machine({ missing: { home_z: ['column_unknown'] } }), 'home_z')).toEqual(['lever'])
  })
  it('Home all is the parts of Home Z and of Home XY together', () => {
    const status = machine({ missing: { home_z: ['plate_absent'], home_xy: ['toolhead_disconnected'] } })
    expect(missingFor(status, 'home')).toEqual(['toolhead', 'plate'])
  })
  it('leaves out what is not a part to fit', () => {
    const status = machine({ missing: { print: ['filament_absent', 'bed_power_fault', 'fan_fault', 'plate_not_cleared', 'column_reading', 'plate_unknown'] } })
    expect(missingFor(status, 'print')).toEqual([])
  })
  it('is empty when the printer does not say', () => {
    expect(missingFor({}, 'home')).toEqual([])
    expect(missingFor(machine({}), 'home')).toEqual([])
    expect(missingFor(machine({ missing: { home_z: 'oops' } }), 'home_z')).toEqual([])
    expect(missingFor(null, 'print')).toEqual([])
  })
})

describe('gateMissing', () => {
  it('is the parts a held print still needs', () => {
    expect(gateMissing(machine({ gate: { action: 'print', missing: ['plate_absent', 'column_unlocked'], since: 1 } }))).toEqual(['lever', 'plate'])
  })
  it('is empty when no print is held', () => {
    expect(gateMissing(machine({ gate: null }))).toEqual([])
    expect(gateMissing({})).toEqual([])
  })
})
