import { describe, expect, it } from 'vitest'
import { coveredElsewhere, quickCommandIcon, quickCommandLabel, quickCommandReason } from '../quick-commands'

describe('quickCommandLabel', () => {
  it('cleans a macro name into plain words', () => {
    expect(quickCommandLabel('PARK_HEAD')).toBe('Park the head')
    expect(quickCommandLabel('CLEAN_NOZZLE')).toBe('Clean the nozzle')
    expect(quickCommandLabel('QUERY_PROBE')).toBe('Check the probe')
    expect(quickCommandLabel('PURGE_LINE')).toBe('Purge a line')
    expect(quickCommandLabel('PARK')).toBe('Park')
    expect(quickCommandLabel('LED_ON')).toBe('LED on')
    expect(quickCommandLabel('MOVE_Z_UP')).toBe('Move Z up')
    expect(quickCommandLabel('M106')).toBe('M106')
  })

  it('uses a short description when the macro has one', () => {
    expect(quickCommandLabel('PURGE', 'Purge a line at the front.')).toBe('Purge a line at the front')
    expect(quickCommandLabel('PARK_HEAD', '"park toolhead"')).toBe('Park toolhead')
  })

  it('ignores Klipper\'s placeholder and long descriptions', () => {
    expect(quickCommandLabel('PARK_HEAD', 'G-Code macro')).toBe('Park the head')
    expect(quickCommandLabel('PARK_HEAD', 'Moves the head to the back right corner at the safe height, then waits')).toBe('Park the head')
  })
})

describe('coveredElsewhere', () => {
  it('leaves out what Quick actions and the Filament tile already do', () => {
    for (const n of ['G28', 'PREHEAT_PLA', 'COOL_DOWN', 'M600', 'CHANGE_FILAMENT', 'BED_MESH_CALIBRATE', 'M84', 'RESTART', 'LOAD_FILAMENT', 'unload_filament', 'M701']) {
      expect(coveredElsewhere(n)).toBe(true)
    }
  })
  it('keeps everything else', () => {
    for (const n of ['PARK_HEAD', 'PURGE_LINE', 'CLEAN_NOZZLE', 'QUERY_PROBE', 'FIRMWARE_RESTART', 'HOME_Z_SAFE']) {
      expect(coveredElsewhere(n)).toBe(false)
    }
  })
})

describe('quickCommandIcon and quickCommandReason', () => {
  it('picks an icon by purpose', () => {
    expect(quickCommandIcon('moving', 'PARK_HEAD')).toBe('home')
    expect(quickCommandIcon('calibration', 'QUERY_PROBE')).toBe('check')
    expect(quickCommandIcon('other', 'FIRMWARE_RESTART')).toBe('refresh')
    expect(quickCommandIcon('other', 'SOMETHING')).toBe('macro')
  })
  it('says why one can not run', () => {
    expect(quickCommandReason({ controlLock: 'Klipper is not ready', busy: false, disabledWhilePrinting: false })).toBe('Klipper is not ready')
    expect(quickCommandReason({ controlLock: '', busy: true, disabledWhilePrinting: true })).toBe('Not while the printer is printing.')
    expect(quickCommandReason({ controlLock: '', busy: true, disabledWhilePrinting: false })).toBe('')
  })
})
