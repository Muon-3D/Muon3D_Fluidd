export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Add's a wait to the list of waits.
   */
  async addWait({ commit }, wait) {
    commit("setAddWait", wait);
  },
  /**
   * Removes a wait from the list of waits.
   */
  async removeWait({ commit }, wait) {
    commit("setRemoveWait", wait);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgV2FpdFN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPFdhaXRTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IG91ciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgcmVzZXQgKHsgY29tbWl0IH0pIHtcbiAgICBjb21taXQoJ3NldFJlc2V0JylcbiAgfSxcblxuICAvKipcbiAgICogQWRkJ3MgYSB3YWl0IHRvIHRoZSBsaXN0IG9mIHdhaXRzLlxuICAgKi9cbiAgYXN5bmMgYWRkV2FpdCAoeyBjb21taXQgfSwgd2FpdCkge1xuICAgIGNvbW1pdCgnc2V0QWRkV2FpdCcsIHdhaXQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSB3YWl0IGZyb20gdGhlIGxpc3Qgb2Ygd2FpdHMuXG4gICAqL1xuICBhc3luYyByZW1vdmVXYWl0ICh7IGNvbW1pdCB9LCB3YWl0KSB7XG4gICAgY29tbWl0KCdzZXRSZW1vdmVXYWl0Jywgd2FpdClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFJTyxhQUFNLFVBQTRDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJdkQsTUFBTSxNQUFPLEVBQUUsT0FBTyxHQUFHO0FBQ3ZCLFdBQU8sVUFBVTtBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLFFBQVMsRUFBRSxPQUFPLEdBQUcsTUFBTTtBQUMvQixXQUFPLGNBQWMsSUFBSTtBQUFBLEVBQzNCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLFdBQVksRUFBRSxPQUFPLEdBQUcsTUFBTTtBQUNsQyxXQUFPLGlCQUFpQixJQUFJO0FBQUEsRUFDOUI7QUFDRjsiLCJuYW1lcyI6W119