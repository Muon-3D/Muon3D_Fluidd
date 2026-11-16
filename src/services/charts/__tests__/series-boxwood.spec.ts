import { describe, expect, it } from 'vitest'
import { discoverSeries, groupOf, isSeriesOn, GROUP_ORDER } from '../series'

/**
 * Boxwood's real temperature objects, read from the printer (GET
 * /printer/objects/query). The CPU is reported twice: a `temperature_fan CPU`
 * (the fan that cools it) and a bare `temperature_host CPU`, which has no
 * section in the config of its own.
 */
const boxwood: Record<string, any> = {
  extruder: { temperature: 32.47, target: 0, power: 0 },
  heater_bed: { temperature: 22.9, target: 0, power: 0 },
  heaters: { available_heaters: ['heater_bed', 'extruder'], available_sensors: ['heater_bed', 'temperature_fan CPU', 'temperature_fan Motor_Drivers', 'temperature_sensor toolhead_fan_air', 'temperature_sensor toolhead_extruder_motor', 'temperature_fan toolhead_heatsink', 'extruder'] },
  'temperature_host CPU': { temperature: 53.07 },
  'temperature_fan CPU': { speed: 0, rpm: 0, temperature: 53.07, target: 65 },
  'temperature_fan Motor_Drivers': { speed: 0, rpm: 0, temperature: 40.37, target: 80 },
  'power_fan Power_Supply': { speed: 0, rpm: 0 },
  'temperature_sensor toolhead_fan_air': { temperature: 30.85 },
  'temperature_sensor toolhead_extruder_motor': { temperature: 31.84 },
  'temperature_fan toolhead_heatsink': { speed: 0, rpm: 0, temperature: 30.99, target: 65 },
  fan: { speed: 0, rpm: 0 },
  system_stats: { sysload: 1.05, cputime: 1334, memavail: 1157332 },
  toolhead: { position: [0, 0, 0, 0] },
  configfile: {
    settings: {
      'temperature_fan cpu': { sensor_type: 'temperature_host', sensor_path: '/sys/class/thermal/thermal_zone0/temp', target_temp: 65 },
      'temperature_fan motor_drivers': { sensor_type: 'CMFD473F4050HANT' },
      'temperature_sensor toolhead_fan_air': { sensor_type: 'CMFD473F4050HANT' },
      'temperature_sensor toolhead_extruder_motor': { sensor_type: 'CMFD473F4050HANT' },
      'temperature_fan toolhead_heatsink': { sensor_type: 'CMFD473F4050HANT' }
    }
  }
}

describe("Boxwood's real sensors", () => {
  const defs = discoverSeries(boxwood)
  const temps = defs.filter(d => d.kind === 'temp')

  it('draws the CPU once', () => {
    expect(temps.filter(d => /cpu/i.test(d.label)).map(d => d.key)).toEqual(['temperature_fan CPU'])
  })

  it('draws only the nozzle and the bed until others are picked', () => {
    expect(defs.filter(d => isSeriesOn(d, {})).map(d => d.key)).toEqual(['extruder', 'heater_bed'])
  })

  it('keeps the other sensors one pick away', () => {
    const keys = defs.map(d => d.key)
    for (const k of ['temperature_fan Motor_Drivers', 'temperature_sensor toolhead_fan_air', 'temperature_sensor toolhead_extruder_motor', 'temperature_fan toolhead_heatsink']) expect(keys).toContain(k)
    expect(keys).not.toContain('temperature_host CPU')
  })

  it('groups by part: toolhead, bed, chamber and system, fans', () => {
    const by = Object.fromEntries(defs.map(d => [d.key, d.group]))
    expect(by.extruder).toBe('Toolhead')
    expect(by.extruderPower).toBe('Toolhead')
    expect(by['temperature_sensor toolhead_fan_air']).toBe('Toolhead')
    expect(by['temperature_sensor toolhead_extruder_motor']).toBe('Toolhead')
    expect(by['temperature_fan toolhead_heatsink']).toBe('Toolhead')
    expect(by['temperature_fan toolhead_heatsinkSpeed']).toBe('Toolhead')
    expect(by.heater_bed).toBe('Bed')
    expect(by.heater_bedPower).toBe('Bed')
    expect(by['temperature_fan CPU']).toBe('Chamber and system')
    expect(by['temperature_fan Motor_Drivers']).toBe('Chamber and system')
    expect(by['power_fan Power_SupplySpeed']).toBe('Chamber and system')
    expect(by.fanSpeed).toBe('Fans')
  })

  it('lists the groups in order, the nozzle with its power first', () => {
    const order = defs.map(d => GROUP_ORDER.indexOf(d.group))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(defs.slice(0, 2).map(d => d.key)).toEqual(['extruder', 'extruderPower'])
    const bed = defs.findIndex(d => d.key === 'heater_bed')
    expect(defs[bed + 1].key).toBe('heater_bedPower')
    expect(defs.findIndex(d => d.group === 'Bed')).toBe(bed)
  })

  it('finds the CPU even when only the bare host object is there', () => {
    const bare = { ...boxwood }
    delete bare['temperature_fan CPU']
    expect(discoverSeries(bare).filter(d => /cpu/i.test(d.label)).map(d => d.key)).toEqual(['temperature_host CPU'])
    expect(groupOf('temperature_host CPU')).toBe('Chamber and system')
  })
})
