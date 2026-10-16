import { describe, expect, it } from 'vitest'
import { commandHelp, entryKind, entryText, explain, explainError, filterEntries, PRINTER_ERRORS, suggestions } from '../model'

describe('a console line', () => {
  it('reads as text, from the store\'s sanitised HTML', () => {
    expect(entryText('// probe: open<br />// done &amp; dusted')).toBe('// probe: open\n// done & dusted')
  })

  it('is a command, an error, a warning or information', () => {
    expect(entryKind({ type: 'command', message: 'G28' })).toBe('command')
    expect(entryKind({ type: 'response', message: '!! Must home axis first: 10.000 10.000 0.000' })).toBe('error')
    expect(entryKind({ type: 'response', message: '// TMC warning: stepper_x reports otpw' })).toBe('warning')
    expect(entryKind({ type: 'response', message: '// Klipper state: Ready' })).toBe('info')
  })
})

describe('filtering the log', () => {
  const entries = [
    { type: 'command' as const, message: 'G28' },
    { type: 'response' as const, message: '!! Move out of range: 300.000 0.000 0.000 [0.000]' },
    { type: 'response' as const, message: '// Warning: the fan is slow' },
    { type: 'response' as const, message: '// Mesh loaded' }
  ]

  it('keeps commands, warnings (with errors), or errors', () => {
    expect(filterEntries(entries, 'all', '')).toHaveLength(4)
    expect(filterEntries(entries, 'commands', '').map(e => e.message)).toEqual(['G28'])
    expect(filterEntries(entries, 'warnings', '')).toHaveLength(2)
    expect(filterEntries(entries, 'errors', '')).toHaveLength(1)
  })

  it('finds text in any case, after the filter', () => {
    expect(filterEntries(entries, 'all', 'MESH').map(e => e.message)).toEqual(['// Mesh loaded'])
    expect(filterEntries(entries, 'errors', 'mesh')).toHaveLength(0)
  })
})

describe('explaining errors', () => {
  it('says which motor faulted', () => {
    expect(explain("!! TMC 'stepper_x' reports error: GSTAT: 00000001 reset=1(Reset)")).toMatch(/^The X motor reported a problem/)
  })

  it('calls the extruder heater the nozzle', () => {
    expect(explain('!! Heater extruder not heating at expected rate')).toBe(
      "The nozzle didn't heat as expected, so the printer stopped to be safe. Restart the printer; if it happens again, contact support with code E-HEAT-01."
    )
    expect(explain('!! Heater heater_bed not heating at expected rate')).toMatch(/^The heater bed didn't heat/)
  })

  it('names an unknown command, with its code', () => {
    expect(explain('!! Unknown command:"PRINT_STRAT"')).toBe("The printer doesn't know the command PRINT_STRAT. Check the spelling. (E-CMD-01)")
  })

  it('gives Muon staff the code and the full account in developer mode', () => {
    expect(explain('!! Heater extruder not heating at expected rate', true)).toBe(
      'E-HEAT-01: The nozzle heated slower than expected, so Klipper shut down to be safe. Check its heater and thermistor wiring, and that no fan blows on it.'
    )
  })

  it('leaves other lines alone', () => {
    expect(explain('// Klipper state: Ready')).toBeNull()
  })
})

describe('an error not in the table', () => {
  const raw = '!! Endstop x still triggered after retract'

  it('gives customers the generic sentence and code, never the raw text', () => {
    expect(explainError(raw)).toBe(
      'The printer stopped because of an error. Restart the printer; if it happens again, contact support with code E-GEN-00.'
    )
  })

  it('gives Muon staff the raw text in developer mode', () => {
    expect(explainError(raw, true)).toBe('E-GEN-00: !! Endstop x still triggered after retract')
  })

  it('still names a known error by its own code', () => {
    expect(explainError('!! ADC out of range')).toMatch(/code E-TEMP-01\.$/)
  })
})

// 16 Oct (Jack): customers are never told to check wiring or touch the
// printer's insides or software. Each code is written out here, so renaming
// one in the table fails this test rather than passing with it.
const SAMPLES: Record<string, string> = {
  'E-HOME-01': '!! Must home axis first: 10.000 10.000 0.000',
  'E-MOVE-01': '!! Move out of range: 300.000 0.000 0.000 [0.000]',
  'E-MOTOR-01': "!! TMC 'stepper_y' reports error: GSTAT: 00000001",
  'E-HEAT-01': '!! Heater extruder not heating at expected rate',
  'E-LINK-01': "!! Lost communication with MCU 'toolhead'",
  'E-TIME-01': '!! Timer too close',
  'E-COLD-01': '!! Extrude below minimum temp',
  'E-TEMP-01': '!! ADC out of range',
  'E-CMD-01': '!! Unknown command:"FOO"'
}
const JARGON = /wir(e|ing)|cable|thermistor|\bmcu\b|klipper|moonraker|firmware|driver|config|macro|board/i

describe('the printer error table', () => {
  it('has one sample here for each code, and no code twice', () => {
    const codes = PRINTER_ERRORS.map(e => e.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect([...codes].sort()).toEqual(Object.keys(SAMPLES).sort())
  })

  it.each(Object.entries(SAMPLES))('%s: a plain sentence for customers, ending in its code', (code, line) => {
    const said = explain(line)
    expect(said).not.toBeNull()
    expect(said).not.toMatch(JARGON)
    expect(said!.endsWith(`code ${code}.`) || said!.endsWith(`(${code})`)).toBe(true)
    expect(explain(line, true)!.startsWith(`${code}: `)).toBe(true)
  })
})

describe('suggestions while typing', () => {
  const commands = { SET_FAN_SPEED: 'Set the speed of a named fan', SET_PIN: 'Set an output pin', G28: 'Home', SET_LED: 'Set an LED' }

  it('offers commands sent before, newest first, with how often', () => {
    const history = ['SET_FAN_SPEED FAN=part_fan SPEED=0.5', 'G28', 'SET_FAN_SPEED FAN=part_fan SPEED=0.5', 'SET_FAN_SPEED FAN=aux SPEED=1']
    expect(suggestions('set_fan', commands, history).slice(0, 2)).toEqual([
      { text: 'SET_FAN_SPEED FAN=part_fan SPEED=0.5', hint: 'used 2 times', from: 'history' },
      { text: 'SET_FAN_SPEED FAN=aux SPEED=1', hint: 'used before', from: 'history' }
    ])
  })

  it('then Klipper\'s commands while the first word is typed, shortest first, with their help', () => {
    expect(suggestions('SET_', commands, [])).toEqual([
      { text: 'SET_LED', hint: 'Set an LED', from: 'command' },
      { text: 'SET_PIN', hint: 'Set an output pin', from: 'command' },
      { text: 'SET_FAN_SPEED', hint: 'Set the speed of a named fan', from: 'command' }
    ])
  })

  it('offers no commands once parameters are being typed, nor the line itself', () => {
    expect(suggestions('SET_PIN PIN=', commands, [])).toEqual([])
    expect(suggestions('G28', commands, ['G28'])).toEqual([])
    expect(suggestions('  ', commands, ['G28'])).toEqual([])
  })

  it('offers a command once, from the history, when it was sent on its own', () => {
    expect(suggestions('SET_P', commands, ['SET_PIN'])).toEqual([{ text: 'SET_PIN', hint: 'used before', from: 'history' }])
  })

  it('gives the help of the command typed', () => {
    expect(commandHelp('set_pin PIN=beeper', commands)).toBe('Set an output pin')
    expect(commandHelp('NOPE', commands)).toBeNull()
  })
})
