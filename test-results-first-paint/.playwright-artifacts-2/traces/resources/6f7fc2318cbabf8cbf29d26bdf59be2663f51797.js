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
let PrintersSection = class extends Vue {
  title;
  count;
  note;
  muted;
};
__decorateClass([
  Prop({ type: String, default: "" })
], PrintersSection.prototype, "title", 2);
__decorateClass([
  Prop({ type: Number, default: null })
], PrintersSection.prototype, "count", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], PrintersSection.prototype, "note", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersSection.prototype, "muted", 2);
PrintersSection = __decorateClass([
  Component({})
], PrintersSection);
const _sfc_main = PrintersSection;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "psec" }, [_c("div", { staticClass: "psec__head" }, [_vm._t("title", function() {
    return [_c("h2", { staticClass: "psec__name", class: { "psec__name--muted": _vm.muted } }, [_vm._v(" " + _vm._s(_vm.title) + " ")])];
  }), _vm.count != null ? _c("span", { staticClass: "psec__count", attrs: { "data-tid": "section-count" } }, [_vm._v(_vm._s(_vm.count))]) : _vm._e(), _vm._t("after"), _c("span", { staticClass: "psec__grow" }), _vm.note ? _c("span", { staticClass: "psec__note" }, [_vm._v(_vm._s(_vm.note))]) : _vm._e(), _vm._t("actions")], 2), _vm._t("default")], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/printers/PrintersSection.vue?vue&type=style&index=0&scoped=d29dead5&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "d29dead5",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/PrintersSection.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTZCQTtBQUlBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUNBO0FBVkE7QUFBQSxFQURBO0FBQUEsR0FEQSxnQkFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsZ0JBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLGdCQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxnQkFXQTtBQVhBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlByaW50ZXJzU2VjdGlvbi52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvbiBjbGFzcz1cInBzZWNcIj5cbiAgICA8ZGl2IGNsYXNzPVwicHNlY19faGVhZFwiPlxuICAgICAgPHNsb3QgbmFtZT1cInRpdGxlXCI+XG4gICAgICAgIDxoMlxuICAgICAgICAgIGNsYXNzPVwicHNlY19fbmFtZVwiXG4gICAgICAgICAgOmNsYXNzPVwieyAncHNlY19fbmFtZS0tbXV0ZWQnOiBtdXRlZCB9XCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHRpdGxlIH19XG4gICAgICAgIDwvaDI+XG4gICAgICA8L3Nsb3Q+XG4gICAgICA8c3BhblxuICAgICAgICB2LWlmPVwiY291bnQgIT0gbnVsbFwiXG4gICAgICAgIGNsYXNzPVwicHNlY19fY291bnRcIlxuICAgICAgICBkYXRhLXRpZD1cInNlY3Rpb24tY291bnRcIlxuICAgICAgPnt7IGNvdW50IH19PC9zcGFuPlxuICAgICAgPHNsb3QgbmFtZT1cImFmdGVyXCIgLz5cbiAgICAgIDxzcGFuIGNsYXNzPVwicHNlY19fZ3Jvd1wiIC8+XG4gICAgICA8c3BhblxuICAgICAgICB2LWlmPVwibm90ZVwiXG4gICAgICAgIGNsYXNzPVwicHNlY19fbm90ZVwiXG4gICAgICA+e3sgbm90ZSB9fTwvc3Bhbj5cbiAgICAgIDxzbG90IG5hbWU9XCJhY3Rpb25zXCIgLz5cbiAgICA8L2Rpdj5cbiAgICA8c2xvdCAvPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKiogQSBzZWN0aW9uIG9mIHRoZSBBbGwgcHJpbnRlcnMgcGFnZTogYSB0aXRsZSwgYSBtdXRlZCBjb3VudCwgYW4gb3B0aW9uYWwgbm90ZSBvbiB0aGUgcmlnaHQsIHRoZW4gaXRzIGNvbnRlbnQuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJpbnRlcnNTZWN0aW9uIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgY291bnQhOiBudW1iZXIgfCBudWxsXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IG5vdGUhOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgbXV0ZWQ/OiBib29sZWFuXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucHNlYyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgYm9yZGVyLXJhZGl1czogMjZweDtcbiAgICB0cmFuc2l0aW9uOiBib3gtc2hhZG93IHZhcigtLW0zZC1kdXJhdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZSk7XG4gIH1cblxuICAucHNlY19faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lO1xuICAgIGdhcDogNnB4IDEwcHg7XG4gICAgbWluLWhlaWdodDogMzJweDtcbiAgfVxuXG4gIC5wc2VjX19uYW1lIHtcbiAgICBtYXJnaW46IDA7XG4gICAgZm9udC1zaXplOiAyMHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICAucHNlY19fbmFtZS0tbXV0ZWQgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyB9XG5cbiAgLnBzZWNfX2NvdW50LFxuICAucHNlY19fbm90ZSB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICB9XG5cbiAgLnBzZWNfX25vdGUgeyBmb250LXNpemU6IDEzcHg7IH1cbiAgLnBzZWNfX2dyb3cgeyBmbGV4OiAxIDEgYXV0bzsgfVxuXG4gIEBtZWRpYSAobWF4LXdpZHRoOiA2OTlweCkge1xuICAgIC5wc2VjX19uYW1lIHsgZm9udC1zaXplOiAxN3B4OyB9XG4gICAgLnBzZWNfX25vdGUgeyBkaXNwbGF5OiBub25lOyB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9wcmludGVycy9QcmludGVyc1NlY3Rpb24udnVlIn0=