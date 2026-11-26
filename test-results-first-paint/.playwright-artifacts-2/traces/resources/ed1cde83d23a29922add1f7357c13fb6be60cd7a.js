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
import StateMixin from "/src/mixins/state.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { gateState, refreshCanManageAccess, refreshGateDevMode, refreshGatePermissions, valueFor } from "/src/services/gates/index.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { mayUse } from "/src/services/permissions/presets.ts";
let MuonGatesMixin = class extends Mixins(StateMixin) {
  /**
   * True when Moonraker reports a muon_access or muon_protection component,
   * false when it reports a list with neither, null until server.info has
   * been received for this printer.
   */
  get isMuonPrinter() {
    return this.$store.getters["server/isMuonPrinter"];
  }
  /** The printer these answers are for. */
  get gatePrinter() {
    return activeSlug();
  }
  /** True only when this printer has said developer mode is on. Unknown counts as off. */
  get devModeEnabled() {
    return valueFor("dev", this.gatePrinter) === true;
  }
  /**
   * Whether this client may manage access (the printer reports
   * `protection: allowed`), or null while unknown. See CanManageAccess.
   */
  get canManageAccess() {
    return this.isMuonPrinter === true ? valueFor("manage", this.gatePrinter) : null;
  }
  /**
   * Whether this client may use what a permission setting guards (`plate_clear`,
   * `update_install`, `hotspot_toggle`, `wifi_change`, ...): the owner, or
   * anyone the setting lets in. Unknown, and a setting the printer doesn't
   * report, count as yes, so nothing is hidden on a guess; the printer
   * enforces the value either way. Hide a control with this, never grey it.
   */
  mayDo(knob) {
    if (this.isMuonPrinter !== true) return true;
    if (this.canManageAccess !== false) return true;
    const perms = valueFor("perms", this.gatePrinter);
    return mayUse(perms?.[knob], valueFor("shared", this.gatePrinter));
  }
  /** Changes on a switch, a reset and when server.info lands: asks again. */
  get gateToken() {
    return `${gateState.epoch}|${this.gatePrinter}|${this.isMuonPrinter}`;
  }
  mounted() {
    this.askGates();
  }
  onGateToken() {
    this.askGates();
  }
  askGates() {
    if (this.gatePrinter === null) return;
    if (valueFor("dev", this.gatePrinter) === null) refreshGateDevMode();
    if (this.isMuonPrinter === true && valueFor("perms", this.gatePrinter) === null) {
      refreshGatePermissions(isManagedApiUrl(this.$store.state.config?.apiUrl));
    }
    if (this.isMuonPrinter === true && this.$store.getters["server/componentSupport"]("muon_access") && valueFor("manage", this.gatePrinter) === null) {
      refreshCanManageAccess();
    }
  }
};
__decorateClass([
  Watch("gateToken")
], MuonGatesMixin.prototype, "onGateToken", 1);
MuonGatesMixin = __decorateClass([
  Component
], MuonGatesMixin);
export {
  MuonGatesMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11b24tZ2F0ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IGdhdGVTdGF0ZSwgcmVmcmVzaENhbk1hbmFnZUFjY2VzcywgcmVmcmVzaEdhdGVEZXZNb2RlLCByZWZyZXNoR2F0ZVBlcm1pc3Npb25zLCB2YWx1ZUZvciB9IGZyb20gJ0Avc2VydmljZXMvZ2F0ZXMnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgbWF5VXNlIH0gZnJvbSAnQC9zZXJ2aWNlcy9wZXJtaXNzaW9ucy9wcmVzZXRzJ1xuXG4vKipcbiAqIFRoZSBnYXRlIGFuc3dlcnMgYSBTZXR0aW5ncyBwYWdlIG5lZWRzLCBpbiBvbmUgcGxhY2UgKHNlZVxuICogc3JjL2NvbXBvbmVudHMvc2V0dGluZ3MvZ2F0ZXMvUkVBRE1FLm1kKS4gSXQgZXh0ZW5kcyBTdGF0ZU1peGluLCBzb1xuICogYHByaW50ZXJCdXN5YCBhbmQgYHByaW50ZXJQcmludGluZ2AgYXJlIGhlcmUgdG9vLCBmb3IgZ2F0ZXMgc3VjaCBhc1xuICogXCJubyBtb3ZlIG9yIGhlYXQgd2hpbGUgcHJpbnRpbmdcIi5cbiAqXG4gKiBFdmVyeSBhbnN3ZXIgaXMgZm9yIHRoZSBwcmludGVyIG9uIHNjcmVlbjogaXQgaXMgdW5rbm93biAobnVsbCAvIGZhbHNlKVxuICogYWZ0ZXIgYSBwcmludGVyIHN3aXRjaCwgYSBzb2NrZXQgY2xvc2Ugb3IgYSByZWNvbm5lY3QsIHVudGlsIGFza2VkIGFnYWluLlxuICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNdW9uR2F0ZXNNaXhpbiBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluKSB7XG4gIC8qKlxuICAgKiBUcnVlIHdoZW4gTW9vbnJha2VyIHJlcG9ydHMgYSBtdW9uX2FjY2VzcyBvciBtdW9uX3Byb3RlY3Rpb24gY29tcG9uZW50LFxuICAgKiBmYWxzZSB3aGVuIGl0IHJlcG9ydHMgYSBsaXN0IHdpdGggbmVpdGhlciwgbnVsbCB1bnRpbCBzZXJ2ZXIuaW5mbyBoYXNcbiAgICogYmVlbiByZWNlaXZlZCBmb3IgdGhpcyBwcmludGVyLlxuICAgKi9cbiAgZ2V0IGlzTXVvblByaW50ZXIgKCk6IGJvb2xlYW4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2lzTXVvblByaW50ZXInXSBhcyBib29sZWFuIHwgbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIHRoZXNlIGFuc3dlcnMgYXJlIGZvci4gKi9cbiAgZ2V0IGdhdGVQcmludGVyICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gYWN0aXZlU2x1ZygpXG4gIH1cblxuICAvKiogVHJ1ZSBvbmx5IHdoZW4gdGhpcyBwcmludGVyIGhhcyBzYWlkIGRldmVsb3BlciBtb2RlIGlzIG9uLiBVbmtub3duIGNvdW50cyBhcyBvZmYuICovXG4gIGdldCBkZXZNb2RlRW5hYmxlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHZhbHVlRm9yKCdkZXYnLCB0aGlzLmdhdGVQcmludGVyKSA9PT0gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBjbGllbnQgbWF5IG1hbmFnZSBhY2Nlc3MgKHRoZSBwcmludGVyIHJlcG9ydHNcbiAgICogYHByb3RlY3Rpb246IGFsbG93ZWRgKSwgb3IgbnVsbCB3aGlsZSB1bmtub3duLiBTZWUgQ2FuTWFuYWdlQWNjZXNzLlxuICAgKi9cbiAgZ2V0IGNhbk1hbmFnZUFjY2VzcyAoKTogYm9vbGVhbiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmlzTXVvblByaW50ZXIgPT09IHRydWUgPyB2YWx1ZUZvcignbWFuYWdlJywgdGhpcy5nYXRlUHJpbnRlcikgOiBudWxsXG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNsaWVudCBtYXkgdXNlIHdoYXQgYSBwZXJtaXNzaW9uIHNldHRpbmcgZ3VhcmRzIChgcGxhdGVfY2xlYXJgLFxuICAgKiBgdXBkYXRlX2luc3RhbGxgLCBgaG90c3BvdF90b2dnbGVgLCBgd2lmaV9jaGFuZ2VgLCAuLi4pOiB0aGUgb3duZXIsIG9yXG4gICAqIGFueW9uZSB0aGUgc2V0dGluZyBsZXRzIGluLiBVbmtub3duLCBhbmQgYSBzZXR0aW5nIHRoZSBwcmludGVyIGRvZXNuJ3RcbiAgICogcmVwb3J0LCBjb3VudCBhcyB5ZXMsIHNvIG5vdGhpbmcgaXMgaGlkZGVuIG9uIGEgZ3Vlc3M7IHRoZSBwcmludGVyXG4gICAqIGVuZm9yY2VzIHRoZSB2YWx1ZSBlaXRoZXIgd2F5LiBIaWRlIGEgY29udHJvbCB3aXRoIHRoaXMsIG5ldmVyIGdyZXkgaXQuXG4gICAqL1xuICBtYXlEbyAoa25vYjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuaXNNdW9uUHJpbnRlciAhPT0gdHJ1ZSkgcmV0dXJuIHRydWVcbiAgICBpZiAodGhpcy5jYW5NYW5hZ2VBY2Nlc3MgIT09IGZhbHNlKSByZXR1cm4gdHJ1ZVxuICAgIGNvbnN0IHBlcm1zID0gdmFsdWVGb3IoJ3Blcm1zJywgdGhpcy5nYXRlUHJpbnRlcilcbiAgICByZXR1cm4gbWF5VXNlKHBlcm1zPy5ba25vYl0sIHZhbHVlRm9yKCdzaGFyZWQnLCB0aGlzLmdhdGVQcmludGVyKSlcbiAgfVxuXG4gIC8qKiBDaGFuZ2VzIG9uIGEgc3dpdGNoLCBhIHJlc2V0IGFuZCB3aGVuIHNlcnZlci5pbmZvIGxhbmRzOiBhc2tzIGFnYWluLiAqL1xuICBnZXQgZ2F0ZVRva2VuICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtnYXRlU3RhdGUuZXBvY2h9fCR7dGhpcy5nYXRlUHJpbnRlcn18JHt0aGlzLmlzTXVvblByaW50ZXJ9YFxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5hc2tHYXRlcygpXG4gIH1cblxuICBAV2F0Y2goJ2dhdGVUb2tlbicpXG4gIG9uR2F0ZVRva2VuICgpIHtcbiAgICB0aGlzLmFza0dhdGVzKClcbiAgfVxuXG4gIGFza0dhdGVzICgpIHtcbiAgICBpZiAodGhpcy5nYXRlUHJpbnRlciA9PT0gbnVsbCkgcmV0dXJuXG4gICAgaWYgKHZhbHVlRm9yKCdkZXYnLCB0aGlzLmdhdGVQcmludGVyKSA9PT0gbnVsbCkgcmVmcmVzaEdhdGVEZXZNb2RlKClcbiAgICBpZiAodGhpcy5pc011b25QcmludGVyID09PSB0cnVlICYmIHZhbHVlRm9yKCdwZXJtcycsIHRoaXMuZ2F0ZVByaW50ZXIpID09PSBudWxsKSB7XG4gICAgICByZWZyZXNoR2F0ZVBlcm1pc3Npb25zKGlzTWFuYWdlZEFwaVVybCgodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnPy5hcGlVcmwgYXMgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkpKVxuICAgIH1cbiAgICBpZiAodGhpcy5pc011b25QcmludGVyID09PSB0cnVlICYmXG4gICAgICB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKCdtdW9uX2FjY2VzcycpICYmXG4gICAgICB2YWx1ZUZvcignbWFuYWdlJywgdGhpcy5nYXRlUHJpbnRlcikgPT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDYW5NYW5hZ2VBY2Nlc3MoKVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLFFBQVEsYUFBYTtBQUN6QyxPQUFPLGdCQUFnQjtBQUN2QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLFdBQVcsd0JBQXdCLG9CQUFvQix3QkFBd0IsZ0JBQWdCO0FBQ3hHLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsY0FBYztBQVl2QixJQUFxQixpQkFBckIsY0FBNEMsT0FBTyxVQUFVLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNN0QsSUFBSSxnQkFBaUM7QUFDbkMsV0FBTyxLQUFLLE9BQU8sUUFBUSxzQkFBc0I7QUFBQSxFQUNuRDtBQUFBO0FBQUEsRUFHQSxJQUFJLGNBQThCO0FBQ2hDLFdBQU8sV0FBVztBQUFBLEVBQ3BCO0FBQUE7QUFBQSxFQUdBLElBQUksaUJBQTJCO0FBQzdCLFdBQU8sU0FBUyxPQUFPLEtBQUssV0FBVyxNQUFNO0FBQUEsRUFDL0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxrQkFBbUM7QUFDckMsV0FBTyxLQUFLLGtCQUFrQixPQUFPLFNBQVMsVUFBVSxLQUFLLFdBQVcsSUFBSTtBQUFBLEVBQzlFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE1BQU8sTUFBdUI7QUFDNUIsUUFBSSxLQUFLLGtCQUFrQixLQUFNLFFBQU87QUFDeEMsUUFBSSxLQUFLLG9CQUFvQixNQUFPLFFBQU87QUFDM0MsVUFBTSxRQUFRLFNBQVMsU0FBUyxLQUFLLFdBQVc7QUFDaEQsV0FBTyxPQUFPLFFBQVEsSUFBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLFdBQVcsQ0FBQztBQUFBLEVBQ25FO0FBQUE7QUFBQSxFQUdBLElBQUksWUFBcUI7QUFDdkIsV0FBTyxHQUFHLFVBQVUsS0FBSyxJQUFJLEtBQUssV0FBVyxJQUFJLEtBQUssYUFBYTtBQUFBLEVBQ3JFO0FBQUEsRUFFQSxVQUFXO0FBQ1QsU0FBSyxTQUFTO0FBQUEsRUFDaEI7QUFBQSxFQUdBLGNBQWU7QUFDYixTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsV0FBWTtBQUNWLFFBQUksS0FBSyxnQkFBZ0IsS0FBTTtBQUMvQixRQUFJLFNBQVMsT0FBTyxLQUFLLFdBQVcsTUFBTSxLQUFNLG9CQUFtQjtBQUNuRSxRQUFJLEtBQUssa0JBQWtCLFFBQVEsU0FBUyxTQUFTLEtBQUssV0FBVyxNQUFNLE1BQU07QUFDL0UsNkJBQXVCLGdCQUFpQixLQUFLLE9BQU8sTUFBTSxRQUFRLE1BQW9DLENBQUM7QUFBQSxJQUN6RztBQUNBLFFBQUksS0FBSyxrQkFBa0IsUUFDekIsS0FBSyxPQUFPLFFBQVEseUJBQXlCLEVBQUUsYUFBYSxLQUM1RCxTQUFTLFVBQVUsS0FBSyxXQUFXLE1BQU0sTUFBTTtBQUMvQyw2QkFBdUI7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFDRjtBQWhCRTtBQUFBLEVBREMsTUFBTSxXQUFXO0FBQUEsR0FuREMsZUFvRG5CO0FBcERtQixpQkFBckI7QUFBQSxFQURDO0FBQUEsR0FDb0I7QUFBckI7QUFBQSxFQUFPLGtCQWpCUDtBQUFBOyIsIm5hbWVzIjpbXX0=