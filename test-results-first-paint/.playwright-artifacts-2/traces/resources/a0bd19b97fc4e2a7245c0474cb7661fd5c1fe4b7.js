import { EventBus } from "/src/eventBus.ts";
import { v4 as uuidv4 } from "/.vite-e2e/4291/deps/uuid.js?v=9b9fafc7";
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Adds a new notification.
   */
  async pushNotification({ commit, state }, payload) {
    const n = {
      ...{
        // snackbar: true,
        id: uuidv4(),
        type: "info",
        timestamp: Date.now() / 1e3,
        clear: true,
        merge: false
      },
      ...payload
    };
    if (n.title && n.title !== "?" && n.id) {
      const i = state.notifications.findIndex((n2) => n2.title === payload.title);
      if (n.merge && i >= 0) {
        commit("setMergeNotification", { n, i });
      } else {
        commit("setPushNotification", n);
      }
      if (payload.snackbar) {
        EventBus.$emit(n.title, { type: "error" });
      }
    }
  },
  /**
   * Clear a notification.
   */
  async clearNotification({ commit, dispatch }, n) {
    if (typeof n === "object" && n.type === "announcement") {
      dispatch("announcements/dismiss", { entry_id: n.id }, { root: true });
      return;
    }
    commit("setClearNotification", n);
  },
  /**
   * Clear all notifications.
   */
  async clearAll({ commit, dispatch }) {
    commit("setClearAllNotifications");
    dispatch("announcements/dismissAll", {}, { root: true });
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnXG5pbXBvcnQgdHlwZSB7IE5vdGlmaWNhdGlvbnNTdGF0ZSwgQXBwUHVzaE5vdGlmaWNhdGlvbiwgQXBwTm90aWZpY2F0aW9uIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPE5vdGlmaWNhdGlvbnNTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IG91ciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgcmVzZXQgKHsgY29tbWl0IH0pIHtcbiAgICBjb21taXQoJ3NldFJlc2V0JylcbiAgfSxcblxuICAvKipcbiAgICogQWRkcyBhIG5ldyBub3RpZmljYXRpb24uXG4gICAqL1xuICBhc3luYyBwdXNoTm90aWZpY2F0aW9uICh7IGNvbW1pdCwgc3RhdGUgfSwgcGF5bG9hZDogQXBwUHVzaE5vdGlmaWNhdGlvbikge1xuICAgIC8vIFdoZW4gYWRkaW5nO1xuICAgIC8vIDEuIERlZmluZSBpZiBpdCBzaG91bGQgYmUgbWVyZ2VkIHdpdGggdGhlIHNhbWUgdHlwZSBpZiByZS1hZGRpbmcuXG4gICAgLy8gMi4gRGVmaW5lIGlmIGl0IHNob3VsZCBhbHNvIHByb3ZpZGUgYSBwb3BvdmVyLlxuICAgIC8vIFRoaXMgbmVlZHMgdHdvIGNvbW1pdHMuIE9uZSBmb3IgYSBtZXJnZSwgb25lIGZvciBub3QuXG4gICAgLy8gVGhlbiB3ZSBjYW4gZW1pdCB0aGUgdG9hc3QgaWYgaXQgd2FzIGEgbWVyZ2Ugb3Igbm90LlxuXG4gICAgLy8gRGVmaW5lIHRoZSBiYXNlIG5vdGlmaWNhdGlvbi5cbiAgICBjb25zdCBuOiBBcHBOb3RpZmljYXRpb24gPSB7XG4gICAgICAuLi57XG4gICAgICAgIC8vIHNuYWNrYmFyOiB0cnVlLFxuICAgICAgICBpZDogdXVpZHY0KCksXG4gICAgICAgIHR5cGU6ICdpbmZvJyxcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpIC8gMTAwMCxcbiAgICAgICAgY2xlYXI6IHRydWUsXG4gICAgICAgIG1lcmdlOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIC4uLnBheWxvYWRcbiAgICB9XG5cbiAgICAvLyBTYW5pdHkgY2hlY2suLi5cbiAgICBpZiAobi50aXRsZSAmJiBuLnRpdGxlICE9PSAnPycgJiYgbi5pZCkge1xuICAgICAgY29uc3QgaSA9IHN0YXRlLm5vdGlmaWNhdGlvbnMuZmluZEluZGV4KG4gPT4gbi50aXRsZSA9PT0gcGF5bG9hZC50aXRsZSlcbiAgICAgIGlmIChuLm1lcmdlICYmIGkgPj0gMCkge1xuICAgICAgICBjb21taXQoJ3NldE1lcmdlTm90aWZpY2F0aW9uJywgeyBuLCBpIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21taXQoJ3NldFB1c2hOb3RpZmljYXRpb24nLCBuKVxuICAgICAgfVxuXG4gICAgICBpZiAocGF5bG9hZC5zbmFja2Jhcikge1xuICAgICAgICAvLyBFbWl0IGlmIHNuYWNrYmFyIGlzIHRydWUuXG4gICAgICAgIEV2ZW50QnVzLiRlbWl0KG4udGl0bGUsIHsgdHlwZTogJ2Vycm9yJyB9KVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2xlYXIgYSBub3RpZmljYXRpb24uXG4gICAqL1xuICBhc3luYyBjbGVhck5vdGlmaWNhdGlvbiAoeyBjb21taXQsIGRpc3BhdGNoIH0sIG46IEFwcE5vdGlmaWNhdGlvbiB8IHN0cmluZykge1xuICAgIGlmICh0eXBlb2YgbiA9PT0gJ29iamVjdCcgJiYgbi50eXBlID09PSAnYW5ub3VuY2VtZW50Jykge1xuICAgICAgZGlzcGF0Y2goJ2Fubm91bmNlbWVudHMvZGlzbWlzcycsIHsgZW50cnlfaWQ6IG4uaWQgfSwgeyByb290OiB0cnVlIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb21taXQoJ3NldENsZWFyTm90aWZpY2F0aW9uJywgbilcbiAgfSxcblxuICAvKipcbiAgICogQ2xlYXIgYWxsIG5vdGlmaWNhdGlvbnMuXG4gICAqL1xuICBhc3luYyBjbGVhckFsbCAoeyBjb21taXQsIGRpc3BhdGNoIH0pIHtcbiAgICBjb21taXQoJ3NldENsZWFyQWxsTm90aWZpY2F0aW9ucycpXG5cbiAgICBkaXNwYXRjaCgnYW5ub3VuY2VtZW50cy9kaXNtaXNzQWxsJywge30sIHsgcm9vdDogdHJ1ZSB9KVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsTUFBTSxjQUFjO0FBSXRCLGFBQU0sVUFBcUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUloRSxNQUFNLE1BQU8sRUFBRSxPQUFPLEdBQUc7QUFDdkIsV0FBTyxVQUFVO0FBQUEsRUFDbkI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0saUJBQWtCLEVBQUUsUUFBUSxNQUFNLEdBQUcsU0FBOEI7QUFRdkUsVUFBTSxJQUFxQjtBQUFBLE1BQ3pCLEdBQUc7QUFBQTtBQUFBLFFBRUQsSUFBSSxPQUFPO0FBQUEsUUFDWCxNQUFNO0FBQUEsUUFDTixXQUFXLEtBQUssSUFBSSxJQUFJO0FBQUEsUUFDeEIsT0FBTztBQUFBLFFBQ1AsT0FBTztBQUFBLE1BQ1Q7QUFBQSxNQUNBLEdBQUc7QUFBQSxJQUNMO0FBR0EsUUFBSSxFQUFFLFNBQVMsRUFBRSxVQUFVLE9BQU8sRUFBRSxJQUFJO0FBQ3RDLFlBQU0sSUFBSSxNQUFNLGNBQWMsVUFBVSxDQUFBQSxPQUFLQSxHQUFFLFVBQVUsUUFBUSxLQUFLO0FBQ3RFLFVBQUksRUFBRSxTQUFTLEtBQUssR0FBRztBQUNyQixlQUFPLHdCQUF3QixFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQUEsTUFDekMsT0FBTztBQUNMLGVBQU8sdUJBQXVCLENBQUM7QUFBQSxNQUNqQztBQUVBLFVBQUksUUFBUSxVQUFVO0FBRXBCLGlCQUFTLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFBQSxNQUMzQztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGtCQUFtQixFQUFFLFFBQVEsU0FBUyxHQUFHLEdBQTZCO0FBQzFFLFFBQUksT0FBTyxNQUFNLFlBQVksRUFBRSxTQUFTLGdCQUFnQjtBQUN0RCxlQUFTLHlCQUF5QixFQUFFLFVBQVUsRUFBRSxHQUFHLEdBQUcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUNwRTtBQUFBLElBQ0Y7QUFFQSxXQUFPLHdCQUF3QixDQUFDO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sU0FBVSxFQUFFLFFBQVEsU0FBUyxHQUFHO0FBQ3BDLFdBQU8sMEJBQTBCO0FBRWpDLGFBQVMsNEJBQTRCLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQUEsRUFDekQ7QUFDRjsiLCJuYW1lcyI6WyJuIl19