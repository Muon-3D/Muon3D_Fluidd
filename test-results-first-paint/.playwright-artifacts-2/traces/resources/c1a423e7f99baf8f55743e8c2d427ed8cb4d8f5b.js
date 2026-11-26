/* unplugin-vue-components disabled */import { VBtn as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_14 from "/src/components/ui/AppBtn.vue";
import { VAlert as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VForm as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardSubtitle as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCard as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, VModel, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { signIn, signInWithCode, signUp } from "/src/services/muon-cloud/state.ts";
import { centralLoginEnabled, startCentralSignIn } from "/src/services/muon-cloud/centralLogin.ts";
import { cloudSessionAllowed } from "/src/services/muon-cloud/api.ts";
import OpenInMuonControl from "/src/components/muon-cloud/OpenInMuonControl.vue";
let CloudAccountDialog = class extends Vue {
  open;
  initialMode;
  mode = "sign-in";
  age = "";
  name = "";
  email = "";
  password = "";
  /** Set once the password was right and the account wants its authenticator code. */
  mfaToken = "";
  code = "";
  showPassword = false;
  busy = false;
  error = null;
  ageError = "";
  icons = { eye: "$eye", eyeOff: "$eyeOff" };
  redirecting = false;
  /** False on the printer's plain-HTTP address: no form, one link to the console (KAN-2192). */
  sessionAllowed = cloudSessionAllowed();
  created() {
    this.mode = this.initialMode;
    if (centralLoginEnabled()) {
      this.redirecting = true;
      startCentralSignIn({ silent: false }).catch((error) => {
        this.redirecting = false;
        this.error = error.message;
      });
    }
  }
  async submit() {
    this.error = null;
    this.ageError = "";
    if (this.mode === "sign-up") {
      this.ageError = validateAge(this.age);
      if (this.ageError) return;
    }
    this.busy = true;
    try {
      if (this.mfaToken) {
        await signInWithCode(this.mfaToken, this.code);
      } else if (this.mode === "sign-in") {
        const mfa = await signIn(this.email, this.password);
        if (mfa) {
          this.password = "";
          this.mfaToken = mfa;
          this.code = "";
          return;
        }
      } else {
        await signUp(this.email, this.password, this.name, Number(this.age));
      }
      this.password = "";
      this.code = "";
      this.mfaToken = "";
      this.$emit("signed-in");
      this.open = false;
    } catch (error) {
      this.error = error.message;
      if (this.mfaToken) this.code = "";
    } finally {
      this.busy = false;
    }
  }
};
__decorateClass([
  VModel({ type: Boolean })
], CloudAccountDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: String, default: "sign-in" })
], CloudAccountDialog.prototype, "initialMode", 2);
CloudAccountDialog = __decorateClass([
  Component({ components: { OpenInMuonControl } })
], CloudAccountDialog);
function validateAge(age) {
  if (!/^\d+$/.test(age)) return "Enter your age as a whole number.";
  return Number(age) >= 13 && Number(age) <= 120 ? "" : "Age must be between 13 and 120.";
}
const _sfc_main = CloudAccountDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "max-width": "420" }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_1, { staticClass: "muon-cloud-dialog" }, [_c(__unplugin_components_2, { staticClass: "pb-1" }, [_vm._v(" " + _vm._s(!_vm.sessionAllowed ? "Your Muon3D account" : _vm.mfaToken ? "Enter your code" : _vm.mode === "sign-in" ? "Sign in to Muon3D" : "Create your Muon3D account") + " ")]), _c(__unplugin_components_3, { staticClass: "pt-1" }, [_vm._v(" Reach your linked printers from anywhere. Printers on this network keep working without an account. ")]), !_vm.sessionAllowed ? _c(__unplugin_components_4, [_c("open-in-muon-control", { attrs: { "route": _vm.$route ? _vm.$route.fullPath : "/" } })], 1) : _vm.redirecting ? _c(__unplugin_components_5, [_vm._v(" Taking you to the Muon3D sign-in\u2026 ")]) : _c(__unplugin_components_6, [_c(__unplugin_components_7, { ref: "form", on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.submit.apply(null, arguments);
  } } }, [_vm.mfaToken ? _c(__unplugin_components_8, { staticClass: "mb-3", attrs: { "label": "Code", "inputmode": "numeric", "autocomplete": "one-time-code", "hint": "Six digits from your authenticator app, or a recovery code.", "persistent-hint": "", "outlined": "", "dense": "", "autofocus": "", "data-tid": "sign-in-code" }, model: { value: _vm.code, callback: function($$v) {
    _vm.code = $$v;
  }, expression: "code" } }) : _vm._e(), !_vm.mfaToken && _vm.mode === "sign-up" ? _c(__unplugin_components_9, { attrs: { "label": "Name", "autocomplete": "name", "autofocus": "", "outlined": "", "dense": "" }, model: { value: _vm.name, callback: function($$v) {
    _vm.name = $$v;
  }, expression: "name" } }) : _vm._e(), !_vm.mfaToken && _vm.mode === "sign-up" ? _c(__unplugin_components_10, { attrs: { "label": "Your age", "type": "text", "inputmode": "numeric", "hint": "Private. Confirm once; accounts require age 13 or over.", "persistent-hint": "", "outlined": "", "dense": "", "data-tid": "sign-up-age", "aria-describedby": _vm.ageError ? "dialog-sign-up-age-error" : void 0, "aria-invalid": _vm.ageError ? "true" : void 0 }, model: { value: _vm.age, callback: function($$v) {
    _vm.age = $$v;
  }, expression: "age" } }) : _vm._e(), _vm.ageError ? _c("p", { staticClass: "error--text text-caption", attrs: { "id": "dialog-sign-up-age-error", "data-tid": "sign-up-age-error", "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.ageError) + " ")]) : _vm._e(), !_vm.mfaToken ? _c(__unplugin_components_11, { attrs: { "label": "Email", "type": "email", "autocomplete": "email", "outlined": "", "dense": "", "autofocus": _vm.mode === "sign-in" }, model: { value: _vm.email, callback: function($$v) {
    _vm.email = $$v;
  }, expression: "email" } }) : _vm._e(), !_vm.mfaToken ? _c(__unplugin_components_12, { attrs: { "label": "Password", "type": _vm.showPassword ? "text" : "password", "autocomplete": _vm.mode === "sign-in" ? "current-password" : "new-password", "hint": _vm.mode === "sign-up" ? "At least 8 characters" : "", "append-icon": _vm.showPassword ? _vm.icons.eyeOff : _vm.icons.eye, "outlined": "", "dense": "" }, on: { "click:append": function($event) {
    _vm.showPassword = !_vm.showPassword;
  } }, model: { value: _vm.password, callback: function($$v) {
    _vm.password = $$v;
  }, expression: "password" } }) : _vm._e(), _vm.error ? _c(__unplugin_components_13, { staticClass: "mb-3", attrs: { "type": "error", "dense": "", "text": "", "role": "alert", "aria-live": "assertive" } }, [_vm._v(" " + _vm._s(_vm.error) + " ")]) : _vm._e(), _c(__unplugin_components_14, { attrs: { "type": "submit", "color": "primary", "block": "", "loading": _vm.busy } }, [_vm._v(" " + _vm._s(_vm.mfaToken ? "Continue" : _vm.mode === "sign-in" ? "Sign in" : "Create account") + " ")])], 1)], 1), _vm.sessionAllowed && _vm.mfaToken ? _c(__unplugin_components_15, { staticClass: "justify-center pb-4" }, [_c(__unplugin_components_16, { attrs: { "text": "", "small": "", "color": "primary", "data-tid": "sign-in-code-back" }, on: { "click": function($event) {
    _vm.mfaToken = "";
    _vm.code = "";
    _vm.error = null;
  } } }, [_vm._v(" Start again ")])], 1) : _vm.sessionAllowed && !_vm.redirecting ? _c(__unplugin_components_17, { staticClass: "justify-center pb-4" }, [_c("span", { staticClass: "text-body-2 text--secondary" }, [_vm._v(" " + _vm._s(_vm.mode === "sign-in" ? "New to Muon3D?" : "Already have an account?") + " ")]), _c(__unplugin_components_18, { attrs: { "text": "", "small": "", "color": "primary" }, on: { "click": function($event) {
    _vm.mode = _vm.mode === "sign-in" ? "sign-up" : "sign-in";
    _vm.error = null;
  } } }, [_vm._v(" " + _vm._s(_vm.mode === "sign-in" ? "Create an account" : "Sign in") + " ")])], 1) : _vm._e()], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/CloudAccountDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQ0E7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBR0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBM0VBO0FBQUEsRUFEQTtBQUFBLEdBREEsbUJBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLG1CQUtBO0FBTEE7QUFBQSxFQURBO0FBQUEsR0FDQTtBQStFQTtBQUNBO0FBQ0E7QUFDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ2xvdWRBY2NvdW50RGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWRpYWxvZ1xuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICBtYXgtd2lkdGg9XCI0MjBcIlxuICA+XG4gICAgPHYtY2FyZCBjbGFzcz1cIm11b24tY2xvdWQtZGlhbG9nXCI+XG4gICAgICA8di1jYXJkLXRpdGxlIGNsYXNzPVwicGItMVwiPlxuICAgICAgICB7eyAhc2Vzc2lvbkFsbG93ZWQgPyAnWW91ciBNdW9uM0QgYWNjb3VudCcgOiBtZmFUb2tlbiA/ICdFbnRlciB5b3VyIGNvZGUnIDogbW9kZSA9PT0gJ3NpZ24taW4nID8gJ1NpZ24gaW4gdG8gTXVvbjNEJyA6ICdDcmVhdGUgeW91ciBNdW9uM0QgYWNjb3VudCcgfX1cbiAgICAgIDwvdi1jYXJkLXRpdGxlPlxuICAgICAgPHYtY2FyZC1zdWJ0aXRsZSBjbGFzcz1cInB0LTFcIj5cbiAgICAgICAgUmVhY2ggeW91ciBsaW5rZWQgcHJpbnRlcnMgZnJvbSBhbnl3aGVyZS4gUHJpbnRlcnMgb24gdGhpcyBuZXR3b3JrIGtlZXAgd29ya2luZyB3aXRob3V0IGFuIGFjY291bnQuXG4gICAgICA8L3YtY2FyZC1zdWJ0aXRsZT5cblxuICAgICAgPHYtY2FyZC10ZXh0IHYtaWY9XCIhc2Vzc2lvbkFsbG93ZWRcIj5cbiAgICAgICAgPG9wZW4taW4tbXVvbi1jb250cm9sIDpyb3V0ZT1cIiRyb3V0ZSA/ICRyb3V0ZS5mdWxsUGF0aCA6ICcvJ1wiIC8+XG4gICAgICA8L3YtY2FyZC10ZXh0PlxuXG4gICAgICA8di1jYXJkLXRleHQgdi1lbHNlLWlmPVwicmVkaXJlY3RpbmdcIj5cbiAgICAgICAgVGFraW5nIHlvdSB0byB0aGUgTXVvbjNEIHNpZ24taW7igKZcbiAgICAgIDwvdi1jYXJkLXRleHQ+XG5cbiAgICAgIDx2LWNhcmQtdGV4dCB2LWVsc2U+XG4gICAgICAgIDx2LWZvcm1cbiAgICAgICAgICByZWY9XCJmb3JtXCJcbiAgICAgICAgICBAc3VibWl0LnByZXZlbnQ9XCJzdWJtaXRcIlxuICAgICAgICA+XG4gICAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgICAgdi1pZj1cIm1mYVRva2VuXCJcbiAgICAgICAgICAgIHYtbW9kZWw9XCJjb2RlXCJcbiAgICAgICAgICAgIGxhYmVsPVwiQ29kZVwiXG4gICAgICAgICAgICBpbnB1dG1vZGU9XCJudW1lcmljXCJcbiAgICAgICAgICAgIGF1dG9jb21wbGV0ZT1cIm9uZS10aW1lLWNvZGVcIlxuICAgICAgICAgICAgaGludD1cIlNpeCBkaWdpdHMgZnJvbSB5b3VyIGF1dGhlbnRpY2F0b3IgYXBwLCBvciBhIHJlY292ZXJ5IGNvZGUuXCJcbiAgICAgICAgICAgIHBlcnNpc3RlbnQtaGludFxuICAgICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICBhdXRvZm9jdXNcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic2lnbi1pbi1jb2RlXCJcbiAgICAgICAgICAgIGNsYXNzPVwibWItM1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgICB2LWlmPVwiIW1mYVRva2VuICYmIG1vZGUgPT09ICdzaWduLXVwJ1wiXG4gICAgICAgICAgICB2LW1vZGVsPVwibmFtZVwiXG4gICAgICAgICAgICBsYWJlbD1cIk5hbWVcIlxuICAgICAgICAgICAgYXV0b2NvbXBsZXRlPVwibmFtZVwiXG4gICAgICAgICAgICBhdXRvZm9jdXNcbiAgICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgICBkZW5zZVxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgICAgdi1pZj1cIiFtZmFUb2tlbiAmJiBtb2RlID09PSAnc2lnbi11cCdcIlxuICAgICAgICAgICAgdi1tb2RlbD1cImFnZVwiXG4gICAgICAgICAgICBsYWJlbD1cIllvdXIgYWdlXCJcbiAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgIGlucHV0bW9kZT1cIm51bWVyaWNcIlxuICAgICAgICAgICAgaGludD1cIlByaXZhdGUuIENvbmZpcm0gb25jZTsgYWNjb3VudHMgcmVxdWlyZSBhZ2UgMTMgb3Igb3Zlci5cIlxuICAgICAgICAgICAgcGVyc2lzdGVudC1oaW50XG4gICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic2lnbi11cC1hZ2VcIlxuICAgICAgICAgICAgOmFyaWEtZGVzY3JpYmVkYnk9XCJhZ2VFcnJvciA/ICdkaWFsb2ctc2lnbi11cC1hZ2UtZXJyb3InIDogdW5kZWZpbmVkXCJcbiAgICAgICAgICAgIDphcmlhLWludmFsaWQ9XCJhZ2VFcnJvciA/ICd0cnVlJyA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8cFxuICAgICAgICAgICAgdi1pZj1cImFnZUVycm9yXCJcbiAgICAgICAgICAgIGlkPVwiZGlhbG9nLXNpZ24tdXAtYWdlLWVycm9yXCJcbiAgICAgICAgICAgIGNsYXNzPVwiZXJyb3ItLXRleHQgdGV4dC1jYXB0aW9uXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic2lnbi11cC1hZ2UtZXJyb3JcIlxuICAgICAgICAgICAgcm9sZT1cImFsZXJ0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyBhZ2VFcnJvciB9fVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgICB2LWlmPVwiIW1mYVRva2VuXCJcbiAgICAgICAgICAgIHYtbW9kZWw9XCJlbWFpbFwiXG4gICAgICAgICAgICBsYWJlbD1cIkVtYWlsXCJcbiAgICAgICAgICAgIHR5cGU9XCJlbWFpbFwiXG4gICAgICAgICAgICBhdXRvY29tcGxldGU9XCJlbWFpbFwiXG4gICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgIDphdXRvZm9jdXM9XCJtb2RlID09PSAnc2lnbi1pbidcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgICAgdi1pZj1cIiFtZmFUb2tlblwiXG4gICAgICAgICAgICB2LW1vZGVsPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgbGFiZWw9XCJQYXNzd29yZFwiXG4gICAgICAgICAgICA6dHlwZT1cInNob3dQYXNzd29yZCA/ICd0ZXh0JyA6ICdwYXNzd29yZCdcIlxuICAgICAgICAgICAgOmF1dG9jb21wbGV0ZT1cIm1vZGUgPT09ICdzaWduLWluJyA/ICdjdXJyZW50LXBhc3N3b3JkJyA6ICduZXctcGFzc3dvcmQnXCJcbiAgICAgICAgICAgIDpoaW50PVwibW9kZSA9PT0gJ3NpZ24tdXAnID8gJ0F0IGxlYXN0IDggY2hhcmFjdGVycycgOiAnJ1wiXG4gICAgICAgICAgICA6YXBwZW5kLWljb249XCJzaG93UGFzc3dvcmQgPyBpY29ucy5leWVPZmYgOiBpY29ucy5leWVcIlxuICAgICAgICAgICAgb3V0bGluZWRcbiAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICBAY2xpY2s6YXBwZW5kPVwic2hvd1Bhc3N3b3JkID0gIXNob3dQYXNzd29yZFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8di1hbGVydFxuICAgICAgICAgICAgdi1pZj1cImVycm9yXCJcbiAgICAgICAgICAgIHR5cGU9XCJlcnJvclwiXG4gICAgICAgICAgICBkZW5zZVxuICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgY2xhc3M9XCJtYi0zXCJcbiAgICAgICAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgICAgICAgICBhcmlhLWxpdmU9XCJhc3NlcnRpdmVcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGVycm9yIH19XG4gICAgICAgICAgPC92LWFsZXJ0PlxuICAgICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgICAgICBibG9ja1xuICAgICAgICAgICAgOmxvYWRpbmc9XCJidXN5XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7eyBtZmFUb2tlbiA/ICdDb250aW51ZScgOiBtb2RlID09PSAnc2lnbi1pbicgPyAnU2lnbiBpbicgOiAnQ3JlYXRlIGFjY291bnQnIH19XG4gICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8L3YtZm9ybT5cbiAgICAgIDwvdi1jYXJkLXRleHQ+XG5cbiAgICAgIDx2LWNhcmQtYWN0aW9uc1xuICAgICAgICB2LWlmPVwic2Vzc2lvbkFsbG93ZWQgJiYgbWZhVG9rZW5cIlxuICAgICAgICBjbGFzcz1cImp1c3RpZnktY2VudGVyIHBiLTRcIlxuICAgICAgPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgc21hbGxcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2lnbi1pbi1jb2RlLWJhY2tcIlxuICAgICAgICAgIEBjbGljaz1cIm1mYVRva2VuID0gJyc7IGNvZGUgPSAnJzsgZXJyb3IgPSBudWxsXCJcbiAgICAgICAgPlxuICAgICAgICAgIFN0YXJ0IGFnYWluXG4gICAgICAgIDwvdi1idG4+XG4gICAgICA8L3YtY2FyZC1hY3Rpb25zPlxuXG4gICAgICA8di1jYXJkLWFjdGlvbnNcbiAgICAgICAgdi1lbHNlLWlmPVwic2Vzc2lvbkFsbG93ZWQgJiYgIXJlZGlyZWN0aW5nXCJcbiAgICAgICAgY2xhc3M9XCJqdXN0aWZ5LWNlbnRlciBwYi00XCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWJvZHktMiB0ZXh0LS1zZWNvbmRhcnlcIj5cbiAgICAgICAgICB7eyBtb2RlID09PSAnc2lnbi1pbicgPyAnTmV3IHRvIE11b24zRD8nIDogJ0FscmVhZHkgaGF2ZSBhbiBhY2NvdW50PycgfX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgc21hbGxcbiAgICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICAgIEBjbGljaz1cIm1vZGUgPSBtb2RlID09PSAnc2lnbi1pbicgPyAnc2lnbi11cCcgOiAnc2lnbi1pbic7IGVycm9yID0gbnVsbFwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBtb2RlID09PSAnc2lnbi1pbicgPyAnQ3JlYXRlIGFuIGFjY291bnQnIDogJ1NpZ24gaW4nIH19XG4gICAgICAgIDwvdi1idG4+XG4gICAgICA8L3YtY2FyZC1hY3Rpb25zPlxuICAgIDwvdi1jYXJkPlxuICA8L3YtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVk1vZGVsLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgc2lnbkluLCBzaWduSW5XaXRoQ29kZSwgc2lnblVwIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgY2VudHJhbExvZ2luRW5hYmxlZCwgc3RhcnRDZW50cmFsU2lnbkluIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2NlbnRyYWxMb2dpbidcbmltcG9ydCB7IGNsb3VkU2Vzc2lvbkFsbG93ZWQgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvYXBpJ1xuaW1wb3J0IE9wZW5Jbk11b25Db250cm9sIGZyb20gJy4vT3BlbkluTXVvbkNvbnRyb2wudnVlJ1xuXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBPcGVuSW5NdW9uQ29udHJvbCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDbG91ZEFjY291bnREaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogQm9vbGVhbiB9KVxuICAgIG9wZW4/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdzaWduLWluJyB9KVxuICByZWFkb25seSBpbml0aWFsTW9kZSE6ICdzaWduLWluJyB8ICdzaWduLXVwJ1xuXG4gIG1vZGU6ICdzaWduLWluJyB8ICdzaWduLXVwJyA9ICdzaWduLWluJ1xuICBhZ2UgPSAnJ1xuICBuYW1lID0gJydcbiAgZW1haWwgPSAnJ1xuICBwYXNzd29yZCA9ICcnXG4gIC8qKiBTZXQgb25jZSB0aGUgcGFzc3dvcmQgd2FzIHJpZ2h0IGFuZCB0aGUgYWNjb3VudCB3YW50cyBpdHMgYXV0aGVudGljYXRvciBjb2RlLiAqL1xuICBtZmFUb2tlbiA9ICcnXG4gIGNvZGUgPSAnJ1xuICBzaG93UGFzc3dvcmQgPSBmYWxzZVxuICBidXN5ID0gZmFsc2VcbiAgZXJyb3I6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIGFnZUVycm9yID0gJydcbiAgaWNvbnMgPSB7IGV5ZTogJyRleWUnLCBleWVPZmY6ICckZXllT2ZmJyB9XG5cbiAgcmVkaXJlY3RpbmcgPSBmYWxzZVxuXG4gIC8qKiBGYWxzZSBvbiB0aGUgcHJpbnRlcidzIHBsYWluLUhUVFAgYWRkcmVzczogbm8gZm9ybSwgb25lIGxpbmsgdG8gdGhlIGNvbnNvbGUgKEtBTi0yMTkyKS4gKi9cbiAgc2Vzc2lvbkFsbG93ZWQgPSBjbG91ZFNlc3Npb25BbGxvd2VkKClcblxuICBjcmVhdGVkICgpIHtcbiAgICB0aGlzLm1vZGUgPSB0aGlzLmluaXRpYWxNb2RlXG4gICAgLy8gU2VydmVkIGJ5IHRoZSBjb25zb2xlLCBzaWduLWluIGdvZXMgdGhyb3VnaCBpdHMgL2F1dGhvcml6ZSAoV0VCLTEyKTpcbiAgICAvLyBvbmUgc2lnbi1pbiBmb3IgZXZlcnkgTXVvbjNEIHBhZ2UsIGtlcHQgYnkgdGhlIGNvbnNvbGUncyBicm93c2VyXG4gICAgLy8gc2Vzc2lvbiByYXRoZXIgdGhhbiBieSB0aGlzIHBhZ2UuXG4gICAgaWYgKGNlbnRyYWxMb2dpbkVuYWJsZWQoKSkge1xuICAgICAgdGhpcy5yZWRpcmVjdGluZyA9IHRydWVcbiAgICAgIHN0YXJ0Q2VudHJhbFNpZ25Jbih7IHNpbGVudDogZmFsc2UgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMucmVkaXJlY3RpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLmVycm9yID0gKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdCAoKSB7XG4gICAgdGhpcy5lcnJvciA9IG51bGxcbiAgICB0aGlzLmFnZUVycm9yID0gJydcbiAgICBpZiAodGhpcy5tb2RlID09PSAnc2lnbi11cCcpIHtcbiAgICAgIHRoaXMuYWdlRXJyb3IgPSB2YWxpZGF0ZUFnZSh0aGlzLmFnZSlcbiAgICAgIGlmICh0aGlzLmFnZUVycm9yKSByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5idXN5ID0gdHJ1ZVxuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5tZmFUb2tlbikge1xuICAgICAgICBhd2FpdCBzaWduSW5XaXRoQ29kZSh0aGlzLm1mYVRva2VuLCB0aGlzLmNvZGUpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gJ3NpZ24taW4nKSB7XG4gICAgICAgIGNvbnN0IG1mYSA9IGF3YWl0IHNpZ25Jbih0aGlzLmVtYWlsLCB0aGlzLnBhc3N3b3JkKVxuICAgICAgICBpZiAobWZhKSB7XG4gICAgICAgICAgLy8gVGhlIHBhc3N3b3JkIHdhcyByaWdodDsgdGhlIGNvZGUgZmluaXNoZXMgaXQuXG4gICAgICAgICAgdGhpcy5wYXNzd29yZCA9ICcnXG4gICAgICAgICAgdGhpcy5tZmFUb2tlbiA9IG1mYVxuICAgICAgICAgIHRoaXMuY29kZSA9ICcnXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHNpZ25VcCh0aGlzLmVtYWlsLCB0aGlzLnBhc3N3b3JkLCB0aGlzLm5hbWUsIE51bWJlcih0aGlzLmFnZSkpXG4gICAgICB9XG4gICAgICB0aGlzLnBhc3N3b3JkID0gJydcbiAgICAgIHRoaXMuY29kZSA9ICcnXG4gICAgICB0aGlzLm1mYVRva2VuID0gJydcbiAgICAgIHRoaXMuJGVtaXQoJ3NpZ25lZC1pbicpXG4gICAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLmVycm9yID0gKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlXG4gICAgICAvLyBBIHdyb25nIGNvZGUgaXMgdGhlIGNvbnNvbGUncyA0MDEgYXMgaXMgYW4gZXhwaXJlZCBzaWduLWluOiB0aGUgYm94XG4gICAgICAvLyBzdGF5cyBlaXRoZXIgd2F5LCBhbmQgXCJTdGFydCBhZ2FpblwiIGlzIHRoZXJlIGZvciB0aGUgZXhwaXJlZCBvbmUuXG4gICAgICBpZiAodGhpcy5tZmFUb2tlbikgdGhpcy5jb2RlID0gJydcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5idXN5ID0gZmFsc2VcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVBZ2UgKGFnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCEvXlxcZCskLy50ZXN0KGFnZSkpIHJldHVybiAnRW50ZXIgeW91ciBhZ2UgYXMgYSB3aG9sZSBudW1iZXIuJ1xuICByZXR1cm4gTnVtYmVyKGFnZSkgPj0gMTMgJiYgTnVtYmVyKGFnZSkgPD0gMTIwID8gJycgOiAnQWdlIG11c3QgYmUgYmV0d2VlbiAxMyBhbmQgMTIwLidcbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9DbG91ZEFjY291bnREaWFsb2cudnVlIn0=