import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JogStream, jogCommand, type JogStatus } from '../jog-stream'
import type { DragTarget } from '../drag-follow'

function host () {
  const h = {
    sent: [] as string[],
    refuse: ((): string => '') as (t: DragTarget) => string,
    ok: true
  }
  return {
    h,
    api: {
      refusal: (t: DragTarget) => h.refuse(t),
      send: (s: string) => { if (h.ok) h.sent.push(s); return h.ok },
      speed: (axes: 'XY' | 'Z') => axes === 'Z' ? 10 : 50
    }
  }
}
const idle: JogStatus = { active: false, reason: '', sessions: 3 }

describe('JogStream', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0) })
  afterEach(() => { vi.useRealTimers() })

  it('writes MUON_JOG for the head or the plate', () => {
    expect(jogCommand({ Z: 12.3456 }, 10)).toBe('MUON_JOG Z=12.346 SPEED=10')
    expect(jogCommand({ X: 1, Y: -2 }, 50, true)).toBe('MUON_JOG X=1 Y=-2 SPEED=50 FINAL=1')
  })

  it('sends the first target at once, then the newest at most every 100 ms, nothing waiting to land', () => {
    const { h, api } = host()
    const s = new JogStream(api)
    s.start({ Z: 11 }, idle)
    expect(h.sent).toEqual(['MUON_JOG Z=11 SPEED=10'])
    for (let z = 12; z <= 20; z++) { vi.advanceTimersByTime(20); s.update({ Z: z }) }
    // 180 ms of updates: one more send at 100 ms, the newest then.
    expect(h.sent).toEqual(['MUON_JOG Z=11 SPEED=10', 'MUON_JOG Z=15 SPEED=10'])
    vi.advanceTimersByTime(100)
    expect(h.sent[h.sent.length - 1]).toBe('MUON_JOG Z=20 SPEED=10')
  })

  it('a reversal is sent at once, not after the interval', () => {
    const { h, api } = host()
    const s = new JogStream(api)
    s.start({ Z: 10 }, idle)
    vi.advanceTimersByTime(100)
    s.update({ Z: 30 })
    expect(h.sent).toHaveLength(2)
    vi.advanceTimersByTime(10)
    s.update({ Z: 25 })
    expect(h.sent).toEqual(['MUON_JOG Z=10 SPEED=10', 'MUON_JOG Z=30 SPEED=10', 'MUON_JOG Z=25 SPEED=10'])
  })

  it('a pointer held still keeps the jog alive every 200 ms; release sends FINAL=1 and stops', () => {
    const { h, api } = host()
    const s = new JogStream(api)
    s.start({ X: 50, Y: 60 }, idle)
    vi.advanceTimersByTime(650)
    expect(h.sent).toHaveLength(4)
    expect(new Set(h.sent)).toEqual(new Set(['MUON_JOG X=50 Y=60 SPEED=50']))
    s.release()
    expect(h.sent[h.sent.length - 1]).toBe('MUON_JOG X=50 Y=60 SPEED=50 FINAL=1')
    expect(s.following).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(h.sent).toHaveLength(5)
  })

  it('cancel sends STOP=1 once and nothing after', () => {
    const { h, api } = host()
    const s = new JogStream(api)
    s.start({ Z: 10 }, idle)
    s.cancel()
    s.cancel()
    vi.advanceTimersByTime(1000)
    expect(h.sent).toEqual(['MUON_JOG Z=10 SPEED=10', 'MUON_JOG STOP=1'])
  })

  it('a refusal before sending stops the drag and says why; nothing is sent', () => {
    const { h, api } = host()
    h.refuse = () => 'Home it first.'
    const reasons: string[] = []
    const s = new JogStream(api, { onRefused: r => reasons.push(r) })
    s.start({ Z: 10 }, idle)
    expect(h.sent).toEqual([])
    expect(reasons).toEqual(['Home it first.'])
    expect(s.following).toBe(false)
  })

  it('the printer ending this drag\'s jog (the contact guard, the notch) stops it with the printer\'s reason', () => {
    const { h, api } = host()
    const reasons: string[] = []
    const s = new JogStream(api, { onRefused: r => reasons.push(r) })
    s.start({ X: 10, Y: 10 }, idle)
    // The last jog's end, before this one starts, is not this drag's.
    s.observe({ active: false, reason: 'refused: old', sessions: 3 })
    expect(s.following).toBe(true)
    s.observe({ active: true, reason: '', sessions: 4 })
    s.observe({ active: false, reason: 'refused: Nozzle is touching the plate: lift Z before moving X or Y', sessions: 4 })
    expect(s.following).toBe(false)
    expect(reasons).toEqual(['the printer stopped the drag: refused: Nozzle is touching the plate: lift Z before moving X or Y'])
    vi.advanceTimersByTime(1000)
    expect(h.sent).toHaveLength(1)
  })

  it('a send that fails stops following', () => {
    const { h, api } = host()
    h.ok = false
    const reasons: string[] = []
    const s = new JogStream(api, { onRefused: r => reasons.push(r) })
    s.start({ Z: 10 }, idle)
    expect(s.following).toBe(false)
    expect(reasons).toEqual(['The move was not sent.'])
  })
})
