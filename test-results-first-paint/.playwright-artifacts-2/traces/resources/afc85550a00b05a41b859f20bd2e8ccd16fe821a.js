import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { SocketActions } from "/src/api/socketActions.ts";
import { Globals } from "/src/globals.ts";
import { EventBus } from "/src/eventBus.ts";
import i18n from "/src/plugins/i18n.ts";
import __vite__cjsImport5_semver from "/.vite-e2e/4291/deps/semver.js?v=9b9fafc7"; const gte = __vite__cjsImport5_semver["gte"]; const valid = __vite__cjsImport5_semver["valid"];
let retryTimeout;
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  async resetKlippy({ commit }) {
    commit("setResetKlippy");
  },
  /**
   * Init moonraker components.
   * During app init, we want to initially init these once, irrelevant
   * of klippy's state. After that, we'd only ever init once more if
   * klippy is connected.
   */
  async initComponents({ dispatch }, payload) {
    if (payload.components && payload.components.length > 0) {
      const componentsToInit = Globals.MOONRAKER_COMPONENTS;
      for (const key in componentsToInit) {
        const component = componentsToInit[key];
        if (payload.components.includes(component.name)) {
          dispatch(component.dispatch, void 0, { root: true });
        }
      }
    }
  },
  async checkMoonrakerMinVersion({ state, dispatch }) {
    const moonrakerVersion = state.info.moonraker_version ?? "?";
    const fullMoonrakerVersion = moonrakerVersion.includes("-") ? moonrakerVersion : `${moonrakerVersion}-0`;
    if (valid(fullMoonrakerVersion) && valid(Globals.MOONRAKER_MIN_VERSION) && !gte(fullMoonrakerVersion, Globals.MOONRAKER_MIN_VERSION)) {
      dispatch("notifications/pushNotification", {
        id: `old-moonraker-${moonrakerVersion}`,
        title: "Moonraker",
        description: i18n.t("app.version.label.old_component_version", { name: "Moonraker", version: Globals.MOONRAKER_MIN_VERSION }),
        to: "/settings#versions",
        btnText: i18n.t("app.version.btn.view_versions"),
        type: "warning",
        merge: true
      }, { root: true });
    }
  },
  async checkKlipperMinVersion({ state, dispatch }) {
    const klipperVersion = state.system_info?.software_version ?? "?";
    const fullKlipperVersion = klipperVersion.includes("-") ? klipperVersion : `${klipperVersion}-0`;
    if (valid(klipperVersion) && valid(Globals.KLIPPER_MIN_VERSION) && !gte(fullKlipperVersion, Globals.KLIPPER_MIN_VERSION)) {
      dispatch("notifications/pushNotification", {
        id: `old-klipper-${klipperVersion}`,
        title: "Klipper",
        description: i18n.t("app.version.label.old_component_version", { name: "Klipper", version: Globals.KLIPPER_MIN_VERSION }),
        to: "/settings#versions",
        btnText: i18n.t("app.version.btn.view_versions"),
        type: "warning",
        merge: true
      }, { root: true });
    }
  },
  /**
   * On server info
   */
  async onServerInfo({ commit, dispatch, state }, payload) {
    SocketActions.printerInfo();
    SocketActions.serverConfig();
    SocketActions.machineProcStats();
    SocketActions.machineSystemInfo();
    commit("setServerInfo", payload);
    if (state.klippy_retries === 0 && payload.registered_directories?.includes("config")) {
      SocketActions.serverFilesListRoot("config");
    }
    dispatch("checkMoonrakerMinVersion");
    if (payload.klippy_state !== "ready") {
      if (state.klippy_retries === 0) dispatch("initComponents", payload);
      commit("setKlippyRetries", state.klippy_retries + 1);
      clearTimeout(retryTimeout);
      retryTimeout = window.setTimeout(() => {
        SocketActions.serverInfo();
      }, Globals.KLIPPY_RETRY_DELAY);
    } else {
      commit("setKlippyRetries", 0);
      dispatch("initComponents", payload);
      SocketActions.printerObjectsList();
    }
  },
  /**
   * Gives us moonrakers configuration./
   */
  async onServerConfig({ commit }, payload) {
    if (payload.config) {
      commit("setServerConfig", payload.config);
    }
  },
  async onLogsRollOver(_, payload) {
    if (payload?.failed && Object.keys(payload.failed).length > 0) {
      const message = Object.values(payload.failed).join("\n");
      EventBus.$emit(message, { type: "error" });
    } else if (payload?.rolled_over && payload.rolled_over.length) {
      const applications = payload.rolled_over.map(Vue.$filters.prettyCase).join(", ");
      const message = i18n.tc("app.general.msg.rolledover_logs", 0, { applications });
      EventBus.$emit(message, { type: "success" });
    }
  },
  async onMachineProcStats({ commit, dispatch }, payload) {
    if (payload && payload.throttled_state) {
      await dispatch("onMachineThrottledState", payload.throttled_state);
    }
    commit("setMoonrakerStats", payload);
    if (payload.moonraker_stats && "cpu_usage" in payload.moonraker_stats && !Array.isArray(payload.moonraker_stats)) {
      const d = payload.moonraker_stats;
      if (d.cpu_usage <= 100) {
        commit("charts/setChartEntry", {
          type: "moonraker",
          retention: 600,
          data: {
            date: new Date(d.time * 1e3),
            load: d.cpu_usage.toFixed(2)
          }
        }, { root: true });
      }
    }
  },
  async onMachineSystemInfo({ commit, dispatch }, payload) {
    commit("setSystemInfo", payload);
    dispatch("checkKlipperMinVersion");
  },
  async onMachinePeripherals({ commit }, payload) {
    commit("setMachinePeripherals", payload);
  },
  async onMachinePeripheralsCanbus({ commit }, payload) {
    const { interface: canbusInterface } = payload.__request__.params;
    commit("setMachinePeripheralsCanbus", { canbusInterface, can_uuids: payload.can_uuids });
  },
  async onServiceStateChanged({ commit }, payload) {
    commit("setServiceState", payload);
  },
  async onMachineThrottledState({ commit, dispatch, state }, payload) {
    if (payload) {
      if (payload && payload.flags.length > 0) {
        payload.flags.forEach((flag) => {
          if (state.throttled_state && !state.throttled_state.flags.includes(flag)) {
            const previousEvent = flag.toLowerCase().startsWith("previously");
            let n = {
              id: flag,
              title: flag,
              description: "This may lead to a throttle condition and result in a failed print",
              to: "https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#frequency-management-and-thermal-control",
              type: previousEvent ? "info" : "error",
              snackbar: !previousEvent,
              // Snackbar only if not a previously encountered event.
              merge: true,
              // Merge if it was a previously encountered event.
              clear: !previousEvent,
              // Dont allow the user to clear if it was a previously encountered event.
              noCount: previousEvent
              // Dont add to the counter if it was a previously encountered event.
            };
            if ((flag === "Temperature Limit Active" || flag === "Frequency Capped") && state.cpu_temp) {
              n = {
                ...n,
                suffix: `${state.cpu_temp.toFixed(0)}<small>°C</small>`,
                suffixIcon: "$tempError"
              };
            }
            if (!previousEvent) {
              n = {
                ...n,
                description: "This may lead to a failed print"
              };
            }
            dispatch("notifications/pushNotification", n, { root: true });
          }
        });
      }
      commit("setMoonrakerStats", { throttled_state: payload });
    }
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgdHlwZSB7IEFjdGlvblRyZWUgfSBmcm9tICd2dWV4J1xuaW1wb3J0IHR5cGUgeyBDYW5idXNVdWlkLCBQZXJpcGhlcmFscywgU2VydmVySW5mbywgU2VydmVyU3RhdGUsIFNlcnZlclRocm90dGxlZFN0YXRlLCBTZXJ2aWNlU3RhdGUsIFN5c3RlbUluZm8gfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBSb290U3RhdGUgfSBmcm9tICcuLi90eXBlcydcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB0eXBlIHsgQXBwUHVzaE5vdGlmaWNhdGlvbiB9IGZyb20gJy4uL25vdGlmaWNhdGlvbnMvdHlwZXMnXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgaTE4biBmcm9tICdAL3BsdWdpbnMvaTE4bidcbmltcG9ydCB7IGd0ZSwgdmFsaWQgfSBmcm9tICdzZW12ZXInXG5cbmxldCByZXRyeVRpbWVvdXQ6IG51bWJlclxuXG5leHBvcnQgY29uc3QgYWN0aW9uczogQWN0aW9uVHJlZTxTZXJ2ZXJTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IG91ciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgcmVzZXQgKHsgY29tbWl0IH0pIHtcbiAgICBjb21taXQoJ3NldFJlc2V0JylcbiAgfSxcblxuICBhc3luYyByZXNldEtsaXBweSAoeyBjb21taXQgfSkge1xuICAgIGNvbW1pdCgnc2V0UmVzZXRLbGlwcHknKVxuICB9LFxuXG4gIC8qKlxuICAgKiBJbml0IG1vb25yYWtlciBjb21wb25lbnRzLlxuICAgKiBEdXJpbmcgYXBwIGluaXQsIHdlIHdhbnQgdG8gaW5pdGlhbGx5IGluaXQgdGhlc2Ugb25jZSwgaXJyZWxldmFudFxuICAgKiBvZiBrbGlwcHkncyBzdGF0ZS4gQWZ0ZXIgdGhhdCwgd2UnZCBvbmx5IGV2ZXIgaW5pdCBvbmNlIG1vcmUgaWZcbiAgICoga2xpcHB5IGlzIGNvbm5lY3RlZC5cbiAgICovXG4gIGFzeW5jIGluaXRDb21wb25lbnRzICh7IGRpc3BhdGNoIH0sIHBheWxvYWQpIHtcbiAgICBpZiAoXG4gICAgICBwYXlsb2FkLmNvbXBvbmVudHMgJiZcbiAgICAgIHBheWxvYWQuY29tcG9uZW50cy5sZW5ndGggPiAwXG4gICAgKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRzVG9Jbml0OiB7IFtpbmRleDogc3RyaW5nXTogeyBuYW1lOiBzdHJpbmc7IGRpc3BhdGNoOiBzdHJpbmcgfSB9ID0gR2xvYmFscy5NT09OUkFLRVJfQ09NUE9ORU5UU1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcG9uZW50c1RvSW5pdCkge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRzVG9Jbml0W2tleV1cbiAgICAgICAgaWYgKHBheWxvYWQuY29tcG9uZW50cy5pbmNsdWRlcyhjb21wb25lbnQubmFtZSkpIHtcbiAgICAgICAgICBkaXNwYXRjaChjb21wb25lbnQuZGlzcGF0Y2gsIHVuZGVmaW5lZCwgeyByb290OiB0cnVlIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgY2hlY2tNb29ucmFrZXJNaW5WZXJzaW9uICh7IHN0YXRlLCBkaXNwYXRjaCB9KSB7XG4gICAgY29uc3QgbW9vbnJha2VyVmVyc2lvbiA9IHN0YXRlLmluZm8ubW9vbnJha2VyX3ZlcnNpb24gPz8gJz8nXG5cbiAgICBjb25zdCBmdWxsTW9vbnJha2VyVmVyc2lvbiA9IG1vb25yYWtlclZlcnNpb24uaW5jbHVkZXMoJy0nKVxuICAgICAgPyBtb29ucmFrZXJWZXJzaW9uXG4gICAgICA6IGAke21vb25yYWtlclZlcnNpb259LTBgXG5cbiAgICBpZiAoXG4gICAgICB2YWxpZChmdWxsTW9vbnJha2VyVmVyc2lvbikgJiZcbiAgICAgIHZhbGlkKEdsb2JhbHMuTU9PTlJBS0VSX01JTl9WRVJTSU9OKSAmJlxuICAgICAgIWd0ZShmdWxsTW9vbnJha2VyVmVyc2lvbiwgR2xvYmFscy5NT09OUkFLRVJfTUlOX1ZFUlNJT04pXG4gICAgKSB7XG4gICAgICBkaXNwYXRjaCgnbm90aWZpY2F0aW9ucy9wdXNoTm90aWZpY2F0aW9uJywge1xuICAgICAgICBpZDogYG9sZC1tb29ucmFrZXItJHttb29ucmFrZXJWZXJzaW9ufWAsXG4gICAgICAgIHRpdGxlOiAnTW9vbnJha2VyJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGkxOG4udCgnYXBwLnZlcnNpb24ubGFiZWwub2xkX2NvbXBvbmVudF92ZXJzaW9uJywgeyBuYW1lOiAnTW9vbnJha2VyJywgdmVyc2lvbjogR2xvYmFscy5NT09OUkFLRVJfTUlOX1ZFUlNJT04gfSksXG4gICAgICAgIHRvOiAnL3NldHRpbmdzI3ZlcnNpb25zJyxcbiAgICAgICAgYnRuVGV4dDogaTE4bi50KCdhcHAudmVyc2lvbi5idG4udmlld192ZXJzaW9ucycpLFxuICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgIG1lcmdlOiB0cnVlXG4gICAgICB9LCB7IHJvb3Q6IHRydWUgfSlcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgY2hlY2tLbGlwcGVyTWluVmVyc2lvbiAoeyBzdGF0ZSwgZGlzcGF0Y2ggfSkge1xuICAgIGNvbnN0IGtsaXBwZXJWZXJzaW9uID0gc3RhdGUuc3lzdGVtX2luZm8/LnNvZnR3YXJlX3ZlcnNpb24gPz8gJz8nXG5cbiAgICBjb25zdCBmdWxsS2xpcHBlclZlcnNpb24gPSBrbGlwcGVyVmVyc2lvbi5pbmNsdWRlcygnLScpXG4gICAgICA/IGtsaXBwZXJWZXJzaW9uXG4gICAgICA6IGAke2tsaXBwZXJWZXJzaW9ufS0wYFxuXG4gICAgaWYgKFxuICAgICAgdmFsaWQoa2xpcHBlclZlcnNpb24pICYmXG4gICAgICB2YWxpZChHbG9iYWxzLktMSVBQRVJfTUlOX1ZFUlNJT04pICYmXG4gICAgICAhZ3RlKGZ1bGxLbGlwcGVyVmVyc2lvbiwgR2xvYmFscy5LTElQUEVSX01JTl9WRVJTSU9OKVxuICAgICkge1xuICAgICAgZGlzcGF0Y2goJ25vdGlmaWNhdGlvbnMvcHVzaE5vdGlmaWNhdGlvbicsIHtcbiAgICAgICAgaWQ6IGBvbGQta2xpcHBlci0ke2tsaXBwZXJWZXJzaW9ufWAsXG4gICAgICAgIHRpdGxlOiAnS2xpcHBlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBpMThuLnQoJ2FwcC52ZXJzaW9uLmxhYmVsLm9sZF9jb21wb25lbnRfdmVyc2lvbicsIHsgbmFtZTogJ0tsaXBwZXInLCB2ZXJzaW9uOiBHbG9iYWxzLktMSVBQRVJfTUlOX1ZFUlNJT04gfSksXG4gICAgICAgIHRvOiAnL3NldHRpbmdzI3ZlcnNpb25zJyxcbiAgICAgICAgYnRuVGV4dDogaTE4bi50KCdhcHAudmVyc2lvbi5idG4udmlld192ZXJzaW9ucycpLFxuICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgIG1lcmdlOiB0cnVlXG4gICAgICB9LCB7IHJvb3Q6IHRydWUgfSlcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIE9uIHNlcnZlciBpbmZvXG4gICAqL1xuICBhc3luYyBvblNlcnZlckluZm8gKHsgY29tbWl0LCBkaXNwYXRjaCwgc3RhdGUgfSwgcGF5bG9hZDogU2VydmVySW5mbykge1xuICAgIC8vIFRoaXMgcGF5bG9hZCBzaG91bGQgcmV0dXJuIGEgbGlzdCBvZiBlbmFibGVkIGNvbXBvbmVudHNcbiAgICAvLyBhbmQgcm9vdCBkaXJlY3RvcmllcyB0aGF0IGFyZSBhdmFpbGFibGUuXG4gICAgU29ja2V0QWN0aW9ucy5wcmludGVySW5mbygpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJDb25maWcoKVxuICAgIFNvY2tldEFjdGlvbnMubWFjaGluZVByb2NTdGF0cygpXG4gICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lU3lzdGVtSW5mbygpXG5cbiAgICBjb21taXQoJ3NldFNlcnZlckluZm8nLCBwYXlsb2FkKVxuXG4gICAgLy8gQW4gTTEgcmVnaXN0ZXJzIGBjb25maWdgIG9ubHkgaW4gZGV2ZWxvcGVyIG1vZGU7IG90aGVyd2lzZSB0aGUgcHJpbnRlcidzXG4gICAgLy8gY29uZmlndXJhdGlvbiBpcyB0aGUgcmVhZC1vbmx5IGBkZWZhdWx0c2Agcm9vdC4gQXNraW5nIGZvciBhIHJvb3QgdGhhdFxuICAgIC8vIGlzbid0IHRoZXJlIGZhaWxzIHdpdGggXCJGYWlsZWQgdG8gYnVpbGQgZmlsZSBsaXN0LCBpbnZhbGlkIHBhdGg6XG4gICAgLy8gY29uZmlnOiBOb25lXCIsIHdoaWNoIGV2ZXJ5IGZyZXNoIHByaW50ZXIgc2hvd2VkIGFzIGFuIGVycm9yIHRvYXN0LiBPbmNlXG4gICAgLy8gcGVyIGNvbm5lY3Rpb246IHRoaXMgaGFuZGxlciByZXBlYXRzIHdoaWxlIEtsaXBweSBpcyBzdGFydGluZy5cbiAgICBpZiAoc3RhdGUua2xpcHB5X3JldHJpZXMgPT09IDAgJiYgcGF5bG9hZC5yZWdpc3RlcmVkX2RpcmVjdG9yaWVzPy5pbmNsdWRlcygnY29uZmlnJykpIHtcbiAgICAgIFNvY2tldEFjdGlvbnMuc2VydmVyRmlsZXNMaXN0Um9vdCgnY29uZmlnJylcbiAgICB9XG5cbiAgICBkaXNwYXRjaCgnY2hlY2tNb29ucmFrZXJNaW5WZXJzaW9uJylcblxuICAgIGlmIChwYXlsb2FkLmtsaXBweV9zdGF0ZSAhPT0gJ3JlYWR5Jykge1xuICAgICAgLy8gSWYga2xpcHB5IGlzIG5vdCBjb25uZWN0ZWQsIHdlJ2xsIGNvbnRpbnVlIHRvXG4gICAgICAvLyByZXRyeSB0aGUgaW5pdCBwcm9jZXNzLlxuICAgICAgaWYgKHN0YXRlLmtsaXBweV9yZXRyaWVzID09PSAwKSBkaXNwYXRjaCgnaW5pdENvbXBvbmVudHMnLCBwYXlsb2FkKVxuICAgICAgY29tbWl0KCdzZXRLbGlwcHlSZXRyaWVzJywgc3RhdGUua2xpcHB5X3JldHJpZXMgKyAxKVxuICAgICAgY2xlYXJUaW1lb3V0KHJldHJ5VGltZW91dClcbiAgICAgIHJldHJ5VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJJbmZvKClcbiAgICAgIH0sIEdsb2JhbHMuS0xJUFBZX1JFVFJZX0RFTEFZKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBrbGlwcHkgaXMgY29ubmVjdGVkLCBtb3ZlIG9uLlxuICAgICAgY29tbWl0KCdzZXRLbGlwcHlSZXRyaWVzJywgMClcbiAgICAgIGRpc3BhdGNoKCdpbml0Q29tcG9uZW50cycsIHBheWxvYWQpXG4gICAgICBTb2NrZXRBY3Rpb25zLnByaW50ZXJPYmplY3RzTGlzdCgpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHaXZlcyB1cyBtb29ucmFrZXJzIGNvbmZpZ3VyYXRpb24uL1xuICAgKi9cbiAgYXN5bmMgb25TZXJ2ZXJDb25maWcgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBpZiAocGF5bG9hZC5jb25maWcpIHtcbiAgICAgIGNvbW1pdCgnc2V0U2VydmVyQ29uZmlnJywgcGF5bG9hZC5jb25maWcpXG4gICAgfVxuICB9LFxuXG4gIGFzeW5jIG9uTG9nc1JvbGxPdmVyIChfLCBwYXlsb2FkPzogeyByb2xsZWRfb3Zlcj86IHN0cmluZ1tdLCBmYWlsZWQ/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0pIHtcbiAgICBpZiAocGF5bG9hZD8uZmFpbGVkICYmIE9iamVjdC5rZXlzKHBheWxvYWQuZmFpbGVkKS5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gT2JqZWN0LnZhbHVlcyhwYXlsb2FkLmZhaWxlZClcbiAgICAgICAgLmpvaW4oJ1xcbicpXG5cbiAgICAgIEV2ZW50QnVzLiRlbWl0KG1lc3NhZ2UsIHsgdHlwZTogJ2Vycm9yJyB9KVxuICAgIH0gZWxzZSBpZiAocGF5bG9hZD8ucm9sbGVkX292ZXIgJiYgcGF5bG9hZC5yb2xsZWRfb3Zlci5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGFwcGxpY2F0aW9ucyA9IHBheWxvYWQucm9sbGVkX292ZXJcbiAgICAgICAgLm1hcChWdWUuJGZpbHRlcnMucHJldHR5Q2FzZSlcbiAgICAgICAgLmpvaW4oJywgJylcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBpMThuLnRjKCdhcHAuZ2VuZXJhbC5tc2cucm9sbGVkb3Zlcl9sb2dzJywgMCwgeyBhcHBsaWNhdGlvbnMgfSlcblxuICAgICAgRXZlbnRCdXMuJGVtaXQobWVzc2FnZSwgeyB0eXBlOiAnc3VjY2VzcycgfSlcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgb25NYWNoaW5lUHJvY1N0YXRzICh7IGNvbW1pdCwgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGlmIChwYXlsb2FkICYmIHBheWxvYWQudGhyb3R0bGVkX3N0YXRlKSB7XG4gICAgICBhd2FpdCBkaXNwYXRjaCgnb25NYWNoaW5lVGhyb3R0bGVkU3RhdGUnLCBwYXlsb2FkLnRocm90dGxlZF9zdGF0ZSlcbiAgICB9XG4gICAgY29tbWl0KCdzZXRNb29ucmFrZXJTdGF0cycsIHBheWxvYWQpXG5cbiAgICAvLyBBZGQgYSBjaGFydCBlbnRyeVxuICAgIGlmIChcbiAgICAgIHBheWxvYWQubW9vbnJha2VyX3N0YXRzICYmXG4gICAgICAnY3B1X3VzYWdlJyBpbiBwYXlsb2FkLm1vb25yYWtlcl9zdGF0cyAmJlxuICAgICAgIUFycmF5LmlzQXJyYXkocGF5bG9hZC5tb29ucmFrZXJfc3RhdHMpXG4gICAgKSB7XG4gICAgICBjb25zdCBkID0gcGF5bG9hZC5tb29ucmFrZXJfc3RhdHNcbiAgICAgIGlmIChkLmNwdV91c2FnZSA8PSAxMDApIHtcbiAgICAgICAgY29tbWl0KCdjaGFydHMvc2V0Q2hhcnRFbnRyeScsIHtcbiAgICAgICAgICB0eXBlOiAnbW9vbnJha2VyJyxcbiAgICAgICAgICByZXRlbnRpb246IDYwMCxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShkLnRpbWUgKiAxMDAwKSxcbiAgICAgICAgICAgIGxvYWQ6IGQuY3B1X3VzYWdlLnRvRml4ZWQoMilcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHsgcm9vdDogdHJ1ZSB9KVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBhc3luYyBvbk1hY2hpbmVTeXN0ZW1JbmZvICh7IGNvbW1pdCwgZGlzcGF0Y2ggfSwgcGF5bG9hZDogeyBzeXN0ZW1faW5mbz86IFN5c3RlbUluZm8gfSkge1xuICAgIGNvbW1pdCgnc2V0U3lzdGVtSW5mbycsIHBheWxvYWQpXG5cbiAgICBkaXNwYXRjaCgnY2hlY2tLbGlwcGVyTWluVmVyc2lvbicpXG4gIH0sXG5cbiAgYXN5bmMgb25NYWNoaW5lUGVyaXBoZXJhbHMgKHsgY29tbWl0IH0sIHBheWxvYWQ6IFBhcnRpYWw8UGVyaXBoZXJhbHM+KSB7XG4gICAgY29tbWl0KCdzZXRNYWNoaW5lUGVyaXBoZXJhbHMnLCBwYXlsb2FkKVxuICB9LFxuXG4gIGFzeW5jIG9uTWFjaGluZVBlcmlwaGVyYWxzQ2FuYnVzICh7IGNvbW1pdCB9LCBwYXlsb2FkOiB7IGNhbl91dWlkczogQ2FuYnVzVXVpZFtdLCBfX3JlcXVlc3RfXzogYW55IH0pIHtcbiAgICBjb25zdCB7IGludGVyZmFjZTogY2FuYnVzSW50ZXJmYWNlIH0gPSBwYXlsb2FkLl9fcmVxdWVzdF9fLnBhcmFtc1xuXG4gICAgY29tbWl0KCdzZXRNYWNoaW5lUGVyaXBoZXJhbHNDYW5idXMnLCB7IGNhbmJ1c0ludGVyZmFjZSwgY2FuX3V1aWRzOiBwYXlsb2FkLmNhbl91dWlkcyB9KVxuICB9LFxuXG4gIGFzeW5jIG9uU2VydmljZVN0YXRlQ2hhbmdlZCAoeyBjb21taXQgfSwgcGF5bG9hZDogU2VydmljZVN0YXRlKSB7XG4gICAgY29tbWl0KCdzZXRTZXJ2aWNlU3RhdGUnLCBwYXlsb2FkKVxuICB9LFxuXG4gIGFzeW5jIG9uTWFjaGluZVRocm90dGxlZFN0YXRlICh7IGNvbW1pdCwgZGlzcGF0Y2gsIHN0YXRlIH0sIHBheWxvYWQ6IFNlcnZlclRocm90dGxlZFN0YXRlKSB7XG4gICAgaWYgKHBheWxvYWQpIHtcbiAgICAgIC8vIElmIHdlIGhhdmUgYSB0aHJvdHRsZWQgY29uZGl0aW9uLlxuICAgICAgaWYgKHBheWxvYWQgJiYgcGF5bG9hZC5mbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIEZpcmUgbm90aWZpY2F0aW9ucy5cbiAgICAgICAgcGF5bG9hZC5mbGFncy5mb3JFYWNoKChmbGFnKSA9PiB7XG4gICAgICAgICAgLy8gT25seSBhcHBseSBhIG5vdGlmaWNhdGlvbiBpZiB0aGUgZmxhZyBjaGFuZ2VkIHN0YXRlLlxuICAgICAgICAgIGlmIChzdGF0ZS50aHJvdHRsZWRfc3RhdGUgJiYgIXN0YXRlLnRocm90dGxlZF9zdGF0ZS5mbGFncy5pbmNsdWRlcyhmbGFnKSkge1xuICAgICAgICAgICAgY29uc3QgcHJldmlvdXNFdmVudCA9IGZsYWcudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdwcmV2aW91c2x5JylcbiAgICAgICAgICAgIGxldCBuOiBBcHBQdXNoTm90aWZpY2F0aW9uID0ge1xuICAgICAgICAgICAgICBpZDogZmxhZyxcbiAgICAgICAgICAgICAgdGl0bGU6IGZsYWcsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBtYXkgbGVhZCB0byBhIHRocm90dGxlIGNvbmRpdGlvbiBhbmQgcmVzdWx0IGluIGEgZmFpbGVkIHByaW50JyxcbiAgICAgICAgICAgICAgdG86ICdodHRwczovL3d3dy5yYXNwYmVycnlwaS5jb20vZG9jdW1lbnRhdGlvbi9jb21wdXRlcnMvcmFzcGJlcnJ5LXBpLmh0bWwjZnJlcXVlbmN5LW1hbmFnZW1lbnQtYW5kLXRoZXJtYWwtY29udHJvbCcsXG4gICAgICAgICAgICAgIHR5cGU6IChwcmV2aW91c0V2ZW50KSA/ICdpbmZvJyA6ICdlcnJvcicsXG4gICAgICAgICAgICAgIHNuYWNrYmFyOiAhcHJldmlvdXNFdmVudCwgLy8gU25hY2tiYXIgb25seSBpZiBub3QgYSBwcmV2aW91c2x5IGVuY291bnRlcmVkIGV2ZW50LlxuICAgICAgICAgICAgICBtZXJnZTogdHJ1ZSwgLy8gTWVyZ2UgaWYgaXQgd2FzIGEgcHJldmlvdXNseSBlbmNvdW50ZXJlZCBldmVudC5cbiAgICAgICAgICAgICAgY2xlYXI6ICFwcmV2aW91c0V2ZW50LCAvLyBEb250IGFsbG93IHRoZSB1c2VyIHRvIGNsZWFyIGlmIGl0IHdhcyBhIHByZXZpb3VzbHkgZW5jb3VudGVyZWQgZXZlbnQuXG4gICAgICAgICAgICAgIG5vQ291bnQ6IHByZXZpb3VzRXZlbnQgLy8gRG9udCBhZGQgdG8gdGhlIGNvdW50ZXIgaWYgaXQgd2FzIGEgcHJldmlvdXNseSBlbmNvdW50ZXJlZCBldmVudC5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIHRoZSB0ZW1wZXJhdHVyZSBpY29uLlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAoZmxhZyA9PT0gJ1RlbXBlcmF0dXJlIExpbWl0IEFjdGl2ZScgfHwgZmxhZyA9PT0gJ0ZyZXF1ZW5jeSBDYXBwZWQnKSAmJlxuICAgICAgICAgICAgICBzdGF0ZS5jcHVfdGVtcFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIG4gPSB7XG4gICAgICAgICAgICAgICAgLi4ubixcbiAgICAgICAgICAgICAgICBzdWZmaXg6IGAke3N0YXRlLmNwdV90ZW1wLnRvRml4ZWQoMCl9PHNtYWxsPsKwQzwvc21hbGw+YCxcbiAgICAgICAgICAgICAgICBzdWZmaXhJY29uOiAnJHRlbXBFcnJvcidcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBOb3QgYSBwcmV2aW91cyBldmVudCwgYWRqdXN0IHRoZSBkZXNjcmlwdGlvbi5cbiAgICAgICAgICAgIGlmICghcHJldmlvdXNFdmVudCkge1xuICAgICAgICAgICAgICBuID0ge1xuICAgICAgICAgICAgICAgIC4uLm4sXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUaGlzIG1heSBsZWFkIHRvIGEgZmFpbGVkIHByaW50J1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRpc3BhdGNoKCdub3RpZmljYXRpb25zL3B1c2hOb3RpZmljYXRpb24nLCBuLCB7IHJvb3Q6IHRydWUgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGNvbW1pdCgnc2V0TW9vbnJha2VyU3RhdHMnLCB7IHRocm90dGxlZF9zdGF0ZTogcGF5bG9hZCB9KVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFJaEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBRXhCLFNBQVMsZ0JBQWdCO0FBQ3pCLE9BQU8sVUFBVTtBQUNqQixTQUFTLEtBQUssYUFBYTtBQUUzQixJQUFJO0FBRUcsYUFBTSxVQUE4QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSXpELE1BQU0sTUFBTyxFQUFFLE9BQU8sR0FBRztBQUN2QixXQUFPLFVBQVU7QUFBQSxFQUNuQjtBQUFBLEVBRUEsTUFBTSxZQUFhLEVBQUUsT0FBTyxHQUFHO0FBQzdCLFdBQU8sZ0JBQWdCO0FBQUEsRUFDekI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE1BQU0sZUFBZ0IsRUFBRSxTQUFTLEdBQUcsU0FBUztBQUMzQyxRQUNFLFFBQVEsY0FDUixRQUFRLFdBQVcsU0FBUyxHQUM1QjtBQUNBLFlBQU0sbUJBQTRFLFFBQVE7QUFDMUYsaUJBQVcsT0FBTyxrQkFBa0I7QUFDbEMsY0FBTSxZQUFZLGlCQUFpQixHQUFHO0FBQ3RDLFlBQUksUUFBUSxXQUFXLFNBQVMsVUFBVSxJQUFJLEdBQUc7QUFDL0MsbUJBQVMsVUFBVSxVQUFVLFFBQVcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBLFFBQ3hEO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLHlCQUEwQixFQUFFLE9BQU8sU0FBUyxHQUFHO0FBQ25ELFVBQU0sbUJBQW1CLE1BQU0sS0FBSyxxQkFBcUI7QUFFekQsVUFBTSx1QkFBdUIsaUJBQWlCLFNBQVMsR0FBRyxJQUN0RCxtQkFDQSxHQUFHLGdCQUFnQjtBQUV2QixRQUNFLE1BQU0sb0JBQW9CLEtBQzFCLE1BQU0sUUFBUSxxQkFBcUIsS0FDbkMsQ0FBQyxJQUFJLHNCQUFzQixRQUFRLHFCQUFxQixHQUN4RDtBQUNBLGVBQVMsa0NBQWtDO0FBQUEsUUFDekMsSUFBSSxpQkFBaUIsZ0JBQWdCO0FBQUEsUUFDckMsT0FBTztBQUFBLFFBQ1AsYUFBYSxLQUFLLEVBQUUsMkNBQTJDLEVBQUUsTUFBTSxhQUFhLFNBQVMsUUFBUSxzQkFBc0IsQ0FBQztBQUFBLFFBQzVILElBQUk7QUFBQSxRQUNKLFNBQVMsS0FBSyxFQUFFLCtCQUErQjtBQUFBLFFBQy9DLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxNQUNULEdBQUcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBLElBQ25CO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSx1QkFBd0IsRUFBRSxPQUFPLFNBQVMsR0FBRztBQUNqRCxVQUFNLGlCQUFpQixNQUFNLGFBQWEsb0JBQW9CO0FBRTlELFVBQU0scUJBQXFCLGVBQWUsU0FBUyxHQUFHLElBQ2xELGlCQUNBLEdBQUcsY0FBYztBQUVyQixRQUNFLE1BQU0sY0FBYyxLQUNwQixNQUFNLFFBQVEsbUJBQW1CLEtBQ2pDLENBQUMsSUFBSSxvQkFBb0IsUUFBUSxtQkFBbUIsR0FDcEQ7QUFDQSxlQUFTLGtDQUFrQztBQUFBLFFBQ3pDLElBQUksZUFBZSxjQUFjO0FBQUEsUUFDakMsT0FBTztBQUFBLFFBQ1AsYUFBYSxLQUFLLEVBQUUsMkNBQTJDLEVBQUUsTUFBTSxXQUFXLFNBQVMsUUFBUSxvQkFBb0IsQ0FBQztBQUFBLFFBQ3hILElBQUk7QUFBQSxRQUNKLFNBQVMsS0FBSyxFQUFFLCtCQUErQjtBQUFBLFFBQy9DLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxNQUNULEdBQUcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBLElBQ25CO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxhQUFjLEVBQUUsUUFBUSxVQUFVLE1BQU0sR0FBRyxTQUFxQjtBQUdwRSxrQkFBYyxZQUFZO0FBQzFCLGtCQUFjLGFBQWE7QUFDM0Isa0JBQWMsaUJBQWlCO0FBQy9CLGtCQUFjLGtCQUFrQjtBQUVoQyxXQUFPLGlCQUFpQixPQUFPO0FBTy9CLFFBQUksTUFBTSxtQkFBbUIsS0FBSyxRQUFRLHdCQUF3QixTQUFTLFFBQVEsR0FBRztBQUNwRixvQkFBYyxvQkFBb0IsUUFBUTtBQUFBLElBQzVDO0FBRUEsYUFBUywwQkFBMEI7QUFFbkMsUUFBSSxRQUFRLGlCQUFpQixTQUFTO0FBR3BDLFVBQUksTUFBTSxtQkFBbUIsRUFBRyxVQUFTLGtCQUFrQixPQUFPO0FBQ2xFLGFBQU8sb0JBQW9CLE1BQU0saUJBQWlCLENBQUM7QUFDbkQsbUJBQWEsWUFBWTtBQUN6QixxQkFBZSxPQUFPLFdBQVcsTUFBTTtBQUNyQyxzQkFBYyxXQUFXO0FBQUEsTUFDM0IsR0FBRyxRQUFRLGtCQUFrQjtBQUFBLElBQy9CLE9BQU87QUFFTCxhQUFPLG9CQUFvQixDQUFDO0FBQzVCLGVBQVMsa0JBQWtCLE9BQU87QUFDbEMsb0JBQWMsbUJBQW1CO0FBQUEsSUFDbkM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGVBQWdCLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDekMsUUFBSSxRQUFRLFFBQVE7QUFDbEIsYUFBTyxtQkFBbUIsUUFBUSxNQUFNO0FBQUEsSUFDMUM7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGVBQWdCLEdBQUcsU0FBdUU7QUFDOUYsUUFBSSxTQUFTLFVBQVUsT0FBTyxLQUFLLFFBQVEsTUFBTSxFQUFFLFNBQVMsR0FBRztBQUM3RCxZQUFNLFVBQVUsT0FBTyxPQUFPLFFBQVEsTUFBTSxFQUN6QyxLQUFLLElBQUk7QUFFWixlQUFTLE1BQU0sU0FBUyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQUEsSUFDM0MsV0FBVyxTQUFTLGVBQWUsUUFBUSxZQUFZLFFBQVE7QUFDN0QsWUFBTSxlQUFlLFFBQVEsWUFDMUIsSUFBSSxJQUFJLFNBQVMsVUFBVSxFQUMzQixLQUFLLElBQUk7QUFDWixZQUFNLFVBQVUsS0FBSyxHQUFHLG1DQUFtQyxHQUFHLEVBQUUsYUFBYSxDQUFDO0FBRTlFLGVBQVMsTUFBTSxTQUFTLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFBQSxJQUM3QztBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sbUJBQW9CLEVBQUUsUUFBUSxTQUFTLEdBQUcsU0FBUztBQUN2RCxRQUFJLFdBQVcsUUFBUSxpQkFBaUI7QUFDdEMsWUFBTSxTQUFTLDJCQUEyQixRQUFRLGVBQWU7QUFBQSxJQUNuRTtBQUNBLFdBQU8scUJBQXFCLE9BQU87QUFHbkMsUUFDRSxRQUFRLG1CQUNSLGVBQWUsUUFBUSxtQkFDdkIsQ0FBQyxNQUFNLFFBQVEsUUFBUSxlQUFlLEdBQ3RDO0FBQ0EsWUFBTSxJQUFJLFFBQVE7QUFDbEIsVUFBSSxFQUFFLGFBQWEsS0FBSztBQUN0QixlQUFPLHdCQUF3QjtBQUFBLFVBQzdCLE1BQU07QUFBQSxVQUNOLFdBQVc7QUFBQSxVQUNYLE1BQU07QUFBQSxZQUNKLE1BQU0sSUFBSSxLQUFLLEVBQUUsT0FBTyxHQUFJO0FBQUEsWUFDNUIsTUFBTSxFQUFFLFVBQVUsUUFBUSxDQUFDO0FBQUEsVUFDN0I7QUFBQSxRQUNGLEdBQUcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBLE1BQ25CO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sb0JBQXFCLEVBQUUsUUFBUSxTQUFTLEdBQUcsU0FBdUM7QUFDdEYsV0FBTyxpQkFBaUIsT0FBTztBQUUvQixhQUFTLHdCQUF3QjtBQUFBLEVBQ25DO0FBQUEsRUFFQSxNQUFNLHFCQUFzQixFQUFFLE9BQU8sR0FBRyxTQUErQjtBQUNyRSxXQUFPLHlCQUF5QixPQUFPO0FBQUEsRUFDekM7QUFBQSxFQUVBLE1BQU0sMkJBQTRCLEVBQUUsT0FBTyxHQUFHLFNBQXdEO0FBQ3BHLFVBQU0sRUFBRSxXQUFXLGdCQUFnQixJQUFJLFFBQVEsWUFBWTtBQUUzRCxXQUFPLCtCQUErQixFQUFFLGlCQUFpQixXQUFXLFFBQVEsVUFBVSxDQUFDO0FBQUEsRUFDekY7QUFBQSxFQUVBLE1BQU0sc0JBQXVCLEVBQUUsT0FBTyxHQUFHLFNBQXVCO0FBQzlELFdBQU8sbUJBQW1CLE9BQU87QUFBQSxFQUNuQztBQUFBLEVBRUEsTUFBTSx3QkFBeUIsRUFBRSxRQUFRLFVBQVUsTUFBTSxHQUFHLFNBQStCO0FBQ3pGLFFBQUksU0FBUztBQUVYLFVBQUksV0FBVyxRQUFRLE1BQU0sU0FBUyxHQUFHO0FBRXZDLGdCQUFRLE1BQU0sUUFBUSxDQUFDLFNBQVM7QUFFOUIsY0FBSSxNQUFNLG1CQUFtQixDQUFDLE1BQU0sZ0JBQWdCLE1BQU0sU0FBUyxJQUFJLEdBQUc7QUFDeEUsa0JBQU0sZ0JBQWdCLEtBQUssWUFBWSxFQUFFLFdBQVcsWUFBWTtBQUNoRSxnQkFBSSxJQUF5QjtBQUFBLGNBQzNCLElBQUk7QUFBQSxjQUNKLE9BQU87QUFBQSxjQUNQLGFBQWE7QUFBQSxjQUNiLElBQUk7QUFBQSxjQUNKLE1BQU8sZ0JBQWlCLFNBQVM7QUFBQSxjQUNqQyxVQUFVLENBQUM7QUFBQTtBQUFBLGNBQ1gsT0FBTztBQUFBO0FBQUEsY0FDUCxPQUFPLENBQUM7QUFBQTtBQUFBLGNBQ1IsU0FBUztBQUFBO0FBQUEsWUFDWDtBQUdBLGlCQUNHLFNBQVMsOEJBQThCLFNBQVMsdUJBQ2pELE1BQU0sVUFDTjtBQUNBLGtCQUFJO0FBQUEsZ0JBQ0YsR0FBRztBQUFBLGdCQUNILFFBQVEsR0FBRyxNQUFNLFNBQVMsUUFBUSxDQUFDLENBQUM7QUFBQSxnQkFDcEMsWUFBWTtBQUFBLGNBQ2Q7QUFBQSxZQUNGO0FBR0EsZ0JBQUksQ0FBQyxlQUFlO0FBQ2xCLGtCQUFJO0FBQUEsZ0JBQ0YsR0FBRztBQUFBLGdCQUNILGFBQWE7QUFBQSxjQUNmO0FBQUEsWUFDRjtBQUVBLHFCQUFTLGtDQUFrQyxHQUFHLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFBQSxVQUM5RDtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFFQSxhQUFPLHFCQUFxQixFQUFFLGlCQUFpQixRQUFRLENBQUM7QUFBQSxJQUMxRDtBQUFBLEVBQ0Y7QUFDRjsiLCJuYW1lcyI6W119