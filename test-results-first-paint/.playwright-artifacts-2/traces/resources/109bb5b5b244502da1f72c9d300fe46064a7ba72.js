import _Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Globals } from "/src/globals.ts";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { camelCase, mergeWith } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import { httpClientActions } from "/src/api/httpClientActions.ts";
import {
  PRINTER_SOCKET_OPEN
} from "/src/services/managed-transport/index.ts";
import axios from "/.vite-e2e/4291/deps/axios.js?v=9b9fafc7";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { headStatus } from "/src/services/control/safe-move.ts";
const MAX_RECONNECT_DELAY_MS = 3e4;
const TOKEN_TIMEOUT_MS = 5e3;
function tokenNotOffered(status) {
  return status === 403 || status === 404;
}
export class WebSocketClient {
  url = "";
  connection = null;
  reconnectEnabled = false;
  /** The first retry's wait. Each failed try doubles it, up to MAX_RECONNECT_DELAY_MS. */
  reconnectInterval = 1e3;
  /** Tries since the last connection opened. Fluidd never gives up on its own. */
  reconnectCount = 0;
  logPrefix = "[WEBSOCKET]";
  requests = [];
  /** The next JSON-RPC id. Starts somewhere random so a reload doesn't reuse a recent one. */
  nextRequestId = 1e4 + Math.floor(Math.random() * 8e4);
  store = null;
  pingTimeout;
  deadTimeout;
  cache = null;
  openedConnections = /* @__PURE__ */ new WeakSet();
  transportReconnect = null;
  /** Set while Fluidd closes the socket itself, so that close is not retried. */
  closing = false;
  retryTimer = null;
  retryAction = null;
  /** When the waiting retry runs (Date.now() ms), or null when none is waiting. */
  retryAt = null;
  /**
   * Counts every connect, close and adopted socket. A connect still waiting
   * for its token when another printer's socket was adopted or Fluidd closed
   * the connection must not open a socket to its old address afterwards.
   */
  attempt = 0;
  constructor(options) {
    this.url = options.url;
    this.reconnectEnabled = options.reconnectEnabled || false;
    this.reconnectInterval = options.reconnectInterval || 1e3;
    this.store = options.store ? options.store : null;
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.retryNow());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") this.retryNow();
      });
    }
  }
  /**
   * Called on every message. A quiet socket is not a closed one: after
   * SOCKET_PING_INTERVAL with no message the page says it is waiting, and
   * keeps the dashboard. Only after SOCKET_DEAD_AFTER is the connection given
   * up and replaced. Moonraker sends something every second, so silence that
   * long means the path is gone.
   */
  pong() {
    if (!this.store.state.socket.disconnecting && // We arent about to disonnect and..
    !this.store.state.files.download) {
      if (!this.store.state.socket.open) this.store.commit("socket/setSocketOpen", true);
      if (this.store.state.socket.stalled) this.store.commit("socket/setSocketStalled", false);
      if (this.store.state.socket.connecting) this.store.dispatch("socket/onSocketConnecting", false);
    }
    this.armSilenceTimers();
  }
  /** Starts the clocks that notice a connection has gone quiet, from now. */
  armSilenceTimers() {
    clearTimeout(this.pingTimeout);
    clearTimeout(this.deadTimeout);
    const connection = this.connection;
    this.pingTimeout = setTimeout(() => {
      if (this.quietIsExpected()) return;
      consola.debug(`${this.logPrefix} No message for ${Globals.SOCKET_PING_INTERVAL} ms`);
      if (this.store) this.store.commit("socket/setSocketStalled", true);
    }, Globals.SOCKET_PING_INTERVAL);
    this.deadTimeout = setTimeout(() => {
      if (!connection || this.connection !== connection) return;
      if (this.quietIsExpected()) {
        this.armSilenceTimers();
        return;
      }
      consola.debug(`${this.logPrefix} No message for ${Globals.SOCKET_DEAD_AFTER} ms, replacing the connection`);
      this.giveUp(connection);
    }, Globals.SOCKET_DEAD_AFTER);
  }
  quietIsExpected() {
    return !this.store || this.store.state.socket.disconnecting || this.store.state.files.download;
  }
  /**
   * Treats a connection that stopped answering as closed now. A browser
   * WebSocket on a dead path can take minutes to report its close, so the
   * old one is closed in the background and its own close event ignored.
   */
  giveUp(connection) {
    this.onConnectionClose(connection, { code: 4e3, reason: "no messages", wasClean: false });
    connection.close();
  }
  close() {
    this.attempt++;
    this.purgeRequests();
    this.cancelRetry();
    clearTimeout(this.pingTimeout);
    clearTimeout(this.deadTimeout);
    if (this.connection) {
      this.closing = true;
      this.cache = null;
      this.connection.close();
      this.reconnectCount = 0;
    }
  }
  async connect(url) {
    if (url) this.url = url;
    const attempt = ++this.attempt;
    this.purgeRequests();
    const target = this.url;
    this.cache = null;
    this.closing = false;
    this.cancelRetry();
    let token;
    try {
      const response = await httpClientActions.accessOneshotTokenGet({ timeout: TOKEN_TIMEOUT_MS });
      token = response.data.result;
    } catch (error) {
      if (attempt !== this.attempt) return;
      const status = axios.isAxiosError(error) ? error.response?.status : void 0;
      if (status === 401) return;
      if (!tokenNotOffered(status)) {
        this.reconnect();
        return;
      }
      token = null;
    }
    if (attempt !== this.attempt || target !== this.url) return;
    if (this.store) this.store.dispatch("socket/onSocketConnecting", true);
    let socket;
    try {
      socket = new WebSocket(token === null ? this.url : `${this.url}?token=${token}`);
    } catch {
      this.reconnect();
      return;
    }
    this.bindConnection(socket);
  }
  /**
   * Bind a socket returned by an authorized printer transport. Event handlers
   * are installed before an already-open socket enters the normal open path.
   */
  adoptTransportSocket(connection, reconnect) {
    this.attempt++;
    this.purgeRequests();
    this.closing = false;
    this.cancelRetry();
    this.reconnectCount = 0;
    this.bindConnection(connection, reconnect ?? null);
  }
  /** Ends an adopted session without allowing its close event to reconnect. */
  releaseTransportSocket(closeConnection = true) {
    headStatus.fresh = false;
    this.attempt++;
    this.purgeRequests();
    this.cancelRetry();
    const connection = this.connection;
    this.connection = null;
    this.transportReconnect = null;
    this.cache = null;
    this.reconnectCount = 0;
    if (connection) {
      this.openedConnections.delete(connection);
      if (closeConnection) connection.close();
    }
  }
  bindConnection(connection, reconnect = null) {
    this.connection = connection;
    this.transportReconnect = reconnect;
    connection.addEventListener("open", () => this.onConnectionOpen(connection));
    connection.addEventListener("close", (event) => this.onConnectionClose(connection, event));
    connection.addEventListener("error", (event) => this.onConnectionError(connection, event));
    connection.addEventListener("message", (event) => this.onConnectionMessage(connection, event));
    if (connection.readyState === PRINTER_SOCKET_OPEN) {
      this.onConnectionOpen(connection);
    }
  }
  onConnectionOpen(connection) {
    if (this.connection !== connection || this.openedConnections.has(connection)) return;
    this.openedConnections.add(connection);
    this.reconnectCount = 0;
    this.armSilenceTimers();
    if (this.store) {
      this.store.dispatch("socket/onSocketConnecting", false);
      this.store.dispatch("socket/onSocketOpen", true);
    }
  }
  /**
   * Any close Fluidd did not ask for is retried, clean or not: Moonraker
   * closes cleanly when it reaps a socket that stopped answering, and over
   * Iroh every close from the printer arrives as clean. The store hears a
   * close Fluidd asked for as clean and any other as not.
   */
  onConnectionClose(connection, event) {
    if (this.connection !== connection) return;
    consola.debug(`${this.logPrefix} Connection closed:`, event);
    clearTimeout(this.pingTimeout);
    clearTimeout(this.deadTimeout);
    this.purgeRequests();
    const asked = this.closing;
    this.closing = false;
    if (this.store) {
      if (this.store.state.socket.stalled) this.store.commit("socket/setSocketStalled", false);
      this.store.dispatch("socket/onSocketClose", { code: event.code, reason: event.reason, wasClean: asked });
    }
    if (asked) return;
    if (this.transportReconnect) {
      this.reconnectTransport(this.transportReconnect);
    } else {
      this.reconnect();
    }
  }
  onConnectionError(connection, event) {
    if (this.connection !== connection) return;
    consola.error(`${this.logPrefix} Connection error:`, event);
    if (this.store) this.store.dispatch("socket/onSocketError", event);
  }
  onConnectionMessage(connection, message) {
    if (this.connection !== connection) return;
    const d = JSON.parse(message.data);
    let request;
    const requestIndex = this.requests.findIndex((request2) => request2.id === d.id);
    if (requestIndex > -1) {
      request = this.requests[requestIndex];
      this.requests.splice(requestIndex, 1);
    }
    if (request?.requestContext?.connectionAttempt !== void 0 && request.requestContext.connectionAttempt !== this.attempt) return;
    if (this.store && request && request.wait && request.wait.length) {
      this.store.commit("wait/setRemoveWait", request.wait);
    }
    this.pong();
    if (d.error) {
      if (request) {
        Object.defineProperty(d.error, "__request__", { enumerable: false, value: request });
      }
      consola.debug(`${this.logPrefix} Response error:`, d.error);
      if (this.store) this.store.dispatch("socket/onSocketError", d.error);
      request?.resolve?.(void 0);
      return;
    }
    if (request) {
      let result = d.result ? d.result : d.params;
      if (typeof result === "string") result = { result };
      Object.defineProperty(result, "__request__", { enumerable: false, value: request });
      consola.debug(`${this.logPrefix} Response:`, result);
      if (request.dispatch && this.store) this.store.dispatch(request.dispatch, request.requestContext ? { payload: result, requestContext: request.requestContext } : result);
      if (request.commit && this.store) this.store.commit(request.commit, result);
      request.resolve?.(result);
    } else if (d.params && d.params[0]) {
      const [params, eventtime] = d.params;
      if (d.method !== "notify_status_update") {
        if (this.store) this.store.dispatch("socket/" + camelCase(d.method), params);
      } else {
        for (const key of ["motion_report"]) {
          if (this.store && key in params) {
            this.store.dispatch("printer/onFastNotifyStatusUpdate", { key, payload: params[key] }, { root: true });
            delete params[key];
          }
        }
        const timestamp = eventtime ? eventtime * 1e3 : Date.now();
        this.cache = !this.cache ? { timestamp, params } : { timestamp: this.cache.timestamp, params: mergeWith(this.cache.params, params, (dest, src) => Array.isArray(dest) ? src : void 0) };
        if (timestamp - this.cache.timestamp >= 1e3) {
          if (this.store) this.store.dispatch("socket/" + camelCase(d.method), this.cache.params);
          this.cache = { timestamp, params: {} };
        }
      }
    } else {
      if (this.store) this.store.dispatch("socket/" + camelCase(d.method));
    }
  }
  /** The wait before the next try: doubling from reconnectInterval, capped, with jitter. */
  nextDelay() {
    const base = Math.min(MAX_RECONNECT_DELAY_MS, this.reconnectInterval * 2 ** Math.min(this.reconnectCount, 16));
    return Math.round(base * (0.8 + Math.random() * 0.4));
  }
  scheduleRetry(action) {
    this.cancelRetry();
    const delay = this.nextDelay();
    this.reconnectCount += 1;
    consola.debug(`${this.logPrefix} Reconnecting in ${delay}`);
    this.retryAction = action;
    this.retryAt = Date.now() + delay;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.retryAction = null;
      this.retryAt = null;
      action();
    }, delay);
  }
  cancelRetry() {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.retryAction = null;
    this.retryAt = null;
  }
  /** Forget unanswered RPCs and their loading indicators when a session ends. */
  purgeRequests() {
    if (this.store) {
      for (const request of this.requests) {
        if (request.wait?.length) this.store.commit("wait/setRemoveWait", request.wait);
      }
    }
    for (const request of this.requests) request.resolve?.(void 0);
    this.requests = [];
  }
  /** Runs a waiting retry now, from the first step of the backoff. */
  retryNow() {
    const action = this.retryAction;
    if (!action) return;
    this.cancelRetry();
    this.reconnectCount = 0;
    action();
  }
  /** When the waiting try to reconnect runs (Date.now() ms), or null when none is waiting. */
  get nextRetryAt() {
    return this.retryAt;
  }
  /** Whether a try to reconnect is waiting for its turn. */
  get retryPending() {
    return this.retryAction !== null;
  }
  reconnectTransport(reconnect) {
    this.connection = null;
    this.scheduleRetry(async () => {
      if (this.transportReconnect !== reconnect) return;
      try {
        const connection = await reconnect();
        if (this.transportReconnect === reconnect) {
          this.bindConnection(connection, reconnect);
        } else {
          connection.close();
        }
      } catch (_error) {
        if (this.transportReconnect === reconnect) this.reconnectTransport(reconnect);
      }
    });
  }
  reconnect() {
    this.connection = null;
    if (!this.reconnectEnabled) {
      if (this.store) this.store.dispatch("socket/onSocketConnecting", false);
      return;
    }
    this.scheduleRetry(() => {
      this.connect();
    });
  }
  /**
   * Sends data TO the socket
   * @param method
   * @param params
   */
  emit(method, options) {
    if (this.store.state.socket.disconnecting || this.store.state.socket.connecting) {
      consola.debug(`${this.logPrefix} Socket emit denied, in disconnecting state:`, method, options);
      return;
    }
    if (this.connection?.readyState === PRINTER_SOCKET_OPEN) {
      const id = this.nextRequestId++;
      const packet = {
        id,
        method,
        jsonrpc: "2.0"
      };
      const request = {
        id,
        method
      };
      if (options && options.wait) {
        request.wait = options.wait;
        if (this.store) this.store.dispatch("wait/addWait", options.wait);
      }
      if (options && options.params) {
        packet.params = options.params;
        request.params = options.params;
      }
      if (options && options.dispatch) request.dispatch = options.dispatch;
      if (options?.captureContext && this.store) {
        request.requestContext = {
          apiUrl: this.store.state.config.apiUrl,
          connectionId: this.store.state.socket.connectionId,
          printerId: cloudState.activePrinterId,
          connectionAttempt: this.attempt
        };
      }
      if (options && options.commit) request.commit = options.commit;
      const response = new Promise((resolve) => {
        request.resolve = resolve;
      });
      this.requests.push(request);
      this.connection.send(JSON.stringify(packet));
      return response;
    } else {
      consola.debug(`${this.logPrefix} Not ready, or closed.`, method, options, this.connection?.readyState);
      return Promise.resolve(void 0);
    }
  }
}
export const SocketPlugin = {
  install(Vue, options) {
    if (options?.url == null || options.store == null) {
      throw new Error("options required");
    }
    const socket = new WebSocketClient(options);
    Vue.prototype.$socket = socket;
    Vue.$socket = socket;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvY2tldENsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBsaW5lcy1iZXR3ZWVuLWNsYXNzLW1lbWJlcnMgKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucyAqL1xuLyogZXNsaW50LWRpc2FibGUgYXJyYXktY2FsbGJhY2stcmV0dXJuICovXG5cbi8qKlxuICogVGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vRGltYW5Wb3Jvc2gvdnVlLWpzb24tcnBjLXdlYnNvY2tldC9ibG9iL21hc3Rlci9zcmMvd3NDbGllbnQuanNcbiAqIGFuZCByZWZhY3RvcmVkLlxuICovXG5pbXBvcnQgX1Z1ZSBmcm9tICd2dWUnXG5pbXBvcnQgeyBHbG9iYWxzIH0gZnJvbSAnQC9nbG9iYWxzJ1xuaW1wb3J0IHsgY29uc29sYSB9IGZyb20gJ2NvbnNvbGEnXG5pbXBvcnQgeyBjYW1lbENhc2UsIG1lcmdlV2l0aCB9IGZyb20gJ2xvZGFzaC1lcydcbmltcG9ydCB7IGh0dHBDbGllbnRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvaHR0cENsaWVudEFjdGlvbnMnXG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnQC9zdG9yZS90eXBlcydcbmltcG9ydCB7XG4gIFBSSU5URVJfU09DS0VUX09QRU4sXG4gIHR5cGUgUHJpbnRlclNvY2tldFxufSBmcm9tICdAL3NlcnZpY2VzL21hbmFnZWQtdHJhbnNwb3J0J1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJ1xuaW1wb3J0IHsgY2xvdWRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCB7IGhlYWRTdGF0dXMgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvc2FmZS1tb3ZlJ1xuXG4vKiogVGhlIGxvbmdlc3Qgd2FpdCBiZXR3ZWVuIHR3byB0cmllcyB0byByZWNvbm5lY3QuICovXG5jb25zdCBNQVhfUkVDT05ORUNUX0RFTEFZX01TID0gMzBfMDAwXG5cbi8qKiBIb3cgbG9uZyB0aGUgb25lLXNob3QgdG9rZW4gcmVxdWVzdCBtYXkgdGFrZSBiZWZvcmUgdGhlIHRyeSBjb3VudHMgYXMgZmFpbGVkLiAqL1xuY29uc3QgVE9LRU5fVElNRU9VVF9NUyA9IDVfMDAwXG5cbi8qKlxuICogVGhlIHRva2VuIGVuZHBvaW50IHNhaWQgdGhlcmUgaXMgbm8gb25lLXNob3QgdG9rZW4gZm9yIHRoaXMgY2FsbGVyLCByYXRoZXJcbiAqIHRoYW4gdGhhdCB0aGUgY2FsbGVyIG11c3Qgc2lnbiBpbiAoNDAxKS4gQmVoaW5kIHRoZSBtdW9uLWxpbmsgQmx1ZXRvb3RoXG4gKiBicmlkZ2UgdGhlIHByaW50ZXIgcmVmdXNlcyBgL2FjY2Vzcy9vbmVzaG90X3Rva2VuYCBmb3IgZXZlcnkgcm9sZSAoNDAzKTpcbiAqIHRoZSBsaW5rIGF1dGhlbnRpY2F0ZXMgdGhlIHNlc3Npb24sIHNvIHRoZSBzb2NrZXQgb3BlbnMgd2l0aG91dCBvbmUuIEFcbiAqIE1vb25yYWtlciB3aXRoIG5vIGF1dGhvcml6YXRpb24gY29tcG9uZW50IGFuc3dlcnMgNDA0IGFuZCBuZWVkcyBubyB0b2tlblxuICogZWl0aGVyLiBUaGUgcHJpbnRlciBzdGlsbCBkZWNpZGVzIHdoZXRoZXIgdGhlIHNvY2tldCBtYXkgb3Blbi5cbiAqL1xuZnVuY3Rpb24gdG9rZW5Ob3RPZmZlcmVkIChzdGF0dXM6IG51bWJlciB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc3RhdHVzID09PSA0MDMgfHwgc3RhdHVzID09PSA0MDRcbn1cblxuZXhwb3J0IGNsYXNzIFdlYlNvY2tldENsaWVudCB7XG4gIHVybCA9ICcnXG4gIGNvbm5lY3Rpb246IFByaW50ZXJTb2NrZXQgfCBudWxsID0gbnVsbFxuICByZWNvbm5lY3RFbmFibGVkID0gZmFsc2VcbiAgLyoqIFRoZSBmaXJzdCByZXRyeSdzIHdhaXQuIEVhY2ggZmFpbGVkIHRyeSBkb3VibGVzIGl0LCB1cCB0byBNQVhfUkVDT05ORUNUX0RFTEFZX01TLiAqL1xuICByZWNvbm5lY3RJbnRlcnZhbCA9IDEwMDBcbiAgLyoqIFRyaWVzIHNpbmNlIHRoZSBsYXN0IGNvbm5lY3Rpb24gb3BlbmVkLiBGbHVpZGQgbmV2ZXIgZ2l2ZXMgdXAgb24gaXRzIG93bi4gKi9cbiAgcmVjb25uZWN0Q291bnQgPSAwXG4gIGxvZ1ByZWZpeCA9ICdbV0VCU09DS0VUXSdcbiAgcmVxdWVzdHM6IEFycmF5PFJlcXVlc3Q+ID0gW11cbiAgLyoqIFRoZSBuZXh0IEpTT04tUlBDIGlkLiBTdGFydHMgc29tZXdoZXJlIHJhbmRvbSBzbyBhIHJlbG9hZCBkb2Vzbid0IHJldXNlIGEgcmVjZW50IG9uZS4gKi9cbiAgcHJpdmF0ZSBuZXh0UmVxdWVzdElkID0gMTAwMDAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA4MDAwMClcbiAgc3RvcmU6IGFueSB8IG51bGwgPSBudWxsXG4gIHBpbmdUaW1lb3V0OiBhbnlcbiAgZGVhZFRpbWVvdXQ6IGFueVxuICBjYWNoZTogQ2FjaGVkUGFyYW1zIHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSByZWFkb25seSBvcGVuZWRDb25uZWN0aW9ucyA9IG5ldyBXZWFrU2V0PG9iamVjdD4oKVxuICBwcml2YXRlIHRyYW5zcG9ydFJlY29ubmVjdDogKCgpID0+IFByb21pc2U8UHJpbnRlclNvY2tldD4pIHwgbnVsbCA9IG51bGxcbiAgLyoqIFNldCB3aGlsZSBGbHVpZGQgY2xvc2VzIHRoZSBzb2NrZXQgaXRzZWxmLCBzbyB0aGF0IGNsb3NlIGlzIG5vdCByZXRyaWVkLiAqL1xuICBwcml2YXRlIGNsb3NpbmcgPSBmYWxzZVxuICBwcml2YXRlIHJldHJ5VGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSByZXRyeUFjdGlvbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcbiAgLyoqIFdoZW4gdGhlIHdhaXRpbmcgcmV0cnkgcnVucyAoRGF0ZS5ub3coKSBtcyksIG9yIG51bGwgd2hlbiBub25lIGlzIHdhaXRpbmcuICovXG4gIHByaXZhdGUgcmV0cnlBdDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgLyoqXG4gICAqIENvdW50cyBldmVyeSBjb25uZWN0LCBjbG9zZSBhbmQgYWRvcHRlZCBzb2NrZXQuIEEgY29ubmVjdCBzdGlsbCB3YWl0aW5nXG4gICAqIGZvciBpdHMgdG9rZW4gd2hlbiBhbm90aGVyIHByaW50ZXIncyBzb2NrZXQgd2FzIGFkb3B0ZWQgb3IgRmx1aWRkIGNsb3NlZFxuICAgKiB0aGUgY29ubmVjdGlvbiBtdXN0IG5vdCBvcGVuIGEgc29ja2V0IHRvIGl0cyBvbGQgYWRkcmVzcyBhZnRlcndhcmRzLlxuICAgKi9cbiAgcHJpdmF0ZSBhdHRlbXB0ID0gMFxuXG4gIGNvbnN0cnVjdG9yIChvcHRpb25zOiBTb2NrZXRQbHVnaW5PcHRpb25zKSB7XG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybFxuICAgIHRoaXMucmVjb25uZWN0RW5hYmxlZCA9IG9wdGlvbnMucmVjb25uZWN0RW5hYmxlZCB8fCBmYWxzZVxuICAgIHRoaXMucmVjb25uZWN0SW50ZXJ2YWwgPSBvcHRpb25zLnJlY29ubmVjdEludGVydmFsIHx8IDEwMDBcbiAgICB0aGlzLnN0b3JlID0gb3B0aW9ucy5zdG9yZSA/IG9wdGlvbnMuc3RvcmUgOiBudWxsXG4gICAgLy8gQSBuZXR3b3JrIG9yIGEgdGFiIGNvbWluZyBiYWNrIGlzIHRoZSBiZXN0IG1vbWVudCB0byB0cnkgYWdhaW46IGRvbid0XG4gICAgLy8gd2FpdCBvdXQgdGhlIGJhY2tvZmYuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgKCkgPT4gdGhpcy5yZXRyeU5vdygpKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsICgpID0+IHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSB0aGlzLnJldHJ5Tm93KClcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBvbiBldmVyeSBtZXNzYWdlLiBBIHF1aWV0IHNvY2tldCBpcyBub3QgYSBjbG9zZWQgb25lOiBhZnRlclxuICAgKiBTT0NLRVRfUElOR19JTlRFUlZBTCB3aXRoIG5vIG1lc3NhZ2UgdGhlIHBhZ2Ugc2F5cyBpdCBpcyB3YWl0aW5nLCBhbmRcbiAgICoga2VlcHMgdGhlIGRhc2hib2FyZC4gT25seSBhZnRlciBTT0NLRVRfREVBRF9BRlRFUiBpcyB0aGUgY29ubmVjdGlvbiBnaXZlblxuICAgKiB1cCBhbmQgcmVwbGFjZWQuIE1vb25yYWtlciBzZW5kcyBzb21ldGhpbmcgZXZlcnkgc2Vjb25kLCBzbyBzaWxlbmNlIHRoYXRcbiAgICogbG9uZyBtZWFucyB0aGUgcGF0aCBpcyBnb25lLlxuICAgKi9cbiAgcG9uZyAoKSB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuc3RvcmUuc3RhdGUuc29ja2V0LmRpc2Nvbm5lY3RpbmcgJiYgLy8gV2UgYXJlbnQgYWJvdXQgdG8gZGlzb25uZWN0IGFuZC4uXG4gICAgICAhdGhpcy5zdG9yZS5zdGF0ZS5maWxlcy5kb3dubG9hZCAvLyBXZSdyZSBub3QgaW4gdGhlIG1pZGRsZSBvZiBhIGRvd25sb2FkLlxuICAgICkge1xuICAgICAgLy8gTW9vbnJha2VyIHRhbGtzIHNldmVyYWwgdGltZXMgYSBzZWNvbmQ6IG9ubHkgYSBjaGFuZ2UgZ29lcyB0byB0aGUgc3RvcmUuXG4gICAgICBpZiAoIXRoaXMuc3RvcmUuc3RhdGUuc29ja2V0Lm9wZW4pIHRoaXMuc3RvcmUuY29tbWl0KCdzb2NrZXQvc2V0U29ja2V0T3BlbicsIHRydWUpXG4gICAgICBpZiAodGhpcy5zdG9yZS5zdGF0ZS5zb2NrZXQuc3RhbGxlZCkgdGhpcy5zdG9yZS5jb21taXQoJ3NvY2tldC9zZXRTb2NrZXRTdGFsbGVkJywgZmFsc2UpXG4gICAgICBpZiAodGhpcy5zdG9yZS5zdGF0ZS5zb2NrZXQuY29ubmVjdGluZykgdGhpcy5zdG9yZS5kaXNwYXRjaCgnc29ja2V0L29uU29ja2V0Q29ubmVjdGluZycsIGZhbHNlKVxuICAgIH1cbiAgICB0aGlzLmFybVNpbGVuY2VUaW1lcnMoKVxuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgY2xvY2tzIHRoYXQgbm90aWNlIGEgY29ubmVjdGlvbiBoYXMgZ29uZSBxdWlldCwgZnJvbSBub3cuICovXG4gIHByaXZhdGUgYXJtU2lsZW5jZVRpbWVycyAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucGluZ1RpbWVvdXQpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVhZFRpbWVvdXQpXG4gICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuY29ubmVjdGlvblxuICAgIHRoaXMucGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnF1aWV0SXNFeHBlY3RlZCgpKSByZXR1cm5cbiAgICAgIGNvbnNvbGEuZGVidWcoYCR7dGhpcy5sb2dQcmVmaXh9IE5vIG1lc3NhZ2UgZm9yICR7R2xvYmFscy5TT0NLRVRfUElOR19JTlRFUlZBTH0gbXNgKVxuICAgICAgaWYgKHRoaXMuc3RvcmUpIHRoaXMuc3RvcmUuY29tbWl0KCdzb2NrZXQvc2V0U29ja2V0U3RhbGxlZCcsIHRydWUpXG4gICAgfSwgR2xvYmFscy5TT0NLRVRfUElOR19JTlRFUlZBTClcbiAgICB0aGlzLmRlYWRUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoIWNvbm5lY3Rpb24gfHwgdGhpcy5jb25uZWN0aW9uICE9PSBjb25uZWN0aW9uKSByZXR1cm5cbiAgICAgIC8vIFF1aWV0IHdhcyBleHBlY3RlZCAoYSBkb3dubG9hZCwgYSByZXN0YXJ0IEZsdWlkZCBhc2tlZCBmb3IpOiBsb29rXG4gICAgICAvLyBhZ2FpbiBsYXRlciByYXRoZXIgdGhhbiBzdG9wIGxvb2tpbmcsIG9yIGEgc29ja2V0IHRoYXQgZGllcyBpbiB0aGVcbiAgICAgIC8vIG1lYW50aW1lIGlzIG5ldmVyIHJlcGxhY2VkLlxuICAgICAgaWYgKHRoaXMucXVpZXRJc0V4cGVjdGVkKCkpIHtcbiAgICAgICAgdGhpcy5hcm1TaWxlbmNlVGltZXJzKClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBjb25zb2xhLmRlYnVnKGAke3RoaXMubG9nUHJlZml4fSBObyBtZXNzYWdlIGZvciAke0dsb2JhbHMuU09DS0VUX0RFQURfQUZURVJ9IG1zLCByZXBsYWNpbmcgdGhlIGNvbm5lY3Rpb25gKVxuICAgICAgdGhpcy5naXZlVXAoY29ubmVjdGlvbilcbiAgICB9LCBHbG9iYWxzLlNPQ0tFVF9ERUFEX0FGVEVSKVxuICB9XG5cbiAgcHJpdmF0ZSBxdWlldElzRXhwZWN0ZWQgKCkge1xuICAgIHJldHVybiAhdGhpcy5zdG9yZSB8fCB0aGlzLnN0b3JlLnN0YXRlLnNvY2tldC5kaXNjb25uZWN0aW5nIHx8IHRoaXMuc3RvcmUuc3RhdGUuZmlsZXMuZG93bmxvYWRcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmVhdHMgYSBjb25uZWN0aW9uIHRoYXQgc3RvcHBlZCBhbnN3ZXJpbmcgYXMgY2xvc2VkIG5vdy4gQSBicm93c2VyXG4gICAqIFdlYlNvY2tldCBvbiBhIGRlYWQgcGF0aCBjYW4gdGFrZSBtaW51dGVzIHRvIHJlcG9ydCBpdHMgY2xvc2UsIHNvIHRoZVxuICAgKiBvbGQgb25lIGlzIGNsb3NlZCBpbiB0aGUgYmFja2dyb3VuZCBhbmQgaXRzIG93biBjbG9zZSBldmVudCBpZ25vcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBnaXZlVXAgKGNvbm5lY3Rpb246IFByaW50ZXJTb2NrZXQpIHtcbiAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKGNvbm5lY3Rpb24sIHsgY29kZTogNDAwMCwgcmVhc29uOiAnbm8gbWVzc2FnZXMnLCB3YXNDbGVhbjogZmFsc2UgfSlcbiAgICBjb25uZWN0aW9uLmNsb3NlKClcbiAgfVxuXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLmF0dGVtcHQrK1xuICAgIHRoaXMucHVyZ2VSZXF1ZXN0cygpXG4gICAgdGhpcy5jYW5jZWxSZXRyeSgpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucGluZ1RpbWVvdXQpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVhZFRpbWVvdXQpXG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbikge1xuICAgICAgdGhpcy5jbG9zaW5nID0gdHJ1ZVxuICAgICAgdGhpcy5jYWNoZSA9IG51bGxcbiAgICAgIHRoaXMuY29ubmVjdGlvbi5jbG9zZSgpXG4gICAgICB0aGlzLnJlY29ubmVjdENvdW50ID0gMFxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNvbm5lY3QgKHVybD86IHN0cmluZykge1xuICAgIGlmICh1cmwpIHRoaXMudXJsID0gdXJsXG4gICAgY29uc3QgYXR0ZW1wdCA9ICsrdGhpcy5hdHRlbXB0XG4gICAgdGhpcy5wdXJnZVJlcXVlc3RzKClcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnVybFxuICAgIHRoaXMuY2FjaGUgPSBudWxsXG4gICAgdGhpcy5jbG9zaW5nID0gZmFsc2VcbiAgICB0aGlzLmNhbmNlbFJldHJ5KClcblxuICAgIGxldCB0b2tlbjogc3RyaW5nIHwgbnVsbFxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGh0dHBDbGllbnRBY3Rpb25zLmFjY2Vzc09uZXNob3RUb2tlbkdldCh7IHRpbWVvdXQ6IFRPS0VOX1RJTUVPVVRfTVMgfSlcbiAgICAgIHRva2VuID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgaWYgKGF0dGVtcHQgIT09IHRoaXMuYXR0ZW1wdCkgcmV0dXJuXG4gICAgICBjb25zdCBzdGF0dXMgPSBheGlvcy5pc0F4aW9zRXJyb3IoZXJyb3IpID8gZXJyb3IucmVzcG9uc2U/LnN0YXR1cyA6IHVuZGVmaW5lZFxuICAgICAgLy8gQmFkLiBJZiB0aGlzIGlzIGEgNDAxLCB0aGVuIGRvbid0IHJldHJ5LlxuICAgICAgaWYgKHN0YXR1cyA9PT0gNDAxKSByZXR1cm5cbiAgICAgIGlmICghdG9rZW5Ob3RPZmZlcmVkKHN0YXR1cykpIHtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3QoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIE5vIG9uZS1zaG90IHRva2VuIHRvIGJlIGhhZCwgYW5kIG5vbmUgbmVlZGVkOiBvcGVuIHdpdGhvdXQgb25lLlxuICAgICAgdG9rZW4gPSBudWxsXG4gICAgfVxuICAgIC8vIEZsdWlkZCBtb3ZlZCBvbiB3aGlsZSB0aGUgdG9rZW4gY2FtZTogYW5vdGhlciBwcmludGVyLCBvciBjbG9zZWQuXG4gICAgaWYgKGF0dGVtcHQgIT09IHRoaXMuYXR0ZW1wdCB8fCB0YXJnZXQgIT09IHRoaXMudXJsKSByZXR1cm5cblxuICAgIC8vIEdvb2QuIE1vdmUgb24gd2l0aCBzZXR0aW5nIHVwIHRoZSBzb2NrZXQuXG4gICAgaWYgKHRoaXMuc3RvcmUpIHRoaXMuc3RvcmUuZGlzcGF0Y2goJ3NvY2tldC9vblNvY2tldENvbm5lY3RpbmcnLCB0cnVlKVxuICAgIGxldCBzb2NrZXQ6IFdlYlNvY2tldFxuICAgIHRyeSB7XG4gICAgICBzb2NrZXQgPSBuZXcgV2ViU29ja2V0KHRva2VuID09PSBudWxsID8gdGhpcy51cmwgOiBgJHt0aGlzLnVybH0/dG9rZW49JHt0b2tlbn1gKVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gQSBicm93c2VyIHRoYXQgd29uJ3Qgb3BlbiB0aGlzIGFkZHJlc3MgKG1peGVkIGNvbnRlbnQsIGEgYmFkIFVSTCk6IHRyeSBhZ2FpbiBsYXRlci5cbiAgICAgIHRoaXMucmVjb25uZWN0KClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmJpbmRDb25uZWN0aW9uKHNvY2tldClcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kIGEgc29ja2V0IHJldHVybmVkIGJ5IGFuIGF1dGhvcml6ZWQgcHJpbnRlciB0cmFuc3BvcnQuIEV2ZW50IGhhbmRsZXJzXG4gICAqIGFyZSBpbnN0YWxsZWQgYmVmb3JlIGFuIGFscmVhZHktb3BlbiBzb2NrZXQgZW50ZXJzIHRoZSBub3JtYWwgb3BlbiBwYXRoLlxuICAgKi9cbiAgYWRvcHRUcmFuc3BvcnRTb2NrZXQgKFxuICAgIGNvbm5lY3Rpb246IFByaW50ZXJTb2NrZXQsXG4gICAgcmVjb25uZWN0PzogKCkgPT4gUHJvbWlzZTxQcmludGVyU29ja2V0PlxuICApIHtcbiAgICB0aGlzLmF0dGVtcHQrK1xuICAgIHRoaXMucHVyZ2VSZXF1ZXN0cygpXG4gICAgdGhpcy5jbG9zaW5nID0gZmFsc2VcbiAgICB0aGlzLmNhbmNlbFJldHJ5KClcbiAgICAvLyBBIG5ldyByb3V0ZSAoYXV0byBtb2RlIGZhaWxpbmcgb3Zlciwgb3IgYSBjaG9zZW4gcm91dGUpIHN0YXJ0cyBpdHMgb3duIGJhY2tvZmY6XG4gICAgLy8gdGhlIG9sZCByb3V0ZSdzIGZhaWxlZCB0cmllcyBzYXkgbm90aGluZyBhYm91dCB0aGlzIG9uZSAoIzM3MCkuXG4gICAgdGhpcy5yZWNvbm5lY3RDb3VudCA9IDBcbiAgICB0aGlzLmJpbmRDb25uZWN0aW9uKGNvbm5lY3Rpb24sIHJlY29ubmVjdCA/PyBudWxsKVxuICB9XG5cbiAgLyoqIEVuZHMgYW4gYWRvcHRlZCBzZXNzaW9uIHdpdGhvdXQgYWxsb3dpbmcgaXRzIGNsb3NlIGV2ZW50IHRvIHJlY29ubmVjdC4gKi9cbiAgcmVsZWFzZVRyYW5zcG9ydFNvY2tldCAoY2xvc2VDb25uZWN0aW9uID0gdHJ1ZSkge1xuICAgIC8vIEEgcHJpbnRlciBzd2l0Y2ggb3IgYSByZWxlYXNlZCB0cmFuc3BvcnQ6IHRoZSBoZWFkIHBvc2l0aW9uIGhlbGQgaXMgdGhlIG9sZCBvbmUncy5cbiAgICBoZWFkU3RhdHVzLmZyZXNoID0gZmFsc2VcbiAgICB0aGlzLmF0dGVtcHQrK1xuICAgIHRoaXMucHVyZ2VSZXF1ZXN0cygpXG4gICAgdGhpcy5jYW5jZWxSZXRyeSgpXG4gICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuY29ubmVjdGlvblxuICAgIHRoaXMuY29ubmVjdGlvbiA9IG51bGxcbiAgICB0aGlzLnRyYW5zcG9ydFJlY29ubmVjdCA9IG51bGxcbiAgICB0aGlzLmNhY2hlID0gbnVsbFxuICAgIHRoaXMucmVjb25uZWN0Q291bnQgPSAwXG4gICAgaWYgKGNvbm5lY3Rpb24pIHtcbiAgICAgIHRoaXMub3BlbmVkQ29ubmVjdGlvbnMuZGVsZXRlKGNvbm5lY3Rpb24gYXMgb2JqZWN0KVxuICAgICAgaWYgKGNsb3NlQ29ubmVjdGlvbikgY29ubmVjdGlvbi5jbG9zZSgpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBiaW5kQ29ubmVjdGlvbiAoXG4gICAgY29ubmVjdGlvbjogUHJpbnRlclNvY2tldCxcbiAgICByZWNvbm5lY3Q6ICgoKSA9PiBQcm9taXNlPFByaW50ZXJTb2NrZXQ+KSB8IG51bGwgPSBudWxsXG4gICkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb25cbiAgICB0aGlzLnRyYW5zcG9ydFJlY29ubmVjdCA9IHJlY29ubmVjdFxuICAgIGNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsICgpID0+IHRoaXMub25Db25uZWN0aW9uT3Blbihjb25uZWN0aW9uKSlcbiAgICBjb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgZXZlbnQgPT4gdGhpcy5vbkNvbm5lY3Rpb25DbG9zZShjb25uZWN0aW9uLCBldmVudCBhcyBTb2NrZXRDbG9zZUV2ZW50KSlcbiAgICBjb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXZlbnQgPT4gdGhpcy5vbkNvbm5lY3Rpb25FcnJvcihjb25uZWN0aW9uLCBldmVudCkpXG4gICAgY29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZXZlbnQgPT4gdGhpcy5vbkNvbm5lY3Rpb25NZXNzYWdlKGNvbm5lY3Rpb24sIGV2ZW50IGFzIFNvY2tldE1lc3NhZ2VFdmVudCkpXG5cbiAgICBpZiAoY29ubmVjdGlvbi5yZWFkeVN0YXRlID09PSBQUklOVEVSX1NPQ0tFVF9PUEVOKSB7XG4gICAgICB0aGlzLm9uQ29ubmVjdGlvbk9wZW4oY29ubmVjdGlvbilcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ29ubmVjdGlvbk9wZW4gKGNvbm5lY3Rpb246IFByaW50ZXJTb2NrZXQpIHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uICE9PSBjb25uZWN0aW9uIHx8IHRoaXMub3BlbmVkQ29ubmVjdGlvbnMuaGFzKGNvbm5lY3Rpb24gYXMgb2JqZWN0KSkgcmV0dXJuXG5cbiAgICB0aGlzLm9wZW5lZENvbm5lY3Rpb25zLmFkZChjb25uZWN0aW9uIGFzIG9iamVjdClcbiAgICB0aGlzLnJlY29ubmVjdENvdW50ID0gMFxuICAgIHRoaXMuYXJtU2lsZW5jZVRpbWVycygpXG4gICAgaWYgKHRoaXMuc3RvcmUpIHtcbiAgICAgIHRoaXMuc3RvcmUuZGlzcGF0Y2goJ3NvY2tldC9vblNvY2tldENvbm5lY3RpbmcnLCBmYWxzZSlcbiAgICAgIHRoaXMuc3RvcmUuZGlzcGF0Y2goJ3NvY2tldC9vblNvY2tldE9wZW4nLCB0cnVlKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnkgY2xvc2UgRmx1aWRkIGRpZCBub3QgYXNrIGZvciBpcyByZXRyaWVkLCBjbGVhbiBvciBub3Q6IE1vb25yYWtlclxuICAgKiBjbG9zZXMgY2xlYW5seSB3aGVuIGl0IHJlYXBzIGEgc29ja2V0IHRoYXQgc3RvcHBlZCBhbnN3ZXJpbmcsIGFuZCBvdmVyXG4gICAqIElyb2ggZXZlcnkgY2xvc2UgZnJvbSB0aGUgcHJpbnRlciBhcnJpdmVzIGFzIGNsZWFuLiBUaGUgc3RvcmUgaGVhcnMgYVxuICAgKiBjbG9zZSBGbHVpZGQgYXNrZWQgZm9yIGFzIGNsZWFuIGFuZCBhbnkgb3RoZXIgYXMgbm90LlxuICAgKi9cbiAgcHJpdmF0ZSBvbkNvbm5lY3Rpb25DbG9zZSAoY29ubmVjdGlvbjogUHJpbnRlclNvY2tldCwgZXZlbnQ6IFNvY2tldENsb3NlRXZlbnQpIHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uICE9PSBjb25uZWN0aW9uKSByZXR1cm5cblxuICAgIGNvbnNvbGEuZGVidWcoYCR7dGhpcy5sb2dQcmVmaXh9IENvbm5lY3Rpb24gY2xvc2VkOmAsIGV2ZW50KVxuICAgIGNsZWFyVGltZW91dCh0aGlzLnBpbmdUaW1lb3V0KVxuICAgIGNsZWFyVGltZW91dCh0aGlzLmRlYWRUaW1lb3V0KVxuICAgIHRoaXMucHVyZ2VSZXF1ZXN0cygpXG4gICAgY29uc3QgYXNrZWQgPSB0aGlzLmNsb3NpbmdcbiAgICB0aGlzLmNsb3NpbmcgPSBmYWxzZVxuICAgIGlmICh0aGlzLnN0b3JlKSB7XG4gICAgICBpZiAodGhpcy5zdG9yZS5zdGF0ZS5zb2NrZXQuc3RhbGxlZCkgdGhpcy5zdG9yZS5jb21taXQoJ3NvY2tldC9zZXRTb2NrZXRTdGFsbGVkJywgZmFsc2UpXG4gICAgICB0aGlzLnN0b3JlLmRpc3BhdGNoKCdzb2NrZXQvb25Tb2NrZXRDbG9zZScsIHsgY29kZTogZXZlbnQuY29kZSwgcmVhc29uOiBldmVudC5yZWFzb24sIHdhc0NsZWFuOiBhc2tlZCB9KVxuICAgIH1cbiAgICBpZiAoYXNrZWQpIHJldHVyblxuICAgIGlmICh0aGlzLnRyYW5zcG9ydFJlY29ubmVjdCkge1xuICAgICAgdGhpcy5yZWNvbm5lY3RUcmFuc3BvcnQodGhpcy50cmFuc3BvcnRSZWNvbm5lY3QpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVjb25uZWN0KClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ29ubmVjdGlvbkVycm9yIChjb25uZWN0aW9uOiBQcmludGVyU29ja2V0LCBldmVudDogdW5rbm93bikge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb24gIT09IGNvbm5lY3Rpb24pIHJldHVyblxuXG4gICAgY29uc29sYS5lcnJvcihgJHt0aGlzLmxvZ1ByZWZpeH0gQ29ubmVjdGlvbiBlcnJvcjpgLCBldmVudClcbiAgICBpZiAodGhpcy5zdG9yZSkgdGhpcy5zdG9yZS5kaXNwYXRjaCgnc29ja2V0L29uU29ja2V0RXJyb3InLCBldmVudClcbiAgfVxuXG4gIHByaXZhdGUgb25Db25uZWN0aW9uTWVzc2FnZSAoY29ubmVjdGlvbjogUHJpbnRlclNvY2tldCwgbWVzc2FnZTogU29ja2V0TWVzc2FnZUV2ZW50KSB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbiAhPT0gY29ubmVjdGlvbikgcmV0dXJuXG5cbiAgICAvLyBQYXJzZSB0aGUgZGF0YSBwYWNrZXQuXG4gICAgY29uc3QgZDogU29ja2V0UmVzcG9uc2UgPSBKU09OLnBhcnNlKG1lc3NhZ2UuZGF0YSlcblxuICAgIC8vIElzIHRoaXMgYSBzb2NrZXQgbm90aWZpY2F0aW9uLCBvciBhbiBhbnN3ZXIgdG8gYSBzcGVjaWZpYyByZXF1ZXN0P1xuICAgIGxldCByZXF1ZXN0OiBSZXF1ZXN0IHwgdW5kZWZpbmVkXG4gICAgY29uc3QgcmVxdWVzdEluZGV4ID0gdGhpcy5yZXF1ZXN0cy5maW5kSW5kZXgocmVxdWVzdCA9PiByZXF1ZXN0LmlkID09PSBkLmlkKVxuICAgIGlmIChyZXF1ZXN0SW5kZXggPiAtMSkge1xuICAgICAgcmVxdWVzdCA9IHRoaXMucmVxdWVzdHNbcmVxdWVzdEluZGV4XVxuICAgICAgdGhpcy5yZXF1ZXN0cy5zcGxpY2UocmVxdWVzdEluZGV4LCAxKVxuICAgIH1cblxuICAgIC8vIEEgcmVzcG9uc2UgY2FwdHVyZWQgYnkgYW4gZWFybGllciBjb25uZWN0aW9uIGF0dGVtcHQgaGFzIG5vIGF1dGhvcml0eVxuICAgIC8vIG92ZXIgdGhlIG5ld2x5IHNlbGVjdGVkIHNlc3Npb24sIGV2ZW4gaWYgYSB0cmFuc3BvcnQgZGVsaXZlcnMgaXQgbGF0ZS5cbiAgICBpZiAocmVxdWVzdD8ucmVxdWVzdENvbnRleHQ/LmNvbm5lY3Rpb25BdHRlbXB0ICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC5yZXF1ZXN0Q29udGV4dC5jb25uZWN0aW9uQXR0ZW1wdCAhPT0gdGhpcy5hdHRlbXB0KSByZXR1cm5cblxuICAgIC8vIFJlbW92ZSBhIHdhaXQgaWYgZGVmaW5lZC5cbiAgICBpZiAodGhpcy5zdG9yZSAmJiByZXF1ZXN0ICYmIHJlcXVlc3Qud2FpdCAmJiByZXF1ZXN0LndhaXQubGVuZ3RoKSB7XG4gICAgICB0aGlzLnN0b3JlLmNvbW1pdCgnd2FpdC9zZXRSZW1vdmVXYWl0JywgcmVxdWVzdC53YWl0KVxuICAgIH1cblxuICAgIHRoaXMucG9uZygpXG5cbiAgICBpZiAoZC5lcnJvcikge1xuICAgICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGQuZXJyb3IsICdfX3JlcXVlc3RfXycsIHsgZW51bWVyYWJsZTogZmFsc2UsIHZhbHVlOiByZXF1ZXN0IH0pXG4gICAgICB9XG4gICAgICBjb25zb2xhLmRlYnVnKGAke3RoaXMubG9nUHJlZml4fSBSZXNwb25zZSBlcnJvcjpgLCBkLmVycm9yKVxuICAgICAgaWYgKHRoaXMuc3RvcmUpIHRoaXMuc3RvcmUuZGlzcGF0Y2goJ3NvY2tldC9vblNvY2tldEVycm9yJywgZC5lcnJvcilcbiAgICAgIHJlcXVlc3Q/LnJlc29sdmU/Lih1bmRlZmluZWQpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdCkge1xuICAgICAgbGV0IHJlc3VsdCA9IChkLnJlc3VsdCkgPyBkLnJlc3VsdCA6IGQucGFyYW1zXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHJlc3VsdCA9IHsgcmVzdWx0IH1cblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJlc3VsdCwgJ19fcmVxdWVzdF9fJywgeyBlbnVtZXJhYmxlOiBmYWxzZSwgdmFsdWU6IHJlcXVlc3QgfSlcbiAgICAgIGNvbnNvbGEuZGVidWcoYCR7dGhpcy5sb2dQcmVmaXh9IFJlc3BvbnNlOmAsIHJlc3VsdClcbiAgICAgIGlmIChyZXF1ZXN0LmRpc3BhdGNoICYmIHRoaXMuc3RvcmUpIHRoaXMuc3RvcmUuZGlzcGF0Y2gocmVxdWVzdC5kaXNwYXRjaCwgcmVxdWVzdC5yZXF1ZXN0Q29udGV4dCA/IHsgcGF5bG9hZDogcmVzdWx0LCByZXF1ZXN0Q29udGV4dDogcmVxdWVzdC5yZXF1ZXN0Q29udGV4dCB9IDogcmVzdWx0KVxuICAgICAgaWYgKHJlcXVlc3QuY29tbWl0ICYmIHRoaXMuc3RvcmUpIHRoaXMuc3RvcmUuY29tbWl0KHJlcXVlc3QuY29tbWl0LCByZXN1bHQpXG4gICAgICByZXF1ZXN0LnJlc29sdmU/LihyZXN1bHQpXG4gICAgfSBlbHNlIGlmIChkLnBhcmFtcyAmJiBkLnBhcmFtc1swXSkge1xuICAgICAgY29uc3QgW3BhcmFtcywgZXZlbnR0aW1lXSA9IGQucGFyYW1zXG5cbiAgICAgIGlmIChkLm1ldGhvZCAhPT0gJ25vdGlmeV9zdGF0dXNfdXBkYXRlJykge1xuICAgICAgICBpZiAodGhpcy5zdG9yZSkgdGhpcy5zdG9yZS5kaXNwYXRjaCgnc29ja2V0LycgKyBjYW1lbENhc2UoZC5tZXRob2QpLCBwYXJhbXMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBbJ21vdGlvbl9yZXBvcnQnXSkge1xuICAgICAgICAgIGlmICh0aGlzLnN0b3JlICYmIGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmUuZGlzcGF0Y2goJ3ByaW50ZXIvb25GYXN0Tm90aWZ5U3RhdHVzVXBkYXRlJywgeyBrZXksIHBheWxvYWQ6IHBhcmFtc1trZXldIH0sIHsgcm9vdDogdHJ1ZSB9KVxuICAgICAgICAgICAgZGVsZXRlIHBhcmFtc1trZXldXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gZXZlbnR0aW1lID8gZXZlbnR0aW1lICogMTAwMCA6IERhdGUubm93KClcbiAgICAgICAgdGhpcy5jYWNoZSA9ICghdGhpcy5jYWNoZSlcbiAgICAgICAgICA/IHsgdGltZXN0YW1wLCBwYXJhbXMgfVxuICAgICAgICAgIDogeyB0aW1lc3RhbXA6IHRoaXMuY2FjaGUudGltZXN0YW1wLCBwYXJhbXM6IG1lcmdlV2l0aCh0aGlzLmNhY2hlLnBhcmFtcywgcGFyYW1zLCAoZGVzdCwgc3JjKSA9PiBBcnJheS5pc0FycmF5KGRlc3QpID8gc3JjIDogdW5kZWZpbmVkKSB9XG5cbiAgICAgICAgaWYgKHRpbWVzdGFtcCAtIHRoaXMuY2FjaGUudGltZXN0YW1wID49IDEwMDApIHtcbiAgICAgICAgICBpZiAodGhpcy5zdG9yZSkgdGhpcy5zdG9yZS5kaXNwYXRjaCgnc29ja2V0LycgKyBjYW1lbENhc2UoZC5tZXRob2QpLCB0aGlzLmNhY2hlLnBhcmFtcylcbiAgICAgICAgICB0aGlzLmNhY2hlID0geyB0aW1lc3RhbXAsIHBhcmFtczoge30gfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnN0b3JlKSB0aGlzLnN0b3JlLmRpc3BhdGNoKCdzb2NrZXQvJyArIGNhbWVsQ2FzZShkLm1ldGhvZCkpXG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSB3YWl0IGJlZm9yZSB0aGUgbmV4dCB0cnk6IGRvdWJsaW5nIGZyb20gcmVjb25uZWN0SW50ZXJ2YWwsIGNhcHBlZCwgd2l0aCBqaXR0ZXIuICovXG4gIG5leHREZWxheSAoKSB7XG4gICAgY29uc3QgYmFzZSA9IE1hdGgubWluKE1BWF9SRUNPTk5FQ1RfREVMQVlfTVMsIHRoaXMucmVjb25uZWN0SW50ZXJ2YWwgKiAyICoqIE1hdGgubWluKHRoaXMucmVjb25uZWN0Q291bnQsIDE2KSlcbiAgICByZXR1cm4gTWF0aC5yb3VuZChiYXNlICogKDAuOCArIE1hdGgucmFuZG9tKCkgKiAwLjQpKVxuICB9XG5cbiAgcHJpdmF0ZSBzY2hlZHVsZVJldHJ5IChhY3Rpb246ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLmNhbmNlbFJldHJ5KClcbiAgICBjb25zdCBkZWxheSA9IHRoaXMubmV4dERlbGF5KClcbiAgICB0aGlzLnJlY29ubmVjdENvdW50ICs9IDFcbiAgICBjb25zb2xhLmRlYnVnKGAke3RoaXMubG9nUHJlZml4fSBSZWNvbm5lY3RpbmcgaW4gJHtkZWxheX1gKVxuICAgIHRoaXMucmV0cnlBY3Rpb24gPSBhY3Rpb25cbiAgICB0aGlzLnJldHJ5QXQgPSBEYXRlLm5vdygpICsgZGVsYXlcbiAgICB0aGlzLnJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMucmV0cnlUaW1lciA9IG51bGxcbiAgICAgIHRoaXMucmV0cnlBY3Rpb24gPSBudWxsXG4gICAgICB0aGlzLnJldHJ5QXQgPSBudWxsXG4gICAgICBhY3Rpb24oKVxuICAgIH0sIGRlbGF5KVxuICB9XG5cbiAgcHJpdmF0ZSBjYW5jZWxSZXRyeSAoKSB7XG4gICAgaWYgKHRoaXMucmV0cnlUaW1lciAhPT0gbnVsbCkgY2xlYXJUaW1lb3V0KHRoaXMucmV0cnlUaW1lcilcbiAgICB0aGlzLnJldHJ5VGltZXIgPSBudWxsXG4gICAgdGhpcy5yZXRyeUFjdGlvbiA9IG51bGxcbiAgICB0aGlzLnJldHJ5QXQgPSBudWxsXG4gIH1cblxuICAvKiogRm9yZ2V0IHVuYW5zd2VyZWQgUlBDcyBhbmQgdGhlaXIgbG9hZGluZyBpbmRpY2F0b3JzIHdoZW4gYSBzZXNzaW9uIGVuZHMuICovXG4gIHByaXZhdGUgcHVyZ2VSZXF1ZXN0cyAoKSB7XG4gICAgaWYgKHRoaXMuc3RvcmUpIHtcbiAgICAgIGZvciAoY29uc3QgcmVxdWVzdCBvZiB0aGlzLnJlcXVlc3RzKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0LndhaXQ/Lmxlbmd0aCkgdGhpcy5zdG9yZS5jb21taXQoJ3dhaXQvc2V0UmVtb3ZlV2FpdCcsIHJlcXVlc3Qud2FpdClcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU2V0dGxlIHRoZWlyIHByb21pc2VzIHRvbywgc28gbm90aGluZyB3YWl0aW5nIG9uIGFuIGFuc3dlciB3YWl0cyBmb3JldmVyXG4gICAgLy8gKHRoZSBpbi1mbGlnaHQgRy1jb2RlIGNvdW50LCBzYWZlLW1vdmUudHMsIGVuZHMgd2l0aCB0aGVtKS5cbiAgICBmb3IgKGNvbnN0IHJlcXVlc3Qgb2YgdGhpcy5yZXF1ZXN0cykgcmVxdWVzdC5yZXNvbHZlPy4odW5kZWZpbmVkKVxuICAgIHRoaXMucmVxdWVzdHMgPSBbXVxuICB9XG5cbiAgLyoqIFJ1bnMgYSB3YWl0aW5nIHJldHJ5IG5vdywgZnJvbSB0aGUgZmlyc3Qgc3RlcCBvZiB0aGUgYmFja29mZi4gKi9cbiAgcmV0cnlOb3cgKCkge1xuICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMucmV0cnlBY3Rpb25cbiAgICBpZiAoIWFjdGlvbikgcmV0dXJuXG4gICAgdGhpcy5jYW5jZWxSZXRyeSgpXG4gICAgdGhpcy5yZWNvbm5lY3RDb3VudCA9IDBcbiAgICBhY3Rpb24oKVxuICB9XG5cbiAgLyoqIFdoZW4gdGhlIHdhaXRpbmcgdHJ5IHRvIHJlY29ubmVjdCBydW5zIChEYXRlLm5vdygpIG1zKSwgb3IgbnVsbCB3aGVuIG5vbmUgaXMgd2FpdGluZy4gKi9cbiAgZ2V0IG5leHRSZXRyeUF0ICgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5yZXRyeUF0XG4gIH1cblxuICAvKiogV2hldGhlciBhIHRyeSB0byByZWNvbm5lY3QgaXMgd2FpdGluZyBmb3IgaXRzIHR1cm4uICovXG4gIGdldCByZXRyeVBlbmRpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLnJldHJ5QWN0aW9uICE9PSBudWxsXG4gIH1cblxuICBwcml2YXRlIHJlY29ubmVjdFRyYW5zcG9ydCAocmVjb25uZWN0OiAoKSA9PiBQcm9taXNlPFByaW50ZXJTb2NrZXQ+KSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbnVsbFxuICAgIHRoaXMuc2NoZWR1bGVSZXRyeShhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodGhpcy50cmFuc3BvcnRSZWNvbm5lY3QgIT09IHJlY29ubmVjdCkgcmV0dXJuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgcmVjb25uZWN0KClcbiAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0UmVjb25uZWN0ID09PSByZWNvbm5lY3QpIHtcbiAgICAgICAgICB0aGlzLmJpbmRDb25uZWN0aW9uKGNvbm5lY3Rpb24sIHJlY29ubmVjdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25uZWN0aW9uLmNsb3NlKClcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zcG9ydFJlY29ubmVjdCA9PT0gcmVjb25uZWN0KSB0aGlzLnJlY29ubmVjdFRyYW5zcG9ydChyZWNvbm5lY3QpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHJlY29ubmVjdCAoKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbnVsbFxuICAgIGlmICghdGhpcy5yZWNvbm5lY3RFbmFibGVkKSB7XG4gICAgICBpZiAodGhpcy5zdG9yZSkgdGhpcy5zdG9yZS5kaXNwYXRjaCgnc29ja2V0L29uU29ja2V0Q29ubmVjdGluZycsIGZhbHNlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc2NoZWR1bGVSZXRyeSgoKSA9PiB7IHRoaXMuY29ubmVjdCgpIH0pXG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgZGF0YSBUTyB0aGUgc29ja2V0XG4gICAqIEBwYXJhbSBtZXRob2RcbiAgICogQHBhcmFtIHBhcmFtc1xuICAgKi9cbiAgZW1pdCAobWV0aG9kOiBzdHJpbmcsIG9wdGlvbnM/OiBOb3RpZnlPcHRpb25zKSB7XG4gICAgaWYgKHRoaXMuc3RvcmUuc3RhdGUuc29ja2V0LmRpc2Nvbm5lY3RpbmcgfHwgdGhpcy5zdG9yZS5zdGF0ZS5zb2NrZXQuY29ubmVjdGluZykge1xuICAgICAgY29uc29sYS5kZWJ1ZyhgJHt0aGlzLmxvZ1ByZWZpeH0gU29ja2V0IGVtaXQgZGVuaWVkLCBpbiBkaXNjb25uZWN0aW5nIHN0YXRlOmAsIG1ldGhvZCwgb3B0aW9ucylcblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbj8ucmVhZHlTdGF0ZSA9PT0gUFJJTlRFUl9TT0NLRVRfT1BFTikge1xuICAgICAgLy8gbW9vbnJha2VyIGV4cGVjdHMgYSB1bmlxdWUgaWQgZm9yIHVzIHRvIHJlZmVyZW5jZSBiYWNrIHRvIHdoZW4gZGF0YSBpc1xuICAgICAgLy8gcmV0dXJuZWQuIENvdW50ZWQsIG5vdCByYW5kb206IHR3byBwZW5kaW5nIHJlcXVlc3RzIG11c3QgbmV2ZXIgc2hhcmVcbiAgICAgIC8vIG9uZSwgb3Igb25lJ3MgYW5zd2VyIHdvdWxkIHNldHRsZSB0aGUgb3RoZXIgKGEgcnVubmluZyBHMjggZW5kaW5nIGVhcmx5XG4gICAgICAvLyBmb3IgdGhlIGluLWZsaWdodCBHLWNvZGUgY291bnQsIHNhZmUtbW92ZS50cykuXG4gICAgICBjb25zdCBpZCA9IHRoaXMubmV4dFJlcXVlc3RJZCsrXG4gICAgICBjb25zdCBwYWNrZXQ6IFNvY2tldFJlcXVlc3QgPSB7XG4gICAgICAgIGlkLFxuICAgICAgICBtZXRob2QsXG4gICAgICAgIGpzb25ycGM6ICcyLjAnXG4gICAgICB9XG4gICAgICBjb25zdCByZXF1ZXN0OiBSZXF1ZXN0ID0ge1xuICAgICAgICBpZCxcbiAgICAgICAgbWV0aG9kXG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLndhaXQpIHtcbiAgICAgICAgcmVxdWVzdC53YWl0ID0gb3B0aW9ucy53YWl0XG4gICAgICAgIGlmICh0aGlzLnN0b3JlKSB0aGlzLnN0b3JlLmRpc3BhdGNoKCd3YWl0L2FkZFdhaXQnLCBvcHRpb25zLndhaXQpXG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnBhcmFtcykge1xuICAgICAgICBwYWNrZXQucGFyYW1zID0gb3B0aW9ucy5wYXJhbXNcbiAgICAgICAgcmVxdWVzdC5wYXJhbXMgPSBvcHRpb25zLnBhcmFtc1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5kaXNwYXRjaCkgcmVxdWVzdC5kaXNwYXRjaCA9IG9wdGlvbnMuZGlzcGF0Y2hcbiAgICAgIGlmIChvcHRpb25zPy5jYXB0dXJlQ29udGV4dCAmJiB0aGlzLnN0b3JlKSB7XG4gICAgICAgIHJlcXVlc3QucmVxdWVzdENvbnRleHQgPSB7XG4gICAgICAgICAgYXBpVXJsOiB0aGlzLnN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwsXG4gICAgICAgICAgY29ubmVjdGlvbklkOiB0aGlzLnN0b3JlLnN0YXRlLnNvY2tldC5jb25uZWN0aW9uSWQsXG4gICAgICAgICAgcHJpbnRlcklkOiBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCxcbiAgICAgICAgICBjb25uZWN0aW9uQXR0ZW1wdDogdGhpcy5hdHRlbXB0XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuY29tbWl0KSByZXF1ZXN0LmNvbW1pdCA9IG9wdGlvbnMuY29tbWl0XG4gICAgICBjb25zdCByZXNwb25zZSA9IG5ldyBQcm9taXNlPHVua25vd24+KHJlc29sdmUgPT4geyByZXF1ZXN0LnJlc29sdmUgPSByZXNvbHZlIH0pXG4gICAgICB0aGlzLnJlcXVlc3RzLnB1c2gocmVxdWVzdClcbiAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kKEpTT04uc3RyaW5naWZ5KHBhY2tldCkpXG4gICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sYS5kZWJ1ZyhgJHt0aGlzLmxvZ1ByZWZpeH0gTm90IHJlYWR5LCBvciBjbG9zZWQuYCwgbWV0aG9kLCBvcHRpb25zLCB0aGlzLmNvbm5lY3Rpb24/LnJlYWR5U3RhdGUpXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFNvY2tldFBsdWdpbiA9IHtcbiAgaW5zdGFsbCAoVnVlOiB0eXBlb2YgX1Z1ZSwgb3B0aW9ucz86IFNvY2tldFBsdWdpbk9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucz8udXJsID09IG51bGwgfHwgb3B0aW9ucy5zdG9yZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMgcmVxdWlyZWQnKVxuICAgIH1cblxuICAgIGNvbnN0IHNvY2tldCA9IG5ldyBXZWJTb2NrZXRDbGllbnQob3B0aW9ucylcbiAgICBWdWUucHJvdG90eXBlLiRzb2NrZXQgPSBzb2NrZXRcbiAgICBWdWUuJHNvY2tldCA9IHNvY2tldFxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICd2dWUvdHlwZXMvdnVlJyB7XG4gIGludGVyZmFjZSBWdWUge1xuICAgICRzb2NrZXQ6IFdlYlNvY2tldENsaWVudDtcbiAgfVxuXG4gIGludGVyZmFjZSBWdWVDb25zdHJ1Y3RvciB7XG4gICAgJHNvY2tldDogV2ViU29ja2V0Q2xpZW50O1xuICB9XG59XG5cbmludGVyZmFjZSBTb2NrZXRQbHVnaW5PcHRpb25zIHtcbiAgdXJsOiBzdHJpbmc7XG4gIHRva2VuPzogc3RyaW5nO1xuICByZWNvbm5lY3RFbmFibGVkPzogYm9vbGVhbjtcbiAgcmVjb25uZWN0SW50ZXJ2YWw/OiBudW1iZXI7XG4gIHN0b3JlOiBTdG9yZTxSb290U3RhdGU+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5vdGlmeU9wdGlvbnMge1xuICBwYXJhbXM/OiBhbnk7XG4gIGRpc3BhdGNoPzogc3RyaW5nO1xuICBjb21taXQ/OiBzdHJpbmc7XG4gIHdhaXQ/OiBzdHJpbmc7XG4gIGNhcHR1cmVDb250ZXh0PzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIFJlcXVlc3Qge1xuICBpZDogbnVtYmVyO1xuICBtZXRob2Q/OiBzdHJpbmc7XG4gIGRpc3BhdGNoPzogc3RyaW5nO1xuICBjb21taXQ/OiBzdHJpbmc7XG4gIHBhcmFtcz86IGFueTtcbiAgd2FpdD86IHN0cmluZztcbiAgcmVzb2x2ZT86IChyZXN1bHQ6IHVua25vd24pID0+IHZvaWQ7XG4gIHJlcXVlc3RDb250ZXh0PzogeyBhcGlVcmw6IHN0cmluZzsgY29ubmVjdGlvbklkOiBzdHJpbmcgfCBudWxsLCBwcmludGVySWQ6IHN0cmluZyB8IG51bGwsIGNvbm5lY3Rpb25BdHRlbXB0OiBudW1iZXIgfTtcbn1cblxuaW50ZXJmYWNlIFNvY2tldFJlcXVlc3Qge1xuICBqc29ucnBjOiBzdHJpbmc7XG4gIGlkOiBudW1iZXI7XG4gIG1ldGhvZDogc3RyaW5nO1xuICBwYXJhbXM/OiBhbnk7XG59XG5cbmludGVyZmFjZSBTb2NrZXRSZXNwb25zZSB7XG4gIGpzb25ycGM6IHN0cmluZzsgLy8gYWx3YXlzIGF2YWlsYWJsZVxuICBtZXRob2Q/OiBzdHJpbmc7IC8vIGdlbmVyaWMgcmVzcG9uc2VzXG4gIHBhcmFtcz86IFthbnksIG51bWJlcj9dOyAvLyBnZW5lcmljIHJlc3BvbnNlc1xuICBpZD86IG51bWJlcjsgLy8gc3BlY2lmaWMgcmVzcG9uc2VcbiAgcmVzdWx0PzogYW55OyAvLyBzcGVjaWZpYyByZXNwb25zZVxuICBlcnJvcj86IHN0cmluZyB8IFNvY2tldEVycm9yOyAvLyBzcGVjaWZpYyByZXNwb25zZVxufVxuXG5pbnRlcmZhY2UgU29ja2V0RXJyb3Ige1xuICBjb2RlOiBudW1iZXI7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENhY2hlZFBhcmFtcyB7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICBwYXJhbXM6IGFueTtcbn1cblxuaW50ZXJmYWNlIFNvY2tldENsb3NlRXZlbnQge1xuICBjb2RlPzogbnVtYmVyO1xuICByZWFzb24/OiBzdHJpbmc7XG4gIHdhc0NsZWFuOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgU29ja2V0TWVzc2FnZUV2ZW50IHtcbiAgZGF0YTogc3RyaW5nO1xufVxuIl0sIm1hcHBpbmdzIjoiQUFRQSxPQUFPLFVBQVU7QUFDakIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUN4QixTQUFT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