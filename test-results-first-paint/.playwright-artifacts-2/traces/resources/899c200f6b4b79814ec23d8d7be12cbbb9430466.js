/* unplugin-vue-components disabled */import { VListItemTitle as __unplugin_components_21 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_20 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_19 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_18 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSubheader as __unplugin_components_17 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDivider as __unplugin_components_16 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_15 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_14 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItemTitle as __unplugin_components_13 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VListItem as __unplugin_components_12 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VList as __unplugin_components_11 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_10 from "/src/components/ui/FrameIcon.vue";
import { VMenu as __unplugin_components_9 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_8 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_7 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_6 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
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
import FrameMixin from "/src/mixins/frame.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import ControlMixin from "/src/mixins/control.ts";
import { MORE_SORTS } from "/src/services/jobs/list.ts";
import { queueLabel } from "/src/services/jobs/model.ts";
import { jobsPage, setJobsSort } from "/src/services/jobs/page-state.ts";
let JobsActions = class extends Mixins(FrameMixin, BrowserMixin, ControlMixin) {
  page = jobsPage;
  get queueText() {
    return queueLabel(jobsPage.queueable);
  }
  get moreSorts() {
    return MORE_SORTS;
  }
  setSort(sort) {
    setJobsSort(sort, false);
  }
  turnRound() {
    setJobsSort(jobsPage.sort, !jobsPage.reverse);
  }
  /** Pages of the Jobs section other than Jobs itself. */
  get links() {
    return this.currentSection ? this.pagesOf(this.currentSection).filter((p) => p.path !== "/jobs") : [];
  }
  toggleSearch() {
    jobsPage.searchOpen = !jobsPage.searchOpen;
    if (jobsPage.searchOpen) this.$nextTick(() => this.$refs.find?.focus());
  }
  mounted() {
    window.addEventListener("keydown", this.onWindowKey);
  }
  beforeDestroy() {
    window.removeEventListener("keydown", this.onWindowKey);
  }
  /** "/" anywhere on the page goes to the search, unless something else is being typed in. */
  onWindowKey(event) {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
    if (document.querySelector(".v-dialog--active")) return;
    event.preventDefault();
    jobsPage.searchOpen = true;
    this.$nextTick(() => this.$refs.find?.focus());
  }
};
JobsActions = __decorateClass([
  Component({})
], JobsActions);
const _sfc_main = JobsActions;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "jobs-actions", class: { "jobs-actions--phone": _vm.isMobileViewport }, attrs: { "data-tid": "jobs-actions" } }, [!_vm.isMobileViewport ? _c("label", { staticClass: "jobs-actions__find" }, [_c(__unplugin_components_0, { attrs: { "name": "search", "small": "" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.page.query, expression: "page.query" }], ref: "find", attrs: { "type": "search", "placeholder": "Search files", "aria-label": "Search files", "data-tid": "jobs-filter" }, domProps: { "value": _vm.page.query }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    _vm.page.query = "";
  }, "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.page, "query", $event.target.value);
  } } })], 1) : _vm._e(), _vm.isMobileViewport ? _c("button", { staticClass: "jobs-actions__round", class: { "jobs-actions__round--on": _vm.page.searchOpen || !!_vm.page.query }, attrs: { "type": "button", "aria-label": "Search files", "data-tid": "jobs-search-toggle" }, on: { "click": _vm.toggleSearch } }, [_c(__unplugin_components_1, { attrs: { "name": "search" } })], 1) : _vm._e(), _vm.isMobileViewport && (_vm.page.searchOpen || _vm.page.query) ? _c("label", { staticClass: "jobs-actions__find jobs-actions__find--row" }, [_c(__unplugin_components_2, { attrs: { "name": "search", "small": "" } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.page.query, expression: "page.query" }], ref: "find", attrs: { "type": "search", "placeholder": "Search files", "aria-label": "Search files", "data-tid": "jobs-filter" }, domProps: { "value": _vm.page.query }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    _vm.page.query = "";
  }, "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.page, "query", $event.target.value);
  } } })], 1) : _vm._e(), _c("div", { staticClass: "jobs-actions__tools", attrs: { "role": "toolbar", "aria-label": "Files", "data-tid": "jobs-toolbar" } }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "jobs-toolbar-new-folder" }, on: { "click": function($event) {
    _vm.page.folderTick++;
  } } }, [_c(__unplugin_components_3, { attrs: { "name": "plus", "small": "" } }), _vm._v(" New folder ")], 1), _vm.page.selected ? [_c("button", { staticClass: "cbtn cbtn--ghost jobs-actions__count", attrs: { "type": "button", "aria-label": `Clear the selection of ${_vm.page.selected}`, "data-tid": "jobs-sel-count" }, on: { "click": function($event) {
    _vm.page.clearTick++;
  } } }, [_c(__unplugin_components_4, { attrs: { "name": "x", "small": "" } }), _vm._v(" " + _vm._s(_vm.page.selected) + " selected ")], 1), _vm.page.queueable ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "jobs-sel-queue" }, on: { "click": function($event) {
    _vm.page.queueTick++;
  } } }, [_vm._v(" " + _vm._s(_vm.queueText) + " ")]) : _vm._e(), _vm.page.changeable ? _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "jobs-sel-move" }, on: { "click": function($event) {
    _vm.page.moveTick++;
  } } }, [_c(__unplugin_components_5, { attrs: { "name": "files", "small": "" } }), _vm._v(" Move to ")], 1) : _vm._e(), _vm.page.downloadable ? _c("button", { staticClass: "jobs-actions__round", attrs: { "type": "button", "aria-label": _vm.page.downloadable === 1 ? "Download" : `Download ${_vm.page.downloadable} files`, "title": "Download", "data-tid": "jobs-sel-download" }, on: { "click": function($event) {
    _vm.page.downloadTick++;
  } } }, [_c(__unplugin_components_6, { attrs: { "name": "download" } })], 1) : _vm._e(), _vm.page.changeable ? _c("button", { staticClass: "jobs-actions__round jobs-actions__round--danger", attrs: { "type": "button", "disabled": !_vm.controlReady, "aria-label": _vm.page.changeable === 1 ? "Delete" : `Delete ${_vm.page.changeable} items`, "title": "Delete", "data-tid": "jobs-sel-delete" }, on: { "click": function($event) {
    _vm.page.deleteTick++;
  } } }, [_c(__unplugin_components_7, { attrs: { "name": "trash" } })], 1) : _vm._e(), _vm.page.heldNote ? _c("span", { staticClass: "jobs-actions__note", attrs: { "data-tid": "jobs-sel-held" } }, [_vm._v(_vm._s(_vm.page.heldNote))]) : _vm._e()] : _vm._e()], 2), _c("button", { staticClass: "cbtn cbtn--primary jobs-actions__upload", attrs: { "type": "button", "disabled": !_vm.controlReady, "data-tid": "jobs-upload" }, on: { "click": function($event) {
    _vm.page.uploadTick++;
  } } }, [_c(__unplugin_components_8, { attrs: { "name": "upload", "small": "" } }), _vm._v(" Upload ")], 1), _c(__unplugin_components_9, { attrs: { "offset-y": "", "left": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c("button", _vm._g(_vm._b({ staticClass: "jobs-actions__round", attrs: { "type": "button", "aria-label": "More about jobs", "data-tid": "jobs-more" } }, "button", attrs, false), on), [_c(__unplugin_components_10, { attrs: { "name": "more" } })], 1)];
  } }]) }, [_c(__unplugin_components_11, { attrs: { "dense": "" } }, [_vm._l(_vm.links, function(item) {
    return _c(__unplugin_components_12, { key: item.path, attrs: { "to": _vm.pageTo(item), "data-tid": `jobs-more-${item.label.toLowerCase()}` } }, [_c(__unplugin_components_13, [_vm._v(_vm._s(item.label))])], 1);
  }), _c(__unplugin_components_14, { attrs: { "disabled": !_vm.controlReady, "data-tid": "jobs-new-folder" }, on: { "click": function($event) {
    _vm.page.folderTick++;
  } } }, [_c(__unplugin_components_15, [_vm._v("New folder")])], 1), _c(__unplugin_components_16), _c(__unplugin_components_17, [_vm._v("Order by")]), _vm._l(_vm.moreSorts, function(item) {
    return _c(__unplugin_components_18, { key: item.value, attrs: { "input-value": _vm.page.sort === item.value, "data-tid": `jobs-sort-${item.value}` }, on: { "click": function($event) {
      return _vm.setSort(item.value);
    } } }, [_c(__unplugin_components_19, [_vm._v(_vm._s(item.label))])], 1);
  }), _c(__unplugin_components_20, { attrs: { "input-value": _vm.page.reverse, "data-tid": "jobs-reverse" }, on: { "click": _vm.turnRound } }, [_c(__unplugin_components_21, [_vm._v(_vm._s(_vm.page.reverse ? "Reversed" : "Reverse order"))])], 1)], 2)], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/jobs/JobsActions.vue?vue&type=style&index=0&scoped=ae06ea8b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "ae06ea8b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/jobs/JobsActions.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFZQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQS9DQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJKb2JzQWN0aW9ucy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8ZGl2XG4gICAgY2xhc3M9XCJqb2JzLWFjdGlvbnNcIlxuICAgIDpjbGFzcz1cInsgJ2pvYnMtYWN0aW9ucy0tcGhvbmUnOiBpc01vYmlsZVZpZXdwb3J0IH1cIlxuICAgIGRhdGEtdGlkPVwiam9icy1hY3Rpb25zXCJcbiAgPlxuICAgIDxsYWJlbFxuICAgICAgdi1pZj1cIiFpc01vYmlsZVZpZXdwb3J0XCJcbiAgICAgIGNsYXNzPVwiam9icy1hY3Rpb25zX19maW5kXCJcbiAgICA+XG4gICAgICA8ZnJhbWUtaWNvblxuICAgICAgICBuYW1lPVwic2VhcmNoXCJcbiAgICAgICAgc21hbGxcbiAgICAgIC8+XG4gICAgICA8aW5wdXRcbiAgICAgICAgcmVmPVwiZmluZFwiXG4gICAgICAgIHYtbW9kZWw9XCJwYWdlLnF1ZXJ5XCJcbiAgICAgICAgdHlwZT1cInNlYXJjaFwiXG4gICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGZpbGVzXCJcbiAgICAgICAgYXJpYS1sYWJlbD1cIlNlYXJjaCBmaWxlc1wiXG4gICAgICAgIGRhdGEtdGlkPVwiam9icy1maWx0ZXJcIlxuICAgICAgICBAa2V5ZG93bi5lc2M9XCJwYWdlLnF1ZXJ5ID0gJydcIlxuICAgICAgPlxuICAgIDwvbGFiZWw+XG4gICAgPGJ1dHRvblxuICAgICAgdi1pZj1cImlzTW9iaWxlVmlld3BvcnRcIlxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBjbGFzcz1cImpvYnMtYWN0aW9uc19fcm91bmRcIlxuICAgICAgOmNsYXNzPVwieyAnam9icy1hY3Rpb25zX19yb3VuZC0tb24nOiBwYWdlLnNlYXJjaE9wZW4gfHwgISFwYWdlLnF1ZXJ5IH1cIlxuICAgICAgYXJpYS1sYWJlbD1cIlNlYXJjaCBmaWxlc1wiXG4gICAgICBkYXRhLXRpZD1cImpvYnMtc2VhcmNoLXRvZ2dsZVwiXG4gICAgICBAY2xpY2s9XCJ0b2dnbGVTZWFyY2hcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJzZWFyY2hcIiAvPlxuICAgIDwvYnV0dG9uPlxuICAgIDxsYWJlbFxuICAgICAgdi1pZj1cImlzTW9iaWxlVmlld3BvcnQgJiYgKHBhZ2Uuc2VhcmNoT3BlbiB8fCBwYWdlLnF1ZXJ5KVwiXG4gICAgICBjbGFzcz1cImpvYnMtYWN0aW9uc19fZmluZCBqb2JzLWFjdGlvbnNfX2ZpbmQtLXJvd1wiXG4gICAgPlxuICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgbmFtZT1cInNlYXJjaFwiXG4gICAgICAgIHNtYWxsXG4gICAgICAvPlxuICAgICAgPGlucHV0XG4gICAgICAgIHJlZj1cImZpbmRcIlxuICAgICAgICB2LW1vZGVsPVwicGFnZS5xdWVyeVwiXG4gICAgICAgIHR5cGU9XCJzZWFyY2hcIlxuICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBmaWxlc1wiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJTZWFyY2ggZmlsZXNcIlxuICAgICAgICBkYXRhLXRpZD1cImpvYnMtZmlsdGVyXCJcbiAgICAgICAgQGtleWRvd24uZXNjPVwicGFnZS5xdWVyeSA9ICcnXCJcbiAgICAgID5cbiAgICA8L2xhYmVsPlxuICAgIDxkaXZcbiAgICAgIGNsYXNzPVwiam9icy1hY3Rpb25zX190b29sc1wiXG4gICAgICByb2xlPVwidG9vbGJhclwiXG4gICAgICBhcmlhLWxhYmVsPVwiRmlsZXNcIlxuICAgICAgZGF0YS10aWQ9XCJqb2JzLXRvb2xiYXJcIlxuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0blwiXG4gICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICBkYXRhLXRpZD1cImpvYnMtdG9vbGJhci1uZXctZm9sZGVyXCJcbiAgICAgICAgQGNsaWNrPVwicGFnZS5mb2xkZXJUaWNrKytcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJwbHVzXCJcbiAgICAgICAgICBzbWFsbFxuICAgICAgICAvPlxuICAgICAgICBOZXcgZm9sZGVyXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwicGFnZS5zZWxlY3RlZFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLWdob3N0IGpvYnMtYWN0aW9uc19fY291bnRcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwiYENsZWFyIHRoZSBzZWxlY3Rpb24gb2YgJHtwYWdlLnNlbGVjdGVkfWBcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1zZWwtY291bnRcIlxuICAgICAgICAgIEBjbGljaz1cInBhZ2UuY2xlYXJUaWNrKytcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICAgIG5hbWU9XCJ4XCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICB7eyBwYWdlLnNlbGVjdGVkIH19IHNlbGVjdGVkXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1pZj1cInBhZ2UucXVldWVhYmxlXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1zZWwtcXVldWVcIlxuICAgICAgICAgIEBjbGljaz1cInBhZ2UucXVldWVUaWNrKytcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgcXVldWVUZXh0IH19XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1pZj1cInBhZ2UuY2hhbmdlYWJsZVwiXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtc2VsLW1vdmVcIlxuICAgICAgICAgIEBjbGljaz1cInBhZ2UubW92ZVRpY2srK1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cImZpbGVzXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgICBNb3ZlIHRvXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1pZj1cInBhZ2UuZG93bmxvYWRhYmxlXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnMtYWN0aW9uc19fcm91bmRcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwicGFnZS5kb3dubG9hZGFibGUgPT09IDEgPyAnRG93bmxvYWQnIDogYERvd25sb2FkICR7cGFnZS5kb3dubG9hZGFibGV9IGZpbGVzYFwiXG4gICAgICAgICAgdGl0bGU9XCJEb3dubG9hZFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLXNlbC1kb3dubG9hZFwiXG4gICAgICAgICAgQGNsaWNrPVwicGFnZS5kb3dubG9hZFRpY2srK1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwiZG93bmxvYWRcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtaWY9XCJwYWdlLmNoYW5nZWFibGVcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiam9icy1hY3Rpb25zX19yb3VuZCBqb2JzLWFjdGlvbnNfX3JvdW5kLS1kYW5nZXJcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIDphcmlhLWxhYmVsPVwicGFnZS5jaGFuZ2VhYmxlID09PSAxID8gJ0RlbGV0ZScgOiBgRGVsZXRlICR7cGFnZS5jaGFuZ2VhYmxlfSBpdGVtc2BcIlxuICAgICAgICAgIHRpdGxlPVwiRGVsZXRlXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtc2VsLWRlbGV0ZVwiXG4gICAgICAgICAgQGNsaWNrPVwicGFnZS5kZWxldGVUaWNrKytcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInRyYXNoXCIgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cInBhZ2UuaGVsZE5vdGVcIlxuICAgICAgICAgIGNsYXNzPVwiam9icy1hY3Rpb25zX19ub3RlXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImpvYnMtc2VsLWhlbGRcIlxuICAgICAgICA+e3sgcGFnZS5oZWxkTm90ZSB9fTwvc3Bhbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gICAgPGJ1dHRvblxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeSBqb2JzLWFjdGlvbnNfX3VwbG9hZFwiXG4gICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5XCJcbiAgICAgIGRhdGEtdGlkPVwiam9icy11cGxvYWRcIlxuICAgICAgQGNsaWNrPVwicGFnZS51cGxvYWRUaWNrKytcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgIG5hbWU9XCJ1cGxvYWRcIlxuICAgICAgICBzbWFsbFxuICAgICAgLz5cbiAgICAgIFVwbG9hZFxuICAgIDwvYnV0dG9uPlxuICAgIDx2LW1lbnVcbiAgICAgIG9mZnNldC15XG4gICAgICBsZWZ0XG4gICAgPlxuICAgICAgPHRlbXBsYXRlICNhY3RpdmF0b3I9XCJ7IG9uLCBhdHRycyB9XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImpvYnMtYWN0aW9uc19fcm91bmRcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJNb3JlIGFib3V0IGpvYnNcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1tb3JlXCJcbiAgICAgICAgICB2LWJpbmQ9XCJhdHRyc1wiXG4gICAgICAgICAgdi1vbj1cIm9uXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJtb3JlXCIgLz5cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHYtbGlzdCBkZW5zZT5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgdi1mb3I9XCJpdGVtIGluIGxpbmtzXCJcbiAgICAgICAgICA6a2V5PVwiaXRlbS5wYXRoXCJcbiAgICAgICAgICA6dG89XCJwYWdlVG8oaXRlbSlcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBqb2JzLW1vcmUtJHtpdGVtLmxhYmVsLnRvTG93ZXJDYXNlKCl9YFwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+e3sgaXRlbS5sYWJlbCB9fTwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgIDpkaXNhYmxlZD1cIiFjb250cm9sUmVhZHlcIlxuICAgICAgICAgIGRhdGEtdGlkPVwiam9icy1uZXctZm9sZGVyXCJcbiAgICAgICAgICBAY2xpY2s9XCJwYWdlLmZvbGRlclRpY2srK1wiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+TmV3IGZvbGRlcjwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDx2LWRpdmlkZXIgLz5cbiAgICAgICAgPHYtc3ViaGVhZGVyPk9yZGVyIGJ5PC92LXN1YmhlYWRlcj5cbiAgICAgICAgPHYtbGlzdC1pdGVtXG4gICAgICAgICAgdi1mb3I9XCJpdGVtIGluIG1vcmVTb3J0c1wiXG4gICAgICAgICAgOmtleT1cIml0ZW0udmFsdWVcIlxuICAgICAgICAgIDppbnB1dC12YWx1ZT1cInBhZ2Uuc29ydCA9PT0gaXRlbS52YWx1ZVwiXG4gICAgICAgICAgOmRhdGEtdGlkPVwiYGpvYnMtc29ydC0ke2l0ZW0udmFsdWV9YFwiXG4gICAgICAgICAgQGNsaWNrPVwic2V0U29ydChpdGVtLnZhbHVlKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+e3sgaXRlbS5sYWJlbCB9fTwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICAgIDx2LWxpc3QtaXRlbVxuICAgICAgICAgIDppbnB1dC12YWx1ZT1cInBhZ2UucmV2ZXJzZVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJqb2JzLXJldmVyc2VcIlxuICAgICAgICAgIEBjbGljaz1cInR1cm5Sb3VuZFwiXG4gICAgICAgID5cbiAgICAgICAgICA8di1saXN0LWl0ZW0tdGl0bGU+e3sgcGFnZS5yZXZlcnNlID8gJ1JldmVyc2VkJyA6ICdSZXZlcnNlIG9yZGVyJyB9fTwvdi1saXN0LWl0ZW0tdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LWl0ZW0+XG4gICAgICA8L3YtbGlzdD5cbiAgICA8L3YtbWVudT5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEZyYW1lTWl4aW4gZnJvbSAnQC9taXhpbnMvZnJhbWUnXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgQ29udHJvbE1peGluIGZyb20gJ0AvbWl4aW5zL2NvbnRyb2wnXG5pbXBvcnQgeyBNT1JFX1NPUlRTLCB0eXBlIEpvYnNTb3J0IH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL2xpc3QnXG5pbXBvcnQgeyBxdWV1ZUxhYmVsIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IHsgam9ic1BhZ2UsIHNldEpvYnNTb3J0IH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL3BhZ2Utc3RhdGUnXG5pbXBvcnQgdHlwZSB7IFNlY3Rpb25QYWdlIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclNlY3Rpb25zJ1xuXG4vKipcbiAqIEpvYnMnIG9uZSB0b29sYmFyLCB0b3AgcmlnaHQsIGFzIEZpbGUgRXhwbG9yZXIgaGFzIGl0OiBzZWFyY2gsIE5ldyBmb2xkZXIsXG4gKiBhbmQsIG9ubHkgd2hpbGUgc29tZXRoaW5nIGlzIHNlbGVjdGVkLCB3aGF0IGNhbiBiZSBkb25lIHRvIHRoZSBzZWxlY3Rpb25cbiAqIChNb3ZlIHRvLCBEb3dubG9hZCwgRGVsZXRlKS4gVGhlbiBVcGxvYWQsIHRoZSBwYWdlJ3Mgb25lIHByaW1hcnkgYnV0dG9uLFxuICogYW5kIGEgwrfCt8K3IG1lbnUgd2l0aCB0aGUgcGFnZXMgSm9icyB1c2VkIHRvIHNob3cgYXMgdGFicyAoSGlzdG9yeSxcbiAqIFRpbWVsYXBzZSkgYW5kIHRoZSBvcmRlcnMgdGhhdCBoYXZlIG5vIGNvbHVtbi4gVGhlIGxpc3QncyBjb2x1bW5cbiAqIGhlYWRlcnMgYXJlIHRoZSBvcmRlci5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEpvYnNBY3Rpb25zIGV4dGVuZHMgTWl4aW5zKEZyYW1lTWl4aW4sIEJyb3dzZXJNaXhpbiwgQ29udHJvbE1peGluKSB7XG4gIHBhZ2UgPSBqb2JzUGFnZVxuXG4gIGdldCBxdWV1ZVRleHQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHF1ZXVlTGFiZWwoam9ic1BhZ2UucXVldWVhYmxlKVxuICB9XG5cbiAgZ2V0IG1vcmVTb3J0cyAoKSB7XG4gICAgcmV0dXJuIE1PUkVfU09SVFNcbiAgfVxuXG4gIHNldFNvcnQgKHNvcnQ6IEpvYnNTb3J0KSB7XG4gICAgc2V0Sm9ic1NvcnQoc29ydCwgZmFsc2UpXG4gIH1cblxuICB0dXJuUm91bmQgKCkge1xuICAgIHNldEpvYnNTb3J0KGpvYnNQYWdlLnNvcnQsICFqb2JzUGFnZS5yZXZlcnNlKVxuICB9XG5cbiAgLyoqIFBhZ2VzIG9mIHRoZSBKb2JzIHNlY3Rpb24gb3RoZXIgdGhhbiBKb2JzIGl0c2VsZi4gKi9cbiAgZ2V0IGxpbmtzICgpOiBTZWN0aW9uUGFnZVtdIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50U2VjdGlvbiA/IHRoaXMucGFnZXNPZih0aGlzLmN1cnJlbnRTZWN0aW9uKS5maWx0ZXIocCA9PiBwLnBhdGggIT09ICcvam9icycpIDogW11cbiAgfVxuXG4gIHRvZ2dsZVNlYXJjaCAoKSB7XG4gICAgam9ic1BhZ2Uuc2VhcmNoT3BlbiA9ICFqb2JzUGFnZS5zZWFyY2hPcGVuXG4gICAgaWYgKGpvYnNQYWdlLnNlYXJjaE9wZW4pIHRoaXMuJG5leHRUaWNrKCgpID0+ICh0aGlzLiRyZWZzLmZpbmQgYXMgSFRNTElucHV0RWxlbWVudCB8IHVuZGVmaW5lZCk/LmZvY3VzKCkpXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25XaW5kb3dLZXkpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25XaW5kb3dLZXkpXG4gIH1cblxuICAvKiogXCIvXCIgYW55d2hlcmUgb24gdGhlIHBhZ2UgZ29lcyB0byB0aGUgc2VhcmNoLCB1bmxlc3Mgc29tZXRoaW5nIGVsc2UgaXMgYmVpbmcgdHlwZWQgaW4uICovXG4gIG9uV2luZG93S2V5IChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldmVudC5rZXkgIT09ICcvJyB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuYWx0S2V5KSByZXR1cm5cbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsXG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0LmlzQ29udGVudEVkaXRhYmxlIHx8IFsnSU5QVVQnLCAnVEVYVEFSRUEnLCAnU0VMRUNUJ10uaW5jbHVkZXModGFyZ2V0LnRhZ05hbWUpKSkgcmV0dXJuXG4gICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy52LWRpYWxvZy0tYWN0aXZlJykpIHJldHVyblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBqb2JzUGFnZS5zZWFyY2hPcGVuID0gdHJ1ZVxuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+ICh0aGlzLiRyZWZzLmZpbmQgYXMgSFRNTElucHV0RWxlbWVudCB8IHVuZGVmaW5lZCk/LmZvY3VzKCkpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5qb2JzLWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMSAxIGF1dG87XG4gICAgZmxleC13cmFwOiBub3dyYXA7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgIGdhcDogMTBweDtcbiAgICBtaW4td2lkdGg6IDA7XG4gIH1cblxuICAuam9icy1hY3Rpb25zLS1waG9uZSB7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgfVxuXG4gIC5qb2JzLWFjdGlvbnNfX2ZpbmQge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZmxleDogMCAxIDIyMHB4O1xuICAgIGdhcDogOHB4O1xuICAgIG1pbi13aWR0aDogMTIwcHg7XG4gICAgaGVpZ2h0OiA0NHB4O1xuICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuXG4gICAgaW5wdXQge1xuICAgICAgZmxleDogMSAxIDA7XG4gICAgICBtaW4td2lkdGg6IDA7XG4gICAgICBib3JkZXI6IDA7XG4gICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgICAgZm9udDogaW5oZXJpdDtcbiAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICB9XG4gIH1cblxuICAuam9icy1hY3Rpb25zX19maW5kLS1yb3cge1xuICAgIG9yZGVyOiA5O1xuICAgIGZsZXg6IDEgMSAxMDAlO1xuICAgIHdpZHRoOiBhdXRvO1xuICB9XG5cbiAgLmpvYnMtYWN0aW9uc19fcm91bmQge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICB3aWR0aDogNDRweDtcbiAgICBoZWlnaHQ6IDQ0cHg7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAuam9icy1hY3Rpb25zX190b29scyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIGZsZXgtd3JhcDogbm93cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMHB4O1xuICB9XG5cbiAgLmpvYnMtYWN0aW9uc19fY291bnQge1xuICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgfVxuXG4gIC5qb2JzLWFjdGlvbnNfX25vdGUge1xuICAgIG1heC13aWR0aDogMjIwcHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAuam9icy1hY3Rpb25zX19yb3VuZC0tZGFuZ2VyIHtcbiAgICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMTYlLCB0cmFuc3BhcmVudCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpO1xuICB9XG5cbiAgLmpvYnMtYWN0aW9uc19fcm91bmQ6ZGlzYWJsZWQge1xuICAgIG9wYWNpdHk6IDAuNDU7XG4gIH1cblxuICAuam9icy1hY3Rpb25zLS1waG9uZSAuam9icy1hY3Rpb25zX190b29scyB7XG4gICAgb3JkZXI6IDg7XG4gICAgZmxleDogMSAxIDEwMCU7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICB9XG5cbiAgLmpvYnMtYWN0aW9uc19fcm91bmQtLW9uIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50LXNvZnQpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL2pvYnMvSm9ic0FjdGlvbnMudnVlIn0=