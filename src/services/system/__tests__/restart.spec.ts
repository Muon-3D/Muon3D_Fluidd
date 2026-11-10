import { describe, it, expect } from 'vitest'
import {
  RESTART_ROWS, canStopService, clearHostOff, hostPower, hostRefusal, markHostOff, needsCooling, printStopWarning, runningLine, serviceLog, shutdownHeatLine, took
} from '../restart'

describe('System restart rows', () => {
  it('are four, mildest first, and only Shut down is red', () => {
    expect(RESTART_ROWS.map(r => r.title)).toEqual(['Restart Klipper', 'Restart Klipper and the boards', 'Restart the computer', 'Shut down'])
    expect(RESTART_ROWS.filter(r => r.danger).map(r => r.id)).toEqual(['shutdown'])
  })

  it('refuse the computer while printing or paused, in plain words', () => {
    expect(hostRefusal(false)).toBeNull()
    expect(hostRefusal(true)).toMatch(/^Not while printing: it would stop the print/)
    expect(hostRefusal(false, true)).toMatch(/paused/)
  })

  it('warn that a restart during a print stops it, and where', () => {
    expect(printStopWarning('M1_bracket.gcode', 0.44)).toBe("M1_bracket stops at 44% and can't be resumed. The heaters turn off.")
    expect(printStopWarning(null, null)).toBe("The print stops and can't be resumed. The heaters turn off.")
  })

  it('say how long it took and how long it usually takes', () => {
    expect(took(8200)).toBe('took 8 s')
    expect(took(72_000)).toBe('took 1 min 12 s')
    expect(runningLine(10)).toBe('Usually 10 s. Controls come back when it answers.')
    expect(runningLine(120)).toMatch(/Usually 2–3 min/)
  })

  it('shut down shows the hotend, and waits to cool it above 50 °C', () => {
    expect(shutdownHeatLine(34)).toBe('Hotend is 34 °C: safe to shut down.')
    expect(shutdownHeatLine(62)).toMatch(/the fan cools it to 50 °C first/)
    expect(shutdownHeatLine(null)).toBe('')
    expect(needsCooling(50)).toBe(false)
    expect(needsCooling(51)).toBe(true)
    expect(needsCooling(null)).toBe(false)
  })

  it('has no Stop for Moonraker, nor for Muon link while away', () => {
    expect(canStopService('moonraker', false)).toBe(false)
    expect(canStopService('muon-link', false)).toBe(true)
    expect(canStopService('muon-link', true)).toBe(false)
    expect(canStopService('klipper', true)).toBe(true)
  })

  it('knows the log of the programs that write one', () => {
    expect(serviceLog('klipper')).toBe('klippy.log')
    expect(serviceLog('moonraker')).toBe('moonraker.log')
    expect(serviceLog('timelapse')).toBeNull()
  })

  it('remembers that the computer was shut down from here', () => {
    markHostOff(1000)
    expect(hostPower.offAt).toBe(1000)
    clearHostOff()
    expect(hostPower.offAt).toBeNull()
  })
})
