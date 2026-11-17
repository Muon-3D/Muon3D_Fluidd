import { describe, expect, it } from 'vitest'
import { parseKnob, type PermissionKnob } from '../api'
import { currentPreset, mayUse, planFor, targetFor } from '../presets'

const FOUR = ['anyone', 'owner_and_shared', 'owner', 'owner_at_printer']
const knob = (id: string, value: string, extra: Record<string, unknown> = {}): PermissionKnob =>
  parseKnob({ id, value, values: FOUR, ...extra })!

const list = (value: string, hotspotChange = value) => [
  knob('hotspot_toggle', value), knob('hotspot_change', hotspotChange), knob('wifi_change', value),
  knob('update_install', value), knob('plate_clear', value), knob('usb_print', value, { values: ['anyone', 'owner'] })
]

describe('presets', () => {
  it('says which preset the settings are, and Custom for a mix', () => {
    expect(currentPreset(list('anyone'))).toBe('open')
    expect(currentPreset(list('owner'))).toBe('locked-down')
    expect(currentPreset(list('anyone', 'owner'))).toBe('custom')
    expect(currentPreset(null)).toBeNull()
    expect(currentPreset([knob('lockdown', 'owner')])).toBeNull()
  })

  it('Protected is what its own plan produces', () => {
    const plan = planFor('protected', list('anyone'))
    const next = list('anyone').map(k => ({ ...k, value: plan.find(p => p.id === k.id)?.value ?? k.value }))
    expect(currentPreset(next)).toBe('protected')
    expect(plan.find(p => p.id === 'usb_print')?.value).toBe('owner')
  })

  it('never asks for the printer only, and never touches fixed, read-only or unknown settings', () => {
    const knobs = [
      knob('wifi_change', 'anyone'),
      knob('dev_mode', 'anyone', { read_only: true }),
      knob('dev_mode_first_entry', 'owner_at_printer', { fixed: true }),
      knob('remote_print', 'owner_or_admin')
    ]
    for (const id of ['open', 'protected', 'locked-down'] as const) {
      const plan = planFor(id, knobs)
      expect(plan.every(p => p.id === 'wifi_change')).toBe(true)
      expect(plan.every(p => p.value !== 'owner_at_printer')).toBe(true)
    }
  })

  it('picks the next stricter value a setting accepts', () => {
    expect(targetFor('owner_and_shared', ['anyone', 'owner'])).toBe('owner')
    expect(targetFor('owner', ['anyone'])).toBe('anyone')
    expect(targetFor('anyone', ['owner'])).toBe('owner')
  })

  it('a non-owner may use what the setting lets in, and nothing is hidden on a guess', () => {
    expect(mayUse('anyone', null)).toBe(true)
    expect(mayUse(undefined, null)).toBe(true)
    expect(mayUse('owner', true)).toBe(false)
    expect(mayUse('owner_at_printer', true)).toBe(false)
    expect(mayUse('owner_and_shared', true)).toBe(true)
    expect(mayUse('owner_and_shared', false)).toBe(false)
    expect(mayUse('owner_and_shared', null)).toBe(true)
  })
})
