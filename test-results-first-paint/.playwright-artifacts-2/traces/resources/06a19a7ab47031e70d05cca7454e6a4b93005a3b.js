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
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import { meshValue } from "/src/services/maintenance/model.ts";
import { heatColor, heatAlpha, heatGradient, heatInk, heatScale, signedMm } from "/src/services/maintenance/heatmap.ts";
import { backRowFirst } from "/src/services/machine/orientation.ts";
let MeshMap = class extends Mixins(MaintenanceMixin) {
  numbers;
  large;
  get columns() {
    return this.grid[0]?.length ?? 0;
  }
  /** The measurement under way, here or started by the printer itself. */
  get run() {
    return this.meshRun;
  }
  /** Rows by Y ascending: the mesh being measured, else the last one. */
  get grid() {
    const grid = this.run ? this.run.points.length ? this.run.grid : [] : this.mesh;
    return grid.map((row) => row.map((value) => typeof value === "number" && Number.isFinite(value) ? value : null));
  }
  /** Where in `cells` the point measured last is, to show it arriving. */
  get newestCell() {
    const last = this.run?.points[this.run.points.length - 1];
    if (!last) return -1;
    const rows = backRowFirst(this.grid);
    for (let r = 0; r < rows.length; r++) {
      const c = rows[r].indexOf(last.z);
      if (c >= 0) return r * this.columns + c;
    }
    return -1;
  }
  /** The cells to draw, back row first, as you would see the plate from the front. */
  get displayRows() {
    return backRowFirst(this.grid);
  }
  get scale() {
    return heatScale(this.grid);
  }
  /** The grey grid drawn before there is a mesh: the printer's own mesh size, else 5 × 5. */
  get ghost() {
    const [x, y] = this.meshSize ?? [5, 5];
    return [Math.min(15, Math.max(2, x)), Math.min(15, Math.max(2, y))];
  }
  get gradient() {
    return heatGradient();
  }
  meshValue(value) {
    return meshValue(value);
  }
  signedMm(value) {
    return signedMm(value);
  }
  colorOf(value) {
    return this.scale ? heatColor(value, this.scale) : "";
  }
  ink(value) {
    return this.scale ? heatInk(heatAlpha(value, this.scale)) : "light";
  }
};
__decorateClass([
  Prop({ type: Boolean })
], MeshMap.prototype, "numbers", 2);
__decorateClass([
  Prop({ type: Boolean })
], MeshMap.prototype, "large", 2);
MeshMap = __decorateClass([
  Component({})
], MeshMap);
const _sfc_main = MeshMap;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "mmap" }, [_vm.run ? _c("div", { staticClass: "mmap__live", attrs: { "data-tid": "mesh-live" } }, [_c("p", { staticClass: "mmap__phase", attrs: { "aria-live": "polite" } }, [_c("span", { staticClass: "mmap__dot", class: `mmap__dot--${_vm.run.progress.phase}` }), _vm._v(" " + _vm._s(_vm.run.progress.text) + " ")]), _c("div", { staticClass: "mmap__bar", attrs: { "role": "progressbar", "aria-valuenow": _vm.run.progress.done, "aria-valuemax": _vm.run.progress.total || void 0 } }, [_c("span", { staticClass: "mmap__fill", class: { "mmap__fill--unknown": !_vm.run.progress.total || !_vm.run.progress.done }, style: { width: _vm.run.progress.total ? `${Math.round(100 * _vm.run.progress.done / _vm.run.progress.total)}%` : void 0 } })])]) : _vm._e(), _vm.scale ? _c("div", { staticClass: "mmap__body" }, [_c("div", { staticClass: "mmap__grid", class: { "mmap__grid--large": _vm.large }, style: { gridTemplateColumns: `repeat(${_vm.columns}, minmax(0, 1fr))` }, attrs: { "aria-label": `Bed mesh, ${_vm.columns} \xD7 ${_vm.grid.length} points, back at the top`, "role": "table", "data-tid": "mesh-heat" } }, _vm._l(_vm.displayRows, function(row, r) {
    return _c("div", { key: r, staticClass: "mmap__row", attrs: { "role": "row" } }, _vm._l(row, function(cell, c) {
      return _c("i", { key: c, staticClass: "mmap__cell", class: {
        "mmap__cell--empty": cell === null,
        "mmap__cell--value": _vm.numbers,
        "mmap__cell--dark": _vm.numbers && cell !== null && _vm.ink(cell) === "dark",
        "mmap__cell--new": !!_vm.run && r * _vm.columns + c === _vm.newestCell
      }, style: cell === null ? void 0 : { background: _vm.colorOf(cell) }, attrs: { "role": "cell", "aria-label": cell === null ? "Not measured" : `${cell.toFixed(3)} mm`, "title": cell === null ? "Not measured" : `${cell.toFixed(3)} mm` } }, [_vm._v(_vm._s(_vm.numbers && cell !== null ? _vm.meshValue(cell) : ""))]);
    }), 0);
  }), 0), _vm.large && _vm.scale ? _c("div", { staticClass: "mmap__scale", attrs: { "data-tid": "mesh-scale" } }, [_c("span", [_vm._v(_vm._s(_vm.signedMm(_vm.scale.min)))]), _c("span", { staticClass: "mmap__scale-bar", style: { background: _vm.gradient } }), _c("span", [_vm._v(_vm._s(_vm.signedMm(_vm.scale.max)) + " mm")])]) : _vm._e()]) : _c("div", { staticClass: "mmap__none", attrs: { "data-tid": _vm.run ? "mesh-waiting" : "mesh-unlevelled" } }, [_c("div", { staticClass: "mmap__grid mmap__grid--ghost", class: { "mmap__grid--large": _vm.large }, style: { gridTemplateColumns: `repeat(${_vm.ghost[0]}, minmax(0, 1fr))` }, attrs: { "aria-hidden": "true" } }, _vm._l(_vm.ghost[0] * _vm.ghost[1], function(n) {
    return _c("i", { key: n, staticClass: "mmap__cell mmap__cell--empty" }, [_vm._v(_vm._s(_vm.large ? "?" : ""))]);
  }), 0), _vm.run ? _c("p", [_vm._v(" " + _vm._s(_vm.run.progress.text) + "\u2026 ")]) : [_c("b", [_vm._v("Bed not levelled")]), _c("p", [_vm._v("No mesh yet, so no heights to show. Calibrate the mesh to measure the plate.")])]], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MeshMap.vue?vue&type=style&index=0&scoped=d2afe26d&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "d2afe26d",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MeshMap.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQThHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBUUE7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBbkVBO0FBQUEsRUFEQTtBQUFBLEdBRkEsUUFHQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBTkEsUUFPQTtBQVBBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk1lc2hNYXAudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdiBjbGFzcz1cIm1tYXBcIj5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwicnVuXCJcbiAgICAgIGNsYXNzPVwibW1hcF9fbGl2ZVwiXG4gICAgICBkYXRhLXRpZD1cIm1lc2gtbGl2ZVwiXG4gICAgPlxuICAgICAgPHBcbiAgICAgICAgY2xhc3M9XCJtbWFwX19waGFzZVwiXG4gICAgICAgIGFyaWEtbGl2ZT1cInBvbGl0ZVwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgY2xhc3M9XCJtbWFwX19kb3RcIlxuICAgICAgICAgIDpjbGFzcz1cImBtbWFwX19kb3QtLSR7cnVuLnByb2dyZXNzLnBoYXNlfWBcIlxuICAgICAgICAvPlxuICAgICAgICB7eyBydW4ucHJvZ3Jlc3MudGV4dCB9fVxuICAgICAgPC9wPlxuICAgICAgPGRpdlxuICAgICAgICBjbGFzcz1cIm1tYXBfX2JhclwiXG4gICAgICAgIHJvbGU9XCJwcm9ncmVzc2JhclwiXG4gICAgICAgIDphcmlhLXZhbHVlbm93PVwicnVuLnByb2dyZXNzLmRvbmVcIlxuICAgICAgICA6YXJpYS12YWx1ZW1heD1cInJ1bi5wcm9ncmVzcy50b3RhbCB8fCB1bmRlZmluZWRcIlxuICAgICAgPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzPVwibW1hcF9fZmlsbFwiXG4gICAgICAgICAgOmNsYXNzPVwieyAnbW1hcF9fZmlsbC0tdW5rbm93bic6ICFydW4ucHJvZ3Jlc3MudG90YWwgfHwgIXJ1bi5wcm9ncmVzcy5kb25lIH1cIlxuICAgICAgICAgIDpzdHlsZT1cInsgd2lkdGg6IHJ1bi5wcm9ncmVzcy50b3RhbCA/IGAke01hdGgucm91bmQoMTAwICogcnVuLnByb2dyZXNzLmRvbmUgLyBydW4ucHJvZ3Jlc3MudG90YWwpfSVgIDogdW5kZWZpbmVkIH1cIlxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwic2NhbGVcIlxuICAgICAgY2xhc3M9XCJtbWFwX19ib2R5XCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwibW1hcF9fZ3JpZFwiXG4gICAgICAgIDpjbGFzcz1cInsgJ21tYXBfX2dyaWQtLWxhcmdlJzogbGFyZ2UgfVwiXG4gICAgICAgIDpzdHlsZT1cInsgZ3JpZFRlbXBsYXRlQ29sdW1uczogYHJlcGVhdCgke2NvbHVtbnN9LCBtaW5tYXgoMCwgMWZyKSlgIH1cIlxuICAgICAgICA6YXJpYS1sYWJlbD1cImBCZWQgbWVzaCwgJHtjb2x1bW5zfSDDlyAke2dyaWQubGVuZ3RofSBwb2ludHMsIGJhY2sgYXQgdGhlIHRvcGBcIlxuICAgICAgICByb2xlPVwidGFibGVcIlxuICAgICAgICBkYXRhLXRpZD1cIm1lc2gtaGVhdFwiXG4gICAgICA+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWZvcj1cIihyb3csIHIpIGluIGRpc3BsYXlSb3dzXCJcbiAgICAgICAgICA6a2V5PVwiclwiXG4gICAgICAgICAgcm9sZT1cInJvd1wiXG4gICAgICAgICAgY2xhc3M9XCJtbWFwX19yb3dcIlxuICAgICAgICA+XG4gICAgICAgICAgPGlcbiAgICAgICAgICAgIHYtZm9yPVwiKGNlbGwsIGMpIGluIHJvd1wiXG4gICAgICAgICAgICA6a2V5PVwiY1wiXG4gICAgICAgICAgICByb2xlPVwiY2VsbFwiXG4gICAgICAgICAgICBjbGFzcz1cIm1tYXBfX2NlbGxcIlxuICAgICAgICAgICAgOmNsYXNzPVwie1xuICAgICAgICAgICAgICAnbW1hcF9fY2VsbC0tZW1wdHknOiBjZWxsID09PSBudWxsLFxuICAgICAgICAgICAgICAnbW1hcF9fY2VsbC0tdmFsdWUnOiBudW1iZXJzLFxuICAgICAgICAgICAgICAnbW1hcF9fY2VsbC0tZGFyayc6IG51bWJlcnMgJiYgY2VsbCAhPT0gbnVsbCAmJiBpbmsoY2VsbCkgPT09ICdkYXJrJyxcbiAgICAgICAgICAgICAgJ21tYXBfX2NlbGwtLW5ldyc6ICEhcnVuICYmIHIgKiBjb2x1bW5zICsgYyA9PT0gbmV3ZXN0Q2VsbFxuICAgICAgICAgICAgfVwiXG4gICAgICAgICAgICA6c3R5bGU9XCJjZWxsID09PSBudWxsID8gdW5kZWZpbmVkIDogeyBiYWNrZ3JvdW5kOiBjb2xvck9mKGNlbGwpIH1cIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJjZWxsID09PSBudWxsID8gJ05vdCBtZWFzdXJlZCcgOiBgJHtjZWxsLnRvRml4ZWQoMyl9IG1tYFwiXG4gICAgICAgICAgICA6dGl0bGU9XCJjZWxsID09PSBudWxsID8gJ05vdCBtZWFzdXJlZCcgOiBgJHtjZWxsLnRvRml4ZWQoMyl9IG1tYFwiXG4gICAgICAgICAgPnt7IG51bWJlcnMgJiYgY2VsbCAhPT0gbnVsbCA/IG1lc2hWYWx1ZShjZWxsKSA6ICcnIH19PC9pPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJsYXJnZSAmJiBzY2FsZVwiXG4gICAgICAgIGNsYXNzPVwibW1hcF9fc2NhbGVcIlxuICAgICAgICBkYXRhLXRpZD1cIm1lc2gtc2NhbGVcIlxuICAgICAgPlxuICAgICAgICA8c3Bhbj57eyBzaWduZWRNbShzY2FsZS5taW4pIH19PC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzPVwibW1hcF9fc2NhbGUtYmFyXCJcbiAgICAgICAgICA6c3R5bGU9XCJ7IGJhY2tncm91bmQ6IGdyYWRpZW50IH1cIlxuICAgICAgICAvPlxuICAgICAgICA8c3Bhbj57eyBzaWduZWRNbShzY2FsZS5tYXgpIH19IG1tPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwibW1hcF9fbm9uZVwiXG4gICAgICA6ZGF0YS10aWQ9XCJydW4gPyAnbWVzaC13YWl0aW5nJyA6ICdtZXNoLXVubGV2ZWxsZWQnXCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwibW1hcF9fZ3JpZCBtbWFwX19ncmlkLS1naG9zdFwiXG4gICAgICAgIDpjbGFzcz1cInsgJ21tYXBfX2dyaWQtLWxhcmdlJzogbGFyZ2UgfVwiXG4gICAgICAgIDpzdHlsZT1cInsgZ3JpZFRlbXBsYXRlQ29sdW1uczogYHJlcGVhdCgke2dob3N0WzBdfSwgbWlubWF4KDAsIDFmcikpYCB9XCJcbiAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgID5cbiAgICAgICAgPGlcbiAgICAgICAgICB2LWZvcj1cIm4gaW4gZ2hvc3RbMF0gKiBnaG9zdFsxXVwiXG4gICAgICAgICAgOmtleT1cIm5cIlxuICAgICAgICAgIGNsYXNzPVwibW1hcF9fY2VsbCBtbWFwX19jZWxsLS1lbXB0eVwiXG4gICAgICAgID57eyBsYXJnZSA/ICc/JyA6ICcnIH19PC9pPlxuICAgICAgPC9kaXY+XG4gICAgICA8cCB2LWlmPVwicnVuXCI+XG4gICAgICAgIHt7IHJ1bi5wcm9ncmVzcy50ZXh0IH194oCmXG4gICAgICA8L3A+XG4gICAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgICA8Yj5CZWQgbm90IGxldmVsbGVkPC9iPlxuICAgICAgICA8cD5ObyBtZXNoIHlldCwgc28gbm8gaGVpZ2h0cyB0byBzaG93LiBDYWxpYnJhdGUgdGhlIG1lc2ggdG8gbWVhc3VyZSB0aGUgcGxhdGUuPC9wPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE1haW50ZW5hbmNlTWl4aW4gZnJvbSAnQC9taXhpbnMvbWFpbnRlbmFuY2UnXG5pbXBvcnQgeyBtZXNoVmFsdWUgfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL21vZGVsJ1xuaW1wb3J0IHsgaGVhdENvbG9yLCBoZWF0QWxwaGEsIGhlYXRHcmFkaWVudCwgaGVhdEluaywgaGVhdFNjYWxlLCBzaWduZWRNbSwgdHlwZSBIZWF0U2NhbGUgfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL2hlYXRtYXAnXG5pbXBvcnQgeyBiYWNrUm93Rmlyc3QgfSBmcm9tICdAL3NlcnZpY2VzL21hY2hpbmUvb3JpZW50YXRpb24nXG5cbi8qKlxuICogVGhlIHBsYXRlIGFzIGxhc3QgbWVhc3VyZWQsIGFzIGEgaGVhdCBtYXA6IGZhaW50IHdoZXJlIGl0IG1lYXN1cmVkIGxvdyxcbiAqIHN0cm9uZyB3aGVyZSBoaWdoLCBkcmF3biBhcyB5b3Ugd291bGQgc2VlIHRoZSBwbGF0ZSBmcm9tIHRoZSBmcm9udC4gV2hpbGVcbiAqIHRoZSBiZWQgaXMgbWVhc3VyZWQsIHRoZSBncmlkIGZpbGxzIGluIHBvaW50IGJ5IHBvaW50IGZyb20gS2xpcHBlcidzIHByb2JlIGxpbmVzLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVzaE1hcCBleHRlbmRzIE1peGlucyhNYWludGVuYW5jZU1peGluKSB7XG4gIC8qKiBXcml0ZSBlYWNoIHBvaW50J3MgaGVpZ2h0IG9uIGl0cyBjZWxsLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbnVtYmVycz86IGJvb2xlYW5cblxuICAvKiogVGhlIEJlZCBwYWdlJ3MgbWFwOiBiaWdnZXIgY2VsbHMgYW5kIGEgc2NhbGUgYmFyLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbGFyZ2U/OiBib29sZWFuXG5cbiAgZ2V0IGNvbHVtbnMgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZ3JpZFswXT8ubGVuZ3RoID8/IDBcbiAgfVxuXG4gIC8qKiBUaGUgbWVhc3VyZW1lbnQgdW5kZXIgd2F5LCBoZXJlIG9yIHN0YXJ0ZWQgYnkgdGhlIHByaW50ZXIgaXRzZWxmLiAqL1xuICBnZXQgcnVuICgpIHtcbiAgICByZXR1cm4gdGhpcy5tZXNoUnVuXG4gIH1cblxuICAvKiogUm93cyBieSBZIGFzY2VuZGluZzogdGhlIG1lc2ggYmVpbmcgbWVhc3VyZWQsIGVsc2UgdGhlIGxhc3Qgb25lLiAqL1xuICBnZXQgZ3JpZCAoKTogQXJyYXk8QXJyYXk8bnVtYmVyIHwgbnVsbD4+IHtcbiAgICBjb25zdCBncmlkID0gdGhpcy5ydW4gPyAodGhpcy5ydW4ucG9pbnRzLmxlbmd0aCA/IHRoaXMucnVuLmdyaWQgOiBbXSkgOiB0aGlzLm1lc2hcbiAgICByZXR1cm4gZ3JpZC5tYXAocm93ID0+IHJvdy5tYXAodmFsdWUgPT4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNGaW5pdGUodmFsdWUpID8gdmFsdWUgOiBudWxsKSlcbiAgfVxuXG4gIC8qKiBXaGVyZSBpbiBgY2VsbHNgIHRoZSBwb2ludCBtZWFzdXJlZCBsYXN0IGlzLCB0byBzaG93IGl0IGFycml2aW5nLiAqL1xuICBnZXQgbmV3ZXN0Q2VsbCAoKTogbnVtYmVyIHtcbiAgICBjb25zdCBsYXN0ID0gdGhpcy5ydW4/LnBvaW50c1t0aGlzLnJ1bi5wb2ludHMubGVuZ3RoIC0gMV1cbiAgICBpZiAoIWxhc3QpIHJldHVybiAtMVxuICAgIGNvbnN0IHJvd3MgPSBiYWNrUm93Rmlyc3QodGhpcy5ncmlkKVxuICAgIGZvciAobGV0IHIgPSAwOyByIDwgcm93cy5sZW5ndGg7IHIrKykge1xuICAgICAgY29uc3QgYyA9IHJvd3Nbcl0uaW5kZXhPZihsYXN0LnopXG4gICAgICBpZiAoYyA+PSAwKSByZXR1cm4gciAqIHRoaXMuY29sdW1ucyArIGNcbiAgICB9XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICAvKiogVGhlIGNlbGxzIHRvIGRyYXcsIGJhY2sgcm93IGZpcnN0LCBhcyB5b3Ugd291bGQgc2VlIHRoZSBwbGF0ZSBmcm9tIHRoZSBmcm9udC4gKi9cbiAgZ2V0IGRpc3BsYXlSb3dzICgpOiBBcnJheTxBcnJheTxudW1iZXIgfCBudWxsPj4ge1xuICAgIHJldHVybiBiYWNrUm93Rmlyc3QodGhpcy5ncmlkKVxuICB9XG5cbiAgZ2V0IHNjYWxlICgpOiBIZWF0U2NhbGUgfCBudWxsIHtcbiAgICByZXR1cm4gaGVhdFNjYWxlKHRoaXMuZ3JpZClcbiAgfVxuXG4gIC8qKiBUaGUgZ3JleSBncmlkIGRyYXduIGJlZm9yZSB0aGVyZSBpcyBhIG1lc2g6IHRoZSBwcmludGVyJ3Mgb3duIG1lc2ggc2l6ZSwgZWxzZSA1IMOXIDUuICovXG4gIGdldCBnaG9zdCAoKTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgY29uc3QgW3gsIHldID0gdGhpcy5tZXNoU2l6ZSA/PyBbNSwgNV1cbiAgICByZXR1cm4gW01hdGgubWluKDE1LCBNYXRoLm1heCgyLCB4KSksIE1hdGgubWluKDE1LCBNYXRoLm1heCgyLCB5KSldXG4gIH1cblxuICBnZXQgZ3JhZGllbnQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGhlYXRHcmFkaWVudCgpXG4gIH1cblxuICBtZXNoVmFsdWUgKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBtZXNoVmFsdWUodmFsdWUpXG4gIH1cblxuICBzaWduZWRNbSAodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNpZ25lZE1tKHZhbHVlKVxuICB9XG5cbiAgY29sb3JPZiAodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc2NhbGUgPyBoZWF0Q29sb3IodmFsdWUsIHRoaXMuc2NhbGUpIDogJydcbiAgfVxuXG4gIGluayAodmFsdWU6IG51bWJlcik6ICdkYXJrJyB8ICdsaWdodCcge1xuICAgIHJldHVybiB0aGlzLnNjYWxlID8gaGVhdEluayhoZWF0QWxwaGEodmFsdWUsIHRoaXMuc2NhbGUpKSA6ICdsaWdodCdcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm1tYXAge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLm1tYXBfX3JvdyB7IGRpc3BsYXk6IGNvbnRlbnRzOyB9XG5cbiAgLm1tYXBfX2JvZHkge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE0cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLm1tYXBfX2dyaWQge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ2FwOiAzcHg7XG4gICAgd2lkdGg6IDEwMCU7XG4gIH1cblxuICAubW1hcF9fZ3JpZC0tbGFyZ2Uge1xuICAgIG1heC13aWR0aDogNTIwcHg7XG4gICAgbWFyZ2luOiAwIGF1dG87XG4gICAgZ2FwOiA0cHg7XG4gIH1cblxuICAubW1hcF9fY2VsbCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGFzcGVjdC1yYXRpbzogMTtcbiAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDlweDtcbiAgICBmb250LXN0eWxlOiBub3JtYWw7XG4gICAgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtcztcbiAgfVxuXG4gIC5tbWFwX19ncmlkLS1sYXJnZSAubW1hcF9fY2VsbCB7XG4gICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgfVxuXG4gIC5tbWFwX19jZWxsLS1kYXJrIHtcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjc4KTtcbiAgfVxuXG4gIC5tbWFwX19jZWxsLS1lbXB0eSB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gIH1cblxuICAubW1hcF9fY2VsbC0tbmV3IHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAycHggdmFyKC0tbTNkLXRleHQpO1xuICAgIGFuaW1hdGlvbjogbW1hcC1hcnJpdmUgMC42cyB2YXIoLS1tM2QtZWFzZSwgZWFzZSkgYm90aDtcbiAgfVxuXG4gIEBrZXlmcmFtZXMgbW1hcC1hcnJpdmUge1xuICAgIGZyb20geyB0cmFuc2Zvcm06IHNjYWxlKDAuNik7IG9wYWNpdHk6IDAuMjsgfVxuICAgIHRvIHsgdHJhbnNmb3JtOiBzY2FsZSgxKTsgb3BhY2l0eTogMTsgfVxuICB9XG5cbiAgLm1tYXBfX3NjYWxlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAubW1hcF9fc2NhbGUtYmFyIHtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgICBoZWlnaHQ6IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgfVxuXG4gIC5tbWFwX19saXZlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAubW1hcF9fcGhhc2Uge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBtYXJnaW46IDA7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAubW1hcF9fZG90IHtcbiAgICBmbGV4OiBub25lO1xuICAgIHdpZHRoOiA4cHg7XG4gICAgaGVpZ2h0OiA4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIGFuaW1hdGlvbjogbW1hcC1wdWxzZSAxLjJzIGVhc2UtaW4tb3V0IGluZmluaXRlO1xuICB9XG5cbiAgLm1tYXBfX2RvdC0taGVhdGluZyB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXdhcm5pbmcsICNlODk2M2MpO1xuICB9XG5cbiAgQGtleWZyYW1lcyBtbWFwLXB1bHNlIHtcbiAgICA1MCUgeyBvcGFjaXR5OiAwLjM1OyB9XG4gIH1cblxuICAubW1hcF9fYmFyIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgaGVpZ2h0OiA2cHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgfVxuXG4gIC5tbWFwX19maWxsIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaW5zZXQ6IDAgYXV0byAwIDA7XG4gICAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICB0cmFuc2l0aW9uOiB3aWR0aCB2YXIoLS1tM2QtZHVyYXRpb24tYmFzZSwgMC4ycykgdmFyKC0tbTNkLWVhc2UsIGVhc2UpO1xuICB9XG5cbiAgLm1tYXBfX2ZpbGwtLXVua25vd24ge1xuICAgIHdpZHRoOiAzMCU7XG4gICAgYW5pbWF0aW9uOiBtbWFwLXNsaWRlIDEuNHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7XG4gIH1cblxuICBAa2V5ZnJhbWVzIG1tYXAtc2xpZGUge1xuICAgIGZyb20geyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTEwMCUpOyB9XG4gICAgdG8geyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMzQwJSk7IH1cbiAgfVxuXG4gIDpyb290Lm0zZC1yZWR1Y2VkLW1vdGlvbiB7XG4gICAgLm1tYXBfX2NlbGwtLW5ldyxcbiAgICAubW1hcF9fZG90LFxuICAgIC5tbWFwX19maWxsLS11bmtub3duIHtcbiAgICAgIGFuaW1hdGlvbjogbm9uZTtcbiAgICB9XG4gIH1cblxuICAubW1hcF9fbm9uZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogMjhweCAxMnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgfVxuICB9XG5cbiAgLm1tYXBfX2dyaWQtLWdob3N0IHtcbiAgICBvcGFjaXR5OiAwLjc7XG4gICAgbWFyZ2luLWJvdHRvbTogNHB4O1xuXG4gICAgLm1tYXBfX2NlbGwge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvTWVzaE1hcC52dWUifQ==