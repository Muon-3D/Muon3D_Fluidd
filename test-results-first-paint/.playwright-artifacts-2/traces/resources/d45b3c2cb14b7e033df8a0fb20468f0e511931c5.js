import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState } from "/src/store/server/state.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  setResetKlippy(state) {
    const { klippy_retries, info } = defaultState();
    Object.assign(state, {
      klippy_retries,
      info
    });
  },
  setServerInfo(state, payload) {
    Vue.set(state, "info", payload);
  },
  setSystemInfo(state, payload) {
    if (payload.system_info) {
      Vue.set(state, "system_info", payload.system_info);
    }
  },
  setMachinePeripherals(state, payload) {
    state.peripherals = {
      ...state.peripherals,
      ...payload
    };
  },
  setMachinePeripheralsCanbus(state, payload) {
    state.can_uuids = {
      ...state.can_uuids,
      [payload.canbusInterface]: payload.canUuids
    };
  },
  setServiceState(state, payload) {
    if (payload && state.system_info?.service_state) {
      Object.assign(state.system_info.service_state, payload);
    }
  },
  /**
   * On initial init we get the server (moonraker) configuration.
   */
  setServerConfig(state, payload) {
    state.config = { ...state.config, ...payload };
  },
  /**
   * On initial init, we get the server (moonraker) process stats and any throttled state flags.
   */
  setMoonrakerStats(state, payload) {
    if (payload.cpu_temp) Vue.set(state, "cpu_temp", payload.cpu_temp);
    if (payload.throttled_state) state.throttled_state = { ...state.throttled_state, ...payload.throttled_state };
    if (payload.moonraker_stats && Array.isArray(payload.moonraker_stats)) {
      Vue.set(state, "moonraker_stats", payload.moonraker_stats);
    } else {
      if (state.moonraker_stats) {
        state.moonraker_stats.push(payload.moonraker_stats);
        while (state.moonraker_stats.length > 30) {
          state.moonraker_stats.splice(0, 1);
        }
      }
    }
  },
  /**
   * Sets how many times we've retried connecting to klippy.
   */
  setKlippyRetries(state, payload) {
    state.klippy_retries = payload;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgdHlwZSB7IENhbmJ1c1V1aWQsIFBlcmlwaGVyYWxzLCBTZXJ2ZXJJbmZvLCBTZXJ2ZXJTdGF0ZSwgU2VydmljZVN0YXRlLCBTeXN0ZW1JbmZvIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGNvbnN0IG11dGF0aW9uczogTXV0YXRpb25UcmVlPFNlcnZlclN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IHN0YXRlXG4gICAqL1xuICBzZXRSZXNldCAoc3RhdGUpIHtcbiAgICBPYmplY3QuYXNzaWduKHN0YXRlLCBkZWZhdWx0U3RhdGUoKSlcbiAgfSxcblxuICBzZXRSZXNldEtsaXBweSAoc3RhdGUpIHtcbiAgICBjb25zdCB7IGtsaXBweV9yZXRyaWVzLCBpbmZvIH0gPSBkZWZhdWx0U3RhdGUoKVxuXG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwge1xuICAgICAga2xpcHB5X3JldHJpZXMsXG4gICAgICBpbmZvXG4gICAgfSlcbiAgfSxcblxuICBzZXRTZXJ2ZXJJbmZvIChzdGF0ZSwgcGF5bG9hZDogU2VydmVySW5mbykge1xuICAgIFZ1ZS5zZXQoc3RhdGUsICdpbmZvJywgcGF5bG9hZClcbiAgfSxcblxuICBzZXRTeXN0ZW1JbmZvIChzdGF0ZSwgcGF5bG9hZDogeyBzeXN0ZW1faW5mbz86IFN5c3RlbUluZm8gfSkge1xuICAgIGlmIChwYXlsb2FkLnN5c3RlbV9pbmZvKSB7XG4gICAgICBWdWUuc2V0KHN0YXRlLCAnc3lzdGVtX2luZm8nLCBwYXlsb2FkLnN5c3RlbV9pbmZvKVxuICAgIH1cbiAgfSxcblxuICBzZXRNYWNoaW5lUGVyaXBoZXJhbHMgKHN0YXRlLCBwYXlsb2FkOiBQYXJ0aWFsPFBlcmlwaGVyYWxzPikge1xuICAgIHN0YXRlLnBlcmlwaGVyYWxzID0ge1xuICAgICAgLi4uc3RhdGUucGVyaXBoZXJhbHMsXG4gICAgICAuLi5wYXlsb2FkXG4gICAgfVxuICB9LFxuXG4gIHNldE1hY2hpbmVQZXJpcGhlcmFsc0NhbmJ1cyAoc3RhdGUsIHBheWxvYWQ6IHsgY2FuYnVzSW50ZXJmYWNlOiBzdHJpbmcsIGNhblV1aWRzOiBDYW5idXNVdWlkW10gfSkge1xuICAgIHN0YXRlLmNhbl91dWlkcyA9IHtcbiAgICAgIC4uLnN0YXRlLmNhbl91dWlkcyxcbiAgICAgIFtwYXlsb2FkLmNhbmJ1c0ludGVyZmFjZV06IHBheWxvYWQuY2FuVXVpZHNcbiAgICB9XG4gIH0sXG5cbiAgc2V0U2VydmljZVN0YXRlIChzdGF0ZSwgcGF5bG9hZDogU2VydmljZVN0YXRlKSB7XG4gICAgaWYgKHBheWxvYWQgJiYgc3RhdGUuc3lzdGVtX2luZm8/LnNlcnZpY2Vfc3RhdGUpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24oc3RhdGUuc3lzdGVtX2luZm8uc2VydmljZV9zdGF0ZSwgcGF5bG9hZClcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIE9uIGluaXRpYWwgaW5pdCB3ZSBnZXQgdGhlIHNlcnZlciAobW9vbnJha2VyKSBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgc2V0U2VydmVyQ29uZmlnIChzdGF0ZSwgcGF5bG9hZCkge1xuICAgIHN0YXRlLmNvbmZpZyA9IHsgLi4uc3RhdGUuY29uZmlnLCAuLi5wYXlsb2FkIH1cbiAgfSxcblxuICAvKipcbiAgICogT24gaW5pdGlhbCBpbml0LCB3ZSBnZXQgdGhlIHNlcnZlciAobW9vbnJha2VyKSBwcm9jZXNzIHN0YXRzIGFuZCBhbnkgdGhyb3R0bGVkIHN0YXRlIGZsYWdzLlxuICAgKi9cbiAgc2V0TW9vbnJha2VyU3RhdHMgKHN0YXRlLCBwYXlsb2FkKSB7XG4gICAgaWYgKHBheWxvYWQuY3B1X3RlbXApIFZ1ZS5zZXQoc3RhdGUsICdjcHVfdGVtcCcsIHBheWxvYWQuY3B1X3RlbXApXG4gICAgaWYgKHBheWxvYWQudGhyb3R0bGVkX3N0YXRlKSBzdGF0ZS50aHJvdHRsZWRfc3RhdGUgPSB7IC4uLnN0YXRlLnRocm90dGxlZF9zdGF0ZSwgLi4ucGF5bG9hZC50aHJvdHRsZWRfc3RhdGUgfVxuICAgIGlmIChcbiAgICAgIHBheWxvYWQubW9vbnJha2VyX3N0YXRzICYmXG4gICAgICBBcnJheS5pc0FycmF5KHBheWxvYWQubW9vbnJha2VyX3N0YXRzKVxuICAgICkge1xuICAgICAgLy8gVXBkYXRlIHdpdGggYXJyYXkuXG4gICAgICBWdWUuc2V0KHN0YXRlLCAnbW9vbnJha2VyX3N0YXRzJywgcGF5bG9hZC5tb29ucmFrZXJfc3RhdHMpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFwcGVuZCB0byBhcnJheS5cbiAgICAgIGlmIChzdGF0ZS5tb29ucmFrZXJfc3RhdHMpIHtcbiAgICAgICAgc3RhdGUubW9vbnJha2VyX3N0YXRzLnB1c2gocGF5bG9hZC5tb29ucmFrZXJfc3RhdHMpXG4gICAgICAgIHdoaWxlIChzdGF0ZS5tb29ucmFrZXJfc3RhdHMubGVuZ3RoID4gMzApIHtcbiAgICAgICAgICBzdGF0ZS5tb29ucmFrZXJfc3RhdHMuc3BsaWNlKDAsIDEpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldHMgaG93IG1hbnkgdGltZXMgd2UndmUgcmV0cmllZCBjb25uZWN0aW5nIHRvIGtsaXBweS5cbiAgICovXG4gIHNldEtsaXBweVJldHJpZXMgKHN0YXRlLCBwYXlsb2FkOiBudW1iZXIpIHtcbiAgICBzdGF0ZS5rbGlwcHlfcmV0cmllcyA9IHBheWxvYWRcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFFaEIsU0FBUyxvQkFBb0I7QUFHdEIsYUFBTSxZQUF1QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSWxELFNBQVUsT0FBTztBQUNmLFdBQU8sT0FBTyxPQUFPLGFBQWEsQ0FBQztBQUFBLEVBQ3JDO0FBQUEsRUFFQSxlQUFnQixPQUFPO0FBQ3JCLFVBQU0sRUFBRSxnQkFBZ0IsS0FBSyxJQUFJLGFBQWE7QUFFOUMsV0FBTyxPQUFPLE9BQU87QUFBQSxNQUNuQjtBQUFBLE1BQ0E7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxjQUFlLE9BQU8sU0FBcUI7QUFDekMsUUFBSSxJQUFJLE9BQU8sUUFBUSxPQUFPO0FBQUEsRUFDaEM7QUFBQSxFQUVBLGNBQWUsT0FBTyxTQUF1QztBQUMzRCxRQUFJLFFBQVEsYUFBYTtBQUN2QixVQUFJLElBQUksT0FBTyxlQUFlLFFBQVEsV0FBVztBQUFBLElBQ25EO0FBQUEsRUFDRjtBQUFBLEVBRUEsc0JBQXVCLE9BQU8sU0FBK0I7QUFDM0QsVUFBTSxjQUFjO0FBQUEsTUFDbEIsR0FBRyxNQUFNO0FBQUEsTUFDVCxHQUFHO0FBQUEsSUFDTDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLDRCQUE2QixPQUFPLFNBQThEO0FBQ2hHLFVBQU0sWUFBWTtBQUFBLE1BQ2hCLEdBQUcsTUFBTTtBQUFBLE1BQ1QsQ0FBQyxRQUFRLGVBQWUsR0FBRyxRQUFRO0FBQUEsSUFDckM7QUFBQSxFQUNGO0FBQUEsRUFFQSxnQkFBaUIsT0FBTyxTQUF1QjtBQUM3QyxRQUFJLFdBQVcsTUFBTSxhQUFhLGVBQWU7QUFDL0MsYUFBTyxPQUFPLE1BQU0sWUFBWSxlQUFlLE9BQU87QUFBQSxJQUN4RDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGdCQUFpQixPQUFPLFNBQVM7QUFDL0IsVUFBTSxTQUFTLEVBQUUsR0FBRyxNQUFNLFFBQVEsR0FBRyxRQUFRO0FBQUEsRUFDL0M7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGtCQUFtQixPQUFPLFNBQVM7QUFDakMsUUFBSSxRQUFRLFNBQVUsS0FBSSxJQUFJLE9BQU8sWUFBWSxRQUFRLFFBQVE7QUFDakUsUUFBSSxRQUFRLGdCQUFpQixPQUFNLGtCQUFrQixFQUFFLEdBQUcsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLGdCQUFnQjtBQUM1RyxRQUNFLFFBQVEsbUJBQ1IsTUFBTSxRQUFRLFFBQVEsZUFBZSxHQUNyQztBQUVBLFVBQUksSUFBSSxPQUFPLG1CQUFtQixRQUFRLGVBQWU7QUFBQSxJQUMzRCxPQUFPO0FBRUwsVUFBSSxNQUFNLGlCQUFpQjtBQUN6QixjQUFNLGdCQUFnQixLQUFLLFFBQVEsZUFBZTtBQUNsRCxlQUFPLE1BQU0sZ0JBQWdCLFNBQVMsSUFBSTtBQUN4QyxnQkFBTSxnQkFBZ0IsT0FBTyxHQUFHLENBQUM7QUFBQSxRQUNuQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsaUJBQWtCLE9BQU8sU0FBaUI7QUFDeEMsVUFBTSxpQkFBaUI7QUFBQSxFQUN6QjtBQUNGOyIsIm5hbWVzIjpbXX0=