/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/AppBtn.vue";
import { VCol as __unplugin_components_4 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VTextarea as __unplugin_components_3 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCol as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VRow as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VContainer as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Vue, Component, Prop, Watch, Ref } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { Globals } from "/src/globals.ts";
let ConsoleCommand = class extends Vue {
  value;
  input;
  disabled;
  autofocus;
  onValueChange(val) {
    if (val) {
      this.newValue = val;
      this.input.focus();
    } else {
      this.newValue = "";
    }
  }
  newValue = "";
  history = [];
  originalHistory = [];
  isFirst = true;
  get commandHistoryCount() {
    return this.$store.state.config.uiSettings.console?.historyCount ?? Globals.CONSOLE_COMMAND_HISTORY;
  }
  mounted() {
    this.newValue = this.value;
    const savedHistory = this.$store.state.console.commandHistory;
    this.history = [...savedHistory];
    this.originalHistory = [...savedHistory];
  }
  /** Settings › Console › Enter sends: off, Enter adds a line and Ctrl or ⌘ Enter sends. */
  get enterSends() {
    return this.$store.state.config.uiSettings.console?.enterSends !== false;
  }
  /** Settings › Console › Suggest commands: off, Tab keeps its job of moving on. */
  get suggest() {
    return this.$store.state.config.uiSettings.console?.suggest !== false;
  }
  onEnterDown(event) {
    if (this.enterSends) event.preventDefault();
  }
  onEnterUp() {
    if (this.enterSends) this.emitSend(this.newValue);
  }
  onTab(event) {
    if (!this.suggest) return;
    event.preventDefault();
    this.autoComplete();
  }
  emitChange(val) {
    this.newValue = val;
    this.$emit("input", val);
  }
  emitSend(val) {
    if (val && val.length > 0) {
      if (this.history.length >= this.commandHistoryCount) {
        this.originalHistory.pop();
      }
      this.originalHistory.unshift(val);
      this.$store.dispatch("console/onUpdateCommandHistory", [...this.originalHistory]);
      this.history = [...this.originalHistory];
      this.isFirst = true;
      this.$emit("send", val);
    }
  }
  historyUp() {
    if (this.history.length >= 1) {
      if (!this.isFirst) {
        const f = this.history.shift();
        this.history.push(f);
      }
      this.emitChange(this.history[0]);
      this.isFirst = false;
    }
  }
  historyDown() {
    if (this.history.length >= 1) {
      if (!this.isFirst) {
        const f = this.history.pop();
        this.history.unshift(f);
      }
      this.emitChange(this.history[0]);
      this.isFirst = false;
    }
  }
  get availableCommands() {
    return this.$store.getters["printer/getAvailableCommands"];
  }
  autoComplete() {
    const availableCommands = this.availableCommands;
    if (this.newValue.length) {
      const commands = Object.keys(availableCommands).filter((command) => command.startsWith(this.newValue.toUpperCase()));
      if (commands.length === 1) {
        this.emitChange(commands[0]);
      } else {
        commands.forEach((command) => {
          const message = `// ${command}: ${availableCommands[command].help ?? ""}`;
          this.$store.dispatch("console/onAddConsoleEntry", { message, type: "response" });
        });
      }
    }
  }
};
__decorateClass([
  Prop({ type: String })
], ConsoleCommand.prototype, "value", 2);
__decorateClass([
  Ref("input")
], ConsoleCommand.prototype, "input", 2);
__decorateClass([
  Prop({ type: Boolean })
], ConsoleCommand.prototype, "disabled", 2);
__decorateClass([
  Prop({ type: Boolean })
], ConsoleCommand.prototype, "autofocus", 2);
__decorateClass([
  Watch("value")
], ConsoleCommand.prototype, "onValueChange", 1);
ConsoleCommand = __decorateClass([
  Component({})
], ConsoleCommand);
const _sfc_main = ConsoleCommand;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, [_c(__unplugin_components_1, { attrs: { "align": "center" } }, [_c(__unplugin_components_2, [_c(__unplugin_components_3, { ref: "input", staticClass: "console-command", attrs: { "rows": 1, "value": _vm.newValue, "items": _vm.history, "disabled": _vm.disabled, "autofocus": _vm.autofocus, "auto-grow": "", "clearable": "", "outlined": "", "single-line": "", "dense": "", "hide-details": "", "spellcheck": "false" }, on: { "input": _vm.emitChange, "keyup": function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.onEnterUp.apply(null, arguments);
  }, "keydown": [function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.onEnterDown.apply(null, arguments);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if (!$event.ctrlKey) return null;
    if ($event.shiftKey || $event.altKey || $event.metaKey) return null;
    $event.preventDefault();
    return _vm.emitSend(_vm.newValue);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")) return null;
    if (!$event.metaKey) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey) return null;
    $event.preventDefault();
    return _vm.emitSend(_vm.newValue);
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "up", 38, $event.key, ["Up", "ArrowUp"])) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    $event.preventDefault();
    return _vm.historyUp();
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "down", 40, $event.key, ["Down", "ArrowDown"])) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    $event.preventDefault();
    return _vm.historyDown();
  }, function($event) {
    if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "tab", 9, $event.key, "Tab")) return null;
    if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey) return null;
    return _vm.onTab.apply(null, arguments);
  }] } })], 1), _c(__unplugin_components_4, { attrs: { "cols": "auto" } }, [_c(__unplugin_components_5, { attrs: { "disabled": _vm.disabled }, on: { "click": function($event) {
    return _vm.emitSend(_vm.newValue);
  } } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.send")) + " ")])], 1)], 1)], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/console/ConsoleCommand.vue?vue&type=style&index=0&scoped=55491166&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "55491166",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/console/ConsoleCommand.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQTRDQTtBQUNBO0FBS0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFDQSxzREFDQTtBQUVBO0FBQ0E7QUFBQSxNQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUNBO0FBMUhBO0FBQUEsRUFEQTtBQUFBLEdBREEsZUFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsZUFLQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBUEEsZUFRQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBVkEsZUFXQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBYkEsZUFjQTtBQWRBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNvbnNvbGVDb21tYW5kLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWNvbnRhaW5lcj5cbiAgICA8di1yb3cgYWxpZ249XCJjZW50ZXJcIj5cbiAgICAgIDx2LWNvbD5cbiAgICAgICAgPHYtdGV4dGFyZWFcbiAgICAgICAgICByZWY9XCJpbnB1dFwiXG4gICAgICAgICAgOnJvd3M9XCIxXCJcbiAgICAgICAgICA6dmFsdWU9XCJuZXdWYWx1ZVwiXG4gICAgICAgICAgOml0ZW1zPVwiaGlzdG9yeVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiZGlzYWJsZWRcIlxuICAgICAgICAgIDphdXRvZm9jdXM9XCJhdXRvZm9jdXNcIlxuICAgICAgICAgIGF1dG8tZ3Jvd1xuICAgICAgICAgIGNsZWFyYWJsZVxuICAgICAgICAgIG91dGxpbmVkXG4gICAgICAgICAgc2luZ2xlLWxpbmVcbiAgICAgICAgICBkZW5zZVxuICAgICAgICAgIGhpZGUtZGV0YWlsc1xuICAgICAgICAgIHNwZWxsY2hlY2s9XCJmYWxzZVwiXG4gICAgICAgICAgY2xhc3M9XCJjb25zb2xlLWNvbW1hbmRcIlxuICAgICAgICAgIEBpbnB1dD1cImVtaXRDaGFuZ2VcIlxuICAgICAgICAgIEBrZXl1cC5lbnRlci5leGFjdD1cIm9uRW50ZXJVcFwiXG4gICAgICAgICAgQGtleWRvd24uZW50ZXIuZXhhY3Q9XCJvbkVudGVyRG93blwiXG4gICAgICAgICAgQGtleWRvd24uY3RybC5lbnRlci5leGFjdC5wcmV2ZW50PVwiZW1pdFNlbmQobmV3VmFsdWUpXCJcbiAgICAgICAgICBAa2V5ZG93bi5tZXRhLmVudGVyLmV4YWN0LnByZXZlbnQ9XCJlbWl0U2VuZChuZXdWYWx1ZSlcIlxuICAgICAgICAgIEBrZXlkb3duLnVwLmV4YWN0LnByZXZlbnQ9XCJoaXN0b3J5VXAoKVwiXG4gICAgICAgICAgQGtleWRvd24uZG93bi5leGFjdC5wcmV2ZW50PVwiaGlzdG9yeURvd24oKVwiXG4gICAgICAgICAgQGtleWRvd24udGFiLmV4YWN0PVwib25UYWJcIlxuICAgICAgICAvPlxuICAgICAgPC92LWNvbD5cbiAgICAgIDx2LWNvbCBjb2xzPVwiYXV0b1wiPlxuICAgICAgICA8YXBwLWJ0blxuICAgICAgICAgIDpkaXNhYmxlZD1cImRpc2FibGVkXCJcbiAgICAgICAgICBAY2xpY2s9XCJlbWl0U2VuZChuZXdWYWx1ZSlcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgJHQoJ2FwcC5nZW5lcmFsLmJ0bi5zZW5kJykgfX1cbiAgICAgICAgPC9hcHAtYnRuPlxuICAgICAgPC92LWNvbD5cbiAgICA8L3Ytcm93PlxuICA8L3YtY29udGFpbmVyPlxuICA8IS0tIDxwcmU+e3sgb3JpZ2luYWxIaXN0b3J5IH19PC9wcmU+XG4gICAgPHByZT57eyBoaXN0b3J5IH19PC9wcmU+IC0tPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IFZ1ZSwgQ29tcG9uZW50LCBQcm9wLCBXYXRjaCwgUmVmIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgdHlwZSB7IFZJbnB1dCB9IGZyb20gJ0AvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEdjb2RlQ29tbWFuZHMgfSBmcm9tICdAL3N0b3JlL3ByaW50ZXIvdHlwZXMnXG5cbkBDb21wb25lbnQoe30pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25zb2xlQ29tbWFuZCBleHRlbmRzIFZ1ZSB7XG4gIEBQcm9wKHsgdHlwZTogU3RyaW5nIH0pXG4gIHJlYWRvbmx5IHZhbHVlITogc3RyaW5nXG5cbiAgQFJlZignaW5wdXQnKVxuICByZWFkb25seSBpbnB1dCE6IFZJbnB1dFxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBkaXNhYmxlZD86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgYXV0b2ZvY3VzPzogYm9vbGVhblxuXG4gIEBXYXRjaCgndmFsdWUnKVxuICBvblZhbHVlQ2hhbmdlICh2YWw6IHN0cmluZykge1xuICAgIGlmICh2YWwpIHtcbiAgICAgIHRoaXMubmV3VmFsdWUgPSB2YWxcbiAgICAgIHRoaXMuaW5wdXQuZm9jdXMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5ld1ZhbHVlID0gJydcbiAgICB9XG4gIH1cblxuICBuZXdWYWx1ZSA9ICcnXG4gIGhpc3Rvcnk6IHN0cmluZ1tdID0gW11cbiAgb3JpZ2luYWxIaXN0b3J5OiBzdHJpbmdbXSA9IFtdXG4gIGlzRmlyc3QgPSB0cnVlXG5cbiAgZ2V0IGNvbW1hbmRIaXN0b3J5Q291bnQgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmNvbnNvbGU/Lmhpc3RvcnlDb3VudCA/PyBHbG9iYWxzLkNPTlNPTEVfQ09NTUFORF9ISVNUT1JZXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLm5ld1ZhbHVlID0gdGhpcy52YWx1ZVxuICAgIGNvbnN0IHNhdmVkSGlzdG9yeSA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29tbWFuZEhpc3RvcnlcbiAgICB0aGlzLmhpc3RvcnkgPSBbLi4uc2F2ZWRIaXN0b3J5XVxuICAgIHRoaXMub3JpZ2luYWxIaXN0b3J5ID0gWy4uLnNhdmVkSGlzdG9yeV1cbiAgfVxuXG4gIC8qKiBTZXR0aW5ncyDigLogQ29uc29sZSDigLogRW50ZXIgc2VuZHM6IG9mZiwgRW50ZXIgYWRkcyBhIGxpbmUgYW5kIEN0cmwgb3Ig4oyYIEVudGVyIHNlbmRzLiAqL1xuICBnZXQgZW50ZXJTZW5kcyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmNvbnNvbGU/LmVudGVyU2VuZHMgIT09IGZhbHNlXG4gIH1cblxuICAvKiogU2V0dGluZ3Mg4oC6IENvbnNvbGUg4oC6IFN1Z2dlc3QgY29tbWFuZHM6IG9mZiwgVGFiIGtlZXBzIGl0cyBqb2Igb2YgbW92aW5nIG9uLiAqL1xuICBnZXQgc3VnZ2VzdCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmNvbnNvbGU/LnN1Z2dlc3QgIT09IGZhbHNlXG4gIH1cblxuICBvbkVudGVyRG93biAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAodGhpcy5lbnRlclNlbmRzKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBvbkVudGVyVXAgKCkge1xuICAgIGlmICh0aGlzLmVudGVyU2VuZHMpIHRoaXMuZW1pdFNlbmQodGhpcy5uZXdWYWx1ZSlcbiAgfVxuXG4gIG9uVGFiIChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmICghdGhpcy5zdWdnZXN0KSByZXR1cm5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5hdXRvQ29tcGxldGUoKVxuICB9XG5cbiAgZW1pdENoYW5nZSAodmFsOiBzdHJpbmcpIHtcbiAgICB0aGlzLm5ld1ZhbHVlID0gdmFsXG4gICAgdGhpcy4kZW1pdCgnaW5wdXQnLCB2YWwpXG4gIH1cblxuICBlbWl0U2VuZCAodmFsOiBzdHJpbmcpIHtcbiAgICBpZiAodmFsICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+PSB0aGlzLmNvbW1hbmRIaXN0b3J5Q291bnQpIHtcbiAgICAgICAgdGhpcy5vcmlnaW5hbEhpc3RvcnkucG9wKClcbiAgICAgIH1cbiAgICAgIHRoaXMub3JpZ2luYWxIaXN0b3J5LnVuc2hpZnQodmFsKVxuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbnNvbGUvb25VcGRhdGVDb21tYW5kSGlzdG9yeScsIFsuLi50aGlzLm9yaWdpbmFsSGlzdG9yeV0pXG4gICAgICB0aGlzLmhpc3RvcnkgPSBbLi4udGhpcy5vcmlnaW5hbEhpc3RvcnldXG4gICAgICB0aGlzLmlzRmlyc3QgPSB0cnVlXG4gICAgICB0aGlzLiRlbWl0KCdzZW5kJywgdmFsKVxuICAgIH1cbiAgfVxuXG4gIGhpc3RvcnlVcCAoKSB7XG4gICAgaWYgKHRoaXMuaGlzdG9yeS5sZW5ndGggPj0gMSkge1xuICAgICAgaWYgKCF0aGlzLmlzRmlyc3QpIHtcbiAgICAgICAgY29uc3QgZiA9IHRoaXMuaGlzdG9yeS5zaGlmdCgpIGFzIHN0cmluZ1xuICAgICAgICB0aGlzLmhpc3RvcnkucHVzaChmKVxuICAgICAgfVxuICAgICAgdGhpcy5lbWl0Q2hhbmdlKHRoaXMuaGlzdG9yeVswXSlcbiAgICAgIHRoaXMuaXNGaXJzdCA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgaGlzdG9yeURvd24gKCkge1xuICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID49IDEpIHtcbiAgICAgIGlmICghdGhpcy5pc0ZpcnN0KSB7XG4gICAgICAgIGNvbnN0IGYgPSB0aGlzLmhpc3RvcnkucG9wKCkgYXMgc3RyaW5nXG4gICAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KGYpXG4gICAgICB9XG4gICAgICB0aGlzLmVtaXRDaGFuZ2UodGhpcy5oaXN0b3J5WzBdKVxuICAgICAgdGhpcy5pc0ZpcnN0ID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBnZXQgYXZhaWxhYmxlQ29tbWFuZHMgKCk6IEdjb2RlQ29tbWFuZHMge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEF2YWlsYWJsZUNvbW1hbmRzJ10gYXMgR2NvZGVDb21tYW5kc1xuICB9XG5cbiAgYXV0b0NvbXBsZXRlICgpIHtcbiAgICBjb25zdCBhdmFpbGFibGVDb21tYW5kcyA9IHRoaXMuYXZhaWxhYmxlQ29tbWFuZHNcblxuICAgIGlmICh0aGlzLm5ld1ZhbHVlLmxlbmd0aCkge1xuICAgICAgY29uc3QgY29tbWFuZHMgPSBPYmplY3Qua2V5cyhhdmFpbGFibGVDb21tYW5kcylcbiAgICAgICAgLmZpbHRlcihjb21tYW5kID0+IGNvbW1hbmQuc3RhcnRzV2l0aCh0aGlzLm5ld1ZhbHVlLnRvVXBwZXJDYXNlKCkpKVxuXG4gICAgICBpZiAoY29tbWFuZHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRoaXMuZW1pdENoYW5nZShjb21tYW5kc1swXSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbW1hbmRzLmZvckVhY2goY29tbWFuZCA9PiB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGAvLyAke2NvbW1hbmR9OiAke2F2YWlsYWJsZUNvbW1hbmRzW2NvbW1hbmRdLmhlbHAgPz8gJyd9YFxuICAgICAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25zb2xlL29uQWRkQ29uc29sZUVudHJ5JywgeyBtZXNzYWdlLCB0eXBlOiAncmVzcG9uc2UnIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuY29uc29sZS1jb21tYW5kIHtcbiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xuICB9XG48L3N0eWxlPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qYWNrL3d0LTU5MjktZzEvc3JjL2NvbXBvbmVudHMvd2lkZ2V0cy9jb25zb2xlL0NvbnNvbGVDb21tYW5kLnZ1ZSJ9