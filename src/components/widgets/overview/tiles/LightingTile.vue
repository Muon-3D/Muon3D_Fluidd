<template>
  <tile-shell
    tile="lighting"
    title="Lighting"
    icon="bulb"
    :class="['lt', `lt--${size}`]"
  >
    <template
      v-if="known && size !== 'S'"
      #head
    >
      <span
        class="lt__now"
        data-tid="lighting-now"
      >{{ nowText }}</span>
    </template>

    <template v-if="known">
      <button
        type="button"
        class="lt__power"
        :class="{ 'lt__power--on': shown.on }"
        :aria-label="shown.on ? 'Turn lights off' : 'Turn lights on'"
        :aria-pressed="shown.on ? 'true' : 'false'"
        :disabled="!canSet"
        data-tid="lighting-power"
        @click="toggleOn"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v8" />
          <path d="M6.3 6.8a8 8 0 1 0 11.4 0" />
        </svg>
      </button>

      <!-- Small: the colour, the preset, a tap for the next -->
      <button
        v-if="size === 'S'"
        type="button"
        class="lt__orb-btn"
        aria-label="Next preset"
        :disabled="!canSet"
        data-tid="lighting-next"
        @click="nextPreset"
      >
        <span
          class="lt__orb lt__orb--big"
          :style="orbStyle"
        />
        <b>{{ lightName }}</b>
        <span class="lt__muted">Tap for next</span>
      </button>

      <template v-else>
        <lights-strip :light="shown" />

        <!-- Large: the colour ring around the orb, the two sliders and the effect -->
        <div
          v-if="size === 'L'"
          class="lt__mid"
        >
          <div class="lt__ring">
            <button
              v-for="(h, i) in ring"
              :key="h.hue"
              type="button"
              class="lt__ring-dot"
              :style="{ left: `${h.x}px`, top: `${h.y}px` }"
              :aria-label="`Colour ${i + 1} of 10`"
              :disabled="!canSet || effect.colours === 0"
              :data-tid="`lighting-swatch-${i}`"
              @click="setColour(h.hex)"
            >
              <span
                :style="{ background: h.hex }"
                :class="{ 'lt__swatch--on': usedColours[0] === h.hex }"
              />
            </button>
            <button
              type="button"
              class="lt__orb-hit"
              aria-label="Next preset"
              :disabled="!canSet"
              data-tid="lighting-next"
              @click="nextPreset"
            >
              <span
                class="lt__orb"
                :style="orbStyle"
              />
            </button>
          </div>
          <div class="lt__controls">
            <label class="lt__slider">
              <span class="lt__label"><span>Brightness</span><b>{{ shown.brightness }}%</b></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                :value="shown.brightness"
                aria-label="Brightness"
                :disabled="!canSet"
                data-tid="lighting-brightness"
                @input="onBrightness"
              >
            </label>
            <label
              class="lt__slider"
              :class="{ 'lt__slider--off': !effect.speed }"
            >
              <span class="lt__label"><span>Speed</span><b>{{ effect.speed ? shown.speed : '–' }}</b></span>
              <input
                type="range"
                :min="caps.speedMin"
                max="100"
                step="1"
                :value="shown.speed"
                aria-label="Effect speed"
                :disabled="!canSet || !effect.speed"
                data-tid="lighting-speed"
                @input="onSpeed"
              >
            </label>
            <button
              type="button"
              class="lt__effect"
              aria-haspopup="listbox"
              :aria-expanded="pickerOpen ? 'true' : 'false'"
              aria-label="Effect"
              :disabled="!canSet"
              data-tid="lighting-effect"
              @click="pickerOpen = !pickerOpen"
            >
              <svg
                width="26"
                height="12"
                viewBox="0 0 26 12"
                aria-hidden="true"
              >
                <circle
                  v-for="d in icon(effect.id, 5, 22, 2)"
                  :key="d.cx"
                  :cx="d.cx"
                  cy="6"
                  r="2.2"
                  :fill="d.fill"
                  :opacity="d.opacity"
                />
              </svg>
              <span class="lt__grow">{{ effect.label }}</span>
              <frame-icon
                name="chevronDown"
                small
              />
            </button>
          </div>
        </div>

        <!-- Medium: the brightness -->
        <label
          v-else
          class="lt__row"
        >
          <span class="lt__muted lt__row-label">Brightness</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="shown.brightness"
            aria-label="Brightness"
            :disabled="!canSet"
            data-tid="lighting-brightness"
            @input="onBrightness"
          >
          <b class="lt__row-value">{{ shown.brightness }}%</b>
        </label>

        <div
          class="lt__pills"
          role="group"
          aria-label="Presets"
        >
          <button
            v-for="p in pills"
            :key="p.id"
            type="button"
            class="lt__pill"
            :class="{ 'lt__pill--on': p.id === presetId }"
            :aria-pressed="p.id === presetId ? 'true' : 'false'"
            :disabled="!canSet"
            :data-tid="`lighting-pill-${p.id}`"
            @click="pick(p)"
          >
            <span
              class="lt__dot"
              :style="{ background: swatch(p) }"
            />
            <span>{{ shortName(p.name) }}</span>
          </button>
        </div>
      </template>
    </template>

    <template
      v-if="known && pickerOpen"
      #after
    >
      <button
        type="button"
        class="lt__scrim"
        aria-label="Close the effect list"
        @click="pickerOpen = false"
      />
      <div
        class="lt__list"
        role="listbox"
        aria-label="Effects"
        data-tid="lighting-effects"
      >
        <button
          v-for="e in caps.effects"
          :key="e.id"
          type="button"
          role="option"
          class="lt__option"
          :class="{ 'lt__option--on': e.id === effect.id }"
          :aria-selected="e.id === effect.id ? 'true' : 'false'"
          :data-tid="`lighting-effect-${e.id}`"
          @click="setEffect(e.id)"
        >
          <svg
            width="40"
            height="12"
            viewBox="0 0 40 12"
            aria-hidden="true"
          >
            <circle
              v-for="d in icon(e.id, 8, 34, 3)"
              :key="d.cx"
              :cx="d.cx"
              cy="6"
              r="2"
              :fill="d.fill"
              :opacity="d.opacity"
            />
          </svg>
          <span class="lt__grow">{{ e.label }}</span>
          <frame-icon
            v-if="e.id === effect.id"
            name="check"
            small
          />
        </button>
      </div>
    </template>

    <div
      v-if="!known"
      class="lt__none"
      data-tid="lighting-unavailable"
    >
      <b>Not available on this printer</b>
      <span>{{ size === 'S' ? 'No lights to set.' : 'The M1 light strips are set through its LED_MODE macro, which this printer has not reported.' }}</span>
    </div>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import LightsMixin from '@/components/lighting/lights-mixin'
