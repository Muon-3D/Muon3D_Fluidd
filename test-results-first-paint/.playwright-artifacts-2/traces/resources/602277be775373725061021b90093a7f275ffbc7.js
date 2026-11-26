/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Toast.vue";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import M3Toast from "/src/components/ui/M3Toast.vue";
let FileSystemDownloadDialog = class extends Mixins(StateMixin) {
  open = false;
  created() {
    this.open = !!this.currentDownload;
  }
  onCurrentDownloadChange(val) {
    this.open = !!val;
  }
  get currentDownload() {
    return this.$store.state.files.download;
  }
  get name() {
    const path = this.currentDownload?.filepath ?? "";
    return path.split("/").pop() || path;
  }
  handleCancelDownload() {
    this.currentDownload?.abortController.abort();
  }
};
__decorateClass([
  Watch("currentDownload")
], FileSystemDownloadDialog.prototype, "onCurrentDownloadChange", 1);
FileSystemDownloadDialog = __decorateClass([
  Component({ components: { M3Toast } })
], FileSystemDownloadDialog);
const _sfc_main = FileSystemDownloadDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "position": "bottom", "closable": false, "data-tid": "download-progress" }, scopedSlots: _vm._u([{ key: "action", fn: function() {
    return [_c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "download-cancel" }, on: { "click": _vm.handleCancelDownload } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")])];
  }, proxy: true }]) }, [_vm.currentDownload ? _c("div", { staticClass: "dl" }, [_c("span", { staticClass: "dl__title" }, [_vm._v("Downloading " + _vm._s(_vm.name))]), _c("div", { staticClass: "dl__bar" }, [_c("span", { style: { width: `${_vm.currentDownload.percent}%` } })]), _c("span", { staticClass: "dl__facts" }, [_vm._v(" " + _vm._s(_vm.currentDownload.percent) + "% \xB7 " + _vm._s(_vm.$filters.getReadableFileSizeString(_vm.currentDownload.loaded)) + " of " + _vm._s(_vm.$filters.getReadableFileSizeString(_vm.currentDownload.size)) + " \xB7 " + _vm._s(_vm.$filters.getReadableDataRateString(_vm.currentDownload.speed)) + " ")])]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/filesystem/FileSystemDownloadDialog.vue?vue&type=style&index=0&scoped=fe71da3d&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "fe71da3d",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/filesystem/FileSystemDownloadDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpQ0E7QUFDQTtBQUVBO0FBSUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBaEJBO0FBQUEsRUFEQTtBQUFBLEdBUEEseUJBUUE7QUFSQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJGaWxlU3lzdGVtRG93bmxvYWREaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPG0zLXRvYXN0XG4gICAgOnZhbHVlPVwib3BlblwiXG4gICAgcG9zaXRpb249XCJib3R0b21cIlxuICAgIDpjbG9zYWJsZT1cImZhbHNlXCJcbiAgICBkYXRhLXRpZD1cImRvd25sb2FkLXByb2dyZXNzXCJcbiAgPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJjdXJyZW50RG93bmxvYWRcIlxuICAgICAgY2xhc3M9XCJkbFwiXG4gICAgPlxuICAgICAgPHNwYW4gY2xhc3M9XCJkbF9fdGl0bGVcIj5Eb3dubG9hZGluZyB7eyBuYW1lIH19PC9zcGFuPlxuICAgICAgPGRpdiBjbGFzcz1cImRsX19iYXJcIj5cbiAgICAgICAgPHNwYW4gOnN0eWxlPVwieyB3aWR0aDogYCR7Y3VycmVudERvd25sb2FkLnBlcmNlbnR9JWAgfVwiIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiZGxfX2ZhY3RzXCI+XG4gICAgICAgIHt7IGN1cnJlbnREb3dubG9hZC5wZXJjZW50IH19JSDCtyB7eyAkZmlsdGVycy5nZXRSZWFkYWJsZUZpbGVTaXplU3RyaW5nKGN1cnJlbnREb3dubG9hZC5sb2FkZWQpIH19IG9mIHt7ICRmaWx0ZXJzLmdldFJlYWRhYmxlRmlsZVNpemVTdHJpbmcoY3VycmVudERvd25sb2FkLnNpemUpIH19IMK3IHt7ICRmaWx0ZXJzLmdldFJlYWRhYmxlRGF0YVJhdGVTdHJpbmcoY3VycmVudERvd25sb2FkLnNwZWVkKSB9fVxuICAgICAgPC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgZGF0YS10aWQ9XCJkb3dubG9hZC1jYW5jZWxcIlxuICAgICAgICBAY2xpY2s9XCJoYW5kbGVDYW5jZWxEb3dubG9hZFwiXG4gICAgICA+XG4gICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4uY2FuY2VsJykgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvbTMtdG9hc3Q+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBGaWxlRG93bmxvYWQgfSBmcm9tICdAL3N0b3JlL2ZpbGVzL3R5cGVzJ1xuaW1wb3J0IE0zVG9hc3QgZnJvbSAnQC9jb21wb25lbnRzL3VpL00zVG9hc3QudnVlJ1xuXG4vKiogQSBmaWxlIGNvbWluZyBkb3duIGZyb20gdGhlIHByaW50ZXI6IGhvdyBmYXIsIGhvdyBmYXN0LCBhbmQgQ2FuY2VsLiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTTNUb2FzdCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlU3lzdGVtRG93bmxvYWREaWFsb2cgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBvcGVuID0gZmFsc2VcblxuICBjcmVhdGVkICgpIHtcbiAgICB0aGlzLm9wZW4gPSAhIXRoaXMuY3VycmVudERvd25sb2FkXG4gIH1cblxuICBAV2F0Y2goJ2N1cnJlbnREb3dubG9hZCcpXG4gIG9uQ3VycmVudERvd25sb2FkQ2hhbmdlICh2YWw6IEZpbGVEb3dubG9hZCB8IG51bGwpIHtcbiAgICB0aGlzLm9wZW4gPSAhIXZhbFxuICB9XG5cbiAgZ2V0IGN1cnJlbnREb3dubG9hZCAoKTogRmlsZURvd25sb2FkIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmZpbGVzLmRvd25sb2FkXG4gIH1cblxuICBnZXQgbmFtZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5jdXJyZW50RG93bmxvYWQ/LmZpbGVwYXRoID8/ICcnXG4gICAgcmV0dXJuIHBhdGguc3BsaXQoJy8nKS5wb3AoKSB8fCBwYXRoXG4gIH1cblxuICBoYW5kbGVDYW5jZWxEb3dubG9hZCAoKSB7XG4gICAgdGhpcy5jdXJyZW50RG93bmxvYWQ/LmFib3J0Q29udHJvbGxlci5hYm9ydCgpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5kbCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogNnB4O1xuICAgIHdpZHRoOiBtaW4oMzIwcHgsIDYwdncpO1xuICB9XG5cbiAgLmRsX190aXRsZSB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAuZGxfX2JhciB7XG4gICAgaGVpZ2h0OiA0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG5cbiAgICBzcGFuIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgICAgdHJhbnNpdGlvbjogd2lkdGggdmFyKC0tbTNkLWR1cmF0aW9uLWJhc2UpIGxpbmVhcjtcbiAgICB9XG4gIH1cblxuICAuZGxfX2ZhY3RzIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9maWxlc3lzdGVtL0ZpbGVTeXN0ZW1Eb3dubG9hZERpYWxvZy52dWUifQ==