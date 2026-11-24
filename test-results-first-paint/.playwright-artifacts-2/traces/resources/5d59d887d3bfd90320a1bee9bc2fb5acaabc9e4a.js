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
import StateMixin from "/src/mixins/state.ts";
import { slicerPresence } from "/src/services/slicer-bridge/slicerUrl.ts";
import { activeSlug, isForeignSlug } from "/src/services/printer-pages/index.ts";
import { pageOfRoute, scopedPath } from "/src/router/printerPagePaths.ts";
import {
  sectionOf,
  sectionPath,
  visiblePages,
  visibleSections
} from "/src/router/printerSections.ts";
let FrameMixin = class extends Mixins(StateMixin) {
  get sectionContext() {
    if (isForeignSlug(this.$route.params.printer)) {
      return { slicer: false, camera: null, history: false, timelapse: false, diagnostics: false, foreign: true };
    }
    const cameras = this.$store.getters["webcams/getVisibleWebcams"];
    return {
      slicer: slicerPresence.state === "present",
      camera: cameras.length ? encodeURI(cameras[0].uid) : null,
      history: this.$store.getters["server/componentSupport"]("history"),
      timelapse: this.$store.getters["server/componentSupport"]("timelapse"),
      diagnostics: this.$store.state.config.uiSettings.general.enableDiagnostics,
      bedMesh: !!this.$store.getters["mesh/getSupportsBedMesh"],
      foreign: isForeignSlug(this.$route.params.printer)
    };
  }
  /**
   * A page of one printer, which the rail and the E-STOP belong to. A page
   * that needs no printer to work (Slice) can still be drawn as the
   * printer's, with meta.frame 'printer'.
   */
  get printerFrame() {
    if (!this.$route.params.printer) return false;
    return this.$route.meta?.frame === "printer" || this.$route.meta?.printerIndependent !== true;
  }
  /** The page without its printer: /boxwood-367a/history is /history. */
  get currentPage() {
    return pageOfRoute(this.$route);
  }
  get currentSection() {
    return this.printerFrame ? sectionOf(this.currentPage) : void 0;
  }
  get sections() {
    return visibleSections(this.sectionContext);
  }
  sectionTo(section) {
    return scopedPath(sectionPath(section, this.sectionContext), this.sectionContext.foreign ? this.$route.params.printer : activeSlug());
  }
  pageTo(page) {
    return scopedPath(page.path, this.sectionContext.foreign ? this.$route.params.printer : activeSlug());
  }
  pagesOf(section) {
    return visiblePages(section, this.sectionContext);
  }
};
FrameMixin = __decorateClass([
  Component
], FrameMixin);
export {
  FrameMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZyYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgdHlwZSB7IFdlYmNhbUNvbmZpZyB9IGZyb20gJ0Avc3RvcmUvd2ViY2Ftcy90eXBlcydcbmltcG9ydCB7IHNsaWNlclByZXNlbmNlIH0gZnJvbSAnQC9zZXJ2aWNlcy9zbGljZXItYnJpZGdlL3NsaWNlclVybCdcbmltcG9ydCB7IGFjdGl2ZVNsdWcsIGlzRm9yZWlnblNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBwYWdlT2ZSb3V0ZSwgc2NvcGVkUGF0aCB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJQYWdlUGF0aHMnXG5pbXBvcnQge1xuICBzZWN0aW9uT2YsXG4gIHNlY3Rpb25QYXRoLFxuICB2aXNpYmxlUGFnZXMsXG4gIHZpc2libGVTZWN0aW9ucyxcbiAgdHlwZSBTZWN0aW9uLFxuICB0eXBlIFNlY3Rpb25Db250ZXh0LFxuICB0eXBlIFNlY3Rpb25QYWdlXG59IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJTZWN0aW9ucydcblxuLyoqIFdoYXQgdGhlIHJhaWwsIHRoZSBoZWFkZXIgYW5kIHRoZSBwaG9uZSdzIHRhYnMgc2hhcmU6IHdoZXJlIHlvdSBhcmUgYW5kIHdoZXJlIHlvdSBjYW4gZ28uICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGcmFtZU1peGluIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgZ2V0IHNlY3Rpb25Db250ZXh0ICgpOiBTZWN0aW9uQ29udGV4dCB7XG4gICAgaWYgKGlzRm9yZWlnblNsdWcodGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIpKSB7XG4gICAgICByZXR1cm4geyBzbGljZXI6IGZhbHNlLCBjYW1lcmE6IG51bGwsIGhpc3Rvcnk6IGZhbHNlLCB0aW1lbGFwc2U6IGZhbHNlLCBkaWFnbm9zdGljczogZmFsc2UsIGZvcmVpZ246IHRydWUgfVxuICAgIH1cbiAgICBjb25zdCBjYW1lcmFzID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snd2ViY2Ftcy9nZXRWaXNpYmxlV2ViY2FtcyddIGFzIFdlYmNhbUNvbmZpZ1tdXG4gICAgcmV0dXJuIHtcbiAgICAgIHNsaWNlcjogc2xpY2VyUHJlc2VuY2Uuc3RhdGUgPT09ICdwcmVzZW50JyxcbiAgICAgIGNhbWVyYTogY2FtZXJhcy5sZW5ndGggPyBlbmNvZGVVUkkoY2FtZXJhc1swXS51aWQpIDogbnVsbCxcbiAgICAgIGhpc3Rvcnk6IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9jb21wb25lbnRTdXBwb3J0J10oJ2hpc3RvcnknKSBhcyBib29sZWFuLFxuICAgICAgdGltZWxhcHNlOiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzZXJ2ZXIvY29tcG9uZW50U3VwcG9ydCddKCd0aW1lbGFwc2UnKSBhcyBib29sZWFuLFxuICAgICAgZGlhZ25vc3RpY3M6IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmdlbmVyYWwuZW5hYmxlRGlhZ25vc3RpY3MgYXMgYm9vbGVhbixcbiAgICAgIGJlZE1lc2g6ICEhdGhpcy4kc3RvcmUuZ2V0dGVyc1snbWVzaC9nZXRTdXBwb3J0c0JlZE1lc2gnXSxcbiAgICAgIGZvcmVpZ246IGlzRm9yZWlnblNsdWcodGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcGFnZSBvZiBvbmUgcHJpbnRlciwgd2hpY2ggdGhlIHJhaWwgYW5kIHRoZSBFLVNUT1AgYmVsb25nIHRvLiBBIHBhZ2VcbiAgICogdGhhdCBuZWVkcyBubyBwcmludGVyIHRvIHdvcmsgKFNsaWNlKSBjYW4gc3RpbGwgYmUgZHJhd24gYXMgdGhlXG4gICAqIHByaW50ZXIncywgd2l0aCBtZXRhLmZyYW1lICdwcmludGVyJy5cbiAgICovXG4gIGdldCBwcmludGVyRnJhbWUgKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0aGlzLiRyb3V0ZS5tZXRhPy5mcmFtZSA9PT0gJ3ByaW50ZXInIHx8IHRoaXMuJHJvdXRlLm1ldGE/LnByaW50ZXJJbmRlcGVuZGVudCAhPT0gdHJ1ZVxuICB9XG5cbiAgLyoqIFRoZSBwYWdlIHdpdGhvdXQgaXRzIHByaW50ZXI6IC9ib3h3b29kLTM2N2EvaGlzdG9yeSBpcyAvaGlzdG9yeS4gKi9cbiAgZ2V0IGN1cnJlbnRQYWdlICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYWdlT2ZSb3V0ZSh0aGlzLiRyb3V0ZSlcbiAgfVxuXG4gIGdldCBjdXJyZW50U2VjdGlvbiAoKTogU2VjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRlckZyYW1lID8gc2VjdGlvbk9mKHRoaXMuY3VycmVudFBhZ2UpIDogdW5kZWZpbmVkXG4gIH1cblxuICBnZXQgc2VjdGlvbnMgKCk6IFNlY3Rpb25bXSB7XG4gICAgcmV0dXJuIHZpc2libGVTZWN0aW9ucyh0aGlzLnNlY3Rpb25Db250ZXh0KVxuICB9XG5cbiAgc2VjdGlvblRvIChzZWN0aW9uOiBTZWN0aW9uKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2NvcGVkUGF0aChzZWN0aW9uUGF0aChzZWN0aW9uLCB0aGlzLnNlY3Rpb25Db250ZXh0KSwgdGhpcy5zZWN0aW9uQ29udGV4dC5mb3JlaWduID8gdGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIgOiBhY3RpdmVTbHVnKCkpXG4gIH1cblxuICBwYWdlVG8gKHBhZ2U6IFNlY3Rpb25QYWdlKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2NvcGVkUGF0aChwYWdlLnBhdGgsIHRoaXMuc2VjdGlvbkNvbnRleHQuZm9yZWlnbiA/IHRoaXMuJHJvdXRlLnBhcmFtcy5wcmludGVyIDogYWN0aXZlU2x1ZygpKVxuICB9XG5cbiAgcGFnZXNPZiAoc2VjdGlvbjogU2VjdGlvbik6IFNlY3Rpb25QYWdlW10ge1xuICAgIHJldHVybiB2aXNpYmxlUGFnZXMoc2VjdGlvbiwgdGhpcy5zZWN0aW9uQ29udGV4dClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLGNBQWM7QUFDbEMsT0FBTyxnQkFBZ0I7QUFFdkIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxZQUFZLHFCQUFxQjtBQUMxQyxTQUFTLGFBQWEsa0JBQWtCO0FBQ3hDO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BSUs7QUFJUCxJQUFxQixhQUFyQixjQUF3QyxPQUFPLFVBQVUsRUFBRTtBQUFBLEVBQ3pELElBQUksaUJBQWtDO0FBQ3BDLFFBQUksY0FBYyxLQUFLLE9BQU8sT0FBTyxPQUFPLEdBQUc7QUFDN0MsYUFBTyxFQUFFLFFBQVEsT0FBTyxRQUFRLE1BQU0sU0FBUyxPQUFPLFdBQVcsT0FBTyxhQUFhLE9BQU8sU0FBUyxLQUFLO0FBQUEsSUFDNUc7QUFDQSxVQUFNLFVBQVUsS0FBSyxPQUFPLFFBQVEsMkJBQTJCO0FBQy9ELFdBQU87QUFBQSxNQUNMLFFBQVEsZUFBZSxVQUFVO0FBQUEsTUFDakMsUUFBUSxRQUFRLFNBQVMsVUFBVSxRQUFRLENBQUMsRUFBRSxHQUFHLElBQUk7QUFBQSxNQUNyRCxTQUFTLEtBQUssT0FBTyxRQUFRLHlCQUF5QixFQUFFLFNBQVM7QUFBQSxNQUNqRSxXQUFXLEtBQUssT0FBTyxRQUFRLHlCQUF5QixFQUFFLFdBQVc7QUFBQSxNQUNyRSxhQUFhLEtBQUssT0FBTyxNQUFNLE9BQU8sV0FBVyxRQUFRO0FBQUEsTUFDekQsU0FBUyxDQUFDLENBQUMsS0FBSyxPQUFPLFFBQVEseUJBQXlCO0FBQUEsTUFDeEQsU0FBUyxjQUFjLEtBQUssT0FBTyxPQUFPLE9BQU87QUFBQSxJQUNuRDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGVBQXlCO0FBQzNCLFFBQUksQ0FBQyxLQUFLLE9BQU8sT0FBTyxRQUFTLFFBQU87QUFDeEMsV0FBTyxLQUFLLE9BQU8sTUFBTSxVQUFVLGFBQWEsS0FBSyxPQUFPLE1BQU0sdUJBQXVCO0FBQUEsRUFDM0Y7QUFBQTtBQUFBLEVBR0EsSUFBSSxjQUF1QjtBQUN6QixXQUFPLFlBQVksS0FBSyxNQUFNO0FBQUEsRUFDaEM7QUFBQSxFQUVBLElBQUksaUJBQXVDO0FBQ3pDLFdBQU8sS0FBSyxlQUFlLFVBQVUsS0FBSyxXQUFXLElBQUk7QUFBQSxFQUMzRDtBQUFBLEVBRUEsSUFBSSxXQUF1QjtBQUN6QixXQUFPLGdCQUFnQixLQUFLLGNBQWM7QUFBQSxFQUM1QztBQUFBLEVBRUEsVUFBVyxTQUEwQjtBQUNuQyxXQUFPLFdBQVcsWUFBWSxTQUFTLEtBQUssY0FBYyxHQUFHLEtBQUssZUFBZSxVQUFVLEtBQUssT0FBTyxPQUFPLFVBQVUsV0FBVyxDQUFDO0FBQUEsRUFDdEk7QUFBQSxFQUVBLE9BQVEsTUFBMkI7QUFDakMsV0FBTyxXQUFXLEtBQUssTUFBTSxLQUFLLGVBQWUsVUFBVSxLQUFLLE9BQU8sT0FBTyxVQUFVLFdBQVcsQ0FBQztBQUFBLEVBQ3RHO0FBQUEsRUFFQSxRQUFTLFNBQWlDO0FBQ3hDLFdBQU8sYUFBYSxTQUFTLEtBQUssY0FBYztBQUFBLEVBQ2xEO0FBQ0Y7QUFuRHFCLGFBQXJCO0FBQUEsRUFEQztBQUFBLEdBQ29CO0FBQXJCO0FBQUEsRUFBTyxjQWxCUDtBQUFBOyIsIm5hbWVzIjpbXX0=