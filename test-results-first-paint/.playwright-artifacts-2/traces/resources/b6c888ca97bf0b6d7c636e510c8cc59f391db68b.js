/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import MaintenanceTile from "/src/components/maintenance/MaintenanceTile.vue";
import TonePill from "/src/components/printers/TonePill.vue";
import { checkStatus, daysAgo } from "/src/services/maintenance/model.ts";
import { attentionCount, healthRows } from "/src/services/maintenance/health.ts";
import { maintenancePage } from "/src/services/maintenance/page-state.ts";
import { meshFigures } from "/src/services/maintenance/heatmap.ts";
let MaintenanceHealth = class extends Mixins(MaintenanceMixin) {
  get supportsBedMesh() {
    return this.$store.getters["mesh/getSupportsBedMesh"];
  }
  get rows() {
    const printer = this.$store.state.printer.printer;
    const disk = this.$store.getters["files/getUsage"];
    const mcus = this.$store.getters["printer/getMcus"] ?? [];
    const heaters = this.$store.getters["printer/getHeaters"] ?? [];
    const meshAt = this.lastRun.bedMesh;
    const figures = meshFigures(this.mesh);
    return healthRows({
      socketConnected: !!this.$store.getters["socket/getConnectionState"],
      klippyState: this.$store.getters["printer/getKlippyState"],
      klippyReady: !!this.klippyReady,
      version: printer.info?.software_version,
      mcus: mcus.map((m) => ({ name: m.name, awake: Number(m.last_stats?.mcu_awake) })),
      heaters: heaters.map((h) => ({ name: h.name, temperature: h.temperature, maxTemp: h.maxTemp })),
      bedMesh: this.supportsBedMesh ? { loaded: this.meshMeasured, status: checkStatus("bedMesh", meshAt, Date.now()), spread: figures?.spread ?? null, measured: meshAt ? daysAgo(meshAt, Date.now()) : "" } : null,
      disk: disk ?? null
    });
  }
  get attention() {
    return attentionCount(this.rows);
  }
  share(rows) {
    maintenancePage.rows = rows;
    const runs = Object.values(this.lastRun).filter((t) => typeof t === "number");
    maintenancePage.lastRun = runs.length ? Math.max(...runs) : null;
  }
  beforeDestroy() {
    maintenancePage.rows = [];
    maintenancePage.lastRun = null;
  }
};
__decorateClass([
  Watch("rows", { immediate: true })
], MaintenanceHealth.prototype, "share", 1);
MaintenanceHealth = __decorateClass([
  Component({ components: { MaintenanceTile, TonePill } })
], MaintenanceHealth);
const _sfc_main = MaintenanceHealth;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Checks", "icon": "shield", "flush": "", "data-tid": "maintenance-checks" }, scopedSlots: _vm._u([{ key: "aside", fn: function() {
    return [_vm.rows.length ? _c("tone-pill", { attrs: { "tone": _vm.attention ? "warn" : "ok" } }, [_vm._v(" " + _vm._s(_vm.attention ? `${_vm.attention} needs attention` : "All clear") + " ")]) : _vm._e()];
  }, proxy: true }]) }, [_vm.rows.length ? _c("ul", { staticClass: "mhealth__list" }, _vm._l(_vm.rows, function(row) {
    return _c("li", { key: row.id, staticClass: "mhealth__row", attrs: { "data-tid": `health-${row.id}` } }, [_c("span", { staticClass: "mhealth__ico" }, [_c(__unplugin_components_0, { attrs: { "name": row.icon } })], 1), _c("span", { staticClass: "mhealth__text" }, [_c("span", { staticClass: "mhealth__title" }, [_vm._v(_vm._s(row.title))]), _c("span", { staticClass: "mhealth__sub" }, [_vm._v(_vm._s(row.sub))])]), _c("tone-pill", { attrs: { "tone": row.tone, "dot": false } }, [_vm._v(" " + _vm._s(row.pill) + " ")])], 1);
  }), 0) : _c("div", { staticClass: "mhealth__empty" }, [_c("span", { staticClass: "mhealth__ico" }, [_c(__unplugin_components_1, { attrs: { "name": "shield" } })], 1), _c("b", [_vm._v("Nothing to check yet")]), _c("p", [_vm._v("Checks appear here as soon as the printer connects.")])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MaintenanceHealth.vue?vue&type=style&index=0&scoped=1c9e6bc7&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "1c9e6bc7",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceHealth.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBbURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFVQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLGdDQUNBLDBLQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFWQTtBQUFBLEVBREE7QUFBQSxHQS9CQSxrQkFnQ0E7QUFoQ0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTWFpbnRlbmFuY2VIZWFsdGgudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPG1haW50ZW5hbmNlLXRpbGVcbiAgICB0aXRsZT1cIkNoZWNrc1wiXG4gICAgaWNvbj1cInNoaWVsZFwiXG4gICAgZmx1c2hcbiAgICBkYXRhLXRpZD1cIm1haW50ZW5hbmNlLWNoZWNrc1wiXG4gID5cbiAgICA8dGVtcGxhdGUgI2FzaWRlPlxuICAgICAgPHRvbmUtcGlsbFxuICAgICAgICB2LWlmPVwicm93cy5sZW5ndGhcIlxuICAgICAgICA6dG9uZT1cImF0dGVudGlvbiA/ICd3YXJuJyA6ICdvaydcIlxuICAgICAgPlxuICAgICAgICB7eyBhdHRlbnRpb24gPyBgJHthdHRlbnRpb259IG5lZWRzIGF0dGVudGlvbmAgOiAnQWxsIGNsZWFyJyB9fVxuICAgICAgPC90b25lLXBpbGw+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDx1bFxuICAgICAgdi1pZj1cInJvd3MubGVuZ3RoXCJcbiAgICAgIGNsYXNzPVwibWhlYWx0aF9fbGlzdFwiXG4gICAgPlxuICAgICAgPGxpXG4gICAgICAgIHYtZm9yPVwicm93IGluIHJvd3NcIlxuICAgICAgICA6a2V5PVwicm93LmlkXCJcbiAgICAgICAgY2xhc3M9XCJtaGVhbHRoX19yb3dcIlxuICAgICAgICA6ZGF0YS10aWQ9XCJgaGVhbHRoLSR7cm93LmlkfWBcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm1oZWFsdGhfX2ljb1wiPjxmcmFtZS1pY29uIDpuYW1lPVwicm93Lmljb25cIiAvPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJtaGVhbHRoX190ZXh0XCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtaGVhbHRoX190aXRsZVwiPnt7IHJvdy50aXRsZSB9fTwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cIm1oZWFsdGhfX3N1YlwiPnt7IHJvdy5zdWIgfX08L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPHRvbmUtcGlsbFxuICAgICAgICAgIDp0b25lPVwicm93LnRvbmVcIlxuICAgICAgICAgIDpkb3Q9XCJmYWxzZVwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyByb3cucGlsbCB9fVxuICAgICAgICA8L3RvbmUtcGlsbD5cbiAgICAgIDwvbGk+XG4gICAgPC91bD5cbiAgICA8ZGl2XG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwibWhlYWx0aF9fZW1wdHlcIlxuICAgID5cbiAgICAgIDxzcGFuIGNsYXNzPVwibWhlYWx0aF9faWNvXCI+PGZyYW1lLWljb24gbmFtZT1cInNoaWVsZFwiIC8+PC9zcGFuPlxuICAgICAgPGI+Tm90aGluZyB0byBjaGVjayB5ZXQ8L2I+XG4gICAgICA8cD5DaGVja3MgYXBwZWFyIGhlcmUgYXMgc29vbiBhcyB0aGUgcHJpbnRlciBjb25uZWN0cy48L3A+XG4gICAgPC9kaXY+XG4gIDwvbWFpbnRlbmFuY2UtdGlsZT5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFpbnRlbmFuY2UnXG5pbXBvcnQgTWFpbnRlbmFuY2VUaWxlIGZyb20gJy4vTWFpbnRlbmFuY2VUaWxlLnZ1ZSdcbmltcG9ydCBUb25lUGlsbCBmcm9tICdAL2NvbXBvbmVudHMvcHJpbnRlcnMvVG9uZVBpbGwudnVlJ1xuaW1wb3J0IHsgY2hlY2tTdGF0dXMsIGRheXNBZ28gfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL21vZGVsJ1xuaW1wb3J0IHsgYXR0ZW50aW9uQ291bnQsIGhlYWx0aFJvd3MsIHR5cGUgSGVhbHRoUm93IH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9oZWFsdGgnXG5pbXBvcnQgeyBtYWludGVuYW5jZVBhZ2UgfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL3BhZ2Utc3RhdGUnXG5pbXBvcnQgeyBtZXNoRmlndXJlcyB9IGZyb20gJ0Avc2VydmljZXMvbWFpbnRlbmFuY2UvaGVhdG1hcCdcbmltcG9ydCB0eXBlIHsgSGVhdGVyLCBNQ1UgfSBmcm9tICdAL3N0b3JlL3ByaW50ZXIvdHlwZXMnXG5cbi8qKlxuICogQ2hlY2tzOiB3aGF0IHRoZSBwcmludGVyIGNhbiBzYXkgYWJvdXQgaXRzZWxmIHdpdGhvdXQgbW92aW5nIG9yIHJ1bm5pbmcgYVxuICogdGVzdC4gS2xpcHBlciwgaXRzIGJvYXJkcywgdGhlIGhlYXRlciByZWFkaW5ncywgdGhlIGJlZCBtZXNoIGFuZCBzdG9yYWdlLFxuICogZWFjaCBhcyBhIHJvdyB3aXRoIGEgdmVyZGljdC4gVGhlIHRlc3RzIHRoYXQgbW92ZSB0aGUgaGVhZFxuICogbGl2ZSBpbiBDYWxpYnJhdGlvbi5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTWFpbnRlbmFuY2VUaWxlLCBUb25lUGlsbCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZUhlYWx0aCBleHRlbmRzIE1peGlucyhNYWludGVuYW5jZU1peGluKSB7XG4gIGdldCBzdXBwb3J0c0JlZE1lc2ggKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydtZXNoL2dldFN1cHBvcnRzQmVkTWVzaCddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIGdldCByb3dzICgpOiBIZWFsdGhSb3dbXSB7XG4gICAgY29uc3QgcHJpbnRlciA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlclxuICAgIGNvbnN0IGRpc2sgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydmaWxlcy9nZXRVc2FnZSddIGFzIHsgdXNlZDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBmcmVlOiBudW1iZXIgfSB8IHVuZGVmaW5lZFxuICAgIGNvbnN0IG1jdXMgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRNY3VzJ10gYXMgTUNVW10gfCB1bmRlZmluZWQpID8/IFtdXG4gICAgY29uc3QgaGVhdGVycyA9ICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEhlYXRlcnMnXSBhcyBIZWF0ZXJbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgICBjb25zdCBtZXNoQXQgPSB0aGlzLmxhc3RSdW4uYmVkTWVzaFxuICAgIGNvbnN0IGZpZ3VyZXMgPSBtZXNoRmlndXJlcyh0aGlzLm1lc2gpXG4gICAgcmV0dXJuIGhlYWx0aFJvd3Moe1xuICAgICAgc29ja2V0Q29ubmVjdGVkOiAhIXRoaXMuJHN0b3JlLmdldHRlcnNbJ3NvY2tldC9nZXRDb25uZWN0aW9uU3RhdGUnXSxcbiAgICAgIGtsaXBweVN0YXRlOiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEtsaXBweVN0YXRlJ10gYXMgc3RyaW5nLFxuICAgICAga2xpcHB5UmVhZHk6ICEhdGhpcy5rbGlwcHlSZWFkeSxcbiAgICAgIHZlcnNpb246IHByaW50ZXIuaW5mbz8uc29mdHdhcmVfdmVyc2lvbixcbiAgICAgIG1jdXM6IG1jdXMubWFwKG0gPT4gKHsgbmFtZTogbS5uYW1lLCBhd2FrZTogTnVtYmVyKG0ubGFzdF9zdGF0cz8ubWN1X2F3YWtlKSB9KSksXG4gICAgICBoZWF0ZXJzOiBoZWF0ZXJzLm1hcChoID0+ICh7IG5hbWU6IGgubmFtZSwgdGVtcGVyYXR1cmU6IGgudGVtcGVyYXR1cmUsIG1heFRlbXA6IGgubWF4VGVtcCB9KSksXG4gICAgICBiZWRNZXNoOiB0aGlzLnN1cHBvcnRzQmVkTWVzaFxuICAgICAgICA/IHsgbG9hZGVkOiB0aGlzLm1lc2hNZWFzdXJlZCwgc3RhdHVzOiBjaGVja1N0YXR1cygnYmVkTWVzaCcsIG1lc2hBdCwgRGF0ZS5ub3coKSksIHNwcmVhZDogZmlndXJlcz8uc3ByZWFkID8/IG51bGwsIG1lYXN1cmVkOiBtZXNoQXQgPyBkYXlzQWdvKG1lc2hBdCwgRGF0ZS5ub3coKSkgOiAnJyB9XG4gICAgICAgIDogbnVsbCxcbiAgICAgIGRpc2s6IGRpc2sgPz8gbnVsbFxuICAgIH0pXG4gIH1cblxuICBnZXQgYXR0ZW50aW9uICgpOiBudW1iZXIge1xuICAgIHJldHVybiBhdHRlbnRpb25Db3VudCh0aGlzLnJvd3MpXG4gIH1cblxuICAvKiogVGhlIGhlYWRlciBzYXlzIGhvdyB0aGUgcHJpbnRlciBzdGFuZHMsIGZyb20gdGhlc2Ugcm93cy4gKi9cbiAgQFdhdGNoKCdyb3dzJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgc2hhcmUgKHJvd3M6IEhlYWx0aFJvd1tdKSB7XG4gICAgbWFpbnRlbmFuY2VQYWdlLnJvd3MgPSByb3dzXG4gICAgY29uc3QgcnVucyA9IE9iamVjdC52YWx1ZXModGhpcy5sYXN0UnVuKS5maWx0ZXIoKHQpOiB0IGlzIG51bWJlciA9PiB0eXBlb2YgdCA9PT0gJ251bWJlcicpXG4gICAgbWFpbnRlbmFuY2VQYWdlLmxhc3RSdW4gPSBydW5zLmxlbmd0aCA/IE1hdGgubWF4KC4uLnJ1bnMpIDogbnVsbFxuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgbWFpbnRlbmFuY2VQYWdlLnJvd3MgPSBbXVxuICAgIG1haW50ZW5hbmNlUGFnZS5sYXN0UnVuID0gbnVsbFxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubWhlYWx0aF9fbGlzdCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDA7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgfVxuXG4gIC5taGVhbHRoX19yb3cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDE0cHg7XG4gICAgbWluLWhlaWdodDogNTJweDtcbiAgICBwYWRkaW5nOiAxMHB4IDE4cHg7XG5cbiAgICArIC5taGVhbHRoX19yb3cge1xuICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIH1cbiAgfVxuXG4gIC5taGVhbHRoX19pY28ge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZmxleDogbm9uZTtcbiAgICBwbGFjZS1pdGVtczogY2VudGVyO1xuICAgIHdpZHRoOiAzNnB4O1xuICAgIGhlaWdodDogMzZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAubWhlYWx0aF9fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgMDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5taGVhbHRoX190aXRsZSB7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAubWhlYWx0aF9fc3ViIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICB9XG5cbiAgLm1oZWFsdGhfX2VtcHR5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiAzMnB4IDE4cHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL21haW50ZW5hbmNlL01haW50ZW5hbmNlSGVhbHRoLnZ1ZSJ9