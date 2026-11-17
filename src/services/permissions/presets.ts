/**
 * Open / Protected / Locked-down (KAN-3606): three named ways to set the
 * printer's permission settings (`/server/aux/permissions`) in one go.
 *
 * A preset is only a table of values for settings the printer already
 * reports; choosing one sends each setting that differs, and the printer
 * enforces every value. Which preset is current is worked out from the
 * settings themselves, never remembered, so a printer changed from the phone
 * app or the panel shows the truth, and a mix shows as "Custom".
 *
 * Jack, 17 Nov: nothing is "panel only", so no preset asks for
 * `owner_at_printer`. Settings the printer calls fixed or read-only, and
 * ones whose value Control doesn't know, are never touched or counted.
 */
import type { PermissionKnob } from './api'

export type PresetId = 'open' | 'protected' | 'locked-down'
export type PresetState = PresetId | 'custom'

/** Least to most strict, the order the printer lists its values in. */
const STRICTNESS = ['anyone', 'owner_and_shared', 'owner', 'owner_at_printer']

export interface Preset {
  id: PresetId;
  label: string;
  blurb: string;
  /** What each setting is set to; a setting the printer doesn't report is skipped. */
  values: Record<string, string>;
}

export const PRESETS: Preset[] = [
  {
    id: 'open',
    label: 'Open',
    blurb: 'Anyone who can reach the printer can do everything, from any route.',
    values: {
      hotspot_toggle: 'anyone',
      hotspot_change: 'anyone',
      wifi_change: 'anyone',
      update_install: 'anyone',
      plate_clear: 'anyone',
      usb_print: 'anyone',
      dev_mode: 'anyone'
    }
  },
  {
    id: 'protected',
    label: 'Protected',
    blurb: 'The owner and the people they share the printer with. Only the owner changes the hotspot and developer mode.',
    values: {
      hotspot_toggle: 'owner_and_shared',
      hotspot_change: 'owner',
      wifi_change: 'owner_and_shared',
      update_install: 'owner_and_shared',
      plate_clear: 'owner_and_shared',
      usb_print: 'owner_and_shared',
      dev_mode: 'owner'
    }
  },
  {
    id: 'locked-down',
    label: 'Locked-down',
    blurb: 'Only the owner can do any of these.',
    values: {
      hotspot_toggle: 'owner',
      hotspot_change: 'owner',
      wifi_change: 'owner',
      update_install: 'owner',
      plate_clear: 'owner',
      usb_print: 'owner',
      dev_mode: 'owner'
    }
  }
]

/** The settings a preset may change on this printer: ordinary rows it names. */
function covered (preset: Preset, knobs: PermissionKnob[]): PermissionKnob[] {
  return knobs.filter(k => !k.readOnly && !k.fixed && !k.generic && k.id in preset.values)
}

/**
 * The value a preset means for one setting, from the values that setting
 * accepts: the wanted one, else the next stricter, else the strictest it has.
 */
export function targetFor (wanted: string, accepts: string[]): string | null {
  if (accepts.includes(wanted)) return wanted
  const rank = STRICTNESS.indexOf(wanted)
  if (rank < 0) return null
  const stricter = STRICTNESS.slice(rank + 1).find(v => accepts.includes(v))
  if (stricter) return stricter
  const known = accepts.filter(v => STRICTNESS.includes(v)).sort((a, b) => STRICTNESS.indexOf(b) - STRICTNESS.indexOf(a))
  return known[0] ?? null
}

/** What choosing `id` would send: one `{ id, value }` for each setting that differs. */
export function planFor (id: PresetId, knobs: PermissionKnob[]): Array<{ id: string, value: string }> {
  const preset = PRESETS.find(p => p.id === id)
  if (!preset) return []
  const plan: Array<{ id: string, value: string }> = []
  for (const k of covered(preset, knobs)) {
    const value = targetFor(preset.values[k.id], k.values)
    if (value !== null && value !== k.value) plan.push({ id: k.id, value })
  }
  return plan
}

/**
 * Which preset the printer's settings are: the first whose every setting
 * already matches, "custom" when none does, and null when the printer reports
 * nothing a preset covers (so there is nothing to say).
 */
export function currentPreset (knobs: PermissionKnob[] | null): PresetState | null {
  if (!knobs) return null
  let any = false
  for (const preset of PRESETS) {
    const rows = covered(preset, knobs)
    if (rows.length) any = true
    if (rows.length && planFor(preset.id, knobs).length === 0) return preset.id
  }
  return any ? 'custom' : null
}

/** Words for a preset state. */
export function presetLabel (state: PresetState): string {
  return state === 'custom' ? 'Custom' : PRESETS.find(p => p.id === state)?.label ?? state
}

/**
 * Whether a client that is not the owner may use something, from the value of
 * the setting that guards it. `shared` says whether this client is one of the
 * people the owner shared the printer with (null when unknown). A setting the
 * printer did not report never hides anything: the printer enforces it anyway.
 */
export function mayUse (value: string | undefined, shared: boolean | null): boolean {
  if (value === undefined) return true
  if (value === 'anyone') return true
  if (value === 'owner_and_shared') return shared === true
  return false
}
