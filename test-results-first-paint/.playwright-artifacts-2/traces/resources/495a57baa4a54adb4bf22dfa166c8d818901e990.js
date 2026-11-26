/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/common/ManualProbeDialog.vue";
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
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import TypedCommandsMixin from "/src/mixins/typed-commands.ts";
import ToolheadMixin from "/src/mixins/toolhead.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import ManualProbeDialog from "/src/components/common/ManualProbeDialog.vue";
let ManualProbeRecovery = class extends Mixins(TypedCommandsMixin, ToolheadMixin) {
  value;
  automatic;
  shown = false;
  selectedContext = "";
  contextFresh = false;
  unsubscribeStatus = null;
  get recoveryContext() {
    return `${this.commandTarget}|${cloudState.account?.id ?? ""}`;
  }
  get recoveryEligibility() {
    return `${this.isManualProbeActive}|${this.klippyReady}|${this.printerState}`;
  }
  created() {
    this.unsubscribeStatus = this.$store.subscribe((mutation) => {
      if (mutation.type !== "printer/setSocketNotify" || mutation.payload?.key !== "manual_probe" || this.contextFresh) return;
      this.contextFresh = true;
      this.recover();
    });
  }
  beforeDestroy() {
    this.unsubscribeStatus?.();
  }
  onRecoveryContext() {
    const context = this.recoveryContext;
    const initialContext = this.selectedContext === "";
    this.selectedContext = context;
    this.contextFresh = initialContext;
    this.shown = false;
    if (initialContext) this.recover();
  }
  recover() {
    if (!this.shown && this.contextFresh && this.automatic && this.isManualProbeActive && this.klippyReady && !this.printerPrinting && !this.printerPaused) this.shown = true;
  }
  onValue(value) {
    this.shown = value;
  }
  onShown(value) {
    this.$emit("input", value);
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ManualProbeRecovery.prototype, "value", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], ManualProbeRecovery.prototype, "automatic", 2);
__decorateClass([
  Watch("recoveryContext", { immediate: true })
], ManualProbeRecovery.prototype, "onRecoveryContext", 1);
__decorateClass([
  Watch("recoveryEligibility")
], ManualProbeRecovery.prototype, "recover", 1);
__decorateClass([
  Watch("value")
], ManualProbeRecovery.prototype, "onValue", 1);
__decorateClass([
  Watch("shown")
], ManualProbeRecovery.prototype, "onShown", 1);
ManualProbeRecovery = __decorateClass([
  Component({ components: { ManualProbeDialog } })
], ManualProbeRecovery);
const _sfc_main = ManualProbeRecovery;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.shown ? _c(__unplugin_components_0, { model: { value: _vm.shown, callback: function($$v) {
    _vm.shown = $$v;
  }, expression: "shown" } }) : _vm._e();
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/ManualProbeRecovery.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0EsOEdBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUdBO0FBQUE7QUFBQTtBQUNBO0FBNUNBO0FBQUE7QUFBQSxHQURBLG9CQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsb0JBRUE7QUF1QkE7QUFBQSxFQURBO0FBQUEsR0F4QkEsb0JBeUJBO0FBVUE7QUFBQSxFQURBO0FBQUEsR0FsQ0Esb0JBbUNBO0FBTUE7QUFBQSxFQURBO0FBQUEsR0F4Q0Esb0JBeUNBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0EzQ0Esb0JBNENBO0FBNUNBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk1hbnVhbFByb2JlUmVjb3ZlcnkudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPG1hbnVhbC1wcm9iZS1kaWFsb2dcbiAgICB2LWlmPVwic2hvd25cIlxuICAgIHYtbW9kZWw9XCJzaG93blwiXG4gIC8+XG48L3RlbXBsYXRlPlxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVHlwZWRDb21tYW5kc01peGluIGZyb20gJ0AvbWl4aW5zL3R5cGVkLWNvbW1hbmRzJ1xuaW1wb3J0IFRvb2xoZWFkTWl4aW4gZnJvbSAnQC9taXhpbnMvdG9vbGhlYWQnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IE1hbnVhbFByb2JlRGlhbG9nIGZyb20gJy4vTWFudWFsUHJvYmVEaWFsb2cudnVlJ1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTWFudWFsUHJvYmVEaWFsb2cgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFudWFsUHJvYmVSZWNvdmVyeSBleHRlbmRzIE1peGlucyhUeXBlZENvbW1hbmRzTWl4aW4sIFRvb2xoZWFkTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IHZhbHVlPzogYm9vbGVhblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IHRydWUgfSkgcmVhZG9ubHkgYXV0b21hdGljITogYm9vbGVhblxuICBzaG93biA9IGZhbHNlXG4gIHNlbGVjdGVkQ29udGV4dCA9ICcnXG4gIGNvbnRleHRGcmVzaCA9IGZhbHNlXG4gIHVuc3Vic2NyaWJlU3RhdHVzOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG4gIGdldCByZWNvdmVyeUNvbnRleHQgKCk6IHN0cmluZyB7IHJldHVybiBgJHt0aGlzLmNvbW1hbmRUYXJnZXR9fCR7Y2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyAnJ31gIH1cblxuICBnZXQgcmVjb3ZlcnlFbGlnaWJpbGl0eSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5pc01hbnVhbFByb2JlQWN0aXZlfXwke3RoaXMua2xpcHB5UmVhZHl9fCR7dGhpcy5wcmludGVyU3RhdGV9YFxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgdGhpcy51bnN1YnNjcmliZVN0YXR1cyA9IHRoaXMuJHN0b3JlLnN1YnNjcmliZSgobXV0YXRpb24pID0+IHtcbiAgICAgIGlmIChtdXRhdGlvbi50eXBlICE9PSAncHJpbnRlci9zZXRTb2NrZXROb3RpZnknIHx8IG11dGF0aW9uLnBheWxvYWQ/LmtleSAhPT0gJ21hbnVhbF9wcm9iZScgfHwgdGhpcy5jb250ZXh0RnJlc2gpIHJldHVyblxuICAgICAgdGhpcy5jb250ZXh0RnJlc2ggPSB0cnVlXG4gICAgICB0aGlzLnJlY292ZXIoKVxuICAgIH0pXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHsgdGhpcy51bnN1YnNjcmliZVN0YXR1cz8uKCkgfVxuXG4gIEBXYXRjaCgncmVjb3ZlcnlDb250ZXh0JywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25SZWNvdmVyeUNvbnRleHQgKCkge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLnJlY292ZXJ5Q29udGV4dFxuICAgIGNvbnN0IGluaXRpYWxDb250ZXh0ID0gdGhpcy5zZWxlY3RlZENvbnRleHQgPT09ICcnXG4gICAgdGhpcy5zZWxlY3RlZENvbnRleHQgPSBjb250ZXh0XG4gICAgdGhpcy5jb250ZXh0RnJlc2ggPSBpbml0aWFsQ29udGV4dFxuICAgIHRoaXMuc2hvd24gPSBmYWxzZVxuICAgIGlmIChpbml0aWFsQ29udGV4dCkgdGhpcy5yZWNvdmVyKClcbiAgfVxuXG4gIEBXYXRjaCgncmVjb3ZlcnlFbGlnaWJpbGl0eScpXG4gIHJlY292ZXIgKCkge1xuICAgIGlmICghdGhpcy5zaG93biAmJiB0aGlzLmNvbnRleHRGcmVzaCAmJiB0aGlzLmF1dG9tYXRpYyAmJiB0aGlzLmlzTWFudWFsUHJvYmVBY3RpdmUgJiYgdGhpcy5rbGlwcHlSZWFkeSAmJlxuICAgICAgIXRoaXMucHJpbnRlclByaW50aW5nICYmICF0aGlzLnByaW50ZXJQYXVzZWQpIHRoaXMuc2hvd24gPSB0cnVlXG4gIH1cblxuICBAV2F0Y2goJ3ZhbHVlJylcbiAgb25WYWx1ZSAodmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5zaG93biA9IHZhbHVlIH1cblxuICBAV2F0Y2goJ3Nob3duJylcbiAgb25TaG93biAodmFsdWU6IGJvb2xlYW4pIHsgdGhpcy4kZW1pdCgnaW5wdXQnLCB2YWx1ZSkgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb21tb24vTWFudWFsUHJvYmVSZWNvdmVyeS52dWUifQ==