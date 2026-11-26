import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState } from "/src/store/announcements/state.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  setAnnouncementsList(state, payload) {
    if (payload.entries) Vue.set(state, "entries", payload.entries);
    if (payload.feeds) Vue.set(state, "feeds", payload.feeds);
  },
  setAnnouncementDismissed(state, payload) {
    const entries = [...state.entries];
    const entry = entries.find((entry2) => entry2.entry_id === payload.entry_id);
    if (entry) {
      entry.dismissed = payload.dismissed;
      if (!payload.dismissed) {
        entry.date_dismissed = null;
        entry.dismiss_wake = null;
      } else {
        entry.date_dismissed = Date.now();
      }
    }
    Vue.set(state, "entries", entries);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgdHlwZSB7IEFubm91bmNlbWVudHNTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBtdXRhdGlvbnM6IE11dGF0aW9uVHJlZTxBbm5vdW5jZW1lbnRzU3RhdGU+ID0ge1xuICAvKipcbiAgICogUmVzZXQgc3RhdGVcbiAgICovXG4gIHNldFJlc2V0IChzdGF0ZSkge1xuICAgIE9iamVjdC5hc3NpZ24oc3RhdGUsIGRlZmF1bHRTdGF0ZSgpKVxuICB9LFxuXG4gIHNldEFubm91bmNlbWVudHNMaXN0IChzdGF0ZSwgcGF5bG9hZDogQW5ub3VuY2VtZW50c1N0YXRlKSB7XG4gICAgaWYgKHBheWxvYWQuZW50cmllcykgVnVlLnNldChzdGF0ZSwgJ2VudHJpZXMnLCBwYXlsb2FkLmVudHJpZXMpXG4gICAgaWYgKHBheWxvYWQuZmVlZHMpIFZ1ZS5zZXQoc3RhdGUsICdmZWVkcycsIHBheWxvYWQuZmVlZHMpXG4gIH0sXG5cbiAgc2V0QW5ub3VuY2VtZW50RGlzbWlzc2VkIChzdGF0ZSwgcGF5bG9hZDogeyBlbnRyeV9pZDogc3RyaW5nLCBkaXNtaXNzZWQ6IGJvb2xlYW4gfSkge1xuICAgIGNvbnN0IGVudHJpZXMgPSBbLi4uc3RhdGUuZW50cmllc11cblxuICAgIGNvbnN0IGVudHJ5ID0gZW50cmllcy5maW5kKGVudHJ5ID0+IGVudHJ5LmVudHJ5X2lkID09PSBwYXlsb2FkLmVudHJ5X2lkKVxuICAgIGlmIChlbnRyeSkge1xuICAgICAgZW50cnkuZGlzbWlzc2VkID0gcGF5bG9hZC5kaXNtaXNzZWRcblxuICAgICAgaWYgKCFwYXlsb2FkLmRpc21pc3NlZCkge1xuICAgICAgICBlbnRyeS5kYXRlX2Rpc21pc3NlZCA9IG51bGxcbiAgICAgICAgZW50cnkuZGlzbWlzc193YWtlID0gbnVsbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50cnkuZGF0ZV9kaXNtaXNzZWQgPSBEYXRlLm5vdygpXG4gICAgICB9XG4gICAgfVxuXG4gICAgVnVlLnNldChzdGF0ZSwgJ2VudHJpZXMnLCBlbnRyaWVzKVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sU0FBUztBQUVoQixTQUFTLG9CQUFvQjtBQUd0QixhQUFNLFlBQThDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJekQsU0FBVSxPQUFPO0FBQ2YsV0FBTyxPQUFPLE9BQU8sYUFBYSxDQUFDO0FBQUEsRUFDckM7QUFBQSxFQUVBLHFCQUFzQixPQUFPLFNBQTZCO0FBQ3hELFFBQUksUUFBUSxRQUFTLEtBQUksSUFBSSxPQUFPLFdBQVcsUUFBUSxPQUFPO0FBQzlELFFBQUksUUFBUSxNQUFPLEtBQUksSUFBSSxPQUFPLFNBQVMsUUFBUSxLQUFLO0FBQUEsRUFDMUQ7QUFBQSxFQUVBLHlCQUEwQixPQUFPLFNBQW1EO0FBQ2xGLFVBQU0sVUFBVSxDQUFDLEdBQUcsTUFBTSxPQUFPO0FBRWpDLFVBQU0sUUFBUSxRQUFRLEtBQUssQ0FBQUEsV0FBU0EsT0FBTSxhQUFhLFFBQVEsUUFBUTtBQUN2RSxRQUFJLE9BQU87QUFDVCxZQUFNLFlBQVksUUFBUTtBQUUxQixVQUFJLENBQUMsUUFBUSxXQUFXO0FBQ3RCLGNBQU0saUJBQWlCO0FBQ3ZCLGNBQU0sZUFBZTtBQUFBLE1BQ3ZCLE9BQU87QUFDTCxjQUFNLGlCQUFpQixLQUFLLElBQUk7QUFBQSxNQUNsQztBQUFBLElBQ0Y7QUFFQSxRQUFJLElBQUksT0FBTyxXQUFXLE9BQU87QUFBQSxFQUNuQztBQUNGOyIsIm5hbWVzIjpbImVudHJ5Il19