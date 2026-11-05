/**
 * The drawing engine for the temperature graph: ECharts on a canvas, with only
 * the parts a line graph needs. It loads on first use, so pages without a graph
 * never pay for it.
 */
export interface GraphHandle {
  setOption (option: Record<string, unknown>): void
  resize (): void
  dispose (): void
}

export async function createGraph (el: HTMLElement): Promise<GraphHandle> {
  const [core, charts, components, renderers] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers')
  ])
  core.use([charts.LineChart, components.GridComponent, components.TooltipComponent, components.MarkLineComponent, renderers.CanvasRenderer])
  const chart = core.init(el, undefined, { renderer: 'canvas' })
  return {
    // Everything is redrawn from scratch each second from the decimated buffer, so nothing needs merging.
    setOption: option => chart.setOption(option as never, { notMerge: true, lazyUpdate: true }),
    resize: () => chart.resize(),
    dispose: () => chart.dispose()
  }
}
