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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import TaskFold from "/src/components/control/TaskFold.vue";
import PersonalTaskFold from "/src/components/control/PersonalTaskFold.vue";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { printerTransportBinding } from "/src/services/managed-session/httpTransportBinding.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
let ControlTaskFold = class extends Vue {
  foldKey;
  title;
  summary;
  choice;
  showUnsavedNote;
  expand;
  open = false;
  choose(value) {
    this.open = value;
  }
  get printerId() {
    return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.activePrinterId ?? "" : "";
  }
  get connection() {
    return `${this.$store.state.config.apiUrl}|${this.printerId}|${cloudState.account?.id ?? ""}`;
  }
  reset() {
    this.open = false;
    this.onExpand(!!this.expand);
  }
  onExpand(expand) {
    if (!expand) return;
    this.open = true;
    this.$nextTick(() => this.$refs.personal?.choose?.(true));
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], ControlTaskFold.prototype, "foldKey", 2);
__decorateClass([
  Prop({ type: String, required: true })
], ControlTaskFold.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, required: true })
], ControlTaskFold.prototype, "summary", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlTaskFold.prototype, "choice", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], ControlTaskFold.prototype, "showUnsavedNote", 2);
__decorateClass([
  Prop({ type: Boolean })
], ControlTaskFold.prototype, "expand", 2);
__decorateClass([
  Watch("connection")
], ControlTaskFold.prototype, "reset", 1);
__decorateClass([
  Watch("expand", { immediate: true })
], ControlTaskFold.prototype, "onExpand", 1);
ControlTaskFold = __decorateClass([
  Component({ components: { TaskFold, PersonalTaskFold } })
], ControlTaskFold);
const _sfc_main = ControlTaskFold;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_vm.printerId ? _c("personal-task-fold", { key: _vm.connection, ref: "personal", attrs: { "printer-id": _vm.printerId, "fold-key": _vm.foldKey, "fold-id": _vm.foldKey, "title": _vm.title, "summary": _vm.summary, "choice": _vm.choice }, scopedSlots: _vm._u([{ key: "default", fn: function(selection) {
    return [_vm._t("default", null, null, selection || {})];
  } }], null, true) }) : [_vm.choice ? _vm._t("default", null, { "value": _vm.open, "choose": _vm.choose }) : _c("task-fold", { attrs: { "fold-id": _vm.foldKey, "title": _vm.title, "summary": _vm.summary, "value": _vm.open }, on: { "input": function($event) {
    _vm.open = $event;
  } } }, [_vm._t("default")], 2), _vm.showUnsavedNote && (_vm.open || _vm.choice) ? _c("p", { staticClass: "control-fold__note" }, [_vm._v(" These choices last for this visit. ")]) : _vm._e()]], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlTaskFold.vue?vue&type=style&index=0&scoped=7152c477&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "7152c477",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlTaskFold.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBekJBO0FBQUE7QUFBQSxHQURBLGdCQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsZ0JBRUE7QUFDQTtBQUFBO0FBQUEsR0FIQSxnQkFHQTtBQUNBO0FBQUE7QUFBQSxHQUpBLGdCQUlBO0FBQ0E7QUFBQTtBQUFBLEdBTEEsZ0JBS0E7QUFFQTtBQUFBO0FBQUEsR0FQQSxnQkFPQTtBQVdBO0FBQUEsRUFEQTtBQUFBLEdBakJBLGdCQWtCQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBcEJBLGdCQXFCQTtBQXJCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb250cm9sVGFza0ZvbGQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdj5cbiAgICA8cGVyc29uYWwtdGFzay1mb2xkXG4gICAgICB2LWlmPVwicHJpbnRlcklkXCJcbiAgICAgIHJlZj1cInBlcnNvbmFsXCJcbiAgICAgIDprZXk9XCJjb25uZWN0aW9uXCJcbiAgICAgIDpwcmludGVyLWlkPVwicHJpbnRlcklkXCJcbiAgICAgIDpmb2xkLWtleT1cImZvbGRLZXlcIlxuICAgICAgOmZvbGQtaWQ9XCJmb2xkS2V5XCJcbiAgICAgIDp0aXRsZT1cInRpdGxlXCJcbiAgICAgIDpzdW1tYXJ5PVwic3VtbWFyeVwiXG4gICAgICA6Y2hvaWNlPVwiY2hvaWNlXCJcbiAgICA+XG4gICAgICA8dGVtcGxhdGUgI2RlZmF1bHQ9XCJzZWxlY3Rpb25cIj5cbiAgICAgICAgPHNsb3Qgdi1iaW5kPVwic2VsZWN0aW9uIHx8IHt9XCIgLz5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9wZXJzb25hbC10YXNrLWZvbGQ+XG4gICAgPHRlbXBsYXRlIHYtZWxzZT5cbiAgICAgIDxzbG90XG4gICAgICAgIHYtaWY9XCJjaG9pY2VcIlxuICAgICAgICA6dmFsdWU9XCJvcGVuXCJcbiAgICAgICAgOmNob29zZT1cImNob29zZVwiXG4gICAgICAvPlxuICAgICAgPHRhc2stZm9sZFxuICAgICAgICB2LWVsc2VcbiAgICAgICAgOmZvbGQtaWQ9XCJmb2xkS2V5XCJcbiAgICAgICAgOnRpdGxlPVwidGl0bGVcIlxuICAgICAgICA6c3VtbWFyeT1cInN1bW1hcnlcIlxuICAgICAgICA6dmFsdWU9XCJvcGVuXCJcbiAgICAgICAgQGlucHV0PVwib3BlbiA9ICRldmVudFwiXG4gICAgICA+XG4gICAgICAgIDxzbG90IC8+XG4gICAgICA8L3Rhc2stZm9sZD5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJzaG93VW5zYXZlZE5vdGUgJiYgKG9wZW4gfHwgY2hvaWNlKVwiXG4gICAgICAgIGNsYXNzPVwiY29udHJvbC1mb2xkX19ub3RlXCJcbiAgICAgID5cbiAgICAgICAgVGhlc2UgY2hvaWNlcyBsYXN0IGZvciB0aGlzIHZpc2l0LlxuICAgICAgPC9wPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVGFza0ZvbGQgZnJvbSAnLi9UYXNrRm9sZC52dWUnXG5pbXBvcnQgUGVyc29uYWxUYXNrRm9sZCBmcm9tICcuL1BlcnNvbmFsVGFza0ZvbGQudnVlJ1xuaW1wb3J0IHsgY2xvdWRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCB7IHByaW50ZXJUcmFuc3BvcnRCaW5kaW5nIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYW5hZ2VkLXNlc3Npb24vaHR0cFRyYW5zcG9ydEJpbmRpbmcnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUYXNrRm9sZCwgUGVyc29uYWxUYXNrRm9sZCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cm9sVGFza0ZvbGQgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgZm9sZEtleSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgdGl0bGUhOiBzdHJpbmdcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IHN1bW1hcnkhOiBzdHJpbmdcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IGNob2ljZT86IGJvb2xlYW5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiB0cnVlIH0pIHJlYWRvbmx5IHNob3dVbnNhdmVkTm90ZSE6IGJvb2xlYW5cbiAgLyoqIE9wZW4gaXQgbm93IChhIGxpbmsgdGhhdCBhc2tzIGZvciB0aGlzIGZvbGQsID9zZW5zb3JzPW9wZW4pLiAqL1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSkgcmVhZG9ubHkgZXhwYW5kPzogYm9vbGVhblxuICBvcGVuID0gZmFsc2VcbiAgY2hvb3NlICh2YWx1ZTogYm9vbGVhbikgeyB0aGlzLm9wZW4gPSB2YWx1ZSB9XG5cbiAgZ2V0IHByaW50ZXJJZCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaXNNYW5hZ2VkQXBpVXJsKHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwpICYmIHByaW50ZXJUcmFuc3BvcnRCaW5kaW5nLnJlbW90ZSA/IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkID8/ICcnIDogJydcbiAgfVxuXG4gIGdldCBjb25uZWN0aW9uICgpOiBzdHJpbmcgeyByZXR1cm4gYCR7dGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybH18JHt0aGlzLnByaW50ZXJJZH18JHtjbG91ZFN0YXRlLmFjY291bnQ/LmlkID8/ICcnfWAgfVxuXG4gIEBXYXRjaCgnY29ubmVjdGlvbicpXG4gIHJlc2V0ICgpIHsgdGhpcy5vcGVuID0gZmFsc2U7IHRoaXMub25FeHBhbmQoISF0aGlzLmV4cGFuZCkgfVxuXG4gIEBXYXRjaCgnZXhwYW5kJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25FeHBhbmQgKGV4cGFuZDogYm9vbGVhbikge1xuICAgIGlmICghZXhwYW5kKSByZXR1cm5cbiAgICB0aGlzLm9wZW4gPSB0cnVlXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gKHRoaXMuJHJlZnMucGVyc29uYWwgYXMgdW5rbm93biBhcyB7IGNob29zZT86IChvcGVuOiBib29sZWFuKSA9PiB1bmtub3duIH0gfCB1bmRlZmluZWQpPy5jaG9vc2U/Lih0cnVlKSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBzY29wZWQ+XG4uY29udHJvbC1mb2xkX19ub3RlIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IGZvbnQtc2l6ZTogMTJweDsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbFRhc2tGb2xkLnZ1ZSJ9