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
let uid = 0;
let SetupStepCard = class extends Vue {
  eyebrow;
  title;
  sub;
  flat;
  titleId = `setup-step-${++uid}`;
};
__decorateClass([
  Prop({ type: String, default: "" })
], SetupStepCard.prototype, "eyebrow", 2);
__decorateClass([
  Prop({ type: String, required: true })
], SetupStepCard.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], SetupStepCard.prototype, "sub", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], SetupStepCard.prototype, "flat", 2);
SetupStepCard = __decorateClass([
  Component({})
], SetupStepCard);
const _sfc_main = SetupStepCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "setup-step", class: { "is-flat": _vm.flat }, attrs: { "aria-labelledby": _vm.titleId } }, [_vm.eyebrow ? _c("p", { staticClass: "setup-step__eyebrow", attrs: { "data-tid": "step-eyebrow" } }, [_vm._v(" " + _vm._s(_vm.eyebrow) + " ")]) : _vm._e(), _c("h1", { staticClass: "setup-step__title", attrs: { "id": _vm.titleId } }, [_vm._v(" " + _vm._s(_vm.title) + " ")]), _vm.sub ? _c("p", { staticClass: "setup-step__sub" }, [_vm._v(" " + _vm._s(_vm.sub) + " ")]) : _vm._e(), _c("div", { staticClass: "setup-step__body" }, [_vm._t("default")], 2), _vm.$slots.footer ? _c("footer", { staticClass: "setup-step__foot" }, [_vm._t("footer")], 2) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-setup/SetupStepCard.vue?vue&type=style&index=0&scoped=dcb51356&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "dcb51356",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-setup/SetupStepCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXNDQTtBQUVBO0FBUUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBQUEsRUFFQTtBQUNBO0FBYkE7QUFBQSxFQURBO0FBQUEsR0FEQSxjQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxjQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxjQVFBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FYQSxjQVlBO0FBWkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiU2V0dXBTdGVwQ2FyZC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvblxuICAgIGNsYXNzPVwic2V0dXAtc3RlcFwiXG4gICAgOmNsYXNzPVwieyAnaXMtZmxhdCc6IGZsYXQgfVwiXG4gICAgOmFyaWEtbGFiZWxsZWRieT1cInRpdGxlSWRcIlxuICA+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJleWVicm93XCJcbiAgICAgIGNsYXNzPVwic2V0dXAtc3RlcF9fZXllYnJvd1wiXG4gICAgICBkYXRhLXRpZD1cInN0ZXAtZXllYnJvd1wiXG4gICAgPlxuICAgICAge3sgZXllYnJvdyB9fVxuICAgIDwvcD5cbiAgICA8aDFcbiAgICAgIDppZD1cInRpdGxlSWRcIlxuICAgICAgY2xhc3M9XCJzZXR1cC1zdGVwX190aXRsZVwiXG4gICAgPlxuICAgICAge3sgdGl0bGUgfX1cbiAgICA8L2gxPlxuICAgIDxwXG4gICAgICB2LWlmPVwic3ViXCJcbiAgICAgIGNsYXNzPVwic2V0dXAtc3RlcF9fc3ViXCJcbiAgICA+XG4gICAgICB7eyBzdWIgfX1cbiAgICA8L3A+XG4gICAgPGRpdiBjbGFzcz1cInNldHVwLXN0ZXBfX2JvZHlcIj5cbiAgICAgIDxzbG90IC8+XG4gICAgPC9kaXY+XG4gICAgPGZvb3RlclxuICAgICAgdi1pZj1cIiRzbG90cy5mb290ZXJcIlxuICAgICAgY2xhc3M9XCJzZXR1cC1zdGVwX19mb290XCJcbiAgICA+XG4gICAgICA8c2xvdCBuYW1lPVwiZm9vdGVyXCIgLz5cbiAgICA8L2Zvb3Rlcj5cbiAgPC9zZWN0aW9uPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcblxubGV0IHVpZCA9IDBcblxuLyoqXG4gKiBPbmUgc2V0dXAgc3RlcCAodjMgc2V0dXAgc3Rvcnlib2FyZCk6IGV5ZWJyb3csIHRpdGxlLCBvbmUgbXV0ZWQgbGluZSwgdGhlXG4gKiBzdGVwJ3MgY29udGVudCwgdGhlbiB0aGUgZm9vdGVyIOKAlCBCYWNrIG9uIHRoZSBsZWZ0LCBhbnkgc2tpcCwgdGhlbiB0aGUgb25lXG4gKiBwcmltYXJ5IG9uIHRoZSByaWdodC4gT24gYSBwaG9uZSB0aGUgcHJpbWFyeSBzaXRzIG9uIHRvcCwgZnVsbCB3aWR0aC5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNldHVwU3RlcENhcmQgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgZXllYnJvdyE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSB0aXRsZSE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBzdWIhOiBzdHJpbmdcblxuICAvKiogSW5zaWRlIGEgZGlhbG9nIHRoYXQgaXMgYWxyZWFkeSB0aGUgY2FyZC4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9KVxuICByZWFkb25seSBmbGF0ITogYm9vbGVhblxuXG4gIHJlYWRvbmx5IHRpdGxlSWQgPSBgc2V0dXAtc3RlcC0keysrdWlkfWBcbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4uc2V0dXAtc3RlcCB7XG4gIHdpZHRoOiAxMDAlO1xuICBwYWRkaW5nOiAyOHB4O1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1tM2QtcmFkaXVzLWxnKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWdsYXNzLXRoaWNrKTtcbiAgYm94LXNoYWRvdzogdmFyKC0tbTNkLWdsYXNzLXJpbSksIHZhcigtLW0zZC1nbGFzcy1lZGdlKTtcbiAgYmFja2Ryb3AtZmlsdGVyOiB2YXIoLS1tM2QtZ2xhc3MtZmlsdGVyKTtcblxuICAmLmlzLWZsYXQge1xuICAgIHBhZGRpbmc6IDA7XG4gICAgYmFja2dyb3VuZDogbm9uZTtcbiAgICBib3gtc2hhZG93OiBub25lO1xuICAgIGJhY2tkcm9wLWZpbHRlcjogbm9uZTtcbiAgfVxuXG4gICZfX2V5ZWJyb3cge1xuICAgIG1hcmdpbjogMCAwIDZweDtcbiAgICBmb250LXNpemU6IHZhcigtLW0zZC10ZXh0LXhzKTtcbiAgICBmb250LXdlaWdodDogdmFyKC0tbTNkLXdlaWdodC1tZWRpdW0pO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjA0ZW07XG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgJl9fdGl0bGUge1xuICAgIG1hcmdpbjogMCAwIDZweDtcbiAgICBmb250LXNpemU6IDIycHg7XG4gICAgZm9udC13ZWlnaHQ6IHZhcigtLW0zZC13ZWlnaHQtc2VtaWJvbGQsIDYwMCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gICZfX3N1YiB7XG4gICAgbWFyZ2luOiAwIDAgMThweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogdmFyKC0tbTNkLXRleHQtc20pO1xuICB9XG5cbiAgJl9fZm9vdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgIGdhcDogOHB4O1xuICAgIG1hcmdpbi10b3A6IDIwcHg7XG4gICAgcGFkZGluZy10b3A6IDE2cHg7XG4gICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuXG4gICAgOjp2LWRlZXAgLnNldHVwLXN0ZXBfX2JhY2sge1xuICAgICAgbWFyZ2luLXJpZ2h0OiBhdXRvO1xuICAgIH1cbiAgfVxufVxuXG5AbWVkaWEgKG1heC13aWR0aDogNjk5cHgpIHtcbiAgLnNldHVwLXN0ZXAge1xuICAgIHBhZGRpbmc6IDIwcHggMTZweDtcblxuICAgICZfX2Zvb3Qge1xuICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbi1yZXZlcnNlO1xuICAgICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG5cbiAgICAgIDo6di1kZWVwIC52LWJ0biB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBtYXJnaW46IDAgIWltcG9ydGFudDtcbiAgICAgIH1cblxuICAgICAgOjp2LWRlZXAgLnNldHVwLXN0ZXBfX2JhY2sge1xuICAgICAgICBtYXJnaW4tcmlnaHQ6IDA7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbXVvbi1zZXR1cC9TZXR1cFN0ZXBDYXJkLnZ1ZSJ9