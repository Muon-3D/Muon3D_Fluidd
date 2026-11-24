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
let PhotoFace = class extends Vue {
  photo;
  letter;
  broken = false;
  onPhoto() {
    this.broken = false;
  }
};
__decorateClass([
  Prop({ type: String, default: null })
], PhotoFace.prototype, "photo", 2);
__decorateClass([
  Prop({ type: String, default: "?" })
], PhotoFace.prototype, "letter", 2);
__decorateClass([
  Watch("photo")
], PhotoFace.prototype, "onPhoto", 1);
PhotoFace = __decorateClass([
  Component({})
], PhotoFace);
const _sfc_main = PhotoFace;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", { staticClass: "photo-face" }, [_vm.photo && !_vm.broken ? _c("img", { attrs: { "src": _vm.photo, "alt": "" }, on: { "error": function($event) {
    _vm.broken = true;
  } } }) : [_vm._v(_vm._s(_vm.letter))]], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/account/profile/PhotoFace.vue?vue&type=style&index=0&scoped=513e1bef&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "513e1bef",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/account/profile/PhotoFace.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWFBO0FBUUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFUQTtBQUFBO0FBQUEsR0FEQSxVQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsVUFFQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBTkEsVUFPQTtBQVBBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlBob3RvRmFjZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c3BhbiBjbGFzcz1cInBob3RvLWZhY2VcIj5cbiAgICA8aW1nXG4gICAgICB2LWlmPVwicGhvdG8gJiYgIWJyb2tlblwiXG4gICAgICA6c3JjPVwicGhvdG9cIlxuICAgICAgYWx0PVwiXCJcbiAgICAgIEBlcnJvcj1cImJyb2tlbiA9IHRydWVcIlxuICAgID5cbiAgICA8dGVtcGxhdGUgdi1lbHNlPnt7IGxldHRlciB9fTwvdGVtcGxhdGU+XG4gIDwvc3Bhbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKipcbiAqIFRoZSBpbnNpZGUgb2YgYSByb3VuZCBhdmF0YXIgKEtBTi0xODI2KTogdGhlIHBob3RvLCBvciB0aGUgaW5pdGlhbHMgd2hlblxuICogdGhlcmUgaXMgbm9uZSBvciBpdCBjYW5ub3QgYmUgbG9hZGVkIChhbm90aGVyIHBlcnNvbidzIHB1YmxpYyBwaG90byA0MDRzXG4gKiB3aGlsZSB0aGVpciBwYWdlIGlzIG5vdCB2aXNpYmxlKS4gVGhlIHBhcmVudCBkcmF3cyB0aGUgY2lyY2xlIGFuZCBpdHMgc2l6ZS5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBob3RvRmFjZSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiBudWxsIH0pIHJlYWRvbmx5IHBob3RvITogc3RyaW5nIHwgbnVsbFxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJz8nIH0pIHJlYWRvbmx5IGxldHRlciE6IHN0cmluZ1xuXG4gIGJyb2tlbiA9IGZhbHNlXG5cbiAgQFdhdGNoKCdwaG90bycpXG4gIG9uUGhvdG8gKCkge1xuICAgIHRoaXMuYnJva2VuID0gZmFsc2VcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnBob3RvLWZhY2Uge1xuICAgIGRpc3BsYXk6IGNvbnRlbnRzO1xuXG4gICAgaW1nIHtcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgICAgIG9iamVjdC1maXQ6IGNvdmVyO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2FjY291bnQvcHJvZmlsZS9QaG90b0ZhY2UudnVlIn0=