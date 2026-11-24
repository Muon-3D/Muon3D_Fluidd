/* unplugin-vue-components disabled */import { VAlert as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VProgressCircular as __unplugin_components_5 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, VModel, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import {
  AccessUnavailable
} from "/src/services/muon-access/api.ts";
const POLL_MS = 2e3;
let AccessRequestDialog = class extends Vue {
  open;
  client;
  ask;
  printerName;
  phase = "asking";
  request = null;
  error = "";
  now = Date.now();
  timer = null;
  /** Closed or cancelled. A request that comes back after this is withdrawn. */
  gone = false;
  get title() {
    return this.ask.kind === "join" ? "Ask for access" : "Confirm on the printer";
  }
  get secondsLeft() {
    if (!this.request) return 0;
    return Math.max(0, Math.round((this.request.expiresAt - this.now) / 1e3));
  }
  get outcome() {
    switch (this.phase) {
      case "allowed":
        return this.ask.kind === "join" ? `${this.printerName} let you in. Connect to it from the printer list.` : `${this.printerName} allowed the change.`;
      case "refused":
        return `${this.printerName} refused.`;
      case "expired":
        return "Nobody answered at the printer in time. Ask again when someone is beside it.";
      default:
        return this.error;
    }
  }
  async mounted() {
    try {
      const request = await this.client.request(this.ask, "Muon3D Fluidd");
      if (this.gone) {
        this.client.cancelRequest(request.requestId).catch(() => {
        });
        return;
      }
      this.request = request;
      this.phase = "pending";
      this.timer = window.setInterval(() => this.poll(), POLL_MS);
    } catch (error) {
      if (this.gone) return;
      this.phase = "failed";
      this.error = error instanceof AccessUnavailable ? `${this.printerName}'s software cannot take requests yet. Ask its owner to let you in.` : error.message;
    }
  }
  beforeDestroy() {
    this.gone = true;
    this.stop();
    if (this.phase === "pending" && this.request) this.client.cancelRequest(this.request.requestId).catch(() => {
    });
  }
  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
  async poll() {
    this.now = Date.now();
    if (!this.request || this.phase !== "pending") return;
    try {
      const status = await this.client.requestStatus(this.request.requestId);
      if (this.phase !== "pending" || status === "pending") return;
      this.phase = status;
      this.stop();
      this.$emit("answered", status);
    } catch {
    }
  }
  async cancel() {
    this.gone = true;
    this.stop();
    if (this.request && this.phase === "pending") await this.client.cancelRequest(this.request.requestId).catch(() => {
    });
    this.phase = "expired";
    this.open = false;
  }
};
__decorateClass([
  VModel({ type: Boolean })
], AccessRequestDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: Object, required: true })
], AccessRequestDialog.prototype, "client", 2);
__decorateClass([
  Prop({ type: Object, required: true })
], AccessRequestDialog.prototype, "ask", 2);
__decorateClass([
  Prop({ type: String, required: true })
], AccessRequestDialog.prototype, "printerName", 2);
AccessRequestDialog = __decorateClass([
  Component({})
], AccessRequestDialog);
const _sfc_main = AccessRequestDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "title": _vm.title, "max-width": "420" }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c(__unplugin_components_1), _vm.phase === "pending" || _vm.phase === "asking" ? _c(__unplugin_components_2, { attrs: { "text": "" }, on: { "click": _vm.cancel } }, [_vm._v(" Cancel ")]) : _c(__unplugin_components_3, { attrs: { "text": "", "color": "primary" }, on: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" Close ")])];
  }, proxy: true }]), model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_4, { staticClass: "pt-4" }, [_vm.phase === "asking" ? [_c("div", { staticClass: "d-flex align-center" }, [_c(__unplugin_components_5, { staticClass: "mr-3", attrs: { "indeterminate": "", "size": "18", "width": "2" } }), _vm._v(" Asking " + _vm._s(_vm.printerName) + "\u2026 ")], 1)] : _vm.phase === "pending" ? [_c("p", { staticClass: "mb-3" }, [_vm._v(" " + _vm._s(_vm.printerName) + " is asking on its screen now. Press the knob to allow it, or turn it to refuse. ")]), _c("div", { staticClass: "access-code", attrs: { "data-tid": "access-code" } }, [_vm._v(" " + _vm._s(_vm.request && _vm.request.code) + " ")]), _c("p", { staticClass: "text-body-2 secondary--text mb-0" }, [_vm._v(" The printer shows the same code. It stops asking after " + _vm._s(_vm.secondsLeft) + " s. ")])] : _c(__unplugin_components_6, { staticClass: "mb-0", attrs: { "type": _vm.phase === "allowed" ? "success" : _vm.phase === "failed" ? "error" : "info", "dense": "", "text": "", "data-tid": "access-outcome" } }, [_vm._v(" " + _vm._s(_vm.outcome) + " ")])], 2)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/muon-access/AccessRequestDialog.vue?vue&type=style&index=0&scoped=d5b75c99&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "d5b75c99",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/muon-access/AccessRequestDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUlBO0FBS0E7QUFRQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQ0EsMENBQ0EseUVBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUFBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQSx3REFDQSwwRkFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUE5RkE7QUFBQSxFQURBO0FBQUEsR0FEQSxvQkFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsb0JBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLG9CQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxvQkFXQTtBQVhBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFjY2Vzc1JlcXVlc3REaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGFwcC1kaWFsb2dcbiAgICB2LW1vZGVsPVwib3BlblwiXG4gICAgOnRpdGxlPVwidGl0bGVcIlxuICAgIG1heC13aWR0aD1cIjQyMFwiXG4gID5cbiAgICA8di1jYXJkLXRleHQgY2xhc3M9XCJwdC00XCI+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInBoYXNlID09PSAnYXNraW5nJ1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZC1mbGV4IGFsaWduLWNlbnRlclwiPlxuICAgICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgICAgICBzaXplPVwiMThcIlxuICAgICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgICAgIGNsYXNzPVwibXItM1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgICBBc2tpbmcge3sgcHJpbnRlck5hbWUgfX3igKZcbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8dGVtcGxhdGUgdi1lbHNlLWlmPVwicGhhc2UgPT09ICdwZW5kaW5nJ1wiPlxuICAgICAgICA8cCBjbGFzcz1cIm1iLTNcIj5cbiAgICAgICAgICB7eyBwcmludGVyTmFtZSB9fSBpcyBhc2tpbmcgb24gaXRzIHNjcmVlbiBub3cuIFByZXNzIHRoZSBrbm9iIHRvIGFsbG93IGl0LCBvciB0dXJuIGl0IHRvIHJlZnVzZS5cbiAgICAgICAgPC9wPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJhY2Nlc3MtY29kZVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJhY2Nlc3MtY29kZVwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyByZXF1ZXN0ICYmIHJlcXVlc3QuY29kZSB9fVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LWJvZHktMiBzZWNvbmRhcnktLXRleHQgbWItMFwiPlxuICAgICAgICAgIFRoZSBwcmludGVyIHNob3dzIHRoZSBzYW1lIGNvZGUuIEl0IHN0b3BzIGFza2luZyBhZnRlciB7eyBzZWNvbmRzTGVmdCB9fSBzLlxuICAgICAgICA8L3A+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8di1hbGVydFxuICAgICAgICB2LWVsc2VcbiAgICAgICAgOnR5cGU9XCJwaGFzZSA9PT0gJ2FsbG93ZWQnID8gJ3N1Y2Nlc3MnIDogcGhhc2UgPT09ICdmYWlsZWQnID8gJ2Vycm9yJyA6ICdpbmZvJ1wiXG4gICAgICAgIGRlbnNlXG4gICAgICAgIHRleHRcbiAgICAgICAgY2xhc3M9XCJtYi0wXCJcbiAgICAgICAgZGF0YS10aWQ9XCJhY2Nlc3Mtb3V0Y29tZVwiXG4gICAgICA+XG4gICAgICAgIHt7IG91dGNvbWUgfX1cbiAgICAgIDwvdi1hbGVydD5cbiAgICA8L3YtY2FyZC10ZXh0PlxuXG4gICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgPHYtc3BhY2VyIC8+XG4gICAgICA8di1idG5cbiAgICAgICAgdi1pZj1cInBoYXNlID09PSAncGVuZGluZycgfHwgcGhhc2UgPT09ICdhc2tpbmcnXCJcbiAgICAgICAgdGV4dFxuICAgICAgICBAY2xpY2s9XCJjYW5jZWxcIlxuICAgICAgPlxuICAgICAgICBDYW5jZWxcbiAgICAgIDwvdi1idG4+XG4gICAgICA8di1idG5cbiAgICAgICAgdi1lbHNlXG4gICAgICAgIHRleHRcbiAgICAgICAgY29sb3I9XCJwcmltYXJ5XCJcbiAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgID5cbiAgICAgICAgQ2xvc2VcbiAgICAgIDwvdi1idG4+XG4gICAgPC90ZW1wbGF0ZT5cbiAgPC9hcHAtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVk1vZGVsLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHtcbiAgQWNjZXNzVW5hdmFpbGFibGUsXG4gIHR5cGUgQWNjZXNzQXNrLFxuICB0eXBlIEFjY2Vzc0NsaWVudCxcbiAgdHlwZSBBY2Nlc3NSZXF1ZXN0XG59IGZyb20gJ0Avc2VydmljZXMvbXVvbi1hY2Nlc3MvYXBpJ1xuXG50eXBlIFBoYXNlID0gJ2Fza2luZycgfCAncGVuZGluZycgfCAnYWxsb3dlZCcgfCAncmVmdXNlZCcgfCAnZXhwaXJlZCcgfCAnZmFpbGVkJ1xuXG4vKiogSG93IG9mdGVuIHRoZSBhbnN3ZXIgaXMgYXNrZWQgZm9yLiBUaGUgcGFuZWwgZ2l2ZXMgdXAgYWZ0ZXIgdHdvIG1pbnV0ZXMuICovXG5jb25zdCBQT0xMX01TID0gMjAwMFxuXG4vKipcbiAqIEFza3MgYSBwcmludGVyJ3MgcGFuZWwgdG8gYWxsb3cgb25lIHRoaW5nIChhY2Nlc3MtbW9kZWwgMi41LCBBQ0MtNi8xNyk6XG4gKiBhIGNoYW5nZSBvZiBlbnRyeSwgb3IgdGhpcyBicm93c2VyIGJlaW5nIGxldCBpbiAoYGpvaW5gKS4gT25seSBmcm9tIHRoZVxuICogcHJpbnRlcidzIGhvbWUgbmV0d29yazsgdGhlIHBhbmVsIGFuc3dlcnMsIGFuZCB0aGUgZmlyc3QgYW5zd2VyIHdpbnMuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBY2Nlc3NSZXF1ZXN0RGlhbG9nIGV4dGVuZHMgVnVlIHtcbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBjbGllbnQhOiBBY2Nlc3NDbGllbnRcblxuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgYXNrITogQWNjZXNzQXNrXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IHByaW50ZXJOYW1lITogc3RyaW5nXG5cbiAgcGhhc2U6IFBoYXNlID0gJ2Fza2luZydcbiAgcmVxdWVzdDogQWNjZXNzUmVxdWVzdCB8IG51bGwgPSBudWxsXG4gIGVycm9yID0gJydcbiAgbm93ID0gRGF0ZS5ub3coKVxuICB0aW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgLyoqIENsb3NlZCBvciBjYW5jZWxsZWQuIEEgcmVxdWVzdCB0aGF0IGNvbWVzIGJhY2sgYWZ0ZXIgdGhpcyBpcyB3aXRoZHJhd24uICovXG4gIGdvbmUgPSBmYWxzZVxuXG4gIGdldCB0aXRsZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXNrLmtpbmQgPT09ICdqb2luJyA/ICdBc2sgZm9yIGFjY2VzcycgOiAnQ29uZmlybSBvbiB0aGUgcHJpbnRlcidcbiAgfVxuXG4gIGdldCBzZWNvbmRzTGVmdCAoKSB7XG4gICAgaWYgKCF0aGlzLnJlcXVlc3QpIHJldHVybiAwXG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgucm91bmQoKHRoaXMucmVxdWVzdC5leHBpcmVzQXQgLSB0aGlzLm5vdykgLyAxMDAwKSlcbiAgfVxuXG4gIGdldCBvdXRjb21lICgpIHtcbiAgICBzd2l0Y2ggKHRoaXMucGhhc2UpIHtcbiAgICAgIGNhc2UgJ2FsbG93ZWQnOlxuICAgICAgICByZXR1cm4gdGhpcy5hc2sua2luZCA9PT0gJ2pvaW4nXG4gICAgICAgICAgPyBgJHt0aGlzLnByaW50ZXJOYW1lfSBsZXQgeW91IGluLiBDb25uZWN0IHRvIGl0IGZyb20gdGhlIHByaW50ZXIgbGlzdC5gXG4gICAgICAgICAgOiBgJHt0aGlzLnByaW50ZXJOYW1lfSBhbGxvd2VkIHRoZSBjaGFuZ2UuYFxuICAgICAgY2FzZSAncmVmdXNlZCc6XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnByaW50ZXJOYW1lfSByZWZ1c2VkLmBcbiAgICAgIGNhc2UgJ2V4cGlyZWQnOlxuICAgICAgICByZXR1cm4gJ05vYm9keSBhbnN3ZXJlZCBhdCB0aGUgcHJpbnRlciBpbiB0aW1lLiBBc2sgYWdhaW4gd2hlbiBzb21lb25lIGlzIGJlc2lkZSBpdC4nXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5lcnJvclxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG1vdW50ZWQgKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gYXdhaXQgdGhpcy5jbGllbnQucmVxdWVzdCh0aGlzLmFzaywgJ011b24zRCBGbHVpZGQnKVxuICAgICAgaWYgKHRoaXMuZ29uZSkge1xuICAgICAgICAvLyBDbG9zZWQgd2hpbGUgdGhlIHByaW50ZXIgd2FzIHN0aWxsIGJlaW5nIGFza2VkOiB0YWtlIGl0IG9mZiB0aGUgc2NyZWVuLlxuICAgICAgICB0aGlzLmNsaWVudC5jYW5jZWxSZXF1ZXN0KHJlcXVlc3QucmVxdWVzdElkKS5jYXRjaCgoKSA9PiB7fSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnJlcXVlc3QgPSByZXF1ZXN0XG4gICAgICB0aGlzLnBoYXNlID0gJ3BlbmRpbmcnXG4gICAgICB0aGlzLnRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHRoaXMucG9sbCgpLCBQT0xMX01TKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAodGhpcy5nb25lKSByZXR1cm5cbiAgICAgIHRoaXMucGhhc2UgPSAnZmFpbGVkJ1xuICAgICAgdGhpcy5lcnJvciA9IGVycm9yIGluc3RhbmNlb2YgQWNjZXNzVW5hdmFpbGFibGVcbiAgICAgICAgPyBgJHt0aGlzLnByaW50ZXJOYW1lfSdzIHNvZnR3YXJlIGNhbm5vdCB0YWtlIHJlcXVlc3RzIHlldC4gQXNrIGl0cyBvd25lciB0byBsZXQgeW91IGluLmBcbiAgICAgICAgOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2VcbiAgICB9XG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB0aGlzLmdvbmUgPSB0cnVlXG4gICAgdGhpcy5zdG9wKClcbiAgICAvLyBMZWF2aW5nIHdoaWxlIGl0IGlzIHN0aWxsIGFza2luZyB0YWtlcyB0aGUgcXVlc3Rpb24gb2ZmIHRoZSBwcmludGVyJ3Mgc2NyZWVuLlxuICAgIGlmICh0aGlzLnBoYXNlID09PSAncGVuZGluZycgJiYgdGhpcy5yZXF1ZXN0KSB0aGlzLmNsaWVudC5jYW5jZWxSZXF1ZXN0KHRoaXMucmVxdWVzdC5yZXF1ZXN0SWQpLmNhdGNoKCgpID0+IHt9KVxuICB9XG5cbiAgc3RvcCAoKSB7XG4gICAgaWYgKHRoaXMudGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMudGltZXIpXG4gICAgdGhpcy50aW1lciA9IG51bGxcbiAgfVxuXG4gIGFzeW5jIHBvbGwgKCkge1xuICAgIHRoaXMubm93ID0gRGF0ZS5ub3coKVxuICAgIGlmICghdGhpcy5yZXF1ZXN0IHx8IHRoaXMucGhhc2UgIT09ICdwZW5kaW5nJykgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHRoaXMuY2xpZW50LnJlcXVlc3RTdGF0dXModGhpcy5yZXF1ZXN0LnJlcXVlc3RJZClcbiAgICAgIGlmICh0aGlzLnBoYXNlICE9PSAncGVuZGluZycgfHwgc3RhdHVzID09PSAncGVuZGluZycpIHJldHVyblxuICAgICAgdGhpcy5waGFzZSA9IHN0YXR1c1xuICAgICAgdGhpcy5zdG9wKClcbiAgICAgIHRoaXMuJGVtaXQoJ2Fuc3dlcmVkJywgc3RhdHVzKVxuICAgIH0gY2F0Y2ggeyAvKiBhc2sgYWdhaW4gbmV4dCB0aW1lICovIH1cbiAgfVxuXG4gIGFzeW5jIGNhbmNlbCAoKSB7XG4gICAgdGhpcy5nb25lID0gdHJ1ZVxuICAgIHRoaXMuc3RvcCgpXG4gICAgaWYgKHRoaXMucmVxdWVzdCAmJiB0aGlzLnBoYXNlID09PSAncGVuZGluZycpIGF3YWl0IHRoaXMuY2xpZW50LmNhbmNlbFJlcXVlc3QodGhpcy5yZXF1ZXN0LnJlcXVlc3RJZCkuY2F0Y2goKCkgPT4ge30pXG4gICAgdGhpcy5waGFzZSA9ICdleHBpcmVkJ1xuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4uYWNjZXNzLWNvZGUge1xuICBmb250LWZhbWlseTogJ1JvYm90byBNb25vJywgdWktbW9ub3NwYWNlLCBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogMzJweDtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgbGV0dGVyLXNwYWNpbmc6IDAuM2VtO1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDEycHggMDtcbiAgbWFyZ2luLWJvdHRvbTogMTJweDtcbiAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgxMjgsIDEyOCwgMTI4LCAwLjMpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xufVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL211b24tYWNjZXNzL0FjY2Vzc1JlcXVlc3REaWFsb2cudnVlIn0=