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
import { MUON_LOCAL_QUESTION, openMuonLocal } from "/src/services/muon-cloud/muon-local.ts";
let PrinterRouteProblem = class extends Vue {
  problem;
  ask;
  question = MUON_LOCAL_QUESTION;
  open() {
    openMuonLocal();
  }
};
__decorateClass([
  Prop({ default: null })
], PrinterRouteProblem.prototype, "problem", 2);
__decorateClass([
  Prop({ default: false })
], PrinterRouteProblem.prototype, "ask", 2);
PrinterRouteProblem = __decorateClass([
  Component({})
], PrinterRouteProblem);
const _sfc_main = PrinterRouteProblem;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.problem || _vm.ask ? _c("div", { staticClass: "route-problem", attrs: { "data-tid": "route-problem" } }, [_vm.problem ? [_c("p", { staticClass: "route-problem__line", attrs: { "data-tid": "route-problem-line" } }, [_vm._v(" " + _vm._s(_vm.problem.line) + " ")]), _c("div", { staticClass: "route-problem__buttons" }, _vm._l(_vm.problem.choices, function(c) {
    return _c("button", { key: c.id, staticClass: "route-problem__btn", attrs: { "type": "button", "data-tid": `route-choice-${c.id}` }, on: { "click": function($event) {
      return _vm.$emit("choose", c.id);
    } } }, [_vm._v(" " + _vm._s(c.label) + " ")]);
  }), 0)] : _vm._e(), _vm.ask ? [_c("p", { staticClass: "route-problem__line", attrs: { "data-tid": "muon-local-question" } }, [_vm._v(" " + _vm._s(_vm.question) + " ")]), _c("div", { staticClass: "route-problem__buttons" }, [_c("button", { staticClass: "route-problem__btn", attrs: { "type": "button", "data-tid": "muon-local-open" }, on: { "click": _vm.open } }, [_vm._v(" Open muon3d.local ")]), _c("button", { staticClass: "route-problem__btn", attrs: { "type": "button", "data-tid": "muon-local-cancel" }, on: { "click": function($event) {
    return _vm.$emit("cancel");
  } } }, [_vm._v(" Cancel ")])])] : _vm._e()], 2) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/PrinterRouteProblem.vue?vue&type=style&index=0&scoped=fd051ca7&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "fd051ca7",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/PrinterRouteProblem.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXdEQTtBQUNBO0FBWUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBOztBQUtBO0FBQUEsRUFDQTtBQUNBO0FBUkE7QUFBQTtBQUFBLEdBREEsb0JBQ0E7QUFDQTtBQUFBO0FBQUEsR0FGQSxvQkFFQTtBQUZBO0FBQUE7QUFBQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUHJpbnRlclJvdXRlUHJvYmxlbS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgdi1pZj1cInByb2JsZW0gfHwgYXNrXCJcbiAgICBjbGFzcz1cInJvdXRlLXByb2JsZW1cIlxuICAgIGRhdGEtdGlkPVwicm91dGUtcHJvYmxlbVwiXG4gID5cbiAgICA8dGVtcGxhdGUgdi1pZj1cInByb2JsZW1cIj5cbiAgICAgIDxwXG4gICAgICAgIGNsYXNzPVwicm91dGUtcHJvYmxlbV9fbGluZVwiXG4gICAgICAgIGRhdGEtdGlkPVwicm91dGUtcHJvYmxlbS1saW5lXCJcbiAgICAgID5cbiAgICAgICAge3sgcHJvYmxlbS5saW5lIH19XG4gICAgICA8L3A+XG4gICAgICA8ZGl2IGNsYXNzPVwicm91dGUtcHJvYmxlbV9fYnV0dG9uc1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1mb3I9XCJjIGluIHByb2JsZW0uY2hvaWNlc1wiXG4gICAgICAgICAgOmtleT1cImMuaWRcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwicm91dGUtcHJvYmxlbV9fYnRuXCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgcm91dGUtY2hvaWNlLSR7Yy5pZH1gXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnY2hvb3NlJywgYy5pZClcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgYy5sYWJlbCB9fVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvdGVtcGxhdGU+XG4gICAgPHRlbXBsYXRlIHYtaWY9XCJhc2tcIj5cbiAgICAgIDxwXG4gICAgICAgIGNsYXNzPVwicm91dGUtcHJvYmxlbV9fbGluZVwiXG4gICAgICAgIGRhdGEtdGlkPVwibXVvbi1sb2NhbC1xdWVzdGlvblwiXG4gICAgICA+XG4gICAgICAgIHt7IHF1ZXN0aW9uIH19XG4gICAgICA8L3A+XG4gICAgICA8ZGl2IGNsYXNzPVwicm91dGUtcHJvYmxlbV9fYnV0dG9uc1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJyb3V0ZS1wcm9ibGVtX19idG5cIlxuICAgICAgICAgIGRhdGEtdGlkPVwibXVvbi1sb2NhbC1vcGVuXCJcbiAgICAgICAgICBAY2xpY2s9XCJvcGVuXCJcbiAgICAgICAgPlxuICAgICAgICAgIE9wZW4gbXVvbjNkLmxvY2FsXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJyb3V0ZS1wcm9ibGVtX19idG5cIlxuICAgICAgICAgIGRhdGEtdGlkPVwibXVvbi1sb2NhbC1jYW5jZWxcIlxuICAgICAgICAgIEBjbGljaz1cIiRlbWl0KCdjYW5jZWwnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBDYW5jZWxcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBNVU9OX0xPQ0FMX1FVRVNUSU9OLCBvcGVuTXVvbkxvY2FsIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL211b24tbG9jYWwnXG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVQcm9ibGVtIHtcbiAgbGluZTogc3RyaW5nO1xuICBjaG9pY2VzOiBBcnJheTx7IGlkOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcgfT47XG59XG5cbi8qKlxuICogU2FpZCB3aGVuIGEgcHJpbnRlciB3b3VsZCBub3Qgb3BlbjogZm9yIGEgcm91dGUgdGhlIHBlcnNvbiBwaWNrZWQsIHdoYXQgZmFpbGVkIGFuZCB0aGUgb3RoZXIgcm91dGVzIGFzIGJ1dHRvbnNcbiAqIChub3RoaW5nIHN3aXRjaGVzIGJ5IGl0c2VsZik7IGZvciBBdXRvIHdpdGggbm90aGluZyBsZWZ0LCB0aGUgcXVlc3Rpb24gYWJvdXQgbXVvbjNkLmxvY2FsLCB3aGljaCBvbmx5IHRoZVxuICogXCJPcGVuXCIgYnV0dG9uIGZvbGxvd3MuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmludGVyUm91dGVQcm9ibGVtIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyBkZWZhdWx0OiBudWxsIH0pIHJlYWRvbmx5IHByb2JsZW0hOiBSb3V0ZVByb2JsZW0gfCBudWxsXG4gIEBQcm9wKHsgZGVmYXVsdDogZmFsc2UgfSkgcmVhZG9ubHkgYXNrITogYm9vbGVhblxuXG4gIHF1ZXN0aW9uID0gTVVPTl9MT0NBTF9RVUVTVElPTlxuXG4gIG9wZW4gKCkge1xuICAgIG9wZW5NdW9uTG9jYWwoKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucm91dGUtcHJvYmxlbSB7XG4gICAgbWFyZ2luOiA4cHggMDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAucm91dGUtcHJvYmxlbV9fbGluZSB7XG4gICAgbWFyZ2luOiAwIDAgNnB4O1xuICB9XG5cbiAgLnJvdXRlLXByb2JsZW1fX2J1dHRvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogOHB4O1xuICB9XG5cbiAgLnJvdXRlLXByb2JsZW1fX2J0biB7XG4gICAgcGFkZGluZzogNnB4IDEycHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgY3VycmVudGNvbG9yO1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICBjb2xvcjogaW5oZXJpdDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tdW9uLWNsb3VkL1ByaW50ZXJSb3V0ZVByb2JsZW0udnVlIn0=