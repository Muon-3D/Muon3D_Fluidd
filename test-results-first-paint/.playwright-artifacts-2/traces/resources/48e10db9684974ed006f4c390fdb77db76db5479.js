/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import MaintenanceMixin from "/src/mixins/maintenance.ts";
import { meshProfileCommand, validProfileName } from "/src/services/maintenance/model.ts";
import MaintenanceTile from "/src/components/maintenance/MaintenanceTile.vue";
import TonePill from "/src/components/printers/TonePill.vue";
import FileNameDialog from "/src/components/widgets/filesystem/FileNameDialog.vue";
let MeshProfiles = class extends Mixins(MaintenanceMixin) {
  saveOpen = false;
  get profiles() {
    return this.$store.getters["mesh/getBedMeshProfiles"] ?? [];
  }
  get activeName() {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? "";
  }
  onEvidence() {
    this.recordIfDone();
  }
  async load(name) {
    if (!this.controlReady || !validProfileName(name) || !this.profiles.some((p) => p.name === name)) return;
    const target = this.maintenanceTarget;
    if (this.printerPrinting && !await this.$confirm("The nozzle follows the new mesh from the next move.", { title: `Load ${name} while printing?`, buttonTrueText: "Load it" })) return;
    if (!this.controlReady || target !== this.maintenanceTarget) return;
    this.sendGcode(meshProfileCommand("LOAD", name));
  }
  async remove(name) {
    if (!this.controlReady || !validProfileName(name) || !this.profiles.some((p) => p.name === name && !p.adaptive)) return;
    const target = this.maintenanceTarget;
    if (!await this.$confirm("It goes from printer.cfg the next time Klipper saves.", { title: `Remove the mesh ${name}?`, buttonTrueText: "Remove", danger: true })) return;
    if (!this.controlReady || target !== this.maintenanceTarget) return;
    this.sendGcode(meshProfileCommand("REMOVE", name));
  }
  async clear() {
    if (!this.controlReady) return;
    const target = this.maintenanceTarget;
    if (this.printerPrinting && !await this.$confirm("The nozzle stops following the bed from the next move.", { title: "Clear the mesh while printing?", buttonTrueText: "Clear it", danger: true })) return;
    if (!this.controlReady || target !== this.maintenanceTarget) return;
    this.sendGcode("BED_MESH_CLEAR");
  }
  saveAs(name) {
    if (!this.controlReady || !this.activeName) return;
    if (!validProfileName(name)) {
      this.$store.dispatch("notifications/pushNotification", { title: "Not saved", description: "A profile name takes letters, numbers, spaces, dots, dashes and underscores.", type: "error", snackbar: true });
      return;
    }
    this.sendGcode(meshProfileCommand("SAVE", name));
  }
};
__decorateClass([
  Watch("evidence", { immediate: true })
], MeshProfiles.prototype, "onEvidence", 1);
MeshProfiles = __decorateClass([
  Component({ components: { MaintenanceTile, TonePill, FileNameDialog } })
], MeshProfiles);
const _sfc_main = MeshProfiles;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("maintenance-tile", { attrs: { "title": "Profiles", "icon": "mesh", "flush": "", "locked": _vm.controlLock, "data-tid": "mesh-profiles" }, scopedSlots: _vm._u([{ key: "aside", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost mprof__head-btn", attrs: { "type": "button", "disabled": !_vm.controlReady || !_vm.activeName, "data-tid": "mesh-clear" }, on: { "click": _vm.clear } }, [_vm._v(" Clear ")]), _c("button", { staticClass: "cbtn mprof__head-btn", attrs: { "type": "button", "disabled": !_vm.controlReady || !_vm.activeName, "data-tid": "mesh-save-as" }, on: { "click": function($event) {
      _vm.saveOpen = true;
    } } }, [_c(__unplugin_components_0, { attrs: { "name": "plus", "small": "" } }), _vm._v(" Save current ")], 1)];
  }, proxy: true }]) }, [_vm.profiles.length ? _c("ul", { staticClass: "mprof__list" }, _vm._l(_vm.profiles, function(profile) {
    return _c("li", { key: profile.name, staticClass: "mprof__row", attrs: { "data-profile": profile.name } }, [_c("span", { staticClass: "mprof__text" }, [_c("span", { staticClass: "mprof__name" }, [_vm._v(_vm._s(profile.name))]), _c("span", { staticClass: "mprof__sub" }, [_vm._v(_vm._s(profile.range.toFixed(3)) + " mm spread" + _vm._s(profile.adaptive ? " \xB7 adaptive" : ""))])]), profile.active ? _c("tone-pill", { attrs: { "tone": "ok", "dot": false } }, [_vm._v(" Active ")]) : _c("button", { staticClass: "cbtn mprof__load", attrs: { "type": "button", "disabled": !_vm.controlReady, "aria-label": `Load ${profile.name}` }, on: { "click": function($event) {
      return _vm.load(profile.name);
    } } }, [_vm._v(" Load ")]), !profile.adaptive ? _c("button", { staticClass: "mprof__remove", attrs: { "type": "button", "disabled": !_vm.controlReady, "aria-label": `Remove ${profile.name}`, "title": "Remove" }, on: { "click": function($event) {
      return _vm.remove(profile.name);
    } } }, [_c(__unplugin_components_1, { attrs: { "name": "trash" } })], 1) : _vm._e()], 1);
  }), 0) : _c("div", { staticClass: "mprof__empty" }, [_c("span", { staticClass: "mprof__ico" }, [_c(__unplugin_components_2, { attrs: { "name": "mesh" } })], 1), _c("b", [_vm._v("No saved profiles yet")]), _c("p", [_vm._v("Calibrate the mesh, then save it under a name.")])]), _vm.saveConfigPending ? _c("div", { staticClass: "mprof__pending", attrs: { "data-tid": "mesh-pending" } }, [_c("span", [_vm._v("Saved profiles and new results reach printer.cfg when Klipper saves them, which restarts it.")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !!_vm.saveBlocked, "title": _vm.saveBlocked }, on: { "click": _vm.saveResults } }, [_vm._v(" Save to printer.cfg ")])]) : _vm._e(), _vm.saveOpen ? _c("file-name-dialog", { attrs: { "title": "Save the mesh as", "label": "Profile name", "name": _vm.activeName === "default" ? "" : _vm.activeName }, on: { "save": _vm.saveAs }, model: { value: _vm.saveOpen, callback: function($$v) {
    _vm.saveOpen = $$v;
  }, expression: "saveOpen" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/maintenance/MeshProfiles.vue?vue&type=style&index=0&scoped=fd441210&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "fd441210",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/maintenance/MeshProfiles.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQW1IQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFTQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBSUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFyQ0E7QUFBQSxFQURBO0FBQUEsR0FaQSxhQWFBO0FBYkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTWVzaFByb2ZpbGVzLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtYWludGVuYW5jZS10aWxlXG4gICAgdGl0bGU9XCJQcm9maWxlc1wiXG4gICAgaWNvbj1cIm1lc2hcIlxuICAgIGZsdXNoXG4gICAgOmxvY2tlZD1cImNvbnRyb2xMb2NrXCJcbiAgICBkYXRhLXRpZD1cIm1lc2gtcHJvZmlsZXNcIlxuICA+XG4gICAgPHRlbXBsYXRlICNhc2lkZT5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdCBtcHJvZl9faGVhZC1idG5cIlxuICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5IHx8ICFhY3RpdmVOYW1lXCJcbiAgICAgICAgZGF0YS10aWQ9XCJtZXNoLWNsZWFyXCJcbiAgICAgICAgQGNsaWNrPVwiY2xlYXJcIlxuICAgICAgPlxuICAgICAgICBDbGVhclxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gbXByb2ZfX2hlYWQtYnRuXCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeSB8fCAhYWN0aXZlTmFtZVwiXG4gICAgICAgIGRhdGEtdGlkPVwibWVzaC1zYXZlLWFzXCJcbiAgICAgICAgQGNsaWNrPVwic2F2ZU9wZW4gPSB0cnVlXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwicGx1c1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAgU2F2ZSBjdXJyZW50XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPHVsXG4gICAgICB2LWlmPVwicHJvZmlsZXMubGVuZ3RoXCJcbiAgICAgIGNsYXNzPVwibXByb2ZfX2xpc3RcIlxuICAgID5cbiAgICAgIDxsaVxuICAgICAgICB2LWZvcj1cInByb2ZpbGUgaW4gcHJvZmlsZXNcIlxuICAgICAgICA6a2V5PVwicHJvZmlsZS5uYW1lXCJcbiAgICAgICAgY2xhc3M9XCJtcHJvZl9fcm93XCJcbiAgICAgICAgOmRhdGEtcHJvZmlsZT1cInByb2ZpbGUubmFtZVwiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibXByb2ZfX3RleHRcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cIm1wcm9mX19uYW1lXCI+e3sgcHJvZmlsZS5uYW1lIH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXByb2ZfX3N1YlwiPnt7IHByb2ZpbGUucmFuZ2UudG9GaXhlZCgzKSB9fSBtbSBzcHJlYWR7eyBwcm9maWxlLmFkYXB0aXZlID8gJyDCtyBhZGFwdGl2ZScgOiAnJyB9fTwvc3Bhbj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8dG9uZS1waWxsXG4gICAgICAgICAgdi1pZj1cInByb2ZpbGUuYWN0aXZlXCJcbiAgICAgICAgICB0b25lPVwib2tcIlxuICAgICAgICAgIDpkb3Q9XCJmYWxzZVwiXG4gICAgICAgID5cbiAgICAgICAgICBBY3RpdmVcbiAgICAgICAgPC90b25lLXBpbGw+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gbXByb2ZfX2xvYWRcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiYExvYWQgJHtwcm9maWxlLm5hbWV9YFwiXG4gICAgICAgICAgQGNsaWNrPVwibG9hZChwcm9maWxlLm5hbWUpXCJcbiAgICAgICAgPlxuICAgICAgICAgIExvYWRcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWlmPVwiIXByb2ZpbGUuYWRhcHRpdmVcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwibXByb2ZfX3JlbW92ZVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWNvbnRyb2xSZWFkeVwiXG4gICAgICAgICAgOmFyaWEtbGFiZWw9XCJgUmVtb3ZlICR7cHJvZmlsZS5uYW1lfWBcIlxuICAgICAgICAgIHRpdGxlPVwiUmVtb3ZlXCJcbiAgICAgICAgICBAY2xpY2s9XCJyZW1vdmUocHJvZmlsZS5uYW1lKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwidHJhc2hcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvbGk+XG4gICAgPC91bD5cbiAgICA8ZGl2XG4gICAgICB2LWVsc2VcbiAgICAgIGNsYXNzPVwibXByb2ZfX2VtcHR5XCJcbiAgICA+XG4gICAgICA8c3BhbiBjbGFzcz1cIm1wcm9mX19pY29cIj48ZnJhbWUtaWNvbiBuYW1lPVwibWVzaFwiIC8+PC9zcGFuPlxuICAgICAgPGI+Tm8gc2F2ZWQgcHJvZmlsZXMgeWV0PC9iPlxuICAgICAgPHA+Q2FsaWJyYXRlIHRoZSBtZXNoLCB0aGVuIHNhdmUgaXQgdW5kZXIgYSBuYW1lLjwvcD5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJzYXZlQ29uZmlnUGVuZGluZ1wiXG4gICAgICBjbGFzcz1cIm1wcm9mX19wZW5kaW5nXCJcbiAgICAgIGRhdGEtdGlkPVwibWVzaC1wZW5kaW5nXCJcbiAgICA+XG4gICAgICA8c3Bhbj5TYXZlZCBwcm9maWxlcyBhbmQgbmV3IHJlc3VsdHMgcmVhY2ggcHJpbnRlci5jZmcgd2hlbiBLbGlwcGVyIHNhdmVzIHRoZW0sIHdoaWNoIHJlc3RhcnRzIGl0Ljwvc3Bhbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgOmRpc2FibGVkPVwiISFzYXZlQmxvY2tlZFwiXG4gICAgICAgIDp0aXRsZT1cInNhdmVCbG9ja2VkXCJcbiAgICAgICAgQGNsaWNrPVwic2F2ZVJlc3VsdHNcIlxuICAgICAgPlxuICAgICAgICBTYXZlIHRvIHByaW50ZXIuY2ZnXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cblxuICAgIDxmaWxlLW5hbWUtZGlhbG9nXG4gICAgICB2LWlmPVwic2F2ZU9wZW5cIlxuICAgICAgdi1tb2RlbD1cInNhdmVPcGVuXCJcbiAgICAgIHRpdGxlPVwiU2F2ZSB0aGUgbWVzaCBhc1wiXG4gICAgICBsYWJlbD1cIlByb2ZpbGUgbmFtZVwiXG4gICAgICA6bmFtZT1cImFjdGl2ZU5hbWUgPT09ICdkZWZhdWx0JyA/ICcnIDogYWN0aXZlTmFtZVwiXG4gICAgICBAc2F2ZT1cInNhdmVBc1wiXG4gICAgLz5cbiAgPC9tYWludGVuYW5jZS10aWxlPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTWFpbnRlbmFuY2VNaXhpbiBmcm9tICdAL21peGlucy9tYWludGVuYW5jZSdcbmltcG9ydCB0eXBlIHsgQmVkTWVzaFByb2ZpbGVMaXN0RW50cnkgfSBmcm9tICdAL3N0b3JlL21lc2gvdHlwZXMnXG5pbXBvcnQgeyBtZXNoUHJvZmlsZUNvbW1hbmQsIHZhbGlkUHJvZmlsZU5hbWUgfSBmcm9tICdAL3NlcnZpY2VzL21haW50ZW5hbmNlL21vZGVsJ1xuaW1wb3J0IE1haW50ZW5hbmNlVGlsZSBmcm9tICcuL01haW50ZW5hbmNlVGlsZS52dWUnXG5pbXBvcnQgVG9uZVBpbGwgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL1RvbmVQaWxsLnZ1ZSdcbmltcG9ydCBGaWxlTmFtZURpYWxvZyBmcm9tICdAL2NvbXBvbmVudHMvd2lkZ2V0cy9maWxlc3lzdGVtL0ZpbGVOYW1lRGlhbG9nLnZ1ZSdcblxuLyoqXG4gKiBTYXZlZCBtZXNoIHByb2ZpbGVzIHdpdGggaG93IHVuZXZlbiBlYWNoIGlzLCBsb2FkaW5nIGFuZCByZW1vdmluZ1xuICogdGhlbSwgc2F2aW5nIHRoZSBtZXNoIGluIHVzZSB1bmRlciBhIG5hbWUsIGNsZWFyaW5nIGl0LCBhbmQgc2F2aW5nIHRvXG4gKiBwcmludGVyLmNmZyB3aGVuIEtsaXBwZXIgaGFzIHJlc3VsdHMgd2FpdGluZy4gTWVhc3VyaW5nIHRoZSBiZWQgaXMgdGhlXG4gKiBoZWFkZXIncyBDYWxpYnJhdGUgbWVzaC5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTWFpbnRlbmFuY2VUaWxlLCBUb25lUGlsbCwgRmlsZU5hbWVEaWFsb2cgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVzaFByb2ZpbGVzIGV4dGVuZHMgTWl4aW5zKE1haW50ZW5hbmNlTWl4aW4pIHtcbiAgc2F2ZU9wZW4gPSBmYWxzZVxuXG4gIGdldCBwcm9maWxlcyAoKTogQmVkTWVzaFByb2ZpbGVMaXN0RW50cnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLiRzdG9yZS5nZXR0ZXJzWydtZXNoL2dldEJlZE1lc2hQcm9maWxlcyddIGFzIEJlZE1lc2hQcm9maWxlTGlzdEVudHJ5W10pID8/IFtdXG4gIH1cblxuICBnZXQgYWN0aXZlTmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmJlZF9tZXNoPy5wcm9maWxlX25hbWUgPz8gJydcbiAgfVxuXG4gIC8qKiBBIG1lYXN1cmVtZW50IHRoYXQgZmluaXNoZXMgd2hpbGUgdGhpcyBwYWdlIGlzIG9wZW4gY291bnRzIG9uIE1haW50ZW5hbmNlIHRvby4gKi9cbiAgQFdhdGNoKCdldmlkZW5jZScsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIG9uRXZpZGVuY2UgKCkge1xuICAgIHRoaXMucmVjb3JkSWZEb25lKClcbiAgfVxuXG4gIGFzeW5jIGxvYWQgKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgIXZhbGlkUHJvZmlsZU5hbWUobmFtZSkgfHwgIXRoaXMucHJvZmlsZXMuc29tZShwID0+IHAubmFtZSA9PT0gbmFtZSkpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMubWFpbnRlbmFuY2VUYXJnZXRcbiAgICAvLyBNaWQtcHJpbnQsIGEgZGlmZmVyZW50IG1lc2ggbW92ZXMgdGhlIG5venpsZSB1bmRlciB0aGUgcGFydC5cbiAgICBpZiAodGhpcy5wcmludGVyUHJpbnRpbmcgJiYgIShhd2FpdCB0aGlzLiRjb25maXJtKCdUaGUgbm96emxlIGZvbGxvd3MgdGhlIG5ldyBtZXNoIGZyb20gdGhlIG5leHQgbW92ZS4nLCB7IHRpdGxlOiBgTG9hZCAke25hbWV9IHdoaWxlIHByaW50aW5nP2AsIGJ1dHRvblRydWVUZXh0OiAnTG9hZCBpdCcgfSkpKSByZXR1cm5cbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8IHRhcmdldCAhPT0gdGhpcy5tYWludGVuYW5jZVRhcmdldCkgcmV0dXJuXG4gICAgdGhpcy5zZW5kR2NvZGUobWVzaFByb2ZpbGVDb21tYW5kKCdMT0FEJywgbmFtZSkpXG4gIH1cblxuICBhc3luYyByZW1vdmUgKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgIXZhbGlkUHJvZmlsZU5hbWUobmFtZSkgfHwgIXRoaXMucHJvZmlsZXMuc29tZShwID0+IHAubmFtZSA9PT0gbmFtZSAmJiAhcC5hZGFwdGl2ZSkpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMubWFpbnRlbmFuY2VUYXJnZXRcbiAgICBpZiAoIShhd2FpdCB0aGlzLiRjb25maXJtKCdJdCBnb2VzIGZyb20gcHJpbnRlci5jZmcgdGhlIG5leHQgdGltZSBLbGlwcGVyIHNhdmVzLicsIHsgdGl0bGU6IGBSZW1vdmUgdGhlIG1lc2ggJHtuYW1lfT9gLCBidXR0b25UcnVlVGV4dDogJ1JlbW92ZScsIGRhbmdlcjogdHJ1ZSB9KSkpIHJldHVyblxuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgdGFyZ2V0ICE9PSB0aGlzLm1haW50ZW5hbmNlVGFyZ2V0KSByZXR1cm5cbiAgICB0aGlzLnNlbmRHY29kZShtZXNoUHJvZmlsZUNvbW1hbmQoJ1JFTU9WRScsIG5hbWUpKVxuICB9XG5cbiAgYXN5bmMgY2xlYXIgKCkge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkpIHJldHVyblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMubWFpbnRlbmFuY2VUYXJnZXRcbiAgICBpZiAodGhpcy5wcmludGVyUHJpbnRpbmcgJiYgIShhd2FpdCB0aGlzLiRjb25maXJtKCdUaGUgbm96emxlIHN0b3BzIGZvbGxvd2luZyB0aGUgYmVkIGZyb20gdGhlIG5leHQgbW92ZS4nLCB7IHRpdGxlOiAnQ2xlYXIgdGhlIG1lc2ggd2hpbGUgcHJpbnRpbmc/JywgYnV0dG9uVHJ1ZVRleHQ6ICdDbGVhciBpdCcsIGRhbmdlcjogdHJ1ZSB9KSkpIHJldHVyblxuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgdGFyZ2V0ICE9PSB0aGlzLm1haW50ZW5hbmNlVGFyZ2V0KSByZXR1cm5cbiAgICB0aGlzLnNlbmRHY29kZSgnQkVEX01FU0hfQ0xFQVInKVxuICB9XG5cbiAgc2F2ZUFzIChuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbFJlYWR5IHx8ICF0aGlzLmFjdGl2ZU5hbWUpIHJldHVyblxuICAgIGlmICghdmFsaWRQcm9maWxlTmFtZShuYW1lKSkge1xuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ25vdGlmaWNhdGlvbnMvcHVzaE5vdGlmaWNhdGlvbicsIHsgdGl0bGU6ICdOb3Qgc2F2ZWQnLCBkZXNjcmlwdGlvbjogJ0EgcHJvZmlsZSBuYW1lIHRha2VzIGxldHRlcnMsIG51bWJlcnMsIHNwYWNlcywgZG90cywgZGFzaGVzIGFuZCB1bmRlcnNjb3Jlcy4nLCB0eXBlOiAnZXJyb3InLCBzbmFja2JhcjogdHJ1ZSB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc2VuZEdjb2RlKG1lc2hQcm9maWxlQ29tbWFuZCgnU0FWRScsIG5hbWUpKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubXByb2ZfX2hlYWQtYnRuIHtcbiAgICBoZWlnaHQ6IDMycHg7XG4gIH1cblxuICAubXByb2ZfX2xpc3Qge1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAwO1xuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gIH1cblxuICAubXByb2ZfX3JvdyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBtaW4taGVpZ2h0OiA1MnB4O1xuICAgIHBhZGRpbmc6IDEwcHggMThweDtcblxuICAgICsgLm1wcm9mX19yb3cge1xuICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLW0zZC1ib3JkZXIpO1xuICAgIH1cbiAgfVxuXG4gIC5tcHJvZl9fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgMDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi13aWR0aDogMDtcbiAgfVxuXG4gIC5tcHJvZl9fbmFtZSB7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgb3ZlcmZsb3ctd3JhcDogYW55d2hlcmU7XG4gIH1cblxuICAubXByb2ZfX3N1YiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtcztcbiAgfVxuXG4gIC5tcHJvZl9fbG9hZCB7XG4gICAgZmxleDogbm9uZTtcbiAgfVxuXG4gIC5tcHJvZl9fcmVtb3ZlIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGZsZXg6IG5vbmU7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDM2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICAmOmRpc2FibGVkIHtcbiAgICAgIG9wYWNpdHk6IDAuNDU7XG4gICAgfVxuICB9XG5cbiAgLm1wcm9mX19lbXB0eSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogMjRweCAxOHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcblxuICAgIHAge1xuICAgICAgbWFyZ2luOiAwO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cblxuICAubXByb2ZfX2ljbyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBwbGFjZS1pdGVtczogY2VudGVyO1xuICAgIHdpZHRoOiAzNnB4O1xuICAgIGhlaWdodDogMzZweDtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAubXByb2ZfX3BlbmRpbmcge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4IDE0cHg7XG4gICAgbWFyZ2luOiA2cHggMThweCAxMHB4O1xuICAgIHBhZGRpbmc6IDEycHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtd2FybmluZykgMTAlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBmb250LXNpemU6IDEzcHg7XG5cbiAgICBzcGFuIHtcbiAgICAgIGZsZXg6IDEgMSAyMDBweDtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9tYWludGVuYW5jZS9NZXNoUHJvZmlsZXMudnVlIn0=