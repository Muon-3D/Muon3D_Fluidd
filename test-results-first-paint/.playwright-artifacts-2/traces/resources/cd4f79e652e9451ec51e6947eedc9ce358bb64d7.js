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
let ControlCard = class extends Vue {
  title;
  note;
  icon;
  pill;
  pillTone;
  locked;
};
__decorateClass([
  Prop({ type: String, default: "" })
], ControlCard.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], ControlCard.prototype, "note", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], ControlCard.prototype, "icon", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], ControlCard.prototype, "pill", 2);
__decorateClass([
  Prop({ type: String, default: "warn" })
], ControlCard.prototype, "pillTone", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], ControlCard.prototype, "locked", 2);
ControlCard = __decorateClass([
  Component({})
], ControlCard);
const _sfc_main = ControlCard;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "ccard", class: { "ccard--locked": !!_vm.locked } }, [_vm.title || _vm.$slots.aside ? _c("header", { staticClass: "ccard__head" }, [_c("h2", { staticClass: "ccard__title" }, [_vm.icon ? _c(__unplugin_components_0, { attrs: { "name": _vm.icon, "small": "" } }) : _vm._e(), _vm._v(" " + _vm._s(_vm.title) + " ")], 1), _c("span", { staticClass: "ccard__aside" }, [_vm.pill ? _c("span", { staticClass: "ccard__pill", class: `ccard__pill--${_vm.pillTone}`, attrs: { "data-tid": "tile-pill" } }, [_vm._v(_vm._s(_vm.pill))]) : _vm._e(), _vm._t("aside")], 2)]) : _vm._e(), _vm._t("default"), _vm.locked ? _c("p", { staticClass: "ccard__lock" }, [_c(__unplugin_components_1, { attrs: { "name": "lock", "small": "" } }), _vm._v(" " + _vm._s(_vm.locked) + " ")], 1) : _vm.note ? _c("p", { staticClass: "ccard__note" }, [_vm._v(" " + _vm._s(_vm.note) + " ")]) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlCard.vue?vue&type=style&index=0&scoped=4bb9bd32&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "4bb9bd32",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlCard.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBZ0RBO0FBUUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUlBO0FBQUEsRUFJQTtBQUFBLEVBSUE7QUFDQTtBQXBCQTtBQUFBLEVBREE7QUFBQSxHQURBLFlBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLFlBS0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQVJBLFlBU0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQVpBLFlBYUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQWhCQSxZQWlCQTtBQUlBO0FBQUEsRUFEQTtBQUFBLEdBcEJBLFlBcUJBO0FBckJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnRyb2xDYXJkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJjY2FyZFwiXG4gICAgOmNsYXNzPVwieyAnY2NhcmQtLWxvY2tlZCc6ICEhbG9ja2VkIH1cIlxuICA+XG4gICAgPGhlYWRlclxuICAgICAgdi1pZj1cInRpdGxlIHx8ICRzbG90cy5hc2lkZVwiXG4gICAgICBjbGFzcz1cImNjYXJkX19oZWFkXCJcbiAgICA+XG4gICAgICA8aDIgY2xhc3M9XCJjY2FyZF9fdGl0bGVcIj5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICB2LWlmPVwiaWNvblwiXG4gICAgICAgICAgOm5hbWU9XCJpY29uXCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPlxuICAgICAgICB7eyB0aXRsZSB9fVxuICAgICAgPC9oMj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2NhcmRfX2FzaWRlXCI+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cInBpbGxcIlxuICAgICAgICAgIGNsYXNzPVwiY2NhcmRfX3BpbGxcIlxuICAgICAgICAgIDpjbGFzcz1cImBjY2FyZF9fcGlsbC0tJHtwaWxsVG9uZX1gXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInRpbGUtcGlsbFwiXG4gICAgICAgID57eyBwaWxsIH19PC9zcGFuPlxuICAgICAgICA8c2xvdCBuYW1lPVwiYXNpZGVcIiAvPlxuICAgICAgPC9zcGFuPlxuICAgIDwvaGVhZGVyPlxuICAgIDxzbG90IC8+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJsb2NrZWRcIlxuICAgICAgY2xhc3M9XCJjY2FyZF9fbG9ja1wiXG4gICAgPlxuICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgbmFtZT1cImxvY2tcIlxuICAgICAgICBzbWFsbFxuICAgICAgLz5cbiAgICAgIHt7IGxvY2tlZCB9fVxuICAgIDwvcD5cbiAgICA8cFxuICAgICAgdi1lbHNlLWlmPVwibm90ZVwiXG4gICAgICBjbGFzcz1cImNjYXJkX19ub3RlXCJcbiAgICA+XG4gICAgICB7eyBub3RlIH19XG4gICAgPC9wPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKipcbiAqIE9uZSBwYW5lbCBvZiBDb250cm9sOiBpdHMgdGl0bGUsIHNvbWV0aGluZyBiZXNpZGUgaXQgKHRoZSBoZWF0ZXJzJ1xuICogdGVtcGVyYXR1cmVzLCB0aGUgbWF0ZXJpYWwgbG9hZGVkKSwgaXRzIGNvbnRyb2xzLCBhbmQgYSBsaW5lIHVuZGVyIHRoZW0uXG4gKiBBIHBhbmVsIHRoYXQgY2FuJ3QgYmUgdXNlZCBub3cgc3RheXMgaW4gcGxhY2UgYW5kIHNheXMgd2h5IChgbG9ja2VkYCkuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sQ2FyZCBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSB0aXRsZSE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBub3RlITogc3RyaW5nXG5cbiAgLyoqIFRoZSBpY29uIGJlc2lkZSB0aGUgdGl0bGUgKGEgZnJhbWUtaWNvbiBuYW1lKS4gKi9cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IGljb24hOiBzdHJpbmdcblxuICAvKiogQSBzaG9ydCBzdGF0dXMgcGlsbCBvbiB0aGUgcmlnaHQgb2YgdGhlIGhlYWRlciAoXCJMb2NrZWQgd2hpbGUgcHJpbnRpbmdcIikuICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBwaWxsITogc3RyaW5nXG5cbiAgLyoqIFRoZSBwaWxsJ3MgdG9uZTogd2FybiAob3JhbmdlKSBvciBvayAoZ3JlZW4pLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ3dhcm4nIH0pXG4gIHJlYWRvbmx5IHBpbGxUb25lITogc3RyaW5nXG5cbiAgLyoqIFdoeSB0aGUgY29udHJvbHMgY2FuJ3QgYmUgdXNlZCBub3csIHNob3duIGluIHBsYWNlIG9mIHRoZSBub3RlLiAqL1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgbG9ja2VkITogc3RyaW5nXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuY2NhcmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE2cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIHBhZGRpbmc6IDE4cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5jY2FyZF9faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgZ2FwOiA4cHggMTJweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuY2NhcmRfX3RpdGxlIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtYXJnaW46IDA7XG4gICAgZm9udC1zaXplOiAxNnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5jY2FyZF9fdGl0bGUgLmZyYW1lLWljb24ge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAuY2NhcmRfX3BpbGwge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgcGFkZGluZzogM3B4IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcblxuICAgICY6OmJlZm9yZSB7XG4gICAgICBjb250ZW50OiAnJztcbiAgICAgIHdpZHRoOiA2cHg7XG4gICAgICBoZWlnaHQ6IDZweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgIGJhY2tncm91bmQ6IGN1cnJlbnRDb2xvcjtcbiAgICB9XG4gIH1cblxuICAuY2NhcmRfX3BpbGwtLXdhcm4ge1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtd2FybmluZykgMTYlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5jY2FyZF9fcGlsbC0tb2sge1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtc3VjY2VzcykgMTYlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzKTtcbiAgfVxuXG4gIC5jY2FyZF9fYXNpZGUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDhweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gIH1cblxuICAuY2NhcmRfX25vdGUsXG4gIC5jY2FyZF9fbG9jayB7XG4gICAgbWFyZ2luOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLmNjYXJkX19sb2NrIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA2cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb250cm9sL0NvbnRyb2xDYXJkLnZ1ZSJ9