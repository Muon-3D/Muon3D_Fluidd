<template>
  <div
    class="hud-card"
    :class="[`is-${tone}`, { 'is-compact': compact }]"
    draggable="true"
    @dragstart="$emit('dragstart', $event)"
  >
    <span class="hud-card__corner is-tl" />
    <span class="hud-card__corner is-tr" />
    <span class="hud-card__corner is-bl" />
    <span class="hud-card__corner is-br" />

    <header class="hud-card__head">
      <div>
        <div class="hud-card__unit">
          {{ glass ? printer.model : `UNIT ${unitCode} · ${printer.model}` }}
        </div>
        <div class="hud-card__name">
          {{ printer.name }}
        </div>
      </div>
      <div
        class="hud-card__state"
        :class="`is-${tone}`"
      >
        {{ glass ? stateText : `[ ${stateLabel} ]` }}
      </div>
    </header>

    <div
      v-if="widgets.model && !compact"
      class="hud-card__model"
    >
      <printer-model3d
        :printer-id="printer.id"
        :status="status"
      />
      <div class="hud-card__reticle" />
    </div>

    <div
      v-if="widgets.progress && printing"
      class="hud-card__block"
    >
      <div class="hud-card__row">
        <span class="hud-card__label">{{ label.progress }}</span>
        <span class="hud-card__value hud-card__big">{{ percent }}<small>%</small></span>
      </div>
      <div class="hud-card__bar">
        <div
          class="hud-card__bar-fill"
          :style="{ width: `${percent}%` }"
        />
        <div
          v-for="i in 9"
          :key="i"
          class="hud-card__tick"
          :style="{ left: `${i * 10}%` }"
        />
      </div>
    </div>

    <dl class="hud-card__grid">
      <template v-if="widgets.file && status && status.filename">
        <dt>{{ label.file }}</dt>
        <dd class="is-wide">
          {{ status.filename }}
        </dd>
      </template>
      <template v-if="widgets.eta && printing">
        <dt>{{ label.elapsed }}</dt>
        <dd>{{ clock(status && status.printDuration) }}</dd>
        <dt>{{ label.remaining }}</dt>
        <dd>{{ remaining }}</dd>
      </template>
      <template v-if="widgets.layer && status && status.layer">
        <dt>{{ label.layer }}</dt>
        <dd>{{ status.layer }}<span class="hud-card__dim"> / {{ status.totalLayers || '—' }}</span></dd>
      </template>
      <template v-if="widgets.temps && status && status.extruder">
        <dt>{{ label.nozzle }}</dt>
        <dd>
          {{ status.extruder.temperature.toFixed(1) }}°<span class="hud-card__dim"> → {{ status.extruder.target.toFixed(0) }}°</span>
        </dd>
        <template v-if="status.bed">
          <dt>{{ label.bed }}</dt>
          <dd>
            {{ status.bed.temperature.toFixed(1) }}°<span class="hud-card__dim"> → {{ status.bed.target.toFixed(0) }}°</span>
          </dd>
        </template>
      </template>
      <template v-if="widgets.position && status && status.position">
        <dt>{{ label.position }}</dt>
        <dd class="is-wide">
          X{{ fmt(status.position[0]) }} Y{{ fmt(status.position[1]) }} Z{{ fmt(status.position[2]) }}
        </dd>
      </template>
      <template v-if="widgets.factors && status && status.speedFactor !== undefined">
        <dt>{{ label.speed }}</dt>
        <dd>{{ Math.round(status.speedFactor * 100) }}%</dd>
        <dt>{{ label.flow }}</dt>
        <dd>{{ Math.round((status.extrudeFactor || 1) * 100) }}%</dd>
      </template>
      <template v-if="!printer.online">
        <dt>{{ label.lastSeen }}</dt>
        <dd class="is-wide">
          {{ lastSeen }}
        </dd>
      </template>
    </dl>

    <footer class="hud-card__foot">
      <span
        v-if="!glass"
        class="hud-card__link"
      >IROH · {{ printer.id.slice(0, 8).toUpperCase() }}</span>
      <v-spacer />
      <button
        type="button"
        class="hud-card__open"
        :disabled="!printer.online"
        @click="$emit('open', printer.id)"
      >
        {{ glass ? 'Open' : 'OPEN ▸' }}
      </button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import type { PrinterStatus } from '@/services/muon-cloud/state'
