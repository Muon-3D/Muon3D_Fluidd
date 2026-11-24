import { describe, expect, it } from 'vitest'
import { CONNECT_GIVE_UP_S, ENTRY_MARK, FirstPaint, GIVE_UP_S, LEAD, LOGO_S, SETTLE_S, STAGES, readStartup, rimTarget, type StartupFacts } from '../progress'

const facts = (over: Partial<StartupFacts> = {}): StartupFacts => ({
  loaderMark: ENTRY_MARK, routerReady: true, screen: null, socketOpen: true, klippyState: 'ready', klippyConnected: true, socketReady: true, ...over
})
const connecting = facts({ screen: 'connecting', socketOpen: false, klippyState: '', klippyConnected: false, socketReady: false })
const asking = facts({ klippyState: '', klippyConnected: false, socketReady: false })
const klipperStarting = facts({ klippyState: 'startup', klippyConnected: false, socketReady: false })
const loadingPrinter = facts({ socketReady: false })
const up = facts()

describe('what the rim follows: the real start-up steps', () => {
  it('walks the steps in order, each a real state', () => {
    const names = [
      readStartup(facts({ routerReady: false, loaderMark: 0.15 })),
      readStartup(connecting),
      readStartup(asking),
      readStartup(klipperStarting),
      readStartup(loadingPrinter),
      readStartup(up)
    ].map(r => r.label)
    expect(names).toEqual([STAGES[0], STAGES[1], 'Asking the printer', STAGES[2], STAGES[3], STAGES[3]])
  })

  it('never says Starting Klipper before the printer has said it is starting', () => {
    expect(readStartup(asking).label).not.toMatch(/Klipper/)
    expect(readStartup(klipperStarting).label).toBe('Starting Klipper')
  })

  it('the rim target only ever goes up through a normal start', () => {
    const targets = [
      facts({ routerReady: false, loaderMark: 0 }),
      facts({ routerReady: false, loaderMark: 0.15 }),
      facts({ routerReady: false, loaderMark: 0.5 }),
      facts({ routerReady: false, loaderMark: ENTRY_MARK }),
      connecting, klipperStarting, loadingPrinter, up
    ].map(f => rimTarget(readStartup(f)))
    expect(targets).toEqual([...targets].sort((a, b) => a - b))
    expect(targets[0]).toBe(0)
    expect(targets[targets.length - 1]).toBe(1)
    expect(new Set(targets).size).toBeGreaterThanOrEqual(7)
  })

  it("inside the first step it follows the loader's own marks, and stays short of the next step", () => {
    const at = (loaderMark: number) => rimTarget(readStartup(facts({ routerReady: false, loaderMark })))
    expect(at(0.15)).toBeLessThan(at(0.5))
    expect(at(0.5)).toBeLessThan(at(ENTRY_MARK))
    expect(at(ENTRY_MARK)).toBeLessThan(0.25)
    expect(at(2)).toBeLessThan(0.25)
  })

  it('hands over, rather than waiting, when there is nothing of a printer start-up to wait for', () => {
    expect(readStartup(facts({ screen: 'unreachable', socketOpen: false })).outcome).toBe('handover')
    expect(readStartup(facts({ screen: 'updating', socketOpen: false })).outcome).toBe('handover')
    expect(readStartup(facts({ screen: 'updating-late', socketOpen: false })).outcome).toBe('handover')
    // A page with no socket: setup, sign-in, Printers, the login.
    expect(readStartup(facts({ socketOpen: false })).outcome).toBe('handover')
    // Klipper has failed: the page says what.
    expect(readStartup(facts({ klippyState: 'shutdown', socketReady: false })).outcome).toBe('handover')
    expect(readStartup(facts({ klippyState: 'error', socketReady: false })).outcome).toBe('handover')
  })

  it('is ready only with Klipper ready and the first state in', () => {
    expect(readStartup(loadingPrinter).outcome).toBe('waiting')
    expect(readStartup(facts({ klippyConnected: false, socketReady: true })).outcome).toBe('waiting')
    expect(readStartup(up).outcome).toBe('ready')
  })
})