import LightsStrip from '@/components/lighting/LightsStrip.vue'
import TileShell from './TileShell.vue'
import { desaturate, hueToHex, previewStrip, type EffectId, type LightPreset } from '@/services/control/lights'

/**
 * The lights on the Overview (KAN-4767), at three sizes. Small is the colour
 * and a tap for the next preset; Medium adds the live strip, the brightness
 * and the presets; Large adds the colour ring, speed and the effect list.
 * Everything it sets goes through the lights service, at no more than three
 * settings a second.
 */
@Component({ components: { TileShell, LightsStrip } })
export default class LightingTile extends Mixins(OverviewMixin, LightsMixin) {
  pickerOpen = false

  /** Ten hues round the orb (the canvas's ring), 76 px from the middle of a 196 px circle. */
  get ring () {
    return Array.from({ length: 10 }, (_, i) => {
      const a = i / 10 * Math.PI * 2 - Math.PI / 2
      const hue = i * 36
      return { hue, hex: hueToHex(hue), x: Math.round((98 + 76 * Math.cos(a) - 22) * 10) / 10, y: Math.round((98 + 76 * Math.sin(a) - 22) * 10) / 10 }
    })
  }

  /** The favourites: up to six pills (Medium and Large have the width for six). */
  get pills (): LightPreset[] {
    return this.lights.boxes.filter(b => b.preset).map(b => b.preset as LightPreset).slice(0, 6)
  }

  shortName (name: string): string { return name.split(' ')[0].slice(0, 8) }

  swatch (p: LightPreset): string {
    if (p.effect === 'rainbow') return 'linear-gradient(135deg,#ff5a5a,#ffd24a 30%,#4ae38a 55%,#4aa8ff 80%,#a06bff)'
    if (p.effect === 'status') return '#30d158'
    return p.colors.length > 1 ? `linear-gradient(135deg,${p.colors.join(',')})` : p.colors[0]
  }

  /** `Aurora · Breathe` for a preset, just the effect for a hand-made look, Off when off. */
  get nowText (): string {
    if (!this.shown.on) return 'Off'
    return this.presetId ? `${this.lightName} · ${this.effect.label}` : this.effect.label
  }

