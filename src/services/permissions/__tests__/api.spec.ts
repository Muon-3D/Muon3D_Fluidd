import { describe, expect, it } from 'vitest'
import { changeOutcome, outcomeNote, parseKnobs, valueLabel } from '../api'

describe('security permissions', () => {
  it('reads every reported setting in order, with Control\'s words for known ones and the printer\'s for the rest', () => {
    const knobs = parseKnobs({
      result: {
        knobs: [
          { id: 'lockdown', value: 'owner' },
          { id: 'usb_print', label: 'Print from a USB stick', description: 'A stick in the front port.', value: 'anyone', values: ['anyone', 'owner'] },
          { id: 'dev_mode', value: 'owner_at_printer', values: ['owner_at_printer'], read_only: true },
          { id: 'dev_mode_legacy', value: 'owner' },
          { id: 'remote_print', value: 'owner_or_admin' },
          { id: 'novalue' },
          'nonsense'
        ]
      }
    })
    expect(knobs?.map(k => [k.id, k.label, k.value, k.readOnly])).toEqual([
      ['lockdown', 'Lockdown', 'owner', false],
      ['usb_print', 'Print from a USB stick', 'anyone', false],
      ['dev_mode', 'Turn on developer mode', 'owner_at_printer', true],
      ['dev_mode_legacy', 'dev_mode_legacy', 'owner', false],
      ['remote_print', 'remote_print', 'owner_or_admin', true]
    ])
    expect(knobs?.map(k => k.generic)).toEqual([false, false, false, false, true])
    expect(valueLabel('owner_or_admin')).toBe('Owner or admin')
    expect(valueLabel('owner_at_printer')).toBe('Owner, at the printer')
    expect(knobs?.[0].values).toEqual(['anyone', 'owner', 'owner_at_printer'])
    expect(knobs?.[1].values).toEqual(['anyone', 'owner'])
    expect(parseKnobs({})).toBeNull()
  })

  it('keeps developer mode to the printer\'s screen even when the printer omits read_only', () => {
    expect(parseKnobs({ knobs: [{ id: 'dev_mode', value: 'owner_at_printer' }] })?.[0].readOnly).toBe(true)
    expect(parseKnobs({ knobs: [{ id: 'dev_mode', value: 'anyone', read_only: false }] })?.[0].readOnly).toBe(true)
  })

  it('turns the printer\'s answer into what the row says', () => {
    expect(changeOutcome(200, { knob: { id: 'lockdown', value: 'owner' } })).toMatchObject({ kind: 'applied', knob: { value: 'owner' } })
    expect(changeOutcome(200, {})).toEqual({ kind: 'applied', knob: null })
    expect(changeOutcome(204, undefined)).toEqual({ kind: 'applied', knob: null })
    expect(outcomeNote(changeOutcome(202, { consent_required: true }))).toMatch(/^Press the knob on the printer to confirm/)
    expect(changeOutcome(403, { error: { message: 'Only at the printer' } })).toEqual({ kind: 'refused', message: 'Only at the printer' })
    expect(changeOutcome(403, { error: { message: 'Network protection is on (protected)' } }).kind).toBe('refused')
    expect(outcomeNote(changeOutcome(500, {}))).toBe("The printer didn't take that change.")
  })
})
