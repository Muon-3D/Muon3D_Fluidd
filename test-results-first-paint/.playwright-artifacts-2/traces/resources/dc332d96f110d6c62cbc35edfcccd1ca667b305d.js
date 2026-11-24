/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import { heaterTile } from "/src/services/overview/model.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import NumberField from "/src/components/control/NumberField.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import HeaterSparkline from "/src/components/control/HeaterSparkline.vue";
let HeaterTile = class extends Mixins(OverviewMixin) {
  kind;
  open = false;
  closeOnSwitch() {
    this.open = false;
  }
  get name() {
    return this.kind === "bed" ? "Bed" : "Hotend";
  }
  get heater() {
    return this.kind === "bed" ? this.bed : this.nozzle;
  }
  get seriesKey() {
    return this.kind === "bed" ? "heater_bed" : "extruder";
  }
  /** The printer says the part is not there at all. */
  get disconnected() {
    const printer = this.$store.state.printer.printer;
    return this.kind === "bed" ? !!printer?.bed_removal_detector?.bedRemoved : !!printer?.["mcu toolhead"]?.non_critical_disconnected;
  }
  get locked() {
    return !this.heater || this.disconnected;
  }
  get maxTemp() {
    return this.heater?.maxTemp || 300;
  }
  get reading() {
    return this.heater ? heaterTile(this.heater.temperature, this.heater.target) : null;
  }
  get status() {
    const r = this.reading;
    if (!r) return { label: "", tone: "off" };
    if (r.status === "at temperature") return { label: "At temperature", tone: "ok" };
    if (r.status === "off") return { label: "Off", tone: "off" };
    return { label: r.status === "heating" ? "Heating" : "Cooling", tone: "warm" };
  }
  get valueText() {
    return this.heater && !this.disconnected ? `${this.heater.temperature.toFixed(1)}\xB0` : "\u2014";
  }
  get nowText() {
    return this.heater ? `${this.heater.temperature.toFixed(1)}\xB0` : "\u2014";
  }
  get targetText() {
    return this.heater && !this.disconnected && this.heater.target ? `${Math.round(this.heater.target)}\xB0` : "";
  }
  get barFraction() {
    return this.reading?.progress ?? 0;
  }
  /** The materials that say a temperature for this heater. */
  get presetChoices() {
    return this.materialChoices.map((m) => ({ name: m.name, temp: this.kind === "bed" ? m.bed : m.nozzle })).filter((m) => typeof m.temp === "number" && m.temp > 0 && m.temp <= this.maxTemp).slice(0, 6);
  }
  get meshSupported() {
    return !!this.$store.getters["mesh/getSupportsBedMesh"];
  }
  get onGraph() {
    const saved = (this.$store.getters["charts/getSelectedLegends"] ?? {})[this.seriesKey];
    return typeof saved === "boolean" ? saved : true;
  }
  toggleGraph() {
    const selected = this.$store.getters["charts/getSelectedLegends"] ?? {};
    this.$store.dispatch("charts/saveSelectedLegends", { ...selected, [this.seriesKey]: !this.onGraph });
  }
  toggle() {
    if (!this.locked) this.open = !this.open;
  }
  commitTarget(context, value) {
    if (context === this.panelTarget && !this.disconnected) this.setHeater(this.heater, value);
  }
  get menu() {
    const items = [
      { id: "graph", label: "Show on graph", toggle: true, on: this.onGraph, action: this.toggleGraph },
      { id: "pid", label: "PID tune and limits\u2026", to: this.pagePath("/maintenance") }
    ];
    if (this.kind === "hotend") items.push({ id: "load", label: "Load or unload\u2026", to: this.pagePath("/control") });
    else if (this.meshSupported) items.push({ id: "mesh", label: "Bed mesh\u2026", to: this.pagePath("/tune") });
    items.push({ id: "presets", label: "Presets\u2026", to: `${this.pagePath("/settings")}#presets` });
    return items;
  }
};
__decorateClass([
  Prop({ type: String, default: "hotend" })
], HeaterTile.prototype, "kind", 2);
__decorateClass([
  Watch("panelTarget")
], HeaterTile.prototype, "closeOnSwitch", 1);
HeaterTile = __decorateClass([
  Component({ components: { TileShell, NumberField, ToggleSwitch, HeaterSparkline } })
], HeaterTile);
const _sfc_main = HeaterTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { class: { ht: true, [`ht--${_vm.size}`]: true, "ht--disconnected": _vm.disconnected }, attrs: { "tile": _vm.kind, "title": _vm.disconnected ? `${_vm.name} disconnected` : _vm.name, "icon": _vm.kind === "bed" ? "thermometer" : "nozzle", "state": _vm.disconnected ? "" : _vm.status.label, "tone": _vm.status.tone, "menu": _vm.menu, "open": _vm.open, "locked": _vm.locked }, on: { "toggle": _vm.toggle }, scopedSlots: _vm._u([{ key: "popover", fn: function() {
    return [_c("div", { key: _vm.panelTarget, staticClass: "hp" }, [_c("div", { staticClass: "hp__top" }, [_c("span", { staticClass: "hp__now" }, [_vm._v(_vm._s(_vm.nowText)), _c("small", [_vm._v("now")])]), _vm._l([_vm.panelTarget], function(context) {
      return [_c("number-field", { key: context, attrs: { "value": _vm.heater ? Math.round(_vm.heater.target) : null, "unit": "\xB0", "label": `${_vm.name} target`, "min": 0, "max": _vm.maxTemp, "disabled": !_vm.controlReady }, on: { "change": function($event) {
        return _vm.commitTarget(context, $event);
      } } })];
    })], 2), _c("div", { staticClass: "hp__presets", attrs: { "role": "group", "aria-label": `${_vm.name} presets` } }, [_vm._l(_vm.presetChoices, function(m) {
      return _c("button", { key: m.name, staticClass: "hp__preset", class: { "hp__preset--on": _vm.heater && Math.round(_vm.heater.target) === m.temp }, attrs: { "type": "button", "disabled": !_vm.controlReady, "data-preset": m.name }, on: { "click": function($event) {
        return _vm.setHeater(_vm.heater, m.temp);
      } } }, [_vm._v(" " + _vm._s(m.name) + " " + _vm._s(m.temp) + " ")]);
    }), _c("button", { staticClass: "hp__preset", class: { "hp__preset--on": _vm.heater && !_vm.heater.target }, attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "heater-off" }, on: { "click": function($event) {
      return _vm.setHeater(_vm.heater, 0);
    } } }, [_vm._v(" Off ")])], 2), _c("div", { staticClass: "ot__rows" }, [_c("div", { staticClass: "ot__row" }, [_c(__unplugin_components_0, { attrs: { "name": "pulse", "small": "" } }), _vm._v("Show on graph "), _c("toggle-switch", { attrs: { "value": _vm.onGraph, "label": "Show on graph" }, on: { "input": _vm.toggleGraph } })], 1), _c("router-link", { staticClass: "ot__row", attrs: { "data-row": "pid", "to": _vm.pagePath("/maintenance") } }, [_c(__unplugin_components_1, { attrs: { "name": "settings", "small": "" } }), _vm._v("PID tune and limits\u2026"), _c("span", { staticClass: "hp__hint" }, [_vm._v("max " + _vm._s(_vm.maxTemp) + "\xB0")])], 1), _vm.kind === "hotend" ? _c("router-link", { staticClass: "ot__row", attrs: { "data-row": "load", "to": _vm.pagePath("/control") } }, [_c(__unplugin_components_2, { attrs: { "name": "spool", "small": "" } }), _vm._v("Load or unload filament\u2026 ")], 1) : _vm._e(), _vm.kind === "bed" && _vm.meshSupported ? _c("router-link", { staticClass: "ot__row", attrs: { "data-row": "mesh", "to": _vm.pagePath("/tune") } }, [_c(__unplugin_components_3, { attrs: { "name": "mesh", "small": "" } }), _vm._v("Bed mesh\u2026 ")], 1) : _vm._e(), _c("router-link", { staticClass: "ot__row", attrs: { "data-row": "presets", "to": `${_vm.pagePath("/settings")}#presets` } }, [_c(__unplugin_components_4, { attrs: { "name": "list", "small": "" } }), _vm._v("Edit temperature presets\u2026 ")], 1), _c("button", { staticClass: "ot__row", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "cool-down" }, on: { "click": _vm.coolDown } }, [_c(__unplugin_components_5, { attrs: { "name": "snow", "small": "" } }), _vm._v("Cool down ")], 1)], 1)])];
  }, proxy: true }]) }, [_c("span", { staticClass: "ot__value", attrs: { "data-tid": "heater-value" } }, [_vm._v(_vm._s(_vm.valueText)), _vm.targetText ? _c("small", [_vm._v("/ " + _vm._s(_vm.targetText))]) : _vm._e()]), _vm.heater && !_vm.disconnected ? _c("span", { staticClass: "ot__bar" }, [_c("i", { style: { width: `${Math.round(_vm.barFraction * 100)}%` } })]) : _vm._e(), _vm.size !== "S" && _vm.heater && !_vm.disconnected ? _c("heater-sparkline", { staticClass: "ht__spark", attrs: { "series": _vm.seriesKey, "fill": "" } }) : _vm._e(), _vm.size === "M" && _vm.heater && !_vm.disconnected ? _c("span", { staticClass: "hp__presets ht__inline", attrs: { "role": "group", "aria-label": `${_vm.name} presets`, "data-tid": "heater-inline-presets" } }, [_vm._l(_vm.presetChoices, function(m) {
    return _c("button", { key: m.name, staticClass: "hp__preset", class: { "hp__preset--on": Math.round(_vm.heater.target) === m.temp }, attrs: { "type": "button", "disabled": !_vm.controlReady }, on: { "click": function($event) {
      $event.stopPropagation();
      return _vm.setHeater(_vm.heater, m.temp);
    } } }, [_vm._v(" " + _vm._s(m.name) + " " + _vm._s(m.temp) + " ")]);
  }), _c("button", { staticClass: "hp__preset", attrs: { "type": "button", "disabled": !_vm.controlReady }, on: { "click": function($event) {
    $event.stopPropagation();
    return _vm.setHeater(_vm.heater, 0);
  } } }, [_vm._v(" Off ")])], 2) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/HeaterTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/HeaterTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQWdMQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQVVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUNBLGdDQUNBLDZFQUNBLGtGQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxhQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXpFQTtBQUFBO0FBQUEsR0FEQSxXQUNBO0FBS0E7QUFBQSxFQURBO0FBQUEsR0FMQSxXQU1BO0FBTkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiSGVhdGVyVGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dGlsZS1zaGVsbFxuICAgIDp0aWxlPVwia2luZFwiXG4gICAgOnRpdGxlPVwiZGlzY29ubmVjdGVkID8gYCR7bmFtZX0gZGlzY29ubmVjdGVkYCA6IG5hbWVcIlxuICAgIDppY29uPVwia2luZCA9PT0gJ2JlZCcgPyAndGhlcm1vbWV0ZXInIDogJ25venpsZSdcIlxuICAgIDpzdGF0ZT1cImRpc2Nvbm5lY3RlZCA/ICcnIDogc3RhdHVzLmxhYmVsXCJcbiAgICA6dG9uZT1cInN0YXR1cy50b25lXCJcbiAgICA6bWVudT1cIm1lbnVcIlxuICAgIDpvcGVuPVwib3BlblwiXG4gICAgOmxvY2tlZD1cImxvY2tlZFwiXG4gICAgOmNsYXNzPVwieyBodDogdHJ1ZSwgW2BodC0tJHtzaXplfWBdOiB0cnVlLCAnaHQtLWRpc2Nvbm5lY3RlZCc6IGRpc2Nvbm5lY3RlZCB9XCJcbiAgICBAdG9nZ2xlPVwidG9nZ2xlXCJcbiAgPlxuICAgIDxzcGFuXG4gICAgICBjbGFzcz1cIm90X192YWx1ZVwiXG4gICAgICBkYXRhLXRpZD1cImhlYXRlci12YWx1ZVwiXG4gICAgPnt7IHZhbHVlVGV4dCB9fTxzbWFsbCB2LWlmPVwidGFyZ2V0VGV4dFwiPi8ge3sgdGFyZ2V0VGV4dCB9fTwvc21hbGw+PC9zcGFuPlxuICAgIDxzcGFuXG4gICAgICB2LWlmPVwiaGVhdGVyICYmICFkaXNjb25uZWN0ZWRcIlxuICAgICAgY2xhc3M9XCJvdF9fYmFyXCJcbiAgICA+PGkgOnN0eWxlPVwieyB3aWR0aDogYCR7TWF0aC5yb3VuZChiYXJGcmFjdGlvbiAqIDEwMCl9JWAgfVwiIC8+PC9zcGFuPlxuICAgIDxoZWF0ZXItc3BhcmtsaW5lXG4gICAgICB2LWlmPVwic2l6ZSAhPT0gJ1MnICYmIGhlYXRlciAmJiAhZGlzY29ubmVjdGVkXCJcbiAgICAgIGNsYXNzPVwiaHRfX3NwYXJrXCJcbiAgICAgIDpzZXJpZXM9XCJzZXJpZXNLZXlcIlxuICAgICAgZmlsbFxuICAgIC8+XG4gICAgPHNwYW5cbiAgICAgIHYtaWY9XCJzaXplID09PSAnTScgJiYgaGVhdGVyICYmICFkaXNjb25uZWN0ZWRcIlxuICAgICAgY2xhc3M9XCJocF9fcHJlc2V0cyBodF9faW5saW5lXCJcbiAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICA6YXJpYS1sYWJlbD1cImAke25hbWV9IHByZXNldHNgXCJcbiAgICAgIGRhdGEtdGlkPVwiaGVhdGVyLWlubGluZS1wcmVzZXRzXCJcbiAgICA+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtZm9yPVwibSBpbiBwcmVzZXRDaG9pY2VzXCJcbiAgICAgICAgOmtleT1cIm0ubmFtZVwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImhwX19wcmVzZXRcIlxuICAgICAgICA6Y2xhc3M9XCJ7ICdocF9fcHJlc2V0LS1vbic6IE1hdGgucm91bmQoaGVhdGVyLnRhcmdldCkgPT09IG0udGVtcCB9XCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgIEBjbGljay5zdG9wPVwic2V0SGVhdGVyKGhlYXRlciwgbS50ZW1wKVwiXG4gICAgICA+XG4gICAgICAgIHt7IG0ubmFtZSB9fSB7eyBtLnRlbXAgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJocF9fcHJlc2V0XCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgIEBjbGljay5zdG9wPVwic2V0SGVhdGVyKGhlYXRlciwgMClcIlxuICAgICAgPlxuICAgICAgICBPZmZcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvc3Bhbj5cblxuICAgIDx0ZW1wbGF0ZSAjcG9wb3Zlcj5cbiAgICAgIDxkaXZcbiAgICAgICAgOmtleT1cInBhbmVsVGFyZ2V0XCJcbiAgICAgICAgY2xhc3M9XCJocFwiXG4gICAgICA+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJocF9fdG9wXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJocF9fbm93XCI+e3sgbm93VGV4dCB9fTxzbWFsbD5ub3c8L3NtYWxsPjwvc3Bhbj5cbiAgICAgICAgICA8dGVtcGxhdGUgdi1mb3I9XCJjb250ZXh0IGluIFtwYW5lbFRhcmdldF1cIj5cbiAgICAgICAgICAgIDxudW1iZXItZmllbGRcbiAgICAgICAgICAgICAgOmtleT1cImNvbnRleHRcIlxuICAgICAgICAgICAgICA6dmFsdWU9XCJoZWF0ZXIgPyBNYXRoLnJvdW5kKGhlYXRlci50YXJnZXQpIDogbnVsbFwiXG4gICAgICAgICAgICAgIHVuaXQ9XCLCsFwiXG4gICAgICAgICAgICAgIDpsYWJlbD1cImAke25hbWV9IHRhcmdldGBcIlxuICAgICAgICAgICAgICA6bWluPVwiMFwiXG4gICAgICAgICAgICAgIDptYXg9XCJtYXhUZW1wXCJcbiAgICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgICAgIEBjaGFuZ2U9XCJjb21taXRUYXJnZXQoY29udGV4dCwgJGV2ZW50KVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJocF9fcHJlc2V0c1wiXG4gICAgICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cImAke25hbWV9IHByZXNldHNgXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtZm9yPVwibSBpbiBwcmVzZXRDaG9pY2VzXCJcbiAgICAgICAgICAgIDprZXk9XCJtLm5hbWVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImhwX19wcmVzZXRcIlxuICAgICAgICAgICAgOmNsYXNzPVwieyAnaHBfX3ByZXNldC0tb24nOiBoZWF0ZXIgJiYgTWF0aC5yb3VuZChoZWF0ZXIudGFyZ2V0KSA9PT0gbS50ZW1wIH1cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgICA6ZGF0YS1wcmVzZXQ9XCJtLm5hbWVcIlxuICAgICAgICAgICAgQGNsaWNrPVwic2V0SGVhdGVyKGhlYXRlciwgbS50ZW1wKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge3sgbS5uYW1lIH19IHt7IG0udGVtcCB9fVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJocF9fcHJlc2V0XCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ2hwX19wcmVzZXQtLW9uJzogaGVhdGVyICYmICFoZWF0ZXIudGFyZ2V0IH1cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImhlYXRlci1vZmZcIlxuICAgICAgICAgICAgQGNsaWNrPVwic2V0SGVhdGVyKGhlYXRlciwgMClcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIE9mZlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm90X19yb3dzXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm90X19yb3dcIj5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJwdWxzZVwiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPlNob3cgb24gZ3JhcGhcbiAgICAgICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgICAgIDp2YWx1ZT1cIm9uR3JhcGhcIlxuICAgICAgICAgICAgICBsYWJlbD1cIlNob3cgb24gZ3JhcGhcIlxuICAgICAgICAgICAgICBAaW5wdXQ9XCJ0b2dnbGVHcmFwaFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgICAgY2xhc3M9XCJvdF9fcm93XCJcbiAgICAgICAgICAgIGRhdGEtcm93PVwicGlkXCJcbiAgICAgICAgICAgIDp0bz1cInBhZ2VQYXRoKCcvbWFpbnRlbmFuY2UnKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cInNldHRpbmdzXCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+UElEIHR1bmUgYW5kIGxpbWl0c+KApjxzcGFuIGNsYXNzPVwiaHBfX2hpbnRcIj5tYXgge3sgbWF4VGVtcCB9fcKwPC9zcGFuPlxuICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICB2LWlmPVwia2luZCA9PT0gJ2hvdGVuZCdcIlxuICAgICAgICAgICAgY2xhc3M9XCJvdF9fcm93XCJcbiAgICAgICAgICAgIGRhdGEtcm93PVwibG9hZFwiXG4gICAgICAgICAgICA6dG89XCJwYWdlUGF0aCgnL2NvbnRyb2wnKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cInNwb29sXCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+TG9hZCBvciB1bmxvYWQgZmlsYW1lbnTigKZcbiAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgICAgdi1pZj1cImtpbmQgPT09ICdiZWQnICYmIG1lc2hTdXBwb3J0ZWRcIlxuICAgICAgICAgICAgY2xhc3M9XCJvdF9fcm93XCJcbiAgICAgICAgICAgIGRhdGEtcm93PVwibWVzaFwiXG4gICAgICAgICAgICA6dG89XCJwYWdlUGF0aCgnL3R1bmUnKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cIm1lc2hcIlxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgLz5CZWQgbWVzaOKAplxuICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICBjbGFzcz1cIm90X19yb3dcIlxuICAgICAgICAgICAgZGF0YS1yb3c9XCJwcmVzZXRzXCJcbiAgICAgICAgICAgIDp0bz1cImAke3BhZ2VQYXRoKCcvc2V0dGluZ3MnKX0jcHJlc2V0c2BcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJsaXN0XCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+RWRpdCB0ZW1wZXJhdHVyZSBwcmVzZXRz4oCmXG4gICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwib3RfX3Jvd1wiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiY29vbC1kb3duXCJcbiAgICAgICAgICAgIEBjbGljaz1cImNvb2xEb3duXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICBuYW1lPVwic25vd1wiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAvPkNvb2wgZG93blxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvdGlsZS1zaGVsbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5pbXBvcnQgeyBoZWF0ZXJUaWxlLCB0eXBlIEhlYXRlclRpbGUgYXMgSGVhdGVyUmVhZGluZyB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvbW9kZWwnXG5pbXBvcnQgdHlwZSB7IFRpbGVNZW51SXRlbSB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvdGlsZXMnXG5pbXBvcnQgdHlwZSB7IEhlYXRlciB9IGZyb20gJ0Avc3RvcmUvcHJpbnRlci90eXBlcydcbmltcG9ydCBUaWxlU2hlbGwgZnJvbSAnLi9UaWxlU2hlbGwudnVlJ1xuaW1wb3J0IE51bWJlckZpZWxkIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL051bWJlckZpZWxkLnZ1ZSdcbmltcG9ydCBUb2dnbGVTd2l0Y2ggZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvVG9nZ2xlU3dpdGNoLnZ1ZSdcbmltcG9ydCBIZWF0ZXJTcGFya2xpbmUgZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvSGVhdGVyU3BhcmtsaW5lLnZ1ZSdcblxudHlwZSBLaW5kID0gJ2hvdGVuZCcgfCAnYmVkJ1xuXG4vKipcbiAqIFRoZSBob3RlbmQgb3IgdGhlIGJlZDogaXRzIHRlbXBlcmF0dXJlIGFuZCB0YXJnZXQgYXMgb25lIGxpdmUgbnVtYmVyIGFuZFxuICogYSBiYXIsIGFuZCBob3cgY2xvc2UgaXQgaXMgaW4gd29yZHMuIFRhcHBpbmcgaXQgb3BlbnMgdGhlIGZ1bGwgY29udHJvbHM6XG4gKiBhbiBleGFjdCB0YXJnZXQsIHRoZSBtYXRlcmlhbHMsIHNob3cgb24gZ3JhcGgsIFBJRCwgYW5kIGNvb2wgZG93bi5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVGlsZVNoZWxsLCBOdW1iZXJGaWVsZCwgVG9nZ2xlU3dpdGNoLCBIZWF0ZXJTcGFya2xpbmUgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGVhdGVyVGlsZSBleHRlbmRzIE1peGlucyhPdmVydmlld01peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnaG90ZW5kJyB9KSByZWFkb25seSBraW5kITogS2luZFxuXG4gIG9wZW4gPSBmYWxzZVxuXG4gIEBXYXRjaCgncGFuZWxUYXJnZXQnKVxuICBjbG9zZU9uU3dpdGNoICgpIHsgdGhpcy5vcGVuID0gZmFsc2UgfVxuXG4gIGdldCBuYW1lICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5raW5kID09PSAnYmVkJyA/ICdCZWQnIDogJ0hvdGVuZCcgfVxuICBnZXQgaGVhdGVyICgpOiBIZWF0ZXIgfCBudWxsIHsgcmV0dXJuIHRoaXMua2luZCA9PT0gJ2JlZCcgPyB0aGlzLmJlZCA6IHRoaXMubm96emxlIH1cbiAgZ2V0IHNlcmllc0tleSAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMua2luZCA9PT0gJ2JlZCcgPyAnaGVhdGVyX2JlZCcgOiAnZXh0cnVkZXInIH1cblxuICAvKiogVGhlIHByaW50ZXIgc2F5cyB0aGUgcGFydCBpcyBub3QgdGhlcmUgYXQgYWxsLiAqL1xuICBnZXQgZGlzY29ubmVjdGVkICgpOiBib29sZWFuIHtcbiAgICBjb25zdCBwcmludGVyID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgcmV0dXJuIHRoaXMua2luZCA9PT0gJ2JlZCcgPyAhIXByaW50ZXI/LmJlZF9yZW1vdmFsX2RldGVjdG9yPy5iZWRSZW1vdmVkIDogISFwcmludGVyPy5bJ21jdSB0b29saGVhZCddPy5ub25fY3JpdGljYWxfZGlzY29ubmVjdGVkXG4gIH1cblxuICBnZXQgbG9ja2VkICgpOiBib29sZWFuIHsgcmV0dXJuICF0aGlzLmhlYXRlciB8fCB0aGlzLmRpc2Nvbm5lY3RlZCB9XG4gIGdldCBtYXhUZW1wICgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5oZWF0ZXI/Lm1heFRlbXAgfHwgMzAwIH1cbiAgZ2V0IHJlYWRpbmcgKCk6IEhlYXRlclJlYWRpbmcgfCBudWxsIHsgcmV0dXJuIHRoaXMuaGVhdGVyID8gaGVhdGVyVGlsZSh0aGlzLmhlYXRlci50ZW1wZXJhdHVyZSwgdGhpcy5oZWF0ZXIudGFyZ2V0KSA6IG51bGwgfVxuXG4gIGdldCBzdGF0dXMgKCk6IHsgbGFiZWw6IHN0cmluZywgdG9uZTogc3RyaW5nIH0ge1xuICAgIGNvbnN0IHIgPSB0aGlzLnJlYWRpbmdcbiAgICBpZiAoIXIpIHJldHVybiB7IGxhYmVsOiAnJywgdG9uZTogJ29mZicgfVxuICAgIGlmIChyLnN0YXR1cyA9PT0gJ2F0IHRlbXBlcmF0dXJlJykgcmV0dXJuIHsgbGFiZWw6ICdBdCB0ZW1wZXJhdHVyZScsIHRvbmU6ICdvaycgfVxuICAgIGlmIChyLnN0YXR1cyA9PT0gJ29mZicpIHJldHVybiB7IGxhYmVsOiAnT2ZmJywgdG9uZTogJ29mZicgfVxuICAgIHJldHVybiB7IGxhYmVsOiByLnN0YXR1cyA9PT0gJ2hlYXRpbmcnID8gJ0hlYXRpbmcnIDogJ0Nvb2xpbmcnLCB0b25lOiAnd2FybScgfVxuICB9XG5cbiAgZ2V0IHZhbHVlVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5oZWF0ZXIgJiYgIXRoaXMuZGlzY29ubmVjdGVkID8gYCR7dGhpcy5oZWF0ZXIudGVtcGVyYXR1cmUudG9GaXhlZCgxKX3CsGAgOiAn4oCUJ1xuICB9XG5cbiAgZ2V0IG5vd1RleHQgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmhlYXRlciA/IGAke3RoaXMuaGVhdGVyLnRlbXBlcmF0dXJlLnRvRml4ZWQoMSl9wrBgIDogJ+KAlCcgfVxuICBnZXQgdGFyZ2V0VGV4dCAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuaGVhdGVyICYmICF0aGlzLmRpc2Nvbm5lY3RlZCAmJiB0aGlzLmhlYXRlci50YXJnZXQgPyBgJHtNYXRoLnJvdW5kKHRoaXMuaGVhdGVyLnRhcmdldCl9wrBgIDogJycgfVxuICBnZXQgYmFyRnJhY3Rpb24gKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnJlYWRpbmc/LnByb2dyZXNzID8/IDAgfVxuXG4gIC8qKiBUaGUgbWF0ZXJpYWxzIHRoYXQgc2F5IGEgdGVtcGVyYXR1cmUgZm9yIHRoaXMgaGVhdGVyLiAqL1xuICBnZXQgcHJlc2V0Q2hvaWNlcyAoKTogQXJyYXk8eyBuYW1lOiBzdHJpbmcsIHRlbXA6IG51bWJlciB9PiB7XG4gICAgcmV0dXJuIHRoaXMubWF0ZXJpYWxDaG9pY2VzXG4gICAgICAubWFwKG0gPT4gKHsgbmFtZTogbS5uYW1lLCB0ZW1wOiB0aGlzLmtpbmQgPT09ICdiZWQnID8gbS5iZWQgOiBtLm5venpsZSB9KSlcbiAgICAgIC5maWx0ZXIoKG0pOiBtIGlzIHsgbmFtZTogc3RyaW5nLCB0ZW1wOiBudW1iZXIgfSA9PiB0eXBlb2YgbS50ZW1wID09PSAnbnVtYmVyJyAmJiBtLnRlbXAgPiAwICYmIG0udGVtcCA8PSB0aGlzLm1heFRlbXApXG4gICAgICAuc2xpY2UoMCwgNilcbiAgfVxuXG4gIGdldCBtZXNoU3VwcG9ydGVkICgpOiBib29sZWFuIHsgcmV0dXJuICEhdGhpcy4kc3RvcmUuZ2V0dGVyc1snbWVzaC9nZXRTdXBwb3J0c0JlZE1lc2gnXSB9XG5cbiAgZ2V0IG9uR3JhcGggKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHNhdmVkID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NoYXJ0cy9nZXRTZWxlY3RlZExlZ2VuZHMnXSA/PyB7fSlbdGhpcy5zZXJpZXNLZXldXG4gICAgcmV0dXJuIHR5cGVvZiBzYXZlZCA9PT0gJ2Jvb2xlYW4nID8gc2F2ZWQgOiB0cnVlXG4gIH1cblxuICB0b2dnbGVHcmFwaCAoKSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1snY2hhcnRzL2dldFNlbGVjdGVkTGVnZW5kcyddID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPlxuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjaGFydHMvc2F2ZVNlbGVjdGVkTGVnZW5kcycsIHsgLi4uc2VsZWN0ZWQsIFt0aGlzLnNlcmllc0tleV06ICF0aGlzLm9uR3JhcGggfSlcbiAgfVxuXG4gIHRvZ2dsZSAoKSB7IGlmICghdGhpcy5sb2NrZWQpIHRoaXMub3BlbiA9ICF0aGlzLm9wZW4gfVxuXG4gIGNvbW1pdFRhcmdldCAoY29udGV4dDogc3RyaW5nLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKGNvbnRleHQgPT09IHRoaXMucGFuZWxUYXJnZXQgJiYgIXRoaXMuZGlzY29ubmVjdGVkKSB0aGlzLnNldEhlYXRlcih0aGlzLmhlYXRlciwgdmFsdWUpXG4gIH1cblxuICBnZXQgbWVudSAoKTogVGlsZU1lbnVJdGVtW10ge1xuICAgIGNvbnN0IGl0ZW1zOiBUaWxlTWVudUl0ZW1bXSA9IFtcbiAgICAgIHsgaWQ6ICdncmFwaCcsIGxhYmVsOiAnU2hvdyBvbiBncmFwaCcsIHRvZ2dsZTogdHJ1ZSwgb246IHRoaXMub25HcmFwaCwgYWN0aW9uOiB0aGlzLnRvZ2dsZUdyYXBoIH0sXG4gICAgICB7IGlkOiAncGlkJywgbGFiZWw6ICdQSUQgdHVuZSBhbmQgbGltaXRz4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy9tYWludGVuYW5jZScpIH1cbiAgICBdXG4gICAgaWYgKHRoaXMua2luZCA9PT0gJ2hvdGVuZCcpIGl0ZW1zLnB1c2goeyBpZDogJ2xvYWQnLCBsYWJlbDogJ0xvYWQgb3IgdW5sb2Fk4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy9jb250cm9sJykgfSlcbiAgICBlbHNlIGlmICh0aGlzLm1lc2hTdXBwb3J0ZWQpIGl0ZW1zLnB1c2goeyBpZDogJ21lc2gnLCBsYWJlbDogJ0JlZCBtZXNo4oCmJywgdG86IHRoaXMucGFnZVBhdGgoJy90dW5lJykgfSlcbiAgICBpdGVtcy5wdXNoKHsgaWQ6ICdwcmVzZXRzJywgbGFiZWw6ICdQcmVzZXRz4oCmJywgdG86IGAke3RoaXMucGFnZVBhdGgoJy9zZXR0aW5ncycpfSNwcmVzZXRzYCB9KVxuICAgIHJldHVybiBpdGVtc1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4uaHQgLm90X19zdGF0ZSB7IG1hcmdpbi1yaWdodDogMDsgfVxuLmh0LS1TIC5vdF9fc3RhdGUgeyBkaXNwbGF5OiBub25lOyB9XG4uaHQgLm90X192YWx1ZSB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IGZvbnQtd2VpZ2h0OiA3MDA7IH1cbi5odF9fc3BhcmsgeyBkaXNwbGF5OiBibG9jazsgbWFyZ2luLXRvcDogNnB4OyB9XG5AbWVkaWEgKG1heC13aWR0aDogNTk5cHgpIHsgLmh0IC5vdF9fc3RhdGUgeyBkaXNwbGF5OiBub25lOyB9IH1cbi5odC0tZGlzY29ubmVjdGVkIHsgb3V0bGluZTogMXB4IHNvbGlkIHZhcigtLW0zZC1kYW5nZXIpOyBvdXRsaW5lLW9mZnNldDogLTFweDsgfVxuLmhwX190b3AgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IGdhcDogMTJweDsgfVxuLmhwX19ub3cgeyBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtcm91bmRlZCk7IGZvbnQtc2l6ZTogMzBweDsgZm9udC13ZWlnaHQ6IDYwMDsgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtczsgfVxuLmhwX19ub3cgc21hbGwgeyBtYXJnaW4tbGVmdDogNnB4OyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiA1MDA7IH1cbi5odF9faW5saW5lIHsgbWFyZ2luLXRvcDogOHB4OyB9XG4uaHBfX3ByZXNldHMgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LXdyYXA6IHdyYXA7IGdhcDogNnB4OyBwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDE2cHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpOyB9XG4uaHBfX3ByZXNldCB7IGZsZXg6IDEgMSBhdXRvOyBtaW4taGVpZ2h0OiAzMnB4OyBwYWRkaW5nOiAwIDEwcHg7IGJvcmRlci1yYWRpdXM6IDEycHg7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTNweDsgZm9udC13ZWlnaHQ6IDYwMDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgY3Vyc29yOiBwb2ludGVyOyB9XG4uaHBfX3ByZXNldDpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNDU7IGN1cnNvcjogZGVmYXVsdDsgfVxuLmhwX19wcmVzZXQtLW9uIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7IGNvbG9yOiB2YXIoLS1tM2Qtb24tYWNjZW50LCAjMDAyMDFlKTsgfVxuLmhwX19oaW50IHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTsgZm9udC1zaXplOiAxMnB4OyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9IZWF0ZXJUaWxlLnZ1ZSJ9