  get orbStyle () {
    const s = this.shown
    if (!s.on) return { background: '#2c2c2e', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)' }
    const a = s.effect === 'rainbow' ? '#ff5a5a' : s.effect === 'status' ? '#30d158' : desaturate(s.colors[0], s.saturation)
    const b = s.effect === 'rainbow' ? '#5a8bff' : s.effect === 'status' ? '#30d158' : desaturate(this.effect.colours > 1 ? s.colors[1] : s.colors[0], s.saturation)
    return {
      background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,.55), rgba(255,255,255,0) 40%), linear-gradient(135deg, ${a}, ${b})`,
      boxShadow: `0 0 30px 4px ${a}73, inset 0 0 0 1px rgba(255,255,255,.22)`,
      opacity: 0.55 + 0.45 * s.brightness / 100
    }
  }

  /** A few dots of an effect, still: its icon in the list. */
  icon (id: EffectId, n: number, width: number, x0: number) {
    const strip = previewStrip({ ...this.shown, on: true, effect: id }, 0.4)
    return Array.from({ length: n }, (_, i) => {
      const d = strip[Math.round(i / (n - 1) * 39)]
      return { cx: Number((x0 + i * (width / (n - 1))).toFixed(1)), fill: d.fill, opacity: Math.max(d.opacity, 0.35) }
    })
  }

  onBrightness (event: Event) { this.change({ brightness: Number((event.target as HTMLInputElement).value) }) }

  onSpeed (event: Event) { this.change({ speed: Number((event.target as HTMLInputElement).value) }) }

  setColour (hex: string) {
    this.change({ colors: [hex, ...this.shown.colors.slice(1)] })
  }

  setEffect (id: EffectId) {
    this.pickerOpen = false
    this.change({ effect: id, on: true })
  }
}
</script>

<style lang="scss">
.lt { gap: 6px; overflow: hidden; }
.lt--M { padding: 14px; }
.lt--S { padding: 16px; }
.lt__now { color: var(--m3d-text-muted); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lt__muted { color: var(--m3d-text-muted); font-size: 12px; }
.lt__grow { flex: 1; min-width: 0; text-align: left; }
.lt__power { position: absolute; top: 6px; right: 6px; width: 44px; height: 44px; border: 0; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--m3d-fill); color: var(--m3d-text-muted); cursor: pointer; z-index: 1; }
.lt__power--on { color: var(--m3d-accent); }
.lt__power:disabled, .lt__orb-btn:disabled, .lt__pill:disabled, .lt__effect:disabled, .lt__orb-hit:disabled { cursor: default; opacity: 0.6; }
.lt__orb-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 0; background: none; padding: 0; color: var(--m3d-text); font: inherit; font-size: 13px; cursor: pointer; }
.lt__orb { position: absolute; inset: 0; border-radius: 50%; display: block; }
.lt__orb--big { position: relative; inset: auto; width: 84px; height: 84px; }
.lt__mid { display: flex; gap: 12px; align-items: stretch; }
.lt__ring { position: relative; flex: none; width: 196px; height: 196px; }
.lt__ring-dot { position: absolute; width: 44px; height: 44px; padding: 0; border: 0; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lt__ring-dot span { display: block; width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2); }
.lt__ring-dot span.lt__swatch--on { box-shadow: 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-text); }
.lt__orb-hit { position: absolute; left: 56px; top: 56px; width: 84px; height: 84px; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; }
.lt__controls { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
.lt__slider { display: flex; flex-direction: column; }
.lt__slider--off { opacity: 0.45; }
.lt__label { display: flex; justify-content: space-between; color: var(--m3d-text-muted); font-size: 12px; }
.lt__label b { color: var(--m3d-text); font-weight: 600; font-variant-numeric: tabular-nums; }
.lt input[type='range'] { width: 100%; min-width: 0; height: 44px; margin: 0; accent-color: var(--m3d-accent); }
.lt__row { display: flex; align-items: center; gap: 10px; height: 44px; }
.lt__row input { flex: 1; }
.lt__row-label { width: 74px; }
.lt__row-value { width: 38px; text-align: right; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.lt__effect { display: flex; align-items: center; gap: 8px; width: 100%; height: 44px; padding: 0 10px; border: 0; border-radius: 12px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.lt__pills { display: flex; gap: 4px; }
.lt__pill { flex: 1 1 0; min-width: 0; min-height: 44px; padding: 0 2px; border: 0; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer; }
.lt__pill span:last-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lt__pill--on { background: var(--m3d-accent); color: var(--m3d-on-accent, #0b2523); }
.lt__dot { display: block; width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25); }
.lt__pill--on .lt__dot { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.45); }
.lt__scrim { position: absolute; inset: 0; z-index: 7; border: 0; padding: 0; background: rgba(0, 0, 0, 0.35); cursor: default; }
.lt__list { position: absolute; top: 60px; left: 16px; right: 16px; z-index: 8; padding: 8px; border-radius: 20px; background: var(--m3d-glass, var(--m3d-surface-2)); backdrop-filter: blur(24px) saturate(180%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 18px 44px rgba(0, 0, 0, 0.5); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
.lt__option { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 10px; border: 0; border-radius: 12px; background: var(--m3d-fill-2); color: var(--m3d-text); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.lt__option--on { background: var(--m3d-accent-soft); }
.lt__none { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.lt__none span { color: var(--m3d-text-muted); font-size: 12.5px; }
</style>
