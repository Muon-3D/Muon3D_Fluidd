/* unplugin-vue-components disabled */import { VIcon as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
let FoundList = class extends Vue {
  tiles;
  actionsFor;
  busyKey;
  stepsFor;
  host(tile) {
    return tile.entry.lan?.host ?? tile.entry.host ?? "";
  }
  /** An action with no id when the printer offers nothing to do. */
  primary(tile) {
    if (tile.entry.row?.action === "set-up" && tile.entry.row.checkFirst) return { id: "set-up", label: "Connect over Bluetooth", icon: "$bluetooth" };
    if (tile.state === "new") return { id: "set-up", label: "Set it up", icon: "" };
    if (tile.entry.row?.action === "nearby-info") {
      return tile.entry.row.nearby?.endpointId ? { id: "pair-bluetooth", label: "Pair over Bluetooth", icon: "" } : { id: "nearby-info", label: "What is this?", icon: "" };
    }
    const open = this.actionsFor(tile).find((a) => a.id === "connect");
    return open ? { ...open, label: "Open" } : { id: "", label: "", icon: "" };
  }
  /** The steps of a Bluetooth connect in flight on this row, the current one marked; null when none is. */
  steps(tile) {
    return this.busyKey === tile.key ? this.stepsFor(tile) : null;
  }
  secondary(tile) {
    return this.actionsFor(tile).filter((a) => a.id !== "connect");
  }
  about(tile) {
    if (tile.state === "new") return "Not set up yet. Setup takes a few minutes: Wi-Fi, a name and a test print.";
    if (tile.entry.linkedTo === "other") return "Linked to another account. Use it on this network, or ask its owner to share it.";
    if (tile.state === "locked") return "It wants to know who you are before it lets this browser in.";
    return tile.entry.detail;
  }
};
__decorateClass([
  Prop({ type: Array, required: true })
], FoundList.prototype, "tiles", 2);
__decorateClass([
  Prop({ type: Function, required: true })
], FoundList.prototype, "actionsFor", 2);
__decorateClass([
  Prop({ type: String, default: null })
], FoundList.prototype, "busyKey", 2);
__decorateClass([
  Prop({ type: Function, default: () => null })
], FoundList.prototype, "stepsFor", 2);
FoundList = __decorateClass([
  Component({ components: { TonePill } })
], FoundList);
const _sfc_main = FoundList;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "rows", attrs: { "data-tid": "found-list" } }, _vm._l(_vm.tiles, function(tile) {
    return _c("div", { key: tile.key, staticClass: "row", attrs: { "data-tid": `found-${tile.key}` } }, [_c("span", { staticClass: "row__icon", class: { "row__icon--accent": tile.state === "new" } }, [_c(__unplugin_components_0, { attrs: { "name": "wifi" } })], 1), _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v(_vm._s(tile.name))]), _c("span", { staticClass: "row__sub mono" }, [_vm._v(_vm._s(_vm.host(tile)))]), _vm.about(tile) ? _c("span", { staticClass: "row__sub" }, [_vm._v(_vm._s(_vm.about(tile)))]) : _vm._e(), _vm.steps(tile) ? _c("span", { staticClass: "row__sub", attrs: { "data-tid": `found-steps-${tile.key}`, "role": "status" } }, [_vm._v("Connecting over Bluetooth\u2026 " + _vm._s(_vm.steps(tile)))]) : _vm._e()]), _vm.steps(tile) ? _c("button", { staticClass: "btn btn--sm", attrs: { "type": "button", "data-tid": "found-cancel" }, on: { "click": function($event) {
      return _vm.$emit("cancel", tile);
    } } }, [_vm._v(" Cancel ")]) : _vm._e(), tile.state !== "new" && tile.state !== "ready" ? _c("tone-pill", { attrs: { "tone": tile.tone } }, [_vm._v(" " + _vm._s(tile.label) + " ")]) : _vm._e(), _vm._l(_vm.secondary(tile), function(a) {
      return _c("button", { key: a.id, staticClass: "btn btn--sm", attrs: { "type": "button", "disabled": a.disabled, "data-tid": `found-${a.id}` }, on: { "click": function($event) {
        return _vm.$emit("action", tile, a.id);
      } } }, [_vm._v(" " + _vm._s(a.label) + " ")]);
    }), _vm.primary(tile).id ? _c("button", { staticClass: "btn btn--sm btn--primary", attrs: { "type": "button", "disabled": _vm.busyKey === tile.key || _vm.primary(tile).disabled, "data-tid": `found-${_vm.primary(tile).id}` }, on: { "click": function($event) {
      _vm.$emit("action", tile, _vm.primary(tile).id);
    } } }, [_vm.busyKey === tile.key ? _c(__unplugin_components_1, { attrs: { "indeterminate": "", "size": "14", "width": "2" } }) : _vm.primary(tile).id === "connect" ? _c(__unplugin_components_2, { attrs: { "name": "chevronRight", "small": "" } }) : _vm.primary(tile).id === "pair-bluetooth" || _vm.primary(tile).icon === "$bluetooth" ? _c(__unplugin_components_3, { attrs: { "small": "" } }, [_vm._v(" $bluetooth ")]) : _vm._e(), _vm._v(" " + _vm._s(_vm.primary(tile).label) + " ")], 1) : _vm._e()], 2);
  }), 0);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  null,
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/FoundList.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUF5RkE7QUFHQTtBQVFBO0FBQUEsRUFFQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFFQSxpREFDQSxtRUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUE5Q0E7QUFBQSxFQURBO0FBQUEsR0FEQSxVQUVBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FMQSxVQU1BO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FSQSxVQVNBO0FBSUE7QUFBQSxFQURBO0FBQUEsR0FaQSxVQWFBO0FBYkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiRm91bmRMaXN0LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cInJvd3NcIlxuICAgIGRhdGEtdGlkPVwiZm91bmQtbGlzdFwiXG4gID5cbiAgICA8ZGl2XG4gICAgICB2LWZvcj1cInRpbGUgaW4gdGlsZXNcIlxuICAgICAgOmtleT1cInRpbGUua2V5XCJcbiAgICAgIGNsYXNzPVwicm93XCJcbiAgICAgIDpkYXRhLXRpZD1cImBmb3VuZC0ke3RpbGUua2V5fWBcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIGNsYXNzPVwicm93X19pY29uXCJcbiAgICAgICAgOmNsYXNzPVwieyAncm93X19pY29uLS1hY2NlbnQnOiB0aWxlLnN0YXRlID09PSAnbmV3JyB9XCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cIndpZmlcIiAvPlxuICAgICAgPC9zcGFuPlxuICAgICAgPGRpdiBjbGFzcz1cInJvd19fdGV4dFwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fdGl0bGVcIj57eyB0aWxlLm5hbWUgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicm93X19zdWIgbW9ub1wiPnt7IGhvc3QodGlsZSkgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cImFib3V0KHRpbGUpXCJcbiAgICAgICAgICBjbGFzcz1cInJvd19fc3ViXCJcbiAgICAgICAgPnt7IGFib3V0KHRpbGUpIH19PC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIHYtaWY9XCJzdGVwcyh0aWxlKVwiXG4gICAgICAgICAgY2xhc3M9XCJyb3dfX3N1YlwiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYGZvdW5kLXN0ZXBzLSR7dGlsZS5rZXl9YFwiXG4gICAgICAgICAgcm9sZT1cInN0YXR1c1wiXG4gICAgICAgID5Db25uZWN0aW5nIG92ZXIgQmx1ZXRvb3Ro4oCmIHt7IHN0ZXBzKHRpbGUpIH19PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtaWY9XCJzdGVwcyh0aWxlKVwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJ0biBidG4tLXNtXCJcbiAgICAgICAgZGF0YS10aWQ9XCJmb3VuZC1jYW5jZWxcIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnY2FuY2VsJywgdGlsZSlcIlxuICAgICAgPlxuICAgICAgICBDYW5jZWxcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHRvbmUtcGlsbFxuICAgICAgICB2LWlmPVwidGlsZS5zdGF0ZSAhPT0gJ25ldycgJiYgdGlsZS5zdGF0ZSAhPT0gJ3JlYWR5J1wiXG4gICAgICAgIDp0b25lPVwidGlsZS50b25lXCJcbiAgICAgID5cbiAgICAgICAge3sgdGlsZS5sYWJlbCB9fVxuICAgICAgPC90b25lLXBpbGw+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtZm9yPVwiYSBpbiBzZWNvbmRhcnkodGlsZSlcIlxuICAgICAgICA6a2V5PVwiYS5pZFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJ0biBidG4tLXNtXCJcbiAgICAgICAgOmRpc2FibGVkPVwiYS5kaXNhYmxlZFwiXG4gICAgICAgIDpkYXRhLXRpZD1cImBmb3VuZC0ke2EuaWR9YFwiXG4gICAgICAgIEBjbGljaz1cIiRlbWl0KCdhY3Rpb24nLCB0aWxlLCBhLmlkKVwiXG4gICAgICA+XG4gICAgICAgIHt7IGEubGFiZWwgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWlmPVwicHJpbWFyeSh0aWxlKS5pZFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJ0biBidG4tLXNtIGJ0bi0tcHJpbWFyeVwiXG4gICAgICAgIDpkaXNhYmxlZD1cImJ1c3lLZXkgPT09IHRpbGUua2V5IHx8IHByaW1hcnkodGlsZSkuZGlzYWJsZWRcIlxuICAgICAgICA6ZGF0YS10aWQ9XCJgZm91bmQtJHtwcmltYXJ5KHRpbGUpLmlkfWBcIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgnYWN0aW9uJywgdGlsZSwgcHJpbWFyeSh0aWxlKS5pZClcIlxuICAgICAgPlxuICAgICAgICA8di1wcm9ncmVzcy1jaXJjdWxhclxuICAgICAgICAgIHYtaWY9XCJidXN5S2V5ID09PSB0aWxlLmtleVwiXG4gICAgICAgICAgaW5kZXRlcm1pbmF0ZVxuICAgICAgICAgIHNpemU9XCIxNFwiXG4gICAgICAgICAgd2lkdGg9XCIyXCJcbiAgICAgICAgLz5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICB2LWVsc2UtaWY9XCJwcmltYXJ5KHRpbGUpLmlkID09PSAnY29ubmVjdCdcIlxuICAgICAgICAgIG5hbWU9XCJjaGV2cm9uUmlnaHRcIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICAgIDx2LWljb25cbiAgICAgICAgICB2LWVsc2UtaWY9XCJwcmltYXJ5KHRpbGUpLmlkID09PSAncGFpci1ibHVldG9vdGgnIHx8IHByaW1hcnkodGlsZSkuaWNvbiA9PT0gJyRibHVldG9vdGgnXCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICA+XG4gICAgICAgICAgJGJsdWV0b290aFxuICAgICAgICA8L3YtaWNvbj5cbiAgICAgICAge3sgcHJpbWFyeSh0aWxlKS5sYWJlbCB9fVxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB0eXBlIHsgQ2FyZEFjdGlvbiB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kaXJlY3RvcnknXG5pbXBvcnQgdHlwZSB7IFByaW50ZXJUaWxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVycy1wYWdlL21vZGVsJ1xuaW1wb3J0IFRvbmVQaWxsIGZyb20gJy4vVG9uZVBpbGwudnVlJ1xuXG4vKipcbiAqIFByaW50ZXJzIGZvdW5kIG9uIHRoaXMgbmV0d29yayB0aGF0IGFyZSBub3QgeW91cnMgeWV0OiBvbmUgcm93IGVhY2gsIHdpdGhcbiAqIHRoZSBvbmUgdGhpbmcgdG8gZG8gd2l0aCBpdCBvbiB0aGUgcm93IChPcGVuLCBTZXQgaXQgdXAsIFdoYXQgaXMgdGhpcz8pLFxuICogYW5kIHRoZSByZXN0IGJlc2lkZSBpdC4gVGhlIHBhZ2UgaGlkZXMgdGhlIHdob2xlIGxpc3Qgd2hlbiBub3RoaW5nIGlzIGZvdW5kLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUb25lUGlsbCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb3VuZExpc3QgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEFycmF5LCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSB0aWxlcyE6IFByaW50ZXJUaWxlW11cblxuICAvKiogVGhlIGFjdGlvbnMgYSBwcmludGVyIG9mZmVycywgYnkgdGlsZS4gKi9cbiAgQFByb3AoeyB0eXBlOiBGdW5jdGlvbiwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgYWN0aW9uc0ZvciE6ICh0aWxlOiBQcmludGVyVGlsZSkgPT4gQ2FyZEFjdGlvbltdXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6IG51bGwgfSlcbiAgcmVhZG9ubHkgYnVzeUtleSE6IHN0cmluZyB8IG51bGxcblxuICAvKiogVGhlIEJsdWV0b290aCBjb25uZWN0IHN0ZXBzIGZvciBhIHRpbGUsIG9yIG51bGwgd2hlbiBpdCBpcyBub3QgY29ubmVjdGluZyB0aGF0IHdheS4gKi9cbiAgQFByb3AoeyB0eXBlOiBGdW5jdGlvbiwgZGVmYXVsdDogKCkgPT4gbnVsbCB9KVxuICByZWFkb25seSBzdGVwc0ZvciE6ICh0aWxlOiBQcmludGVyVGlsZSkgPT4gc3RyaW5nIHwgbnVsbFxuXG4gIGhvc3QgKHRpbGU6IFByaW50ZXJUaWxlKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGlsZS5lbnRyeS5sYW4/Lmhvc3QgPz8gdGlsZS5lbnRyeS5ob3N0ID8/ICcnXG4gIH1cblxuICAvKiogQW4gYWN0aW9uIHdpdGggbm8gaWQgd2hlbiB0aGUgcHJpbnRlciBvZmZlcnMgbm90aGluZyB0byBkby4gKi9cbiAgcHJpbWFyeSAodGlsZTogUHJpbnRlclRpbGUpOiBDYXJkQWN0aW9uIHtcbiAgICBpZiAodGlsZS5lbnRyeS5yb3c/LmFjdGlvbiA9PT0gJ3NldC11cCcgJiYgdGlsZS5lbnRyeS5yb3cuY2hlY2tGaXJzdCkgcmV0dXJuIHsgaWQ6ICdzZXQtdXAnLCBsYWJlbDogJ0Nvbm5lY3Qgb3ZlciBCbHVldG9vdGgnLCBpY29uOiAnJGJsdWV0b290aCcgfVxuICAgIGlmICh0aWxlLnN0YXRlID09PSAnbmV3JykgcmV0dXJuIHsgaWQ6ICdzZXQtdXAnLCBsYWJlbDogJ1NldCBpdCB1cCcsIGljb246ICcnIH1cbiAgICBpZiAodGlsZS5lbnRyeS5yb3c/LmFjdGlvbiA9PT0gJ25lYXJieS1pbmZvJykge1xuICAgICAgLy8gU2V0IHVwIGFscmVhZHk6IHRoaXMgYnJvd3NlciBjYW4gcGFpciB3aXRoIGl0IG92ZXIgQmx1ZXRvb3RoLCBzaWduZWQgaW4gb3Igbm90LlxuICAgICAgcmV0dXJuIHRpbGUuZW50cnkucm93Lm5lYXJieT8uZW5kcG9pbnRJZFxuICAgICAgICA/IHsgaWQ6ICdwYWlyLWJsdWV0b290aCcsIGxhYmVsOiAnUGFpciBvdmVyIEJsdWV0b290aCcsIGljb246ICcnIH1cbiAgICAgICAgOiB7IGlkOiAnbmVhcmJ5LWluZm8nLCBsYWJlbDogJ1doYXQgaXMgdGhpcz8nLCBpY29uOiAnJyB9XG4gICAgfVxuICAgIGNvbnN0IG9wZW4gPSB0aGlzLmFjdGlvbnNGb3IodGlsZSkuZmluZChhID0+IGEuaWQgPT09ICdjb25uZWN0JylcbiAgICByZXR1cm4gb3BlbiA/IHsgLi4ub3BlbiwgbGFiZWw6ICdPcGVuJyB9IDogeyBpZDogJycsIGxhYmVsOiAnJywgaWNvbjogJycgfVxuICB9XG5cbiAgLyoqIFRoZSBzdGVwcyBvZiBhIEJsdWV0b290aCBjb25uZWN0IGluIGZsaWdodCBvbiB0aGlzIHJvdywgdGhlIGN1cnJlbnQgb25lIG1hcmtlZDsgbnVsbCB3aGVuIG5vbmUgaXMuICovXG4gIHN0ZXBzICh0aWxlOiBQcmludGVyVGlsZSk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmJ1c3lLZXkgPT09IHRpbGUua2V5ID8gdGhpcy5zdGVwc0Zvcih0aWxlKSA6IG51bGxcbiAgfVxuXG4gIHNlY29uZGFyeSAodGlsZTogUHJpbnRlclRpbGUpOiBDYXJkQWN0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLmFjdGlvbnNGb3IodGlsZSkuZmlsdGVyKGEgPT4gYS5pZCAhPT0gJ2Nvbm5lY3QnKVxuICB9XG5cbiAgYWJvdXQgKHRpbGU6IFByaW50ZXJUaWxlKTogc3RyaW5nIHtcbiAgICBpZiAodGlsZS5zdGF0ZSA9PT0gJ25ldycpIHJldHVybiAnTm90IHNldCB1cCB5ZXQuIFNldHVwIHRha2VzIGEgZmV3IG1pbnV0ZXM6IFdpLUZpLCBhIG5hbWUgYW5kIGEgdGVzdCBwcmludC4nXG4gICAgaWYgKHRpbGUuZW50cnkubGlua2VkVG8gPT09ICdvdGhlcicpIHJldHVybiAnTGlua2VkIHRvIGFub3RoZXIgYWNjb3VudC4gVXNlIGl0IG9uIHRoaXMgbmV0d29yaywgb3IgYXNrIGl0cyBvd25lciB0byBzaGFyZSBpdC4nXG4gICAgaWYgKHRpbGUuc3RhdGUgPT09ICdsb2NrZWQnKSByZXR1cm4gJ0l0IHdhbnRzIHRvIGtub3cgd2hvIHlvdSBhcmUgYmVmb3JlIGl0IGxldHMgdGhpcyBicm93c2VyIGluLidcbiAgICByZXR1cm4gdGlsZS5lbnRyeS5kZXRhaWxcbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9wcmludGVycy9Gb3VuZExpc3QudnVlIn0=