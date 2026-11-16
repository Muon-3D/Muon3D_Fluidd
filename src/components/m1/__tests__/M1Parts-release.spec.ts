import { afterEach, describe, expect, it, vi } from 'vitest'
import M1Parts from '../M1Parts.vue'
import { DragFollow } from '@/services/control/drag-follow'
import { JogStream } from '@/services/control/jog-stream'

/**
 * A release uses the drag's mover; cancel never starts another move.
 * The real methods run against a plain stand-in for the component.
 */
type Methods = Record<string, (...args: unknown[]) => unknown>
const methods = (M1Parts as unknown as { options: { methods: Methods } }).options.methods
const computed = (M1Parts as unknown as { options: { computed: Record<string, { get: (this: unknown) => unknown }> } }).options.computed

afterEach(() => { vi.useRealTimers() })

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
    followPrinter: null,
    jogStreams: false,
    jogStatus: { active: false, reason: '', sessions: 0 },
    $store: { state: { printer: { printer: { gcode_move: { gcode_position: [118, 80, 10] } } } } },
    xySpeed: 20,
    zSpeed: 10,
    controlReady: true,
    printerPrinting: false,
    printerPaused: false,
    isHomed: () => true,
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
    moveRefusal: () => '',
    sendGcode: vi.fn(),
    ...over
  }
  for (const name of ['release', 'onCancel', 'onUp', 'onDown', 'cancelFollow', 'createMover', 'startMover', 'placeFor', 'atStart', 'jogRefusal', 'onFollowRefused', 'onJogStreamsChanged', 'onMovable']) c[name] = methods[name].bind(c)
  Object.defineProperty(c, 'mover', { get: () => computed.mover.get.call(c) })
  ;(c.createMover as () => void)()
  return c as Record<string, unknown> & {
    moveTo: ReturnType<typeof vi.fn>, viewer: ReturnType<typeof viewer>, drag: unknown, refused: string, dragPointer: number | null,
    release: () => void, onCancel: () => void, onUp: (e: PointerEvent) => void, onDown: (e: PointerEvent) => void
  }
}

const up = (over: Partial<PointerEvent> = {}) => ({ pointerId: 7, button: 0, clientX: 50, clientY: 50, ...over }) as PointerEvent

describe('a part release uses its mover, and other endings cancel', () => {
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

  it.each([false, true])('has one mover, using only the selected send path (stream=%s)', stream => {
    const c = ctx({ jogStreams: stream })
    const first = c.mover
    expect((c.createMover as () => unknown)()).toBe(first)
    expect(c.mover).toBeInstanceOf(stream ? JogStream : DragFollow)
    c.release()
    if (stream) {
      expect(c.sendGcode).toHaveBeenCalledTimes(2)
      expect(c.sendGcode).toHaveBeenLastCalledWith('MUON_JOG X=120 Y=80 SPEED=20 FINAL=1')
      expect(c.moveTo).not.toHaveBeenCalled()
    } else {
      expect(c.moveTo).toHaveBeenCalledTimes(1)
      expect(c.sendGcode).not.toHaveBeenCalled()
    }
  })

  it('cancels and removes the active mover when the firmware capability changes', () => {
    const c = ctx({ jogStreams: true })
    const old = c.mover as JogStream
    old.start({ Z: 20 }, { active: false, reason: '', sessions: 0 })
    c.jogStreams = false
    ;(c.onJogStreamsChanged as () => void)()
    expect(old.following).toBe(false)
    expect(c.sendGcode).toHaveBeenLastCalledWith('MUON_JOG STOP=1')
    expect(c.mover).toBeUndefined()
    expect((c.createMover as () => unknown)()).toBeInstanceOf(DragFollow)
  })

  it.each([
    { controlReady: false }, { printerPrinting: true }, { printerPaused: true },
    { isHomed: () => false }, { xySpeed: 0 }, { zSpeed: NaN }
  ])('refuses a streamed drag when a control gate is lost: %o', gate => {
    const c = ctx({ jogStreams: true, ...gate })
    c.release()
    expect(c.sendGcode).not.toHaveBeenCalled()
    expect(c.moveTo).not.toHaveBeenCalled()
    expect(c.refused).toMatch(/^Not moved: /)
  })

  it.each([NaN, -1, 251])('refuses an invalid streamed target: %s', x => {
    const c = ctx({ jogStreams: true })
    ;(c.mover as JogStream).start({ X: x, Y: 80 })
    expect(c.sendGcode).not.toHaveBeenCalled()
    expect(c.refused).toContain('outside the machine')
  })

  it('does not send a queued stream or STOP to a different printer', () => {
    vi.useFakeTimers()
    const c = ctx({ jogStreams: true })
    c.followPrinter = 'boxwood'
    ;(c.mover as JogStream).start({ Z: 20 })
    c.panelTarget = 'sloe'
    vi.advanceTimersByTime(200)
    expect(c.sendGcode).toHaveBeenCalledTimes(1)
    expect(c.refused).toContain('printer changed')
  })

  it.each([false, true])('cancels the old drag when another movable part is selected (stream=%s)', stream => {
    const c = ctx({ jogStreams: stream })
    const mover = c.mover as DragFollow | JogStream
    mover.start({ X: 120, Y: 80 })
    expect(mover.following).toBe(true)
    c.movable = 'plate'
    ;(c.onMovable as (part: string) => void)('plate')
    expect(mover.following).toBe(false)
    expect(c.mover).toBeUndefined()
    expect(c.drag).toBeNull()
  })
})
