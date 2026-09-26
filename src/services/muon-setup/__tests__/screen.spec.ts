import { describe, expect, it } from 'vitest'
import { joinFinished, progressFor, screenFor } from '../screen'
import type { SetupLocal } from '../state'
import type { SetupResult, SetupState } from '../types'
import newState from './fixtures/state.01-new.json'
import networkPhone from './fixtures/state.02-network-phone-driver.json'
import joiningState from './fixtures/state.04-joining.json'
import regionConfirm from './fixtures/state.04b-region-confirm.json'
import regionApply from './fixtures/state.04c-region-apply.json'
import regionApplyFailed from './fixtures/state.04d-region-apply-failed.json'
import wrongPassword from './fixtures/state.05-network-wrong-password.json'
import linkCode from './fixtures/state.06-remote-link-code.json'
import readySelfTest from './fixtures/state.07-ready-self-test.json'
import completeWithSkips from './fixtures/state.08-complete-with-skips.json'
import staleRev from './fixtures/result.stale-rev.json'

/** The phone that holds the driver in the fixtures. */
const PHONE = '5b1f0c7e-9f7a-4f5e-8f0a-2d6f3c1a9b10'

const local = (patch: Partial<SetupLocal> = {}): SetupLocal => ({
  clientId: PHONE,
  droveSetup: false,
  changingWifi: false,
  joinRev: null,
  ...patch
})

const state = (fixture: unknown, patch: (s: SetupState) => void = () => {}): SetupState => {
  const copy = JSON.parse(JSON.stringify(fixture)) as SetupState
  patch(copy)
  return copy
}

/** The rev this tab held when it pressed Connect on 02. */
const CONNECT_REV = (networkPhone as unknown as SetupState).rev

