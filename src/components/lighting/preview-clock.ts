import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { DEFAULT_LIGHT, LED_OFF, PREVIEW_INTERVAL_MS, previewLuminance, previewStrip, type LedDot, type LightState } from '@/services/control/lights'
import { reducedMotion } from '@/util/motion'

/** Effects that move: the others are drawn once. */
const MOVES = ['rainbow', 'breathe', 'chase', 'status']

/**
 * Draws one strip of the preview from the light state alone, in the browser:
 * no printer read per frame, and never more than 15 frames a second (one
 * timer at PREVIEW_INTERVAL_MS, only while an effect moves and the page is
 * showing). Under reduced motion it draws one still frame.
 */
@Component
export default class PreviewClock extends Vue {
  @Prop({ type: Object, required: true }) readonly light!: LightState

  dots: LedDot[] = previewStrip({ ...DEFAULT_LIGHT, on: false }, 0)
  /** Frames drawn, for the tests. */
  frames = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private started = 0

  get luminance (): number { return previewLuminance(this.light) }

  get animates (): boolean { return this.light.on && MOVES.includes(this.light.effect) && !reducedMotion() }

  get off (): string { return LED_OFF }

  draw () {
    const seconds = this.animates ? (performance.now() - this.started) / 1000 : 0
    this.dots = previewStrip(this.light, seconds)
    this.frames++
  }

  tick () {
    if (typeof document !== 'undefined' && document.hidden) return
    if (reducedMotion()) { if (this.timer) this.stop(); return }
    this.draw()
  }

  stop () {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  /** (Re)start the timer when the effect moves; stop it when not. One still frame either way. */
  sync () {
    this.draw()
    if (this.animates && !this.timer) this.timer = setInterval(() => this.tick(), PREVIEW_INTERVAL_MS)
    else if (!this.animates) this.stop()
  }

  @Watch('light', { deep: true })
  onLight () { this.sync() }

  mounted () {
    this.started = performance.now()
    this.sync()
  }

  beforeDestroy () { this.stop() }
}
