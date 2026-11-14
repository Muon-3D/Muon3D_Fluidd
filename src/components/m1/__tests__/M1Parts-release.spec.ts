import { describe, expect, it, vi } from 'vitest'
import M1Parts from '../M1Parts.vue'

/**
 * Dragging a part sends nothing while the pointer is down. Letting go sends the target once, through moveTo; every other
 * way a drag can end (cancel, a lost capture, another button, another finger, another printer, the part no longer
 * movable) sends none. The real methods run against a plain stand-in for the component.
 */
type Methods = Record<string, (...args: unknown[]) => unknown>
const methods = (M1Parts as unknown as { options: { methods: Methods } }).options.methods

const viewer = () => ({ setOrbit: vi.fn(), holdPan: vi.fn(), pick: vi.fn(() => null), knobAt: vi.fn(() => false), pressKnob: vi.fn() })

function ctx (over: Record<string, unknown> = {}) {
  const c: Record<string, unknown> = {
    viewer: viewer(),
    down: { x: 10, y: 10 },
    dragged: true,
    drag: { part: 'toolhead', printer: 'boxwood', target: { X: 120, Y: 80 } },
    dragPx: { from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
    dragPointer: 7,
    movable: 'toolhead',
    panelTarget: 'boxwood',
    gcodeOffset: [0, 0, 0],
    axisMin: [0, 0, 0],
    axisMax: [250, 250, 250],
    cameraLocked: false,
    screenOpen: false,
    selected: 'toolhead',
    refused: '',
    handMoveWait: () => '',
    refusalFor: () => 'that is outside what the printer can reach.',
    moveTo: vi.fn(() => true),
    ...over
  }
  for (const name of ['release', 'onCancel', 'onUp', 'onDown']) c[name] = methods[name].bind(c)
  return c as Record<string, unknown> & {
    moveTo: ReturnType<typeof vi.fn>, viewer: ReturnType<typeof viewer>, drag: unknown, refused: string, dragPointer: number | null,
    release: () => void, onCancel: () => void, onUp: (e: PointerEvent) => void, onDown: (e: PointerEvent) => void
  }
}

const up = (over: Partial<PointerEvent> = {}) => ({ pointerId: 7, button: 0, clientX: 50, clientY: 50, ...over }) as PointerEvent

describe('a part drag sends one move on release, and none otherwise', () => {
  it('release sends the target once, in G-code coordinates', () => {
    const c = ctx({ gcodeOffset: [5, 0, 0] })
    c.release()
    expect(c.moveTo).toHaveBeenCalledTimes(1)
    expect(c.moveTo).toHaveBeenCalledWith({ X: 115, Y: 80 })
    expect(c.drag).toBeNull()
  })

  it('release says why when the move was refused, and still sends only the one', () => {
    const c = ctx({ moveTo: vi.fn(() => false) })
    c.release()
    expect(c.moveTo).toHaveBeenCalledTimes(1)
    expect(c.refused).toMatch(/^Not moved: /)
  })

  it('release with no drag sends nothing', () => {
    const c = ctx({ drag: null })
    c.release()
    expect(c.moveTo).not.toHaveBeenCalled()
  })

  it('release for a part that can no longer be moved sends nothing', () => {
    const c = ctx({ movable: null })
    c.release()
    expect(c.moveTo).not.toHaveBeenCalled()
  })

  it('release after the printer changed sends nothing', () => {
    const c = ctx({ panelTarget: 'sloe' })
    c.release()
    expect(c.moveTo).not.toHaveBeenCalled()
  })

  it('the pointer coming up on the dragging pointer sends one move and lets the camera follow again', () => {
    const c = ctx()
    c.onUp(up())
    expect(c.moveTo).toHaveBeenCalledTimes(1)
    expect(c.viewer.holdPan).toHaveBeenLastCalledWith(false)
    expect(c.dragPointer).toBeNull()
  })

  it('another pointer, or another button, coming up cancels the drag and sends nothing', () => {
    for (const e of [up({ pointerId: 9 }), up({ button: 2 })]) {
      const c = ctx()
      c.onUp(e)
      expect(c.moveTo).not.toHaveBeenCalled()
      expect(c.drag).toBeNull()
    }
  })

  it('a cancel (a touch that became a scroll, a capture lost) sends nothing and lets the camera go', () => {
    const c = ctx()
    c.onCancel()
    expect(c.moveTo).not.toHaveBeenCalled()
    expect(c.drag).toBeNull()
    expect(c.dragPointer).toBeNull()
    expect(c.viewer.holdPan).toHaveBeenLastCalledWith(false)
  })

  it('a second finger or a new press during a drag cancels it and sends nothing', () => {
    const c = ctx()
    c.onDown({ clientX: 5, clientY: 5, button: 0, isPrimary: false, pointerId: 8 } as PointerEvent)
    expect(c.moveTo).not.toHaveBeenCalled()
    expect(c.drag).toBeNull()
  })

  it('a press that starts a drag holds the camera, and sends nothing', () => {
    const c = ctx({ drag: null, dragPointer: null, down: null })
    ;(c.viewer.pick as ReturnType<typeof vi.fn>).mockReturnValue('toolhead')
    c.onDown({ clientX: 5, clientY: 5, button: 0, isPrimary: true, pointerId: 7 } as PointerEvent)
    expect(c.viewer.holdPan).toHaveBeenCalledWith(true)
    expect(c.moveTo).not.toHaveBeenCalled()
  })
})
