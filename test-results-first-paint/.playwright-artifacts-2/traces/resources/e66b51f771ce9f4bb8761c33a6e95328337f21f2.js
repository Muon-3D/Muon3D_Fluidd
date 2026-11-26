/* unplugin-vue-components disabled */import { VAlert as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VBtn as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { APPROVAL_WINDOW_S, APPROVAL_WORDS } from "/src/services/muon-cloud/approval.ts";
let ApprovalWaitDialog = class extends Vue {
  watch;
  printerName;
  windowSeconds;
  symbols = null;
  result = null;
  startedAt = 0;
  now = 0;
  timer = null;
  gone = false;
  get visible() {
    return this.symbols !== null || this.result !== null;
  }
  get secondsLeft() {
    return Math.max(0, Math.ceil(this.windowSeconds - (this.now - this.startedAt) / 1e3));
  }
  get outcomeText() {
    if (this.result === "admitted") return `${this.printerName} let this device in.`;
    return this.result ? APPROVAL_WORDS[this.result] : "";
  }
  created() {
    this.watch.pending.then((symbols) => {
      if (this.gone || this.result) return;
      this.symbols = symbols;
      this.startedAt = this.now = Date.now();
      this.timer = window.setInterval(() => {
        this.now = Date.now();
      }, 1e3);
    });
    this.watch.outcome.then((outcome) => {
      if (this.gone) return;
      this.stop();
      this.result = outcome;
      this.$emit(outcome === "admitted" ? "admitted" : "failed", outcome);
    });
  }
  beforeDestroy() {
    this.gone = true;
    this.stop();
  }
  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
  cancel() {
    this.gone = true;
    this.stop();
    this.watch.cancel();
    this.$emit("close");
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], ApprovalWaitDialog.prototype, "watch", 2);
__decorateClass([
  Prop({ type: String, default: "the printer" })
], ApprovalWaitDialog.prototype, "printerName", 2);
__decorateClass([
  Prop({ type: Number, default: APPROVAL_WINDOW_S })
], ApprovalWaitDialog.prototype, "windowSeconds", 2);
ApprovalWaitDialog = __decorateClass([
  Component({})
], ApprovalWaitDialog);
const _sfc_main = ApprovalWaitDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.visible, "title": "Waiting for approval", "max-width": "420", "persistent": "" }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c(__unplugin_components_1), !_vm.result ? _c(__unplugin_components_2, { attrs: { "text": "", "data-tid": "approval-cancel" }, on: { "click": _vm.cancel } }, [_vm._v(" Cancel ")]) : [_c(__unplugin_components_3, { attrs: { "text": "", "data-tid": "approval-close" }, on: { "click": function($event) {
      return _vm.$emit("close");
    } } }, [_vm._v(" Close ")]), _vm.result !== "admitted" ? _c(__unplugin_components_4, { attrs: { "text": "", "color": "primary", "data-tid": "approval-retry" }, on: { "click": function($event) {
      return _vm.$emit("retry");
    } } }, [_vm._v(" Try again ")]) : _vm._e()]];
  }, proxy: true }]) }, [_c(__unplugin_components_5, { staticClass: "pt-4" }, [!_vm.result ? [_c("p", { staticClass: "mb-3" }, [_vm._v(" Waiting for approval at the printer ")]), _c("div", { staticClass: "approval-symbols", attrs: { "data-tid": "approval-symbols" } }, [_vm._v(" " + _vm._s(_vm.symbols) + " ")]), _c("p", { staticClass: "text-body-2 secondary--text mb-1" }, [_vm._v(" Check these match the printer's screen. ")]), _c("p", { staticClass: "text-body-2 secondary--text mb-0", attrs: { "data-tid": "approval-countdown" } }, [_vm._v(" " + _vm._s(_vm.secondsLeft) + " s left ")])] : _c(__unplugin_components_6, { staticClass: "mb-0", attrs: { "type": _vm.result === "admitted" ? "success" : "info", "dense": "", "text": "", "data-tid": "approval-outcome" } }, [_vm._v(" " + _vm._s(_vm.outcomeText) + " ")])], 2)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-cloud/ApprovalWaitDialog.vue?vue&type=style&index=0&scoped=4526d88b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "4526d88b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-cloud/ApprovalWaitDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwRUE7QUFDQTtBQVNBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBM0RBO0FBQUEsRUFEQTtBQUFBLEdBREEsbUJBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLG1CQUtBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FQQSxtQkFRQTtBQVJBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFwcHJvdmFsV2FpdERpYWxvZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8YXBwLWRpYWxvZ1xuICAgIDp2YWx1ZT1cInZpc2libGVcIlxuICAgIHRpdGxlPVwiV2FpdGluZyBmb3IgYXBwcm92YWxcIlxuICAgIG1heC13aWR0aD1cIjQyMFwiXG4gICAgcGVyc2lzdGVudFxuICA+XG4gICAgPHYtY2FyZC10ZXh0IGNsYXNzPVwicHQtNFwiPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCIhcmVzdWx0XCI+XG4gICAgICAgIDxwIGNsYXNzPVwibWItM1wiPlxuICAgICAgICAgIFdhaXRpbmcgZm9yIGFwcHJvdmFsIGF0IHRoZSBwcmludGVyXG4gICAgICAgIDwvcD5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwiYXBwcm92YWwtc3ltYm9sc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJhcHByb3ZhbC1zeW1ib2xzXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHN5bWJvbHMgfX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxwIGNsYXNzPVwidGV4dC1ib2R5LTIgc2Vjb25kYXJ5LS10ZXh0IG1iLTFcIj5cbiAgICAgICAgICBDaGVjayB0aGVzZSBtYXRjaCB0aGUgcHJpbnRlcidzIHNjcmVlbi5cbiAgICAgICAgPC9wPlxuICAgICAgICA8cFxuICAgICAgICAgIGNsYXNzPVwidGV4dC1ib2R5LTIgc2Vjb25kYXJ5LS10ZXh0IG1iLTBcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiYXBwcm92YWwtY291bnRkb3duXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHNlY29uZHNMZWZ0IH19IHMgbGVmdFxuICAgICAgICA8L3A+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8di1hbGVydFxuICAgICAgICB2LWVsc2VcbiAgICAgICAgOnR5cGU9XCJyZXN1bHQgPT09ICdhZG1pdHRlZCcgPyAnc3VjY2VzcycgOiAnaW5mbydcIlxuICAgICAgICBkZW5zZVxuICAgICAgICB0ZXh0XG4gICAgICAgIGNsYXNzPVwibWItMFwiXG4gICAgICAgIGRhdGEtdGlkPVwiYXBwcm92YWwtb3V0Y29tZVwiXG4gICAgICA+XG4gICAgICAgIHt7IG91dGNvbWVUZXh0IH19XG4gICAgICA8L3YtYWxlcnQ+XG4gICAgPC92LWNhcmQtdGV4dD5cblxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgIDx2LXNwYWNlciAvPlxuICAgICAgPHYtYnRuXG4gICAgICAgIHYtaWY9XCIhcmVzdWx0XCJcbiAgICAgICAgdGV4dFxuICAgICAgICBkYXRhLXRpZD1cImFwcHJvdmFsLWNhbmNlbFwiXG4gICAgICAgIEBjbGljaz1cImNhbmNlbFwiXG4gICAgICA+XG4gICAgICAgIENhbmNlbFxuICAgICAgPC92LWJ0bj5cbiAgICAgIDx0ZW1wbGF0ZSB2LWVsc2U+XG4gICAgICAgIDx2LWJ0blxuICAgICAgICAgIHRleHRcbiAgICAgICAgICBkYXRhLXRpZD1cImFwcHJvdmFsLWNsb3NlXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnY2xvc2UnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBDbG9zZVxuICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8di1idG5cbiAgICAgICAgICB2LWlmPVwicmVzdWx0ICE9PSAnYWRtaXR0ZWQnXCJcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImFwcHJvdmFsLXJldHJ5XCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgncmV0cnknKVwiXG4gICAgICAgID5cbiAgICAgICAgICBUcnkgYWdhaW5cbiAgICAgICAgPC92LWJ0bj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9hcHAtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IEFQUFJPVkFMX1dJTkRPV19TLCBBUFBST1ZBTF9XT1JEUywgdHlwZSBBcHByb3ZhbE91dGNvbWUsIHR5cGUgQXBwcm92YWxXYXRjaCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9hcHByb3ZhbCdcblxuLyoqXG4gKiBUaGUgd2FpdCBhZnRlciBhbiB1bmtub3duIGJyb3dzZXIgY29ubmVjdHMgdG8gYSBwcmludGVyIChJLTE3MCk6IHRoZSBzeW1ib2xzXG4gKiB0byBjb21wYXJlIHdpdGggdGhlIHByaW50ZXIncyBzY3JlZW4sIGEgY291bnRkb3duLCBDYW5jZWwsIGFuZCBlYWNoIHdheSB0aGVcbiAqIHdhaXQgY2FuIGVuZCBpbiBwbGFpbiB3b3Jkcy4gVGhlIHByaW50ZXIgZGVjaWRlcyB0aGUgZW5kOyB0aGUgY291bnRkb3duIGlzXG4gKiBvbmx5IGEgcmVtaW5kZXIgYW5kIG5ldmVyIGVuZHMgdGhlIHdhaXQgaXRzZWxmLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwcm92YWxXYWl0RGlhbG9nIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBPYmplY3QsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHdhdGNoITogQXBwcm92YWxXYXRjaFxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAndGhlIHByaW50ZXInIH0pXG4gIHJlYWRvbmx5IHByaW50ZXJOYW1lITogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IEFQUFJPVkFMX1dJTkRPV19TIH0pXG4gIHJlYWRvbmx5IHdpbmRvd1NlY29uZHMhOiBudW1iZXJcblxuICBzeW1ib2xzOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICByZXN1bHQ6IEFwcHJvdmFsT3V0Y29tZSB8IG51bGwgPSBudWxsXG4gIHN0YXJ0ZWRBdCA9IDBcbiAgbm93ID0gMFxuICB0aW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgZ29uZSA9IGZhbHNlXG5cbiAgZ2V0IHZpc2libGUgKCkge1xuICAgIHJldHVybiB0aGlzLnN5bWJvbHMgIT09IG51bGwgfHwgdGhpcy5yZXN1bHQgIT09IG51bGxcbiAgfVxuXG4gIGdldCBzZWNvbmRzTGVmdCAoKSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGguY2VpbCh0aGlzLndpbmRvd1NlY29uZHMgLSAodGhpcy5ub3cgLSB0aGlzLnN0YXJ0ZWRBdCkgLyAxMDAwKSlcbiAgfVxuXG4gIGdldCBvdXRjb21lVGV4dCAoKSB7XG4gICAgaWYgKHRoaXMucmVzdWx0ID09PSAnYWRtaXR0ZWQnKSByZXR1cm4gYCR7dGhpcy5wcmludGVyTmFtZX0gbGV0IHRoaXMgZGV2aWNlIGluLmBcbiAgICByZXR1cm4gdGhpcy5yZXN1bHQgPyBBUFBST1ZBTF9XT1JEU1t0aGlzLnJlc3VsdF0gOiAnJ1xuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgdGhpcy53YXRjaC5wZW5kaW5nLnRoZW4oc3ltYm9scyA9PiB7XG4gICAgICBpZiAodGhpcy5nb25lIHx8IHRoaXMucmVzdWx0KSByZXR1cm5cbiAgICAgIHRoaXMuc3ltYm9scyA9IHN5bWJvbHNcbiAgICAgIHRoaXMuc3RhcnRlZEF0ID0gdGhpcy5ub3cgPSBEYXRlLm5vdygpXG4gICAgICB0aGlzLnRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHsgdGhpcy5ub3cgPSBEYXRlLm5vdygpIH0sIDEwMDApXG4gICAgfSlcbiAgICB0aGlzLndhdGNoLm91dGNvbWUudGhlbihvdXRjb21lID0+IHtcbiAgICAgIGlmICh0aGlzLmdvbmUpIHJldHVyblxuICAgICAgdGhpcy5zdG9wKClcbiAgICAgIHRoaXMucmVzdWx0ID0gb3V0Y29tZVxuICAgICAgdGhpcy4kZW1pdChvdXRjb21lID09PSAnYWRtaXR0ZWQnID8gJ2FkbWl0dGVkJyA6ICdmYWlsZWQnLCBvdXRjb21lKVxuICAgIH0pXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLmdvbmUgPSB0cnVlXG4gICAgdGhpcy5zdG9wKClcbiAgfVxuXG4gIHN0b3AgKCkge1xuICAgIGlmICh0aGlzLnRpbWVyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKVxuICAgIHRoaXMudGltZXIgPSBudWxsXG4gIH1cblxuICBjYW5jZWwgKCkge1xuICAgIHRoaXMuZ29uZSA9IHRydWVcbiAgICB0aGlzLnN0b3AoKVxuICAgIHRoaXMud2F0Y2guY2FuY2VsKClcbiAgICB0aGlzLiRlbWl0KCdjbG9zZScpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4uYXBwcm92YWwtc3ltYm9scyB7XG4gIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCB1aS1tb25vc3BhY2UsIG1vbm9zcGFjZTtcbiAgZm9udC1zaXplOiAzMnB4O1xuICBmb250LXdlaWdodDogNzAwO1xuICBsZXR0ZXItc3BhY2luZzogMC4zZW07XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgcGFkZGluZzogMTJweCAwO1xuICBtYXJnaW4tYm90dG9tOiAxMnB4O1xuICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDEyOCwgMTI4LCAxMjgsIDAuMyk7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG59XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9BcHByb3ZhbFdhaXREaWFsb2cudnVlIn0=