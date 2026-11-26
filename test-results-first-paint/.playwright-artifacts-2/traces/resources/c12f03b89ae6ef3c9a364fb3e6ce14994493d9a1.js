/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_1 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import {
  asksToStay,
  couldHaveSecureAddress,
  declinedSwitch,
  findSecureOrigin,
  secureUrl,
  setSwitchesAutomatically,
  switchDecision,
  switchesAutomatically
} from "/src/services/secure-origin/index.ts";
let SecureAddressBanner = class extends Vue {
  origin = null;
  dismissed = false;
  gone = false;
  async created() {
    if (!couldHaveSecureAddress()) return;
    if (asksToStay()) {
      setSwitchesAutomatically(false);
      return;
    }
    if (declinedSwitch()) return;
    const started = Date.now();
    const origin = await findSecureOrigin();
    if (!origin || this.gone) return;
    const uploads = this.$store?.state?.files?.uploads ?? [];
    const busy = uploads.some((u) => !u.complete && !u.cancelled);
    if (switchDecision({ auto: switchesAutomatically(), elapsedMs: Date.now() - started, busy }) === "switch") {
      window.location.replace(secureUrl(origin));
      return;
    }
    this.origin = origin;
  }
  beforeDestroy() {
    this.gone = true;
  }
  go() {
    if (!this.origin) return;
    setSwitchesAutomatically(true);
    window.location.assign(secureUrl(this.origin));
  }
  stay() {
    setSwitchesAutomatically(false);
    this.dismissed = true;
  }
};
SecureAddressBanner = __decorateClass([
  Component({})
], SecureAddressBanner);
const _sfc_main = SecureAddressBanner;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.origin && !_vm.dismissed ? _c("div", { staticClass: "secure-address", attrs: { "role": "status", "aria-live": "polite", "data-tid": "secure-address" } }, [_c(__unplugin_components_0, { staticClass: "secure-address__icon", attrs: { "name": "lock" } }), _vm._m(0), _c("span", { staticClass: "secure-address__actions" }, [_c(__unplugin_components_1, { attrs: { "small": "", "color": "primary", "data-tid": "secure-address-switch" }, on: { "click": _vm.go } }, [_vm._v(" Switch ")]), _c(__unplugin_components_2, { attrs: { "small": "", "text": "", "data-tid": "secure-address-stay" }, on: { "click": _vm.stay } }, [_vm._v(" Stay here ")])], 1)], 1) : _vm._e();
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "secure-address__text" }, [_c("strong", [_vm._v("A secure address is available for this printer")]), _c("span", [_vm._v("Same page, encrypted. Your browser shows a lock.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/layout/SecureAddressBanner.vue?vue&type=style&index=0&scoped=eb461419&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "eb461419",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/SecureAddressBanner.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXNDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNBO0FBVUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBeENBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlNlY3VyZUFkZHJlc3NCYW5uZXIudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIHYtaWY9XCJvcmlnaW4gJiYgIWRpc21pc3NlZFwiXG4gICAgY2xhc3M9XCJzZWN1cmUtYWRkcmVzc1wiXG4gICAgcm9sZT1cInN0YXR1c1wiXG4gICAgYXJpYS1saXZlPVwicG9saXRlXCJcbiAgICBkYXRhLXRpZD1cInNlY3VyZS1hZGRyZXNzXCJcbiAgPlxuICAgIDxmcmFtZS1pY29uXG4gICAgICBuYW1lPVwibG9ja1wiXG4gICAgICBjbGFzcz1cInNlY3VyZS1hZGRyZXNzX19pY29uXCJcbiAgICAvPlxuICAgIDxkaXYgY2xhc3M9XCJzZWN1cmUtYWRkcmVzc19fdGV4dFwiPlxuICAgICAgPHN0cm9uZz5BIHNlY3VyZSBhZGRyZXNzIGlzIGF2YWlsYWJsZSBmb3IgdGhpcyBwcmludGVyPC9zdHJvbmc+XG4gICAgICA8c3Bhbj5TYW1lIHBhZ2UsIGVuY3J5cHRlZC4gWW91ciBicm93c2VyIHNob3dzIGEgbG9jay48L3NwYW4+XG4gICAgPC9kaXY+XG4gICAgPHNwYW4gY2xhc3M9XCJzZWN1cmUtYWRkcmVzc19fYWN0aW9uc1wiPlxuICAgICAgPGFwcC1idG5cbiAgICAgICAgc21hbGxcbiAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJzZWN1cmUtYWRkcmVzcy1zd2l0Y2hcIlxuICAgICAgICBAY2xpY2s9XCJnb1wiXG4gICAgICA+XG4gICAgICAgIFN3aXRjaFxuICAgICAgPC9hcHAtYnRuPlxuICAgICAgPGFwcC1idG5cbiAgICAgICAgc21hbGxcbiAgICAgICAgdGV4dFxuICAgICAgICBkYXRhLXRpZD1cInNlY3VyZS1hZGRyZXNzLXN0YXlcIlxuICAgICAgICBAY2xpY2s9XCJzdGF5XCJcbiAgICAgID5cbiAgICAgICAgU3RheSBoZXJlXG4gICAgICA8L2FwcC1idG4+XG4gICAgPC9zcGFuPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQge1xuICBhc2tzVG9TdGF5LFxuICBjb3VsZEhhdmVTZWN1cmVBZGRyZXNzLFxuICBkZWNsaW5lZFN3aXRjaCxcbiAgZmluZFNlY3VyZU9yaWdpbixcbiAgc2VjdXJlVXJsLFxuICBzZXRTd2l0Y2hlc0F1dG9tYXRpY2FsbHksXG4gIHN3aXRjaERlY2lzaW9uLFxuICBzd2l0Y2hlc0F1dG9tYXRpY2FsbHlcbn0gZnJvbSAnQC9zZXJ2aWNlcy9zZWN1cmUtb3JpZ2luJ1xuXG4vKipcbiAqIE9uIHRoZSBwcmludGVyJ3MgcGxhaW4tSFRUUCBwYWdlLCBvbmNlIHRoaXMgYnJvd3NlciBoYXMgcHJvdmVkIHRoYXQgdGhlXG4gKiBwcmludGVyJ3Mgc2VjdXJlIGFkZHJlc3MgYW5zd2VycyAoS0FOLTIxOTgpOiBvbmUgY2FsbSBsaW5lIG9mZmVyaW5nIHRvIG1vdmVcbiAqIHRoZXJlLiBBIGJyb3dzZXIgbW92ZXMgYnkgaXRzZWxmIHVubGVzcyBhIHBlcnNvbiBjaG9zZSBcInN0YXkgaGVyZVwiIChLQU4tNTExMCksIGJ1dCBvbmx5IHdoZW5cbiAqIHRoZSBwcm9vZiBjYW1lIHNvb24gYWZ0ZXIgbG9hZCBhbmQgbm8gdXBsb2FkIGlzIHJ1bm5pbmcsIGFuZCBuZXZlciBvbmNlIGA/c2VjdXJlPW9mZmAgd2FzIHVzZWQuXG4gKiBOb3RoaW5nIHNob3dzLCBhbmQgbm90aGluZyBpcyBhc2tlZCBvZiB0aGUgbmV0d29yaywgb24gYW55IG90aGVyIHBhZ2UuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWN1cmVBZGRyZXNzQmFubmVyIGV4dGVuZHMgVnVlIHtcbiAgb3JpZ2luOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBkaXNtaXNzZWQgPSBmYWxzZVxuICBnb25lID0gZmFsc2VcblxuICBhc3luYyBjcmVhdGVkICgpIHtcbiAgICBpZiAoIWNvdWxkSGF2ZVNlY3VyZUFkZHJlc3MoKSkgcmV0dXJuXG4gICAgaWYgKGFza3NUb1N0YXkoKSkge1xuICAgICAgc2V0U3dpdGNoZXNBdXRvbWF0aWNhbGx5KGZhbHNlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChkZWNsaW5lZFN3aXRjaCgpKSByZXR1cm5cbiAgICBjb25zdCBzdGFydGVkID0gRGF0ZS5ub3coKVxuICAgIGNvbnN0IG9yaWdpbiA9IGF3YWl0IGZpbmRTZWN1cmVPcmlnaW4oKVxuICAgIC8vIFRoZSBhcHAgbWF5IGhhdmUgcmVwbGFjZWQgdGhpcyBiYW5uZXIgd2hpbGUgdGhlIHByb2JlcyByYW4uXG4gICAgaWYgKCFvcmlnaW4gfHwgdGhpcy5nb25lKSByZXR1cm5cbiAgICBjb25zdCB1cGxvYWRzOiB7IGNvbXBsZXRlPzogYm9vbGVhbiwgY2FuY2VsbGVkPzogYm9vbGVhbiB9W10gPSB0aGlzLiRzdG9yZT8uc3RhdGU/LmZpbGVzPy51cGxvYWRzID8/IFtdXG4gICAgY29uc3QgYnVzeSA9IHVwbG9hZHMuc29tZSh1ID0+ICF1LmNvbXBsZXRlICYmICF1LmNhbmNlbGxlZClcbiAgICBpZiAoc3dpdGNoRGVjaXNpb24oeyBhdXRvOiBzd2l0Y2hlc0F1dG9tYXRpY2FsbHkoKSwgZWxhcHNlZE1zOiBEYXRlLm5vdygpIC0gc3RhcnRlZCwgYnVzeSB9KSA9PT0gJ3N3aXRjaCcpIHtcbiAgICAgIC8vIFNhbWUgdGFiLCBhbmQgb25seSBhbiBvcmlnaW4gdGhlIHByb2JlIGp1c3QgcHJvdmVkLlxuICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2Uoc2VjdXJlVXJsKG9yaWdpbikpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW5cbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuZ29uZSA9IHRydWVcbiAgfVxuXG4gIGdvICgpIHtcbiAgICBpZiAoIXRoaXMub3JpZ2luKSByZXR1cm5cbiAgICBzZXRTd2l0Y2hlc0F1dG9tYXRpY2FsbHkodHJ1ZSlcbiAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKHNlY3VyZVVybCh0aGlzLm9yaWdpbikpXG4gIH1cblxuICBzdGF5ICgpIHtcbiAgICBzZXRTd2l0Y2hlc0F1dG9tYXRpY2FsbHkoZmFsc2UpXG4gICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5zZWN1cmUtYWRkcmVzcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtYXJnaW46IDAgMCAxNnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICB9XG5cbiAgLnNlY3VyZS1hZGRyZXNzX19pY29uIHtcbiAgICBmbGV4OiBub25lO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAuc2VjdXJlLWFkZHJlc3NfX3RleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMTtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiAycHggMTBweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIC5zZWN1cmUtYWRkcmVzc19fYWN0aW9ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGdhcDogOHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbGF5b3V0L1NlY3VyZUFkZHJlc3NCYW5uZXIudnVlIn0=