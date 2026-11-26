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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { DEFAULT_LIGHT, LED_OFF, PREVIEW_INTERVAL_MS, previewLuminance, previewStrip } from "/src/services/control/lights.ts";
import { reducedMotion } from "/src/util/motion.ts";
const MOVES = ["rainbow", "breathe", "chase", "status"];
let PreviewClock = class extends Vue {
  light;
  dots = previewStrip({ ...DEFAULT_LIGHT, on: false }, 0);
  /** Frames drawn, for the tests. */
  frames = 0;
  timer = null;
  started = 0;
  get luminance() {
    return previewLuminance(this.light);
  }
  get animates() {
    return this.light.on && MOVES.includes(this.light.effect) && !reducedMotion();
  }
  get off() {
    return LED_OFF;
  }
  draw() {
    const seconds = this.animates ? (performance.now() - this.started) / 1e3 : 0;
    this.dots = previewStrip(this.light, seconds);
    this.frames++;
  }
  tick() {
    if (typeof document !== "undefined" && document.hidden) return;
    if (reducedMotion()) {
      if (this.timer) this.stop();
      return;
    }
    this.draw();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  /** (Re)start the timer when the effect moves; stop it when not. One still frame either way. */
  sync() {
    this.draw();
    if (this.animates && !this.timer) this.timer = setInterval(() => this.tick(), PREVIEW_INTERVAL_MS);
    else if (!this.animates) this.stop();
  }
  onLight() {
    this.sync();
  }
  mounted() {
    this.started = performance.now();
    this.sync();
  }
  beforeDestroy() {
    this.stop();
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], PreviewClock.prototype, "light", 2);
__decorateClass([
  Watch("light", { deep: true })
], PreviewClock.prototype, "onLight", 1);
PreviewClock = __decorateClass([
  Component
], PreviewClock);
export {
  PreviewClock as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByZXZpZXctY2xvY2sudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IERFRkFVTFRfTElHSFQsIExFRF9PRkYsIFBSRVZJRVdfSU5URVJWQUxfTVMsIHByZXZpZXdMdW1pbmFuY2UsIHByZXZpZXdTdHJpcCwgdHlwZSBMZWREb3QsIHR5cGUgTGlnaHRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9saWdodHMnXG5pbXBvcnQgeyByZWR1Y2VkTW90aW9uIH0gZnJvbSAnQC91dGlsL21vdGlvbidcblxuLyoqIEVmZmVjdHMgdGhhdCBtb3ZlOiB0aGUgb3RoZXJzIGFyZSBkcmF3biBvbmNlLiAqL1xuY29uc3QgTU9WRVMgPSBbJ3JhaW5ib3cnLCAnYnJlYXRoZScsICdjaGFzZScsICdzdGF0dXMnXVxuXG4vKipcbiAqIERyYXdzIG9uZSBzdHJpcCBvZiB0aGUgcHJldmlldyBmcm9tIHRoZSBsaWdodCBzdGF0ZSBhbG9uZSwgaW4gdGhlIGJyb3dzZXI6XG4gKiBubyBwcmludGVyIHJlYWQgcGVyIGZyYW1lLCBhbmQgbmV2ZXIgbW9yZSB0aGFuIDE1IGZyYW1lcyBhIHNlY29uZCAob25lXG4gKiB0aW1lciBhdCBQUkVWSUVXX0lOVEVSVkFMX01TLCBvbmx5IHdoaWxlIGFuIGVmZmVjdCBtb3ZlcyBhbmQgdGhlIHBhZ2UgaXNcbiAqIHNob3dpbmcpLiBVbmRlciByZWR1Y2VkIG1vdGlvbiBpdCBkcmF3cyBvbmUgc3RpbGwgZnJhbWUuXG4gKi9cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByZXZpZXdDbG9jayBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSBsaWdodCE6IExpZ2h0U3RhdGVcblxuICBkb3RzOiBMZWREb3RbXSA9IHByZXZpZXdTdHJpcCh7IC4uLkRFRkFVTFRfTElHSFQsIG9uOiBmYWxzZSB9LCAwKVxuICAvKiogRnJhbWVzIGRyYXduLCBmb3IgdGhlIHRlc3RzLiAqL1xuICBmcmFtZXMgPSAwXG4gIHByaXZhdGUgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPiB8IG51bGwgPSBudWxsXG4gIHByaXZhdGUgc3RhcnRlZCA9IDBcblxuICBnZXQgbHVtaW5hbmNlICgpOiBudW1iZXIgeyByZXR1cm4gcHJldmlld0x1bWluYW5jZSh0aGlzLmxpZ2h0KSB9XG5cbiAgZ2V0IGFuaW1hdGVzICgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMubGlnaHQub24gJiYgTU9WRVMuaW5jbHVkZXModGhpcy5saWdodC5lZmZlY3QpICYmICFyZWR1Y2VkTW90aW9uKCkgfVxuXG4gIGdldCBvZmYgKCk6IHN0cmluZyB7IHJldHVybiBMRURfT0ZGIH1cblxuICBkcmF3ICgpIHtcbiAgICBjb25zdCBzZWNvbmRzID0gdGhpcy5hbmltYXRlcyA/IChwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuc3RhcnRlZCkgLyAxMDAwIDogMFxuICAgIHRoaXMuZG90cyA9IHByZXZpZXdTdHJpcCh0aGlzLmxpZ2h0LCBzZWNvbmRzKVxuICAgIHRoaXMuZnJhbWVzKytcbiAgfVxuXG4gIHRpY2sgKCkge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmhpZGRlbikgcmV0dXJuXG4gICAgaWYgKHJlZHVjZWRNb3Rpb24oKSkgeyBpZiAodGhpcy50aW1lcikgdGhpcy5zdG9wKCk7IHJldHVybiB9XG4gICAgdGhpcy5kcmF3KClcbiAgfVxuXG4gIHN0b3AgKCkge1xuICAgIGlmICh0aGlzLnRpbWVyKSBjbGVhckludGVydmFsKHRoaXMudGltZXIpXG4gICAgdGhpcy50aW1lciA9IG51bGxcbiAgfVxuXG4gIC8qKiAoUmUpc3RhcnQgdGhlIHRpbWVyIHdoZW4gdGhlIGVmZmVjdCBtb3Zlczsgc3RvcCBpdCB3aGVuIG5vdC4gT25lIHN0aWxsIGZyYW1lIGVpdGhlciB3YXkuICovXG4gIHN5bmMgKCkge1xuICAgIHRoaXMuZHJhdygpXG4gICAgaWYgKHRoaXMuYW5pbWF0ZXMgJiYgIXRoaXMudGltZXIpIHRoaXMudGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnRpY2soKSwgUFJFVklFV19JTlRFUlZBTF9NUylcbiAgICBlbHNlIGlmICghdGhpcy5hbmltYXRlcykgdGhpcy5zdG9wKClcbiAgfVxuXG4gIEBXYXRjaCgnbGlnaHQnLCB7IGRlZXA6IHRydWUgfSlcbiAgb25MaWdodCAoKSB7IHRoaXMuc3luYygpIH1cblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLnN0YXJ0ZWQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIHRoaXMuc3luYygpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHsgdGhpcy5zdG9wKCkgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLE1BQU0sS0FBSyxhQUFhO0FBQzVDLFNBQVMsZUFBZSxTQUFTLHFCQUFxQixrQkFBa0Isb0JBQWtEO0FBQzFILFNBQVMscUJBQXFCO0FBRzlCLE1BQU0sUUFBUSxDQUFDLFdBQVcsV0FBVyxTQUFTLFFBQVE7QUFTdEQsSUFBcUIsZUFBckIsY0FBMEMsSUFBSTtBQUFBLEVBQ0s7QUFBQSxFQUVqRCxPQUFpQixhQUFhLEVBQUUsR0FBRyxlQUFlLElBQUksTUFBTSxHQUFHLENBQUM7QUFBQTtBQUFBLEVBRWhFLFNBQVM7QUFBQSxFQUNELFFBQStDO0FBQUEsRUFDL0MsVUFBVTtBQUFBLEVBRWxCLElBQUksWUFBcUI7QUFBRSxXQUFPLGlCQUFpQixLQUFLLEtBQUs7QUFBQSxFQUFFO0FBQUEsRUFFL0QsSUFBSSxXQUFxQjtBQUFFLFdBQU8sS0FBSyxNQUFNLE1BQU0sTUFBTSxTQUFTLEtBQUssTUFBTSxNQUFNLEtBQUssQ0FBQyxjQUFjO0FBQUEsRUFBRTtBQUFBLEVBRXpHLElBQUksTUFBZTtBQUFFLFdBQU87QUFBQSxFQUFRO0FBQUEsRUFFcEMsT0FBUTtBQUNOLFVBQU0sVUFBVSxLQUFLLFlBQVksWUFBWSxJQUFJLElBQUksS0FBSyxXQUFXLE1BQU87QUFDNUUsU0FBSyxPQUFPLGFBQWEsS0FBSyxPQUFPLE9BQU87QUFDNUMsU0FBSztBQUFBLEVBQ1A7QUFBQSxFQUVBLE9BQVE7QUFDTixRQUFJLE9BQU8sYUFBYSxlQUFlLFNBQVMsT0FBUTtBQUN4RCxRQUFJLGNBQWMsR0FBRztBQUFFLFVBQUksS0FBSyxNQUFPLE1BQUssS0FBSztBQUFHO0FBQUEsSUFBTztBQUMzRCxTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUEsRUFFQSxPQUFRO0FBQ04sUUFBSSxLQUFLLE1BQU8sZUFBYyxLQUFLLEtBQUs7QUFDeEMsU0FBSyxRQUFRO0FBQUEsRUFDZjtBQUFBO0FBQUEsRUFHQSxPQUFRO0FBQ04sU0FBSyxLQUFLO0FBQ1YsUUFBSSxLQUFLLFlBQVksQ0FBQyxLQUFLLE1BQU8sTUFBSyxRQUFRLFlBQVksTUFBTSxLQUFLLEtBQUssR0FBRyxtQkFBbUI7QUFBQSxhQUN4RixDQUFDLEtBQUssU0FBVSxNQUFLLEtBQUs7QUFBQSxFQUNyQztBQUFBLEVBR0EsVUFBVztBQUFFLFNBQUssS0FBSztBQUFBLEVBQUU7QUFBQSxFQUV6QixVQUFXO0FBQ1QsU0FBSyxVQUFVLFlBQVksSUFBSTtBQUMvQixTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUEsRUFFQSxnQkFBaUI7QUFBRSxTQUFLLEtBQUs7QUFBQSxFQUFFO0FBQ2pDO0FBL0NtRDtBQUFBLEVBQWhELEtBQUssRUFBRSxNQUFNLFFBQVEsVUFBVSxLQUFLLENBQUM7QUFBQSxHQURuQixhQUM4QjtBQXVDakQ7QUFBQSxFQURDLE1BQU0sU0FBUyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQUEsR0F2Q1gsYUF3Q25CO0FBeENtQixlQUFyQjtBQUFBLEVBREM7QUFBQSxHQUNvQjtBQUFyQjtBQUFBLEVBQU8sZ0JBZFA7QUFBQTsiLCJuYW1lcyI6W119