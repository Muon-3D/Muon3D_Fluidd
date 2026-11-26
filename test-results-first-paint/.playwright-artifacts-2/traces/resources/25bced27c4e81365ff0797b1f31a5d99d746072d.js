/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
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
import OverviewMixin from "/src/mixins/overview.ts";
let ObjectsList = class extends Mixins(OverviewMixin) {
  get objects() {
    return this.$store.state.printer.printer.exclude_object?.objects ?? [];
  }
  get excluded() {
    return this.$store.state.printer.printer.exclude_object?.excluded_objects ?? [];
  }
  async skip(name) {
    if (!this.controlReady || !(this.printerPrinting || this.printerPaused) || !this.objects.some((o) => o.name === name) || this.excluded.includes(name) || !/^[a-z0-9_.-]+$/i.test(name)) return;
    const target = this.panelTarget;
    const file = this.jobFile;
    const job = this.activePrintJob?.job_id;
    const duration = this.printStats.total_duration ?? 0;
    const ok = await this.$confirm("A skipped object cannot be added back to this print.", { title: `Stop printing ${name}?`, buttonTrueText: "Skip it", danger: true });
    if (ok && job === this.activePrintJob?.job_id && (this.printStats.total_duration ?? 0) >= duration && target === this.panelTarget && file === this.jobFile && this.controlReady && (this.printerPrinting || this.printerPaused) && this.objects.some((o) => o.name === name) && !this.excluded.includes(name)) await this.sendTypedGcode(`EXCLUDE_OBJECT NAME=${name}`);
  }
};
ObjectsList = __decorateClass([
  Component({})
], ObjectsList);
const _sfc_main = ObjectsList;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "ol", attrs: { "data-tid": "objects-list" } }, [_c("p", { staticClass: "ot__note" }, [_vm._v(" Skip one if it fails. The rest of the plate carries on. ")]), _vm._l(_vm.objects, function(object) {
    return _c("div", { key: object.name, staticClass: "ol__row" }, [_c("span", { staticClass: "ol__name" }, [_vm._v(_vm._s(object.name))]), _vm.excluded.includes(object.name) ? _c("span", { staticClass: "ol__skipped" }, [_vm._v("Skipped")]) : _c("button", { staticClass: "cbtn", attrs: { "type": "button", "disabled": !_vm.controlReady || !_vm.busy, "data-skip": object.name }, on: { "click": function($event) {
      return _vm.skip(object.name);
    } } }, [_vm._v(" Skip ")])]);
  }), !_vm.objects.length ? _c("p", { staticClass: "ot__note" }, [_vm._v(" This print has no separate objects. ")]) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/ObjectsList.vue?vue&type=style&index=0&scoped=7deb77cb&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "7deb77cb",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/ObjectsList.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQXVDQTtBQUNBO0FBSUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBYkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiT2JqZWN0c0xpc3QudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwib2xcIlxuICAgIGRhdGEtdGlkPVwib2JqZWN0cy1saXN0XCJcbiAgPlxuICAgIDxwIGNsYXNzPVwib3RfX25vdGVcIj5cbiAgICAgIFNraXAgb25lIGlmIGl0IGZhaWxzLiBUaGUgcmVzdCBvZiB0aGUgcGxhdGUgY2FycmllcyBvbi5cbiAgICA8L3A+XG4gICAgPGRpdlxuICAgICAgdi1mb3I9XCJvYmplY3QgaW4gb2JqZWN0c1wiXG4gICAgICA6a2V5PVwib2JqZWN0Lm5hbWVcIlxuICAgICAgY2xhc3M9XCJvbF9fcm93XCJcbiAgICA+XG4gICAgICA8c3BhbiBjbGFzcz1cIm9sX19uYW1lXCI+e3sgb2JqZWN0Lm5hbWUgfX08L3NwYW4+XG4gICAgICA8c3BhblxuICAgICAgICB2LWlmPVwiZXhjbHVkZWQuaW5jbHVkZXMob2JqZWN0Lm5hbWUpXCJcbiAgICAgICAgY2xhc3M9XCJvbF9fc2tpcHBlZFwiXG4gICAgICA+U2tpcHBlZDwvc3Bhbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1lbHNlXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG5cIlxuICAgICAgICA6ZGlzYWJsZWQ9XCIhY29udHJvbFJlYWR5IHx8ICFidXN5XCJcbiAgICAgICAgOmRhdGEtc2tpcD1cIm9iamVjdC5uYW1lXCJcbiAgICAgICAgQGNsaWNrPVwic2tpcChvYmplY3QubmFtZSlcIlxuICAgICAgPlxuICAgICAgICBTa2lwXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8cFxuICAgICAgdi1pZj1cIiFvYmplY3RzLmxlbmd0aFwiXG4gICAgICBjbGFzcz1cIm90X19ub3RlXCJcbiAgICA+XG4gICAgICBUaGlzIHByaW50IGhhcyBubyBzZXBhcmF0ZSBvYmplY3RzLlxuICAgIDwvcD5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE92ZXJ2aWV3TWl4aW4gZnJvbSAnQC9taXhpbnMvb3ZlcnZpZXcnXG5cbi8qKiBUaGUgb2JqZWN0cyBvbiB0aGUgcGxhdGUsIGVhY2ggd2l0aCBhIFNraXAuIEEgc2tpcHBlZCBvYmplY3QgY2Fubm90IGJlIGFkZGVkIGJhY2suICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JqZWN0c0xpc3QgZXh0ZW5kcyBNaXhpbnMoT3ZlcnZpZXdNaXhpbikge1xuICBnZXQgb2JqZWN0cyAoKTogQXJyYXk8eyBuYW1lOiBzdHJpbmcgfT4geyByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmV4Y2x1ZGVfb2JqZWN0Py5vYmplY3RzID8/IFtdIH1cbiAgZ2V0IGV4Y2x1ZGVkICgpOiBzdHJpbmdbXSB7IHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuZXhjbHVkZV9vYmplY3Q/LmV4Y2x1ZGVkX29iamVjdHMgPz8gW10gfVxuXG4gIGFzeW5jIHNraXAgKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgISh0aGlzLnByaW50ZXJQcmludGluZyB8fCB0aGlzLnByaW50ZXJQYXVzZWQpIHx8ICF0aGlzLm9iamVjdHMuc29tZShvID0+IG8ubmFtZSA9PT0gbmFtZSkgfHwgdGhpcy5leGNsdWRlZC5pbmNsdWRlcyhuYW1lKSB8fCAhL15bYS16MC05Xy4tXSskL2kudGVzdChuYW1lKSkgcmV0dXJuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5wYW5lbFRhcmdldFxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmpvYkZpbGVcbiAgICBjb25zdCBqb2IgPSB0aGlzLmFjdGl2ZVByaW50Sm9iPy5qb2JfaWRcbiAgICBjb25zdCBkdXJhdGlvbiA9IHRoaXMucHJpbnRTdGF0cy50b3RhbF9kdXJhdGlvbiA/PyAwXG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLiRjb25maXJtKCdBIHNraXBwZWQgb2JqZWN0IGNhbm5vdCBiZSBhZGRlZCBiYWNrIHRvIHRoaXMgcHJpbnQuJywgeyB0aXRsZTogYFN0b3AgcHJpbnRpbmcgJHtuYW1lfT9gLCBidXR0b25UcnVlVGV4dDogJ1NraXAgaXQnLCBkYW5nZXI6IHRydWUgfSlcbiAgICBpZiAob2sgJiYgam9iID09PSB0aGlzLmFjdGl2ZVByaW50Sm9iPy5qb2JfaWQgJiYgKHRoaXMucHJpbnRTdGF0cy50b3RhbF9kdXJhdGlvbiA/PyAwKSA+PSBkdXJhdGlvbiAmJiB0YXJnZXQgPT09IHRoaXMucGFuZWxUYXJnZXQgJiYgZmlsZSA9PT0gdGhpcy5qb2JGaWxlICYmIHRoaXMuY29udHJvbFJlYWR5ICYmICh0aGlzLnByaW50ZXJQcmludGluZyB8fCB0aGlzLnByaW50ZXJQYXVzZWQpICYmIHRoaXMub2JqZWN0cy5zb21lKG8gPT4gby5uYW1lID09PSBuYW1lKSAmJiAhdGhpcy5leGNsdWRlZC5pbmNsdWRlcyhuYW1lKSkgYXdhaXQgdGhpcy5zZW5kVHlwZWRHY29kZShgRVhDTFVERV9PQkpFQ1QgTkFNRT0ke25hbWV9YClcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbi5vbCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogOHB4OyB9XG4ub2xfX3JvdyB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgZ2FwOiA4cHg7IG1pbi1oZWlnaHQ6IDQ0cHg7IH1cbi5vbF9fbmFtZSB7IG92ZXJmbG93LXdyYXA6IGFueXdoZXJlOyB9XG4ub2xfX3NraXBwZWQgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTsgZm9udC1zaXplOiAxM3B4OyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9PYmplY3RzTGlzdC52dWUifQ==