import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState } from "/src/store/notifications/state.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  setPushNotification(state, n) {
    state.notifications.push(n);
  },
  setMergeNotification(state, options) {
    if (options && options.n && options.i >= 0) {
      Vue.set(state.notifications, options.i, options.n);
    }
  },
  setClearNotification(state, notification) {
    let i = -1;
    if (typeof notification === "string") {
      i = state.notifications.findIndex((n) => n.id === notification);
    } else {
      i = state.notifications.findIndex((n) => n === notification);
    }
    if (i >= 0) {
      state.notifications.splice(i, 1);
    }
  },
  setClearAllNotifications(state) {
    Vue.set(state, "notifications", [...state.notifications.filter((n) => !n.clear)]);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgdHlwZSB7IE5vdGlmaWNhdGlvbnNTdGF0ZSwgQXBwTm90aWZpY2F0aW9uIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGNvbnN0IG11dGF0aW9uczogTXV0YXRpb25UcmVlPE5vdGlmaWNhdGlvbnNTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBzdGF0ZVxuICAgKi9cbiAgc2V0UmVzZXQgKHN0YXRlKSB7XG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwgZGVmYXVsdFN0YXRlKCkpXG4gIH0sXG5cbiAgc2V0UHVzaE5vdGlmaWNhdGlvbiAoc3RhdGUsIG46IEFwcE5vdGlmaWNhdGlvbikge1xuICAgIHN0YXRlLm5vdGlmaWNhdGlvbnMucHVzaChuKVxuICB9LFxuXG4gIHNldE1lcmdlTm90aWZpY2F0aW9uIChzdGF0ZSwgb3B0aW9uczogeyBuOiBBcHBOb3RpZmljYXRpb247IGk6IG51bWJlciB9KSB7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5uICYmIG9wdGlvbnMuaSA+PSAwKSB7XG4gICAgICBWdWUuc2V0KHN0YXRlLm5vdGlmaWNhdGlvbnMsIG9wdGlvbnMuaSwgb3B0aW9ucy5uKVxuICAgIH1cbiAgfSxcblxuICBzZXRDbGVhck5vdGlmaWNhdGlvbiAoc3RhdGUsIG5vdGlmaWNhdGlvbjogQXBwTm90aWZpY2F0aW9uIHwgc3RyaW5nKSB7XG4gICAgbGV0IGkgPSAtMVxuICAgIGlmICh0eXBlb2Ygbm90aWZpY2F0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgaSA9IHN0YXRlLm5vdGlmaWNhdGlvbnMuZmluZEluZGV4KG4gPT4gbi5pZCA9PT0gbm90aWZpY2F0aW9uKVxuICAgIH0gZWxzZSB7XG4gICAgICBpID0gc3RhdGUubm90aWZpY2F0aW9ucy5maW5kSW5kZXgobiA9PiBuID09PSBub3RpZmljYXRpb24pXG4gICAgfVxuICAgIGlmIChpID49IDApIHtcbiAgICAgIHN0YXRlLm5vdGlmaWNhdGlvbnMuc3BsaWNlKGksIDEpXG4gICAgfVxuICB9LFxuXG4gIHNldENsZWFyQWxsTm90aWZpY2F0aW9ucyAoc3RhdGUpIHtcbiAgICBWdWUuc2V0KHN0YXRlLCAnbm90aWZpY2F0aW9ucycsIFsuLi5zdGF0ZS5ub3RpZmljYXRpb25zLmZpbHRlcihuID0+ICFuLmNsZWFyKV0pXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBRWhCLFNBQVMsb0JBQW9CO0FBR3RCLGFBQU0sWUFBOEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUl6RCxTQUFVLE9BQU87QUFDZixXQUFPLE9BQU8sT0FBTyxhQUFhLENBQUM7QUFBQSxFQUNyQztBQUFBLEVBRUEsb0JBQXFCLE9BQU8sR0FBb0I7QUFDOUMsVUFBTSxjQUFjLEtBQUssQ0FBQztBQUFBLEVBQzVCO0FBQUEsRUFFQSxxQkFBc0IsT0FBTyxTQUE0QztBQUN2RSxRQUFJLFdBQVcsUUFBUSxLQUFLLFFBQVEsS0FBSyxHQUFHO0FBQzFDLFVBQUksSUFBSSxNQUFNLGVBQWUsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUFBLElBQ25EO0FBQUEsRUFDRjtBQUFBLEVBRUEscUJBQXNCLE9BQU8sY0FBd0M7QUFDbkUsUUFBSSxJQUFJO0FBQ1IsUUFBSSxPQUFPLGlCQUFpQixVQUFVO0FBQ3BDLFVBQUksTUFBTSxjQUFjLFVBQVUsT0FBSyxFQUFFLE9BQU8sWUFBWTtBQUFBLElBQzlELE9BQU87QUFDTCxVQUFJLE1BQU0sY0FBYyxVQUFVLE9BQUssTUFBTSxZQUFZO0FBQUEsSUFDM0Q7QUFDQSxRQUFJLEtBQUssR0FBRztBQUNWLFlBQU0sY0FBYyxPQUFPLEdBQUcsQ0FBQztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUFBLEVBRUEseUJBQTBCLE9BQU87QUFDL0IsUUFBSSxJQUFJLE9BQU8saUJBQWlCLENBQUMsR0FBRyxNQUFNLGNBQWMsT0FBTyxPQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUFBLEVBQ2hGO0FBQ0Y7IiwibmFtZXMiOltdfQ==