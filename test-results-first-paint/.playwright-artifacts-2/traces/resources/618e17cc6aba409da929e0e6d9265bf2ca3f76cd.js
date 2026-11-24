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
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { cloudState, printerName } from "/src/services/muon-cloud/state.ts";
import { dayText } from "/src/services/account/model.ts";
import { markNoticeRead, noticeState, watchNotices } from "/src/services/muon-cloud/notices.ts";
import isSetAppBadgeSupported from "/src/util/is-set-app-badge-supported.ts";
import linkExternalUrls from "/src/util/link-external-urls.ts";
import { Globals } from "/src/globals.ts";
let NoticesBell = class extends Mixins(StateMixin) {
  printer;
  menu = false;
  stop = null;
  get signedIn() {
    return !!cloudState.account;
  }
  get show() {
    return this.signedIn || this.printer;
  }
  get items() {
    return noticeState.items;
  }
  get printerNotifications() {
    return this.printer ? this.$store.getters["notifications/getNotifications"] : [];
  }
  get clearable() {
    return this.printerNotifications.filter((n) => n.clear);
  }
  get warningGroups() {
    if (!this.printer) return [];
    const getters = this.$store.getters;
    const groups = [];
    const printerWarnings = getters["printer/getPrinterWarnings"];
    if (printerWarnings.length > 0) {
      groups.push({
        title: this.$tc("app.general.error.app_warnings_found", void 0, { appName: Globals.PRODUCT_NAME }),
        items: printerWarnings.map((warning) => warning.message),
        help: this.$tc("app.general.error.app_setup_link", void 0, { url: Globals.DOCS_REQUIRED_CONFIGURATION })
      });
    }
    const klipperWarnings = getters["printer/getKlipperWarnings"];
    if (klipperWarnings.length > 0) {
      groups.push({
        title: this.$tc("app.general.error.app_warnings_found", void 0, { appName: "Klipper" }),
        items: klipperWarnings.map((warning) => warning.message)
      });
    }
    const failedComponents = getters["printer/getMoonrakerFailedComponents"];
    if (failedComponents.length > 0) {
      groups.push({
        title: this.$tc("app.general.error.failed_components"),
        items: failedComponents,
        help: this.$tc("app.general.error.components_config", void 0, { url: Globals.DOCS_MOONRAKER_COMPONENTS })
      });
    }
    const moonrakerWarnings = getters["printer/getMoonrakerWarnings"];
    if (moonrakerWarnings.length > 0) {
      groups.push({
        title: this.$tc("app.general.error.app_warnings_found", void 0, { appName: "Moonraker" }),
        items: moonrakerWarnings
      });
    }
    return groups;
  }
  get klippyDown() {
    return this.printer && !this.klippyReady;
  }
  get printerCount() {
    return (this.klippyDown ? 1 : 0) + this.warningGroups.reduce((sum, g) => sum + g.items.length, 0) + this.printerNotifications.filter((n) => !n.noCount).length;
  }
  get unread() {
    return this.printerCount + (this.signedIn ? noticeState.unread : 0);
  }
  /** The worst thing in it: red for Klipper down or an error, orange for a warning. */
  get tone() {
    if (this.klippyDown || this.printerNotifications.some((n) => n.type === "error")) return "error";
    if (this.warningGroups.length || this.printerNotifications.some((n) => n.type === "warning")) return "warning";
    return "none";
  }
  get label() {
    return this.unread > 0 ? `Notices, ${this.unread} unread` : "Notices";
  }
  get snoozes() {
    return [
      { label: "1 hour", delay: 3600 },
      { label: "1 day", delay: 3600 * 24 },
      { label: "1 week", delay: 3600 * 24 * 7 }
    ];
  }
  onUnread(value) {
    if (isSetAppBadgeSupported(navigator)) navigator.setAppBadge(value);
  }
  mounted() {
    this.$watch("signedIn", this.sync, { immediate: true });
  }
  beforeDestroy() {
    this.halt();
  }
  sync(signedIn) {
    this.halt();
    if (signedIn) this.stop = watchNotices();
  }
  halt() {
    this.stop?.();
    this.stop = null;
  }
  text(n) {
    const who = n.sharer?.display_name ?? n.shared_by ?? "Someone";
    const what = n.printer_id ? printerName(n.printer_id) : "a printer";
    return `${who} shared ${what} with you`;
  }
  when(n) {
    return dayText(n.created_at);
  }
  open(n) {
    markNoticeRead(n.id);
  }
  clear(n) {
    this.$store.dispatch("notifications/clearNotification", n);
  }
  clearAll() {
    this.$store.dispatch("notifications/clearAll");
  }
  snooze(n, wake_time) {
    this.$store.dispatch("announcements/dismiss", { entry_id: n.id, wake_time });
  }
  linkExternalUrls = linkExternalUrls;
};
__decorateClass([
  Prop({ type: Boolean, default: false })
], NoticesBell.prototype, "printer", 2);
__decorateClass([
  Watch("unread")
], NoticesBell.prototype, "onUnread", 1);
NoticesBell = __decorateClass([
  Component({})
], NoticesBell);
const _sfc_main = NoticesBell;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.show ? _c(__unplugin_components_0, { attrs: { "bottom": "", "left": "", "offset-y": "", "nudge-bottom": "8", "close-on-content-click": false, "min-width": "300", "max-width": "380", "content-class": "muon-notices__menu" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "muon-notices__bell", class: `muon-notices__bell--${_vm.tone}`, attrs: { "type": "button", "aria-label": _vm.label, "data-tid": "notices-bell" } }, "button", attrs, false), on), [_c(__unplugin_components_1, { attrs: { "name": "bell" } }), _vm.unread > 0 ? _c("span", { staticClass: "muon-notices__count", attrs: { "data-tid": "notices-count" } }, [_vm._v(_vm._s(_vm.unread > 99 ? "99+" : _vm.unread))]) : _vm._e()], 1)];
  } }], null, false, 1785778904), model: { value: _vm.menu, callback: function($$v) {
    _vm.menu = $$v;
  }, expression: "menu" } }, [_c("div", { staticClass: "muon-notices", attrs: { "role": "menu", "aria-label": "Notices", "data-tid": "notices" } }, [_vm.printer ? [_c("div", { staticClass: "muon-notices__head" }, [_c("p", { staticClass: "muon-notices__caps" }, [_vm._v(" This printer ")]), _vm.clearable.length ? _c("button", { staticClass: "muon-notices__clear", attrs: { "type": "button", "data-tid": "notices-clear-all" }, on: { "click": _vm.clearAll } }, [_vm._v(" Clear all ")]) : _vm._e()]), !_vm.klippyReady ? _c("section", { staticClass: "muon-notices__alert muon-notices__alert--error", attrs: { "data-tid": "notice-klippy" } }, [_c("b", [_vm._v("Klipper: " + _vm._s(_vm.klippyState))]), _c("span", { staticClass: "muon-notices__desc", domProps: { "innerHTML": _vm._s(_vm.klippyStateMessage) } })]) : _vm._e(), _vm._l(_vm.warningGroups, function(group) {
    return _c("section", { key: group.title, staticClass: "muon-notices__alert", attrs: { "data-tid": "notice-warnings" } }, [_c("b", [_vm._v(_vm._s(group.title))]), _c("ul", { staticClass: "muon-notices__desc" }, _vm._l(group.items, function(item, index) {
      return _c("li", { key: index, domProps: { "innerHTML": _vm._s(_vm.linkExternalUrls(item)) } });
    }), 0), group.help ? _c("span", { staticClass: "muon-notices__desc", domProps: { "innerHTML": _vm._s(group.help) } }) : _vm._e()]);
  }), _vm._l(_vm.printerNotifications, function(n) {
    return _c("div", { key: `printer-${n.id}`, staticClass: "muon-notices__note", class: `muon-notices__note--${n.type}`, attrs: { "data-tid": "printer-notice" } }, [_c("span", { staticClass: "muon-notices__dot" }), _c("span", { staticClass: "muon-notices__text" }, [_c("b", { domProps: { "innerHTML": _vm._s(n.title) } }), n.description ? _c("span", { staticClass: "muon-notices__desc", domProps: { "innerHTML": _vm._s(n.description) } }) : _vm._e(), _c("span", { staticClass: "muon-notices__when" }, [_vm._v(_vm._s(_vm.$filters.formatRelativeTimeToNow(n.timestamp * 1e3)))]), n.to || n.type === "announcement" ? _c("span", { staticClass: "muon-notices__links" }, [n.to ? [!n.to.startsWith("http") ? _c("router-link", { staticClass: "muon-notices__link", attrs: { "to": n.to }, nativeOn: { "click": function($event) {
      _vm.menu = false;
    } } }, [_vm._v(_vm._s(n.btnText || "Show me"))]) : _c("a", { staticClass: "muon-notices__link", attrs: { "href": n.to, "target": "_blank", "rel": "noopener" }, on: { "click": function($event) {
      _vm.menu = false;
    } } }, [_vm._v(_vm._s(n.btnText || "Read more"))])] : _vm._e(), n.type === "announcement" ? _vm._l(_vm.snoozes, function(s) {
      return _c("button", { key: s.delay, staticClass: "muon-notices__link", attrs: { "type": "button", "data-tid": `notice-snooze-${s.delay}` }, on: { "click": function($event) {
        return _vm.snooze(n, s.delay);
      } } }, [_vm._v("Snooze " + _vm._s(s.label))]);
    }) : _vm._e()], 2) : _vm._e()]), n.suffix ? _c("span", { staticClass: "muon-notices__suffix", domProps: { "innerHTML": _vm._s(n.suffix) } }) : _vm._e(), n.clear ? _c("button", { staticClass: "muon-notices__x", attrs: { "type": "button", "aria-label": "Dismiss" }, on: { "click": function($event) {
      return _vm.clear(n);
    } } }, [_c(__unplugin_components_2, { attrs: { "name": "x", "small": "" } })], 1) : _vm._e()]);
  }), _vm.printerCount === 0 ? _c("p", { staticClass: "muon-notices__empty" }, [_vm._v(" Nothing new on this printer ")]) : _vm._e()] : _vm._e(), _vm.signedIn ? [_c("p", { staticClass: "muon-notices__caps" }, [_vm._v(" " + _vm._s(_vm.printer ? "Shared with you" : "Notices") + " ")]), !_vm.items.length ? _c("p", { staticClass: "muon-notices__empty" }, [_vm._v(" No notices ")]) : _vm._e(), _vm._l(_vm.items, function(n) {
    return _c("button", { key: n.id, staticClass: "muon-notices__item", class: { "muon-notices__item--unread": n.read_at === null }, attrs: { "type": "button", "role": "menuitem", "data-tid": "notice" }, on: { "click": function($event) {
      return _vm.open(n);
    } } }, [_c("span", { staticClass: "muon-notices__dot", attrs: { "aria-hidden": n.read_at !== null } }), _c("span", { staticClass: "muon-notices__text" }, [_c("span", [_vm._v(_vm._s(_vm.text(n)))]), _c("span", { staticClass: "muon-notices__when" }, [_vm._v(_vm._s(_vm.when(n)))])])]);
  })] : _vm._e()], 2)]) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/NoticesBell.vue?vue&type=style&index=0&scoped=1b4a7446&lang.scss";
