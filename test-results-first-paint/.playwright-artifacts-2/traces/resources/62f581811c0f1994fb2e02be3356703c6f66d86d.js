/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
let NetworkQuickMenu = class extends Vue {
  title;
  detail;
  remote;
  compact;
  open = false;
  get settingsTo() {
    return scopedPath("/wifi", activeSlug());
  }
  resizer = null;
  onOpen(open) {
    if (open) {
      document.addEventListener("mousedown", this.onOutside, true);
      this.$nextTick(() => {
        const panel = this.$refs.panel;
        if (!panel || typeof ResizeObserver === "undefined") return;
        this.resizer = new ResizeObserver(() => this.$refs.menu?.onResize?.());
        this.resizer.observe(panel);
      });
    } else {
      document.removeEventListener("mousedown", this.onOutside, true);
      this.resizer?.disconnect();
      this.resizer = null;
    }
  }
  onRoute() {
    this.open = false;
  }
  beforeDestroy() {
    document.removeEventListener("mousedown", this.onOutside, true);
    this.resizer?.disconnect();
  }
  /** A click anywhere but the menu, its button, or a dialog or menu it opened. */
  onOutside(event) {
    const target = event.target;
    if (!target || !target.closest) return;
    if (target.closest(".netq, .netq__toggle, .v-dialog__content, .v-overlay, .v-menu__content")) return;
    this.open = false;
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], NetworkQuickMenu.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], NetworkQuickMenu.prototype, "detail", 2);
__decorateClass([
  Prop({ type: Boolean })
], NetworkQuickMenu.prototype, "remote", 2);
__decorateClass([
  Prop({ type: Boolean })
], NetworkQuickMenu.prototype, "compact", 2);
__decorateClass([
  Watch("open")
], NetworkQuickMenu.prototype, "onOpen", 1);
__decorateClass([
  Watch("$route.path")
], NetworkQuickMenu.prototype, "onRoute", 1);
NetworkQuickMenu = __decorateClass([
  Component({
    components: {
      WifiManagerCard: () => import("/src/components/widgets/wifi/WifiManagerCard.vue"),
      HotspotManagerCard: () => import("/src/components/widgets/wifi/HotspotManagerCard.vue")
    }
  })
], NetworkQuickMenu);
const _sfc_main = NetworkQuickMenu;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { ref: "menu", attrs: { "close-on-click": false, "close-on-content-click": false, "top": "", "offset-y": "", "nudge-top": 8, "min-width": "320", "max-width": "340", "max-height": "calc(100vh - 140px)", "content-class": "netq", "transition": "slide-y-reverse-transition" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "netq__toggle", class: { "netq__toggle--open": _vm.open }, attrs: { "type": "button", "aria-expanded": _vm.open ? "true" : "false", "aria-haspopup": "dialog", "data-tid": "rail-route", "title": _vm.compact ? `${_vm.title}${_vm.detail ? ` \xB7 ${_vm.detail}` : ""}` : void 0 } }, "button", attrs, false), on), [_vm._t("default")], 2)];
  } }], null, true), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c("div", { ref: "panel", staticClass: "netq__panel", attrs: { "role": "dialog", "aria-label": "Network", "data-tid": "network-quick" }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    _vm.open = false;
  } } }, [_c("header", { staticClass: "netq__head" }, [_c(__unplugin_components_1, { attrs: { "name": _vm.remote ? "cloud" : "wifi", "small": "" } }), _c("div", [_c("b", [_vm._v(_vm._s(_vm.title))]), _vm.detail ? _c("span", [_vm._v(_vm._s(_vm.detail))]) : _vm._e()])], 1), _vm.open ? [_c("wifi-manager-card", { attrs: { "compact": "" } }), _c("div", { staticClass: "netq__rule" }), _c("hotspot-manager-card", { attrs: { "compact": "" } })] : _vm._e(), _c("router-link", { staticClass: "netq__all", attrs: { "to": _vm.settingsTo, "data-tid": "network-quick-all" }, nativeOn: { "click": function($event) {
    _vm.open = false;
  } } }, [_vm._v(" Wi-Fi and network settings "), _c(__unplugin_components_2, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/NetworkQuickMenu.vue?vue&type=style&index=0&scoped=cd2e9193&lang.scss";
import "/src/components/layout/NetworkQuickMenu.vue?vue&type=style&index=1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "cd2e9193",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/NetworkQuickMenu.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXlFQTtBQUNBO0FBQ0E7QUFpQkE7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTFEQTtBQUFBLEVBREE7QUFBQSxHQURBLGlCQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxpQkFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsaUJBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLGlCQVdBO0FBZ0JBO0FBQUEsRUFEQTtBQUFBLEdBMUJBLGlCQTJCQTtBQWlCQTtBQUFBLEVBREE7QUFBQSxHQTNDQSxpQkE0Q0E7QUE1Q0E7QUFBQSxFQU5BO0FBQUEsSUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJOZXR3b3JrUXVpY2tNZW51LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LW1lbnVcbiAgICByZWY9XCJtZW51XCJcbiAgICB2LW1vZGVsPVwib3BlblwiXG4gICAgOmNsb3NlLW9uLWNsaWNrPVwiZmFsc2VcIlxuICAgIDpjbG9zZS1vbi1jb250ZW50LWNsaWNrPVwiZmFsc2VcIlxuICAgIHRvcFxuICAgIG9mZnNldC15XG4gICAgOm51ZGdlLXRvcD1cIjhcIlxuICAgIG1pbi13aWR0aD1cIjMyMFwiXG4gICAgbWF4LXdpZHRoPVwiMzQwXCJcbiAgICBtYXgtaGVpZ2h0PVwiY2FsYygxMDB2aCAtIDE0MHB4KVwiXG4gICAgY29udGVudC1jbGFzcz1cIm5ldHFcIlxuICAgIHRyYW5zaXRpb249XCJzbGlkZS15LXJldmVyc2UtdHJhbnNpdGlvblwiXG4gID5cbiAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwibmV0cV9fdG9nZ2xlXCJcbiAgICAgICAgOmNsYXNzPVwieyAnbmV0cV9fdG9nZ2xlLS1vcGVuJzogb3BlbiB9XCJcbiAgICAgICAgOmFyaWEtZXhwYW5kZWQ9XCJvcGVuID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgIGFyaWEtaGFzcG9wdXA9XCJkaWFsb2dcIlxuICAgICAgICBkYXRhLXRpZD1cInJhaWwtcm91dGVcIlxuICAgICAgICA6dGl0bGU9XCJjb21wYWN0ID8gYCR7dGl0bGV9JHtkZXRhaWwgPyBgIMK3ICR7ZGV0YWlsfWAgOiAnJ31gIDogdW5kZWZpbmVkXCJcbiAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICB2LW9uPVwib25cIlxuICAgICAgPlxuICAgICAgICA8c2xvdCAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDxkaXZcbiAgICAgIHJlZj1cInBhbmVsXCJcbiAgICAgIGNsYXNzPVwibmV0cV9fcGFuZWxcIlxuICAgICAgcm9sZT1cImRpYWxvZ1wiXG4gICAgICBhcmlhLWxhYmVsPVwiTmV0d29ya1wiXG4gICAgICBkYXRhLXRpZD1cIm5ldHdvcmstcXVpY2tcIlxuICAgICAgQGtleWRvd24uZXNjPVwib3BlbiA9IGZhbHNlXCJcbiAgICA+XG4gICAgICA8aGVhZGVyIGNsYXNzPVwibmV0cV9faGVhZFwiPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIDpuYW1lPVwicmVtb3RlID8gJ2Nsb3VkJyA6ICd3aWZpJ1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8Yj57eyB0aXRsZSB9fTwvYj5cbiAgICAgICAgICA8c3BhbiB2LWlmPVwiZGV0YWlsXCI+e3sgZGV0YWlsIH19PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICA8dGVtcGxhdGUgdi1pZj1cIm9wZW5cIj5cbiAgICAgICAgPHdpZmktbWFuYWdlci1jYXJkIGNvbXBhY3QgLz5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5ldHFfX3J1bGVcIiAvPlxuICAgICAgICA8aG90c3BvdC1tYW5hZ2VyLWNhcmQgY29tcGFjdCAvPlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgIDp0bz1cInNldHRpbmdzVG9cIlxuICAgICAgICBjbGFzcz1cIm5ldHFfX2FsbFwiXG4gICAgICAgIGRhdGEtdGlkPVwibmV0d29yay1xdWljay1hbGxcIlxuICAgICAgICBAY2xpY2submF0aXZlPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgID5cbiAgICAgICAgV2ktRmkgYW5kIG5ldHdvcmsgc2V0dGluZ3NcbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwiY2hldnJvblJpZ2h0XCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPlxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L2Rpdj5cbiAgPC92LW1lbnU+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IHNjb3BlZFBhdGggfSBmcm9tICdAL3JvdXRlci9wcmludGVyUGFnZVBhdGhzJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcblxuLyoqXG4gKiBUaGUgcmFpbCdzIGJvdHRvbSBsaW5lLCBob3cgdGhpcyBicm93c2VyIHJlYWNoZXMgdGhlIHByaW50ZXIsIG9wZW5zIHRvXG4gKiB0aGUgcHJpbnRlcidzIFdpLUZpIGFuZCBob3RzcG90OiB0aGUgbmV0d29yayBpdCdzIG9uIGFuZCB0aGUgbmV4dCBmZXcgdG9cbiAqIGpvaW4gKHdpdGggdGhlIHNhbWUgd2FybmluZ3MgYXMgU2V0dGluZ3MpLCB0aGUgaG90c3BvdCdzIHN3aXRjaCwgYW5kIHRoZVxuICogd2F5IHRvIHRoZSB3aG9sZSBwYWdlLiBUaGUgY2FyZHMgbW91bnQgb25seSB3aGlsZSBpdCBpcyBvcGVuLCBzbyBub3RoaW5nXG4gKiBhc2tzIHRoZSBwcmludGVyIGFib3V0IFdpLUZpIG1lYW53aGlsZS4gSXQgc3RheXMgb3BlbiB0aHJvdWdoIHRoZWlyXG4gKiBkaWFsb2dzOiBvbmx5IGEgY2xpY2sgb3V0c2lkZSBib3RoIGl0IGFuZCB0aGVtLCBFc2MsIG9yIGEgcGFnZSBjaGFuZ2VcbiAqIGNsb3NlcyBpdC5cbiAqL1xuQENvbXBvbmVudCh7XG4gIGNvbXBvbmVudHM6IHtcbiAgICBXaWZpTWFuYWdlckNhcmQ6ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL3dpZGdldHMvd2lmaS9XaWZpTWFuYWdlckNhcmQudnVlJyksXG4gICAgSG90c3BvdE1hbmFnZXJDYXJkOiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy93aWRnZXRzL3dpZmkvSG90c3BvdE1hbmFnZXJDYXJkLnZ1ZScpXG4gIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOZXR3b3JrUXVpY2tNZW51IGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0pXG4gIHJlYWRvbmx5IGRldGFpbCE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSByZW1vdGU/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGNvbXBhY3Q/OiBib29sZWFuXG5cbiAgb3BlbiA9IGZhbHNlXG5cbiAgZ2V0IHNldHRpbmdzVG8gKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNjb3BlZFBhdGgoJy93aWZpJywgYWN0aXZlU2x1ZygpKVxuICB9XG5cbiAgcmVzaXplcjogUmVzaXplT2JzZXJ2ZXIgfCBudWxsID0gbnVsbFxuXG4gIC8qKlxuICAgKiBWdWV0aWZ5IHBsYWNlcyBhIG1lbnUgd2hlbiBpdCBvcGVuczsgdGhpcyBvbmUgZmlsbHMgaW4gYWZ0ZXIgKHRoZVxuICAgKiBuZXR3b3JrcyBhcnJpdmUpLCBzbyBpdCBpcyBwbGFjZWQgYWdhaW4gYXMgaXQgZ3Jvd3MsIHN0YXlpbmcgYWJvdmUgaXRzXG4gICAqIGJ1dHRvbiByYXRoZXIgdGhhbiBydW5uaW5nIG9mZiB0aGUgYm90dG9tIG9mIHRoZSB3aW5kb3cuXG4gICAqL1xuICBAV2F0Y2goJ29wZW4nKVxuICBvbk9wZW4gKG9wZW46IGJvb2xlYW4pIHtcbiAgICBpZiAob3Blbikge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk91dHNpZGUsIHRydWUpXG4gICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhbmVsID0gdGhpcy4kcmVmcy5wYW5lbCBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZFxuICAgICAgICBpZiAoIXBhbmVsIHx8IHR5cGVvZiBSZXNpemVPYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHJldHVyblxuICAgICAgICB0aGlzLnJlc2l6ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gKHRoaXMuJHJlZnMubWVudSBhcyB1bmtub3duIGFzIHsgb25SZXNpemU/OiAoKSA9PiB2b2lkIH0gfCB1bmRlZmluZWQpPy5vblJlc2l6ZT8uKCkpXG4gICAgICAgIHRoaXMucmVzaXplci5vYnNlcnZlKHBhbmVsKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk91dHNpZGUsIHRydWUpXG4gICAgICB0aGlzLnJlc2l6ZXI/LmRpc2Nvbm5lY3QoKVxuICAgICAgdGhpcy5yZXNpemVyID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIEBXYXRjaCgnJHJvdXRlLnBhdGgnKVxuICBvblJvdXRlICgpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk91dHNpZGUsIHRydWUpXG4gICAgdGhpcy5yZXNpemVyPy5kaXNjb25uZWN0KClcbiAgfVxuXG4gIC8qKiBBIGNsaWNrIGFueXdoZXJlIGJ1dCB0aGUgbWVudSwgaXRzIGJ1dHRvbiwgb3IgYSBkaWFsb2cgb3IgbWVudSBpdCBvcGVuZWQuICovXG4gIG9uT3V0c2lkZSAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgRWxlbWVudCB8IG51bGxcbiAgICBpZiAoIXRhcmdldCB8fCAhdGFyZ2V0LmNsb3Nlc3QpIHJldHVyblxuICAgIGlmICh0YXJnZXQuY2xvc2VzdCgnLm5ldHEsIC5uZXRxX190b2dnbGUsIC52LWRpYWxvZ19fY29udGVudCwgLnYtb3ZlcmxheSwgLnYtbWVudV9fY29udGVudCcpKSByZXR1cm5cbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubmV0cV9fdG9nZ2xlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICB3aWR0aDogMTAwJTtcbiAgICBwYWRkaW5nOiAwO1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuXG4gICAgJjpmb2N1cy12aXNpYmxlIHtcbiAgICAgIG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICAgIG91dGxpbmUtb2Zmc2V0OiAycHg7XG4gICAgfVxuICB9XG5cbiAgLm5ldHFfX3BhbmVsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogMTRweCAxNnB4IDEwcHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogMThweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBib3gtc2hhZG93OiAwIDEycHggNDBweCByZ2IoMCAwIDAgLyAzNSUpO1xuICB9XG5cbiAgLm5ldHFfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gICAgcGFkZGluZy1ib3R0b206IDZweDtcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG5cbiAgICBkaXYge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICBtaW4td2lkdGg6IDA7XG4gICAgfVxuXG4gICAgYiB7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgfVxuXG4gICAgc3BhbiB7XG4gICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICB9XG4gIH1cblxuICAubmV0cV9fcnVsZSB7XG4gICAgaGVpZ2h0OiAxcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWJvcmRlcik7XG4gIH1cblxuICAubmV0cV9fYWxsIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIG1pbi1oZWlnaHQ6IDQwcHg7XG4gICAgcGFkZGluZzogMCA0cHg7XG4gICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgfVxuPC9zdHlsZT5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC52LW1lbnVfX2NvbnRlbnQubmV0cSB7XG4gICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICBib3JkZXItcmFkaXVzOiAxOHB4O1xuICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgY29udGFpbjogbm9uZTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2xheW91dC9OZXR3b3JrUXVpY2tNZW51LnZ1ZSJ9