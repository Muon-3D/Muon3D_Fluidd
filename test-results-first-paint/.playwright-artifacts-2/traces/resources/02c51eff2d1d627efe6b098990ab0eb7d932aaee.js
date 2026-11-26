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
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import {
  filamentSensorRole,
  ledCommand,
  ledPercent,
  pinCommand,
  pinPercent,
  sensorCommand
} from "/src/services/control/model.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import RangeSlider from "/src/components/control/RangeSlider.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
let ControlOutputs = class extends Mixins(ControlMixin) {
  outputsOnly;
  diagnosticsOnly;
  percentValueText(value) {
    return `${value} percent`;
  }
  get outputs() {
    const pins = (this.$store.getters["printer/getPins"] ?? []).filter((p) => p.controllable && p.name !== this.lightsPin?.name).map((pin) => ({ key: pin.key, label: pin.prettyName, percent: pinPercent(pin.value), dimmable: pin.pwm, pin }));
    const leds = (this.$store.getters["printer/getAllLeds"] ?? []).filter((l) => l.name !== this.lightsLed?.name).map((led) => ({ key: led.key, label: led.prettyName, percent: ledPercent(led.color_data), dimmable: true, led }));
    return [...pins, ...leds];
  }
  setOutput(out, percent) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 0 || percent > 100) return;
    if (out.pin) this.sendGcode(pinCommand(out.pin, out.pin.pwm ? percent : percent > 0));
    else if (out.led) this.sendGcode(ledCommand(out.led.name, percent));
  }
  get configfile() {
    return this.$store.state.printer.printer.configfile;
  }
  /** Each sensor with what it is for: one that loads filament has no off. */
  get sensors() {
    return (this.$store.getters["printer/getRunoutSensors"] ?? []).map((sensor) => ({ ...sensor, role: filamentSensorRole(this.configfile, sensor.name) }));
  }
  /** Reads the printer's settings as they are now, so an off is refused however this is called. */
  setSensor(name, enabled) {
    if (!this.controlReady) return;
    const gcode = sensorCommand(name, enabled, this.configfile);
    if (gcode) this.sendGcode(gcode);
  }
  requested = false;
  requestGeneration = 0;
  requestedTarget = "";
  endstopResult = [];
  get endstops() {
    return this.endstopResult.map((e) => ({ name: e.name === "Probe" ? e.name : e.name.toUpperCase(), state: String(e.state).toLowerCase() }));
  }
  async checkEndstops() {
    if (!this.controlReady) return;
    const generation = ++this.requestGeneration;
    const target = this.panelTarget;
    this.$store.commit("printer/setClearEndStops");
    this.requested = true;
    this.requestedTarget = target;
    this.endstopResult = [];
    const response = await SocketActions.printerQueryEndstops();
    if (generation !== this.requestGeneration || target !== this.panelTarget || target !== this.requestedTarget || !response) return;
    this.endstopResult = Object.keys(response).sort().map((name) => ({ name, state: response[name] }));
  }
  clearEndstopRequest() {
    this.requestGeneration++;
    this.requested = false;
    this.requestedTarget = "";
    this.endstopResult = [];
    this.$store.commit("printer/setClearEndStops");
  }
  /** A reading goes stale: leaving the page clears it, as Fluidd's own panel does. */
  destroyed() {
    this.$store.commit("printer/setClearEndStops");
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlOutputs.prototype, "outputsOnly", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlOutputs.prototype, "diagnosticsOnly", 2);
__decorateClass([
  Watch("panelTarget")
], ControlOutputs.prototype, "clearEndstopRequest", 1);
ControlOutputs = __decorateClass([
  Component({ components: { ControlCard, RangeSlider, ToggleSwitch } })
], ControlOutputs);
const _sfc_main = ControlOutputs;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": _vm.diagnosticsOnly ? "Switches and sensors" : _vm.outputsOnly ? "Outputs" : "Outputs and sensors", "locked": _vm.controlLock, "data-tid": "control-outputs" } }, [_vm.outputsOnly && !_vm.outputs.length ? _c("p", { staticClass: "outs__note" }, [_vm._v(" This printer has no other outputs. ")]) : _vm._e(), !_vm.diagnosticsOnly && _vm.outputs.length ? _c("div", { staticClass: "outs__group" }, [_c("h3", { staticClass: "outs__label" }, [_vm._v(" Outputs ")]), _vm._l(_vm.outputs, function(out) {
    return _c("div", { key: out.key, staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(out.label))]), out.dimmable ? _c("span", { staticClass: "outs__slider" }, [_c("range-slider", { attrs: { "value": out.percent, "min": 0, "max": 100, "label": out.label, "value-text-formatter": _vm.percentValueText, "disabled": !_vm.controlReady }, on: { "change": function($event) {
      return _vm.setOutput(out, $event);
    } } }), _c("span", { staticClass: "crow__value" }, [_vm._v(_vm._s(out.percent) + "%")])], 1) : _c("toggle-switch", { attrs: { "value": out.percent > 0, "label": out.label, "disabled": !_vm.controlReady }, on: { "input": function($event) {
      return _vm.setOutput(out, $event ? 100 : 0);
    } } })], 1);
  })], 2) : _vm._e(), !_vm.outputsOnly && _vm.sensors.length ? _c("div", { staticClass: "outs__group", attrs: { "data-tid": "control-sensors" } }, [_c("h3", { staticClass: "outs__label" }, [_vm._v(" Filament sensors ")]), _vm._l(_vm.sensors, function(sensor) {
    return _c("div", { key: sensor.name, staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(" " + _vm._s(sensor.prettyName) + " "), _c("span", { staticClass: "crow__sub" }, [_vm._v("\xB7 " + _vm._s(typeof sensor.enabled !== "boolean" || typeof sensor.filament_detected !== "boolean" ? "Unknown" : !sensor.enabled ? "off" : sensor.filament_detected ? "filament in" : "no filament"))]), sensor.role === "loads" ? _c("span", { staticClass: "outs__why" }, [_vm._v("Loads filament automatically; always on")]) : _vm._e()]), sensor.role === "loads" && sensor.enabled ? _c("span", { staticClass: "outs__state" }, [_vm._v("On")]) : _c("toggle-switch", { attrs: { "value": sensor.enabled, "label": `${sensor.prettyName} on`, "disabled": !_vm.controlReady || typeof sensor.enabled !== "boolean" || sensor.enabled && sensor.role !== "runout" }, on: { "input": function($event) {
      return _vm.setSensor(sensor.name, $event);
    } } })], 1);
  })], 2) : _vm._e(), !_vm.outputsOnly ? _c("div", { staticClass: "outs__group", attrs: { "data-tid": "control-endstops" } }, [_c("h3", { staticClass: "outs__label outs__label--row" }, [_vm._v(" Endstops "), _c("button", { staticClass: "outs__link", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "control-endstops-check" }, on: { "click": _vm.checkEndstops } }, [_vm._v(" " + _vm._s(_vm.endstops.length ? "Check again" : "Check them") + " ")])]), _vm._l(_vm.endstops, function(endstop) {
    return _c("div", { key: endstop.name, staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(endstop.name))]), _c("span", { staticClass: "outs__state", class: { "outs__state--hit": endstop.state === "triggered" } }, [_vm._v(_vm._s(endstop.state === "triggered" ? "Triggered" : endstop.state === "open" ? "Open" : "Unknown"))])]);
  }), !_vm.endstops.length ? _c("p", { staticClass: "outs__note" }, [_vm._v(" Reads each switch once, as it is now. Press one by hand and check again to see it change. ")]) : _vm._e()], 2) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlOutputs.vue?vue&type=style&index=0&scoped=79b4bc41&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "79b4bc41",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlOutputs.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTRIQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BR0E7QUFDQTtBQUNBO0FBQ0E7QUFvQkE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0EsZ0VBQ0EsaUVBQ0E7QUFDQSxtRUFDQSwrQ0FDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsYUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0EsbUVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBM0VBO0FBQUE7QUFBQSxHQURBLGVBQ0E7QUFDQTtBQUFBO0FBQUEsR0FGQSxlQUVBO0FBOERBO0FBQUEsRUFEQTtBQUFBLEdBL0RBLGVBZ0VBO0FBaEVBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2xPdXRwdXRzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxjb250cm9sLWNhcmRcbiAgICA6dGl0bGU9XCJkaWFnbm9zdGljc09ubHkgPyAnU3dpdGNoZXMgYW5kIHNlbnNvcnMnIDogb3V0cHV0c09ubHkgPyAnT3V0cHV0cycgOiAnT3V0cHV0cyBhbmQgc2Vuc29ycydcIlxuICAgIDpsb2NrZWQ9XCJjb250cm9sTG9ja1wiXG4gICAgZGF0YS10aWQ9XCJjb250cm9sLW91dHB1dHNcIlxuICA+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJvdXRwdXRzT25seSAmJiAhb3V0cHV0cy5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJvdXRzX19ub3RlXCJcbiAgICA+XG4gICAgICBUaGlzIHByaW50ZXIgaGFzIG5vIG90aGVyIG91dHB1dHMuXG4gICAgPC9wPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCIhZGlhZ25vc3RpY3NPbmx5ICYmIG91dHB1dHMubGVuZ3RoXCJcbiAgICAgIGNsYXNzPVwib3V0c19fZ3JvdXBcIlxuICAgID5cbiAgICAgIDxoMyBjbGFzcz1cIm91dHNfX2xhYmVsXCI+XG4gICAgICAgIE91dHB1dHNcbiAgICAgIDwvaDM+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZm9yPVwib3V0IGluIG91dHB1dHNcIlxuICAgICAgICA6a2V5PVwib3V0LmtleVwiXG4gICAgICAgIGNsYXNzPVwiY3Jvd1wiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY3Jvd19fbmFtZVwiPnt7IG91dC5sYWJlbCB9fTwvc3Bhbj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWlmPVwib3V0LmRpbW1hYmxlXCJcbiAgICAgICAgICBjbGFzcz1cIm91dHNfX3NsaWRlclwiXG4gICAgICAgID5cbiAgICAgICAgICA8cmFuZ2Utc2xpZGVyXG4gICAgICAgICAgICA6dmFsdWU9XCJvdXQucGVyY2VudFwiXG4gICAgICAgICAgICA6bWluPVwiMFwiXG4gICAgICAgICAgICA6bWF4PVwiMTAwXCJcbiAgICAgICAgICAgIDpsYWJlbD1cIm91dC5sYWJlbFwiXG4gICAgICAgICAgICA6dmFsdWUtdGV4dC1mb3JtYXR0ZXI9XCJwZXJjZW50VmFsdWVUZXh0XCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgICAgQGNoYW5nZT1cInNldE91dHB1dChvdXQsICRldmVudClcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJjcm93X192YWx1ZVwiPnt7IG91dC5wZXJjZW50IH19JTwvc3Bhbj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgIDp2YWx1ZT1cIm91dC5wZXJjZW50ID4gMFwiXG4gICAgICAgICAgOmxhYmVsPVwib3V0LmxhYmVsXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICBAaW5wdXQ9XCJzZXRPdXRwdXQob3V0LCAkZXZlbnQgPyAxMDAgOiAwKVwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCIhb3V0cHV0c09ubHkgJiYgc2Vuc29ycy5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJvdXRzX19ncm91cFwiXG4gICAgICBkYXRhLXRpZD1cImNvbnRyb2wtc2Vuc29yc1wiXG4gICAgPlxuICAgICAgPGgzIGNsYXNzPVwib3V0c19fbGFiZWxcIj5cbiAgICAgICAgRmlsYW1lbnQgc2Vuc29yc1xuICAgICAgPC9oMz5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJzZW5zb3IgaW4gc2Vuc29yc1wiXG4gICAgICAgIDprZXk9XCJzZW5zb3IubmFtZVwiXG4gICAgICAgIGNsYXNzPVwiY3Jvd1wiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY3Jvd19fbmFtZVwiPlxuICAgICAgICAgIHt7IHNlbnNvci5wcmV0dHlOYW1lIH19XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJjcm93X19zdWJcIj7CtyB7eyB0eXBlb2Ygc2Vuc29yLmVuYWJsZWQgIT09ICdib29sZWFuJyB8fCB0eXBlb2Ygc2Vuc29yLmZpbGFtZW50X2RldGVjdGVkICE9PSAnYm9vbGVhbicgPyAnVW5rbm93bicgOiAhc2Vuc29yLmVuYWJsZWQgPyAnb2ZmJyA6IHNlbnNvci5maWxhbWVudF9kZXRlY3RlZCA/ICdmaWxhbWVudCBpbicgOiAnbm8gZmlsYW1lbnQnIH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICB2LWlmPVwic2Vuc29yLnJvbGUgPT09ICdsb2FkcydcIlxuICAgICAgICAgICAgY2xhc3M9XCJvdXRzX193aHlcIlxuICAgICAgICAgID5Mb2FkcyBmaWxhbWVudCBhdXRvbWF0aWNhbGx5OyBhbHdheXMgb248L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWlmPVwic2Vuc29yLnJvbGUgPT09ICdsb2FkcycgJiYgc2Vuc29yLmVuYWJsZWRcIlxuICAgICAgICAgIGNsYXNzPVwib3V0c19fc3RhdGVcIlxuICAgICAgICA+T248L3NwYW4+XG4gICAgICAgIDx0b2dnbGUtc3dpdGNoXG4gICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgOnZhbHVlPVwic2Vuc29yLmVuYWJsZWRcIlxuICAgICAgICAgIDpsYWJlbD1cImAke3NlbnNvci5wcmV0dHlOYW1lfSBvbmBcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHkgfHwgdHlwZW9mIHNlbnNvci5lbmFibGVkICE9PSAnYm9vbGVhbicgfHwgKHNlbnNvci5lbmFibGVkICYmIHNlbnNvci5yb2xlICE9PSAncnVub3V0JylcIlxuICAgICAgICAgIEBpbnB1dD1cInNldFNlbnNvcihzZW5zb3IubmFtZSwgJGV2ZW50KVwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCIhb3V0cHV0c09ubHlcIlxuICAgICAgY2xhc3M9XCJvdXRzX19ncm91cFwiXG4gICAgICBkYXRhLXRpZD1cImNvbnRyb2wtZW5kc3RvcHNcIlxuICAgID5cbiAgICAgIDxoMyBjbGFzcz1cIm91dHNfX2xhYmVsIG91dHNfX2xhYmVsLS1yb3dcIj5cbiAgICAgICAgRW5kc3RvcHNcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwib3V0c19fbGlua1wiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJjb250cm9sLWVuZHN0b3BzLWNoZWNrXCJcbiAgICAgICAgICBAY2xpY2s9XCJjaGVja0VuZHN0b3BzXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IGVuZHN0b3BzLmxlbmd0aCA/ICdDaGVjayBhZ2FpbicgOiAnQ2hlY2sgdGhlbScgfX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2gzPlxuICAgICAgPGRpdlxuICAgICAgICB2LWZvcj1cImVuZHN0b3AgaW4gZW5kc3RvcHNcIlxuICAgICAgICA6a2V5PVwiZW5kc3RvcC5uYW1lXCJcbiAgICAgICAgY2xhc3M9XCJjcm93XCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjcm93X19uYW1lXCI+e3sgZW5kc3RvcC5uYW1lIH19PC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzPVwib3V0c19fc3RhdGVcIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ291dHNfX3N0YXRlLS1oaXQnOiBlbmRzdG9wLnN0YXRlID09PSAndHJpZ2dlcmVkJyB9XCJcbiAgICAgICAgPnt7IGVuZHN0b3Auc3RhdGUgPT09ICd0cmlnZ2VyZWQnID8gJ1RyaWdnZXJlZCcgOiBlbmRzdG9wLnN0YXRlID09PSAnb3BlbicgPyAnT3BlbicgOiAnVW5rbm93bicgfX08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCIhZW5kc3RvcHMubGVuZ3RoXCJcbiAgICAgICAgY2xhc3M9XCJvdXRzX19ub3RlXCJcbiAgICAgID5cbiAgICAgICAgUmVhZHMgZWFjaCBzd2l0Y2ggb25jZSwgYXMgaXQgaXMgbm93LiBQcmVzcyBvbmUgYnkgaGFuZCBhbmQgY2hlY2sgYWdhaW4gdG8gc2VlIGl0IGNoYW5nZS5cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cbiAgPC9jb250cm9sLWNhcmQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBDb250cm9sTWl4aW4gZnJvbSAnQC9taXhpbnMvY29udHJvbCdcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHR5cGUgeyBFbmRzdG9wLCBMZWQsIE91dHB1dFBpbiwgUnVub3V0U2Vuc29yIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuaW1wb3J0IHtcbiAgZmlsYW1lbnRTZW5zb3JSb2xlLFxuICBsZWRDb21tYW5kLFxuICBsZWRQZXJjZW50LFxuICBwaW5Db21tYW5kLFxuICBwaW5QZXJjZW50LFxuICBzZW5zb3JDb21tYW5kLFxuICB0eXBlIEZpbGFtZW50U2Vuc29yUm9sZSxcbiAgdHlwZSBTZW5zb3JDb25maWdGaWxlXG59IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9tb2RlbCdcbmltcG9ydCBDb250cm9sQ2FyZCBmcm9tICcuL0NvbnRyb2xDYXJkLnZ1ZSdcbmltcG9ydCBSYW5nZVNsaWRlciBmcm9tICcuL1JhbmdlU2xpZGVyLnZ1ZSdcbmltcG9ydCBUb2dnbGVTd2l0Y2ggZnJvbSAnLi9Ub2dnbGVTd2l0Y2gudnVlJ1xuXG5pbnRlcmZhY2UgT3V0cHV0IHtcbiAga2V5OiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHBlcmNlbnQ6IG51bWJlcjtcbiAgZGltbWFibGU6IGJvb2xlYW47XG4gIHBpbj86IE91dHB1dFBpbjtcbiAgbGVkPzogTGVkO1xufVxuXG50eXBlIFNlbnNvciA9IFJ1bm91dFNlbnNvciAmIHsgcHJldHR5TmFtZTogc3RyaW5nOyByb2xlOiBGaWxhbWVudFNlbnNvclJvbGUgfVxuXG4vKipcbiAqIE91dHB1dHMgYW5kIHNlbnNvcnM6IHRoZSBvdXRwdXQgcGlucyBhbmQgTEVEcyB0aGF0IGFyZW4ndCB0aGVcbiAqIGxpZ2h0cyAoRmFucyBhbmQgbGlnaHRzIGhhcyB0aG9zZSksIHRoZSBmaWxhbWVudCBzZW5zb3JzIHdpdGggdGhlaXJcbiAqIG9uL29mZiAobm9uZSBmb3IgYSBzZW5zb3IgdGhhdCBsb2FkcyBmaWxhbWVudCksIGFuZCB0aGUgZW5kc3RvcHMsIHJlYWRcbiAqIHdoZW4gYXNrZWQuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENvbnRyb2xDYXJkLCBSYW5nZVNsaWRlciwgVG9nZ2xlU3dpdGNoIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnRyb2xPdXRwdXRzIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbikge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgb3V0cHV0c09ubHk/OiBib29sZWFuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSBkaWFnbm9zdGljc09ubHk/OiBib29sZWFuXG4gIHBlcmNlbnRWYWx1ZVRleHQgKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt2YWx1ZX0gcGVyY2VudGBcbiAgfVxuXG4gIGdldCBvdXRwdXRzICgpOiBPdXRwdXRbXSB7XG4gICAgY29uc3QgcGlucyA9ICgodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQaW5zJ10gYXMgT3V0cHV0UGluW10pID8/IFtdKVxuICAgICAgLmZpbHRlcihwID0+IHAuY29udHJvbGxhYmxlICYmIHAubmFtZSAhPT0gdGhpcy5saWdodHNQaW4/Lm5hbWUpXG4gICAgICAubWFwKHBpbiA9PiAoeyBrZXk6IHBpbi5rZXksIGxhYmVsOiBwaW4ucHJldHR5TmFtZSwgcGVyY2VudDogcGluUGVyY2VudChwaW4udmFsdWUpLCBkaW1tYWJsZTogcGluLnB3bSwgcGluIH0pKVxuICAgIGNvbnN0IGxlZHMgPSAoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0QWxsTGVkcyddIGFzIExlZFtdKSA/PyBbXSlcbiAgICAgIC5maWx0ZXIobCA9PiBsLm5hbWUgIT09IHRoaXMubGlnaHRzTGVkPy5uYW1lKVxuICAgICAgLm1hcChsZWQgPT4gKHsga2V5OiBsZWQua2V5LCBsYWJlbDogbGVkLnByZXR0eU5hbWUsIHBlcmNlbnQ6IGxlZFBlcmNlbnQobGVkLmNvbG9yX2RhdGEpLCBkaW1tYWJsZTogdHJ1ZSwgbGVkIH0pKVxuICAgIHJldHVybiBbLi4ucGlucywgLi4ubGVkc11cbiAgfVxuXG4gIHNldE91dHB1dCAob3V0OiBPdXRwdXQsIHBlcmNlbnQ6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgIU51bWJlci5pc0Zpbml0ZShwZXJjZW50KSB8fCBwZXJjZW50IDwgMCB8fCBwZXJjZW50ID4gMTAwKSByZXR1cm5cbiAgICBpZiAob3V0LnBpbikgdGhpcy5zZW5kR2NvZGUocGluQ29tbWFuZChvdXQucGluLCBvdXQucGluLnB3bSA/IHBlcmNlbnQgOiBwZXJjZW50ID4gMCkpXG4gICAgZWxzZSBpZiAob3V0LmxlZCkgdGhpcy5zZW5kR2NvZGUobGVkQ29tbWFuZChvdXQubGVkLm5hbWUsIHBlcmNlbnQpKVxuICB9XG5cbiAgZ2V0IGNvbmZpZ2ZpbGUgKCk6IFNlbnNvckNvbmZpZ0ZpbGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZVxuICB9XG5cbiAgLyoqIEVhY2ggc2Vuc29yIHdpdGggd2hhdCBpdCBpcyBmb3I6IG9uZSB0aGF0IGxvYWRzIGZpbGFtZW50IGhhcyBubyBvZmYuICovXG4gIGdldCBzZW5zb3JzICgpOiBTZW5zb3JbXSB7XG4gICAgcmV0dXJuICgodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRSdW5vdXRTZW5zb3JzJ10gYXMgQXJyYXk8UnVub3V0U2Vuc29yICYgeyBwcmV0dHlOYW1lOiBzdHJpbmcgfT4pID8/IFtdKVxuICAgICAgLm1hcChzZW5zb3IgPT4gKHsgLi4uc2Vuc29yLCByb2xlOiBmaWxhbWVudFNlbnNvclJvbGUodGhpcy5jb25maWdmaWxlLCBzZW5zb3IubmFtZSkgfSkpXG4gIH1cblxuICAvKiogUmVhZHMgdGhlIHByaW50ZXIncyBzZXR0aW5ncyBhcyB0aGV5IGFyZSBub3csIHNvIGFuIG9mZiBpcyByZWZ1c2VkIGhvd2V2ZXIgdGhpcyBpcyBjYWxsZWQuICovXG4gIHNldFNlbnNvciAobmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgY29uc3QgZ2NvZGUgPSBzZW5zb3JDb21tYW5kKG5hbWUsIGVuYWJsZWQsIHRoaXMuY29uZmlnZmlsZSlcbiAgICBpZiAoZ2NvZGUpIHRoaXMuc2VuZEdjb2RlKGdjb2RlKVxuICB9XG5cbiAgcmVxdWVzdGVkID0gZmFsc2VcbiAgcmVxdWVzdEdlbmVyYXRpb24gPSAwXG4gIHJlcXVlc3RlZFRhcmdldCA9ICcnXG4gIGVuZHN0b3BSZXN1bHQ6IEVuZHN0b3BbXSA9IFtdXG5cbiAgZ2V0IGVuZHN0b3BzICgpOiBFbmRzdG9wW10ge1xuICAgIC8vIEtsaXBwZXIgc2F5cyBvcGVuLCBvciBUUklHR0VSRUQgaW4gY2FwaXRhbHMuXG4gICAgcmV0dXJuIHRoaXMuZW5kc3RvcFJlc3VsdC5tYXAoZSA9PiAoeyBuYW1lOiBlLm5hbWUgPT09ICdQcm9iZScgPyBlLm5hbWUgOiBlLm5hbWUudG9VcHBlckNhc2UoKSwgc3RhdGU6IFN0cmluZyhlLnN0YXRlKS50b0xvd2VyQ2FzZSgpIH0pKVxuICB9XG5cbiAgYXN5bmMgY2hlY2tFbmRzdG9wcyAoKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZXF1ZXN0R2VuZXJhdGlvblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucGFuZWxUYXJnZXRcbiAgICB0aGlzLiRzdG9yZS5jb21taXQoJ3ByaW50ZXIvc2V0Q2xlYXJFbmRTdG9wcycpXG4gICAgdGhpcy5yZXF1ZXN0ZWQgPSB0cnVlXG4gICAgdGhpcy5yZXF1ZXN0ZWRUYXJnZXQgPSB0YXJnZXRcbiAgICB0aGlzLmVuZHN0b3BSZXN1bHQgPSBbXVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgU29ja2V0QWN0aW9ucy5wcmludGVyUXVlcnlFbmRzdG9wcygpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWRcbiAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZXF1ZXN0R2VuZXJhdGlvbiB8fCB0YXJnZXQgIT09IHRoaXMucGFuZWxUYXJnZXQgfHwgdGFyZ2V0ICE9PSB0aGlzLnJlcXVlc3RlZFRhcmdldCB8fCAhcmVzcG9uc2UpIHJldHVyblxuICAgIHRoaXMuZW5kc3RvcFJlc3VsdCA9IE9iamVjdC5rZXlzKHJlc3BvbnNlKS5zb3J0KCkubWFwKG5hbWUgPT4gKHsgbmFtZSwgc3RhdGU6IHJlc3BvbnNlW25hbWVdIH0pKVxuICB9XG5cbiAgQFdhdGNoKCdwYW5lbFRhcmdldCcpXG4gIGNsZWFyRW5kc3RvcFJlcXVlc3QgKCkge1xuICAgIHRoaXMucmVxdWVzdEdlbmVyYXRpb24rK1xuICAgIHRoaXMucmVxdWVzdGVkID0gZmFsc2VcbiAgICB0aGlzLnJlcXVlc3RlZFRhcmdldCA9ICcnXG4gICAgdGhpcy5lbmRzdG9wUmVzdWx0ID0gW11cbiAgICB0aGlzLiRzdG9yZS5jb21taXQoJ3ByaW50ZXIvc2V0Q2xlYXJFbmRTdG9wcycpXG4gIH1cblxuICAvKiogQSByZWFkaW5nIGdvZXMgc3RhbGU6IGxlYXZpbmcgdGhlIHBhZ2UgY2xlYXJzIGl0LCBhcyBGbHVpZGQncyBvd24gcGFuZWwgZG9lcy4gKi9cbiAgZGVzdHJveWVkICgpIHtcbiAgICB0aGlzLiRzdG9yZS5jb21taXQoJ3ByaW50ZXIvc2V0Q2xlYXJFbmRTdG9wcycpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5vdXRzX19ncm91cCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXG4gICAgPiAuY3JvdyArIC5jcm93IHtcbiAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICB9XG4gIH1cblxuICAub3V0c19fbGFiZWwge1xuICAgIG1hcmdpbjogMCAwIDRweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLm91dHNfX2xhYmVsLS1yb3cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIH1cblxuICAub3V0c19fbGluayB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuXG4gICAgJjpkaXNhYmxlZCB7XG4gICAgICBvcGFjaXR5OiAwLjQ1O1xuICAgIH1cbiAgfVxuXG4gIC5vdXRzX19zbGlkZXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMCAxIDIyMHB4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuXG4gICAgLmNyb3dfX3ZhbHVlIHtcbiAgICAgIG1pbi13aWR0aDogNDBweDtcbiAgICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIC5vdXRzX19zdGF0ZSB7XG4gICAgcGFkZGluZzogMnB4IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5vdXRzX193aHkge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gIH1cblxuICAub3V0c19fc3RhdGUtLWhpdCB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDE1OSwgMTAsIDAuMTYpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZywgI2ZmOWYwYSk7XG4gIH1cblxuICAub3V0c19fbm90ZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sT3V0cHV0cy52dWUifQ==