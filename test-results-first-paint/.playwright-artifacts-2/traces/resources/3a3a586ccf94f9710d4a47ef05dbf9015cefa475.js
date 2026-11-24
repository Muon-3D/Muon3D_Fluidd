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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let TileMenu = class extends Vue {
  items;
  label;
  open = false;
  choose(item) {
    if (item.disabled) return;
    if (!item.toggle) this.open = false;
    item.action?.();
  }
  onOutside(event) {
    if (this.open && !this.$refs.root?.contains(event.target)) this.open = false;
  }
  mounted() {
    document.addEventListener("mousedown", this.onOutside);
  }
  beforeDestroy() {
    document.removeEventListener("mousedown", this.onOutside);
  }
};
__decorateClass([
  Prop({ type: Array, default: () => [] })
], TileMenu.prototype, "items", 2);
__decorateClass([
  Prop({ type: String, default: "this tile" })
], TileMenu.prototype, "label", 2);
TileMenu = __decorateClass([
  Component({})
], TileMenu);
const _sfc_main = TileMenu;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("span", { ref: "root", staticClass: "tm" }, [_c("button", { staticClass: "tm__btn", attrs: { "type": "button", "aria-label": `More for ${_vm.label}`, "aria-haspopup": "menu", "aria-expanded": _vm.open ? "true" : "false", "data-tid": "tile-more" }, on: { "click": function($event) {
    $event.stopPropagation();
    _vm.open = !_vm.open;
  } } }, [_c(__unplugin_components_0, { attrs: { "name": "more" } })], 1), _vm.open ? _c("div", { staticClass: "tm__menu", attrs: { "role": "menu", "data-tid": "tile-menu" }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    $event.stopPropagation();
    _vm.open = false;
  } } }, [_vm._l(_vm.items, function(item) {
    return [item.to && !item.disabled ? _c("router-link", { key: item.id, staticClass: "tm__item", attrs: { "role": "menuitem", "to": item.to, "data-menu": item.id }, nativeOn: { "click": function($event) {
      _vm.open = false;
    } } }, [_vm._v(" " + _vm._s(item.label) + " ")]) : _c("button", { key: item.id, staticClass: "tm__item", attrs: { "type": "button", "role": "menuitem", "disabled": item.disabled || !!item.to, "aria-checked": item.toggle ? item.on ? "true" : "false" : void 0, "data-menu": item.id }, on: { "click": function($event) {
      return _vm.choose(item);
    } } }, [_c("span", [_vm._v(_vm._s(item.label))]), item.toggle ? _c("span", { staticClass: "tm__tick", attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(item.on ? "On" : "Off"))]) : item.hint ? _c("span", { staticClass: "tm__hint" }, [_vm._v(_vm._s(item.hint))]) : _vm._e()])];
  })], 2) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/TileMenu.vue?vue&type=style&index=0&scoped=84cf5759&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "84cf5759",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/TileMenu.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUErREE7QUFTQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFDQTtBQWpCQTtBQUFBO0FBQUEsR0FEQSxTQUNBO0FBQ0E7QUFBQTtBQUFBLEdBRkEsU0FFQTtBQUZBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIlRpbGVNZW51LnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzcGFuXG4gICAgcmVmPVwicm9vdFwiXG4gICAgY2xhc3M9XCJ0bVwiXG4gID5cbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwidG1fX2J0blwiXG4gICAgICA6YXJpYS1sYWJlbD1cImBNb3JlIGZvciAke2xhYmVsfWBcIlxuICAgICAgYXJpYS1oYXNwb3B1cD1cIm1lbnVcIlxuICAgICAgOmFyaWEtZXhwYW5kZWQ9XCJvcGVuID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICBkYXRhLXRpZD1cInRpbGUtbW9yZVwiXG4gICAgICBAY2xpY2suc3RvcD1cIm9wZW4gPSAhb3BlblwiXG4gICAgPlxuICAgICAgPGZyYW1lLWljb24gbmFtZT1cIm1vcmVcIiAvPlxuICAgIDwvYnV0dG9uPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJvcGVuXCJcbiAgICAgIGNsYXNzPVwidG1fX21lbnVcIlxuICAgICAgcm9sZT1cIm1lbnVcIlxuICAgICAgZGF0YS10aWQ9XCJ0aWxlLW1lbnVcIlxuICAgICAgQGtleWRvd24uZXNjLnN0b3A9XCJvcGVuID0gZmFsc2VcIlxuICAgID5cbiAgICAgIDx0ZW1wbGF0ZSB2LWZvcj1cIml0ZW0gaW4gaXRlbXNcIj5cbiAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgdi1pZj1cIml0ZW0udG8gJiYgIWl0ZW0uZGlzYWJsZWRcIlxuICAgICAgICAgIDprZXk9XCJpdGVtLmlkXCJcbiAgICAgICAgICBjbGFzcz1cInRtX19pdGVtXCJcbiAgICAgICAgICByb2xlPVwibWVudWl0ZW1cIlxuICAgICAgICAgIDp0bz1cIml0ZW0udG9cIlxuICAgICAgICAgIDpkYXRhLW1lbnU9XCJpdGVtLmlkXCJcbiAgICAgICAgICBAY2xpY2submF0aXZlPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgICAgPlxuICAgICAgICAgIHt7IGl0ZW0ubGFiZWwgfX1cbiAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtZWxzZVxuICAgICAgICAgIDprZXk9XCJpdGVtLmlkXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cInRtX19pdGVtXCJcbiAgICAgICAgICByb2xlPVwibWVudWl0ZW1cIlxuICAgICAgICAgIDpkaXNhYmxlZD1cIml0ZW0uZGlzYWJsZWQgfHwgISFpdGVtLnRvXCJcbiAgICAgICAgICA6YXJpYS1jaGVja2VkPVwiaXRlbS50b2dnbGUgPyAoaXRlbS5vbiA/ICd0cnVlJyA6ICdmYWxzZScpIDogdW5kZWZpbmVkXCJcbiAgICAgICAgICA6ZGF0YS1tZW51PVwiaXRlbS5pZFwiXG4gICAgICAgICAgQGNsaWNrPVwiY2hvb3NlKGl0ZW0pXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuPnt7IGl0ZW0ubGFiZWwgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIHYtaWY9XCJpdGVtLnRvZ2dsZVwiXG4gICAgICAgICAgICBjbGFzcz1cInRtX190aWNrXCJcbiAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgICAgPnt7IGl0ZW0ub24gPyAnT24nIDogJ09mZicgfX08L3NwYW4+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIHYtZWxzZS1pZj1cIml0ZW0uaGludFwiXG4gICAgICAgICAgICBjbGFzcz1cInRtX19oaW50XCJcbiAgICAgICAgICA+e3sgaXRlbS5oaW50IH19PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC9kaXY+XG4gIDwvc3Bhbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IFRpbGVNZW51SXRlbSB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvdGlsZXMnXG5cbi8qKlxuICogQSB0aWxlJ3Mg4ouvIG1lbnU6IHRoZSBQcm8tbGV2ZWwgZGVwdGgsIG9uZSB0YXAgYXdheS4gSXRlbXMgYXJlIGxpbmtzIHRvIGFcbiAqIHBhZ2Ugb3IgdGhpbmdzIHRvIGRvOyBhIHN3aXRjaCBzYXlzIHdoZXRoZXIgaXQgaXMgb24uIENsb3NlcyBvbiBhIGNob2ljZSxcbiAqIEVzYywgb3IgYSBjbGljayBhbnl3aGVyZSBlbHNlLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGlsZU1lbnUgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEFycmF5LCBkZWZhdWx0OiAoKSA9PiBbXSB9KSByZWFkb25seSBpdGVtcyE6IFRpbGVNZW51SXRlbVtdXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAndGhpcyB0aWxlJyB9KSByZWFkb25seSBsYWJlbCE6IHN0cmluZ1xuXG4gIG9wZW4gPSBmYWxzZVxuXG4gIGNob29zZSAoaXRlbTogVGlsZU1lbnVJdGVtKSB7XG4gICAgaWYgKGl0ZW0uZGlzYWJsZWQpIHJldHVyblxuICAgIGlmICghaXRlbS50b2dnbGUpIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgaXRlbS5hY3Rpb24/LigpXG4gIH1cblxuICBvbk91dHNpZGUgKGV2ZW50OiBFdmVudCkge1xuICAgIGlmICh0aGlzLm9wZW4gJiYgISh0aGlzLiRyZWZzLnJvb3QgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQpPy5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpIHRoaXMub3BlbiA9IGZhbHNlXG4gIH1cblxuICBtb3VudGVkICgpIHsgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk91dHNpZGUpIH1cbiAgYmVmb3JlRGVzdHJveSAoKSB7IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25PdXRzaWRlKSB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuLnRtIHsgcG9zaXRpb246IHJlbGF0aXZlOyBkaXNwbGF5OiBpbmxpbmUtZmxleDsgfVxuLnRtX19idG4geyBkaXNwbGF5OiBpbmxpbmUtZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IHdpZHRoOiAzMHB4OyBoZWlnaHQ6IDMwcHg7IGJvcmRlci1yYWRpdXM6IDUwJTsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgY3Vyc29yOiBwb2ludGVyOyB9XG4udG1fX2J0bjpob3ZlciwgLnRtX19idG5bYXJpYS1leHBhbmRlZD0ndHJ1ZSddIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyLCB2YXIoLS1tM2QtZmlsbCkpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpOyB9XG4udG1fX2J0biAuZnJhbWUtaWNvbiB7IGNvbG9yOiBpbmhlcml0OyB9XG4udG1fX21lbnUge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogY2FsYygxMDAlICsgNnB4KTsgcmlnaHQ6IDA7IHotaW5kZXg6IDIwOyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBtaW4td2lkdGg6IDI1MHB4OyBtYXgtd2lkdGg6IDgwdnc7IHBhZGRpbmc6IDZweDtcbiAgYm9yZGVyLXJhZGl1czogMThweDsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWdsYXNzLXRoaWNrLCB2YXIoLS1tM2Qtc3VyZmFjZSkpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICBib3gtc2hhZG93OiB2YXIoLS1tM2Qtc2hhZG93LWZsb2F0KSwgaW5zZXQgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXItc3Ryb25nKTsgYmFja2Ryb3AtZmlsdGVyOiB2YXIoLS1tM2QtZ2xhc3MtZmlsdGVyKTtcbn1cbi50bV9faXRlbSB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgZ2FwOiAxNnB4OyB3aWR0aDogMTAwJTsgcGFkZGluZzogOXB4IDEycHg7IGJvcmRlci1yYWRpdXM6IDEycHg7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCkgIWltcG9ydGFudDsgZm9udC1zaXplOiAxNHB4OyBmb250LXdlaWdodDogNTAwOyB0ZXh0LWFsaWduOiBsZWZ0OyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IGN1cnNvcjogcG9pbnRlcjsgfVxuLnRtX19pdGVtOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWhvdmVyLCB2YXIoLS1tM2QtZmlsbCkpOyB9XG4udG1fX2l0ZW06ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ1OyBjdXJzb3I6IGRlZmF1bHQ7IH1cbi50bV9faGludCwgLnRtX190aWNrIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7IGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTsgZm9udC1zaXplOiAxMnB4OyB9XG4udG1fX2l0ZW1bYXJpYS1jaGVja2VkPSd0cnVlJ10gLnRtX190aWNrIHsgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpOyB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9vdmVydmlldy90aWxlcy9UaWxlTWVudS52dWUifQ==