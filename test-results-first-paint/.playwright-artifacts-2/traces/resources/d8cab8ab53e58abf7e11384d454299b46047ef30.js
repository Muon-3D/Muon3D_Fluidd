/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import FilamentActionsMixin from "/src/mixins/filament-actions.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import ControlTaskFold from "/src/components/control/ControlTaskFold.vue";
import FilamentSection from "/src/components/control/FilamentSection.vue";
import NumberField from "/src/components/control/NumberField.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import { extrudeBlocked, extrudeLengths, hotendLimitReason } from "/src/services/control/model.ts";
import { extrudeTemperature } from "/src/util/temperature-preset.ts";
let ControlFilament = class extends Mixins(FilamentActionsMixin) {
  phone;
  lengthDraft = null;
  speedDraft = null;
  heatDraft = null;
  extrusionTarget = "";
  created() {
    this.resetExtrusion();
  }
  resetExtrusion() {
    this.lengthDraft = null;
    this.speedDraft = null;
    this.heatDraft = null;
    this.extrusionTarget = this.panelTarget;
  }
  get length() {
    return this.lengthDraft ?? (this.$store.state.config.uiSettings.general.defaultExtrudeLength || 10);
  }
  set length(value) {
    this.lengthDraft = value;
  }
  get speed() {
    return this.speedDraft ?? (this.$store.state.config.uiSettings.general.defaultExtrudeSpeed || 5);
  }
  set speed(value) {
    this.speedDraft = value;
  }
  get ready() {
    return this.controlReady;
  }
  extrude(direction) {
    if (this.extrusionTarget !== this.panelTarget || !this.canExtrude || !Number.isFinite(this.length) || this.length <= 0 || this.length > this.maxExtrudeLength || !Number.isFinite(this.speed) || this.speed < 0.1 || this.speed > this.maxExtrudeSpeed) return;
    this.sendExtrudeGcode(direction * this.length, this.speed);
  }
  get lengthOptions() {
    return extrudeLengths(this.maxExtrudeLength).map((v, i, all) => ({ value: v, label: i === all.length - 1 ? `${v} mm` : String(v) }));
  }
  /** The length chosen, kept within max_extrude_only_distance, which Klipper refuses past. */
  get extrudeLength() {
    return Math.min(this.length, this.maxExtrudeLength);
  }
  get minExtrude() {
    return Math.round(this.activeExtruder?.min_extrude_temp ?? 170);
  }
  /** What Heat sets the nozzle to, before anyone changes it: the loaded material's, else the printer's default. */
  get heatChoice() {
    return extrudeTemperature(this.presets, this.loadedMaterial?.name ?? null, { min: this.minExtrude, max: this.heatMax });
  }
  get heatMax() {
    return Math.round(this.nozzle?.maxTemp || this.extruderMaxTemp || 300);
  }
  get heatTemp() {
    return this.heatDraft ?? this.heatChoice.temp;
  }
  get heatNote() {
    const n = this.nozzle;
    if (n && n.target >= this.minExtrude && n.temperature < this.minExtrude) return `heating to ${Math.round(n.target)}\xB0 \xB7 now ${Math.round(n.temperature)}\xB0`;
    if (this.heatDraft !== null) return "your temperature";
    return this.heatChoice.material ? `for ${this.heatChoice.material}` : "";
  }
  /** Why Heat can't be pressed now, if it can't. */
  get heatBlocked() {
    if (!this.ready || !this.nozzle) return "Not connected to the printer";
    if (this.busy) return this.printLocked ? "Not while printing" : "The printer is busy";
    const temp = this.heatTemp;
    if (!Number.isFinite(temp) || temp < this.minExtrude) return `Extruding needs at least ${this.minExtrude}\xB0`;
    return hotendLimitReason(this.heatChoice.material ?? void 0, temp, this.extruderMaxTemp);
  }
  get canHeat() {
    return !this.heatBlocked;
  }
  /** A heater target only: the nozzle heats, nothing moves and nothing is extruded. */
  heatForExtrude() {
    if (this.extrusionTarget !== this.panelTarget || !this.canHeat) return;
    this.setHeater(this.nozzle, this.heatTemp);
  }
  get extrudeReason() {
    if (!this.ready) return null;
    if (this.busy) return this.printLocked ? "Not while printing" : "The printer is busy";
    const temperature = this.activeExtruder?.temperature ?? 0;
    const canExtrude = this.activeExtruder?.can_extrude;
    if (canExtrude === false && temperature >= this.minExtrude) return "Klipper isn't allowing extrusion yet. Wait a moment for the nozzle to settle.";
    return extrudeBlocked(temperature, this.minExtrude, canExtrude === true);
  }
  get canExtrude() {
    return this.ready && !this.extrudeReason;
  }
  get lockReason() {
    return this.controlLock;
  }
  get note() {
    return this.changeMacro ? "Guided: it heats the nozzle for you, tells you when to pull and push, then purges." : "Load and unload heat the nozzle for you first.";
  }
  get section() {
    return this.$refs.section;
  }
  /** As the section's: idle, the material panel; mid-print, M600 after its confirm. */
  async changeFilament() {
    if (this.changePlan.kind === "panel") {
      this.openPanel();
      return;
    }
    await this.runFilamentPlan("change");
  }
  openPanel() {
    this.section?.openPanel();
  }
  onFilamentQuery(value) {
    if (value !== "open") return;
    this.$nextTick(() => {
      this.openPanel();
      const query = { ...this.$route.query };
      delete query.filament;
      this.$router.replace({ path: this.$route.path, query }).catch(() => {
      });
    });
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlFilament.prototype, "phone", 2);
__decorateClass([
  Watch("panelTarget")
], ControlFilament.prototype, "resetExtrusion", 1);
__decorateClass([
  Watch("$route.query.filament", { immediate: true })
], ControlFilament.prototype, "onFilamentQuery", 1);
ControlFilament = __decorateClass([
  Component({ components: { ControlCard, ControlTaskFold, FilamentSection, NumberField, SegPicker } })
], ControlFilament);
const _sfc_main = ControlFilament;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": "Filament", "icon": "spool", "locked": _vm.lockReason, "note": _vm.lockReason ? "" : _vm.note, "data-tid": "control-filament" } }, [_c("filament-section", { ref: "section", attrs: { "phone": _vm.phone } }, [_vm.hasExtruder ? _c("control-task-fold", { attrs: { "fold-key": "filament.extrude", "title": "Extrude by hand", "summary": `${_vm.length} mm at ${_vm.speed} mm/s` } }, [_c("div", { staticClass: "heat__extruder" }, [_c("div", { staticClass: "crow heat__for-extrude", attrs: { "data-tid": "extrude-heat-row" } }, [_c("span", { staticClass: "crow__name" }, [_vm._v("Heat for extruding "), _c("span", { staticClass: "crow__sub", attrs: { "data-tid": "extrude-heat-note" } }, [_vm._v(_vm._s(_vm.heatNote))])]), _c("number-field", { key: `heat-${_vm.panelTarget}`, attrs: { "value": _vm.heatTemp, "unit": "\xB0C", "min": _vm.minExtrude, "max": _vm.heatMax, "label": "Extrude temperature", "disabled": !_vm.controlReady }, on: { "change": function($event) {
    _vm.heatDraft = $event;
  } } }), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.canHeat, "title": _vm.heatBlocked || "", "data-tid": "extrude-heat" }, on: { "click": _vm.heatForExtrude } }, [_vm._v(" Heat ")])], 1), _c("div", { staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v("Length")]), _c("seg-picker", { attrs: { "options": _vm.lengthOptions, "value": _vm.length, "label": "Length" }, on: { "input": function($event) {
    _vm.length = $event;
  } } })], 1), _c("div", { staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v("Speed")]), _c("number-field", { attrs: { "value": _vm.speed, "unit": "mm/s", "min": 0.1, "max": _vm.maxExtrudeSpeed, "decimals": _vm.speed % 1 ? 1 : 0, "label": "Extrude speed" }, on: { "change": function($event) {
    _vm.speed = $event;
  } } })], 1), _c("div", { staticClass: "heat__extrude-buttons" }, [_c("button", { staticClass: "cbtn cbtn--grow", attrs: { "type": "button", "disabled": !_vm.canExtrude, "data-tid": "retract" }, on: { "click": function($event) {
    return _vm.extrude(-1);
  } } }, [_vm._v(" Retract ")]), _c("button", { staticClass: "cbtn cbtn--grow", attrs: { "type": "button", "disabled": !_vm.canExtrude, "data-tid": "extrude" }, on: { "click": function($event) {
    return _vm.extrude(1);
  } } }, [_vm._v(" Extrude ")])]), _vm.extrudeReason ? _c("p", { staticClass: "heat__reason", attrs: { "data-tid": "extrude-reason" } }, [_c(__unplugin_components_0, { attrs: { "name": "lock", "small": "" } }), _vm._v(" " + _vm._s(_vm.extrudeReason) + " ")], 1) : _vm._e()])]) : _vm._e()], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlFilament.vue?vue&type=style&index=0&scoped=e50741e7&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e50741e7",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlFilament.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUEyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBV0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBLHFLQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0EsOEJBQ0EsdUZBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTdIQTtBQUFBLEVBREE7QUFBQSxHQURBLGdCQUVBO0FBU0E7QUFBQSxFQURBO0FBQUEsR0FWQSxnQkFXQTtBQTJHQTtBQUFBLEVBREE7QUFBQSxHQXJIQSxnQkFzSEE7QUF0SEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29udHJvbEZpbGFtZW50LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxjb250cm9sLWNhcmRcbiAgICB0aXRsZT1cIkZpbGFtZW50XCJcbiAgICBpY29uPVwic3Bvb2xcIlxuICAgIDpsb2NrZWQ9XCJsb2NrUmVhc29uXCJcbiAgICA6bm90ZT1cImxvY2tSZWFzb24gPyAnJyA6IG5vdGVcIlxuICAgIGRhdGEtdGlkPVwiY29udHJvbC1maWxhbWVudFwiXG4gID5cbiAgICA8ZmlsYW1lbnQtc2VjdGlvblxuICAgICAgcmVmPVwic2VjdGlvblwiXG4gICAgICA6cGhvbmU9XCJwaG9uZVwiXG4gICAgPlxuICAgICAgPGNvbnRyb2wtdGFzay1mb2xkXG4gICAgICAgIHYtaWY9XCJoYXNFeHRydWRlclwiXG4gICAgICAgIGZvbGQta2V5PVwiZmlsYW1lbnQuZXh0cnVkZVwiXG4gICAgICAgIHRpdGxlPVwiRXh0cnVkZSBieSBoYW5kXCJcbiAgICAgICAgOnN1bW1hcnk9XCJgJHtsZW5ndGh9IG1tIGF0ICR7c3BlZWR9IG1tL3NgXCJcbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzcz1cImhlYXRfX2V4dHJ1ZGVyXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3M9XCJjcm93IGhlYXRfX2Zvci1leHRydWRlXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwiZXh0cnVkZS1oZWF0LXJvd1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjcm93X19uYW1lXCI+SGVhdCBmb3IgZXh0cnVkaW5nIDxzcGFuXG4gICAgICAgICAgICAgIGNsYXNzPVwiY3Jvd19fc3ViXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJleHRydWRlLWhlYXQtbm90ZVwiXG4gICAgICAgICAgICA+e3sgaGVhdE5vdGUgfX08L3NwYW4+PC9zcGFuPlxuICAgICAgICAgICAgPG51bWJlci1maWVsZFxuICAgICAgICAgICAgICA6a2V5PVwiYGhlYXQtJHtwYW5lbFRhcmdldH1gXCJcbiAgICAgICAgICAgICAgOnZhbHVlPVwiaGVhdFRlbXBcIlxuICAgICAgICAgICAgICB1bml0PVwiwrBDXCJcbiAgICAgICAgICAgICAgOm1pbj1cIm1pbkV4dHJ1ZGVcIlxuICAgICAgICAgICAgICA6bWF4PVwiaGVhdE1heFwiXG4gICAgICAgICAgICAgIGxhYmVsPVwiRXh0cnVkZSB0ZW1wZXJhdHVyZVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgICAgICBAY2hhbmdlPVwiaGVhdERyYWZ0ID0gJGV2ZW50XCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5IZWF0XCJcbiAgICAgICAgICAgICAgOnRpdGxlPVwiaGVhdEJsb2NrZWQgfHwgJydcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImV4dHJ1ZGUtaGVhdFwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImhlYXRGb3JFeHRydWRlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgSGVhdFxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNyb3dcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY3Jvd19fbmFtZVwiPkxlbmd0aDwvc3Bhbj5cbiAgICAgICAgICAgIDxzZWctcGlja2VyXG4gICAgICAgICAgICAgIDpvcHRpb25zPVwibGVuZ3RoT3B0aW9uc1wiXG4gICAgICAgICAgICAgIDp2YWx1ZT1cImxlbmd0aFwiXG4gICAgICAgICAgICAgIGxhYmVsPVwiTGVuZ3RoXCJcbiAgICAgICAgICAgICAgQGlucHV0PVwibGVuZ3RoID0gJGV2ZW50XCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNyb3dcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY3Jvd19fbmFtZVwiPlNwZWVkPC9zcGFuPlxuICAgICAgICAgICAgPG51bWJlci1maWVsZFxuICAgICAgICAgICAgICA6dmFsdWU9XCJzcGVlZFwiXG4gICAgICAgICAgICAgIHVuaXQ9XCJtbS9zXCJcbiAgICAgICAgICAgICAgOm1pbj1cIjAuMVwiXG4gICAgICAgICAgICAgIDptYXg9XCJtYXhFeHRydWRlU3BlZWRcIlxuICAgICAgICAgICAgICA6ZGVjaW1hbHM9XCJzcGVlZCAlIDEgPyAxIDogMFwiXG4gICAgICAgICAgICAgIGxhYmVsPVwiRXh0cnVkZSBzcGVlZFwiXG4gICAgICAgICAgICAgIEBjaGFuZ2U9XCJzcGVlZCA9ICRldmVudFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWF0X19leHRydWRlLWJ1dHRvbnNcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1ncm93XCJcbiAgICAgICAgICAgICAgOmRpc2FibGVkPVwiIWNhbkV4dHJ1ZGVcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInJldHJhY3RcIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJleHRydWRlKC0xKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIFJldHJhY3RcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdyb3dcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY2FuRXh0cnVkZVwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwiZXh0cnVkZVwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImV4dHJ1ZGUoMSlcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICBFeHRydWRlXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8cFxuICAgICAgICAgICAgdi1pZj1cImV4dHJ1ZGVSZWFzb25cIlxuICAgICAgICAgICAgY2xhc3M9XCJoZWF0X19yZWFzb25cIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJleHRydWRlLXJlYXNvblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgbmFtZT1cImxvY2tcIlxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIHt7IGV4dHJ1ZGVSZWFzb24gfX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb250cm9sLXRhc2stZm9sZD5cbiAgICA8L2ZpbGFtZW50LXNlY3Rpb24+XG4gIDwvY29udHJvbC1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgRmlsYW1lbnRBY3Rpb25zTWl4aW4gZnJvbSAnQC9taXhpbnMvZmlsYW1lbnQtYWN0aW9ucydcbmltcG9ydCBDb250cm9sQ2FyZCBmcm9tICcuL0NvbnRyb2xDYXJkLnZ1ZSdcbmltcG9ydCBDb250cm9sVGFza0ZvbGQgZnJvbSAnLi9Db250cm9sVGFza0ZvbGQudnVlJ1xuaW1wb3J0IEZpbGFtZW50U2VjdGlvbiBmcm9tICcuL0ZpbGFtZW50U2VjdGlvbi52dWUnXG5pbXBvcnQgTnVtYmVyRmllbGQgZnJvbSAnLi9OdW1iZXJGaWVsZC52dWUnXG5pbXBvcnQgU2VnUGlja2VyLCB7IHR5cGUgU2VnT3B0aW9uIH0gZnJvbSAnLi9TZWdQaWNrZXIudnVlJ1xuaW1wb3J0IHsgZXh0cnVkZUJsb2NrZWQsIGV4dHJ1ZGVMZW5ndGhzLCBob3RlbmRMaW1pdFJlYXNvbiB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9tb2RlbCdcbmltcG9ydCB7IGV4dHJ1ZGVUZW1wZXJhdHVyZSwgdHlwZSBFeHRydWRlVGVtcGVyYXR1cmUgfSBmcm9tICdAL3V0aWwvdGVtcGVyYXR1cmUtcHJlc2V0J1xuXG4vKipcbiAqIEZpbGFtZW50IG9uIENvbnRyb2w6IHRoZSBvbmUgZmlsYW1lbnQgc2VjdGlvbiBPdmVydmlldyBoYXMgdG9vXG4gKiAoRmlsYW1lbnRTZWN0aW9uOiB0aGUgbWF0ZXJpYWwgcGFuZWwsIENoYW5nZSBmaWxhbWVudCwgTG9hZCwgVW5sb2FkIGFuZFxuICogdGhlIHNlbnNvcnMpLCBwbHVzIEV4dHJ1ZGUgYnkgaGFuZC4gRXh0cnVkZSBieSBoYW5kIGhlYXRzIGZvciB5b3U6IGl0c1xuICogSGVhdCBidXR0b24gc2V0cyB0aGUgbm96emxlIHRvIHRoZSBsb2FkZWQgbWF0ZXJpYWwncyB0ZW1wZXJhdHVyZSAob3IgdGhlXG4gKiBwcmludGVyJ3MgZGVmYXVsdCBtYXRlcmlhbCdzKSwgd2hpY2ggY2FuIGJlIGNoYW5nZWQgZmlyc3QuIEl0IGlzIG9ubHkgYVxuICogaGVhdGVyIHRhcmdldDsgaXQgbmV2ZXIgZXh0cnVkZXMuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENvbnRyb2xDYXJkLCBDb250cm9sVGFza0ZvbGQsIEZpbGFtZW50U2VjdGlvbiwgTnVtYmVyRmllbGQsIFNlZ1BpY2tlciB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sRmlsYW1lbnQgZXh0ZW5kcyBNaXhpbnMoRmlsYW1lbnRBY3Rpb25zTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHBob25lPzogYm9vbGVhblxuXG4gIGxlbmd0aERyYWZ0OiBudW1iZXIgfCBudWxsID0gbnVsbFxuICBzcGVlZERyYWZ0OiBudW1iZXIgfCBudWxsID0gbnVsbFxuICBoZWF0RHJhZnQ6IG51bWJlciB8IG51bGwgPSBudWxsXG4gIGV4dHJ1c2lvblRhcmdldCA9ICcnXG4gIGNyZWF0ZWQgKCkgeyB0aGlzLnJlc2V0RXh0cnVzaW9uKCkgfVxuXG4gIEBXYXRjaCgncGFuZWxUYXJnZXQnKVxuICByZXNldEV4dHJ1c2lvbiAoKSB7IHRoaXMubGVuZ3RoRHJhZnQgPSBudWxsOyB0aGlzLnNwZWVkRHJhZnQgPSBudWxsOyB0aGlzLmhlYXREcmFmdCA9IG51bGw7IHRoaXMuZXh0cnVzaW9uVGFyZ2V0ID0gdGhpcy5wYW5lbFRhcmdldCB9XG5cbiAgZ2V0IGxlbmd0aCAoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubGVuZ3RoRHJhZnQgPz8gKHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuZGVmYXVsdEV4dHJ1ZGVMZW5ndGggYXMgbnVtYmVyIHx8IDEwKSB9XG4gIHNldCBsZW5ndGggKHZhbHVlOiBudW1iZXIpIHsgdGhpcy5sZW5ndGhEcmFmdCA9IHZhbHVlIH1cbiAgZ2V0IHNwZWVkICgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5zcGVlZERyYWZ0ID8/ICh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmRlZmF1bHRFeHRydWRlU3BlZWQgYXMgbnVtYmVyIHx8IDUpIH1cbiAgc2V0IHNwZWVkICh2YWx1ZTogbnVtYmVyKSB7IHRoaXMuc3BlZWREcmFmdCA9IHZhbHVlIH1cblxuICBnZXQgcmVhZHkgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgfVxuXG4gIGV4dHJ1ZGUgKGRpcmVjdGlvbjogMSB8IC0xKSB7XG4gICAgaWYgKHRoaXMuZXh0cnVzaW9uVGFyZ2V0ICE9PSB0aGlzLnBhbmVsVGFyZ2V0IHx8ICF0aGlzLmNhbkV4dHJ1ZGUgfHwgIU51bWJlci5pc0Zpbml0ZSh0aGlzLmxlbmd0aCkgfHwgdGhpcy5sZW5ndGggPD0gMCB8fCB0aGlzLmxlbmd0aCA+IHRoaXMubWF4RXh0cnVkZUxlbmd0aCB8fFxuICAgICAgIU51bWJlci5pc0Zpbml0ZSh0aGlzLnNwZWVkKSB8fCB0aGlzLnNwZWVkIDwgMC4xIHx8IHRoaXMuc3BlZWQgPiB0aGlzLm1heEV4dHJ1ZGVTcGVlZCkgcmV0dXJuXG4gICAgdGhpcy5zZW5kRXh0cnVkZUdjb2RlKGRpcmVjdGlvbiAqIHRoaXMubGVuZ3RoLCB0aGlzLnNwZWVkKVxuICB9XG5cbiAgZ2V0IGxlbmd0aE9wdGlvbnMgKCk6IFNlZ09wdGlvbltdIHtcbiAgICByZXR1cm4gZXh0cnVkZUxlbmd0aHModGhpcy5tYXhFeHRydWRlTGVuZ3RoKS5tYXAoKHYsIGksIGFsbCkgPT4gKHsgdmFsdWU6IHYsIGxhYmVsOiBpID09PSBhbGwubGVuZ3RoIC0gMSA/IGAke3Z9IG1tYCA6IFN0cmluZyh2KSB9KSlcbiAgfVxuXG4gIC8qKiBUaGUgbGVuZ3RoIGNob3Nlbiwga2VwdCB3aXRoaW4gbWF4X2V4dHJ1ZGVfb25seV9kaXN0YW5jZSwgd2hpY2ggS2xpcHBlciByZWZ1c2VzIHBhc3QuICovXG4gIGdldCBleHRydWRlTGVuZ3RoICgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1pbih0aGlzLmxlbmd0aCwgdGhpcy5tYXhFeHRydWRlTGVuZ3RoKVxuICB9XG5cbiAgZ2V0IG1pbkV4dHJ1ZGUgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5hY3RpdmVFeHRydWRlcj8ubWluX2V4dHJ1ZGVfdGVtcCA/PyAxNzApXG4gIH1cblxuICAvKiogV2hhdCBIZWF0IHNldHMgdGhlIG5venpsZSB0bywgYmVmb3JlIGFueW9uZSBjaGFuZ2VzIGl0OiB0aGUgbG9hZGVkIG1hdGVyaWFsJ3MsIGVsc2UgdGhlIHByaW50ZXIncyBkZWZhdWx0LiAqL1xuICBnZXQgaGVhdENob2ljZSAoKTogRXh0cnVkZVRlbXBlcmF0dXJlIHtcbiAgICByZXR1cm4gZXh0cnVkZVRlbXBlcmF0dXJlKHRoaXMucHJlc2V0cywgdGhpcy5sb2FkZWRNYXRlcmlhbD8ubmFtZSA/PyBudWxsLCB7IG1pbjogdGhpcy5taW5FeHRydWRlLCBtYXg6IHRoaXMuaGVhdE1heCB9KVxuICB9XG5cbiAgZ2V0IGhlYXRNYXggKCk6IG51bWJlciB7IHJldHVybiBNYXRoLnJvdW5kKHRoaXMubm96emxlPy5tYXhUZW1wIHx8IHRoaXMuZXh0cnVkZXJNYXhUZW1wIHx8IDMwMCkgfVxuICBnZXQgaGVhdFRlbXAgKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmhlYXREcmFmdCA/PyB0aGlzLmhlYXRDaG9pY2UudGVtcCB9XG5cbiAgZ2V0IGhlYXROb3RlICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG4gPSB0aGlzLm5venpsZVxuICAgIGlmIChuICYmIG4udGFyZ2V0ID49IHRoaXMubWluRXh0cnVkZSAmJiBuLnRlbXBlcmF0dXJlIDwgdGhpcy5taW5FeHRydWRlKSByZXR1cm4gYGhlYXRpbmcgdG8gJHtNYXRoLnJvdW5kKG4udGFyZ2V0KX3CsCDCtyBub3cgJHtNYXRoLnJvdW5kKG4udGVtcGVyYXR1cmUpfcKwYFxuICAgIGlmICh0aGlzLmhlYXREcmFmdCAhPT0gbnVsbCkgcmV0dXJuICd5b3VyIHRlbXBlcmF0dXJlJ1xuICAgIHJldHVybiB0aGlzLmhlYXRDaG9pY2UubWF0ZXJpYWwgPyBgZm9yICR7dGhpcy5oZWF0Q2hvaWNlLm1hdGVyaWFsfWAgOiAnJ1xuICB9XG5cbiAgLyoqIFdoeSBIZWF0IGNhbid0IGJlIHByZXNzZWQgbm93LCBpZiBpdCBjYW4ndC4gKi9cbiAgZ2V0IGhlYXRCbG9ja2VkICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIXRoaXMucmVhZHkgfHwgIXRoaXMubm96emxlKSByZXR1cm4gJ05vdCBjb25uZWN0ZWQgdG8gdGhlIHByaW50ZXInXG4gICAgaWYgKHRoaXMuYnVzeSkgcmV0dXJuIHRoaXMucHJpbnRMb2NrZWQgPyAnTm90IHdoaWxlIHByaW50aW5nJyA6ICdUaGUgcHJpbnRlciBpcyBidXN5J1xuICAgIGNvbnN0IHRlbXAgPSB0aGlzLmhlYXRUZW1wXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodGVtcCkgfHwgdGVtcCA8IHRoaXMubWluRXh0cnVkZSkgcmV0dXJuIGBFeHRydWRpbmcgbmVlZHMgYXQgbGVhc3QgJHt0aGlzLm1pbkV4dHJ1ZGV9wrBgXG4gICAgcmV0dXJuIGhvdGVuZExpbWl0UmVhc29uKHRoaXMuaGVhdENob2ljZS5tYXRlcmlhbCA/PyB1bmRlZmluZWQsIHRlbXAsIHRoaXMuZXh0cnVkZXJNYXhUZW1wKVxuICB9XG5cbiAgZ2V0IGNhbkhlYXQgKCk6IGJvb2xlYW4geyByZXR1cm4gIXRoaXMuaGVhdEJsb2NrZWQgfVxuXG4gIC8qKiBBIGhlYXRlciB0YXJnZXQgb25seTogdGhlIG5venpsZSBoZWF0cywgbm90aGluZyBtb3ZlcyBhbmQgbm90aGluZyBpcyBleHRydWRlZC4gKi9cbiAgaGVhdEZvckV4dHJ1ZGUgKCkge1xuICAgIGlmICh0aGlzLmV4dHJ1c2lvblRhcmdldCAhPT0gdGhpcy5wYW5lbFRhcmdldCB8fCAhdGhpcy5jYW5IZWF0KSByZXR1cm5cbiAgICB0aGlzLnNldEhlYXRlcih0aGlzLm5venpsZSwgdGhpcy5oZWF0VGVtcClcbiAgfVxuXG4gIGdldCBleHRydWRlUmVhc29uICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIXRoaXMucmVhZHkpIHJldHVybiBudWxsXG4gICAgaWYgKHRoaXMuYnVzeSkgcmV0dXJuIHRoaXMucHJpbnRMb2NrZWQgPyAnTm90IHdoaWxlIHByaW50aW5nJyA6ICdUaGUgcHJpbnRlciBpcyBidXN5J1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gdGhpcy5hY3RpdmVFeHRydWRlcj8udGVtcGVyYXR1cmUgPz8gMFxuICAgIGNvbnN0IGNhbkV4dHJ1ZGUgPSB0aGlzLmFjdGl2ZUV4dHJ1ZGVyPy5jYW5fZXh0cnVkZVxuICAgIGlmIChjYW5FeHRydWRlID09PSBmYWxzZSAmJiB0ZW1wZXJhdHVyZSA+PSB0aGlzLm1pbkV4dHJ1ZGUpIHJldHVybiAnS2xpcHBlciBpc25cXCd0IGFsbG93aW5nIGV4dHJ1c2lvbiB5ZXQuIFdhaXQgYSBtb21lbnQgZm9yIHRoZSBub3p6bGUgdG8gc2V0dGxlLidcbiAgICByZXR1cm4gZXh0cnVkZUJsb2NrZWQodGVtcGVyYXR1cmUsIHRoaXMubWluRXh0cnVkZSwgY2FuRXh0cnVkZSA9PT0gdHJ1ZSlcbiAgfVxuXG4gIGdldCBjYW5FeHRydWRlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5yZWFkeSAmJiAhdGhpcy5leHRydWRlUmVhc29uXG4gIH1cblxuICBnZXQgbG9ja1JlYXNvbiAoKTogc3RyaW5nIHtcbiAgICAvLyBDaGFuZ2luZyBmaWxhbWVudCBtaWQtcHJpbnQgaXMgd2hhdCBNNjAwIGlzIGZvcjsgaXQgcGF1c2VzIHRoZSBwcmludC5cbiAgICByZXR1cm4gdGhpcy5jb250cm9sTG9ja1xuICB9XG5cbiAgZ2V0IG5vdGUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlTWFjcm9cbiAgICAgID8gJ0d1aWRlZDogaXQgaGVhdHMgdGhlIG5venpsZSBmb3IgeW91LCB0ZWxscyB5b3Ugd2hlbiB0byBwdWxsIGFuZCBwdXNoLCB0aGVuIHB1cmdlcy4nXG4gICAgICA6ICdMb2FkIGFuZCB1bmxvYWQgaGVhdCB0aGUgbm96emxlIGZvciB5b3UgZmlyc3QuJ1xuICB9XG5cbiAgZ2V0IHNlY3Rpb24gKCk6IEZpbGFtZW50U2VjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuJHJlZnMuc2VjdGlvbiBhcyBGaWxhbWVudFNlY3Rpb24gfCB1bmRlZmluZWRcbiAgfVxuXG4gIC8qKiBBcyB0aGUgc2VjdGlvbidzOiBpZGxlLCB0aGUgbWF0ZXJpYWwgcGFuZWw7IG1pZC1wcmludCwgTTYwMCBhZnRlciBpdHMgY29uZmlybS4gKi9cbiAgYXN5bmMgY2hhbmdlRmlsYW1lbnQgKCkge1xuICAgIGlmICh0aGlzLmNoYW5nZVBsYW4ua2luZCA9PT0gJ3BhbmVsJykge1xuICAgICAgdGhpcy5vcGVuUGFuZWwoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGF3YWl0IHRoaXMucnVuRmlsYW1lbnRQbGFuKCdjaGFuZ2UnKVxuICB9XG5cbiAgb3BlblBhbmVsICgpIHtcbiAgICB0aGlzLnNlY3Rpb24/Lm9wZW5QYW5lbCgpXG4gIH1cblxuICAvKipcbiAgICogUXVpY2sgYWN0aW9ucycgQ2hhbmdlIGZpbGFtZW50LCBpZGxlLCBjb21lcyBoZXJlIHdpdGggP2ZpbGFtZW50PW9wZW46XG4gICAqIG9uIGFycml2YWwsIG9yIHdoaWxlIGFscmVhZHkgaGVyZS4gVGhlIHF1ZXJ5IGlzIHRoZW4gZHJvcHBlZCwgc28gdGhlXG4gICAqIG5leHQgcHJlc3MgY2hhbmdlcyB0aGUgcm91dGUgYWdhaW4uXG4gICAqL1xuICBAV2F0Y2goJyRyb3V0ZS5xdWVyeS5maWxhbWVudCcsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIG9uRmlsYW1lbnRRdWVyeSAodmFsdWU6IHVua25vd24pIHtcbiAgICBpZiAodmFsdWUgIT09ICdvcGVuJykgcmV0dXJuXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgdGhpcy5vcGVuUGFuZWwoKVxuICAgICAgY29uc3QgcXVlcnkgPSB7IC4uLnRoaXMuJHJvdXRlLnF1ZXJ5IH1cbiAgICAgIGRlbGV0ZSBxdWVyeS5maWxhbWVudFxuICAgICAgdGhpcy4kcm91dGVyLnJlcGxhY2UoeyBwYXRoOiB0aGlzLiRyb3V0ZS5wYXRoLCBxdWVyeSB9KS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuaGVhdF9fZXh0cnVkZXIgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDhweDsgfVxuICAuaGVhdF9fcmVhc29uIHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA2cHg7IG1hcmdpbjogMDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IGZvbnQtc2l6ZTogMTJweDsgfVxuICAuaGVhdF9fZXh0cnVkZS1idXR0b25zIHsgZGlzcGxheTogZmxleDsgZ2FwOiA4cHg7IH1cbiAgLmhlYXRfX2Zvci1leHRydWRlIHsgZ2FwOiA4cHg7IH1cbiAgLmhlYXRfX2Zvci1leHRydWRlIC5jcm93X19zdWIgeyBkaXNwbGF5OiBibG9jazsgZm9udC1zaXplOiAxMXB4OyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sRmlsYW1lbnQudnVlIn0=