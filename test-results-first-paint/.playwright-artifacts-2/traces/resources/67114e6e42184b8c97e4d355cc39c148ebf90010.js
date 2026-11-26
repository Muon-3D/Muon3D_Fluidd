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
let TonePill = class extends Vue {
  tone;
  dot;
};
__decorateClass([
  Prop({ type: String, default: "off" })
], TonePill.prototype, "tone", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], TonePill.prototype, "dot", 2);
TonePill = __decorateClass([
  Component({})
], TonePill);
const _sfc_main = TonePill;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", { staticClass: "tone-pill", class: `tone-pill--${_vm.tone}` }, [_vm.dot ? _c("span", { staticClass: "tone-pill__dot" }) : _vm._e(), _vm._t("default")], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/TonePill.vue?vue&type=style&index=0&scoped=fa3a3387&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "fa3a3387",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/TonePill.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWNBO0FBS0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUNBO0FBSkE7QUFBQSxFQURBO0FBQUEsR0FEQSxTQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxTQUtBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVG9uZVBpbGwudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNwYW5cbiAgICBjbGFzcz1cInRvbmUtcGlsbFwiXG4gICAgOmNsYXNzPVwiYHRvbmUtcGlsbC0tJHt0b25lfWBcIlxuICA+XG4gICAgPHNwYW5cbiAgICAgIHYtaWY9XCJkb3RcIlxuICAgICAgY2xhc3M9XCJ0b25lLXBpbGxfX2RvdFwiXG4gICAgLz5cbiAgICA8c2xvdCAvPlxuICA8L3NwYW4+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBUaWxlVG9uZSB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlcnMtcGFnZS9tb2RlbCdcblxuLyoqIEEgc3RhdGUgaW4gYSB3b3JkLCBpbiBpdHMgY29sb3VyOiBSZWFkeSwgNDIlLCBQYXVzZWQsIE9mZmxpbmUuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVG9uZVBpbGwgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ29mZicgfSlcbiAgcmVhZG9ubHkgdG9uZSE6IFRpbGVUb25lXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiB0cnVlIH0pXG4gIHJlYWRvbmx5IGRvdCE6IGJvb2xlYW5cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC50b25lLXBpbGwge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDZweDtcbiAgICBoZWlnaHQ6IDI0cHg7XG4gICAgcGFkZGluZzogMCAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC50b25lLXBpbGxfX2RvdCB7XG4gICAgd2lkdGg6IDhweDtcbiAgICBoZWlnaHQ6IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZDogY3VycmVudENvbG9yO1xuICB9XG5cbiAgLnRvbmUtcGlsbC0tb2sgeyBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLXN1Y2Nlc3MpIDE2JSwgdHJhbnNwYXJlbnQpOyBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MpOyB9XG4gIC50b25lLXBpbGwtLXJ1biB7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7IGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTsgfVxuICAudG9uZS1waWxsLS13YXJuIHsgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLW0zZC13YXJuaW5nKSAxNiUsIHRyYW5zcGFyZW50KTsgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTsgfVxuICAudG9uZS1waWxsLS1lcnIgeyBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMTYlLCB0cmFuc3BhcmVudCk7IGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTsgfVxuICAudG9uZS1waWxsLS1vZmYgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuICAudG9uZS1waWxsLS1pbmZvIHsgYmFja2dyb3VuZDogY29sb3ItbWl4KGluIHNyZ2IsICM2YWE4ZmYgMTYlLCB0cmFuc3BhcmVudCk7IGNvbG9yOiAjNmFhOGZmOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvcHJpbnRlcnMvVG9uZVBpbGwudnVlIn0=