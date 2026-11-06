import { describe, expect, it } from 'vitest'
import { filamentSensed } from '../model'

const settings = (...sections: string[]) => ({ settings: Object.fromEntries(sections.map(s => [s, {}])) })
const SWITCH = 'filament_switch_sensor filament_sensor_toolhead'

describe('filamentSensed: whether filament is in, from a trustworthy sensor', () => {
  it('reads an enabled switch sensor', () => {
    const configfile = settings(SWITCH)
    expect(filamentSensed({ configfile, [SWITCH]: { enabled: true, filament_detected: true } })).toBe(true)
    expect(filamentSensed({ configfile, [SWITCH]: { enabled: true, filament_detected: false } })).toBe(false)
  })

  it('ignores a motion sensor: idle, it says "no filament" whether or not filament is loaded', () => {
    const motion = 'filament_motion_sensor encoder'
    expect(filamentSensed({ configfile: settings(motion), [motion]: { enabled: true, filament_detected: false } })).toBeNull()
  })

  it('ignores a motion sensor beside a switch sensor that sees filament', () => {
    const motion = 'filament_motion_sensor encoder'
    expect(filamentSensed({
      configfile: settings(SWITCH, motion),
      [SWITCH]: { enabled: true, filament_detected: true },
      [motion]: { enabled: true, filament_detected: false }
    })).toBe(true)
  })

  it('ignores a sensor that is switched off', () => {
    expect(filamentSensed({ configfile: settings(SWITCH), [SWITCH]: { enabled: false, filament_detected: false } })).toBeNull()
  })

  it('knows nothing with no sensors, or with nothing reported', () => {
    expect(filamentSensed({ configfile: settings() })).toBeNull()
    expect(filamentSensed({})).toBeNull()
    expect(filamentSensed(undefined)).toBeNull()
    expect(filamentSensed({ configfile: settings(SWITCH), [SWITCH]: { enabled: true } })).toBeNull()
  })

  it('does not trust a sensor until the printer\'s settings name it', () => {
    expect(filamentSensed({ [SWITCH]: { enabled: true, filament_detected: false } })).toBeNull()
  })

  it('reads the same mid-print: a motion sensor stays ignored, a switch sensor still counts', () => {
    const printing = { print_stats: { state: 'printing' }, virtual_sdcard: { is_active: true } }
    const motion = 'filament_motion_sensor encoder'
    expect(filamentSensed({ ...printing, configfile: settings(motion), [motion]: { enabled: true, filament_detected: false } })).toBeNull()
    expect(filamentSensed({ ...printing, configfile: settings(SWITCH), [SWITCH]: { enabled: true, filament_detected: true } })).toBe(true)
  })
})
