/**
 * First paint (KAN-5929): what the rim shows, and when the splash may leave.
 * This is the model only: no DOM, no clock of its own. The design is the
 * design lab's round 2 "loading" (r2-loading.js): the rim follows the
 * printer's real start-up, and the wordmark is printed in a fixed time.
 *
 * The rim never moves on a guess. Its target is the start-up step Control has
 * really reached (plus the loader's real marks inside the first step), and it
 * stops where the start-up stops; a comet keeps lapping so a stall never looks
 * frozen.
 */

/** The wordmark always takes this long to print, however fast the start. */
export const LOGO_S = 3.6
/** The nozzle's run-in before the first layer. */
export const LEAD = 0.4
/** From the start-up being done (and the logo finished) to the closing sweep. */
export const SETTLE_S = 0.2
/** The closing sweep runs 0 to 1.2 over this long. */
export const SWEEP_S = 0.7
/** The splash never holds the page longer than this: past it the real screen explains. */
export const GIVE_UP_S = 20
/** A printer that has not opened its socket this long is handed to the connecting screen, which says what to check. */
export const CONNECT_GIVE_UP_S = 8
/** How fast the drawn fill follows its target (per second, as in the lab). */
export const FOLLOW = 9
/** The loader's mark for "the entry script has run": the first any App can report. */
export const ENTRY_MARK = 0.8

/** The steps of a start-up, in order. Four rim quarters. */
export const STAGES = ['Opening Control', 'Connecting', 'Starting Klipper', 'Loading the printer'] as const
export const STAGE_COUNT = STAGES.length

export interface StartupFacts {
  /** The loader's own progress mark while Control loads (0.15 first frame, 0.5 CSS, 0.8 entry script). */
  loaderMark: number;
  /** The first route has resolved. */
  routerReady: boolean;
  /** What the connection says to show (services/connection/view). */
  screen: 'connecting' | 'unreachable' | 'updating' | 'updating-late' | null;
  /** The printer's socket is open. */
  socketOpen: boolean;
  /** Klipper's state from server.info: 'startup', 'ready', 'shutdown'... or '' before it has been asked. */
  klippyState: string;
  klippyConnected: boolean;
  /** The first status dump has arrived. */
  socketReady: boolean;
}

export type Outcome =
  /** Still starting. */
  | 'waiting'
  /** The printer is up and has sent its first state. */
  | 'ready'
  /** Control can show something true now, and it isn't "ready": hand over to it. */
  | 'handover'

export interface Reading {
  stage: number;
  /** How far through the stage, 0 to 1. Only the first stage has a real inside. */
  within: number;
  label: string;
  outcome: Outcome;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** What start-up has really reached. */
export function readStartup (f: StartupFacts): Reading {
  if (!f.routerReady) {
    return { stage: 0, within: clamp(f.loaderMark / ENTRY_MARK, 0, 1) * 0.9, label: STAGES[0], outcome: 'waiting' }
  }
  // The printer can't be reached, or is restarting into an update: the screen for that says so.
  if (f.screen === 'unreachable' || f.screen === 'updating' || f.screen === 'updating-late') {
    return { stage: 1, within: 0, label: STAGES[1], outcome: 'handover' }
  }
  if (f.screen === 'connecting') {
    return { stage: 1, within: 0, label: STAGES[1], outcome: 'waiting' }
  }
  // A page is showing. Without a socket it isn't a printer's start-up (setup, sign-in, Printers, a login).
  if (!f.socketOpen) {
    return { stage: 1, within: 0, label: STAGES[1], outcome: 'handover' }
  }
  // Klipper itself failed: the page says what.
  if (f.klippyState === 'shutdown' || f.klippyState === 'error') {
    return { stage: 2, within: 0, label: STAGES[2], outcome: 'handover' }
  }
  if (f.klippyState === 'ready' && f.klippyConnected) {
    return f.socketReady
      ? { stage: STAGE_COUNT - 1, within: 1, label: STAGES[3], outcome: 'ready' }
      : { stage: 3, within: 0, label: STAGES[3], outcome: 'waiting' }
  }
  // Connected, Klipper not up yet. Only name Klipper once the printer has said it is starting.
  return { stage: 2, within: 0, label: f.klippyState === 'startup' ? STAGES[2] : 'Asking the printer', outcome: 'waiting' }
}

/** Where the rim's fill should be, 0 to 1. */
export function rimTarget (r: Reading): number {
  return r.outcome === 'ready' ? 1 : clamp((r.stage + r.within) / STAGE_COUNT, 0, 1)
}

export interface Frame {
  /** The fill to draw, 0 to 1 (eased toward the target). */
  rim: number;
  /** Where the fill is going. */
  target: number;
  /** The comet's place on the rim, 0 to 1; -1 when nothing moves (reduced motion, or finishing). */
  head: number;
  /** The closing sweep: -1 before it, then 0 to 1.2. */
  fin: number;
  label: string;
  stage: number;
  outcome: Outcome;
  /** Seconds since the splash began. */
  t: number;
  /** Seconds since the logo began (negative before it). */
  logoT: number;
  /** Everything is finished: the splash can go. */
  done: boolean;
}

/**
 * The splash's clock-driven state. Feed it facts with `update` and ask for the
 * picture at a moment with `frame`; both take seconds from any monotonic clock.
 */
export class FirstPaint {
  private readonly t0: number
  private readonly reduced: boolean
  private logoStart = 0
  private reading: Reading
  private outcome: Outcome = 'waiting'
  private settledAt: number | null = null
  private connectingSince: number | null = null
  private dp = 0
  private last = 0

