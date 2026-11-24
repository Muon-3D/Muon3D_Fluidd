/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Toast.vue";
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
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Component, Prop, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import M3Toast, {} from "/src/components/ui/M3Toast.vue";
let FlashMessage = class extends Vue {
  open;
  type;
  text;
  timeout;
  action;
  retry() {
    this.open = false;
    this.action?.run();
  }
  get tone() {
    switch (this.type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "info";
    }
  }
};
__decorateClass([
  VModel({ type: Boolean })
], FlashMessage.prototype, "open", 2);
__decorateClass([
  Prop({ type: String, default: "dark" })
], FlashMessage.prototype, "type", 2);
__decorateClass([
  Prop({ type: String, default: "Saved" })
], FlashMessage.prototype, "text", 2);
__decorateClass([
  Prop({ type: Number, default: 1500 })
], FlashMessage.prototype, "timeout", 2);
__decorateClass([
  Prop({ type: Object })
], FlashMessage.prototype, "action", 2);
FlashMessage = __decorateClass([
  Component({ components: { M3Toast } })
], FlashMessage);
const _sfc_main = FlashMessage;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "tone": _vm.tone, "timeout": _vm.timeout, "stamp": _vm.text, "data-tid": "flash-message" }, scopedSlots: _vm._u([_vm.action ? { key: "action", fn: function() {
    return [_c("button", { attrs: { "type": "button", "data-tid": "flash-action" }, on: { "click": _vm.retry } }, [_vm._v(" " + _vm._s(_vm.action.label) + " ")])];
  }, proxy: true } : null], null, true), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_vm._v(" " + _vm._s(_vm.text) + " ")]);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/FlashMessage.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF5QkE7QUFDQTtBQUVBO0FBT0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEzQkE7QUFBQSxFQURBO0FBQUEsR0FEQSxhQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxhQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxhQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxhQVdBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FiQSxhQWNBO0FBZEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiRmxhc2hNZXNzYWdlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtMy10b2FzdFxuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICA6dG9uZT1cInRvbmVcIlxuICAgIDp0aW1lb3V0PVwidGltZW91dFwiXG4gICAgOnN0YW1wPVwidGV4dFwiXG4gICAgZGF0YS10aWQ9XCJmbGFzaC1tZXNzYWdlXCJcbiAgPlxuICAgIHt7IHRleHQgfX1cbiAgICA8dGVtcGxhdGVcbiAgICAgIHYtaWY9XCJhY3Rpb25cIlxuICAgICAgI2FjdGlvblxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGRhdGEtdGlkPVwiZmxhc2gtYWN0aW9uXCJcbiAgICAgICAgQGNsaWNrPVwicmV0cnlcIlxuICAgICAgPlxuICAgICAgICB7eyBhY3Rpb24ubGFiZWwgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvbTMtdG9hc3Q+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZNb2RlbCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IEZsYXNoTWVzc2FnZVR5cGVzLCBGbGFzaE1lc3NhZ2UgYXMgTWVzc2FnZSB9IGZyb20gJ0AvdHlwZXMnXG5pbXBvcnQgTTNUb2FzdCwgeyB0eXBlIFRvYXN0VG9uZSB9IGZyb20gJ0AvY29tcG9uZW50cy91aS9NM1RvYXN0LnZ1ZSdcblxuLyoqXG4gKiBGbHVpZGQncyBmbGFzaCBtZXNzYWdlIChFdmVudEJ1cy4kZW1pdCksIGFzIHRoZSByZWRlc2lnbidzIHRvYXN0LiBUaGUgdGV4dFxuICogaXMgc2hvd24gYXMgdGV4dDogaXQgaXMgb2Z0ZW4gdGhlIHByaW50ZXIncyBvd24gd29yZHMsIG9yIGEgZmlsZSdzIG5hbWUuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE0zVG9hc3QgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmxhc2hNZXNzYWdlIGV4dGVuZHMgVnVlIHtcbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnZGFyaycgfSlcbiAgcmVhZG9ubHkgdHlwZSE6IEZsYXNoTWVzc2FnZVR5cGVzXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdTYXZlZCcgfSlcbiAgcmVhZG9ubHkgdGV4dCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAxNTAwIH0pXG4gIHJlYWRvbmx5IHRpbWVvdXQhOiBudW1iZXJcblxuICBAUHJvcCh7IHR5cGU6IE9iamVjdCB9KVxuICByZWFkb25seSBhY3Rpb24/OiBNZXNzYWdlWydhY3Rpb24nXVxuXG4gIHJldHJ5ICgpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIHRoaXMuYWN0aW9uPy5ydW4oKVxuICB9XG5cbiAgZ2V0IHRvbmUgKCk6IFRvYXN0VG9uZSB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3N1Y2Nlc3MnOiByZXR1cm4gJ3N1Y2Nlc3MnXG4gICAgICBjYXNlICd3YXJuaW5nJzogcmV0dXJuICd3YXJuaW5nJ1xuICAgICAgY2FzZSAnZXJyb3InOiByZXR1cm4gJ2Vycm9yJ1xuICAgICAgZGVmYXVsdDogcmV0dXJuICdpbmZvJ1xuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb21tb24vRmxhc2hNZXNzYWdlLnZ1ZSJ9