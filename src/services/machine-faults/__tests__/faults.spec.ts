import { describe, expect, it } from 'vitest'
import {
  CALM_MS,
  faultCodes,
  faultSummary,
  machineFaults,
  plainReason,
  RelatchTracker,
  resetAvailable,
  WAIT_MS
} from '../faults'
import {
  BED_POWER_AGAIN,
  BED_POWER_FAULT,
  BED_POWER_SHORT,
  FAN_FAULT,
  HOTEND_FAILED
} from '../strings'

const machine = (faults: unknown, conditions: Record<string, unknown> = {}) => ({ m1_machine: { faults, conditions } })

describe('the words', () => {
  it('are the panel wording, spelled out here and not imported from the code under test', () => {
    expect(BED_POWER_FAULT).toBe('Bed power cut, check the bed and its cable, then Reset')
    expect(BED_POWER_AGAIN).toBe('Bed power cut again: turn it off and check')
  })
})

describe('faultCodes', () => {
  it('reads a list of codes', () => {
    expect(faultCodes(machine(['bed_power_fault']))).toEqual(['bed_power_fault'])
  })
  it('reads an object keyed by code, true values only', () => {
    expect(faultCodes(machine({ bed_power_fault: true, fan_fault: false }))).toEqual(['bed_power_fault'])
  })
  it('is empty without the object, without the field, or with junk', () => {
    expect(faultCodes({})).toEqual([])
    expect(faultCodes(undefined)).toEqual([])
    expect(faultCodes({ m1_machine: {} })).toEqual([])
    expect(faultCodes(machine('bed_power_fault'))).toEqual([])
    expect(faultCodes(machine([1, null, '']))).toEqual([])
  })
})

describe('machineFaults', () => {
  it('maps bed power to the panel wording, with Reset', () => {
    expect(machineFaults(machine(['bed_power_fault']))).toEqual([
      { code: 'bed_power_fault', text: BED_POWER_FAULT, detail: '', canReset: true }
    ])
  })
  it('puts bed power first and gives the others words and no Reset', () => {
    const list = machineFaults(machine(['fan_fault', 'hotend_failed', 'bed_power_fault']))
    expect(list.map(f => f.code)).toEqual(['bed_power_fault', 'fan_fault', 'hotend_failed'])
    expect(list.map(f => f.text)).toEqual([BED_POWER_FAULT, FAN_FAULT, HOTEND_FAILED])
    expect(list.map(f => f.canReset)).toEqual([true, false, false])
  })
  it('says a code it does not know in words', () => {
    expect(machineFaults(machine(['coil_whine']))[0].text).toBe('Printer fault: coil whine')
  })
  it('shows nothing for a printer without m1_machine', () => {
    expect(machineFaults({ print_stats: { state: 'standby' } })).toEqual([])
  })
})

describe('plainReason', () => {
  it('uses a plain sentence from the printer', () => {
    expect(plainReason(machine(['bed_power_fault'], { bed_power_reason: 'The bed cable may be loose.' }))).toBe('The bed cable may be loose.')
  })
  it('never shows engineering detail', () => {
    for (const text of ['PGOOD dropped (eFuse tripped, 0.00 A)', 'run Z_POWER_RESET', 'overcurrent: 9.1 A over 8.0 A', 'draws 12 V']) {
      expect(plainReason(machine(['bed_power_fault'], { bed_power_reason: text }))).toBe('')
    }
  })
  it('is empty when there is none', () => {
    expect(plainReason(machine(['bed_power_fault']))).toBe('')
  })
})

describe('resetAvailable', () => {
  const bed = machineFaults(machine(['bed_power_fault']))
  const fan = machineFaults(machine(['fan_fault']))
  it('is offered for bed power when the printer is not printing', () => {
    expect(resetAvailable(bed, 'standby')).toBe(true)
    expect(resetAvailable(bed, 'complete')).toBe(true)
  })
  it('is not offered while a print is running or paused', () => {
    expect(resetAvailable(bed, 'printing')).toBe(false)
    expect(resetAvailable(bed, 'Paused')).toBe(false)
  })
  it('is not offered for a fault that has no reset', () => {
    expect(resetAvailable(fan, 'standby')).toBe(false)
  })
})

describe('faultSummary', () => {
  it('is short words for the printer list', () => {
    expect(faultSummary(['fan_fault', 'bed_power_fault'])).toBe(BED_POWER_SHORT)
    expect(faultSummary(['fan_fault'])).toBe(FAN_FAULT)
    expect(faultSummary([])).toBeNull()
    expect(faultSummary(undefined)).toBeNull()
  })
})

describe('RelatchTracker', () => {
  it('a fault that clears after Reset is not a re-latch', () => {
    const t = new RelatchTracker()
    t.observe(true, 0)
    t.resetSent(100)
    t.observe(false, 400)
    t.tick(5000)
    expect(t.relatched).toBe(false)
  })
  it('a fault that clears and comes back is a re-latch', () => {
    const t = new RelatchTracker()
    t.observe(true, 0)
    t.resetSent(100)
    t.observe(false, 300)
    t.observe(true, 600)
    expect(t.relatched).toBe(true)
  })
  it('a fault still there after the wait is a re-latch', () => {
    const t = new RelatchTracker()
    t.observe(true, 0)
    t.resetSent(100)
    t.tick(100 + WAIT_MS - 1)
    expect(t.relatched).toBe(false)
    t.tick(100 + WAIT_MS)
    expect(t.relatched).toBe(true)
  })
  it('stays re-latched while the fault stays, and calms once it has been gone a while', () => {
    const t = new RelatchTracker()
    t.observe(true, 0)
    t.resetSent(0)
    t.tick(WAIT_MS)
    expect(t.relatched).toBe(true)
    t.observe(true, 60_000)
    expect(t.relatched).toBe(true)
    t.observe(false, 70_000)
    t.tick(70_000 + CALM_MS - 1)
    expect(t.relatched).toBe(true)
    t.tick(70_000 + CALM_MS)
    expect(t.relatched).toBe(false)
  })
  it('a fault with no Reset pressed is never a re-latch', () => {
    const t = new RelatchTracker()
    t.observe(true, 0)
    t.tick(60_000)
    expect(t.relatched).toBe(false)
  })
})
