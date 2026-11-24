/* unplugin-vue-components disabled */import __unplugin_components_8 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_7 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_6 from "/src/components/layout/NetworkQuickMenu.vue";
import __unplugin_components_5 from "/src/components/layout/HotspotCount.vue";
import __unplugin_components_4 from "/src/components/layout/AppRailLink.vue";
import __unplugin_components_3 from "/src/components/layout/AppRailLink.vue";
import __unplugin_components_2 from "/src/components/layout/AppRailLink.vue";
import __unplugin_components_1 from "/src/components/layout/AppRailLink.vue";
import { VNavigationDrawer as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import FrameMixin from "/src/mixins/frame.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { ALL_PRINTERS_KEY, LIBRARY_KEY } from "/src/router/printerSections.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { remoteRouteLabel } from "/src/services/muon-ble/link.ts";
import { networkRouteLabel } from "/src/services/hotspot/model.ts";
import { hostOf } from "/src/services/muon-cloud/directory.ts";
import { probeSlicer } from "/src/services/slicer-bridge/slicerUrl.ts";
import AppRailLink from "/src/components/layout/AppRailLink.vue";
import NetworkQuickMenu from "/src/components/layout/NetworkQuickMenu.vue";
import HotspotCount from "/src/components/layout/HotspotCount.vue";
let AppRail = class extends Mixins(FrameMixin, BrowserMixin) {
  allPrintersKey = ALL_PRINTERS_KEY;
  libraryKey = LIBRARY_KEY;
  /** The Library, or one of its prints, is open. */
  get libraryOpen() {
    return !!this.$route.name?.startsWith("Library");
  }
  created() {
    probeSlicer();
  }
  get compact() {
    return this.$vuetify.breakpoint.mdAndDown;
  }
  get mainSections() {
    return this.sections.filter((s) => s.group !== "tools");
  }
  get toolSections() {
    return this.sections.filter((s) => s.group === "tools");
  }
  get enableKeyboardShortcuts() {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts;
  }
  keysFor(key) {
    return this.enableKeyboardShortcuts ? `G ${key.toUpperCase()}` : void 0;
  }
  /** Through Muon3D's service, rather than straight to the printer. */
  get remote() {
    return !!cloudState.activePrinterId;
  }
  get routeTitle() {
    return this.remote ? remoteRouteLabel(cloudState.activePrinterId) : networkRouteLabel();
  }
  get routeDetail() {
    if (this.remote) return "Some settings are locked away from home";
    const apiUrl = this.$store.state.config.apiUrl || "";
    return apiUrl ? hostOf(apiUrl) : "";
  }
};
AppRail = __decorateClass([
  Component({ components: { AppRailLink, NetworkQuickMenu, HotspotCount } })
], AppRail);
const _sfc_main = AppRail;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { staticClass: "app-rail", class: { "app-rail--compact": _vm.compact }, attrs: { "app": "", "permanent": "", "clipped": "", "width": _vm.compact ? _vm.$globals.RAIL_WIDTH_COMPACT : _vm.$globals.RAIL_WIDTH, "color": "transparent" } }, [_c("nav", { staticClass: "app-rail__body", attrs: { "aria-label": "Pages" } }, [_c(__unplugin_components_1, { attrs: { "to": "/", "icon": "printers", "label": "All printers", "keys": _vm.keysFor(_vm.allPrintersKey), "compact": _vm.compact, "data-tid": "rail-all-printers" } }), _c(__unplugin_components_2, { attrs: { "to": "/library", "icon": "library", "label": "Library", "keys": _vm.keysFor(_vm.libraryKey), "active": _vm.libraryOpen, "compact": _vm.compact, "data-tid": "rail-library" } }), _c("div", { staticClass: "app-rail__rule" }), _vm._l(_vm.mainSections, function(section) {
    return [_c(__unplugin_components_3, { key: section.id, attrs: { "to": _vm.sectionTo(section), "icon": section.icon, "label": section.label, "keys": _vm.keysFor(section.key), "active": _vm.currentSection === section, "compact": _vm.compact, "data-tid": `rail-${section.id}` } })];
  }), _vm.toolSections.length ? _c("div", { staticClass: "app-rail__tools", attrs: { "role": "group", "aria-label": "Tools" } }, [!_vm.compact ? _c("div", { staticClass: "app-rail__label" }, [_vm._v(" Tools ")]) : _c("div", { staticClass: "app-rail__rule" }), _vm._l(_vm.toolSections, function(section) {
    return _c(__unplugin_components_4, { key: section.id, attrs: { "to": _vm.sectionTo(section), "icon": section.icon, "label": section.label, "keys": _vm.keysFor(section.key), "active": _vm.currentSection === section, "compact": _vm.compact, "data-tid": `rail-${section.id}` } });
  })], 2) : _vm._e(), _vm.sectionContext.foreign ? _c("p", { staticClass: "app-rail__foreign-note" }, [_vm._v(" The printer's own screen does the rest. ")]) : _vm._e(), _c("div", { staticClass: "app-rail__spacer" }), _c("div", { staticClass: "app-rail__net" }, [_c(__unplugin_components_5, { staticClass: "app-rail__hotspot", attrs: { "compact": _vm.compact } }), _c(__unplugin_components_6, { attrs: { "title": _vm.routeTitle, "detail": _vm.routeDetail, "remote": _vm.remote, "compact": _vm.compact } }, [_c("span", { staticClass: "app-rail__route" }, [_c("span", { staticClass: "app-rail__route-title" }, [_c(__unplugin_components_7, { class: _vm.remote ? "app-rail__route-icon--remote" : "app-rail__route-icon", attrs: { "name": _vm.remote ? "cloud" : "wifi", "small": "" } }), !_vm.compact ? _c("span", [_vm._v(_vm._s(_vm.routeTitle))]) : _vm._e(), !_vm.compact ? _c(__unplugin_components_8, { staticClass: "app-rail__route-more", attrs: { "name": "chevronUp", "small": "" } }) : _vm._e()], 1), !_vm.compact && _vm.routeDetail ? _c("span", { staticClass: "app-rail__route-detail" }, [_vm._v(_vm._s(_vm.routeDetail))]) : _vm._e()])])], 1)], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/AppRail.vue?vue&type=style&index=0&scoped=f07f3aa1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "f07f3aa1",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppRail.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFTQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEvQ0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwUmFpbC52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8di1uYXZpZ2F0aW9uLWRyYXdlclxuICAgIGFwcFxuICAgIHBlcm1hbmVudFxuICAgIGNsaXBwZWRcbiAgICBjbGFzcz1cImFwcC1yYWlsXCJcbiAgICA6Y2xhc3M9XCJ7ICdhcHAtcmFpbC0tY29tcGFjdCc6IGNvbXBhY3QgfVwiXG4gICAgOndpZHRoPVwiY29tcGFjdCA/ICRnbG9iYWxzLlJBSUxfV0lEVEhfQ09NUEFDVCA6ICRnbG9iYWxzLlJBSUxfV0lEVEhcIlxuICAgIGNvbG9yPVwidHJhbnNwYXJlbnRcIlxuICA+XG4gICAgPG5hdlxuICAgICAgY2xhc3M9XCJhcHAtcmFpbF9fYm9keVwiXG4gICAgICBhcmlhLWxhYmVsPVwiUGFnZXNcIlxuICAgID5cbiAgICAgIDxhcHAtcmFpbC1saW5rXG4gICAgICAgIHRvPVwiL1wiXG4gICAgICAgIGljb249XCJwcmludGVyc1wiXG4gICAgICAgIGxhYmVsPVwiQWxsIHByaW50ZXJzXCJcbiAgICAgICAgOmtleXM9XCJrZXlzRm9yKGFsbFByaW50ZXJzS2V5KVwiXG4gICAgICAgIDpjb21wYWN0PVwiY29tcGFjdFwiXG4gICAgICAgIGRhdGEtdGlkPVwicmFpbC1hbGwtcHJpbnRlcnNcIlxuICAgICAgLz5cblxuICAgICAgPGFwcC1yYWlsLWxpbmtcbiAgICAgICAgdG89XCIvbGlicmFyeVwiXG4gICAgICAgIGljb249XCJsaWJyYXJ5XCJcbiAgICAgICAgbGFiZWw9XCJMaWJyYXJ5XCJcbiAgICAgICAgOmtleXM9XCJrZXlzRm9yKGxpYnJhcnlLZXkpXCJcbiAgICAgICAgOmFjdGl2ZT1cImxpYnJhcnlPcGVuXCJcbiAgICAgICAgOmNvbXBhY3Q9XCJjb21wYWN0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJyYWlsLWxpYnJhcnlcIlxuICAgICAgLz5cblxuICAgICAgPGRpdiBjbGFzcz1cImFwcC1yYWlsX19ydWxlXCIgLz5cblxuICAgICAgPHRlbXBsYXRlIHYtZm9yPVwic2VjdGlvbiBpbiBtYWluU2VjdGlvbnNcIj5cbiAgICAgICAgPGFwcC1yYWlsLWxpbmtcbiAgICAgICAgICA6a2V5PVwic2VjdGlvbi5pZFwiXG4gICAgICAgICAgOnRvPVwic2VjdGlvblRvKHNlY3Rpb24pXCJcbiAgICAgICAgICA6aWNvbj1cInNlY3Rpb24uaWNvblwiXG4gICAgICAgICAgOmxhYmVsPVwic2VjdGlvbi5sYWJlbFwiXG4gICAgICAgICAgOmtleXM9XCJrZXlzRm9yKHNlY3Rpb24ua2V5KVwiXG4gICAgICAgICAgOmFjdGl2ZT1cImN1cnJlbnRTZWN0aW9uID09PSBzZWN0aW9uXCJcbiAgICAgICAgICA6Y29tcGFjdD1cImNvbXBhY3RcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImByYWlsLSR7c2VjdGlvbi5pZH1gXCJcbiAgICAgICAgLz5cbiAgICAgIDwvdGVtcGxhdGU+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cInRvb2xTZWN0aW9ucy5sZW5ndGhcIlxuICAgICAgICBjbGFzcz1cImFwcC1yYWlsX190b29sc1wiXG4gICAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJUb29sc1wiXG4gICAgICA+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICB2LWlmPVwiIWNvbXBhY3RcIlxuICAgICAgICAgIGNsYXNzPVwiYXBwLXJhaWxfX2xhYmVsXCJcbiAgICAgICAgPlxuICAgICAgICAgIFRvb2xzXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgY2xhc3M9XCJhcHAtcmFpbF9fcnVsZVwiXG4gICAgICAgIC8+XG4gICAgICAgIDxhcHAtcmFpbC1saW5rXG4gICAgICAgICAgdi1mb3I9XCJzZWN0aW9uIGluIHRvb2xTZWN0aW9uc1wiXG4gICAgICAgICAgOmtleT1cInNlY3Rpb24uaWRcIlxuICAgICAgICAgIDp0bz1cInNlY3Rpb25UbyhzZWN0aW9uKVwiXG4gICAgICAgICAgOmljb249XCJzZWN0aW9uLmljb25cIlxuICAgICAgICAgIDpsYWJlbD1cInNlY3Rpb24ubGFiZWxcIlxuICAgICAgICAgIDprZXlzPVwia2V5c0ZvcihzZWN0aW9uLmtleSlcIlxuICAgICAgICAgIDphY3RpdmU9XCJjdXJyZW50U2VjdGlvbiA9PT0gc2VjdGlvblwiXG4gICAgICAgICAgOmNvbXBhY3Q9XCJjb21wYWN0XCJcbiAgICAgICAgICA6ZGF0YS10aWQ9XCJgcmFpbC0ke3NlY3Rpb24uaWR9YFwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cInNlY3Rpb25Db250ZXh0LmZvcmVpZ25cIlxuICAgICAgICBjbGFzcz1cImFwcC1yYWlsX19mb3JlaWduLW5vdGVcIlxuICAgICAgPlxuICAgICAgICBUaGUgcHJpbnRlcidzIG93biBzY3JlZW4gZG9lcyB0aGUgcmVzdC5cbiAgICAgIDwvcD5cblxuICAgICAgPGRpdiBjbGFzcz1cImFwcC1yYWlsX19zcGFjZXJcIiAvPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiYXBwLXJhaWxfX25ldFwiPlxuICAgICAgICA8aG90c3BvdC1jb3VudFxuICAgICAgICAgIGNsYXNzPVwiYXBwLXJhaWxfX2hvdHNwb3RcIlxuICAgICAgICAgIDpjb21wYWN0PVwiY29tcGFjdFwiXG4gICAgICAgIC8+XG4gICAgICAgIDxuZXR3b3JrLXF1aWNrLW1lbnVcbiAgICAgICAgICA6dGl0bGU9XCJyb3V0ZVRpdGxlXCJcbiAgICAgICAgICA6ZGV0YWlsPVwicm91dGVEZXRhaWxcIlxuICAgICAgICAgIDpyZW1vdGU9XCJyZW1vdGVcIlxuICAgICAgICAgIDpjb21wYWN0PVwiY29tcGFjdFwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImFwcC1yYWlsX19yb3V0ZVwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhcHAtcmFpbF9fcm91dGUtdGl0bGVcIj5cbiAgICAgICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgICAgICA6bmFtZT1cInJlbW90ZSA/ICdjbG91ZCcgOiAnd2lmaSdcIlxuICAgICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAgICAgOmNsYXNzPVwicmVtb3RlID8gJ2FwcC1yYWlsX19yb3V0ZS1pY29uLS1yZW1vdGUnIDogJ2FwcC1yYWlsX19yb3V0ZS1pY29uJ1wiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxzcGFuIHYtaWY9XCIhY29tcGFjdFwiPnt7IHJvdXRlVGl0bGUgfX08L3NwYW4+XG4gICAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgICAgdi1pZj1cIiFjb21wYWN0XCJcbiAgICAgICAgICAgICAgICBuYW1lPVwiY2hldnJvblVwXCJcbiAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAgIGNsYXNzPVwiYXBwLXJhaWxfX3JvdXRlLW1vcmVcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1pZj1cIiFjb21wYWN0ICYmIHJvdXRlRGV0YWlsXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJhcHAtcmFpbF9fcm91dGUtZGV0YWlsXCJcbiAgICAgICAgICAgID57eyByb3V0ZURldGFpbCB9fTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvbmV0d29yay1xdWljay1tZW51PlxuICAgICAgPC9kaXY+XG4gICAgPC9uYXY+XG4gIDwvdi1uYXZpZ2F0aW9uLWRyYXdlcj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgRnJhbWVNaXhpbiBmcm9tICdAL21peGlucy9mcmFtZSdcbmltcG9ydCBCcm93c2VyTWl4aW4gZnJvbSAnQC9taXhpbnMvYnJvd3NlcidcbmltcG9ydCB7IEFMTF9QUklOVEVSU19LRVksIExJQlJBUllfS0VZLCB0eXBlIFNlY3Rpb24gfSBmcm9tICdAL3JvdXRlci9wcmludGVyU2VjdGlvbnMnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgcmVtb3RlUm91dGVMYWJlbCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IG5ldHdvcmtSb3V0ZUxhYmVsIH0gZnJvbSAnQC9zZXJ2aWNlcy9ob3RzcG90L21vZGVsJ1xuaW1wb3J0IHsgaG9zdE9mIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2RpcmVjdG9yeSdcbmltcG9ydCB7IHByb2JlU2xpY2VyIH0gZnJvbSAnQC9zZXJ2aWNlcy9zbGljZXItYnJpZGdlL3NsaWNlclVybCdcbmltcG9ydCBBcHBSYWlsTGluayBmcm9tICcuL0FwcFJhaWxMaW5rLnZ1ZSdcbmltcG9ydCBOZXR3b3JrUXVpY2tNZW51IGZyb20gJy4vTmV0d29ya1F1aWNrTWVudS52dWUnXG5pbXBvcnQgSG90c3BvdENvdW50IGZyb20gJy4vSG90c3BvdENvdW50LnZ1ZSdcblxuLyoqXG4gKiBUaGUgcGFnZXMgb2YgdGhlIHByaW50ZXIgeW91J3JlIG9uLCBuYW1lZCwgd2l0aCB0aGVpciBrZXlzLiBDb25zb2xlIGFuZFxuICogRmlsZXMgc2l0IHVuZGVyIFRvb2xzIGZvciBldmVyeW9uZS4gQXQgdGhlIGJvdHRvbSwgaG93IHRoaXNcbiAqIGJyb3dzZXIgcmVhY2hlcyB0aGUgcHJpbnRlciwgd2hpY2ggb3BlbnMgdG8gaXRzIFdpLUZpIGFuZCBob3RzcG90XG4gKiAoTmV0d29ya1F1aWNrTWVudSkuIEJlbG93IHRoZSBsZyBicmVha3BvaW50IGl0IGtlZXBzIHRoZSBpY29ucy5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgQXBwUmFpbExpbmssIE5ldHdvcmtRdWlja01lbnUsIEhvdHNwb3RDb3VudCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHBSYWlsIGV4dGVuZHMgTWl4aW5zKEZyYW1lTWl4aW4sIEJyb3dzZXJNaXhpbikge1xuICBhbGxQcmludGVyc0tleSA9IEFMTF9QUklOVEVSU19LRVlcbiAgbGlicmFyeUtleSA9IExJQlJBUllfS0VZXG5cbiAgLyoqIFRoZSBMaWJyYXJ5LCBvciBvbmUgb2YgaXRzIHByaW50cywgaXMgb3Blbi4gKi9cbiAgZ2V0IGxpYnJhcnlPcGVuICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLiRyb3V0ZS5uYW1lPy5zdGFydHNXaXRoKCdMaWJyYXJ5JylcbiAgfVxuXG4gIGNyZWF0ZWQgKCkge1xuICAgIHByb2JlU2xpY2VyKClcbiAgfVxuXG4gIGdldCBjb21wYWN0ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kdnVldGlmeS5icmVha3BvaW50Lm1kQW5kRG93blxuICB9XG5cbiAgZ2V0IG1haW5TZWN0aW9ucyAoKTogU2VjdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5zZWN0aW9ucy5maWx0ZXIocyA9PiBzLmdyb3VwICE9PSAndG9vbHMnKVxuICB9XG5cbiAgZ2V0IHRvb2xTZWN0aW9ucyAoKTogU2VjdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5zZWN0aW9ucy5maWx0ZXIocyA9PiBzLmdyb3VwID09PSAndG9vbHMnKVxuICB9XG5cbiAgZ2V0IGVuYWJsZUtleWJvYXJkU2hvcnRjdXRzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVLZXlib2FyZFNob3J0Y3V0c1xuICB9XG5cbiAga2V5c0ZvciAoa2V5OiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmVuYWJsZUtleWJvYXJkU2hvcnRjdXRzID8gYEcgJHtrZXkudG9VcHBlckNhc2UoKX1gIDogdW5kZWZpbmVkXG4gIH1cblxuICAvKiogVGhyb3VnaCBNdW9uM0QncyBzZXJ2aWNlLCByYXRoZXIgdGhhbiBzdHJhaWdodCB0byB0aGUgcHJpbnRlci4gKi9cbiAgZ2V0IHJlbW90ZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWRcbiAgfVxuXG4gIGdldCByb3V0ZVRpdGxlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlbW90ZSA/IHJlbW90ZVJvdXRlTGFiZWwoY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQpIDogbmV0d29ya1JvdXRlTGFiZWwoKVxuICB9XG5cbiAgZ2V0IHJvdXRlRGV0YWlsICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnJlbW90ZSkgcmV0dXJuICdTb21lIHNldHRpbmdzIGFyZSBsb2NrZWQgYXdheSBmcm9tIGhvbWUnXG4gICAgY29uc3QgYXBpVXJsOiBzdHJpbmcgPSB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsIHx8ICcnXG4gICAgcmV0dXJuIGFwaVVybCA/IGhvc3RPZihhcGlVcmwpIDogJydcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmFwcC1yYWlsIHtcbiAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcblxuICAgIDpkZWVwKC52LW5hdmlnYXRpb24tZHJhd2VyX19ib3JkZXIpIHtcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuXG4gICAgOmRlZXAoLnYtbmF2aWdhdGlvbi1kcmF3ZXJfX2NvbnRlbnQpIHtcbiAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgfVxuICB9XG5cbiAgLmFwcC1yYWlsX19ib2R5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAycHg7XG4gICAgbWluLWhlaWdodDogMTAwJTtcbiAgICBwYWRkaW5nOiAxNnB4IDEycHg7XG4gIH1cblxuICAuYXBwLXJhaWwtLWNvbXBhY3QgLmFwcC1yYWlsX19ib2R5IHtcbiAgICBwYWRkaW5nOiAxNnB4IDEwcHg7XG4gIH1cblxuICAuYXBwLXJhaWxfX3J1bGUge1xuICAgIGhlaWdodDogMXB4O1xuICAgIG1hcmdpbjogMTBweCA4cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWJvcmRlcik7XG4gIH1cblxuICAuYXBwLXJhaWxfX2xhYmVsIHtcbiAgICBwYWRkaW5nOiAxOHB4IDEycHggNnB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4xMmVtO1xuICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIH1cblxuICAuYXBwLXJhaWxfX3Rvb2xzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAycHg7XG4gIH1cblxuICAuYXBwLXJhaWxfX3NwYWNlciB7XG4gICAgZmxleDogMSAxIGF1dG87XG4gICAgbWluLWhlaWdodDogMTZweDtcbiAgfVxuXG4gIC5hcHAtcmFpbF9fZm9yZWlnbi1ub3RlIHtcbiAgICBtYXJnaW46IDEycHggOHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLmFwcC1yYWlsX19uZXQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAvLyBUaGUgdGFiIHNpdHMgZmx1c2ggb24gdGhlIGl0ZW0ncyBsZWZ0IGVkZ2UsIHNvIHRoYXQgY29ybmVyIGlzIHNxdWFyZS5cbiAgICAmOmhhcyguYXBwLXJhaWxfX2hvdHNwb3QpIC5hcHAtcmFpbF9fcm91dGUge1xuICAgICAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogMDtcbiAgICB9XG4gIH1cblxuICAuYXBwLXJhaWxfX2hvdHNwb3Qge1xuICAgIGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7XG4gIH1cblxuICAuYXBwLXJhaWxfX3JvdXRlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA0cHg7XG4gICAgcGFkZGluZzogMTJweCAxNHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UtMik7XG4gICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZCB2YXIoLS1tM2QtZHVyYXRpb24tYmFzZSwgMC4xNXMpIHZhcigtLW0zZC1lYXNlLCBlYXNlKTtcblxuICAgICY6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyKTtcbiAgICB9XG4gIH1cblxuICAuYXBwLXJhaWxfX3JvdXRlLW1vcmUge1xuICAgIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICB9XG5cbiAgLmFwcC1yYWlsLS1jb21wYWN0IC5hcHAtcmFpbF9fcm91dGUge1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgcGFkZGluZzogMTJweCAwO1xuICB9XG5cbiAgLmFwcC1yYWlsX19yb3V0ZS10aXRsZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC5hcHAtcmFpbF9fcm91dGUtaWNvbiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzKTtcbiAgfVxuXG4gIC5hcHAtcmFpbF9fcm91dGUtaWNvbi0tcmVtb3RlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuYXBwLXJhaWxfX3JvdXRlLWRldGFpbCB7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubyk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9sYXlvdXQvQXBwUmFpbC52dWUifQ==