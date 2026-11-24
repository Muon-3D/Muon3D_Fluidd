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
let ToggleSwitch = class extends Vue {
  value;
  label;
  disabled;
  small;
};
__decorateClass([
  Prop({ type: Boolean, default: false })
], ToggleSwitch.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], ToggleSwitch.prototype, "label", 2);
__decorateClass([
  Prop({ type: Boolean })
], ToggleSwitch.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: Boolean })
], ToggleSwitch.prototype, "small", 2);
ToggleSwitch = __decorateClass([
  Component({})
], ToggleSwitch);
const _sfc_main = ToggleSwitch;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("button", { staticClass: "toggle", class: { "toggle--on": _vm.value, "toggle--sm": _vm.small }, attrs: { "type": "button", "role": "switch", "aria-checked": _vm.value ? "true" : "false", "aria-label": _vm.label, "disabled": _vm.disabled }, on: { "click": function($event) {
    return _vm.$emit("input", !_vm.value);
  } } });
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ToggleSwitch.vue?vue&type=style&index=0&scoped=482ad522&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "482ad522",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ToggleSwitch.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWNBO0FBSUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBQ0E7QUFYQTtBQUFBLEVBREE7QUFBQSxHQURBLGFBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLGFBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLGFBUUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQVhBLGFBWUE7QUFaQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJUb2dnbGVTd2l0Y2gudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGJ1dHRvblxuICAgIHR5cGU9XCJidXR0b25cIlxuICAgIHJvbGU9XCJzd2l0Y2hcIlxuICAgIGNsYXNzPVwidG9nZ2xlXCJcbiAgICA6Y2xhc3M9XCJ7ICd0b2dnbGUtLW9uJzogdmFsdWUsICd0b2dnbGUtLXNtJzogc21hbGwgfVwiXG4gICAgOmFyaWEtY2hlY2tlZD1cInZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgOmFyaWEtbGFiZWw9XCJsYWJlbFwiXG4gICAgOmRpc2FibGVkPVwiZGlzYWJsZWRcIlxuICAgIEBjbGljaz1cIiRlbWl0KCdpbnB1dCcsICF2YWx1ZSlcIlxuICAvPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcblxuLyoqIE9uIG9yIG9mZi4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUb2dnbGVTd2l0Y2ggZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IGZhbHNlIH0pXG4gIHJlYWRvbmx5IHZhbHVlITogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBsYWJlbCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBkaXNhYmxlZD86IGJvb2xlYW5cblxuICAvKiogMzYgcHggd2lkZSwgZm9yIGEgZ3JpZCBvZiBzd2l0Y2hlcy4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNtYWxsPzogYm9vbGVhblxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnRvZ2dsZSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGZsZXg6IG5vbmU7XG4gICAgd2lkdGg6IDQ0cHg7XG4gICAgaGVpZ2h0OiAyNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEzcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN3aXRjaC1vZmYsIHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKSk7XG4gICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZC1jb2xvciB2YXIoLS1tM2QtZHVyYXRpb24tZmFzdCkgdmFyKC0tbTNkLWVhc2UpO1xuXG4gICAgJjo6YWZ0ZXIge1xuICAgICAgY29udGVudDogJyc7XG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICB0b3A6IDJweDtcbiAgICAgIGxlZnQ6IDJweDtcbiAgICAgIHdpZHRoOiAyMnB4O1xuICAgICAgaGVpZ2h0OiAyMnB4O1xuICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICAgIGJveC1zaGFkb3c6IDAgMXB4IDNweCByZ2IoMCAwIDAgLyAzMCUpO1xuICAgICAgdHJhbnNpdGlvbjogbGVmdCB2YXIoLS1tM2QtZHVyYXRpb24tZmFzdCkgdmFyKC0tbTNkLWVhc2UpO1xuICAgIH1cblxuICAgICY6ZGlzYWJsZWQge1xuICAgICAgb3BhY2l0eTogMC40NTtcbiAgICAgIGN1cnNvcjogZGVmYXVsdDtcbiAgICB9XG4gIH1cblxuICAudG9nZ2xlLS1vbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7XG5cbiAgICAmOjphZnRlciB7XG4gICAgICBsZWZ0OiAyMHB4O1xuICAgIH1cbiAgfVxuXG4gIC50b2dnbGUtLXNtIHtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDIycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTFweDtcblxuICAgICY6OmFmdGVyIHtcbiAgICAgIHdpZHRoOiAxOHB4O1xuICAgICAgaGVpZ2h0OiAxOHB4O1xuICAgIH1cblxuICAgICYudG9nZ2xlLS1vbjo6YWZ0ZXIge1xuICAgICAgbGVmdDogMTZweDtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb250cm9sL1RvZ2dsZVN3aXRjaC52dWUifQ==