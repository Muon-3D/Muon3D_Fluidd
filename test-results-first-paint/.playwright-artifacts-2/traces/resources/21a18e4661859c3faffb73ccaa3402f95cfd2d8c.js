/* unplugin-vue-components disabled */import { VLayout as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { Globals } from "/src/globals.ts";
let ConsoleItem = class extends Vue {
  value;
  get knownCommands() {
    return this.$store.getters["console/getAllKnownCommands"];
  }
  get itemMessage() {
    let message = this.value.message;
    if (this.value.type === "response") {
      message = this.value.message.replace(/([A-Z0-9_]{2,})/g, (match, command) => {
        if (command in this.knownCommands) return `<a class="primary--text text--lighten-1">${command.toUpperCase()}</a>`;
        return match;
      });
    }
    return this.value.type === "command" ? `${Globals.CONSOLE_SEND_PREFIX}<a class="primary--text text--lighten-1">${message}</a>` : message;
  }
  get timestamps() {
    return this.$store.state.config.uiSettings.console?.timestamps !== false;
  }
  get itemTime() {
    return this.value.time ? this.$filters.formatTimeWithSeconds(this.value.time * 1e3) : "";
  }
  get itemClass() {
    if (this.value.message.startsWith("!!")) {
      return { "error--text": true };
    }
    if (this.value.type === "command") {
      return { "primary--text": true };
    }
    return { "secondary--text": true };
  }
  itemClick(event) {
    if (event.target instanceof HTMLAnchorElement) {
      const command = event.target.innerHTML.replace(/<br>/g, "\n").replace(/^\s+|\s+$/gm, "");
      this.$emit("click", command);
    }
  }
};
__decorateClass([
  Prop({ type: Object, default: () => {
  } })
], ConsoleItem.prototype, "value", 2);
ConsoleItem = __decorateClass([
  Component({})
], ConsoleItem);
const _sfc_main = ConsoleItem;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { staticClass: "console-item" }, [_vm.value.time && _vm.timestamps ? _c("span", { staticClass: "secondary--text mr-3 d-none d-sm-block text-no-wrap" }, [_vm._v(" " + _vm._s(_vm.itemTime) + "\xA0 ")]) : _vm._e(), _c("span", { class: _vm.itemClass, domProps: { "innerHTML": _vm._s(_vm.itemMessage) }, on: { "!click": function($event) {
    return _vm.itemClick.apply(null, arguments);
  } } })]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/console/ConsoleItem.vue?vue&type=style&index=0&scoped=3273b429&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "3273b429",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/console/ConsoleItem.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpQkE7QUFDQTtBQUlBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0EsMkNBQ0EsMEZBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQSw2QkFDQSw2REFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFNQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBLDZDQUNBLHVCQUNBO0FBRUE7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBdERBO0FBQUEsRUFEQTtBQUFBO0FBQUEsR0FEQSxZQUVBO0FBRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29uc29sZUl0ZW0udnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPHYtbGF5b3V0IGNsYXNzPVwiY29uc29sZS1pdGVtXCI+XG4gICAgPHNwYW5cbiAgICAgIHYtaWY9XCJ2YWx1ZS50aW1lICYmIHRpbWVzdGFtcHNcIlxuICAgICAgY2xhc3M9XCJzZWNvbmRhcnktLXRleHQgbXItMyBkLW5vbmUgZC1zbS1ibG9jayB0ZXh0LW5vLXdyYXBcIlxuICAgID5cbiAgICAgIHt7IGl0ZW1UaW1lIH19Jm5ic3A7XG4gICAgPC9zcGFuPlxuICAgIDxzcGFuXG4gICAgICA6Y2xhc3M9XCJpdGVtQ2xhc3NcIlxuICAgICAgQGNsaWNrLmNhcHR1cmU9XCJpdGVtQ2xpY2tcIlxuICAgICAgdi1odG1sPVwiaXRlbU1lc3NhZ2VcIlxuICAgIC8+XG4gIDwvdi1sYXlvdXQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB0eXBlIHsgQ29uc29sZUVudHJ5LCBHY29kZUhlbHAgfSBmcm9tICdAL3N0b3JlL2NvbnNvbGUvdHlwZXMnXG5cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25zb2xlSXRlbSBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCBkZWZhdWx0OiAoKSA9PiB7fSB9KVxuICByZWFkb25seSB2YWx1ZSE6IENvbnNvbGVFbnRyeVxuXG4gIGdldCBrbm93bkNvbW1hbmRzICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uc29sZS9nZXRBbGxLbm93bkNvbW1hbmRzJ10gYXMgR2NvZGVIZWxwXG4gIH1cblxuICBnZXQgaXRlbU1lc3NhZ2UgKCkge1xuICAgIGxldCBtZXNzYWdlID0gdGhpcy52YWx1ZS5tZXNzYWdlXG4gICAgaWYgKHRoaXMudmFsdWUudHlwZSA9PT0gJ3Jlc3BvbnNlJykge1xuICAgICAgbWVzc2FnZSA9IHRoaXMudmFsdWUubWVzc2FnZS5yZXBsYWNlKC8oW0EtWjAtOV9dezIsfSkvZywgKG1hdGNoLCBjb21tYW5kKSA9PiB7XG4gICAgICAgIGlmIChjb21tYW5kIGluIHRoaXMua25vd25Db21tYW5kcykgcmV0dXJuIGA8YSBjbGFzcz1cInByaW1hcnktLXRleHQgdGV4dC0tbGlnaHRlbi0xXCI+JHtjb21tYW5kLnRvVXBwZXJDYXNlKCl9PC9hPmBcbiAgICAgICAgcmV0dXJuIG1hdGNoXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gKHRoaXMudmFsdWUudHlwZSA9PT0gJ2NvbW1hbmQnKVxuICAgICAgPyBgJHtHbG9iYWxzLkNPTlNPTEVfU0VORF9QUkVGSVh9PGEgY2xhc3M9XCJwcmltYXJ5LS10ZXh0IHRleHQtLWxpZ2h0ZW4tMVwiPiR7bWVzc2FnZX08L2E+YFxuICAgICAgOiBtZXNzYWdlXG4gIH1cblxuICBnZXQgdGltZXN0YW1wcyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmNvbnNvbGU/LnRpbWVzdGFtcHMgIT09IGZhbHNlXG4gIH1cblxuICBnZXQgaXRlbVRpbWUgKCkge1xuICAgIHJldHVybiAodGhpcy52YWx1ZS50aW1lKVxuICAgICAgPyB0aGlzLiRmaWx0ZXJzLmZvcm1hdFRpbWVXaXRoU2Vjb25kcyh0aGlzLnZhbHVlLnRpbWUgKiAxMDAwKVxuICAgICAgOiAnJ1xuICB9XG5cbiAgZ2V0IGl0ZW1DbGFzcyAoKSB7XG4gICAgaWYgKHRoaXMudmFsdWUubWVzc2FnZS5zdGFydHNXaXRoKCchIScpKSB7XG4gICAgICByZXR1cm4geyAnZXJyb3ItLXRleHQnOiB0cnVlIH1cbiAgICB9XG5cbiAgICAvLyBpZiAodGhpcy52YWx1ZS5tZXNzYWdlLnN0YXJ0c1dpdGgoJy8vJykpIHtcbiAgICAvLyAgIHJldHVybiB7ICdzZWNvbmRhcnktLXRleHQnOiB0cnVlIH1cbiAgICAvLyB9XG5cbiAgICBpZiAodGhpcy52YWx1ZS50eXBlID09PSAnY29tbWFuZCcpIHtcbiAgICAgIHJldHVybiB7ICdwcmltYXJ5LS10ZXh0JzogdHJ1ZSB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgJ3NlY29uZGFyeS0tdGV4dCc6IHRydWUgfVxuICB9XG5cbiAgaXRlbUNsaWNrIChldmVudDogRXZlbnQpIHtcbiAgICBpZiAoZXZlbnQudGFyZ2V0IGluc3RhbmNlb2YgSFRNTEFuY2hvckVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBldmVudC50YXJnZXQuaW5uZXJIVE1MXG4gICAgICAgIC5yZXBsYWNlKC88YnI+L2csICdcXG4nKVxuICAgICAgICAucmVwbGFjZSgvXlxccyt8XFxzKyQvZ20sICcnKVxuXG4gICAgICB0aGlzLiRlbWl0KCdjbGljaycsIGNvbW1hbmQpXG4gICAgfVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuY29uc29sZS1pdGVtIHtcbiAgICBmbGV4OiAwIDAgYXV0bztcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvY29uc29sZS9Db25zb2xlSXRlbS52dWUifQ==