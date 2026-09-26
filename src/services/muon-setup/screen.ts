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
  | 'S4r' // Join result, and the region line (§3.1)
  | 'S5' // Name, update and remote access
  | 'S5u' // Updating
  | 'S6' // Link code
  | 'S7' // At the printer
  | 'S8' // Done
  | 'S9' // Following the panel
  | 'S10' // Set up already

/**
 * A join has finished when the printer has an address or an error. Not
 * `status == done`: in a picker market the step stays pending until the
 * region is confirmed.
 */
export const joinFinished = (state: SetupState): boolean => {
  const network = state.steps.network
  return network.addresses.length > 0 || network.error !== null
}

/** Rule 5: the result of a join this tab started, until the owner moves on. */
const ownJoinResult = (state: SetupState, local: SetupLocal): boolean =>
  local.joinRev !== null && state.rev > local.joinRev && !state.op && joinFinished(state)

const joining = (state: SetupState) =>
  state.op?.kind === 'region_apply' || state.op?.kind === 'join'

export const screenFor = (state: SetupState | null, local: SetupLocal): ScreenId => {
  // 1. Nothing heard from the printer yet.
  if (!state) return 'S0'

  // 2. Setup is complete.
  if (state.state === 'complete') {
    if (local.droveSetup) return 'S8'
    if (local.changingWifi) {
      if (joining(state)) return 'S4'
      return ownJoinResult(state, local) ? 'S4r' : 'S3'
    }
    return 'S10'
  }

  // 3. A long operation is running.
  if (joining(state)) return 'S4'
  if (state.op?.kind === 'update_install') return 'S5u'

  // 4. The panel is in charge, and it is not this page.
  const driver = state.driver
  if (driver?.kind === 'panel' && !driver.lapsed && driver.client_id !== local.clientId) return 'S9'

  // 5. This tab's join result. In locked and none markets, or when the
  // declared country already matches, the cursor moves on straight after
  // the join, so the result would otherwise never show.
  if (ownJoinResult(state, local)) return 'S4r'

  // 6. This page has not claimed the driver yet.
  if (driver?.client_id !== local.clientId) return 'S1'

  // 7. By cursor.
  switch (state.cursor) {
    case 'language':
      return 'S1'
    case 'network': {
      // Joined, and the region line still waits for Confirm or Change. Every
      // phone tab shows it, not only the one that joined.
      const network = state.steps.network
      return network.addresses.length > 0 && !network.region_confirmed ? 'S4r' : 'S3'
    }
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
