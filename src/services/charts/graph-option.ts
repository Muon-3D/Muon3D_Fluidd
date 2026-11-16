import type { SeriesDef } from './series'

export interface GraphLine {
  def: SeriesDef
  points: Array<[number, number]>
  targetPoints?: Array<[number, number]>
}

export interface GraphInput {
  lines: GraphLine[]
  from: number
  to: number
  dark: boolean
  markers: Array<{ at: number, label: string }>
  phone?: boolean
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** The ECharts option for one draw. Pure: same input, same option. */
export function buildGraphOption (input: GraphInput): Record<string, unknown> {
  const text = input.dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)'
  const grid = input.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const fontSize = input.phone ? 12 : 13
  const percent = input.lines.some(l => l.def.axis === 1)

  const series: Array<Record<string, unknown>> = []
  for (const { def, points, targetPoints } of input.lines) {
    const secondary = def.axis === 1
    series.push({
      id: def.key,
      name: def.label,
      type: 'line',
      yAxisIndex: def.axis,
      data: points,
      showSymbol: false,
      animation: false,
      silent: true,
      connectNulls: true,
      color: def.color,
      lineStyle: { color: def.color, width: secondary ? 1 : 1.75, type: secondary ? 'dotted' : 'solid' },
      emphasis: { disabled: true }
    })
    if (def.targetKey && targetPoints) {
      series.push({
        id: def.targetKey,
        name: `${def.label} target`,
        type: 'line',
        yAxisIndex: 0,
        data: targetPoints,
        showSymbol: false,
        animation: false,
        silent: true,
        connectNulls: true,
        color: def.color,
        lineStyle: { color: def.color, width: 1, type: 'dashed', opacity: 0.7 },
        emphasis: { disabled: true }
      })
    }
  }
  series.push({
    id: 'markers',
    type: 'line',
    data: [],
    silent: true,
    markLine: {
      silent: true,
      symbol: 'none',
      animation: false,
      lineStyle: { color: text, type: 'solid', width: 1, opacity: 0.6 },
      label: { show: false },
      data: input.markers.filter(m => m.at >= input.from && m.at <= input.to).map(m => ({ xAxis: m.at, name: m.label }))
    }
  })

  const unitOf = new Map<string, SeriesDef>()
  for (const { def } of input.lines) {
    unitOf.set(def.key, def)
    if (def.targetKey) unitOf.set(def.targetKey, { ...def, label: `${def.label} target` })
  }

  return {
    animation: false,
    backgroundColor: 'transparent',
    textStyle: { fontSize },
    grid: { top: 10, left: input.phone ? 34 : 40, right: percent ? (input.phone ? 34 : 40) : 12, bottom: 22 },
    xAxis: {
      type: 'time',
      min: input.from,
      max: input.to,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: true, lineStyle: { color: grid } },
      axisLabel: { color: text, fontSize, formatter: '{HH}:{mm}', hideOverlap: true }
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: (v: { max: number }) => v.max <= 90 ? 100 : Math.ceil((v.max + 10) / 10) * 10,
        splitNumber: 4,
        axisLabel: { color: text, fontSize, formatter: '{value}°' },
        splitLine: { show: true, lineStyle: { color: grid } }
      },
      {
        type: 'value',
        show: percent,
        min: 0,
        max: 100,
        splitNumber: 4,
        axisLabel: { color: text, fontSize, formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: input.dark ? 'rgba(20,20,22,0.92)' : 'rgba(255,255,255,0.95)',
      borderWidth: 0,
      textStyle: { color: text, fontSize },
      axisPointer: { type: 'line', lineStyle: { color: text, opacity: 0.5 } },
      formatter: (params: Array<{ seriesId?: string, seriesName?: string, marker?: string, value?: unknown, axisValue?: number }>) => {
        const rows = (Array.isArray(params) ? params : []).filter(p => Array.isArray(p.value) && typeof p.value[1] === 'number')
        if (!rows.length) return ''
        const head = `<div style="opacity:.7">${esc(clock(Number(rows[0].axisValue ?? (rows[0].value as number[])[0])))}</div>`
        return head + rows.map(p => {
          const def = unitOf.get(p.seriesId ?? '')
          const v = (p.value as number[])[1]
          const shown = def?.unit === '%' ? v.toFixed(0) : v.toFixed(1)
          return `<div style="white-space:nowrap">${p.marker ?? ''}${esc(p.seriesName ?? '')} <b style="float:right;margin-left:16px">${shown}${def?.unit ?? ''}</b></div>`
        }).join('')
      }
    },
    series
  }
}
