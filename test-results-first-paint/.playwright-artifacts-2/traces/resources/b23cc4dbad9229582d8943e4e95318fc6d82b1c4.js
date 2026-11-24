import { withDefaultMaterials } from "/src/store/config/default-materials.ts";
import __vite__cjsImport1_md5 from "/.vite-e2e/4291/deps/md5.js?v=9b9fafc7"; const md5 = __vite__cjsImport1_md5.__esModule ? __vite__cjsImport1_md5.default : __vite__cjsImport1_md5;
import { Globals } from "/src/globals.ts";
export const getters = {
  /**
   * The name to show for this printer. The stock default instance name is
   * Fluidd's client name and identifies nothing, so fall back to the
   * printer's hostname, then the product name.
   */
  getDisplayName: (state, getters2, rootState) => {
    const name = (state.uiSettings.general.instanceName ?? "").trim();
    if (name && name !== Globals.APP_NAME) return name;
    const hostname = rootState.printer.printer.info?.hostname;
    return hostname || Globals.PRODUCT_NAME;
  },
  getCurrentInstance: (state) => {
    return state.instances.find((instance) => instance.active);
  },
  getInstances: (state) => {
    const instances = [
      ...state.instances,
      ...state.lanInstances.filter(
        (discovered) => !state.instances.some((known) => known.apiUrl === discovered.apiUrl)
      )
    ].sort(
      (a, b) => a.active ? -1 : b.active ? 1 : a.name.localeCompare(b.name)
    );
    return instances;
  },
  getHostConfig: (state) => {
    return state.hostConfig;
  },
  getUiStyle: (state) => {
    return state.uiSettings.theme.style;
  },
  // Charts measure and draw text themselves, so they are told the UI font.
  getChartFontFamily: (state) => {
    return state.uiSettings.theme.style === "glass" ? Globals.CHART_FONT_FAMILY_GLASS : Globals.CHART_FONT_FAMILY;
  },
  /**
   * Return temp presets. Ensure we only return a preset
   * for a known heater or fan, incase things change
   * after a preset has been saved.
   */
  getTempPresets: (state, getters2, rootState, rootGetters) => {
    const originalPresets = withDefaultMaterials(state.uiSettings.dashboard.tempPresets ?? []);
    const presets = [];
    const heaters = rootGetters["printer/getHeaters"];
    const fans = rootGetters["printer/getOutputs"](["temperature_fan"]);
    originalPresets.forEach((originalPreset) => {
      const preset = {
        ...originalPreset,
        values: {}
      };
      heaters.forEach((heater) => {
        if (originalPreset.values[heater.name]) {
          preset.values[heater.name] = { ...originalPreset.values[heater.name] };
        } else {
          preset.values[heater.name] = { value: 0, type: "heater", active: false };
        }
      });
      fans.forEach((fan) => {
        if (originalPreset.values[fan.name]) {
          preset.values[fan.name] = { ...originalPreset.values[fan.name] };
        } else {
          preset.values[fan.name] = { value: 0, type: "fan", active: false };
        }
      });
      presets.push(preset);
    });
    return presets.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  },
  getCustomThemeFile: (state, getters2, rootState, rootGetters) => (filename, extensions) => {
    const files = rootGetters["files/getRootFiles"]("config");
    if (files) {
      for (const extension of extensions) {
        const path = `.fluidd-theme/${filename}${extension}`;
        if (files.some((f) => f.path === path)) {
          return path;
        }
      }
    }
  },
  getMergedTableHeaders: (state, getters2) => (headers, key) => {
    const configured = getters2.getConfiguredTableHeaders(key);
    if (!configured) {
      return headers;
    }
    const merged = [];
    headers.forEach((header) => {
      const keyBy = header.key ? "key" : "value";
      const o = {
        visible: true,
        configurable: false,
        ...header,
        ...configured.find((p) => p[keyBy] === header[keyBy])
      };
      merged.push(o);
    });
    return merged;
  },
  getConfiguredTableHeaders: (state) => (key) => {
    return state.uiSettings.tableHeaders[key];
  },
  getTokenKeys: (state) => {
    const identity = state.discovered ? state.apiUrl : state.authKey || state.apiUrl;
    const hash = identity ? md5(identity) : "";
    return {
      "user-token": `user-token-${hash}`,
      "refresh-token": `refresh-token-${hash}`
    };
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd2l0aERlZmF1bHRNYXRlcmlhbHMgfSBmcm9tICcuL2RlZmF1bHQtbWF0ZXJpYWxzJ1xuaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgQ29uZmlnU3RhdGUsIFRlbXBlcmF0dXJlUHJlc2V0LCBVaVN0eWxlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEhlYXRlciwgRmFuIH0gZnJvbSAnLi4vcHJpbnRlci90eXBlcydcbmltcG9ydCB0eXBlIHsgQXBwVGFibGVIZWFkZXIgfSBmcm9tICdAL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBBcHBUYWJsZVBhcnRpYWxIZWFkZXIgfSBmcm9tICdAL3R5cGVzL3RhYmxlaGVhZGVycydcbmltcG9ydCB0eXBlIHsgTW9vbnJha2VyUm9vdEZpbGUgfSBmcm9tICcuLi9maWxlcy90eXBlcydcbmltcG9ydCBtZDUgZnJvbSAnbWQ1J1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcblxuZXhwb3J0IGNvbnN0IGdldHRlcnM6IEdldHRlclRyZWU8Q29uZmlnU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBUaGUgbmFtZSB0byBzaG93IGZvciB0aGlzIHByaW50ZXIuIFRoZSBzdG9jayBkZWZhdWx0IGluc3RhbmNlIG5hbWUgaXNcbiAgICogRmx1aWRkJ3MgY2xpZW50IG5hbWUgYW5kIGlkZW50aWZpZXMgbm90aGluZywgc28gZmFsbCBiYWNrIHRvIHRoZVxuICAgKiBwcmludGVyJ3MgaG9zdG5hbWUsIHRoZW4gdGhlIHByb2R1Y3QgbmFtZS5cbiAgICovXG4gIGdldERpc3BsYXlOYW1lOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSk6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgbmFtZSA9IChzdGF0ZS51aVNldHRpbmdzLmdlbmVyYWwuaW5zdGFuY2VOYW1lID8/ICcnKS50cmltKClcbiAgICBpZiAobmFtZSAmJiBuYW1lICE9PSBHbG9iYWxzLkFQUF9OQU1FKSByZXR1cm4gbmFtZVxuXG4gICAgY29uc3QgaG9zdG5hbWUgPSByb290U3RhdGUucHJpbnRlci5wcmludGVyLmluZm8/Lmhvc3RuYW1lIGFzIHN0cmluZyB8IHVuZGVmaW5lZFxuXG4gICAgcmV0dXJuIGhvc3RuYW1lIHx8IEdsb2JhbHMuUFJPRFVDVF9OQU1FXG4gIH0sXG5cbiAgZ2V0Q3VycmVudEluc3RhbmNlOiAoc3RhdGUpID0+IHtcbiAgICByZXR1cm4gc3RhdGUuaW5zdGFuY2VzLmZpbmQoaW5zdGFuY2UgPT4gaW5zdGFuY2UuYWN0aXZlKVxuICB9LFxuXG4gIGdldEluc3RhbmNlczogKHN0YXRlKSA9PiB7XG4gICAgY29uc3QgaW5zdGFuY2VzID0gW1xuICAgICAgLi4uc3RhdGUuaW5zdGFuY2VzLFxuICAgICAgLi4uc3RhdGUubGFuSW5zdGFuY2VzLmZpbHRlcihkaXNjb3ZlcmVkID0+XG4gICAgICAgICFzdGF0ZS5pbnN0YW5jZXMuc29tZShrbm93biA9PiBrbm93bi5hcGlVcmwgPT09IGRpc2NvdmVyZWQuYXBpVXJsKVxuICAgICAgKVxuICAgIF0uc29ydCgoYSwgYikgPT5cbiAgICAgIGEuYWN0aXZlXG4gICAgICAgID8gLTFcbiAgICAgICAgOiAoYi5hY3RpdmUgPyAxIDogYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSlcbiAgICApXG4gICAgcmV0dXJuIGluc3RhbmNlc1xuICB9LFxuXG4gIGdldEhvc3RDb25maWc6IChzdGF0ZSkgPT4ge1xuICAgIHJldHVybiBzdGF0ZS5ob3N0Q29uZmlnXG4gIH0sXG5cbiAgZ2V0VWlTdHlsZTogKHN0YXRlKTogVWlTdHlsZSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLnVpU2V0dGluZ3MudGhlbWUuc3R5bGVcbiAgfSxcblxuICAvLyBDaGFydHMgbWVhc3VyZSBhbmQgZHJhdyB0ZXh0IHRoZW1zZWx2ZXMsIHNvIHRoZXkgYXJlIHRvbGQgdGhlIFVJIGZvbnQuXG4gIGdldENoYXJ0Rm9udEZhbWlseTogKHN0YXRlKTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gc3RhdGUudWlTZXR0aW5ncy50aGVtZS5zdHlsZSA9PT0gJ2dsYXNzJ1xuICAgICAgPyBHbG9iYWxzLkNIQVJUX0ZPTlRfRkFNSUxZX0dMQVNTXG4gICAgICA6IEdsb2JhbHMuQ0hBUlRfRk9OVF9GQU1JTFlcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIHRlbXAgcHJlc2V0cy4gRW5zdXJlIHdlIG9ubHkgcmV0dXJuIGEgcHJlc2V0XG4gICAqIGZvciBhIGtub3duIGhlYXRlciBvciBmYW4sIGluY2FzZSB0aGluZ3MgY2hhbmdlXG4gICAqIGFmdGVyIGEgcHJlc2V0IGhhcyBiZWVuIHNhdmVkLlxuICAgKi9cbiAgZ2V0VGVtcFByZXNldHM6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlLCByb290R2V0dGVycykgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsUHJlc2V0czogVGVtcGVyYXR1cmVQcmVzZXRbXSA9IHdpdGhEZWZhdWx0TWF0ZXJpYWxzKHN0YXRlLnVpU2V0dGluZ3MuZGFzaGJvYXJkLnRlbXBQcmVzZXRzID8/IFtdKVxuICAgIGNvbnN0IHByZXNldHM6IFRlbXBlcmF0dXJlUHJlc2V0W10gPSBbXVxuICAgIGNvbnN0IGhlYXRlcnMgPSByb290R2V0dGVyc1sncHJpbnRlci9nZXRIZWF0ZXJzJ11cbiAgICBjb25zdCBmYW5zID0gcm9vdEdldHRlcnNbJ3ByaW50ZXIvZ2V0T3V0cHV0cyddKFsndGVtcGVyYXR1cmVfZmFuJ10pXG5cbiAgICBvcmlnaW5hbFByZXNldHMuZm9yRWFjaCgob3JpZ2luYWxQcmVzZXQ6IFRlbXBlcmF0dXJlUHJlc2V0KSA9PiB7XG4gICAgICBjb25zdCBwcmVzZXQ6IFRlbXBlcmF0dXJlUHJlc2V0ID0ge1xuICAgICAgICAuLi5vcmlnaW5hbFByZXNldCxcbiAgICAgICAgdmFsdWVzOiB7fVxuICAgICAgfVxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBwcmVzZXQgYW5kIGVuc3VyZSB0aGF0O1xuICAgICAgLy8gYSkgYSBnaXZlbiBoZWF0ZXIgYW5kIGZhbiBleGlzdHMgYW5kO1xuICAgICAgLy8gYikgdW5rbm93biBoZWF0ZXJzIGFuZCBmYW5zIGFyZSByZW1vdmVkLlxuICAgICAgLy8gRm9yIGl0ZW1zIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHByZXNldCwgZGVmYXVsdCB0aGVtIHRvIGRpc2FibGVkLlxuICAgICAgaGVhdGVycy5mb3JFYWNoKChoZWF0ZXI6IEhlYXRlcikgPT4ge1xuICAgICAgICBpZiAob3JpZ2luYWxQcmVzZXQudmFsdWVzW2hlYXRlci5uYW1lXSkge1xuICAgICAgICAgIHByZXNldC52YWx1ZXNbaGVhdGVyLm5hbWVdID0geyAuLi5vcmlnaW5hbFByZXNldC52YWx1ZXNbaGVhdGVyLm5hbWVdIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcmVzZXQudmFsdWVzW2hlYXRlci5uYW1lXSA9IHsgdmFsdWU6IDAsIHR5cGU6ICdoZWF0ZXInLCBhY3RpdmU6IGZhbHNlIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIGZhbnMuZm9yRWFjaCgoZmFuOiBGYW4pID0+IHtcbiAgICAgICAgaWYgKG9yaWdpbmFsUHJlc2V0LnZhbHVlc1tmYW4ubmFtZV0pIHtcbiAgICAgICAgICBwcmVzZXQudmFsdWVzW2Zhbi5uYW1lXSA9IHsgLi4ub3JpZ2luYWxQcmVzZXQudmFsdWVzW2Zhbi5uYW1lXSB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJlc2V0LnZhbHVlc1tmYW4ubmFtZV0gPSB7IHZhbHVlOiAwLCB0eXBlOiAnZmFuJywgYWN0aXZlOiBmYWxzZSB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHByZXNldHMucHVzaChwcmVzZXQpXG4gICAgfSlcblxuICAgIHJldHVybiBwcmVzZXRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpXG4gICAgfSlcbiAgfSxcblxuICBnZXRDdXN0b21UaGVtZUZpbGU6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlLCByb290R2V0dGVycykgPT4gKGZpbGVuYW1lOiBzdHJpbmcsIGV4dGVuc2lvbnM6IHN0cmluZ1tdKSA9PiB7XG4gICAgY29uc3QgZmlsZXMgPSByb290R2V0dGVyc1snZmlsZXMvZ2V0Um9vdEZpbGVzJ10oJ2NvbmZpZycpIGFzIE1vb25yYWtlclJvb3RGaWxlW10gfCB1bmRlZmluZWRcblxuICAgIGlmIChmaWxlcykge1xuICAgICAgZm9yIChjb25zdCBleHRlbnNpb24gb2YgZXh0ZW5zaW9ucykge1xuICAgICAgICBjb25zdCBwYXRoID0gYC5mbHVpZGQtdGhlbWUvJHtmaWxlbmFtZX0ke2V4dGVuc2lvbn1gXG5cbiAgICAgICAgaWYgKGZpbGVzLnNvbWUoZiA9PiBmLnBhdGggPT09IHBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhdGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBnZXRNZXJnZWRUYWJsZUhlYWRlcnM6IChzdGF0ZSwgZ2V0dGVycykgPT4gKGhlYWRlcnM6IEFwcFRhYmxlSGVhZGVyW10sIGtleTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY29uZmlndXJlZDogQXBwVGFibGVQYXJ0aWFsSGVhZGVyW10gPSBnZXR0ZXJzLmdldENvbmZpZ3VyZWRUYWJsZUhlYWRlcnMoa2V5KVxuICAgIGlmICghY29uZmlndXJlZCkge1xuICAgICAgcmV0dXJuIGhlYWRlcnNcbiAgICB9XG4gICAgY29uc3QgbWVyZ2VkOiBBcHBUYWJsZUhlYWRlcltdID0gW11cbiAgICBoZWFkZXJzLmZvckVhY2goaGVhZGVyID0+IHtcbiAgICAgIGNvbnN0IGtleUJ5ID0gKGhlYWRlci5rZXkpXG4gICAgICAgID8gJ2tleSdcbiAgICAgICAgOiAndmFsdWUnXG5cbiAgICAgIGNvbnN0IG8gPSB7XG4gICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIC4uLmhlYWRlcixcbiAgICAgICAgLi4uY29uZmlndXJlZC5maW5kKHAgPT4gcFtrZXlCeV0gPT09IGhlYWRlcltrZXlCeV0pXG4gICAgICB9XG5cbiAgICAgIG1lcmdlZC5wdXNoKG8pXG4gICAgfSlcbiAgICByZXR1cm4gbWVyZ2VkXG4gIH0sXG5cbiAgZ2V0Q29uZmlndXJlZFRhYmxlSGVhZGVyczogKHN0YXRlKSA9PiAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gc3RhdGUudWlTZXR0aW5ncy50YWJsZUhlYWRlcnNba2V5XVxuICB9LFxuXG4gIGdldFRva2VuS2V5czogKHN0YXRlKSA9PiB7XG4gICAgLy8gbUROUyByb3dzIGFyZSB1bmF1dGhlbnRpY2F0ZWQgbmV0d29yayBpbnB1dC4gIFRoZWlyIGhvc3RuYW1lIGNhbm5vdFxuICAgIC8vIGF0dGVzdCB0byB0aGUgcmVzb2x2ZWQgYWRkcmVzcywgc28gYSBkaXNjb3ZlcmVkIGVuZHBvaW50IG1heSBvbmx5IHJldXNlXG4gICAgLy8gY3JlZGVudGlhbHMgcHJldmlvdXNseSBzdG9yZWQgZm9yIHRoYXQgZXhhY3QgZW5kcG9pbnQuICBTYXZlZCBpbnN0YW5jZXNcbiAgICAvLyByZXRhaW4gdGhlaXIgc3RhYmxlIHVzZXItY29uZmlndXJlZCBrZXkuXG4gICAgY29uc3QgaWRlbnRpdHkgPSBzdGF0ZS5kaXNjb3ZlcmVkID8gc3RhdGUuYXBpVXJsIDogKHN0YXRlLmF1dGhLZXkgfHwgc3RhdGUuYXBpVXJsKVxuICAgIGNvbnN0IGhhc2ggPSAoaWRlbnRpdHkpID8gbWQ1KGlkZW50aXR5KSA6ICcnXG4gICAgcmV0dXJuIHtcbiAgICAgICd1c2VyLXRva2VuJzogYHVzZXItdG9rZW4tJHtoYXNofWAsXG4gICAgICAncmVmcmVzaC10b2tlbic6IGByZWZyZXNoLXRva2VuLSR7aGFzaH1gXG4gICAgfVxuICB9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