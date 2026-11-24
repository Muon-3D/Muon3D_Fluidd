export const defaultState = () => {
  return {
    klippy_retries: 0,
    // how many times have we attempted to reconnect to klippy.
    info: {
      failed_components: [],
      klippy_connected: false,
      // indicates if klippy is disconnected vs shutdown.
      klippy_state: "",
      components: [],
      registered_directories: [],
      warnings: []
    },
    system_info: null,
    peripherals: {
      usb_devices: null,
      serial_devices: null,
      v4l2_devices: null,
      libcamera_devices: null
    },
    can_uuids: null,
    config: {
      authorization: {
        enabled: true
      },
      server: {}
    },
    moonraker_stats: [],
    throttled_state: {
      bits: 0,
      flags: []
    },
    cpu_temp: null
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU2VydmVyU3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0YXRlID0gKCk6IFNlcnZlclN0YXRlID0+IHtcbiAgcmV0dXJuIHtcbiAgICBrbGlwcHlfcmV0cmllczogMCwgLy8gaG93IG1hbnkgdGltZXMgaGF2ZSB3ZSBhdHRlbXB0ZWQgdG8gcmVjb25uZWN0IHRvIGtsaXBweS5cbiAgICBpbmZvOiB7XG4gICAgICBmYWlsZWRfY29tcG9uZW50czogW10sXG4gICAgICBrbGlwcHlfY29ubmVjdGVkOiBmYWxzZSwgLy8gaW5kaWNhdGVzIGlmIGtsaXBweSBpcyBkaXNjb25uZWN0ZWQgdnMgc2h1dGRvd24uXG4gICAgICBrbGlwcHlfc3RhdGU6ICcnLFxuICAgICAgY29tcG9uZW50czogW10sXG4gICAgICByZWdpc3RlcmVkX2RpcmVjdG9yaWVzOiBbXSxcbiAgICAgIHdhcm5pbmdzOiBbXVxuICAgIH0sXG4gICAgc3lzdGVtX2luZm86IG51bGwsXG4gICAgcGVyaXBoZXJhbHM6IHtcbiAgICAgIHVzYl9kZXZpY2VzOiBudWxsLFxuICAgICAgc2VyaWFsX2RldmljZXM6IG51bGwsXG4gICAgICB2NGwyX2RldmljZXM6IG51bGwsXG4gICAgICBsaWJjYW1lcmFfZGV2aWNlczogbnVsbFxuICAgIH0sXG4gICAgY2FuX3V1aWRzOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgYXV0aG9yaXphdGlvbjoge1xuICAgICAgICBlbmFibGVkOiB0cnVlXG4gICAgICB9LFxuICAgICAgc2VydmVyOiB7fVxuICAgIH0sXG4gICAgbW9vbnJha2VyX3N0YXRzOiBbXSxcbiAgICB0aHJvdHRsZWRfc3RhdGU6IHtcbiAgICAgIGJpdHM6IDAsXG4gICAgICBmbGFnczogW11cbiAgICB9LFxuICAgIGNwdV90ZW1wOiBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0YXRlID0gZGVmYXVsdFN0YXRlKClcbiJdLCJtYXBwaW5ncyI6IkFBRU8sYUFBTSxlQUFlLE1BQW1CO0FBQzdDLFNBQU87QUFBQSxJQUNMLGdCQUFnQjtBQUFBO0FBQUEsSUFDaEIsTUFBTTtBQUFBLE1BQ0osbUJBQW1CLENBQUM7QUFBQSxNQUNwQixrQkFBa0I7QUFBQTtBQUFBLE1BQ2xCLGNBQWM7QUFBQSxNQUNkLFlBQVksQ0FBQztBQUFBLE1BQ2Isd0JBQXdCLENBQUM7QUFBQSxNQUN6QixVQUFVLENBQUM7QUFBQSxJQUNiO0FBQUEsSUFDQSxhQUFhO0FBQUEsSUFDYixhQUFhO0FBQUEsTUFDWCxhQUFhO0FBQUEsTUFDYixnQkFBZ0I7QUFBQSxNQUNoQixjQUFjO0FBQUEsTUFDZCxtQkFBbUI7QUFBQSxJQUNyQjtBQUFBLElBQ0EsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLE1BQ04sZUFBZTtBQUFBLFFBQ2IsU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLFFBQVEsQ0FBQztBQUFBLElBQ1g7QUFBQSxJQUNBLGlCQUFpQixDQUFDO0FBQUEsSUFDbEIsaUJBQWlCO0FBQUEsTUFDZixNQUFNO0FBQUEsTUFDTixPQUFPLENBQUM7QUFBQSxJQUNWO0FBQUEsSUFDQSxVQUFVO0FBQUEsRUFDWjtBQUNGO0FBRU8sYUFBTSxRQUFRLGFBQWE7IiwibmFtZXMiOltdfQ==