  constructor (now: number, opts: { reduced?: boolean, loaderMark?: number } = {}) {
    this.t0 = now
    this.reduced = !!opts.reduced
    this.reading = readStartup({
      loaderMark: opts.loaderMark ?? 0, routerReady: false, screen: null, socketOpen: false, klippyState: '', klippyConnected: false, socketReady: false
    })
    this.dp = this.reduced ? rimTarget(this.reading) : 0
  }

  /** The wordmark's clock starts now (the font was late). */
  startLogo (now: number): void {
    this.logoStart = now - this.t0
  }

  update (facts: StartupFacts, now: number): void {
    if (this.settledAt !== null) return
    this.reading = readStartup(facts)
    if (this.reading.stage === 1 && this.reading.outcome === 'waiting') this.connectingSince ??= now - this.t0
    if (this.reading.outcome !== 'waiting') this.settle(this.reading.outcome, now - this.t0)
  }

  private settle (outcome: Outcome, at: number): void {
    this.outcome = outcome
    this.settledAt = at
  }

  get settled (): boolean {
    return this.settledAt !== null
  }

  frame (now: number): Frame {
    const t = now - this.t0
    if (this.settledAt === null && (t >= GIVE_UP_S || (this.connectingSince !== null && this.reading.stage === 1 && t - this.connectingSince >= CONNECT_GIVE_UP_S))) this.settle('handover', t)
    const dt = clamp(t - this.last, 0, 0.1)
    this.last = t
    const target = this.outcome === 'ready' ? 1 : rimTarget(this.reading)
    this.dp = this.reduced ? target : this.dp + (target - this.dp) * (1 - Math.exp(-dt * FOLLOW))

    const logoEnd = this.logoStart + LEAD + LOGO_S
    const settledAt = this.settledAt
    let done = false
    let fin = -1
    let label: string = this.reading.label
    if (settledAt !== null) {
      if (this.outcome === 'handover' || this.reduced) {
        done = true
        if (this.outcome === 'ready') label = 'Ready'
      } else {
        // The logo is done first if the start was quick: it always gets its full time.
        const tf = Math.max(settledAt, logoEnd) + SETTLE_S
        label = t >= tf ? 'Ready' : 'Nearly there'
        fin = t >= tf ? (t - tf) / SWEEP_S : -1
        done = fin >= 1.2
      }
    }
    return {
      rim: this.outcome === 'ready' ? 1 : this.dp,
      target,
      head: this.reduced || fin >= 0 ? -1 : (t * 0.42) % 1,
      fin,
      label,
      stage: this.reading.stage,
      outcome: this.outcome,
      t,
      logoT: t - this.logoStart,
      done
    }
  }
}
