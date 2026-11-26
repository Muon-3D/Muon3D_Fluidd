import { SocketActions } from "/src/api/socketActions.ts";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
const logPrefix = "[SPOOLMAN]";
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Make a socket request to init the spoolman component.
   */
  async init() {
    SocketActions.serverSpoolmanGetSpoolId();
    SocketActions.serverSpoolmanProxyGetAvailableSpools();
  },
  async onActiveSpool({ commit }, payload) {
    commit("setActiveSpool", payload.spool_id);
  },
  async onSpoolChange({ commit, getters }, { type, payload }) {
    const spools = [...getters.getAvailableSpools];
    switch (type) {
      case "added": {
        spools.push(payload);
        break;
      }
      case "updated": {
        const index = spools.findIndex((spool) => spool.id === payload.id);
        if (index >= 0) {
          spools[index] = payload;
        }
        break;
      }
      case "deleted": {
        const index = spools.findIndex((spool) => spool.id === payload.id);
        if (index >= 0) {
          spools.splice(index, 1);
        }
        break;
      }
    }
    commit("setAvailableSpools", spools);
  },
  async onFilamentChange({ commit, getters }, { type, payload }) {
    if (type !== "updated") {
      return;
    }
    const spools = [...getters.getAvailableSpools];
    for (const spool of spools) {
      if (spool.filament.id === payload.id) {
        spools[spools.indexOf(spool)] = {
          ...spool,
          filament: payload
        };
      }
    }
    commit("setAvailableSpools", spools);
  },
  async onVendorChange({ commit, getters }, { type, payload }) {
    if (type !== "updated") {
      return;
    }
    const spools = [...getters.getAvailableSpools];
    for (const spool of spools) {
      if (spool.filament.vendor?.id === payload.id) {
        spools[spools.indexOf(spool)] = {
          ...spool,
          filament: {
            ...spool.filament,
            vendor: payload
          }
        };
      }
    }
    commit("setAvailableSpools", spools);
  },
  async onAvailableSpools({ commit, dispatch }, payload) {
    if ("error" in payload && "response" in payload) {
      if (payload.error != null) {
        EventBus.$emit(typeof payload.error === "string" ? payload.error : payload.error.message, { type: "error" });
        return;
      }
      payload = payload.response;
    }
    commit("setAvailableSpools", [...payload]);
    commit("setConnected", true);
    dispatch("initializeWebsocketConnection");
  },
  async onStatusChanged({ commit, dispatch }, payload) {
    if (payload) {
      dispatch("init");
    } else commit("setConnected", payload);
  },
  async initializeWebsocketConnection({ state, rootState, dispatch }) {
    if (rootState.server.config.spoolman?.server) {
      if (state.socket?.readyState === WebSocket.OPEN) {
        return;
      }
      const spoolmanUrl = new URL(rootState.server.config.spoolman.server);
      spoolmanUrl.pathname += `${spoolmanUrl.pathname.endsWith("/") ? "" : "/"}api/v1/`;
      if (spoolmanUrl.protocol === "https:") {
        spoolmanUrl.protocol = "wss:";
      } else {
        spoolmanUrl.protocol = "ws:";
      }
      state.socket = new WebSocket(spoolmanUrl);
      state.socket.onerror = (err) => consola.warn(`${logPrefix} received websocket error`, err);
      state.socket.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (err) {
          consola.error(`${logPrefix} failed to decode websocket message`, err, event.data);
          return;
        }
        switch (data.resource) {
          case "spool":
            dispatch("onSpoolChange", data);
            break;
          case "filament":
            dispatch("onFilamentChange", data);
            break;
          case "vendor":
            dispatch("onVendorChange", data);
            break;
          default:
            consola.warn(`${logPrefix} ignoring websocket message with type ${data.resource}`);
        }
      };
    } else {
      state.socket?.close();
      state.socket = void 0;
    }
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHtcbiAgU3Bvb2wsXG4gIFNwb29sbWFuUHJveHlSZXNwb25zZSxcbiAgU3Bvb2xtYW5TdGF0ZSxcbiAgV2Vic29ja2V0QmFzZVBheWxvYWQsXG4gIFdlYnNvY2tldEZpbGFtZW50UGF5bG9hZCxcbiAgV2Vic29ja2V0U3Bvb2xQYXlsb2FkLFxuICBXZWJzb2NrZXRWZW5kb3JQYXlsb2FkXG59IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgeyBjb25zb2xhIH0gZnJvbSAnY29uc29sYSdcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcblxuY29uc3QgbG9nUHJlZml4ID0gJ1tTUE9PTE1BTl0nXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPFNwb29sbWFuU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBvdXIgc3RvcmVcbiAgICovXG4gIGFzeW5jIHJlc2V0ICh7IGNvbW1pdCB9KSB7XG4gICAgY29tbWl0KCdzZXRSZXNldCcpXG4gIH0sXG5cbiAgLyoqXG4gICAqIE1ha2UgYSBzb2NrZXQgcmVxdWVzdCB0byBpbml0IHRoZSBzcG9vbG1hbiBjb21wb25lbnQuXG4gICAqL1xuICBhc3luYyBpbml0ICgpIHtcbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlclNwb29sbWFuR2V0U3Bvb2xJZCgpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJTcG9vbG1hblByb3h5R2V0QXZhaWxhYmxlU3Bvb2xzKClcbiAgfSxcblxuICBhc3luYyBvbkFjdGl2ZVNwb29sICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgY29tbWl0KCdzZXRBY3RpdmVTcG9vbCcsIHBheWxvYWQuc3Bvb2xfaWQpXG4gIH0sXG5cbiAgYXN5bmMgb25TcG9vbENoYW5nZSAoeyBjb21taXQsIGdldHRlcnMgfSwgeyB0eXBlLCBwYXlsb2FkIH06IFdlYnNvY2tldFNwb29sUGF5bG9hZCkge1xuICAgIGNvbnN0IHNwb29scyA9IFsuLi5nZXR0ZXJzLmdldEF2YWlsYWJsZVNwb29scyBhcyBTcG9vbFtdXVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdhZGRlZCc6IHtcbiAgICAgICAgc3Bvb2xzLnB1c2gocGF5bG9hZClcblxuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBjYXNlICd1cGRhdGVkJzoge1xuICAgICAgICBjb25zdCBpbmRleCA9IHNwb29scy5maW5kSW5kZXgoc3Bvb2wgPT4gc3Bvb2wuaWQgPT09IHBheWxvYWQuaWQpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBzcG9vbHNbaW5kZXhdID0gcGF5bG9hZFxuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgY2FzZSAnZGVsZXRlZCc6IHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBzcG9vbHMuZmluZEluZGV4KHNwb29sID0+IHNwb29sLmlkID09PSBwYXlsb2FkLmlkKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgc3Bvb2xzLnNwbGljZShpbmRleCwgMSlcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29tbWl0KCdzZXRBdmFpbGFibGVTcG9vbHMnLCBzcG9vbHMpXG4gIH0sXG5cbiAgYXN5bmMgb25GaWxhbWVudENoYW5nZSAoeyBjb21taXQsIGdldHRlcnMgfSwgeyB0eXBlLCBwYXlsb2FkIH06IFdlYnNvY2tldEZpbGFtZW50UGF5bG9hZCkge1xuICAgIGlmICh0eXBlICE9PSAndXBkYXRlZCcpIHtcbiAgICAgIC8vIHdlIG9ubHkgY2FyZSBhYm91dCB1cGRhdGVkIGZpbGFtZW50IHR5cGVzXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBzcG9vbHMgPSBbLi4uZ2V0dGVycy5nZXRBdmFpbGFibGVTcG9vbHMgYXMgU3Bvb2xbXV1cbiAgICBmb3IgKGNvbnN0IHNwb29sIG9mIHNwb29scykge1xuICAgICAgaWYgKHNwb29sLmZpbGFtZW50LmlkID09PSBwYXlsb2FkLmlkKSB7XG4gICAgICAgIHNwb29sc1tzcG9vbHMuaW5kZXhPZihzcG9vbCldID0ge1xuICAgICAgICAgIC4uLnNwb29sLFxuICAgICAgICAgIGZpbGFtZW50OiBwYXlsb2FkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb21taXQoJ3NldEF2YWlsYWJsZVNwb29scycsIHNwb29scylcbiAgfSxcblxuICBhc3luYyBvblZlbmRvckNoYW5nZSAoeyBjb21taXQsIGdldHRlcnMgfSwgeyB0eXBlLCBwYXlsb2FkIH06IFdlYnNvY2tldFZlbmRvclBheWxvYWQpIHtcbiAgICBpZiAodHlwZSAhPT0gJ3VwZGF0ZWQnKSB7XG4gICAgICAvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgdXBkYXRlZCB2ZW5kb3JzXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBzcG9vbHMgPSBbLi4uZ2V0dGVycy5nZXRBdmFpbGFibGVTcG9vbHMgYXMgU3Bvb2xbXV1cbiAgICBmb3IgKGNvbnN0IHNwb29sIG9mIHNwb29scykge1xuICAgICAgaWYgKHNwb29sLmZpbGFtZW50LnZlbmRvcj8uaWQgPT09IHBheWxvYWQuaWQpIHtcbiAgICAgICAgc3Bvb2xzW3Nwb29scy5pbmRleE9mKHNwb29sKV0gPSB7XG4gICAgICAgICAgLi4uc3Bvb2wsXG4gICAgICAgICAgZmlsYW1lbnQ6IHtcbiAgICAgICAgICAgIC4uLnNwb29sLmZpbGFtZW50LFxuICAgICAgICAgICAgdmVuZG9yOiBwYXlsb2FkXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29tbWl0KCdzZXRBdmFpbGFibGVTcG9vbHMnLCBzcG9vbHMpXG4gIH0sXG5cbiAgYXN5bmMgb25BdmFpbGFibGVTcG9vbHMgKHsgY29tbWl0LCBkaXNwYXRjaCB9LCBwYXlsb2FkOiBTcG9vbG1hblByb3h5UmVzcG9uc2U8U3Bvb2xbXT4pIHtcbiAgICBpZiAoJ2Vycm9yJyBpbiBwYXlsb2FkICYmICdyZXNwb25zZScgaW4gcGF5bG9hZCkge1xuICAgICAgaWYgKHBheWxvYWQuZXJyb3IgIT0gbnVsbCkge1xuICAgICAgICBFdmVudEJ1cy4kZW1pdCh0eXBlb2YgcGF5bG9hZC5lcnJvciA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmVycm9yIDogcGF5bG9hZC5lcnJvci5tZXNzYWdlLCB7IHR5cGU6ICdlcnJvcicgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHBheWxvYWQgPSBwYXlsb2FkLnJlc3BvbnNlXG4gICAgfVxuXG4gICAgY29tbWl0KCdzZXRBdmFpbGFibGVTcG9vbHMnLCBbLi4ucGF5bG9hZF0pXG4gICAgY29tbWl0KCdzZXRDb25uZWN0ZWQnLCB0cnVlKVxuICAgIGRpc3BhdGNoKCdpbml0aWFsaXplV2Vic29ja2V0Q29ubmVjdGlvbicpXG4gIH0sXG5cbiAgYXN5bmMgb25TdGF0dXNDaGFuZ2VkICh7IGNvbW1pdCwgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIGlmIChwYXlsb2FkKSB7XG4gICAgICAvLyByZWZyZXNoIGRhdGEsIGNvbm5lY3RlZCBzdGF0ZSB3aWxsIGJlIHNldCBvbiBkYXRhIHJldHJpZXZhbFxuICAgICAgZGlzcGF0Y2goJ2luaXQnKVxuICAgIH0gZWxzZSBjb21taXQoJ3NldENvbm5lY3RlZCcsIHBheWxvYWQpXG4gIH0sXG5cbiAgYXN5bmMgaW5pdGlhbGl6ZVdlYnNvY2tldENvbm5lY3Rpb24gKHsgc3RhdGUsIHJvb3RTdGF0ZSwgZGlzcGF0Y2ggfSkge1xuICAgIGlmIChyb290U3RhdGUuc2VydmVyLmNvbmZpZy5zcG9vbG1hbj8uc2VydmVyKSB7XG4gICAgICBpZiAoc3RhdGUuc29ja2V0Py5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgICAvLyB3ZSBhbHJlYWR5IGhhdmUgYSB3b3JraW5nIFdTIGNvbm5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIGluaXQgd2Vic29ja2V0IHRvIGxpc3RlbiBmb3IgdXBkYXRlc1xuICAgICAgY29uc3Qgc3Bvb2xtYW5VcmwgPSBuZXcgVVJMKHJvb3RTdGF0ZS5zZXJ2ZXIuY29uZmlnLnNwb29sbWFuLnNlcnZlcilcbiAgICAgIHNwb29sbWFuVXJsLnBhdGhuYW1lICs9IGAke3Nwb29sbWFuVXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcvJykgPyAnJyA6ICcvJ31hcGkvdjEvYFxuICAgICAgaWYgKHNwb29sbWFuVXJsLnByb3RvY29sID09PSAnaHR0cHM6Jykge1xuICAgICAgICBzcG9vbG1hblVybC5wcm90b2NvbCA9ICd3c3M6J1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3Bvb2xtYW5VcmwucHJvdG9jb2wgPSAnd3M6J1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KHNwb29sbWFuVXJsKVxuICAgICAgc3RhdGUuc29ja2V0Lm9uZXJyb3IgPSBlcnIgPT4gY29uc29sYS53YXJuKGAke2xvZ1ByZWZpeH0gcmVjZWl2ZWQgd2Vic29ja2V0IGVycm9yYCwgZXJyKVxuICAgICAgc3RhdGUuc29ja2V0Lm9ubWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICAgICAgbGV0IGRhdGE6IFdlYnNvY2tldEJhc2VQYXlsb2FkXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSlcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sYS5lcnJvcihgJHtsb2dQcmVmaXh9IGZhaWxlZCB0byBkZWNvZGUgd2Vic29ja2V0IG1lc3NhZ2VgLCBlcnIsIGV2ZW50LmRhdGEpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKGRhdGEucmVzb3VyY2UpIHtcbiAgICAgICAgICBjYXNlICdzcG9vbCc6XG4gICAgICAgICAgICBkaXNwYXRjaCgnb25TcG9vbENoYW5nZScsIGRhdGEpXG4gICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSAnZmlsYW1lbnQnOlxuICAgICAgICAgICAgZGlzcGF0Y2goJ29uRmlsYW1lbnRDaGFuZ2UnLCBkYXRhKVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgJ3ZlbmRvcic6XG4gICAgICAgICAgICBkaXNwYXRjaCgnb25WZW5kb3JDaGFuZ2UnLCBkYXRhKVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xhLndhcm4oYCR7bG9nUHJlZml4fSBpZ25vcmluZyB3ZWJzb2NrZXQgbWVzc2FnZSB3aXRoIHR5cGUgJHtkYXRhLnJlc291cmNlfWApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZGVzdHJveSB3c1xuICAgICAgc3RhdGUuc29ja2V0Py5jbG9zZSgpXG4gICAgICBzdGF0ZS5zb2NrZXQgPSB1bmRlZmluZWRcbiAgICB9XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBV0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZ0JBQWdCO0FBRXpCLE1BQU0sWUFBWTtBQUVYLGFBQU0sVUFBZ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUkzRCxNQUFNLE1BQU8sRUFBRSxPQUFPLEdBQUc7QUFDdkIsV0FBTyxVQUFVO0FBQUEsRUFDbkI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sT0FBUTtBQUNaLGtCQUFjLHlCQUF5QjtBQUN2QyxrQkFBYyxzQ0FBc0M7QUFBQSxFQUN0RDtBQUFB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