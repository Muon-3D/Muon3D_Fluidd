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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let MaintenanceTile = class extends Vue {
  title;
  icon;
  flush;
  locked;
};
__decorateClass([
  Prop({ type: String, default: "" })
], MaintenanceTile.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], MaintenanceTile.prototype, "icon", 2);
__decorateClass([
  Prop({ type: Boolean })
], MaintenanceTile.prototype, "flush", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], MaintenanceTile.prototype, "locked", 2);
MaintenanceTile = __decorateClass([
  Component({})
], MaintenanceTile);
const _sfc_main = MaintenanceTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "mtile", class: { "mtile--flush": _vm.flush, "mtile--locked": !!_vm.locked } }, [_vm.title ? _c("header", { staticClass: "mtile__head" }, [_c("h2", { staticClass: "mtile__title" }, [_vm.icon ? _c(__unplugin_components_0, { attrs: { "name": _vm.icon } }) : _vm._e(), _vm._v(" " + _vm._s(_vm.title) + " ")], 1), _vm.$slots.aside ? _c("span", { staticClass: "mtile__aside" }, [_vm._t("aside")], 2) : _vm._e()]) : _vm._e(), _c("div", { staticClass: "mtile__body", class: { "mtile__body--locked": !!_vm.locked } }, [_vm._t("default")], 2), _vm.locked ? _c("p", { staticClass: "mtile__lock" }, [_c(__unplugin_components_1, { attrs: { "name": "lock", "small": "" } }), _vm._v(" " + _vm._s(_vm.locked) + " ")], 1) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MaintenanceTile.vue?vue&type=style&index=0&scoped=ad60e692&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ad60e692",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MaintenanceTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBeUNBO0FBUUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBQ0E7QUFYQTtBQUFBLEVBREE7QUFBQSxHQURBLGdCQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxnQkFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZ0JBUUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQVhBLGdCQVlBO0FBWkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTWFpbnRlbmFuY2VUaWxlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJtdGlsZVwiXG4gICAgOmNsYXNzPVwieyAnbXRpbGUtLWZsdXNoJzogZmx1c2gsICdtdGlsZS0tbG9ja2VkJzogISFsb2NrZWQgfVwiXG4gID5cbiAgICA8aGVhZGVyXG4gICAgICB2LWlmPVwidGl0bGVcIlxuICAgICAgY2xhc3M9XCJtdGlsZV9faGVhZFwiXG4gICAgPlxuICAgICAgPGgyIGNsYXNzPVwibXRpbGVfX3RpdGxlXCI+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgdi1pZj1cImljb25cIlxuICAgICAgICAgIDpuYW1lPVwiaWNvblwiXG4gICAgICAgIC8+XG4gICAgICAgIHt7IHRpdGxlIH19XG4gICAgICA8L2gyPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cIiRzbG90cy5hc2lkZVwiXG4gICAgICAgIGNsYXNzPVwibXRpbGVfX2FzaWRlXCJcbiAgICAgID48c2xvdCBuYW1lPVwiYXNpZGVcIiAvPjwvc3Bhbj5cbiAgICA8L2hlYWRlcj5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cIm10aWxlX19ib2R5XCJcbiAgICAgIDpjbGFzcz1cInsgJ210aWxlX19ib2R5LS1sb2NrZWQnOiAhIWxvY2tlZCB9XCJcbiAgICA+XG4gICAgICA8c2xvdCAvPlxuICAgIDwvZGl2PlxuICAgIDxwXG4gICAgICB2LWlmPVwibG9ja2VkXCJcbiAgICAgIGNsYXNzPVwibXRpbGVfX2xvY2tcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgIG5hbWU9XCJsb2NrXCJcbiAgICAgICAgc21hbGxcbiAgICAgIC8+XG4gICAgICB7eyBsb2NrZWQgfX1cbiAgICA8L3A+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5cbi8qKlxuICogQSB0aWxlIG9mIE1haW50ZW5hbmNlIGFuZCBCZWQ6IGFuIGljb24gYW5kIGEgYm9sZCB0aXRsZSBvbiB0aGUgbGVmdCwgYVxuICogc3RhdHVzIG9yIGFuIGFjdGlvbiBvbiB0aGUgcmlnaHQsIHRoZW4gaXRzIGNvbnRlbnQuIGBmbHVzaGAgbGV0cyBhIGxpc3RcbiAqIHJ1biBlZGdlIHRvIGVkZ2UsIHdpdGggaGFpcmxpbmVzIGJldHdlZW4gaXRzIHJvd3MuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWludGVuYW5jZVRpbGUgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgdGl0bGUhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgaWNvbiE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBmbHVzaD86IGJvb2xlYW5cblxuICAvKiogV2h5IHRoZSB0aWxlIGNhbm5vdCBiZSB1c2VkIG5vdzogaXRzIGNvbnRlbnQgZGltcyBhbmQgdGhlIHJlYXNvbiBzaG93cyB1bmRlciBpdC4gKi9cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IGxvY2tlZCE6IHN0cmluZ1xufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLm10aWxlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxNHB4O1xuICAgIG1pbi13aWR0aDogMDtcbiAgICBwYWRkaW5nOiAxOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAubXRpbGUtLWZsdXNoIHtcbiAgICBwYWRkaW5nOiAwIDAgNnB4O1xuICAgIGdhcDogNnB4O1xuXG4gICAgLm10aWxlX19oZWFkIHtcbiAgICAgIHBhZGRpbmc6IDE2cHggMThweCAwO1xuICAgIH1cbiAgfVxuXG4gIC5tdGlsZV9fYm9keSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTRweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAubXRpbGUtLWZsdXNoIC5tdGlsZV9fYm9keSB7IGdhcDogNnB4OyB9XG5cbiAgLm10aWxlX19ib2R5LS1sb2NrZWQgeyBvcGFjaXR5OiAwLjY7IH1cblxuICAubXRpbGVfX2xvY2sge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDZweDtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLm10aWxlLS1mbHVzaCAubXRpbGVfX2xvY2sgeyBtYXJnaW46IDAgMThweCA4cHg7IH1cblxuICAubXRpbGVfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIGdhcDogOHB4IDEycHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLm10aWxlX190aXRsZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtYXJnaW46IDA7XG4gICAgZm9udC1zaXplOiAxNnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICAubXRpbGVfX2FzaWRlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbWFpbnRlbmFuY2UvTWFpbnRlbmFuY2VUaWxlLnZ1ZSJ9