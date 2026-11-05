import { describe, expect, it } from 'vitest'
import { buildGraphOption, type GraphLine } from '../graph-option'
import type { SeriesDef } from '../series'

const def = (over: Partial<SeriesDef>): SeriesDef => ({ key: 'extruder', object: 'extruder', field: 'temperature', label: 'Nozzle', group: 'Heaters', kind: 'temp', axis: 0, scale: 1, unit: '°C', color: '#ff8c42', defaultOn: true, ...over })
const base = { from: 0, to: 60000, dark: false, markers: [] as Array<{ at: number, label: string }> }

describe('buildGraphOption', () => {
  it('draws one canvas line per shown series, with its target dashed beside it', () => {
    const lines: GraphLine[] = [{ def: def({ targetKey: 'extruderTarget' }), points: [[0, 20], [1000, 30]], targetPoints: [[0, 200], [1000, 200]] }]
    const option: any = buildGraphOption({ ...base, lines })
    expect(option.animation).toBe(false)
    expect(option.series.map((s: any) => s.id)).toEqual(['extruder', 'extruderTarget', 'markers'])
    expect(option.series[0].data).toEqual([[0, 20], [1000, 30]])
    expect(option.series[1].lineStyle.type).toBe('dashed')
    expect(option.series[0].showSymbol).toBe(false)
    expect(option.xAxis.min).toBe(0)
    expect(option.xAxis.max).toBe(60000)
  })

  it('shows the percent axis only when a power or speed line is drawn', () => {
    const temp: GraphLine = { def: def({}), points: [] }
    const power: GraphLine = { def: def({ key: 'extruderPower', kind: 'power', axis: 1, unit: '%', scale: 100 }), points: [] }
    expect((buildGraphOption({ ...base, lines: [temp] }) as any).yAxis[1].show).toBe(false)
    const withPower: any = buildGraphOption({ ...base, lines: [temp, power] })
    expect(withPower.yAxis[1].show).toBe(true)
    expect(withPower.series.find((s: any) => s.id === 'extruderPower').yAxisIndex).toBe(1)
    expect(withPower.series.find((s: any) => s.id === 'extruderPower').lineStyle.type).toBe('dotted')
  })

  it('marks observed events as vertical lines', () => {
    const option: any = buildGraphOption({ ...base, lines: [], markers: [{ at: 5000, label: 'Paused' }] })
    const marks = option.series.find((s: any) => s.id === 'markers').markLine.data
    expect(marks).toEqual([expect.objectContaining({ xAxis: 5000, name: 'Paused' })])
  })

  it('uses light text on dark and dark text on light', () => {
    const dark: any = buildGraphOption({ ...base, lines: [], dark: true })
    const light: any = buildGraphOption({ ...base, lines: [], dark: false })
    expect(dark.yAxis[0].axisLabel.color).not.toBe(light.yAxis[0].axisLabel.color)
  })

  it('rounds the temperature axis up so lines never touch the top', () => {
    const option: any = buildGraphOption({ ...base, lines: [] })
    expect(option.yAxis[0].max({ max: 214.6 })).toBe(230)
    expect(option.yAxis[0].max({ max: 20 })).toBe(100)
  })

  it('writes a tooltip that lists every shown series with its unit', () => {
    const option: any = buildGraphOption({ ...base, lines: [{ def: def({}), points: [] }] })
    const html = option.tooltip.formatter([{ seriesId: 'extruder', seriesName: 'Nozzle', marker: '', value: [1000, 214.55], axisValue: 1000 }])
    expect(html).toContain('Nozzle')
    expect(html).toContain('214.6')
    expect(html).toContain('°C')
  })
})
