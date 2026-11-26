import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState } from "/src/store/version/state.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  setUpdateStatus(state, payload) {
    if (payload) {
      if ("busy" in payload) state.busy = payload.busy;
      if ("github_limit_reset_time" in payload) state.github_limit_reset_time = payload.github_limit_reset_time;
      if ("github_rate_limit" in payload) state.github_rate_limit = payload.github_rate_limit;
      if ("github_requests_remaining" in payload) state.github_requests_remaining = payload.github_requests_remaining;
      const o = Object.assign(
        {},
        state.version_info,
        payload.version_info
      );
      Vue.set(state, "version_info", o);
    }
  },
  setUpdateResponse(state, payload) {
    if (payload.complete) {
      state.busy = false;
    } else {
      const id = state.responses.length;
      state.responses.push({
        ...payload,
        id
      });
    }
  },
  setClearUpdateResponse(state) {
    state.responses = [];
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgVmVyc2lvblN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5cbmV4cG9ydCBjb25zdCBtdXRhdGlvbnM6IE11dGF0aW9uVHJlZTxWZXJzaW9uU3RhdGU+ID0ge1xuICAvKipcbiAgICogUmVzZXQgc3RhdGVcbiAgICovXG4gIHNldFJlc2V0IChzdGF0ZSkge1xuICAgIE9iamVjdC5hc3NpZ24oc3RhdGUsIGRlZmF1bHRTdGF0ZSgpKVxuICB9LFxuXG4gIHNldFVwZGF0ZVN0YXR1cyAoc3RhdGUsIHBheWxvYWQpIHtcbiAgICBpZiAocGF5bG9hZCkge1xuICAgICAgaWYgKCdidXN5JyBpbiBwYXlsb2FkKSBzdGF0ZS5idXN5ID0gcGF5bG9hZC5idXN5XG4gICAgICBpZiAoJ2dpdGh1Yl9saW1pdF9yZXNldF90aW1lJyBpbiBwYXlsb2FkKSBzdGF0ZS5naXRodWJfbGltaXRfcmVzZXRfdGltZSA9IHBheWxvYWQuZ2l0aHViX2xpbWl0X3Jlc2V0X3RpbWVcbiAgICAgIGlmICgnZ2l0aHViX3JhdGVfbGltaXQnIGluIHBheWxvYWQpIHN0YXRlLmdpdGh1Yl9yYXRlX2xpbWl0ID0gcGF5bG9hZC5naXRodWJfcmF0ZV9saW1pdFxuICAgICAgaWYgKCdnaXRodWJfcmVxdWVzdHNfcmVtYWluaW5nJyBpbiBwYXlsb2FkKSBzdGF0ZS5naXRodWJfcmVxdWVzdHNfcmVtYWluaW5nID0gcGF5bG9hZC5naXRodWJfcmVxdWVzdHNfcmVtYWluaW5nXG5cbiAgICAgIGNvbnN0IG8gPSBPYmplY3QuYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAgc3RhdGUudmVyc2lvbl9pbmZvLFxuICAgICAgICBwYXlsb2FkLnZlcnNpb25faW5mb1xuICAgICAgKVxuICAgICAgVnVlLnNldChzdGF0ZSwgJ3ZlcnNpb25faW5mbycsIG8pXG4gICAgfVxuICB9LFxuXG4gIHNldFVwZGF0ZVJlc3BvbnNlIChzdGF0ZSwgcGF5bG9hZCkge1xuICAgIC8vIElmIHdlIGdldCBhIGNvbXBsZXRlID09PSB0cnVlLCB0aGVuIGFzc3VtZSB0aGUgdXBkYXRlIGlzIGNvbXBsZXRlXG4gICAgLy8gYW5kIHNldCBidXN5IHRvIGZhbHNlIGFsc28uXG4gICAgaWYgKHBheWxvYWQuY29tcGxldGUpIHtcbiAgICAgIHN0YXRlLmJ1c3kgPSBmYWxzZVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpZCA9IHN0YXRlLnJlc3BvbnNlcy5sZW5ndGhcbiAgICAgIHN0YXRlLnJlc3BvbnNlcy5wdXNoKHtcbiAgICAgICAgLi4ucGF5bG9hZCxcbiAgICAgICAgaWRcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIHNldENsZWFyVXBkYXRlUmVzcG9uc2UgKHN0YXRlKSB7XG4gICAgc3RhdGUucmVzcG9uc2VzID0gW11cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFHaEIsU0FBUyxvQkFBb0I7QUFFdEIsYUFBTSxZQUF3QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSW5ELFNBQVUsT0FBTztBQUNmLFdBQU8sT0FBTyxPQUFPLGFBQWEsQ0FBQztBQUFBLEVBQ3JDO0FBQUEsRUFFQSxnQkFBaUIsT0FBTyxTQUFTO0FBQy9CLFFBQUksU0FBUztBQUNYLFVBQUksVUFBVSxRQUFTLE9BQU0sT0FBTyxRQUFRO0FBQzVDLFVBQUksNkJBQTZCLFFBQVMsT0FBTSwwQkFBMEIsUUFBUTtBQUNsRixVQUFJLHVCQUF1QixRQUFTLE9BQU0sb0JBQW9CLFFBQVE7QUFDdEUsVUFBSSwrQkFBK0IsUUFBUyxPQUFNLDRCQUE0QixRQUFRO0FBRXRGLFlBQU0sSUFBSSxPQUFPO0FBQUEsUUFDZixDQUFDO0FBQUEsUUFDRCxNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsTUFDVjtBQUNBLFVBQUksSUFBSSxPQUFPLGdCQUFnQixDQUFDO0FBQUEsSUFDbEM7QUFBQSxFQUNGO0FBQUEsRUFFQSxrQkFBbUIsT0FBTyxTQUFTO0FBR2pDLFFBQUksUUFBUSxVQUFVO0FBQ3BCLFlBQU0sT0FBTztBQUFBLElBQ2YsT0FBTztBQUNMLFlBQU0sS0FBSyxNQUFNLFVBQVU7QUFDM0IsWUFBTSxVQUFVLEtBQUs7QUFBQSxRQUNuQixHQUFHO0FBQUEsUUFDSDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQUEsRUFFQSx1QkFBd0IsT0FBTztBQUM3QixVQUFNLFlBQVksQ0FBQztBQUFBLEVBQ3JCO0FBQ0Y7IiwibmFtZXMiOltdfQ==