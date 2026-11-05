/**
 * The glass plate of the accurate M1 is transmissive: three draws the whole
 * opaque scene a second time into a render target for it. That is cheap on a
 * desktop GPU and costs a phone half its frame rate, so a small or weak
 * screen, or one measured to be slow, gets a plain transparent plate instead
 * (one draw). Pure of three.js so it is testable.
 */
export interface DeviceHints {
  /** The canvas width, CSS pixels. */
  width: number;
  cores?: number;
  /** navigator.deviceMemory, GB. */
  memory?: number;
  /** The browser asked to save data. */
  saveData?: boolean;
}

/** Below this canvas width the screen is a phone's. */
export const SMALL_SCREEN_PX = 600

export function wantsCheapGlass (d: DeviceHints): boolean {
  if (d.width > 0 && d.width < SMALL_SCREEN_PX) return true
  if (d.saveData) return true
  if (d.memory !== undefined && d.memory <= 2) return true
  if (d.cores !== undefined && d.cores <= 2) return true
  // Four cores and four gigabytes: a phone or a low-end tablet, wherever its screen is as wide as a desktop's.
  if (d.cores !== undefined && d.cores <= 4 && d.memory !== undefined && d.memory <= 4) return true
  return false
}

/** Frames this far apart (ms), the median of the last window, count as slow: under about 20 a second. */
export const SLOW_FRAME_MS = 50
const WINDOW = 24

/** Watches the time between frames drawn back to back; says when the view is too slow for the glass. */
export class FrameWatch {
  private samples: number[] = []
  private last = 0

  /** A frame was drawn at `now`; a gap over `idleMs` means the view was idle and is not counted. */
  push (now: number, idleMs = 250): void {
    if (this.last && now - this.last < idleMs) {
      this.samples.push(now - this.last)
      if (this.samples.length > WINDOW) this.samples.shift()
    }
    this.last = now
  }

  /** Whether the last full window of frames had a slow median. */
  get slow (): boolean {
    if (this.samples.length < WINDOW) return false
    const sorted = [...this.samples].sort((a, b) => a - b)
    return sorted[sorted.length >> 1] > SLOW_FRAME_MS
  }
}
