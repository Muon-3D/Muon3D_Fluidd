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
import { Component, Vue, Prop } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { glassIconNodes } from "/src/util/glass-icon-nodes.ts";
let AppGlassIcon = class extends Vue {
  name;
  render(h) {
    return h("svg", {
      class: "app-glass-icon",
      attrs: {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.75",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true"
      }
    }, (glassIconNodes[this.name] ?? []).map(([tag, attrs]) => h(tag, { attrs })));
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], AppGlassIcon.prototype, "name", 2);
AppGlassIcon = __decorateClass([
  Component({})
], AppGlassIcon);
const _sfc_main = AppGlassIcon;
const _sfc_render = null;
const _sfc_staticRenderFns = null;
import "/src/components/ui/AppGlassIcon.vue?vue&type=style&index=0&scoped=e4f3578f&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "e4f3578f",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppGlassIcon.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUVBO0FBQ0E7QUFNQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQWhCQTtBQUFBLEVBREE7QUFBQSxHQURBLGFBRUE7QUFGQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJBcHBHbGFzc0ljb24udnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgdHlwZSB7IENyZWF0ZUVsZW1lbnQsIFZOb2RlIH0gZnJvbSAndnVlJ1xuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUsIFByb3AgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgZ2xhc3NJY29uTm9kZXMgfSBmcm9tICdAL3V0aWwvZ2xhc3MtaWNvbi1ub2RlcydcblxuLy8gQSBnbGFzcy1zdHlsZSBsaW5lIGljb246IGEgTHVjaWRlIGRyYXdpbmcgc3Ryb2tlZCBsaWtlIGFuIFNGIFN5bWJvbC5cbi8vIFZ1ZXRpZnkgcmVuZGVycyBpdCBpbiBwbGFjZSBvZiB0aGUgTWF0ZXJpYWwgaWNvbiBvZiB0aGUgc2FtZSBuYW1lIChzZWVcbi8vIHNyYy91dGlsL2dsYXNzLWljb25zLnRzKSwgc28gaXQgdGFrZXMgdGhlIGljb24ncyBzaXplIGFuZCBjb2xvdXIuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwR2xhc3NJY29uIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pXG4gIHJlYWRvbmx5IG5hbWUhOiBzdHJpbmdcblxuICByZW5kZXIgKGg6IENyZWF0ZUVsZW1lbnQpOiBWTm9kZSB7XG4gICAgcmV0dXJuIGgoJ3N2ZycsIHtcbiAgICAgIGNsYXNzOiAnYXBwLWdsYXNzLWljb24nLFxuICAgICAgYXR0cnM6IHtcbiAgICAgICAgdmlld0JveDogJzAgMCAyNCAyNCcsXG4gICAgICAgIGZpbGw6ICdub25lJyxcbiAgICAgICAgc3Ryb2tlOiAnY3VycmVudENvbG9yJyxcbiAgICAgICAgJ3N0cm9rZS13aWR0aCc6ICcxLjc1JyxcbiAgICAgICAgJ3N0cm9rZS1saW5lY2FwJzogJ3JvdW5kJyxcbiAgICAgICAgJ3N0cm9rZS1saW5lam9pbic6ICdyb3VuZCcsXG4gICAgICAgICdhcmlhLWhpZGRlbic6ICd0cnVlJ1xuICAgICAgfVxuICAgIH0sIChnbGFzc0ljb25Ob2Rlc1t0aGlzLm5hbWVdID8/IFtdKS5tYXAoKFt0YWcsIGF0dHJzXSkgPT4gaCh0YWcsIHsgYXR0cnMgfSkpKVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIHNjb3BlZD5cbiAgLyogU2l6ZWQgYnkgdGhlIGljb24ncyBmb250IHNpemUsIGFzIGEgZm9udCBpY29uIGlzOyBhbiBleHBsaWNpdCBzaXplXG4gICAgIChzbWFsbCwgbGFyZ2UsIHNpemU9KSBhcnJpdmVzIGFzIGFuIGlubGluZSBzdHlsZSBhbmQgd2lucy4gKi9cbiAgLmFwcC1nbGFzcy1pY29uIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICB3aWR0aDogMWVtO1xuICAgIGhlaWdodDogMWVtO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvdWkvQXBwR2xhc3NJY29uLnZ1ZSJ9