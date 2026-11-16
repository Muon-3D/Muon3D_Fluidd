<template>
  <svg
    class="pdraw"
    :class="[`pdraw--${tone}`, { 'pdraw--still': !running, 'pdraw--dim': dim, 'pdraw--draw': drawOn }]"
    viewBox="0 0 150 170"
    role="img"
    :aria-label="label"
  >
    <template v-if="kind === 'm1'">
      <!-- An M1, upside down as it is: the column at the back carries the plate,
           the part hangs from the plate and grows down to the nozzle in the base. -->
      <path
        class="pdraw__ln"
        pathLength="1"
        d="M118 150 V40 H127 V150"
      />
      <path
        class="pdraw__ln"
        pathLength="1"
        :d="`M22 ${plateY} H122`"
      />
      <clipPath :id="clipId">
        <rect
          x="0"
          :y="plateY + 1"
          width="150"
          :height="grown"
        />
      </clipPath>
      <path
        class="pdraw__part"
        :d="`M52 ${plateY + 1} H92 Q100 ${plateY + 25} 88 ${plateY + 43} Q80 ${plateY + 57} 90 ${plateY + 77} H54 Q64 ${plateY + 57} 56 ${plateY + 43} Q44 ${plateY + 25} 52 ${plateY + 1} Z`"
        :fill="partColour"
        :clip-path="`url(#${clipId})`"
      />
      <g class="pdraw__head">
        <path
          class="pdraw__noz"
          d="M72 152 l-4.5 -6 l4.5 -6 l4.5 6 z"
        />
      </g>
      <path
        class="pdraw__ln pdraw__base"
        pathLength="1"
        d="M10 152 H140 a8 8 0 0 1 8 8 V162 a8 8 0 0 1 -8 8 H10 a8 8 0 0 1 -8 -8 V160 a8 8 0 0 1 8 -8 Z"
      />
      <path
        class="pdraw__knob"
        d="M8 154 a13 13 0 0 0 0 14"
      />
      <!-- Its round screen, glowing in its state's colour. -->
      <circle
        class="pdraw__glow"
        cx="25"
        cy="161"
        r="13"
      />
      <circle
        class="pdraw__screen"
        cx="25"
        cy="161"
        r="9.5"
      />
    </template>
    <template v-else>
      <!-- Any other Klipper printer: a plain box frame that prints upwards
           from its bed, with a small square where an M1 has its round screen. -->
      <path
        class="pdraw__ln"
        pathLength="1"
        d="M26 168 V34 H124 V168"
      />
      <path
        class="pdraw__ln"
        pathLength="1"
        d="M14 168 H136"
      />
      <path
        class="pdraw__ln"
        pathLength="1"
        d="M36 150 H114"
      />
      <clipPath :id="clipId">
        <rect
          x="0"
          :y="150 - otherGrown"
          width="150"
          :height="otherGrown"
        />
      </clipPath>
      <path
        class="pdraw__part"
        d="M52 150 V96 H98 V150 Z"
        :fill="partColour"
        :clip-path="`url(#${clipId})`"
      />
      <g :transform="`translate(0 ${136 - otherGrown})`">
        <path
          class="pdraw__ln"
          pathLength="1"
          d="M26 0 H124"
        />
        <g class="pdraw__head">
          <path
            class="pdraw__noz"
            d="M75 1 l-4.5 6 l4.5 6 l4.5 -6 z"
          />
        </g>
      </g>
      <rect
        class="pdraw__square"
        x="100"
        y="154"
        width="18"
        height="12"
        rx="2.5"
      />
    </template>
    <path
      v-if="tone === 'err'"
      class="pdraw__warn"
      d="M70 96 l12 21 h-24 z M70 104 v6 M70 113.5 v0.5"
    />
    <g v-if="asleep">
      <text
        x="100"
        y="36"
        class="pdraw__zz"
      >z</text>
      <text
        x="110"
        y="24"
        class="pdraw__zz pdraw__zz--late"
      >z</text>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { TileState, TileTone } from '@/services/printers-page/model'

let uid = 0

/**
 * A printer drawn as a line drawing (KAN-2257, the Bench, control-ctx): an
 * M1 with its part growing in its filament's colour as it prints and its
 * small round screen glowing in its state's colour, or, for any other
 * Klipper printer, a plain box frame that prints upwards. Only transforms
 * and the line's dash move; a printer that isn't printing stands still.
 */
@Component({})
export default class PrinterDrawing extends Vue {
  @Prop({ type: String, default: 'm1' })
  readonly kind!: 'm1' | 'other'

