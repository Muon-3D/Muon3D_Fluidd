import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { Globals } from "/src/globals.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { EventBus } from "/src/eventBus.ts";
import { upperFirst, camelCase } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import isKeyOf from "/src/util/is-key-of.ts";
import { isProtectedSurface } from "/src/store/protection/helpers.ts";
import { applyState as applySetupState } from "/src/services/muon-setup/state.ts";
import { onUsbJobNotification } from "/src/services/usb/state.ts";
import { headStatus } from "/src/services/control/safe-move.ts";
import { resetGates } from "/src/services/gates/state.ts";
import { policyRefusedText } from "/src/services/managed-transport/refusal.ts";
export const GUEST_UNAVAILABLE_METHODS = ["server.config", "server.muon.get_protection", "machine.update.status"];
let retryTimeout;
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * ==========================================================================
   * Actions called via the socket client
   * ==========================================================================
   */
  /**
    * Fired when the socket opens.
    */
  async onSocketOpen({ commit }, payload) {
    commit("setSocketOpen", payload);
    if (payload === true) {
      SocketActions.serverInfo();
      SocketActions.identify({
        client_name: Globals.APP_NAME,
        version: `${import.meta.env.VERSION || "0.0.0"}-${import.meta.env.HASH || "unknown"}`.trim(),
        type: "web",
        url: Globals.GITHUB_REPO
      });
    }
  },
  /**
   * Fired when the socket closes.
   */
  async onSocketClose({ dispatch, commit }, event) {
    resetGates();
    headStatus.fresh = false;
    const modules = ["server", "power", "webcams", "jobQueue", "charts", "wait", "gcodePreview"];
    if (event.wasClean) {
      commit("setSocketConnecting", false);
      commit("setSocketOpen", false);
      return;
    }
    commit("setReset");
    commit("setSocketConnecting", true);
    await dispatch("reset", modules, { root: true });
  },
  /**
   * Sets state based on if we're attempting to reconnect
   * the socket or not. If we are not, then the user
   * can invoke a forced refresh.
   */
  async onSocketConnecting({ commit }, payload) {
    commit("setSocketConnecting", payload);
  },
  /**
   * Fired when the socket encounters an error.
   * We might see an error under code 400 for invalid circumstances, like
   * trying to extrude under temp. Should present the user with an error
   * for these cases.
   * Another case might be during a klippy shutdown.
   */
  async onSocketError({ commit, dispatch, rootState }, payload) {
    const method = payload.__request__?.method;
    if (method && GUEST_UNAVAILABLE_METHODS.includes(method) && policyRefusedText(payload.message)) {
      consola.debug("Not available to this user:", method, payload.message);
      return;
    }
    if (method === "printer.gcode.script" && String(payload.__request__?.params?.script ?? "").startsWith("LED_MODE")) return;
    if (payload.code === 403 && method && rootState.protection?.supported && isProtectedSurface(rootState.protection.status, method)) {
      dispatch("protection/onRefused", void 0, { root: true });
      if (method === "machine.update.status") return;
    }
    if (payload.code >= 400 && payload.code < 500) {
      let message = "";
      try {
        message = JSON.parse(payload.message.replace(/'/g, '"')).message;
      } catch (e) {
        message = payload.message;
      }
      EventBus.$emit(message, { type: "error" });
    }
    if (payload.code === 503) {
      commit("printer/setPrinterInfo", { state: "error", state_message: payload.message }, { root: true });
      clearTimeout(retryTimeout);
      retryTimeout = window.setTimeout(() => {
        SocketActions.serverInfo();
      }, Globals.KLIPPY_RETRY_DELAY);
    }
  },
  /**
   * Fired when the socket [identifies](https://moonraker.readthedocs.io/en/latest/web_api/#identify-connection).
   * Required for [HTTP-based subscriptions](https://moonraker.readthedocs.io/en/latest/web_api/#subscribe-to-printer-object-status).
   */
  async onConnectionId({ commit }, { connection_id }) {
    commit("setConnectionId", connection_id);
  },
  async onServerRead({ dispatch }, payload) {
    const { namespace, key, value } = payload;
    if (isKeyOf(namespace, Globals.MOONRAKER_DB)) {
      const roots = Globals.MOONRAKER_DB[namespace].ROOTS;
      const root = key && isKeyOf(key, roots) ? roots[key] : Object.values(roots)[0];
      dispatch(root.dispatch, value, { root: true });
    }
  },
  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */
  async notifyStatusUpdate({ state, commit, dispatch }, payload) {
    await dispatch("printer/onNotifyStatusUpdate", payload, { root: true });
    if (!state.ready) commit("setSocketReadyState", true);
  },
  async notifyGcodeResponse({ dispatch }, payload) {
    dispatch("console/onAddConsoleEntry", { message: `${Globals.CONSOLE_RECEIVE_PREFIX}${payload}` }, { root: true });
  },
  /**
   * This is fired when, for example - the service is stopped.
   */
  async notifyKlippyDisconnected() {
    headStatus.fresh = false;
    SocketActions.serverInfo();
  },
  /**
   * This is fired when, for example - an estop is emitted.
   */
  async notifyKlippyShutdown() {
    headStatus.fresh = false;
    SocketActions.serverInfo();
  },
  async notifyKlippyReady() {
    consola.debug("Klippy Ready");
  },
  // The printer's USB copy job moved on (KAN-4814).
  async notifyMuonUsbJob(_, payload) {
    onUsbJobNotification(payload);
  },
  async notifyFilelistChanged({ dispatch }, payload) {
    dispatch("files/notify" + upperFirst(camelCase(payload.action)), payload, { root: true });
  },
  // Next release, remove.
  async notifyMetadataUpdate({ dispatch }, payload) {
    dispatch("files/onFileMetaData", payload, { root: true });
  },
  async notifyPowerChanged({ dispatch }, payload) {
    dispatch("power/onStatus", { [payload.device]: payload.status }, { root: true });
  },
  async notifyUpdateResponse({ dispatch }, payload) {
    dispatch("version/onUpdateResponse", payload, { root: true });
  },
  async notifyUpdateRefreshed({ dispatch }, payload) {
    dispatch("version/onUpdateStatus", payload, { root: true });
  },
  /**
   * The level was changed at the printer's panel. The notification carries the
   * level but not whether *this* browser has an identity, so ask again.
   */
  async notifyMuonProtectionChanged({ dispatch }) {
    dispatch("protection/init", void 0, { root: true });
  },
  async notifyHistoryChanged({ dispatch }, payload) {
    dispatch("history/onHistoryChange", payload, { root: true });
  },
  async notifyCpuThrottled({ dispatch }, payload) {
    dispatch("server/onMachineThrottledState", payload, { root: true });
  },
  async notifyProcStatUpdate({ dispatch }, payload) {
    dispatch("server/onMachineProcStats", payload, { root: true });
  },
  async notifyUserCreated({ dispatch }, payload) {
    dispatch("auth/onUserCreated", payload, { root: true });
  },
  async notifyUserDeleted({ dispatch }, payload) {
    dispatch("auth/onUserDeleted", payload, { root: true });
  },
  async notifyServiceStateChanged({ dispatch }, payload) {
    dispatch("server/onServiceStateChanged", payload, { root: true });
  },
  async notifyTimelapseEvent({ dispatch }, payload) {
    dispatch("timelapse/onEvent", payload, { root: true });
  },
  async notifyAnnouncementUpdate({ dispatch }, payload) {
    dispatch("announcements/onAnnouncementUpdate", payload, { root: true });
  },
  async notifyAnnouncementDismissed({ dispatch }, payload) {
    dispatch("announcements/onAnnouncementDismissed", payload, { root: true });
  },
  async notifyAnnouncementWake({ dispatch }, payload) {
    dispatch("announcements/onAnnouncementWake", payload, { root: true });
  },
  async notifyWebcamsChanged({ dispatch }, payload) {
    dispatch("webcams/onWebcamsChanged", payload, { root: true });
  },
  async notifySensorUpdate({ dispatch }, payload) {
    dispatch("sensors/onSensorUpdate", payload, { root: true });
  },
  async notifyJobQueueChanged({ dispatch }, payload) {
    dispatch("jobQueue/onJobQueueChanged", payload, { root: true });
  },
  async notifyActiveSpoolSet({ dispatch }, payload) {
    dispatch("spoolman/onActiveSpool", payload, { root: true });
  },
  async notifySpoolmanStatusChanged({ dispatch }, payload) {
    dispatch("spoolman/onStatusChanged", payload.spoolman_connected, { root: true });
  },
  /**
   * First-run setup changed on the printer. The setup page has its own socket;
   * this feeds the same state to the rest of Fluidd, such as the dashboard's
   * "Finish setup" card.
   */
  async notifyMuonSetupChanged(_, payload) {
    applySetupState(payload);
  },
  /**
   * The printer's own screen moved (KAN-4812). Nothing in the store keeps it:
   * the open printer-screen view subscribes to this action and passes it to
   * the framed screen. Declared so the notification is not an unknown action.
   */
  async notifyMuonPanelState() {
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IGNvbnNvbGEgfSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHR5cGUgeyBTb2NrZXRTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHsgRXZlbnRCdXMgfSBmcm9tICdAL2V2ZW50QnVzJ1xuaW1wb3J0IHsgdXBwZXJGaXJzdCwgY2FtZWxDYXNlIH0gZnJvbSAnbG9kYXNoLWVzJ1xuaW1wb3J0IGlzS2V5T2YgZnJvbSAnQC91dGlsL2lzLWtleS1vZidcbmltcG9ydCB7IGlzUHJvdGVjdGVkU3VyZmFjZSB9IGZyb20gJ0Avc3RvcmUvcHJvdGVjdGlvbi9oZWxwZXJzJ1xuaW1wb3J0IHsgYXBwbHlTdGF0ZSBhcyBhcHBseVNldHVwU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tc2V0dXAvc3RhdGUnXG5pbXBvcnQgeyBvblVzYkpvYk5vdGlmaWNhdGlvbiB9IGZyb20gJ0Avc2VydmljZXMvdXNiL3N0YXRlJ1xuaW1wb3J0IHsgaGVhZFN0YXR1cyB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9zYWZlLW1vdmUnXG5pbXBvcnQgeyByZXNldEdhdGVzIH0gZnJvbSAnQC9zZXJ2aWNlcy9nYXRlcy9zdGF0ZSdcbmltcG9ydCB7IHBvbGljeVJlZnVzZWRUZXh0IH0gZnJvbSAnQC9zZXJ2aWNlcy9tYW5hZ2VkLXRyYW5zcG9ydC9yZWZ1c2FsJ1xuXG4vKiogQmFja2dyb3VuZCByZWFkcyB0aGUgcGFnZSBtYWtlcyBmb3IgaXRzZWxmOyBPd25lci1vbmx5IGZvciBhIGd1ZXN0LCBzbyBcIm5vdCBhdmFpbGFibGUgdG8geW91XCIgYW5kIG5vIHRvYXN0LiAqL1xuZXhwb3J0IGNvbnN0IEdVRVNUX1VOQVZBSUxBQkxFX01FVEhPRFMgPSBbJ3NlcnZlci5jb25maWcnLCAnc2VydmVyLm11b24uZ2V0X3Byb3RlY3Rpb24nLCAnbWFjaGluZS51cGRhdGUuc3RhdHVzJ11cblxubGV0IHJldHJ5VGltZW91dDogbnVtYmVyXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPFNvY2tldFN0YXRlLCBSb290U3RhdGU+ID0ge1xuICAvKipcbiAgICogUmVzZXQgb3VyIHN0b3JlXG4gICAqL1xuICBhc3luYyByZXNldCAoeyBjb21taXQgfSkge1xuICAgIGNvbW1pdCgnc2V0UmVzZXQnKVxuICB9LFxuXG4gIC8qKlxuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKiBBY3Rpb25zIGNhbGxlZCB2aWEgdGhlIHNvY2tldCBjbGllbnRcbiAgICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICovXG5cbiAgLyoqXG4gICAgKiBGaXJlZCB3aGVuIHRoZSBzb2NrZXQgb3BlbnMuXG4gICAgKi9cbiAgYXN5bmMgb25Tb2NrZXRPcGVuICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgY29tbWl0KCdzZXRTb2NrZXRPcGVuJywgcGF5bG9hZClcbiAgICBpZiAocGF5bG9hZCA9PT0gdHJ1ZSkge1xuICAgICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJJbmZvKClcbiAgICAgIFNvY2tldEFjdGlvbnMuaWRlbnRpZnkoe1xuICAgICAgICBjbGllbnRfbmFtZTogR2xvYmFscy5BUFBfTkFNRSxcbiAgICAgICAgdmVyc2lvbjogYCR7aW1wb3J0Lm1ldGEuZW52LlZFUlNJT04gfHwgJzAuMC4wJ30tJHtpbXBvcnQubWV0YS5lbnYuSEFTSCB8fCAndW5rbm93bid9YC50cmltKCksXG4gICAgICAgIHR5cGU6ICd3ZWInLFxuICAgICAgICB1cmw6IEdsb2JhbHMuR0lUSFVCX1JFUE9cbiAgICAgIH0pXG4gICAgICAvLyBUaGUgY29uZmlnIHJvb3QgaXMgbGlzdGVkIGZyb20gc2VydmVyL29uU2VydmVySW5mbywgb25jZSB0aGUgcHJpbnRlclxuICAgICAgLy8gaGFzIHNhaWQgd2hldGhlciBpdCByZWdpc3RlcnMgb25lLlxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRmlyZWQgd2hlbiB0aGUgc29ja2V0IGNsb3Nlcy5cbiAgICovXG4gIGFzeW5jIG9uU29ja2V0Q2xvc2UgKHsgZGlzcGF0Y2gsIGNvbW1pdCB9LCBldmVudDogeyBjb2RlPzogbnVtYmVyLCByZWFzb24/OiBzdHJpbmcsIHdhc0NsZWFuOiBib29sZWFuIH0pIHtcbiAgICAvLyBFdmVyeSBnYXRlIGFuc3dlciB3YXMgdGhlIG9sZCBjb25uZWN0aW9uJ3M7IGEgcmVjb25uZWN0IGFza3MgYWdhaW4uXG4gICAgcmVzZXRHYXRlcygpXG4gICAgLy8gV2hhdGV2ZXIgdGhlIHJlYXNvbiwgdGhlIGhlYWQgcG9zaXRpb24gaGVsZCBub3cgaXMgZnJvbSB0aGUgb2xkIGNvbm5lY3Rpb24uXG4gICAgaGVhZFN0YXR1cy5mcmVzaCA9IGZhbHNlXG4gICAgY29uc3QgbW9kdWxlcyA9IFsnc2VydmVyJywgJ3Bvd2VyJywgJ3dlYmNhbXMnLCAnam9iUXVldWUnLCAnY2hhcnRzJywgJ3dhaXQnLCAnZ2NvZGVQcmV2aWV3J11cblxuICAgIGlmIChldmVudC53YXNDbGVhbikge1xuICAgICAgLy8gRmx1aWRkIGNsb3NlZCBpdCwgdG8gc3dpdGNoIHByaW50ZXJzIG9yIHRvIHN0b3AuIFRoZSBuZXh0IGluaXQgcmVzZXRzXG4gICAgICAvLyB3aGF0ZXZlciBpdCBuZWVkcyB0by5cbiAgICAgIGNvbW1pdCgnc2V0U29ja2V0Q29ubmVjdGluZycsIGZhbHNlKVxuICAgICAgY29tbWl0KCdzZXRTb2NrZXRPcGVuJywgZmFsc2UpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBBbnl0aGluZyBlbHNlOiBhIE1vb25yYWtlciByZXN0YXJ0LCBhIG5ldHdvcmsgZHJvcCwgdGhlIHByaW50ZXIgZ29pbmdcbiAgICAvLyBhd2F5LiBUaGUgc29ja2V0IGNsaWVudCBpcyBhbHJlYWR5IHRyeWluZyBhZ2Fpbi5cbiAgICBjb21taXQoJ3NldFJlc2V0JylcbiAgICBjb21taXQoJ3NldFNvY2tldENvbm5lY3RpbmcnLCB0cnVlKVxuICAgIGF3YWl0IGRpc3BhdGNoKCdyZXNldCcsIG1vZHVsZXMsIHsgcm9vdDogdHJ1ZSB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZXRzIHN0YXRlIGJhc2VkIG9uIGlmIHdlJ3JlIGF0dGVtcHRpbmcgdG8gcmVjb25uZWN0XG4gICAqIHRoZSBzb2NrZXQgb3Igbm90LiBJZiB3ZSBhcmUgbm90LCB0aGVuIHRoZSB1c2VyXG4gICAqIGNhbiBpbnZva2UgYSBmb3JjZWQgcmVmcmVzaC5cbiAgICovXG4gIGFzeW5jIG9uU29ja2V0Q29ubmVjdGluZyAoeyBjb21taXQgfSwgcGF5bG9hZCkge1xuICAgIGNvbW1pdCgnc2V0U29ja2V0Q29ubmVjdGluZycsIHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpcmVkIHdoZW4gdGhlIHNvY2tldCBlbmNvdW50ZXJzIGFuIGVycm9yLlxuICAgKiBXZSBtaWdodCBzZWUgYW4gZXJyb3IgdW5kZXIgY29kZSA0MDAgZm9yIGludmFsaWQgY2lyY3Vtc3RhbmNlcywgbGlrZVxuICAgKiB0cnlpbmcgdG8gZXh0cnVkZSB1bmRlciB0ZW1wLiBTaG91bGQgcHJlc2VudCB0aGUgdXNlciB3aXRoIGFuIGVycm9yXG4gICAqIGZvciB0aGVzZSBjYXNlcy5cbiAgICogQW5vdGhlciBjYXNlIG1pZ2h0IGJlIGR1cmluZyBhIGtsaXBweSBzaHV0ZG93bi5cbiAgICovXG4gIGFzeW5jIG9uU29ja2V0RXJyb3IgKHsgY29tbWl0LCBkaXNwYXRjaCwgcm9vdFN0YXRlIH0sIHBheWxvYWQpIHtcbiAgICAvLyBNdW9uT1MgU0VDLTg6IGEgcHJvdGVjdGVkIHN1cmZhY2UgcmVmdXNlZCB0aGlzIGJyb3dzZXIuIExldCB0aGVcbiAgICAvLyBwcm90ZWN0aW9uIHN0b3JlIGZpbmQgb3V0IHdoeSwgYW5kIGRvIG5vdCB0b2FzdCB0aGUgdXBkYXRlIHBhbmVsJ3Mgb3duXG4gICAgLy8gYmFja2dyb3VuZCBzdGF0dXMgcmVxdWVzdCAtLSB0aGUgcGFuZWwgc2F5cyBcInByb3RlY3RlZFwiIGluIHBsYWNlLCBhbmQgYVxuICAgIC8vIHRvYXN0IG9uIGV2ZXJ5IHBvbGwgd291bGQgc2F5IGl0IGxvdWRlciB0aGFuIGFueXRoaW5nIHRoZSB1c2VyIGRpZC5cbiAgICAvL1xuICAgIC8vIE9ubHkgd2hlcmUgTW9vbnJha2VyIGhhcyBgbXVvbl9wcm90ZWN0aW9uYDogYW4gb2xkZXIgaW1hZ2UgZmxvb3JlZFxuICAgIC8vIGAvbWFjaGluZS91cGRhdGVgIG91dHJpZ2h0LCBhbmQgaXRzIHJlZnVzYWwgaXMgc3RpbGwgd29ydGggYSB0b2FzdC5cbiAgICBjb25zdCBtZXRob2Q6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHBheWxvYWQuX19yZXF1ZXN0X18/Lm1ldGhvZFxuICAgIC8vIG11b24tbGluaydzIE93bmVyLW9ubHkgcG9saWN5IHJlZnVzaW5nIGEgcmVhZCB0aGlzIHBlcnNvbiBtYXkgbm90IG1ha2UgKGFuIE9wZW4gcHJpbnRlcidzIGd1ZXN0IGlzIG5vIG93bmVyKTpcbiAgICAvLyB0aGUgZmVhdHVyZSBpcyBcIm5vdCBhdmFpbGFibGUgdG8geW91XCIsIG5vdCBhbiBlcnJvci4gTm90aGluZyB0byB0b2FzdCwgYW5kIG5vdGhpbmcgdG8gYXNrIHRoZSBwcmludGVyIGFnYWluLlxuICAgIGlmIChtZXRob2QgJiYgR1VFU1RfVU5BVkFJTEFCTEVfTUVUSE9EUy5pbmNsdWRlcyhtZXRob2QpICYmIHBvbGljeVJlZnVzZWRUZXh0KHBheWxvYWQubWVzc2FnZSkpIHtcbiAgICAgIGNvbnNvbGEuZGVidWcoJ05vdCBhdmFpbGFibGUgdG8gdGhpcyB1c2VyOicsIG1ldGhvZCwgcGF5bG9hZC5tZXNzYWdlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIFRoZSBMaWdodGluZyBzY3JlZW4gc2hvd3MgYSByZWZ1c2VkIExFRF9NT0RFIGNoYW5nZSBpbiBwbGFjZSwgc28gaXQgaXMgbm90IGEgdG9hc3QgYXMgd2VsbC5cbiAgICBpZiAobWV0aG9kID09PSAncHJpbnRlci5nY29kZS5zY3JpcHQnICYmIFN0cmluZyhwYXlsb2FkLl9fcmVxdWVzdF9fPy5wYXJhbXM/LnNjcmlwdCA/PyAnJykuc3RhcnRzV2l0aCgnTEVEX01PREUnKSkgcmV0dXJuXG4gICAgaWYgKFxuICAgICAgcGF5bG9hZC5jb2RlID09PSA0MDMgJiZcbiAgICAgIG1ldGhvZCAmJlxuICAgICAgcm9vdFN0YXRlLnByb3RlY3Rpb24/LnN1cHBvcnRlZCAmJlxuICAgICAgaXNQcm90ZWN0ZWRTdXJmYWNlKHJvb3RTdGF0ZS5wcm90ZWN0aW9uLnN0YXR1cywgbWV0aG9kKVxuICAgICkge1xuICAgICAgZGlzcGF0Y2goJ3Byb3RlY3Rpb24vb25SZWZ1c2VkJywgdW5kZWZpbmVkLCB7IHJvb3Q6IHRydWUgfSlcbiAgICAgIGlmIChtZXRob2QgPT09ICdtYWNoaW5lLnVwZGF0ZS5zdGF0dXMnKSByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAocGF5bG9hZC5jb2RlID49IDQwMCAmJiBwYXlsb2FkLmNvZGUgPCA1MDApIHtcbiAgICAgIC8vIElmIG91ciBtZXNzYWdlIGNvbnRhaW5zIGpzb24sIHdlIHNob3VsZCB0cnkgdG8gcGFyc2UgaXQuXG4gICAgICAvLyBUaGlzIGlzIHByZXR0eSBiYWQsIHNob3VsZCBnZXQgbW9vbnJha2VyIHRvIGZpeCB0aGlzIHJlc3BvbnNlLlxuICAgICAgbGV0IG1lc3NhZ2UgPSAnJ1xuICAgICAgdHJ5IHtcbiAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UocGF5bG9hZC5tZXNzYWdlLnJlcGxhY2UoLycvZywgJ1wiJykpLm1lc3NhZ2VcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgbWVzc2FnZSA9IHBheWxvYWQubWVzc2FnZVxuICAgICAgfVxuXG4gICAgICBFdmVudEJ1cy4kZW1pdChtZXNzYWdlLCB7IHR5cGU6ICdlcnJvcicgfSlcbiAgICB9XG4gICAgaWYgKHBheWxvYWQuY29kZSA9PT0gNTAzKSB7XG4gICAgICAvLyBUaGlzIGluZGljYXRlcyBrbGlwcHkgaXMgbm9uLXJlc3BvbnNpdmUsIG9yIHRoZXJlJ3MgYSBjb25maWd1cmF0aW9uIGVycm9yXG4gICAgICAvLyBpbiBrbGlwcGVyLiBXZSBzaG91bGQgcmV0cnkgYWZ0ZXIgdGhlIHNldCBkZWxheS5cbiAgICAgIC8vIFJlc3RhcnQgb3VyIHN0YXJ0dXAgc2VxdWVuY2UuXG5cbiAgICAgIC8vIEZvcmNlZnVsbHkgc2V0IHRoZSBwcmludGVyIGluIGVycm9yXG4gICAgICBjb21taXQoJ3ByaW50ZXIvc2V0UHJpbnRlckluZm8nLCB7IHN0YXRlOiAnZXJyb3InLCBzdGF0ZV9tZXNzYWdlOiBwYXlsb2FkLm1lc3NhZ2UgfSwgeyByb290OiB0cnVlIH0pXG4gICAgICBjbGVhclRpbWVvdXQocmV0cnlUaW1lb3V0KVxuICAgICAgcmV0cnlUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckluZm8oKVxuICAgICAgfSwgR2xvYmFscy5LTElQUFlfUkVUUllfREVMQVkpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaXJlZCB3aGVuIHRoZSBzb2NrZXQgW2lkZW50aWZpZXNdKGh0dHBzOi8vbW9vbnJha2VyLnJlYWR0aGVkb2NzLmlvL2VuL2xhdGVzdC93ZWJfYXBpLyNpZGVudGlmeS1jb25uZWN0aW9uKS5cbiAgICogUmVxdWlyZWQgZm9yIFtIVFRQLWJhc2VkIHN1YnNjcmlwdGlvbnNdKGh0dHBzOi8vbW9vbnJha2VyLnJlYWR0aGVkb2NzLmlvL2VuL2xhdGVzdC93ZWJfYXBpLyNzdWJzY3JpYmUtdG8tcHJpbnRlci1vYmplY3Qtc3RhdHVzKS5cbiAgICovXG4gIGFzeW5jIG9uQ29ubmVjdGlvbklkICh7IGNvbW1pdCB9LCB7IGNvbm5lY3Rpb25faWQgfSkge1xuICAgIGNvbW1pdCgnc2V0Q29ubmVjdGlvbklkJywgY29ubmVjdGlvbl9pZClcbiAgfSxcblxuICBhc3luYyBvblNlcnZlclJlYWQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZDoge25hbWVzcGFjZTogc3RyaW5nLCBrZXk/OiBzdHJpbmcsIHZhbHVlOiB1bmtub3dufSkge1xuICAgIGNvbnN0IHsgbmFtZXNwYWNlLCBrZXksIHZhbHVlIH0gPSBwYXlsb2FkXG5cbiAgICBpZiAoaXNLZXlPZihuYW1lc3BhY2UsIEdsb2JhbHMuTU9PTlJBS0VSX0RCKSkge1xuICAgICAgY29uc3Qgcm9vdHMgPSBHbG9iYWxzLk1PT05SQUtFUl9EQltuYW1lc3BhY2VdLlJPT1RTXG5cbiAgICAgIGNvbnN0IHJvb3QgPSBrZXkgJiYgaXNLZXlPZihrZXksIHJvb3RzKSA/IHJvb3RzW2tleV0gOiBPYmplY3QudmFsdWVzKHJvb3RzKVswXVxuXG4gICAgICBkaXNwYXRjaChyb290LmRpc3BhdGNoLCB2YWx1ZSwgeyByb290OiB0cnVlIH0pXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKiBBdXRvbWF0ZWQgbm90aWZpY2F0aW9ucyB2aWEgc29ja2V0XG4gICAqIE5vdGUgdGhhdCBrbGlwcGVyIHdpbGwgc2VuZCBhbiB1cGRhdGUgZXZlcnkgMjUwbXMsIGlmIHRoZSBkYXRhIENIQU5HRUQuXG4gICAqIFRoaXMgYXBwbGllcyBwZXIgb2JqZWN0IHN1YnNjcmliZWQgLSB3aGljaCBjYW4gYWRkIHVwLlxuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKi9cblxuICBhc3luYyBub3RpZnlTdGF0dXNVcGRhdGUgKHsgc3RhdGUsIGNvbW1pdCwgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGF3YWl0IGRpc3BhdGNoKCdwcmludGVyL29uTm90aWZ5U3RhdHVzVXBkYXRlJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG5cbiAgICBpZiAoIXN0YXRlLnJlYWR5KSBjb21taXQoJ3NldFNvY2tldFJlYWR5U3RhdGUnLCB0cnVlKVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeUdjb2RlUmVzcG9uc2UgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdjb25zb2xlL29uQWRkQ29uc29sZUVudHJ5JywgeyBtZXNzYWdlOiBgJHtHbG9iYWxzLkNPTlNPTEVfUkVDRUlWRV9QUkVGSVh9JHtwYXlsb2FkfWAgfSwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgZmlyZWQgd2hlbiwgZm9yIGV4YW1wbGUgLSB0aGUgc2VydmljZSBpcyBzdG9wcGVkLlxuICAgKi9cbiAgYXN5bmMgbm90aWZ5S2xpcHB5RGlzY29ubmVjdGVkICgpIHtcbiAgICAvLyBLbGlwcGVyIHJlc3RhcnRzIHVuaG9tZWQ7IHVudGlsIGl0J3Mgc3Vic2NyaWJlZCBhZ2FpbiB0aGUgcG9zaXRpb24gaGVsZCBpcyBzdGFsZS5cbiAgICBoZWFkU3RhdHVzLmZyZXNoID0gZmFsc2VcbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckluZm8oKVxuICB9LFxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGZpcmVkIHdoZW4sIGZvciBleGFtcGxlIC0gYW4gZXN0b3AgaXMgZW1pdHRlZC5cbiAgICovXG4gIGFzeW5jIG5vdGlmeUtsaXBweVNodXRkb3duICgpIHtcbiAgICBoZWFkU3RhdHVzLmZyZXNoID0gZmFsc2VcbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckluZm8oKVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeUtsaXBweVJlYWR5ICgpIHtcbiAgICBjb25zb2xhLmRlYnVnKCdLbGlwcHkgUmVhZHknKVxuICB9LFxuXG4gIC8vIFRoZSBwcmludGVyJ3MgVVNCIGNvcHkgam9iIG1vdmVkIG9uIChLQU4tNDgxNCkuXG4gIGFzeW5jIG5vdGlmeU11b25Vc2JKb2IgKF8sIHBheWxvYWQpIHtcbiAgICBvblVzYkpvYk5vdGlmaWNhdGlvbihwYXlsb2FkKVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeUZpbGVsaXN0Q2hhbmdlZCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ2ZpbGVzL25vdGlmeScgKyB1cHBlckZpcnN0KGNhbWVsQ2FzZShwYXlsb2FkLmFjdGlvbikpLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICAvLyBOZXh0IHJlbGVhc2UsIHJlbW92ZS5cbiAgYXN5bmMgbm90aWZ5TWV0YWRhdGFVcGRhdGUgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdmaWxlcy9vbkZpbGVNZXRhRGF0YScsIHBheWxvYWQsIHsgcm9vdDogdHJ1ZSB9KVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeVBvd2VyQ2hhbmdlZCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ3Bvd2VyL29uU3RhdHVzJywgeyBbcGF5bG9hZC5kZXZpY2VdOiBwYXlsb2FkLnN0YXR1cyB9LCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlVcGRhdGVSZXNwb25zZSAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ3ZlcnNpb24vb25VcGRhdGVSZXNwb25zZScsIHBheWxvYWQsIHsgcm9vdDogdHJ1ZSB9KVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeVVwZGF0ZVJlZnJlc2hlZCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ3ZlcnNpb24vb25VcGRhdGVTdGF0dXMnLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICAvKipcbiAgICogVGhlIGxldmVsIHdhcyBjaGFuZ2VkIGF0IHRoZSBwcmludGVyJ3MgcGFuZWwuIFRoZSBub3RpZmljYXRpb24gY2FycmllcyB0aGVcbiAgICogbGV2ZWwgYnV0IG5vdCB3aGV0aGVyICp0aGlzKiBicm93c2VyIGhhcyBhbiBpZGVudGl0eSwgc28gYXNrIGFnYWluLlxuICAgKi9cbiAgYXN5bmMgbm90aWZ5TXVvblByb3RlY3Rpb25DaGFuZ2VkICh7IGRpc3BhdGNoIH0pIHtcbiAgICBkaXNwYXRjaCgncHJvdGVjdGlvbi9pbml0JywgdW5kZWZpbmVkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlIaXN0b3J5Q2hhbmdlZCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ2hpc3Rvcnkvb25IaXN0b3J5Q2hhbmdlJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5Q3B1VGhyb3R0bGVkICh7IGRpc3BhdGNoIH0sIHBheWxvYWQpIHtcbiAgICBkaXNwYXRjaCgnc2VydmVyL29uTWFjaGluZVRocm90dGxlZFN0YXRlJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5UHJvY1N0YXRVcGRhdGUgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdzZXJ2ZXIvb25NYWNoaW5lUHJvY1N0YXRzJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5VXNlckNyZWF0ZWQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdhdXRoL29uVXNlckNyZWF0ZWQnLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlVc2VyRGVsZXRlZCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ2F1dGgvb25Vc2VyRGVsZXRlZCcsIHBheWxvYWQsIHsgcm9vdDogdHJ1ZSB9KVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeVNlcnZpY2VTdGF0ZUNoYW5nZWQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdzZXJ2ZXIvb25TZXJ2aWNlU3RhdGVDaGFuZ2VkJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5VGltZWxhcHNlRXZlbnQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCd0aW1lbGFwc2Uvb25FdmVudCcsIHBheWxvYWQsIHsgcm9vdDogdHJ1ZSB9KVxuICB9LFxuXG4gIGFzeW5jIG5vdGlmeUFubm91bmNlbWVudFVwZGF0ZSAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ2Fubm91bmNlbWVudHMvb25Bbm5vdW5jZW1lbnRVcGRhdGUnLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlBbm5vdW5jZW1lbnREaXNtaXNzZWQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdhbm5vdW5jZW1lbnRzL29uQW5ub3VuY2VtZW50RGlzbWlzc2VkJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5QW5ub3VuY2VtZW50V2FrZSAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ2Fubm91bmNlbWVudHMvb25Bbm5vdW5jZW1lbnRXYWtlJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5V2ViY2Ftc0NoYW5nZWQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCd3ZWJjYW1zL29uV2ViY2Ftc0NoYW5nZWQnLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlTZW5zb3JVcGRhdGUgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdzZW5zb3JzL29uU2Vuc29yVXBkYXRlJywgcGF5bG9hZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgYXN5bmMgbm90aWZ5Sm9iUXVldWVDaGFuZ2VkICh7IGRpc3BhdGNoIH0sIHBheWxvYWQpIHtcbiAgICBkaXNwYXRjaCgnam9iUXVldWUvb25Kb2JRdWV1ZUNoYW5nZWQnLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlBY3RpdmVTcG9vbFNldCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgZGlzcGF0Y2goJ3Nwb29sbWFuL29uQWN0aXZlU3Bvb2wnLCBwYXlsb2FkLCB7IHJvb3Q6IHRydWUgfSlcbiAgfSxcblxuICBhc3luYyBub3RpZnlTcG9vbG1hblN0YXR1c0NoYW5nZWQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGRpc3BhdGNoKCdzcG9vbG1hbi9vblN0YXR1c0NoYW5nZWQnLCBwYXlsb2FkLnNwb29sbWFuX2Nvbm5lY3RlZCwgeyByb290OiB0cnVlIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpcnN0LXJ1biBzZXR1cCBjaGFuZ2VkIG9uIHRoZSBwcmludGVyLiBUaGUgc2V0dXAgcGFnZSBoYXMgaXRzIG93biBzb2NrZXQ7XG4gICAqIHRoaXMgZmVlZHMgdGhlIHNhbWUgc3RhdGUgdG8gdGhlIHJlc3Qgb2YgRmx1aWRkLCBzdWNoIGFzIHRoZSBkYXNoYm9hcmQnc1xuICAgKiBcIkZpbmlzaCBzZXR1cFwiIGNhcmQuXG4gICAqL1xuICBhc3luYyBub3RpZnlNdW9uU2V0dXBDaGFuZ2VkIChfLCBwYXlsb2FkKSB7XG4gICAgYXBwbHlTZXR1cFN0YXRlKHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoZSBwcmludGVyJ3Mgb3duIHNjcmVlbiBtb3ZlZCAoS0FOLTQ4MTIpLiBOb3RoaW5nIGluIHRoZSBzdG9yZSBrZWVwcyBpdDpcbiAgICogdGhlIG9wZW4gcHJpbnRlci1zY3JlZW4gdmlldyBzdWJzY3JpYmVzIHRvIHRoaXMgYWN0aW9uIGFuZCBwYXNzZXMgaXQgdG9cbiAgICogdGhlIGZyYW1lZCBzY3JlZW4uIERlY2xhcmVkIHNvIHRoZSBub3RpZmljYXRpb24gaXMgbm90IGFuIHVua25vd24gYWN0aW9uLlxuICAgKi9cbiAgYXN5bmMgbm90aWZ5TXVvblBhbmVsU3RhdGUgKCkge1xuICAgIC8vIFJlYWQgYnkgdGhlIG9wZW4gc2NyZWVuJ3MgYnJpZGdlLlxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsZUFBZTtBQUd4QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxZQUFZLGlCQUFpQjtBQUN0QyxPQUFPLGFBQWE7QUFDcEIsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyxjQUFjLHVCQUF1QjtBQUM5QyxTQUFTLDRCQUE0QjtBQUNyQyxTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLHlCQUF5QjtBQUczQixhQUFNLDRCQUE0QixDQUFDLGlCQUFpQiw4QkFBOEIsdUJBQXVCO0FBRWhILElBQUk7QUFFRyxhQUFNLFVBQThDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJekQsTUFBTSxNQUFPLEVBQUUsT0FBTyxHQUFHO0FBQ3ZCLFdBQU8sVUFBVTtBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsTUFBTSxhQUFjLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDdkMsV0FBTyxpQkFBaUIsT0FBTztBQUMvQixRQUFJLFlBQVksTUFBTTtBQUNwQixvQkFBYyxXQUFXO0FBQ3pCLG9CQUFjLFNBQVM7QUFBQSxRQUNyQixhQUFhLFFBQVE7QUFBQSxRQUNyQixTQUFTLEdBQUcsWUFBWSxJQUFJLFdB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