/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import { cancelQueuedThumbnail } from "/src/services/jobs/thumbnail.ts";
let JobPicture = class extends Vue {
  src;
  thumbKey;
  large;
  /** The address that failed to load, so a new one is tried afresh. */
  failed = "";
  get shown() {
    return this.src && this.src !== this.failed ? this.src : "";
  }
  beforeDestroy() {
    if (this.thumbKey && !this.src) cancelQueuedThumbnail(this.thumbKey);
  }
};
__decorateClass([
  Prop({ type: String, default: "" })
], JobPicture.prototype, "src", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], JobPicture.prototype, "thumbKey", 2);
__decorateClass([
  Prop({ type: Boolean })
], JobPicture.prototype, "large", 2);
JobPicture = __decorateClass([
  Component
], JobPicture);
const _sfc_main = JobPicture;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.shown ? _c("img", { attrs: { "src": _vm.shown, "alt": "", "loading": "lazy", "data-tid": "job-picture", "data-state": "image" }, on: { "error": function($event) {
    _vm.failed = _vm.src;
  } } }) : _c(__unplugin_components_0, { staticClass: "job-picture__placeholder", attrs: { "name": "jobs", "large": _vm.large, "small": !_vm.large, "data-tid": "job-picture", "data-state": "placeholder" } });
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/jobs/JobPicture.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFzQkE7QUFDQTtBQU9BO0FBQUEsRUFFQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUE7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQW5CQTtBQUFBLEVBREE7QUFBQSxHQURBLFdBRUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQUxBLFdBTUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVJBLFdBU0E7QUFUQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJKb2JQaWN0dXJlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxpbWdcbiAgICB2LWlmPVwic2hvd25cIlxuICAgIDpzcmM9XCJzaG93blwiXG4gICAgYWx0PVwiXCJcbiAgICBsb2FkaW5nPVwibGF6eVwiXG4gICAgZGF0YS10aWQ9XCJqb2ItcGljdHVyZVwiXG4gICAgZGF0YS1zdGF0ZT1cImltYWdlXCJcbiAgICBAZXJyb3I9XCJmYWlsZWQgPSBzcmNcIlxuICA+XG4gIDxmcmFtZS1pY29uXG4gICAgdi1lbHNlXG4gICAgbmFtZT1cImpvYnNcIlxuICAgIDpsYXJnZT1cImxhcmdlXCJcbiAgICA6c21hbGw9XCIhbGFyZ2VcIlxuICAgIGNsYXNzPVwiam9iLXBpY3R1cmVfX3BsYWNlaG9sZGVyXCJcbiAgICBkYXRhLXRpZD1cImpvYi1waWN0dXJlXCJcbiAgICBkYXRhLXN0YXRlPVwicGxhY2Vob2xkZXJcIlxuICAvPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IGNhbmNlbFF1ZXVlZFRodW1ibmFpbCB9IGZyb20gJ0Avc2VydmljZXMvam9icy90aHVtYm5haWwnXG5cbi8qKlxuICogQSBqb2IncyBwaWN0dXJlLiBBIGZpbGUgd2l0aCBubyB0aHVtYm5haWwsIG9yIG9uZSB3aG9zZSB0aHVtYm5haWwgY2FuJ3QgYmVcbiAqIGxvYWRlZCwgc2hvd3MgdGhlIHBsYWluIGpvYiBpY29uIHJhdGhlciB0aGFuIGFuIGVtcHR5IGJveCBvciBhIGJyb2tlbiBpbWFnZS5cbiAqL1xuQENvbXBvbmVudFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSm9iUGljdHVyZSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSBzcmMhOiBzdHJpbmdcblxuICAvKiogTmFtZXMgYSBwaWN0dXJlIHJlYWQgb3ZlciB0aGUgcmVtb3RlIHJvdXRlOiBkcm9wcGVkIGZyb20gdGhlIHF1ZXVlIGlmIHRoaXMgZ29lcyBiZWZvcmUgaXRzIHR1cm4uICovXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KVxuICByZWFkb25seSB0aHVtYktleSE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBsYXJnZSE6IGJvb2xlYW5cblxuICAvKiogVGhlIGFkZHJlc3MgdGhhdCBmYWlsZWQgdG8gbG9hZCwgc28gYSBuZXcgb25lIGlzIHRyaWVkIGFmcmVzaC4gKi9cbiAgZmFpbGVkID0gJydcblxuICBnZXQgc2hvd24gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc3JjICYmIHRoaXMuc3JjICE9PSB0aGlzLmZhaWxlZCA/IHRoaXMuc3JjIDogJydcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIGlmICh0aGlzLnRodW1iS2V5ICYmICF0aGlzLnNyYykgY2FuY2VsUXVldWVkVGh1bWJuYWlsKHRoaXMudGh1bWJLZXkpXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvam9icy9Kb2JQaWN0dXJlLnZ1ZSJ9