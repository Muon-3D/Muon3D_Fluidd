/** The Moonraker components only a Muon printer has. */
export const MUON_COMPONENTS = ['muon_access', 'muon_protection']

/** Whether Moonraker's component list (server.info) is a Muon's. */
export function hasMuonComponents (components: string[] | undefined | null): boolean {
  return !!components && MUON_COMPONENTS.some(name => components.includes(name))
}
