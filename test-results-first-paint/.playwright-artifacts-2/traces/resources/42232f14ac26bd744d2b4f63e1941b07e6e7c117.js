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
let UploadProgress = class extends Vue {
  // When each file's bytes first started moving (not reactive on purpose).
  started = {};
  get uploads() {
    return this.$store.state.files.uploads.filter((file) => !file.cancelled);
  }
  /** "about 3 min left", from the bytes moved so far; nothing until it is a fair guess. */
  remaining(file) {
    if (!file.loaded) return "";
    const start = this.started[file.filepath] ??= { at: Date.now(), loaded: file.loaded };
    const elapsed = (Date.now() - start.at) / 1e3;
    const moved = file.loaded - start.loaded;
    if (elapsed < 5 || moved <= 0) return "";
    const seconds = Math.ceil((file.size - file.loaded) / (moved / elapsed));
    if (seconds < 20) return "";
    return seconds < 90 ? `about ${seconds} s left` : `about ${Math.ceil(seconds / 60)} min left`;
  }
  cancel(file) {
    this.$store.dispatch("files/updateFileUpload", { filepath: file.filepath, cancelled: true });
    file.abortController?.abort();
  }
};
UploadProgress = __decorateClass([
  Component
], UploadProgress);
const _sfc_main = UploadProgress;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.uploads.length ? _c("section", { staticClass: "upload-progress", attrs: { "aria-label": "Uploads", "data-tid": "upload-progress" } }, _vm._l(_vm.uploads, function(file) {
    return _c("div", { key: file.filepath, staticClass: "upload-progress__file" }, [_c("strong", [_vm._v(_vm._s(file.filepath))]), _c("progress", { attrs: { "max": "100", "aria-label": `Uploading ${file.filepath}` }, domProps: { "value": file.percent } }), _c("div", { attrs: { "role": "status" } }, [_vm._v(" " + _vm._s(file.percent) + "% \xB7 " + _vm._s(_vm.$filters.getReadableFileSizeString(file.loaded)) + " / " + _vm._s(_vm.$filters.getReadableFileSizeString(file.size)) + " "), file.percent === 100 ? _c("span", [_vm._v(" \xB7 Verifying and saving\u2026")]) : _vm.remaining(file) ? _c("span", { attrs: { "data-tid": "upload-eta" } }, [_vm._v(" \xB7 " + _vm._s(_vm.remaining(file)))]) : _vm._e()]), file.percent < 100 ? _c("button", { staticClass: "upload-progress__cancel", attrs: { "type": "button", "data-tid": "upload-cancel", "aria-label": `Cancel uploading ${file.filepath}` }, on: { "click": function($event) {
      return _vm.cancel(file);
    } } }, [_vm._v(" Cancel ")]) : _vm._e()]);
  }), 0) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/jobs/UploadProgress.vue?vue&type=style&index=0&scoped=679bd9b4&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "679bd9b4",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/jobs/UploadProgress.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXlDQTtBQUlBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUF4QkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVXBsb2FkUHJvZ3Jlc3MudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHNlY3Rpb25cbiAgICB2LWlmPVwidXBsb2Fkcy5sZW5ndGhcIlxuICAgIGNsYXNzPVwidXBsb2FkLXByb2dyZXNzXCJcbiAgICBhcmlhLWxhYmVsPVwiVXBsb2Fkc1wiXG4gICAgZGF0YS10aWQ9XCJ1cGxvYWQtcHJvZ3Jlc3NcIlxuICA+XG4gICAgPGRpdlxuICAgICAgdi1mb3I9XCJmaWxlIGluIHVwbG9hZHNcIlxuICAgICAgOmtleT1cImZpbGUuZmlsZXBhdGhcIlxuICAgICAgY2xhc3M9XCJ1cGxvYWQtcHJvZ3Jlc3NfX2ZpbGVcIlxuICAgID5cbiAgICAgIDxzdHJvbmc+e3sgZmlsZS5maWxlcGF0aCB9fTwvc3Ryb25nPlxuICAgICAgPHByb2dyZXNzXG4gICAgICAgIDp2YWx1ZT1cImZpbGUucGVyY2VudFwiXG4gICAgICAgIG1heD1cIjEwMFwiXG4gICAgICAgIDphcmlhLWxhYmVsPVwiYFVwbG9hZGluZyAke2ZpbGUuZmlsZXBhdGh9YFwiXG4gICAgICAvPlxuICAgICAgPGRpdiByb2xlPVwic3RhdHVzXCI+XG4gICAgICAgIHt7IGZpbGUucGVyY2VudCB9fSUgwrcge3sgJGZpbHRlcnMuZ2V0UmVhZGFibGVGaWxlU2l6ZVN0cmluZyhmaWxlLmxvYWRlZCkgfX0gLyB7eyAkZmlsdGVycy5nZXRSZWFkYWJsZUZpbGVTaXplU3RyaW5nKGZpbGUuc2l6ZSkgfX1cbiAgICAgICAgPHNwYW4gdi1pZj1cImZpbGUucGVyY2VudCA9PT0gMTAwXCI+IMK3IFZlcmlmeWluZyBhbmQgc2F2aW5n4oCmPC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtZWxzZS1pZj1cInJlbWFpbmluZyhmaWxlKVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1cGxvYWQtZXRhXCJcbiAgICAgICAgPiDCtyB7eyByZW1haW5pbmcoZmlsZSkgfX08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cImZpbGUucGVyY2VudCA8IDEwMFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cInVwbG9hZC1wcm9ncmVzc19fY2FuY2VsXCJcbiAgICAgICAgZGF0YS10aWQ9XCJ1cGxvYWQtY2FuY2VsXCJcbiAgICAgICAgOmFyaWEtbGFiZWw9XCJgQ2FuY2VsIHVwbG9hZGluZyAke2ZpbGUuZmlsZXBhdGh9YFwiXG4gICAgICAgIEBjbGljaz1cImNhbmNlbChmaWxlKVwiXG4gICAgICA+XG4gICAgICAgIENhbmNlbFxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IEZpbGVzVXBsb2FkIH0gZnJvbSAnQC9zdG9yZS9maWxlcy90eXBlcydcblxuQENvbXBvbmVudFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXBsb2FkUHJvZ3Jlc3MgZXh0ZW5kcyBWdWUge1xuICAvLyBXaGVuIGVhY2ggZmlsZSdzIGJ5dGVzIGZpcnN0IHN0YXJ0ZWQgbW92aW5nIChub3QgcmVhY3RpdmUgb24gcHVycG9zZSkuXG4gIHByaXZhdGUgc3RhcnRlZDogUmVjb3JkPHN0cmluZywgeyBhdDogbnVtYmVyLCBsb2FkZWQ6IG51bWJlciB9PiA9IHt9XG5cbiAgZ2V0IHVwbG9hZHMgKCk6IEZpbGVzVXBsb2FkW10ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5maWxlcy51cGxvYWRzLmZpbHRlcigoZmlsZTogRmlsZXNVcGxvYWQpID0+ICFmaWxlLmNhbmNlbGxlZClcbiAgfVxuXG4gIC8qKiBcImFib3V0IDMgbWluIGxlZnRcIiwgZnJvbSB0aGUgYnl0ZXMgbW92ZWQgc28gZmFyOyBub3RoaW5nIHVudGlsIGl0IGlzIGEgZmFpciBndWVzcy4gKi9cbiAgcmVtYWluaW5nIChmaWxlOiBGaWxlc1VwbG9hZCk6IHN0cmluZyB7XG4gICAgaWYgKCFmaWxlLmxvYWRlZCkgcmV0dXJuICcnXG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLnN0YXJ0ZWRbZmlsZS5maWxlcGF0aF0gPz89IHsgYXQ6IERhdGUubm93KCksIGxvYWRlZDogZmlsZS5sb2FkZWQgfVxuICAgIGNvbnN0IGVsYXBzZWQgPSAoRGF0ZS5ub3coKSAtIHN0YXJ0LmF0KSAvIDEwMDBcbiAgICBjb25zdCBtb3ZlZCA9IGZpbGUubG9hZGVkIC0gc3RhcnQubG9hZGVkXG4gICAgaWYgKGVsYXBzZWQgPCA1IHx8IG1vdmVkIDw9IDApIHJldHVybiAnJ1xuICAgIGNvbnN0IHNlY29uZHMgPSBNYXRoLmNlaWwoKGZpbGUuc2l6ZSAtIGZpbGUubG9hZGVkKSAvIChtb3ZlZCAvIGVsYXBzZWQpKVxuICAgIGlmIChzZWNvbmRzIDwgMjApIHJldHVybiAnJ1xuICAgIHJldHVybiBzZWNvbmRzIDwgOTAgPyBgYWJvdXQgJHtzZWNvbmRzfSBzIGxlZnRgIDogYGFib3V0ICR7TWF0aC5jZWlsKHNlY29uZHMgLyA2MCl9IG1pbiBsZWZ0YFxuICB9XG5cbiAgY2FuY2VsIChmaWxlOiBGaWxlc1VwbG9hZCkge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdmaWxlcy91cGRhdGVGaWxlVXBsb2FkJywgeyBmaWxlcGF0aDogZmlsZS5maWxlcGF0aCwgY2FuY2VsbGVkOiB0cnVlIH0pXG4gICAgZmlsZS5hYm9ydENvbnRyb2xsZXI/LmFib3J0KClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi51cGxvYWQtcHJvZ3Jlc3Mge1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHotaW5kZXg6IDEwMDA7XG4gIHJpZ2h0OiAxNnB4O1xuICBib3R0b206IGNhbGMoZW52KHNhZmUtYXJlYS1pbnNldC1ib3R0b20sIDBweCkgKyA4MHB4KTtcbiAgd2lkdGg6IG1pbig0MDBweCwgY2FsYygxMDB2dyAtIDMycHgpKTtcbiAgcGFkZGluZzogMTZweDtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSwgIzIwMjMyOSk7XG4gIGJveC1zaGFkb3c6IHZhcigtLW0zZC1zaGFkb3ctZmxvYXQpO1xuICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbn1cbi51cGxvYWQtcHJvZ3Jlc3NfX2ZpbGUgKyAudXBsb2FkLXByb2dyZXNzX19maWxlIHsgbWFyZ2luLXRvcDogMTJweDsgfVxuLnVwbG9hZC1wcm9ncmVzc19fY2FuY2VsIHsgbWFyZ2luLXRvcDogNHB4OyBwYWRkaW5nOiA0cHggMTJweDsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpOyBib3JkZXItcmFkaXVzOiA4cHg7IGNvbG9yOiBpbmhlcml0OyB9XG5wcm9ncmVzcyB7IGRpc3BsYXk6IGJsb2NrOyB3aWR0aDogMTAwJTsgbWFyZ2luOiA4cHggMDsgYWNjZW50LWNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2pvYnMvVXBsb2FkUHJvZ3Jlc3MudnVlIn0=