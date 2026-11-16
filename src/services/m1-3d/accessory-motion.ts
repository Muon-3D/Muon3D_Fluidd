import type { Accessories, AutoLoad, ColumnState } from './accessories'

export const PLATE_REMOVE_MS = 1800
export const PLATE_RETURN_PRINT_MS = 2200
export const PLATE_RETURN_EMPTY_MS = 1400
export const TUBE_DETACH_MS = 1100
export const TUBE_ATTACH_MS = 900
export const FILAMENT_LOAD_MS = 2600
export const FILAMENT_UNLOAD_MS = 2200
export const AUTOLOAD_SETTLE_MS = 900
export const CROSSFADE_MS = 180
/** The Z column lifted out of its socket and set aside, and back in: for the whole way, out to in. */
export const COLUMN_REMOVE_MS = 1700
export const COLUMN_FIT_MS = 1500
/** How far out the column shows with its lever up, of the whole way out: it sits proud of its socket. */
export const COLUMN_UNLOCKED_LEVEL = 0.03
/** A lever-only change is at least this long, so it reads. */
const COLUMN_MIN_MS = 450

export type ColumnClip = 'remove' | 'fit' | 'unlock' | 'lock'

/** How far out the column is for a state: 0 seated and locked, 1 off the printer. */
export const columnLevel = (state: ColumnState): number =>
  state === 'absent' ? 1 : state === 'unlocked' ? COLUMN_UNLOCKED_LEVEL : 0

export type PlateClip = 'remove' | 'return-print' | 'return-empty'

export interface AccessoryFrame {
  plate: { on: boolean; clip: PlateClip | null; t: number; carriesPrint: boolean };
  tube: { attached: boolean; clip: 'detach' | 'attach' | null; t: number; unlocking: boolean };
  filament: { loaded: boolean; clip: 'load' | 'unload' | null; t: number; autoLoad: AutoLoad; autoLoadAge: number };
  /** The Z column: its state, how far out it is drawn (0 seated, 1 off), and the clip running. */
  column: { state: ColumnState; level: number; clip: ColumnClip | null };
  spool: boolean;
  animating: boolean;
  crossfade: number;
}

interface RunningClip<T extends string> {
  name: T;
  startedAt: number;
  duration: number;
}

interface ClipFrame<T extends string> {
  clip: T | null;
  t: number;
}

interface ColumnTween {
  from: number;
  to: number;
  startedAt: number;
  duration: number;
  clip: ColumnClip;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const LARGE_AGE = 1_000_000_000
const progressOf = <T extends string> (clip: RunningClip<T> | null, now: number): ClipFrame<T> => {
  if (!clip) return { clip: null, t: 1 }
  const t = Math.max(0, Math.min(1, (now - clip.startedAt) / clip.duration))
  return t >= 1 ? { clip: null, t: 1 } : { clip: clip.name, t }
}

export class AccessoryMotion {
  reducedMotion = false
  private current: Accessories | null = null
  private plateClip: RunningClip<PlateClip> | null = null
  private tubeClip: RunningClip<'detach' | 'attach'> | null = null
  private filamentClip: RunningClip<'load' | 'unload'> | null = null
  private columnTween: ColumnTween | null = null
  private plateCargo = false
  private latestCarriesPrint = false
  private autoLoadChangedAt: number | null = null
  private crossfadeCount = 0

  get last (): Accessories | null {
    return this.current
  }

  set (next: Accessories, now: number, carriesPrint: boolean): void {
    const previous = this.current
    this.latestCarriesPrint = carriesPrint

    if (!previous) {
      this.current = { ...next }
      this.plateCargo = next.plateOn && carriesPrint
      return
    }

    const changesVisibility = previous.plateOn !== next.plateOn ||
      previous.tubeAttached !== next.tubeAttached ||
      previous.filamentLoaded !== next.filamentLoaded ||
      previous.column !== next.column

    if (this.reducedMotion) {
      this.plateClip = null
      this.tubeClip = null
      this.filamentClip = null
      this.columnTween = null
      if (changesVisibility) this.crossfadeCount++
    } else {
      if (previous.column !== next.column) this.columnTween = this.startColumn(previous.column, next.column, now)
      if (previous.plateOn !== next.plateOn) {
        if (previous.plateOn) {
          this.plateCargo = carriesPrint
          this.plateClip = this.startClip(
            this.plateClip,
            'remove',
            PLATE_REMOVE_MS,
            now
          )
        } else {
          const clip: PlateClip = this.plateCargo ? 'return-print' : 'return-empty'
          this.plateClip = this.startClip(
            this.plateClip,
            clip,
            this.plateCargo ? PLATE_RETURN_PRINT_MS : PLATE_RETURN_EMPTY_MS,
            now
          )
        }
      }
      if (previous.tubeAttached !== next.tubeAttached) {
        this.tubeClip = this.startClip(
          this.tubeClip,
          next.tubeAttached ? 'attach' : 'detach',
          next.tubeAttached ? TUBE_ATTACH_MS : TUBE_DETACH_MS,
          now
        )
      }
      if (previous.filamentLoaded !== next.filamentLoaded) {
        this.filamentClip = this.startClip(
          this.filamentClip,
          next.filamentLoaded ? 'load' : 'unload',
          next.filamentLoaded ? FILAMENT_LOAD_MS : FILAMENT_UNLOAD_MS,
          now
        )
      }
    }

    if (previous.autoLoad !== next.autoLoad) this.autoLoadChangedAt = now
    this.current = { ...next }
  }

