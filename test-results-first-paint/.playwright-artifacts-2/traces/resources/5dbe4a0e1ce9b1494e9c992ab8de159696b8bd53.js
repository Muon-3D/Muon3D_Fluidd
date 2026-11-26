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
import { Component, Mixins, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
let ControlActions = class extends Mixins(ControlMixin) {
  phone;
  get savePending() {
    return this.$store.state.printer.printer.configfile?.save_config_pending === true;
  }
  saveConfig() {
    if (this.savePending) return this.sendTypedGcode("SAVE_CONFIG");
  }
};
__decorateClass([
  Prop({ type: Boolean })
], ControlActions.prototype, "phone", 2);
ControlActions = __decorateClass([
  Component({})
], ControlActions);
const _sfc_main = ControlActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "control-actions", attrs: { "data-tid": "control-actions" } }, [_vm.phone ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "cool-down" }, on: { "click": _vm.coolDown } }, [_c(__unplugin_components_0, { attrs: { "name": "snow", "small": "" } }), _vm._v(" Cool down ")], 1) : _vm._e(), _c(_vm.phone ? "details" : "div", { tag: "component", staticClass: "control-actions__more", class: { "control-actions__more--desktop": !_vm.phone } }, [_vm.phone ? _c("summary", { staticClass: "cbtn", attrs: { "aria-label": "More printer actions" } }, [_vm._v(" More ")]) : _vm._e(), _c("div", { staticClass: "control-actions__menu" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !!_vm.restartRefusal, "data-tid": "restart-klipper" }, on: { "click": function($event) {
    return _vm.sendTypedGcode("RESTART");
  } } }, [_vm._v(" Restart Klipper ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !!_vm.restartRefusal, "data-tid": "restart-firmware" }, on: { "click": function($event) {
    return _vm.sendTypedGcode("FIRMWARE_RESTART");
  } } }, [_vm._v(" Firmware restart ")]), _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !!_vm.restartRefusal || !_vm.savePending, "data-tid": "save-config" }, on: { "click": _vm.saveConfig } }, [_vm._v(" Save config and restart" + _vm._s(_vm.savePending ? "" : " \xB7 nothing to save") + " ")])])]), _vm.commandRefusal ? _c("p", { staticClass: "control-actions__refusal", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.commandRefusal) + " ")]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/ControlActions.vue?vue&type=style&index=0&scoped=9e52d2c8&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9e52d2c8",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/ControlActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF3RUE7QUFDQTtBQUlBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFDQTtBQUpBO0FBQUE7QUFBQSxHQURBLGVBQ0E7QUFEQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb250cm9sQWN0aW9ucy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJjb250cm9sLWFjdGlvbnNcIlxuICAgIGRhdGEtdGlkPVwiY29udHJvbC1hY3Rpb25zXCJcbiAgPlxuICAgIDxidXR0b25cbiAgICAgIHYtaWY9XCJwaG9uZVwiXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgIGRhdGEtdGlkPVwiY29vbC1kb3duXCJcbiAgICAgIEBjbGljaz1cImNvb2xEb3duXCJcbiAgICA+XG4gICAgICA8ZnJhbWUtaWNvblxuICAgICAgICBuYW1lPVwic25vd1wiXG4gICAgICAgIHNtYWxsXG4gICAgICAvPlxuICAgICAgQ29vbCBkb3duXG4gICAgPC9idXR0b24+XG4gICAgPGNvbXBvbmVudFxuICAgICAgOmlzPVwicGhvbmUgPyAnZGV0YWlscycgOiAnZGl2J1wiXG4gICAgICBjbGFzcz1cImNvbnRyb2wtYWN0aW9uc19fbW9yZVwiXG4gICAgICA6Y2xhc3M9XCJ7ICdjb250cm9sLWFjdGlvbnNfX21vcmUtLWRlc2t0b3AnOiAhcGhvbmUgfVwiXG4gICAgPlxuICAgICAgPHN1bW1hcnlcbiAgICAgICAgdi1pZj1cInBob25lXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgYXJpYS1sYWJlbD1cIk1vcmUgcHJpbnRlciBhY3Rpb25zXCJcbiAgICAgID5cbiAgICAgICAgTW9yZVxuICAgICAgPC9zdW1tYXJ5PlxuICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2wtYWN0aW9uc19fbWVudVwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhIXJlc3RhcnRSZWZ1c2FsXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInJlc3RhcnQta2xpcHBlclwiXG4gICAgICAgICAgQGNsaWNrPVwic2VuZFR5cGVkR2NvZGUoJ1JFU1RBUlQnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBSZXN0YXJ0IEtsaXBwZXJcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiEhcmVzdGFydFJlZnVzYWxcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicmVzdGFydC1maXJtd2FyZVwiXG4gICAgICAgICAgQGNsaWNrPVwic2VuZFR5cGVkR2NvZGUoJ0ZJUk1XQVJFX1JFU1RBUlQnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBGaXJtd2FyZSByZXN0YXJ0XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhIXJlc3RhcnRSZWZ1c2FsIHx8ICFzYXZlUGVuZGluZ1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJzYXZlLWNvbmZpZ1wiXG4gICAgICAgICAgQGNsaWNrPVwic2F2ZUNvbmZpZ1wiXG4gICAgICAgID5cbiAgICAgICAgICBTYXZlIGNvbmZpZyBhbmQgcmVzdGFydHt7IHNhdmVQZW5kaW5nID8gJycgOiAnIMK3IG5vdGhpbmcgdG8gc2F2ZScgfX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2NvbXBvbmVudD5cbiAgICA8cFxuICAgICAgdi1pZj1cImNvbW1hbmRSZWZ1c2FsXCJcbiAgICAgIGNsYXNzPVwiY29udHJvbC1hY3Rpb25zX19yZWZ1c2FsXCJcbiAgICAgIHJvbGU9XCJhbGVydFwiXG4gICAgPlxuICAgICAge3sgY29tbWFuZFJlZnVzYWwgfX1cbiAgICA8L3A+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBDb250cm9sTWl4aW4gZnJvbSAnQC9taXhpbnMvY29udHJvbCdcblxuLyoqIENvb2wgZG93biB1cCBmcm9udCBvbiBhIHBob25lLCBhbmQgdGhlIHJlc3RhcnRzOyBob21pbmcgYW5kIE1vdG9ycyBvZmYgYXJlIGluIHRoZSBNb3ZlIHRpbGUuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29udHJvbEFjdGlvbnMgZXh0ZW5kcyBNaXhpbnMoQ29udHJvbE1peGluKSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSBwaG9uZT86IGJvb2xlYW5cblxuICBnZXQgc2F2ZVBlbmRpbmcgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGU/LnNhdmVfY29uZmlnX3BlbmRpbmcgPT09IHRydWUgfVxuICBzYXZlQ29uZmlnICgpIHsgaWYgKHRoaXMuc2F2ZVBlbmRpbmcpIHJldHVybiB0aGlzLnNlbmRUeXBlZEdjb2RlKCdTQVZFX0NPTkZJRycpIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5jb250cm9sLWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogOHB4O1xuXG4gICAga2JkIHtcbiAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICB9XG4gIH1cbiAgLmNvbnRyb2wtYWN0aW9uc19fbW9yZSB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgfVxuICAuY29udHJvbC1hY3Rpb25zX19tb3JlLS1kZXNrdG9wLFxuICAuY29udHJvbC1hY3Rpb25zX19tb3JlLS1kZXNrdG9wIC5jb250cm9sLWFjdGlvbnNfX21lbnUge1xuICAgIGRpc3BsYXk6IGNvbnRlbnRzO1xuICB9XG4gIC5jb250cm9sLWFjdGlvbnNfX21lbnUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDZweDtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgei1pbmRleDogMTA7XG4gICAgcmlnaHQ6IDA7XG4gICAgdG9wOiAxMDAlO1xuICAgIHdpZHRoOiBtaW4oMjkwcHgsIDg1dncpO1xuICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgYm94LXNoYWRvdzogMCA2cHggMjBweCByZ2IoMCAwIDAgLyAyMCUpO1xuICB9XG4gIC5jb250cm9sLWFjdGlvbnNfX3JlZnVzYWwgeyBmbGV4LWJhc2lzOiAxMDAlOyBtYXJnaW46IDA7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnRyb2wvQ29udHJvbEFjdGlvbnMudnVlIn0=