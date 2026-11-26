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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { chartLines } from "/src/services/overview/model.ts";
let HeaterSparkline = class extends Vue {
  series;
  seconds;
  fill;
  W = 120;
  H = 28;
  get samples() {
    return this.$store.getters["charts/getChartData"] ?? [];
  }
  get lines() {
    const data = this.samples;
    const last = data[data.length - 1];
    if (!last || !(last.date instanceof Date)) return null;
    const result = chartLines(data, [this.series], this.seconds, last.date.getTime(), this.W, this.H);
    const line = result.lines[0];
    if (!line) return null;
    const points = line.path.split(/[ML]/).filter(Boolean).length;
    return points >= 2 ? line : null;
  }
  get path() {
    return this.lines?.path ?? "";
  }
  get targetY() {
    return this.lines?.targetY ?? null;
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], HeaterSparkline.prototype, "series", 2);
__decorateClass([
  Prop({ type: Number, default: 300 })
], HeaterSparkline.prototype, "seconds", 2);
__decorateClass([
  Prop({ type: Boolean })
], HeaterSparkline.prototype, "fill", 2);
HeaterSparkline = __decorateClass([
  Component({})
], HeaterSparkline);
const _sfc_main = HeaterSparkline;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("svg", { staticClass: "spark", class: { "spark--fill": _vm.fill, "spark--empty": !_vm.path }, attrs: { "viewBox": `0 0 ${_vm.W} ${_vm.H}`, "preserveAspectRatio": "none", "aria-hidden": "true", "data-tid": "heater-spark", "data-series": _vm.series, "data-state": _vm.path ? "line" : "empty" } }, [_vm.targetY !== null ? _c("line", { staticClass: "spark__target", attrs: { "x1": "0", "x2": _vm.W, "y1": _vm.targetY, "y2": _vm.targetY } }) : _vm._e(), _vm.path ? _c("path", { staticClass: "spark__line", attrs: { "d": _vm.path } }) : _c("line", { staticClass: "spark__none", attrs: { "x1": "0", "x2": _vm.W, "y1": _vm.H / 2, "y2": _vm.H / 2 } })]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/HeaterSparkline.vue?vue&type=style&index=0&scoped=f4454e9f&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f4454e9f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/HeaterSparkline.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9DQTtBQUNBO0FBU0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQ0E7QUExQkE7QUFBQTtBQUFBLEdBRkEsZ0JBRUE7QUFFQTtBQUFBO0FBQUEsR0FKQSxnQkFJQTtBQUVBO0FBQUE7QUFBQSxHQU5BLGdCQU1BO0FBTkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiSGVhdGVyU3BhcmtsaW5lLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzdmdcbiAgICBjbGFzcz1cInNwYXJrXCJcbiAgICA6Y2xhc3M9XCJ7ICdzcGFyay0tZmlsbCc6IGZpbGwsICdzcGFyay0tZW1wdHknOiAhcGF0aCB9XCJcbiAgICA6dmlld0JveD1cImAwIDAgJHtXfSAke0h9YFwiXG4gICAgcHJlc2VydmVBc3BlY3RSYXRpbz1cIm5vbmVcIlxuICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgZGF0YS10aWQ9XCJoZWF0ZXItc3BhcmtcIlxuICAgIDpkYXRhLXNlcmllcz1cInNlcmllc1wiXG4gICAgOmRhdGEtc3RhdGU9XCJwYXRoID8gJ2xpbmUnIDogJ2VtcHR5J1wiXG4gID5cbiAgICA8bGluZVxuICAgICAgdi1pZj1cInRhcmdldFkgIT09IG51bGxcIlxuICAgICAgY2xhc3M9XCJzcGFya19fdGFyZ2V0XCJcbiAgICAgIHgxPVwiMFwiXG4gICAgICA6eDI9XCJXXCJcbiAgICAgIDp5MT1cInRhcmdldFlcIlxuICAgICAgOnkyPVwidGFyZ2V0WVwiXG4gICAgLz5cbiAgICA8cGF0aFxuICAgICAgdi1pZj1cInBhdGhcIlxuICAgICAgY2xhc3M9XCJzcGFya19fbGluZVwiXG4gICAgICA6ZD1cInBhdGhcIlxuICAgIC8+XG4gICAgPGxpbmVcbiAgICAgIHYtZWxzZVxuICAgICAgY2xhc3M9XCJzcGFya19fbm9uZVwiXG4gICAgICB4MT1cIjBcIlxuICAgICAgOngyPVwiV1wiXG4gICAgICA6eTE9XCJIIC8gMlwiXG4gICAgICA6eTI9XCJIIC8gMlwiXG4gICAgLz5cbiAgPC9zdmc+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgY2hhcnRMaW5lcywgdHlwZSBDaGFydFBvaW50IH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy9tb2RlbCdcblxuLyoqXG4gKiBBIGhlYXRlcidzIGxhc3QgZmV3IG1pbnV0ZXMgYXMgYSBzbWFsbCBsaW5lIGJlc2lkZSBpdHMgdGVtcGVyYXR1cmUgKEphY2ssXG4gKiA2IE5vdiAyMDI2OiBcIkVhY2ggdGVtcGVyYXR1cmUgbGluZSBnZXRzIGEgc21hbGwgaW5saW5lIHNwYXJrbGluZVwiKS4gSXRcbiAqIHJlYWRzIHRoZSBoaXN0b3J5IHRoZSB0ZW1wZXJhdHVyZSBncmFwaCBhbHJlYWR5IGtlZXBzICh0aGUgY2hhcnRzIHN0b3JlKTtcbiAqIGl0IHBvbGxzIG5vdGhpbmcgaXRzZWxmLiBXaXRoIG5vIGhpc3RvcnkgeWV0IGl0IGRyYXdzIGEgZmxhdCwgZmFpbnQgbGluZS5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhlYXRlclNwYXJrbGluZSBleHRlbmRzIFZ1ZSB7XG4gIC8qKiBUaGUgY2hhcnRzIHN0b3JlIGtleTogdGhlIEtsaXBwZXIgb2JqZWN0IChgZXh0cnVkZXJgLCBgaGVhdGVyX2JlZGAsIGB0ZW1wZXJhdHVyZV9zZW5zb3IgY2hhbWJlcmApLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgc2VyaWVzITogc3RyaW5nXG4gIC8qKiBIb3cgZmFyIGJhY2ssIGluIHNlY29uZHMuICovXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAzMDAgfSkgcmVhZG9ubHkgc2Vjb25kcyE6IG51bWJlclxuICAvKiogQXMgd2lkZSBhcyBpdHMgYm94LCByYXRoZXIgdGhhbiBhIGZpeGVkIHNtYWxsIHNpemUuICovXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSBmaWxsPzogYm9vbGVhblxuXG4gIHJlYWRvbmx5IFcgPSAxMjBcbiAgcmVhZG9ubHkgSCA9IDI4XG5cbiAgZ2V0IHNhbXBsZXMgKCk6IENoYXJ0UG9pbnRbXSB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjaGFydHMvZ2V0Q2hhcnREYXRhJ10gYXMgQ2hhcnRQb2ludFtdIHwgdW5kZWZpbmVkKSA/PyBbXVxuICB9XG5cbiAgZ2V0IGxpbmVzICgpIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5zYW1wbGVzXG4gICAgY29uc3QgbGFzdCA9IGRhdGFbZGF0YS5sZW5ndGggLSAxXVxuICAgIGlmICghbGFzdCB8fCAhKGxhc3QuZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IHJlc3VsdCA9IGNoYXJ0TGluZXMoZGF0YSwgW3RoaXMuc2VyaWVzXSwgdGhpcy5zZWNvbmRzLCBsYXN0LmRhdGUuZ2V0VGltZSgpLCB0aGlzLlcsIHRoaXMuSClcbiAgICBjb25zdCBsaW5lID0gcmVzdWx0LmxpbmVzWzBdXG4gICAgaWYgKCFsaW5lKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IHBvaW50cyA9IGxpbmUucGF0aC5zcGxpdCgvW01MXS8pLmZpbHRlcihCb29sZWFuKS5sZW5ndGhcbiAgICByZXR1cm4gcG9pbnRzID49IDIgPyBsaW5lIDogbnVsbFxuICB9XG5cbiAgZ2V0IHBhdGggKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmxpbmVzPy5wYXRoID8/ICcnIH1cbiAgZ2V0IHRhcmdldFkgKCk6IG51bWJlciB8IG51bGwgeyByZXR1cm4gdGhpcy5saW5lcz8udGFyZ2V0WSA/PyBudWxsIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5zcGFyayB7IGZsZXg6IG5vbmU7IHdpZHRoOiA2NHB4OyBoZWlnaHQ6IDIycHg7IG92ZXJmbG93OiB2aXNpYmxlOyB9XG4gIC5zcGFyay0tZmlsbCB7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDI4cHg7IH1cbiAgLnNwYXJrX19saW5lIHsgZmlsbDogbm9uZTsgc3Ryb2tlOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IHN0cm9rZS13aWR0aDogMS41OyB2ZWN0b3ItZWZmZWN0OiBub24tc2NhbGluZy1zdHJva2U7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IH1cbiAgLnNwYXJrX190YXJnZXQgeyBzdHJva2U6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IHN0cm9rZS13aWR0aDogMTsgc3Ryb2tlLWRhc2hhcnJheTogMyAzOyB2ZWN0b3ItZWZmZWN0OiBub24tc2NhbGluZy1zdHJva2U7IG9wYWNpdHk6IDAuNjsgfVxuICAuc3BhcmtfX25vbmUgeyBzdHJva2U6IHZhcigtLW0zZC1ib3JkZXIpOyBzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IDIgNDsgdmVjdG9yLWVmZmVjdDogbm9uLXNjYWxpbmctc3Ryb2tlOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9IZWF0ZXJTcGFya2xpbmUudnVlIn0=