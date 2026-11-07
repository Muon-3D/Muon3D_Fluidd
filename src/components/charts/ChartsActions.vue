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
    <v-menu
      offset-y
      left
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="charts-add"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon
            name="plus"
            small
          />
          Add chart
        </button>
      </template>
      <v-list dense>
        <v-list-item
          v-for="preset in presets"
          :key="preset"
          :data-tid="`charts-add-${preset}`"
          @click="add(preset)"
        >
          <v-list-item-title>{{ preset }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          data-tid="charts-add-custom"
          @click="add('')"
        >
          <v-list-item-title>Custom chart</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { chartsPage, setChartsRange } from '@/services/charts/page-state'
import { chartRanges, effectiveRange } from '@/services/charts/model'
import { chartPresets } from '@/store/layout/state'

/** The Charts header: one time range for every chart, and Add chart (a menu of charts to start from, or a custom one). */
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

  /** Charts to start from: the ones the default layout leaves out. */
  get presets (): string[] {
    return chartPresets().map(c => c.title)
  }

  /** Opens the chart editor on a preset, or on a custom chart (no title). */
  add (preset: string) {
    this.page.addPreset = preset
    this.page.addTick++
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
