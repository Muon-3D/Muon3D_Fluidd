<template>
  <router-link
    :to="{ path: to, query: carry }"
    class="tile"
    :data-tid="`admin-tile-${panel.id}`"
    :aria-label="aria"
  >
    <span class="tile__label"><i
      class="tile__dot"
      :class="`tile__dot--${level}`"
    />{{ panel.title }}</span>
    <span class="tile__value">
      <template v-if="skeleton">&nbsp;</template>
      <template v-else>{{ value }}</template>
    </span>
    <span class="tile__note">{{ skeleton ? '' : note }}</span>
  </router-link>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { formatValue } from '@/services/admin/format'
import type { CatalogPanel, PanelResult } from '@/services/admin/obs'

/** A health tile (spec 4.3). The dot always has the note beside it, so state is never colour alone. */
export default defineComponent({
  props: {
    panel: { type: Object as PropType<CatalogPanel>, required: true },
    result: { type: Object as PropType<PanelResult | undefined>, default: undefined },
    to: { type: String, default: '/admin' },
    carry: { type: Object as PropType<Record<string, string>>, default: () => ({}) }
  },
  computed: {
    skeleton (): boolean { return !this.result },
    unavailable (): boolean { return this.result?.status === 'unavailable' },
    level (): string {
      if (!this.result || this.unavailable) return 'none'
      if (this.result.level) return this.result.level
      const v = this.result.value
      if (typeof v !== 'number') return 'none'
      const hit = (this.panel.thresholds ?? []).filter(t => v >= t.value)
      return hit.some(t => t.level === 'critical') ? 'critical' : hit.length ? 'warning' : 'good'
    },
    levelWord (): string { return { good: 'ok', warning: 'warning', critical: 'critical', none: 'no data' }[this.level] ?? '' },
    value (): string {
      if (this.unavailable || !this.result) return '—'
      const v = this.result.value
      if (v === null || v === undefined) return '—'
      return typeof this.result.of === 'number' ? `${v} of ${this.result.of}` : formatValue(v, this.panel.unit)
    },
    note (): string { return this.unavailable ? 'No data' : this.result?.note ?? '' },
    aria (): string { return this.skeleton ? `${this.panel.title}: loading` : `${this.panel.title}: ${this.value}${this.note ? `, ${this.note}` : ''}, ${this.levelWord}` }
  }
})
</script>

<style lang="scss" scoped>
.tile { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 12px 14px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); color: var(--m3d-text); text-decoration: none; }
.tile__label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--m3d-text-muted); }
.tile__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--m3d-text-subtle); flex: none; }
.tile__dot--good { background: var(--m3d-success); } .tile__dot--warning { background: var(--m3d-warning); } .tile__dot--critical { background: var(--m3d-danger); }
.tile__value { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; min-height: 32px; }
.tile__note { font-size: 12px; color: var(--m3d-text-muted); min-height: 16px; }
@media (max-width: 760px) { .tile__value { font-size: 20px; } .tile { min-height: 40px; } }
:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
</style>
