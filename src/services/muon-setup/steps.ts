/**
 * The step list the `/setup` frame shows (v3 setup storyboard): the steps the
 * printer runs, in its order, each done, current or still to do. Hidden steps
 * are left out. Like `screenFor`, it only reads the printer's state.
 */
import { STEP_ORDER, type ScreenId } from './screen'
import type { SetupState, StepId } from './types'

export type FrameStepId = 'welcome' | StepId | 'finish'

export interface FrameStep {
  id: FrameStepId;
  label: string;
  status: 'done' | 'on' | 'todo';
}

export const STEP_LABELS: Record<FrameStepId, string> = {
  welcome: 'Welcome',
  language: 'Language',
  network: 'Wi-Fi',
  name: 'Name your printer',
  update: 'Updates',
  remote: 'Your account',
  ready: 'First calibration',
  finish: 'Finish'
}

/** Screens drawn before this page holds the driver: the Welcome step. */
const WELCOME_SCREENS: ScreenId[] = ['S0', 'S1']

/** Language is set by the Welcome step's Start, so it has no row of its own. */
const LISTED: StepId[] = STEP_ORDER.filter(step => step !== 'language')

/** The step the page is on: the cursor, or Welcome before the page has started. */
export const currentStep = (state: SetupState | null, screen: ScreenId): FrameStepId => {
  if (!state || WELCOME_SCREENS.includes(screen)) return 'welcome'
  if (screen === 'S8' || screen === 'S10' || state.state === 'complete') return 'finish'
  if (state.cursor === 'language') return 'welcome'
  return state.cursor
}

export const frameSteps = (state: SetupState | null, screen: ScreenId): FrameStep[] => {
  const on = currentStep(state, screen)
  const ids: FrameStepId[] = [
    'welcome',
    ...LISTED.filter(step => !state || state.steps[step].status !== 'hidden'),
    'finish'
  ]
  const at = ids.indexOf(on)
  return ids.map((id, i) => ({
    id,
    label: STEP_LABELS[id],
    status: i < at ? 'done' : i === at ? 'on' : 'todo'
  }))
}

/**
 * Where Back goes from the cursor: the nearest earlier step that is done or
 * skipped (the printer's `goto` takes no other). Null on the first step.
 */
export const previousStep = (state: SetupState | null): StepId | null => {
  if (!state || state.state === 'complete') return null
  const cursor = state.cursor === 'finish' ? STEP_ORDER.length : STEP_ORDER.indexOf(state.cursor)
  for (let i = cursor - 1; i >= 0; i--) {
    const step = STEP_ORDER[i]
    // Language is chosen on Welcome; going back to it would leave the frame.
    if (step === 'language') return null
    const status = state.steps[step].status
    if (status === 'done' || status === 'skipped') return step
  }
  return null
}
