/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import SegPicker, {} from "/src/components/control/SegPicker.vue";
import { consoleView } from "/src/services/console/view.ts";
import { entryKind } from "/src/services/console/model.ts";
let ConsoleActions = class extends Vue {
  view = consoleView;
  get errorCount() {
    const entries = this.$store.getters["console/getConsoleEntries"] ?? [];
    return entries.filter((e) => entryKind(e) === "error").length;
  }
  get options() {
    return [
      { value: "all", label: "All" },
      { value: "commands", label: "Commands" },
      { value: "warnings", label: "Warnings" },
      { value: "errors", label: this.errorCount ? `Errors \xB7 ${this.errorCount}` : "Errors" }
    ];
  }
  clear() {
    this.$store.dispatch("console/onClear");
  }
};
ConsoleActions = __decorateClass([
  Component({ components: { SegPicker } })
], ConsoleActions);
const _sfc_main = ConsoleActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "console-actions", attrs: { "data-tid": "console-actions" } }, [_c("seg-picker", { attrs: { "options": _vm.options, "value": _vm.view.filter, "label": "Show" }, on: { "input": function($event) {
    _vm.view.filter = $event;
  } } }), _c("button", { staticClass: "cbtn console-actions__clear", attrs: { "type": "button", "data-tid": "console-clear", "aria-label": "Clear the log", "title": "Clear the log" }, on: { "click": _vm.clear } }, [_c(__unplugin_components_0, { attrs: { "name": "trash" } })], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/console/ConsoleActions.vue?vue&type=style&index=0&scoped=c8497991&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "c8497991",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/console/ConsoleActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF5QkE7QUFDQTtBQUNBO0FBQ0E7QUFLQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFwQkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29uc29sZUFjdGlvbnMudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwiY29uc29sZS1hY3Rpb25zXCJcbiAgICBkYXRhLXRpZD1cImNvbnNvbGUtYWN0aW9uc1wiXG4gID5cbiAgICA8c2VnLXBpY2tlclxuICAgICAgOm9wdGlvbnM9XCJvcHRpb25zXCJcbiAgICAgIDp2YWx1ZT1cInZpZXcuZmlsdGVyXCJcbiAgICAgIGxhYmVsPVwiU2hvd1wiXG4gICAgICBAaW5wdXQ9XCJ2aWV3LmZpbHRlciA9ICRldmVudFwiXG4gICAgLz5cbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwiY2J0biBjb25zb2xlLWFjdGlvbnNfX2NsZWFyXCJcbiAgICAgIGRhdGEtdGlkPVwiY29uc29sZS1jbGVhclwiXG4gICAgICBhcmlhLWxhYmVsPVwiQ2xlYXIgdGhlIGxvZ1wiXG4gICAgICB0aXRsZT1cIkNsZWFyIHRoZSBsb2dcIlxuICAgICAgQGNsaWNrPVwiY2xlYXJcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJ0cmFzaFwiIC8+XG4gICAgPC9idXR0b24+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgVnVlIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTZWdQaWNrZXIsIHsgdHlwZSBTZWdPcHRpb24gfSBmcm9tICdAL2NvbXBvbmVudHMvY29udHJvbC9TZWdQaWNrZXIudnVlJ1xuaW1wb3J0IHsgY29uc29sZVZpZXcgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnNvbGUvdmlldydcbmltcG9ydCB7IGVudHJ5S2luZCB9IGZyb20gJ0Avc2VydmljZXMvY29uc29sZS9tb2RlbCdcbmltcG9ydCB0eXBlIHsgQ29uc29sZUVudHJ5IH0gZnJvbSAnQC9zdG9yZS9jb25zb2xlL3R5cGVzJ1xuXG4vKiogVGhlIENvbnNvbGUncyBwYWdlLWhlYWRlciBhY3Rpb25zOiB3aGF0IHRvIHNob3cgKEFsbCwgQ29tbWFuZHMsIFdhcm5pbmdzLCBFcnJvcnMpIGFuZCBDbGVhci4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IFNlZ1BpY2tlciB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25zb2xlQWN0aW9ucyBleHRlbmRzIFZ1ZSB7XG4gIHZpZXcgPSBjb25zb2xlVmlld1xuXG4gIGdldCBlcnJvckNvdW50ICgpOiBudW1iZXIge1xuICAgIGNvbnN0IGVudHJpZXMgPSAodGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uc29sZS9nZXRDb25zb2xlRW50cmllcyddIGFzIENvbnNvbGVFbnRyeVtdKSA/PyBbXVxuICAgIHJldHVybiBlbnRyaWVzLmZpbHRlcihlID0+IGVudHJ5S2luZChlKSA9PT0gJ2Vycm9yJykubGVuZ3RoXG4gIH1cblxuICBnZXQgb3B0aW9ucyAoKTogU2VnT3B0aW9uW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7IHZhbHVlOiAnYWxsJywgbGFiZWw6ICdBbGwnIH0sXG4gICAgICB7IHZhbHVlOiAnY29tbWFuZHMnLCBsYWJlbDogJ0NvbW1hbmRzJyB9LFxuICAgICAgeyB2YWx1ZTogJ3dhcm5pbmdzJywgbGFiZWw6ICdXYXJuaW5ncycgfSxcbiAgICAgIHsgdmFsdWU6ICdlcnJvcnMnLCBsYWJlbDogdGhpcy5lcnJvckNvdW50ID8gYEVycm9ycyDCtyAke3RoaXMuZXJyb3JDb3VudH1gIDogJ0Vycm9ycycgfVxuICAgIF1cbiAgfVxuXG4gIGNsZWFyICgpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uc29sZS9vbkNsZWFyJylcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmNvbnNvbGUtYWN0aW9ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogOHB4O1xuICAgIG1heC13aWR0aDogMTAwJTtcbiAgfVxuXG4gIC5jb25zb2xlLWFjdGlvbnNfX2NsZWFyIHtcbiAgICB3aWR0aDogNDBweDtcbiAgICBoZWlnaHQ6IDQwcHg7XG4gICAgcGFkZGluZzogMDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2NvbnNvbGUvQ29uc29sZUFjdGlvbnMudnVlIn0=