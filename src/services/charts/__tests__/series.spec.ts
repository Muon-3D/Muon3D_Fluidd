import { describe, expect, it } from 'vitest'
import { discoverSeries, recordSample, isSeriesOn } from '../series'

const printer: Record<string, any> = {
  extruder: { temperature: 214.6, target: 215, power: 0.4 },
  extruder1: { temperature: 30, target: 0, power: 0 },
  heater_bed: { temperature: 59.8, target: 60, power: 0.2 },
  'heater_generic chamber': { temperature: 38, target: 40, power: 0.1 },
  'temperature_sensor raspberry_pi': { temperature: 51 },
  'temperature_sensor mcu_temp': { temperature: 44 },
  'temperature_sensor chamber_air': { temperature: 33 },
  'temperature_fan exhaust': { temperature: 41, target: 45, speed: 0.6 },
  fan: { speed: 0.55 },
  'heater_fan hotend_fan': { speed: 1 },
  'controller_fan board': { speed: 0.3 },
  'fan_generic aux': { speed: 0 },
  'bme280 enclosure': { temperature: 24.5, humidity: 40, pressure: 1000 },
  'tmc2240 stepper_x': { temperature: 52 },
  'temperature_probe coil': { temperature: 36 },
  toolhead: { position: [0, 0, 0] },
  'gcode_macro START': { temperature: 'not a number' },
  print_stats: { state: 'printing' },
  configfile: { settings: { 'temperature_sensor mcu_temp': { sensor_type: 'temperature_mcu' }, 'temperature_sensor raspberry_pi': { sensor_type: 'temperature_host' } } }
}

describe('series discovery', () => {
  const defs = discoverSeries(printer)
  const keys = defs.map(d => d.key)
  const by = Object.fromEntries(defs.map(d => [d.key, d]))

  it('finds every heater with its power, every sensor and every fan with its speed', () => {
    expect(keys).toEqual(expect.arrayContaining([
      'extruder', 'extruderPower', 'extruder1', 'heater_bed', 'heater_bedPower',
      'heater_generic chamber', 'heater_generic chamberPower',
      'temperature_sensor raspberry_pi', 'temperature_sensor mcu_temp', 'temperature_sensor chamber_air',
      'temperature_fan exhaust', 'temperature_fan exhaustSpeed',
      'fanSpeed', 'heater_fan hotend_fanSpeed', 'controller_fan boardSpeed', 'fan_generic auxSpeed',
      'bme280 enclosure', 'tmc2240 stepper_x', 'temperature_probe coil'
    ]))
  })

  it('ignores objects that have no numeric temperature or speed', () => {
    expect(keys.some(k => k.startsWith('toolhead') || k.startsWith('gcode_macro') || k.startsWith('print_stats') || k === 'configfile')).toBe(false)
  })

  it('puts the heaters first, then the rest, and the power and speed lines last', () => {
    expect(keys.slice(0, 2)).toEqual(['extruder', 'heater_bed'])
    const firstExtra = defs.findIndex(d => d.kind !== 'temp')
    expect(defs.slice(firstExtra).every(d => d.kind !== 'temp')).toBe(true)
  })

  it('labels in plain words and groups MCU and host temperatures together', () => {
    expect(by.extruder.label).toBe('Nozzle')
    expect(by.extruder1.label).toBe('Nozzle 2')
    expect(by.heater_bed.label).toBe('Bed')
    expect(by.fanSpeed.label).toBe('Part fan')
    expect(by['temperature_sensor mcu_temp'].label).toBe('MCU temp')
    expect(by['tmc2240 stepper_x'].label).toBe('Stepper X driver')
    expect(by['temperature_sensor mcu_temp'].group).toBe('Board and host')
    expect(by['temperature_sensor raspberry_pi'].group).toBe('Board and host')
    expect(by['temperature_sensor chamber_air'].group).toBe('Sensors')
    expect(by['temperature_fan exhaustSpeed'].label).toBe('Exhaust speed')
  })

  it('links a target to its temperature series, and a power or speed to the right axis', () => {
    expect(by.extruder.targetKey).toBe('extruderTarget')
    expect(by['temperature_sensor mcu_temp'].targetKey).toBeUndefined()
    expect(by.extruderPower.axis).toBe(1)
    expect(by.extruder.axis).toBe(0)
  })

  it('draws only the hotends, the bed and the chamber until others are picked', () => {
    const on = defs.filter(d => isSeriesOn(d, {})).map(d => d.key)
    expect([...on].sort()).toEqual(['extruder', 'extruder1', 'heater_bed', 'heater_generic chamber', 'temperature_sensor chamber_air'])
    expect(isSeriesOn(by['temperature_sensor mcu_temp'], {})).toBe(false)
    expect(isSeriesOn(by['temperature_sensor mcu_temp'], { 'temperature_sensor mcu_temp': true })).toBe(true)
  })

  it('shows temperatures by default and leaves power and speed off until chosen', () => {
    expect(isSeriesOn(by.extruder, {})).toBe(true)
    expect(isSeriesOn(by.extruderPower, {})).toBe(false)
    expect(isSeriesOn(by.extruder, { extruder: false })).toBe(false)
    expect(isSeriesOn(by.extruderPower, { extruderPower: true })).toBe(true)
  })

  it('gives every series its own colour, stable between calls', () => {
    const colors = defs.map(d => d.color)
    expect(new Set(colors).size).toBeGreaterThan(8)
    expect(discoverSeries(printer).map(d => d.color)).toEqual(colors)
  })
})

describe('recording a sample', () => {
  it('records one column per series and its target, as Klipper reports them', () => {
    const defs = discoverSeries(printer)
    const row: any = recordSample(printer, defs, new Date(5000))
    expect(row.extruder).toBe(214.6)
    expect(row.extruderTarget).toBe(215)
    expect(row.extruderPower).toBeCloseTo(0.4)
    expect(row.fanSpeed).toBeCloseTo(0.55)
    expect(row['temperature_sensor mcu_temp']).toBe(44)
    expect(row.date.getTime()).toBe(5000)
    expect('temperature_sensor mcu_tempTarget' in row).toBe(false)
  })
})
