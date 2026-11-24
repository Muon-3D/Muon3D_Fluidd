import { SETUP_STEPS, nextSetupStep, type SetupStep } from './setup-anim'

/**
 * Which parts the printer says are missing, as the four setup steps (KAN-6012).
 *
 * The printer's `m1_machine` object (Muon3D_Klipper, klippy/extras/m1_machine.py)
 * lists, for each action, the reason codes of what that action still needs:
 *   missing: { print: [...], resume: [...], home_z: [...], home_xy: [...] }
 *   gate:    { action, missing: [...], since } while a print waits for parts
 * Only the codes that are a part to fit become a step. Every other code (filament,
 * bed power, fan, a plate not yet confirmed clear...) has its own place and is left
 * out, and so are the two "checking" codes, which are a moment at start-up, not a part.
 */
const STEP_OF: Record<string, SetupStep> = {
  toolhead_disconnected: 'toolhead',
  column_absent: 'spine',
  column_unlocked: 'lever',
  // Part way between the bands: the lever is not fully down.
  column_unknown: 'lever',
  plate_absent: 'plate'
}

type Json = Record<string, unknown>
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The actions Control can ask the printer for that need parts. `home` is Home all. */
export type PartsAction = 'print' | 'resume' | 'home_z' | 'home_xy' | 'home'

const ACTIONS: Record<PartsAction, string[]> = {
  print: ['print'],
  resume: ['resume'],
  home_z: ['home_z'],
  home_xy: ['home_xy'],
  home: ['home_z', 'home_xy']
}

function steps (codes: unknown, into: Set<SetupStep>): void {
  if (!Array.isArray(codes)) return
  for (const code of codes) {
    const step = typeof code === 'string' ? STEP_OF[code] : undefined
    if (step) into.add(step)
  }
}

const inOrder = (set: Set<SetupStep>): SetupStep[] => SETUP_STEPS.filter(s => set.has(s))

/** The steps `action` is missing, in the order a person does them. Empty when the printer says nothing. */
export function missingFor (status: unknown, action: PartsAction): SetupStep[] {
  const machine = isObject(status) ? status.m1_machine : undefined
  const missing = isObject(machine) && isObject(machine.missing) ? machine.missing : {}
  const out = new Set<SetupStep>()
  for (const key of ACTIONS[action]) steps(missing[key], out)
  return inOrder(out)
}

/** The steps a print that is waiting for parts (the printer's own gate) still needs. Empty when none waits. */
export function gateMissing (status: unknown): SetupStep[] {
  const machine = isObject(status) ? status.m1_machine : undefined
  const gate = isObject(machine) ? machine.gate : undefined
  const out = new Set<SetupStep>()
  if (isObject(gate)) steps(gate.missing, out)
  return inOrder(out)
}

/** The step to draw: the first of those still missing. */
export const stepToShow = (missing: SetupStep[]): SetupStep | null => nextSetupStep(missing)
