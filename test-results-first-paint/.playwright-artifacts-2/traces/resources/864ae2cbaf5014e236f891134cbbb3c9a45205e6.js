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
import DevGuardMixin from "/src/mixins/dev-guard.ts";
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import RangeSlider from "/src/components/control/RangeSlider.vue";
import ControlTaskFold from "/src/components/control/ControlTaskFold.vue";
import ControlOutputs from "/src/components/control/ControlOutputs.vue";
let ControlFans = class extends Mixins(ControlMixin, DevGuardMixin) {
  phone;
  percentValueText(value) {
    return `${value} percent`;
  }
  get otherOutputCount() {
    const pins = (this.$store.getters["printer/getPins"] ?? []).filter((p) => p.controllable && p.name !== this.lightsPin?.name);
    const leds = (this.$store.getters["printer/getAllLeds"] ?? []).filter((l) => l.name !== this.lightsLed?.name);
    return pins.length + leds.length;
  }
  get fanOptions() {
    return [
      { value: "auto", label: "Auto", sub: "as sliced", title: "While it prints, the print sets the fan" },
      { value: "on", label: "On", sub: "100%" },
      { value: "off", label: "Off", sub: "0%" }
    ];
  }
  get fanOptionsShort() {
    return this.fanOptions.map((o) => ({ value: o.value, label: o.label, title: o.title }));
  }
  /** Printing, the print sets the fan unless it was turned fully on or off. */
  get fanMode() {
    const percent = this.partFan ? this.fanValue(this.partFan) : 0;
    if (this.busy && percent > 0 && percent < 100) return "auto";
    if (percent >= 100) return "on";
    if (percent <= 0) return this.busy ? "auto" : "off";
    return "auto";
  }
  setFanMode(mode) {
    if (!this.partFan || mode === "auto") return;
    this.setFan(this.partFan, mode === "on" ? 100 : 0);
  }
  get dimmable() {
    return this.lightsPin ? this.lightsPin.pwm : !!this.lightsLed;
  }
  isSettable(fan) {
    return fan.type === "fan" || fan.type === "fan_generic";
  }
  automaticLabel(fan) {
    if (fan.type === "heater_fan") return "with the nozzle heater";
    if (fan.type === "controller_fan") return "with the motors";
    if (fan.type === "temperature_fan") return typeof fan.target === "number" ? `holds ${Math.round(fan.target)}\xB0` : "by temperature";
    return "automatic";
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlFans.prototype, "phone", 2);
ControlFans = __decorateClass([
  Component({ components: { ControlCard, SegPicker, ToggleSwitch, RangeSlider, ControlTaskFold, ControlOutputs } })
], ControlFans);
const _sfc_main = ControlFans;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": "Fans and lights", "icon": "fan", "locked": _vm.controlLock, "data-tid": "control-fans" } }, [_vm.partFan ? _c("div", { staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v("Part fan "), _c("span", { staticClass: "crow__sub" }, [_vm._v("cools the print")])]), _c("seg-picker", { attrs: { "options": _vm.fanOptions, "value": _vm.fanMode, "label": "Part fan", "disabled": !_vm.controlReady }, on: { "input": _vm.setFanMode } })], 1) : _vm._e(), _vm.partFan ? _c("p", { staticClass: "fans__none" }, [_vm._v(" Auto follows the next fan command in the print; On and Off set it now. ")]) : _vm._e(), _vm.hasLights ? _c("div", { staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v("Lights")]), _c("toggle-switch", { attrs: { "value": _vm.lightsValue > 0, "label": "Lights", "disabled": !_vm.controlReady }, on: { "input": _vm.setLights } })], 1) : _vm._e(), _c("control-task-fold", { attrs: { "fold-key": "fans.all", "title": _vm.otherOutputCount ? "All fans and outputs" : "All fans", "summary": `${_vm.fans.length} fans${_vm.otherOutputCount ? ` \xB7 ${_vm.otherOutputCount} outputs` : ""} \xB7 brightness` } }, [_vm._l(_vm.fans, function(fan) {
    return _c("div", { key: fan.key, staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(fan.type === "fan" ? "Part fan" : fan.prettyName)), !_vm.isSettable(fan) ? _c("span", { staticClass: "crow__sub" }, [_vm._v(" \xB7 " + _vm._s(_vm.automaticLabel(fan)))]) : _vm._e()]), _vm.isSettable(fan) && !_vm.devOnlyLocked ? _c("range-slider", { staticClass: "fans__slider", attrs: { "value": _vm.fanValue(fan), "label": fan.prettyName, "value-text-formatter": _vm.percentValueText, "disabled": !_vm.controlReady }, on: { "change": function($event) {
      return _vm.setFan(fan, $event);
    } } }) : _vm._e(), _c("b", { staticClass: "crow__value" }, [_vm._v(_vm._s(_vm.fanValue(fan) ? `${_vm.fanValue(fan)}%` : "off"))])], 1);
  }), _vm.hasLights && _vm.dimmable ? _c("div", { staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v("Lights brightness")]), _c("range-slider", { staticClass: "fans__slider", attrs: { "value": _vm.lightsValue, "label": "Lights brightness", "value-text-formatter": _vm.percentValueText, "disabled": !_vm.controlReady }, on: { "change": _vm.setLights } })], 1) : _vm._e(), _c("control-outputs", { attrs: { "outputs-only": "" } })], 2)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlFans.vue?vue&type=style&index=0&scoped=31a77aae&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "31a77aae",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlFans.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW1GQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFRQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBcERBO0FBQUEsRUFEQTtBQUFBLEdBREEsWUFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2xGYW5zLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxjb250cm9sLWNhcmRcbiAgICB0aXRsZT1cIkZhbnMgYW5kIGxpZ2h0c1wiXG4gICAgaWNvbj1cImZhblwiXG4gICAgOmxvY2tlZD1cImNvbnRyb2xMb2NrXCJcbiAgICBkYXRhLXRpZD1cImNvbnRyb2wtZmFuc1wiXG4gID5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwicGFydEZhblwiXG4gICAgICBjbGFzcz1cImNyb3dcIlxuICAgID5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY3Jvd19fbmFtZVwiPlBhcnQgZmFuIDxzcGFuIGNsYXNzPVwiY3Jvd19fc3ViXCI+Y29vbHMgdGhlIHByaW50PC9zcGFuPjwvc3Bhbj5cbiAgICAgIDxzZWctcGlja2VyXG4gICAgICAgIDpvcHRpb25zPVwiZmFuT3B0aW9uc1wiXG4gICAgICAgIDp2YWx1ZT1cImZhbk1vZGVcIlxuICAgICAgICBsYWJlbD1cIlBhcnQgZmFuXCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgIEBpbnB1dD1cInNldEZhbk1vZGVcIlxuICAgICAgLz5cbiAgICA8L2Rpdj5cbiAgICA8cFxuICAgICAgdi1pZj1cInBhcnRGYW5cIlxuICAgICAgY2xhc3M9XCJmYW5zX19ub25lXCJcbiAgICA+XG4gICAgICBBdXRvIGZvbGxvd3MgdGhlIG5leHQgZmFuIGNvbW1hbmQgaW4gdGhlIHByaW50OyBPbiBhbmQgT2ZmIHNldCBpdCBub3cuXG4gICAgPC9wPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJoYXNMaWdodHNcIlxuICAgICAgY2xhc3M9XCJjcm93XCJcbiAgICA+XG4gICAgICA8c3BhbiBjbGFzcz1cImNyb3dfX25hbWVcIj5MaWdodHM8L3NwYW4+XG4gICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICA6dmFsdWU9XCJsaWdodHNWYWx1ZSA+IDBcIlxuICAgICAgICBsYWJlbD1cIkxpZ2h0c1wiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICBAaW5wdXQ9XCJzZXRMaWdodHNcIlxuICAgICAgLz5cbiAgICA8L2Rpdj5cbiAgICA8Y29udHJvbC10YXNrLWZvbGRcbiAgICAgIGZvbGQta2V5PVwiZmFucy5hbGxcIlxuICAgICAgOnRpdGxlPVwib3RoZXJPdXRwdXRDb3VudCA/ICdBbGwgZmFucyBhbmQgb3V0cHV0cycgOiAnQWxsIGZhbnMnXCJcbiAgICAgIDpzdW1tYXJ5PVwiYCR7ZmFucy5sZW5ndGh9IGZhbnMke290aGVyT3V0cHV0Q291bnQgPyBgIMK3ICR7b3RoZXJPdXRwdXRDb3VudH0gb3V0cHV0c2AgOiAnJ30gwrcgYnJpZ2h0bmVzc2BcIlxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJmYW4gaW4gZmFuc1wiXG4gICAgICAgIDprZXk9XCJmYW4ua2V5XCJcbiAgICAgICAgY2xhc3M9XCJjcm93XCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjcm93X19uYW1lXCI+e3sgZmFuLnR5cGUgPT09ICdmYW4nID8gJ1BhcnQgZmFuJyA6IGZhbi5wcmV0dHlOYW1lIH19PHNwYW5cbiAgICAgICAgICB2LWlmPVwiIWlzU2V0dGFibGUoZmFuKVwiXG4gICAgICAgICAgY2xhc3M9XCJjcm93X19zdWJcIlxuICAgICAgICA+IMK3IHt7IGF1dG9tYXRpY0xhYmVsKGZhbikgfX08L3NwYW4+PC9zcGFuPlxuICAgICAgICA8cmFuZ2Utc2xpZGVyXG4gICAgICAgICAgdi1pZj1cImlzU2V0dGFibGUoZmFuKSAmJiAhZGV2T25seUxvY2tlZFwiXG4gICAgICAgICAgY2xhc3M9XCJmYW5zX19zbGlkZXJcIlxuICAgICAgICAgIDp2YWx1ZT1cImZhblZhbHVlKGZhbilcIlxuICAgICAgICAgIDpsYWJlbD1cImZhbi5wcmV0dHlOYW1lXCJcbiAgICAgICAgICA6dmFsdWUtdGV4dC1mb3JtYXR0ZXI9XCJwZXJjZW50VmFsdWVUZXh0XCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICBAY2hhbmdlPVwic2V0RmFuKGZhbiwgJGV2ZW50KVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxiIGNsYXNzPVwiY3Jvd19fdmFsdWVcIj57eyBmYW5WYWx1ZShmYW4pID8gYCR7ZmFuVmFsdWUoZmFuKX0lYCA6ICdvZmYnIH19PC9iPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJoYXNMaWdodHMgJiYgZGltbWFibGVcIlxuICAgICAgICBjbGFzcz1cImNyb3dcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNyb3dfX25hbWVcIj5MaWdodHMgYnJpZ2h0bmVzczwvc3Bhbj5cbiAgICAgICAgPHJhbmdlLXNsaWRlclxuICAgICAgICAgIGNsYXNzPVwiZmFuc19fc2xpZGVyXCJcbiAgICAgICAgICA6dmFsdWU9XCJsaWdodHNWYWx1ZVwiXG4gICAgICAgICAgbGFiZWw9XCJMaWdodHMgYnJpZ2h0bmVzc1wiXG4gICAgICAgICAgOnZhbHVlLXRleHQtZm9ybWF0dGVyPVwicGVyY2VudFZhbHVlVGV4dFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgQGNoYW5nZT1cInNldExpZ2h0c1wiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxjb250cm9sLW91dHB1dHMgb3V0cHV0cy1vbmx5IC8+XG4gICAgPC9jb250cm9sLXRhc2stZm9sZD5cbiAgPC9jb250cm9sLWNhcmQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IERldkd1YXJkTWl4aW4gZnJvbSAnQC9taXhpbnMvZGV2LWd1YXJkJ1xuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiBmcm9tICdAL21peGlucy9jb250cm9sJ1xuaW1wb3J0IHR5cGUgeyBGYW4sIExlZCwgT3V0cHV0UGluIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuaW1wb3J0IENvbnRyb2xDYXJkIGZyb20gJy4vQ29udHJvbENhcmQudnVlJ1xuaW1wb3J0IFNlZ1BpY2tlciwgeyB0eXBlIFNlZ09wdGlvbiB9IGZyb20gJy4vU2VnUGlja2VyLnZ1ZSdcbmltcG9ydCBUb2dnbGVTd2l0Y2ggZnJvbSAnLi9Ub2dnbGVTd2l0Y2gudnVlJ1xuaW1wb3J0IFJhbmdlU2xpZGVyIGZyb20gJy4vUmFuZ2VTbGlkZXIudnVlJ1xuaW1wb3J0IENvbnRyb2xUYXNrRm9sZCBmcm9tICcuL0NvbnRyb2xUYXNrRm9sZC52dWUnXG5pbXBvcnQgQ29udHJvbE91dHB1dHMgZnJvbSAnLi9Db250cm9sT3V0cHV0cy52dWUnXG5cbnR5cGUgRmFuTW9kZSA9ICdhdXRvJyB8ICdvbicgfCAnb2ZmJ1xuXG4vKipcbiAqIFBhcnQgZmFuIGFuZCBsaWdodHMgdXAgZnJvbnQ7IGF1dG9tYXRpYyBmYW5zLCBicmlnaHRuZXNzIGFuZCBvdXRwdXRzIG9uZSBzdGVwIGF3YXkuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENvbnRyb2xDYXJkLCBTZWdQaWNrZXIsIFRvZ2dsZVN3aXRjaCwgUmFuZ2VTbGlkZXIsIENvbnRyb2xUYXNrRm9sZCwgQ29udHJvbE91dHB1dHMgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29udHJvbEZhbnMgZXh0ZW5kcyBNaXhpbnMoQ29udHJvbE1peGluLCBEZXZHdWFyZE1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBwaG9uZT86IGJvb2xlYW5cblxuICBwZXJjZW50VmFsdWVUZXh0ICh2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dmFsdWV9IHBlcmNlbnRgXG4gIH1cblxuICBnZXQgb3RoZXJPdXRwdXRDb3VudCAoKTogbnVtYmVyIHtcbiAgICBjb25zdCBwaW5zID0gKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFBpbnMnXSBhcyBPdXRwdXRQaW5bXSkgPz8gW10pLmZpbHRlcihwID0+IHAuY29udHJvbGxhYmxlICYmIHAubmFtZSAhPT0gdGhpcy5saWdodHNQaW4/Lm5hbWUpXG4gICAgY29uc3QgbGVkcyA9ICgodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRBbGxMZWRzJ10gYXMgTGVkW10pID8/IFtdKS5maWx0ZXIobCA9PiBsLm5hbWUgIT09IHRoaXMubGlnaHRzTGVkPy5uYW1lKVxuICAgIHJldHVybiBwaW5zLmxlbmd0aCArIGxlZHMubGVuZ3RoXG4gIH1cblxuICBnZXQgZmFuT3B0aW9ucyAoKTogU2VnT3B0aW9uW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7IHZhbHVlOiAnYXV0bycsIGxhYmVsOiAnQXV0bycsIHN1YjogJ2FzIHNsaWNlZCcsIHRpdGxlOiAnV2hpbGUgaXQgcHJpbnRzLCB0aGUgcHJpbnQgc2V0cyB0aGUgZmFuJyB9LFxuICAgICAgeyB2YWx1ZTogJ29uJywgbGFiZWw6ICdPbicsIHN1YjogJzEwMCUnIH0sXG4gICAgICB7IHZhbHVlOiAnb2ZmJywgbGFiZWw6ICdPZmYnLCBzdWI6ICcwJScgfVxuICAgIF1cbiAgfVxuXG4gIGdldCBmYW5PcHRpb25zU2hvcnQgKCk6IFNlZ09wdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5mYW5PcHRpb25zLm1hcChvID0+ICh7IHZhbHVlOiBvLnZhbHVlLCBsYWJlbDogby5sYWJlbCwgdGl0bGU6IG8udGl0bGUgfSkpXG4gIH1cblxuICAvKiogUHJpbnRpbmcsIHRoZSBwcmludCBzZXRzIHRoZSBmYW4gdW5sZXNzIGl0IHdhcyB0dXJuZWQgZnVsbHkgb24gb3Igb2ZmLiAqL1xuICBnZXQgZmFuTW9kZSAoKTogRmFuTW9kZSB7XG4gICAgY29uc3QgcGVyY2VudCA9IHRoaXMucGFydEZhbiA/IHRoaXMuZmFuVmFsdWUodGhpcy5wYXJ0RmFuKSA6IDBcbiAgICBpZiAodGhpcy5idXN5ICYmIHBlcmNlbnQgPiAwICYmIHBlcmNlbnQgPCAxMDApIHJldHVybiAnYXV0bydcbiAgICBpZiAocGVyY2VudCA+PSAxMDApIHJldHVybiAnb24nXG4gICAgaWYgKHBlcmNlbnQgPD0gMCkgcmV0dXJuIHRoaXMuYnVzeSA/ICdhdXRvJyA6ICdvZmYnXG4gICAgcmV0dXJuICdhdXRvJ1xuICB9XG5cbiAgc2V0RmFuTW9kZSAobW9kZTogRmFuTW9kZSkge1xuICAgIGlmICghdGhpcy5wYXJ0RmFuIHx8IG1vZGUgPT09ICdhdXRvJykgcmV0dXJuXG4gICAgdGhpcy5zZXRGYW4odGhpcy5wYXJ0RmFuLCBtb2RlID09PSAnb24nID8gMTAwIDogMClcbiAgfVxuXG4gIGdldCBkaW1tYWJsZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubGlnaHRzUGluID8gdGhpcy5saWdodHNQaW4ucHdtIDogISF0aGlzLmxpZ2h0c0xlZFxuICB9XG5cbiAgaXNTZXR0YWJsZSAoZmFuOiBGYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmFuLnR5cGUgPT09ICdmYW4nIHx8IGZhbi50eXBlID09PSAnZmFuX2dlbmVyaWMnXG4gIH1cblxuICBhdXRvbWF0aWNMYWJlbCAoZmFuOiBGYW4pOiBzdHJpbmcge1xuICAgIGlmIChmYW4udHlwZSA9PT0gJ2hlYXRlcl9mYW4nKSByZXR1cm4gJ3dpdGggdGhlIG5venpsZSBoZWF0ZXInXG4gICAgaWYgKGZhbi50eXBlID09PSAnY29udHJvbGxlcl9mYW4nKSByZXR1cm4gJ3dpdGggdGhlIG1vdG9ycydcbiAgICBpZiAoZmFuLnR5cGUgPT09ICd0ZW1wZXJhdHVyZV9mYW4nKSByZXR1cm4gdHlwZW9mIGZhbi50YXJnZXQgPT09ICdudW1iZXInID8gYGhvbGRzICR7TWF0aC5yb3VuZChmYW4udGFyZ2V0KX3CsGAgOiAnYnkgdGVtcGVyYXR1cmUnXG4gICAgcmV0dXJuICdhdXRvbWF0aWMnXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5mYW5zLXNpbXBsZSB7XG4gICAgZGlzcGxheTogY29udGVudHM7XG4gIH1cblxuICAuZmFucy1zaW1wbGVfX2RpbSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLmZhbnMtc2ltcGxlX19kaW0tbG93IHtcbiAgICBvcGFjaXR5OiAwLjY7XG4gIH1cblxuICAuZmFucy1zaW1wbGVfX3Jvd3MgPiAuY3JvdyArIC5jcm93IHtcbiAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gIH1cblxuICAuZmFuc19fc2xpZGVyIHtcbiAgICBmbGV4OiAwIDEgMTgwcHg7XG4gICAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gIH1cblxuICAuZmFuc19fbm9uZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sRmFucy52dWUifQ==