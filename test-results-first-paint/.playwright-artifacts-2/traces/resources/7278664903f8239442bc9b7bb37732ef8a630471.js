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
import {
  SHAPER_TYPES,
  configShaper,
  parseShaperReport,
  retractionCommand,
  shaperCommand
} from "/src/services/control/model.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import NumberField from "/src/components/control/NumberField.vue";
let ControlTuning = class extends Mixins(ControlMixin) {
  shaperOnly;
  get axes() {
    return ["x", "y"];
  }
  get shaperSettings() {
    return this.$store.state.printer.printer.configfile?.settings?.input_shaper;
  }
  get hasShaper() {
    return !!this.shaperSettings;
  }
  reportedShapers = {};
  reportTarget = "";
  reportBoundary = null;
  /** Reports received after this panel asked the selected printer. */
  get reported() {
    return this.reportTarget === this.panelTarget ? this.reportedShapers : {};
  }
  collectShaperReport() {
    if (this.reportBoundary === null || this.reportTarget !== this.panelTarget) return;
    const entries = this.$store.state.console.console ?? [];
    for (const entry of entries.slice(this.reportBoundary)) {
      if (entry.type === "response") Object.assign(this.reportedShapers, parseShaperReport(entry.message ?? ""));
    }
    this.reportBoundary = entries.length;
  }
  clearShaperReport() {
    this.reportedShapers = {};
    this.reportTarget = "";
    this.reportBoundary = null;
  }
  beginShaperReport() {
    this.reportedShapers = {};
    this.reportTarget = this.panelTarget;
    this.reportBoundary = (this.$store.state.console.console ?? []).length;
  }
  get shaperSource() {
    return this.reported.x || this.reported.y ? "as Klipper last reported" : "from printer.cfg";
  }
  shaper(axis) {
    return this.reported[axis] ?? configShaper(this.shaperSettings, axis) ?? { type: "mzv", freq: 0 };
  }
  /** Klipper's shapers, and whatever this one is set to if it's one of its own. */
  shaperTypes(axis) {
    const type = this.shaper(axis).type;
    return SHAPER_TYPES.includes(type) ? SHAPER_TYPES : [...SHAPER_TYPES, type];
  }
  setShaper(axis, change) {
    if (!this.controlReady || this.busy || !this.hasShaper || !this.axes.includes(axis)) return;
    const next = { ...this.shaper(axis), ...change };
    if (!Number.isFinite(next.freq) || next.freq < 0 || next.freq > 300 || !this.shaperTypes(axis).includes(next.type) || !/^\w+$/.test(next.type)) return;
    this.beginShaperReport();
    this.sendGcode(shaperCommand(axis, next));
  }
  onShaperType(axis, event) {
    this.setShaper(axis, { type: event.target.value });
  }
  /** SET_INPUT_SHAPER with no values only reports them. */
  readShaper() {
    if (!this.controlReady) return;
    this.beginShaperReport();
    this.sendGcode("SET_INPUT_SHAPER");
  }
  get retraction() {
    return this.$store.state.printer.printer.firmware_retraction ?? null;
  }
  get retractionRows() {
    const r = this.retraction;
    if (!r) return [];
    return [
      { key: "retract_length", label: "Retract", value: r.retract_length, unit: "mm", max: 15, decimals: 2 },
      { key: "retract_speed", label: "Retract speed", value: r.retract_speed, unit: "mm/s", max: 200, decimals: 0 },
      { key: "unretract_extra_length", label: "Extra on the way back", value: r.unretract_extra_length, unit: "mm", max: 5, decimals: 2 },
      { key: "unretract_speed", label: "Unretract speed", value: r.unretract_speed, unit: "mm/s", max: 200, decimals: 0 }
    ];
  }
  setRetraction(key, value) {
    if (!this.controlReady) return;
    this.sendGcode(retractionCommand(key, value));
  }
  get note() {
    return "These last until Klipper restarts. Run measures new values; save the results to keep them. Manual changes can be kept in Files \u203A printer.cfg.";
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlTuning.prototype, "shaperOnly", 2);
__decorateClass([
  Watch("$store.state.console.console", { deep: true })
], ControlTuning.prototype, "collectShaperReport", 1);
__decorateClass([
  Watch("panelTarget")
], ControlTuning.prototype, "clearShaperReport", 1);
ControlTuning = __decorateClass([
  Component({ components: { ControlCard, NumberField } })
], ControlTuning);
const _sfc_main = ControlTuning;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": _vm.shaperOnly ? "Input shaper" : "Motion tuning", "locked": _vm.controlLock, "note": _vm.klippyReady ? _vm.note : "", "data-tid": "control-tuning" }, scopedSlots: _vm._u([_vm.hasShaper ? { key: "aside", fn: function() {
    return [_c("button", { staticClass: "tune__link", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "control-shaper-read" }, on: { "click": _vm.readShaper } }, [_vm._v(" Read what it's using ")])];
  }, proxy: true } : null], null, true) }, [_vm.hasShaper ? _c("div", { staticClass: "tune__group", attrs: { "data-tid": "control-shaper" } }, [_c("h3", { staticClass: "tune__label" }, [_vm._v(" Input shaper "), _c("span", { staticClass: "crow__sub" }, [_vm._v("\xB7 " + _vm._s(_vm.shaperSource))])]), _vm._l(_vm.axes, function(axis) {
    return _c("div", { key: axis, staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(axis.toUpperCase()))]), _c("span", { staticClass: "tune__pair" }, [_c("select", { staticClass: "tune__select", attrs: { "aria-label": `${axis.toUpperCase()} shaper`, "disabled": !_vm.controlReady || _vm.busy }, domProps: { "value": _vm.shaper(axis).type }, on: { "change": function($event) {
      return _vm.onShaperType(axis, $event);
    } } }, _vm._l(_vm.shaperTypes(axis), function(type) {
      return _c("option", { key: type, domProps: { "value": type } }, [_vm._v(" " + _vm._s(type) + " ")]);
    }), 0), _c("number-field", { attrs: { "value": _vm.shaper(axis).freq, "unit": "Hz", "min": 0, "max": 300, "decimals": 1, "label": `${axis.toUpperCase()} shaper frequency`, "disabled": !_vm.controlReady || _vm.busy }, on: { "change": function($event) {
      return _vm.setShaper(axis, { freq: $event });
    } } })], 1)]);
  })], 2) : _vm._e(), !_vm.shaperOnly && _vm.retraction ? _c("div", { staticClass: "tune__group", attrs: { "data-tid": "control-retraction" } }, [_c("h3", { staticClass: "tune__label" }, [_vm._v(" Firmware retraction "), _c("span", { staticClass: "crow__sub" }, [_vm._v("\xB7 G10 and G11")])]), _vm._l(_vm.retractionRows, function(row) {
    return _c("div", { key: row.key, staticClass: "crow" }, [_c("span", { staticClass: "crow__name" }, [_vm._v(_vm._s(row.label))]), _c("number-field", { attrs: { "value": row.value, "unit": row.unit, "min": 0, "max": row.max, "decimals": row.decimals, "label": row.label, "disabled": !_vm.controlReady }, on: { "change": function($event) {
      return _vm.setRetraction(row.key, $event);
    } } })], 1);
  })], 2) : _vm._e(), !_vm.hasShaper && (_vm.shaperOnly || !_vm.retraction) ? _c("p", { staticClass: "tune__none" }, [_vm._v(" " + _vm._s(_vm.shaperOnly ? "This printer has no input shaper in printer.cfg." : "There's no input shaper or firmware retraction in this printer's printer.cfg.") + " ")]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlTuning.vue?vue&type=style&index=0&scoped=677cf8f5&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "677cf8f5",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlTuning.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXVHQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxPQUVBO0FBQ0E7QUFDQTtBQVNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFyR0E7QUFBQTtBQUFBLEdBREEsY0FDQTtBQXVCQTtBQUFBLEVBREE7QUFBQSxHQXZCQSxjQXdCQTtBQVVBO0FBQUEsRUFEQTtBQUFBLEdBakNBLGNBa0NBO0FBbENBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2xUdW5pbmcudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGNvbnRyb2wtY2FyZFxuICAgIDp0aXRsZT1cInNoYXBlck9ubHkgPyAnSW5wdXQgc2hhcGVyJyA6ICdNb3Rpb24gdHVuaW5nJ1wiXG4gICAgOmxvY2tlZD1cImNvbnRyb2xMb2NrXCJcbiAgICA6bm90ZT1cImtsaXBweVJlYWR5ID8gbm90ZSA6ICcnXCJcbiAgICBkYXRhLXRpZD1cImNvbnRyb2wtdHVuaW5nXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZVxuICAgICAgdi1pZj1cImhhc1NoYXBlclwiXG4gICAgICAjYXNpZGVcbiAgICA+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cInR1bmVfX2xpbmtcIlxuICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJjb250cm9sLXNoYXBlci1yZWFkXCJcbiAgICAgICAgQGNsaWNrPVwicmVhZFNoYXBlclwiXG4gICAgICA+XG4gICAgICAgIFJlYWQgd2hhdCBpdCdzIHVzaW5nXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPGRpdlxuICAgICAgdi1pZj1cImhhc1NoYXBlclwiXG4gICAgICBjbGFzcz1cInR1bmVfX2dyb3VwXCJcbiAgICAgIGRhdGEtdGlkPVwiY29udHJvbC1zaGFwZXJcIlxuICAgID5cbiAgICAgIDxoMyBjbGFzcz1cInR1bmVfX2xhYmVsXCI+XG4gICAgICAgIElucHV0IHNoYXBlciA8c3BhbiBjbGFzcz1cImNyb3dfX3N1YlwiPsK3IHt7IHNoYXBlclNvdXJjZSB9fTwvc3Bhbj5cbiAgICAgIDwvaDM+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZm9yPVwiYXhpcyBpbiBheGVzXCJcbiAgICAgICAgOmtleT1cImF4aXNcIlxuICAgICAgICBjbGFzcz1cImNyb3dcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNyb3dfX25hbWVcIj57eyBheGlzLnRvVXBwZXJDYXNlKCkgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwidHVuZV9fcGFpclwiPlxuICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgIGNsYXNzPVwidHVuZV9fc2VsZWN0XCJcbiAgICAgICAgICAgIDp2YWx1ZT1cInNoYXBlcihheGlzKS50eXBlXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7YXhpcy50b1VwcGVyQ2FzZSgpfSBzaGFwZXJgXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHkgfHwgYnVzeVwiXG4gICAgICAgICAgICBAY2hhbmdlPVwib25TaGFwZXJUeXBlKGF4aXMsICRldmVudClcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxvcHRpb25cbiAgICAgICAgICAgICAgdi1mb3I9XCJ0eXBlIGluIHNoYXBlclR5cGVzKGF4aXMpXCJcbiAgICAgICAgICAgICAgOmtleT1cInR5cGVcIlxuICAgICAgICAgICAgICA6dmFsdWU9XCJ0eXBlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3sgdHlwZSB9fVxuICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgPG51bWJlci1maWVsZFxuICAgICAgICAgICAgOnZhbHVlPVwic2hhcGVyKGF4aXMpLmZyZXFcIlxuICAgICAgICAgICAgdW5pdD1cIkh6XCJcbiAgICAgICAgICAgIDptaW49XCIwXCJcbiAgICAgICAgICAgIDptYXg9XCIzMDBcIlxuICAgICAgICAgICAgOmRlY2ltYWxzPVwiMVwiXG4gICAgICAgICAgICA6bGFiZWw9XCJgJHtheGlzLnRvVXBwZXJDYXNlKCl9IHNoYXBlciBmcmVxdWVuY3lgXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHkgfHwgYnVzeVwiXG4gICAgICAgICAgICBAY2hhbmdlPVwic2V0U2hhcGVyKGF4aXMsIHsgZnJlcTogJGV2ZW50IH0pXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCIhc2hhcGVyT25seSAmJiByZXRyYWN0aW9uXCJcbiAgICAgIGNsYXNzPVwidHVuZV9fZ3JvdXBcIlxuICAgICAgZGF0YS10aWQ9XCJjb250cm9sLXJldHJhY3Rpb25cIlxuICAgID5cbiAgICAgIDxoMyBjbGFzcz1cInR1bmVfX2xhYmVsXCI+XG4gICAgICAgIEZpcm13YXJlIHJldHJhY3Rpb24gPHNwYW4gY2xhc3M9XCJjcm93X19zdWJcIj7CtyBHMTAgYW5kIEcxMTwvc3Bhbj5cbiAgICAgIDwvaDM+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtZm9yPVwicm93IGluIHJldHJhY3Rpb25Sb3dzXCJcbiAgICAgICAgOmtleT1cInJvdy5rZXlcIlxuICAgICAgICBjbGFzcz1cImNyb3dcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNyb3dfX25hbWVcIj57eyByb3cubGFiZWwgfX08L3NwYW4+XG4gICAgICAgIDxudW1iZXItZmllbGRcbiAgICAgICAgICA6dmFsdWU9XCJyb3cudmFsdWVcIlxuICAgICAgICAgIDp1bml0PVwicm93LnVuaXRcIlxuICAgICAgICAgIDptaW49XCIwXCJcbiAgICAgICAgICA6bWF4PVwicm93Lm1heFwiXG4gICAgICAgICAgOmRlY2ltYWxzPVwicm93LmRlY2ltYWxzXCJcbiAgICAgICAgICA6bGFiZWw9XCJyb3cubGFiZWxcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIEBjaGFuZ2U9XCJzZXRSZXRyYWN0aW9uKHJvdy5rZXksICRldmVudClcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8cFxuICAgICAgdi1pZj1cIiFoYXNTaGFwZXIgJiYgKHNoYXBlck9ubHkgfHwgIXJldHJhY3Rpb24pXCJcbiAgICAgIGNsYXNzPVwidHVuZV9fbm9uZVwiXG4gICAgPlxuICAgICAge3sgc2hhcGVyT25seSA/ICdUaGlzIHByaW50ZXIgaGFzIG5vIGlucHV0IHNoYXBlciBpbiBwcmludGVyLmNmZy4nIDogXCJUaGVyZSdzIG5vIGlucHV0IHNoYXBlciBvciBmaXJtd2FyZSByZXRyYWN0aW9uIGluIHRoaXMgcHJpbnRlcidzIHByaW50ZXIuY2ZnLlwiIH19XG4gICAgPC9wPlxuICA8L2NvbnRyb2wtY2FyZD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiBmcm9tICdAL21peGlucy9jb250cm9sJ1xuaW1wb3J0IHR5cGUgeyBDb25zb2xlRW50cnkgfSBmcm9tICdAL3N0b3JlL2NvbnNvbGUvdHlwZXMnXG5pbXBvcnQge1xuICBTSEFQRVJfVFlQRVMsIGNvbmZpZ1NoYXBlciwgcGFyc2VTaGFwZXJSZXBvcnQsIHJldHJhY3Rpb25Db21tYW5kLCBzaGFwZXJDb21tYW5kLFxuICB0eXBlIEF4aXNTaGFwZXIsIHR5cGUgUmV0cmFjdGlvbktleSwgdHlwZSBTaGFwZXJBeGlzXG59IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9tb2RlbCdcbmltcG9ydCBDb250cm9sQ2FyZCBmcm9tICcuL0NvbnRyb2xDYXJkLnZ1ZSdcbmltcG9ydCBOdW1iZXJGaWVsZCBmcm9tICcuL051bWJlckZpZWxkLnZ1ZSdcblxuLyoqXG4gKiBUaGUgaW5wdXQgc2hhcGVyIG9uIGVhY2ggYXhpcyAoS2xpcHBlciBrZWVwcyBub1xuICogc3RhdHVzIGZvciBpdCwgc28gaXQgc2hvd3MgcHJpbnRlci5jZmcncyB1bnRpbCBLbGlwcGVyIHJlcG9ydHMgaXRzIG93bixcbiAqIHdoaWNoIGFueSBTRVRfSU5QVVRfU0hBUEVSIGRvZXMpIGFuZCBmaXJtd2FyZSByZXRyYWN0aW9uLiBCb3RoIGxhc3RcbiAqIHVudGlsIEtsaXBwZXIgcmVzdGFydHMuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IENvbnRyb2xDYXJkLCBOdW1iZXJGaWVsZCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sVHVuaW5nIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbikge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgc2hhcGVyT25seT86IGJvb2xlYW5cbiAgZ2V0IGF4ZXMgKCk6IFNoYXBlckF4aXNbXSB7XG4gICAgcmV0dXJuIFsneCcsICd5J11cbiAgfVxuXG4gIGdldCBzaGFwZXJTZXR0aW5ncyAoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZT8uc2V0dGluZ3M/LmlucHV0X3NoYXBlclxuICB9XG5cbiAgZ2V0IGhhc1NoYXBlciAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5zaGFwZXJTZXR0aW5nc1xuICB9XG5cbiAgcmVwb3J0ZWRTaGFwZXJzOiBQYXJ0aWFsPFJlY29yZDxTaGFwZXJBeGlzLCBBeGlzU2hhcGVyPj4gPSB7fVxuICByZXBvcnRUYXJnZXQgPSAnJ1xuICByZXBvcnRCb3VuZGFyeTogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuICAvKiogUmVwb3J0cyByZWNlaXZlZCBhZnRlciB0aGlzIHBhbmVsIGFza2VkIHRoZSBzZWxlY3RlZCBwcmludGVyLiAqL1xuICBnZXQgcmVwb3J0ZWQgKCk6IFBhcnRpYWw8UmVjb3JkPFNoYXBlckF4aXMsIEF4aXNTaGFwZXI+PiB7XG4gICAgcmV0dXJuIHRoaXMucmVwb3J0VGFyZ2V0ID09PSB0aGlzLnBhbmVsVGFyZ2V0ID8gdGhpcy5yZXBvcnRlZFNoYXBlcnMgOiB7fVxuICB9XG5cbiAgQFdhdGNoKCckc3RvcmUuc3RhdGUuY29uc29sZS5jb25zb2xlJywgeyBkZWVwOiB0cnVlIH0pXG4gIGNvbGxlY3RTaGFwZXJSZXBvcnQgKCkge1xuICAgIGlmICh0aGlzLnJlcG9ydEJvdW5kYXJ5ID09PSBudWxsIHx8IHRoaXMucmVwb3J0VGFyZ2V0ICE9PSB0aGlzLnBhbmVsVGFyZ2V0KSByZXR1cm5cbiAgICBjb25zdCBlbnRyaWVzID0gKHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29uc29sZSBhcyBDb25zb2xlRW50cnlbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMuc2xpY2UodGhpcy5yZXBvcnRCb3VuZGFyeSkpIHtcbiAgICAgIGlmIChlbnRyeS50eXBlID09PSAncmVzcG9uc2UnKSBPYmplY3QuYXNzaWduKHRoaXMucmVwb3J0ZWRTaGFwZXJzLCBwYXJzZVNoYXBlclJlcG9ydChlbnRyeS5tZXNzYWdlID8/ICcnKSlcbiAgICB9XG4gICAgdGhpcy5yZXBvcnRCb3VuZGFyeSA9IGVudHJpZXMubGVuZ3RoXG4gIH1cblxuICBAV2F0Y2goJ3BhbmVsVGFyZ2V0JylcbiAgY2xlYXJTaGFwZXJSZXBvcnQgKCkge1xuICAgIHRoaXMucmVwb3J0ZWRTaGFwZXJzID0ge31cbiAgICB0aGlzLnJlcG9ydFRhcmdldCA9ICcnXG4gICAgdGhpcy5yZXBvcnRCb3VuZGFyeSA9IG51bGxcbiAgfVxuXG4gIGJlZ2luU2hhcGVyUmVwb3J0ICgpIHtcbiAgICB0aGlzLnJlcG9ydGVkU2hhcGVycyA9IHt9XG4gICAgdGhpcy5yZXBvcnRUYXJnZXQgPSB0aGlzLnBhbmVsVGFyZ2V0XG4gICAgdGhpcy5yZXBvcnRCb3VuZGFyeSA9ICgodGhpcy4kc3RvcmUuc3RhdGUuY29uc29sZS5jb25zb2xlIGFzIENvbnNvbGVFbnRyeVtdIHwgdW5kZWZpbmVkKSA/PyBbXSkubGVuZ3RoXG4gIH1cblxuICBnZXQgc2hhcGVyU291cmNlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlcG9ydGVkLnggfHwgdGhpcy5yZXBvcnRlZC55ID8gJ2FzIEtsaXBwZXIgbGFzdCByZXBvcnRlZCcgOiAnZnJvbSBwcmludGVyLmNmZydcbiAgfVxuXG4gIHNoYXBlciAoYXhpczogU2hhcGVyQXhpcyk6IEF4aXNTaGFwZXIge1xuICAgIHJldHVybiB0aGlzLnJlcG9ydGVkW2F4aXNdID8/IGNvbmZpZ1NoYXBlcih0aGlzLnNoYXBlclNldHRpbmdzLCBheGlzKSA/PyB7IHR5cGU6ICdtenYnLCBmcmVxOiAwIH1cbiAgfVxuXG4gIC8qKiBLbGlwcGVyJ3Mgc2hhcGVycywgYW5kIHdoYXRldmVyIHRoaXMgb25lIGlzIHNldCB0byBpZiBpdCdzIG9uZSBvZiBpdHMgb3duLiAqL1xuICBzaGFwZXJUeXBlcyAoYXhpczogU2hhcGVyQXhpcyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5zaGFwZXIoYXhpcykudHlwZVxuICAgIHJldHVybiBTSEFQRVJfVFlQRVMuaW5jbHVkZXModHlwZSkgPyBTSEFQRVJfVFlQRVMgOiBbLi4uU0hBUEVSX1RZUEVTLCB0eXBlXVxuICB9XG5cbiAgc2V0U2hhcGVyIChheGlzOiBTaGFwZXJBeGlzLCBjaGFuZ2U6IFBhcnRpYWw8QXhpc1NoYXBlcj4pIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuYnVzeSB8fCAhdGhpcy5oYXNTaGFwZXIgfHwgIXRoaXMuYXhlcy5pbmNsdWRlcyhheGlzKSkgcmV0dXJuXG4gICAgY29uc3QgbmV4dCA9IHsgLi4udGhpcy5zaGFwZXIoYXhpcyksIC4uLmNoYW5nZSB9XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobmV4dC5mcmVxKSB8fCBuZXh0LmZyZXEgPCAwIHx8IG5leHQuZnJlcSA+IDMwMCB8fCAhdGhpcy5zaGFwZXJUeXBlcyhheGlzKS5pbmNsdWRlcyhuZXh0LnR5cGUpIHx8ICEvXlxcdyskLy50ZXN0KG5leHQudHlwZSkpIHJldHVyblxuICAgIHRoaXMuYmVnaW5TaGFwZXJSZXBvcnQoKVxuICAgIHRoaXMuc2VuZEdjb2RlKHNoYXBlckNvbW1hbmQoYXhpcywgbmV4dCkpXG4gIH1cblxuICBvblNoYXBlclR5cGUgKGF4aXM6IFNoYXBlckF4aXMsIGV2ZW50OiBFdmVudCkge1xuICAgIHRoaXMuc2V0U2hhcGVyKGF4aXMsIHsgdHlwZTogKGV2ZW50LnRhcmdldCBhcyBIVE1MU2VsZWN0RWxlbWVudCkudmFsdWUgfSlcbiAgfVxuXG4gIC8qKiBTRVRfSU5QVVRfU0hBUEVSIHdpdGggbm8gdmFsdWVzIG9ubHkgcmVwb3J0cyB0aGVtLiAqL1xuICByZWFkU2hhcGVyICgpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm5cbiAgICB0aGlzLmJlZ2luU2hhcGVyUmVwb3J0KClcbiAgICB0aGlzLnNlbmRHY29kZSgnU0VUX0lOUFVUX1NIQVBFUicpXG4gIH1cblxuICBnZXQgcmV0cmFjdGlvbiAoKTogUmVjb3JkPFJldHJhY3Rpb25LZXksIG51bWJlcj4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmZpcm13YXJlX3JldHJhY3Rpb24gPz8gbnVsbFxuICB9XG5cbiAgZ2V0IHJldHJhY3Rpb25Sb3dzICgpOiBBcnJheTx7IGtleTogUmV0cmFjdGlvbktleSwgbGFiZWw6IHN0cmluZywgdmFsdWU6IG51bWJlciwgdW5pdDogc3RyaW5nLCBtYXg6IG51bWJlciwgZGVjaW1hbHM6IG51bWJlciB9PiB7XG4gICAgY29uc3QgciA9IHRoaXMucmV0cmFjdGlvblxuICAgIGlmICghcikgcmV0dXJuIFtdXG4gICAgcmV0dXJuIFtcbiAgICAgIHsga2V5OiAncmV0cmFjdF9sZW5ndGgnLCBsYWJlbDogJ1JldHJhY3QnLCB2YWx1ZTogci5yZXRyYWN0X2xlbmd0aCwgdW5pdDogJ21tJywgbWF4OiAxNSwgZGVjaW1hbHM6IDIgfSxcbiAgICAgIHsga2V5OiAncmV0cmFjdF9zcGVlZCcsIGxhYmVsOiAnUmV0cmFjdCBzcGVlZCcsIHZhbHVlOiByLnJldHJhY3Rfc3BlZWQsIHVuaXQ6ICdtbS9zJywgbWF4OiAyMDAsIGRlY2ltYWxzOiAwIH0sXG4gICAgICB7IGtleTogJ3VucmV0cmFjdF9leHRyYV9sZW5ndGgnLCBsYWJlbDogJ0V4dHJhIG9uIHRoZSB3YXkgYmFjaycsIHZhbHVlOiByLnVucmV0cmFjdF9leHRyYV9sZW5ndGgsIHVuaXQ6ICdtbScsIG1heDogNSwgZGVjaW1hbHM6IDIgfSxcbiAgICAgIHsga2V5OiAndW5yZXRyYWN0X3NwZWVkJywgbGFiZWw6ICdVbnJldHJhY3Qgc3BlZWQnLCB2YWx1ZTogci51bnJldHJhY3Rfc3BlZWQsIHVuaXQ6ICdtbS9zJywgbWF4OiAyMDAsIGRlY2ltYWxzOiAwIH1cbiAgICBdXG4gIH1cblxuICBzZXRSZXRyYWN0aW9uIChrZXk6IFJldHJhY3Rpb25LZXksIHZhbHVlOiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5KSByZXR1cm5cbiAgICB0aGlzLnNlbmRHY29kZShyZXRyYWN0aW9uQ29tbWFuZChrZXksIHZhbHVlKSlcbiAgfVxuXG4gIGdldCBub3RlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnVGhlc2UgbGFzdCB1bnRpbCBLbGlwcGVyIHJlc3RhcnRzLiBSdW4gbWVhc3VyZXMgbmV3IHZhbHVlczsgc2F2ZSB0aGUgcmVzdWx0cyB0byBrZWVwIHRoZW0uIE1hbnVhbCBjaGFuZ2VzIGNhbiBiZSBrZXB0IGluIEZpbGVzIOKAuiBwcmludGVyLmNmZy4nXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC50dW5lX19ncm91cCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXG4gICAgPiAuY3JvdyArIC5jcm93IHtcbiAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICB9XG4gIH1cblxuICAudHVuZV9fbGFiZWwge1xuICAgIG1hcmdpbjogMCAwIDRweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLnR1bmVfX3BhaXIge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAudHVuZV9fc2VsZWN0IHtcbiAgICBoZWlnaHQ6IDM0cHg7XG4gICAgcGFkZGluZzogMCAxMHB4O1xuICAgIGJvcmRlcjogMDtcbiAgICBib3JkZXItcmFkaXVzOiA5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250OiBpbmhlcml0O1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLnR1bmVfX2xpbmsge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcblxuICAgICY6ZGlzYWJsZWQge1xuICAgICAgb3BhY2l0eTogMC40NTtcbiAgICB9XG4gIH1cblxuICAudHVuZV9fbm9uZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sVHVuaW5nLnZ1ZSJ9