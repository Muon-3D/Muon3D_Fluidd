/* unplugin-vue-components disabled */import { VDivider as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_9 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_8 from "/src/components/ui/AppSetting.vue";
import { VDivider as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/ui/AppBtn.vue";
import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_3 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_2 from "/src/components/ui/AppSetting.vue";
import { VCard as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSubheader as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import UserConfigDialog from "/src/components/settings/auth/UserConfigDialog.vue";
import ApiKeyDialog from "/src/components/settings/auth/ApiKeyDialog.vue";
let AuthSettings = class extends Vue {
  search = "";
  categoryId = void 0;
  userDialogState = {
    open: false,
    user: null,
    handler: null
  };
  apiKeyDialogState = {
    open: false
  };
  get users() {
    return this.$store.getters["auth/getUsers"];
  }
  get currentUser() {
    const currentUser = this.$store.getters["auth/getCurrentUser"];
    return currentUser && currentUser.username ? currentUser.username : "";
  }
  handleAddUserDialog() {
    this.userDialogState = {
      open: true,
      user: { username: "", password: "" },
      handler: this.handleSaveUser
    };
  }
  handleEditUserDialog(user) {
    this.userDialogState = {
      open: true,
      user,
      handler: this.handleSaveUser
    };
  }
  handleApiKeyDialog() {
    this.apiKeyDialogState.open = true;
  }
  async handleRemoveUser(user) {
    const result = await this.$confirm(
      `${user.username} can't sign in to this printer any more.`,
      { title: `Remove ${user.username}?`, buttonTrueText: "Remove", danger: true }
    );
    if (result) {
      this.$store.dispatch("auth/removeUser", user);
    }
  }
  async handleSaveUser(user) {
    await this.$store.dispatch("auth/addUser", user);
    if (this.users.length === 0) this.$store.dispatch("auth/checkTrust");
  }
};
AuthSettings = __decorateClass([
  Component({
    components: {
      UserConfigDialog,
      ApiKeyDialog
    }
  })
], AuthSettings);
const _sfc_main = AuthSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_c(__unplugin_components_0, { attrs: { "id": "auth" } }, [_vm._v(" " + _vm._s(_vm.$t("app.setting.title.authentication")) + " ")]), _c(__unplugin_components_1, { staticClass: "mb-4", attrs: { "elevation": 5, "dense": "" } }, [_c(__unplugin_components_2, [_c(__unplugin_components_3, { staticClass: "mr-2", attrs: { "outlined": "", "small": "", "color": "primary" }, on: { "click": _vm.handleApiKeyDialog } }, [_c(__unplugin_components_4, { attrs: { "small": "", "left": "" } }, [_vm._v(" $edit ")]), _vm._v(" " + _vm._s(_vm.$t("app.general.label.api_key")) + " ")], 1), _c(__unplugin_components_5, { attrs: { "outlined": "", "small": "", "color": "primary" }, on: { "click": _vm.handleAddUserDialog } }, [_c(__unplugin_components_6, { attrs: { "small": "", "left": "" } }, [_vm._v(" $plus ")]), _vm._v(" " + _vm._s(_vm.$t("app.setting.btn.add_user")) + " ")], 1)], 1), _vm.users.length > 0 ? _c(__unplugin_components_7) : _vm._e(), _vm._l(_vm.users, function(user, i) {
    return [_c(__unplugin_components_8, { key: `user-${user.username}`, attrs: { "sub-title": user.username === _vm.currentUser ? _vm.$t("app.general.label.current_user") : user.source !== "moonraker" ? _vm.$t("app.general.label.user_managed_source", { source: _vm.$t(`app.general.label.${user.source}`) }) : void 0, "r-cols": 3 }, scopedSlots: _vm._u([{ key: "title", fn: function() {
      return [_vm._v(" " + _vm._s(user.username) + " ")];
    }, proxy: true }], null, true) }, [_c(__unplugin_components_9, { attrs: { "disabled": user.username === _vm.currentUser || user.source !== "moonraker", "fab": "", "text": "", "x-small": "", "color": "" }, on: { "click": function($event) {
      $event.stopPropagation();
      return _vm.handleRemoveUser(user);
    } } }, [_c(__unplugin_components_10, { attrs: { "color": "" } }, [_vm._v(" $close ")])], 1)], 1), i < _vm.users.length - 1 ? _c(__unplugin_components_11, { key: `divider-${user.username}` }) : _vm._e()];
  }), _vm.userDialogState.open ? _c("user-config-dialog", { attrs: { "user": _vm.userDialogState.user }, on: { "save": _vm.userDialogState.handler }, model: { value: _vm.userDialogState.open, callback: function($$v) {
    _vm.$set(_vm.userDialogState, "open", $$v);
  }, expression: "userDialogState.open" } }) : _vm._e(), _vm.apiKeyDialogState.open ? _c("api-key-dialog", { model: { value: _vm.apiKeyDialogState.open, callback: function($$v) {
    _vm.$set(_vm.apiKeyDialogState, "open", $$v);
  }, expression: "apiKeyDialogState.open" } }) : _vm._e()], 2)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/auth/AuthSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtHQTtBQUNBO0FBQ0E7QUFRQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFHQTtBQUFBLEVBQ0E7QUFDQTtBQTVEQTtBQUFBLEVBTkE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkF1dGhTZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2PlxuICAgIDx2LXN1YmhlYWRlciBpZD1cImF1dGhcIj5cbiAgICAgIHt7ICR0KCdhcHAuc2V0dGluZy50aXRsZS5hdXRoZW50aWNhdGlvbicpIH19XG4gICAgPC92LXN1YmhlYWRlcj5cbiAgICA8di1jYXJkXG4gICAgICA6ZWxldmF0aW9uPVwiNVwiXG4gICAgICBkZW5zZVxuICAgICAgY2xhc3M9XCJtYi00XCJcbiAgICA+XG4gICAgICA8YXBwLXNldHRpbmc+XG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgY2xhc3M9XCJtci0yXCJcbiAgICAgICAgICBAY2xpY2s9XCJoYW5kbGVBcGlLZXlEaWFsb2dcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtaWNvblxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIGxlZnRcbiAgICAgICAgICA+XG4gICAgICAgICAgICAkZWRpdFxuICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5sYWJlbC5hcGlfa2V5JykgfX1cbiAgICAgICAgPC9hcHAtYnRuPlxuXG4gICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgQGNsaWNrPVwiaGFuZGxlQWRkVXNlckRpYWxvZ1wiXG4gICAgICAgID5cbiAgICAgICAgICA8di1pY29uXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgbGVmdFxuICAgICAgICAgID5cbiAgICAgICAgICAgICRwbHVzXG4gICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAge3sgJHQoJ2FwcC5zZXR0aW5nLmJ0bi5hZGRfdXNlcicpIH19XG4gICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgIDwvYXBwLXNldHRpbmc+XG5cbiAgICAgIDx2LWRpdmlkZXIgdi1pZj1cInVzZXJzLmxlbmd0aCA+IDBcIiAvPlxuXG4gICAgICA8dGVtcGxhdGVcbiAgICAgICAgdi1mb3I9XCIodXNlciwgaSkgaW4gdXNlcnNcIlxuICAgICAgPlxuICAgICAgICA8YXBwLXNldHRpbmdcbiAgICAgICAgICA6a2V5PVwiYHVzZXItJHt1c2VyLnVzZXJuYW1lfWBcIlxuICAgICAgICAgIDpzdWItdGl0bGU9XCJcbiAgICAgICAgICAgIHVzZXIudXNlcm5hbWUgPT09IGN1cnJlbnRVc2VyID8gJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLmN1cnJlbnRfdXNlcicpIDpcbiAgICAgICAgICAgIHVzZXIuc291cmNlICE9PSAnbW9vbnJha2VyJyA/ICR0KCdhcHAuZ2VuZXJhbC5sYWJlbC51c2VyX21hbmFnZWRfc291cmNlJywgeyBzb3VyY2U6ICR0KGBhcHAuZ2VuZXJhbC5sYWJlbC4ke3VzZXIuc291cmNlfWApIH0pIDpcbiAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICAgIFwiXG4gICAgICAgICAgOnItY29scz1cIjNcIlxuICAgICAgICA+XG4gICAgICAgICAgPHRlbXBsYXRlICN0aXRsZT5cbiAgICAgICAgICAgIHt7IHVzZXIudXNlcm5hbWUgfX1cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgIDpkaXNhYmxlZD1cInVzZXIudXNlcm5hbWUgPT09IGN1cnJlbnRVc2VyIHx8IHVzZXIuc291cmNlICE9PSAnbW9vbnJha2VyJ1wiXG4gICAgICAgICAgICBmYWJcbiAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICAgIGNvbG9yPVwiXCJcbiAgICAgICAgICAgIEBjbGljay5zdG9wPVwiaGFuZGxlUmVtb3ZlVXNlcih1c2VyKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHYtaWNvbiBjb2xvcj1cIlwiPlxuICAgICAgICAgICAgICAkY2xvc2VcbiAgICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgIDwvYXBwLWJ0bj5cbiAgICAgICAgPC9hcHAtc2V0dGluZz5cblxuICAgICAgICA8di1kaXZpZGVyXG4gICAgICAgICAgdi1pZj1cImkgPCB1c2Vycy5sZW5ndGggLSAxXCJcbiAgICAgICAgICA6a2V5PVwiYGRpdmlkZXItJHt1c2VyLnVzZXJuYW1lfWBcIlxuICAgICAgICAvPlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPHVzZXItY29uZmlnLWRpYWxvZ1xuICAgICAgICB2LWlmPVwidXNlckRpYWxvZ1N0YXRlLm9wZW5cIlxuICAgICAgICB2LW1vZGVsPVwidXNlckRpYWxvZ1N0YXRlLm9wZW5cIlxuICAgICAgICA6dXNlcj1cInVzZXJEaWFsb2dTdGF0ZS51c2VyXCJcbiAgICAgICAgQHNhdmU9XCJ1c2VyRGlhbG9nU3RhdGUuaGFuZGxlclwiXG4gICAgICAvPlxuXG4gICAgICA8YXBpLWtleS1kaWFsb2dcbiAgICAgICAgdi1pZj1cImFwaUtleURpYWxvZ1N0YXRlLm9wZW5cIlxuICAgICAgICB2LW1vZGVsPVwiYXBpS2V5RGlhbG9nU3RhdGUub3BlblwiXG4gICAgICAvPlxuICAgIDwvdi1jYXJkPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgdHlwZSB7IEFwcFVzZXIgfSBmcm9tICdAL3N0b3JlL2F1dGgvdHlwZXMnXG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVXNlckNvbmZpZ0RpYWxvZyBmcm9tICcuL1VzZXJDb25maWdEaWFsb2cudnVlJ1xuaW1wb3J0IEFwaUtleURpYWxvZyBmcm9tICcuL0FwaUtleURpYWxvZy52dWUnXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7XG4gICAgVXNlckNvbmZpZ0RpYWxvZyxcbiAgICBBcGlLZXlEaWFsb2dcbiAgfVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dGhTZXR0aW5ncyBleHRlbmRzIFZ1ZSB7XG4gIHNlYXJjaCA9ICcnXG4gIGNhdGVnb3J5SWQ/OiBzdHJpbmcgPSB1bmRlZmluZWRcblxuICB1c2VyRGlhbG9nU3RhdGU6IGFueSA9IHtcbiAgICBvcGVuOiBmYWxzZSxcbiAgICB1c2VyOiBudWxsLFxuICAgIGhhbmRsZXI6IG51bGxcbiAgfVxuXG4gIGFwaUtleURpYWxvZ1N0YXRlOiBhbnkgPSB7XG4gICAgb3BlbjogZmFsc2VcbiAgfVxuXG4gIGdldCB1c2VycyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ2F1dGgvZ2V0VXNlcnMnXVxuICB9XG5cbiAgZ2V0IGN1cnJlbnRVc2VyICgpIHtcbiAgICBjb25zdCBjdXJyZW50VXNlciA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ2F1dGgvZ2V0Q3VycmVudFVzZXInXVxuICAgIHJldHVybiAoY3VycmVudFVzZXIgJiYgY3VycmVudFVzZXIudXNlcm5hbWUpID8gY3VycmVudFVzZXIudXNlcm5hbWUgOiAnJ1xuICB9XG5cbiAgaGFuZGxlQWRkVXNlckRpYWxvZyAoKSB7XG4gICAgdGhpcy51c2VyRGlhbG9nU3RhdGUgPSB7XG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgdXNlcjogeyB1c2VybmFtZTogJycsIHBhc3N3b3JkOiAnJyB9LFxuICAgICAgaGFuZGxlcjogdGhpcy5oYW5kbGVTYXZlVXNlclxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUVkaXRVc2VyRGlhbG9nICh1c2VyOiBBcHBVc2VyKSB7XG4gICAgdGhpcy51c2VyRGlhbG9nU3RhdGUgPSB7XG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgdXNlcixcbiAgICAgIGhhbmRsZXI6IHRoaXMuaGFuZGxlU2F2ZVVzZXJcbiAgICB9XG4gIH1cblxuICBoYW5kbGVBcGlLZXlEaWFsb2cgKCkge1xuICAgIHRoaXMuYXBpS2V5RGlhbG9nU3RhdGUub3BlbiA9IHRydWVcbiAgfVxuXG4gIGFzeW5jIGhhbmRsZVJlbW92ZVVzZXIgKHVzZXI6IEFwcFVzZXIpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLiRjb25maXJtKFxuICAgICAgYCR7dXNlci51c2VybmFtZX0gY2FuJ3Qgc2lnbiBpbiB0byB0aGlzIHByaW50ZXIgYW55IG1vcmUuYCxcbiAgICAgIHsgdGl0bGU6IGBSZW1vdmUgJHt1c2VyLnVzZXJuYW1lfT9gLCBidXR0b25UcnVlVGV4dDogJ1JlbW92ZScsIGRhbmdlcjogdHJ1ZSB9XG4gICAgKVxuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2F1dGgvcmVtb3ZlVXNlcicsIHVzZXIpXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgaGFuZGxlU2F2ZVVzZXIgKHVzZXI6IEFwcFVzZXIpIHtcbiAgICBhd2FpdCB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnYXV0aC9hZGRVc2VyJywgdXNlcilcblxuICAgIC8vIFdlIG9ubHkgd2FudCB0byBjaGVjayB0cnVzdCBpZiB0aGlzIGlzIHRoZSBmaXJzdCB1c2VyIGJlaW5nIGFkZGVkLlxuICAgIGlmICh0aGlzLnVzZXJzLmxlbmd0aCA9PT0gMCkgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2F1dGgvY2hlY2tUcnVzdCcpXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvc2V0dGluZ3MvYXV0aC9BdXRoU2V0dGluZ3MudnVlIn0=