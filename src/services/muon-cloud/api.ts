/**
 * The Muon3D account console's HTTP API.
 *
 * Fluidd is served either by the printer (LAN) or by the console itself. In
 * both cases the console is reached at `cloudBaseUrl()`: the page's own origin
 * when the console serves Fluidd, or the URL saved in `muon.cloud.url`.
 */

const TOKEN_KEY = 'muon.cloud.token'
const URL_KEY = 'muon.cloud.url'

export interface CloudAccount {
  id: string;
  email: string;
  name: string;
  created_at: number;
}

export interface CloudPrinter {
  id: string;
  name: string;
  model: string;
  version: string;
  linked_at: number;
  last_seen: number;
  online: boolean;
  online_since: number | null;
}

export interface CloudConfig {
  relay_url: string;
  orchestrator_id: string;
  authority_key: string;
}

export interface AccessHandoff {
  printer_id: string;
  relay_url: string;
  role: string;
  grant_id: string;
  expires_at: number;
}

export type LinkState = 'waiting' | 'awaiting_confirmation' | 'linked' | 'declined' | 'expired'

export class CloudError extends Error {
  constructor (message: string, readonly status: number) {
    super(message)
  }
}

function readStorage (key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage (key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Private mode: the session lasts as long as the tab.
  }
}

export function cloudBaseUrl (): string {
  const saved = readStorage(URL_KEY)
  if (saved) return saved.replace(/\/$/, '')
  const configured = import.meta.env.VITE_MUON_CLOUD_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  return window.location.origin
}

export function setCloudBaseUrl (url: string | null) {
  writeStorage(URL_KEY, url)
}

export function storedToken (): string | null {
  return readStorage(TOKEN_KEY)
}

export function storeToken (token: string | null) {
  writeStorage(TOKEN_KEY, token)
}

async function request<T> (method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const token = storedToken()
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new CloudError('The Muon3D service could not be reached.', 0)
  }
  const text = await response.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new CloudError('The Muon3D service sent an unreadable answer.', response.status)
  }
  if (!response.ok) {
    throw new CloudError(data.error ?? `The Muon3D service answered ${response.status}.`, response.status)
  }
  return data as T
}

export const cloudApi = {
  config: () => request<CloudConfig>('GET', '/v1/config'),
  signIn: (email: string, password: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-in', { email, password }),
  signUp: (email: string, password: string, name: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name }),
  signOut: () => request<{ ok: boolean }>('POST', '/v1/auth/sign-out'),
  me: () => request<{ account: CloudAccount, endpoint_id: string | null }>('GET', '/v1/me'),
  registerEndpoint: (endpointId: string) =>
    request<{ endpoint_id: string }>('PUT', '/v1/me/endpoint', { endpoint_id: endpointId }),
  printers: () => request<{ printers: CloudPrinter[] }>('GET', '/v1/printers'),
  renamePrinter: (id: string, name: string) =>
    request<{ ok: boolean, name: string }>('PATCH', `/v1/printers/${id}`, { name }),
  unlinkPrinter: (id: string) => request<{ ok: boolean }>('DELETE', `/v1/printers/${id}`),
  access: (id: string) => request<AccessHandoff>('POST', `/v1/printers/${id}/access`),
  claim: (claim: { code?: string, printer_id?: string }) =>
    request<{ printer_id: string, name: string, state: LinkState, expires_at: number }>('POST', '/v1/links/claim', claim),
  nearby: (printerIds: string[]) =>
    request<{ waiting: Array<{ printer_id: string, name: string, expires_at: number }> }>(
      'GET', `/v1/links/nearby?printers=${encodeURIComponent(printerIds.join(','))}`),
  linkState: (id: string) => request<{ printer_id: string, state: LinkState }>('GET', `/v1/links/${id}`),
  getLayout: () => request<{ layout: any }>('GET', '/v1/fleet/layout'),
  putLayout: (layout: unknown) => request<{ ok: boolean }>('PUT', '/v1/fleet/layout', { layout })
}
