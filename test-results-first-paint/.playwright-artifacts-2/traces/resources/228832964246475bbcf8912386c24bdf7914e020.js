/* unplugin-vue-components disabled */import { VTextField as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VLayout as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_13 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_12 from "/src/components/ui/AppBtn.vue";
import { VBtnToggle as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_10 from "/src/components/ui/AppIroColorPicker.vue";
import __unplugin_components_9 from "/src/components/ui/AppIroColorPicker.vue";
import { VLayout as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardTitle as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCard as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VMenu as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Vue, Prop, Ref, VModel, PropSync, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import iro from "/.vite-e2e/4291/deps/@jaames_iro.js?v=9b9fafc7";
import { IroColor } from "/.vite-e2e/4291/deps/@irojs_iro-core.js?v=9b9fafc7";
let AppColorPicker = class extends Vue {
  inputPrimaryColor;
  inputWhiteValue;
  title;
  dot;
  supportedChannels;
  card;
  lastPointerPosition = { x: 0, y: 0 };
  get primaryOptions() {
    return {
      color: this.inputPrimaryColor,
      width: 208,
      layout: [
        {
          component: iro.ui.Wheel,
          options: {
            wheelLightness: false,
            wheelAngle: 270,
            wheelDirection: "clockwise"
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: "value"
          }
        }
      ]
    };
  }
  get whiteOptions() {
    return {
      color: this.inputWhiteColor,
      width: 208,
      layout: [
        {
          component: iro.ui.Slider,
          options: {
            sliderType: "value"
          }
        }
      ]
    };
  }
  currentPrimaryColor = new IroColor();
  currentWhiteColor = new IroColor();
  onValue(value) {
    this.currentPrimaryColor.set(value);
  }
  onWhite(value) {
    this.currentWhiteColor.set(this.valueToHexColor(value));
  }
  get currentRed() {
    return this.convertValueRange(this.currentPrimaryColor.red, "out");
  }
  set currentRed(value) {
    this.currentPrimaryColor.red = this.convertValueRange(value, "in");
  }
  get currentGreen() {
    return this.convertValueRange(this.currentPrimaryColor.green, "out");
  }
  set currentGreen(value) {
    this.currentPrimaryColor.green = this.convertValueRange(value, "in");
  }
  get currentBlue() {
    return this.convertValueRange(this.currentPrimaryColor.blue, "out");
  }
  set currentBlue(value) {
    this.currentPrimaryColor.blue = this.convertValueRange(value, "in");
  }
  get currentWhite() {
    return this.convertValueRange(this.currentWhiteColor.red, "out");
  }
  set currentWhite(value) {
    this.currentWhiteColor.set(this.valueToHexColor(this.convertValueRange(value, "in")));
  }
  get inputWhiteColor() {
    return this.valueToHexColor(this.inputWhiteValue);
  }
  get controlColor() {
    return this.supportedChannels === "W" ? this.inputWhiteColor : this.inputPrimaryColor;
  }
  get valueRange() {
    return this.$store.state.config.uiSettings.general.colorPickerValueRange;
  }
  set valueRange(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.general.colorPickerValueRange",
      value,
      server: true
    });
  }
  handleSubmitPrimary() {
    this.inputPrimaryColor = this.currentPrimaryColor.hexString;
  }
  handleSubmitWhite() {
    this.inputWhiteValue = this.currentWhiteColor.red;
  }
  handleReset() {
    this.currentPrimaryColor.set(this.inputPrimaryColor);
    this.currentWhiteColor.set(this.inputWhiteColor);
  }
  valueToHexColor(value) {
    value = Math.round(Math.min(Math.max(value, 0), 255));
    return `#${value.toString(16).padStart(2, "0").repeat(3)}`;
  }
  created() {
    this.handleReset();
  }
  startMouseDrag(event) {
    this.lastPointerPosition = { x: event.clientX, y: event.clientY };
    window.addEventListener("mousemove", this.mouseMove);
    window.addEventListener("mouseup", this.stopMouseDrag);
  }
  stopMouseDrag() {
    window.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("mouseup", this.stopMouseDrag);
  }
  startTouchDrag(event) {
    this.lastPointerPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  relativeMove(newPosition) {
    const parent = this.card.$el.parentElement;
    if (parent) {
      parent.style.left = parseFloat(parent.style.left) + (newPosition.x - this.lastPointerPosition.x) + "px";
      parent.style.top = parseFloat(parent.style.top) + (newPosition.y - this.lastPointerPosition.y) + "px";
    }
  }
  mouseMove(event) {
    const newPosition = { x: event.clientX, y: event.clientY };
    this.relativeMove(newPosition);
    this.lastPointerPosition = newPosition;
  }
  touchMove(event) {
    event.preventDefault();
    const newPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    this.relativeMove(newPosition);
    this.lastPointerPosition = newPosition;
  }
  convertValueRange(value, direction) {
    if (this.valueRange === "absolute") return value;
    let factor = 1;
    if (this.valueRange === "percentage") factor = 255;
    if (direction === "out") factor = 1 / factor;
    return Math.round(value * factor * 1e3) / 1e3;
  }
};
__decorateClass([
  VModel({ type: String, required: true })
], AppColorPicker.prototype, "inputPrimaryColor", 2);
__decorateClass([
  PropSync("white", { type: Number, default: 0 })
], AppColorPicker.prototype, "inputWhiteValue", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], AppColorPicker.prototype, "title", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppColorPicker.prototype, "dot", 2);
__decorateClass([
  Prop({ type: String, default: "RGB" })
], AppColorPicker.prototype, "supportedChannels", 2);
__decorateClass([
  Ref("card")
], AppColorPicker.prototype, "card", 2);
__decorateClass([
  Watch("value")
], AppColorPicker.prototype, "onValue", 1);
__decorateClass([
  Watch("white")
], AppColorPicker.prototype, "onWhite", 1);
AppColorPicker = __decorateClass([
  Component({})
], AppColorPicker);
const _sfc_main = AppColorPicker;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "bottom": "", "left": "", "max-width": "260", "close-on-content-click": false }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [!_vm.dot ? _c(__unplugin_components_1, _vm._g(_vm._b({ attrs: { "color": _vm.controlColor, "outlined": "", "small": "" } }, "v-btn", attrs, false), on), [_vm._v(" " + _vm._s(_vm.title) + " ")]) : _c(__unplugin_components_2, _vm._g(_vm._b({ attrs: { "color": _vm.controlColor } }, "v-icon", attrs, false), on), [_vm._v(" $circle ")])];
  } }]) }, [_c(__unplugin_components_3, { ref: "card" }, [_vm.title ? _c(__unplugin_components_4, { staticClass: "card-heading mb-2", staticStyle: { "cursor": "move", "user-select": "none" }, on: { "mousedown": _vm.startMouseDrag, "touchstart": _vm.startTouchDrag, "touchmove": _vm.touchMove } }, [_vm._v(" " + _vm._s(_vm.title) + " ")]) : _vm._e(), _c(__unplugin_components_5, [_vm.supportedChannels !== "W" ? _c(__unplugin_components_6, { attrs: { "color": _vm.currentPrimaryColor.hexString, "large": "" } }, [_vm._v(" $circle ")]) : _vm._e(), _vm.supportedChannels.includes("W") ? _c(__unplugin_components_7, { attrs: { "color": _vm.currentWhiteColor.hexString, "large": "" } }, [_vm._v(" $circle ")]) : _vm._e(), _c(__unplugin_components_8, { attrs: { "align-center": "", "column": "" } }, [_vm.supportedChannels !== "W" ? _c(__unplugin_components_9, { attrs: { "options": _vm.primaryOptions }, on: { "input": _vm.handleSubmitPrimary }, model: { value: _vm.currentPrimaryColor.hexString, callback: function($$v) {
    _vm.$set(_vm.currentPrimaryColor, "hexString", $$v);
  }, expression: "currentPrimaryColor.hexString" } }) : _vm._e(), _vm.supportedChannels.includes("W") ? _c(__unplugin_components_10, { staticClass: "mt-4", attrs: { "options": _vm.whiteOptions }, on: { "input": _vm.handleSubmitWhite }, model: { value: _vm.currentWhiteColor.hexString, callback: function($$v) {
    _vm.$set(_vm.currentWhiteColor, "hexString", $$v);
  }, expression: "currentWhiteColor.hexString" } }) : _vm._e()], 1), _c("div", { staticClass: "text-right mt-4 mr-1" }, [_c(__unplugin_components_11, { attrs: { "mandatory": "" }, model: { value: _vm.valueRange, callback: function($$v) {
    _vm.valueRange = $$v;
  }, expression: "valueRange" } }, [_c(__unplugin_components_12, { attrs: { "x-small": "", "value": "absolute" } }, [_vm._v(" 0..255 ")]), _c(__unplugin_components_13, { attrs: { "x-small": "", "value": "percentage" } }, [_vm._v(" 0..1 ")])], 1)], 1), _c(__unplugin_components_14, { staticClass: "mt-2", attrs: { "justify-space-between": "" } }, [_vm.supportedChannels !== "W" ? _c("div", { staticClass: "color-input" }, [_c(__unplugin_components_15, { attrs: { "dense": "", "hide-details": "", "outlined": "" }, on: { "blur": _vm.handleReset, "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.handleSubmitPrimary.apply(null, arguments);
  } }, model: { value: _vm.currentRed, callback: function($$v) {
    _vm.currentRed = _vm._n($$v);
  }, expression: "currentRed" } }), _c("div", [_vm._v("R")])], 1) : _vm._e(), _vm.supportedChannels !== "W" ? _c("div", { staticClass: "color-input" }, [_c(__unplugin_components_16, { attrs: { "dense": "", "hide-details": "", "outlined": "" }, on: { "blur": _vm.handleReset, "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.handleSubmitPrimary.apply(null, arguments);
  } }, model: { value: _vm.currentGreen, callback: function($$v) {
    _vm.currentGreen = _vm._n($$v);
  }, expression: "currentGreen" } }), _c("div", [_vm._v("G")])], 1) : _vm._e(), _vm.supportedChannels !== "W" ? _c("div", { staticClass: "color-input" }, [_c(__unplugin_components_17, { attrs: { "dense": "", "hide-details": "", "outlined": "" }, on: { "blur": _vm.handleReset, "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.handleSubmitPrimary.apply(null, arguments);
  } }, model: { value: _vm.currentBlue, callback: function($$v) {
    _vm.currentBlue = _vm._n($$v);
  }, expression: "currentBlue" } }), _c("div", [_vm._v("B")])], 1) : _vm._e(), _vm.supportedChannels.includes("W") ? _c("div", { staticClass: "color-input" }, [_c(__unplugin_components_18, { attrs: { "dense": "", "hide-details": "", "outlined": "" }, on: { "blur": _vm.handleReset, "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.handleSubmitWhite.apply(null, arguments);
  } }, model: { value: _vm.currentWhite, callback: function($$v) {
    _vm.currentWhite = _vm._n($$v);
  }, expression: "currentWhite" } }), _c("div", [_vm._v("W")])], 1) : _vm._e()])], 1)], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/AppColorPicker.vue?vue&type=style&index=0&scoped=63357bdc&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "63357bdc",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppColorPicker.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtS0E7QUFDQTtBQUNBO0FBVUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBLFdBQ0EsaUNBQ0EsdUJBQ0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFDQTtBQW5NQTtBQUFBLEVBREE7QUFBQSxHQURBLGVBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLGVBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLGVBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLGVBV0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWJBLGVBY0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWhCQSxlQWlCQTtBQThDQTtBQUFBLEVBREE7QUFBQSxHQTlEQSxlQStEQTtBQUtBO0FBQUEsRUFEQTtBQUFBLEdBbkVBLGVBb0VBO0FBcEVBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFwcENvbG9yUGlja2VyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LW1lbnVcbiAgICBib3R0b21cbiAgICBsZWZ0XG4gICAgbWF4LXdpZHRoPVwiMjYwXCJcbiAgICA6Y2xvc2Utb24tY29udGVudC1jbGljaz1cImZhbHNlXCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgPHYtYnRuXG4gICAgICAgIHYtaWY9XCIhZG90XCJcbiAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICA6Y29sb3I9XCJjb250cm9sQ29sb3JcIlxuICAgICAgICBvdXRsaW5lZFxuICAgICAgICBzbWFsbFxuICAgICAgICB2LW9uPVwib25cIlxuICAgICAgPlxuICAgICAgICB7eyB0aXRsZSB9fVxuICAgICAgPC92LWJ0bj5cblxuICAgICAgPHYtaWNvblxuICAgICAgICB2LWVsc2VcbiAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICA6Y29sb3I9XCJjb250cm9sQ29sb3JcIlxuICAgICAgICB2LW9uPVwib25cIlxuICAgICAgPlxuICAgICAgICAkY2lyY2xlXG4gICAgICA8L3YtaWNvbj5cbiAgICA8L3RlbXBsYXRlPlxuICAgIDx2LWNhcmQgcmVmPVwiY2FyZFwiPlxuICAgICAgPHYtY2FyZC10aXRsZVxuICAgICAgICB2LWlmPVwidGl0bGVcIlxuICAgICAgICBjbGFzcz1cImNhcmQtaGVhZGluZyBtYi0yXCJcbiAgICAgICAgc3R5bGU9XCJjdXJzb3I6IG1vdmU7IHVzZXItc2VsZWN0OiBub25lO1wiXG4gICAgICAgIEBtb3VzZWRvd249XCJzdGFydE1vdXNlRHJhZ1wiXG4gICAgICAgIEB0b3VjaHN0YXJ0PVwic3RhcnRUb3VjaERyYWdcIlxuICAgICAgICBAdG91Y2htb3ZlPVwidG91Y2hNb3ZlXCJcbiAgICAgID5cbiAgICAgICAge3sgdGl0bGUgfX1cbiAgICAgIDwvdi1jYXJkLXRpdGxlPlxuICAgICAgPHYtY2FyZC10ZXh0PlxuICAgICAgICA8di1pY29uXG4gICAgICAgICAgdi1pZj1cInN1cHBvcnRlZENoYW5uZWxzICE9PSAnVydcIlxuICAgICAgICAgIDpjb2xvcj1cImN1cnJlbnRQcmltYXJ5Q29sb3IuaGV4U3RyaW5nXCJcbiAgICAgICAgICBsYXJnZVxuICAgICAgICA+XG4gICAgICAgICAgJGNpcmNsZVxuICAgICAgICA8L3YtaWNvbj5cblxuICAgICAgICA8di1pY29uXG4gICAgICAgICAgdi1pZj1cInN1cHBvcnRlZENoYW5uZWxzLmluY2x1ZGVzKCdXJylcIlxuICAgICAgICAgIDpjb2xvcj1cImN1cnJlbnRXaGl0ZUNvbG9yLmhleFN0cmluZ1wiXG4gICAgICAgICAgbGFyZ2VcbiAgICAgICAgPlxuICAgICAgICAgICRjaXJjbGVcbiAgICAgICAgPC92LWljb24+XG5cbiAgICAgICAgPHYtbGF5b3V0XG4gICAgICAgICAgYWxpZ24tY2VudGVyXG4gICAgICAgICAgY29sdW1uXG4gICAgICAgID5cbiAgICAgICAgICA8YXBwLWlyby1jb2xvci1waWNrZXJcbiAgICAgICAgICAgIHYtaWY9XCJzdXBwb3J0ZWRDaGFubmVscyAhPT0gJ1cnXCJcbiAgICAgICAgICAgIHYtbW9kZWw9XCJjdXJyZW50UHJpbWFyeUNvbG9yLmhleFN0cmluZ1wiXG4gICAgICAgICAgICA6b3B0aW9ucz1cInByaW1hcnlPcHRpb25zXCJcbiAgICAgICAgICAgIEBpbnB1dD1cImhhbmRsZVN1Ym1pdFByaW1hcnlcIlxuICAgICAgICAgIC8+XG5cbiAgICAgICAgICA8YXBwLWlyby1jb2xvci1waWNrZXJcbiAgICAgICAgICAgIHYtaWY9XCJzdXBwb3J0ZWRDaGFubmVscy5pbmNsdWRlcygnVycpXCJcbiAgICAgICAgICAgIHYtbW9kZWw9XCJjdXJyZW50V2hpdGVDb2xvci5oZXhTdHJpbmdcIlxuICAgICAgICAgICAgY2xhc3M9XCJtdC00XCJcbiAgICAgICAgICAgIDpvcHRpb25zPVwid2hpdGVPcHRpb25zXCJcbiAgICAgICAgICAgIEBpbnB1dD1cImhhbmRsZVN1Ym1pdFdoaXRlXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L3YtbGF5b3V0PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXJpZ2h0IG10LTQgbXItMVwiPlxuICAgICAgICAgIDx2LWJ0bi10b2dnbGVcbiAgICAgICAgICAgIHYtbW9kZWw9XCJ2YWx1ZVJhbmdlXCJcbiAgICAgICAgICAgIG1hbmRhdG9yeVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxhcHAtYnRuXG4gICAgICAgICAgICAgIHgtc21hbGxcbiAgICAgICAgICAgICAgdmFsdWU9XCJhYnNvbHV0ZVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDAuLjI1NVxuICAgICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgICAgeC1zbWFsbFxuICAgICAgICAgICAgICB2YWx1ZT1cInBlcmNlbnRhZ2VcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAwLi4xXG4gICAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgICAgPC92LWJ0bi10b2dnbGU+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDx2LWxheW91dFxuICAgICAgICAgIGNsYXNzPVwibXQtMlwiXG4gICAgICAgICAganVzdGlmeS1zcGFjZS1iZXR3ZWVuXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWlmPVwic3VwcG9ydGVkQ2hhbm5lbHMgIT09ICdXJ1wiXG4gICAgICAgICAgICBjbGFzcz1cImNvbG9yLWlucHV0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgICAgIHYtbW9kZWwubnVtYmVyPVwiY3VycmVudFJlZFwiXG4gICAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgICBAYmx1cj1cImhhbmRsZVJlc2V0XCJcbiAgICAgICAgICAgICAgQGtleXVwLmVudGVyLmV4YWN0PVwiaGFuZGxlU3VibWl0UHJpbWFyeVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGRpdj5SPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1pZj1cInN1cHBvcnRlZENoYW5uZWxzICE9PSAnVydcIlxuICAgICAgICAgICAgY2xhc3M9XCJjb2xvci1pbnB1dFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgICAgICB2LW1vZGVsLm51bWJlcj1cImN1cnJlbnRHcmVlblwiXG4gICAgICAgICAgICAgIGRlbnNlXG4gICAgICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgICAgICBvdXRsaW5lZFxuICAgICAgICAgICAgICBAYmx1cj1cImhhbmRsZVJlc2V0XCJcbiAgICAgICAgICAgICAgQGtleXVwLmVudGVyLmV4YWN0PVwiaGFuZGxlU3VibWl0UHJpbWFyeVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGRpdj5HPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1pZj1cInN1cHBvcnRlZENoYW5uZWxzICE9PSAnVydcIlxuICAgICAgICAgICAgY2xhc3M9XCJjb2xvci1pbnB1dFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICAgICAgICB2LW1vZGVsLm51bWJlcj1cImN1cnJlbnRCbHVlXCJcbiAgICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgICAgIEBibHVyPVwiaGFuZGxlUmVzZXRcIlxuICAgICAgICAgICAgICBAa2V5dXAuZW50ZXIuZXhhY3Q9XCJoYW5kbGVTdWJtaXRQcmltYXJ5XCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8ZGl2PkI8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWlmPVwic3VwcG9ydGVkQ2hhbm5lbHMuaW5jbHVkZXMoJ1cnKVwiXG4gICAgICAgICAgICBjbGFzcz1cImNvbG9yLWlucHV0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8di10ZXh0LWZpZWxkXG4gICAgICAgICAgICAgIHYtbW9kZWwubnVtYmVyPVwiY3VycmVudFdoaXRlXCJcbiAgICAgICAgICAgICAgZGVuc2VcbiAgICAgICAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgICAgIEBibHVyPVwiaGFuZGxlUmVzZXRcIlxuICAgICAgICAgICAgICBAa2V5dXAuZW50ZXIuZXhhY3Q9XCJoYW5kbGVTdWJtaXRXaGl0ZVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPGRpdj5XPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgICA8L3YtY2FyZC10ZXh0PlxuICAgIDwvdi1jYXJkPlxuICA8L3YtbWVudT5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSwgUHJvcCwgUmVmLCBWTW9kZWwsIFByb3BTeW5jLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgaXJvIGZyb20gJ0BqYWFtZXMvaXJvJ1xuaW1wb3J0IHsgSXJvQ29sb3IgfSBmcm9tICdAaXJvanMvaXJvLWNvcmUnXG5pbXBvcnQgdHlwZSB7IENvbG9yUGlja2VyUHJvcHMgfSBmcm9tICdAamFhbWVzL2lyby9kaXN0L0NvbG9yUGlja2VyJ1xuaW1wb3J0IHR5cGUgeyBDb2xvclBpY2tlclZhbHVlUmFuZ2UgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcblxuaW50ZXJmYWNlIFBvaW50ZXJQb3NpdGlvbiB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufVxuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwQ29sb3JQaWNrZXIgZXh0ZW5kcyBWdWUge1xuICBAVk1vZGVsKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KVxuICAgIGlucHV0UHJpbWFyeUNvbG9yITogc3RyaW5nXG5cbiAgQFByb3BTeW5jKCd3aGl0ZScsIHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0pXG4gICAgaW5wdXRXaGl0ZVZhbHVlITogbnVtYmVyXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGRvdD86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ1JHQicgfSlcbiAgcmVhZG9ubHkgc3VwcG9ydGVkQ2hhbm5lbHMhOiBzdHJpbmdcblxuICBAUmVmKCdjYXJkJylcbiAgcmVhZG9ubHkgY2FyZCE6IFZ1ZVxuXG4gIGxhc3RQb2ludGVyUG9zaXRpb246IFBvaW50ZXJQb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9XG5cbiAgZ2V0IHByaW1hcnlPcHRpb25zICgpOiBQYXJ0aWFsPENvbG9yUGlja2VyUHJvcHM+IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29sb3I6IHRoaXMuaW5wdXRQcmltYXJ5Q29sb3IsXG4gICAgICB3aWR0aDogMjA4LFxuICAgICAgbGF5b3V0OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjb21wb25lbnQ6IGlyby51aS5XaGVlbCxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB3aGVlbExpZ2h0bmVzczogZmFsc2UsXG4gICAgICAgICAgICB3aGVlbEFuZ2xlOiAyNzAsXG4gICAgICAgICAgICB3aGVlbERpcmVjdGlvbjogJ2Nsb2Nrd2lzZSdcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjb21wb25lbnQ6IGlyby51aS5TbGlkZXIsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgc2xpZGVyVHlwZTogJ3ZhbHVlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbiAgfVxuXG4gIGdldCB3aGl0ZU9wdGlvbnMgKCk6IFBhcnRpYWw8Q29sb3JQaWNrZXJQcm9wcz4ge1xuICAgIHJldHVybiB7XG4gICAgICBjb2xvcjogdGhpcy5pbnB1dFdoaXRlQ29sb3IsXG4gICAgICB3aWR0aDogMjA4LFxuICAgICAgbGF5b3V0OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjb21wb25lbnQ6IGlyby51aS5TbGlkZXIsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgc2xpZGVyVHlwZTogJ3ZhbHVlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbiAgfVxuXG4gIGN1cnJlbnRQcmltYXJ5Q29sb3IgPSBuZXcgSXJvQ29sb3IoKVxuICBjdXJyZW50V2hpdGVDb2xvciA9IG5ldyBJcm9Db2xvcigpXG5cbiAgQFdhdGNoKCd2YWx1ZScpXG4gIG9uVmFsdWUgKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnRQcmltYXJ5Q29sb3Iuc2V0KHZhbHVlKVxuICB9XG5cbiAgQFdhdGNoKCd3aGl0ZScpXG4gIG9uV2hpdGUgKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRXaGl0ZUNvbG9yLnNldCh0aGlzLnZhbHVlVG9IZXhDb2xvcih2YWx1ZSkpXG4gIH1cblxuICBnZXQgY3VycmVudFJlZCAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb252ZXJ0VmFsdWVSYW5nZSh0aGlzLmN1cnJlbnRQcmltYXJ5Q29sb3IucmVkLCAnb3V0JylcbiAgfVxuXG4gIHNldCBjdXJyZW50UmVkICh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5jdXJyZW50UHJpbWFyeUNvbG9yLnJlZCA9IHRoaXMuY29udmVydFZhbHVlUmFuZ2UodmFsdWUsICdpbicpXG4gIH1cblxuICBnZXQgY3VycmVudEdyZWVuICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvbnZlcnRWYWx1ZVJhbmdlKHRoaXMuY3VycmVudFByaW1hcnlDb2xvci5ncmVlbiwgJ291dCcpXG4gIH1cblxuICBzZXQgY3VycmVudEdyZWVuICh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5jdXJyZW50UHJpbWFyeUNvbG9yLmdyZWVuID0gdGhpcy5jb252ZXJ0VmFsdWVSYW5nZSh2YWx1ZSwgJ2luJylcbiAgfVxuXG4gIGdldCBjdXJyZW50Qmx1ZSAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb252ZXJ0VmFsdWVSYW5nZSh0aGlzLmN1cnJlbnRQcmltYXJ5Q29sb3IuYmx1ZSwgJ291dCcpXG4gIH1cblxuICBzZXQgY3VycmVudEJsdWUgKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRQcmltYXJ5Q29sb3IuYmx1ZSA9IHRoaXMuY29udmVydFZhbHVlUmFuZ2UodmFsdWUsICdpbicpXG4gIH1cblxuICBnZXQgY3VycmVudFdoaXRlICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvbnZlcnRWYWx1ZVJhbmdlKHRoaXMuY3VycmVudFdoaXRlQ29sb3IucmVkLCAnb3V0JylcbiAgfVxuXG4gIHNldCBjdXJyZW50V2hpdGUgKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLmN1cnJlbnRXaGl0ZUNvbG9yLnNldCh0aGlzLnZhbHVlVG9IZXhDb2xvcih0aGlzLmNvbnZlcnRWYWx1ZVJhbmdlKHZhbHVlLCAnaW4nKSkpXG4gIH1cblxuICBnZXQgaW5wdXRXaGl0ZUNvbG9yICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnZhbHVlVG9IZXhDb2xvcih0aGlzLmlucHV0V2hpdGVWYWx1ZSlcbiAgfVxuXG4gIGdldCBjb250cm9sQ29sb3IgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc3VwcG9ydGVkQ2hhbm5lbHMgPT09ICdXJ1xuICAgICAgICA/IHRoaXMuaW5wdXRXaGl0ZUNvbG9yXG4gICAgICAgIDogdGhpcy5pbnB1dFByaW1hcnlDb2xvclxuICAgIClcbiAgfVxuXG4gIGdldCB2YWx1ZVJhbmdlICgpOiBDb2xvclBpY2tlclZhbHVlUmFuZ2Uge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmNvbG9yUGlja2VyVmFsdWVSYW5nZVxuICB9XG5cbiAgc2V0IHZhbHVlUmFuZ2UgKHZhbHVlOiBDb2xvclBpY2tlclZhbHVlUmFuZ2UpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLmNvbG9yUGlja2VyVmFsdWVSYW5nZScsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBoYW5kbGVTdWJtaXRQcmltYXJ5ICgpIHtcbiAgICB0aGlzLmlucHV0UHJpbWFyeUNvbG9yID0gdGhpcy5jdXJyZW50UHJpbWFyeUNvbG9yLmhleFN0cmluZ1xuICB9XG5cbiAgaGFuZGxlU3VibWl0V2hpdGUgKCkge1xuICAgIHRoaXMuaW5wdXRXaGl0ZVZhbHVlID0gdGhpcy5jdXJyZW50V2hpdGVDb2xvci5yZWRcbiAgfVxuXG4gIGhhbmRsZVJlc2V0ICgpIHtcbiAgICB0aGlzLmN1cnJlbnRQcmltYXJ5Q29sb3Iuc2V0KHRoaXMuaW5wdXRQcmltYXJ5Q29sb3IpXG4gICAgdGhpcy5jdXJyZW50V2hpdGVDb2xvci5zZXQodGhpcy5pbnB1dFdoaXRlQ29sb3IpXG4gIH1cblxuICB2YWx1ZVRvSGV4Q29sb3IgKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHZhbHVlID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgMCksIDI1NSkpXG5cbiAgICByZXR1cm4gYCMke3ZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpLnJlcGVhdCgzKX1gXG4gIH1cblxuICBjcmVhdGVkICgpIHtcbiAgICB0aGlzLmhhbmRsZVJlc2V0KClcbiAgfVxuXG4gIHN0YXJ0TW91c2VEcmFnIChldmVudDogTW91c2VFdmVudCkge1xuICAgIHRoaXMubGFzdFBvaW50ZXJQb3NpdGlvbiA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5zdG9wTW91c2VEcmFnKVxuICB9XG5cbiAgc3RvcE1vdXNlRHJhZyAoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlKVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5zdG9wTW91c2VEcmFnKVxuICB9XG5cbiAgc3RhcnRUb3VjaERyYWcgKGV2ZW50OiBUb3VjaEV2ZW50KSB7XG4gICAgdGhpcy5sYXN0UG9pbnRlclBvc2l0aW9uID0geyB4OiBldmVudC50b3VjaGVzWzBdLmNsaWVudFgsIHk6IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSB9XG4gIH1cblxuICByZWxhdGl2ZU1vdmUgKG5ld1Bvc2l0aW9uOiBQb2ludGVyUG9zaXRpb24pIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLmNhcmQuJGVsLnBhcmVudEVsZW1lbnRcblxuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5zdHlsZS5sZWZ0ID0gKHBhcnNlRmxvYXQocGFyZW50LnN0eWxlLmxlZnQpICsgKG5ld1Bvc2l0aW9uLnggLSB0aGlzLmxhc3RQb2ludGVyUG9zaXRpb24ueCkpICsgJ3B4J1xuICAgICAgcGFyZW50LnN0eWxlLnRvcCA9IChwYXJzZUZsb2F0KHBhcmVudC5zdHlsZS50b3ApICsgKG5ld1Bvc2l0aW9uLnkgLSB0aGlzLmxhc3RQb2ludGVyUG9zaXRpb24ueSkpICsgJ3B4J1xuICAgIH1cbiAgfVxuXG4gIG1vdXNlTW92ZSAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBjb25zdCBuZXdQb3NpdGlvbiA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9XG4gICAgdGhpcy5yZWxhdGl2ZU1vdmUobmV3UG9zaXRpb24pXG4gICAgdGhpcy5sYXN0UG9pbnRlclBvc2l0aW9uID0gbmV3UG9zaXRpb25cbiAgfVxuXG4gIHRvdWNoTW92ZSAoZXZlbnQ6IFRvdWNoRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgbmV3UG9zaXRpb24gPSB7IHg6IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCwgeTogZXZlbnQudG91Y2hlc1swXS5jbGllbnRZIH1cbiAgICB0aGlzLnJlbGF0aXZlTW92ZShuZXdQb3NpdGlvbilcbiAgICB0aGlzLmxhc3RQb2ludGVyUG9zaXRpb24gPSBuZXdQb3NpdGlvblxuICB9XG5cbiAgY29udmVydFZhbHVlUmFuZ2UgKHZhbHVlOiBudW1iZXIsIGRpcmVjdGlvbjogJ2luJyB8ICdvdXQnKSB7XG4gICAgaWYgKHRoaXMudmFsdWVSYW5nZSA9PT0gJ2Fic29sdXRlJykgcmV0dXJuIHZhbHVlXG5cbiAgICBsZXQgZmFjdG9yID0gMVxuICAgIGlmICh0aGlzLnZhbHVlUmFuZ2UgPT09ICdwZXJjZW50YWdlJykgZmFjdG9yID0gMjU1XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gJ291dCcpIGZhY3RvciA9IDEgLyBmYWN0b3JcblxuICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogZmFjdG9yICogMTAwMCkgLyAxMDAwXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIEBpbXBvcnQgJ3Z1ZXRpZnkvc3JjL3N0eWxlcy9zdHlsZXMuc2Fzcyc7XG5cbiAgLmNvbG9yLWlucHV0IGRpdiB7XG4gICAgbWFyZ2luOiAwIDJweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICAudGhlbWUtLWxpZ2h0IC5jb2xvci1pbnB1dCBkaXY6bm90KDpmaXJzdC1jaGlsZCkge1xuICAgIGNvbG9yOiByZ2JhKG1hcC1nZXQoJG1hdGVyaWFsLWxpZ2h0LCAndGV4dC1jb2xvcicpLCAwLjQ1KTtcbiAgfVxuXG4gIC50aGVtZS0tZGFyayAuY29sb3ItaW5wdXQgZGl2Om5vdCg6Zmlyc3QtY2hpbGQpIHtcbiAgICBjb2xvcjogcmdiYShtYXAtZ2V0KCRtYXRlcmlhbC1kYXJrLCAndGV4dC1jb2xvcicpLCAwLjQ1KTtcbiAgfVxuXG4gIDpkZWVwKC52LXRleHQtZmllbGRfX3Nsb3QgaW5wdXQpIHtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICA6ZGVlcCgudi1pbnB1dC0tZGVuc2UgLnYtaW5wdXRfX3Nsb3QpIHtcbiAgICBtaW4taGVpZ2h0OiAzMnB4ICFpbXBvcnRhbnQ7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9BcHBDb2xvclBpY2tlci52dWUifQ==