import "/src/components/muon-cloud/NoticesBell.vue?vue&type=style&index=1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "1b4a7446",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/NoticesBell.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQStMQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBZ0JBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSx1Q0FDQSxpRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFqSkE7QUFBQSxFQURBO0FBQUEsR0FEQSxZQUVBO0FBZ0dBO0FBQUEsRUFEQTtBQUFBLEdBakdBLFlBa0dBO0FBbEdBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIk5vdGljZXNCZWxsLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LW1lbnVcbiAgICB2LWlmPVwic2hvd1wiXG4gICAgdi1tb2RlbD1cIm1lbnVcIlxuICAgIGJvdHRvbVxuICAgIGxlZnRcbiAgICBvZmZzZXQteVxuICAgIG51ZGdlLWJvdHRvbT1cIjhcIlxuICAgIDpjbG9zZS1vbi1jb250ZW50LWNsaWNrPVwiZmFsc2VcIlxuICAgIG1pbi13aWR0aD1cIjMwMFwiXG4gICAgbWF4LXdpZHRoPVwiMzgwXCJcbiAgICBjb250ZW50LWNsYXNzPVwibXVvbi1ub3RpY2VzX19tZW51XCJcbiAgPlxuICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX2JlbGxcIlxuICAgICAgICA6Y2xhc3M9XCJgbXVvbi1ub3RpY2VzX19iZWxsLS0ke3RvbmV9YFwiXG4gICAgICAgIDphcmlhLWxhYmVsPVwibGFiZWxcIlxuICAgICAgICBkYXRhLXRpZD1cIm5vdGljZXMtYmVsbFwiXG4gICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cImJlbGxcIiAvPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJ1bnJlYWQgPiAwXCJcbiAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fY291bnRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibm90aWNlcy1jb3VudFwiXG4gICAgICAgID57eyB1bnJlYWQgPiA5OSA/ICc5OSsnIDogdW5yZWFkIH19PC9zcGFuPlxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cIm11b24tbm90aWNlc1wiXG4gICAgICByb2xlPVwibWVudVwiXG4gICAgICBhcmlhLWxhYmVsPVwiTm90aWNlc1wiXG4gICAgICBkYXRhLXRpZD1cIm5vdGljZXNcIlxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwicHJpbnRlclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibXVvbi1ub3RpY2VzX19oZWFkXCI+XG4gICAgICAgICAgPHAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX2NhcHNcIj5cbiAgICAgICAgICAgIFRoaXMgcHJpbnRlclxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWlmPVwiY2xlYXJhYmxlLmxlbmd0aFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwibXVvbi1ub3RpY2VzX19jbGVhclwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cIm5vdGljZXMtY2xlYXItYWxsXCJcbiAgICAgICAgICAgIEBjbGljaz1cImNsZWFyQWxsXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICBDbGVhciBhbGxcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzZWN0aW9uXG4gICAgICAgICAgdi1pZj1cIiFrbGlwcHlSZWFkeVwiXG4gICAgICAgICAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX2FsZXJ0IG11b24tbm90aWNlc19fYWxlcnQtLWVycm9yXCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm5vdGljZS1rbGlwcHlcIlxuICAgICAgICA+XG4gICAgICAgICAgPGI+S2xpcHBlcjoge3sga2xpcHB5U3RhdGUgfX08L2I+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGNsYXNzPVwibXVvbi1ub3RpY2VzX19kZXNjXCJcbiAgICAgICAgICAgIHYtaHRtbD1cImtsaXBweVN0YXRlTWVzc2FnZVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICA8c2VjdGlvblxuICAgICAgICAgIHYtZm9yPVwiZ3JvdXAgaW4gd2FybmluZ0dyb3Vwc1wiXG4gICAgICAgICAgOmtleT1cImdyb3VwLnRpdGxlXCJcbiAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fYWxlcnRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwibm90aWNlLXdhcm5pbmdzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxiPnt7IGdyb3VwLnRpdGxlIH19PC9iPlxuICAgICAgICAgIDx1bCBjbGFzcz1cIm11b24tbm90aWNlc19fZGVzY1wiPlxuICAgICAgICAgICAgPGxpXG4gICAgICAgICAgICAgIHYtZm9yPVwiKGl0ZW0sIGluZGV4KSBpbiBncm91cC5pdGVtc1wiXG4gICAgICAgICAgICAgIDprZXk9XCJpbmRleFwiXG4gICAgICAgICAgICAgIHYtaHRtbD1cImxpbmtFeHRlcm5hbFVybHMoaXRlbSlcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICB2LWlmPVwiZ3JvdXAuaGVscFwiXG4gICAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fZGVzY1wiXG4gICAgICAgICAgICB2LWh0bWw9XCJncm91cC5oZWxwXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWZvcj1cIm4gaW4gcHJpbnRlck5vdGlmaWNhdGlvbnNcIlxuICAgICAgICAgIDprZXk9XCJgcHJpbnRlci0ke24uaWR9YFwiXG4gICAgICAgICAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX25vdGVcIlxuICAgICAgICAgIDpjbGFzcz1cImBtdW9uLW5vdGljZXNfX25vdGUtLSR7bi50eXBlfWBcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicHJpbnRlci1ub3RpY2VcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtdW9uLW5vdGljZXNfX2RvdFwiIC8+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtdW9uLW5vdGljZXNfX3RleHRcIj5cbiAgICAgICAgICAgIDxiIHYtaHRtbD1cIm4udGl0bGVcIiAvPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1pZj1cIm4uZGVzY3JpcHRpb25cIlxuICAgICAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fZGVzY1wiXG4gICAgICAgICAgICAgIHYtaHRtbD1cIm4uZGVzY3JpcHRpb25cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi1ub3RpY2VzX193aGVuXCI+e3sgJGZpbHRlcnMuZm9ybWF0UmVsYXRpdmVUaW1lVG9Ob3cobi50aW1lc3RhbXAgKiAxMDAwKSB9fTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIHYtaWY9XCJuLnRvIHx8IG4udHlwZSA9PT0gJ2Fubm91bmNlbWVudCdcIlxuICAgICAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fbGlua3NcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8dGVtcGxhdGUgdi1pZj1cIm4udG9cIj5cbiAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgICAgICAgICAgIHYtaWY9XCIhbi50by5zdGFydHNXaXRoKCdodHRwJylcIlxuICAgICAgICAgICAgICAgICAgOnRvPVwibi50b1wiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fbGlua1wiXG4gICAgICAgICAgICAgICAgICBAY2xpY2submF0aXZlPVwibWVudSA9IGZhbHNlXCJcbiAgICAgICAgICAgICAgICA+e3sgbi5idG5UZXh0IHx8ICdTaG93IG1lJyB9fTwvcm91dGVyLWxpbms+XG4gICAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgICAgICAgICAgOmhyZWY9XCJuLnRvXCJcbiAgICAgICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgICAgICByZWw9XCJub29wZW5lclwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fbGlua1wiXG4gICAgICAgICAgICAgICAgICBAY2xpY2s9XCJtZW51ID0gZmFsc2VcIlxuICAgICAgICAgICAgICAgID57eyBuLmJ0blRleHQgfHwgJ1JlYWQgbW9yZScgfX08L2E+XG4gICAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwibi50eXBlID09PSAnYW5ub3VuY2VtZW50J1wiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHYtZm9yPVwicyBpbiBzbm9vemVzXCJcbiAgICAgICAgICAgICAgICAgIDprZXk9XCJzLmRlbGF5XCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX2xpbmtcIlxuICAgICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYG5vdGljZS1zbm9vemUtJHtzLmRlbGF5fWBcIlxuICAgICAgICAgICAgICAgICAgQGNsaWNrPVwic25vb3plKG4sIHMuZGVsYXkpXCJcbiAgICAgICAgICAgICAgICA+U25vb3plIHt7IHMubGFiZWwgfX08L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIHYtaWY9XCJuLnN1ZmZpeFwiXG4gICAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fc3VmZml4XCJcbiAgICAgICAgICAgIHYtaHRtbD1cIm4uc3VmZml4XCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHYtaWY9XCJuLmNsZWFyXCJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX3hcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkRpc21pc3NcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY2xlYXIobilcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIG5hbWU9XCJ4XCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJwcmludGVyQ291bnQgPT09IDBcIlxuICAgICAgICAgIGNsYXNzPVwibXVvbi1ub3RpY2VzX19lbXB0eVwiXG4gICAgICAgID5cbiAgICAgICAgICBOb3RoaW5nIG5ldyBvbiB0aGlzIHByaW50ZXJcbiAgICAgICAgPC9wPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2lnbmVkSW5cIj5cbiAgICAgICAgPHAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX2NhcHNcIj5cbiAgICAgICAgICB7eyBwcmludGVyID8gJ1NoYXJlZCB3aXRoIHlvdScgOiAnTm90aWNlcycgfX1cbiAgICAgICAgPC9wPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCIhaXRlbXMubGVuZ3RoXCJcbiAgICAgICAgICBjbGFzcz1cIm11b24tbm90aWNlc19fZW1wdHlcIlxuICAgICAgICA+XG4gICAgICAgICAgTm8gbm90aWNlc1xuICAgICAgICA8L3A+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cIm4gaW4gaXRlbXNcIlxuICAgICAgICAgIDprZXk9XCJuLmlkXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICByb2xlPVwibWVudWl0ZW1cIlxuICAgICAgICAgIGNsYXNzPVwibXVvbi1ub3RpY2VzX19pdGVtXCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdtdW9uLW5vdGljZXNfX2l0ZW0tLXVucmVhZCc6IG4ucmVhZF9hdCA9PT0gbnVsbCB9XCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm5vdGljZVwiXG4gICAgICAgICAgQGNsaWNrPVwib3BlbihuKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJtdW9uLW5vdGljZXNfX2RvdFwiXG4gICAgICAgICAgICA6YXJpYS1oaWRkZW49XCJuLnJlYWRfYXQgIT09IG51bGxcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtdW9uLW5vdGljZXNfX3RleHRcIj5cbiAgICAgICAgICAgIDxzcGFuPnt7IHRleHQobikgfX08L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm11b24tbm90aWNlc19fd2hlblwiPnt7IHdoZW4obikgfX08L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gIDwvdi1tZW51PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBQcm9wLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCB0eXBlIHsgTm90aWNlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FwaSdcbmltcG9ydCB7IGNsb3VkU3RhdGUsIHByaW50ZXJOYW1lIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgZGF5VGV4dCB9IGZyb20gJ0Avc2VydmljZXMvYWNjb3VudC9tb2RlbCdcbmltcG9ydCB7IG1hcmtOb3RpY2VSZWFkLCBub3RpY2VTdGF0ZSwgd2F0Y2hOb3RpY2VzIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL25vdGljZXMnXG5pbXBvcnQgdHlwZSB7IEFwcE5vdGlmaWNhdGlvbiB9IGZyb20gJ0Avc3RvcmUvbm90aWZpY2F0aW9ucy90eXBlcydcbmltcG9ydCBpc1NldEFwcEJhZGdlU3VwcG9ydGVkIGZyb20gJ0AvdXRpbC9pcy1zZXQtYXBwLWJhZGdlLXN1cHBvcnRlZCdcbmltcG9ydCBsaW5rRXh0ZXJuYWxVcmxzIGZyb20gJ0AvdXRpbC9saW5rLWV4dGVybmFsLXVybHMnXG5pbXBvcnQgeyBHbG9iYWxzIH0gZnJvbSAnQC9nbG9iYWxzJ1xuXG5pbnRlcmZhY2UgV2FybmluZ0dyb3VwIHtcbiAgdGl0bGU6IHN0cmluZ1xuICBpdGVtczogc3RyaW5nW11cbiAgaGVscD86IHN0cmluZ1xufVxuXG4vKipcbiAqIFRoZSBvbmUgbm90aWZpY2F0aW9uIGljb24gaW4gdGhlIGhlYWRlci4gV2l0aCBgcHJpbnRlcmAgaXQgYWxzbyBjYXJyaWVzXG4gKiB0aGF0IHByaW50ZXIncyBzaWRlOiBLbGlwcGVyJ3Mgc3RhdGUgd2hlbiBub3QgcmVhZHksIHRoZSBwcmludGVyLCBLbGlwcGVyXG4gKiBhbmQgTW9vbnJha2VyIHdhcm5pbmdzLCBhbmQgdGhlIG5vdGlmaWNhdGlvbnMgc3RvcmUgKE1vb25yYWtlclxuICogYW5ub3VuY2VtZW50cywgdXBkYXRlIGFuZCB2ZXJzaW9uIG5vdGljZXMsIHRocm90dGxpbmcpLiBTaWduZWQgaW4sIGl0XG4gKiBsaXN0cyB0aGUgY29uc29sZSdzIHNoYXJpbmcgbm90aWNlczsgb3BlbmluZyBvbmUgbWFya3MgaXQgcmVhZC5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5vdGljZXNCZWxsIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9KVxuICByZWFkb25seSBwcmludGVyITogYm9vbGVhblxuXG4gIG1lbnUgPSBmYWxzZVxuICBzdG9wOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG4gIGdldCBzaWduZWRJbiAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhY2xvdWRTdGF0ZS5hY2NvdW50XG4gIH1cblxuICBnZXQgc2hvdyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc2lnbmVkSW4gfHwgdGhpcy5wcmludGVyXG4gIH1cblxuICBnZXQgaXRlbXMgKCk6IE5vdGljZVtdIHtcbiAgICByZXR1cm4gbm90aWNlU3RhdGUuaXRlbXNcbiAgfVxuXG4gIGdldCBwcmludGVyTm90aWZpY2F0aW9ucyAoKTogQXBwTm90aWZpY2F0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLnByaW50ZXIgPyB0aGlzLiRzdG9yZS5nZXR0ZXJzWydub3RpZmljYXRpb25zL2dldE5vdGlmaWNhdGlvbnMnXSA6IFtdXG4gIH1cblxuICBnZXQgY2xlYXJhYmxlICgpOiBBcHBOb3RpZmljYXRpb25bXSB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRlck5vdGlmaWNhdGlvbnMuZmlsdGVyKG4gPT4gbi5jbGVhcilcbiAgfVxuXG4gIGdldCB3YXJuaW5nR3JvdXBzICgpOiBXYXJuaW5nR3JvdXBbXSB7XG4gICAgaWYgKCF0aGlzLnByaW50ZXIpIHJldHVybiBbXVxuICAgIGNvbnN0IGdldHRlcnMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzXG4gICAgY29uc3QgZ3JvdXBzOiBXYXJuaW5nR3JvdXBbXSA9IFtdXG4gICAgY29uc3QgcHJpbnRlcldhcm5pbmdzID0gZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludGVyV2FybmluZ3MnXSBhcyBBcnJheTx7IG1lc3NhZ2U6IHN0cmluZyB9PlxuICAgIGlmIChwcmludGVyV2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgZ3JvdXBzLnB1c2goe1xuICAgICAgICB0aXRsZTogdGhpcy4kdGMoJ2FwcC5nZW5lcmFsLmVycm9yLmFwcF93YXJuaW5nc19mb3VuZCcsIHVuZGVmaW5lZCwgeyBhcHBOYW1lOiBHbG9iYWxzLlBST0RVQ1RfTkFNRSB9KSxcbiAgICAgICAgaXRlbXM6IHByaW50ZXJXYXJuaW5ncy5tYXAod2FybmluZyA9PiB3YXJuaW5nLm1lc3NhZ2UpLFxuICAgICAgICBoZWxwOiB0aGlzLiR0YygnYXBwLmdlbmVyYWwuZXJyb3IuYXBwX3NldHVwX2xpbmsnLCB1bmRlZmluZWQsIHsgdXJsOiBHbG9iYWxzLkRPQ1NfUkVRVUlSRURfQ09ORklHVVJBVElPTiB9KVxuICAgICAgfSlcbiAgICB9XG4gICAgY29uc3Qga2xpcHBlcldhcm5pbmdzID0gZ2V0dGVyc1sncHJpbnRlci9nZXRLbGlwcGVyV2FybmluZ3MnXSBhcyBBcnJheTx7IG1lc3NhZ2U6IHN0cmluZyB9PlxuICAgIGlmIChrbGlwcGVyV2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgZ3JvdXBzLnB1c2goe1xuICAgICAgICB0aXRsZTogdGhpcy4kdGMoJ2FwcC5nZW5lcmFsLmVycm9yLmFwcF93YXJuaW5nc19mb3VuZCcsIHVuZGVmaW5lZCwgeyBhcHBOYW1lOiAnS2xpcHBlcicgfSksXG4gICAgICAgIGl0ZW1zOiBrbGlwcGVyV2FybmluZ3MubWFwKHdhcm5pbmcgPT4gd2FybmluZy5tZXNzYWdlKVxuICAgICAgfSlcbiAgICB9XG4gICAgY29uc3QgZmFpbGVkQ29tcG9uZW50cyA9IGdldHRlcnNbJ3ByaW50ZXIvZ2V0TW9vbnJha2VyRmFpbGVkQ29tcG9uZW50cyddIGFzIHN0cmluZ1tdXG4gICAgaWYgKGZhaWxlZENvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgZ3JvdXBzLnB1c2goe1xuICAgICAgICB0aXRsZTogdGhpcy4kdGMoJ2FwcC5nZW5lcmFsLmVycm9yLmZhaWxlZF9jb21wb25lbnRzJyksXG4gICAgICAgIGl0ZW1zOiBmYWlsZWRDb21wb25lbnRzLFxuICAgICAgICBoZWxwOiB0aGlzLiR0YygnYXBwLmdlbmVyYWwuZXJyb3IuY29tcG9uZW50c19jb25maWcnLCB1bmRlZmluZWQsIHsgdXJsOiBHbG9iYWxzLkRPQ1NfTU9PTlJBS0VSX0NPTVBPTkVOVFMgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIGNvbnN0IG1vb25yYWtlcldhcm5pbmdzID0gZ2V0dGVyc1sncHJpbnRlci9nZXRNb29ucmFrZXJXYXJuaW5ncyddIGFzIHN0cmluZ1tdXG4gICAgaWYgKG1vb25yYWtlcldhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGdyb3Vwcy5wdXNoKHtcbiAgICAgICAgdGl0bGU6IHRoaXMuJHRjKCdhcHAuZ2VuZXJhbC5lcnJvci5hcHBfd2FybmluZ3NfZm91bmQnLCB1bmRlZmluZWQsIHsgYXBwTmFtZTogJ01vb25yYWtlcicgfSksXG4gICAgICAgIGl0ZW1zOiBtb29ucmFrZXJXYXJuaW5nc1xuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGdyb3Vwc1xuICB9XG5cbiAgZ2V0IGtsaXBweURvd24gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnByaW50ZXIgJiYgIXRoaXMua2xpcHB5UmVhZHlcbiAgfVxuXG4gIGdldCBwcmludGVyQ291bnQgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuICh0aGlzLmtsaXBweURvd24gPyAxIDogMCkgK1xuICAgICAgdGhpcy53YXJuaW5nR3JvdXBzLnJlZHVjZSgoc3VtLCBnKSA9PiBzdW0gKyBnLml0ZW1zLmxlbmd0aCwgMCkgK1xuICAgICAgdGhpcy5wcmludGVyTm90aWZpY2F0aW9ucy5maWx0ZXIobiA9PiAhbi5ub0NvdW50KS5sZW5ndGhcbiAgfVxuXG4gIGdldCB1bnJlYWQgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRlckNvdW50ICsgKHRoaXMuc2lnbmVkSW4gPyBub3RpY2VTdGF0ZS51bnJlYWQgOiAwKVxuICB9XG5cbiAgLyoqIFRoZSB3b3JzdCB0aGluZyBpbiBpdDogcmVkIGZvciBLbGlwcGVyIGRvd24gb3IgYW4gZXJyb3IsIG9yYW5nZSBmb3IgYSB3YXJuaW5nLiAqL1xuICBnZXQgdG9uZSAoKTogJ2Vycm9yJyB8ICd3YXJuaW5nJyB8ICdub25lJyB7XG4gICAgaWYgKHRoaXMua2xpcHB5RG93biB8fCB0aGlzLnByaW50ZXJOb3RpZmljYXRpb25zLnNvbWUobiA9PiBuLnR5cGUgPT09ICdlcnJvcicpKSByZXR1cm4gJ2Vycm9yJ1xuICAgIGlmICh0aGlzLndhcm5pbmdHcm91cHMubGVuZ3RoIHx8IHRoaXMucHJpbnRlck5vdGlmaWNhdGlvbnMuc29tZShuID0+IG4udHlwZSA9PT0gJ3dhcm5pbmcnKSkgcmV0dXJuICd3YXJuaW5nJ1xuICAgIHJldHVybiAnbm9uZSdcbiAgfVxuXG4gIGdldCBsYWJlbCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy51bnJlYWQgPiAwID8gYE5vdGljZXMsICR7dGhpcy51bnJlYWR9IHVucmVhZGAgOiAnTm90aWNlcydcbiAgfVxuXG4gIGdldCBzbm9vemVzICgpOiBBcnJheTx7IGxhYmVsOiBzdHJpbmcsIGRlbGF5OiBudW1iZXIgfT4ge1xuICAgIHJldHVybiBbXG4gICAgICB7IGxhYmVsOiAnMSBob3VyJywgZGVsYXk6IDM2MDAgfSxcbiAgICAgIHsgbGFiZWw6ICcxIGRheScsIGRlbGF5OiAzNjAwICogMjQgfSxcbiAgICAgIHsgbGFiZWw6ICcxIHdlZWsnLCBkZWxheTogMzYwMCAqIDI0ICogNyB9XG4gICAgXVxuICB9XG5cbiAgQFdhdGNoKCd1bnJlYWQnKVxuICBvblVucmVhZCAodmFsdWU6IG51bWJlcikge1xuICAgIGlmIChpc1NldEFwcEJhZGdlU3VwcG9ydGVkKG5hdmlnYXRvcikpIG5hdmlnYXRvci5zZXRBcHBCYWRnZSh2YWx1ZSlcbiAgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMuJHdhdGNoKCdzaWduZWRJbicsIHRoaXMuc3luYywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuaGFsdCgpXG4gIH1cblxuICBzeW5jIChzaWduZWRJbjogYm9vbGVhbikge1xuICAgIHRoaXMuaGFsdCgpXG4gICAgaWYgKHNpZ25lZEluKSB0aGlzLnN0b3AgPSB3YXRjaE5vdGljZXMoKVxuICB9XG5cbiAgaGFsdCAoKSB7XG4gICAgdGhpcy5zdG9wPy4oKVxuICAgIHRoaXMuc3RvcCA9IG51bGxcbiAgfVxuXG4gIHRleHQgKG46IE5vdGljZSk6IHN0cmluZyB7XG4gICAgY29uc3Qgd2hvID0gbi5zaGFyZXI/LmRpc3BsYXlfbmFtZSA/PyBuLnNoYXJlZF9ieSA/PyAnU29tZW9uZSdcbiAgICBjb25zdCB3aGF0ID0gbi5wcmludGVyX2lkID8gcHJpbnRlck5hbWUobi5wcmludGVyX2lkKSA6ICdhIHByaW50ZXInXG4gICAgcmV0dXJuIGAke3dob30gc2hhcmVkICR7d2hhdH0gd2l0aCB5b3VgXG4gIH1cblxuICB3aGVuIChuOiBOb3RpY2UpOiBzdHJpbmcge1xuICAgIHJldHVybiBkYXlUZXh0KG4uY3JlYXRlZF9hdClcbiAgfVxuXG4gIG9wZW4gKG46IE5vdGljZSkge1xuICAgIG1hcmtOb3RpY2VSZWFkKG4uaWQpXG4gIH1cblxuICBjbGVhciAobjogQXBwTm90aWZpY2F0aW9uKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ25vdGlmaWNhdGlvbnMvY2xlYXJOb3RpZmljYXRpb24nLCBuKVxuICB9XG5cbiAgY2xlYXJBbGwgKCkge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdub3RpZmljYXRpb25zL2NsZWFyQWxsJylcbiAgfVxuXG4gIHNub296ZSAobjogQXBwTm90aWZpY2F0aW9uLCB3YWtlX3RpbWU6IG51bWJlcikge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdhbm5vdW5jZW1lbnRzL2Rpc21pc3MnLCB7IGVudHJ5X2lkOiBuLmlkLCB3YWtlX3RpbWUgfSlcbiAgfVxuXG4gIGxpbmtFeHRlcm5hbFVybHMgPSBsaW5rRXh0ZXJuYWxVcmxzXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubXVvbi1ub3RpY2VzX19iZWxsIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiA0MHB4O1xuICAgIGhlaWdodDogNDBweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1ob3Zlcik7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2NvdW50IHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgdG9wOiAzcHg7XG4gICAgcmlnaHQ6IDFweDtcbiAgICBtaW4td2lkdGg6IDE3cHg7XG4gICAgaGVpZ2h0OiAxN3B4O1xuICAgIHBhZGRpbmc6IDAgNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDlweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLW9uLWFjY2VudCwgI2ZmZik7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgbGluZS1oZWlnaHQ6IDE3cHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB9XG4gIC5tdW9uLW5vdGljZXNfX2JlbGwtLXdhcm5pbmcge1xuICAgIGNvbG9yOiB2YXIoLS1tM2Qtd2FybmluZyk7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19iZWxsLS1lcnJvciB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fYmVsbC0td2FybmluZyAubXVvbi1ub3RpY2VzX19jb3VudCB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXdhcm5pbmcpO1xuICAgIGNvbG9yOiAjMWQxMzAwO1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fYmVsbC0tZXJyb3IgLm11b24tbm90aWNlc19fY291bnQge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1kYW5nZXIpO1xuICAgIGNvbG9yOiAjZmZmO1xuICB9XG48L3N0eWxlPlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbiAgLy8gR2xvYmFsOiB0aGUgbWVudSBtb3VudHMgb3V0c2lkZSB0aGUgaGVhZGVyLlxuICAubXVvbi1ub3RpY2VzX19tZW51IHtcbiAgICBib3JkZXItcmFkaXVzOiAxMnB4ICFpbXBvcnRhbnQ7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpICFpbXBvcnRhbnQ7XG4gICAgYm94LXNoYWRvdzogdmFyKC0tbTNkLXNoYWRvdy1mbG9hdCwgMCA4cHggMjRweCByZ2IoMCAwIDAgLyA0NSUpKSwgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLm11b24tbm90aWNlcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1heC1oZWlnaHQ6IDQyMHB4O1xuICAgIHBhZGRpbmc6IDZweDtcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fY2FwcyB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDZweCAxMHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjA4ZW07XG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2VtcHR5IHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMTJweCAxMHB4IDE0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2l0ZW0ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgZ2FwOiAxMHB4O1xuICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcblxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyKTtcbiAgICB9XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19pdGVtLS11bnJlYWQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2RvdCB7XG4gICAgZmxleDogbm9uZTtcbiAgICB3aWR0aDogOHB4O1xuICAgIGhlaWdodDogOHB4O1xuICAgIG1hcmdpbi10b3A6IDZweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19pdGVtLS11bnJlYWQgLm11b24tbm90aWNlc19fZG90IHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX3RleHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDJweDtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX3doZW4ge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19oZWFkIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fY2xlYXIsXG4gIC5tdW9uLW5vdGljZXNfX2xpbmsge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgaGVpZ2h0OiAyOHB4O1xuICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19jbGVhciB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuXG4gICAgJjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQpO1xuICAgIH1cbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2xpbmsge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2xpbmtzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDZweDtcbiAgICBtYXJnaW4tdG9wOiA2cHg7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19hbGVydCxcbiAgLm11b24tbm90aWNlc19fbm90ZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBnYXA6IDEwcHg7XG4gICAgcGFkZGluZzogMTBweDtcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgb3ZlcmZsb3ctd3JhcDogYW55d2hlcmU7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX19hbGVydCB7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDRweDtcbiAgICBib3JkZXItbGVmdDogM3B4IHNvbGlkIHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX2FsZXJ0LS1lcnJvciB7XG4gICAgYm9yZGVyLWxlZnQtY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fbm90ZSAubXVvbi1ub3RpY2VzX19kb3Qge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fbm90ZS0tc3VjY2VzcyAubXVvbi1ub3RpY2VzX19kb3QgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VjY2Vzcyk7IH1cbiAgLm11b24tbm90aWNlc19fbm90ZS0td2FybmluZyAubXVvbi1ub3RpY2VzX19kb3QgeyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtd2FybmluZyk7IH1cbiAgLm11b24tbm90aWNlc19fbm90ZS0tZXJyb3IgLm11b24tbm90aWNlc19fZG90IHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWRhbmdlcik7IH1cblxuICAubXVvbi1ub3RpY2VzX19kZXNjIHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZy1sZWZ0OiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGxpc3Qtc3R5bGUtcG9zaXRpb246IGluc2lkZTtcbiAgfVxuXG4gIC5tdW9uLW5vdGljZXNfX25vdGUgLm11b24tbm90aWNlc19fdGV4dCB7XG4gICAgZmxleDogMSAxIGF1dG87XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLm11b24tbm90aWNlc19fc3VmZml4IHtcbiAgICBmbGV4OiBub25lO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAyMHB4O1xuICAgIGZvbnQtdmFyaWFudC1udW1lcmljOiB0YWJ1bGFyLW51bXM7XG4gIH1cblxuICAubXVvbi1ub3RpY2VzX194IHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDI4cHg7XG4gICAgaGVpZ2h0OiAyOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcblxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL211b24tY2xvdWQvTm90aWNlc0JlbGwudnVlIn0=