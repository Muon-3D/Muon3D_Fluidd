/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSheet as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue, Prop, Watch, Ref } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { CameraComponents } from "/src/dynamicImports.ts";
import CameraMixin from "/src/mixins/camera.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
let CameraItem = class extends Vue {
  /** This camera's own page, on the printer Fluidd is on. */
  get fullscreenPath() {
    return scopedPath(`/camera/${encodeURI(this.camera.uid)}`, activeSlug());
  }
  camera;
  fullscreen;
  crossorigin;
  componentInstance;
  rawCameraUrl = null;
  framesPerSecond = null;
  mounted() {
    this.setupFrameEvents();
  }
  setupFrameEvents() {
    if (this.$listeners?.frame && this.componentInstance) {
      if (this.componentInstance.streamingElement instanceof HTMLImageElement) {
        this.componentInstance.streamingElement.addEventListener("load", () => this.handleFrame());
      } else if (this.componentInstance.streamingElement instanceof HTMLVideoElement) {
        this.handleFrame(true);
      }
    }
  }
  handleFrame(animate = false) {
    const element = this.componentInstance?.streamingElement;
    if (element) {
      this.$emit("frame", element);
    }
    if (animate) {
      requestAnimationFrame(() => this.handleFrame(this.componentInstance.animating));
    }
  }
  onCamera() {
    this.rawCameraUrl = "";
    this.framesPerSecond = "";
  }
  get fullscreenMode() {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction;
  }
  get cameraComponent() {
    if (this.camera.service) {
      const componentName = `${this.$filters.startCase(this.camera.service).replace(/ /g, "")}Camera`;
      if (componentName in CameraComponents) {
        return CameraComponents[componentName];
      }
    }
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], CameraItem.prototype, "camera", 2);
__decorateClass([
  Prop({ type: Boolean })
], CameraItem.prototype, "fullscreen", 2);
__decorateClass([
  Prop({ type: String })
], CameraItem.prototype, "crossorigin", 2);
__decorateClass([
  Ref("component-instance")
], CameraItem.prototype, "componentInstance", 2);
__decorateClass([
  Watch("camera")
], CameraItem.prototype, "onCamera", 1);
CameraItem = __decorateClass([
  Component({})
], CameraItem);
const _sfc_main = CameraItem;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, _vm._g({ staticClass: "camera-container", attrs: { "elevation": 0 } }, _vm.$listeners), [_vm.cameraComponent ? [_c(_vm.cameraComponent, { ref: "component-instance", tag: "component", staticClass: "camera-image", attrs: { "camera": _vm.camera, "crossorigin": _vm.crossorigin }, on: { "raw-camera-url": function($event) {
    _vm.rawCameraUrl = $event;
  }, "frames-per-second": function($event) {
    _vm.framesPerSecond = $event;
  }, "playback": function($event) {
    return _vm.setupFrameEvents();
  } } })] : _c("div", [_vm._v(" Camera service not supported! ")]), _vm.camera.name ? _c("div", { staticClass: "camera-name" }, [_vm._v(" " + _vm._s(_vm.camera.name) + " ")]) : _vm._e(), _vm.framesPerSecond ? _c("div", { staticClass: "camera-frames" }, [_vm._v(" fps: " + _vm._s(_vm.framesPerSecond) + " ")]) : _vm._e(), !_vm.fullscreen && (_vm.fullscreenMode === "embed" || !_vm.rawCameraUrl) && _vm.camera.service !== "device" ? _c("div", { staticClass: "camera-fullscreen" }, [_c("router-link", { attrs: { "to": _vm.fullscreenPath } }, [_c(__unplugin_components_1, [_vm._v("$fullScreen")])], 1)], 1) : _vm.rawCameraUrl ? _c("div", { staticClass: "camera-fullscreen" }, [_c("a", { attrs: { "href": _vm.rawCameraUrl, "target": "_blank" } }, [_c(__unplugin_components_2, [_vm._v("$openInNew")])], 1)]) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/camera/CameraItem.vue?vue&type=style&index=0&scoped=327a303e&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "327a303e",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/camera/CameraItem.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQTBEQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBMURBO0FBQUEsRUFEQTtBQUFBLEdBTkEsV0FPQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBVEEsV0FVQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBWkEsV0FhQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBZkEsV0FnQkE7QUErQkE7QUFBQSxFQURBO0FBQUEsR0E5Q0EsV0ErQ0E7QUEvQ0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ2FtZXJhSXRlbS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8di1zaGVldFxuICAgIDplbGV2YXRpb249XCIwXCJcbiAgICBjbGFzcz1cImNhbWVyYS1jb250YWluZXJcIlxuICAgIHYtb249XCIkbGlzdGVuZXJzXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSB2LWlmPVwiY2FtZXJhQ29tcG9uZW50XCI+XG4gICAgICA8Y29tcG9uZW50XG4gICAgICAgIDppcz1cImNhbWVyYUNvbXBvbmVudFwiXG4gICAgICAgIHJlZj1cImNvbXBvbmVudC1pbnN0YW5jZVwiXG4gICAgICAgIDpjYW1lcmE9XCJjYW1lcmFcIlxuICAgICAgICA6Y3Jvc3NvcmlnaW49XCJjcm9zc29yaWdpblwiXG4gICAgICAgIGNsYXNzPVwiY2FtZXJhLWltYWdlXCJcbiAgICAgICAgQHJhdy1jYW1lcmEtdXJsPVwicmF3Q2FtZXJhVXJsID0gJGV2ZW50XCJcbiAgICAgICAgQGZyYW1lcy1wZXItc2Vjb25kPVwiZnJhbWVzUGVyU2Vjb25kID0gJGV2ZW50XCJcbiAgICAgICAgQHBsYXliYWNrPVwic2V0dXBGcmFtZUV2ZW50cygpXCJcbiAgICAgIC8+XG4gICAgPC90ZW1wbGF0ZT5cbiAgICA8ZGl2IHYtZWxzZT5cbiAgICAgIENhbWVyYSBzZXJ2aWNlIG5vdCBzdXBwb3J0ZWQhXG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiY2FtZXJhLm5hbWVcIlxuICAgICAgY2xhc3M9XCJjYW1lcmEtbmFtZVwiXG4gICAgPlxuICAgICAge3sgY2FtZXJhLm5hbWUgfX1cbiAgICA8L2Rpdj5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwiZnJhbWVzUGVyU2Vjb25kXCJcbiAgICAgIGNsYXNzPVwiY2FtZXJhLWZyYW1lc1wiXG4gICAgPlxuICAgICAgZnBzOiB7eyBmcmFtZXNQZXJTZWNvbmQgfX1cbiAgICA8L2Rpdj5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCIhZnVsbHNjcmVlbiAmJiAoZnVsbHNjcmVlbk1vZGUgPT09ICdlbWJlZCcgfHwgIXJhd0NhbWVyYVVybCkgJiYgY2FtZXJhLnNlcnZpY2UgIT09ICdkZXZpY2UnXCJcbiAgICAgIGNsYXNzPVwiY2FtZXJhLWZ1bGxzY3JlZW5cIlxuICAgID5cbiAgICAgIDxyb3V0ZXItbGluayA6dG89XCJmdWxsc2NyZWVuUGF0aFwiPlxuICAgICAgICA8di1pY29uPiRmdWxsU2NyZWVuPC92LWljb24+XG4gICAgICA8L3JvdXRlci1saW5rPlxuICAgIDwvZGl2PlxuICAgIDxkaXZcbiAgICAgIHYtZWxzZS1pZj1cInJhd0NhbWVyYVVybFwiXG4gICAgICBjbGFzcz1cImNhbWVyYS1mdWxsc2NyZWVuXCJcbiAgICA+XG4gICAgICA8YVxuICAgICAgICA6aHJlZj1cInJhd0NhbWVyYVVybFwiXG4gICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICA+XG4gICAgICAgIDx2LWljb24+JG9wZW5Jbk5ldzwvdi1pY29uPlxuICAgICAgPC9hPlxuICAgIDwvZGl2PlxuICA8L3Ytc2hlZXQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUsIFByb3AsIFdhdGNoLCBSZWYgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBXZWJjYW1Db25maWcgfSBmcm9tICdAL3N0b3JlL3dlYmNhbXMvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IENhbWVyYUZ1bGxzY3JlZW5BY3Rpb24gfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudHMgfSBmcm9tICdAL2R5bmFtaWNJbXBvcnRzJ1xuaW1wb3J0IENhbWVyYU1peGluIGZyb20gJ0AvbWl4aW5zL2NhbWVyYSdcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcblxuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENhbWVyYUl0ZW0gZXh0ZW5kcyBWdWUge1xuICAvKiogVGhpcyBjYW1lcmEncyBvd24gcGFnZSwgb24gdGhlIHByaW50ZXIgRmx1aWRkIGlzIG9uLiAqL1xuICBnZXQgZnVsbHNjcmVlblBhdGggKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoYC9jYW1lcmEvJHtlbmNvZGVVUkkodGhpcy5jYW1lcmEudWlkKX1gLCBhY3RpdmVTbHVnKCkpXG4gIH1cblxuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgY2FtZXJhITogV2ViY2FtQ29uZmlnXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGZ1bGxzY3JlZW4/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgY3Jvc3NvcmlnaW4/OiAnYW5vbnltb3VzJyB8ICd1c2UtY3JlZGVudGlhbHMnIHwgJydcblxuICBAUmVmKCdjb21wb25lbnQtaW5zdGFuY2UnKVxuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZSE6IENhbWVyYU1peGluXG5cbiAgcmF3Q2FtZXJhVXJsOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICBmcmFtZXNQZXJTZWNvbmQgOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMuc2V0dXBGcmFtZUV2ZW50cygpXG4gIH1cblxuICBzZXR1cEZyYW1lRXZlbnRzICgpIHtcbiAgICBpZiAodGhpcy4kbGlzdGVuZXJzPy5mcmFtZSAmJiB0aGlzLmNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRJbnN0YW5jZS5zdHJlYW1pbmdFbGVtZW50IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudEluc3RhbmNlLnN0cmVhbWluZ0VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHRoaXMuaGFuZGxlRnJhbWUoKSlcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5jb21wb25lbnRJbnN0YW5jZS5zdHJlYW1pbmdFbGVtZW50IGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkge1xuICAgICAgICB0aGlzLmhhbmRsZUZyYW1lKHRydWUpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRnJhbWUgKGFuaW1hdGUgPSBmYWxzZSkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmNvbXBvbmVudEluc3RhbmNlPy5zdHJlYW1pbmdFbGVtZW50IGFzIEhUTUxJbWFnZUVsZW1lbnQgfCBIVE1MVmlkZW9FbGVtZW50XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuJGVtaXQoJ2ZyYW1lJywgZWxlbWVudClcbiAgICB9XG5cbiAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMuaGFuZGxlRnJhbWUodGhpcy5jb21wb25lbnRJbnN0YW5jZS5hbmltYXRpbmcpKVxuICAgIH1cbiAgfVxuXG4gIEBXYXRjaCgnY2FtZXJhJylcbiAgb25DYW1lcmEgKCkge1xuICAgIHRoaXMucmF3Q2FtZXJhVXJsID0gJydcbiAgICB0aGlzLmZyYW1lc1BlclNlY29uZCA9ICcnXG4gIH1cblxuICBnZXQgZnVsbHNjcmVlbk1vZGUgKCk6IENhbWVyYUZ1bGxzY3JlZW5BY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmNhbWVyYUZ1bGxzY3JlZW5BY3Rpb25cbiAgfVxuXG4gIGdldCBjYW1lcmFDb21wb25lbnQgKCkge1xuICAgIGlmICh0aGlzLmNhbWVyYS5zZXJ2aWNlKSB7XG4gICAgICBjb25zdCBjb21wb25lbnROYW1lID0gYCR7dGhpcy4kZmlsdGVycy5zdGFydENhc2UodGhpcy5jYW1lcmEuc2VydmljZSkucmVwbGFjZSgvIC9nLCAnJyl9Q2FtZXJhYFxuXG4gICAgICBpZiAoY29tcG9uZW50TmFtZSBpbiBDYW1lcmFDb21wb25lbnRzKSB7XG4gICAgICAgIHJldHVybiBDYW1lcmFDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdXG4gICAgICB9XG4gICAgfVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuY2FtZXJhLWltYWdlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgbWF4LWhlaWdodDogY2FsYygxMDB2aCAtIDEzMHB4KTtcbiAgICBtYXgtaGVpZ2h0OiBjYWxjKDEwMHN2aCAtIDEzMHB4KTtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIG1hcmdpbjogYXV0bztcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgfVxuXG4gIC5jYW1lcmEtY29udGFpbmVyIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAxKTtcbiAgfVxuXG4gIC5jYW1lcmEtbmFtZSxcbiAgLmNhbWVyYS1mcmFtZXMge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBib3R0b206IDA7XG4gICAgcGFkZGluZzogMnB4IDZweDtcbiAgICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuNzUpO1xuICAgIGZvbnQtd2VpZ2h0OiAxMDA7XG4gIH1cblxuICAudGhlbWUtLWxpZ2h0IC5jYW1lcmEtbmFtZSxcbiAgLnRoZW1lLS1saWdodCAuY2FtZXJhLWZyYW1lcyB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjc1KTtcbiAgfVxuXG4gIC5jYW1lcmEtZnVsbHNjcmVlbiB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgIHRvcDogMDtcbiAgICByaWdodDogMDtcbiAgICBwYWRkaW5nOiAycHggNnB4O1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC43NSk7XG4gICAgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogNHB4O1xuICB9XG5cbiAgLnRoZW1lLS1saWdodCAuY2FtZXJhLWZ1bGxzY3JlZW4ge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43NSk7XG4gIH1cblxuICAuY2FtZXJhLW5hbWUge1xuICAgIGxlZnQ6IDA7XG4gICAgYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IDRweDtcbiAgfVxuXG4gIC5jYW1lcmEtZnJhbWVzIHtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICByaWdodDogMDtcbiAgICBib3JkZXItdG9wLWxlZnQtcmFkaXVzOiA0cHg7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL2NhbWVyYS9DYW1lcmFJdGVtLnZ1ZSJ9