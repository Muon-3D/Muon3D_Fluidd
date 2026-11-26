import { connectWithApproval } from "/src/services/muon-cloud/approval.ts";
import { bluetoothCarrying, bluetoothDropped, bluetoothRouteFor, noteBluetoothDropped, wantsBluetoothFor } from "/src/services/muon-ble/link.ts";
import { assertBluetoothUploadSize, bluetoothLargeFileMessage, bluetoothUploadFileSize, isLongBluetoothUpload, watchBluetoothUpload } from "/src/services/muon-ble/upload.ts";
import { EventBus } from "/src/eventBus.ts";
import { pinnedBluetoothError } from "/src/services/muon-ble/refusal.ts";
import { CloudError, INSECURE_ORIGIN_MESSAGE, cloudBaseUrl, cloudSessionAllowed, cloudTokensPersist } from "/src/services/muon-cloud/api.ts";
import { endpointBusy, notifyEndpointRebound, notifyEndpointReplacing } from "/src/services/muon-cloud/endpoint-hooks.ts";
import bundledWasmUrl from "/src/services/muon-cloud/vendor/muon-link-web/8d40fca/muon_link_web_bg.wasm?import&url";
const KEY_STORAGE = "muon.cloud.key";
const ALLOW_CONSOLE_CLIENT_FALLBACK = true;
try {
  if (!cloudTokensPersist()) {
    localStorage.removeItem(KEY_STORAGE);
    window.addEventListener("storage", (event) => {
      if (event.key !== KEY_STORAGE || event.newValue === null) return;
      try {
        localStorage.removeItem(KEY_STORAGE);
      } catch {
      }
    });
  }
} catch {
}
let modulePromise = null;
let endpointPromise = null;
let endpointRelay = "";
function loadWasm() {
  if (!modulePromise) {
    modulePromise = (async () => {
      try {
        const mod = await import("/src/services/muon-cloud/vendor/muon-link-web/8d40fca/muon_link_web.js");
        await mod.default({ module_or_path: bundledWasmUrl });
        return mod;
      } catch (error) {
        if (!ALLOW_CONSOLE_CLIENT_FALLBACK) throw error;
        const mod = await import(
          /* @vite-ignore */
          `${cloudBaseUrl()}/muon-link-web/muon_link_web.js`
        );
        await mod.default();
        return mod;
      }
    })();
    modulePromise.catch(() => {
      modulePromise = null;
    });
  }
  return modulePromise;
}
function hexToBytes(hex) {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
let memoryKey = null;
const dialed = /* @__PURE__ */ new Set();
export const REBIND_BUSY_MESSAGE = "Finish or cancel adding a device or setting up a printer first, then connect over Bluetooth again.";
function logLate(what, error) {
  console.warn(`muon-link: ${what}: ${error?.message ?? error}`);
}
async function createEndpoint(relayUrl) {
  const mod = await loadWasm();
  let secret = null;
  const persist = cloudTokensPersist();
  try {
    secret = persist ? hexToBytes(localStorage.getItem(KEY_STORAGE) ?? "") : memoryKey;
  } catch {
  }
  const endpoint = await mod.MuonEndpoint.create(relayUrl, secret);
  if (persist) {
    try {
      localStorage.setItem(KEY_STORAGE, bytesToHex(endpoint.secretKey()));
    } catch {
    }
  } else {
    memoryKey = endpoint.secretKey();
  }
  return endpoint;
}
export function browserEndpoint(relayUrl) {
  if (!cloudSessionAllowed()) return Promise.reject(new CloudError(INSECURE_ORIGIN_MESSAGE, 0, "insecure_origin"));
  if (!endpointPromise || endpointRelay !== relayUrl) {
    endpointRelay = relayUrl;
    dialed.clear();
    endpointPromise = createEndpoint(relayUrl);
    endpointPromise.catch(() => {
      endpointPromise = null;
    });
  }
  return endpointPromise;
}
export function freshBrowserEndpoint(relayUrl) {
  if (!cloudSessionAllowed()) return Promise.reject(new CloudError(INSECURE_ORIGIN_MESSAGE, 0, "insecure_origin"));
  const old = endpointPromise;
  endpointRelay = relayUrl;
  dialed.clear();
  notifyEndpointReplacing();
  const fresh = (async () => {
    if (old) {
      let previous = null;
      try {
        previous = await old;
      } catch {
      }
      if (previous) {
        try {
          await previous.close();
        } catch (error) {
          logLate("closing the old endpoint failed, so it is abandoned", error);
        }
        try {
          previous.free?.();
        } catch (error) {
          logLate("freeing the old endpoint failed", error);
        }
      }
    }
    return createEndpoint(relayUrl);
  })();
  endpointPromise = fresh;
  fresh.catch(() => {
    if (endpointPromise === fresh) endpointPromise = null;
  });
  return fresh;
}
export async function endpointForDial(relayUrl, printerId) {
  const id = printerId.toLowerCase();
  if (wantsBluetoothFor(id) && dialed.has(id)) {
    if (endpointBusy()) throw new Error(REBIND_BUSY_MESSAGE);
    const fresh = await freshBrowserEndpoint(relayUrl);
    dialed.add(id);
    notifyEndpointRebound(id);
    return fresh;
  }
  const endpoint = await browserEndpoint(relayUrl);
  dialed.add(id);
  return endpoint;
}
export function forgetBrowserKey() {
  memoryKey = null;
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
  }
  endpointPromise?.then((e) => e.close()).catch(() => {
  });
  endpointPromise = null;
}
class IrohSocket {
  readyState = 1;
  listeners = /* @__PURE__ */ new Map();
  inner;
  constructor(inner) {
    this.inner = inner;
    this.pump();
  }
  send(data) {
    if (this.readyState !== 1) return;
    this.inner.send(data).catch((error) => this.fail(error));
  }
  close() {
    if (this.readyState >= 2) return;
    this.readyState = 2;
    this.inner.close().catch(() => {
    }).finally(() => this.closed(1e3, ""));
  }
  addEventListener(type, listener) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }
  emit(type, event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
  async pump() {
    await Promise.resolve();
    for (; ; ) {
      let message;
      try {
        message = await this.inner.next();
      } catch (error) {
        this.fail(error);
        return;
      }
      if (message === null) {
        this.closed(1e3, "");
        return;
      }
      const data = typeof message === "string" ? message : new TextDecoder().decode(message);
      this.emit("message", { data });
    }
  }
  fail(error) {
    if (this.readyState === 3) return;
    this.emit("error", { error });
    this.closed(1006, String(error?.message ?? error));
  }
  closed(code, reason) {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.emit("close", { code, reason, wasClean: code === 1e3 });
  }
}
const FRAMING_HEADERS = /* @__PURE__ */ new Set([
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "te",
  "trailer",
  "upgrade"
]);
function abortError(signal) {
  return signal.reason ?? new DOMException("The request was aborted", "AbortError");
}
function untilAborted(sending, signal) {
  if (!signal) return sending;
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError(signal));
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    sending.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}
function closeMultipart(body, type) {
  const boundary = /boundary=("?)([^";]+)\1/i.exec(type)?.[2];
  if (!boundary) return body;
  const close = new TextEncoder().encode(`--${boundary}--`);
  if (body.length < close.length) return body;
  const tail = body.subarray(body.length - close.length);
  if (!tail.every((b, n) => b === close[n])) return body;
  const closed = new Uint8Array(body.length + 2);
  closed.set(body);
  closed.set([13, 10], body.length);
  return closed;
}
export class IrohPrinter {
  printer;
  ended = false;
  get closed() {
    return this.ended;
  }
  constructor(printer) {
    this.printer = printer;
  }
  assertRoute() {
    const dropped = bluetoothDropped(this.printer.printerId());
    if (dropped) throw new Error(`Bluetooth dropped: ${dropped} Reconnect, or choose how to connect.`);
  }
  async fetch(path, init, progress) {
    this.assertRoute();
    const signal = init?.signal;
    if (signal?.aborted) throw abortError(signal);
    const method = (init?.method ?? "GET").toUpperCase();
    const upload = method === "POST" && path.split("?")[0] === "/server/files/upload";
    if (upload && bluetoothCarrying(this.printer.printerId())) assertBluetoothUploadSize(init?.body);
    const headers = [];
    const source = new Headers(init?.headers ?? {});
    source.forEach((value, name) => {
      if (name === "host" || name === "authorization" || FRAMING_HEADERS.has(name)) return;
      headers.push(name, value);
    });
    let body = new Uint8Array();
    if (init?.body !== void 0 && init.body !== null) {
      const encoded = new Response(init.body);
      body = new Uint8Array(await encoded.arrayBuffer());
      if (init.body instanceof FormData) {
        const type = encoded.headers.get("content-type");
        if (type) {
          const i = headers.findIndex((h, n) => n % 2 === 0 && h.toLowerCase() === "content-type");
          if (i >= 0) headers.splice(i, 2);
          headers.push("content-type", type);
          body = closeMultipart(body, type);
        }
      } else if (typeof init.body === "string" && !source.has("content-type")) {
        headers.push("content-type", "application/json");
      }
    }
    if (signal?.aborted) throw abortError(signal);
    const overBluetooth = upload && bluetoothCarrying(this.printer.printerId());
    if (overBluetooth) assertBluetoothUploadSize(init?.body, body.length);
    if (overBluetooth) {
      const size = bluetoothUploadFileSize(init?.body, body.length);
      if (isLongBluetoothUpload(size)) EventBus.$emit(bluetoothLargeFileMessage(size), { type: "warning", timeout: 12e3 });
    }
    const send = (report) => this.printer.fetchWithProgress ? this.printer.fetchWithProgress(method, path, headers, body, report) : this.printer.fetch(method, path, headers, body);
    const work = overBluetooth ? watchBluetoothUpload(send, progress, () => {
      this.ended = true;
      this.printer.close();
    }, signal) : send(progress);
    const answer = await untilAborted(work, signal);
    const responseHeaders = new Headers();
    for (let i = 0; i + 1 < answer.headers.length; i += 2) {
      try {
        responseHeaders.append(answer.headers[i], answer.headers[i + 1]);
      } catch {
      }
    }
    const nullBody = answer.status === 204 || answer.status === 304;
    return new Response(nullBody ? null : answer.body, { status: answer.status, headers: responseHeaders });
  }
  async openWebSocket(path) {
    this.assertRoute();
    return new IrohSocket(await this.printer.openWebSocket(path));
  }
  close() {
    this.printer.close();
  }
}
export async function dialPrinter(endpoint, printerId) {
  const dropped = bluetoothDropped(printerId);
  if (dropped) throw new Error(`Bluetooth dropped: ${dropped} Reconnect, or choose how to connect.`);
  let link;
  try {
    link = await bluetoothRouteFor(endpoint, printerId);
    if (wantsBluetoothFor(printerId) && !link) throw new Error("Bluetooth is unavailable on this endpoint.");
  } catch (error) {
    const message = error.message;
    noteBluetoothDropped(printerId, message);
    throw new Error(`Couldn't reach the printer over Bluetooth: ${message}`);
  }
  const route = wantsBluetoothFor(printerId) ? "bluetooth" : void 0;
  const printer = await connectWithApproval(endpoint, printerId, "Muon3D Control", route) ?? await (route ? endpoint.connect(printerId, route) : endpoint.connect(printerId));
  if (link) {
    if (!link.isOpen()) {
      printer.close?.();
      throw new Error("Bluetooth dropped while connecting. Reconnect, or choose how to connect.");
    }
    let closedOnce = false;
    const closeOnce = () => {
      if (closedOnce) return;
      closedOnce = true;
      try {
        printer.close?.();
      } catch {
      }
    };
    link.closed.then(closeOnce, closeOnce);
  }
  return printer;
}
export function managedEndpointFactory() {
  return Promise.resolve({
    async openRelay(session) {
      const endpoint = await endpointForDial(session.relayUrl, session.printerId);
      try {
        return new IrohPrinter(await dialPrinter(endpoint, session.printerId));
      } catch (error) {
        throw pinnedBluetoothError(error);
      }
    },
    close() {
    }
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlyb2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGUgYnJvd3NlcidzIElyb2ggZW5kcG9pbnQsIGFuZCB0aGUgdHJhbnNwb3J0IEZsdWlkZCdzIG1hbmFnZWQgc2VhbSB1c2VzLlxuICpcbiAqIE9uZSBlbmRwb2ludCBwZXIgdGFiLCBvbmUga2V5IHBlciBicm93c2VyOiB0aGUga2V5IGlzIGtlcHQgaW4gbG9jYWxTdG9yYWdlXG4gKiBzbyB0aGUgZ3JhbnRzIHRoZSBjb25zb2xlIGlzc3VlcyBmb3IgaXQgc3Vydml2ZSBhIHJlbG9hZC4gRXZlcnkgcHJpbnRlciBpc1xuICogcmVhY2hlZCB0aHJvdWdoIHRoZSByZWxheSB0aGUgY29uc29sZSBuYW1lczsgYSBicm93c2VyIGhhcyBubyBvdGhlciBwYXRoLlxuICovXG5pbXBvcnQgeyBjb25uZWN0V2l0aEFwcHJvdmFsLCB0eXBlIEFwcHJvdmluZ0VuZHBvaW50IH0gZnJvbSAnLi9hcHByb3ZhbCdcbmltcG9ydCB0eXBlIHsgVXBsb2FkUHJvZ3Jlc3MgfSBmcm9tICdAL3NlcnZpY2VzL21hbmFnZWQtdHJhbnNwb3J0L3R5cGVzJ1xuaW1wb3J0IHR5cGUge1xuICBBdXRob3JpemVkTWFuYWdlZFJlbGF5U2Vzc2lvbixcbiAgTWFuYWdlZElyb2hFbmRwb2ludCxcbiAgTWFuYWdlZElyb2hSZWxheSxcbiAgUHJpbnRlclNvY2tldFxufSBmcm9tICdAL3NlcnZpY2VzL21hbmFnZWQtdHJhbnNwb3J0J1xuaW1wb3J0IHsgYmx1ZXRvb3RoQ2FycnlpbmcsIGJsdWV0b290aERyb3BwZWQsIGJsdWV0b290aFJvdXRlRm9yLCBub3RlQmx1ZXRvb3RoRHJvcHBlZCwgd2FudHNCbHVldG9vdGhGb3IsIHR5cGUgV2FzbUJsZUxpbmsgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2xpbmsnXG5pbXBvcnQgeyBhc3NlcnRCbHVldG9vdGhVcGxvYWRTaXplLCBibHVldG9vdGhMYXJnZUZpbGVNZXNzYWdlLCBibHVldG9vdGhVcGxvYWRGaWxlU2l6ZSwgaXNMb25nQmx1ZXRvb3RoVXBsb2FkLCB3YXRjaEJsdWV0b290aFVwbG9hZCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvdXBsb2FkJ1xuaW1wb3J0IHsgRXZlbnRCdXMgfSBmcm9tICdAL2V2ZW50QnVzJ1xuaW1wb3J0IHsgcGlubmVkQmx1ZXRvb3RoRXJyb3IgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3JlZnVzYWwnXG5pbXBvcnQgeyBDbG91ZEVycm9yLCBJTlNFQ1VSRV9PUklHSU5fTUVTU0FHRSwgY2xvdWRCYXNlVXJsLCBjbG91ZFNlc3Npb25BbGxvd2VkLCBjbG91ZFRva2Vuc1BlcnNpc3QgfSBmcm9tICcuL2FwaSdcbmltcG9ydCB7IGVuZHBvaW50QnVzeSwgbm90aWZ5RW5kcG9pbnRSZWJvdW5kLCBub3RpZnlFbmRwb2ludFJlcGxhY2luZyB9IGZyb20gJy4vZW5kcG9pbnQtaG9va3MnXG5pbXBvcnQgYnVuZGxlZFdhc21VcmwgZnJvbSAnLi92ZW5kb3IvbXVvbi1saW5rLXdlYi84ZDQwZmNhL211b25fbGlua193ZWJfYmcud2FzbT91cmwnXG5cbmNvbnN0IEtFWV9TVE9SQUdFID0gJ211b24uY2xvdWQua2V5J1xuLy8gUmVtb3ZlIGFmdGVyIG9uZSByZWxlYXNlLiBOb3JtYWwgbG9hZHMgbmV2ZXIgZGVwZW5kIG9uIHRoZSBjb25zb2xlJ3MgZmlsZXMuXG5jb25zdCBBTExPV19DT05TT0xFX0NMSUVOVF9GQUxMQkFDSyA9IHRydWVcblxuLy8gS0FOLTIxOTIgKEgyL0I5KTogdGhlIGtleSBpcyB0aGlzIGJyb3dzZXIncyBpZGVudGl0eSB0byBldmVyeSBwcmludGVyIHRoZVxuLy8gYWNjb3VudCByZWFjaGVzLiBPbiBhIHBsYWluLUhUVFAgcGFnZSBhbnl0aGluZyBvbiB0aGUgbmV0d29yayBjYW4gcmVhZFxuLy8gbG9jYWxTdG9yYWdlLCBzbyB0aGUgcGFnZSBuZXZlciBtYWtlcywgcmVhZHMgb3Iga2VlcHMgb25lLCBhbmQgcmVtb3ZlcyBhIGtleVxuLy8gYW4gb2xkZXIgYnVpbGQgbGVmdC4gV2ViQ3J5cHRvLCB3aGljaCBjb3VsZCBob2xkIGl0IHVucmVhZGFibGUgKEtBTi0xODcyKSxcbi8vIGRvZXMgbm90IGV4aXN0IG9uIHN1Y2ggYSBwYWdlLlxudHJ5IHtcbiAgLy8gQSBwcmludGVyJ3Mgc2VjdXJlIGFkZHJlc3MgKEtBTi0yMTk4KSBrZWVwcyB0aGUga2V5IGluIG1lbW9yeSBvbmx5LlxuICBpZiAoIWNsb3VkVG9rZW5zUGVyc2lzdCgpKSB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oS0VZX1NUT1JBR0UpXG4gICAgLy8gQSB0YWIgc3RpbGwgcnVubmluZyBhbiBvbGRlciBidWlsZCBjYW4gd3JpdGUgdGhlIGtleSBiYWNrLiBSZW1vdmUgaXRcbiAgICAvLyB3aGVuZXZlciBpdCBhcHBlYXJzLlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ICE9PSBLRVlfU1RPUkFHRSB8fCBldmVudC5uZXdWYWx1ZSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICB0cnkge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShLRVlfU1RPUkFHRSlcbiAgICAgIH0gY2F0Y2ggeyAvKiBubyBzdG9yYWdlICovIH1cbiAgICB9KVxuICB9XG59IGNhdGNoIHtcbiAgLy8gTm8gc3RvcmFnZSBvciBubyB3aW5kb3c6IG5vdGhpbmcgdG8gY2xlYXIuXG59XG5cbmludGVyZmFjZSBXYXNtU29ja2V0IHtcbiAgc2VuZCAodGV4dDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbiAgbmV4dCAoKTogUHJvbWlzZTxzdHJpbmcgfCBVaW50OEFycmF5IHwgbnVsbD47XG4gIGNsb3NlICgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5pbnRlcmZhY2UgV2FzbVByaW50ZXIge1xuICBwcmludGVySWQgKCk6IHN0cmluZztcbiAgLyoqIFNFQy03J3MgY29tcGFyaXNvbiB2YWx1ZSBvZiB0aGlzIGNvbm5lY3Rpb24sIFwiRjZRIFRESFwiIChtdW9uLWxpbmsjMzMgb24pLiAqL1xuICBjb21wYXJpc29uPyAoKTogc3RyaW5nO1xuICBmZXRjaCAobWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgaGVhZGVyczogc3RyaW5nW10sIGJvZHk6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHsgc3RhdHVzOiBudW1iZXIsIGhlYWRlcnM6IHN0cmluZ1tdLCBib2R5OiBVaW50OEFycmF5IH0+O1xuICBmZXRjaFdpdGhQcm9ncmVzcz8gKG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGhlYWRlcnM6IHN0cmluZ1tdLCBib2R5OiBVaW50OEFycmF5LCBwcm9ncmVzcz86IFVwbG9hZFByb2dyZXNzKTogUHJvbWlzZTx7IHN0YXR1czogbnVtYmVyLCBoZWFkZXJzOiBzdHJpbmdbXSwgYm9keTogVWludDhBcnJheSB9PjtcbiAgb3BlbldlYlNvY2tldCAocGF0aDogc3RyaW5nKTogUHJvbWlzZTxXYXNtU29ja2V0PjtcbiAgY2xvc2UgKCk6IHZvaWQ7XG59XG5cbmludGVyZmFjZSBXYXNtRW5kcG9pbnQge1xuICBlbmRwb2ludElkICgpOiBzdHJpbmc7XG4gIHNlY3JldEtleSAoKTogVWludDhBcnJheTtcbiAgY29ubmVjdCAocHJpbnRlcklkOiBzdHJpbmcsIHJvdXRlPzogJ2F1dG8nIHwgJ2JsdWV0b290aCcgfCAnbGFuJyB8ICdjbG91ZCcpOiBQcm9taXNlPFdhc21QcmludGVyPjtcbiAgLyoqIG11b24tbGluayMxMjY6IHdhaXRzIGZvciBhcHByb3ZhbCBhdCB0aGUgcHJpbnRlci4gQWJzZW50IGluIG9sZGVyIHBhY2thZ2VzLiAqL1xuICBjb25uZWN0QXM/OiBBcHByb3ZpbmdFbmRwb2ludDxXYXNtUHJpbnRlcj5bJ2Nvbm5lY3RBcyddO1xuICAvKiogVGFrZXMgYSBXZWIgQmx1ZXRvb3RoIGxpbmsgdG8gYSBwcmludGVyIChtdW9uLWxpbmsjMzEgb247IEFEUiAwMDMyIEQzKS4gKi9cbiAgYWRkTGluaz8gKHJvbGU6ICdjZW50cmFsJywgbWF4U2VnbWVudD86IG51bWJlcik6IFdhc21CbGVMaW5rO1xuICAvKiogS2VlcHMgYSBwcmludGVyJ3MgY29ubmVjdGlvbiBvbiBCbHVldG9vdGggd2hpbGUgYSBsaW5rIGlzIHVwIChELTA4MCwgbXVvbi1saW5rIzEyOCBvbikuICovXG4gIHBpbkJsdWV0b290aD8gKHByaW50ZXJJZDogc3RyaW5nLCBwaW5uZWQ6IGJvb2xlYW4pOiB2b2lkO1xuICBjbG9zZSAoKTogUHJvbWlzZTx2b2lkPjtcbiAgLyoqIEZyZWVzIHRoZSBiaW5kaW5nJ3MgaGFuZGxlICh3YXNtLWJpbmRnZW4pLiAqL1xuICBmcmVlPyAoKTogdm9pZDtcbn1cblxuaW50ZXJmYWNlIFdhc21Nb2R1bGUge1xuICBkZWZhdWx0OiAoaW5wdXQ/OiB1bmtub3duKSA9PiBQcm9taXNlPHVua25vd24+O1xuICBNdW9uRW5kcG9pbnQ6IHsgY3JlYXRlIChyZWxheVVybDogc3RyaW5nLCBzZWNyZXQ6IFVpbnQ4QXJyYXkgfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbWlzZTxXYXNtRW5kcG9pbnQ+IH07XG59XG5cbmxldCBtb2R1bGVQcm9taXNlOiBQcm9taXNlPFdhc21Nb2R1bGU+IHwgbnVsbCA9IG51bGxcbmxldCBlbmRwb2ludFByb21pc2U6IFByb21pc2U8V2FzbUVuZHBvaW50PiB8IG51bGwgPSBudWxsXG5sZXQgZW5kcG9pbnRSZWxheSA9ICcnXG5cbmZ1bmN0aW9uIGxvYWRXYXNtICgpOiBQcm9taXNlPFdhc21Nb2R1bGU+IHtcbiAgaWYgKCFtb2R1bGVQcm9taXNlKSB7XG4gICAgbW9kdWxlUHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtb2QgPSBhd2FpdCBpbXBvcnQoJy4vdmVuZG9yL211b24tbGluay13ZWIvOGQ0MGZjYS9tdW9uX2xpbmtfd2ViLmpzJykgYXMgV2FzbU1vZHVsZVxuICAgICAgICBhd2FpdCBtb2QuZGVmYXVsdCh7IG1vZHVsZV9vcl9wYXRoOiBidW5kbGVkV2FzbVVybCB9KVxuICAgICAgICByZXR1cm4gbW9kXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoIUFMTE9XX0NPTlNPTEVfQ0xJRU5UX0ZBTExCQUNLKSB0aHJvdyBlcnJvclxuICAgICAgICBjb25zdCBtb2QgPSBhd2FpdCBpbXBvcnQoLyogQHZpdGUtaWdub3JlICovIGAke2Nsb3VkQmFzZVVybCgpfS9tdW9uLWxpbmstd2ViL211b25fbGlua193ZWIuanNgKSBhcyBXYXNtTW9kdWxlXG4gICAgICAgIGF3YWl0IG1vZC5kZWZhdWx0KClcbiAgICAgICAgcmV0dXJuIG1vZFxuICAgICAgfVxuICAgIH0pKClcbiAgICBtb2R1bGVQcm9taXNlLmNhdGNoKCgpID0+IHsgbW9kdWxlUHJvbWlzZSA9IG51bGwgfSlcbiAgfVxuICByZXR1cm4gbW9kdWxlUHJvbWlzZVxufVxuXG5mdW5jdGlvbiBoZXhUb0J5dGVzIChoZXg6IHN0cmluZyk6IFVpbnQ4QXJyYXkgfCBudWxsIHtcbiAgaWYgKCEvXlswLTlhLWZdezY0fSQvaS50ZXN0KGhleCkpIHJldHVybiBudWxsXG4gIGNvbnN0IG91dCA9IG5ldyBVaW50OEFycmF5KDMyKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyBpKyspIG91dFtpXSA9IHBhcnNlSW50KGhleC5zbGljZShpICogMiwgaSAqIDIgKyAyKSwgMTYpXG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gYnl0ZXNUb0hleCAoYnl0ZXM6IFVpbnQ4QXJyYXkpOiBzdHJpbmcge1xuICByZXR1cm4gQXJyYXkuZnJvbShieXRlcywgYiA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpKS5qb2luKCcnKVxufVxuXG5sZXQgbWVtb3J5S2V5OiBVaW50OEFycmF5IHwgbnVsbCA9IG51bGxcblxuLyoqXG4gKiBUaGUgcHJpbnRlcnMgdGhpcyB0YWIncyBjdXJyZW50IGVuZHBvaW50IGhhcyBkaWFsbGVkLCBieSBhbnkgcm91dGUuIElyb2hcbiAqIHJlbWVtYmVycyBhIHByaW50ZXIncyByZWxheSBwYXRoIGZvciBhcyBsb25nIGFzIGEgY29ubmVjdGlvbiB0byBpdCBpcyBvcGVuXG4gKiBhbmQgZm9yIDYwIHMgYWZ0ZXIgKEtBTi0yNTMxKSwgc28gYSBCbHVldG9vdGggZGlhbCBvbiBhbiBlbmRwb2ludCB0aGF0IGhvbGRzXG4gKiB0aGF0IG1lbW9yeSBzZW5kcyBpdHMgZmlyc3QgcGFja2V0cyBvdmVyIHRoZSByZWxheSBhcyB3ZWxsLiBBIHBpbm5lZCBkaWFsXG4gKiB0aGF0IHN0aWxsIGxhbmRzIG9uIHRoZSByZWxheSBsZWF2ZXMgdGhhdCBtZW1vcnkgYmVoaW5kLCBzbyBhIHJldHJ5IG5lZWRzIGFcbiAqIG5ldyBlbmRwb2ludCB0b286IGV2ZXJ5IGRpYWwgaXMgcmVjb3JkZWQsIG5vdCBvbmx5IHRoZSBuZXR3b3JrIG9uZXMuXG4gKi9cbmNvbnN0IGRpYWxlZCA9IG5ldyBTZXQ8c3RyaW5nPigpXG5cbmV4cG9ydCBjb25zdCBSRUJJTkRfQlVTWV9NRVNTQUdFID0gJ0ZpbmlzaCBvciBjYW5jZWwgYWRkaW5nIGEgZGV2aWNlIG9yIHNldHRpbmcgdXAgYSBwcmludGVyIGZpcnN0LCB0aGVuIGNvbm5lY3Qgb3ZlciBCbHVldG9vdGggYWdhaW4uJ1xuXG5mdW5jdGlvbiBsb2dMYXRlICh3aGF0OiBzdHJpbmcsIGVycm9yOiB1bmtub3duKSB7XG4gIGNvbnNvbGUud2FybihgbXVvbi1saW5rOiAke3doYXR9OiAkeyhlcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZXJyb3J9YClcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRW5kcG9pbnQgKHJlbGF5VXJsOiBzdHJpbmcpOiBQcm9taXNlPFdhc21FbmRwb2ludD4ge1xuICBjb25zdCBtb2QgPSBhd2FpdCBsb2FkV2FzbSgpXG4gIGxldCBzZWNyZXQ6IFVpbnQ4QXJyYXkgfCBudWxsID0gbnVsbFxuICBjb25zdCBwZXJzaXN0ID0gY2xvdWRUb2tlbnNQZXJzaXN0KClcbiAgdHJ5IHtcbiAgICBzZWNyZXQgPSBwZXJzaXN0ID8gaGV4VG9CeXRlcyhsb2NhbFN0b3JhZ2UuZ2V0SXRlbShLRVlfU1RPUkFHRSkgPz8gJycpIDogbWVtb3J5S2V5XG4gIH0gY2F0Y2ggeyAvKiBubyBzdG9yYWdlICovIH1cbiAgY29uc3QgZW5kcG9pbnQgPSBhd2FpdCBtb2QuTXVvbkVuZHBvaW50LmNyZWF0ZShyZWxheVVybCwgc2VjcmV0KVxuICBpZiAocGVyc2lzdCkge1xuICAgIHRyeSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShLRVlfU1RPUkFHRSwgYnl0ZXNUb0hleChlbmRwb2ludC5zZWNyZXRLZXkoKSkpXG4gICAgfSBjYXRjaCB7IC8qIG5vIHN0b3JhZ2UgKi8gfVxuICB9IGVsc2Uge1xuICAgIG1lbW9yeUtleSA9IGVuZHBvaW50LnNlY3JldEtleSgpXG4gIH1cbiAgcmV0dXJuIGVuZHBvaW50XG59XG5cbi8qKiBUaGUgdGFiJ3MgZW5kcG9pbnQsIGJvdW5kIHRvIGByZWxheVVybGAuICovXG5leHBvcnQgZnVuY3Rpb24gYnJvd3NlckVuZHBvaW50IChyZWxheVVybDogc3RyaW5nKTogUHJvbWlzZTxXYXNtRW5kcG9pbnQ+IHtcbiAgaWYgKCFjbG91ZFNlc3Npb25BbGxvd2VkKCkpIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ2xvdWRFcnJvcihJTlNFQ1VSRV9PUklHSU5fTUVTU0FHRSwgMCwgJ2luc2VjdXJlX29yaWdpbicpKVxuICBpZiAoIWVuZHBvaW50UHJvbWlzZSB8fCBlbmRwb2ludFJlbGF5ICE9PSByZWxheVVybCkge1xuICAgIGVuZHBvaW50UmVsYXkgPSByZWxheVVybFxuICAgIGRpYWxlZC5jbGVhcigpXG4gICAgZW5kcG9pbnRQcm9taXNlID0gY3JlYXRlRW5kcG9pbnQocmVsYXlVcmwpXG4gICAgZW5kcG9pbnRQcm9taXNlLmNhdGNoKCgpID0+IHsgZW5kcG9pbnRQcm9taXNlID0gbnVsbCB9KVxuICB9XG4gIHJldHVybiBlbmRwb2ludFByb21pc2Vcbn1cblxuLyoqXG4gKiBDbG9zZXMgdGhlIHRhYidzIGVuZHBvaW50IGFuZCBiaW5kcyBhIG5ldyBvbmUgd2l0aCB0aGUgc2FtZSBrZXkgYW5kIG5vXG4gKiBtZW1vcnkgb2YgYW55IHByaW50ZXIncyBwYXRoIChLQU4tMjUzMSkuIEV2ZXJ5IHNlc3Npb24gb24gdGhlIG9sZCBlbmRwb2ludFxuICogZW5kcywgc28gdGhlIGNhbGxlciBpcyBvbmUgdGhhdCBoYXMgdG87IHRoZSBvbGQgZW5kcG9pbnQgaXMgY2xvc2VkIChhbmQgaXRzXG4gKiBoYW5kbGUgZnJlZWQpIGJlZm9yZSB0aGUgbmV3IG9uZSBiaW5kcywgc28gdGhlIGtleSBpcyBuZXZlciBsaXZlIHR3aWNlLiBBXG4gKiBjbG9zZSB0aGF0IGZhaWxzIGlzIGxvZ2dlZCBhbmQgdGhlIG9sZCBlbmRwb2ludCBhYmFuZG9uZWQsIG5ldmVyIHdhaXRlZCBvblxuICogYWdhaW4uIENhbGxlcnMgdGhhdCBhc2sgbWVhbndoaWxlIGdldCB0aGUgbmV3IGVuZHBvaW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJlc2hCcm93c2VyRW5kcG9pbnQgKHJlbGF5VXJsOiBzdHJpbmcpOiBQcm9taXNlPFdhc21FbmRwb2ludD4ge1xuICBpZiAoIWNsb3VkU2Vzc2lvbkFsbG93ZWQoKSkgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDbG91ZEVycm9yKElOU0VDVVJFX09SSUdJTl9NRVNTQUdFLCAwLCAnaW5zZWN1cmVfb3JpZ2luJykpXG4gIGNvbnN0IG9sZCA9IGVuZHBvaW50UHJvbWlzZVxuICBlbmRwb2ludFJlbGF5ID0gcmVsYXlVcmxcbiAgZGlhbGVkLmNsZWFyKClcbiAgLy8gRXZlcnkgQmx1ZXRvb3RoIGxpbmsgb24gdGhlIG9sZCBlbmRwb2ludCBpcyBhYm91dCB0byBjbG9zZTogdGhhdCBpcyBub3QgYSBkcm9wICgjMzcwKS5cbiAgbm90aWZ5RW5kcG9pbnRSZXBsYWNpbmcoKVxuICBjb25zdCBmcmVzaCA9IChhc3luYyAoKSA9PiB7XG4gICAgaWYgKG9sZCkge1xuICAgICAgbGV0IHByZXZpb3VzOiBXYXNtRW5kcG9pbnQgfCBudWxsID0gbnVsbFxuICAgICAgdHJ5IHtcbiAgICAgICAgcHJldmlvdXMgPSBhd2FpdCBvbGRcbiAgICAgIH0gY2F0Y2ggeyAvKiBpdCBuZXZlciBib3VuZDogbm90aGluZyB0byBjbG9zZSAqLyB9XG4gICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBwcmV2aW91cy5jbG9zZSgpXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgbG9nTGF0ZSgnY2xvc2luZyB0aGUgb2xkIGVuZHBvaW50IGZhaWxlZCwgc28gaXQgaXMgYWJhbmRvbmVkJywgZXJyb3IpXG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwcmV2aW91cy5mcmVlPy4oKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGxvZ0xhdGUoJ2ZyZWVpbmcgdGhlIG9sZCBlbmRwb2ludCBmYWlsZWQnLCBlcnJvcilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlRW5kcG9pbnQocmVsYXlVcmwpXG4gIH0pKClcbiAgZW5kcG9pbnRQcm9taXNlID0gZnJlc2hcbiAgZnJlc2guY2F0Y2goKCkgPT4geyBpZiAoZW5kcG9pbnRQcm9taXNlID09PSBmcmVzaCkgZW5kcG9pbnRQcm9taXNlID0gbnVsbCB9KVxuICByZXR1cm4gZnJlc2hcbn1cblxuLyoqXG4gKiBUaGUgZW5kcG9pbnQgdG8gZGlhbCBgcHJpbnRlcklkYCBvbi4gQW4gZXhwbGljaXQgQmx1ZXRvb3RoIGNob2ljZSBmb3IgYVxuICogcHJpbnRlciB0aGlzIGVuZHBvaW50IGhhcyBhbHJlYWR5IGRpYWxsZWQsIGJ5IGFueSByb3V0ZSwgZ2V0cyBhIGZyZXNoIG9uZSxcbiAqIHNvIGl0cyBmaXJzdCBwYWNrZXRzIGhhdmUgbm8gcmVsYXkgcGF0aCB0byByYWNlIG9uIChLQU4tMjUzMSk7IGFueXRoaW5nIGVsc2VcbiAqIGtlZXBzIHRoZSB0YWIncyBlbmRwb2ludCwgYW5kIG90aGVyIHByaW50ZXJzJyBzZXNzaW9ucyB3aXRoIGl0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5kcG9pbnRGb3JEaWFsIChyZWxheVVybDogc3RyaW5nLCBwcmludGVySWQ6IHN0cmluZyk6IFByb21pc2U8V2FzbUVuZHBvaW50PiB7XG4gIGNvbnN0IGlkID0gcHJpbnRlcklkLnRvTG93ZXJDYXNlKClcbiAgaWYgKHdhbnRzQmx1ZXRvb3RoRm9yKGlkKSAmJiBkaWFsZWQuaGFzKGlkKSkge1xuICAgIC8vIENsb3NpbmcgdGhlIGVuZHBvaW50IHdvdWxkIGN1dCBhIHBhaXJpbmcgb3IgYSBzZXR1cCBpbiBwcm9ncmVzczogbm90IG5vdy5cbiAgICBpZiAoZW5kcG9pbnRCdXN5KCkpIHRocm93IG5ldyBFcnJvcihSRUJJTkRfQlVTWV9NRVNTQUdFKVxuICAgIGNvbnN0IGZyZXNoID0gYXdhaXQgZnJlc2hCcm93c2VyRW5kcG9pbnQocmVsYXlVcmwpXG4gICAgZGlhbGVkLmFkZChpZClcbiAgICAvLyBFdmVyeSBvdGhlciBwcmludGVyJ3MgdHJhbnNwb3J0IGRpZWQgd2l0aCB0aGUgb2xkIGVuZHBvaW50OiBoYXZlIGVhY2ggZGlhbCBhZ2FpbiBvbiB0aGUgbmV3IG9uZS5cbiAgICBub3RpZnlFbmRwb2ludFJlYm91bmQoaWQpXG4gICAgcmV0dXJuIGZyZXNoXG4gIH1cbiAgY29uc3QgZW5kcG9pbnQgPSBhd2FpdCBicm93c2VyRW5kcG9pbnQocmVsYXlVcmwpXG4gIGRpYWxlZC5hZGQoaWQpXG4gIHJldHVybiBlbmRwb2ludFxufVxuXG4vKiogRm9yZ2V0cyB0aGlzIGJyb3dzZXIncyBrZXksIHNvIHRoZSBuZXh0IHNpZ24taW4gc3RhcnRzIGZyb20gYSBuZXcgb25lLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcmdldEJyb3dzZXJLZXkgKCkge1xuICBtZW1vcnlLZXkgPSBudWxsXG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oS0VZX1NUT1JBR0UpXG4gIH0gY2F0Y2ggeyAvKiBubyBzdG9yYWdlICovIH1cbiAgZW5kcG9pbnRQcm9taXNlPy50aGVuKGUgPT4gZS5jbG9zZSgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgZW5kcG9pbnRQcm9taXNlID0gbnVsbFxufVxuXG4vKiogQSBXZWJTb2NrZXQtc2hhcGVkIG9iamVjdCBvdmVyIGEgZ2F0ZXdheSBXZWJTb2NrZXQsIGZvciBGbHVpZGQncyBzb2NrZXQgY2xpZW50LiAqL1xuY2xhc3MgSXJvaFNvY2tldCBpbXBsZW1lbnRzIFByaW50ZXJTb2NrZXQge1xuICByZWFkeVN0YXRlID0gMVxuICBwcml2YXRlIHJlYWRvbmx5IGxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCBBcnJheTwoZXZlbnQ6IGFueSkgPT4gdm9pZD4+KClcblxuICBwcml2YXRlIHJlYWRvbmx5IGlubmVyOiBXYXNtU29ja2V0XG5cbiAgY29uc3RydWN0b3IgKGlubmVyOiBXYXNtU29ja2V0KSB7XG4gICAgdGhpcy5pbm5lciA9IGlubmVyXG4gICAgdGhpcy5wdW1wKClcbiAgfVxuXG4gIHNlbmQgKGRhdGE6IHN0cmluZykge1xuICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgIT09IDEpIHJldHVyblxuICAgIHRoaXMuaW5uZXIuc2VuZChkYXRhKS5jYXRjaChlcnJvciA9PiB0aGlzLmZhaWwoZXJyb3IpKVxuICB9XG5cbiAgY2xvc2UgKCkge1xuICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPj0gMikgcmV0dXJuXG4gICAgdGhpcy5yZWFkeVN0YXRlID0gMlxuICAgIHRoaXMuaW5uZXIuY2xvc2UoKS5jYXRjaCgoKSA9PiB7fSkuZmluYWxseSgoKSA9PiB0aGlzLmNsb3NlZCgxMDAwLCAnJykpXG4gIH1cblxuICBhZGRFdmVudExpc3RlbmVyICh0eXBlOiBzdHJpbmcsIGxpc3RlbmVyOiAoZXZlbnQ6IGFueSkgPT4gdm9pZCkge1xuICAgIGNvbnN0IGxpc3QgPSB0aGlzLmxpc3RlbmVycy5nZXQodHlwZSkgPz8gW11cbiAgICBsaXN0LnB1c2gobGlzdGVuZXIpXG4gICAgdGhpcy5saXN0ZW5lcnMuc2V0KHR5cGUsIGxpc3QpXG4gIH1cblxuICBwcml2YXRlIGVtaXQgKHR5cGU6IHN0cmluZywgZXZlbnQ6IGFueSkge1xuICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuZ2V0KHR5cGUpID8/IFtdKSBsaXN0ZW5lcihldmVudClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHVtcCAoKSB7XG4gICAgLy8gTGV0IHRoZSBjYWxsZXIgYXR0YWNoIGxpc3RlbmVycyBiZWZvcmUgdGhlIGZpcnN0IG1lc3NhZ2UuXG4gICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKClcbiAgICBmb3IgKDs7KSB7XG4gICAgICBsZXQgbWVzc2FnZTogc3RyaW5nIHwgVWludDhBcnJheSB8IG51bGxcbiAgICAgIHRyeSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLmlubmVyLm5leHQoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5mYWlsKGVycm9yKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmIChtZXNzYWdlID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuY2xvc2VkKDEwMDAsICcnKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycgPyBtZXNzYWdlIDogbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKG1lc3NhZ2UpXG4gICAgICB0aGlzLmVtaXQoJ21lc3NhZ2UnLCB7IGRhdGEgfSlcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZhaWwgKGVycm9yOiB1bmtub3duKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gMykgcmV0dXJuXG4gICAgdGhpcy5lbWl0KCdlcnJvcicsIHsgZXJyb3IgfSlcbiAgICB0aGlzLmNsb3NlZCgxMDA2LCBTdHJpbmcoKGVycm9yIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlcnJvcikpXG4gIH1cblxuICBwcml2YXRlIGNsb3NlZCAoY29kZTogbnVtYmVyLCByZWFzb246IHN0cmluZykge1xuICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IDMpIHJldHVyblxuICAgIHRoaXMucmVhZHlTdGF0ZSA9IDNcbiAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgeyBjb2RlLCByZWFzb24sIHdhc0NsZWFuOiBjb2RlID09PSAxMDAwIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBIZWFkZXJzIHRoYXQgZnJhbWUgYSByZXF1ZXN0IG9uIHRoZSB3aXJlLCB3aGljaCBvbmx5IHRoZSBiaW5kaW5nIHNldHM6XG4gKiB0aGUgbGVuZ3RoIG9mIHRoZSBib2R5IGl0IHNlbmRzLCBhbmQgdGhlIGhvcC1ieS1ob3AgaGVhZGVycyBhIGNsaWVudCBtYXlcbiAqIG5vdCBjaG9vc2UgKEZldGNoJ3MgZm9yYmlkZGVuIHJlcXVlc3QgaGVhZGVycykuXG4gKi9cbmNvbnN0IEZSQU1JTkdfSEVBREVSUyA9IG5ldyBTZXQoW1xuICAnY29udGVudC1sZW5ndGgnLFxuICAndHJhbnNmZXItZW5jb2RpbmcnLFxuICAnY29ubmVjdGlvbicsXG4gICdrZWVwLWFsaXZlJyxcbiAgJ3RlJyxcbiAgJ3RyYWlsZXInLFxuICAndXBncmFkZSdcbl0pXG5cbi8qKiBPbmUgcHJpbnRlcidzIGdhdGV3YXkgY29ubmVjdGlvbiwgc2hhcGVkIGFzIEZsdWlkZCdzIGBNYW5hZ2VkSXJvaFJlbGF5YC4gKi9cbi8qKiBUaGUgZXJyb3IgZmV0Y2ggcmVqZWN0cyB3aXRoIHdoZW4gaXRzIHNpZ25hbCBhYm9ydHMuICovXG5mdW5jdGlvbiBhYm9ydEVycm9yIChzaWduYWw6IEFib3J0U2lnbmFsKTogdW5rbm93biB7XG4gIHJldHVybiBzaWduYWwucmVhc29uID8/IG5ldyBET01FeGNlcHRpb24oJ1RoZSByZXF1ZXN0IHdhcyBhYm9ydGVkJywgJ0Fib3J0RXJyb3InKVxufVxuXG4vKipcbiAqIGBzZW5kaW5nYCwgb3IgYSByZWplY3Rpb24gYXMgc29vbiBhcyBgc2lnbmFsYCBhYm9ydHMuIFRoZSBiaW5kaW5nIGhhcyBub1xuICogd2F5IHRvIHN0b3Agb25lIHJlcXVlc3Qgb24gYSBjb25uZWN0aW9uLCBzbyBhbiBhYm9ydGVkIHJlcXVlc3QncyBhbnN3ZXIgaXNcbiAqIGFiYW5kb25lZDogdGhlIGNhbGxlciBpcyBmcmVlIGF0IG9uY2UsIGFuZCBub3RoaW5nIHJlYWRzIHdoYXQgY29tZXMgYmFjay5cbiAqL1xuZnVuY3Rpb24gdW50aWxBYm9ydGVkPFQ+IChzZW5kaW5nOiBQcm9taXNlPFQ+LCBzaWduYWw6IEFib3J0U2lnbmFsIHwgbnVsbCB8IHVuZGVmaW5lZCk6IFByb21pc2U8VD4ge1xuICBpZiAoIXNpZ25hbCkgcmV0dXJuIHNlbmRpbmdcbiAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBvbkFib3J0ID0gKCkgPT4gcmVqZWN0KGFib3J0RXJyb3Ioc2lnbmFsKSlcbiAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHJldHVybiBvbkFib3J0KClcbiAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0LCB7IG9uY2U6IHRydWUgfSlcbiAgICBzZW5kaW5nLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KS5maW5hbGx5KCgpID0+IHNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIG9uQWJvcnQpKVxuICB9KVxufVxuXG4vLyBCcm93c2VycyBlbmQgYSBtdWx0aXBhcnQgYm9keSB3aXRoIFwiLS1ib3VuZGFyeS0tXFxyXFxuXCI7IHNvbWUgcnVudGltZXNcbi8vIChOb2RlIDIwLjE5J3MgdW5kaWNpKSBzdG9wIGF0IFwiLS1ib3VuZGFyeS0tXCIuIE1vb25yYWtlcidzIHBhcnNlciByZWFkc1xuLy8gYm90aCwgYnV0IHRoZSBieXRlcyBzZW50IHNob3VsZCBiZSB0aGUgc2FtZSB3aGVyZXZlciB0aGUgcGFnZSBydW5zLlxuZnVuY3Rpb24gY2xvc2VNdWx0aXBhcnQgKGJvZHk6IFVpbnQ4QXJyYXksIHR5cGU6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBib3VuZGFyeSA9IC9ib3VuZGFyeT0oXCI/KShbXlwiO10rKVxcMS9pLmV4ZWModHlwZSk/LlsyXVxuICBpZiAoIWJvdW5kYXJ5KSByZXR1cm4gYm9keVxuICBjb25zdCBjbG9zZSA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShgLS0ke2JvdW5kYXJ5fS0tYClcbiAgaWYgKGJvZHkubGVuZ3RoIDwgY2xvc2UubGVuZ3RoKSByZXR1cm4gYm9keVxuICBjb25zdCB0YWlsID0gYm9keS5zdWJhcnJheShib2R5Lmxlbmd0aCAtIGNsb3NlLmxlbmd0aClcbiAgaWYgKCF0YWlsLmV2ZXJ5KChiLCBuKSA9PiBiID09PSBjbG9zZVtuXSkpIHJldHVybiBib2R5XG4gIGNvbnN0IGNsb3NlZCA9IG5ldyBVaW50OEFycmF5KGJvZHkubGVuZ3RoICsgMilcbiAgY2xvc2VkLnNldChib2R5KVxuICBjbG9zZWQuc2V0KFsxMywgMTBdLCBib2R5Lmxlbmd0aClcbiAgcmV0dXJuIGNsb3NlZFxufVxuXG5leHBvcnQgY2xhc3MgSXJvaFByaW50ZXIgaW1wbGVtZW50cyBNYW5hZ2VkSXJvaFJlbGF5IHtcbiAgcHJpdmF0ZSByZWFkb25seSBwcmludGVyOiBXYXNtUHJpbnRlclxuICBwcml2YXRlIGVuZGVkID0gZmFsc2VcblxuICBnZXQgY2xvc2VkICgpIHsgcmV0dXJuIHRoaXMuZW5kZWQgfVxuXG4gIGNvbnN0cnVjdG9yIChwcmludGVyOiBXYXNtUHJpbnRlcikge1xuICAgIHRoaXMucHJpbnRlciA9IHByaW50ZXJcbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0Um91dGUgKCkge1xuICAgIGNvbnN0IGRyb3BwZWQgPSBibHVldG9vdGhEcm9wcGVkKHRoaXMucHJpbnRlci5wcmludGVySWQoKSlcbiAgICBpZiAoZHJvcHBlZCkgdGhyb3cgbmV3IEVycm9yKGBCbHVldG9vdGggZHJvcHBlZDogJHtkcm9wcGVkfSBSZWNvbm5lY3QsIG9yIGNob29zZSBob3cgdG8gY29ubmVjdC5gKVxuICB9XG5cbiAgYXN5bmMgZmV0Y2ggKHBhdGg6IHN0cmluZywgaW5pdD86IFJlcXVlc3RJbml0LCBwcm9ncmVzcz86IFVwbG9hZFByb2dyZXNzKTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICAgIHRoaXMuYXNzZXJ0Um91dGUoKVxuICAgIGNvbnN0IHNpZ25hbCA9IGluaXQ/LnNpZ25hbFxuICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHRocm93IGFib3J0RXJyb3Ioc2lnbmFsKVxuICAgIGNvbnN0IG1ldGhvZCA9IChpbml0Py5tZXRob2QgPz8gJ0dFVCcpLnRvVXBwZXJDYXNlKClcbiAgICBjb25zdCB1cGxvYWQgPSBtZXRob2QgPT09ICdQT1NUJyAmJiBwYXRoLnNwbGl0KCc/JylbMF0gPT09ICcvc2VydmVyL2ZpbGVzL3VwbG9hZCdcbiAgICBpZiAodXBsb2FkICYmIGJsdWV0b290aENhcnJ5aW5nKHRoaXMucHJpbnRlci5wcmludGVySWQoKSkpIGFzc2VydEJsdWV0b290aFVwbG9hZFNpemUoaW5pdD8uYm9keSlcbiAgICBjb25zdCBoZWFkZXJzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3Qgc291cmNlID0gbmV3IEhlYWRlcnMoaW5pdD8uaGVhZGVycyA/PyB7fSlcbiAgICBzb3VyY2UuZm9yRWFjaCgodmFsdWUsIG5hbWUpID0+IHtcbiAgICAgIC8vIFRoZSBnYXRld2F5IHNldHMgaXRzIG93biBob3N0IGFuZCBjcmVkZW50aWFscywgYW5kIHRoZSBiaW5kaW5nXG4gICAgICAvLyBmcmFtZXMgdGhlIGJvZHkgaXQgaXMgZ2l2ZW46IGEgY2FsbGVyJ3Mgb3duIGZyYW1pbmcgaGVhZGVycyB3b3VsZFxuICAgICAgLy8gZGVzY3JpYmUgYW5vdGhlciBib2R5LCBvciBtYWtlIHRoZSByZXF1ZXN0IGFtYmlndW91cywgd2hpY2ggdGhlXG4gICAgICAvLyBnYXRld2F5IHJlZnVzZXMuXG4gICAgICBpZiAobmFtZSA9PT0gJ2hvc3QnIHx8IG5hbWUgPT09ICdhdXRob3JpemF0aW9uJyB8fCBGUkFNSU5HX0hFQURFUlMuaGFzKG5hbWUpKSByZXR1cm5cbiAgICAgIGhlYWRlcnMucHVzaChuYW1lLCB2YWx1ZSlcbiAgICB9KVxuICAgIGxldCBib2R5ID0gbmV3IFVpbnQ4QXJyYXkoKVxuICAgIGlmIChpbml0Py5ib2R5ICE9PSB1bmRlZmluZWQgJiYgaW5pdC5ib2R5ICE9PSBudWxsKSB7XG4gICAgICAvLyBFbmNvZGVkIG9uY2U6IGV2ZXJ5IGVuY29kaW5nIG9mIGEgRm9ybURhdGEgcGlja3MgYSBuZXcgYm91bmRhcnksIHNvXG4gICAgICAvLyB0aGUgYnl0ZXMgYW5kIHRoZSB0eXBlIG11c3QgY29tZSBmcm9tIHRoZSBzYW1lIFJlc3BvbnNlLlxuICAgICAgY29uc3QgZW5jb2RlZCA9IG5ldyBSZXNwb25zZShpbml0LmJvZHkgYXMgQm9keUluaXQpXG4gICAgICBib2R5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZW5jb2RlZC5hcnJheUJ1ZmZlcigpKVxuICAgICAgaWYgKGluaXQuYm9keSBpbnN0YW5jZW9mIEZvcm1EYXRhKSB7XG4gICAgICAgIC8vIEEgbXVsdGlwYXJ0IGJvZHkncyBib3VuZGFyeSBsaXZlcyBpbiB0aGUgdHlwZSBSZXNwb25zZSBjb21wdXRlZC5cbiAgICAgICAgY29uc3QgdHlwZSA9IGVuY29kZWQuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpXG4gICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgY29uc3QgaSA9IGhlYWRlcnMuZmluZEluZGV4KChoLCBuKSA9PiBuICUgMiA9PT0gMCAmJiBoLnRvTG93ZXJDYXNlKCkgPT09ICdjb250ZW50LXR5cGUnKVxuICAgICAgICAgIGlmIChpID49IDApIGhlYWRlcnMuc3BsaWNlKGksIDIpXG4gICAgICAgICAgaGVhZGVycy5wdXNoKCdjb250ZW50LXR5cGUnLCB0eXBlKVxuICAgICAgICAgIGJvZHkgPSBjbG9zZU11bHRpcGFydChib2R5LCB0eXBlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbml0LmJvZHkgPT09ICdzdHJpbmcnICYmICFzb3VyY2UuaGFzKCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBoZWFkZXJzLnB1c2goJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQWJvcnRlZCB3aGlsZSB0aGUgYm9keSB3YXMgcmVhZDogbm90aGluZyBpcyBzZW50LlxuICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHRocm93IGFib3J0RXJyb3Ioc2lnbmFsKVxuICAgIGNvbnN0IG92ZXJCbHVldG9vdGggPSB1cGxvYWQgJiYgYmx1ZXRvb3RoQ2FycnlpbmcodGhpcy5wcmludGVyLnByaW50ZXJJZCgpKVxuICAgIGlmIChvdmVyQmx1ZXRvb3RoKSBhc3NlcnRCbHVldG9vdGhVcGxvYWRTaXplKGluaXQ/LmJvZHksIGJvZHkubGVuZ3RoKVxuICAgIGlmIChvdmVyQmx1ZXRvb3RoKSB7XG4gICAgICBjb25zdCBzaXplID0gYmx1ZXRvb3RoVXBsb2FkRmlsZVNpemUoaW5pdD8uYm9keSwgYm9keS5sZW5ndGgpXG4gICAgICBpZiAoaXNMb25nQmx1ZXRvb3RoVXBsb2FkKHNpemUpKSBFdmVudEJ1cy4kZW1pdChibHVldG9vdGhMYXJnZUZpbGVNZXNzYWdlKHNpemUpLCB7IHR5cGU6ICd3YXJuaW5nJywgdGltZW91dDogMTIwMDAgfSlcbiAgICB9XG4gICAgY29uc3Qgc2VuZCA9IChyZXBvcnQ/OiBVcGxvYWRQcm9ncmVzcykgPT4gdGhpcy5wcmludGVyLmZldGNoV2l0aFByb2dyZXNzXG4gICAgICA/IHRoaXMucHJpbnRlci5mZXRjaFdpdGhQcm9ncmVzcyhtZXRob2QsIHBhdGgsIGhlYWRlcnMsIGJvZHksIHJlcG9ydClcbiAgICAgIDogdGhpcy5wcmludGVyLmZldGNoKG1ldGhvZCwgcGF0aCwgaGVhZGVycywgYm9keSlcbiAgICBjb25zdCB3b3JrID0gb3ZlckJsdWV0b290aFxuICAgICAgPyB3YXRjaEJsdWV0b290aFVwbG9hZChzZW5kLCBwcm9ncmVzcywgKCkgPT4geyB0aGlzLmVuZGVkID0gdHJ1ZTsgdGhpcy5wcmludGVyLmNsb3NlKCkgfSwgc2lnbmFsKVxuICAgICAgOiBzZW5kKHByb2dyZXNzKVxuICAgIGNvbnN0IGFuc3dlciA9IGF3YWl0IHVudGlsQWJvcnRlZCh3b3JrLCBzaWduYWwpXG4gICAgY29uc3QgcmVzcG9uc2VIZWFkZXJzID0gbmV3IEhlYWRlcnMoKVxuICAgIGZvciAobGV0IGkgPSAwOyBpICsgMSA8IGFuc3dlci5oZWFkZXJzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNwb25zZUhlYWRlcnMuYXBwZW5kKGFuc3dlci5oZWFkZXJzW2ldLCBhbnN3ZXIuaGVhZGVyc1tpICsgMV0pXG4gICAgICB9IGNhdGNoIHsgLyogYSBoZWFkZXIgdGhlIGJyb3dzZXIgcmVmdXNlcyB0byBob2xkICovIH1cbiAgICB9XG4gICAgY29uc3QgbnVsbEJvZHkgPSBhbnN3ZXIuc3RhdHVzID09PSAyMDQgfHwgYW5zd2VyLnN0YXR1cyA9PT0gMzA0XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsQm9keSA/IG51bGwgOiBhbnN3ZXIuYm9keSwgeyBzdGF0dXM6IGFuc3dlci5zdGF0dXMsIGhlYWRlcnM6IHJlc3BvbnNlSGVhZGVycyB9KVxuICB9XG5cbiAgYXN5bmMgb3BlbldlYlNvY2tldCAocGF0aDogc3RyaW5nKTogUHJvbWlzZTxQcmludGVyU29ja2V0PiB7XG4gICAgdGhpcy5hc3NlcnRSb3V0ZSgpXG4gICAgcmV0dXJuIG5ldyBJcm9oU29ja2V0KGF3YWl0IHRoaXMucHJpbnRlci5vcGVuV2ViU29ja2V0KHBhdGgpKVxuICB9XG5cbiAgY2xvc2UgKCkge1xuICAgIHRoaXMucHJpbnRlci5jbG9zZSgpXG4gIH1cbn1cblxuLyoqXG4gKiBEaWFscyBgcHJpbnRlcklkYC4gV2hlbiB0aGUgcGVyc29uIGFza2VkIHRvIG9wZW4gaXQgb3ZlciBCbHVldG9vdGhcbiAqIChgdXNlQmx1ZXRvb3RoRm9yYCksIHRoZSBsaW5rIGNvbWVzIHVwIGZpcnN0LCBhbmQgSXJvaCB0aGVuIGhhcyB0aGUgcmFkaW9cbiAqIGFzIGEgcGF0aCBhcyB3ZWxsIGFzIHRoZSByZWxheTogZm9yIGEgcHJpbnRlciB3aXRoIG5vIFdpLUZpLCB0aGUgb25seSBvbmUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkaWFsUHJpbnRlciAoZW5kcG9pbnQ6IFdhc21FbmRwb2ludCwgcHJpbnRlcklkOiBzdHJpbmcpOiBQcm9taXNlPFdhc21QcmludGVyPiB7XG4gIGNvbnN0IGRyb3BwZWQgPSBibHVldG9vdGhEcm9wcGVkKHByaW50ZXJJZClcbiAgaWYgKGRyb3BwZWQpIHRocm93IG5ldyBFcnJvcihgQmx1ZXRvb3RoIGRyb3BwZWQ6ICR7ZHJvcHBlZH0gUmVjb25uZWN0LCBvciBjaG9vc2UgaG93IHRvIGNvbm5lY3QuYClcbiAgbGV0IGxpbmtcbiAgdHJ5IHtcbiAgICBsaW5rID0gYXdhaXQgYmx1ZXRvb3RoUm91dGVGb3IoZW5kcG9pbnQsIHByaW50ZXJJZClcbiAgICBpZiAod2FudHNCbHVldG9vdGhGb3IocHJpbnRlcklkKSAmJiAhbGluaykgdGhyb3cgbmV3IEVycm9yKCdCbHVldG9vdGggaXMgdW5hdmFpbGFibGUgb24gdGhpcyBlbmRwb2ludC4nKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2VcbiAgICBub3RlQmx1ZXRvb3RoRHJvcHBlZChwcmludGVySWQsIG1lc3NhZ2UpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZG4ndCByZWFjaCB0aGUgcHJpbnRlciBvdmVyIEJsdWV0b290aDogJHttZXNzYWdlfWApXG4gIH1cbiAgLy8gQW4gZXhwbGljaXQgQmx1ZXRvb3RoIGNob2ljZSBpcyBoZWxkIGFzIHRoZSByb3V0ZTogXCJhdXRvXCIgaW5jbHVkZXMgdGhlIHJlbGF5LCB3aGljaCBvZmZsaW5lIHN0YWxscy5cbiAgY29uc3Qgcm91dGUgPSB3YW50c0JsdWV0b290aEZvcihwcmludGVySWQpID8gJ2JsdWV0b290aCcgYXMgY29uc3QgOiB1bmRlZmluZWRcbiAgY29uc3QgcHJpbnRlciA9IGF3YWl0IGNvbm5lY3RXaXRoQXBwcm92YWwoZW5kcG9pbnQsIHByaW50ZXJJZCwgJ011b24zRCBDb250cm9sJywgcm91dGUpID8/IGF3YWl0IChyb3V0ZSA/IGVuZHBvaW50LmNvbm5lY3QocHJpbnRlcklkLCByb3V0ZSkgOiBlbmRwb2ludC5jb25uZWN0KHByaW50ZXJJZCkpXG4gIGlmIChsaW5rKSB7XG4gICAgaWYgKCFsaW5rLmlzT3BlbigpKSB7XG4gICAgICBwcmludGVyLmNsb3NlPy4oKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCbHVldG9vdGggZHJvcHBlZCB3aGlsZSBjb25uZWN0aW5nLiBSZWNvbm5lY3QsIG9yIGNob29zZSBob3cgdG8gY29ubmVjdC4nKVxuICAgIH1cbiAgICAvLyBPbmNlOiB0aGUgbGluayBjbG9zaW5nIGFuZCBhbiBlbmRwb2ludCByZXBsYWNlIGNhbiBib3RoIGVuZCB0aGlzIHNlc3Npb24uXG4gICAgbGV0IGNsb3NlZE9uY2UgPSBmYWxzZVxuICAgIGNvbnN0IGNsb3NlT25jZSA9ICgpID0+IHtcbiAgICAgIGlmIChjbG9zZWRPbmNlKSByZXR1cm5cbiAgICAgIGNsb3NlZE9uY2UgPSB0cnVlXG4gICAgICB0cnkge1xuICAgICAgICBwcmludGVyLmNsb3NlPy4oKVxuICAgICAgfSBjYXRjaCB7IC8qIGFscmVhZHkgY2xvc2VkICovIH1cbiAgICB9XG4gICAgbGluay5jbG9zZWQudGhlbihjbG9zZU9uY2UsIGNsb3NlT25jZSlcbiAgfVxuICByZXR1cm4gcHJpbnRlclxufVxuXG4vKiogRmx1aWRkJ3MgYE1hbmFnZWRJcm9oRW5kcG9pbnRgOiBkaWFscyB0aGUgcHJpbnRlciB0aGUgaGFuZG9mZiBuYW1lcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYW5hZ2VkRW5kcG9pbnRGYWN0b3J5ICgpOiBQcm9taXNlPE1hbmFnZWRJcm9oRW5kcG9pbnQ+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgYXN5bmMgb3BlblJlbGF5IChzZXNzaW9uOiBBdXRob3JpemVkTWFuYWdlZFJlbGF5U2Vzc2lvbikge1xuICAgICAgY29uc3QgZW5kcG9pbnQgPSBhd2FpdCBlbmRwb2ludEZvckRpYWwoc2Vzc2lvbi5yZWxheVVybCwgc2Vzc2lvbi5wcmludGVySWQpXG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IElyb2hQcmludGVyKGF3YWl0IGRpYWxQcmludGVyKGVuZHBvaW50LCBzZXNzaW9uLnByaW50ZXJJZCkpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aHJvdyBwaW5uZWRCbHVldG9vdGhFcnJvcihlcnJvcilcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlICgpIHt9XG4gIH0pXG59XG4iXSwibWFwcGluZ3MiOiJBQU9BLFNBQVMsMkJBQW1EO0FBUTVELFNBQVMsbUJBQW1CLGtCQUFrQixtQkFBbUIsc0JBQXNCLHlCQUEyQztBQUNsSSxTQUFTLDJCQUEyQiwyQkFBMkIseUJBQXlCLHVCQUF1Qiw0QkFBNEI7QUFDM0ksU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyw0QkFBNEI7QUFDckMsU0FBUyxZQUFZLHlCQUF5QixjQUFjLHFCQUFxQiwwQkFBMEI7QUFDM0csU0FBUyxjQUFjLHVCQUF1QiwrQkFBK0I7QUFDN0UsT0FBTyxvQkFBb0I7QUFFM0IsTUFBTSxjQUFjO0FBRXBCLE1BQU0sZ0NBQWdDO0FBT3RDLElBQUk7QUFFRixNQUFJLENBQUMsbUJBQW1CLEdBQUc7QUFDekIsaUJBQWEsV0FBVyxXQUFXO0FBR25DLFdBQU8saUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQzVDLFVBQUksTUFBTSxR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