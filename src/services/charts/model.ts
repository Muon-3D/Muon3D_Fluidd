/** A chart as the layout store keeps it: its id and whether it's shown, at least. */
export interface ChartEntry {
  id: string;
  enabled: boolean;
}

/**
 * Fluidd keeps the charts in up to four columns (container1 to container4);
 * Charts lists them in one order, the columns read in turn.
 */
export function flattenCharts<T extends ChartEntry> (layout: Record<string, T[]> | undefined): T[] {
  return Object.keys(layout ?? {})
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .flatMap(key => layout?.[key] ?? [])
}

/** The charts in one order, as the layout store takes them: all in the first column, the others empty. */
export function layoutFrom<T extends ChartEntry> (charts: T[]): Record<string, T[]> {
  return { container1: charts, container2: [], container3: [], container4: [] }
}

/** A chart moved `by` places (-1 earlier, 1 later); unchanged at either end. */
export function moveChart<T extends ChartEntry> (charts: T[], id: string, by: number): T[] {
  const from = charts.findIndex(c => c.id === id)
  const to = from + by
  if (from < 0 || to < 0 || to >= charts.length) return charts
  const next = [...charts]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** A metric's latest value from the chart store, keyed by its collector. */
export function metricValue (points: Array<Record<string, unknown>> | undefined, collector: string): number | null {
  for (let i = (points?.length ?? 0) - 1; i >= 0; i--) {
    const value = points![i][collector]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value !== '' && Number.isFinite(Number(value))) return Number(value)
  }
  return null
}

/** "12.346 mm/s", "—", to three places as Fluidd's tooltip shows them. */
export function formatMetric (value: number | null, unit: string): string {
  if (value === null) return '—'
  const rounded = Math.round(value * 1000) / 1000
  return unit ? `${rounded} ${unit}` : String(rounded)
}

/** How many of the page's twelve columns a chart tile takes. */
export type ChartSpan = 4 | 6 | 8 | 12

export const CHART_SPANS: ChartSpan[] = [4, 6, 8, 12]

/** A chart's own width, else the layout's: the first one wide, the rest small. */
export function chartSpan (chart: { span?: number }, index: number): ChartSpan {
  if (CHART_SPANS.includes(chart.span as ChartSpan)) return chart.span as ChartSpan
  return index === 0 ? 8 : 4
}

/** One size up or down, and not past either end. */
export function nextSpan (span: ChartSpan, by: 1 | -1): ChartSpan {
  const i = CHART_SPANS.indexOf(span) + by
  return CHART_SPANS[Math.max(0, Math.min(CHART_SPANS.length - 1, i))]
}

/** What the collector said instead of a number on the latest reading: its error. */
export function metricError (points: Array<Record<string, unknown>> | undefined, collector: string): string | null {
  const last = points?.[points.length - 1]
  const value = last?.[collector]
  return typeof value === 'string' && value !== '' && !Number.isFinite(Number(value)) ? value : null
}

/** The time range the header shares with every chart. */
export const CHART_RANGES = [
  { value: 60, label: '1 min' },
  { value: 600, label: '10 min' },
  { value: 3600, label: '1 h' }
]

/** The ranges, those longer than the printer keeps turned off. */
export function chartRanges (retentionSeconds: number): Array<{ value: number, label: string, disabled?: boolean, title?: string }> {
  const keep = Math.max(60, Math.floor(retentionSeconds || 0))
  return CHART_RANGES.map(r => r.value > keep
    ? { ...r, disabled: true, title: `The printer keeps the last ${rangeText(keep)}` }
    : r)
}

/** The range in force: the one picked, or the longest the printer keeps. */
export function effectiveRange (picked: number, retentionSeconds: number): number {
  const keep = Math.max(60, Math.floor(retentionSeconds || 0))
  return Math.min(picked, keep)
}

/** "minute", "10 minutes", "hour". */
export function rangeText (seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.round(seconds / 3600)
    return h === 1 ? 'hour' : `${h} hours`
  }
  const m = Math.max(1, Math.round(seconds / 60))
  return m === 1 ? 'minute' : `${m} minutes`
}

/** The tile's icon, from what the chart draws. */
export function chartIcon (chart: { title?: string, icon?: string }): string {
  const text = `${chart.title ?? ''} ${chart.icon ?? ''}`.toLowerCase()
  if (/temp|thermo|heat|fire/.test(text)) return 'thermometer'
  if (/pressure|load cell|probe|force|sliders/.test(text)) return 'control'
  if (/mcu|cpu|chip|load\b|memory/.test(text)) return 'chip'
  if (/fan/.test(text)) return 'fan'
  return 'pulse'
}
