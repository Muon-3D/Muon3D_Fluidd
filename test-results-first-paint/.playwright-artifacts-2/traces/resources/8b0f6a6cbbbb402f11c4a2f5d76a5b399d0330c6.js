/* unplugin-vue-components disabled */import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins, Prop, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { isGcodeFile } from "/src/services/jobs/model.ts";
import { bytesWords } from "/src/services/usb/words.ts";
let UsbPrinterPicker = class extends Mixins(BrowserMixin) {
  value;
  stickName;
  path = "";
  picked = [];
  everything = false;
  bytes = bytesWords;
  get dir() {
    return this.path ? `gcodes/${this.path}` : "gcodes";
  }
  get crumbs() {
    const parts = this.path ? this.path.split("/") : [];
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join("/") }));
  }
  get loaded() {
    return !!this.$store.getters["files/getDirectory"](this.dir);
  }
  get rows() {
    const entries = this.$store.getters["files/getDirectory"](this.dir) ?? [];
    const at = (name) => this.path ? `${this.path}/${name}` : name;
    const dirs = entries.filter((e) => e.type === "directory" && e.name !== "..").map((d) => ({ rel: at(d.dirname), name: d.dirname, dir: true, size: 0 }));
    const files = entries.filter((e) => e.type === "file" && isGcodeFile(e.filename)).map((f) => ({ rel: at(f.filename), name: f.filename, dir: false, size: f.size }));
    return [...dirs, ...files];
  }
  onOpen(open) {
    if (!open) return;
    this.picked = [];
    this.everything = false;
    this.open("");
  }
  open(path) {
    this.path = path;
    SocketActions.serverFilesGetDirectory("gcodes", this.dir);
  }
  toggle(rel) {
    this.picked = this.picked.includes(rel) ? this.picked.filter((p) => p !== rel) : [...this.picked, rel];
  }
  choose() {
    this.$emit("choose", this.everything ? ["/"] : this.picked.slice());
    this.$emit("input", false);
  }
};
__decorateClass([
  Prop({ type: Boolean, default: false })
], UsbPrinterPicker.prototype, "value", 2);
__decorateClass([
  Prop({ type: String, default: "the USB stick" })
], UsbPrinterPicker.prototype, "stickName", 2);
__decorateClass([
  Watch("value", { immediate: true })
], UsbPrinterPicker.prototype, "onOpen", 1);
UsbPrinterPicker = __decorateClass([
  Component
], UsbPrinterPicker);
const _sfc_main = UsbPrinterPicker;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "max-width": "560", "scrollable": "", "fullscreen": _vm.isMobileViewport }, on: { "input": function($event) {
    return _vm.$emit("input", $event);
  } } }, [_c("div", { staticClass: "upick", attrs: { "data-tid": "usb-picker" } }, [_c("header", { staticClass: "upick__head" }, [_c("b", [_vm._v("Copy from the printer to " + _vm._s(_vm.stickName))]), _c("button", { staticClass: "upick__x", attrs: { "type": "button", "aria-label": "Close" }, on: { "click": function($event) {
    return _vm.$emit("input", false);
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "x" } })], 1)]), _c("nav", { staticClass: "upick__crumbs" }, [_c("button", { attrs: { "type": "button", "data-tid": "usb-picker-crumb" }, on: { "click": function($event) {
    return _vm.open("");
  } } }, [_vm._v(" gcodes ")]), _vm._l(_vm.crumbs, function(crumb) {
    return [_c("span", { key: `s-${crumb.path}`, attrs: { "aria-hidden": "true" } }, [_vm._v("/")]), _c("button", { key: crumb.path, attrs: { "type": "button", "data-tid": "usb-picker-crumb", "disabled": crumb.path === _vm.path }, on: { "click": function($event) {
      return _vm.open(crumb.path);
    } } }, [_vm._v(" " + _vm._s(crumb.name) + " ")])];
  })], 2), _c("label", { staticClass: "upick__all" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.everything, expression: "everything" }], attrs: { "type": "checkbox", "data-tid": "usb-picker-all" }, domProps: { "checked": Array.isArray(_vm.everything) ? _vm._i(_vm.everything, null) > -1 : _vm.everything }, on: { "change": function($event) {
    var $$a = _vm.everything, $$el = $event.target, $$c = $$el.checked ? true : false;
    if (Array.isArray($$a)) {
      var $$v = null, $$i = _vm._i($$a, $$v);
      if ($$el.checked) {
        $$i < 0 && (_vm.everything = $$a.concat([$$v]));
      } else {
        $$i > -1 && (_vm.everything = $$a.slice(0, $$i).concat($$a.slice($$i + 1)));
      }
    } else {
      _vm.everything = $$c;
    }
  } } }), _c("span", [_vm._v("Everything on the printer")])]), _c("ul", { staticClass: "upick__list", class: { "upick__list--off": _vm.everything } }, [!_vm.loaded ? _c("li", { staticClass: "upick__note" }, [_vm._v(" Loading\u2026 ")]) : !_vm.rows.length ? _c("li", { staticClass: "upick__note", attrs: { "data-tid": "usb-picker-empty" } }, [_vm._v(" " + _vm._s(_vm.path ? "This folder is empty." : "There is no G-code on the printer yet.") + " ")]) : _vm._e(), _vm._l(_vm.rows, function(row) {
    return _c("li", { key: row.rel, staticClass: "upick__row" }, [_c("label", [_c("input", { attrs: { "type": "checkbox", "disabled": _vm.everything, "data-tid": "usb-picker-row", "data-name": row.name }, domProps: { "checked": _vm.everything || _vm.picked.includes(row.rel) }, on: { "change": function($event) {
      return _vm.toggle(row.rel);
    } } }), _c(__unplugin_components_2, { attrs: { "name": row.dir ? "files" : "jobs", "small": "" } }), _c("span", { staticClass: "upick__name" }, [_vm._v(_vm._s(row.name))])], 1), row.dir ? _c("button", { staticClass: "upick__open", attrs: { "type": "button", "disabled": _vm.everything, "aria-label": `Open ${row.name}` }, on: { "click": function($event) {
      return _vm.open(row.rel);
    } } }, [_vm._v(" \u203A ")]) : _c("span", { staticClass: "upick__size" }, [_vm._v(_vm._s(_vm.bytes(row.size)))])]);
  })], 2), _c("footer", { staticClass: "upick__foot" }, [_c("button", { staticClass: "cbtn", attrs: { "type": "button" }, on: { "click": function($event) {
    return _vm.$emit("input", false);
  } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.everything && !_vm.picked.length, "data-tid": "usb-picker-next" }, on: { "click": _vm.choose } }, [_vm._v(" " + _vm._s(_vm.everything ? "Copy everything" : `Copy ${_vm.picked.length} selected`) + " ")])])])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/usb/UsbPrinterPicker.vue?vue&type=style&index=0&scoped=a052b927&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "a052b927",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/usb/UsbPrinterPicker.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQXVJQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBTUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQSx5QkFDQSx5REFDQTtBQUNBLDBCQUNBLDREQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQW5EQTtBQUFBO0FBQUEsR0FEQSxpQkFDQTtBQUNBO0FBQUE7QUFBQSxHQUZBLGlCQUVBO0FBOEJBO0FBQUEsRUFEQTtBQUFBLEdBL0JBLGlCQWdDQTtBQWhDQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJVc2JQcmludGVyUGlja2VyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWRpYWxvZ1xuICAgIDp2YWx1ZT1cInZhbHVlXCJcbiAgICBtYXgtd2lkdGg9XCI1NjBcIlxuICAgIHNjcm9sbGFibGVcbiAgICA6ZnVsbHNjcmVlbj1cImlzTW9iaWxlVmlld3BvcnRcIlxuICAgIEBpbnB1dD1cIiRlbWl0KCdpbnB1dCcsICRldmVudClcIlxuICA+XG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJ1cGlja1wiXG4gICAgICBkYXRhLXRpZD1cInVzYi1waWNrZXJcIlxuICAgID5cbiAgICAgIDxoZWFkZXIgY2xhc3M9XCJ1cGlja19faGVhZFwiPlxuICAgICAgICA8Yj5Db3B5IGZyb20gdGhlIHByaW50ZXIgdG8ge3sgc3RpY2tOYW1lIH19PC9iPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJ1cGlja19feFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkNsb3NlXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICAgICAgICA+XG4gICAgICAgICAgPGZyYW1lLWljb24gbmFtZT1cInhcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICA8bmF2IGNsYXNzPVwidXBpY2tfX2NydW1ic1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItcGlja2VyLWNydW1iXCJcbiAgICAgICAgICBAY2xpY2s9XCJvcGVuKCcnKVwiXG4gICAgICAgID5cbiAgICAgICAgICBnY29kZXNcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDx0ZW1wbGF0ZSB2LWZvcj1cImNydW1iIGluIGNydW1ic1wiPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICA6a2V5PVwiYHMtJHtjcnVtYi5wYXRofWBcIlxuICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICA+Lzwvc3Bhbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICA6a2V5PVwiY3J1bWIucGF0aFwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwidXNiLXBpY2tlci1jcnVtYlwiXG4gICAgICAgICAgICA6ZGlzYWJsZWQ9XCJjcnVtYi5wYXRoID09PSBwYXRoXCJcbiAgICAgICAgICAgIEBjbGljaz1cIm9wZW4oY3J1bWIucGF0aClcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt7IGNydW1iLm5hbWUgfX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDwvbmF2PlxuXG4gICAgICA8bGFiZWwgY2xhc3M9XCJ1cGlja19fYWxsXCI+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIHYtbW9kZWw9XCJldmVyeXRoaW5nXCJcbiAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidXNiLXBpY2tlci1hbGxcIlxuICAgICAgICA+XG4gICAgICAgIDxzcGFuPkV2ZXJ5dGhpbmcgb24gdGhlIHByaW50ZXI8L3NwYW4+XG4gICAgICA8L2xhYmVsPlxuXG4gICAgICA8dWxcbiAgICAgICAgY2xhc3M9XCJ1cGlja19fbGlzdFwiXG4gICAgICAgIDpjbGFzcz1cInsgJ3VwaWNrX19saXN0LS1vZmYnOiBldmVyeXRoaW5nIH1cIlxuICAgICAgPlxuICAgICAgICA8bGlcbiAgICAgICAgICB2LWlmPVwiIWxvYWRlZFwiXG4gICAgICAgICAgY2xhc3M9XCJ1cGlja19fbm90ZVwiXG4gICAgICAgID5cbiAgICAgICAgICBMb2FkaW5n4oCmXG4gICAgICAgIDwvbGk+XG4gICAgICAgIDxsaVxuICAgICAgICAgIHYtZWxzZS1pZj1cIiFyb3dzLmxlbmd0aFwiXG4gICAgICAgICAgY2xhc3M9XCJ1cGlja19fbm90ZVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJ1c2ItcGlja2VyLWVtcHR5XCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IHBhdGggPyAnVGhpcyBmb2xkZXIgaXMgZW1wdHkuJyA6ICdUaGVyZSBpcyBubyBHLWNvZGUgb24gdGhlIHByaW50ZXIgeWV0LicgfX1cbiAgICAgICAgPC9saT5cbiAgICAgICAgPGxpXG4gICAgICAgICAgdi1mb3I9XCJyb3cgaW4gcm93c1wiXG4gICAgICAgICAgOmtleT1cInJvdy5yZWxcIlxuICAgICAgICAgIGNsYXNzPVwidXBpY2tfX3Jvd1wiXG4gICAgICAgID5cbiAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgOmNoZWNrZWQ9XCJldmVyeXRoaW5nIHx8IHBpY2tlZC5pbmNsdWRlcyhyb3cucmVsKVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cImV2ZXJ5dGhpbmdcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInVzYi1waWNrZXItcm93XCJcbiAgICAgICAgICAgICAgOmRhdGEtbmFtZT1cInJvdy5uYW1lXCJcbiAgICAgICAgICAgICAgQGNoYW5nZT1cInRvZ2dsZShyb3cucmVsKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICA6bmFtZT1cInJvdy5kaXIgPyAnZmlsZXMnIDogJ2pvYnMnXCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVwaWNrX19uYW1lXCI+e3sgcm93Lm5hbWUgfX08L3NwYW4+XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWlmPVwicm93LmRpclwiXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwidXBpY2tfX29wZW5cIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiZXZlcnl0aGluZ1wiXG4gICAgICAgICAgICA6YXJpYS1sYWJlbD1cImBPcGVuICR7cm93Lm5hbWV9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJvcGVuKHJvdy5yZWwpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICDigLpcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICBjbGFzcz1cInVwaWNrX19zaXplXCJcbiAgICAgICAgICA+e3sgYnl0ZXMocm93LnNpemUpIH19PC9zcGFuPlxuICAgICAgICA8L2xpPlxuICAgICAgPC91bD5cblxuICAgICAgPGZvb3RlciBjbGFzcz1cInVwaWNrX19mb290XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICAgIEBjbGljaz1cIiRlbWl0KCdpbnB1dCcsIGZhbHNlKVwiXG4gICAgICAgID5cbiAgICAgICAgICBDYW5jZWxcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWV2ZXJ5dGhpbmcgJiYgIXBpY2tlZC5sZW5ndGhcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidXNiLXBpY2tlci1uZXh0XCJcbiAgICAgICAgICBAY2xpY2s9XCJjaG9vc2VcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgZXZlcnl0aGluZyA/ICdDb3B5IGV2ZXJ5dGhpbmcnIDogYENvcHkgJHtwaWNrZWQubGVuZ3RofSBzZWxlY3RlZGAgfX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Zvb3Rlcj5cbiAgICA8L2Rpdj5cbiAgPC92LWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgUHJvcCwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgdHlwZSB7IEFwcERpcmVjdG9yeSwgQXBwRmlsZSwgRmlsZUJyb3dzZXJFbnRyeSB9IGZyb20gJ0Avc3RvcmUvZmlsZXMvdHlwZXMnXG5pbXBvcnQgeyBpc0djb2RlRmlsZSB9IGZyb20gJ0Avc2VydmljZXMvam9icy9tb2RlbCdcbmltcG9ydCB7IGJ5dGVzV29yZHMgfSBmcm9tICdAL3NlcnZpY2VzL3VzYi93b3JkcydcblxuaW50ZXJmYWNlIFJvdyB7IHJlbDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGRpcjogYm9vbGVhbiwgc2l6ZTogbnVtYmVyIH1cblxuLyoqIFdoaWNoIG9mIHRoZSBwcmludGVyJ3MgZmlsZXMgYW5kIGZvbGRlcnMgZ28gdG8gdGhlIHN0aWNrOiBvbmUsIHNldmVyYWwsIG9yIGV2ZXJ5dGhpbmcuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVc2JQcmludGVyUGlja2VyIGV4dGVuZHMgTWl4aW5zKEJyb3dzZXJNaXhpbikge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4sIGRlZmF1bHQ6IGZhbHNlIH0pIHJlYWRvbmx5IHZhbHVlITogYm9vbGVhblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ3RoZSBVU0Igc3RpY2snIH0pIHJlYWRvbmx5IHN0aWNrTmFtZSE6IHN0cmluZ1xuXG4gIHBhdGggPSAnJ1xuICBwaWNrZWQ6IHN0cmluZ1tdID0gW11cbiAgZXZlcnl0aGluZyA9IGZhbHNlXG5cbiAgcmVhZG9ubHkgYnl0ZXMgPSBieXRlc1dvcmRzXG5cbiAgZ2V0IGRpciAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucGF0aCA/IGBnY29kZXMvJHt0aGlzLnBhdGh9YCA6ICdnY29kZXMnIH1cblxuICBnZXQgY3J1bWJzICgpOiBBcnJheTx7IG5hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBwYXJ0cyA9IHRoaXMucGF0aCA/IHRoaXMucGF0aC5zcGxpdCgnLycpIDogW11cbiAgICByZXR1cm4gcGFydHMubWFwKChuYW1lLCBpKSA9PiAoeyBuYW1lLCBwYXRoOiBwYXJ0cy5zbGljZSgwLCBpICsgMSkuam9pbignLycpIH0pKVxuICB9XG5cbiAgZ2V0IGxvYWRlZCAoKTogYm9vbGVhbiB7IHJldHVybiAhIXRoaXMuJHN0b3JlLmdldHRlcnNbJ2ZpbGVzL2dldERpcmVjdG9yeSddKHRoaXMuZGlyKSB9XG5cbiAgZ2V0IHJvd3MgKCk6IFJvd1tdIHtcbiAgICBjb25zdCBlbnRyaWVzID0gKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2ZpbGVzL2dldERpcmVjdG9yeSddKHRoaXMuZGlyKSBhcyBGaWxlQnJvd3NlckVudHJ5W10gfCB1bmRlZmluZWQpID8/IFtdXG4gICAgY29uc3QgYXQgPSAobmFtZTogc3RyaW5nKSA9PiB0aGlzLnBhdGggPyBgJHt0aGlzLnBhdGh9LyR7bmFtZX1gIDogbmFtZVxuICAgIGNvbnN0IGRpcnMgPSBlbnRyaWVzXG4gICAgICAuZmlsdGVyKChlKTogZSBpcyBBcHBEaXJlY3RvcnkgPT4gZS50eXBlID09PSAnZGlyZWN0b3J5JyAmJiBlLm5hbWUgIT09ICcuLicpXG4gICAgICAubWFwKGQgPT4gKHsgcmVsOiBhdChkLmRpcm5hbWUpLCBuYW1lOiBkLmRpcm5hbWUsIGRpcjogdHJ1ZSwgc2l6ZTogMCB9KSlcbiAgICBjb25zdCBmaWxlcyA9IGVudHJpZXNcbiAgICAgIC5maWx0ZXIoKGUpOiBlIGlzIEFwcEZpbGUgPT4gZS50eXBlID09PSAnZmlsZScgJiYgaXNHY29kZUZpbGUoZS5maWxlbmFtZSkpXG4gICAgICAubWFwKGYgPT4gKHsgcmVsOiBhdChmLmZpbGVuYW1lKSwgbmFtZTogZi5maWxlbmFtZSwgZGlyOiBmYWxzZSwgc2l6ZTogZi5zaXplIH0pKVxuICAgIHJldHVybiBbLi4uZGlycywgLi4uZmlsZXNdXG4gIH1cblxuICBAV2F0Y2goJ3ZhbHVlJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25PcGVuIChvcGVuOiBib29sZWFuKSB7XG4gICAgaWYgKCFvcGVuKSByZXR1cm5cbiAgICB0aGlzLnBpY2tlZCA9IFtdXG4gICAgdGhpcy5ldmVyeXRoaW5nID0gZmFsc2VcbiAgICB0aGlzLm9wZW4oJycpXG4gIH1cblxuICBvcGVuIChwYXRoOiBzdHJpbmcpIHtcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJGaWxlc0dldERpcmVjdG9yeSgnZ2NvZGVzJywgdGhpcy5kaXIpXG4gIH1cblxuICB0b2dnbGUgKHJlbDogc3RyaW5nKSB7XG4gICAgdGhpcy5waWNrZWQgPSB0aGlzLnBpY2tlZC5pbmNsdWRlcyhyZWwpID8gdGhpcy5waWNrZWQuZmlsdGVyKHAgPT4gcCAhPT0gcmVsKSA6IFsuLi50aGlzLnBpY2tlZCwgcmVsXVxuICB9XG5cbiAgY2hvb3NlICgpIHtcbiAgICB0aGlzLiRlbWl0KCdjaG9vc2UnLCB0aGlzLmV2ZXJ5dGhpbmcgPyBbJy8nXSA6IHRoaXMucGlja2VkLnNsaWNlKCkpXG4gICAgdGhpcy4kZW1pdCgnaW5wdXQnLCBmYWxzZSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLnVwaWNrIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiAxMHB4O1xuICAgIG1heC1oZWlnaHQ6IDEwMCU7XG4gICAgcGFkZGluZzogMThweDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJvcmRlci1yYWRpdXM6IDIycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cblxuICAudXBpY2tfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcblxuICAgIGIge1xuICAgICAgZmxleDogMTtcbiAgICAgIGZvbnQtc2l6ZTogMTdweDtcbiAgICB9XG4gIH1cblxuICAudXBpY2tfX3gge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIHBhZGRpbmc6IDZweDtcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC51cGlja19fY3J1bWJzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICBnYXA6IDRweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcblxuICAgIGJ1dHRvbjpub3QoOmRpc2FibGVkKSB7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCk7XG4gICAgfVxuICB9XG5cbiAgLnVwaWNrX19hbGwge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cblxuICAudXBpY2tfX2xpc3Qge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleDogMTtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1pbi1oZWlnaHQ6IDEyMHB4O1xuICAgIG1hcmdpbjogMDtcbiAgICBwYWRkaW5nOiAwO1xuICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcblxuICAgICYtLW9mZiB7XG4gICAgICBvcGFjaXR5OiAwLjU7XG4gICAgfVxuICB9XG5cbiAgLnVwaWNrX19yb3cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDhweDtcbiAgICBwYWRkaW5nOiA0cHggNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG5cbiAgICBsYWJlbCB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZmxleDogMTtcbiAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICBnYXA6IDhweDtcbiAgICAgIG1pbi13aWR0aDogMDtcbiAgICAgIG1pbi1oZWlnaHQ6IDM2cHg7XG4gICAgfVxuICB9XG5cbiAgLnVwaWNrX19uYW1lIHtcbiAgICBtaW4td2lkdGg6IDA7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgfVxuXG4gIC51cGlja19fc2l6ZSB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cblxuICAudXBpY2tfX29wZW4ge1xuICAgIHBhZGRpbmc6IDRweCAxMHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxOHB4O1xuICB9XG5cbiAgLnVwaWNrX19ub3RlIHtcbiAgICBwYWRkaW5nOiAxNnB4IDZweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgfVxuXG4gIC51cGlja19fZm9vdCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgIGdhcDogOHB4O1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdXNiL1VzYlByaW50ZXJQaWNrZXIudnVlIn0=