/* unplugin-vue-components disabled */import __unplugin_components_3 from "/src/components/common/ManualProbeRecovery.vue";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
import ProbeAccuracyMixin from "/src/mixins/probe-accuracy.ts";
import MaintenanceTile from "/src/components/maintenance/MaintenanceTile.vue";
import MaintenanceDue from "/src/components/maintenance/MaintenanceDue.vue";
import MaintenanceResult from "/src/components/maintenance/MaintenanceResult.vue";
import TonePill from "/src/components/printers/TonePill.vue";
import ControlTuning from "/src/components/control/ControlTuning.vue";
import ControlTaskFold from "/src/components/control/ControlTaskFold.vue";
const ORDER = ["bedMesh", "shaper", "firstLayer", "pid"];
let MaintenanceCalibration = class extends Mixins(ProbeAccuracyMixin, BrowserMixin) {
  manualProbeDialogOpen = false;
  get hasProbe() {
    return !!this.$store.getters["printer/getProbe"];
  }
  onManualProbe(active) {
    if (active && this.klippyReady && !this.printerPrinting && !this.printerPaused) this.manualProbeDialogOpen = true;
  }
  onEvidence() {
    this.recordIfDone();
  }
  /** Why no Run works now: the checks' reason, and for the probe test its own (a test already under way). */
  get blockedReason() {
    return this.checksBlocked;
  }
  get rows() {
    const rows = [];
    if (this.hasProbe && "PROBE_ACCURACY" in this.gcodeCommands) {
      const accuracy = this.accuracy;
      rows.push({
        id: "probeAccuracy",
        title: "Probe accuracy",
        sub: accuracy ? `Spread ${Math.round(accuracy.stddev * 1e3)} \xB5m ${this.accuracyWhen}`.trim() : "Ten probes in the middle of the bed",
        description: "",
        action: "Run",
        due: false,
        busy: this.checking,
        disabled: !this.canCheck,
        details: null,
        run: () => {
          this.checkAccuracy();
        }
      });
    }
    for (const id of ORDER) {
      const check = this.checks.find((c) => c.id === id);
      if (!check) continue;
      rows.push({
        id,
        title: check.title,
        sub: this.runningId === id ? "Running\u2026" : check.status.text,
        description: check.description,
        action: check.action,
        due: check.status.due,
        busy: this.runningId === id,
        disabled: !!this.checksBlocked || !check.gcode,
        details: id === "shaper" ? "shaper" : id === "bedMesh" ? null : "result",
        run: () => {
          this.runCheck(check);
        }
      });
    }
    return rows;
  }
};
__decorateClass([
  Watch("isManualProbeActive")
], MaintenanceCalibration.prototype, "onManualProbe", 1);
__decorateClass([
  Watch("evidence", { immediate: true })
], MaintenanceCalibration.prototype, "onEvidence", 1);
MaintenanceCalibration = __decorateClass([
  Component({ components: { MaintenanceTile, MaintenanceDue, MaintenanceResult, TonePill, ControlTuning, ControlTaskFold } })
], MaintenanceCalibration);
const _sfc_main = MaintenanceCalibration;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Calibration", "icon": "firstLayer", "flush": "", "data-tid": "maintenance-calibration" }, scopedSlots: _vm._u([{ key: "aside", fn: function() {
    return [_c("maintenance-due")];
  }, proxy: true }]) }, [_vm.saveConfigPending ? _c("div", { staticClass: "mcal__save" }, [_c("span", [_vm._v("New results are kept until the printer restarts. Save them to keep them for good.")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !!_vm.saveBlocked, "title": _vm.saveBlocked || void 0 }, on: { "click": _vm.saveResults } }, [_vm._v(" Save ")])]) : _vm._e(), _vm.rows.length ? _c("ul", { staticClass: "mcal__list" }, _vm._l(_vm.rows, function(row) {
    return _c("li", { key: row.id, staticClass: "mcal__item", attrs: { "data-tid": `cal-${row.id}` } }, [_c("control-task-fold", { attrs: { "fold-key": `maintenance.${row.id}`, "title": row.title, "summary": "Values", "choice": "", "show-unsaved-note": false }, scopedSlots: _vm._u([{ key: "default", fn: function({ value: open, choose }) {
      return [_c("div", { staticClass: "mcal__row" }, [_c("span", { staticClass: "mcal__text" }, [_c("span", { staticClass: "mcal__title" }, [_vm._v(_vm._s(row.title))]), _c("span", { staticClass: "mcal__sub" }, [_vm._v(_vm._s(row.sub))])]), row.due ? _c("tone-pill", { attrs: { "tone": "warn", "dot": false } }, [_vm._v(" Due ")]) : _vm._e(), row.details ? _c("button", { staticClass: "mcal__more", attrs: { "type": "button", "aria-expanded": open ? "true" : "false", "aria-label": `${open ? "Hide" : "Show"} the values for ${row.title}`, "data-tid": `cal-more-${row.id}` }, on: { "click": function($event) {
        return choose(!open);
      } } }, [_c(__unplugin_components_0, { attrs: { "name": open ? "chevronUp" : "chevronDown" } })], 1) : _vm._e(), _c("button", { staticClass: "cbtn mcal__run", attrs: { "type": "button", "disabled": row.disabled, "title": row.disabled ? _vm.blockedReason : void 0, "aria-label": `${row.action} ${row.title}`, "data-tid": `cal-run-${row.id}` }, on: { "click": function($event) {
        return row.run();
      } } }, [_vm._v(" " + _vm._s(row.busy ? "Running\u2026" : row.action) + " ")])], 1), row.details && open ? _c("div", { staticClass: "mcal__details" }, [_c("p", { staticClass: "mcal__desc" }, [_vm._v(" " + _vm._s(row.description) + " ")]), row.details === "result" ? _c("maintenance-result", { attrs: { "check": row.id } }) : _c("control-tuning", { attrs: { "shaper-only": "" } })], 1) : _vm._e()];
    } }], null, true) })], 1);
  }), 0) : _c("div", { staticClass: "mcal__empty" }, [_c("span", { staticClass: "mcal__ico" }, [_c(__unplugin_components_1, { attrs: { "name": "firstLayer" } })], 1), _c("b", [_vm._v("No calibration to run from here")]), _c("p", [_vm._v("This printer has no probe, mesh or tuning commands yet.")])]), _vm.rows.length && _vm.blockedReason && !_vm.runningId ? _c("p", { staticClass: "mcal__blocked" }, [_c(__unplugin_components_2, { attrs: { "name": "lock", "small": "" } }), _vm._v(" " + _vm._s(_vm.blockedReason) + " ")], 1) : _vm._e(), _c(__unplugin_components_3, { model: { value: _vm.manualProbeDialogOpen, callback: function($$v) {
    _vm.manualProbeDialogOpen = $$v;
  }, expression: "manualProbeDialogOpen" } })], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MaintenanceCalibration.vue?vue&type=style&index=0&scoped=5f4c6021&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5f4c6021",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceCalibration.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUErSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBa0JBO0FBU0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUE7QUFBQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUE7QUFBQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEvQ0E7QUFBQSxFQURBO0FBQUEsR0FMQSx1QkFNQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBVkEsdUJBV0E7QUFYQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNYWludGVuYW5jZUNhbGlicmF0aW9uLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtYWludGVuYW5jZS10aWxlXG4gICAgdGl0bGU9XCJDYWxpYnJhdGlvblwiXG4gICAgaWNvbj1cImZpcnN0TGF5ZXJcIlxuICAgIGZsdXNoXG4gICAgZGF0YS10aWQ9XCJtYWludGVuYW5jZS1jYWxpYnJhdGlvblwiXG4gID5cbiAgICA8dGVtcGxhdGUgI2FzaWRlPlxuICAgICAgPG1haW50ZW5hbmNlLWR1ZSAvPlxuICAgIDwvdGVtcGxhdGU+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwic2F2ZUNvbmZpZ1BlbmRpbmdcIlxuICAgICAgY2xhc3M9XCJtY2FsX19zYXZlXCJcbiAgICA+XG4gICAgICA8c3Bhbj5OZXcgcmVzdWx0cyBhcmUga2VwdCB1bnRpbCB0aGUgcHJpbnRlciByZXN0YXJ0cy4gU2F2ZSB0aGVtIHRvIGtlZXAgdGhlbSBmb3IgZ29vZC48L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiEhc2F2ZUJsb2NrZWRcIlxuICAgICAgICA6dGl0bGU9XCJzYXZlQmxvY2tlZCB8fCB1bmRlZmluZWRcIlxuICAgICAgICBAY2xpY2s9XCJzYXZlUmVzdWx0c1wiXG4gICAgICA+XG4gICAgICAgIFNhdmVcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuXG4gICAgPHVsXG4gICAgICB2LWlmPVwicm93cy5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJtY2FsX19saXN0XCJcbiAgICA+XG4gICAgICA8bGlcbiAgICAgICAgdi1mb3I9XCJyb3cgaW4gcm93c1wiXG4gICAgICAgIDprZXk9XCJyb3cuaWRcIlxuICAgICAgICBjbGFzcz1cIm1jYWxfX2l0ZW1cIlxuICAgICAgICA6ZGF0YS10aWQ9XCJgY2FsLSR7cm93LmlkfWBcIlxuICAgICAgPlxuICAgICAgICA8Y29udHJvbC10YXNrLWZvbGRcbiAgICAgICAgICA6Zm9sZC1rZXk9XCJgbWFpbnRlbmFuY2UuJHtyb3cuaWR9YFwiXG4gICAgICAgICAgOnRpdGxlPVwicm93LnRpdGxlXCJcbiAgICAgICAgICBzdW1tYXJ5PVwiVmFsdWVzXCJcbiAgICAgICAgICBjaG9pY2VcbiAgICAgICAgICA6c2hvdy11bnNhdmVkLW5vdGU9XCJmYWxzZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8dGVtcGxhdGUgI2RlZmF1bHQ9XCJ7IHZhbHVlOiBvcGVuLCBjaG9vc2UgfVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1jYWxfX3Jvd1wiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm1jYWxfX3RleHRcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm1jYWxfX3RpdGxlXCI+e3sgcm93LnRpdGxlIH19PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibWNhbF9fc3ViXCI+e3sgcm93LnN1YiB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8dG9uZS1waWxsXG4gICAgICAgICAgICAgICAgdi1pZj1cInJvdy5kdWVcIlxuICAgICAgICAgICAgICAgIHRvbmU9XCJ3YXJuXCJcbiAgICAgICAgICAgICAgICA6ZG90PVwiZmFsc2VcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgRHVlXG4gICAgICAgICAgICAgIDwvdG9uZS1waWxsPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1pZj1cInJvdy5kZXRhaWxzXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cIm1jYWxfX21vcmVcIlxuICAgICAgICAgICAgICAgIDphcmlhLWV4cGFuZGVkPVwib3BlbiA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7b3BlbiA/ICdIaWRlJyA6ICdTaG93J30gdGhlIHZhbHVlcyBmb3IgJHtyb3cudGl0bGV9YFwiXG4gICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYGNhbC1tb3JlLSR7cm93LmlkfWBcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImNob29zZSghb3BlbilcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGZyYW1lLWljb24gOm5hbWU9XCJvcGVuID8gJ2NoZXZyb25VcCcgOiAnY2hldnJvbkRvd24nXCIgLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImNidG4gbWNhbF9fcnVuXCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJyb3cuZGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgIDp0aXRsZT1cInJvdy5kaXNhYmxlZCA/IGJsb2NrZWRSZWFzb24gOiB1bmRlZmluZWRcIlxuICAgICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYCR7cm93LmFjdGlvbn0gJHtyb3cudGl0bGV9YFwiXG4gICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYGNhbC1ydW4tJHtyb3cuaWR9YFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwicm93LnJ1bigpXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt7IHJvdy5idXN5ID8gJ1J1bm5pbmfigKYnIDogcm93LmFjdGlvbiB9fVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICB2LWlmPVwicm93LmRldGFpbHMgJiYgb3BlblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwibWNhbF9fZGV0YWlsc1wiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxwIGNsYXNzPVwibWNhbF9fZGVzY1wiPlxuICAgICAgICAgICAgICAgIHt7IHJvdy5kZXNjcmlwdGlvbiB9fVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDxtYWludGVuYW5jZS1yZXN1bHRcbiAgICAgICAgICAgICAgICB2LWlmPVwicm93LmRldGFpbHMgPT09ICdyZXN1bHQnXCJcbiAgICAgICAgICAgICAgICA6Y2hlY2s9XCJyb3cuaWRcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8Y29udHJvbC10dW5pbmdcbiAgICAgICAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICAgICAgICBzaGFwZXItb25seVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPC9jb250cm9sLXRhc2stZm9sZD5cbiAgICAgIDwvbGk+XG4gICAgPC91bD5cbiAgICA8ZGl2XG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwibWNhbF9fZW1wdHlcIlxuICAgID5cbiAgICAgIDxzcGFuIGNsYXNzPVwibWNhbF9faWNvXCI+PGZyYW1lLWljb24gbmFtZT1cImZpcnN0TGF5ZXJcIiAvPjwvc3Bhbj5cbiAgICAgIDxiPk5vIGNhbGlicmF0aW9uIHRvIHJ1biBmcm9tIGhlcmU8L2I+XG4gICAgICA8cD5UaGlzIHByaW50ZXIgaGFzIG5vIHByb2JlLCBtZXNoIG9yIHR1bmluZyBjb21tYW5kcyB5ZXQuPC9wPlxuICAgIDwvZGl2PlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCJyb3dzLmxlbmd0aCAmJiBibG9ja2VkUmVhc29uICYmICFydW5uaW5nSWRcIlxuICAgICAgY2xhc3M9XCJtY2FsX19ibG9ja2VkXCJcbiAgICA+XG4gICAgICA8ZnJhbWUtaWNvblxuICAgICAgICBuYW1lPVwibG9ja1wiXG4gICAgICAgIHNtYWxsXG4gICAgICAvPlxuICAgICAge3sgYmxvY2tlZFJlYXNvbiB9fVxuICAgIDwvcD5cblxuICAgIDxtYW51YWwtcHJvYmUtcmVjb3ZlcnlcbiAgICAgIHYtbW9kZWw9XCJtYW51YWxQcm9iZURpYWxvZ09wZW5cIlxuICAgIC8+XG4gIDwvbWFpbnRlbmFuY2UtdGlsZT5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IFByb2JlQWNjdXJhY3lNaXhpbiBmcm9tICdAL21peGlucy9wcm9iZS1hY2N1cmFjeSdcbmltcG9ydCBNYWludGVuYW5jZVRpbGUgZnJvbSAnLi9NYWludGVuYW5jZVRpbGUudnVlJ1xuaW1wb3J0IE1haW50ZW5hbmNlRHVlIGZyb20gJy4vTWFpbnRlbmFuY2VEdWUudnVlJ1xuaW1wb3J0IE1haW50ZW5hbmNlUmVzdWx0IGZyb20gJy4vTWFpbnRlbmFuY2VSZXN1bHQudnVlJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJ0AvY29tcG9uZW50cy9wcmludGVycy9Ub25lUGlsbC52dWUnXG5pbXBvcnQgQ29udHJvbFR1bmluZyBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sVHVuaW5nLnZ1ZSdcbmltcG9ydCBDb250cm9sVGFza0ZvbGQgZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbFRhc2tGb2xkLnZ1ZSdcbmltcG9ydCB0eXBlIHsgQ2hlY2tJZCB9IGZyb20gJ0Avc2VydmljZXMvbWFpbnRlbmFuY2UvbW9kZWwnXG5cbmludGVyZmFjZSBDYWxpYnJhdGlvblJvdyB7XG4gIGlkOiBDaGVja0lkIHwgJ3Byb2JlQWNjdXJhY3knO1xuICB0aXRsZTogc3RyaW5nO1xuICBzdWI6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIGR1ZTogYm9vbGVhbjtcbiAgYnVzeTogYm9vbGVhbjtcbiAgZGlzYWJsZWQ6IGJvb2xlYW47XG4gIC8qKiBWYWx1ZXMgdG8gb3BlbiB1bmRlciB0aGUgcm93OiBhIHJlc3VsdCBLbGlwcGVyIHJlcG9ydGVkLCBvciB0aGUgaW5wdXQgc2hhcGVyLiAqL1xuICBkZXRhaWxzOiAncmVzdWx0JyB8ICdzaGFwZXInIHwgbnVsbDtcbiAgcnVuOiAoKSA9PiB2b2lkO1xufVxuXG4vKiogVGhlIG9yZGVyIENhbGlicmF0aW9uIGxpc3RzIHRoZSBjaGVja3MgaW4gKFByb2JlIGFjY3VyYWN5IGdvZXMgZmlyc3QpLiAqL1xuY29uc3QgT1JERVI6IENoZWNrSWRbXSA9IFsnYmVkTWVzaCcsICdzaGFwZXInLCAnZmlyc3RMYXllcicsICdwaWQnXVxuXG4vKipcbiAqIENhbGlicmF0aW9uOiB0aGUgdGVzdHMgdGhhdCBtb3ZlIHRoZSBoZWFkIG9yIGhlYXQgdGhlIG5venpsZSwgZWFjaCBhIHJvd1xuICogd2l0aCBhIFJ1biBidXR0b24uIEV2ZXJ5IFJ1biBhc2tzIGZpcnN0ICh3aGF0IGl0IHdpbGwgZG8sIHRoZSBwbGF0ZSBjaGVjayksXG4gKiBhbmQgaXMgb2ZmIHdoaWxlIHRoZSBwcmludGVyIGlzIGJ1c3kgb3IgcHJpbnRpbmc6IHRoZSBjaGVja3MgYW5kIHByb2JlXG4gKiBhY2N1cmFjeSBrZWVwIHRoZSBjb25maXJtYXRpb24sIGhvbWVkIGFuZCBuby1nbyBwYXRocyB0aGV5IGFsd2F5cyBoYWQuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE1haW50ZW5hbmNlVGlsZSwgTWFpbnRlbmFuY2VEdWUsIE1haW50ZW5hbmNlUmVzdWx0LCBUb25lUGlsbCwgQ29udHJvbFR1bmluZywgQ29udHJvbFRhc2tGb2xkIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1haW50ZW5hbmNlQ2FsaWJyYXRpb24gZXh0ZW5kcyBNaXhpbnMoUHJvYmVBY2N1cmFjeU1peGluLCBCcm93c2VyTWl4aW4pIHtcbiAgbWFudWFsUHJvYmVEaWFsb2dPcGVuID0gZmFsc2VcblxuICBnZXQgaGFzUHJvYmUgKCk6IGJvb2xlYW4geyByZXR1cm4gISF0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByb2JlJ10gfVxuXG4gIEBXYXRjaCgnaXNNYW51YWxQcm9iZUFjdGl2ZScpXG4gIG9uTWFudWFsUHJvYmUgKGFjdGl2ZTogYm9vbGVhbikge1xuICAgIGlmIChhY3RpdmUgJiYgdGhpcy5rbGlwcHlSZWFkeSAmJiAhdGhpcy5wcmludGVyUHJpbnRpbmcgJiYgIXRoaXMucHJpbnRlclBhdXNlZCkgdGhpcy5tYW51YWxQcm9iZURpYWxvZ09wZW4gPSB0cnVlXG4gIH1cblxuICBAV2F0Y2goJ2V2aWRlbmNlJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25FdmlkZW5jZSAoKSB7XG4gICAgdGhpcy5yZWNvcmRJZkRvbmUoKVxuICB9XG5cbiAgLyoqIFdoeSBubyBSdW4gd29ya3Mgbm93OiB0aGUgY2hlY2tzJyByZWFzb24sIGFuZCBmb3IgdGhlIHByb2JlIHRlc3QgaXRzIG93biAoYSB0ZXN0IGFscmVhZHkgdW5kZXIgd2F5KS4gKi9cbiAgZ2V0IGJsb2NrZWRSZWFzb24gKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmNoZWNrc0Jsb2NrZWQgfVxuXG4gIGdldCByb3dzICgpOiBDYWxpYnJhdGlvblJvd1tdIHtcbiAgICBjb25zdCByb3dzOiBDYWxpYnJhdGlvblJvd1tdID0gW11cbiAgICBpZiAodGhpcy5oYXNQcm9iZSAmJiAnUFJPQkVfQUNDVVJBQ1knIGluIHRoaXMuZ2NvZGVDb21tYW5kcykge1xuICAgICAgY29uc3QgYWNjdXJhY3kgPSB0aGlzLmFjY3VyYWN5XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBpZDogJ3Byb2JlQWNjdXJhY3knLFxuICAgICAgICB0aXRsZTogJ1Byb2JlIGFjY3VyYWN5JyxcbiAgICAgICAgc3ViOiBhY2N1cmFjeSA/IGBTcHJlYWQgJHtNYXRoLnJvdW5kKGFjY3VyYWN5LnN0ZGRldiAqIDEwMDApfSDCtW0gJHt0aGlzLmFjY3VyYWN5V2hlbn1gLnRyaW0oKSA6ICdUZW4gcHJvYmVzIGluIHRoZSBtaWRkbGUgb2YgdGhlIGJlZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgYWN0aW9uOiAnUnVuJyxcbiAgICAgICAgZHVlOiBmYWxzZSxcbiAgICAgICAgYnVzeTogdGhpcy5jaGVja2luZyxcbiAgICAgICAgZGlzYWJsZWQ6ICF0aGlzLmNhbkNoZWNrLFxuICAgICAgICBkZXRhaWxzOiBudWxsLFxuICAgICAgICBydW46ICgpID0+IHsgdGhpcy5jaGVja0FjY3VyYWN5KCkgfVxuICAgICAgfSlcbiAgICB9XG4gICAgZm9yIChjb25zdCBpZCBvZiBPUkRFUikge1xuICAgICAgY29uc3QgY2hlY2sgPSB0aGlzLmNoZWNrcy5maW5kKGMgPT4gYy5pZCA9PT0gaWQpXG4gICAgICBpZiAoIWNoZWNrKSBjb250aW51ZVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgaWQsXG4gICAgICAgIHRpdGxlOiBjaGVjay50aXRsZSxcbiAgICAgICAgc3ViOiB0aGlzLnJ1bm5pbmdJZCA9PT0gaWQgPyAnUnVubmluZ+KApicgOiBjaGVjay5zdGF0dXMudGV4dCxcbiAgICAgICAgZGVzY3JpcHRpb246IGNoZWNrLmRlc2NyaXB0aW9uLFxuICAgICAgICBhY3Rpb246IGNoZWNrLmFjdGlvbixcbiAgICAgICAgZHVlOiBjaGVjay5zdGF0dXMuZHVlLFxuICAgICAgICBidXN5OiB0aGlzLnJ1bm5pbmdJZCA9PT0gaWQsXG4gICAgICAgIGRpc2FibGVkOiAhIXRoaXMuY2hlY2tzQmxvY2tlZCB8fCAhY2hlY2suZ2NvZGUsXG4gICAgICAgIGRldGFpbHM6IGlkID09PSAnc2hhcGVyJyA/ICdzaGFwZXInIDogaWQgPT09ICdiZWRNZXNoJyA/IG51bGwgOiAncmVzdWx0JyxcbiAgICAgICAgcnVuOiAoKSA9PiB7IHRoaXMucnVuQ2hlY2soY2hlY2spIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiByb3dzXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5tY2FsX19zYXZlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweCAxMnB4O1xuICAgIG1hcmdpbjogMCAxOHB4O1xuICAgIHBhZGRpbmc6IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcblxuICAgIHNwYW4ge1xuICAgICAgZmxleDogMSAxIDE4MHB4O1xuICAgIH1cbiAgfVxuXG4gIC5tY2FsX19saXN0IHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMDtcbiAgICBsaXN0LXN0eWxlOiBub25lO1xuICB9XG5cbiAgLm1jYWxfX2l0ZW0gKyAubWNhbF9faXRlbSB7XG4gICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICB9XG5cbiAgLm1jYWxfX3JvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtaW4taGVpZ2h0OiA1MnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMThweDtcbiAgfVxuXG4gIC5tY2FsX190ZXh0IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDEgMSAwO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLm1jYWxfX3RpdGxlIHtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5tY2FsX19zdWIge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLm1jYWxfX21vcmUge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZmxleDogbm9uZTtcbiAgICBwbGFjZS1pdGVtczogY2VudGVyO1xuICAgIHdpZHRoOiAzMnB4O1xuICAgIGhlaWdodDogMzJweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC5tY2FsX19ydW4ge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgbWluLXdpZHRoOiA2NHB4O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICB9XG5cbiAgLm1jYWxfX2RldGFpbHMge1xuICAgIHBhZGRpbmc6IDAgMThweCAxMnB4O1xuICB9XG5cbiAgLm1jYWxfX2Rlc2Mge1xuICAgIG1hcmdpbjogMCAwIDhweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5tY2FsX19ibG9ja2VkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgbWFyZ2luOiA0cHggMThweCA4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLm1jYWxfX2VtcHR5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiAyOHB4IDE4cHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5tY2FsX19pY28ge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDM2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvTWFpbnRlbmFuY2VDYWxpYnJhdGlvbi52dWUifQ==