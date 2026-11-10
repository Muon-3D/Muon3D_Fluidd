<template>
  <div
    class="m1-screen"
    :class="`m1-screen--${phase}`"
    data-tid="m1-screen"
    :data-phase="phase"
    :style="flight"
    @click.self="close"
  >
    <div class="m1-screen__strip">
      <span class="m1-screen__what">{{ printerName }}'s screen</span>
      <span class="m1-screen__hint">Esc or click outside to leave</span>
      <button
        type="button"
        class="m1-screen__done"
        data-tid="m1-screen-done"
        @click="close"
      >
        Done
      </button>
    </div>
    <div class="m1-screen__bezel">
      <p
        class="m1-screen__empty"
        data-tid="m1-screen-empty"
      >
        The printer's screen isn't available here yet
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

/** The zoom in from the model's screen, and back out to it, ms (as the viewer's FLIGHT_MS). */
const FLY_MS = 380
/** The bezel's drawn size, and the room the top strip takes, px. */
const BEZEL_PX = 340
const STRIP_PX = 64

/**
 * The printer's own screen, zoomed into from the 3D M1 (Jack, 10 Nov): it
 * opens by zooming in from where the screen is on the model, and Esc, Done
 * or a click outside fly it back out there. Until Control serves the
 * screen's embed build (#310) it shows an empty state, and sends nothing.
 */
@Component
export default class M1Screen extends Vue {
  /** Where the model's screen is on the stage, to fly in from and back out to. */
  @Prop({ type: Object, default: null })
  readonly from!: { x: number, y: number } | null

  @Prop({ type: Boolean, default: false })
  readonly reducedMotion!: boolean

  /** 'in' before the zoom starts, 'open', then 'out' while it flies back. */
  phase: 'in' | 'open' | 'out' = 'in'
  flyTimer = 0
  flight: Record<string, string> = {}

  get printerName (): string {
    return (this.$store.getters['config/getDisplayName'] as string | undefined) || 'The printer'
  }

  /** The zoom's start (and end): the screen on the model, small, as an offset from the stage's middle. */
  flyFrom (): Record<string, string> {
    const el = this.$el as HTMLElement
    const ms = `${this.reducedMotion ? 0 : FLY_MS}ms`
    // Small stages (a phone) draw the bezel smaller, in the room under the strip with Done.
    const strip = el.querySelector('.m1-screen__strip') as HTMLElement | null
    const top = strip ? strip.offsetTop + strip.offsetHeight + 8 : STRIP_PX
    const fit = Math.min(1, (el.clientHeight - top - 12) / BEZEL_PX, (el.clientWidth - 24) / BEZEL_PX)
    const style: Record<string, string> = {
      '--fly-ms': ms,
      '--fit': `${Math.max(0.4, fit).toFixed(3)}`,
      '--drop': `${Math.max(0, Math.round((top - 12) / 2))}px`
    }
    if (!this.from) return style
    const dx = Math.round(this.from.x - el.clientWidth / 2)
    const dy = Math.round(this.from.y - el.clientHeight / 2)
    return { ...style, '--fly-x': `${dx}px`, '--fly-y': `${dy}px` }
  }

  mounted () {
    document.addEventListener('keydown', this.onKey)
    this.flight = this.flyFrom()
    // The next frame, so the zoom starts from the screen on the model.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.phase === 'in') this.phase = 'open'
    }))
  }

  beforeDestroy () {
    clearTimeout(this.flyTimer)
    document.removeEventListener('keydown', this.onKey)
  }

  /** Esc, Done or a click outside: fly back out to the model, then close. */
  close () {
    if (this.phase === 'out') return
    this.phase = 'out'
    clearTimeout(this.flyTimer)
    this.flyTimer = window.setTimeout(() => this.$emit('close'), this.reducedMotion ? 0 : FLY_MS)
  }

  /** Another printer, or Klippy gone: the screen was this printer's, so it closes. */
  @Watch('connectionKey')
  onConnectionChange () {
    this.$emit('close')
  }

  get connectionKey (): string {
    const s = this.$store.state.socket
    return `${this.$store.state.config.apiUrl ?? ''}|${s.connectionId ?? ''}|${s.open ? 1 : 0}|${this.$store.state.printer.printer.webhooks?.state ?? ''}`
  }

  onKey (e: KeyboardEvent) {
    if (e.key === 'Escape') this.close()
  }
}
</script>

<style lang="scss" scoped>
  .m1-screen {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 55%);
    backdrop-filter: blur(6px);
    pointer-events: auto;
    transition: background var(--fly-ms, 380ms) ease, backdrop-filter var(--fly-ms, 380ms) ease;
  }

  /* Zooming in from the model's screen, and back out to it. */
  .m1-screen__bezel,
  .m1-screen__strip {
    transition: transform var(--fly-ms, 380ms) cubic-bezier(0.2, 0.8, 0.2, 1), opacity var(--fly-ms, 380ms) ease;
  }

  .m1-screen--in,
  .m1-screen--out {
    background: rgb(0 0 0 / 0%);
    backdrop-filter: blur(0);

    .m1-screen__bezel {
      transform: translate(var(--fly-x, 0), var(--fly-y, 0)) scale(calc(0.14 * var(--fit, 1)));
      opacity: 0.4;
    }

    .m1-screen__strip {
      transform: translateY(-8px);
      opacity: 0;
    }
  }

  .m1-screen__empty {
    max-width: 220px;
    margin: 0;
    text-align: center;
    color: #3a3a3c;
    font-size: 14px;
    font-weight: 600;
  }

  .m1-screen__strip {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1;
    padding: 8px 10px 8px 14px;
    border-radius: 14px;
    background: rgb(36 36 40 / 82%);
    color: #f5f5f7;
    font-size: 13px;
  }

  .m1-screen__what {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .m1-screen__hint {
    color: #98989d;
    font-size: 12px;
    white-space: nowrap;

    @media (max-width: 600px) {
      display: none;
    }
  }

  .m1-screen__done {
    height: 30px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgb(118 118 128 / 24%);
    color: #f5f5f7;
    font-weight: 600;
  }

  /* The panel is a 480 px circle; drawn at 300 px in a light bezel like the M1's. */
  .m1-screen__bezel {
    position: relative;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 40%, #e9e9ea, #9c9ca0);
    display: grid;
    place-items: center;
    box-shadow: 0 30px 60px rgb(0 0 0 / 60%);
    transform: translateY(var(--drop, 0)) scale(var(--fit, 1));
  }
</style>
