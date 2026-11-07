import { describe, expect, it } from 'vitest'
import { accessoriesFrom, columnFrom, fansFrom, sameAccessories } from '../accessories'
import {
  AccessoryMotion,
  COLUMN_FIT_MS,
  COLUMN_REMOVE_MS,
  COLUMN_UNLOCKED_LEVEL,
  columnLevel
} from '../accessory-motion'

/** Each sensor as a current printer (Klipper main, no m1_machine) reports it. */
const sensors = (over: Record<string, any> = {}): Record<string, any> => ({
  bed_removal_detector: { bedRemoved: false },
  'mcu toolhead': { non_critical_disconnected: false },
  'gcode_button toolhead_umbilical_unlock_button': { state: 'RELEASED' },
  'filament_switch_sensor filament_sensor_toolhead': { filament_detected: true, enabled: true },
  ...over
})

/** m1_machine's status (klippy/extras/m1_machine.py get_status), its conditions overridden. */
const machine = (conditions: Record<string, unknown>) => ({
  m1_machine: {
    activity: 'idle',
    conditions: {
      column: 'locked',
      bed_power: 'ready',
      plate: 'present',
      toolhead: 'connected',
      hotend: 'ok',
      filament: 'present',
      fan_fault: false,
      plate_cleared: true,
      ...conditions
    },
    missing: {},
    ready: {},
    faults: [],
    pause_reason: null,
    saved_fan: 0
  }
})

describe('the model state from m1_machine', () => {
  it('is used when the printer runs it, over each sensor', () => {
    // The sensors say all is fitted; the state machine has decided otherwise.
    const printer = { ...sensors(), ...machine({ column: 'absent', plate: 'absent', toolhead: 'disconnected', filament: 'absent' }) }
    expect(accessoriesFrom(printer, null)).toMatchObject({
      source: 'm1_machine',
      column: 'absent',
      plateOn: false,
      tubeAttached: false,
      filamentLoaded: false
    })
  })

  it('maps every column condition', () => {
    const column = (c: string) => accessoriesFrom({ ...sensors(), ...machine({ column: c }) }, null).column
    expect(column('locked')).toBe('locked')
    expect(column('unlocked')).toBe('unlocked')
    expect(column('absent')).toBe('absent')
    // The lever part way: there, not locked.
    expect(column('unknown')).toBe('unlocked')
    // Before its first sample, the column is shown fitted rather than played out and back.
    expect(column('reading')).toBe('locked')
  })

  it('shows the plate on while the detector is still reading', () => {
    expect(accessoriesFrom({ ...sensors(), ...machine({ plate: 'unknown' }) }, null).plateOn).toBe(true)
  })

  it('falls back to the sensor for a condition it reports as none', () => {
    const printer = {
      ...sensors({ bed_removal_detector: { bedRemoved: true }, z_power: { z: 'unlocked' } }),
      ...machine({ plate: 'none', column: 'none', toolhead: 'none', filament: 'none' })
    }
    expect(accessoriesFrom(printer, null)).toMatchObject({
      source: 'm1_machine',
      plateOn: false,
      column: 'unlocked',
      tubeAttached: true,
      filamentLoaded: true
    })
  })

  it('still reads the unlock button, which m1_machine does not carry', () => {
    const printer = {
      ...sensors({ 'gcode_button toolhead_umbilical_unlock_button': { state: 'PRESSED' } }),
      ...machine({})
    }
    expect(accessoriesFrom(printer, null).tubeUnlocking).toBe(true)
    printer.m1_machine.conditions.toolhead = 'disconnected'
    expect(accessoriesFrom(printer, null).tubeUnlocking).toBe(false)
  })
})

