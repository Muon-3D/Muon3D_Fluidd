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
import { updateWatch } from "/src/services/updates/watch.ts";
import { verifyStale, versionLabel } from "/src/services/updates/model.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
let UpdateBanner = class extends Vue {
  get percent() {
    const p = updateWatch.remembered?.phase === "installing" ? updateWatch.remembered.progress : null;
    return typeof p === "number" ? Math.round(Math.max(0, Math.min(100, p))) : null;
  }
  get stale() {
    return verifyStale(updateWatch.remembered, updateWatch.now);
  }
  get text() {
    const r = updateWatch.remembered;
    if (this.stale) return "Couldn't confirm the update";
    const to = r?.to ? ` (${versionLabel(r.to).text.split(" \xB7 ")[0]})` : "";
    if (r?.phase === "verifying") return "Verifying update";
    if (r?.phase === "rebooting") return "Restarting";
    return `Installing update${to}${this.percent !== null ? `: ${this.percent}%` : ""}`;
  }
  get to() {
    return scopedPath("/updating", activeSlug());
  }
};
UpdateBanner = __decorateClass([
  Component({})
], UpdateBanner);
const _sfc_main = UpdateBanner;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("router-link", { staticClass: "upbar", attrs: { "to": _vm.to, "data-tid": "update-banner" } }, [_c("span", { staticClass: "upbar__dot" }), _c("span", { staticClass: "upbar__text" }, [_vm._v(_vm._s(_vm.text))]), _vm.percent !== null ? _c("span", { staticClass: "upbar__bar" }, [_c("i", { style: { width: `${_vm.percent}%` } })]) : _vm._e(), _c("span", { staticClass: "upbar__go" }, [_vm._v(_vm._s(_vm.stale ? "Details" : "See progress"))])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/updates/UpdateBanner.vue?vue&type=style&index=0&scoped=80bcb5b4&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "80bcb5b4",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/updates/UpdateBanner.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFBQSxFQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUF0QkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVXBkYXRlQmFubmVyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxyb3V0ZXItbGlua1xuICAgIDp0bz1cInRvXCJcbiAgICBjbGFzcz1cInVwYmFyXCJcbiAgICBkYXRhLXRpZD1cInVwZGF0ZS1iYW5uZXJcIlxuICA+XG4gICAgPHNwYW4gY2xhc3M9XCJ1cGJhcl9fZG90XCIgLz5cbiAgICA8c3BhbiBjbGFzcz1cInVwYmFyX190ZXh0XCI+e3sgdGV4dCB9fTwvc3Bhbj5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cInBlcmNlbnQgIT09IG51bGxcIlxuICAgICAgY2xhc3M9XCJ1cGJhcl9fYmFyXCJcbiAgICA+PGkgOnN0eWxlPVwieyB3aWR0aDogYCR7cGVyY2VudH0lYCB9XCIgLz48L3NwYW4+XG4gICAgPHNwYW4gY2xhc3M9XCJ1cGJhcl9fZ29cIj57eyBzdGFsZSA/ICdEZXRhaWxzJyA6ICdTZWUgcHJvZ3Jlc3MnIH19PC9zcGFuPlxuICA8L3JvdXRlci1saW5rPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IHVwZGF0ZVdhdGNoIH0gZnJvbSAnQC9zZXJ2aWNlcy91cGRhdGVzL3dhdGNoJ1xuaW1wb3J0IHsgdmVyaWZ5U3RhbGUsIHZlcnNpb25MYWJlbCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9tb2RlbCdcbmltcG9ydCB7IHNjb3BlZFBhdGggfSBmcm9tICdAL3JvdXRlci9wcmludGVyUGFnZVBhdGhzJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcblxuLyoqIE9uIGV2ZXJ5IHBhZ2Ugd2hpbGUgdGhlIHByaW50ZXIgaW5zdGFsbHMgYW4gdXBkYXRlOiBob3cgZmFyIGl0IGlzLCBhbmQgdGhlIHdheSB0byB0aGUgVXBkYXRpbmcgcGFnZS4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVcGRhdGVCYW5uZXIgZXh0ZW5kcyBWdWUge1xuICBnZXQgcGVyY2VudCAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3QgcCA9IHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWQ/LnBoYXNlID09PSAnaW5zdGFsbGluZycgPyB1cGRhdGVXYXRjaC5yZW1lbWJlcmVkLnByb2dyZXNzIDogbnVsbFxuICAgIHJldHVybiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBNYXRoLnJvdW5kKE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgcCkpKSA6IG51bGxcbiAgfVxuXG4gIGdldCBzdGFsZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHZlcmlmeVN0YWxlKHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWQsIHVwZGF0ZVdhdGNoLm5vdylcbiAgfVxuXG4gIGdldCB0ZXh0ICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHIgPSB1cGRhdGVXYXRjaC5yZW1lbWJlcmVkXG4gICAgaWYgKHRoaXMuc3RhbGUpIHJldHVybiBcIkNvdWxkbid0IGNvbmZpcm0gdGhlIHVwZGF0ZVwiXG4gICAgY29uc3QgdG8gPSByPy50byA/IGAgKCR7dmVyc2lvbkxhYmVsKHIudG8pLnRleHQuc3BsaXQoJyDCtyAnKVswXX0pYCA6ICcnXG4gICAgaWYgKHI/LnBoYXNlID09PSAndmVyaWZ5aW5nJykgcmV0dXJuICdWZXJpZnlpbmcgdXBkYXRlJ1xuICAgIGlmIChyPy5waGFzZSA9PT0gJ3JlYm9vdGluZycpIHJldHVybiAnUmVzdGFydGluZydcbiAgICByZXR1cm4gYEluc3RhbGxpbmcgdXBkYXRlJHt0b30ke3RoaXMucGVyY2VudCAhPT0gbnVsbCA/IGA6ICR7dGhpcy5wZXJjZW50fSVgIDogJyd9YFxuICB9XG5cbiAgZ2V0IHRvICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBzY29wZWRQYXRoKCcvdXBkYXRpbmcnLCBhY3RpdmVTbHVnKCkpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC51cGJhciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTJweDtcbiAgICBtYXJnaW46IDAgMCAxNnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCwgcmdiKDEyOCAyMTQgMjA5IC8gMTQlKSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIH1cblxuICAudXBiYXJfX2RvdCB7XG4gICAgZmxleDogbm9uZTtcbiAgICB3aWR0aDogOHB4O1xuICAgIGhlaWdodDogOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBhbmltYXRpb246IHVwYmFyLXB1bHNlIDEuMnMgZWFzZS1pbi1vdXQgaW5maW5pdGU7XG4gIH1cblxuICBAa2V5ZnJhbWVzIHVwYmFyLXB1bHNlIHtcbiAgICA1MCUgeyBvcGFjaXR5OiAwLjM1OyB9XG4gIH1cblxuICAudXBiYXJfX3RleHQge1xuICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIG1pbi13aWR0aDogMDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLnVwYmFyX19iYXIge1xuICAgIGZsZXg6IDAgMCAxNjBweDtcbiAgICBoZWlnaHQ6IDZweDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuXG4gICAgaSB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IGluaGVyaXQ7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICAgIHRyYW5zaXRpb246IHdpZHRoIDAuNnMgdmFyKC0tbTNkLWVhc2UsIGVhc2UpO1xuICAgIH1cbiAgfVxuXG4gIC51cGJhcl9fZ28ge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3VwZGF0ZXMvVXBkYXRlQmFubmVyLnZ1ZSJ9