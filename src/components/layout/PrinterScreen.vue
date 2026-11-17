<template>
  <span
    class="printer-screen"
    :class="[`printer-screen--${state}`, { 'printer-screen--foreign': foreign }]"
    :data-state="state"
    :aria-label="label"
    role="img"
  ><span>{{ glyph }}</span></span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { STRIP_LABELS, type StripState } from '@/services/muon-cloud/printer-strip'

@Component
export default class PrinterScreen extends Vue {
  @Prop({ type: String, required: true }) readonly state!: StripState
  @Prop({ type: Boolean }) readonly foreign!: boolean

  get label (): string { return STRIP_LABELS[this.state] }
  get glyph (): string { return ({ printing: '▶', ready: '✓', heating: '↑', paused: 'Ⅱ', fault: '!', asleep: '—', new: '?' })[this.state] }
}
</script>

<style lang="scss" scoped>
.printer-screen {
  --ring-printing: #80d6d1;
  --ring-ready: rgb(48 209 88);
  --ring-heating: rgb(255 146 48);
  --ring-paused: rgb(255 146 48);
  --ring-fault: rgb(255 66 69);
  --ring-asleep: #636366;
  --ring-new: #98989d;
  display: inline-flex;
  flex: none;
  width: 38px;
  height: 38px;
  padding: 3px;
  border: 2px solid currentColor;
  border-radius: 50%;
  color: var(--ring-new);
  background: var(--m3d-surface);
  align-items: center;
  justify-content: center;
  font: 600 16px monospace;

  > span { display: grid; place-items: center; width: 100%; height: 100%; border-radius: inherit; background: var(--m3d-fill, rgb(128 128 128 / 12%)); }
}
.theme--light .printer-screen {
  --ring-printing: #2b7f79;
  --ring-ready: rgb(0 137 50);
  --ring-heating: rgb(201 52 0);
  --ring-paused: rgb(201 52 0);
  --ring-fault: rgb(215 0 21);
  --ring-asleep: #aeaeb2;
  --ring-new: #6e6e73;
}
@each $state in printing, ready, heating, paused, fault, asleep, new {
  .printer-screen--#{$state} { color: var(--ring-#{$state}); }
}
.printer-screen--foreign { border-radius: 11px; }
</style>