  @Prop({ type: String, required: true })
  readonly state!: TileState

  @Prop({ type: String, required: true })
  readonly tone!: TileTone

  /** 0 to 100, while printing or paused. */
  @Prop({ type: Number, default: null })
  readonly progress!: number | null

  /** The loaded filament's colour, when the printer has said. */
  @Prop({ type: String, default: null })
  readonly colour!: string | null

  /** Draw the lines on, once, as the page arrives. */
  @Prop({ type: Boolean })
  readonly drawOn!: boolean

  @Prop({ type: Boolean })
  readonly dim!: boolean

  @Prop({ type: String, default: '' })
  readonly label!: string

  readonly clipId = `pdraw-clip-${++uid}`

  get running (): boolean {
    return this.state === 'printing'
  }

  get asleep (): boolean {
    return this.state === 'offline' || this.state === 'unreachable'
  }

  /** How far through the print it is, 0 to 1, only while there is a print. */
  get fraction (): number {
    if (this.state !== 'printing' && this.state !== 'paused') return 0
    return Math.max(0, Math.min(1, (this.progress ?? 0) / 100))
  }

  /** The plate rises as the part hangs longer from it. */
  get plateY (): number {
    return this.fraction ? Math.round((132 - this.fraction * 76) * 10) / 10 : 60
  }

  get grown (): number {
    return Math.round(this.fraction * 76 * 10) / 10
  }

  get otherGrown (): number {
    return Math.round(this.fraction * 54 * 10) / 10
  }

  get partColour (): string {
    return this.colour || 'var(--m3d-accent)'
  }
}
</script>

<style lang="scss" scoped>
  .pdraw {
    --pd-ink: var(--m3d-text);
    --pd-paper: var(--m3d-surface);
    --pd-state: var(--m3d-text-subtle);

    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  // One colour per state, as everywhere: printing teal, ready green, waiting
  // amber, fault red, asleep grey.
  .pdraw--run { --pd-state: var(--m3d-accent); }
  .pdraw--ok { --pd-state: var(--m3d-success); }
  .pdraw--warn { --pd-state: var(--m3d-warning); }
  .pdraw--err { --pd-state: var(--m3d-danger); }
  .pdraw--off { --pd-state: var(--m3d-text-subtle); }
  .pdraw--info { --pd-state: var(--m3d-text-muted); }

  .pdraw__ln {
    fill: none;
    stroke: var(--pd-ink);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
  }

  .pdraw__base { fill: var(--pd-paper); }

  .pdraw__noz {
    fill: var(--pd-paper);
    stroke: var(--pd-ink);
    stroke-width: 1.4;
  }

  // The head works side to side while it prints: a transform, nothing else.
  .pdraw__head { animation: pdraw-print 1.25s ease-in-out infinite alternate; }
  .pdraw--still .pdraw__head { animation: none; opacity: 0.3; }

  @keyframes pdraw-print {
    from { transform: translateX(-15px); }
    to { transform: translateX(15px); }
  }

  .pdraw__knob {
    fill: none;
    stroke: var(--pd-state);
    stroke-width: 2.6;
    stroke-linecap: round;
  }

  .pdraw__screen {
    fill: #000;
    stroke: var(--pd-ink);
    stroke-width: 1.6;
  }

  .pdraw__glow {
    fill: none;
    stroke: var(--pd-state);
    stroke-width: 3;
    opacity: 0.55;
  }

  .pdraw__square {
    fill: var(--m3d-surface-2);
    stroke: var(--pd-state);
    stroke-width: 1.6;
  }

  .pdraw__warn {
    fill: none;
    stroke: var(--m3d-danger);
    stroke-width: 2.2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .pdraw__zz {
    font: 12px var(--m3d-font-mono, monospace);
    fill: var(--m3d-text-muted);
    animation: pdraw-zz 2.4s ease-in-out infinite;
  }

  .pdraw__zz--late { animation-delay: 0.9s; }

  @keyframes pdraw-zz {
    0% { opacity: 0; transform: translateY(6px); }
    40% { opacity: 1; }
    100% { opacity: 0; transform: translateY(-8px); }
  }

  .pdraw--dim { opacity: 0.45; }

  // While the list arrives, the drawing draws itself (motion-slower, ease-standard).
  .pdraw--draw .pdraw__ln {
    animation: pdraw-on var(--m3d-motion-slower, 520ms) var(--m3d-ease-standard, ease) both;
  }

  @keyframes pdraw-on {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0; }
  }
</style>
