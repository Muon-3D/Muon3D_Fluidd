<template>
  <div
    class="ble-code"
    role="img"
    :aria-label="chars.join(' ')"
  >
    <span
      v-for="(ch, i) in chars"
      :key="i"
      :class="{ 'is-gap': i === 3 }"
    >{{ ch }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/** The six characters to compare with the printer's screen, one to a box, as "F6Q TDH". */
@Component({})
export default class BluetoothCodeBoxes extends Vue {
  @Prop({ type: String, default: '' })
  readonly code!: string

  get chars (): string[] {
    return this.code.replace(/\s/g, '').split('')
  }
}
</script>

<style lang="scss" scoped>
.ble-code {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 4px 0 16px;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 52px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: var(--m3d-surface-2);
    font-family: var(--m3d-font-mono);
    font-size: 26px;
    font-weight: var(--m3d-weight-semibold);
    color: var(--m3d-text);

    &.is-gap {
      margin-left: 12px;
    }
  }
}

@media (max-width: 380px) {
  .ble-code span {
    width: 34px;
    height: 46px;
    font-size: 22px;
  }
}
</style>
