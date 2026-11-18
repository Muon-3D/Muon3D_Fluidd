<template>
  <span
    v-if="count !== null && count > 0"
    class="hotspot-count"
    data-tid="hotspot-count"
    role="img"
    :title="title"
    :aria-label="title"
  >
    <i class="hotspot-count__dot" />
    <span data-tid="hotspot-count-n">{{ count }}</span>
    <span
      v-if="!compact"
      class="hotspot-count__word"
    >connected</span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { hotspotCountTitle, hotspotDeviceCount, hotspotState } from '@/services/hotspot/model'
import { startHotspotPoll } from '@/services/hotspot/poller'

/**
 * How many devices are on the printer's hotspot (KAN-4297), whatever route
 * Control reaches the printer by. It runs the shared light poll while it is on
 * screen, and shows nothing when the hotspot is down, nobody is on it, or the
 * printer can't say. It is the small green "3 connected" tab that sits on top of
 * the connection item, bottom-left (KAN-4354).
 */
@Component
export default class HotspotCount extends Vue {
  /** Just the number, for a rail that is only icons. */
  @Prop({ type: Boolean, default: false }) readonly compact!: boolean

  private stop: (() => void) | null = null

  mounted () {
    this.stop = startHotspotPoll()
  }

  beforeDestroy () {
    this.stop?.()
    this.stop = null
  }

  get count (): number | null {
    return hotspotDeviceCount(hotspotState.stations)
  }

  get title (): string {
    return hotspotCountTitle(this.count ?? 0)
  }
}
</script>

<style lang="scss" scoped>
  .hotspot-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 10px;
    border-radius: 10px 10px 0 0;
    background: color-mix(in srgb, var(--m3d-success) 22%, var(--m3d-surface-2));
    color: var(--m3d-success);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .hotspot-count__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentcolor;
  }
</style>
