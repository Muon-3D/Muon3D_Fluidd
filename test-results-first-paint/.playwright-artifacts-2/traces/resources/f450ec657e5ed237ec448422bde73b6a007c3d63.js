/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VTooltip as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
let AppRailLink = class extends Vue {
  to;
  icon;
  label;
  keys;
  active;
  compact;
};
__decorateClass([
  Prop({ type: String, required: true })
], AppRailLink.prototype, "to", 2);
__decorateClass([
  Prop({ type: String, required: true })
], AppRailLink.prototype, "icon", 2);
__decorateClass([
  Prop({ type: String, required: true })
], AppRailLink.prototype, "label", 2);
__decorateClass([
  Prop({ type: String })
], AppRailLink.prototype, "keys", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppRailLink.prototype, "active", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppRailLink.prototype, "compact", 2);
AppRailLink = __decorateClass([
  Component({})
], AppRailLink);
const _sfc_main = AppRailLink;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "right": "", "disabled": !_vm.compact, "open-delay": "150" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("router-link", _vm._g(_vm._b({ staticClass: "app-rail-link", class: { "app-rail-link--on": _vm.active, "app-rail-link--compact": _vm.compact }, attrs: { "to": _vm.to, "aria-current": _vm.active ? "page" : void 0, "aria-label": _vm.compact ? _vm.label : void 0 } }, "router-link", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": _vm.icon } }), !_vm.compact ? _c("span", { staticClass: "app-rail-link__label" }, [_vm._v(_vm._s(_vm.label))]) : _vm._e(), _vm.keys && !_vm.compact ? _c("span", { staticClass: "app-rail-link__keys" }, [_vm._v(_vm._s(_vm.keys))]) : _vm._e()], 1)];
  } }]) }, [_c("span", [_vm._v(_vm._s(_vm.label)), _vm.keys ? [_vm._v(" \xB7 " + _vm._s(_vm.keys))] : _vm._e()], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/AppRailLink.vue?vue&type=style&index=0&scoped=c0ad4209&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "c0ad4209",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppRailLink.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBZ0NBO0FBR0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFDQTtBQWhCQTtBQUFBLEVBREE7QUFBQSxHQURBLFlBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLFlBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLFlBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLFlBV0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWJBLFlBY0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWhCQSxZQWlCQTtBQWpCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHBSYWlsTGluay52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8di10b29sdGlwXG4gICAgcmlnaHRcbiAgICA6ZGlzYWJsZWQ9XCIhY29tcGFjdFwiXG4gICAgb3Blbi1kZWxheT1cIjE1MFwiXG4gID5cbiAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICA6dG89XCJ0b1wiXG4gICAgICAgIGNsYXNzPVwiYXBwLXJhaWwtbGlua1wiXG4gICAgICAgIDpjbGFzcz1cInsgJ2FwcC1yYWlsLWxpbmstLW9uJzogYWN0aXZlLCAnYXBwLXJhaWwtbGluay0tY29tcGFjdCc6IGNvbXBhY3QgfVwiXG4gICAgICAgIDphcmlhLWN1cnJlbnQ9XCJhY3RpdmUgPyAncGFnZScgOiB1bmRlZmluZWRcIlxuICAgICAgICA6YXJpYS1sYWJlbD1cImNvbXBhY3QgPyBsYWJlbCA6IHVuZGVmaW5lZFwiXG4gICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gOm5hbWU9XCJpY29uXCIgLz5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWlmPVwiIWNvbXBhY3RcIlxuICAgICAgICAgIGNsYXNzPVwiYXBwLXJhaWwtbGlua19fbGFiZWxcIlxuICAgICAgICA+e3sgbGFiZWwgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cImtleXMgJiYgIWNvbXBhY3RcIlxuICAgICAgICAgIGNsYXNzPVwiYXBwLXJhaWwtbGlua19fa2V5c1wiXG4gICAgICAgID57eyBrZXlzIH19PC9zcGFuPlxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDxzcGFuPnt7IGxhYmVsIH19PHRlbXBsYXRlIHYtaWY9XCJrZXlzXCI+IMK3IHt7IGtleXMgfX08L3RlbXBsYXRlPjwvc3Bhbj5cbiAgPC92LXRvb2x0aXA+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwUmFpbExpbmsgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgdG8hOiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgaWNvbiE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBsYWJlbCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nIH0pXG4gIHJlYWRvbmx5IGtleXM/OiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgYWN0aXZlPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBjb21wYWN0PzogYm9vbGVhblxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmFwcC1yYWlsLWxpbmsge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBoZWlnaHQ6IDQycHg7XG4gICAgcGFkZGluZzogMCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICBmb250LXdlaWdodDogNTAwO1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQtY29sb3IgdmFyKC0tbTNkLWR1cmF0aW9uLWZhc3QpIHZhcigtLW0zZC1lYXNlKSwgY29sb3IgdmFyKC0tbTNkLWR1cmF0aW9uLWZhc3QpIHZhcigtLW0zZC1lYXNlKTtcblxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyKTtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgICB9XG4gIH1cblxuICAuYXBwLXJhaWwtbGluay0tY29tcGFjdCB7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgaGVpZ2h0OiA0NHB4O1xuICAgIHBhZGRpbmc6IDA7XG4gIH1cblxuICAuYXBwLXJhaWwtbGluay0tb24ge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpICFpbXBvcnRhbnQ7XG5cbiAgICAuZnJhbWUtaWNvbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLmFwcC1yYWlsLWxpbmtfX2xhYmVsIHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICB9XG5cbiAgLmFwcC1yYWlsLWxpbmtfX2tleXMge1xuICAgIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDZlbTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9BcHBSYWlsTGluay52dWUifQ==