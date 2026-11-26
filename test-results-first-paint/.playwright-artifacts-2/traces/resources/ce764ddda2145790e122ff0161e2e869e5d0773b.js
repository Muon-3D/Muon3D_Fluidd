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
import { NOZZLE_SERVICE_HOURS, PLATE_SERVICE_PRINTS, spoolLeft, usageOf } from "/src/services/maintenance/consumables.ts";
let MaintenanceConsumables = class extends Mixins(MaintenanceMixin) {
  get spool() {
    return this.$store.getters["spoolman/getActiveSpool"];
  }
  get rows() {
    const hours = this.printHours;
    const prints = this.printCount;
    const spoolPercent = this.spool ? spoolLeft(this.spool.remaining_weight, this.spool.filament?.weight) : null;
    const loaded = this.loadedMaterial;
    const material = this.spool?.filament?.material ?? loaded?.name ?? this.printingWith?.name;
    const colour = this.spool?.filament?.color_hex ? `#${this.spool.filament.color_hex.replace("#", "")}` : loaded?.colour ?? this.printingWith?.colour ?? void 0;
    return [
      {
        id: "nozzle",
        title: "Nozzle",
        value: hours === null ? "Hours unavailable" : `${hours} of ${NOZZLE_SERVICE_HOURS} h`,
        usage: usageOf(hours, NOZZLE_SERVICE_HOURS)
      },
      {
        id: "plate",
        title: "Build plate",
        value: prints === null ? "Prints unavailable" : `${prints} of ${PLATE_SERVICE_PRINTS} prints`,
        usage: usageOf(prints, PLATE_SERVICE_PRINTS)
      },
      {
        id: "filament",
        title: material ? `Filament, ${material}` : "Filament",
        value: spoolPercent !== null ? `${spoolPercent}% left` : material ? "Loaded" : "None set",
        usage: spoolPercent === null ? null : { percent: spoolPercent, tone: "ok" },
        colour
      }
    ];
  }
};
MaintenanceConsumables = __decorateClass([
  Component({ components: { MaintenanceTile } })
], MaintenanceConsumables);
const _sfc_main = MaintenanceConsumables;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Consumables", "icon": "nozzle", "data-tid": "maintenance-consumables" } }, _vm._l(_vm.rows, function(row) {
    return _c("div", { key: row.id, staticClass: "mcons__item", attrs: { "data-tid": `consumable-${row.id}` } }, [_c("div", { staticClass: "mcons__label" }, [_c("b", [row.colour ? _c("i", { staticClass: "mcons__dot", style: { background: row.colour } }) : _vm._e(), _vm._v(" " + _vm._s(row.title) + " ")]), _c("span", [_vm._v(_vm._s(row.value))])]), row.usage ? _c("div", { staticClass: "mcons__bar", attrs: { "role": "progressbar", "aria-label": row.title, "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": row.usage.percent } }, [_c("i", { class: { "mcons__fill--warn": row.usage.tone === "warn" }, style: { width: `${row.usage.percent}%` } })]) : _vm._e()]);
  }), 0);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MaintenanceConsumables.vue?vue&type=style&index=0&scoped=696d7d0d&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "696d7d0d",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceConsumables.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTBDQTtBQUNBO0FBQ0E7QUFDQTtBQWtCQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWxDQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNYWludGVuYW5jZUNvbnN1bWFibGVzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtYWludGVuYW5jZS10aWxlXG4gICAgdGl0bGU9XCJDb25zdW1hYmxlc1wiXG4gICAgaWNvbj1cIm5venpsZVwiXG4gICAgZGF0YS10aWQ9XCJtYWludGVuYW5jZS1jb25zdW1hYmxlc1wiXG4gID5cbiAgICA8ZGl2XG4gICAgICB2LWZvcj1cInJvdyBpbiByb3dzXCJcbiAgICAgIDprZXk9XCJyb3cuaWRcIlxuICAgICAgY2xhc3M9XCJtY29uc19faXRlbVwiXG4gICAgICA6ZGF0YS10aWQ9XCJgY29uc3VtYWJsZS0ke3Jvdy5pZH1gXCJcbiAgICA+XG4gICAgICA8ZGl2IGNsYXNzPVwibWNvbnNfX2xhYmVsXCI+XG4gICAgICAgIDxiPlxuICAgICAgICAgIDxpXG4gICAgICAgICAgICB2LWlmPVwicm93LmNvbG91clwiXG4gICAgICAgICAgICBjbGFzcz1cIm1jb25zX19kb3RcIlxuICAgICAgICAgICAgOnN0eWxlPVwieyBiYWNrZ3JvdW5kOiByb3cuY29sb3VyIH1cIlxuICAgICAgICAgIC8+XG4gICAgICAgICAge3sgcm93LnRpdGxlIH19XG4gICAgICAgIDwvYj5cbiAgICAgICAgPHNwYW4+e3sgcm93LnZhbHVlIH19PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJyb3cudXNhZ2VcIlxuICAgICAgICBjbGFzcz1cIm1jb25zX19iYXJcIlxuICAgICAgICByb2xlPVwicHJvZ3Jlc3NiYXJcIlxuICAgICAgICA6YXJpYS1sYWJlbD1cInJvdy50aXRsZVwiXG4gICAgICAgIGFyaWEtdmFsdWVtaW49XCIwXCJcbiAgICAgICAgYXJpYS12YWx1ZW1heD1cIjEwMFwiXG4gICAgICAgIDphcmlhLXZhbHVlbm93PVwicm93LnVzYWdlLnBlcmNlbnRcIlxuICAgICAgPlxuICAgICAgICA8aVxuICAgICAgICAgIDpjbGFzcz1cInsgJ21jb25zX19maWxsLS13YXJuJzogcm93LnVzYWdlLnRvbmUgPT09ICd3YXJuJyB9XCJcbiAgICAgICAgICA6c3R5bGU9XCJ7IHdpZHRoOiBgJHtyb3cudXNhZ2UucGVyY2VudH0lYCB9XCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L21haW50ZW5hbmNlLXRpbGU+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFpbnRlbmFuY2UnXG5pbXBvcnQgTWFpbnRlbmFuY2VUaWxlIGZyb20gJy4vTWFpbnRlbmFuY2VUaWxlLnZ1ZSdcbmltcG9ydCB7IE5PWlpMRV9TRVJWSUNFX0hPVVJTLCBQTEFURV9TRVJWSUNFX1BSSU5UUywgc3Bvb2xMZWZ0LCB1c2FnZU9mLCB0eXBlIFVzYWdlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9jb25zdW1hYmxlcydcbmltcG9ydCB0eXBlIHsgU3Bvb2wgfSBmcm9tICdAL3N0b3JlL3Nwb29sbWFuL3R5cGVzJ1xuXG5pbnRlcmZhY2UgQ29uc3VtYWJsZVJvdyB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIHVzYWdlOiBVc2FnZSB8IG51bGw7XG4gIGNvbG91cj86IHN0cmluZztcbn1cblxuLyoqXG4gKiBDb25zdW1hYmxlczogdGhlIG5venpsZSwgdGhlIGJ1aWxkIHBsYXRlIGFuZCB0aGUgc3Bvb2wuIFRoZSBub3p6bGUgYW5kXG4gKiB0aGUgcGxhdGUgY291bnQgdGhpcyBwcmludGVyJ3MgaG91cnMgYW5kIHByaW50cyBhZ2FpbnN0IGEgc2VydmljZVxuICogaW50ZXJ2YWwgKHRoZSBwcmludGVyIGtlZXBzIG5vIHJlcGxhY2VtZW50IGRhdGUpOyB0aGUgc3Bvb2wgc2hvd3Mgd2hhdCBpc1xuICogbG9hZGVkLCBhbmQgaG93IG11Y2ggaXMgbGVmdCB3aGVuIFNwb29sbWFuIHNheXMuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE1haW50ZW5hbmNlVGlsZSB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZUNvbnN1bWFibGVzIGV4dGVuZHMgTWl4aW5zKE1haW50ZW5hbmNlTWl4aW4pIHtcbiAgZ2V0IHNwb29sICgpOiBTcG9vbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Nwb29sbWFuL2dldEFjdGl2ZVNwb29sJ10gYXMgU3Bvb2wgfCB1bmRlZmluZWRcbiAgfVxuXG4gIGdldCByb3dzICgpOiBDb25zdW1hYmxlUm93W10ge1xuICAgIGNvbnN0IGhvdXJzID0gdGhpcy5wcmludEhvdXJzXG4gICAgY29uc3QgcHJpbnRzID0gdGhpcy5wcmludENvdW50XG4gICAgY29uc3Qgc3Bvb2xQZXJjZW50ID0gdGhpcy5zcG9vbCA/IHNwb29sTGVmdCh0aGlzLnNwb29sLnJlbWFpbmluZ193ZWlnaHQsIHRoaXMuc3Bvb2wuZmlsYW1lbnQ/LndlaWdodCkgOiBudWxsXG4gICAgY29uc3QgbG9hZGVkID0gdGhpcy5sb2FkZWRNYXRlcmlhbFxuICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5zcG9vbD8uZmlsYW1lbnQ/Lm1hdGVyaWFsID8/IGxvYWRlZD8ubmFtZSA/PyB0aGlzLnByaW50aW5nV2l0aD8ubmFtZVxuICAgIGNvbnN0IGNvbG91ciA9IHRoaXMuc3Bvb2w/LmZpbGFtZW50Py5jb2xvcl9oZXggPyBgIyR7dGhpcy5zcG9vbC5maWxhbWVudC5jb2xvcl9oZXgucmVwbGFjZSgnIycsICcnKX1gIDogKGxvYWRlZD8uY29sb3VyID8/IHRoaXMucHJpbnRpbmdXaXRoPy5jb2xvdXIgPz8gdW5kZWZpbmVkKVxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnbm96emxlJyxcbiAgICAgICAgdGl0bGU6ICdOb3p6bGUnLFxuICAgICAgICB2YWx1ZTogaG91cnMgPT09IG51bGwgPyAnSG91cnMgdW5hdmFpbGFibGUnIDogYCR7aG91cnN9IG9mICR7Tk9aWkxFX1NFUlZJQ0VfSE9VUlN9IGhgLFxuICAgICAgICB1c2FnZTogdXNhZ2VPZihob3VycywgTk9aWkxFX1NFUlZJQ0VfSE9VUlMpXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3BsYXRlJyxcbiAgICAgICAgdGl0bGU6ICdCdWlsZCBwbGF0ZScsXG4gICAgICAgIHZhbHVlOiBwcmludHMgPT09IG51bGwgPyAnUHJpbnRzIHVuYXZhaWxhYmxlJyA6IGAke3ByaW50c30gb2YgJHtQTEFURV9TRVJWSUNFX1BSSU5UU30gcHJpbnRzYCxcbiAgICAgICAgdXNhZ2U6IHVzYWdlT2YocHJpbnRzLCBQTEFURV9TRVJWSUNFX1BSSU5UUylcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnZmlsYW1lbnQnLFxuICAgICAgICB0aXRsZTogbWF0ZXJpYWwgPyBgRmlsYW1lbnQsICR7bWF0ZXJpYWx9YCA6ICdGaWxhbWVudCcsXG4gICAgICAgIHZhbHVlOiBzcG9vbFBlcmNlbnQgIT09IG51bGwgPyBgJHtzcG9vbFBlcmNlbnR9JSBsZWZ0YCA6IG1hdGVyaWFsID8gJ0xvYWRlZCcgOiAnTm9uZSBzZXQnLFxuICAgICAgICB1c2FnZTogc3Bvb2xQZXJjZW50ID09PSBudWxsID8gbnVsbCA6IHsgcGVyY2VudDogc3Bvb2xQZXJjZW50LCB0b25lOiAnb2snIH0sXG4gICAgICAgIGNvbG91clxuICAgICAgfVxuICAgIF1cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm1jb25zX19pdGVtICsgLm1jb25zX19pdGVtIHtcbiAgICBtYXJnaW4tdG9wOiAycHg7XG4gIH1cblxuICAubWNvbnNfX2xhYmVsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDhweDtcbiAgICBtYXJnaW4tYm90dG9tOiA2cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcblxuICAgIGIge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICBnYXA6IDhweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gICAgfVxuICB9XG5cbiAgLm1jb25zX19kb3Qge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB3aWR0aDogMTBweDtcbiAgICBoZWlnaHQ6IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICB9XG5cbiAgLm1jb25zX19iYXIge1xuICAgIGhlaWdodDogNnB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG5cbiAgICBpIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC5tY29uc19fZmlsbC0td2FybiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXdhcm5pbmcpICFpbXBvcnRhbnQ7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tYWludGVuYW5jZS9NYWludGVuYW5jZUNvbnN1bWFibGVzLnZ1ZSJ9