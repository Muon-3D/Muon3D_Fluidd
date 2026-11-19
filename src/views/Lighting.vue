<template>
  <div
    class="lighting"
    :class="{ 'lighting--phone': isMobileViewport }"
    data-tid="lighting-page"
  >
    <div
      v-if="!known"
      class="lighting__none"
      role="status"
      data-tid="lighting-unavailable"
    >
      <frame-icon name="bulb" />
      <div>
        <b>Lighting is not available on this printer</b>
        <p>The M1 light strips are set through its LED_MODE macro. This printer has not reported one, so there is nothing to set yet.</p>
      </div>
    </div>

    <template v-else>
      <div class="lighting__bar">
        <span
          class="lighting__summary"
          data-tid="lighting-summary"
        >{{ summary }}</span>
        <button
          type="button"
          role="switch"
          class="lighting__master"
          :aria-checked="shown.on ? 'true' : 'false'"
          aria-label="All lights"
          :disabled="!canSet"
          data-tid="lighting-master"
          @click="toggleOn"
        >
          <span
            class="lighting__track"
            :class="{ 'lighting__track--on': shown.on }"
          ><span /></span>
          {{ shown.on ? 'On' : 'Off' }}
        </button>
      </div>

      <div
        v-if="busyPrinting"
        class="lighting__notice"
        role="status"
        data-tid="lighting-printing"
      >
        <frame-icon
          name="clock"
          small
        />
        Printing: your lights show when the print ends.
      </div>

      <div
        v-if="lights.state.error"
        class="lighting__notice lighting__notice--warn"
        role="alert"
        data-tid="lighting-error"
      >
        {{ lights.state.error }}
      </div>

      <div class="lighting__grid">
        <div class="lighting__col">
          <section class="lighting__card">
            <div class="lighting__head">
              <h2>Live preview</h2><span>{{ previewName }}</span>
            </div>
            <lights-plan :light="shown" />
            <span class="lighting__small">Plan view from above: two parallel strips of 40 LEDs run diagonally down through the cavity in the middle of the printer body. They move together for now.</span>
          </section>

          <section
            class="lighting__card"
            data-tid="lighting-presets"
          >
            <div class="lighting__head">
              <h2>Presets</h2><span>Applies to both strips</span>
            </div>
            <div
              class="lighting__boxes"
              data-tid="preset-grid"
            >
              <template v-for="(box, i) in lights.boxes">
                <button
                  v-if="box.preset"
                  :key="box.preset.id"
                  type="button"
                  class="lighting__box"
                  :class="{ 'lighting__box--on': box.preset.id === presetId }"
                  :style="{ background: gradient(box.preset) }"
                  :aria-pressed="box.preset.id === presetId ? 'true' : 'false'"
                  :disabled="!canSet"
                  :data-tid="`preset-${box.preset.id}`"
                  @click="pick(box.preset)"
                >
                  <span class="lighting__bar-name">{{ box.preset.name }}</span>
                </button>
                <button
                  v-else
                  :key="`more${i}`"
                  type="button"
                  class="lighting__box lighting__box--more"
                  data-tid="presets-more"
                  @click="openMore"
                >
                  <b>+{{ box.more }}</b>
                  <span>More</span>
                </button>
              </template>
            </div>
            <div class="lighting__save">
              <label>
                Name for a new preset
                <input
                  v-model="presetName"
                  type="text"
                  maxlength="24"
                  placeholder="Night shift"
                  data-tid="preset-name"
                  @keydown.enter="savePreset"
                >
              </label>
              <button
                type="button"
                class="lighting__primary"
                :disabled="!canSet || saving"
                data-tid="preset-save"
                @click="savePreset"
              >
                Save as preset
              </button>
            </div>
            <span
              class="lighting__small"
              data-tid="preset-note"
            >{{ saveNote }}</span>
          </section>
        </div>

        <div class="lighting__col">
          <section
            class="lighting__card"
            data-tid="lighting-zones"
          >
            <h2>Zones</h2>
            <div class="lighting__zone">
              <span
                class="lighting__zone-dot"
                :style="{ background: lookGradient }"
              />
              <span class="lighting__zone-text">
                <b>Both strips</b>
                <span>Left and Right, 40 LEDs each</span>
              </span>
              <button
                type="button"
                role="switch"
                class="lighting__zone-switch"
                :aria-checked="shown.on ? 'true' : 'false'"
                aria-label="Both strips light"
                :disabled="!canSet"
                @click="toggleOn"
              >
                <span
                  class="lighting__track"
                  :class="{ 'lighting__track--on': shown.on }"
                ><span /></span>
              </button>
            </div>
            <span class="lighting__small">Setting the left and right strips apart comes with the printer update.</span>
          </section>

          <section
            class="lighting__card"
            data-tid="lighting-colour"
          >
            <div class="lighting__head">
              <h2>Colour</h2><span>{{ colourNote }}</span>
            </div>
            <template v-if="effect.colours > 0">
              <div class="lighting__swatches">
                <button
                  v-for="(h, i) in hues"
                  :key="h.hue"
                  type="button"
                  :aria-label="`Colour ${i + 1} of 10`"
                  :disabled="!canSet"
                  :data-tid="`swatch-${i}`"
                  @click="setColour(h.hex)"
                >
                  <span
                    :style="{ background: h.hex }"
                    :class="{ 'lighting__sw--on': usedColours[slot] === h.hex }"
                  />
                </button>
              </div>
              <div class="lighting__slots">
                <label
                  v-for="(c, i) in usedColours"
                  :key="i"
                  class="lighting__slot"
                  :class="{ 'lighting__slot--on': i === slot && usedColours.length > 1 }"
                >
                  <span class="lighting__slot-name">{{ usedColours.length > 1 ? `Colour ${i + 1}` : 'Colour' }}</span>
                  <input
                    type="color"
                    :value="c"
                    :aria-label="`Colour ${i + 1}`"
                    :disabled="!canSet"
                    :data-tid="`colour-${i}`"
                    @focus="slot = i"
                    @click="slot = i"
                    @input="setColourAt(i, $event)"
                  >
                </label>
              </div>
              <span
                class="lighting__gradient"
                :style="{ background: lookGradient }"
              />
              <span class="lighting__small">The strips show colour only, no white. A colour is sent as its hue.</span>
            </template>
            <span
              v-else
              class="lighting__small"
              data-tid="colour-none"
            >{{ effect.id === 'rainbow' ? 'Rainbow cycles through every colour by itself.' : 'Status uses the printer’s own colours.' }}</span>
          </section>

          <section
            class="lighting__card"
            data-tid="lighting-effect"
          >
            <h2>Effect</h2>
            <div
              class="lighting__chips"
              role="radiogroup"
              aria-label="Effect"
            >
              <button
                v-for="e in caps.effects"
                :key="e.id"
                type="button"
                role="radio"
                class="lighting__chip"
                :class="{ 'lighting__chip--on': e.id === effect.id }"
                :aria-checked="e.id === effect.id ? 'true' : 'false'"
                :disabled="!canSet"
                :data-tid="`effect-${e.id}`"
                @click="change({ effect: e.id, on: true })"
              >
                {{ e.label }}
              </button>
            </div>
            <span class="lighting__small">{{ effect.blurb }}</span>
            <label class="lighting__row">
              <span class="lighting__row-label">Brightness</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                :value="shown.brightness"
                aria-label="Brightness"
                :disabled="!canSet"
                data-tid="brightness"
                @input="onBrightness"
              >
              <b class="lighting__row-value">{{ shown.brightness }}%</b>
            </label>
            <label
              class="lighting__row"
              :class="{ 'lighting__row--off': !effect.speed }"
            >
              <span class="lighting__row-label">Speed</span>
              <input
                type="range"
                :min="caps.speedMin"
                max="100"
                step="1"
                :value="shown.speed"
                aria-label="Effect speed"
                :disabled="!canSet || !effect.speed"
                data-tid="speed"
                @input="onSpeed"
              >
              <b class="lighting__row-value">{{ effect.speed ? shown.speed : '–' }}</b>
            </label>
          </section>

          <section
            class="lighting__card lighting__card--api"
            data-tid="lighting-api"
          >
            <div class="lighting__api-head">
              <h2>API</h2>
              <div
                role="tablist"
                aria-label="API layer"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected="true"
                  class="lighting__tab"
                >
                  Settings
                </button>
              </div>
              <button
                type="button"
                class="lighting__ghost"
                data-tid="api-copy"
                @click="copyApi"
              >
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>
            <pre
              class="lighting__code"
              data-tid="api-text"
            >{{ apiText }}</pre>
            <ul class="lighting__limits">
              <li>Settings go out at most 3 times a second; the latest wins.</li>
              <li>Brightness 0–100, speed 5–100. Colours are sent as a hue, 0–360.</li>
              <li>Per-LED frames come with the printer update.</li>
            </ul>
          </section>
        </div>
      </div>

      <lights-presets-popup
        v-if="more"
        :presets="lights.presets"
        :favourites="lights.favourites"
        @cancel="more = false"
        @done="doneMore"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import LightsMixin from '@/components/lighting/lights-mixin'
