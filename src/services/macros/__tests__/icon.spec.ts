import { describe, expect, it } from 'vitest'
import { MACRO_FALLBACK_ICON, macroIcon } from '../icon'

describe('macroIcon', () => {
  it.each([
    ['LOAD_FILAMENT', 'spool'],
    ['UNLOAD_FILAMENT', 'spool'],
    ['PURGE_LINE', 'nozzle'],
    ['PREHEAT_PLA', 'flame'],
    ['COOL_DOWN', 'snow'],
    ['BED_MESH_CALIBRATE', 'mesh'],
    ['CLEAN_NOZZLE', 'nozzle'],
    ['PARK', 'home'],
    ['led_on', 'bulb'],
    ['FAN_FULL', 'fan']
  ])('%s wears %s', (name, icon) => {
    expect(macroIcon(name)).toBe(icon)
  })

  it('gives anything it does not know the bolt, the top bar\'s Quick actions icon', () => {
    expect(macroIcon('MY_CUSTOM_THING')).toBe(MACRO_FALLBACK_ICON)
    expect(MACRO_FALLBACK_ICON).toBe('bolt')
    expect(macroIcon('')).toBe('bolt')
  })
})
