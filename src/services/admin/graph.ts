/**
 * Line and bar drawing for the admin portal's panels: ECharts on a canvas with
 * only the parts needed, loaded on first use (spec 4.4: charts are created lazily).
 */
import type { GraphHandle } from '@/services/charts/engine'
import { canvasAvailable } from '@/services/charts/engine'
import type { Series, Threshold } from './obs'

export async function createAdminGraph (el: HTMLElement): Promise<GraphHandle> {
  if (!canvasAvailable()) throw new Error('No 2D canvas available')
  const [core, charts, components, renderers] = await Promise.all([
    import('echarts/core'), import('echarts/charts'), import('echarts/components'), import('echarts/renderers')
  ])
  core.use([charts.LineChart, charts.BarChart, components.GridComponent, components.TooltipComponent, components.MarkLineComponent, renderers.CanvasRenderer])
  if (!el.isConnected) throw new Error('Graph element is gone')
  const chart = core.init(el, undefined, { renderer: 'canvas' })
  return {
    setOption: option => chart.setOption(option as never, { notMerge: true, lazyUpdate: true }),
    resize: () => chart.resize(),
    dispose: () => chart.dispose()
  }
}

/** A series name from its labels: the value of its first label, or the metric's `__name__`. */
export function seriesName (series: Series, index: number): string {
  const values = Object.entries(series.labels).filter(([key]) => key !== '__name__').map(([, value]) => value)
  return values[0] ?? series.labels.__name__ ?? `Series ${index + 1}`
}

/** At most four named series; the rest fold into "Other", which a chart sums (stacked) or leaves out (lines). */
export const MAX_SERIES = 4

export function css (name: string, fallback: string): string {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback } catch { return fallback }
}

export function chartOption (kind: string, series: Series[], unit: string, thresholds: Threshold[] = []): Record<string, unknown> {
  const stacked = kind === 'stacked_bar'
  const colours = [1, 2, 3, 4].map((n, i) => css(`--m3d-chart-${n}`, ['#1fa89e', '#9c6cd9', '#cc7f36', '#5b88e2'][i]))
  const subtle = css('--m3d-text-subtle', '#6f7a80')
  const border = css('--m3d-border', '#2c3337')
  const shown = series.slice(0, MAX_SERIES)
  const rest = series.slice(MAX_SERIES)
  const named = shown.map((s, i) => ({ name: seriesName(s, i), points: s.points, colour: colours[i] }))
  if (rest.length) {
    const sums = new Map<number, number>()
    for (const s of rest) for (const [t, v] of s.points) sums.set(t, (sums.get(t) ?? 0) + (v ?? 0))
    named.push({ name: 'Other', points: [...sums.entries()].sort((a, b) => a[0] - b[0]), colour: subtle })
  }
  return {
    animation: false,
    grid: { left: 44, right: 8, top: 8, bottom: 20 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, valueFormatter: (v: unknown) => (v === null || v === undefined ? '—' : `${v}${unit && unit !== 'count' ? ` ${unit}` : ''}`) },
    xAxis: { type: 'time', axisLine: { lineStyle: { color: border } }, axisLabel: { color: subtle, fontFamily: 'IBM Plex Mono', fontSize: 10, hideOverlap: true } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: border } }, axisLabel: { color: subtle, fontFamily: 'IBM Plex Mono', fontSize: 10 } },
    series: named.map((s, i) => ({
      name: s.name,
      type: stacked || kind === 'bar' ? 'bar' : 'line',
      stack: stacked ? 'total' : undefined,
      showSymbol: false,
      lineStyle: { width: 2 },
      itemStyle: { color: s.colour },
      color: s.colour,
      data: s.points.map(([t, v]) => [t * 1000, v]),
      markLine: i === 0 && thresholds.length
        ? { silent: true, symbol: 'none', label: { show: false }, data: thresholds.map(t => ({ yAxis: t.value, lineStyle: { type: 'dashed', width: 1, color: css(t.level === 'critical' ? '--m3d-danger' : '--m3d-warning', '#c23b32') } })) }
        : undefined
    }))
  }
}
