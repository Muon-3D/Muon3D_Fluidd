/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import {
  machineFaults,
  RelatchTracker,
  printRunning,
  resetAvailable,
  BED_POWER_CODE,
  RESET_GCODE
} from "/src/services/machine-faults/faults.ts";
import {
  BED_POWER_AGAIN,
  RESET_CANCEL,
  RESET_FAILED,
  RESET_LABEL,
  RESET_MESSAGE,
  RESET_TITLE,
  RESET_WHILE_PRINTING
} from "/src/services/machine-faults/strings.ts";
let MachineFaultBar = class extends Mixins(StateMixin) {
  busy = false;
  message = "";
  timer = null;
  labels = { reset: RESET_LABEL, whilePrinting: RESET_WHILE_PRINTING };
  get tracker() {
    return MachineFaultBar.tracker;
  }
  get faults() {
    return machineFaults(this.$store.state.printer.printer);
  }
  get bedFault() {
    return this.faults.some((f) => f.code === BED_POWER_CODE);
  }
  get relatched() {
    return this.tracker.relatched;
  }
  get printing() {
    return printRunning(this.printerState);
  }
  get canReset() {
    return resetAvailable(this.faults, this.printerState) && !this.relatched;
  }
  get printingNote() {
    return this.bedFault && this.printing;
  }
  wordsFor(f) {
    return f.code === BED_POWER_CODE && this.relatched ? BED_POWER_AGAIN : f.text;
  }
  onBedFault(present) {
    this.tracker.observe(present, Date.now());
  }
  created() {
    this.tracker.observe(this.bedFault, Date.now());
    this.timer = setInterval(() => this.tracker.tick(Date.now()), 500);
  }
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async ask() {
    if (this.busy) return;
    this.busy = true;
    try {
      const yes = await this.$confirm(RESET_MESSAGE, {
        title: RESET_TITLE,
        buttonTrueText: RESET_LABEL,
        buttonFalseText: RESET_CANCEL
      });
      if (!yes) return;
      this.message = "";
      await this.reset();
    } finally {
      this.busy = false;
    }
  }
  /** One Z_POWER_RESET. A refusal is shown in the printer's own words. */
  async reset() {
    let refusal = "";
    const stop = this.$store.subscribeAction((action) => {
      const payload = action.payload;
      if (action.type === "socket/onSocketError" && payload?.__request__?.params?.script === RESET_GCODE) {
        refusal = typeof payload.message === "string" ? payload.message : "";
      }
    });
    try {
      this.tracker.resetSent(Date.now());
      const answer = await this.$socket.emit("printer.gcode.script", {
        dispatch: "console/onGcodeScript",
        params: { script: RESET_GCODE }
      });
      if (answer === void 0) this.message = refusal || RESET_FAILED;
    } finally {
      stop();
    }
  }
};
// One tracker for the page: Overview and Control never show at once.
__publicField(MachineFaultBar, "tracker", Vue.observable(new RelatchTracker()));
__decorateClass([
  Watch("bedFault")
], MachineFaultBar.prototype, "onBedFault", 1);
MachineFaultBar = __decorateClass([
  Component({})
], MachineFaultBar);
const _sfc_main = MachineFaultBar;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _vm.faults.length ? _c("div", { staticClass: "fault-bar", attrs: { "role": "alert", "data-tid": "machine-fault-bar" } }, [_vm._l(_vm.faults, function(f) {
    return _c("div", { key: f.code, staticClass: "fault-bar__row", attrs: { "data-tid": `machine-fault-${f.code}` } }, [_c("div", { staticClass: "fault-bar__words" }, [_c("span", { staticClass: "fault-bar__text", attrs: { "data-tid": "machine-fault-text" } }, [_vm._v(_vm._s(_vm.wordsFor(f)))]), f.detail && !_vm.relatched ? _c("span", { staticClass: "fault-bar__detail", attrs: { "data-tid": "machine-fault-detail" } }, [_vm._v(_vm._s(f.detail))]) : _vm._e()]), f.canReset && _vm.canReset ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": _vm.busy, "aria-busy": _vm.busy ? "true" : "false", "data-tid": "machine-fault-reset" }, on: { "click": _vm.ask } }, [_vm._v(" " + _vm._s(_vm.labels.reset) + " ")]) : _vm._e()]);
  }), _vm.printingNote ? _c("p", { staticClass: "fault-bar__message fault-bar__message--quiet", attrs: { "data-tid": "machine-fault-printing" } }, [_vm._v(" " + _vm._s(_vm.labels.whilePrinting) + " ")]) : _vm._e(), _vm.message ? _c("p", { staticClass: "fault-bar__message", attrs: { "data-tid": "machine-fault-message" } }, [_vm._v(" " + _vm._s(_vm.message) + " ")]) : _vm._e()], 2) : _vm._e();
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/ui/MachineFaultBar.vue?vue&type=style&index=0&scoped=df339692&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "df339692",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/MachineFaultBar.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBc0RBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BQ0E7QUFZQTtBQUFBLEVBSUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBQUE7QUEzRkEsY0FGQSxpQkFFQTtBQXlDQTtBQUFBLEVBREE7QUFBQSxHQTFDQSxnQkEyQ0E7QUEzQ0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTWFjaGluZUZhdWx0QmFyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICB2LWlmPVwiZmF1bHRzLmxlbmd0aFwiXG4gICAgY2xhc3M9XCJmYXVsdC1iYXJcIlxuICAgIHJvbGU9XCJhbGVydFwiXG4gICAgZGF0YS10aWQ9XCJtYWNoaW5lLWZhdWx0LWJhclwiXG4gID5cbiAgICA8ZGl2XG4gICAgICB2LWZvcj1cImYgaW4gZmF1bHRzXCJcbiAgICAgIDprZXk9XCJmLmNvZGVcIlxuICAgICAgY2xhc3M9XCJmYXVsdC1iYXJfX3Jvd1wiXG4gICAgICA6ZGF0YS10aWQ9XCJgbWFjaGluZS1mYXVsdC0ke2YuY29kZX1gXCJcbiAgICA+XG4gICAgICA8ZGl2IGNsYXNzPVwiZmF1bHQtYmFyX193b3Jkc1wiPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzPVwiZmF1bHQtYmFyX190ZXh0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cIm1hY2hpbmUtZmF1bHQtdGV4dFwiXG4gICAgICAgID57eyB3b3Jkc0ZvcihmKSB9fTwvc3Bhbj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWlmPVwiZi5kZXRhaWwgJiYgIXJlbGF0Y2hlZFwiXG4gICAgICAgICAgY2xhc3M9XCJmYXVsdC1iYXJfX2RldGFpbFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJtYWNoaW5lLWZhdWx0LWRldGFpbFwiXG4gICAgICAgID57eyBmLmRldGFpbCB9fTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWlmPVwiZi5jYW5SZXNldCAmJiBjYW5SZXNldFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICA6YXJpYS1idXN5PVwiYnVzeSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICBkYXRhLXRpZD1cIm1hY2hpbmUtZmF1bHQtcmVzZXRcIlxuICAgICAgICBAY2xpY2s9XCJhc2tcIlxuICAgICAgPlxuICAgICAgICB7eyBsYWJlbHMucmVzZXQgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxwXG4gICAgICB2LWlmPVwicHJpbnRpbmdOb3RlXCJcbiAgICAgIGNsYXNzPVwiZmF1bHQtYmFyX19tZXNzYWdlIGZhdWx0LWJhcl9fbWVzc2FnZS0tcXVpZXRcIlxuICAgICAgZGF0YS10aWQ9XCJtYWNoaW5lLWZhdWx0LXByaW50aW5nXCJcbiAgICA+XG4gICAgICB7eyBsYWJlbHMud2hpbGVQcmludGluZyB9fVxuICAgIDwvcD5cbiAgICA8cFxuICAgICAgdi1pZj1cIm1lc3NhZ2VcIlxuICAgICAgY2xhc3M9XCJmYXVsdC1iYXJfX21lc3NhZ2VcIlxuICAgICAgZGF0YS10aWQ9XCJtYWNoaW5lLWZhdWx0LW1lc3NhZ2VcIlxuICAgID5cbiAgICAgIHt7IG1lc3NhZ2UgfX1cbiAgICA8L3A+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHtcbiAgbWFjaGluZUZhdWx0cyxcbiAgUmVsYXRjaFRyYWNrZXIsXG4gIHByaW50UnVubmluZyxcbiAgcmVzZXRBdmFpbGFibGUsXG4gIEJFRF9QT1dFUl9DT0RFLFxuICBSRVNFVF9HQ09ERSxcbiAgdHlwZSBNYWNoaW5lRmF1bHRcbn0gZnJvbSAnQC9zZXJ2aWNlcy9tYWNoaW5lLWZhdWx0cy9mYXVsdHMnXG5pbXBvcnQge1xuICBCRURfUE9XRVJfQUdBSU4sXG4gIFJFU0VUX0NBTkNFTCxcbiAgUkVTRVRfRkFJTEVELFxuICBSRVNFVF9MQUJFTCxcbiAgUkVTRVRfTUVTU0FHRSxcbiAgUkVTRVRfVElUTEUsXG4gIFJFU0VUX1dISUxFX1BSSU5USU5HXG59IGZyb20gJ0Avc2VydmljZXMvbWFjaGluZS1mYXVsdHMvc3RyaW5ncydcblxuLyoqXG4gKiBUaGUgcHJpbnRlcidzIG1hY2hpbmUgZmF1bHRzIGF0IHRoZSB0b3Agb2YgT3ZlcnZpZXcgYW5kIENvbnRyb2wgKEtBTi0zNDE4KSxcbiAqIGZyb20gYG0xX21hY2hpbmUuZmF1bHRzYCwgaW4gdGhlIHBhbmVsJ3Mgd29yZHMuIEJlZCBwb3dlciBjdXQgb2ZmZXJzIFJlc2V0OlxuICogaXQgYXNrcyBmaXJzdCwgdGhlbiBzZW5kcyBvbmUgWl9QT1dFUl9SRVNFVC4gSWYgdGhlIGZhdWx0IGNvbWVzIGJhY2sgKHRoZVxuICogY2F1c2UgaXMgc3RpbGwgdGhlcmUpIGl0IHNheXMgc28gYW5kIGRvZXMgbm90IG9mZmVyIFJlc2V0IGFnYWluLiBLbGlwcGVyXG4gKiByZWZ1c2VzIHRoZSByZXNldCBkdXJpbmcgYSBwcmludCwgc28gUmVzZXQgaXMgbm90IG9mZmVyZWQgdGhlbi4gVGhlIGJhbm5lclxuICogaXMgZHJpdmVuIGJ5IHRoZSBwcmludGVyJ3MgcmVwb3J0IG9ubHk6IGl0IGdvZXMgd2hlbiB0aGUgZmF1bHQgZ29lcywgZm9yXG4gKiB3aGF0ZXZlciByZWFzb24sIG5ldmVyIGJlY2F1c2UgUmVzZXQgd2FzIHByZXNzZWQuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWNoaW5lRmF1bHRCYXIgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICAvLyBPbmUgdHJhY2tlciBmb3IgdGhlIHBhZ2U6IE92ZXJ2aWV3IGFuZCBDb250cm9sIG5ldmVyIHNob3cgYXQgb25jZS5cbiAgc3RhdGljIHRyYWNrZXIgPSBWdWUub2JzZXJ2YWJsZShuZXcgUmVsYXRjaFRyYWNrZXIoKSlcblxuICBidXN5ID0gZmFsc2VcbiAgbWVzc2FnZSA9ICcnXG4gIHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRJbnRlcnZhbD4gfCBudWxsID0gbnVsbFxuXG4gIHJlYWRvbmx5IGxhYmVscyA9IHsgcmVzZXQ6IFJFU0VUX0xBQkVMLCB3aGlsZVByaW50aW5nOiBSRVNFVF9XSElMRV9QUklOVElORyB9XG5cbiAgZ2V0IHRyYWNrZXIgKCk6IFJlbGF0Y2hUcmFja2VyIHtcbiAgICByZXR1cm4gTWFjaGluZUZhdWx0QmFyLnRyYWNrZXJcbiAgfVxuXG4gIGdldCBmYXVsdHMgKCk6IE1hY2hpbmVGYXVsdFtdIHtcbiAgICByZXR1cm4gbWFjaGluZUZhdWx0cyh0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIpXG4gIH1cblxuICBnZXQgYmVkRmF1bHQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmZhdWx0cy5zb21lKGYgPT4gZi5jb2RlID09PSBCRURfUE9XRVJfQ09ERSlcbiAgfVxuXG4gIGdldCByZWxhdGNoZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnRyYWNrZXIucmVsYXRjaGVkXG4gIH1cblxuICBnZXQgcHJpbnRpbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwcmludFJ1bm5pbmcodGhpcy5wcmludGVyU3RhdGUpXG4gIH1cblxuICBnZXQgY2FuUmVzZXQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiByZXNldEF2YWlsYWJsZSh0aGlzLmZhdWx0cywgdGhpcy5wcmludGVyU3RhdGUpICYmICF0aGlzLnJlbGF0Y2hlZFxuICB9XG5cbiAgZ2V0IHByaW50aW5nTm90ZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYmVkRmF1bHQgJiYgdGhpcy5wcmludGluZ1xuICB9XG5cbiAgd29yZHNGb3IgKGY6IE1hY2hpbmVGYXVsdCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGYuY29kZSA9PT0gQkVEX1BPV0VSX0NPREUgJiYgdGhpcy5yZWxhdGNoZWQgPyBCRURfUE9XRVJfQUdBSU4gOiBmLnRleHRcbiAgfVxuXG4gIEBXYXRjaCgnYmVkRmF1bHQnKVxuICBvbkJlZEZhdWx0IChwcmVzZW50OiBib29sZWFuKSB7XG4gICAgdGhpcy50cmFja2VyLm9ic2VydmUocHJlc2VudCwgRGF0ZS5ub3coKSlcbiAgfVxuXG4gIGNyZWF0ZWQgKCkge1xuICAgIHRoaXMudHJhY2tlci5vYnNlcnZlKHRoaXMuYmVkRmF1bHQsIERhdGUubm93KCkpXG4gICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKCgpID0+IHRoaXMudHJhY2tlci50aWNrKERhdGUubm93KCkpLCA1MDApXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKVxuICB9XG5cbiAgYXN5bmMgYXNrICgpIHtcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm5cbiAgICB0aGlzLmJ1c3kgPSB0cnVlXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHllcyA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oUkVTRVRfTUVTU0FHRSwge1xuICAgICAgICB0aXRsZTogUkVTRVRfVElUTEUsXG4gICAgICAgIGJ1dHRvblRydWVUZXh0OiBSRVNFVF9MQUJFTCxcbiAgICAgICAgYnV0dG9uRmFsc2VUZXh0OiBSRVNFVF9DQU5DRUxcbiAgICAgIH0pXG4gICAgICBpZiAoIXllcykgcmV0dXJuXG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnJ1xuICAgICAgYXdhaXQgdGhpcy5yZXNldCgpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuYnVzeSA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLyoqIE9uZSBaX1BPV0VSX1JFU0VULiBBIHJlZnVzYWwgaXMgc2hvd24gaW4gdGhlIHByaW50ZXIncyBvd24gd29yZHMuICovXG4gIGFzeW5jIHJlc2V0ICgpIHtcbiAgICBsZXQgcmVmdXNhbCA9ICcnXG4gICAgY29uc3Qgc3RvcCA9IHRoaXMuJHN0b3JlLnN1YnNjcmliZUFjdGlvbihhY3Rpb24gPT4ge1xuICAgICAgY29uc3QgcGF5bG9hZCA9IGFjdGlvbi5wYXlsb2FkIGFzIHsgbWVzc2FnZT86IHVua25vd24sIF9fcmVxdWVzdF9fPzogeyBwYXJhbXM/OiB7IHNjcmlwdD86IHVua25vd24gfSB9IH0gfCB1bmRlZmluZWRcbiAgICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ3NvY2tldC9vblNvY2tldEVycm9yJyAmJiBwYXlsb2FkPy5fX3JlcXVlc3RfXz8ucGFyYW1zPy5zY3JpcHQgPT09IFJFU0VUX0dDT0RFKSB7XG4gICAgICAgIHJlZnVzYWwgPSB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJyA/IHBheWxvYWQubWVzc2FnZSA6ICcnXG4gICAgICB9XG4gICAgfSlcbiAgICB0cnkge1xuICAgICAgdGhpcy50cmFja2VyLnJlc2V0U2VudChEYXRlLm5vdygpKVxuICAgICAgY29uc3QgYW5zd2VyID0gYXdhaXQgdGhpcy4kc29ja2V0LmVtaXQoJ3ByaW50ZXIuZ2NvZGUuc2NyaXB0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ2NvbnNvbGUvb25HY29kZVNjcmlwdCcsXG4gICAgICAgIHBhcmFtczogeyBzY3JpcHQ6IFJFU0VUX0dDT0RFIH1cbiAgICAgIH0pXG4gICAgICBpZiAoYW5zd2VyID09PSB1bmRlZmluZWQpIHRoaXMubWVzc2FnZSA9IHJlZnVzYWwgfHwgUkVTRVRfRkFJTEVEXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHN0b3AoKVxuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5mYXVsdC1iYXIge1xuICBtYXJnaW4tYm90dG9tOiAxNnB4O1xuICBwYWRkaW5nOiAxMnB4IDE2cHg7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLW0zZC1kYW5nZXIpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cbi5mYXVsdC1iYXJfX3JvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgZmxleC13cmFwOiB3cmFwO1xuICBnYXA6IDhweCAxNnB4O1xufVxuLmZhdWx0LWJhcl9fcm93ICsgLmZhdWx0LWJhcl9fcm93IHsgbWFyZ2luLXRvcDogOHB4OyB9XG4uZmF1bHQtYmFyX193b3JkcyB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMnB4OyB9XG4uZmF1bHQtYmFyX190ZXh0IHsgZm9udC13ZWlnaHQ6IDYwMDsgfVxuLmZhdWx0LWJhcl9fZGV0YWlsIHsgZm9udC1zaXplOiAxM3B4OyBvcGFjaXR5OiAwLjg7IH1cbi5mYXVsdC1iYXJfX21lc3NhZ2Uge1xuICBtYXJnaW46IDhweCAwIDA7XG4gIGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLmZhdWx0LWJhcl9fbWVzc2FnZS0tcXVpZXQgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyBvcGFjaXR5OiAwLjg7IH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy91aS9NYWNoaW5lRmF1bHRCYXIudnVlIn0=