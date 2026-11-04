/**
 * Whether the 3D view should draw at all: it is switched on, the tab is
 * visible and the canvas is on screen. Pure of three.js so it is testable;
 * the viewer cancels its frame request when this turns false and asks for
 * one when it turns true.
 */
export interface RenderGate {
  /** Switched on by the page (e.g. a parked view is off). */
  setActive: (on: boolean) => void;
  readonly open: boolean;
  dispose: () => void;
}

export function createRenderGate (
  canvas: Element,
  onChange: (open: boolean) => void,
  doc: Document = document
): RenderGate {
  let active = true
  let onScreen = true
  let open = true
  const update = () => {
    const next = active && onScreen && doc.visibilityState !== 'hidden'
    if (next === open) return
    open = next
    onChange(open)
  }
  const onVisibility = () => update()
  doc.addEventListener('visibilitychange', onVisibility)
  let observer: IntersectionObserver | null = null
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      const last = entries[entries.length - 1]
      if (!last) return
      onScreen = last.isIntersecting
      update()
    })
    observer.observe(canvas)
  }
  update()
  return {
    setActive (on) {
      active = on
      update()
    },
    get open () {
      return open
    },
    dispose () {
      doc.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
    }
  }
}
