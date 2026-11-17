import { describe, expect, it } from 'vitest'
import { chartPresets, defaultState, newChartTemplate } from '../state'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'

describe('the default charts', () => {
  it('are the one Speeds chart Fluidd has always started with', () => {
    const charts = defaultState().layouts.diagnostics.container1 as DiagnosticsCardConfig[]
    expect(charts.map(c => c.title)).toEqual(['Speeds'])
    expect(charts[0].height).toBe(300)
    expect(charts[0].axes.map(a => a.unit)).toEqual(['mm/s', 'mm³/s'])
  })

  it('start a new chart from the Speeds chart', () => {
    expect(newChartTemplate().title).toBe('Speeds')
  })

  it('leave the other charts to Add chart, each with its own id', () => {
    const presets = chartPresets()
    expect(presets.map(c => c.title)).toEqual(['Temperatures', 'MCU load', 'Fans', 'Speed and flow', 'Pressure and load cell'])
    expect(new Set(presets.map(c => c.id)).size).toBe(5)
    expect(chartPresets()[0].id).not.toBe(presets[0].id)
  })
})
