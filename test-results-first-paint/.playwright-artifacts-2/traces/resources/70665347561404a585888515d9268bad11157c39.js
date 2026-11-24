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
import isUserAgentDataMobileSupported from "/src/util/is-user-agent-data-mobile-supported.ts";
import { Vue, Component } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let BrowserMixin = class extends Vue {
  get isMobileViewport() {
    return this.$vuetify.breakpoint.mobile;
  }
  get isMobileUserAgent() {
    if (isUserAgentDataMobileSupported(navigator)) {
      return navigator.userAgentData.mobile;
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
};
BrowserMixin = __decorateClass([
  Component
], BrowserMixin);
export {
  BrowserMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGlzVXNlckFnZW50RGF0YU1vYmlsZVN1cHBvcnRlZCBmcm9tICdAL3V0aWwvaXMtdXNlci1hZ2VudC1kYXRhLW1vYmlsZS1zdXBwb3J0ZWQnXG5pbXBvcnQgeyBWdWUsIENvbXBvbmVudCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJyb3dzZXJNaXhpbiBleHRlbmRzIFZ1ZSB7XG4gIGdldCBpc01vYmlsZVZpZXdwb3J0ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kdnVldGlmeS5icmVha3BvaW50Lm1vYmlsZVxuICB9XG5cbiAgZ2V0IGlzTW9iaWxlVXNlckFnZW50ICgpOiBib29sZWFuIHtcbiAgICBpZiAoaXNVc2VyQWdlbnREYXRhTW9iaWxlU3VwcG9ydGVkKG5hdmlnYXRvcikpIHtcbiAgICAgIHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50RGF0YS5tb2JpbGVcbiAgICB9XG5cbiAgICByZXR1cm4gL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaVxuICAgICAgLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsT0FBTyxvQ0FBb0M7QUFDM0MsU0FBUyxLQUFLLGlCQUFpQjtBQUcvQixJQUFxQixlQUFyQixjQUEwQyxJQUFJO0FBQUEsRUFDNUMsSUFBSSxtQkFBNkI7QUFDL0IsV0FBTyxLQUFLLFNBQVMsV0FBVztBQUFBLEVBQ2xDO0FBQUEsRUFFQSxJQUFJLG9CQUE4QjtBQUNoQyxRQUFJLCtCQUErQixTQUFTLEdBQUc7QUFDN0MsYUFBTyxVQUFVLGNBQWM7QUFBQSxJQUNqQztBQUVBLFdBQU8saUVBQ0osS0FBSyxVQUFVLFNBQVM7QUFBQSxFQUM3QjtBQUNGO0FBYnFCLGVBQXJCO0FBQUEsRUFEQztBQUFBLEdBQ29CO0FBQXJCO0FBQUEsRUFBTyxnQkFKUDtBQUFBOyIsIm5hbWVzIjpbXX0=