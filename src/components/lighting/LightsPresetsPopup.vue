<template>
  <div
    class="lpp"
    data-tid="presets-popup"
  >
    <div
      class="lpp__scrim"
      @click="$emit('cancel')"
    />
    <div
      ref="dialog"
      class="lpp__card"
      role="dialog"
      aria-modal="true"
      aria-label="Choose favourite presets"
      tabindex="-1"
      @keydown.esc.stop="$emit('cancel')"
    >
      <div class="lpp__head">
        <h2>All presets</h2>
        <span
          class="lpp__count"
          data-tid="presets-count"
        >Favourites {{ draft.length }} of {{ max }}</span>
      </div>
      <p
        class="lpp__hint"
        role="status"
        data-tid="presets-hint"
      >
        {{ hint }}
      </p>
      <div class="lpp__grid">
        <div
          v-for="p in presets"
          :key="p.id"
          class="lpp__tile"
          :class="{ 'lpp__tile--fav': isFav(p.id) }"
          :style="{ background: gradient(p) }"
          :data-tid="`preset-tile-${p.id}`"
        >
          <button
            type="button"
            class="lpp__star"
            :aria-pressed="isFav(p.id) ? 'true' : 'false'"
            :aria-label="`${isFav(p.id) ? 'Remove' : 'Add'} ${p.name} ${isFav(p.id) ? 'from' : 'to'} favourites`"
            :data-tid="`preset-star-${p.id}`"
            @click="flip(p.id)"
          >
            <span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                :fill="isFav(p.id) ? '#ffd24a' : 'none'"
                :stroke="isFav(p.id) ? '#ffd24a' : '#fff'"
                stroke-width="2"
                stroke-linejoin="round"
                aria-hidden="true"
              ><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z" /></svg>
            </span>
          </button>
          <span class="lpp__name">{{ p.name }}</span>
        </div>
      </div>
      <div class="lpp__actions">
        <button
          type="button"
          class="lpp__btn"
          data-tid="presets-cancel"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="lpp__btn lpp__btn--primary"
          data-tid="presets-done"
          @click="$emit('done', draft)"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { MAX_FAVOURITES, toggleFavourite, type LightPreset } from '@/services/control/lights'
import { presetGradient } from './preset-look'

/**
 * Every preset, to star up to seven as favourites. Nothing is saved until Done;
 * an eighth star is refused with the reason, not silently.
 */
@Component
export default class LightsPresetsPopup extends Vue {
  @Prop({ type: Array, required: true }) readonly presets!: LightPreset[]
  @Prop({ type: Array, required: true }) readonly favourites!: string[]

  draft: string[] = []
  hint = ''
  max = MAX_FAVOURITES

  isFav (id: string): boolean { return this.draft.includes(id) }

  gradient (p: LightPreset): string { return presetGradient(p) }

  flip (id: string) {
    const next = toggleFavourite(this.draft, id)
    this.draft = next.draft
    this.hint = next.hint
  }

  created () { this.draft = this.favourites.slice() }

  mounted () {
    // Out of the page's own layers, so the phone's tab bar and toasts cannot sit over it.
    (this.$el.closest('.v-application') ?? document.body).appendChild(this.$el)
    ;(this.$refs.dialog as HTMLElement | undefined)?.focus()
  }

  beforeDestroy () { this.$el.parentNode?.removeChild(this.$el) }
}
</script>

<style lang="scss">
.lpp { position: fixed; inset: 0; z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
.lpp__scrim { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.66); }
.lpp__card { position: relative; width: 680px; max-width: 100%; max-height: 100%; overflow-y: auto; box-sizing: border-box; padding: 24px; border-radius: 28px; background: var(--m3d-surface); color: var(--m3d-text); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 24px 64px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; gap: 16px; outline: none; }
.lpp__head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.lpp__head h2 { margin: 0; flex: 1; font-size: 20px; font-weight: 700; }
.lpp__count { color: var(--m3d-accent); font-size: 13.5px; font-weight: 600; }
.lpp__hint { margin: 0; min-height: 0; color: var(--m3d-text-muted); font-size: 13px; }
.lpp__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.lpp__tile { position: relative; min-height: 84px; border-radius: 14px; display: flex; flex-direction: column; justify-content: flex-end; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18); }
.lpp__tile--fav { box-shadow: 0 0 0 2px #ffd24a; }
.lpp__star { position: absolute; top: 0; right: 0; width: 44px; height: 44px; padding: 0; border: 0; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lpp__star span { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(0, 0, 0, 0.5); }
.lpp__name { display: block; margin: 0 6px 6px; padding: 4px 8px; border-radius: 9px; background: rgba(0, 0, 0, 0.62); color: #fff; font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lpp__actions { display: flex; justify-content: flex-end; gap: 10px; }
.lpp__btn { min-height: 44px; padding: 0 22px; border: 0; border-radius: 12px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.lpp__btn--primary { padding: 0 24px; background: var(--m3d-accent); color: var(--m3d-on-accent, #0b2523); }
@media (max-width: 600px) {
  .lpp { align-items: flex-end; padding: 0; }
  .lpp__card { width: 100%; max-height: 92%; padding: 16px; border-radius: 28px 28px 0 0; }
  .lpp__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .lpp__actions .lpp__btn { flex: 1; }
}
</style>
