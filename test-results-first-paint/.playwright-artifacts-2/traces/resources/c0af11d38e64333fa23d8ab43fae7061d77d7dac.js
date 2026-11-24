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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import ControlMixin from "/src/mixins/control.ts";
import { lightsStore } from "/src/services/control/lights-store.ts";
import {
  DEFAULT_LIGHT,
  effectFor
} from "/src/services/control/lights.ts";
let LightsMixin = class extends Mixins(ControlMixin) {
  get lights() {
    return lightsStore;
  }
  get caps() {
    return lightsStore.capsFor(this.printerObjects);
  }
  get printerObjects() {
    return this.$store.state.printer.printer;
  }
  /** The LED_MODE macro's variables: what a report changes. */
  get ledReport() {
    return this.printerObjects["gcode_macro LED_MODE"];
  }
  /** The lights, or null on a printer with none. */
  get light() {
    return lightsStore.current(this.printerObjects);
  }
  /** What to draw while the printer has not said: the defaults, dimmed by `known`. */
  get shown() {
    return this.light ?? DEFAULT_LIGHT;
  }
  get known() {
    return this.light !== null;
  }
  get effect() {
    return effectFor(this.caps, this.shown.effect);
  }
  /** Colours that count for this effect: none for Rainbow and Status, one for Solid... */
  get usedColours() {
    return this.shown.colors.slice(0, this.effect.colours);
  }
  get canSet() {
    return this.controlReady && this.known;
  }
  get busyPrinting() {
    return this.printerPrinting || this.printerPaused;
  }
  get presetId() {
    return lightsStore.matching(this.light);
  }
  /** Short name of what is showing: the preset's, or the effect's. */
  get lightName() {
    if (!this.light) return "";
    if (!this.light.on) return "Off";
    const preset = lightsStore.presets.find((p) => p.id === this.presetId);
    return preset ? preset.name : this.effect.label;
  }
  change(patch) {
    if (!this.canSet) return;
    lightsStore.set(this.printerObjects, patch);
  }
  toggleOn() {
    if (!this.canSet) return;
    lightsStore.setOn(this.printerObjects, !this.shown.on);
  }
  pick(preset) {
    if (!this.canSet) return;
    lightsStore.applyPreset(this.printerObjects, preset);
  }
  /** The next preset in the list, for a tap on the small widget. */
  nextPreset() {
    const list = lightsStore.presets;
    if (!this.canSet || !list.length) return;
    const at = list.findIndex((p) => p.id === this.presetId);
    lightsStore.applyPreset(this.printerObjects, list[(at + 1) % list.length]);
  }
  onReport() {
    lightsStore.observe(this.printerObjects);
  }
  onPrinter() {
    lightsStore.reset();
    lightsStore.ensureLibrary();
  }
  created() {
    lightsStore.ensureLibrary();
  }
};
__decorateClass([
  Watch("ledReport", { deep: true, immediate: true })
], LightsMixin.prototype, "onReport", 1);
__decorateClass([
  Watch("commandTarget")
], LightsMixin.prototype, "onPrinter", 1);
LightsMixin = __decorateClass([
  Component
], LightsMixin);
export {
  LightsMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpZ2h0cy1taXhpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IENvbnRyb2xNaXhpbiBmcm9tICdAL21peGlucy9jb250cm9sJ1xuaW1wb3J0IHsgbGlnaHRzU3RvcmUsIHR5cGUgTGlnaHRzU3RvcmUgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvbGlnaHRzLXN0b3JlJ1xuaW1wb3J0IHtcbiAgREVGQVVMVF9MSUdIVCxcbiAgZWZmZWN0Rm9yLFxuICB0eXBlIEVmZmVjdEluZm8sXG4gIHR5cGUgTGlnaHRQcmVzZXQsXG4gIHR5cGUgTGlnaHRTdGF0ZSxcbiAgdHlwZSBMaWdodHNDYXBhYmlsaXRpZXNcbn0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL2xpZ2h0cydcblxuLyoqXG4gKiBXaGF0IHRoZSBMaWdodGluZyBzY3JlZW4gYW5kIGl0cyB3aWRnZXRzIHNoYXJlOiB0aGUgbGlnaHRzIGFzIHRoZSBwcmludGVyXG4gKiByZXBvcnRzIHRoZW0gKG9yIHRoZSBjaGFuZ2UganVzdCBtYWRlKSwgd2hhdCB0aGUgYmFja2VuZCBjYW4gZG8sIGFuZCB0aGVcbiAqIGNoYW5nZXMuIEFsbCBJL08gaXMgaW4gdGhlIHNlcnZpY2VzOyBub3RoaW5nIGhlcmUgdGFsa3MgdG8gdGhlIHByaW50ZXIuXG4gKi9cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpZ2h0c01peGluIGV4dGVuZHMgTWl4aW5zKENvbnRyb2xNaXhpbikge1xuICBnZXQgbGlnaHRzICgpOiBMaWdodHNTdG9yZSB7IHJldHVybiBsaWdodHNTdG9yZSB9XG5cbiAgZ2V0IGNhcHMgKCk6IExpZ2h0c0NhcGFiaWxpdGllcyB7IHJldHVybiBsaWdodHNTdG9yZS5jYXBzRm9yKHRoaXMucHJpbnRlck9iamVjdHMpIH1cblxuICBnZXQgcHJpbnRlck9iamVjdHMgKCk6IFJlY29yZDxzdHJpbmcsIGFueT4geyByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyIH1cblxuICAvKiogVGhlIExFRF9NT0RFIG1hY3JvJ3MgdmFyaWFibGVzOiB3aGF0IGEgcmVwb3J0IGNoYW5nZXMuICovXG4gIGdldCBsZWRSZXBvcnQgKCk6IHVua25vd24geyByZXR1cm4gdGhpcy5wcmludGVyT2JqZWN0c1snZ2NvZGVfbWFjcm8gTEVEX01PREUnXSB9XG5cbiAgLyoqIFRoZSBsaWdodHMsIG9yIG51bGwgb24gYSBwcmludGVyIHdpdGggbm9uZS4gKi9cbiAgZ2V0IGxpZ2h0ICgpOiBMaWdodFN0YXRlIHwgbnVsbCB7IHJldHVybiBsaWdodHNTdG9yZS5jdXJyZW50KHRoaXMucHJpbnRlck9iamVjdHMpIH1cblxuICAvKiogV2hhdCB0byBkcmF3IHdoaWxlIHRoZSBwcmludGVyIGhhcyBub3Qgc2FpZDogdGhlIGRlZmF1bHRzLCBkaW1tZWQgYnkgYGtub3duYC4gKi9cbiAgZ2V0IHNob3duICgpOiBMaWdodFN0YXRlIHsgcmV0dXJuIHRoaXMubGlnaHQgPz8gREVGQVVMVF9MSUdIVCB9XG5cbiAgZ2V0IGtub3duICgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMubGlnaHQgIT09IG51bGwgfVxuXG4gIGdldCBlZmZlY3QgKCk6IEVmZmVjdEluZm8geyByZXR1cm4gZWZmZWN0Rm9yKHRoaXMuY2FwcywgdGhpcy5zaG93bi5lZmZlY3QpIH1cblxuICAvKiogQ29sb3VycyB0aGF0IGNvdW50IGZvciB0aGlzIGVmZmVjdDogbm9uZSBmb3IgUmFpbmJvdyBhbmQgU3RhdHVzLCBvbmUgZm9yIFNvbGlkLi4uICovXG4gIGdldCB1c2VkQ29sb3VycyAoKTogc3RyaW5nW10geyByZXR1cm4gdGhpcy5zaG93bi5jb2xvcnMuc2xpY2UoMCwgdGhpcy5lZmZlY3QuY29sb3VycykgfVxuXG4gIGdldCBjYW5TZXQgKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5jb250cm9sUmVhZHkgJiYgdGhpcy5rbm93biB9XG5cbiAgZ2V0IGJ1c3lQcmludGluZyAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnByaW50ZXJQcmludGluZyB8fCB0aGlzLnByaW50ZXJQYXVzZWQgfVxuXG4gIGdldCBwcmVzZXRJZCAoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiBsaWdodHNTdG9yZS5tYXRjaGluZyh0aGlzLmxpZ2h0KSB9XG5cbiAgLyoqIFNob3J0IG5hbWUgb2Ygd2hhdCBpcyBzaG93aW5nOiB0aGUgcHJlc2V0J3MsIG9yIHRoZSBlZmZlY3Qncy4gKi9cbiAgZ2V0IGxpZ2h0TmFtZSAoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMubGlnaHQpIHJldHVybiAnJ1xuICAgIGlmICghdGhpcy5saWdodC5vbikgcmV0dXJuICdPZmYnXG4gICAgY29uc3QgcHJlc2V0ID0gbGlnaHRzU3RvcmUucHJlc2V0cy5maW5kKHAgPT4gcC5pZCA9PT0gdGhpcy5wcmVzZXRJZClcbiAgICByZXR1cm4gcHJlc2V0ID8gcHJlc2V0Lm5hbWUgOiB0aGlzLmVmZmVjdC5sYWJlbFxuICB9XG5cbiAgY2hhbmdlIChwYXRjaDogUGFydGlhbDxMaWdodFN0YXRlPikge1xuICAgIGlmICghdGhpcy5jYW5TZXQpIHJldHVyblxuICAgIGxpZ2h0c1N0b3JlLnNldCh0aGlzLnByaW50ZXJPYmplY3RzLCBwYXRjaClcbiAgfVxuXG4gIHRvZ2dsZU9uICgpIHtcbiAgICBpZiAoIXRoaXMuY2FuU2V0KSByZXR1cm5cbiAgICBsaWdodHNTdG9yZS5zZXRPbih0aGlzLnByaW50ZXJPYmplY3RzLCAhdGhpcy5zaG93bi5vbilcbiAgfVxuXG4gIHBpY2sgKHByZXNldDogTGlnaHRQcmVzZXQpIHtcbiAgICBpZiAoIXRoaXMuY2FuU2V0KSByZXR1cm5cbiAgICBsaWdodHNTdG9yZS5hcHBseVByZXNldCh0aGlzLnByaW50ZXJPYmplY3RzLCBwcmVzZXQpXG4gIH1cblxuICAvKiogVGhlIG5leHQgcHJlc2V0IGluIHRoZSBsaXN0LCBmb3IgYSB0YXAgb24gdGhlIHNtYWxsIHdpZGdldC4gKi9cbiAgbmV4dFByZXNldCAoKSB7XG4gICAgY29uc3QgbGlzdCA9IGxpZ2h0c1N0b3JlLnByZXNldHNcbiAgICBpZiAoIXRoaXMuY2FuU2V0IHx8ICFsaXN0Lmxlbmd0aCkgcmV0dXJuXG4gICAgY29uc3QgYXQgPSBsaXN0LmZpbmRJbmRleChwID0+IHAuaWQgPT09IHRoaXMucHJlc2V0SWQpXG4gICAgbGlnaHRzU3RvcmUuYXBwbHlQcmVzZXQodGhpcy5wcmludGVyT2JqZWN0cywgbGlzdFsoYXQgKyAxKSAlIGxpc3QubGVuZ3RoXSlcbiAgfVxuXG4gIEBXYXRjaCgnbGVkUmVwb3J0JywgeyBkZWVwOiB0cnVlLCBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25SZXBvcnQgKCkgeyBsaWdodHNTdG9yZS5vYnNlcnZlKHRoaXMucHJpbnRlck9iamVjdHMpIH1cblxuICBAV2F0Y2goJ2NvbW1hbmRUYXJnZXQnKVxuICBvblByaW50ZXIgKCkge1xuICAgIGxpZ2h0c1N0b3JlLnJlc2V0KClcbiAgICBsaWdodHNTdG9yZS5lbnN1cmVMaWJyYXJ5KClcbiAgfVxuXG4gIGNyZWF0ZWQgKCkgeyBsaWdodHNTdG9yZS5lbnN1cmVMaWJyYXJ5KCkgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLFFBQVEsYUFBYTtBQUN6QyxPQUFPLGtCQUFrQjtBQUN6QixTQUFTLG1CQUFxQztBQUM5QztBQUFBLEVBQ0U7QUFBQSxFQUNBO0FBQUEsT0FLSztBQVFQLElBQXFCLGNBQXJCLGNBQXlDLE9BQU8sWUFBWSxFQUFFO0FBQUEsRUFDNUQsSUFBSSxTQUF1QjtBQUFFLFdBQU87QUFBQSxFQUFZO0FBQUEsRUFFaEQsSUFBSSxPQUE0QjtBQUFFLFdBQU8sWUFBWSxRQUFRLEtBQUssY0FBYztBQUFBLEVBQUU7QUFBQSxFQUVsRixJQUFJLGlCQUF1QztBQUFFLFdBQU8sS0FBSyxPQUFPLE1BQU0sUUFBUTtBQUFBLEVBQVE7QUFBQTtBQUFBLEVBR3RGLElBQUksWUFBc0I7QUFBRSxXQUFPLEtBQUssZUFBZSxzQkFBc0I7QUFBQSxFQUFFO0FBQUE7QUFBQSxFQUcvRSxJQUFJLFFBQTRCO0FBQUUsV0FBTyxZQUFZLFFBQVEsS0FBSyxjQUFjO0FBQUEsRUFBRTtBQUFBO0FBQUEsRUFHbEYsSUFBSSxRQUFxQjtBQUFFLFdBQU8sS0FBSyxTQUFTO0FBQUEsRUFBYztBQUFBLEVBRTlELElBQUksUUFBa0I7QUFBRSxXQUFPLEtBQUssVUFBVTtBQUFBLEVBQUs7QUFBQSxFQUVuRCxJQUFJLFNBQXNCO0FBQUUsV0FBTyxVQUFVLEtBQUssTUFBTSxLQUFLLE1BQU0sTUFBTTtBQUFBLEVBQUU7QUFBQTtBQUFBLEVBRzNFLElBQUksY0FBeUI7QUFBRSxXQUFPLEtBQUssTUFBTSxPQUFPLE1BQU0sR0FBRyxLQUFLLE9BQU8sT0FBTztBQUFBLEVBQUU7QUFBQSxFQUV0RixJQUFJLFNBQW1CO0FBQUUsV0FBTyxLQUFLLGdCQUFnQixLQUFLO0FBQUEsRUFBTTtBQUFBLEVBRWhFLElBQUksZUFBeUI7QUFBRSxXQUFPLEtBQUssbUJBQW1CLEtBQUs7QUFBQSxFQUFjO0FBQUEsRUFFakYsSUFBSSxXQUEyQjtBQUFFLFdBQU8sWUFBWSxTQUFTLEtBQUssS0FBSztBQUFBLEVBQUU7QUFBQTtBQUFBLEVBR3pFLElBQUksWUFBcUI7QUFDdkIsUUFBSSxDQUFDLEtBQUssTUFBTyxRQUFPO0FBQ3hCLFFBQUksQ0FBQyxLQUFLLE1BQU0sR0FBSSxRQUFPO0FBQzNCLFVBQU0sU0FBUyxZQUFZLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxLQUFLLFFBQVE7QUFDbkUsV0FBTyxTQUFTLE9BQU8sT0FBTyxLQUFLLE9BQU87QUFBQSxFQUM1QztBQUFBLEVBRUEsT0FBUSxPQUE0QjtBQUNsQyxRQUFJLENBQUMsS0FBSyxPQUFRO0FBQ2xCLGdCQUFZLElBQUksS0FBSyxnQkFBZ0IsS0FBSztBQUFBLEVBQzVDO0FBQUEsRUFFQSxXQUFZO0FBQ1YsUUFBSSxDQUFDLEtBQUssT0FBUTtBQUNsQixnQkFBWSxNQUFNLEtBQUssZ0JBQWdCLENBQUMsS0FBSyxNQUFNLEVBQUU7QUFBQSxFQUN2RDtBQUFBLEVBRUEsS0FBTSxRQUFxQjtBQUN6QixRQUFJLENBQUMsS0FBSyxPQUFRO0FBQ2xCLGdCQUFZLFlBQVksS0FBSyxnQkFBZ0IsTUFBTTtBQUFBLEVBQ3JEO0FBQUE7QUFBQSxFQUdBLGFBQWM7QUFDWixVQUFNLE9BQU8sWUFBWTtBQUN6QixRQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsS0FBSyxPQUFRO0FBQ2xDLFVBQU0sS0FBSyxLQUFLLFVBQVUsT0FBSyxFQUFFLE9BQU8sS0FBSyxRQUFRO0FBQ3JELGdCQUFZLFlBQVksS0FBSyxnQkFBZ0IsTUFBTSxLQUFLLEtBQUssS0FBSyxNQUFNLENBQUM7QUFBQSxFQUMzRTtBQUFBLEVBR0EsV0FBWTtBQUFFLGdCQUFZLFFBQVEsS0FBSyxjQUFjO0FBQUEsRUFBRTtBQUFBLEVBR3ZELFlBQWE7QUFDWCxnQkFBWSxNQUFNO0FBQ2xCLGdCQUFZLGNBQWM7QUFBQSxFQUM1QjtBQUFBLEVBRUEsVUFBVztBQUFFLGdCQUFZLGNBQWM7QUFBQSxFQUFFO0FBQzNDO0FBVEU7QUFBQSxFQURDLE1BQU0sYUFBYSxFQUFFLE1BQU0sTUFBTSxXQUFXLEtBQUssQ0FBQztBQUFBLEdBNURoQyxZQTZEbkI7QUFHQTtBQUFBLEVBREMsTUFBTSxlQUFlO0FBQUEsR0EvREgsWUFnRW5CO0FBaEVtQixjQUFyQjtBQUFBLEVBREM7QUFBQSxHQUNvQjtBQUFyQjtBQUFBLEVBQU8sZUFsQlA7QUFBQTsiLCJuYW1lcyI6W119