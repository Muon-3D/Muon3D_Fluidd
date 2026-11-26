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
import TileMenu from "/src/components/widgets/overview/tiles/TileMenu.vue";
let seed = 0;
let TileShell = class extends Vue {
  tile;
  title;
  icon;
  state;
  tone;
  menu;
  open;
  locked;
  bare;
  popId = `ot-pop-${++seed}`;
  get hasPopover() {
    return !!this.$scopedSlots.popover;
  }
  close() {
    if (this.open) this.$emit("toggle");
  }
  onOutside(event) {
    if (this.open && !this.$refs.root?.contains(event.target)) this.$emit("toggle");
  }
  mounted() {
    document.addEventListener("mousedown", this.onOutside);
  }
  beforeDestroy() {
    document.removeEventListener("mousedown", this.onOutside);
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], TileShell.prototype, "tile", 2);
__decorateClass([
  Prop({ type: String, required: true })
], TileShell.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], TileShell.prototype, "icon", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], TileShell.prototype, "state", 2);
__decorateClass([
  Prop({ type: String, default: "off" })
], TileShell.prototype, "tone", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], TileShell.prototype, "menu", 2);
__decorateClass([
  Prop({ type: Boolean })
], TileShell.prototype, "open", 2);
__decorateClass([
  Prop({ type: Boolean })
], TileShell.prototype, "locked", 2);
__decorateClass([
  Prop({ type: Boolean })
], TileShell.prototype, "bare", 2);
TileShell = __decorateClass([
  Component({ components: { TileMenu } })
], TileShell);
const _sfc_main = TileShell;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { ref: "root", staticClass: "ot", class: { "ot--open": _vm.open, "ot--bare": _vm.bare }, attrs: { "data-tile": _vm.tile }, on: { "keydown": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "esc", 27, $event.key, ["Esc", "Escape"])) return null;
    return _vm.close.apply(null, arguments);
  } } }, [_c(_vm.hasPopover ? "button" : "div", { tag: "component", staticClass: "ot__door", attrs: { "type": _vm.hasPopover ? "button" : void 0, "aria-expanded": _vm.hasPopover ? _vm.open ? "true" : "false" : void 0, "aria-controls": _vm.hasPopover ? _vm.popId : void 0, "aria-label": _vm.hasPopover ? `${_vm.title} controls` : void 0, "disabled": _vm.hasPopover && _vm.locked ? true : void 0, "data-tid": "tile-door" }, on: { "click": function($event) {
    _vm.hasPopover && _vm.$emit("toggle");
  } } }, [!_vm.bare ? _c("span", { staticClass: "ot__head" }, [_vm.icon ? _c(__unplugin_components_0, { attrs: { "name": _vm.icon, "small": "" } }) : _vm._e(), _c("span", { staticClass: "ot__title" }, [_vm._v(_vm._s(_vm.title))]), _c("span", { staticClass: "ot__grow" }), _vm._t("head"), _vm.state ? _c("span", { staticClass: "ot__state", class: `ot__state--${_vm.tone}`, attrs: { "data-tid": "tile-state" } }, [_vm._v(_vm._s(_vm.state))]) : _vm._e()], 2) : _vm._e(), _vm._t("default")], 2), _vm._t("after"), _vm.menu.length ? _c("tile-menu", { staticClass: "ot__more", attrs: { "items": _vm.menu, "label": _vm.title } }) : _vm._e(), _vm.hasPopover && _vm.open ? _c("div", { staticClass: "ot__pop", attrs: { "id": _vm.popId, "role": "dialog", "aria-label": `${_vm.title} controls`, "data-tid": "tile-popover" } }, [_vm._t("popover")], 2) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/overview/tiles/TileShell.vue?vue&type=style&index=0&lang.scss";
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/overview/tiles/TileShell.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUE2REE7QUFDQTtBQUdBO0FBU0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQ0E7QUF4QkE7QUFBQTtBQUFBLEdBREEsVUFDQTtBQUNBO0FBQUE7QUFBQSxHQUZBLFVBRUE7QUFDQTtBQUFBO0FBQUEsR0FIQSxVQUdBO0FBQ0E7QUFBQTtBQUFBLEdBSkEsVUFJQTtBQUNBO0FBQUE7QUFBQSxHQUxBLFVBS0E7QUFDQTtBQUFBO0FBQUEsR0FOQSxVQU1BO0FBQ0E7QUFBQTtBQUFBLEdBUEEsVUFPQTtBQUVBO0FBQUE7QUFBQSxHQVRBLFVBU0E7QUFFQTtBQUFBO0FBQUEsR0FYQSxVQVdBO0FBWEE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVGlsZVNoZWxsLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgcmVmPVwicm9vdFwiXG4gICAgY2xhc3M9XCJvdFwiXG4gICAgOmNsYXNzPVwieyAnb3QtLW9wZW4nOiBvcGVuLCAnb3QtLWJhcmUnOiBiYXJlIH1cIlxuICAgIDpkYXRhLXRpbGU9XCJ0aWxlXCJcbiAgICBAa2V5ZG93bi5lc2M9XCJjbG9zZVwiXG4gID5cbiAgICA8Y29tcG9uZW50XG4gICAgICA6aXM9XCJoYXNQb3BvdmVyID8gJ2J1dHRvbicgOiAnZGl2J1wiXG4gICAgICBjbGFzcz1cIm90X19kb29yXCJcbiAgICAgIDp0eXBlPVwiaGFzUG9wb3ZlciA/ICdidXR0b24nIDogdW5kZWZpbmVkXCJcbiAgICAgIDphcmlhLWV4cGFuZGVkPVwiaGFzUG9wb3ZlciA/IChvcGVuID8gJ3RydWUnIDogJ2ZhbHNlJykgOiB1bmRlZmluZWRcIlxuICAgICAgOmFyaWEtY29udHJvbHM9XCJoYXNQb3BvdmVyID8gcG9wSWQgOiB1bmRlZmluZWRcIlxuICAgICAgOmFyaWEtbGFiZWw9XCJoYXNQb3BvdmVyID8gYCR7dGl0bGV9IGNvbnRyb2xzYCA6IHVuZGVmaW5lZFwiXG4gICAgICA6ZGlzYWJsZWQ9XCJoYXNQb3BvdmVyICYmIGxvY2tlZCA/IHRydWUgOiB1bmRlZmluZWRcIlxuICAgICAgZGF0YS10aWQ9XCJ0aWxlLWRvb3JcIlxuICAgICAgQGNsaWNrPVwiaGFzUG9wb3ZlciAmJiAkZW1pdCgndG9nZ2xlJylcIlxuICAgID5cbiAgICAgIDxzcGFuXG4gICAgICAgIHYtaWY9XCIhYmFyZVwiXG4gICAgICAgIGNsYXNzPVwib3RfX2hlYWRcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIHYtaWY9XCJpY29uXCJcbiAgICAgICAgICA6bmFtZT1cImljb25cIlxuICAgICAgICAgIHNtYWxsXG4gICAgICAgIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwib3RfX3RpdGxlXCI+e3sgdGl0bGUgfX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwib3RfX2dyb3dcIiAvPlxuICAgICAgICA8c2xvdCBuYW1lPVwiaGVhZFwiIC8+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgdi1pZj1cInN0YXRlXCJcbiAgICAgICAgICBjbGFzcz1cIm90X19zdGF0ZVwiXG4gICAgICAgICAgOmNsYXNzPVwiYG90X19zdGF0ZS0tJHt0b25lfWBcIlxuICAgICAgICAgIGRhdGEtdGlkPVwidGlsZS1zdGF0ZVwiXG4gICAgICAgID57eyBzdGF0ZSB9fTwvc3Bhbj5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDxzbG90IC8+XG4gICAgPC9jb21wb25lbnQ+XG4gICAgPHNsb3QgbmFtZT1cImFmdGVyXCIgLz5cbiAgICA8dGlsZS1tZW51XG4gICAgICB2LWlmPVwibWVudS5sZW5ndGhcIlxuICAgICAgY2xhc3M9XCJvdF9fbW9yZVwiXG4gICAgICA6aXRlbXM9XCJtZW51XCJcbiAgICAgIDpsYWJlbD1cInRpdGxlXCJcbiAgICAvPlxuICAgIDxkaXZcbiAgICAgIHYtaWY9XCJoYXNQb3BvdmVyICYmIG9wZW5cIlxuICAgICAgOmlkPVwicG9wSWRcIlxuICAgICAgY2xhc3M9XCJvdF9fcG9wXCJcbiAgICAgIHJvbGU9XCJkaWFsb2dcIlxuICAgICAgOmFyaWEtbGFiZWw9XCJgJHt0aXRsZX0gY29udHJvbHNgXCJcbiAgICAgIGRhdGEtdGlkPVwidGlsZS1wb3BvdmVyXCJcbiAgICA+XG4gICAgICA8c2xvdCBuYW1lPVwicG9wb3ZlclwiIC8+XG4gICAgPC9kaXY+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgVGlsZU1lbnUgZnJvbSAnLi9UaWxlTWVudS52dWUnXG5pbXBvcnQgdHlwZSB7IFRpbGVNZW51SXRlbSB9IGZyb20gJ0Avc2VydmljZXMvb3ZlcnZpZXcvdGlsZXMnXG5cbmxldCBzZWVkID0gMFxuXG4vKipcbiAqIFRoZSBjYXJkIGV2ZXJ5IE92ZXJ2aWV3IHRpbGUgaXM6IGFuIGljb24gYW5kIHRpdGxlLCBhIHN0YXRlLCBhIOKLryBtZW51IGZvclxuICogdGhlIFByby1sZXZlbCBkZXB0aCwgYW5kIChmb3IgdGhlIGluc3RydW1lbnQgdGlsZXMpIGEgcG9wb3ZlciB3aXRoIHRoZVxuICogZnVsbCBjb250cm9scyB0aGF0IG9wZW5zIGZyb20gdGhlIHRpbGUgaXRzZWxmLiBFc2Mgb3IgYSBjbGljayBvdXRzaWRlXG4gKiBjbG9zZXMgdGhlIHBvcG92ZXIuIFRoZSB0aWxlIGxpc3QgaW4gYHJlZ2lzdHJ5LnRzYCBpcyB3aGF0IHBsYWNlcyB0aGVzZS5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgVGlsZU1lbnUgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGlsZVNoZWxsIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IHRpbGUhOiBzdHJpbmdcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IHRpdGxlITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KSByZWFkb25seSBpY29uITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9KSByZWFkb25seSBzdGF0ZSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJ29mZicgfSkgcmVhZG9ubHkgdG9uZSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IEFycmF5LCBkZWZhdWx0OiAoKSA9PiBbXSB9KSByZWFkb25seSBtZW51ITogVGlsZU1lbnVJdGVtW11cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IG9wZW4hOiBib29sZWFuXG4gIC8qKiBOb3RoaW5nIHRvIG9wZW4gKG5vIGRhdGEsIG9yIHRoZSBwYXJ0IGlzIGRpc2Nvbm5lY3RlZCkuICovXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSBsb2NrZWQhOiBib29sZWFuXG4gIC8qKiBObyBoZWFkZXIgYXQgYWxsOiB0aGUgY29udGVudCBmaWxscyB0aGUgdGlsZSAodGhlIG1haW4gdmlldykuICovXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KSByZWFkb25seSBiYXJlITogYm9vbGVhblxuXG4gIHBvcElkID0gYG90LXBvcC0keysrc2VlZH1gXG5cbiAgZ2V0IGhhc1BvcG92ZXIgKCk6IGJvb2xlYW4geyByZXR1cm4gISF0aGlzLiRzY29wZWRTbG90cy5wb3BvdmVyIH1cblxuICBjbG9zZSAoKSB7IGlmICh0aGlzLm9wZW4pIHRoaXMuJGVtaXQoJ3RvZ2dsZScpIH1cblxuICBvbk91dHNpZGUgKGV2ZW50OiBFdmVudCkge1xuICAgIGlmICh0aGlzLm9wZW4gJiYgISh0aGlzLiRyZWZzLnJvb3QgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQpPy5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpIHRoaXMuJGVtaXQoJ3RvZ2dsZScpXG4gIH1cblxuICBtb3VudGVkICgpIHsgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk91dHNpZGUpIH1cbiAgYmVmb3JlRGVzdHJveSAoKSB7IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25PdXRzaWRlKSB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4ub3Qge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogOHB4OyBtaW4td2lkdGg6IDA7IHBhZGRpbmc6IDE2cHggMThweDsgYm9yZGVyLXJhZGl1czogMjJweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpOyBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xufVxuLm90LS1iYXJlIHsgcGFkZGluZzogMDsgb3ZlcmZsb3c6IGhpZGRlbjsgfVxuLm90LS1vcGVuIHsgei1pbmRleDogNjsgYm94LXNoYWRvdzogMCAwIDAgMS41cHggdmFyKC0tbTNkLWFjY2VudCk7IH1cbi5vdF9fZG9vciB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogOHB4OyB3aWR0aDogMTAwJTsgbWluLXdpZHRoOiAwOyBwYWRkaW5nOiAwOyBjb2xvcjogaW5oZXJpdDsgdGV4dC1hbGlnbjogbGVmdDsgZm9udDogaW5oZXJpdDsgfVxuYnV0dG9uLm90X19kb29yIHsgY3Vyc29yOiBwb2ludGVyOyB9XG5idXR0b24ub3RfX2Rvb3I6Zm9jdXMtdmlzaWJsZSB7IG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1tM2QtZm9jdXMtcmluZywgdmFyKC0tbTNkLWFjY2VudCkpOyBvdXRsaW5lLW9mZnNldDogNHB4OyBib3JkZXItcmFkaXVzOiAxMnB4OyB9XG4ub3RfX2hlYWQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDhweDsgbWluLWhlaWdodDogMjhweDsgcGFkZGluZy1yaWdodDogMzZweDsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuLm90X19oZWFkIC5mcmFtZS1pY29uIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuLm90X190aXRsZSB7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7IGZvbnQtc2l6ZTogMTVweDsgZm9udC13ZWlnaHQ6IDYwMDsgfVxuLm90X19ncm93IHsgZmxleDogMSAxIGF1dG87IH1cbi5vdCA+IC50bS5vdF9fbW9yZSB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxNHB4OyByaWdodDogMTRweDsgfVxuLm90X19zdGF0ZSB7IHBhZGRpbmc6IDJweCA5cHg7IGJvcmRlci1yYWRpdXM6IDk5OXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbC0yLCB2YXIoLS1tM2Qtc3VyZmFjZS0yKSk7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTEuNXB4OyBmb250LXdlaWdodDogNjAwOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XG4ub3RfX3N0YXRlLS1vayB7IGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtc3VjY2VzcykgMTYlLCB0cmFuc3BhcmVudCk7IGNvbG9yOiB2YXIoLS1tM2Qtc3VjY2Vzcyk7IH1cbi5vdF9fc3RhdGUtLXdhcm0geyBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLXdhcm5pbmcpIDE2JSwgdHJhbnNwYXJlbnQpOyBjb2xvcjogdmFyKC0tbTNkLXdhcm5pbmcpOyB9XG4ub3RfX3N0YXRlLS1iYWQgeyBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tbTNkLWRhbmdlcikgMTYlLCB0cmFuc3BhcmVudCk7IGNvbG9yOiB2YXIoLS1tM2QtZGFuZ2VyKTsgfVxuLm90X19zdGF0ZS0tcnVuIHsgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTsgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpOyB9XG4ub3RfX3BvcCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiBjYWxjKDEwMCUgKyA4cHgpOyBsZWZ0OiAwOyB6LWluZGV4OiA4OyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDEycHg7IHdpZHRoOiAzNjBweDsgbWF4LXdpZHRoOiBjYWxjKDEwMHZ3IC0gMzJweCk7IHBhZGRpbmc6IDE0cHg7XG4gIGJvcmRlci1yYWRpdXM6IDIycHg7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlKTsgY29sb3I6IHZhcigtLW0zZC10ZXh0KTsgYm94LXNoYWRvdzogdmFyKC0tbTNkLXNoYWRvdy1mbG9hdCksIGluc2V0IDAgMCAwIDFweCB2YXIoLS1tM2QtYm9yZGVyLXN0cm9uZyk7XG59XG5AbWVkaWEgKG1heC13aWR0aDogNTk5cHgpIHtcbiAgLm90X19wb3AgeyBwb3NpdGlvbjogZml4ZWQ7IHRvcDogYXV0bzsgcmlnaHQ6IDhweDsgYm90dG9tOiA4cHg7IGxlZnQ6IDhweDsgd2lkdGg6IGF1dG87IG1heC13aWR0aDogbm9uZTsgbWF4LWhlaWdodDogNzB2aDsgb3ZlcmZsb3cteTogYXV0bzsgei1pbmRleDogMzA7IH1cbn1cblxuLyogVGhlIG51bWJlcnMgZXZlcnkgdGlsZSBzaG93cy4gKi9cbi5vdF9fdmFsdWUgeyBmb250LWZhbWlseTogdmFyKC0tbTNkLWZvbnQtcm91bmRlZCk7IGZvbnQtc2l6ZTogMzBweDsgZm9udC13ZWlnaHQ6IDYwMDsgbGluZS1oZWlnaHQ6IDEuMTsgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtczsgfVxuLm90X192YWx1ZSBzbWFsbCB7IG1hcmdpbi1sZWZ0OiA2cHg7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTRweDsgZm9udC13ZWlnaHQ6IDUwMDsgfVxuLm90X19zdWIgeyBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpOyBmb250LXNpemU6IDEyLjVweDsgfVxuLm90X19iYXIgeyBkaXNwbGF5OiBibG9jazsgaGVpZ2h0OiA0cHg7IGJvcmRlci1yYWRpdXM6IDk5OXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtcmluZy10cmFjayk7IG92ZXJmbG93OiBoaWRkZW47IH1cbi5vdF9fYmFyIGkgeyBkaXNwbGF5OiBibG9jazsgaGVpZ2h0OiAxMDAlOyBib3JkZXItcmFkaXVzOiBpbmhlcml0OyBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtYWNjZW50KTsgdHJhbnNpdGlvbjogd2lkdGggdmFyKC0tbTNkLWR1cmF0aW9uLWJhc2UsIDAuMnMpIHZhcigtLW0zZC1lYXNlLCBlYXNlKTsgfVxuXG4vKiBSb3dzIGluc2lkZSBhIHBvcG92ZXIgb3IgZGlhbG9nLiAqL1xuLm90X19yb3dzIHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgfVxuLm90X19yb3cgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDEwcHg7IHdpZHRoOiAxMDAlOyBwYWRkaW5nOiA5cHggMTBweDsgYm9yZGVyLXJhZGl1czogMTJweDsgY29sb3I6IHZhcigtLW0zZC10ZXh0KSAhaW1wb3J0YW50OyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA1MDA7IHRleHQtYWxpZ246IGxlZnQ7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxuYS5vdF9fcm93LCBidXR0b24ub3RfX3JvdyB7IGN1cnNvcjogcG9pbnRlcjsgfVxuYS5vdF9fcm93OmhvdmVyLCBidXR0b24ub3RfX3Jvdzpob3Zlcjpub3QoOmRpc2FibGVkKSB7IGJhY2tncm91bmQ6IHZhcigtLW0zZC1ob3ZlciwgdmFyKC0tbTNkLWZpbGwpKTsgfVxuYnV0dG9uLm90X19yb3c6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjQ1OyBjdXJzb3I6IGRlZmF1bHQ7IH1cbi5vdF9fcm93IC5mcmFtZS1pY29uIHsgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTsgfVxuLm90X19yb3cgPiA6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKSB7IG1hcmdpbi1sZWZ0OiBhdXRvOyB9XG4ub3RfX25vdGUgeyBtYXJnaW46IDA7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7IGZvbnQtc2l6ZTogMTIuNXB4OyB9XG4ub3RfX2xvY2sgeyBtYXJnaW46IDA7IGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpOyBmb250LXNpemU6IDEyLjVweDsgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvb3ZlcnZpZXcvdGlsZXMvVGlsZVNoZWxsLnZ1ZSJ9