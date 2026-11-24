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
import { WHY_UNSUPPORTED } from "/src/services/muon-ble/unavailable.ts";
let BluetoothWhyText = class extends Vue {
  why;
  get text() {
    return this.why?.text ?? WHY_UNSUPPORTED;
  }
  get link() {
    const link = this.why?.link;
    return link && this.text.includes(link.text) ? link : null;
  }
  get before() {
    return this.link ? this.text.slice(0, this.text.indexOf(this.link.text)) : "";
  }
  get after() {
    return this.link ? this.text.slice(this.text.indexOf(this.link.text) + this.link.text.length) : "";
  }
};
__decorateClass([
  Prop({ type: Object, default: null })
], BluetoothWhyText.prototype, "why", 2);
BluetoothWhyText = __decorateClass([
  Component({})
], BluetoothWhyText);
const _sfc_main = BluetoothWhyText;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", [_vm.link ? [_vm._v(_vm._s(_vm.before)), _c("a", { attrs: { "href": _vm.link.href, "target": "_self", "data-tid": "bluetooth-secure-link" } }, [_vm._v(_vm._s(_vm.link.text))]), _vm._v(_vm._s(_vm.after))] : [_vm._v(_vm._s(_vm.text))]], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  null,
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/BluetoothWhyText.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVlBO0FBQ0E7QUFJQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWxCQTtBQUFBLEVBREE7QUFBQSxHQURBLGlCQUVBO0FBRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQmx1ZXRvb3RoV2h5VGV4dC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c3Bhbj5cbiAgICA8dGVtcGxhdGUgdi1pZj1cImxpbmtcIj57eyBiZWZvcmUgfX08YVxuICAgICAgOmhyZWY9XCJsaW5rLmhyZWZcIlxuICAgICAgdGFyZ2V0PVwiX3NlbGZcIlxuICAgICAgZGF0YS10aWQ9XCJibHVldG9vdGgtc2VjdXJlLWxpbmtcIlxuICAgID57eyBsaW5rLnRleHQgfX08L2E+e3sgYWZ0ZXIgfX08L3RlbXBsYXRlPlxuICAgIDx0ZW1wbGF0ZSB2LWVsc2U+e3sgdGV4dCB9fTwvdGVtcGxhdGU+XG4gIDwvc3Bhbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBXSFlfVU5TVVBQT1JURUQsIHR5cGUgQmx1ZXRvb3RoV2h5IH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS91bmF2YWlsYWJsZSdcblxuLyoqIFRoZSBwbGFpbiByZWFzb24gQmx1ZXRvb3RoIGNhbm5vdCBiZSB1c2VkIGhlcmUgKEtBTi00ODAyKSwgd2l0aCBpdHMgbGluayBvcGVuaW5nIGluIHRoZSBzYW1lIHRhYi4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCbHVldG9vdGhXaHlUZXh0IGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgd2h5ITogQmx1ZXRvb3RoV2h5IHwgbnVsbFxuXG4gIGdldCB0ZXh0ICgpIHtcbiAgICByZXR1cm4gdGhpcy53aHk/LnRleHQgPz8gV0hZX1VOU1VQUE9SVEVEXG4gIH1cblxuICBnZXQgbGluayAoKSB7XG4gICAgY29uc3QgbGluayA9IHRoaXMud2h5Py5saW5rXG4gICAgcmV0dXJuIGxpbmsgJiYgdGhpcy50ZXh0LmluY2x1ZGVzKGxpbmsudGV4dCkgPyBsaW5rIDogbnVsbFxuICB9XG5cbiAgZ2V0IGJlZm9yZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMubGluayA/IHRoaXMudGV4dC5zbGljZSgwLCB0aGlzLnRleHQuaW5kZXhPZih0aGlzLmxpbmsudGV4dCkpIDogJydcbiAgfVxuXG4gIGdldCBhZnRlciAoKSB7XG4gICAgcmV0dXJuIHRoaXMubGluayA/IHRoaXMudGV4dC5zbGljZSh0aGlzLnRleHQuaW5kZXhPZih0aGlzLmxpbmsudGV4dCkgKyB0aGlzLmxpbmsudGV4dC5sZW5ndGgpIDogJydcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9wcmludGVycy9CbHVldG9vdGhXaHlUZXh0LnZ1ZSJ9