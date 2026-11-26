/* unplugin-vue-components disabled */import { VCardText as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppBtn.vue";
import { VSpacer as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppDialog.vue";
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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { updateWatch } from "/src/services/updates/watch.ts";
import { ACTIVE_PHASES } from "/src/services/updates/model.ts";
import StateMixin from "/src/mixins/state.ts";
import Console from "/src/components/widgets/console/Console.vue";
import BrowserMixin from "/src/mixins/browser.ts";
let UpdatingDialog = class extends Mixins(StateMixin, BrowserMixin) {
  invokedDialog = false;
  get open() {
    const own = updateWatch.remembered;
    if (own && ACTIVE_PHASES.includes(own.phase)) return false;
    if (this.invokedDialog || this.updating) {
      this.invokedDialog = true;
      return true;
    }
    return false;
  }
  set open(value) {
    if (!value) {
      this.invokedDialog = false;
      this.$store.commit("version/setClearUpdateResponse");
    }
  }
  get updating() {
    return this.$store.state.version.busy;
  }
  get responses() {
    return this.$store.getters["version/getResponses"];
  }
};
UpdatingDialog = __decorateClass([
  Component({
    components: {
      Console
    }
  })
], UpdatingDialog);
const _sfc_main = UpdatingDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "title": _vm.updating ? _vm.$t("app.version.status.updating") : _vm.$t("app.version.status.finished"), "loading": _vm.updating, "close-button-disabled": _vm.updating, "max-width": "650", "persistent": "" }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c(__unplugin_components_1), _c(__unplugin_components_2, { attrs: { "color": "primary", "text": "", "disabled": _vm.updating }, on: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" " + _vm._s(_vm.updating ? _vm.$t("app.version.status.updating") : _vm.$t("app.version.btn.finish")) + " ")])];
  }, proxy: true }]), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_3, [_c("console", { attrs: { "items": _vm.responses, "fullscreen": _vm.isMobileViewport, "height": 250, "readonly": "" } })], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/UpdatingDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFrQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBT0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQS9CQTtBQUFBLEVBTEE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVXBkYXRpbmdEaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGFwcC1kaWFsb2dcbiAgICB2LW1vZGVsPVwib3BlblwiXG4gICAgOnRpdGxlPVwidXBkYXRpbmcgPyAkdCgnYXBwLnZlcnNpb24uc3RhdHVzLnVwZGF0aW5nJykgOiAkdCgnYXBwLnZlcnNpb24uc3RhdHVzLmZpbmlzaGVkJylcIlxuICAgIDpsb2FkaW5nPVwidXBkYXRpbmdcIlxuICAgIDpjbG9zZS1idXR0b24tZGlzYWJsZWQ9XCJ1cGRhdGluZ1wiXG4gICAgbWF4LXdpZHRoPVwiNjUwXCJcbiAgICBwZXJzaXN0ZW50XG4gID5cbiAgICA8di1jYXJkLXRleHQ+XG4gICAgICA8Y29uc29sZVxuICAgICAgICA6aXRlbXM9XCJyZXNwb25zZXNcIlxuICAgICAgICA6ZnVsbHNjcmVlbj1cImlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgICA6aGVpZ2h0PVwiMjUwXCJcbiAgICAgICAgcmVhZG9ubHlcbiAgICAgIC8+XG4gICAgPC92LWNhcmQtdGV4dD5cblxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgIDx2LXNwYWNlciAvPlxuXG4gICAgICA8YXBwLWJ0blxuICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICB0ZXh0XG4gICAgICAgIDpkaXNhYmxlZD1cInVwZGF0aW5nXCJcbiAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgID5cbiAgICAgICAge3sgdXBkYXRpbmcgPyAkdCgnYXBwLnZlcnNpb24uc3RhdHVzLnVwZGF0aW5nJykgOiAkdCgnYXBwLnZlcnNpb24uYnRuLmZpbmlzaCcpIH19XG4gICAgICA8L2FwcC1idG4+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9hcHAtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IHVwZGF0ZVdhdGNoIH0gZnJvbSAnQC9zZXJ2aWNlcy91cGRhdGVzL3dhdGNoJ1xuaW1wb3J0IHsgQUNUSVZFX1BIQVNFUyB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9tb2RlbCdcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IENvbnNvbGUgZnJvbSAnQC9jb21wb25lbnRzL3dpZGdldHMvY29uc29sZS9Db25zb2xlLnZ1ZSdcbmltcG9ydCBCcm93c2VyTWl4aW4gZnJvbSAnQC9taXhpbnMvYnJvd3NlcidcblxuQENvbXBvbmVudCh7XG4gIGNvbXBvbmVudHM6IHtcbiAgICBDb25zb2xlXG4gIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVcGRhdGluZ0RpYWxvZyBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluLCBCcm93c2VyTWl4aW4pIHtcbiAgaW52b2tlZERpYWxvZyA9IGZhbHNlXG5cbiAgZ2V0IG9wZW4gKCk6IGJvb2xlYW4ge1xuICAgIC8vIFRoZSBwcmludGVyJ3Mgb3duIHVwZGF0ZSBoYXMgaXRzIHBhZ2UgKHZpZXdzL1VwZGF0aW5nLnZ1ZSk7IE1vb25yYWtlcidzXG4gICAgLy8gdmlldyBvZiBpdCBlbmRzIGF0IFwicHJlcGFyaW5nIHRvIHJlYm9vdFwiLCBsb25nIGJlZm9yZSBpdCBpcyBkb25lLlxuICAgIGNvbnN0IG93biA9IHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWRcbiAgICBpZiAob3duICYmIEFDVElWRV9QSEFTRVMuaW5jbHVkZXMob3duLnBoYXNlKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHRoaXMuaW52b2tlZERpYWxvZyB8fCB0aGlzLnVwZGF0aW5nKSB7XG4gICAgICB0aGlzLmludm9rZWREaWFsb2cgPSB0cnVlXG5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBzZXQgb3BlbiAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICB0aGlzLmludm9rZWREaWFsb2cgPSBmYWxzZVxuICAgICAgdGhpcy4kc3RvcmUuY29tbWl0KCd2ZXJzaW9uL3NldENsZWFyVXBkYXRlUmVzcG9uc2UnKVxuICAgIH1cbiAgfVxuXG4gIGdldCB1cGRhdGluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnZlcnNpb24uYnVzeVxuICB9XG5cbiAgZ2V0IHJlc3BvbnNlcyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ZlcnNpb24vZ2V0UmVzcG9uc2VzJ11cbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb21tb24vVXBkYXRpbmdEaWFsb2cudnVlIn0=