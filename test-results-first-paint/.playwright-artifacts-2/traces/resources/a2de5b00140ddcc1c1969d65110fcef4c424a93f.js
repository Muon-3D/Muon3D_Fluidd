/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import FilamentActionsMixin from "/src/mixins/filament-actions.ts";
import MaterialPicker from "/src/components/overview/MaterialPicker.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import { filamentSensorRole, sensorCommand } from "/src/services/control/model.ts";
import { filamentView, inkFor } from "/src/services/overview/tiles.ts";
import { sensorsPath } from "/src/services/control/sensors-link.ts";
let FilamentSection = class extends Mixins(FilamentActionsMixin) {
  phone;
  compact;
  tidPrefix;
  get view() {
    const loaded = this.loadedMaterial ? { name: this.loadedMaterial.name, colour: this.loadedColour } : null;
    const spool = loaded ? null : this.$store.getters["spoolman/getActiveSpool"];
    const view = filamentView(spool, loaded, this.printingWith);
    if (view.source === "none" && this.filamentSensed) return { ...view, type: "Filament loaded", detail: "Press to say which material" };
    if (view.source === "none") return { ...view, detail: "Press to set the material and colour" };
    return view;
  }
  /** Nothing is loaded: the one place to warn, in the one phrase. */
  get noMaterial() {
    return this.view.source === "none" && !this.filamentSensed;
  }
  get ink() {
    return inkFor(this.view.colour);
  }
  get sensors() {
    return (this.$store.getters["printer/getRunoutSensors"] ?? []).map((sensor) => ({ ...sensor, role: filamentSensorRole(this.$store.state.printer.printer.configfile, sensor.name) }));
  }
  get hasSensors() {
    return this.sensors.length > 0;
  }
  get loaders() {
    return this.sensors.filter((s) => s.role === "loads");
  }
  get manualSensors() {
    return this.sensors.filter((s) => s.role !== "loads");
  }
  get sensorsLink() {
    return sensorsPath();
  }
  setRunout(name, enabled) {
    if (!this.controlReady) return;
    const command = sensorCommand(name, enabled, this.$store.state.printer.printer.configfile);
    if (command) this.sendGcode(command);
  }
  /**
   * Mid-print: M600, which pauses the print, after its confirm. Idle: open
   * the material panel and send nothing (KAN-1700).
   */
  async changeFilament() {
    if (this.changePlan.kind === "panel") {
      this.openPanel();
      return;
    }
    await this.runFilamentPlan("change");
  }
  openPanel() {
    const picker = this.$refs.picker;
    if (picker) this.$nextTick(() => {
      picker.open = true;
    });
  }
};
__decorateClass([
  Prop({ type: Boolean })
], FilamentSection.prototype, "phone", 2);
__decorateClass([
  Prop({ type: Boolean })
], FilamentSection.prototype, "compact", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], FilamentSection.prototype, "tidPrefix", 2);
FilamentSection = __decorateClass([
  Component({ components: { MaterialPicker, ToggleSwitch } })
], FilamentSection);
const _sfc_main = FilamentSection;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "fsec", class: { "fsec--phone": _vm.phone, "fsec--compact": _vm.compact }, attrs: { "data-tid": "filament-section" } }, [_c("material-picker", { ref: "picker", scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs, disabled }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "fsec__row", attrs: { "type": "button", "disabled": disabled, "aria-haspopup": "listbox", "aria-label": `Filament: ${_vm.view.type}. Set material and colour`, "data-tid": "filament-row" } }, "button", attrs, false), on), [_c("span", { staticClass: "fsec__spool", class: { "fsec__spool--none": !_vm.view.colour }, style: _vm.view.colour ? { background: _vm.view.colour, color: _vm.ink } : void 0, attrs: { "data-tid": "filament-swatch" } }, [_c(__unplugin_components_0, { attrs: { "name": "spool", "large": "" } })], 1), _c("span", { staticClass: "fsec__text" }, [_c("b", { attrs: { "data-tid": "filament-type" } }, [_vm.noMaterial ? _c(__unplugin_components_1, { staticClass: "fsec__warn", attrs: { "x-small": "", "data-tid": "filament-warning" } }, [_vm._v("$warning")]) : _vm._e(), _vm._v(_vm._s(_vm.view.type) + " ")], 1), _c("span", { attrs: { "data-tid": "filament-detail" } }, [_vm._v(_vm._s(_vm.view.detail))])])])];
  } }]) }), !_vm.compact ? [_c("div", { staticClass: "fsec__buttons" }, [_c("button", { staticClass: "cbtn cbtn--primary cbtn--grow", attrs: { "type": "button", "disabled": !!_vm.controlLock || _vm.changePlan.kind === "none", "title": _vm.changePlan.kind === "none" ? _vm.changePlan.reason : "", "data-tid": `${_vm.tidPrefix}change-filament` }, on: { "click": _vm.changeFilament } }, [_vm._v(" Change filament ")]), _c("button", { staticClass: "cbtn cbtn--grow", attrs: { "type": "button", "disabled": !!_vm.controlLock || _vm.loadPlan.kind === "none", "title": _vm.loadPlan.kind === "none" ? _vm.loadPlan.reason : "", "data-tid": `${_vm.tidPrefix}load-filament` }, on: { "click": function($event) {
    return _vm.runFilamentPlan("load");
  } } }, [_vm._v(" Load ")]), _c("button", { staticClass: "cbtn cbtn--grow", attrs: { "type": "button", "disabled": !!_vm.controlLock || _vm.unloadPlan.kind === "none", "title": _vm.unloadPlan.kind === "none" ? _vm.unloadPlan.reason : "", "data-tid": `${_vm.tidPrefix}unload-filament` }, on: { "click": function($event) {
    return _vm.runFilamentPlan("unload");
  } } }, [_vm._v(" Unload ")])]), _vm._l(_vm.loaders, function(sensor) {
    return _c("p", { key: sensor.name, staticClass: "fsec__loader" }, [sensor.enabled ? [_vm._v(" " + _vm._s(sensor.filament_detected ? "Filament in." : "No filament.") + " Push new filament in and it loads by itself. "), _c("b", [_vm._v("Always on")])] : [_vm._v(" Automatic loading is off. Report the sensor state before loading filament. ")]], 2);
  }), _vm._l(_vm.manualSensors, function(sensor) {
    return _c("div", { key: sensor.name, staticClass: "crow", attrs: { "data-tid": "filament-sensor" } }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(sensor.prettyName) + " \xB7 " + _vm._s(!sensor.enabled ? "off" : sensor.filament_detected ? "filament in" : "no filament")), sensor.role === "unknown" ? _c("span", { staticClass: "crow__sub" }, [_vm._v(" \xB7 settings not loaded")]) : _vm._e()]), _c("toggle-switch", { attrs: { "value": sensor.enabled, "label": `${sensor.prettyName} on`, "disabled": !_vm.controlReady || sensor.enabled && sensor.role !== "runout" }, on: { "input": function($event) {
      return _vm.setRunout(sensor.name, $event);
    } } })], 1);
  }), _vm.hasSensors ? _c("router-link", { staticClass: "fsec__sensors", attrs: { "to": _vm.sensorsLink, "data-tid": "filament-sensors-link" } }, [_vm._v(" Filament sensors in Health \u203A ")]) : _vm._e()] : _vm._e(), _vm._t("default")], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/FilamentSection.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/FilamentSection.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBdUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBV0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBLG1FQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUNBO0FBeERBO0FBQUE7QUFBQSxHQURBLGdCQUNBO0FBRUE7QUFBQTtBQUFBLEdBSEEsZ0JBR0E7QUFFQTtBQUFBO0FBQUEsR0FMQSxnQkFLQTtBQUxBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkZpbGFtZW50U2VjdGlvbi52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJmc2VjXCJcbiAgICA6Y2xhc3M9XCJ7ICdmc2VjLS1waG9uZSc6IHBob25lLCAnZnNlYy0tY29tcGFjdCc6IGNvbXBhY3QgfVwiXG4gICAgZGF0YS10aWQ9XCJmaWxhbWVudC1zZWN0aW9uXCJcbiAgPlxuICAgIDxtYXRlcmlhbC1waWNrZXIgcmVmPVwicGlja2VyXCI+XG4gICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzLCBkaXNhYmxlZCB9XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImZzZWNfX3Jvd1wiXG4gICAgICAgICAgOmRpc2FibGVkPVwiZGlzYWJsZWRcIlxuICAgICAgICAgIGFyaWEtaGFzcG9wdXA9XCJsaXN0Ym94XCJcbiAgICAgICAgICA6YXJpYS1sYWJlbD1cImBGaWxhbWVudDogJHt2aWV3LnR5cGV9LiBTZXQgbWF0ZXJpYWwgYW5kIGNvbG91cmBcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiZmlsYW1lbnQtcm93XCJcbiAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzcz1cImZzZWNfX3Nwb29sXCJcbiAgICAgICAgICAgIDpjbGFzcz1cInsgJ2ZzZWNfX3Nwb29sLS1ub25lJzogIXZpZXcuY29sb3VyIH1cIlxuICAgICAgICAgICAgOnN0eWxlPVwidmlldy5jb2xvdXIgPyB7IGJhY2tncm91bmQ6IHZpZXcuY29sb3VyLCBjb2xvcjogaW5rIH0gOiB1bmRlZmluZWRcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJmaWxhbWVudC1zd2F0Y2hcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJzcG9vbFwiXG4gICAgICAgICAgICAgIGxhcmdlXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImZzZWNfX3RleHRcIj5cbiAgICAgICAgICAgIDxiIGRhdGEtdGlkPVwiZmlsYW1lbnQtdHlwZVwiPlxuICAgICAgICAgICAgICA8di1pY29uXG4gICAgICAgICAgICAgICAgdi1pZj1cIm5vTWF0ZXJpYWxcIlxuICAgICAgICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZzZWNfX3dhcm5cIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwiZmlsYW1lbnQtd2FybmluZ1wiXG4gICAgICAgICAgICAgID4kd2FybmluZzwvdi1pY29uPnt7IHZpZXcudHlwZSB9fVxuICAgICAgICAgICAgPC9iPlxuICAgICAgICAgICAgPHNwYW4gZGF0YS10aWQ9XCJmaWxhbWVudC1kZXRhaWxcIj57eyB2aWV3LmRldGFpbCB9fTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L21hdGVyaWFsLXBpY2tlcj5cbiAgICA8dGVtcGxhdGUgdi1pZj1cIiFjb21wYWN0XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZnNlY19fYnV0dG9uc1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnkgY2J0bi0tZ3Jvd1wiXG4gICAgICAgICAgOmRpc2FibGVkPVwiISFjb250cm9sTG9jayB8fCBjaGFuZ2VQbGFuLmtpbmQgPT09ICdub25lJ1wiXG4gICAgICAgICAgOnRpdGxlPVwiY2hhbmdlUGxhbi5raW5kID09PSAnbm9uZScgPyBjaGFuZ2VQbGFuLnJlYXNvbiA6ICcnXCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgJHt0aWRQcmVmaXh9Y2hhbmdlLWZpbGFtZW50YFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2hhbmdlRmlsYW1lbnRcIlxuICAgICAgICA+XG4gICAgICAgICAgQ2hhbmdlIGZpbGFtZW50XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdyb3dcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiEhY29udHJvbExvY2sgfHwgbG9hZFBsYW4ua2luZCA9PT0gJ25vbmUnXCJcbiAgICAgICAgICA6dGl0bGU9XCJsb2FkUGxhbi5raW5kID09PSAnbm9uZScgPyBsb2FkUGxhbi5yZWFzb24gOiAnJ1wiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYCR7dGlkUHJlZml4fWxvYWQtZmlsYW1lbnRgXCJcbiAgICAgICAgICBAY2xpY2s9XCJydW5GaWxhbWVudFBsYW4oJ2xvYWQnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBMb2FkXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdyb3dcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiEhY29udHJvbExvY2sgfHwgdW5sb2FkUGxhbi5raW5kID09PSAnbm9uZSdcIlxuICAgICAgICAgIDp0aXRsZT1cInVubG9hZFBsYW4ua2luZCA9PT0gJ25vbmUnID8gdW5sb2FkUGxhbi5yZWFzb24gOiAnJ1wiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYCR7dGlkUHJlZml4fXVubG9hZC1maWxhbWVudGBcIlxuICAgICAgICAgIEBjbGljaz1cInJ1bkZpbGFtZW50UGxhbigndW5sb2FkJylcIlxuICAgICAgICA+XG4gICAgICAgICAgVW5sb2FkXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8cFxuICAgICAgICB2LWZvcj1cInNlbnNvciBpbiBsb2FkZXJzXCJcbiAgICAgICAgOmtleT1cInNlbnNvci5uYW1lXCJcbiAgICAgICAgY2xhc3M9XCJmc2VjX19sb2FkZXJcIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgdi1pZj1cInNlbnNvci5lbmFibGVkXCI+XG4gICAgICAgICAge3sgc2Vuc29yLmZpbGFtZW50X2RldGVjdGVkID8gJ0ZpbGFtZW50IGluLicgOiAnTm8gZmlsYW1lbnQuJyB9fSBQdXNoIG5ldyBmaWxhbWVudCBpbiBhbmQgaXQgbG9hZHMgYnkgaXRzZWxmLiA8Yj5BbHdheXMgb248L2I+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgICAgQXV0b21hdGljIGxvYWRpbmcgaXMgb2ZmLiBSZXBvcnQgdGhlIHNlbnNvciBzdGF0ZSBiZWZvcmUgbG9hZGluZyBmaWxhbWVudC5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDwvcD5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1mb3I9XCJzZW5zb3IgaW4gbWFudWFsU2Vuc29yc1wiXG4gICAgICAgIDprZXk9XCJzZW5zb3IubmFtZVwiXG4gICAgICAgIGNsYXNzPVwiY3Jvd1wiXG4gICAgICAgIGRhdGEtdGlkPVwiZmlsYW1lbnQtc2Vuc29yXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjcm93X19uYW1lXCI+e3sgc2Vuc29yLnByZXR0eU5hbWUgfX0gwrcge3sgIXNlbnNvci5lbmFibGVkID8gJ29mZicgOiBzZW5zb3IuZmlsYW1lbnRfZGV0ZWN0ZWQgPyAnZmlsYW1lbnQgaW4nIDogJ25vIGZpbGFtZW50JyB9fTxzcGFuXG4gICAgICAgICAgdi1pZj1cInNlbnNvci5yb2xlID09PSAndW5rbm93bidcIlxuICAgICAgICAgIGNsYXNzPVwiY3Jvd19fc3ViXCJcbiAgICAgICAgPiDCtyBzZXR0aW5ncyBub3QgbG9hZGVkPC9zcGFuPjwvc3Bhbj5cbiAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICA6dmFsdWU9XCJzZW5zb3IuZW5hYmxlZFwiXG4gICAgICAgICAgOmxhYmVsPVwiYCR7c2Vuc29yLnByZXR0eU5hbWV9IG9uYFwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeSB8fCAoc2Vuc29yLmVuYWJsZWQgJiYgc2Vuc29yLnJvbGUgIT09ICdydW5vdXQnKVwiXG4gICAgICAgICAgQGlucHV0PVwic2V0UnVub3V0KHNlbnNvci5uYW1lLCAkZXZlbnQpXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgIHYtaWY9XCJoYXNTZW5zb3JzXCJcbiAgICAgICAgY2xhc3M9XCJmc2VjX19zZW5zb3JzXCJcbiAgICAgICAgOnRvPVwic2Vuc29yc0xpbmtcIlxuICAgICAgICBkYXRhLXRpZD1cImZpbGFtZW50LXNlbnNvcnMtbGlua1wiXG4gICAgICA+XG4gICAgICAgIEZpbGFtZW50IHNlbnNvcnMgaW4gSGVhbHRoIOKAulxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDxzbG90IC8+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBGaWxhbWVudEFjdGlvbnNNaXhpbiBmcm9tICdAL21peGlucy9maWxhbWVudC1hY3Rpb25zJ1xuaW1wb3J0IE1hdGVyaWFsUGlja2VyIGZyb20gJ0AvY29tcG9uZW50cy9vdmVydmlldy9NYXRlcmlhbFBpY2tlci52dWUnXG5pbXBvcnQgVG9nZ2xlU3dpdGNoIGZyb20gJy4vVG9nZ2xlU3dpdGNoLnZ1ZSdcbmltcG9ydCB7IGZpbGFtZW50U2Vuc29yUm9sZSwgc2Vuc29yQ29tbWFuZCwgdHlwZSBGaWxhbWVudFNlbnNvclJvbGUgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvbW9kZWwnXG5pbXBvcnQgeyBmaWxhbWVudFZpZXcsIGlua0ZvciwgdHlwZSBGaWxhbWVudFZpZXcgfSBmcm9tICdAL3NlcnZpY2VzL292ZXJ2aWV3L3RpbGVzJ1xuaW1wb3J0IHsgc2Vuc29yc1BhdGggfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvc2Vuc29ycy1saW5rJ1xuaW1wb3J0IHR5cGUgeyBSdW5vdXRTZW5zb3IgfSBmcm9tICdAL3N0b3JlL3ByaW50ZXIvdHlwZXMnXG5cbi8qKlxuICogVGhlIG9uZSBmaWxhbWVudCBzZWN0aW9uLCBvbiBPdmVydmlldyBhbmQgQ29udHJvbCBhbGlrZSAoSmFjaywgNiBOb3YgMjAyNjpcbiAqIFwidGhlIHNhbWUgY29tcG9uZW50LCBpbiBwYXJpdHlcIik6IHdoYXQgaXMgbG9hZGVkIGFzIGEgcmluZyBhbmQgaXRzIG5hbWUsXG4gKiB3aGljaCBvcGVucyB0aGUgbWF0ZXJpYWwgcGFuZWwgKE1hdGVyaWFsUGlja2VyKSwgQ2hhbmdlIGZpbGFtZW50LCBMb2FkIGFuZFxuICogVW5sb2FkIHRocm91Z2ggdGhlIEtBTi0xNzAwIHBsYW5zLCBhbmQgdGhlIGZpbGFtZW50IHNlbnNvcnMuIENvbnRyb2wgcHV0c1xuICogRXh0cnVkZSBieSBoYW5kIGluIHRoZSBkZWZhdWx0IHNsb3Q7IG5vdGhpbmcgZWxzZSBkaWZmZXJzLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNYXRlcmlhbFBpY2tlciwgVG9nZ2xlU3dpdGNoIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGFtZW50U2VjdGlvbiBleHRlbmRzIE1peGlucyhGaWxhbWVudEFjdGlvbnNNaXhpbikge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgcGhvbmU/OiBib29sZWFuXG4gIC8qKiBPbmx5IHRoZSByaW5nIGFuZCBpdHMgbmFtZSAoT3ZlcnZpZXcncyBzbWFsbCB3aWRnZXQpLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgY29tcGFjdD86IGJvb2xlYW5cbiAgLyoqIFB1dCBiZWZvcmUgdGhlIGJ1dHRvbnMnIGRhdGEtdGlkLCBzbyBlYWNoIHBhZ2Uga2VlcHMgaXRzIG93biAoYG92ZXJ2aWV3LWApLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSkgcmVhZG9ubHkgdGlkUHJlZml4ITogc3RyaW5nXG5cbiAgZ2V0IHZpZXcgKCk6IEZpbGFtZW50VmlldyB7XG4gICAgLy8gV2hhdCBzb21lb25lIHNhaWQgaXMgbG9hZGVkIGNvbWVzIGZpcnN0OyB0aGUgYWN0aXZlIFNwb29sbWFuIHNwb29sIHN0YW5kcyBpbiB3aGVuIG5vYm9keSBoYXMuXG4gICAgY29uc3QgbG9hZGVkID0gdGhpcy5sb2FkZWRNYXRlcmlhbCA/IHsgbmFtZTogdGhpcy5sb2FkZWRNYXRlcmlhbC5uYW1lLCBjb2xvdXI6IHRoaXMubG9hZGVkQ29sb3VyIH0gOiBudWxsXG4gICAgY29uc3Qgc3Bvb2wgPSBsb2FkZWQgPyBudWxsIDogdGhpcy4kc3RvcmUuZ2V0dGVyc1snc3Bvb2xtYW4vZ2V0QWN0aXZlU3Bvb2wnXVxuICAgIGNvbnN0IHZpZXcgPSBmaWxhbWVudFZpZXcoc3Bvb2wsIGxvYWRlZCwgdGhpcy5wcmludGluZ1dpdGgpXG4gICAgLy8gVGhlIHNlbnNvciBjYW4gc2VlIGZpbGFtZW50IHRoYXQgbm9ib2R5IGhhcyBuYW1lZCB5ZXQuXG4gICAgaWYgKHZpZXcuc291cmNlID09PSAnbm9uZScgJiYgdGhpcy5maWxhbWVudFNlbnNlZCkgcmV0dXJuIHsgLi4udmlldywgdHlwZTogJ0ZpbGFtZW50IGxvYWRlZCcsIGRldGFpbDogJ1ByZXNzIHRvIHNheSB3aGljaCBtYXRlcmlhbCcgfVxuICAgIGlmICh2aWV3LnNvdXJjZSA9PT0gJ25vbmUnKSByZXR1cm4geyAuLi52aWV3LCBkZXRhaWw6ICdQcmVzcyB0byBzZXQgdGhlIG1hdGVyaWFsIGFuZCBjb2xvdXInIH1cbiAgICByZXR1cm4gdmlld1xuICB9XG5cbiAgLyoqIE5vdGhpbmcgaXMgbG9hZGVkOiB0aGUgb25lIHBsYWNlIHRvIHdhcm4sIGluIHRoZSBvbmUgcGhyYXNlLiAqL1xuICBnZXQgbm9NYXRlcmlhbCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMudmlldy5zb3VyY2UgPT09ICdub25lJyAmJiAhdGhpcy5maWxhbWVudFNlbnNlZFxuICB9XG5cbiAgZ2V0IGluayAoKTogc3RyaW5nIHsgcmV0dXJuIGlua0Zvcih0aGlzLnZpZXcuY29sb3VyKSB9XG5cbiAgZ2V0IHNlbnNvcnMgKCk6IEFycmF5PFJ1bm91dFNlbnNvciAmIHsgcHJldHR5TmFtZTogc3RyaW5nLCByb2xlOiBGaWxhbWVudFNlbnNvclJvbGUgfT4ge1xuICAgIHJldHVybiAoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UnVub3V0U2Vuc29ycyddIGFzIEFycmF5PFJ1bm91dFNlbnNvciAmIHsgcHJldHR5TmFtZTogc3RyaW5nIH0+KSA/PyBbXSlcbiAgICAgIC5tYXAoc2Vuc29yID0+ICh7IC4uLnNlbnNvciwgcm9sZTogZmlsYW1lbnRTZW5zb3JSb2xlKHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5jb25maWdmaWxlLCBzZW5zb3IubmFtZSkgfSkpXG4gIH1cblxuICBnZXQgaGFzU2Vuc29ycyAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnNlbnNvcnMubGVuZ3RoID4gMCB9XG4gIGdldCBsb2FkZXJzICgpOiBSdW5vdXRTZW5zb3JbXSB7IHJldHVybiB0aGlzLnNlbnNvcnMuZmlsdGVyKHMgPT4gcy5yb2xlID09PSAnbG9hZHMnKSB9XG4gIGdldCBtYW51YWxTZW5zb3JzICgpOiBBcnJheTxSdW5vdXRTZW5zb3IgJiB7IHByZXR0eU5hbWU6IHN0cmluZywgcm9sZTogRmlsYW1lbnRTZW5zb3JSb2xlIH0+IHsgcmV0dXJuIHRoaXMuc2Vuc29ycy5maWx0ZXIocyA9PiBzLnJvbGUgIT09ICdsb2FkcycpIH1cbiAgZ2V0IHNlbnNvcnNMaW5rICgpIHsgcmV0dXJuIHNlbnNvcnNQYXRoKCkgfVxuXG4gIHNldFJ1bm91dCAobmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuXG4gICAgY29uc3QgY29tbWFuZCA9IHNlbnNvckNvbW1hbmQobmFtZSwgZW5hYmxlZCwgdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGUpXG4gICAgaWYgKGNvbW1hbmQpIHRoaXMuc2VuZEdjb2RlKGNvbW1hbmQpXG4gIH1cblxuICAvKipcbiAgICogTWlkLXByaW50OiBNNjAwLCB3aGljaCBwYXVzZXMgdGhlIHByaW50LCBhZnRlciBpdHMgY29uZmlybS4gSWRsZTogb3BlblxuICAgKiB0aGUgbWF0ZXJpYWwgcGFuZWwgYW5kIHNlbmQgbm90aGluZyAoS0FOLTE3MDApLlxuICAgKi9cbiAgYXN5bmMgY2hhbmdlRmlsYW1lbnQgKCkge1xuICAgIGlmICh0aGlzLmNoYW5nZVBsYW4ua2luZCA9PT0gJ3BhbmVsJykge1xuICAgICAgdGhpcy5vcGVuUGFuZWwoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGF3YWl0IHRoaXMucnVuRmlsYW1lbnRQbGFuKCdjaGFuZ2UnKVxuICB9XG5cbiAgb3BlblBhbmVsICgpIHtcbiAgICBjb25zdCBwaWNrZXIgPSB0aGlzLiRyZWZzLnBpY2tlciBhcyB1bmtub3duIGFzIHsgb3BlbjogYm9vbGVhbiB9IHwgdW5kZWZpbmVkXG4gICAgaWYgKHBpY2tlcikgdGhpcy4kbmV4dFRpY2soKCkgPT4geyBwaWNrZXIub3BlbiA9IHRydWUgfSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuLmZzZWMgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDEwcHg7IG1pbi13aWR0aDogMDsgfVxuLmZzZWNfX3JvdyB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogMTRweDsgd2lkdGg6IDEwMCU7IHBhZGRpbmc6IDA7IGNvbG9yOiBpbmhlcml0OyBmb250OiBpbmhlcml0OyB0ZXh0LWFsaWduOiBsZWZ0OyBjdXJzb3I6IHBvaW50ZXI7IH1cbi5mc2VjX19yb3c6ZGlzYWJsZWQgeyBjdXJzb3I6IGRlZmF1bHQ7IH1cbi5mc2VjX19zcG9vbCB7IGRpc3BsYXk6IGlubGluZS1mbGV4OyBmbGV4OiBub25lOyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgd2lkdGg6IDQ2cHg7IGhlaWdodDogNDZweDsgYm9yZGVyLXJhZGl1czogNTAlOyBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggcmdiKDEyOCAxMjggMTI4IC8gNDUlKTsgfVxuLmZzZWMtLWNvbXBhY3QgLmZzZWNfX3Nwb29sIHsgd2lkdGg6IDM2cHg7IGhlaWdodDogMzZweDsgfVxuLmZzZWNfX3Nwb29sLS1ub25lIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyB9XG4uZnNlY19fc3Bvb2wgLmZyYW1lLWljb24geyBjb2xvcjogaW5oZXJpdDsgfVxuLmZzZWNfX3Nwb29sIHN2ZyB7IHdpZHRoOiAyOHB4OyBoZWlnaHQ6IDI4cHg7IH1cbi5mc2VjX190ZXh0IHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgbWluLXdpZHRoOiAwOyBsaW5lLWhlaWdodDogMS4yNTsgfVxuLmZzZWNfX3RleHQgYiB7IGZvbnQtc2l6ZTogMTZweDsgZm9udC13ZWlnaHQ6IDYwMDsgfVxuLmZzZWNfX3dhcm4geyBtYXJnaW4tcmlnaHQ6IDZweDsgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKSAhaW1wb3J0YW50OyB9XG4uZnNlY19fdGV4dCBzcGFuIHsgb3ZlcmZsb3c6IGhpZGRlbjsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgZm9udC1zaXplOiAxMi41cHg7IHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XG4vKiBDaGFuZ2UgZmlsYW1lbnQgYWNyb3NzIHRoZSB0b3A7IExvYWQgYW5kIFVubG9hZCBzaWRlIGJ5IHNpZGUsIHRoZSBzYW1lIHdpZHRoLCBpbnNpZGUgdGhlIGJveCAoRk0tMDIvMDMpLiAqL1xuLmZzZWNfX2J1dHRvbnMgeyBkaXNwbGF5OiBncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCBtaW5tYXgoMCwgMWZyKSk7IGdhcDogNnB4OyB9XG4uZnNlY19fYnV0dG9ucyAuY2J0biB7IHdpZHRoOiAxMDAlOyB9XG4uZnNlY19fYnV0dG9ucyAuY2J0bi0tcHJpbWFyeSB7IGdyaWQtY29sdW1uOiAxIC8gLTE7IH1cbi5mc2VjLS1waG9uZSAuZnNlY19fYnV0dG9ucyAuY2J0biB7IGhlaWdodDogNDhweDsgfVxuLmZzZWNfX2xvYWRlciB7IG1hcmdpbjogMDsgZm9udC1zaXplOiAxM3B4OyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyB9XG4uZnNlY19fc2Vuc29ycyB7IGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCkgIWltcG9ydGFudDsgZm9udC1zaXplOiAxM3B4OyBmb250LXdlaWdodDogNjAwOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IH1cbi5mc2VjX19zZW5zb3JzOmhvdmVyIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0KSAhaW1wb3J0YW50OyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9GaWxhbWVudFNlY3Rpb24udnVlIn0=