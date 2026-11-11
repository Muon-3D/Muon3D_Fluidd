/**
 * How the Overview's Trackpad moves the head: "On release" (the default) is
 * one planned move, sent when the pointer lifts; "Live" is the head following
 * the pointer while it is down.
 *
 * Live needs the printer's own jog stream (Klipper MUON_JOG, PR 125), which
 * is held for motion review, so it is off for now: the choice is shown, can
 * not be picked, and a remembered "live" is ignored. It is never done by
 * sending a run of G1 moves. Flip `TRACKPAD_LIVE_AVAILABLE` when it ships.
 */
export type TrackpadMode = 'release' | 'live'

export const TRACKPAD_LIVE_AVAILABLE = false
export const TRACKPAD_LIVE_REASON = 'Live moving arrives with a printer update'
export const TRACKPAD_MODE_KEY = 'm3d.trackpad.mode'

type Store = Pick<Storage, 'getItem' | 'setItem'>

const browserStore = (): Store | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

/** What was last chosen on this device (the person's own choice), 'release' when nothing or nothing usable. */
export function readTrackpadMode (store: Store | null = browserStore(), liveAvailable = TRACKPAD_LIVE_AVAILABLE): TrackpadMode {
  try {
    return liveAvailable && store?.getItem(TRACKPAD_MODE_KEY) === 'live' ? 'live' : 'release'
  } catch { return 'release' }
}

export function writeTrackpadMode (mode: TrackpadMode, store: Store | null = browserStore(), liveAvailable = TRACKPAD_LIVE_AVAILABLE): TrackpadMode {
  const next: TrackpadMode = mode === 'live' && liveAvailable ? 'live' : 'release'
  try { store?.setItem(TRACKPAD_MODE_KEY, next) } catch { /* private window: the choice lasts for this page only */ }
  return next
}
