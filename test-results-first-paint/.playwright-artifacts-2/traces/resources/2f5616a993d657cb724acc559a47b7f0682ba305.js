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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import TaskFold from "/src/components/control/TaskFold.vue";
import { ControlPreferenceStore, REMEMBER_CONTROL_FOLDS } from "/src/services/control/preferences.ts";
import { controlPreferenceStore } from "/src/services/account/control-preferences.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { storedToken } from "/src/services/muon-cloud/api.ts";
let PersonalTaskFold = class extends Vue {
  printerId;
  foldKey;
  foldId;
  title;
  summary;
  preferences;
  choice;
  get store() {
    return this.preferences ?? controlPreferenceStore;
  }
  get identity() {
    return `${cloudState.account?.id ?? ""}/${this.printerId}`;
  }
  get open() {
    return this.store.isSelected(this.context()) && this.store.state.folds[this.foldKey] === true;
  }
  context() {
    return { accountId: cloudState.account?.id ?? null, printerId: this.printerId || null, token: cloudState.account ? storedToken() : null };
  }
  refresh() {
    return this.store.select(this.context());
  }
  mounted() {
    if (!REMEMBER_CONTROL_FOLDS) this.store.setFold(this.foldKey, false);
    window.addEventListener("focus", this.refresh);
    document.addEventListener("visibilitychange", this.onVisibility);
  }
  beforeDestroy() {
    window.removeEventListener("focus", this.refresh);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }
  onVisibility() {
    if (!document.hidden) this.refresh();
  }
  choose(open) {
    this.refresh();
    return this.store.setFold(this.foldKey, open);
  }
  retry() {
    this.refresh();
    return this.store.retry();
  }
};
__decorateClass([
  Prop({ type: String, required: true })
], PersonalTaskFold.prototype, "printerId", 2);
__decorateClass([
  Prop({ type: String, required: true })
], PersonalTaskFold.prototype, "foldKey", 2);
__decorateClass([
  Prop({ type: String, required: true })
], PersonalTaskFold.prototype, "foldId", 2);
__decorateClass([
  Prop({ type: String, required: true })
], PersonalTaskFold.prototype, "title", 2);
__decorateClass([
  Prop({ type: String, required: true })
], PersonalTaskFold.prototype, "summary", 2);
__decorateClass([
  Prop({ type: Object })
], PersonalTaskFold.prototype, "preferences", 2);
__decorateClass([
  Prop({ type: Boolean })
], PersonalTaskFold.prototype, "choice", 2);
__decorateClass([
  Watch("identity", { immediate: true })
], PersonalTaskFold.prototype, "refresh", 1);
PersonalTaskFold = __decorateClass([
  Component({ components: { TaskFold } })
], PersonalTaskFold);
const _sfc_main = PersonalTaskFold;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", [_vm.choice ? _vm._t("default", null, { "value": _vm.open, "choose": _vm.choose }) : _c("task-fold", { attrs: { "fold-id": _vm.foldId, "title": _vm.title, "summary": _vm.summary, "value": _vm.open }, on: { "input": _vm.choose } }, [_vm._t("default")], 2), _vm.store.state.error ? _c("p", { staticClass: "personal-fold__error", attrs: { "role": "status" } }, [_vm._v(" " + _vm._s(_vm.store.state.error) + " "), _c("button", { attrs: { "type": "button" }, on: { "click": _vm.retry } }, [_vm._v(" Try again ")])]) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/control/PersonalTaskFold.vue?vue&type=style&index=0&scoped=79acd0ff&lang.css";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "79acd0ff",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/control/PersonalTaskFold.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQWtDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUE7QUFBQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQWxDQTtBQUFBO0FBQUEsR0FEQSxpQkFDQTtBQUNBO0FBQUE7QUFBQSxHQUZBLGlCQUVBO0FBQ0E7QUFBQTtBQUFBLEdBSEEsaUJBR0E7QUFDQTtBQUFBO0FBQUEsR0FKQSxpQkFJQTtBQUNBO0FBQUE7QUFBQSxHQUxBLGlCQUtBO0FBQ0E7QUFBQTtBQUFBLEdBTkEsaUJBTUE7QUFDQTtBQUFBO0FBQUEsR0FQQSxpQkFPQTtBQVlBO0FBQUEsRUFEQTtBQUFBLEdBbEJBLGlCQW1CQTtBQW5CQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQZXJzb25hbFRhc2tGb2xkLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXY+XG4gICAgPHNsb3RcbiAgICAgIHYtaWY9XCJjaG9pY2VcIlxuICAgICAgOnZhbHVlPVwib3BlblwiXG4gICAgICA6Y2hvb3NlPVwiY2hvb3NlXCJcbiAgICAvPlxuICAgIDx0YXNrLWZvbGRcbiAgICAgIHYtZWxzZVxuICAgICAgOmZvbGQtaWQ9XCJmb2xkSWRcIlxuICAgICAgOnRpdGxlPVwidGl0bGVcIlxuICAgICAgOnN1bW1hcnk9XCJzdW1tYXJ5XCJcbiAgICAgIDp2YWx1ZT1cIm9wZW5cIlxuICAgICAgQGlucHV0PVwiY2hvb3NlXCJcbiAgICA+XG4gICAgICA8c2xvdCAvPlxuICAgIDwvdGFzay1mb2xkPlxuICAgIDxwXG4gICAgICB2LWlmPVwic3RvcmUuc3RhdGUuZXJyb3JcIlxuICAgICAgY2xhc3M9XCJwZXJzb25hbC1mb2xkX19lcnJvclwiXG4gICAgICByb2xlPVwic3RhdHVzXCJcbiAgICA+XG4gICAgICB7eyBzdG9yZS5zdGF0ZS5lcnJvciB9fVxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgQGNsaWNrPVwicmV0cnlcIlxuICAgICAgPlxuICAgICAgICBUcnkgYWdhaW5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvcD5cbiAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBUYXNrRm9sZCBmcm9tICcuL1Rhc2tGb2xkLnZ1ZSdcbmltcG9ydCB7IENvbnRyb2xQcmVmZXJlbmNlU3RvcmUsIFJFTUVNQkVSX0NPTlRST0xfRk9MRFMsIHR5cGUgUHJlZmVyZW5jZUNvbnRleHQgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvcHJlZmVyZW5jZXMnXG5pbXBvcnQgeyBjb250cm9sUHJlZmVyZW5jZVN0b3JlIH0gZnJvbSAnQC9zZXJ2aWNlcy9hY2NvdW50L2NvbnRyb2wtcHJlZmVyZW5jZXMnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgc3RvcmVkVG9rZW4gfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvYXBpJ1xuXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBUYXNrRm9sZCB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQZXJzb25hbFRhc2tGb2xkIGV4dGVuZHMgVnVlIHtcbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0pIHJlYWRvbmx5IHByaW50ZXJJZCE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgZm9sZEtleSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgZm9sZElkITogc3RyaW5nXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9KSByZWFkb25seSB0aXRsZSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSkgcmVhZG9ubHkgc3VtbWFyeSE6IHN0cmluZ1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCB9KSByZWFkb25seSBwcmVmZXJlbmNlcz86IENvbnRyb2xQcmVmZXJlbmNlU3RvcmVcbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pIHJlYWRvbmx5IGNob2ljZT86IGJvb2xlYW5cblxuICBnZXQgc3RvcmUgKCk6IENvbnRyb2xQcmVmZXJlbmNlU3RvcmUgeyByZXR1cm4gdGhpcy5wcmVmZXJlbmNlcyA/PyBjb250cm9sUHJlZmVyZW5jZVN0b3JlIH1cblxuICBnZXQgaWRlbnRpdHkgKCk6IHN0cmluZyB7IHJldHVybiBgJHtjbG91ZFN0YXRlLmFjY291bnQ/LmlkID8/ICcnfS8ke3RoaXMucHJpbnRlcklkfWAgfVxuICBnZXQgb3BlbiAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnN0b3JlLmlzU2VsZWN0ZWQodGhpcy5jb250ZXh0KCkpICYmIHRoaXMuc3RvcmUuc3RhdGUuZm9sZHNbdGhpcy5mb2xkS2V5XSA9PT0gdHJ1ZSB9XG5cbiAgY29udGV4dCAoKTogUHJlZmVyZW5jZUNvbnRleHQge1xuICAgIHJldHVybiB7IGFjY291bnRJZDogY2xvdWRTdGF0ZS5hY2NvdW50Py5pZCA/PyBudWxsLCBwcmludGVySWQ6IHRoaXMucHJpbnRlcklkIHx8IG51bGwsIHRva2VuOiBjbG91ZFN0YXRlLmFjY291bnQgPyBzdG9yZWRUb2tlbigpIDogbnVsbCB9XG4gIH1cblxuICBAV2F0Y2goJ2lkZW50aXR5JywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgcmVmcmVzaCAoKSB7IHJldHVybiB0aGlzLnN0b3JlLnNlbGVjdCh0aGlzLmNvbnRleHQoKSkgfVxuXG4gIG1vdW50ZWQgKCkge1xuICAgIGlmICghUkVNRU1CRVJfQ09OVFJPTF9GT0xEUykgdGhpcy5zdG9yZS5zZXRGb2xkKHRoaXMuZm9sZEtleSwgZmFsc2UpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5yZWZyZXNoKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLm9uVmlzaWJpbGl0eSlcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMucmVmcmVzaClcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5vblZpc2liaWxpdHkpXG4gIH1cblxuICBvblZpc2liaWxpdHkgKCkgeyBpZiAoIWRvY3VtZW50LmhpZGRlbikgdGhpcy5yZWZyZXNoKCkgfVxuICBjaG9vc2UgKG9wZW46IGJvb2xlYW4pIHsgdGhpcy5yZWZyZXNoKCk7IHJldHVybiB0aGlzLnN0b3JlLnNldEZvbGQodGhpcy5mb2xkS2V5LCBvcGVuKSB9XG4gIHJldHJ5ICgpIHsgdGhpcy5yZWZyZXNoKCk7IHJldHVybiB0aGlzLnN0b3JlLnJldHJ5KCkgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBzY29wZWQ+XG4gIC5wZXJzb25hbC1mb2xkX19lcnJvciB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgZm9udC1zaXplOiAxMnB4O1xuICB9XG5cbiAgLnBlcnNvbmFsLWZvbGRfX2Vycm9yIGJ1dHRvbiB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29udHJvbC9QZXJzb25hbFRhc2tGb2xkLnZ1ZSJ9