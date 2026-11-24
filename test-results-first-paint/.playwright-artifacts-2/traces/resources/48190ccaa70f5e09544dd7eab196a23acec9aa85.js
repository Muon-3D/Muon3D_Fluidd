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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import OverviewMixin from "/src/mixins/overview.ts";
import { X_RIGHT, Y_BACK } from "/src/services/machine/orientation.ts";
import { zKeyWords } from "/src/services/control/z-keys.ts";
import TileShell from "/src/components/widgets/overview/tiles/TileShell.vue";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
export const JOG_STEPS = [0.1, 1, 10, 100];
let JogTile = class extends Mixins(OverviewMixin) {
  Y_BACK = Y_BACK;
  /** Right on the pad is the right of the machine, as the trackpad draws it (M1_VIEW). */
  X_RIGHT = X_RIGHT;
  step = 1;
  get steps() {
    return JOG_STEPS.map((v) => ({ value: v, label: this.size === "S" ? String(v) : `${v} mm` }));
  }
  get canMoveXY() {
    return this.controlReady && !this.busy && this.isHomed("XY");
  }
  get canMoveZ() {
    return this.controlReady && !this.busy && this.isHomed("Z");
  }
  /** Plate up / Plate down on a Muon printer (it prints upside down); Z+ and Z− on others. */
  get zKeys() {
    return zKeyWords(this.muonPrinter !== false);
  }
  get lock() {
    if (!this.controlReady) return this.controlLock;
    if (this.busy) return this.moveLockReason;
    if (!this.isHomed("XY")) return "Home first (Home on the Trackpad) to move the head.";
    return "";
  }
  get pill() {
    if (!this.controlReady) return "";
    if (this.printLocked) return "Printing";
    if (this.busy) return "Busy";
    return this.isHomed("XYZ") ? "" : "Home first";
  }
  get pillTone() {
    return this.printLocked || this.busy ? "run" : "warm";
  }
  get commands() {
    return this.$store.getters["printer/getAvailableCommands"] ?? {};
  }
  get screwsCommand() {
    return ["BED_SCREWS_ADJUST", "SCREWS_TILT_CALCULATE"].find((c) => c in this.commands) ?? null;
  }
  get menu() {
    const items = [
      { id: "extrude", label: "Extrude and retract\u2026", to: this.pagePath("/control") },
      { id: "motors", label: "Turn motors off", disabled: !this.controlReady || this.busy, action: () => this.motorsOff() }
    ];
    if (this.screwsCommand) {
      const command = this.screwsCommand;
      items.push({ id: "screws", label: "Bed screws and tilt\u2026", disabled: !this.controlReady || this.busy, action: () => {
        this.sendTypedGcode(command);
      } });
    }
    return items;
  }
};
JogTile = __decorateClass([
  Component({ components: { TileShell, SegPicker } })
], JogTile);
const _sfc_main = JogTile;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("tile-shell", { class: ["jg", `jg--${_vm.size}`], attrs: { "tile": "jog", "title": "Jog", "icon": "control", "state": _vm.pill, "tone": _vm.pillTone, "menu": _vm.menu } }, [_c("div", { staticClass: "jg__body", attrs: { "data-tid": "jog-body" } }, [_c("div", { staticClass: "jg__pad", attrs: { "role": "group", "aria-label": "Move the head" } }, [_c("button", { staticClass: "jg__b jg__n", attrs: { "type": "button", "aria-label": "Head back", "data-jog": "y+", "disabled": !_vm.canMoveXY }, on: { "click": function($event) {
    return _vm.moveBy("Y", _vm.Y_BACK * _vm.step);
  } } }, [_c(__unplugin_components_0, { attrs: { "name": "chevronUp" } })], 1), _c("button", { staticClass: "jg__b jg__w", attrs: { "type": "button", "aria-label": "Head left", "data-jog": "x-", "disabled": !_vm.canMoveXY }, on: { "click": function($event) {
    return _vm.moveBy("X", -_vm.X_RIGHT * _vm.step);
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "chevronLeft" } })], 1), _c("span", { staticClass: "jg__b jg__c", attrs: { "aria-hidden": "true", "data-jog": "centre" } }), _c("button", { staticClass: "jg__b jg__e", attrs: { "type": "button", "aria-label": "Head right", "data-jog": "x+", "disabled": !_vm.canMoveXY }, on: { "click": function($event) {
    return _vm.moveBy("X", _vm.X_RIGHT * _vm.step);
  } } }, [_c(__unplugin_components_2, { attrs: { "name": "chevronRight" } })], 1), _c("button", { staticClass: "jg__b jg__s", attrs: { "type": "button", "aria-label": "Head forward", "data-jog": "y-", "disabled": !_vm.canMoveXY }, on: { "click": function($event) {
    return _vm.moveBy("Y", -_vm.Y_BACK * _vm.step);
  } } }, [_c(__unplugin_components_3, { attrs: { "name": "chevronDown" } })], 1)]), _c("div", { staticClass: "jg__z", attrs: { "role": "group", "aria-label": "Move the plate", "data-tid": "jog-z" } }, [_c("button", { staticClass: "jg__zb", attrs: { "type": "button", "aria-label": _vm.zKeys.up.label, "title": _vm.zKeys.up.title, "data-jog": "z+", "disabled": !_vm.canMoveZ }, on: { "click": function($event) {
    return _vm.moveBy("Z", _vm.step);
  } } }, [_c(__unplugin_components_4, { attrs: { "name": "arrowUp" } }), _c("span", [_vm._v(_vm._s(_vm.zKeys.up.text))])], 1), _c("button", { staticClass: "jg__zb", attrs: { "type": "button", "aria-label": _vm.zKeys.down.label, "title": _vm.zKeys.down.title, "data-jog": "z-", "disabled": !_vm.canMoveZ }, on: { "click": function($event) {
    return _vm.moveBy("Z", -_vm.step);
  } } }, [_c(__unplugin_components_5, { attrs: { "name": "arrowDown" } }), _c("span", [_vm._v(_vm._s(_vm.zKeys.down.text))])], 1)])]), _c("seg-picker", { staticClass: "jg__step", attrs: { "options": _vm.steps, "value": _vm.step, "label": "Step", "accent": "", "fill": "", "disabled": !_vm.controlReady, "data-tid": "jog-step" }, on: { "input": function($event) {
    _vm.step = $event;
  } } }), _vm.lock ? _c("span", { staticClass: "jg__sr", attrs: { "data-tid": "jog-lock" } }, [_vm._v(_vm._s(_vm.lock))]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/JogTile.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/JogTile.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQXFIQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFHQTtBQVlBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFyREE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiSm9nVGlsZS52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8dGlsZS1zaGVsbFxuICAgIHRpbGU9XCJqb2dcIlxuICAgIHRpdGxlPVwiSm9nXCJcbiAgICBpY29uPVwiY29udHJvbFwiXG4gICAgOnN0YXRlPVwicGlsbFwiXG4gICAgOnRvbmU9XCJwaWxsVG9uZVwiXG4gICAgOm1lbnU9XCJtZW51XCJcbiAgICA6Y2xhc3M9XCJbJ2pnJywgYGpnLS0ke3NpemV9YF1cIlxuICA+XG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJqZ19fYm9keVwiXG4gICAgICBkYXRhLXRpZD1cImpvZy1ib2R5XCJcbiAgICA+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwiamdfX3BhZFwiXG4gICAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJNb3ZlIHRoZSBoZWFkXCJcbiAgICAgID5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiamdfX2IgamdfX25cIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJIZWFkIGJhY2tcIlxuICAgICAgICAgIGRhdGEtam9nPVwieStcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlWFlcIlxuICAgICAgICAgIEBjbGljaz1cIm1vdmVCeSgnWScsIFlfQkFDSyAqIHN0ZXApXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJjaGV2cm9uVXBcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiamdfX2IgamdfX3dcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJIZWFkIGxlZnRcIlxuICAgICAgICAgIGRhdGEtam9nPVwieC1cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlWFlcIlxuICAgICAgICAgIEBjbGljaz1cIm1vdmVCeSgnWCcsIC1YX1JJR0hUICogc3RlcClcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImNoZXZyb25MZWZ0XCIgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgY2xhc3M9XCJqZ19fYiBqZ19fY1wiXG4gICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICBkYXRhLWpvZz1cImNlbnRyZVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImpnX19iIGpnX19lXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiSGVhZCByaWdodFwiXG4gICAgICAgICAgZGF0YS1qb2c9XCJ4K1wiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNhbk1vdmVYWVwiXG4gICAgICAgICAgQGNsaWNrPVwibW92ZUJ5KCdYJywgWF9SSUdIVCAqIHN0ZXApXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJjaGV2cm9uUmlnaHRcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiamdfX2IgamdfX3NcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJIZWFkIGZvcndhcmRcIlxuICAgICAgICAgIGRhdGEtam9nPVwieS1cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlWFlcIlxuICAgICAgICAgIEBjbGljaz1cIm1vdmVCeSgnWScsIC1ZX0JBQ0sgKiBzdGVwKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwiY2hldnJvbkRvd25cIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdlxuICAgICAgICBjbGFzcz1cImpnX196XCJcbiAgICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgICAgYXJpYS1sYWJlbD1cIk1vdmUgdGhlIHBsYXRlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJqb2ctelwiXG4gICAgICA+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImpnX196YlwiXG4gICAgICAgICAgOmFyaWEtbGFiZWw9XCJ6S2V5cy51cC5sYWJlbFwiXG4gICAgICAgICAgOnRpdGxlPVwiektleXMudXAudGl0bGVcIlxuICAgICAgICAgIGRhdGEtam9nPVwieitcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjYW5Nb3ZlWlwiXG4gICAgICAgICAgQGNsaWNrPVwibW92ZUJ5KCdaJywgc3RlcClcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImFycm93VXBcIiAvPlxuICAgICAgICAgIDxzcGFuPnt7IHpLZXlzLnVwLnRleHQgfX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJqZ19femJcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiektleXMuZG93bi5sYWJlbFwiXG4gICAgICAgICAgOnRpdGxlPVwiektleXMuZG93bi50aXRsZVwiXG4gICAgICAgICAgZGF0YS1qb2c9XCJ6LVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNhbk1vdmVaXCJcbiAgICAgICAgICBAY2xpY2s9XCJtb3ZlQnkoJ1onLCAtc3RlcClcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImFycm93RG93blwiIC8+XG4gICAgICAgICAgPHNwYW4+e3sgektleXMuZG93bi50ZXh0IH19PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxzZWctcGlja2VyXG4gICAgICBjbGFzcz1cImpnX19zdGVwXCJcbiAgICAgIDpvcHRpb25zPVwic3RlcHNcIlxuICAgICAgOnZhbHVlPVwic3RlcFwiXG4gICAgICBsYWJlbD1cIlN0ZXBcIlxuICAgICAgYWNjZW50XG4gICAgICBmaWxsXG4gICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgIGRhdGEtdGlkPVwiam9nLXN0ZXBcIlxuICAgICAgQGlucHV0PVwic3RlcCA9ICRldmVudFwiXG4gICAgLz5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cImxvY2tcIlxuICAgICAgY2xhc3M9XCJqZ19fc3JcIlxuICAgICAgZGF0YS10aWQ9XCJqb2ctbG9ja1wiXG4gICAgPnt7IGxvY2sgfX08L3NwYW4+XG4gIDwvdGlsZS1zaGVsbD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgT3ZlcnZpZXdNaXhpbiBmcm9tICdAL21peGlucy9vdmVydmlldydcbmltcG9ydCB7IFhfUklHSFQsIFlfQkFDSyB9IGZyb20gJ0Avc2VydmljZXMvbWFjaGluZS9vcmllbnRhdGlvbidcbmltcG9ydCB0eXBlIHsgVGlsZU1lbnVJdGVtIH0gZnJvbSAnQC9zZXJ2aWNlcy9vdmVydmlldy90aWxlcydcbmltcG9ydCB7IHpLZXlXb3JkcyB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC96LWtleXMnXG5pbXBvcnQgVGlsZVNoZWxsIGZyb20gJy4vVGlsZVNoZWxsLnZ1ZSdcbmltcG9ydCBTZWdQaWNrZXIsIHsgdHlwZSBTZWdPcHRpb24gfSBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9TZWdQaWNrZXIudnVlJ1xuXG4vKiogVGhlIHN0ZXBzIGEgam9nIHRha2VzLCBtbS4gKi9cbmV4cG9ydCBjb25zdCBKT0dfU1RFUFMgPSBbMC4xLCAxLCAxMCwgMTAwXVxuXG4vKipcbiAqIEpvZywgSmFjaydzIHBpY2sgQiAoS0FOLTIxMTkpOiB0aGUgY3Jvc3MgcGFkLCBQbGF0ZSB1cCBhbmQgUGxhdGUgZG93biBhc1xuICogbGFiZWxsZWQga2V5cyBiZXNpZGUgaXQsIGFuZCBvbmUgcm93IG9mIHN0ZXBzIHVuZGVyIGJvdGguIEV2ZXJ5IHNpemUgZHJhd3NcbiAqIGFsbCB0aHJlZSAoUyB0aWdodGVyLCBMIHJvb21pZXIpLCBhbmQgdGhlIHBhZCBhbmQga2V5cyBzdHJldGNoIHRvIGZpbGwgdGhlXG4gKiB0aWxlLCBzbyBub3RoaW5nIGlzIGxlZnQgYmxhbmsgYXQgdGhlIGJvdHRvbS4gSG9taW5nIGlzIHRoZSBUcmFja3BhZCdzIG9uZVxuICogSG9tZSBjb250cm9sLiBFdmVyeSBtb3ZlIGlzIENvbnRyb2xNaXhpbidzIG1vdmVCeSwgc28gaXQgaXMgcmVmdXNlZCB3aGlsZVxuICogcHJpbnRpbmcsIGJlZm9yZSBob21pbmcsIG9yIHdoZW4gdGhlIHByaW50ZXIgaXMgbm90IHJlYWR5OyB0aGUgcGlsbCBzYXlzXG4gKiBcIlByaW50aW5nXCIgb25seSBmb3IgYSByZWFsIHByaW50IChLQU4tMjEyMCkuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRpbGVTaGVsbCwgU2VnUGlja2VyIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEpvZ1RpbGUgZXh0ZW5kcyBNaXhpbnMoT3ZlcnZpZXdNaXhpbikge1xuICByZWFkb25seSBZX0JBQ0sgPSBZX0JBQ0tcbiAgLyoqIFJpZ2h0IG9uIHRoZSBwYWQgaXMgdGhlIHJpZ2h0IG9mIHRoZSBtYWNoaW5lLCBhcyB0aGUgdHJhY2twYWQgZHJhd3MgaXQgKE0xX1ZJRVcpLiAqL1xuICByZWFkb25seSBYX1JJR0hUID0gWF9SSUdIVFxuICBzdGVwID0gMVxuXG4gIGdldCBzdGVwcyAoKTogU2VnT3B0aW9uW10ge1xuICAgIHJldHVybiBKT0dfU1RFUFMubWFwKHYgPT4gKHsgdmFsdWU6IHYsIGxhYmVsOiB0aGlzLnNpemUgPT09ICdTJyA/IFN0cmluZyh2KSA6IGAke3Z9IG1tYCB9KSlcbiAgfVxuXG4gIGdldCBjYW5Nb3ZlWFkgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgJiYgIXRoaXMuYnVzeSAmJiB0aGlzLmlzSG9tZWQoJ1hZJykgfVxuICBnZXQgY2FuTW92ZVogKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgJiYgIXRoaXMuYnVzeSAmJiB0aGlzLmlzSG9tZWQoJ1onKSB9XG5cbiAgLyoqIFBsYXRlIHVwIC8gUGxhdGUgZG93biBvbiBhIE11b24gcHJpbnRlciAoaXQgcHJpbnRzIHVwc2lkZSBkb3duKTsgWisgYW5kIFriiJIgb24gb3RoZXJzLiAqL1xuICBnZXQgektleXMgKCkgeyByZXR1cm4gektleVdvcmRzKHRoaXMubXVvblByaW50ZXIgIT09IGZhbHNlKSB9XG5cbiAgZ2V0IGxvY2sgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xSZWFkeSkgcmV0dXJuIHRoaXMuY29udHJvbExvY2tcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm4gdGhpcy5tb3ZlTG9ja1JlYXNvblxuICAgIGlmICghdGhpcy5pc0hvbWVkKCdYWScpKSByZXR1cm4gJ0hvbWUgZmlyc3QgKEhvbWUgb24gdGhlIFRyYWNrcGFkKSB0byBtb3ZlIHRoZSBoZWFkLidcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGdldCBwaWxsICgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVybiAnJ1xuICAgIGlmICh0aGlzLnByaW50TG9ja2VkKSByZXR1cm4gJ1ByaW50aW5nJ1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybiAnQnVzeSdcbiAgICByZXR1cm4gdGhpcy5pc0hvbWVkKCdYWVonKSA/ICcnIDogJ0hvbWUgZmlyc3QnXG4gIH1cblxuICBnZXQgcGlsbFRvbmUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRMb2NrZWQgfHwgdGhpcy5idXN5ID8gJ3J1bicgOiAnd2FybSdcbiAgfVxuXG4gIGdldCBjb21tYW5kcyAoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIHJldHVybiAodGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRBdmFpbGFibGVDb21tYW5kcyddIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA/PyB7fVxuICB9XG5cbiAgZ2V0IHNjcmV3c0NvbW1hbmQgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBbJ0JFRF9TQ1JFV1NfQURKVVNUJywgJ1NDUkVXU19USUxUX0NBTENVTEFURSddLmZpbmQoYyA9PiBjIGluIHRoaXMuY29tbWFuZHMpID8/IG51bGxcbiAgfVxuXG4gIGdldCBtZW51ICgpOiBUaWxlTWVudUl0ZW1bXSB7XG4gICAgY29uc3QgaXRlbXM6IFRpbGVNZW51SXRlbVtdID0gW1xuICAgICAgeyBpZDogJ2V4dHJ1ZGUnLCBsYWJlbDogJ0V4dHJ1ZGUgYW5kIHJldHJhY3TigKYnLCB0bzogdGhpcy5wYWdlUGF0aCgnL2NvbnRyb2wnKSB9LFxuICAgICAgeyBpZDogJ21vdG9ycycsIGxhYmVsOiAnVHVybiBtb3RvcnMgb2ZmJywgZGlzYWJsZWQ6ICF0aGlzLmNvbnRyb2xSZWFkeSB8fCB0aGlzLmJ1c3ksIGFjdGlvbjogKCkgPT4gdGhpcy5tb3RvcnNPZmYoKSB9XG4gICAgXVxuICAgIGlmICh0aGlzLnNjcmV3c0NvbW1hbmQpIHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLnNjcmV3c0NvbW1hbmRcbiAgICAgIGl0ZW1zLnB1c2goeyBpZDogJ3NjcmV3cycsIGxhYmVsOiAnQmVkIHNjcmV3cyBhbmQgdGlsdOKApicsIGRpc2FibGVkOiAhdGhpcy5jb250cm9sUmVhZHkgfHwgdGhpcy5idXN5LCBhY3Rpb246ICgpID0+IHsgdGhpcy5zZW5kVHlwZWRHY29kZShjb21tYW5kKSB9IH0pXG4gICAgfVxuICAgIHJldHVybiBpdGVtc1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4vKiBLQU4tMjExOSwgSmFjaydzIHBpY2sgQjogdGhlIGNyb3NzIHBhZCwgbGFiZWxsZWQgUGxhdGUgdXAgLyBQbGF0ZSBkb3duIGJlc2lkZSBpdCwgb25lIHN0ZXAgcm93IHVuZGVyIGJvdGguIFRoZSBib2R5IGdyb3dzIHRvIGZpbGwgdGhlIHRpbGUuICovXG4uamcgeyBnYXA6IDEwcHg7IH1cbi5qZyA+IC5vdF9fZG9vciB7IGZsZXg6IDEgMSBhdXRvOyBnYXA6IDEwcHg7IH1cbi5qZ19fYm9keSB7IGRpc3BsYXk6IGZsZXg7IGZsZXg6IDEgMSBhdXRvOyBnYXA6IDEycHg7IG1pbi1oZWlnaHQ6IDA7IH1cbi5qZ19fcGFkIHsgZGlzcGxheTogZ3JpZDsgZmxleDogMSAxIDA7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDMsIG1pbm1heCgwLCAxZnIpKTsgZ3JpZC10ZW1wbGF0ZS1yb3dzOiByZXBlYXQoMywgbWlubWF4KDQwcHgsIDFmcikpOyBnYXA6IDhweDsgbWluLXdpZHRoOiAwOyB9XG4uamdfX2IgeyBkaXNwbGF5OiBpbmxpbmUtZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IG1pbi13aWR0aDogMDsgYm9yZGVyLXJhZGl1czogMTRweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7IGN1cnNvcjogcG9pbnRlcjsgfVxuLmpnX19iIC5mcmFtZS1pY29uIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgfVxuLmpnX19iOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHsgZmlsdGVyOiBicmlnaHRuZXNzKDEuMTUpOyB9XG4uamdfX2I6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ7IGN1cnNvcjogZGVmYXVsdDsgfVxuLmpnX19uIHsgZ3JpZC1hcmVhOiAxIC8gMjsgfSAuamdfX3cgeyBncmlkLWFyZWE6IDIgLyAxOyB9IC5qZ19fZSB7IGdyaWQtYXJlYTogMiAvIDM7IH0gLmpnX19zIHsgZ3JpZC1hcmVhOiAzIC8gMjsgfVxuLmpnX19jIHsgZ3JpZC1hcmVhOiAyIC8gMjsgb3BhY2l0eTogMC40NTsgY3Vyc29yOiBkZWZhdWx0OyB9XG4uamdfX3ogeyBkaXNwbGF5OiBmbGV4OyBmbGV4OiAwIDAgMzQlOyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDhweDsgbWluLXdpZHRoOiAwOyB9XG4uamdfX3piIHsgZGlzcGxheTogZmxleDsgZmxleDogMSAxIDA7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyBnYXA6IDZweDsgbWluLXdpZHRoOiAwOyBtaW4taGVpZ2h0OiA1MnB4OyBwYWRkaW5nOiA2cHg7IGJvcmRlci1yYWRpdXM6IDE0cHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyBmb250LXNpemU6IDEzcHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGxpbmUtaGVpZ2h0OiAxLjE1OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGN1cnNvcjogcG9pbnRlcjsgfVxuLmpnX196YiAuZnJhbWUtaWNvbiB7IHdpZHRoOiAyMHB4OyBoZWlnaHQ6IDIwcHg7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IH1cbi5qZ19femI6aG92ZXI6bm90KDpkaXNhYmxlZCkgeyBmaWx0ZXI6IGJyaWdodG5lc3MoMS4xNSk7IH1cbi5qZ19femI6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ7IGN1cnNvcjogZGVmYXVsdDsgfVxuLmpnIC5qZ19fc3RlcC5zZWcgeyBmbGV4OiAwIDAgYXV0bzsgZ2FwOiA2cHg7IHBhZGRpbmc6IDA7IGJhY2tncm91bmQ6IHRyYW5zcGFyZW50OyB9XG4uamcgLmpnX19zdGVwLnNlZyBidXR0b24geyBoZWlnaHQ6IDQwcHg7IGJvcmRlci1yYWRpdXM6IDEycHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpOyB9XG4uamcgLmpnX19zdGVwLnNlZyBidXR0b24ub24geyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTsgY29sb3I6IHZhcigtLW0zZC1vbi1hY2NlbnQsICMwMDIwMWUpOyB9XG4vKiBTOiB0aWdodGVyIGtleXMsIHRoZSBpY29uIG92ZXIgYSBzaG9ydCB3b3JkLiAqL1xuLmpnLS1TIC5qZ19fYm9keSB7IGdhcDogOHB4OyB9XG4uamctLVMgLmpnX19wYWQgeyBnYXA6IDZweDsgZ3JpZC10ZW1wbGF0ZS1yb3dzOiByZXBlYXQoMywgbWlubWF4KDM0cHgsIDFmcikpOyB9XG4uamctLVMgLmpnX196YiB7IGdhcDogMnB4OyBtaW4taGVpZ2h0OiA0NHB4OyBmb250LXNpemU6IDExLjVweDsgfVxuLmpnLS1TIC5qZ19fc3RlcC5zZWcgYnV0dG9uIHsgaGVpZ2h0OiAzNHB4OyBmb250LXNpemU6IDEycHg7IH1cbi8qIEwsIHRoZSB3aWRlIHZhcmlhbnQ6IHBhZCwgUGxhdGUga2V5cyBhbmQgdGhlIHN0ZXBzIHNpZGUgYnkgc2lkZSAodGhlIHN0ZXBzIGFzIGEgY29sdW1uKSwgc28gdGhlIHdpZHRoIGlzIHVzZWQsIG5vdCBzdHJldGNoZWQgaW50byBzbGFicy4gKi9cbi5qZy0tTCA+IC5vdF9fZG9vciB7IGRpc3BsYXk6IGdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KDAsIDFmcikgbWlubWF4KDEyMHB4LCAwLjMyZnIpOyBncmlkLXRlbXBsYXRlLXJvd3M6IGF1dG8gbWlubWF4KDAsIDFmcik7IGNvbHVtbi1nYXA6IDE0cHg7IH1cbi5qZy0tTCA+IC5vdF9fZG9vciA+IC5vdF9faGVhZCB7IGdyaWQtY29sdW1uOiAxIC8gLTE7IH1cbi5qZy0tTCAuamdfX2JvZHkgeyBnYXA6IDE0cHg7IH1cbi5qZy0tTCAuamdfX3ogeyBmbGV4LWJhc2lzOiA0MCU7IH1cbi5qZy0tTCAuamdfX3piIHsgZm9udC1zaXplOiAxNHB4OyB9XG4uamcuamctLUwgLmpnX19zdGVwLnNlZyB7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGFsaWduLXNlbGY6IHN0cmV0Y2g7IH1cbi5qZy5qZy0tTCAuamdfX3N0ZXAuc2VnIGJ1dHRvbiB7IGZsZXg6IDEgMSAwOyBoZWlnaHQ6IGF1dG87IG1pbi1oZWlnaHQ6IDM2cHg7IH1cbi5qZ19fc3IgeyBwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAxcHg7IGhlaWdodDogMXB4OyBvdmVyZmxvdzogaGlkZGVuOyBjbGlwOiByZWN0KDAgMCAwIDApOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XG5AbWVkaWEgKG1heC13aWR0aDogNTk5cHgpIHtcbiAgLmpnX19wYWQgeyBncmlkLXRlbXBsYXRlLXJvd3M6IHJlcGVhdCgzLCBtaW5tYXgoNDhweCwgMWZyKSk7IH1cbiAgLmpnX196IHsgZmxleC1iYXNpczogMzglOyB9XG59XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9Kb2dUaWxlLnZ1ZSJ9