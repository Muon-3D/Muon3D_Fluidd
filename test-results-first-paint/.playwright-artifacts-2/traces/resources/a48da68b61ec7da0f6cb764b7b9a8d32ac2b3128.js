/* unplugin-vue-components disabled */import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import { SECTIONS } from "/src/router/printerSections.ts";
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from "/src/util/event-helpers.ts";
function goKeys(id) {
  const section = SECTIONS.find((s) => s.id === id);
  return section ? ["G", section.key.toUpperCase()] : [];
}
let KeyboardShortcutsDialog = class extends Mixins(BrowserMixin) {
  open = false;
  get enableKeyboardShortcuts() {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts;
  }
  toggleShortcuts() {
    this.$store.dispatch("config/saveByPath", {
      path: "uiSettings.general.enableKeyboardShortcuts",
      value: !this.enableKeyboardShortcuts,
      server: true
    });
  }
  get commandKeys() {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? ["\u2318", "K"] : ["Ctrl", "K"];
  }
  get columns() {
    return [
      {
        title: "Anywhere",
        rows: [
          { keys: ["?"], what: "This sheet" },
          { keys: this.commandKeys, what: "Search or run a command" },
          { keys: ["G", "P"], what: "All printers" },
          { keys: ["G", "B"], what: "Your Library" },
          { keys: ["G", "A"], what: "Your account" },
          { keys: ["[", "]"], what: "Previous or next printer, same page" },
          { keys: ["1", "\u2013", "9"], what: "On Printers: open that one" },
          { keys: ["Esc"], what: "Close a sheet or a menu" }
        ]
      },
      {
        title: "Go to, in a printer",
        rows: [
          { keys: goKeys("overview"), what: "Overview" },
          { keys: goKeys("jobs"), what: "Jobs" },
          { keys: goKeys("control"), what: "Control" },
          { keys: goKeys("slice"), what: "Slice" },
          { keys: goKeys("camera"), what: "Camera" },
          { keys: goKeys("maintenance"), what: "Maintenance" },
          { keys: ["G", "S", "\xB7", "W", "\xB7", "U"], what: "Settings \xB7 Network \xB7 Updates" },
          { keys: ["G", "T", "\xB7", "F"], what: "Console \xB7 Files", note: "(Tools)" }
        ]
      },
      {
        title: "Act on this printer",
        rows: [
          { keys: ["U"], what: "Upload a file to print" },
          { keys: ["F"], what: "On Camera: full screen" },
          { keys: ["Shift", "P"], what: "Pause, or resume" },
          { keys: ["Shift", "C"], what: "Stop the print" },
          { keys: ["Shift", "H"], what: "Home all" },
          { keys: ["Ctrl", "Shift", "E"], what: "Emergency stop, works everywhere", strong: true }
        ]
      }
    ];
  }
  openFromElsewhere() {
    this.open = true;
  }
  handleKeyDown(event) {
    if (!this.enableKeyboardShortcuts) {
      return;
    }
    const shortcut = keyboardEventToKeyboardShortcut(event);
    if (["?", "Shift+?"].includes(shortcut) && !eventTargetIsContentEditable(event)) {
      event.preventDefault();
      this.open = true;
    }
  }
  created() {
    window.addEventListener("keydown", this.handleKeyDown, false);
    EventBus.bus.$on("keyboard-shortcuts", this.openFromElsewhere);
  }
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    EventBus.bus.$off("keyboard-shortcuts", this.openFromElsewhere);
  }
};
KeyboardShortcutsDialog = __decorateClass([
  Component({})
], KeyboardShortcutsDialog);
const _sfc_main = KeyboardShortcutsDialog;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "max-width": "1080", "fullscreen": _vm.isMobileViewport, "content-class": "keys-sheet__dialog" }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c("div", { staticClass: "keys-sheet", attrs: { "data-tid": "keyboard-shortcuts" } }, [_c("div", { staticClass: "keys-sheet__head" }, [_c("div", { staticClass: "keys-sheet__titles" }, [_c("h2", { staticClass: "keys-sheet__title" }, [_vm._v(" Keyboard shortcuts ")]), _c("span", { staticClass: "keys-sheet__about" }, [_vm._v(" Keys never fire while you're typing in a box, except E-STOP. Also in your account menu. ")])]), _c("div", { staticClass: "keys-sheet__tools" }, [_c("button", { staticClass: "keys-sheet__switch", attrs: { "type": "button", "role": "switch", "aria-checked": _vm.enableKeyboardShortcuts ? "true" : "false", "data-tid": "shortcuts-on" }, on: { "click": _vm.toggleShortcuts } }, [_vm._v(" Shortcuts on "), _c("span", { staticClass: "keys-sheet__toggle", class: { "keys-sheet__toggle--on": _vm.enableKeyboardShortcuts } })]), _c("button", { staticClass: "keys-sheet__close", attrs: { "type": "button", "aria-label": "Close" }, on: { "click": function($event) {
    _vm.open = false;
  } } }, [_c(__unplugin_components_1, { attrs: { "name": "x" } })], 1)])]), _c("div", { staticClass: "keys-sheet__columns" }, _vm._l(_vm.columns, function(column) {
    return _c("section", { key: column.title, staticClass: "keys-sheet__column" }, [_c("span", { staticClass: "keys-sheet__caps" }, [_vm._v(_vm._s(column.title))]), _vm._l(column.rows, function(row) {
      return _c("div", { key: row.what, staticClass: "keys-sheet__row" }, [_c("span", { staticClass: "keys-sheet__keys" }, [_vm._l(row.keys, function(key, i) {
        return [key === "\u2013" || key === "\xB7" ? _c("span", { key: i, staticClass: "keys-sheet__sep" }, [_vm._v(_vm._s(key))]) : _c("kbd", { key: i }, [_vm._v(_vm._s(key))])];
      })], 2), _c("span", { staticClass: "keys-sheet__what", class: { "keys-sheet__what--strong": row.strong } }, [_vm._v(" " + _vm._s(row.what) + " "), row.note ? _c("span", { staticClass: "keys-sheet__note" }, [_vm._v(_vm._s(row.note))]) : _vm._e()])]);
    })], 2);
  }), 0)])]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/common/KeyboardShortcutsDialog.vue?vue&type=style&index=0&scoped=5b37d0a5&lang.scss";
