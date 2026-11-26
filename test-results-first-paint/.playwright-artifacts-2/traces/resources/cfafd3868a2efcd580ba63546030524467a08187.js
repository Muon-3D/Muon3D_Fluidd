/* unplugin-vue-components disabled */import __unplugin_components_6 from "/src/components/ui/AppQrCode.vue";
import { VLayout as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { printerNameParts } from "/src/util/printer-name.ts";
let ApiKeyDialog = class extends Vue {
  open;
  get apiKey() {
    return this.$store.getters["auth/getApiKey"];
  }
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"] || "").name || "this printer";
  }
  /**
   * A new key stops the old one at once, so every tool using it must be given
   * the new one: asked first, naming the printer (R8). A switch to another
   * printer while it asks cancels it.
   */
  async handleRefreshApiKey() {
    const apiUrl = this.$store.state.config.apiUrl;
    const name = this.printerName;
    const sure = await this.$confirm(`Every tool using ${name}'s current key stops working until you give it the new one.`, {
      title: `Make a new API key for ${name}?`,
      buttonTrueText: "Make a new key",
      danger: true
    });
    if (sure && this.$store.state.config.apiUrl === apiUrl) this.$store.dispatch("auth/refreshApiKey");
  }
};
__decorateClass([
  VModel({ type: Boolean })
], ApiKeyDialog.prototype, "open", 2);
ApiKeyDialog = __decorateClass([
  Component({})
], ApiKeyDialog);
const _sfc_main = ApiKeyDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "title": _vm.$t("app.general.label.api_key"), "max-width": "500" }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c(__unplugin_components_1), _c(__unplugin_components_2, { attrs: { "color": "primary", "text": "", "type": "button", "data-tid": "api-key-new" }, on: { "click": _vm.handleRefreshApiKey } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.refresh")) + " ")])];
  }, proxy: true }]), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_3, [_c(__unplugin_components_4, { attrs: { "value": _vm.apiKey, "filled": "", "dense": "", "single-line": "", "hide-details": "", "readonly": "" } }), _c(__unplugin_components_5, { staticClass: "pt-4", attrs: { "align-center": "", "column": "" } }, [_c(__unplugin_components_6, { attrs: { "value": _vm.apiKey, "centered": "" } })], 1)], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/auth/ApiKeyDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2Q0E7QUFDQTtBQUdBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUF6QkE7QUFBQSxFQURBO0FBQUEsR0FEQSxhQUVBO0FBRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBpS2V5RGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxhcHAtZGlhbG9nXG4gICAgdi1tb2RlbD1cIm9wZW5cIlxuICAgIDp0aXRsZT1cIiR0KCdhcHAuZ2VuZXJhbC5sYWJlbC5hcGlfa2V5JylcIlxuICAgIG1heC13aWR0aD1cIjUwMFwiXG4gID5cbiAgICA8di1jYXJkLXRleHQ+XG4gICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgIDp2YWx1ZT1cImFwaUtleVwiXG4gICAgICAgIGZpbGxlZFxuICAgICAgICBkZW5zZVxuICAgICAgICBzaW5nbGUtbGluZVxuICAgICAgICBoaWRlLWRldGFpbHNcbiAgICAgICAgcmVhZG9ubHlcbiAgICAgIC8+XG5cbiAgICAgIDx2LWxheW91dFxuICAgICAgICBhbGlnbi1jZW50ZXJcbiAgICAgICAgY29sdW1uXG4gICAgICAgIGNsYXNzPVwicHQtNFwiXG4gICAgICA+XG4gICAgICAgIDxhcHAtcXItY29kZVxuICAgICAgICAgIDp2YWx1ZT1cImFwaUtleVwiXG4gICAgICAgICAgY2VudGVyZWRcbiAgICAgICAgLz5cbiAgICAgIDwvdi1sYXlvdXQ+XG4gICAgPC92LWNhcmQtdGV4dD5cblxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgIDx2LXNwYWNlciAvPlxuXG4gICAgICA8YXBwLWJ0blxuICAgICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgICB0ZXh0XG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBkYXRhLXRpZD1cImFwaS1rZXktbmV3XCJcbiAgICAgICAgQGNsaWNrPVwiaGFuZGxlUmVmcmVzaEFwaUtleVwiXG4gICAgICA+XG4gICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4ucmVmcmVzaCcpIH19XG4gICAgICA8L2FwcC1idG4+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9hcHAtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlLCBWTW9kZWwgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgcHJpbnRlck5hbWVQYXJ0cyB9IGZyb20gJ0AvdXRpbC9wcmludGVyLW5hbWUnXG5cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcGlLZXlEaWFsb2cgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogQm9vbGVhbiB9KVxuICAgIG9wZW4/OiBib29sZWFuXG5cbiAgZ2V0IGFwaUtleSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ2F1dGgvZ2V0QXBpS2V5J11cbiAgfVxuXG4gIGdldCBwcmludGVyTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJpbnRlck5hbWVQYXJ0cygodGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKSB8fCAnJykubmFtZSB8fCAndGhpcyBwcmludGVyJ1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbmV3IGtleSBzdG9wcyB0aGUgb2xkIG9uZSBhdCBvbmNlLCBzbyBldmVyeSB0b29sIHVzaW5nIGl0IG11c3QgYmUgZ2l2ZW5cbiAgICogdGhlIG5ldyBvbmU6IGFza2VkIGZpcnN0LCBuYW1pbmcgdGhlIHByaW50ZXIgKFI4KS4gQSBzd2l0Y2ggdG8gYW5vdGhlclxuICAgKiBwcmludGVyIHdoaWxlIGl0IGFza3MgY2FuY2VscyBpdC5cbiAgICovXG4gIGFzeW5jIGhhbmRsZVJlZnJlc2hBcGlLZXkgKCkge1xuICAgIGNvbnN0IGFwaVVybCA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmxcbiAgICBjb25zdCBuYW1lID0gdGhpcy5wcmludGVyTmFtZVxuICAgIGNvbnN0IHN1cmUgPSBhd2FpdCB0aGlzLiRjb25maXJtKGBFdmVyeSB0b29sIHVzaW5nICR7bmFtZX0ncyBjdXJyZW50IGtleSBzdG9wcyB3b3JraW5nIHVudGlsIHlvdSBnaXZlIGl0IHRoZSBuZXcgb25lLmAsIHtcbiAgICAgIHRpdGxlOiBgTWFrZSBhIG5ldyBBUEkga2V5IGZvciAke25hbWV9P2AsXG4gICAgICBidXR0b25UcnVlVGV4dDogJ01ha2UgYSBuZXcga2V5JyxcbiAgICAgIGRhbmdlcjogdHJ1ZVxuICAgIH0pXG4gICAgaWYgKHN1cmUgJiYgdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybCA9PT0gYXBpVXJsKSB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnYXV0aC9yZWZyZXNoQXBpS2V5JylcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9hdXRoL0FwaUtleURpYWxvZy52dWUifQ==