describe('the picture over time', () => {
  it('fills toward the real step and stops there when start-up stalls; the comet keeps lapping', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(klipperStarting, 0.2)
    let last = p.frame(0.2)
    const heads = new Set<number>()
    for (let t = 0.25; t <= 6; t += 0.05) {
      last = p.frame(t)
      heads.add(Math.round(last.head * 100))
    }
    // Stuck at Starting Klipper: half way, and it does not creep on.
    expect(last.target).toBe(0.5)
    expect(last.rim).toBeCloseTo(0.5, 2)
    expect(last.rim).toBeLessThanOrEqual(0.5)
    expect(last.label).toBe('Starting Klipper')
    expect(last.done).toBe(false)
    expect(heads.size).toBeGreaterThan(20)
    // Later steps are only reached when facts say so.
    p.update(loadingPrinter, 6.1)
    expect(p.frame(6.1).target).toBe(0.75)
  })

  it('eases toward its target; it never jumps ahead of it', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(loadingPrinter, 0)
    let prev = 0
    for (let t = 0.05; t < 1.5; t += 0.05) {
      const f = p.frame(t)
      expect(f.rim).toBeGreaterThanOrEqual(prev)
      expect(f.rim).toBeLessThanOrEqual(0.75 + 1e-9)
      prev = f.rim
    }
    expect(prev).toBeGreaterThan(0.7)
  })

  it('a fast start still gives the wordmark its full time', () => {
    const p = new FirstPaint(10, { loaderMark: ENTRY_MARK })
    p.update(up, 10.3)
    const logoEnd = LEAD + LOGO_S
    for (let t = 10.3; t < 10 + logoEnd; t += 0.1) {
      const f = p.frame(t)
      expect(f.done).toBe(false)
      expect(f.label).toBe('Nearly there')
      expect(f.rim).toBe(1)
      expect(f.fin).toBe(-1)
    }
    // The sweep begins SETTLE_S after the logo is finished, then it leaves.
    expect(p.frame(10 + logoEnd + SETTLE_S - 0.01).fin).toBe(-1)
    const sweeping = p.frame(10 + logoEnd + SETTLE_S + 0.3)
    expect(sweeping.fin).toBeGreaterThan(0)
    expect(sweeping.label).toBe('Ready')
    expect(sweeping.done).toBe(false)
    expect(p.frame(10 + logoEnd + SETTLE_S + 1).done).toBe(true)
  })

  it('a slow start waits for the printer, not for the logo', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(klipperStarting, 0.1)
    expect(p.frame(8).done).toBe(false)
    p.update(up, 8)
    // The logo finished long ago: the sweep starts SETTLE_S after the start-up is done.
    expect(p.frame(8.1).fin).toBe(-1)
    expect(p.frame(8 + SETTLE_S + 0.3).fin).toBeGreaterThan(0)
    expect(p.frame(9.2).done).toBe(true)
  })

  it('leaves at once when it can only hand over', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(facts({ screen: 'unreachable', socketOpen: false }), 0.5)
    const f = p.frame(0.5)
    expect(f.done).toBe(true)
    expect(f.outcome).toBe('handover')
  })

  it('never holds the page past the give-up time', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(klipperStarting, 0.1)
    expect(p.frame(GIVE_UP_S - 0.5).done).toBe(false)
    const f = p.frame(GIVE_UP_S + 0.1)
    expect(f.done).toBe(true)
    expect(f.outcome).toBe('handover')
  })

  it('hands a printer that will not connect to the connecting screen sooner', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(connecting, 1)
    expect(p.frame(1 + CONNECT_GIVE_UP_S - 0.5).done).toBe(false)
    expect(p.frame(1 + CONNECT_GIVE_UP_S + 0.1).done).toBe(true)
  })

  it('a late wordmark (the font) keeps its full time from when it starts', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.startLogo(1)
    p.update(up, 1.1)
    expect(p.frame(1 + LEAD + LOGO_S - 0.1).done).toBe(false)
    expect(p.frame(1 + LEAD + LOGO_S - 0.1).logoT).toBeCloseTo(LEAD + LOGO_S - 0.1, 5)
    expect(p.frame(1 + LEAD + LOGO_S + SETTLE_S + 1).done).toBe(true)
  })

  it('keeps its first outcome: a later fact does not reopen a settled start', () => {
    const p = new FirstPaint(0, { loaderMark: ENTRY_MARK })
    p.update(up, 0.1)
    p.update(connecting, 0.2)
    expect(p.frame(0.3).outcome).toBe('ready')
  })
})

describe('reduced motion', () => {
  it('is still: no comet, no easing, and no waiting for the logo', () => {
    const p = new FirstPaint(0, { reduced: true, loaderMark: ENTRY_MARK })
    p.update(klipperStarting, 0.1)
    const a = p.frame(0.2)
    const b = p.frame(1.7)
    expect(a.head).toBe(-1)
    expect(b.head).toBe(-1)
    expect(a.rim).toBe(0.5)
    expect(b.rim).toBe(0.5)
    expect({ ...a, t: 0, logoT: 0 }).toEqual({ ...b, t: 0, logoT: 0 })
    p.update(up, 2)
    const f = p.frame(2)
    expect(f.rim).toBe(1)
    expect(f.fin).toBe(-1)
    expect(f.label).toBe('Ready')
    expect(f.done).toBe(true)
  })
})