import "/src/components/common/KeyboardShortcutsDialog.vue?vue&type=style&index=1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "5b37d0a5",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/KeyboardShortcutsDialog.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBeUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFVQTtBQUNBO0FBQ0E7QUFDQTtBQVFBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFFQSxRQUNBLHVDQUNBLHNDQUNBO0FBQ0E7QUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEzRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiS2V5Ym9hcmRTaG9ydGN1dHNEaWFsb2cudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtZGlhbG9nXG4gICAgdi1tb2RlbD1cIm9wZW5cIlxuICAgIG1heC13aWR0aD1cIjEwODBcIlxuICAgIDpmdWxsc2NyZWVuPVwiaXNNb2JpbGVWaWV3cG9ydFwiXG4gICAgY29udGVudC1jbGFzcz1cImtleXMtc2hlZXRfX2RpYWxvZ1wiXG4gID5cbiAgICA8ZGl2XG4gICAgICBjbGFzcz1cImtleXMtc2hlZXRcIlxuICAgICAgZGF0YS10aWQ9XCJrZXlib2FyZC1zaG9ydGN1dHNcIlxuICAgID5cbiAgICAgIDxkaXYgY2xhc3M9XCJrZXlzLXNoZWV0X19oZWFkXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJrZXlzLXNoZWV0X190aXRsZXNcIj5cbiAgICAgICAgICA8aDIgY2xhc3M9XCJrZXlzLXNoZWV0X190aXRsZVwiPlxuICAgICAgICAgICAgS2V5Ym9hcmQgc2hvcnRjdXRzXG4gICAgICAgICAgPC9oMj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImtleXMtc2hlZXRfX2Fib3V0XCI+XG4gICAgICAgICAgICBLZXlzIG5ldmVyIGZpcmUgd2hpbGUgeW91J3JlIHR5cGluZyBpbiBhIGJveCwgZXhjZXB0IEUtU1RPUC4gQWxzbyBpbiB5b3VyIGFjY291bnQgbWVudS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwia2V5cy1zaGVldF9fdG9vbHNcIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIHJvbGU9XCJzd2l0Y2hcIlxuICAgICAgICAgICAgY2xhc3M9XCJrZXlzLXNoZWV0X19zd2l0Y2hcIlxuICAgICAgICAgICAgOmFyaWEtY2hlY2tlZD1cImVuYWJsZUtleWJvYXJkU2hvcnRjdXRzID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInNob3J0Y3V0cy1vblwiXG4gICAgICAgICAgICBAY2xpY2s9XCJ0b2dnbGVTaG9ydGN1dHNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIFNob3J0Y3V0cyBvblxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgY2xhc3M9XCJrZXlzLXNoZWV0X190b2dnbGVcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdrZXlzLXNoZWV0X190b2dnbGUtLW9uJzogZW5hYmxlS2V5Ym9hcmRTaG9ydGN1dHMgfVwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCJrZXlzLXNoZWV0X19jbG9zZVwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiQ2xvc2VcIlxuICAgICAgICAgICAgQGNsaWNrPVwib3BlbiA9IGZhbHNlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZnJhbWUtaWNvbiBuYW1lPVwieFwiIC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJrZXlzLXNoZWV0X19jb2x1bW5zXCI+XG4gICAgICAgIDxzZWN0aW9uXG4gICAgICAgICAgdi1mb3I9XCJjb2x1bW4gaW4gY29sdW1uc1wiXG4gICAgICAgICAgOmtleT1cImNvbHVtbi50aXRsZVwiXG4gICAgICAgICAgY2xhc3M9XCJrZXlzLXNoZWV0X19jb2x1bW5cIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJrZXlzLXNoZWV0X19jYXBzXCI+e3sgY29sdW1uLnRpdGxlIH19PC9zcGFuPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtZm9yPVwicm93IGluIGNvbHVtbi5yb3dzXCJcbiAgICAgICAgICAgIDprZXk9XCJyb3cud2hhdFwiXG4gICAgICAgICAgICBjbGFzcz1cImtleXMtc2hlZXRfX3Jvd1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJrZXlzLXNoZWV0X19rZXlzXCI+XG4gICAgICAgICAgICAgIDx0ZW1wbGF0ZSB2LWZvcj1cIihrZXksIGkpIGluIHJvdy5rZXlzXCI+XG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIHYtaWY9XCJrZXkgPT09ICfigJMnIHx8IGtleSA9PT0gJ8K3J1wiXG4gICAgICAgICAgICAgICAgICA6a2V5PVwiaVwiXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cImtleXMtc2hlZXRfX3NlcFwiXG4gICAgICAgICAgICAgICAgPnt7IGtleSB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8a2JkXG4gICAgICAgICAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICAgICAgICAgIDprZXk9XCJpXCJcbiAgICAgICAgICAgICAgICA+e3sga2V5IH19PC9rYmQ+XG4gICAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICBjbGFzcz1cImtleXMtc2hlZXRfX3doYXRcIlxuICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdrZXlzLXNoZWV0X193aGF0LS1zdHJvbmcnOiByb3cuc3Ryb25nIH1cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7eyByb3cud2hhdCB9fVxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIHYtaWY9XCJyb3cubm90ZVwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJrZXlzLXNoZWV0X19ub3RlXCJcbiAgICAgICAgICAgICAgPnt7IHJvdy5ub3RlIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3NlY3Rpb24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC92LWRpYWxvZz5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgQnJvd3Nlck1peGluIGZyb20gJ0AvbWl4aW5zL2Jyb3dzZXInXG5pbXBvcnQgeyBTRUNUSU9OUyB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJTZWN0aW9ucydcbmltcG9ydCB7IGV2ZW50VGFyZ2V0SXNDb250ZW50RWRpdGFibGUsIGtleWJvYXJkRXZlbnRUb0tleWJvYXJkU2hvcnRjdXQgfSBmcm9tICdAL3V0aWwvZXZlbnQtaGVscGVycydcblxuaW50ZXJmYWNlIEtleVJvdyB7XG4gIGtleXM6IHN0cmluZ1tdO1xuICB3aGF0OiBzdHJpbmc7XG4gIG5vdGU/OiBzdHJpbmc7XG4gIHN0cm9uZz86IGJvb2xlYW47XG59XG5cbi8qKiBHIGFuZCBhIHNlY3Rpb24ncyBrZXksIGFzIHRoZSBzaGVldCB3cml0ZXMgaXQuICovXG5mdW5jdGlvbiBnb0tleXMgKGlkOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHNlY3Rpb24gPSBTRUNUSU9OUy5maW5kKHMgPT4gcy5pZCA9PT0gaWQpXG4gIHJldHVybiBzZWN0aW9uID8gWydHJywgc2VjdGlvbi5rZXkudG9VcHBlckNhc2UoKV0gOiBbXVxufVxuXG4vKipcbiAqIEV2ZXJ5IGtleSBvbiBvbmUgc2hlZXQgKGA/YCk6IHRob3NlIHRoYXQgd29yayBhbnl3aGVyZSwgdGhvc2UgdGhhdCBnbyB0b1xuICogYSBwcmludGVyJ3MgcGFnZXMsIGFuZCB0aG9zZSB0aGF0IGFjdCBvbiB0aGUgcHJpbnRlci4gVGhlIHN3aXRjaCB0dXJuc1xuICogdGhlbSBhbGwgb24gb3Igb2ZmIGZvciB0aGlzIHByaW50ZXIuXG4gKi9cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBLZXlib2FyZFNob3J0Y3V0c0RpYWxvZyBleHRlbmRzIE1peGlucyhCcm93c2VyTWl4aW4pIHtcbiAgb3BlbiA9IGZhbHNlXG5cbiAgZ2V0IGVuYWJsZUtleWJvYXJkU2hvcnRjdXRzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVLZXlib2FyZFNob3J0Y3V0c1xuICB9XG5cbiAgdG9nZ2xlU2hvcnRjdXRzICgpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL3NhdmVCeVBhdGgnLCB7XG4gICAgICBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLmVuYWJsZUtleWJvYXJkU2hvcnRjdXRzJyxcbiAgICAgIHZhbHVlOiAhdGhpcy5lbmFibGVLZXlib2FyZFNob3J0Y3V0cyxcbiAgICAgIHNlcnZlcjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICBnZXQgY29tbWFuZEtleXMgKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gL01hY3xpUGhvbmV8aVBhZC8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0gfHwgbmF2aWdhdG9yLnVzZXJBZ2VudCkgPyBbJ+KMmCcsICdLJ10gOiBbJ0N0cmwnLCAnSyddXG4gIH1cblxuICBnZXQgY29sdW1ucyAoKTogQXJyYXk8eyB0aXRsZTogc3RyaW5nLCByb3dzOiBLZXlSb3dbXSB9PiB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6ICdBbnl3aGVyZScsXG4gICAgICAgIHJvd3M6IFtcbiAgICAgICAgICB7IGtleXM6IFsnPyddLCB3aGF0OiAnVGhpcyBzaGVldCcgfSxcbiAgICAgICAgICB7IGtleXM6IHRoaXMuY29tbWFuZEtleXMsIHdoYXQ6ICdTZWFyY2ggb3IgcnVuIGEgY29tbWFuZCcgfSxcbiAgICAgICAgICB7IGtleXM6IFsnRycsICdQJ10sIHdoYXQ6ICdBbGwgcHJpbnRlcnMnIH0sXG4gICAgICAgICAgeyBrZXlzOiBbJ0cnLCAnQiddLCB3aGF0OiAnWW91ciBMaWJyYXJ5JyB9LFxuICAgICAgICAgIHsga2V5czogWydHJywgJ0EnXSwgd2hhdDogJ1lvdXIgYWNjb3VudCcgfSxcbiAgICAgICAgICB7IGtleXM6IFsnWycsICddJ10sIHdoYXQ6ICdQcmV2aW91cyBvciBuZXh0IHByaW50ZXIsIHNhbWUgcGFnZScgfSxcbiAgICAgICAgICB7IGtleXM6IFsnMScsICfigJMnLCAnOSddLCB3aGF0OiAnT24gUHJpbnRlcnM6IG9wZW4gdGhhdCBvbmUnIH0sXG4gICAgICAgICAgeyBrZXlzOiBbJ0VzYyddLCB3aGF0OiAnQ2xvc2UgYSBzaGVldCBvciBhIG1lbnUnIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6ICdHbyB0bywgaW4gYSBwcmludGVyJyxcbiAgICAgICAgcm93czogW1xuICAgICAgICAgIHsga2V5czogZ29LZXlzKCdvdmVydmlldycpLCB3aGF0OiAnT3ZlcnZpZXcnIH0sXG4gICAgICAgICAgeyBrZXlzOiBnb0tleXMoJ2pvYnMnKSwgd2hhdDogJ0pvYnMnIH0sXG4gICAgICAgICAgeyBrZXlzOiBnb0tleXMoJ2NvbnRyb2wnKSwgd2hhdDogJ0NvbnRyb2wnIH0sXG4gICAgICAgICAgeyBrZXlzOiBnb0tleXMoJ3NsaWNlJyksIHdoYXQ6ICdTbGljZScgfSxcbiAgICAgICAgICB7IGtleXM6IGdvS2V5cygnY2FtZXJhJyksIHdoYXQ6ICdDYW1lcmEnIH0sXG4gICAgICAgICAgeyBrZXlzOiBnb0tleXMoJ21haW50ZW5hbmNlJyksIHdoYXQ6ICdNYWludGVuYW5jZScgfSxcbiAgICAgICAgICB7IGtleXM6IFsnRycsICdTJywgJ8K3JywgJ1cnLCAnwrcnLCAnVSddLCB3aGF0OiAnU2V0dGluZ3MgwrcgTmV0d29yayDCtyBVcGRhdGVzJyB9LFxuICAgICAgICAgIHsga2V5czogWydHJywgJ1QnLCAnwrcnLCAnRiddLCB3aGF0OiAnQ29uc29sZSDCtyBGaWxlcycsIG5vdGU6ICcoVG9vbHMpJyB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnQWN0IG9uIHRoaXMgcHJpbnRlcicsXG4gICAgICAgIHJvd3M6IFtcbiAgICAgICAgICB7IGtleXM6IFsnVSddLCB3aGF0OiAnVXBsb2FkIGEgZmlsZSB0byBwcmludCcgfSxcbiAgICAgICAgICB7IGtleXM6IFsnRiddLCB3aGF0OiAnT24gQ2FtZXJhOiBmdWxsIHNjcmVlbicgfSxcbiAgICAgICAgICB7IGtleXM6IFsnU2hpZnQnLCAnUCddLCB3aGF0OiAnUGF1c2UsIG9yIHJlc3VtZScgfSxcbiAgICAgICAgICB7IGtleXM6IFsnU2hpZnQnLCAnQyddLCB3aGF0OiAnU3RvcCB0aGUgcHJpbnQnIH0sXG4gICAgICAgICAgeyBrZXlzOiBbJ1NoaWZ0JywgJ0gnXSwgd2hhdDogJ0hvbWUgYWxsJyB9LFxuICAgICAgICAgIHsga2V5czogWydDdHJsJywgJ1NoaWZ0JywgJ0UnXSwgd2hhdDogJ0VtZXJnZW5jeSBzdG9wLCB3b3JrcyBldmVyeXdoZXJlJywgc3Ryb25nOiB0cnVlIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIF1cbiAgfVxuXG4gIG9wZW5Gcm9tRWxzZXdoZXJlICgpIHtcbiAgICB0aGlzLm9wZW4gPSB0cnVlXG4gIH1cblxuICBoYW5kbGVLZXlEb3duIChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmICghdGhpcy5lbmFibGVLZXlib2FyZFNob3J0Y3V0cykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3Qgc2hvcnRjdXQgPSBrZXlib2FyZEV2ZW50VG9LZXlib2FyZFNob3J0Y3V0KGV2ZW50KVxuXG4gICAgaWYgKFxuICAgICAgWyc/JywgJ1NoaWZ0Kz8nXS5pbmNsdWRlcyhzaG9ydGN1dCkgJiZcbiAgICAgICFldmVudFRhcmdldElzQ29udGVudEVkaXRhYmxlKGV2ZW50KVxuICAgICkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgICB0aGlzLm9wZW4gPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleURvd24sIGZhbHNlKVxuICAgIEV2ZW50QnVzLmJ1cy4kb24oJ2tleWJvYXJkLXNob3J0Y3V0cycsIHRoaXMub3BlbkZyb21FbHNld2hlcmUpXG4gIH1cblxuICBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlS2V5RG93bilcbiAgICBFdmVudEJ1cy5idXMuJG9mZigna2V5Ym9hcmQtc2hvcnRjdXRzJywgdGhpcy5vcGVuRnJvbUVsc2V3aGVyZSlcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLmtleXMtc2hlZXQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDE4cHg7XG4gICAgcGFkZGluZzogMjRweCAyNnB4IDI2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMjZweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZSk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICBib3gtc2hhZG93OiB2YXIoLS1tM2Qtc2hhZG93LWZsb2F0KSwgaW5zZXQgMCAwIDAgMXB4IHZhcigtLW0zZC1ib3JkZXIpO1xuICB9XG5cbiAgLmtleXMtc2hlZXRfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG4gIH1cblxuICAua2V5cy1zaGVldF9fdGl0bGVzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZ2FwOiA0cHg7XG4gIH1cblxuICAua2V5cy1zaGVldF9fdGl0bGUge1xuICAgIG1hcmdpbjogMDtcbiAgICBmb250LXNpemU6IDIycHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC5rZXlzLXNoZWV0X19hYm91dCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAua2V5cy1zaGVldF9fdG9vbHMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEwcHg7XG4gIH1cblxuICAua2V5cy1zaGVldF9fc3dpdGNoIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTBweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5rZXlzLXNoZWV0X190b2dnbGUge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDIycHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTFweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3dpdGNoLW9mZiwgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpKTtcblxuICAgICY6OmFmdGVyIHtcbiAgICAgIGNvbnRlbnQ6ICcnO1xuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgdG9wOiAycHg7XG4gICAgICBsZWZ0OiAycHg7XG4gICAgICB3aWR0aDogMThweDtcbiAgICAgIGhlaWdodDogMThweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgICAgIGJhY2tncm91bmQ6ICNmZmY7XG4gICAgICB0cmFuc2l0aW9uOiBsZWZ0IHZhcigtLW0zZC1kdXJhdGlvbi1mYXN0KSB2YXIoLS1tM2QtZWFzZSk7XG4gICAgfVxuICB9XG5cbiAgLmtleXMtc2hlZXRfX3RvZ2dsZS0tb24ge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQpO1xuXG4gICAgJjo6YWZ0ZXIge1xuICAgICAgbGVmdDogMTZweDtcbiAgICB9XG4gIH1cblxuICAua2V5cy1zaGVldF9fY2xvc2Uge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgd2lkdGg6IDMycHg7XG4gICAgaGVpZ2h0OiAzMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAua2V5cy1zaGVldF9fY29sdW1ucyB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpdCwgbWlubWF4KDI4MHB4LCAxZnIpKTtcbiAgICBnYXA6IDhweCAzMnB4O1xuICB9XG5cbiAgLmtleXMtc2hlZXRfX2NvbHVtbiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICB9XG5cbiAgLmtleXMtc2hlZXRfX2NhcHMge1xuICAgIHBhZGRpbmc6IDZweCAwIDhweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtZmFtaWx5OiB2YXIoLS1tM2QtZm9udC1tb25vKTtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4xMmVtO1xuICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIH1cblxuICAua2V5cy1zaGVldF9fcm93IHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMTI4cHggbWlubWF4KDAsIDFmcik7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWluLWhlaWdodDogMzZweDtcbiAgICBmb250LXNpemU6IDE0cHg7XG5cbiAgICAmICsgJiB7XG4gICAgICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgfVxuICB9XG5cbiAgLmtleXMtc2hlZXRfX2tleXMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA0cHg7XG5cbiAgICBrYmQge1xuICAgICAgbWluLXdpZHRoOiAyMnB4O1xuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIH1cbiAgfVxuXG4gIC5rZXlzLXNoZWV0X19zZXAge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpO1xuICB9XG5cbiAgLmtleXMtc2hlZXRfX3doYXQtLXN0cm9uZyB7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5rZXlzLXNoZWV0X19ub3RlIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtc3VidGxlKTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cbjwvc3R5bGU+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAudi1kaWFsb2cua2V5cy1zaGVldF9fZGlhbG9nIHtcbiAgICBib3gtc2hhZG93OiBub25lO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvY29tbW9uL0tleWJvYXJkU2hvcnRjdXRzRGlhbG9nLnZ1ZSJ9