import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};import { confirmedAccountId, currentAccount, rotateConfirmed } from "/src/services/muon-cloud/account-events.ts";
import { clearDeletion, deletionRevision, observeDeletion } from "/src/services/muon-cloud/deletion.ts";
import { isPrinterSecureOrigin } from "/src/services/secure-origin/index.ts";
import { rememberRelayUrl } from "/src/services/muon-cloud/relay.ts";
import { noteCloudReached, noteCloudUnreachable } from "/src/services/muon-cloud/outage.ts";
export { deletionState } from "/src/services/muon-cloud/deletion.ts";
export const TOKEN_KEY = "muon.cloud.token";
export const REFRESH_KEY = "muon.cloud.refresh";
const URL_KEY = "muon.cloud.url";
export const CLIENT_ID = "fluidd";
export const PRINTER_CLIENT_ID = "printer-local";
export function clientId(location = globalThis.location) {
  return location && isPrinterSecureOrigin(location) ? PRINTER_CLIENT_ID : CLIENT_ID;
}
export class CloudError extends Error {
  constructor(message, status, code, body = {}, retryAfterMs) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
    this.retryAfterMs = retryAfterMs;
  }
  get deletionPending() {
    return this.status === 403 && this.body.deletion_pending === true;
  }
}
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
  }
}
export const CONSOLE_ORIGINS = ["https://control.muon3d.com", "https://app.muon3d.com"];
export function sameConsole(a, b) {
  const x = a.replace(/\/$/, "");
  const y = b.replace(/\/$/, "");
  return x === y || CONSOLE_ORIGINS.includes(x) && CONSOLE_ORIGINS.includes(y);
}
export function cloudBaseUrl() {
  const saved = cloudTokensPersist() ? readStorage(URL_KEY) : null;
  if (saved) return saved.replace(/\/$/, "");
  if (CONSOLE_ORIGINS.includes(window.location.origin)) return window.location.origin;
  const configured = import.meta.env.VUE_MUON_CLOUD_URL;
  if (configured) return configured.replace(/\/$/, "");
  return window.location.origin;
}
export function setCloudBaseUrl(url) {
  writeStorage(URL_KEY, url);
}
export function cloudTokensPersist(location = globalThis.location) {
  if (!location) return true;
  if (isPrinterSecureOrigin(location)) return false;
  return secureContext(location);
}
function secureContext(location) {
  return location.protocol === "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
}
export function cloudSessionAllowed(location = globalThis.location) {
  if (!location) return false;
  return secureContext(location);
}
export function controlUrl(route = "/") {
  const base = import.meta.env.VUE_MUON_CLOUD_URL?.replace(/\/$/, "") || CONSOLE_ORIGINS[0];
  return `${base}/#${route.startsWith("/") ? route : `/${route}`}`;
}
export const INSECURE_ORIGIN_MESSAGE = "This page is not encrypted, so it cannot sign in to Muon3D. Open Muon Control to use your account.";
function refuseOnInsecureOrigin() {
  throw new CloudError(INSECURE_ORIGIN_MESSAGE, 0, "insecure_origin");
}
const INSECURE_ORIGIN_CALLS = ["GET /v1/config", "GET /v1/links/nearby"];
const memoryTokens = /* @__PURE__ */ new Map();
function readTokenStorage(key) {
  if (!cloudSessionAllowed()) return null;
  if (!cloudTokensPersist()) return memoryTokens.get(key) ?? null;
  return readStorage(key);
}
function writeTokenStorage(key, value) {
  if (!cloudSessionAllowed()) return;
  if (!cloudTokensPersist()) {
    if (value === null) memoryTokens.delete(key);
    else memoryTokens.set(key, value);
    return;
  }
  writeStorage(key, value);
}
try {
  if (!cloudTokensPersist()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
} catch {
}
export function storedToken() {
  return readTokenStorage(TOKEN_KEY);
}
export function storeToken(token) {
  writeTokenStorage(TOKEN_KEY, token);
  if (token === null) clearDeletion();
}
export function storedRefreshToken() {
  return readTokenStorage(REFRESH_KEY);
}
export function storeRefreshToken(token) {
  if (token !== readTokenStorage(REFRESH_KEY)) resetRefreshBackoff();
  writeTokenStorage(REFRESH_KEY, token);
}
async function tokenRequest(form, signal) {
  if (!cloudSessionAllowed()) refuseOnInsecureOrigin();
  let response;
  try {
    response = await fetch(`${cloudBaseUrl()}/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form).toString(),
      signal
    });
  } catch {
    noteCloudUnreachable();
    throw new CloudError("The Muon3D service could not be reached.", 0);
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    throw new CloudError("The Muon3D service sent an unreadable answer.", response.status);
  }
  noteCloudReached();
  if (!response.ok || typeof data.access_token !== "string") {
    const body = typeof data.reason === "string" ? { reason: data.reason } : {};
    throw new CloudError(data.error_description ?? data.error ?? `The Muon3D service answered ${response.status}.`, response.status, data.error, body, retryAfterOf(response));
  }
  return data;
}
export function retryAfterOf(response, now = Date.now()) {
  const raw = response.headers?.get?.("retry-after");
  if (!raw) return void 0;
  const text = raw.trim();
  if (/^\d+$/.test(text)) return Number(text) * 1e3;
  const at = Date.parse(text);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - now);
}
export const REFRESH_BACKOFF_BASE_MS = 2e3;
export const REFRESH_BACKOFF_CAP_MS = 5 * 60 * 1e3;
export const REFRESH_RETRY_AFTER_CAP_MS = 15 * 60 * 1e3;
let refreshNotBefore = 0;
let refreshBackoffs = 0;
export function resetRefreshBackoff() {
  refreshNotBefore = 0;
  refreshBackoffs = 0;
}
function isTransientRefusal(error) {
  return error instanceof CloudError && (error.status === 429 || error.status >= 500);
}
function backOffRefresh(error) {
  const wait = error.retryAfterMs !== void 0 ? Math.max(REFRESH_BACKOFF_BASE_MS, Math.min(error.retryAfterMs, REFRESH_RETRY_AFTER_CAP_MS)) : Math.min(REFRESH_BACKOFF_CAP_MS, REFRESH_BACKOFF_BASE_MS * 2 ** refreshBackoffs);
  refreshBackoffs += 1;
  refreshNotBefore = Date.now() + wait;
}
let refreshing = null;
const REFRESH_LOCK = "muon.cloud.refresh";
export const REFRESH_TIMEOUT_MS = 1e4;
const HOLD_MS = REFRESH_TIMEOUT_MS + 3e3;
const CLAIM_SETTLE_MS = 50;
let recoverSession = null;
export function sessionRefused(sent, reason) {
  const now = storedToken();
  if (now !== null && now !== sent) return;
  try {
    sessionHooks.refused?.(reason);
  } catch {
  }
}
export function setSessionRecovery(recover) {
  recoverSession = recover;
}
export function carryConfirmation(before, next) {
  rotateConfirmed(before, next);
  if (confirmedAccountId(next) === null) sessionHooks.check?.();
}
let sessionHooks = {};
export function setSessionHooks(hooks) {
  sessionHooks = hooks;
}
export async function withRefreshLock(work) {
  const locks = typeof navigator !== "undefined" ? navigator.locks : void 0;
  if (locks && typeof locks.request === "function") {
    return locks.request(REFRESH_LOCK, work);
  }
  if (typeof BroadcastChannel === "undefined") return work();
  return channelLock(work);
}
async function channelLock(work) {
  const channel = new BroadcastChannel(REFRESH_LOCK);
  const id = `${Date.now().toString(36).padStart(10, "0")}-${Math.random().toString(36).slice(2)}`;
  const others = /* @__PURE__ */ new Map();
  let wake = null;
  channel.onmessage = (event) => {
    const message = event.data;
    if (!message || typeof message.id !== "string" || message.id === id) return;
    if (message.type === "claim") {
      if (!others.has(message.id)) channel.postMessage({ type: "present", id });
      others.set(message.id, Date.now() + HOLD_MS);
    } else if (message.type === "present") {
      if (!others.has(message.id)) others.set(message.id, Date.now() + HOLD_MS);
    } else if (message.type === "release") {
      others.delete(message.id);
    }
    wake?.();
  };
  try {
    channel.postMessage({ type: "claim", id });
    await new Promise((resolve) => setTimeout(resolve, CLAIM_SETTLE_MS));
    for (; ; ) {
      const now = Date.now();
      let soonest = Infinity;
      let blocked = false;
      for (const [other, expires] of others) {
        if (expires <= now) others.delete(other);
        else if (other < id) {
          blocked = true;
          soonest = Math.min(soonest, expires);
        }
      }
      if (!blocked) break;
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, Math.max(0, soonest - now));
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      wake = null;
    }
    return await work();
  } finally {
    channel.postMessage({ type: "release", id });
    channel.close();
  }
}
export function refreshOutcome() {
  const refreshToken = storedRefreshToken();
  if (!refreshToken) return Promise.resolve("refused");
  if (!refreshing && Date.now() < refreshNotBefore) return Promise.resolve("unreachable");
  if (!refreshing) {
    refreshing = withRefreshLock(async () => {
      const current = storedRefreshToken();
      if (current !== refreshToken) {
        return current !== null && storedToken() !== null ? "ok" : "refused";
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
      try {
        const session = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: clientId() }, controller.signal);
        if (storedRefreshToken() !== refreshToken) return storedToken() !== null && storedRefreshToken() !== null ? "ok" : "refused";
        const before = storedToken();
        storeToken(session.access_token);
        carryConfirmation(before, session.access_token);
        storeRefreshToken(session.refresh_token);
        resetRefreshBackoff();
        return "ok";
      } catch (error) {
        if (error instanceof CloudError && error.status === 0) return "unreachable";
        if (isTransientRefusal(error)) {
          backOffRefresh(error);
          return "unreachable";
        }
        try {
          if (recoverSession && storedRefreshToken() === refreshToken && await recoverSession(refreshToken)) {
            if (!sessionHooks.recovered || await sessionHooks.recovered()) return "ok";
            return "refused";
          }
        } catch {
        }
        if (storedRefreshToken() === refreshToken) {
          try {
            sessionHooks.refused?.(refusalReason(error));
          } catch {
          }
          storeToken(null);
          storeRefreshToken(null);
        }
        return "refused";
      } finally {
        clearTimeout(timer);
      }
    }).catch(() => "unreachable").finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}
function refusalReason(error) {
  return error instanceof CloudError && typeof error.body.reason === "string" ? error.body.reason : void 0;
}
export async function refreshSession() {
  return await refreshOutcome() === "ok";
}
const CLOUD_REQUEST_TIMEOUT_MS = 12e3;
async function request(method, path, body, token = storedToken(), retry = true, stillMine, timeoutMs = CLOUD_REQUEST_TIMEOUT_MS) {
  if (!cloudSessionAllowed() && (token || !INSECURE_ORIGIN_CALLS.includes(`${method} ${path}`))) refuseOnInsecureOrigin();
  const startedAt = deletionRevision();
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== void 0) headers["content-type"] = "application/json";
  let response;
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    response = await fetch(`${cloudBaseUrl()}${path}`, {
      method,
      headers,
      body: body === void 0 ? void 0 : JSON.stringify(body),
      signal: controller?.signal
    });
  } catch {
    noteCloudUnreachable();
    throw new CloudError("The Muon3D service could not be reached.", 0);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
  noteCloudReached();
  if (response.status === 401 && retry && token !== null && (!stillMine || stillMine())) {
    const currentToken = storedToken();
    if (currentToken && token !== currentToken) {
      return request(method, path, body, storedToken(), false, void 0, timeoutMs);
    }
    if (currentToken) {
      const outcome = await refreshOutcome();
      if (outcome === "ok" && (!stillMine || stillMine())) return request(method, path, body, storedToken(), false, void 0, timeoutMs);
      if (outcome === "unreachable") throw new CloudError("The Muon3D service could not be reached.", 0);
    }
  }
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new CloudError("The Muon3D service sent an unreadable answer.", response.status);
  }
  if (!response.ok) {
    if (token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt);
    const message = response.status === 403 && data.deletion_pending === true ? "Your account is waiting to be deleted." : data.error ?? `The Muon3D service answered ${response.status}.`;
    throw new CloudError(message, response.status, void 0, data);
  }
  if (token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt);
  return data;
}
let knownSession = null;
function noteSessionId(answer) {
  if (typeof answer.session_id === "string" && answer.session_id && answer.account?.id) knownSession = { accountId: answer.account.id, id: answer.session_id };
  return answer;
}
export function currentSessionId(accountId) {
  return knownSession && accountId && knownSession.accountId === accountId ? knownSession.id : null;
}
export function forgetSessionId() {
  knownSession = null;
}
export const ME_TIMEOUT_MS = 8e3;
export const cloudApi = {
  config: async () => {
    const config = await request("GET", "/v1/config");
    rememberRelayUrl(config.relay_url);
    return config;
  },
  signIn: (email, password) => request("POST", "/v1/auth/sign-in", { email, password }),
  /** The code that finishes a two-step sign-in: an authenticator code or a recovery code, with the `mfa_token` the password step answered. */
  signInCode: (mfaToken, code) => request("POST", "/v1/auth/mfa", { mfa_token: mfaToken, code }, null, false),
  signUp: (email, password, name, declaredAge) => request("POST", "/v1/auth/sign-up", { email, password, name, declared_age: declaredAge }),
  signOut: () => request("POST", "/v1/auth/sign-out"),
  me: async () => noteSessionId(await request("GET", "/v1/me", void 0, storedToken(), true, void 0, ME_TIMEOUT_MS)),
  /** `me` that never refreshes: for use while a refresh is itself in progress (it would wait for itself). */
  meWithoutRefresh: async () => noteSessionId(await request("GET", "/v1/me", void 0, storedToken(), false)),
  /**
   * A signed assertion of this account for another Muon3D service (the
   * model service's Library), which never sees the console session. It lives
   * minutes; `expires_at` is in seconds.
   */
  assertion: (audience) => {
    const owner = currentAccount().id;
    return request("POST", "/v1/me/assertion", { audience }, storedToken(), true, () => owner !== null && currentAccount().id === owner);
  },
  registerEndpoint: (endpointId) => request("PUT", "/v1/me/endpoint", { endpoint_id: endpointId }),
  printers: () => request("GET", "/v1/printers"),
  renamePrinter: (id, name) => request("PATCH", `/v1/printers/${id}`, { name }),
  /** The owner sets who finds the printer. `404` for anyone else, `400` for an unknown level. */
  setDiscovery: (id, level) => request("PUT", `/v1/printers/${id}/discovery`, { level }),
  notices: (limit = 50) => request("GET", `/v1/me/notices?limit=${limit}`),
  readNotice: (id) => request("POST", `/v1/me/notices/${encodeURIComponent(id)}/read`),
  unlinkPrinter: (id) => request("DELETE", `/v1/printers/${id}`),
  access: (id) => request("POST", `/v1/printers/${id}/access`),
  /** Claims the printer showing `code` on its screen. The code is the only way to link. */
  claim: (code) => request("POST", "/v1/links/claim", { code }),
  /** Asks a printer on this browser's network to show a link code. Links nothing by itself. */
  startLink: (printerId) => request("POST", "/v1/links/start", { printer_id: printerId }),
  /** Printers on this browser's network, as the Muon3D service sees them. No sign-in needed. */
  nearby: () => request("GET", "/v1/links/nearby"),
  linkState: (id) => request("GET", `/v1/links/${id}`),
  getLayout: () => request("GET", "/v1/fleet/layout"),
  putLayout: (layout, stillMine) => request("PUT", "/v1/fleet/layout", { layout }, storedToken(), true, stillMine),
  /** The central login's code exchange (`WEB-12`). */
  exchangeCode: (code, redirectUri, verifier, signal) => tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId(), code_verifier: verifier }, signal),
  /**
   * A single-use code that opens the console's browser session at
   * `/handoff`. Takes the token of a session that signed in here, which is
   * never a `/token` session (those get `403`).
   */
  handoff: (token) => request("POST", "/v1/handoff", void 0, token, false),
  /** Signs in with a password for a session that is not kept: the sign-in page hands it off. */
  signInFor: (email, password) => request("POST", "/v1/auth/sign-in", { email, password, device: "Muon3D sign-in" }, null, false),
  signUpFor: (email, password, name, declaredAge) => request("POST", "/v1/auth/sign-up", { email, password, name, declared_age: declaredAge, device: "Muon3D sign-in" }, null, false),
  /** Joins with an invite link's code (AB-CON-1). */
  join: (code) => request("POST", `/v1/links/join/${encodeURIComponent(code)}`),
  approval: (id) => request("GET", `/v1/approvals/${encodeURIComponent(id)}`)
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoZSBNdW9uM0QgYWNjb3VudCBjb25zb2xlJ3MgSFRUUCBBUEkuXG4gKlxuICogRmx1aWRkIGlzIHNlcnZlZCBlaXRoZXIgYnkgdGhlIHByaW50ZXIgKExBTikgb3IgYnkgdGhlIGNvbnNvbGUgaXRzZWxmLiBJblxuICogYm90aCBjYXNlcyB0aGUgY29uc29sZSBpcyByZWFjaGVkIGF0IGBjbG91ZEJhc2VVcmwoKWA6IHRoZSBwYWdlJ3Mgb3duIG9yaWdpblxuICogd2hlbiB0aGUgY29uc29sZSBzZXJ2ZXMgRmx1aWRkLCBvciB0aGUgVVJMIHNhdmVkIGluIGBtdW9uLmNsb3VkLnVybGAuXG4gKi9cblxuaW1wb3J0IHsgY29uZmlybWVkQWNjb3VudElkLCBjdXJyZW50QWNjb3VudCwgcm90YXRlQ29uZmlybWVkIH0gZnJvbSAnLi9hY2NvdW50LWV2ZW50cydcbmltcG9ydCB7IGNsZWFyRGVsZXRpb24sIGRlbGV0aW9uUmV2aXNpb24sIG9ic2VydmVEZWxldGlvbiB9IGZyb20gJy4vZGVsZXRpb24nXG5pbXBvcnQgeyBpc1ByaW50ZXJTZWN1cmVPcmlnaW4gfSBmcm9tICdAL3NlcnZpY2VzL3NlY3VyZS1vcmlnaW4nXG5pbXBvcnQgeyByZW1lbWJlclJlbGF5VXJsIH0gZnJvbSAnLi9yZWxheSdcbmltcG9ydCB7IG5vdGVDbG91ZFJlYWNoZWQsIG5vdGVDbG91ZFVucmVhY2hhYmxlIH0gZnJvbSAnLi9vdXRhZ2UnXG5leHBvcnQgeyBkZWxldGlvblN0YXRlIH0gZnJvbSAnLi9kZWxldGlvbidcblxuZXhwb3J0IGNvbnN0IFRPS0VOX0tFWSA9ICdtdW9uLmNsb3VkLnRva2VuJ1xuLyoqIE9ubHkgYSBjZW50cmFsLWxvZ2luIHNlc3Npb24gKGBXRUItMTJgKSBoYXMgb25lOyBpdCByZWZyZXNoZXMgYXQgYC90b2tlbmAuICovXG5leHBvcnQgY29uc3QgUkVGUkVTSF9LRVkgPSAnbXVvbi5jbG91ZC5yZWZyZXNoJ1xuY29uc3QgVVJMX0tFWSA9ICdtdW9uLmNsb3VkLnVybCdcblxuLyoqIFRoaXMgc3VyZmFjZSdzIGlkIGluIHRoZSBjb25zb2xlJ3MgY2xpZW50IHJlZ2lzdHJ5IChgY2xpZW50cy5qc29uYCkuICovXG5leHBvcnQgY29uc3QgQ0xJRU5UX0lEID0gJ2ZsdWlkZCdcblxuLyoqIFRoZSBjb25zb2xlIGNsaWVudCBmb3IgYSBwYWdlIG9uIGEgcHJpbnRlcidzIG93biBzZWN1cmUgYWRkcmVzcyAoS0FOLTIxOTgpOiBubyByZWZyZXNoIHRva2VuLCBhIHNob3J0IGFjY2VzcyB0b2tlbi4gKi9cbmV4cG9ydCBjb25zdCBQUklOVEVSX0NMSUVOVF9JRCA9ICdwcmludGVyLWxvY2FsJ1xuXG4vKiogVGhlIGBjbGllbnRfaWRgIHRoaXMgcGFnZSBzZW5kcyB0byB0aGUgY29uc29sZTogb25lIGNob2ljZSwgdXNlZCBieSBldmVyeSBjYWxsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsaWVudElkIChsb2NhdGlvbjogUGljazxMb2NhdGlvbiwgJ3Byb3RvY29sJyB8ICdob3N0bmFtZSc+IHwgdW5kZWZpbmVkID0gZ2xvYmFsVGhpcy5sb2NhdGlvbik6IHN0cmluZyB7XG4gIHJldHVybiBsb2NhdGlvbiAmJiBpc1ByaW50ZXJTZWN1cmVPcmlnaW4obG9jYXRpb24pID8gUFJJTlRFUl9DTElFTlRfSUQgOiBDTElFTlRfSURcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZEFjY291bnQge1xuICBpZDogc3RyaW5nO1xuICBlbWFpbDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNyZWF0ZWRfYXQ6IG51bWJlcjtcbiAgZGVsZXRpb24/OiB7IHJlcXVlc3RlZF9hdDogbnVtYmVyLCBkZWxldGVfYWZ0ZXI6IG51bWJlciB9IHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZFByaW50ZXIge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZztcbiAgbGlua2VkX2F0OiBudW1iZXI7XG4gIGxhc3Rfc2VlbjogbnVtYmVyO1xuICBvbmxpbmU6IGJvb2xlYW47XG4gIG9ubGluZV9zaW5jZTogbnVtYmVyIHwgbnVsbDtcbiAgLyoqXG4gICAqIFRoZSBhY2NvdW50J3Mgcm9sZSBvbiB0aGlzIHByaW50ZXI6IGBvcGVyYXRvcmAgZm9yIGEgcHJpbnRlciB0aGVcbiAgICogYWNjb3VudCBsaW5rZWQgKGl0cyBvd25lcikgb3IgYSBzaGFyZSB0byBvcGVyYXRlIGl0LCBgdmlld2VyYCBmb3IgYVxuICAgKiBzaGFyZSB0byB3YXRjaCBpdC4gQWJzZW50IGZyb20gYW4gb2xkZXIgY29uc29sZS5cbiAgICovXG4gIHJvbGU/OiAnb3BlcmF0b3InIHwgJ3ZpZXdlcic7XG4gIC8qKiBBIGxpdmUgc2hhcmUgdG8gdGhpcyBhY2NvdW50LCBub3QgYSBwcmludGVyIGl0IGxpbmtlZC4gKi9cbiAgc2hhcmVkPzogYm9vbGVhbjtcbiAgLyoqIFdoZW4gYSBzaGFyZSBlbmRzIChzZWNvbmRzKSwgb3IgbnVsbC4gKi9cbiAgZW5kc19hdD86IG51bWJlciB8IG51bGw7XG4gIC8qKiBUaGUgc2hhcmVyJ3MgZGlzcGxheSBuYW1lIChuZXZlciBhbiBhZGRyZXNzKSwgb24gYSBzaGFyZWQgcHJpbnRlci4gKi9cbiAgc2hhcmVkX2J5Pzogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFRoZSBzYW1lIHNoYXJlciwgc3RydWN0dXJlZCAobXVvbi1saW5rLWNsb3VkICMxMTUpLiAqL1xuICBzaGFyZXI/OiBTaGFyZXIgfCBudWxsO1xuICAvKiogV2hvIGZpbmRzIHRoZSBwcmludGVyIGluIHRoZSBuZWFyYnkgbGlzdC4gT25seSBvbiBhIHByaW50ZXIgdGhpcyBhY2NvdW50IGxpbmtlZCAoIzExNCkuICovXG4gIGRpc2NvdmVyeT86IERpc2NvdmVyeUxldmVsIHwgbnVsbDtcbiAgLyoqIFRoZSBwcmludGVyJ3Mgb3duIEhUVFBTIG5hbWUgd2hpbGUgaXRzIGNlcnRpZmljYXRlIGxhc3RzLCBlbHNlIG51bGwgKG11b24tbGluay1jbG91ZCAjMTMzKS4gKi9cbiAgc2VjdXJlX25hbWU/OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNoYXJlciB7XG4gIGFjY291bnRfaWQ6IHN0cmluZztcbiAgZGlzcGxheV9uYW1lOiBzdHJpbmc7XG59XG5cbi8qKiBgb3BlbmAgZXZlcnlvbmU7IGBzaWduZWRfaW5gIGFueW9uZSBzaWduZWQgaW47IGBjaG9zZW5gIHlvdSBhbmQgcGVvcGxlIHlvdSBzaGFyZSB3aXRoOyBgbGlua2AgeW91IGFuZCBhbnlvbmUgd2l0aCBhbiBpbnZpdGUgbGluay4gKi9cbmV4cG9ydCB0eXBlIERpc2NvdmVyeUxldmVsID0gJ29wZW4nIHwgJ3NpZ25lZF9pbicgfCAnY2hvc2VuJyB8ICdsaW5rJ1xuXG4vKiogQSBub3RlIGZvciB0aGUgc2lnbmVkLWluIGFjY291bnQgKG11b24tbGluay1jbG91ZCAjMTE2KS4gTmV3ZXN0IGZpcnN0LiAqL1xuZXhwb3J0IGludGVyZmFjZSBOb3RpY2Uge1xuICBpZDogc3RyaW5nO1xuICBraW5kOiBzdHJpbmc7XG4gIHByaW50ZXJfaWQ6IHN0cmluZyB8IG51bGw7XG4gIHNoYXJlZF9ieTogc3RyaW5nIHwgbnVsbDtcbiAgc2hhcmVyOiBTaGFyZXIgfCBudWxsO1xuICBjcmVhdGVkX2F0OiBudW1iZXI7XG4gIHJlYWRfYXQ6IG51bWJlciB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xvdWRDb25maWcge1xuICByZWxheV91cmw6IHN0cmluZztcbiAgb3JjaGVzdHJhdG9yX2lkOiBzdHJpbmc7XG4gIGF1dGhvcml0eV9rZXk6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY2Nlc3NIYW5kb2ZmIHtcbiAgcHJpbnRlcl9pZDogc3RyaW5nO1xuICByZWxheV91cmw6IHN0cmluZztcbiAgcm9sZTogc3RyaW5nO1xuICBncmFudF9pZDogc3RyaW5nO1xuICBleHBpcmVzX2F0OiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIExpbmtTdGF0ZSA9ICd3YWl0aW5nJyB8ICdhd2FpdGluZ19jb25maXJtYXRpb24nIHwgJ2xpbmtlZCcgfCAnZGVjbGluZWQnIHwgJ2V4cGlyZWQnXG5cbi8qKiBXaGF0IGBQT1NUIC90b2tlbmAgYW5zd2VyczogYSByb3RhdGluZyBzZXNzaW9uIGlzc3VlZCB0byB0aGlzIGNsaWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVG9rZW5TZXNzaW9uIHtcbiAgYWNjZXNzX3Rva2VuOiBzdHJpbmc7XG4gIHJlZnJlc2hfdG9rZW46IHN0cmluZztcbiAgdG9rZW5fdHlwZTogc3RyaW5nO1xuICBleHBpcmVzX2luOiBudW1iZXI7XG4gIGFjY291bnQ/OiBDbG91ZEFjY291bnQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwcm92YWwge1xuICBpZDogc3RyaW5nO1xuICBraW5kOiAnbGlua19qb2luJztcbiAgcHJpbnRlcl9pZDogc3RyaW5nO1xuICBwcmludGVyX25hbWU6IHN0cmluZztcbiAgbGlua19pZDogc3RyaW5nO1xuICByb2xlOiBzdHJpbmc7XG4gIHN0YXRlOiAncGVuZGluZycgfCAnYWxsb3dlZCcgfCAncmVmdXNlZCcgfCAnZXhwaXJlZCc7XG4gIGNyZWF0ZWRfYXQ6IG51bWJlcjtcbiAgZXhwaXJlc19hdDogbnVtYmVyO1xuICBhbnN3ZXJlZF9hdDogbnVtYmVyIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaGFyZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHByaW50ZXJfaWQ6IHN0cmluZztcbiAgZW1haWw6IHN0cmluZztcbiAgcm9sZTogc3RyaW5nO1xuICBsZXZlbDogc3RyaW5nO1xuICBlbmRzX2F0OiBudW1iZXIgfCBudWxsO1xuICBjcmVhdGVkX2F0OiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIEpvaW5BbnN3ZXIgPVxuICB8IHsgc3RhdGU6ICdqb2luZWQnLCBwcmludGVyX2lkOiBzdHJpbmcsIHNoYXJlOiBTaGFyZSB9XG4gIHwgeyBzdGF0ZTogJ3BlbmRpbmcnLCBwcmludGVyX2lkOiBzdHJpbmcsIGFwcHJvdmFsOiBBcHByb3ZhbCB9XG5cbmV4cG9ydCBjbGFzcyBDbG91ZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvciAobWVzc2FnZTogc3RyaW5nLCByZWFkb25seSBzdGF0dXM6IG51bWJlciwgcmVhZG9ubHkgY29kZT86IHN0cmluZywgcmVhZG9ubHkgYm9keTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fSwgcmVhZG9ubHkgcmV0cnlBZnRlck1zPzogbnVtYmVyKSB7XG4gICAgc3VwZXIobWVzc2FnZSlcbiAgfVxuXG4gIGdldCBkZWxldGlvblBlbmRpbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cyA9PT0gNDAzICYmIHRoaXMuYm9keS5kZWxldGlvbl9wZW5kaW5nID09PSB0cnVlXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZFN0b3JhZ2UgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSlcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZVN0b3JhZ2UgKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICB0cnkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuICAgIGVsc2UgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWx1ZSlcbiAgfSBjYXRjaCB7XG4gICAgLy8gUHJpdmF0ZSBtb2RlOiB0aGUgc2Vzc2lvbiBsYXN0cyBhcyBsb25nIGFzIHRoZSB0YWIuXG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgcHJvZHVjdGlvbiBjb25zb2xlJ3MgdHdvIG5hbWVzIChLQU4tNDE0KS4gY29udHJvbC5tdW9uM2QuY29tIGlzIGl0cyBuYW1lXG4gKiBmcm9tIEtBTi00MDQgb247IGFwcC5tdW9uM2QuY29tIGtlZXBzIGFuc3dlcmluZyB3aGlsZSBwcmludGVycyBhbmQgaW5zdGFsbGVkXG4gKiBhcHBzIHN0aWxsIHVzZSBpdC4gVGhlIGNvbnNvbGUgc2VydmVzIHRoaXMgcGFnZSB1bmRlciBlaXRoZXIsIGFuZCBib3RoIGFyZVxuICogdGhlIHNhbWUgY29uc29sZTogdGhlIHNhbWUgYWNjb3VudHMsIHNlc3Npb25zIGFuZCBjb2Rlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IENPTlNPTEVfT1JJR0lOUzogcmVhZG9ubHkgc3RyaW5nW10gPSBbJ2h0dHBzOi8vY29udHJvbC5tdW9uM2QuY29tJywgJ2h0dHBzOi8vYXBwLm11b24zZC5jb20nXVxuXG4vKiogV2hldGhlciBgYWAgYW5kIGBiYCBhcmUgb25lIGNvbnNvbGU6IHRoZSBzYW1lIG9yaWdpbiwgb3IgaXRzIHR3byBuYW1lcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW1lQ29uc29sZSAoYTogc3RyaW5nLCBiOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgeCA9IGEucmVwbGFjZSgvXFwvJC8sICcnKVxuICBjb25zdCB5ID0gYi5yZXBsYWNlKC9cXC8kLywgJycpXG4gIHJldHVybiB4ID09PSB5IHx8IChDT05TT0xFX09SSUdJTlMuaW5jbHVkZXMoeCkgJiYgQ09OU09MRV9PUklHSU5TLmluY2x1ZGVzKHkpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvdWRCYXNlVXJsICgpOiBzdHJpbmcge1xuICAvLyBBIHNhdmVkIGNvbnNvbGUgYWRkcmVzcyBpcyBob25vdXJlZCBvbmx5IHdoZXJlIHRoZSBwYWdlJ3Mgc3RvcmFnZSBjYW4gYmVcbiAgLy8gdHJ1c3RlZC4gT24gYSBwbGFpbi1IVFRQIHBhZ2UgYW55dGhpbmcgb24gdGhlIG5ldHdvcmsgY2FuIHdyaXRlIGl0LCBhbmRcbiAgLy8gd291bGQgY2hvb3NlIHdoZXJlIHRoZSBwYWdlJ3MgY2FsbHMgYW5kIFwib3BlblwiIGxpbmtzIGdvIChLQU4tMjE5MikuXG4gIGNvbnN0IHNhdmVkID0gY2xvdWRUb2tlbnNQZXJzaXN0KCkgPyByZWFkU3RvcmFnZShVUkxfS0VZKSA6IG51bGxcbiAgaWYgKHNhdmVkKSByZXR1cm4gc2F2ZWQucmVwbGFjZSgvXFwvJC8sICcnKVxuICAvLyBBIHBhZ2UgdGhlIGNvbnNvbGUgc2VydmVzIHRhbGtzIHRvIHRoZSBjb25zb2xlIHVuZGVyIHRoZSBuYW1lIGl0IHdhc1xuICAvLyBvcGVuZWQgYnksIHdoaWNoZXZlciBuYW1lIHRoZSBidWlsZCB3YXMgbWFkZSBmb3I6IGl0cyBzaWduLWluLCBpdHMgY29va2llXG4gIC8vIGFuZCBpdHMgcmVkaXJlY3QgVVJJIGFsbCBiZWxvbmcgdG8gdGhhdCBuYW1lLlxuICBpZiAoQ09OU09MRV9PUklHSU5TLmluY2x1ZGVzKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pKSByZXR1cm4gd2luZG93LmxvY2F0aW9uLm9yaWdpblxuICBjb25zdCBjb25maWd1cmVkID0gaW1wb3J0Lm1ldGEuZW52LlZVRV9NVU9OX0NMT1VEX1VSTCBhcyBzdHJpbmcgfCB1bmRlZmluZWRcbiAgaWYgKGNvbmZpZ3VyZWQpIHJldHVybiBjb25maWd1cmVkLnJlcGxhY2UoL1xcLyQvLCAnJylcbiAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5vcmlnaW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENsb3VkQmFzZVVybCAodXJsOiBzdHJpbmcgfCBudWxsKSB7XG4gIHdyaXRlU3RvcmFnZShVUkxfS0VZLCB1cmwpXG59XG5cbi8qKlxuICogV2hldGhlciBjbG91ZCB0b2tlbnMgbWF5IHNpdCBpbiBsb2NhbFN0b3JhZ2Ugb24gdGhpcyBvcmlnaW4gKEtBTi0xODAwLFxuICogSDIvQjkpLiBQbGFpbiBIVFRQIG9uIHRoZSBwcmludGVyJ3Mgb3duIGFkZHJlc3MgKGAqLmxvY2FsYCwgMTAuNDIuMC4xIG9uXG4gKiB0aGUgaG90c3BvdCwgYW55IExBTiBJUCkgbGV0cyBhbnlvbmUgb24gdGhlIG5ldHdvcmsgcmVhZCBvciBpbmplY3Qgc2NyaXB0XG4gKiBpbnRvIHRoZSBvcmlnaW4sIHNvIHRoZSBsb25nLWxpdmVkIHBhaXIgbXVzdCBub3Qgb3V0bGl2ZSB0aGUgdGFiIHRoZXJlLlxuICogSFRUUFMgYW5kIGxvb3BiYWNrIChhIHNlY3VyZSBjb250ZXh0LCBhbmQgdGhlIGRldiBzZXJ2ZXIpIGtlZXAgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG91ZFRva2Vuc1BlcnNpc3QgKGxvY2F0aW9uOiBQaWNrPExvY2F0aW9uLCAncHJvdG9jb2wnIHwgJ2hvc3RuYW1lJz4gfCB1bmRlZmluZWQgPSBnbG9iYWxUaGlzLmxvY2F0aW9uKTogYm9vbGVhbiB7XG4gIC8vIE5vIHBhZ2UgKGEgd29ya2VyIG9yIGEgdGVzdCBpbiBub2RlKTogbm90aGluZyB0byBqdWRnZSwga2VlcCB0aGUgb2xkIHBhdGguXG4gIGlmICghbG9jYXRpb24pIHJldHVybiB0cnVlXG4gIC8vIEEgcHJpbnRlcidzIG93biBzZWN1cmUgYWRkcmVzcyBob2xkcyB0aGUgc2Vzc2lvbiBpbiBtZW1vcnkgb25seSAoS0FOLTIxOTgpLlxuICBpZiAoaXNQcmludGVyU2VjdXJlT3JpZ2luKGxvY2F0aW9uKSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiBzZWN1cmVDb250ZXh0KGxvY2F0aW9uKVxufVxuXG5mdW5jdGlvbiBzZWN1cmVDb250ZXh0IChsb2NhdGlvbjogUGljazxMb2NhdGlvbiwgJ3Byb3RvY29sJyB8ICdob3N0bmFtZSc+KTogYm9vbGVhbiB7XG4gIHJldHVybiBsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgfHwgWydsb2NhbGhvc3QnLCAnMTI3LjAuMC4xJywgJ1s6OjFdJ10uaW5jbHVkZXMobG9jYXRpb24uaG9zdG5hbWUpXG59XG5cbi8qKlxuICogV2hldGhlciB0aGlzIHBhZ2UgbWF5IGhvbGQgYSBNdW9uM0QgYWNjb3VudCBzZXNzaW9uIGF0IGFsbCAoS0FOLTIxOTIsIHRoZVxuICogd2hvbGUgb2YgSDIvQjk6IFwibm8gY3JlZGVudGlhbCBtYXkgZXZlciBiZSBzdG9yZWQgb3IgdXNlZCBvbiBhbiBodHRwOi8vXG4gKiBvcmlnaW5cIikuIFRoZSBwbGFpbi1IVFRQIHByaW50ZXIgYWRkcmVzcyBoYXMgdG8gc3RheSBmb3IgdGhlIGhvdHNwb3QsIHNldHVwXG4gKiB3aXRoIG5vIGludGVybmV0IGFuZCBgbXVvbjNkLmxvY2FsYCwgYW5kIGFueW9uZSBvbiB0aGUgbmV0d29yayBjYW4gYW5zd2VyXG4gKiBmb3IgaXQgb3IgY2hhbmdlIHRoZSBwYWdlLiBTbyB0aGVyZSB0aGUgcGFnZSB0YWtlcyBubyBwYXNzd29yZCwgaG9sZHMgbm9cbiAqIHRva2VuIGV2ZW4gaW4gbWVtb3J5LCBhbmQgbmV2ZXIgbWFrZXMgb3IgcmVhZHMgdGhlIGJyb3dzZXIncyBJcm9oIGtleTpcbiAqIGFjY291bnQgZmVhdHVyZXMgYXJlIG9uZSBsaW5rIHRvIHRoZSBjb25zb2xlIChgY29udHJvbFVybGApLiBIVFRQUyBhbmRcbiAqIGxvb3BiYWNrIGtlZXAgdGhlIHNlc3Npb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG91ZFNlc3Npb25BbGxvd2VkIChsb2NhdGlvbjogUGljazxMb2NhdGlvbiwgJ3Byb3RvY29sJyB8ICdob3N0bmFtZSc+IHwgdW5kZWZpbmVkID0gZ2xvYmFsVGhpcy5sb2NhdGlvbik6IGJvb2xlYW4ge1xuICAvLyBObyBwYWdlIHRvIGp1ZGdlOiByZWZ1c2UuIEEgZ2F0ZSBkb2VzIG5vdCBwYXNzIHdoYXQgaXQgY2Fubm90IHNlZS5cbiAgaWYgKCFsb2NhdGlvbikgcmV0dXJuIGZhbHNlXG4gIHJldHVybiBzZWN1cmVDb250ZXh0KGxvY2F0aW9uKVxufVxuXG4vKiogVGhlIGNvbnNvbGUgcGFnZSB0aGF0IGRvZXMgd2hhdCB0aGlzIHBhZ2UgbWF5IG5vdDogYHJvdXRlYCBpcyBhIGhhc2ggcm91dGUgc3VjaCBhcyBgL2FjY291bnRgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRyb2xVcmwgKHJvdXRlID0gJy8nKTogc3RyaW5nIHtcbiAgY29uc3QgYmFzZSA9IChpbXBvcnQubWV0YS5lbnYuVlVFX01VT05fQ0xPVURfVVJMIGFzIHN0cmluZyB8IHVuZGVmaW5lZCk/LnJlcGxhY2UoL1xcLyQvLCAnJykgfHwgQ09OU09MRV9PUklHSU5TWzBdXG4gIHJldHVybiBgJHtiYXNlfS8jJHtyb3V0ZS5zdGFydHNXaXRoKCcvJykgPyByb3V0ZSA6IGAvJHtyb3V0ZX1gfWBcbn1cblxuLyoqIFdoYXQgZXZlcnkgcmVmdXNlZCBhY2NvdW50IGNhbGwgb24gYSBwbGFpbi1IVFRQIHBhZ2Ugc2F5cy4gKi9cbmV4cG9ydCBjb25zdCBJTlNFQ1VSRV9PUklHSU5fTUVTU0FHRSA9ICdUaGlzIHBhZ2UgaXMgbm90IGVuY3J5cHRlZCwgc28gaXQgY2Fubm90IHNpZ24gaW4gdG8gTXVvbjNELiBPcGVuIE11b24gQ29udHJvbCB0byB1c2UgeW91ciBhY2NvdW50LidcblxuZnVuY3Rpb24gcmVmdXNlT25JbnNlY3VyZU9yaWdpbiAoKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgQ2xvdWRFcnJvcihJTlNFQ1VSRV9PUklHSU5fTUVTU0FHRSwgMCwgJ2luc2VjdXJlX29yaWdpbicpXG59XG5cbi8vIFRoZSBvbmx5IGNvbnNvbGUgY2FsbHMgYSBwbGFpbi1IVFRQIHBhZ2UgbWFrZXM6IHRoZSB0d28gdGhhdCBuZWVkIG5vXG4vLyBhY2NvdW50IGFuZCBjYXJyeSBub3RoaW5nIG9mIHRoZSBwZXJzb24ncy4gQW4gYWxsb3ctbGlzdCwgc28gYSByb3V0ZSBhZGRlZFxuLy8gbGF0ZXIgaXMgcmVmdXNlZCB0aGVyZSB1bnRpbCBzb21lYm9keSBkZWNpZGVzIGl0IGlzIHNhZmUuXG5jb25zdCBJTlNFQ1VSRV9PUklHSU5fQ0FMTFM6IHJlYWRvbmx5IHN0cmluZ1tdID0gWydHRVQgL3YxL2NvbmZpZycsICdHRVQgL3YxL2xpbmtzL25lYXJieSddXG5cbi8vIFRva2VucyBvZiBhIHBhZ2UgdGhhdCBtYXkgaG9sZCBhIHNlc3Npb24gYnV0IG5vdCBwZXJzaXN0IGl0IChhIHByaW50ZXInc1xuLy8gc2VjdXJlIGFkZHJlc3MsIEtBTi0yMTk4KTogdGhleSBsYXN0IGFzIGxvbmcgYXMgdGhlIHBhZ2UuXG5jb25zdCBtZW1vcnlUb2tlbnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5cbmZ1bmN0aW9uIHJlYWRUb2tlblN0b3JhZ2UgKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghY2xvdWRTZXNzaW9uQWxsb3dlZCgpKSByZXR1cm4gbnVsbFxuICBpZiAoIWNsb3VkVG9rZW5zUGVyc2lzdCgpKSByZXR1cm4gbWVtb3J5VG9rZW5zLmdldChrZXkpID8/IG51bGxcbiAgcmV0dXJuIHJlYWRTdG9yYWdlKGtleSlcbn1cblxuZnVuY3Rpb24gd3JpdGVUb2tlblN0b3JhZ2UgKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICAvLyBOb3QgYWxsb3dlZDogdGhlIHRva2VuIGlzIGRyb3BwZWQsIG5vdCBrZXB0IGluIG1lbW9yeS4gTm90aGluZyB0byByZWFkXG4gIC8vIG1lYW5zIG5vdGhpbmcgZm9yIGluamVjdGVkIHNjcmlwdCB0byB0YWtlLlxuICBpZiAoIWNsb3VkU2Vzc2lvbkFsbG93ZWQoKSkgcmV0dXJuXG4gIGlmICghY2xvdWRUb2tlbnNQZXJzaXN0KCkpIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIG1lbW9yeVRva2Vucy5kZWxldGUoa2V5KVxuICAgIGVsc2UgbWVtb3J5VG9rZW5zLnNldChrZXksIHZhbHVlKVxuICAgIHJldHVyblxuICB9XG4gIHdyaXRlU3RvcmFnZShrZXksIHZhbHVlKVxufVxuXG4vLyBNaWdyYXRpb246IGFuIG9sZGVyIGJ1aWxkIHN0b3JlZCB0aGUgcGFpciBpbiBsb2NhbFN0b3JhZ2Ugb24gdGhpcyBvcmlnaW4uXG4vLyBSZW1vdmUgaXQgb24gZmlyc3QgbG9hZCBzbyBpdCBjYW5ub3QgYmUgcmVhZCBsYXRlci5cbnRyeSB7XG4gIGlmICghY2xvdWRUb2tlbnNQZXJzaXN0KCkpIHtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShUT0tFTl9LRVkpXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oUkVGUkVTSF9LRVkpXG4gIH1cbn0gY2F0Y2gge1xuICAvLyBObyBzdG9yYWdlOiBub3RoaW5nIHRvIGNsZWFyLlxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVkVG9rZW4gKCk6IHN0cmluZyB8IG51bGwge1xuICByZXR1cm4gcmVhZFRva2VuU3RvcmFnZShUT0tFTl9LRVkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVRva2VuICh0b2tlbjogc3RyaW5nIHwgbnVsbCkge1xuICB3cml0ZVRva2VuU3RvcmFnZShUT0tFTl9LRVksIHRva2VuKVxuICBpZiAodG9rZW4gPT09IG51bGwpIGNsZWFyRGVsZXRpb24oKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVkUmVmcmVzaFRva2VuICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgcmV0dXJuIHJlYWRUb2tlblN0b3JhZ2UoUkVGUkVTSF9LRVkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVJlZnJlc2hUb2tlbiAodG9rZW46IHN0cmluZyB8IG51bGwpIHtcbiAgLy8gQSBuZXcgc2Vzc2lvbiAob3Igbm9uZSkgc3RhcnRzIHdpdGggbm8gcmVmcmVzaCBiYWNrb2ZmOiBhIHNpZ24tb3V0IGFuZFxuICAvLyBzaWduLWluIG11c3Qgbm90IGluaGVyaXQgdGhlIG9sZCBzZXNzaW9uJ3Mgd2FpdC5cbiAgaWYgKHRva2VuICE9PSByZWFkVG9rZW5TdG9yYWdlKFJFRlJFU0hfS0VZKSkgcmVzZXRSZWZyZXNoQmFja29mZigpXG4gIHdyaXRlVG9rZW5TdG9yYWdlKFJFRlJFU0hfS0VZLCB0b2tlbilcbn1cblxuLyoqXG4gKiBgUE9TVCAvdG9rZW5gIChSRkMgNjc0OSwgZm9ybS1lbmNvZGVkKS4gQSBmYWlsdXJlIGlzIE9BdXRoJ3NcbiAqIGB7ZXJyb3IsIGVycm9yX2Rlc2NyaXB0aW9ufWAsIG5vdCB0aGUgQVBJJ3Mgc2VudGVuY2Ugc2hhcGUuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHRva2VuUmVxdWVzdCAoZm9ybTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFRva2VuU2Vzc2lvbj4ge1xuICAvLyBLQU4tMjE5MjogYSBjb2RlIG9yIGEgcmVmcmVzaCB0b2tlbiBpcyBhIGNyZWRlbnRpYWw7IG5vbmUgbGVhdmVzIGEgcGxhaW4tSFRUUCBwYWdlLlxuICBpZiAoIWNsb3VkU2Vzc2lvbkFsbG93ZWQoKSkgcmVmdXNlT25JbnNlY3VyZU9yaWdpbigpXG4gIGxldCByZXNwb25zZTogUmVzcG9uc2VcbiAgdHJ5IHtcbiAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke2Nsb3VkQmFzZVVybCgpfS90b2tlbmAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgIGJvZHk6IG5ldyBVUkxTZWFyY2hQYXJhbXMoZm9ybSkudG9TdHJpbmcoKSxcbiAgICAgIHNpZ25hbFxuICAgIH0pXG4gIH0gY2F0Y2gge1xuICAgIG5vdGVDbG91ZFVucmVhY2hhYmxlKClcbiAgICB0aHJvdyBuZXcgQ2xvdWRFcnJvcignVGhlIE11b24zRCBzZXJ2aWNlIGNvdWxkIG5vdCBiZSByZWFjaGVkLicsIDApXG4gIH1cbiAgbGV0IGRhdGE6IGFueSA9IHt9XG4gIHRyeSB7XG4gICAgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgQ2xvdWRFcnJvcignVGhlIE11b24zRCBzZXJ2aWNlIHNlbnQgYW4gdW5yZWFkYWJsZSBhbnN3ZXIuJywgcmVzcG9uc2Uuc3RhdHVzKVxuICB9XG4gIG5vdGVDbG91ZFJlYWNoZWQoKVxuICBpZiAoIXJlc3BvbnNlLm9rIHx8IHR5cGVvZiBkYXRhLmFjY2Vzc190b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyBLQU4tMjUwOTogYSByZWZ1c2VkIHJlZnJlc2ggb2YgYW4gZW5kZWQgc2Vzc2lvbiBzYXlzIHdoeSAoYHJlYXNvbmAsIHRoZSBjb25zb2xlJ3Mgd2lyZSBzdHJpbmcpLlxuICAgIGNvbnN0IGJvZHkgPSB0eXBlb2YgZGF0YS5yZWFzb24gPT09ICdzdHJpbmcnID8geyByZWFzb246IGRhdGEucmVhc29uIH0gOiB7fVxuICAgIHRocm93IG5ldyBDbG91ZEVycm9yKGRhdGEuZXJyb3JfZGVzY3JpcHRpb24gPz8gZGF0YS5lcnJvciA/PyBgVGhlIE11b24zRCBzZXJ2aWNlIGFuc3dlcmVkICR7cmVzcG9uc2Uuc3RhdHVzfS5gLCByZXNwb25zZS5zdGF0dXMsIGRhdGEuZXJyb3IsIGJvZHksIHJldHJ5QWZ0ZXJPZihyZXNwb25zZSkpXG4gIH1cbiAgcmV0dXJuIGRhdGEgYXMgVG9rZW5TZXNzaW9uXG59XG5cbi8qKiBBIGBSZXRyeS1BZnRlcmAgaGVhZGVyIChzZWNvbmRzLCBvciBhbiBIVFRQIGRhdGUpIGluIG1pbGxpc2Vjb25kczsgdW5kZWZpbmVkIHdoZW4gYWJzZW50IG9yIHVucmVhZGFibGUuICovXG5leHBvcnQgZnVuY3Rpb24gcmV0cnlBZnRlck9mIChyZXNwb25zZTogUmVzcG9uc2UsIG5vdyA9IERhdGUubm93KCkpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICBjb25zdCByYXcgPSByZXNwb25zZS5oZWFkZXJzPy5nZXQ/LigncmV0cnktYWZ0ZXInKVxuICBpZiAoIXJhdykgcmV0dXJuIHVuZGVmaW5lZFxuICBjb25zdCB0ZXh0ID0gcmF3LnRyaW0oKVxuICBpZiAoL15cXGQrJC8udGVzdCh0ZXh0KSkgcmV0dXJuIE51bWJlcih0ZXh0KSAqIDEwMDBcbiAgY29uc3QgYXQgPSBEYXRlLnBhcnNlKHRleHQpXG4gIHJldHVybiBOdW1iZXIuaXNOYU4oYXQpID8gdW5kZWZpbmVkIDogTWF0aC5tYXgoMCwgYXQgLSBub3cpXG59XG5cbi8qKiBUaGUgZmlyc3Qgd2FpdCBhZnRlciBhIHJlZnJlc2ggdGhlIGNvbnNvbGUgY291bGQgbm90IHRha2Ugbm93LCBkb3VibGluZyBwZXIgZmFpbHVyZSB0byB0aGUgY2FwLiAqL1xuZXhwb3J0IGNvbnN0IFJFRlJFU0hfQkFDS09GRl9CQVNFX01TID0gMjAwMFxuZXhwb3J0IGNvbnN0IFJFRlJFU0hfQkFDS09GRl9DQVBfTVMgPSA1ICogNjAgKiAxMDAwXG4vKiogVGhlIGxvbmdlc3QgYFJldHJ5LUFmdGVyYCBiZWxpZXZlZC4gKi9cbmV4cG9ydCBjb25zdCBSRUZSRVNIX1JFVFJZX0FGVEVSX0NBUF9NUyA9IDE1ICogNjAgKiAxMDAwXG5cbmxldCByZWZyZXNoTm90QmVmb3JlID0gMFxubGV0IHJlZnJlc2hCYWNrb2ZmcyA9IDBcblxuLyoqIEZvciB0ZXN0czogZm9yZ2V0IGFueSByZWZyZXNoIGJhY2tvZmYuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRSZWZyZXNoQmFja29mZiAoKSB7XG4gIHJlZnJlc2hOb3RCZWZvcmUgPSAwXG4gIHJlZnJlc2hCYWNrb2ZmcyA9IDBcbn1cblxuLyoqXG4gKiBBIHJlZnJlc2ggYW5zd2VyIHRoYXQgc2F5cyBub3RoaW5nIGFib3V0IHRoZSBzZXNzaW9uOiB0aGUgcmF0ZSBsaW1pdCAoNDI5KVxuICogb3IgdGhlIGNvbnNvbGUgZmFpbGluZyAoNXh4KS4gVGhlIHNlc3Npb24gaXMga2VwdCBhbmQgdGhlIG5leHQgcmVmcmVzaFxuICogd2FpdHM6IHRoZSBjb25zb2xlJ3MgYFJldHJ5LUFmdGVyYCBpZiBpdCBzZW50IG9uZSwgZWxzZSAyIHMgZG91YmxpbmcgdG8gNSBtaW4uXG4gKi9cbmZ1bmN0aW9uIGlzVHJhbnNpZW50UmVmdXNhbCAoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBDbG91ZEVycm9yIHtcbiAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgQ2xvdWRFcnJvciAmJiAoZXJyb3Iuc3RhdHVzID09PSA0MjkgfHwgZXJyb3Iuc3RhdHVzID49IDUwMClcbn1cblxuZnVuY3Rpb24gYmFja09mZlJlZnJlc2ggKGVycm9yOiBDbG91ZEVycm9yKSB7XG4gIC8vIEEgUmV0cnktQWZ0ZXIgb2YgMCBvciBhIGRhdGUgaW4gdGhlIHBhc3Qgc3RpbGwgd2FpdHMgdGhlIGJhc2Ugc3RlcCwgc28gYVxuICAvLyBjb25zb2xlIHRoYXQga2VlcHMgYW5zd2VyaW5nIDQyOSBpcyBub3QgYXNrZWQgYWdhaW4gb24gZXZlcnkgY2FsbC5cbiAgY29uc3Qgd2FpdCA9IGVycm9yLnJldHJ5QWZ0ZXJNcyAhPT0gdW5kZWZpbmVkXG4gICAgPyBNYXRoLm1heChSRUZSRVNIX0JBQ0tPRkZfQkFTRV9NUywgTWF0aC5taW4oZXJyb3IucmV0cnlBZnRlck1zLCBSRUZSRVNIX1JFVFJZX0FGVEVSX0NBUF9NUykpXG4gICAgOiBNYXRoLm1pbihSRUZSRVNIX0JBQ0tPRkZfQ0FQX01TLCBSRUZSRVNIX0JBQ0tPRkZfQkFTRV9NUyAqIDIgKiogcmVmcmVzaEJhY2tvZmZzKVxuICByZWZyZXNoQmFja29mZnMgKz0gMVxuICByZWZyZXNoTm90QmVmb3JlID0gRGF0ZS5ub3coKSArIHdhaXRcbn1cblxuLyoqIFdoYXQgYSByZWZyZXNoIGNhbWUgdG86IGEgbmV3IHBhaXIsIGEgcmVmdXNhbCAodGhlIHNlc3Npb24gaXMgb3ZlciksIG9yIG5vIGFuc3dlciAoaXQgaXMgbm90KS4gKi9cbmV4cG9ydCB0eXBlIFJlZnJlc2hPdXRjb21lID0gJ29rJyB8ICdyZWZ1c2VkJyB8ICd1bnJlYWNoYWJsZSdcblxubGV0IHJlZnJlc2hpbmc6IFByb21pc2U8UmVmcmVzaE91dGNvbWU+IHwgbnVsbCA9IG51bGxcblxuLyoqIFRoZSBsb2NrIGFuZCBjaGFubmVsIG5hbWUgZXZlcnkgdGFiIG9mIHRoaXMgb3JpZ2luIHNoYXJlcy4gKi9cbmNvbnN0IFJFRlJFU0hfTE9DSyA9ICdtdW9uLmNsb3VkLnJlZnJlc2gnXG4vKiogVGhlIGxvbmdlc3QgYSBgL3Rva2VuYCByZWZyZXNoIG1heSB0YWtlLiBBIGh1bmcgb25lIG11c3Qgbm90IGhvbGQgZXZlcnkgdGFiLiAqL1xuZXhwb3J0IGNvbnN0IFJFRlJFU0hfVElNRU9VVF9NUyA9IDEwMDAwXG4vKiogSG93IGxvbmcgYSBmYWxsYmFjayBob2xkZXIgaXMgYmVsaWV2ZWQgd2l0aG91dCBhIHJlbGVhc2U6IHRoZSByZWZyZXNoIHRpbWVvdXQgYW5kIHNvbWUgbWFyZ2luLiAqL1xuY29uc3QgSE9MRF9NUyA9IFJFRlJFU0hfVElNRU9VVF9NUyArIDMwMDBcbi8qKiBUaW1lIGZvciBvdGhlciB0YWJzJyBjbGFpbXMgdG8gYXJyaXZlIGJlZm9yZSB0aGUgZmFsbGJhY2sgZGVjaWRlcyB3aG8gaXMgZmlyc3QuICovXG5jb25zdCBDTEFJTV9TRVRUTEVfTVMgPSA1MFxuXG4vKipcbiAqIFdoYXQgdG8gdHJ5IHdoZW4gdGhlIGNvbnNvbGUgcmVmdXNlcyBhIHJlZnJlc2gsIGJlZm9yZSB0aGUgc2Vzc2lvbiBpc1xuICogZHJvcHBlZDogdGhlIGNlbnRyYWwgbG9naW4gcmVnaXN0ZXJzIGEgc2lsZW50IGAvYXV0aG9yaXplP3Byb21wdD1ub25lYFxuICogY2hlY2suIGBmYWlsZWRSZWZyZXNoYCBpcyB0aGUgcmVmcmVzaCB0b2tlbiB0aGF0IHdhcyByZWZ1c2VkOyB0aGUgY2hlY2tcbiAqIHN0b3JlcyBub3RoaW5nIHVubGVzcyB0aGF0IGlzIHN0aWxsIHRoZSBzdG9yZWQgb25lLiBUcnVlIHdoZW4gaXQgc3RvcmVkIGFcbiAqIG5ldyBwYWlyLlxuICovXG5sZXQgcmVjb3ZlclNlc3Npb246ICgoZmFpbGVkUmVmcmVzaDogc3RyaW5nKSA9PiBQcm9taXNlPGJvb2xlYW4+KSB8IG51bGwgPSBudWxsXG5cbi8qKlxuICogS0FOLTEzODk6IGEgY2FsbCB0aGUgY29uc29sZSByZWZ1c2VkICh0aGUgcmVmcmVzaCBhbmQgdGhlIHNpbGVudCBzaWduLWluIGJvdGggZmFpbGVkKSBlbmRzIHRoZSBzZXNzaW9uIHdob2V2ZXIgbWFkZVxuICogaXQsIG5vdCBvbmx5IHRoZSBwcmludGVyIHBvbGwuIEZvciBgcmVxdWVzdGAgYmVsb3cgdGhhdCBpcyB0aGUgYHJlZnVzZWRgIGhvb2sgb2YgYSByZWZyZXNoIHRoZSBjb25zb2xlIHJlZnVzZWRcbiAqIChTZXNzaW9uSG9va3MpLCB3aGljaCBzdGF0ZS50cyBhbnN3ZXJzIHdpdGggaXRzIG9uZSByZWZ1c2VkLXNlc3Npb24gcGF0aC4gQSBzZXNzaW9uIHdpdGggbm8gcmVmcmVzaCB0b2tlbiAoYVxuICogcHJpbnRlcidzIG93biBhZGRyZXNzKSBpcyBub3QgZW5kZWQgYnkgYSByZWZ1c2VkIGByZXF1ZXN0YDogdGhlIHByaW50ZXIgbGlzdCBwb2xsIGVuZHMgaXQsIGFuZCBhIEJsdWV0b290aCBvcGVuXG4gKiB0aGF0IGEgNDAxIG9uIHRoZSBncmFudCBjYWxsIG1lZXRzIG11c3Qgc3RpbGwgZ28gb24gKEtBTi0xMzk2KS4gVGhlIGFjY291bnQgY2xpZW50IGNhbGxzIHRoaXMgZm9yIGl0cyBvd25cbiAqIHJlZnVzZWQgcmVmcmVzaC5cbiAqXG4gKiBFbmRzIHRoZSBzZXNzaW9uIG9ubHkgaWYgaXQgaXMgc3RpbGwgdGhlIG9uZSBgc2VudGAgYmVsb25ncyB0bzogYSByZWZ1c2FsIHRoYXQgbGFuZHMgYWZ0ZXIgYSBzaWduLW91dCBhbmQgYSBuZXdcbiAqIHNpZ24taW4gYmVsb25ncyB0byB0aGUgcHJldmlvdXMgYWNjb3VudCBhbmQgbXVzdCBub3QgZW5kIHRoZSBuZXcgb25lIChLQU4tMjI0OSkuIFRva2VucyBhbHJlYWR5IGNsZWFyZWQgYnkgdGhlXG4gKiByZWZyZXNoIGNvdW50IGFzIHN0aWxsIG91cnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXNzaW9uUmVmdXNlZCAoc2VudDogc3RyaW5nLCByZWFzb24/OiBzdHJpbmcpIHtcbiAgY29uc3Qgbm93ID0gc3RvcmVkVG9rZW4oKVxuICBpZiAobm93ICE9PSBudWxsICYmIG5vdyAhPT0gc2VudCkgcmV0dXJuXG4gIHRyeSB7IHNlc3Npb25Ib29rcy5yZWZ1c2VkPy4ocmVhc29uKSB9IGNhdGNoIHsgLyogdGhlIGNhbGxlcidzIG93biByZWZ1c2FsIGlzIHJhaXNlZCBlaXRoZXIgd2F5ICovIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlc3Npb25SZWNvdmVyeSAocmVjb3ZlcjogKChmYWlsZWRSZWZyZXNoOiBzdHJpbmcpID0+IFByb21pc2U8Ym9vbGVhbj4pIHwgbnVsbCkge1xuICByZWNvdmVyU2Vzc2lvbiA9IHJlY292ZXJcbn1cblxuLyoqXG4gKiBXaGF0IHRoZSBzZXNzaW9uJ3Mgb3duZXIgKHN0YXRlLnRzKSBkb2VzIHdoZW4gdGhpcyBtb2R1bGUgY2hhbmdlcyB0aGUgc2Vzc2lvbiBvbiBpdHMgb3duLCBzbyB0aGUgYWNjb3VudCBpc1xuICogYW5ub3VuY2VkIChhY2NvdW50LWV2ZW50cy50cykgYmVmb3JlIHRoZSB0b2tlbnMgY2hhbmdlLCB3aXRoIG5vIGltcG9ydCBvZiBzdGF0ZS50cyBmcm9tIGhlcmU6XG4gKlxuICogLSBgcmVjb3ZlcmVkYDogYSByZWZ1c2VkIHJlZnJlc2ggd2FzIHJlY292ZXJlZCBpbnRvIGEgbmV3IHBhaXIuIFJlc29sdmVzIGZhbHNlIHdoZW4gdGhhdCBwYWlyIGlzIG5vdCBhIHNlc3Npb24gdGhlXG4gKiAgIG93bmVyIGNhbiBrZWVwICh0aGUgYWNjb3VudCBjb3VsZCBub3QgYmUgY2hlY2tlZCksIGFuZCB0aGUgcmVmcmVzaCBpcyB0aGVuIHJlZnVzZWQuXG4gKiAtIGByZWZ1c2VkYDogdGhlIHJlZnJlc2ggd2FzIHJlZnVzZWQgZm9yIGdvb2QgYW5kIHRoZSB0b2tlbnMgYXJlIGFib3V0IHRvIGJlIGNsZWFyZWQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkhvb2tzIHtcbiAgcmVjb3ZlcmVkPzogKCkgPT4gUHJvbWlzZTxib29sZWFuPjtcbiAgLyoqIGByZWFzb25gOiB3aHkgdGhlIGNvbnNvbGUgZW5kZWQgdGhlIHNlc3Npb24sIHdoZW4gaXRzIHJlZnVzYWwgc2FpZCAoS0FOLTI1MDkpLiAqL1xuICByZWZ1c2VkPzogKHJlYXNvbj86IHN0cmluZykgPT4gdm9pZDtcbiAgLyoqIFRoZSBzdG9yZWQgdG9rZW4gaXMgb25lIC9tZSBoYXMgbm90IGNvbmZpcm1lZCBmb3IgdGhlIGFjY291bnQgb24gc2NyZWVuOiBhc2sgbm93IChzdGF0ZS50cyByZWNvbmNpbGVTdG9yZWRTZXNzaW9uKS4gKi9cbiAgY2hlY2s/OiAoKSA9PiB2b2lkO1xufVxuXG4vKiogQSB0b2tlbiB3YXMgc3RvcmVkIGhlcmUgZm9yIHRoZSBzYW1lIGFjY291bnQgKGEgcmVmcmVzaCwgYSByZS1rZXllZCBzZXNzaW9uKTogY2FycnkgdGhlIGNvbmZpcm1hdGlvbiB0byBpdCwgb3IgYXNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhcnJ5Q29uZmlybWF0aW9uIChiZWZvcmU6IHN0cmluZyB8IG51bGwsIG5leHQ6IHN0cmluZykge1xuICByb3RhdGVDb25maXJtZWQoYmVmb3JlLCBuZXh0KVxuICBpZiAoY29uZmlybWVkQWNjb3VudElkKG5leHQpID09PSBudWxsKSBzZXNzaW9uSG9va3MuY2hlY2s/LigpXG59XG5cbmxldCBzZXNzaW9uSG9va3M6IFNlc3Npb25Ib29rcyA9IHt9XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZXNzaW9uSG9va3MgKGhvb2tzOiBTZXNzaW9uSG9va3MpIHtcbiAgc2Vzc2lvbkhvb2tzID0gaG9va3Ncbn1cblxuLyoqXG4gKiBSdW5zIGB3b3JrYCB3aXRoIG5vIG90aGVyIHRhYiBvZiB0aGlzIG9yaWdpbiByZWZyZXNoaW5nOiBhIHJlZnJlc2ggdG9rZW5cbiAqIHVzZWQgdHdpY2UgZW5kcyBpdHMgc2Vzc2lvbiwgYW5kIHRoZSB0b2tlbnMgc2l0IGluIGxvY2FsU3RvcmFnZSB0aGF0IGV2ZXJ5XG4gKiB0YWIgc2hhcmVzLiBgbmF2aWdhdG9yLmxvY2tzYCB3aGVyZSB0aGVyZSBpcyBvbmU7IGVsc2UgYSBCcm9hZGNhc3RDaGFubmVsXG4gKiBxdWV1ZSAoYGNoYW5uZWxMb2NrYCkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3aXRoUmVmcmVzaExvY2s8VD4gKHdvcms6ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgbG9ja3MgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyA/IChuYXZpZ2F0b3IgYXMgYW55KS5sb2NrcyA6IHVuZGVmaW5lZFxuICBpZiAobG9ja3MgJiYgdHlwZW9mIGxvY2tzLnJlcXVlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gbG9ja3MucmVxdWVzdChSRUZSRVNIX0xPQ0ssIHdvcmspIGFzIFByb21pc2U8VD5cbiAgfVxuICBpZiAodHlwZW9mIEJyb2FkY2FzdENoYW5uZWwgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gd29yaygpXG4gIHJldHVybiBjaGFubmVsTG9jayh3b3JrKVxufVxuXG4vKipcbiAqIFRoZSBmYWxsYmFjayBmb3IgYSBicm93c2VyIHdpdGhvdXQgYG5hdmlnYXRvci5sb2Nrc2AuIEVhY2ggdGFiIGFubm91bmNlcyBhXG4gKiBjbGFpbSB3aXRoIGFuIGlkIHRoYXQgc29ydHMgYnkgdGltZTsgdGhlIGxvd2VzdCBsaXZlIGlkIGhvbGRzLiBBIGNsYWltIGlzXG4gKiBhbnN3ZXJlZCBvbmNlLCB3aXRoIGEgYHByZXNlbnRgIHRoYXQgbm9ib2R5IGFuc3dlcnMsIHNvIHRoZXJlIGlzIG5vXG4gKiBleGNoYW5nZSB0byBsb29wLiBBIHRhYiB3YWl0cyBvbmx5IGZvciBsb3dlciBpZHMsIGVhY2ggb2Ygd2hpY2ggZW5kcyB3aXRoIGFcbiAqIGByZWxlYXNlYCBvciwgaWYgaXRzIHRhYiBkaWVkLCBleHBpcmVzIGFmdGVyIEhPTERfTVM7IHNvIHdhaXRlcnMgcnVuIG9uZVxuICogYWZ0ZXIgYW5vdGhlciwgYW5kIGVhY2ggcmUtcmVhZHMgdGhlIHN0b3JlZCBwYWlyIGluIGB3b3JrYC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY2hhbm5lbExvY2s8VD4gKHdvcms6ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgY2hhbm5lbCA9IG5ldyBCcm9hZGNhc3RDaGFubmVsKFJFRlJFU0hfTE9DSylcbiAgY29uc3QgaWQgPSBgJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KS5wYWRTdGFydCgxMCwgJzAnKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKX1gXG4gIGNvbnN0IG90aGVycyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KClcbiAgbGV0IHdha2U6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG4gIGNoYW5uZWwub25tZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICBjb25zdCBtZXNzYWdlID0gZXZlbnQuZGF0YSBhcyB7IHR5cGU/OiBzdHJpbmcsIGlkPzogc3RyaW5nIH0gfCBudWxsXG4gICAgaWYgKCFtZXNzYWdlIHx8IHR5cGVvZiBtZXNzYWdlLmlkICE9PSAnc3RyaW5nJyB8fCBtZXNzYWdlLmlkID09PSBpZCkgcmV0dXJuXG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2NsYWltJykge1xuICAgICAgaWYgKCFvdGhlcnMuaGFzKG1lc3NhZ2UuaWQpKSBjaGFubmVsLnBvc3RNZXNzYWdlKHsgdHlwZTogJ3ByZXNlbnQnLCBpZCB9KVxuICAgICAgb3RoZXJzLnNldChtZXNzYWdlLmlkLCBEYXRlLm5vdygpICsgSE9MRF9NUylcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ3ByZXNlbnQnKSB7XG4gICAgICBpZiAoIW90aGVycy5oYXMobWVzc2FnZS5pZCkpIG90aGVycy5zZXQobWVzc2FnZS5pZCwgRGF0ZS5ub3coKSArIEhPTERfTVMpXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdyZWxlYXNlJykge1xuICAgICAgb3RoZXJzLmRlbGV0ZShtZXNzYWdlLmlkKVxuICAgIH1cbiAgICB3YWtlPy4oKVxuICB9XG4gIHRyeSB7XG4gICAgY2hhbm5lbC5wb3N0TWVzc2FnZSh7IHR5cGU6ICdjbGFpbScsIGlkIH0pXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIENMQUlNX1NFVFRMRV9NUykpXG4gICAgZm9yICg7Oykge1xuICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKVxuICAgICAgbGV0IHNvb25lc3QgPSBJbmZpbml0eVxuICAgICAgbGV0IGJsb2NrZWQgPSBmYWxzZVxuICAgICAgZm9yIChjb25zdCBbb3RoZXIsIGV4cGlyZXNdIG9mIG90aGVycykge1xuICAgICAgICBpZiAoZXhwaXJlcyA8PSBub3cpIG90aGVycy5kZWxldGUob3RoZXIpXG4gICAgICAgIGVsc2UgaWYgKG90aGVyIDwgaWQpIHtcbiAgICAgICAgICBibG9ja2VkID0gdHJ1ZVxuICAgICAgICAgIHNvb25lc3QgPSBNYXRoLm1pbihzb29uZXN0LCBleHBpcmVzKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWJsb2NrZWQpIGJyZWFrXG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQocmVzb2x2ZSwgTWF0aC5tYXgoMCwgc29vbmVzdCAtIG5vdykpXG4gICAgICAgIHdha2UgPSAoKSA9PiB7IGNsZWFyVGltZW91dCh0aW1lcik7IHJlc29sdmUoKSB9XG4gICAgICB9KVxuICAgICAgd2FrZSA9IG51bGxcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHdvcmsoKVxuICB9IGZpbmFsbHkge1xuICAgIGNoYW5uZWwucG9zdE1lc3NhZ2UoeyB0eXBlOiAncmVsZWFzZScsIGlkIH0pXG4gICAgY2hhbm5lbC5jbG9zZSgpXG4gIH1cbn1cblxuLyoqXG4gKiBTd2FwcyB0aGUgc3RvcmVkIHJlZnJlc2ggdG9rZW4gZm9yIGEgbmV3IHBhaXIsIG9uY2UgYXQgYSB0aW1lIGFjcm9zcyBldmVyeVxuICogdGFiOiBhIHJlZnJlc2ggdG9rZW4gdXNlZCB0d2ljZSBlbmRzIGl0cyBzZXNzaW9uLCBzbyB0d28gcmVxdWVzdHMgKGhlcmUgb3JcbiAqIGluIGFub3RoZXIgdGFiKSB0aGF0IGJvdGggbWV0IGEgNDAxIG11c3Qgc2hhcmUgb25lIHJlZnJlc2guIFVuZGVyIHRoZSBsb2NrXG4gKiB0aGUgc3RvcmVkIHBhaXIgaXMgcmVhZCBhZ2FpbjsgaWYgYW5vdGhlciB0YWIgYWxyZWFkeSByb3RhdGVkIGl0LCB0aGF0IG5ld1xuICogcGFpciBpcyB1c2VkIGFuZCBub3RoaW5nIGlzIHNwZW50LiBXaGVuIHRoZSBjb25zb2xlIHJlZnVzZXMsIGEgc2lsZW50XG4gKiBzaWduLWluIGlzIHRyaWVkIG9uY2UgYmVmb3JlIGJvdGggdG9rZW5zIGFyZSBkcm9wcGVkLCBhbmQgb25seSBpZiB0aGVcbiAqIHJlZnVzZWQgdG9rZW4gaXMgc3RpbGwgdGhlIHN0b3JlZCBvbmUgKGEgc2lnbi1vdXQgb3IgYSBuZXcgc2lnbi1pbiBzaW5jZVxuICogbGVhdmVzIHN0b3JhZ2UgYWxvbmUpLiBBIGNvbnNvbGUgdGhhdCBjYW5ub3QgYmUgcmVhY2hlZCwgb3IgaXMgdG9vIHNsb3csXG4gKiBsZWF2ZXMgdGhlIHNlc3Npb24gYXMgaXQgaXM6IGAndW5yZWFjaGFibGUnYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hPdXRjb21lICgpOiBQcm9taXNlPFJlZnJlc2hPdXRjb21lPiB7XG4gIGNvbnN0IHJlZnJlc2hUb2tlbiA9IHN0b3JlZFJlZnJlc2hUb2tlbigpXG4gIGlmICghcmVmcmVzaFRva2VuKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCdyZWZ1c2VkJylcbiAgLy8gQmFja2luZyBvZmYgYWZ0ZXIgYSA0Mjkgb3IgYSA1eHg6IHRoZSBzZXNzaW9uIHN0YW5kcywgYXNrIGFnYWluIGxhdGVyLlxuICBpZiAoIXJlZnJlc2hpbmcgJiYgRGF0ZS5ub3coKSA8IHJlZnJlc2hOb3RCZWZvcmUpIHJldHVybiBQcm9taXNlLnJlc29sdmUoJ3VucmVhY2hhYmxlJylcbiAgaWYgKCFyZWZyZXNoaW5nKSB7XG4gICAgcmVmcmVzaGluZyA9IHdpdGhSZWZyZXNoTG9jayhhc3luYyAoKTogUHJvbWlzZTxSZWZyZXNoT3V0Y29tZT4gPT4ge1xuICAgICAgY29uc3QgY3VycmVudCA9IHN0b3JlZFJlZnJlc2hUb2tlbigpXG4gICAgICBpZiAoY3VycmVudCAhPT0gcmVmcmVzaFRva2VuKSB7XG4gICAgICAgIC8vIFJvdGF0ZWQgYnkgYW5vdGhlciB0YWIgd2hpbGUgdGhpcyBvbmUgd2FpdGVkIGZvciB0aGUgbG9jaywgb3Igc2lnbmVkIG91dC5cbiAgICAgICAgcmV0dXJuIGN1cnJlbnQgIT09IG51bGwgJiYgc3RvcmVkVG9rZW4oKSAhPT0gbnVsbCA/ICdvaycgOiAncmVmdXNlZCdcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIFJFRlJFU0hfVElNRU9VVF9NUylcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0b2tlblJlcXVlc3QoeyBncmFudF90eXBlOiAncmVmcmVzaF90b2tlbicsIHJlZnJlc2hfdG9rZW46IHJlZnJlc2hUb2tlbiwgY2xpZW50X2lkOiBjbGllbnRJZCgpIH0sIGNvbnRyb2xsZXIuc2lnbmFsKVxuICAgICAgICBpZiAoc3RvcmVkUmVmcmVzaFRva2VuKCkgIT09IHJlZnJlc2hUb2tlbikgcmV0dXJuIHN0b3JlZFRva2VuKCkgIT09IG51bGwgJiYgc3RvcmVkUmVmcmVzaFRva2VuKCkgIT09IG51bGwgPyAnb2snIDogJ3JlZnVzZWQnXG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IHN0b3JlZFRva2VuKClcbiAgICAgICAgc3RvcmVUb2tlbihzZXNzaW9uLmFjY2Vzc190b2tlbilcbiAgICAgICAgY2FycnlDb25maXJtYXRpb24oYmVmb3JlLCBzZXNzaW9uLmFjY2Vzc190b2tlbilcbiAgICAgICAgc3RvcmVSZWZyZXNoVG9rZW4oc2Vzc2lvbi5yZWZyZXNoX3Rva2VuKVxuICAgICAgICByZXNldFJlZnJlc2hCYWNrb2ZmKClcbiAgICAgICAgcmV0dXJuICdvaydcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIE5vdCByZWFjaGluZyB0aGUgY29uc29sZSBzYXlzIG5vdGhpbmcgYWJvdXQgdGhlIHNlc3Npb24uIE5vciBkb2VzXG4gICAgICAgIC8vIGEgcmF0ZSBsaW1pdCBvciBhIGNvbnNvbGUgZXJyb3I6IG9ubHkgYSByZWZ1c2FsIGVuZHMgaXQgKEtBTi0xNDcyKS5cbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgQ2xvdWRFcnJvciAmJiBlcnJvci5zdGF0dXMgPT09IDApIHJldHVybiAndW5yZWFjaGFibGUnXG4gICAgICAgIGlmIChpc1RyYW5zaWVudFJlZnVzYWwoZXJyb3IpKSB7XG4gICAgICAgICAgYmFja09mZlJlZnJlc2goZXJyb3IpXG4gICAgICAgICAgcmV0dXJuICd1bnJlYWNoYWJsZSdcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChyZWNvdmVyU2Vzc2lvbiAmJiBzdG9yZWRSZWZyZXNoVG9rZW4oKSA9PT0gcmVmcmVzaFRva2VuICYmIGF3YWl0IHJlY292ZXJTZXNzaW9uKHJlZnJlc2hUb2tlbikpIHtcbiAgICAgICAgICAgIC8vIFRoZSBuZXcgcGFpciBtYXkgYmVsb25nIHRvIGFub3RoZXIgYWNjb3VudDogdGhlIG93bmVyIGNoZWNrcywgYW5kIGFubm91bmNlcyBhIGNoYW5nZS5cbiAgICAgICAgICAgIGlmICghc2Vzc2lvbkhvb2tzLnJlY292ZXJlZCB8fCBhd2FpdCBzZXNzaW9uSG9va3MucmVjb3ZlcmVkKCkpIHJldHVybiAnb2snXG4gICAgICAgICAgICByZXR1cm4gJ3JlZnVzZWQnXG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHsgLyogZmFsbCB0aHJvdWdoIHRvIGRyb3BwaW5nICovIH1cbiAgICAgICAgaWYgKHN0b3JlZFJlZnJlc2hUb2tlbigpID09PSByZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgICAvLyBBbm5vdW5jZWQgZmlyc3QsIHNvIHdob2V2ZXIgYW5zd2VycyBmb3IgdGhlIGFjY291bnQgaGVhcnMgb2YgaXQgYmVmb3JlIHRoZSB0b2tlbiBnb2VzLlxuICAgICAgICAgIHRyeSB7IHNlc3Npb25Ib29rcy5yZWZ1c2VkPy4ocmVmdXNhbFJlYXNvbihlcnJvcikpIH0gY2F0Y2ggeyAvKiB0aGUgdG9rZW5zIGFyZSBjbGVhcmVkIGJlbG93IGVpdGhlciB3YXkgKi8gfVxuICAgICAgICAgIHN0b3JlVG9rZW4obnVsbClcbiAgICAgICAgICBzdG9yZVJlZnJlc2hUb2tlbihudWxsKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAncmVmdXNlZCdcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcilcbiAgICAgIH1cbiAgICB9KVxuICAgICAgLmNhdGNoKCgpOiBSZWZyZXNoT3V0Y29tZSA9PiAndW5yZWFjaGFibGUnKVxuICAgICAgLmZpbmFsbHkoKCkgPT4geyByZWZyZXNoaW5nID0gbnVsbCB9KVxuICB9XG4gIHJldHVybiByZWZyZXNoaW5nXG59XG5cbi8qKiBUaGUgYHJlYXNvbmAgYSByZWZ1c2VkIHJlZnJlc2ggY2FycmllZCAoS0FOLTI1MDkpLCBpZiBhbnkuICovXG5mdW5jdGlvbiByZWZ1c2FsUmVhc29uIChlcnJvcjogdW5rbm93bik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIENsb3VkRXJyb3IgJiYgdHlwZW9mIGVycm9yLmJvZHkucmVhc29uID09PSAnc3RyaW5nJyA/IGVycm9yLmJvZHkucmVhc29uIDogdW5kZWZpbmVkXG59XG5cbi8qKiBgcmVmcmVzaE91dGNvbWVgIGFzIGEgeWVzIG9yIG5vOiB3aGV0aGVyIHRoZXJlIGlzIGEgZnJlc2ggcGFpciB0byB1c2UuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaFNlc3Npb24gKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICByZXR1cm4gKGF3YWl0IHJlZnJlc2hPdXRjb21lKCkpID09PSAnb2snXG59XG5cbi8qKlxuICogYHN0aWxsTWluZWAsIHdoZW4gZ2l2ZW4sIGlzIGFza2VkIGJlZm9yZSBhIDQwMSBpcyByZXRyaWVkIHdpdGggYW5vdGhlciB0b2tlbjogYSByZXF1ZXN0IG1hZGUgZm9yIG9uZSBhY2NvdW50IG11c3RcbiAqIG5ldmVyIGJlIHNlbnQgYWdhaW4gd2l0aCB0aGUgbmV4dCBhY2NvdW50J3MgKEtBTi0yMjQ5OiBhIGxheW91dCBQVVQgaW4gZmxpZ2h0IGFjcm9zcyBhIHNpZ24tb3V0KS5cbiAqL1xuLyoqIEEgY29uc29sZSB0aGF0IG5ldmVyIGFuc3dlcnMgKG5vIGludGVybmV0IGJlaGluZCBhIGhvdHNwb3QpIG11c3Qgbm90IGhhbmcgdGhlIGNhbGxlcjsgY2FsbGVycyBtYXkgYXNrIGZvciBsZXNzLiAqL1xuY29uc3QgQ0xPVURfUkVRVUVTVF9USU1FT1VUX01TID0gMTJfMDAwXG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3Q8VD4gKG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGJvZHk/OiB1bmtub3duLCB0b2tlbjogc3RyaW5nIHwgbnVsbCA9IHN0b3JlZFRva2VuKCksIHJldHJ5ID0gdHJ1ZSwgc3RpbGxNaW5lPzogKCkgPT4gYm9vbGVhbiwgdGltZW91dE1zOiBudW1iZXIgPSBDTE9VRF9SRVFVRVNUX1RJTUVPVVRfTVMpOiBQcm9taXNlPFQ+IHtcbiAgLy8gS0FOLTIxOTI6IG5vIGJlYXJlciBhbmQgbm8gcGFzc3dvcmQgbGVhdmVzIGEgcGxhaW4tSFRUUCBwYWdlLCB3aG9ldmVyIGFza3MuXG4gIGlmICghY2xvdWRTZXNzaW9uQWxsb3dlZCgpICYmICh0b2tlbiB8fCAhSU5TRUNVUkVfT1JJR0lOX0NBTExTLmluY2x1ZGVzKGAke21ldGhvZH0gJHtwYXRofWApKSkgcmVmdXNlT25JbnNlY3VyZU9yaWdpbigpXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IGRlbGV0aW9uUmV2aXNpb24oKVxuICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbiAgaWYgKHRva2VuKSBoZWFkZXJzLmF1dGhvcml6YXRpb24gPSBgQmVhcmVyICR7dG9rZW59YFxuICBpZiAoYm9keSAhPT0gdW5kZWZpbmVkKSBoZWFkZXJzWydjb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJ1xuICBsZXQgcmVzcG9uc2U6IFJlc3BvbnNlXG4gIC8vIEEgcmVxdWVzdCB0aGF0IGhhbmdzIChvZmZsaW5lIGhvdHNwb3QsIGEgY2FwdGl2ZSBuZXR3b3JrKSBpcyB0aGUgc2FtZSBhcyBvbmUgdGhhdCBjYW5ub3QgY29ubmVjdDogc3RhdHVzIDAuXG4gIGNvbnN0IGNvbnRyb2xsZXIgPSB0aW1lb3V0TXMgPyBuZXcgQWJvcnRDb250cm9sbGVyKCkgOiBudWxsXG4gIGNvbnN0IHRpbWVyID0gY29udHJvbGxlciA/IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0TXMpIDogbnVsbFxuICB0cnkge1xuICAgIHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7Y2xvdWRCYXNlVXJsKCl9JHtwYXRofWAsIHtcbiAgICAgIG1ldGhvZCxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5OiBib2R5ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICAgIHNpZ25hbDogY29udHJvbGxlcj8uc2lnbmFsXG4gICAgfSlcbiAgfSBjYXRjaCB7XG4gICAgbm90ZUNsb3VkVW5yZWFjaGFibGUoKVxuICAgIHRocm93IG5ldyBDbG91ZEVycm9yKCdUaGUgTXVvbjNEIHNlcnZpY2UgY291bGQgbm90IGJlIHJlYWNoZWQuJywgMClcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAodGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dCh0aW1lcilcbiAgfVxuICBub3RlQ2xvdWRSZWFjaGVkKClcbiAgLy8gQSBjZW50cmFsLWxvZ2luIGFjY2VzcyB0b2tlbiBsYXN0cyAxNSBtaW51dGVzLiBSZWZyZXNoIG9uY2UgYW5kIHJldHJ5O1xuICAvLyBvbmx5IGZvciB0aGUgc3RvcmVkIHNlc3Npb24sIG5ldmVyIGZvciBhIHRva2VuIHBhc3NlZCBpbi5cbiAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxICYmIHJldHJ5ICYmIHRva2VuICE9PSBudWxsICYmICghc3RpbGxNaW5lIHx8IHN0aWxsTWluZSgpKSkge1xuICAgIC8vIEFub3RoZXIgcmVxdWVzdCBtYXkgYWxyZWFkeSBoYXZlIHJvdGF0ZWQgdGhlIHBhaXIgd2hpbGUgdGhpcyBvbmUnc1xuICAgIC8vIHJlc3BvbnNlIHdhcyBpbiBmbGlnaHQuIFJldXNlIHRoYXQgcGFpciByYXRoZXIgdGhhbiByZWZ1c2luZyB0aGUgbGF0ZVxuICAgIC8vIHJlc3BvbnNlIG9yIHNwZW5kaW5nIHRoZSBuZXcgcmVmcmVzaCB0b2tlbiBhZ2Fpbi5cbiAgICBjb25zdCBjdXJyZW50VG9rZW4gPSBzdG9yZWRUb2tlbigpXG4gICAgaWYgKGN1cnJlbnRUb2tlbiAmJiB0b2tlbiAhPT0gY3VycmVudFRva2VuKSB7XG4gICAgICByZXR1cm4gcmVxdWVzdDxUPihtZXRob2QsIHBhdGgsIGJvZHksIHN0b3JlZFRva2VuKCksIGZhbHNlLCB1bmRlZmluZWQsIHRpbWVvdXRNcylcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRUb2tlbikge1xuICAgICAgY29uc3Qgb3V0Y29tZSA9IGF3YWl0IHJlZnJlc2hPdXRjb21lKClcbiAgICAgIC8vIEFza2VkIGFnYWluOiB0aGUgYWNjb3VudCBjYW4gY2hhbmdlIHdoaWxlIHRoZSByZWZyZXNoIGlzIG9uIGl0cyB3YXkuXG4gICAgICBpZiAob3V0Y29tZSA9PT0gJ29rJyAmJiAoIXN0aWxsTWluZSB8fCBzdGlsbE1pbmUoKSkpIHJldHVybiByZXF1ZXN0PFQ+KG1ldGhvZCwgcGF0aCwgYm9keSwgc3RvcmVkVG9rZW4oKSwgZmFsc2UsIHVuZGVmaW5lZCwgdGltZW91dE1zKVxuICAgICAgLy8gVGhlIGNvbnNvbGUgZGlkIG5vdCBhbnN3ZXI6IHRoYXQgaXMgbm90IGEgc2lnbi1vdXQsIHNvIGRvIG5vdCBsb29rIGxpa2Ugb25lLlxuICAgICAgaWYgKG91dGNvbWUgPT09ICd1bnJlYWNoYWJsZScpIHRocm93IG5ldyBDbG91ZEVycm9yKCdUaGUgTXVvbjNEIHNlcnZpY2UgY291bGQgbm90IGJlIHJlYWNoZWQuJywgMClcbiAgICB9XG4gIH1cbiAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKVxuICBsZXQgZGF0YTogYW55ID0ge31cbiAgdHJ5IHtcbiAgICBkYXRhID0gdGV4dCA/IEpTT04ucGFyc2UodGV4dCkgOiB7fVxuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgQ2xvdWRFcnJvcignVGhlIE11b24zRCBzZXJ2aWNlIHNlbnQgYW4gdW5yZWFkYWJsZSBhbnN3ZXIuJywgcmVzcG9uc2Uuc3RhdHVzKVxuICB9XG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICBpZiAodG9rZW4gIT09IG51bGwgJiYgdG9rZW4gPT09IHN0b3JlZFRva2VuKCkpIG9ic2VydmVEZWxldGlvbihtZXRob2QsIHBhdGgsIHJlc3BvbnNlLnN0YXR1cywgZGF0YSwgc3RhcnRlZEF0KVxuICAgIGNvbnN0IG1lc3NhZ2UgPSByZXNwb25zZS5zdGF0dXMgPT09IDQwMyAmJiBkYXRhLmRlbGV0aW9uX3BlbmRpbmcgPT09IHRydWVcbiAgICAgID8gJ1lvdXIgYWNjb3VudCBpcyB3YWl0aW5nIHRvIGJlIGRlbGV0ZWQuJ1xuICAgICAgOiBkYXRhLmVycm9yID8/IGBUaGUgTXVvbjNEIHNlcnZpY2UgYW5zd2VyZWQgJHtyZXNwb25zZS5zdGF0dXN9LmBcbiAgICB0aHJvdyBuZXcgQ2xvdWRFcnJvcihtZXNzYWdlLCByZXNwb25zZS5zdGF0dXMsIHVuZGVmaW5lZCwgZGF0YSlcbiAgfVxuICBpZiAodG9rZW4gIT09IG51bGwgJiYgdG9rZW4gPT09IHN0b3JlZFRva2VuKCkpIG9ic2VydmVEZWxldGlvbihtZXRob2QsIHBhdGgsIHJlc3BvbnNlLnN0YXR1cywgZGF0YSwgc3RhcnRlZEF0KVxuICByZXR1cm4gZGF0YSBhcyBUXG59XG5cbnR5cGUgTWVBbnN3ZXIgPSB7IGFjY291bnQ6IENsb3VkQWNjb3VudCwgZW5kcG9pbnRfaWQ6IHN0cmluZyB8IG51bGwsIHNlc3Npb25faWQ/OiBzdHJpbmcgfCBudWxsIH1cblxuLyoqXG4gKiBLQU4tMjUwOTogdGhlIGlkIG9mIHRoZSBzZXNzaW9uIHRoaXMgdGFiIGlzIHNpZ25lZCBpbiB3aXRoLCBhcyBgL3YxL21lYCBuYW1lcyBpdC4gSXQgaXMgc3RhYmxlIGFjcm9zcyByZWZyZXNoXG4gKiByb3RhdGlvbiBhbmQgaXMgbm90IGEgc2VjcmV0OyB0aGUgbGl2ZSBzaWduLW91dCBwdXNoIHVzZXMgaXQgdG8gdGVsbCBhIGxlZnRvdmVyIG9mIGFub3RoZXIgYWNjb3VudCBmcm9tIHRoaXMgb25lJ3MuXG4gKiBLZXB0IHdpdGggdGhlIGFjY291bnQgaXQgd2FzIGxlYXJuZWQgZm9yLlxuICovXG5sZXQga25vd25TZXNzaW9uOiB7IGFjY291bnRJZDogc3RyaW5nLCBpZDogc3RyaW5nIH0gfCBudWxsID0gbnVsbFxuXG5mdW5jdGlvbiBub3RlU2Vzc2lvbklkIChhbnN3ZXI6IE1lQW5zd2VyKTogTWVBbnN3ZXIge1xuICBpZiAodHlwZW9mIGFuc3dlci5zZXNzaW9uX2lkID09PSAnc3RyaW5nJyAmJiBhbnN3ZXIuc2Vzc2lvbl9pZCAmJiBhbnN3ZXIuYWNjb3VudD8uaWQpIGtub3duU2Vzc2lvbiA9IHsgYWNjb3VudElkOiBhbnN3ZXIuYWNjb3VudC5pZCwgaWQ6IGFuc3dlci5zZXNzaW9uX2lkIH1cbiAgcmV0dXJuIGFuc3dlclxufVxuXG4vKiogVGhlIHNlc3Npb24gaWQgbGVhcm5lZCBmb3IgYGFjY291bnRJZGAsIG9yIG51bGwgKG5vdCBhc2tlZCB5ZXQsIG9yIGFub3RoZXIgYWNjb3VudCdzKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50U2Vzc2lvbklkIChhY2NvdW50SWQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcbiAgcmV0dXJuIGtub3duU2Vzc2lvbiAmJiBhY2NvdW50SWQgJiYga25vd25TZXNzaW9uLmFjY291bnRJZCA9PT0gYWNjb3VudElkID8ga25vd25TZXNzaW9uLmlkIDogbnVsbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yZ2V0U2Vzc2lvbklkICgpIHtcbiAga25vd25TZXNzaW9uID0gbnVsbFxufVxuXG4vKiogSG93IGxvbmcgYC92MS9tZWAgbWF5IHRha2UgYmVmb3JlIHRoZSBjb25zb2xlIGNvdW50cyBhcyB1bnJlYWNoYWJsZSAob2ZmbGluZTogYSBzdGF0dXMgMCBlcnJvciwgbm8gdG9hc3QpLiAqL1xuZXhwb3J0IGNvbnN0IE1FX1RJTUVPVVRfTVMgPSA4MDAwXG5cbmV4cG9ydCBjb25zdCBjbG91ZEFwaSA9IHtcbiAgY29uZmlnOiBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgcmVxdWVzdDxDbG91ZENvbmZpZz4oJ0dFVCcsICcvdjEvY29uZmlnJylcbiAgICByZW1lbWJlclJlbGF5VXJsKGNvbmZpZy5yZWxheV91cmwpXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9LFxuICBzaWduSW46IChlbWFpbDogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKSA9PlxuICAgIHJlcXVlc3Q8eyB0b2tlbjogc3RyaW5nLCBhY2NvdW50OiBDbG91ZEFjY291bnQgfT4oJ1BPU1QnLCAnL3YxL2F1dGgvc2lnbi1pbicsIHsgZW1haWwsIHBhc3N3b3JkIH0pLFxuICAvKiogVGhlIGNvZGUgdGhhdCBmaW5pc2hlcyBhIHR3by1zdGVwIHNpZ24taW46IGFuIGF1dGhlbnRpY2F0b3IgY29kZSBvciBhIHJlY292ZXJ5IGNvZGUsIHdpdGggdGhlIGBtZmFfdG9rZW5gIHRoZSBwYXNzd29yZCBzdGVwIGFuc3dlcmVkLiAqL1xuICBzaWduSW5Db2RlOiAobWZhVG9rZW46IHN0cmluZywgY29kZTogc3RyaW5nKSA9PlxuICAgIHJlcXVlc3Q8eyB0b2tlbjogc3RyaW5nLCBhY2NvdW50OiBDbG91ZEFjY291bnQgfT4oJ1BPU1QnLCAnL3YxL2F1dGgvbWZhJywgeyBtZmFfdG9rZW46IG1mYVRva2VuLCBjb2RlIH0sIG51bGwsIGZhbHNlKSxcbiAgc2lnblVwOiAoZW1haWw6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBkZWNsYXJlZEFnZT86IG51bWJlcikgPT5cbiAgICByZXF1ZXN0PHsgdG9rZW46IHN0cmluZywgYWNjb3VudDogQ2xvdWRBY2NvdW50IH0+KCdQT1NUJywgJy92MS9hdXRoL3NpZ24tdXAnLCB7IGVtYWlsLCBwYXNzd29yZCwgbmFtZSwgZGVjbGFyZWRfYWdlOiBkZWNsYXJlZEFnZSB9KSxcbiAgc2lnbk91dDogKCkgPT4gcmVxdWVzdDx7IG9rOiBib29sZWFuIH0+KCdQT1NUJywgJy92MS9hdXRoL3NpZ24tb3V0JyksXG4gIG1lOiBhc3luYyAoKSA9PiBub3RlU2Vzc2lvbklkKGF3YWl0IHJlcXVlc3Q8TWVBbnN3ZXI+KCdHRVQnLCAnL3YxL21lJywgdW5kZWZpbmVkLCBzdG9yZWRUb2tlbigpLCB0cnVlLCB1bmRlZmluZWQsIE1FX1RJTUVPVVRfTVMpKSxcbiAgLyoqIGBtZWAgdGhhdCBuZXZlciByZWZyZXNoZXM6IGZvciB1c2Ugd2hpbGUgYSByZWZyZXNoIGlzIGl0c2VsZiBpbiBwcm9ncmVzcyAoaXQgd291bGQgd2FpdCBmb3IgaXRzZWxmKS4gKi9cbiAgbWVXaXRob3V0UmVmcmVzaDogYXN5bmMgKCkgPT4gbm90ZVNlc3Npb25JZChhd2FpdCByZXF1ZXN0PE1lQW5zd2VyPignR0VUJywgJy92MS9tZScsIHVuZGVmaW5lZCwgc3RvcmVkVG9rZW4oKSwgZmFsc2UpKSxcbiAgLyoqXG4gICAqIEEgc2lnbmVkIGFzc2VydGlvbiBvZiB0aGlzIGFjY291bnQgZm9yIGFub3RoZXIgTXVvbjNEIHNlcnZpY2UgKHRoZVxuICAgKiBtb2RlbCBzZXJ2aWNlJ3MgTGlicmFyeSksIHdoaWNoIG5ldmVyIHNlZXMgdGhlIGNvbnNvbGUgc2Vzc2lvbi4gSXQgbGl2ZXNcbiAgICogbWludXRlczsgYGV4cGlyZXNfYXRgIGlzIGluIHNlY29uZHMuXG4gICAqL1xuICBhc3NlcnRpb246IChhdWRpZW5jZTogc3RyaW5nKSA9PiB7XG4gICAgLy8gQXNrZWQgZm9yIHRoZSBhY2NvdW50IHNpZ25lZCBpbiBub3cuIEEgNDAxIGlzIHJldHJpZWQgb25seSB3aGlsZSB0aGF0IGFjY291bnQgaXMgc3RpbGwgdGhlIG9uZSBzaWduZWQgaW46IHRoZVxuICAgIC8vIHJldHJ5IHVzZXMgd2hhdGV2ZXIgdG9rZW4gaXMgc3RvcmVkIHRoZW4sIHdoaWNoIGFmdGVyIGEgc3dpdGNoIGlzIHRoZSBuZXh0IGFjY291bnQncy5cbiAgICBjb25zdCBvd25lciA9IGN1cnJlbnRBY2NvdW50KCkuaWRcbiAgICByZXR1cm4gcmVxdWVzdDx7IGFzc2VydGlvbjogc3RyaW5nLCBleHBpcmVzX2F0OiBudW1iZXIgfT4oJ1BPU1QnLCAnL3YxL21lL2Fzc2VydGlvbicsIHsgYXVkaWVuY2UgfSwgc3RvcmVkVG9rZW4oKSwgdHJ1ZSwgKCkgPT4gb3duZXIgIT09IG51bGwgJiYgY3VycmVudEFjY291bnQoKS5pZCA9PT0gb3duZXIpXG4gIH0sXG4gIHJlZ2lzdGVyRW5kcG9pbnQ6IChlbmRwb2ludElkOiBzdHJpbmcpID0+XG4gICAgcmVxdWVzdDx7IGVuZHBvaW50X2lkOiBzdHJpbmcgfT4oJ1BVVCcsICcvdjEvbWUvZW5kcG9pbnQnLCB7IGVuZHBvaW50X2lkOiBlbmRwb2ludElkIH0pLFxuICBwcmludGVyczogKCkgPT4gcmVxdWVzdDx7IHByaW50ZXJzOiBDbG91ZFByaW50ZXJbXSB9PignR0VUJywgJy92MS9wcmludGVycycpLFxuICByZW5hbWVQcmludGVyOiAoaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKSA9PlxuICAgIHJlcXVlc3Q8eyBvazogYm9vbGVhbiwgbmFtZTogc3RyaW5nIH0+KCdQQVRDSCcsIGAvdjEvcHJpbnRlcnMvJHtpZH1gLCB7IG5hbWUgfSksXG4gIC8qKiBUaGUgb3duZXIgc2V0cyB3aG8gZmluZHMgdGhlIHByaW50ZXIuIGA0MDRgIGZvciBhbnlvbmUgZWxzZSwgYDQwMGAgZm9yIGFuIHVua25vd24gbGV2ZWwuICovXG4gIHNldERpc2NvdmVyeTogKGlkOiBzdHJpbmcsIGxldmVsOiBEaXNjb3ZlcnlMZXZlbCkgPT5cbiAgICByZXF1ZXN0PHsgb2s6IGJvb2xlYW4sIGxldmVsOiBEaXNjb3ZlcnlMZXZlbCB9PignUFVUJywgYC92MS9wcmludGVycy8ke2lkfS9kaXNjb3ZlcnlgLCB7IGxldmVsIH0pLFxuICBub3RpY2VzOiAobGltaXQgPSA1MCkgPT5cbiAgICByZXF1ZXN0PHsgbm90aWNlczogTm90aWNlW10sIHVucmVhZDogbnVtYmVyLCBuZXh0OiBzdHJpbmcgfCBudWxsIH0+KCdHRVQnLCBgL3YxL21lL25vdGljZXM/bGltaXQ9JHtsaW1pdH1gKSxcbiAgcmVhZE5vdGljZTogKGlkOiBzdHJpbmcpID0+XG4gICAgcmVxdWVzdDx7IG5vdGljZTogTm90aWNlIH0+KCdQT1NUJywgYC92MS9tZS9ub3RpY2VzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGlkKX0vcmVhZGApLFxuICB1bmxpbmtQcmludGVyOiAoaWQ6IHN0cmluZykgPT4gcmVxdWVzdDx7IG9rOiBib29sZWFuIH0+KCdERUxFVEUnLCBgL3YxL3ByaW50ZXJzLyR7aWR9YCksXG4gIGFjY2VzczogKGlkOiBzdHJpbmcpID0+IHJlcXVlc3Q8QWNjZXNzSGFuZG9mZj4oJ1BPU1QnLCBgL3YxL3ByaW50ZXJzLyR7aWR9L2FjY2Vzc2ApLFxuICAvKiogQ2xhaW1zIHRoZSBwcmludGVyIHNob3dpbmcgYGNvZGVgIG9uIGl0cyBzY3JlZW4uIFRoZSBjb2RlIGlzIHRoZSBvbmx5IHdheSB0byBsaW5rLiAqL1xuICBjbGFpbTogKGNvZGU6IHN0cmluZykgPT5cbiAgICByZXF1ZXN0PHsgcHJpbnRlcl9pZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHN0YXRlOiBMaW5rU3RhdGUsIGV4cGlyZXNfYXQ6IG51bWJlciB9PignUE9TVCcsICcvdjEvbGlua3MvY2xhaW0nLCB7IGNvZGUgfSksXG4gIC8qKiBBc2tzIGEgcHJpbnRlciBvbiB0aGlzIGJyb3dzZXIncyBuZXR3b3JrIHRvIHNob3cgYSBsaW5rIGNvZGUuIExpbmtzIG5vdGhpbmcgYnkgaXRzZWxmLiAqL1xuICBzdGFydExpbms6IChwcmludGVySWQ6IHN0cmluZykgPT4gcmVxdWVzdDx7IG9rOiBib29sZWFuIH0+KCdQT1NUJywgJy92MS9saW5rcy9zdGFydCcsIHsgcHJpbnRlcl9pZDogcHJpbnRlcklkIH0pLFxuICAvKiogUHJpbnRlcnMgb24gdGhpcyBicm93c2VyJ3MgbmV0d29yaywgYXMgdGhlIE11b24zRCBzZXJ2aWNlIHNlZXMgdGhlbS4gTm8gc2lnbi1pbiBuZWVkZWQuICovXG4gIG5lYXJieTogKCkgPT5cbiAgICByZXF1ZXN0PHsgcHJpbnRlcnM6IEFycmF5PHsgcHJpbnRlcl9pZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIG1vZGVsOiBzdHJpbmcsIGxpbmtlZDogYm9vbGVhbiwgbG9jYWxfYWRkcnM/OiBzdHJpbmdbXSwgc2VjdXJlX25hbWU/OiBzdHJpbmcgfCBudWxsIH0+IH0+KCdHRVQnLCAnL3YxL2xpbmtzL25lYXJieScpLFxuICBsaW5rU3RhdGU6IChpZDogc3RyaW5nKSA9PiByZXF1ZXN0PHsgcHJpbnRlcl9pZDogc3RyaW5nLCBzdGF0ZTogTGlua1N0YXRlIH0+KCdHRVQnLCBgL3YxL2xpbmtzLyR7aWR9YCksXG4gIGdldExheW91dDogKCkgPT4gcmVxdWVzdDx7IGxheW91dDogYW55IH0+KCdHRVQnLCAnL3YxL2ZsZWV0L2xheW91dCcpLFxuICBwdXRMYXlvdXQ6IChsYXlvdXQ6IHVua25vd24sIHN0aWxsTWluZT86ICgpID0+IGJvb2xlYW4pID0+IHJlcXVlc3Q8eyBvazogYm9vbGVhbiB9PignUFVUJywgJy92MS9mbGVldC9sYXlvdXQnLCB7IGxheW91dCB9LCBzdG9yZWRUb2tlbigpLCB0cnVlLCBzdGlsbE1pbmUpLFxuICAvKiogVGhlIGNlbnRyYWwgbG9naW4ncyBjb2RlIGV4Y2hhbmdlIChgV0VCLTEyYCkuICovXG4gIGV4Y2hhbmdlQ29kZTogKGNvZGU6IHN0cmluZywgcmVkaXJlY3RVcmk6IHN0cmluZywgdmVyaWZpZXI6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpID0+XG4gICAgdG9rZW5SZXF1ZXN0KHsgZ3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZScsIGNvZGUsIHJlZGlyZWN0X3VyaTogcmVkaXJlY3RVcmksIGNsaWVudF9pZDogY2xpZW50SWQoKSwgY29kZV92ZXJpZmllcjogdmVyaWZpZXIgfSwgc2lnbmFsKSxcbiAgLyoqXG4gICAqIEEgc2luZ2xlLXVzZSBjb2RlIHRoYXQgb3BlbnMgdGhlIGNvbnNvbGUncyBicm93c2VyIHNlc3Npb24gYXRcbiAgICogYC9oYW5kb2ZmYC4gVGFrZXMgdGhlIHRva2VuIG9mIGEgc2Vzc2lvbiB0aGF0IHNpZ25lZCBpbiBoZXJlLCB3aGljaCBpc1xuICAgKiBuZXZlciBhIGAvdG9rZW5gIHNlc3Npb24gKHRob3NlIGdldCBgNDAzYCkuXG4gICAqL1xuICBoYW5kb2ZmOiAodG9rZW46IHN0cmluZykgPT5cbiAgICByZXF1ZXN0PHsgY29kZTogc3RyaW5nLCB1cmw6IHN0cmluZywgZXhwaXJlc19hdDogbnVtYmVyIH0+KCdQT1NUJywgJy92MS9oYW5kb2ZmJywgdW5kZWZpbmVkLCB0b2tlbiwgZmFsc2UpLFxuICAvKiogU2lnbnMgaW4gd2l0aCBhIHBhc3N3b3JkIGZvciBhIHNlc3Npb24gdGhhdCBpcyBub3Qga2VwdDogdGhlIHNpZ24taW4gcGFnZSBoYW5kcyBpdCBvZmYuICovXG4gIHNpZ25JbkZvcjogKGVtYWlsOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpID0+XG4gICAgcmVxdWVzdDx7IHRva2VuOiBzdHJpbmcsIGFjY291bnQ6IENsb3VkQWNjb3VudCB9PignUE9TVCcsICcvdjEvYXV0aC9zaWduLWluJywgeyBlbWFpbCwgcGFzc3dvcmQsIGRldmljZTogJ011b24zRCBzaWduLWluJyB9LCBudWxsLCBmYWxzZSksXG4gIHNpZ25VcEZvcjogKGVtYWlsOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZGVjbGFyZWRBZ2U/OiBudW1iZXIpID0+XG4gICAgcmVxdWVzdDx7IHRva2VuOiBzdHJpbmcsIGFjY291bnQ6IENsb3VkQWNjb3VudCB9PignUE9TVCcsICcvdjEvYXV0aC9zaWduLXVwJywgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIGRlY2xhcmVkX2FnZTogZGVjbGFyZWRBZ2UsIGRldmljZTogJ011b24zRCBzaWduLWluJyB9LCBudWxsLCBmYWxzZSksXG4gIC8qKiBKb2lucyB3aXRoIGFuIGludml0ZSBsaW5rJ3MgY29kZSAoQUItQ09OLTEpLiAqL1xuICBqb2luOiAoY29kZTogc3RyaW5nKSA9PiByZXF1ZXN0PEpvaW5BbnN3ZXI+KCdQT1NUJywgYC92MS9saW5rcy9qb2luLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGNvZGUpfWApLFxuICBhcHByb3ZhbDogKGlkOiBzdHJpbmcpID0+IHJlcXVlc3Q8eyBhcHByb3ZhbDogQXBwcm92YWwgfT4oJ0dFVCcsIGAvdjEvYXBwcm92YWxzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGlkKX1gKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFRQSxTQUFTLG9CQUFvQixnQkFBZ0IsdUJBQXVCO0FBQ3BFLFNBQVMsZUFBZSxrQkFBa0IsdUJBQXVCO0FBQ2pFLFNBQVMsNkJBQTZCO0FBQ3RDLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsa0JBQWtCLDRCQUE0QjtBQUN2RCxTQUFTLHFCQUFxQjtBQUV2QixhQUFNLFlBQVk7QUFFbEIsYUFBTSxjQUFjO0FBQzNCLE1BQU0sVUFBVTtBQUdULGFBQU0sWUFBWTtBQUdsQixhQUFNLG9CQUFvQjtBQUcxQixnQkFBUyxTQUFVLFdBQWdFLFdBQVcsVUFBa0I7QUFDckgs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