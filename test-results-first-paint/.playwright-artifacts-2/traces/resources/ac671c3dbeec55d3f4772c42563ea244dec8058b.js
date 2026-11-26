/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import { chartWindows, defaultChartWindow, sensorRows } from "/src/services/overview/model.ts";
import { observedEvents } from "/src/services/overview/timeline.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import NumberField from "/src/components/control/NumberField.vue";
import ThermalGraph from "/src/components/charts/ThermalGraph.vue";
const COLORS = { extruder: "#ff8c42", heater_bed: "#6aa8ff" };
const MORE_COLORS = ["#b38cff", "#4fd1a5", "#e6c84a", "#ff6b9a", "#8ab4c8", "#c49a6c"];
let GraphTile = class extends Mixins(OverviewMixin) {
  table = false;
  pickedWindow = null;
  previous = null;
  markers = [];
  observedSince = 0;
  get phone() {
    return !!this.$vuetify?.breakpoint?.mobile;
  }
  get windows() {
    return chartWindows(this.$store.getters["charts/getChartRetention"]);
  }
  get rangeOptions() {
    return this.windows.map((w) => ({ value: w.value, label: w.value >= 3600 ? `${w.value / 3600}h` : `${Math.round(w.value / 60)}m`, title: w.label }));
  }
  /** The window picked, while the store keeps that much; else the default. */
  get windowSeconds() {
    const picked = this.pickedWindow;
    if (picked !== null && this.windows.some((w) => w.value === picked)) return picked;
    return defaultChartWindow(this.windows);
  }
  set windowSeconds(value) {
    this.pickedWindow = value;
  }
  get sensors() {
    return this.$store.getters["printer/getSensors"] ?? [];
  }
  get allKeys() {
    const main = ["extruder", "heater_bed"].filter((k) => this.heaters.some((h) => h.name === k));
    const others = this.heaters.map((h) => h.name).filter((k) => !main.includes(k));
    return [...main, ...others, ...this.sensors.map((s) => s.key)];
  }
  get rows() {
    return sensorRows(this.heaters, this.sensors).map((row) => ({ ...row, context: this.panelTarget }));
  }
  commitTarget(context, heater, value) {
    if (context === this.panelTarget) this.setHeater(heater, value);
  }
  colorOf(key) {
    if (COLORS[key]) return COLORS[key];
    const others = this.allKeys.filter((k) => !COLORS[k]);
    const i = others.indexOf(key);
    return i >= 0 ? MORE_COLORS[i % MORE_COLORS.length] : "var(--m3d-text-muted)";
  }
  get diagnosticsOn() {
    return !!this.$store.state.config.uiSettings.general.enableDiagnostics;
  }
  get menu() {
    const items = [
      { id: "table", label: this.table ? "Show the graph" : "Show every sensor as a table", action: () => {
        this.table = !this.table;
      } },
      { id: "presets", label: "Temperature presets\u2026", to: `${this.pagePath("/settings")}#presets` }
    ];
    if (this.diagnosticsOn) items.push({ id: "charts", label: "Open Charts\u2026", to: this.pagePath("/diagnostics") });
    return items;
  }
  // What has been seen happen to the print, drawn on the graph. Only real changes are kept.
  get currentHistory() {
    return this.$store.state.history?.jobs?.find((j) => j.status === "in_progress" && j.filename === this.jobFile);
  }
  get historyContext() {
    return `${this.panelTarget}|${this.currentHistory?.job_id ?? this.jobFile}|${this.socketConnected && this.klippyConnected}`;
  }
  get liveObservation() {
    const printer = this.$store.state.printer.printer;
    const filament = {};
    for (const [key, value] of Object.entries(printer)) {
      const sensor = value;
      if (/^filament_(switch|motion)_sensor /.test(key) && typeof sensor?.filament_detected === "boolean") filament[key] = sensor.filament_detected;
    }
    return { context: this.historyContext, layer: printer.print_stats?.info?.current_layer, paused: printer.pause_resume?.is_paused, duration: printer.print_stats?.total_duration, filament };
  }
  recordObservation(current) {
    if (!this.socketConnected || !this.klippyConnected || !this.apiConnected) {
      this.previous = null;
      this.markers = [];
      this.observedSince = 0;
      return;
    }
    const at = Date.now();
    if (!this.previous || current.context !== this.previous.context || typeof current.duration === "number" && typeof this.previous.duration === "number" && current.duration < this.previous.duration) {
      this.markers = [];
      this.observedSince = at;
      this.previous = null;
    }
    this.markers.push(...observedEvents(this.previous, current, at));
    if (this.markers.length > 512) {
      this.markers = this.markers.slice(-512);
      this.observedSince = this.markers[0].at;
    }
    this.previous = current;
  }
};
__decorateClass([
  Watch("liveObservation", { deep: true, immediate: true })
], GraphTile.prototype, "recordObservation", 1);
GraphTile = __decorateClass([
  Component({ components: { TileShell, SegPicker, NumberField, ThermalGraph } })
], GraphTile);
const _sfc_main = GraphTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { staticClass: "gt", attrs: { "tile": "graph", "title": "Temperatures", "icon": "pulse", "menu": _vm.menu }, scopedSlots: _vm._u([_vm.size === "L" ? { key: "head", fn: function() {
    return [_c("seg-picker", { staticClass: "gt__range", attrs: { "data-tid": "graph-range", "options": _vm.rangeOptions, "value": _vm.windowSeconds, "label": "Time shown" }, on: { "input": function($event) {
      _vm.windowSeconds = $event;
    } } })];
  }, proxy: true } : null], null, true) }, [_vm.table || _vm.size === "S" ? _c("table", { staticClass: "gt__table", attrs: { "data-tid": "graph-table" } }, [_c("thead", [_c("tr", [_c("th", [_vm._v("Name")]), _c("th", [_vm._v("Power")]), _c("th", [_vm._v("Actual")]), _c("th", [_vm._v("Target")])])]), _c("tbody", _vm._l(_vm.rows, function(row) {
    return _c("tr", { key: row.context + row.key }, [_c("td", [_c("i", { staticClass: "gt__swatch", style: { background: _vm.colorOf(row.key) } }), _vm._v(_vm._s(row.label) + " ")]), _c("td", { staticClass: "gt__num" }, [_vm._v(" " + _vm._s(row.power === null ? "\u2014" : `${row.power}%`) + " ")]), _c("td", { staticClass: "gt__num gt__actual" }, [_vm._v(" " + _vm._s(row.actual) + " ")]), _c("td", [row.heater ? _c("number-field", { staticClass: "gt__target", attrs: { "value": row.heater.target, "unit": "\xB0", "label": `${row.label} target`, "min": 0, "max": row.heater.maxTemp || 350, "disabled": !_vm.controlReady }, on: { "change": function($event) {
      return _vm.commitTarget(row.context, row.heater, $event);
    } } }) : _c("span", { staticClass: "gt__none" }, [_vm._v("\u2014")])], 1)]);
  }), 0)]) : _c("thermal-graph", { attrs: { "events": _vm.markers, "window-seconds": _vm.windowSeconds, "phone": _vm.phone || _vm.size === "M" } })], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/GraphTile.vue?vue&type=style&index=0&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  null,
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/GraphTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtGQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQVNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQVJBO0FBQUEsRUFEQTtBQUFBLEdBakZBLFVBa0ZBO0FBbEZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkdyYXBoVGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dGlsZS1zaGVsbFxuICAgIHRpbGU9XCJncmFwaFwiXG4gICAgdGl0bGU9XCJUZW1wZXJhdHVyZXNcIlxuICAgIGljb249XCJwdWxzZVwiXG4gICAgOm1lbnU9XCJtZW51XCJcbiAgICBjbGFzcz1cImd0XCJcbiAgPlxuICAgIDx0ZW1wbGF0ZVxuICAgICAgdi1pZj1cInNpemUgPT09ICdMJ1wiXG4gICAgICAjaGVhZFxuICAgID5cbiAgICAgIDxzZWctcGlja2VyXG4gICAgICAgIGRhdGEtdGlkPVwiZ3JhcGgtcmFuZ2VcIlxuICAgICAgICBjbGFzcz1cImd0X19yYW5nZVwiXG4gICAgICAgIDpvcHRpb25zPVwicmFuZ2VPcHRpb25zXCJcbiAgICAgICAgOnZhbHVlPVwid2luZG93U2Vjb25kc1wiXG4gICAgICAgIGxhYmVsPVwiVGltZSBzaG93blwiXG4gICAgICAgIEBpbnB1dD1cIndpbmRvd1NlY29uZHMgPSAkZXZlbnRcIlxuICAgICAgLz5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPHRhYmxlXG4gICAgICB2LWlmPVwidGFibGUgfHwgc2l6ZSA9PT0gJ1MnXCJcbiAgICAgIGNsYXNzPVwiZ3RfX3RhYmxlXCJcbiAgICAgIGRhdGEtdGlkPVwiZ3JhcGgtdGFibGVcIlxuICAgID5cbiAgICAgIDx0aGVhZD5cbiAgICAgICAgPHRyPlxuICAgICAgICAgIDx0aD5OYW1lPC90aD5cbiAgICAgICAgICA8dGg+UG93ZXI8L3RoPlxuICAgICAgICAgIDx0aD5BY3R1YWw8L3RoPlxuICAgICAgICAgIDx0aD5UYXJnZXQ8L3RoPlxuICAgICAgICA8L3RyPlxuICAgICAgPC90aGVhZD5cbiAgICAgIDx0Ym9keT5cbiAgICAgICAgPHRyXG4gICAgICAgICAgdi1mb3I9XCJyb3cgaW4gcm93c1wiXG4gICAgICAgICAgOmtleT1cInJvdy5jb250ZXh0ICsgcm93LmtleVwiXG4gICAgICAgID5cbiAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICA8aVxuICAgICAgICAgICAgICBjbGFzcz1cImd0X19zd2F0Y2hcIlxuICAgICAgICAgICAgICA6c3R5bGU9XCJ7IGJhY2tncm91bmQ6IGNvbG9yT2Yocm93LmtleSkgfVwiXG4gICAgICAgICAgICAvPnt7IHJvdy5sYWJlbCB9fVxuICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPHRkIGNsYXNzPVwiZ3RfX251bVwiPlxuICAgICAgICAgICAge3sgcm93LnBvd2VyID09PSBudWxsID8gJ+KAlCcgOiBgJHtyb3cucG93ZXJ9JWAgfX1cbiAgICAgICAgICA8L3RkPlxuICAgICAgICAgIDx0ZCBjbGFzcz1cImd0X19udW0gZ3RfX2FjdHVhbFwiPlxuICAgICAgICAgICAge3sgcm93LmFjdHVhbCB9fVxuICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPHRkPlxuICAgICAgICAgICAgPG51bWJlci1maWVsZFxuICAgICAgICAgICAgICB2LWlmPVwicm93LmhlYXRlclwiXG4gICAgICAgICAgICAgIDp2YWx1ZT1cInJvdy5oZWF0ZXIudGFyZ2V0XCJcbiAgICAgICAgICAgICAgdW5pdD1cIsKwXCJcbiAgICAgICAgICAgICAgOmxhYmVsPVwiYCR7cm93LmxhYmVsfSB0YXJnZXRgXCJcbiAgICAgICAgICAgICAgOm1pbj1cIjBcIlxuICAgICAgICAgICAgICA6bWF4PVwicm93LmhlYXRlci5tYXhUZW1wIHx8IDM1MFwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgICAgICBjbGFzcz1cImd0X190YXJnZXRcIlxuICAgICAgICAgICAgICBAY2hhbmdlPVwiY29tbWl0VGFyZ2V0KHJvdy5jb250ZXh0LCByb3cuaGVhdGVyLCAkZXZlbnQpXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICAgICAgY2xhc3M9XCJndF9fbm9uZVwiXG4gICAgICAgICAgICA+4oCUPC9zcGFuPlxuICAgICAgICAgIDwvdGQ+XG4gICAgICAgIDwvdHI+XG4gICAgICA8L3Rib2R5PlxuICAgIDwvdGFibGU+XG4gICAgPHRoZXJtYWwtZ3JhcGhcbiAgICAgIHYtZWxzZVxuICAgICAgOmV2ZW50cz1cIm1hcmtlcnNcIlxuICAgICAgOndpbmRvdy1zZWNvbmRzPVwid2luZG93U2Vjb25kc1wiXG4gICAgICA6cGhvbmU9XCJwaG9uZSB8fCBzaXplID09PSAnTSdcIlxuICAgIC8+XG4gIDwvdGlsZS1zaGVsbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5pbXBvcnQgeyBjaGFydFdpbmRvd3MsIGRlZmF1bHRDaGFydFdpbmRvdywgc2Vuc29yUm93cywgdHlwZSBTZW5zb3JSb3cgfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L21vZGVsJ1xuaW1wb3J0IHsgb2JzZXJ2ZWRFdmVudHMsIHR5cGUgT2JzZXJ2YXRpb24gfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L3RpbWVsaW5lJ1xuaW1wb3J0IHR5cGUgeyBUaWxlTWVudUl0ZW0gfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L3RpbGVzJ1xuaW1wb3J0IHR5cGUgeyBIZWF0ZXIsIFNlbnNvciB9IGZyb20gJ0Avc3RvcmUvcHJpbnRlci90eXBlcydcbmltcG9ydCB0eXBlIHsgSGlzdG9yeUl0ZW0gfSBmcm9tICdAL3N0b3JlL2hpc3RvcnkvdHlwZXMnXG5pbXBvcnQgVGlsZVNoZWxsIGZyb20gJy4vVGlsZVNoZWxsLnZ1ZSdcbmltcG9ydCBTZWdQaWNrZXIsIHsgdHlwZSBTZWdPcHRpb24gfSBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9TZWdQaWNrZXIudnVlJ1xuaW1wb3J0IE51bWJlckZpZWxkIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL051bWJlckZpZWxkLnZ1ZSdcbmltcG9ydCBUaGVybWFsR3JhcGggZnJvbSAnQC9jb21wb25lbnRzL2NoYXJ0cy9UaGVybWFsR3JhcGgudnVlJ1xuXG5jb25zdCBDT0xPUlM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IGV4dHJ1ZGVyOiAnI2ZmOGM0MicsIGhlYXRlcl9iZWQ6ICcjNmFhOGZmJyB9XG4vKiogRm9yIHRoZSBvdGhlciBoZWF0ZXJzIGFuZCBzZW5zb3JzLCBpbiBvcmRlci4gKi9cbmNvbnN0IE1PUkVfQ09MT1JTID0gWycjYjM4Y2ZmJywgJyM0ZmQxYTUnLCAnI2U2Yzg0YScsICcjZmY2YjlhJywgJyM4YWI0YzgnLCAnI2M0OWE2YyddXG5cbi8qKlxuICogVGhlIHRlbXBlcmF0dXJlIGdyYXBoICh0aGUgc2FtZSBvbmUgYXMgYmVmb3JlOiBldmVyeSBoZWF0ZXIsIHNlbnNvciBhbmRcbiAqIGZhbiwgZWFjaCBsYWJlbGxlZCwgZWFjaCBzd2l0Y2hlZCBvbiBvciBvZmYgZnJvbSBpdHMgb3duIGNoaXApLCBmb3IgdGhlXG4gKiB0aW1lIHNob3duLCB3aXRoIG9ic2VydmVkIG1hcmtlcnMgKGxheWVyIGNoYW5nZXMsIHBhdXNlcykuIFRoZSB0aHJlZSBkb3RzXG4gKiBzd2FwIGl0IGZvciBhIHRhYmxlIG9mIGV2ZXJ5IHNlbnNvciB3aXRoIGV4YWN0IHRhcmdldHMuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRpbGVTaGVsbCwgU2VnUGlja2VyLCBOdW1iZXJGaWVsZCwgVGhlcm1hbEdyYXBoIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyYXBoVGlsZSBleHRlbmRzIE1peGlucyhPdmVydmlld01peGluKSB7XG4gIHRhYmxlID0gZmFsc2VcbiAgcGlja2VkV2luZG93OiBudW1iZXIgfCBudWxsID0gbnVsbFxuICBwcmV2aW91czogT2JzZXJ2YXRpb24gfCBudWxsID0gbnVsbFxuICBtYXJrZXJzOiBBcnJheTx7IGF0OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcgfT4gPSBbXVxuICBvYnNlcnZlZFNpbmNlID0gMFxuXG4gIGdldCBwaG9uZSAoKTogYm9vbGVhbiB7IHJldHVybiAhIXRoaXMuJHZ1ZXRpZnk/LmJyZWFrcG9pbnQ/Lm1vYmlsZSB9XG5cbiAgZ2V0IHdpbmRvd3MgKCk6IEFycmF5PHsgdmFsdWU6IG51bWJlciwgbGFiZWw6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIGNoYXJ0V2luZG93cyh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjaGFydHMvZ2V0Q2hhcnRSZXRlbnRpb24nXSBhcyBudW1iZXIpXG4gIH1cblxuICBnZXQgcmFuZ2VPcHRpb25zICgpOiBTZWdPcHRpb25bXSB7XG4gICAgcmV0dXJuIHRoaXMud2luZG93cy5tYXAodyA9PiAoeyB2YWx1ZTogdy52YWx1ZSwgbGFiZWw6IHcudmFsdWUgPj0gMzYwMCA/IGAke3cudmFsdWUgLyAzNjAwfWhgIDogYCR7TWF0aC5yb3VuZCh3LnZhbHVlIC8gNjApfW1gLCB0aXRsZTogdy5sYWJlbCB9KSlcbiAgfVxuXG4gIC8qKiBUaGUgd2luZG93IHBpY2tlZCwgd2hpbGUgdGhlIHN0b3JlIGtlZXBzIHRoYXQgbXVjaDsgZWxzZSB0aGUgZGVmYXVsdC4gKi9cbiAgZ2V0IHdpbmRvd1NlY29uZHMgKCk6IG51bWJlciB7XG4gICAgY29uc3QgcGlja2VkID0gdGhpcy5waWNrZWRXaW5kb3dcbiAgICBpZiAocGlja2VkICE9PSBudWxsICYmIHRoaXMud2luZG93cy5zb21lKHcgPT4gdy52YWx1ZSA9PT0gcGlja2VkKSkgcmV0dXJuIHBpY2tlZFxuICAgIHJldHVybiBkZWZhdWx0Q2hhcnRXaW5kb3codGhpcy53aW5kb3dzKVxuICB9XG5cbiAgc2V0IHdpbmRvd1NlY29uZHMgKHZhbHVlOiBudW1iZXIpIHsgdGhpcy5waWNrZWRXaW5kb3cgPSB2YWx1ZSB9XG5cbiAgZ2V0IHNlbnNvcnMgKCk6IFNlbnNvcltdIHtcbiAgICByZXR1cm4gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0U2Vuc29ycyddIGFzIFNlbnNvcltdIHwgdW5kZWZpbmVkKSA/PyBbXVxuICB9XG5cbiAgZ2V0IGFsbEtleXMgKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBtYWluID0gWydleHRydWRlcicsICdoZWF0ZXJfYmVkJ10uZmlsdGVyKGsgPT4gdGhpcy5oZWF0ZXJzLnNvbWUoaCA9PiBoLm5hbWUgPT09IGspKVxuICAgIGNvbnN0IG90aGVycyA9IHRoaXMuaGVhdGVycy5tYXAoaCA9PiBoLm5hbWUpLmZpbHRlcihrID0+ICFtYWluLmluY2x1ZGVzKGspKVxuICAgIHJldHVybiBbLi4ubWFpbiwgLi4ub3RoZXJzLCAuLi50aGlzLnNlbnNvcnMubWFwKHMgPT4gcy5rZXkpXVxuICB9XG5cbiAgZ2V0IHJvd3MgKCk6IEFycmF5PFNlbnNvclJvdzxIZWF0ZXI+ICYgeyBjb250ZXh0OiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBzZW5zb3JSb3dzKHRoaXMuaGVhdGVycywgdGhpcy5zZW5zb3JzKS5tYXAocm93ID0+ICh7IC4uLnJvdywgY29udGV4dDogdGhpcy5wYW5lbFRhcmdldCB9KSlcbiAgfVxuXG4gIGNvbW1pdFRhcmdldCAoY29udGV4dDogc3RyaW5nLCBoZWF0ZXI6IEhlYXRlciwgdmFsdWU6IG51bWJlcikge1xuICAgIGlmIChjb250ZXh0ID09PSB0aGlzLnBhbmVsVGFyZ2V0KSB0aGlzLnNldEhlYXRlcihoZWF0ZXIsIHZhbHVlKVxuICB9XG5cbiAgY29sb3JPZiAoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChDT0xPUlNba2V5XSkgcmV0dXJuIENPTE9SU1trZXldXG4gICAgY29uc3Qgb3RoZXJzID0gdGhpcy5hbGxLZXlzLmZpbHRlcihrID0+ICFDT0xPUlNba10pXG4gICAgY29uc3QgaSA9IG90aGVycy5pbmRleE9mKGtleSlcbiAgICByZXR1cm4gaSA+PSAwID8gTU9SRV9DT0xPUlNbaSAlIE1PUkVfQ09MT1JTLmxlbmd0aF0gOiAndmFyKC0tbTNkLXRleHQtbXV0ZWQpJ1xuICB9XG5cbiAgZ2V0IGRpYWdub3N0aWNzT24gKCk6IGJvb2xlYW4geyByZXR1cm4gISF0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmVuYWJsZURpYWdub3N0aWNzIH1cblxuICBnZXQgbWVudSAoKTogVGlsZU1lbnVJdGVtW10ge1xuICAgIGNvbnN0IGl0ZW1zOiBUaWxlTWVudUl0ZW1bXSA9IFtcbiAgICAgIHsgaWQ6ICd0YWJsZScsIGxhYmVsOiB0aGlzLnRhYmxlID8gJ1Nob3cgdGhlIGdyYXBoJyA6ICdTaG93IGV2ZXJ5IHNlbnNvciBhcyBhIHRhYmxlJywgYWN0aW9uOiAoKSA9PiB7IHRoaXMudGFibGUgPSAhdGhpcy50YWJsZSB9IH0sXG4gICAgICB7IGlkOiAncHJlc2V0cycsIGxhYmVsOiAnVGVtcGVyYXR1cmUgcHJlc2V0c+KApicsIHRvOiBgJHt0aGlzLnBhZ2VQYXRoKCcvc2V0dGluZ3MnKX0jcHJlc2V0c2AgfVxuICAgIF1cbiAgICBpZiAodGhpcy5kaWFnbm9zdGljc09uKSBpdGVtcy5wdXNoKHsgaWQ6ICdjaGFydHMnLCBsYWJlbDogJ09wZW4gQ2hhcnRz4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy9kaWFnbm9zdGljcycpIH0pXG4gICAgcmV0dXJuIGl0ZW1zXG4gIH1cblxuICAvLyBXaGF0IGhhcyBiZWVuIHNlZW4gaGFwcGVuIHRvIHRoZSBwcmludCwgZHJhd24gb24gdGhlIGdyYXBoLiBPbmx5IHJlYWwgY2hhbmdlcyBhcmUga2VwdC5cbiAgZ2V0IGN1cnJlbnRIaXN0b3J5ICgpOiBIaXN0b3J5SXRlbSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmhpc3Rvcnk/LmpvYnM/LmZpbmQoKGo6IEhpc3RvcnlJdGVtKSA9PiBqLnN0YXR1cyA9PT0gJ2luX3Byb2dyZXNzJyAmJiBqLmZpbGVuYW1lID09PSB0aGlzLmpvYkZpbGUpXG4gIH1cblxuICBnZXQgaGlzdG9yeUNvbnRleHQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMucGFuZWxUYXJnZXR9fCR7dGhpcy5jdXJyZW50SGlzdG9yeT8uam9iX2lkID8/IHRoaXMuam9iRmlsZX18JHt0aGlzLnNvY2tldENvbm5lY3RlZCAmJiB0aGlzLmtsaXBweUNvbm5lY3RlZH1gXG4gIH1cblxuICBnZXQgbGl2ZU9ic2VydmF0aW9uICgpOiBPYnNlcnZhdGlvbiB7XG4gICAgY29uc3QgcHJpbnRlciA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlclxuICAgIGNvbnN0IGZpbGFtZW50OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJpbnRlcikpIHtcbiAgICAgIGNvbnN0IHNlbnNvciA9IHZhbHVlIGFzIHsgZmlsYW1lbnRfZGV0ZWN0ZWQ/OiBib29sZWFuIH0gfCBudWxsXG4gICAgICBpZiAoL15maWxhbWVudF8oc3dpdGNofG1vdGlvbilfc2Vuc29yIC8udGVzdChrZXkpICYmIHR5cGVvZiBzZW5zb3I/LmZpbGFtZW50X2RldGVjdGVkID09PSAnYm9vbGVhbicpIGZpbGFtZW50W2tleV0gPSBzZW5zb3IuZmlsYW1lbnRfZGV0ZWN0ZWRcbiAgICB9XG4gICAgcmV0dXJuIHsgY29udGV4dDogdGhpcy5oaXN0b3J5Q29udGV4dCwgbGF5ZXI6IHByaW50ZXIucHJpbnRfc3RhdHM/LmluZm8/LmN1cnJlbnRfbGF5ZXIsIHBhdXNlZDogcHJpbnRlci5wYXVzZV9yZXN1bWU/LmlzX3BhdXNlZCwgZHVyYXRpb246IHByaW50ZXIucHJpbnRfc3RhdHM/LnRvdGFsX2R1cmF0aW9uLCBmaWxhbWVudCB9XG4gIH1cblxuICBAV2F0Y2goJ2xpdmVPYnNlcnZhdGlvbicsIHsgZGVlcDogdHJ1ZSwgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIHJlY29yZE9ic2VydmF0aW9uIChjdXJyZW50OiBPYnNlcnZhdGlvbikge1xuICAgIGlmICghdGhpcy5zb2NrZXRDb25uZWN0ZWQgfHwgIXRoaXMua2xpcHB5Q29ubmVjdGVkIHx8ICF0aGlzLmFwaUNvbm5lY3RlZCkgeyB0aGlzLnByZXZpb3VzID0gbnVsbDsgdGhpcy5tYXJrZXJzID0gW107IHRoaXMub2JzZXJ2ZWRTaW5jZSA9IDA7IHJldHVybiB9XG4gICAgY29uc3QgYXQgPSBEYXRlLm5vdygpXG4gICAgaWYgKCF0aGlzLnByZXZpb3VzIHx8IGN1cnJlbnQuY29udGV4dCAhPT0gdGhpcy5wcmV2aW91cy5jb250ZXh0IHx8ICh0eXBlb2YgY3VycmVudC5kdXJhdGlvbiA9PT0gJ251bWJlcicgJiYgdHlwZW9mIHRoaXMucHJldmlvdXMuZHVyYXRpb24gPT09ICdudW1iZXInICYmIGN1cnJlbnQuZHVyYXRpb24gPCB0aGlzLnByZXZpb3VzLmR1cmF0aW9uKSkgeyB0aGlzLm1hcmtlcnMgPSBbXTsgdGhpcy5vYnNlcnZlZFNpbmNlID0gYXQ7IHRoaXMucHJldmlvdXMgPSBudWxsIH1cbiAgICB0aGlzLm1hcmtlcnMucHVzaCguLi5vYnNlcnZlZEV2ZW50cyh0aGlzLnByZXZpb3VzLCBjdXJyZW50LCBhdCkpXG4gICAgaWYgKHRoaXMubWFya2Vycy5sZW5ndGggPiA1MTIpIHsgdGhpcy5tYXJrZXJzID0gdGhpcy5tYXJrZXJzLnNsaWNlKC01MTIpOyB0aGlzLm9ic2VydmVkU2luY2UgPSB0aGlzLm1hcmtlcnNbMF0uYXQgfVxuICAgIHRoaXMucHJldmlvdXMgPSBjdXJyZW50XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbi5ndCB7IGNvbnRhaW5lci10eXBlOiBpbmxpbmUtc2l6ZTsgfVxuLmd0X19yYW5nZSB7IG1heC13aWR0aDogMjIwcHg7IH1cbi5ndF9fdGFibGUgeyB3aWR0aDogMTAwJTsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgZm9udC1zaXplOiAxNHB4OyB9XG4uZ3RfX3RhYmxlIHRoIHsgcGFkZGluZzogMCA4cHggOHB4IDA7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTJweDsgZm9udC13ZWlnaHQ6IDUwMDsgdGV4dC1hbGlnbjogbGVmdDsgfVxuLmd0X190YWJsZSB0ZCB7IGhlaWdodDogMzZweDsgcGFkZGluZzogMCA4cHggMCAwOyBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7IHdoaXRlLXNwYWNlOiBub3dyYXA7IH1cbi5ndF9fc3dhdGNoIHsgZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aWR0aDogMTBweDsgaGVpZ2h0OiAxMHB4OyBtYXJnaW4tcmlnaHQ6IDhweDsgYm9yZGVyLXJhZGl1czogM3B4OyB2ZXJ0aWNhbC1hbGlnbjogLTFweDsgfVxuLmd0X19udW0geyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zOyB9XG4uZ3RfX2FjdHVhbCB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cbi5ndF9fdGFyZ2V0IHsgd2lkdGg6IDg4cHg7IH1cbi5ndF9fbm9uZSB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9HcmFwaFRpbGUudnVlIn0=