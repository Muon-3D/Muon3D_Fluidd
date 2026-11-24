export const defaultWritableSettings = () => {
  return {
    enabled: true,
    mode: "layermacro",
    camera: "",
    stream_delay_compensation: 0.05,
    gcode_verbose: false,
    parkhead: false,
    parkpos: "back_left",
    park_custom_pos_x: 10,
    park_custom_pos_y: 10,
    park_custom_pos_dz: 0,
    park_travel_speed: 100,
    park_retract_speed: 15,
    park_extrude_speed: 15,
    park_retract_distance: 1,
    park_extrude_distance: 1,
    park_time: 0.1,
    fw_retract: false,
    hyperlapse_cycle: 30,
    autorender: false,
    constant_rate_factor: 23,
    output_framerate: 30,
    pixelformat: "yuv420p",
    time_format_code: "%Y%m%d_%H%M",
    extraoutputparams: "",
    variable_fps: false,
    targetlength: 10,
    variable_fps_min: 5,
    variable_fps_max: 60,
    duplicatelastframe: 5,
    previewimage: true,
    // true for better timelapse browser integration
    saveframes: false
  };
};
export const defaultState = () => {
  return {
    lastFrame: void 0,
    settings: {
      ...defaultWritableSettings(),
      snapshoturl: "http://localhost:8080/?action=snapshot",
      rotation: 0,
      flip_x: false,
      flip_y: false,
      blockedsettings: []
    },
    renderStatus: void 0
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVGltZWxhcHNlU3RhdGUsIFRpbWVsYXBzZVdyaXRhYmxlU2V0dGluZ3MgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgZGVmYXVsdFdyaXRhYmxlU2V0dGluZ3MgPSAoKTogVGltZWxhcHNlV3JpdGFibGVTZXR0aW5ncyA9PiB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBtb2RlOiAnbGF5ZXJtYWNybycsXG4gICAgY2FtZXJhOiAnJyxcbiAgICBzdHJlYW1fZGVsYXlfY29tcGVuc2F0aW9uOiAwLjA1LFxuICAgIGdjb2RlX3ZlcmJvc2U6IGZhbHNlLFxuICAgIHBhcmtoZWFkOiBmYWxzZSxcbiAgICBwYXJrcG9zOiAnYmFja19sZWZ0JyxcbiAgICBwYXJrX2N1c3RvbV9wb3NfeDogMTAuMCxcbiAgICBwYXJrX2N1c3RvbV9wb3NfeTogMTAuMCxcbiAgICBwYXJrX2N1c3RvbV9wb3NfZHo6IDAuMCxcbiAgICBwYXJrX3RyYXZlbF9zcGVlZDogMTAwLFxuICAgIHBhcmtfcmV0cmFjdF9zcGVlZDogMTUsXG4gICAgcGFya19leHRydWRlX3NwZWVkOiAxNSxcbiAgICBwYXJrX3JldHJhY3RfZGlzdGFuY2U6IDEuMCxcbiAgICBwYXJrX2V4dHJ1ZGVfZGlzdGFuY2U6IDEuMCxcbiAgICBwYXJrX3RpbWU6IDAuMSxcbiAgICBmd19yZXRyYWN0OiBmYWxzZSxcbiAgICBoeXBlcmxhcHNlX2N5Y2xlOiAzMCxcbiAgICBhdXRvcmVuZGVyOiBmYWxzZSxcbiAgICBjb25zdGFudF9yYXRlX2ZhY3RvcjogMjMsXG4gICAgb3V0cHV0X2ZyYW1lcmF0ZTogMzAsXG4gICAgcGl4ZWxmb3JtYXQ6ICd5dXY0MjBwJyxcbiAgICB0aW1lX2Zvcm1hdF9jb2RlOiAnJVklbSVkXyVIJU0nLFxuICAgIGV4dHJhb3V0cHV0cGFyYW1zOiAnJyxcbiAgICB2YXJpYWJsZV9mcHM6IGZhbHNlLFxuICAgIHRhcmdldGxlbmd0aDogMTAsXG4gICAgdmFyaWFibGVfZnBzX21pbjogNSxcbiAgICB2YXJpYWJsZV9mcHNfbWF4OiA2MCxcbiAgICBkdXBsaWNhdGVsYXN0ZnJhbWU6IDUsXG4gICAgcHJldmlld2ltYWdlOiB0cnVlLCAvLyB0cnVlIGZvciBiZXR0ZXIgdGltZWxhcHNlIGJyb3dzZXIgaW50ZWdyYXRpb25cbiAgICBzYXZlZnJhbWVzOiBmYWxzZVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0U3RhdGUgPSAoKTogVGltZWxhcHNlU3RhdGUgPT4ge1xuICByZXR1cm4ge1xuICAgIGxhc3RGcmFtZTogdW5kZWZpbmVkLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICAuLi5kZWZhdWx0V3JpdGFibGVTZXR0aW5ncygpLFxuICAgICAgc25hcHNob3R1cmw6ICdodHRwOi8vbG9jYWxob3N0OjgwODAvP2FjdGlvbj1zbmFwc2hvdCcsXG4gICAgICByb3RhdGlvbjogMCxcbiAgICAgIGZsaXBfeDogZmFsc2UsXG4gICAgICBmbGlwX3k6IGZhbHNlLFxuICAgICAgYmxvY2tlZHNldHRpbmdzOiBbXVxuICAgIH0sXG4gICAgcmVuZGVyU3RhdHVzOiB1bmRlZmluZWRcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc3RhdGUgPSBkZWZhdWx0U3RhdGUoKVxuIl0sIm1hcHBpbmdzIjoiQUFFTyxhQUFNLDBCQUEwQixNQUFpQztBQUN0RSxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsSUFDVCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUiwyQkFBMkI7QUFBQSxJQUMzQixlQUFlO0FBQUEsSUFDZixVQUFVO0FBQUEsSUFDVixTQUFTO0FBQUEsSUFDVCxtQkFBbUI7QUFBQSxJQUNuQixtQkFBbUI7QUFBQSxJQUNuQixvQkFBb0I7QUFBQSxJQUNwQixtQkFBbUI7QUFBQSxJQUNuQixvQkFBb0I7QUFBQSxJQUNwQixvQkFBb0I7QUFBQSxJQUNwQix1QkFBdUI7QUFBQSxJQUN2Qix1QkFBdUI7QUFBQSxJQUN2QixXQUFXO0FBQUEsSUFDWCxZQUFZO0FBQUEsSUFDWixrQkFBa0I7QUFBQSxJQUNsQixZQUFZO0FBQUEsSUFDWixzQkFBc0I7QUFBQSxJQUN0QixrQkFBa0I7QUFBQSxJQUNsQixhQUFhO0FBQUEsSUFDYixrQkFBa0I7QUFBQSxJQUNsQixtQkFBbUI7QUFBQSxJQUNuQixjQUFjO0FBQUEsSUFDZCxjQUFjO0FBQUEsSUFDZCxrQkFBa0I7QUFBQSxJQUNsQixrQkFBa0I7QUFBQSxJQUNsQixvQkFBb0I7QUFBQSxJQUNwQixjQUFjO0FBQUE7QUFBQSxJQUNkLFlBQVk7QUFBQSxFQUNkO0FBQ0Y7QUFFTyxhQUFNLGVBQWUsTUFBc0I7QUFDaEQsU0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsVUFBVTtBQUFBLE1BQ1IsR0FBRyx3QkFBd0I7QUFBQSxNQUMzQixhQUFhO0FBQUEsTUFDYixVQUFVO0FBQUEsTUFDVixRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixpQkFBaUIsQ0FBQztBQUFBLElBQ3BCO0FBQUEsSUFDQSxjQUFjO0FBQUEsRUFDaEI7QUFDRjtBQUVPLGFBQU0sUUFBUSxhQUFhOyIsIm5hbWVzIjpbXX0=