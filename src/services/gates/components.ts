/** The Moonraker components only a Muon printer has. */
export const MUON_COMPONENTS = ['muon_access', 'muon_protection']

/**
 * Whether Moonraker's component list (server.info) is a Muon's: true or
 * false once the list has loaded, null while it has not.
 *
 * Until server.info arrives, and while Klippy restarts, the store holds an
 * empty list. A real Moonraker always reports components (file_manager at
 * the least), so empty means "not received yet", never "not a Muon".
 */
export function muonFromComponents (components: string[] | undefined | null): boolean | null {
  if (!components || components.length === 0) return null
  return MUON_COMPONENTS.some(name => components.includes(name))
}
