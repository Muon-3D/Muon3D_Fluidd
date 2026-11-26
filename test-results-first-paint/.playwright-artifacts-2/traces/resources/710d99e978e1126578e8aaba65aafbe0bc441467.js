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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin, {} from "/src/mixins/control.ts";
import { leftAt } from "/src/services/control/speed.ts";
import { shortDuration } from "/src/util/short-duration.ts";
import ControlCard from "/src/components/control/ControlCard.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import NumberField from "/src/components/control/NumberField.vue";
import ControlTaskFold from "/src/components/control/ControlTaskFold.vue";
import TuningValue from "/src/components/control/TuningValue.vue";
import { retractionCommand } from "/src/services/control/model.ts";
let ControlSpeed = class extends Mixins(ControlMixin) {
  custom = false;
  simple;
  /** Seconds left in the print, at the speed it runs now. */
  get secondsLeft() {
    if (!this.printerPrinting) return null;
    const eta = this.$store.getters["printer/getTimeEstimates"].eta;
    const left = (eta - Date.now()) / 1e3;
    return left > 60 ? left : null;
  }
  get speedOptions() {
    return this.speedChoices.map((c) => ({
      value: c.percent,
      label: c.label,
      sub: this.secondsLeft ? `${shortDuration(leftAt(this.secondsLeft, this.speedFactor, c.percent))} left` : `${c.percent}%`
    }));
  }
  get speedName() {
    return this.speedLabel;
  }
  get isCustom() {
    return !this.speedChoices.some((c) => c.percent === this.speedFactor);
  }
  /** What the speed it runs at does; Fast's limit when there's no room for it. */
  get speedNote() {
    const choice = this.speedChoices.find((c) => c.percent === this.speedFactor);
    if (choice) return choice.note;
    if (!this.speedChoices.some((c) => c.label === "Fast")) return "No Fast for this print: it is already as fast as the nozzle can melt the filament.";
    return "Slow is half speed. Fast is as fast as the nozzle can melt the filament.";
  }
  /** Velocity, acceleration, corner speed, and whichever cruise setting this Klipper has. */
  get limitReason() {
    return "This printer hasn't reported its limits";
  }
  get limits() {
    const t = this.toolhead;
    const row = (key, label, value, unit, decimals) => {
      const max = this.limitMaximum(key);
      return { key, label, value, unit, decimals, max };
    };
    const list = [
      row("VELOCITY", "Velocity", t.max_velocity ?? null, "mm/s", 0),
      row("ACCEL", "Acceleration", t.max_accel ?? null, "mm/s\xB2", 0),
      row("SQUARE_CORNER_VELOCITY", "Square corner velocity", t.square_corner_velocity ?? null, "mm/s", 1)
    ];
    if (typeof t.minimum_cruise_ratio === "number") {
      const ratio = row("MINIMUM_CRUISE_RATIO", "Minimum cruise ratio", t.minimum_cruise_ratio, "", 2);
      list.push(ratio);
    } else if (typeof t.max_accel_to_decel === "number") {
      const accelToDecel = row("ACCEL_TO_DECEL", "Accel to decel", t.max_accel_to_decel, "mm/s\xB2", 0);
      list.push(accelToDecel);
    }
    return list;
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
    const row = this.retractionRows.find((r) => r.key === key);
    if (!this.controlReady || !row || !Number.isFinite(value) || value < (key.endsWith("speed") ? 0.1 : 0) || value > row.max) return;
    this.sendGcode(retractionCommand(key, value));
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlSpeed.prototype, "simple", 2);
ControlSpeed = __decorateClass([
  Component({ components: { ControlCard, SegPicker, NumberField, ControlTaskFold, TuningValue } })
], ControlSpeed);
const _sfc_main = ControlSpeed;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("control-card", { attrs: { "title": "Speed and flow", "icon": "pulse", "locked": _vm.controlLock, "note": _vm.controlReady ? _vm.speedNote : "", "data-tid": "control-speed" }, scopedSlots: _vm._u([{ key: "aside", fn: function() {
    return [_c("span", [_vm._v("while printing")])];
  }, proxy: true }]) }, [_c("seg-picker", { attrs: { "options": _vm.speedOptions, "value": _vm.speedFactor, "label": "Speed presets", "big": "", "accent": "", "fill": "", "disabled": !_vm.controlReady }, on: { "input": _vm.setSpeed } }), !_vm.simple ? [_c("button", { staticClass: "speed__custom", attrs: { "type": "button", "data-tid": "speed-custom", "aria-expanded": _vm.custom || _vm.isCustom ? "true" : "false", "aria-controls": "speed-custom-value" }, on: { "click": function($event) {
    _vm.custom = !_vm.custom;
  } } }, [_vm._v(" Custom \xB7 " + _vm._s(_vm.speedFactor) + "% ")]), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.custom || _vm.isCustom, expression: "custom || isCustom" }], attrs: { "id": "speed-custom-value" } }, [_c("number-field", { key: _vm.panelTarget, attrs: { "value": _vm.speedFactor, "unit": "%", "min": 1, "max": 500, "label": "Speed", "disabled": !_vm.controlReady }, on: { "change": _vm.setSpeed } })], 1), _c("control-task-fold", { attrs: { "fold-key": "speed.fine", "title": "Fine-tune", "summary": `Flow ${_vm.flowFactor}%${_vm.pressureAdvance === null ? "" : ` \xB7 PA ${_vm.pressureAdvance} s`}` } }, [_c("tuning-value", { attrs: { "context": _vm.panelTarget, "label": "Flow", "value": _vm.flowFactor, "unit": "%", "min": 1, "max": 300, "disabled": !_vm.controlReady }, on: { "change": _vm.setFlow } }), _vm.pressureAdvance !== null ? _c("tuning-value", { attrs: { "context": _vm.panelTarget, "label": "Pressure advance", "value": _vm.pressureAdvance, "unit": "s", "max": 2, "decimals": 3, "disabled": !_vm.controlReady }, on: { "change": _vm.setPressureAdvance } }) : _vm._e(), _vm._l(_vm.limits, function(limit) {
    return _c("tuning-value", { key: limit.key, attrs: { "context": _vm.panelTarget, "label": limit.label, "value": limit.value, "unit": limit.unit, "min": ["VELOCITY", "ACCEL"].includes(limit.key) ? 1e-3 : 0, "max": limit.max ?? 0, "decimals": limit.decimals, "disabled": !_vm.controlReady || limit.max === null, "reason": limit.max === null ? _vm.limitReason : "" }, on: { "change": function($event) {
      return _vm.setLimit(limit.key, $event);
    } } });
  }), _vm.retractionRows.length ? _c("h3", { staticClass: "speed__retract" }, [_vm._v(" Firmware retraction \xB7 G10 and G11 ")]) : _vm._e(), _vm._l(_vm.retractionRows, function(row) {
    return _c("tuning-value", { key: row.key, attrs: { "context": _vm.panelTarget, "label": row.label, "value": row.value, "unit": row.unit, "min": row.key.endsWith("speed") ? 0.1 : 0, "max": row.max, "decimals": row.decimals, "disabled": !_vm.controlReady }, on: { "change": function($event) {
      return _vm.setRetraction(row.key, $event);
    } } });
  }), _c("p", { staticClass: "speed__lifetime" }, [_vm._v(" These values last until Klipper restarts. To keep them, save them in Files \u203A printer.cfg. Put back remembers this visit's previous value. ")])], 2)] : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlSpeed.vue?vue&type=style&index=0&scoped=fe897ffb&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "fe897ffb",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlSpeed.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW1IQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWhGQTtBQUFBLEVBREE7QUFBQSxHQUpBLGFBS0E7QUFMQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb250cm9sU3BlZWQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGNvbnRyb2wtY2FyZFxuICAgIHRpdGxlPVwiU3BlZWQgYW5kIGZsb3dcIlxuICAgIGljb249XCJwdWxzZVwiXG4gICAgOmxvY2tlZD1cImNvbnRyb2xMb2NrXCJcbiAgICA6bm90ZT1cImNvbnRyb2xSZWFkeSA/IHNwZWVkTm90ZSA6ICcnXCJcbiAgICBkYXRhLXRpZD1cImNvbnRyb2wtc3BlZWRcIlxuICA+XG4gICAgPHRlbXBsYXRlICNhc2lkZT5cbiAgICAgIDxzcGFuPndoaWxlIHByaW50aW5nPC9zcGFuPlxuICAgIDwvdGVtcGxhdGU+XG4gICAgPHNlZy1waWNrZXJcbiAgICAgIDpvcHRpb25zPVwic3BlZWRPcHRpb25zXCJcbiAgICAgIDp2YWx1ZT1cInNwZWVkRmFjdG9yXCJcbiAgICAgIGxhYmVsPVwiU3BlZWQgcHJlc2V0c1wiXG4gICAgICBiaWdcbiAgICAgIGFjY2VudFxuICAgICAgZmlsbFxuICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICBAaW5wdXQ9XCJzZXRTcGVlZFwiXG4gICAgLz5cbiAgICA8dGVtcGxhdGUgdi1pZj1cIiFzaW1wbGVcIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwic3BlZWRfX2N1c3RvbVwiXG4gICAgICAgIGRhdGEtdGlkPVwic3BlZWQtY3VzdG9tXCJcbiAgICAgICAgOmFyaWEtZXhwYW5kZWQ9XCJjdXN0b20gfHwgaXNDdXN0b20gPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgYXJpYS1jb250cm9scz1cInNwZWVkLWN1c3RvbS12YWx1ZVwiXG4gICAgICAgIEBjbGljaz1cImN1c3RvbSA9ICFjdXN0b21cIlxuICAgICAgPlxuICAgICAgICBDdXN0b20gwrcge3sgc3BlZWRGYWN0b3IgfX0lXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1zaG93PVwiY3VzdG9tIHx8IGlzQ3VzdG9tXCJcbiAgICAgICAgaWQ9XCJzcGVlZC1jdXN0b20tdmFsdWVcIlxuICAgICAgPlxuICAgICAgICA8bnVtYmVyLWZpZWxkXG4gICAgICAgICAgOmtleT1cInBhbmVsVGFyZ2V0XCJcbiAgICAgICAgICA6dmFsdWU9XCJzcGVlZEZhY3RvclwiXG4gICAgICAgICAgdW5pdD1cIiVcIlxuICAgICAgICAgIDptaW49XCIxXCJcbiAgICAgICAgICA6bWF4PVwiNTAwXCJcbiAgICAgICAgICBsYWJlbD1cIlNwZWVkXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICBAY2hhbmdlPVwic2V0U3BlZWRcIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8Y29udHJvbC10YXNrLWZvbGRcbiAgICAgICAgZm9sZC1rZXk9XCJzcGVlZC5maW5lXCJcbiAgICAgICAgdGl0bGU9XCJGaW5lLXR1bmVcIlxuICAgICAgICA6c3VtbWFyeT1cImBGbG93ICR7Zmxvd0ZhY3Rvcn0lJHtwcmVzc3VyZUFkdmFuY2UgPT09IG51bGwgPyAnJyA6IGAgwrcgUEEgJHtwcmVzc3VyZUFkdmFuY2V9IHNgfWBcIlxuICAgICAgPlxuICAgICAgICA8dHVuaW5nLXZhbHVlXG4gICAgICAgICAgOmNvbnRleHQ9XCJwYW5lbFRhcmdldFwiXG4gICAgICAgICAgbGFiZWw9XCJGbG93XCJcbiAgICAgICAgICA6dmFsdWU9XCJmbG93RmFjdG9yXCJcbiAgICAgICAgICB1bml0PVwiJVwiXG4gICAgICAgICAgOm1pbj1cIjFcIlxuICAgICAgICAgIDptYXg9XCIzMDBcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIEBjaGFuZ2U9XCJzZXRGbG93XCJcbiAgICAgICAgLz5cbiAgICAgICAgPHR1bmluZy12YWx1ZVxuICAgICAgICAgIHYtaWY9XCJwcmVzc3VyZUFkdmFuY2UgIT09IG51bGxcIlxuICAgICAgICAgIDpjb250ZXh0PVwicGFuZWxUYXJnZXRcIlxuICAgICAgICAgIGxhYmVsPVwiUHJlc3N1cmUgYWR2YW5jZVwiXG4gICAgICAgICAgOnZhbHVlPVwicHJlc3N1cmVBZHZhbmNlXCJcbiAgICAgICAgICB1bml0PVwic1wiXG4gICAgICAgICAgOm1heD1cIjJcIlxuICAgICAgICAgIDpkZWNpbWFscz1cIjNcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIEBjaGFuZ2U9XCJzZXRQcmVzc3VyZUFkdmFuY2VcIlxuICAgICAgICAvPlxuICAgICAgICA8dHVuaW5nLXZhbHVlXG4gICAgICAgICAgdi1mb3I9XCJsaW1pdCBpbiBsaW1pdHNcIlxuICAgICAgICAgIDprZXk9XCJsaW1pdC5rZXlcIlxuICAgICAgICAgIDpjb250ZXh0PVwicGFuZWxUYXJnZXRcIlxuICAgICAgICAgIDpsYWJlbD1cImxpbWl0LmxhYmVsXCJcbiAgICAgICAgICA6dmFsdWU9XCJsaW1pdC52YWx1ZVwiXG4gICAgICAgICAgOnVuaXQ9XCJsaW1pdC51bml0XCJcbiAgICAgICAgICA6bWluPVwiWydWRUxPQ0lUWScsICdBQ0NFTCddLmluY2x1ZGVzKGxpbWl0LmtleSkgPyAwLjAwMSA6IDBcIlxuICAgICAgICAgIDptYXg9XCJsaW1pdC5tYXggPz8gMFwiXG4gICAgICAgICAgOmRlY2ltYWxzPVwibGltaXQuZGVjaW1hbHNcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHkgfHwgbGltaXQubWF4ID09PSBudWxsXCJcbiAgICAgICAgICA6cmVhc29uPVwibGltaXQubWF4ID09PSBudWxsID8gbGltaXRSZWFzb24gOiAnJ1wiXG4gICAgICAgICAgQGNoYW5nZT1cInNldExpbWl0KGxpbWl0LmtleSwgJGV2ZW50KVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxoM1xuICAgICAgICAgIHYtaWY9XCJyZXRyYWN0aW9uUm93cy5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwic3BlZWRfX3JldHJhY3RcIlxuICAgICAgICA+XG4gICAgICAgICAgRmlybXdhcmUgcmV0cmFjdGlvbiDCtyBHMTAgYW5kIEcxMVxuICAgICAgICA8L2gzPlxuICAgICAgICA8dHVuaW5nLXZhbHVlXG4gICAgICAgICAgdi1mb3I9XCJyb3cgaW4gcmV0cmFjdGlvblJvd3NcIlxuICAgICAgICAgIDprZXk9XCJyb3cua2V5XCJcbiAgICAgICAgICA6Y29udGV4dD1cInBhbmVsVGFyZ2V0XCJcbiAgICAgICAgICA6bGFiZWw9XCJyb3cubGFiZWxcIlxuICAgICAgICAgIDp2YWx1ZT1cInJvdy52YWx1ZVwiXG4gICAgICAgICAgOnVuaXQ9XCJyb3cudW5pdFwiXG4gICAgICAgICAgOm1pbj1cInJvdy5rZXkuZW5kc1dpdGgoJ3NwZWVkJykgPyAwLjEgOiAwXCJcbiAgICAgICAgICA6bWF4PVwicm93Lm1heFwiXG4gICAgICAgICAgOmRlY2ltYWxzPVwicm93LmRlY2ltYWxzXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICBAY2hhbmdlPVwic2V0UmV0cmFjdGlvbihyb3cua2V5LCAkZXZlbnQpXCJcbiAgICAgICAgLz5cbiAgICAgICAgPHAgY2xhc3M9XCJzcGVlZF9fbGlmZXRpbWVcIj5cbiAgICAgICAgICBUaGVzZSB2YWx1ZXMgbGFzdCB1bnRpbCBLbGlwcGVyIHJlc3RhcnRzLiBUbyBrZWVwIHRoZW0sIHNhdmUgdGhlbSBpbiBGaWxlcyDigLogcHJpbnRlci5jZmcuIFB1dCBiYWNrIHJlbWVtYmVycyB0aGlzIHZpc2l0J3MgcHJldmlvdXMgdmFsdWUuXG4gICAgICAgIDwvcD5cbiAgICAgIDwvY29udHJvbC10YXNrLWZvbGQ+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9jb250cm9sLWNhcmQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiwgeyB0eXBlIExpbWl0S2V5IH0gZnJvbSAnQC9taXhpbnMvY29udHJvbCdcbmltcG9ydCB7IGxlZnRBdCB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9zcGVlZCdcbmltcG9ydCB7IHNob3J0RHVyYXRpb24gfSBmcm9tICdAL3V0aWwvc2hvcnQtZHVyYXRpb24nXG5pbXBvcnQgdHlwZSB7IFRpbWVFc3RpbWF0ZXMgfSBmcm9tICdAL3N0b3JlL3ByaW50ZXIvdHlwZXMnXG5pbXBvcnQgQ29udHJvbENhcmQgZnJvbSAnLi9Db250cm9sQ2FyZC52dWUnXG5pbXBvcnQgU2VnUGlja2VyLCB7IHR5cGUgU2VnT3B0aW9uIH0gZnJvbSAnLi9TZWdQaWNrZXIudnVlJ1xuaW1wb3J0IE51bWJlckZpZWxkIGZyb20gJy4vTnVtYmVyRmllbGQudnVlJ1xuaW1wb3J0IENvbnRyb2xUYXNrRm9sZCBmcm9tICcuL0NvbnRyb2xUYXNrRm9sZC52dWUnXG5pbXBvcnQgVHVuaW5nVmFsdWUgZnJvbSAnLi9UdW5pbmdWYWx1ZS52dWUnXG5pbXBvcnQgeyByZXRyYWN0aW9uQ29tbWFuZCwgdHlwZSBSZXRyYWN0aW9uS2V5IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL21vZGVsJ1xuXG4vKiogUHJlc2V0cyBhbmQgYW4gZXhhY3QgY3VzdG9tIHZhbHVlLCB3aXRoIHJldmVyc2libGUgdHVuaW5nIGJlc2lkZSB0aGVtLiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgQ29udHJvbENhcmQsIFNlZ1BpY2tlciwgTnVtYmVyRmllbGQsIENvbnRyb2xUYXNrRm9sZCwgVHVuaW5nVmFsdWUgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29udHJvbFNwZWVkIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbikge1xuICBjdXN0b20gPSBmYWxzZVxuXG4gIC8qKiBPdmVydmlldyBjYW4gcmV0YWluIGl0cyBjb21wYWN0IHByZXNldCBjYXJkLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgc2ltcGxlPzogYm9vbGVhblxuXG4gIC8qKiBTZWNvbmRzIGxlZnQgaW4gdGhlIHByaW50LCBhdCB0aGUgc3BlZWQgaXQgcnVucyBub3cuICovXG4gIGdldCBzZWNvbmRzTGVmdCAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLnByaW50ZXJQcmludGluZykgcmV0dXJuIG51bGxcbiAgICBjb25zdCBldGEgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRUaW1lRXN0aW1hdGVzJ10gYXMgVGltZUVzdGltYXRlcykuZXRhXG4gICAgY29uc3QgbGVmdCA9IChldGEgLSBEYXRlLm5vdygpKSAvIDEwMDBcbiAgICByZXR1cm4gbGVmdCA+IDYwID8gbGVmdCA6IG51bGxcbiAgfVxuXG4gIGdldCBzcGVlZE9wdGlvbnMgKCk6IFNlZ09wdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5zcGVlZENob2ljZXMubWFwKGMgPT4gKHtcbiAgICAgIHZhbHVlOiBjLnBlcmNlbnQsXG4gICAgICBsYWJlbDogYy5sYWJlbCxcbiAgICAgIHN1YjogdGhpcy5zZWNvbmRzTGVmdCA/IGAke3Nob3J0RHVyYXRpb24obGVmdEF0KHRoaXMuc2Vjb25kc0xlZnQsIHRoaXMuc3BlZWRGYWN0b3IsIGMucGVyY2VudCkpfSBsZWZ0YCA6IGAke2MucGVyY2VudH0lYFxuICAgIH0pKVxuICB9XG5cbiAgZ2V0IHNwZWVkTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zcGVlZExhYmVsXG4gIH1cblxuICBnZXQgaXNDdXN0b20gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5zcGVlZENob2ljZXMuc29tZShjID0+IGMucGVyY2VudCA9PT0gdGhpcy5zcGVlZEZhY3RvcilcbiAgfVxuXG4gIC8qKiBXaGF0IHRoZSBzcGVlZCBpdCBydW5zIGF0IGRvZXM7IEZhc3QncyBsaW1pdCB3aGVuIHRoZXJlJ3Mgbm8gcm9vbSBmb3IgaXQuICovXG4gIGdldCBzcGVlZE5vdGUgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgY2hvaWNlID0gdGhpcy5zcGVlZENob2ljZXMuZmluZChjID0+IGMucGVyY2VudCA9PT0gdGhpcy5zcGVlZEZhY3RvcilcbiAgICBpZiAoY2hvaWNlKSByZXR1cm4gY2hvaWNlLm5vdGVcbiAgICBpZiAoIXRoaXMuc3BlZWRDaG9pY2VzLnNvbWUoYyA9PiBjLmxhYmVsID09PSAnRmFzdCcpKSByZXR1cm4gJ05vIEZhc3QgZm9yIHRoaXMgcHJpbnQ6IGl0IGlzIGFscmVhZHkgYXMgZmFzdCBhcyB0aGUgbm96emxlIGNhbiBtZWx0IHRoZSBmaWxhbWVudC4nXG4gICAgcmV0dXJuICdTbG93IGlzIGhhbGYgc3BlZWQuIEZhc3QgaXMgYXMgZmFzdCBhcyB0aGUgbm96emxlIGNhbiBtZWx0IHRoZSBmaWxhbWVudC4nXG4gIH1cblxuICAvKiogVmVsb2NpdHksIGFjY2VsZXJhdGlvbiwgY29ybmVyIHNwZWVkLCBhbmQgd2hpY2hldmVyIGNydWlzZSBzZXR0aW5nIHRoaXMgS2xpcHBlciBoYXMuICovXG4gIGdldCBsaW1pdFJlYXNvbiAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJUaGlzIHByaW50ZXIgaGFzbid0IHJlcG9ydGVkIGl0cyBsaW1pdHNcIlxuICB9XG5cbiAgZ2V0IGxpbWl0cyAoKTogQXJyYXk8eyBrZXk6IExpbWl0S2V5LCBsYWJlbDogc3RyaW5nLCB2YWx1ZTogbnVtYmVyIHwgbnVsbCwgdW5pdDogc3RyaW5nLCBkZWNpbWFsczogbnVtYmVyLCBtYXg6IG51bWJlciB8IG51bGwgfT4ge1xuICAgIGNvbnN0IHQgPSB0aGlzLnRvb2xoZWFkXG4gICAgY29uc3Qgcm93ID0gKGtleTogTGltaXRLZXksIGxhYmVsOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIgfCBudWxsLCB1bml0OiBzdHJpbmcsIGRlY2ltYWxzOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IG1heCA9IHRoaXMubGltaXRNYXhpbXVtKGtleSlcbiAgICAgIHJldHVybiB7IGtleSwgbGFiZWwsIHZhbHVlLCB1bml0LCBkZWNpbWFscywgbWF4IH1cbiAgICB9XG4gICAgY29uc3QgbGlzdCA9IFtcbiAgICAgIHJvdygnVkVMT0NJVFknLCAnVmVsb2NpdHknLCB0Lm1heF92ZWxvY2l0eSA/PyBudWxsLCAnbW0vcycsIDApLFxuICAgICAgcm93KCdBQ0NFTCcsICdBY2NlbGVyYXRpb24nLCB0Lm1heF9hY2NlbCA/PyBudWxsLCAnbW0vc8KyJywgMCksXG4gICAgICByb3coJ1NRVUFSRV9DT1JORVJfVkVMT0NJVFknLCAnU3F1YXJlIGNvcm5lciB2ZWxvY2l0eScsIHQuc3F1YXJlX2Nvcm5lcl92ZWxvY2l0eSA/PyBudWxsLCAnbW0vcycsIDEpXG4gICAgXVxuICAgIGlmICh0eXBlb2YgdC5taW5pbXVtX2NydWlzZV9yYXRpbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IHJhdGlvID0gcm93KCdNSU5JTVVNX0NSVUlTRV9SQVRJTycsICdNaW5pbXVtIGNydWlzZSByYXRpbycsIHQubWluaW11bV9jcnVpc2VfcmF0aW8sICcnLCAyKVxuICAgICAgbGlzdC5wdXNoKHJhdGlvKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHQubWF4X2FjY2VsX3RvX2RlY2VsID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgYWNjZWxUb0RlY2VsID0gcm93KCdBQ0NFTF9UT19ERUNFTCcsICdBY2NlbCB0byBkZWNlbCcsIHQubWF4X2FjY2VsX3RvX2RlY2VsLCAnbW0vc8KyJywgMClcbiAgICAgIGxpc3QucHVzaChhY2NlbFRvRGVjZWwpXG4gICAgfVxuICAgIHJldHVybiBsaXN0XG4gIH1cblxuICBnZXQgcmV0cmFjdGlvbiAoKTogUmVjb3JkPFJldHJhY3Rpb25LZXksIG51bWJlcj4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmZpcm13YXJlX3JldHJhY3Rpb24gPz8gbnVsbFxuICB9XG5cbiAgZ2V0IHJldHJhY3Rpb25Sb3dzICgpOiBBcnJheTx7IGtleTogUmV0cmFjdGlvbktleSwgbGFiZWw6IHN0cmluZywgdmFsdWU6IG51bWJlciwgdW5pdDogc3RyaW5nLCBtYXg6IG51bWJlciwgZGVjaW1hbHM6IG51bWJlciB9PiB7XG4gICAgY29uc3QgciA9IHRoaXMucmV0cmFjdGlvblxuICAgIGlmICghcikgcmV0dXJuIFtdXG4gICAgcmV0dXJuIFtcbiAgICAgIHsga2V5OiAncmV0cmFjdF9sZW5ndGgnLCBsYWJlbDogJ1JldHJhY3QnLCB2YWx1ZTogci5yZXRyYWN0X2xlbmd0aCwgdW5pdDogJ21tJywgbWF4OiAxNSwgZGVjaW1hbHM6IDIgfSxcbiAgICAgIHsga2V5OiAncmV0cmFjdF9zcGVlZCcsIGxhYmVsOiAnUmV0cmFjdCBzcGVlZCcsIHZhbHVlOiByLnJldHJhY3Rfc3BlZWQsIHVuaXQ6ICdtbS9zJywgbWF4OiAyMDAsIGRlY2ltYWxzOiAwIH0sXG4gICAgICB7IGtleTogJ3VucmV0cmFjdF9leHRyYV9sZW5ndGgnLCBsYWJlbDogJ0V4dHJhIG9uIHRoZSB3YXkgYmFjaycsIHZhbHVlOiByLnVucmV0cmFjdF9leHRyYV9sZW5ndGgsIHVuaXQ6ICdtbScsIG1heDogNSwgZGVjaW1hbHM6IDIgfSxcbiAgICAgIHsga2V5OiAndW5yZXRyYWN0X3NwZWVkJywgbGFiZWw6ICdVbnJldHJhY3Qgc3BlZWQnLCB2YWx1ZTogci51bnJldHJhY3Rfc3BlZWQsIHVuaXQ6ICdtbS9zJywgbWF4OiAyMDAsIGRlY2ltYWxzOiAwIH1cbiAgICBdXG4gIH1cblxuICBzZXRSZXRyYWN0aW9uIChrZXk6IFJldHJhY3Rpb25LZXksIHZhbHVlOiBudW1iZXIpIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLnJldHJhY3Rpb25Sb3dzLmZpbmQociA9PiByLmtleSA9PT0ga2V5KVxuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgIXJvdyB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCB2YWx1ZSA8IChrZXkuZW5kc1dpdGgoJ3NwZWVkJykgPyAwLjEgOiAwKSB8fCB2YWx1ZSA+IHJvdy5tYXgpIHJldHVyblxuICAgIHRoaXMuc2VuZEdjb2RlKHJldHJhY3Rpb25Db21tYW5kKGtleSwgdmFsdWUpKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuc3BlZWRfX2N1c3RvbSB7IGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTsgdGV4dC1hbGlnbjogbGVmdDsgfVxuICAuc3BlZWRfX3JldHJhY3QgeyBmb250LXNpemU6IDE0cHg7IH1cbiAgLnNwZWVkX19saWZldGltZSB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyBmb250LXNpemU6IDEycHg7IH1cbiAgLmxpbWl0cyA+IC5jcm93ICsgLmNyb3cge1xuICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbFNwZWVkLnZ1ZSJ9