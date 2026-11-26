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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let TaskFold = class extends Vue {
  foldId;
  title;
  summary;
  value;
  restoreFocus(open) {
    const panel = this.$refs.panel;
    if (!open && panel?.contains(document.activeElement)) this.$refs.trigger.focus();
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], TaskFold.prototype, "foldId", 2);
__decorateClass([
  Prop({ type: String, required: true })
], TaskFold.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, required: true })
], TaskFold.prototype, "summary", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], TaskFold.prototype, "value", 2);
__decorateClass([
  Watch("value")
], TaskFold.prototype, "restoreFocus", 1);
TaskFold = __decorateClass([
  Component({})
], TaskFold);
const _sfc_main = TaskFold;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "task-fold" }, [_c("button", { ref: "trigger", staticClass: "task-fold__trigger", attrs: { "id": `${_vm.foldId}-trigger`, "type": "button", "aria-expanded": _vm.value ? "true" : "false", "aria-controls": _vm.foldId }, on: { "click": function($event) {
    return _vm.$emit("input", !_vm.value);
  } } }, [_c("span", [_vm._v(_vm._s(_vm.title))]), _c("span", { staticClass: "task-fold__summary" }, [_vm._v(_vm._s(_vm.summary))]), _c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.value ? "\u2212" : "+"))])]), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.value, expression: "value" }], ref: "panel", staticClass: "task-fold__panel", attrs: { "id": _vm.foldId, "aria-labelledby": `${_vm.foldId}-trigger` } }, [_vm._t("default")], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/TaskFold.vue?vue&type=style&index=0&scoped=6bee6980&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "6bee6980",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/TaskFold.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTRCQTtBQUdBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBVkE7QUFBQTtBQUFBLEdBREEsU0FDQTtBQUNBO0FBQUE7QUFBQSxHQUZBLFNBRUE7QUFDQTtBQUFBO0FBQUEsR0FIQSxTQUdBO0FBQ0E7QUFBQTtBQUFBLEdBSkEsU0FJQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBTkEsU0FPQTtBQVBBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlRhc2tGb2xkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uIGNsYXNzPVwidGFzay1mb2xkXCI+XG4gICAgPGJ1dHRvblxuICAgICAgOmlkPVwiYCR7Zm9sZElkfS10cmlnZ2VyYFwiXG4gICAgICByZWY9XCJ0cmlnZ2VyXCJcbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3M9XCJ0YXNrLWZvbGRfX3RyaWdnZXJcIlxuICAgICAgOmFyaWEtZXhwYW5kZWQ9XCJ2YWx1ZSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgOmFyaWEtY29udHJvbHM9XCJmb2xkSWRcIlxuICAgICAgQGNsaWNrPVwiJGVtaXQoJ2lucHV0JywgIXZhbHVlKVwiXG4gICAgPlxuICAgICAgPHNwYW4+e3sgdGl0bGUgfX08L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cInRhc2stZm9sZF9fc3VtbWFyeVwiPnt7IHN1bW1hcnkgfX08L3NwYW4+XG4gICAgICA8c3BhbiBhcmlhLWhpZGRlbj1cInRydWVcIj57eyB2YWx1ZSA/ICfiiJInIDogJysnIH19PC9zcGFuPlxuICAgIDwvYnV0dG9uPlxuICAgIDxkaXZcbiAgICAgIHYtc2hvdz1cInZhbHVlXCJcbiAgICAgIDppZD1cImZvbGRJZFwiXG4gICAgICByZWY9XCJwYW5lbFwiXG4gICAgICBjbGFzcz1cInRhc2stZm9sZF9fcGFuZWxcIlxuICAgICAgOmFyaWEtbGFiZWxsZWRieT1cImAke2ZvbGRJZH0tdHJpZ2dlcmBcIlxuICAgID5cbiAgICAgIDxzbG90IC8+XG4gICAgPC9kaXY+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFza0ZvbGQgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgZm9sZElkITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSB0aXRsZSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgc3VtbWFyeSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IGZhbHNlIH0pIHJlYWRvbmx5IHZhbHVlITogYm9vbGVhblxuXG4gIEBXYXRjaCgndmFsdWUnKVxuICByZXN0b3JlRm9jdXMgKG9wZW46IGJvb2xlYW4pIHtcbiAgICBjb25zdCBwYW5lbCA9IHRoaXMuJHJlZnMucGFuZWwgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWRcbiAgICBpZiAoIW9wZW4gJiYgcGFuZWw/LmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpKSAodGhpcy4kcmVmcy50cmlnZ2VyIGFzIEhUTUxCdXR0b25FbGVtZW50KS5mb2N1cygpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC50YXNrLWZvbGRfX3RyaWdnZXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgcGFkZGluZzogMTJweCAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICBmb250OiBpbmhlcml0O1xuXG4gICAgJjpmb2N1cy12aXNpYmxlIHtcbiAgICAgIG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICAgIG91dGxpbmUtb2Zmc2V0OiAycHg7XG4gICAgfVxuICB9XG5cbiAgLnRhc2stZm9sZF9fc3VtbWFyeSB7XG4gICAgZmxleDogMTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAudGFzay1mb2xkX19wYW5lbCB7XG4gICAgcGFkZGluZy1ib3R0b206IDEycHg7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb250cm9sL1Rhc2tGb2xkLnZ1ZSJ9