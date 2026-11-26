/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_24 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDataTable as __unplugin_components_23 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_22 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextField as __unplugin_components_21 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_20 from "/src/components/ui/AppColumnPicker.vue";
import { VSpacer as __unplugin_components_19 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VToolbar as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_17 from "/src/components/ui/AppBtn.vue";
import __unplugin_components_16 from "/src/components/ui/AppBtn.vue";
import { VSpacer as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_14 from "/src/components/ui/AppBtn.vue";
import { VSpacer as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_11 from "/src/components/ui/AppBtn.vue";
import { VListItemTitle as __unplugin_components_10 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemContent as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemIcon as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VIcon as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/AppBtn.vue";
import { VMenu as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppDialog.vue";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import DevGuardMixin from "/src/mixins/dev-guard.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import QRReader from "/src/components/widgets/spoolman/QRReader.vue";
import DevOnlyNote from "/src/components/widgets/toolhead/DevOnlyNote.vue";
import QrScanner from "/.vite-e2e/4291/deps/qr-scanner.js?v=9b9fafc7";
import getFilePaths from "/src/util/get-file-paths.ts";
import { printerHomePath } from "/src/services/printer-pages/index.ts";
let SpoolSelectionDialog = class extends Mixins(StateMixin, BrowserMixin, DevGuardMixin) {
  search = "";
  selectedSpoolId = null;
  cameraScanSource = null;
  hasDeviceCamera = false;
  async mounted() {
    this.hasDeviceCamera = await QrScanner.hasCamera();
  }
  onOpen() {
    if (this.open) {
      this.selectedSpoolId = this.$store.state.spoolman.activeSpool ?? null;
      if (this.targetMacro) {
        const macro = this.$store.getters["macros/getMacroByName"](this.targetMacro.toLowerCase());
        this.selectedSpoolId = macro?.variables.spool_id ?? null;
      }
      if (this.currentFileName) {
        if (!this.currentFile && this.currentFileName.includes("/")) {
          const { rootPath } = getFilePaths(this.currentFileName, "gcodes");
          SocketActions.serverFilesGetDirectory("gcodes", rootPath);
        } else {
          SocketActions.serverFilesMetadata(this.currentFileName);
        }
      }
      if (this.hasDeviceCamera && this.preferDeviceCamera) {
        this.$nextTick(() => this.cameraScanSource = "device");
      } else {
        const autoOpenCameraId = this.autoOpenQRDetectionCamera;
        if (this.$store.getters["webcams/getWebcamById"](autoOpenCameraId)) {
          this.$nextTick(() => this.cameraScanSource = autoOpenCameraId);
        }
      }
    }
  }
  get open() {
    return this.$store.state.spoolman.dialog.show;
  }
  set open(val) {
    this.$store.commit("spoolman/setDialogState", {
      ...this.$store.state.spoolman.dialog,
      show: val
    });
  }
  get availableSpools() {
    const spools = [];
    for (const spool of this.$store.state.spoolman.availableSpools) {
      if (spool.archived) {
        continue;
      }
      let filamentName = spool.filament.name;
      if (spool.filament.vendor) {
        filamentName = `${spool.filament.vendor.name} - ${filamentName}`;
      }
      spools.push({
        ...spool,
        filament_name: filamentName,
        material: spool.filament.material
      });
    }
    return spools;
  }
  get headers() {
    const headers = [
      "filament_name",
      "id",
      "material",
      "location",
      "comment",
      "last_used"
    ].map((value) => ({
      text: this.$tc(`app.spoolman.label.${value}`),
      value,
      configurable: value !== "filament_name"
    }));
    return this.$store.getters["config/getMergedTableHeaders"](headers, "spoolman");
  }
  get visibleHeaders() {
    return this.headers.filter((header) => header.visible || header.visible === void 0);
  }
  get selectedSpool() {
    return this.selectedSpoolId;
  }
  set selectedSpool(id) {
    this.selectedSpoolId = id;
  }
  get filename() {
    let filename = this.$store.state.spoolman.dialog.filename;
    if (!filename) {
      return;
    } else if (filename.startsWith("/")) {
      filename = filename.slice(1);
    }
    return filename;
  }
  get currentFileName() {
    return this.filename || this.$store.state.printer.printer.print_stats.filename;
  }
  get currentFile() {
    const { filename, rootPath } = getFilePaths(this.currentFileName, "gcodes");
    return this.$store.getters["files/getFile"](rootPath, filename);
  }
  get targetMacro() {
    return this.$store.state.spoolman.dialog.targetMacro;
  }
  get enabledWebcams() {
    return this.$store.getters["webcams/getEnabledWebcams"];
  }
  get availableCameras() {
    const cameras = this.enabledWebcams.filter((camera) => camera.service !== "iframe");
    if (this.hasDeviceCamera) {
      cameras.unshift({
        name: this.$t("app.spoolman.label.device_camera").toString(),
        uid: "device"
      });
    }
    return cameras;
  }
  get remainingFilamentUnit() {
    return this.$store.state.config.uiSettings.spoolman.remainingFilamentUnit;
  }
  handleQRCodeDetected(id) {
    this.cameraScanSource = null;
    this.selectedSpoolId = id;
    if (!this.availableSpools.filter((spool) => this.filterResults("", this.search, spool)).some((spool) => spool.id === id)) {
      this.search = "";
    }
    if (this.autoSelectSpoolOnMatch) {
      this.handleSelectSpool();
    }
  }
  /** Choosing a spool for a macro sets its variables, which is developer-mode only (Klipper#112). */
  get macroSelectLocked() {
    return !!this.targetMacro && this.devOnlyLocked;
  }
  async handleSelectSpool() {
    if (this.macroSelectLocked) return;
    if (!this.selectedSpool) {
      const confirmation = await this.$confirm(
        this.$tc("app.spoolman.msg.no_spool"),
        { title: "Print without a spool?", buttonTrueText: "Print without one", buttonFalseText: "Choose a spool" }
      );
      if (!confirmation) {
        return;
      }
    }
    if (this.targetMacro) {
      const commands = [
        `SET_GCODE_VARIABLE MACRO=${this.targetMacro} VARIABLE=spool_id VALUE=${this.selectedSpool ?? "None"}`
      ];
      const supportsSaveVariables = this.$store.getters["printer/getPrinterConfig"]("save_variables");
      if (supportsSaveVariables) {
        commands.push(`SAVE_VARIABLE VARIABLE=${this.targetMacro.toUpperCase()}__SPOOL_ID VALUE=${this.selectedSpool ?? "None"}`);
      }
      await SocketActions.printerGcodeScript(commands.join("\n"));
      const macro = this.$store.getters["macros/getMacroByName"](this.targetMacro.toLowerCase());
      if (macro?.variables.active) {
        await SocketActions.serverSpoolmanPostSpoolId(this.selectedSpool ?? void 0);
      }
      this.open = false;
      return;
    }
    const spool = this.availableSpools.find((spool2) => spool2.id === this.selectedSpool);
    if (spool && this.currentFileName && (this.warnOnFilamentTypeMismatch || this.warnOnNotEnoughFilament)) {
      if (this.currentFile && (this.filename || !["complete", "cancelled"].includes(this.printerState))) {
        if (this.warnOnFilamentTypeMismatch) {
          const fileMaterials = this.currentFile.filament_type?.toLowerCase().split(";").map((x) => x.replace(/"/g, ""));
          const spoolMaterial = spool.filament.material?.toLowerCase();
          if (spoolMaterial && fileMaterials && !fileMaterials.includes(spoolMaterial)) {
            const confirmation = await this.$confirm(
              this.$tc("app.spoolman.msg.mismatched_filament"),
              { title: "This spool isn't the file's material", buttonTrueText: "Use it anyway", buttonFalseText: "Choose another" }
            );
            if (!confirmation) {
              return;
            }
          }
        }
        let requiredLength = this.currentFile?.filament_total;
        if (requiredLength && ["printing", "paused"].includes(this.printerState)) {
          requiredLength -= this.$store.state.printer.printer.print_stats?.filament_used ?? 0;
          requiredLength = Math.max(requiredLength, 0);
        }
        if (!requiredLength) {
          const confirmation = await this.$confirm(
            this.$tc("app.spoolman.msg.no_required_length"),
            { title: "The file doesn't say how much it needs", buttonTrueText: "Use this spool", buttonFalseText: "Choose another" }
          );
          if (!confirmation) {
            return;
          }
        }
        if (this.warnOnNotEnoughFilament) {
          let remainingLength = spool.remaining_length;
          if (!remainingLength && spool.remaining_weight) {
            remainingLength = this.$filters.convertFilamentWeightToLength(spool.remaining_weight, spool.filament.density, spool.filament.diameter);
          }
          if (typeof remainingLength === "number" && requiredLength >= remainingLength) {
            const confirmation = await this.$confirm(
              this.$tc("app.spoolman.msg.no_filament"),
              { title: "This spool may run out", buttonTrueText: "Use it anyway", buttonFalseText: "Choose another" }
            );
            if (!confirmation) {
              return;
            }
          }
        }
      }
    }
    await SocketActions.serverSpoolmanPostSpoolId(this.selectedSpool ?? void 0);
    if (this.filename) {
      await SocketActions.printerPrintStart(this.filename);
      const home = printerHomePath();
      if (this.$router.currentRoute.path !== home) {
        this.$router.push({ path: home });
      }
    }
    this.open = false;
  }
  filterResults(value, query, item) {
    query = query.toLowerCase();
    return [item.id, item.comment, item.filament.name, item.filament.material, item.filament.vendor?.name].some((val) => val?.toString().toLowerCase().includes(query));
  }
  get spoolmanURL() {
    return this.$store.state.server.config.spoolman?.server;
  }
  get preferDeviceCamera() {
    return this.$store.state.config.uiSettings.spoolman.preferDeviceCamera;
  }
  get autoOpenQRDetectionCamera() {
    return this.$store.state.config.uiSettings.spoolman.autoOpenQRDetectionCamera;
  }
  get autoSelectSpoolOnMatch() {
    return this.$store.state.config.uiSettings.spoolman.autoSelectSpoolOnMatch;
  }
  get warnOnNotEnoughFilament() {
    return this.$store.state.config.uiSettings.spoolman.warnOnNotEnoughFilament;
  }
  get warnOnFilamentTypeMismatch() {
    return this.$store.state.config.uiSettings.spoolman.warnOnFilamentTypeMismatch;
  }
  get sortOrder() {
    return this.$store.state.config.uiSettings.spoolman.selectionDialogSortOrder;
  }
  handleSortOrderKeyChange(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.selectionDialogSortOrder.key",
      value: value ?? null,
      server: true
    });
  }
  handleSortOrderDescChange(value) {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.spoolman.selectionDialogSortOrder.desc",
      value: value ?? null,
      server: true
    });
  }
};
__decorateClass([
  Watch("open")
], SpoolSelectionDialog.prototype, "onOpen", 1);
SpoolSelectionDialog = __decorateClass([
  Component({
    components: { QRReader, DevOnlyNote }
  })
], SpoolSelectionDialog);
const _sfc_main = SpoolSelectionDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "scrollable": "", "max-width": _vm.isMobileViewport ? "90vw" : "75vw", "title": _vm.$tc("app.spoolman.title.spool_selection", _vm.targetMacro ? 2 : 1, { macro: _vm.targetMacro }), "title-shadow": "" }, scopedSlots: _vm._u([{ key: "menu", fn: function() {
    return [_vm.availableCameras.length > 1 ? _c(__unplugin_components_1, { attrs: { "left": "", "offset-y": "", "transition": "slide-y-transition" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs, value }) {
      return [_c(__unplugin_components_2, _vm._g(_vm._b({ staticClass: "ms-1 my-1", attrs: { "small": "" } }, "app-btn", attrs, false), on), [_c(__unplugin_components_3, { staticClass: "mr-1", attrs: { "small": "" } }, [_vm._v(" $camera ")]), _vm._v(" " + _vm._s(_vm.$t("app.spoolman.btn.scan_code")) + " "), _c(__unplugin_components_4, { staticClass: "ml-1", class: { "rotate-180": value }, attrs: { "small": "" } }, [_vm._v(" $chevronDown ")])], 1)];
    } }], null, false, 1046628065) }, [_c(__unplugin_components_5, { attrs: { "dense": "" } }, _vm._l(_vm.availableCameras, function(camera) {
      return _c(__unplugin_components_6, { key: camera.uid, on: { "click": function($event) {
        _vm.cameraScanSource = camera.uid;
      } } }, [_c(__unplugin_components_7, [_c(__unplugin_components_8, [_vm._v(" $camera ")])], 1), _c(__unplugin_components_9, [_c(__unplugin_components_10, [_vm._v(" " + _vm._s(camera.name) + " ")])], 1)], 1);
    }), 1)], 1) : _vm.availableCameras.length ? _c(__unplugin_components_11, { staticClass: "ms-1 my-1", attrs: { "small": "" }, on: { "click": function($event) {
      _vm.cameraScanSource = _vm.availableCameras[0].uid;
    } } }, [_c(__unplugin_components_12, { staticClass: "mr-1", attrs: { "small": "" } }, [_vm._v(" $camera ")]), _vm._v(" " + _vm._s(_vm.$t("app.spoolman.btn.scan_code")) + " ")], 1) : _vm._e()];
  }, proxy: true }, { key: "actions", fn: function() {
    return [_vm.isMobileViewport ? _c(__unplugin_components_13) : _vm._e(), _vm.spoolmanURL ? _c(__unplugin_components_14, { attrs: { "href": _vm.spoolmanURL, "target": "_blank", "color": "primary", "text": "", "type": "button" } }, [_vm._v(" " + _vm._s(_vm.$t("app.spoolman.btn.manage_spools")) + " ")]) : _vm._e(), !_vm.isMobileViewport ? _c(__unplugin_components_15) : _vm._e(), _c(__unplugin_components_16, { attrs: { "text": "", "color": "warning" }, on: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _vm.macroSelectLocked ? _c("dev-only-note") : _vm._e(), _c(__unplugin_components_17, { attrs: { "color": "primary", "disabled": _vm.macroSelectLocked }, on: { "click": _vm.handleSelectSpool } }, [_vm._v(" " + _vm._s(_vm.filename ? _vm.$t("app.general.btn.print") : _vm.$tc("app.spoolman.btn.select", _vm.targetMacro ? 2 : 1, { macro: _vm.targetMacro })) + " ")])];
  }, proxy: true }]), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_18, { attrs: { "dense": "" } }, [_c(__unplugin_components_19), _c(__unplugin_components_20, { attrs: { "key-name": "spoolman", "headers": _vm.headers } }), _c(__unplugin_components_21, { staticClass: "ml-1", staticStyle: { "max-width": "360px" }, attrs: { "outlined": "", "dense": "", "single-line": "", "hide-details": "", "append-icon": "$magnify" }, model: { value: _vm.search, callback: function($$v) {
    _vm.search = $$v;
  }, expression: "search" } })], 1), _c(__unplugin_components_22, { staticClass: "fill-height pt-0" }, [_c(__unplugin_components_23, { staticClass: "spool-table", attrs: { "items": _vm.availableSpools, "headers": _vm.visibleHeaders, "search": _vm.search, "custom-filter": _vm.filterResults, "no-data-text": _vm.$t("app.file_system.msg.not_found"), "no-results-text": _vm.$t("app.file_system.msg.not_found"), "sort-by": _vm.sortOrder.key ?? void 0, "sort-desc": _vm.sortOrder.desc ?? void 0, "mobile-breakpoint": "0", "hide-default-footer": "", "disable-pagination": "" }, on: { "update:sort-by": _vm.handleSortOrderKeyChange, "update:sort-desc": _vm.handleSortOrderDescChange }, scopedSlots: _vm._u([{ key: "item", fn: function({ item }) {
    return [_c("tr", { staticClass: "row-select px-1", class: { "v-data-table__selected": item.id === _vm.selectedSpool }, on: { "click": function($event) {
      $event.preventDefault();
      _vm.selectedSpool = _vm.selectedSpool === item.id ? null : item.id;
    } } }, [_c("td", [_c("div", { staticClass: "d-flex" }, [_c(__unplugin_components_24, { staticClass: "mr-4 flex-column spool-icon", attrs: { "color": `#${item.filament.color_hex ?? (_vm.$vuetify.theme.dark ? "fff" : "000")}`, "size": "42px" } }, [_vm._v(" " + _vm._s(item.id === _vm.selectedSpool ? "$markedCircle" : "$filament") + " ")]), _c("div", { staticClass: "flex-column" }, [_c("div", { staticClass: "flex-row" }, [_vm._v(" " + _vm._s(item.filament_name) + " ")]), _c("div", { staticClass: "flex-row" }, [_vm.remainingFilamentUnit === "weight" ? _c("small", [_c("b", [_vm._v(_vm._s(_vm.$filters.getReadableWeightString(item.remaining_weight)))]), _vm._v(" / " + _vm._s(_vm.$filters.getReadableWeightString(item.filament.weight)) + " ")]) : _vm.remainingFilamentUnit === "length" ? _c("small", [_c("b", [_vm._v(_vm._s(_vm.$filters.getReadableLengthString(item.remaining_length)))]), _vm._v(" / " + _vm._s(_vm.$filters.getReadableLengthString(_vm.$filters.convertFilamentWeightToLength(item.filament.weight ?? 0, item.filament.density, item.filament.diameter))) + " ")]) : _vm._e()])])], 1)]), _vm._l(_vm.visibleHeaders.filter((h) => h.value !== "filament_name"), function(header) {
      return _c("td", { key: header.value }, [header.value === "last_used" ? [_vm._v(" " + _vm._s(item[header.value] ? _vm.$filters.formatRelativeTimeToNow(item[header.value]) : _vm.$tc("app.setting.label.never")) + " ")] : [_vm._v(" " + _vm._s(item[header.value]) + " ")]], 2);
    })], 2)];
  } }]) })], 1), _vm.cameraScanSource ? _c("QRReader", { on: { "detected": _vm.handleQRCodeDetected }, model: { value: _vm.cameraScanSource, callback: function($$v) {
    _vm.cameraScanSource = $$v;
  }, expression: "cameraScanSource" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/spoolman/SpoolSelectionDialog.vue?vue&type=style&index=0&scoped=c695ee52&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "c695ee52",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/spoolman/SpoolSelectionDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwTUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFLQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBRUE7QUFFQTtBQUdBO0FBQ0E7QUFBQSxRQUNBO0FBRUE7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFFQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSx3Q0FDQTtBQUVBO0FBRUE7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0EsUUFDQSxzQkFDQSw4REFDQSxrQ0FDQTtBQUVBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBR0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFFQTtBQUlBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFFQTtBQUNBO0FBRUE7QUFBQSxNQUNBO0FBRUE7QUFFQTtBQUNBO0FBRUE7QUFBQSxNQUNBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFFQSw2Q0FBQUEsa0JBQUE7QUFDQTtBQUlBO0FBR0E7QUFDQSw4RUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFDQTtBQUVBO0FBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUFBLFFBQ0E7QUFFQTtBQUdBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNBO0FBRUE7QUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxVQUNBO0FBRUE7QUFHQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFDQTtBQUVBO0FBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0EsMkdBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQS9VQTtBQUFBLEVBREE7QUFBQSxHQVpBLHFCQWFBO0FBYkE7QUFBQSxFQUhBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOlsic3Bvb2wiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiU3Bvb2xTZWxlY3Rpb25EaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGFwcC1kaWFsb2dcbiAgICB2LW1vZGVsPVwib3BlblwiXG4gICAgc2Nyb2xsYWJsZVxuICAgIDptYXgtd2lkdGg9XCJpc01vYmlsZVZpZXdwb3J0ID8gJzkwdncnIDogJzc1dncnXCJcbiAgICA6dGl0bGU9XCIkdGMoJ2FwcC5zcG9vbG1hbi50aXRsZS5zcG9vbF9zZWxlY3Rpb24nLCB0YXJnZXRNYWNybyA/IDIgOiAxLCB7IG1hY3JvOiB0YXJnZXRNYWNybyB9KVwiXG4gICAgdGl0bGUtc2hhZG93XG4gID5cbiAgICA8dGVtcGxhdGUgI21lbnU+XG4gICAgICA8di1tZW51XG4gICAgICAgIHYtaWY9XCJhdmFpbGFibGVDYW1lcmFzLmxlbmd0aCA+IDFcIlxuICAgICAgICBsZWZ0XG4gICAgICAgIG9mZnNldC15XG4gICAgICAgIHRyYW5zaXRpb249XCJzbGlkZS15LXRyYW5zaXRpb25cIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2FjdGl2YXRvcj1cInsgb24sIGF0dHJzLCB2YWx1ZSB9XCI+XG4gICAgICAgICAgPGFwcC1idG5cbiAgICAgICAgICAgIHYtYmluZD1cImF0dHJzXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgICBjbGFzcz1cIm1zLTEgbXktMVwiXG4gICAgICAgICAgICB2LW9uPVwib25cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDx2LWljb25cbiAgICAgICAgICAgICAgY2xhc3M9XCJtci0xXCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgJGNhbWVyYVxuICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgICB7eyAkdCgnYXBwLnNwb29sbWFuLmJ0bi5zY2FuX2NvZGUnKSB9fVxuICAgICAgICAgICAgPHYtaWNvblxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICBjbGFzcz1cIm1sLTFcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdyb3RhdGUtMTgwJzogdmFsdWUgfVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICRjaGV2cm9uRG93blxuICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8di1saXN0IGRlbnNlPlxuICAgICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgICAgdi1mb3I9XCJjYW1lcmEgaW4gYXZhaWxhYmxlQ2FtZXJhc1wiXG4gICAgICAgICAgICA6a2V5PVwiY2FtZXJhLnVpZFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJjYW1lcmFTY2FuU291cmNlID0gY2FtZXJhLnVpZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHYtbGlzdC1pdGVtLWljb24+XG4gICAgICAgICAgICAgIDx2LWljb24+XG4gICAgICAgICAgICAgICAgJGNhbWVyYVxuICAgICAgICAgICAgICA8L3YtaWNvbj5cbiAgICAgICAgICAgIDwvdi1saXN0LWl0ZW0taWNvbj5cbiAgICAgICAgICAgIDx2LWxpc3QtaXRlbS1jb250ZW50PlxuICAgICAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgICAgICAgICAge3sgY2FtZXJhLm5hbWUgfX1cbiAgICAgICAgICAgICAgPC92LWxpc3QtaXRlbS10aXRsZT5cbiAgICAgICAgICAgIDwvdi1saXN0LWl0ZW0tY29udGVudD5cbiAgICAgICAgICA8L3YtbGlzdC1pdGVtPlxuICAgICAgICA8L3YtbGlzdD5cbiAgICAgIDwvdi1tZW51PlxuXG4gICAgICA8YXBwLWJ0blxuICAgICAgICB2LWVsc2UtaWY9XCJhdmFpbGFibGVDYW1lcmFzLmxlbmd0aFwiXG4gICAgICAgIHNtYWxsXG4gICAgICAgIGNsYXNzPVwibXMtMSBteS0xXCJcbiAgICAgICAgQGNsaWNrPVwiY2FtZXJhU2NhblNvdXJjZSA9IGF2YWlsYWJsZUNhbWVyYXNbMF0udWlkXCJcbiAgICAgID5cbiAgICAgICAgPHYtaWNvblxuICAgICAgICAgIGNsYXNzPVwibXItMVwiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgPlxuICAgICAgICAgICRjYW1lcmFcbiAgICAgICAgPC92LWljb24+XG4gICAgICAgIHt7ICR0KCdhcHAuc3Bvb2xtYW4uYnRuLnNjYW5fY29kZScpIH19XG4gICAgICA8L2FwcC1idG4+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDx2LXRvb2xiYXIgZGVuc2U+XG4gICAgICA8di1zcGFjZXIgLz5cblxuICAgICAgPGFwcC1jb2x1bW4tcGlja2VyXG4gICAgICAgIGtleS1uYW1lPVwic3Bvb2xtYW5cIlxuICAgICAgICA6aGVhZGVycz1cImhlYWRlcnNcIlxuICAgICAgLz5cblxuICAgICAgPHYtdGV4dC1maWVsZFxuICAgICAgICB2LW1vZGVsPVwic2VhcmNoXCJcbiAgICAgICAgb3V0bGluZWRcbiAgICAgICAgZGVuc2VcbiAgICAgICAgc2luZ2xlLWxpbmVcbiAgICAgICAgaGlkZS1kZXRhaWxzXG4gICAgICAgIGFwcGVuZC1pY29uPVwiJG1hZ25pZnlcIlxuICAgICAgICBzdHlsZT1cIm1heC13aWR0aDogMzYwcHhcIlxuICAgICAgICBjbGFzcz1cIm1sLTFcIlxuICAgICAgLz5cbiAgICA8L3YtdG9vbGJhcj5cblxuICAgIDx2LWNhcmQtdGV4dCBjbGFzcz1cImZpbGwtaGVpZ2h0IHB0LTBcIj5cbiAgICAgIDx2LWRhdGEtdGFibGVcbiAgICAgICAgOml0ZW1zPVwiYXZhaWxhYmxlU3Bvb2xzXCJcbiAgICAgICAgOmhlYWRlcnM9XCJ2aXNpYmxlSGVhZGVyc1wiXG4gICAgICAgIDpzZWFyY2g9XCJzZWFyY2hcIlxuICAgICAgICA6Y3VzdG9tLWZpbHRlcj1cImZpbHRlclJlc3VsdHNcIlxuICAgICAgICA6bm8tZGF0YS10ZXh0PVwiJHQoJ2FwcC5maWxlX3N5c3RlbS5tc2cubm90X2ZvdW5kJylcIlxuICAgICAgICA6bm8tcmVzdWx0cy10ZXh0PVwiJHQoJ2FwcC5maWxlX3N5c3RlbS5tc2cubm90X2ZvdW5kJylcIlxuICAgICAgICA6c29ydC1ieT1cInNvcnRPcmRlci5rZXkgPz8gdW5kZWZpbmVkXCJcbiAgICAgICAgOnNvcnQtZGVzYz1cInNvcnRPcmRlci5kZXNjID8/IHVuZGVmaW5lZFwiXG4gICAgICAgIG1vYmlsZS1icmVha3BvaW50PVwiMFwiXG4gICAgICAgIGNsYXNzPVwic3Bvb2wtdGFibGVcIlxuICAgICAgICBoaWRlLWRlZmF1bHQtZm9vdGVyXG4gICAgICAgIGRpc2FibGUtcGFnaW5hdGlvblxuICAgICAgICBAdXBkYXRlOnNvcnQtYnk9XCJoYW5kbGVTb3J0T3JkZXJLZXlDaGFuZ2VcIlxuICAgICAgICBAdXBkYXRlOnNvcnQtZGVzYz1cImhhbmRsZVNvcnRPcmRlckRlc2NDaGFuZ2VcIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2l0ZW09XCJ7IGl0ZW0gfVwiPlxuICAgICAgICAgIDx0clxuICAgICAgICAgICAgOmNsYXNzPVwieyAndi1kYXRhLXRhYmxlX19zZWxlY3RlZCc6IChpdGVtLmlkID09PSBzZWxlY3RlZFNwb29sKSB9XCJcbiAgICAgICAgICAgIGNsYXNzPVwicm93LXNlbGVjdCBweC0xXCJcbiAgICAgICAgICAgIEBjbGljay5wcmV2ZW50PVwic2VsZWN0ZWRTcG9vbCA9IHNlbGVjdGVkU3Bvb2wgPT09IGl0ZW0uaWQgPyBudWxsIDogaXRlbS5pZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHRkPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4XCI+XG4gICAgICAgICAgICAgICAgPHYtaWNvblxuICAgICAgICAgICAgICAgICAgOmNvbG9yPVwiYCMke2l0ZW0uZmlsYW1lbnQuY29sb3JfaGV4ID8/ICgkdnVldGlmeS50aGVtZS5kYXJrID8gJ2ZmZicgOiAnMDAwJyl9YFwiXG4gICAgICAgICAgICAgICAgICBzaXplPVwiNDJweFwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cIm1yLTQgZmxleC1jb2x1bW4gc3Bvb2wtaWNvblwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3sgaXRlbS5pZCA9PT0gc2VsZWN0ZWRTcG9vbCA/ICckbWFya2VkQ2lyY2xlJyA6ICckZmlsYW1lbnQnIH19XG4gICAgICAgICAgICAgICAgPC92LWljb24+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtY29sdW1uXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1yb3dcIj5cbiAgICAgICAgICAgICAgICAgICAge3sgaXRlbS5maWxhbWVudF9uYW1lIH19XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICA8c21hbGwgdi1pZj1cInJlbWFpbmluZ0ZpbGFtZW50VW5pdCA9PT0gJ3dlaWdodCdcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8Yj57eyAkZmlsdGVycy5nZXRSZWFkYWJsZVdlaWdodFN0cmluZyhpdGVtLnJlbWFpbmluZ193ZWlnaHQpIH19PC9iPlxuICAgICAgICAgICAgICAgICAgICAgIC8ge3sgJGZpbHRlcnMuZ2V0UmVhZGFibGVXZWlnaHRTdHJpbmcoaXRlbS5maWxhbWVudC53ZWlnaHQpIH19XG4gICAgICAgICAgICAgICAgICAgIDwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgIDxzbWFsbCB2LWVsc2UtaWY9XCJyZW1haW5pbmdGaWxhbWVudFVuaXQgPT09ICdsZW5ndGgnXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGI+e3sgJGZpbHRlcnMuZ2V0UmVhZGFibGVMZW5ndGhTdHJpbmcoaXRlbS5yZW1haW5pbmdfbGVuZ3RoKSB9fTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAvIHt7ICRmaWx0ZXJzLmdldFJlYWRhYmxlTGVuZ3RoU3RyaW5nKCRmaWx0ZXJzLmNvbnZlcnRGaWxhbWVudFdlaWdodFRvTGVuZ3RoKGl0ZW0uZmlsYW1lbnQud2VpZ2h0ID8/IDAsIGl0ZW0uZmlsYW1lbnQuZGVuc2l0eSwgaXRlbS5maWxhbWVudC5kaWFtZXRlcikpIH19XG4gICAgICAgICAgICAgICAgICAgIDwvc21hbGw+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPHRkXG4gICAgICAgICAgICAgIHYtZm9yPVwiaGVhZGVyIGluIHZpc2libGVIZWFkZXJzLmZpbHRlcihoID0+IGgudmFsdWUgIT09ICdmaWxhbWVudF9uYW1lJylcIlxuICAgICAgICAgICAgICA6a2V5PVwiaGVhZGVyLnZhbHVlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCJoZWFkZXIudmFsdWUgPT09ICdsYXN0X3VzZWQnXCI+XG4gICAgICAgICAgICAgICAge3sgaXRlbVtoZWFkZXIudmFsdWVdID8gJGZpbHRlcnMuZm9ybWF0UmVsYXRpdmVUaW1lVG9Ob3coaXRlbVtoZWFkZXIudmFsdWVdKSA6ICR0YygnYXBwLnNldHRpbmcubGFiZWwubmV2ZXInKSB9fVxuICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgICAgICAgICAge3sgaXRlbVtoZWFkZXIudmFsdWVdIH19XG4gICAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgICA8L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L3YtZGF0YS10YWJsZT5cbiAgICA8L3YtY2FyZC10ZXh0PlxuXG4gICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgPHYtc3BhY2VyIHYtaWY9XCJpc01vYmlsZVZpZXdwb3J0XCIgLz5cblxuICAgICAgPGFwcC1idG5cbiAgICAgICAgdi1pZj1cInNwb29sbWFuVVJMXCJcbiAgICAgICAgOmhyZWY9XCJzcG9vbG1hblVSTFwiXG4gICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgIGNvbG9yPVwicHJpbWFyeVwiXG4gICAgICAgIHRleHRcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICA+XG4gICAgICAgIHt7ICR0KCdhcHAuc3Bvb2xtYW4uYnRuLm1hbmFnZV9zcG9vbHMnKSB9fVxuICAgICAgPC9hcHAtYnRuPlxuXG4gICAgICA8di1zcGFjZXIgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCIgLz5cblxuICAgICAgPGFwcC1idG5cbiAgICAgICAgdGV4dFxuICAgICAgICBjb2xvcj1cIndhcm5pbmdcIlxuICAgICAgICBAY2xpY2s9XCJvcGVuID0gZmFsc2VcIlxuICAgICAgPlxuICAgICAgICB7eyAkdCgnYXBwLmdlbmVyYWwuYnRuLmNhbmNlbCcpIH19XG4gICAgICA8L2FwcC1idG4+XG4gICAgICA8ZGV2LW9ubHktbm90ZSB2LWlmPVwibWFjcm9TZWxlY3RMb2NrZWRcIiAvPlxuICAgICAgPGFwcC1idG5cbiAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgOmRpc2FibGVkPVwibWFjcm9TZWxlY3RMb2NrZWRcIlxuICAgICAgICBAY2xpY2s9XCJoYW5kbGVTZWxlY3RTcG9vbFwiXG4gICAgICA+XG4gICAgICAgIHt7IGZpbGVuYW1lID8gJHQoJ2FwcC5nZW5lcmFsLmJ0bi5wcmludCcpIDogJHRjKCdhcHAuc3Bvb2xtYW4uYnRuLnNlbGVjdCcsIHRhcmdldE1hY3JvID8gMiA6IDEsIHsgbWFjcm86IHRhcmdldE1hY3JvIH0pIH19XG4gICAgICA8L2FwcC1idG4+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDxRUlJlYWRlclxuICAgICAgdi1pZj1cImNhbWVyYVNjYW5Tb3VyY2VcIlxuICAgICAgdi1tb2RlbD1cImNhbWVyYVNjYW5Tb3VyY2VcIlxuICAgICAgQGRldGVjdGVkPVwiaGFuZGxlUVJDb2RlRGV0ZWN0ZWRcIlxuICAgIC8+XG4gIDwvYXBwLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IFN0YXRlTWl4aW4gZnJvbSAnQC9taXhpbnMvc3RhdGUnXG5pbXBvcnQgRGV2R3VhcmRNaXhpbiBmcm9tICdAL21peGlucy9kZXYtZ3VhcmQnXG5pbXBvcnQgeyBTb2NrZXRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvc29ja2V0QWN0aW9ucydcbmltcG9ydCB0eXBlIHsgTWFjcm9XaXRoU3Bvb2xJZCwgU3Bvb2wgfSBmcm9tICdAL3N0b3JlL3Nwb29sbWFuL3R5cGVzJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IFFSUmVhZGVyIGZyb20gJ0AvY29tcG9uZW50cy93aWRnZXRzL3Nwb29sbWFuL1FSUmVhZGVyLnZ1ZSdcbmltcG9ydCBEZXZPbmx5Tm90ZSBmcm9tICdAL2NvbXBvbmVudHMvd2lkZ2V0cy90b29saGVhZC9EZXZPbmx5Tm90ZS52dWUnXG5pbXBvcnQgdHlwZSB7IFdlYmNhbUNvbmZpZyB9IGZyb20gJ0Avc3RvcmUvd2ViY2Ftcy90eXBlcydcbmltcG9ydCBRclNjYW5uZXIgZnJvbSAncXItc2Nhbm5lcidcbmltcG9ydCB0eXBlIHsgQXBwVGFibGVIZWFkZXIgfSBmcm9tICdAL3R5cGVzJ1xuaW1wb3J0IGdldEZpbGVQYXRocyBmcm9tICdAL3V0aWwvZ2V0LWZpbGUtcGF0aHMnXG5pbXBvcnQgeyBwcmludGVySG9tZVBhdGggfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7IFFSUmVhZGVyLCBEZXZPbmx5Tm90ZSB9XG59KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3Bvb2xTZWxlY3Rpb25EaWFsb2cgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbiwgQnJvd3Nlck1peGluLCBEZXZHdWFyZE1peGluKSB7XG4gIHNlYXJjaCA9ICcnXG4gIHNlbGVjdGVkU3Bvb2xJZDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuICBjYW1lcmFTY2FuU291cmNlOiBudWxsIHwgc3RyaW5nID0gbnVsbFxuXG4gIGhhc0RldmljZUNhbWVyYSA9IGZhbHNlXG5cbiAgYXN5bmMgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5oYXNEZXZpY2VDYW1lcmEgPSBhd2FpdCBRclNjYW5uZXIuaGFzQ2FtZXJhKClcbiAgfVxuXG4gIEBXYXRjaCgnb3BlbicpXG4gIG9uT3BlbiAoKSB7XG4gICAgaWYgKHRoaXMub3Blbikge1xuICAgICAgdGhpcy5zZWxlY3RlZFNwb29sSWQgPSB0aGlzLiRzdG9yZS5zdGF0ZS5zcG9vbG1hbi5hY3RpdmVTcG9vbCA/PyBudWxsXG4gICAgICBpZiAodGhpcy50YXJnZXRNYWNybykge1xuICAgICAgICBjb25zdCBtYWNybzogTWFjcm9XaXRoU3Bvb2xJZCB8IHVuZGVmaW5lZCA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ21hY3Jvcy9nZXRNYWNyb0J5TmFtZSddKHRoaXMudGFyZ2V0TWFjcm8udG9Mb3dlckNhc2UoKSlcbiAgICAgICAgdGhpcy5zZWxlY3RlZFNwb29sSWQgPSBtYWNybz8udmFyaWFibGVzLnNwb29sX2lkID8/IG51bGxcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY3VycmVudEZpbGVOYW1lKSB7XG4gICAgICAgIC8vIHByZWZldGNoIGZpbGUgbWV0YWRhdGFcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRGaWxlICYmIHRoaXMuY3VycmVudEZpbGVOYW1lLmluY2x1ZGVzKCcvJykpIHtcbiAgICAgICAgICAvLyBpZiB0aGUgZmlsZSBpcyBpbiBhIHN1YmRpcmVjdG9yeSBhbmQgaXNuJ3QgY2FjaGVkXG4gICAgICAgICAgLy8gd2UgbmVlZCB0byBwb3B1bGF0ZSB0aGUgY2FjaGVcbiAgICAgICAgICBjb25zdCB7IHJvb3RQYXRoIH0gPSBnZXRGaWxlUGF0aHModGhpcy5jdXJyZW50RmlsZU5hbWUsICdnY29kZXMnKVxuICAgICAgICAgIFNvY2tldEFjdGlvbnMuc2VydmVyRmlsZXNHZXREaXJlY3RvcnkoJ2djb2RlcycsIHJvb3RQYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG90aGVyd2lzZSBqdXN0IHJlZnJlc2ggdGhlIGNvcnJlc3BvbmRpbmcgZmlsZVxuICAgICAgICAgIFNvY2tldEFjdGlvbnMuc2VydmVyRmlsZXNNZXRhZGF0YSh0aGlzLmN1cnJlbnRGaWxlTmFtZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5oYXNEZXZpY2VDYW1lcmEgJiYgdGhpcy5wcmVmZXJEZXZpY2VDYW1lcmEpIHtcbiAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gKHRoaXMuY2FtZXJhU2NhblNvdXJjZSA9ICdkZXZpY2UnKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGF1dG9PcGVuQ2FtZXJhSWQgPSB0aGlzLmF1dG9PcGVuUVJEZXRlY3Rpb25DYW1lcmFcbiAgICAgICAgaWYgKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3dlYmNhbXMvZ2V0V2ViY2FtQnlJZCddKGF1dG9PcGVuQ2FtZXJhSWQpKSB7XG4gICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4gKHRoaXMuY2FtZXJhU2NhblNvdXJjZSA9IGF1dG9PcGVuQ2FtZXJhSWQpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IG9wZW4gKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5zcG9vbG1hbi5kaWFsb2cuc2hvd1xuICB9XG5cbiAgc2V0IG9wZW4gKHZhbDogYm9vbGVhbikge1xuICAgIHRoaXMuJHN0b3JlLmNvbW1pdCgnc3Bvb2xtYW4vc2V0RGlhbG9nU3RhdGUnLCB7XG4gICAgICAuLi50aGlzLiRzdG9yZS5zdGF0ZS5zcG9vbG1hbi5kaWFsb2csXG4gICAgICBzaG93OiB2YWxcbiAgICB9KVxuICB9XG5cbiAgZ2V0IGF2YWlsYWJsZVNwb29scyAoKTogU3Bvb2xbXSB7XG4gICAgY29uc3Qgc3Bvb2xzID0gW11cbiAgICBmb3IgKGNvbnN0IHNwb29sIG9mIHRoaXMuJHN0b3JlLnN0YXRlLnNwb29sbWFuLmF2YWlsYWJsZVNwb29scykge1xuICAgICAgaWYgKHNwb29sLmFyY2hpdmVkKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGxldCBmaWxhbWVudE5hbWUgPSBzcG9vbC5maWxhbWVudC5uYW1lXG4gICAgICBpZiAoc3Bvb2wuZmlsYW1lbnQudmVuZG9yKSB7XG4gICAgICAgIGZpbGFtZW50TmFtZSA9IGAke3Nwb29sLmZpbGFtZW50LnZlbmRvci5uYW1lfSAtICR7ZmlsYW1lbnROYW1lfWBcbiAgICAgIH1cblxuICAgICAgc3Bvb2xzLnB1c2goe1xuICAgICAgICAuLi5zcG9vbCxcbiAgICAgICAgZmlsYW1lbnRfbmFtZTogZmlsYW1lbnROYW1lLFxuICAgICAgICBtYXRlcmlhbDogc3Bvb2wuZmlsYW1lbnQubWF0ZXJpYWxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHNwb29sc1xuICB9XG5cbiAgZ2V0IGhlYWRlcnMgKCk6IEFwcFRhYmxlSGVhZGVyW10ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBbXG4gICAgICAnZmlsYW1lbnRfbmFtZScsXG4gICAgICAnaWQnLFxuICAgICAgJ21hdGVyaWFsJyxcbiAgICAgICdsb2NhdGlvbicsXG4gICAgICAnY29tbWVudCcsXG4gICAgICAnbGFzdF91c2VkJ1xuICAgIF0ubWFwKCh2YWx1ZSkgPT4gKHtcbiAgICAgIHRleHQ6IHRoaXMuJHRjKGBhcHAuc3Bvb2xtYW4ubGFiZWwuJHt2YWx1ZX1gKSxcbiAgICAgIHZhbHVlLFxuICAgICAgY29uZmlndXJhYmxlOiB2YWx1ZSAhPT0gJ2ZpbGFtZW50X25hbWUnXG4gICAgfSkpXG5cbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldE1lcmdlZFRhYmxlSGVhZGVycyddKGhlYWRlcnMsICdzcG9vbG1hbicpXG4gIH1cblxuICBnZXQgdmlzaWJsZUhlYWRlcnMgKCk6IEFwcFRhYmxlSGVhZGVyW10ge1xuICAgIHJldHVybiB0aGlzLmhlYWRlcnMuZmlsdGVyKGhlYWRlciA9PiBoZWFkZXIudmlzaWJsZSB8fCBoZWFkZXIudmlzaWJsZSA9PT0gdW5kZWZpbmVkKVxuICB9XG5cbiAgZ2V0IHNlbGVjdGVkU3Bvb2wgKCkge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGVkU3Bvb2xJZFxuICB9XG5cbiAgc2V0IHNlbGVjdGVkU3Bvb2wgKGlkOiBudW1iZXIgfCBudWxsKSB7XG4gICAgdGhpcy5zZWxlY3RlZFNwb29sSWQgPSBpZFxuICB9XG5cbiAgZ2V0IGZpbGVuYW1lICgpIHtcbiAgICBsZXQgZmlsZW5hbWUgPSB0aGlzLiRzdG9yZS5zdGF0ZS5zcG9vbG1hbi5kaWFsb2cuZmlsZW5hbWVcblxuICAgIGlmICghZmlsZW5hbWUpIHtcbiAgICAgIHJldHVyblxuICAgIH0gZWxzZSBpZiAoZmlsZW5hbWUuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICBmaWxlbmFtZSA9IGZpbGVuYW1lLnNsaWNlKDEpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGVuYW1lXG4gIH1cblxuICBnZXQgY3VycmVudEZpbGVOYW1lICgpIHtcbiAgICByZXR1cm4gdGhpcy5maWxlbmFtZSB8fCB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIucHJpbnRfc3RhdHMuZmlsZW5hbWVcbiAgfVxuXG4gIGdldCBjdXJyZW50RmlsZSAoKSB7XG4gICAgY29uc3QgeyBmaWxlbmFtZSwgcm9vdFBhdGggfSA9IGdldEZpbGVQYXRocyh0aGlzLmN1cnJlbnRGaWxlTmFtZSwgJ2djb2RlcycpXG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ2ZpbGVzL2dldEZpbGUnXShyb290UGF0aCwgZmlsZW5hbWUpXG4gIH1cblxuICBnZXQgdGFyZ2V0TWFjcm8gKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnNwb29sbWFuLmRpYWxvZy50YXJnZXRNYWNyb1xuICB9XG5cbiAgZ2V0IGVuYWJsZWRXZWJjYW1zICgpOiBXZWJjYW1Db25maWdbXSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3dlYmNhbXMvZ2V0RW5hYmxlZFdlYmNhbXMnXSBhcyBXZWJjYW1Db25maWdbXVxuICB9XG5cbiAgZ2V0IGF2YWlsYWJsZUNhbWVyYXMgKCk6IFBpY2s8V2ViY2FtQ29uZmlnLCAndWlkJyB8ICduYW1lJz5bXSB7XG4gICAgY29uc3QgY2FtZXJhczogUGljazxXZWJjYW1Db25maWcsICd1aWQnIHwgJ25hbWUnPltdID0gdGhpcy5lbmFibGVkV2ViY2Ftc1xuICAgICAgLmZpbHRlcihjYW1lcmEgPT4gY2FtZXJhLnNlcnZpY2UgIT09ICdpZnJhbWUnKVxuXG4gICAgaWYgKHRoaXMuaGFzRGV2aWNlQ2FtZXJhKSB7XG4gICAgICAvLyBhbHdheXMgc2hvdyBkZXZpY2UgY2FtZXJhIGZpcnN0XG4gICAgICBjYW1lcmFzLnVuc2hpZnQoe1xuICAgICAgICBuYW1lOiB0aGlzLiR0KCdhcHAuc3Bvb2xtYW4ubGFiZWwuZGV2aWNlX2NhbWVyYScpLnRvU3RyaW5nKCksXG4gICAgICAgIHVpZDogJ2RldmljZSdcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbWVyYXNcbiAgfVxuXG4gIGdldCByZW1haW5pbmdGaWxhbWVudFVuaXQgKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5zcG9vbG1hbi5yZW1haW5pbmdGaWxhbWVudFVuaXRcbiAgfVxuXG4gIGhhbmRsZVFSQ29kZURldGVjdGVkIChpZDogbnVtYmVyKSB7XG4gICAgdGhpcy5jYW1lcmFTY2FuU291cmNlID0gbnVsbFxuICAgIHRoaXMuc2VsZWN0ZWRTcG9vbElkID0gaWRcbiAgICBpZiAoXG4gICAgICAhdGhpcy5hdmFpbGFibGVTcG9vbHNcbiAgICAgICAgLmZpbHRlcihzcG9vbCA9PiB0aGlzLmZpbHRlclJlc3VsdHMoJycsIHRoaXMuc2VhcmNoLCBzcG9vbCkpXG4gICAgICAgIC5zb21lKHNwb29sID0+IHNwb29sLmlkID09PSBpZClcbiAgICApIHtcbiAgICAgIC8vIGNsZWFyIGZpbHRlciBpZiBzZWxlY3RlZCBzcG9vbCBpc24ndCBpbiBmaWx0ZXIgcmVzdWx0c1xuICAgICAgdGhpcy5zZWFyY2ggPSAnJ1xuICAgIH1cblxuICAgIGlmICh0aGlzLmF1dG9TZWxlY3RTcG9vbE9uTWF0Y2gpIHtcbiAgICAgIHRoaXMuaGFuZGxlU2VsZWN0U3Bvb2woKVxuICAgIH1cbiAgfVxuXG4gIC8qKiBDaG9vc2luZyBhIHNwb29sIGZvciBhIG1hY3JvIHNldHMgaXRzIHZhcmlhYmxlcywgd2hpY2ggaXMgZGV2ZWxvcGVyLW1vZGUgb25seSAoS2xpcHBlciMxMTIpLiAqL1xuICBnZXQgbWFjcm9TZWxlY3RMb2NrZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMudGFyZ2V0TWFjcm8gJiYgdGhpcy5kZXZPbmx5TG9ja2VkXG4gIH1cblxuICBhc3luYyBoYW5kbGVTZWxlY3RTcG9vbCAoKSB7XG4gICAgaWYgKHRoaXMubWFjcm9TZWxlY3RMb2NrZWQpIHJldHVyblxuICAgIGlmICghdGhpcy5zZWxlY3RlZFNwb29sKSB7XG4gICAgICAvLyBubyBzcG9vbCBzZWxlY3RlZFxuXG4gICAgICBjb25zdCBjb25maXJtYXRpb24gPSBhd2FpdCB0aGlzLiRjb25maXJtKFxuICAgICAgICB0aGlzLiR0YygnYXBwLnNwb29sbWFuLm1zZy5ub19zcG9vbCcpLFxuICAgICAgICB7IHRpdGxlOiAnUHJpbnQgd2l0aG91dCBhIHNwb29sPycsIGJ1dHRvblRydWVUZXh0OiAnUHJpbnQgd2l0aG91dCBvbmUnLCBidXR0b25GYWxzZVRleHQ6ICdDaG9vc2UgYSBzcG9vbCcgfVxuICAgICAgKVxuXG4gICAgICBpZiAoIWNvbmZpcm1hdGlvbikge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy50YXJnZXRNYWNybykge1xuICAgICAgLy8gbm8gbmVlZCB0byBydW4gc2FuaXR5IGNoZWNrcyBvciBzdGFydCBhIHByaW50IHdoZW4gd2UgdGFyZ2V0IGEgbWFjcm8sIHNvIHdlIHJldHVybiBlYXJseVxuXG4gICAgICAvLyBzZXQgc3Bvb2xfaWQgdmlhIFNFVF9HQ09ERV9WQVJJQUJMRVxuICAgICAgY29uc3QgY29tbWFuZHMgPSBbXG4gICAgICAgIGBTRVRfR0NPREVfVkFSSUFCTEUgTUFDUk89JHt0aGlzLnRhcmdldE1hY3JvfSBWQVJJQUJMRT1zcG9vbF9pZCBWQUxVRT0ke3RoaXMuc2VsZWN0ZWRTcG9vbCA/PyAnTm9uZSd9YFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdXBwb3J0c1NhdmVWYXJpYWJsZXMgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByaW50ZXJDb25maWcnXSgnc2F2ZV92YXJpYWJsZXMnKVxuICAgICAgaWYgKHN1cHBvcnRzU2F2ZVZhcmlhYmxlcykge1xuICAgICAgICAvLyBwZXJzaXN0IHNlbGVjdGVkIHNwb29sIGFjcm9zcyByZXN0YXJ0c1xuICAgICAgICBjb21tYW5kcy5wdXNoKGBTQVZFX1ZBUklBQkxFIFZBUklBQkxFPSR7dGhpcy50YXJnZXRNYWNyby50b1VwcGVyQ2FzZSgpfV9fU1BPT0xfSUQgVkFMVUU9JHt0aGlzLnNlbGVjdGVkU3Bvb2wgPz8gJ05vbmUnfWApXG4gICAgICB9XG5cbiAgICAgIGF3YWl0IFNvY2tldEFjdGlvbnMucHJpbnRlckdjb2RlU2NyaXB0KGNvbW1hbmRzLmpvaW4oJ1xcbicpKVxuXG4gICAgICBjb25zdCBtYWNybzogTWFjcm9XaXRoU3Bvb2xJZCB8IHVuZGVmaW5lZCA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ21hY3Jvcy9nZXRNYWNyb0J5TmFtZSddKHRoaXMudGFyZ2V0TWFjcm8udG9Mb3dlckNhc2UoKSlcbiAgICAgIGlmIChtYWNybz8udmFyaWFibGVzLmFjdGl2ZSkge1xuICAgICAgICAvLyBzZWxlY3RlZCB0b29sIGlzIGFjdGl2ZSwgdXBkYXRlIGFjdGl2ZSBzcG9vbFxuICAgICAgICBhd2FpdCBTb2NrZXRBY3Rpb25zLnNlcnZlclNwb29sbWFuUG9zdFNwb29sSWQodGhpcy5zZWxlY3RlZFNwb29sID8/IHVuZGVmaW5lZClcbiAgICAgIH1cblxuICAgICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHNwb29sID0gdGhpcy5hdmFpbGFibGVTcG9vbHMuZmluZChzcG9vbCA9PiBzcG9vbC5pZCA9PT0gdGhpcy5zZWxlY3RlZFNwb29sKVxuICAgIGlmIChzcG9vbCAmJiB0aGlzLmN1cnJlbnRGaWxlTmFtZSAmJiAodGhpcy53YXJuT25GaWxhbWVudFR5cGVNaXNtYXRjaCB8fCB0aGlzLndhcm5Pbk5vdEVub3VnaEZpbGFtZW50KSkge1xuICAgICAgLy8gdHJpZ2dlciBzYW5pdHkgY2hlY2tzIHdoZW4gd2UgaGF2ZSBhbiBhY3RpdmUgZmlsZVxuICAgICAgLy8gKGN1cnJlbnQgcHJpbnQgb3IgbmV3IHByaW50KSBhbmQgc2FuaXR5IGNoZWNrcyBhcmUgZW5hYmxlZC5cblxuICAgICAgaWYgKHRoaXMuY3VycmVudEZpbGUgJiYgKHRoaXMuZmlsZW5hbWUgfHwgIVsnY29tcGxldGUnLCAnY2FuY2VsbGVkJ10uaW5jbHVkZXModGhpcy5wcmludGVyU3RhdGUpKSkge1xuICAgICAgICAvLyBpZiB3ZSdyZSB0cmFja2luZyBhIGZpbGUgYW5kIHN0YXJ0aW5nIGEgbmV3IHByaW50IG9yIHRoZSBjdXJyZW50IG9uZSBoYXNuJ3QgZW5kZWQgeWV0XG5cbiAgICAgICAgaWYgKHRoaXMud2Fybk9uRmlsYW1lbnRUeXBlTWlzbWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBmaWxlTWF0ZXJpYWxzID0gdGhpcy5jdXJyZW50RmlsZS5maWxhbWVudF90eXBlPy50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAuc3BsaXQoJzsnKS5tYXAoKHg6IHN0cmluZykgPT4geC5yZXBsYWNlKC9cIi9nLCAnJykpXG4gICAgICAgICAgY29uc3Qgc3Bvb2xNYXRlcmlhbCA9IHNwb29sLmZpbGFtZW50Lm1hdGVyaWFsPy50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgaWYgKHNwb29sTWF0ZXJpYWwgJiYgZmlsZU1hdGVyaWFscyAmJiAhZmlsZU1hdGVyaWFscy5pbmNsdWRlcyhzcG9vbE1hdGVyaWFsKSkge1xuICAgICAgICAgICAgLy8gZmlsYW1lbnQgbWF0ZXJpYWxzIGRvbid0IG1hdGNoXG5cbiAgICAgICAgICAgIGNvbnN0IGNvbmZpcm1hdGlvbiA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICAgICAgICAgIHRoaXMuJHRjKCdhcHAuc3Bvb2xtYW4ubXNnLm1pc21hdGNoZWRfZmlsYW1lbnQnKSxcbiAgICAgICAgICAgICAgeyB0aXRsZTogXCJUaGlzIHNwb29sIGlzbid0IHRoZSBmaWxlJ3MgbWF0ZXJpYWxcIiwgYnV0dG9uVHJ1ZVRleHQ6ICdVc2UgaXQgYW55d2F5JywgYnV0dG9uRmFsc2VUZXh0OiAnQ2hvb3NlIGFub3RoZXInIH1cbiAgICAgICAgICAgIClcblxuICAgICAgICAgICAgaWYgKCFjb25maXJtYXRpb24pIHtcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlcXVpcmVkTGVuZ3RoID0gdGhpcy5jdXJyZW50RmlsZT8uZmlsYW1lbnRfdG90YWxcbiAgICAgICAgaWYgKHJlcXVpcmVkTGVuZ3RoICYmIFsncHJpbnRpbmcnLCAncGF1c2VkJ10uaW5jbHVkZXModGhpcy5wcmludGVyU3RhdGUpKSB7XG4gICAgICAgICAgLy8gaWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgYSBwcmludCBqb2IsIHN1YnRyYWN0IHRoZSBhbHJlYWR5IHByaW50ZWQgYW1vdW50IGZyb20gdGhlIHJlcXVpcmVkIGxlbmd0aFxuICAgICAgICAgIHJlcXVpcmVkTGVuZ3RoIC09IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5wcmludF9zdGF0cz8uZmlsYW1lbnRfdXNlZCA/PyAwXG4gICAgICAgICAgcmVxdWlyZWRMZW5ndGggPSBNYXRoLm1heChyZXF1aXJlZExlbmd0aCwgMClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVxdWlyZWRMZW5ndGgpIHtcbiAgICAgICAgICAvLyBtaXNzaW5nIGZpbGUgbWV0YWRhdGFcblxuICAgICAgICAgIGNvbnN0IGNvbmZpcm1hdGlvbiA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oXG4gICAgICAgICAgICB0aGlzLiR0YygnYXBwLnNwb29sbWFuLm1zZy5ub19yZXF1aXJlZF9sZW5ndGgnKSxcbiAgICAgICAgICAgIHsgdGl0bGU6IFwiVGhlIGZpbGUgZG9lc24ndCBzYXkgaG93IG11Y2ggaXQgbmVlZHNcIiwgYnV0dG9uVHJ1ZVRleHQ6ICdVc2UgdGhpcyBzcG9vbCcsIGJ1dHRvbkZhbHNlVGV4dDogJ0Nob29zZSBhbm90aGVyJyB9XG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKCFjb25maXJtYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLndhcm5Pbk5vdEVub3VnaEZpbGFtZW50KSB7XG4gICAgICAgICAgbGV0IHJlbWFpbmluZ0xlbmd0aCA9IHNwb29sLnJlbWFpbmluZ19sZW5ndGhcbiAgICAgICAgICBpZiAoIXJlbWFpbmluZ0xlbmd0aCAmJiBzcG9vbC5yZW1haW5pbmdfd2VpZ2h0KSB7XG4gICAgICAgICAgICByZW1haW5pbmdMZW5ndGggPSB0aGlzLiRmaWx0ZXJzLmNvbnZlcnRGaWxhbWVudFdlaWdodFRvTGVuZ3RoKHNwb29sLnJlbWFpbmluZ193ZWlnaHQsIHNwb29sLmZpbGFtZW50LmRlbnNpdHksIHNwb29sLmZpbGFtZW50LmRpYW1ldGVyKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgcmVtYWluaW5nTGVuZ3RoID09PSAnbnVtYmVyJyAmJiByZXF1aXJlZExlbmd0aCA+PSByZW1haW5pbmdMZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIG5vdCBlbm91Z2ggZmlsYW1lbnRcblxuICAgICAgICAgICAgY29uc3QgY29uZmlybWF0aW9uID0gYXdhaXQgdGhpcy4kY29uZmlybShcbiAgICAgICAgICAgICAgdGhpcy4kdGMoJ2FwcC5zcG9vbG1hbi5tc2cubm9fZmlsYW1lbnQnKSxcbiAgICAgICAgICAgICAgeyB0aXRsZTogJ1RoaXMgc3Bvb2wgbWF5IHJ1biBvdXQnLCBidXR0b25UcnVlVGV4dDogJ1VzZSBpdCBhbnl3YXknLCBidXR0b25GYWxzZVRleHQ6ICdDaG9vc2UgYW5vdGhlcicgfVxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICBpZiAoIWNvbmZpcm1hdGlvbikge1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBhd2FpdCBTb2NrZXRBY3Rpb25zLnNlcnZlclNwb29sbWFuUG9zdFNwb29sSWQodGhpcy5zZWxlY3RlZFNwb29sID8/IHVuZGVmaW5lZClcbiAgICBpZiAodGhpcy5maWxlbmFtZSkge1xuICAgICAgYXdhaXQgU29ja2V0QWN0aW9ucy5wcmludGVyUHJpbnRTdGFydCh0aGlzLmZpbGVuYW1lKVxuXG4gICAgICBjb25zdCBob21lID0gcHJpbnRlckhvbWVQYXRoKClcbiAgICAgIGlmICh0aGlzLiRyb3V0ZXIuY3VycmVudFJvdXRlLnBhdGggIT09IGhvbWUpIHtcbiAgICAgICAgdGhpcy4kcm91dGVyLnB1c2goeyBwYXRoOiBob21lIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcGVuID0gZmFsc2VcbiAgfVxuXG4gIGZpbHRlclJlc3VsdHMgKHZhbHVlOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcsIGl0ZW06IFNwb29sKTogYm9vbGVhbiB7XG4gICAgcXVlcnkgPSBxdWVyeS50b0xvd2VyQ2FzZSgpXG4gICAgcmV0dXJuIFtpdGVtLmlkLCBpdGVtLmNvbW1lbnQsIGl0ZW0uZmlsYW1lbnQubmFtZSwgaXRlbS5maWxhbWVudC5tYXRlcmlhbCwgaXRlbS5maWxhbWVudC52ZW5kb3I/Lm5hbWVdXG4gICAgICAuc29tZSh2YWwgPT4gdmFsPy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpKVxuICB9XG5cbiAgZ2V0IHNwb29sbWFuVVJMICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuc2VydmVyLmNvbmZpZy5zcG9vbG1hbj8uc2VydmVyXG4gIH1cblxuICBnZXQgcHJlZmVyRGV2aWNlQ2FtZXJhICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4ucHJlZmVyRGV2aWNlQ2FtZXJhXG4gIH1cblxuICBnZXQgYXV0b09wZW5RUkRldGVjdGlvbkNhbWVyYSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLnNwb29sbWFuLmF1dG9PcGVuUVJEZXRlY3Rpb25DYW1lcmFcbiAgfVxuXG4gIGdldCBhdXRvU2VsZWN0U3Bvb2xPbk1hdGNoICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4uYXV0b1NlbGVjdFNwb29sT25NYXRjaFxuICB9XG5cbiAgZ2V0IHdhcm5Pbk5vdEVub3VnaEZpbGFtZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4ud2Fybk9uTm90RW5vdWdoRmlsYW1lbnRcbiAgfVxuXG4gIGdldCB3YXJuT25GaWxhbWVudFR5cGVNaXNtYXRjaCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLnNwb29sbWFuLndhcm5PbkZpbGFtZW50VHlwZU1pc21hdGNoXG4gIH1cblxuICBnZXQgc29ydE9yZGVyICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3Muc3Bvb2xtYW4uc2VsZWN0aW9uRGlhbG9nU29ydE9yZGVyXG4gIH1cblxuICBoYW5kbGVTb3J0T3JkZXJLZXlDaGFuZ2UgKHZhbHVlPzogc3RyaW5nKSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywge1xuICAgICAgcGF0aDogJ3VpU2V0dGluZ3Muc3Bvb2xtYW4uc2VsZWN0aW9uRGlhbG9nU29ydE9yZGVyLmtleScsXG4gICAgICB2YWx1ZTogdmFsdWUgPz8gbnVsbCxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBoYW5kbGVTb3J0T3JkZXJEZXNjQ2hhbmdlICh2YWx1ZT86IGJvb2xlYW4pIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5zcG9vbG1hbi5zZWxlY3Rpb25EaWFsb2dTb3J0T3JkZXIuZGVzYycsXG4gICAgICB2YWx1ZTogdmFsdWUgPz8gbnVsbCxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5zcG9vbC10YWJsZSB0ciB0ZCB7XG4gICAgcGFkZGluZy10b3A6IDhweCAhaW1wb3J0YW50O1xuICAgIHBhZGRpbmctYm90dG9tOiA4cHggIWltcG9ydGFudDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvc3Bvb2xtYW4vU3Bvb2xTZWxlY3Rpb25EaWFsb2cudnVlIn0=