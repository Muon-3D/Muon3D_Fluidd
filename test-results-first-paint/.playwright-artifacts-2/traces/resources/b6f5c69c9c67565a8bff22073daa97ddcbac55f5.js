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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { CameraComponents } from "/src/dynamicImports.ts";
let CameraPreview = class extends Vue {
  camera;
  get viewer() {
    if (!this.camera.service) return void 0;
    const name = `${this.$filters.startCase(this.camera.service).replace(/ /g, "")}Camera`;
    return name in CameraComponents ? CameraComponents[name] : void 0;
  }
  get viewerKey() {
    return [this.camera.service, this.camera.stream_url, this.camera.snapshot_url].join("|");
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], CameraPreview.prototype, "camera", 2);
CameraPreview = __decorateClass([
  Component({})
], CameraPreview);
const _sfc_main = CameraPreview;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "cprev", attrs: { "data-tid": "camera-preview" } }, [_vm.viewer ? _c(_vm.viewer, { key: _vm.viewerKey, tag: "component", staticClass: "cprev__view", attrs: { "camera": _vm.camera } }) : _c("p", { staticClass: "cprev__none" }, [_vm._v(" This stream type can't be previewed here. ")]), _vm._t("default")], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/cameras/CameraPreview.vue?vue&type=style&index=0&scoped=64b3a90b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "64b3a90b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/cameras/CameraPreview.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXVCQTtBQUVBO0FBUUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFYQTtBQUFBLEVBREE7QUFBQSxHQURBLGNBRUE7QUFGQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDYW1lcmFQcmV2aWV3LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cImNwcmV2XCJcbiAgICBkYXRhLXRpZD1cImNhbWVyYS1wcmV2aWV3XCJcbiAgPlxuICAgIDxjb21wb25lbnRcbiAgICAgIDppcz1cInZpZXdlclwiXG4gICAgICB2LWlmPVwidmlld2VyXCJcbiAgICAgIDprZXk9XCJ2aWV3ZXJLZXlcIlxuICAgICAgOmNhbWVyYT1cImNhbWVyYVwiXG4gICAgICBjbGFzcz1cImNwcmV2X192aWV3XCJcbiAgICAvPlxuICAgIDxwXG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwiY3ByZXZfX25vbmVcIlxuICAgID5cbiAgICAgIFRoaXMgc3RyZWFtIHR5cGUgY2FuJ3QgYmUgcHJldmlld2VkIGhlcmUuXG4gICAgPC9wPlxuICAgIDxzbG90IC8+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB0eXBlIHsgTmV3V2ViY2FtQ29uZmlnIH0gZnJvbSAnQC9zdG9yZS93ZWJjYW1zL3R5cGVzJ1xuaW1wb3J0IHsgQ2FtZXJhQ29tcG9uZW50cyB9IGZyb20gJ0AvZHluYW1pY0ltcG9ydHMnXG5cbi8qKlxuICogVGhlIGNhbWVyYSdzIG93biB2aWV3ZXIsIGFzIHRoZSBDYW1lcmEgcGFnZSB1c2VzIGl0LCBpbiBhIDE2OjkgZnJhbWUuIFRoZVxuICogdmlld2VyIGFwcGxpZXMgcm90YXRpb24gYW5kIGZsaXBzIGZyb20gdGhlIGNhbWVyYSBpdCBpcyBnaXZlbiwgc28gdGhleVxuICogc2hvdyBhcyB0aGV5IGNoYW5nZTsgYSBuZXcgYWRkcmVzcyBvciBzdHJlYW0gdHlwZSBzdGFydHMgaXQgb3Zlci5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENhbWVyYVByZXZpZXcgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgY2FtZXJhITogTmV3V2ViY2FtQ29uZmlnXG5cbiAgZ2V0IHZpZXdlciAoKSB7XG4gICAgaWYgKCF0aGlzLmNhbWVyYS5zZXJ2aWNlKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgY29uc3QgbmFtZSA9IGAke3RoaXMuJGZpbHRlcnMuc3RhcnRDYXNlKHRoaXMuY2FtZXJhLnNlcnZpY2UpLnJlcGxhY2UoLyAvZywgJycpfUNhbWVyYWBcbiAgICByZXR1cm4gbmFtZSBpbiBDYW1lcmFDb21wb25lbnRzID8gQ2FtZXJhQ29tcG9uZW50c1tuYW1lXSA6IHVuZGVmaW5lZFxuICB9XG5cbiAgZ2V0IHZpZXdlcktleSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW3RoaXMuY2FtZXJhLnNlcnZpY2UsIHRoaXMuY2FtZXJhLnN0cmVhbV91cmwsIHRoaXMuY2FtZXJhLnNuYXBzaG90X3VybF0uam9pbignfCcpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5jcHJldiB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGFzcGVjdC1yYXRpbzogMTYgLyA5O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiAjMGIwYjBjO1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgfVxuXG4gIC5jcHJldl9fdmlldyB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIG9iamVjdC1maXQ6IGNvbnRhaW47XG4gICAgYm9yZGVyOiAwO1xuICB9XG5cbiAgLmNwcmV2X19ub25lIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBtYXJnaW46IDA7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvc2V0dGluZ3MvY2FtZXJhcy9DYW1lcmFQcmV2aWV3LnZ1ZSJ9