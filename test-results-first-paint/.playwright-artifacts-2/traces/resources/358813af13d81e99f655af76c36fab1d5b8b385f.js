/* unplugin-vue-components disabled */import __unplugin_components_6 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import { VIcon as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import { VDialog as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import JobsMixin, {} from "/src/mixins/jobs.ts";
import { EventBus } from "/src/eventBus.ts";
import { isGcodeFile, jobTitle, parentFolder, readyChecks } from "/src/services/jobs/model.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { slicerPresence } from "/src/services/slicer-bridge/slicerUrl.ts";
import { holdModels, isSlicerModel } from "/src/services/slicer-bridge/handover.ts";
let JobReadyDialog = class extends Mixins(JobsMixin) {
  open = false;
  mode = "gcode";
  filename = "";
  models = [];
  created() {
    EventBus.bus.$on("job-ready", this.showJob);
    EventBus.bus.$on("model-dropped", this.showModels);
  }
  beforeDestroy() {
    EventBus.bus.$off("job-ready", this.showJob);
    EventBus.bus.$off("model-dropped", this.showModels);
  }
  showJob(filename) {
    this.mode = "gcode";
    this.filename = filename;
    this.open = true;
    this.loadFiles();
  }
  /** The model files dropped or picked: kept (not reactive) until Open Slice or the next drop. */
  modelFiles = [];
  showModels(files) {
    this.mode = "model";
    this.modelFiles = Object.freeze([...files]);
    this.models = files.map((f) => f.name);
    this.open = true;
  }
  /** The models the slicer opens (STL, OBJ, 3MF), and the ones it can't (STEP). */
  get sliceable() {
    return this.models.filter(isSlicerModel);
  }
  get unsliceable() {
    return this.models.filter((name) => !isSlicerModel(name));
  }
  /**
   * Open Slice: the models it opens go with it (KAN-2191), and /slice hands
   * them to the slicer once it is welcomed. Too many or too large to hand
   * over: the person is told which, and stays here.
   */
  openInSlice() {
    const problem = holdModels(this.modelFiles.filter((f) => isSlicerModel(f.name)));
    if (problem) {
      EventBus.$emit(problem, { type: "warning", timeout: 1e4 });
      return;
    }
    this.modelFiles = [];
    this.close();
    this.$router.push(this.slicePath).catch(() => {
    });
    EventBus.bus.$emit("models-held");
  }
  close() {
    this.open = false;
  }
  /** The file, once the printer lists it with what the slicer wrote. */
  get job() {
    const entries = this.$store.getters["files/getDirectory"](this.jobDirectory);
    const name = this.filename.slice(this.filename.lastIndexOf("/") + 1);
    const file = entries?.find((entry) => entry.type === "file" && entry.filename === name && isGcodeFile(entry.filename));
    return file ? this.toJobFile(file) : null;
  }
  get jobDirectory() {
    const folder = parentFolder(this.filename);
    return folder ? `${this.root}/${folder}` : this.root;
  }
  loadFiles() {
    SocketActions.serverFilesGetDirectory(this.root, this.jobDirectory);
  }
  onJob(job) {
    if (job && !job.facts && this.open) window.setTimeout(() => this.loadFiles(), 1500);
  }
  get checks() {
    if (!this.job) return [];
    return readyChecks(this.job.file, this.job.filename, this.loadedFilament, this.printerName, this.busy);
  }
  get printingTitle() {
    return this.jobFile ? jobTitle(this.jobFile) : "";
  }
  titleOf(filename) {
    return jobTitle(filename);
  }
  get slicer() {
    return slicerPresence.state === "present";
  }
  get slicePath() {
    return this.pagePath("/slice");
  }
  async go() {
    if (!this.job) return;
    const job = this.job;
    this.close();
    if (this.busy) await this.addToQueue(job);
    else await this.printAgain(job.path);
  }
};
__decorateClass([
  Watch("job")
], JobReadyDialog.prototype, "onJob", 1);
JobReadyDialog = __decorateClass([
  Component({})
], JobReadyDialog);
const _sfc_main = JobReadyDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "max-width": "420", "content-class": "job-ready__dialog" }, on: { "input": function($event) {
    !$event && _vm.close();
  } } }, [_c("div", { staticClass: "job-ready", attrs: { "data-tid": "job-ready" } }, [_vm.mode === "gcode" ? [_c("div", { staticClass: "job-ready__head" }, [_c("h2", [_vm._v("Ready to print")]), _c("button", { attrs: { "type": "button", "aria-label": "Close" }, on: { "click": _vm.close } }, [_c(__unplugin_components_1, { attrs: { "name": "x" } })], 1)]), _c("div", { staticClass: "job-ready__picture" }, [_vm.job && _vm.job.thumbnail ? _c("img", { attrs: { "src": _vm.job.thumbnail, "alt": "" } }) : !_vm.job ? _c(__unplugin_components_2, { attrs: { "indeterminate": "", "size": "28", "width": "3" } }) : _c(__unplugin_components_3, { attrs: { "name": "jobs", "large": "" } })], 1), _c("b", { staticClass: "job-ready__title" }, [_vm._v(_vm._s(_vm.job ? _vm.job.title : _vm.titleOf(_vm.filename)))]), _c("span", { staticClass: "job-ready__facts" }, [_vm._v(_vm._s(_vm.job ? _vm.job.facts : "Reading what the slicer wrote\u2026"))]), _vm.checks.length ? _c("ul", { staticClass: "job-ready__checks" }, _vm._l(_vm.checks, function(check) {
    return _c("li", { key: check.text, class: { "job-ready__check--warn": !check.ok } }, [_c(__unplugin_components_4, { attrs: { "x-small": "" } }, [_vm._v(" " + _vm._s(check.ok ? "$check" : "$warning") + " ")]), _vm._v(" " + _vm._s(check.text) + " ")], 1);
  }), 0) : _vm._e(), _c("button", { staticClass: "cbtn cbtn--primary cbtn--wide job-ready__go", attrs: { "type": "button", "disabled": !_vm.job || !_vm.klippyReady || _vm.busy && !_vm.canQueue, "data-tid": "job-ready-print" }, on: { "click": _vm.go } }, [_vm._v(" " + _vm._s(_vm.busy ? _vm.canQueue ? `Add to queue \xB7 starts after ${_vm.printingTitle || "this print"}` : "The printer is busy" : "Print now") + " ")]), _c("button", { staticClass: "cbtn cbtn--wide", attrs: { "type": "button", "data-tid": "job-ready-keep" }, on: { "click": _vm.close } }, [_vm._v(" Just keep it ")])] : [_c("div", { staticClass: "job-ready__head" }, [_c("h2", [_c(__unplugin_components_5, { attrs: { "name": "slice" } }), _vm._v(" " + _vm._s(_vm.models.length === 1 ? _vm.models[0] : `${_vm.models.length} models`) + " ")], 1), _c("button", { attrs: { "type": "button", "aria-label": "Close" }, on: { "click": _vm.close } }, [_c(__unplugin_components_6, { attrs: { "name": "x" } })], 1)]), _vm.sliceable.length ? _c("p", { staticClass: "job-ready__about" }, [_vm._v(" A model has to be sliced before it can print. Open Slice and " + _vm._s(_vm.sliceable.length === 1 ? "it opens" : "they open") + " there, ready to slice for " + _vm._s(_vm.printerName) + ". ")]) : _vm._e(), _vm.unsliceable.length ? _c("p", { staticClass: "job-ready__about", attrs: { "data-tid": "job-ready-unsliceable" } }, [_vm._v(" Slice can't open " + _vm._s(_vm.unsliceable.join(", ")) + ": it takes STL, OBJ and 3MF. Export " + _vm._s(_vm.unsliceable.length === 1 ? "it" : "them") + " as one of those from your CAD program first. ")]) : _vm._e(), _c("p", { staticClass: "job-ready__about job-ready__about--dim" }, [_vm._v(" Nothing is sent to the printer until you slice and print. ")]), _vm.slicer && _vm.sliceable.length ? _c("button", { staticClass: "cbtn cbtn--primary cbtn--wide", attrs: { "type": "button", "data-tid": "job-ready-open-slice" }, on: { "click": _vm.openInSlice } }, [_vm._v(" Open Slice ")]) : _vm.sliceable.length ? _c("p", { staticClass: "job-ready__about" }, [_vm._v(" This printer doesn't serve Slice yet. slicer.muon3d.com slices the same way. ")]) : _vm._e(), _c("button", { staticClass: "cbtn cbtn--wide", attrs: { "type": "button" }, on: { "click": _vm.close } }, [_vm._v(" Close ")])]], 2)]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/jobs/JobReadyDialog.vue?vue&type=style&index=0&scoped=4dad2427&lang.scss";
