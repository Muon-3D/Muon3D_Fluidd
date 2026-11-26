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
import { Component, Vue, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import QrcodeVue from "/.vite-e2e/4291/deps/qrcode__vue.js?v=9b9fafc7";
let AppQrCode = class extends Vue {
  value;
  size;
};
__decorateClass([
  Prop({ type: String, default: "" })
], AppQrCode.prototype, "value", 2);
__decorateClass([
  Prop({ type: Number, default: 260 })
], AppQrCode.prototype, "size", 2);
AppQrCode = __decorateClass([
  Component({
    components: {
      QrcodeVue
    }
  })
], AppQrCode);
const _sfc_main = AppQrCode;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("qrcode-vue", { attrs: { "value": _vm.value, "size": _vm.size, "level": "L" } });
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/AppQrCode.vue?vue&type=style&index=0&scoped=9b80f87e&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9b80f87e",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppQrCode.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVNBO0FBQ0E7QUFPQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQ0E7QUFKQTtBQUFBLEVBREE7QUFBQSxHQURBLFVBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLFVBS0E7QUFMQTtBQUFBLEVBTEE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwUXJDb2RlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxxcmNvZGUtdnVlXG4gICAgOnZhbHVlPVwidmFsdWVcIlxuICAgIDpzaXplPVwic2l6ZVwiXG4gICAgbGV2ZWw9XCJMXCJcbiAgLz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSwgUHJvcCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgUXJjb2RlVnVlIGZyb20gJ3FyY29kZS52dWUnXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7XG4gICAgUXJjb2RlVnVlXG4gIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHBRckNvZGUgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgdmFsdWUhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMjYwIH0pXG4gIHJlYWRvbmx5IHNpemUhOiBudW1iZXJcbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIDpkZWVwKGNhbnZhcywgc3ZnKSB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgcGFkZGluZzogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiAjZmZmO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvQXBwUXJDb2RlLnZ1ZSJ9