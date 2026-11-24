<template>
  <div
    ref="host"
    class="chart"
    role="img"
    :aria-label="label"
    :data-tid="`admin-chart-${id}`"
  />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { GraphHandle } from '@/services/charts/engine'
import { chartOption, createAdminGraph } from '@/services/admin/graph'
import type { Series, Threshold } from '@/services/admin/obs'

/** One line or bar chart (spec 4.4): drawn when scrolled into view, redrawn on data or size change, disposed with the section. */
export default defineComponent({
  props: {
    id: { type: String, required: true },
    kind: { type: String, default: 'line' },
    series: { type: Array as PropType<Series[]>, required: true },
    unit: { type: String, default: '' },
    thresholds: { type: Array as PropType<Threshold[]>, default: () => [] },
    label: { type: String, required: true }
  },
  data () { return { handle: null as GraphHandle | null, visible: false, observer: null as IntersectionObserver | null, observed: null as ResizeObserver | null, gone: false } },
  watch: {
    series () { this.draw() },
    thresholds () { this.draw() },
    visible () { this.draw() }
  },
  mounted () {
    const host = this.$refs.host as HTMLElement
    if (typeof IntersectionObserver === 'undefined') this.visible = true
    else {
      this.observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) this.visible = true })
      this.observer.observe(host)
    }
  },
  beforeDestroy () {
    this.gone = true
    this.observer?.disconnect(); this.observed?.disconnect()
    this.handle?.dispose(); this.handle = null
  },
  methods: {
    async draw () {
      if (!this.visible || this.gone) return
      const host = this.$refs.host as HTMLElement
      try {
        if (!this.handle) {
          const handle = await createAdminGraph(host)
          if (this.gone) { handle.dispose(); return }
          this.handle = handle
          if (typeof ResizeObserver !== 'undefined') { this.observed = new ResizeObserver(() => this.handle?.resize()); this.observed.observe(host) }
        }
        this.handle.setOption(chartOption(this.kind, this.series, this.unit, this.thresholds))
      } catch { /* No canvas (or the page is leaving): the table view still shows the data. */ }
    }
  }
})
</script>

<style lang="scss" scoped>
.chart { width: 100%; height: 150px; }
</style>
