import { SocketActions } from "/src/api/socketActions.ts";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
import i18n from "/src/plugins/i18n.ts";
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Make a socket request to init the timelapse component.
   */
  async init() {
    SocketActions.timelapseState();
  },
  async onSettings({ commit }, payload) {
    commit("setSettings", payload);
  },
  async onLastFrame({ commit }, payload) {
    const uniqueCount = +(payload.lastframefile?.match(/\d+/)?.[0] ?? 0);
    commit("setLastFrame", {
      count: payload.framecount,
      uniqueCount,
      file: payload.lastframefile
    });
  },
  async onEvent({ commit }, payload) {
    switch (payload.action) {
      case "newframe": {
        if (payload.status === "error") {
          EventBus.$emit(i18n.tc("app.timelapse.error.newframe"), { type: "error" });
        } else {
          const count = parseInt(payload.frame);
          commit("setLastFrame", {
            count,
            uniqueCount: count,
            file: payload.framefile
          });
        }
        break;
      }
      case "render": {
        let status;
        switch (payload.status) {
          case "started": {
            status = {
              status: "started",
              count: payload.framecount,
              settings: {
                frameRate: payload.framerate,
                crf: payload.crf,
                pixelFormat: payload.pixelformat
              }
            };
            break;
          }
          case "running": {
            status = { status: "running", progress: payload.progress };
            break;
          }
          case "success": {
            status = {
              status: "success",
              frameCount: payload.framecount,
              fileName: payload.filename,
              printFile: payload.printfile,
              previewImage: payload.previewimage,
              message: payload.msg
            };
            break;
          }
          default: {
            consola.warn("unhandled timelapse render status", payload);
            return;
          }
        }
        commit("setRenderStatus", status);
        break;
      }
      default: {
        consola.warn("unhandled timelapse event", payload);
        break;
      }
    }
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgVGltZWxhcHNlU3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBSb290U3RhdGUgfSBmcm9tICcuLi90eXBlcydcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHsgY29uc29sYSB9IGZyb20gJ2NvbnNvbGEnXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgaTE4biBmcm9tICdAL3BsdWdpbnMvaTE4bidcblxuZXhwb3J0IGNvbnN0IGFjdGlvbnM6IEFjdGlvblRyZWU8VGltZWxhcHNlU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBvdXIgc3RvcmVcbiAgICovXG4gIGFzeW5jIHJlc2V0ICh7IGNvbW1pdCB9KSB7XG4gICAgY29tbWl0KCdzZXRSZXNldCcpXG4gIH0sXG5cbiAgLyoqXG4gICAqIE1ha2UgYSBzb2NrZXQgcmVxdWVzdCB0byBpbml0IHRoZSB0aW1lbGFwc2UgY29tcG9uZW50LlxuICAgKi9cbiAgYXN5bmMgaW5pdCAoKSB7XG4gICAgU29ja2V0QWN0aW9ucy50aW1lbGFwc2VTdGF0ZSgpXG4gIH0sXG5cbiAgYXN5bmMgb25TZXR0aW5ncyAoeyBjb21taXQgfSwgcGF5bG9hZCkge1xuICAgIGNvbW1pdCgnc2V0U2V0dGluZ3MnLCBwYXlsb2FkKVxuICB9LFxuXG4gIGFzeW5jIG9uTGFzdEZyYW1lICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgY29uc3QgdW5pcXVlQ291bnQgPSArKHBheWxvYWQubGFzdGZyYW1lZmlsZT8ubWF0Y2goL1xcZCsvKT8uWzBdID8/IDApXG4gICAgY29tbWl0KCdzZXRMYXN0RnJhbWUnLCB7XG4gICAgICBjb3VudDogcGF5bG9hZC5mcmFtZWNvdW50LFxuICAgICAgdW5pcXVlQ291bnQsXG4gICAgICBmaWxlOiBwYXlsb2FkLmxhc3RmcmFtZWZpbGVcbiAgICB9KVxuICB9LFxuXG4gIGFzeW5jIG9uRXZlbnQgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uKSB7XG4gICAgICBjYXNlICduZXdmcmFtZSc6IHtcbiAgICAgICAgaWYgKHBheWxvYWQuc3RhdHVzID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgLy8gb3BlbiBzbmFja2JhclxuICAgICAgICAgIEV2ZW50QnVzLiRlbWl0KGkxOG4udGMoJ2FwcC50aW1lbGFwc2UuZXJyb3IubmV3ZnJhbWUnKSwgeyB0eXBlOiAnZXJyb3InIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgY291bnQgPSBwYXJzZUludChwYXlsb2FkLmZyYW1lKVxuICAgICAgICAgIGNvbW1pdCgnc2V0TGFzdEZyYW1lJywge1xuICAgICAgICAgICAgY291bnQsXG4gICAgICAgICAgICB1bmlxdWVDb3VudDogY291bnQsXG4gICAgICAgICAgICBmaWxlOiBwYXlsb2FkLmZyYW1lZmlsZVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBjYXNlICdyZW5kZXInOiB7XG4gICAgICAgIGxldCBzdGF0dXNcblxuICAgICAgICBzd2l0Y2ggKHBheWxvYWQuc3RhdHVzKSB7XG4gICAgICAgICAgY2FzZSAnc3RhcnRlZCc6IHtcbiAgICAgICAgICAgIHN0YXR1cyA9IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiAnc3RhcnRlZCcsXG4gICAgICAgICAgICAgIGNvdW50OiBwYXlsb2FkLmZyYW1lY291bnQsXG4gICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgZnJhbWVSYXRlOiBwYXlsb2FkLmZyYW1lcmF0ZSxcbiAgICAgICAgICAgICAgICBjcmY6IHBheWxvYWQuY3JmLFxuICAgICAgICAgICAgICAgIHBpeGVsRm9ybWF0OiBwYXlsb2FkLnBpeGVsZm9ybWF0XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAncnVubmluZyc6IHtcbiAgICAgICAgICAgIHN0YXR1cyA9IHsgc3RhdHVzOiAncnVubmluZycsIHByb2dyZXNzOiBwYXlsb2FkLnByb2dyZXNzIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnc3VjY2Vzcyc6IHtcbiAgICAgICAgICAgIHN0YXR1cyA9IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgIGZyYW1lQ291bnQ6IHBheWxvYWQuZnJhbWVjb3VudCxcbiAgICAgICAgICAgICAgZmlsZU5hbWU6IHBheWxvYWQuZmlsZW5hbWUsXG4gICAgICAgICAgICAgIHByaW50RmlsZTogcGF5bG9hZC5wcmludGZpbGUsXG4gICAgICAgICAgICAgIHByZXZpZXdJbWFnZTogcGF5bG9hZC5wcmV2aWV3aW1hZ2UsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHBheWxvYWQubXNnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIGNvbnNvbGEud2FybigndW5oYW5kbGVkIHRpbWVsYXBzZSByZW5kZXIgc3RhdHVzJywgcGF5bG9hZClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbW1pdCgnc2V0UmVuZGVyU3RhdHVzJywgc3RhdHVzKVxuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGNvbnNvbGEud2FybigndW5oYW5kbGVkIHRpbWVsYXBzZSBldmVudCcs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