/* unplugin-vue-components disabled */import { VTextField as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_7 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_4 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VAlert as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { httpClientActions } from "/src/api/httpClientActions.ts";
import { Component, Vue, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
let UserPasswordDialog = class extends Vue {
  open;
  currentPassword = "";
  password = "";
  error = false;
  loading = false;
  get currentUser() {
    const currentUser = this.$store.getters["auth/getCurrentUser"];
    return currentUser && currentUser.username ? currentUser.username : "";
  }
  async handleSave() {
    try {
      this.loading = true;
      await httpClientActions.accessUserPasswordPost(this.currentPassword, this.password);
      EventBus.$emit(this.$tc("app.general.msg.password_changed"), { timeout: 2e3 });
      this.open = false;
    } catch {
      this.error = true;
    } finally {
      this.loading = false;
    }
  }
};
__decorateClass([
  VModel({ type: Boolean })
], UserPasswordDialog.prototype, "open", 2);
UserPasswordDialog = __decorateClass([
  Component({})
], UserPasswordDialog);
const _sfc_main = UserPasswordDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "title": _vm.$t("app.general.label.change_password"), "cancel-button-loading": _vm.loading, "save-button-loading": _vm.loading, "max-width": "500" }, on: { "save": _vm.handleSave }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_1, { staticClass: "pa-0" }, [_vm.error ? [_c(__unplugin_components_2, { staticClass: "mx-4 mt-4", attrs: { "type": "error", "text": "" } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.msg.wrong_password")) + " ")]), _c(__unplugin_components_3)] : _vm._e(), _c(__unplugin_components_4, { attrs: { "title": _vm.$t("app.general.label.current_password") } }, [_c(__unplugin_components_5, { staticClass: "mt-0", attrs: { "autocomplete": "current-password", "filled": "", "dense": "", "type": "password", "hide-details": "auto", "rules": [
    _vm.$rules.required
  ] }, model: { value: _vm.currentPassword, callback: function($$v) {
    _vm.currentPassword = $$v;
  }, expression: "currentPassword" } })], 1), _c(__unplugin_components_6), _c(__unplugin_components_7, { attrs: { "title": _vm.$t("app.general.label.new_password") } }, [_c(__unplugin_components_8, { staticClass: "mt-0", attrs: { "autocomplete": "current-password", "filled": "", "dense": "", "type": "password", "hide-details": "auto", "rules": [
    _vm.$rules.required,
    _vm.$rules.lengthGreaterThanOrEqual(4),
    _vm.$rules.passwordNotEqualUsername(_vm.currentUser)
  ] }, model: { value: _vm.password, callback: function($$v) {
    _vm.password = $$v;
  }, expression: "password" } })], 1)], 2)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/auth/UserPasswordDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTREQTtBQUNBO0FBQ0E7QUFHQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBRUE7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBM0JBO0FBQUEsRUFEQTtBQUFBLEdBREEsbUJBRUE7QUFGQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJVc2VyUGFzc3dvcmREaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGFwcC1kaWFsb2dcbiAgICB2LW1vZGVsPVwib3BlblwiXG4gICAgOnRpdGxlPVwiJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLmNoYW5nZV9wYXNzd29yZCcpXCJcbiAgICA6Y2FuY2VsLWJ1dHRvbi1sb2FkaW5nPVwibG9hZGluZ1wiXG4gICAgOnNhdmUtYnV0dG9uLWxvYWRpbmc9XCJsb2FkaW5nXCJcbiAgICBtYXgtd2lkdGg9XCI1MDBcIlxuICAgIEBzYXZlPVwiaGFuZGxlU2F2ZVwiXG4gID5cbiAgICA8di1jYXJkLXRleHQgY2xhc3M9XCJwYS0wXCI+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cImVycm9yXCI+XG4gICAgICAgIDx2LWFsZXJ0XG4gICAgICAgICAgdHlwZT1cImVycm9yXCJcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgY2xhc3M9XCJteC00IG10LTRcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLm1zZy53cm9uZ19wYXNzd29yZCcpIH19XG4gICAgICAgIDwvdi1hbGVydD5cblxuICAgICAgICA8di1kaXZpZGVyIC8+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8YXBwLXNldHRpbmcgOnRpdGxlPVwiJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLmN1cnJlbnRfcGFzc3dvcmQnKVwiPlxuICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgdi1tb2RlbD1cImN1cnJlbnRQYXNzd29yZFwiXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiXG4gICAgICAgICAgZmlsbGVkXG4gICAgICAgICAgZGVuc2VcbiAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgIGNsYXNzPVwibXQtMFwiXG4gICAgICAgICAgaGlkZS1kZXRhaWxzPVwiYXV0b1wiXG4gICAgICAgICAgOnJ1bGVzPVwiW1xuICAgICAgICAgICAgJHJ1bGVzLnJlcXVpcmVkXG4gICAgICAgICAgXVwiXG4gICAgICAgIC8+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuXG4gICAgICA8di1kaXZpZGVyIC8+XG5cbiAgICAgIDxhcHAtc2V0dGluZyA6dGl0bGU9XCIkdCgnYXBwLmdlbmVyYWwubGFiZWwubmV3X3Bhc3N3b3JkJylcIj5cbiAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgIHYtbW9kZWw9XCJwYXNzd29yZFwiXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPVwiY3VycmVudC1wYXNzd29yZFwiXG4gICAgICAgICAgZmlsbGVkXG4gICAgICAgICAgZGVuc2VcbiAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgIGNsYXNzPVwibXQtMFwiXG4gICAgICAgICAgaGlkZS1kZXRhaWxzPVwiYXV0b1wiXG4gICAgICAgICAgOnJ1bGVzPVwiW1xuICAgICAgICAgICAgJHJ1bGVzLnJlcXVpcmVkLFxuICAgICAgICAgICAgJHJ1bGVzLmxlbmd0aEdyZWF0ZXJUaGFuT3JFcXVhbCg0KSxcbiAgICAgICAgICAgICRydWxlcy5wYXNzd29yZE5vdEVxdWFsVXNlcm5hbWUoY3VycmVudFVzZXIpXG4gICAgICAgICAgXVwiXG4gICAgICAgIC8+XG4gICAgICA8L2FwcC1zZXR0aW5nPlxuICAgIDwvdi1jYXJkLXRleHQ+XG4gIDwvYXBwLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBodHRwQ2xpZW50QWN0aW9ucyB9IGZyb20gJ0AvYXBpL2h0dHBDbGllbnRBY3Rpb25zJ1xuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUsIFZNb2RlbCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVc2VyUGFzc3dvcmREaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogQm9vbGVhbiB9KVxuICAgIG9wZW4/OiBib29sZWFuXG5cbiAgY3VycmVudFBhc3N3b3JkID0gJydcbiAgcGFzc3dvcmQgPSAnJ1xuICBlcnJvciA9IGZhbHNlXG4gIGxvYWRpbmcgPSBmYWxzZVxuXG4gIGdldCBjdXJyZW50VXNlciAoKSB7XG4gICAgY29uc3QgY3VycmVudFVzZXIgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydhdXRoL2dldEN1cnJlbnRVc2VyJ11cbiAgICByZXR1cm4gKGN1cnJlbnRVc2VyICYmIGN1cnJlbnRVc2VyLnVzZXJuYW1lKSA/IGN1cnJlbnRVc2VyLnVzZXJuYW1lIDogJydcbiAgfVxuXG4gIGFzeW5jIGhhbmRsZVNhdmUgKCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlXG5cbiAgICAgIGF3YWl0IGh0dHBDbGllbnRBY3Rpb25zLmFjY2Vzc1VzZXJQYXNzd29yZFBvc3QodGhpcy5jdXJyZW50UGFzc3dvcmQsIHRoaXMucGFzc3dvcmQpXG5cbiAgICAgIEV2ZW50QnVzLiRlbWl0KHRoaXMuJHRjKCdhcHAuZ2VuZXJhbC5tc2cucGFzc3dvcmRfY2hhbmdlZCcpLCB7IHRpbWVvdXQ6IDIwMDAgfSlcblxuICAgICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMuZXJyb3IgPSB0cnVlXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlXG4gICAgfVxuICB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL2F1dGgvVXNlclBhc3N3b3JkRGlhbG9nLnZ1ZSJ9