import LightsPlan from '@/components/lighting/LightsPlan.vue'
import LightsPresetsPopup from '@/components/lighting/LightsPresetsPopup.vue'
import { presetGradient } from '@/components/lighting/preset-look'
import { hueToHex, type LightPreset } from '@/services/control/lights'
import { lightsStore } from '@/services/control/lights-store'

/**
 * Lighting, under Control (KAN-4767): the live plan of the two strips, presets
 * (favourites, and More to star up to seven), colour, effect, brightness and
 * speed, and the API card. What the LED_MODE macro cannot do (per-strip zones,
 * more than two colours, comet, wave, sparkle, progress, per-LED frames) is
 * not offered; the screen says so where it matters.
 */
@Component({ components: { LightsPlan, LightsPresetsPopup } })
export default class Lighting extends Mixins(BrowserMixin, LightsMixin) {
  more = false
  presetName = ''
  saving = false
  savedNote = false
  slot = 0
  copied = false
  hues = Array.from({ length: 10 }, (_, i) => ({ hue: i * 36, hex: hueToHex(i * 36) }))

  get summary (): string {
    if (!this.shown.on) return 'Lights off'
    return `${this.effect.label} · ${this.shown.brightness}%`
  }

  get previewName (): string { return this.shown.on ? this.effect.label : 'Off' }

