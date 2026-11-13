<template>
  <m3-dialog
    :value="open"
    :title="title || fallbackTitle"
    :eyebrow="eyebrow"
    :tone="danger ? 'danger' : ''"
    :max-width="width"
    :persistent="persistent"
    :close-label="cancelText"
    data-tid="confirm"
    @close="choose(false)"
  >
    <p
      class="m3-dlg__text"
      data-tid="confirm-message"
    >
      {{ message }}
    </p>

    <plate-clear-notice
      v-if="plateNotice"
      inline
      :managed="plateNotice.managed"
    />

    <plate-check
      v-if="plateCheck"
      v-model="plateClear"
      data-tid="confirm-plate"
    />

    <div
      v-if="film"
      class="m3-confirm__film"
      data-tid="confirm-film"
    >
      <span class="m3-confirm__film-text">
        <b>Film it</b>
        <span>{{ film.line }}</span>
      </span>
      <toggle-switch
        v-model="filmOn"
        label="Film it"
        data-tid="confirm-film-switch"
      />
    </div>

    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="confirm-cancel"
        @click="choose(false)"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="cbtn"
        :class="danger ? 'cbtn--danger' : 'cbtn--primary'"
        :disabled="plateCheck && !plateClear"
        data-tid="confirm-ok"
        @click="choose(true)"
      >
        {{ okText }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import M3Dialog from './M3Dialog.vue'
import PlateCheck from './PlateCheck.vue'
import PlateClearNotice from './PlateClearNotice.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

/** How long the dialog takes to close before its answer is given. */
export const CLOSE_MS = 220

/**
 * The question behind `$confirm` (plugins/confirm.ts): what will happen, and
 * a button that says it. ✕, Esc, Cancel and a click outside all answer no.
 * The message is text, never HTML: it often holds a file's name. With
 * `plateCheck`, the button stays off until the plate check is ticked.
 */
@Component({ components: { M3Dialog, PlateCheck, PlateClearNotice, ToggleSwitch } })
export default class M3Confirm extends Vue {
  @Prop({ type: String, required: true })
  readonly message!: string

  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly eyebrow!: string

  /** What the button that says yes says: what will happen ("Delete", "Restart"). */
  @Prop({ type: String, default: '' })
  readonly buttonTrueText!: string

  @Prop({ type: String, default: '' })
  readonly buttonFalseText!: string

  /** It can't be undone, or it stops the printer: the button is red. */
  @Prop({ type: Boolean })
  readonly danger!: boolean

  @Prop({ type: Boolean })
  readonly persistent!: boolean

  @Prop({ type: Number, default: 440 })
  readonly width!: number

  /** A print starts: ask the plate check (PlateCheck) first. */
  @Prop({ type: Boolean })
  readonly plateCheck!: boolean

  /** The printer wants the plate confirmed: the notice shows inline (CT-14). */
  @Prop({ type: Object, default: null })
  readonly plateNotice!: { managed: boolean } | null

  /** A print the printer can film: the "Film it" switch (see ConfirmOptions.film). */
  @Prop({ type: Object, default: null })
  readonly film!: { on: boolean, line: string, set: (on: boolean) => unknown } | null

  open = true
  plateClear = false
  filmOn = false
  answered = false

  /** Class fields run before props are set, so the printer's timelapse setting is read here. */
  created () {
    this.filmOn = !!this.film?.on
  }

  get okText (): string {
    return this.buttonTrueText || 'Continue'
  }

  get cancelText (): string {
    return this.buttonFalseText || 'Cancel'
  }

  get fallbackTitle (): string {
    return this.okText
  }

  choose (value: boolean) {
    if (this.answered) return
    if (value && this.plateCheck && !this.plateClear) return
    this.answered = true
    if (value && this.film && this.filmOn !== !!this.film.on) this.film.set(this.filmOn)
    this.open = false
    window.setTimeout(() => this.$emit('result', value), CLOSE_MS)
  }
}
</script>

<style lang="scss" scoped>
  .m3-confirm__film {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .m3-confirm__film-text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }
</style>
