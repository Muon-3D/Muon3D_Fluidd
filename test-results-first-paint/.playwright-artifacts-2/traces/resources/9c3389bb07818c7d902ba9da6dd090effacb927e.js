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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import JobsMixin from "/src/mixins/jobs.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { previewPage } from "/src/services/gcode-preview/page-state.ts";
import PreviewOpenMenu from "/src/components/gcode-preview/PreviewOpenMenu.vue";
let PreviewActions = class extends Mixins(JobsMixin, BrowserMixin) {
  get previewFile() {
    return this.$store.getters["gcodePreview/getFile"];
  }
  get printPath() {
    const f = this.previewFile;
    return f ? [f.path, f.filename].filter(Boolean).join("/") : "";
  }
  /** Why Print this can't start now, or '' when it can. */
  get printBlocked() {
    if (!this.socketConnected) return `${this.printerName} is offline`;
    if (this.busy) return `${this.printerName} is already printing`;
    if (!this.controlReady) return `${this.printerName} isn't ready`;
    return "";
  }
  open(file) {
    previewPage.requested = file;
  }
  print() {
    if (this.printPath) this.printAgain(this.printPath);
  }
};
PreviewActions = __decorateClass([
  Component({ components: { PreviewOpenMenu } })
], PreviewActions);
const _sfc_main = PreviewActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "prev-actions", attrs: { "data-tid": "preview-actions" } }, [!_vm.isMobileViewport ? _c("preview-open-menu", { on: { "pick": _vm.open }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "cbtn", attrs: { "type": "button", "data-tid": "preview-open-another", "disabled": !_vm.socketConnected } }, "button", attrs, false), on), [_vm._v(" " + _vm._s(_vm.previewFile ? "Open another" : "Open a file") + " ")])];
  } }], null, false, 3099798302) }) : _vm._e(), _vm.previewFile ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "preview-print", "disabled": !!_vm.printBlocked, "title": _vm.printBlocked || void 0 }, on: { "click": _vm.print } }, [_vm._v(" Print this ")]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/gcode-preview/PreviewActions.vue?vue&type=style&index=0&scoped=b44d5903&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "b44d5903",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/gcode-preview/PreviewActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBSUE7QUFBQSxFQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXpCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQcmV2aWV3QWN0aW9ucy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJwcmV2LWFjdGlvbnNcIlxuICAgIGRhdGEtdGlkPVwicHJldmlldy1hY3Rpb25zXCJcbiAgPlxuICAgIDxwcmV2aWV3LW9wZW4tbWVudVxuICAgICAgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgIEBwaWNrPVwib3BlblwiXG4gICAgPlxuICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIGRhdGEtdGlkPVwicHJldmlldy1vcGVuLWFub3RoZXJcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFzb2NrZXRDb25uZWN0ZWRcIlxuICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICA+XG4gICAgICAgICAge3sgcHJldmlld0ZpbGUgPyAnT3BlbiBhbm90aGVyJyA6ICdPcGVuIGEgZmlsZScgfX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgIDwvcHJldmlldy1vcGVuLW1lbnU+XG4gICAgPGJ1dHRvblxuICAgICAgdi1pZj1cInByZXZpZXdGaWxlXCJcbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgZGF0YS10aWQ9XCJwcmV2aWV3LXByaW50XCJcbiAgICAgIDpkaXNhYmxlZD1cIiEhcHJpbnRCbG9ja2VkXCJcbiAgICAgIDp0aXRsZT1cInByaW50QmxvY2tlZCB8fCB1bmRlZmluZWRcIlxuICAgICAgQGNsaWNrPVwicHJpbnRcIlxuICAgID5cbiAgICAgIFByaW50IHRoaXNcbiAgICA8L2J1dHRvbj5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEpvYnNNaXhpbiBmcm9tICdAL21peGlucy9qb2JzJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IHR5cGUgeyBBcHBGaWxlIH0gZnJvbSAnQC9zdG9yZS9maWxlcy90eXBlcydcbmltcG9ydCB7IHByZXZpZXdQYWdlIH0gZnJvbSAnQC9zZXJ2aWNlcy9nY29kZS1wcmV2aWV3L3BhZ2Utc3RhdGUnXG5pbXBvcnQgUHJldmlld09wZW5NZW51IGZyb20gJy4vUHJldmlld09wZW5NZW51LnZ1ZSdcblxuLyoqIFRoZSBHLWNvZGUgcHJldmlldydzIGhlYWRlcjogT3BlbiBhbm90aGVyLCBhbmQgdGhlIG9uZSBwcmltYXJ5IGFjdGlvbiwgUHJpbnQgdGhpcy4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFByZXZpZXdPcGVuTWVudSB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmV2aWV3QWN0aW9ucyBleHRlbmRzIE1peGlucyhKb2JzTWl4aW4sIEJyb3dzZXJNaXhpbikge1xuICBnZXQgcHJldmlld0ZpbGUgKCk6IEFwcEZpbGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydnY29kZVByZXZpZXcvZ2V0RmlsZSddIGFzIEFwcEZpbGUgfCB1bmRlZmluZWRcbiAgfVxuXG4gIGdldCBwcmludFBhdGggKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZiA9IHRoaXMucHJldmlld0ZpbGVcbiAgICByZXR1cm4gZiA/IFtmLnBhdGgsIGYuZmlsZW5hbWVdLmZpbHRlcihCb29sZWFuKS5qb2luKCcvJykgOiAnJ1xuICB9XG5cbiAgLyoqIFdoeSBQcmludCB0aGlzIGNhbid0IHN0YXJ0IG5vdywgb3IgJycgd2hlbiBpdCBjYW4uICovXG4gIGdldCBwcmludEJsb2NrZWQgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNvY2tldENvbm5lY3RlZCkgcmV0dXJuIGAke3RoaXMucHJpbnRlck5hbWV9IGlzIG9mZmxpbmVgXG4gICAgaWYgKHRoaXMuYnVzeSkgcmV0dXJuIGAke3RoaXMucHJpbnRlck5hbWV9IGlzIGFscmVhZHkgcHJpbnRpbmdgXG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIGAke3RoaXMucHJpbnRlck5hbWV9IGlzbid0IHJlYWR5YFxuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgb3BlbiAoZmlsZTogQXBwRmlsZSkge1xuICAgIHByZXZpZXdQYWdlLnJlcXVlc3RlZCA9IGZpbGVcbiAgfVxuXG4gIHByaW50ICgpIHtcbiAgICBpZiAodGhpcy5wcmludFBhdGgpIHRoaXMucHJpbnRBZ2Fpbih0aGlzLnByaW50UGF0aClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnByZXYtYWN0aW9ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgZ2FwOiAxMHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvZ2NvZGUtcHJldmlldy9QcmV2aWV3QWN0aW9ucy52dWUifQ==