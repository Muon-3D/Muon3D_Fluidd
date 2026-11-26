import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import Vuex from "/.vite-e2e/4291/deps/vuex.js?v=9b9fafc7";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { socket } from "/src/store/socket/index.ts";
import { auth } from "/src/store/auth/index.ts";
import { server } from "/src/store/server/index.ts";
import { printer } from "/src/store/printer/index.ts";
import { config } from "/src/store/config/index.ts";
import { files } from "/src/store/files/index.ts";
import { layout } from "/src/store/layout/index.ts";
import { charts } from "/src/store/charts/index.ts";
import { console } from "/src/store/console/index.ts";
import { macros } from "/src/store/macros/index.ts";
import { power } from "/src/store/power/index.ts";
import { history } from "/src/store/history/index.ts";
import { version } from "/src/store/version/index.ts";
import { mesh } from "/src/store/mesh/index.ts";
import { notifications } from "/src/store/notifications/index.ts";
import { announcements } from "/src/store/announcements/index.ts";
import { wait } from "/src/store/wait/index.ts";
import { gcodePreview } from "/src/store/gcodePreview/index.ts";
import { timelapse } from "/src/store/timelapse/index.ts";
import { parts } from "/src/store/parts/index.ts";
import { webcams } from "/src/store/webcams/index.ts";
import { jobQueue } from "/src/store/jobQueue/index.ts";
import { spoolman } from "/src/store/spoolman/index.ts";
import { sensors } from "/src/store/sensors/index.ts";
import { protection } from "/src/store/protection/index.ts";
Vue.use(Vuex);
export default new Vuex.Store({
  strict: import.meta.env.DEV,
  modules: {
    socket,
    auth,
    server,
    printer,
    config,
    files,
    layout,
    charts,
    console,
    macros,
    power,
    history,
    version,
    mesh,
    notifications,
    announcements,
    wait,
    gcodePreview,
    timelapse,
    parts,
    webcams,
    jobQueue,
    spoolman,
    sensors,
    protection
  },
  mutations: {},
  actions: {
    /**
     * Resets all stores
     */
    async reset({ dispatch }, payload) {
      Vue.$colorset.forceResetAll();
      const p = [];
      const keys = payload || Object.keys(this.state);
      keys.forEach((key) => {
        if (this.hasModule(key)) {
          p.push(dispatch(key + "/reset"));
        }
      });
      return Promise.all(p);
    },
    async init({ dispatch, commit }, payload) {
      commit("socket/setApiConnected", payload.apiConnected);
      return [
        await dispatch("config/initHost", payload),
        await dispatch("config/initLocal", payload),
        await dispatch("config/discoverLanInstances")
      ];
    },
    /**
     * A void action. Some socket commands may not need processing.
     */
    void(_, payload) {
      consola.debug("void action", payload);
    }
  }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IFZ1ZXggZnJvbSAndnVleCdcbmltcG9ydCB7IGNvbnNvbGEgfSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHR5cGUgeyBSb290U3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBJbml0Q29uZmlnIH0gZnJvbSAnLi9jb25maWcvdHlwZXMnXG5cbi8vIE1vZHVsZXNcbmltcG9ydCB7IHNvY2tldCB9IGZyb20gJy4vc29ja2V0J1xuaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4vYXV0aCdcbmltcG9ydCB7IHNlcnZlciB9IGZyb20gJy4vc2VydmVyJ1xuaW1wb3J0IHsgcHJpbnRlciB9IGZyb20gJy4vcHJpbnRlcidcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHsgZmlsZXMgfSBmcm9tICcuL2ZpbGVzJ1xuaW1wb3J0IHsgbGF5b3V0IH0gZnJvbSAnLi9sYXlvdXQnXG5pbXBvcnQgeyBjaGFydHMgfSBmcm9tICcuL2NoYXJ0cydcbmltcG9ydCB7IGNvbnNvbGUgfSBmcm9tICcuL2NvbnNvbGUnXG5pbXBvcnQgeyBtYWNyb3MgfSBmcm9tICcuL21hY3JvcydcbmltcG9ydCB7IHBvd2VyIH0gZnJvbSAnLi9wb3dlcidcbmltcG9ydCB7IGhpc3RvcnkgfSBmcm9tICcuL2hpc3RvcnknXG5pbXBvcnQgeyB2ZXJzaW9uIH0gZnJvbSAnLi92ZXJzaW9uJ1xuaW1wb3J0IHsgbWVzaCB9IGZyb20gJy4vbWVzaCdcbmltcG9ydCB7IG5vdGlmaWNhdGlvbnMgfSBmcm9tICcuL25vdGlmaWNhdGlvbnMnXG5pbXBvcnQgeyBhbm5vdW5jZW1lbnRzIH0gZnJvbSAnLi9hbm5vdW5jZW1lbnRzJ1xuaW1wb3J0IHsgd2FpdCB9IGZyb20gJy4vd2FpdCdcbmltcG9ydCB7IGdjb2RlUHJldmlldyB9IGZyb20gJy4vZ2NvZGVQcmV2aWV3J1xuaW1wb3J0IHsgdGltZWxhcHNlIH0gZnJvbSAnLi90aW1lbGFwc2UnXG5pbXBvcnQgeyBwYXJ0cyB9IGZyb20gJy4vcGFydHMnXG5pbXBvcnQgeyB3ZWJjYW1zIH0gZnJvbSAnLi93ZWJjYW1zJ1xuaW1wb3J0IHsgam9iUXVldWUgfSBmcm9tICcuL2pvYlF1ZXVlJ1xuaW1wb3J0IHsgc3Bvb2xtYW4gfSBmcm9tICcuL3Nwb29sbWFuJ1xuaW1wb3J0IHsgc2Vuc29ycyB9IGZyb20gJy4vc2Vuc29ycydcbmltcG9ydCB7IHByb3RlY3Rpb24gfSBmcm9tICcuL3Byb3RlY3Rpb24nXG5cblZ1ZS51c2UoVnVleClcblxuZXhwb3J0IGRlZmF1bHQgbmV3IFZ1ZXguU3RvcmU8Um9vdFN0YXRlPih7XG4gIHN0cmljdDogKGltcG9ydC5tZXRhLmVudi5ERVYpLFxuICBtb2R1bGVzOiB7XG4gICAgc29ja2V0LFxuICAgIGF1dGgsXG4gICAgc2VydmVyLFxuICAgIHByaW50ZXIsXG4gICAgY29uZmlnLFxuICAgIGZpbGVzLFxuICAgIGxheW91dCxcbiAgICBjaGFydHMsXG4gICAgY29uc29sZSxcbiAgICBtYWNyb3MsXG4gICAgcG93ZXIsXG4gICAgaGlzdG9yeSxcbiAgICB2ZXJzaW9uLFxuICAgIG1lc2gsXG4gICAgbm90aWZpY2F0aW9ucyxcbiAgICBhbm5vdW5jZW1lbnRzLFxuICAgIHdhaXQsXG4gICAgZ2NvZGVQcmV2aWV3LFxuICAgIHRpbWVsYXBzZSxcbiAgICBwYXJ0cyxcbiAgICB3ZWJjYW1zLFxuICAgIGpvYlF1ZXVlLFxuICAgIHNwb29sbWFuLFxuICAgIHNlbnNvcnMsXG4gICAgcHJvdGVjdGlvblxuICB9LFxuICBtdXRhdGlvbnM6IHt9LFxuICBhY3Rpb25zOiB7XG4gICAgLyoqXG4gICAgICogUmVzZXRzIGFsbCBzdG9yZXNcbiAgICAgKi9cbiAgICBhc3luYyByZXNldCAoeyBkaXNwYXRjaCB9LCBwYXlsb2FkOiBzdHJpbmdbXSkge1xuICAgICAgLy8gUmVzZXQgb3VyIGNvbG9yIHNldC5cbiAgICAgIFZ1ZS4kY29sb3JzZXQuZm9yY2VSZXNldEFsbCgpXG5cbiAgICAgIC8vIERpc3BhdGNoIGEgcmVzZXQgZm9yIGVhY2ggcmVnaXN0ZXJlZCBtb2R1bGUuXG4gICAgICBjb25zdCBwOiBQcm9taXNlPHVua25vd24+W10gPSBbXVxuICAgICAgY29uc3Qga2V5cyA9IHBheWxvYWQgfHwgT2JqZWN0LmtleXModGhpcy5zdGF0ZSlcbiAgICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmhhc01vZHVsZShrZXkpKSB7XG4gICAgICAgICAgcC5wdXNoKGRpc3BhdGNoKGtleSArICcvcmVzZXQnKSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwKVxuICAgIH0sXG5cbiAgICBhc3luYyBpbml0ICh7IGRpc3BhdGNoLCBjb21taXQgfSwgcGF5bG9hZDogSW5pdENvbmZpZykge1xuICAgICAgLy8gU2V0IHRoZSBhcGkgY29ubmVjdGlvbiBzdGF0ZS4uXG4gICAgICBjb21taXQoJ3NvY2tldC9zZXRBcGlDb25uZWN0ZWQnLCBwYXlsb2FkLmFwaUNvbm5lY3RlZClcblxuICAgICAgLy8gSW5pdCB0aGUgaG9zdCBhbmQgbG9jYWwgY29uZmlncy4uXG4gICAgICByZXR1cm4gW1xuICAgICAgICBhd2FpdCBkaXNwYXRjaCgnY29uZmlnL2luaXRIb3N0JywgcGF5bG9hZCksXG4gICAgICAgIGF3YWl0IGRpc3BhdGNoKCdjb25maWcvaW5pdExvY2FsJywgcGF5bG9hZCksXG4gICAgICAgIGF3YWl0IGRpc3BhdGNoKCdjb25maWcvZGlzY292ZXJMYW5JbnN0YW5jZXMnKVxuICAgICAgXVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBIHZvaWQgYWN0aW9uLiBTb21lIHNvY2tldCBjb21tYW5kcyBtYXkgbm90IG5lZWQgcHJvY2Vzc2luZy5cbiAgICAgKi9cbiAgICB2b2lkIChfLCBwYXlsb2FkKSB7XG4gICAgICBjb25zb2xhLmRlYnVnKCd2b2lkIGFjdGlvbicsIHBheWxvYWQpXG4gICAgfVxuICB9XG59KVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsZUFBZTtBQUt4QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsY0FBYztBQUN2QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsYUFBYTtBQUN0QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxZQUFZO0FBQ3JCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsWUFBWTtBQUNyQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGFBQWE7QUFDdEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGtCQUFrQjtBQUUzQixJQUFJLElBQUksSUFBSTtBQUVaLGVBQWUsSUFBSSxLQUFLLE1BQWlCO0FBQUEsRUFDdkMsUUFBUyxZQUFZLElBQUk7QUFBQSxFQUN6QixTQUFTO0FBQUEsSUFDUDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFdBQVcsQ0FBQztBQUFBLEVBQ1osU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBLElBSVAsTUFBTSxNQUFPLEVBQUUsU0FBUyxHQUFHLFNBQW1CO0FBRTVDLFVBQUksVUFBVSxjQUFjO0FBRzVCLFlBQU0sSUFBd0IsQ0FBQztBQUMvQixZQUFNLE9BQU8sV0FBVyxPQUFPLEtBQUssS0FBSyxLQUFLO0FBQzlDLFdBQUssUUFBUSxDQUFDLFFBQVE7QUFDcEIsWUFBSSxLQUFLLFVBQVUsR0FBRyxHQUFHO0FBQ3ZCLFlBQUUsS0FBSyxTQUFTLE1BQU0sUUFBUSxDQUFDO0FBQUEsUUFDakM7QUFBQSxNQUNGLENBQUM7QUFDRCxhQUFPLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDdEI7QUFBQSxJQUVBLE1BQU0sS0FBTSxFQUFFLFVBQVUsT0FBTyxHQUFHLFNBQXFCO0FBRXJELGFBQU8sMEJBQTBCLFFBQVEsWUFBWTtBQUdyRCxhQUFPO0FBQUEsUUFDTCxNQUFNLFNBQVMsbUJBQW1CLE9BQU87QUFBQSxRQUN6QyxNQUFNLFNBQVMsb0JBQW9CLE9BQU87QUFBQSxRQUMxQyxNQUFNLFNBQVMsNkJBQTZCO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLQSxLQUFNLEdBQUcsU0FBUztBQUNoQixjQUFRLE1BQU0sZUFBZSxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLCJuYW1lcyI6W119