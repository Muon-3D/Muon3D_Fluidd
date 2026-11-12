import { describe, expect, it } from 'vitest'
import { changeOutcome, outcomeNote, parseKnobs, parsePermissions, permissionsPath, switchOutcome, switchPath, valueLabel } from '../api'

describe('security permissions', () => {
  it('reads every reported setting in order, with Control\'s words for known ones and the printer\'s for the rest', () => {
    const knobs = parseKnobs({
      result: {
        knobs: [
          { id: 'lockdown', value: 'owner' },
          { id: 'usb_print', label: 'Print from a USB stick', description: 'A stick in the front port.', value: 'anyone', values: ['anyone', 'owner'] },
          { id: 'plate_clear', value: 'anyone' },
          { id: 'remote_print', value: 'owner_or_admin' },
          { id: 'novalue' },
          'nonsense'
        ]
      }
    })
    expect(knobs?.map(k => [k.id, k.label, k.value, k.readOnly])).toEqual([
      ['lockdown', 'Lockdown', 'owner', false],
      ['usb_print', 'Print from a USB stick', 'anyone', false],
      ['plate_clear', 'Confirm the plate is clear', 'anyone', false],
      ['remote_print', 'remote_print', 'owner_or_admin', true]
    ])
    expect(knobs?.map(k => k.generic)).toEqual([false, false, false, true])
    expect(valueLabel('owner_or_admin')).toBe('Owner or admin')
    expect(valueLabel('owner_at_printer')).toBe('Owner, at the printer')
    expect(valueLabel('owner_and_shared')).toBe('Owner and shared users')
    expect(knobs?.[0].values).toEqual(['anyone', 'owner_and_shared', 'owner', 'owner_at_printer'])
    expect(knobs?.[1].values).toEqual(['anyone', 'owner'])
    expect(parseKnobs({})).toBeNull()
  })

  it('reads claimed, switches and fixed rows, and trusts read_only and fixed from the printer', () => {
    const list = parsePermissions({
      claimed: true,
      knobs: [
        { id: 'wifi_change', value: 'owner_and_shared' },
        { id: 'dev_mode', value: 'owner', read_only: false },
        { id: 'dev_mode_first_entry', value: 'owner_at_printer', fixed: true, read_only: true },
        { id: 'update_install', value: 'owner', read_only: true }
      ],
      switches: [{ id: 'hotspot_change_confirm', label: 'Confirm', value: false, default: false }, { id: 'bad' }]
    })
    expect(list?.claimed).toBe(true)
    // Defaults: owner_and_shared on a claimed printer; a fixed row has none; read_only is the printer's word.
    expect(list?.knobs.map(k => [k.id, k.defaultValue, k.fixed, k.readOnly])).toEqual([
      ['wifi_change', 'owner_and_shared', false, false],
      ['dev_mode', '', false, false],
      ['dev_mode_first_entry', '', true, true],
      ['update_install', 'owner_and_shared', false, true]
    ])
    expect(list?.switches).toEqual([{ id: 'hotspot_change_confirm', label: 'Confirm', description: '', value: false, defaultValue: false, readOnly: false }])
  })

  it('shows open as the default on an open printer, from the printer when it says so', () => {
    const list = parsePermissions({ claimed: false, knobs: [{ id: 'wifi_change', value: 'owner' }, { id: 'lockdown', value: 'owner' }, { id: 'usb_print', value: 'owner', default: 'owner' }], switches: [] })
    expect(list?.knobs.map(k => k.defaultValue)).toEqual(['anyone', '', 'owner'])
  })

  it('still reads the older three-value list: developer mode stays printer only', () => {
    const list = parsePermissions({ knobs: [{ id: 'dev_mode', value: 'anyone', read_only: false }, { id: 'wifi_change', value: 'owner' }] })
    expect(list?.claimed).toBeNull()
    expect(list?.knobs.map(k => [k.id, k.fixed, k.readOnly])).toEqual([['dev_mode', true, true], ['wifi_change', false, false]])
  })

  it('uses /muon-link on a managed session and /server/aux on the LAN', () => {
    expect(permissionsPath(false)).toBe('/server/aux/permissions')
    expect(permissionsPath(true)).toBe('/muon-link/permissions')
    expect(switchPath(false)).toBe('/server/aux/permissions/switch')
    expect(switchPath(true)).toBe('/muon-link/permissions/switch')
  })

  it('turns the printer\'s answer into what the row says', () => {
    expect(changeOutcome(200, { knob: { id: 'lockdown', value: 'owner' } })).toMatchObject({ kind: 'applied', knob: { value: 'owner' } })
    expect(changeOutcome(200, {})).toEqual({ kind: 'applied', knob: null })
    expect(changeOutcome(204, undefined)).toEqual({ kind: 'applied', knob: null })
    expect(outcomeNote(changeOutcome(202, { consent_required: true }))).toMatch(/^Press the knob on the printer to confirm/)
    expect(changeOutcome(403, { detail: { code: 'permission_restricted', message: 'Only the owner.', allowed: 'the owner' } })).toEqual({ kind: 'refused', message: 'Only the owner.', code: 'permission_restricted' })
    expect(changeOutcome(403, { error: 'owner_only', detail: { message: 'Only the owner.' } })).toEqual({ kind: 'refused', message: 'Only the owner.', code: 'owner_only' })
    expect(changeOutcome(403, { error: { message: 'Only at the printer' } })).toEqual({ kind: 'refused', message: 'Only at the printer', code: '' })
    expect(outcomeNote(changeOutcome(500, {}))).toBe("The printer didn't take that change.")
    expect(switchOutcome(200, { switch: { id: 'a', value: true } })).toMatchObject({ kind: 'switch', value: { id: 'a', value: true } })
    expect(switchOutcome(403, { detail: { message: 'No.' } })).toMatchObject({ kind: 'refused', message: 'No.' })
  })
})
