/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import FrameIcon from "/src/components/ui/FrameIcon.vue";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
let LockedRow = class extends Vue {
  label;
  lock;
  reasonText;
  get linked() {
    return this.lock === "developer-mode";
  }
  get reason() {
    return this.reasonText || (this.linked ? "Needs developer mode" : "Needs a Muon printer");
  }
  get to() {
    return `${scopedPath("/settings", activeSlug())}#developer`;
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], LockedRow.prototype, "label", 2);
__decorateClass([
  Prop({ type: String, default: "developer-mode", validator: (v) => ["developer-mode", "muon"].includes(v) })
], LockedRow.prototype, "lock", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], LockedRow.prototype, "reasonText", 2);
LockedRow = __decorateClass([
  Component({ components: { FrameIcon } })
], LockedRow);
const _sfc_main = LockedRow;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(_vm.linked ? "router-link" : "div", _vm._b({ tag: "component", staticClass: "locked-row", class: { "locked-row--plain": !_vm.linked }, attrs: { "data-tid": "locked-row" } }, "component", _vm.linked ? { to: _vm.to } : {}, false), [_c(__unplugin_components_0, { attrs: { "name": "lock", "small": "" } }), _c("span", { staticClass: "locked-row__text" }, [_c("span", { staticClass: "locked-row__label", attrs: { "data-tid": "locked-row-label" } }, [_vm._v(_vm._s(_vm.label))]), _c("span", { staticClass: "locked-row__reason", attrs: { "data-tid": "locked-row-reason" } }, [_vm._v(_vm._s(_vm.reason))])])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/gates/LockedRow.vue?vue&type=style&index=0&scoped=5c44a2be&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5c44a2be",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/gates/LockedRow.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUEwQkE7QUFDQTtBQUNBO0FBQ0E7QUFjQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBbEJBO0FBQUE7QUFBQSxHQURBLFVBQ0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUhBLFVBSUE7QUFFQTtBQUFBO0FBQUEsR0FOQSxVQU1BO0FBTkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTG9ja2VkUm93LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxjb21wb25lbnRcbiAgICA6aXM9XCJsaW5rZWQgPyAncm91dGVyLWxpbmsnIDogJ2RpdidcIlxuICAgIHYtYmluZD1cImxpbmtlZCA/IHsgdG8gfSA6IHt9XCJcbiAgICBjbGFzcz1cImxvY2tlZC1yb3dcIlxuICAgIDpjbGFzcz1cInsgJ2xvY2tlZC1yb3ctLXBsYWluJzogIWxpbmtlZCB9XCJcbiAgICBkYXRhLXRpZD1cImxvY2tlZC1yb3dcIlxuICA+XG4gICAgPGZyYW1lLWljb25cbiAgICAgIG5hbWU9XCJsb2NrXCJcbiAgICAgIHNtYWxsXG4gICAgLz5cbiAgICA8c3BhbiBjbGFzcz1cImxvY2tlZC1yb3dfX3RleHRcIj5cbiAgICAgIDxzcGFuXG4gICAgICAgIGNsYXNzPVwibG9ja2VkLXJvd19fbGFiZWxcIlxuICAgICAgICBkYXRhLXRpZD1cImxvY2tlZC1yb3ctbGFiZWxcIlxuICAgICAgPnt7IGxhYmVsIH19PC9zcGFuPlxuICAgICAgPHNwYW5cbiAgICAgICAgY2xhc3M9XCJsb2NrZWQtcm93X19yZWFzb25cIlxuICAgICAgICBkYXRhLXRpZD1cImxvY2tlZC1yb3ctcmVhc29uXCJcbiAgICAgID57eyByZWFzb24gfX08L3NwYW4+XG4gICAgPC9zcGFuPlxuICA8L2NvbXBvbmVudD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgRnJhbWVJY29uIGZyb20gJ0AvY29tcG9uZW50cy91aS9GcmFtZUljb24udnVlJ1xuaW1wb3J0IHsgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuXG4vKipcbiAqIEEgc2V0dGluZ3Mgcm93IHRoYXQgaXMgb24gdGhpcyBwcmludGVyIGJ1dCBsb2NrZWQuIERldmVsb3Blci1tb2RlIHJvd3NcbiAqIHN0YXkgdmlzaWJsZSwgbmV2ZXIgaGlkZGVuIChQUklOQ0lQTEVTLm1kIHNlY3Rpb24gOSksIHdpdGggdGhlIHJlYXNvblxuICogYW5kIGEgd2F5IHRvIHVubG9jayB0aGVtLiBUaGVyZSBpcyBubyBzZXBhcmF0ZSBleHBsYWluZXIgc2hlZXQgaW5cbiAqIENvbnRyb2wsIHNvIGEgdGFwIGdvZXMgdG8gU2V0dGluZ3MgPiBEZXZlbG9wZXIgbW9kZSwgd2hpY2ggaXMgaXQuXG4gKlxuICogUmVuZGVyIGl0IGluIHBsYWNlIG9mIHRoZSByZWFsIHJvdyB3aGlsZSBgZGV2TW9kZUVuYWJsZWRgIGlzIGZhbHNlOlxuICogYDxsb2NrZWQtcm93IHYtaWY9XCIhZGV2TW9kZUVuYWJsZWRcIiBsYWJlbD1cIi4uLlwiIC8+YC4gV2l0aFxuICogYGxvY2s9XCJtdW9uXCJgIChcIk5lZWRzIGEgTXVvbiBwcmludGVyXCIpIG5vdGhpbmcgaGVyZSBjYW4gdW5sb2NrIGl0LCBzbyB0aGVcbiAqIHJvdyBoYXMgbm8gbGluay4gYHJlYXNvbi10ZXh0YCByZXBsYWNlcyB0aGUgd29yZHMsIG5ldmVyIHRoZSBsaW5rLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBGcmFtZUljb24gfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTG9ja2VkUm93IGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IGxhYmVsITogc3RyaW5nXG4gIC8qKiBXaGF0IGxvY2tzIGl0LiBPbmx5IGRldmVsb3BlciBtb2RlIGNhbiBiZSB1bmxvY2tlZCBmcm9tIGhlcmUsIHNvIG9ubHkgaXQgbGlua3MuICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnZGV2ZWxvcGVyLW1vZGUnLCB2YWxpZGF0b3I6ICh2OiBzdHJpbmcpID0+IFsnZGV2ZWxvcGVyLW1vZGUnLCAnbXVvbiddLmluY2x1ZGVzKHYpIH0pXG4gIHJlYWRvbmx5IGxvY2shOiAnZGV2ZWxvcGVyLW1vZGUnIHwgJ211b24nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pIHJlYWRvbmx5IHJlYXNvblRleHQhOiBzdHJpbmdcblxuICBnZXQgbGlua2VkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5sb2NrID09PSAnZGV2ZWxvcGVyLW1vZGUnXG4gIH1cblxuICBnZXQgcmVhc29uICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlYXNvblRleHQgfHwgKHRoaXMubGlua2VkID8gJ05lZWRzIGRldmVsb3BlciBtb2RlJyA6ICdOZWVkcyBhIE11b24gcHJpbnRlcicpXG4gIH1cblxuICBnZXQgdG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Njb3BlZFBhdGgoJy9zZXR0aW5ncycsIGFjdGl2ZVNsdWcoKSl9I2RldmVsb3BlcmBcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmxvY2tlZC1yb3cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMTJweCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICB9XG5cbiAgLmxvY2tlZC1yb3ctLXBsYWluIHtcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XG4gIH1cblxuICAubG9ja2VkLXJvd19fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5sb2NrZWQtcm93X19sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgfVxuXG4gIC5sb2NrZWQtcm93X19yZWFzb24ge1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL2dhdGVzL0xvY2tlZFJvdy52dWUifQ==