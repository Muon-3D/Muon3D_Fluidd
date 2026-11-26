import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState } from "/src/store/config/state.ts";
import { Globals } from "/src/globals.ts";
import { cloneDeep, mergeWith, set } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import { v4 as uuidv4 } from "/.vite-e2e/4291/deps/uuid.js?v=9b9fafc7";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { DEFAULT_UI_STYLE } from "/src/util/ui-style.ts";
import { migrateLegacyAnimations } from "/src/services/m1-3d/device-settings.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  /**
   * Inits UI settings from the db
   */
  setInitUiSettings(state, payload) {
    if (payload) {
      if (payload.theme) {
        if (payload.theme.color == null && "currentTheme" in payload.theme && typeof payload.theme.currentTheme === "object" && payload.theme.currentTheme != null && "primary" in payload.theme.currentTheme && typeof payload.theme.currentTheme.primary === "string") {
          consola.debug("Converting legacy theme color");
          payload.theme.color = payload.theme.currentTheme.primary;
          delete payload.theme.currentTheme;
        }
        const logoSrc = payload.theme.logo?.src;
        if (logoSrc?.startsWith("/")) {
          payload.theme.logo.src = logoSrc.substring(1);
        }
        payload.theme.style = DEFAULT_UI_STYLE;
      }
      migrateLegacyAnimations(payload.gcodePreview?.showAnimations);
      const mergedSettings = mergeWith(
        cloneDeep(state.uiSettings),
        payload,
        (dest, src) => Array.isArray(dest) ? src : void 0
      );
      Vue.set(state, "uiSettings", mergedSettings);
      state.sharedPersonal = null;
    }
  },
  setPersonalKey(state, payload) {
    state.personalKey = payload;
  },
  setSharedPersonal(state, payload) {
    state.sharedPersonal = payload;
  },
  /** The personal settings in effect: someone's own over the printer's. */
  setPersonalValues(state, payload) {
    Object.assign(state.uiSettings.theme, payload.theme);
    Object.assign(state.uiSettings.general, payload.general);
  },
  /**
   * Sets the API and Socket URLS on first load and
   * ensure the instance is configured in local storage
   */
  // The style restored from this browser, until the printer's settings load.
  setRestoredUiStyle(state, payload) {
    state.uiSettings.theme.style = payload;
  },
  setInitApiConfig(state, payload) {
    state.apiUrl = payload.apiUrl;
    state.socketUrl = payload.socketUrl;
    state.authKey = payload.authKey || "";
    state.discovered = payload.discovered === true;
    if (payload.name && payload.name !== "") state.uiSettings.general.instanceName = payload.name;
  },
  setInitHostConfig(state, payload) {
    state.hostConfig.blacklist = payload.blacklist;
    state.hostConfig.endpoints = payload.endpoints;
    state.hostConfig.hosted = payload.hosted;
    state.hostConfig.themePresets = payload.themePresets;
  },
  setInitInstances(state, payload) {
    let instances = [];
    const apiConfig = payload.apiConfig;
    const uiSettings = state.uiSettings;
    if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
      instances = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY]);
    }
    const i = instances.findIndex((instance) => instance.apiUrl === payload.apiConfig.apiUrl);
    if (i === -1) {
      if ((uiSettings || uiSettings === null) && (apiConfig && apiConfig.apiUrl !== "" && apiConfig.socketUrl !== "")) {
        instances.forEach((instance) => {
          instance.active = false;
        });
        instances.push({ ...apiConfig, active: true, name: state.uiSettings.general.instanceName });
      }
    } else {
      instances.forEach((instance, index) => {
        instance.active = index === i;
        if (index === i && instance.name !== "") {
          instance.name = state.uiSettings.general.instanceName;
        }
      });
    }
    localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(instances));
    Vue.set(state, "instances", instances);
  },
  setLanInstances(state, payload) {
    Vue.set(state, "lanInstances", payload);
  },
  setUpdateInstanceName(state, payload) {
    const index = state.instances.findIndex((instance) => instance.apiUrl === payload.apiUrl);
    if (index > -1) {
      const instance = state.instances[index];
      Vue.set(state.instances, index, { ...instance, ...payload });
    }
    localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(state.instances));
  },
  /**
   * A saved printer answered somewhere else, or said who it is: keep its new
   * address and its EndpointId. `payload.apiUrl` is the address it was saved at.
   */
  setRelocateInstance(state, payload) {
    const index = state.instances.findIndex((instance) => instance.apiUrl === payload.apiUrl);
    if (index < 0) return;
    const mover = state.instances[index];
    const moved = payload.changes.apiUrl;
    const occupant = moved && moved !== payload.apiUrl ? state.instances.find((i) => i.apiUrl === moved) : void 0;
    const endpointId = payload.changes.endpointId ?? mover.endpointId;
    if (!occupant) {
      Vue.set(state.instances, index, { ...mover, ...payload.changes });
    } else if (!occupant.endpointId || occupant.endpointId === endpointId) {
      if (!mover.active) state.instances.splice(index, 1);
    } else if (!occupant.active) {
      state.instances.splice(state.instances.indexOf(occupant), 1);
      const i = state.instances.indexOf(mover);
      Vue.set(state.instances, i, { ...mover, ...payload.changes });
    } else {
      return;
    }
    localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(state.instances));
  },
  setRemoveInstance(state, payload) {
    const instances = state.instances;
    const i = instances.findIndex((instance) => instance.apiUrl === payload.apiUrl);
    if (i >= 0) {
      instances.splice(i, 1);
      Vue.set(state, "instances", instances);
      localStorage.setItem(Globals.LOCAL_INSTANCES_STORAGE_KEY, JSON.stringify(instances));
    }
  },
  /**
   * This should only be used on properties that have a default state in the store
   * otherwise they will not be reactive.
   */
  setSaveByPath(state, payload) {
    set(state, payload.path, payload.value);
  },
  /**
   * Update / Add a temperature preset
   */
  setPreset(state, payload) {
    if (payload.id === -1) {
      payload.id = uuidv4();
      state.uiSettings.dashboard.tempPresets.push(payload);
    } else {
      const i = state.uiSettings.dashboard.tempPresets.findIndex((preset) => preset.id === payload.id);
      if (i >= 0) {
        Vue.set(state.uiSettings.dashboard.tempPresets, i, payload);
      } else {
        state.uiSettings.dashboard.tempPresets.push(payload);
      }
    }
  },
  /**
   * Remove a preset
   */
  setRemovePreset(state, payload) {
    const i = state.uiSettings.dashboard.tempPresets.findIndex((preset) => preset.id === payload.id);
    if (i >= 0) state.uiSettings.dashboard.tempPresets.splice(i, 1);
  },
  setFileSystemActiveFilters(state, payload) {
    Vue.set(state.uiSettings.fileSystem.activeFilters, payload.root, payload.value);
  },
  setFileSystemSortBy(state, payload) {
    Vue.set(state.uiSettings.fileSystem.sortBy, payload.root, payload.value);
  },
  setFileSystemSortDesc(state, payload) {
    Vue.set(state.uiSettings.fileSystem.sortDesc, payload.root, payload.value);
  },
  setContainerColumnCount(state, payload) {
    state.containerColumnCount = payload;
  },
  /**
   * Toggle a tables header state based on its name and key.
   */
  setUpdateHeader(state, payload) {
    const header = payload.header;
    const keyBy = header.key ? "key" : "value";
    const key = header[keyBy];
    const headers = state.uiSettings.tableHeaders[payload.name];
    if (headers) {
      const i = headers.findIndex((item) => {
        return item[keyBy] === key;
      });
      if (i >= 0) {
        Vue.set(headers, i, {
          ...headers[i],
          visible: header.visible
        });
      } else {
        const o = {
          value: header.value,
          visible: header.visible
        };
        if (keyBy === "key") o.key = header.key;
        headers.push(o);
      }
    }
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgQ29uZmlnU3RhdGUsIFVpU2V0dGluZ3MsIFNhdmVCeVBhdGgsIEluc3RhbmNlQ29uZmlnLCBJbml0Q29uZmlnLCBVaVN0eWxlLCBQZXJzb25hbFNldHRpbmdzIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgeyBHbG9iYWxzIH0gZnJvbSAnQC9nbG9iYWxzJ1xuaW1wb3J0IHsgY2xvbmVEZWVwLCBtZXJnZVdpdGgsIHNldCB9IGZyb20gJ2xvZGFzaC1lcydcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnXG5pbXBvcnQgdHlwZSB7IEFwcFRhYmxlSGVhZGVyIH0gZnJvbSAnQC90eXBlcydcbmltcG9ydCB0eXBlIHsgQXBwVGFibGVQYXJ0aWFsSGVhZGVyIH0gZnJvbSAnQC90eXBlcy90YWJsZWhlYWRlcnMnXG5pbXBvcnQgdHlwZSB7IEZpbGVGaWx0ZXJUeXBlIH0gZnJvbSAnLi4vZmlsZXMvdHlwZXMnXG5pbXBvcnQgY29uc29sYSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHsgREVGQVVMVF9VSV9TVFlMRSB9IGZyb20gJ0AvdXRpbC91aS1zdHlsZSdcbmltcG9ydCB7IG1pZ3JhdGVMZWdhY3lBbmltYXRpb25zIH0gZnJvbSAnQC9zZXJ2aWNlcy9tMS0zZC9kZXZpY2Utc2V0dGluZ3MnXG5cbmV4cG9ydCBjb25zdCBtdXRhdGlvbnM6IE11dGF0aW9uVHJlZTxDb25maWdTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBzdGF0ZVxuICAgKi9cbiAgc2V0UmVzZXQgKHN0YXRlKSB7XG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwgZGVmYXVsdFN0YXRlKCkpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEluaXRzIFVJIHNldHRpbmdzIGZyb20gdGhlIGRiXG4gICAqL1xuICBzZXRJbml0VWlTZXR0aW5ncyAoc3RhdGUsIHBheWxvYWQ6IFBhcnRpYWw8VWlTZXR0aW5ncz4pIHtcbiAgICBpZiAocGF5bG9hZCkge1xuICAgICAgaWYgKHBheWxvYWQudGhlbWUpIHtcbiAgICAgICAgLy8gY2hlY2sgZm9yIGxlZ2FjeSB0aGVtZSBjb2xvclxuICAgICAgICBpZiAoXG4gICAgICAgICAgcGF5bG9hZC50aGVtZS5jb2xvciA9PSBudWxsICYmXG4gICAgICAgICAgJ2N1cnJlbnRUaGVtZScgaW4gcGF5bG9hZC50aGVtZSAmJlxuICAgICAgICAgIHR5cGVvZiBwYXlsb2FkLnRoZW1lLmN1cnJlbnRUaGVtZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICBwYXlsb2FkLnRoZW1lLmN1cnJlbnRUaGVtZSAhPSBudWxsICYmXG4gICAgICAgICAgJ3ByaW1hcnknIGluIHBheWxvYWQudGhlbWUuY3VycmVudFRoZW1lICYmXG4gICAgICAgICAgdHlwZW9mIHBheWxvYWQudGhlbWUuY3VycmVudFRoZW1lLnByaW1hcnkgPT09ICdzdHJpbmcnXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnNvbGEuZGVidWcoJ0NvbnZlcnRpbmcgbGVnYWN5IHRoZW1lIGNvbG9yJylcblxuICAgICAgICAgIHBheWxvYWQudGhlbWUuY29sb3IgPSBwYXlsb2FkLnRoZW1lLmN1cnJlbnRUaGVtZS5wcmltYXJ5XG5cbiAgICAgICAgICBkZWxldGUgcGF5bG9hZC50aGVtZS5jdXJyZW50VGhlbWVcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxvZ29TcmMgPSBwYXlsb2FkLnRoZW1lLmxvZ28/LnNyY1xuXG4gICAgICAgIGlmIChsb2dvU3JjPy5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICBwYXlsb2FkLnRoZW1lLmxvZ28uc3JjID0gbG9nb1NyYy5zdWJzdHJpbmcoMSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsYXNzIGlzIHRoZSBvbmx5IHN0eWxlLiBBIHRoZW1lIHNhdmVkIGJlZm9yZSBzdHlsZXMgZXhpc3RlZCBoYXNcbiAgICAgICAgLy8gbm9uZSwgYW5kIG9uZSBzYXZlZCBhcyAnZmxhdCcgKHJldGlyZWQpIHJlYWRzIGFzIGdsYXNzIHRvby5cbiAgICAgICAgcGF5bG9hZC50aGVtZS5zdHlsZSA9IERFRkFVTFRfVUlfU1RZTEVcbiAgICAgIH1cblxuICAgICAgbWlncmF0ZUxlZ2FjeUFuaW1hdGlvbnMocGF5bG9hZC5nY29kZVByZXZpZXc/LnNob3dBbmltYXRpb25zKVxuXG4gICAgICBjb25zdCBtZXJnZWRTZXR0aW5ncyA9IG1lcmdlV2l0aChcbiAgICAgICAgY2xvbmVEZWVwKHN0YXRlLnVpU2V0dGluZ3MpLFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICAoZGVzdCwgc3JjKSA9PiBBcnJheS5pc0FycmF5KGRlc3QpID8gc3JjIDogdW5kZWZpbmVkXG4gICAgICApXG5cbiAgICAgIFZ1ZS5zZXQoc3RhdGUsICd1aVNldHRpbmdzJywgbWVyZ2VkU2V0dGluZ3MpXG4gICAgICAvLyBUaGUgcHJpbnRlci13aWRlIHZhbHVlcyBhcmUgcmVhZCBhZ2FpbiBmcm9tIHdoYXQganVzdCBsb2FkZWQuXG4gICAgICBzdGF0ZS5zaGFyZWRQZXJzb25hbCA9IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgc2V0UGVyc29uYWxLZXkgKHN0YXRlLCBwYXlsb2FkOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgc3RhdGUucGVyc29uYWxLZXkgPSBwYXlsb2FkXG4gIH0sXG5cbiAgc2V0U2hhcmVkUGVyc29uYWwgKHN0YXRlLCBwYXlsb2FkOiBQZXJzb25hbFNldHRpbmdzIHwgbnVsbCkge1xuICAgIHN0YXRlLnNoYXJlZFBlcnNvbmFsID0gcGF5bG9hZFxuICB9LFxuXG4gIC8qKiBUaGUgcGVyc29uYWwgc2V0dGluZ3MgaW4gZWZmZWN0OiBzb21lb25lJ3Mgb3duIG92ZXIgdGhlIHByaW50ZXIncy4gKi9cbiAgc2V0UGVyc29uYWxWYWx1ZXMgKHN0YXRlLCBwYXlsb2FkOiBSZXF1aXJlZDxQZXJzb25hbFNldHRpbmdzPikge1xuICAgIE9iamVjdC5hc3NpZ24oc3RhdGUudWlTZXR0aW5ncy50aGVtZSwgcGF5bG9hZC50aGVtZSlcbiAgICBPYmplY3QuYXNzaWduKHN0YXRlLnVpU2V0dGluZ3MuZ2VuZXJhbCwgcGF5bG9hZC5nZW5lcmFsKVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBBUEkgYW5kIFNvY2tldCBVUkxTIG9uIGZpcnN0IGxvYWQgYW5kXG4gICAqIGVuc3VyZSB0aGUgaW5zdGFuY2UgaXMgY29uZmlndXJlZCBpbiBsb2NhbCBzdG9yYWdlXG4gICAqL1xuICAvLyBUaGUgc3R5bGUgcmVzdG9yZWQgZnJvbSB0aGlzIGJyb3dzZXIsIHVudGlsIHRoZSBwcmludGVyJ3Mgc2V0dGluZ3MgbG9hZC5cbiAgc2V0UmVzdG9yZWRVaVN0eWxlIChzdGF0ZSwgcGF5bG9hZDogVWlTdHlsZSkge1xuICAgIHN0YXRlLnVpU2V0dGluZ3MudGhlbWUuc3R5bGUgPSBwYXlsb2FkXG4gIH0sXG5cbiAgc2V0SW5pdEFwaUNvbmZpZyAoc3RhdGUsIHBheWxvYWQpIHtcbiAgICBzdGF0ZS5hcGlVcmwgPSBwYXlsb2FkLmFwaVVybFxuICAgIHN0YXRlLnNvY2tldFVybCA9IHBheWxvYWQuc29ja2V0VXJsXG4gICAgc3RhdGUuYXV0aEtleSA9IHBheWxvYWQuYXV0aEtleSB8fCAnJ1xuICAgIHN0YXRlLmRpc2NvdmVyZWQgPSBwYXlsb2FkLmRpc2NvdmVyZWQgPT09IHRydWVcbiAgICBpZiAocGF5bG9hZC5uYW1lICYmIHBheWxvYWQubmFtZSAhPT0gJycpIHN0YXRlLnVpU2V0dGluZ3MuZ2VuZXJhbC5pbnN0YW5jZU5hbWUgPSBwYXlsb2FkLm5hbWVcbiAgfSxcblxuICBzZXRJbml0SG9zdENvbmZpZyAoc3RhdGUsIHBheWxvYWQpIHtcbiAgICBzdGF0ZS5ob3N0Q29uZmlnLmJsYWNrbGlzdCA9IHBheWxvYWQuYmxhY2tsaXN0XG4gICAgc3RhdGUuaG9zdENvbmZpZy5lbmRwb2ludHMgPSBwYXlsb2FkLmVuZHBvaW50c1xuICAgIHN0YXRlLmhvc3RDb25maWcuaG9zdGVkID0gcGF5bG9hZC5ob3N0ZWRcbiAgICBzdGF0ZS5ob3N0Q29uZmlnLnRoZW1lUHJlc2V0cyA9IHBheWxvYWQudGhlbWVQcmVzZXRzXG4gIH0sXG5cbiAgc2V0SW5pdEluc3RhbmNlcyAoc3RhdGUsIHBheWxvYWQ6IEluaXRDb25maWcpIHtcbiAgICBsZXQgaW5zdGFuY2VzOiBJbnN0YW5jZUNvbmZpZ1tdID0gW11cbiAgICBjb25zdCBhcGlDb25maWcgPSBwYXlsb2FkLmFwaUNvbmZpZ1xuICAgIC8vIGNvbnN0IHVpU2V0dGluZ3MgPSBwYXlsb2FkLnVpU2V0dGluZ3NcbiAgICBjb25zdCB1aVNldHRpbmdzID0gc3RhdGUudWlTZXR0aW5nc1xuICAgIGlmIChHbG9iYWxzLkxPQ0FMX0lOU1RBTkNFU19TVE9SQUdFX0tFWSBpbiBsb2NhbFN0b3JhZ2UpIHtcbiAgICAgIGluc3RhbmNlcyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW0dsb2JhbHMuTE9DQUxfSU5TVEFOQ0VTX1NUT1JBR0VfS0VZXSlcbiAgICB9XG5cbiAgICBjb25zdCBpID0gaW5zdGFuY2VzLmZpbmRJbmRleCgoaW5zdGFuY2U6IEluc3RhbmNlQ29uZmlnKSA9PiBpbnN0YW5jZS5hcGlVcmwgPT09IHBheWxvYWQuYXBpQ29uZmlnLmFwaVVybClcbiAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgIGlmIChcbiAgICAgICAgKHVpU2V0dGluZ3MgfHwgdWlTZXR0aW5ncyA9PT0gbnVsbCkgJiZcbiAgICAgICAgKGFwaUNvbmZpZyAmJiBhcGlDb25maWcuYXBpVXJsICE9PSAnJyAmJiBhcGlDb25maWcuc29ja2V0VXJsICE9PSAnJylcbiAgICAgICkge1xuICAgICAgICAvLyBFbnN1cmVzIHdlIG9ubHkgYWRkIGluc3RhbmNlcyB3ZSd2ZSBoYWQgYSBzdWNjZXNzZnVsIGNvbm5lY3Rpb24gdG8uXG4gICAgICAgIGluc3RhbmNlcy5mb3JFYWNoKGluc3RhbmNlID0+IHsgaW5zdGFuY2UuYWN0aXZlID0gZmFsc2UgfSlcbiAgICAgICAgaW5zdGFuY2VzLnB1c2goeyAuLi5hcGlDb25maWcsIGFjdGl2ZTogdHJ1ZSwgbmFtZTogc3RhdGUudWlTZXR0aW5ncy5nZW5lcmFsLmluc3RhbmNlTmFtZSB9KVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0YW5jZXMuZm9yRWFjaCgoaW5zdGFuY2UsIGluZGV4KSA9PiB7XG4gICAgICAgIGluc3RhbmNlLmFjdGl2ZSA9IChpbmRleCA9PT0gaSlcbiAgICAgICAgaWYgKGluZGV4ID09PSBpICYmIGluc3RhbmNlLm5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgaW5zdGFuY2UubmFtZSA9IHN0YXRlLnVpU2V0dGluZ3MuZ2VuZXJhbC5pbnN0YW5jZU5hbWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oR2xvYmFscy5MT0NBTF9JTlNUQU5DRVNfU1RPUkFHRV9LRVksIEpTT04uc3RyaW5naWZ5KGluc3RhbmNlcykpXG4gICAgVnVlLnNldChzdGF0ZSwgJ2luc3RhbmNlcycsIGluc3RhbmNlcylcbiAgfSxcblxuICBzZXRMYW5JbnN0YW5jZXMgKHN0YXRlLCBwYXlsb2FkOiBJbnN0YW5jZUNvbmZpZ1tdKSB7XG4gICAgVnVlLnNldChzdGF0ZSwgJ2xhbkluc3RhbmNlcycsIHBheWxvYWQpXG4gIH0sXG5cbiAgc2V0VXBkYXRlSW5zdGFuY2VOYW1lIChzdGF0ZSwgcGF5bG9hZCkge1xuICAgIGNvbnN0IGluZGV4ID0gc3RhdGUuaW5zdGFuY2VzLmZpbmRJbmRleChpbnN0YW5jZSA9PiBpbnN0YW5jZS5hcGlVcmwgPT09IHBheWxvYWQuYXBpVXJsKVxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICBjb25zdCBpbnN0YW5jZSA9IHN0YXRlLmluc3RhbmNlc1tpbmRleF1cbiAgICAgIFZ1ZS5zZXQoc3RhdGUuaW5zdGFuY2VzLCBpbmRleCwgeyAuLi5pbnN0YW5jZSwgLi4ucGF5bG9hZCB9KVxuICAgIH1cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShHbG9iYWxzLkxPQ0FMX0lOU1RBTkNFU19TVE9SQUdFX0tFWSwgSlNPTi5zdHJpbmdpZnkoc3RhdGUuaW5zdGFuY2VzKSlcbiAgfSxcblxuICAvKipcbiAgICogQSBzYXZlZCBwcmludGVyIGFuc3dlcmVkIHNvbWV3aGVyZSBlbHNlLCBvciBzYWlkIHdobyBpdCBpczoga2VlcCBpdHMgbmV3XG4gICAqIGFkZHJlc3MgYW5kIGl0cyBFbmRwb2ludElkLiBgcGF5bG9hZC5hcGlVcmxgIGlzIHRoZSBhZGRyZXNzIGl0IHdhcyBzYXZlZCBhdC5cbiAgICovXG4gIHNldFJlbG9jYXRlSW5zdGFuY2UgKHN0YXRlLCBwYXlsb2FkOiB7IGFwaVVybDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPEluc3RhbmNlQ29uZmlnPiB9KSB7XG4gICAgY29uc3QgaW5kZXggPSBzdGF0ZS5pbnN0YW5jZXMuZmluZEluZGV4KGluc3RhbmNlID0+IGluc3RhbmNlLmFwaVVybCA9PT0gcGF5bG9hZC5hcGlVcmwpXG4gICAgaWYgKGluZGV4IDwgMCkgcmV0dXJuXG4gICAgY29uc3QgbW92ZXIgPSBzdGF0ZS5pbnN0YW5jZXNbaW5kZXhdXG4gICAgY29uc3QgbW92ZWQgPSBwYXlsb2FkLmNoYW5nZXMuYXBpVXJsXG4gICAgY29uc3Qgb2NjdXBhbnQgPSBtb3ZlZCAmJiBtb3ZlZCAhPT0gcGF5bG9hZC5hcGlVcmxcbiAgICAgID8gc3RhdGUuaW5zdGFuY2VzLmZpbmQoaSA9PiBpLmFwaVVybCA9PT0gbW92ZWQpXG4gICAgICA6IHVuZGVmaW5lZFxuICAgIGNvbnN0IGVuZHBvaW50SWQgPSBwYXlsb2FkLmNoYW5nZXMuZW5kcG9pbnRJZCA/PyBtb3Zlci5lbmRwb2ludElkXG4gICAgaWYgKCFvY2N1cGFudCkge1xuICAgICAgVnVlLnNldChzdGF0ZS5pbnN0YW5jZXMsIGluZGV4LCB7IC4uLm1vdmVyLCAuLi5wYXlsb2FkLmNoYW5nZXMgfSlcbiAgICB9IGVsc2UgaWYgKCFvY2N1cGFudC5lbmRwb2ludElkIHx8IG9jY3VwYW50LmVuZHBvaW50SWQgPT09IGVuZHBvaW50SWQpIHtcbiAgICAgIC8vIFRoZSBuZXcgYWRkcmVzcyBpcyBzYXZlZCBhbHJlYWR5LCBmb3IgdGhpcyBzYW1lIHByaW50ZXI6IGRyb3AgdGhlIGR1cGxpY2F0ZS5cbiAgICAgIGlmICghbW92ZXIuYWN0aXZlKSBzdGF0ZS5pbnN0YW5jZXMuc3BsaWNlKGluZGV4LCAxKVxuICAgIH0gZWxzZSBpZiAoIW9jY3VwYW50LmFjdGl2ZSkge1xuICAgICAgLy8gQW5vdGhlciBwcmludGVyIHdhcyBzYXZlZCB0aGVyZSwgYW5kIHRoaXMgb25lIGFuc3dlcnMgdGhlcmUgbm93OiB0aGF0IGVudHJ5IGlzIHN0YWxlLlxuICAgICAgc3RhdGUuaW5zdGFuY2VzLnNwbGljZShzdGF0ZS5pbnN0YW5jZXMuaW5kZXhPZihvY2N1cGFudCksIDEpXG4gICAgICBjb25zdCBpID0gc3RhdGUuaW5zdGFuY2VzLmluZGV4T2YobW92ZXIpXG4gICAgICBWdWUuc2V0KHN0YXRlLmluc3RhbmNlcywgaSwgeyAuLi5tb3ZlciwgLi4ucGF5bG9hZC5jaGFuZ2VzIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZsdWlkZCBpcyBjb25uZWN0ZWQgdGhyb3VnaCB0aGUgb3RoZXIgZW50cnk6IGxlYXZlIGJvdGggdW50aWwgaXQgaXMgbm90LlxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEdsb2JhbHMuTE9DQUxfSU5TVEFOQ0VTX1NUT1JBR0VfS0VZLCBKU09OLnN0cmluZ2lmeShzdGF0ZS5pbnN0YW5jZXMpKVxuICB9LFxuXG4gIHNldFJlbW92ZUluc3RhbmNlIChzdGF0ZSwgcGF5bG9hZCkge1xuICAgIGNvbnN0IGluc3RhbmNlcyA9IHN0YXRlLmluc3RhbmNlc1xuICAgIGNvbnN0IGkgPSBpbnN0YW5jZXMuZmluZEluZGV4KChpbnN0YW5jZTogSW5zdGFuY2VDb25maWcpID0+IGluc3RhbmNlLmFwaVVybCA9PT0gcGF5bG9hZC5hcGlVcmwpXG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgaW5zdGFuY2VzLnNwbGljZShpLCAxKVxuICAgICAgVnVlLnNldChzdGF0ZSwgJ2luc3RhbmNlcycsIGluc3RhbmNlcylcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEdsb2JhbHMuTE9DQUxfSU5TVEFOQ0VTX1NUT1JBR0VfS0VZLCBKU09OLnN0cmluZ2lmeShpbnN0YW5jZXMpKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIG9uIHByb3BlcnRpZXMgdGhhdCBoYXZlIGEgZGVmYXVsdCBzdGF0ZSBpbiB0aGUgc3RvcmVcbiAgICogb3RoZXJ3aXNlIHRoZXkgd2lsbCBub3QgYmUgcmVhY3RpdmUuXG4gICAqL1xuICBzZXRTYXZlQnlQYXRoIChzdGF0ZSwgcGF5bG9hZDogU2F2ZUJ5UGF0aCkge1xuICAgIHNldChzdGF0ZSwgcGF5bG9hZC5wYXRoLCBwYXlsb2FkLnZhbHVlKVxuICB9LFxuXG4gIC8qKlxuICAgKiBVcGRhdGUgLyBBZGQgYSB0ZW1wZXJhdHVyZSBwcmVzZXRcbiAgICovXG4gIHNldFByZXNldCAoc3RhdGUsIHBheWxvYWQpIHtcbiAgICBpZiAocGF5bG9hZC5pZCA9PT0gLTEpIHtcbiAgICAgIHBheWxvYWQuaWQgPSB1dWlkdjQoKVxuICAgICAgc3RhdGUudWlTZXR0aW5ncy5kYXNoYm9hcmQudGVtcFByZXNldHMucHVzaChwYXlsb2FkKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpID0gc3RhdGUudWlTZXR0aW5ncy5kYXNoYm9hcmQudGVtcFByZXNldHMuZmluZEluZGV4KHByZXNldCA9PiBwcmVzZXQuaWQgPT09IHBheWxvYWQuaWQpXG4gICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgIFZ1ZS5zZXQoc3RhdGUudWlTZXR0aW5ncy5kYXNoYm9hcmQudGVtcFByZXNldHMsIGksIHBheWxvYWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBIGRlZmF1bHQgdGhlIHN0b3JlIGFkZGVkIGJhY2sgaXMgd3JpdHRlbiB0aGUgZmlyc3QgdGltZSBpdCBjaGFuZ2VzLlxuICAgICAgICBzdGF0ZS51aVNldHRpbmdzLmRhc2hib2FyZC50ZW1wUHJlc2V0cy5wdXNoKHBheWxvYWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBwcmVzZXRcbiAgICovXG4gIHNldFJlbW92ZVByZXNldCAoc3RhdGUsIHBheWxvYWQpIHtcbiAgICBjb25zdCBpID0gc3RhdGUudWlTZXR0aW5ncy5kYXNoYm9hcmQudGVtcFByZXNldHMuZmluZEluZGV4KHByZXNldCA9PiBwcmVzZXQuaWQgPT09IHBheWxvYWQuaWQpXG4gICAgLy8gc3BsaWNlKC0xLCAxKSB3b3VsZCByZW1vdmUgdGhlIGxhc3QgcHJlc2V0OiBhIHByZXNldCB0aGF0IGlzIG5vdCB0aGVyZSByZW1vdmVzIG5vdGhpbmcuXG4gICAgaWYgKGkgPj0gMCkgc3RhdGUudWlTZXR0aW5ncy5kYXNoYm9hcmQudGVtcFByZXNldHMuc3BsaWNlKGksIDEpXG4gIH0sXG5cbiAgc2V0RmlsZVN5c3RlbUFjdGl2ZUZpbHRlcnMgKHN0YXRlLCBwYXlsb2FkOiB7IHJvb3Q6IHN0cmluZywgdmFsdWU6IEZpbGVGaWx0ZXJUeXBlW10gfSkge1xuICAgIFZ1ZS5zZXQoc3RhdGUudWlTZXR0aW5ncy5maWxlU3lzdGVtLmFjdGl2ZUZpbHRlcnMsIHBheWxvYWQucm9vdCwgcGF5bG9hZC52YWx1ZSlcbiAgfSxcblxuICBzZXRGaWxlU3lzdGVtU29ydEJ5IChzdGF0ZSwgcGF5bG9hZDogeyByb290OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsIH0pIHtcbiAgICBWdWUuc2V0KHN0YXRlLnVpU2V0dGluZ3MuZmlsZVN5c3RlbS5zb3J0QnksIHBheWxvYWQucm9vdCwgcGF5bG9hZC52YWx1ZSlcbiAgfSxcblxuICBzZXRGaWxlU3lzdGVtU29ydERlc2MgKHN0YXRlLCBwYXlsb2FkOiB7IHJvb3Q6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCBudWxsIH0pIHtcbiAgICBWdWUuc2V0KHN0YXRlLnVpU2V0dGluZ3MuZmlsZVN5c3RlbS5zb3J0RGVzYywgcGF5bG9hZC5yb290LCBwYXlsb2FkLnZhbHVlKVxuICB9LFxuXG4gIHNldENvbnRhaW5lckNvbHVtbkNvdW50IChzdGF0ZSwgcGF5bG9hZDogbnVtYmVyKSB7XG4gICAgc3RhdGUuY29udGFpbmVyQ29sdW1uQ291bnQgPSBwYXlsb2FkXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBhIHRhYmxlcyBoZWFkZXIgc3RhdGUgYmFzZWQgb24gaXRzIG5hbWUgYW5kIGtleS5cbiAgICovXG4gIHNldFVwZGF0ZUhlYWRlciAoc3RhdGUsIHBheWxvYWQ6IHsgbmFtZTogc3RyaW5nOyBoZWFkZXI6IEFwcFRhYmxlSGVhZGVyIH0pIHtcbiAgICBjb25zdCBoZWFkZXIgPSBwYXlsb2FkLmhlYWRlclxuICAgIGNvbnN0IGtleUJ5ID0gKGhlYWRlci5rZXkpXG4gICAgICA/ICdrZXknXG4gICAgICA6ICd2YWx1ZSdcblxuICAgIGNvbnN0IGtleSA9IGhlYWRlcltrZXlCeV1cbiAgICBjb25zdCBoZWFkZXJzOiBBcHBUYWJsZVBhcnRpYWxIZWFkZXJbXSA9IHN0YXRlLnVpU2V0dGluZ3MudGFibGVIZWFkZXJzW3BheWxvYWQubmFtZV1cblxuICAgIGlmIChoZWFkZXJzKSB7XG4gICAgICBjb25zdCBpID0gaGVhZGVycy5maW5kSW5kZXgoaXRlbSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtW2tleUJ5XSA9PT0ga2V5XG4gICAgICB9KVxuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBWdWUuc2V0KGhlYWRlcnMsIGksIHtcbiAgICAgICAgICAuLi5oZWFkZXJzW2ldLFxuICAgICAgICAgIHZpc2libGU6IGhlYWRlci52aXNpYmxlXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBvOiBBcHBUYWJsZVBhcnRpYWxIZWFkZXIgPSB7XG4gICAgICAgICAgdmFsdWU6IGhlYWRlci52YWx1ZSxcbiAgICAgICAgICB2aXNpYmxlOiBoZWFkZXIudmlzaWJsZVxuICAgICAgICB9XG4gICAgICAgIGlmIChrZXlCeSA9PT0gJ2tleScpIG8ua2V5ID0gaGVhZGVyLmtleVxuICAgICAgICBoZWFkZXJzLnB1c2gobylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBR2hCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUN4QixTQUFTLFdBQVcsV0FBVyxXQUFXO0FBQzFDLFNBQVMsTUFBTSxjQUFjO0FBSTdCLE9BQU8sYUFBYTtBQUNwQixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLCtCQUErQjtBQUVqQyxhQUFNLFlBQXVDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJbEQsU0FBVSxPQUFPO0FBQ2YsV0FBTyxPQUFPLE9BQU8sYUFBYSxDQUFDO0FBQUEsRUFDckM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGtCQUFtQixPQUFPLFNBQThCO0FBQ3RELFFBQUksU0FBUztBQUNYLFVBQUksUUFBUSxPQUFPO0FBRWpCLFlBQ0UsUUFBUSxNQUFNLFNBQVMsUUFDdkIsa0JBQWtCLFFBQVEsU0FDMUIsT0FBTyxRQUFRLE1BQU0saUJBQWlCLFlBQ3RDLFFBQVEsTUFBTSxnQkFBZ0IsUUFDOUIsYUFBYSxRQUFRLE1BQU0sZ0JBQzNCLE9BQU8sUUFBUSxNQUFNLGFBQWEsWUFBWSxVQUM5QztBQUNBLGtCQUFRLE1BQU0sK0JBQStCO0FBRTdDLGtCQUFRLE1BQU0sUUFBUSxRQUFRLE1BQU0sYUFBYTtBQUVqRCxpQkFBTyxRQUFRLE1BQU07QUFBQSxRQUN2QjtBQUVBLGNBQU0sVUFBVSxRQUFRLE1BQU0sTUFBTTtBQUVwQyxZQUFJLFNBQVMsV0FBVyxHQUFHLEdBQUc7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