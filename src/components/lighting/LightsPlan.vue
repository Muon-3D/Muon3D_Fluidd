<template>
  <div
    class="lp"
    data-tid="lights-plan"
  >
    <svg
      viewBox="0 0 320 320"
      width="100%"
      height="100%"
      role="img"
      aria-label="Live plan view of the M1 from above: two parallel light strips, Left and Right, 40 LEDs each, glowing through the trough in the middle of the printer body"
    >
      <defs>
        <filter
          :id="`lp-glow-${uid}`"
          x="-30%"
          y="-10%"
          width="160%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter
          :id="`lp-spill-${uid}`"
          x="-60%"
          y="-10%"
          width="220%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter
          :id="`lp-bloom-${uid}`"
          x="-100%"
          y="-10%"
          width="300%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <polygon
        :points="geo.body"
        class="lp__body"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <polyline
        :points="geo.wheel"
        class="lp__wheel"
        fill="none"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        cx="62"
        cy="150"
        r="26.2"
        fill="#07090b"
        class="lp__line"
        stroke-width="1"
      />
      <circle
        cx="62"
        cy="150"
        r="19.9"
        fill="none"
        stroke="#19d3c5"
        stroke-opacity="0.85"
        stroke-width="1.6"
        stroke-dasharray="76 49"
        transform="rotate(-92 62 150)"
      />
      <circle
        cx="104.5"
        cy="150"
        r="11.8"
        class="lp__fan lp__line"
        stroke-width="1"
      />
      <rect
        x="150.5"
        y="24.5"
        width="19"
        height="13"
        rx="2"
        class="lp__mast lp__line"
        stroke-width="1"
      />
      <circle
        cx="136.6"
        cy="31"
        r="2.25"
        class="lp__dot"
      />
      <g :opacity="spill">
        <rect
          x="130"
          y="30"
          width="30"
          height="240"
          :fill="tint"
          :filter="`url(#lp-bloom-${uid})`"
          opacity="0.5"
        />
        <rect
          x="160"
          y="30"
          width="30"
          height="240"
          :fill="tint"
          :filter="`url(#lp-bloom-${uid})`"
          opacity="0.5"
        />
      </g>
      <polygon
        :points="geo.slot"
        class="lp__slot lp__line"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <g
        :opacity="spill"
        :filter="`url(#lp-spill-${uid})`"
      >
        <rect
          x="145"
          y="38"
          width="15"
          height="224"
          :fill="tint"
        />
        <rect
          x="160"
          y="38"
          width="15"
          height="224"
          :fill="tint"
        />
      </g>
      <polygon
        :points="geo.groove"
        fill="rgba(0,0,0,.5)"
      />
      <polygon
        :points="geo.stripL"
        class="lp__strip"
      />
      <polygon
        :points="geo.stripR"
        class="lp__strip"
      />
      <text
        x="126"
        y="303"
        class="lp__ink lp__label"
        text-anchor="middle"
      >Left · 40</text>
      <text
        x="194"
        y="303"
        class="lp__ink lp__label"
        text-anchor="middle"
      >Right · 40</text>
      <text
        x="84"
        y="191"
        class="lp__ink lp__small"
        text-anchor="middle"
      >Display</text>
      <text
        x="176"
        y="48"
        class="lp__ink lp__small"
      >Spine</text>
      <text
        x="160"
        y="317"
        class="lp__ink lp__small"
        text-anchor="middle"
      >M1 from above</text>
      <g :opacity="luminance">
        <g
          :filter="`url(#lp-glow-${uid})`"
          opacity="0.85"
        >
          <circle
            v-for="led in leds"
            :key="`g${led.key}`"
            :cx="led.x"
            :cy="led.y"
            r="4.6"
            :fill="dots[led.i].fill"
            :opacity="dots[led.i].opacity"
          />
        </g>
        <g>
          <circle
            v-for="led in leds"
            :key="`d${led.key}`"
            :cx="led.x"
            :cy="led.y"
            r="2"
            :fill="dots[led.i].fill"
            :opacity="dots[led.i].opacity"
            data-tid="lights-dot"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PreviewClock from './preview-clock'
import { LEDS_PER_STRIP } from '@/services/control/lights'

let seed = 0

