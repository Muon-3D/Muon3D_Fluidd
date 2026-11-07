import { describe, expect, it } from 'vitest'
import {
  chartIcon, chartRanges, chartSpan, effectiveRange, flattenCharts, formatMetric, layoutFrom, metricError, metricValue, moveChart, nextSpan, rangeText
} from '../model'

const chart = (id: string) => ({ id, enabled: true })

describe('the charts\' order', () => {
  it('reads Fluidd\'s columns in turn, container10 after container2', () => {
    const layout = { container10: [chart('z')], container2: [chart('c')], container1: [chart('a'), chart('b')] }
    expect(flattenCharts(layout).map(c => c.id)).toEqual(['a', 'b', 'c', 'z'])
    expect(flattenCharts(undefined)).toEqual([])
  })

  it('writes them back in one column', () => {
    expect(layoutFrom([chart('a')])).toEqual({ container1: [chart('a')], container2: [], container3: [], container4: [] })
  })

  it('moves a chart earlier or later, and not past either end', () => {
    const list = [chart('a'), chart('b'), chart('c')]
    expect(moveChart(list, 'c', -1).map(c => c.id)).toEqual(['a', 'c', 'b'])
    expect(moveChart(list, 'a', 1).map(c => c.id)).toEqual(['b', 'a', 'c'])
    expect(moveChart(list, 'a', -1)).toBe(list)
    expect(moveChart(list, 'nope', 1)).toBe(list)
  })
})

describe('a metric\'s value', () => {
  it('is the latest number for its collector, skipping gaps', () => {
    const points = [{ 'toolhead.velocity': 10 }, { 'toolhead.velocity': '12.5' }, { other: 1 }]
    expect(metricValue(points, 'toolhead.velocity')).toBe(12.5)
    expect(metricValue(points, 'missing')).toBeNull()
  })

  it('shows three places and its unit', () => {
    expect(formatMetric(12.34567, 'mm/s')).toBe('12.346 mm/s')
    expect(formatMetric(3, '')).toBe('3')
    expect(formatMetric(null, 'mm/s')).toBe('—')
  })
})

describe('the Charts tiles', () => {
  it('makes the first wide and the rest small, unless a chart is sized', () => {
    expect(chartSpan({}, 0)).toBe(8)
    expect(chartSpan({}, 3)).toBe(4)
    expect(chartSpan({ span: 12 }, 3)).toBe(12)
    expect(chartSpan({ span: 5 }, 0)).toBe(8)
  })

  it('sizes a tile one step at a time, and not past either end', () => {
    expect(nextSpan(4, 1)).toBe(6)
    expect(nextSpan(8, 1)).toBe(12)
    expect(nextSpan(12, 1)).toBe(12)
    expect(nextSpan(4, -1)).toBe(4)
  })

  it('picks the tile\'s icon from what it draws', () => {
    expect(chartIcon({ title: 'Temperatures' })).toBe('thermometer')
    expect(chartIcon({ title: 'MCU load' })).toBe('chip')
    expect(chartIcon({ title: 'Fans' })).toBe('fan')
    expect(chartIcon({ title: 'Speed and flow', icon: 'motion' })).toBe('pulse')
    expect(chartIcon({ title: 'Pressure and load cell', icon: 'sliders' })).toBe('control')
  })

  it('reads a collector\'s error off the latest reading only', () => {
    expect(metricError([{ a: 'x is not defined' }], 'a')).toBe('x is not defined')
    expect(metricError([{ a: 'x is not defined' }, { a: 3 }], 'a')).toBeNull()
    expect(metricError([{ a: '12' }], 'a')).toBeNull()
    expect(metricError([], 'a')).toBeNull()
  })
})

describe('the shared time range', () => {
  it('offers 1 min, 10 min and 1 h, and turns off what the printer does not keep', () => {
    const ranges = chartRanges(1200)
    expect(ranges.map(r => r.label)).toEqual(['1 min', '10 min', '1 h'])
    expect(ranges.map(r => !!r.disabled)).toEqual([false, false, true])
    expect(ranges[2].title).toBe('The printer keeps the last 20 minutes')
    expect(chartRanges(7200).some(r => r.disabled)).toBe(false)
  })

  it('draws no more than the printer keeps', () => {
    expect(effectiveRange(3600, 1200)).toBe(1200)
    expect(effectiveRange(600, 1200)).toBe(600)
  })

  it('says the range as the header does', () => {
    expect(rangeText(60)).toBe('minute')
    expect(rangeText(600)).toBe('10 minutes')
    expect(rangeText(3600)).toBe('hour')
  })
})
