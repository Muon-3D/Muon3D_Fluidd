/**
 * The 3D view's frame requests. A frame is only asked for while the view's
 * gate is open (render-gate.ts: switched on, tab visible, canvas on screen);
 * closing the gate cancels the one in flight, and a callback that still
 * arrives after it closed draws nothing. Pure of three.js so it is testable.
 */
export interface FrameLoop {
  /** Asks for a frame, unless one is asked for, the gate is shut or the loop is stopped. */
  invalidate: () => void;
  /** The gate changed: open asks for a frame, shut cancels the pending one. */
  setOpen: (open: boolean) => void;
  /** Stops for good. */
  stop: () => void;
  readonly pending: boolean;
}

export interface FrameClock {
  request: (cb: (now: number) => void) => number;
  cancel: (id: number) => void;
}

export function createFrameLoop (
  draw: (now: number) => void,
  clock: FrameClock = { request: cb => requestAnimationFrame(cb), cancel: id => cancelAnimationFrame(id) }
): FrameLoop {
  let open = true
  let stopped = false
  let id = 0
  const tick = (now: number) => {
    id = 0
    if (stopped || !open) return
    draw(now)
  }
  const loop: FrameLoop = {
    invalidate () {
      if (id || stopped || !open) return
      id = clock.request(tick)
    },
    setOpen (next) {
      open = next
      if (open) {
        loop.invalidate()
      } else if (id) {
        clock.cancel(id)
        id = 0
      }
    },
    stop () {
      stopped = true
      if (id) clock.cancel(id)
      id = 0
    },
    get pending () {
      return id !== 0
    }
  }
  return loop
}