  get colourNote (): string {
    const n = this.effect.colours
    return n === 0 ? 'chosen by the effect' : `both strips · ${n} of ${this.caps.maxColours}`
  }

  get lookGradient (): string {
    const s = this.shown
    if (s.effect === 'rainbow') return 'linear-gradient(90deg,#ff5a5a,#ffd24a 30%,#4ae38a 55%,#4aa8ff 80%,#a06bff)'
    if (s.effect === 'status') return 'linear-gradient(90deg,#80d6d1,#30d158)'
    const c = this.usedColours
    return c.length > 1 ? `linear-gradient(90deg,${c.join(',')})` : c[0]
  }

  get saveNote (): string {
    return this.savedNote ? 'Saved, and added to your presets.' : 'Saves the current colours and effect as a custom preset.'
  }

  get apiText (): string { return lightsStore.backend.describe(this.shown) }

  gradient (p: LightPreset): string { return presetGradient(p) }

  onBrightness (event: Event) { this.change({ brightness: Number((event.target as HTMLInputElement).value) }) }

  onSpeed (event: Event) { this.change({ speed: Number((event.target as HTMLInputElement).value) }) }

  setColour (hex: string) { this.setColourAt(this.slot, hex) }

  setColourAt (i: number, source: string | Event) {
    const hex = typeof source === 'string' ? source : (source.target as HTMLInputElement).value
    const colours = this.shown.colors.slice()
    colours[Math.min(i, this.effect.colours - 1)] = hex
    this.change({ colors: colours, on: true })
  }

