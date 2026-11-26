/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import { Component, Vue, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
let PendingChangesDialog = class extends Vue {
  open;
  get saveConfigPendingItems() {
    const saveConfigPendingItems = this.$store.getters["printer/getSaveConfigPendingItems"];
    const { changed, deleted } = Object.entries(saveConfigPendingItems).reduce((previous, [sectionName, sectionEntries]) => {
      if (sectionEntries === null) {
        previous.deleted.push(`# [${sectionName}]`);
      } else {
        const sectionEntryNameValues = Object.entries(sectionEntries).map(([entryName, entryValue]) => `${entryName}: ${entryValue}`);
        previous.changed.push(`[${sectionName}]
${sectionEntryNameValues.join("\n")}`);
      }
      return previous;
    }, { changed: [], deleted: [] });
    const lines = [...changed];
    if (deleted.length > 0) {
      lines.push(`# ${this.$t("app.general.msg.pending_configuration_sections_deleted")}
${deleted.join("\n")}`);
    }
    return lines.join("\n\n");
  }
  handleSubmit() {
    this.open = false;
    this.$emit("save");
  }
};
__decorateClass([
  VModel({ type: Boolean })
], PendingChangesDialog.prototype, "open", 2);
PendingChangesDialog = __decorateClass([
  Component({ components: { M3Dialog } })
], PendingChangesDialog);
const _sfc_main = PendingChangesDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "title": "Save the changes and restart Klipper?", "max-width": "560", "data-tid": "pending-changes" }, on: { "close": function($event) {
    _vm.open = false;
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "data-tid": "pending-changes-cancel" }, on: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "pending-changes-save" }, on: { "click": _vm.handleSubmit } }, [_vm._v(" Save and restart ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "m3-dlg__text" }, [_vm._v(" Klipper writes these to printer.cfg, then restarts to use them, which takes a few seconds. ")]), _vm.saveConfigPendingItems ? _c("pre", { staticClass: "m3-dlg__panel pending__list" }, [_vm._v(_vm._s(_vm.saveConfigPendingItems))]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/PendingChangesDialog.vue?vue&type=style&index=0&scoped=79615e74&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "79615e74",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/PendingChangesDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFzQ0E7QUFDQTtBQUlBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUVBLHdFQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQSxzRUFDQTtBQUVBO0FBQUE7QUFBQSxNQUNBO0FBRUE7QUFBQSxJQUNBO0FBRUE7QUFFQTtBQUNBO0FBQUE7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFoQ0E7QUFBQSxFQURBO0FBQUEsR0FEQSxxQkFFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlBlbmRpbmdDaGFuZ2VzRGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtMy1kaWFsb2dcbiAgICA6dmFsdWU9XCJvcGVuXCJcbiAgICB0aXRsZT1cIlNhdmUgdGhlIGNoYW5nZXMgYW5kIHJlc3RhcnQgS2xpcHBlcj9cIlxuICAgIG1heC13aWR0aD1cIjU2MFwiXG4gICAgZGF0YS10aWQ9XCJwZW5kaW5nLWNoYW5nZXNcIlxuICAgIEBjbG9zZT1cIm9wZW4gPSBmYWxzZVwiXG4gID5cbiAgICA8cCBjbGFzcz1cIm0zLWRsZ19fdGV4dFwiPlxuICAgICAgS2xpcHBlciB3cml0ZXMgdGhlc2UgdG8gcHJpbnRlci5jZmcsIHRoZW4gcmVzdGFydHMgdG8gdXNlIHRoZW0sIHdoaWNoIHRha2VzIGEgZmV3IHNlY29uZHMuXG4gICAgPC9wPlxuICAgIDxwcmVcbiAgICAgIHYtaWY9XCJzYXZlQ29uZmlnUGVuZGluZ0l0ZW1zXCJcbiAgICAgIGNsYXNzPVwibTMtZGxnX19wYW5lbCBwZW5kaW5nX19saXN0XCJcbiAgICA+e3sgc2F2ZUNvbmZpZ1BlbmRpbmdJdGVtcyB9fTwvcHJlPlxuXG4gICAgPHRlbXBsYXRlICNhY3Rpb25zPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0XCJcbiAgICAgICAgZGF0YS10aWQ9XCJwZW5kaW5nLWNoYW5nZXMtY2FuY2VsXCJcbiAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgID5cbiAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5jYW5jZWwnKSB9fVxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgIGRhdGEtdGlkPVwicGVuZGluZy1jaGFuZ2VzLXNhdmVcIlxuICAgICAgICBAY2xpY2s9XCJoYW5kbGVTdWJtaXRcIlxuICAgICAgPlxuICAgICAgICBTYXZlIGFuZCByZXN0YXJ0XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L20zLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSwgVk1vZGVsIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNM0RpYWxvZyBmcm9tICdAL2NvbXBvbmVudHMvdWkvTTNEaWFsb2cudnVlJ1xuXG4vKiogV2hhdCBhIFNhdmUgYW5kIHJlc3RhcnQgd3JpdGVzIHRvIHByaW50ZXIuY2ZnLCBiZWZvcmUgaXQgZG9lcy4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE0zRGlhbG9nIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBlbmRpbmdDaGFuZ2VzRGlhbG9nIGV4dGVuZHMgVnVlIHtcbiAgQFZNb2RlbCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICBvcGVuPzogYm9vbGVhblxuXG4gIGdldCBzYXZlQ29uZmlnUGVuZGluZ0l0ZW1zICgpIHtcbiAgICBjb25zdCBzYXZlQ29uZmlnUGVuZGluZ0l0ZW1zID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRTYXZlQ29uZmlnUGVuZGluZ0l0ZW1zJ10gYXMgUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj5cblxuICAgIGNvbnN0IHsgY2hhbmdlZCwgZGVsZXRlZCB9ID0gT2JqZWN0LmVudHJpZXMoc2F2ZUNvbmZpZ1BlbmRpbmdJdGVtcylcbiAgICAgIC5yZWR1Y2UoKHByZXZpb3VzLCBbc2VjdGlvbk5hbWUsIHNlY3Rpb25FbnRyaWVzXSkgPT4ge1xuICAgICAgICBpZiAoc2VjdGlvbkVudHJpZXMgPT09IG51bGwpIHtcbiAgICAgICAgICBwcmV2aW91cy5kZWxldGVkLnB1c2goYCMgWyR7c2VjdGlvbk5hbWV9XWApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3Qgc2VjdGlvbkVudHJ5TmFtZVZhbHVlcyA9IE9iamVjdC5lbnRyaWVzKHNlY3Rpb25FbnRyaWVzKVxuICAgICAgICAgICAgLm1hcCgoW2VudHJ5TmFtZSwgZW50cnlWYWx1ZV0pID0+IGAke2VudHJ5TmFtZX06ICR7ZW50cnlWYWx1ZX1gKVxuXG4gICAgICAgICAgcHJldmlvdXMuY2hhbmdlZC5wdXNoKGBbJHtzZWN0aW9uTmFtZX1dXFxuJHtzZWN0aW9uRW50cnlOYW1lVmFsdWVzLmpvaW4oJ1xcbicpfWApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJldmlvdXNcbiAgICAgIH0sIHsgY2hhbmdlZDogW10sIGRlbGV0ZWQ6IFtdIH0gYXMgeyBjaGFuZ2VkOiBzdHJpbmdbXSwgZGVsZXRlZDogc3RyaW5nW10gfSlcblxuICAgIGNvbnN0IGxpbmVzID0gWy4uLmNoYW5nZWRdXG5cbiAgICBpZiAoZGVsZXRlZC5sZW5ndGggPiAwKSB7XG4gICAgICBsaW5lcy5wdXNoKGAjICR7dGhpcy4kdCgnYXBwLmdlbmVyYWwubXNnLnBlbmRpbmdfY29uZmlndXJhdGlvbl9zZWN0aW9uc19kZWxldGVkJyl9XFxuJHtkZWxldGVkLmpvaW4oJ1xcbicpfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcblxcbicpXG4gIH1cblxuICBoYW5kbGVTdWJtaXQgKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgdGhpcy4kZW1pdCgnc2F2ZScpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5wZW5kaW5nX19saXN0IHtcbiAgICBtYXgtaGVpZ2h0OiA1MHZoO1xuICAgIG1hcmdpbjogMDtcbiAgICBvdmVyZmxvdzogYXV0bztcbiAgICBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtbW9ubyk7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGxpbmUtaGVpZ2h0OiAxLjU7XG4gICAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvc2V0dGluZ3MvUGVuZGluZ0NoYW5nZXNEaWFsb2cudnVlIn0=