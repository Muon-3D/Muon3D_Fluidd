import { SocketActions } from "/src/api/socketActions.ts";
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Make a socket request to init the moonraker power component.
   */
  async init() {
    SocketActions.machineDevicePowerDevices();
  },
  /**
   * Inits the list of available devices. Notified by init action.
   */
  async onInit({ commit }, payload) {
    if (payload.devices && payload.devices.length > 0) {
      commit("setDevices", payload);
    }
  },
  /**
   * Fires when we receive a notification of power changing
   */
  async onStatus({ commit }, payload) {
    commit("setStatus", payload);
  },
  /**
   * On toggling a power device.
   */
  async onToggle({ commit }, payload) {
    commit("setStatus", payload);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgRGV2aWNlUG93ZXJTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPERldmljZVBvd2VyU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBvdXIgc3RvcmVcbiAgICovXG4gIGFzeW5jIHJlc2V0ICh7IGNvbW1pdCB9KSB7XG4gICAgY29tbWl0KCdzZXRSZXNldCcpXG4gIH0sXG5cbiAgLyoqXG4gICAqIE1ha2UgYSBzb2NrZXQgcmVxdWVzdCB0byBpbml0IHRoZSBtb29ucmFrZXIgcG93ZXIgY29tcG9uZW50LlxuICAgKi9cbiAgYXN5bmMgaW5pdCAoKSB7XG4gICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lRGV2aWNlUG93ZXJEZXZpY2VzKClcbiAgfSxcblxuICAvKipcbiAgICogSW5pdHMgdGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGRldmljZXMuIE5vdGlmaWVkIGJ5IGluaXQgYWN0aW9uLlxuICAgKi9cbiAgYXN5bmMgb25Jbml0ICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgaWYgKFxuICAgICAgcGF5bG9hZC5kZXZpY2VzICYmXG4gICAgICBwYXlsb2FkLmRldmljZXMubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgY29tbWl0KCdzZXREZXZpY2VzJywgcGF5bG9hZClcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpcmVzIHdoZW4gd2UgcmVjZWl2ZSBhIG5vdGlmaWNhdGlvbiBvZiBwb3dlciBjaGFuZ2luZ1xuICAgKi9cbiAgYXN5bmMgb25TdGF0dXMgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBjb21taXQoJ3NldFN0YXR1cycsIHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIE9uIHRvZ2dsaW5nIGEgcG93ZXIgZGV2aWNlLlxuICAgKi9cbiAgYXN5bmMgb25Ub2dnbGUgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBjb21taXQoJ3NldFN0YXR1cycsIHBheWxvYWQpXG4gIH1cblxufVxuIl0sIm1hcHBpbmdzIjoiQUFHQSxTQUFTLHFCQUFxQjtBQUV2QixhQUFNLFVBQW1EO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJOUQsTUFBTSxNQUFPLEVBQUUsT0FBTyxHQUFHO0FBQ3ZCLFdBQU8sVUFBVTtBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLE9BQVE7QUFDWixrQkFBYywwQkFBMEI7QUFBQSxFQUMxQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxPQUFRLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDakMsUUFDRSxRQUFRLFdBQ1IsUUFBUSxRQUFRLFNBQVMsR0FDekI7QUFDQSxhQUFPLGNBQWMsT0FBTztBQUFBLElBQzlCO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxTQUFVLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDbkMsV0FBTyxhQUFhLE9BQU87QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxTQUFVLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDbkMsV0FBTyxhQUFhLE9BQU87QUFBQSxFQUM3QjtBQUVGOyIsIm5hbWVzIjpbXX0=