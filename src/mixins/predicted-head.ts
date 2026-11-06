import { Component, Vue, Watch } from 'vue-property-decorator'
import { PositionPredictor, PredictionLoop, type Vec3 } from '@/services/control/position-predict'

/**
 * `predictedHead`: the toolhead position to draw, smoothed and predicted
 * between status updates (services/control/position-predict). It changes
 * once a frame while the head moves and the page is visible, and not at all
 * otherwise. Mix it into the smallest component that draws the head, so a
 * frame re-renders only that.
 *
 * Fed from motion_report (live_position, live_velocity) toward the commanded
 * toolhead.position (mid-print, along the way it last went); on a printer
 * without motion_report, the toolhead position as it is.
 */
/** Each component's predictor and frame loop, kept off the component so Vue doesn't make them reactive. */
const engines = new WeakMap<Vue, { predictor: PositionPredictor, loop: PredictionLoop }>()

@Component
export default class PredictedHeadMixin extends Vue {
  /** X, Y, Z to draw, or null before the first report. */
  predictedHead: Vec3 | null = null

  get headReport (): { live: number[] | null, velocity: number | null, commanded: number[] | null } {
    const printer = this.$store.state.printer.printer
    // Mid-print the commanded end is the far end of the look-ahead queue, not
    // where the head is heading now: carry on along the last direction instead.
    const printing = ['printing', 'paused'].includes(printer.print_stats?.state)
    const live = printer.motion_report?.live_position as number[] | undefined
    const commanded = printer.toolhead?.position as number[] | undefined
    return {
      live: Array.isArray(live) ? live : null,
      velocity: typeof printer.motion_report?.live_velocity === 'number' ? printer.motion_report.live_velocity : null,
      commanded: Array.isArray(commanded) && !printing ? commanded : null
    }
  }

  created () {
    engines.set(this, { predictor: new PositionPredictor(), loop: new PredictionLoop(now => this.drawHead(now)) })
    this.onHeadReport()
  }

  beforeDestroy () {
    engines.get(this)?.loop.stop()
    engines.delete(this)
  }

  @Watch('headReport')
  onHeadReport () {
    const engine = engines.get(this)
    const r = this.headReport
    const position = r.live ?? r.commanded ?? (this.$store.state.printer.printer.toolhead?.position as number[] | undefined)
    if (!position || !engine) return
    const now = performance.now()
    engine.predictor.report({ position, velocity: r.live ? r.velocity : 0, target: r.live ? r.commanded : null, at: now })
    this.drawHead(now)
    engine.loop.wake()
  }

  /** One frame. True while there is more to draw. */
  drawHead (now: number): boolean {
    const predictor = engines.get(this)?.predictor
    if (!predictor) return false
    const p = predictor.at(now)
    if (p) {
      const shown = this.predictedHead
      if (!shown || p.some((v, i) => Math.abs(v - shown[i]) >= 0.01)) this.predictedHead = p
    }
    return !predictor.settled(now)
  }
}