  frame (now: number): AccessoryFrame {
    const state = this.current
    if (!state) {
      return {
        plate: { on: true, clip: null, t: 1, carriesPrint: false },
        tube: { attached: true, clip: null, t: 1, unlocking: false },
        filament: { loaded: false, clip: null, t: 1, autoLoad: 'idle', autoLoadAge: LARGE_AGE },
        column: { state: 'locked', level: 0, clip: null },
        spool: true,
        animating: false,
        crossfade: this.crossfadeCount
      }
    }

    if (this.reducedMotion) {
      this.plateClip = null
      this.tubeClip = null
      this.filamentClip = null
      this.columnTween = null
    }

    const column = this.columnAt(state.column, now)
    const plate = progressOf(this.plateClip, now)
    const tube = progressOf(this.tubeClip, now)
    const filament = progressOf(this.filamentClip, now)
    const autoLoadAge = this.autoLoadChangedAt === null
      ? LARGE_AGE
      : Math.max(0, now - this.autoLoadChangedAt)
    const autoLoadActive = this.autoLoadChangedAt !== null && autoLoadAge < AUTOLOAD_SETTLE_MS
    const animating = !this.reducedMotion && (
      plate.clip !== null ||
      tube.clip !== null ||
      filament.clip !== null ||
      column.clip !== null ||
      state.autoLoad === 'loading' ||
      autoLoadActive
    )

    return {
      plate: {
        on: state.plateOn,
        clip: plate.clip,
        t: plate.t,
        carriesPrint: plate.clip ? this.plateCargo : (state.plateOn ? this.latestCarriesPrint : this.plateCargo)
      },
      tube: { attached: state.tubeAttached, clip: tube.clip, t: tube.t, unlocking: state.tubeUnlocking },
      filament: {
        loaded: state.filamentLoaded,
        clip: filament.clip,
        t: filament.t,
        autoLoad: state.autoLoad,
        autoLoadAge
      },
      column,
      spool: state.spoolMounted,
      animating,
      crossfade: this.crossfadeCount
    }
  }

  /** The column from where it is drawn now to where `next` puts it, at a speed set by the way it goes. */
  private startColumn (previous: ColumnState, next: ColumnState, now: number): ColumnTween {
    const from = this.columnAt(previous, now).level
    const to = columnLevel(next)
    const out = to > from
    const clip: ColumnClip = out
      ? (to === 1 ? 'remove' : 'unlock')
      : (from > COLUMN_UNLOCKED_LEVEL + 1e-6 ? 'fit' : 'lock')
    const whole = out ? COLUMN_REMOVE_MS : COLUMN_FIT_MS
    return { from, to, startedAt: now, duration: Math.max(COLUMN_MIN_MS, whole * Math.abs(to - from)), clip }
  }

  private columnAt (state: ColumnState, now: number): AccessoryFrame['column'] {
    const tween = this.columnTween
    if (!tween) return { state, level: columnLevel(state), clip: null }
    const t = Math.max(0, Math.min(1, (now - tween.startedAt) / tween.duration))
    if (t >= 1) return { state, level: tween.to, clip: null }
    return { state, level: tween.from + (tween.to - tween.from) * easeInOut(t), clip: tween.clip }
  }

  private startClip<T extends string> (
    oldClip: RunningClip<T> | null,
    name: T,
    duration: number,
    now: number
  ): RunningClip<T> {
    const oldFrame = progressOf(oldClip, now)
    const progress = oldFrame.clip ? 1 - oldFrame.t : 0
    return { name, duration, startedAt: now - progress * duration }
  }
}
