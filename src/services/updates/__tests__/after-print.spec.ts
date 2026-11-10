import { beforeEach, describe, expect, it } from 'vitest'
import { AFTER_PRINT_MAX_MS, afterPrint, afterPrintDue, cancelAfterPrint, loadAfterPrint, otaComponent, queueAfterPrint } from '../after-print'

const READY = { update_available: true, current_version: '0.9.3', target_version: '0.9.4' }
const Q = { from: '0.9.3', to: '0.9.4', file: 'M1_bracket.gcode', at: 1000 }

describe('install after this print', () => {
  beforeEach(() => {
    localStorage.clear()
    afterPrint.printer = ''
    afterPrint.queued = null
  })

  it('waits while the print runs or is paused, and installs once it is over', () => {
    expect(afterPrintDue(Q, 'printing', READY, 2000)).toBe('wait')
    expect(afterPrintDue(Q, 'paused', READY, 2000)).toBe('wait')
    for (const state of ['complete', 'cancelled', 'standby', 'ready']) expect(afterPrintDue(Q, state, READY, 2000)).toBe('install')
  })

  it('is dropped, never sent, when it no longer applies', () => {
    expect(afterPrintDue(Q, 'complete', { ...READY, target_version: '0.9.5' }, 2000)).toBe('drop')
    expect(afterPrintDue(Q, 'complete', { ...READY, update_available: false }, 2000)).toBe('drop')
    expect(afterPrintDue(Q, 'complete', { ...READY, current_version: '0.9.4' }, 2000)).toBe('drop')
    expect(afterPrintDue(Q, 'error', READY, 2000)).toBe('drop')
    expect(afterPrintDue(Q, 'printing', READY, Q.at + AFTER_PRINT_MAX_MS + 1)).toBe('drop')
  })

  it('waits when nothing is known yet, and does nothing with nothing queued', () => {
    expect(afterPrintDue(Q, 'complete', null, 2000)).toBe('wait')
    expect(afterPrintDue(null, 'complete', READY, 2000)).toBe('wait')
  })

  it('is kept per printer across a reload, and cancel forgets it', () => {
    queueAfterPrint('boxwood', Q)
    afterPrint.printer = ''
    afterPrint.queued = null
    expect(loadAfterPrint('boxwood')).toEqual(Q)
    expect(loadAfterPrint('hazel')).toBeNull()
    loadAfterPrint('boxwood')
    cancelAfterPrint()
    afterPrint.printer = ''
    expect(loadAfterPrint('boxwood')).toBeNull()
  })

  it('names the updater component of type ota', () => {
    expect(otaComponent({ klipper: { configured_type: 'git_repo' }, muonos: { configured_type: 'ota' } })).toBe('muonos')
    expect(otaComponent(null)).toBe('MuonOS')
  })
})