import PrinterModel3d from './PrinterModel3d.vue'

@Component({ components: { PrinterModel3d } })
export default class FleetCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly printer!: CloudPrinter

  @Prop({ type: Object, default: null })
  readonly status!: PrinterStatus | null

  @Prop({ type: Object, required: true })
  readonly widgets!: Record<string, boolean>

  @Prop({ type: Number, default: 1 })
  readonly index!: number

  @Prop({ type: Boolean, default: false })
  readonly compact!: boolean

  // The glass style draws the card as a plain grouped card, so its labels
  // are in sentence case and the console's brackets and arrows go.
  get glass (): boolean {
    return this.$store.getters['config/getUiStyle'] === 'glass'
  }

  get label (): Record<string, string> {
    const labels = {
      progress: 'Progress',
      file: 'File',
      elapsed: 'Elapsed',
      remaining: 'Remaining',
      layer: 'Layer',
      nozzle: 'Nozzle',
      bed: 'Bed',
      position: 'Position',
      speed: 'Speed',
      flow: 'Flow',
      lastSeen: 'Last seen'
    }
    if (this.glass) return labels
    return {
      ...Object.fromEntries(Object.entries(labels).map(([key, text]) => [key, text.toUpperCase()])),
      position: 'POS'
    }
  }

  get stateText (): string {
    const label = this.stateLabel.toLowerCase()
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  get unitCode () {
    return String(this.index).padStart(2, '0')
  }

  get printing () {
    return !!this.status?.reachable && (this.status.state === 'printing' || this.status.state === 'paused')
  }

  get percent () {
    return Math.round((this.status?.progress ?? 0) * 100)
  }

  get tone () {
    const s = this.status
    if (!this.printer.online || !s?.reachable) return 'offline'
    if (s.state === 'printing') return 'printing'
    if (s.state === 'paused') return 'paused'
    if (s.state === 'error' || s.state?.startsWith('klipper')) return 'error'
    if (s.state === 'complete') return 'complete'
    return 'ready'
  }

  get stateLabel () {
    if (!this.printer.online) return 'OFFLINE'
    const s = this.status
    if (!s) return 'LINKING'
    if (!s.reachable) return 'NO SIGNAL'
    return (s.state ?? 'unknown').toUpperCase()
  }

  get remaining () {
    const s = this.status
    if (!s?.printDuration || !s.progress) return '—'
    const total = s.printDuration / Math.max(s.progress, 0.001)
    return this.clock(total - s.printDuration)
  }

  get lastSeen () {
    const t = this.printer.last_seen
    if (!t) return 'never'
    return new Date(t * 1000).toLocaleString()
  }

  clock (seconds?: number | null) {
    if (!seconds || !Number.isFinite(seconds)) return '—'
    const s = Math.max(0, Math.round(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  fmt (v: number) {
    return (v ?? 0).toFixed(1).padStart(6, ' ')
  }
}
</script>

<style lang="scss" scoped>
$hud-bg: #0a0d0b;
$hud-line: #26332a;
$hud-text: #d6e2d8;
$hud-dim: #6f8575;
$hud-green: #9fe870;
$hud-amber: #ffb547;
$hud-red: #ff5c5c;
$hud-blue: #6cc4ff;

.hud-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 14px 14px 10px;
  background:
    linear-gradient(rgba(159, 232, 112, 0.035) 1px, transparent 1px) 0 0 / 100% 22px,
    $hud-bg;
  border: 1px solid $hud-line;
  color: $hud-text;
  font-family: 'Roboto Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  cursor: grab;

  &__corner {
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: $hud-green;
    border-style: solid;
    opacity: 0.8;

    &.is-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    &.is-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    &.is-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
    &.is-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }
  }

  &.is-offline &__corner { border-color: $hud-dim; }
  &.is-error &__corner { border-color: $hud-red; }
  &.is-paused &__corner { border-color: $hud-amber; }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px dashed $hud-line;
  }

  &__unit {
    color: $hud-dim;
    font-size: 10px;
    letter-spacing: 0.14em;
  }

  &__name {
    margin-top: 2px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__state {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.12em;
    white-space: nowrap;

    &.is-ready, &.is-complete { color: $hud-green; }
    &.is-printing { color: $hud-blue; animation: hud-blink 2s steps(2, start) infinite; }
    &.is-paused { color: $hud-amber; }
    &.is-error { color: $hud-red; }
    &.is-offline { color: $hud-dim; }
  }

  &__model {
    position: relative;
    height: 220px;
    margin: 10px -4px 6px;
    border: 1px solid $hud-line;
    background: radial-gradient(ellipse at 50% 60%, rgba(159, 232, 112, 0.07), transparent 70%);
  }

  &__reticle {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(to right, rgba(159, 232, 112, 0.25), rgba(159, 232, 112, 0.25)) 50% 0 / 1px 8px no-repeat,
      linear-gradient(to right, rgba(159, 232, 112, 0.25), rgba(159, 232, 112, 0.25)) 50% 100% / 1px 8px no-repeat,
      linear-gradient(to right, rgba(159, 232, 112, 0.25), rgba(159, 232, 112, 0.25)) 0 50% / 8px 1px no-repeat,
      linear-gradient(to right, rgba(159, 232, 112, 0.25), rgba(159, 232, 112, 0.25)) 100% 50% / 8px 1px no-repeat;
  }

  &__block {
    margin-top: 10px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__label {
    color: $hud-dim;
    font-size: 10px;
    letter-spacing: 0.16em;
  }

  &__big {
    font-size: 22px;
    font-weight: 700;
    color: $hud-blue;

    small {
      font-size: 12px;
      margin-left: 1px;
    }
  }

  &__bar {
    position: relative;
    height: 8px;
    margin-top: 4px;
    border: 1px solid $hud-line;
  }

  &__bar-fill {
    height: 100%;
    background: repeating-linear-gradient(90deg, $hud-blue 0 3px, rgba(108, 196, 255, 0.55) 3px 5px);
    transition: width 600ms ease;
  }

  &__tick {
    position: absolute;
    top: -3px;
    width: 1px;
    height: 3px;
    background: $hud-dim;
  }

  &__grid {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
    gap: 5px 10px;
    margin: 10px 0 0;

    dt {
      color: $hud-dim;
      font-size: 10px;
      letter-spacing: 0.14em;
      align-self: center;
    }

    dd {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.is-wide {
        grid-column: span 3;
      }
    }
  }

  &__dim {
    color: $hud-dim;
  }

  &__foot {
    display: flex;
    align-items: center;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px dashed $hud-line;
    margin-top: 12px;
  }

  &__link {
    color: $hud-dim;
    font-size: 10px;
    letter-spacing: 0.14em;
  }

  &__open {
    color: $hud-green;
    font: inherit;
    font-weight: 700;
    letter-spacing: 0.14em;
    background: transparent;
    border: 1px solid rgba(159, 232, 112, 0.5);
    padding: 3px 10px;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: rgba(159, 232, 112, 0.12);
    }

    &:disabled {
      color: $hud-dim;
      border-color: $hud-line;
      cursor: default;
    }
  }
}

@keyframes hud-blink {
  to { opacity: 0.55; }
}
</style>