// The plan view, from the measured M1 (the canvas's Blueprint). Millimetres: x right, y towards the back. SVG: X = 160 + x, Y = 150 - y.
const T = (p: number[]): [number, number] => [160 + p[0], 150 - p[1]]
const pts = (a: number[][]): string => a.map(p => { const q = T(p); return `${q[0].toFixed(1)},${q[1].toFixed(1)}` }).join(' ')
const MR = 141.5
const MCR = 31
const MD = MR - MCR * Math.SQRT2
const body: number[][] = []
for (let k = 0; k < 4; k++) {
  const a = k * Math.PI / 2
  for (let j = 0; j <= 8; j++) {
    const b = a - Math.PI / 4 + j * Math.PI / 16
    body.push([MD * Math.cos(a) + MCR * Math.cos(b), MD * Math.sin(a) + MCR * Math.sin(b), k])
  }
}
const stadium = (w: number, l: number, n = 8): number[][] => {
  const o: number[][] = []
  for (let j = 0; j <= n; j++) { const b = j * Math.PI / n; o.push([w * Math.cos(b), l - w + w * Math.sin(b)]) }
  for (let j = 0; j <= n; j++) { const b = Math.PI + j * Math.PI / n; o.push([w * Math.cos(b), w - l + w * Math.sin(b)]) }
  return o
}
const quad = (x0: number, x1: number): number[][] => [[x0, -109], [x1, -109], [x1, 109], [x0, 109]]
const GEO = {
  body: pts(body),
  wheel: pts(body.filter(p => p[2] === 2)),
  slot: pts(stadium(15, 112)),
  groove: pts(stadium(3.5, 107)),
  stripL: pts(quad(-11, -2.6)),
  stripR: pts(quad(2.6, 11))
}

/** Where each LED sits: two strips of 40, top to bottom (which end is LED 1 is not yet measured). */
const LEDS = ['left', 'right'].flatMap((strip, zi) => Array.from({ length: LEDS_PER_STRIP }, (_, i) => {
  const p = T([(zi ? 1 : -1) * 6.8, 109 - 218 * (i + 0.5) / LEDS_PER_STRIP])
  return { key: `${strip}${i}`, i, x: Number(p[0].toFixed(1)), y: Number(p[1].toFixed(1)) }
}))

/** The M1 from above with both strips glowing as the lights are set. Both strips move together on LED_MODE, so there is nothing to tap. */
@Component
export default class LightsPlan extends Mixins(PreviewClock) {
  uid = ++seed
  geo = GEO
  leds = LEDS

  get spill (): number { return this.light.on ? Math.round((0.2 + 0.32 * this.light.brightness / 100) * 100) / 100 : 0 }

  get tint (): string { return this.light.on ? (this.light.effect === 'rainbow' ? '#5a8bff' : this.light.effect === 'status' ? '#30d158' : this.light.colors[0]) : '#000' }
}
</script>

<style lang="scss">
.lp { position: relative; width: 100%; max-width: 500px; margin: 0 auto; aspect-ratio: 1 / 1; border-radius: 16px; overflow: hidden; background: radial-gradient(ellipse at 50% 45%, #f6f7fa, #e3e7ee); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
.lp svg { position: absolute; inset: 0; }
.lp__body { fill: rgba(255, 255, 255, 0.8); stroke: rgba(30, 55, 90, 0.6); }
.lp__wheel { stroke: #2b3038; }
.lp__line { stroke: rgba(30, 55, 90, 0.6); }
.lp__fan { fill: rgba(30, 55, 90, 0.12); }
.lp__mast { fill: #2b323c; }
.lp__dot { fill: rgba(30, 55, 90, 0.6); }
.lp__slot { fill: #262d37; }
.lp__strip { fill: #1d2127; }
.lp__ink { fill: #4a4b50; font-family: inherit; }
.lp__label { font-size: 9px; font-weight: 600; }
.lp__small { font-size: 8px; }
.theme--dark .lp { background: radial-gradient(ellipse at 50% 45%, #17171a, #0b0b0c); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); }
.theme--dark .lp__body { fill: rgba(255, 255, 255, 0.045); stroke: rgba(170, 200, 240, 0.6); }
.theme--dark .lp__wheel { stroke: #0b0d10; }
.theme--dark .lp__line { stroke: rgba(170, 200, 240, 0.6); }
.theme--dark .lp__fan { fill: rgba(170, 200, 240, 0.12); }
.theme--dark .lp__mast { fill: #1b2027; }
.theme--dark .lp__dot { fill: rgba(170, 200, 240, 0.6); }
.theme--dark .lp__slot { fill: #06080b; }
.theme--dark .lp__ink { fill: #a1a1a6; }
</style>
