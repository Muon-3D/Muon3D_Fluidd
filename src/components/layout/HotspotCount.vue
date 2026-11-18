<template>
  <span
    v-if="count !== null"
    class="hotspot-count"
    data-tid="hotspot-count"
    role="img"
    :title="title"
    :aria-label="title"
  >
    <frame-icon
      name="tethering"
      small
    />
    <span data-tid="hotspot-count-n">{{ count }}</span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { hotspotCountTitle, hotspotDeviceCount, hotspotState } from '@/services/hotspot/model'
import { startHotspotPoll } from '@/services/hotspot/poller'

/**
 * How many devices are on the printer's hotspot (KAN-4297), whatever route
 * Control reaches the printer by. It runs the shared light poll while it is on
 * screen, and shows nothing when the hotspot is down or the printer can't say.
 */
@Component
export default class HotspotCount extends Vue {
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
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-weight: 600;
  }
</style>
