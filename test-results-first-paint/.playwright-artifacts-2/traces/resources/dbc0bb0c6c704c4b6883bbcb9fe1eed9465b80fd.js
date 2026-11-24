/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { Globals } from "/src/globals.ts";
import { moveCamera } from "/src/services/camera/order.ts";
import { STREAM_TYPES, newCamera, pictureFacts, streamLine, streamTypeKey } from "/src/services/camera/types.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import SegPicker from "/src/components/control/SegPicker.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import CameraDetail from "/src/components/settings/cameras/CameraDetail.vue";
import CameraThumb from "/src/components/settings/cameras/CameraThumb.vue";
let CameraSettings = class extends Vue {
  get fullscreen() {
    return [
      { value: "embed", label: this.$t("app.setting.label.camera_fullscreen_action.embed") },
      { value: "rawstream", label: this.$t("app.setting.label.camera_fullscreen_action.rawstream") }
    ];
  }
  types = STREAM_TYPES;
  view = "list";
  /** The header's "Add a camera" opens this page with ?add=1: start at the stream types. */
  created() {
    this.openFromHeader();
  }
  openFromHeader() {
    if (this.$route.query.add) {
      this.view = "types";
      this.$router.replace({ path: this.$route.path, hash: this.$route.hash }).catch(() => {
      });
    }
  }
  editing = null;
  editKey = 0;
  dragIndex = null;
  overIndex = null;
  get cameras() {
    return this.$store.getters["webcams/getWebcams"];
  }
  /** The camera that opens first: the first one that is shown. */
  get firstShown() {
    return this.cameras.find((c) => c.enabled !== false)?.uid;
  }
  line(camera) {
    const key = streamTypeKey(camera.service);
    return streamLine(camera, key ? this.$t(key) : camera.service === "device" ? "This device" : "Unknown type");
  }
  facts(camera) {
    return pictureFacts(camera);
  }
  open(camera) {
    this.editing = { ...camera };
    this.editKey++;
    this.view = "detail";
  }
  startNew(service) {
    this.editing = newCamera(service, Globals.DEFAULTS.CAMERA_URL_STREAM, Globals.DEFAULTS.CAMERA_URL_SNAPSHOT);
    this.editKey++;
    this.view = "detail";
  }
  handleSave(camera) {
    this.$store.dispatch("webcams/updateWebcam", camera);
    this.view = "list";
  }
  setEnabled(camera, enabled) {
    this.$store.dispatch("webcams/updateWebcam", { ...camera, enabled });
  }
  async handleRemove() {
    const camera = this.editing;
    if (!camera?.uid) return;
    const sure = await this.$confirm(`${camera.name} is removed from Control. The camera itself isn't touched, and you can add it again by its address.`, {
      title: `Remove ${camera.name}?`,
      buttonTrueText: "Remove",
      danger: true
    });
    if (!sure) return;
    this.$store.dispatch("webcams/removeWebcam", camera.uid);
    this.view = "list";
  }
  /** Moves a camera `step` places up (-1) or down (1) and saves the order. */
  moveBy(index, step) {
    const to = index + step;
    if (to < 0 || to >= this.cameras.length) return;
    const uid = this.cameras[index].uid;
    const focused = document.activeElement;
    const kind = focused && this.$el.contains(focused) ? (focused.dataset.tid ?? "").split("-")[1] : "";
    this.saveOrder(moveCamera(this.cameras, index, to));
    if (kind) {
      this.$nextTick(() => {
        const controls = Array.from(this.$el.querySelectorAll(`[data-tid^="camera-${kind}-"]`));
        controls.find((c) => c.dataset.cam === uid)?.focus();
      });
    }
  }
  saveOrder(order) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.general.cameraOrder",
      value: order,
      server: true
    });
  }
  onDragStart(index, event) {
    this.dragIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    }
  }
  onDragOver(index) {
    if (this.dragIndex !== null) this.overIndex = index;
  }
  onDrop(index) {
    if (this.dragIndex !== null && this.dragIndex !== index) {
      this.saveOrder(moveCamera(this.cameras, this.dragIndex, index));
    }
    this.onDragEnd();
  }
  onDragEnd() {
    this.dragIndex = null;
    this.overIndex = null;
  }
  get generalTo() {
    return `${scopedPath("/settings", activeSlug())}#general`;
  }
  get overviewOn() {
    return this.$store.state.config.uiSettings.general.overviewCameraToggle !== false;
  }
  get defaultFullscreenAction() {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction;
  }
  set defaultFullscreenAction(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.general.cameraFullscreenAction",
      value,
      server: true
    });
  }
};
__decorateClass([
  Watch("$route.query.add")
], CameraSettings.prototype, "openFromHeader", 1);
CameraSettings = __decorateClass([
  Component({ components: { CameraDetail, CameraThumb, SegPicker, ToggleSwitch } })
], CameraSettings);
const _sfc_main = CameraSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "cams", attrs: { "id": "camera", "data-tid": "cameras-settings" } }, [_vm.view === "detail" && _vm.editing ? _c("camera-detail", { key: _vm.editKey, attrs: { "camera": _vm.editing }, on: { "save": _vm.handleSave, "cancel": function($event) {
    _vm.view = "list";
  }, "remove": _vm.handleRemove } }) : _vm.view === "types" ? _c("section", { staticClass: "m3-set", attrs: { "data-tid": "camera-types" } }, [_c("div", { staticClass: "m3-set__row cams__head" }, [_c("div", { staticClass: "m3-set__label" }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" " + _vm._s(_vm.$t("app.general.label.add_camera")) + " ")]), _c("span", [_vm._v("Choose the stream type. Then set its addresses and name.")])]), _c("div", { staticClass: "m3-set__control" }, [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "camera-types-cancel" }, on: { "click": function($event) {
    _vm.view = "list";
  } } }, [_vm._v(" Cancel ")])])]), _c("div", { staticClass: "cams__types" }, _vm._l(_vm.types, function(type) {
    return _c("button", { key: type.value, staticClass: "cams__type", class: { "cams__type--on": type.value === "mjpegstreamer-adaptive" }, attrs: { "type": "button", "data-tid": `camera-type-${type.value}` }, on: { "click": function($event) {
      return _vm.startNew(type.value);
    } } }, [_c("b", [_vm._v(_vm._s(_vm.$t(type.labelKey)))]), _c("span", [_vm._v(_vm._s(type.hint))])]);
  }), 0)]) : [!_vm.cameras.length ? _c("section", { staticClass: "m3-set cams__empty", attrs: { "data-tid": "cameras-empty" } }, [_c("span", { staticClass: "cams__empty-icon" }, [_c(__unplugin_components_0, { attrs: { "name": "camera" } })], 1), _c("b", [_vm._v("No cameras yet")]), _c("p", [_vm._v("Plug a USB camera into the printer, or add one by its address.")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "camera-add" }, on: { "click": function($event) {
    _vm.view = "types";
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.setting.btn.add_camera")) + " ")])]) : _c("section", { staticClass: "m3-set cams__list", attrs: { "data-tid": "cameras-list" } }, [_c("div", { staticClass: "m3-set__row cams__head" }, [_c("div", { staticClass: "m3-set__label" }, [_c("h2", { staticClass: "m3-set__title" }, [_vm._v(" " + _vm._s(_vm.$tc("app.setting.title.camera", 2)) + " \xB7 " + _vm._s(_vm.cameras.length) + " ")]), _c("span", [_vm._v("The cameras Control shows, in the order you switch between them")])]), _c("div", { staticClass: "m3-set__control" }, [_c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "camera-add" }, on: { "click": function($event) {
    _vm.view = "types";
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "plus", "small": "" } }), _vm._v(" " + _vm._s(_vm.$t("app.setting.btn.add_camera")) + " ")], 1)])]), _vm._l(_vm.cameras, function(camera, index) {
    return _c("div", { key: camera.uid, staticClass: "m3-set__row cams__row", class: { "cams__row--over": _vm.overIndex === index && _vm.dragIndex !== index }, attrs: { "data-tid": `camera-row-${camera.name}`, "draggable": "true" }, on: { "dragstart": function($event) {
      return _vm.onDragStart(index, $event);
    }, "dragover": function($event) {
      $event.preventDefault();
      return _vm.onDragOver(index);
    }, "drop": function($event) {
      $event.preventDefault();
      return _vm.onDrop(index);
    }, "dragend": _vm.onDragEnd } }, [_c("button", { staticClass: "cams__grip", attrs: { "type": "button", "aria-label": `Reorder ${camera.name}: Up and Down arrow keys move it`, "data-tid": `camera-grip-${camera.name}`, "data-cam": camera.uid }, on: { "keydown": [function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "up", 38, $event.key, ["Up", "ArrowUp"])) return null;
      $event.preventDefault();
      return _vm.moveBy(index, -1);
    }, function($event) {
      if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "down", 40, $event.key, ["Down", "ArrowDown"])) return null;
      $event.preventDefault();
      return _vm.moveBy(index, 1);
    }] } }, _vm._l(6, function(n) {
      return _c("i", { key: n });
    }), 0), _c("button", { staticClass: "cams__open", attrs: { "type": "button", "aria-label": `Open ${camera.name}`, "data-tid": `camera-open-${camera.name}` }, on: { "click": function($event) {
      return _vm.open(camera);
    } } }, [_c("camera-thumb", { attrs: { "camera": camera, "off": camera.enabled === false } }), _c("span", { staticClass: "cams__text" }, [_c("b", [_vm._v(_vm._s(camera.name))]), _c("span", [_vm._v(_vm._s(_vm.line(camera)))]), _c("span", { staticClass: "cams__pills" }, [camera.uid === _vm.firstShown ? _c("span", { staticClass: "cams__pill cams__pill--acc" }, [_vm._v("Opens first")]) : _vm._e(), _vm._l(_vm.facts(camera), function(fact) {
      return _c("span", { key: fact, staticClass: "cams__pill" }, [_vm._v(_vm._s(fact))]);
    }), camera.source === "config" ? _c("span", { staticClass: "cams__pill" }, [_c(__unplugin_components_2, { attrs: { "name": "lock", "small": "" } }), _vm._v(" From moonraker.conf")], 1) : _vm._e()], 2)])], 1), _c("span", { staticClass: "cams__side" }, [_c("span", { staticClass: "cams__move" }, [_c("button", { attrs: { "type": "button", "disabled": index === 0, "aria-label": `Move ${camera.name} up`, "data-tid": `camera-up-${camera.name}`, "data-cam": camera.uid }, on: { "click": function($event) {
      return _vm.moveBy(index, -1);
    } } }, [_c(__unplugin_components_3, { attrs: { "name": "chevronUp", "small": "" } })], 1), _c("button", { attrs: { "type": "button", "disabled": index === _vm.cameras.length - 1, "aria-label": `Move ${camera.name} down`, "data-tid": `camera-down-${camera.name}`, "data-cam": camera.uid }, on: { "click": function($event) {
      return _vm.moveBy(index, 1);
    } } }, [_c(__unplugin_components_4, { attrs: { "name": "chevronDown", "small": "" } })], 1)]), _c("toggle-switch", { staticClass: "cams__switch", attrs: { "value": camera.enabled !== false, "disabled": camera.source === "config", "label": `Show ${camera.name}`, "data-tid": `camera-show-${camera.name}` }, on: { "input": function($event) {
      return _vm.setEnabled(camera, $event);
    } } })], 1)]);
  }), _c("p", { staticClass: "cams__hint" }, [_vm._v(" Drag to set the order the camera view switches through, or use the arrows. The order is saved on the printer, for everyone; the first one opens by default. ")])], 2), _c("h3", { staticClass: "cams__group" }, [_vm._v(" Viewing ")]), _c("section", { staticClass: "m3-set" }, [_c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v(_vm._s(_vm.$t("app.setting.label.camera_fullscreen_action.title")))]), _c("span", [_vm._v("Embed keeps Control's controls on top. Raw stream opens the camera's own address.")])]), _c("div", { staticClass: "m3-set__control" }, [_c("seg-picker", { attrs: { "options": _vm.fullscreen, "value": _vm.defaultFullscreenAction, "label": _vm.$t("app.setting.label.camera_fullscreen_action.title"), "data-tid": "camera-fullscreen" }, on: { "input": function($event) {
    _vm.defaultFullscreenAction = $event;
  } } })], 1)]), _c("div", { staticClass: "m3-set__row" }, [_c("div", { staticClass: "m3-set__label" }, [_c("b", [_vm._v("Camera on Overview")]), _c("span", [_vm._v("Set in General, with the 3D view.")])]), _c("div", { staticClass: "m3-set__control" }, [_c("router-link", { staticClass: "cbtn cbtn--ghost", attrs: { "to": _vm.generalTo, "data-tid": "camera-overview-link" } }, [_vm._v(" " + _vm._s(_vm.overviewOn ? "On" : "Off") + " "), _c(__unplugin_components_5, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 1)])])]], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/cameras/CameraSettings.vue?vue&type=style&index=0&scoped=e123490b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e123490b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/cameras/CameraSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQStQQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVNBO0FBQUEsRUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBcElBO0FBQUEsRUFEQTtBQUFBLEdBakJBLGVBa0JBO0FBbEJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNhbWVyYVNldHRpbmdzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBpZD1cImNhbWVyYVwiXG4gICAgY2xhc3M9XCJjYW1zXCJcbiAgICBkYXRhLXRpZD1cImNhbWVyYXMtc2V0dGluZ3NcIlxuICA+XG4gICAgPCEtLSBPbmUgY2FtZXJhLCBvcGVuIC0tPlxuICAgIDxjYW1lcmEtZGV0YWlsXG4gICAgICB2LWlmPVwidmlldyA9PT0gJ2RldGFpbCcgJiYgZWRpdGluZ1wiXG4gICAgICA6a2V5PVwiZWRpdEtleVwiXG4gICAgICA6Y2FtZXJhPVwiZWRpdGluZ1wiXG4gICAgICBAc2F2ZT1cImhhbmRsZVNhdmVcIlxuICAgICAgQGNhbmNlbD1cInZpZXcgPSAnbGlzdCdcIlxuICAgICAgQHJlbW92ZT1cImhhbmRsZVJlbW92ZVwiXG4gICAgLz5cblxuICAgIDwhLS0gQWRkOiB0aGUgc3RyZWFtIHR5cGUgZmlyc3QgLS0+XG4gICAgPHNlY3Rpb25cbiAgICAgIHYtZWxzZS1pZj1cInZpZXcgPT09ICd0eXBlcydcIlxuICAgICAgY2xhc3M9XCJtMy1zZXRcIlxuICAgICAgZGF0YS10aWQ9XCJjYW1lcmEtdHlwZXNcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX3JvdyBjYW1zX19oZWFkXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgPGgyIGNsYXNzPVwibTMtc2V0X190aXRsZVwiPlxuICAgICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmxhYmVsLmFkZF9jYW1lcmEnKSB9fVxuICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgPHNwYW4+Q2hvb3NlIHRoZSBzdHJlYW0gdHlwZS4gVGhlbiBzZXQgaXRzIGFkZHJlc3NlcyBhbmQgbmFtZS48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19jb250cm9sXCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJjYW1lcmEtdHlwZXMtY2FuY2VsXCJcbiAgICAgICAgICAgIEBjbGljaz1cInZpZXcgPSAnbGlzdCdcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNhbXNfX3R5cGVzXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cInR5cGUgaW4gdHlwZXNcIlxuICAgICAgICAgIDprZXk9XCJ0eXBlLnZhbHVlXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNhbXNfX3R5cGVcIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ2NhbXNfX3R5cGUtLW9uJzogdHlwZS52YWx1ZSA9PT0gJ21qcGVnc3RyZWFtZXItYWRhcHRpdmUnIH1cIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBjYW1lcmEtdHlwZS0ke3R5cGUudmFsdWV9YFwiXG4gICAgICAgICAgQGNsaWNrPVwic3RhcnROZXcodHlwZS52YWx1ZSlcIlxuICAgICAgICA+XG4gICAgICAgICAgPGI+e3sgJHQodHlwZS5sYWJlbEtleSkgfX08L2I+XG4gICAgICAgICAgPHNwYW4+e3sgdHlwZS5oaW50IH19PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICA8IS0tIEVtcHR5IC0tPlxuICAgICAgPHNlY3Rpb25cbiAgICAgICAgdi1pZj1cIiFjYW1lcmFzLmxlbmd0aFwiXG4gICAgICAgIGNsYXNzPVwibTMtc2V0IGNhbXNfX2VtcHR5XCJcbiAgICAgICAgZGF0YS10aWQ9XCJjYW1lcmFzLWVtcHR5XCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjYW1zX19lbXB0eS1pY29uXCI+PGZyYW1lLWljb24gbmFtZT1cImNhbWVyYVwiIC8+PC9zcGFuPlxuICAgICAgICA8Yj5ObyBjYW1lcmFzIHlldDwvYj5cbiAgICAgICAgPHA+UGx1ZyBhIFVTQiBjYW1lcmEgaW50byB0aGUgcHJpbnRlciwgb3IgYWRkIG9uZSBieSBpdHMgYWRkcmVzcy48L3A+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJjYW1lcmEtYWRkXCJcbiAgICAgICAgICBAY2xpY2s9XCJ2aWV3ID0gJ3R5cGVzJ1wiXG4gICAgICAgID5cbiAgICAgICAgICB7eyAkdCgnYXBwLnNldHRpbmcuYnRuLmFkZF9jYW1lcmEnKSB9fVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgPCEtLSBUaGUgbGlzdCAtLT5cbiAgICAgIDxzZWN0aW9uXG4gICAgICAgIHYtZWxzZVxuICAgICAgICBjbGFzcz1cIm0zLXNldCBjYW1zX19saXN0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJjYW1lcmFzLWxpc3RcIlxuICAgICAgPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibTMtc2V0X19yb3cgY2Ftc19faGVhZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgICA8aDIgY2xhc3M9XCJtMy1zZXRfX3RpdGxlXCI+XG4gICAgICAgICAgICAgIHt7ICR0YygnYXBwLnNldHRpbmcudGl0bGUuY2FtZXJhJywgMikgfX0gwrcge3sgY2FtZXJhcy5sZW5ndGggfX1cbiAgICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgICA8c3Bhbj5UaGUgY2FtZXJhcyBDb250cm9sIHNob3dzLCBpbiB0aGUgb3JkZXIgeW91IHN3aXRjaCBiZXR3ZWVuIHRoZW08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImNhbWVyYS1hZGRcIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJ2aWV3ID0gJ3R5cGVzJ1wiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgICAgbmFtZT1cInBsdXNcIlxuICAgICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIHt7ICR0KCdhcHAuc2V0dGluZy5idG4uYWRkX2NhbWVyYScpIH19XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtZm9yPVwiKGNhbWVyYSwgaW5kZXgpIGluIGNhbWVyYXNcIlxuICAgICAgICAgIDprZXk9XCJjYW1lcmEudWlkXCJcbiAgICAgICAgICBjbGFzcz1cIm0zLXNldF9fcm93IGNhbXNfX3Jvd1wiXG4gICAgICAgICAgOmNsYXNzPVwieyAnY2Ftc19fcm93LS1vdmVyJzogb3ZlckluZGV4ID09PSBpbmRleCAmJiBkcmFnSW5kZXggIT09IGluZGV4IH1cIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBjYW1lcmEtcm93LSR7Y2FtZXJhLm5hbWV9YFwiXG4gICAgICAgICAgZHJhZ2dhYmxlPVwidHJ1ZVwiXG4gICAgICAgICAgQGRyYWdzdGFydD1cIm9uRHJhZ1N0YXJ0KGluZGV4LCAkZXZlbnQpXCJcbiAgICAgICAgICBAZHJhZ292ZXIucHJldmVudD1cIm9uRHJhZ092ZXIoaW5kZXgpXCJcbiAgICAgICAgICBAZHJvcC5wcmV2ZW50PVwib25Ecm9wKGluZGV4KVwiXG4gICAgICAgICAgQGRyYWdlbmQ9XCJvbkRyYWdFbmRcIlxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImNhbXNfX2dyaXBcIlxuICAgICAgICAgICAgOmFyaWEtbGFiZWw9XCJgUmVvcmRlciAke2NhbWVyYS5uYW1lfTogVXAgYW5kIERvd24gYXJyb3cga2V5cyBtb3ZlIGl0YFwiXG4gICAgICAgICAgICA6ZGF0YS10aWQ9XCJgY2FtZXJhLWdyaXAtJHtjYW1lcmEubmFtZX1gXCJcbiAgICAgICAgICAgIDpkYXRhLWNhbT1cImNhbWVyYS51aWRcIlxuICAgICAgICAgICAgQGtleWRvd24udXAucHJldmVudD1cIm1vdmVCeShpbmRleCwgLTEpXCJcbiAgICAgICAgICAgIEBrZXlkb3duLmRvd24ucHJldmVudD1cIm1vdmVCeShpbmRleCwgMSlcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxpXG4gICAgICAgICAgICAgIHYtZm9yPVwibiBpbiA2XCJcbiAgICAgICAgICAgICAgOmtleT1cIm5cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJjYW1zX19vcGVuXCJcbiAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE9wZW4gJHtjYW1lcmEubmFtZX1gXCJcbiAgICAgICAgICAgIDpkYXRhLXRpZD1cImBjYW1lcmEtb3Blbi0ke2NhbWVyYS5uYW1lfWBcIlxuICAgICAgICAgICAgQGNsaWNrPVwib3BlbihjYW1lcmEpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Y2FtZXJhLXRodW1iXG4gICAgICAgICAgICAgIDpjYW1lcmE9XCJjYW1lcmFcIlxuICAgICAgICAgICAgICA6b2ZmPVwiY2FtZXJhLmVuYWJsZWQgPT09IGZhbHNlXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImNhbXNfX3RleHRcIj5cbiAgICAgICAgICAgICAgPGI+e3sgY2FtZXJhLm5hbWUgfX08L2I+XG4gICAgICAgICAgICAgIDxzcGFuPnt7IGxpbmUoY2FtZXJhKSB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJjYW1zX19waWxsc1wiPlxuICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICB2LWlmPVwiY2FtZXJhLnVpZCA9PT0gZmlyc3RTaG93blwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImNhbXNfX3BpbGwgY2Ftc19fcGlsbC0tYWNjXCJcbiAgICAgICAgICAgICAgICA+T3BlbnMgZmlyc3Q8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtZm9yPVwiZmFjdCBpbiBmYWN0cyhjYW1lcmEpXCJcbiAgICAgICAgICAgICAgICAgIDprZXk9XCJmYWN0XCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzPVwiY2Ftc19fcGlsbFwiXG4gICAgICAgICAgICAgICAgPnt7IGZhY3QgfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtaWY9XCJjYW1lcmEuc291cmNlID09PSAnY29uZmlnJ1wiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImNhbXNfX3BpbGxcIlxuICAgICAgICAgICAgICAgID48ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgICAgbmFtZT1cImxvY2tcIlxuICAgICAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgICAgICAvPiBGcm9tIG1vb25yYWtlci5jb25mPC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImNhbXNfX3NpZGVcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY2Ftc19fbW92ZVwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgOmRpc2FibGVkPVwiaW5kZXggPT09IDBcIlxuICAgICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE1vdmUgJHtjYW1lcmEubmFtZX0gdXBgXCJcbiAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgY2FtZXJhLXVwLSR7Y2FtZXJhLm5hbWV9YFwiXG4gICAgICAgICAgICAgICAgOmRhdGEtY2FtPVwiY2FtZXJhLnVpZFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwibW92ZUJ5KGluZGV4LCAtMSlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJjaGV2cm9uVXBcIlxuICAgICAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cImluZGV4ID09PSBjYW1lcmFzLmxlbmd0aCAtIDFcIlxuICAgICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiYE1vdmUgJHtjYW1lcmEubmFtZX0gZG93bmBcIlxuICAgICAgICAgICAgICAgIDpkYXRhLXRpZD1cImBjYW1lcmEtZG93bi0ke2NhbWVyYS5uYW1lfWBcIlxuICAgICAgICAgICAgICAgIDpkYXRhLWNhbT1cImNhbWVyYS51aWRcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cIm1vdmVCeShpbmRleCwgMSlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJjaGV2cm9uRG93blwiXG4gICAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHRvZ2dsZS1zd2l0Y2hcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYW1zX19zd2l0Y2hcIlxuICAgICAgICAgICAgICA6dmFsdWU9XCJjYW1lcmEuZW5hYmxlZCAhPT0gZmFsc2VcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJjYW1lcmEuc291cmNlID09PSAnY29uZmlnJ1wiXG4gICAgICAgICAgICAgIDpsYWJlbD1cImBTaG93ICR7Y2FtZXJhLm5hbWV9YFwiXG4gICAgICAgICAgICAgIDpkYXRhLXRpZD1cImBjYW1lcmEtc2hvdy0ke2NhbWVyYS5uYW1lfWBcIlxuICAgICAgICAgICAgICBAaW5wdXQ9XCJzZXRFbmFibGVkKGNhbWVyYSwgJGV2ZW50KVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxwIGNsYXNzPVwiY2Ftc19faGludFwiPlxuICAgICAgICAgIERyYWcgdG8gc2V0IHRoZSBvcmRlciB0aGUgY2FtZXJhIHZpZXcgc3dpdGNoZXMgdGhyb3VnaCwgb3IgdXNlIHRoZSBhcnJvd3MuIFRoZSBvcmRlciBpcyBzYXZlZCBvbiB0aGUgcHJpbnRlciwgZm9yIGV2ZXJ5b25lOyB0aGUgZmlyc3Qgb25lIG9wZW5zIGJ5IGRlZmF1bHQuXG4gICAgICAgIDwvcD5cbiAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgPGgzIGNsYXNzPVwiY2Ftc19fZ3JvdXBcIj5cbiAgICAgICAgVmlld2luZ1xuICAgICAgPC9oMz5cbiAgICAgIDxzZWN0aW9uIGNsYXNzPVwibTMtc2V0XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgICA8Yj57eyAkdCgnYXBwLnNldHRpbmcubGFiZWwuY2FtZXJhX2Z1bGxzY3JlZW5fYWN0aW9uLnRpdGxlJykgfX08L2I+XG4gICAgICAgICAgICA8c3Bhbj5FbWJlZCBrZWVwcyBDb250cm9sJ3MgY29udHJvbHMgb24gdG9wLiBSYXcgc3RyZWFtIG9wZW5zIHRoZSBjYW1lcmEncyBvd24gYWRkcmVzcy48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgICAgPHNlZy1waWNrZXJcbiAgICAgICAgICAgICAgOm9wdGlvbnM9XCJmdWxsc2NyZWVuXCJcbiAgICAgICAgICAgICAgOnZhbHVlPVwiZGVmYXVsdEZ1bGxzY3JlZW5BY3Rpb25cIlxuICAgICAgICAgICAgICA6bGFiZWw9XCIkdCgnYXBwLnNldHRpbmcubGFiZWwuY2FtZXJhX2Z1bGxzY3JlZW5fYWN0aW9uLnRpdGxlJylcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImNhbWVyYS1mdWxsc2NyZWVuXCJcbiAgICAgICAgICAgICAgQGlucHV0PVwiZGVmYXVsdEZ1bGxzY3JlZW5BY3Rpb24gPSAkZXZlbnRcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX3Jvd1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtMy1zZXRfX2xhYmVsXCI+XG4gICAgICAgICAgICA8Yj5DYW1lcmEgb24gT3ZlcnZpZXc8L2I+XG4gICAgICAgICAgICA8c3Bhbj5TZXQgaW4gR2VuZXJhbCwgd2l0aCB0aGUgM0Qgdmlldy48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm0zLXNldF9fY29udHJvbFwiPlxuICAgICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICAgIDp0bz1cImdlbmVyYWxUb1wiXG4gICAgICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwiY2FtZXJhLW92ZXJ2aWV3LWxpbmtcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7eyBvdmVydmlld09uID8gJ09uJyA6ICdPZmYnIH19XG4gICAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgICAgbmFtZT1cImNoZXZyb25SaWdodFwiXG4gICAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IE5ld1dlYmNhbUNvbmZpZywgV2ViY2FtQ29uZmlnLCBXZWJjYW1TZXJ2aWNlIH0gZnJvbSAnQC9zdG9yZS93ZWJjYW1zL3R5cGVzJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB7IG1vdmVDYW1lcmEgfSBmcm9tICdAL3NlcnZpY2VzL2NhbWVyYS9vcmRlcidcbmltcG9ydCB7IFNUUkVBTV9UWVBFUywgbmV3Q2FtZXJhLCBwaWN0dXJlRmFjdHMsIHN0cmVhbUxpbmUsIHN0cmVhbVR5cGVLZXkgfSBmcm9tICdAL3NlcnZpY2VzL2NhbWVyYS90eXBlcydcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCBTZWdQaWNrZXIgZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvU2VnUGlja2VyLnZ1ZSdcbmltcG9ydCBUb2dnbGVTd2l0Y2ggZnJvbSAnQC9jb21wb25lbnRzL2NvbnRyb2wvVG9nZ2xlU3dpdGNoLnZ1ZSdcbmltcG9ydCBDYW1lcmFEZXRhaWwgZnJvbSAnLi9DYW1lcmFEZXRhaWwudnVlJ1xuaW1wb3J0IENhbWVyYVRodW1iIGZyb20gJy4vQ2FtZXJhVGh1bWIudnVlJ1xuXG4vKipcbiAqIFNldHRpbmdzID4gQ2FtZXJhczogdGhlIGNhbWVyYXMsIGVhY2ggd2l0aCBhIGxpdmUgdGh1bWJuYWlsLCBpbiBhbiBvcmRlclxuICogdGhhdCBpcyBzYXZlZCBvbiB0aGUgcHJpbnRlciAoYSBVSSBzZXR0aW5nLCBgY2FtZXJhT3JkZXJgOyBNb29ucmFrZXIncyBvd25cbiAqIHdlYmNhbSByZWNvcmRzIGFyZSB1bnRvdWNoZWQpLiBBIGNhbWVyYSBvcGVucyBpbnRvIGl0cyBvd24gdmlldyB3aXRoIGFcbiAqIGxhcmdlIHByZXZpZXc7IGFkZGluZyBzdGFydHMgd2l0aCB0aGUgc3RyZWFtIHR5cGVzLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBDYW1lcmFEZXRhaWwsIENhbWVyYVRodW1iLCBTZWdQaWNrZXIsIFRvZ2dsZVN3aXRjaCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYW1lcmFTZXR0aW5ncyBleHRlbmRzIFZ1ZSB7XG4gIGdldCBmdWxsc2NyZWVuICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgeyB2YWx1ZTogJ2VtYmVkJywgbGFiZWw6IHRoaXMuJHQoJ2FwcC5zZXR0aW5nLmxhYmVsLmNhbWVyYV9mdWxsc2NyZWVuX2FjdGlvbi5lbWJlZCcpIGFzIHN0cmluZyB9LFxuICAgICAgeyB2YWx1ZTogJ3Jhd3N0cmVhbScsIGxhYmVsOiB0aGlzLiR0KCdhcHAuc2V0dGluZy5sYWJlbC5jYW1lcmFfZnVsbHNjcmVlbl9hY3Rpb24ucmF3c3RyZWFtJykgYXMgc3RyaW5nIH1cbiAgICBdXG4gIH1cblxuICByZWFkb25seSB0eXBlcyA9IFNUUkVBTV9UWVBFU1xuXG4gIHZpZXc6ICdsaXN0JyB8ICd0eXBlcycgfCAnZGV0YWlsJyA9ICdsaXN0J1xuXG4gIC8qKiBUaGUgaGVhZGVyJ3MgXCJBZGQgYSBjYW1lcmFcIiBvcGVucyB0aGlzIHBhZ2Ugd2l0aCA/YWRkPTE6IHN0YXJ0IGF0IHRoZSBzdHJlYW0gdHlwZXMuICovXG4gIGNyZWF0ZWQgKCkge1xuICAgIHRoaXMub3BlbkZyb21IZWFkZXIoKVxuICB9XG5cbiAgQFdhdGNoKCckcm91dGUucXVlcnkuYWRkJylcbiAgb3BlbkZyb21IZWFkZXIgKCkge1xuICAgIGlmICh0aGlzLiRyb3V0ZS5xdWVyeS5hZGQpIHtcbiAgICAgIHRoaXMudmlldyA9ICd0eXBlcydcbiAgICAgIHRoaXMuJHJvdXRlci5yZXBsYWNlKHsgcGF0aDogdGhpcy4kcm91dGUucGF0aCwgaGFzaDogdGhpcy4kcm91dGUuaGFzaCB9KS5jYXRjaCgoKSA9PiB7fSlcbiAgICB9XG4gIH1cblxuICBlZGl0aW5nOiBXZWJjYW1Db25maWcgfCBOZXdXZWJjYW1Db25maWcgfCBudWxsID0gbnVsbFxuICBlZGl0S2V5ID0gMFxuICBkcmFnSW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsXG4gIG92ZXJJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuICBnZXQgY2FtZXJhcyAoKTogV2ViY2FtQ29uZmlnW10ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWyd3ZWJjYW1zL2dldFdlYmNhbXMnXSBhcyBXZWJjYW1Db25maWdbXVxuICB9XG5cbiAgLyoqIFRoZSBjYW1lcmEgdGhhdCBvcGVucyBmaXJzdDogdGhlIGZpcnN0IG9uZSB0aGF0IGlzIHNob3duLiAqL1xuICBnZXQgZmlyc3RTaG93biAoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYW1lcmFzLmZpbmQoYyA9PiBjLmVuYWJsZWQgIT09IGZhbHNlKT8udWlkXG4gIH1cblxuICBsaW5lIChjYW1lcmE6IFdlYmNhbUNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3Qga2V5ID0gc3RyZWFtVHlwZUtleShjYW1lcmEuc2VydmljZSlcbiAgICByZXR1cm4gc3RyZWFtTGluZShjYW1lcmEsIGtleSA/IHRoaXMuJHQoa2V5KSBhcyBzdHJpbmcgOiBjYW1lcmEuc2VydmljZSA9PT0gJ2RldmljZScgPyAnVGhpcyBkZXZpY2UnIDogJ1Vua25vd24gdHlwZScpXG4gIH1cblxuICBmYWN0cyAoY2FtZXJhOiBXZWJjYW1Db25maWcpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHBpY3R1cmVGYWN0cyhjYW1lcmEpXG4gIH1cblxuICBvcGVuIChjYW1lcmE6IFdlYmNhbUNvbmZpZykge1xuICAgIHRoaXMuZWRpdGluZyA9IHsgLi4uY2FtZXJhIH1cbiAgICB0aGlzLmVkaXRLZXkrK1xuICAgIHRoaXMudmlldyA9ICdkZXRhaWwnXG4gIH1cblxuICBzdGFydE5ldyAoc2VydmljZTogV2ViY2FtU2VydmljZSkge1xuICAgIHRoaXMuZWRpdGluZyA9IG5ld0NhbWVyYShzZXJ2aWNlLCBHbG9iYWxzLkRFRkFVTFRTLkNBTUVSQV9VUkxfU1RSRUFNLCBHbG9iYWxzLkRFRkFVTFRTLkNBTUVSQV9VUkxfU05BUFNIT1QpXG4gICAgdGhpcy5lZGl0S2V5KytcbiAgICB0aGlzLnZpZXcgPSAnZGV0YWlsJ1xuICB9XG5cbiAgaGFuZGxlU2F2ZSAoY2FtZXJhOiBXZWJjYW1Db25maWcpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnd2ViY2Ftcy91cGRhdGVXZWJjYW0nLCBjYW1lcmEpXG4gICAgdGhpcy52aWV3ID0gJ2xpc3QnXG4gIH1cblxuICBzZXRFbmFibGVkIChjYW1lcmE6IFdlYmNhbUNvbmZpZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCd3ZWJjYW1zL3VwZGF0ZVdlYmNhbScsIHsgLi4uY2FtZXJhLCBlbmFibGVkIH0pXG4gIH1cblxuICBhc3luYyBoYW5kbGVSZW1vdmUgKCkge1xuICAgIGNvbnN0IGNhbWVyYSA9IHRoaXMuZWRpdGluZyBhcyBXZWJjYW1Db25maWcgfCBudWxsXG4gICAgaWYgKCFjYW1lcmE/LnVpZCkgcmV0dXJuXG4gICAgY29uc3Qgc3VyZSA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oYCR7Y2FtZXJhLm5hbWV9IGlzIHJlbW92ZWQgZnJvbSBDb250cm9sLiBUaGUgY2FtZXJhIGl0c2VsZiBpc24ndCB0b3VjaGVkLCBhbmQgeW91IGNhbiBhZGQgaXQgYWdhaW4gYnkgaXRzIGFkZHJlc3MuYCwge1xuICAgICAgdGl0bGU6IGBSZW1vdmUgJHtjYW1lcmEubmFtZX0/YCxcbiAgICAgIGJ1dHRvblRydWVUZXh0OiAnUmVtb3ZlJyxcbiAgICAgIGRhbmdlcjogdHJ1ZVxuICAgIH0pXG4gICAgaWYgKCFzdXJlKSByZXR1cm5cbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnd2ViY2Ftcy9yZW1vdmVXZWJjYW0nLCBjYW1lcmEudWlkKVxuICAgIHRoaXMudmlldyA9ICdsaXN0J1xuICB9XG5cbiAgLyoqIE1vdmVzIGEgY2FtZXJhIGBzdGVwYCBwbGFjZXMgdXAgKC0xKSBvciBkb3duICgxKSBhbmQgc2F2ZXMgdGhlIG9yZGVyLiAqL1xuICBtb3ZlQnkgKGluZGV4OiBudW1iZXIsIHN0ZXA6IG51bWJlcikge1xuICAgIGNvbnN0IHRvID0gaW5kZXggKyBzdGVwXG4gICAgaWYgKHRvIDwgMCB8fCB0byA+PSB0aGlzLmNhbWVyYXMubGVuZ3RoKSByZXR1cm5cbiAgICBjb25zdCB1aWQgPSB0aGlzLmNhbWVyYXNbaW5kZXhdLnVpZFxuICAgIGNvbnN0IGZvY3VzZWQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuICAgIGNvbnN0IGtpbmQgPSBmb2N1c2VkICYmIHRoaXMuJGVsLmNvbnRhaW5zKGZvY3VzZWQpID8gKGZvY3VzZWQuZGF0YXNldC50aWQgPz8gJycpLnNwbGl0KCctJylbMV0gOiAnJ1xuICAgIHRoaXMuc2F2ZU9yZGVyKG1vdmVDYW1lcmEodGhpcy5jYW1lcmFzLCBpbmRleCwgdG8pKVxuICAgIC8vIFRoZSByb3cgbW92ZWQsIG5vdCB0aGUga2V5czoga2VlcCB0aGUgZm9jdXMgb24gdGhlIHNhbWUgY2FtZXJhJ3MgY29udHJvbCwgZm91bmQgYnkgdWlkLlxuICAgIGlmIChraW5kKSB7XG4gICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xzID0gQXJyYXkuZnJvbSh0aGlzLiRlbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihgW2RhdGEtdGlkXj1cImNhbWVyYS0ke2tpbmR9LVwiXWApKVxuICAgICAgICBjb250cm9scy5maW5kKGMgPT4gYy5kYXRhc2V0LmNhbSA9PT0gdWlkKT8uZm9jdXMoKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBzYXZlT3JkZXIgKG9yZGVyOiBzdHJpbmdbXSkge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLmdlbmVyYWwuY2FtZXJhT3JkZXInLFxuICAgICAgdmFsdWU6IG9yZGVyLFxuICAgICAgc2VydmVyOiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIG9uRHJhZ1N0YXJ0IChpbmRleDogbnVtYmVyLCBldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgdGhpcy5kcmFnSW5kZXggPSBpbmRleFxuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnXG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIFN0cmluZyhpbmRleCkpXG4gICAgfVxuICB9XG5cbiAgb25EcmFnT3ZlciAoaW5kZXg6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmRyYWdJbmRleCAhPT0gbnVsbCkgdGhpcy5vdmVySW5kZXggPSBpbmRleFxuICB9XG5cbiAgb25Ecm9wIChpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZHJhZ0luZGV4ICE9PSBudWxsICYmIHRoaXMuZHJhZ0luZGV4ICE9PSBpbmRleCkge1xuICAgICAgdGhpcy5zYXZlT3JkZXIobW92ZUNhbWVyYSh0aGlzLmNhbWVyYXMsIHRoaXMuZHJhZ0luZGV4LCBpbmRleCkpXG4gICAgfVxuICAgIHRoaXMub25EcmFnRW5kKClcbiAgfVxuXG4gIG9uRHJhZ0VuZCAoKSB7XG4gICAgdGhpcy5kcmFnSW5kZXggPSBudWxsXG4gICAgdGhpcy5vdmVySW5kZXggPSBudWxsXG4gIH1cblxuICBnZXQgZ2VuZXJhbFRvICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpfSNnZW5lcmFsYFxuICB9XG5cbiAgZ2V0IG92ZXJ2aWV3T24gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLm92ZXJ2aWV3Q2FtZXJhVG9nZ2xlICE9PSBmYWxzZVxuICB9XG5cbiAgZ2V0IGRlZmF1bHRGdWxsc2NyZWVuQWN0aW9uICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmNhbWVyYUZ1bGxzY3JlZW5BY3Rpb25cbiAgfVxuXG4gIHNldCBkZWZhdWx0RnVsbHNjcmVlbkFjdGlvbiAodmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25maWcvc2F2ZUJ5UGF0aCcsIHtcbiAgICAgIHBhdGg6ICd1aVNldHRpbmdzLmdlbmVyYWwuY2FtZXJhRnVsbHNjcmVlbkFjdGlvbicsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5jYW1zX19oZWFkIC5tMy1zZXRfX3RpdGxlIHtcbiAgICBtYXJnaW46IDA7XG4gIH1cblxuICAuY2Ftc19fcm93IHtcbiAgICBnYXA6IDEwcHg7XG4gICAgcGFkZGluZzogMTJweCAwO1xuICB9XG5cbiAgLmNhbXNfX3Jvdy0tb3ZlciB7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAycHggMCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5jYW1zX19ncmlwIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGZsZXg6IG5vbmU7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAzcHggM3B4O1xuICAgIGdhcDogM3B4O1xuICAgIHBhZGRpbmc6IDEycHggOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlLCB2YXIoLS1tM2QtdGV4dC1tdXRlZCkpO1xuICAgIGN1cnNvcjogZ3JhYjtcblxuICAgIGkge1xuICAgICAgd2lkdGg6IDNweDtcbiAgICAgIGhlaWdodDogM3B4O1xuICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgYmFja2dyb3VuZDogY3VycmVudGNvbG9yO1xuICAgIH1cblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7XG4gICAgICBvdXRsaW5lOiAycHggc29saWQgdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLmNhbXNfX29wZW4ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMSAxIGF1dG87XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDE0cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gIH1cblxuICAuY2Ftc19fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi13aWR0aDogMDtcblxuICAgIGIge1xuICAgICAgZm9udC1zaXplOiAxNXB4O1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG5cbiAgICA+IHNwYW4ge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cblxuICAuY2Ftc19fcGlsbHMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogNnB4O1xuICAgIG1hcmdpbi10b3A6IDZweDtcbiAgfVxuXG4gIC5jYW1zX19waWxsIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNHB4O1xuICAgIHBhZGRpbmc6IDJweCAxMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cblxuICAuY2Ftc19fcGlsbC0tYWNjIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5jYW1zX19zaWRlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gIH1cblxuICAuY2Ftc19fbW92ZSB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblxuICAgIGJ1dHRvbiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgIHBhZGRpbmc6IDNweCA4cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgICAmOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyKTtcbiAgICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICAgIH1cblxuICAgICAgJjpkaXNhYmxlZCB7XG4gICAgICAgIG9wYWNpdHk6IDAuMztcbiAgICAgICAgY3Vyc29yOiBkZWZhdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC5jYW1zX19oaW50IHtcbiAgICBtYXJnaW46IDhweCAwIDhweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5jYW1zX19ncm91cCB7XG4gICAgbWFyZ2luOiAyMHB4IDAgOHB4IDRweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjFlbTtcbiAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICB9XG5cbiAgLmNhbXNfX3R5cGVzIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmcjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiA4cHggMCAxMnB4O1xuICB9XG5cbiAgLmNhbXNfX3R5cGUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBwYWRkaW5nOiAxMHB4IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuXG4gICAgYiB7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgIH1cblxuICAgICY6aG92ZXIsXG4gICAgJjpmb2N1cy12aXNpYmxlLFxuICAgICYtLW9uIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gICAgfVxuICB9XG5cbiAgLmNhbXNfX2VtcHR5IHtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIHBhZGRpbmc6IDM2cHggMjRweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5cbiAgICBwIHtcbiAgICAgIG1hcmdpbjogMCAwIDEycHg7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgIH1cbiAgfVxuXG4gIC5jYW1zX19lbXB0eS1pY29uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiA1NnB4O1xuICAgIGhlaWdodDogNTZweDtcbiAgICBtYXJnaW4tYm90dG9tOiA2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDc2MHB4KSB7XG4gICAgLmNhbXNfX3R5cGVzIHtcbiAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyO1xuICAgIH1cblxuICAgIC5jYW1zX19yb3cge1xuICAgICAgZmxleC13cmFwOiBub3dyYXA7XG4gICAgfVxuXG4gICAgLmNhbXNfX3N3aXRjaCB7XG4gICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL2NhbWVyYXMvQ2FtZXJhU2V0dGluZ3MudnVlIn0=