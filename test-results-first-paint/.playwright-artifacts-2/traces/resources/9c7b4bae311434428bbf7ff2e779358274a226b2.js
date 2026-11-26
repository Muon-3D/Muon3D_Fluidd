/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/AppBtn.vue";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { controlUrl } from "/src/services/muon-cloud/api.ts";
let OpenInMuonControl = class extends Vue {
  route;
  get url() {
    return controlUrl(this.route);
  }
};
__decorateClass([
  Prop({ type: String, default: "/" })
], OpenInMuonControl.prototype, "route", 2);
OpenInMuonControl = __decorateClass([
  Component({})
], OpenInMuonControl);
const _sfc_main = OpenInMuonControl;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "open-in-control", attrs: { "data-tid": "open-in-control" } }, [_c("p", { staticClass: "open-in-control__line" }, [_vm._v(" Your Muon3D account is used at Muon Control, not on this page. This page is the printer's own address on your network, and it is not encrypted. ")]), _c("p", { staticClass: "open-in-control__line text--secondary" }, [_vm._v(" Everything on this printer keeps working here without an account. ")]), _c(__unplugin_components_0, { attrs: { "color": "primary", "block": "", "href": _vm.url, "target": "_blank", "rel": "noopener", "data-tid": "open-in-control-button" } }, [_vm._v(" Open in Muon Control ")])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/OpenInMuonControl.vue?vue&type=style&index=0&scoped=f1c4d074&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f1c4d074",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/OpenInMuonControl.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF5QkE7QUFDQTtBQVFBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQUxBO0FBQUEsRUFEQTtBQUFBLEdBRkEsa0JBR0E7QUFIQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJPcGVuSW5NdW9uQ29udHJvbC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJvcGVuLWluLWNvbnRyb2xcIlxuICAgIGRhdGEtdGlkPVwib3Blbi1pbi1jb250cm9sXCJcbiAgPlxuICAgIDxwIGNsYXNzPVwib3Blbi1pbi1jb250cm9sX19saW5lXCI+XG4gICAgICBZb3VyIE11b24zRCBhY2NvdW50IGlzIHVzZWQgYXQgTXVvbiBDb250cm9sLCBub3Qgb24gdGhpcyBwYWdlLiBUaGlzIHBhZ2UgaXMgdGhlIHByaW50ZXIncyBvd24gYWRkcmVzcyBvbiB5b3VyIG5ldHdvcmssIGFuZCBpdCBpcyBub3QgZW5jcnlwdGVkLlxuICAgIDwvcD5cbiAgICA8cCBjbGFzcz1cIm9wZW4taW4tY29udHJvbF9fbGluZSB0ZXh0LS1zZWNvbmRhcnlcIj5cbiAgICAgIEV2ZXJ5dGhpbmcgb24gdGhpcyBwcmludGVyIGtlZXBzIHdvcmtpbmcgaGVyZSB3aXRob3V0IGFuIGFjY291bnQuXG4gICAgPC9wPlxuICAgIDxhcHAtYnRuXG4gICAgICBjb2xvcj1cInByaW1hcnlcIlxuICAgICAgYmxvY2tcbiAgICAgIDpocmVmPVwidXJsXCJcbiAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICByZWw9XCJub29wZW5lclwiXG4gICAgICBkYXRhLXRpZD1cIm9wZW4taW4tY29udHJvbC1idXR0b25cIlxuICAgID5cbiAgICAgIE9wZW4gaW4gTXVvbiBDb250cm9sXG4gICAgPC9hcHAtYnRuPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBjb250cm9sVXJsIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FwaSdcblxuLyoqXG4gKiBXaGF0IGEgcGxhaW4tSFRUUCBwcmludGVyIHBhZ2Ugc2hvd3Mgd2hlcmUgYW4gYWNjb3VudCBmZWF0dXJlIHdvdWxkIGJlXG4gKiAoS0FOLTIxOTIpOiBvbmUgZXhwbGFuYXRpb24gYW5kIG9uZSBsaW5rIHRvIHRoZSBzYW1lIHBhZ2Ugb24gdGhlIGNvbnNvbGUuXG4gKiBUaGUgcGFnZSB0YWtlcyBubyBwYXNzd29yZCBhbmQgaG9sZHMgbm8gYWNjb3VudCBzZWNyZXQuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcGVuSW5NdW9uQ29udHJvbCBleHRlbmRzIFZ1ZSB7XG4gIC8qKiBUaGUgaGFzaCByb3V0ZSB0byBvcGVuIG9uIHRoZSBjb25zb2xlLCBzdWNoIGFzIGAvYWNjb3VudGAuICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnLycgfSlcbiAgcmVhZG9ubHkgcm91dGUhOiBzdHJpbmdcblxuICBnZXQgdXJsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBjb250cm9sVXJsKHRoaXMucm91dGUpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4ub3Blbi1pbi1jb250cm9sX19saW5lIHtcbiAgbWFyZ2luLWJvdHRvbTogMTJweDtcbn1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tdW9uLWNsb3VkL09wZW5Jbk11b25Db250cm9sLnZ1ZSJ9