  openMore () {
    this.more = true
  }

  async doneMore (ids: string[]) {
    this.more = false
    await lightsStore.setFavourites(ids)
  }

  async savePreset () {
    if (!this.canSet || this.saving) return
    this.saving = true
    this.savedNote = false
    try {
      const saved = await lightsStore.savePreset(this.printerObjects, this.presetName)
      if (saved) { this.presetName = ''; this.savedNote = true }
    } finally { this.saving = false }
  }

  async copyApi () {
    try { await navigator.clipboard.writeText(this.apiText) } catch { /* the page shows the text; copying is a convenience */ }
    this.copied = true
    setTimeout(() => { this.copied = false }, 1800)
  }
}
</script>

<style lang="scss" scoped>
.lighting { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.lighting__bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lighting__summary { flex: 1; min-width: 0; color: var(--m3d-text-muted); font-size: 13.5px; }
.lighting__master { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 18px 0 8px; border: 0; border-radius: 999px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.lighting__master:disabled, .lighting__zone-switch:disabled { cursor: default; opacity: 0.6; }
.lighting__track { position: relative; flex: none; display: block; width: 44px; height: 26px; border-radius: 13px; background: rgb(118 118 128 / 50%); }
.lighting__track span { position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / 40%); transition: left var(--m3d-duration-fast, 0.15s); }
.lighting__track--on { background: var(--m3d-success, #30d158); }
.lighting__track--on span { left: 20px; }
.lighting__notice { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 14px; background: var(--m3d-fill-2); color: var(--m3d-text-muted); font-size: 13px; }
.lighting__notice--warn { color: var(--m3d-warning); }
.lighting__none { display: flex; gap: 14px; align-items: center; padding: 20px; border-radius: 22px; background: var(--m3d-surface); }
.lighting__none p { margin: 2px 0 0; color: var(--m3d-text-muted); font-size: 13px; }
.lighting__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(440px, 100%), 1fr)); gap: 24px; align-items: start; }
.lighting__col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.lighting__card { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding: 20px; border-radius: 22px; background: var(--m3d-surface); box-shadow: inset 0 0 0 1px var(--m3d-border, transparent); }
.lighting__card h2 { margin: 0; font-size: 15px; font-weight: 600; }
.lighting__head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.lighting__head span { color: var(--m3d-text-muted); font-size: 12.5px; text-align: right; }
.lighting__small { color: var(--m3d-text-muted); font-size: 12px; }
.lighting__boxes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.lighting__box { min-height: 72px; min-width: 0; padding: 0; border: 0; border-radius: 14px; display: flex; flex-direction: column; justify-content: flex-end; font: inherit; cursor: pointer; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%); }
.lighting__box:disabled { cursor: default; opacity: 0.7; }
.lighting__box--on { box-shadow: 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-text); }
.lighting__bar-name { display: block; margin: 0 5px 5px; padding: 4px 8px; border-radius: 9px; background: rgb(0 0 0 / 62%); color: #fff; font-size: 12px; font-weight: 600; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lighting__box--more { justify-content: center; align-items: center; gap: 2px; background: var(--m3d-fill); color: var(--m3d-text); }
.lighting__box--more b { font-size: 26px; font-weight: 700; line-height: 1.1; }
.lighting__box--more span { color: var(--m3d-text-muted); font-size: 12px; font-weight: 600; }
.lighting__save { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; padding-top: 14px; border-top: 1px solid var(--m3d-border, rgb(128 128 128 / 20%)); }
.lighting__save label { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 4px; color: var(--m3d-text-muted); font-size: 12px; }
.lighting__save input { box-sizing: border-box; height: 44px; border: 0; border-radius: 12px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 14px; padding: 0 12px; }
.lighting__primary { min-height: 44px; padding: 0 20px; border: 0; border-radius: 12px; background: var(--m3d-accent); color: var(--m3d-on-accent, #0b2523); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.lighting__primary:disabled { cursor: default; opacity: 0.6; }
.lighting__zone { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 0 0 10px; border-radius: 14px; background: var(--m3d-accent-soft); box-shadow: inset 0 0 0 1.5px var(--m3d-accent); }
.lighting__zone-dot { flex: none; width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 20%); }
.lighting__zone-text { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 14px; }
.lighting__zone-text span { color: var(--m3d-text-muted); font-size: 12px; }
.lighting__zone-switch { width: 64px; min-height: 52px; padding: 0; border: 0; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lighting__swatches { display: flex; flex-wrap: wrap; gap: 4px; }
.lighting__swatches button { width: 44px; height: 44px; padding: 0; border: 0; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lighting__swatches span { display: block; width: 30px; height: 30px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 20%); }
.lighting__swatches span.lighting__sw--on { box-shadow: 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-text); }
.lighting__slots { display: flex; gap: 10px; flex-wrap: wrap; }
.lighting__slot { display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 14px; color: var(--m3d-text-muted); font-size: 12px; }
.lighting__slot--on { box-shadow: inset 0 0 0 1.5px var(--m3d-accent); }
.lighting__slot input { width: 72px; height: 44px; padding: 0; border: 0; border-radius: 12px; background: none; cursor: pointer; }
.lighting__gradient { display: block; height: 18px; border-radius: 9px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%); }
.lighting__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.lighting__chip { min-height: 44px; padding: 0 14px; border: 0; border-radius: 12px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.lighting__chip--on { background: var(--m3d-accent); color: var(--m3d-on-accent, #0b2523); }
.lighting__chip:disabled { cursor: default; opacity: 0.6; }
.lighting__row { display: flex; align-items: center; gap: 12px; min-height: 44px; }
.lighting__row--off { opacity: 0.45; }
.lighting__row-label { width: 84px; color: var(--m3d-text-muted); font-size: 13px; }
.lighting__row input { flex: 1; min-width: 0; height: 44px; margin: 0; accent-color: var(--m3d-accent); }
.lighting__row-value { width: 44px; text-align: right; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.lighting__card--api { padding: 16px 20px 18px; gap: 10px; }
.lighting__api-head { display: flex; align-items: center; gap: 8px; }
.lighting__api-head h2 { flex: 1; color: var(--m3d-text-muted); font-size: 14px; }
.lighting__tab { min-height: 44px; padding: 0 14px; border: 0; border-radius: 12px; background: var(--m3d-accent-soft); color: var(--m3d-accent); font: inherit; font-size: 12.5px; font-weight: 600; }
.lighting__ghost { min-height: 44px; padding: 0 14px; border: 0; border-radius: 12px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.lighting__code { margin: 0; padding: 12px; border-radius: 12px; background: var(--m3d-fill-2); color: var(--m3d-text); font-family: var(--m3d-font-mono, ui-monospace, Menlo, Consolas, monospace); font-size: 11.5px; line-height: 1.55; white-space: pre-wrap; word-break: break-all; }
.lighting__limits { margin: 0; padding: 0 0 0 16px; display: flex; flex-direction: column; gap: 3px; color: var(--m3d-text-muted); font-size: 12px; }
.lighting--phone .lighting__card { padding: 16px; }
.lighting--phone .lighting__boxes { gap: 8px; }
@media (prefers-reduced-motion: reduce) {
  .lighting__track span { transition: none; }
}
</style>
