<template>
  <v-dialog
    :value="value"
    max-width="480"
    :persistent="persistent"
    content-class="m3-dlg-frame ble-sheet-frame"
    @input="onInput"
  >
    <div
      class="m3-dlg ble-sheet"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      data-tid="ble-sheet"
    >
      <div class="ble-sheet__top">
        <span
          class="ble-sheet__eyebrow"
          data-tid="ble-sheet-step"
        >Step {{ step }} of {{ of }}</span>
        <span
          class="ble-sheet__dots"
          aria-hidden="true"
          data-tid="ble-sheet-dots"
        >
          <i
            v-for="n in of"
            :key="n"
            :class="{ 'is-on': n <= step }"
          />
        </span>
        <button
          type="button"
          class="m3-dlg__close ble-sheet__x"
          aria-label="Close"
          :data-tid="closeTid"
          @click="$emit('close')"
        >
          <frame-icon name="x" />
        </button>
      </div>
      <slot />
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * The Bluetooth pairing sheet (v3 `bluetooth` storyboard, INDEX row 24): one
 * sheet over the dimmed printer list, full width on a phone. "Step n of N"
 * and the dots sit on top in place of setup's step list; each step inside is
 * a flat SetupStepCard (title, one muted line, content, then the footer).
 */
@Component({})
export default class BluetoothSheet extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  @Prop({ type: Number, required: true })
  readonly step!: number

  @Prop({ type: Number, default: 3 })
  readonly of!: number

  @Prop({ type: Boolean })
  readonly persistent!: boolean

  @Prop({ type: String, default: 'Bluetooth' })
  readonly label!: string

  @Prop({ type: String, default: 'ble-sheet-close' })
  readonly closeTid!: string

  onInput (open: boolean) {
    if (!open) this.$emit('close')
  }
}
</script>

<style lang="scss" scoped>
.ble-sheet {
  gap: 14px;

  &__top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__eyebrow {
    font-size: var(--m3d-text-xs);
    font-weight: var(--m3d-weight-medium);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--m3d-text-muted);
  }

  &__dots {
    display: inline-flex;
    gap: 6px;

    i {
      width: 30px;
      height: 3px;
      border-radius: 2px;
      background: var(--m3d-border);

      &.is-on {
        background: var(--m3d-accent);
      }
    }
  }

  &__x {
    margin-left: auto;
  }

  // The sheet carries the step: a step card's own eyebrow would say it twice.
  ::v-deep .setup-step__eyebrow {
    display: none;
  }
}
</style>

<style lang="scss">
@media (max-width: 599px) {
  // Full width on a phone: a sheet up from the bottom edge.
  .v-dialog.ble-sheet-frame {
    width: 100%;
    max-width: 100% !important;
    margin: 0;
    align-self: flex-end;
    max-height: 92%;
    border-radius: 16px 16px 0 0;
  }
}
</style>
