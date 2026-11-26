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
import ControlMixin from "/src/mixins/control.ts";
import MacrosMixin, {} from "/src/mixins/macros.ts";
import { macroFields, macroCommand } from "/src/services/macros/values.ts";
let MacroRunMixin = class extends Mixins(ControlMixin, MacrosMixin) {
  selected = null;
  values = {};
  formTarget = "";
  formGcode = "";
  formError = "";
  gcodeOf(name) {
    const settings = this.$store.state.printer.printer.configfile?.settings ?? {};
    const entry = Object.entries(settings).find(([key]) => key.toUpperCase() === `GCODE_MACRO ${name.toUpperCase()}`);
    return String(entry?.[1]?.gcode ?? "");
  }
  get fields() {
    return macroFields(this.formGcode);
  }
  get preview() {
    return this.selected ? macroCommand(this.selected.name, this.fields, this.values) : null;
  }
  async submitMacro() {
    this.formError = "";
    const current = this.arrangedMacros.find((m) => m.name === this.selected?.name);
    if (!current || this.panelTarget !== this.formTarget || this.gcodeOf(current.name) !== this.formGcode) {
      this.formError = "The printer or command changed. Open the values again.";
      return;
    }
    if (!this.controlReady || current.disabledWhilePrinting && this.busy) {
      this.formError = "Not sent. Wait until you can control this printer and the command is available.";
      return;
    }
    const command = this.preview;
    if (!command) {
      this.formError = "Enter each required value. Use one number or word without spaces, quotes or command separators.";
      return;
    }
    if (await this.sendTypedGcode(command)) this.selected = null;
  }
  tooltipOf(macro) {
    return [macro.name, macro.description, macro.internal].filter(Boolean).join(" · ");
  }
  run(macro) {
    if (!this.controlReady || macro.disabledWhilePrinting && this.busy) return;
    this.commandRefusal = "";
    this.formError = "";
    if (!macro.params.length) {
      this.sendTypedGcode(macro.name);
      return;
    }
    this.selected = macro;
    this.formTarget = this.panelTarget;
    this.formGcode = this.gcodeOf(macro.name);
    this.values = Object.fromEntries(this.fields.map((f) => [f.name, ""]));
    this.$nextTick(() => this.$el.querySelector(".macros__field textarea")?.focus());
  }
};
MacroRunMixin = __decorateClass([
  Component
], MacroRunMixin);
export {
  MacroRunMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hY3JvLXJ1bi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgQ29udHJvbE1peGluIGZyb20gJ0AvbWl4aW5zL2NvbnRyb2wnXG5pbXBvcnQgTWFjcm9zTWl4aW4sIHsgdHlwZSBTaG93bk1hY3JvIH0gZnJvbSAnQC9taXhpbnMvbWFjcm9zJ1xuaW1wb3J0IHsgbWFjcm9GaWVsZHMsIG1hY3JvQ29tbWFuZCwgdHlwZSBNYWNyb0ZpZWxkIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYWNyb3MvdmFsdWVzJ1xuXG4vKipcbiAqIFJ1bm5pbmcgYSBtYWNybyBmcm9tIGEgcGFuZWw6IG9uZSB0aGF0IG5lZWRzIG5vIHZhbHVlIHJ1bnMgYXQgb25jZTsgb25lXG4gKiB0aGF0IGFza3MgZm9yIHZhbHVlcyBvcGVucyBhIHNtYWxsIGZvcm0gdGhhdCBzZW5kcyBvbmx5IHdoYXQgaXQgc2hvd3MuXG4gKiBTaGFyZWQgYnkgQ29udHJvbCdzIE1hY3JvcyBwYW5lbCBhbmQgdGhlIE92ZXJ2aWV3IE1hY3JvcyB0aWxlLCBzbyBhIG1hY3JvXG4gKiBpcyBydW4gKGFuZCByZWZ1c2VkKSB0aGUgc2FtZSB3YXkgaW4gYm90aC5cbiAqL1xuQENvbXBvbmVudFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFjcm9SdW5NaXhpbiBleHRlbmRzIE1peGlucyhDb250cm9sTWl4aW4sIE1hY3Jvc01peGluKSB7XG4gIHNlbGVjdGVkOiBTaG93bk1hY3JvIHwgbnVsbCA9IG51bGxcbiAgdmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbiAgZm9ybVRhcmdldCA9ICcnXG4gIGZvcm1HY29kZSA9ICcnXG4gIGZvcm1FcnJvciA9ICcnXG5cbiAgZ2NvZGVPZiAobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlci5jb25maWdmaWxlPy5zZXR0aW5ncyA/PyB7fVxuICAgIGNvbnN0IGVudHJ5ID0gT2JqZWN0LmVudHJpZXMoc2V0dGluZ3MpLmZpbmQoKFtrZXldKSA9PiBrZXkudG9VcHBlckNhc2UoKSA9PT0gYEdDT0RFX01BQ1JPICR7bmFtZS50b1VwcGVyQ2FzZSgpfWApXG4gICAgcmV0dXJuIFN0cmluZygoZW50cnk/LlsxXSBhcyB7IGdjb2RlPzogc3RyaW5nIH0gfCB1bmRlZmluZWQpPy5nY29kZSA/PyAnJylcbiAgfVxuXG4gIGdldCBmaWVsZHMgKCk6IE1hY3JvRmllbGRbXSB7IHJldHVybiBtYWNyb0ZpZWxkcyh0aGlzLmZvcm1HY29kZSkgfVxuICBnZXQgcHJldmlldyAoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLnNlbGVjdGVkID8gbWFjcm9Db21tYW5kKHRoaXMuc2VsZWN0ZWQubmFtZSwgdGhpcy5maWVsZHMsIHRoaXMudmFsdWVzKSA6IG51bGwgfVxuXG4gIGFzeW5jIHN1Ym1pdE1hY3JvICgpIHtcbiAgICB0aGlzLmZvcm1FcnJvciA9ICcnXG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuYXJyYW5nZWRNYWNyb3MuZmluZChtID0+IG0ubmFtZSA9PT0gdGhpcy5zZWxlY3RlZD8ubmFtZSlcbiAgICBpZiAoIWN1cnJlbnQgfHwgdGhpcy5wYW5lbFRhcmdldCAhPT0gdGhpcy5mb3JtVGFyZ2V0IHx8IHRoaXMuZ2NvZGVPZihjdXJyZW50Lm5hbWUpICE9PSB0aGlzLmZvcm1HY29kZSkge1xuICAgICAgdGhpcy5mb3JtRXJyb3IgPSAnVGhlIHByaW50ZXIgb3IgY29tbWFuZCBjaGFuZ2VkLiBPcGVuIHRoZSB2YWx1ZXMgYWdhaW4uJzsgcmV0dXJuXG4gICAgfVxuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgKGN1cnJlbnQuZGlzYWJsZWRXaGlsZVByaW50aW5nICYmIHRoaXMuYnVzeSkpIHtcbiAgICAgIHRoaXMuZm9ybUVycm9yID0gJ05vdCBzZW50LiBXYWl0IHVudGlsIHlvdSBjYW4gY29udHJvbCB0aGlzIHByaW50ZXIgYW5kIHRoZSBjb21tYW5kIGlzIGF2YWlsYWJsZS4nOyByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgY29tbWFuZCA9IHRoaXMucHJldmlld1xuICAgIGlmICghY29tbWFuZCkgeyB0aGlzLmZvcm1FcnJvciA9ICdFbnRlciBlYWNoIHJlcXVpcmVkIHZhbHVlLiBVc2Ugb25lIG51bWJlciBvciB3b3JkIHdpdGhvdXQgc3BhY2VzLCBxdW90ZXMgb3IgY29tbWFuZCBzZXBhcmF0b3JzLic7IHJldHVybiB9XG4gICAgaWYgKGF3YWl0IHRoaXMuc2VuZFR5cGVkR2NvZGUoY29tbWFuZCkpIHRoaXMuc2VsZWN0ZWQgPSBudWxsXG4gIH1cblxuICB0b29sdGlwT2YgKG1hY3JvOiBTaG93bk1hY3JvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW21hY3JvLm5hbWUsIG1hY3JvLmRlc2NyaXB0aW9uLCBtYWNyby5pbnRlcm5hbF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyDCtyAnKVxuICB9XG5cbiAgcnVuIChtYWNybzogU2hvd25NYWNybykge1xuICAgIGlmICghdGhpcy5jb250cm9sUmVhZHkgfHwgKG1hY3JvLmRpc2FibGVkV2hpbGVQcmludGluZyAmJiB0aGlzLmJ1c3kpKSByZXR1cm5cbiAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gJyc7IHRoaXMuZm9ybUVycm9yID0gJydcbiAgICBpZiAoIW1hY3JvLnBhcmFtcy5sZW5ndGgpIHsgdGhpcy5zZW5kVHlwZWRHY29kZShtYWNyby5uYW1lKTsgcmV0dXJuIH1cbiAgICB0aGlzLnNlbGVjdGVkID0gbWFjcm9cbiAgICB0aGlzLmZvcm1UYXJnZXQgPSB0aGlzLnBhbmVsVGFyZ2V0XG4gICAgdGhpcy5mb3JtR2NvZGUgPSB0aGlzLmdjb2RlT2YobWFjcm8ubmFtZSlcbiAgICB0aGlzLnZhbHVlcyA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmZpZWxkcy5tYXAoZiA9PiBbZi5uYW1lLCAnJ10pKVxuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+ICh0aGlzLiRlbC5xdWVyeVNlbGVjdG9yKCcubWFjcm9zX19maWVsZCB0ZXh0YXJlYScpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsKT8uZm9jdXMoKSlcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLGNBQWM7QUFDbEMsT0FBTyxrQkFBa0I7QUFDekIsT0FBTyxxQkFBc0M7QUFDN0MsU0FBUyxhQUFhLG9CQUFxQztBQVMzRCxJQUFxQixnQkFBckIsY0FBMkMsT0FBTyxjQUFjLFdBQVcsRUFBRTtBQUFBLEVBQzNFLFdBQThCO0FBQUEsRUFDOUIsU0FBaUMsQ0FBQztBQUFBLEVBQ2xDLGFBQWE7QUFBQSxFQUNiLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUVaLFFBQVMsTUFBc0I7QUFDN0IsVUFBTSxXQUFXLEtBQUssT0FBTyxNQUFNLFFBQVEsUUFBUSxZQUFZLFlBQVksQ0FBQztBQUM1RSxVQUFNLFFBQVEsT0FBTyxRQUFRLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxZQUFZLE1BQU0sZUFBZSxLQUFLLFlBQVksQ0FBQyxFQUFFO0FBQ2hILFdBQU8sT0FBUSxRQUFRLENBQUMsR0FBc0MsU0FBUyxFQUFFO0FBQUEsRUFDM0U7QUFBQSxFQUVBLElBQUksU0FBd0I7QUFBRSxXQUFPLFlBQVksS0FBSyxTQUFTO0FBQUEsRUFBRTtBQUFBLEVBQ2pFLElBQUksVUFBMEI7QUFBRSxXQUFPLEtBQUssV0FBVyxhQUFhLEtBQUssU0FBUyxNQUFNLEtBQUssUUFBUSxLQUFLLE1BQU0sSUFBSTtBQUFBLEVBQUs7QUFBQSxFQUV6SCxNQUFNLGNBQWU7QUFDbkIsU0FBSyxZQUFZO0FBQ2pCLFVBQU0sVUFBVSxLQUFLLGVBQWUsS0FBSyxPQUFLLEVBQUUsU0FBUyxLQUFLLFVBQVUsSUFBSTtBQUM1RSxRQUFJLENBQUMsV0FBVyxLQUFLLGdCQUFnQixLQUFLLGNBQWMsS0FBSyxRQUFRLFFBQVEsSUFBSSxNQUFNLEtBQUssV0FBVztBQUNyRyxXQUFLLFlBQVk7QUFBMEQ7QUFBQSxJQUM3RTtBQUNBLFFBQUksQ0FBQyxLQUFLLGdCQUFpQixRQUFRLHlCQUF5QixLQUFLLE1BQU87QUFDdEUsV0FBSyxZQUFZO0FBQW1GO0FBQUEsSUFDdEc7QUFDQSxVQUFNLFVBQVUsS0FBSztBQUNyQixRQUFJLENBQUMsU0FBUztBQUFFLFdBQUssWUFBWTtBQUFtRztBQUFBLElBQU87QUFDM0ksUUFBSSxNQUFNLEtBQUssZUFBZSxPQUFPLEVBQUcsTUFBSyxXQUFXO0FBQUEsRUFDMUQ7QUFBQSxFQUVBLFVBQVcsT0FBMkI7QUFDcEMsV0FBTyxDQUFDLE1BQU0sTUFBTSxNQUFNLGFBQWEsTUFBTSxRQUFRLEVBQUUsT0FBTyxPQUFPLEVBQUUsS0FBSyxLQUFLO0FBQUEsRUFDbkY7QUFBQSxFQUVBLElBQUssT0FBbUI7QUFDdEIsUUFBSSxDQUFDLEtBQUssZ0JBQWlCLE1BQU0seUJBQXlCLEtBQUssS0FBTztBQUN0RSxTQUFLLGlCQUFpQjtBQUFJLFNBQUssWUFBWTtBQUMzQyxRQUFJLENBQUMsTUFBTSxPQUFPLFFBQVE7QUFBRSxXQUFLLGVBQWUsTUFBTSxJQUFJO0FBQUc7QUFBQSxJQUFPO0FBQ3BFLFNBQUssV0FBVztBQUNoQixTQUFLLGFBQWEsS0FBSztBQUN2QixTQUFLLFlBQVksS0FBSyxRQUFRLE1BQU0sSUFBSTtBQUN4QyxTQUFLLFNBQVMsT0FBTyxZQUFZLEtBQUssT0FBTyxJQUFJLE9BQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDbkUsU0FBSyxVQUFVLE1BQU8sS0FBSyxJQUFJLGNBQWMseUJBQXlCLEdBQWtDLE1BQU0sQ0FBQztBQUFBLEVBQ2pIO0FBQ0Y7QUE1Q3FCLGdCQUFyQjtBQUFBLEVBREM7QUFBQSxHQUNvQjtBQUFyQjtBQUFBLEVBQU8saUJBWlA7QUFBQTsiLCJuYW1lcyI6W119