describe('the model state without m1_machine (printers today)', () => {
  it('reads each sensor, and the column from z_power where it is', () => {
    expect(accessoriesFrom(sensors({ bed_removal_detector: { bedRemoved: true } }), null)).toMatchObject({
      source: 'sensors',
      plateOn: false,
      column: 'locked'
    })
    expect(accessoriesFrom(sensors({ z_power: { z: 'absent' } }), null).column).toBe('absent')
    expect(accessoriesFrom(sensors({ z_power: { z: null } }), null).column).toBe('locked')
  })

  it('maps z_power bands', () => {
    expect(columnFrom('locked')).toBe('locked')
    expect(columnFrom('unlocked')).toBe('unlocked')
    expect(columnFrom('absent')).toBe('absent')
    expect(columnFrom('between')).toBe('unlocked')
    expect(columnFrom(undefined)).toBe('locked')
  })

  it('counts a change of source or column as a change', () => {
    const a = accessoriesFrom(sensors(), null)
    expect(sameAccessories(a, { ...a, column: 'absent' })).toBe(false)
    expect(sameAccessories(a, { ...a, source: 'm1_machine' })).toBe(false)
  })
})

describe('the fans', () => {
  it('reads the part fan and the latched fan fault', () => {
    expect(fansFrom({ fan: { speed: 0.4 }, ...machine({ fan_fault: true }) })).toEqual({ partSpeed: 0.4, fault: true })
    expect(fansFrom({})).toEqual({ partSpeed: 0, fault: false })
  })
})

describe('the column timeline', () => {
  const at = (column: 'locked' | 'unlocked' | 'absent') =>
    ({ ...accessoriesFrom(sensors(), null), column })

  it('plays nothing for the first state, then lifts out and fits back', () => {
    const motion = new AccessoryMotion()
    motion.set(at('absent'), 0, false)
    expect(motion.frame(0).column).toEqual({ state: 'absent', level: 1, clip: null })

    motion.set(at('locked'), 100, false)
    expect(motion.frame(100).column).toMatchObject({ clip: 'fit', level: 1 })
    expect(motion.frame(100).animating).toBe(true)
    expect(motion.frame(100 + COLUMN_FIT_MS / 2).column.level).toBeCloseTo(0.5)
    expect(motion.frame(101 + COLUMN_FIT_MS).column).toEqual({ state: 'locked', level: 0, clip: null })

    motion.set(at('absent'), 5000, false)
    expect(motion.frame(5000).column.clip).toBe('remove')
    expect(motion.frame(5001 + COLUMN_REMOVE_MS).column.level).toBe(1)
  })

  it('shows the lever up as a short lift, apart from the plate', () => {
    const motion = new AccessoryMotion()
    motion.set(at('locked'), 0, false)
    motion.set(at('unlocked'), 10, false)
    const f = motion.frame(10)
    expect(f.column.clip).toBe('unlock')
    expect(f.plate.clip).toBeNull()
    expect(motion.frame(10_000).column).toEqual({ state: 'unlocked', level: COLUMN_UNLOCKED_LEVEL, clip: null })
    expect(columnLevel('unlocked')).toBe(COLUMN_UNLOCKED_LEVEL)
  })

  it('turns back from where it is when the column is put back mid-removal', () => {
    const motion = new AccessoryMotion()
    motion.set(at('locked'), 0, false)
    motion.set(at('absent'), 0, false)
    const mid = motion.frame(COLUMN_REMOVE_MS / 2).column.level
    motion.set(at('locked'), COLUMN_REMOVE_MS / 2, false)
    expect(motion.frame(COLUMN_REMOVE_MS / 2).column.level).toBeCloseTo(mid)
    expect(motion.frame(COLUMN_REMOVE_MS / 2).column.clip).toBe('fit')
  })

  it('crossfades instead with reduced motion', () => {
    const motion = new AccessoryMotion()
    motion.reducedMotion = true
    motion.set(at('locked'), 0, false)
    motion.set(at('absent'), 10, false)
    const f = motion.frame(10)
    expect(f.column).toEqual({ state: 'absent', level: 1, clip: null })
    expect(f.crossfade).toBe(1)
    expect(f.animating).toBe(false)
  })
})

describe('the accurate model strip colour', () => {
  it('averages both chains, a white channel adding to all three', async () => {
    const { averageColour } = await import('../accurate/lights')
    expect(averageColour(null, null)).toBeNull()
    expect(averageColour([[1, 0, 0, 0]], [[0, 0, 1, 0]])).toEqual([0.5, 0, 0.5])
    expect(averageColour([[0, 0, 0, 1]], null)).toEqual([1, 1, 1])
  })
})
