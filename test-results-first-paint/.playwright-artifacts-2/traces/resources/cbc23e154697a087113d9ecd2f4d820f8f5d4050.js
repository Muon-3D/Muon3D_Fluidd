import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { fileMaxFlow } from "/src/services/control/speed.ts";
import ParseGcodeWorker from "/src/workers/parseGcode.worker.ts?worker";
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit, dispatch }) {
    commit("setReset");
    dispatch("applyViewerDefaults");
  },
  /** What a preview starts out showing, from Settings › G-code preview and 3D. */
  async applyViewerDefaults({ commit, rootState }) {
    const config = rootState.config?.uiSettings.gcodePreview;
    if (!config) return;
    commit("setViewerState", { showMoves: config.showMoves !== false, showRetractions: config.showRetractions !== false });
  },
  async terminateParserWorker({ commit, state }) {
    if (state.parserWorker) {
      const worker = state.parserWorker;
      commit("setParserWorker", null);
      worker.terminate();
      commit("clearFile");
    }
  },
  async loadGcode({ commit, getters, state, rootState }, payload) {
    const worker = new ParseGcodeWorker();
    commit("setParserWorker", worker);
    worker.addEventListener("message", (event) => {
      const data = event.data;
      switch (data.action) {
        case "progress": {
          commit("setParserProgress", data.filePosition);
          break;
        }
        case "result": {
          try {
            commit("setMoves", data.moves);
            commit("setLayers", data.layers);
            commit("setParts", data.parts);
            commit("setParserProgress", payload.file.size ?? payload.gcode.length);
            if (rootState.config.uiSettings.gcodePreview.hideSinglePartBoundingBox && data.parts.length <= 1) {
              commit("setViewerState", { showParts: false });
            }
          } catch (error) {
            consola.error("Parser worker error", error);
          }
          if (state.parserWorker) {
            commit("setParserWorker", null);
            worker.terminate();
          }
          if (getters.getMoves.length === 0) {
            commit("clearFile");
          }
          break;
        }
      }
    });
    commit("setParserProgress", 0);
    commit("setMoves", []);
    commit("setLayers", []);
    const text = payload.gcode;
    commit("setMaxFlow", fileMaxFlow(text.length > 4e5 ? `${text.slice(0, 1e5)}
${text.slice(-3e5)}` : text));
    commit("setFile", payload.file);
    const message = {
      action: "parse",
      gcode: payload.gcode
    };
    worker.postMessage(message);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgR2NvZGVQcmV2aWV3U3RhdGUsIFBhcnNlR2NvZGVXb3JrZXJDbGllbnRNZXNzYWdlLCBQYXJzZUdjb2RlV29ya2VyU2VydmVyTWVzc2FnZSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBBcHBGaWxlIH0gZnJvbSAnQC9zdG9yZS9maWxlcy90eXBlcydcbmltcG9ydCB7IGNvbnNvbGEgfSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHsgZmlsZU1heEZsb3cgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvc3BlZWQnXG5cbmltcG9ydCBQYXJzZUdjb2RlV29ya2VyIGZyb20gJy4uLy4uL3dvcmtlcnMvcGFyc2VHY29kZS53b3JrZXIudHM/d29ya2VyJ1xuXG5leHBvcnQgY29uc3QgYWN0aW9uczogQWN0aW9uVHJlZTxHY29kZVByZXZpZXdTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IG91ciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgcmVzZXQgKHsgY29tbWl0LCBkaXNwYXRjaCB9KSB7XG4gICAgY29tbWl0KCdzZXRSZXNldCcpXG4gICAgZGlzcGF0Y2goJ2FwcGx5Vmlld2VyRGVmYXVsdHMnKVxuICB9LFxuXG4gIC8qKiBXaGF0IGEgcHJldmlldyBzdGFydHMgb3V0IHNob3dpbmcsIGZyb20gU2V0dGluZ3Mg4oC6IEctY29kZSBwcmV2aWV3IGFuZCAzRC4gKi9cbiAgYXN5bmMgYXBwbHlWaWV3ZXJEZWZhdWx0cyAoeyBjb21taXQsIHJvb3RTdGF0ZSB9KSB7XG4gICAgY29uc3QgY29uZmlnID0gcm9vdFN0YXRlLmNvbmZpZz8udWlTZXR0aW5ncy5nY29kZVByZXZpZXdcbiAgICBpZiAoIWNvbmZpZykgcmV0dXJuXG4gICAgY29tbWl0KCdzZXRWaWV3ZXJTdGF0ZScsIHsgc2hvd01vdmVzOiBjb25maWcuc2hvd01vdmVzICE9PSBmYWxzZSwgc2hvd1JldHJhY3Rpb25zOiBjb25maWcuc2hvd1JldHJhY3Rpb25zICE9PSBmYWxzZSB9KVxuICB9LFxuXG4gIGFzeW5jIHRlcm1pbmF0ZVBhcnNlcldvcmtlciAoeyBjb21taXQsIHN0YXRlIH0pIHtcbiAgICBpZiAoc3RhdGUucGFyc2VyV29ya2VyKSB7XG4gICAgICBjb25zdCB3b3JrZXIgPSBzdGF0ZS5wYXJzZXJXb3JrZXJcblxuICAgICAgY29tbWl0KCdzZXRQYXJzZXJXb3JrZXInLCBudWxsKVxuXG4gICAgICB3b3JrZXIudGVybWluYXRlKClcblxuICAgICAgY29tbWl0KCdjbGVhckZpbGUnKVxuICAgIH1cbiAgfSxcblxuICBhc3luYyBsb2FkR2NvZGUgKHsgY29tbWl0LCBnZXR0ZXJzLCBzdGF0ZSwgcm9vdFN0YXRlIH0sIHBheWxvYWQ6IHsgZmlsZTogQXBwRmlsZTsgZ2NvZGU6IHN0cmluZyB9KSB7XG4gICAgY29uc3Qgd29ya2VyID0gbmV3IFBhcnNlR2NvZGVXb3JrZXIoKVxuXG4gICAgY29tbWl0KCdzZXRQYXJzZXJXb3JrZXInLCB3b3JrZXIpXG5cbiAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgY29uc3QgZGF0YTogUGFyc2VHY29kZVdvcmtlckNsaWVudE1lc3NhZ2UgPSBldmVudC5kYXRhXG5cbiAgICAgIHN3aXRjaCAoZGF0YS5hY3Rpb24pIHtcbiAgICAgICAgY2FzZSAncHJvZ3Jlc3MnOiB7XG4gICAgICAgICAgY29tbWl0KCdzZXRQYXJzZXJQcm9ncmVzcycsIGRhdGEuZmlsZVBvc2l0aW9uKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdyZXN1bHQnOiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbW1pdCgnc2V0TW92ZXMnLCBkYXRhLm1vdmVzKVxuICAgICAgICAgICAgY29tbWl0KCdzZXRMYXllcnMnLCBkYXRhLmxheWVycylcbiAgICAgICAgICAgIGNvbW1pdCgnc2V0UGFydHMnLCBkYXRhLnBhcnRzKVxuICAgICAgICAgICAgY29tbWl0KCdzZXRQYXJzZXJQcm9ncmVzcycsIHBheWxvYWQuZmlsZS5zaXplID8/IHBheWxvYWQuZ2NvZGUubGVuZ3RoKVxuXG4gICAgICAgICAgICBpZiAocm9vdFN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdjb2RlUHJldmlldy5oaWRlU2luZ2xlUGFydEJvdW5kaW5nQm94ICYmIGRhdGEucGFydHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgY29tbWl0KCdzZXRWaWV3ZXJTdGF0ZScsIHsgc2hvd1BhcnRzOiBmYWxzZSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xhLmVycm9yKCdQYXJzZXIgd29ya2VyIGVycm9yJywgZXJyb3IpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHN0YXRlLnBhcnNlcldvcmtlcikge1xuICAgICAgICAgICAgY29tbWl0KCdzZXRQYXJzZXJXb3JrZXInLCBudWxsKVxuXG4gICAgICAgICAgICB3b3JrZXIudGVybWluYXRlKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZ2V0dGVycy5nZXRNb3Zlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbW1pdCgnY2xlYXJGaWxlJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbW1pdCgnc2V0UGFyc2VyUHJvZ3Jlc3MnLCAwKVxuICAgIGNvbW1pdCgnc2V0TW92ZXMnLCBbXSlcbiAgICBjb21taXQoJ3NldExheWVycycsIFtdKVxuICAgIC8vIFNsaWNlcnMgd3JpdGUgdGhlaXIgc2V0dGluZ3MgYXQgdGhlIHN0YXJ0IG9yIHRoZSBlbmQ7IHRoZSBtaWRkbGUgaXMgbW92ZXMuXG4gICAgY29uc3QgdGV4dCA9IHBheWxvYWQuZ2NvZGUgYXMgc3RyaW5nXG4gICAgY29tbWl0KCdzZXRNYXhGbG93JywgZmlsZU1heEZsb3codGV4dC5sZW5ndGggPiA0MDBfMDAwID8gYCR7dGV4dC5zbGljZSgwLCAxMDBfMDAwKX1cXG4ke3RleHQuc2xpY2UoLTMwMF8wMDApfWAgOiB0ZXh0KSlcblxuICAgIGNvbW1pdCgnc2V0RmlsZScsIHBheWxvYWQuZmlsZSlcblxuICAgIGNvbnN0IG1lc3NhZ2U6IFBhcnNlR2NvZGVXb3JrZXJTZXJ2ZXJNZXNzYWdlID0ge1xuICAgICAgYWN0aW9uOiAncGFyc2UnLFxuICAgICAgZ2NvZGU6IHBheWxvYWQuZ2NvZGVcbiAgICB9XG5cbiAgICB3b3JrZXIucG9zdE1lc3NhZ2UobWVzc2FnZSlcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFJQSxTQUFTLGVBQWU7QUFDeEIsU0FBUyxtQkFBbUI7QUFFNUIsT0FBTyxzQkFBc0I7QUFFdEIsYUFBTSxVQUFvRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSS9ELE1BQU0sTUFBTyxFQUFFLFFBQVEsU0FBUyxHQUFHO0FBQ2pDLFdBQU8sVUFBVTtBQUNqQixhQUFTLHFCQUFxQjtBQUFBLEVBQ2hDO0FBQUE7QUFBQSxFQUdBLE1BQU0sb0JBQXFCLEVBQUUsUUFBUSxVQUFVLEdBQUc7QUFDaEQsVUFBTSxTQUFTLFVBQVUsUUFBUSxXQUFXO0FBQzVDLFFBQUksQ0FBQyxPQUFRO0FBQ2IsV0FBTyxrQkFBa0IsRUFBRSxXQUFXLE9BQU8sY0FBYyxPQUFPLGlCQUFpQixPQUFPLG9CQUFvQixNQUFNLENBQUM7QUFBQSxFQUN2SDtBQUFBLEVBRUEsTUFBTSxzQkFBdUIsRUFBRSxRQUFRLE1BQU0sR0FBRztBQUM5QyxRQUFJLE1BQU0sY0FBYztBQUN0QixZQUFNLFNBQVMsTUFBTTtBQUVyQixhQUFPLG1CQUFtQixJQUFJO0FBRTlCLGFBQU8sVUFBVTtBQUVqQixhQUFPLFdBQVc7QUFBQSxJQUNwQjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sVUFBVyxFQUFFLFFBQVEsU0FBUyxPQUFPLFVBQVUsR0FBRyxTQUEyQztBQUNqRyxVQUFNLFNBQVMsSUFBSSxpQkFBaUI7QUFFcEMsV0FBTyxtQkFBbUIsTUFBTTtBQUVoQyxXQUFPLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUM1QyxZQUFNLE9BQXNDLE1BQU07QUFFbEQsY0FBUSxLQUFLLFFBQVE7QUFBQSxRQUNuQixLQUFLLFlBQVk7QUFDZixpQkFBTyxxQkFBcUIsS0FBSyxZQUFZO0FBQzdDO0FBQUEsUUFDRjtBQUFBLFFBRUEsS0FBSyxVQUFVO0FBQ2IsY0FBSTtBQUNGLG1CQUFPLFlBQVksS0FBSyxLQUFLO0FBQzdCLG1CQUFPLGFBQWEsS0FBSyxNQUFNO0FBQy9CLG1CQUFPLFlBQVksS0FBSyxLQUFLO0FBQzdCLG1CQUFPLHFCQUFxQixRQUFRLEtBQUssUUFBUSxRQUFRLE1BQU0sTUFBTTtBQUVyRSxnQkFBSSxVQUFVLE9BQU8sV0FBVyxhQUFhLDZCQUE2QixLQUFLLE1BQU0sVUFBVSxHQUFHO0FBQ2hHLHFCQUFPLGtCQUFrQixFQUFFLFdBQVcsTUFBTSxDQUFDO0FBQUEsWUFDL0M7QUFBQSxVQUNGLFNBQVMsT0FBTztBQUNkLG9CQUFRLE1BQU0sdUJBQXVCLEtBQUs7QUFBQSxVQUM1QztBQUVBLGNBQUksTUFBTSxjQUFjO0FBQ3RCLG1CQUFPLG1CQUFtQixJQUFJO0FBRTlCLG1CQUFPLFVBQVU7QUFBQSxVQUNuQjtBQUVBLGNBQUksUUFBUSxTQUFTLFdBQVcsR0FBRztBQUNqQyxtQkFBTyxXQUFXO0FBQUEsVUFDcEI7QUFFQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTyxxQkFBcUIsQ0FBQztBQUM3QixXQUFPLFlBQVksQ0FBQyxDQUFDO0FBQ3JCLFdBQU8sYUFBYSxDQUFDLENBQUM7QUFFdEIsVUFBTSxPQUFPLFFBQVE7QUFDckIsV0FBTyxjQUFjLFlBQVksS0FBSyxTQUFTLE1BQVUsR0FBRyxLQUFLLE1BQU0sR0FBRyxHQUFPLENBQUM7QUFBQSxFQUFLLEtBQUssTUFBTSxJQUFRLENBQUMsS0FBSyxJQUFJLENBQUM7QUFFckgsV0FBTyxXQUFXLFFBQVEsSUFBSTtBQUU5QixVQUFNLFVBQXlDO0FBQUEsTUFDN0MsUUFBUTtBQUFBLE1BQ1IsT0FBTyxRQUFRO0FBQUEsSUFDakI7QUFFQSxXQUFPLFlBQVksT0FBTztBQUFBLEVBQzVCO0FBQ0Y7IiwibmFtZXMiOltdfQ==