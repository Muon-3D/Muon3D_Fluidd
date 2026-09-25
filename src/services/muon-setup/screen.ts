/**
 * Which `/setup` screen shows, as a pure function of the printer's state and
 * this tab's flags (05-phone-setup-page.md §5). It is the only place that
 * decides; the page keeps no step order of its own.
 */
import type { SetupLocal } from './state'
import type { SetupState, StepId } from './types'

/** The order steps always run in (01-flow.md §2). */
export const STEP_ORDER: StepId[] = ['language', 'network', 'name', 'update', 'remote', 'ready']

export type ScreenId =
  | 'S0' // Connecting
  | 'S1' // Start
  | 'S3' // Wi-Fi
  | 'S4' // Joining
  | 'S4r' // Join result
  | 'S5' // Name, update and remote access
  | 'S5u' // Updating
  | 'S6' // Link code
  | 'S7' // At the printer
  | 'S8' // Done
  | 'S9' // Following the panel
  | 'S10' // Set up already

/** A finished join the owner has yet to see: success, or an error. */
const networkResultWaiting = (state: SetupState, local: SetupLocal) => {
  const network = state.steps.network
  return local.awaitingNetworkResult && (network.status === 'done' || network.error !== null)
}

const joining = (state: SetupState) =>
  state.op?.kind === 'region_apply' || state.op?.kind === 'join'

/** The Wi-Fi screens: the list, the join in flight, or its result. */
const wifiScreen = (state: SetupState, local: SetupLocal): ScreenId => {
  if (joining(state)) return 'S4'
  if (networkResultWaiting(state, local)) return 'S4r'
  return 'S3'
}

export const screenFor = (state: SetupState | null, local: SetupLocal): ScreenId => {
  // 1. Nothing heard from the printer yet.
  if (!state) return 'S0'

  // 2. Setup is complete.
  if (state.state === 'complete') {
    if (local.changingWifi) return wifiScreen(state, local)
    return local.droveSetup ? 'S8' : 'S10'
  }

  // 3. A long operation is running.
  if (joining(state)) return 'S4'
  if (state.op?.kind === 'update_install') return 'S5u'

  // 4. The panel is in charge, and it is not this page.
  const driver = state.driver
  if (driver?.kind === 'panel' && !driver.lapsed && driver.client_id !== local.clientId) return 'S9'

  // 5. This page has not claimed the driver yet.
  if (driver?.client_id !== local.clientId) return 'S1'

  // A join this page started has finished: its result shows before anything
  // else, because a successful join has already moved the cursor on.
  if (networkResultWaiting(state, local)) return 'S4r'

  // 6. By cursor.
  switch (state.cursor) {
    case 'language':
      return 'S1'
    case 'network':
      return 'S3'
    case 'name':
    case 'update':
    case 'remote': {
      const remote = state.steps.remote
      return remote.mode === 'cloud' && remote.status === 'pending' ? 'S6' : 'S5'
    }
    case 'ready':
      return 'S7'
    case 'finish':
      return 'S8'
  }
}

/** "n of N": the cursor's place among the steps that are not hidden (05 §3). */
export const progressFor = (state: SetupState): { n: number, total: number } => {
  const visible = STEP_ORDER.filter(step => state.steps[step].status !== 'hidden')
  if (state.cursor === 'finish') return { n: visible.length, total: visible.length }
  // Visible steps up to and including the cursor, so a cursor on a step that
  // has just been hidden still counts from where it is.
  const upTo = STEP_ORDER.slice(0, STEP_ORDER.indexOf(state.cursor) + 1)
  const n = upTo.filter(step => visible.includes(step)).length
  return { n: Math.max(n, 1), total: visible.length }
}
