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
let ForeignSilhouette = class extends Vue {
  formFactor;
};
__decorateClass([
  Prop({ type: String, required: true })
], ForeignSilhouette.prototype, "formFactor", 2);
ForeignSilhouette = __decorateClass([
  Component
], ForeignSilhouette);
const _sfc_main = ForeignSilhouette;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("svg", { staticClass: "foreign-silhouette", attrs: { "viewBox": "0 0 112 80", "role": "img", "aria-label": "Printer" } }, [_c("g", { attrs: { "fill": "none", "stroke": "currentColor", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2.5" } }, [_vm.formFactor === "enclosed" ? [_c("path", { attrs: { "d": "M18 69V14h76v55M14 69h84M27 61V23h58v38M56 23v38M26 69h60" } }), _c("path", { attrs: { "d": "M44 61V48l12-9 12 9v13M56 39v-8" } })] : _vm.formFactor === "open-frame" ? [_c("path", { attrs: { "d": "M14 68h84M22 67V14h68v53M22 22h68M30 61h52M37 61V39h38v22M56 22v17" } }), _c("path", { attrs: { "d": "M49 39v-8h14v8" } })] : [_c("path", { attrs: { "d": "M12 67h88M20 65V20h72v45M24 26h64M31 60h49M38 59V39h34v20M55 26v13" } }), _c("path", { attrs: { "d": "M43 39v-7h24v7M17 15h78M28 15l-8 5M84 15l8 5" } })]], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/foreign/ForeignSilhouette.vue?vue&type=style&index=0&scoped=d1fe1642&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "d1fe1642",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/foreign/ForeignSilhouette.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQStCQTtBQUlBO0FBQUEsRUFFQTtBQUNBO0FBREE7QUFBQSxFQURBO0FBQUEsR0FEQSxrQkFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkZvcmVpZ25TaWxob3VldHRlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzdmdcbiAgICBjbGFzcz1cImZvcmVpZ24tc2lsaG91ZXR0ZVwiXG4gICAgdmlld0JveD1cIjAgMCAxMTIgODBcIlxuICAgIHJvbGU9XCJpbWdcIlxuICAgIGFyaWEtbGFiZWw9XCJQcmludGVyXCJcbiAgPlxuICAgIDxnXG4gICAgICBmaWxsPVwibm9uZVwiXG4gICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiXG4gICAgICBzdHJva2Utd2lkdGg9XCIyLjVcIlxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiZm9ybUZhY3RvciA9PT0gJ2VuY2xvc2VkJ1wiPlxuICAgICAgICA8cGF0aCBkPVwiTTE4IDY5VjE0aDc2djU1TTE0IDY5aDg0TTI3IDYxVjIzaDU4djM4TTU2IDIzdjM4TTI2IDY5aDYwXCIgLz5cbiAgICAgICAgPHBhdGggZD1cIk00NCA2MVY0OGwxMi05IDEyIDl2MTNNNTYgMzl2LThcIiAvPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWVsc2UtaWY9XCJmb3JtRmFjdG9yID09PSAnb3Blbi1mcmFtZSdcIj5cbiAgICAgICAgPHBhdGggZD1cIk0xNCA2OGg4NE0yMiA2N1YxNGg2OHY1M00yMiAyMmg2OE0zMCA2MWg1Mk0zNyA2MVYzOWgzOHYyMk01NiAyMnYxN1wiIC8+XG4gICAgICAgIDxwYXRoIGQ9XCJNNDkgMzl2LThoMTR2OFwiIC8+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgICAgPHBhdGggZD1cIk0xMiA2N2g4OE0yMCA2NVYyMGg3MnY0NU0yNCAyNmg2NE0zMSA2MGg0OU0zOCA1OVYzOWgzNHYyME01NSAyNnYxM1wiIC8+XG4gICAgICAgIDxwYXRoIGQ9XCJNNDMgMzl2LTdoMjR2N00xNyAxNWg3OE0yOCAxNWwtOCA1TTg0IDE1bDggNVwiIC8+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvZz5cbiAgPC9zdmc+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBGb3JtRmFjdG9yIH0gZnJvbSAnQC9zZXJ2aWNlcy9mb3JlaWduLXByaW50ZXJzL3R5cGVzJ1xuXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb3JlaWduU2lsaG91ZXR0ZSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBmb3JtRmFjdG9yITogRm9ybUZhY3RvclxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBzY29wZWQ+XG4uZm9yZWlnbi1zaWxob3VldHRlIHtcbiAgd2lkdGg6IDY0cHg7XG4gIGhlaWdodDogNDhweDtcbiAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbn1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9mb3JlaWduL0ZvcmVpZ25TaWxob3VldHRlLnZ1ZSJ9