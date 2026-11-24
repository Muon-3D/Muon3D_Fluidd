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
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import { DEV_ONLY_NOTE, devOnlyLocked } from "/src/services/dev-guard/index.ts";
let DevGuardMixin = class extends Mixins(MuonGatesMixin) {
  get devOnlyLocked() {
    return devOnlyLocked({
      isMuon: this.isMuonPrinter,
      guardDevMode: this.$store.state.printer?.printer?.muon_guard?.dev_mode,
      gateDevMode: this.devModeEnabled
    });
  }
  get devOnlyNote() {
    return DEV_ONLY_NOTE;
  }
};
DevGuardMixin = __decorateClass([
  Component
], DevGuardMixin);
export {
  DevGuardMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRldi1ndWFyZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgTXVvbkdhdGVzTWl4aW4gZnJvbSAnQC9taXhpbnMvbXVvbi1nYXRlcydcbmltcG9ydCB7IERFVl9PTkxZX05PVEUsIGRldk9ubHlMb2NrZWQgfSBmcm9tICdAL3NlcnZpY2VzL2Rldi1ndWFyZCdcblxuLyoqXG4gKiBGb3IgYSBjb250cm9sIHRoYXQgc2VuZHMgYSBjb21tYW5kIEtsaXBwZXIjMTEyIG9ubHkgYWxsb3dzIGluIGRldmVsb3BlclxuICogbW9kZS4gYGRldk9ubHlMb2NrZWRgIGlzIHRydWUgd2hlbiBpdCBtdXN0IGJlIGhpZGRlbiBvciBkaXNhYmxlZCB3aXRoXG4gKiBgZGV2T25seU5vdGVgIGJlc2lkZSBpdCwgYW5kIHRoZSBzZW5kIGl0c2VsZiBtdXN0IGNoZWNrIGBkZXZPbmx5TG9ja2VkYCB0b28uXG4gKi9cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkd1YXJkTWl4aW4gZXh0ZW5kcyBNaXhpbnMoTXVvbkdhdGVzTWl4aW4pIHtcbiAgZ2V0IGRldk9ubHlMb2NrZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBkZXZPbmx5TG9ja2VkKHtcbiAgICAgIGlzTXVvbjogdGhpcy5pc011b25QcmludGVyLFxuICAgICAgZ3VhcmREZXZNb2RlOiB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyPy5wcmludGVyPy5tdW9uX2d1YXJkPy5kZXZfbW9kZSxcbiAgICAgIGdhdGVEZXZNb2RlOiB0aGlzLmRldk1vZGVFbmFibGVkXG4gICAgfSlcbiAgfVxuXG4gIGdldCBkZXZPbmx5Tm90ZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gREVWX09OTFlfTk9URVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLFdBQVcsY0FBYztBQUNsQyxPQUFPLG9CQUFvQjtBQUMzQixTQUFTLGVBQWUscUJBQXFCO0FBUTdDLElBQXFCLGdCQUFyQixjQUEyQyxPQUFPLGNBQWMsRUFBRTtBQUFBLEVBQ2hFLElBQUksZ0JBQTBCO0FBQzVCLFdBQU8sY0FBYztBQUFBLE1BQ25CLFFBQVEsS0FBSztBQUFBLE1BQ2IsY0FBYyxLQUFLLE9BQU8sTUFBTSxTQUFTLFNBQVMsWUFBWTtBQUFBLE1BQzlELGFBQWEsS0FBSztBQUFBLElBQ3BCLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxJQUFJLGNBQXVCO0FBQ3pCLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFacUIsZ0JBQXJCO0FBQUEsRUFEQztBQUFBLEdBQ29CO0FBQXJCO0FBQUEsRUFBTyxpQkFWUDtBQUFBOyIsIm5hbWVzIjpbXX0=