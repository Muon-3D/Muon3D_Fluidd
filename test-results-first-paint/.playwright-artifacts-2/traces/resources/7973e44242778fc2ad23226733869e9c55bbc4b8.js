import { cloneDeep } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import vuetify from "/src/plugins/vuetify.ts";
export const getters = {
  /**
   * Return the state / config of a layout item given its page and id.
   */
  getLayoutConfigById: (state) => (name, id) => {
    let config;
    for (const key in state.layouts[name]) {
      if (config) break;
      const layout = state.layouts[name][key];
      config = layout.find((o) => o.id === id);
    }
    return config;
  },
  /**
   * Return a layout (all containers) given a layout name.
   */
  getLayout: (state) => (name) => {
    if (state.layouts[name]) {
      return cloneDeep(state.layouts[name]);
    } else if (name.startsWith("dashboard")) {
      return cloneDeep(state.layouts.dashboard);
    }
  },
  isEnabledInLayout: (state, getters2) => (layout, id) => {
    const configs = Object.values(getters2.getLayout(layout) ?? {}).flat();
    return configs.find((configs2) => configs2.id === id)?.enabled ?? false;
  },
  isEnabledInCurrentLayout: (state, getters2) => (id) => {
    const layout = getters2.getSpecificLayoutName;
    return getters2.isEnabledInLayout(layout, id);
  },
  /**
   * Return a layout's container given a layout name and container name.
   */
  getContainer: (state) => (name, container) => {
    if (state.layouts[name][container]) {
      return [...state.layouts[name][container]];
    }
  },
  /**
   * Return a specific layout config given the layout and id.
   */
  getConfig: (state, getters2) => (name, id) => {
    const containers = getters2.getLayout(name);
    if (containers) {
      for (const l in containers) {
        const config = containers[l].find((layout) => layout.id === id);
        if (config) return { ...config };
      }
    }
  },
  getSpecificLayoutName: (state, getters2, rootState, rootGetters) => {
    const user = rootGetters["auth/getCurrentUser"];
    if (!user) return "dashboard";
    const size = vuetify.framework.breakpoint.name;
    return `dashboard-${size}-${user.username}`;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgTGF5b3V0U3RhdGUsIExheW91dENvbnRhaW5lciwgTGF5b3V0Q29uZmlnIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyBjbG9uZURlZXAgfSBmcm9tICdsb2Rhc2gtZXMnXG5pbXBvcnQgdnVldGlmeSBmcm9tICdAL3BsdWdpbnMvdnVldGlmeSdcblxuZXhwb3J0IGNvbnN0IGdldHRlcnM6IEdldHRlclRyZWU8TGF5b3V0U3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHN0YXRlIC8gY29uZmlnIG9mIGEgbGF5b3V0IGl0ZW0gZ2l2ZW4gaXRzIHBhZ2UgYW5kIGlkLlxuICAgKi9cbiAgZ2V0TGF5b3V0Q29uZmlnQnlJZDogKHN0YXRlKSA9PiAobmFtZTogc3RyaW5nLCBpZDogc3RyaW5nKTogTGF5b3V0Q29uZmlnIHwgdW5kZWZpbmVkID0+IHtcbiAgICBsZXQgY29uZmlnXG4gICAgZm9yIChjb25zdCBrZXkgaW4gc3RhdGUubGF5b3V0c1tuYW1lXSkge1xuICAgICAgaWYgKGNvbmZpZykgYnJlYWtcbiAgICAgIGNvbnN0IGxheW91dCA9IHN0YXRlLmxheW91dHNbbmFtZV1ba2V5XVxuICAgICAgY29uZmlnID0gbGF5b3V0LmZpbmQobyA9PiBvLmlkID09PSBpZClcbiAgICB9XG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBsYXlvdXQgKGFsbCBjb250YWluZXJzKSBnaXZlbiBhIGxheW91dCBuYW1lLlxuICAgKi9cbiAgZ2V0TGF5b3V0OiAoc3RhdGUpID0+IChuYW1lOiBzdHJpbmcpOiBMYXlvdXRDb250YWluZXIgfCB1bmRlZmluZWQgPT4ge1xuICAgIGlmIChzdGF0ZS5sYXlvdXRzW25hbWVdKSB7XG4gICAgICByZXR1cm4gY2xvbmVEZWVwKHN0YXRlLmxheW91dHNbbmFtZV0pXG4gICAgICAvLyByZXR1cm4geyAuLi5zdGF0ZS5sYXlvdXRzW25hbWVdIH1cbiAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aCgnZGFzaGJvYXJkJykpIHtcbiAgICAgIHJldHVybiBjbG9uZURlZXAoc3RhdGUubGF5b3V0cy5kYXNoYm9hcmQpXG4gICAgfVxuICB9LFxuXG4gIGlzRW5hYmxlZEluTGF5b3V0OiAoc3RhdGUsIGdldHRlcnMpID0+IChsYXlvdXQ6IHN0cmluZywgaWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGNvbmZpZ3MgPSBPYmplY3QudmFsdWVzKGdldHRlcnMuZ2V0TGF5b3V0KGxheW91dCkgPz8ge30pLmZsYXQoKSBhcyBMYXlvdXRDb25maWdbXVxuXG4gICAgcmV0dXJuIGNvbmZpZ3MuZmluZChjb25maWdzID0+IGNvbmZpZ3MuaWQgPT09IGlkKT8uZW5hYmxlZCA/PyBmYWxzZVxuICB9LFxuXG4gIGlzRW5hYmxlZEluQ3VycmVudExheW91dDogKHN0YXRlLCBnZXR0ZXJzKSA9PiAoaWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGxheW91dCA9IGdldHRlcnMuZ2V0U3BlY2lmaWNMYXlvdXROYW1lXG5cbiAgICByZXR1cm4gZ2V0dGVycy5pc0VuYWJsZWRJbkxheW91dChsYXlvdXQsIGlkKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBsYXlvdXQncyBjb250YWluZXIgZ2l2ZW4gYSBsYXlvdXQgbmFtZSBhbmQgY29udGFpbmVyIG5hbWUuXG4gICAqL1xuICBnZXRDb250YWluZXI6IChzdGF0ZSkgPT4gKG5hbWU6IHN0cmluZywgY29udGFpbmVyOiBzdHJpbmcpOiBMYXlvdXRDb25maWdbXSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgaWYgKHN0YXRlLmxheW91dHNbbmFtZV1bY29udGFpbmVyXSkge1xuICAgICAgcmV0dXJuIFsuLi5zdGF0ZS5sYXlvdXRzW25hbWVdW2NvbnRhaW5lcl1dXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBzcGVjaWZpYyBsYXlvdXQgY29uZmlnIGdpdmVuIHRoZSBsYXlvdXQgYW5kIGlkLlxuICAgKi9cbiAgZ2V0Q29uZmlnOiAoc3RhdGUsIGdldHRlcnMpID0+IChuYW1lOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBMYXlvdXRDb25maWcgfCB1bmRlZmluZWQgPT4ge1xuICAgIGNvbnN0IGNvbnRhaW5lcnM6IExheW91dENvbnRhaW5lciA9IGdldHRlcnMuZ2V0TGF5b3V0KG5hbWUpXG4gICAgaWYgKGNvbnRhaW5lcnMpIHtcbiAgICAgIGZvciAoY29uc3QgbCBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRhaW5lcnNbbF0uZmluZChsYXlvdXQgPT4gbGF5b3V0LmlkID09PSBpZClcbiAgICAgICAgaWYgKGNvbmZpZykgcmV0dXJuIHsgLi4uY29uZmlnIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgZ2V0U3BlY2lmaWNMYXlvdXROYW1lOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IHVzZXIgPSByb290R2V0dGVyc1snYXV0aC9nZXRDdXJyZW50VXNlciddXG4gICAgaWYgKCF1c2VyKSByZXR1cm4gJ2Rhc2hib2FyZCdcblxuICAgIGNvbnN0IHNpemUgPSB2dWV0aWZ5LmZyYW1ld29yay5icmVha3BvaW50Lm5hbWVcbiAgICByZXR1cm4gYGRhc2hib2FyZC0ke3NpemV9LSR7dXNlci51c2VybmFtZX1gXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBR0EsU0FBUyxpQkFBaUI7QUFDMUIsT0FBTyxhQUFhO0FBRWIsYUFBTSxVQUE4QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSXpELHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxNQUFjLE9BQXlDO0FBQ3RGLFFBQUk7QUFDSixlQUFXLE9BQU8sTUFBTSxRQUFRLElBQUksR0FBRztBQUNyQyxVQUFJLE9BQVE7QUFDWixZQUFNLFNBQVMsTUFBTSxRQUFRLElBQUksRUFBRSxHQUFHO0FBQ3RDLGVBQVMsT0FBTyxLQUFLLE9BQUssRUFBRSxPQUFPLEVBQUU7QUFBQSxJQUN2QztBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxXQUFXLENBQUMsVUFBVSxDQUFDLFNBQThDO0FBQ25FLFFBQUksTUFBTSxRQUFRLElBQUksR0FBRztBQUN2QixhQUFPLFVBQVUsTUFBTSxRQUFRLElBQUksQ0FBQztBQUFBLElBRXRDLFdBQVcsS0FBSyxXQUFXLFdBQVcsR0FBRztBQUN2QyxhQUFPLFVBQVUsTUFBTSxRQUFRLFNBQVM7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLG1CQUFtQixDQUFDLE9BQU9BLGFBQVksQ0FBQyxRQUFnQixPQUFlO0FBQ3JFLFVBQU0sVUFBVSxPQUFPLE9BQU9BLFNBQVEsVUFBVSxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSztBQUVwRSxXQUFPLFFBQVEsS0FBSyxDQUFBQyxhQUFXQSxTQUFRLE9BQU8sRUFBRSxHQUFHLFdBQVc7QUFBQSxFQUNoRTtBQUFBLEVBRUEsMEJBQTBCLENBQUMsT0FBT0QsYUFBWSxDQUFDLE9BQWU7QUFDNUQsVUFBTSxTQUFTQSxTQUFRO0FBRXZCLFdBQU9BLFNBQVEsa0JBQWtCLFFBQVEsRUFBRTtBQUFBLEVBQzdDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQWMsY0FBa0Q7QUFDeEYsUUFBSSxNQUFNLFFBQVEsSUFBSSxFQUFFLFNBQVMsR0FBRztBQUNsQyxhQUFPLENBQUMsR0FBRyxNQUFNLFFBQVEsSUFBSSxFQUFFLFNBQVMsQ0FBQztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsV0FBVyxDQUFDLE9BQU9BLGFBQVksQ0FBQyxNQUFjLE9BQXlDO0FBQ3JGLFVBQU0sYUFBOEJBLFNBQVEsVUFBVSxJQUFJO0FBQzFELFFBQUksWUFBWTtBQUNkLGlCQUFXLEtBQUssWUFBWTtBQUMxQixjQUFNLFNBQVMsV0FBVyxDQUFDLEVBQUUsS0FBSyxZQUFVLE9BQU8sT0FBTyxFQUFFO0FBQzVELFlBQUksT0FBUSxRQUFPLEVBQUUsR0FBRyxPQUFPO0FBQUEsTUFDakM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsdUJBQXVCLENBQUMsT0FBT0EsVUFBUyxXQUFXLGdCQUF3QjtBQUN6RSxVQUFNLE9BQU8sWUFBWSxxQkFBcUI7QUFDOUMsUUFBSSxDQUFDLEtBQU0sUUFBTztBQUVsQixVQUFNLE9BQU8sUUFBUSxVQUFVLFdBQVc7QUFDMUMsV0FBTyxhQUFhLElBQUksSUFBSSxLQUFLLFFBQVE7QUFBQSxFQUMzQztBQUNGOyIsIm5hbWVzIjpbImdldHRlcnMiLCJjb25maWdzIl19