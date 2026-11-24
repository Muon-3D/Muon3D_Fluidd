/* unplugin-vue-components disabled */import __unplugin_components_15 from "/src/components/ui/FrameIcon.vue";
import { VTooltip as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_12 from "/src/components/ui/AppBtn.vue";
import { VTooltip as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_10 from "/src/components/layout/QuickActionsMenu.vue";
import __unplugin_components_9 from "/src/components/layout/AppUploadAndPrintBtn.vue";
import __unplugin_components_8 from "/src/components/layout/AppSaveConfigAndRestartBtn.vue";
import __unplugin_components_7 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_6 from "/src/components/layout/PrinterSwitchButton.vue";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/layout/QuickActionsMenu.vue";
import __unplugin_components_1 from "/src/components/layout/PrinterSwitchButton.vue";
import { VAppBar as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { activeSlug } from "/src/services/printer-pages/index.ts";
import CloudAccountMenu from "/src/components/muon-cloud/CloudAccountMenu.vue";
import NoticesBell from "/src/components/muon-cloud/NoticesBell.vue";
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import PendingChangesDialog from "/src/components/settings/PendingChangesDialog.vue";
import AppSaveConfigAndRestartBtn from "/src/components/layout/AppSaveConfigAndRestartBtn.vue";
import AppUploadAndPrintBtn from "/src/components/layout/AppUploadAndPrintBtn.vue";
import PrinterSwitchButton from "/src/components/layout/PrinterSwitchButton.vue";
import QuickActionsMenu from "/src/components/layout/QuickActionsMenu.vue";
import FrameMixin from "/src/mixins/frame.ts";
import ServicesMixin from "/src/mixins/services.ts";
import FilesMixin, { uploadErrorText } from "/src/mixins/files.ts";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { EventBus } from "/src/eventBus.ts";
import { isModelFile } from "/src/services/jobs/model.ts";
import { MODEL_ACCEPT } from "/src/services/slicer-bridge/handover.ts";
let AppBar = class extends Mixins(FrameMixin, ServicesMixin, FilesMixin, BrowserMixin) {
  pendingChangesDialogOpen = false;
  get phone() {
    return this.isMobileViewport;
  }
  /**
   * Always in the bar on a printer: it is greyed, never gone, while the printer cannot be reached.
   * Account is a top-level page with no printer frame, but a printer open behind it can still be stopped.
   */
  get showEstop() {
    return !this.sectionContext.foreign && this.printerFrame || this.accountOverPrinter === true;
  }
  /** Account (always top-level) with a printer open. */
  get accountOverPrinter() {
    return !!this.$route?.name?.startsWith("Account") && !!activeSlug();
  }
  get estopReady() {
    return this.authenticated && this.socketConnected && this.klippyReady;
  }
  /** The one notification icon carries this printer's warnings and notifications too. */
  get printerNotices() {
    return !this.sectionContext.foreign && this.authenticated && this.socketConnected;
  }
  /** Quick actions are on every printer's bar; each says why it cannot run when it cannot. */
  get showQuickActions() {
    return !this.sectionContext.foreign && this.printerFrame;
  }
  /** A page with no printer names itself: Printers, Fleet, Slice. */
  get placeName() {
    if (this.$route.path === "/") return "Printers";
    if (this.$route.name === "Slice (no printer)") return "Slice";
    if (this.$route.name?.startsWith("Library")) return "Library";
    if (this.$route.name?.startsWith("Account")) return "Account";
    return this.$route.name ?? "";
  }
  get onLibrary() {
    return this.$route.name?.startsWith("Library") ?? false;
  }
  /** Where you can go without choosing a printer. */
  get places() {
    return [
      { id: "printers", name: "Printers", to: "/", on: this.$route.path === "/" },
      { id: "library", name: "Library", to: "/library", on: this.onLibrary }
    ];
  }
  openCommands() {
    EventBus.bus.$emit("command-bar");
  }
  /** ⌘ K on a Mac, Ctrl K elsewhere. */
  get commandKeys() {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "\u2318 K" : "Ctrl K";
  }
  created() {
    EventBus.bus.$on("upload-file", this.pickUpload);
  }
  beforeDestroy() {
    EventBus.bus.$off("upload-file", this.pickUpload);
  }
  /** U: choose a file to print, as the upload button does. */
  pickUpload() {
    this.$refs.uploadInput?.click();
  }
  async onUploadPicked(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (file) await this.handleUploadAndPrint(file);
  }
  get saveConfigPending() {
    return this.$store.getters["printer/getSaveConfigPending"];
  }
  get saveConfigPendingItems() {
    return this.$store.getters["printer/getSaveConfigPendingItems"];
  }
  get showSaveConfigAndRestartForPendingChanges() {
    if (!this.showSaveConfigAndRestart || !this.saveConfigPending) {
      return false;
    }
    const sectionsToIgnore = this.sectionsToIgnorePendingConfigurationChanges;
    return sectionsToIgnore.length === 0 || Object.keys(this.saveConfigPendingItems).filter((key) => !sectionsToIgnore.includes(key)).length > 0;
  }
  get devicePowerComponentEnabled() {
    return this.$store.getters["server/componentSupport"]("power");
  }
  get showSaveConfigAndRestart() {
    return this.$store.state.config.uiSettings.general.showSaveConfigAndRestart;
  }
  get sectionsToIgnorePendingConfigurationChanges() {
    return this.$store.state.config.uiSettings.general.sectionsToIgnorePendingConfigurationChanges;
  }
  get showUploadAndPrint() {
    return this.$store.state.config.uiSettings.general.showUploadAndPrint;
  }
  get topNavPowerToggle() {
    const topNavPowerToggle = this.$store.state.config.uiSettings.general.topNavPowerToggle;
    if (!topNavPowerToggle) return null;
    const [name, type] = topNavPowerToggle.split(":");
    switch (type) {
      case "klipper": {
        const device = this.$store.getters["printer/getPinByName"](name);
        return {
          type,
          name: device?.prettyName ?? name,
          device
        };
      }
      default: {
        const device = this.$store.getters["power/getDeviceByName"](topNavPowerToggle);
        return {
          type: "moonraker",
          name: topNavPowerToggle,
          device
        };
      }
    }
  }
  get topNavPowerDeviceOn() {
    const { type, device } = this.topNavPowerToggle || {};
    if (!device) return false;
    switch (type) {
      case "moonraker":
        return device.status === "on";
      case "klipper":
        return device.value !== 0;
    }
    return false;
  }
  get topNavPowerDeviceDisabled() {
    const { type, device } = this.topNavPowerToggle || {};
    if (!device) return true;
    switch (type) {
      case "moonraker":
        return this.printerPrinting && device.locked_while_printing || ["init", "error"].includes(device.status) || !this.devicePowerComponentEnabled;
      case "klipper":
        return !this.klippyReady;
    }
    return true;
  }
  get enableKeyboardShortcuts() {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts;
  }
  /** What U's picker takes: the G-code root's own list, as the header's upload button uses. */
  get gcodeAccept() {
    const root = this.$store.getters["files/getRootProperties"]("gcodes");
    return [...root?.accepts ?? [], ...MODEL_ACCEPT].join(",");
  }
  async handlePowerToggle() {
    const { type, device } = this.topNavPowerToggle || {};
    if (!device) return;
    const confirmOnPowerDeviceChange = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange;
    const turnOff = this.topNavPowerDeviceOn;
    const name = this.topNavPowerToggle?.name ?? "the power";
    const result = !confirmOnPowerDeviceChange || await this.$confirm(
      turnOff ? "Whatever runs from it loses power at once." : "It switches on straight away.",
      { title: `Turn ${name} ${turnOff ? "off" : "on"}?`, buttonTrueText: turnOff ? "Turn off" : "Turn on", danger: turnOff }
    );
    if (result) {
      switch (type) {
        case "moonraker": {
          const state = device.status === "on" ? "off" : "on";
          SocketActions.machineDevicePowerToggle(device.device, state);
          break;
        }
        case "klipper": {
          const value = device.value !== 0 ? 0 : device.scale;
          this.sendGcode(`SET_PIN PIN=${device.name} VALUE=${value}`, `${this.$waits.onSetOutputPin}${device.name}`);
          break;
        }
      }
    }
  }
  // Idle, the file goes up and Ready to print opens, where Print now asks
  // the plate check like every other print. Mid-print, it goes to the job
  // queue, and with Klipper down it is only uploaded, so the button always
  // does something.
  get uploadPrintsNow() {
    return this.klippyReady && !this.printerPrinting && !this.printerPaused;
  }
  get uploadQueues() {
    return !this.uploadPrintsNow && this.klippyReady && this.$store.getters["server/componentSupport"]("job_queue");
  }
  get uploadTooltip() {
    if (this.uploadPrintsNow) return this.$tc("app.general.label.upload_and_print");
    if (this.uploadQueues) return this.$tc("app.general.label.upload_and_queue");
    return this.$tc("app.general.btn.upload");
  }
  async handleUploadAndPrint(file) {
    if (isModelFile(file.name)) {
      EventBus.bus.$emit("model-dropped", [file]);
      return;
    }
    try {
      await this.uploadAndHandOn(file);
    } catch (error) {
      consola.error("[FileUpload] file", error);
      EventBus.$emit(`Upload of ${file.name} failed: ${uploadErrorText(error)}`, { type: "error", timeout: -1 });
    }
  }
  async uploadAndHandOn(file) {
    if (this.uploadPrintsNow) {
      await this.uploadFile(file, "/", "gcodes", false);
      EventBus.bus.$emit("job-ready", file.name);
      return;
    }
    const queue = this.uploadQueues;
    await this.uploadFile(file, "/", "gcodes", false);
    if (queue) {
      await SocketActions.serverJobQueuePostJob([file.name]);
      EventBus.$emit(this.$t("app.general.msg.upload_queued", { name: file.name }).toString(), { timeout: 4e3 });
    } else {
      EventBus.$emit(this.$t("app.general.msg.upload_saved", { name: file.name }).toString(), { timeout: 4e3 });
    }
  }
  saveConfigAndRestart(force = false) {
    if (!force && this.$store.state.config.uiSettings.editor.saveAndRestart !== "always") {
      const confirmOnSaveConfigAndRestart = this.$store.state.config.uiSettings.general.confirmOnSaveConfigAndRestart;
      if (confirmOnSaveConfigAndRestart) {
        this.pendingChangesDialogOpen = true;
        return;
      }
    }
    this.sendGcode("SAVE_CONFIG", this.$waits.onSaveConfig);
  }
};
AppBar = __decorateClass([
  Component({
    components: {
      CloudAccountMenu,
      NoticesBell,
      PendingChangesDialog,
      AppSaveConfigAndRestartBtn,
      AppUploadAndPrintBtn,
      PrinterSwitchButton,
      QuickActionsMenu
    }
  })
], AppBar);
const _sfc_main = AppBar;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { staticClass: "app-header", class: { "app-header--phone": _vm.phone }, attrs: { "app": "", "clipped-left": "", "flat": "", "color": "transparent", "extension-height": "46", "height": _vm.phone ? _vm.$globals.HEADER_HEIGHT_PHONE : _vm.$globals.HEADER_HEIGHT } }, [_vm.phone ? [_vm.printerFrame ? _c(__unplugin_components_1, { attrs: { "phone": "" } }) : _c("router-link", { staticClass: "app-header__brand app-header__brand--grow", attrs: { "to": "/", "aria-label": "All printers" } }, [_c("span", { staticClass: "muon-wordmark" }, [_vm._v("MUON3D")])]), _c("div", { staticClass: "app-header__actions" }, [_vm.showQuickActions ? _c(__unplugin_components_2) : _c("button", { staticClass: "app-header__icon", attrs: { "type": "button", "aria-label": "Search or run a command", "data-tid": "command-bar-open" }, on: { "click": _vm.openCommands } }, [_c(__unplugin_components_3, { attrs: { "name": "search" } })], 1), _c("notices-bell", { attrs: { "printer": _vm.printerNotices } }), !_vm.printerFrame && !_vm.onLibrary ? _c("router-link", { staticClass: "app-header__icon", attrs: { "to": "/library", "aria-label": "Library", "data-tid": "header-library" } }, [_c(__unplugin_components_4, { attrs: { "name": "library" } })], 1) : _vm._e(), !_vm.printerFrame ? _c("cloud-account-menu") : _vm._e()], 1), _vm.showEstop ? _c("button", { staticClass: "app-header__estop app-header__estop--small", attrs: { "type": "button", "disabled": !_vm.estopReady, "aria-label": _vm.$tc("app.general.tooltip.estop"), "data-tid": "estop" }, on: { "click": function($event) {
    return _vm.emergencyStop();
  } } }, [_c(__unplugin_components_5, { attrs: { "name": "estop", "small": "" } }), _vm._v(" STOP ")], 1) : _vm._e()] : [_c("router-link", { staticClass: "app-header__brand", attrs: { "to": "/", "aria-label": "All printers", "data-tid": "header-brand" } }, [_c("span", { staticClass: "muon-wordmark" }, [_vm._v("MUON3D")])]), _vm.printerFrame ? _c(__unplugin_components_6) : _c("nav", { staticClass: "app-header__places", attrs: { "aria-label": "Muon3D", "data-tid": "header-places" } }, [_vm._l(_vm.places, function(place) {
    return _c("router-link", { key: place.to, staticClass: "app-header__place", class: { "app-header__place--on": place.on }, attrs: { "to": place.to, "aria-current": place.on ? place.to === _vm.$route.path ? "page" : "true" : void 0, "data-tid": `header-place-${place.id}` } }, [_vm._v(" " + _vm._s(place.name) + " ")]);
  }), !_vm.places.some((place) => place.on) ? _c("span", { staticClass: "app-header__place app-header__place--on" }, [_vm._v(_vm._s(_vm.placeName))]) : _vm._e()], 2), _c("button", { staticClass: "app-header__cmd", attrs: { "type": "button", "aria-label": "Search or run a command", "data-tid": "command-bar-open" }, on: { "click": _vm.openCommands } }, [_c(__unplugin_components_7, { attrs: { "name": "search", "small": "" } }), _c("span", { staticClass: "app-header__cmd-text" }, [_vm._v("Search or run a command")]), _c("kbd", { staticClass: "app-header__cmd-keys" }, [_vm._v(_vm._s(_vm.commandKeys))])], 1), _c("div", { staticClass: "app-header__actions" }, [!_vm.sectionContext.foreign && _vm.socketConnected && _vm.klippyReady && _vm.authenticated && _vm.showSaveConfigAndRestartForPendingChanges ? _c(__unplugin_components_8, { attrs: { "loading": _vm.hasWait(_vm.$waits.onSaveConfig), "disabled": _vm.printerPrinting || _vm.printerPaused }, on: { "click": _vm.saveConfigAndRestart } }) : _vm._e(), _vm.printerFrame && !_vm.sectionContext.foreign && _vm.authenticated && _vm.socketConnected && _vm.showUploadAndPrint ? _c(__unplugin_components_9, { attrs: { "tooltip": _vm.uploadTooltip }, on: { "upload": _vm.handleUploadAndPrint } }) : _vm._e(), _vm.showQuickActions ? _c(__unplugin_components_10) : _vm._e(), !_vm.sectionContext.foreign && _vm.printerFrame && _vm.authenticated && _vm.socketConnected && _vm.topNavPowerToggle ? _c(__unplugin_components_11, { attrs: { "bottom": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c(__unplugin_components_12, _vm._g(_vm._b({ attrs: { "fab": "", "small": "", "elevation": 0, "color": "transparent", "disabled": _vm.topNavPowerDeviceDisabled }, on: { "click": function($event) {
      return _vm.handlePowerToggle();
    } } }, "app-btn", attrs, false), on), [_c(__unplugin_components_13, [_vm._v(" " + _vm._s(_vm.topNavPowerDeviceOn ? "$powerOn" : "$powerOff") + " ")])], 1)];
  } }], null, false, 845231702) }, [_c("span", [_vm._v(_vm._s(_vm.$t(`app.general.label.turn_device_${_vm.topNavPowerDeviceOn ? "off" : "on"}`, { device: _vm.topNavPowerToggle.name })))])]) : _vm._e(), _c("notices-bell", { attrs: { "printer": _vm.printerNotices } }), _c("cloud-account-menu")], 1), _vm.showEstop ? [_c("span", { staticClass: "app-header__rule" }), _c(__unplugin_components_14, { attrs: { "bottom": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "app-header__estop", attrs: { "type": "button", "disabled": !_vm.estopReady, "aria-label": _vm.$tc("app.general.tooltip.estop"), "data-tid": "estop" }, on: { "click": function($event) {
      return _vm.emergencyStop();
    } } }, "button", attrs, false), on), [_c(__unplugin_components_15, { attrs: { "name": "estop", "small": "" } }), _vm._v(" E-STOP ")], 1)];
  } }], null, false, 1609082248) }, [_c("span", [_vm._v(" " + _vm._s(_vm.$t("app.general.tooltip.estop")) + " "), _vm.enableKeyboardShortcuts ? [_c("br"), _c("kbd", [_vm._v("Ctrl")]), _vm._v(" + "), _c("kbd", [_vm._v("Shift")]), _vm._v(" + "), _c("kbd", [_vm._v("e")])] : _vm._e()], 2)])] : _vm._e()], _c("input", { ref: "uploadInput", staticClass: "app-header__upload", attrs: { "type": "file", "accept": _vm.gcodeAccept, "tabindex": "-1", "aria-hidden": "true" }, on: { "change": _vm.onUploadPicked } }), _vm.pendingChangesDialogOpen ? _c("pending-changes-dialog", { on: { "save": function($event) {
    return _vm.saveConfigAndRestart(true);
  } }, model: { value: _vm.pendingChangesDialogOpen, callback: function($$v) {
    _vm.pendingChangesDialogOpen = $$v;
  }, expression: "pendingChangesDialogOpen" } }) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/layout/AppBar.vue?vue&type=style&index=0&lang.scss";
