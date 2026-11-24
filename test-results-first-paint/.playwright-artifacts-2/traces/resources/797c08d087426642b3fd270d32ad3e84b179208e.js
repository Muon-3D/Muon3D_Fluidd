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
import StateMixin from "/src/mixins/state.ts";
import { pageOfRoute } from "/src/router/printerPagePaths.ts";
import { printerStatusWord } from "/src/util/printer-status-word.ts";
import { startup } from "/src/services/startup/heard.ts";
import { Globals } from "/src/globals.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { discoveryState } from "/src/services/muon-cloud/discovery.ts";
import { hasReachableRoute } from "/src/services/muon-cloud/directory.ts";
import { nearbyState } from "/src/services/muon-ble/nearby.ts";
import { bluetoothCarrying } from "/src/services/muon-ble/link.ts";
const pageTitleKeys = {
  "/jobs": "app.general.title.jobs",
  "/preview": "app.general.title.gcode_preview",
  "/console": "app.general.title.console",
  "/history": "app.general.title.history",
  "/timelapse": "app.general.title.timelapse",
  "/tune": "app.general.title.tune",
  "/configure": "app.general.title.configure",
  "/diagnostics": "app.general.title.diagnostics",
  "/wifi": "app.general.title.wifi",
  "/system": "app.general.title.system",
  "/settings": "app.general.title.settings"
};
let PrinterStatusMixin = class extends Mixins(StateMixin) {
  get displayName() {
    return this.$store.getters["config/getDisplayName"];
  }
  get printProgress() {
    return Math.floor(this.$store.getters["printer/getPrintProgress"] * 100);
  }
  get statusTone() {
    if (!this.socketConnected) return this.socketConnecting || this.printerReachable ? "warn" : "off";
    if (!this.klippyReady) {
      if (!this.klippyState) return "off";
      return ["error", "shutdown"].includes(this.klippyState) ? "fault" : "warn";
    }
    switch (this.printerState.toLowerCase()) {
      case "printing":
      case "busy":
        return "active";
      case "paused":
        return "warn";
      case "error":
      case "cancelled":
        return "fault";
      default:
        return "ok";
    }
  }
  /**
   * Whether the printer's own name is known yet. Until the printer has said
   * (its saved name, or its network name), getDisplayName falls back to the
   * product name, which names no printer: the name is drawn as a placeholder
   * instead (KAN-2257).
   */
  get nameKnown() {
    const name = this.displayName.trim();
    return !!name && name !== Globals.PRODUCT_NAME;
  }
  /** Still waiting to hear the name: draw a placeholder for it. */
  get nameWaiting() {
    return !this.nameKnown && !startup.heard;
  }
  /**
   * The name to show: the printer's own, as people say it (Boxwood, not
   * muon-boxwood-367a). A printer that never answered is named from its
   * address in Control (/boxwood-367a/ is Boxwood), which came from its name.
   */
  get shownName() {
    if (this.nameKnown) return printerNameParts(this.displayName).name;
    const slug = this.$route?.params?.printer;
    return slug ? printerNameParts(slug).name : this.displayName;
  }
  get printerReachable() {
    const instance = this.$store.getters["config/getCurrentInstance"];
    return hasReachableRoute({ endpointId: cloudState.activePrinterId ?? instance?.endpointId, apiUrl: this.$store.state.config.apiUrl }, {
      account: cloudState.printers,
      status: cloudState.status,
      found: discoveryState.found,
      cloudNearby: discoveryState.cloud,
      nearby: nearbyState.printers,
      viaBluetooth: bluetoothCarrying,
      now: nearbyState.now
    });
  }
  get statusText() {
    if (!this.socketConnected) {
      if (this.socketConnecting && startup.heard) return "Reconnecting…";
      return startup.heard && !this.printerReachable ? "Offline" : "Connecting…";
    }
    if (!this.klippyReady) return this.klippyState ? `Klipper ${this.klippyState}` : "Connecting…";
    const state = printerStatusWord(this.printerState);
    return this.printerPrinting ? `${state} · ${this.printProgress}%` : state;
  }
  // Home is named by the printer; every other page by its own name.
  get pageTitle() {
    const section = `/${pageOfRoute(this.$route).split("/")[1]}`;
    if (this.$route.name === "Overview") return this.displayName;
    const key = pageTitleKeys[section];
    return key ? this.$t(key).toString() : this.$route.name ?? "";
  }
  get pageSubtitle() {
    return this.$route.name === "Overview" ? this.statusText : `${this.displayName} · ${this.statusText}`;
  }
};
PrinterStatusMixin = __decorateClass([
  Component
], PrinterStatusMixin);
export {
  PrinterStatusMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByaW50ZXItc3RhdHVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgeyBwYWdlT2ZSb3V0ZSB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5pbXBvcnQgeyBwcmludGVyU3RhdHVzV29yZCB9IGZyb20gJ0AvdXRpbC9wcmludGVyLXN0YXR1cy13b3JkJ1xuaW1wb3J0IHsgc3RhcnR1cCB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9oZWFyZCdcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgeyBwcmludGVyTmFtZVBhcnRzIH0gZnJvbSAnQC91dGlsL3ByaW50ZXItbmFtZSdcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBkaXNjb3ZlcnlTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXNjb3ZlcnknXG5pbXBvcnQgeyBoYXNSZWFjaGFibGVSb3V0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXJlY3RvcnknXG5pbXBvcnQgeyBuZWFyYnlTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbmVhcmJ5J1xuaW1wb3J0IHsgYmx1ZXRvb3RoQ2FycnlpbmcgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2xpbmsnXG5cbmV4cG9ydCB0eXBlIFByaW50ZXJTdGF0dXNUb25lID0gJ29rJyB8ICdhY3RpdmUnIHwgJ3dhcm4nIHwgJ2ZhdWx0JyB8ICdvZmYnXG5cbi8vIFBhZ2UgbmFtZXMgZm9yIHRoZSBnbGFzcyBzdHlsZSdzIHRvb2xiYXIgYW5kIGxhcmdlIHRpdGxlcy4gQSByb3V0ZSB0aGF0IGlzXG4vLyBub3QgbGlzdGVkIGZhbGxzIGJhY2sgdG8gaXRzIHJvdXRlIG5hbWUuXG5jb25zdCBwYWdlVGl0bGVLZXlzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAnL2pvYnMnOiAnYXBwLmdlbmVyYWwudGl0bGUuam9icycsXG4gICcvcHJldmlldyc6ICdhcHAuZ2VuZXJhbC50aXRsZS5nY29kZV9wcmV2aWV3JyxcbiAgJy9jb25zb2xlJzogJ2FwcC5nZW5lcmFsLnRpdGxlLmNvbnNvbGUnLFxuICAnL2hpc3RvcnknOiAnYXBwLmdlbmVyYWwudGl0bGUuaGlzdG9yeScsXG4gICcvdGltZWxhcHNlJzogJ2FwcC5nZW5lcmFsLnRpdGxlLnRpbWVsYXBzZScsXG4gICcvdHVuZSc6ICdhcHAuZ2VuZXJhbC50aXRsZS50dW5lJyxcbiAgJy9jb25maWd1cmUnOiAnYXBwLmdlbmVyYWwudGl0bGUuY29uZmlndXJlJyxcbiAgJy9kaWFnbm9zdGljcyc6ICdhcHAuZ2VuZXJhbC50aXRsZS5kaWFnbm9zdGljcycsXG4gICcvd2lmaSc6ICdhcHAuZ2VuZXJhbC50aXRsZS53aWZpJyxcbiAgJy9zeXN0ZW0nOiAnYXBwLmdlbmVyYWwudGl0bGUuc3lzdGVtJyxcbiAgJy9zZXR0aW5ncyc6ICdhcHAuZ2VuZXJhbC50aXRsZS5zZXR0aW5ncydcbn1cblxuQENvbXBvbmVudFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJpbnRlclN0YXR1c01peGluIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgZ2V0IGRpc3BsYXlOYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0RGlzcGxheU5hbWUnXSBhcyBzdHJpbmdcbiAgfVxuXG4gIGdldCBwcmludFByb2dyZXNzICgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLmZsb29yKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByaW50UHJvZ3Jlc3MnXSBhcyBudW1iZXIpICogMTAwKVxuICB9XG5cbiAgZ2V0IHN0YXR1c1RvbmUgKCk6IFByaW50ZXJTdGF0dXNUb25lIHtcbiAgICBpZiAoIXRoaXMuc29ja2V0Q29ubmVjdGVkKSByZXR1cm4gdGhpcy5zb2NrZXRDb25uZWN0aW5nIHx8IHRoaXMucHJpbnRlclJlYWNoYWJsZSA/ICd3YXJuJyA6ICdvZmYnXG4gICAgaWYgKCF0aGlzLmtsaXBweVJlYWR5KSB7XG4gICAgICBpZiAoIXRoaXMua2xpcHB5U3RhdGUpIHJldHVybiAnb2ZmJ1xuICAgICAgcmV0dXJuIFsnZXJyb3InLCAnc2h1dGRvd24nXS5pbmNsdWRlcyh0aGlzLmtsaXBweVN0YXRlKSA/ICdmYXVsdCcgOiAnd2FybidcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRoaXMucHJpbnRlclN0YXRlLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgJ3ByaW50aW5nJzpcbiAgICAgIGNhc2UgJ2J1c3knOlxuICAgICAgICByZXR1cm4gJ2FjdGl2ZSdcbiAgICAgIGNhc2UgJ3BhdXNlZCc6XG4gICAgICAgIHJldHVybiAnd2FybidcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgIGNhc2UgJ2NhbmNlbGxlZCc6XG4gICAgICAgIHJldHVybiAnZmF1bHQnXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ29rJ1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBwcmludGVyJ3Mgb3duIG5hbWUgaXMga25vd24geWV0LiBVbnRpbCB0aGUgcHJpbnRlciBoYXMgc2FpZFxuICAgKiAoaXRzIHNhdmVkIG5hbWUsIG9yIGl0cyBuZXR3b3JrIG5hbWUpLCBnZXREaXNwbGF5TmFtZSBmYWxscyBiYWNrIHRvIHRoZVxuICAgKiBwcm9kdWN0IG5hbWUsIHdoaWNoIG5hbWVzIG5vIHByaW50ZXI6IHRoZSBuYW1lIGlzIGRyYXduIGFzIGEgcGxhY2Vob2xkZXJcbiAgICogaW5zdGVhZCAoS0FOLTIyNTcpLlxuICAgKi9cbiAgZ2V0IG5hbWVLbm93biAoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMuZGlzcGxheU5hbWUudHJpbSgpXG4gICAgcmV0dXJuICEhbmFtZSAmJiBuYW1lICE9PSBHbG9iYWxzLlBST0RVQ1RfTkFNRVxuICB9XG5cbiAgLyoqIFN0aWxsIHdhaXRpbmcgdG8gaGVhciB0aGUgbmFtZTogZHJhdyBhIHBsYWNlaG9sZGVyIGZvciBpdC4gKi9cbiAgZ2V0IG5hbWVXYWl0aW5nICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMubmFtZUtub3duICYmICFzdGFydHVwLmhlYXJkXG4gIH1cblxuICAvKipcbiAgICogVGhlIG5hbWUgdG8gc2hvdzogdGhlIHByaW50ZXIncyBvd24sIGFzIHBlb3BsZSBzYXkgaXQgKEJveHdvb2QsIG5vdFxuICAgKiBtdW9uLWJveHdvb2QtMzY3YSkuIEEgcHJpbnRlciB0aGF0IG5ldmVyIGFuc3dlcmVkIGlzIG5hbWVkIGZyb20gaXRzXG4gICAqIGFkZHJlc3MgaW4gQ29udHJvbCAoL2JveHdvb2QtMzY3YS8gaXMgQm94d29vZCksIHdoaWNoIGNhbWUgZnJvbSBpdHMgbmFtZS5cbiAgICovXG4gIGdldCBzaG93bk5hbWUgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubmFtZUtub3duKSByZXR1cm4gcHJpbnRlck5hbWVQYXJ0cyh0aGlzLmRpc3BsYXlOYW1lKS5uYW1lXG4gICAgY29uc3Qgc2x1ZyA9IHRoaXMuJHJvdXRlPy5wYXJhbXM/LnByaW50ZXJcbiAgICByZXR1cm4gc2x1ZyA/IHByaW50ZXJOYW1lUGFydHMoc2x1ZykubmFtZSA6IHRoaXMuZGlzcGxheU5hbWVcbiAgfVxuXG4gIGdldCBwcmludGVyUmVhY2hhYmxlICgpOiBib29sZWFuIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXRDdXJyZW50SW5zdGFuY2UnXVxuICAgIHJldHVybiBoYXNSZWFjaGFibGVSb3V0ZSh7IGVuZHBvaW50SWQ6IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkID8/IGluc3RhbmNlPy5lbmRwb2ludElkLCBhcGlVcmw6IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwgfSwge1xuICAgICAgYWNjb3VudDogY2xvdWRTdGF0ZS5wcmludGVycyxcbiAgICAgIHN0YXR1czogY2xvdWRTdGF0ZS5zdGF0dXMsXG4gICAgICBmb3VuZDogZGlzY292ZXJ5U3RhdGUuZm91bmQsXG4gICAgICBjbG91ZE5lYXJieTogZGlzY292ZXJ5U3RhdGUuY2xvdWQsXG4gICAgICBuZWFyYnk6IG5lYXJieVN0YXRlLnByaW50ZXJzLFxuICAgICAgdmlhQmx1ZXRvb3RoOiBibHVldG9vdGhDYXJyeWluZyxcbiAgICAgIG5vdzogbmVhcmJ5U3RhdGUubm93XG4gICAgfSlcbiAgfVxuXG4gIGdldCBzdGF0dXNUZXh0ICgpOiBzdHJpbmcge1xuICAgIC8vIEJlZm9yZSB0aGUgZmlyc3QgYW5zd2VyIHRoZSBwcmludGVyIGlzIGJlaW5nIHJlYWNoZWQsIG5vdCBvZmZsaW5lOyBhbmRcbiAgICAvLyBhbiBlbXB0eSBLbGlwcGVyIHN0YXRlIG1lYW5zIG5vdCB5ZXQgcmVwb3J0ZWQsIG5vdCBcIm9mZmxpbmVcIi5cbiAgICBpZiAoIXRoaXMuc29ja2V0Q29ubmVjdGVkKSB7XG4gICAgICAvLyBSZWNvbm5lY3Rpbmc6IGEgc29ja2V0IHRoYXQgYW5zd2VyZWQgYmVmb3JlIGlzIGJlaW5nIHJlLW9wZW5lZC5cbiAgICAgIGlmICh0aGlzLnNvY2tldENvbm5lY3RpbmcgJiYgc3RhcnR1cC5oZWFyZCkgcmV0dXJuICdSZWNvbm5lY3RpbmfigKYnXG4gICAgICAvLyBDb25uZWN0aW5nOiBiZWZvcmUgdGhlIGZpcnN0IGFuc3dlciwgb3IgYSByZWFjaGFibGUgcHJpbnRlciBub3QgeWV0IHVwLlxuICAgICAgcmV0dXJuIHN0YXJ0dXAuaGVhcmQgJiYgIXRoaXMucHJpbnRlclJlYWNoYWJsZSA/ICdPZmZsaW5lJyA6ICdDb25uZWN0aW5n4oCmJ1xuICAgIH1cbiAgICBpZiAoIXRoaXMua2xpcHB5UmVhZHkpIHJldHVybiB0aGlzLmtsaXBweVN0YXRlID8gYEtsaXBwZXIgJHt0aGlzLmtsaXBweVN0YXRlfWAgOiAnQ29ubmVjdGluZ+KApidcblxuICAgIGNvbnN0IHN0YXRlID0gcHJpbnRlclN0YXR1c1dvcmQodGhpcy5wcmludGVyU3RhdGUpXG5cbiAgICByZXR1cm4gdGhpcy5wcmludGVyUHJpbnRpbmcgPyBgJHtzdGF0ZX0gwrcgJHt0aGlzLnByaW50UHJvZ3Jlc3N9JWAgOiBzdGF0ZVxuICB9XG5cbiAgLy8gSG9tZSBpcyBuYW1lZCBieSB0aGUgcHJpbnRlcjsgZXZlcnkgb3RoZXIgcGFnZSBieSBpdHMgb3duIG5hbWUuXG4gIGdldCBwYWdlVGl0bGUgKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IGAvJHtwYWdlT2ZSb3V0ZSh0aGlzLiRyb3V0ZSkuc3BsaXQoJy8nKVsxXX1gXG5cbiAgICBpZiAodGhpcy4kcm91dGUubmFtZSA9PT0gJ092ZXJ2aWV3JykgcmV0dXJuIHRoaXMuZGlzcGxheU5hbWVcblxuICAgIGNvbnN0IGtleSA9IHBhZ2VUaXRsZUtleXNbc2VjdGlvbl1cblxuICAgIHJldHVybiBrZXkgPyB0aGlzLiR0KGtleSkudG9TdHJpbmcoKSA6ICh0aGlzLiRyb3V0ZS5uYW1lID8/ICcnKVxuICB9XG5cbiAgZ2V0IHBhZ2VTdWJ0aXRsZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4kcm91dGUubmFtZSA9PT0gJ092ZXJ2aWV3J1xuICAgICAgPyB0aGlzLnN0YXR1c1RleHRcbiAgICAgIDogYCR7dGhpcy5kaXNwbGF5TmFtZX0gwrcgJHt0aGlzLnN0YXR1c1RleHR9YFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLFdBQVcsY0FBYztBQUNsQyxPQUFPLGdCQUFnQjtBQUN2QixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsd0JBQXdCO0FBQ2pDLFNB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