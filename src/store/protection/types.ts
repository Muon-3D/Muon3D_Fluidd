// Network protection, MuonOS connectivity SPEC SEC-8 (KAN-191).
//
// Level 0 (Open) is the shipped default: anyone on the printer's network or
// hotspot can use everything here. Level 1 (Protected) takes Wi-Fi, the Aux
// API and updates away from a caller that is only *on the network*. The
// printer's own panel keeps them, and so does a paired device, because both
// have an identity. Printing is never affected.
//
// The level is changed at the printer's panel and nowhere else, so this module
// only ever reads it.

export const LEVEL_OPEN = 0
export const LEVEL_PROTECTED = 1

export type ProtectionLevel = typeof LEVEL_OPEN | typeof LEVEL_PROTECTED

export interface ProtectionStatus {
  level: ProtectionLevel;
  name: string;
  protectedSurfaces: string[];
  excludedSurfaces: string[];
  /** Moonraker's answer for this browser's own connection. */
  callerHasIdentity: boolean;
  changeableByCaller: boolean;
}

export interface ProtectionState {
  /**
   * Whether this Moonraker has the `muon_protection` component. `null` until
   * the server's component list has been read.
   */
  supported: boolean | null;
  status: ProtectionStatus | null;
}
