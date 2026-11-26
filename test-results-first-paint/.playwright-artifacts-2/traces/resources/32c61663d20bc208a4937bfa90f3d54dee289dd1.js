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
let BluetoothCodeBoxes = class extends Vue {
  code;
  get chars() {
    return this.code.replace(/\s/g, "").split("");
  }
};
__decorateClass([
  Prop({ type: String, default: "" })
], BluetoothCodeBoxes.prototype, "code", 2);
BluetoothCodeBoxes = __decorateClass([
  Component({})
], BluetoothCodeBoxes);
const _sfc_main = BluetoothCodeBoxes;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "ble-code", attrs: { "role": "img", "aria-label": _vm.chars.join(" ") } }, _vm._l(_vm.chars, function(ch, i) {
    return _c("span", { key: i, class: { "is-gap": i === 3 } }, [_vm._v(_vm._s(ch))]);
  }), 0);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-ble/BluetoothCodeBoxes.vue?vue&type=style&index=0&scoped=cffe1530&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "cffe1530",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-ble/BluetoothCodeBoxes.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWVBO0FBSUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FEQSxtQkFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkJsdWV0b290aENvZGVCb3hlcy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJibGUtY29kZVwiXG4gICAgcm9sZT1cImltZ1wiXG4gICAgOmFyaWEtbGFiZWw9XCJjaGFycy5qb2luKCcgJylcIlxuICA+XG4gICAgPHNwYW5cbiAgICAgIHYtZm9yPVwiKGNoLCBpKSBpbiBjaGFyc1wiXG4gICAgICA6a2V5PVwiaVwiXG4gICAgICA6Y2xhc3M9XCJ7ICdpcy1nYXAnOiBpID09PSAzIH1cIlxuICAgID57eyBjaCB9fTwvc3Bhbj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKiogVGhlIHNpeCBjaGFyYWN0ZXJzIHRvIGNvbXBhcmUgd2l0aCB0aGUgcHJpbnRlcidzIHNjcmVlbiwgb25lIHRvIGEgYm94LCBhcyBcIkY2USBUREhcIi4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCbHVldG9vdGhDb2RlQm94ZXMgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgY29kZSE6IHN0cmluZ1xuXG4gIGdldCBjaGFycyAoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmNvZGUucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnJylcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5ibGUtY29kZSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBnYXA6IDZweDtcbiAgbWFyZ2luOiA0cHggMCAxNnB4O1xuXG4gIHNwYW4ge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDQwcHg7XG4gICAgaGVpZ2h0OiA1MnB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLW0zZC1yYWRpdXMtbWQpO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXNpemU6IDI2cHg7XG4gICAgZm9udC13ZWlnaHQ6IHZhcigtLW0zZC13ZWlnaHQtc2VtaWJvbGQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG5cbiAgICAmLmlzLWdhcCB7XG4gICAgICBtYXJnaW4tbGVmdDogMTJweDtcbiAgICB9XG4gIH1cbn1cblxuQG1lZGlhIChtYXgtd2lkdGg6IDM4MHB4KSB7XG4gIC5ibGUtY29kZSBzcGFuIHtcbiAgICB3aWR0aDogMzRweDtcbiAgICBoZWlnaHQ6IDQ2cHg7XG4gICAgZm9udC1zaXplOiAyMnB4O1xuICB9XG59XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbXVvbi1ibGUvQmx1ZXRvb3RoQ29kZUJveGVzLnZ1ZSJ9