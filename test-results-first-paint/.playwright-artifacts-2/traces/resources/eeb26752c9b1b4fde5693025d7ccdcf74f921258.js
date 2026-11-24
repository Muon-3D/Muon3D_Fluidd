/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import OverviewStage from "/src/components/overview/OverviewStage.vue";
import { modelSettings } from "/src/services/m1-3d/device-settings.ts";
let StageTile = class extends Vue {
  view = modelSettings.opensOn;
  get cameras() {
    return this.$store.getters["webcams/getEnabledWebcams"] ?? [];
  }
  get toggleAllowed() {
    return this.$store.state.config?.uiSettings?.general?.overviewCameraToggle !== false;
  }
  get toggleShown() {
    return this.cameras.length > 0 && this.toggleAllowed && modelSettings.show;
  }
  /** With the 3D printer off, the camera if there is one (else the stage's still picture). */
  get showCamera() {
    if (!modelSettings.show) return this.cameras.length > 0;
    return this.view === "camera" && this.toggleShown;
  }
};
StageTile = __decorateClass([
  Component({
    components: {
      TileShell,
      OverviewStage,
      CameraItem: () => import("/src/components/widgets/camera/CameraItem.vue")
    }
  })
], StageTile);
const _sfc_main = StageTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { staticClass: "st", attrs: { "tile": "stage", "title": "Printer view", "bare": "" } }, [!_vm.showCamera ? _c("overview-stage", { staticClass: "st__stage" }) : _c("div", { staticClass: "st__cam", attrs: { "data-tid": "stage-camera" } }, [_c("camera-item", { staticClass: "st__cam-item", attrs: { "camera": _vm.cameras[0] } })], 1), _vm.toggleShown ? _c("div", { staticClass: "st__seg", attrs: { "role": "group", "aria-label": "Main view", "data-tid": "view-toggle" } }, [_c("button", { class: { on: !_vm.showCamera }, attrs: { "type": "button", "aria-pressed": _vm.showCamera ? "false" : "true" }, on: { "click": function($event) {
    _vm.view = "3d";
  } } }, [_c(__unplugin_components_0, { attrs: { "name": "printer", "small": "" } }), _vm._v("3D view ")], 1), _c("button", { class: { on: _vm.showCamera }, attrs: { "type": "button", "aria-pressed": _vm.showCamera ? "true" : "false" }, on: { "click": function($event) {
    _vm.view = "camera";
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "camera2", "small": "" } }), _vm._v("Camera ")], 1)]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/StageTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/StageTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBdURBO0FBQ0E7QUFDQTtBQUNBO0FBZUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXBCQTtBQUFBLEVBUEE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJTdGFnZVRpbGUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHRpbGUtc2hlbGxcbiAgICB0aWxlPVwic3RhZ2VcIlxuICAgIHRpdGxlPVwiUHJpbnRlciB2aWV3XCJcbiAgICBiYXJlXG4gICAgY2xhc3M9XCJzdFwiXG4gID5cbiAgICA8b3ZlcnZpZXctc3RhZ2VcbiAgICAgIHYtaWY9XCIhc2hvd0NhbWVyYVwiXG4gICAgICBjbGFzcz1cInN0X19zdGFnZVwiXG4gICAgLz5cbiAgICA8ZGl2XG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwic3RfX2NhbVwiXG4gICAgICBkYXRhLXRpZD1cInN0YWdlLWNhbWVyYVwiXG4gICAgPlxuICAgICAgPGNhbWVyYS1pdGVtXG4gICAgICAgIDpjYW1lcmE9XCJjYW1lcmFzWzBdXCJcbiAgICAgICAgY2xhc3M9XCJzdF9fY2FtLWl0ZW1cIlxuICAgICAgLz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2XG4gICAgICB2LWlmPVwidG9nZ2xlU2hvd25cIlxuICAgICAgY2xhc3M9XCJzdF9fc2VnXCJcbiAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICBhcmlhLWxhYmVsPVwiTWFpbiB2aWV3XCJcbiAgICAgIGRhdGEtdGlkPVwidmlldy10b2dnbGVcIlxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIDpjbGFzcz1cInsgb246ICFzaG93Q2FtZXJhIH1cIlxuICAgICAgICA6YXJpYS1wcmVzc2VkPVwic2hvd0NhbWVyYSA/ICdmYWxzZScgOiAndHJ1ZSdcIlxuICAgICAgICBAY2xpY2s9XCJ2aWV3ID0gJzNkJ1wiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgbmFtZT1cInByaW50ZXJcIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+M0Qgdmlld1xuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICA6Y2xhc3M9XCJ7IG9uOiBzaG93Q2FtZXJhIH1cIlxuICAgICAgICA6YXJpYS1wcmVzc2VkPVwic2hvd0NhbWVyYSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICBAY2xpY2s9XCJ2aWV3ID0gJ2NhbWVyYSdcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJjYW1lcmEyXCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPkNhbWVyYVxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvdGlsZS1zaGVsbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVGlsZVNoZWxsIGZyb20gJy4vVGlsZVNoZWxsLnZ1ZSdcbmltcG9ydCBPdmVydmlld1N0YWdlIGZyb20gJ0AvY29tcG9uZW50cy9vdmVydmlldy9PdmVydmlld1N0YWdlLnZ1ZSdcbmltcG9ydCB7IG1vZGVsU2V0dGluZ3MgfSBmcm9tICdAL3NlcnZpY2VzL20xLTNkL2RldmljZS1zZXR0aW5ncydcbmltcG9ydCB0eXBlIHsgV2ViY2FtQ29uZmlnIH0gZnJvbSAnQC9zdG9yZS93ZWJjYW1zL3R5cGVzJ1xuXG4vKipcbiAqIFRoZSBtYWluIHZpZXc6IHRoZSBsaXZlIDNEIHByaW50ZXIgYnkgZGVmYXVsdC4gQSBzd2l0Y2ggYXQgdGhlIHRvcCByaWdodFxuICogc2hvd3MgdGhlIGNhbWVyYSBpbnN0ZWFkLCBidXQgb25seSB3aGVuIGEgY2FtZXJhIGlzIGNvbmZpZ3VyZWQsIGFuZFxuICogU2V0dGluZ3MgY2FuIGhpZGUgdGhlIHN3aXRjaC5cbiAqL1xuQENvbXBvbmVudCh7XG4gIGNvbXBvbmVudHM6IHtcbiAgICBUaWxlU2hlbGwsXG4gICAgT3ZlcnZpZXdTdGFnZSxcbiAgICBDYW1lcmFJdGVtOiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy93aWRnZXRzL2NhbWVyYS9DYW1lcmFJdGVtLnZ1ZScpXG4gIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGFnZVRpbGUgZXh0ZW5kcyBWdWUge1xuICB2aWV3OiAnM2QnIHwgJ2NhbWVyYScgPSBtb2RlbFNldHRpbmdzLm9wZW5zT25cblxuICBnZXQgY2FtZXJhcyAoKTogV2ViY2FtQ29uZmlnW10ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuZ2V0dGVyc1snd2ViY2Ftcy9nZXRFbmFibGVkV2ViY2FtcyddIGFzIFdlYmNhbUNvbmZpZ1tdIHwgdW5kZWZpbmVkKSA/PyBbXVxuICB9XG5cbiAgZ2V0IHRvZ2dsZUFsbG93ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWc/LnVpU2V0dGluZ3M/LmdlbmVyYWw/Lm92ZXJ2aWV3Q2FtZXJhVG9nZ2xlICE9PSBmYWxzZVxuICB9XG5cbiAgZ2V0IHRvZ2dsZVNob3duICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jYW1lcmFzLmxlbmd0aCA+IDAgJiYgdGhpcy50b2dnbGVBbGxvd2VkICYmIG1vZGVsU2V0dGluZ3Muc2hvd1xuICB9XG5cbiAgLyoqIFdpdGggdGhlIDNEIHByaW50ZXIgb2ZmLCB0aGUgY2FtZXJhIGlmIHRoZXJlIGlzIG9uZSAoZWxzZSB0aGUgc3RhZ2UncyBzdGlsbCBwaWN0dXJlKS4gKi9cbiAgZ2V0IHNob3dDYW1lcmEgKCk6IGJvb2xlYW4ge1xuICAgIGlmICghbW9kZWxTZXR0aW5ncy5zaG93KSByZXR1cm4gdGhpcy5jYW1lcmFzLmxlbmd0aCA+IDBcbiAgICByZXR1cm4gdGhpcy52aWV3ID09PSAnY2FtZXJhJyAmJiB0aGlzLnRvZ2dsZVNob3duXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbi5zdCB7IG1pbi1oZWlnaHQ6IDQyMHB4OyB9XG4uc3QgLm90X19kb29yIHsgcG9zaXRpb246IHJlbGF0aXZlOyBmbGV4OiAxIDEgYXV0bzsgfVxuLnN0X19zdGFnZS5vdi1zdGFnZSwgLnN0X19jYW0geyBwb3NpdGlvbjogYWJzb2x1dGU7IGluc2V0OiAwOyBtaW4taGVpZ2h0OiAwOyBib3JkZXItcmFkaXVzOiAwOyB9XG4uc3RfX2NhbSB7IG92ZXJmbG93OiBoaWRkZW47IGJhY2tncm91bmQ6ICMyNDJhMmQ7IH1cbi5zdF9fY2FtLWl0ZW0geyBoZWlnaHQ6IDEwMCU7IH1cbi5zdF9fc2VnIHsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEycHg7IHJpZ2h0OiAxMnB4OyB6LWluZGV4OiAzOyBkaXNwbGF5OiBpbmxpbmUtZmxleDsgcGFkZGluZzogM3B4OyBib3JkZXItcmFkaXVzOiA5OTlweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWdsYXNzLXRoaWNrLCB2YXIoLS1tM2Qtc3VyZmFjZSkpOyBib3gtc2hhZG93OiB2YXIoLS1tM2QtZ2xhc3MtcmltKSwgdmFyKC0tbTNkLWdsYXNzLWVkZ2UpOyBiYWNrZHJvcC1maWx0ZXI6IHZhcigtLW0zZC1nbGFzcy1maWx0ZXIpOyB9XG4uc3RfX3NlZyBidXR0b24geyBkaXNwbGF5OiBpbmxpbmUtZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA2cHg7IGhlaWdodDogMzBweDsgcGFkZGluZzogMCAxM3B4OyBib3JkZXItcmFkaXVzOiA5OTlweDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgZm9udC1zaXplOiAxM3B4OyBmb250LXdlaWdodDogNjAwOyBjdXJzb3I6IHBvaW50ZXI7IH1cbi5zdF9fc2VnIGJ1dHRvbiAuZnJhbWUtaWNvbiB7IGNvbG9yOiBpbmhlcml0OyB9XG4uc3RfX3NlZyBidXR0b24ub24geyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgYm94LXNoYWRvdzogdmFyKC0tbTNkLXNoYWRvdy1jb250cm9sKTsgfVxuQG1lZGlhIChtYXgtd2lkdGg6IDU5OXB4KSB7IC5zdCB7IG1pbi1oZWlnaHQ6IDMwMHB4OyB9IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL292ZXJ2aWV3L3RpbGVzL1N0YWdlVGlsZS52dWUifQ==