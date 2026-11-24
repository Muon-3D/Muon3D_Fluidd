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
import StateMixin from "/src/mixins/state.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { scopedPath } from "/src/router/printerPagePaths.ts";
import { MOVED_TO_ACCOUNT, SECTION_COMPONENTS, accessCards, searchSettingsSections, settingsSectionFor, visibleSettingsSections } from "/src/services/settings/sections.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import MacroPanel from "/src/components/settings/macros/MacroPanel.vue";
import GeneralSettings from "/src/components/settings/GeneralSettings.vue";
import PresetSettings from "/src/components/settings/presets/PresetSettings.vue";
import CameraSettings from "/src/components/settings/cameras/CameraSettings.vue";
import ToolheadSettings from "/src/components/settings/ToolheadSettings.vue";
import SoftwareSettings from "/src/components/settings/SoftwareSettings.vue";
import SecuritySettings from "/src/components/settings/SecuritySettings.vue";
import { updateWatch } from "/src/services/updates/watch.ts";
import GcodePreviewSettings from "/src/components/settings/GcodePreviewSettings.vue";
import AuthSettings from "/src/components/settings/auth/AuthSettings.vue";
import ConsoleSettings from "/src/components/settings/console/ConsoleSettings.vue";
import FileBrowserSettings from "/src/components/settings/FileBrowserSettings.vue";
import FileEditorSettings from "/src/components/settings/FileEditorSettings.vue";
import TimelapseSettings from "/src/components/settings/timelapse/TimelapseSettings.vue";
import SpoolmanSettings from "/src/components/settings/SpoolmanSettings.vue";
import ProtectionSettings from "/src/components/settings/ProtectionSettings.vue";
import PeopleAccessSettings from "/src/components/settings/people-access/PeopleAccessSettings.vue";
import WifiPage from "/src/views/Wifi.vue";
import DeveloperModeSettings from "/src/components/settings/DeveloperModeSettings.vue";
import { devModeState, refreshDevMode } from "/src/services/dev-mode/state.ts";
import SystemPage from "/src/views/System.vue";
const countOrNone = (count) => count ? String(count) : "none";
let Settings = class extends Mixins(StateMixin, BrowserMixin) {
  created() {
    const moved = MOVED_TO_ACCOUNT[this.$route.hash.replace(/^#/, "")];
    if (moved) this.$router.replace(scopedPath(moved, activeSlug())).catch(() => {
    });
  }
  mounted() {
    refreshDevMode();
  }
  /** Three-state (#296): null until server.info has loaded for this printer, so neither access card shows. */
  get isMuonPrinter() {
    return this.$store.getters["server/isMuonPrinter"];
  }
  /** Which access card shows for this printer (null Muon-ness: loading). */
  get cards() {
    return accessCards(this.isMuonPrinter, SECTION_COMPONENTS.filter((name) => this.supports(name)));
  }
  supports(component) {
    return this.$store.getters["server/componentSupport"](component);
  }
  get sections() {
    const sections = visibleSettingsSections({ components: SECTION_COMPONENTS.filter((name) => this.supports(name)) });
    return this.isMuonPrinter === true ? sections : sections.filter((s) => s.id !== "developer");
  }
  /** A macro category's page, inside Settings. */
  get inChild() {
    return this.$route.matched.length > 1;
  }
  /** Wi-Fi's or System's own page, opened at its own address. */
  get ownPage() {
    if (this.$route.name === "Wifi") return "network";
    if (this.$route.name === "System") return "system";
    return null;
  }
  /** The section shown: the anchor's, Macros for a category, else the first on a wider screen. */
  get current() {
    if (this.ownPage) return this.sections.find((s) => s.id === this.ownPage) ?? null;
    if (this.inChild) return this.sections.find((s) => s.id === "macros") ?? null;
    const section = settingsSectionFor(this.$route.hash, this.sections);
    if (section || this.isMobileViewport) return section;
    return this.sections.find((s) => !s.page) ?? null;
  }
  /** What the search box holds; it narrows the list on the left. */
  query = "";
  /** The sections the list shows: all of them but Developer mode, which sits apart below. */
  get listed() {
    return searchSettingsSections(this.sections.filter((s) => s.id !== "developer"), this.query);
  }
  /** Developer mode: its own tile below the list, off unless someone turned it on. Hidden when a search leaves it out. */
  get developer() {
    const section = this.sections.find((s) => s.id === "developer") ?? null;
    if (!section) return null;
    return searchSettingsSections([section], this.query).length ? section : null;
  }
  get developerLine() {
    const state = devModeState.enabled === null ? "" : devModeState.enabled ? "On. " : "Off. ";
    return `${state}${this.developer?.blurb ?? ""}`;
  }
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  get showList() {
    return !this.isMobileViewport || !this.current;
  }
  get showPane() {
    return !!this.current;
  }
  shows(anchor) {
    return this.current?.anchors.includes(anchor) ?? false;
  }
  get listTo() {
    return scopedPath("/settings", activeSlug());
  }
  linkTo(section) {
    if (section.page) return scopedPath(section.page, activeSlug());
    return `${this.listTo}#${section.anchors[0]}`;
  }
  get updateCount() {
    const info = this.$store.state.version.version_info ?? {};
    const hasUpdate = this.$store.getters["version/hasUpdate"];
    return Object.keys(info).filter((name) => hasUpdate(name)).length;
  }
  /** What's beside a section's name: the printer's name, how many cameras, whether it's up to date. */
  hintOf(section) {
    switch (section.id) {
      case "general":
        return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
      case "updates": {
        const own = updateWatch.status;
        if (own) return own.update_available && own.target_version !== own.current_version ? "update ready" : "up to date";
        if (!Object.keys(this.$store.state.version.version_info ?? {}).length) return "";
        if (!this.updateCount) return "up to date";
        return this.updateCount === 1 ? "1 update" : `${this.updateCount} updates`;
      }
      case "cameras":
        return countOrNone(this.$store.getters["webcams/getWebcams"].length);
      case "materials":
        return countOrNone(this.$store.getters["config/getTempPresets"].length);
      case "macros":
        return countOrNone(this.$store.getters["macros/getMacros"].length);
      case "system":
        return "restart, logs";
      case "developer":
        return devModeState.enabled === null ? "" : devModeState.enabled ? "on" : "off";
      default:
        return "";
    }
  }
};
Settings = __decorateClass([
  Component({
    components: {
      WifiPage,
      SystemPage,
      DeveloperModeSettings,
      ProtectionSettings,
      PeopleAccessSettings,
      SpoolmanSettings,
      TimelapseSettings,
      MacroPanel,
      GeneralSettings,
      PresetSettings,
      CameraSettings,
      ToolheadSettings,
      SoftwareSettings,
      SecuritySettings,
      GcodePreviewSettings,
      AuthSettings,
      ConsoleSettings,
      FileBrowserSettings,
      FileEditorSettings
    }
  })
], Settings);
const _sfc_main = Settings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "settings-page", class: { "settings-page--phone": _vm.isMobileViewport }, attrs: { "data-tid": "settings-page" } }, [_vm.isMobileViewport && _vm.current ? _c("router-link", { staticClass: "settings-back", attrs: { "to": _vm.listTo, "data-tid": "settings-back" } }, [_c(__unplugin_components_0, { attrs: { "name": "chevronLeft", "small": "" } }), _vm._v(" Settings ")], 1) : _vm._e(), _c("div", { staticClass: "settings-body" }, [_vm.showList ? _c("div", { staticClass: "settings-side" }, [_c("label", { staticClass: "settings-search" }, [_c(__unplugin_components_1, { attrs: { "name": "search", "small": "" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.query, expression: "query" }], attrs: { "type": "search", "placeholder": "Search settings\u2026", "aria-label": "Search settings", "data-tid": "settings-search" }, domProps: { "value": _vm.query }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.query = $event.target.value;
  } } })], 1), _c("nav", { staticClass: "settings-list", attrs: { "aria-label": "Settings sections" } }, [_vm._l(_vm.listed, function(section) {
    return _c("router-link", { key: section.id, staticClass: "settings-list__item", class: { "settings-list__item--on": section === _vm.current }, attrs: { "to": _vm.linkTo(section), "aria-current": section === _vm.current ? "page" : void 0, "data-tid": `settings-${section.id}` } }, [_c("span", { staticClass: "settings-list__ico" }, [_c(__unplugin_components_2, { attrs: { "name": section.icon } })], 1), _c("span", { staticClass: "settings-list__label" }, [_vm._v(" " + _vm._s(section.label) + " "), _c("small", [_vm._v(_vm._s(section.blurb))])]), _vm.hintOf(section) ? _c("span", { staticClass: "settings-list__hint", class: { "settings-list__hint--warn": section.id === "updates" && (_vm.updateCount > 0 || _vm.hintOf(section) === "update ready") } }, [_vm._v(_vm._s(_vm.hintOf(section)))]) : _vm._e(), _vm.isMobileViewport ? _c(__unplugin_components_3, { staticClass: "settings-list__go", attrs: { "name": "chevronRight", "small": "" } }) : _vm._e()], 1);
  }), !_vm.listed.length && !_vm.developer ? _c("p", { staticClass: "settings-list__none", attrs: { "data-tid": "settings-none" } }, [_vm._v(' Nothing matches "' + _vm._s(_vm.query) + '". ')]) : _vm._e()], 2), _vm.developer ? _c("nav", { staticClass: "settings-list settings-list--dev", attrs: { "aria-label": "Developer mode" } }, [_c("router-link", { staticClass: "settings-list__item settings-list__item--dev", class: { "settings-list__item--on": _vm.developer === _vm.current }, attrs: { "to": _vm.linkTo(_vm.developer), "aria-current": _vm.developer === _vm.current ? "page" : void 0, "data-tid": "settings-developer" } }, [_c("span", { staticClass: "settings-list__ico" }, [_c(__unplugin_components_4, { attrs: { "name": _vm.developer.icon } })], 1), _c("span", { staticClass: "settings-list__label" }, [_vm._v(" Developer mode "), _c("small", [_vm._v(_vm._s(_vm.developerLine))])]), _vm.isMobileViewport ? _c(__unplugin_components_5, { staticClass: "settings-list__go", attrs: { "name": "chevronRight", "small": "" } }) : _vm._e()], 1)], 1) : _vm._e(), _c("p", { staticClass: "settings-kept", attrs: { "data-tid": "settings-kept" } }, [_vm._v(" Kept on " + _vm._s(_vm.printerName) + ", so they're the same for everyone who opens it. ")])]) : _vm._e(), _vm.showPane ? _c("div", { staticClass: "settings-pane", attrs: { "data-tid": "settings-pane" } }, [_vm.ownPage === "network" ? _c("wifi-page") : _vm.ownPage === "system" ? _c("system-page") : _vm.authenticated && _vm.socketConnected ? _c("router-view") : _vm._e(), !_vm.inChild && !_vm.ownPage && _vm.current ? [_vm.shows("general") ? _c("general-settings") : _vm._e(), _vm.shows("access") && _vm.cards.loading ? _c("p", { staticClass: "settings-loading", attrs: { "data-tid": "settings-access-loading" } }, [_vm._v(" Loading\u2026 ")]) : _vm.shows("access") && _vm.cards.peopleAccess ? _c("people-access-settings") : _vm.shows("protection") && _vm.supports("muon_protection") ? _c("protection-settings") : _vm._e(), _vm.shows("auth") && _vm.cards.auth ? _c("auth-settings") : _vm._e(), _vm.shows("security") ? _c("security-settings") : _vm._e(), _vm.shows("versions") ? _c("software-settings") : _vm._e(), _vm.shows("camera") ? _c("camera-settings") : _vm._e(), _vm.shows("presets") ? _c("preset-settings") : _vm._e(), _vm.shows("macros") ? _c("macro-panel") : _vm._e(), _vm.shows("timelapse") ? _c("timelapse-settings") : _vm._e(), _vm.shows("spoolman") ? _c("spoolman-settings") : _vm._e(), _vm.shows("console") ? _c("console-settings") : _vm._e(), _vm.shows("browser") ? _c("file-browser-settings") : _vm._e(), _vm.shows("editor") ? _c("file-editor-settings") : _vm._e(), _vm.shows("toolhead") ? _c("toolhead-settings") : _vm._e(), _vm.shows("gcodePreview") ? _c("gcode-preview-settings") : _vm._e(), _vm.shows("developer") ? _c("developer-mode-settings") : _vm._e()] : _vm._e()], 2) : _vm._e()])], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/views/Settings.vue?vue&type=style&index=0&scoped=817427b0&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "817427b0",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/views/Settings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQW9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBZ0NBO0FBQUEsRUFDQTtBQUVBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUVBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBRUE7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBcElBO0FBQUEsRUF2QkE7QUFBQSxJQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiU2V0dGluZ3MudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwic2V0dGluZ3MtcGFnZVwiXG4gICAgOmNsYXNzPVwieyAnc2V0dGluZ3MtcGFnZS0tcGhvbmUnOiBpc01vYmlsZVZpZXdwb3J0IH1cIlxuICAgIGRhdGEtdGlkPVwic2V0dGluZ3MtcGFnZVwiXG4gID5cbiAgICA8cm91dGVyLWxpbmtcbiAgICAgIHYtaWY9XCJpc01vYmlsZVZpZXdwb3J0ICYmIGN1cnJlbnRcIlxuICAgICAgOnRvPVwibGlzdFRvXCJcbiAgICAgIGNsYXNzPVwic2V0dGluZ3MtYmFja1wiXG4gICAgICBkYXRhLXRpZD1cInNldHRpbmdzLWJhY2tcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgIG5hbWU9XCJjaGV2cm9uTGVmdFwiXG4gICAgICAgIHNtYWxsXG4gICAgICAvPlxuICAgICAgU2V0dGluZ3NcbiAgICA8L3JvdXRlci1saW5rPlxuXG4gICAgPGRpdiBjbGFzcz1cInNldHRpbmdzLWJvZHlcIj5cbiAgICAgIDxkaXZcbiAgICAgICAgdi1pZj1cInNob3dMaXN0XCJcbiAgICAgICAgY2xhc3M9XCJzZXR0aW5ncy1zaWRlXCJcbiAgICAgID5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwic2V0dGluZ3Mtc2VhcmNoXCI+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJzZWFyY2hcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgdi1tb2RlbD1cInF1ZXJ5XCJcbiAgICAgICAgICAgIHR5cGU9XCJzZWFyY2hcIlxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggc2V0dGluZ3PigKZcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIlNlYXJjaCBzZXR0aW5nc1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmdzLXNlYXJjaFwiXG4gICAgICAgICAgPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8bmF2XG4gICAgICAgICAgY2xhc3M9XCJzZXR0aW5ncy1saXN0XCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiU2V0dGluZ3Mgc2VjdGlvbnNcIlxuICAgICAgICA+XG4gICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICB2LWZvcj1cInNlY3Rpb24gaW4gbGlzdGVkXCJcbiAgICAgICAgICAgIDprZXk9XCJzZWN0aW9uLmlkXCJcbiAgICAgICAgICAgIDp0bz1cImxpbmtUbyhzZWN0aW9uKVwiXG4gICAgICAgICAgICBjbGFzcz1cInNldHRpbmdzLWxpc3RfX2l0ZW1cIlxuICAgICAgICAgICAgOmNsYXNzPVwieyAnc2V0dGluZ3MtbGlzdF9faXRlbS0tb24nOiBzZWN0aW9uID09PSBjdXJyZW50IH1cIlxuICAgICAgICAgICAgOmFyaWEtY3VycmVudD1cInNlY3Rpb24gPT09IGN1cnJlbnQgPyAncGFnZScgOiB1bmRlZmluZWRcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHNldHRpbmdzLSR7c2VjdGlvbi5pZH1gXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNldHRpbmdzLWxpc3RfX2ljb1wiPjxmcmFtZS1pY29uIDpuYW1lPVwic2VjdGlvbi5pY29uXCIgLz48L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNldHRpbmdzLWxpc3RfX2xhYmVsXCI+XG4gICAgICAgICAgICAgIHt7IHNlY3Rpb24ubGFiZWwgfX1cbiAgICAgICAgICAgICAgPHNtYWxsPnt7IHNlY3Rpb24uYmx1cmIgfX08L3NtYWxsPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgdi1pZj1cImhpbnRPZihzZWN0aW9uKVwiXG4gICAgICAgICAgICAgIGNsYXNzPVwic2V0dGluZ3MtbGlzdF9faGludFwiXG4gICAgICAgICAgICAgIDpjbGFzcz1cInsgJ3NldHRpbmdzLWxpc3RfX2hpbnQtLXdhcm4nOiBzZWN0aW9uLmlkID09PSAndXBkYXRlcycgJiYgKHVwZGF0ZUNvdW50ID4gMCB8fCBoaW50T2Yoc2VjdGlvbikgPT09ICd1cGRhdGUgcmVhZHknKSB9XCJcbiAgICAgICAgICAgID57eyBoaW50T2Yoc2VjdGlvbikgfX08L3NwYW4+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICB2LWlmPVwiaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgICAgICAgIG5hbWU9XCJjaGV2cm9uUmlnaHRcIlxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICBjbGFzcz1cInNldHRpbmdzLWxpc3RfX2dvXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICA8cFxuICAgICAgICAgICAgdi1pZj1cIiFsaXN0ZWQubGVuZ3RoICYmICFkZXZlbG9wZXJcIlxuICAgICAgICAgICAgY2xhc3M9XCJzZXR0aW5ncy1saXN0X19ub25lXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwic2V0dGluZ3Mtbm9uZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgTm90aGluZyBtYXRjaGVzIFwie3sgcXVlcnkgfX1cIi5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvbmF2PlxuICAgICAgICA8bmF2XG4gICAgICAgICAgdi1pZj1cImRldmVsb3BlclwiXG4gICAgICAgICAgY2xhc3M9XCJzZXR0aW5ncy1saXN0IHNldHRpbmdzLWxpc3QtLWRldlwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkRldmVsb3BlciBtb2RlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgICAgOnRvPVwibGlua1RvKGRldmVsb3BlcilcIlxuICAgICAgICAgICAgY2xhc3M9XCJzZXR0aW5ncy1saXN0X19pdGVtIHNldHRpbmdzLWxpc3RfX2l0ZW0tLWRldlwiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdzZXR0aW5ncy1saXN0X19pdGVtLS1vbic6IGRldmVsb3BlciA9PT0gY3VycmVudCB9XCJcbiAgICAgICAgICAgIDphcmlhLWN1cnJlbnQ9XCJkZXZlbG9wZXIgPT09IGN1cnJlbnQgPyAncGFnZScgOiB1bmRlZmluZWRcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1kZXZlbG9wZXJcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2V0dGluZ3MtbGlzdF9faWNvXCI+PGZyYW1lLWljb24gOm5hbWU9XCJkZXZlbG9wZXIuaWNvblwiIC8+PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzZXR0aW5ncy1saXN0X19sYWJlbFwiPlxuICAgICAgICAgICAgICBEZXZlbG9wZXIgbW9kZVxuICAgICAgICAgICAgICA8c21hbGw+e3sgZGV2ZWxvcGVyTGluZSB9fTwvc21hbGw+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICB2LWlmPVwiaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgICAgICAgICAgIG5hbWU9XCJjaGV2cm9uUmlnaHRcIlxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICBjbGFzcz1cInNldHRpbmdzLWxpc3RfX2dvXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPC9uYXY+XG4gICAgICAgIDxwXG4gICAgICAgICAgY2xhc3M9XCJzZXR0aW5ncy1rZXB0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInNldHRpbmdzLWtlcHRcIlxuICAgICAgICA+XG4gICAgICAgICAgS2VwdCBvbiB7eyBwcmludGVyTmFtZSB9fSwgc28gdGhleSdyZSB0aGUgc2FtZSBmb3IgZXZlcnlvbmUgd2hvIG9wZW5zIGl0LlxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwic2hvd1BhbmVcIlxuICAgICAgICBjbGFzcz1cInNldHRpbmdzLXBhbmVcIlxuICAgICAgICBkYXRhLXRpZD1cInNldHRpbmdzLXBhbmVcIlxuICAgICAgPlxuICAgICAgICA8d2lmaS1wYWdlIHYtaWY9XCJvd25QYWdlID09PSAnbmV0d29yaydcIiAvPlxuICAgICAgICA8c3lzdGVtLXBhZ2Ugdi1lbHNlLWlmPVwib3duUGFnZSA9PT0gJ3N5c3RlbSdcIiAvPlxuICAgICAgICA8cm91dGVyLXZpZXcgdi1lbHNlLWlmPVwiYXV0aGVudGljYXRlZCAmJiBzb2NrZXRDb25uZWN0ZWRcIiAvPlxuICAgICAgICA8dGVtcGxhdGUgdi1pZj1cIiFpbkNoaWxkICYmICFvd25QYWdlICYmIGN1cnJlbnRcIj5cbiAgICAgICAgICA8Z2VuZXJhbC1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ2dlbmVyYWwnKVwiIC8+XG4gICAgICAgICAgPHBcbiAgICAgICAgICAgIHYtaWY9XCJzaG93cygnYWNjZXNzJykgJiYgY2FyZHMubG9hZGluZ1wiXG4gICAgICAgICAgICBjbGFzcz1cInNldHRpbmdzLWxvYWRpbmdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJzZXR0aW5ncy1hY2Nlc3MtbG9hZGluZ1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgTG9hZGluZ+KAplxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8cGVvcGxlLWFjY2Vzcy1zZXR0aW5ncyB2LWVsc2UtaWY9XCJzaG93cygnYWNjZXNzJykgJiYgY2FyZHMucGVvcGxlQWNjZXNzXCIgLz5cbiAgICAgICAgICA8cHJvdGVjdGlvbi1zZXR0aW5ncyB2LWVsc2UtaWY9XCJzaG93cygncHJvdGVjdGlvbicpICYmIHN1cHBvcnRzKCdtdW9uX3Byb3RlY3Rpb24nKVwiIC8+XG4gICAgICAgICAgPGF1dGgtc2V0dGluZ3Mgdi1pZj1cInNob3dzKCdhdXRoJykgJiYgY2FyZHMuYXV0aFwiIC8+XG4gICAgICAgICAgPHNlY3VyaXR5LXNldHRpbmdzIHYtaWY9XCJzaG93cygnc2VjdXJpdHknKVwiIC8+XG4gICAgICAgICAgPHNvZnR3YXJlLXNldHRpbmdzIHYtaWY9XCJzaG93cygndmVyc2lvbnMnKVwiIC8+XG4gICAgICAgICAgPGNhbWVyYS1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ2NhbWVyYScpXCIgLz5cbiAgICAgICAgICA8cHJlc2V0LXNldHRpbmdzIHYtaWY9XCJzaG93cygncHJlc2V0cycpXCIgLz5cbiAgICAgICAgICA8bWFjcm8tcGFuZWwgdi1pZj1cInNob3dzKCdtYWNyb3MnKVwiIC8+XG4gICAgICAgICAgPHRpbWVsYXBzZS1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ3RpbWVsYXBzZScpXCIgLz5cbiAgICAgICAgICA8c3Bvb2xtYW4tc2V0dGluZ3Mgdi1pZj1cInNob3dzKCdzcG9vbG1hbicpXCIgLz5cbiAgICAgICAgICA8Y29uc29sZS1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ2NvbnNvbGUnKVwiIC8+XG4gICAgICAgICAgPGZpbGUtYnJvd3Nlci1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ2Jyb3dzZXInKVwiIC8+XG4gICAgICAgICAgPGZpbGUtZWRpdG9yLXNldHRpbmdzIHYtaWY9XCJzaG93cygnZWRpdG9yJylcIiAvPlxuICAgICAgICAgIDx0b29saGVhZC1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ3Rvb2xoZWFkJylcIiAvPlxuICAgICAgICAgIDxnY29kZS1wcmV2aWV3LXNldHRpbmdzIHYtaWY9XCJzaG93cygnZ2NvZGVQcmV2aWV3JylcIiAvPlxuICAgICAgICAgIDxkZXZlbG9wZXItbW9kZS1zZXR0aW5ncyB2LWlmPVwic2hvd3MoJ2RldmVsb3BlcicpXCIgLz5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCBCcm93c2VyTWl4aW4gZnJvbSAnQC9taXhpbnMvYnJvd3NlcidcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IE1PVkVEX1RPX0FDQ09VTlQsIFNFQ1RJT05fQ09NUE9ORU5UUywgYWNjZXNzQ2FyZHMsIHR5cGUgQWNjZXNzQ2FyZHMsIHNlYXJjaFNldHRpbmdzU2VjdGlvbnMsIHNldHRpbmdzU2VjdGlvbkZvciwgdmlzaWJsZVNldHRpbmdzU2VjdGlvbnMsIHR5cGUgU2V0dGluZ3NTZWN0aW9uIH0gZnJvbSAnQC9zZXJ2aWNlcy9zZXR0aW5ncy9zZWN0aW9ucydcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMgfSBmcm9tICdAL3V0aWwvcHJpbnRlci1uYW1lJ1xuXG5pbXBvcnQgTWFjcm9QYW5lbCBmcm9tICdAL2NvbXBvbmVudHMvc2V0dGluZ3MvbWFjcm9zL01hY3JvUGFuZWwudnVlJ1xuaW1wb3J0IEdlbmVyYWxTZXR0aW5ncyBmcm9tICdAL2NvbXBvbmVudHMvc2V0dGluZ3MvR2VuZXJhbFNldHRpbmdzLnZ1ZSdcbmltcG9ydCBQcmVzZXRTZXR0aW5ncyBmcm9tICdAL2NvbXBvbmVudHMvc2V0dGluZ3MvcHJlc2V0cy9QcmVzZXRTZXR0aW5ncy52dWUnXG5pbXBvcnQgQ2FtZXJhU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL2NhbWVyYXMvQ2FtZXJhU2V0dGluZ3MudnVlJ1xuaW1wb3J0IFRvb2xoZWFkU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL1Rvb2xoZWFkU2V0dGluZ3MudnVlJ1xuaW1wb3J0IFNvZnR3YXJlU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL1NvZnR3YXJlU2V0dGluZ3MudnVlJ1xuaW1wb3J0IFNlY3VyaXR5U2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL1NlY3VyaXR5U2V0dGluZ3MudnVlJ1xuaW1wb3J0IHsgdXBkYXRlV2F0Y2ggfSBmcm9tICdAL3NlcnZpY2VzL3VwZGF0ZXMvd2F0Y2gnXG5pbXBvcnQgR2NvZGVQcmV2aWV3U2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL0djb2RlUHJldmlld1NldHRpbmdzLnZ1ZSdcbmltcG9ydCBBdXRoU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL2F1dGgvQXV0aFNldHRpbmdzLnZ1ZSdcbmltcG9ydCBDb25zb2xlU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL2NvbnNvbGUvQ29uc29sZVNldHRpbmdzLnZ1ZSdcbmltcG9ydCBGaWxlQnJvd3NlclNldHRpbmdzIGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9GaWxlQnJvd3NlclNldHRpbmdzLnZ1ZSdcbmltcG9ydCBGaWxlRWRpdG9yU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL0ZpbGVFZGl0b3JTZXR0aW5ncy52dWUnXG5pbXBvcnQgVGltZWxhcHNlU2V0dGluZ3MgZnJvbSAnQC9jb21wb25lbnRzL3NldHRpbmdzL3RpbWVsYXBzZS9UaW1lbGFwc2VTZXR0aW5ncy52dWUnXG5pbXBvcnQgU3Bvb2xtYW5TZXR0aW5ncyBmcm9tICdAL2NvbXBvbmVudHMvc2V0dGluZ3MvU3Bvb2xtYW5TZXR0aW5ncy52dWUnXG5pbXBvcnQgUHJvdGVjdGlvblNldHRpbmdzIGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9Qcm90ZWN0aW9uU2V0dGluZ3MudnVlJ1xuaW1wb3J0IFBlb3BsZUFjY2Vzc1NldHRpbmdzIGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9wZW9wbGUtYWNjZXNzL1Blb3BsZUFjY2Vzc1NldHRpbmdzLnZ1ZSdcbmltcG9ydCBXaWZpUGFnZSBmcm9tICdAL3ZpZXdzL1dpZmkudnVlJ1xuaW1wb3J0IERldmVsb3Blck1vZGVTZXR0aW5ncyBmcm9tICdAL2NvbXBvbmVudHMvc2V0dGluZ3MvRGV2ZWxvcGVyTW9kZVNldHRpbmdzLnZ1ZSdcbmltcG9ydCB7IGRldk1vZGVTdGF0ZSwgcmVmcmVzaERldk1vZGUgfSBmcm9tICdAL3NlcnZpY2VzL2Rldi1tb2RlL3N0YXRlJ1xuaW1wb3J0IFN5c3RlbVBhZ2UgZnJvbSAnQC92aWV3cy9TeXN0ZW0udnVlJ1xuXG5jb25zdCBjb3VudE9yTm9uZSA9IChjb3VudDogbnVtYmVyKSA9PiBjb3VudCA/IFN0cmluZyhjb3VudCkgOiAnbm9uZSdcblxuLyoqXG4gKiBTZXR0aW5ncyAoYC9ib3h3b29kLTM2N2Evc2V0dGluZ3NgKTogdGhlIHNlY3Rpb25zIG9uIHRoZSBsZWZ0LCB0aGUgb25lXG4gKiBjaG9zZW4gb24gdGhlIHJpZ2h0LCBieSB0aGUgYWRkcmVzcydzIGFuY2hvciAoYCN2ZXJzaW9uc2AgaXMgVXBkYXRlcykuXG4gKiBXaS1GaSBhbmQgU3lzdGVtIGtlZXAgYWRkcmVzc2VzIG9mIHRoZWlyIG93biAoYC93aWZpYCwgYC9zeXN0ZW1gKSBhbmRcbiAqIG9wZW4gaGVyZSB0b28sIHRoZSBsaXN0IHN0aWxsIGJlc2lkZSB0aGVtLiBPbiBhIHBob25lIHRoZSBsaXN0IGlzIGFcbiAqIHBhZ2UsIGFuZCBhIHNlY3Rpb24gb3BlbnMgb3ZlciBpdCB3aXRoIGEgd2F5IGJhY2suXG4gKi9cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7XG4gICAgV2lmaVBhZ2UsXG4gICAgU3lzdGVtUGFnZSxcbiAgICBEZXZlbG9wZXJNb2RlU2V0dGluZ3MsXG4gICAgUHJvdGVjdGlvblNldHRpbmdzLFxuICAgIFBlb3BsZUFjY2Vzc1NldHRpbmdzLFxuICAgIFNwb29sbWFuU2V0dGluZ3MsXG4gICAgVGltZWxhcHNlU2V0dGluZ3MsXG4gICAgTWFjcm9QYW5lbCxcbiAgICBHZW5lcmFsU2V0dGluZ3MsXG4gICAgUHJlc2V0U2V0dGluZ3MsXG4gICAgQ2FtZXJhU2V0dGluZ3MsXG4gICAgVG9vbGhlYWRTZXR0aW5ncyxcbiAgICBTb2Z0d2FyZVNldHRpbmdzLFxuICAgIFNlY3VyaXR5U2V0dGluZ3MsXG4gICAgR2NvZGVQcmV2aWV3U2V0dGluZ3MsXG4gICAgQXV0aFNldHRpbmdzLFxuICAgIENvbnNvbGVTZXR0aW5ncyxcbiAgICBGaWxlQnJvd3NlclNldHRpbmdzLFxuICAgIEZpbGVFZGl0b3JTZXR0aW5nc1xuICB9XG59KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0dGluZ3MgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbiwgQnJvd3Nlck1peGluKSB7XG4gIGNyZWF0ZWQgKCkge1xuICAgIC8vIFNldHRpbmdzIOKAuiBMaWJyYXJ5IG1vdmVkIHRvIHRoZSBhY2NvdW50IChLQU4tNTMyKTogYW4gb2xkIGFkZHJlc3MgZ29lcyB0aGVyZS5cbiAgICBjb25zdCBtb3ZlZCA9IE1PVkVEX1RPX0FDQ09VTlRbdGhpcy4kcm91dGUuaGFzaC5yZXBsYWNlKC9eIy8sICcnKV1cbiAgICBpZiAobW92ZWQpIHRoaXMuJHJvdXRlci5yZXBsYWNlKHNjb3BlZFBhdGgobW92ZWQsIGFjdGl2ZVNsdWcoKSkpLmNhdGNoKCgpID0+IHt9KVxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgcmVmcmVzaERldk1vZGUoKVxuICB9XG5cbiAgLyoqIFRocmVlLXN0YXRlICgjMjk2KTogbnVsbCB1bnRpbCBzZXJ2ZXIuaW5mbyBoYXMgbG9hZGVkIGZvciB0aGlzIHByaW50ZXIsIHNvIG5laXRoZXIgYWNjZXNzIGNhcmQgc2hvd3MuICovXG4gIGdldCBpc011b25QcmludGVyICgpOiBib29sZWFuIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9pc011b25QcmludGVyJ10gYXMgYm9vbGVhbiB8IG51bGxcbiAgfVxuXG4gIC8qKiBXaGljaCBhY2Nlc3MgY2FyZCBzaG93cyBmb3IgdGhpcyBwcmludGVyIChudWxsIE11b24tbmVzczogbG9hZGluZykuICovXG4gIGdldCBjYXJkcyAoKTogQWNjZXNzQ2FyZHMge1xuICAgIHJldHVybiBhY2Nlc3NDYXJkcyh0aGlzLmlzTXVvblByaW50ZXIsIFNFQ1RJT05fQ09NUE9ORU5UUy5maWx0ZXIobmFtZSA9PiB0aGlzLnN1cHBvcnRzKG5hbWUpKSlcbiAgfVxuXG4gIHN1cHBvcnRzIChjb21wb25lbnQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKGNvbXBvbmVudCkgYXMgYm9vbGVhblxuICB9XG5cbiAgZ2V0IHNlY3Rpb25zICgpOiBTZXR0aW5nc1NlY3Rpb25bXSB7XG4gICAgY29uc3Qgc2VjdGlvbnMgPSB2aXNpYmxlU2V0dGluZ3NTZWN0aW9ucyh7IGNvbXBvbmVudHM6IFNFQ1RJT05fQ09NUE9ORU5UUy5maWx0ZXIobmFtZSA9PiB0aGlzLnN1cHBvcnRzKG5hbWUpKSB9KVxuICAgIC8vIERldmVsb3BlciBtb2RlIGlzIGEgTXVvbiBwcmludGVyJ3MgZ2F0ZTogYSBwcmludGVyIHRoYXQgaXMgbm90IG9uZSAob3Igbm90IGtub3duIHRvIGJlIHlldCkgaGFzIG5vIHN1Y2ggcGFnZS5cbiAgICByZXR1cm4gdGhpcy5pc011b25QcmludGVyID09PSB0cnVlID8gc2VjdGlvbnMgOiBzZWN0aW9ucy5maWx0ZXIocyA9PiBzLmlkICE9PSAnZGV2ZWxvcGVyJylcbiAgfVxuXG4gIC8qKiBBIG1hY3JvIGNhdGVnb3J5J3MgcGFnZSwgaW5zaWRlIFNldHRpbmdzLiAqL1xuICBnZXQgaW5DaGlsZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHJvdXRlLm1hdGNoZWQubGVuZ3RoID4gMVxuICB9XG5cbiAgLyoqIFdpLUZpJ3Mgb3IgU3lzdGVtJ3Mgb3duIHBhZ2UsIG9wZW5lZCBhdCBpdHMgb3duIGFkZHJlc3MuICovXG4gIGdldCBvd25QYWdlICgpOiAnbmV0d29yaycgfCAnc3lzdGVtJyB8IG51bGwge1xuICAgIGlmICh0aGlzLiRyb3V0ZS5uYW1lID09PSAnV2lmaScpIHJldHVybiAnbmV0d29yaydcbiAgICBpZiAodGhpcy4kcm91dGUubmFtZSA9PT0gJ1N5c3RlbScpIHJldHVybiAnc3lzdGVtJ1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvKiogVGhlIHNlY3Rpb24gc2hvd246IHRoZSBhbmNob3IncywgTWFjcm9zIGZvciBhIGNhdGVnb3J5LCBlbHNlIHRoZSBmaXJzdCBvbiBhIHdpZGVyIHNjcmVlbi4gKi9cbiAgZ2V0IGN1cnJlbnQgKCk6IFNldHRpbmdzU2VjdGlvbiB8IG51bGwge1xuICAgIGlmICh0aGlzLm93blBhZ2UpIHJldHVybiB0aGlzLnNlY3Rpb25zLmZpbmQocyA9PiBzLmlkID09PSB0aGlzLm93blBhZ2UpID8/IG51bGxcbiAgICBpZiAodGhpcy5pbkNoaWxkKSByZXR1cm4gdGhpcy5zZWN0aW9ucy5maW5kKHMgPT4gcy5pZCA9PT0gJ21hY3JvcycpID8/IG51bGxcbiAgICBjb25zdCBzZWN0aW9uID0gc2V0dGluZ3NTZWN0aW9uRm9yKHRoaXMuJHJvdXRlLmhhc2gsIHRoaXMuc2VjdGlvbnMpXG4gICAgaWYgKHNlY3Rpb24gfHwgdGhpcy5pc01vYmlsZVZpZXdwb3J0KSByZXR1cm4gc2VjdGlvblxuICAgIHJldHVybiB0aGlzLnNlY3Rpb25zLmZpbmQocyA9PiAhcy5wYWdlKSA/PyBudWxsXG4gIH1cblxuICAvKiogV2hhdCB0aGUgc2VhcmNoIGJveCBob2xkczsgaXQgbmFycm93cyB0aGUgbGlzdCBvbiB0aGUgbGVmdC4gKi9cbiAgcXVlcnkgPSAnJ1xuXG4gIC8qKiBUaGUgc2VjdGlvbnMgdGhlIGxpc3Qgc2hvd3M6IGFsbCBvZiB0aGVtIGJ1dCBEZXZlbG9wZXIgbW9kZSwgd2hpY2ggc2l0cyBhcGFydCBiZWxvdy4gKi9cbiAgZ2V0IGxpc3RlZCAoKTogU2V0dGluZ3NTZWN0aW9uW10ge1xuICAgIHJldHVybiBzZWFyY2hTZXR0aW5nc1NlY3Rpb25zKHRoaXMuc2VjdGlvbnMuZmlsdGVyKHMgPT4gcy5pZCAhPT0gJ2RldmVsb3BlcicpLCB0aGlzLnF1ZXJ5KVxuICB9XG5cbiAgLyoqIERldmVsb3BlciBtb2RlOiBpdHMgb3duIHRpbGUgYmVsb3cgdGhlIGxpc3QsIG9mZiB1bmxlc3Mgc29tZW9uZSB0dXJuZWQgaXQgb24uIEhpZGRlbiB3aGVuIGEgc2VhcmNoIGxlYXZlcyBpdCBvdXQuICovXG4gIGdldCBkZXZlbG9wZXIgKCk6IFNldHRpbmdzU2VjdGlvbiB8IG51bGwge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zLmZpbmQocyA9PiBzLmlkID09PSAnZGV2ZWxvcGVyJykgPz8gbnVsbFxuICAgIGlmICghc2VjdGlvbikgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gc2VhcmNoU2V0dGluZ3NTZWN0aW9ucyhbc2VjdGlvbl0sIHRoaXMucXVlcnkpLmxlbmd0aCA/IHNlY3Rpb24gOiBudWxsXG4gIH1cblxuICBnZXQgZGV2ZWxvcGVyTGluZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBzdGF0ZSA9IGRldk1vZGVTdGF0ZS5lbmFibGVkID09PSBudWxsID8gJycgOiBkZXZNb2RlU3RhdGUuZW5hYmxlZCA/ICdPbi4gJyA6ICdPZmYuICdcbiAgICByZXR1cm4gYCR7c3RhdGV9JHt0aGlzLmRldmVsb3Blcj8uYmx1cmIgPz8gJyd9YFxuICB9XG5cbiAgZ2V0IHByaW50ZXJOYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBwcmludGVyTmFtZVBhcnRzKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXREaXNwbGF5TmFtZSddIGFzIHN0cmluZykubmFtZVxuICB9XG5cbiAgZ2V0IHNob3dMaXN0ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuaXNNb2JpbGVWaWV3cG9ydCB8fCAhdGhpcy5jdXJyZW50XG4gIH1cblxuICBnZXQgc2hvd1BhbmUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuY3VycmVudFxuICB9XG5cbiAgc2hvd3MgKGFuY2hvcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudD8uYW5jaG9ycy5pbmNsdWRlcyhhbmNob3IpID8/IGZhbHNlXG4gIH1cblxuICBnZXQgbGlzdFRvICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBzY29wZWRQYXRoKCcvc2V0dGluZ3MnLCBhY3RpdmVTbHVnKCkpXG4gIH1cblxuICBsaW5rVG8gKHNlY3Rpb246IFNldHRpbmdzU2VjdGlvbik6IHN0cmluZyB7XG4gICAgaWYgKHNlY3Rpb24ucGFnZSkgcmV0dXJuIHNjb3BlZFBhdGgoc2VjdGlvbi5wYWdlLCBhY3RpdmVTbHVnKCkpXG4gICAgcmV0dXJuIGAke3RoaXMubGlzdFRvfSMke3NlY3Rpb24uYW5jaG9yc1swXX1gXG4gIH1cblxuICBnZXQgdXBkYXRlQ291bnQgKCk6IG51bWJlciB7XG4gICAgY29uc3QgaW5mbyA9ICh0aGlzLiRzdG9yZS5zdGF0ZS52ZXJzaW9uLnZlcnNpb25faW5mbyA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICBjb25zdCBoYXNVcGRhdGUgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWyd2ZXJzaW9uL2hhc1VwZGF0ZSddIGFzIChjb21wb25lbnQ6IHN0cmluZykgPT4gYm9vbGVhblxuICAgIC8vIFRoZSBPUyBwYWNrYWdlcyBjb3VudCB0b28sIGFzIHRoZSBVcGRhdGVzIGNhcmQgc2hvd3MgdGhlbS5cbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaW5mbykuZmlsdGVyKG5hbWUgPT4gaGFzVXBkYXRlKG5hbWUpKS5sZW5ndGhcbiAgfVxuXG4gIC8qKiBXaGF0J3MgYmVzaWRlIGEgc2VjdGlvbidzIG5hbWU6IHRoZSBwcmludGVyJ3MgbmFtZSwgaG93IG1hbnkgY2FtZXJhcywgd2hldGhlciBpdCdzIHVwIHRvIGRhdGUuICovXG4gIGhpbnRPZiAoc2VjdGlvbjogU2V0dGluZ3NTZWN0aW9uKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHNlY3Rpb24uaWQpIHtcbiAgICAgIGNhc2UgJ2dlbmVyYWwnOlxuICAgICAgICByZXR1cm4gcHJpbnRlck5hbWVQYXJ0cyh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0RGlzcGxheU5hbWUnXSBhcyBzdHJpbmcpLm5hbWVcbiAgICAgIGNhc2UgJ3VwZGF0ZXMnOiB7XG4gICAgICAgIC8vIFRoZSBwcmludGVyJ3Mgb3duIHNvZnR3YXJlLCBhcyBpdHMgQXV4IEFQSSBzYXlzOyBlbHNlIHdoYXQgTW9vbnJha2VyJ3MgdXBkYXRlciBsaXN0cy5cbiAgICAgICAgY29uc3Qgb3duID0gdXBkYXRlV2F0Y2guc3RhdHVzXG4gICAgICAgIGlmIChvd24pIHJldHVybiBvd24udXBkYXRlX2F2YWlsYWJsZSAmJiBvd24udGFyZ2V0X3ZlcnNpb24gIT09IG93bi5jdXJyZW50X3ZlcnNpb24gPyAndXBkYXRlIHJlYWR5JyA6ICd1cCB0byBkYXRlJ1xuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMuJHN0b3JlLnN0YXRlLnZlcnNpb24udmVyc2lvbl9pbmZvID8/IHt9KS5sZW5ndGgpIHJldHVybiAnJ1xuICAgICAgICBpZiAoIXRoaXMudXBkYXRlQ291bnQpIHJldHVybiAndXAgdG8gZGF0ZSdcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlQ291bnQgPT09IDEgPyAnMSB1cGRhdGUnIDogYCR7dGhpcy51cGRhdGVDb3VudH0gdXBkYXRlc2BcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2NhbWVyYXMnOlxuICAgICAgICByZXR1cm4gY291bnRPck5vbmUoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3dlYmNhbXMvZ2V0V2ViY2FtcyddIGFzIHVua25vd25bXSkubGVuZ3RoKVxuICAgICAgY2FzZSAnbWF0ZXJpYWxzJzpcbiAgICAgICAgcmV0dXJuIGNvdW50T3JOb25lKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0VGVtcFByZXNldHMnXSBhcyB1bmtub3duW10pLmxlbmd0aClcbiAgICAgIGNhc2UgJ21hY3Jvcyc6XG4gICAgICAgIC8vIEV2ZXJ5IG1hY3JvIHRoZSBNYWNyb3MgY2FyZCBtYW5hZ2VzLCBoaWRkZW4gZnJvbSB0aGUgZGFzaGJvYXJkIG9yIG5vdC5cbiAgICAgICAgcmV0dXJuIGNvdW50T3JOb25lKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydtYWNyb3MvZ2V0TWFjcm9zJ10gYXMgdW5rbm93bltdKS5sZW5ndGgpXG4gICAgICBjYXNlICdzeXN0ZW0nOlxuICAgICAgICByZXR1cm4gJ3Jlc3RhcnQsIGxvZ3MnXG4gICAgICBjYXNlICdkZXZlbG9wZXInOlxuICAgICAgICByZXR1cm4gZGV2TW9kZVN0YXRlLmVuYWJsZWQgPT09IG51bGwgPyAnJyA6IGRldk1vZGVTdGF0ZS5lbmFibGVkID8gJ29uJyA6ICdvZmYnXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJydcbiAgICB9XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5zZXR0aW5ncy1wYWdlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMnB4O1xuICB9XG5cbiAgLnNldHRpbmdzLWxvYWRpbmcge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5zZXR0aW5ncy1iYWNrIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7XG4gICAgZ2FwOiA0cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKSAhaW1wb3J0YW50O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNTAwO1xuICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgfVxuXG4gIC5zZXR0aW5ncy1zZWFyY2gge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogbm9uZTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIG1pbi1oZWlnaHQ6IDQ0cHg7XG4gICAgcGFkZGluZzogMCAxNHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICAmOmZvY3VzLXdpdGhpbiB7XG4gICAgICBib3JkZXItY29sb3I6IHZhcigtLW0zZC1hY2NlbnQtYm9yZGVyKTtcbiAgICB9XG5cbiAgICBpbnB1dCB7XG4gICAgICBmbGV4OiAxIDEgYXV0bztcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgfVxuICB9XG5cbiAgLnNldHRpbmdzLWJvZHkge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAyODBweCBtaW5tYXgoMCwgMWZyKTtcbiAgICBnYXA6IDIwcHg7XG4gICAgYWxpZ24taXRlbXM6IHN0YXJ0O1xuICB9XG5cbiAgLnNldHRpbmdzLXBhZ2UtLXBob25lIHtcbiAgICAuc2V0dGluZ3MtYm9keSB7XG4gICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IG1pbm1heCgwLCAxZnIpO1xuICAgIH1cblxuICB9XG5cbiAgLnNldHRpbmdzLXNpZGUge1xuICAgIHBvc2l0aW9uOiBzdGlja3k7XG4gICAgdG9wOiA4NHB4O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE2cHg7XG4gIH1cblxuICAuc2V0dGluZ3MtcGFnZS0tcGhvbmUgLnNldHRpbmdzLXNpZGUge1xuICAgIHBvc2l0aW9uOiBzdGF0aWM7XG4gIH1cblxuICAuc2V0dGluZ3MtbGlzdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIHBhZGRpbmc6IDA7XG4gICAgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgfVxuXG4gIC5zZXR0aW5ncy1saXN0X19pdGVtIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIG1pbi1oZWlnaHQ6IDUycHg7XG4gICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG5cbiAgICAmOmZpcnN0LWNoaWxkIHtcbiAgICAgIGJvcmRlci10b3A6IDA7XG4gICAgfVxuXG4gICAgJjpob3ZlciB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICAgIH1cbiAgfVxuXG4gIC5zZXR0aW5ncy1saXN0X19pdGVtLS1vbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuICB9XG5cbiAgLnNldHRpbmdzLWxpc3RfX2ljbyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBmbGV4OiBub25lO1xuICAgIHBsYWNlLWl0ZW1zOiBjZW50ZXI7XG4gICAgd2lkdGg6IDM2cHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAuc2V0dGluZ3MtbGlzdF9faXRlbS0tb24gLnNldHRpbmdzLWxpc3RfX2ljbyB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gIH1cblxuICAuc2V0dGluZ3MtbGlzdF9fbGFiZWwge1xuICAgIGZsZXg6IDEgMSBhdXRvO1xuICAgIG1pbi13aWR0aDogMDtcblxuICAgIHNtYWxsIHtcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgICBsaW5lLWhlaWdodDogMS4zNTtcbiAgICB9XG4gIH1cblxuICAuc2V0dGluZ3Mta2VwdCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDAgNHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5zZXR0aW5ncy1saXN0X19oaW50IHtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIG1heC13aWR0aDogNDUlO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNDAwO1xuICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIH1cblxuICAuc2V0dGluZ3MtbGlzdF9faGludC0td2FybiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKTtcbiAgfVxuXG4gIC5zZXR0aW5ncy1saXN0X19nbyB7XG4gICAgZmxleDogbm9uZTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgfVxuXG4gIC5zZXR0aW5ncy1saXN0X19ub25lIHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMTZweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC5zZXR0aW5ncy1wYW5lIHtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvdmlld3MvU2V0dGluZ3MudnVlIn0=