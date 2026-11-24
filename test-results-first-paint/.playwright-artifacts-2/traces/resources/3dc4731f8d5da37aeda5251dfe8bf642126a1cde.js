import { HELLO_TYPE, PORT_TYPE, SUPPORTED_VERSIONS, readNavigate, readPanelState } from "/src/services/panel-embed/protocol.ts";
import { NOTIFY_FORWARD, ON_PRINTER, auxVerdict, readVerb, rpcVerdict } from "/src/services/panel-embed/allow.ts";
export const PANEL_POLL_MS = 2e3;
export function busyReason(state) {
  const what = state?.modal?.id.replace(/[-_]+/g, " ").trim();
  return what ? `The printer's screen is busy with ${what}` : "The printer's screen is busy";
}
export class PanelBridge {
  constructor(frame, host, events = {}) {
    this.frame = frame;
    this.host = host;
    this.events = events;
    window.addEventListener("message", this.onWindowMessage);
  }
  port = null;
  /** The objects the embed subscribed to (null = all), for forwarding status updates. */
  watched = void 0;
  refused = 0;
  /** The embed's protocol version (it said so in its hello); the panel state goes only to version 2 and up. */
  version = 1;
  /** The last panel state Control knows, and whether this printer has one at all. */
  panel = null;
  support = "unknown";
  pollTimer = null;
  /** The websocket is down, so the state should be polled: honoured only once a version 2 embed is here. */
  pollWanted = false;
  syncing = null;
  onWindowMessage = (e) => this.hello(e);
  /**
   * The embed's hello, from our frame. The frame is sandboxed without
   * allow-same-origin, so its origin is opaque ("null") and it can't reach
   * Control's storage, cookies or window: the source check binds the port to
   * this frame, and the port can't go anywhere else. A new hello from the same
   * frame (it reloaded) closes the old port and hands over a new one.
   */
  hello(e) {
    const data = e.data;
    if (!data || data.type !== HELLO_TYPE || typeof data.version !== "number" || !SUPPORTED_VERSIONS.includes(data.version)) return;
    const target = this.frame.contentWindow;
    if (!target || e.source !== target || e.origin !== "null") return;
    if ((this.frame.getAttribute("sandbox") ?? "").split(" ").includes("allow-same-origin")) return;
    this.port?.close();
    this.watched = void 0;
    this.version = data.version;
    const channel = new MessageChannel();
    this.port = channel.port1;
    this.port.onmessage = (m) => {
      this.handle(m.data).catch(() => void 0);
    };
    target.postMessage({ type: PORT_TYPE }, "*", [channel.port2]);
    if (this.version >= 2) {
      if (this.panel || this.support === "no") this.push();
      this.syncPanel().catch(() => void 0);
      if (this.pollWanted) this.setPolling(true);
    }
  }
  reply(r) {
    this.port?.postMessage(r);
  }
  refuse(id, what, status) {
    this.refused++;
    this.events.onRefused?.(what);
    this.reply({ id, ok: false, error: { message: ON_PRINTER, code: -32601, status: status ?? 403 } });
  }
  /** One request from the embed. */
  async handle(raw) {
    const req = raw;
    if (!req || typeof req !== "object" || typeof req.id !== "number") return;
    const id = req.id;
    if (req.kind === "rpc") {
      const method = req.method;
      const verdict = rpcVerdict(method);
      if (verdict === "refuse") return this.refuse(id, String(method));
      const params = req.params;
      const safeParams = params && typeof params === "object" && !Array.isArray(params) ? params : void 0;
      if (verdict === "local") return this.reply({ id, ok: true, result: this.local(method, safeParams) });
      try {
        const result = await this.host.rpc(method, safeParams);
        this.reply({ id, ok: true, result });
      } catch (err) {
        this.reply({ id, ok: false, error: { message: err instanceof Error ? err.message : "The printer refused that." } });
      }
      return;
    }
    if (req.kind === "aux") {
      const { method, path } = req;
      if (auxVerdict(method, path) === "refuse") return this.refuse(id, `${String(method)} ${String(path)}`);
      try {
        const result = await this.host.auxGet(path);
        this.reply({ id, ok: true, result });
      } catch (err) {
        const status = err.response?.status;
        this.reply({ id, ok: false, error: { message: err instanceof Error ? err.message : "The printer refused that.", status } });
      }
      return;
    }
    if (req.kind === "verb") {
      const verb = readVerb(req);
      if (!verb) return this.refuse(id, "malformed verb");
      const why = this.host.verb(verb);
      if (why) this.reply({ id, ok: false, error: { message: why, status: 409 } });
      else this.reply({ id, ok: true, result: null });
      return;
    }
    if (req.kind === "navigate") return this.navigate(id, req);
    this.refuse(id, "unknown request");
  }
  push() {
    if (this.version < 2 || !this.port) return;
    const supported = this.support !== "no";
    this.port.postMessage({ kind: "panel-state", supported, state: supported ? this.panel : null });
  }
  adopt(state) {
    this.panel = state;
    this.support = "yes";
    this.events.onSupport?.(true);
    this.push();
  }
  unsupported() {
    this.panel = null;
    if (this.support === "no") return;
    this.support = "no";
    this.events.onSupport?.(false);
    this.push();
  }
  /**
   * Reads the panel state from the printer and passes it on. A printer without the endpoint (404 or 405) is
   * remembered as having no live screen; a read that fails any other way changes nothing and is tried again.
   * One read at a time.
   */
  syncPanel() {
    if (!this.host.panelGet) return Promise.resolve();
    this.syncing ??= (async () => {
      try {
        const res = await this.host.panelGet();
        if (res.status === 404 || res.status === 405) return this.unsupported();
        if (res.status < 200 || res.status >= 300) return;
        const body = res.body;
        const state = readPanelState(body && typeof body === "object" && "result" in body ? body.result : body);
        if (state && !(this.support === "yes" && this.panel && state.seq === this.panel.seq)) this.adopt(state);
      } catch {
      } finally {
        this.syncing = null;
      }
    })();
    return this.syncing;
  }
  /** The printer's own notification of a new panel state: it is ordered, so a different seq is the newer one. */
  panelNotify(raw) {
    const state = readPanelState(raw);
    if (!state || this.support === "no") return;
    if (this.panel && state.seq === this.panel.seq) return;
    this.adopt(state);
  }
  /** While the websocket is down, ask for the state every PANEL_POLL_MS; stop when it is back. */
  setPolling(on) {
    this.pollWanted = on;
    if (!on || this.version < 2 || this.support === "no" || !this.host.panelGet) {
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = null;
      return;
    }
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      this.syncPanel().catch(() => void 0);
    }, PANEL_POLL_MS);
  }
  /**
   * The embed asks the panel to move. Sent with the seq Control last saw, so the printer can tell a stale view
   * (409: re-read and push the truth) and can refuse while a modal is open or the panel is busy (423, in words).
   */
  async navigate(id, raw) {
    const fail = (message, status) => this.reply({ id, ok: false, error: { message, status } });
    const nav = readNavigate(raw);
    if (!nav) return this.refuse(id, "malformed navigate");
    if (!this.host.panelPost || this.support === "no") return fail("Live screen needs a printer update.", 404);
    try {
      const res = await this.host.panelPost({ ...nav, ...this.panel ? { if_seq: this.panel.seq } : {} });
      if (res.status >= 200 && res.status < 300) {
        const body = res.body;
        const out = body && typeof body === "object" && "result" in body ? body.result : body;
        return this.reply({ id, ok: true, result: { seq: typeof out?.seq === "number" ? out.seq : null } });
      }
      if (res.status === 409) {
        await this.syncPanel();
        return fail("The printer's screen has moved on.", 409);
      }
      if (res.status === 423) {
        await this.syncPanel();
        return fail(busyReason(this.panel), 423);
      }
      if (res.status === 404 || res.status === 405) {
        this.unsupported();
        return fail("Live screen needs a printer update.", 404);
      }
      if (res.status === 504) return fail("The printer's screen isn't responding", 504);
      if (res.status === 403 && res.body?.reason === "owner_only") return fail("Only the printer's owner can open that screen", 403);
      if (res.status === 401 || res.status === 403) return fail(ON_PRINTER, res.status);
      return fail("The printer would not change screen.", res.status);
    } catch {
      return fail("The printer's screen isn't responding", 504);
    }
  }
  /** subscribe and identify, answered from what Control already has. */
  local(method, params) {
    if (method === "server.connection.identify") return { connection_id: this.host.connectionId() };
    const objects = params?.objects;
    const status = this.host.status();
    if (!objects || typeof objects !== "object" || Array.isArray(objects)) return { eventtime: Date.now() / 1e3, status: {} };
    const names = Object.keys(objects);
    this.watched = new Set(names);
    const picked = {};
    for (const n of names) if (Object.prototype.hasOwnProperty.call(status, n)) picked[n] = status[n];
    return { eventtime: Date.now() / 1e3, status: picked };
  }
  /**
   * A Moonraker notification Control received, passed on. A status update
   * carries only the objects the embed subscribed to, and nothing before it has.
   */
  notify(method, params) {
    if (!this.port || this.watched === void 0 || !NOTIFY_FORWARD.has(method)) return;
    if (method === "notify_status_update") {
      const p = params;
      const update = Array.isArray(p) ? p[0] : p;
      const picked = {};
      for (const [k, v] of Object.entries(update ?? {})) if (this.watched.has(k)) picked[k] = v;
      if (!Object.keys(picked).length) return;
      this.port.postMessage({ kind: "notify", method, params: [picked, Array.isArray(p) ? p[1] : void 0] });
      return;
    }
    this.port.postMessage({ kind: "notify", method, params });
  }
  dispose() {
    this.setPolling(false);
    window.removeEventListener("message", this.onWindowMessage);
    this.port?.close();
    this.port = null;
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJyaWRnZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIRUxMT19UWVBFLCBQT1JUX1RZUEUsIFNVUFBPUlRFRF9WRVJTSU9OUywgcmVhZE5hdmlnYXRlLCByZWFkUGFuZWxTdGF0ZSwgdHlwZSBCcmlkZ2VSZXF1ZXN0LCB0eXBlIEJyaWRnZVJlc3BvbnNlLCB0eXBlIFBhbmVsU3RhdGUsIHR5cGUgVmVyYiB9IGZyb20gJy4vcHJvdG9jb2wnXG5pbXBvcnQgeyBOT1RJRllfRk9SV0FSRCwgT05fUFJJTlRFUiwgYXV4VmVyZGljdCwgcmVhZFZlcmIsIHJwY1ZlcmRpY3QgfSBmcm9tICcuL2FsbG93J1xuXG4vKipcbiAqIENvbnRyb2wncyBlbmQgb2YgdGhlIGVtYmVkZGVkIHByaW50ZXIgc2NyZWVuIChNdW9uVUkncyBlbWJlZCBidWlsZCwgZmV0Y2hlZFxuICogZnJvbSB0aGUgcHJpbnRlciBvdmVyIHRoZSBhY3RpdmUgcm91dGUgYW5kIGZyYW1lZCBmcm9tIG1lbW9yeSBhcyBgc3JjZG9jYFxuICogaW4gYSBzYW5kYm94OyBTQ1JFRU4tUExBTi5tZCkuIFRoZSBlbWJlZCBoYXMgbm9cbiAqIG5ldHdvcmsgb2YgaXRzIG93bjogaXQgYXNrcyBvdmVyIG9uZSBNZXNzYWdlUG9ydCwgYW5kIHRoaXMgYW5zd2VycyB3aXRoXG4gKiBDb250cm9sJ3Mgb3duIGNvbm5lY3Rpb24sIGFmdGVyIHRoZSBhbGxvd2xpc3QgKGFsbG93LnRzKS5cbiAqXG4gKiAtIFRoZSBwb3J0IGlzIGhhbmRlZCBvdmVyIG9uY2UsIG9ubHkgdG8gdGhlIGZyYW1lIHRoaXMgYnJpZGdlIHdhcyBtYWRlIGZvclxuICogICAoZXZlbnQuc291cmNlKSwgb25seSBmcm9tIHRoZSBzYW5kYm94J3Mgb3BhcXVlIG9yaWdpbiAoXCJudWxsXCI6IGEgc3JjZG9jIG9yIGJsb2IgZnJhbWVcbiAqICAgd2l0aG91dCBhbGxvdy1zYW1lLW9yaWdpbiBoYXMgbm8gb3RoZXIpLCBhbmQgcG9zdGVkIHRvIHRoYXQgd2luZG93IGFsb25lXG4gKiAgIChhbiBvcGFxdWUgb3JpZ2luIGNhbid0IGJlIG5hbWVkIGFzIGEgdGFyZ2V0KS5cbiAqIC0gTm8gY2FsbCBhZGRzIGhlYWRlcnMgb3IgY3JlZGVudGlhbHMgb2YgaXRzIG93bjogaXQgaXMgQ29udHJvbCdzXG4gKiAgIGNvbm5lY3Rpb24sIGFzIENvbnRyb2wgd291bGQgc2VuZCBpdC5cbiAqIC0gQW55dGhpbmcgbm90IG9uIHRoZSBhbGxvd2xpc3QgaXMgYW5zd2VyZWQgd2l0aCBhbiBlcnJvciBzYXlpbmcgdG8gZG8gaXRcbiAqICAgb24gdGhlIHByaW50ZXIsIGFuZCBpcyBjb3VudGVkLCBuZXZlciBzZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJyaWRnZUhvc3Qge1xuICAvKiogQSBKU09OLVJQQyBjYWxsIG9uIENvbnRyb2wncyBzb2NrZXQ6IGl0cyByZXN1bHQsIG9yIHRocm93cyB3aXRoIHRoZSBwcmludGVyJ3MgZXJyb3IuICovXG4gIHJwYzogKG1ldGhvZDogc3RyaW5nLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgLyoqIEEgR0VUIHVuZGVyIC9zZXJ2ZXIvYXV4IHRocm91Z2ggQ29udHJvbCdzIEhUVFAgY2xpZW50OiB0aGUgZGVjb2RlZCBib2R5LCBvciB0aHJvd3MuICovXG4gIGF1eEdldDogKHBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgLyoqIFRoZSBwcmludGVyJ3Mgc3RhdHVzIGFzIENvbnRyb2wgaG9sZHMgaXQgKENvbnRyb2wgc3Vic2NyaWJlcyB0byBldmVyeSBvYmplY3QpLiAqL1xuICBzdGF0dXM6ICgpID0+IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAvKiogQ29udHJvbCdzIGNvbm5lY3Rpb24gaWQsIGZvciB0aGUgZW1iZWQncyBpZGVudGlmeS4gKi9cbiAgY29ubmVjdGlvbklkOiAoKSA9PiBudW1iZXIgfCBudWxsO1xuICAvKiogUnVucyBhIGNoZWNrZWQgdmVyYiB3aXRoIENvbnRyb2wncyBvd24gZ2F0ZWQgbWV0aG9kczogJycgd2hlbiBpdCB3YXMgc2VudCwgZWxzZSB3aHkgbm90IChpbiB3b3JkcykuICovXG4gIHZlcmI6ICh2OiBWZXJiKSA9PiBzdHJpbmc7XG4gIC8qKlxuICAgKiBHRVQgdGhlIHByaW50ZXIncyBwYW5lbCBzdGF0ZSBvdmVyIHRoZSBhY3RpdmUgcm91dGU6IHRoZSBIVFRQIHN0YXR1cyBhbmQgZGVjb2RlZCBib2R5LCBuZXZlciB0aHJvd3MgZm9yIGFcbiAgICogc3RhdHVzIChvbmx5IGZvciBubyBhbnN3ZXIgYXQgYWxsKS4gQWJzZW50OiB0aGlzIGhvc3QgaGFzIG5vIGxpdmUgc2NyZWVuLlxuICAgKi9cbiAgcGFuZWxHZXQ/OiAoKSA9PiBQcm9taXNlPHsgc3RhdHVzOiBudW1iZXIsIGJvZHk6IHVua25vd24gfT47XG4gIC8qKiBQT1NUIGEgbmF2aWdhdGUgcmVxdWVzdCB0aGUgc2FtZSB3YXkuICovXG4gIHBhbmVsUG9zdD86IChib2R5OiB7IHNjcmVlbjogc3RyaW5nLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaWZfc2VxPzogbnVtYmVyIH0pID0+IFByb21pc2U8eyBzdGF0dXM6IG51bWJlciwgYm9keTogdW5rbm93biB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCcmlkZ2VFdmVudHMge1xuICAvKiogQSBjYWxsIHdhcyByZWZ1c2VkIChtZXRob2Qgb3IgcGF0aCwgYXMgYXNrZWQpLiAqL1xuICBvblJlZnVzZWQ/OiAod2hhdDogc3RyaW5nKSA9PiB2b2lkO1xuICAvKiogV2hldGhlciB0aGlzIHByaW50ZXIgaGFzIGEgbGl2ZSBwYW5lbCBzdGF0ZTogZmFsc2Ugb25jZSBpdCBzYWlkIGl0IGhhcyBub25lIChhbiBvbGRlciBpbWFnZSkuICovXG4gIG9uU3VwcG9ydD86IChzdXBwb3J0ZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG59XG5cbi8qKiBIb3cgb2Z0ZW4gdGhlIHN0YXRlIGlzIGFza2VkIGZvciB3aGlsZSB0aGUgd2Vic29ja2V0IGlzIGRvd24sIG1zIChubyBwb2xsaW5nIHdoaWxlIGl0IHdvcmtzKS4gKi9cbmV4cG9ydCBjb25zdCBQQU5FTF9QT0xMX01TID0gMjAwMFxuXG4vKiogV2hhdCBhIGJ1c3kgcGFuZWwgc2F5cywgaW4gd29yZHM6IHRoZSBtb2RhbCdzIGlkIGFzIHBsYWluIHRleHQuICovXG5leHBvcnQgZnVuY3Rpb24gYnVzeVJlYXNvbiAoc3RhdGU6IFBhbmVsU3RhdGUgfCBudWxsKTogc3RyaW5nIHtcbiAgY29uc3Qgd2hhdCA9IHN0YXRlPy5tb2RhbD8uaWQucmVwbGFjZSgvWy1fXSsvZywgJyAnKS50cmltKClcbiAgcmV0dXJuIHdoYXQgPyBgVGhlIHByaW50ZXIncyBzY3JlZW4gaXMgYnVzeSB3aXRoICR7d2hhdH1gIDogXCJUaGUgcHJpbnRlcidzIHNjcmVlbiBpcyBidXN5XCJcbn1cblxuZXhwb3J0IGNsYXNzIFBhbmVsQnJpZGdlIHtcbiAgcHJpdmF0ZSBwb3J0OiBNZXNzYWdlUG9ydCB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgb2JqZWN0cyB0aGUgZW1iZWQgc3Vic2NyaWJlZCB0byAobnVsbCA9IGFsbCksIGZvciBmb3J3YXJkaW5nIHN0YXR1cyB1cGRhdGVzLiAqL1xuICBwcml2YXRlIHdhdGNoZWQ6IFNldDxzdHJpbmc+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG4gIHJlZnVzZWQgPSAwXG4gIC8qKiBUaGUgZW1iZWQncyBwcm90b2NvbCB2ZXJzaW9uIChpdCBzYWlkIHNvIGluIGl0cyBoZWxsbyk7IHRoZSBwYW5lbCBzdGF0ZSBnb2VzIG9ubHkgdG8gdmVyc2lvbiAyIGFuZCB1cC4gKi9cbiAgcHJpdmF0ZSB2ZXJzaW9uID0gMVxuICAvKiogVGhlIGxhc3QgcGFuZWwgc3RhdGUgQ29udHJvbCBrbm93cywgYW5kIHdoZXRoZXIgdGhpcyBwcmludGVyIGhhcyBvbmUgYXQgYWxsLiAqL1xuICBwcml2YXRlIHBhbmVsOiBQYW5lbFN0YXRlIHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSBzdXBwb3J0OiAndW5rbm93bicgfCAneWVzJyB8ICdubycgPSAndW5rbm93bidcbiAgcHJpdmF0ZSBwb2xsVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPiB8IG51bGwgPSBudWxsXG4gIC8qKiBUaGUgd2Vic29ja2V0IGlzIGRvd24sIHNvIHRoZSBzdGF0ZSBzaG91bGQgYmUgcG9sbGVkOiBob25vdXJlZCBvbmx5IG9uY2UgYSB2ZXJzaW9uIDIgZW1iZWQgaXMgaGVyZS4gKi9cbiAgcHJpdmF0ZSBwb2xsV2FudGVkID0gZmFsc2VcbiAgcHJpdmF0ZSBzeW5jaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSByZWFkb25seSBvbldpbmRvd01lc3NhZ2UgPSAoZTogTWVzc2FnZUV2ZW50KSA9PiB0aGlzLmhlbGxvKGUpXG5cbiAgY29uc3RydWN0b3IgKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaG9zdDogQnJpZGdlSG9zdCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV2ZW50czogQnJpZGdlRXZlbnRzID0ge31cbiAgKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLm9uV2luZG93TWVzc2FnZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZW1iZWQncyBoZWxsbywgZnJvbSBvdXIgZnJhbWUuIFRoZSBmcmFtZSBpcyBzYW5kYm94ZWQgd2l0aG91dFxuICAgKiBhbGxvdy1zYW1lLW9yaWdpbiwgc28gaXRzIG9yaWdpbiBpcyBvcGFxdWUgKFwibnVsbFwiKSBhbmQgaXQgY2FuJ3QgcmVhY2hcbiAgICogQ29udHJvbCdzIHN0b3JhZ2UsIGNvb2tpZXMgb3Igd2luZG93OiB0aGUgc291cmNlIGNoZWNrIGJpbmRzIHRoZSBwb3J0IHRvXG4gICAqIHRoaXMgZnJhbWUsIGFuZCB0aGUgcG9ydCBjYW4ndCBnbyBhbnl3aGVyZSBlbHNlLiBBIG5ldyBoZWxsbyBmcm9tIHRoZSBzYW1lXG4gICAqIGZyYW1lIChpdCByZWxvYWRlZCkgY2xvc2VzIHRoZSBvbGQgcG9ydCBhbmQgaGFuZHMgb3ZlciBhIG5ldyBvbmUuXG4gICAqL1xuICBwcml2YXRlIGhlbGxvIChlOiBNZXNzYWdlRXZlbnQpIHtcbiAgICBjb25zdCBkYXRhID0gZS5kYXRhIGFzIHsgdHlwZT86IHVua25vd24sIHZlcnNpb24/OiB1bmtub3duIH0gfCBudWxsXG4gICAgaWYgKCFkYXRhIHx8IGRhdGEudHlwZSAhPT0gSEVMTE9fVFlQRSB8fCB0eXBlb2YgZGF0YS52ZXJzaW9uICE9PSAnbnVtYmVyJyB8fCAhU1VQUE9SVEVEX1ZFUlNJT05TLmluY2x1ZGVzKGRhdGEudmVyc2lvbikpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZnJhbWUuY29udGVudFdpbmRvd1xuICAgIGlmICghdGFyZ2V0IHx8IGUuc291cmNlICE9PSB0YXJnZXQgfHwgZS5vcmlnaW4gIT09ICdudWxsJykgcmV0dXJuXG4gICAgLy8gQSBmcmFtZSB0aGF0IGNvdWxkIHJlYWNoIENvbnRyb2wncyBvd24gb3JpZ2luIGlzIG5vdCBvbmUgdG8gaGFuZCBhIHBvcnQgdG8uXG4gICAgaWYgKCh0aGlzLmZyYW1lLmdldEF0dHJpYnV0ZSgnc2FuZGJveCcpID8/ICcnKS5zcGxpdCgnICcpLmluY2x1ZGVzKCdhbGxvdy1zYW1lLW9yaWdpbicpKSByZXR1cm5cbiAgICB0aGlzLnBvcnQ/LmNsb3NlKClcbiAgICB0aGlzLndhdGNoZWQgPSB1bmRlZmluZWRcbiAgICB0aGlzLnZlcnNpb24gPSBkYXRhLnZlcnNpb25cbiAgICBjb25zdCBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKClcbiAgICB0aGlzLnBvcnQgPSBjaGFubmVsLnBvcnQxXG4gICAgdGhpcy5wb3J0Lm9ubWVzc2FnZSA9IG0gPT4geyB0aGlzLmhhbmRsZShtLmRhdGEpLmNhdGNoKCgpID0+IHVuZGVmaW5lZCkgfVxuICAgIC8vIEFuIG9wYXF1ZSBvcmlnaW4gY2FuJ3QgYmUgbmFtZWQgYXMgYSB0YXJnZXQ7IHRoZSB3aW5kb3cgaXRzZWxmIGlzIHRoZSBiaW5kaW5nLlxuICAgIHRhcmdldC5wb3N0TWVzc2FnZSh7IHR5cGU6IFBPUlRfVFlQRSB9LCAnKicsIFtjaGFubmVsLnBvcnQyXSlcbiAgICAvLyBUaGUgcG9ydCBxdWV1ZXMgdW50aWwgdGhlIGVtYmVkIGxpc3RlbnM7IGEgdmVyc2lvbiAyIGVtYmVkIGdldHMgdGhlIHNjcmVlbiB0aGUgcGFuZWwgaXMgb24uXG4gICAgaWYgKHRoaXMudmVyc2lvbiA+PSAyKSB7XG4gICAgICAvLyBBIGZyZXNoIGVtYmVkIGdldHMgd2hhdCBpcyBrbm93biBub3c7IHRoZSByZWFkIGJlbG93IG9ubHkgcHVzaGVzIGFnYWluIHdoZW4gdGhlIHNjcmVlbiBoYXMgbW92ZWQuXG4gICAgICBpZiAodGhpcy5wYW5lbCB8fCB0aGlzLnN1cHBvcnQgPT09ICdubycpIHRoaXMucHVzaCgpXG4gICAgICB0aGlzLnN5bmNQYW5lbCgpLmNhdGNoKCgpID0+IHVuZGVmaW5lZClcbiAgICAgIC8vIFRoZSB3ZWJzb2NrZXQgd2FzIGFscmVhZHkgZG93biB3aGVuIHRoaXMgZW1iZWQgc2FpZCBoZWxsbzogc3RhcnQgdGhlIGZhbGxiYWNrIHBvbGwgbm93LlxuICAgICAgaWYgKHRoaXMucG9sbFdhbnRlZCkgdGhpcy5zZXRQb2xsaW5nKHRydWUpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZXBseSAocjogQnJpZGdlUmVzcG9uc2UpIHtcbiAgICB0aGlzLnBvcnQ/LnBvc3RNZXNzYWdlKHIpXG4gIH1cblxuICBwcml2YXRlIHJlZnVzZSAoaWQ6IG51bWJlciwgd2hhdDogc3RyaW5nLCBzdGF0dXM/OiBudW1iZXIpIHtcbiAgICB0aGlzLnJlZnVzZWQrK1xuICAgIHRoaXMuZXZlbnRzLm9uUmVmdXNlZD8uKHdoYXQpXG4gICAgdGhpcy5yZXBseSh7IGlkLCBvazogZmFsc2UsIGVycm9yOiB7IG1lc3NhZ2U6IE9OX1BSSU5URVIsIGNvZGU6IC0zMjYwMSwgc3RhdHVzOiBzdGF0dXMgPz8gNDAzIH0gfSlcbiAgfVxuXG4gIC8qKiBPbmUgcmVxdWVzdCBmcm9tIHRoZSBlbWJlZC4gKi9cbiAgYXN5bmMgaGFuZGxlIChyYXc6IHVua25vd24pIHtcbiAgICBjb25zdCByZXEgPSByYXcgYXMgUGFydGlhbDxCcmlkZ2VSZXF1ZXN0PiB8IG51bGxcbiAgICBpZiAoIXJlcSB8fCB0eXBlb2YgcmVxICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgcmVxLmlkICE9PSAnbnVtYmVyJykgcmV0dXJuXG4gICAgY29uc3QgaWQgPSByZXEuaWRcbiAgICBpZiAocmVxLmtpbmQgPT09ICdycGMnKSB7XG4gICAgICBjb25zdCBtZXRob2QgPSAocmVxIGFzIHsgbWV0aG9kPzogdW5rbm93biB9KS5tZXRob2RcbiAgICAgIGNvbnN0IHZlcmRpY3QgPSBycGNWZXJkaWN0KG1ldGhvZClcbiAgICAgIGlmICh2ZXJkaWN0ID09PSAncmVmdXNlJykgcmV0dXJuIHRoaXMucmVmdXNlKGlkLCBTdHJpbmcobWV0aG9kKSlcbiAgICAgIGNvbnN0IHBhcmFtcyA9IChyZXEgYXMgeyBwYXJhbXM/OiB1bmtub3duIH0pLnBhcmFtc1xuICAgICAgY29uc3Qgc2FmZVBhcmFtcyA9IHBhcmFtcyAmJiB0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShwYXJhbXMpID8gcGFyYW1zIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IDogdW5kZWZpbmVkXG4gICAgICBpZiAodmVyZGljdCA9PT0gJ2xvY2FsJykgcmV0dXJuIHRoaXMucmVwbHkoeyBpZCwgb2s6IHRydWUsIHJlc3VsdDogdGhpcy5sb2NhbChtZXRob2QgYXMgc3RyaW5nLCBzYWZlUGFyYW1zKSB9KVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5ob3N0LnJwYyhtZXRob2QgYXMgc3RyaW5nLCBzYWZlUGFyYW1zKVxuICAgICAgICB0aGlzLnJlcGx5KHsgaWQsIG9rOiB0cnVlLCByZXN1bHQgfSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLnJlcGx5KHsgaWQsIG9rOiBmYWxzZSwgZXJyb3I6IHsgbWVzc2FnZTogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6ICdUaGUgcHJpbnRlciByZWZ1c2VkIHRoYXQuJyB9IH0pXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKHJlcS5raW5kID09PSAnYXV4Jykge1xuICAgICAgY29uc3QgeyBtZXRob2QsIHBhdGggfSA9IHJlcSBhcyB7IG1ldGhvZD86IHVua25vd24sIHBhdGg/OiB1bmtub3duIH1cbiAgICAgIGlmIChhdXhWZXJkaWN0KG1ldGhvZCwgcGF0aCkgPT09ICdyZWZ1c2UnKSByZXR1cm4gdGhpcy5yZWZ1c2UoaWQsIGAke1N0cmluZyhtZXRob2QpfSAke1N0cmluZyhwYXRoKX1gKVxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVGhlIHBhdGggd2FzIGNoZWNrZWQgYnkgYXV4VmVyZGljdCAoYSBsaXN0ZWQgcmVhZCwgbm8gd2F5IG91dCBvZiAvc2VydmVyL2F1eCk7IGl0cyBxdWVyeSBnb2VzIGFzIGFza2VkLlxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmhvc3QuYXV4R2V0KHBhdGggYXMgc3RyaW5nKVxuICAgICAgICB0aGlzLnJlcGx5KHsgaWQsIG9rOiB0cnVlLCByZXN1bHQgfSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSAoZXJyIGFzIHsgcmVzcG9uc2U/OiB7IHN0YXR1cz86IG51bWJlciB9IH0pLnJlc3BvbnNlPy5zdGF0dXNcbiAgICAgICAgdGhpcy5yZXBseSh7IGlkLCBvazogZmFsc2UsIGVycm9yOiB7IG1lc3NhZ2U6IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiAnVGhlIHByaW50ZXIgcmVmdXNlZCB0aGF0LicsIHN0YXR1cyB9IH0pXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKHJlcS5raW5kID09PSAndmVyYicpIHtcbiAgICAgIGNvbnN0IHZlcmIgPSByZWFkVmVyYihyZXEpXG4gICAgICBpZiAoIXZlcmIpIHJldHVybiB0aGlzLnJlZnVzZShpZCwgJ21hbGZvcm1lZCB2ZXJiJylcbiAgICAgIGNvbnN0IHdoeSA9IHRoaXMuaG9zdC52ZXJiKHZlcmIpXG4gICAgICBpZiAod2h5KSB0aGlzLnJlcGx5KHsgaWQsIG9rOiBmYWxzZSwgZXJyb3I6IHsgbWVzc2FnZTogd2h5LCBzdGF0dXM6IDQwOSB9IH0pXG4gICAgICBlbHNlIHRoaXMucmVwbHkoeyBpZCwgb2s6IHRydWUsIHJlc3VsdDogbnVsbCB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChyZXEua2luZCA9PT0gJ25hdmlnYXRlJykgcmV0dXJuIHRoaXMubmF2aWdhdGUoaWQsIHJlcSlcbiAgICB0aGlzLnJlZnVzZShpZCwgJ3Vua25vd24gcmVxdWVzdCcpXG4gIH1cblxuICBwcml2YXRlIHB1c2ggKCkge1xuICAgIGlmICh0aGlzLnZlcnNpb24gPCAyIHx8ICF0aGlzLnBvcnQpIHJldHVyblxuICAgIGNvbnN0IHN1cHBvcnRlZCA9IHRoaXMuc3VwcG9ydCAhPT0gJ25vJ1xuICAgIHRoaXMucG9ydC5wb3N0TWVzc2FnZSh7IGtpbmQ6ICdwYW5lbC1zdGF0ZScsIHN1cHBvcnRlZCwgc3RhdGU6IHN1cHBvcnRlZCA/IHRoaXMucGFuZWwgOiBudWxsIH0pXG4gIH1cblxuICBwcml2YXRlIGFkb3B0IChzdGF0ZTogUGFuZWxTdGF0ZSkge1xuICAgIHRoaXMucGFuZWwgPSBzdGF0ZVxuICAgIHRoaXMuc3VwcG9ydCA9ICd5ZXMnXG4gICAgdGhpcy5ldmVudHMub25TdXBwb3J0Py4odHJ1ZSlcbiAgICB0aGlzLnB1c2goKVxuICB9XG5cbiAgcHJpdmF0ZSB1bnN1cHBvcnRlZCAoKSB7XG4gICAgdGhpcy5wYW5lbCA9IG51bGxcbiAgICBpZiAodGhpcy5zdXBwb3J0ID09PSAnbm8nKSByZXR1cm5cbiAgICB0aGlzLnN1cHBvcnQgPSAnbm8nXG4gICAgdGhpcy5ldmVudHMub25TdXBwb3J0Py4oZmFsc2UpXG4gICAgdGhpcy5wdXNoKClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyB0aGUgcGFuZWwgc3RhdGUgZnJvbSB0aGUgcHJpbnRlciBhbmQgcGFzc2VzIGl0IG9uLiBBIHByaW50ZXIgd2l0aG91dCB0aGUgZW5kcG9pbnQgKDQwNCBvciA0MDUpIGlzXG4gICAqIHJlbWVtYmVyZWQgYXMgaGF2aW5nIG5vIGxpdmUgc2NyZWVuOyBhIHJlYWQgdGhhdCBmYWlscyBhbnkgb3RoZXIgd2F5IGNoYW5nZXMgbm90aGluZyBhbmQgaXMgdHJpZWQgYWdhaW4uXG4gICAqIE9uZSByZWFkIGF0IGEgdGltZS5cbiAgICovXG4gIHN5bmNQYW5lbCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmhvc3QucGFuZWxHZXQpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIHRoaXMuc3luY2luZyA/Pz0gKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuaG9zdC5wYW5lbEdldCEoKVxuICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDA0IHx8IHJlcy5zdGF0dXMgPT09IDQwNSkgcmV0dXJuIHRoaXMudW5zdXBwb3J0ZWQoKVxuICAgICAgICBpZiAocmVzLnN0YXR1cyA8IDIwMCB8fCByZXMuc3RhdHVzID49IDMwMCkgcmV0dXJuXG4gICAgICAgIGNvbnN0IGJvZHkgPSByZXMuYm9keSBhcyB7IHJlc3VsdD86IHVua25vd24gfSB8IG51bGxcbiAgICAgICAgY29uc3Qgc3RhdGUgPSByZWFkUGFuZWxTdGF0ZShib2R5ICYmIHR5cGVvZiBib2R5ID09PSAnb2JqZWN0JyAmJiAncmVzdWx0JyBpbiBib2R5ID8gYm9keS5yZXN1bHQgOiBib2R5KVxuICAgICAgICAvLyBUaGUgc2FtZSBzY3JlZW4gYXMgbGFzdCB0aW1lIChhIHBvbGwgd2l0aCBub3RoaW5nIG5ldyk6IG5vdGhpbmcgdG8gcHVzaC5cbiAgICAgICAgaWYgKHN0YXRlICYmICEodGhpcy5zdXBwb3J0ID09PSAneWVzJyAmJiB0aGlzLnBhbmVsICYmIHN0YXRlLnNlcSA9PT0gdGhpcy5wYW5lbC5zZXEpKSB0aGlzLmFkb3B0KHN0YXRlKVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIE5vIGFuc3dlcjoga2VlcCB3aGF0IHdlIGhhdmUuXG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLnN5bmNpbmcgPSBudWxsXG4gICAgICB9XG4gICAgfSkoKVxuICAgIHJldHVybiB0aGlzLnN5bmNpbmdcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlcidzIG93biBub3RpZmljYXRpb24gb2YgYSBuZXcgcGFuZWwgc3RhdGU6IGl0IGlzIG9yZGVyZWQsIHNvIGEgZGlmZmVyZW50IHNlcSBpcyB0aGUgbmV3ZXIgb25lLiAqL1xuICBwYW5lbE5vdGlmeSAocmF3OiB1bmtub3duKSB7XG4gICAgY29uc3Qgc3RhdGUgPSByZWFkUGFuZWxTdGF0ZShyYXcpXG4gICAgaWYgKCFzdGF0ZSB8fCB0aGlzLnN1cHBvcnQgPT09ICdubycpIHJldHVyblxuICAgIGlmICh0aGlzLnBhbmVsICYmIHN0YXRlLnNlcSA9PT0gdGhpcy5wYW5lbC5zZXEpIHJldHVyblxuICAgIHRoaXMuYWRvcHQoc3RhdGUpXG4gIH1cblxuICAvKiogV2hpbGUgdGhlIHdlYnNvY2tldCBpcyBkb3duLCBhc2sgZm9yIHRoZSBzdGF0ZSBldmVyeSBQQU5FTF9QT0xMX01TOyBzdG9wIHdoZW4gaXQgaXMgYmFjay4gKi9cbiAgc2V0UG9sbGluZyAob246IGJvb2xlYW4pIHtcbiAgICB0aGlzLnBvbGxXYW50ZWQgPSBvblxuICAgIC8vIEEgdmVyc2lvbiAxIGVtYmVkIChvciBub25lIHlldCkgaGFzIG5vIHVzZSBmb3IgdGhlIHN0YXRlOiBuZXZlciByZWFkIGl0IGZvciBvbmUuXG4gICAgaWYgKCFvbiB8fCB0aGlzLnZlcnNpb24gPCAyIHx8IHRoaXMuc3VwcG9ydCA9PT0gJ25vJyB8fCAhdGhpcy5ob3N0LnBhbmVsR2V0KSB7XG4gICAgICBpZiAodGhpcy5wb2xsVGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy5wb2xsVGltZXIpXG4gICAgICB0aGlzLnBvbGxUaW1lciA9IG51bGxcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAodGhpcy5wb2xsVGltZXIpIHJldHVyblxuICAgIHRoaXMucG9sbFRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4geyB0aGlzLnN5bmNQYW5lbCgpLmNhdGNoKCgpID0+IHVuZGVmaW5lZCkgfSwgUEFORUxfUE9MTF9NUylcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZW1iZWQgYXNrcyB0aGUgcGFuZWwgdG8gbW92ZS4gU2VudCB3aXRoIHRoZSBzZXEgQ29udHJvbCBsYXN0IHNhdywgc28gdGhlIHByaW50ZXIgY2FuIHRlbGwgYSBzdGFsZSB2aWV3XG4gICAqICg0MDk6IHJlLXJlYWQgYW5kIHB1c2ggdGhlIHRydXRoKSBhbmQgY2FuIHJlZnVzZSB3aGlsZSBhIG1vZGFsIGlzIG9wZW4gb3IgdGhlIHBhbmVsIGlzIGJ1c3kgKDQyMywgaW4gd29yZHMpLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBuYXZpZ2F0ZSAoaWQ6IG51bWJlciwgcmF3OiB1bmtub3duKSB7XG4gICAgY29uc3QgZmFpbCA9IChtZXNzYWdlOiBzdHJpbmcsIHN0YXR1czogbnVtYmVyKSA9PiB0aGlzLnJlcGx5KHsgaWQsIG9rOiBmYWxzZSwgZXJyb3I6IHsgbWVzc2FnZSwgc3RhdHVzIH0gfSlcbiAgICBjb25zdCBuYXYgPSByZWFkTmF2aWdhdGUocmF3KVxuICAgIGlmICghbmF2KSByZXR1cm4gdGhpcy5yZWZ1c2UoaWQsICdtYWxmb3JtZWQgbmF2aWdhdGUnKVxuICAgIGlmICghdGhpcy5ob3N0LnBhbmVsUG9zdCB8fCB0aGlzLnN1cHBvcnQgPT09ICdubycpIHJldHVybiBmYWlsKCdMaXZlIHNjcmVlbiBuZWVkcyBhIHByaW50ZXIgdXBkYXRlLicsIDQwNClcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5ob3N0LnBhbmVsUG9zdCh7IC4uLm5hdiwgLi4uKHRoaXMucGFuZWwgPyB7IGlmX3NlcTogdGhpcy5wYW5lbC5zZXEgfSA6IHt9KSB9KVxuICAgICAgaWYgKHJlcy5zdGF0dXMgPj0gMjAwICYmIHJlcy5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgLy8gVGhlIHByaW50ZXIgYW5zd2VycyAyMDAge3NlcX07IHRoZSBuZXcgc2NyZWVuIGl0c2VsZiBhcnJpdmVzIGFzIHRoZSBzdGF0ZSBub3RpZmljYXRpb24uXG4gICAgICAgIGNvbnN0IGJvZHkgPSByZXMuYm9keSBhcyB7IHJlc3VsdD86IHVua25vd24gfSB8IG51bGxcbiAgICAgICAgY29uc3Qgb3V0ID0gKGJvZHkgJiYgdHlwZW9mIGJvZHkgPT09ICdvYmplY3QnICYmICdyZXN1bHQnIGluIGJvZHkgPyBib2R5LnJlc3VsdCA6IGJvZHkpIGFzIHsgc2VxPzogdW5rbm93biB9IHwgbnVsbFxuICAgICAgICByZXR1cm4gdGhpcy5yZXBseSh7IGlkLCBvazogdHJ1ZSwgcmVzdWx0OiB7IHNlcTogdHlwZW9mIG91dD8uc2VxID09PSAnbnVtYmVyJyA/IG91dC5zZXEgOiBudWxsIH0gfSlcbiAgICAgIH1cbiAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zeW5jUGFuZWwoKVxuICAgICAgICByZXR1cm4gZmFpbChcIlRoZSBwcmludGVyJ3Mgc2NyZWVuIGhhcyBtb3ZlZCBvbi5cIiwgNDA5KVxuICAgICAgfVxuICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQyMykge1xuICAgICAgICAvLyBUaGUgc3RhdGUgdGhlIHByaW50ZXIgd2FzIGluIHdoZW4gaXQgc2FpZCBubzogYSBub3RpZmljYXRpb24gbWF5IG5vdCBoYXZlIHJlYWNoZWQgdXMgeWV0LlxuICAgICAgICBhd2FpdCB0aGlzLnN5bmNQYW5lbCgpXG4gICAgICAgIHJldHVybiBmYWlsKGJ1c3lSZWFzb24odGhpcy5wYW5lbCksIDQyMylcbiAgICAgIH1cbiAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDQgfHwgcmVzLnN0YXR1cyA9PT0gNDA1KSB7XG4gICAgICAgIHRoaXMudW5zdXBwb3J0ZWQoKVxuICAgICAgICByZXR1cm4gZmFpbCgnTGl2ZSBzY3JlZW4gbmVlZHMgYSBwcmludGVyIHVwZGF0ZS4nLCA0MDQpXG4gICAgICB9XG4gICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNTA0KSByZXR1cm4gZmFpbChcIlRoZSBwcmludGVyJ3Mgc2NyZWVuIGlzbid0IHJlc3BvbmRpbmdcIiwgNTA0KVxuICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMyAmJiAocmVzLmJvZHkgYXMgeyByZWFzb24/OiB1bmtub3duIH0gfCBudWxsKT8ucmVhc29uID09PSAnb3duZXJfb25seScpIHJldHVybiBmYWlsKFwiT25seSB0aGUgcHJpbnRlcidzIG93bmVyIGNhbiBvcGVuIHRoYXQgc2NyZWVuXCIsIDQwMylcbiAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDEgfHwgcmVzLnN0YXR1cyA9PT0gNDAzKSByZXR1cm4gZmFpbChPTl9QUklOVEVSLCByZXMuc3RhdHVzKVxuICAgICAgcmV0dXJuIGZhaWwoJ1RoZSBwcmludGVyIHdvdWxkIG5vdCBjaGFuZ2Ugc2NyZWVuLicsIHJlcy5zdGF0dXMpXG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFpbChcIlRoZSBwcmludGVyJ3Mgc2NyZWVuIGlzbid0IHJlc3BvbmRpbmdcIiwgNTA0KVxuICAgIH1cbiAgfVxuXG4gIC8qKiBzdWJzY3JpYmUgYW5kIGlkZW50aWZ5LCBhbnN3ZXJlZCBmcm9tIHdoYXQgQ29udHJvbCBhbHJlYWR5IGhhcy4gKi9cbiAgcHJpdmF0ZSBsb2NhbCAobWV0aG9kOiBzdHJpbmcsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdW5rbm93biB7XG4gICAgaWYgKG1ldGhvZCA9PT0gJ3NlcnZlci5jb25uZWN0aW9uLmlkZW50aWZ5JykgcmV0dXJuIHsgY29ubmVjdGlvbl9pZDogdGhpcy5ob3N0LmNvbm5lY3Rpb25JZCgpIH1cbiAgICBjb25zdCBvYmplY3RzID0gcGFyYW1zPy5vYmplY3RzXG4gICAgY29uc3Qgc3RhdHVzID0gdGhpcy5ob3N0LnN0YXR1cygpXG4gICAgLy8gQSBzdWJzY3JpYmUgbXVzdCBuYW1lIGl0cyBvYmplY3RzOiBcImV2ZXJ5dGhpbmdcIiBpcyBub3QgcGFzc2VkIG9uLlxuICAgIGlmICghb2JqZWN0cyB8fCB0eXBlb2Ygb2JqZWN0cyAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShvYmplY3RzKSkgcmV0dXJuIHsgZXZlbnR0aW1lOiBEYXRlLm5vdygpIC8gMTAwMCwgc3RhdHVzOiB7fSB9XG4gICAgY29uc3QgbmFtZXMgPSBPYmplY3Qua2V5cyhvYmplY3RzIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVxuICAgIHRoaXMud2F0Y2hlZCA9IG5ldyBTZXQobmFtZXMpXG4gICAgY29uc3QgcGlja2VkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9XG4gICAgZm9yIChjb25zdCBuIG9mIG5hbWVzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXR1cywgbikpIHBpY2tlZFtuXSA9IHN0YXR1c1tuXVxuICAgIHJldHVybiB7IGV2ZW50dGltZTogRGF0ZS5ub3coKSAvIDEwMDAsIHN0YXR1czogcGlja2VkIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBIE1vb25yYWtlciBub3RpZmljYXRpb24gQ29udHJvbCByZWNlaXZlZCwgcGFzc2VkIG9uLiBBIHN0YXR1cyB1cGRhdGVcbiAgICogY2FycmllcyBvbmx5IHRoZSBvYmplY3RzIHRoZSBlbWJlZCBzdWJzY3JpYmVkIHRvLCBhbmQgbm90aGluZyBiZWZvcmUgaXQgaGFzLlxuICAgKi9cbiAgbm90aWZ5IChtZXRob2Q6IHN0cmluZywgcGFyYW1zOiB1bmtub3duKSB7XG4gICAgaWYgKCF0aGlzLnBvcnQgfHwgdGhpcy53YXRjaGVkID09PSB1bmRlZmluZWQgfHwgIU5PVElGWV9GT1JXQVJELmhhcyhtZXRob2QpKSByZXR1cm5cbiAgICBpZiAobWV0aG9kID09PSAnbm90aWZ5X3N0YXR1c191cGRhdGUnKSB7XG4gICAgICBjb25zdCBwID0gcGFyYW1zIGFzIFtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbnVtYmVyP10gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICAgY29uc3QgdXBkYXRlID0gQXJyYXkuaXNBcnJheShwKSA/IHBbMF0gOiBwXG4gICAgICBjb25zdCBwaWNrZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge31cbiAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHVwZGF0ZSA/PyB7fSkpIGlmICh0aGlzLndhdGNoZWQuaGFzKGspKSBwaWNrZWRba10gPSB2XG4gICAgICBpZiAoIU9iamVjdC5rZXlzKHBpY2tlZCkubGVuZ3RoKSByZXR1cm5cbiAgICAgIHRoaXMucG9ydC5wb3N0TWVzc2FnZSh7IGtpbmQ6ICdub3RpZnknLCBtZXRob2QsIHBhcmFtczogW3BpY2tlZCwgQXJyYXkuaXNBcnJheShwKSA/IHBbMV0gOiB1bmRlZmluZWRdIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5wb3J0LnBvc3RNZXNzYWdlKHsga2luZDogJ25vdGlmeScsIG1ldGhvZCwgcGFyYW1zIH0pXG4gIH1cblxuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLnNldFBvbGxpbmcoZmFsc2UpXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLm9uV2luZG93TWVzc2FnZSlcbiAgICB0aGlzLnBvcnQ/LmNsb3NlKClcbiAgICB0aGlzLnBvcnQgPSBu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