describe('screenFor', () => {
  it('S0 until the printer has answered', () => {
    expect(screenFor(null, local())).toBe('S0')
  })

  it('S1 on a new printer, before this page has claimed the driver', () => {
    expect(screenFor(state(newState), local())).toBe('S1')
  })

  it('S1 when another phone holds the driver', () => {
    expect(screenFor(state(networkPhone), local({ clientId: 'another-tab' }))).toBe('S1')
  })

  it('S3 at the network step, once this page drives', () => {
    expect(screenFor(state(networkPhone), local())).toBe('S3')
  })

  it.each([
    ['a join', joiningState],
    ['a region apply (04c)', regionApply]
  ])('S4 during %s, whoever drives', (_name, fixture) => {
    expect(screenFor(state(fixture), local())).toBe('S4')
    expect(screenFor(state(fixture), local({ clientId: 'another-tab' }))).toBe('S4')
  })

  describe('the region line (rule 7, 04b and 04d)', () => {
    it('S4r once joined, while the region waits for Confirm or Change (04b)', () => {
      expect(screenFor(state(regionConfirm), local())).toBe('S4r')
    })

    it('S4r on every phone tab, not only the one that joined', () => {
      const other = state(regionConfirm, s => {
        if (s.driver) s.driver.client_id = 'another-tab'
      })
      expect(screenFor(other, local({ clientId: 'another-tab' }))).toBe('S4r')
    })

    it('S4r again after a failed apply, which carries region_error (04d)', () => {
      const failed = state(regionApplyFailed)
      expect(failed.steps.network.region_error?.code).toBe('region_apply_failed')
      expect(screenFor(failed, local())).toBe('S4r')
    })

    it('S3 once the region is confirmed, if the cursor is still on network', () => {
      expect(screenFor(state(regionConfirm, s => { s.steps.network.region_confirmed = true }), local())).toBe('S3')
    })

    it('S9, not the line, while the panel drives (it shows P7a)', () => {
      const panel = state(regionConfirm, s => {
        s.driver = { kind: 'panel', client_id: 'panel', since: 1, renewed: 2, lapsed: false }
      })
      expect(screenFor(panel, local())).toBe('S9')
    })
  })

  describe("this tab's join result (rule 5, joinRev)", () => {
    it('S4r for a failed join started here, from a later state with no op', () => {
      expect(screenFor(state(wrongPassword), local({ joinRev: CONNECT_REV }))).toBe('S4r')
    })

    it('S3 for the same failure without a join of its own to report', () => {
      expect(screenFor(state(wrongPassword), local())).toBe('S3')
    })

    it('not for a result no later than the Connect', () => {
      const failure = state(wrongPassword)
      expect(screenFor(failure, local({ joinRev: failure.rev }))).toBe('S3')
    })

    it('S4r for a success the cursor has already moved past, as in a locked market', () => {
      const moved = state(linkCode, s => {
        s.cursor = 'name'
        s.steps.remote.mode = null
      })
      expect(screenFor(moved, local({ joinRev: CONNECT_REV }))).toBe('S4r')
      expect(screenFor(moved, local())).toBe('S5')
    })

    it('treats an address or an error as finished, not status == done', () => {
      expect(joinFinished(state(regionConfirm))).toBe(true)
      expect(state(regionConfirm).steps.network.status).toBe('pending')
      expect(joinFinished(state(wrongPassword))).toBe(true)
      expect(joinFinished(state(networkPhone))).toBe(false)
    })
  })

  it.each(['name', 'update', 'remote'] as const)('S5 with the cursor on %s', (cursor) => {
    const s = state(networkPhone, x => {
      x.cursor = cursor
      x.steps.network.status = 'done'
    })
    expect(screenFor(s, local())).toBe('S5')
  })

  it('S5u while an update installs', () => {
    const s = state(linkCode, x => {
      x.cursor = 'update'
      x.op = { kind: 'update_install', id: 'op_9', started: 1790251400, progress: 0.4, target: '1.4.0' }
    })
    expect(screenFor(s, local())).toBe('S5u')
  })

  it('S6 while a link code is live, and S5 once remote is done', () => {
    expect(screenFor(state(linkCode), local())).toBe('S6')
    expect(screenFor(state(linkCode, s => { s.steps.remote.status = 'done' }), local())).toBe('S5')
  })

  it('S6 after stale_rev, from the state the refusal carries', () => {
    const result = staleRev as unknown as SetupResult
    expect(result.error?.code).toBe('stale_rev')
    expect(screenFor(result.state, local())).toBe('S6')
  })

  it('S7 at the ready step, once this page drives', () => {
    const s = state(readySelfTest, x => {
      x.op = null
      x.driver = { kind: 'phone', client_id: PHONE, since: 1, renewed: 2, lapsed: false }
    })
    expect(screenFor(s, local())).toBe('S7')
  })

  it('S8 at finish', () => {
    const s = state(readySelfTest, x => {
      x.op = null
      x.cursor = 'finish'
      x.driver = { kind: 'phone', client_id: PHONE, since: 1, renewed: 2, lapsed: false }
    })
    expect(screenFor(s, local())).toBe('S8')
  })

  it('S9 while the panel drives, and S1 once its claim has lapsed', () => {
    expect(screenFor(state(readySelfTest, s => { s.op = null }), local())).toBe('S9')
    const lapsed = state(readySelfTest, s => {
      s.op = null
      if (s.driver) s.driver.lapsed = true
    })
    expect(screenFor(lapsed, local())).toBe('S1')
  })

  it('S8 on a complete setup this page drove, S10 on one it did not', () => {
    expect(screenFor(state(completeWithSkips), local({ droveSetup: true }))).toBe('S8')
    expect(screenFor(state(completeWithSkips), local())).toBe('S10')
  })

  it('S3, S4 and S4r when changing Wi-Fi on a complete setup', () => {
    const complete = state(completeWithSkips)
    const changing = local({ changingWifi: true })
    expect(screenFor(complete, changing)).toBe('S3')
    expect(screenFor(state(completeWithSkips, s => {
      s.op = { kind: 'join', id: 'op_20', started: 1, phase: 'associating' }
    }), changing)).toBe('S4')
    // The older network's success does not count: only a result after Connect.
    expect(screenFor(complete, { ...changing, joinRev: complete.rev })).toBe('S3')
    expect(screenFor(state(completeWithSkips, s => {
      s.rev += 2
      s.steps.network.error = { code: 'wrong_password', at_phase: 'authenticating' }
    }), { ...changing, joinRev: complete.rev })).toBe('S4r')
  })
})

describe('progressFor', () => {
  it('counts every step on a new printer', () => {
    expect(progressFor(state(newState))).toEqual({ n: 1, total: 6 })
  })

  it('leaves hidden steps out of both numbers', () => {
    const s = state(linkCode, x => { x.steps.update.status = 'hidden' })
    expect(progressFor(s)).toEqual({ n: 4, total: 5 })
  })

  it('is N of N at finish', () => {
    expect(progressFor(state(completeWithSkips))).toEqual({ n: 6, total: 6 })
  })
})
