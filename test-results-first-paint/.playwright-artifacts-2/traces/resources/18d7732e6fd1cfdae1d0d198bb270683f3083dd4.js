import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { onEndpointReplacing } from "/src/services/muon-cloud/endpoint-hooks.ts";
import {
  decodeInfo,
  gattDroppedMessage,
  MUON_BLE_INFO,
  MUON_BLE_RX,
  MUON_BLE_SERVICE,
  MUON_BLE_TX
} from "/src/services/muon-ble/webBluetooth.ts";
export const MAX_WRITE_SEGMENT = 244;
export function cappedSegment(infoSegment) {
  if (!infoSegment) return void 0;
  return Math.min(infoSegment, MAX_WRITE_SEGMENT);
}
function pinOn(endpoint, id, pinned) {
  try {
    if (endpoint?.chooseRoute) endpoint.chooseRoute(id, pinned ? "ble" : "auto");
    else endpoint?.pinBluetooth?.(id, pinned);
  } catch {
  }
}
export function takesBleLinks(endpoint) {
  return typeof endpoint?.addLink === "function";
}
const CONNECT_TIMEOUT_MS = 2e4;
const HELLO_TIMEOUT_MS = 1e4;
const HELLO_RETRY_MS = 1e3;
const DRAIN_MS = 2e3;
const MAX_WRITE_FAILURES = 16;
export const GATT_RETRY_MS = [750, 1500, 3e3];
export function gattWentDown(error, gatt) {
  if (error instanceof GattDropped) return true;
  if (gatt.connected === false) return true;
  const e = error;
  return e?.name === "NetworkError" || /disconnected|\(re\)connect/i.test(e?.message ?? "");
}
class GattDropped extends Error {
  constructor() {
    super("The printer went away while connecting.");
  }
}
const owners = /* @__PURE__ */ new WeakMap();
function withTimeout(p, ms, what) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const source = (bytes) => bytes;
async function write(rx, segment, withResponse) {
  if (!withResponse && typeof rx.writeValueWithoutResponse === "function") {
    await rx.writeValueWithoutResponse(source(segment));
  } else if (typeof rx.writeValueWithResponse === "function") {
    await rx.writeValueWithResponse(source(segment));
  } else {
    throw new Error("RX takes no writes");
  }
}
export async function openBleLink(endpoint, device, options = {}) {
  const log = options.log ?? (() => {
  });
  const gatt = device.gatt;
  if (!gatt) throw new Error("The printer offered no GATT connection.");
  const current = owners.get(device);
  if (current === "opening" || current && current.isOpen()) {
    throw new Error("This page is already connected to that printer over Bluetooth.");
  }
  owners.set(device, "opening");
  let link = null;
  let tx = null;
  let radioUp = true;
  const early = [];
  let resolveClosed = () => {
  };
  const closed = new Promise((resolve) => {
    resolveClosed = resolve;
  });
  let resolveDrained = () => {
  };
  const drained = new Promise((resolve) => {
    resolveDrained = resolve;
  });
  let lastTraffic = 0;
  let lastHeard = 0;
  const onNotification = (event) => {
    if (!radioUp) return;
    const value = event.target.value;
    if (!value) return;
    lastTraffic = lastHeard = Date.now();
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (link) link.onSegment(bytes);
    else early.push(bytes.slice());
  };
  const onGone = () => {
    if (!radioUp) return;
    radioUp = false;
    device.removeEventListener("gattserverdisconnected", onGone);
    tx?.removeEventListener("characteristicvaluechanged", onNotification);
    link?.onDisconnected();
    if (owners.get(device) === handle || owners.get(device) === "opening") owners.delete(device);
    log("bluetooth: GATT disconnected");
    resolveClosed();
  };
  const dropGatt = () => {
    if (!radioUp) return;
    try {
      gatt.disconnect();
    } catch {
    }
    onGone();
  };
  let disconnecting = null;
  const handle = {
    printerId: "",
    info: null,
    disconnect() {
      disconnecting ??= (async () => {
        if (!radioUp) return;
        link?.close();
        await Promise.race([drained, sleep(DRAIN_MS)]);
        dropGatt();
      })();
      return disconnecting;
    },
    closed,
    isOpen: () => radioUp,
    lastTrafficAt: () => lastTraffic,
    lastHeardAt: () => lastHeard
  };
  let abandoned = false;
  const setUpGatt = async () => {
    let dropped = false;
    const onDrop = () => {
      dropped = true;
    };
    const wentDown = () => dropped || gatt.connected === false;
    device.addEventListener("gattserverdisconnected", onDrop);
    let txChar = null;
    try {
      const server = await gatt.connect();
      if (wentDown()) throw new GattDropped();
      const service = await server.getPrimaryService(MUON_BLE_SERVICE);
      const infoChar = await service.getCharacteristic(MUON_BLE_INFO);
      const rxChar = await service.getCharacteristic(MUON_BLE_RX);
      txChar = await service.getCharacteristic(MUON_BLE_TX);
      const value = await infoChar.readValue();
      const decoded = decodeInfo(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
      if (!decoded) throw new Error("The printer answered with an INFO value this page does not understand.");
      txChar.addEventListener("characteristicvaluechanged", onNotification);
      if (typeof txChar.startNotifications === "function") await txChar.startNotifications();
      if (wentDown()) throw new GattDropped();
      return { info: decoded, rx: rxChar, tx: txChar };
    } catch (error) {
      txChar?.removeEventListener("characteristicvaluechanged", onNotification);
      early.splice(0);
      throw error;
    } finally {
      device.removeEventListener("gattserverdisconnected", onDrop);
    }
  };
  const setUpWithRetries = async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await setUpGatt();
      } catch (error) {
        if (abandoned || !gattWentDown(error, gatt)) throw error;
        if (attempt >= GATT_RETRY_MS.length) throw new Error(gattDroppedMessage(device.name));
        log(`bluetooth: GATT setup ${attempt + 1} lost the connection (${error?.message ?? error}); trying again`);
        try {
          gatt.disconnect();
        } catch {
        }
        await sleep(GATT_RETRY_MS[attempt]);
        if (abandoned) throw error;
      }
    }
  };
  try {
    const { info, rx, tx: txChar } = await withTimeout(setUpWithRetries(), options.connectTimeoutMs ?? CONNECT_TIMEOUT_MS, "Connecting over Bluetooth").catch((error) => {
      abandoned = true;
      throw error;
    });
    tx = txChar;
    device.addEventListener("gattserverdisconnected", onGone);
    if (gatt.connected === false) onGone();
    if (!radioUp) throw new Error("The printer went away while connecting.");
    const l = endpoint.addLink("central", cappedSegment(info.maxSegment));
    link = l;
    for (const segment of early.splice(0)) l.onSegment(segment);
    const canWithoutResponse = typeof rx.writeValueWithoutResponse === "function" && rx.properties?.writeWithoutResponse !== false;
    let withResponse = !canWithoutResponse;
    (async () => {
      let failures = 0;
      for (; ; ) {
        const segment = await l.nextSegment();
        if (segment === void 0) break;
        if (!radioUp) continue;
        try {
          await write(rx, segment, withResponse);
          lastTraffic = Date.now();
          failures = 0;
        } catch (error) {
          failures += 1;
          if (error?.name === "NotSupportedError" && info.writeWithResponse) withResponse = true;
          log(`bluetooth: RX write failed (${failures}): ${error?.message ?? error}`);
          if (gatt.connected === false) onGone();
          else if (failures >= MAX_WRITE_FAILURES) l.onDisconnected();
        }
      }
      resolveDrained();
      dropGatt();
    })().catch((error) => {
      log(`bluetooth: write loop failed: ${error?.message ?? error}`);
      resolveDrained();
      l.onDisconnected();
      dropGatt();
    });
    const retry = setInterval(() => {
      l.retryHandshake();
    }, HELLO_RETRY_MS);
    let printerId;
    try {
      l.retryHandshake();
      printerId = await withTimeout(l.connected(), options.helloTimeoutMs ?? HELLO_TIMEOUT_MS, "The Bluetooth handshake");
    } finally {
      clearInterval(retry);
    }
    if (printerId.toLowerCase() !== info.endpointId) {
      throw new Error("The printer's INFO and HELLO name different printers.");
    }
    handle.printerId = info.endpointId;
    handle.info = info;
    owners.set(device, handle);
    log(`bluetooth: link up to ${printerId.slice(0, 10)}`);
    return handle;
  } catch (error) {
    if (link?.isClosed()) {
      await Promise.race([drained, sleep(DRAIN_MS)]);
    }
    link?.onDisconnected();
    dropGatt();
    throw error;
  }
}
const routes = /* @__PURE__ */ new Map();
const replacedLinks = /* @__PURE__ */ new WeakSet();
onEndpointReplacing(() => {
  for (const route of routes.values()) if (route.link) replacedLinks.add(route.link);
});
const routeState = Vue.observable({
  up: {},
  carrying: {},
  opening: {},
  fellBack: {},
  dropped: {}
});
function forgetRouteState(id) {
  Vue.delete(routeState.up, id);
  Vue.delete(routeState.carrying, id);
  Vue.delete(routeState.opening, id);
  Vue.delete(routeState.fellBack, id);
  Vue.delete(routeState.dropped, id);
}
export const CARRYING_WINDOW_MS = 8e3;
const CARRYING_TICK_MS = 1e3;
export const SILENT_DROP_MS = 15e3;
const droppedAt = /* @__PURE__ */ new Map();
export function bluetoothCarrying(printerId) {
  const id = printerId.toLowerCase();
  return routeState.carrying[id] === true && radioState.heard[id] === true;
}
const radioState = Vue.observable({ heard: {} });
export const NOT_ON_BLUETOOTH_MS = 1e4;
export const NOT_ON_BLUETOOTH_REASON = "The printer answered through Muon3D, not over Bluetooth. Connect over Bluetooth again to retry.";
function watchRadioPath(id, link) {
  const upAt = Date.now();
  Vue.set(radioState.heard, id, false);
  const tick = setInterval(() => {
    if (routes.get(id)?.link !== link || !link.isOpen()) {
      clearInterval(tick);
      Vue.set(radioState.heard, id, false);
      return;
    }
    const heardAt = link.lastHeardAt?.() ?? link.lastTrafficAt();
    const heard = heardAt > upAt && Date.now() - heardAt < CARRYING_WINDOW_MS;
    if (radioState.heard[id] !== heard) Vue.set(radioState.heard, id, heard);
    if (heard) {
      if (routeState.fellBack[id] === NOT_ON_BLUETOOTH_REASON) Vue.delete(routeState.fellBack, id);
    } else if (heardAt <= upAt && Date.now() - upAt > NOT_ON_BLUETOOTH_MS && !routeState.fellBack[id]) {
      Vue.set(routeState.fellBack, id, NOT_ON_BLUETOOTH_REASON);
    }
  }, CARRYING_TICK_MS);
}
export function bluetoothOpening(printerId) {
  return routeState.opening[printerId.toLowerCase()] === true;
}
export function bluetoothLinkUp(printerId) {
  return routeState.up[printerId.toLowerCase()] === true;
}
export function remoteRouteLabel(printerId) {
  if (!printerId) return "Through Muon3D";
  if (bluetoothCarrying(printerId)) return "Via Bluetooth";
  return bluetoothDropped(printerId) ? "Bluetooth dropped" : "Through Muon3D";
}
export function bluetoothFellBack(printerId) {
  return routeState.fellBack[printerId.toLowerCase()] ?? null;
}
export function noteBluetoothFellBack(printerId, reason) {
  const id = printerId.toLowerCase();
  if (!routes.has(id)) return;
  Vue.set(routeState.fellBack, id, reason);
  Vue.set(routeState.up, id, false);
}
export function bluetoothDropped(printerId) {
  return routeState.dropped[printerId.toLowerCase()] ?? null;
}
export function reconnectBluetooth(printerId) {
  Vue.delete(routeState.dropped, printerId.toLowerCase());
}
export function noteBluetoothDropped(printerId, reason) {
  const id = printerId.toLowerCase();
  if (!routes.has(id)) return;
  if (!routeState.dropped[id]) droppedAt.set(id, Date.now());
  Vue.set(routeState.dropped, id, reason);
}
export function clearBluetoothDropped(printerId) {
  const id = printerId.toLowerCase();
  Vue.delete(routeState.dropped, id);
  droppedAt.delete(id);
}
export function bluetoothDroppedAt(printerId) {
  return droppedAt.get(printerId.toLowerCase()) ?? 0;
}
export function droppedBluetoothPrinters() {
  return Object.keys(routeState.dropped);
}
export function bluetoothDeviceFor(printerId) {
  return routes.get(printerId.toLowerCase())?.device ?? null;
}
function routeUnavailableOn(endpoint, id) {
  try {
    return endpoint?.routeUnavailable?.(id) === true;
  } catch {
    return false;
  }
}
export function useBluetoothFor(printerId, device) {
  const id = printerId.toLowerCase();
  const existing = routes.get(id);
  if (existing?.device === device) return;
  existing?.link?.disconnect();
  routes.set(id, { device, link: null, pinnedOn: existing?.pinnedOn });
  forgetRouteState(id);
}
export function wantsBluetoothFor(printerId) {
  return routes.has(printerId.toLowerCase());
}
export function releaseBluetoothLink(printerId) {
  const route = routes.get(printerId.toLowerCase());
  if (!route?.link) return Promise.resolve();
  const hangingUp = route.link.disconnect().catch(() => {
  });
  route.link = null;
  Vue.set(routeState.up, printerId.toLowerCase(), false);
  Vue.set(routeState.carrying, printerId.toLowerCase(), false);
  return hangingUp;
}
export function stopUsingBluetoothFor(printerId) {
  const id = printerId.toLowerCase();
  const route = routes.get(id);
  pinOn(route?.pinnedOn, id, false);
  route?.link?.disconnect();
  routes.delete(id);
  forgetRouteState(id);
}
export async function bluetoothRouteFor(endpoint, printerId, options) {
  const route = routes.get(printerId.toLowerCase());
  if (!route || !takesBleLinks(endpoint)) return null;
  const id = printerId.toLowerCase();
  if (route.pinnedOn !== endpoint) {
    if (route.pinnedOn && route.link) {
      const old = route.link;
      route.link = null;
      await old.disconnect().catch(() => {
      });
    }
    pinOn(route.pinnedOn, id, false);
    pinOn(endpoint, id, true);
    route.pinnedOn = endpoint;
  }
  if (route.link?.isOpen()) return route.link;
  Vue.set(routeState.opening, id, true);
  let link;
  try {
    link = route.link = await openBleLink(endpoint, route.device, options);
  } finally {
    Vue.set(routeState.opening, id, false);
  }
  if (link.printerId !== id) {
    await link.disconnect();
    route.link = null;
    throw new Error("The printer nearby is not the one asked for.");
  }
  Vue.set(routeState.up, id, true);
  Vue.delete(routeState.fellBack, id);
  Vue.delete(routeState.dropped, id);
  Vue.set(routeState.carrying, id, true);
  const openedAt = Date.now();
  watchRadioPath(id, link);
  const tick = setInterval(() => {
    if (routes.get(id)?.link !== link) return;
    const heard = link.lastHeardAt?.() ?? link.lastTrafficAt();
    const silent = link.isOpen() && heard > openedAt && Date.now() - heard > SILENT_DROP_MS;
    const carrying = link.isOpen() && !silent;
    if (routeState.carrying[id] !== carrying) Vue.set(routeState.carrying, id, carrying);
    if (routeState.dropped[id]) return;
    if (routeUnavailableOn(routes.get(id)?.pinnedOn, id)) {
      noteBluetoothDropped(id, "Bluetooth has no path to the printer.");
    } else if (silent) {
      noteBluetoothDropped(id, `Nothing came over Bluetooth for ${SILENT_DROP_MS / 1e3} seconds.`);
      link.disconnect().catch(() => {
      });
    }
  }, CARRYING_TICK_MS);
  link.closed.then(() => {
    clearInterval(tick);
    const route2 = routes.get(id);
    if (route2?.link === link) {
      Vue.set(routeState.up, id, false);
      Vue.set(routeState.carrying, id, false);
      if (replacedLinks.has(link)) {
        route2.link = null;
      } else if (!routeState.dropped[id]) {
        noteBluetoothDropped(id, "The Bluetooth link dropped.");
      }
    }
  });
  return link;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpbmsudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBIEJsdWV0b290aCBsaW5rIGZyb20gdGhpcyBwYWdlIHRvIGEgcHJpbnRlciwgam9pbmVkIHRvIHRoZSB0YWIncyBJcm9oXG4gKiBlbmRwb2ludCAoQURSIDAwMzIgRDM7IEtBTi00MzUsIEtBTi00MzYpLlxuICpcbiAqIFRoZSByYWRpbyBpcyBkcml2ZW4gaGVyZSwgaW4gVHlwZVNjcmlwdCwgYW5kIGV2ZXJ5IHNlZ21lbnQgZ29lcyB0byB0aGVcbiAqIGBCbGVMaW5rYCB0aGF0IG11b24tbGluay13ZWIncyBgTXVvbkVuZHBvaW50LmFkZExpbmtgIHJldHVybnMsIHNvIFFVSUMgcnVuc1xuICogb3ZlciB0aGUgbGluayB3aXRoIHRoZSBwYWdlJ3Mgb3duIGtleSAoSXJvaF9CTEUgYGRvY3MvSU5URUdSQVRJT04ubWRgIMKnMyk6XG4gKlxuICogICBUWCBub3RpZmljYXRpb24gICAgICAgIC0+IGxpbmsub25TZWdtZW50XG4gKiAgIGxpbmsubmV4dFNlZ21lbnQoKSAgICAgLT4gd3JpdGUgUlgsIGluIG9yZGVyLCBvbmNlIGVhY2hcbiAqICAgZXZlcnkgc2Vjb25kLCB1bnRpbCBIRUxMTyBjb21wbGV0ZXM6IGxpbmsucmV0cnlIYW5kc2hha2UoKVxuICpcbiAqIE9uY2UgdGhlIGxpbmsgaXMgdXAsIGBlbmRwb2ludC5jb25uZWN0KHByaW50ZXJJZClgIHJlYWNoZXMgdGhlIHByaW50ZXIgb3ZlclxuICogaXQ6IG11b24tbGluay13ZWIgYWRkcyBhIGNvbm5lY3RlZCBsaW5rIHRvIHRoZSBwcmludGVyJ3MgYWRkcmVzcy4gVGhpcyBpcyBhXG4gKiBwb3J0IG9mIHRoZSBwYXJ0cyBvZiBJcm9oX0JMRSdzIGBibGVsaW5rLXdlYi5qc2AgdGhhdCBtdW9uLWxpbmstd2ViJ3MgbGlua1xuICogb2JqZWN0IHN1cHBvcnRzLlxuICovXG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IG9uRW5kcG9pbnRSZXBsYWNpbmcgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvZW5kcG9pbnQtaG9va3MnXG5pbXBvcnQge1xuICBkZWNvZGVJbmZvLFxuICBnYXR0RHJvcHBlZE1lc3NhZ2UsXG4gIE1VT05fQkxFX0lORk8sXG4gIE1VT05fQkxFX1JYLFxuICBNVU9OX0JMRV9TRVJWSUNFLFxuICBNVU9OX0JMRV9UWCxcbiAgdHlwZSBCbGVEZXZpY2UsXG4gIHR5cGUgQmxlSW5mbyxcbiAgdHlwZSBHYXR0Q2hhcmFjdGVyaXN0aWNcbn0gZnJvbSAnLi93ZWJCbHVldG9vdGgnXG5cbi8qKiBUaGUgbGFyZ2VzdCBzZWdtZW50IHRoaXMgcGFnZSB3cml0ZXMgdG8gYSBwcmludGVyLCB3aGF0ZXZlciBJTkZPIHNheXMuICovXG5leHBvcnQgY29uc3QgTUFYX1dSSVRFX1NFR01FTlQgPSAyNDRcblxuLyoqXG4gKiBUaGUgc2VnbWVudCBzaXplIHRvIGpvaW4gYSBsaW5rIHdpdGg6IHRoZSBwcmludGVyJ3MgSU5GTyB2YWx1ZSwgY2FwcGVkIGF0XG4gKiB7QGxpbmsgTUFYX1dSSVRFX1NFR01FTlR9LiBgMGAgKHRoZSBwcmludGVyIGRpZCBub3Qgc2F5KSBzdGF5cyBgdW5kZWZpbmVkYCwgc29cbiAqIHRoZSBlbmRwb2ludCBrZWVwcyBpdHMgb3duIGRlZmF1bHQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXBwZWRTZWdtZW50IChpbmZvU2VnbWVudDogbnVtYmVyKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbmZvU2VnbWVudCkgcmV0dXJuIHVuZGVmaW5lZFxuICByZXR1cm4gTWF0aC5taW4oaW5mb1NlZ21lbnQsIE1BWF9XUklURV9TRUdNRU5UKVxufVxuXG4vKiogbXVvbi1saW5rLXdlYidzIGBCbGVMaW5rYCwgYXMgZmFyIGFzIHRoaXMgZHJpdmVyIHVzZXMgaXQuICovXG5leHBvcnQgaW50ZXJmYWNlIFdhc21CbGVMaW5rIHtcbiAgb25TZWdtZW50IChzZWdtZW50OiBVaW50OEFycmF5KTogdm9pZDtcbiAgbmV4dFNlZ21lbnQgKCk6IFByb21pc2U8VWludDhBcnJheSB8IHVuZGVmaW5lZD47XG4gIGNvbm5lY3RlZCAoKTogUHJvbWlzZTxzdHJpbmc+O1xuICByZXRyeUhhbmRzaGFrZSAoKTogYm9vbGVhbjtcbiAgaXNDbG9zZWQgKCk6IGJvb2xlYW47XG4gIGNsb3NlICgpOiB2b2lkO1xuICBvbkRpc2Nvbm5lY3RlZCAoKTogdm9pZDtcbn1cblxuLyoqIEFuIGVuZHBvaW50IHRoYXQgdGFrZXMgQmx1ZXRvb3RoIGxpbmtzOiBtdW9uLWxpbmstd2ViIGZyb20gbXVvbi1saW5rIzMxIG9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBCbGVDYXBhYmxlRW5kcG9pbnQge1xuICBhZGRMaW5rIChyb2xlOiAnY2VudHJhbCcsIG1heFNlZ21lbnQ/OiBudW1iZXIpOiBXYXNtQmxlTGluaztcbiAgLyoqXG4gICAqIEtlZXBzIHRoZSBjb25uZWN0aW9uIHRvIGBwcmludGVySWRgIG9uIEJsdWV0b290aCB3aGlsZSBhIGxpbmsgaXMgdXAsXG4gICAqIGluc3RlYWQgb2YgbW92aW5nIGl0IHRvIHRoZSByZWxheSAoRC0wODA7IG11b24tbGluay13ZWIgZnJvbSBtdW9uLWxpbmsjMTI4XG4gICAqIG9uKS4gQWJzZW50IG9uIGFuIG9sZGVyIG11b24tbGluay13ZWIsIHdoZXJlIHRoZSByYWRpbyBzdGF5cyBhIHN0YW5kYnkuXG4gICAqL1xuICBwaW5CbHVldG9vdGg/IChwcmludGVySWQ6IHN0cmluZywgcGlubmVkOiBib29sZWFuKTogdm9pZDtcbiAgLyoqXG4gICAqIENob29zZXMgdGhlIHJvdXRlIHRvIGBwcmludGVySWRgIChKYWNrJ3MgcGF0aCBydWxlLCBLQU4tMTkxMyk6IGBibGVgLFxuICAgKiBgbGFuYCBvciBgY2xvdWRgIGlzIHRoZSBvbmx5IHJvdXRlIHRoZSBzZXNzaW9uIHVzZXMsIG9uIHRoZSBwYWdlIGFuZCBvblxuICAgKiB0aGUgcHJpbnRlcjsgYGF1dG9gIHJhbmtzIFdpLUZpL0xBTiwgdGhlbiBNdW9uM0QsIHRoZW4gQmx1ZXRvb3RoLlxuICAgKiBtdW9uLWxpbmstd2ViIGZyb20gbXVvbi1saW5rIzEzNSBvbjsgYHBpbkJsdWV0b290aGAgYmVmb3JlIGl0LlxuICAgKi9cbiAgY2hvb3NlUm91dGU/IChwcmludGVySWQ6IHN0cmluZywgcm91dGU6ICdhdXRvJyB8ICdibGUnIHwgJ2xhbicgfCAnY2xvdWQnKTogdm9pZDtcbiAgLyoqIFRydWUgb25jZSB0aGUgY2hvc2VuIHJvdXRlIGhhZCBubyBwYXRoIHdoZW4gaXJvaCBsYXN0IHNlbGVjdGVkIG9uZSAobXVvbi1saW5rIzEzNSBvbikuICovXG4gIHJvdXRlVW5hdmFpbGFibGU/IChwcmludGVySWQ6IHN0cmluZyk6IGJvb2xlYW47XG59XG5cbi8qKiBQaW5zIG9yIHVucGlucyBgaWRgIG9uIGBlbmRwb2ludGAsIHdoZXJlIGl0cyBtdW9uLWxpbmstd2ViIGNhbi4gTmV2ZXIgdGhyb3dzLiAqL1xuZnVuY3Rpb24gcGluT24gKGVuZHBvaW50OiBCbGVDYXBhYmxlRW5kcG9pbnQgfCB1bmRlZmluZWQsIGlkOiBzdHJpbmcsIHBpbm5lZDogYm9vbGVhbikge1xuICB0cnkge1xuICAgIGlmIChlbmRwb2ludD8uY2hvb3NlUm91dGUpIGVuZHBvaW50LmNob29zZVJvdXRlKGlkLCBwaW5uZWQgPyAnYmxlJyA6ICdhdXRvJylcbiAgICBlbHNlIGVuZHBvaW50Py5waW5CbHVldG9vdGg/LihpZCwgcGlubmVkKVxuICB9IGNhdGNoIHsgLyogYW4gb2xkZXIgb3IgY2xvc2VkIGVuZHBvaW50OiB0aGUgZGVmYXVsdCBwYXRoIHJhbmtpbmcgc3RheXMgKi8gfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFrZXNCbGVMaW5rcyAoZW5kcG9pbnQ6IHVua25vd24pOiBlbmRwb2ludCBpcyBCbGVDYXBhYmxlRW5kcG9pbnQge1xuICByZXR1cm4gdHlwZW9mIChlbmRwb2ludCBhcyB7IGFkZExpbms/OiB1bmtub3duIH0gfCBudWxsKT8uYWRkTGluayA9PT0gJ2Z1bmN0aW9uJ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJsZUxpbmtIYW5kbGUge1xuICAvKiogVGhlIHByaW50ZXIncyBFbmRwb2ludElkLCBhcyBgSEVMTE9gIGFuZCBgSU5GT2AgYm90aCBjbGFpbWVkIGl0LiAqL1xuICBwcmludGVySWQ6IHN0cmluZztcbiAgaW5mbzogQmxlSW5mbztcbiAgLyoqIEhhbmdzIHVwOiBgQllFYCwgdGhlbiB0aGUgR0FUVCBjb25uZWN0aW9uLiBTYWZlIHRvIGNhbGwgbW9yZSB0aGFuIG9uY2UuICovXG4gIGRpc2Nvbm5lY3QgKCk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBSZXNvbHZlcyBvbmNlIHRoZSBHQVRUIGNvbm5lY3Rpb24gaXMgZ29uZSwgd2hvZXZlciBlbmRlZCBpdC4gKi9cbiAgY2xvc2VkOiBQcm9taXNlPHZvaWQ+O1xuICAvKiogVHJ1ZSB1bnRpbCBgY2xvc2VkYCByZXNvbHZlcy4gKi9cbiAgaXNPcGVuICgpOiBib29sZWFuO1xuICAvKiogV2hlbiBhIHNlZ21lbnQgbGFzdCBjcm9zc2VkIHRoZSByYWRpbywgZWl0aGVyIHdheSAobXMgc2luY2UgdGhlIGVwb2NoOyAwIGZvciBuZXZlcikuICovXG4gIGxhc3RUcmFmZmljQXQgKCk6IG51bWJlcjtcbiAgLyoqIFdoZW4gdGhlIHByaW50ZXIgbGFzdCBzZW50IGEgc2VnbWVudCAobXMgc2luY2UgdGhlIGVwb2NoOyAwIGZvciBuZXZlcik6IHdyaXRlcyBhbG9uZSBkbyBub3Qgc2hvdyBhIGxpdmUgcGF0aC4gKi9cbiAgbGFzdEhlYXJkQXQ/ICgpOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BlbkxpbmtPcHRpb25zIHtcbiAgY29ubmVjdFRpbWVvdXRNcz86IG51bWJlcjtcbiAgaGVsbG9UaW1lb3V0TXM/OiBudW1iZXI7XG4gIGxvZz86IChsaW5lOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbmNvbnN0IENPTk5FQ1RfVElNRU9VVF9NUyA9IDIwXzAwMFxuLyoqIElyb2hfQkxFJ3Mgb3duIGRyaXZlciBnaXZlcyBgSEVMTE9gIDEwIHMuICovXG5jb25zdCBIRUxMT19USU1FT1VUX01TID0gMTBfMDAwXG5jb25zdCBIRUxMT19SRVRSWV9NUyA9IDFfMDAwXG4vKiogSG93IGxvbmcgYW4gb3JkZXJseSBoYW5nLXVwIGdldHMgdG8gd3JpdGUgYEJZRWAgYmVmb3JlIHRoZSByYWRpbyBkcm9wcy4gKi9cbmNvbnN0IERSQUlOX01TID0gMl8wMDBcbi8qKiBGYWlsZWQgd3JpdGVzIGluIGEgcm93IGFmdGVyIHdoaWNoIHRoZSBsaW5rIGlzIGdpdmVuIHVwLiAqL1xuY29uc3QgTUFYX1dSSVRFX0ZBSUxVUkVTID0gMTZcbi8qKlxuICogUGF1c2VzIGJlZm9yZSBlYWNoIGZ1cnRoZXIgR0FUVCBzZXR1cC4gQ2hyb21lIGNhbiByZXNvbHZlXG4gKiBgZ2F0dC5jb25uZWN0KClgIG9uIGEgY29ubmVjdGlvbiB0aGF0IGlzIHN0aWxsIGdvaW5nIGRvd246IGByZWFkSW5mb2AgaGFzXG4gKiBqdXN0IGh1bmcgdXAsIG9yIHRoZSBicm93c2VyIGlzIGZpbmlzaGluZyBpdHMgUGFpciBzdGVwLiBUaGUgb2xkIGNvbm5lY3Rpb25cbiAqIHRoZW4gZW5kcywgYW5kIGBnZXRQcmltYXJ5U2VydmljZWAgZmFpbHMgd2l0aCBcIkdBVFQgU2VydmVyIGlzIGRpc2Nvbm5lY3RlZC5cbiAqIENhbm5vdCByZXRyaWV2ZSBzZXJ2aWNlcy5cIiAoQm94d29vZCwgNSBOb3YgMjAyNikuIEEgZnJlc2ggY29ubmVjdCBhZnRlciBhXG4gKiBwYXVzZSB3b3Jrcy4gV2luZG93cyBob2xkcyB0aGUgcmFkaW8gbGluayBhYm91dCAzLjMgcyBhZnRlciB0aGUgcGFnZSBsZXRzXG4gKiBnbyAoYnRtb24gb24gQm94d29vZDogbGFzdCBBVFQgMTc6Mzk6MTMuODcsIGxhcHRvcCdzIDB4MTMgYXQgMTc6Mzk6MTcuMjIpLFxuICogc28gdGhlIGxhc3QgcGF1c2UgbGFuZHMgYWZ0ZXIgdGhhdDsgYWxsIHRocmVlIGZpdCBpbiBDT05ORUNUX1RJTUVPVVRfTVMuXG4gKi9cbmV4cG9ydCBjb25zdCBHQVRUX1JFVFJZX01TID0gWzc1MCwgMTUwMCwgMzAwMF1cblxuLyoqIFRydWUgd2hlbiBhIEdBVFQgc3RlcCBmYWlsZWQgYmVjYXVzZSB0aGUgY29ubmVjdGlvbiB3ZW50IGRvd24gdW5kZXIgaXQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2F0dFdlbnREb3duIChlcnJvcjogdW5rbm93biwgZ2F0dDogeyBjb25uZWN0ZWQ/OiBib29sZWFuIH0pOiBib29sZWFuIHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgR2F0dERyb3BwZWQpIHJldHVybiB0cnVlXG4gIGlmIChnYXR0LmNvbm5lY3RlZCA9PT0gZmFsc2UpIHJldHVybiB0cnVlXG4gIGNvbnN0IGUgPSBlcnJvciBhcyB7IG5hbWU/OiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcgfSB8IG51bGxcbiAgcmV0dXJuIGU/Lm5hbWUgPT09ICdOZXR3b3JrRXJyb3InIHx8IC9kaXNjb25uZWN0ZWR8XFwocmVcXCljb25uZWN0L2kudGVzdChlPy5tZXNzYWdlID8/ICcnKVxufVxuXG5jbGFzcyBHYXR0RHJvcHBlZCBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IgKCkgeyBzdXBlcignVGhlIHByaW50ZXIgd2VudCBhd2F5IHdoaWxlIGNvbm5lY3RpbmcuJykgfVxufVxuXG4vKiogT25lIGxpbmsgcGVyIGRldmljZTogdHdvIHdvdWxkIHNoYXJlIGl0cyBHQVRUIGNvbm5lY3Rpb24gYW5kIGV2ZXJ5IFRYIG5vdGlmaWNhdGlvbi4gKi9cbmNvbnN0IG93bmVycyA9IG5ldyBXZWFrTWFwPEJsZURldmljZSwgQmxlTGlua0hhbmRsZSB8ICdvcGVuaW5nJz4oKVxuXG5mdW5jdGlvbiB3aXRoVGltZW91dDxUPiAocDogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgd2hhdDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTxUPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgdCA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgJHt3aGF0fSB0aW1lZCBvdXRgKSksIG1zKVxuICAgIHAudGhlbihcbiAgICAgIHYgPT4geyBjbGVhclRpbWVvdXQodCk7IHJlc29sdmUodikgfSxcbiAgICAgIGUgPT4geyBjbGVhclRpbWVvdXQodCk7IHJlamVjdChlKSB9XG4gICAgKVxuICB9KVxufVxuXG5jb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKVxuXG4vKiogQSBwbGFpbiBgVWludDhBcnJheWAgb3ZlciBhbiBgQXJyYXlCdWZmZXJgLCBhcyB0aGUgRE9NIHR5cGluZ3Mgd2FudCBpdCBzcGVsbGVkLiAqL1xuY29uc3Qgc291cmNlID0gKGJ5dGVzOiBVaW50OEFycmF5KSA9PiBieXRlcyBhcyB1bmtub3duIGFzIEJ1ZmZlclNvdXJjZVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZSAocng6IEdhdHRDaGFyYWN0ZXJpc3RpYywgc2VnbWVudDogVWludDhBcnJheSwgd2l0aFJlc3BvbnNlOiBib29sZWFuKSB7XG4gIGlmICghd2l0aFJlc3BvbnNlICYmIHR5cGVvZiByeC53cml0ZVZhbHVlV2l0aG91dFJlc3BvbnNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgYXdhaXQgcngud3JpdGVWYWx1ZVdpdGhvdXRSZXNwb25zZShzb3VyY2Uoc2VnbWVudCkpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHJ4LndyaXRlVmFsdWVXaXRoUmVzcG9uc2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICBhd2FpdCByeC53cml0ZVZhbHVlV2l0aFJlc3BvbnNlKHNvdXJjZShzZWdtZW50KSlcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JYIHRha2VzIG5vIHdyaXRlcycpXG4gIH1cbn1cblxuLyoqXG4gKiBDb25uZWN0cyB0byBgZGV2aWNlYCBvdmVyIEdBVFQgYW5kIGJyaW5ncyB1cCBhIGxpbmsgb24gYGVuZHBvaW50YC4gTmVlZHNcbiAqIG5vIGNsaWNrIG9uY2UgdGhlIHBhZ2UgaGFzIHRoZSBkZXZpY2UuIFJlamVjdHMgaWYgdGhlIHByaW50ZXIgZG9lcyBub3RcbiAqIGFuc3dlciwgb3IgaWYgaXRzIGBJTkZPYCBhbmQgYEhFTExPYCBuYW1lIGRpZmZlcmVudCBwcmludGVycy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wZW5CbGVMaW5rIChcbiAgZW5kcG9pbnQ6IEJsZUNhcGFibGVFbmRwb2ludCxcbiAgZGV2aWNlOiBCbGVEZXZpY2UsXG4gIG9wdGlvbnM6IE9wZW5MaW5rT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPEJsZUxpbmtIYW5kbGU+IHtcbiAgY29uc3QgbG9nID0gb3B0aW9ucy5sb2cgPz8gKCgpID0+IHt9KVxuICBjb25zdCBnYXR0ID0gZGV2aWNlLmdhdHRcbiAgaWYgKCFnYXR0KSB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcmludGVyIG9mZmVyZWQgbm8gR0FUVCBjb25uZWN0aW9uLicpXG4gIGNvbnN0IGN1cnJlbnQgPSBvd25lcnMuZ2V0KGRldmljZSlcbiAgaWYgKGN1cnJlbnQgPT09ICdvcGVuaW5nJyB8fCAoY3VycmVudCAmJiBjdXJyZW50LmlzT3BlbigpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBwYWdlIGlzIGFscmVhZHkgY29ubmVjdGVkIHRvIHRoYXQgcHJpbnRlciBvdmVyIEJsdWV0b290aC4nKVxuICB9XG4gIG93bmVycy5zZXQoZGV2aWNlLCAnb3BlbmluZycpXG5cbiAgbGV0IGxpbms6IFdhc21CbGVMaW5rIHwgbnVsbCA9IG51bGxcbiAgbGV0IHR4OiBHYXR0Q2hhcmFjdGVyaXN0aWMgfCBudWxsID0gbnVsbFxuICBsZXQgcmFkaW9VcCA9IHRydWVcbiAgY29uc3QgZWFybHk6IFVpbnQ4QXJyYXlbXSA9IFtdXG4gIGxldCByZXNvbHZlQ2xvc2VkOiAoKSA9PiB2b2lkID0gKCkgPT4ge31cbiAgY29uc3QgY2xvc2VkID0gbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiB7IHJlc29sdmVDbG9zZWQgPSByZXNvbHZlIH0pXG4gIGxldCByZXNvbHZlRHJhaW5lZDogKCkgPT4gdm9pZCA9ICgpID0+IHt9XG4gIGNvbnN0IGRyYWluZWQgPSBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHsgcmVzb2x2ZURyYWluZWQgPSByZXNvbHZlIH0pXG5cbiAgbGV0IGxhc3RUcmFmZmljID0gMFxuICBsZXQgbGFzdEhlYXJkID0gMFxuICBjb25zdCBvbk5vdGlmaWNhdGlvbiA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBpZiAoIXJhZGlvVXApIHJldHVyblxuICAgIGNvbnN0IHZhbHVlID0gKGV2ZW50LnRhcmdldCBhcyBHYXR0Q2hhcmFjdGVyaXN0aWMpLnZhbHVlXG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuXG4gICAgbGFzdFRyYWZmaWMgPSBsYXN0SGVhcmQgPSBEYXRlLm5vdygpXG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh2YWx1ZS5idWZmZXIsIHZhbHVlLmJ5dGVPZmZzZXQsIHZhbHVlLmJ5dGVMZW5ndGgpXG4gICAgaWYgKGxpbmspIGxpbmsub25TZWdtZW50KGJ5dGVzKVxuICAgIGVsc2UgZWFybHkucHVzaChieXRlcy5zbGljZSgpKVxuICB9XG5cbiAgY29uc3Qgb25Hb25lID0gKCkgPT4ge1xuICAgIGlmICghcmFkaW9VcCkgcmV0dXJuXG4gICAgcmFkaW9VcCA9IGZhbHNlXG4gICAgZGV2aWNlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2dhdHRzZXJ2ZXJkaXNjb25uZWN0ZWQnLCBvbkdvbmUpXG4gICAgdHg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NoYXJhY3RlcmlzdGljdmFsdWVjaGFuZ2VkJywgb25Ob3RpZmljYXRpb24pXG4gICAgbGluaz8ub25EaXNjb25uZWN0ZWQoKVxuICAgIGlmIChvd25lcnMuZ2V0KGRldmljZSkgPT09IGhhbmRsZSB8fCBvd25lcnMuZ2V0KGRldmljZSkgPT09ICdvcGVuaW5nJykgb3duZXJzLmRlbGV0ZShkZXZpY2UpXG4gICAgbG9nKCdibHVldG9vdGg6IEdBVFQgZGlzY29ubmVjdGVkJylcbiAgICByZXNvbHZlQ2xvc2VkKClcbiAgfVxuXG4gIGNvbnN0IGRyb3BHYXR0ID0gKCkgPT4ge1xuICAgIGlmICghcmFkaW9VcCkgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIGdhdHQuZGlzY29ubmVjdCgpXG4gICAgfSBjYXRjaCB7IC8qIGFscmVhZHkgZ29uZSAqLyB9XG4gICAgLy8gU29tZSBwbGF0Zm9ybXMgZmlyZSBubyBnYXR0c2VydmVyZGlzY29ubmVjdGVkIGZvciBhIGxvY2FsIGRpc2Nvbm5lY3QoKS5cbiAgICBvbkdvbmUoKVxuICB9XG5cbiAgbGV0IGRpc2Nvbm5lY3Rpbmc6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbFxuICBjb25zdCBoYW5kbGU6IEJsZUxpbmtIYW5kbGUgPSB7XG4gICAgcHJpbnRlcklkOiAnJyxcbiAgICBpbmZvOiBudWxsIGFzIHVua25vd24gYXMgQmxlSW5mbyxcbiAgICBkaXNjb25uZWN0ICgpIHtcbiAgICAgIGRpc2Nvbm5lY3RpbmcgPz89IChhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghcmFkaW9VcCkgcmV0dXJuXG4gICAgICAgIGxpbms/LmNsb3NlKClcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5yYWNlKFtkcmFpbmVkLCBzbGVlcChEUkFJTl9NUyldKVxuICAgICAgICBkcm9wR2F0dCgpXG4gICAgICB9KSgpXG4gICAgICByZXR1cm4gZGlzY29ubmVjdGluZ1xuICAgIH0sXG4gICAgY2xvc2VkLFxuICAgIGlzT3BlbjogKCkgPT4gcmFkaW9VcCxcbiAgICBsYXN0VHJhZmZpY0F0OiAoKSA9PiBsYXN0VHJhZmZpYyxcbiAgICBsYXN0SGVhcmRBdDogKCkgPT4gbGFzdEhlYXJkXG4gIH1cblxuICAvLyBPbmUgR0FUVCBzZXR1cC4gQSBkcm9wIGR1cmluZyBpdCBmYWlscyBvbmx5IHRoaXMgYXR0ZW1wdCAob25Hb25lIGlzIG5vdFxuICAvLyBhcm1lZCB5ZXQpLCBzbyB0aGUgbmV4dCBhdHRlbXB0IHN0YXJ0cyBjbGVhbi5cbiAgbGV0IGFiYW5kb25lZCA9IGZhbHNlXG4gIGNvbnN0IHNldFVwR2F0dCA9IGFzeW5jICgpID0+IHtcbiAgICBsZXQgZHJvcHBlZCA9IGZhbHNlXG4gICAgY29uc3Qgb25Ecm9wID0gKCkgPT4geyBkcm9wcGVkID0gdHJ1ZSB9XG4gICAgLy8gQSBjYWxsLCBub3QgYW4gaW5saW5lIHRlc3Q6IHRoZSBjb25uZWN0aW9uIGNhbiBlbmQgYXQgYW55IGF3YWl0LlxuICAgIGNvbnN0IHdlbnREb3duID0gKCkgPT4gZHJvcHBlZCB8fCBnYXR0LmNvbm5lY3RlZCA9PT0gZmFsc2VcbiAgICBkZXZpY2UuYWRkRXZlbnRMaXN0ZW5lcignZ2F0dHNlcnZlcmRpc2Nvbm5lY3RlZCcsIG9uRHJvcClcbiAgICBsZXQgdHhDaGFyOiBHYXR0Q2hhcmFjdGVyaXN0aWMgfCBudWxsID0gbnVsbFxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCBnYXR0LmNvbm5lY3QoKVxuICAgICAgaWYgKHdlbnREb3duKCkpIHRocm93IG5ldyBHYXR0RHJvcHBlZCgpXG4gICAgICBjb25zdCBzZXJ2aWNlID0gYXdhaXQgc2VydmVyLmdldFByaW1hcnlTZXJ2aWNlKE1VT05fQkxFX1NFUlZJQ0UpXG4gICAgICAvLyBPbmUgYXQgYSB0aW1lOiBzb21lIHBsYXRmb3JtcyByZWZ1c2UgY29uY3VycmVudCBHQVRUIG9wZXJhdGlvbnMuXG4gICAgICBjb25zdCBpbmZvQ2hhciA9IGF3YWl0IHNlcnZpY2UuZ2V0Q2hhcmFjdGVyaXN0aWMoTVVPTl9CTEVfSU5GTylcbiAgICAgIGNvbnN0IHJ4Q2hhciA9IGF3YWl0IHNlcnZpY2UuZ2V0Q2hhcmFjdGVyaXN0aWMoTVVPTl9CTEVfUlgpXG4gICAgICB0eENoYXIgPSBhd2FpdCBzZXJ2aWNlLmdldENoYXJhY3RlcmlzdGljKE1VT05fQkxFX1RYKVxuICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBpbmZvQ2hhci5yZWFkVmFsdWUoKVxuICAgICAgY29uc3QgZGVjb2RlZCA9IGRlY29kZUluZm8obmV3IFVpbnQ4QXJyYXkodmFsdWUuYnVmZmVyLCB2YWx1ZS5ieXRlT2Zmc2V0LCB2YWx1ZS5ieXRlTGVuZ3RoKSlcbiAgICAgIGlmICghZGVjb2RlZCkgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJpbnRlciBhbnN3ZXJlZCB3aXRoIGFuIElORk8gdmFsdWUgdGhpcyBwYWdlIGRvZXMgbm90IHVuZGVyc3RhbmQuJylcbiAgICAgIC8vIExpc3RlbiBiZWZvcmUgc3Vic2NyaWJpbmcsIHNvIG5vIG5vdGlmaWNhdGlvbiBpcyBtaXNzZWQuXG4gICAgICB0eENoYXIuYWRkRXZlbnRMaXN0ZW5lcignY2hhcmFjdGVyaXN0aWN2YWx1ZWNoYW5nZWQnLCBvbk5vdGlmaWNhdGlvbilcbiAgICAgIGlmICh0eXBlb2YgdHhDaGFyLnN0YXJ0Tm90aWZpY2F0aW9ucyA9PT0gJ2Z1bmN0aW9uJykgYXdhaXQgdHhDaGFyLnN0YXJ0Tm90aWZpY2F0aW9ucygpXG4gICAgICBpZiAod2VudERvd24oKSkgdGhyb3cgbmV3IEdhdHREcm9wcGVkKClcbiAgICAgIHJldHVybiB7IGluZm86IGRlY29kZWQsIHJ4OiByeENoYXIsIHR4OiB0eENoYXIgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0eENoYXI/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NoYXJhY3RlcmlzdGljdmFsdWVjaGFuZ2VkJywgb25Ob3RpZmljYXRpb24pXG4gICAgICBlYXJseS5zcGxpY2UoMClcbiAgICAgIHRocm93IGVycm9yXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGRldmljZS5yZW1vdmVFdmVudExpc3RlbmVyKCdnYXR0c2VydmVyZGlzY29ubmVjdGVkJywgb25Ecm9wKVxuICAgIH1cbiAgfVxuICBjb25zdCBzZXRVcFdpdGhSZXRyaWVzID0gYXN5bmMgKCkgPT4ge1xuICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyA7IGF0dGVtcHQrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHNldFVwR2F0dCgpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoYWJhbmRvbmVkIHx8ICFnYXR0V2VudERvd24oZXJyb3IsIGdhdHQpKSB0aHJvdyBlcnJvclxuICAgICAgICBpZiAoYXR0ZW1wdCA+PSBHQVRUX1JFVFJZX01TLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGdhdHREcm9wcGVkTWVzc2FnZShkZXZpY2UubmFtZSkpXG4gICAgICAgIGxvZyhgYmx1ZXRvb3RoOiBHQVRUIHNldHVwICR7YXR0ZW1wdCArIDF9IGxvc3QgdGhlIGNvbm5lY3Rpb24gKCR7KGVycm9yIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlcnJvcn0pOyB0cnlpbmcgYWdhaW5gKVxuICAgICAgICB0cnkgeyBnYXR0LmRpc2Nvbm5lY3QoKSB9IGNhdGNoIHsgLyogYWxyZWFkeSBnb25lICovIH1cbiAgICAgICAgYXdhaXQgc2xlZXAoR0FUVF9SRVRSWV9NU1thdHRlbXB0XSlcbiAgICAgICAgaWYgKGFiYW5kb25lZCkgdGhyb3cgZXJyb3JcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHsgaW5mbywgcngsIHR4OiB0eENoYXIgfSA9IGF3YWl0IHdpdGhUaW1lb3V0KHNldFVwV2l0aFJldHJpZXMoKSwgb3B0aW9ucy5jb25uZWN0VGltZW91dE1zID8/IENPTk5FQ1RfVElNRU9VVF9NUywgJ0Nvbm5lY3Rpbmcgb3ZlciBCbHVldG9vdGgnKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHsgYWJhbmRvbmVkID0gdHJ1ZTsgdGhyb3cgZXJyb3IgfSlcbiAgICB0eCA9IHR4Q2hhclxuICAgIGRldmljZS5hZGRFdmVudExpc3RlbmVyKCdnYXR0c2VydmVyZGlzY29ubmVjdGVkJywgb25Hb25lKVxuICAgIGlmIChnYXR0LmNvbm5lY3RlZCA9PT0gZmFsc2UpIG9uR29uZSgpXG4gICAgaWYgKCFyYWRpb1VwKSB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcmludGVyIHdlbnQgYXdheSB3aGlsZSBjb25uZWN0aW5nLicpXG5cbiAgICAvLyBXZWIgQmx1ZXRvb3RoIGNhbm5vdCByZWFkIHRoZSBNVFU6IHRoZSBwcmludGVyJ3MgSU5GTyB2YWx1ZSBpcyB3aGF0IGNvdW50cyxcbiAgICAvLyB1cCB0byBhIGNhcC4gQSBwcmludGVyIHdpdGggYSA1MTctYnl0ZSBBVFQgTVRVIHNheXMgNTEyLCBhbmQgQmx1ZVogb24gdGhlXG4gICAgLy8gTTEgc2lsZW50bHkgZHJvcHMgNTEyLWJ5dGUgV3JpdGUgQ29tbWFuZHMgKEQtQnVzIGNhcHR1cmUsIDIwIE9jdCAyMDI2OiAxNFxuICAgIC8vIFdyaXRlVmFsdWUgY2FsbHMgZm9yIDQ1IEFUVCB3cml0ZXM7IG9ubHkgdGhlIHNob3J0IHNlZ21lbnRzIGFycml2ZWQpLCBzbyBhXG4gICAgLy8gUVVJQyBJbml0aWFsIG5ldmVyIGNvbXBsZXRlcy4gMjQ0IGZpdHMgb25lIGxpbmstbGF5ZXIgUERVICgyNDQgKyAzIEFUVCArXG4gICAgLy8gNCBMMkNBUCA9IDI1MSkgYW5kIHdhcyB0aGUgZmlyc3Qgc2l6ZSB0byBjb21wbGV0ZSBhIGhhbmRzaGFrZSBvbiBoYXJkd2FyZS5cbiAgICBjb25zdCBsID0gZW5kcG9pbnQuYWRkTGluaygnY2VudHJhbCcsIGNhcHBlZFNlZ21lbnQoaW5mby5tYXhTZWdtZW50KSlcbiAgICBsaW5rID0gbFxuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBlYXJseS5zcGxpY2UoMCkpIGwub25TZWdtZW50KHNlZ21lbnQpXG5cbiAgICBjb25zdCBjYW5XaXRob3V0UmVzcG9uc2UgPSB0eXBlb2Ygcngud3JpdGVWYWx1ZVdpdGhvdXRSZXNwb25zZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgcngucHJvcGVydGllcz8ud3JpdGVXaXRob3V0UmVzcG9uc2UgIT09IGZhbHNlXG4gICAgbGV0IHdpdGhSZXNwb25zZSA9ICFjYW5XaXRob3V0UmVzcG9uc2VcbiAgICA7KGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBmYWlsdXJlcyA9IDBcbiAgICAgIGZvciAoOzspIHtcbiAgICAgICAgY29uc3Qgc2VnbWVudCA9IGF3YWl0IGwubmV4dFNlZ21lbnQoKVxuICAgICAgICBpZiAoc2VnbWVudCA9PT0gdW5kZWZpbmVkKSBicmVha1xuICAgICAgICBpZiAoIXJhZGlvVXApIGNvbnRpbnVlXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgd3JpdGUocngsIHNlZ21lbnQsIHdpdGhSZXNwb25zZSlcbiAgICAgICAgICBsYXN0VHJhZmZpYyA9IERhdGUubm93KClcbiAgICAgICAgICBmYWlsdXJlcyA9IDBcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAvLyBOZXZlciByZS1zZW5kOiBhIGZhaWxlZCB3cml0ZSBtYXkgc3RpbGwgaGF2ZSBhcnJpdmVkLiBRVUlDIHJlY292ZXJzLlxuICAgICAgICAgIGZhaWx1cmVzICs9IDFcbiAgICAgICAgICBpZiAoKGVycm9yIGFzIHsgbmFtZT86IHN0cmluZyB9KT8ubmFtZSA9PT0gJ05vdFN1cHBvcnRlZEVycm9yJyAmJiBpbmZvLndyaXRlV2l0aFJlc3BvbnNlKSB3aXRoUmVzcG9uc2UgPSB0cnVlXG4gICAgICAgICAgbG9nKGBibHVldG9vdGg6IFJYIHdyaXRlIGZhaWxlZCAoJHtmYWlsdXJlc30pOiAkeyhlcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZXJyb3J9YClcbiAgICAgICAgICBpZiAoZ2F0dC5jb25uZWN0ZWQgPT09IGZhbHNlKSBvbkdvbmUoKVxuICAgICAgICAgIGVsc2UgaWYgKGZhaWx1cmVzID49IE1BWF9XUklURV9GQUlMVVJFUykgbC5vbkRpc2Nvbm5lY3RlZCgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc29sdmVEcmFpbmVkKClcbiAgICAgIGRyb3BHYXR0KClcbiAgICB9KSgpLmNhdGNoKGVycm9yID0+IHtcbiAgICAgIGxvZyhgYmx1ZXRvb3RoOiB3cml0ZSBsb29wIGZhaWxlZDogJHsoZXJyb3IgYXMgRXJyb3IpPy5tZXNzYWdlID8/IGVycm9yfWApXG4gICAgICByZXNvbHZlRHJhaW5lZCgpXG4gICAgICBsLm9uRGlzY29ubmVjdGVkKClcbiAgICAgIGRyb3BHYXR0KClcbiAgICB9KVxuXG4gICAgY29uc3QgcmV0cnkgPSBzZXRJbnRlcnZhbCgoKSA9PiB7IGwucmV0cnlIYW5kc2hha2UoKSB9LCBIRUxMT19SRVRSWV9NUylcbiAgICBsZXQgcHJpbnRlcklkOiBzdHJpbmdcbiAgICB0cnkge1xuICAgICAgbC5yZXRyeUhhbmRzaGFrZSgpXG4gICAgICBwcmludGVySWQgPSBhd2FpdCB3aXRoVGltZW91dChsLmNvbm5lY3RlZCgpLCBvcHRpb25zLmhlbGxvVGltZW91dE1zID8/IEhFTExPX1RJTUVPVVRfTVMsICdUaGUgQmx1ZXRvb3RoIGhhbmRzaGFrZScpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsZWFySW50ZXJ2YWwocmV0cnkpXG4gICAgfVxuICAgIGlmIChwcmludGVySWQudG9Mb3dlckNhc2UoKSAhPT0gaW5mby5lbmRwb2ludElkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgcHJpbnRlcidzIElORk8gYW5kIEhFTExPIG5hbWUgZGlmZmVyZW50IHByaW50ZXJzLlwiKVxuICAgIH1cbiAgICBoYW5kbGUucHJpbnRlcklkID0gaW5mby5lbmRwb2ludElkXG4gICAgaGFuZGxlLmluZm8gPSBpbmZvXG4gICAgb3duZXJzLnNldChkZXZpY2UsIGhhbmRsZSlcbiAgICBsb2coYGJsdWV0b290aDogbGluayB1cCB0byAke3ByaW50ZXJJZC5zbGljZSgwLCAxMCl9YClcbiAgICByZXR1cm4gaGFuZGxlXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGxpbms/LmlzQ2xvc2VkKCkpIHtcbiAgICAgIC8vIFRoZSBsaW5rIGNsb3NlZCBpdHNlbGYgKGEgQllFIGZyb20gdGhlIHByaW50ZXIpOiBsZXQgaXRzIEJZRSBnbyBvdXQuXG4gICAgICBhd2FpdCBQcm9taXNlLnJhY2UoW2RyYWluZWQsIHNsZWVwKERSQUlOX01TKV0pXG4gICAgfVxuICAgIGxpbms/Lm9uRGlzY29ubmVjdGVkKClcbiAgICAvLyBkcm9wR2F0dCBmcmVlcyB0aGUgZGV2aWNlIGZvciBhbm90aGVyIGF0dGVtcHQuXG4gICAgZHJvcEdhdHQoKVxuICAgIHRocm93IGVycm9yXG4gIH1cbn1cblxuLyoqXG4gKiBQcmludGVycyB0aGUgcGVyc29uIGFza2VkIHRvIG9wZW4gb3ZlciBCbHVldG9vdGgsIGJ5IEVuZHBvaW50SWQ6IHRoZVxuICogZGV2aWNlIHRvIGxpbmssIGFuZCB0aGUgbGluayBvbmNlIGl0IGlzIHVwLiBgaXJvaC50c2AgcmVhZHMgdGhpcyB3aGVuIGl0XG4gKiBkaWFscyBhIHByaW50ZXIsIHNvIGEgcHJpbnRlciB3aXRoIG5vIFdpLUZpIG9wZW5zIG92ZXIgdGhlIHJhZGlvIGFuZCBvbmVcbiAqIHRoYXQgaXMgb25saW5lIGtlZXBzIGl0cyBvbmUgQmx1ZXRvb3RoIHNsb3QgZnJlZS5cbiAqL1xuY29uc3Qgcm91dGVzID0gbmV3IE1hcDxzdHJpbmcsIHsgZGV2aWNlOiBCbGVEZXZpY2UsIGxpbms6IEJsZUxpbmtIYW5kbGUgfCBudWxsLCBwaW5uZWRPbj86IEJsZUNhcGFibGVFbmRwb2ludCB9PigpXG5cbi8qKiBMaW5rcyB3aG9zZSBlbmRwb2ludCBpcyBiZWluZyByZXBsYWNlZDogdGhlaXIgY2xvc2luZyBpcyBub3QgYSBkcm9wIG9mIHRoZWlyIHByaW50ZXIncyByb3V0ZSAoIzM3MCkuICovXG5jb25zdCByZXBsYWNlZExpbmtzID0gbmV3IFdlYWtTZXQ8b2JqZWN0PigpXG5vbkVuZHBvaW50UmVwbGFjaW5nKCgpID0+IHtcbiAgZm9yIChjb25zdCByb3V0ZSBvZiByb3V0ZXMudmFsdWVzKCkpIGlmIChyb3V0ZS5saW5rKSByZXBsYWNlZExpbmtzLmFkZChyb3V0ZS5saW5rKVxufSlcblxuLyoqXG4gKiBXaGF0IGlzIHRydWUgb2YgZWFjaCBwcmludGVyJ3MgQmx1ZXRvb3RoIHJvdXRlLCByZWFjdGl2ZSBzbyBhIGJhZGdlIGNhblxuICogZm9sbG93IGl0IChLQU4tMTM5NikuIGB3YW50c0JsdWV0b290aEZvcmAgaXMgb25seSB0aGUgcGVyc29uJ3MgY2hvaWNlOyB0aGlzXG4gKiBpcyB3aGF0IGhhcHBlbmVkOiB3aGV0aGVyIHRoZSByYWRpbyBsaW5rIGlzIHVwLCBhbmQgd2h5IG5vdCBpZiB0aGUgb3BlblxuICogd2VudCBvbiB0aHJvdWdoIE11b24zRCB3aXRob3V0IGl0LlxuICovXG5jb25zdCByb3V0ZVN0YXRlID0gVnVlLm9ic2VydmFibGUoe1xuICB1cDoge30gYXMgUmVjb3JkPHN0cmluZywgYm9vbGVhbj4sXG4gIGNhcnJ5aW5nOiB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPixcbiAgb3BlbmluZzoge30gYXMgUmVjb3JkPHN0cmluZywgYm9vbGVhbj4sXG4gIGZlbGxCYWNrOiB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICBkcm9wcGVkOiB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG59KVxuXG5mdW5jdGlvbiBmb3JnZXRSb3V0ZVN0YXRlIChpZDogc3RyaW5nKSB7XG4gIFZ1ZS5kZWxldGUocm91dGVTdGF0ZS51cCwgaWQpXG4gIFZ1ZS5kZWxldGUocm91dGVTdGF0ZS5jYXJyeWluZywgaWQpXG4gIFZ1ZS5kZWxldGUocm91dGVTdGF0ZS5vcGVuaW5nLCBpZClcbiAgVnVlLmRlbGV0ZShyb3V0ZVN0YXRlLmZlbGxCYWNrLCBpZClcbiAgVnVlLmRlbGV0ZShyb3V0ZVN0YXRlLmRyb3BwZWQsIGlkKVxufVxuXG4vKiogSG93IHJlY2VudCB0aGUgcHJpbnRlcidzIGxhc3QgcGFja2V0IG92ZXIgdGhlIHJhZGlvIG11c3QgYmUgZm9yIHRoZSBzZXNzaW9uIHRvIGNvdW50IGFzIGNhcnJpZWQgYnkgaXQgKEtBTi0yNTMxKS4gKi9cbmV4cG9ydCBjb25zdCBDQVJSWUlOR19XSU5ET1dfTVMgPSA4XzAwMFxuY29uc3QgQ0FSUllJTkdfVElDS19NUyA9IDFfMDAwXG5cbi8qKlxuICogSG93IGxvbmcgYSBjaG9zZW4gQmx1ZXRvb3RoIGxpbmsgbWF5IGNhcnJ5IG5vdGhpbmcgYmVmb3JlIGl0IGNvdW50cyBhc1xuICogZHJvcHBlZCAoS0FOLTE5MTMgcmV2aWV3KS4gQSBsaXZlIHBhdGggY2FycmllcyBRVUlDJ3Mga2VlcC1hbGl2ZSBldmVyeSA1IHMsXG4gKiBzbyBhbiBpZGxlIHNlc3Npb24gbmV2ZXIgdHJpcHMgdGhpcy4gVGhlIGxpbmsgY2FuIHN0YXkgXCJjb25uZWN0ZWRcIiB3aGlsZVxuICogY2Fycnlpbmcgbm90aGluZzogb24gdGhlIGJlbmNoICgxMiBOb3YpIENocm9tZSB1bnN1YnNjcmliZWQgZnJvbSB0aGUgVFhcbiAqIG5vdGlmaWNhdGlvbnMgYWJvdXQgNTgwIHMgaW50byBhIHNlc3Npb24gd2l0aCB0aGUgcmFkaW8gc3RpbGwgdXAsIGFuZCBpcm9oXG4gKiB0aGVuIG1vdmVkIHRoZSBzZXNzaW9uIHRvIHRoZSByZWxheSB1bmRlciBhIFwiVmlhIEJsdWV0b290aFwiIGxhYmVsLiBTbyB0aGlzXG4gKiByZWFkcyB0aGUgYnl0ZXMsIG5vdCB0aGUgcmFkaW8uXG4gKi9cbmV4cG9ydCBjb25zdCBTSUxFTlRfRFJPUF9NUyA9IDE1XzAwMFxuXG4vKiogV2hlbiBlYWNoIGhlbGQgQmx1ZXRvb3RoIHJvdXRlIGxhc3QgZHJvcHBlZCwgc28gXCJCbHVldG9vdGggaXMgYmFja1wiIGNhbiBiZSB0b2xkIGFwYXJ0IGZyb20gYmVmb3JlLiAqL1xuY29uc3QgZHJvcHBlZEF0ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKVxuXG4vKiogVHJ1ZSB3aGlsZSB0aGUgc2Vzc2lvbiB0byBgcHJpbnRlcklkYCByZWFsbHkgdHJhdmVscyBvdmVyIEJsdWV0b290aDogdGhlIG9uZSB0cnV0aCBmb3IgZXZlcnkgbGFiZWwuICovXG5leHBvcnQgZnVuY3Rpb24gYmx1ZXRvb3RoQ2FycnlpbmcgKHByaW50ZXJJZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlkID0gcHJpbnRlcklkLnRvTG93ZXJDYXNlKClcbiAgcmV0dXJuIHJvdXRlU3RhdGUuY2FycnlpbmdbaWRdID09PSB0cnVlICYmIHJhZGlvU3RhdGUuaGVhcmRbaWRdID09PSB0cnVlXG59XG5cbi8qKlxuICogV2hldGhlciB0aGUgcHJpbnRlciBpdHNlbGYgaGFzIHNwb2tlbiBvdmVyIHRoZSByYWRpbyBzaW5jZSB0aGUgbGluayBjYW1lIHVwXG4gKiAoS0FOLTI1MzEpLiBUaGUgaGFuZHNoYWtlIGNyb3NzZXMgdGhlIHJhZGlvIHdoYXRldmVyIHJvdXRlIHRoZSBzZXNzaW9uIGVuZHNcbiAqIHVwIG9uLCBhbmQgdGhlIHBhZ2Ugd3JpdGVzIHRvIGEgbGluayB3aGF0ZXZlciB0aGUgcHJpbnRlciBhbnN3ZXJzIG9uLCBzb1xuICogbmVpdGhlciBzYXlzIHRoZSBzZXNzaW9uIGlzIG9uIEJsdWV0b290aDogb25seSB0aGUgcHJpbnRlciBzZW5kaW5nIFFVSUNcbiAqIHBhY2tldHMgb3ZlciB0aGUgcmFkaW8gZG9lcy4gYGJsdWV0b290aENhcnJ5aW5nYCBuZWVkcyB0aGlzLCBzbyBcIlZpYVxuICogQmx1ZXRvb3RoXCIgaXMgbmV2ZXIgc2hvd24gYmVmb3JlIHRoZSByZWFsIHBhdGggaXMgQmx1ZXRvb3RoLlxuICovXG5jb25zdCByYWRpb1N0YXRlID0gVnVlLm9ic2VydmFibGUoeyBoZWFyZDoge30gYXMgUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gfSlcblxuLyoqIEhvdyBsb25nIGFmdGVyIHRoZSBsaW5rIGNvbWVzIHVwIHRoZSBwcmludGVyIG1heSBzdGF5IHNpbGVudCBvbiBpdCBiZWZvcmUgdGhlIHNlc3Npb24gaXMgY2FsbGVkIFwibm90IG9uIEJsdWV0b290aFwiLiAqL1xuZXhwb3J0IGNvbnN0IE5PVF9PTl9CTFVFVE9PVEhfTVMgPSAxMF8wMDBcblxuZXhwb3J0IGNvbnN0IE5PVF9PTl9CTFVFVE9PVEhfUkVBU09OID0gJ1RoZSBwcmludGVyIGFuc3dlcmVkIHRocm91Z2ggTXVvbjNELCBub3Qgb3ZlciBCbHVldG9vdGguIENvbm5lY3Qgb3ZlciBCbHVldG9vdGggYWdhaW4gdG8gcmV0cnkuJ1xuXG4vKipcbiAqIFdhdGNoZXMgYGxpbmtgIGZvciB0aGUgcHJpbnRlcidzIG93biBwYWNrZXRzIGFmdGVyIGl0IGNhbWUgdXAuIFNldHNcbiAqIGByYWRpb1N0YXRlLmhlYXJkYCBvbmNlIHRoZXkgYXJyaXZlIGFuZCBjbGVhcnMgaXQgd2hlbiB0aGV5IHN0b3A7IGlmIG5vbmVcbiAqIGFycml2ZSB3aXRoaW4ge0BsaW5rIE5PVF9PTl9CTFVFVE9PVEhfTVN9IHRoZSBzZXNzaW9uIGlzIG9uIGFub3RoZXIgcGF0aFxuICogKHRoZSByZWxheSBhbnN3ZXJlZCksIGFuZCB0aGF0IGlzIHNhaWQsIG5vdCBzd2l0Y2hlZCB0byBxdWlldGx5LlxuICovXG5mdW5jdGlvbiB3YXRjaFJhZGlvUGF0aCAoaWQ6IHN0cmluZywgbGluazogQmxlTGlua0hhbmRsZSkge1xuICBjb25zdCB1cEF0ID0gRGF0ZS5ub3coKVxuICBWdWUuc2V0KHJhZGlvU3RhdGUuaGVhcmQsIGlkLCBmYWxzZSlcbiAgY29uc3QgdGljayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBpZiAocm91dGVzLmdldChpZCk/LmxpbmsgIT09IGxpbmsgfHwgIWxpbmsuaXNPcGVuKCkpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGljaylcbiAgICAgIFZ1ZS5zZXQocmFkaW9TdGF0ZS5oZWFyZCwgaWQsIGZhbHNlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGhlYXJkQXQgPSBsaW5rLmxhc3RIZWFyZEF0Py4oKSA/PyBsaW5rLmxhc3RUcmFmZmljQXQoKVxuICAgIGNvbnN0IGhlYXJkID0gaGVhcmRBdCA+IHVwQXQgJiYgRGF0ZS5ub3coKSAtIGhlYXJkQXQgPCBDQVJSWUlOR19XSU5ET1dfTVNcbiAgICBpZiAocmFkaW9TdGF0ZS5oZWFyZFtpZF0gIT09IGhlYXJkKSBWdWUuc2V0KHJhZGlvU3RhdGUuaGVhcmQsIGlkLCBoZWFyZClcbiAgICBpZiAoaGVhcmQpIHtcbiAgICAgIGlmIChyb3V0ZVN0YXRlLmZlbGxCYWNrW2lkXSA9PT0gTk9UX09OX0JMVUVUT09USF9SRUFTT04pIFZ1ZS5kZWxldGUocm91dGVTdGF0ZS5mZWxsQmFjaywgaWQpXG4gICAgfSBlbHNlIGlmIChoZWFyZEF0IDw9IHVwQXQgJiYgRGF0ZS5ub3coKSAtIHVwQXQgPiBOT1RfT05fQkxVRVRPT1RIX01TICYmICFyb3V0ZVN0YXRlLmZlbGxCYWNrW2lkXSkge1xuICAgICAgVnVlLnNldChyb3V0ZVN0YXRlLmZlbGxCYWNrLCBpZCwgTk9UX09OX0JMVUVUT09USF9SRUFTT04pXG4gICAgfVxuICB9LCBDQVJSWUlOR19USUNLX01TKVxufVxuXG4vKiogVHJ1ZSB3aGlsZSB0aGlzIHBhZ2UgaXMgYnJpbmdpbmcgYSBCbHVldG9vdGggbGluayB0byBgcHJpbnRlcklkYCB1cDogdGhlIHdhaXQgYWZ0ZXIgQ29ubmVjdCBvdmVyIEJsdWV0b290aC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibHVldG9vdGhPcGVuaW5nIChwcmludGVySWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcm91dGVTdGF0ZS5vcGVuaW5nW3ByaW50ZXJJZC50b0xvd2VyQ2FzZSgpXSA9PT0gdHJ1ZVxufVxuXG4vKiogVHJ1ZSB3aGlsZSBhIEJsdWV0b290aCBsaW5rIHRvIGBwcmludGVySWRgIGlzIHVwLCBjYXJyeWluZyBvciBvbiBzdGFuZGJ5IGJlaGluZCB0aGUgcmVsYXkuICovXG5leHBvcnQgZnVuY3Rpb24gYmx1ZXRvb3RoTGlua1VwIChwcmludGVySWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcm91dGVTdGF0ZS51cFtwcmludGVySWQudG9Mb3dlckNhc2UoKV0gPT09IHRydWVcbn1cblxuLyoqXG4gKiBIb3cgdGhlIG9wZW4gcHJpbnRlciBpcyByZWFjaGVkIHdoZW4gaXQgY2FtZSB0aHJvdWdoIE11b24zRCdzIHNlc3Npb246IHRoZVxuICogb25lIGxhYmVsIGZvciBldmVyeSBwbGFjZSB0aGF0IG5hbWVzIHRoZSByb3V0ZSAodGl0bGUsIHJhaWwsIHJlY29ubmVjdFxuICogc2NyZWVuLCBtZW51cyksIGZyb20gdGhlIHNhbWUgdHJ1dGggYXMgdGhlIEJsdWV0b290aCBiYWRnZSAoS0FOLTE1NjYpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3RlUm91dGVMYWJlbCAocHJpbnRlcklkOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogJ1ZpYSBCbHVldG9vdGgnIHwgJ1Rocm91Z2ggTXVvbjNEJyB8ICdCbHVldG9vdGggZHJvcHBlZCcge1xuICBpZiAoIXByaW50ZXJJZCkgcmV0dXJuICdUaHJvdWdoIE11b24zRCdcbiAgLy8gUmFkaW8gdHJ1dGggKEtBTi0yNTMxKTogXCJWaWEgQmx1ZXRvb3RoXCIgb25seSB3aGlsZSB0aGUgcHJpbnRlciBpcyBoZWFyZCBvdmVyIHRoZSByYWRpby5cbiAgaWYgKGJsdWV0b290aENhcnJ5aW5nKHByaW50ZXJJZCkpIHJldHVybiAnVmlhIEJsdWV0b290aCdcbiAgcmV0dXJuIGJsdWV0b290aERyb3BwZWQocHJpbnRlcklkKSA/ICdCbHVldG9vdGggZHJvcHBlZCcgOiAnVGhyb3VnaCBNdW9uM0QnXG59XG5cbi8qKiBXaHkgdGhlIG9wZW4gd2VudCBvbiB0aHJvdWdoIE11b24zRCB0aG91Z2ggQmx1ZXRvb3RoIHdhcyBjaG9zZW4sIG9yIG51bGwuICovXG5leHBvcnQgZnVuY3Rpb24gYmx1ZXRvb3RoRmVsbEJhY2sgKHByaW50ZXJJZDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiByb3V0ZVN0YXRlLmZlbGxCYWNrW3ByaW50ZXJJZC50b0xvd2VyQ2FzZSgpXSA/PyBudWxsXG59XG5cbi8qKiBUaGUgQmx1ZXRvb3RoIGxpbmsgZmFpbGVkLCBhbmQgdGhlIG9wZW4gZ29lcyBvbiB0aHJvdWdoIE11b24zRDogc2F5IHNvIChLQU4tMTM5NikuICovXG5leHBvcnQgZnVuY3Rpb24gbm90ZUJsdWV0b290aEZlbGxCYWNrIChwcmludGVySWQ6IHN0cmluZywgcmVhc29uOiBzdHJpbmcpIHtcbiAgY29uc3QgaWQgPSBwcmludGVySWQudG9Mb3dlckNhc2UoKVxuICBpZiAoIXJvdXRlcy5oYXMoaWQpKSByZXR1cm5cbiAgVnVlLnNldChyb3V0ZVN0YXRlLmZlbGxCYWNrLCBpZCwgcmVhc29uKVxuICBWdWUuc2V0KHJvdXRlU3RhdGUudXAsIGlkLCBmYWxzZSlcbn1cblxuLyoqXG4gKiBXaHkgdGhlIGNob3NlbiBCbHVldG9vdGggcm91dGUgZHJvcHBlZCBkdXJpbmcgdGhlIHNlc3Npb24sIG9yIG51bGwuIFRoZVxuICogc2Vzc2lvbiBkb2VzIG5vdCBtb3ZlIHRvIGFub3RoZXIgcm91dGUgb24gaXRzIG93biAoS0FOLTE5MTMpOiB0aGUgcGVyc29uXG4gKiByZWNvbm5lY3RzIG9yIGNob29zZXMgYW5vdGhlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsdWV0b290aERyb3BwZWQgKHByaW50ZXJJZDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiByb3V0ZVN0YXRlLmRyb3BwZWRbcHJpbnRlcklkLnRvTG93ZXJDYXNlKCldID8/IG51bGxcbn1cblxuLyoqIE9ubHkgYSBkZWxpYmVyYXRlIHJldHJ5IGNsZWFycyB0aGUgaGVsZCByb3V0ZSdzIGRyb3AuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb25uZWN0Qmx1ZXRvb3RoIChwcmludGVySWQ6IHN0cmluZykge1xuICBWdWUuZGVsZXRlKHJvdXRlU3RhdGUuZHJvcHBlZCwgcHJpbnRlcklkLnRvTG93ZXJDYXNlKCkpXG59XG5cbi8qKiBUaGUgY2hvc2VuIEJsdWV0b290aCByb3V0ZSBkcm9wcGVkOiBzYXkgc28sIGFuZCBsZXQgdGhlIHBlcnNvbiBjaG9vc2UgKEtBTi0xOTEzKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3RlQmx1ZXRvb3RoRHJvcHBlZCAocHJpbnRlcklkOiBzdHJpbmcsIHJlYXNvbjogc3RyaW5nKSB7XG4gIGNvbnN0IGlkID0gcHJpbnRlcklkLnRvTG93ZXJDYXNlKClcbiAgaWYgKCFyb3V0ZXMuaGFzKGlkKSkgcmV0dXJuXG4gIGlmICghcm91dGVTdGF0ZS5kcm9wcGVkW2lkXSkgZHJvcHBlZEF0LnNldChpZCwgRGF0ZS5ub3coKSlcbiAgVnVlLnNldChyb3V0ZVN0YXRlLmRyb3BwZWQsIGlkLCByZWFzb24pXG59XG5cbi8qKlxuICogRm9yZ2V0cyB0aGF0IGBwcmludGVySWRgJ3MgQmx1ZXRvb3RoIHJvdXRlIGRyb3BwZWQgKHRoZSBwZXJzb24gd2VudCB0byBhbm90aGVyIHByaW50ZXIsIHNvIGl0cyBzaGVldFxuICogYW5kIGl0cyBhdXRvbWF0aWMgcmV0cmllcyBlbmQpLiBUaGUgY2hvaWNlIG9mIEJsdWV0b290aCBmb3IgaXQgc3RheXM7IG9ubHkgdGhlIGRyb3AgaXMgY2xlYXJlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQmx1ZXRvb3RoRHJvcHBlZCAocHJpbnRlcklkOiBzdHJpbmcpIHtcbiAgY29uc3QgaWQgPSBwcmludGVySWQudG9Mb3dlckNhc2UoKVxuICBWdWUuZGVsZXRlKHJvdXRlU3RhdGUuZHJvcHBlZCwgaWQpXG4gIGRyb3BwZWRBdC5kZWxldGUoaWQpXG59XG5cbi8qKiBXaGVuIHRoZSBoZWxkIEJsdWV0b290aCByb3V0ZSB0byBgcHJpbnRlcklkYCBsYXN0IGRyb3BwZWQgKG1zIHNpbmNlIHRoZSBlcG9jaCksIG9yIDAuICovXG5leHBvcnQgZnVuY3Rpb24gYmx1ZXRvb3RoRHJvcHBlZEF0IChwcmludGVySWQ6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBkcm9wcGVkQXQuZ2V0KHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpKSA/PyAwXG59XG5cbi8qKiBFdmVyeSBwcmludGVyIHdob3NlIGNob3NlbiBCbHVldG9vdGggcm91dGUgaGFzIGRyb3BwZWQ6IHRoZSBzaGVldCBvdXRsaXZlcyB0aGUgb3BlbiBwcmludGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRyb3BwZWRCbHVldG9vdGhQcmludGVycyAoKTogc3RyaW5nW10ge1xuICByZXR1cm4gT2JqZWN0LmtleXMocm91dGVTdGF0ZS5kcm9wcGVkKVxufVxuXG4vKiogVGhlIGRldmljZSB0aGUgcGVyc29uIGNob3NlIGZvciBgcHJpbnRlcklkYCwgb3IgbnVsbC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibHVldG9vdGhEZXZpY2VGb3IgKHByaW50ZXJJZDogc3RyaW5nKTogQmxlRGV2aWNlIHwgbnVsbCB7XG4gIHJldHVybiByb3V0ZXMuZ2V0KHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpKT8uZGV2aWNlID8/IG51bGxcbn1cblxuZnVuY3Rpb24gcm91dGVVbmF2YWlsYWJsZU9uIChlbmRwb2ludDogQmxlQ2FwYWJsZUVuZHBvaW50IHwgdW5kZWZpbmVkLCBpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGVuZHBvaW50Py5yb3V0ZVVuYXZhaWxhYmxlPy4oaWQpID09PSB0cnVlXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VCbHVldG9vdGhGb3IgKHByaW50ZXJJZDogc3RyaW5nLCBkZXZpY2U6IEJsZURldmljZSkge1xuICBjb25zdCBpZCA9IHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpXG4gIGNvbnN0IGV4aXN0aW5nID0gcm91dGVzLmdldChpZClcbiAgaWYgKGV4aXN0aW5nPy5kZXZpY2UgPT09IGRldmljZSkgcmV0dXJuXG4gIGV4aXN0aW5nPy5saW5rPy5kaXNjb25uZWN0KClcbiAgLy8gQSBuZXcgZGV2aWNlIGZvciB0aGUgc2FtZSBwcmludGVyIGtlZXBzIHRoZSBwZXJzb24ncyBjaG9pY2UsIGFuZCBpdHMgcGluLlxuICByb3V0ZXMuc2V0KGlkLCB7IGRldmljZSwgbGluazogbnVsbCwgcGlubmVkT246IGV4aXN0aW5nPy5waW5uZWRPbiB9KVxuICBmb3JnZXRSb3V0ZVN0YXRlKGlkKVxufVxuXG4vKiogVHJ1ZSBvbmNlIHRoZSBwZXJzb24gYXNrZWQgdG8gb3BlbiBgcHJpbnRlcklkYCBvdmVyIEJsdWV0b290aCBhbmQgaGFzIG5vdCBzdG9wcGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhbnRzQmx1ZXRvb3RoRm9yIChwcmludGVySWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcm91dGVzLmhhcyhwcmludGVySWQudG9Mb3dlckNhc2UoKSlcbn1cblxuLyoqXG4gKiBIYW5ncyB1cCB0aGUgbGl2ZSBsaW5rIHRvIGBwcmludGVySWRgIGFuZCBrZWVwcyB0aGUgcGVyc29uJ3MgQmx1ZXRvb3RoXG4gKiBjaG9pY2UsIHNvIHRoZSBuZXh0IG9wZW4gb3IgYSByZXRyeSBicmluZ3MgdGhlIGxpbmsgdXAgYWdhaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxlYXNlQmx1ZXRvb3RoTGluayAocHJpbnRlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgcm91dGUgPSByb3V0ZXMuZ2V0KHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpKVxuICBpZiAoIXJvdXRlPy5saW5rKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgY29uc3QgaGFuZ2luZ1VwID0gcm91dGUubGluay5kaXNjb25uZWN0KCkuY2F0Y2goKCkgPT4ge30pXG4gIHJvdXRlLmxpbmsgPSBudWxsXG4gIFZ1ZS5zZXQocm91dGVTdGF0ZS51cCwgcHJpbnRlcklkLnRvTG93ZXJDYXNlKCksIGZhbHNlKVxuICBWdWUuc2V0KHJvdXRlU3RhdGUuY2FycnlpbmcsIHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpLCBmYWxzZSlcbiAgcmV0dXJuIGhhbmdpbmdVcFxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcFVzaW5nQmx1ZXRvb3RoRm9yIChwcmludGVySWQ6IHN0cmluZykge1xuICBjb25zdCBpZCA9IHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpXG4gIGNvbnN0IHJvdXRlID0gcm91dGVzLmdldChpZClcbiAgcGluT24ocm91dGU/LnBpbm5lZE9uLCBpZCwgZmFsc2UpXG4gIHJvdXRlPy5saW5rPy5kaXNjb25uZWN0KClcbiAgcm91dGVzLmRlbGV0ZShpZClcbiAgZm9yZ2V0Um91dGVTdGF0ZShpZClcbn1cblxuLyoqXG4gKiBUaGUgbGl2ZSBsaW5rIHRvIGBwcmludGVySWRgLCBvcGVuZWQgb24gYGVuZHBvaW50YCBpZiB0aGUgcGVyc29uIGFza2VkIGZvclxuICogQmx1ZXRvb3RoIGFuZCBpdCBpcyBub3QgdXAgeWV0LiBgbnVsbGAgd2hlbiB0aGV5IGRpZCBub3QsIG9yIHRoZSBlbmRwb2ludFxuICogdGFrZXMgbm8gQmx1ZXRvb3RoIGxpbmtzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmx1ZXRvb3RoUm91dGVGb3IgKGVuZHBvaW50OiB1bmtub3duLCBwcmludGVySWQ6IHN0cmluZywgb3B0aW9ucz86IE9wZW5MaW5rT3B0aW9ucyk6IFByb21pc2U8QmxlTGlua0hhbmRsZSB8IG51bGw+IHtcbiAgY29uc3Qgcm91dGUgPSByb3V0ZXMuZ2V0KHByaW50ZXJJZC50b0xvd2VyQ2FzZSgpKVxuICBpZiAoIXJvdXRlIHx8ICF0YWtlc0JsZUxpbmtzKGVuZHBvaW50KSkgcmV0dXJuIG51bGxcbiAgY29uc3QgaWQgPSBwcmludGVySWQudG9Mb3dlckNhc2UoKVxuICAvLyBUaGUgcGVyc29uIGNob3NlIEJsdWV0b290aDoga2VlcCB0aGUgc2Vzc2lvbiBvbiB0aGUgcmFkaW8gd2hpbGUgaXQgaXMgdXAsXG4gIC8vIG5vdCBvbmx5IGFzIGEgZmFsbGJhY2sgYmVoaW5kIHRoZSByZWxheSAoRC0wODAsIEphY2sgNSBOb3YgMjAyNikuXG4gIGlmIChyb3V0ZS5waW5uZWRPbiAhPT0gZW5kcG9pbnQpIHtcbiAgICAvLyBBIGxpbmsgam9pbmVkIHRvIGFub3RoZXIgZW5kcG9pbnQgKHRoZSB0YWIgcmViaW5kcyBvbmUgZm9yIGFuIGV4cGxpY2l0XG4gICAgLy8gQmx1ZXRvb3RoIGNvbm5lY3QsIEtBTi0yNTMxKSBnb2VzIHdpdGggaXQ6IGhhbmcgaXQgdXAsIGFuZCBicmluZyBhIG5ld1xuICAgIC8vIG9uZSB1cCBvbiB0aGlzIGVuZHBvaW50LlxuICAgIGlmIChyb3V0ZS5waW5uZWRPbiAmJiByb3V0ZS5saW5rKSB7XG4gICAgICBjb25zdCBvbGQgPSByb3V0ZS5saW5rXG4gICAgICByb3V0ZS5saW5rID0gbnVsbFxuICAgICAgYXdhaXQgb2xkLmRpc2Nvbm5lY3QoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9XG4gICAgcGluT24ocm91dGUucGlubmVkT24sIGlkLCBmYWxzZSlcbiAgICBwaW5PbihlbmRwb2ludCwgaWQsIHRydWUpXG4gICAgcm91dGUucGlubmVkT24gPSBlbmRwb2ludFxuICB9XG4gIGlmIChyb3V0ZS5saW5rPy5pc09wZW4oKSkgcmV0dXJuIHJvdXRlLmxpbmtcbiAgVnVlLnNldChyb3V0ZVN0YXRlLm9wZW5pbmcsIGlkLCB0cnVlKVxuICBsZXQgbGluazogQmxlTGlua0hhbmRsZVxuICB0cnkge1xuICAgIGxpbmsgPSByb3V0ZS5saW5rID0gYXdhaXQgb3BlbkJsZUxpbmsoZW5kcG9pbnQsIHJvdXRlLmRldmljZSwgb3B0aW9ucylcbiAgfSBmaW5hbGx5IHtcbiAgICBWdWUuc2V0KHJvdXRlU3RhdGUub3BlbmluZywgaWQsIGZhbHNlKVxuICB9XG4gIGlmIChsaW5rLnByaW50ZXJJZCAhPT0gaWQpIHtcbiAgICBhd2FpdCBsaW5rLmRpc2Nvbm5lY3QoKVxuICAgIHJvdXRlLmxpbmsgPSBudWxsXG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJpbnRlciBuZWFyYnkgaXMgbm90IHRoZSBvbmUgYXNrZWQgZm9yLicpXG4gIH1cbiAgVnVlLnNldChyb3V0ZVN0YXRlLnVwLCBpZCwgdHJ1ZSlcbiAgVnVlLmRlbGV0ZShyb3V0ZVN0YXRlLmZlbGxCYWNrLCBpZClcbiAgVnVlLmRlbGV0ZShyb3V0ZVN0YXRlLmRyb3BwZWQsIGlkKVxuICBWdWUuc2V0KHJvdXRlU3RhdGUuY2FycnlpbmcsIGlkLCB0cnVlKVxuICBjb25zdCBvcGVuZWRBdCA9IERhdGUubm93KClcbiAgd2F0Y2hSYWRpb1BhdGgoaWQsIGxpbmspXG4gIGNvbnN0IHRpY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgaWYgKHJvdXRlcy5nZXQoaWQpPy5saW5rICE9PSBsaW5rKSByZXR1cm5cbiAgICBjb25zdCBoZWFyZCA9IGxpbmsubGFzdEhlYXJkQXQ/LigpID8/IGxpbmsubGFzdFRyYWZmaWNBdCgpXG4gICAgLy8gUXVpZXQgYWZ0ZXIgdGhlIHByaW50ZXIgc3Bva2Ugb3ZlciB0aGUgcmFkaW8gaXMgYSBkZWFkIHBhdGggYmVoaW5kIGEgbGl2ZSByYWRpby4gQSBwcmludGVyIHRoYXRcbiAgICAvLyBuZXZlciBzcG9rZSBvbiBpdCB3YXMgbmV2ZXIgb24gQmx1ZXRvb3RoOiB0aGF0IGlzIGBmZWxsQmFja2AgKHdhdGNoUmFkaW9QYXRoKSwgc2FpZCBvbmNlLCBub3QgYSBkcm9wLlxuICAgIGNvbnN0IHNpbGVudCA9IGxpbmsuaXNPcGVuKCkgJiYgaGVhcmQgPiBvcGVuZWRBdCAmJiBEYXRlLm5vdygpIC0gaGVhcmQgPiBTSUxFTlRfRFJPUF9NU1xuICAgIGNvbnN0IGNhcnJ5aW5nID0gbGluay5pc09wZW4oKSAmJiAhc2lsZW50XG4gICAgaWYgKHJvdXRlU3RhdGUuY2FycnlpbmdbaWRdICE9PSBjYXJyeWluZykgVnVlLnNldChyb3V0ZVN0YXRlLmNhcnJ5aW5nLCBpZCwgY2FycnlpbmcpXG4gICAgaWYgKHJvdXRlU3RhdGUuZHJvcHBlZFtpZF0pIHJldHVyblxuICAgIGlmIChyb3V0ZVVuYXZhaWxhYmxlT24ocm91dGVzLmdldChpZCk/LnBpbm5lZE9uLCBpZCkpIHtcbiAgICAgIG5vdGVCbHVldG9vdGhEcm9wcGVkKGlkLCAnQmx1ZXRvb3RoIGhhcyBubyBwYXRoIHRvIHRoZSBwcmludGVyLicpXG4gICAgfSBlbHNlIGlmIChzaWxlbnQpIHtcbiAgICAgIC8vIEEgZGVhZCBwYXRoIGJlaGluZCBhIGxpdmUgcmFkaW86IHNheSBzbywgYW5kIGhhbmcgdXAsIHNvIHRoZSBzZXNzaW9uXG4gICAgICAvLyBlbmRzIGhlcmUgaW5zdGVhZCBvZiBnb2luZyBvbiBxdWlldGx5IHRocm91Z2ggdGhlIHJlbGF5LlxuICAgICAgbm90ZUJsdWV0b290aERyb3BwZWQoaWQsIGBOb3RoaW5nIGNhbWUgb3ZlciBCbHVldG9vdGggZm9yICR7U0lMRU5UX0RST1BfTVMgLyAxMDAwfSBzZWNvbmRzLmApXG4gICAgICBsaW5rLmRpc2Nvbm5lY3QoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9XG4gIH0sIENBUlJZSU5HX1RJQ0tfTVMpXG4gIC8vIFRoZSBwcmludGVyIG9yIHRoZSByYWRpbyBlbmRpbmcgdGhlIGxpbmsgZW5kcyB0aGUgY2xhaW0sIHdob2V2ZXIgaHVuZyB1cC5cbiAgbGluay5jbG9zZWQudGhlbigoKSA9PiB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aWNrKVxuICAgIGNvbnN0IHJvdXRlID0gcm91dGVzLmdldChpZClcbiAgICBpZiAocm91dGU/LmxpbmsgPT09IGxpbmspIHtcbiAgICAgIFZ1ZS5zZXQocm91dGVTdGF0ZS51cCwgaWQsIGZhbHNlKVxuICAgICAgVnVlLnNldChyb3V0ZVN0YXRlLmNhcnJ5aW5nLCBpZCwgZmFsc2UpXG4gICAgICAvLyBBIGxpbmsgY2xvc2VkIGJlY2F1c2UgdGhlIHRhYiByZXBsYWNlZCBpdHMgZW5kcG9pbnQgKGFuIGV4cGxpY2l0IEJsdWV0b290aFxuICAgICAgLy8gY29ubmVjdCBmb3IgYW5vdGhlciBwcmludGVyLCBLQU4tMjUzMSkgd2FzIG5vdCBkcm9wcGVkIGJ5IHRoZSByYWRpbyBvciB0aGVcbiAgICAgIC8vIHByaW50ZXI6IGl0IGlzIHNpbXBseSBnb25lLCBhbmQgdGhlIG5leHQgb3BlbiBicmluZ3MgYSBuZXcgb25lIHVwLlxuICAgICAgaWYgKHJlcGxhY2VkTGlua3MuaGFzKGxpbmspKSB7XG4gICAgICAgIHJvdXRlLmxpbmsgPSBudWxsXG4gICAgICB9IGVsc2UgaWYgKCFyb3V0ZVN0YXRlLmRyb3BwZWRbaWRdKSB7XG4gICAgICAgIG5vdGVCbHVldG9vdGhEcm9wcGVkKGlkLCAnVGhlIEJsdWV0b290aCBsaW5rIGRyb3BwZWQuJylcbiAgICAgIH1cbiAgICB9XG4gIH0pXG4gIHJldHVybiBsaW5rXG59XG4iXSwibWFwcGluZ3MiOiJBQWlCQSxPQUFPLFNBQVM7QUFDaEIsU0FBUywyQkFBMkI7QUFDcEM7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUlLO0FBR0EsYUFBTSxvQkFBb0I7QUFPMUIsZ0JBQVMsY0FBZSxhQUF5QztBQUN0RSxNQUFJLENBQUMsWUFBYSxRQUFPO0FBQ3pCLFNBQU8sS0FBSyxJQUFJLGFBQWEsaUJBQWlCO0FBQ2hEO0FBa0NBLFNBQVMsTUFBTyxVQUEwQyxJQUFZLFFBQWlCO0FBQ3JGLE1BQUk7QUFDRixRQUFJLFVBQVUsWUFBYSxVQUFTLFlBQVksSUFBSSxTQUFTLFFBQVEsTUFBTTtBQUFBLFFBQ3RFLFdBQVUsZUFBZSxJQUFJLE1BQU07QUFBQSxFQUMxQyxRQUFRO0FBQUEsRUFBb0U7QUFDOUU7QUFFTyxnQkFBUyxjQUFlLFVBQW1EO0FBQ2hGLFNBQU8sT0FBUSxVQUEyQyxZQUFZO0FBQ3hFO0FBd0JBLE1BQU0scUJBQXFCO0FBRTNCLE1BQU0sbUJBQW1CO0FBQ3pCLE1BQU0saUJBQWlCO0FBRXZCLE1BQU0sV0FBVztBQUVqQixNQUFNLHFCQUFxQjtBQVdwQixhQUFNLGdCQUFnQixDQUFDLEtBQUssTUFBTSxHQUFJO0FBR3RDLGdCQUFTLGFBQWMsT0FBZ0IsTUFBd0M7QUFDcEYsTUFBSSxpQkFBaUIsWUFBYSxRQUFPO0FBQ3pDLE1BQUksS0FBSyxjQUFjLE1BQU8sUUFBTztBQUNyQyxRQUFNLElBQUk7QUFDVixTQUFPLEdBQUcsU0FBUyxrQkFBa0IsOEJBQThCLEtBQUssR0FBRyxXQUFXLEVBQUU7QUFDMUY7QUFFQSxNQUFNLG9CQUFvQixN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