import "/src/components/layout/AppBar.vue?vue&type=style&index=1&scoped=a78cdaff&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "a78cdaff",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/layout/AppBar.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBcUJBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFFQSxXQUNBLGlDQUNBLHlDQUNBLGlEQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUVBO0FBRUE7QUFBQSxNQUNBO0FBQ0E7QUFFQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFFQTtBQUNBO0FBRUE7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFFQTtBQUFBLE1BQ0E7QUFDQTtBQUFBLE1BRUE7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFFQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUVBO0FBRUE7QUFFQTtBQUNBO0FBQ0EsbUJBQ0EsK0JBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFHQTtBQUNBO0FBQUEsUUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSx3REFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsRUFDQTtBQUNBO0FBeFNBO0FBQUEsRUFYQTtBQUFBLElBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHBCYXIudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtYXBwLWJhclxuICAgIGFwcFxuICAgIGNsaXBwZWQtbGVmdFxuICAgIGZsYXRcbiAgICBjbGFzcz1cImFwcC1oZWFkZXJcIlxuICAgIDpjbGFzcz1cInsgJ2FwcC1oZWFkZXItLXBob25lJzogcGhvbmUgfVwiXG4gICAgY29sb3I9XCJ0cmFuc3BhcmVudFwiXG4gICAgZXh0ZW5zaW9uLWhlaWdodD1cIjQ2XCJcbiAgICA6aGVpZ2h0PVwicGhvbmUgPyAkZ2xvYmFscy5IRUFERVJfSEVJR0hUX1BIT05FIDogJGdsb2JhbHMuSEVBREVSX0hFSUdIVFwiXG4gID5cbiAgICA8IS0tIEEgcGhvbmU6IHRoZSBwcmludGVyIHlvdSdyZSBvbiwgaXRzIGFsZXJ0cywgYW5kIFNUT1AuIC0tPlxuICAgIDx0ZW1wbGF0ZSB2LWlmPVwicGhvbmVcIj5cbiAgICAgIDxwcmludGVyLXN3aXRjaC1idXR0b25cbiAgICAgICAgdi1pZj1cInByaW50ZXJGcmFtZVwiXG4gICAgICAgIHBob25lXG4gICAgICAvPlxuICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgIHYtZWxzZVxuICAgICAgICB0bz1cIi9cIlxuICAgICAgICBjbGFzcz1cImFwcC1oZWFkZXJfX2JyYW5kIGFwcC1oZWFkZXJfX2JyYW5kLS1ncm93XCJcbiAgICAgICAgYXJpYS1sYWJlbD1cIkFsbCBwcmludGVyc1wiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi13b3JkbWFya1wiPk1VT04zRDwvc3Bhbj5cbiAgICAgIDwvcm91dGVyLWxpbms+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJhcHAtaGVhZGVyX19hY3Rpb25zXCI+XG4gICAgICAgIDwhLS0gT24gYSBwcmludGVyLCBRdWljayBhY3Rpb25zIHRha2UgdGhlIHNlYXJjaCBpY29uJ3MgcGxhY2U7IHdpdGggbm9uZSBjaG9zZW4sIHNlYXJjaCBzdGF5cy4gLS0+XG4gICAgICAgIDxxdWljay1hY3Rpb25zLW1lbnUgdi1pZj1cInNob3dRdWlja0FjdGlvbnNcIiAvPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJhcHAtaGVhZGVyX19pY29uXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiU2VhcmNoIG9yIHJ1biBhIGNvbW1hbmRcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiY29tbWFuZC1iYXItb3BlblwiXG4gICAgICAgICAgQGNsaWNrPVwib3BlbkNvbW1hbmRzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJzZWFyY2hcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPG5vdGljZXMtYmVsbCA6cHJpbnRlcj1cInByaW50ZXJOb3RpY2VzXCIgLz5cbiAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgdi1pZj1cIiFwcmludGVyRnJhbWUgJiYgIW9uTGlicmFyeVwiXG4gICAgICAgICAgdG89XCIvbGlicmFyeVwiXG4gICAgICAgICAgY2xhc3M9XCJhcHAtaGVhZGVyX19pY29uXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiTGlicmFyeVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJoZWFkZXItbGlicmFyeVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwibGlicmFyeVwiIC8+XG4gICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgIDxjbG91ZC1hY2NvdW50LW1lbnUgdi1pZj1cIiFwcmludGVyRnJhbWVcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cInNob3dFc3RvcFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImFwcC1oZWFkZXJfX2VzdG9wIGFwcC1oZWFkZXJfX2VzdG9wLS1zbWFsbFwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFlc3RvcFJlYWR5XCJcbiAgICAgICAgOmFyaWEtbGFiZWw9XCIkdGMoJ2FwcC5nZW5lcmFsLnRvb2x0aXAuZXN0b3AnKVwiXG4gICAgICAgIGRhdGEtdGlkPVwiZXN0b3BcIlxuICAgICAgICBAY2xpY2s9XCJlbWVyZ2VuY3lTdG9wKClcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJlc3RvcFwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgU1RPUFxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDwhLS0gQSBjb21wdXRlcjogd2hlcmUgeW91IGFyZSwgd2hhdCB0aGUgcHJpbnRlciBpcyBkb2luZywgaG93IHRvIHN0b3AgaXQuIC0tPlxuICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgdG89XCIvXCJcbiAgICAgICAgY2xhc3M9XCJhcHAtaGVhZGVyX19icmFuZFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJBbGwgcHJpbnRlcnNcIlxuICAgICAgICBkYXRhLXRpZD1cImhlYWRlci1icmFuZFwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibXVvbi13b3JkbWFya1wiPk1VT04zRDwvc3Bhbj5cbiAgICAgIDwvcm91dGVyLWxpbms+XG5cbiAgICAgIDxwcmludGVyLXN3aXRjaC1idXR0b24gdi1pZj1cInByaW50ZXJGcmFtZVwiIC8+XG4gICAgICA8IS0tIE5vIHByaW50ZXIgY2hvc2VuOiB0aGUgcGxhY2VzIHRoYXQgbmVlZCBub25lLCBzbyB0aGUgTGlicmFyeSBpcyBvbmUgY2xpY2sgZnJvbSBob21lLiAtLT5cbiAgICAgIDxuYXZcbiAgICAgICAgdi1lbHNlXG4gICAgICAgIGNsYXNzPVwiYXBwLWhlYWRlcl9fcGxhY2VzXCJcbiAgICAgICAgYXJpYS1sYWJlbD1cIk11b24zRFwiXG4gICAgICAgIGRhdGEtdGlkPVwiaGVhZGVyLXBsYWNlc1wiXG4gICAgICA+XG4gICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgIHYtZm9yPVwicGxhY2UgaW4gcGxhY2VzXCJcbiAgICAgICAgICA6a2V5PVwicGxhY2UudG9cIlxuICAgICAgICAgIDp0bz1cInBsYWNlLnRvXCJcbiAgICAgICAgICBjbGFzcz1cImFwcC1oZWFkZXJfX3BsYWNlXCJcbiAgICAgICAgICA6Y2xhc3M9XCJ7ICdhcHAtaGVhZGVyX19wbGFjZS0tb24nOiBwbGFjZS5vbiB9XCJcbiAgICAgICAgICA6YXJpYS1jdXJyZW50PVwicGxhY2Uub24gPyAocGxhY2UudG8gPT09ICRyb3V0ZS5wYXRoID8gJ3BhZ2UnIDogJ3RydWUnKSA6IHVuZGVmaW5lZFwiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYGhlYWRlci1wbGFjZS0ke3BsYWNlLmlkfWBcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgcGxhY2UubmFtZSB9fVxuICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCIhcGxhY2VzLnNvbWUocGxhY2UgPT4gcGxhY2Uub24pXCJcbiAgICAgICAgICBjbGFzcz1cImFwcC1oZWFkZXJfX3BsYWNlIGFwcC1oZWFkZXJfX3BsYWNlLS1vblwiXG4gICAgICAgID57eyBwbGFjZU5hbWUgfX08L3NwYW4+XG4gICAgICA8L25hdj5cblxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJhcHAtaGVhZGVyX19jbWRcIlxuICAgICAgICBhcmlhLWxhYmVsPVwiU2VhcmNoIG9yIHJ1biBhIGNvbW1hbmRcIlxuICAgICAgICBkYXRhLXRpZD1cImNvbW1hbmQtYmFyLW9wZW5cIlxuICAgICAgICBAY2xpY2s9XCJvcGVuQ29tbWFuZHNcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJzZWFyY2hcIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiYXBwLWhlYWRlcl9fY21kLXRleHRcIj5TZWFyY2ggb3IgcnVuIGEgY29tbWFuZDwvc3Bhbj5cbiAgICAgICAgPGtiZCBjbGFzcz1cImFwcC1oZWFkZXJfX2NtZC1rZXlzXCI+e3sgY29tbWFuZEtleXMgfX08L2tiZD5cbiAgICAgIDwvYnV0dG9uPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiYXBwLWhlYWRlcl9fYWN0aW9uc1wiPlxuICAgICAgICA8YXBwLXNhdmUtY29uZmlnLWFuZC1yZXN0YXJ0LWJ0blxuICAgICAgICAgIHYtaWY9XCIhc2VjdGlvbkNvbnRleHQuZm9yZWlnbiAmJiBzb2NrZXRDb25uZWN0ZWQgJiYga2xpcHB5UmVhZHkgJiYgYXV0aGVudGljYXRlZCAmJiBzaG93U2F2ZUNvbmZpZ0FuZFJlc3RhcnRGb3JQZW5kaW5nQ2hhbmdlc1wiXG4gICAgICAgICAgOmxvYWRpbmc9XCJoYXNXYWl0KCR3YWl0cy5vblNhdmVDb25maWcpXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJwcmludGVyUHJpbnRpbmcgfHwgcHJpbnRlclBhdXNlZFwiXG4gICAgICAgICAgQGNsaWNrPVwic2F2ZUNvbmZpZ0FuZFJlc3RhcnRcIlxuICAgICAgICAvPlxuXG4gICAgICAgIDxhcHAtdXBsb2FkLWFuZC1wcmludC1idG5cbiAgICAgICAgICB2LWlmPVwicHJpbnRlckZyYW1lICYmICFzZWN0aW9uQ29udGV4dC5mb3JlaWduICYmIGF1dGhlbnRpY2F0ZWQgJiYgc29ja2V0Q29ubmVjdGVkICYmIHNob3dVcGxvYWRBbmRQcmludFwiXG4gICAgICAgICAgOnRvb2x0aXA9XCJ1cGxvYWRUb29sdGlwXCJcbiAgICAgICAgICBAdXBsb2FkPVwiaGFuZGxlVXBsb2FkQW5kUHJpbnRcIlxuICAgICAgICAvPlxuXG4gICAgICAgIDxxdWljay1hY3Rpb25zLW1lbnUgdi1pZj1cInNob3dRdWlja0FjdGlvbnNcIiAvPlxuXG4gICAgICAgIDx2LXRvb2x0aXBcbiAgICAgICAgICB2LWlmPVwiIXNlY3Rpb25Db250ZXh0LmZvcmVpZ24gJiYgcHJpbnRlckZyYW1lICYmIGF1dGhlbnRpY2F0ZWQgJiYgc29ja2V0Q29ubmVjdGVkICYmIHRvcE5hdlBvd2VyVG9nZ2xlXCJcbiAgICAgICAgICBib3R0b21cbiAgICAgICAgPlxuICAgICAgICAgIDx0ZW1wbGF0ZSAjYWN0aXZhdG9yPVwieyBvbiwgYXR0cnMgfVwiPlxuICAgICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgICAgZmFiXG4gICAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICAgIDplbGV2YXRpb249XCIwXCJcbiAgICAgICAgICAgICAgY29sb3I9XCJ0cmFuc3BhcmVudFwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cInRvcE5hdlBvd2VyRGV2aWNlRGlzYWJsZWRcIlxuICAgICAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgICAgIHYtb249XCJvblwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImhhbmRsZVBvd2VyVG9nZ2xlKClcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8di1pY29uPlxuICAgICAgICAgICAgICAgIHt7IHRvcE5hdlBvd2VyRGV2aWNlT24gPyAnJHBvd2VyT24nIDogJyRwb3dlck9mZicgfX1cbiAgICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgICA8L2FwcC1idG4+XG4gICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICA8c3Bhbj57eyAkdChgYXBwLmdlbmVyYWwubGFiZWwudHVybl9kZXZpY2VfJHt0b3BOYXZQb3dlckRldmljZU9uID8gJ29mZicgOiAnb24nfWAsIHsgZGV2aWNlOiB0b3BOYXZQb3dlclRvZ2dsZS5uYW1lIH0pIH19PC9zcGFuPlxuICAgICAgICA8L3YtdG9vbHRpcD5cblxuICAgICAgICA8bm90aWNlcy1iZWxsIDpwcmludGVyPVwicHJpbnRlck5vdGljZXNcIiAvPlxuXG4gICAgICAgIDxjbG91ZC1hY2NvdW50LW1lbnUgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dFc3RvcFwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImFwcC1oZWFkZXJfX3J1bGVcIiAvPlxuICAgICAgICA8di10b29sdGlwIGJvdHRvbT5cbiAgICAgICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzIH1cIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwiYXBwLWhlYWRlcl9fZXN0b3BcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCIhZXN0b3BSZWFkeVwiXG4gICAgICAgICAgICAgIDphcmlhLWxhYmVsPVwiJHRjKCdhcHAuZ2VuZXJhbC50b29sdGlwLmVzdG9wJylcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cImVzdG9wXCJcbiAgICAgICAgICAgICAgdi1iaW5kPVwiYXR0cnNcIlxuICAgICAgICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJlbWVyZ2VuY3lTdG9wKClcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICAgIG5hbWU9XCJlc3RvcFwiXG4gICAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgRS1TVE9QXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLnRvb2x0aXAuZXN0b3AnKSB9fVxuICAgICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCJlbmFibGVLZXlib2FyZFNob3J0Y3V0c1wiPlxuICAgICAgICAgICAgICA8YnI+XG4gICAgICAgICAgICAgIDxrYmQ+Q3RybDwva2JkPiArIDxrYmQ+U2hpZnQ8L2tiZD4gKyA8a2JkPmU8L2tiZD5cbiAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L3YtdG9vbHRpcD5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDxpbnB1dFxuICAgICAgcmVmPVwidXBsb2FkSW5wdXRcIlxuICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgOmFjY2VwdD1cImdjb2RlQWNjZXB0XCJcbiAgICAgIGNsYXNzPVwiYXBwLWhlYWRlcl9fdXBsb2FkXCJcbiAgICAgIHRhYmluZGV4PVwiLTFcIlxuICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgIEBjaGFuZ2U9XCJvblVwbG9hZFBpY2tlZFwiXG4gICAgPlxuXG4gICAgPHBlbmRpbmctY2hhbmdlcy1kaWFsb2dcbiAgICAgIHYtaWY9XCJwZW5kaW5nQ2hhbmdlc0RpYWxvZ09wZW5cIlxuICAgICAgdi1tb2RlbD1cInBlbmRpbmdDaGFuZ2VzRGlhbG9nT3BlblwiXG4gICAgICBAc2F2ZT1cInNhdmVDb25maWdBbmRSZXN0YXJ0KHRydWUpXCJcbiAgICAvPlxuICA8L3YtYXBwLWJhcj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBhY3RpdmVTbHVnIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuaW1wb3J0IENsb3VkQWNjb3VudE1lbnUgZnJvbSAnQC9jb21wb25lbnRzL211b24tY2xvdWQvQ2xvdWRBY2NvdW50TWVudS52dWUnXG5pbXBvcnQgTm90aWNlc0JlbGwgZnJvbSAnQC9jb21wb25lbnRzL211b24tY2xvdWQvTm90aWNlc0JlbGwudnVlJ1xuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFBlbmRpbmdDaGFuZ2VzRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9QZW5kaW5nQ2hhbmdlc0RpYWxvZy52dWUnXG5pbXBvcnQgQXBwU2F2ZUNvbmZpZ0FuZFJlc3RhcnRCdG4gZnJvbSAnLi9BcHBTYXZlQ29uZmlnQW5kUmVzdGFydEJ0bi52dWUnXG5pbXBvcnQgQXBwVXBsb2FkQW5kUHJpbnRCdG4gZnJvbSAnLi9BcHBVcGxvYWRBbmRQcmludEJ0bi52dWUnXG5pbXBvcnQgUHJpbnRlclN3aXRjaEJ1dHRvbiBmcm9tICcuL1ByaW50ZXJTd2l0Y2hCdXR0b24udnVlJ1xuaW1wb3J0IFF1aWNrQWN0aW9uc01lbnUgZnJvbSAnLi9RdWlja0FjdGlvbnNNZW51LnZ1ZSdcbmltcG9ydCBGcmFtZU1peGluIGZyb20gJ0AvbWl4aW5zL2ZyYW1lJ1xuaW1wb3J0IFNlcnZpY2VzTWl4aW4gZnJvbSAnQC9taXhpbnMvc2VydmljZXMnXG5pbXBvcnQgRmlsZXNNaXhpbiwgeyB1cGxvYWRFcnJvclRleHQgfSBmcm9tICdAL21peGlucy9maWxlcydcbmltcG9ydCBjb25zb2xhIGZyb20gJ2NvbnNvbGEnXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgeyBTb2NrZXRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvc29ja2V0QWN0aW9ucydcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcbmltcG9ydCB7IGlzTW9kZWxGaWxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IHsgTU9ERUxfQUNDRVBUIH0gZnJvbSAnQC9zZXJ2aWNlcy9zbGljZXItYnJpZGdlL2hhbmRvdmVyJ1xuaW1wb3J0IHR5cGUgeyBPdXRwdXRQaW4gfSBmcm9tICdAL3N0b3JlL3ByaW50ZXIvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IERldmljZSB9IGZyb20gJ0Avc3RvcmUvcG93ZXIvdHlwZXMnXG5cbi8qKlxuICogVGhlIGhlYWRlciBhbnN3ZXJzIHRocmVlIHF1ZXN0aW9ucyBpbiBvcmRlcjogd2hlcmUgYW0gSSAoTXVvbjNELCB0aGVcbiAqIHByaW50ZXIpLCB3aGF0IGlzIHRoaXMgcHJpbnRlciBkb2luZyAoaXRzIHN0YXR1cywgYmVzaWRlIGl0cyBuYW1lKSwgYW5kXG4gKiBob3cgZG8gSSBzdG9wIGl0IChFLVNUT1AsIGFsb25lIGF0IHRoZSBmYXIgZW5kKS4gT24gYSBwYWdlIHdpdGggbm9cbiAqIHByaW50ZXIgaXQgbmFtZXMgdGhlIHBhZ2UgaW5zdGVhZCBhbmQgaGFzIG5vIEUtU1RPUC5cbiAqL1xuQENvbXBvbmVudCh7XG4gIGNvbXBvbmVudHM6IHtcbiAgICBDbG91ZEFjY291bnRNZW51LFxuICAgIE5vdGljZXNCZWxsLFxuICAgIFBlbmRpbmdDaGFuZ2VzRGlhbG9nLFxuICAgIEFwcFNhdmVDb25maWdBbmRSZXN0YXJ0QnRuLFxuICAgIEFwcFVwbG9hZEFuZFByaW50QnRuLFxuICAgIFByaW50ZXJTd2l0Y2hCdXR0b24sXG4gICAgUXVpY2tBY3Rpb25zTWVudVxuICB9XG59KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwQmFyIGV4dGVuZHMgTWl4aW5zKEZyYW1lTWl4aW4sIFNlcnZpY2VzTWl4aW4sIEZpbGVzTWl4aW4sIEJyb3dzZXJNaXhpbikge1xuICBwZW5kaW5nQ2hhbmdlc0RpYWxvZ09wZW4gPSBmYWxzZVxuXG4gIGdldCBwaG9uZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNNb2JpbGVWaWV3cG9ydFxuICB9XG5cbiAgLyoqXG4gICAqIEFsd2F5cyBpbiB0aGUgYmFyIG9uIGEgcHJpbnRlcjogaXQgaXMgZ3JleWVkLCBuZXZlciBnb25lLCB3aGlsZSB0aGUgcHJpbnRlciBjYW5ub3QgYmUgcmVhY2hlZC5cbiAgICogQWNjb3VudCBpcyBhIHRvcC1sZXZlbCBwYWdlIHdpdGggbm8gcHJpbnRlciBmcmFtZSwgYnV0IGEgcHJpbnRlciBvcGVuIGJlaGluZCBpdCBjYW4gc3RpbGwgYmUgc3RvcHBlZC5cbiAgICovXG4gIGdldCBzaG93RXN0b3AgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoIXRoaXMuc2VjdGlvbkNvbnRleHQuZm9yZWlnbiAmJiB0aGlzLnByaW50ZXJGcmFtZSkgfHwgdGhpcy5hY2NvdW50T3ZlclByaW50ZXIgPT09IHRydWVcbiAgfVxuXG4gIC8qKiBBY2NvdW50IChhbHdheXMgdG9wLWxldmVsKSB3aXRoIGEgcHJpbnRlciBvcGVuLiAqL1xuICBnZXQgYWNjb3VudE92ZXJQcmludGVyICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLiRyb3V0ZT8ubmFtZT8uc3RhcnRzV2l0aCgnQWNjb3VudCcpICYmICEhYWN0aXZlU2x1ZygpXG4gIH1cblxuICBnZXQgZXN0b3BSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlZCAmJiB0aGlzLnNvY2tldENvbm5lY3RlZCAmJiB0aGlzLmtsaXBweVJlYWR5XG4gIH1cblxuICAvKiogVGhlIG9uZSBub3RpZmljYXRpb24gaWNvbiBjYXJyaWVzIHRoaXMgcHJpbnRlcidzIHdhcm5pbmdzIGFuZCBub3RpZmljYXRpb25zIHRvby4gKi9cbiAgZ2V0IHByaW50ZXJOb3RpY2VzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuc2VjdGlvbkNvbnRleHQuZm9yZWlnbiAmJiB0aGlzLmF1dGhlbnRpY2F0ZWQgJiYgdGhpcy5zb2NrZXRDb25uZWN0ZWRcbiAgfVxuXG4gIC8qKiBRdWljayBhY3Rpb25zIGFyZSBvbiBldmVyeSBwcmludGVyJ3MgYmFyOyBlYWNoIHNheXMgd2h5IGl0IGNhbm5vdCBydW4gd2hlbiBpdCBjYW5ub3QuICovXG4gIGdldCBzaG93UXVpY2tBY3Rpb25zICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuc2VjdGlvbkNvbnRleHQuZm9yZWlnbiAmJiB0aGlzLnByaW50ZXJGcmFtZVxuICB9XG5cbiAgLyoqIEEgcGFnZSB3aXRoIG5vIHByaW50ZXIgbmFtZXMgaXRzZWxmOiBQcmludGVycywgRmxlZXQsIFNsaWNlLiAqL1xuICBnZXQgcGxhY2VOYW1lICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLiRyb3V0ZS5wYXRoID09PSAnLycpIHJldHVybiAnUHJpbnRlcnMnXG4gICAgaWYgKHRoaXMuJHJvdXRlLm5hbWUgPT09ICdTbGljZSAobm8gcHJpbnRlciknKSByZXR1cm4gJ1NsaWNlJ1xuICAgIGlmICh0aGlzLiRyb3V0ZS5uYW1lPy5zdGFydHNXaXRoKCdMaWJyYXJ5JykpIHJldHVybiAnTGlicmFyeSdcbiAgICBpZiAodGhpcy4kcm91dGUubmFtZT8uc3RhcnRzV2l0aCgnQWNjb3VudCcpKSByZXR1cm4gJ0FjY291bnQnXG4gICAgcmV0dXJuIHRoaXMuJHJvdXRlLm5hbWUgPz8gJydcbiAgfVxuXG4gIGdldCBvbkxpYnJhcnkgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRyb3V0ZS5uYW1lPy5zdGFydHNXaXRoKCdMaWJyYXJ5JykgPz8gZmFsc2VcbiAgfVxuXG4gIC8qKiBXaGVyZSB5b3UgY2FuIGdvIHdpdGhvdXQgY2hvb3NpbmcgYSBwcmludGVyLiAqL1xuICBnZXQgcGxhY2VzICgpOiBBcnJheTx7IGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdG86IHN0cmluZywgb246IGJvb2xlYW4gfT4ge1xuICAgIHJldHVybiBbXG4gICAgICB7IGlkOiAncHJpbnRlcnMnLCBuYW1lOiAnUHJpbnRlcnMnLCB0bzogJy8nLCBvbjogdGhpcy4kcm91dGUucGF0aCA9PT0gJy8nIH0sXG4gICAgICB7IGlkOiAnbGlicmFyeScsIG5hbWU6ICdMaWJyYXJ5JywgdG86ICcvbGlicmFyeScsIG9uOiB0aGlzLm9uTGlicmFyeSB9XG4gICAgXVxuICB9XG5cbiAgb3BlbkNvbW1hbmRzICgpIHtcbiAgICBFdmVudEJ1cy5idXMuJGVtaXQoJ2NvbW1hbmQtYmFyJylcbiAgfVxuXG4gIC8qKiDijJggSyBvbiBhIE1hYywgQ3RybCBLIGVsc2V3aGVyZS4gKi9cbiAgZ2V0IGNvbW1hbmRLZXlzICgpOiBzdHJpbmcge1xuICAgIHJldHVybiAvTWFjfGlQaG9uZXxpUGFkLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSB8fCBuYXZpZ2F0b3IudXNlckFnZW50KSA/ICfijJggSycgOiAnQ3RybCBLJ1xuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgRXZlbnRCdXMuYnVzLiRvbigndXBsb2FkLWZpbGUnLCB0aGlzLnBpY2tVcGxvYWQpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICBFdmVudEJ1cy5idXMuJG9mZigndXBsb2FkLWZpbGUnLCB0aGlzLnBpY2tVcGxvYWQpXG4gIH1cblxuICAvKiogVTogY2hvb3NlIGEgZmlsZSB0byBwcmludCwgYXMgdGhlIHVwbG9hZCBidXR0b24gZG9lcy4gKi9cbiAgcGlja1VwbG9hZCAoKSB7XG4gICAgKHRoaXMuJHJlZnMudXBsb2FkSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCB8IHVuZGVmaW5lZCk/LmNsaWNrKClcbiAgfVxuXG4gIGFzeW5jIG9uVXBsb2FkUGlja2VkIChldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBpbnB1dCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgY29uc3QgZmlsZSA9IGlucHV0LmZpbGVzPy5bMF1cbiAgICBpbnB1dC52YWx1ZSA9ICcnXG4gICAgaWYgKGZpbGUpIGF3YWl0IHRoaXMuaGFuZGxlVXBsb2FkQW5kUHJpbnQoZmlsZSlcbiAgfVxuXG4gIGdldCBzYXZlQ29uZmlnUGVuZGluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0U2F2ZUNvbmZpZ1BlbmRpbmcnXSBhcyBib29sZWFuXG4gIH1cblxuICBnZXQgc2F2ZUNvbmZpZ1BlbmRpbmdJdGVtcyAoKTogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFNhdmVDb25maWdQZW5kaW5nSXRlbXMnXSBhcyBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PlxuICB9XG5cbiAgZ2V0IHNob3dTYXZlQ29uZmlnQW5kUmVzdGFydEZvclBlbmRpbmdDaGFuZ2VzICgpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuc2hvd1NhdmVDb25maWdBbmRSZXN0YXJ0IHx8ICF0aGlzLnNhdmVDb25maWdQZW5kaW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBjb25zdCBzZWN0aW9uc1RvSWdub3JlID0gdGhpcy5zZWN0aW9uc1RvSWdub3JlUGVuZGluZ0NvbmZpZ3VyYXRpb25DaGFuZ2VzXG5cbiAgICByZXR1cm4gKFxuICAgICAgc2VjdGlvbnNUb0lnbm9yZS5sZW5ndGggPT09IDAgfHxcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMuc2F2ZUNvbmZpZ1BlbmRpbmdJdGVtcylcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gIXNlY3Rpb25zVG9JZ25vcmUuaW5jbHVkZXMoa2V5KSlcbiAgICAgICAgLmxlbmd0aCA+IDBcbiAgICApXG4gIH1cblxuICBnZXQgZGV2aWNlUG93ZXJDb21wb25lbnRFbmFibGVkICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2NvbXBvbmVudFN1cHBvcnQnXSgncG93ZXInKVxuICB9XG5cbiAgZ2V0IHNob3dTYXZlQ29uZmlnQW5kUmVzdGFydCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuc2hvd1NhdmVDb25maWdBbmRSZXN0YXJ0IGFzIGJvb2xlYW5cbiAgfVxuXG4gIGdldCBzZWN0aW9uc1RvSWdub3JlUGVuZGluZ0NvbmZpZ3VyYXRpb25DaGFuZ2VzICgpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuc2VjdGlvbnNUb0lnbm9yZVBlbmRpbmdDb25maWd1cmF0aW9uQ2hhbmdlcyBhcyBzdHJpbmdbXVxuICB9XG5cbiAgZ2V0IHNob3dVcGxvYWRBbmRQcmludCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuc2hvd1VwbG9hZEFuZFByaW50XG4gIH1cblxuICBnZXQgdG9wTmF2UG93ZXJUb2dnbGUgKCkge1xuICAgIGNvbnN0IHRvcE5hdlBvd2VyVG9nZ2xlID0gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC50b3BOYXZQb3dlclRvZ2dsZSBhcyBzdHJpbmcgfCBudWxsXG5cbiAgICBpZiAoIXRvcE5hdlBvd2VyVG9nZ2xlKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3QgW25hbWUsIHR5cGVdID0gdG9wTmF2UG93ZXJUb2dnbGUuc3BsaXQoJzonKVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdrbGlwcGVyJzoge1xuICAgICAgICBjb25zdCBkZXZpY2UgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFBpbkJ5TmFtZSddKG5hbWUpIGFzIE91dHB1dFBpbiB8IHVuZGVmaW5lZFxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBuYW1lOiBkZXZpY2U/LnByZXR0eU5hbWUgPz8gbmFtZSxcbiAgICAgICAgICBkZXZpY2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGNvbnN0IGRldmljZSA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Bvd2VyL2dldERldmljZUJ5TmFtZSddKHRvcE5hdlBvd2VyVG9nZ2xlKSBhcyBEZXZpY2VcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdtb29ucmFrZXInIGFzIGNvbnN0LFxuICAgICAgICAgIG5hbWU6IHRvcE5hdlBvd2VyVG9nZ2xlLFxuICAgICAgICAgIGRldmljZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IHRvcE5hdlBvd2VyRGV2aWNlT24gKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHsgdHlwZSwgZGV2aWNlIH0gPSB0aGlzLnRvcE5hdlBvd2VyVG9nZ2xlIHx8IHt9XG5cbiAgICBpZiAoIWRldmljZSkgcmV0dXJuIGZhbHNlXG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ21vb25yYWtlcic6XG4gICAgICAgIHJldHVybiBkZXZpY2Uuc3RhdHVzID09PSAnb24nXG5cbiAgICAgIGNhc2UgJ2tsaXBwZXInOlxuICAgICAgICByZXR1cm4gZGV2aWNlLnZhbHVlICE9PSAwXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBnZXQgdG9wTmF2UG93ZXJEZXZpY2VEaXNhYmxlZCAoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgeyB0eXBlLCBkZXZpY2UgfSA9IHRoaXMudG9wTmF2UG93ZXJUb2dnbGUgfHwge31cblxuICAgIGlmICghZGV2aWNlKSByZXR1cm4gdHJ1ZVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdtb29ucmFrZXInOlxuICAgICAgICByZXR1cm4gKHRoaXMucHJpbnRlclByaW50aW5nICYmIGRldmljZS5sb2NrZWRfd2hpbGVfcHJpbnRpbmcpIHx8IFsnaW5pdCcsICdlcnJvciddLmluY2x1ZGVzKGRldmljZS5zdGF0dXMpIHx8ICghdGhpcy5kZXZpY2VQb3dlckNvbXBvbmVudEVuYWJsZWQpXG5cbiAgICAgIGNhc2UgJ2tsaXBwZXInOlxuICAgICAgICByZXR1cm4gIXRoaXMua2xpcHB5UmVhZHlcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZ2V0IGVuYWJsZUtleWJvYXJkU2hvcnRjdXRzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVLZXlib2FyZFNob3J0Y3V0c1xuICB9XG5cbiAgLyoqIFdoYXQgVSdzIHBpY2tlciB0YWtlczogdGhlIEctY29kZSByb290J3Mgb3duIGxpc3QsIGFzIHRoZSBoZWFkZXIncyB1cGxvYWQgYnV0dG9uIHVzZXMuICovXG4gIGdldCBnY29kZUFjY2VwdCAoKTogc3RyaW5nIHtcbiAgICBjb25zdCByb290ID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snZmlsZXMvZ2V0Um9vdFByb3BlcnRpZXMnXSgnZ2NvZGVzJykgYXMgeyBhY2NlcHRzPzogc3RyaW5nW10gfSB8IHVuZGVmaW5lZFxuICAgIHJldHVybiBbLi4uKHJvb3Q/LmFjY2VwdHMgPz8gW10pLCAuLi5NT0RFTF9BQ0NFUFRdLmpvaW4oJywnKVxuICB9XG5cbiAgYXN5bmMgaGFuZGxlUG93ZXJUb2dnbGUgKCkge1xuICAgIGNvbnN0IHsgdHlwZSwgZGV2aWNlIH0gPSB0aGlzLnRvcE5hdlBvd2VyVG9nZ2xlIHx8IHt9XG5cbiAgICBpZiAoIWRldmljZSkgcmV0dXJuXG5cbiAgICBjb25zdCBjb25maXJtT25Qb3dlckRldmljZUNoYW5nZSA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuY29uZmlybU9uUG93ZXJEZXZpY2VDaGFuZ2VcblxuICAgIGNvbnN0IHR1cm5PZmYgPSB0aGlzLnRvcE5hdlBvd2VyRGV2aWNlT25cbiAgICBjb25zdCBuYW1lID0gdGhpcy50b3BOYXZQb3dlclRvZ2dsZT8ubmFtZSA/PyAndGhlIHBvd2VyJ1xuICAgIGNvbnN0IHJlc3VsdCA9IChcbiAgICAgICFjb25maXJtT25Qb3dlckRldmljZUNoYW5nZSB8fFxuICAgICAgYXdhaXQgdGhpcy4kY29uZmlybShcbiAgICAgICAgdHVybk9mZiA/ICdXaGF0ZXZlciBydW5zIGZyb20gaXQgbG9zZXMgcG93ZXIgYXQgb25jZS4nIDogJ0l0IHN3aXRjaGVzIG9uIHN0cmFpZ2h0IGF3YXkuJyxcbiAgICAgICAgeyB0aXRsZTogYFR1cm4gJHtuYW1lfSAke3R1cm5PZmYgPyAnb2ZmJyA6ICdvbid9P2AsIGJ1dHRvblRydWVUZXh0OiB0dXJuT2ZmID8gJ1R1cm4gb2ZmJyA6ICdUdXJuIG9uJywgZGFuZ2VyOiB0dXJuT2ZmIH1cbiAgICAgIClcbiAgICApXG5cbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnbW9vbnJha2VyJzoge1xuICAgICAgICAgIGNvbnN0IHN0YXRlID0gKGRldmljZS5zdGF0dXMgPT09ICdvbicpID8gJ29mZicgOiAnb24nXG4gICAgICAgICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lRGV2aWNlUG93ZXJUb2dnbGUoZGV2aWNlLmRldmljZSwgc3RhdGUpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ2tsaXBwZXInOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSAoZGV2aWNlLnZhbHVlICE9PSAwKSA/IDAgOiBkZXZpY2Uuc2NhbGVcbiAgICAgICAgICB0aGlzLnNlbmRHY29kZShgU0VUX1BJTiBQSU49JHtkZXZpY2UubmFtZX0gVkFMVUU9JHt2YWx1ZX1gLCBgJHt0aGlzLiR3YWl0cy5vblNldE91dHB1dFBpbn0ke2RldmljZS5uYW1lfWApXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElkbGUsIHRoZSBmaWxlIGdvZXMgdXAgYW5kIFJlYWR5IHRvIHByaW50IG9wZW5zLCB3aGVyZSBQcmludCBub3cgYXNrc1xuICAvLyB0aGUgcGxhdGUgY2hlY2sgbGlrZSBldmVyeSBvdGhlciBwcmludC4gTWlkLXByaW50LCBpdCBnb2VzIHRvIHRoZSBqb2JcbiAgLy8gcXVldWUsIGFuZCB3aXRoIEtsaXBwZXIgZG93biBpdCBpcyBvbmx5IHVwbG9hZGVkLCBzbyB0aGUgYnV0dG9uIGFsd2F5c1xuICAvLyBkb2VzIHNvbWV0aGluZy5cbiAgZ2V0IHVwbG9hZFByaW50c05vdyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMua2xpcHB5UmVhZHkgJiYgIXRoaXMucHJpbnRlclByaW50aW5nICYmICF0aGlzLnByaW50ZXJQYXVzZWRcbiAgfVxuXG4gIGdldCB1cGxvYWRRdWV1ZXMgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy51cGxvYWRQcmludHNOb3cgJiYgdGhpcy5rbGlwcHlSZWFkeSAmJlxuICAgICAgdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2NvbXBvbmVudFN1cHBvcnQnXSgnam9iX3F1ZXVlJylcbiAgfVxuXG4gIGdldCB1cGxvYWRUb29sdGlwICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnVwbG9hZFByaW50c05vdykgcmV0dXJuIHRoaXMuJHRjKCdhcHAuZ2VuZXJhbC5sYWJlbC51cGxvYWRfYW5kX3ByaW50JylcbiAgICBpZiAodGhpcy51cGxvYWRRdWV1ZXMpIHJldHVybiB0aGlzLiR0YygnYXBwLmdlbmVyYWwubGFiZWwudXBsb2FkX2FuZF9xdWV1ZScpXG4gICAgcmV0dXJuIHRoaXMuJHRjKCdhcHAuZ2VuZXJhbC5idG4udXBsb2FkJylcbiAgfVxuXG4gIGFzeW5jIGhhbmRsZVVwbG9hZEFuZFByaW50IChmaWxlOiBGaWxlKSB7XG4gICAgLy8gQSBtb2RlbCBpcyBTbGljZSdzIHRvIG9wZW4sIG5vdCBhIGZpbGUgZm9yIHRoZSBwcmludGVyIChLQU4tMjE5MSkuXG4gICAgaWYgKGlzTW9kZWxGaWxlKGZpbGUubmFtZSkpIHtcbiAgICAgIEV2ZW50QnVzLmJ1cy4kZW1pdCgnbW9kZWwtZHJvcHBlZCcsIFtmaWxlXSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy51cGxvYWRBbmRIYW5kT24oZmlsZSlcbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgY29uc29sYS5lcnJvcignW0ZpbGVVcGxvYWRdIGZpbGUnLCBlcnJvcilcbiAgICAgIEV2ZW50QnVzLiRlbWl0KGBVcGxvYWQgb2YgJHtmaWxlLm5hbWV9IGZhaWxlZDogJHt1cGxvYWRFcnJvclRleHQoZXJyb3IpfWAsIHsgdHlwZTogJ2Vycm9yJywgdGltZW91dDogLTEgfSlcbiAgICB9XG4gIH1cblxuICBhc3luYyB1cGxvYWRBbmRIYW5kT24gKGZpbGU6IEZpbGUpIHtcbiAgICBpZiAodGhpcy51cGxvYWRQcmludHNOb3cpIHtcbiAgICAgIC8vIE5ldmVyIE1vb25yYWtlcidzIHByaW50LW9uLXVwbG9hZDogdGhhdCBzdGFydGVkIHRoZSBwcmludCB3aXRoIG5vXG4gICAgICAvLyBwbGF0ZSBjaGVjaywgb24gYSBwcmludGVyIHRoYXQgcHJpbnRzIHVwc2lkZSBkb3duIG9udG8gaXRzIHBsYXRlLlxuICAgICAgYXdhaXQgdGhpcy51cGxvYWRGaWxlKGZpbGUsICcvJywgJ2djb2RlcycsIGZhbHNlKVxuICAgICAgRXZlbnRCdXMuYnVzLiRlbWl0KCdqb2ItcmVhZHknLCBmaWxlLm5hbWUpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBxdWV1ZSA9IHRoaXMudXBsb2FkUXVldWVzXG4gICAgYXdhaXQgdGhpcy51cGxvYWRGaWxlKGZpbGUsICcvJywgJ2djb2RlcycsIGZhbHNlKVxuXG4gICAgaWYgKHF1ZXVlKSB7XG4gICAgICBhd2FpdCBTb2NrZXRBY3Rpb25zLnNlcnZlckpvYlF1ZXVlUG9zdEpvYihbZmlsZS5uYW1lXSlcbiAgICAgIEV2ZW50QnVzLiRlbWl0KHRoaXMuJHQoJ2FwcC5nZW5lcmFsLm1zZy51cGxvYWRfcXVldWVkJywgeyBuYW1lOiBmaWxlLm5hbWUgfSkudG9TdHJpbmcoKSwgeyB0aW1lb3V0OiA0MDAwIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIEV2ZW50QnVzLiRlbWl0KHRoaXMuJHQoJ2FwcC5nZW5lcmFsLm1zZy51cGxvYWRfc2F2ZWQnLCB7IG5hbWU6IGZpbGUubmFtZSB9KS50b1N0cmluZygpLCB7IHRpbWVvdXQ6IDQwMDAgfSlcbiAgICB9XG4gIH1cblxuICBzYXZlQ29uZmlnQW5kUmVzdGFydCAoZm9yY2UgPSBmYWxzZSkge1xuICAgIC8vIFNhdmUgYW5kIHJlc3RhcnQ6IEFsd2F5cyAoU2V0dGluZ3Mg4oC6IEZpbGVzIGFuZCBlZGl0b3IpIHJlc3RhcnRzIHdpdGhvdXQgdGhlIGxpc3QuXG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5lZGl0b3Iuc2F2ZUFuZFJlc3RhcnQgIT09ICdhbHdheXMnKSB7XG4gICAgICBjb25zdCBjb25maXJtT25TYXZlQ29uZmlnQW5kUmVzdGFydCA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuY29uZmlybU9uU2F2ZUNvbmZpZ0FuZFJlc3RhcnRcblxuICAgICAgaWYgKGNvbmZpcm1PblNhdmVDb25maWdBbmRSZXN0YXJ0KSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NoYW5nZXNEaWFsb2dPcGVuID0gdHJ1ZVxuXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2VuZEdjb2RlKCdTQVZFX0NPTkZJRycsIHRoaXMuJHdhaXRzLm9uU2F2ZUNvbmZpZylcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAvLyBUaGUgdG9wIGJhcidzIGljb24gYnV0dG9uOiBvbmUgYm94IGZvciBldmVyeSBpY29uIGluIGl0LiBOb3Qgc2NvcGVkLCBzaW5jZVxuICAvLyBRdWljayBhY3Rpb25zIHJlbmRlcnMgaXRzIG93biBidXR0b24gZnJvbSBhbm90aGVyIGNvbXBvbmVudC5cbiAgLmFwcC1oZWFkZXJfX2ljb24ge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogNDBweDtcbiAgICBoZWlnaHQ6IDQwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgJjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvLyBBIHNoZWV0J3Mgc2NyaW0gbXVzdCBub3QgY292ZXIgU1RPUDogd2hpbGUgb25lIGlzIG9wZW4gb24gYSBwaG9uZSwgdGhlXG4gIC8vIHRvcCBiYXIgc3RhbmRzIGFib3ZlIHRoZSBzY3JpbS4gVGhlIHNoZWV0IHJpc2VzIGZyb20gdGhlIGJvdHRvbSwgc28gdGhlXG4gIC8vIHR3byBuZXZlciBvdmVybGFwLlxuICAudi1hcHBsaWNhdGlvbjpoYXMoLnYtYm90dG9tLXNoZWV0LnYtZGlhbG9nLS1hY3RpdmUpIC52LWFwcC1iYXIuYXBwLWhlYWRlcixcbiAgYm9keTpoYXMoLnYtYm90dG9tLXNoZWV0LnYtZGlhbG9nLS1hY3RpdmUpIC52LWFwcC1iYXIuYXBwLWhlYWRlciB7XG4gICAgei1pbmRleDogMjAyICFpbXBvcnRhbnQ7XG4gIH1cbjwvc3R5bGU+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmFwcC1oZWFkZXIge1xuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKSAhaW1wb3J0YW50O1xuICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLW0zZC1iZykgIWltcG9ydGFudDtcblxuICAgIDpkZWVwKC52LXRvb2xiYXJfX2NvbnRlbnQpIHtcbiAgICAgIGdhcDogMTJweDtcbiAgICAgIHBhZGRpbmc6IDAgMjBweDtcbiAgICB9XG5cbiAgICA6ZGVlcCgudi10b29sYmFyX19leHRlbnNpb24pIHtcbiAgICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgcGFkZGluZzogMDtcbiAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgICB9XG4gIH1cblxuICAuYXBwLWhlYWRlci0tcGhvbmUgOmRlZXAoLnYtdG9vbGJhcl9fY29udGVudCkge1xuICAgIGdhcDogOHB4O1xuICAgIHBhZGRpbmc6IDAgMTJweCAwIDE2cHg7XG4gIH1cblxuICAuYXBwLWhlYWRlcl9fYnJhbmQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGhlaWdodDogNDBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiA4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KSAhaW1wb3J0YW50O1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcblxuICAgIC5tdW9uLXdvcmRtYXJrIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICBsZXR0ZXItc3BhY2luZzogMC4yNGVtO1xuICAgIH1cbiAgfVxuXG4gIC5hcHAtaGVhZGVyX19icmFuZC0tZ3JvdyB7XG4gICAgZmxleDogMSAxIDA7XG5cbiAgICAubXVvbi13b3JkbWFyayB7XG4gICAgICBmb250LXNpemU6IDEycHg7XG4gICAgfVxuICB9XG5cbiAgLmFwcC1oZWFkZXJfX3VwbG9hZCB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgfVxuXG4gIC8vIFNlYXJjaCBvciBydW4gYSBjb21tYW5kOiBhIGJveCBpbiB0aGUgbWlkZGxlLCBhIGJ1dHRvbiB3aGVuIG5hcnJvdy5cbiAgLmFwcC1oZWFkZXJfX2NtZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAwIDEgMzgwcHg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gICAgbWluLXdpZHRoOiA0MHB4O1xuICAgIGhlaWdodDogNDBweDtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBwYWRkaW5nOiAwIDhweCAwIDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG5cbiAgICAmOmhvdmVyIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICAgIH1cbiAgfVxuXG4gIC5hcHAtaGVhZGVyX19jbWQtdGV4dCB7XG4gICAgZmxleDogMSAxIDA7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB9XG5cbiAgLmFwcC1oZWFkZXJfX2NtZC1rZXlzIHtcbiAgICBmbGV4OiBub25lO1xuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDExOTlweCkge1xuICAgIC5hcHAtaGVhZGVyX19jbWQge1xuICAgICAgZmxleDogbm9uZTtcbiAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgd2lkdGg6IDQwcHg7XG4gICAgICBwYWRkaW5nOiAwO1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIC5hcHAtaGVhZGVyX19jbWQtdGV4dCxcbiAgICAuYXBwLWhlYWRlcl9fY21kLWtleXMge1xuICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG4gIH1cblxuICAuYXBwLWhlYWRlcl9fcGxhY2VzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IDAgMSBhdXRvO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA0cHg7XG4gICAgbWluLXdpZHRoOiAwO1xuICB9XG5cbiAgLmFwcC1oZWFkZXJfX3BsYWNlIHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHBhZGRpbmc6IDZweCAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCkgIWltcG9ydGFudDtcbiAgICBmb250LXNpemU6IDE1cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcblxuICAgICZbaHJlZl06aG92ZXIge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyKTtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgICB9XG4gIH1cblxuICAuYXBwLWhlYWRlcl9fcGxhY2UtLW9uIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpICFpbXBvcnRhbnQ7XG4gICAgZm9udC1zaXplOiAxN3B4O1xuICB9XG5cbiAgLyogRXZlcnkgaWNvbiBhY3Rpb24gaXMgdGhlIHNhbWUgNDAgcHggc3F1YXJlLCA0IHB4IGFwYXJ0LiAqL1xuICAuYXBwLWhlYWRlcl9fYWN0aW9ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA0cHg7XG5cbiAgICA6ZGVlcCgudi1idG4udi1idG4tLWZhYi52LXNpemUtLXNtYWxsKSxcbiAgICA6ZGVlcCgudi1idG4udi1idG4tLWljb24pIHtcbiAgICAgIHdpZHRoOiA0MHB4ICFpbXBvcnRhbnQ7XG4gICAgICBtaW4td2lkdGg6IDQwcHggIWltcG9ydGFudDtcbiAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgbWFyZ2luOiAwICFpbXBvcnRhbnQ7XG4gICAgICBib3JkZXItcmFkaXVzOiAxMnB4ICFpbXBvcnRhbnQ7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudCAhaW1wb3J0YW50O1xuICAgICAgYm94LXNoYWRvdzogbm9uZSAhaW1wb3J0YW50O1xuICAgIH1cblxuICAgIDpkZWVwKC52LWJ0bi52LWJ0bi0tZmFiLnYtc2l6ZS0tc21hbGwgLnYtaWNvbiksXG4gICAgOmRlZXAoLnYtYnRuLnYtYnRuLS1pY29uIC52LWljb24pIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgfVxuXG4gICAgOmRlZXAoLnYtYnRuLnYtYnRuLS1mYWIudi1zaXplLS1zbWFsbDpob3ZlciksXG4gICAgOmRlZXAoLnYtYnRuLnYtYnRuLS1pY29uOmhvdmVyKSB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1tM2QtaG92ZXIpICFpbXBvcnRhbnQ7XG5cbiAgICAgIC52LWljb24ge1xuICAgICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIDpkZWVwKC5tci0xKSB7XG4gICAgICBtYXJnaW4tcmlnaHQ6IDAgIWltcG9ydGFudDtcbiAgICB9XG5cbiAgICA6ZGVlcCg+IGRpdikge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgfVxuICB9XG5cbiAgLmFwcC1oZWFkZXJfX3J1bGUge1xuICAgIGZsZXg6IG5vbmU7XG4gICAgd2lkdGg6IDFweDtcbiAgICBoZWlnaHQ6IDI4cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICB9XG5cbiAgLyogRS1TVE9QIHN0YW5kcyBhbG9uZTogc29saWQgcmVkLCBvbmUgbGluZSwgYWx3YXlzIGluIHRoZSBzYW1lIHBsYWNlLiAqL1xuICAuYXBwLWhlYWRlcl9fZXN0b3Age1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBoZWlnaHQ6IDQwcHg7XG4gICAgcGFkZGluZzogMCAxOHB4IDAgMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZXN0b3AsICNlMDI0MWYpO1xuICAgIGNvbG9yOiAjZmZmO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjA2ZW07XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kLWNvbG9yIHZhcigtLW0zZC1kdXJhdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZSk7XG5cbiAgICAmOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtZXN0b3AsICNlMDI0MWYpIDg2JSwgIzAwMCk7XG4gICAgfVxuXG4gICAgLy8gS2xpcHBlciBub3QgcmVhZHk6IHN0aWxsIHRoZSBFLVNUT1AsIGluIGl0cyBwbGFjZSwgYnV0IGEgdGludC5cbiAgICAmOmRpc2FibGVkIHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2QtZXN0b3AsICNlMDI0MWYpIDE2JSwgdHJhbnNwYXJlbnQpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xuICAgICAgY3Vyc29yOiBkZWZhdWx0O1xuICAgIH1cblxuICAgIC5mcmFtZS1pY29uIHtcbiAgICAgIHN0cm9rZS13aWR0aDogMi4yO1xuICAgIH1cbiAgfVxuXG4gIC5hcHAtaGVhZGVyX19lc3RvcC0tc21hbGwge1xuICAgIGhlaWdodDogMzZweDtcbiAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLy8gTmFycm93ZXIgd2luZG93cyBrZWVwIGV2ZXJ5IGNvbnRyb2wgYXQgZnVsbCBzaXplOiB0aGUgcHJpbnRlciBzd2l0Y2hcbiAgLy8gZ2l2ZXMgdXAgd2lkdGggZmlyc3QgKGl0cyBzdGF0dXMgbGluZSBoYXMgaXRzIG93biBlbGxpcHNpcyksIHRoZW4gdGhlXG4gIC8vIHdvcmRtYXJrIGdvZXMsIGFzIHRoZSByYWlsJ3MgZmlyc3QgaWNvbiBvcGVucyBldmVyeSBwcmludGVyIHRvby5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDEwMjNweCkge1xuICAgIC5hcHAtaGVhZGVyIDpkZWVwKC5wcmludGVyLXN3aXRjaF9fYnV0dG9uKSB7XG4gICAgICBtaW4td2lkdGg6IDAgIWltcG9ydGFudDtcbiAgICB9XG4gIH1cblxuICBAbWVkaWEgKG1heC13aWR0aDogODk5cHgpIHtcbiAgICAuYXBwLWhlYWRlcjpub3QoLmFwcC1oZWFkZXItLXBob25lKSAuYXBwLWhlYWRlcl9fYnJhbmQge1xuICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9sYXlvdXQvQXBwQmFyLnZ1ZSJ9