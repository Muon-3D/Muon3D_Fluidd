import { describe, expect, it } from 'vitest'
import { anyHot, flagOf, needsKnob, restartBlocked, stagedReady, type RestartGuardInput } from '../policy'
import type { AuxUpdateStatus } from '../model'

const STAGED: AuxUpdateStatus = {
  state: 'idle',
  current_version: '0.9.3',
  target_version: '0.9.4',
  update_available: true,
  install: { phase: 'idle' },
  stage: { state: 'staged', version: '0.9.4', slot_fingerprint: { sha256: 'abc' } }
}

const idle = (over: Partial<RestartGuardInput> = {}): RestartGuardInput => ({
  status: STAGED, canControl: true, klippyConnected: true, printerState: 'ready', hot: false, active: false, ...over
})

describe('update policy', () => {
  it('reads a flag from the body or from Moonraker\'s result, and nothing else', () => {
    expect(flagOf({ enabled: true }, 'enabled')).toBe(true)
    expect(flagOf({ result: { required: false } }, 'required')).toBe(false)
    expect(flagOf({ enabled: 'yes' }, 'enabled')).toBeNull()
    expect(flagOf(null, 'enabled')).toBeNull()
  })

  it('a staged update is ready only when its version matches and its slot can be checked', () => {
    expect(stagedReady(STAGED)).toBe(true)
    expect(stagedReady({ ...STAGED, stage: { ...STAGED.stage, version: '0.9.2' } })).toBe(false)
    expect(stagedReady({ ...STAGED, stage: { ...STAGED.stage, slot_fingerprint: {} } })).toBe(false)
    expect(stagedReady({ ...STAGED, stage: { state: 'downloading' } })).toBe(false)
    expect(stagedReady(null)).toBe(false)
  })

  it('restarting is allowed only when idle, cool and staged as reported', () => {
    expect(restartBlocked(idle())).toBe('')
    expect(restartBlocked(idle({ printerState: 'printing' }))).toBe('Not while printing.')
    expect(restartBlocked(idle({ printerState: 'paused' }))).toBe('Not while a print is paused.')
    expect(restartBlocked(idle({ printerState: 'busy' }))).toBe('Wait until the printer is idle.')
    expect(restartBlocked(idle({ hot: true }))).toBe('Wait until the heaters have cooled.')
    expect(restartBlocked(idle({ active: true }))).toBe('An update is already under way.')
    expect(restartBlocked(idle({ canControl: false }))).toMatch(/Connect/)
    expect(restartBlocked(idle({ status: { ...STAGED, requires_commit: true } }))).toMatch(/still checking/)
    expect(restartBlocked(idle({ status: { ...STAGED, stage: { ...STAGED.stage, version: '0.9.2' } } }))).toMatch(/doesn't match/)
  })

  it('a heater that is set or still warm is hot', () => {
    expect(anyHot([{ temperature: 24, target: 0 }])).toBe(false)
    expect(anyHot([{ temperature: 24, target: 60 }])).toBe(true)
    expect(anyHot([{ temperature: 80, target: 0 }])).toBe(true)
  })

  it('a 202 consent challenge asks for the knob', () => {
    expect(needsKnob({ consent_required: true, challenge_id: 'c' })).toBe(true)
    expect(needsKnob({ result: { consent_required: true } })).toBe(true)
    expect(needsKnob({ enabled: true })).toBe(false)
  })
})
