<template>
  <div
    class="acct-section"
    data-tid="account-appearance"
  >
    <div class="acct-head">
      <h1>Appearance</h1>
      <p class="acct-head__sub">
        Light or dark, and your accent colour. They are yours on this browser, whichever printer you open.
      </p>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="Appearance"
      data-tid="theme-settings"
    >
      <div class="acct-list">
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Light or dark</b>
            <span>Auto follows this device.</span>
          </div>
          <seg-picker
            :options="modeOptions"
            :value="mode"
            label="Light or dark"
            data-tid="setting-theme-mode"
            @input="setMode"
          />
        </div>
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Accent colour</b>
            <span>Buttons, switches and highlights.</span>
          </div>
          <div
            class="aa__swatches"
            role="radiogroup"
            aria-label="Accent colour"
          >
            <button
              v-for="accent in accents"
              :key="accent.color"
              type="button"
              role="radio"
              class="aa__swatch"
              :class="{ 'aa__swatch--on': accentOn === accent.color }"
              :style="{ background: accent.color }"
              :aria-label="accent.name"
              :aria-checked="accentOn === accent.color ? 'true' : 'false'"
              :data-tid="`accent-${accent.name.toLowerCase()}`"
              @click="setAccent(accent.color)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { ACCENTS, accentFor, themeModeOf } from '@/services/settings/general'
import type { ThemeConfig, ThemeMode } from '@/store/config/types'

/** Account › Appearance (KAN-6106): the theme is the person's, not each printer's. */
@Component({ components: { SegPicker } })
export default class AccountAppearance extends Vue {
  accents = ACCENTS

  modeOptions: SegOption[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'auto', label: 'Auto' }
  ]

  get theme (): ThemeConfig {
    return this.$store.state.config.uiSettings.theme
  }

  get mode (): ThemeMode {
    return themeModeOf(this.theme)
  }

  get accentOn (): string | null {
    return accentFor(this.theme.color)?.color ?? null
  }

  setMode (mode: ThemeMode) {
    return this.$store.dispatch('config/setAppearance', { mode })
  }

  setAccent (color: string) {
    return this.$store.dispatch('config/setAppearance', { color })
  }
}
</script>

<style lang="scss" scoped>
  .aa__swatches {
    display: inline-flex;
    flex: none;
    gap: 10px;
  }

  .aa__swatch {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);

    &:focus-visible {
      outline: 2px solid var(--m3d-text);
      outline-offset: 2px;
    }
  }

  .aa__swatch--on {
    box-shadow: 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-text);
  }
</style>
