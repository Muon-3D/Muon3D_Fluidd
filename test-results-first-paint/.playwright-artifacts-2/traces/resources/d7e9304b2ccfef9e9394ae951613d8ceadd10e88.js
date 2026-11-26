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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
let ActionCommandPromptDialog = class extends Mixins(StateMixin) {
  get dialog() {
    return this.$store.state.console.promptDialog;
  }
  get open() {
    return this.dialog.open;
  }
  set open(value) {
    if (!value) {
      this.sendGcode('RESPOND TYPE=command MSG="action:prompt_end"');
    }
  }
  get eyebrow() {
    const name = printerNameParts(this.$store.getters["config/getDisplayName"] ?? "").name;
    return name ? `From ${name}` : "From the printer";
  }
  /** The macro's colour for a button: primary is the accent, error is red, the rest are plain. */
  tint(color, footer = false) {
    switch ((color ?? (footer ? "primary" : "")).toLowerCase()) {
      case "primary":
        return "cbtn--primary";
      case "error":
        return "cbtn--danger";
      case "warning":
        return "cbtn--warn";
      default:
        return "";
    }
  }
  handleClick(button) {
    this.sendGcode(button.command || button.text);
  }
};
ActionCommandPromptDialog = __decorateClass([
  Component({ components: { M3Dialog } })
], ActionCommandPromptDialog);
const _sfc_main = ActionCommandPromptDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "value": _vm.open, "eyebrow": _vm.eyebrow, "title": _vm.dialog.title || "The printer is asking", "max-width": "460", "content-class": "printer-prompt", "data-tid": "printer-prompt" }, on: { "close": function($event) {
    _vm.open = false;
  } }, scopedSlots: _vm._u([_vm.dialog.footerButtons.length ? { key: "actions", fn: function() {
    return _vm._l(_vm.dialog.footerButtons, function(button, index) {
      return _c("button", { key: `button-${index}`, staticClass: "cbtn", class: _vm.tint(button.color, true), attrs: { "type": "button", "data-tid": `printer-prompt-button-${index}` }, on: { "click": function($event) {
        return _vm.handleClick(button);
      } } }, [_vm._v(" " + _vm._s(button.text) + " ")]);
    });
  }, proxy: true } : null], null, true) }, [_vm._l(_vm.dialog.items, function(item, index) {
    return [item.type === "text" ? _c("p", { key: `item-${index}`, staticClass: "m3-dlg__text printer-prompt__text" }, [_vm._v(" " + _vm._s(item.text) + " ")]) : item.type === "button" ? _c("button", { key: `item-${index}`, staticClass: "cbtn cbtn--wide", class: _vm.tint(item.color), attrs: { "type": "button", "data-tid": `printer-prompt-item-${index}` }, on: { "click": function($event) {
      return _vm.handleClick(item);
    } } }, [_vm._v(" " + _vm._s(item.text) + " ")]) : _vm._e()];
  })], 2);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/common/ActionCommandPromptDialog.vue?vue&type=style&index=0&scoped=4d5115e2&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "4d5115e2",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/ActionCommandPromptDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFtREE7QUFDQTtBQUVBO0FBQ0E7QUFTQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFDQTtBQUFBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFqQ0E7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQWN0aW9uQ29tbWFuZFByb21wdERpYWxvZy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8bTMtZGlhbG9nXG4gICAgOnZhbHVlPVwib3BlblwiXG4gICAgOmV5ZWJyb3c9XCJleWVicm93XCJcbiAgICA6dGl0bGU9XCJkaWFsb2cudGl0bGUgfHwgJ1RoZSBwcmludGVyIGlzIGFza2luZydcIlxuICAgIG1heC13aWR0aD1cIjQ2MFwiXG4gICAgY29udGVudC1jbGFzcz1cInByaW50ZXItcHJvbXB0XCJcbiAgICBkYXRhLXRpZD1cInByaW50ZXItcHJvbXB0XCJcbiAgICBAY2xvc2U9XCJvcGVuID0gZmFsc2VcIlxuICA+XG4gICAgPHRlbXBsYXRlIHYtZm9yPVwiKGl0ZW0sIGluZGV4KSBpbiBkaWFsb2cuaXRlbXNcIj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCJpdGVtLnR5cGUgPT09ICd0ZXh0J1wiXG4gICAgICAgIDprZXk9XCJgaXRlbS0ke2luZGV4fWBcIlxuICAgICAgICBjbGFzcz1cIm0zLWRsZ19fdGV4dCBwcmludGVyLXByb21wdF9fdGV4dFwiXG4gICAgICA+XG4gICAgICAgIHt7IGl0ZW0udGV4dCB9fVxuICAgICAgPC9wPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB2LWVsc2UtaWY9XCJpdGVtLnR5cGUgPT09ICdidXR0b24nXCJcbiAgICAgICAgOmtleT1cImBpdGVtLSR7aW5kZXh9YFwiXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0td2lkZVwiXG4gICAgICAgIDpjbGFzcz1cInRpbnQoaXRlbS5jb2xvcilcIlxuICAgICAgICA6ZGF0YS10aWQ9XCJgcHJpbnRlci1wcm9tcHQtaXRlbS0ke2luZGV4fWBcIlxuICAgICAgICBAY2xpY2s9XCJoYW5kbGVDbGljayhpdGVtKVwiXG4gICAgICA+XG4gICAgICAgIHt7IGl0ZW0udGV4dCB9fVxuICAgICAgPC9idXR0b24+XG4gICAgPC90ZW1wbGF0ZT5cblxuICAgIDx0ZW1wbGF0ZVxuICAgICAgdi1pZj1cImRpYWxvZy5mb290ZXJCdXR0b25zLmxlbmd0aFwiXG4gICAgICAjYWN0aW9uc1xuICAgID5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1mb3I9XCIoYnV0dG9uLCBpbmRleCkgaW4gZGlhbG9nLmZvb3RlckJ1dHRvbnNcIlxuICAgICAgICA6a2V5PVwiYGJ1dHRvbi0ke2luZGV4fWBcIlxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuXCJcbiAgICAgICAgOmNsYXNzPVwidGludChidXR0b24uY29sb3IsIHRydWUpXCJcbiAgICAgICAgOmRhdGEtdGlkPVwiYHByaW50ZXItcHJvbXB0LWJ1dHRvbi0ke2luZGV4fWBcIlxuICAgICAgICBAY2xpY2s9XCJoYW5kbGVDbGljayhidXR0b24pXCJcbiAgICAgID5cbiAgICAgICAge3sgYnV0dG9uLnRleHQgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvbTMtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJ0AvbWl4aW5zL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBQcm9tcHREaWFsb2csIFByb21wdERpYWxvZ0J1dHRvbiB9IGZyb20gJ0Avc3RvcmUvY29uc29sZS90eXBlcydcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMgfSBmcm9tICdAL3V0aWwvcHJpbnRlci1uYW1lJ1xuaW1wb3J0IE0zRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy91aS9NM0RpYWxvZy52dWUnXG5cbi8qKlxuICogQSBxdWVzdGlvbiB0aGUgcHJpbnRlciBhc2tzIChLbGlwcGVyJ3MgYWN0aW9uOnByb21wdCwgd2hpY2ggdGhlIE0xJ3NcbiAqIG1hY3JvcyB1c2U6IGxvYWRpbmcgZmlsYW1lbnQsIGEgZmFuIGVycm9yLCB0aGUgcGxhdGUgdGFrZW4gb2ZmIG1pZC1wcmludCksXG4gKiBpbiB0aGUgcmVkZXNpZ24ncyBkaWFsb2cuIEl0cyB3b3JkcyBhcmUgdGhlIG1hY3JvJ3Mgb3duLiDinJUsIEVzYyBhbmQgYVxuICogY2xpY2sgb3V0c2lkZSBlbmQgdGhlIHByb21wdCwgYXMgS2xpcHBlcidzIHByb21wdF9lbmQgZG9lcy5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTTNEaWFsb2cgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQWN0aW9uQ29tbWFuZFByb21wdERpYWxvZyBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluKSB7XG4gIGdldCBkaWFsb2cgKCk6IFByb21wdERpYWxvZyB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUucHJvbXB0RGlhbG9nIGFzIFByb21wdERpYWxvZ1xuICB9XG5cbiAgZ2V0IG9wZW4gKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRpYWxvZy5vcGVuXG4gIH1cblxuICBzZXQgb3BlbiAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICB0aGlzLnNlbmRHY29kZSgnUkVTUE9ORCBUWVBFPWNvbW1hbmQgTVNHPVwiYWN0aW9uOnByb21wdF9lbmRcIicpXG4gICAgfVxuICB9XG5cbiAgZ2V0IGV5ZWJyb3cgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbmFtZSA9IHByaW50ZXJOYW1lUGFydHMoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXREaXNwbGF5TmFtZSddIGFzIHN0cmluZykgPz8gJycpLm5hbWVcbiAgICByZXR1cm4gbmFtZSA/IGBGcm9tICR7bmFtZX1gIDogJ0Zyb20gdGhlIHByaW50ZXInXG4gIH1cblxuICAvKiogVGhlIG1hY3JvJ3MgY29sb3VyIGZvciBhIGJ1dHRvbjogcHJpbWFyeSBpcyB0aGUgYWNjZW50LCBlcnJvciBpcyByZWQsIHRoZSByZXN0IGFyZSBwbGFpbi4gKi9cbiAgdGludCAoY29sb3I6IHN0cmluZyB8IHVuZGVmaW5lZCwgZm9vdGVyID0gZmFsc2UpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoKGNvbG9yID8/IChmb290ZXIgPyAncHJpbWFyeScgOiAnJykpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgJ3ByaW1hcnknOiByZXR1cm4gJ2NidG4tLXByaW1hcnknXG4gICAgICBjYXNlICdlcnJvcic6IHJldHVybiAnY2J0bi0tZGFuZ2VyJ1xuICAgICAgY2FzZSAnd2FybmluZyc6IHJldHVybiAnY2J0bi0td2FybidcbiAgICAgIGRlZmF1bHQ6IHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUNsaWNrIChidXR0b246IFByb21wdERpYWxvZ0J1dHRvbikge1xuICAgIHRoaXMuc2VuZEdjb2RlKGJ1dHRvbi5jb21tYW5kIHx8IGJ1dHRvbi50ZXh0KVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucHJpbnRlci1wcm9tcHRfX3RleHQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb21tb24vQWN0aW9uQ29tbWFuZFByb21wdERpYWxvZy52dWUifQ==