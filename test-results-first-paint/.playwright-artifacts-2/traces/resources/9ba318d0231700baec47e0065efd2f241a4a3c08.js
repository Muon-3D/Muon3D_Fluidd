/* unplugin-vue-components disabled */import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import TonePill from "/src/components/printers/TonePill.vue";
import { updateHeadline, updateSteps, verifyStale, versionLabel } from "/src/services/updates/model.ts";
import { currentOutcome, forgetInstall, updateWatch } from "/src/services/updates/watch.ts";
let UpdatingScreen = class extends Vue {
  offlineState;
  printerName;
  canLeave;
  get remembered() {
    return updateWatch.remembered;
  }
  get offline() {
    return !!this.offlineState;
  }
  get stage() {
    if (this.offlineState === "updating-late") return "late";
    if (this.offlineState === "updating") return "offline";
    return currentOutcome() ?? this.remembered?.phase ?? "idle";
  }
  get tone() {
    if (this.stage === "updated") return "good";
    if (this.stage === "rolled_back" || this.stage === "failed") return "bad";
    if (this.stage === "late") return "late";
    return "busy";
  }
  get percent() {
    const p = this.stage === "installing" ? this.remembered?.progress ?? updateWatch.status?.progress ?? null : null;
    return typeof p === "number" ? Math.max(0, Math.min(100, Math.round(p))) : null;
  }
  get spinning() {
    return this.tone === "busy" && this.percent === null;
  }
  /** The arc: the progress while writing, a turning quarter otherwise, a full ring at the end. */
  get dash() {
    if (this.tone === "good" || this.tone === "bad") return 327;
    if (this.percent !== null) return 327 * this.percent / 100;
    return 82;
  }
  get headline() {
    return updateHeadline(this.stage, this.percent, this.remembered?.to ?? null, verifyStale(this.remembered, updateWatch.now));
  }
  get steps() {
    return updateSteps(this.stage);
  }
  get errorText() {
    if (this.tone !== "bad") return "";
    return updateWatch.status?.session?.error?.message ?? "";
  }
  get fromText() {
    const v = this.remembered?.from;
    return v ? versionLabel(v).text : "";
  }
  get toText() {
    const v = this.remembered?.to;
    return v ? versionLabel(v).text : "";
  }
  /** The printer serves the new version's Fluidd too: load it. */
  reload() {
    forgetInstall();
    window.location.reload();
  }
  /** Which of the steps it is on, for "Step 2 of 4". */
  get stepNow() {
    const at = this.steps.findIndex((s) => s.state === "now");
    return at < 0 ? this.steps.length : at + 1;
  }
  /** Under way: the bar moves, the warning shows. */
  get busy() {
    return this.stage !== "idle" && (this.tone === "busy" || this.tone === "late");
  }
  /** Leaves the page; the update carries on, so nothing is forgotten. */
  leave() {
    this.$emit("leave");
  }
  done() {
    forgetInstall();
    this.$emit("done");
  }
};
__decorateClass([
  Prop({ type: String, default: null })
], UpdatingScreen.prototype, "offlineState", 2);
__decorateClass([
  Prop({ type: String, default: "the printer" })
], UpdatingScreen.prototype, "printerName", 2);
__decorateClass([
  Prop({ type: Boolean, default: false })
], UpdatingScreen.prototype, "canLeave", 2);
UpdatingScreen = __decorateClass([
  Component({ components: { TonePill } })
], UpdatingScreen);
const _sfc_main = UpdatingScreen;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "upd", class: `upd--${_vm.tone}`, attrs: { "data-tid": `updating-${_vm.stage}`, "role": "status", "aria-live": "polite" } }, [_c("section", { staticClass: "stile upd__card" }, [_c("header", { staticClass: "stile__head" }, [_c(__unplugin_components_0, { staticClass: "upd__ico", attrs: { "name": _vm.stage === "updated" ? "check" : _vm.tone === "bad" ? "alert" : "download" } }), _c("h2", { staticClass: "upd__title" }, [_vm._v(" " + _vm._s(_vm.headline.title) + " ")]), _vm.busy ? _c("span", { staticClass: "stile__aside" }, [_c("tone-pill", { attrs: { "tone": "run" } }, [_vm._v("Step " + _vm._s(_vm.stepNow) + " of " + _vm._s(_vm.steps.length))])], 1) : _vm._e()], 1), _vm.percent !== null ? _c("div", { staticClass: "upd__big", attrs: { "data-tid": "updating-percent" } }, [_vm._v(" " + _vm._s(_vm.percent)), _c("small", [_vm._v(" %")])]) : _vm._e(), _vm.stage !== "idle" ? _c("div", { staticClass: "sbar upd__bar", class: { "upd__bar--wait": _vm.spinning }, attrs: { "role": "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": _vm.percent !== null ? _vm.percent : void 0, "aria-label": "Update progress" } }, [_c("i", { style: { width: `${_vm.spinning ? 30 : Math.round(_vm.dash / 327 * 100)}%` } })]) : _vm._e(), _c("p", { staticClass: "upd__text" }, [_vm._v(" " + _vm._s(_vm.headline.text) + " ")]), _vm.errorText ? _c("p", { staticClass: "upd__error" }, [_vm._v(" " + _vm._s(_vm.errorText) + " ")]) : _vm._e(), _vm.stage !== "idle" ? _c("ol", { staticClass: "slist upd__steps" }, _vm._l(_vm.steps, function(s, n) {
    return _c("li", { key: s.id, staticClass: "srow", class: `upd__step--${s.state}` }, [_c("span", { staticClass: "upd__st" }, [s.state === "done" ? _c(__unplugin_components_1, { attrs: { "name": "check", "small": "" } }) : s.state === "now" ? _c("span", { staticClass: "upd__dot" }) : [_vm._v(_vm._s(n + 1))]], 2), _c("span", { staticClass: "srow__text" }, [_c("span", { staticClass: "srow__t" }, [_vm._v(_vm._s(s.label))])]), _c("span", { staticClass: "srow__v" }, [_vm._v(_vm._s(s.state === "done" ? "Done" : s.state === "now" ? "Now" : "Waiting"))])]);
  }), 0) : _vm._e(), _vm.fromText || _vm.toText ? _c("p", { staticClass: "upd__versions" }, [_vm.fromText ? _c("span", [_vm._v(_vm._s(_vm.fromText))]) : _vm._e(), _vm.fromText && _vm.toText ? _c(__unplugin_components_2, { attrs: { "name": "chevronRight", "small": "" } }) : _vm._e(), _vm.toText ? _c("b", [_vm._v(_vm._s(_vm.toText))]) : _vm._e()], 1) : _vm._e(), _vm.busy ? _c("div", { staticClass: "scallout", attrs: { "data-tid": "updating-warning" } }, [_c(__unplugin_components_3, { attrs: { "name": "alert" } }), _vm._m(0)], 1) : _vm._e(), _c("div", { staticClass: "upd__actions" }, [_vm.stage === "updated" ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "updating-reload" }, on: { "click": _vm.reload } }, [_vm._v(" Reload ")]) : _vm._e(), _vm.tone === "bad" || _vm.stage === "updated" ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "data-tid": "updating-done" }, on: { "click": _vm.done } }, [_vm._v(" Back to " + _vm._s(_vm.printerName) + " ")]) : _vm._e(), _vm.canLeave ? _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "updating-leave" }, on: { "click": _vm.leave } }, [_c(__unplugin_components_4, { attrs: { "name": "home", "small": "" } }), _vm._v(" Back to Overview ")], 1) : _vm._e(), _vm.offline ? _c("span", { staticClass: "upd__waiting" }, [_vm._v("Waiting for " + _vm._s(_vm.printerName) + "\u2026")]) : _vm._e()]), _vm.canLeave && _vm.busy ? _c("p", { staticClass: "stile__note" }, [_vm._v(" You can leave this page: the update keeps going, and the bar at the top shows it. ")]) : _vm._e()])]);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_c("b", [_vm._v("Do not power off.")]), _vm._v(" The printer restarts once by itself near the end. Prints cannot start until it is done. ")]);
}];
_sfc_render._withStripped = true;
import "/src/components/updates/UpdatingScreen.vue?vue&type=style&index=0&scoped=94559caa&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "94559caa",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/updates/UpdatingScreen.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBNEpBO0FBQ0E7QUFDQTtBQUNBO0FBY0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEvRkE7QUFBQSxFQURBO0FBQUEsR0FGQSxlQUdBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FMQSxlQU1BO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FUQSxlQVVBO0FBVkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVXBkYXRpbmdTY3JlZW4udnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwidXBkXCJcbiAgICA6Y2xhc3M9XCJgdXBkLS0ke3RvbmV9YFwiXG4gICAgOmRhdGEtdGlkPVwiYHVwZGF0aW5nLSR7c3RhZ2V9YFwiXG4gICAgcm9sZT1cInN0YXR1c1wiXG4gICAgYXJpYS1saXZlPVwicG9saXRlXCJcbiAgPlxuICAgIDxzZWN0aW9uIGNsYXNzPVwic3RpbGUgdXBkX19jYXJkXCI+XG4gICAgICA8aGVhZGVyIGNsYXNzPVwic3RpbGVfX2hlYWRcIj5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICA6bmFtZT1cInN0YWdlID09PSAndXBkYXRlZCcgPyAnY2hlY2snIDogdG9uZSA9PT0gJ2JhZCcgPyAnYWxlcnQnIDogJ2Rvd25sb2FkJ1wiXG4gICAgICAgICAgY2xhc3M9XCJ1cGRfX2ljb1wiXG4gICAgICAgIC8+XG4gICAgICAgIDxoMiBjbGFzcz1cInVwZF9fdGl0bGVcIj5cbiAgICAgICAgICB7eyBoZWFkbGluZS50aXRsZSB9fVxuICAgICAgICA8L2gyPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJidXN5XCJcbiAgICAgICAgICBjbGFzcz1cInN0aWxlX19hc2lkZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8dG9uZS1waWxsIHRvbmU9XCJydW5cIj5TdGVwIHt7IHN0ZXBOb3cgfX0gb2Yge3sgc3RlcHMubGVuZ3RoIH19PC90b25lLXBpbGw+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJwZXJjZW50ICE9PSBudWxsXCJcbiAgICAgICAgY2xhc3M9XCJ1cGRfX2JpZ1wiXG4gICAgICAgIGRhdGEtdGlkPVwidXBkYXRpbmctcGVyY2VudFwiXG4gICAgICA+XG4gICAgICAgIHt7IHBlcmNlbnQgfX08c21hbGw+ICU8L3NtYWxsPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJzdGFnZSAhPT0gJ2lkbGUnXCJcbiAgICAgICAgY2xhc3M9XCJzYmFyIHVwZF9fYmFyXCJcbiAgICAgICAgOmNsYXNzPVwieyAndXBkX19iYXItLXdhaXQnOiBzcGlubmluZyB9XCJcbiAgICAgICAgcm9sZT1cInByb2dyZXNzYmFyXCJcbiAgICAgICAgYXJpYS12YWx1ZW1pbj1cIjBcIlxuICAgICAgICBhcmlhLXZhbHVlbWF4PVwiMTAwXCJcbiAgICAgICAgOmFyaWEtdmFsdWVub3c9XCJwZXJjZW50ICE9PSBudWxsID8gcGVyY2VudCA6IHVuZGVmaW5lZFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJVcGRhdGUgcHJvZ3Jlc3NcIlxuICAgICAgPlxuICAgICAgICA8aSA6c3R5bGU9XCJ7IHdpZHRoOiBgJHtzcGlubmluZyA/IDMwIDogTWF0aC5yb3VuZChkYXNoIC8gMzI3ICogMTAwKX0lYCB9XCIgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8cCBjbGFzcz1cInVwZF9fdGV4dFwiPlxuICAgICAgICB7eyBoZWFkbGluZS50ZXh0IH19XG4gICAgICA8L3A+XG4gICAgICA8cFxuICAgICAgICB2LWlmPVwiZXJyb3JUZXh0XCJcbiAgICAgICAgY2xhc3M9XCJ1cGRfX2Vycm9yXCJcbiAgICAgID5cbiAgICAgICAge3sgZXJyb3JUZXh0IH19XG4gICAgICA8L3A+XG5cbiAgICAgIDxvbFxuICAgICAgICB2LWlmPVwic3RhZ2UgIT09ICdpZGxlJ1wiXG4gICAgICAgIGNsYXNzPVwic2xpc3QgdXBkX19zdGVwc1wiXG4gICAgICA+XG4gICAgICAgIDxsaVxuICAgICAgICAgIHYtZm9yPVwiKHMsIG4pIGluIHN0ZXBzXCJcbiAgICAgICAgICA6a2V5PVwicy5pZFwiXG4gICAgICAgICAgY2xhc3M9XCJzcm93XCJcbiAgICAgICAgICA6Y2xhc3M9XCJgdXBkX19zdGVwLS0ke3Muc3RhdGV9YFwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVwZF9fc3RcIj5cbiAgICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgIHYtaWY9XCJzLnN0YXRlID09PSAnZG9uZSdcIlxuICAgICAgICAgICAgICBuYW1lPVwiY2hlY2tcIlxuICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIHYtZWxzZS1pZj1cInMuc3RhdGUgPT09ICdub3cnXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJ1cGRfX2RvdFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHRlbXBsYXRlIHYtZWxzZT57eyBuICsgMSB9fTwvdGVtcGxhdGU+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3Jvd19fdGV4dFwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzcm93X190XCI+e3sgcy5sYWJlbCB9fTwvc3Bhbj5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJzcm93X192XCI+e3sgcy5zdGF0ZSA9PT0gJ2RvbmUnID8gJ0RvbmUnIDogcy5zdGF0ZSA9PT0gJ25vdycgPyAnTm93JyA6ICdXYWl0aW5nJyB9fTwvc3Bhbj5cbiAgICAgICAgPC9saT5cbiAgICAgIDwvb2w+XG5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJmcm9tVGV4dCB8fCB0b1RleHRcIlxuICAgICAgICBjbGFzcz1cInVwZF9fdmVyc2lvbnNcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiB2LWlmPVwiZnJvbVRleHRcIj57eyBmcm9tVGV4dCB9fTwvc3Bhbj5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICB2LWlmPVwiZnJvbVRleHQgJiYgdG9UZXh0XCJcbiAgICAgICAgICBuYW1lPVwiY2hldnJvblJpZ2h0XCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPlxuICAgICAgICA8YiB2LWlmPVwidG9UZXh0XCI+e3sgdG9UZXh0IH19PC9iPlxuICAgICAgPC9wPlxuXG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJidXN5XCJcbiAgICAgICAgY2xhc3M9XCJzY2FsbG91dFwiXG4gICAgICAgIGRhdGEtdGlkPVwidXBkYXRpbmctd2FybmluZ1wiXG4gICAgICA+XG4gICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJhbGVydFwiIC8+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGI+RG8gbm90IHBvd2VyIG9mZi48L2I+IFRoZSBwcmludGVyIHJlc3RhcnRzIG9uY2UgYnkgaXRzZWxmIG5lYXIgdGhlIGVuZC4gUHJpbnRzIGNhbm5vdCBzdGFydCB1bnRpbCBpdCBpcyBkb25lLlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwidXBkX19hY3Rpb25zXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWlmPVwic3RhZ2UgPT09ICd1cGRhdGVkJ1wiXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidXBkYXRpbmctcmVsb2FkXCJcbiAgICAgICAgICBAY2xpY2s9XCJyZWxvYWRcIlxuICAgICAgICA+XG4gICAgICAgICAgUmVsb2FkXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1pZj1cInRvbmUgPT09ICdiYWQnIHx8IHN0YWdlID09PSAndXBkYXRlZCdcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1cGRhdGluZy1kb25lXCJcbiAgICAgICAgICBAY2xpY2s9XCJkb25lXCJcbiAgICAgICAgPlxuICAgICAgICAgIEJhY2sgdG8ge3sgcHJpbnRlck5hbWUgfX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWlmPVwiY2FuTGVhdmVcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1cGRhdGluZy1sZWF2ZVwiXG4gICAgICAgICAgQGNsaWNrPVwibGVhdmVcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJob21lXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICBCYWNrIHRvIE92ZXJ2aWV3XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJvZmZsaW5lXCJcbiAgICAgICAgICBjbGFzcz1cInVwZF9fd2FpdGluZ1wiXG4gICAgICAgID5XYWl0aW5nIGZvciB7eyBwcmludGVyTmFtZSB9feKApjwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cImNhbkxlYXZlICYmIGJ1c3lcIlxuICAgICAgICBjbGFzcz1cInN0aWxlX19ub3RlXCJcbiAgICAgID5cbiAgICAgICAgWW91IGNhbiBsZWF2ZSB0aGlzIHBhZ2U6IHRoZSB1cGRhdGUga2VlcHMgZ29pbmcsIGFuZCB0aGUgYmFyIGF0IHRoZSB0b3Agc2hvd3MgaXQuXG4gICAgICA8L3A+XG4gICAgPC9zZWN0aW9uPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVG9uZVBpbGwgZnJvbSAnQC9jb21wb25lbnRzL3ByaW50ZXJzL1RvbmVQaWxsLnZ1ZSdcbmltcG9ydCB7IHVwZGF0ZUhlYWRsaW5lLCB1cGRhdGVTdGVwcywgdmVyaWZ5U3RhbGUsIHZlcnNpb25MYWJlbCwgdHlwZSBTZXNzaW9uUGhhc2UsIHR5cGUgVXBkYXRlU3RlcCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9tb2RlbCdcbmltcG9ydCB7IGN1cnJlbnRPdXRjb21lLCBmb3JnZXRJbnN0YWxsLCB1cGRhdGVXYXRjaCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy93YXRjaCdcblxudHlwZSBTdGFnZSA9IFNlc3Npb25QaGFzZSB8ICdvZmZsaW5lJyB8ICdsYXRlJ1xuXG4vKipcbiAqIFRoZSBwcmludGVyIHVwZGF0aW5nLCBmcm9tIHRoZSBwcmVzcyB0byB0aGUgb3V0Y29tZTogdGhlIG5ldyB2ZXJzaW9uXG4gKiBiZWluZyB3cml0dGVuICh3aXRoIGl0cyBwcm9ncmVzcyksIHRoZSByZXN0YXJ0ICh3aGlsZSB0aGUgcHJpbnRlciBjYW4ndFxuICogYW5zd2VyLCB3aXRoIG5vIHByb2dyZXNzIHRvIHNob3cpLCB0aGUgY2hlY2sgdGhhdCBpdCB3b3JrcywgYW5kIGhvdyBpdFxuICogZW5kZWQuIFRoZSBjb25uZWN0aW9uIHNjcmVlbnMgc2hvdyBpdCB3aGlsZSB0aGUgcHJpbnRlciByZXN0YXJ0czsgaXQgaXNcbiAqIGFsc28gdGhlIHBhZ2UgYW4gaW5zdGFsbCBvcGVucywgd2hlcmUgaXQgc2l0cyBpbnNpZGUgdGhlIGZyYW1lICh0aGUgc2lkZWJhclxuICogYW5kIHRvcCBiYXIgc3RpbGwgd29yaykgYW5kIGxlYXZlcyB0aGUgcGFnZSBvcGVuIHRvIGdvIGJhY2s6IHRoZSB1cGRhdGVcbiAqIGtlZXBzIGdvaW5nIHdpdGhvdXQgaXQuXG4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFRvbmVQaWxsIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVwZGF0aW5nU2NyZWVuIGV4dGVuZHMgVnVlIHtcbiAgLyoqIFNob3duIGJlY2F1c2UgdGhlIHByaW50ZXIgY2FuJ3QgYmUgcmVhY2hlZDogJ3VwZGF0aW5nJywgb3IgJ3VwZGF0aW5nLWxhdGUnIHBhc3QgaXRzIGJ1ZGdldC4gKi9cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgb2ZmbGluZVN0YXRlITogJ3VwZGF0aW5nJyB8ICd1cGRhdGluZy1sYXRlJyB8IG51bGxcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ3RoZSBwcmludGVyJyB9KVxuICByZWFkb25seSBwcmludGVyTmFtZSE6IHN0cmluZ1xuXG4gIC8qKiBPbiB0aGUgcGFnZSAobm90IHRoZSByZXN0YXJ0IHNjcmVlbik6IG9mZmVycyBhIHdheSBiYWNrIHRvIE92ZXJ2aWV3LCB3aXRob3V0IGVuZGluZyB0aGUgaW5zdGFsbC4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9KVxuICByZWFkb25seSBjYW5MZWF2ZSE6IGJvb2xlYW5cblxuICBnZXQgcmVtZW1iZXJlZCAoKSB7XG4gICAgcmV0dXJuIHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWRcbiAgfVxuXG4gIGdldCBvZmZsaW5lICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLm9mZmxpbmVTdGF0ZVxuICB9XG5cbiAgZ2V0IHN0YWdlICgpOiBTdGFnZSB7XG4gICAgaWYgKHRoaXMub2ZmbGluZVN0YXRlID09PSAndXBkYXRpbmctbGF0ZScpIHJldHVybiAnbGF0ZSdcbiAgICBpZiAodGhpcy5vZmZsaW5lU3RhdGUgPT09ICd1cGRhdGluZycpIHJldHVybiAnb2ZmbGluZSdcbiAgICByZXR1cm4gY3VycmVudE91dGNvbWUoKSA/PyB0aGlzLnJlbWVtYmVyZWQ/LnBoYXNlID8/ICdpZGxlJ1xuICB9XG5cbiAgZ2V0IHRvbmUgKCk6ICdidXN5JyB8ICdnb29kJyB8ICdiYWQnIHwgJ2xhdGUnIHtcbiAgICBpZiAodGhpcy5zdGFnZSA9PT0gJ3VwZGF0ZWQnKSByZXR1cm4gJ2dvb2QnXG4gICAgaWYgKHRoaXMuc3RhZ2UgPT09ICdyb2xsZWRfYmFjaycgfHwgdGhpcy5zdGFnZSA9PT0gJ2ZhaWxlZCcpIHJldHVybiAnYmFkJ1xuICAgIGlmICh0aGlzLnN0YWdlID09PSAnbGF0ZScpIHJldHVybiAnbGF0ZSdcbiAgICByZXR1cm4gJ2J1c3knXG4gIH1cblxuICBnZXQgcGVyY2VudCAoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3QgcCA9IHRoaXMuc3RhZ2UgPT09ICdpbnN0YWxsaW5nJyA/IHRoaXMucmVtZW1iZXJlZD8ucHJvZ3Jlc3MgPz8gdXBkYXRlV2F0Y2guc3RhdHVzPy5wcm9ncmVzcyA/PyBudWxsIDogbnVsbFxuICAgIHJldHVybiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQocCkpKSA6IG51bGxcbiAgfVxuXG4gIGdldCBzcGlubmluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMudG9uZSA9PT0gJ2J1c3knICYmIHRoaXMucGVyY2VudCA9PT0gbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBhcmM6IHRoZSBwcm9ncmVzcyB3aGlsZSB3cml0aW5nLCBhIHR1cm5pbmcgcXVhcnRlciBvdGhlcndpc2UsIGEgZnVsbCByaW5nIGF0IHRoZSBlbmQuICovXG4gIGdldCBkYXNoICgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLnRvbmUgPT09ICdnb29kJyB8fCB0aGlzLnRvbmUgPT09ICdiYWQnKSByZXR1cm4gMzI3XG4gICAgaWYgKHRoaXMucGVyY2VudCAhPT0gbnVsbCkgcmV0dXJuIDMyNyAqIHRoaXMucGVyY2VudCAvIDEwMFxuICAgIHJldHVybiA4MlxuICB9XG5cbiAgZ2V0IGhlYWRsaW5lICgpIHtcbiAgICByZXR1cm4gdXBkYXRlSGVhZGxpbmUodGhpcy5zdGFnZSwgdGhpcy5wZXJjZW50LCB0aGlzLnJlbWVtYmVyZWQ/LnRvID8/IG51bGwsIHZlcmlmeVN0YWxlKHRoaXMucmVtZW1iZXJlZCwgdXBkYXRlV2F0Y2gubm93KSlcbiAgfVxuXG4gIGdldCBzdGVwcyAoKTogVXBkYXRlU3RlcFtdIHtcbiAgICByZXR1cm4gdXBkYXRlU3RlcHModGhpcy5zdGFnZSlcbiAgfVxuXG4gIGdldCBlcnJvclRleHQgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudG9uZSAhPT0gJ2JhZCcpIHJldHVybiAnJ1xuICAgIHJldHVybiB1cGRhdGVXYXRjaC5zdGF0dXM/LnNlc3Npb24/LmVycm9yPy5tZXNzYWdlID8/ICcnXG4gIH1cblxuICBnZXQgZnJvbVRleHQgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgdiA9IHRoaXMucmVtZW1iZXJlZD8uZnJvbVxuICAgIHJldHVybiB2ID8gdmVyc2lvbkxhYmVsKHYpLnRleHQgOiAnJ1xuICB9XG5cbiAgZ2V0IHRvVGV4dCAoKTogc3RyaW5nIHtcbiAgICBjb25zdCB2ID0gdGhpcy5yZW1lbWJlcmVkPy50b1xuICAgIHJldHVybiB2ID8gdmVyc2lvbkxhYmVsKHYpLnRleHQgOiAnJ1xuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIHNlcnZlcyB0aGUgbmV3IHZlcnNpb24ncyBGbHVpZGQgdG9vOiBsb2FkIGl0LiAqL1xuICByZWxvYWQgKCkge1xuICAgIGZvcmdldEluc3RhbGwoKVxuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKVxuICB9XG5cbiAgLyoqIFdoaWNoIG9mIHRoZSBzdGVwcyBpdCBpcyBvbiwgZm9yIFwiU3RlcCAyIG9mIDRcIi4gKi9cbiAgZ2V0IHN0ZXBOb3cgKCk6IG51bWJlciB7XG4gICAgY29uc3QgYXQgPSB0aGlzLnN0ZXBzLmZpbmRJbmRleChzID0+IHMuc3RhdGUgPT09ICdub3cnKVxuICAgIHJldHVybiBhdCA8IDAgPyB0aGlzLnN0ZXBzLmxlbmd0aCA6IGF0ICsgMVxuICB9XG5cbiAgLyoqIFVuZGVyIHdheTogdGhlIGJhciBtb3ZlcywgdGhlIHdhcm5pbmcgc2hvd3MuICovXG4gIGdldCBidXN5ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGFnZSAhPT0gJ2lkbGUnICYmICh0aGlzLnRvbmUgPT09ICdidXN5JyB8fCB0aGlzLnRvbmUgPT09ICdsYXRlJylcbiAgfVxuXG4gIC8qKiBMZWF2ZXMgdGhlIHBhZ2U7IHRoZSB1cGRhdGUgY2FycmllcyBvbiwgc28gbm90aGluZyBpcyBmb3Jnb3R0ZW4uICovXG4gIGxlYXZlICgpIHtcbiAgICB0aGlzLiRlbWl0KCdsZWF2ZScpXG4gIH1cblxuICBkb25lICgpIHtcbiAgICBmb3JnZXRJbnN0YWxsKClcbiAgICB0aGlzLiRlbWl0KCdkb25lJylcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnVwZCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBwYWRkaW5nOiAyNHB4IDE2cHg7XG4gIH1cblxuICAudXBkX19jYXJkIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDYyMHB4O1xuICB9XG5cbiAgLnVwZF9faWNvIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCkgIWltcG9ydGFudDtcbiAgfVxuXG4gIC51cGQtLWdvb2QgLnVwZF9faWNvIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MsICM1N2MwOGEpICFpbXBvcnRhbnQ7XG4gIH1cblxuICAudXBkLS1iYWQgLnVwZF9faWNvIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWRhbmdlciwgI2U1NTM0YikgIWltcG9ydGFudDtcbiAgfVxuXG4gIC51cGQtLWxhdGUgLnVwZF9faWNvIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXdhcm5pbmcsICNlODk2M2MpICFpbXBvcnRhbnQ7XG4gIH1cblxuICAudXBkX190aXRsZSB7XG4gICAgZm9udC1zaXplOiAxOHB4O1xuICB9XG5cbiAgLnVwZF9fYmlnIHtcbiAgICBmb250LXNpemU6IDQwcHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICAgIGxpbmUtaGVpZ2h0OiAxO1xuXG4gICAgc21hbGwge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMThweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgfVxuICB9XG5cbiAgLnVwZF9fYmFyIHtcbiAgICBoZWlnaHQ6IDhweDtcblxuICAgIGkge1xuICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC42cyB2YXIoLS1tM2QtZWFzZSwgZWFzZSk7XG4gICAgfVxuICB9XG5cbiAgLnVwZF9fYmFyLS13YWl0IGkge1xuICAgIGFuaW1hdGlvbjogdXBkLXNsaWRlIDEuNnMgZWFzZS1pbi1vdXQgaW5maW5pdGUgYWx0ZXJuYXRlO1xuICB9XG5cbiAgLnVwZC0tZ29vZCAudXBkX19iYXIgaSB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1Y2Nlc3MsICM1N2MwOGEpO1xuICB9XG5cbiAgLnVwZC0tYmFkIC51cGRfX2JhciBpIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZGFuZ2VyLCAjZTU1MzRiKTtcbiAgfVxuXG4gIC51cGQtLWxhdGUgLnVwZF9fYmFyIGkge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC13YXJuaW5nLCAjZTg5NjNjKTtcbiAgfVxuXG4gIEBrZXlmcmFtZXMgdXBkLXNsaWRlIHtcbiAgICBmcm9tIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDApOyB9XG4gICAgdG8geyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMjMzJSk7IH1cbiAgfVxuXG4gIC51cGRfX3RleHQge1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC51cGRfX2Vycm9yIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpICFpbXBvcnRhbnQ7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLnVwZF9fc3RlcHMge1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiA0cHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpICFpbXBvcnRhbnQ7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcblxuICAgIC5zcm93IHtcbiAgICAgIG1pbi1oZWlnaHQ6IDQ4cHg7XG4gICAgICBwYWRkaW5nLXJpZ2h0OiAwO1xuICAgICAgcGFkZGluZy1sZWZ0OiAwO1xuICAgIH1cblxuICAgIC5zcm93X192IHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICBmb250LXdlaWdodDogNTAwO1xuICAgIH1cbiAgfVxuXG4gIC51cGRfX3N0IHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGZsZXg6IG5vbmU7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogMjJweDtcbiAgICBoZWlnaHQ6IDIycHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC51cGRfX3N0ZXAtLWRvbmUgLnVwZF9fc3Qge1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtc3VjY2VzcywgIzU3YzA4YSkgMTYlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1zdWNjZXNzLCAjNTdjMDhhKTtcbiAgfVxuXG4gIC51cGRfX3N0ZXAtLW5vdyB7XG4gICAgLnVwZF9fc3Qge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTtcbiAgICB9XG5cbiAgICAuc3Jvd19fdiB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLnVwZF9fc3RlcC0tbmV4dCAuc3Jvd19fdCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC51cGRfX2RvdCB7XG4gICAgd2lkdGg6IDhweDtcbiAgICBoZWlnaHQ6IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgYW5pbWF0aW9uOiB1cGQtcHVsc2UgMS4ycyBlYXNlLWluLW91dCBpbmZpbml0ZTtcbiAgfVxuXG4gIEBrZXlmcmFtZXMgdXBkLXB1bHNlIHtcbiAgICA1MCUgeyBvcGFjaXR5OiAwLjM1OyB9XG4gIH1cblxuICAudXBkX192ZXJzaW9ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIG1hcmdpbjogMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC51cGRfX2FjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGdhcDogMTBweDtcbiAgfVxuXG4gIC51cGRfX3dhaXRpbmcge1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICA6cm9vdC5tM2QtcmVkdWNlZC1tb3Rpb24ge1xuICAgIC51cGRfX2Jhci0td2FpdCBpLFxuICAgIC51cGRfX2RvdCB7XG4gICAgICBhbmltYXRpb246IG5vbmU7XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdXBkYXRlcy9VcGRhdGluZ1NjcmVlbi52dWUifQ==