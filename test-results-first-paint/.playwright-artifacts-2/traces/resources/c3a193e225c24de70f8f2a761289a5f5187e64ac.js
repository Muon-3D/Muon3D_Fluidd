/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemSubtitle as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSubheader as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDivider as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { startCase, capitalize } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import UserPasswordDialog from "/src/components/settings/auth/UserPasswordDialog.vue";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let AppUserMenu = class extends Vue {
  passwordDialogOpen = false;
  get user() {
    return this.$store.getters["auth/getCurrentUser"];
  }
  get currentUser() {
    if (!this.user) return "";
    if (this.user.username === "_TRUSTED_USER_" || this.user.username === "_API__API_KEY_USER_USER_") {
      return capitalize(startCase(this.user.username));
    } else {
      return this.user.username;
    }
  }
  get isTrustedOnly() {
    if (!this.user) return false;
    return this.user.username === "_TRUSTED_USER_" || this.user.username === "_API__API_KEY_USER_USER_";
  }
  changePassword() {
    this.passwordDialogOpen = true;
    this.$emit("click");
  }
  manageAccounts() {
    this.$router.push({ path: scopedPath("/settings", activeSlug()), hash: "#auth" }).catch(() => {
    });
    this.$emit("click");
  }
  async handleLogout() {
    this.$emit("click");
    await this.$store.dispatch("auth/checkTrust");
  }
};
AppUserMenu = __decorateClass([
  Component({
    components: {
      UserPasswordDialog
    }
  })
], AppUserMenu);
const _sfc_main = AppUserMenu;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.user && !_vm.isTrustedOnly ? _c("div", [_c(__unplugin_components_0), _c(__unplugin_components_1, { attrs: { "dense": "" } }, [_c(__unplugin_components_2, [_vm._v(_vm._s(_vm.currentUser))]), _c(__unplugin_components_3, { attrs: { "disabled": _vm.user.source !== "moonraker" }, on: { "click": _vm.changePassword } }, [_c(__unplugin_components_4, [_c(__unplugin_components_5, [_vm._v("$lockReset")])], 1), _c(__unplugin_components_6, [_c(__unplugin_components_7, [_vm._v(_vm._s(_vm.$t("app.general.label.change_password")))]), _vm.user.source !== "moonraker" ? _c(__unplugin_components_8, [_vm._v(" " + _vm._s(_vm.$t("app.general.label.user_managed_source", { source: _vm.$t(`app.general.label.${_vm.user.source}`) })) + " ")]) : _vm._e()], 1)], 1), _c(__unplugin_components_9, { on: { "click": _vm.manageAccounts } }, [_c(__unplugin_components_10, [_c(__unplugin_components_11, [_vm._v("$addAccount")])], 1), _c(__unplugin_components_12, [_c(__unplugin_components_13, [_vm._v(_vm._s(_vm.$t("app.general.label.manage_accounts")))])], 1)], 1), _c(__unplugin_components_14, { on: { "click": _vm.handleLogout } }, [_c(__unplugin_components_15, [_c(__unplugin_components_16, [_vm._v("$logout")])], 1), _c(__unplugin_components_17, [_c(__unplugin_components_18, [_vm._v(_vm._s(_vm.$t("app.general.btn.logout")))])], 1)], 1)], 1), _vm.passwordDialogOpen ? _c("user-password-dialog", { model: { value: _vm.passwordDialogOpen, callback: function($$v) {
    _vm.passwordDialogOpen = $$v;
  }, expression: "passwordDialogOpen" } }) : _vm._e()], 1) : _vm._e();
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppUserMenu.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQSxRQUNBLDJDQUNBLG1EQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBLFdBQ0EsMkNBQ0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXpDQTtBQUFBLEVBTEE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwVXNlck1lbnUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdiB2LWlmPVwidXNlciAmJiAhaXNUcnVzdGVkT25seVwiPlxuICAgIDx2LWRpdmlkZXIgLz5cblxuICAgIDx2LWxpc3QgZGVuc2U+XG4gICAgICA8di1zdWJoZWFkZXI+e3sgY3VycmVudFVzZXIgfX08L3Ytc3ViaGVhZGVyPlxuXG4gICAgICA8di1saXN0LWl0ZW1cbiAgICAgICAgOmRpc2FibGVkPVwidXNlci5zb3VyY2UgIT09ICdtb29ucmFrZXInXCJcbiAgICAgICAgQGNsaWNrPVwiY2hhbmdlUGFzc3dvcmRcIlxuICAgICAgPlxuICAgICAgICA8di1saXN0LWl0ZW0taWNvbj5cbiAgICAgICAgICA8di1pY29uPiRsb2NrUmVzZXQ8L3YtaWNvbj5cbiAgICAgICAgPC92LWxpc3QtaXRlbS1pY29uPlxuICAgICAgICA8di1saXN0LWl0ZW0tY29udGVudD5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+e3sgJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLmNoYW5nZV9wYXNzd29yZCcpIH19PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tc3VidGl0bGUgdi1pZj1cInVzZXIuc291cmNlICE9PSAnbW9vbnJha2VyJ1wiPlxuICAgICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLnVzZXJfbWFuYWdlZF9zb3VyY2UnLCB7IHNvdXJjZTogJHQoYGFwcC5nZW5lcmFsLmxhYmVsLiR7dXNlci5zb3VyY2V9YCkgfSkgfX1cbiAgICAgICAgICA8L3YtbGlzdC1pdGVtLXN1YnRpdGxlPlxuICAgICAgICA8L3YtbGlzdC1pdGVtLWNvbnRlbnQ+XG4gICAgICA8L3YtbGlzdC1pdGVtPlxuXG4gICAgICA8di1saXN0LWl0ZW0gQGNsaWNrPVwibWFuYWdlQWNjb3VudHNcIj5cbiAgICAgICAgPHYtbGlzdC1pdGVtLWljb24+XG4gICAgICAgICAgPHYtaWNvbj4kYWRkQWNjb3VudDwvdi1pY29uPlxuICAgICAgICA8L3YtbGlzdC1pdGVtLWljb24+XG4gICAgICAgIDx2LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT57eyAkdCgnYXBwLmdlbmVyYWwubGFiZWwubWFuYWdlX2FjY291bnRzJykgfX08L3YtbGlzdC1pdGVtLXRpdGxlPlxuICAgICAgICA8L3YtbGlzdC1pdGVtLWNvbnRlbnQ+XG4gICAgICA8L3YtbGlzdC1pdGVtPlxuXG4gICAgICA8di1saXN0LWl0ZW0gQGNsaWNrPVwiaGFuZGxlTG9nb3V0XCI+XG4gICAgICAgIDx2LWxpc3QtaXRlbS1pY29uPlxuICAgICAgICAgIDx2LWljb24+JGxvZ291dDwvdi1pY29uPlxuICAgICAgICA8L3YtbGlzdC1pdGVtLWljb24+XG4gICAgICAgIDx2LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgIDx2LWxpc3QtaXRlbS10aXRsZT57eyAkdCgnYXBwLmdlbmVyYWwuYnRuLmxvZ291dCcpIH19PC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgPC92LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgPC92LWxpc3QtaXRlbT5cbiAgICA8L3YtbGlzdD5cblxuICAgIDx1c2VyLXBhc3N3b3JkLWRpYWxvZ1xuICAgICAgdi1pZj1cInBhc3N3b3JkRGlhbG9nT3BlblwiXG4gICAgICB2LW1vZGVsPVwicGFzc3dvcmREaWFsb2dPcGVuXCJcbiAgICAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBzdGFydENhc2UsIGNhcGl0YWxpemUgfSBmcm9tICdsb2Rhc2gtZXMnXG5pbXBvcnQgVXNlclBhc3N3b3JkRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9hdXRoL1VzZXJQYXNzd29yZERpYWxvZy52dWUnXG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuaW1wb3J0IHsgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5cbi8vIFRoZSBzaWduZWQtaW4gTW9vbnJha2VyIHVzZXIsIGluIHRoZSBhY2NvdW50IG1lbnUgdW5kZXIgdGhlIE11b24zRFxuLy8gYWNjb3VudDogdGhlIHByaW50ZXIgbG9naW4ncyBwYXNzd29yZCwgYWNjb3VudHMgYW5kIGxvZyBvdXQuXG5AQ29tcG9uZW50KHtcbiAgY29tcG9uZW50czoge1xuICAgIFVzZXJQYXNzd29yZERpYWxvZ1xuICB9XG59KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwVXNlck1lbnUgZXh0ZW5kcyBWdWUge1xuICBwYXNzd29yZERpYWxvZ09wZW4gPSBmYWxzZVxuXG4gIGdldCB1c2VyICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snYXV0aC9nZXRDdXJyZW50VXNlciddXG4gIH1cblxuICBnZXQgY3VycmVudFVzZXIgKCkge1xuICAgIGlmICghdGhpcy51c2VyKSByZXR1cm4gJydcbiAgICBpZiAoXG4gICAgICB0aGlzLnVzZXIudXNlcm5hbWUgPT09ICdfVFJVU1RFRF9VU0VSXycgfHxcbiAgICAgIHRoaXMudXNlci51c2VybmFtZSA9PT0gJ19BUElfX0FQSV9LRVlfVVNFUl9VU0VSXydcbiAgICApIHtcbiAgICAgIHJldHVybiBjYXBpdGFsaXplKHN0YXJ0Q2FzZSh0aGlzLnVzZXIudXNlcm5hbWUpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy51c2VyLnVzZXJuYW1lXG4gICAgfVxuICB9XG5cbiAgZ2V0IGlzVHJ1c3RlZE9ubHkgKCkge1xuICAgIGlmICghdGhpcy51c2VyKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy51c2VyLnVzZXJuYW1lID09PSAnX1RSVVNURURfVVNFUl8nIHx8XG4gICAgICB0aGlzLnVzZXIudXNlcm5hbWUgPT09ICdfQVBJX19BUElfS0VZX1VTRVJfVVNFUl8nXG4gICAgKVxuICB9XG5cbiAgY2hhbmdlUGFzc3dvcmQgKCkge1xuICAgIHRoaXMucGFzc3dvcmREaWFsb2dPcGVuID0gdHJ1ZVxuICAgIHRoaXMuJGVtaXQoJ2NsaWNrJylcbiAgfVxuXG4gIG1hbmFnZUFjY291bnRzICgpIHtcbiAgICB0aGlzLiRyb3V0ZXIucHVzaCh7IHBhdGg6IHNjb3BlZFBhdGgoJy9zZXR0aW5ncycsIGFjdGl2ZVNsdWcoKSksIGhhc2g6ICcjYXV0aCcgfSkuY2F0Y2goKCkgPT4ge30pXG4gICAgdGhpcy4kZW1pdCgnY2xpY2snKVxuICB9XG5cbiAgYXN5bmMgaGFuZGxlTG9nb3V0ICgpIHtcbiAgICB0aGlzLiRlbWl0KCdjbGljaycpXG4gICAgYXdhaXQgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2F1dGgvY2hlY2tUcnVzdCcpXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbGF5b3V0L0FwcFVzZXJNZW51LnZ1ZSJ9