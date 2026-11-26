import { Globals } from "/src/globals.ts";
import { isPrinter } from "/src/services/muon-ble/nearby.ts";
import { heardRecently } from "/src/services/muon-ble/heard.ts";
import {
  lanAddresses,
  sameExactName,
  sameLanPrinter
} from "/src/services/muon-cloud/discovery.ts";
import { searchRows } from "/src/services/muon-cloud/searchRows.ts";
import { consolePresence } from "/src/services/muon-cloud/presence.ts";
import { knownReachable, secureNameOf } from "/src/services/secure-origin/hosted.ts";
import { faultSummary } from "/src/services/machine-faults/faults.ts";
export function hasReachableRoute(printer, src) {
  const id = printer.endpointId;
  const secureName = secureNameOf(src.account.find((p) => p.id === id));
  return !!(src.found.some((l) => id && l.endpointId ? l.endpointId === id : !!printer.apiUrl && lanAddresses(l).includes(hostOf(printer.apiUrl))) || secureName && knownReachable(secureName, src.now) || id && (src.status[id]?.reachable || src.account.some((p) => p.id === id && p.online) || src.cloudNearby.some((p) => p.printerId === id) || src.viaBluetooth?.(id) || src.nearby.some((p) => isPrinter(p, id) && heardRecently(p, src.now))));
}
export function savedName(s) {
  const name = (s.name ?? "").trim();
  if (name && name !== Globals.APP_NAME) return name;
  if (s.mdnsHost) return s.mdnsHost.replace(/\.local\.?$/i, "");
  return hostOf(s.apiUrl);
}
export function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
function lanAt(found, host) {
  return found.find((l) => lanAddresses(l).includes(host));
}
function lanForSaved(found, s) {
  if (s.endpointId) {
    const byId = found.find((l) => l.endpointId === s.endpointId);
    if (byId) return byId;
  }
  const byHost = lanAt(found, hostOf(s.apiUrl));
  if (byHost && s.endpointId && byHost.endpointId && byHost.endpointId !== s.endpointId) return void 0;
  if (byHost || s.endpointId) return byHost;
  return found.find((l) => sameExactName(l.name, s.name));
}
function fromLanHealth(h) {
  if (!h) return "available";
  return h.state === "ready" ? "online" : h.state;
}
export function healthLabel(h) {
  switch (h) {
    case "online":
      return "Online";
    case "printing":
      return "Printing";
    case "paused":
      return "Paused";
    case "connecting":
      return "Connecting…";
    case "reconnecting":
      return "Reconnecting…";
    case "searching":
      return "Looking for it…";
    case "offline":
      return "Offline";
    case "error":
      return "Error";
    case "locked":
      return "Needs access";
    case "available":
      return "On this network";
    case "nearby":
      return "Nearby · Bluetooth";
  }
}
export function cloudHealth(online, s, lastSeen = 0) {
  const presence = consolePresence({ online, last_seen: lastSeen });
  if (presence !== "online") return presence;
  if (!s) return "connecting";
  if (!s.reachable && s.error === "reconnecting") return "reconnecting";
  if (!s.reachable) return s.error === "offline" ? "offline" : s.error === "refused" ? "locked" : "error";
  if (s.state === "printing") return "printing";
  if (s.state === "paused") return "paused";
  if (s.state === "error" || s.state?.startsWith("klipper")) return "error";
  if (s.faults?.length) return "error";
  return "online";
}
function linkedFrom(lan, email) {
  if (!lan) return "unknown";
  const { phase, account } = lan.link;
  if (phase === "linked") return account && email && account === email ? "mine" : "other";
  if (phase === "unlinked" || phase === "code" || phase === "failed") return "none";
  return "unknown";
}
function cloudLinkedTo(nearby, endpointId) {
  const id = endpointId?.toLowerCase();
  const c = id ? nearby.find((n) => n.printerId.toLowerCase() === id) : void 0;
  return c?.linked ? "other" : "unknown";
}
function lanDetail(lan) {
  const h = lan.health;
  const state = h ? h.message ?? healthLabel(fromLanHealth(h)) : "On this network";
  return `${state} · ${lan.host}`;
}
export function foreignEntries(list) {
  return list.map(({ record, status }) => ({
    key: `foreign:${record.id}`,
    section: "foreign",
    name: record.name,
    endpointId: null,
    health: status?.state === "printing" ? "printing" : status?.state === "paused" ? "paused" : status?.state === "idle" ? "online" : status?.state ?? "connecting",
    detail: status?.message ?? (status?.state === "idle" ? "Ready" : status?.state ?? "Connecting"),
    host: record.host,
    active: null,
    linkedTo: "none",
    saved: [],
    foreign: { record, status }
  }));
}
const NEARBY_DETAIL = "Nearby · Bluetooth";
export function printerDirectory(src) {
  const now = src.now ?? Date.now();
  const heard = (n) => heardRecently(n, now);
  const claimedLan = /* @__PURE__ */ new Set();
  const claimedSaved = /* @__PURE__ */ new Set();
  const claimedNearby = /* @__PURE__ */ new Set();
  const activeLocal = src.local?.apiUrl ?? null;
  const besideBrowser = (endpointId) => {
    const name = secureNameOf(src.account.find((p) => p.id === endpointId));
    return !!endpointId && (src.cloudNearby.some((c) => c.printerId.toLowerCase() === endpointId.toLowerCase()) || !!name && knownReachable(name, now));
  };
  const nearbyFor = (endpointId) => {
    if (!endpointId) return void 0;
    const p = src.nearby.find((n) => !claimedNearby.has(n) && isPrinter(n, endpointId));
    if (p) claimedNearby.add(p);
    return p;
  };
  const cloud = src.account.map((c) => {
    const lan = src.found.find((l) => !claimedLan.has(l) && sameLanPrinter(l, c.id, c.name));
    if (lan) claimedLan.add(lan);
    const saved = src.saved.filter((s) => s.endpointId === c.id || !!lan && lanForSaved([lan], s) === lan);
    saved.forEach((s) => claimedSaved.add(s));
    const localActive = !!activeLocal && saved.some((s) => s.apiUrl === activeLocal);
    const active = src.activeCloudId === c.id ? "cloud" : localActive ? "local" : null;
    const status = src.status[c.id];
    const route = status?.reachable && src.viaBluetooth?.(c.id) ? "bluetooth" : void 0;
    let health = cloudHealth(c.online || !!route, status, c.last_seen);
    let detail = route ? `${cloudDetail(true, status, c.last_seen)} · via Bluetooth` : cloudDetail(c.online, status, c.last_seen);
    if (active === "local" && src.local) {
      health = src.local.health;
      detail = `${src.local.detail} · connected locally`;
    } else if (lan && health === "offline") {
      health = fromLanHealth(lan.health);
      detail = `${lanDetail(lan)} · on this network`;
    } else if (lan || besideBrowser(c.id)) {
      detail = `${detail} · on this network`;
    }
    const nearby = nearbyFor(c.id);
    if (health === "offline" && heard(nearby)) {
      health = "nearby";
      detail = NEARBY_DETAIL;
    }
    return {
      key: `cloud:${c.id}`,
      section: "cloud",
      name: c.name,
      endpointId: c.id,
      health,
      detail,
      host: lan?.host ?? null,
      active,
      linkedTo: "mine",
      cloud: c,
      saved,
      lan,
      route,
      nearby
    };
  });
  const local = [];
  for (const s of src.saved) {
    if (claimedSaved.has(s)) continue;
    const lan = lanForSaved(src.found, s);
    const endpointId = s.endpointId ?? lan?.endpointId ?? null;
    const same = local.find((e) => !!endpointId && e.endpointId === endpointId || !!lan && e.lan === lan);
    if (same) {
      same.saved.push(s);
      if (s.apiUrl === activeLocal) same.active = "local";
      continue;
    }
    if (lan) claimedLan.add(lan);
    const active = endpointId && src.activeCloudId === endpointId ? "cloud" : s.apiUrl === activeLocal ? "local" : null;
    const nearby = nearbyFor(endpointId);
    let health;
    let detail;
    if (active && src.local) {
      health = src.local.health;
      detail = src.local.detail;
    } else if (lan) {
      health = fromLanHealth(lan.health);
      detail = lanDetail(lan);
    } else if (besideBrowser(endpointId)) {
      health = "available";
      detail = "On this network";
    } else if (heard(nearby)) {
      health = "nearby";
      detail = NEARBY_DETAIL;
    } else {
      health = src.searching ? "searching" : "offline";
      detail = src.searching ? "Looking for it on this network…" : "Not found on this network";
    }
    local.push({
      key: `local:${s.apiUrl}`,
      section: "local",
      name: lan?.name ?? savedName(s),
      endpointId,
      health,
      detail,
      host: lan?.host ?? null,
      active,
      // No LAN probe on the hosted page: the service's nearby list still says whether someone has linked it.
      linkedTo: lan ? linkedFrom(lan, src.email) : cloudLinkedTo(src.cloudNearby, endpointId),
      saved: [s],
      lan,
      nearby
    });
  }
  for (const e of local) {
    if (e.active && src.local && e.health !== src.local.health) {
      e.health = src.local.health;
      e.detail = src.local.detail;
    }
  }
  const listedIds = new Set([...cloud, ...local].map((e) => e.endpointId).filter((id) => !!id));
  const rows = searchRows({
    found: src.found.filter((l) => !claimedLan.has(l) && !(l.endpointId && listedIds.has(l.endpointId))),
    cloud: src.cloudNearby.filter((c) => !listedIds.has(c.printerId) && ![...claimedLan].some((l) => sameLanPrinter(l, c.printerId, c.name))),
    nearby: src.nearby.filter((n) => !claimedNearby.has(n) && ![...listedIds].some((id) => isPrinter(n, id))),
    // Account printers are listed already; Discovery shows only what is not.
    account: [],
    email: src.email
  });
  const found = rows.map((row) => {
    const linkedTo = row.linked ? row.lan ? linkedFrom(row.lan, src.email) : "other" : row.lan || row.cloudId ? "none" : "unknown";
    return {
      key: `found:${row.key}`,
      section: "found",
      name: row.name,
      endpointId: row.lan?.endpointId ?? row.cloudId ?? row.nearby?.endpointId ?? null,
      health: row.lan ? fromLanHealth(row.lan.health) : "available",
      detail: row.meta,
      host: row.host,
      active: null,
      linkedTo,
      saved: [],
      lan: row.lan,
      nearby: row.nearby,
      row
    };
  });
  for (const e of [...cloud, ...local, ...found]) {
    const id = e.cloud?.id ?? e.endpointId;
    const carrying = !!id && !!src.viaBluetooth?.(id);
    if (carrying) e.route = "bluetooth";
    if (e.health !== "offline" && !(carrying && e.health === "searching")) continue;
    if (!hasReachableRoute({ endpointId: id, apiUrl: e.saved[0]?.apiUrl ?? e.lan?.apiUrl }, src)) continue;
    const status = id ? src.status[id] : void 0;
    if (carrying || status?.reachable) {
      e.health = status?.reachable ? cloudHealth(true, status) : "online";
      e.detail = `${status?.reachable ? cloudDetail(true, status) : "Connected"}${carrying ? " · via Bluetooth" : ""}`;
    } else if (heard(e.nearby)) {
      e.health = "nearby";
      e.detail = NEARBY_DETAIL;
    } else {
      e.health = "available";
      e.detail = e.lan || besideBrowser(id) ? "On this network" : "Available through Muon3D";
    }
  }
  const foreign = foreignEntries(src.foreign ?? []);
  return { cloud, local, found, foreign };
}
export function cloudDetail(online, s, lastSeen = 0) {
  const presence = consolePresence({ online, last_seen: lastSeen });
  if (presence !== "online") return healthLabel(presence);
  if (!s) return "Connecting through Muon3D…";
  if (!s.reachable && s.error === "reconnecting") return "Reconnecting…";
  if (!s.reachable) return s.error === "offline" ? "Offline" : s.error === "refused" ? "Needs access" : `Unreachable: ${s.error}`;
  const state = (s.state ?? "unknown").replace(/^\w/, (c) => c.toUpperCase());
  if (s.state === "printing" || s.state === "paused") {
    const percent = Math.round((s.progress ?? 0) * 100);
    return `${state} · ${percent}%${s.filename ? ` · ${s.filename}` : ""}`;
  }
  const fault = faultSummary(s.faults);
  return fault ? `${fault} � ${state}` : state;
}
export function savedUpdates(saved, found, blocked = false) {
  const updates = [];
  for (const s of saved) {
    if (s.active) continue;
    const lan = lanForSaved(found, s);
    if (!lan?.endpointId) continue;
    const changes = {};
    if (!s.endpointId) changes.endpointId = lan.endpointId;
    if (lan.mdnsHost && s.mdnsHost !== lan.mdnsHost) changes.mdnsHost = lan.mdnsHost;
    const host = hostOf(s.apiUrl);
    const savedByIp = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host);
    const ipNow = lanAddresses(lan).find((a) => /^\d{1,3}(\.\d{1,3}){3}$/.test(a));
    const nameNow = lanAddresses(lan).find((a) => a.endsWith(".local"));
    if (savedByIp && ipNow && !lanAddresses(lan).includes(host)) {
      changes.apiUrl = `http://${ipNow}`;
      changes.socketUrl = `ws://${ipNow}/websocket`;
    } else if (savedByIp && blocked && nameNow) {
      changes.apiUrl = `http://${nameNow}`;
      changes.socketUrl = `ws://${nameNow}/websocket`;
    }
    if (Object.keys(changes).length) updates.push({ apiUrl: s.apiUrl, changes });
  }
  return updates;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpcmVjdG9yeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoZSBwcmludGVyIGxpc3QgaW4gdGhlIHNpZGUgcGFuZWw6IG9uZSBlbnRyeSBwZXIgcHJpbnRlciwgaW4gdGhyZWUgZ3JvdXBzLlxuICpcbiAqIC0gKipDbG91ZCoqOiB0aGUgcHJpbnRlcnMgbGlua2VkIHRvIHRoZSBzaWduZWQtaW4gYWNjb3VudC4gVGhlIGFjY291bnQga2VlcHNcbiAqICAgdGhlbSwgc28gdGhleSBsaXN0IHdoZXRoZXIgb3Igbm90IHRoaXMgYnJvd3NlciBjYW4gc2VlIHRoZW0gbm93LiBPbmUgdGhhdFxuICogICBpcyBhbHNvIG9uIHRoaXMgbmV0d29yayBjYW4gYmUgb3BlbmVkIGxvY2FsbHkgZnJvbSBpdHMgY2FyZC5cbiAqIC0gKipMb2NhbCoqOiBwcmludGVycyBzYXZlZCBpbiB0aGlzIGJyb3dzZXIgdGhhdCBhcmUgbm90IGluIHRoZSBhY2NvdW50LiBBXG4gKiAgIHNhdmVkIHByaW50ZXIgdGhhdCB0dXJucyBvdXQgdG8gYmUgaW4gdGhlIGFjY291bnQgbGlzdHMgdW5kZXIgQ2xvdWQgb25seS5cbiAqIC0gKipEaXNjb3ZlcnkqKjogd2hhdCBpcyBvbiB0aGlzIG5ldHdvcmsgb3IgbmVhcmJ5IG5vdyBhbmQgaW4gbmVpdGhlciBncm91cC5cbiAqXG4gKiBPbmUgcHJpbnRlciBpcyBvbmUgZW50cnksIGhvd2V2ZXIgbWFueSB3YXlzIGl0IGlzIHNlZW4uIFRoZSBqb2luIGtleSBpcyB0aGVcbiAqIElyb2ggRW5kcG9pbnRJZDogdGhlIHNlcnZpY2UgbmFtZXMgYSBwcmludGVyIGJ5IGl0LCBgL3NlcnZlci9tdW9uL2lkZW50aXR5YFxuICogcHVibGlzaGVzIGl0IChLQU4tNDAzKSwgYW5kIHRoZSBCbHVldG9vdGggYWR2ZXJ0aXNlbWVudCBzdGFydHMgd2l0aCBpdC4gQW5cbiAqIGFkZHJlc3MgaXMgb25seSBhIGZhbGxiYWNrIGZvciBzb2Z0d2FyZSB0aGF0IHByZWRhdGVzIHRoZSBmaWVsZCwgYW5kIGEgbmFtZVxuICogaXMgdGhlIGxhc3QgcmVzb3J0LCBhcyBpbiBgc2VhcmNoUm93c2AuXG4gKi9cbmltcG9ydCB0eXBlIHsgSW5zdGFuY2VDb25maWcgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgeyBpc1ByaW50ZXIsIHR5cGUgTmVhcmJ5UHJpbnRlciB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbmVhcmJ5J1xuaW1wb3J0IHsgaGVhcmRSZWNlbnRseSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvaGVhcmQnXG5pbXBvcnQgdHlwZSB7IENsb3VkUHJpbnRlciB9IGZyb20gJy4vYXBpJ1xuaW1wb3J0IHR5cGUgeyBQcmludGVyU3RhdHVzIH0gZnJvbSAnLi9zdGF0ZSdcbmltcG9ydCB0eXBlIHsgRm9yZWlnblByaW50ZXJSZWNvcmQsIEZvcmVpZ25TdGF0dXMgfSBmcm9tICdAL3NlcnZpY2VzL2ZvcmVpZ24tcHJpbnRlcnMvdHlwZXMnXG5pbXBvcnQge1xuICBsYW5BZGRyZXNzZXMsXG4gIHNhbWVFeGFjdE5hbWUsXG4gIHNhbWVMYW5QcmludGVyLFxuICB0eXBlIENsb3VkTmVhcmJ5UHJpbnRlcixcbiAgdHlwZSBMYW5IZWFsdGgsXG4gIHR5cGUgTGFuUHJpbnRlclxufSBmcm9tICcuL2Rpc2NvdmVyeSdcbmltcG9ydCB7IHNlYXJjaFJvd3MsIHR5cGUgU2VhcmNoUm93IH0gZnJvbSAnLi9zZWFyY2hSb3dzJ1xuaW1wb3J0IHsgY29uc29sZVByZXNlbmNlIH0gZnJvbSAnLi9wcmVzZW5jZSdcbmltcG9ydCB7IGtub3duUmVhY2hhYmxlLCBzZWN1cmVOYW1lT2YgfSBmcm9tICdAL3NlcnZpY2VzL3NlY3VyZS1vcmlnaW4vaG9zdGVkJ1xuaW1wb3J0IHsgZmF1bHRTdW1tYXJ5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWNoaW5lLWZhdWx0cy9mYXVsdHMnXG5cbi8qKlxuICogV2hhdCB0aGUgc3RhdHVzIGljb24gc2F5czpcbiAqIC0gYG9ubGluZWA6IGl0IGFuc3dlcmVkLCBhbmQgS2xpcHBlciBpcyByZWFkeS5cbiAqIC0gYHByaW50aW5nYCwgYHBhdXNlZGA6IGFzIEtsaXBwZXIgc2F5cy5cbiAqIC0gYGNvbm5lY3RpbmdgOiBiZWluZyByZWFjaGVkIG5vdy5cbiAqIC0gYHNlYXJjaGluZ2A6IG5vIGFuc3dlciB5ZXQsIGFuZCB0aGUgc2VhcmNoIGlzIHN0aWxsIHJ1bm5pbmcuXG4gKiAtIGBvZmZsaW5lYDogbm8gYW5zd2VyLlxuICogLSBgZXJyb3JgOiBpdCBhbnN3ZXJlZCwgYW5kIEtsaXBwZXIgaXMgbm90IHJlYWR5LCBvciB0aGUgY29ubmVjdGlvbiBmYWlsZWQuXG4gKiAtIGBsb2NrZWRgOiBpdCBhbnN3ZXJlZCwgYW5kIHdhbnRzIGEgc2lnbi1pbiBvciByZWZ1c2VzIHRoaXMgYnJvd3Nlci5cbiAqIC0gYGF2YWlsYWJsZWA6IGZvdW5kLCBhbmQgaXRzIHN0YXRlIHdhcyBub3QgcmVhZCAoRGlzY292ZXJ5IHJvd3MpLlxuICogLSBgbmVhcmJ5YDogbm90IHJlYWNoYWJsZSBieSBhbnkgb3RoZXIgd2F5LCBidXQgaXRzIEJsdWV0b290aCBhZHZlcnQgd2FzIGhlYXJkXG4gKiAgIGluIHRoZSBsYXN0IDMwIHMsIHNvIGl0IGlzIGhlcmUgYW5kIEJsdWV0b290aCBjYW4gb3BlbiBpdCAoS0FOLTI1MjgpLlxuICovXG5leHBvcnQgdHlwZSBQcmludGVySGVhbHRoID1cbiAgJ29ubGluZScgfCAncHJpbnRpbmcnIHwgJ3BhdXNlZCcgfCAnY29ubmVjdGluZycgfCAncmVjb25uZWN0aW5nJyB8ICdzZWFyY2hpbmcnIHwgJ29mZmxpbmUnIHwgJ2Vycm9yJyB8ICdsb2NrZWQnIHwgJ2F2YWlsYWJsZScgfCAnbmVhcmJ5J1xuXG5leHBvcnQgdHlwZSBEaXJlY3RvcnlTZWN0aW9uID0gJ2Nsb3VkJyB8ICdsb2NhbCcgfCAnZm91bmQnIHwgJ2ZvcmVpZ24nXG5cbi8qKiBXaG8gdGhlIHByaW50ZXIgaXMgbGlua2VkIHRvLCBhcyBmYXIgYXMgdGhpcyBicm93c2VyIGtub3dzLiAqL1xuZXhwb3J0IHR5cGUgTGlua2VkVG8gPSAnbWluZScgfCAnb3RoZXInIHwgJ25vbmUnIHwgJ3Vua25vd24nXG5cbi8qKiBTb21ldGhpbmcgYSBwcmludGVyJ3MgbWVudSBvZmZlcnM6IG9wZW4gaXQgbG9jYWxseSwgbGluayBpdCwgYXNrIGZvciBhY2Nlc3MuICovXG5leHBvcnQgaW50ZXJmYWNlIENhcmRBY3Rpb24ge1xuICBpZDogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBpY29uOiBzdHJpbmc7XG4gIGhpbnQ/OiBzdHJpbmc7XG4gIGRpc2FibGVkPzogYm9vbGVhbjtcbiAgZGFuZ2VyPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaXJlY3RvcnlFbnRyeSB7XG4gIGtleTogc3RyaW5nO1xuICBzZWN0aW9uOiBEaXJlY3RvcnlTZWN0aW9uO1xuICBuYW1lOiBzdHJpbmc7XG4gIGVuZHBvaW50SWQ6IHN0cmluZyB8IG51bGw7XG4gIGhlYWx0aDogUHJpbnRlckhlYWx0aDtcbiAgLyoqIFRoZSBsaW5lIHVuZGVyIHRoZSBuYW1lLiAqL1xuICBkZXRhaWw6IHN0cmluZztcbiAgLyoqIEl0cyBhZGRyZXNzIG9uIHRoaXMgbmV0d29yayBub3csIHdoZW4gaXQgYW5zd2VyZWQgb24gb25lLiAqL1xuICBob3N0OiBzdHJpbmcgfCBudWxsO1xuICAvKiogV2hpY2ggY29ubmVjdGlvbiBGbHVpZGQgaXMgc2hvd2luZyBpdCB0aHJvdWdoIG5vdy4gKi9cbiAgYWN0aXZlOiAnY2xvdWQnIHwgJ2xvY2FsJyB8IG51bGw7XG4gIGxpbmtlZFRvOiBMaW5rZWRUbztcbiAgY2xvdWQ/OiBDbG91ZFByaW50ZXI7XG4gIC8qKiBTYXZlZCBlbnRyaWVzIGZvciB0aGlzIHByaW50ZXIuIE1vcmUgdGhhbiBvbmUgd2hlbiBpdCB3YXMgc2F2ZWQgYXQgc2V2ZXJhbCBhZGRyZXNzZXMuICovXG4gIHNhdmVkOiBJbnN0YW5jZUNvbmZpZ1tdO1xuICBsYW4/OiBMYW5QcmludGVyO1xuICAvKiogSGVhcmQgb3ZlciBCbHVldG9vdGguICovXG4gIG5lYXJieT86IE5lYXJieVByaW50ZXI7XG4gIC8qKiBUaGUgdHJhbnNwb3J0IEZsdWlkZCBpcyByZWFsbHkgdXNpbmcgZm9yIGl0LCB3aGVuIHRoYXQgaXMgQmx1ZXRvb3RoIChJLTEzMykuICovXG4gIHJvdXRlPzogJ2JsdWV0b290aCc7XG4gIC8qKiBEaXNjb3Zlcnkgb25seTogdGhlIHJvdyB0aGUgd2VsY29tZSBwYWdlIHdvdWxkIHNob3csIHdpdGggaXRzIGFjdGlvbi4gKi9cbiAgcm93PzogU2VhcmNoUm93O1xuICBmb3JlaWduPzogeyByZWNvcmQ6IEZvcmVpZ25QcmludGVyUmVjb3JkLCBzdGF0dXM6IEZvcmVpZ25TdGF0dXMgfCBudWxsIH07XG59XG5cbi8qKiBUaGUgcHJpbnRlciBGbHVpZGQgaXMgY29ubmVjdGVkIHRvIGxvY2FsbHksIHJlYWQgZnJvbSBpdHMgb3duIHNvY2tldC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9jYWxMaXZlIHtcbiAgYXBpVXJsOiBzdHJpbmc7XG4gIGhlYWx0aDogUHJpbnRlckhlYWx0aDtcbiAgZGV0YWlsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0b3J5U291cmNlcyB7XG4gIGFjY291bnQ6IENsb3VkUHJpbnRlcltdO1xuICBzdGF0dXM6IFJlY29yZDxzdHJpbmcsIFByaW50ZXJTdGF0dXM+O1xuICBlbWFpbDogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFNhdmVkIGxvY2FsIHByaW50ZXJzLCB3aXRob3V0IHRoZSBjbG91ZCBwbGFjZWhvbGRlci4gKi9cbiAgc2F2ZWQ6IEluc3RhbmNlQ29uZmlnW107XG4gIGZvdW5kOiBMYW5QcmludGVyW107XG4gIGNsb3VkTmVhcmJ5OiBDbG91ZE5lYXJieVByaW50ZXJbXTtcbiAgbmVhcmJ5OiBOZWFyYnlQcmludGVyW107XG4gIGFjdGl2ZUNsb3VkSWQ6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBXaGV0aGVyIHRoaXMgcHJpbnRlciBpcyByZWFjaGVkIG92ZXIgQmx1ZXRvb3RoIG5vdzogaXRzIGJvdW5kIHRyYW5zcG9ydCwgbm90IHRoZSBjb25zb2xlJ3Mgd29yZC4gKi9cbiAgdmlhQmx1ZXRvb3RoPzogKHByaW50ZXJJZDogc3RyaW5nKSA9PiBib29sZWFuO1xuICAvKiogTnVsbCB3aGlsZSBhIGNsb3VkIHByaW50ZXIgaXMgc2hvd24uICovXG4gIGxvY2FsOiBMb2NhbExpdmUgfCBudWxsO1xuICAvKiogVGhlIHNlYXJjaCBpcyBzdGlsbCBydW5uaW5nLCBzbyBhIHByaW50ZXIgd2l0aCBubyBhbnN3ZXIgbWF5IHlldCBhbnN3ZXIuICovXG4gIHNlYXJjaGluZzogYm9vbGVhbjtcbiAgLyoqIFRoZSB0aW1lIHRvIGp1ZGdlIEJsdWV0b290aCBzaWdodGluZ3MgYWdhaW5zdDsgbm93IHdoZW4gb21pdHRlZC4gKi9cbiAgbm93PzogbnVtYmVyO1xuICBmb3JlaWduPzogQXJyYXk8eyByZWNvcmQ6IEZvcmVpZ25QcmludGVyUmVjb3JkLCBzdGF0dXM6IEZvcmVpZ25TdGF0dXMgfCBudWxsIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdG9yeSB7XG4gIGNsb3VkOiBEaXJlY3RvcnlFbnRyeVtdO1xuICBsb2NhbDogRGlyZWN0b3J5RW50cnlbXTtcbiAgZm91bmQ6IERpcmVjdG9yeUVudHJ5W107XG4gIGZvcmVpZ24/OiBEaXJlY3RvcnlFbnRyeVtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzUmVhY2hhYmxlUm91dGUgKHByaW50ZXI6IHsgZW5kcG9pbnRJZD86IHN0cmluZyB8IG51bGwsIGFwaVVybD86IHN0cmluZyB9LCBzcmM6IFBpY2s8RGlyZWN0b3J5U291cmNlcywgJ2FjY291bnQnIHwgJ3N0YXR1cycgfCAnZm91bmQnIHwgJ2Nsb3VkTmVhcmJ5JyB8ICduZWFyYnknIHwgJ3ZpYUJsdWV0b290aCcgfCAnbm93Jz4pOiBib29sZWFuIHtcbiAgY29uc3QgaWQgPSBwcmludGVyLmVuZHBvaW50SWRcbiAgY29uc3Qgc2VjdXJlTmFtZSA9IHNlY3VyZU5hbWVPZihzcmMuYWNjb3VudC5maW5kKHAgPT4gcC5pZCA9PT0gaWQpKVxuICByZXR1cm4gISEoc3JjLmZvdW5kLnNvbWUobCA9PlxuICAgIGlkICYmIGwuZW5kcG9pbnRJZCA/IGwuZW5kcG9pbnRJZCA9PT0gaWQgOiAhIXByaW50ZXIuYXBpVXJsICYmIGxhbkFkZHJlc3NlcyhsKS5pbmNsdWRlcyhob3N0T2YocHJpbnRlci5hcGlVcmwpKSkgfHxcbiAgICAoc2VjdXJlTmFtZSAmJiBrbm93blJlYWNoYWJsZShzZWN1cmVOYW1lLCBzcmMubm93KSkgfHxcbiAgICAoaWQgJiYgKHNyYy5zdGF0dXNbaWRdPy5yZWFjaGFibGUgfHwgc3JjLmFjY291bnQuc29tZShwID0+IHAuaWQgPT09IGlkICYmIHAub25saW5lKSB8fFxuICAgICAgc3JjLmNsb3VkTmVhcmJ5LnNvbWUocCA9PiBwLnByaW50ZXJJZCA9PT0gaWQpIHx8IHNyYy52aWFCbHVldG9vdGg/LihpZCkgfHxcbiAgICAgIHNyYy5uZWFyYnkuc29tZShwID0+IGlzUHJpbnRlcihwLCBpZCkgJiYgaGVhcmRSZWNlbnRseShwLCBzcmMubm93KSkpKSlcbn1cblxuLyoqXG4gKiBBIHNhdmVkIHByaW50ZXIncyBuYW1lOiB0aGUgb25lIGl0IHdhcyBnaXZlbiwgZWxzZSBpdHMgbmV0d29yayBuYW1lXG4gKiAobXVvbi1ib3h3b29kLTM2N2EpLCBlbHNlIGl0cyBhZGRyZXNzLiBGbHVpZGQncyBvd24gZGVmYXVsdCwgXCJmbHVpZGRcIiwgaXNcbiAqIG5vIG5hbWUsIGFzIGdldERpc3BsYXlOYW1lIHRyZWF0cyBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVkTmFtZSAoczogSW5zdGFuY2VDb25maWcpOiBzdHJpbmcge1xuICBjb25zdCBuYW1lID0gKHMubmFtZSA/PyAnJykudHJpbSgpXG4gIGlmIChuYW1lICYmIG5hbWUgIT09IEdsb2JhbHMuQVBQX05BTUUpIHJldHVybiBuYW1lXG4gIGlmIChzLm1kbnNIb3N0KSByZXR1cm4gcy5tZG5zSG9zdC5yZXBsYWNlKC9cXC5sb2NhbFxcLj8kL2ksICcnKVxuICByZXR1cm4gaG9zdE9mKHMuYXBpVXJsKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaG9zdE9mICh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBVUkwodXJsKS5ob3N0XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB1cmxcbiAgfVxufVxuXG5mdW5jdGlvbiBsYW5BdCAoZm91bmQ6IExhblByaW50ZXJbXSwgaG9zdDogc3RyaW5nKTogTGFuUHJpbnRlciB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBmb3VuZC5maW5kKGwgPT4gbGFuQWRkcmVzc2VzKGwpLmluY2x1ZGVzKGhvc3QpKVxufVxuXG4vKiogVGhlIExBTiBwcmludGVyIGEgc2F2ZWQgZW50cnkgaXM6IGJ5IEVuZHBvaW50SWQsIGVsc2UgYnkgYWRkcmVzcy4gKi9cbmZ1bmN0aW9uIGxhbkZvclNhdmVkIChmb3VuZDogTGFuUHJpbnRlcltdLCBzOiBJbnN0YW5jZUNvbmZpZyk6IExhblByaW50ZXIgfCB1bmRlZmluZWQge1xuICBpZiAocy5lbmRwb2ludElkKSB7XG4gICAgY29uc3QgYnlJZCA9IGZvdW5kLmZpbmQobCA9PiBsLmVuZHBvaW50SWQgPT09IHMuZW5kcG9pbnRJZClcbiAgICBpZiAoYnlJZCkgcmV0dXJuIGJ5SWRcbiAgfVxuICBjb25zdCBieUhvc3QgPSBsYW5BdChmb3VuZCwgaG9zdE9mKHMuYXBpVXJsKSlcbiAgLy8gQSBzYXZlZCBFbmRwb2ludElkIGFuZCBhIGRpZmZlcmVudCBvbmUgYXQgdGhhdCBhZGRyZXNzOiBzb21lb25lIGVsc2UncyBwcmludGVyIHRvb2sgdGhlIGFkZHJlc3MuXG4gIGlmIChieUhvc3QgJiYgcy5lbmRwb2ludElkICYmIGJ5SG9zdC5lbmRwb2ludElkICYmIGJ5SG9zdC5lbmRwb2ludElkICE9PSBzLmVuZHBvaW50SWQpIHJldHVybiB1bmRlZmluZWRcbiAgaWYgKGJ5SG9zdCB8fCBzLmVuZHBvaW50SWQpIHJldHVybiBieUhvc3RcbiAgLy8gU2F2ZWQgYmVmb3JlIGVudHJpZXMgcmVjb3JkZWQgdGhlIEVuZHBvaW50SWQsIGFuZCBnb25lIGZyb20gaXRzIGFkZHJlc3M6XG4gIC8vIHRoZSBkaXNwbGF5IG5hbWUsIHNlcmlhbCBzdWZmaXggYW5kIGFsbCwgaXMgdGhlIG9ubHkgdGhpbmcgbGVmdCB0byBnbyBieS5cbiAgcmV0dXJuIGZvdW5kLmZpbmQobCA9PiBzYW1lRXhhY3ROYW1lKGwubmFtZSwgcy5uYW1lKSlcbn1cblxuZnVuY3Rpb24gZnJvbUxhbkhlYWx0aCAoaDogTGFuSGVhbHRoIHwgdW5kZWZpbmVkKTogUHJpbnRlckhlYWx0aCB7XG4gIGlmICghaCkgcmV0dXJuICdhdmFpbGFibGUnXG4gIHJldHVybiBoLnN0YXRlID09PSAncmVhZHknID8gJ29ubGluZScgOiBoLnN0YXRlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZWFsdGhMYWJlbCAoaDogUHJpbnRlckhlYWx0aCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoaCkge1xuICAgIGNhc2UgJ29ubGluZSc6IHJldHVybiAnT25saW5lJ1xuICAgIGNhc2UgJ3ByaW50aW5nJzogcmV0dXJuICdQcmludGluZydcbiAgICBjYXNlICdwYXVzZWQnOiByZXR1cm4gJ1BhdXNlZCdcbiAgICBjYXNlICdjb25uZWN0aW5nJzogcmV0dXJuICdDb25uZWN0aW5n4oCmJ1xuICAgIGNhc2UgJ3JlY29ubmVjdGluZyc6IHJldHVybiAnUmVjb25uZWN0aW5n4oCmJ1xuICAgIGNhc2UgJ3NlYXJjaGluZyc6IHJldHVybiAnTG9va2luZyBmb3IgaXTigKYnXG4gICAgY2FzZSAnb2ZmbGluZSc6IHJldHVybiAnT2ZmbGluZSdcbiAgICBjYXNlICdlcnJvcic6IHJldHVybiAnRXJyb3InXG4gICAgY2FzZSAnbG9ja2VkJzogcmV0dXJuICdOZWVkcyBhY2Nlc3MnXG4gICAgY2FzZSAnYXZhaWxhYmxlJzogcmV0dXJuICdPbiB0aGlzIG5ldHdvcmsnXG4gICAgY2FzZSAnbmVhcmJ5JzogcmV0dXJuICdOZWFyYnkgwrcgQmx1ZXRvb3RoJ1xuICB9XG59XG5cbi8qKiBBIGNsb3VkIHByaW50ZXIncyBzdGF0ZSwgZnJvbSB0aGUgc2VydmljZSdzIG9ubGluZSBmbGFnIGFuZCBpdHMgc3RhdHVzIHJlYWRzIG92ZXIgSXJvaC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG91ZEhlYWx0aCAob25saW5lOiBib29sZWFuLCBzOiBQcmludGVyU3RhdHVzIHwgdW5kZWZpbmVkLCBsYXN0U2VlbiA9IDApOiBQcmludGVySGVhbHRoIHtcbiAgY29uc3QgcHJlc2VuY2UgPSBjb25zb2xlUHJlc2VuY2UoeyBvbmxpbmUsIGxhc3Rfc2VlbjogbGFzdFNlZW4gfSlcbiAgaWYgKHByZXNlbmNlICE9PSAnb25saW5lJykgcmV0dXJuIHByZXNlbmNlXG4gIGlmICghcykgcmV0dXJuICdjb25uZWN0aW5nJ1xuICBpZiAoIXMucmVhY2hhYmxlICYmIHMuZXJyb3IgPT09ICdyZWNvbm5lY3RpbmcnKSByZXR1cm4gJ3JlY29ubmVjdGluZydcbiAgaWYgKCFzLnJlYWNoYWJsZSkgcmV0dXJuIHMuZXJyb3IgPT09ICdvZmZsaW5lJyA/ICdvZmZsaW5lJyA6IHMuZXJyb3IgPT09ICdyZWZ1c2VkJyA/ICdsb2NrZWQnIDogJ2Vycm9yJ1xuICBpZiAocy5zdGF0ZSA9PT0gJ3ByaW50aW5nJykgcmV0dXJuICdwcmludGluZydcbiAgaWYgKHMuc3RhdGUgPT09ICdwYXVzZWQnKSByZXR1cm4gJ3BhdXNlZCdcbiAgaWYgKHMuc3RhdGUgPT09ICdlcnJvcicgfHwgcy5zdGF0ZT8uc3RhcnRzV2l0aCgna2xpcHBlcicpKSByZXR1cm4gJ2Vycm9yJ1xuICBpZiAocy5mYXVsdHM/Lmxlbmd0aCkgcmV0dXJuICdlcnJvcidcbiAgcmV0dXJuICdvbmxpbmUnXG59XG5cbmZ1bmN0aW9uIGxpbmtlZEZyb20gKGxhbjogTGFuUHJpbnRlciB8IHVuZGVmaW5lZCwgZW1haWw6IHN0cmluZyB8IG51bGwpOiBMaW5rZWRUbyB7XG4gIGlmICghbGFuKSByZXR1cm4gJ3Vua25vd24nXG4gIGNvbnN0IHsgcGhhc2UsIGFjY291bnQgfSA9IGxhbi5saW5rXG4gIGlmIChwaGFzZSA9PT0gJ2xpbmtlZCcpIHJldHVybiBhY2NvdW50ICYmIGVtYWlsICYmIGFjY291bnQgPT09IGVtYWlsID8gJ21pbmUnIDogJ290aGVyJ1xuICBpZiAocGhhc2UgPT09ICd1bmxpbmtlZCcgfHwgcGhhc2UgPT09ICdjb2RlJyB8fCBwaGFzZSA9PT0gJ2ZhaWxlZCcpIHJldHVybiAnbm9uZSdcbiAgcmV0dXJuICd1bmtub3duJ1xufVxuXG4vKiogQSBwcmludGVyIG9mZiB0aGlzIGFjY291bnQgdGhhdCB0aGUgc2VydmljZSBsaXN0cyBhcyBsaW5rZWQgaXMgYW5vdGhlciBhY2NvdW50J3MuICovXG5mdW5jdGlvbiBjbG91ZExpbmtlZFRvIChuZWFyYnk6IENsb3VkTmVhcmJ5UHJpbnRlcltdLCBlbmRwb2ludElkOiBzdHJpbmcgfCBudWxsKTogTGlua2VkVG8ge1xuICBjb25zdCBpZCA9IGVuZHBvaW50SWQ/LnRvTG93ZXJDYXNlKClcbiAgY29uc3QgYyA9IGlkID8gbmVhcmJ5LmZpbmQobiA9PiBuLnByaW50ZXJJZC50b0xvd2VyQ2FzZSgpID09PSBpZCkgOiB1bmRlZmluZWRcbiAgcmV0dXJuIGM/LmxpbmtlZCA/ICdvdGhlcicgOiAndW5rbm93bidcbn1cblxuZnVuY3Rpb24gbGFuRGV0YWlsIChsYW46IExhblByaW50ZXIpOiBzdHJpbmcge1xuICBjb25zdCBoID0gbGFuLmhlYWx0aFxuICBjb25zdCBzdGF0ZSA9IGggPyAoaC5tZXNzYWdlID8/IGhlYWx0aExhYmVsKGZyb21MYW5IZWFsdGgoaCkpKSA6ICdPbiB0aGlzIG5ldHdvcmsnXG4gIHJldHVybiBgJHtzdGF0ZX0gwrcgJHtsYW4uaG9zdH1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JlaWduRW50cmllcyAobGlzdDogQXJyYXk8eyByZWNvcmQ6IEZvcmVpZ25QcmludGVyUmVjb3JkLCBzdGF0dXM6IEZvcmVpZ25TdGF0dXMgfCBudWxsIH0+KTogRGlyZWN0b3J5RW50cnlbXSB7XG4gIHJldHVybiBsaXN0Lm1hcCgoeyByZWNvcmQsIHN0YXR1cyB9KTogRGlyZWN0b3J5RW50cnkgPT4gKHtcbiAgICBrZXk6IGBmb3JlaWduOiR7cmVjb3JkLmlkfWAsXG4gICAgc2VjdGlvbjogJ2ZvcmVpZ24nLFxuICAgIG5hbWU6IHJlY29yZC5uYW1lLFxuICAgIGVuZHBvaW50SWQ6IG51bGwsXG4gICAgaGVhbHRoOiBzdGF0dXM/LnN0YXRlID09PSAncHJpbnRpbmcnXG4gICAgICA/ICdwcmludGluZydcbiAgICAgIDogc3RhdHVzPy5zdGF0ZSA9PT0gJ3BhdXNlZCdcbiAgICAgICAgPyAncGF1c2VkJ1xuICAgICAgICA6IHN0YXR1cz8uc3RhdGUgPT09ICdpZGxlJ1xuICAgICAgICAgID8gJ29ubGluZSdcbiAgICAgICAgICA6IHN0YXR1cz8uc3RhdGUgPz8gJ2Nvbm5lY3RpbmcnLFxuICAgIGRldGFpbDogc3RhdHVzPy5tZXNzYWdlID8/IChzdGF0dXM/LnN0YXRlID09PSAnaWRsZScgPyAnUmVhZHknIDogc3RhdHVzPy5zdGF0ZSA/PyAnQ29ubmVjdGluZycpLFxuICAgIGhvc3Q6IHJlY29yZC5ob3N0LFxuICAgIGFjdGl2ZTogbnVsbCxcbiAgICBsaW5rZWRUbzogJ25vbmUnLFxuICAgIHNhdmVkOiBbXSxcbiAgICBmb3JlaWduOiB7IHJlY29yZCwgc3RhdHVzIH1cbiAgfSkpXG59XG5cbi8qKiBXaGF0IGFuIGVudHJ5IHNheXMgd2hlbiBpdCBpcyBvdXQgb2YgZXZlcnkgb3RoZXIgcmVhY2ggYW5kIGl0cyBhZHZlcnQgd2FzIGhlYXJkLiAqL1xuY29uc3QgTkVBUkJZX0RFVEFJTCA9ICdOZWFyYnkgwrcgQmx1ZXRvb3RoJ1xuXG5leHBvcnQgZnVuY3Rpb24gcHJpbnRlckRpcmVjdG9yeSAoc3JjOiBEaXJlY3RvcnlTb3VyY2VzKTogRGlyZWN0b3J5IHtcbiAgY29uc3Qgbm93ID0gc3JjLm5vdyA/PyBEYXRlLm5vdygpXG4gIGNvbnN0IGhlYXJkID0gKG46IE5lYXJieVByaW50ZXIgfCB1bmRlZmluZWQpID0+IGhlYXJkUmVjZW50bHkobiwgbm93KVxuICBjb25zdCBjbGFpbWVkTGFuID0gbmV3IFNldDxMYW5QcmludGVyPigpXG4gIGNvbnN0IGNsYWltZWRTYXZlZCA9IG5ldyBTZXQ8SW5zdGFuY2VDb25maWc+KClcbiAgY29uc3QgY2xhaW1lZE5lYXJieSA9IG5ldyBTZXQ8TmVhcmJ5UHJpbnRlcj4oKVxuICBjb25zdCBhY3RpdmVMb2NhbCA9IHNyYy5sb2NhbD8uYXBpVXJsID8/IG51bGxcblxuICAvLyBUaGUgc2VydmljZSBzYXlzIHdobyBzaGFyZXMgdGhpcyBicm93c2VyJ3MgbmV0d29yay4gT24gYSBwYWdlIHRoYXQgY2Fubm90IHByb2JlIGFkZHJlc3NlcyBpdCBpcyB0aGUgb25seVxuICAvLyBwcm9vZiB0aGVyZSBpcywgYW5kIGl0IGhvbGRzIGJlZm9yZSBhbnkgc2Vzc2lvbiBpcyBvcGVuIChLQU4tMjQ4NykuXG4gIGNvbnN0IGJlc2lkZUJyb3dzZXIgPSAoZW5kcG9pbnRJZDogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgIGNvbnN0IG5hbWUgPSBzZWN1cmVOYW1lT2Yoc3JjLmFjY291bnQuZmluZChwID0+IHAuaWQgPT09IGVuZHBvaW50SWQpKVxuICAgIHJldHVybiAhIWVuZHBvaW50SWQgJiYgKHNyYy5jbG91ZE5lYXJieS5zb21lKGMgPT4gYy5wcmludGVySWQudG9Mb3dlckNhc2UoKSA9PT0gZW5kcG9pbnRJZC50b0xvd2VyQ2FzZSgpKSB8fCAoISFuYW1lICYmIGtub3duUmVhY2hhYmxlKG5hbWUsIG5vdykpKVxuICB9XG5cbiAgY29uc3QgbmVhcmJ5Rm9yID0gKGVuZHBvaW50SWQ6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICBpZiAoIWVuZHBvaW50SWQpIHJldHVybiB1bmRlZmluZWRcbiAgICBjb25zdCBwID0gc3JjLm5lYXJieS5maW5kKG4gPT4gIWNsYWltZWROZWFyYnkuaGFzKG4pICYmIGlzUHJpbnRlcihuLCBlbmRwb2ludElkKSlcbiAgICBpZiAocCkgY2xhaW1lZE5lYXJieS5hZGQocClcbiAgICByZXR1cm4gcFxuICB9XG5cbiAgY29uc3QgY2xvdWQ6IERpcmVjdG9yeUVudHJ5W10gPSBzcmMuYWNjb3VudC5tYXAoYyA9PiB7XG4gICAgY29uc3QgbGFuID0gc3JjLmZvdW5kLmZpbmQobCA9PiAhY2xhaW1lZExhbi5oYXMobCkgJiYgc2FtZUxhblByaW50ZXIobCwgYy5pZCwgYy5uYW1lKSlcbiAgICBpZiAobGFuKSBjbGFpbWVkTGFuLmFkZChsYW4pXG4gICAgY29uc3Qgc2F2ZWQgPSBzcmMuc2F2ZWQuZmlsdGVyKHMgPT5cbiAgICAgIHMuZW5kcG9pbnRJZCA9PT0gYy5pZCB8fCAoISFsYW4gJiYgbGFuRm9yU2F2ZWQoW2xhbl0sIHMpID09PSBsYW4pKVxuICAgIHNhdmVkLmZvckVhY2gocyA9PiBjbGFpbWVkU2F2ZWQuYWRkKHMpKVxuICAgIGNvbnN0IGxvY2FsQWN0aXZlID0gISFhY3RpdmVMb2NhbCAmJiBzYXZlZC5zb21lKHMgPT4gcy5hcGlVcmwgPT09IGFjdGl2ZUxvY2FsKVxuICAgIGNvbnN0IGFjdGl2ZSA9IHNyYy5hY3RpdmVDbG91ZElkID09PSBjLmlkID8gJ2Nsb3VkJyA6IGxvY2FsQWN0aXZlID8gJ2xvY2FsJyA6IG51bGxcbiAgICBjb25zdCBzdGF0dXMgPSBzcmMuc3RhdHVzW2MuaWRdXG4gICAgLy8gSS0xMzM6IGEgcHJpbnRlciBhbnN3ZXJpbmcgb3ZlciBCbHVldG9vdGggaXMgbm90IG9mZmxpbmUgYmVjYXVzZSB0aGVcbiAgICAvLyBjb25zb2xlIGNhbm5vdCBzZWUgaXQgKGl0cyBXaS1GaSBtYXkgYmUgb2ZmKTogdGhlIHJvdXRlIGlzIHdoYXQgaXMgdHJ1ZS5cbiAgICBjb25zdCByb3V0ZSA9IHN0YXR1cz8ucmVhY2hhYmxlICYmIHNyYy52aWFCbHVldG9vdGg/LihjLmlkKSA/ICdibHVldG9vdGgnIGFzIGNvbnN0IDogdW5kZWZpbmVkXG4gICAgbGV0IGhlYWx0aCA9IGNsb3VkSGVhbHRoKGMub25saW5lIHx8ICEhcm91dGUsIHN0YXR1cywgYy5sYXN0X3NlZW4pXG4gICAgbGV0IGRldGFpbCA9IHJvdXRlID8gYCR7Y2xvdWREZXRhaWwodHJ1ZSwgc3RhdHVzLCBjLmxhc3Rfc2Vlbil9IMK3IHZpYSBCbHVldG9vdGhgIDogY2xvdWREZXRhaWwoYy5vbmxpbmUsIHN0YXR1cywgYy5sYXN0X3NlZW4pXG4gICAgaWYgKGFjdGl2ZSA9PT0gJ2xvY2FsJyAmJiBzcmMubG9jYWwpIHtcbiAgICAgIGhlYWx0aCA9IHNyYy5sb2NhbC5oZWFsdGhcbiAgICAgIGRldGFpbCA9IGAke3NyYy5sb2NhbC5kZXRhaWx9IMK3IGNvbm5lY3RlZCBsb2NhbGx5YFxuICAgIH0gZWxzZSBpZiAobGFuICYmIGhlYWx0aCA9PT0gJ29mZmxpbmUnKSB7XG4gICAgICAvLyBUaGUgc2VydmljZSBsb3N0IGl0LCBhbmQgaXQgaXMgcmlnaHQgaGVyZS5cbiAgICAgIGhlYWx0aCA9IGZyb21MYW5IZWFsdGgobGFuLmhlYWx0aClcbiAgICAgIGRldGFpbCA9IGAke2xhbkRldGFpbChsYW4pfSDCtyBvbiB0aGlzIG5ldHdvcmtgXG4gICAgfSBlbHNlIGlmIChsYW4gfHwgYmVzaWRlQnJvd3NlcihjLmlkKSkge1xuICAgICAgZGV0YWlsID0gYCR7ZGV0YWlsfSDCtyBvbiB0aGlzIG5ldHdvcmtgXG4gICAgfVxuICAgIGNvbnN0IG5lYXJieSA9IG5lYXJieUZvcihjLmlkKVxuICAgIC8vIEtBTi0yNTI4OiBoZWFyZCBvdmVyIEJsdWV0b290aCBub3csIHNvIGl0IGlzIG5vdCBvZmZsaW5lOiBCbHVldG9vdGggb3BlbnMgaXQuXG4gICAgaWYgKGhlYWx0aCA9PT0gJ29mZmxpbmUnICYmIGhlYXJkKG5lYXJieSkpIHtcbiAgICAgIGhlYWx0aCA9ICduZWFyYnknXG4gICAgICBkZXRhaWwgPSBORUFSQllfREVUQUlMXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBrZXk6IGBjbG91ZDoke2MuaWR9YCxcbiAgICAgIHNlY3Rpb246ICdjbG91ZCcsXG4gICAgICBuYW1lOiBjLm5hbWUsXG4gICAgICBlbmRwb2ludElkOiBjLmlkLFxuICAgICAgaGVhbHRoLFxuICAgICAgZGV0YWlsLFxuICAgICAgaG9zdDogbGFuPy5ob3N0ID8/IG51bGwsXG4gICAgICBhY3RpdmUsXG4gICAgICBsaW5rZWRUbzogJ21pbmUnLFxuICAgICAgY2xvdWQ6IGMsXG4gICAgICBzYXZlZCxcbiAgICAgIGxhbixcbiAgICAgIHJvdXRlLFxuICAgICAgbmVhcmJ5XG4gICAgfVxuICB9KVxuXG4gIGNvbnN0IGxvY2FsOiBEaXJlY3RvcnlFbnRyeVtdID0gW11cbiAgZm9yIChjb25zdCBzIG9mIHNyYy5zYXZlZCkge1xuICAgIGlmIChjbGFpbWVkU2F2ZWQuaGFzKHMpKSBjb250aW51ZVxuICAgIGNvbnN0IGxhbiA9IGxhbkZvclNhdmVkKHNyYy5mb3VuZCwgcylcbiAgICBjb25zdCBlbmRwb2ludElkID0gcy5lbmRwb2ludElkID8/IGxhbj8uZW5kcG9pbnRJZCA/PyBudWxsXG4gICAgLy8gU2F2ZWQgdHdpY2UgKGFuIGFkZHJlc3MgYW5kIGEgbmFtZSwgb3IgdHdvIGFkZHJlc3Nlcyk6IG9uZSBlbnRyeS5cbiAgICBjb25zdCBzYW1lID0gbG9jYWwuZmluZChlID0+XG4gICAgICAoISFlbmRwb2ludElkICYmIGUuZW5kcG9pbnRJZCA9PT0gZW5kcG9pbnRJZCkgfHwgKCEhbGFuICYmIGUubGFuID09PSBsYW4pKVxuICAgIGlmIChzYW1lKSB7XG4gICAgICBzYW1lLnNhdmVkLnB1c2gocylcbiAgICAgIGlmIChzLmFwaVVybCA9PT0gYWN0aXZlTG9jYWwpIHNhbWUuYWN0aXZlID0gJ2xvY2FsJ1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgaWYgKGxhbikgY2xhaW1lZExhbi5hZGQobGFuKVxuICAgIGNvbnN0IGFjdGl2ZSA9IGVuZHBvaW50SWQgJiYgc3JjLmFjdGl2ZUNsb3VkSWQgPT09IGVuZHBvaW50SWQgPyAnY2xvdWQnIDogcy5hcGlVcmwgPT09IGFjdGl2ZUxvY2FsID8gJ2xvY2FsJyA6IG51bGxcbiAgICBjb25zdCBuZWFyYnkgPSBuZWFyYnlGb3IoZW5kcG9pbnRJZClcbiAgICBsZXQgaGVhbHRoOiBQcmludGVySGVhbHRoXG4gICAgbGV0IGRldGFpbDogc3RyaW5nXG4gICAgaWYgKGFjdGl2ZSAmJiBzcmMubG9jYWwpIHtcbiAgICAgIGhlYWx0aCA9IHNyYy5sb2NhbC5oZWFsdGhcbiAgICAgIGRldGFpbCA9IHNyYy5sb2NhbC5kZXRhaWxcbiAgICB9IGVsc2UgaWYgKGxhbikge1xuICAgICAgaGVhbHRoID0gZnJvbUxhbkhlYWx0aChsYW4uaGVhbHRoKVxuICAgICAgZGV0YWlsID0gbGFuRGV0YWlsKGxhbilcbiAgICB9IGVsc2UgaWYgKGJlc2lkZUJyb3dzZXIoZW5kcG9pbnRJZCkpIHtcbiAgICAgIC8vIFRoZSBzZXJ2aWNlIGZpbmRzIGl0IGJlc2lkZSB0aGlzIGJyb3dzZXIsIHRob3VnaCB0aGlzIHBhZ2UgY2Fubm90IHByb2JlIGl0OiBpdCBpcyBvbiB0aGlzIG5ldHdvcmssIG5vdCBsb3N0LlxuICAgICAgaGVhbHRoID0gJ2F2YWlsYWJsZSdcbiAgICAgIGRldGFpbCA9ICdPbiB0aGlzIG5ldHdvcmsnXG4gICAgfSBlbHNlIGlmIChoZWFyZChuZWFyYnkpKSB7XG4gICAgICAvLyBOb3Qgb24gdGhpcyBuZXR3b3JrLCBidXQgaXRzIGFkdmVydCB3YXMgaGVhcmQgKEtBTi0yNTI4KS5cbiAgICAgIGhlYWx0aCA9ICduZWFyYnknXG4gICAgICBkZXRhaWwgPSBORUFSQllfREVUQUlMXG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWx0aCA9IHNyYy5zZWFyY2hpbmcgPyAnc2VhcmNoaW5nJyA6ICdvZmZsaW5lJ1xuICAgICAgZGV0YWlsID0gc3JjLnNlYXJjaGluZyA/ICdMb29raW5nIGZvciBpdCBvbiB0aGlzIG5ldHdvcmvigKYnIDogJ05vdCBmb3VuZCBvbiB0aGlzIG5ldHdvcmsnXG4gICAgfVxuICAgIGxvY2FsLnB1c2goe1xuICAgICAga2V5OiBgbG9jYWw6JHtzLmFwaVVybH1gLFxuICAgICAgc2VjdGlvbjogJ2xvY2FsJyxcbiAgICAgIG5hbWU6IGxhbj8ubmFtZSA/PyBzYXZlZE5hbWUocyksXG4gICAgICBlbmRwb2ludElkLFxuICAgICAgaGVhbHRoLFxuICAgICAgZGV0YWlsLFxuICAgICAgaG9zdDogbGFuPy5ob3N0ID8/IG51bGwsXG4gICAgICBhY3RpdmUsXG4gICAgICAvLyBObyBMQU4gcHJvYmUgb24gdGhlIGhvc3RlZCBwYWdlOiB0aGUgc2VydmljZSdzIG5lYXJieSBsaXN0IHN0aWxsIHNheXMgd2hldGhlciBzb21lb25lIGhhcyBsaW5rZWQgaXQuXG4gICAgICBsaW5rZWRUbzogbGFuID8gbGlua2VkRnJvbShsYW4sIHNyYy5lbWFpbCkgOiBjbG91ZExpbmtlZFRvKHNyYy5jbG91ZE5lYXJieSwgZW5kcG9pbnRJZCksXG4gICAgICBzYXZlZDogW3NdLFxuICAgICAgbGFuLFxuICAgICAgbmVhcmJ5XG4gICAgfSlcbiAgfVxuICAvLyBBbiBlbnRyeSB3aG9zZSBhY3RpdmUgc2F2ZWQgYWRkcmVzcyB3YXMgbm90IHRoZSBmaXJzdCBvbmUuXG4gIGZvciAoY29uc3QgZSBvZiBsb2NhbCkge1xuICAgIGlmIChlLmFjdGl2ZSAmJiBzcmMubG9jYWwgJiYgZS5oZWFsdGggIT09IHNyYy5sb2NhbC5oZWFsdGgpIHtcbiAgICAgIGUuaGVhbHRoID0gc3JjLmxvY2FsLmhlYWx0aFxuICAgICAgZS5kZXRhaWwgPSBzcmMubG9jYWwuZGV0YWlsXG4gICAgfVxuICB9XG5cbiAgY29uc3QgbGlzdGVkSWRzID0gbmV3IFNldChbLi4uY2xvdWQsIC4uLmxvY2FsXS5tYXAoZSA9PiBlLmVuZHBvaW50SWQpLmZpbHRlcigoaWQpOiBpZCBpcyBzdHJpbmcgPT4gISFpZCkpXG4gIGNvbnN0IHJvd3MgPSBzZWFyY2hSb3dzKHtcbiAgICBmb3VuZDogc3JjLmZvdW5kLmZpbHRlcihsID0+ICFjbGFpbWVkTGFuLmhhcyhsKSAmJiAhKGwuZW5kcG9pbnRJZCAmJiBsaXN0ZWRJZHMuaGFzKGwuZW5kcG9pbnRJZCkpKSxcbiAgICBjbG91ZDogc3JjLmNsb3VkTmVhcmJ5LmZpbHRlcihjID0+XG4gICAgICAhbGlzdGVkSWRzLmhhcyhjLnByaW50ZXJJZCkgJiZcbiAgICAgICFbLi4uY2xhaW1lZExhbl0uc29tZShsID0+IHNhbWVMYW5QcmludGVyKGwsIGMucHJpbnRlcklkLCBjLm5hbWUpKSksXG4gICAgbmVhcmJ5OiBzcmMubmVhcmJ5LmZpbHRlcihuID0+ICFjbGFpbWVkTmVhcmJ5LmhhcyhuKSAmJiAhWy4uLmxpc3RlZElkc10uc29tZShpZCA9PiBpc1ByaW50ZXIobiwgaWQpKSksXG4gICAgLy8gQWNjb3VudCBwcmludGVycyBhcmUgbGlzdGVkIGFscmVhZHk7IERpc2NvdmVyeSBzaG93cyBvbmx5IHdoYXQgaXMgbm90LlxuICAgIGFjY291bnQ6IFtdLFxuICAgIGVtYWlsOiBzcmMuZW1haWxcbiAgfSlcbiAgY29uc3QgZm91bmQ6IERpcmVjdG9yeUVudHJ5W10gPSByb3dzLm1hcChyb3cgPT4ge1xuICAgIGNvbnN0IGxpbmtlZFRvOiBMaW5rZWRUbyA9IHJvdy5saW5rZWRcbiAgICAgID8gKHJvdy5sYW4gPyBsaW5rZWRGcm9tKHJvdy5sYW4sIHNyYy5lbWFpbCkgOiAnb3RoZXInKVxuICAgICAgOiByb3cubGFuIHx8IHJvdy5jbG91ZElkID8gJ25vbmUnIDogJ3Vua25vd24nXG4gICAgcmV0dXJuIHtcbiAgICAgIGtleTogYGZvdW5kOiR7cm93LmtleX1gLFxuICAgICAgc2VjdGlvbjogJ2ZvdW5kJyxcbiAgICAgIG5hbWU6IHJvdy5uYW1lLFxuICAgICAgZW5kcG9pbnRJZDogcm93Lmxhbj8uZW5kcG9pbnRJZCA/PyByb3cuY2xvdWRJZCA/PyByb3cubmVhcmJ5Py5lbmRwb2ludElkID8/IG51bGwsXG4gICAgICBoZWFsdGg6IHJvdy5sYW4gPyBmcm9tTGFuSGVhbHRoKHJvdy5sYW4uaGVhbHRoKSA6ICdhdmFpbGFibGUnLFxuICAgICAgZGV0YWlsOiByb3cubWV0YSxcbiAgICAgIGhvc3Q6IHJvdy5ob3N0LFxuICAgICAgYWN0aXZlOiBudWxsLFxuICAgICAgbGlua2VkVG8sXG4gICAgICBzYXZlZDogW10sXG4gICAgICBsYW46IHJvdy5sYW4sXG4gICAgICBuZWFyYnk6IHJvdy5uZWFyYnksXG4gICAgICByb3dcbiAgICB9XG4gIH0pXG5cbiAgZm9yIChjb25zdCBlIG9mIFsuLi5jbG91ZCwgLi4ubG9jYWwsIC4uLmZvdW5kXSkge1xuICAgIGNvbnN0IGlkID0gZS5jbG91ZD8uaWQgPz8gZS5lbmRwb2ludElkXG4gICAgY29uc3QgY2FycnlpbmcgPSAhIWlkICYmICEhc3JjLnZpYUJsdWV0b290aD8uKGlkKVxuICAgIGlmIChjYXJyeWluZykgZS5yb3V0ZSA9ICdibHVldG9vdGgnXG4gICAgaWYgKGUuaGVhbHRoICE9PSAnb2ZmbGluZScgJiYgIShjYXJyeWluZyAmJiBlLmhlYWx0aCA9PT0gJ3NlYXJjaGluZycpKSBjb250aW51ZVxuICAgIGlmICghaGFzUmVhY2hhYmxlUm91dGUoeyBlbmRwb2ludElkOiBpZCwgYXBpVXJsOiBlLnNhdmVkWzBdPy5hcGlVcmwgPz8gZS5sYW4/LmFwaVVybCB9LCBzcmMpKSBjb250aW51ZVxuICAgIGNvbnN0IHN0YXR1cyA9IGlkID8gc3JjLnN0YXR1c1tpZF0gOiB1bmRlZmluZWRcbiAgICBpZiAoY2FycnlpbmcgfHwgc3RhdHVzPy5yZWFjaGFibGUpIHtcbiAgICAgIGUuaGVhbHRoID0gc3RhdHVzPy5yZWFjaGFibGUgPyBjbG91ZEhlYWx0aCh0cnVlLCBzdGF0dXMpIDogJ29ubGluZSdcbiAgICAgIGUuZGV0YWlsID0gYCR7c3RhdHVzPy5yZWFjaGFibGUgPyBjbG91ZERldGFpbCh0cnVlLCBzdGF0dXMpIDogJ0Nvbm5lY3RlZCd9JHtjYXJyeWluZyA/ICcgwrcgdmlhIEJsdWV0b290aCcgOiAnJ31gXG4gICAgfSBlbHNlIGlmIChoZWFyZChlLm5lYXJieSkpIHtcbiAgICAgIGUuaGVhbHRoID0gJ25lYXJieSdcbiAgICAgIGUuZGV0YWlsID0gTkVBUkJZX0RFVEFJTFxuICAgIH0gZWxzZSB7XG4gICAgICBlLmhlYWx0aCA9ICdhdmFpbGFibGUnXG4gICAgICBlLmRldGFpbCA9IGUubGFuIHx8IGJlc2lkZUJyb3dzZXIoaWQpID8gJ09uIHRoaXMgbmV0d29yaycgOiAnQXZhaWxhYmxlIHRocm91Z2ggTXVvbjNEJ1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGZvcmVpZ24gPSBmb3JlaWduRW50cmllcyhzcmMuZm9yZWlnbiA/PyBbXSlcbiAgcmV0dXJuIHsgY2xvdWQsIGxvY2FsLCBmb3VuZCwgZm9yZWlnbiB9XG59XG5cbi8qKiBUaGUgbGluZSB1bmRlciBhIGNsb3VkIHByaW50ZXIncyBuYW1lLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb3VkRGV0YWlsIChvbmxpbmU6IGJvb2xlYW4sIHM6IFByaW50ZXJTdGF0dXMgfCB1bmRlZmluZWQsIGxhc3RTZWVuID0gMCk6IHN0cmluZyB7XG4gIGNvbnN0IHByZXNlbmNlID0gY29uc29sZVByZXNlbmNlKHsgb25saW5lLCBsYXN0X3NlZW46IGxhc3RTZWVuIH0pXG4gIGlmIChwcmVzZW5jZSAhPT0gJ29ubGluZScpIHJldHVybiBoZWFsdGhMYWJlbChwcmVzZW5jZSlcbiAgaWYgKCFzKSByZXR1cm4gJ0Nvbm5lY3RpbmcgdGhyb3VnaCBNdW9uM0TigKYnXG4gIGlmICghcy5yZWFjaGFibGUgJiYgcy5lcnJvciA9PT0gJ3JlY29ubmVjdGluZycpIHJldHVybiAnUmVjb25uZWN0aW5n4oCmJ1xuICBpZiAoIXMucmVhY2hhYmxlKSByZXR1cm4gcy5lcnJvciA9PT0gJ29mZmxpbmUnID8gJ09mZmxpbmUnIDogcy5lcnJvciA9PT0gJ3JlZnVzZWQnID8gJ05lZWRzIGFjY2VzcycgOiBgVW5yZWFjaGFibGU6ICR7cy5lcnJvcn1gXG4gIGNvbnN0IHN0YXRlID0gKHMuc3RhdGUgPz8gJ3Vua25vd24nKS5yZXBsYWNlKC9eXFx3LywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpXG4gIGlmIChzLnN0YXRlID09PSAncHJpbnRpbmcnIHx8IHMuc3RhdGUgPT09ICdwYXVzZWQnKSB7XG4gICAgY29uc3QgcGVyY2VudCA9IE1hdGgucm91bmQoKHMucHJvZ3Jlc3MgPz8gMCkgKiAxMDApXG4gICAgcmV0dXJuIGAke3N0YXRlfSDCtyAke3BlcmNlbnR9JSR7cy5maWxlbmFtZSA/IGAgwrcgJHtzLmZpbGVuYW1lfWAgOiAnJ31gXG4gIH1cbiAgY29uc3QgZmF1bHQgPSBmYXVsdFN1bW1hcnkocy5mYXVsdHMpXG4gIHJldHVybiBmYXVsdCA/IGAke2ZhdWx0fSDvv70gJHtzdGF0ZX1gIDogc3RhdGVcbn1cblxuLyoqXG4gKiBTYXZlZCBlbnRyaWVzIHRvIGJyaW5nIHVwIHRvIGRhdGUgZnJvbSB3aGF0IHRoZSBzZWFyY2ggZm91bmQ6IHJlY29yZCB0aGVcbiAqIEVuZHBvaW50SWQgYSBzYXZlZCBwcmludGVyIHB1Ymxpc2hlZCwgYW5kIGZvbGxvdyBhIHByaW50ZXIgc2F2ZWQgYXQgYW4gSVBcbiAqIGFkZHJlc3MgdG8gaXRzIG5ldyBvbmUuIEEgcHJpbnRlciBzYXZlZCBieSBuYW1lIGtlZXBzIGl0cyBuYW1lOiBtRE5TIGZvbGxvd3NcbiAqIGl0IGFscmVhZHkuIFRoZSBlbnRyeSBGbHVpZGQgaXMgY29ubmVjdGVkIHRocm91Z2ggaXMgbGVmdCBhbG9uZS5cbiAqL1xuLyoqXG4gKiBXaGF0IHRvIGNoYW5nZSBhYm91dCBzYXZlZCBwcmludGVycywgZ2l2ZW4gd2hhdCB0aGUgc2VhcmNoIGZvdW5kOiB0aGVcbiAqIEVuZHBvaW50SWQgdGhleSBsYWNrZWQsIHRoZWlyIGAubG9jYWxgIG5hbWUsIGFuZCB0aGUgYWRkcmVzcyB0aGV5IGFuc3dlciBhdFxuICogbm93LiBgYmxvY2tlZGAgc2F5cyB0aGlzIHBhZ2UgbWF5IG5vdCByZWFjaCBJUHY0IGFkZHJlc3Nlcywgc28gYSBwcmludGVyXG4gKiBzYXZlZCBieSBJUCBtb3ZlcyB0byB0aGUgYC5sb2NhbGAgbmFtZSBpdCBhbnN3ZXJlZCBhdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVkVXBkYXRlcyAoc2F2ZWQ6IEluc3RhbmNlQ29uZmlnW10sIGZvdW5kOiBMYW5QcmludGVyW10sIGJsb2NrZWQgPSBmYWxzZSk6IEFycmF5PHsgYXBpVXJsOiBzdHJpbmcsIGNoYW5nZXM6IFBhcnRpYWw8SW5zdGFuY2VDb25maWc+IH0+IHtcbiAgY29uc3QgdXBkYXRlczogQXJyYXk8eyBhcGlVcmw6IHN0cmluZywgY2hhbmdlczogUGFydGlhbDxJbnN0YW5jZUNvbmZpZz4gfT4gPSBbXVxuICBmb3IgKGNvbnN0IHMgb2Ygc2F2ZWQpIHtcbiAgICBpZiAocy5hY3RpdmUpIGNvbnRpbnVlXG4gICAgY29uc3QgbGFuID0gbGFuRm9yU2F2ZWQoZm91bmQsIHMpXG4gICAgaWYgKCFsYW4/LmVuZHBvaW50SWQpIGNvbnRpbnVlXG4gICAgY29uc3QgY2hhbmdlczogUGFydGlhbDxJbnN0YW5jZUNvbmZpZz4gPSB7fVxuICAgIGlmICghcy5lbmRwb2ludElkKSBjaGFuZ2VzLmVuZHBvaW50SWQgPSBsYW4uZW5kcG9pbnRJZFxuICAgIGlmIChsYW4ubWRuc0hvc3QgJiYgcy5tZG5zSG9zdCAhPT0gbGFuLm1kbnNIb3N0KSBjaGFuZ2VzLm1kbnNIb3N0ID0gbGFuLm1kbnNIb3N0XG4gICAgY29uc3QgaG9zdCA9IGhvc3RPZihzLmFwaVVybClcbiAgICBjb25zdCBzYXZlZEJ5SXAgPSAvXlxcZHsxLDN9KFxcLlxcZHsxLDN9KXszfSg6XFxkKyk/JC8udGVzdChob3N0KVxuICAgIGNvbnN0IGlwTm93ID0gbGFuQWRkcmVzc2VzKGxhbikuZmluZChhID0+IC9eXFxkezEsM30oXFwuXFxkezEsM30pezN9JC8udGVzdChhKSlcbiAgICBjb25zdCBuYW1lTm93ID0gbGFuQWRkcmVzc2VzKGxhbikuZmluZChhID0+IGEuZW5kc1dpdGgoJy5sb2NhbCcpKVxuICAgIGlmIChzYXZlZEJ5SXAgJiYgaXBOb3cgJiYgIWxhbkFkZHJlc3NlcyhsYW4pLmluY2x1ZGVzKGhvc3QpKSB7XG4gICAgICBjaGFuZ2VzLmFwaVVybCA9IGBodHRwOi8vJHtpcE5vd31gXG4gICAgICBjaGFuZ2VzLnNvY2tldFVybCA9IGB3czovLyR7aXBOb3d9L3dlYnNvY2tldGBcbiAgICB9IGVsc2UgaWYgKHNhdmVkQnlJcCAmJiBibG9ja2VkICYmIG5hbWVOb3cpIHtcbiAgICAgIGNoYW5nZXMuYXBpVXJsID0gYGh0dHA6Ly8ke25hbWVOb3d9YFxuICAgICAgY2hhbmdlcy5zb2NrZXRVcmwgPSBgd3M6Ly8ke25hbWVOb3d9L3dlYnNvY2tldGBcbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZXMpLmxlbmd0aCkgdXBkYXRlcy5wdXNoKHsgYXBpVXJsOiBzLmFwaVVybCwgY2hhbmdlcyB9KVxuICB9XG4gIHJldHVybiB1cGRhdGVzXG59XG4iXSwibWFwcGluZ3MiOiJBQWlCQSxTQUFTLGVBQWU7QUFDeEIsU0FBUyxpQkFBcUM7QUFDOUMsU0FBUyxxQkFBcUI7QUFJOUI7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUlLO0FBQ1AsU0FBUyxrQkFBa0M7QUFDM0MsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxnQkFBZ0Isb0JBQW9CO0FBQzdDLFNBQVMsb0JBQW9CO0FBOEZ0QixnQkFBUyxrQkFBbUIsU0FBMEQsS0FBMEg7QUFDck4sUUFBTSxLQUFLLFFBQVE7QUFDbkIsUUFBTSxhQUFhLGFBQWEsSUFBSSxRQUFRLEtBQUssT0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ2xFLFNBQU8sQ0FBQyxFQUFFLElBQUksTUFBTSxLQUFLLE9BQ3ZCLE1BQU0sRUFBRSxhQUFhLEVBQUUsZUFBZSxLQUFLLENBQUMsQ0FBQyxRQUFRLFVBQVUsYUFBYSxDQUFDLEVBQUUsU0FB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