import { describe, expect, it } from 'vitest'
import { changeOutcome, outcomeNote, parseKnobs } from '../api'

describe('security permissions', () => {
  it('reads every reported setting in order, with Control\'s words for known ones and the printer\'s for the rest', () => {
    const knobs = parseKnobs({
      result: {
        knobs: [
          { id: 'lockdown', value: 'owner' },
          { id: 'usb_print', label: 'Print from a USB stick', description: 'A stick in the front port.', value: 'anyone', values: ['anyone', 'owner'] },
          { id: 'dev_mode', value: 'owner_at_printer', values: ['owner_at_printer'], read_only: true },
          { id: 'broken', value: 'everyone' },
          'nonsense'
        ]
      }
    })
    expect(knobs?.map(k => [k.id, k.label, k.value, k.readOnly])).toEqual([
      ['lockdown', 'Lockdown', 'owner', false],
      ['usb_print', 'Print from a USB stick', 'anyone', false],
      ['dev_mode', 'Turn on developer mode', 'owner_at_printer', true]
    ])
    expect(knobs?.[0].values).toEqual(['anyone', 'owner', 'owner_at_printer'])
    expect(knobs?.[1].values).toEqual(['anyone', 'owner'])
    expect(parseKnobs({})).toBeNull()
  })

  it('turns the printer\'s answer into the Wi-Fi words', () => {
    expect(changeOutcome(200, { knob: { id: 'lockdown', value: 'owner' } })).toMatchObject({ kind: 'applied', knob: { value: 'owner' } })
    expect(outcomeNote(changeOutcome(202, { consent_required: true }))).toMatch(/^Press the knob on the printer to confirm/)
    expect(outcomeNote(changeOutcome(403, { error: { message: 'panel only' } }))).toMatch(/^Do this at the printer's screen/)
    expect(changeOutcome(403, { error: { message: 'Network protection is on (protected)' } }).kind).toBe('refused')
    expect(outcomeNote(changeOutcome(500, {}))).toBe("The printer didn't take that change.")
  })
})
