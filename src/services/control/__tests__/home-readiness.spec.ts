import { describe, expect, it } from 'vitest'
import { homeXYDisabledReason, homeXYReason, xyMoveDisabledReason } from '../home-readiness'

const machine = (home_xy: boolean, missing: string[] = []) => ({ m1_machine: { ready: { home_xy }, missing: { home_xy: missing } } })

describe('homeXYDisabledReason', () => {
  it('is enabled when the objects are absent (not an M1)', () => {
    expect(homeXYDisabledReason(undefined)).toBe('')
    expect(homeXYDisabledReason({})).toBe('')
    expect(homeXYDisabledReason({ toolhead: {} })).toBe('')
  })
  it('is enabled when Klipper says ready', () => {
    expect(homeXYDisabledReason({ ...machine(true), z_power: { xy_home_allowed: true } })).toBe('')
  })
  it('gives the plain reason from missing.home_xy', () => {
    expect(homeXYDisabledReason(machine(false, ['toolhead_disconnected']))).toBe('Connect the toolhead first')
    expect(homeXYDisabledReason(machine(false, ['column_absent']))).toBe('Fit the spine first')
  })
  it('falls back when the reason is unknown or empty', () => {
    expect(homeXYDisabledReason(machine(false, ['something_new']))).toMatch(/isn't ready/)
    expect(homeXYDisabledReason(machine(false))).toMatch(/isn't ready/)
  })
  it('is disabled when z_power.xy_home_allowed is false', () => {
    expect(homeXYDisabledReason({ z_power: { xy_home_allowed: false } })).not.toBe('')
  })
  it('homeXYReason takes the first known reason', () => {
    expect(homeXYReason(['x', 'column_absent'])).toBe('Fit the spine first')
  })
})

describe('xyMoveDisabledReason', () => {
  it('only z_power.xy_allowed === false disables XY moves', () => {
    expect(xyMoveDisabledReason({ z_power: { xy_allowed: false } })).toBe('Raise the bed first')
    expect(xyMoveDisabledReason({ z_power: { xy_allowed: true } })).toBe('')
    expect(xyMoveDisabledReason({})).toBe('')
    expect(xyMoveDisabledReason(undefined)).toBe('')
  })
})
