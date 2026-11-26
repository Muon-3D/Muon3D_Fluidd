import { handlePrintStateChange, handleCurrentFileChange, handleExcludeObjectChange, handleTrinamicDriversChange } from "/src/store/helpers.ts";
import { handleAddChartEntry, handleSystemStatsChange, handleMcuStatsChange } from "/src/store/chart_helpers.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { Globals } from "/src/globals.ts";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import sandboxedEval from "/src/plugins/sandboxedEval.ts";
import { headStatus } from "/src/services/control/safe-move.ts";
let lastDiagnosticsAt = 0;
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Printer Info
   */
  async onPrinterInfo({ commit }, payload) {
    commit("setPrinterInfo", payload);
  },
  /**
   * Query endstops
   */
  async onQueryEndstops({ commit }, payload) {
    commit("setQueryEndstops", payload);
  },
  /**
   * Print cancelled confirmation.
   * Fires as a part of a socket action.
   */
  async onPrintCancel() {
    consola.debug("Print Cancelled");
  },
  /**
   * Print paused confirmation.
   * Fires as a part of a socket action.
   */
  async onPrintPause() {
    consola.debug("Print Paused");
  },
  /**
   * Print resumed confirmation.
   * Fires as a part of a socket action.
   */
  async onPrintResume() {
    consola.debug("Print Resumed");
  },
  /**
   * Print start confirmation.
   * Fires as a watch on a printer state change.
   */
  async onPrintStart(_, payload) {
    consola.debug("Print start detected", payload);
  },
  /**
   * Print end confirmation.
   * Fires as a watch on a printer state change.
   */
  async onPrintEnd(_, payload) {
    consola.debug("Print end detected", payload);
  },
  /**
   * ==========================================================================
   *  Non specific socket requests
   * ==========================================================================
   */
  /**
   * Stores the printers object list.
   */
  async onPrinterObjectsList({ commit }, payload) {
    let intendedSubscriptions = {};
    payload.objects.forEach((k) => {
      if (!k.includes("menu")) {
        intendedSubscriptions = { ...intendedSubscriptions, [k]: null };
      }
      let key = k;
      if (k.includes(" ")) key = key.replace(" ", ".");
      commit("setPrinterObjectList", key);
    });
    SocketActions.printerObjectsSubscribe(intendedSubscriptions);
  },
  async onPrinterObjectsSubscribe({ commit, dispatch }, payload) {
    const status = payload.status;
    if ("screws_tilt_adjust" in status) {
      status.screws_tilt_adjust = {};
    }
    if ("toolhead" in status) {
      if ("max_accel_to_decel" in status.toolhead) {
        status.toolhead.minimum_cruise_ratio = null;
      } else {
        status.toolhead.max_accel_to_decel = null;
      }
    }
    commit("socket/setAcceptNotifications", true, { root: true });
    await dispatch("onNotifyStatusUpdate", status);
    headStatus.fresh = true;
    SocketActions.serverGcodeStore();
    SocketActions.printerGcodeHelp();
    SocketActions.serverTemperatureStore();
  },
  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */
  /** Automated notify events via socket */
  async onNotifyStatusUpdate({ rootState, commit, getters, dispatch }, payload) {
    if (payload && rootState.socket.acceptingNotifications) {
      handleCurrentFileChange(payload, rootState, commit);
      handlePrintStateChange(payload, rootState, dispatch);
      handleExcludeObjectChange(payload, rootState, dispatch);
      handleSystemStatsChange(payload, rootState, commit);
      handleMcuStatsChange(payload, rootState, commit);
      handleTrinamicDriversChange(payload, rootState, dispatch, getters);
      for (const key in payload) {
        const val = payload[key];
        commit("setSocketNotify", { key, payload: val });
      }
      const rootStateServerConfig = rootState.server.config;
      const retention = rootStateServerConfig?.data_store?.temperature_store_size ?? rootStateServerConfig?.server?.temperature_store_size ?? Globals.CHART_HISTORY_RETENTION;
      handleAddChartEntry(retention, rootState, commit);
      dispatch("onDiagnosticsMetricsUpdate");
    }
  },
  async onFastNotifyStatusUpdate({ rootState, commit, dispatch }, payload) {
    if (payload && rootState.socket.acceptingNotifications) {
      commit("setSocketNotify", payload);
      dispatch("onDiagnosticsMetricsUpdate");
    }
  },
  async onDiagnosticsMetricsUpdate({ rootState, commit, rootGetters }) {
    if (!rootState.config.uiSettings.general.enableDiagnostics) return;
    const now = Date.now();
    if (now - lastDiagnosticsAt < 1e3) return;
    lastDiagnosticsAt = now;
    const layout = rootState.layout.layouts.diagnostics;
    const metrics = Object.values(layout).flat().map((card) => card.axes).flat().filter((axis) => axis.enabled).map((axis) => axis.metrics).flat();
    const collectors = Array.from(new Set(metrics.map((metric) => metric.collector)));
    let data;
    try {
      data = sandboxedEval(`
      const printer = ${JSON.stringify(rootState.printer.printer)}
      const collectors = ${JSON.stringify(collectors)}
      const result = { }

      for (const collector of collectors) {
        try {
          result[collector] = eval(collector)
        } catch (err) {
          result[collector] = err.message
        }
      }

      return JSON.stringify(result) // in order to only return serializable data
    `, "metrics");
      if (typeof data !== "string") throw new Error("Metrics collector returned invalid data");
      data = JSON.parse(data);
    } catch (err) {
      data = Object.fromEntries(collectors.map((collector) => [collector, (err instanceof Error && err.message) ?? "Unknown Error"]));
    }
    data.date = /* @__PURE__ */ new Date();
    commit("charts/setChartEntry", {
      type: "diagnostics",
      retention: rootGetters["charts/getChartRetention"],
      data
    }, { root: true });
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgUHJpbnRlclN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyBoYW5kbGVQcmludFN0YXRlQ2hhbmdlLCBoYW5kbGVDdXJyZW50RmlsZUNoYW5nZSwgaGFuZGxlRXhjbHVkZU9iamVjdENoYW5nZSwgaGFuZGxlVHJpbmFtaWNEcml2ZXJzQ2hhbmdlIH0gZnJvbSAnLi4vaGVscGVycydcbmltcG9ydCB7IGhhbmRsZUFkZENoYXJ0RW50cnksIGhhbmRsZVN5c3RlbVN0YXRzQ2hhbmdlLCBoYW5kbGVNY3VTdGF0c0NoYW5nZSB9IGZyb20gJy4uL2NoYXJ0X2hlbHBlcnMnXG5pbXBvcnQgeyBTb2NrZXRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvc29ja2V0QWN0aW9ucydcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgeyBjb25zb2xhIH0gZnJvbSAnY29uc29sYSdcbmltcG9ydCB0eXBlIHsgRGlhZ25vc3RpY3NDYXJkQ29udGFpbmVyIH0gZnJvbSAnQC9zdG9yZS9kaWFnbm9zdGljcy90eXBlcydcbmltcG9ydCBzYW5kYm94ZWRFdmFsIGZyb20gJ0AvcGx1Z2lucy9zYW5kYm94ZWRFdmFsJ1xuaW1wb3J0IHsgaGVhZFN0YXR1cyB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9zYWZlLW1vdmUnXG5cbi8vIGxldCByZXRyeVRpbWVvdXQ6IG51bWJlclxuXG5sZXQgbGFzdERpYWdub3N0aWNzQXQgPSAwXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPFByaW50ZXJTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IG91ciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgcmVzZXQgKHsgY29tbWl0IH0pIHtcbiAgICBjb21taXQoJ3NldFJlc2V0JylcbiAgfSxcblxuICAvKipcbiAgICogUHJpbnRlciBJbmZvXG4gICAqL1xuICBhc3luYyBvblByaW50ZXJJbmZvICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgY29tbWl0KCdzZXRQcmludGVySW5mbycsIHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFF1ZXJ5IGVuZHN0b3BzXG4gICAqL1xuICBhc3luYyBvblF1ZXJ5RW5kc3RvcHMgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBjb21taXQoJ3NldFF1ZXJ5RW5kc3RvcHMnLCBwYXlsb2FkKVxuICB9LFxuXG4gIC8qKlxuICAgKiBQcmludCBjYW5jZWxsZWQgY29uZmlybWF0aW9uLlxuICAgKiBGaXJlcyBhcyBhIHBhcnQgb2YgYSBzb2NrZXQgYWN0aW9uLlxuICAgKi9cbiAgYXN5bmMgb25QcmludENhbmNlbCAoKSB7XG4gICAgY29uc29sYS5kZWJ1ZygnUHJpbnQgQ2FuY2VsbGVkJylcbiAgfSxcblxuICAvKipcbiAgICogUHJpbnQgcGF1c2VkIGNvbmZpcm1hdGlvbi5cbiAgICogRmlyZXMgYXMgYSBwYXJ0IG9mIGEgc29ja2V0IGFjdGlvbi5cbiAgICovXG4gIGFzeW5jIG9uUHJpbnRQYXVzZSAoKSB7XG4gICAgY29uc29sYS5kZWJ1ZygnUHJpbnQgUGF1c2VkJylcbiAgfSxcblxuICAvKipcbiAgICogUHJpbnQgcmVzdW1lZCBjb25maXJtYXRpb24uXG4gICAqIEZpcmVzIGFzIGEgcGFydCBvZiBhIHNvY2tldCBhY3Rpb24uXG4gICAqL1xuICBhc3luYyBvblByaW50UmVzdW1lICgpIHtcbiAgICBjb25zb2xhLmRlYnVnKCdQcmludCBSZXN1bWVkJylcbiAgfSxcblxuICAvKipcbiAgICogUHJpbnQgc3RhcnQgY29uZmlybWF0aW9uLlxuICAgKiBGaXJlcyBhcyBhIHdhdGNoIG9uIGEgcHJpbnRlciBzdGF0ZSBjaGFuZ2UuXG4gICAqL1xuICBhc3luYyBvblByaW50U3RhcnQgKF8sIHBheWxvYWQpIHtcbiAgICBjb25zb2xhLmRlYnVnKCdQcmludCBzdGFydCBkZXRlY3RlZCcsIHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFByaW50IGVuZCBjb25maXJtYXRpb24uXG4gICAqIEZpcmVzIGFzIGEgd2F0Y2ggb24gYSBwcmludGVyIHN0YXRlIGNoYW5nZS5cbiAgICovXG4gIGFzeW5jIG9uUHJpbnRFbmQgKF8sIHBheWxvYWQpIHtcbiAgICBjb25zb2xhLmRlYnVnKCdQcmludCBlbmQgZGV0ZWN0ZWQnLCBwYXlsb2FkKVxuICB9LFxuXG4gIC8qKlxuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKiAgTm9uIHNwZWNpZmljIHNvY2tldCByZXF1ZXN0c1xuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKi9cblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBwcmludGVycyBvYmplY3QgbGlzdC5cbiAgICovXG4gIGFzeW5jIG9uUHJpbnRlck9iamVjdHNMaXN0ICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgLy8gR2l2ZW4gb3VyIG9iamVjdCBsaXN0LCBzdWJzY3JpYmUgdG8gYW55IGRhdGEgd2UnZCB3YW50IGNvbnN0YW50IHVwZGF0ZXMgZm9yXG4gICAgLy8gYW5kIHByZXBvcHVsYXRlIG91ciBzdG9yZS5cbiAgICBsZXQgaW50ZW5kZWRTdWJzY3JpcHRpb25zID0ge31cbiAgICBwYXlsb2FkLm9iamVjdHMuZm9yRWFjaCgoazogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIWsuaW5jbHVkZXMoJ21lbnUnKSkge1xuICAgICAgICBpbnRlbmRlZFN1YnNjcmlwdGlvbnMgPSB7IC4uLmludGVuZGVkU3Vic2NyaXB0aW9ucywgW2tdOiBudWxsIH1cbiAgICAgIH1cbiAgICAgIGxldCBrZXkgPSBrXG4gICAgICBpZiAoay5pbmNsdWRlcygnICcpKSBrZXkgPSBrZXkucmVwbGFjZSgnICcsICcuJylcbiAgICAgIGNvbW1pdCgnc2V0UHJpbnRlck9iamVjdExpc3QnLCBrZXkpXG4gICAgfSlcblxuICAgIFNvY2tldEFjdGlvbnMucHJpbnRlck9iamVjdHNTdWJzY3JpYmUoaW50ZW5kZWRTdWJzY3JpcHRpb25zKVxuICB9LFxuXG4gIGFzeW5jIG9uUHJpbnRlck9iamVjdHNTdWJzY3JpYmUgKHsgY29tbWl0LCBkaXNwYXRjaCB9LCBwYXlsb2FkKSB7XG4gICAgLy8gSW5pdGlhbCBwcmludGVyIHN0YXR1c1xuICAgIGNvbnN0IHN0YXR1cyA9IHBheWxvYWQuc3RhdHVzXG5cbiAgICBpZiAoJ3NjcmV3c190aWx0X2FkanVzdCcgaW4gc3RhdHVzKSB7XG4gICAgICBzdGF0dXMuc2NyZXdzX3RpbHRfYWRqdXN0ID0ge31cbiAgICB9XG5cbiAgICBpZiAoJ3Rvb2xoZWFkJyBpbiBzdGF0dXMpIHtcbiAgICAgIGlmICgnbWF4X2FjY2VsX3RvX2RlY2VsJyBpbiBzdGF0dXMudG9vbGhlYWQpIHtcbiAgICAgICAgc3RhdHVzLnRvb2xoZWFkLm1pbmltdW1fY3J1aXNlX3JhdGlvID0gbnVsbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdHVzLnRvb2xoZWFkLm1heF9hY2NlbF90b19kZWNlbCA9IG51bGxcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBY2NlcHQgbm90aWZpY2F0aW9ucywgYW5kIGNvbW1pdCB0aGUgZmlyc3Qgc3Vic2NyaWJlLlxuICAgIGNvbW1pdCgnc29ja2V0L3NldEFjY2VwdE5vdGlmaWNhdGlvbnMnLCB0cnVlLCB7IHJvb3Q6IHRydWUgfSlcbiAgICBhd2FpdCBkaXNwYXRjaCgnb25Ob3RpZnlTdGF0dXNVcGRhdGUnLCBzdGF0dXMpXG4gICAgLy8gVGhlIGhlYWQgcG9zaXRpb24gQ29udHJvbCBob2xkcyBpcyBub3cgdGhpcyBjb25uZWN0aW9uJ3MgKHNhZmUtbW92ZS50cykuXG4gICAgaGVhZFN0YXR1cy5mcmVzaCA9IHRydWVcblxuICAgIFNvY2tldEFjdGlvbnMuc2VydmVyR2NvZGVTdG9yZSgpXG4gICAgU29ja2V0QWN0aW9ucy5wcmludGVyR2NvZGVIZWxwKClcbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlclRlbXBlcmF0dXJlU3RvcmUoKVxuICB9LFxuXG4gIC8qKlxuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKiBBdXRvbWF0ZWQgbm90aWZpY2F0aW9ucyB2aWEgc29ja2V0XG4gICAqIE5vdGUgdGhhdCBrbGlwcGVyIHdpbGwgc2VuZCBhbiB1cGRhdGUgZXZlcnkgMjUwbXMsIGlmIHRoZSBkYXRhIENIQU5HRUQuXG4gICAqIFRoaXMgYXBwbGllcyBwZXIgb2JqZWN0IHN1YnNjcmliZWQgLSB3aGljaCBjYW4gYWRkIHVwLlxuICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgKi9cblxuICAvKiogQXV0b21hdGVkIG5vdGlmeSBldmVudHMgdmlhIHNvY2tldCAqL1xuICBhc3luYyBvbk5vdGlmeVN0YXR1c1VwZGF0ZSAoeyByb290U3RhdGUsIGNvbW1pdCwgZ2V0dGVycywgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIC8vIFRPRE86IFdlIHBvdGVudGlhbGx5IGdldCBtYW55IHVwZGF0ZXMgaGVyZS5cbiAgICAvLyBDb25zaWRlciBjYWNoaW5nIHRoZSB1cGRhdGVzIGFuZCBzZW5kaW5nIHRoZW0gZXZlcnkgPGludGVydmFsPi5cbiAgICAvLyBXZSBkb24ndCB3YW50IHRvIG1pc3MgYW4gdXBkYXRlIC0gYnV0IGFsc28gZG9uJ3QgbmVlZCBhbGwgb2YgdGhlbVxuICAgIC8vIHNvIHF1aWNrbHkuXG5cbiAgICAvLyBEbyBOT1QgYWNjZXB0IG5vdGlmaWNhdGlvbiB1cGRhdGVzIHVudGlsIG91ciBzdWJzY3JpYmUgY29tZXMgYmFjay5cbiAgICAvLyBUaGlzIGlzIGJlY2F1c2UgbW9vbnJha2VyIGN1cnJlbnRseSBzZW5kcyBub3RpZmljYXRpb24gdXBkYXRlc1xuICAgIC8vIHByaW9yIHRvIHN1YnNjcmliaW5nIG9uIGJyb3dzZXIgcmVmcmVzaC5cbiAgICBpZiAocGF5bG9hZCAmJiByb290U3RhdGUuc29ja2V0LmFjY2VwdGluZ05vdGlmaWNhdGlvbnMpIHtcbiAgICAgIC8vIERldGVjdCBhIHByaW50aW5nIHN0YXRlIGNoYW5nZS5cbiAgICAgIC8vIFdlIGRvIHRoaXMgcHJpb3IgdG8gY29tbWl0aW5nIHRoZSBub3RpZnkgc28gd2UgY2FuXG4gICAgICAvLyBjb21wYXJlIHRoZSBiZWZvcmUgYW5kIGFmdGVyLlxuICAgICAgaGFuZGxlQ3VycmVudEZpbGVDaGFuZ2UocGF5bG9hZCwgcm9vdFN0YXRlLCBjb21taXQpXG4gICAgICBoYW5kbGVQcmludFN0YXRlQ2hhbmdlKHBheWxvYWQsIHJvb3RTdGF0ZSwgZGlzcGF0Y2gpXG4gICAgICBoYW5kbGVFeGNsdWRlT2JqZWN0Q2hhbmdlKHBheWxvYWQsIHJvb3RTdGF0ZSwgZGlzcGF0Y2gpXG4gICAgICBoYW5kbGVTeXN0ZW1TdGF0c0NoYW5nZShwYXlsb2FkLCByb290U3RhdGUsIGNvbW1pdClcbiAgICAgIGhhbmRsZU1jdVN0YXRzQ2hhbmdlKHBheWxvYWQsIHJvb3RTdGF0ZSwgY29tbWl0KVxuICAgICAgaGFuZGxlVHJpbmFtaWNEcml2ZXJzQ2hhbmdlKHBheWxvYWQsIHJvb3RTdGF0ZSwgZGlzcGF0Y2gsIGdldHRlcnMpXG5cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHBheWxvYWQpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGF5bG9hZFtrZXldXG4gICAgICAgIC8vIENvbW1pdCB0aGUgdmFsdWUuXG4gICAgICAgIGNvbW1pdCgnc2V0U29ja2V0Tm90aWZ5JywgeyBrZXksIHBheWxvYWQ6IHZhbCB9KVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYSB0ZW1wIGNoYXJ0IGVudHJ5XG4gICAgICBjb25zdCByb290U3RhdGVTZXJ2ZXJDb25maWcgPSByb290U3RhdGUuc2VydmVyLmNvbmZpZ1xuICAgICAgY29uc3QgcmV0ZW50aW9uID1cbiAgICAgICAgcm9vdFN0YXRlU2VydmVyQ29uZmlnPy5kYXRhX3N0b3JlPy50ZW1wZXJhdHVyZV9zdG9yZV9zaXplID8/XG4gICAgICAgIHJvb3RTdGF0ZVNlcnZlckNvbmZpZz8uc2VydmVyPy50ZW1wZXJhdHVyZV9zdG9yZV9zaXplID8/XG4gICAgICAgIEdsb2JhbHMuQ0hBUlRfSElTVE9SWV9SRVRFTlRJT05cbiAgICAgIGhhbmRsZUFkZENoYXJ0RW50cnkocmV0ZW50aW9uLCByb290U3RhdGUsIGNvbW1pdClcbiAgICAgIGRpc3BhdGNoKCdvbkRpYWdub3N0aWNzTWV0cmljc1VwZGF0ZScpXG4gICAgfVxuICB9LFxuXG4gIGFzeW5jIG9uRmFzdE5vdGlmeVN0YXR1c1VwZGF0ZSAoeyByb290U3RhdGUsIGNvbW1pdCwgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIC8vIERvIE5PVCBhY2NlcHQgdXBkYXRlcyB1bnRpbCBvdXIgc3Vic2NyaWJlIGNvbWVzIGJhY2suXG4gICAgLy8gVGhpcyBpcyBiZWNhdXNlIG1vb25yYWtlciBjdXJyZW50bHkgc2VuZHMgbm90aWZpY2F0aW9uIHVwZGF0ZXNcbiAgICAvLyBwcmlvciB0byBzdWJzY3JpYmluZyBvbiBicm93c2VyIHJlZnJlc2guXG4gICAgaWYgKHBheWxvYWQgJiYgcm9vdFN0YXRlLnNvY2tldC5hY2NlcHRpbmdOb3RpZmljYXRpb25zKSB7XG4gICAgICBjb21taXQoJ3NldFNvY2tldE5vdGlmeScsIHBheWxvYWQpXG4gICAgICBkaXNwYXRjaCgnb25EaWFnbm9zdGljc01ldHJpY3NVcGRhdGUnKVxuICAgIH1cbiAgfSxcblxuICBhc3luYyBvbkRpYWdub3N0aWNzTWV0cmljc1VwZGF0ZSAoeyByb290U3RhdGUsIGNvbW1pdCwgcm9vdEdldHRlcnMgfSkge1xuICAgIGlmICghcm9vdFN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuZW5hYmxlRGlhZ25vc3RpY3MpIHJldHVyblxuICAgIC8vIFRoZSBjb2xsZWN0b3JzIHN0cmluZ2lmeSB0aGUgd2hvbGUgcHJpbnRlciBvYmplY3Q6IGF0IG1vc3Qgb25jZSBhIHNlY29uZC5cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgaWYgKG5vdyAtIGxhc3REaWFnbm9zdGljc0F0IDwgMTAwMCkgcmV0dXJuXG4gICAgbGFzdERpYWdub3N0aWNzQXQgPSBub3dcbiAgICBjb25zdCBsYXlvdXQgPSByb290U3RhdGUubGF5b3V0LmxheW91dHMuZGlhZ25vc3RpY3MgYXMgRGlhZ25vc3RpY3NDYXJkQ29udGFpbmVyXG4gICAgY29uc3QgbWV0cmljcyA9IE9iamVjdC52YWx1ZXMobGF5b3V0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLm1hcChjYXJkID0+IGNhcmQuYXhlcylcbiAgICAgIC5mbGF0KClcbiAgICAgIC5maWx0ZXIoYXhpcyA9PiBheGlzLmVuYWJsZWQpXG4gICAgICAubWFwKGF4aXMgPT4gYXhpcy5tZXRyaWNzKVxuICAgICAgLmZsYXQoKVxuXG4gICAgY29uc3QgY29sbGVjdG9ycyA9IEFycmF5LmZyb20obmV3IFNldChtZXRyaWNzLm1hcChtZXRyaWMgPT4gbWV0cmljLmNvbGxlY3RvcikpKVxuICAgIGxldCBkYXRhXG5cbiAgICB0cnkge1xuICAgICAgZGF0YSA9IHNhbmRib3hlZEV2YWwoYFxuICAgICAgY29uc3QgcHJpbnRlciA9ICR7SlNPTi5zdHJpbmdpZnkocm9vdFN0YXRlLnByaW50ZXIucHJpbnRlcil9XG4gICAgICBjb25zdCBjb2xsZWN0b3JzID0gJHtKU09OLnN0cmluZ2lmeShjb2xsZWN0b3JzKX1cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHsgfVxuXG4gICAgICBmb3IgKGNvbnN0IGNvbGxlY3RvciBvZiBjb2xsZWN0b3JzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0W2NvbGxlY3Rvcl0gPSBldmFsKGNvbGxlY3RvcilcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmVzdWx0W2NvbGxlY3Rvcl0gPSBlcnIubWVzc2FnZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShyZXN1bHQpIC8vIGluIG9yZGVyIHRvIG9ubHkgcmV0dXJuIHNlcmlhbGl6YWJsZSBkYXRhXG4gICAgYCwgJ21ldHJpY3MnKVxuXG4gICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgRXJyb3IoJ01ldHJpY3MgY29sbGVjdG9yIHJldHVybmVkIGludmFsaWQgZGF0YScpXG4gICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgZGF0YSA9IE9iamVjdC5mcm9tRW50cmllcyhjb2xsZWN0b3JzLm1hcChjb2xsZWN0b3IgPT4gW2NvbGxlY3RvciwgKGVyciBpbnN0YW5jZW9mIEVycm9yICYmIGVyci5tZXNzYWdlKSA/PyAnVW5rbm93biBFcnJvciddKSlcbiAgICB9XG5cbiAgICBkYXRhLmRhdGUgPSBuZXcgRGF0ZSgpXG5cbiAgICBjb21taXQoJ2NoYXJ0cy9zZXRDaGFydEVudHJ5Jywge1xuICAgICAgdHlwZTogJ2RpYWdub3N0aWNzJyxcbiAgICAgIHJldGVudGlvbjogcm9vdEdldHRlcnNbJ2NoYXJ0cy9nZXRDaGFydFJldGVudGlvbiddLFxuICAgICAgZGF0YVxuICAgIH0sIHsgcm9vdDogdHJ1ZSB9KVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUdBLFNBQVMsd0JBQXdCLHlCQUF5QiwyQkFBMkIsbUNBQW1DO0FBQ3hILFNBQVMscUJBQXFCLHlCQUF5Qiw0QkFBNEI7QUFDbkYsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFl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