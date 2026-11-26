import { Globals } from "/src/globals.ts";
import __vite__cjsImport1_semver from "/.vite-e2e/4291/deps/semver.js?v=9b9fafc7"; const gte = __vite__cjsImport1_semver["gte"]; const valid = __vite__cjsImport1_semver["valid"];
import { muonFromComponents } from "/src/services/gates/components.ts";
export const getters = {
  /**
   * Get's the current server info
   */
  getInfo: (state) => {
    return state.info;
  },
  getIsMinApiVersion: (state) => (minVersion) => {
    const apiVersion = state.info.api_version_string;
    return apiVersion && valid(apiVersion) && valid(minVersion) && gte(apiVersion, minVersion);
  },
  /**
   * Gets the current system info
   */
  getSystemInfo: (state) => {
    return state.system_info;
  },
  /**
   * Return server config
   */
  getConfig: (state) => {
    return state.config;
  },
  /**
   * Return server process stats
   */
  getProcessStats: (state) => {
    return state.moonraker_stats;
  },
  /**
   * Indicates if a component is enabled
   */
  componentSupport: (state) => (component) => {
    return state.info.components.includes(component);
  },
  /**
   * True on a Muon printer (muon_access or muon_protection reported), false on one with other components, null until server.info has loaded.
   */
  isMuonPrinter: (state) => {
    return muonFromComponents(state.info.components);
  },
  /**
   * Return a list of services.
   * (will come from state.system_info with a moonraker update..)
   */
  getServices: (state) => {
    const available_services = state.system_info?.available_services || [];
    const service_states = state.system_info?.service_state || {};
    const services = [...available_services].sort().map((name) => {
      return name in service_states ? { name, ...service_states[name] } : { name };
    });
    return services;
  },
  /**
   * Maps configuration files to an object representing a config doc link,
   * along with a service name.
   */
  getConfigMapByFilename: (state, getters2, rootState, rootGetters) => (filename) => {
    const configMap = Globals.CONFIG_SERVICE_MAP;
    let item = configMap.find((o) => o.filename?.toLowerCase() === filename.toLowerCase());
    if (!item) {
      item = configMap.find((o) => o.prefix && filename.toLowerCase().startsWith(o.prefix.toLowerCase()));
    }
    if (!item) {
      item = configMap.find((o) => o.suffix && filename.endsWith(o.suffix.toLowerCase()));
    }
    if (item?.service === "klipper" && item.link) {
      const klippyApp = rootGetters["printer/getKlippyApp"];
      item.link = item.link.replace("{klipperDomain}", klippyApp.domain);
    }
    if (item) {
      const itemService = item?.service;
      const instanceIds = rootState.server.system_info?.instance_ids;
      return {
        serviceSupported: instanceIds && itemService in instanceIds || getters2.getServices.some((i) => i.name === itemService),
        ...item
      };
    }
    return {};
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgU2VydmVySW5mbywgU2VydmVyQ29uZmlnLCBTZXJ2ZXJTdGF0ZSwgU3lzdGVtSW5mbywgU2VydmVyU3lzdGVtU3RhdCwgU2VydmljZUluZm8sIFNlcnZpY2VTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB7IGd0ZSwgdmFsaWQgfSBmcm9tICdzZW12ZXInXG5pbXBvcnQgeyBtdW9uRnJvbUNvbXBvbmVudHMgfSBmcm9tICdAL3NlcnZpY2VzL2dhdGVzL2NvbXBvbmVudHMnXG5cbmV4cG9ydCBjb25zdCBnZXR0ZXJzOiBHZXR0ZXJUcmVlPFNlcnZlclN0YXRlLCBSb290U3RhdGU+ID0ge1xuICAvKipcbiAgICogR2V0J3MgdGhlIGN1cnJlbnQgc2VydmVyIGluZm9cbiAgICovXG4gIGdldEluZm86IChzdGF0ZSk6IFNlcnZlckluZm8gPT4ge1xuICAgIHJldHVybiBzdGF0ZS5pbmZvXG4gIH0sXG5cbiAgZ2V0SXNNaW5BcGlWZXJzaW9uOiAoc3RhdGUpID0+IChtaW5WZXJzaW9uOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBhcGlWZXJzaW9uID0gc3RhdGUuaW5mby5hcGlfdmVyc2lvbl9zdHJpbmdcbiAgICByZXR1cm4gYXBpVmVyc2lvbiAmJiB2YWxpZChhcGlWZXJzaW9uKSAmJiB2YWxpZChtaW5WZXJzaW9uKSAmJiBndGUoYXBpVmVyc2lvbiwgbWluVmVyc2lvbilcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBzeXN0ZW0gaW5mb1xuICAgKi9cbiAgZ2V0U3lzdGVtSW5mbzogKHN0YXRlKTogU3lzdGVtSW5mbyB8IG51bGwgPT4ge1xuICAgIHJldHVybiBzdGF0ZS5zeXN0ZW1faW5mb1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gc2VydmVyIGNvbmZpZ1xuICAgKi9cbiAgZ2V0Q29uZmlnOiAoc3RhdGUpOiBTZXJ2ZXJDb25maWcgPT4ge1xuICAgIHJldHVybiBzdGF0ZS5jb25maWdcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIHNlcnZlciBwcm9jZXNzIHN0YXRzXG4gICAqL1xuICBnZXRQcm9jZXNzU3RhdHM6IChzdGF0ZSk6IFNlcnZlclN5c3RlbVN0YXRbXSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLm1vb25yYWtlcl9zdGF0c1xuICB9LFxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBjb21wb25lbnQgaXMgZW5hYmxlZFxuICAgKi9cbiAgY29tcG9uZW50U3VwcG9ydDogKHN0YXRlKSA9PiAoY29tcG9uZW50OiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gKHN0YXRlLmluZm8uY29tcG9uZW50cy5pbmNsdWRlcyhjb21wb25lbnQpKVxuICB9LFxuXG4gIC8qKlxuICAgKiBUcnVlIG9uIGEgTXVvbiBwcmludGVyIChtdW9uX2FjY2VzcyBvciBtdW9uX3Byb3RlY3Rpb24gcmVwb3J0ZWQpLCBmYWxzZSBvbiBvbmUgd2l0aCBvdGhlciBjb21wb25lbnRzLCBudWxsIHVudGlsIHNlcnZlci5pbmZvIGhhcyBsb2FkZWQuXG4gICAqL1xuICBpc011b25QcmludGVyOiAoc3RhdGUpOiBib29sZWFuIHwgbnVsbCA9PiB7XG4gICAgcmV0dXJuIG11b25Gcm9tQ29tcG9uZW50cyhzdGF0ZS5pbmZvLmNvbXBvbmVudHMpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybiBhIGxpc3Qgb2Ygc2VydmljZXMuXG4gICAqICh3aWxsIGNvbWUgZnJvbSBzdGF0ZS5zeXN0ZW1faW5mbyB3aXRoIGEgbW9vbnJha2VyIHVwZGF0ZS4uKVxuICAgKi9cbiAgZ2V0U2VydmljZXM6IChzdGF0ZSk6IFNlcnZpY2VJbmZvW10gPT4ge1xuICAgIGNvbnN0IGF2YWlsYWJsZV9zZXJ2aWNlczogc3RyaW5nW10gPSBzdGF0ZS5zeXN0ZW1faW5mbz8uYXZhaWxhYmxlX3NlcnZpY2VzIHx8IFtdXG4gICAgY29uc3Qgc2VydmljZV9zdGF0ZXM6IFNlcnZpY2VTdGF0ZSA9IHN0YXRlLnN5c3RlbV9pbmZvPy5zZXJ2aWNlX3N0YXRlIHx8IHt9XG5cbiAgICBjb25zdCBzZXJ2aWNlczogU2VydmljZUluZm9bXSA9IFsuLi5hdmFpbGFibGVfc2VydmljZXNdLnNvcnQoKS5tYXAoKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIG5hbWUgaW4gc2VydmljZV9zdGF0ZXNcbiAgICAgICAgPyB7IG5hbWUsIC4uLnNlcnZpY2Vfc3RhdGVzW25hbWVdIH1cbiAgICAgICAgOiB7IG5hbWUgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gc2VydmljZXNcbiAgfSxcblxuICAvKipcbiAgICogTWFwcyBjb25maWd1cmF0aW9uIGZpbGVzIHRvIGFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBjb25maWcgZG9jIGxpbmssXG4gICAqIGFsb25nIHdpdGggYSBzZXJ2aWNlIG5hbWUuXG4gICAqL1xuICBnZXRDb25maWdNYXBCeUZpbGVuYW1lOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpID0+IChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY29uZmlnTWFwID0gR2xvYmFscy5DT05GSUdfU0VSVklDRV9NQVBcblxuICAgIC8vIEZpcnN0LCBzZWUgaWYgY2FuIGZpbmQgYW4gZXhhY3QgbWF0Y2guXG4gICAgbGV0IGl0ZW0gPSBjb25maWdNYXAuZmluZChvID0+IG8uZmlsZW5hbWU/LnRvTG93ZXJDYXNlKCkgPT09IGZpbGVuYW1lLnRvTG93ZXJDYXNlKCkpXG5cbiAgICAvLyAuLi5ub3csIHRyeSBwcmVmaXhlcy5cbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgIGl0ZW0gPSBjb25maWdNYXAuZmluZChvID0+IG8ucHJlZml4ICYmIGZpbGVuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChvLnByZWZpeC50b0xvd2VyQ2FzZSgpKSlcbiAgICB9XG5cbiAgICAvLyBGaW5hbGx5LCB0cnkgc3VmZml4ZXMuXG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICBpdGVtID0gY29uZmlnTWFwLmZpbmQobyA9PiBvLnN1ZmZpeCAmJiBmaWxlbmFtZS5lbmRzV2l0aChvLnN1ZmZpeC50b0xvd2VyQ2FzZSgpKSlcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBpdGVtPy5zZXJ2aWNlID09PSAna2xpcHBlcicgJiZcbiAgICAgIGl0ZW0ubGlua1xuICAgICkge1xuICAgICAgY29uc3Qga2xpcHB5QXBwID0gcm9vdEdldHRlcnNbJ3ByaW50ZXIvZ2V0S2xpcHB5QXBwJ11cblxuICAgICAgaXRlbS5saW5rID0gaXRlbS5saW5rLnJlcGxhY2UoJ3trbGlwcGVyRG9tYWlufScsIGtsaXBweUFwcC5kb21haW4pXG4gICAgfVxuXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGNvbnN0IGl0ZW1TZXJ2aWNlID0gaXRlbT8uc2VydmljZVxuICAgICAgY29uc3QgaW5zdGFuY2VJZHMgPSByb290U3RhdGUuc2VydmVyLnN5c3RlbV9pbmZvPy5pbnN0YW5jZV9pZHNcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2VydmljZVN1cHBvcnRlZDogKGluc3RhbmNlSWRzICYmIGl0ZW1TZXJ2aWNlIGluIGluc3RhbmNlSWRzKSB8fCBnZXR0ZXJzLmdldFNlcnZpY2VzLnNvbWUoKGk6IFNlcnZpY2VJbmZvKSA9PiBpLm5hbWUgPT09IGl0ZW1TZXJ2aWNlKSxcbiAgICAgICAgLi4uaXRlbVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7fVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUdBLFNBQVMsZUFBZTtBQUN4QixTQUFTLEtBQUssYUFBYTtBQUMzQixTQUFTLDBCQUEwQjtBQUU1QixhQUFNLFVBQThDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJ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