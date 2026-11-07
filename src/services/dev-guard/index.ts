/**
 * The client side of Klipper#112's allowlist. Control refuses to send the
 * commands that printer would refuse unless the printer is in developer mode,
 * and says so, instead of letting the printer reject them.
 *
 * The printer enforces the rule too; this keeps the page honest about it.
 */

/** The note shown where a control is hidden or disabled by this gate. */
export const DEV_ONLY_NOTE = 'Needs developer mode'

export interface DevGuardInput {
  /** `isMuonPrinter`: true, false (a loaded list with no Muon component), null while unknown. */
  isMuon: boolean | null;
  /** `printer.muon_guard.dev_mode` when the printer reports that object, else anything non-boolean. */
  guardDevMode: unknown;
  /** The per-printer gate answer (`devModeEnabled`): true only when the printer said so. */
  gateDevMode: boolean;
}

/**
 * Whether dev-mode-only commands are off limits: true on a Muon printer that
 * is not in developer mode. The printer's own `muon_guard.dev_mode` wins when
 * it is a boolean, else the per-printer gate answer. Unknown is not dev mode.
 * A printer known not to be Muon keeps everything.
 */
export function devOnlyLocked (input: DevGuardInput): boolean {
  if (input.isMuon === false) return false
  const dev = typeof input.guardDevMode === 'boolean' ? input.guardDevMode : input.gateDevMode === true
  return !dev
}
