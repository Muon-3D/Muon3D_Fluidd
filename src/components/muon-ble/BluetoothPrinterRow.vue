<template>
  <div
    class="ble-row"
    data-tid="ble-printer-row"
  >
    <span class="ble-row__ico">
      <frame-icon
        name="bluetooth"
        small
      />
    </span>
    <span class="ble-row__text">
      <b>{{ name }}</b>
      <span v-if="line">{{ line }}</span>
    </span>
    <span
      v-if="busy"
      class="ble-row__busy"
    >
      <v-progress-circular
        indeterminate
        size="16"
        width="2"
      />
      {{ busy }}
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/** The printer being found, as the selected row of the storyboard's "Find your printer" list. */
@Component({})
export default class BluetoothPrinterRow extends Vue {
  @Prop({ type: String, required: true })
  readonly name!: string

  @Prop({ type: String, default: '' })
  readonly line!: string

  /** "Connecting…", with a spinner, while it is. */
  @Prop({ type: String, default: '' })
  readonly busy!: string
}
</script>

<style lang="scss" scoped>
.ble-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--m3d-accent) 35%, var(--m3d-border));
  border-radius: var(--m3d-radius-md);
  background: color-mix(in srgb, var(--m3d-accent) 10%, var(--m3d-surface));

  &__ico {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--m3d-radius-sm, 8px);
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  &__text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
    color: var(--m3d-text);

    b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      font-size: var(--m3d-text-xs);
      color: var(--m3d-text-muted);
    }
  }

  &__busy {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    font-size: var(--m3d-text-xs);
    color: var(--m3d-text-muted);
  }
}
</style>
