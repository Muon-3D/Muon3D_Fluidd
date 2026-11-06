<template>
  <div
    v-if="collecting"
    class="charts-actions"
    :class="{ 'charts-actions--phone': isMobileViewport }"
    data-tid="charts-actions"
  >
    <seg-picker
      :options="ranges"
      :value="range"
      label="Time range"
      data-tid="charts-range"
      @input="setRange"
    />
    <button
      type="button"
      class="cbtn cbtn--primary"
      data-tid="charts-add"
      @click="page.addTick++"
    >
      <frame-icon
        name="plus"
        small
      />
      Add chart
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { chartsPage, setChartsRange } from '@/services/charts/page-state'
import { chartRanges, effectiveRange } from '@/services/charts/model'

/** The Charts header: one time range for every chart, and Add chart. */
@Component({ components: { SegPicker } })
export default class ChartsActions extends Mixins(BrowserMixin) {
  page = chartsPage

  get collecting (): boolean {
    return !!this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  get retention (): number {
    return this.$store.getters['charts/getChartRetention'] as number
  }

  get ranges (): SegOption[] {
    return chartRanges(this.retention)
  }

  get range (): number {
    return effectiveRange(this.page.range, this.retention)
  }

  setRange (value: string | number) {
    setChartsRange(Number(value))
  }
}
</script>

<style lang="scss" scoped>
  .charts-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .charts-actions--phone {
    gap: 8px;
  }
</style>
