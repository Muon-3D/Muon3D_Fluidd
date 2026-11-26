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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
import TypedCommandsMixin from "/src/mixins/typed-commands.ts";
import MaintenanceHealth from "/src/components/maintenance/MaintenanceHealth.vue";
import MaintenanceMesh from "/src/components/maintenance/MaintenanceMesh.vue";
import MaintenanceCalibration from "/src/components/maintenance/MaintenanceCalibration.vue";
import MaintenanceConsumables from "/src/components/maintenance/MaintenanceConsumables.vue";
import MaintenanceWear from "/src/components/maintenance/MaintenanceWear.vue";
import ControlOutputs from "/src/components/control/ControlOutputs.vue";
import ControlTaskFold from "/src/components/control/ControlTaskFold.vue";
import ProbeCard from "/src/components/maintenance/ProbeCard.vue";
import { SENSORS_QUERY } from "/src/services/control/sensors-link.ts";
let Maintenance = class extends Mixins(BrowserMixin, TypedCommandsMixin) {
  /** A filament action sent someone here for the sensors (?sensors=open, KAN-1697). */
  get sensorsAsked() {
    return this.$route?.query?.[SENSORS_QUERY] === "open";
  }
  mounted() {
    if (!this.sensorsAsked) return;
    this.$nextTick(() => {
      const fold = this.$el?.querySelector?.('[data-tid="maintenance-sensors"]');
      fold?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    });
  }
  get supportsBedMesh() {
    return this.$store.getters["mesh/getSupportsBedMesh"];
  }
  /** A probe without a [bed_mesh] has no Bed page: its Query probe and Z offset stay here. */
  get hasProbe() {
    return !!this.$store.getters["printer/getProbe"];
  }
};
Maintenance = __decorateClass([
  Component({ components: { MaintenanceHealth, MaintenanceMesh, MaintenanceCalibration, MaintenanceConsumables, MaintenanceWear, ControlOutputs, ControlTaskFold, ProbeCard } })
], Maintenance);
const _sfc_main = Maintenance;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { key: _vm.commandTarget, staticClass: "maintenance-page", class: { "maintenance-page--phone": _vm.isMobileViewport }, attrs: { "data-tid": "maintenance-page" } }, [_c("maintenance-health", { staticClass: "maintenance-page__checks", class: { "maintenance-page__checks--alone": !_vm.supportsBedMesh && !_vm.hasProbe } }), _vm.supportsBedMesh ? _c("maintenance-mesh", { staticClass: "maintenance-page__mesh" }) : _vm.hasProbe ? _c("probe-card", { staticClass: "maintenance-page__mesh" }) : _vm._e(), _c("maintenance-calibration", { staticClass: "maintenance-page__third" }), _c("maintenance-consumables", { staticClass: "maintenance-page__third" }), _c("maintenance-wear", { staticClass: "maintenance-page__third maintenance-page__wear" }), _c("control-task-fold", { staticClass: "maintenance-page__wide", attrs: { "fold-key": "maintenance.sensors", "title": "Switches and sensors", "summary": "Endstops, probe and filament state", "expand": _vm.sensorsAsked, "data-tid": "maintenance-sensors" } }, [_c("control-outputs", { attrs: { "diagnostics-only": "" } })], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Maintenance.vue?vue&type=style&index=0&scoped=b0e6c6f9&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "b0e6c6f9",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Maintenance.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFXQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBdEJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk1haW50ZW5hbmNlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICA6a2V5PVwiY29tbWFuZFRhcmdldFwiXG4gICAgY2xhc3M9XCJtYWludGVuYW5jZS1wYWdlXCJcbiAgICA6Y2xhc3M9XCJ7ICdtYWludGVuYW5jZS1wYWdlLS1waG9uZSc6IGlzTW9iaWxlVmlld3BvcnQgfVwiXG4gICAgZGF0YS10aWQ9XCJtYWludGVuYW5jZS1wYWdlXCJcbiAgPlxuICAgIDxtYWludGVuYW5jZS1oZWFsdGhcbiAgICAgIGNsYXNzPVwibWFpbnRlbmFuY2UtcGFnZV9fY2hlY2tzXCJcbiAgICAgIDpjbGFzcz1cInsgJ21haW50ZW5hbmNlLXBhZ2VfX2NoZWNrcy0tYWxvbmUnOiAhc3VwcG9ydHNCZWRNZXNoICYmICFoYXNQcm9iZSB9XCJcbiAgICAvPlxuICAgIDxtYWludGVuYW5jZS1tZXNoXG4gICAgICB2LWlmPVwic3VwcG9ydHNCZWRNZXNoXCJcbiAgICAgIGNsYXNzPVwibWFpbnRlbmFuY2UtcGFnZV9fbWVzaFwiXG4gICAgLz5cbiAgICA8cHJvYmUtY2FyZFxuICAgICAgdi1lbHNlLWlmPVwiaGFzUHJvYmVcIlxuICAgICAgY2xhc3M9XCJtYWludGVuYW5jZS1wYWdlX19tZXNoXCJcbiAgICAvPlxuICAgIDxtYWludGVuYW5jZS1jYWxpYnJhdGlvbiBjbGFzcz1cIm1haW50ZW5hbmNlLXBhZ2VfX3RoaXJkXCIgLz5cbiAgICA8bWFpbnRlbmFuY2UtY29uc3VtYWJsZXMgY2xhc3M9XCJtYWludGVuYW5jZS1wYWdlX190aGlyZFwiIC8+XG4gICAgPG1haW50ZW5hbmNlLXdlYXIgY2xhc3M9XCJtYWludGVuYW5jZS1wYWdlX190aGlyZCBtYWludGVuYW5jZS1wYWdlX193ZWFyXCIgLz5cbiAgICA8Y29udHJvbC10YXNrLWZvbGRcbiAgICAgIGZvbGQta2V5PVwibWFpbnRlbmFuY2Uuc2Vuc29yc1wiXG4gICAgICB0aXRsZT1cIlN3aXRjaGVzIGFuZCBzZW5zb3JzXCJcbiAgICAgIHN1bW1hcnk9XCJFbmRzdG9wcywgcHJvYmUgYW5kIGZpbGFtZW50IHN0YXRlXCJcbiAgICAgIGNsYXNzPVwibWFpbnRlbmFuY2UtcGFnZV9fd2lkZVwiXG4gICAgICA6ZXhwYW5kPVwic2Vuc29yc0Fza2VkXCJcbiAgICAgIGRhdGEtdGlkPVwibWFpbnRlbmFuY2Utc2Vuc29yc1wiXG4gICAgPlxuICAgICAgPGNvbnRyb2wtb3V0cHV0cyBkaWFnbm9zdGljcy1vbmx5IC8+XG4gICAgPC9jb250cm9sLXRhc2stZm9sZD5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IFR5cGVkQ29tbWFuZHNNaXhpbiBmcm9tICdAL21peGlucy90eXBlZC1jb21tYW5kcydcbmltcG9ydCBNYWludGVuYW5jZUhlYWx0aCBmcm9tICdAL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvTWFpbnRlbmFuY2VIZWFsdGgudnVlJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWVzaCBmcm9tICdAL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvTWFpbnRlbmFuY2VNZXNoLnZ1ZSdcbmltcG9ydCBNYWludGVuYW5jZUNhbGlicmF0aW9uIGZyb20gJ0AvY29tcG9uZW50cy9tYWludGVuYW5jZS9NYWludGVuYW5jZUNhbGlicmF0aW9uLnZ1ZSdcbmltcG9ydCBNYWludGVuYW5jZUNvbnN1bWFibGVzIGZyb20gJ0AvY29tcG9uZW50cy9tYWludGVuYW5jZS9NYWludGVuYW5jZUNvbnN1bWFibGVzLnZ1ZSdcbmltcG9ydCBNYWludGVuYW5jZVdlYXIgZnJvbSAnQC9jb21wb25lbnRzL21haW50ZW5hbmNlL01haW50ZW5hbmNlV2Vhci52dWUnXG5pbXBvcnQgQ29udHJvbE91dHB1dHMgZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbE91dHB1dHMudnVlJ1xuaW1wb3J0IENvbnRyb2xUYXNrRm9sZCBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9Db250cm9sVGFza0ZvbGQudnVlJ1xuaW1wb3J0IFByb2JlQ2FyZCBmcm9tICdAL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvUHJvYmVDYXJkLnZ1ZSdcbmltcG9ydCB7IFNFTlNPUlNfUVVFUlkgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvc2Vuc29ycy1saW5rJ1xuXG4vKipcbiAqIEhlYWx0aCAoYC9ib3h3b29kLTM2N2EvbWFpbnRlbmFuY2VgKTogd2hhdCBrZWVwcyBwcmludHMgY29taW5nIG91dCByaWdodCxcbiAqIGFzIHRpbGVzLiBDaGVja3MgYW5kIHRoZSBiZWQgbWVzaCBzaXQgc2lkZSBieSBzaWRlOyBDYWxpYnJhdGlvbiwgdGhlXG4gKiBjb25zdW1hYmxlcyBhbmQgdGhlIHByaW50ZXIncyB3ZWFyIGFyZSB0aGUgc2Vjb25kIHJvdywgYW5kIHRoZSBzd2l0Y2hlc1xuICogYW5kIHNlbnNvcnMgKGVuZHN0b3BzLCBmaWxhbWVudCkgY2xvc2UgdGhlIHBhZ2UsIGZvbGRlZC4gVGhlIGJlZCBtZXNoIGlzIGhlcmVcbiAqIG9uY2UsIGFzIGEgc21hbGwgbWFwIHdpdGggYSB3YXkgaW50byBCZWQ7IG9uIGEgcHJpbnRlciB3aXRoIGEgcHJvYmUgYnV0IG5vXG4gKiBiZWQgbWVzaCwgdGhlIFByb2JlIHRpbGUgdGFrZXMgaXRzIHBsYWNlLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNYWludGVuYW5jZUhlYWx0aCwgTWFpbnRlbmFuY2VNZXNoLCBNYWludGVuYW5jZUNhbGlicmF0aW9uLCBNYWludGVuYW5jZUNvbnN1bWFibGVzLCBNYWludGVuYW5jZVdlYXIsIENvbnRyb2xPdXRwdXRzLCBDb250cm9sVGFza0ZvbGQsIFByb2JlQ2FyZCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZSBleHRlbmRzIE1peGlucyhCcm93c2VyTWl4aW4sIFR5cGVkQ29tbWFuZHNNaXhpbikge1xuICAvKiogQSBmaWxhbWVudCBhY3Rpb24gc2VudCBzb21lb25lIGhlcmUgZm9yIHRoZSBzZW5zb3JzICg/c2Vuc29ycz1vcGVuLCBLQU4tMTY5NykuICovXG4gIGdldCBzZW5zb3JzQXNrZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRyb3V0ZT8ucXVlcnk/LltTRU5TT1JTX1FVRVJZXSA9PT0gJ29wZW4nXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICBpZiAoIXRoaXMuc2Vuc29yc0Fza2VkKSByZXR1cm5cbiAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICBjb25zdCBmb2xkID0gdGhpcy4kZWw/LnF1ZXJ5U2VsZWN0b3I/LignW2RhdGEtdGlkPVwibWFpbnRlbmFuY2Utc2Vuc29yc1wiXScpIGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuICAgICAgZm9sZD8uc2Nyb2xsSW50b1ZpZXc/Lih7IGJsb2NrOiAnc3RhcnQnLCBiZWhhdmlvcjogJ3Ntb290aCcgfSlcbiAgICB9KVxuICB9XG5cbiAgZ2V0IHN1cHBvcnRzQmVkTWVzaCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ21lc2gvZ2V0U3VwcG9ydHNCZWRNZXNoJ10gYXMgYm9vbGVhblxuICB9XG5cbiAgLyoqIEEgcHJvYmUgd2l0aG91dCBhIFtiZWRfbWVzaF0gaGFzIG5vIEJlZCBwYWdlOiBpdHMgUXVlcnkgcHJvYmUgYW5kIFogb2Zmc2V0IHN0YXkgaGVyZS4gKi9cbiAgZ2V0IGhhc1Byb2JlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByb2JlJ11cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLy8gMTIgY29sdW1ucyBvbiBhIGRlc2t0b3AsIDYgb24gYSB0YWJsZXQsIG9uZSBvbiBhIHBob25lOyBhIDE2IHB4IGdhcCB0aHJvdWdob3V0LlxuICAubWFpbnRlbmFuY2UtcGFnZSB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgxMiwgbWlubWF4KDAsIDFmcikpO1xuICAgIGdhcDogMTZweDtcbiAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAubWFpbnRlbmFuY2UtcGFnZV9fY2hlY2tzIHsgZ3JpZC1jb2x1bW46IHNwYW4gODsgfVxuICAubWFpbnRlbmFuY2UtcGFnZV9fbWVzaCB7IGdyaWQtY29sdW1uOiBzcGFuIDQ7IH1cbiAgLm1haW50ZW5hbmNlLXBhZ2VfX3RoaXJkIHsgZ3JpZC1jb2x1bW46IHNwYW4gNDsgfVxuICAubWFpbnRlbmFuY2UtcGFnZV9fd2lkZSB7IGdyaWQtY29sdW1uOiBzcGFuIDEyOyB9XG5cbiAgLy8gV2l0aG91dCBhIGJlZCBtZXNoLCBDaGVja3MgaGFzIHRoZSByb3cgdG8gaXRzZWxmLlxuICAubWFpbnRlbmFuY2UtcGFnZV9fY2hlY2tzLS1hbG9uZSB7IGdyaWQtY29sdW1uOiBzcGFuIDEyOyB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDEwMjNweCkge1xuICAgIC5tYWludGVuYW5jZS1wYWdlIHsgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoNiwgbWlubWF4KDAsIDFmcikpOyB9XG4gICAgLm1haW50ZW5hbmNlLXBhZ2VfX2NoZWNrcyxcbiAgICAubWFpbnRlbmFuY2UtcGFnZV9fbWVzaCxcbiAgICAubWFpbnRlbmFuY2UtcGFnZV9fd2lkZSB7IGdyaWQtY29sdW1uOiBzcGFuIDY7IH1cbiAgICAubWFpbnRlbmFuY2UtcGFnZV9fdGhpcmQgeyBncmlkLWNvbHVtbjogc3BhbiAzOyB9XG4gICAgLm1haW50ZW5hbmNlLXBhZ2VfX3dlYXIgeyBncmlkLWNvbHVtbjogc3BhbiA2OyB9XG4gIH1cblxuICBAbWVkaWEgKG1heC13aWR0aDogNjk5cHgpIHtcbiAgICAubWFpbnRlbmFuY2UtcGFnZSB7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KDAsIDFmcik7IGdhcDogMTJweDsgfVxuICAgIC5tYWludGVuYW5jZS1wYWdlX19jaGVja3MsXG4gICAgLm1haW50ZW5hbmNlLXBhZ2VfX21lc2gsXG4gICAgLm1haW50ZW5hbmNlLXBhZ2VfX3RoaXJkLFxuICAgIC5tYWludGVuYW5jZS1wYWdlX193aWRlLFxuICAgIC5tYWludGVuYW5jZS1wYWdlX193ZWFyIHsgZ3JpZC1jb2x1bW46IGF1dG87IH1cbiAgfVxuXG4gIC5tYWludGVuYW5jZS1wYWdlLS1waG9uZSB7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiBtaW5tYXgoMCwgMWZyKTtcbiAgICBnYXA6IDEycHg7XG5cbiAgICA+ICogeyBncmlkLWNvbHVtbjogYXV0bzsgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL3ZpZXdzL01haW50ZW5hbmNlLnZ1ZSJ9