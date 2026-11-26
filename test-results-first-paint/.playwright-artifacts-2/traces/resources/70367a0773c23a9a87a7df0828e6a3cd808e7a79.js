/* unplugin-vue-components disabled */import { VProgressCircular as __unplugin_components_8 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VSpacer as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardActions as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/AppInlineHelp.vue";
import { VCardTitle as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCard as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VForm as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VDialog as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import BrowserMixin from "/src/mixins/browser.ts";
import { Component, Prop, VModel, Ref, PropSync, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let AppDialog = class extends Mixins(BrowserMixin) {
  open;
  disabled;
  title;
  helpTooltip;
  subTitle;
  closeButtonDisabled;
  cancelButtonText;
  cancelButtonLoading;
  saveButtonText;
  saveButtonDisabled;
  saveButtonLoading;
  scrollable;
  noActions;
  loading;
  titleShadow;
  validModel;
  form;
  get hasSubTitleSlot() {
    return !!this.$slots["sub-title"] || !!this.$scopedSlots["sub-title"];
  }
  validate() {
    return this.form.validate();
  }
  handleCancel() {
    if (this.$listeners.cancel) {
      this.$emit("cancel");
    } else {
      this.open = false;
    }
  }
  handleSave() {
    if (this.validate()) {
      this.$emit("save");
    }
  }
};
__decorateClass([
  VModel({ type: Boolean })
], AppDialog.prototype, "open", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: String })
], AppDialog.prototype, "title", 2);
__decorateClass([
  Prop({ type: String })
], AppDialog.prototype, "helpTooltip", 2);
__decorateClass([
  Prop({ type: String })
], AppDialog.prototype, "subTitle", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "closeButtonDisabled", 2);
__decorateClass([
  Prop({ type: String })
], AppDialog.prototype, "cancelButtonText", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "cancelButtonLoading", 2);
__decorateClass([
  Prop({ type: String })
], AppDialog.prototype, "saveButtonText", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "saveButtonDisabled", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "saveButtonLoading", 2);
__decorateClass([
  Prop({ type: Boolean, default: true })
], AppDialog.prototype, "scrollable", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "noActions", 2);
__decorateClass([
  Prop({ type: [Boolean, String] })
], AppDialog.prototype, "loading", 2);
__decorateClass([
  Prop({ type: Boolean })
], AppDialog.prototype, "titleShadow", 2);
__decorateClass([
  PropSync("valid", { type: Boolean })
], AppDialog.prototype, "validModel", 2);
__decorateClass([
  Ref("form")
], AppDialog.prototype, "form", 2);
AppDialog = __decorateClass([
  Component({})
], AppDialog);
const _sfc_main = AppDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, _vm._b({ attrs: { "scrollable": _vm.scrollable, "fullscreen": _vm.isMobileViewport, "transition": _vm.isMobileViewport ? "dialog-bottom-transition" : void 0, "content-class": "app-dlg-frame" }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, "v-dialog", _vm.$attrs, false), [_c(__unplugin_components_1, { ref: "form", attrs: { "disabled": _vm.disabled }, on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.handleSave.apply(null, arguments);
  } }, model: { value: _vm.validModel, callback: function($$v) {
    _vm.validModel = $$v;
  }, expression: "validModel" } }, [_c(__unplugin_components_2, { staticClass: "app-dlg", attrs: { "loading": _vm.loading } }, [_c(__unplugin_components_3, { staticClass: "app-dlg__head" }, [_c("div", { staticClass: "app-dlg__titles" }, [_c("h2", { staticClass: "app-dlg__title" }, [_vm._t("title", function() {
    return [_vm._v(" " + _vm._s(_vm.title) + " "), _vm.helpTooltip ? _c(__unplugin_components_4, { attrs: { "bottom": "", "small": "", "tooltip": _vm.helpTooltip } }) : _vm._e()];
  })], 2), _vm.subTitle || _vm.hasSubTitleSlot ? _c("p", { staticClass: "app-dlg__sub" }, [_vm._t("sub-title", function() {
    return [_vm._v(" " + _vm._s(_vm.subTitle) + " ")];
  })], 2) : _vm._e()]), _vm._t("menu"), _c("button", { staticClass: "m3-dlg__close", attrs: { "type": "button", "aria-label": "Close", "disabled": _vm.closeButtonDisabled, "data-tid": "app-dialog-close" }, on: { "click": function($event) {
    _vm.open = false;
  } } }, [_c(__unplugin_components_5, { attrs: { "name": "x" } })], 1)], 2), _vm._t("default"), !_vm.noActions ? _c(__unplugin_components_6, { staticClass: "app-dlg__actions" }, [_vm._t("actions", function() {
    return [_c(__unplugin_components_7), _c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button", "disabled": _vm.cancelButtonLoading, "data-tid": "app-dialog-cancel" }, on: { "click": _vm.handleCancel } }, [_vm._v(" " + _vm._s(_vm.cancelButtonText || _vm.$t("app.general.btn.cancel")) + " ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "submit", "disabled": _vm.saveButtonDisabled || _vm.saveButtonLoading, "data-tid": "app-dialog-save" } }, [_vm.saveButtonLoading ? _c(__unplugin_components_8, { attrs: { "indeterminate": "", "size": "16", "width": "2" } }) : _vm._e(), _vm._v(" " + _vm._s(_vm.saveButtonText || _vm.$t("app.general.btn.save")) + " ")], 1)];
  })], 2) : _vm._e()], 2)], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/ui/AppDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStGQTtBQUVBO0FBU0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBSUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFDQTtBQXhFQTtBQUFBLEVBREE7QUFBQSxHQURBLFVBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLFVBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLFVBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLFVBV0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWJBLFVBY0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWhCQSxVQWlCQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBbkJBLFVBb0JBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0F0QkEsVUF1QkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQXpCQSxVQTBCQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBNUJBLFVBNkJBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0EvQkEsVUFnQ0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWxDQSxVQW1DQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBckNBLFVBc0NBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0F4Q0EsVUF5Q0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQTVDQSxVQTZDQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBL0NBLFVBZ0RBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FsREEsVUFtREE7QUFuREE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwRGlhbG9nLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWRpYWxvZ1xuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICA6c2Nyb2xsYWJsZT1cInNjcm9sbGFibGVcIlxuICAgIHYtYmluZD1cIiRhdHRyc1wiXG4gICAgOmZ1bGxzY3JlZW49XCJpc01vYmlsZVZpZXdwb3J0XCJcbiAgICA6dHJhbnNpdGlvbj1cImlzTW9iaWxlVmlld3BvcnQgPyAnZGlhbG9nLWJvdHRvbS10cmFuc2l0aW9uJyA6IHVuZGVmaW5lZFwiXG4gICAgY29udGVudC1jbGFzcz1cImFwcC1kbGctZnJhbWVcIlxuICA+XG4gICAgPHYtZm9ybVxuICAgICAgcmVmPVwiZm9ybVwiXG4gICAgICB2LW1vZGVsPVwidmFsaWRNb2RlbFwiXG4gICAgICA6ZGlzYWJsZWQ9XCJkaXNhYmxlZFwiXG4gICAgICBAc3VibWl0LnByZXZlbnQ9XCJoYW5kbGVTYXZlXCJcbiAgICA+XG4gICAgICA8di1jYXJkXG4gICAgICAgIGNsYXNzPVwiYXBwLWRsZ1wiXG4gICAgICAgIDpsb2FkaW5nPVwibG9hZGluZ1wiXG4gICAgICA+XG4gICAgICAgIDx2LWNhcmQtdGl0bGUgY2xhc3M9XCJhcHAtZGxnX19oZWFkXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImFwcC1kbGdfX3RpdGxlc1wiPlxuICAgICAgICAgICAgPGgyIGNsYXNzPVwiYXBwLWRsZ19fdGl0bGVcIj5cbiAgICAgICAgICAgICAgPHNsb3QgbmFtZT1cInRpdGxlXCI+XG4gICAgICAgICAgICAgICAge3sgdGl0bGUgfX1cbiAgICAgICAgICAgICAgICA8YXBwLWlubGluZS1oZWxwXG4gICAgICAgICAgICAgICAgICB2LWlmPVwiaGVscFRvb2x0aXBcIlxuICAgICAgICAgICAgICAgICAgYm90dG9tXG4gICAgICAgICAgICAgICAgICBzbWFsbFxuICAgICAgICAgICAgICAgICAgOnRvb2x0aXA9XCJoZWxwVG9vbHRpcFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9zbG90PlxuICAgICAgICAgICAgPC9oMj5cbiAgICAgICAgICAgIDxwXG4gICAgICAgICAgICAgIHYtaWY9XCJzdWJUaXRsZSB8fCBoYXNTdWJUaXRsZVNsb3RcIlxuICAgICAgICAgICAgICBjbGFzcz1cImFwcC1kbGdfX3N1YlwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxzbG90IG5hbWU9XCJzdWItdGl0bGVcIj5cbiAgICAgICAgICAgICAgICB7eyBzdWJUaXRsZSB9fVxuICAgICAgICAgICAgICA8L3Nsb3Q+XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8c2xvdCBuYW1lPVwibWVudVwiIC8+XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwibTMtZGxnX19jbG9zZVwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiQ2xvc2VcIlxuICAgICAgICAgICAgOmRpc2FibGVkPVwiY2xvc2VCdXR0b25EaXNhYmxlZFwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cImFwcC1kaWFsb2ctY2xvc2VcIlxuICAgICAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwieFwiIC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvdi1jYXJkLXRpdGxlPlxuXG4gICAgICAgIDxzbG90IC8+XG5cbiAgICAgICAgPHYtY2FyZC1hY3Rpb25zXG4gICAgICAgICAgdi1pZj1cIiFub0FjdGlvbnNcIlxuICAgICAgICAgIGNsYXNzPVwiYXBwLWRsZ19fYWN0aW9uc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8c2xvdCBuYW1lPVwiYWN0aW9uc1wiPlxuICAgICAgICAgICAgPHYtc3BhY2VyIC8+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJjYW5jZWxCdXR0b25Mb2FkaW5nXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJhcHAtZGlhbG9nLWNhbmNlbFwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImhhbmRsZUNhbmNlbFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt7IGNhbmNlbEJ1dHRvblRleHQgfHwgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5jYW5jZWwnKSB9fVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cInNhdmVCdXR0b25EaXNhYmxlZCB8fCBzYXZlQnV0dG9uTG9hZGluZ1wiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwiYXBwLWRpYWxvZy1zYXZlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXJcbiAgICAgICAgICAgICAgICB2LWlmPVwic2F2ZUJ1dHRvbkxvYWRpbmdcIlxuICAgICAgICAgICAgICAgIGluZGV0ZXJtaW5hdGVcbiAgICAgICAgICAgICAgICBzaXplPVwiMTZcIlxuICAgICAgICAgICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIHt7IHNhdmVCdXR0b25UZXh0IHx8ICR0KCdhcHAuZ2VuZXJhbC5idG4uc2F2ZScpIH19XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L3Nsb3Q+XG4gICAgICAgIDwvdi1jYXJkLWFjdGlvbnM+XG4gICAgICA8L3YtY2FyZD5cbiAgICA8L3YtZm9ybT5cbiAgPC92LWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgdHlwZSB7IFZGb3JtIH0gZnJvbSAnQC90eXBlcydcbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgVk1vZGVsLCBSZWYsIFByb3BTeW5jLCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG4vKipcbiAqIEZsdWlkZCdzIGZvcm0gZGlhbG9nIChhIHRpdGxlLCDinJUsIHdoYXQncyBpbnNpZGUsIENhbmNlbCBhbmQgU2F2ZSksIGRyYXduXG4gKiBhcyB0aGUgcmVkZXNpZ24ncyBkaWFsb2dzIGFyZSAoTTNEaWFsb2cpOiB0aGUgdGl0bGUgbGFyZ2Ugb3ZlciB0aGUgcGFnZSdzXG4gKiBzdXJmYWNlLCBubyBydWxlcyBiZXR3ZWVuIHRoZSBwYXJ0cywgcm91bmQgYnV0dG9ucy4gRXZlcnkgZGlhbG9nIGJ1aWx0IG9uXG4gKiBpdCAocmVuYW1pbmcgYSBmaWxlLCBhIG5ldyBmb2xkZXIsIHRoZSBwcmludGVyJ3Mgc2V0dGluZ3MpIGZvbGxvd3MuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHBEaWFsb2cgZXh0ZW5kcyBNaXhpbnMoQnJvd3Nlck1peGluKSB7XG4gIEBWTW9kZWwoeyB0eXBlOiBCb29sZWFuIH0pXG4gICAgb3Blbj86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgZGlzYWJsZWQ/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgdGl0bGU/OiBzdHJpbmdcblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZyB9KVxuICByZWFkb25seSBoZWxwVG9vbHRpcD86IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nIH0pXG4gIHJlYWRvbmx5IHN1YlRpdGxlPzogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGNsb3NlQnV0dG9uRGlzYWJsZWQ/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgY2FuY2VsQnV0dG9uVGV4dD86IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBjYW5jZWxCdXR0b25Mb2FkaW5nPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nIH0pXG4gIHJlYWRvbmx5IHNhdmVCdXR0b25UZXh0Pzogc3RyaW5nXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNhdmVCdXR0b25EaXNhYmxlZD86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgc2F2ZUJ1dHRvbkxvYWRpbmc/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiB0cnVlIH0pXG4gIHJlYWRvbmx5IHNjcm9sbGFibGU/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IG5vQWN0aW9ucz86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IFtCb29sZWFuLCBTdHJpbmddIH0pXG4gIHJlYWRvbmx5IGxvYWRpbmc/OiBib29sZWFuIHwgc3RyaW5nXG5cbiAgLyoqIEtlcHQgZm9yIGNhbGxlcnMgdGhhdCBwYXNzIGl0OiB0aGUgcmVkZXNpZ24ncyBoZWFkZXIgaGFzIG5vIHJ1bGUgdG8gY2FzdCBhIHNoYWRvdy4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHRpdGxlU2hhZG93PzogYm9vbGVhblxuXG4gIEBQcm9wU3luYygndmFsaWQnLCB7IHR5cGU6IEJvb2xlYW4gfSlcbiAgICB2YWxpZE1vZGVsPzogYm9vbGVhblxuXG4gIEBSZWYoJ2Zvcm0nKVxuICByZWFkb25seSBmb3JtITogVkZvcm1cblxuICBnZXQgaGFzU3ViVGl0bGVTbG90ICgpIHtcbiAgICByZXR1cm4gISF0aGlzLiRzbG90c1snc3ViLXRpdGxlJ10gfHwgISF0aGlzLiRzY29wZWRTbG90c1snc3ViLXRpdGxlJ11cbiAgfVxuXG4gIHZhbGlkYXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5mb3JtLnZhbGlkYXRlKClcbiAgfVxuXG4gIGhhbmRsZUNhbmNlbCAoKSB7XG4gICAgaWYgKHRoaXMuJGxpc3RlbmVycy5jYW5jZWwpIHtcbiAgICAgIHRoaXMuJGVtaXQoJ2NhbmNlbCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbiA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgaGFuZGxlU2F2ZSAoKSB7XG4gICAgaWYgKHRoaXMudmFsaWRhdGUoKSkge1xuICAgICAgdGhpcy4kZW1pdCgnc2F2ZScpXG4gICAgfVxuICB9XG59XG48L3NjcmlwdD5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3VpL0FwcERpYWxvZy52dWUifQ==