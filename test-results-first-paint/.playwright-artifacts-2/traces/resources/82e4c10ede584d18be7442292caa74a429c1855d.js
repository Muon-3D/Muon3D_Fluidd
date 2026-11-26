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
import { Component, Prop, VModel, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import Sortable from "/.vite-e2e/4291/deps/sortablejs.js?v=9b9fafc7";
const instanceKey = Symbol("instanceKey");
const isTargetHtmlElement = (element) => instanceKey in element;
let AppDraggable = class extends Vue {
  items;
  options;
  target;
  onOptions(value) {
    if (this.sortable) {
      for (const prop in value) {
        const propAsOptionsKey = prop;
        this.sortable.option(propAsOptionsKey, value[propAsOptionsKey]);
      }
    }
  }
  onTarget() {
    this.dettach();
    this.attach();
  }
  sortable = null;
  handleStart(event) {
    this.$emit("start", event);
  }
  handleAdd(event) {
    const { oldIndex, newIndex, from } = event;
    if (oldIndex === void 0 || newIndex === void 0 || !isTargetHtmlElement(from) || from[instanceKey] === null) {
      return;
    }
    const fromInstance = from[instanceKey];
    const items = [...this.items];
    items.splice(newIndex, 0, fromInstance.items[oldIndex]);
    this.items = items;
    this.$emit("add", event);
  }
  handleRemove(event) {
    const { oldIndex } = event;
    if (oldIndex === void 0) {
      return;
    }
    const items = [...this.items];
    items.splice(oldIndex, 1);
    this.items = items;
    this.$emit("remove", event);
  }
  handleUpdate(event) {
    const { oldIndex, newIndex } = event;
    if (oldIndex === void 0 || newIndex === void 0) {
      return;
    }
    const items = [...this.items];
    const movedItem = items.splice(oldIndex, 1)[0];
    items.splice(newIndex, 0, movedItem);
    this.items = items;
    this.$emit("update", event);
  }
  handleEnd(event) {
    this.$emit("end", event);
  }
  attach() {
    const targetElement = this.target && this.$el.querySelector(this.target) || this.$el;
    targetElement[instanceKey] = this;
    const options = {
      ...this.options,
      onStart: this.handleStart,
      onAdd: this.handleAdd,
      onRemove: this.handleRemove,
      onUpdate: this.handleUpdate,
      onEnd: this.handleEnd
    };
    this.sortable = Sortable.create(targetElement, options);
  }
  dettach() {
    const targetElement = this.sortable?.el;
    if (targetElement && isTargetHtmlElement(targetElement)) {
      targetElement[instanceKey] = null;
    }
    this.sortable?.destroy();
    this.sortable = null;
  }
  mounted() {
    this.attach();
  }
  unmounted() {
    this.dettach();
  }
};
__decorateClass([
  VModel({ type: Array, default: () => [] })
], AppDraggable.prototype, "items", 2);
__decorateClass([
  Prop({ type: Object })
], AppDraggable.prototype, "options", 2);
__decorateClass([
  Prop({ type: String })
], AppDraggable.prototype, "target", 2);
__decorateClass([
  Watch("options")
], AppDraggable.prototype, "onOptions", 1);
__decorateClass([
  Watch("target")
], AppDraggable.prototype, "onTarget", 1);
AppDraggable = __decorateClass([
  Component({})
], AppDraggable);
const _sfc_main = AppDraggable;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_vm._t("default")], 2);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppDraggable.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQU9BO0FBQ0E7QUFFQTtBQU1BO0FBR0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUVBLFFBQ0EsdUJBQ0EsdUJBQ0EsOEJBQ0EsNEJBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUVBO0FBRUE7QUFFQTtBQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUVBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFFQTtBQUVBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUEsUUFDQSx1QkFDQSxxQkFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBRUE7QUFDQTtBQUVBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSwwQkFDQSxlQUNBLHVDQUNBO0FBRUE7QUFFQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXBJQTtBQUFBLEVBREE7QUFBQSxHQURBLGFBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLGFBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLGFBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLGFBV0E7QUFXQTtBQUFBLEVBREE7QUFBQSxHQXJCQSxhQXNCQTtBQXRCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHBEcmFnZ2FibGUudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdj5cbiAgICA8c2xvdCAvPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZNb2RlbCwgVnVlLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU29ydGFibGUgZnJvbSAnc29ydGFibGVqcydcblxuY29uc3QgaW5zdGFuY2VLZXkgPSBTeW1ib2woJ2luc3RhbmNlS2V5JylcblxudHlwZSBUYXJnZXRIdG1sRWxlbWVudCA9IEhUTUxFbGVtZW50ICYge1xuICBbaW5zdGFuY2VLZXldOiBBcHBEcmFnZ2FibGUgfCBudWxsXG59XG5cbmNvbnN0IGlzVGFyZ2V0SHRtbEVsZW1lbnQgPSAoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBlbGVtZW50IGlzIFRhcmdldEh0bWxFbGVtZW50ID0+IGluc3RhbmNlS2V5IGluIGVsZW1lbnRcblxuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcERyYWdnYWJsZSBleHRlbmRzIFZ1ZSB7XG4gIEBWTW9kZWwoeyB0eXBlOiBBcnJheSwgZGVmYXVsdDogKCkgPT4gW10gfSlcbiAgICBpdGVtcyE6IHVua25vd25bXVxuXG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0IH0pXG4gIHJlYWRvbmx5IG9wdGlvbnM/OiBTb3J0YWJsZS5PcHRpb25zXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgdGFyZ2V0Pzogc3RyaW5nXG5cbiAgQFdhdGNoKCdvcHRpb25zJylcbiAgb25PcHRpb25zICh2YWx1ZTogU29ydGFibGUuT3B0aW9ucykge1xuICAgIGlmICh0aGlzLnNvcnRhYmxlKSB7XG4gICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdmFsdWUpIHtcbiAgICAgICAgY29uc3QgcHJvcEFzT3B0aW9uc0tleSA9IHByb3AgYXMga2V5b2YgU29ydGFibGUuT3B0aW9uc1xuXG4gICAgICAgIHRoaXMuc29ydGFibGUub3B0aW9uKHByb3BBc09wdGlvbnNLZXksIHZhbHVlW3Byb3BBc09wdGlvbnNLZXldKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIEBXYXRjaCgndGFyZ2V0JylcbiAgb25UYXJnZXQgKCkge1xuICAgIHRoaXMuZGV0dGFjaCgpXG4gICAgdGhpcy5hdHRhY2goKVxuICB9XG5cbiAgc29ydGFibGU6IFNvcnRhYmxlIHwgbnVsbCA9IG51bGxcblxuICBoYW5kbGVTdGFydCAoZXZlbnQ6IFNvcnRhYmxlLlNvcnRhYmxlRXZlbnQpIHtcbiAgICB0aGlzLiRlbWl0KCdzdGFydCcsIGV2ZW50KVxuICB9XG5cbiAgaGFuZGxlQWRkIChldmVudDogU29ydGFibGUuU29ydGFibGVFdmVudCkge1xuICAgIGNvbnN0IHsgb2xkSW5kZXgsIG5ld0luZGV4LCBmcm9tIH0gPSBldmVudFxuXG4gICAgaWYgKFxuICAgICAgb2xkSW5kZXggPT09IHVuZGVmaW5lZCB8fFxuICAgICAgbmV3SW5kZXggPT09IHVuZGVmaW5lZCB8fFxuICAgICAgIWlzVGFyZ2V0SHRtbEVsZW1lbnQoZnJvbSkgfHxcbiAgICAgIGZyb21baW5zdGFuY2VLZXldID09PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBmcm9tSW5zdGFuY2UgPSBmcm9tW2luc3RhbmNlS2V5XVxuXG4gICAgY29uc3QgaXRlbXMgPSBbLi4udGhpcy5pdGVtc11cblxuICAgIGl0ZW1zLnNwbGljZShuZXdJbmRleCwgMCwgZnJvbUluc3RhbmNlLml0ZW1zW29sZEluZGV4XSlcblxuICAgIHRoaXMuaXRlbXMgPSBpdGVtc1xuXG4gICAgdGhpcy4kZW1pdCgnYWRkJywgZXZlbnQpXG4gIH1cblxuICBoYW5kbGVSZW1vdmUgKGV2ZW50OiBTb3J0YWJsZS5Tb3J0YWJsZUV2ZW50KSB7XG4gICAgY29uc3QgeyBvbGRJbmRleCB9ID0gZXZlbnRcblxuICAgIGlmIChvbGRJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBpdGVtcyA9IFsuLi50aGlzLml0ZW1zXVxuXG4gICAgaXRlbXMuc3BsaWNlKG9sZEluZGV4LCAxKVxuXG4gICAgdGhpcy5pdGVtcyA9IGl0ZW1zXG5cbiAgICB0aGlzLiRlbWl0KCdyZW1vdmUnLCBldmVudClcbiAgfVxuXG4gIGhhbmRsZVVwZGF0ZSAoZXZlbnQ6IFNvcnRhYmxlLlNvcnRhYmxlRXZlbnQpIHtcbiAgICBjb25zdCB7IG9sZEluZGV4LCBuZXdJbmRleCB9ID0gZXZlbnRcblxuICAgIGlmIChcbiAgICAgIG9sZEluZGV4ID09PSB1bmRlZmluZWQgfHxcbiAgICAgIG5ld0luZGV4ID09PSB1bmRlZmluZWRcbiAgICApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGl0ZW1zID0gWy4uLnRoaXMuaXRlbXNdXG5cbiAgICBjb25zdCBtb3ZlZEl0ZW0gPSBpdGVtcy5zcGxpY2Uob2xkSW5kZXgsIDEpWzBdXG4gICAgaXRlbXMuc3BsaWNlKG5ld0luZGV4LCAwLCBtb3ZlZEl0ZW0pXG5cbiAgICB0aGlzLml0ZW1zID0gaXRlbXNcblxuICAgIHRoaXMuJGVtaXQoJ3VwZGF0ZScsIGV2ZW50KVxuICB9XG5cbiAgaGFuZGxlRW5kIChldmVudDogU29ydGFibGUuU29ydGFibGVFdmVudCkge1xuICAgIHRoaXMuJGVtaXQoJ2VuZCcsIGV2ZW50KVxuICB9XG5cbiAgYXR0YWNoICgpIHtcbiAgICBjb25zdCB0YXJnZXRFbGVtZW50ID0gKFxuICAgICAgdGhpcy50YXJnZXQgJiZcbiAgICAgIHRoaXMuJGVsLnF1ZXJ5U2VsZWN0b3I8VGFyZ2V0SHRtbEVsZW1lbnQ+KHRoaXMudGFyZ2V0KVxuICAgICkgfHwgdGhpcy4kZWwgYXMgVGFyZ2V0SHRtbEVsZW1lbnRcblxuICAgIHRhcmdldEVsZW1lbnRbaW5zdGFuY2VLZXldID0gdGhpc1xuXG4gICAgY29uc3Qgb3B0aW9uczogU29ydGFibGUuT3B0aW9ucyA9IHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIG9uU3RhcnQ6IHRoaXMuaGFuZGxlU3RhcnQsXG4gICAgICBvbkFkZDogdGhpcy5oYW5kbGVBZGQsXG4gICAgICBvblJlbW92ZTogdGhpcy5oYW5kbGVSZW1vdmUsXG4gICAgICBvblVwZGF0ZTogdGhpcy5oYW5kbGVVcGRhdGUsXG4gICAgICBvbkVuZDogdGhpcy5oYW5kbGVFbmRcbiAgICB9XG5cbiAgICB0aGlzLnNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKHRhcmdldEVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBkZXR0YWNoICgpIHtcbiAgICBjb25zdCB0YXJnZXRFbGVtZW50ID0gdGhpcy5zb3J0YWJsZT8uZWxcblxuICAgIGlmICh0YXJnZXRFbGVtZW50ICYmIGlzVGFyZ2V0SHRtbEVsZW1lbnQodGFyZ2V0RWxlbWVudCkpIHtcbiAgICAgIHRhcmdldEVsZW1lbnRbaW5zdGFuY2VLZXldID0gbnVsbFxuICAgIH1cblxuICAgIHRoaXMuc29ydGFibGU/LmRlc3Ryb3koKVxuICAgIHRoaXMuc29ydGFibGUgPSBudWxsXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLmF0dGFjaCgpXG4gIH1cblxuICB1bm1vdW50ZWQgKCkge1xuICAgIHRoaXMuZGV0dGFjaCgpXG4gIH1cbn1cbjwvc2NyaXB0PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvQXBwRHJhZ2dhYmxlLnZ1ZSJ9