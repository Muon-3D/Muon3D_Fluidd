<template>
  <div
    class="ls"
    data-tid="lights-strip"
  >
    <svg
      viewBox="0 0 380 26"
      preserveAspectRatio="none"
      role="img"
      aria-label="Live preview of the Left and Right light strips, 40 LEDs each, shown unrolled"
    >
      <defs>
        <filter
          :id="`ls-glow-${uid}`"
          x="-20%"
          y="-100%"
          width="140%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      <g :opacity="luminance">
        <g
          :filter="`url(#ls-glow-${uid})`"
          opacity="0.8"
        >
          <template v-for="row in rows">
            <circle
              v-for="(d, i) in dots"
              :key="`g${row}-${i}`"
              :cx="10 + i * (360 / 39)"
              :cy="row"
              r="4.9"
              :fill="d.fill"
              :opacity="d.opacity"
            />
          </template>
        </g>
        <g>
          <template v-for="row in rows">
            <circle
              v-for="(d, i) in dots"
              :key="`d${row}-${i}`"
              :cx="10 + i * (360 / 39)"
              :cy="row"
              r="2.6"
              :fill="d.fill"
              :opacity="d.opacity"
              data-tid="lights-dot"
            />
          </template>
        </g>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PreviewClock from './preview-clock'

let seed = 0

/** The two strips, unrolled: the bar on the Medium and Large widgets. */
@Component
export default class LightsStrip extends Mixins(PreviewClock) {
  uid = ++seed
  rows = [7, 19]
}
</script>

<style lang="scss">
.ls { height: 28px; border-radius: 10px; background: #101012; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); overflow: hidden; }
.ls svg { display: block; width: 100%; height: 100%; }
</style>
