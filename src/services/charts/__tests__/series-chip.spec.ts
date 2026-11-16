import { describe, expect, it } from 'vitest'
import { discoverSeries, sameChip } from '../series'

const HOST = 'host:/sys/class/thermal/thermal_zone0/temp'

const m1 = {
  configfile: {
    settings: {
      'temperature_fan cpu': { sensor_type: 'temperature_host' },
      'temperature_sensor cm4': { sensor_type: 'temperature_host' },
      'temperature_sensor mcu': { sensor_type: 'temperature_mcu' },
      'temperature_sensor toolhead_mcu': { sensor_type: 'temperature_mcu', sensor_mcu: 'toolhead' },
      'temperature_sensor chamber': { sensor_type: 'NTC 100K' }
    }
  },
  extruder: { temperature: 200, target: 200 },
  heater_bed: { temperature: 60, target: 60 },
  'temperature_fan CPU': { temperature: 51.2, target: 60, speed: 0.3 },
  'temperature_sensor cm4': { temperature: 51.2 },
  'temperature_sensor mcu': { temperature: 44.1 },
  'temperature_sensor toolhead_mcu': { temperature: 40 },
  'temperature_sensor chamber': { temperature: 34.7 }
}

describe('one line per chip', () => {
  it('knows which sections read the same chip', () => {
    expect(sameChip(m1, 'temperature_fan CPU')).toBe(HOST)
    expect(sameChip(m1, 'temperature_sensor cm4')).toBe(HOST)
    expect(sameChip(m1, 'temperature_sensor mcu')).toBe('mcu:mcu')
    expect(sameChip(m1, 'temperature_sensor toolhead_mcu')).toBe('mcu:toolhead')
    expect(sameChip(m1, 'temperature_sensor chamber')).toBeNull()
  })

  it('draws the CPU once: the temperature fan keeps it, the plain host sensor goes', () => {
    const keys = discoverSeries(m1).filter(d => d.kind === 'temp').map(d => d.key)
    expect(keys).toContain('temperature_fan CPU')
    expect(keys).not.toContain('temperature_sensor cm4')
    expect(keys.filter(k => sameChip(m1, k) === HOST)).toHaveLength(1)
  })

  it('keeps different MCUs and ordinary sensors', () => {
    const keys = discoverSeries(m1).map(d => d.key)
    expect(keys).toEqual(expect.arrayContaining(['temperature_sensor mcu', 'temperature_sensor toolhead_mcu', 'temperature_sensor chamber', 'extruder', 'heater_bed']))
  })
})
