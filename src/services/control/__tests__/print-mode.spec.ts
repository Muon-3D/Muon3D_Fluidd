import { describe, expect, it } from 'vitest'
import { pressureAdvanceRange, printModeCommand, printModeLabel, readPrintModes } from '../print-mode'

const M1 = { mode: 'normal', modes: ['normal', 'quiet', 'turbo'], commanded_speed: 0.6, target_rpm: null, output_speed: 0.18 }

describe('readPrintModes', () => {
  it('reads the M1 fan_modes status as Quiet, Normal, Turbo with the current mode', () => {
    const m = readPrintModes(M1, { SET_PRINT_MODE: {} })
    expect(m?.current).toBe('normal')
    expect(m?.cards.map(c => [c.id, c.label, c.blurb])).toEqual([
      ['quiet', 'Quiet', 'Softer cooling fan'],
      ['normal', 'Normal', 'The everyday mix'],
      ['turbo', 'Turbo', 'Full cooling']
    ])
  })

  it('is null on a printer without fan_modes, or whose commands lack SET_PRINT_MODE', () => {
    expect(readPrintModes(undefined)).toBeNull()
    expect(readPrintModes(null)).toBeNull()
    expect(readPrintModes(M1, { G28: {}, M220: {} })).toBeNull()
    // An empty or unloaded commands list doesn't hide it.
    expect(readPrintModes(M1, {})).not.toBeNull()
    expect(readPrintModes(M1, null)).not.toBeNull()
  })

  it('keeps extra modes the printer offers, after the three, and drops names that are not plain', () => {
    const m = readPrintModes({ mode: 'TURBO', modes: ['night_mode', 'turbo', 'bad name;', 'quiet'] })
    expect(m?.current).toBe('turbo')
    expect(m?.cards.map(c => c.id)).toEqual(['quiet', 'turbo', 'night_mode'])
    expect(m?.cards[2].label).toBe('Night mode')
  })
})

describe('printModeCommand', () => {
  const modes = readPrintModes(M1)
  it('is SET_PRINT_MODE MODE=<mode> for a mode the printer offers', () => {
    expect(printModeCommand('quiet', modes)).toBe('SET_PRINT_MODE MODE=quiet')
    expect(printModeCommand('Turbo', modes)).toBe('SET_PRINT_MODE MODE=turbo')
  })
  it('is null for anything else', () => {
    expect(printModeCommand('ludicrous', modes)).toBeNull()
    expect(printModeCommand('quiet\nG28', modes)).toBeNull()
    expect(printModeCommand('quiet', null)).toBeNull()
  })
})

describe('printModeLabel', () => {
  it('names a mode in plain words', () => {
    expect(printModeLabel('quiet')).toBe('Quiet')
    expect(printModeLabel('night_mode')).toBe('Night mode')
    expect(printModeLabel('')).toBe('')
  })
})

describe('pressureAdvanceRange', () => {
  it('is a fine adjustment around the profile value', () => {
    expect(pressureAdvanceRange(0.04)).toEqual({ min: 0, max: 0.08, step: 0.001 })
    expect(pressureAdvanceRange(0)).toEqual({ min: 0, max: 0.2, step: 0.001 })
    expect(pressureAdvanceRange(null)).toEqual({ min: 0, max: 0.2, step: 0.001 })
  })
})
