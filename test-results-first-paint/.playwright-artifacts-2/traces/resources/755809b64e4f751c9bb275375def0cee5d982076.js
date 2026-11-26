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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { activateCloudPrinter, activationState } from "/src/services/muon-cloud/activate.ts";
import { printerName } from "/src/services/muon-cloud/state.ts";
import ApprovalWaitDialog from "/src/components/muon-cloud/ApprovalWaitDialog.vue";
const approvalIds = /* @__PURE__ */ new WeakMap();
let approvalCount = 0;
let ApprovalWaitHost = class extends Vue {
  get approval() {
    return activationState.approval;
  }
  set approval(watch) {
    activationState.approval = watch;
  }
  /** A new wait is a new dialog, not the last one with new props. */
  get approvalKey() {
    if (!this.approval) return 0;
    if (!approvalIds.has(this.approval)) approvalIds.set(this.approval, ++approvalCount);
    return approvalIds.get(this.approval);
  }
  get name() {
    const id = activationState.approvalFor;
    return id && printerName(id) || "the printer";
  }
  retry() {
    const id = activationState.approvalFor;
    activationState.approval = null;
    activationState.error = null;
    if (id) activateCloudPrinter(id).catch(() => {
    });
  }
};
ApprovalWaitHost = __decorateClass([
  Component({ components: { ApprovalWaitDialog } })
], ApprovalWaitHost);
const _sfc_main = ApprovalWaitHost;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.approval ? _c("approval-wait-dialog", { key: _vm.approvalKey, attrs: { "watch": _vm.approval, "printer-name": _vm.name }, on: { "close": function($event) {
    _vm.approval = null;
  }, "retry": _vm.retry } }) : _vm._e();
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/ApprovalWaitHost.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVlBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQU9BO0FBQUEsRUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQSxFQUNBO0FBQ0E7QUEzQkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwcm92YWxXYWl0SG9zdC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8YXBwcm92YWwtd2FpdC1kaWFsb2dcbiAgICB2LWlmPVwiYXBwcm92YWxcIlxuICAgIDprZXk9XCJhcHByb3ZhbEtleVwiXG4gICAgOndhdGNoPVwiYXBwcm92YWxcIlxuICAgIDpwcmludGVyLW5hbWU9XCJuYW1lXCJcbiAgICBAY2xvc2U9XCJhcHByb3ZhbCA9IG51bGxcIlxuICAgIEByZXRyeT1cInJldHJ5XCJcbiAgLz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBhY3RpdmF0ZUNsb3VkUHJpbnRlciwgYWN0aXZhdGlvblN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FjdGl2YXRlJ1xuaW1wb3J0IHR5cGUgeyBBcHByb3ZhbFdhdGNoIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FwcHJvdmFsJ1xuaW1wb3J0IHsgcHJpbnRlck5hbWUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgQXBwcm92YWxXYWl0RGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy9tdW9uLWNsb3VkL0FwcHJvdmFsV2FpdERpYWxvZy52dWUnXG5cbmNvbnN0IGFwcHJvdmFsSWRzID0gbmV3IFdlYWtNYXA8QXBwcm92YWxXYXRjaCwgbnVtYmVyPigpXG5sZXQgYXBwcm92YWxDb3VudCA9IDBcblxuLyoqXG4gKiBXaGVyZSB0aGUgd2FpdCBmb3IgYXBwcm92YWwgYXQgdGhlIHByaW50ZXIgc2hvd3MgKEktMTcwKSwgd2hpY2hldmVyIHBhZ2UgdGhlIHBlcnNvbiBpcyBvbjpcbiAqIFwiUGFpciB0aGlzIGJyb3dzZXJcIiBpcyBwcmVzc2VkIGZyb20gYSBtZW51LCBub3Qgb25seSBmcm9tIGEgcHJpbnRlcidzIG9wZW5pbmcgcGFnZS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgQXBwcm92YWxXYWl0RGlhbG9nIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcHJvdmFsV2FpdEhvc3QgZXh0ZW5kcyBWdWUge1xuICBnZXQgYXBwcm92YWwgKCk6IEFwcHJvdmFsV2F0Y2ggfCBudWxsIHtcbiAgICByZXR1cm4gYWN0aXZhdGlvblN0YXRlLmFwcHJvdmFsXG4gIH1cblxuICBzZXQgYXBwcm92YWwgKHdhdGNoOiBBcHByb3ZhbFdhdGNoIHwgbnVsbCkge1xuICAgIGFjdGl2YXRpb25TdGF0ZS5hcHByb3ZhbCA9IHdhdGNoXG4gIH1cblxuICAvKiogQSBuZXcgd2FpdCBpcyBhIG5ldyBkaWFsb2csIG5vdCB0aGUgbGFzdCBvbmUgd2l0aCBuZXcgcHJvcHMuICovXG4gIGdldCBhcHByb3ZhbEtleSAoKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuYXBwcm92YWwpIHJldHVybiAwXG4gICAgaWYgKCFhcHByb3ZhbElkcy5oYXModGhpcy5hcHByb3ZhbCkpIGFwcHJvdmFsSWRzLnNldCh0aGlzLmFwcHJvdmFsLCArK2FwcHJvdmFsQ291bnQpXG4gICAgcmV0dXJuIGFwcHJvdmFsSWRzLmdldCh0aGlzLmFwcHJvdmFsKSBhcyBudW1iZXJcbiAgfVxuXG4gIGdldCBuYW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGlkID0gYWN0aXZhdGlvblN0YXRlLmFwcHJvdmFsRm9yXG4gICAgcmV0dXJuIChpZCAmJiBwcmludGVyTmFtZShpZCkpIHx8ICd0aGUgcHJpbnRlcidcbiAgfVxuXG4gIHJldHJ5ICgpIHtcbiAgICBjb25zdCBpZCA9IGFjdGl2YXRpb25TdGF0ZS5hcHByb3ZhbEZvclxuICAgIGFjdGl2YXRpb25TdGF0ZS5hcHByb3ZhbCA9IG51bGxcbiAgICBhY3RpdmF0aW9uU3RhdGUuZXJyb3IgPSBudWxsXG4gICAgaWYgKGlkKSBhY3RpdmF0ZUNsb3VkUHJpbnRlcihpZCkuY2F0Y2goKCkgPT4ge30pXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9BcHByb3ZhbFdhaXRIb3N0LnZ1ZSJ9