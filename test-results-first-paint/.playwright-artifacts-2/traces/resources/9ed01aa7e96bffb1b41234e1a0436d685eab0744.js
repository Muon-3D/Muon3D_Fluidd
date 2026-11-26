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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let M3Toast = class extends Vue {
  value;
  tone;
  timeout;
  position;
  closable;
  stamp;
  timer = null;
  get icon() {
    switch (this.tone) {
      case "success":
        return "check";
      case "warning":
      case "error":
        return "alert";
      default:
        return null;
    }
  }
  restart() {
    this.stop();
    if (this.value && this.timeout > 0) {
      this.timer = window.setTimeout(() => {
        this.timer = null;
        this.$emit("input", false);
      }, this.timeout);
    }
  }
  stop() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }
  beforeDestroy() {
    this.stop();
  }
};
__decorateClass([
  Prop({ type: Boolean })
], M3Toast.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, default: "info" })
], M3Toast.prototype, "tone", 2);
__decorateClass([
  Prop({ type: Number, default: 0 })
], M3Toast.prototype, "timeout", 2);
__decorateClass([
  Prop({ type: String, default: "top" })
], M3Toast.prototype, "position", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], M3Toast.prototype, "closable", 2);
__decorateClass([
  Prop({ default: null })
], M3Toast.prototype, "stamp", 2);
__decorateClass([
  Watch("value", { immediate: true }),
  Watch("stamp"),
  Watch("timeout")
], M3Toast.prototype, "restart", 1);
M3Toast = __decorateClass([
  Component({ inheritAttrs: false })
], M3Toast);
const _sfc_main = M3Toast;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("transition", { attrs: { "name": "m3-toast" } }, [_vm.value ? _c("div", _vm._b({ staticClass: "m3-toast", class: [`m3-toast--${_vm.tone}`, `m3-toast--${_vm.position}`], attrs: { "role": _vm.tone === "error" ? "alert" : "status" } }, "div", _vm.$attrs, false), [_vm.icon ? _c("span", { staticClass: "m3-toast__icon" }, [_c(__unplugin_components_0, { attrs: { "name": _vm.icon, "small": "" } })], 1) : _vm._e(), _c("div", { staticClass: "m3-toast__body" }, [_vm._t("default")], 2), _vm._t("action"), _vm.closable ? _c("button", { staticClass: "m3-toast__close", attrs: { "type": "button", "aria-label": "Close", "data-tid": "toast-close" }, on: { "click": function($event) {
    return _vm.$emit("input", false);
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "x", "small": "" } })], 1) : _vm._e()], 2) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/M3Toast.vue?vue&type=style&index=0&scoped=a234baa2&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "a234baa2",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/M3Toast.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBd0NBO0FBVUE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQTs7QUFLQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUNBO0FBQUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBR0E7QUFBQSxFQUNBO0FBQ0E7QUFsREE7QUFBQSxFQURBO0FBQUEsR0FEQSxRQUVBO0FBR0E7QUFBQTtHQUxBLFFBS0E7QUFHQTtBQUFBO0dBUkEsUUFRQTtBQUdBO0FBQUE7R0FYQSxRQVdBO0FBR0E7QUFBQTtHQWRBLFFBY0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQWpCQSxRQWtCQTtBQWdCQTtBQUFBO0VBRkE7QUFBQSxFQUNBO0FBQUEsR0FqQ0EsUUFrQ0E7QUFsQ0E7QUFBQTtBQUFBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJNM1RvYXN0LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx0cmFuc2l0aW9uIG5hbWU9XCJtMy10b2FzdFwiPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJ2YWx1ZVwiXG4gICAgICBjbGFzcz1cIm0zLXRvYXN0XCJcbiAgICAgIDpjbGFzcz1cIltgbTMtdG9hc3QtLSR7dG9uZX1gLCBgbTMtdG9hc3QtLSR7cG9zaXRpb259YF1cIlxuICAgICAgOnJvbGU9XCJ0b25lID09PSAnZXJyb3InID8gJ2FsZXJ0JyA6ICdzdGF0dXMnXCJcbiAgICAgIHYtYmluZD1cIiRhdHRyc1wiXG4gICAgPlxuICAgICAgPHNwYW5cbiAgICAgICAgdi1pZj1cImljb25cIlxuICAgICAgICBjbGFzcz1cIm0zLXRvYXN0X19pY29uXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICA6bmFtZT1cImljb25cIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICA8L3NwYW4+XG4gICAgICA8ZGl2IGNsYXNzPVwibTMtdG9hc3RfX2JvZHlcIj5cbiAgICAgICAgPHNsb3QgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNsb3QgbmFtZT1cImFjdGlvblwiIC8+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtaWY9XCJjbG9zYWJsZVwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cIm0zLXRvYXN0X19jbG9zZVwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJDbG9zZVwiXG4gICAgICAgIGRhdGEtdGlkPVwidG9hc3QtY2xvc2VcIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJ4XCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvdHJhbnNpdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5leHBvcnQgdHlwZSBUb2FzdFRvbmUgPSAnaW5mbycgfCAnc3VjY2VzcycgfCAnd2FybmluZycgfCAnZXJyb3InXG5cbi8qKlxuICogVGhlIHJlZGVzaWduJ3MgdG9hc3Q6IGEgc2hvcnQgbWVzc2FnZSB0aGF0IGZsb2F0cyBvdmVyIHRoZSBwYWdlLCB1bmRlclxuICogdGhlIGhlYWRlciAob3IgaW4gdGhlIGNvcm5lciwgZm9yIG9uZSB0aGF0IHdhaXRzKSwgd2l0aCBpdHMgdG9uZSwgYW5kIOKclS5cbiAqIEl0IGNsb3NlcyBpdHNlbGYgYWZ0ZXIgYHRpbWVvdXRgIG1zOyAwIG9yIGxlc3Mga2VlcHMgaXQgdW50aWwgaXQncyBjbG9zZWQuXG4gKiBBIG5ldyBgc3RhbXBgIHdoaWxlIGl0IHNob3dzIHN0YXJ0cyB0aGUgdGltZSBhZ2Fpbi5cbiAqL1xuQENvbXBvbmVudCh7IGluaGVyaXRBdHRyczogZmFsc2UgfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE0zVG9hc3QgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgdmFsdWUhOiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICdpbmZvJyB9KVxuICByZWFkb25seSB0b25lITogVG9hc3RUb25lXG5cbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSlcbiAgcmVhZG9ubHkgdGltZW91dCE6IG51bWJlclxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAndG9wJyB9KVxuICByZWFkb25seSBwb3NpdGlvbiE6ICd0b3AnIHwgJ2JvdHRvbSdcblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgY2xvc2FibGUhOiBib29sZWFuXG5cbiAgLyoqIEFueXRoaW5nIHRoYXQgY2hhbmdlcyB3aGVuIHRoZSBtZXNzYWdlIGRvZXMuICovXG4gIEBQcm9wKHsgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSBzdGFtcCE6IHVua25vd25cblxuICB0aW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuICBnZXQgaWNvbiAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgc3dpdGNoICh0aGlzLnRvbmUpIHtcbiAgICAgIGNhc2UgJ3N1Y2Nlc3MnOiByZXR1cm4gJ2NoZWNrJ1xuICAgICAgY2FzZSAnd2FybmluZyc6XG4gICAgICBjYXNlICdlcnJvcic6IHJldHVybiAnYWxlcnQnXG4gICAgICBkZWZhdWx0OiByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuXG4gIEBXYXRjaCgndmFsdWUnLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICBAV2F0Y2goJ3N0YW1wJylcbiAgQFdhdGNoKCd0aW1lb3V0JylcbiAgcmVzdGFydCAoKSB7XG4gICAgdGhpcy5zdG9wKClcbiAgICBpZiAodGhpcy52YWx1ZSAmJiB0aGlzLnRpbWVvdXQgPiAwKSB7XG4gICAgICB0aGlzLnRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnRpbWVyID0gbnVsbFxuICAgICAgICB0aGlzLiRlbWl0KCdpbnB1dCcsIGZhbHNlKVxuICAgICAgfSwgdGhpcy50aW1lb3V0KVxuICAgIH1cbiAgfVxuXG4gIHN0b3AgKCkge1xuICAgIGlmICh0aGlzLnRpbWVyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpXG4gICAgdGhpcy50aW1lciA9IG51bGxcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuc3RvcCgpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5tMy10b2FzdCB7XG4gICAgcG9zaXRpb246IGZpeGVkO1xuICAgIHotaW5kZXg6IDEwMDE7XG4gICAgbGVmdDogNTAlO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgd2lkdGg6IG1heC1jb250ZW50O1xuICAgIG1pbi1oZWlnaHQ6IDUycHg7XG4gICAgbWF4LXdpZHRoOiBtaW4oNTYwcHgsIGNhbGMoMTAwdncgLSAyNHB4KSk7XG4gICAgcGFkZGluZzogOHB4IDhweCA4cHggMTZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxOHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1nbGFzcy10aGljaywgdmFyKC0tbTNkLXJhaXNlZCkpO1xuICAgIC13ZWJraXQtYmFja2Ryb3AtZmlsdGVyOiB2YXIoLS1tM2QtZ2xhc3MtZmlsdGVyLCBub25lKTtcbiAgICBiYWNrZHJvcC1maWx0ZXI6IHZhcigtLW0zZC1nbGFzcy1maWx0ZXIsIG5vbmUpO1xuICAgIGJveC1zaGFkb3c6IHZhcigtLW0zZC1nbGFzcy1lZGdlLCAwIDAgMCAxcHggdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpKSwgdmFyKC0tbTNkLXNoYWRvdy1mbG9hdCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuICB9XG5cbiAgLm0zLXRvYXN0LS10b3Age1xuICAgIHRvcDogY2FsYyhlbnYoc2FmZS1hcmVhLWluc2V0LXRvcCwgMHB4KSArIDcycHgpO1xuICB9XG5cbiAgLm0zLXRvYXN0LS1ib3R0b20ge1xuICAgIGJvdHRvbTogY2FsYyhlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSwgMHB4KSArIDI0cHgpO1xuICB9XG5cbiAgLm0zLXRvYXN0X19pY29uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDI4cHg7XG4gICAgaGVpZ2h0OiAyOHB4O1xuICAgIG1hcmdpbi1sZWZ0OiAtNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgfVxuXG4gIC5tMy10b2FzdC0tc3VjY2VzcyAubTMtdG9hc3RfX2ljb24ge1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtc3VjY2VzcykgMTglLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzKTtcbiAgfVxuXG4gIC5tMy10b2FzdC0td2FybmluZyAubTMtdG9hc3RfX2ljb24ge1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtd2FybmluZykgMTglLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5tMy10b2FzdC0tZXJyb3IgLm0zLXRvYXN0X19pY29uIHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMTYlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xuICB9XG5cbiAgLm0zLXRvYXN0X19ib2R5IHtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgcGFkZGluZzogNHB4IDA7XG4gICAgd2hpdGUtc3BhY2U6IHByZS1saW5lO1xuICAgIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICB9XG5cbiAgLm0zLXRvYXN0X19jbG9zZSB7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiAzNnB4O1xuICAgIGhlaWdodDogMzZweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1ob3Zlcik7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC5tMy10b2FzdC1lbnRlci1hY3RpdmUsXG4gIC5tMy10b2FzdC1sZWF2ZS1hY3RpdmUge1xuICAgIHRyYW5zaXRpb246IG9wYWNpdHkgdmFyKC0tbTNkLWR1cmF0aW9uLWJhc2UpIHZhcigtLW0zZC1lYXNlKSwgdHJhbnNmb3JtIHZhcigtLW0zZC1kdXJhdGlvbi1iYXNlKSB2YXIoLS1tM2QtZWFzZSk7XG4gIH1cblxuICAubTMtdG9hc3QtZW50ZXIsXG4gIC5tMy10b2FzdC1sZWF2ZS10byB7XG4gICAgb3BhY2l0eTogMDtcbiAgfVxuXG4gIC5tMy10b2FzdC0tdG9wLm0zLXRvYXN0LWVudGVyLFxuICAubTMtdG9hc3QtLXRvcC5tMy10b2FzdC1sZWF2ZS10byB7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLThweCk7XG4gIH1cblxuICAubTMtdG9hc3QtLWJvdHRvbS5tMy10b2FzdC1lbnRlcixcbiAgLm0zLXRvYXN0LS1ib3R0b20ubTMtdG9hc3QtbGVhdmUtdG8ge1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIDhweCk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9NM1RvYXN0LnZ1ZSJ9