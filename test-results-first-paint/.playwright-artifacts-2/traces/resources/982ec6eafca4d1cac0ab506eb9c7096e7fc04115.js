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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ProbeAccuracyMixin from "/src/mixins/probe-accuracy.ts";
import { signedMm } from "/src/services/maintenance/heatmap.ts";
import MaintenanceTile from "/src/components/maintenance/MaintenanceTile.vue";
let ProbeCard = class extends Mixins(ProbeAccuracyMixin) {
  queryAfter = Infinity;
  queryPrevious = [];
  clearQuery() {
    this.queryAfter = Infinity;
    this.queryPrevious = [];
  }
  get queryReport() {
    const entries = this.$store.state.console.console ?? [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.type !== "response" || (entry.time ?? 0) < this.queryAfter || this.queryPrevious.includes(entry)) continue;
      const match = /\bprobe: (open|TRIGGERED)\b/i.exec(entry.message);
      if (match) return match[1].toLowerCase() === "triggered";
    }
    return null;
  }
  get queried() {
    return this.queryReport !== null;
  }
  get probe() {
    return this.$store.getters["printer/getProbe"];
  }
  /** "Probe", or the probe's own name: "Load cell probe", "Bltouch". */
  get probeTitle() {
    const name = (this.probe?.name ?? "probe").replace(/_/g, " ");
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  get zOffset() {
    const settings = this.probe?.name ? this.$store.getters["printer/getPrinterSettings"](this.probe.name) : void 0;
    const value = Number(settings?.z_offset);
    return settings && Number.isFinite(value) ? value : null;
  }
  get triggered() {
    return this.queryReport === true;
  }
  signedMm(value, places) {
    return signedMm(value, places);
  }
  query() {
    if (!this.probe || !this.controlReady || this.hasWait(this.$waits.onQueryProbe)) return;
    this.queryPrevious = [...this.$store.state.console.console ?? []];
    this.queryAfter = Math.floor(Date.now() / 1e3);
    this.sendGcode("QUERY_PROBE", this.$waits.onQueryProbe);
  }
};
__decorateClass([
  Watch("maintenanceTarget")
], ProbeCard.prototype, "clearQuery", 1);
ProbeCard = __decorateClass([
  Component({ components: { MaintenanceTile } })
], ProbeCard);
const _sfc_main = ProbeCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Probe", "icon": "firstLayer", "locked": _vm.controlLock, "data-tid": "probe-card" } }, [_c("div", { staticClass: "probe__row" }, [_c("div", { staticClass: "probe__name" }, [_c("div", { staticClass: "probe__title" }, [_vm._v(" " + _vm._s(_vm.probeTitle) + " ")]), _vm.zOffset !== null ? _c("div", { staticClass: "probe__sub" }, [_vm._v(" z offset " + _vm._s(_vm.signedMm(_vm.zOffset, 3)) + " mm ")]) : _vm._e()]), _vm.queried ? _c("span", { staticClass: "probe__state", class: { "probe__state--hit": _vm.triggered } }, [_vm._v(_vm._s(_vm.triggered ? "Triggered: yes" : "Triggered: no"))]) : _c("span", { staticClass: "probe__state probe__state--unknown" }, [_vm._v("Not asked yet")])]), _vm.accuracy ? _c("div", { staticClass: "probe__result", attrs: { "data-tid": "probe-accuracy" } }, [_c("dl", { staticClass: "probe__stats" }, [_c("div", [_c("dt", [_vm._v("Spread")]), _c("dd", [_vm._v(_vm._s(_vm.micron(_vm.accuracy.stddev)))])]), _c("div", [_c("dt", [_vm._v("Range")]), _c("dd", [_vm._v(_vm._s(_vm.micron(_vm.accuracy.range)))])]), _c("div", [_c("dt", [_vm._v("Average")]), _c("dd", [_vm._v(_vm._s(_vm.accuracy.average.toFixed(4)) + " mm")])])]), _c("p", { staticClass: "probe__verdict", class: `probe__verdict--${_vm.verdict.tone}` }, [_vm._v(" " + _vm._s(_vm.verdict.text) + " "), _c("span", { staticClass: "probe__when" }, [_vm._v(_vm._s(_vm.accuracyWhen))])])]) : _c("p", { staticClass: "probe__note" }, [_vm._v(" Accuracy test probes the middle of the bed ten times and shows how far apart the heights land. ")]), _c("div", { staticClass: "probe__buttons" }, [_c("button", { staticClass: "cbtn probe__button", attrs: { "type": "button", "disabled": !_vm.controlReady || _vm.hasWait(_vm.$waits.onQueryProbe), "title": "Ask the probe whether it is triggered now", "data-tid": "probe-query" }, on: { "click": _vm.query } }, [_vm._v(" Query probe ")]), _c("button", { staticClass: "cbtn probe__button", attrs: { "type": "button", "disabled": !_vm.canCheck, "title": _vm.checksBlocked, "data-tid": "probe-accuracy-run" }, on: { "click": _vm.checkAccuracy } }, [_vm._v(" " + _vm._s(_vm.checking ? "Probing\u2026" : "Accuracy test") + " ")])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/ProbeCard.vue?vue&type=style&index=0&scoped=a714a3ee&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "a714a3ee",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/ProbeCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTBGQTtBQUNBO0FBR0E7QUFDQTtBQVNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUE3Q0E7QUFBQSxFQURBO0FBQUEsR0FKQSxVQUtBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUHJvYmVDYXJkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtYWludGVuYW5jZS10aWxlXG4gICAgdGl0bGU9XCJQcm9iZVwiXG4gICAgaWNvbj1cImZpcnN0TGF5ZXJcIlxuICAgIDpsb2NrZWQ9XCJjb250cm9sTG9ja1wiXG4gICAgZGF0YS10aWQ9XCJwcm9iZS1jYXJkXCJcbiAgPlxuICAgIDxkaXYgY2xhc3M9XCJwcm9iZV9fcm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicHJvYmVfX25hbWVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByb2JlX190aXRsZVwiPlxuICAgICAgICAgIHt7IHByb2JlVGl0bGUgfX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWlmPVwiek9mZnNldCAhPT0gbnVsbFwiXG4gICAgICAgICAgY2xhc3M9XCJwcm9iZV9fc3ViXCJcbiAgICAgICAgPlxuICAgICAgICAgIHogb2Zmc2V0IHt7IHNpZ25lZE1tKHpPZmZzZXQsIDMpIH19IG1tXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhblxuICAgICAgICB2LWlmPVwicXVlcmllZFwiXG4gICAgICAgIGNsYXNzPVwicHJvYmVfX3N0YXRlXCJcbiAgICAgICAgOmNsYXNzPVwieyAncHJvYmVfX3N0YXRlLS1oaXQnOiB0cmlnZ2VyZWQgfVwiXG4gICAgICA+e3sgdHJpZ2dlcmVkID8gJ1RyaWdnZXJlZDogeWVzJyA6ICdUcmlnZ2VyZWQ6IG5vJyB9fTwvc3Bhbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtZWxzZVxuICAgICAgICBjbGFzcz1cInByb2JlX19zdGF0ZSBwcm9iZV9fc3RhdGUtLXVua25vd25cIlxuICAgICAgPk5vdCBhc2tlZCB5ZXQ8L3NwYW4+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiYWNjdXJhY3lcIlxuICAgICAgY2xhc3M9XCJwcm9iZV9fcmVzdWx0XCJcbiAgICAgIGRhdGEtdGlkPVwicHJvYmUtYWNjdXJhY3lcIlxuICAgID5cbiAgICAgIDxkbCBjbGFzcz1cInByb2JlX19zdGF0c1wiPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxkdD5TcHJlYWQ8L2R0PlxuICAgICAgICAgIDxkZD57eyBtaWNyb24oYWNjdXJhY3kuc3RkZGV2KSB9fTwvZGQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxkdD5SYW5nZTwvZHQ+XG4gICAgICAgICAgPGRkPnt7IG1pY3JvbihhY2N1cmFjeS5yYW5nZSkgfX08L2RkPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8ZHQ+QXZlcmFnZTwvZHQ+XG4gICAgICAgICAgPGRkPnt7IGFjY3VyYWN5LmF2ZXJhZ2UudG9GaXhlZCg0KSB9fSBtbTwvZGQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kbD5cbiAgICAgIDxwXG4gICAgICAgIGNsYXNzPVwicHJvYmVfX3ZlcmRpY3RcIlxuICAgICAgICA6Y2xhc3M9XCJgcHJvYmVfX3ZlcmRpY3QtLSR7dmVyZGljdC50b25lfWBcIlxuICAgICAgPlxuICAgICAgICB7eyB2ZXJkaWN0LnRleHQgfX1cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJwcm9iZV9fd2hlblwiPnt7IGFjY3VyYWN5V2hlbiB9fTwvc3Bhbj5cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cbiAgICA8cFxuICAgICAgdi1lbHNlXG4gICAgICBjbGFzcz1cInByb2JlX19ub3RlXCJcbiAgICA+XG4gICAgICBBY2N1cmFjeSB0ZXN0IHByb2JlcyB0aGUgbWlkZGxlIG9mIHRoZSBiZWQgdGVuIHRpbWVzIGFuZCBzaG93cyBob3cgZmFyIGFwYXJ0IHRoZSBoZWlnaHRzIGxhbmQuXG4gICAgPC9wPlxuXG4gICAgPGRpdiBjbGFzcz1cInByb2JlX19idXR0b25zXCI+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gcHJvYmVfX2J1dHRvblwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHkgfHwgaGFzV2FpdCgkd2FpdHMub25RdWVyeVByb2JlKVwiXG4gICAgICAgIHRpdGxlPVwiQXNrIHRoZSBwcm9iZSB3aGV0aGVyIGl0IGlzIHRyaWdnZXJlZCBub3dcIlxuICAgICAgICBkYXRhLXRpZD1cInByb2JlLXF1ZXJ5XCJcbiAgICAgICAgQGNsaWNrPVwicXVlcnlcIlxuICAgICAgPlxuICAgICAgICBRdWVyeSBwcm9iZVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gcHJvYmVfX2J1dHRvblwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFjYW5DaGVja1wiXG4gICAgICAgIDp0aXRsZT1cImNoZWNrc0Jsb2NrZWRcIlxuICAgICAgICBkYXRhLXRpZD1cInByb2JlLWFjY3VyYWN5LXJ1blwiXG4gICAgICAgIEBjbGljaz1cImNoZWNrQWNjdXJhY3lcIlxuICAgICAgPlxuICAgICAgICB7eyBjaGVja2luZyA/ICdQcm9iaW5n4oCmJyA6ICdBY2N1cmFjeSB0ZXN0JyB9fVxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvbWFpbnRlbmFuY2UtdGlsZT5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFByb2JlQWNjdXJhY3lNaXhpbiBmcm9tICdAL21peGlucy9wcm9iZS1hY2N1cmFjeSdcbmltcG9ydCB0eXBlIHsgQ29uc29sZUVudHJ5IH0gZnJvbSAnQC9zdG9yZS9jb25zb2xlL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBQcm9iZSB9IGZyb20gJ0Avc3RvcmUvcHJpbnRlci90eXBlcydcbmltcG9ydCB7IHNpZ25lZE1tIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWludGVuYW5jZS9oZWF0bWFwJ1xuaW1wb3J0IE1haW50ZW5hbmNlVGlsZSBmcm9tICcuL01haW50ZW5hbmNlVGlsZS52dWUnXG5cbi8qKlxuICogVGhlIHByb2JlOiBpdHMgWiBvZmZzZXQsIHdoZXRoZXIgaXQgaXMgdHJpZ2dlcmVkIHdoZW4gYXNrZWQgKFF1ZXJ5IHByb2JlKSxcbiAqIGFuZCBwcm9iZSBhY2N1cmFjeSAodGVuIHByb2JlcyBpbiB0aGUgbWlkZGxlIG9mIHRoZSBiZWQpIHdpdGggaG93XG4gKiByZXBlYXRhYmxlIHRoZSBoZWlnaHRzIGFyZS4gQWNjdXJhY3kgdGVzdCBnb2VzIHRvIHRoZSBtaWRkbGUgb2YgdGhlIGJlZFxuICogYnkgdGhlIG5vLWdvLWF3YXJlIHBhdGggaW4gUHJvYmVBY2N1cmFjeU1peGluLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBNYWludGVuYW5jZVRpbGUgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvYmVDYXJkIGV4dGVuZHMgTWl4aW5zKFByb2JlQWNjdXJhY3lNaXhpbikge1xuICBxdWVyeUFmdGVyID0gSW5maW5pdHlcbiAgcXVlcnlQcmV2aW91czogQ29uc29sZUVudHJ5W10gPSBbXVxuXG4gIEBXYXRjaCgnbWFpbnRlbmFuY2VUYXJnZXQnKVxuICBjbGVhclF1ZXJ5ICgpIHsgdGhpcy5xdWVyeUFmdGVyID0gSW5maW5pdHk7IHRoaXMucXVlcnlQcmV2aW91cyA9IFtdIH1cblxuICBnZXQgcXVlcnlSZXBvcnQgKCk6IGJvb2xlYW4gfCBudWxsIHtcbiAgICBjb25zdCBlbnRyaWVzID0gKHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29uc29sZSBhcyBDb25zb2xlRW50cnlbXSB8IHVuZGVmaW5lZCkgPz8gW11cbiAgICBmb3IgKGxldCBpID0gZW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgZW50cnkgPSBlbnRyaWVzW2ldXG4gICAgICBpZiAoZW50cnkudHlwZSAhPT0gJ3Jlc3BvbnNlJyB8fCAoZW50cnkudGltZSA/PyAwKSA8IHRoaXMucXVlcnlBZnRlciB8fCB0aGlzLnF1ZXJ5UHJldmlvdXMuaW5jbHVkZXMoZW50cnkpKSBjb250aW51ZVxuICAgICAgY29uc3QgbWF0Y2ggPSAvXFxicHJvYmU6IChvcGVufFRSSUdHRVJFRClcXGIvaS5leGVjKGVudHJ5Lm1lc3NhZ2UpXG4gICAgICBpZiAobWF0Y2gpIHJldHVybiBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpID09PSAndHJpZ2dlcmVkJ1xuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgZ2V0IHF1ZXJpZWQgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5xdWVyeVJlcG9ydCAhPT0gbnVsbCB9XG5cbiAgZ2V0IHByb2JlICgpOiBQcm9iZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJvYmUnXSBhcyBQcm9iZSB8IHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqIFwiUHJvYmVcIiwgb3IgdGhlIHByb2JlJ3Mgb3duIG5hbWU6IFwiTG9hZCBjZWxsIHByb2JlXCIsIFwiQmx0b3VjaFwiLiAqL1xuICBnZXQgcHJvYmVUaXRsZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBuYW1lID0gKHRoaXMucHJvYmU/Lm5hbWUgPz8gJ3Byb2JlJykucmVwbGFjZSgvXy9nLCAnICcpXG4gICAgcmV0dXJuIG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnNsaWNlKDEpXG4gIH1cblxuICBnZXQgek9mZnNldCAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnByb2JlPy5uYW1lID8gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludGVyU2V0dGluZ3MnXSh0aGlzLnByb2JlLm5hbWUpIDogdW5kZWZpbmVkXG4gICAgY29uc3QgdmFsdWUgPSBOdW1iZXIoc2V0dGluZ3M/Lnpfb2Zmc2V0KVxuICAgIHJldHVybiBzZXR0aW5ncyAmJiBOdW1iZXIuaXNGaW5pdGUodmFsdWUpID8gdmFsdWUgOiBudWxsXG4gIH1cblxuICBnZXQgdHJpZ2dlcmVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeVJlcG9ydCA9PT0gdHJ1ZVxuICB9XG5cbiAgc2lnbmVkTW0gKHZhbHVlOiBudW1iZXIsIHBsYWNlczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2lnbmVkTW0odmFsdWUsIHBsYWNlcylcbiAgfVxuXG4gIHF1ZXJ5ICgpIHtcbiAgICBpZiAoIXRoaXMucHJvYmUgfHwgIXRoaXMuY29udHJvbFJlYWR5IHx8IHRoaXMuaGFzV2FpdCh0aGlzLiR3YWl0cy5vblF1ZXJ5UHJvYmUpKSByZXR1cm5cbiAgICB0aGlzLnF1ZXJ5UHJldmlvdXMgPSBbLi4uKHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29uc29sZSA/PyBbXSldXG4gICAgdGhpcy5xdWVyeUFmdGVyID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMClcbiAgICB0aGlzLnNlbmRHY29kZSgnUVVFUllfUFJPQkUnLCB0aGlzLiR3YWl0cy5vblF1ZXJ5UHJvYmUpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5wcm9iZV9fcm93IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAucHJvYmVfX3RpdGxlIHtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5wcm9iZV9fc3ViIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICB9XG5cbiAgLnByb2JlX19zdGF0ZSB7XG4gICAgZmxleDogbm9uZTtcbiAgICBwYWRkaW5nOiAycHggMTBweDtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLXN1Y2Nlc3MpIDE2JSwgdHJhbnNwYXJlbnQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtc3VjY2Vzcyk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAucHJvYmVfX3N0YXRlLS11bmtub3duIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLnByb2JlX19zdGF0ZS0taGl0IHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLXdhcm5pbmcpIDE2JSwgdHJhbnNwYXJlbnQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZywgI2ZmOWYwYSk7XG4gIH1cblxuICAucHJvYmVfX3Jlc3VsdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTBweDtcbiAgfVxuXG4gIC5wcm9iZV9fc3RhdHMge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMywgbWlubWF4KDAsIDFmcikpO1xuICAgIGdhcDogOHB4O1xuICAgIG1hcmdpbjogMDtcblxuICAgIGRpdiB7XG4gICAgICBwYWRkaW5nOiA4cHggMTJweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICB9XG5cbiAgICBkdCB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgIGxldHRlci1zcGFjaW5nOiAwLjA4ZW07XG4gICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgIH1cblxuICAgIGRkIHtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICAgIH1cbiAgfVxuXG4gIC5wcm9iZV9fdmVyZGljdCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5wcm9iZV9fdmVyZGljdC0tb2sge1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtc3VjY2VzcywgIzMwZDE1OCk7XG4gIH1cblxuICAucHJvYmVfX3ZlcmRpY3QtLXdhcm4ge1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZywgI2ZmOWYwYSk7XG4gIH1cblxuICAucHJvYmVfX3doZW4ge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICB9XG5cbiAgLnByb2JlX19ub3RlIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAucHJvYmVfX2J1dHRvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLnByb2JlX19idXR0b24ge1xuICAgIGZsZXg6IDEgMSAwO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvUHJvYmVDYXJkLnZ1ZSJ9