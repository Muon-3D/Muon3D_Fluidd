import { v4 as uuidv4 } from "/.vite-e2e/4291/deps/uuid.js?v=9b9fafc7";
export const defaultState = () => {
  return {
    layouts: {
      dashboard: {
        container1: [
          { id: "printer-status-card", enabled: true, collapsed: false },
          { id: "spoolman-card", enabled: true, collapsed: false },
          { id: "camera-card", enabled: true, collapsed: false },
          { id: "toolhead-card", enabled: true, collapsed: false },
          { id: "macros-card", enabled: true, collapsed: false },
          { id: "outputs-card", enabled: true, collapsed: false },
          { id: "runout-sensors-card", enabled: false, collapsed: false },
          { id: "printer-limits-card", enabled: true, collapsed: false },
          { id: "retract-card", enabled: true, collapsed: false }
        ],
        container2: [
          { id: "temperature-card", enabled: true, collapsed: false },
          { id: "sensors-card", enabled: true, collapsed: false },
          { id: "console-card", enabled: true, collapsed: false },
          { id: "jobs-card", enabled: true, collapsed: false },
          { id: "job-queue-card", enabled: false, collapsed: false },
          { id: "gcode-preview-card", enabled: true, collapsed: false },
          { id: "bed-mesh-card", enabled: false, collapsed: false }
        ]
      },
      diagnostics: {
        container1: [{
          id: uuidv4(),
          enabled: true,
          title: "Speeds",
          collapsed: false,
          height: 300,
          icon: "motion",
          axes: [{
            enabled: true,
            unit: "mm/s",
            showLegend: true,
            metrics: [{
              collector: "printer.motion_report.live_velocity",
              name: "Velocity",
              style: { lineStyle: "solid", lineColor: "#2196f3", fillColor: null, fillOpacity: 0, displayLegend: true }
            }, {
              collector: "printer.toolhead.max_velocity",
              name: "Max Velocity",
              style: { lineStyle: "dotted", lineColor: "#0075d2", fillColor: null, fillOpacity: 0, displayLegend: false }
            }]
          }, {
            enabled: true,
            unit: "mm³/s",
            showLegend: true,
            max: 20,
            metrics: [{
              collector: "printer.motion_report.live_extruder_velocity * Math.PI * (printer.configfile.settings.extruder.filament_diameter / 2) ** 2",
              name: "Flow",
              style: { lineStyle: "solid", lineColor: "#b12f36", fillColor: null, fillOpacity: 5, displayLegend: true }
            }, {
              collector: "12",
              name: "Max Flow",
              style: { lineStyle: "dashed", lineColor: "#820007", fillColor: null, fillOpacity: 0, displayLegend: false }
            }]
          }]
        }]
      }
    }
  };
};
export const newChartTemplate = () => {
  return defaultState().layouts.diagnostics.container1[0];
};
export const chartPresets = () => [
  {
    id: uuidv4(),
    enabled: true,
    title: "Temperatures",
    collapsed: false,
    height: 200,
    icon: "thermometer",
    axes: [{
      enabled: true,
      unit: "°C",
      showLegend: true,
      metrics: [
        { collector: "printer.extruder.temperature", name: "Nozzle", style: { lineStyle: "solid", lineColor: "#ff9f0a", fillColor: null, fillOpacity: 0, displayLegend: true } },
        { collector: "printer.extruder.target", name: "Nozzle target", style: { lineStyle: "dashed", lineColor: "#ff9f0a", fillColor: null, fillOpacity: 0, displayLegend: false } },
        { collector: "printer.heater_bed.temperature", name: "Bed", style: { lineStyle: "solid", lineColor: "#30b0c7", fillColor: null, fillOpacity: 0, displayLegend: true } },
        { collector: "printer.heater_bed.target", name: "Bed target", style: { lineStyle: "dashed", lineColor: "#30b0c7", fillColor: null, fillOpacity: 0, displayLegend: false } }
      ]
    }]
  },
  {
    id: uuidv4(),
    enabled: true,
    title: "MCU load",
    collapsed: false,
    height: 200,
    icon: "chip",
    axes: [{
      enabled: true,
      unit: "%",
      showLegend: true,
      min: 0,
      metrics: [
        { collector: "100 * (printer.mcu.last_stats.mcu_task_avg + 3 * printer.mcu.last_stats.mcu_task_stddev) / 0.0025", name: "Load", style: { lineStyle: "solid", lineColor: "#af52de", fillColor: null, fillOpacity: 0, displayLegend: true } },
        { collector: "100 * printer.mcu.last_stats.mcu_awake / 5", name: "Awake", style: { lineStyle: "dotted", lineColor: "#5e5ce6", fillColor: null, fillOpacity: 0, displayLegend: true } }
      ]
    }]
  },
  {
    id: uuidv4(),
    enabled: true,
    title: "Fans",
    collapsed: false,
    height: 200,
    icon: "fan",
    axes: [{
      enabled: true,
      unit: "%",
      showLegend: true,
      min: 0,
      max: 100,
      metrics: [
        { collector: "100 * printer.fan.speed", name: "Part fan", style: { lineStyle: "solid", lineColor: "#34c759", fillColor: null, fillOpacity: 0, displayLegend: true } }
      ]
    }]
  },
  {
    id: uuidv4(),
    enabled: true,
    title: "Speed and flow",
    collapsed: false,
    height: 200,
    icon: "motion",
    axes: [{
      enabled: true,
      unit: "mm/s",
      showLegend: true,
      metrics: [{
        collector: "printer.motion_report.live_velocity",
        name: "Velocity",
        style: { lineStyle: "solid", lineColor: "#2196f3", fillColor: null, fillOpacity: 0, displayLegend: true }
      }, {
        collector: "printer.toolhead.max_velocity",
        name: "Max Velocity",
        style: { lineStyle: "dotted", lineColor: "#0075d2", fillColor: null, fillOpacity: 0, displayLegend: false }
      }]
    }, {
      enabled: true,
      unit: "mm³/s",
      showLegend: true,
      max: 20,
      metrics: [{
        collector: "printer.motion_report.live_extruder_velocity * Math.PI * (printer.configfile.settings.extruder.filament_diameter / 2) ** 2",
        name: "Flow",
        style: { lineStyle: "solid", lineColor: "#b12f36", fillColor: null, fillOpacity: 5, displayLegend: true }
      }, {
        collector: "12",
        name: "Max Flow",
        style: { lineStyle: "dashed", lineColor: "#820007", fillColor: null, fillOpacity: 0, displayLegend: false }
      }]
    }]
  },
  {
    id: uuidv4(),
    enabled: true,
    title: "Pressure and load cell",
    collapsed: false,
    height: 200,
    icon: "sliders",
    axes: [{
      enabled: true,
      unit: "s",
      showLegend: true,
      metrics: [{
        collector: "printer.extruder?.pressure_advance ?? null",
        name: "Pressure advance",
        style: { lineStyle: "solid", lineColor: "#ffd60a", fillColor: null, fillOpacity: 0, displayLegend: true }
      }]
    }, {
      enabled: true,
      unit: "g",
      showLegend: true,
      metrics: [{
        collector: "printer.load_cell?.force_g ?? null",
        name: "Probe force",
        style: { lineStyle: "solid", lineColor: "#ff9f0a", fillColor: null, fillOpacity: 0, displayLegend: true }
      }]
    }]
  }
];
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTGF5b3V0U3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCdcbmltcG9ydCB0eXBlIHsgRGlhZ25vc3RpY3NDYXJkQ29uZmlnLCBEaWFnbm9zdGljc0NhcmRDb250YWluZXIgfSBmcm9tICdAL3N0b3JlL2RpYWdub3N0aWNzL3R5cGVzJ1xuXG4vKipcbiAqIE1haW50YWlucyB0aGUgc3RhdGUgb2Ygb3VyIHBhZ2UgbGF5b3V0cy5cbiAqIE1haW50YWlucztcbiAqIC0gUG9zaXRpb24gb2YgY2FyZC5cbiAqIC0gSWYgY2FyZCBpcyBjb2xsYXBzZWQgb3Igbm90LlxuICogLSBJZiBjYXJkIGlzIGVuYWJsZWQgb3Igbm90LlxuICovXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0YXRlID0gKCk6IExheW91dFN0YXRlID0+IHtcbiAgcmV0dXJuIHtcbiAgICBsYXlvdXRzOiB7XG4gICAgICBkYXNoYm9hcmQ6IHtcbiAgICAgICAgY29udGFpbmVyMTogW1xuICAgICAgICAgIHsgaWQ6ICdwcmludGVyLXN0YXR1cy1jYXJkJywgZW5hYmxlZDogdHJ1ZSwgY29sbGFwc2VkOiBmYWxzZSB9LFxuICAgICAgICAgIHsgaWQ6ICdzcG9vbG1hbi1jYXJkJywgZW5hYmxlZDogdHJ1ZSwgY29sbGFwc2VkOiBmYWxzZSB9LFxuICAgICAgICAgIHsgaWQ6ICdjYW1lcmEtY2FyZCcsIGVuYWJsZWQ6IHRydWUsIGNvbGxhcHNlZDogZmFsc2UgfSxcbiAgICAgICAgICB7IGlkOiAndG9vbGhlYWQtY2FyZCcsIGVuYWJsZWQ6IHRydWUsIGNvbGxhcHNlZDogZmFsc2UgfSxcbiAgICAgICAgICB7IGlkOiAnbWFjcm9zLWNhcmQnLCBlbmFibGVkOiB0cnVlLCBjb2xsYXBzZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgeyBpZDogJ291dHB1dHMtY2FyZCcsIGVuYWJsZWQ6IHRydWUsIGNvbGxhcHNlZDogZmFsc2UgfSxcbiAgICAgICAgICB7IGlkOiAncnVub3V0LXNlbnNvcnMtY2FyZCcsIGVuYWJsZWQ6IGZhbHNlLCBjb2xsYXBzZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgeyBpZDogJ3ByaW50ZXItbGltaXRzLWNhcmQnLCBlbmFibGVkOiB0cnVlLCBjb2xsYXBzZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgeyBpZDogJ3JldHJhY3QtY2FyZCcsIGVuYWJsZWQ6IHRydWUsIGNvbGxhcHNlZDogZmFsc2UgfVxuICAgICAgICBdLFxuICAgICAgICBjb250YWluZXIyOiBbXG4gICAgICAgICAgeyBpZDogJ3RlbXBlcmF0dXJlLWNhcmQnLCBlbmFibGVkOiB0cnVlLCBjb2xsYXBzZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgeyBpZDogJ3NlbnNvcnMtY2FyZCcsIGVuYWJsZWQ6IHRydWUsIGNvbGxhcHNlZDogZmFsc2UgfSxcbiAgICAgICAgICB7IGlkOiAnY29uc29sZS1jYXJkJywgZW5hYmxlZDogdHJ1ZSwgY29sbGFwc2VkOiBmYWxzZSB9LFxuICAgICAgICAgIHsgaWQ6ICdqb2JzLWNhcmQnLCBlbmFibGVkOiB0cnVlLCBjb2xsYXBzZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgeyBpZDogJ2pvYi1xdWV1ZS1jYXJkJywgZW5hYmxlZDogZmFsc2UsIGNvbGxhcHNlZDogZmFsc2UgfSxcbiAgICAgICAgICB7IGlkOiAnZ2NvZGUtcHJldmlldy1jYXJkJywgZW5hYmxlZDogdHJ1ZSwgY29sbGFwc2VkOiBmYWxzZSB9LFxuICAgICAgICAgIHsgaWQ6ICdiZWQtbWVzaC1jYXJkJywgZW5hYmxlZDogZmFsc2UsIGNvbGxhcHNlZDogZmFsc2UgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgZGlhZ25vc3RpY3M6IHtcbiAgICAgICAgY29udGFpbmVyMTogW3tcbiAgICAgICAgICBpZDogdXVpZHY0KCksXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0aXRsZTogJ1NwZWVkcycsXG4gICAgICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgICAgICBoZWlnaHQ6IDMwMCxcbiAgICAgICAgICBpY29uOiAnbW90aW9uJyxcbiAgICAgICAgICBheGVzOiBbe1xuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIHVuaXQ6ICdtbS9zJyxcbiAgICAgICAgICAgIHNob3dMZWdlbmQ6IHRydWUsXG4gICAgICAgICAgICBtZXRyaWNzOiBbe1xuICAgICAgICAgICAgICBjb2xsZWN0b3I6ICdwcmludGVyLm1vdGlvbl9yZXBvcnQubGl2ZV92ZWxvY2l0eScsXG4gICAgICAgICAgICAgIG5hbWU6ICdWZWxvY2l0eScsXG4gICAgICAgICAgICAgIHN0eWxlOiB7IGxpbmVTdHlsZTogJ3NvbGlkJywgbGluZUNvbG9yOiAnIzIxOTZmMycsIGZpbGxDb2xvcjogbnVsbCwgZmlsbE9wYWNpdHk6IDAsIGRpc3BsYXlMZWdlbmQ6IHRydWUgfVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBjb2xsZWN0b3I6ICdwcmludGVyLnRvb2xoZWFkLm1heF92ZWxvY2l0eScsXG4gICAgICAgICAgICAgIG5hbWU6ICdNYXggVmVsb2NpdHknLFxuICAgICAgICAgICAgICBzdHlsZTogeyBsaW5lU3R5bGU6ICdkb3R0ZWQnLCBsaW5lQ29sb3I6ICcjMDA3NWQyJywgZmlsbENvbG9yOiBudWxsLCBmaWxsT3BhY2l0eTogMCwgZGlzcGxheUxlZ2VuZDogZmFsc2UgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgdW5pdDogJ21twrMvcycsXG4gICAgICAgICAgICBzaG93TGVnZW5kOiB0cnVlLFxuICAgICAgICAgICAgbWF4OiAyMCxcbiAgICAgICAgICAgIG1ldHJpY3M6IFt7XG4gICAgICAgICAgICAgIGNvbGxlY3RvcjogJ3ByaW50ZXIubW90aW9uX3JlcG9ydC5saXZlX2V4dHJ1ZGVyX3ZlbG9jaXR5ICogTWF0aC5QSSAqICcgK1xuICAgICAgICAgICAgICAgICcocHJpbnRlci5jb25maWdmaWxlLnNldHRpbmdzLmV4dHJ1ZGVyLmZpbGFtZW50X2RpYW1ldGVyIC8gMikgKiogMicsXG4gICAgICAgICAgICAgIG5hbWU6ICdGbG93JyxcbiAgICAgICAgICAgICAgc3R5bGU6IHsgbGluZVN0eWxlOiAnc29saWQnLCBsaW5lQ29sb3I6ICcjYjEyZjM2JywgZmlsbENvbG9yOiBudWxsLCBmaWxsT3BhY2l0eTogNSwgZGlzcGxheUxlZ2VuZDogdHJ1ZSB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIGNvbGxlY3RvcjogJzEyJyxcbiAgICAgICAgICAgICAgbmFtZTogJ01heCBGbG93JyxcbiAgICAgICAgICAgICAgc3R5bGU6IHsgbGluZVN0eWxlOiAnZGFzaGVkJywgbGluZUNvbG9yOiAnIzgyMDAwNycsIGZpbGxDb2xvcjogbnVsbCwgZmlsbE9wYWNpdHk6IDAsIGRpc3BsYXlMZWdlbmQ6IGZhbHNlIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfV1cbiAgICAgICAgfV1cbiAgICAgIH0gYXMgRGlhZ25vc3RpY3NDYXJkQ29udGFpbmVyXG4gICAgfVxuICB9XG59XG5cbi8qKiBXaGF0IGEgbmV3IGNoYXJ0IHN0YXJ0cyBhcyBpbiB0aGUgY2hhcnQgZWRpdG9yOiB0aGUgZGVmYXVsdCBTcGVlZHMgY2hhcnQuICovXG5leHBvcnQgY29uc3QgbmV3Q2hhcnRUZW1wbGF0ZSA9ICgpOiBEaWFnbm9zdGljc0NhcmRDb25maWcgPT4ge1xuICByZXR1cm4gKGRlZmF1bHRTdGF0ZSgpLmxheW91dHMuZGlhZ25vc3RpY3MuY29udGFpbmVyMSBhcyBEaWFnbm9zdGljc0NhcmRDb25maWdbXSlbMF1cbn1cblxuLyoqXG4gKiBDaGFydHMgdG8gc3RhcnQgZnJvbSBpbiB0aGUgaGVhZGVyJ3MgQWRkIGNoYXJ0LCBiZXNpZGVzIGEgY3VzdG9tIG9uZS4gVGhleVxuICogYXJlIG5vdCBpbiB0aGUgZGVmYXVsdCBsYXlvdXQ6IHRoZSBwcmludGVyIHN0YXJ0cyB3aXRoIHRoZSBTcGVlZHMgY2hhcnQsIGFuZFxuICogdGhlIHVzZXIgYWRkcyB0aGVzZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGNoYXJ0UHJlc2V0cyA9ICgpOiBEaWFnbm9zdGljc0NhcmRDb25maWdbXSA9PiBbXG4gIHtcbiAgICBpZDogdXVpZHY0KCksXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICB0aXRsZTogJ1RlbXBlcmF0dXJlcycsXG4gICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICBoZWlnaHQ6IDIwMCxcbiAgICBpY29uOiAndGhlcm1vbWV0ZXInLFxuICAgIGF4ZXM6IFt7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgdW5pdDogJ8KwQycsXG4gICAgICBzaG93TGVnZW5kOiB0cnVlLFxuICAgICAgbWV0cmljczogW1xuICAgICAgICB7IGNvbGxlY3RvcjogJ3ByaW50ZXIuZXh0cnVkZXIudGVtcGVyYXR1cmUnLCBuYW1lOiAnTm96emxlJywgc3R5bGU6IHsgbGluZVN0eWxlOiAnc29saWQnLCBsaW5lQ29sb3I6ICcjZmY5ZjBhJywgZmlsbENvbG9yOiBudWxsLCBmaWxsT3BhY2l0eTogMCwgZGlzcGxheUxlZ2VuZDogdHJ1ZSB9IH0sXG4gICAgICAgIHsgY29sbGVjdG9yOiAncHJpbnRlci5leHRydWRlci50YXJnZXQnLCBuYW1lOiAnTm96emxlIHRhcmdldCcsIHN0eWxlOiB7IGxpbmVTdHlsZTogJ2Rhc2hlZCcsIGxpbmVDb2xvcjogJyNmZjlmMGEnLCBmaWxsQ29sb3I6IG51bGwsIGZpbGxPcGFjaXR5OiAwLCBkaXNwbGF5TGVnZW5kOiBmYWxzZSB9IH0sXG4gICAgICAgIHsgY29sbGVjdG9yOiAncHJpbnRlci5oZWF0ZXJfYmVkLnRlbXBlcmF0dXJlJywgbmFtZTogJ0JlZCcsIHN0eWxlOiB7IGxpbmVTdHlsZTogJ3NvbGlkJywgbGluZUNvbG9yOiAnIzMwYjBjNycsIGZpbGxDb2xvcjogbnVsbCwgZmlsbE9wYWNpdHk6IDAsIGRpc3BsYXlMZWdlbmQ6IHRydWUgfSB9LFxuICAgICAgICB7IGNvbGxlY3RvcjogJ3ByaW50ZXIuaGVhdGVyX2JlZC50YXJnZXQnLCBuYW1lOiAnQmVkIHRhcmdldCcsIHN0eWxlOiB7IGxpbmVTdHlsZTogJ2Rhc2hlZCcsIGxpbmVDb2xvcjogJyMzMGIwYzcnLCBmaWxsQ29sb3I6IG51bGwsIGZpbGxPcGFjaXR5OiAwLCBkaXNwbGF5TGVnZW5kOiBmYWxzZSB9IH1cbiAgICAgIF1cbiAgICB9XVxuICB9LCB7XG4gICAgaWQ6IHV1aWR2NCgpLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgdGl0bGU6ICdNQ1UgbG9hZCcsXG4gICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICBoZWlnaHQ6IDIwMCxcbiAgICBpY29uOiAnY2hpcCcsXG4gICAgYXhlczogW3tcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB1bml0OiAnJScsXG4gICAgICBzaG93TGVnZW5kOiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWV0cmljczogW1xuICAgICAgICB7IGNvbGxlY3RvcjogJzEwMCAqIChwcmludGVyLm1jdS5sYXN0X3N0YXRzLm1jdV90YXNrX2F2ZyArIDMgKiBwcmludGVyLm1jdS5sYXN0X3N0YXRzLm1jdV90YXNrX3N0ZGRldikgLyAwLjAwMjUnLCBuYW1lOiAnTG9hZCcsIHN0eWxlOiB7IGxpbmVTdHlsZTogJ3NvbGlkJywgbGluZUNvbG9yOiAnI2FmNTJkZScsIGZpbGxDb2xvcjogbnVsbCwgZmlsbE9wYWNpdHk6IDAsIGRpc3BsYXlMZWdlbmQ6IHRydWUgfSB9LFxuICAgICAgICB7IGNvbGxlY3RvcjogJzEwMCAqIHByaW50ZXIubWN1Lmxhc3Rfc3RhdHMubWN1X2F3YWtlIC8gNScsIG5hbWU6ICdBd2FrZScsIHN0eWxlOiB7IGxpbmVTdHlsZTogJ2RvdHRlZCcsIGxpbmVDb2xvcjogJyM1ZTVjZTYnLCBmaWxsQ29sb3I6IG51bGwsIGZpbGxPcGFjaXR5OiAwLCBkaXNwbGF5TGVnZW5kOiB0cnVlIH0gfVxuICAgICAgXVxuICAgIH1dXG4gIH0sIHtcbiAgICBpZDogdXVpZHY0KCksXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICB0aXRsZTogJ0ZhbnMnLFxuICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgaGVpZ2h0OiAyMDAsXG4gICAgaWNvbjogJ2ZhbicsXG4gICAgYXhlczogW3tcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB1bml0OiAnJScsXG4gICAgICBzaG93TGVnZW5kOiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiAxMDAsXG4gICAgICBtZXRyaWNzOiBbXG4gICAgICAgIHsgY29sbGVjdG9yOiAnMTAwICogcHJpbnRlci5mYW4uc3BlZWQnLCBuYW1lOiAnUGFydCBmYW4nLCBzdHlsZTogeyBsaW5lU3R5bGU6ICdzb2xpZCcsIGxpbmVDb2xvcjogJyMzNGM3NTknLCBmaWxsQ29sb3I6IG51bGwsIGZpbGxPcGFjaXR5OiAwLCBkaXNwbGF5TGVnZW5kOiB0cnVlIH0gfVxuICAgICAgXVxuICAgIH1dXG4gIH0sIHtcbiAgICBpZDogdXVpZHY0KCksXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICB0aXRsZTogJ1NwZWVkIGFuZCBmbG93JyxcbiAgICBjb2xsYXBzZWQ6IGZhbHNlLFxuICAgIGhlaWdodDogMjAwLFxuICAgIGljb246ICdtb3Rpb24nLFxuICAgIGF4ZXM6IFt7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgdW5pdDogJ21tL3MnLFxuICAgICAgc2hvd0xlZ2VuZDogdHJ1ZSxcbiAgICAgIG1ldHJpY3M6IFt7XG4gICAgICAgIGNvbGxlY3RvcjogJ3ByaW50ZXIubW90aW9uX3JlcG9ydC5saXZlX3ZlbG9jaXR5JyxcbiAgICAgICAgbmFtZTogJ1ZlbG9jaXR5JyxcbiAgICAgICAgc3R5bGU6IHsgbGluZVN0eWxlOiAnc29saWQnLCBsaW5lQ29sb3I6ICcjMjE5NmYzJywgZmlsbENvbG9yOiBudWxsLCBmaWxsT3BhY2l0eTogMCwgZGlzcGxheUxlZ2VuZDogdHJ1ZSB9XG4gICAgICB9LCB7XG4gICAgICAgIGNvbGxlY3RvcjogJ3ByaW50ZXIudG9vbGhlYWQubWF4X3ZlbG9jaXR5JyxcbiAgICAgICAgbmFtZTogJ01heCBWZWxvY2l0eScsXG4gICAgICAgIHN0eWxlOiB7IGxpbmVTdHlsZTogJ2RvdHRlZCcsIGxpbmVDb2xvcjogJyMwMDc1ZDInLCBmaWxsQ29sb3I6IG51bGwsIGZpbGxPcGFjaXR5OiAwLCBkaXNwbGF5TGVnZW5kOiBmYWxzZSB9XG4gICAgICB9XVxuICAgIH0sIHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB1bml0OiAnbW3Csy9zJyxcbiAgICAgIHNob3dMZWdlbmQ6IHRydWUsXG4gICAgICBtYXg6IDIwLFxuICAgICAgbWV0cmljczogW3tcbiAgICAgICAgY29sbGVjdG9yOiAncHJpbnRlci5tb3Rpb25fcmVwb3J0LmxpdmVfZXh0cnVkZXJfdmVsb2NpdHkgKiBNYXRoLlBJICogJyArXG4gICAgICAgICAgICAnKHByaW50ZXIuY29uZmlnZmlsZS5zZXR0aW5ncy5leHRydWRlci5maWxhbWVudF9kaWFtZXRlciAvIDIpICoqIDInLFxuICAgICAgICBuYW1lOiAnRmxvdycsXG4gICAgICAgIHN0eWxlOiB7IGxpbmVTdHlsZTogJ3NvbGlkJywgbGluZUNvbG9yOiAnI2IxMmYzNicsIGZpbGxDb2xvcjogbnVsbCwgZmlsbE9wYWNpdHk6IDUsIGRpc3BsYXlMZWdlbmQ6IHRydWUgfVxuICAgICAgfSwge1xuICAgICAgICBjb2xsZWN0b3I6ICcxMicsXG4gICAgICAgIG5hbWU6ICdNYXggRmxvdycsXG4gICAgICAgIHN0eWxlOiB7IGxpbmVTdHlsZTogJ2Rhc2hlZCcsIGxpbmVDb2xvcjogJyM4MjAwMDcnLCBmaWxsQ29sb3I6IG51bGwsIGZpbGxPcGFjaXR5OiAwLCBkaXNwbGF5TGVnZW5kOiBmYWxzZSB9XG4gICAgICB9XVxuICAgIH1dXG4gIH0sIHtcbiAgICBpZDogdXVpZHY0KCksXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICB0aXRsZTogJ1ByZXNzdXJlIGFuZCBsb2FkIGNlbGwnLFxuICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgaGVpZ2h0OiAyMDAsXG4gICAgaWNvbjogJ3NsaWRlcnMnLFxuICAgIGF4ZXM6IFt7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgdW5pdDogJ3MnLFxuICAgICAgc2hvd0xlZ2VuZDogdHJ1ZSxcbiAgICAgIG1ldHJpY3M6IFt7XG4gICAgICAgIGNvbGxlY3RvcjogJ3ByaW50ZXIuZXh0cnVkZXI/LnByZXNzdXJlX2FkdmFuY2UgPz8gbnVsbCcsXG4gICAgICAgIG5hbWU6ICdQcmVzc3VyZSBhZHZhbmNlJyxcbiAgICAgICAgc3R5bGU6IHsgbGluZVN0eWxlOiAnc29saWQnLCBsaW5lQ29sb3I6ICcjZmZkNjBhJywgZmlsbENvbG9yOiBudWxsLCBmaWxsT3BhY2l0eTogMCwgZGlzcGxheUxlZ2VuZDogdHJ1ZSB9XG4gICAgICB9XVxuICAgIH0sIHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB1bml0OiAnZycsXG4gICAgICBzaG93TGVnZW5kOiB0cnVlLFxuICAgICAgbWV0cmljczogW3tcbiAgICAgICAgY29sbGVjdG9yOiAncHJpbnRlci5sb2FkX2NlbGw/LmZvcmNlX2cgPz8gbnVsbCcsXG4gICAgICAgIG5hbWU6ICdQcm9iZSBmb3JjZScsXG4gICAgICAgIHN0eWxlOiB7IGxpbmVTdHlsZTogJ3NvbGlkJywgbGluZUNvbG9yOiAnI2ZmOWYwYScsIGZpbGxDb2xvcjogbnVsbCwgZmlsbE9wYWNpdHk6IDAsIGRpc3BsYXlMZWdlbmQ6IHRydWUgfVxuICAgICAgfV1cbiAgICB9XVxuICB9XG5dXG5cbmV4cG9ydCBjb25zdCBzdGF0ZSA9IGRlZmF1bHRTdGF0ZSgpXG4iXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsTUFBTSxjQUFjO0FBVXRCLGFBQU0sZUFBZSxNQUFtQjtBQUM3QyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEs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