import { visibleInterval } from "/src/util/visible-interval.ts";
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import {
  cloudApi,
  CloudError,
  setSessionHooks,
  storedToken,
  storeRefreshToken,
  currentSessionId,
  forgetSessionId,
  storeToken,
  TOKEN_KEY
} from "/src/services/muon-cloud/api.ts";
import { watchFocus } from "/src/services/muon-cloud/focus-check.ts";
import { centralLoginEnabled, clearSilentAttempt, holdSilentSignIn, redirectUri, signInAgainOnPrinterOrigin, signOutCentral, takeCallback } from "/src/services/muon-cloud/centralLogin.ts";
import { cloudUnreachable } from "/src/services/muon-cloud/outage.ts";
import { browserEndpoint, forgetBrowserKey, managedEndpointFactory } from "/src/services/muon-cloud/iroh.ts";
import { createPrinterTransportForSelection } from "/src/services/managed-transport/index.ts";
import { consolePresence } from "/src/services/muon-cloud/presence.ts";
import { relayUrlForBluetooth } from "/src/services/muon-cloud/relay.ts";
import { announceAccount, confirmedAccountId, confirmToken, currentAccount, identityOf, SIGNED_OUT } from "/src/services/muon-cloud/account-events.ts";
import { STATUS_QUERY, statusFrom } from "/src/services/muon-cloud/status.ts";
import { deletionState } from "/src/services/muon-cloud/deletion.ts";
import { forgetOwnAvatar } from "/src/services/account/avatar.ts";
import { bluetoothCarrying, wantsBluetoothFor } from "/src/services/muon-ble/link.ts";
import { isPrinterSecureOrigin } from "/src/services/secure-origin/index.ts";
import { forgetSecureReach } from "/src/services/secure-origin/hosted.ts";
import { mayDialBluetooth, noteBluetoothFailure, noteBluetoothSuccess } from "/src/services/muon-ble/retry.ts";
import { requestRefused } from "/src/services/managed-transport/refusal.ts";
import { onEndpointRebound } from "/src/services/muon-cloud/endpoint-hooks.ts";
import { ENDED_KEY, reconnectIfTokenChanged, sessionStreamAvailable, startSessionStream, stopSessionStream } from "/src/services/muon-cloud/session-events.ts";
import { forgetSignedOut, noteSignedOut, scopeOfReason } from "/src/services/account/signed-out-note.ts";
const ACTIVE_KEY = "muon.cloud.active";
export const DEFAULT_FLEET_LAYOUT = {
  groups: [],
  widgets: {
    model: true,
    progress: true,
    temps: true,
    eta: true,
    file: true,
    position: true,
    layer: true,
    factors: false
  },
  density: "comfortable"
};
export const cloudState = Vue.observable({
  ready: false,
  account: null,
  config: null,
  printers: [],
  printersAsOf: 0,
  status: {},
  activePrinterId: readActive(),
  layout: { ...DEFAULT_FLEET_LAYOUT },
  error: null,
  endpointId: null
});
function readActive() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
export function setActiveCloudPrinter(id) {
  cloudState.activePrinterId = id;
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
  }
}
const statusConnections = /* @__PURE__ */ new Map();
const grants = /* @__PURE__ */ new Map();
const polling = /* @__PURE__ */ new Set();
let sessionAbort = new AbortController();
let endpointRegistration = null;
let stopPollTimer = null;
let stopPrintersTimer = null;
async function ensureEndpoint() {
  if (!endpointRegistration) {
    const signal = sessionAbort.signal;
    const pending = (async () => {
      if (!cloudState.config) cloudState.config = await cloudApi.config();
      signal.throwIfAborted();
      const endpoint = await browserEndpoint(cloudState.config.relay_url);
      signal.throwIfAborted();
      const id = endpoint.endpointId();
      if (cloudState.endpointId !== id) {
        await cloudApi.registerEndpoint(id);
        signal.throwIfAborted();
        cloudState.endpointId = id;
      }
    })();
    endpointRegistration = pending;
    pending.finally(() => {
      if (endpointRegistration === pending) endpointRegistration = null;
    }).catch(() => {
    });
  }
  return endpointRegistration;
}
function waitForRetry(ms, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
function deletionRefusal() {
  if (deletionState.deleteAfter === null) return null;
  return new CloudError("Your account is waiting to be deleted.", 403, void 0, {
    deletion_pending: true,
    delete_after: deletionState.deleteAfter
  });
}
async function askConsole(printerId, signal) {
  await ensureEndpoint();
  let delay = 1e3;
  for (; ; ) {
    signal.throwIfAborted();
    const printer = cloudState.printers.find((p) => p.id === printerId);
    if (printer && consolePresence(printer) === "offline") throw new CloudError("Printer is offline", 503);
    try {
      const grant = await cloudApi.access(printerId);
      signal.throwIfAborted();
      return grant;
    } catch (error) {
      signal.throwIfAborted();
      if (!(error instanceof CloudError) || error.status !== 503) throw error;
      await waitForRetry(delay, signal);
      delay = Math.min(15e3, delay * 2);
    }
  }
}
export function requestAccess(printerId) {
  const refused = deletionRefusal();
  if (refused) return Promise.reject(refused);
  const existing = grants.get(printerId);
  if (existing) return existing;
  const pending = askConsole(printerId, sessionAbort.signal);
  grants.set(printerId, pending);
  pending.finally(() => {
    if (grants.get(printerId) === pending) grants.delete(printerId);
  }).catch(() => {
  });
  return pending;
}
export const BLUETOOTH_GRANT_GRACE_MS = 4e3;
export const BLUETOOTH_ONLINE_GRANT_WAIT_MS = 2e4;
async function bluetoothHandoff(printerId, signal) {
  const refused = deletionRefusal();
  if (refused) throw refused;
  const own = new AbortController();
  const session = sessionAbort.signal;
  const endWithSession = () => own.abort();
  session.addEventListener("abort", endWithSession, { once: true });
  let timer;
  let grant;
  try {
    const wait = BLUETOOTH_GRANT_GRACE_MS;
    const offAccount = cloudState.ready && !cloudState.printers.some((p) => p.id === printerId);
    const offline = cloudUnreachable() || offAccount;
    const asked = offline ? Promise.resolve(null) : askConsole(printerId, own.signal).catch(() => null);
    grant = await Promise.race([
      asked,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), offline ? 0 : wait);
      })
    ]);
  } finally {
    clearTimeout(timer);
    session.removeEventListener("abort", endWithSession);
    own.abort();
  }
  signal.throwIfAborted();
  const refusedNow = deletionRefusal();
  if (refusedNow) throw refusedNow;
  if (grant) return sessionFrom(grant);
  const relayUrl = relayUrlForBluetooth(cloudState.config?.relay_url);
  signal.throwIfAborted();
  return {
    contractVersion: "managed-iroh/v1",
    sessionId: `bluetooth-${printerId}`,
    tenantId: cloudState.account?.id ?? "local",
    printerId,
    relayUrl,
    expiresAt: new Date(Date.now() + 36e5).toISOString(),
    grantless: true
  };
}
function sessionFrom(grant) {
  return {
    contractVersion: "managed-iroh/v1",
    sessionId: grant.grant_id,
    tenantId: cloudState.account?.id ?? "",
    printerId: grant.printer_id,
    relayUrl: grant.relay_url,
    expiresAt: new Date(grant.expires_at * 1e3).toISOString()
  };
}
async function handoff(printerId, signal) {
  signal.throwIfAborted();
  if (wantsBluetoothFor(printerId)) return bluetoothHandoff(printerId, signal);
  const grant = await requestAccess(printerId);
  signal.throwIfAborted();
  return sessionFrom(grant);
}
async function refreshHandoff(printerId, signal) {
  const printer = cloudState.printers.find((p) => p.id === printerId);
  if (!printer || consolePresence(printer) !== "online") throw new Error("The console does not see this printer online");
  return handoff(printerId, signal);
}
async function statusConnection(printerId) {
  let existing = statusConnections.get(printerId);
  if (!existing) {
    const signal = sessionAbort.signal;
    existing = createPrinterTransportForSelection(
      { kind: "managed-iroh", printerId },
      { handoffSelectedPrinter: (id) => handoff(id, signal), refreshSelectedPrinter: (id) => refreshHandoff(id, signal), createManagedEndpoint: managedEndpointFactory }
    );
    statusConnections.set(printerId, existing);
    const pending = existing;
    pending.catch(() => {
      if (statusConnections.get(printerId) === pending) statusConnections.delete(printerId);
    });
  }
  return existing;
}
export function dropOtherCloudConnections(except) {
  for (const id of [...statusConnections.keys()]) if (id.toLowerCase() !== except.toLowerCase()) dropCloudConnection(id);
}
onEndpointRebound(dropOtherCloudConnections);
export function dropCloudConnection(printerId) {
  const existing = statusConnections.get(printerId);
  if (!existing) return;
  statusConnections.delete(printerId);
  polling.delete(printerId);
  existing.then((c) => c.close()).catch(() => {
  });
}
export const STATUS_TIMEOUT_MS = 6e3;
export const OFFLINE_AFTER_FAILURES = 2;
const pollFailures = /* @__PURE__ */ new Map();
class StatusSilence extends Error {
  constructor() {
    super("No answer from the printer");
  }
}
async function pollOne(printer) {
  const signal = sessionAbort.signal;
  const unavailable = (error) => {
    if (signal.aborted) return;
    Vue.set(cloudState.status, printer.id, { ...cloudState.status[printer.id], reachable: false, error, updatedAt: Date.now() });
  };
  const refused = () => {
    if (!cloudState.status[printer.id]) unavailable("refused");
  };
  const overBluetooth = wantsBluetoothFor(printer.id);
  const presence = bluetoothCarrying(printer.id) ? "online" : consolePresence(printer);
  if (presence !== "online") unavailable(presence);
  if (presence === "offline" && !overBluetooth || polling.has(printer.id)) return;
  if (!overBluetooth) noteBluetoothSuccess(printer.id);
  else if (!mayDialBluetooth(printer.id)) return;
  polling.add(printer.id);
  try {
    const connection = await statusConnection(printer.id);
    let silence;
    const response = await Promise.race([
      connection.fetch(STATUS_QUERY),
      new Promise((_resolve, reject) => {
        silence = setTimeout(() => reject(new StatusSilence()), STATUS_TIMEOUT_MS);
      })
    ]).finally(() => clearTimeout(silence));
    if (requestRefused({ status: response.status })) return refused();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const s = (await response.json()).result.status;
    if (signal.aborted) return;
    pollFailures.delete(printer.id);
    if (overBluetooth) noteBluetoothSuccess(printer.id);
    const latest = cloudState.printers.find((p) => p.id === printer.id);
    if (!latest) return;
    const presence2 = bluetoothCarrying(printer.id) ? "online" : consolePresence(latest);
    Vue.set(cloudState.status, printer.id, {
      reachable: presence2 === "online",
      error: presence2 === "online" ? void 0 : presence2,
      ...statusFrom(s),
      updatedAt: Date.now()
    });
  } catch (error) {
    if (requestRefused(error)) return refused();
    if (overBluetooth && !signal.aborted) noteBluetoothFailure(printer.id, error);
    const failed = (pollFailures.get(printer.id) ?? 0) + 1;
    pollFailures.set(printer.id, failed);
    const latest = cloudState.printers.find((p) => p.id === printer.id);
    const offline = failed >= OFFLINE_AFTER_FAILURES || error instanceof StatusSilence;
    if (latest) unavailable(consolePresence(latest) === "offline" || offline ? "offline" : "reconnecting");
  } finally {
    if (!signal.aborted) polling.delete(printer.id);
  }
}
export function cloudPrinterConnection(printerId) {
  return statusConnection(printerId);
}
export async function borrowCloudPrinter(printerId) {
  const shared = await statusConnection(printerId);
  const sockets = /* @__PURE__ */ new Set();
  let closed = false;
  return {
    async fetch(path, init, progress) {
      if (closed) throw new Error("Printer page closed");
      const response = await shared.fetch(path, init, progress);
      if (closed) throw new Error("Printer page closed");
      return response;
    },
    async openWebSocket(path) {
      if (closed) throw new Error("Printer page closed");
      const socket = await shared.openWebSocket(path);
      if (closed) {
        socket.close();
        throw new Error("Printer page closed");
      }
      sockets.add(socket);
      socket.addEventListener("close", () => sockets.delete(socket));
      return socket;
    },
    close() {
      closed = true;
      for (const socket of sockets) socket.close();
      sockets.clear();
    }
  };
}
async function pollAll() {
  if (deletionState.deleteAfter !== null) {
    for (const connection of statusConnections.values()) connection.then((c) => c.close()).catch(() => {
    });
    statusConnections.clear();
    if (Object.keys(cloudState.status).length) cloudState.status = {};
    return;
  }
  await Promise.all(cloudState.printers.map((p) => pollOne(p)));
}
export async function refreshPrinters() {
  if (!cloudState.account || deletionState.deleteAfter !== null) return;
  const owner = cloudState.account.id;
  const signal = sessionAbort.signal;
  const current = () => !signal.aborted && cloudState.account?.id === owner;
  try {
    const sentAt = Date.now();
    const { printers } = await cloudApi.printers();
    if (!current()) return;
    cloudState.printers = printers;
    cloudState.printersAsOf = sentAt;
  } catch (error) {
    if (current() && error instanceof CloudError && error.status === 401) await sessionRefused();
  }
}
function startPolling() {
  stopPolling();
  stopPollTimer = visibleInterval(() => {
    pollAll();
  }, 3e3);
  stopPrintersTimer = visibleInterval(() => {
    refreshPrinters();
  }, 1e4);
  pollAll();
}
function stopPolling() {
  stopPollTimer?.();
  stopPrintersTimer?.();
  stopPollTimer = stopPrintersTimer = null;
}
let signOutHolds = 0;
let dropDeferred = false;
let deferredReason;
export function holdSignOut() {
  signOutHolds++;
}
export function releaseSignOut(dropNow = true) {
  if (signOutHolds > 0) signOutHolds--;
  if (signOutHolds === 0 && dropDeferred) {
    dropDeferred = false;
    const reason = deferredReason;
    deferredReason = void 0;
    if (dropNow) sessionRefused(true, reason).catch(() => {
    });
  }
}
let refusing = null;
let refusingReason;
let refusingEmail;
let refusingDropped = false;
function sessionRefused(force = false, reason) {
  if (!refusing) {
    refusingReason = reason;
    refusingEmail = cloudState.account?.email;
    refusingDropped = false;
    refusing = (async () => {
      if (!await dropSession(force, refusingReason)) return;
      refusingDropped = true;
      if (refusingReason) {
        showSignedOut(refusingReason, refusingEmail);
        return;
      }
      await signInAgainOnPrinterOrigin().catch(() => {
      });
    })().finally(() => {
      refusing = null;
    });
  } else if (reason && !refusingReason) {
    refusingReason = reason;
    if (signOutHolds > 0) deferredReason = reason;
    else if (refusingDropped) showSignedOut(reason, refusingEmail);
  }
  return refusing;
}
let leaveForSignedOut = () => {
  window.location.assign("/signed-out");
};
export function setSignedOutNavigation(go) {
  leaveForSignedOut = go;
}
function showSignedOut(reason, email) {
  try {
    if (window.location.pathname === "/signed-out") return;
    noteSignedOut({ scope: scopeOfReason(reason), email, reason });
    leaveForSignedOut();
  } catch {
  }
}
async function dropSession(force = false, reason) {
  if (signOutHolds > 0 && !force) {
    dropDeferred = true;
    if (reason) deferredReason = reason;
    return false;
  }
  dropDeferred = false;
  deferredReason = void 0;
  stopSessionStream();
  forgetSessionId();
  if (cloudState.account || currentAccount().signedIn) announceAccount(SIGNED_OUT);
  confirmToken(null);
  stopReconcileRetry();
  forgetOwnAvatar();
  forgetSecureReach();
  stopPolling();
  sessionAbort.abort();
  sessionAbort = new AbortController();
  endpointRegistration = null;
  grants.clear();
  polling.clear();
  storeToken(null);
  storeRefreshToken(null);
  for (const c of statusConnections.values()) c.then((p) => p.close()).catch(() => {
  });
  statusConnections.clear();
  cloudState.account = null;
  cloudState.printers = [];
  cloudState.status = {};
  cloudState.endpointId = null;
  cloudState.layout = defaultLayout();
  layoutEdits++;
  return true;
}
let layoutEdits = 0;
function defaultLayout() {
  return { ...DEFAULT_FLEET_LAYOUT, groups: [], widgets: { ...DEFAULT_FLEET_LAYOUT.widgets } };
}
async function adoptSession(token, account, fresh = false) {
  if (fresh) {
    forgetSessionId();
    forgetSignedOut();
  }
  if (cloudState.account?.id !== account.id) announceAccount(identityOf(account));
  storeToken(token);
  confirmToken(token);
  if (cloudState.account?.id !== account.id) {
    cloudState.layout = defaultLayout();
    layoutEdits++;
  }
  cloudState.account = account;
  cloudState.error = null;
  const editsBefore = layoutEdits;
  const signal = sessionAbort.signal;
  const current = () => !signal.aborted && cloudState.account?.id === account.id;
  await refreshPrinters();
  if (!current()) return;
  try {
    const { layout } = await cloudApi.getLayout();
    if (layoutEdits === editsBefore && current()) cloudState.layout = { ...DEFAULT_FLEET_LAYOUT, ...layout, widgets: { ...DEFAULT_FLEET_LAYOUT.widgets, ...layout?.widgets ?? {} } };
  } catch {
  }
  if (!current()) return;
  startPolling();
  watchSessionEnd(account.id);
}
function watchSessionEnd(accountId) {
  if (!sessionStreamAvailable()) return;
  if (!currentSessionId(accountId)) cloudApi.me().catch(() => {
  });
  startSessionStream(streamDeps);
}
export function publishEnded(reason, sessionId, token) {
  if (storedToken() !== token) return false;
  const why = reason ?? "signed_out";
  try {
    localStorage.setItem(ENDED_KEY, JSON.stringify({ reason: why, session_id: sessionId ?? currentSessionId(cloudState.account?.id), at: Date.now() }));
  } catch {
  }
  sessionRefused(false, why).catch(() => {
  });
  return true;
}
const streamDeps = { sessionId: () => currentSessionId(cloudState.account?.id), onEnded: publishEnded };
function endedElsewhere(raw) {
  if (!raw || !cloudState.account) return;
  try {
    const note = JSON.parse(raw);
    const mine = currentSessionId(cloudState.account.id);
    if (!mine || note.session_id !== mine || typeof note.reason !== "string") return;
    sessionRefused(false, note.reason).catch(() => {
    });
  } catch {
  }
}
try {
  window.addEventListener("storage", (event) => {
    if (event.key === ENDED_KEY) return endedElsewhere(event.newValue);
    if (event.key !== TOKEN_KEY && event.key !== null) return;
    if (!storedToken()) {
      if (cloudState.account) dropSession();
      return;
    }
    reconcileStoredSession().catch(() => {
    });
  });
} catch {
}
watchFocus(() => cloudState.account !== null, () => cloudApi.me());
let reconciling = null;
export function reconcileStoredSession() {
  if (!reconciling) reconciling = reconcileOnce().finally(() => {
    reconciling = null;
  });
  return reconciling;
}
async function reconcileOnce() {
  for (; ; ) {
    const token = storedToken();
    if (!token) return stopReconcileRetry();
    let me;
    try {
      me = await cloudApi.me();
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) {
        stopReconcileRetry();
        await sessionRefused();
      } else if (storedToken() && isTransient(error)) {
        scheduleReconcileRetry();
      }
      return;
    }
    const now = storedToken();
    if (!now) return stopReconcileRetry();
    if (now !== token) continue;
    stopReconcileRetry();
    if (cloudState.account?.id === me.account.id) {
      confirmToken(now);
      reconnectIfTokenChanged();
    } else await adoptSession(now, me.account);
    return;
  }
}
const isTransient = (error) => error instanceof CloudError && (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500 || error.status >= 200 && error.status < 300);
export function resetReconcileForTests() {
  stopReconcileRetry();
}
export const RECONCILE_RETRY_MS = [5e3, 15e3, 6e4, 3e5];
let reconcileTimer = null;
let reconcileAttempts = 0;
function scheduleReconcileRetry() {
  if (reconcileTimer !== null) return;
  const token = storedToken();
  if (!token || confirmedAccountId(token)) return;
  const wait = RECONCILE_RETRY_MS[Math.min(reconcileAttempts, RECONCILE_RETRY_MS.length - 1)];
  reconcileAttempts++;
  reconcileTimer = setTimeout(() => {
    reconcileTimer = null;
    reconcileStoredSession().catch(() => {
    });
  }, wait);
}
function stopReconcileRetry() {
  if (reconcileTimer !== null) clearTimeout(reconcileTimer);
  reconcileTimer = null;
  reconcileAttempts = 0;
}
try {
  window.addEventListener("online", () => {
    const token = storedToken();
    if (!token || confirmedAccountId(token)) return;
    if (reconcileTimer !== null) {
      clearTimeout(reconcileTimer);
      reconcileTimer = null;
    }
    reconcileStoredSession().catch(() => {
    });
  });
} catch {
}
setSessionHooks({
  refused: (reason) => {
    sessionRefused(false, reason).catch(() => {
    });
  },
  check: () => {
    reconcileStoredSession().catch(() => {
    });
  },
  async recovered() {
    const asked = storedToken();
    try {
      const me = await cloudApi.meWithoutRefresh();
      const token = storedToken();
      if (!token) return false;
      if (token !== asked) {
        reconcileStoredSession().catch(() => {
        });
        return true;
      }
      if (cloudState.account?.id === me.account.id) confirmToken(token);
      else adoptSession(token, me.account).catch(() => {
      });
      startSessionStream(streamDeps);
      return true;
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) {
        await dropSession();
        return false;
      }
      if (isTransient(error)) scheduleReconcileRetry();
      return true;
    }
  }
});
async function completeCentralSignIn() {
  if (!centralLoginEnabled()) return null;
  const result = takeCallback();
  switch (result.outcome) {
    case "none":
      return null;
    case "code":
      try {
        const session = await cloudApi.exchangeCode(result.code, redirectUri(), result.verifier);
        storeToken(session.access_token);
        storeRefreshToken(session.refresh_token);
        clearSilentAttempt();
      } catch (error) {
        cloudState.error = error.message;
      }
      return result.returnTo;
    case "signed_out":
      return result.returnTo;
    case "error":
      cloudState.error = result.message;
      return result.returnTo;
  }
}
export async function initCloud(sessionCheck) {
  await sessionCheck;
  const returnTo = await completeCentralSignIn();
  const token = storedToken();
  if (token) {
    try {
      const me = await cloudApi.me();
      const currentToken = storedToken();
      if (currentToken === token) await adoptSession(currentToken, me.account);
      else if (currentToken) await reconcileStoredSession();
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) await sessionRefused();
      else if (isTransient(error)) scheduleReconcileRetry();
    }
  }
  cloudState.ready = true;
  return returnTo;
}
export async function signIn(email, password) {
  try {
    const { token, account } = await cloudApi.signIn(email, password);
    await adoptSession(token, account, true);
    return null;
  } catch (error) {
    const mfa = error instanceof CloudError && error.status === 403 && error.body.mfa_required === true && typeof error.body.mfa_token === "string" ? error.body.mfa_token : null;
    if (mfa) return mfa;
    throw error;
  }
}
export async function signInWithCode(mfaToken, code) {
  const { token, account } = await cloudApi.signInCode(mfaToken, code.replace(/\s+/g, ""));
  await adoptSession(token, account, true);
}
export async function signUp(email, password, name, declaredAge) {
  const { token, account } = await cloudApi.signUp(email, password, name, declaredAge);
  await adoptSession(token, account, true);
}
export async function signOut() {
  if (centralLoginEnabled()) {
    await dropSession(true);
    forgetBrowserKey();
    setActiveCloudPrinter(null);
    if (isPrinterSecureOrigin()) {
      holdSilentSignIn();
      return false;
    }
    signOutCentral();
    return true;
  }
  try {
    await cloudApi.signOut();
  } catch {
  }
  await dropSession(true);
  forgetBrowserKey();
  setActiveCloudPrinter(null);
  return false;
}
export async function saveLayout(layout) {
  layoutEdits++;
  cloudState.layout = layout;
  const owner = cloudState.account?.id;
  try {
    await cloudApi.putLayout(layout, () => owner !== void 0 && cloudState.account?.id === owner);
  } catch (error) {
    if (cloudState.account?.id === owner) cloudState.error = error.message;
  }
}
const BLUETOOTH_ONLY_STORAGE = "muon.ble.printer-names";
export const bluetoothOnly = Vue.observable({ names: loadBluetoothOnly() });
function loadBluetoothOnly() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BLUETOOTH_ONLY_STORAGE) ?? "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === "string"));
  } catch {
    return {};
  }
}
export function rememberBluetoothOnly(id, name) {
  Vue.set(bluetoothOnly.names, id, name);
  try {
    localStorage.setItem(BLUETOOTH_ONLY_STORAGE, JSON.stringify(bluetoothOnly.names));
  } catch {
  }
}
export function reachablePrinters() {
  const extra = Object.entries(bluetoothOnly.names).filter(([id]) => !cloudState.printers.some((p) => p.id === id)).map(([id, name]) => ({ id, name }));
  return [...cloudState.printers, ...extra];
}
export function printerName(id) {
  return reachablePrinters().find((p) => p.id === id)?.name ?? id.slice(0, 8);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhlIE11b24zRCBhY2NvdW50LCBpdHMgbGlua2VkIHByaW50ZXJzLCBhbmQgdGhlaXIgbGl2ZSBzdGF0dXMuXG4gKlxuICogS2VwdCBvdXRzaWRlIFZ1ZXggb24gcHVycG9zZTogRmx1aWRkIHJlc2V0cyBpdHMgd2hvbGUgc3RvcmUgZXZlcnkgdGltZSBpdFxuICogc3dpdGNoZXMgcHJpbnRlciwgYW5kIHRoZSBhY2NvdW50IG11c3Qgc3Vydml2ZSB0aGUgc3dpdGNoLlxuICovXG5pbXBvcnQgeyB2aXNpYmxlSW50ZXJ2YWwgfSBmcm9tICdAL3V0aWwvdmlzaWJsZS1pbnRlcnZhbCdcbmltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IHtcbiAgY2xvdWRBcGksXG4gIENsb3VkRXJyb3IsXG4gIHNldFNlc3Npb25Ib29rcyxcbiAgc3RvcmVkVG9rZW4sXG4gIHN0b3JlUmVmcmVzaFRva2VuLFxuICBjdXJyZW50U2Vzc2lvbklkLFxuICBmb3JnZXRTZXNzaW9uSWQsXG4gIHN0b3JlVG9rZW4sXG4gIFRPS0VOX0tFWSxcbiAgdHlwZSBDbG91ZEFjY291bnQsXG4gIHR5cGUgQ2xvdWRDb25maWcsXG4gIHR5cGUgQ2xvdWRQcmludGVyLFxuICB0eXBlIEFjY2Vzc0hhbmRvZmZcbn0gZnJvbSAnLi9hcGknXG5pbXBvcnQgeyB3YXRjaEZvY3VzIH0gZnJvbSAnLi9mb2N1cy1jaGVjaydcbmltcG9ydCB7IGNlbnRyYWxMb2dpbkVuYWJsZWQsIGNsZWFyU2lsZW50QXR0ZW1wdCwgaG9sZFNpbGVudFNpZ25JbiwgcmVkaXJlY3RVcmksIHNpZ25JbkFnYWluT25QcmludGVyT3JpZ2luLCBzaWduT3V0Q2VudHJhbCwgdGFrZUNhbGxiYWNrIH0gZnJvbSAnLi9jZW50cmFsTG9naW4nXG5pbXBvcnQgeyBjbG91ZFVucmVhY2hhYmxlIH0gZnJvbSAnLi9vdXRhZ2UnXG5pbXBvcnQgeyBicm93c2VyRW5kcG9pbnQsIGZvcmdldEJyb3dzZXJLZXksIG1hbmFnZWRFbmRwb2ludEZhY3RvcnkgfSBmcm9tICcuL2lyb2gnXG5pbXBvcnQgeyBjcmVhdGVQcmludGVyVHJhbnNwb3J0Rm9yU2VsZWN0aW9uLCB0eXBlIEF1dGhvcml6ZWRNYW5hZ2VkUmVsYXlTZXNzaW9uLCB0eXBlIFByaW50ZXJUcmFuc3BvcnQsIHR5cGUgUHJpbnRlclNvY2tldCB9IGZyb20gJ0Avc2VydmljZXMvbWFuYWdlZC10cmFuc3BvcnQnXG5pbXBvcnQgeyBjb25zb2xlUHJlc2VuY2UgfSBmcm9tICcuL3ByZXNlbmNlJ1xuaW1wb3J0IHsgcmVsYXlVcmxGb3JCbHVldG9vdGggfSBmcm9tICcuL3JlbGF5J1xuaW1wb3J0IHsgYW5ub3VuY2VBY2NvdW50LCBjb25maXJtZWRBY2NvdW50SWQsIGNvbmZpcm1Ub2tlbiwgY3VycmVudEFjY291bnQsIGlkZW50aXR5T2YsIFNJR05FRF9PVVQgfSBmcm9tICcuL2FjY291bnQtZXZlbnRzJ1xuaW1wb3J0IHsgU1RBVFVTX1FVRVJZLCBzdGF0dXNGcm9tLCB0eXBlIFByaW50ZXJTdGF0dXMgfSBmcm9tICcuL3N0YXR1cydcbmltcG9ydCB7IGRlbGV0aW9uU3RhdGUgfSBmcm9tICcuL2RlbGV0aW9uJ1xuaW1wb3J0IHsgZm9yZ2V0T3duQXZhdGFyIH0gZnJvbSAnQC9zZXJ2aWNlcy9hY2NvdW50L2F2YXRhcidcbmltcG9ydCB7IGJsdWV0b290aENhcnJ5aW5nLCB3YW50c0JsdWV0b290aEZvciB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IGlzUHJpbnRlclNlY3VyZU9yaWdpbiB9IGZyb20gJ0Avc2VydmljZXMvc2VjdXJlLW9yaWdpbidcbmltcG9ydCB7IGZvcmdldFNlY3VyZVJlYWNoIH0gZnJvbSAnQC9zZXJ2aWNlcy9zZWN1cmUtb3JpZ2luL2hvc3RlZCdcbmltcG9ydCB7IG1heURpYWxCbHVldG9vdGgsIG5vdGVCbHVldG9vdGhGYWlsdXJlLCBub3RlQmx1ZXRvb3RoU3VjY2VzcyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvcmV0cnknXG5pbXBvcnQgeyByZXF1ZXN0UmVmdXNlZCB9IGZyb20gJ0Avc2VydmljZXMvbWFuYWdlZC10cmFuc3BvcnQvcmVmdXNhbCdcbmltcG9ydCB7IG9uRW5kcG9pbnRSZWJvdW5kIH0gZnJvbSAnLi9lbmRwb2ludC1ob29rcydcbmltcG9ydCB7IEVOREVEX0tFWSwgcmVjb25uZWN0SWZUb2tlbkNoYW5nZWQsIHNlc3Npb25TdHJlYW1BdmFpbGFibGUsIHN0YXJ0U2Vzc2lvblN0cmVhbSwgc3RvcFNlc3Npb25TdHJlYW0gfSBmcm9tICcuL3Nlc3Npb24tZXZlbnRzJ1xuaW1wb3J0IHsgZm9yZ2V0U2lnbmVkT3V0LCBub3RlU2lnbmVkT3V0LCBzY29wZU9mUmVhc29uIH0gZnJvbSAnQC9zZXJ2aWNlcy9hY2NvdW50L3NpZ25lZC1vdXQtbm90ZSdcblxuY29uc3QgQUNUSVZFX0tFWSA9ICdtdW9uLmNsb3VkLmFjdGl2ZSdcblxuLyoqIEEgcHJpbnRlcidzIGxpdmUgc3RhdGUsIHJlYWQgb3ZlciBpdHMgb3duIElyb2ggY29ubmVjdGlvbiAodGhlIHJlYWRpbmcgaXMgc2hhcmVkIHdpdGggdGhlIG5ldHdvcmsnczogc3RhdHVzLnRzKS4gKi9cbmV4cG9ydCB0eXBlIHsgUHJpbnRlclN0YXR1cyB9IGZyb20gJy4vc3RhdHVzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEZsZWV0TGF5b3V0IHtcbiAgZ3JvdXBzOiBBcnJheTx7IGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcHJpbnRlcnM6IHN0cmluZ1tdIH0+O1xuICB3aWRnZXRzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgZGVuc2l0eTogJ2NvbWZvcnRhYmxlJyB8ICdjb21wYWN0Jztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfRkxFRVRfTEFZT1VUOiBGbGVldExheW91dCA9IHtcbiAgZ3JvdXBzOiBbXSxcbiAgd2lkZ2V0czoge1xuICAgIG1vZGVsOiB0cnVlLFxuICAgIHByb2dyZXNzOiB0cnVlLFxuICAgIHRlbXBzOiB0cnVlLFxuICAgIGV0YTogdHJ1ZSxcbiAgICBmaWxlOiB0cnVlLFxuICAgIHBvc2l0aW9uOiB0cnVlLFxuICAgIGxheWVyOiB0cnVlLFxuICAgIGZhY3RvcnM6IGZhbHNlXG4gIH0sXG4gIGRlbnNpdHk6ICdjb21mb3J0YWJsZSdcbn1cblxuaW50ZXJmYWNlIENsb3VkU3RhdGUge1xuICByZWFkeTogYm9vbGVhbjtcbiAgYWNjb3VudDogQ2xvdWRBY2NvdW50IHwgbnVsbDtcbiAgY29uZmlnOiBDbG91ZENvbmZpZyB8IG51bGw7XG4gIHByaW50ZXJzOiBDbG91ZFByaW50ZXJbXTtcbiAgLyoqIFdoZW4gdGhlIHJlcXVlc3QgYmVoaW5kIGBwcmludGVyc2Agd2FzIHNlbnQgKG1zKTsgMCBiZWZvcmUgdGhlIGZpcnN0IGFuc3dlci4gKi9cbiAgcHJpbnRlcnNBc09mOiBudW1iZXI7XG4gIHN0YXR1czogUmVjb3JkPHN0cmluZywgUHJpbnRlclN0YXR1cz47XG4gIGFjdGl2ZVByaW50ZXJJZDogc3RyaW5nIHwgbnVsbDtcbiAgbGF5b3V0OiBGbGVldExheW91dDtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIGVuZHBvaW50SWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBjbG91ZFN0YXRlID0gVnVlLm9ic2VydmFibGU8Q2xvdWRTdGF0ZT4oe1xuICByZWFkeTogZmFsc2UsXG4gIGFjY291bnQ6IG51bGwsXG4gIGNvbmZpZzogbnVsbCxcbiAgcHJpbnRlcnM6IFtdLFxuICBwcmludGVyc0FzT2Y6IDAsXG4gIHN0YXR1czoge30sXG4gIGFjdGl2ZVByaW50ZXJJZDogcmVhZEFjdGl2ZSgpLFxuICBsYXlvdXQ6IHsgLi4uREVGQVVMVF9GTEVFVF9MQVlPVVQgfSxcbiAgZXJyb3I6IG51bGwsXG4gIGVuZHBvaW50SWQ6IG51bGxcbn0pXG5cbmZ1bmN0aW9uIHJlYWRBY3RpdmUgKCk6IHN0cmluZyB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShBQ1RJVkVfS0VZKVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRBY3RpdmVDbG91ZFByaW50ZXIgKGlkOiBzdHJpbmcgfCBudWxsKSB7XG4gIGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkID0gaWRcbiAgdHJ5IHtcbiAgICBpZiAoaWQpIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEFDVElWRV9LRVksIGlkKVxuICAgIGVsc2UgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oQUNUSVZFX0tFWSlcbiAgfSBjYXRjaCB7IC8qIG5vIHN0b3JhZ2UgKi8gfVxufVxuXG4vKiogVGhlIGZsZWV0IG93bnMgb25lIHRyYW5zcG9ydCBwZXIgcHJpbnRlcjsgdGhlIGRhc2hib2FyZCBib3Jyb3dzIGl0LiAqL1xuY29uc3Qgc3RhdHVzQ29ubmVjdGlvbnMgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxQcmludGVyVHJhbnNwb3J0Pj4oKVxuY29uc3QgZ3JhbnRzID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8QWNjZXNzSGFuZG9mZj4+KClcbmNvbnN0IHBvbGxpbmcgPSBuZXcgU2V0PHN0cmluZz4oKVxubGV0IHNlc3Npb25BYm9ydCA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKVxubGV0IGVuZHBvaW50UmVnaXN0cmF0aW9uOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcbmxldCBzdG9wUG9sbFRpbWVyOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxubGV0IHN0b3BQcmludGVyc1RpbWVyOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVFbmRwb2ludCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghZW5kcG9pbnRSZWdpc3RyYXRpb24pIHtcbiAgICBjb25zdCBzaWduYWwgPSBzZXNzaW9uQWJvcnQuc2lnbmFsXG4gICAgY29uc3QgcGVuZGluZyA9IChhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoIWNsb3VkU3RhdGUuY29uZmlnKSBjbG91ZFN0YXRlLmNvbmZpZyA9IGF3YWl0IGNsb3VkQXBpLmNvbmZpZygpXG4gICAgICBzaWduYWwudGhyb3dJZkFib3J0ZWQoKVxuICAgICAgY29uc3QgZW5kcG9pbnQgPSBhd2FpdCBicm93c2VyRW5kcG9pbnQoY2xvdWRTdGF0ZS5jb25maWcucmVsYXlfdXJsKVxuICAgICAgc2lnbmFsLnRocm93SWZBYm9ydGVkKClcbiAgICAgIGNvbnN0IGlkID0gZW5kcG9pbnQuZW5kcG9pbnRJZCgpXG4gICAgICBpZiAoY2xvdWRTdGF0ZS5lbmRwb2ludElkICE9PSBpZCkge1xuICAgICAgICBhd2FpdCBjbG91ZEFwaS5yZWdpc3RlckVuZHBvaW50KGlkKVxuICAgICAgICBzaWduYWwudGhyb3dJZkFib3J0ZWQoKVxuICAgICAgICBjbG91ZFN0YXRlLmVuZHBvaW50SWQgPSBpZFxuICAgICAgfVxuICAgIH0pKClcbiAgICBlbmRwb2ludFJlZ2lzdHJhdGlvbiA9IHBlbmRpbmdcbiAgICBwZW5kaW5nLmZpbmFsbHkoKCkgPT4geyBpZiAoZW5kcG9pbnRSZWdpc3RyYXRpb24gPT09IHBlbmRpbmcpIGVuZHBvaW50UmVnaXN0cmF0aW9uID0gbnVsbCB9KS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuICByZXR1cm4gZW5kcG9pbnRSZWdpc3RyYXRpb25cbn1cblxuZnVuY3Rpb24gd2FpdEZvclJldHJ5IChtczogbnVtYmVyLCBzaWduYWw6IEFib3J0U2lnbmFsKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgc2lnbmFsLnRocm93SWZBYm9ydGVkKClcbiAgICBjb25zdCBhYm9ydCA9ICgpID0+IHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgcmVqZWN0KHNpZ25hbC5yZWFzb24pIH1cbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4geyBzaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydCk7IHJlc29sdmUoKSB9LCBtcylcbiAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydCwgeyBvbmNlOiB0cnVlIH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGRlbGV0aW9uUmVmdXNhbCAoKTogQ2xvdWRFcnJvciB8IG51bGwge1xuICBpZiAoZGVsZXRpb25TdGF0ZS5kZWxldGVBZnRlciA9PT0gbnVsbCkgcmV0dXJuIG51bGxcbiAgcmV0dXJuIG5ldyBDbG91ZEVycm9yKCdZb3VyIGFjY291bnQgaXMgd2FpdGluZyB0byBiZSBkZWxldGVkLicsIDQwMywgdW5kZWZpbmVkLCB7XG4gICAgZGVsZXRpb25fcGVuZGluZzogdHJ1ZSwgZGVsZXRlX2FmdGVyOiBkZWxldGlvblN0YXRlLmRlbGV0ZUFmdGVyXG4gIH0pXG59XG5cbi8qKiBBc2tzIHRoZSBjb25zb2xlIGZvciBhIGdyYW50LCByZXRyeWluZyBvbmx5IHRlbXBvcmFyeSAoNTAzKSBmYWlsdXJlcyB1bnRpbCBgc2lnbmFsYCBhYm9ydHMuICovXG5hc3luYyBmdW5jdGlvbiBhc2tDb25zb2xlIChwcmludGVySWQ6IHN0cmluZywgc2lnbmFsOiBBYm9ydFNpZ25hbCk6IFByb21pc2U8QWNjZXNzSGFuZG9mZj4ge1xuICBhd2FpdCBlbnN1cmVFbmRwb2ludCgpXG4gIGxldCBkZWxheSA9IDEwMDBcbiAgZm9yICg7Oykge1xuICAgIHNpZ25hbC50aHJvd0lmQWJvcnRlZCgpXG4gICAgY29uc3QgcHJpbnRlciA9IGNsb3VkU3RhdGUucHJpbnRlcnMuZmluZChwID0+IHAuaWQgPT09IHByaW50ZXJJZClcbiAgICBpZiAocHJpbnRlciAmJiBjb25zb2xlUHJlc2VuY2UocHJpbnRlcikgPT09ICdvZmZsaW5lJykgdGhyb3cgbmV3IENsb3VkRXJyb3IoJ1ByaW50ZXIgaXMgb2ZmbGluZScsIDUwMylcbiAgICB0cnkge1xuICAgICAgY29uc3QgZ3JhbnQgPSBhd2FpdCBjbG91ZEFwaS5hY2Nlc3MocHJpbnRlcklkKVxuICAgICAgc2lnbmFsLnRocm93SWZBYm9ydGVkKClcbiAgICAgIHJldHVybiBncmFudFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaWduYWwudGhyb3dJZkFib3J0ZWQoKVxuICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yKSB8fCBlcnJvci5zdGF0dXMgIT09IDUwMykgdGhyb3cgZXJyb3JcbiAgICAgIGF3YWl0IHdhaXRGb3JSZXRyeShkZWxheSwgc2lnbmFsKVxuICAgICAgZGVsYXkgPSBNYXRoLm1pbigxNV8wMDAsIGRlbGF5ICogMilcbiAgICB9XG4gIH1cbn1cblxuLyoqIE9uZSBwZW5kaW5nIGdyYW50IHBlciBwcmludGVyLCByZXRyeWluZyBvbmx5IHRlbXBvcmFyeSBjb25zb2xlIGZhaWx1cmVzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcXVlc3RBY2Nlc3MgKHByaW50ZXJJZDogc3RyaW5nKTogUHJvbWlzZTxBY2Nlc3NIYW5kb2ZmPiB7XG4gIGNvbnN0IHJlZnVzZWQgPSBkZWxldGlvblJlZnVzYWwoKVxuICBpZiAocmVmdXNlZCkgcmV0dXJuIFByb21pc2UucmVqZWN0KHJlZnVzZWQpXG4gIGNvbnN0IGV4aXN0aW5nID0gZ3JhbnRzLmdldChwcmludGVySWQpXG4gIGlmIChleGlzdGluZykgcmV0dXJuIGV4aXN0aW5nXG4gIGNvbnN0IHBlbmRpbmcgPSBhc2tDb25zb2xlKHByaW50ZXJJZCwgc2Vzc2lvbkFib3J0LnNpZ25hbClcbiAgZ3JhbnRzLnNldChwcmludGVySWQsIHBlbmRpbmcpXG4gIHBlbmRpbmcuZmluYWxseSgoKSA9PiB7IGlmIChncmFudHMuZ2V0KHByaW50ZXJJZCkgPT09IHBlbmRpbmcpIGdyYW50cy5kZWxldGUocHJpbnRlcklkKSB9KS5jYXRjaCgoKSA9PiB7fSlcbiAgcmV0dXJuIHBlbmRpbmdcbn1cblxuLyoqXG4gKiBIb3cgbG9uZyBhIEJsdWV0b290aCBvcGVuIHdhaXRzIGZvciB0aGUgY29uc29sZSdzIGdyYW50IGJlZm9yZSBnb2luZyBvblxuICogd2l0aG91dCBpdCAoS0FOLTEyNTMpLCB3aGVuIHRoZSBjb25zb2xlIGRvZXMgbm90IGNhbGwgdGhlIHByaW50ZXIgb25saW5lLlxuICovXG5leHBvcnQgY29uc3QgQkxVRVRPT1RIX0dSQU5UX0dSQUNFX01TID0gNF8wMDBcblxuLyoqXG4gKiBUaGUgc2FtZSB3YWl0IGZvciBhIHByaW50ZXIgdGhlIGNvbnNvbGUgY2FsbHMgb25saW5lLiBJdHMga2V5IG1heSByZWx5IG9uXG4gKiBhIGdyYW50IHRoZSBjb25zb2xlIHB1c2hlcywgc28gdGhlIGdyYW50IGlzIHdvcnRoIHdhaXRpbmcgZm9yLiBCb3VuZGVkIGJlbG93XG4gKiBgUkVNT1RFX09QRU5fVElNRU9VVF9NU2AgKGFjdGl2YXRlLnRzKSwgc28gdGhlIHJhZGlvIHN0aWxsIGhhcyB0aW1lLlxuICovXG5leHBvcnQgY29uc3QgQkxVRVRPT1RIX09OTElORV9HUkFOVF9XQUlUX01TID0gMjBfMDAwXG5cbi8qKlxuICogVGhlIGhhbmRvZmYgZm9yIGEgcHJpbnRlciB0aGUgcGVyc29uIGNob3NlIHRvIG9wZW4gb3ZlciBCbHVldG9vdGguIFRoZVxuICogY29uc29sZSdzIGdyYW50IGlzIGFza2VkIGZvciBhcyBldmVyIGFuZCB1c2VkIGlmIGl0IGNvbWVzLCBiZWNhdXNlIGFuXG4gKiBvbmxpbmUgcHJpbnRlciBvbmx5IGFkbWl0cyB0aGlzIGtleSBvbmNlIHRoZSBjb25zb2xlIGhhcyBwdXNoZWQgYSBncmFudCB0b1xuICogaXQuIEJ1dCB0aGUgcmFkaW8gbXVzdCBub3Qgd2FpdCBvbiB0aGUgY29uc29sZTogYSBwcmludGVyIHRoZSBjb25zb2xlXG4gKiBjYWxscyBvZmZsaW5lICg1MDMgYGRldmljZV91bnJlYWNoYWJsZWApIG1heSBiZSBzaXR0aW5nIGJlc2lkZSB0aGUgbGFwdG9wLFxuICogYW5kIGEga2V5IGl0IGFscmVhZHkgaG9sZHMgKHBhaXJlZCwgb3IgZW5yb2xsZWQgYXQgc2V0dXApIG5lZWRzIG5vIGdyYW50LlxuICogU28gYW55IGNvbnNvbGUgZmFpbHVyZSBlbmRzIHRoZSB3YWl0ICg1MDMsIDQwMSwgNDAzLCA0MDQsIDUwMCwgYSB0aW1lb3V0LCBub1xuICogbmV0d29yaywgYSBmYWlsZWQgZW5kcG9pbnQgcmVnaXN0cmF0aW9uKSwgYW5kIHRoZSBzZXNzaW9uIGlzIGxvY2FsIGFuZFxuICogZ3JhbnRsZXNzIChgZ3JhbnRsZXNzOiB0cnVlYCkuIFRoZSBvbmUgZXhjZXB0aW9uIGlzIGNoZWNrZWQgZmlyc3Q6IGFuXG4gKiBhY2NvdW50IHdob3NlIGRlbGV0aW9uIGlzIHBlbmRpbmcgKGBkZWxldGlvblJlZnVzYWwoKWApIGlzIHRoZSBjb25zb2xlJ3NcbiAqIGFuc3dlciBhYm91dCB0aGlzIGFjY291bnQgYW5kIGlzIHJhaXNlZCAoS0FOLTEzOTYpLlxuICpcbiAqIFRoZSBhc2sgaGFzIGl0cyBvd24gYWJvcnQsIGZpcmVkIHdoZW5ldmVyIHRoZSB3YWl0IGVuZHMsIHNvIGEgNTAzIHJldHJ5XG4gKiBsb29wIG5ldmVyIG91dGxpdmVzIHRoZSBoYW5kb2ZmIGFuZCBubyBlbnRyeSBpcyBsZWZ0IGluIGBncmFudHNgLlxuICovXG5hc3luYyBmdW5jdGlvbiBibHVldG9vdGhIYW5kb2ZmIChwcmludGVySWQ6IHN0cmluZywgc2lnbmFsOiBBYm9ydFNpZ25hbCk6IFByb21pc2U8QXV0aG9yaXplZE1hbmFnZWRSZWxheVNlc3Npb24+IHtcbiAgY29uc3QgcmVmdXNlZCA9IGRlbGV0aW9uUmVmdXNhbCgpXG4gIGlmIChyZWZ1c2VkKSB0aHJvdyByZWZ1c2VkXG4gIC8vIEFib3J0ZWQgYnkgdGhlIHNlc3Npb24gZW5kaW5nIG9yIGJ5IHRoaXMgd2FpdCBlbmRpbmcgKG5vIEFib3J0U2lnbmFsLmFueTogb2xkZXIgYnJvd3NlcnMpLlxuICBjb25zdCBvd24gPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgY29uc3Qgc2Vzc2lvbiA9IHNlc3Npb25BYm9ydC5zaWduYWxcbiAgY29uc3QgZW5kV2l0aFNlc3Npb24gPSAoKSA9PiBvd24uYWJvcnQoKVxuICBzZXNzaW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgZW5kV2l0aFNlc3Npb24sIHsgb25jZTogdHJ1ZSB9KVxuICBsZXQgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgdW5kZWZpbmVkXG4gIGxldCBncmFudDogQWNjZXNzSGFuZG9mZiB8IG51bGxcbiAgdHJ5IHtcbiAgICAvLyBJLTEzMzogdGhlIHBlcnNvbiBjaG9zZSBCbHVldG9vdGgsIHNvIHRoZSByYWRpbyBpcyB0aGUgcm91dGUuIFRoZSBjb25zb2xlXG4gICAgLy8gaXMgYXNrZWQsIGJ1dCBuZXZlciB3YWl0ZWQgb24gZm9yIG1vcmUgdGhhbiB0aGUgc2hvcnQgZ3JhY2UuXG4gICAgY29uc3Qgd2FpdCA9IEJMVUVUT09USF9HUkFOVF9HUkFDRV9NU1xuICAgIC8vIFdoYXRldmVyIGdvZXMgd3JvbmcgYXNraW5nIChhbnkgQ2xvdWRFcnJvciBzdGF0dXMsIGVuc3VyZUVuZHBvaW50LCBhblxuICAgIC8vIGFib3J0KSBtZWFucyBubyBncmFudCwgbmV2ZXIgYSBmYWlsZWQgY29ubmVjdC5cbiAgICAvLyBObyBjbG91ZCBjYWxsIGF0IGFsbCB3aGVuIHRoZSBzZXJ2aWNlIGlzIG91dCBvZiByZWFjaCAoYnJvd3NlciBvZmZsaW5lLCBvciBpdHMgbGFzdCByZXF1ZXN0IGdvdCBubyBhbnN3ZXIpLFxuICAgIC8vIGFuZCBub25lIGZvciBhIHByaW50ZXIgb2ZmIHRoaXMgYWNjb3VudDogbm90aGluZyBob2xkcyBhIGdyYW50IGZvciBpdCwgc28gdGhlcmUgaXMgbm90aGluZyB0byB3YWl0IGZvci5cbiAgICAvLyBPZmYgdGhlIGFjY291bnQgb25seSBvbmNlIHRoZSBsaXN0IGhhcyBsb2FkZWQgKGFuIG93bmVyJ3MgcHJpbnRlciBtdXN0IG5vdCBiZSB0YWtlbiBmb3IgYSBzdHJhbmdlcidzIHdoaWxlIGl0XG4gICAgLy8gbG9hZHMgb3IgZmFpbGVkIHRvKTsgb2ZmbGluZSB0aGUgbGlzdCBuZXZlciBsb2FkcywgYW5kIHRoZSBwcmludGVyIGFkbWl0cyBhbiBvd25lciBieSBrZXkuXG4gICAgY29uc3Qgb2ZmQWNjb3VudCA9IGNsb3VkU3RhdGUucmVhZHkgJiYgIWNsb3VkU3RhdGUucHJpbnRlcnMuc29tZShwID0+IHAuaWQgPT09IHByaW50ZXJJZClcbiAgICBjb25zdCBvZmZsaW5lID0gY2xvdWRVbnJlYWNoYWJsZSgpIHx8IG9mZkFjY291bnRcbiAgICBjb25zdCBhc2tlZCA9IG9mZmxpbmUgPyBQcm9taXNlLnJlc29sdmU8bnVsbD4obnVsbCkgOiBhc2tDb25zb2xlKHByaW50ZXJJZCwgb3duLnNpZ25hbCkuY2F0Y2goKCk6IG51bGwgPT4gbnVsbClcbiAgICBncmFudCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICBhc2tlZCxcbiAgICAgIG5ldyBQcm9taXNlPG51bGw+KHJlc29sdmUgPT4geyB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShudWxsKSwgb2ZmbGluZSA/IDAgOiB3YWl0KSB9KVxuICAgIF0pXG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgIHNlc3Npb24ucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBlbmRXaXRoU2Vzc2lvbilcbiAgICBvd24uYWJvcnQoKVxuICB9XG4gIHNpZ25hbC50aHJvd0lmQWJvcnRlZCgpXG4gIC8vIFRoZSBhc2sgaXRzZWxmIG1heSBoYXZlIGJlZW4gdGhlIGZpcnN0IHRvIGxlYXJuIHRoZSBhY2NvdW50IGlzIHdhaXRpbmcgdG9cbiAgLy8gYmUgZGVsZXRlZCAoYSA0MDMgZGVsZXRpb25fcGVuZGluZyBzZXRzIGRlbGV0aW9uU3RhdGUpLiBUaGF0IHJlZnVzYWwgc3RhbmRzLlxuICBjb25zdCByZWZ1c2VkTm93ID0gZGVsZXRpb25SZWZ1c2FsKClcbiAgaWYgKHJlZnVzZWROb3cpIHRocm93IHJlZnVzZWROb3dcbiAgaWYgKGdyYW50KSByZXR1cm4gc2Vzc2lvbkZyb20oZ3JhbnQpXG4gIC8vIFRoZSByYWRpbyBuZXZlciB3YWl0cyBvbiB0aGUgY29uc29sZSBmb3IgdGhlIHJlbGF5OiBjbG91ZCB2YWx1ZSwgZWxzZSBjYWNoZWQsIGVsc2UgYnVpbHQgaW4uXG4gIGNvbnN0IHJlbGF5VXJsID0gcmVsYXlVcmxGb3JCbHVldG9vdGgoY2xvdWRTdGF0ZS5jb25maWc/LnJlbGF5X3VybClcbiAgc2lnbmFsLnRocm93SWZBYm9ydGVkKClcbiAgcmV0dXJuIHtcbiAgICBjb250cmFjdFZlcnNpb246ICdtYW5hZ2VkLWlyb2gvdjEnLFxuICAgIHNlc3Npb25JZDogYGJsdWV0b290aC0ke3ByaW50ZXJJZH1gLFxuICAgIHRlbmFudElkOiBjbG91ZFN0YXRlLmFjY291bnQ/LmlkID8/ICdsb2NhbCcsXG4gICAgcHJpbnRlcklkLFxuICAgIHJlbGF5VXJsLFxuICAgIGV4cGlyZXNBdDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDM2MDBfMDAwKS50b0lTT1N0cmluZygpLFxuICAgIGdyYW50bGVzczogdHJ1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIHNlc3Npb25Gcm9tIChncmFudDogQWNjZXNzSGFuZG9mZik6IEF1dGhvcml6ZWRNYW5hZ2VkUmVsYXlTZXNzaW9uIHtcbiAgcmV0dXJuIHtcbiAgICBjb250cmFjdFZlcnNpb246ICdtYW5hZ2VkLWlyb2gvdjEnLFxuICAgIHNlc3Npb25JZDogZ3JhbnQuZ3JhbnRfaWQsXG4gICAgdGVuYW50SWQ6IGNsb3VkU3RhdGUuYWNjb3VudD8uaWQgPz8gJycsXG4gICAgcHJpbnRlcklkOiBncmFudC5wcmludGVyX2lkLFxuICAgIHJlbGF5VXJsOiBncmFudC5yZWxheV91cmwsXG4gICAgZXhwaXJlc0F0OiBuZXcgRGF0ZShncmFudC5leHBpcmVzX2F0ICogMTAwMCkudG9JU09TdHJpbmcoKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRvZmYgKHByaW50ZXJJZDogc3RyaW5nLCBzaWduYWw6IEFib3J0U2lnbmFsKTogUHJvbWlzZTxBdXRob3JpemVkTWFuYWdlZFJlbGF5U2Vzc2lvbj4ge1xuICBzaWduYWwudGhyb3dJZkFib3J0ZWQoKVxuICBpZiAod2FudHNCbHVldG9vdGhGb3IocHJpbnRlcklkKSkgcmV0dXJuIGJsdWV0b290aEhhbmRvZmYocHJpbnRlcklkLCBzaWduYWwpXG4gIGNvbnN0IGdyYW50ID0gYXdhaXQgcmVxdWVzdEFjY2VzcyhwcmludGVySWQpXG4gIHNpZ25hbC50aHJvd0lmQWJvcnRlZCgpXG4gIHJldHVybiBzZXNzaW9uRnJvbShncmFudClcbn1cblxuLyoqXG4gKiBBIGZyZXNoIGdyYW50IGFoZWFkIG9mIGFuIG9yZGluYXJ5IHJlZGlhbCAoS0FOLTM2MzYpLiBTa2lwcGVkIHdoaWxlIHRoZVxuICogY29uc29sZSBkb2VzIG5vdCBzZWUgdGhlIHByaW50ZXIgb25saW5lOiBpdCBjb3VsZCBub3QgZGVsaXZlciBhIGdyYW50LCBhbmRcbiAqIHRoZSB3YWl0IHdvdWxkIG9ubHkgc2xvdyBhIGRpYWwgdGhhdCBtYXkgcmVhY2ggaXQgZGlyZWN0bHkuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hIYW5kb2ZmIChwcmludGVySWQ6IHN0cmluZywgc2lnbmFsOiBBYm9ydFNpZ25hbCk6IFByb21pc2U8QXV0aG9yaXplZE1hbmFnZWRSZWxheVNlc3Npb24+IHtcbiAgY29uc3QgcHJpbnRlciA9IGNsb3VkU3RhdGUucHJpbnRlcnMuZmluZChwID0+IHAuaWQgPT09IHByaW50ZXJJZClcbiAgaWYgKCFwcmludGVyIHx8IGNvbnNvbGVQcmVzZW5jZShwcmludGVyKSAhPT0gJ29ubGluZScpIHRocm93IG5ldyBFcnJvcignVGhlIGNvbnNvbGUgZG9lcyBub3Qgc2VlIHRoaXMgcHJpbnRlciBvbmxpbmUnKVxuICByZXR1cm4gaGFuZG9mZihwcmludGVySWQsIHNpZ25hbClcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3RhdHVzQ29ubmVjdGlvbiAocHJpbnRlcklkOiBzdHJpbmcpOiBQcm9taXNlPFByaW50ZXJUcmFuc3BvcnQ+IHtcbiAgbGV0IGV4aXN0aW5nID0gc3RhdHVzQ29ubmVjdGlvbnMuZ2V0KHByaW50ZXJJZClcbiAgaWYgKCFleGlzdGluZykge1xuICAgIGNvbnN0IHNpZ25hbCA9IHNlc3Npb25BYm9ydC5zaWduYWxcbiAgICBleGlzdGluZyA9IGNyZWF0ZVByaW50ZXJUcmFuc3BvcnRGb3JTZWxlY3Rpb24oXG4gICAgICB7IGtpbmQ6ICdtYW5hZ2VkLWlyb2gnLCBwcmludGVySWQgfSxcbiAgICAgIHsgaGFuZG9mZlNlbGVjdGVkUHJpbnRlcjogaWQgPT4gaGFuZG9mZihpZCwgc2lnbmFsKSwgcmVmcmVzaFNlbGVjdGVkUHJpbnRlcjogaWQgPT4gcmVmcmVzaEhhbmRvZmYoaWQsIHNpZ25hbCksIGNyZWF0ZU1hbmFnZWRFbmRwb2ludDogbWFuYWdlZEVuZHBvaW50RmFjdG9yeSB9XG4gICAgKVxuICAgIHN0YXR1c0Nvbm5lY3Rpb25zLnNldChwcmludGVySWQsIGV4aXN0aW5nKVxuICAgIGNvbnN0IHBlbmRpbmcgPSBleGlzdGluZ1xuICAgIHBlbmRpbmcuY2F0Y2goKCkgPT4geyBpZiAoc3RhdHVzQ29ubmVjdGlvbnMuZ2V0KHByaW50ZXJJZCkgPT09IHBlbmRpbmcpIHN0YXR1c0Nvbm5lY3Rpb25zLmRlbGV0ZShwcmludGVySWQpIH0pXG4gIH1cbiAgcmV0dXJuIGV4aXN0aW5nXG59XG5cbi8qKlxuICogQW4gZXhwbGljaXQgQmx1ZXRvb3RoIGNvbm5lY3QgcmVwbGFjZWQgdGhlIHRhYidzIGVuZHBvaW50IChLQU4tMjUzMSk6IGV2ZXJ5XG4gKiBvdGhlciBwcmludGVyJ3MgdHJhbnNwb3J0IGRpZWQgd2l0aCBpdC4gRHJvcCB0aGVtLCBzbyB0aGUgbmV4dCBwb2xsIGFuZCBvcGVuXG4gKiBkaWFsIGFnYWluIG9uIHRoZSBuZXcgb25lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZHJvcE90aGVyQ2xvdWRDb25uZWN0aW9ucyAoZXhjZXB0OiBzdHJpbmcpIHtcbiAgZm9yIChjb25zdCBpZCBvZiBbLi4uc3RhdHVzQ29ubmVjdGlvbnMua2V5cygpXSkgaWYgKGlkLnRvTG93ZXJDYXNlKCkgIT09IGV4Y2VwdC50b0xvd2VyQ2FzZSgpKSBkcm9wQ2xvdWRDb25uZWN0aW9uKGlkKVxufVxub25FbmRwb2ludFJlYm91bmQoZHJvcE90aGVyQ2xvdWRDb25uZWN0aW9ucylcblxuLyoqXG4gKiBEcm9wcyB0aGUgc2hhcmVkIGNvbm5lY3Rpb24gdG8gYSBwcmludGVyIHRoYXQgc3RvcHBlZCBhbnN3ZXJpbmcgdGhyb3VnaCBpdCxcbiAqIHNvIHRoZSBuZXh0IG9wZW4gYW5kIHRoZSBuZXh0IHN0YXR1cyBwb2xsIGRpYWwgYWdhaW4gaW5zdGVhZCBvZiBib3Jyb3dpbmdcbiAqIHRoZSBzdGFsbGVkIG9uZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRyb3BDbG91ZENvbm5lY3Rpb24gKHByaW50ZXJJZDogc3RyaW5nKSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gc3RhdHVzQ29ubmVjdGlvbnMuZ2V0KHByaW50ZXJJZClcbiAgaWYgKCFleGlzdGluZykgcmV0dXJuXG4gIHN0YXR1c0Nvbm5lY3Rpb25zLmRlbGV0ZShwcmludGVySWQpXG4gIHBvbGxpbmcuZGVsZXRlKHByaW50ZXJJZClcbiAgZXhpc3RpbmcudGhlbihjID0+IGMuY2xvc2UoKSkuY2F0Y2goKCkgPT4ge30pXG59XG5cbi8qKlxuICogSG93IGxvbmcgYSBzdGF0dXMgcmVhZCBtYXkgc3RheSBzaWxlbnQgYmVmb3JlIGl0IGNvdW50cyBhcyBmYWlsZWQgKEktMTMzKS5cbiAqIEEgYmxvY2tlZCByZWxheSBuZXZlciBhbnN3ZXJzLCBzbyB3aXRob3V0IHRoaXMgdGhlIGNhcmQga2VwdCBpdHMgbGFzdFxuICogXCJSZWFkeVwiIGZvciBtaW51dGVzLiBBIHNpbGVudCByZWFkIG1hcmtzIHRoZSBwcmludGVyIE9mZmxpbmUgKGF0IG1vc3QgYWJvdXRcbiAqIDkgcyBhZnRlciB0aGUgcmVsYXkgZ29lcyBxdWlldCksIGFuZCBzbyBkbyB0d28gZmFpbGVkIHJlYWRzIGluIGEgcm93OyB0aGVcbiAqIG5leHQgYW5zd2VyIGZsaXBzIGl0IGJhY2suXG4gKi9cbmV4cG9ydCBjb25zdCBTVEFUVVNfVElNRU9VVF9NUyA9IDYwMDBcbmV4cG9ydCBjb25zdCBPRkZMSU5FX0FGVEVSX0ZBSUxVUkVTID0gMlxuY29uc3QgcG9sbEZhaWx1cmVzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKVxuXG5jbGFzcyBTdGF0dXNTaWxlbmNlIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvciAoKSB7IHN1cGVyKCdObyBhbnN3ZXIgZnJvbSB0aGUgcHJpbnRlcicpIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9sbE9uZSAocHJpbnRlcjogQ2xvdWRQcmludGVyKSB7XG4gIGNvbnN0IHNpZ25hbCA9IHNlc3Npb25BYm9ydC5zaWduYWxcbiAgY29uc3QgdW5hdmFpbGFibGUgPSAoZXJyb3I6IHN0cmluZykgPT4ge1xuICAgIGlmIChzaWduYWwuYWJvcnRlZCkgcmV0dXJuXG4gICAgVnVlLnNldChjbG91ZFN0YXRlLnN0YXR1cywgcHJpbnRlci5pZCwgeyAuLi5jbG91ZFN0YXRlLnN0YXR1c1twcmludGVyLmlkXSwgcmVhY2hhYmxlOiBmYWxzZSwgZXJyb3IsIHVwZGF0ZWRBdDogRGF0ZS5ub3coKSB9KVxuICB9XG4gIC8vIFRoZSBwcmludGVyIGFuc3dlcmVkIGFuZCByZWZ1c2VkIHRoaXMgYnJvd3NlcjogYSByZXN1bHQsIG5vdCBzaWxlbmNlLiBMZWZ0IHVuc2V0IHRoZSBjYXJkIHNhaWQgQ29ubmVjdGluZyBmb3IgZ29vZCAoS0FOLTM1ODUpLlxuICAvLyBBIHN0YXR1cyBhbHJlYWR5IHJlYWQgc3RheXM6IGEgcmVmdXNhbCBuZXZlciBtYXJrcyBhIHdvcmtpbmcgcm91dGUgZG93biAob2ZmbGluZS1kZXRlY3Rpb24uc3BlYy50cykuXG4gIGNvbnN0IHJlZnVzZWQgPSAoKSA9PiB7IGlmICghY2xvdWRTdGF0ZS5zdGF0dXNbcHJpbnRlci5pZF0pIHVuYXZhaWxhYmxlKCdyZWZ1c2VkJykgfVxuICBjb25zdCBvdmVyQmx1ZXRvb3RoID0gd2FudHNCbHVldG9vdGhGb3IocHJpbnRlci5pZClcbiAgY29uc3QgcHJlc2VuY2UgPSBibHVldG9vdGhDYXJyeWluZyhwcmludGVyLmlkKSA/ICdvbmxpbmUnIDogY29uc29sZVByZXNlbmNlKHByaW50ZXIpXG4gIGlmIChwcmVzZW5jZSAhPT0gJ29ubGluZScpIHVuYXZhaWxhYmxlKHByZXNlbmNlKVxuICBpZiAoKHByZXNlbmNlID09PSAnb2ZmbGluZScgJiYgIW92ZXJCbHVldG9vdGgpIHx8IHBvbGxpbmcuaGFzKHByaW50ZXIuaWQpKSByZXR1cm5cbiAgLy8gSS0xMjk6IGEgQmx1ZXRvb3RoIHJvdXRlIHRoYXQga2VlcHMgZmFpbGluZyBiYWNrcyBvZmYsIHRoZW4gc3RvcHMuXG4gIGlmICghb3ZlckJsdWV0b290aCkgbm90ZUJsdWV0b290aFN1Y2Nlc3MocHJpbnRlci5pZClcbiAgZWxzZSBpZiAoIW1heURpYWxCbHVldG9vdGgocHJpbnRlci5pZCkpIHJldHVyblxuICBwb2xsaW5nLmFkZChwcmludGVyLmlkKVxuICB0cnkge1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBzdGF0dXNDb25uZWN0aW9uKHByaW50ZXIuaWQpXG4gICAgbGV0IHNpbGVuY2U6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgdW5kZWZpbmVkXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgY29ubmVjdGlvbi5mZXRjaChTVEFUVVNfUVVFUlkpLFxuICAgICAgbmV3IFByb21pc2U8bmV2ZXI+KChfcmVzb2x2ZSwgcmVqZWN0KSA9PiB7IHNpbGVuY2UgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgU3RhdHVzU2lsZW5jZSgpKSwgU1RBVFVTX1RJTUVPVVRfTVMpIH0pXG4gICAgXSkuZmluYWxseSgoKSA9PiBjbGVhclRpbWVvdXQoc2lsZW5jZSkpXG4gICAgaWYgKHJlcXVlc3RSZWZ1c2VkKHsgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMgfSkpIHJldHVybiByZWZ1c2VkKClcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YClcbiAgICBjb25zdCBzID0gKGF3YWl0IHJlc3BvbnNlLmpzb24oKSkucmVzdWx0LnN0YXR1c1xuICAgIGlmIChzaWduYWwuYWJvcnRlZCkgcmV0dXJuXG4gICAgcG9sbEZhaWx1cmVzLmRlbGV0ZShwcmludGVyLmlkKVxuICAgIGlmIChvdmVyQmx1ZXRvb3RoKSBub3RlQmx1ZXRvb3RoU3VjY2VzcyhwcmludGVyLmlkKVxuICAgIGNvbnN0IGxhdGVzdCA9IGNsb3VkU3RhdGUucHJpbnRlcnMuZmluZChwID0+IHAuaWQgPT09IHByaW50ZXIuaWQpXG4gICAgaWYgKCFsYXRlc3QpIHJldHVyblxuICAgIGNvbnN0IHByZXNlbmNlID0gYmx1ZXRvb3RoQ2FycnlpbmcocHJpbnRlci5pZCkgPyAnb25saW5lJyA6IGNvbnNvbGVQcmVzZW5jZShsYXRlc3QpXG4gICAgVnVlLnNldChjbG91ZFN0YXRlLnN0YXR1cywgcHJpbnRlci5pZCwge1xuICAgICAgcmVhY2hhYmxlOiBwcmVzZW5jZSA9PT0gJ29ubGluZScsXG4gICAgICBlcnJvcjogcHJlc2VuY2UgPT09ICdvbmxpbmUnID8gdW5kZWZpbmVkIDogcHJlc2VuY2UsXG4gICAgICAuLi5zdGF0dXNGcm9tKHMpLFxuICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpXG4gICAgfSBhcyBQcmludGVyU3RhdHVzKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChyZXF1ZXN0UmVmdXNlZChlcnJvcikpIHJldHVybiByZWZ1c2VkKClcbiAgICBpZiAob3ZlckJsdWV0b290aCAmJiAhc2lnbmFsLmFib3J0ZWQpIG5vdGVCbHVldG9vdGhGYWlsdXJlKHByaW50ZXIuaWQsIGVycm9yKVxuICAgIGNvbnN0IGZhaWxlZCA9IChwb2xsRmFpbHVyZXMuZ2V0KHByaW50ZXIuaWQpID8/IDApICsgMVxuICAgIHBvbGxGYWlsdXJlcy5zZXQocHJpbnRlci5pZCwgZmFpbGVkKVxuICAgIGNvbnN0IGxhdGVzdCA9IGNsb3VkU3RhdGUucHJpbnRlcnMuZmluZChwID0+IHAuaWQgPT09IHByaW50ZXIuaWQpXG4gICAgY29uc3Qgb2ZmbGluZSA9IGZhaWxlZCA+PSBPRkZMSU5FX0FGVEVSX0ZBSUxVUkVTIHx8IGVycm9yIGluc3RhbmNlb2YgU3RhdHVzU2lsZW5jZVxuICAgIGlmIChsYXRlc3QpIHVuYXZhaWxhYmxlKGNvbnNvbGVQcmVzZW5jZShsYXRlc3QpID09PSAnb2ZmbGluZScgfHwgb2ZmbGluZSA/ICdvZmZsaW5lJyA6ICdyZWNvbm5lY3RpbmcnKVxuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2lnbmFsLmFib3J0ZWQpIHBvbGxpbmcuZGVsZXRlKHByaW50ZXIuaWQpXG4gIH1cbn1cblxuLyoqIEEgY29ubmVjdGlvbiB0byBhIGNsb3VkIHByaW50ZXIgZm9yIGFueXRoaW5nIGJlc2lkZXMgc3RhdHVzLCBzdWNoIGFzIGZpbGUgcmVhZHMuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvdWRQcmludGVyQ29ubmVjdGlvbiAocHJpbnRlcklkOiBzdHJpbmcpOiBQcm9taXNlPFByaW50ZXJUcmFuc3BvcnQ+IHtcbiAgcmV0dXJuIHN0YXR1c0Nvbm5lY3Rpb24ocHJpbnRlcklkKVxufVxuXG4vKiogVGhlIHNlbGVjdGVkIHBhZ2Ugb3ducyBpdHMgc29ja2V0cywgYnV0IGNhbm5vdCBjbG9zZSB0aGUgc2hhcmVkIHRyYW5zcG9ydC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBib3Jyb3dDbG91ZFByaW50ZXIgKHByaW50ZXJJZDogc3RyaW5nKTogUHJvbWlzZTxQcmludGVyVHJhbnNwb3J0PiB7XG4gIGNvbnN0IHNoYXJlZCA9IGF3YWl0IHN0YXR1c0Nvbm5lY3Rpb24ocHJpbnRlcklkKVxuICBjb25zdCBzb2NrZXRzID0gbmV3IFNldDxQcmludGVyU29ja2V0PigpXG4gIGxldCBjbG9zZWQgPSBmYWxzZVxuICByZXR1cm4ge1xuICAgIGFzeW5jIGZldGNoIChwYXRoLCBpbml0LCBwcm9ncmVzcykge1xuICAgICAgaWYgKGNsb3NlZCkgdGhyb3cgbmV3IEVycm9yKCdQcmludGVyIHBhZ2UgY2xvc2VkJylcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc2hhcmVkLmZldGNoKHBhdGgsIGluaXQsIHByb2dyZXNzKVxuICAgICAgaWYgKGNsb3NlZCkgdGhyb3cgbmV3IEVycm9yKCdQcmludGVyIHBhZ2UgY2xvc2VkJylcbiAgICAgIHJldHVybiByZXNwb25zZVxuICAgIH0sXG4gICAgYXN5bmMgb3BlbldlYlNvY2tldCAocGF0aCkge1xuICAgICAgaWYgKGNsb3NlZCkgdGhyb3cgbmV3IEVycm9yKCdQcmludGVyIHBhZ2UgY2xvc2VkJylcbiAgICAgIGNvbnN0IHNvY2tldCA9IGF3YWl0IHNoYXJlZC5vcGVuV2ViU29ja2V0KHBhdGgpXG4gICAgICBpZiAoY2xvc2VkKSB7IHNvY2tldC5jbG9zZSgpOyB0aHJvdyBuZXcgRXJyb3IoJ1ByaW50ZXIgcGFnZSBjbG9zZWQnKSB9XG4gICAgICBzb2NrZXRzLmFkZChzb2NrZXQpXG4gICAgICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCAoKSA9PiBzb2NrZXRzLmRlbGV0ZShzb2NrZXQpKVxuICAgICAgcmV0dXJuIHNvY2tldFxuICAgIH0sXG4gICAgY2xvc2UgKCkge1xuICAgICAgY2xvc2VkID0gdHJ1ZVxuICAgICAgZm9yIChjb25zdCBzb2NrZXQgb2Ygc29ja2V0cykgc29ja2V0LmNsb3NlKClcbiAgICAgIHNvY2tldHMuY2xlYXIoKVxuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwb2xsQWxsICgpIHtcbiAgaWYgKGRlbGV0aW9uU3RhdGUuZGVsZXRlQWZ0ZXIgIT09IG51bGwpIHtcbiAgICBmb3IgKGNvbnN0IGNvbm5lY3Rpb24gb2Ygc3RhdHVzQ29ubmVjdGlvbnMudmFsdWVzKCkpIGNvbm5lY3Rpb24udGhlbihjID0+IGMuY2xvc2UoKSkuY2F0Y2goKCkgPT4ge30pXG4gICAgc3RhdHVzQ29ubmVjdGlvbnMuY2xlYXIoKVxuICAgIGlmIChPYmplY3Qua2V5cyhjbG91ZFN0YXRlLnN0YXR1cykubGVuZ3RoKSBjbG91ZFN0YXRlLnN0YXR1cyA9IHt9XG4gICAgcmV0dXJuXG4gIH1cbiAgYXdhaXQgUHJvbWlzZS5hbGwoY2xvdWRTdGF0ZS5wcmludGVycy5tYXAocCA9PiBwb2xsT25lKHApKSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hQcmludGVycyAoKSB7XG4gIGlmICghY2xvdWRTdGF0ZS5hY2NvdW50IHx8IGRlbGV0aW9uU3RhdGUuZGVsZXRlQWZ0ZXIgIT09IG51bGwpIHJldHVyblxuICBjb25zdCBvd25lciA9IGNsb3VkU3RhdGUuYWNjb3VudC5pZFxuICBjb25zdCBzaWduYWwgPSBzZXNzaW9uQWJvcnQuc2lnbmFsXG4gIGNvbnN0IGN1cnJlbnQgPSAoKSA9PiAhc2lnbmFsLmFib3J0ZWQgJiYgY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA9PT0gb3duZXJcbiAgdHJ5IHtcbiAgICBjb25zdCBzZW50QXQgPSBEYXRlLm5vdygpXG4gICAgY29uc3QgeyBwcmludGVycyB9ID0gYXdhaXQgY2xvdWRBcGkucHJpbnRlcnMoKVxuICAgIGlmICghY3VycmVudCgpKSByZXR1cm5cbiAgICBjbG91ZFN0YXRlLnByaW50ZXJzID0gcHJpbnRlcnNcbiAgICBjbG91ZFN0YXRlLnByaW50ZXJzQXNPZiA9IHNlbnRBdFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChjdXJyZW50KCkgJiYgZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yICYmIGVycm9yLnN0YXR1cyA9PT0gNDAxKSBhd2FpdCBzZXNzaW9uUmVmdXNlZCgpXG4gIH1cbn1cblxuZnVuY3Rpb24gc3RhcnRQb2xsaW5nICgpIHtcbiAgc3RvcFBvbGxpbmcoKVxuICAvLyBBIHRhYiBub2JvZHkgaXMgbG9va2luZyBhdCBkb2VzIG5vdCBwb2xsICh2aXNpYmxlSW50ZXJ2YWwgY2F0Y2hlcyB1cCBvbiByZXR1cm4pLlxuICBzdG9wUG9sbFRpbWVyID0gdmlzaWJsZUludGVydmFsKCgpID0+IHsgcG9sbEFsbCgpIH0sIDMwMDApXG4gIHN0b3BQcmludGVyc1RpbWVyID0gdmlzaWJsZUludGVydmFsKCgpID0+IHsgcmVmcmVzaFByaW50ZXJzKCkgfSwgMTAwMDApXG4gIHBvbGxBbGwoKVxufVxuXG5mdW5jdGlvbiBzdG9wUG9sbGluZyAoKSB7XG4gIHN0b3BQb2xsVGltZXI/LigpXG4gIHN0b3BQcmludGVyc1RpbWVyPy4oKVxuICBzdG9wUG9sbFRpbWVyID0gc3RvcFByaW50ZXJzVGltZXIgPSBudWxsXG59XG5cbi8qKlxuICogS0FOLTEzODk6IHdoaWxlIHNvbWV0aGluZyBvbiBzY3JlZW4gbXVzdCBvdXRsaXZlIHRoZSBzZXNzaW9uICh0aGUgcmVjb3ZlcnkgY29kZXMsIHdoaWNoIGFyZSB0aGUgb25seSBjb3B5KSxcbiAqIGEgc2Vzc2lvbiB0aGF0IGVuZHMgaXMgcmVtZW1iZXJlZCwgbm90IGFjdGVkIG9uOiB0aGUgYWNjb3VudCBzdGF5cywgc28gdGhlIHBhZ2UgYW5kIGl0cyBkaWFsb2cgc3RheSBtb3VudGVkLlxuICogYHJlbGVhc2VTaWduT3V0YCBsZXRzIGl0IHRocm91Z2guIENvdW50ZWQsIHNvIHR3byBob2xkZXJzIGRvIG5vdCByZWxlYXNlIGVhY2ggb3RoZXIncyBob2xkLlxuICovXG5sZXQgc2lnbk91dEhvbGRzID0gMFxubGV0IGRyb3BEZWZlcnJlZCA9IGZhbHNlXG4vKiogS0FOLTI1MDk6IHdoeSB0aGUgZGVmZXJyZWQgZHJvcCBpcywgd2hlbiBzb21ldGhpbmcgc2FpZCAoYSBwdXNoZWQgYHNlc3Npb25fZW5kZWRgLCBhIHJlZnVzYWwgdGhhdCBjYXJyaWVkIGl0KS4gKi9cbmxldCBkZWZlcnJlZFJlYXNvbjogc3RyaW5nIHwgdW5kZWZpbmVkXG5cbi8qKiBEZWZlcnMgZXZlcnkgc2Vzc2lvbi1lbmRlZCBkcm9wIChhIHJlZnVzZWQgY2FsbCwgYW5vdGhlciB0YWIncyBzaWduLW91dCwgdGhlIGZvY3VzIGNoZWNrKSB1bnRpbCBgcmVsZWFzZVNpZ25PdXRgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhvbGRTaWduT3V0ICgpIHtcbiAgc2lnbk91dEhvbGRzKytcbn1cblxuLyoqXG4gKiBMZXRzIGdvIG9mIG9uZSBob2xkLiBXaGVuIHRoZSBsYXN0IG9uZSBnb2VzLCBhIHNlc3Npb24gdGhhdCBlbmRlZCBtZWFud2hpbGUgaXMgZHJvcHBlZCBub3csIGFzIGFueSByZWZ1c2FsIGlzXG4gKiAodGhlbiwgb24gYSBwcmludGVyJ3Mgb3duIGFkZHJlc3MsIHNpZ25lZCBpbiBhZ2FpbiksIHVubGVzcyBgZHJvcE5vd2AgaXMgZmFsc2UgKHRoZSBjYWxsZXIgc2lnbnMgb3V0IGl0c2VsZiByaWdodFxuICogYWZ0ZXIsIHdoaWNoIGRvZXMgdGhlIHNhbWUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVsZWFzZVNpZ25PdXQgKGRyb3BOb3cgPSB0cnVlKSB7XG4gIGlmIChzaWduT3V0SG9sZHMgPiAwKSBzaWduT3V0SG9sZHMtLVxuICBpZiAoc2lnbk91dEhvbGRzID09PSAwICYmIGRyb3BEZWZlcnJlZCkge1xuICAgIGRyb3BEZWZlcnJlZCA9IGZhbHNlXG4gICAgY29uc3QgcmVhc29uID0gZGVmZXJyZWRSZWFzb25cbiAgICBkZWZlcnJlZFJlYXNvbiA9IHVuZGVmaW5lZFxuICAgIGlmIChkcm9wTm93KSBzZXNzaW9uUmVmdXNlZCh0cnVlLCByZWFzb24pLmNhdGNoKCgpID0+IHt9KVxuICB9XG59XG5cbi8qKlxuICogVGhlIG9uZSBwYXRoIGZvciBhIHNlc3Npb24gdGhlIGNvbnNvbGUgcmVmdXNlZCAoYSByZWZyZXNoIHJlZnVzZWQgZm9yIGdvb2QsIGEgcmVmdXNlZCBjYWxsLCBhIGZvY3VzIGNoZWNrLCBhXG4gKiByZWNvbmNpbGUpOiBlbmQgaXQsIGFuZCBvbiBhIHByaW50ZXIncyBvd24gYWRkcmVzcyBzaWduIGluIGFnYWluIChvbmNlIGEgbWludXRlIGF0IG1vc3QpLiBXaGlsZSBhIGhvbGQgZGVmZXJzIHRoZVxuICogZHJvcCB0aGUgc2Vzc2lvbiBpcyBzdGlsbCBvbiBzY3JlZW4sIHNvIG5vdGhpbmcgc2lnbnMgaW4gYWdhaW4uIENhbGxzIHRoYXQgb3ZlcmxhcCBzaGFyZSBvbmUgcnVuICh0aGUgcmVmcmVzaCdzIG93blxuICogaG9vayBhbmQgdGhlIHJlcXVlc3QgdGhhdCBtZXQgdGhlIHJlZnVzYWwgYm90aCBhcnJpdmUgaGVyZSkuIGBmb3JjZWAgaXMgdGhlIHJlbGVhc2VkIGhvbGQnczogZHJvcCBpdCBub3cuXG4gKlxuICogS0FOLTI1MDk6IGEgcmVmdXNhbCB0aGF0IHNheXMgd2h5IChgcmVhc29uYCwgdGhlIGNvbnNvbGUncyB3aXJlIHN0cmluZzogYSBwdXNoZWQgYHNlc3Npb25fZW5kZWRgLCBhbm90aGVyIHRhYidzLCBhXG4gKiByZWZ1c2VkIHJlZnJlc2gpIGFsc28gbGVhdmVzIHRoZSBub3RlIHRoZSBzaWduZWQtb3V0IHBhZ2Ugd29yZHMgYW5kIGdvZXMgdGhlcmUsIGluIHBsYWNlIG9mIHNpZ25pbmcgaW4gYWdhaW4uXG4gKiBPbmUgcGF0aCwgc28gZXZlcnkgdGFiIGFuZCBldmVyeSBzb3VyY2UgZW5kcyB0aGUgc2FtZSB3YXkuIE5vIHJlYXNvbjogYXMgYmVmb3JlLlxuICovXG5sZXQgcmVmdXNpbmc6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbFxuLy8gVGhlIHNoYXJlZCBydW4ncyByZWFzb24sIGFuZCB3aGVyZSBpdCBoYXMgZ290IHRvLCBmb3IgYSBjYWxsZXIgdGhhdCBhcnJpdmVzIHdpdGggdGhlIHJlYXNvbiBhZnRlciBpdCBiZWdhbi5cbmxldCByZWZ1c2luZ1JlYXNvbjogc3RyaW5nIHwgdW5kZWZpbmVkXG5sZXQgcmVmdXNpbmdFbWFpbDogc3RyaW5nIHwgdW5kZWZpbmVkXG5sZXQgcmVmdXNpbmdEcm9wcGVkID0gZmFsc2VcbmZ1bmN0aW9uIHNlc3Npb25SZWZ1c2VkIChmb3JjZSA9IGZhbHNlLCByZWFzb24/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFyZWZ1c2luZykge1xuICAgIHJlZnVzaW5nUmVhc29uID0gcmVhc29uXG4gICAgcmVmdXNpbmdFbWFpbCA9IGNsb3VkU3RhdGUuYWNjb3VudD8uZW1haWxcbiAgICByZWZ1c2luZ0Ryb3BwZWQgPSBmYWxzZVxuICAgIHJlZnVzaW5nID0gKGFzeW5jICgpID0+IHtcbiAgICAgIGlmICghYXdhaXQgZHJvcFNlc3Npb24oZm9yY2UsIHJlZnVzaW5nUmVhc29uKSkgcmV0dXJuXG4gICAgICByZWZ1c2luZ0Ryb3BwZWQgPSB0cnVlXG4gICAgICAvLyBSZWFkIGFmdGVyIHRoZSBkcm9wOiBhIGNhbGxlciB0aGF0IGpvaW5lZCB0aGUgcnVuIG1lYW53aGlsZSBtYXkgaGF2ZSBicm91Z2h0IHRoZSByZWFzb24uXG4gICAgICBpZiAocmVmdXNpbmdSZWFzb24pIHtcbiAgICAgICAgc2hvd1NpZ25lZE91dChyZWZ1c2luZ1JlYXNvbiwgcmVmdXNpbmdFbWFpbClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBhd2FpdCBzaWduSW5BZ2Fpbk9uUHJpbnRlck9yaWdpbigpLmNhdGNoKCgpID0+IHt9KVxuICAgIH0pKCkuZmluYWxseSgoKSA9PiB7IHJlZnVzaW5nID0gbnVsbCB9KVxuICB9IGVsc2UgaWYgKHJlYXNvbiAmJiAhcmVmdXNpbmdSZWFzb24pIHtcbiAgICAvLyBBIHJ1biBhbHJlYWR5IG9uIGl0cyB3YXkgd2l0aG91dCBhIHJlYXNvbiAodGhlIHJlZnJlc2gncyBvd24gaG9vaykgaXMgam9pbmVkIGJ5IHRoZSBjYWxsZXIgdGhhdCBoYXMgaXQuXG4gICAgcmVmdXNpbmdSZWFzb24gPSByZWFzb25cbiAgICBpZiAoc2lnbk91dEhvbGRzID4gMCkgZGVmZXJyZWRSZWFzb24gPSByZWFzb25cbiAgICBlbHNlIGlmIChyZWZ1c2luZ0Ryb3BwZWQpIHNob3dTaWduZWRPdXQocmVhc29uLCByZWZ1c2luZ0VtYWlsKVxuICB9XG4gIHJldHVybiByZWZ1c2luZ1xufVxuXG4vKiogV2hlcmUgYSBzZXNzaW9uIHRoYXQgZW5kZWQgd2l0aCBhIHJlYXNvbiBnb2VzLiBBIHdob2xlIHBhZ2UgbG9hZCwgYXMgYSBzaWduLW91dCBmcm9tIGEgY2xvdWQgcHJpbnRlciBpczogbm90aGluZyBvZiB0aGUgc2Vzc2lvbiBpcyBsZWZ0IHRvIGNsZWFuLiAqL1xubGV0IGxlYXZlRm9yU2lnbmVkT3V0ID0gKCkgPT4geyB3aW5kb3cubG9jYXRpb24uYXNzaWduKCcvc2lnbmVkLW91dCcpIH1cblxuLyoqIEZvciB0ZXN0czogcmVwbGFjZXMgdGhlIG5hdmlnYXRpb24uICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U2lnbmVkT3V0TmF2aWdhdGlvbiAoZ286ICgpID0+IHZvaWQpIHtcbiAgbGVhdmVGb3JTaWduZWRPdXQgPSBnb1xufVxuXG5mdW5jdGlvbiBzaG93U2lnbmVkT3V0IChyZWFzb246IHN0cmluZywgZW1haWw6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICB0cnkge1xuICAgIC8vIEFscmVhZHkgdGhlcmU6IHRoZSBwYWdlIGhhcyByZWFkIGl0cyBub3RlLCBhbmQgYSBuZXcgb25lIHdvdWxkIGdyZWV0IHRoZSBuZXh0IHZpc2l0IHRvIGAvYCB3aXRoIGEgc3RhbGUgc2lnbi1vdXQuXG4gICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9zaWduZWQtb3V0JykgcmV0dXJuXG4gICAgbm90ZVNpZ25lZE91dCh7IHNjb3BlOiBzY29wZU9mUmVhc29uKHJlYXNvbiksIGVtYWlsLCByZWFzb24gfSlcbiAgICBsZWF2ZUZvclNpZ25lZE91dCgpXG4gIH0gY2F0Y2ggeyAvKiBubyB3aW5kb3cgKi8gfVxufVxuXG4vKiogVHJ1ZSB3aGVuIHRoZSBzZXNzaW9uIHdhcyBkcm9wcGVkLCBmYWxzZSB3aGVuIGEgaG9sZCBkZWZlcnJlZCBpdCAoYGZvcmNlYCBkcm9wcyB0aHJvdWdoIGEgaG9sZCkuICovXG5hc3luYyBmdW5jdGlvbiBkcm9wU2Vzc2lvbiAoZm9yY2UgPSBmYWxzZSwgcmVhc29uPzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGlmIChzaWduT3V0SG9sZHMgPiAwICYmICFmb3JjZSkge1xuICAgIGRyb3BEZWZlcnJlZCA9IHRydWVcbiAgICBpZiAocmVhc29uKSBkZWZlcnJlZFJlYXNvbiA9IHJlYXNvblxuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGRyb3BEZWZlcnJlZCA9IGZhbHNlXG4gIGRlZmVycmVkUmVhc29uID0gdW5kZWZpbmVkXG4gIHN0b3BTZXNzaW9uU3RyZWFtKClcbiAgZm9yZ2V0U2Vzc2lvbklkKClcbiAgLy8gQmVmb3JlIGFueXRoaW5nIG9mIHRoZSBzZXNzaW9uIGlzIGNsZWFyZWQ6IHdob2V2ZXIgYW5zd2VycyBmb3IgdGhlIGFjY291bnQgaGVhcnMgdGhhdCBpdCBsZWZ0IChhY2NvdW50LWV2ZW50cy50cykuXG4gIGlmIChjbG91ZFN0YXRlLmFjY291bnQgfHwgY3VycmVudEFjY291bnQoKS5zaWduZWRJbikgYW5ub3VuY2VBY2NvdW50KFNJR05FRF9PVVQpXG4gIGNvbmZpcm1Ub2tlbihudWxsKVxuICBzdG9wUmVjb25jaWxlUmV0cnkoKVxuICBmb3JnZXRPd25BdmF0YXIoKVxuICBmb3JnZXRTZWN1cmVSZWFjaCgpXG4gIHN0b3BQb2xsaW5nKClcbiAgc2Vzc2lvbkFib3J0LmFib3J0KClcbiAgc2Vzc2lvbkFib3J0ID0gbmV3IEFib3J0Q29udHJvbGxlcigpXG4gIGVuZHBvaW50UmVnaXN0cmF0aW9uID0gbnVsbFxuICBncmFudHMuY2xlYXIoKVxuICBwb2xsaW5nLmNsZWFyKClcbiAgc3RvcmVUb2tlbihudWxsKVxuICBzdG9yZVJlZnJlc2hUb2tlbihudWxsKVxuICBmb3IgKGNvbnN0IGMgb2Ygc3RhdHVzQ29ubmVjdGlvbnMudmFsdWVzKCkpIGMudGhlbihwID0+IHAuY2xvc2UoKSkuY2F0Y2goKCkgPT4ge30pXG4gIHN0YXR1c0Nvbm5lY3Rpb25zLmNsZWFyKClcbiAgY2xvdWRTdGF0ZS5hY2NvdW50ID0gbnVsbFxuICBjbG91ZFN0YXRlLnByaW50ZXJzID0gW11cbiAgY2xvdWRTdGF0ZS5zdGF0dXMgPSB7fVxuICBjbG91ZFN0YXRlLmVuZHBvaW50SWQgPSBudWxsXG4gIC8vIFRoZSBncm91cHMgYmVsb25nIHRvIHRoZSBhY2NvdW50IHRoYXQgbGVmdDogdGhlIG5leHQgb25lIHN0YXJ0cyBmcm9tIHRoZSBkZWZhdWx0IChLQU4tMjI0OSkuIFRoZSBidW1wIGFsc29cbiAgLy8gbWFrZXMgYW55IGxheW91dCBsb2FkIHN0aWxsIG9uIGl0cyB3YXkgZm9yIHRoZSBvbGQgYWNjb3VudCBzdGFsZS5cbiAgY2xvdWRTdGF0ZS5sYXlvdXQgPSBkZWZhdWx0TGF5b3V0KClcbiAgbGF5b3V0RWRpdHMrK1xuICByZXR1cm4gdHJ1ZVxufVxuXG4vKiogQnVtcGVkIGJ5IGV2ZXJ5IGxheW91dCBjaGFuZ2UgbWFkZSBoZXJlLCBhbmQgYnkgZXZlcnkgc2lnbi1vdXQsIHNvIGEgc2xvd2VyIGxvYWQga25vd3MgaXQgaXMgc3RhbGUuICovXG5sZXQgbGF5b3V0RWRpdHMgPSAwXG5cbi8qKiBBIGZyZXNoIGNvcHkgb2YgdGhlIGRlZmF1bHQgbGF5b3V0LCBzaGFyaW5nIG5vIG5lc3RlZCBvYmplY3Qgd2l0aCBERUZBVUxUX0ZMRUVUX0xBWU9VVC4gKi9cbmZ1bmN0aW9uIGRlZmF1bHRMYXlvdXQgKCk6IEZsZWV0TGF5b3V0IHtcbiAgcmV0dXJuIHsgLi4uREVGQVVMVF9GTEVFVF9MQVlPVVQsIGdyb3VwczogW10sIHdpZGdldHM6IHsgLi4uREVGQVVMVF9GTEVFVF9MQVlPVVQud2lkZ2V0cyB9IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYWRvcHRTZXNzaW9uICh0b2tlbjogc3RyaW5nLCBhY2NvdW50OiBDbG91ZEFjY291bnQsIGZyZXNoID0gZmFsc2UpIHtcbiAgLy8gQSBzaWduLWluIGlzIGEgbmV3IHNlc3Npb246IHRoZSBpZCBsZWFybmVkIGZvciB0aGUgbGFzdCBvbmUgaXMgbm90IGl0LCBhbmQgbm8gZWFybGllciBzaWduLW91dCBub3RlIGlzIGFib3V0IGl0LlxuICBpZiAoZnJlc2gpIHtcbiAgICBmb3JnZXRTZXNzaW9uSWQoKVxuICAgIGZvcmdldFNpZ25lZE91dCgpXG4gIH1cbiAgLy8gQSBkaWZmZXJlbnQgYWNjb3VudCB0aGFuIHRoZSBvbmUgb24gc2NyZWVuIChhIHNpZ24taW4sIG9yIGEgc3dpdGNoIHdpdGhvdXQgYSBzaWduLW91dCkgaXMgYW5ub3VuY2VkIGJlZm9yZSB0aGVcbiAgLy8gbmV3IHNlc3Npb24gcmVwbGFjZXMgdGhlIG9sZCBvbmUuIFRoZSBzYW1lIGFjY291bnQgd2l0aCBhIG5ldyB0b2tlbiBhbm5vdW5jZXMgbm90aGluZzogbm9ib2R5IGNoYW5nZWQuXG4gIGlmIChjbG91ZFN0YXRlLmFjY291bnQ/LmlkICE9PSBhY2NvdW50LmlkKSBhbm5vdW5jZUFjY291bnQoaWRlbnRpdHlPZihhY2NvdW50KSlcbiAgc3RvcmVUb2tlbih0b2tlbilcbiAgY29uZmlybVRva2VuKHRva2VuKVxuICAvLyBTaWduZWQgaW4gYXMgc29tZW9uZSBlbHNlIHdpdGhvdXQgYSBzaWduLW91dCBmaXJzdCAoc2lnbkluIHdoaWxlIHNpZ25lZCBpbik6IHRoZSBncm91cHMgb24gc2NyZWVuIGFyZSBub3QgdGhlaXJzLlxuICBpZiAoY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCAhPT0gYWNjb3VudC5pZCkge1xuICAgIGNsb3VkU3RhdGUubGF5b3V0ID0gZGVmYXVsdExheW91dCgpXG4gICAgbGF5b3V0RWRpdHMrK1xuICB9XG4gIGNsb3VkU3RhdGUuYWNjb3VudCA9IGFjY291bnRcbiAgY2xvdWRTdGF0ZS5lcnJvciA9IG51bGxcbiAgLy8gUmVhZCBiZWZvcmUgdGhlIHByaW50ZXJzIGZldGNoOiBhIGdyb3VwIG1hZGUgd2hpbGUgZWl0aGVyIGFuc3dlciBpcyBvbiBpdHMgd2F5IGlzIG5ld2VyIHRoYW4gdGhlIHNhdmVkIGxheW91dC5cbiAgY29uc3QgZWRpdHNCZWZvcmUgPSBsYXlvdXRFZGl0c1xuICBjb25zdCBzaWduYWwgPSBzZXNzaW9uQWJvcnQuc2lnbmFsXG4gIGNvbnN0IGN1cnJlbnQgPSAoKSA9PiAhc2lnbmFsLmFib3J0ZWQgJiYgY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA9PT0gYWNjb3VudC5pZFxuICBhd2FpdCByZWZyZXNoUHJpbnRlcnMoKVxuICBpZiAoIWN1cnJlbnQoKSkgcmV0dXJuXG4gIHRyeSB7XG4gICAgY29uc3QgeyBsYXlvdXQgfSA9IGF3YWl0IGNsb3VkQXBpLmdldExheW91dCgpXG4gICAgLy8gQSBsYXRlIGFuc3dlciBpcyBkcm9wcGVkIHdoZW4gdGhlIGxheW91dCBjaGFuZ2VkIG1lYW53aGlsZSAoYSBncm91cCBtYWRlIGhlcmUsIHdoaWNoIHNhdmVMYXlvdXQgc2VuZHMgb24gaXRzXG4gICAgLy8gb3duKSBvciB0aGUgYWNjb3VudCBpdCB3YXMgYXNrZWQgZm9yIGlzIG5vIGxvbmdlciB0aGUgb25lIHNpZ25lZCBpbiAoYSBzaWduLW91dCBhbHNvIGJ1bXBzIHRoZSBjb3VudGVyKS5cbiAgICBpZiAobGF5b3V0RWRpdHMgPT09IGVkaXRzQmVmb3JlICYmIGN1cnJlbnQoKSkgY2xvdWRTdGF0ZS5sYXlvdXQgPSB7IC4uLkRFRkFVTFRfRkxFRVRfTEFZT1VULCAuLi5sYXlvdXQsIHdpZGdldHM6IHsgLi4uREVGQVVMVF9GTEVFVF9MQVlPVVQud2lkZ2V0cywgLi4uKGxheW91dD8ud2lkZ2V0cyA/PyB7fSkgfSB9XG4gIH0gY2F0Y2ggeyAvKiBrZWVwIHRoZSBkZWZhdWx0ICovIH1cbiAgaWYgKCFjdXJyZW50KCkpIHJldHVyblxuICBzdGFydFBvbGxpbmcoKVxuICB3YXRjaFNlc3Npb25FbmQoYWNjb3VudC5pZClcbn1cblxuLyoqXG4gKiBLQU4tMjUwOTogdGhpcyB0YWIgbGVhcm5zIGl0cyBzZXNzaW9uIGlkICh3aGF0IG1ha2VzIGFub3RoZXIgdGFiJ3MgYG11b24uY2xvdWQuZW5kZWRgIG91cnMpLCBhbmQgdGFrZXMgcGFydCBpbiB0aGVcbiAqIGJyb3dzZXIncyBvbmUgbGl2ZSBzaWduLW91dCBzdHJlYW0gKHNlc3Npb24tZXZlbnRzLnRzKS4gQSBuZXcgc2Vzc2lvbiBpbiB0aGUgbGVhZGVyIHRhYiByZWNvbm5lY3RzIGl0cyBzdHJlYW0uXG4gKi9cbmZ1bmN0aW9uIHdhdGNoU2Vzc2lvbkVuZCAoYWNjb3VudElkOiBzdHJpbmcpIHtcbiAgaWYgKCFzZXNzaW9uU3RyZWFtQXZhaWxhYmxlKCkpIHJldHVyblxuICBpZiAoIWN1cnJlbnRTZXNzaW9uSWQoYWNjb3VudElkKSkgY2xvdWRBcGkubWUoKS5jYXRjaCgoKSA9PiB7fSlcbiAgc3RhcnRTZXNzaW9uU3RyZWFtKHN0cmVhbURlcHMpXG59XG5cbi8qKlxuICogVGhlIGxlYWRlcidzIHN0cmVhbSBoZWFyZCBgc2Vzc2lvbl9lbmRlZGAuIFdyaXR0ZW4gZm9yIGV2ZXJ5IG90aGVyIHRhYiBmaXJzdCAodGhlaXIgYHN0b3JhZ2VgIGV2ZW50KSwgdGhlbiB0aGlzIHRhYlxuICogZHJvcHMgdGhlIHNlc3Npb24gdGhlIG9uZSB3YXkgYSByZWZ1c2FsIGRvZXMuIFRoZSB3cml0ZSBjb21lcyBiZWZvcmUgdGhlIGRyb3AsIHNvIGEgdGFiIHJlYWRzIHRoZSByZWFzb24gYmVmb3JlIGl0XG4gKiBzZWVzIHRoZSB0b2tlbiBnby5cbiAqXG4gKiBgc2Vzc2lvbklkYCBhbmQgYHRva2VuYCBhcmUgdGhlIHNlc3Npb24gdGhlIGNvbm5lY3Rpb24gd2FzIG9wZW5lZCBmb3IuIFRoZSByZWFzb24gaXMgYWJvdXQgdGhhdCBzZXNzaW9uOiBpZiBhbm90aGVyXG4gKiB0YWIgaGFzIHN0b3JlZCBhbm90aGVyIHNpbmNlLCBub3RoaW5nIGlzIHdyaXR0ZW4gYW5kIG5vdGhpbmcgaXMgZHJvcHBlZCAoZmFsc2U6IHRoZSBzdHJlYW0gYXNrcyBhZ2FpbiB3aXRoIHRoZVxuICogc3RvcmVkIG9uZSkuIFRoZSBpZCB3cml0dGVuIGlzIHRoZSBjb25uZWN0aW9uJ3MsIG5ldmVyIHdoYXRldmVyIGlzIGN1cnJlbnQgbm93LiBFeHBvcnRlZCBmb3IgdGVzdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoRW5kZWQgKHJlYXNvbjogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXNzaW9uSWQ6IHN0cmluZyB8IG51bGwsIHRva2VuOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKHN0b3JlZFRva2VuKCkgIT09IHRva2VuKSByZXR1cm4gZmFsc2VcbiAgY29uc3Qgd2h5ID0gcmVhc29uID8/ICdzaWduZWRfb3V0J1xuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEVOREVEX0tFWSwgSlNPTi5zdHJpbmdpZnkoeyByZWFzb246IHdoeSwgc2Vzc2lvbl9pZDogc2Vzc2lvbklkID8/IGN1cnJlbnRTZXNzaW9uSWQoY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCksIGF0OiBEYXRlLm5vdygpIH0pKVxuICB9IGNhdGNoIHsgLyogbm8gc3RvcmFnZTogdGhlIG90aGVyIHRhYnMgZmluZCBvdXQgZnJvbSB0aGUgdG9rZW4gZ29pbmcsIG9yIG9uIGZvY3VzICovIH1cbiAgc2Vzc2lvblJlZnVzZWQoZmFsc2UsIHdoeSkuY2F0Y2goKCkgPT4ge30pXG4gIHJldHVybiB0cnVlXG59XG5cbmNvbnN0IHN0cmVhbURlcHMgPSB7IHNlc3Npb25JZDogKCkgPT4gY3VycmVudFNlc3Npb25JZChjbG91ZFN0YXRlLmFjY291bnQ/LmlkKSwgb25FbmRlZDogcHVibGlzaEVuZGVkIH1cblxuLyoqXG4gKiBBbm90aGVyIHRhYidzIGxlYWRlciB3cm90ZSBgbXVvbi5jbG91ZC5lbmRlZGAgKHB1Ymxpc2hFbmRlZCkuIE9ubHkgYSByZWNvcmQgb2YgVEhJUyB0YWIncyBzZXNzaW9uIGNvdW50czogYW5vdGhlclxuICogc2Vzc2lvbiBpZCBpcyBhIGxlZnRvdmVyIG9mIGFub3RoZXIgYWNjb3VudCBhbmQgY2hhbmdlcyBub3RoaW5nICh0aGUgdG9rZW4gZ29pbmcgc3RpbGwgZW5kcyB0aGlzIHRhYiwgYXMgYmVmb3JlKS5cbiAqL1xuZnVuY3Rpb24gZW5kZWRFbHNld2hlcmUgKHJhdzogc3RyaW5nIHwgbnVsbCkge1xuICBpZiAoIXJhdyB8fCAhY2xvdWRTdGF0ZS5hY2NvdW50KSByZXR1cm5cbiAgdHJ5IHtcbiAgICBjb25zdCBub3RlID0gSlNPTi5wYXJzZShyYXcpIGFzIHsgcmVhc29uPzogdW5rbm93biwgc2Vzc2lvbl9pZD86IHVua25vd24gfVxuICAgIGNvbnN0IG1pbmUgPSBjdXJyZW50U2Vzc2lvbklkKGNsb3VkU3RhdGUuYWNjb3VudC5pZClcbiAgICBpZiAoIW1pbmUgfHwgbm90ZS5zZXNzaW9uX2lkICE9PSBtaW5lIHx8IHR5cGVvZiBub3RlLnJlYXNvbiAhPT0gJ3N0cmluZycpIHJldHVyblxuICAgIHNlc3Npb25SZWZ1c2VkKGZhbHNlLCBub3RlLnJlYXNvbikuY2F0Y2goKCkgPT4ge30pXG4gIH0gY2F0Y2ggeyAvKiBub3Qgb3VycyB0byByZWFkICovIH1cbn1cblxuLy8gQW5vdGhlciB0YWIgc2lnbmVkIG91dCwgb3IgdGhlIGNvbnNvbGUncyBmcm9udC1jaGFubmVsIGxvZ291dCBwYWdlXG4vLyAocHVibGljL2F1dGgvbG9nb3V0Lmh0bWwpIGNsZWFyZWQgdGhlIHRva2VuOiB0aGlzIHRhYiBpcyBzaWduZWQgb3V0IHRvby5cbi8vIEFub3RoZXIgdGFiIHNpZ25lZCBpbiwgb3IgYXMgc29tZW9uZSBlbHNlLCBvciBvbmx5IHJvdGF0ZWQgdGhlIHRva2VuOiB0aGlzIHRhYiBhc2tzIHRoZSBjb25zb2xlIHdob3NlIHNlc3Npb24gaXQgbm93XG4vLyBpcyAocmVjb25jaWxlU3RvcmVkU2Vzc2lvbikgaW5zdGVhZCBvZiBrZWVwaW5nIHRoZSBhY2NvdW50IGl0IGhhZC5cbnRyeSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gRU5ERURfS0VZKSByZXR1cm4gZW5kZWRFbHNld2hlcmUoZXZlbnQubmV3VmFsdWUpXG4gICAgaWYgKGV2ZW50LmtleSAhPT0gVE9LRU5fS0VZICYmIGV2ZW50LmtleSAhPT0gbnVsbCkgcmV0dXJuXG4gICAgaWYgKCFzdG9yZWRUb2tlbigpKSB7XG4gICAgICBpZiAoY2xvdWRTdGF0ZS5hY2NvdW50KSBkcm9wU2Vzc2lvbigpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgcmVjb25jaWxlU3RvcmVkU2Vzc2lvbigpLmNhdGNoKCgpID0+IHt9KVxuICB9KVxufSBjYXRjaCB7IC8qIG5vIHdpbmRvdyAqLyB9XG5cbi8vIEtBTi0xMzg5OiBhIHRhYiB0aGF0IGNvbWVzIGJhY2sgY2hlY2tzIGl0cyBzZXNzaW9uIHN0aWxsIHN0YW5kcyAoYSByZWZ1c2FsIHRoZW4gcmVhY2hlcyBzZXNzaW9uUmVmdXNlZCB0aHJvdWdoIGFwaS50cydzIGhvb2spLlxud2F0Y2hGb2N1cygoKSA9PiBjbG91ZFN0YXRlLmFjY291bnQgIT09IG51bGwsICgpID0+IGNsb3VkQXBpLm1lKCkpXG5cbi8qKlxuICogVGhlIHN0b3JlZCB0b2tlbidzIGFjY291bnQsIGFza2VkIG9mIHRoZSBjb25zb2xlOiB0aGUgc2FtZSBhY2NvdW50IGFzIG9uIHNjcmVlbiBpcyBjb25maXJtZWQgZm9yIHRoaXMgdG9rZW4gYW5kXG4gKiBrZXB0IGFzIGl0IGlzOyBhbm90aGVyIChvciBub25lIHlldCkgaXMgYWRvcHRlZCwgd2hpY2ggYW5ub3VuY2VzIGl0IGJlZm9yZSBhbnl0aGluZyBpcyByZXBsYWNlZDsgYSByZWZ1c2FsIGVuZHMgdGhlXG4gKiBzZXNzaW9uLiBBIGNvbnNvbGUgdGhhdCBjYW5ub3QgYmUgcmVhY2hlZCAoc3RhdHVzIDAsIDV4eCwgNDI5KSBsZWF2ZXMgdGhlIGFjY291bnQgdW5jb25maXJtZWQgZm9yIHRoaXMgdG9rZW4sIHdoaWNoXG4gKiBrZWVwcyBhc3NlcnRpb25zIGFuZCBydW4gcmVwb3J0cyBmcm9tIGJlaW5nIHNlcnZlZCB1bmRlciBhIG1pc21hdGNoZWQgYWNjb3VudCwgYW5kIGlzIHJldHJpZWQgb24gYSBiYWNrb2ZmIGFuZCB3aGVuXG4gKiB0aGUgYnJvd3NlciBjb21lcyBiYWNrIG9ubGluZSB1bnRpbCBpdCBhbnN3ZXJzLiBOZXZlciBtb3JlIHRoYW4gb25lIGlzIGluIGZsaWdodC5cbiAqL1xubGV0IHJlY29uY2lsaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcblxuZXhwb3J0IGZ1bmN0aW9uIHJlY29uY2lsZVN0b3JlZFNlc3Npb24gKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXJlY29uY2lsaW5nKSByZWNvbmNpbGluZyA9IHJlY29uY2lsZU9uY2UoKS5maW5hbGx5KCgpID0+IHsgcmVjb25jaWxpbmcgPSBudWxsIH0pXG4gIHJldHVybiByZWNvbmNpbGluZ1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWNvbmNpbGVPbmNlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgZm9yICg7Oykge1xuICAgIGNvbnN0IHRva2VuID0gc3RvcmVkVG9rZW4oKVxuICAgIGlmICghdG9rZW4pIHJldHVybiBzdG9wUmVjb25jaWxlUmV0cnkoKVxuICAgIGxldCBtZTogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBjbG91ZEFwaS5tZT4+XG4gICAgdHJ5IHtcbiAgICAgIG1lID0gYXdhaXQgY2xvdWRBcGkubWUoKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yICYmIGVycm9yLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgIHN0b3BSZWNvbmNpbGVSZXRyeSgpXG4gICAgICAgIGF3YWl0IHNlc3Npb25SZWZ1c2VkKClcbiAgICAgIH0gZWxzZSBpZiAoc3RvcmVkVG9rZW4oKSAmJiBpc1RyYW5zaWVudChlcnJvcikpIHtcbiAgICAgICAgc2NoZWR1bGVSZWNvbmNpbGVSZXRyeSgpXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3Qgbm93ID0gc3RvcmVkVG9rZW4oKVxuICAgIGlmICghbm93KSByZXR1cm4gc3RvcFJlY29uY2lsZVJldHJ5KClcbiAgICAvLyBBbm90aGVyIHRva2VuIHNpbmNlIHRoZSBxdWVzdGlvbiB3YXMgYXNrZWQ6IGl0cyBhY2NvdW50IGlzIGFza2VkIGFmcmVzaCwgbmV2ZXIgcGFpcmVkIHdpdGggdGhpcyBhbnN3ZXIuXG4gICAgaWYgKG5vdyAhPT0gdG9rZW4pIGNvbnRpbnVlXG4gICAgc3RvcFJlY29uY2lsZVJldHJ5KClcbiAgICBpZiAoY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA9PT0gbWUuYWNjb3VudC5pZCkge1xuICAgICAgY29uZmlybVRva2VuKG5vdylcbiAgICAgIC8vIEFub3RoZXIgdGFiIHN0b3JlZCBhIG5ldyBzZXNzaW9uIG9yIGEgcm90YXRlZCBwYWlyIGZvciB0aGlzIGFjY291bnQ6IHRoZSBzdHJlYW0gZm9sbG93cyB0aGUgc3RvcmVkIG9uZS5cbiAgICAgIHJlY29ubmVjdElmVG9rZW5DaGFuZ2VkKClcbiAgICB9IGVsc2UgYXdhaXQgYWRvcHRTZXNzaW9uKG5vdywgbWUuYWNjb3VudClcbiAgICByZXR1cm5cbiAgfVxufVxuXG4vKiogT25seSBhIGNvbnNvbGUgdGhhdCBkaWQgbm90IGFuc3dlciwgb3IgYW5zd2VyZWQgXCJsYXRlclwiICgwLCA1eHgsIDQyOSksIGlzIGFza2VkIGFnYWluOyA0MDMgYW5kIDQwNCBhcmUgYW5zd2Vycy4gKi9cbi8vIEEgMnh4IHdob3NlIGJvZHkgd291bGQgbm90IHBhcnNlIChhIGNhcHRpdmUgcG9ydGFsJ3MgcGFnZSkgYW5kIGEgNDA4IGFyZSBwYXNzaW5nLCB0b28uXG5jb25zdCBpc1RyYW5zaWVudCA9IChlcnJvcjogdW5rbm93bik6IGJvb2xlYW4gPT4gZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yICYmXG4gIChlcnJvci5zdGF0dXMgPT09IDAgfHwgZXJyb3Iuc3RhdHVzID09PSA0MDggfHwgZXJyb3Iuc3RhdHVzID09PSA0MjkgfHwgZXJyb3Iuc3RhdHVzID49IDUwMCB8fCAoZXJyb3Iuc3RhdHVzID49IDIwMCAmJiBlcnJvci5zdGF0dXMgPCAzMDApKVxuXG4vKiogRm9yIHRlc3RzOiBubyB0aW1lciwgbm8gY291bnQgbGVmdCBmcm9tIHRoZSBsYXN0IG9uZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldFJlY29uY2lsZUZvclRlc3RzICgpIHtcbiAgc3RvcFJlY29uY2lsZVJldHJ5KClcbn1cblxuLyoqIFdhaXRzIGJlZm9yZSB0aGUgbnRoIHJldHJ5OiA1IHMsIDE1IHMsIDYwIHMsIHRoZW4gZXZlcnkgNSBtaW51dGVzLiAqL1xuZXhwb3J0IGNvbnN0IFJFQ09OQ0lMRV9SRVRSWV9NUyA9IFs1XzAwMCwgMTVfMDAwLCA2MF8wMDAsIDMwMF8wMDBdXG5sZXQgcmVjb25jaWxlVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGxcbmxldCByZWNvbmNpbGVBdHRlbXB0cyA9IDBcblxuZnVuY3Rpb24gc2NoZWR1bGVSZWNvbmNpbGVSZXRyeSAoKSB7XG4gIGlmIChyZWNvbmNpbGVUaW1lciAhPT0gbnVsbCkgcmV0dXJuXG4gIGNvbnN0IHRva2VuID0gc3RvcmVkVG9rZW4oKVxuICBpZiAoIXRva2VuIHx8IGNvbmZpcm1lZEFjY291bnRJZCh0b2tlbikpIHJldHVyblxuICBjb25zdCB3YWl0ID0gUkVDT05DSUxFX1JFVFJZX01TW01hdGgubWluKHJlY29uY2lsZUF0dGVtcHRzLCBSRUNPTkNJTEVfUkVUUllfTVMubGVuZ3RoIC0gMSldXG4gIHJlY29uY2lsZUF0dGVtcHRzKytcbiAgcmVjb25jaWxlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICByZWNvbmNpbGVUaW1lciA9IG51bGxcbiAgICByZWNvbmNpbGVTdG9yZWRTZXNzaW9uKCkuY2F0Y2goKCkgPT4ge30pXG4gIH0sIHdhaXQpXG59XG5cbi8qKiBUaGUgb25lIHNoYXJlZCB0aW1lciwgY2xlYXJlZCB3aGVuIHRoZSBhY2NvdW50IGlzIGtub3duLCB0aGUgdG9rZW4gaXMgZ29uZSwgdGhlIGNvbnNvbGUgcmVmdXNlZCBpdCwgb3Igb24gc2lnbi1vdXQuICovXG5mdW5jdGlvbiBzdG9wUmVjb25jaWxlUmV0cnkgKCkge1xuICBpZiAocmVjb25jaWxlVGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dChyZWNvbmNpbGVUaW1lcilcbiAgcmVjb25jaWxlVGltZXIgPSBudWxsXG4gIHJlY29uY2lsZUF0dGVtcHRzID0gMFxufVxuXG50cnkge1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgKCkgPT4ge1xuICAgIGNvbnN0IHRva2VuID0gc3RvcmVkVG9rZW4oKVxuICAgIGlmICghdG9rZW4gfHwgY29uZmlybWVkQWNjb3VudElkKHRva2VuKSkgcmV0dXJuXG4gICAgaWYgKHJlY29uY2lsZVRpbWVyICE9PSBudWxsKSB7IGNsZWFyVGltZW91dChyZWNvbmNpbGVUaW1lcik7IHJlY29uY2lsZVRpbWVyID0gbnVsbCB9XG4gICAgcmVjb25jaWxlU3RvcmVkU2Vzc2lvbigpLmNhdGNoKCgpID0+IHt9KVxuICB9KVxufSBjYXRjaCB7IC8qIG5vIHdpbmRvdyAqLyB9XG5cbi8vIFdoZXJlIHRoZSBjb25zb2xlIGNsaWVudCBjaGFuZ2VzIHRoZSBzZXNzaW9uIG9uIGl0cyBvd24gKGFwaS50cyk6IHRoZSBhY2NvdW50IGlzIGFubm91bmNlZCBmaXJzdCAoc2Vzc2lvblJlZnVzZWRcbi8vIHJlYWNoZXMgZHJvcFNlc3Npb24sIHdoaWNoIGFubm91bmNlcyBiZWZvcmUgaXQgY2xlYXJzIGFueXRoaW5nLCBhbmQgYXBpLnRzIGNsZWFycyB0aGUgdG9rZW5zIGFmdGVyKSwgdGhlbiwgb24gYVxuLy8gcHJpbnRlcidzIG93biBhZGRyZXNzLCBzaWducyBpbiBhZ2FpbiBhcyBmb3IgYW55IHJlZnVzYWwuIEEgcmVjb3ZlcmVkIHBhaXIgaXMgY2hlY2tlZCBhZ2FpbnN0IHRoZSBhY2NvdW50IG9uIHNjcmVlbi5cbnNldFNlc3Npb25Ib29rcyh7XG4gIHJlZnVzZWQ6IChyZWFzb24pID0+IHsgc2Vzc2lvblJlZnVzZWQoZmFsc2UsIHJlYXNvbikuY2F0Y2goKCkgPT4ge30pIH0sXG4gIGNoZWNrOiAoKSA9PiB7IHJlY29uY2lsZVN0b3JlZFNlc3Npb24oKS5jYXRjaCgoKSA9PiB7fSkgfSxcbiAgYXN5bmMgcmVjb3ZlcmVkICgpIHtcbiAgICBjb25zdCBhc2tlZCA9IHN0b3JlZFRva2VuKClcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWUgPSBhd2FpdCBjbG91ZEFwaS5tZVdpdGhvdXRSZWZyZXNoKClcbiAgICAgIGNvbnN0IHRva2VuID0gc3RvcmVkVG9rZW4oKVxuICAgICAgaWYgKCF0b2tlbikgcmV0dXJuIGZhbHNlXG4gICAgICAvLyBBbm90aGVyIHRva2VuIHNpbmNlIC9tZSB3YXMgYXNrZWQgKGFub3RoZXIgdGFiKTogaXRzIGFjY291bnQgaXMgYXNrZWQgYWZyZXNoLCBuZXZlciBwYWlyZWQgd2l0aCB0aGlzIGFuc3dlci5cbiAgICAgIGlmICh0b2tlbiAhPT0gYXNrZWQpIHtcbiAgICAgICAgcmVjb25jaWxlU3RvcmVkU2Vzc2lvbigpLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgaWYgKGNsb3VkU3RhdGUuYWNjb3VudD8uaWQgPT09IG1lLmFjY291bnQuaWQpIGNvbmZpcm1Ub2tlbih0b2tlbilcbiAgICAgIGVsc2UgYWRvcHRTZXNzaW9uKHRva2VuLCBtZS5hY2NvdW50KS5jYXRjaCgoKSA9PiB7fSlcbiAgICAgIC8vIFRoZSByZWNvdmVyZWQgcGFpciBpcyBhbm90aGVyIHNlc3Npb24gb2YgdGhlIGFjY291bnQ6IGl0cyBzdHJlYW0gaXMgdGhlIG9uZSB0byBob2xkLlxuICAgICAgc3RhcnRTZXNzaW9uU3RyZWFtKHN0cmVhbURlcHMpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBPbmx5IGEgcmVmdXNhbCBlbmRzIHRoZSBzZXNzaW9uLiBBIGNvbnNvbGUgdGhhdCBkaWQgbm90IGFuc3dlciBsZWF2ZXMgdGhlIHBhaXIgaW4gcGxhY2UsIHVuY29uZmlybWVkLCBhbmQgdGhlXG4gICAgICAvLyByZXRyeSBmaW5pc2hlcyB0aGUgY2hlY2suXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yICYmIGVycm9yLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgIGF3YWl0IGRyb3BTZXNzaW9uKClcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBpZiAoaXNUcmFuc2llbnQoZXJyb3IpKSBzY2hlZHVsZVJlY29uY2lsZVJldHJ5KClcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIEZpbmlzaGVzIGEgcmV0dXJuIGZyb20gdGhlIGNvbnNvbGUncyBgL2F1dGhvcml6ZWAgKGBXRUItMTJgKTogZXhjaGFuZ2VzIHRoZVxuICogY29kZSBhdCBgL3Rva2VuYCwgb3Igbm90ZXMgdGhhdCB0aGUgY29uc29sZSBoYXMgbm8gc2Vzc2lvbi4gQW5zd2VycyB0aGVcbiAqIGhhc2ggcm91dGUgdGhlIHNpZ24taW4gc3RhcnRlZCBmcm9tLCBmb3IgdGhlIGNhbGxlciB0byBnbyBiYWNrIHRvLlxuICovXG5hc3luYyBmdW5jdGlvbiBjb21wbGV0ZUNlbnRyYWxTaWduSW4gKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBpZiAoIWNlbnRyYWxMb2dpbkVuYWJsZWQoKSkgcmV0dXJuIG51bGxcbiAgY29uc3QgcmVzdWx0ID0gdGFrZUNhbGxiYWNrKClcbiAgc3dpdGNoIChyZXN1bHQub3V0Y29tZSkge1xuICAgIGNhc2UgJ25vbmUnOlxuICAgICAgcmV0dXJuIG51bGxcbiAgICBjYXNlICdjb2RlJzpcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBjbG91ZEFwaS5leGNoYW5nZUNvZGUocmVzdWx0LmNvZGUsIHJlZGlyZWN0VXJpKCksIHJlc3VsdC52ZXJpZmllcilcbiAgICAgICAgc3RvcmVUb2tlbihzZXNzaW9uLmFjY2Vzc190b2tlbilcbiAgICAgICAgc3RvcmVSZWZyZXNoVG9rZW4oc2Vzc2lvbi5yZWZyZXNoX3Rva2VuKVxuICAgICAgICBjbGVhclNpbGVudEF0dGVtcHQoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY2xvdWRTdGF0ZS5lcnJvciA9IChlcnJvciBhcyBFcnJvcikubWVzc2FnZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdC5yZXR1cm5Ub1xuICAgIGNhc2UgJ3NpZ25lZF9vdXQnOlxuICAgICAgcmV0dXJuIHJlc3VsdC5yZXR1cm5Ub1xuICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgIGNsb3VkU3RhdGUuZXJyb3IgPSByZXN1bHQubWVzc2FnZVxuICAgICAgcmV0dXJuIHJlc3VsdC5yZXR1cm5Ub1xuICB9XG59XG5cbi8qKlxuICogUmVzdG9yZXMgYSBzYXZlZCBzZXNzaW9uIGF0IHN0YXJ0LXVwLCBhZnRlciBjb21wbGV0aW5nIGEgY2VudHJhbCBzaWduLWluXG4gKiBpZiB0aGlzIGxvYWQgaXMgdGhlIHJldHVybiBmcm9tIG9uZS4gQW5zd2VycyB0aGUgaGFzaCByb3V0ZSB0byBnbyBiYWNrIHRvLFxuICogb3IgbnVsbC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRDbG91ZCAoc2Vzc2lvbkNoZWNrPzogUHJvbWlzZTx2b2lkPik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBhd2FpdCBzZXNzaW9uQ2hlY2tcbiAgY29uc3QgcmV0dXJuVG8gPSBhd2FpdCBjb21wbGV0ZUNlbnRyYWxTaWduSW4oKVxuICBjb25zdCB0b2tlbiA9IHN0b3JlZFRva2VuKClcbiAgaWYgKHRva2VuKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lID0gYXdhaXQgY2xvdWRBcGkubWUoKVxuICAgICAgY29uc3QgY3VycmVudFRva2VuID0gc3RvcmVkVG9rZW4oKVxuICAgICAgLy8gVGhlIGFjY291bnQgL21lIG5hbWVkIGJlbG9uZ3MgdG8gdGhlIHRva2VuIGl0IHdhcyBhc2tlZCB3aXRoLiBBbm90aGVyIHRva2VuIG5vdyAoYW5vdGhlciB0YWIsIGEgcmVjb3ZlcnkpXG4gICAgICAvLyBpcyBhc2tlZCBhYm91dCBhZnJlc2gsIG5ldmVyIHBhaXJlZCB3aXRoIHRoaXMgYW5zd2VyLlxuICAgICAgaWYgKGN1cnJlbnRUb2tlbiA9PT0gdG9rZW4pIGF3YWl0IGFkb3B0U2Vzc2lvbihjdXJyZW50VG9rZW4sIG1lLmFjY291bnQpXG4gICAgICBlbHNlIGlmIChjdXJyZW50VG9rZW4pIGF3YWl0IHJlY29uY2lsZVN0b3JlZFNlc3Npb24oKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yICYmIGVycm9yLnN0YXR1cyA9PT0gNDAxKSBhd2FpdCBzZXNzaW9uUmVmdXNlZCgpXG4gICAgICAvLyBUaGUgY29uc29sZSBjb3VsZCBub3QgYmUgcmVhY2hlZDogbm8gYWNjb3VudCB5ZXQsIHNvIG5vdGhpbmcgaXMgc2VydmVkIG9yIHJlcG9ydGVkOyBhc2tlZCBhZ2FpbiBvbiBhIGJhY2tvZmYuXG4gICAgICBlbHNlIGlmIChpc1RyYW5zaWVudChlcnJvcikpIHNjaGVkdWxlUmVjb25jaWxlUmV0cnkoKVxuICAgIH1cbiAgfVxuICBjbG91ZFN0YXRlLnJlYWR5ID0gdHJ1ZVxuICByZXR1cm4gcmV0dXJuVG9cbn1cblxuLyoqXG4gKiBTaWducyBpbiB3aXRoIGEgcGFzc3dvcmQuIEFuIGFjY291bnQgd2l0aCBhbiBhdXRoZW50aWNhdG9yIGFwcCBpcyBub3RcbiAqIHNpZ25lZCBpbiB5ZXQ6IHRoZSBjb25zb2xlIGFuc3dlcnMgYDQwM2Agd2l0aCBhbiBgbWZhX3Rva2VuYCwgcmV0dXJuZWQgaGVyZVxuICogc28gdGhlIGRpYWxvZyBjYW4gYXNrIGZvciB0aGUgY29kZSAoYHNpZ25JbldpdGhDb2RlYCkuIE51bGw6IHNpZ25lZCBpbi5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNpZ25JbiAoZW1haWw6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgdG9rZW4sIGFjY291bnQgfSA9IGF3YWl0IGNsb3VkQXBpLnNpZ25JbihlbWFpbCwgcGFzc3dvcmQpXG4gICAgYXdhaXQgYWRvcHRTZXNzaW9uKHRva2VuLCBhY2NvdW50LCB0cnVlKVxuICAgIHJldHVybiBudWxsXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgbWZhID0gZXJyb3IgaW5zdGFuY2VvZiBDbG91ZEVycm9yICYmIGVycm9yLnN0YXR1cyA9PT0gNDAzICYmIGVycm9yLmJvZHkubWZhX3JlcXVpcmVkID09PSB0cnVlICYmIHR5cGVvZiBlcnJvci5ib2R5Lm1mYV90b2tlbiA9PT0gJ3N0cmluZydcbiAgICAgID8gZXJyb3IuYm9keS5tZmFfdG9rZW5cbiAgICAgIDogbnVsbFxuICAgIGlmIChtZmEpIHJldHVybiBtZmFcbiAgICB0aHJvdyBlcnJvclxuICB9XG59XG5cbi8qKiBUaGUgc2Vjb25kIHN0ZXAgb2YgYHNpZ25JbmA6IHRoZSBzaXgtZGlnaXQgY29kZSAob3IgYSByZWNvdmVyeSBjb2RlKS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzaWduSW5XaXRoQ29kZSAobWZhVG9rZW46IHN0cmluZywgY29kZTogc3RyaW5nKSB7XG4gIGNvbnN0IHsgdG9rZW4sIGFjY291bnQgfSA9IGF3YWl0IGNsb3VkQXBpLnNpZ25JbkNvZGUobWZhVG9rZW4sIGNvZGUucmVwbGFjZSgvXFxzKy9nLCAnJykpXG4gIGF3YWl0IGFkb3B0U2Vzc2lvbih0b2tlbiwgYWNjb3VudCwgdHJ1ZSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNpZ25VcCAoZW1haWw6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBkZWNsYXJlZEFnZT86IG51bWJlcikge1xuICBjb25zdCB7IHRva2VuLCBhY2NvdW50IH0gPSBhd2FpdCBjbG91ZEFwaS5zaWduVXAoZW1haWwsIHBhc3N3b3JkLCBuYW1lLCBkZWNsYXJlZEFnZSlcbiAgYXdhaXQgYWRvcHRTZXNzaW9uKHRva2VuLCBhY2NvdW50LCB0cnVlKVxufVxuXG4vKiogVHJ1ZSB3aGVuIHRoZSBjb25zb2xlJ3MgbG9nb3V0IGZvcm0gaXMgbmF2aWdhdGluZyBhd2F5LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNpZ25PdXQgKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBpZiAoY2VudHJhbExvZ2luRW5hYmxlZCgpKSB7XG4gICAgYXdhaXQgZHJvcFNlc3Npb24odHJ1ZSlcbiAgICBmb3JnZXRCcm93c2VyS2V5KClcbiAgICBzZXRBY3RpdmVDbG91ZFByaW50ZXIobnVsbClcbiAgICAvLyBPbiBhIHByaW50ZXIncyBvd24gYWRkcmVzcyB0aGUgc2Vzc2lvbiBpcyB0aGlzIHBhZ2UncyAoY2xpZW50XG4gICAgLy8gYHByaW50ZXItbG9jYWxgLCBhIHRva2VuIGluIG1lbW9yeSk7IHRoZSBjb25zb2xlJ3MgYnJvd3NlciBzZXNzaW9uIGlzXG4gICAgLy8gbm90LCBhbmQgdGhlIGNvbnNvbGUgcmVmdXNlcyBhIGxvZ291dCBwb3N0IGZyb20gaGVyZSAoS0FOLTI3NTYpLiBTb1xuICAgIC8vIG9ubHkgdGhpcyBwYWdlIHNpZ25zIG91dDsgXCJTaWduIGluXCIgc3RhcnRzIGEgZnJlc2ggL2F1dGhvcml6ZSB0cmlwLlxuICAgIGlmIChpc1ByaW50ZXJTZWN1cmVPcmlnaW4oKSkge1xuICAgICAgaG9sZFNpbGVudFNpZ25JbigpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgLy8gVGhlIGNvbnNvbGUgZW5kcyB0aGUgYnJvd3NlciBzZXNzaW9uIGFuZCBldmVyeSBzZXNzaW9uIGlzc3VlZCBmcm9tXG4gICAgLy8gaXQsIHRoaXMgb25lIGluY2x1ZGVkLCBhbmQgdGVsbHMgdGhlIG90aGVyIHN1cmZhY2VzLlxuICAgIHNpZ25PdXRDZW50cmFsKClcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHRyeSB7XG4gICAgYXdhaXQgY2xvdWRBcGkuc2lnbk91dCgpXG4gIH0gY2F0Y2ggeyAvKiB0aGUgc2Vzc2lvbiBlbmRzIGhlcmUgZWl0aGVyIHdheTsgb24gcGxhaW4gSFRUUCB0aGVyZSBpcyBub25lIGFuZCB0aGUgY2FsbCBpcyByZWZ1c2VkIHVuc2VudCAqLyB9XG4gIGF3YWl0IGRyb3BTZXNzaW9uKHRydWUpXG4gIGZvcmdldEJyb3dzZXJLZXkoKVxuICBzZXRBY3RpdmVDbG91ZFByaW50ZXIobnVsbClcbiAgcmV0dXJuIGZhbHNlXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYXZlTGF5b3V0IChsYXlvdXQ6IEZsZWV0TGF5b3V0KSB7XG4gIGxheW91dEVkaXRzKytcbiAgY2xvdWRTdGF0ZS5sYXlvdXQgPSBsYXlvdXRcbiAgLy8gQSA0MDEgaXMgcmV0cmllZCBvbmx5IGZvciB0aGUgYWNjb3VudCB0aGF0IG1hZGUgdGhlIGNoYW5nZSwgbmV2ZXIgd2l0aCB0aGUgbmV4dCBvbmUncyB0b2tlbi5cbiAgY29uc3Qgb3duZXIgPSBjbG91ZFN0YXRlLmFjY291bnQ/LmlkXG4gIHRyeSB7XG4gICAgYXdhaXQgY2xvdWRBcGkucHV0TGF5b3V0KGxheW91dCwgKCkgPT4gb3duZXIgIT09IHVuZGVmaW5lZCAmJiBjbG91ZFN0YXRlLmFjY291bnQ/LmlkID09PSBvd25lcilcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBBIHNhdmUgcmVmdXNlZCBmb3IgYW4gYWNjb3VudCB0aGF0IGhhcyBzaW5jZSBsZWZ0IGlzIG5vdCB0aGUgc2lnbmVkLWluIGFjY291bnQncyBlcnJvci5cbiAgICBpZiAoY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA9PT0gb3duZXIpIGNsb3VkU3RhdGUuZXJyb3IgPSAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2VcbiAgfVxufVxuXG4vKiogS2VwdCBpbiB0aGlzIGJyb3dzZXIgKG5hbWVzIGFuZCBFbmRwb2ludElkcyBvbmx5OiBubyBjb2RlcyBvciBrZXlzKSwgc28gYSByZWxvYWQgb2Ygc3VjaCBhIHByaW50ZXIncyBwYWdlIHN0aWxsIGZpbmRzIGl0LiAqL1xuY29uc3QgQkxVRVRPT1RIX09OTFlfU1RPUkFHRSA9ICdtdW9uLmJsZS5wcmludGVyLW5hbWVzJ1xuXG4vKipcbiAqIFByaW50ZXJzIG9wZW5lZCBvdmVyIEJsdWV0b290aCB0aGF0IG5vIGFjY291bnQgaG9sZHMgaGVyZSAobm9ib2R5IGlzIHNpZ25lZFxuICogaW4sIG9yIGl0IGlzIG5vdCBsaW5rZWQpOiB0aGVpciBuYW1lcyBieSBFbmRwb2ludElkLiBXaXRob3V0IGEgbmFtZSB0aGVcbiAqIG9wZW4gcHJpbnRlciBoYXMgbm8gcGFnZSBhZGRyZXNzLCBhbmQgdGhlIHBlcnNvbiBzdGF5cyBvbiB0aGUgbGlzdC5cbiAqL1xuZXhwb3J0IGNvbnN0IGJsdWV0b290aE9ubHkgPSBWdWUub2JzZXJ2YWJsZSh7IG5hbWVzOiBsb2FkQmx1ZXRvb3RoT25seSgpIH0pXG5cbmZ1bmN0aW9uIGxvYWRCbHVldG9vdGhPbmx5ICgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKEJMVUVUT09USF9PTkxZX1NUT1JBR0UpID8/ICd7fScpXG4gICAgaWYgKCFwYXJzZWQgfHwgdHlwZW9mIHBhcnNlZCAhPT0gJ29iamVjdCcpIHJldHVybiB7fVxuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMocGFyc2VkKS5maWx0ZXIoKFssIHZdKSA9PiB0eXBlb2YgdiA9PT0gJ3N0cmluZycpKSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7fVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1lbWJlckJsdWV0b290aE9ubHkgKGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykge1xuICBWdWUuc2V0KGJsdWV0b290aE9ubHkubmFtZXMsIGlkLCBuYW1lKVxuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEJMVUVUT09USF9PTkxZX1NUT1JBR0UsIEpTT04uc3RyaW5naWZ5KGJsdWV0b290aE9ubHkubmFtZXMpKVxuICB9IGNhdGNoIHsgLyogbm8gc3RvcmFnZTogdGhlIHBhZ2UgYWRkcmVzcyB3b3JrcyB1bnRpbCB0aGUgbmV4dCByZWxvYWQgKi8gfVxufVxuXG4vKiogVGhlIGFjY291bnQncyBwcmludGVycywgdGhlbiB0aG9zZSBvcGVuZWQgb3ZlciBCbHVldG9vdGggdGhhdCBpdCBkb2VzIG5vdCBob2xkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWNoYWJsZVByaW50ZXJzICgpOiBBcnJheTx7IGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZyB9PiB7XG4gIGNvbnN0IGV4dHJhID0gT2JqZWN0LmVudHJpZXMoYmx1ZXRvb3RoT25seS5uYW1lcylcbiAgICAuZmlsdGVyKChbaWRdKSA9PiAhY2xvdWRTdGF0ZS5wcmludGVycy5zb21lKHAgPT4gcC5pZCA9PT0gaWQpKVxuICAgIC5tYXAoKFtpZCwgbmFtZV0pID0+ICh7IGlkLCBuYW1lIH0pKVxuICByZXR1cm4gWy4uLmNsb3VkU3RhdGUucHJpbnRlcnMsIC4uLmV4dHJhXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJpbnRlck5hbWUgKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcmVhY2hhYmxlUHJpbnRlcnMoKS5maW5kKHAgPT4gcC5pZCA9PT0gaWQpPy5uYW1lID8/IGlkLnNsaWNlKDAsIDgpXG59XG4iXSwibWFwcGluZ3MiOiJBQU1BLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8sU0FBUztBQUNoQjtBQUFBLEVBQ0U7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BS0s7QUFDUCxTQUFTLGtC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