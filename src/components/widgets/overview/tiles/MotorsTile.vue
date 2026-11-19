<template>
  <section
    class="ot mo"
    :class="`mo--${size}`"
    data-tile="motors"
  >
    <button
      type="button"
      class="mo__btn"
      :disabled="!controlReady || busy"
      title="Turn the motors off (M84)"
      data-tid="motors-off"
      @click="motorsOff"
    >
      <frame-icon name="power" />
      <span>Motors off</span>
    </button>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'

/** I-542 mock: Motors off as its own small tile, so it sits in the one row of widgets under the printer view. */
@Component({})
export default class MotorsTile extends Mixins(OverviewMixin) {}
</script>

<style lang="scss">
.mo { padding: 8px; }
.mo__btn { display: flex; flex: 1 1 auto; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 64px; border-radius: 14px; background: var(--m3d-surface-2); color: var(--m3d-text); font-size: 13px; font-weight: 600; line-height: 1.15; text-align: center; cursor: pointer; }
.mo__btn:hover:not(:disabled) { filter: brightness(1.15); }
.mo__btn:disabled { opacity: 0.45; cursor: default; }
.mo__btn:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
.mo__btn .frame-icon { color: var(--m3d-text-muted); }
</style>
