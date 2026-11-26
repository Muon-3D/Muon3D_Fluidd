/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Dialog.vue";
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
import M3Dialog from "/src/components/ui/M3Dialog.vue";
let QuickCommandDialog = class extends Vue {
  value;
  quick;
  command = "";
  label = "";
  send = true;
  options = [
    { send: true, title: "Send it", sub: "One tap runs it" },
    { send: false, title: "Put it in the input", sub: "To edit before sending" }
  ];
  get editing() {
    return !!this.quick?.id;
  }
  onOpen(open) {
    if (!open) return;
    this.command = this.quick?.command ?? "";
    this.label = this.quick?.label ?? "";
    this.send = this.quick?.send ?? true;
  }
  save() {
    if (!this.command.trim()) return;
    this.$emit("save", { id: this.quick?.id ?? "", command: this.command, label: this.label, send: this.send });
    this.$emit("input", false);
  }
};
__decorateClass([
  Prop({ type: Boolean })
], QuickCommandDialog.prototype, "value", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], QuickCommandDialog.prototype, "quick", 2);
__decorateClass([
  Watch("value", { immediate: true })
], QuickCommandDialog.prototype, "onOpen", 1);
QuickCommandDialog = __decorateClass([
  Component({ components: { M3Dialog } })
], QuickCommandDialog);
const _sfc_main = QuickCommandDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.value, "eyebrow": "Quick command", "title": _vm.editing ? "Edit the quick command" : "Add a quick command", "max-width": "460", "data-tid": "quick-command-dialog" }, on: { "input": function($event) {
    return _vm.$emit("input", $event);
  }, "close": function($event) {
    return _vm.$emit("input", false);
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": function($event) {
      return _vm.$emit("input", false);
    } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary dlg-pri", attrs: { "type": "button", "disabled": !_vm.command.trim(), "data-tid": "quick-command-save" }, on: { "click": _vm.save } }, [_vm._v(" " + _vm._s(_vm.editing ? "Save" : "Add") + " ")])];
  }, proxy: true }]) }, [_c("form", { staticClass: "qcd", on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.save.apply(null, arguments);
  } } }, [_c("label", { staticClass: "qcd__lbl" }, [_vm._v(" Command "), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.command, expression: "command" }], staticClass: "qcd__field qcd__field--mono", attrs: { "spellcheck": "false", "autocomplete": "off", "placeholder": "BED_MESH_CALIBRATE PROFILE=pla", "data-tid": "quick-command-command" }, domProps: { "value": _vm.command }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.command = $event.target.value;
  } } })]), _c("label", { staticClass: "qcd__lbl" }, [_vm._v(" Label on the chip "), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.label, expression: "label" }], staticClass: "qcd__field", attrs: { "placeholder": _vm.command.trim() || "Mesh (PLA)", "data-tid": "quick-command-label" }, domProps: { "value": _vm.label }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.label = $event.target.value;
  } } })]), _c("div", { staticClass: "qcd__lbl", attrs: { "role": "radiogroup", "aria-label": "When tapped" } }, [_vm._v(" When tapped "), _c("div", { staticClass: "qcd__opts" }, _vm._l(_vm.options, function(o) {
    return _c("button", { key: String(o.send), staticClass: "qcd__opt", class: { "qcd__opt--on": _vm.send === o.send }, attrs: { "type": "button", "role": "radio", "aria-checked": _vm.send === o.send ? "true" : "false" }, on: { "click": function($event) {
      _vm.send = o.send;
    } } }, [_c("b", [_vm._v(_vm._s(o.title))]), _c("span", [_vm._v(_vm._s(o.sub))])]);
  }), 0)]), _vm.editing ? _c("button", { staticClass: "qcd__remove", attrs: { "type": "button", "data-tid": "quick-command-remove" }, on: { "click": function($event) {
    _vm.$emit("remove", _vm.quick);
    _vm.$emit("input", false);
  } } }, [_vm._v(" Remove this quick command ")]) : _vm._e()])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/console/QuickCommandDialog.vue?vue&type=style&index=0&scoped=9d9c1e30&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9d9c1e30",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/console/QuickCommandDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF3RkE7QUFDQTtBQUtBO0FBQUEsRUFFQTtBQUFBLEVBSUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBaENBO0FBQUEsRUFEQTtBQUFBLEdBREEsbUJBRUE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQUxBLG1CQU1BO0FBZ0JBO0FBQUEsRUFEQTtBQUFBLEdBckJBLG1CQXNCQTtBQXRCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJRdWlja0NvbW1hbmREaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPG0zLWRpYWxvZ1xuICAgIDp2YWx1ZT1cInZhbHVlXCJcbiAgICBleWVicm93PVwiUXVpY2sgY29tbWFuZFwiXG4gICAgOnRpdGxlPVwiZWRpdGluZyA/ICdFZGl0IHRoZSBxdWljayBjb21tYW5kJyA6ICdBZGQgYSBxdWljayBjb21tYW5kJ1wiXG4gICAgbWF4LXdpZHRoPVwiNDYwXCJcbiAgICBkYXRhLXRpZD1cInF1aWNrLWNvbW1hbmQtZGlhbG9nXCJcbiAgICBAaW5wdXQ9XCIkZW1pdCgnaW5wdXQnLCAkZXZlbnQpXCJcbiAgICBAY2xvc2U9XCIkZW1pdCgnaW5wdXQnLCBmYWxzZSlcIlxuICA+XG4gICAgPGZvcm1cbiAgICAgIGNsYXNzPVwicWNkXCJcbiAgICAgIEBzdWJtaXQucHJldmVudD1cInNhdmVcIlxuICAgID5cbiAgICAgIDxsYWJlbCBjbGFzcz1cInFjZF9fbGJsXCI+XG4gICAgICAgIENvbW1hbmRcbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdi1tb2RlbD1cImNvbW1hbmRcIlxuICAgICAgICAgIGNsYXNzPVwicWNkX19maWVsZCBxY2RfX2ZpZWxkLS1tb25vXCJcbiAgICAgICAgICBzcGVsbGNoZWNrPVwiZmFsc2VcIlxuICAgICAgICAgIGF1dG9jb21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgcGxhY2Vob2xkZXI9XCJCRURfTUVTSF9DQUxJQlJBVEUgUFJPRklMRT1wbGFcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicXVpY2stY29tbWFuZC1jb21tYW5kXCJcbiAgICAgICAgPlxuICAgICAgPC9sYWJlbD5cbiAgICAgIDxsYWJlbCBjbGFzcz1cInFjZF9fbGJsXCI+XG4gICAgICAgIExhYmVsIG9uIHRoZSBjaGlwXG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIHYtbW9kZWw9XCJsYWJlbFwiXG4gICAgICAgICAgY2xhc3M9XCJxY2RfX2ZpZWxkXCJcbiAgICAgICAgICA6cGxhY2Vob2xkZXI9XCJjb21tYW5kLnRyaW0oKSB8fCAnTWVzaCAoUExBKSdcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicXVpY2stY29tbWFuZC1sYWJlbFwiXG4gICAgICAgID5cbiAgICAgIDwvbGFiZWw+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwicWNkX19sYmxcIlxuICAgICAgICByb2xlPVwicmFkaW9ncm91cFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJXaGVuIHRhcHBlZFwiXG4gICAgICA+XG4gICAgICAgIFdoZW4gdGFwcGVkXG4gICAgICAgIDxkaXYgY2xhc3M9XCJxY2RfX29wdHNcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB2LWZvcj1cIm8gaW4gb3B0aW9uc1wiXG4gICAgICAgICAgICA6a2V5PVwiU3RyaW5nKG8uc2VuZClcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICByb2xlPVwicmFkaW9cIlxuICAgICAgICAgICAgY2xhc3M9XCJxY2RfX29wdFwiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdxY2RfX29wdC0tb24nOiBzZW5kID09PSBvLnNlbmQgfVwiXG4gICAgICAgICAgICA6YXJpYS1jaGVja2VkPVwic2VuZCA9PT0gby5zZW5kID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICBAY2xpY2s9XCJzZW5kID0gby5zZW5kXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Yj57eyBvLnRpdGxlIH19PC9iPlxuICAgICAgICAgICAgPHNwYW4+e3sgby5zdWIgfX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHYtaWY9XCJlZGl0aW5nXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwicWNkX19yZW1vdmVcIlxuICAgICAgICBkYXRhLXRpZD1cInF1aWNrLWNvbW1hbmQtcmVtb3ZlXCJcbiAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ3JlbW92ZScsIHF1aWNrKTsgJGVtaXQoJ2lucHV0JywgZmFsc2UpXCJcbiAgICAgID5cbiAgICAgICAgUmVtb3ZlIHRoaXMgcXVpY2sgY29tbWFuZFxuICAgICAgPC9idXR0b24+XG4gICAgPC9mb3JtPlxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgIEBjbGljaz1cIiRlbWl0KCdpbnB1dCcsIGZhbHNlKVwiXG4gICAgICA+XG4gICAgICAgIENhbmNlbFxuICAgICAgPC9idXR0b24+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeSBkbGctcHJpXCJcbiAgICAgICAgOmRpc2FibGVkPVwiIWNvbW1hbmQudHJpbSgpXCJcbiAgICAgICAgZGF0YS10aWQ9XCJxdWljay1jb21tYW5kLXNhdmVcIlxuICAgICAgICBAY2xpY2s9XCJzYXZlXCJcbiAgICAgID5cbiAgICAgICAge3sgZWRpdGluZyA/ICdTYXZlJyA6ICdBZGQnIH19XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L3RlbXBsYXRlPlxuICA8L20zLWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IE0zRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy91aS9NM0RpYWxvZy52dWUnXG5pbXBvcnQgdHlwZSB7IFF1aWNrQ29tbWFuZCB9IGZyb20gJ0Avc2VydmljZXMvY29uc29sZS9zZXR0aW5ncydcblxuLyoqIEFkZHMgb3IgZWRpdHMgb25lIGNoaXAgYWJvdmUgdGhlIENvbnNvbGUncyBpbnB1dC4gKi9cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE0zRGlhbG9nIH0gfSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFF1aWNrQ29tbWFuZERpYWxvZyBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSB2YWx1ZSE6IGJvb2xlYW5cblxuICAvKiogVGhlIGNoaXAgYmVpbmcgZWRpdGVkOyBudWxsIGFkZHMgb25lLiAqL1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgZGVmYXVsdDogbnVsbCB9KVxuICByZWFkb25seSBxdWljayE6IFF1aWNrQ29tbWFuZCB8IG51bGxcblxuICBjb21tYW5kID0gJydcbiAgbGFiZWwgPSAnJ1xuICBzZW5kID0gdHJ1ZVxuXG4gIHJlYWRvbmx5IG9wdGlvbnMgPSBbXG4gICAgeyBzZW5kOiB0cnVlLCB0aXRsZTogJ1NlbmQgaXQnLCBzdWI6ICdPbmUgdGFwIHJ1bnMgaXQnIH0sXG4gICAgeyBzZW5kOiBmYWxzZSwgdGl0bGU6ICdQdXQgaXQgaW4gdGhlIGlucHV0Jywgc3ViOiAnVG8gZWRpdCBiZWZvcmUgc2VuZGluZycgfVxuICBdXG5cbiAgZ2V0IGVkaXRpbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMucXVpY2s/LmlkXG4gIH1cblxuICBAV2F0Y2goJ3ZhbHVlJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25PcGVuIChvcGVuOiBib29sZWFuKSB7XG4gICAgaWYgKCFvcGVuKSByZXR1cm5cbiAgICB0aGlzLmNvbW1hbmQgPSB0aGlzLnF1aWNrPy5jb21tYW5kID8/ICcnXG4gICAgdGhpcy5sYWJlbCA9IHRoaXMucXVpY2s/LmxhYmVsID8/ICcnXG4gICAgdGhpcy5zZW5kID0gdGhpcy5xdWljaz8uc2VuZCA/PyB0cnVlXG4gIH1cblxuICBzYXZlICgpIHtcbiAgICBpZiAoIXRoaXMuY29tbWFuZC50cmltKCkpIHJldHVyblxuICAgIHRoaXMuJGVtaXQoJ3NhdmUnLCB7IGlkOiB0aGlzLnF1aWNrPy5pZCA/PyAnJywgY29tbWFuZDogdGhpcy5jb21tYW5kLCBsYWJlbDogdGhpcy5sYWJlbCwgc2VuZDogdGhpcy5zZW5kIH0pXG4gICAgdGhpcy4kZW1pdCgnaW5wdXQnLCBmYWxzZSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLy8gVGhlIHN0b3J5Ym9hcmQncyBzaGVldDogQ2FuY2VsLCB0aGVuIHRoZSBhY3Rpb24gYWNyb3NzIHRoZSByZXN0IG9mIHRoZSByb3cuXG4gIC5kbGctcHJpIHtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgfVxuXG4gIC5xY2Qge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE0cHg7XG4gIH1cblxuICAucWNkX19sYmwge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDZweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICB9XG5cbiAgLnFjZF9fZmllbGQge1xuICAgIGhlaWdodDogNDJweDtcbiAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQ6IGluaGVyaXQ7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA0MDA7XG4gICAgb3V0bGluZTogbm9uZTtcblxuICAgICY6Zm9jdXMtdmlzaWJsZSB7IGJveC1zaGFkb3c6IDAgMCAwIDJweCB2YXIoLS1tM2QtYWNjZW50KTsgfVxuICB9XG5cbiAgLnFjZF9fZmllbGQtLW1vbm8ge1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vLCBtb25vc3BhY2UpO1xuICB9XG5cbiAgLnFjZF9fb3B0cyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7XG4gICAgZ2FwOiA4cHg7XG4gIH1cblxuICAucWNkX19vcHQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDJweDtcbiAgICBwYWRkaW5nOiAxMHB4IDEycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG5cbiAgICBiIHsgZm9udC1zaXplOiAxNHB4OyB9XG5cbiAgICBzcGFuIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICBmb250LXdlaWdodDogNDAwO1xuICAgIH1cbiAgfVxuXG4gIC5xY2RfX29wdC0tb24ge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMTI4LCAyMTQsIDIwOSwgMC4xNCk7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDAgMXB4IHJnYmEoMTI4LCAyMTQsIDIwOSwgMC41KTtcbiAgfVxuXG4gIC5xY2RfX3JlbW92ZSB7XG4gICAgYWxpZ24tc2VsZjogZmxleC1zdGFydDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWRhbmdlcik7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9jb25zb2xlL1F1aWNrQ29tbWFuZERpYWxvZy52dWUifQ==