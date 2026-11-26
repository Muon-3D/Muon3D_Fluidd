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
import { bytesWords, itemStateWords, isRunning, jobHeadline, percentOf, reasonWords } from "/src/services/usb/words.ts";
let UsbJobPanel = class extends Vue {
  job;
  cancelling;
  bytes = bytesWords;
  reason = reasonWords;
  stateWords = itemStateWords;
  pct = percentOf;
  get running() {
    return isRunning(this.job);
  }
  get headline() {
    return jobHeadline(this.job);
  }
  get percent() {
    if (this.job.state === "done") return 100;
    if (this.job.bytesTotal) return percentOf(this.job.bytesDone, this.job.bytesTotal);
    return percentOf(this.job.filesDone, this.job.filesTotal);
  }
  /** Skipped and failed files the item list doesn't already show (a long job carries no item list). */
  get extraProblems() {
    const shown = new Set(this.job.items.map((i) => i.path));
    return [
      ...this.job.skipped.map((p) => ({ kind: "skipped", ...p })),
      ...this.job.errors.map((p) => ({ kind: "error", ...p }))
    ].filter((p) => !shown.has(p.path));
  }
  leaf(path) {
    return path.split("/").pop() || path;
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], UsbJobPanel.prototype, "job", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], UsbJobPanel.prototype, "cancelling", 2);
UsbJobPanel = __decorateClass([
  Component
], UsbJobPanel);
const _sfc_main = UsbJobPanel;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "ujob", class: `ujob--${_vm.job.state}`, attrs: { "data-tid": "usb-job", "data-state": _vm.job.state } }, [_c("header", { staticClass: "ujob__head" }, [_c("b", { attrs: { "data-tid": "usb-job-headline" } }, [_vm._v(_vm._s(_vm.headline))]), _c("span", { staticClass: "ujob__pct", attrs: { "data-tid": "usb-job-percent" } }, [_vm._v(_vm._s(_vm.percent) + "%")]), _vm.running ? _c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "disabled": _vm.cancelling, "data-tid": "usb-job-cancel" }, on: { "click": function($event) {
    return _vm.$emit("cancel");
  } } }, [_vm._v(" " + _vm._s(_vm.cancelling ? "Cancelling\u2026" : "Cancel") + " ")]) : _c("button", { staticClass: "cbtn cbtn--sm", attrs: { "type": "button", "data-tid": "usb-job-dismiss" }, on: { "click": function($event) {
    return _vm.$emit("dismiss");
  } } }, [_vm._v(" Close ")])]), _c("div", { staticClass: "ujob__bar", attrs: { "role": "progressbar", "aria-label": "Copy progress", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": _vm.percent } }, [_c("i", { style: { width: `${_vm.percent}%` } })]), _c("p", { staticClass: "ujob__sub" }, [_vm._v(" " + _vm._s(_vm.bytes(_vm.job.bytesDone)) + " of " + _vm._s(_vm.bytes(_vm.job.bytesTotal)) + " "), _vm.running && _vm.job.current ? [_vm._v(" \xB7 " + _vm._s(_vm.leaf(_vm.job.current)) + " ")] : _vm._e()], 2), _vm.job.items.length ? _c("ul", { staticClass: "ujob__items", attrs: { "data-tid": "usb-job-items" } }, _vm._l(_vm.job.items, function(item) {
    return _c("li", { key: item.path, staticClass: "ujob__item", class: `ujob__item--${item.state}`, attrs: { "data-tid": "usb-job-item", "data-state": item.state } }, [_c("span", { staticClass: "ujob__name" }, [_vm._v(_vm._s(item.path))]), _c("span", { staticClass: "ujob__state" }, [_vm._v(_vm._s(_vm.stateWords(item.state)))]), item.state === "copying" || item.state === "done" ? _c("span", { staticClass: "ujob__bytes" }, [_vm._v(_vm._s(_vm.bytes(item.bytesDone)) + " / " + _vm._s(_vm.bytes(item.bytesTotal)))]) : _vm._e(), item.error ? _c("span", { staticClass: "ujob__why", attrs: { "data-tid": "usb-job-item-error" } }, [_vm._v(_vm._s(_vm.reason(item.error)))]) : _vm._e(), item.state === "copying" && item.bytesTotal ? _c("i", { staticClass: "ujob__mini" }, [_c("b", { style: { width: `${_vm.pct(item.bytesDone, item.bytesTotal)}%` } })]) : _vm._e()]);
  }), 0) : _vm._e(), _vm.extraProblems.length ? _c("ul", { staticClass: "ujob__items", attrs: { "data-tid": "usb-job-problems" } }, _vm._l(_vm.extraProblems, function(problem) {
    return _c("li", { key: `${problem.kind}-${problem.path}`, staticClass: "ujob__item ujob__item--failed" }, [_c("span", { staticClass: "ujob__name" }, [_vm._v(_vm._s(problem.path))]), _c("span", { staticClass: "ujob__why" }, [_vm._v(_vm._s(_vm.reason(problem.reason)))])]);
  }), 0) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/usb/UsbJobPanel.vue?vue&type=style&index=0&scoped=77c711f4&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "77c711f4",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/usb/UsbJobPanel.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9HQTtBQUVBO0FBSUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTdCQTtBQUFBO0FBQUEsR0FEQSxZQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsWUFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlVzYkpvYlBhbmVsLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJ1am9iXCJcbiAgICA6Y2xhc3M9XCJgdWpvYi0tJHtqb2Iuc3RhdGV9YFwiXG4gICAgZGF0YS10aWQ9XCJ1c2Itam9iXCJcbiAgICA6ZGF0YS1zdGF0ZT1cImpvYi5zdGF0ZVwiXG4gID5cbiAgICA8aGVhZGVyIGNsYXNzPVwidWpvYl9faGVhZFwiPlxuICAgICAgPGIgZGF0YS10aWQ9XCJ1c2Itam9iLWhlYWRsaW5lXCI+e3sgaGVhZGxpbmUgfX08L2I+XG4gICAgICA8c3BhblxuICAgICAgICBjbGFzcz1cInVqb2JfX3BjdFwiXG4gICAgICAgIGRhdGEtdGlkPVwidXNiLWpvYi1wZXJjZW50XCJcbiAgICAgID57eyBwZXJjZW50IH19JTwvc3Bhbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cInJ1bm5pbmdcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXNtXCJcbiAgICAgICAgOmRpc2FibGVkPVwiY2FuY2VsbGluZ1wiXG4gICAgICAgIGRhdGEtdGlkPVwidXNiLWpvYi1jYW5jZWxcIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnY2FuY2VsJylcIlxuICAgICAgPlxuICAgICAgICB7eyBjYW5jZWxsaW5nID8gJ0NhbmNlbGxpbmfigKYnIDogJ0NhbmNlbCcgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWVsc2VcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1zbVwiXG4gICAgICAgIGRhdGEtdGlkPVwidXNiLWpvYi1kaXNtaXNzXCJcbiAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ2Rpc21pc3MnKVwiXG4gICAgICA+XG4gICAgICAgIENsb3NlXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2hlYWRlcj5cblxuICAgIDxkaXZcbiAgICAgIGNsYXNzPVwidWpvYl9fYmFyXCJcbiAgICAgIHJvbGU9XCJwcm9ncmVzc2JhclwiXG4gICAgICBhcmlhLWxhYmVsPVwiQ29weSBwcm9ncmVzc1wiXG4gICAgICBhcmlhLXZhbHVlbWluPVwiMFwiXG4gICAgICBhcmlhLXZhbHVlbWF4PVwiMTAwXCJcbiAgICAgIDphcmlhLXZhbHVlbm93PVwicGVyY2VudFwiXG4gICAgPlxuICAgICAgPGkgOnN0eWxlPVwieyB3aWR0aDogYCR7cGVyY2VudH0lYCB9XCIgLz5cbiAgICA8L2Rpdj5cbiAgICA8cCBjbGFzcz1cInVqb2JfX3N1YlwiPlxuICAgICAge3sgYnl0ZXMoam9iLmJ5dGVzRG9uZSkgfX0gb2Yge3sgYnl0ZXMoam9iLmJ5dGVzVG90YWwpIH19XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInJ1bm5pbmcgJiYgam9iLmN1cnJlbnRcIj5cbiAgICAgICAgwrcge3sgbGVhZihqb2IuY3VycmVudCkgfX1cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9wPlxuXG4gICAgPHVsXG4gICAgICB2LWlmPVwiam9iLml0ZW1zLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cInVqb2JfX2l0ZW1zXCJcbiAgICAgIGRhdGEtdGlkPVwidXNiLWpvYi1pdGVtc1wiXG4gICAgPlxuICAgICAgPGxpXG4gICAgICAgIHYtZm9yPVwiaXRlbSBpbiBqb2IuaXRlbXNcIlxuICAgICAgICA6a2V5PVwiaXRlbS5wYXRoXCJcbiAgICAgICAgY2xhc3M9XCJ1am9iX19pdGVtXCJcbiAgICAgICAgOmNsYXNzPVwiYHVqb2JfX2l0ZW0tLSR7aXRlbS5zdGF0ZX1gXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ1c2Itam9iLWl0ZW1cIlxuICAgICAgICA6ZGF0YS1zdGF0ZT1cIml0ZW0uc3RhdGVcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInVqb2JfX25hbWVcIj57eyBpdGVtLnBhdGggfX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwidWpvYl9fc3RhdGVcIj57eyBzdGF0ZVdvcmRzKGl0ZW0uc3RhdGUpIH19PC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJpdGVtLnN0YXRlID09PSAnY29weWluZycgfHwgaXRlbS5zdGF0ZSA9PT0gJ2RvbmUnXCJcbiAgICAgICAgICBjbGFzcz1cInVqb2JfX2J5dGVzXCJcbiAgICAgICAgPnt7IGJ5dGVzKGl0ZW0uYnl0ZXNEb25lKSB9fSAvIHt7IGJ5dGVzKGl0ZW0uYnl0ZXNUb3RhbCkgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cIml0ZW0uZXJyb3JcIlxuICAgICAgICAgIGNsYXNzPVwidWpvYl9fd2h5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInVzYi1qb2ItaXRlbS1lcnJvclwiXG4gICAgICAgID57eyByZWFzb24oaXRlbS5lcnJvcikgfX08L3NwYW4+XG4gICAgICAgIDxpXG4gICAgICAgICAgdi1pZj1cIml0ZW0uc3RhdGUgPT09ICdjb3B5aW5nJyAmJiBpdGVtLmJ5dGVzVG90YWxcIlxuICAgICAgICAgIGNsYXNzPVwidWpvYl9fbWluaVwiXG4gICAgICAgID48YiA6c3R5bGU9XCJ7IHdpZHRoOiBgJHtwY3QoaXRlbS5ieXRlc0RvbmUsIGl0ZW0uYnl0ZXNUb3RhbCl9JWAgfVwiIC8+PC9pPlxuICAgICAgPC9saT5cbiAgICA8L3VsPlxuXG4gICAgPHVsXG4gICAgICB2LWlmPVwiZXh0cmFQcm9ibGVtcy5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJ1am9iX19pdGVtc1wiXG4gICAgICBkYXRhLXRpZD1cInVzYi1qb2ItcHJvYmxlbXNcIlxuICAgID5cbiAgICAgIDxsaVxuICAgICAgICB2LWZvcj1cInByb2JsZW0gaW4gZXh0cmFQcm9ibGVtc1wiXG4gICAgICAgIDprZXk9XCJgJHtwcm9ibGVtLmtpbmR9LSR7cHJvYmxlbS5wYXRofWBcIlxuICAgICAgICBjbGFzcz1cInVqb2JfX2l0ZW0gdWpvYl9faXRlbS0tZmFpbGVkXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJ1am9iX19uYW1lXCI+e3sgcHJvYmxlbS5wYXRoIH19PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInVqb2JfX3doeVwiPnt7IHJlYXNvbihwcm9ibGVtLnJlYXNvbikgfX08L3NwYW4+XG4gICAgICA8L2xpPlxuICAgIDwvdWw+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IFVzYkpvYiB9IGZyb20gJ0Avc2VydmljZXMvdXNiL3R5cGVzJ1xuaW1wb3J0IHsgYnl0ZXNXb3JkcywgaXRlbVN0YXRlV29yZHMsIGlzUnVubmluZywgam9iSGVhZGxpbmUsIHBlcmNlbnRPZiwgcmVhc29uV29yZHMgfSBmcm9tICdAL3NlcnZpY2VzL3VzYi93b3JkcydcblxuLyoqIFRoZSBjb3B5IHRoYXQgaXMgcnVubmluZyAob3Igd2FzIGxhc3QpLCB3aXRoIGVhY2ggZmlsZSdzIHByb2dyZXNzIGFuZCwgaW4gcGxhaW4gd29yZHMsIHdoYXQgd2VudCB3cm9uZyB3aXRoIGFueS4gKi9cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVzYkpvYlBhbmVsIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IGpvYiE6IFVzYkpvYlxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IGZhbHNlIH0pIHJlYWRvbmx5IGNhbmNlbGxpbmchOiBib29sZWFuXG5cbiAgcmVhZG9ubHkgYnl0ZXMgPSBieXRlc1dvcmRzXG4gIHJlYWRvbmx5IHJlYXNvbiA9IHJlYXNvbldvcmRzXG4gIHJlYWRvbmx5IHN0YXRlV29yZHMgPSBpdGVtU3RhdGVXb3Jkc1xuICByZWFkb25seSBwY3QgPSBwZXJjZW50T2ZcblxuICBnZXQgcnVubmluZyAoKTogYm9vbGVhbiB7IHJldHVybiBpc1J1bm5pbmcodGhpcy5qb2IpIH1cbiAgZ2V0IGhlYWRsaW5lICgpOiBzdHJpbmcgeyByZXR1cm4gam9iSGVhZGxpbmUodGhpcy5qb2IpIH1cblxuICBnZXQgcGVyY2VudCAoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5qb2Iuc3RhdGUgPT09ICdkb25lJykgcmV0dXJuIDEwMFxuICAgIGlmICh0aGlzLmpvYi5ieXRlc1RvdGFsKSByZXR1cm4gcGVyY2VudE9mKHRoaXMuam9iLmJ5dGVzRG9uZSwgdGhpcy5qb2IuYnl0ZXNUb3RhbClcbiAgICByZXR1cm4gcGVyY2VudE9mKHRoaXMuam9iLmZpbGVzRG9uZSwgdGhpcy5qb2IuZmlsZXNUb3RhbClcbiAgfVxuXG4gIC8qKiBTa2lwcGVkIGFuZCBmYWlsZWQgZmlsZXMgdGhlIGl0ZW0gbGlzdCBkb2Vzbid0IGFscmVhZHkgc2hvdyAoYSBsb25nIGpvYiBjYXJyaWVzIG5vIGl0ZW0gbGlzdCkuICovXG4gIGdldCBleHRyYVByb2JsZW1zICgpOiBBcnJheTx7IGtpbmQ6IHN0cmluZywgcGF0aDogc3RyaW5nLCByZWFzb246IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2hvd24gPSBuZXcgU2V0KHRoaXMuam9iLml0ZW1zLm1hcChpID0+IGkucGF0aCkpXG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLnRoaXMuam9iLnNraXBwZWQubWFwKHAgPT4gKHsga2luZDogJ3NraXBwZWQnLCAuLi5wIH0pKSxcbiAgICAgIC4uLnRoaXMuam9iLmVycm9ycy5tYXAocCA9PiAoeyBraW5kOiAnZXJyb3InLCAuLi5wIH0pKVxuICAgIF0uZmlsdGVyKHAgPT4gIXNob3duLmhhcyhwLnBhdGgpKVxuICB9XG5cbiAgbGVhZiAocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcGF0aC5zcGxpdCgnLycpLnBvcCgpIHx8IHBhdGhcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnVqb2Ige1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiAxNHB4IDE2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMThweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gIH1cblxuICAudWpvYl9faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcblxuICAgIGIge1xuICAgICAgZmxleDogMTtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICB9XG4gIH1cblxuICAudWpvYl9fcGN0IHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICB9XG5cbiAgLnVqb2JfX2JhciB7XG4gICAgaGVpZ2h0OiA4cHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7XG5cbiAgICBpIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4zcyBlYXNlO1xuICAgIH1cbiAgfVxuXG4gIC51am9iLS1mYWlsZWQgLnVqb2JfX2JhciBpLFxuICAudWpvYi0tY2FuY2VsbGVkIC51am9iX19iYXIgaSB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXdhcm5pbmcpO1xuICB9XG5cbiAgLnVqb2ItLWRvbmUgLnVqb2JfX2JhciBpIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VjY2Vzcyk7XG4gIH1cblxuICAudWpvYl9fc3ViIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAudWpvYl9faXRlbXMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDJweDtcbiAgICBtYXgtaGVpZ2h0OiAyMjBweDtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMDtcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gIH1cblxuICAudWpvYl9faXRlbSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDJweCAxMHB4O1xuICAgIHBhZGRpbmc6IDZweCA4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAudWpvYl9fbmFtZSB7XG4gICAgZmxleDogMSAxIDE2MHB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAudWpvYl9fc3RhdGUsXG4gIC51am9iX19ieXRlcyB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAudWpvYl9fd2h5IHtcbiAgICBmbGV4LWJhc2lzOiAxMDAlO1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLnVqb2JfX2l0ZW0tLWRvbmUgLnVqb2JfX3N0YXRlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MpO1xuICB9XG5cbiAgLnVqb2JfX2l0ZW0tLWZhaWxlZCAudWpvYl9fc3RhdGUge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTtcbiAgfVxuXG4gIC51am9iX19taW5pIHtcbiAgICBmbGV4LWJhc2lzOiAxMDAlO1xuICAgIGhlaWdodDogM3B4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuXG4gICAgYiB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3VzYi9Vc2JKb2JQYW5lbC52dWUifQ==