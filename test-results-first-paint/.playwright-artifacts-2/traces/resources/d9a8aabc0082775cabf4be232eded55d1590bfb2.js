import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import store from "/src/store/index.ts";
import { cloudApi } from "/src/services/muon-cloud/api.ts";
import { STATUS_QUERY, statusFrom } from "/src/services/muon-cloud/status.ts";
const COMMON_NETWORKS = [
  "192.168.1",
  "192.168.0",
  "10.0.0",
  "192.168.4",
  "192.168.68",
  "192.168.86",
  "192.168.2",
  "192.168.10",
  "10.0.1",
  "172.20.10",
  "192.168.43",
  "10.42.0"
];
const WINDOWS_HOTSPOT_NETWORK = "192.168.137";
const PROBE_TIMEOUT_MS = 3e3;
const ADDRESS_TIMEOUT_MS = 8e3;
const GATEWAY_TIMEOUT_MS = 1500;
const GATEWAY_ANSWERS_WITHIN_MS = 900;
const CONCURRENCY = 16;
const RANGE_PROBE_TIMEOUT_MS = 1500;
const FRESH_FOR_MS = 6e4;
export const discoveryState = Vue.observable({
  scanning: false,
  /** The network being swept now, for the progress line. */
  network: "",
  found: [],
  /** From the service, which works on an HTTPS page too. */
  cloud: [],
  cloudChecked: false,
  finishedAt: 0,
  /**
   * Set when this browser will not let this page reach printers by IP
   * address (`pageBlocksLanIpv4`), with the page's own printer by IP address
   * as the way round it.
   */
  blockedByPage: null
});
function nameKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
export function sameExactName(a, b) {
  const x = nameKey(a);
  return !!x && x === nameKey(b);
}
export function sameNamedPrinter(a, b) {
  const x = nameKey(a);
  const y = nameKey(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
}
export function sameLanPrinter(lan, printerId, name) {
  if (lan.endpointId) return lan.endpointId === printerId;
  return sameNamedPrinter(lan.name, name);
}
export async function refreshCloudNearby() {
  try {
    const { printers } = await cloudApi.nearby();
    discoveryState.cloud = printers.map((p) => ({
      printerId: p.printer_id,
      name: p.name,
      model: p.model,
      linked: !!p.linked,
      localAddrs: p.local_addrs ?? [],
      secureName: p.secure_name ?? null
    }));
    for (const p of discoveryState.cloud) foundThroughService(p).catch(() => {
    });
  } catch {
    discoveryState.cloud = [];
  } finally {
    discoveryState.cloudChecked = true;
  }
}
async function reachableFirst(printer) {
  const answers = await Promise.all(printer.localAddrs.map(async (host) => {
    try {
      await getJson(`${apiUrlFor(host)}/server/muon/identity`, {}, 2500);
      return true;
    } catch {
      return false;
    }
  }));
  const i = answers.indexOf(true);
  if (i < 0) return null;
  const current = discoveryState.cloud.find((c) => c.printerId === printer.printerId);
  if (current && i > 0) {
    const addrs = [...printer.localAddrs];
    const [host] = addrs.splice(i, 1);
    current.localAddrs = [host, ...addrs];
  }
  return printer.localAddrs[i];
}
async function foundThroughService(printer) {
  if (pageIsSecure()) return;
  if (discoveryState.found.some((l) => l.endpointId === printer.printerId)) return;
  const host = printer.localAddrs.length > 1 ? await reachableFirst(printer) : printer.localAddrs[0];
  if (!host || discoveryState.found.some((l) => l.endpointId === printer.printerId)) return;
  const found = await probe(host);
  if (found) remember(found);
}
export function mdnsHostFor(identity) {
  const name = typeof identity?.derived_name === "string" ? identity.derived_name.trim().toLowerCase() : "";
  const suffix = typeof identity?.suffix === "string" ? identity.suffix.trim().toLowerCase() : "";
  if (!/^[a-z]+$/.test(name) || !/^[0-9a-z]+$/.test(suffix)) return null;
  return `muon-${name}-${suffix}.local`;
}
export function pageOpenedByName(loc = location) {
  if (loc.protocol !== "http:") return false;
  const host = loc.hostname;
  return !isIpv4(host) && !host.includes(":") && !host.startsWith("[") && host !== "localhost";
}
async function ownIpv4() {
  try {
    const info = await getJson(`${location.origin}/machine/system_info`, {}, 2500);
    const network = info?.system_info?.network ?? {};
    const addresses = [];
    for (const iface of Object.values(network)) {
      for (const a of iface?.ip_addresses ?? []) {
        if (a?.family === "ipv4" && !a.is_link_local && typeof a.address === "string") addresses.push(a.address);
      }
    }
    return addresses.find((a) => !OWN_HOTSPOT.test(a)) ?? addresses[0] ?? null;
  } catch {
    return null;
  }
}
const REFUSED_WITHIN_MS = 250;
let blockCheck = null;
export function pageBlocksLanIpv4() {
  if (!pageOpenedByName()) return Promise.resolve(false);
  blockCheck ??= (async () => {
    const ip = await ownIpv4();
    if (!ip) return false;
    const started = performance.now();
    try {
      await getJson(`http://${ip}/server/muon/identity`, {}, 2500);
      return false;
    } catch (error) {
      const blocked = error instanceof TypeError && performance.now() - started < REFUSED_WITHIN_MS;
      if (blocked) discoveryState.blockedByPage = { ownUrl: `http://${ip}/` };
      return blocked;
    }
  })();
  return blockCheck;
}
export function resetPageBlockCheck() {
  blockCheck = null;
  discoveryState.blockedByPage = null;
}
let running = null;
export function pageIsSecure() {
  return location.protocol === "https:";
}
function isIpv4(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}
function hostOf(url) {
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}
export function lanFetch(url, init = {}) {
  const local = location.protocol === "https:" ? { targetAddressSpace: "local" } : {};
  return fetch(url, { ...init, ...local });
}
async function getJson(url, init = {}, timeout = PROBE_TIMEOUT_MS, signal) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  const stop = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", stop, { once: true });
  try {
    const response = await lanFetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    return body?.result ?? body;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}
function apiUrlFor(host) {
  return `http://${host}`;
}
export async function lanLinkStatus(apiUrl) {
  try {
    const s = await getJson(`${apiUrl}/server/muon/link`, {}, 3e3);
    return s && typeof s.phase === "string" ? s : { phase: "unsupported" };
  } catch (error) {
    return { phase: error instanceof Error && error.message === "HTTP 404" ? "unsupported" : "unreachable" };
  }
}
export async function probe(host, timeout = PROBE_TIMEOUT_MS, signal) {
  const apiUrl = apiUrlFor(host);
  let identity;
  try {
    identity = await getJson(`${apiUrl}/server/muon/identity`, {}, timeout, signal);
  } catch {
    return null;
  }
  if (signal?.aborted) return null;
  if (!identity || typeof identity !== "object") return null;
  const name = String(identity.display || identity.name || host);
  const endpointId = typeof identity.endpoint_id === "string" && identity.endpoint_id ? identity.endpoint_id : null;
  const mdnsHost = mdnsHostFor(identity);
  const [link, health] = await Promise.all([lanLinkStatus(apiUrl), printerHealth(apiUrl)]);
  const entry = identity.entry === "open" ? "open" : void 0;
  return { host, apiUrl, name, endpointId, mdnsHost, link, ...entry ? { entry } : {}, health: health ?? void 0 };
}
export async function printerHealth(apiUrl, timeout = PROBE_TIMEOUT_MS) {
  const checkedAt = Date.now();
  try {
    const result = await getJson(`${apiUrl}${STATUS_QUERY}`, {}, timeout);
    const webhooks = result?.status?.webhooks ?? {};
    const job = result?.status?.print_stats?.state;
    const status = { reachable: true, ...statusFrom(result?.status ?? {}), updatedAt: checkedAt };
    if (webhooks.state !== "ready") {
      return { state: "error", message: webhooks.state_message || `Klipper ${webhooks.state ?? "not running"}`, checkedAt, status };
    }
    if (job === "printing") return { state: "printing", checkedAt, status };
    if (job === "paused") return { state: "paused", checkedAt, status };
    if (job === "error") return { state: "error", message: "The last print stopped with an error", checkedAt, status };
    return { state: "ready", checkedAt, status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "HTTP 401" || message === "HTTP 403") return { state: "locked", checkedAt };
    if (/^HTTP 5\d\d$/.test(message)) return { state: "error", message: "Klipper is not running", checkedAt };
    return null;
  }
}
export function addressCandidates(input) {
  const host = input.trim().replace(/^[a-z]+:\/\//i, "").replace(/\/.*$/, "");
  if (!host) return [];
  const bare = !host.includes(".") && !host.includes(":") && host.toLowerCase() !== "localhost";
  return bare ? [host, `${host}.local`] : [host];
}
export async function probeAddress(input) {
  for (const host of addressCandidates(input)) {
    const printer = await probe(host, ADDRESS_TIMEOUT_MS);
    if (printer) return printer;
  }
  return null;
}
export async function pageCanReach(apiUrl, timeout = PROBE_TIMEOUT_MS) {
  return await pageReach(apiUrl, timeout) === "reached";
}
export async function pageReach(apiUrl, timeout = PROBE_TIMEOUT_MS) {
  if (location.protocol !== "https:" || !apiUrl.startsWith("http:")) return "reached";
  const controller = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);
  try {
    await lanFetch(`${apiUrl.replace(/\/+$/, "")}/server/info`, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
    return "reached";
  } catch {
    const permission = await localNetworkPermission();
    if (permission === "prompt") return "asking";
    if (timedOut || permission === "granted" && isPrivateIpv4(hostOf(apiUrl))) return "silent";
    return "blocked";
  } finally {
    window.clearTimeout(timer);
  }
}
function isPrivateIpv4(host) {
  return !!host && isIpv4(host) && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}
export async function localNetworkPermission() {
  for (const name of ["local-network-access", "local-network"]) {
    try {
      return (await navigator.permissions.query({ name })).state;
    } catch {
    }
  }
  return "unknown";
}
const OWN_HOTSPOT = /^10\.42\.0\.\d+$/;
export function isOwnHotspot(host) {
  return !!host && OWN_HOTSPOT.test(host);
}
export function nearbyHost(localAddrs) {
  return localAddrs.find((a) => !isOwnHotspot(a)) ?? null;
}
async function answersQuickly(host, signal) {
  const controller = new AbortController();
  const started = performance.now();
  const timer = window.setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  const stop = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", stop, { once: true });
  try {
    await lanFetch(`http://${host}/`, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
    return true;
  } catch {
    return !signal?.aborted && performance.now() - started < GATEWAY_ANSWERS_WITHIN_MS;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}
export function lanAddresses(printer) {
  return printer.aliases?.length ? printer.aliases : [printer.host];
}
function remember(printer) {
  const i = discoveryState.found.findIndex((p) => lanAddresses(p).includes(printer.host) || !!printer.endpointId && p.endpointId === printer.endpointId);
  if (i < 0) {
    discoveryState.found.push({ ...printer, aliases: [printer.host] });
    return;
  }
  const aliases = [.../* @__PURE__ */ new Set([...lanAddresses(discoveryState.found[i]), printer.host])];
  discoveryState.found.splice(i, 1, { ...printer, aliases });
}
function forget(host) {
  const i = discoveryState.found.findIndex((p) => lanAddresses(p).includes(host));
  if (i < 0) return;
  const printer = discoveryState.found[i];
  const aliases = lanAddresses(printer).filter((a) => a !== host);
  if (!aliases.length) discoveryState.found.splice(i, 1);
  else discoveryState.found.splice(i, 1, { ...printer, aliases, host: printer.host === host ? aliases[0] : printer.host });
}
async function pool(items, work, signal) {
  let next = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length && !signal?.aborted) {
      const item = items[next++];
      await work(item);
    }
  });
  await Promise.all(runners);
}
export function knownHosts(blocked = !!discoveryState.blockedByPage) {
  const instances = store.getters["config/getInstances"] ?? [];
  const hosts = instances.map((i) => {
    const host = hostOf(i.apiUrl);
    return blocked && host && isIpv4(host) ? i.mdnsHost ?? null : host;
  }).filter((h) => !!h && !h.endsWith(".invalid"));
  if (isIpv4(location.hostname) && location.hostname !== "127.0.0.1") hosts.push(location.hostname);
  return [...new Set(hosts)];
}
let sweepAbort = null;
let watching = false;
export function abortSweep() {
  sweepAbort?.abort();
}
function watchPage() {
  if (watching) return;
  watching = true;
  window.addEventListener("pagehide", abortSweep);
  store.subscribe?.((mutation) => {
    if (mutation.type === "socket/setSocketConnecting" && mutation.payload === true) abortSweep();
  });
}
async function sweep(controller) {
  const { signal } = controller;
  discoveryState.scanning = true;
  try {
    const blocked = await pageBlocksLanIpv4();
    const known = knownHosts(blocked);
    discoveryState.network = "printers you have added";
    await pool(known, async (host) => {
      const printer = await probe(host, PROBE_TIMEOUT_MS, signal);
      if (printer && !signal.aborted) remember(printer);
    }, signal);
    if (blocked || signal.aborted) return;
    const own = [...new Set(known.filter(isIpv4).map((h) => h.split(".").slice(0, 3).join(".")))];
    discoveryState.network = "this network";
    const answering = /* @__PURE__ */ new Set();
    const gateways = COMMON_NETWORKS.filter((n) => !own.includes(n)).flatMap((n) => [`${n}.1`, `${n}.254`]);
    await pool(gateways, async (host) => {
      if (await answersQuickly(host, signal)) answering.add(host.slice(0, host.lastIndexOf(".")));
    }, signal);
    if (signal.aborted) return;
    const networks = [.../* @__PURE__ */ new Set([
      ...own,
      ...COMMON_NETWORKS.filter((n) => answering.has(n)),
      WINDOWS_HOTSPOT_NETWORK
    ])];
    const seen = new Set(discoveryState.found.flatMap(lanAddresses));
    const hosts = [];
    for (const network of networks) {
      for (let i = 1; i < 255; i++) {
        const host = `${network}.${i}`;
        if (!seen.has(host)) hosts.push(host);
      }
    }
    await pool(hosts, async (host) => {
      discoveryState.network = `${host.slice(0, host.lastIndexOf("."))}.x`;
      const printer = await probe(host, RANGE_PROBE_TIMEOUT_MS, signal);
      if (printer && !signal.aborted) remember(printer);
    }, signal);
  } finally {
    if (sweepAbort === controller) {
      sweepAbort = null;
      discoveryState.scanning = false;
      discoveryState.network = "";
      if (!signal.aborted) discoveryState.finishedAt = Date.now();
    }
  }
}
export function discoverPrinters(force = false, { nearby = true } = {}) {
  if (pageIsSecure()) {
    discoveryState.finishedAt = Date.now();
    if (nearby || force) return refreshCloudNearby().catch(() => {
    });
    return Promise.resolve();
  }
  if (nearby) refreshCloudNearby().catch(() => {
  });
  if (running && !force) return running;
  if (!force && Date.now() - discoveryState.finishedAt < FRESH_FOR_MS) return Promise.resolve();
  watchPage();
  abortSweep();
  const controller = new AbortController();
  sweepAbort = controller;
  const mine = sweep(controller).finally(() => {
    if (running === mine) running = null;
  });
  running = mine;
  return mine;
}
let refreshing = null;
export async function refreshKnownPrinters() {
  if (pageIsSecure()) return;
  if (refreshing) return refreshing;
  if (running) return;
  const hosts = [.../* @__PURE__ */ new Set([...discoveryState.found.flatMap(lanAddresses), ...knownHosts()])];
  refreshing = pool(hosts, async (host) => {
    const printer = await probe(host);
    if (printer) remember(printer);
    else forget(host);
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}
export function lookForPrinters() {
  const nearby = refreshCloudNearby().catch(() => {
  });
  if (pageIsSecure()) return nearby;
  if (Date.now() - discoveryState.finishedAt < FRESH_FOR_MS) return nearby;
  const known = discoveryState.finishedAt ? refreshKnownPrinters() : discoverPrinters(false, { nearby: false });
  return Promise.all([nearby, known.catch(() => {
  })]).then(() => {
  });
}
let readingStatus = null;
export function refreshLanStatus() {
  if (pageIsSecure()) return Promise.resolve();
  if (readingStatus) return readingStatus;
  readingStatus = Promise.all(discoveryState.found.map(async (p) => {
    const health = await printerHealth(p.apiUrl);
    if (!health) return;
    const i = discoveryState.found.findIndex((f) => f.apiUrl === p.apiUrl);
    if (i >= 0) discoveryState.found.splice(i, 1, { ...discoveryState.found[i], health });
  })).then(() => {
  }).finally(() => {
    readingStatus = null;
  });
  return readingStatus;
}
export async function refreshLinkStates() {
  if (pageIsSecure()) return;
  await Promise.all(discoveryState.found.map(async (p) => {
    remember({ ...p, link: await lanLinkStatus(p.apiUrl) });
  }));
}
export async function showLanCode(apiUrl) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5e3);
  try {
    const response = await lanFetch(`${apiUrl}/server/muon/link/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: controller.signal
    });
    const body = await response.json().catch(() => null);
    if (response.status === 429) {
      throw new Error("The printer has been asked for a code too many times. Wait a minute, then try again.");
    }
    if (!response.ok) {
      throw new Error(body?.error?.message ?? `The printer refused to start linking (HTTP ${response.status}).`);
    }
    const status = body?.result ?? body;
    return status && typeof status.phase === "string" ? status : { phase: "connecting" };
  } finally {
    window.clearTimeout(timer);
  }
}
export function lanCodeOutcome(name, status) {
  switch (status.phase) {
    case "offer":
      return {
        note: `${name} is already asking on its screen whether to link to ${status.account || "an account"}. Accept or decline it there.`
      };
    case "linked":
      return { error: `${name} is already linked to an account. Its owner must unlink it first.` };
    default:
      return { note: `${name} is showing a code on its screen now. Type it below.` };
  }
}
export function instanceForHost(host, name, endpointId, mdnsHost) {
  return {
    name,
    apiUrl: apiUrlFor(host),
    socketUrl: `ws://${host}/websocket`,
    active: true,
    ...endpointId ? { endpointId } : {},
    ...mdnsHost && mdnsHost !== host ? { mdnsHost } : {}
  };
}
export function instanceFor(printer) {
  return instanceForHost(printer.host, printer.name, printer.endpointId, printer.mdnsHost);
}
export function lanLinkAvailability(link) {
  switch (link.phase) {
    case "unlinked":
      return { canShow: true, note: "not linked · show its code" };
    case "code":
      return { canShow: true, note: "showing a code on its screen now" };
    case "failed":
      return { canShow: true, note: link.message ? `last try failed: ${link.message}` : "last try failed · try again" };
    case "connecting":
      return { canShow: false, note: "getting a code from Muon3D…" };
    case "offer":
      return { canShow: false, note: "waiting for confirmation on its screen" };
    case "linked":
      return { canShow: false, note: "linked to an account · its owner must unlink it first" };
    case "unsupported":
      return { canShow: false, note: "its MuonOS does not include account linking yet" };
    case "unavailable":
      return { canShow: false, note: "not set up to link to a Muon3D account" };
    case "unreachable":
      return { canShow: false, note: "could not read its link status from this browser" };
    default:
      return { canShow: false, note: "cannot link from here right now" };
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpc2NvdmVyeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEZpbmRzIE11b24zRCBwcmludGVycyBvbiB0aGUgbmV0d29yayB0aGlzIGJyb3dzZXIgaXMgb24uXG4gKlxuICogQSBicm93c2VyIGNhbm5vdCBicm93c2UgbUROUywgc28gdGhpcyBhc2tzIGFkZHJlc3NlcyBkaXJlY3RseS4gRXZlcnkgTTFcbiAqIGFuc3dlcnMgYEdFVCAvc2VydmVyL211b24vaWRlbnRpdHlgIG9uIHBvcnQgODAuIFRoZSBzZWFyY2ggZ29lcyBpbiBvcmRlcjpcbiAqIHRoZSBwcmludGVycyBGbHVpZGQgYWxyZWFkeSBrbm93cywgdGhlbiB0aGUgLzI0IG5ldHdvcmtzIHRob3NlIHByaW50ZXJzIHNpdFxuICogb24sIHRoZW4gdGhlIGNvbW1vbiBob21lIG5ldHdvcmtzIHdob3NlIGdhdGV3YXkgKC4xIG9yIC4yNTQpIGFuc3dlcnNcbiAqIHF1aWNrbHksIHRoZW4gdGhlIFdpbmRvd3MgaG90c3BvdCBuZXR3b3JrLlxuICpcbiAqIEFuIGFkZHJlc3Mgbm9ib2R5IGhvbGRzIGFuZCBhbiBhZGRyZXNzIG9uIGEgbmV0d29yayB0aGUgYnJvd3NlciBoYXMgbm8gcm91dGVcbiAqIHRvIGJvdGgganVzdCB0aW1lIG91dCwgc28gb25seSBhIGdhdGV3YXkgdGhhdCBhbnN3ZXJzIHNheXMgdGhhdCBhIG5ldHdvcmsgaXNcbiAqIHRoZXJlLiBPbiBhIFdpbmRvd3MgaG90c3BvdCB0aGUgZ2F0ZXdheSBpcyB0aGlzIG1hY2hpbmUsIGFuZCBpdHMgZmlyZXdhbGxcbiAqIGRyb3BzIHRoZSBwcm9iZSwgc28gdGhhdCBuZXR3b3JrIGlzIHN3ZXB0IHdpdGhvdXQgdGhlIGNoZWNrLlxuICpcbiAqIFRoZSBzd2VlcCBpcyBwYWNlZC4gQ2hyb21pdW0gc2xvd3MgZG93biB3aGVuIGl0IGNhbmNlbHMgbWFueSBwZW5kaW5nXG4gKiBjb25uZWN0aW9ucyBhdCBvbmNlLiBBYm92ZSBhYm91dCAyNSBhIHNlY29uZCwgbGF0ZXIgcHJvYmVzIHdhaXQgaW4gaXRzIHF1ZXVlXG4gKiBwYXN0IHRoZWlyIG93biB0aW1lb3V0LCBhbmQgYSBwcmludGVyIHRoYXQgYW5zd2VycyBpbiA2MCBtcyBpcyBtaXNzZWQuXG4gKiBNZWFzdXJlZCBvbiAyMDI2LTA5LTIzOiA2NCBwcm9iZXMgYXQgYSB0aW1lIHdpdGggYSAzIHMgdGltZW91dCBmb3VuZCB0aGVcbiAqIHByaW50ZXIgZXZlcnkgdGltZS4gQXQgMC44IHMgb3IgMS41IHMgaXQgd2FzIG1pc3NlZC5cbiAqXG4gKiBBIHBhZ2Ugc2VydmVkIG92ZXIgSFRUUFMgbWF5IHVzZSBwbGFpbiBIVFRQIGFuZCBXZWJTb2NrZXRzIG9uIHRoZSBMQU4gb25seVxuICogaW4gQ2hyb21pdW0sIGFuZCBvbmx5IGFmdGVyIHRoZSBwZXJzb24gYWxsb3dzIFwibG9vayBmb3IgZGV2aWNlcyBvbiB5b3VyXG4gKiBsb2NhbCBuZXR3b3JrXCIuIENocm9tZSBhc2tzIG9uY2UsIGF0IHRoZSBmaXJzdCBsb2NhbCByZXF1ZXN0LiBNZWFzdXJlZCBvblxuICogMjAyNi0wOS0yNCBpbiBDaHJvbWUgMTUzIGZyb20gYXBwLm11b24zZC5jb206IGZldGNoIGFuZCB3czovLyB0byBhIHByaXZhdGVcbiAqIGFkZHJlc3MgYm90aCB3b3JrZWQsIHdpdGggb3Igd2l0aG91dCBgdGFyZ2V0QWRkcmVzc1NwYWNlOiAnbG9jYWwnYCwgc29cbiAqIEZsdWlkZCBjb25uZWN0cyB0byBhIHByaW50ZXIgb24gdGhlIExBTiBmcm9tIHRoZSBIVFRQUyBzaXRlIGFzIGl0IGRvZXNcbiAqIGZyb20gdGhlIHByaW50ZXIncyBvd24gcGFnZS4gVGhlIHN3ZWVwIHN0aWxsIGRlY2xhcmVzIGl0LiBPdGhlciBicm93c2Vyc1xuICogYmxvY2sgdGhvc2UgcmVxdWVzdHMgYXMgbWl4ZWQgY29udGVudCwgYW5kIHRoZSBzd2VlcCBmaW5kcyBub3RoaW5nIHRoZXJlLlxuICpcbiAqIFRoZSBNdW9uM0Qgc2VydmljZSBmaWxscyB0aGF0IGdhcCBpbiBhbnkgYnJvd3NlcjogaXQgbGlzdHMgdGhlIHByaW50ZXJzXG4gKiB0aGF0IGNvbm5lY3QgdG8gaXQgZnJvbSB0aGlzIGJyb3dzZXIncyBwdWJsaWMgYWRkcmVzc1xuICogKGByZWZyZXNoQ2xvdWROZWFyYnlgKSwgbGlua2VkIG9yIG5vdC5cbiAqL1xuaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgc3RvcmUgZnJvbSAnQC9zdG9yZSdcbmltcG9ydCB0eXBlIHsgSW5zdGFuY2VDb25maWcgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7IGNsb3VkQXBpIH0gZnJvbSAnLi9hcGknXG5pbXBvcnQgeyBTVEFUVVNfUVVFUlksIHN0YXR1c0Zyb20sIHR5cGUgUHJpbnRlclN0YXR1cyB9IGZyb20gJy4vc3RhdHVzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIExhbkxpbmtTdGF0dXMge1xuICAvKipcbiAgICogbXVvbi1saW5rJ3MgYExpbmtQaGFzZWAsIHBsdXMgdHdvIHRoaXMgYnJvd3NlciBhZGRzOiBgdW5zdXBwb3J0ZWRgIHdoZW5cbiAgICogdGhlIHByaW50ZXIncyBNb29ucmFrZXIgaGFzIG5vIGAvc2VydmVyL211b24vbGlua2AgKGl0cyBNdW9uT1MgcHJlZGF0ZXMgdGhlXG4gICAqIGFjY291bnQgbGluayksIGFuZCBgdW5yZWFjaGFibGVgIHdoZW4gdGhlIHN0YXR1cyBjb3VsZCBub3QgYmUgcmVhZCBhdCBhbGwuXG4gICAqL1xuICBwaGFzZTogJ3VuYXZhaWxhYmxlJyB8ICd1bmxpbmtlZCcgfCAnY29ubmVjdGluZycgfCAnY29kZScgfCAnb2ZmZXInIHwgJ2xpbmtlZCcgfCAnZmFpbGVkJyB8XG4gICAgJ3Vuc3VwcG9ydGVkJyB8ICd1bnJlYWNoYWJsZScgfCBzdHJpbmc7XG4gIGFjY291bnQ/OiBzdHJpbmc7XG4gIGNvZGU/OiBzdHJpbmc7XG4gIG1lc3NhZ2U/OiBzdHJpbmc7XG59XG5cbi8qKiBBIHByaW50ZXIgdGhlIE11b24zRCBzZXJ2aWNlIHNlZXMgYmVoaW5kIHRoaXMgYnJvd3NlcidzIHB1YmxpYyBhZGRyZXNzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbG91ZE5lYXJieVByaW50ZXIge1xuICBwcmludGVySWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogU29tZSBhY2NvdW50IGhhcyBsaW5rZWQgaXQ6IHRoaXMgb25lJ3MsIG9yIGFub3RoZXIncy4gKi9cbiAgbGlua2VkOiBib29sZWFuO1xuICAvKiogSXRzIGFkZHJlc3NlcyBvbiB0aGlzIG5ldHdvcmssIGZvciBvcGVuaW5nIGl0IGxvY2FsbHkuICovXG4gIGxvY2FsQWRkcnM6IHN0cmluZ1tdO1xuICAvKiogSXRzIG93biBIVFRQUyBuYW1lLCBgPGxhYmVsPi48em9uZT5gLCB3aGVuIGl0IGhvbGRzIGEgY2VydGlmaWNhdGUgKEtBTi01NDU5KS4gQWJzZW50IGZyb20gYW4gb2xkZXIgY29uc29sZS4gKi9cbiAgc2VjdXJlTmFtZT86IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGFuUHJpbnRlciB7XG4gIC8qKiBUaGUgYWRkcmVzcyB0aGUgcHJpbnRlciBhbnN3ZXJlZCBvbiBsYXN0LiAqL1xuICBob3N0OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBFdmVyeSBhZGRyZXNzIGl0IGFuc3dlcmVkIG9uIGluIHRoaXMgc2VhcmNoOiBhbiBJUCwgaXRzIG5hbWUsIGl0cyBuYW1lXG4gICAqIHdpdGggYC5sb2NhbGAuIEEgc2F2ZWQgcHJpbnRlciBtYXRjaGVzIG9uIGFueSBvZiB0aGVtLlxuICAgKi9cbiAgYWxpYXNlcz86IHN0cmluZ1tdO1xuICAvKiogV2hhdCBGbHVpZGQgY29ubmVjdHMgdG8gZm9yIHRoaXMgcHJpbnRlci4gKi9cbiAgYXBpVXJsOiBzdHJpbmc7XG4gIC8qKiBcIkJveHdvb2QgwrcgMzY3QVwiLiAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgSXJvaCBFbmRwb2ludElkIGl0IHB1Ymxpc2hlcyAoS0FOLTQwMyksIG9yIG51bGwgZnJvbSBvbGRlciBzb2Z0d2FyZS5cbiAgICogVGhlIHNlcnZpY2UgbmFtZXMgYSBwcmludGVyIGJ5IHRoZSBzYW1lIGlkLCBzbyB0aGlzIGlzIHdoYXQgam9pbnMgYVxuICAgKiBwcmludGVyIGZvdW5kIGhlcmUgdG8gdGhlIG9uZSBpbiB0aGUgYWNjb3VudC4gSXQgaXMgYSBtYXRjaCBrZXksIG5vdFxuICAgKiBwcm9vZjogdGhlIElyb2ggaGFuZHNoYWtlIHByb3ZlcyB0aGUga2V5IHdoZW4gdGhlIHByaW50ZXIgaXMgb3BlbmVkXG4gICAqIHRocm91Z2ggdGhlIHNlcnZpY2UuXG4gICAqL1xuICBlbmRwb2ludElkOiBzdHJpbmcgfCBudWxsO1xuICAvKipcbiAgICogSXRzIG93biBgLmxvY2FsYCBuYW1lLCBgbXVvbi1ib3h3b29kLTM2N2EubG9jYWxgLCB3b3JrZWQgb3V0IGZyb20gd2hhdCBpdFxuICAgKiByZXBvcnRzIGFib3V0IGl0c2VsZi4gQSBndWVzcyB1bnRpbCBpdCBhbnN3ZXJzIHRoZXJlOiBhIHByaW50ZXIgdGhhdFxuICAgKiBwcmVkYXRlcyB0aGUgbmFtaW5nIHJ1bGUgKEtBTi0zNTcpIGhhcyBhbm90aGVyIGhvc3RuYW1lLlxuICAgKi9cbiAgbWRuc0hvc3Q/OiBzdHJpbmcgfCBudWxsO1xuICBsaW5rOiBMYW5MaW5rU3RhdHVzO1xuICAvKiogV2hhdCB0aGUgcHJpbnRlciBzYXlzIG9mIGhvdyBpdCBsZXRzIHN0cmFuZ2VycyBpbiAoRC0xNjYpOyBvbmx5IHRoZSBleGFjdCB3b3JkIFwib3BlblwiIGNvdW50cy4gKi9cbiAgZW50cnk/OiAnb3BlbicgfCAncHJvdGVjdGVkJztcbiAgLyoqIEhvdyBpdCBhbnN3ZXJlZCB0aGUgbGFzdCBoZWFsdGggY2hlY2ssIHdoZW4gaXQgd2FzIGFza2VkLiAqL1xuICBoZWFsdGg/OiBMYW5IZWFsdGg7XG59XG5cbi8qKlxuICogQSBwcmludGVyJ3Mgc3RhdGUgYXMgcmVhZCBvdmVyIHRoZSBuZXR3b3JrOlxuICogLSBgcmVhZHlgLCBgcHJpbnRpbmdgLCBgcGF1c2VkYDogS2xpcHBlciBpcyBydW5uaW5nLlxuICogLSBgZXJyb3JgOiBLbGlwcGVyIGlzIHNodXQgZG93biwgaW4gZXJyb3Igb3Igc3RpbGwgc3RhcnRpbmcuXG4gKiAtIGBsb2NrZWRgOiBpdCBhbnN3ZXJlZCwgYnV0IHdhbnRzIGEgc2lnbi1pbiBvciByZWZ1c2VkIHRoaXMgYnJvd3Nlci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMYW5IZWFsdGgge1xuICBzdGF0ZTogJ3JlYWR5JyB8ICdwcmludGluZycgfCAncGF1c2VkJyB8ICdlcnJvcicgfCAnbG9ja2VkJztcbiAgbWVzc2FnZT86IHN0cmluZztcbiAgY2hlY2tlZEF0OiBudW1iZXI7XG4gIC8qKlxuICAgKiBFdmVyeXRoaW5nIGl0cyBjYXJkIHNob3dzLCByZWFkIGluIHRoZSBzYW1lIHJlcXVlc3Q6IHRoZSBqb2IsIHByb2dyZXNzLFxuICAgKiB0ZW1wZXJhdHVyZXMgYW5kIHdoYXQncyBsb2FkZWQuIEFic2VudCB3aGVuIHRoZSBwcmludGVyIHJlZnVzZWQuXG4gICAqL1xuICBzdGF0dXM/OiBQcmludGVyU3RhdHVzO1xufVxuXG4vKiogTmV0d29ya3Mgd29ydGggdHJ5aW5nIHdoZW4gbm90aGluZyBlbHNlIHNheXMgd2hlcmUgdGhlIHByaW50ZXJzIGFyZS4gKi9cbmNvbnN0IENPTU1PTl9ORVRXT1JLUyA9IFtcbiAgJzE5Mi4xNjguMScsICcxOTIuMTY4LjAnLCAnMTAuMC4wJywgJzE5Mi4xNjguNCcsICcxOTIuMTY4LjY4JywgJzE5Mi4xNjguODYnLFxuICAnMTkyLjE2OC4yJywgJzE5Mi4xNjguMTAnLCAnMTAuMC4xJywgJzE3Mi4yMC4xMCcsICcxOTIuMTY4LjQzJywgJzEwLjQyLjAnXG5dXG5cbi8qKiBXaW5kb3dzIE1vYmlsZSBIb3RzcG90IGFsd2F5cyB1c2VzIHRoaXMgbmV0d29yaywgd2l0aCB0aGlzIG1hY2hpbmUgYXMgLjEuICovXG5jb25zdCBXSU5ET1dTX0hPVFNQT1RfTkVUV09SSyA9ICcxOTIuMTY4LjEzNydcblxuY29uc3QgUFJPQkVfVElNRU9VVF9NUyA9IDMwMDBcbmNvbnN0IEFERFJFU1NfVElNRU9VVF9NUyA9IDgwMDBcbmNvbnN0IEdBVEVXQVlfVElNRU9VVF9NUyA9IDE1MDBcbmNvbnN0IEdBVEVXQVlfQU5TV0VSU19XSVRISU5fTVMgPSA5MDBcbi8qKlxuICogQXQgbW9zdCB0aGlzIG1hbnkgcHJvYmVzIGFyZSBpbiBmbGlnaHQgYXQgb25jZS4gQSBzaWxlbnQgYWRkcmVzcyAocGFja2V0XG4gKiBkcm9wcGVkLCBubyByZWZ1c2FsKSBob2xkcyBpdHMgc29ja2V0IHVudGlsIHRoZSB0aW1lb3V0LCBhbmQgdGhlIGJyb3dzZXJcbiAqIGhhcyBhYm91dCAyNTYgc29ja2V0cyBmb3IgdGhlIHdob2xlIHBhZ2U6IDY0IHNpbGVudCBwcm9iZXMgYXQgYSB0aW1lLCBvdmVyXG4gKiAyODAgYWRkcmVzc2VzLCBzdGFydmVkIHRoZSBwYWdlJ3Mgb3duIHJlcXVlc3RzIHRvIHRoZSBwcmludGVyIChLQU4tMjcyNCkuXG4gKi9cbmNvbnN0IENPTkNVUlJFTkNZID0gMTZcbi8qKlxuICogSG93IGxvbmcgb25lIGFkZHJlc3Mgb2YgdGhlIHJhbmdlIHN3ZWVwIGdldHMuIEEgTXVvbiBwcmludGVyIG9uIHRoZSBzYW1lXG4gKiBuZXR3b3JrIGFuc3dlcnMgaXRzIGlkZW50aXR5IGluIHdlbGwgdW5kZXIgYSBzZWNvbmQ7IHRoZSBwcmludGVycyBhbHJlYWR5XG4gKiBzYXZlZCBrZWVwIHRoZSBsb25nZXIgYFBST0JFX1RJTUVPVVRfTVNgLlxuICovXG5jb25zdCBSQU5HRV9QUk9CRV9USU1FT1VUX01TID0gMTUwMFxuY29uc3QgRlJFU0hfRk9SX01TID0gNjBfMDAwXG5cbmV4cG9ydCBjb25zdCBkaXNjb3ZlcnlTdGF0ZSA9IFZ1ZS5vYnNlcnZhYmxlKHtcbiAgc2Nhbm5pbmc6IGZhbHNlLFxuICAvKiogVGhlIG5ldHdvcmsgYmVpbmcgc3dlcHQgbm93LCBmb3IgdGhlIHByb2dyZXNzIGxpbmUuICovXG4gIG5ldHdvcms6ICcnIGFzIHN0cmluZyxcbiAgZm91bmQ6IFtdIGFzIExhblByaW50ZXJbXSxcbiAgLyoqIEZyb20gdGhlIHNlcnZpY2UsIHdoaWNoIHdvcmtzIG9uIGFuIEhUVFBTIHBhZ2UgdG9vLiAqL1xuICBjbG91ZDogW10gYXMgQ2xvdWROZWFyYnlQcmludGVyW10sXG4gIGNsb3VkQ2hlY2tlZDogZmFsc2UsXG4gIGZpbmlzaGVkQXQ6IDAsXG4gIC8qKlxuICAgKiBTZXQgd2hlbiB0aGlzIGJyb3dzZXIgd2lsbCBub3QgbGV0IHRoaXMgcGFnZSByZWFjaCBwcmludGVycyBieSBJUFxuICAgKiBhZGRyZXNzIChgcGFnZUJsb2Nrc0xhbklwdjRgKSwgd2l0aCB0aGUgcGFnZSdzIG93biBwcmludGVyIGJ5IElQIGFkZHJlc3NcbiAgICogYXMgdGhlIHdheSByb3VuZCBpdC5cbiAgICovXG4gIGJsb2NrZWRCeVBhZ2U6IG51bGwgYXMgeyBvd25Vcmw6IHN0cmluZyB8IG51bGwgfSB8IG51bGxcbn0pXG5cbi8qKiBMZXR0ZXJzIGFuZCBkaWdpdHMgb25seSwgbG93ZXIgY2FzZTogXCJCb3h3b29kIMK3IDM2N0FcIiBhbmQgXCJNdW9uLWJveHdvb2QtMzY3YVwiIGJvdGggY29udGFpbiBcImJveHdvb2QzNjdhXCIuICovXG5mdW5jdGlvbiBuYW1lS2V5IChuYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0vZywgJycpXG59XG5cbi8qKlxuICogV2hldGhlciB0d28gbmFtZXMgYXJlIHRoZSBzYW1lIHByaW50ZXIncyBkaXNwbGF5IG5hbWUsIGxldHRlciBmb3IgbGV0dGVyXG4gKiAoXCJCb3h3b29kIMK3IDM2N0FcIiBhbmQgXCJib3h3b29kLTM2N2FcIikuIFN0cmljdGVyIHRoYW4gYHNhbWVOYW1lZFByaW50ZXJgOlxuICogdGhlIGRpc3BsYXkgbmFtZSBjYXJyaWVzIHRoZSBzZXJpYWwgc3VmZml4LCBzbyBhbiBleGFjdCBtYXRjaCBpcyBzYWZlXG4gKiBlbm91Z2ggdG8gdGllIGFuIG9sZCBzYXZlZCBlbnRyeSB3aXRoIG5vIEVuZHBvaW50SWQgdG8gaXRzIHByaW50ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW1lRXhhY3ROYW1lIChhOiBzdHJpbmcsIGI6IHN0cmluZykge1xuICBjb25zdCB4ID0gbmFtZUtleShhKVxuICByZXR1cm4gISF4ICYmIHggPT09IG5hbWVLZXkoYilcbn1cblxuLyoqIFdoZXRoZXIgYSBwcmludGVyIGZvdW5kIG9uIHRoZSBMQU4gaXMgdGhlIHNhbWUgb25lIHRoZSBzZXJ2aWNlIHJlcG9ydGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbWVOYW1lZFByaW50ZXIgKGE6IHN0cmluZywgYjogc3RyaW5nKSB7XG4gIGNvbnN0IHggPSBuYW1lS2V5KGEpXG4gIGNvbnN0IHkgPSBuYW1lS2V5KGIpXG4gIHJldHVybiAhIXggJiYgISF5ICYmICh4LmluY2x1ZGVzKHkpIHx8IHkuaW5jbHVkZXMoeCkpXG59XG5cbi8qKlxuICogV2hldGhlciBhIHByaW50ZXIgZm91bmQgb24gdGhlIExBTiBpcyB0aGUgb25lIHRoZSBzZXJ2aWNlIG5hbWVzIGBwcmludGVySWRgXG4gKiAoYWxzbyBjYWxsZWQgYG5hbWVgKS4gVGhlIEVuZHBvaW50SWQgZGVjaWRlcyB3aGVuIHRoZSBwcmludGVyIHB1Ymxpc2hlZFxuICogb25lOyB0aGUgbmFtZSBpcyB0aGUgZmFsbGJhY2sgZm9yIHNvZnR3YXJlIHRoYXQgcHJlZGF0ZXMgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW1lTGFuUHJpbnRlciAobGFuOiBMYW5QcmludGVyLCBwcmludGVySWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gIGlmIChsYW4uZW5kcG9pbnRJZCkgcmV0dXJuIGxhbi5lbmRwb2ludElkID09PSBwcmludGVySWRcbiAgcmV0dXJuIHNhbWVOYW1lZFByaW50ZXIobGFuLm5hbWUsIG5hbWUpXG59XG5cbi8qKiBBc2tzIHRoZSBNdW9uM0Qgc2VydmljZSB3aGljaCBwcmludGVycywgbGlua2VkIG9yIG5vdCwgc2hhcmUgdGhpcyBicm93c2VyJ3MgbmV0d29yay4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWZyZXNoQ2xvdWROZWFyYnkgKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHsgcHJpbnRlcnMgfSA9IGF3YWl0IGNsb3VkQXBpLm5lYXJieSgpXG4gICAgZGlzY292ZXJ5U3RhdGUuY2xvdWQgPSBwcmludGVycy5tYXAocCA9PiAoe1xuICAgICAgcHJpbnRlcklkOiBwLnByaW50ZXJfaWQsXG4gICAgICBuYW1lOiBwLm5hbWUsXG4gICAgICBtb2RlbDogcC5tb2RlbCxcbiAgICAgIGxpbmtlZDogISFwLmxpbmtlZCxcbiAgICAgIGxvY2FsQWRkcnM6IHAubG9jYWxfYWRkcnMgPz8gW10sXG4gICAgICBzZWN1cmVOYW1lOiBwLnNlY3VyZV9uYW1lID8/IG51bGxcbiAgICB9KSlcbiAgICBmb3IgKGNvbnN0IHAgb2YgZGlzY292ZXJ5U3RhdGUuY2xvdWQpIGZvdW5kVGhyb3VnaFNlcnZpY2UocCkuY2F0Y2goKCkgPT4ge30pXG4gIH0gY2F0Y2gge1xuICAgIGRpc2NvdmVyeVN0YXRlLmNsb3VkID0gW11cbiAgfSBmaW5hbGx5IHtcbiAgICBkaXNjb3ZlcnlTdGF0ZS5jbG91ZENoZWNrZWQgPSB0cnVlXG4gIH1cbn1cblxuLyoqXG4gKiBQdXRzIHRoZSBhZGRyZXNzIHRoaXMgYnJvd3NlciBjYW4gcmVhY2ggZmlyc3QuIEEgcHJpbnRlciByZXBvcnRzIGV2ZXJ5XG4gKiBhZGRyZXNzIGl0IGhvbGRzLCBhbmQgdGhhdCBpbmNsdWRlcyBpdHMgb3duIGhvdHNwb3QgKDEwLjQyLjAuMSBvbiBhbiBNMSksXG4gKiB3aGljaCBvbmx5IGEgZGV2aWNlIGpvaW5lZCB0byB0aGF0IGhvdHNwb3QgY2FuIHVzZS4gTWVhc3VyZWQgb24gYm94d29vZCxcbiAqIDIwMjYtMDktMjQ6IHRoZSBob3RzcG90IGFkZHJlc3MgY2FtZSBmaXJzdC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVhY2hhYmxlRmlyc3QgKHByaW50ZXI6IENsb3VkTmVhcmJ5UHJpbnRlcik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBjb25zdCBhbnN3ZXJzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJpbnRlci5sb2NhbEFkZHJzLm1hcChhc3luYyBob3N0ID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZ2V0SnNvbihgJHthcGlVcmxGb3IoaG9zdCl9L3NlcnZlci9tdW9uL2lkZW50aXR5YCwge30sIDI1MDApXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9KSlcbiAgY29uc3QgaSA9IGFuc3dlcnMuaW5kZXhPZih0cnVlKVxuICBpZiAoaSA8IDApIHJldHVybiBudWxsXG4gIGNvbnN0IGN1cnJlbnQgPSBkaXNjb3ZlcnlTdGF0ZS5jbG91ZC5maW5kKGMgPT4gYy5wcmludGVySWQgPT09IHByaW50ZXIucHJpbnRlcklkKVxuICBpZiAoY3VycmVudCAmJiBpID4gMCkge1xuICAgIGNvbnN0IGFkZHJzID0gWy4uLnByaW50ZXIubG9jYWxBZGRyc11cbiAgICBjb25zdCBbaG9zdF0gPSBhZGRycy5zcGxpY2UoaSwgMSlcbiAgICBjdXJyZW50LmxvY2FsQWRkcnMgPSBbaG9zdCwgLi4uYWRkcnNdXG4gIH1cbiAgcmV0dXJuIHByaW50ZXIubG9jYWxBZGRyc1tpXVxufVxuXG4vKipcbiAqIEEgcHJpbnRlciB0aGUgc2VydmljZSBzYXlzIHNoYXJlcyB0aGlzIG5ldHdvcmssIHJlYWQgYXQgb25jZSByYXRoZXIgdGhhblxuICogd2hlbiB0aGUgc3dlZXAgcmVhY2hlcyBpdHMgbmV0d29yayAodXAgdG8gaGFsZiBhIG1pbnV0ZSBsYXRlcik6IGl0cyBjYXJkXG4gKiB0aGVuIHNheXMgd2hhdCBpdCBpcyBkb2luZyBzdHJhaWdodCBhd2F5ICgxNCBPY3QgMjAyNjogV2FsbnV0LCBwcmludGluZyxcbiAqIHNob3dlZCBvbmx5IGl0cyBuYW1lIHVudGlsIGl0IHdhcyBvcGVuZWQpLlxuICovXG5hc3luYyBmdW5jdGlvbiBmb3VuZFRocm91Z2hTZXJ2aWNlIChwcmludGVyOiBDbG91ZE5lYXJieVByaW50ZXIpIHtcbiAgaWYgKHBhZ2VJc1NlY3VyZSgpKSByZXR1cm5cbiAgaWYgKGRpc2NvdmVyeVN0YXRlLmZvdW5kLnNvbWUobCA9PiBsLmVuZHBvaW50SWQgPT09IHByaW50ZXIucHJpbnRlcklkKSkgcmV0dXJuXG4gIGNvbnN0IGhvc3QgPSBwcmludGVyLmxvY2FsQWRkcnMubGVuZ3RoID4gMSA/IGF3YWl0IHJlYWNoYWJsZUZpcnN0KHByaW50ZXIpIDogcHJpbnRlci5sb2NhbEFkZHJzWzBdXG4gIGlmICghaG9zdCB8fCBkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5zb21lKGwgPT4gbC5lbmRwb2ludElkID09PSBwcmludGVyLnByaW50ZXJJZCkpIHJldHVyblxuICBjb25zdCBmb3VuZCA9IGF3YWl0IHByb2JlKGhvc3QpXG4gIGlmIChmb3VuZCkgcmVtZW1iZXIoZm91bmQpXG59XG5cbi8qKlxuICogQSBwcmludGVyJ3Mgb3duIGAubG9jYWxgIG5hbWUgZnJvbSB0aGUgcGFydHMgYC9zZXJ2ZXIvbXVvbi9pZGVudGl0eWBcbiAqIHJlcG9ydHMuIFRoZSBob3N0bmFtZSBpcyBgTXVvbi08bmFtZT4tPHN1ZmZpeD5gLCBidWlsdCBmcm9tIHRoZSBzZXJpYWwgYnlcbiAqIHRoZSBzYW1lIHJ1bGUgYXMgdGhlIG5hbWUgKEtBTi0zNTcpLCBzbyBpdCBzdGF5cyBwdXQgd2hlbiB0aGUgb3duZXIgcmVuYW1lc1xuICogdGhlIHByaW50ZXI6IGBkZXJpdmVkX25hbWVgIGlzIHRoZSBzZXJpYWwncyBuYW1lLCBub3QgdGhlIG93bmVyJ3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZG5zSG9zdEZvciAoaWRlbnRpdHk6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBuYW1lID0gdHlwZW9mIGlkZW50aXR5Py5kZXJpdmVkX25hbWUgPT09ICdzdHJpbmcnID8gaWRlbnRpdHkuZGVyaXZlZF9uYW1lLnRyaW0oKS50b0xvd2VyQ2FzZSgpIDogJydcbiAgY29uc3Qgc3VmZml4ID0gdHlwZW9mIGlkZW50aXR5Py5zdWZmaXggPT09ICdzdHJpbmcnID8gaWRlbnRpdHkuc3VmZml4LnRyaW0oKS50b0xvd2VyQ2FzZSgpIDogJydcbiAgaWYgKCEvXlthLXpdKyQvLnRlc3QobmFtZSkgfHwgIS9eWzAtOWEtel0rJC8udGVzdChzdWZmaXgpKSByZXR1cm4gbnVsbFxuICByZXR1cm4gYG11b24tJHtuYW1lfS0ke3N1ZmZpeH0ubG9jYWxgXG59XG5cbi8qKlxuICogV2hldGhlciB0aGlzIHBhZ2Ugd2FzIG9wZW5lZCBieSBhIG5hbWUgKGBtdW9uLWJveHdvb2QtMzY3YS5sb2NhbGApIG92ZXJcbiAqIHBsYWluIEhUVFAuIFRoYXQgbmFtZSBjYW4gcmVzb2x2ZSB0byB0aGUgcHJpbnRlcidzIGdsb2JhbCBJUHY2IGFkZHJlc3MsIGFuZFxuICogQ2hyb21lIHRoZW4gdHJlYXRzIHRoZSBwYWdlIGFzIHB1YmxpYyBhbmQgcmVmdXNlcywgYmVmb3JlIGFueXRoaW5nIGlzIHNlbnQsXG4gKiBldmVyeSByZXF1ZXN0IGl0IG1ha2VzIHRvIGEgcHJpdmF0ZSBJUHY0IGFkZHJlc3MsIHN1Y2ggYXMgYW5vdGhlciBwcmludGVyJ3NcbiAqIChgRVJSX0JMT0NLRURfQllfTE9DQUxfTkVUV09SS19BQ0NFU1NfQ0hFQ0tTYCkuIFJlYWNoaW5nIHRoZSBvdGhlciBwcmludGVyXG4gKiBieSBpdHMgb3duIGAubG9jYWxgIG5hbWUgc3RpbGwgd29ya3M6IHB1YmxpYyB0byBwdWJsaWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYWdlT3BlbmVkQnlOYW1lIChsb2M6IHsgcHJvdG9jb2w6IHN0cmluZywgaG9zdG5hbWU6IHN0cmluZyB9ID0gbG9jYXRpb24pOiBib29sZWFuIHtcbiAgaWYgKGxvYy5wcm90b2NvbCAhPT0gJ2h0dHA6JykgcmV0dXJuIGZhbHNlXG4gIGNvbnN0IGhvc3QgPSBsb2MuaG9zdG5hbWVcbiAgcmV0dXJuICFpc0lwdjQoaG9zdCkgJiYgIWhvc3QuaW5jbHVkZXMoJzonKSAmJiAhaG9zdC5zdGFydHNXaXRoKCdbJykgJiYgaG9zdCAhPT0gJ2xvY2FsaG9zdCdcbn1cblxuLyoqIFRoZSBwYWdlJ3Mgb3duIHByaW50ZXIncyBwcml2YXRlIElQdjQgYWRkcmVzcywgZnJvbSBpdHMgTW9vbnJha2VyLiAqL1xuYXN5bmMgZnVuY3Rpb24gb3duSXB2NCAoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgaW5mbyA9IGF3YWl0IGdldEpzb24oYCR7bG9jYXRpb24ub3JpZ2lufS9tYWNoaW5lL3N5c3RlbV9pbmZvYCwge30sIDI1MDApXG4gICAgY29uc3QgbmV0d29yayA9IGluZm8/LnN5c3RlbV9pbmZvPy5uZXR3b3JrID8/IHt9XG4gICAgY29uc3QgYWRkcmVzc2VzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBpZmFjZSBvZiBPYmplY3QudmFsdWVzPGFueT4obmV0d29yaykpIHtcbiAgICAgIGZvciAoY29uc3QgYSBvZiBpZmFjZT8uaXBfYWRkcmVzc2VzID8/IFtdKSB7XG4gICAgICAgIGlmIChhPy5mYW1pbHkgPT09ICdpcHY0JyAmJiAhYS5pc19saW5rX2xvY2FsICYmIHR5cGVvZiBhLmFkZHJlc3MgPT09ICdzdHJpbmcnKSBhZGRyZXNzZXMucHVzaChhLmFkZHJlc3MpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhZGRyZXNzZXMuZmluZChhID0+ICFPV05fSE9UU1BPVC50ZXN0KGEpKSA/PyBhZGRyZXNzZXNbMF0gPz8gbnVsbFxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbi8qKiBBIHJlcXVlc3QgdGhlIGJyb3dzZXIgcmVmdXNlZCB0aGlzIGZhc3Qgd2FzIG5ldmVyIHNlbnQuICovXG5jb25zdCBSRUZVU0VEX1dJVEhJTl9NUyA9IDI1MFxuXG5sZXQgYmxvY2tDaGVjazogUHJvbWlzZTxib29sZWFuPiB8IG51bGwgPSBudWxsXG5cbi8qKlxuICogV2hldGhlciB0aGlzIGJyb3dzZXIgcmVmdXNlcyB0aGlzIHBhZ2UgZXZlcnkgcmVxdWVzdCB0byBhIHByaXZhdGUgSVB2NFxuICogYWRkcmVzcy4gQXNrZWQgb25jZSwgb2YgdGhlIG9uZSBwcmludGVyIGNlcnRhaW4gdG8gYmUgdGhlcmU6IHRoZSBvbmUgdGhhdFxuICogc2VydmVkIHRoZSBwYWdlLCBhdCBpdHMgb3duIElQdjQgYWRkcmVzcy4gTWVhc3VyZWQgaW4gQ2hyb21lIDE1NCBvblxuICogMjAyNi0xMC0wOTogcmVmdXNlZCBpbiAzLTQgbXMsIHdoaWxlIHRoZSBzYW1lIHByaW50ZXIgYW5zd2VyZWQgYnkgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhZ2VCbG9ja3NMYW5JcHY0ICgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgaWYgKCFwYWdlT3BlbmVkQnlOYW1lKCkpIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpXG4gIGJsb2NrQ2hlY2sgPz89IChhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgaXAgPSBhd2FpdCBvd25JcHY0KClcbiAgICBpZiAoIWlwKSByZXR1cm4gZmFsc2VcbiAgICBjb25zdCBzdGFydGVkID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZ2V0SnNvbihgaHR0cDovLyR7aXB9L3NlcnZlci9tdW9uL2lkZW50aXR5YCwge30sIDI1MDApXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgYmxvY2tlZCA9IGVycm9yIGluc3RhbmNlb2YgVHlwZUVycm9yICYmIHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZCA8IFJFRlVTRURfV0lUSElOX01TXG4gICAgICBpZiAoYmxvY2tlZCkgZGlzY292ZXJ5U3RhdGUuYmxvY2tlZEJ5UGFnZSA9IHsgb3duVXJsOiBgaHR0cDovLyR7aXB9L2AgfVxuICAgICAgcmV0dXJuIGJsb2NrZWRcbiAgICB9XG4gIH0pKClcbiAgcmV0dXJuIGJsb2NrQ2hlY2tcbn1cblxuLyoqIEZvcmdldHMgdGhlIGFuc3dlciwgZm9yIHRlc3RzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0UGFnZUJsb2NrQ2hlY2sgKCkge1xuICBibG9ja0NoZWNrID0gbnVsbFxuICBkaXNjb3ZlcnlTdGF0ZS5ibG9ja2VkQnlQYWdlID0gbnVsbFxufVxuXG5sZXQgcnVubmluZzogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsXG5cbi8qKlxuICogV2hldGhlciB0aGlzIHBhZ2Ugd2FzIHNlcnZlZCBvdmVyIGh0dHBzICh0aGUgaG9zdGVkIHNpdGUpLiBTdWNoIGEgcGFnZSBtdXN0XG4gKiBuZXZlciBmZXRjaCBgaHR0cDovL2AgYnkgaXRzZWxmOiBldmVyeSByZXF1ZXN0IHRvIGEgcHJpdmF0ZSBhZGRyZXNzIGlzIG1peGVkXG4gKiBjb250ZW50LCBhbmQgQ2hyb21lIGRyb3BzIHRoZSBsb2NrIChcIk5vdCBzZWN1cmVcIiwgSS0xMzQ6IH4xMjkgcmVxdWVzdHMgcGVyXG4gKiBsb2FkIGZyb20gY29udHJvbC5tdW9uM2QuY29tKS4gRGlzY292ZXJ5IGJ5IGh0dHAgcnVucyBvbmx5IGZyb20gYSBwYWdlIHRoZVxuICogcHJpbnRlciBzZXJ2ZWQgb3ZlciBodHRwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFnZUlzU2VjdXJlICgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6J1xufVxuXG5mdW5jdGlvbiBpc0lwdjQgKGhvc3Q6IHN0cmluZykge1xuICByZXR1cm4gL15cXGR7MSwzfShcXC5cXGR7MSwzfSl7M30kLy50ZXN0KGhvc3QpXG59XG5cbmZ1bmN0aW9uIGhvc3RPZiAodXJsOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IFVSTCh1cmwpLmhvc3RuYW1lIHx8IG51bGxcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG4vKipcbiAqIGBmZXRjaGAgZm9yIGFuIGFkZHJlc3Mgb24gdGhlIExBTi4gT24gYW4gSFRUUFMgcGFnZSBpdCBkZWNsYXJlcyB0aGUgcmVxdWVzdFxuICogbG9jYWwsIHdoaWNoIENocm9taXVtJ3MgTG9jYWwgTmV0d29yayBBY2Nlc3MgbmVlZHMgYmVmb3JlIGl0IGxldHMgdGhlXG4gKiByZXF1ZXN0IHRocm91Z2guXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5GZXRjaCAodXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0ID0ge30pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IGxvY2FsID0gbG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonID8geyB0YXJnZXRBZGRyZXNzU3BhY2U6ICdsb2NhbCcgfSA6IHt9XG4gIHJldHVybiBmZXRjaCh1cmwsIHsgLi4uaW5pdCwgLi4ubG9jYWwgfSBhcyBSZXF1ZXN0SW5pdClcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0SnNvbiAodXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0ID0ge30sIHRpbWVvdXQgPSBQUk9CRV9USU1FT1VUX01TLCBzaWduYWw/OiBBYm9ydFNpZ25hbCk6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgY29uc3QgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIHRpbWVvdXQpXG4gIGNvbnN0IHN0b3AgPSAoKSA9PiBjb250cm9sbGVyLmFib3J0KClcbiAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgY29udHJvbGxlci5hYm9ydCgpXG4gIGVsc2Ugc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIHN0b3AsIHsgb25jZTogdHJ1ZSB9KVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbGFuRmV0Y2godXJsLCB7IC4uLmluaXQsIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsIGNhY2hlOiAnbm8tc3RvcmUnIH0pXG4gICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWApXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICAgIHJldHVybiBib2R5Py5yZXN1bHQgPz8gYm9keVxuICB9IGZpbmFsbHkge1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpXG4gICAgc2lnbmFsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIHN0b3ApXG4gIH1cbn1cblxuZnVuY3Rpb24gYXBpVXJsRm9yIChob3N0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGBodHRwOi8vJHtob3N0fWBcbn1cblxuLyoqXG4gKiBSZWFkcyBhIHByaW50ZXIncyBsaW5rIHN0YXRlIHRocm91Z2ggaXRzIG93biBNb29ucmFrZXIuXG4gKlxuICogQSA0MDQgbWVhbnMgdGhlIHByaW50ZXIncyBzb2Z0d2FyZSBoYXMgbm8gYWNjb3VudCBsaW5rIChgdW5zdXBwb3J0ZWRgKS5cbiAqIEFueXRoaW5nIGVsc2UgdGhhdCBzdG9wcyB0aGUgcmVhZCwgc3VjaCBhcyBhIHRpbWVvdXQsIGEgcmVmdXNlZCBjb25uZWN0aW9uXG4gKiBvciB0aGUgYnJvd3NlciBibG9ja2luZyB0aGUgcmVxdWVzdCwgc2F5cyBub3RoaW5nIGFib3V0IHRoZSBwcmludGVyJ3NcbiAqIHZlcnNpb24gKGB1bnJlYWNoYWJsZWApLiBCb3RoIHVzZWQgdG8gcmVhZCBhcyBgdW5hdmFpbGFibGVgLCB3aGljaCB0b2xkXG4gKiBwZW9wbGUgdG8gdXBkYXRlIGEgcHJpbnRlciB0aGF0IHdhcyBhbHJlYWR5IG9uIHRoZSBuZXdlc3QgYnVpbGQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsYW5MaW5rU3RhdHVzIChhcGlVcmw6IHN0cmluZyk6IFByb21pc2U8TGFuTGlua1N0YXR1cz4ge1xuICB0cnkge1xuICAgIGNvbnN0IHMgPSBhd2FpdCBnZXRKc29uKGAke2FwaVVybH0vc2VydmVyL211b24vbGlua2AsIHt9LCAzMDAwKVxuICAgIHJldHVybiBzICYmIHR5cGVvZiBzLnBoYXNlID09PSAnc3RyaW5nJyA/IHMgOiB7IHBoYXNlOiAndW5zdXBwb3J0ZWQnIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4geyBwaGFzZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSAnSFRUUCA0MDQnID8gJ3Vuc3VwcG9ydGVkJyA6ICd1bnJlYWNoYWJsZScgfVxuICB9XG59XG5cbi8qKiBBc2tzIG9uZSBhZGRyZXNzIHdoZXRoZXIgaXQgaXMgYSBNdW9uM0QgcHJpbnRlci4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9iZSAoaG9zdDogc3RyaW5nLCB0aW1lb3V0ID0gUFJPQkVfVElNRU9VVF9NUywgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPExhblByaW50ZXIgfCBudWxsPiB7XG4gIGNvbnN0IGFwaVVybCA9IGFwaVVybEZvcihob3N0KVxuICBsZXQgaWRlbnRpdHk6IGFueVxuICB0cnkge1xuICAgIGlkZW50aXR5ID0gYXdhaXQgZ2V0SnNvbihgJHthcGlVcmx9L3NlcnZlci9tdW9uL2lkZW50aXR5YCwge30sIHRpbWVvdXQsIHNpZ25hbClcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBpZiAoc2lnbmFsPy5hYm9ydGVkKSByZXR1cm4gbnVsbFxuICBpZiAoIWlkZW50aXR5IHx8IHR5cGVvZiBpZGVudGl0eSAhPT0gJ29iamVjdCcpIHJldHVybiBudWxsXG4gIGNvbnN0IG5hbWUgPSBTdHJpbmcoaWRlbnRpdHkuZGlzcGxheSB8fCBpZGVudGl0eS5uYW1lIHx8IGhvc3QpXG4gIGNvbnN0IGVuZHBvaW50SWQgPSB0eXBlb2YgaWRlbnRpdHkuZW5kcG9pbnRfaWQgPT09ICdzdHJpbmcnICYmIGlkZW50aXR5LmVuZHBvaW50X2lkID8gaWRlbnRpdHkuZW5kcG9pbnRfaWQgOiBudWxsXG4gIGNvbnN0IG1kbnNIb3N0ID0gbWRuc0hvc3RGb3IoaWRlbnRpdHkpXG4gIGNvbnN0IFtsaW5rLCBoZWFsdGhdID0gYXdhaXQgUHJvbWlzZS5hbGwoW2xhbkxpbmtTdGF0dXMoYXBpVXJsKSwgcHJpbnRlckhlYWx0aChhcGlVcmwpXSlcbiAgY29uc3QgZW50cnkgPSBpZGVudGl0eS5lbnRyeSA9PT0gJ29wZW4nID8gJ29wZW4nIGFzIGNvbnN0IDogdW5kZWZpbmVkXG4gIHJldHVybiB7IGhvc3QsIGFwaVVybCwgbmFtZSwgZW5kcG9pbnRJZCwgbWRuc0hvc3QsIGxpbmssIC4uLihlbnRyeSA/IHsgZW50cnkgfSA6IHt9KSwgaGVhbHRoOiBoZWFsdGggPz8gdW5kZWZpbmVkIH1cbn1cblxuLyoqXG4gKiBSZWFkcyBLbGlwcGVyJ3Mgc3RhdGUgdGhyb3VnaCB0aGUgcHJpbnRlcidzIE1vb25yYWtlci4gTnVsbCBtZWFucyBub3RoaW5nXG4gKiBhbnN3ZXJlZC4gQSBwcmludGVyIHRoYXQgYW5zd2VycyB3aXRoIDQwMSBvciA0MDMgaXMgdGhlcmUgYnV0IGBsb2NrZWRgOlxuICogaXQgd2FudHMgYSBwYXNzd29yZCwgb3IgaXRzIGFjY2VzcyBydWxlcyByZWZ1c2UgdGhpcyBicm93c2VyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJpbnRlckhlYWx0aCAoYXBpVXJsOiBzdHJpbmcsIHRpbWVvdXQgPSBQUk9CRV9USU1FT1VUX01TKTogUHJvbWlzZTxMYW5IZWFsdGggfCBudWxsPiB7XG4gIGNvbnN0IGNoZWNrZWRBdCA9IERhdGUubm93KClcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRKc29uKGAke2FwaVVybH0ke1NUQVRVU19RVUVSWX1gLCB7fSwgdGltZW91dClcbiAgICBjb25zdCB3ZWJob29rcyA9IHJlc3VsdD8uc3RhdHVzPy53ZWJob29rcyA/PyB7fVxuICAgIGNvbnN0IGpvYiA9IHJlc3VsdD8uc3RhdHVzPy5wcmludF9zdGF0cz8uc3RhdGVcbiAgICBjb25zdCBzdGF0dXM6IFByaW50ZXJTdGF0dXMgPSB7IHJlYWNoYWJsZTogdHJ1ZSwgLi4uc3RhdHVzRnJvbShyZXN1bHQ/LnN0YXR1cyA/PyB7fSksIHVwZGF0ZWRBdDogY2hlY2tlZEF0IH1cbiAgICBpZiAod2ViaG9va3Muc3RhdGUgIT09ICdyZWFkeScpIHtcbiAgICAgIHJldHVybiB7IHN0YXRlOiAnZXJyb3InLCBtZXNzYWdlOiB3ZWJob29rcy5zdGF0ZV9tZXNzYWdlIHx8IGBLbGlwcGVyICR7d2ViaG9va3Muc3RhdGUgPz8gJ25vdCBydW5uaW5nJ31gLCBjaGVja2VkQXQsIHN0YXR1cyB9XG4gICAgfVxuICAgIGlmIChqb2IgPT09ICdwcmludGluZycpIHJldHVybiB7IHN0YXRlOiAncHJpbnRpbmcnLCBjaGVja2VkQXQsIHN0YXR1cyB9XG4gICAgaWYgKGpvYiA9PT0gJ3BhdXNlZCcpIHJldHVybiB7IHN0YXRlOiAncGF1c2VkJywgY2hlY2tlZEF0LCBzdGF0dXMgfVxuICAgIGlmIChqb2IgPT09ICdlcnJvcicpIHJldHVybiB7IHN0YXRlOiAnZXJyb3InLCBtZXNzYWdlOiAnVGhlIGxhc3QgcHJpbnQgc3RvcHBlZCB3aXRoIGFuIGVycm9yJywgY2hlY2tlZEF0LCBzdGF0dXMgfVxuICAgIHJldHVybiB7IHN0YXRlOiAncmVhZHknLCBjaGVja2VkQXQsIHN0YXR1cyB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJydcbiAgICBpZiAobWVzc2FnZSA9PT0gJ0hUVFAgNDAxJyB8fCBtZXNzYWdlID09PSAnSFRUUCA0MDMnKSByZXR1cm4geyBzdGF0ZTogJ2xvY2tlZCcsIGNoZWNrZWRBdCB9XG4gICAgLy8gTW9vbnJha2VyIGFuc3dlcnMgNTAzIHdoaWxlIEtsaXBweSBoYXMgbm90IGNvbm5lY3RlZC5cbiAgICBpZiAoL15IVFRQIDVcXGRcXGQkLy50ZXN0KG1lc3NhZ2UpKSByZXR1cm4geyBzdGF0ZTogJ2Vycm9yJywgbWVzc2FnZTogJ0tsaXBwZXIgaXMgbm90IHJ1bm5pbmcnLCBjaGVja2VkQXQgfVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuLyoqXG4gKiBXaGF0IGEgcGVyc29uIHR5cGVzIGludG8gdGhlIGFkZHJlc3MgYm94OiBhbiBJUCBhZGRyZXNzLCBhIG5hbWUgc3VjaCBhc1xuICogYG11b24tYm94d29vZC0zNjdhYCwgdGhlIHNhbWUgd2l0aCBgLmxvY2FsYCwgb3IgYSBmdWxsIFVSTC4gQSBiYXJlIG5hbWUgaXNcbiAqIHRyaWVkIGFzIHR5cGVkLCB0aGVuIHdpdGggYC5sb2NhbGAsIGJlY2F1c2UgdGhlIHByaW50ZXIgYWx3YXlzIGFuc3dlcnNcbiAqIG1ETlMgYnV0IG9ubHkgc29tZSByb3V0ZXJzIGtub3cgaXRzIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRyZXNzQ2FuZGlkYXRlcyAoaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgaG9zdCA9IGlucHV0LnRyaW0oKVxuICAgIC5yZXBsYWNlKC9eW2Etel0rOlxcL1xcLy9pLCAnJylcbiAgICAucmVwbGFjZSgvXFwvLiokLywgJycpXG4gIGlmICghaG9zdCkgcmV0dXJuIFtdXG4gIGNvbnN0IGJhcmUgPSAhaG9zdC5pbmNsdWRlcygnLicpICYmICFob3N0LmluY2x1ZGVzKCc6JykgJiYgaG9zdC50b0xvd2VyQ2FzZSgpICE9PSAnbG9jYWxob3N0J1xuICByZXR1cm4gYmFyZSA/IFtob3N0LCBgJHtob3N0fS5sb2NhbGBdIDogW2hvc3RdXG59XG5cbi8qKlxuICogRmluZHMgdGhlIHByaW50ZXIgYmVoaW5kIHdoYXQgc29tZW9uZSB0eXBlZDogdGhlIGZpcnN0IGNhbmRpZGF0ZSB0aGF0XG4gKiBhbnN3ZXJzIGFzIGEgTXVvbjNEIHByaW50ZXIuIFRoZSB3YWl0IGlzIGxvbmdlciB0aGFuIHRoZSBzd2VlcCdzLCBiZWNhdXNlIGFcbiAqIHN3ZWVwIHJ1bm5pbmcgYXQgdGhlIHNhbWUgdGltZSBob2xkcyBDaHJvbWl1bSdzIGNvbm5lY3Rpb25zLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvYmVBZGRyZXNzIChpbnB1dDogc3RyaW5nKTogUHJvbWlzZTxMYW5QcmludGVyIHwgbnVsbD4ge1xuICBmb3IgKGNvbnN0IGhvc3Qgb2YgYWRkcmVzc0NhbmRpZGF0ZXMoaW5wdXQpKSB7XG4gICAgY29uc3QgcHJpbnRlciA9IGF3YWl0IHByb2JlKGhvc3QsIEFERFJFU1NfVElNRU9VVF9NUylcbiAgICBpZiAocHJpbnRlcikgcmV0dXJuIHByaW50ZXJcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIFdoZXRoZXIgdGhpcyBwYWdlIG1heSB0YWxrIHRvIHRoZSBwcmludGVyIGF0IGBhcGlVcmxgIGF0IGFsbC5cbiAqXG4gKiBBIHBhZ2Ugc2VydmVkIG92ZXIgSFRUUFMgKGNvbnRyb2wubXVvbjNkLmNvbSkgYXNraW5nIGEgcGxhaW4tSFRUUCBwcmludGVyIGlzXG4gKiBtaXhlZCBjb250ZW50LiBDaHJvbWl1bSBsZXRzIGl0IHRocm91Z2ggb25jZSB0aGUgcGVyc29uIGFsbG93cyBsb2NhbCBuZXR3b3JrXG4gKiBhY2Nlc3M7IG90aGVyIGJyb3dzZXJzLCBhbmQgYSByZWZ1c2VkIHByb21wdCwgYmxvY2sgaXQgYmVmb3JlIGl0IGxlYXZlcyB0aGVcbiAqIG1hY2hpbmUuIEZsdWlkZCdzIG93biBjb25uZWN0IGRvZXMgbm90IHJlcG9ydCB0aGF0OiBpdCBzYXZlcyB0aGUgYWRkcmVzcyxcbiAqIHBvaW50cyBpdHNlbGYgYXQgaXQgYW5kIHNob3dzIGEgZGFzaGJvYXJkIHRoYXQgbmV2ZXIgbG9hZHMuIEFza2luZyBmaXJzdCBsZXRzXG4gKiBhIGJsb2NrZWQgcHJpbnRlciBsZWF2ZSBGbHVpZGQgd2hlcmUgaXQgd2FzLCB3aXRoIG5vdGhpbmcgc2F2ZWQuXG4gKlxuICogQW55IEhUVFAgYW5zd2VyLCBldmVuIGFuIGVycm9yIHN0YXR1cywgbWVhbnMgdGhlIHBhZ2UgY2FuIHJlYWNoIGl0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFnZUNhblJlYWNoIChhcGlVcmw6IHN0cmluZywgdGltZW91dCA9IFBST0JFX1RJTUVPVVRfTVMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgcmV0dXJuIGF3YWl0IHBhZ2VSZWFjaChhcGlVcmwsIHRpbWVvdXQpID09PSAncmVhY2hlZCdcbn1cblxuLyoqXG4gKiBXaGF0IGJlY2FtZSBvZiB0aGlzIHBhZ2UncyByZXF1ZXN0IHRvIHRoZSBwcmludGVyIGF0IGBhcGlVcmxgOiBpdCB3YXNcbiAqIGFuc3dlcmVkLCB0aGUgYnJvd3NlciBibG9ja2VkIGl0LCBvciBpdCB3ZW50IG91dCBhbmQgbm90aGluZyBhbnN3ZXJlZC5cbiAqXG4gKiBUZWxsaW5nIHRoZSBsYXN0IHR3byBhcGFydCBkZWNpZGVzIHdoYXQgRmx1aWRkIG1heSBzYXkuIEEgYmxvY2tlZCBwcmludGVyXG4gKiBzdGlsbCB3b3JrcyBmcm9tIGl0cyBvd24gcGFnZTsgYSBzaWxlbnQgYWRkcmVzcyBpcyB3cm9uZyBvciB0aGUgcHJpbnRlciBpc1xuICogb2ZmLCBhbmQgaXRzIHBhZ2Ugd291bGQgbm90IGxvYWQgZWl0aGVyLiBPbiAyNyBPY3QgQ29udHJvbCB0b2xkIEphY2sgdGhlXG4gKiBicm93c2VyIGJsb2NrZWQgQm94d29vZCBhbmQgc2VudCBoaW0gdG8gaHR0cDovLzEwLjQyLjAuMS8sIGFuIGFkZHJlc3MgdGhlXG4gKiBwcmludGVyIGhhZCBzdG9wcGVkIGhvbGRpbmcgaG91cnMgYmVmb3JlLlxuICpcbiAqIEEgYmxvY2sgY29tZXMgYmFjayBhdCBvbmNlLiBBIHJlcXVlc3QgdGhlIGJyb3dzZXIgbGV0IG91dCwgdG8gYW4gYWRkcmVzc1xuICogbm9ib2R5IGhvbGRzLCB3YWl0cyBmb3IgdGhlIHRpbWUgbGltaXQuIFdpdGggQ2hyb21pdW0ncyBsb2NhbCBuZXR3b3JrXG4gKiBwZXJtaXNzaW9uIGdyYW50ZWQsIGEgcXVpY2sgZmFpbHVyZSBhdCBhIHByaXZhdGUgSVB2NCBhZGRyZXNzIGlzIGEgcmVmdXNhbFxuICogZnJvbSB0aGUgYWRkcmVzcyBpdHNlbGY7IGF0IGEgbmFtZSBpdCBtYXkgc3RpbGwgYmUgYSBibG9jayAoYSBuYW1lIGNhblxuICogcmVzb2x2ZSB0byBhIHB1YmxpYyBJUHY2IGFkZHJlc3MpLiBXaGlsZSBDaHJvbWl1bSdzIHByb21wdCBpcyBvcGVuIHRoZVxuICogcmVxdWVzdCB3YWl0cyBmb3IgdGhlIHBlcnNvbiwgd2hhdGV2ZXIgdGhlIGFkZHJlc3M6IHRoYXQgaXMgYGFza2luZ2AuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYWdlUmVhY2ggKGFwaVVybDogc3RyaW5nLCB0aW1lb3V0ID0gUFJPQkVfVElNRU9VVF9NUyk6IFByb21pc2U8J3JlYWNoZWQnIHwgJ2Jsb2NrZWQnIHwgJ2Fza2luZycgfCAnc2lsZW50Jz4ge1xuICBpZiAobG9jYXRpb24ucHJvdG9jb2wgIT09ICdodHRwczonIHx8ICFhcGlVcmwuc3RhcnRzV2l0aCgnaHR0cDonKSkgcmV0dXJuICdyZWFjaGVkJ1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpXG4gIGxldCB0aW1lZE91dCA9IGZhbHNlXG4gIGNvbnN0IHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRpbWVkT3V0ID0gdHJ1ZVxuICAgIGNvbnRyb2xsZXIuYWJvcnQoKVxuICB9LCB0aW1lb3V0KVxuICB0cnkge1xuICAgIGF3YWl0IGxhbkZldGNoKGAke2FwaVVybC5yZXBsYWNlKC9cXC8rJC8sICcnKX0vc2VydmVyL2luZm9gLCB7IG1vZGU6ICduby1jb3JzJywgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCwgY2FjaGU6ICduby1zdG9yZScgfSlcbiAgICByZXR1cm4gJ3JlYWNoZWQnXG4gIH0gY2F0Y2gge1xuICAgIGNvbnN0IHBlcm1pc3Npb24gPSBhd2FpdCBsb2NhbE5ldHdvcmtQZXJtaXNzaW9uKClcbiAgICBpZiAocGVybWlzc2lvbiA9PT0gJ3Byb21wdCcpIHJldHVybiAnYXNraW5nJ1xuICAgIGlmICh0aW1lZE91dCB8fCAocGVybWlzc2lvbiA9PT0gJ2dyYW50ZWQnICYmIGlzUHJpdmF0ZUlwdjQoaG9zdE9mKGFwaVVybCkpKSkgcmV0dXJuICdzaWxlbnQnXG4gICAgcmV0dXJuICdibG9ja2VkJ1xuICB9IGZpbmFsbHkge1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpXG4gIH1cbn1cblxuZnVuY3Rpb24gaXNQcml2YXRlSXB2NCAoaG9zdDogc3RyaW5nIHwgbnVsbCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISFob3N0ICYmIGlzSXB2NChob3N0KSAmJiAvXigxMFxcLnwxOTJcXC4xNjhcXC58MTcyXFwuKDFbNi05XXwyXFxkfDNbMDFdKVxcLikvLnRlc3QoaG9zdClcbn1cblxuLyoqXG4gKiBDaHJvbWl1bSdzIFwibG9vayBmb3IgZGV2aWNlcyBvbiB5b3VyIGxvY2FsIG5ldHdvcmtcIiBwZXJtaXNzaW9uIGZvciB0aGlzXG4gKiBwYWdlLCBvciBgdW5rbm93bmAgd2hlcmUgdGhlIGJyb3dzZXIgaGFzIG5vbmUgKEZpcmVmb3gsIFNhZmFyaSkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2NhbE5ldHdvcmtQZXJtaXNzaW9uICgpOiBQcm9taXNlPFBlcm1pc3Npb25TdGF0ZSB8ICd1bmtub3duJz4ge1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgWydsb2NhbC1uZXR3b3JrLWFjY2VzcycsICdsb2NhbC1uZXR3b3JrJ10pIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChhd2FpdCBuYXZpZ2F0b3IucGVybWlzc2lvbnMucXVlcnkoeyBuYW1lIH0gYXMgdW5rbm93biBhcyBQZXJtaXNzaW9uRGVzY3JpcHRvcikpLnN0YXRlXG4gICAgfSBjYXRjaCB7IC8qIG5vdCB0aGlzIG5hbWUsIG9yIG5vIFBlcm1pc3Npb25zIEFQSSAqLyB9XG4gIH1cbiAgcmV0dXJuICd1bmtub3duJ1xufVxuXG4vKiogVGhlIHN1Ym5ldCBhbiBNMSdzIG93biBob3RzcG90IGhhbmRzIG91dCAoTmV0d29ya01hbmFnZXIncyBzaGFyZWQgbW9kZSkuICovXG5jb25zdCBPV05fSE9UU1BPVCA9IC9eMTBcXC40MlxcLjBcXC5cXGQrJC9cblxuLyoqIFdoZXRoZXIgYGhvc3RgIGlzIGFuIGFkZHJlc3Mgb24gYW4gTTEncyBvd24gaG90c3BvdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc093bkhvdHNwb3QgKGhvc3Q6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhaG9zdCAmJiBPV05fSE9UU1BPVC50ZXN0KGhvc3QpXG59XG5cbi8qKlxuICogVGhlIGFkZHJlc3MgdG8gb3BlbiBhIHByaW50ZXIgdGhlIHNlcnZpY2UgZm91bmQgbmVhcmJ5IGF0LCBvciBudWxsIHdoZW4gaXRcbiAqIHJlcG9ydGVkIG5vbmUgdGhpcyBicm93c2VyIGNvdWxkIHVzZS4gVGhlIHByaW50ZXIgcmVwb3J0cyBldmVyeSBwcml2YXRlXG4gKiBJUHY0IGFkZHJlc3MgaXQgaG9sZHMsIHNvcnRlZCwgYW5kIHdoaWxlIGl0cyBob3RzcG90IGlzIHVwIHRoYXQgaW5jbHVkZXNcbiAqIDEwLjQyLjAuMSwgd2hpY2ggc29ydHMgZmlyc3QgYW5kIHdoaWNoIG5vYm9keSBvbiB0aGUgb3duZXIncyBuZXR3b3JrIGNhblxuICogcmVhY2guXG4gKlxuICogVGhlIGhvdHNwb3QgYWRkcmVzcyBpcyBuZXZlciB0aGUgYW5zd2VyLCBldmVuIGFsb25lLiBUaGUgc2VydmljZSBsaXN0cyBhXG4gKiBwcmludGVyIG9ubHkgd2hpbGUgaXQgY29ubmVjdHMgZnJvbSB0aGlzIGJyb3dzZXIncyBwdWJsaWMgYWRkcmVzcywgc28gdGhlXG4gKiBwcmludGVyIGlzIG9uIGEgbmV0d29yayB3aXRoIHRoaXMgYnJvd3NlciwgYW5kIGEgcmVwb3J0IG9mIHRoZSBob3RzcG90IGFsb25lXG4gKiBpcyBvdXQgb2YgZGF0ZS4gQm94d29vZCwgMjcgT2N0OiBpdHMgaG90c3BvdCB3ZW50IGRvd24gYXQgMjE6Mjk6NDIsIGEgc2Vjb25kXG4gKiBhZnRlciBpdCBqb2luZWQgdGhlIGhvbWUgV2ktRmksIGFuZCBhdCAwMDozMCB0aGUgc2VydmljZSBzdGlsbCBnYXZlXG4gKiAxMC40Mi4wLjEgYXMgaXRzIG9ubHkgYWRkcmVzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5lYXJieUhvc3QgKGxvY2FsQWRkcnM6IHN0cmluZ1tdKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiBsb2NhbEFkZHJzLmZpbmQoYSA9PiAhaXNPd25Ib3RzcG90KGEpKSA/PyBudWxsXG59XG5cbi8qKiBXaGV0aGVyIHNvbWV0aGluZyBhbnN3ZXJlZCBhdCBgaG9zdGAgcXVpY2tseS4gQSByZWZ1c2FsIGlzIGFuIGFuc3dlci4gKi9cbmFzeW5jIGZ1bmN0aW9uIGFuc3dlcnNRdWlja2x5IChob3N0OiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgY29uc3Qgc3RhcnRlZCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gIGNvbnN0IHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCBHQVRFV0FZX1RJTUVPVVRfTVMpXG4gIGNvbnN0IHN0b3AgPSAoKSA9PiBjb250cm9sbGVyLmFib3J0KClcbiAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgY29udHJvbGxlci5hYm9ydCgpXG4gIGVsc2Ugc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIHN0b3AsIHsgb25jZTogdHJ1ZSB9KVxuICB0cnkge1xuICAgIGF3YWl0IGxhbkZldGNoKGBodHRwOi8vJHtob3N0fS9gLCB7IG1vZGU6ICduby1jb3JzJywgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCwgY2FjaGU6ICduby1zdG9yZScgfSlcbiAgICByZXR1cm4gdHJ1ZVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gIXNpZ25hbD8uYWJvcnRlZCAmJiBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWQgPCBHQVRFV0FZX0FOU1dFUlNfV0lUSElOX01TXG4gIH0gZmluYWxseSB7XG4gICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcilcbiAgICBzaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgc3RvcClcbiAgfVxufVxuXG4vKiogRXZlcnkgYWRkcmVzcyBhIGZvdW5kIHByaW50ZXIgYW5zd2VyZWQgb24uICovXG5leHBvcnQgZnVuY3Rpb24gbGFuQWRkcmVzc2VzIChwcmludGVyOiBMYW5QcmludGVyKTogc3RyaW5nW10ge1xuICByZXR1cm4gcHJpbnRlci5hbGlhc2VzPy5sZW5ndGggPyBwcmludGVyLmFsaWFzZXMgOiBbcHJpbnRlci5ob3N0XVxufVxuXG5mdW5jdGlvbiByZW1lbWJlciAocHJpbnRlcjogTGFuUHJpbnRlcikge1xuICAvLyBPbmUgcm93IHBlciBwcmludGVyOiB0aGUgc2FtZSBFbmRwb2ludElkIGF0IGFub3RoZXIgYWRkcmVzcyBpcyB0aGUgc2FtZVxuICAvLyBwcmludGVyLCBhbmQga2VlcHMgYm90aCBhZGRyZXNzZXMuXG4gIGNvbnN0IGkgPSBkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5maW5kSW5kZXgocCA9PlxuICAgIGxhbkFkZHJlc3NlcyhwKS5pbmNsdWRlcyhwcmludGVyLmhvc3QpIHx8ICghIXByaW50ZXIuZW5kcG9pbnRJZCAmJiBwLmVuZHBvaW50SWQgPT09IHByaW50ZXIuZW5kcG9pbnRJZCkpXG4gIGlmIChpIDwgMCkge1xuICAgIGRpc2NvdmVyeVN0YXRlLmZvdW5kLnB1c2goeyAuLi5wcmludGVyLCBhbGlhc2VzOiBbcHJpbnRlci5ob3N0XSB9KVxuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGFsaWFzZXMgPSBbLi4ubmV3IFNldChbLi4ubGFuQWRkcmVzc2VzKGRpc2NvdmVyeVN0YXRlLmZvdW5kW2ldKSwgcHJpbnRlci5ob3N0XSldXG4gIGRpc2NvdmVyeVN0YXRlLmZvdW5kLnNwbGljZShpLCAxLCB7IC4uLnByaW50ZXIsIGFsaWFzZXMgfSlcbn1cblxuLyoqIEFuIGFkZHJlc3Mgc3RvcHBlZCBhbnN3ZXJpbmcuIFRoZSBwcmludGVyIGxlYXZlcyB0aGUgbGlzdCB3aGVuIG5vbmUgb2YgaXRzIGFkZHJlc3NlcyBhbnN3ZXIuICovXG5mdW5jdGlvbiBmb3JnZXQgKGhvc3Q6IHN0cmluZykge1xuICBjb25zdCBpID0gZGlzY292ZXJ5U3RhdGUuZm91bmQuZmluZEluZGV4KHAgPT4gbGFuQWRkcmVzc2VzKHApLmluY2x1ZGVzKGhvc3QpKVxuICBpZiAoaSA8IDApIHJldHVyblxuICBjb25zdCBwcmludGVyID0gZGlzY292ZXJ5U3RhdGUuZm91bmRbaV1cbiAgY29uc3QgYWxpYXNlcyA9IGxhbkFkZHJlc3NlcyhwcmludGVyKS5maWx0ZXIoYSA9PiBhICE9PSBob3N0KVxuICBpZiAoIWFsaWFzZXMubGVuZ3RoKSBkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5zcGxpY2UoaSwgMSlcbiAgZWxzZSBkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5zcGxpY2UoaSwgMSwgeyAuLi5wcmludGVyLCBhbGlhc2VzLCBob3N0OiBwcmludGVyLmhvc3QgPT09IGhvc3QgPyBhbGlhc2VzWzBdIDogcHJpbnRlci5ob3N0IH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvb2w8VD4gKGl0ZW1zOiBUW10sIHdvcms6IChpdGVtOiBUKSA9PiBQcm9taXNlPHZvaWQ+LCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICBsZXQgbmV4dCA9IDBcbiAgY29uc3QgcnVubmVycyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IE1hdGgubWluKENPTkNVUlJFTkNZLCBpdGVtcy5sZW5ndGgpIH0sIGFzeW5jICgpID0+IHtcbiAgICB3aGlsZSAobmV4dCA8IGl0ZW1zLmxlbmd0aCAmJiAhc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICBjb25zdCBpdGVtID0gaXRlbXNbbmV4dCsrXVxuICAgICAgYXdhaXQgd29yayhpdGVtKVxuICAgIH1cbiAgfSlcbiAgYXdhaXQgUHJvbWlzZS5hbGwocnVubmVycylcbn1cblxuLyoqXG4gKiBUaGUgYWRkcmVzc2VzIG9mIHRoZSBwcmludGVycyBhbHJlYWR5IHNhdmVkLiBPbiBhIHBhZ2UgdGhhdCBtYXkgbm90IHJlYWNoXG4gKiBJUHY0IGFkZHJlc3NlcywgYSBwcmludGVyIHNhdmVkIGJ5IElQIGlzIGFza2VkIGF0IGl0cyBgLmxvY2FsYCBuYW1lIGluc3RlYWQsXG4gKiBzbyBpdCBjYW4gYmUgZm91bmQgdGhlcmUsIGFuZCBtb3ZlZCB0aGVyZSwgYnkgaXRzIEVuZHBvaW50SWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBrbm93bkhvc3RzIChibG9ja2VkID0gISFkaXNjb3ZlcnlTdGF0ZS5ibG9ja2VkQnlQYWdlKTogc3RyaW5nW10ge1xuICBjb25zdCBpbnN0YW5jZXM6IEluc3RhbmNlQ29uZmlnW10gPSBzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0SW5zdGFuY2VzJ10gPz8gW11cbiAgY29uc3QgaG9zdHMgPSBpbnN0YW5jZXMubWFwKGkgPT4ge1xuICAgIGNvbnN0IGhvc3QgPSBob3N0T2YoaS5hcGlVcmwpXG4gICAgcmV0dXJuIGJsb2NrZWQgJiYgaG9zdCAmJiBpc0lwdjQoaG9zdCkgPyAoaS5tZG5zSG9zdCA/PyBudWxsKSA6IGhvc3RcbiAgfSkuZmlsdGVyKChoKTogaCBpcyBzdHJpbmcgPT4gISFoICYmICFoLmVuZHNXaXRoKCcuaW52YWxpZCcpKVxuICBpZiAoaXNJcHY0KGxvY2F0aW9uLmhvc3RuYW1lKSAmJiBsb2NhdGlvbi5ob3N0bmFtZSAhPT0gJzEyNy4wLjAuMScpIGhvc3RzLnB1c2gobG9jYXRpb24uaG9zdG5hbWUpXG4gIHJldHVybiBbLi4ubmV3IFNldChob3N0cyldXG59XG5cbi8qKiBUaGUgc3dlZXAgcnVubmluZyBub3csIGlmIGFueTogaXRzIGFib3J0IHN0b3BzIGV2ZXJ5IHByb2JlIGl0IGhhcyBpbiBmbGlnaHQuICovXG5sZXQgc3dlZXBBYm9ydDogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGxcbmxldCB3YXRjaGluZyA9IGZhbHNlXG5cbi8qKlxuICogU3RvcHMgdGhlIHN3ZWVwIHJ1bm5pbmcgbm93OiBpdHMgcHJvYmVzIGFyZSBhYm9ydGVkLCBzbyB0aGVpciBzb2NrZXRzIGFyZVxuICogcmVsZWFzZWQgYXQgb25jZS4gQ2FsbGVkIHdoZW4gdGhlIHBhZ2UgbGVhdmVzLCB3aGVuIGEgbmV3IHN3ZWVwIHN0YXJ0cyBhbmRcbiAqIHdoZW4gYSBwcmludGVyIGNvbm5lY3Rpb24gb3BlbnMsIHNvIGEgcHJvYmUgbmV2ZXIgaG9sZHMgdXAgdGhlIHBhZ2UncyBvd25cbiAqIHJlcXVlc3RzIChLQU4tMjcyNCkuIEEgc3RvcHBlZCBzd2VlcCBkaWQgbm90IGZpbmlzaCwgc28gaXQgZG9lcyBub3QgbWFrZVxuICogdGhlIG5leHQgbG9vayB3YWl0IG91dCB0aGUgZnJlc2huZXNzIHdpbmRvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFib3J0U3dlZXAgKCkge1xuICBzd2VlcEFib3J0Py5hYm9ydCgpXG59XG5cbmZ1bmN0aW9uIHdhdGNoUGFnZSAoKSB7XG4gIGlmICh3YXRjaGluZykgcmV0dXJuXG4gIHdhdGNoaW5nID0gdHJ1ZVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncGFnZWhpZGUnLCBhYm9ydFN3ZWVwKVxuICAvLyBBIHByaW50ZXIgY29ubmVjdGlvbiBvcGVuaW5nIGlzIHRoZSBwYWdlJ3Mgb3duIHRyYWZmaWM6IGl0IGdvZXMgZmlyc3QuXG4gIHN0b3JlLnN1YnNjcmliZT8uKChtdXRhdGlvbjogeyB0eXBlOiBzdHJpbmcsIHBheWxvYWQ6IHVua25vd24gfSkgPT4ge1xuICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnc29ja2V0L3NldFNvY2tldENvbm5lY3RpbmcnICYmIG11dGF0aW9uLnBheWxvYWQgPT09IHRydWUpIGFib3J0U3dlZXAoKVxuICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBzd2VlcCAoY29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyKSB7XG4gIGNvbnN0IHsgc2lnbmFsIH0gPSBjb250cm9sbGVyXG4gIGRpc2NvdmVyeVN0YXRlLnNjYW5uaW5nID0gdHJ1ZVxuICB0cnkge1xuICAgIGNvbnN0IGJsb2NrZWQgPSBhd2FpdCBwYWdlQmxvY2tzTGFuSXB2NCgpXG4gICAgY29uc3Qga25vd24gPSBrbm93bkhvc3RzKGJsb2NrZWQpXG4gICAgZGlzY292ZXJ5U3RhdGUubmV0d29yayA9ICdwcmludGVycyB5b3UgaGF2ZSBhZGRlZCdcbiAgICBhd2FpdCBwb29sKGtub3duLCBhc3luYyBob3N0ID0+IHtcbiAgICAgIGNvbnN0IHByaW50ZXIgPSBhd2FpdCBwcm9iZShob3N0LCBQUk9CRV9USU1FT1VUX01TLCBzaWduYWwpXG4gICAgICBpZiAocHJpbnRlciAmJiAhc2lnbmFsLmFib3J0ZWQpIHJlbWVtYmVyKHByaW50ZXIpXG4gICAgfSwgc2lnbmFsKVxuICAgIC8vIEV2ZXJ5IHByb2JlIG9mIGFuIElQdjQgYWRkcmVzcyB3b3VsZCBiZSByZWZ1c2VkIGJlZm9yZSBpdCB3YXMgc2VudCwgYW5kXG4gICAgLy8gZWFjaCByZWZ1c2FsIHdvdWxkIHJlYWQgYXMgYSBnYXRld2F5IGFuc3dlcmluZy5cbiAgICBpZiAoYmxvY2tlZCB8fCBzaWduYWwuYWJvcnRlZCkgcmV0dXJuXG5cbiAgICBjb25zdCBvd24gPSBbLi4ubmV3IFNldChrbm93bi5maWx0ZXIoaXNJcHY0KS5tYXAoaCA9PiBoLnNwbGl0KCcuJykuc2xpY2UoMCwgMykuam9pbignLicpKSldXG4gICAgZGlzY292ZXJ5U3RhdGUubmV0d29yayA9ICd0aGlzIG5ldHdvcmsnXG4gICAgY29uc3QgYW5zd2VyaW5nID0gbmV3IFNldDxzdHJpbmc+KClcbiAgICAvLyBPbmUgYWRkcmVzcyBwZXIgc2xvdCwgc28gdGhlIHBvb2wncyBib3VuZCBob2xkcyBmb3IgdGhlIHR3byBhc2tlZCBvZiBlYWNoIG5ldHdvcmsgdG9vLlxuICAgIGNvbnN0IGdhdGV3YXlzID0gQ09NTU9OX05FVFdPUktTLmZpbHRlcihuID0+ICFvd24uaW5jbHVkZXMobikpLmZsYXRNYXAobiA9PiBbYCR7bn0uMWAsIGAke259LjI1NGBdKVxuICAgIGF3YWl0IHBvb2woZ2F0ZXdheXMsIGFzeW5jIGhvc3QgPT4ge1xuICAgICAgaWYgKGF3YWl0IGFuc3dlcnNRdWlja2x5KGhvc3QsIHNpZ25hbCkpIGFuc3dlcmluZy5hZGQoaG9zdC5zbGljZSgwLCBob3N0Lmxhc3RJbmRleE9mKCcuJykpKVxuICAgIH0sIHNpZ25hbClcbiAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHJldHVyblxuICAgIGNvbnN0IG5ldHdvcmtzID0gWy4uLm5ldyBTZXQoW1xuICAgICAgLi4ub3duLFxuICAgICAgLi4uQ09NTU9OX05FVFdPUktTLmZpbHRlcihuID0+IGFuc3dlcmluZy5oYXMobikpLFxuICAgICAgV0lORE9XU19IT1RTUE9UX05FVFdPUktcbiAgICBdKV1cbiAgICBjb25zdCBzZWVuID0gbmV3IFNldChkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5mbGF0TWFwKGxhbkFkZHJlc3NlcykpXG4gICAgY29uc3QgaG9zdHM6IHN0cmluZ1tdID0gW11cbiAgICBmb3IgKGNvbnN0IG5ldHdvcmsgb2YgbmV0d29ya3MpIHtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgMjU1OyBpKyspIHtcbiAgICAgICAgY29uc3QgaG9zdCA9IGAke25ldHdvcmt9LiR7aX1gXG4gICAgICAgIGlmICghc2Vlbi5oYXMoaG9zdCkpIGhvc3RzLnB1c2goaG9zdClcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgcG9vbChob3N0cywgYXN5bmMgaG9zdCA9PiB7XG4gICAgICBkaXNjb3ZlcnlTdGF0ZS5uZXR3b3JrID0gYCR7aG9zdC5zbGljZSgwLCBob3N0Lmxhc3RJbmRleE9mKCcuJykpfS54YFxuICAgICAgY29uc3QgcHJpbnRlciA9IGF3YWl0IHByb2JlKGhvc3QsIFJBTkdFX1BST0JFX1RJTUVPVVRfTVMsIHNpZ25hbClcbiAgICAgIGlmIChwcmludGVyICYmICFzaWduYWwuYWJvcnRlZCkgcmVtZW1iZXIocHJpbnRlcilcbiAgICB9LCBzaWduYWwpXG4gIH0gZmluYWxseSB7XG4gICAgLy8gQSBzd2VlcCB0aGF0IHdhcyByZXBsYWNlZCBsZWF2ZXMgdGhlIHN0YXRlIHRvIHRoZSBvbmUgdGhhdCByZXBsYWNlZCBpdC5cbiAgICBpZiAoc3dlZXBBYm9ydCA9PT0gY29udHJvbGxlcikge1xuICAgICAgc3dlZXBBYm9ydCA9IG51bGxcbiAgICAgIGRpc2NvdmVyeVN0YXRlLnNjYW5uaW5nID0gZmFsc2VcbiAgICAgIGRpc2NvdmVyeVN0YXRlLm5ldHdvcmsgPSAnJ1xuICAgICAgaWYgKCFzaWduYWwuYWJvcnRlZCkgZGlzY292ZXJ5U3RhdGUuZmluaXNoZWRBdCA9IERhdGUubm93KClcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2hlcyB0aGUgbmV0d29yaywgb3IgcmV0dXJucyB0aGUgc2VhcmNoIGFscmVhZHkgcnVubmluZy4gQSBzZWFyY2ggdGhhdFxuICogZmluaXNoZWQgaW4gdGhlIGxhc3QgbWludXRlIGlzIHJldXNlZCB1bmxlc3MgYGZvcmNlYCBpcyBzZXQuIGBuZWFyYnk6XG4gKiBmYWxzZWAgbGVhdmVzIG91dCB0aGUgY29uc29sZSdzIGxpc3QsIGZvciBhIGNhbGxlciB0aGF0IGFza2VkIGl0IGFscmVhZHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlclByaW50ZXJzIChmb3JjZSA9IGZhbHNlLCB7IG5lYXJieSA9IHRydWUgfTogeyBuZWFyYnk/OiBib29sZWFuIH0gPSB7fSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAocGFnZUlzU2VjdXJlKCkpIHtcbiAgICAvLyBObyBodHRwIGZyb20gYW4gaHR0cHMgcGFnZS4gVGhlIHNlcnZpY2UncyBsaXN0IGlzIGFsbCB0aGVyZSBpcyB0byBhc2s7XG4gICAgLy8gYW4gZXhwbGljaXQgc2VhcmNoIGFza3MgaXQgYWdhaW4uXG4gICAgZGlzY292ZXJ5U3RhdGUuZmluaXNoZWRBdCA9IERhdGUubm93KClcbiAgICBpZiAobmVhcmJ5IHx8IGZvcmNlKSByZXR1cm4gcmVmcmVzaENsb3VkTmVhcmJ5KCkuY2F0Y2goKCkgPT4ge30pXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gIH1cbiAgaWYgKG5lYXJieSkgcmVmcmVzaENsb3VkTmVhcmJ5KCkuY2F0Y2goKCkgPT4ge30pXG4gIC8vIEFuIGV4cGxpY2l0IHNlYXJjaCBzdGFydHMgb3ZlcjogdGhlIG9uZSBydW5uaW5nIGlzIHN0b3BwZWQsIG5vdCBqb2luZWQuXG4gIGlmIChydW5uaW5nICYmICFmb3JjZSkgcmV0dXJuIHJ1bm5pbmdcbiAgaWYgKCFmb3JjZSAmJiBEYXRlLm5vdygpIC0gZGlzY292ZXJ5U3RhdGUuZmluaXNoZWRBdCA8IEZSRVNIX0ZPUl9NUykgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gIHdhdGNoUGFnZSgpXG4gIGFib3J0U3dlZXAoKVxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpXG4gIHN3ZWVwQWJvcnQgPSBjb250cm9sbGVyXG4gIGNvbnN0IG1pbmU6IFByb21pc2U8dm9pZD4gPSBzd2VlcChjb250cm9sbGVyKS5maW5hbGx5KCgpID0+IHsgaWYgKHJ1bm5pbmcgPT09IG1pbmUpIHJ1bm5pbmcgPSBudWxsIH0pXG4gIHJ1bm5pbmcgPSBtaW5lXG4gIHJldHVybiBtaW5lXG59XG5cbmxldCByZWZyZXNoaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcblxuLyoqXG4gKiBBc2tzIGFnYWluIGV2ZXJ5IHByaW50ZXIgYWxyZWFkeSBmb3VuZCwgYW5kIGV2ZXJ5IHNhdmVkIG9uZSwgd2l0aG91dCB0aGVcbiAqIHN3ZWVwLiBBIHByaW50ZXIgdGhhdCBzdG9wcyBhbnN3ZXJpbmcgbGVhdmVzIHRoZSBsaXN0OiB0aGUgbGlzdCBzYXlzIHdoYXRcbiAqIGlzIG9uIHRoaXMgbmV0d29yayBub3csIG5vdCB3aGF0IHdhcyBvbmNlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaEtub3duUHJpbnRlcnMgKCkge1xuICBpZiAocGFnZUlzU2VjdXJlKCkpIHJldHVyblxuICBpZiAocmVmcmVzaGluZykgcmV0dXJuIHJlZnJlc2hpbmdcbiAgaWYgKHJ1bm5pbmcpIHJldHVyblxuICBjb25zdCBob3N0cyA9IFsuLi5uZXcgU2V0KFsuLi5kaXNjb3ZlcnlTdGF0ZS5mb3VuZC5mbGF0TWFwKGxhbkFkZHJlc3NlcyksIC4uLmtub3duSG9zdHMoKV0pXVxuICByZWZyZXNoaW5nID0gcG9vbChob3N0cywgYXN5bmMgaG9zdCA9PiB7XG4gICAgY29uc3QgcHJpbnRlciA9IGF3YWl0IHByb2JlKGhvc3QpXG4gICAgaWYgKHByaW50ZXIpIHJlbWVtYmVyKHByaW50ZXIpXG4gICAgZWxzZSBmb3JnZXQoaG9zdClcbiAgfSkuZmluYWxseSgoKSA9PiB7IHJlZnJlc2hpbmcgPSBudWxsIH0pXG4gIHJldHVybiByZWZyZXNoaW5nXG59XG5cbi8qKlxuICogTG9va3MgZm9yIGV2ZXJ5IGtub3duIHByaW50ZXIgb24gdGhpcyBuZXR3b3JrLCB3aGF0ZXZlciB0aGUgcGFnZSBpcyBvcGVuIG9uXG4gKiAoS0FOLTI0ODcpOiBvbiBwYWdlIGxvYWQgYW5kIHdoZW4gYSBtZW51IG9wZW5zLCBub3Qgb25seSBhZnRlciBhIHNlc3Npb25cbiAqIHRvIHRoZSBwcmludGVyIGlzIG9wZW4uIEl0IGFza3MgdGhlIHNlcnZpY2Ugd2hvIGlzIGJlc2lkZSB0aGlzIGJyb3dzZXIgKG9uZVxuICogcmVxdWVzdCwgd2hpY2ggYWxzbyByZWFkcyBlYWNoIG9mIHRob3NlIHByaW50ZXJzIGF0IG9uY2UpLCBhc2tzIGFnYWluIGV2ZXJ5XG4gKiBwcmludGVyIGFscmVhZHkgZm91bmQgb3Igc2F2ZWQsIGFuZCBzd2VlcHMgb25seSBpZiBub3RoaW5nIGhhcyBiZWVuXG4gKiBzZWFyY2hlZCB5ZXQuIEEgc2VhcmNoIHRoYXQgZmluaXNoZWQgYSBtaW51dGUgYWdvIGlzIHJldXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvb2tGb3JQcmludGVycyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG5lYXJieSA9IHJlZnJlc2hDbG91ZE5lYXJieSgpLmNhdGNoKCgpID0+IHt9KVxuICBpZiAocGFnZUlzU2VjdXJlKCkpIHJldHVybiBuZWFyYnlcbiAgLy8gUHJpbnRlcnMgYXNrZWQgYSBtaW51dGUgYWdvIGFyZSBub3QgYXNrZWQgYWdhaW4gKHRoZSBtZW51cyBvcGVuIG9mdGVuKTsgdGhlIHBhZ2VzJyBvd24gdGltZXJzIGtlZXAgdGhlbSBmcmVzaC5cbiAgaWYgKERhdGUubm93KCkgLSBkaXNjb3ZlcnlTdGF0ZS5maW5pc2hlZEF0IDwgRlJFU0hfRk9SX01TKSByZXR1cm4gbmVhcmJ5XG4gIGNvbnN0IGtub3duID0gZGlzY292ZXJ5U3RhdGUuZmluaXNoZWRBdCA/IHJlZnJlc2hLbm93blByaW50ZXJzKCkgOiBkaXNjb3ZlclByaW50ZXJzKGZhbHNlLCB7IG5lYXJieTogZmFsc2UgfSlcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtuZWFyYnksIGtub3duLmNhdGNoKCgpID0+IHt9KV0pLnRoZW4oKCkgPT4ge30pXG59XG5cbmxldCByZWFkaW5nU3RhdHVzOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcblxuLyoqXG4gKiBSZWFkcyBhZ2FpbiB3aGF0IHRoZSBwcmludGVycyBhbHJlYWR5IGZvdW5kIGFyZSBkb2luZywgb25lIHJlcXVlc3QgZWFjaDpcbiAqIGEgcHJpbnQncyBwcm9ncmVzcyBtb3ZlcyBldmVyeSBmZXcgc2Vjb25kcywgYW5kIHRoZSBmdWxsIGNoZWNrXG4gKiAoYHJlZnJlc2hLbm93blByaW50ZXJzYCkgcnVucyBvbmx5IGV2ZXJ5IDE1LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaExhblN0YXR1cyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwYWdlSXNTZWN1cmUoKSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gIGlmIChyZWFkaW5nU3RhdHVzKSByZXR1cm4gcmVhZGluZ1N0YXR1c1xuICByZWFkaW5nU3RhdHVzID0gUHJvbWlzZS5hbGwoZGlzY292ZXJ5U3RhdGUuZm91bmQubWFwKGFzeW5jIHAgPT4ge1xuICAgIGNvbnN0IGhlYWx0aCA9IGF3YWl0IHByaW50ZXJIZWFsdGgocC5hcGlVcmwpXG4gICAgaWYgKCFoZWFsdGgpIHJldHVyblxuICAgIGNvbnN0IGkgPSBkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5maW5kSW5kZXgoZiA9PiBmLmFwaVVybCA9PT0gcC5hcGlVcmwpXG4gICAgaWYgKGkgPj0gMCkgZGlzY292ZXJ5U3RhdGUuZm91bmQuc3BsaWNlKGksIDEsIHsgLi4uZGlzY292ZXJ5U3RhdGUuZm91bmRbaV0sIGhlYWx0aCB9KVxuICB9KSkudGhlbigoKSA9PiB7fSkuZmluYWxseSgoKSA9PiB7IHJlYWRpbmdTdGF0dXMgPSBudWxsIH0pXG4gIHJldHVybiByZWFkaW5nU3RhdHVzXG59XG5cbi8qKiBSZWZyZXNoZXMgdGhlIGxpbmsgc3RhdGUgb2YgdGhlIHByaW50ZXJzIGFscmVhZHkgZm91bmQuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaExpbmtTdGF0ZXMgKCkge1xuICBpZiAocGFnZUlzU2VjdXJlKCkpIHJldHVyblxuICBhd2FpdCBQcm9taXNlLmFsbChkaXNjb3ZlcnlTdGF0ZS5mb3VuZC5tYXAoYXN5bmMgcCA9PiB7XG4gICAgcmVtZW1iZXIoeyAuLi5wLCBsaW5rOiBhd2FpdCBsYW5MaW5rU3RhdHVzKHAuYXBpVXJsKSB9KVxuICB9KSlcbn1cblxuLyoqXG4gKiBBc2tzIGEgcHJpbnRlciwgdGhyb3VnaCBpdHMgb3duIE1vb25yYWtlciwgdG8gc3RhcnQgbGlua2luZywgc28gdGhhdCBpdHNcbiAqIHNjcmVlbiBzaG93cyBhIGNvZGUuIEl0IGRvZXMgbm90IHJlYWQgdGhlIGNvZGU6IGxpbmtpbmcgdGFrZXMgdGhlIGNvZGUgYXNcbiAqIHJlYWQgb2ZmIHRoZSBzY3JlZW4sIHdoaWNoIGlzIHRoZSBwcm9vZiB0aGF0IHNvbWVvbmUgaXMgYXQgdGhlIHByaW50ZXIuXG4gKlxuICogTW9vbnJha2VyIHJlZnVzZXMgYSB3cml0ZSB3aXRob3V0IGEgSlNPTiBib2R5ICg0MTUpLCBzbyB0aGlzIGFsd2F5cyBzZW5kc1xuICogb25lLiBJdCBhbnN3ZXJzIHdpdGggd2hlcmUgdGhlIGxpbmsgc3RhbmRzOiB1c3VhbGx5IGBjb25uZWN0aW5nYCwgYnV0XG4gKiBgb2ZmZXJgIG9yIGBsaW5rZWRgIHdoZW4gc29tZW9uZSBnb3QgdGhlcmUgZmlyc3QuIE1vcmUgdGhhbiBmaXZlIGFza3MgYVxuICogbWludXRlIGZyb20gb25lIGFkZHJlc3MgaXMgYSA0MjkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzaG93TGFuQ29kZSAoYXBpVXJsOiBzdHJpbmcpOiBQcm9taXNlPExhbkxpbmtTdGF0dXM+IHtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKVxuICBjb25zdCB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgNTAwMClcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGxhbkZldGNoKGAke2FwaVVybH0vc2VydmVyL211b24vbGluay9zdGFydGAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiAne30nLFxuICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbFxuICAgIH0pXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJpbnRlciBoYXMgYmVlbiBhc2tlZCBmb3IgYSBjb2RlIHRvbyBtYW55IHRpbWVzLiBXYWl0IGEgbWludXRlLCB0aGVuIHRyeSBhZ2Fpbi4nKVxuICAgIH1cbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYm9keT8uZXJyb3I/Lm1lc3NhZ2UgPz8gYFRoZSBwcmludGVyIHJlZnVzZWQgdG8gc3RhcnQgbGlua2luZyAoSFRUUCAke3Jlc3BvbnNlLnN0YXR1c30pLmApXG4gICAgfVxuICAgIGNvbnN0IHN0YXR1cyA9IGJvZHk/LnJlc3VsdCA/PyBib2R5XG4gICAgcmV0dXJuIHN0YXR1cyAmJiB0eXBlb2Ygc3RhdHVzLnBoYXNlID09PSAnc3RyaW5nJyA/IHN0YXR1cyA6IHsgcGhhc2U6ICdjb25uZWN0aW5nJyB9XG4gIH0gZmluYWxseSB7XG4gICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcilcbiAgfVxufVxuXG4vKipcbiAqIFdoYXQgdG8gdGVsbCB0aGUgcGVyc29uIGFmdGVyIGFza2luZyBhIHByaW50ZXIgZm9yIGEgY29kZS4gYGVycm9yYCBpcyBzZXRcbiAqIHdoZW4gdGhlcmUgaXMgbm90aGluZyBmb3IgdGhlbSB0byB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFuQ29kZU91dGNvbWUgKG5hbWU6IHN0cmluZywgc3RhdHVzOiBMYW5MaW5rU3RhdHVzKTogeyBub3RlPzogc3RyaW5nLCBlcnJvcj86IHN0cmluZyB9IHtcbiAgc3dpdGNoIChzdGF0dXMucGhhc2UpIHtcbiAgICBjYXNlICdvZmZlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBub3RlOiBgJHtuYW1lfSBpcyBhbHJlYWR5IGFza2luZyBvbiBpdHMgc2NyZWVuIHdoZXRoZXIgdG8gbGluayB0byAke3N0YXR1cy5hY2NvdW50IHx8ICdhbiBhY2NvdW50J30uIGAgK1xuICAgICAgICAgICdBY2NlcHQgb3IgZGVjbGluZSBpdCB0aGVyZS4nXG4gICAgICB9XG4gICAgY2FzZSAnbGlua2VkJzpcbiAgICAgIHJldHVybiB7IGVycm9yOiBgJHtuYW1lfSBpcyBhbHJlYWR5IGxpbmtlZCB0byBhbiBhY2NvdW50LiBJdHMgb3duZXIgbXVzdCB1bmxpbmsgaXQgZmlyc3QuYCB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7IG5vdGU6IGAke25hbWV9IGlzIHNob3dpbmcgYSBjb2RlIG9uIGl0cyBzY3JlZW4gbm93LiBUeXBlIGl0IGJlbG93LmAgfVxuICB9XG59XG5cbi8qKlxuICogQSBGbHVpZGQgaW5zdGFuY2UgZm9yIGEgcHJpbnRlciBvbiB0aGUgbmV0d29yay4gQ29ubmVjdGluZyB0byBpdCBpcyBhIGxvY2FsXG4gKiBjb25uZWN0aW9uLCBvcGVuIHRvIGFueW9uZSBvbiB0aGUgbmV0d29yazogYW4gb3BlbiBwcmludGVyIGxldHMgdGhlbVxuICogc3RyYWlnaHQgaW4sIGFuZCBvbmUgd2l0aCBhIHBhc3N3b3JkIGFza3MgZm9yIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFuY2VGb3JIb3N0IChob3N0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZW5kcG9pbnRJZD86IHN0cmluZyB8IG51bGwsIG1kbnNIb3N0Pzogc3RyaW5nIHwgbnVsbCk6IEluc3RhbmNlQ29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuICAgIGFwaVVybDogYXBpVXJsRm9yKGhvc3QpLFxuICAgIHNvY2tldFVybDogYHdzOi8vJHtob3N0fS93ZWJzb2NrZXRgLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAuLi4oZW5kcG9pbnRJZCA/IHsgZW5kcG9pbnRJZCB9IDoge30pLFxuICAgIC4uLihtZG5zSG9zdCAmJiBtZG5zSG9zdCAhPT0gaG9zdCA/IHsgbWRuc0hvc3QgfSA6IHt9KVxuICB9XG59XG5cbi8qKiBBIEZsdWlkZCBpbnN0YW5jZSBmb3IgYSBwcmludGVyIHRoZSBMQU4gc2VhcmNoIGZvdW5kLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbmNlRm9yIChwcmludGVyOiBMYW5QcmludGVyKTogSW5zdGFuY2VDb25maWcge1xuICByZXR1cm4gaW5zdGFuY2VGb3JIb3N0KHByaW50ZXIuaG9zdCwgcHJpbnRlci5uYW1lLCBwcmludGVyLmVuZHBvaW50SWQsIHByaW50ZXIubWRuc0hvc3QpXG59XG5cbi8qKlxuICogV2hldGhlciBhIHByaW50ZXIgZm91bmQgb24gdGhlIExBTiBjYW4gc2hvdyBhIGxpbmsgY29kZSBub3csIGFuZCB3aGF0IHRvXG4gKiB0ZWxsIHRoZSBwZXJzb24gd2hlbiBpdCBjYW5ub3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5MaW5rQXZhaWxhYmlsaXR5IChsaW5rOiBMYW5MaW5rU3RhdHVzKTogeyBjYW5TaG93OiBib29sZWFuLCBub3RlOiBzdHJpbmcgfSB7XG4gIHN3aXRjaCAobGluay5waGFzZSkge1xuICAgIGNhc2UgJ3VubGlua2VkJzpcbiAgICAgIHJldHVybiB7IGNhblNob3c6IHRydWUsIG5vdGU6ICdub3QgbGlua2VkIMK3IHNob3cgaXRzIGNvZGUnIH1cbiAgICBjYXNlICdjb2RlJzpcbiAgICAgIHJldHVybiB7IGNhblNob3c6IHRydWUsIG5vdGU6ICdzaG93aW5nIGEgY29kZSBvbiBpdHMgc2NyZWVuIG5vdycgfVxuICAgIGNhc2UgJ2ZhaWxlZCc6XG4gICAgICByZXR1cm4geyBjYW5TaG93OiB0cnVlLCBub3RlOiBsaW5rLm1lc3NhZ2UgPyBgbGFzdCB0cnkgZmFpbGVkOiAke2xpbmsubWVzc2FnZX1gIDogJ2xhc3QgdHJ5IGZhaWxlZCDCtyB0cnkgYWdhaW4nIH1cbiAgICBjYXNlICdjb25uZWN0aW5nJzpcbiAgICAgIHJldHVybiB7IGNhblNob3c6IGZhbHNlLCBub3RlOiAnZ2V0dGluZyBhIGNvZGUgZnJvbSBNdW9uM0TigKYnIH1cbiAgICBjYXNlICdvZmZlcic6XG4gICAgICByZXR1cm4geyBjYW5TaG93OiBmYWxzZSwgbm90ZTogJ3dhaXRpbmcgZm9yIGNvbmZpcm1hdGlvbiBvbiBpdHMgc2NyZWVuJyB9XG4gICAgY2FzZSAnbGlua2VkJzpcbiAgICAgIHJldHVybiB7IGNhblNob3c6IGZhbHNlLCBub3RlOiAnbGlua2VkIHRvIGFuIGFjY291bnQgwrcgaXRzIG93bmVyIG11c3QgdW5saW5rIGl0IGZpcnN0JyB9XG4gICAgY2FzZSAndW5zdXBwb3J0ZWQnOlxuICAgICAgcmV0dXJuIHsgY2FuU2hvdzogZmFsc2UsIG5vdGU6ICdpdHMgTXVvbk9TIGRvZXMgbm90IGluY2x1ZGUgYWNjb3VudCBsaW5raW5nIHlldCcgfVxuICAgIGNhc2UgJ3VuYXZhaWxhYmxlJzpcbiAgICAgIHJldHVybiB7IGNhblNob3c6IGZhbHNlLCBub3RlOiAnbm90IHNldCB1cCB0byBsaW5rIHRvIGEgTXVvbjNEIGFjY291bnQnIH1cbiAgICBjYXNlICd1bnJlYWNoYWJsZSc6XG4gICAgICByZXR1cm4geyBjYW5TaG93OiBmYWxzZSwgbm90ZTogJ2NvdWxkIG5vdCByZWFkIGl0cyBsaW5rIHN0YXR1cyBmcm9tIHRoaXMgYnJvd3NlcicgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4geyBjYW5TaG93OiBmYWxzZSwgbm90ZTogJ2Nhbm5vdCBsaW5rIGZyb20gaGVyZSByaWdodCBub3cnIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFpQ0EsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sV0FBVztBQUVsQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGNBQWMsa0JBQXNDO0FBK0U3RCxNQUFNLGtCQUFrQjtBQUFBLEVBQ3RCO0FBQUEsRUFBYTtBQUFBLEVBQWE7QUFBQSxFQUFVO0FBQUEsRUFBYTtBQUFBLEVBQWM7QUFBQSxFQUMvRDtBQUFBLEVBQWE7QUFBQSxFQUFjO0FBQUEsRUFBVTtBQUFBLEVBQWE7QUFBQSxFQUFjO0FBQ2xFO0FBR0EsTUFBTSwwQkFBMEI7QUFFaEMsTUFBTSxtQkFBbUI7QUFDekIsTUFBTSxxQkFBcUI7QUFDM0IsTUFBTSxxQkFBcUI7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