import "/src/components/jobs/JobReadyDialog.vue?vue&type=style&index=1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "4dad2427",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/jobs/JobReadyDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFTQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFqQ0E7QUFBQSxFQURBO0FBQUEsR0FqRkEsZUFrRkE7QUFsRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiSm9iUmVhZHlEaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtZGlhbG9nXG4gICAgOnZhbHVlPVwib3BlblwiXG4gICAgbWF4LXdpZHRoPVwiNDIwXCJcbiAgICBjb250ZW50LWNsYXNzPVwiam9iLXJlYWR5X19kaWFsb2dcIlxuICAgIEBpbnB1dD1cIiEkZXZlbnQgJiYgY2xvc2UoKVwiXG4gID5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cImpvYi1yZWFkeVwiXG4gICAgICBkYXRhLXRpZD1cImpvYi1yZWFkeVwiXG4gICAgPlxuICAgICAgPCEtLSBBIEctY29kZSBmaWxlOiByZWFkeSB0byBwcmludC4gLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cIm1vZGUgPT09ICdnY29kZSdcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImpvYi1yZWFkeV9faGVhZFwiPlxuICAgICAgICAgIDxoMj5SZWFkeSB0byBwcmludDwvaDI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiQ2xvc2VcIlxuICAgICAgICAgICAgQGNsaWNrPVwiY2xvc2VcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJ4XCIgLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb2ItcmVhZHlfX3BpY3R1cmVcIj5cbiAgICAgICAgICA8aW1nXG4gICAgICAgICAgICB2LWlmPVwiam9iICYmIGpvYi50aHVtYm5haWxcIlxuICAgICAgICAgICAgOnNyYz1cImpvYi50aHVtYm5haWxcIlxuICAgICAgICAgICAgYWx0PVwiXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICAgIHYtZWxzZS1pZj1cIiFqb2JcIlxuICAgICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgICAgc2l6ZT1cIjI4XCJcbiAgICAgICAgICAgIHdpZHRoPVwiM1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICBuYW1lPVwiam9ic1wiXG4gICAgICAgICAgICBsYXJnZVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YiBjbGFzcz1cImpvYi1yZWFkeV9fdGl0bGVcIj57eyBqb2IgPyBqb2IudGl0bGUgOiB0aXRsZU9mKGZpbGVuYW1lKSB9fTwvYj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJqb2ItcmVhZHlfX2ZhY3RzXCI+e3sgam9iID8gam9iLmZhY3RzIDogJ1JlYWRpbmcgd2hhdCB0aGUgc2xpY2VyIHdyb3Rl4oCmJyB9fTwvc3Bhbj5cbiAgICAgICAgPHVsXG4gICAgICAgICAgdi1pZj1cImNoZWNrcy5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwiam9iLXJlYWR5X19jaGVja3NcIlxuICAgICAgICA+XG4gICAgICAgICAgPGxpXG4gICAgICAgICAgICB2LWZvcj1cImNoZWNrIGluIGNoZWNrc1wiXG4gICAgICAgICAgICA6a2V5PVwiY2hlY2sudGV4dFwiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdqb2ItcmVhZHlfX2NoZWNrLS13YXJuJzogIWNoZWNrLm9rIH1cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDx2LWljb24geC1zbWFsbD5cbiAgICAgICAgICAgICAge3sgY2hlY2sub2sgPyAnJGNoZWNrJyA6ICckd2FybmluZycgfX1cbiAgICAgICAgICAgIDwvdi1pY29uPlxuICAgICAgICAgICAge3sgY2hlY2sudGV4dCB9fVxuICAgICAgICAgIDwvbGk+XG4gICAgICAgIDwvdWw+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeSBjYnRuLS13aWRlIGpvYi1yZWFkeV9fZ29cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFqb2IgfHwgIWtsaXBweVJlYWR5IHx8IChidXN5ICYmICFjYW5RdWV1ZSlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9iLXJlYWR5LXByaW50XCJcbiAgICAgICAgICBAY2xpY2s9XCJnb1wiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBidXN5ID8gKGNhblF1ZXVlID8gYEFkZCB0byBxdWV1ZSDCtyBzdGFydHMgYWZ0ZXIgJHtwcmludGluZ1RpdGxlIHx8ICd0aGlzIHByaW50J31gIDogJ1RoZSBwcmludGVyIGlzIGJ1c3knKSA6ICdQcmludCBub3cnIH19XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXdpZGVcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9iLXJlYWR5LWtlZXBcIlxuICAgICAgICAgIEBjbGljaz1cImNsb3NlXCJcbiAgICAgICAgPlxuICAgICAgICAgIEp1c3Qga2VlcCBpdFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG5cbiAgICAgIDwhLS0gQSBtb2RlbDogaXQgaGFzIHRvIGJlIHNsaWNlZCBmaXJzdC4gLS0+XG4gICAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLXJlYWR5X19oZWFkXCI+XG4gICAgICAgICAgPGgyPlxuICAgICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInNsaWNlXCIgLz5cbiAgICAgICAgICAgIHt7IG1vZGVscy5sZW5ndGggPT09IDEgPyBtb2RlbHNbMF0gOiBgJHttb2RlbHMubGVuZ3RofSBtb2RlbHNgIH19XG4gICAgICAgICAgPC9oMj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJDbG9zZVwiXG4gICAgICAgICAgICBAY2xpY2s9XCJjbG9zZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInhcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHBcbiAgICAgICAgICB2LWlmPVwic2xpY2VhYmxlLmxlbmd0aFwiXG4gICAgICAgICAgY2xhc3M9XCJqb2ItcmVhZHlfX2Fib3V0XCJcbiAgICAgICAgPlxuICAgICAgICAgIEEgbW9kZWwgaGFzIHRvIGJlIHNsaWNlZCBiZWZvcmUgaXQgY2FuIHByaW50LiBPcGVuIFNsaWNlIGFuZFxuICAgICAgICAgIHt7IHNsaWNlYWJsZS5sZW5ndGggPT09IDEgPyAnaXQgb3BlbnMnIDogJ3RoZXkgb3BlbicgfX0gdGhlcmUsIHJlYWR5IHRvIHNsaWNlIGZvciB7eyBwcmludGVyTmFtZSB9fS5cbiAgICAgICAgPC9wPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJ1bnNsaWNlYWJsZS5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwiam9iLXJlYWR5X19hYm91dFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2ItcmVhZHktdW5zbGljZWFibGVcIlxuICAgICAgICA+XG4gICAgICAgICAgU2xpY2UgY2FuJ3Qgb3BlbiB7eyB1bnNsaWNlYWJsZS5qb2luKCcsICcpIH19OiBpdCB0YWtlcyBTVEwsIE9CSiBhbmQgM01GLiBFeHBvcnQge3sgdW5zbGljZWFibGUubGVuZ3RoID09PSAxID8gJ2l0JyA6ICd0aGVtJyB9fSBhcyBvbmUgb2YgdGhvc2UgZnJvbSB5b3VyIENBRCBwcm9ncmFtIGZpcnN0LlxuICAgICAgICA8L3A+XG4gICAgICAgIDxwIGNsYXNzPVwiam9iLXJlYWR5X19hYm91dCBqb2ItcmVhZHlfX2Fib3V0LS1kaW1cIj5cbiAgICAgICAgICBOb3RoaW5nIGlzIHNlbnQgdG8gdGhlIHByaW50ZXIgdW50aWwgeW91IHNsaWNlIGFuZCBwcmludC5cbiAgICAgICAgPC9wPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1pZj1cInNsaWNlciAmJiBzbGljZWFibGUubGVuZ3RoXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeSBjYnRuLS13aWRlXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImpvYi1yZWFkeS1vcGVuLXNsaWNlXCJcbiAgICAgICAgICBAY2xpY2s9XCJvcGVuSW5TbGljZVwiXG4gICAgICAgID5cbiAgICAgICAgICBPcGVuIFNsaWNlXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8cFxuICAgICAgICAgIHYtZWxzZS1pZj1cInNsaWNlYWJsZS5sZW5ndGhcIlxuICAgICAgICAgIGNsYXNzPVwiam9iLXJlYWR5X19hYm91dFwiXG4gICAgICAgID5cbiAgICAgICAgICBUaGlzIHByaW50ZXIgZG9lc24ndCBzZXJ2ZSBTbGljZSB5ZXQuIHNsaWNlci5tdW9uM2QuY29tIHNsaWNlcyB0aGUgc2FtZSB3YXkuXG4gICAgICAgIDwvcD5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS13aWRlXCJcbiAgICAgICAgICBAY2xpY2s9XCJjbG9zZVwiXG4gICAgICAgID5cbiAgICAgICAgICBDbG9zZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gIDwvdi1kaWFsb2c+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBKb2JzTWl4aW4sIHsgdHlwZSBKb2JGaWxlIH0gZnJvbSAnQC9taXhpbnMvam9icydcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcbmltcG9ydCB7IGlzR2NvZGVGaWxlLCBqb2JUaXRsZSwgcGFyZW50Rm9sZGVyLCByZWFkeUNoZWNrcywgdHlwZSBSZWFkeUNoZWNrIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgdHlwZSB7IEFwcEZpbGVXaXRoTWV0YSwgRmlsZUJyb3dzZXJFbnRyeSB9IGZyb20gJ0Avc3RvcmUvZmlsZXMvdHlwZXMnXG5pbXBvcnQgeyBzbGljZXJQcmVzZW5jZSB9IGZyb20gJ0Avc2VydmljZXMvc2xpY2VyLWJyaWRnZS9zbGljZXJVcmwnXG5pbXBvcnQgeyBob2xkTW9kZWxzLCBpc1NsaWNlck1vZGVsIH0gZnJvbSAnQC9zZXJ2aWNlcy9zbGljZXItYnJpZGdlL2hhbmRvdmVyJ1xuXG4vKipcbiAqIEFmdGVyIGEgZmlsZSBhcnJpdmVzLCBieSBkcm9wIG9yIFVwbG9hZC4gRy1jb2RlOiB3aGF0IGl0IGlzLCB3aGF0IHRvXG4gKiBrbm93IGJlZm9yZSBpdCBwcmludHMgKHdoYXQgaXQgd2FzIHNsaWNlZCBmb3IsIGl0cyBtYXRlcmlhbCwgd2hldGhlclxuICogdGhlIHByaW50ZXIgaXMgZnJlZSksIGFuZCBQcmludCBub3cgb3IgQWRkIHRvIHF1ZXVlLiBBIG1vZGVsOiBPcGVuIFNsaWNlXG4gKiBvcGVucyBpdCBpbiB0aGUgc2xpY2VyIChzZXJ2aWNlcy9zbGljZXItYnJpZGdlL2hhbmRvdmVyLnRzKS5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEpvYlJlYWR5RGlhbG9nIGV4dGVuZHMgTWl4aW5zKEpvYnNNaXhpbikge1xuICBvcGVuID0gZmFsc2VcbiAgbW9kZTogJ2djb2RlJyB8ICdtb2RlbCcgPSAnZ2NvZGUnXG4gIGZpbGVuYW1lID0gJydcbiAgbW9kZWxzOiBzdHJpbmdbXSA9IFtdXG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgRXZlbnRCdXMuYnVzLiRvbignam9iLXJlYWR5JywgdGhpcy5zaG93Sm9iKVxuICAgIEV2ZW50QnVzLmJ1cy4kb24oJ21vZGVsLWRyb3BwZWQnLCB0aGlzLnNob3dNb2RlbHMpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICBFdmVudEJ1cy5idXMuJG9mZignam9iLXJlYWR5JywgdGhpcy5zaG93Sm9iKVxuICAgIEV2ZW50QnVzLmJ1cy4kb2ZmKCdtb2RlbC1kcm9wcGVkJywgdGhpcy5zaG93TW9kZWxzKVxuICB9XG5cbiAgc2hvd0pvYiAoZmlsZW5hbWU6IHN0cmluZykge1xuICAgIHRoaXMubW9kZSA9ICdnY29kZSdcbiAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWVcbiAgICB0aGlzLm9wZW4gPSB0cnVlXG4gICAgdGhpcy5sb2FkRmlsZXMoKVxuICB9XG5cbiAgLyoqIFRoZSBtb2RlbCBmaWxlcyBkcm9wcGVkIG9yIHBpY2tlZDoga2VwdCAobm90IHJlYWN0aXZlKSB1bnRpbCBPcGVuIFNsaWNlIG9yIHRoZSBuZXh0IGRyb3AuICovXG4gIG1vZGVsRmlsZXM6IHJlYWRvbmx5IEZpbGVbXSA9IFtdXG5cbiAgc2hvd01vZGVscyAoZmlsZXM6IEZpbGVbXSkge1xuICAgIHRoaXMubW9kZSA9ICdtb2RlbCdcbiAgICB0aGlzLm1vZGVsRmlsZXMgPSBPYmplY3QuZnJlZXplKFsuLi5maWxlc10pXG4gICAgdGhpcy5tb2RlbHMgPSBmaWxlcy5tYXAoZiA9PiBmLm5hbWUpXG4gICAgdGhpcy5vcGVuID0gdHJ1ZVxuICB9XG5cbiAgLyoqIFRoZSBtb2RlbHMgdGhlIHNsaWNlciBvcGVucyAoU1RMLCBPQkosIDNNRiksIGFuZCB0aGUgb25lcyBpdCBjYW4ndCAoU1RFUCkuICovXG4gIGdldCBzbGljZWFibGUgKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5tb2RlbHMuZmlsdGVyKGlzU2xpY2VyTW9kZWwpXG4gIH1cblxuICBnZXQgdW5zbGljZWFibGUgKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5tb2RlbHMuZmlsdGVyKG5hbWUgPT4gIWlzU2xpY2VyTW9kZWwobmFtZSkpXG4gIH1cblxuICAvKipcbiAgICogT3BlbiBTbGljZTogdGhlIG1vZGVscyBpdCBvcGVucyBnbyB3aXRoIGl0IChLQU4tMjE5MSksIGFuZCAvc2xpY2UgaGFuZHNcbiAgICogdGhlbSB0byB0aGUgc2xpY2VyIG9uY2UgaXQgaXMgd2VsY29tZWQuIFRvbyBtYW55IG9yIHRvbyBsYXJnZSB0byBoYW5kXG4gICAqIG92ZXI6IHRoZSBwZXJzb24gaXMgdG9sZCB3aGljaCwgYW5kIHN0YXlzIGhlcmUuXG4gICAqL1xuICBvcGVuSW5TbGljZSAoKSB7XG4gICAgY29uc3QgcHJvYmxlbSA9IGhvbGRNb2RlbHModGhpcy5tb2RlbEZpbGVzLmZpbHRlcihmID0+IGlzU2xpY2VyTW9kZWwoZi5uYW1lKSkpXG4gICAgaWYgKHByb2JsZW0pIHtcbiAgICAgIEV2ZW50QnVzLiRlbWl0KHByb2JsZW0sIHsgdHlwZTogJ3dhcm5pbmcnLCB0aW1lb3V0OiAxMDAwMCB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMubW9kZWxGaWxlcyA9IFtdXG4gICAgdGhpcy5jbG9zZSgpXG4gICAgdGhpcy4kcm91dGVyLnB1c2godGhpcy5zbGljZVBhdGgpLmNhdGNoKCgpID0+IHt9KVxuICAgIC8vIEFscmVhZHkgb24gL3NsaWNlOiB0aGUgb3BlbiBwYWdlIHRha2VzIHRoZW0gbm93LlxuICAgIEV2ZW50QnVzLmJ1cy4kZW1pdCgnbW9kZWxzLWhlbGQnKVxuICB9XG5cbiAgY2xvc2UgKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gIH1cblxuICAvKiogVGhlIGZpbGUsIG9uY2UgdGhlIHByaW50ZXIgbGlzdHMgaXQgd2l0aCB3aGF0IHRoZSBzbGljZXIgd3JvdGUuICovXG4gIGdldCBqb2IgKCk6IEpvYkZpbGUgfCBudWxsIHtcbiAgICBjb25zdCBlbnRyaWVzID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snZmlsZXMvZ2V0RGlyZWN0b3J5J10odGhpcy5qb2JEaXJlY3RvcnkpIGFzIEZpbGVCcm93c2VyRW50cnlbXSB8IHVuZGVmaW5lZFxuICAgIGNvbnN0IG5hbWUgPSB0aGlzLmZpbGVuYW1lLnNsaWNlKHRoaXMuZmlsZW5hbWUubGFzdEluZGV4T2YoJy8nKSArIDEpXG4gICAgY29uc3QgZmlsZSA9IGVudHJpZXM/LmZpbmQoKGVudHJ5KTogZW50cnkgaXMgQXBwRmlsZVdpdGhNZXRhID0+IGVudHJ5LnR5cGUgPT09ICdmaWxlJyAmJiBlbnRyeS5maWxlbmFtZSA9PT0gbmFtZSAmJiBpc0djb2RlRmlsZShlbnRyeS5maWxlbmFtZSkpXG4gICAgcmV0dXJuIGZpbGUgPyB0aGlzLnRvSm9iRmlsZShmaWxlKSA6IG51bGxcbiAgfVxuXG4gIGdldCBqb2JEaXJlY3RvcnkgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZm9sZGVyID0gcGFyZW50Rm9sZGVyKHRoaXMuZmlsZW5hbWUpXG4gICAgcmV0dXJuIGZvbGRlciA/IGAke3RoaXMucm9vdH0vJHtmb2xkZXJ9YCA6IHRoaXMucm9vdFxuICB9XG5cbiAgbG9hZEZpbGVzICgpIHtcbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckZpbGVzR2V0RGlyZWN0b3J5KHRoaXMucm9vdCwgdGhpcy5qb2JEaXJlY3RvcnkpXG4gIH1cblxuICBAV2F0Y2goJ2pvYicpXG4gIG9uSm9iIChqb2I6IEpvYkZpbGUgfCBudWxsKSB7XG4gICAgLy8gVGhlIHByaW50ZXIgcmVhZHMgdGhlIHNsaWNlcidzIG5vdGVzIGEgbW9tZW50IGFmdGVyIHRoZSB1cGxvYWQuXG4gICAgaWYgKGpvYiAmJiAham9iLmZhY3RzICYmIHRoaXMub3Blbikgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5sb2FkRmlsZXMoKSwgMTUwMClcbiAgfVxuXG4gIGdldCBjaGVja3MgKCk6IFJlYWR5Q2hlY2tbXSB7XG4gICAgaWYgKCF0aGlzLmpvYikgcmV0dXJuIFtdXG4gICAgcmV0dXJuIHJlYWR5Q2hlY2tzKHRoaXMuam9iLmZpbGUsIHRoaXMuam9iLmZpbGVuYW1lLCB0aGlzLmxvYWRlZEZpbGFtZW50LCB0aGlzLnByaW50ZXJOYW1lLCB0aGlzLmJ1c3kpXG4gIH1cblxuICBnZXQgcHJpbnRpbmdUaXRsZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5qb2JGaWxlID8gam9iVGl0bGUodGhpcy5qb2JGaWxlKSA6ICcnXG4gIH1cblxuICB0aXRsZU9mIChmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gam9iVGl0bGUoZmlsZW5hbWUpXG4gIH1cblxuICBnZXQgc2xpY2VyICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2xpY2VyUHJlc2VuY2Uuc3RhdGUgPT09ICdwcmVzZW50J1xuICB9XG5cbiAgZ2V0IHNsaWNlUGF0aCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5wYWdlUGF0aCgnL3NsaWNlJylcbiAgfVxuXG4gIGFzeW5jIGdvICgpIHtcbiAgICBpZiAoIXRoaXMuam9iKSByZXR1cm5cbiAgICBjb25zdCBqb2IgPSB0aGlzLmpvYlxuICAgIHRoaXMuY2xvc2UoKVxuICAgIGlmICh0aGlzLmJ1c3kpIGF3YWl0IHRoaXMuYWRkVG9RdWV1ZShqb2IpXG4gICAgZWxzZSBhd2FpdCB0aGlzLnByaW50QWdhaW4oam9iLnBhdGgpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5qb2ItcmVhZHkge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDEycHg7XG4gICAgcGFkZGluZzogMjBweDtcbiAgICBib3JkZXItcmFkaXVzOiAyNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgLmpvYi1yZWFkeV9faGVhZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG5cbiAgICBoMiB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIGdhcDogMTBweDtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIG1hcmdpbjogMDtcbiAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICBmb250LXNpemU6IDE3cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgIH1cblxuICAgIGJ1dHRvbiB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgfVxuICB9XG5cbiAgLmpvYi1yZWFkeV9fcGljdHVyZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGhlaWdodDogMjIwcHg7XG4gICAgYm9yZGVyLXJhZGl1czogMThweDtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoMTAwJSAxMDAlIGF0IDUwJSAzNSUsICMyZjMxMzMgMCUsICMxZjIwMjIgNzAlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcblxuICAgIGltZyB7XG4gICAgICB3aWR0aDogODAlO1xuICAgICAgaGVpZ2h0OiA4MCU7XG4gICAgICBvYmplY3QtZml0OiBjb250YWluO1xuICAgIH1cbiAgfVxuXG4gIC5qb2ItcmVhZHlfX3RpdGxlIHtcbiAgICBmb250LXNpemU6IDIwcHg7XG4gIH1cblxuICAuam9iLXJlYWR5X19mYWN0cyB7XG4gICAgbWFyZ2luLXRvcDogLThweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5qb2ItcmVhZHlfX2NoZWNrcyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogOHB4O1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBsaXN0LXN0eWxlOiBub25lO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcblxuICAgIGxpIHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgZ2FwOiA4cHg7XG5cbiAgICAgIC52LWljb24ge1xuICAgICAgICBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MpICFpbXBvcnRhbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLmpvYi1yZWFkeV9fY2hlY2stLXdhcm4gLnYtaWNvbiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC13YXJuaW5nKSAhaW1wb3J0YW50O1xuICB9XG5cbiAgLmpvYi1yZWFkeV9fZ28ge1xuICAgIGhlaWdodDogNDhweDtcbiAgfVxuXG4gIC5qb2ItcmVhZHlfX2Fib3V0IHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAuam9iLXJlYWR5X19hYm91dC0tZGltIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cbjwvc3R5bGU+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAudi1kaWFsb2cuam9iLXJlYWR5X19kaWFsb2cge1xuICAgIG92ZXJmbG93OiB2aXNpYmxlO1xuICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9qb2JzL0pvYlJlYWR5RGlhbG9nLnZ1ZSJ9