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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import MaintenanceTile from "/src/components/maintenance/MaintenanceTile.vue";
import { checkStatus, daysAgo } from "/src/services/maintenance/model.ts";
import { meshFigures, signedMm } from "/src/services/maintenance/heatmap.ts";
let BedFigures = class extends Mixins(MaintenanceMixin) {
  get figures() {
    return meshFigures(this.mesh);
  }
  get notice() {
    if (!this.figures) return null;
    const at = this.lastRun.bedMesh;
    const status = checkStatus("bedMesh", at, Date.now());
    if (status.due) {
      return {
        tone: "warn",
        text: at ? `Calibrated ${daysAgo(at, Date.now())}. Re-run after moving the printer.` : "Not calibrated from here yet. Re-run after moving the printer."
      };
    }
    const summary = this.meshSummary;
    if (summary && summary.tone !== "ok") return { tone: summary.tone === "err" ? "err" : "warn", text: summary.verdict };
    return { tone: "ok", text: `Calibrated ${at ? daysAgo(at, Date.now()) : "here"}. ${summary?.verdict ?? ""}`.trim() };
  }
  signedMm(value) {
    return signedMm(value);
  }
};
BedFigures = __decorateClass([
  Component({ components: { MaintenanceTile } })
], BedFigures);
const _sfc_main = BedFigures;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Mesh figures", "icon": "pulse", "data-tid": "bed-figures" } }, [_vm.figures ? _c("div", { staticClass: "bfig__stats" }, [_c("div", [_c("small", [_vm._v("Spread")]), _c("b", [_vm._v(_vm._s(_vm.figures.spread.toFixed(2)) + " mm")])]), _c("div", [_c("small", [_vm._v("Max")]), _c("b", [_vm._v(_vm._s(_vm.signedMm(_vm.figures.max)))])]), _c("div", [_c("small", [_vm._v("Min")]), _c("b", [_vm._v(_vm._s(_vm.signedMm(_vm.figures.min)))])]), _c("div", [_c("small", [_vm._v("Points")]), _c("b", [_vm._v(_vm._s(_vm.figures.columns) + " \xD7 " + _vm._s(_vm.figures.rows))])])]) : _c("p", { staticClass: "bfig__none" }, [_vm._v(" No measurement yet. ")]), _vm.notice ? _c("p", { staticClass: "bfig__callout", class: `bfig__callout--${_vm.notice.tone}`, attrs: { "data-tid": "bed-notice" } }, [_vm._v(" " + _vm._s(_vm.notice.text) + " ")]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/BedFigures.vue?vue&type=style&index=0&scoped=6d67f0fa&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "6d67f0fa",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/BedFigures.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQThDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBUUE7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXZCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJCZWRGaWd1cmVzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtYWludGVuYW5jZS10aWxlXG4gICAgdGl0bGU9XCJNZXNoIGZpZ3VyZXNcIlxuICAgIGljb249XCJwdWxzZVwiXG4gICAgZGF0YS10aWQ9XCJiZWQtZmlndXJlc1wiXG4gID5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiZmlndXJlc1wiXG4gICAgICBjbGFzcz1cImJmaWdfX3N0YXRzXCJcbiAgICA+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c21hbGw+U3ByZWFkPC9zbWFsbD5cbiAgICAgICAgPGI+e3sgZmlndXJlcy5zcHJlYWQudG9GaXhlZCgyKSB9fSBtbTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNtYWxsPk1heDwvc21hbGw+XG4gICAgICAgIDxiPnt7IHNpZ25lZE1tKGZpZ3VyZXMubWF4KSB9fTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNtYWxsPk1pbjwvc21hbGw+XG4gICAgICAgIDxiPnt7IHNpZ25lZE1tKGZpZ3VyZXMubWluKSB9fTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNtYWxsPlBvaW50czwvc21hbGw+XG4gICAgICAgIDxiPnt7IGZpZ3VyZXMuY29sdW1ucyB9fSDDlyB7eyBmaWd1cmVzLnJvd3MgfX08L2I+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8cFxuICAgICAgdi1lbHNlXG4gICAgICBjbGFzcz1cImJmaWdfX25vbmVcIlxuICAgID5cbiAgICAgIE5vIG1lYXN1cmVtZW50IHlldC5cbiAgICA8L3A+XG5cbiAgICA8cFxuICAgICAgdi1pZj1cIm5vdGljZVwiXG4gICAgICBjbGFzcz1cImJmaWdfX2NhbGxvdXRcIlxuICAgICAgOmNsYXNzPVwiYGJmaWdfX2NhbGxvdXQtLSR7bm90aWNlLnRvbmV9YFwiXG4gICAgICBkYXRhLXRpZD1cImJlZC1ub3RpY2VcIlxuICAgID5cbiAgICAgIHt7IG5vdGljZS50ZXh0IH19XG4gICAgPC9wPlxuICA8L21haW50ZW5hbmNlLXRpbGU+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFpbnRlbmFuY2UnXG5pbXBvcnQgTWFpbnRlbmFuY2VUaWxlIGZyb20gJy4vTWFpbnRlbmFuY2VUaWxlLnZ1ZSdcbmltcG9ydCB7IGNoZWNrU3RhdHVzLCBkYXlzQWdvIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9tb2RlbCdcbmltcG9ydCB7IG1lc2hGaWd1cmVzLCBzaWduZWRNbSwgdHlwZSBNZXNoRmlndXJlcyB9IGZyb20gJ0Avc2VydmljZXMvbWFpbnRlbmFuY2UvaGVhdG1hcCdcblxuLyoqXG4gKiBCZWQncyBmaWd1cmVzOiBob3cgZmFyIGFwYXJ0IHRoZSBwbGF0ZSdzIGhpZ2hlc3QgYW5kIGxvd2VzdCBwb2ludHMgYXJlLFxuICogdGhlIGdyaWQncyBzaXplLCBhbmQgYSBsaW5lIHdoZW4gdGhlIG1lc2ggaXMgb2xkIG9yIHNheXMgdGhlIHBsYXRlIGlzXG4gKiB1bmV2ZW4uXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE1haW50ZW5hbmNlVGlsZSB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZWRGaWd1cmVzIGV4dGVuZHMgTWl4aW5zKE1haW50ZW5hbmNlTWl4aW4pIHtcbiAgZ2V0IGZpZ3VyZXMgKCk6IE1lc2hGaWd1cmVzIHwgbnVsbCB7XG4gICAgcmV0dXJuIG1lc2hGaWd1cmVzKHRoaXMubWVzaClcbiAgfVxuXG4gIGdldCBub3RpY2UgKCk6IHsgdG9uZTogJ29rJyB8ICd3YXJuJyB8ICdlcnInLCB0ZXh0OiBzdHJpbmcgfSB8IG51bGwge1xuICAgIGlmICghdGhpcy5maWd1cmVzKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGF0ID0gdGhpcy5sYXN0UnVuLmJlZE1lc2hcbiAgICBjb25zdCBzdGF0dXMgPSBjaGVja1N0YXR1cygnYmVkTWVzaCcsIGF0LCBEYXRlLm5vdygpKVxuICAgIGlmIChzdGF0dXMuZHVlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b25lOiAnd2FybicsXG4gICAgICAgIHRleHQ6IGF0ID8gYENhbGlicmF0ZWQgJHtkYXlzQWdvKGF0LCBEYXRlLm5vdygpKX0uIFJlLXJ1biBhZnRlciBtb3ZpbmcgdGhlIHByaW50ZXIuYCA6ICdOb3QgY2FsaWJyYXRlZCBmcm9tIGhlcmUgeWV0LiBSZS1ydW4gYWZ0ZXIgbW92aW5nIHRoZSBwcmludGVyLidcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMubWVzaFN1bW1hcnlcbiAgICBpZiAoc3VtbWFyeSAmJiBzdW1tYXJ5LnRvbmUgIT09ICdvaycpIHJldHVybiB7IHRvbmU6IHN1bW1hcnkudG9uZSA9PT0gJ2VycicgPyAnZXJyJyA6ICd3YXJuJywgdGV4dDogc3VtbWFyeS52ZXJkaWN0IH1cbiAgICByZXR1cm4geyB0b25lOiAnb2snLCB0ZXh0OiBgQ2FsaWJyYXRlZCAke2F0ID8gZGF5c0FnbyhhdCwgRGF0ZS5ub3coKSkgOiAnaGVyZSd9LiAke3N1bW1hcnk/LnZlcmRpY3QgPz8gJyd9YC50cmltKCkgfVxuICB9XG5cbiAgc2lnbmVkTW0gKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBzaWduZWRNbSh2YWx1ZSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmJmaWdfX3N0YXRzIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDIsIG1pbm1heCgwLCAxZnIpKTtcbiAgICBnYXA6IDEwcHg7XG5cbiAgICA+IGRpdiB7XG4gICAgICBtaW4td2lkdGg6IDA7XG4gICAgICBwYWRkaW5nOiAxMHB4IDEycHg7XG4gICAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgfVxuXG4gICAgc21hbGwge1xuICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICB9XG5cbiAgICBiIHtcbiAgICAgIGZvbnQtc2l6ZTogMThweDtcbiAgICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gICAgfVxuICB9XG5cbiAgLmJmaWdfX25vbmUge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5iZmlnX19jYWxsb3V0IHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMTJweCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmJmaWdfX2NhbGxvdXQtLW9rIHsgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC1zdWNjZXNzKSAxMiUsIHRyYW5zcGFyZW50KTsgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzKTsgfVxuICAuYmZpZ19fY2FsbG91dC0td2FybiB7IGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtd2FybmluZykgMTIlLCB0cmFuc3BhcmVudCk7IGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7IH1cbiAgLmJmaWdfX2NhbGxvdXQtLWVyciB7IGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtZGFuZ2VyKSAxMiUsIHRyYW5zcGFyZW50KTsgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvQmVkRmlndXJlcy52dWUifQ==