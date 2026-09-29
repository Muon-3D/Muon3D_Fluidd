/**
 * The API origin Fluidd is told about while a cloud printer is selected. Never
 * dialled: the Iroh transport carries every request.
 *
 * A module of its own, importing nothing, so that a store module can ask
 * whether the selected printer is a cloud one without importing `activate.ts`,
 * which imports the store.
 */
export const MANAGED_API_URL = 'https://muon-cloud.invalid'
export const MANAGED_SOCKET_URL = 'wss://muon-cloud.invalid/websocket'

/** Whether `apiUrl` is the cloud placeholder, that is, a cloud printer is selected. */
export const isManagedApiUrl = (apiUrl: string | null | undefined): boolean =>
  apiUrl === MANAGED_API_URL
