/* unplugin-vue-components disabled */import { VCard as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, Mixins, Watch, Ref, PropSync } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import ConsoleCommand from "/src/components/widgets/console/ConsoleCommand.vue";
import ConsoleItem from "/src/components/widgets/console/ConsoleItem.vue";
import { SocketActions } from "/src/api/socketActions.ts";
import { Globals } from "/src/globals.ts";
let Console = class extends Mixins(StateMixin) {
  items;
  fullscreen;
  readonly;
  scrollingPausedModel;
  dynamicScroller;
  _pauseScroll = false;
  get currentCommand() {
    return this.$store.state.console.consoleCommand;
  }
  set currentCommand(val) {
    this.$store.commit("console/setConsoleCommand", val);
  }
  /** Settings › Console: the text size, and how many lines to keep. The update dialog's output keeps its own. */
  get textSize() {
    return this.readonly ? "md" : this.$store.state.config.uiSettings.console?.textSize ?? "md";
  }
  get shown() {
    if (this.readonly) return this.items;
    const kept = this.$store.state.config.uiSettings.console?.linesKept ?? Globals.CONSOLE_HISTORY_RETENTION;
    return this.items.slice(-kept);
  }
  get flipLayout() {
    return this.$store.state.config.uiSettings.general.flipConsoleLayout;
  }
  set flipLayout(_) {
    this.scrollToLatest(true);
  }
  mounted() {
    this.dynamicScroller.$el.addEventListener("scroll", this.onScroll);
  }
  beforeDestroy() {
    this.dynamicScroller.$el.removeEventListener("scroll", this.onScroll);
  }
  onItemsChange(_, oldItems) {
    if (this.dynamicScroller) {
      const el = this.dynamicScroller.$el;
      if (this.flipLayout && (this._pauseScroll || !this.$store.state.console.autoScroll)) {
        const { scrollHeight, clientHeight } = el;
        if (scrollHeight > clientHeight) {
          this.$nextTick(() => {
            el.scrollTop += el.scrollHeight - scrollHeight;
          });
        }
      } else {
        this.scrollToLatest(oldItems?.length === 0);
      }
    }
  }
  updateScrollingPaused() {
    this.$nextTick(() => {
      const { scrollTop, scrollHeight, clientHeight } = this.dynamicScroller.$el;
      const pauseScroll = this.flipLayout ? scrollTop > 1 : scrollHeight - scrollTop - clientHeight > 1;
      if (this._pauseScroll !== pauseScroll) {
        this._pauseScroll = pauseScroll;
        this.scrollingPausedModel = pauseScroll;
      }
    });
  }
  onScroll() {
    this.updateScrollingPaused();
  }
  scrollToLatest(force) {
    if (this._pauseScroll && !force) return;
    if (this.dynamicScroller) {
      if (this.$store.state.console.autoScroll || this.readonly || force) {
        if (this.flipLayout) {
          this.dynamicScroller.scrollToItem(0);
        } else {
          this.dynamicScroller.scrollToBottom();
        }
      }
      if (force) {
        this.updateScrollingPaused();
      }
    }
  }
  sendCommand(command) {
    if (command && command.length) {
      if (command.trim().toLowerCase() === "m112") {
        SocketActions.printerEmergencyStop();
      }
      this.sendGcode(command);
      this.currentCommand = "";
    }
  }
  handleEntryClick(command) {
    this.currentCommand = command;
  }
};
__decorateClass([
  Prop({ type: [Array, Array], default: () => [] })
], Console.prototype, "items", 2);
__decorateClass([
  Prop({ type: Boolean })
], Console.prototype, "fullscreen", 2);
__decorateClass([
  Prop({ type: Boolean })
], Console.prototype, "readonly", 2);
__decorateClass([
  PropSync("scrollingPaused", { type: Boolean })
], Console.prototype, "scrollingPausedModel", 2);
__decorateClass([
  Ref("scroller")
], Console.prototype, "dynamicScroller", 2);
__decorateClass([
  Watch("items", { immediate: true })
], Console.prototype, "onItemsChange", 1);
Console = __decorateClass([
  Component({
    components: {
      ConsoleCommand,
      ConsoleItem
    }
  })
], Console);
const _sfc_main = Console;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "console" }, [!_vm.readonly && _vm.flipLayout ? _c("console-command", { attrs: { "disabled": !_vm.klippyConnected, "autofocus": _vm.fullscreen }, on: { "send": _vm.sendCommand }, model: { value: _vm.currentCommand, callback: function($$v) {
    _vm.currentCommand = $$v;
  }, expression: "currentCommand" } }) : _vm._e(), _c(__unplugin_components_0, { ref: "console-wrapper", staticClass: "console-wrapper", class: `console-wrapper--${_vm.textSize}`, attrs: { "flat": "" } }, [_c("DynamicScroller", { ref: "scroller", staticClass: "console-scroller", class: {
    "console-scroller-fullscreen": _vm.fullscreen
  }, attrs: { "items": _vm.flipLayout ? [..._vm.shown].reverse() : _vm.shown, "min-item-size": 24, "key-field": "id", "buffer": 600 }, on: { "resize": function($event) {
    return _vm.scrollToLatest();
  } }, scopedSlots: _vm._u([{ key: "default", fn: function({ item, index, active }) {
    return [_c("DynamicScrollerItem", { attrs: { "item": item, "active": active, "size-dependencies": [
      item.message
    ], "data-index": index } }, [_c("console-item", { key: item.id, staticClass: "console-item", attrs: { "value": item }, on: { "click": _vm.handleEntryClick } })], 1)];
  } }]) })], 1), !_vm.readonly && !_vm.flipLayout ? _c("console-command", { attrs: { "disabled": !_vm.klippyConnected, "autofocus": _vm.fullscreen }, on: { "send": _vm.sendCommand }, model: { value: _vm.currentCommand, callback: function($$v) {
    _vm.currentCommand = $$v;
  }, expression: "currentCommand" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/console/Console.vue?vue&type=style&index=0&scoped=6323946b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "6323946b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/console/Console.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUF5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBV0E7QUFBQSxFQUVBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBLFVBQ0Esd0NBQ0EsaUJBQ0EsT0FDQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUVBO0FBRUE7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFDQTtBQTVIQTtBQUFBLEVBREE7QUFBQSxHQURBLFFBRUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQUpBLFFBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLFFBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLFFBV0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWJBLFFBY0E7QUF3Q0E7QUFBQSxFQURBO0FBQUEsR0FyREEsUUFzREE7QUF0REE7QUFBQSxFQU5BO0FBQUEsSUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDb25zb2xlLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJjb25zb2xlXCI+XG4gICAgPGNvbnNvbGUtY29tbWFuZFxuICAgICAgdi1pZj1cIiFyZWFkb25seSAmJiBmbGlwTGF5b3V0XCJcbiAgICAgIHYtbW9kZWw9XCJjdXJyZW50Q29tbWFuZFwiXG4gICAgICA6ZGlzYWJsZWQ9XCIha2xpcHB5Q29ubmVjdGVkXCJcbiAgICAgIDphdXRvZm9jdXM9XCJmdWxsc2NyZWVuXCJcbiAgICAgIEBzZW5kPVwic2VuZENvbW1hbmRcIlxuICAgIC8+XG4gICAgPHYtY2FyZFxuICAgICAgcmVmPVwiY29uc29sZS13cmFwcGVyXCJcbiAgICAgIGZsYXRcbiAgICAgIGNsYXNzPVwiY29uc29sZS13cmFwcGVyXCJcbiAgICAgIDpjbGFzcz1cImBjb25zb2xlLXdyYXBwZXItLSR7dGV4dFNpemV9YFwiXG4gICAgPlxuICAgICAgPER5bmFtaWNTY3JvbGxlclxuICAgICAgICByZWY9XCJzY3JvbGxlclwiXG4gICAgICAgIDppdGVtcz1cImZsaXBMYXlvdXQgPyBbLi4uc2hvd25dLnJldmVyc2UoKSA6IHNob3duXCJcbiAgICAgICAgOm1pbi1pdGVtLXNpemU9XCIyNFwiXG4gICAgICAgIGNsYXNzPVwiY29uc29sZS1zY3JvbGxlclwiXG4gICAgICAgIDpjbGFzcz1cIntcbiAgICAgICAgICAnY29uc29sZS1zY3JvbGxlci1mdWxsc2NyZWVuJzogZnVsbHNjcmVlblxuICAgICAgICB9XCJcbiAgICAgICAga2V5LWZpZWxkPVwiaWRcIlxuICAgICAgICA6YnVmZmVyPVwiNjAwXCJcbiAgICAgICAgQHJlc2l6ZT1cInNjcm9sbFRvTGF0ZXN0KClcIlxuICAgICAgPlxuICAgICAgICA8dGVtcGxhdGUgI2RlZmF1bHQ9XCJ7IGl0ZW0sIGluZGV4LCBhY3RpdmUgfVwiPlxuICAgICAgICAgIDxEeW5hbWljU2Nyb2xsZXJJdGVtXG4gICAgICAgICAgICA6aXRlbT1cIml0ZW1cIlxuICAgICAgICAgICAgOmFjdGl2ZT1cImFjdGl2ZVwiXG4gICAgICAgICAgICA6c2l6ZS1kZXBlbmRlbmNpZXM9XCJbXG4gICAgICAgICAgICAgIGl0ZW0ubWVzc2FnZSxcbiAgICAgICAgICAgIF1cIlxuICAgICAgICAgICAgOmRhdGEtaW5kZXg9XCJpbmRleFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGNvbnNvbGUtaXRlbVxuICAgICAgICAgICAgICA6a2V5PVwiaXRlbS5pZFwiXG4gICAgICAgICAgICAgIDp2YWx1ZT1cIml0ZW1cIlxuICAgICAgICAgICAgICBjbGFzcz1cImNvbnNvbGUtaXRlbVwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImhhbmRsZUVudHJ5Q2xpY2tcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0R5bmFtaWNTY3JvbGxlckl0ZW0+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L0R5bmFtaWNTY3JvbGxlcj5cbiAgICA8L3YtY2FyZD5cbiAgICA8Y29uc29sZS1jb21tYW5kXG4gICAgICB2LWlmPVwiIXJlYWRvbmx5ICYmICFmbGlwTGF5b3V0XCJcbiAgICAgIHYtbW9kZWw9XCJjdXJyZW50Q29tbWFuZFwiXG4gICAgICA6ZGlzYWJsZWQ9XCIha2xpcHB5Q29ubmVjdGVkXCJcbiAgICAgIDphdXRvZm9jdXM9XCJmdWxsc2NyZWVuXCJcbiAgICAgIEBzZW5kPVwic2VuZENvbW1hbmRcIlxuICAgIC8+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgTWl4aW5zLCBXYXRjaCwgUmVmLCBQcm9wU3luYyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCBDb25zb2xlQ29tbWFuZCBmcm9tICcuL0NvbnNvbGVDb21tYW5kLnZ1ZSdcbmltcG9ydCBDb25zb2xlSXRlbSBmcm9tICcuL0NvbnNvbGVJdGVtLnZ1ZSdcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB0eXBlIHsgRGluYW1pY1Njcm9sbGVyIH0gZnJvbSAndnVlLXZpcnR1YWwtc2Nyb2xsZXInXG5pbXBvcnQgdHlwZSB7IENvbnNvbGVFbnRyeSB9IGZyb20gJ0Avc3RvcmUvY29uc29sZS90eXBlcydcbmltcG9ydCB0eXBlIHsgVXBkYXRlUmVzcG9uc2UgfSBmcm9tICdAL3N0b3JlL3ZlcnNpb24vdHlwZXMnXG5cbkBDb21wb25lbnQoe1xuICBjb21wb25lbnRzOiB7XG4gICAgQ29uc29sZUNvbW1hbmQsXG4gICAgQ29uc29sZUl0ZW1cbiAgfVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnNvbGUgZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBAUHJvcCh7IHR5cGU6IFtBcnJheTxDb25zb2xlRW50cnk+LCBBcnJheTxVcGRhdGVSZXNwb25zZT5dLCBkZWZhdWx0OiAoKSA9PiBbXSB9KVxuICByZWFkb25seSBpdGVtcyE6IENvbnNvbGVFbnRyeVtdIHwgVXBkYXRlUmVzcG9uc2VbXVxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBmdWxsc2NyZWVuPzogYm9vbGVhblxuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSByZWFkb25seT86IGJvb2xlYW5cblxuICBAUHJvcFN5bmMoJ3Njcm9sbGluZ1BhdXNlZCcsIHsgdHlwZTogQm9vbGVhbiB9KVxuICAgIHNjcm9sbGluZ1BhdXNlZE1vZGVsPzogYm9vbGVhblxuXG4gIEBSZWYoJ3Njcm9sbGVyJylcbiAgcmVhZG9ubHkgZHluYW1pY1Njcm9sbGVyITogRGluYW1pY1Njcm9sbGVyXG5cbiAgX3BhdXNlU2Nyb2xsID0gZmFsc2VcblxuICBnZXQgY3VycmVudENvbW1hbmQgKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25zb2xlLmNvbnNvbGVDb21tYW5kXG4gIH1cblxuICBzZXQgY3VycmVudENvbW1hbmQgKHZhbDogc3RyaW5nKSB7XG4gICAgdGhpcy4kc3RvcmUuY29tbWl0KCdjb25zb2xlL3NldENvbnNvbGVDb21tYW5kJywgdmFsKVxuICB9XG5cbiAgLyoqIFNldHRpbmdzIOKAuiBDb25zb2xlOiB0aGUgdGV4dCBzaXplLCBhbmQgaG93IG1hbnkgbGluZXMgdG8ga2VlcC4gVGhlIHVwZGF0ZSBkaWFsb2cncyBvdXRwdXQga2VlcHMgaXRzIG93bi4gKi9cbiAgZ2V0IHRleHRTaXplICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlYWRvbmx5ID8gJ21kJyA6IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy51aVNldHRpbmdzLmNvbnNvbGU/LnRleHRTaXplID8/ICdtZCdcbiAgfVxuXG4gIGdldCBzaG93biAoKTogQ29uc29sZUVudHJ5W10gfCBVcGRhdGVSZXNwb25zZVtdIHtcbiAgICBpZiAodGhpcy5yZWFkb25seSkgcmV0dXJuIHRoaXMuaXRlbXNcbiAgICBjb25zdCBrZXB0ID0gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuY29uc29sZT8ubGluZXNLZXB0ID8/IEdsb2JhbHMuQ09OU09MRV9ISVNUT1JZX1JFVEVOVElPTlxuICAgIHJldHVybiB0aGlzLml0ZW1zLnNsaWNlKC1rZXB0KSBhcyBDb25zb2xlRW50cnlbXSB8IFVwZGF0ZVJlc3BvbnNlW11cbiAgfVxuXG4gIGdldCBmbGlwTGF5b3V0ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5mbGlwQ29uc29sZUxheW91dFxuICB9XG5cbiAgc2V0IGZsaXBMYXlvdXQgKF8pIHtcbiAgICB0aGlzLnNjcm9sbFRvTGF0ZXN0KHRydWUpXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICB0aGlzLmR5bmFtaWNTY3JvbGxlci4kZWwuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5vblNjcm9sbClcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuZHluYW1pY1Njcm9sbGVyLiRlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKVxuICB9XG5cbiAgQFdhdGNoKCdpdGVtcycsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIG9uSXRlbXNDaGFuZ2UgKF86IHVua25vd24sIG9sZEl0ZW1zOiB1bmtub3duW10pIHtcbiAgICBpZiAodGhpcy5keW5hbWljU2Nyb2xsZXIpIHtcbiAgICAgIGNvbnN0IGVsID0gdGhpcy5keW5hbWljU2Nyb2xsZXIuJGVsXG5cbiAgICAgIGlmICh0aGlzLmZsaXBMYXlvdXQgJiYgKHRoaXMuX3BhdXNlU2Nyb2xsIHx8ICF0aGlzLiRzdG9yZS5zdGF0ZS5jb25zb2xlLmF1dG9TY3JvbGwpKSB7XG4gICAgICAgIGNvbnN0IHsgc2Nyb2xsSGVpZ2h0LCBjbGllbnRIZWlnaHQgfSA9IGVsXG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA+IGNsaWVudEhlaWdodCkge1xuICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgIGVsLnNjcm9sbFRvcCArPSBlbC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxIZWlnaHRcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNjcm9sbFRvTGF0ZXN0KG9sZEl0ZW1zPy5sZW5ndGggPT09IDApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU2Nyb2xsaW5nUGF1c2VkICgpIHtcbiAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICBjb25zdCB7IHNjcm9sbFRvcCwgc2Nyb2xsSGVpZ2h0LCBjbGllbnRIZWlnaHQgfSA9IHRoaXMuZHluYW1pY1Njcm9sbGVyLiRlbFxuXG4gICAgICBjb25zdCBwYXVzZVNjcm9sbCA9IHRoaXMuZmxpcExheW91dCA/IHNjcm9sbFRvcCA+IDEgOiBzY3JvbGxIZWlnaHQgLSBzY3JvbGxUb3AgLSBjbGllbnRIZWlnaHQgPiAxXG5cbiAgICAgIGlmICh0aGlzLl9wYXVzZVNjcm9sbCAhPT0gcGF1c2VTY3JvbGwpIHtcbiAgICAgICAgdGhpcy5fcGF1c2VTY3JvbGwgPSBwYXVzZVNjcm9sbFxuICAgICAgICB0aGlzLnNjcm9sbGluZ1BhdXNlZE1vZGVsID0gcGF1c2VTY3JvbGxcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgb25TY3JvbGwgKCkge1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsaW5nUGF1c2VkKClcbiAgfVxuXG4gIHNjcm9sbFRvTGF0ZXN0IChmb3JjZT86IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5fcGF1c2VTY3JvbGwgJiYgIWZvcmNlKSByZXR1cm5cblxuICAgIGlmICh0aGlzLmR5bmFtaWNTY3JvbGxlcikge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLiRzdG9yZS5zdGF0ZS5jb25zb2xlLmF1dG9TY3JvbGwgfHxcbiAgICAgICAgdGhpcy5yZWFkb25seSB8fFxuICAgICAgICBmb3JjZVxuICAgICAgKSB7XG4gICAgICAgIGlmICh0aGlzLmZsaXBMYXlvdXQpIHtcbiAgICAgICAgICB0aGlzLmR5bmFtaWNTY3JvbGxlci5zY3JvbGxUb0l0ZW0oMClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmR5bmFtaWNTY3JvbGxlci5zY3JvbGxUb0JvdHRvbSgpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZvcmNlKSB7XG4gICAgICAgIC8vIFRoZSBmaXhlZC9mbG9hdGluZyBuYXR1cmUgb2YgdGhlIGNvbnNvbGUgbWF5IG9ubHkgY2hhbmdlIGlmIHRoZSBzY3JvbGwgaXMgZm9yY2VkLlxuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbGluZ1BhdXNlZCgpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2VuZENvbW1hbmQgKGNvbW1hbmQ/OiBzdHJpbmcpIHtcbiAgICBpZiAoY29tbWFuZCAmJiBjb21tYW5kLmxlbmd0aCkge1xuICAgICAgLy8gSWYgY2xpZW50cyBkZXRlY3QgTTExMiBpbnB1dCBmcm9tIHRoZSBjb25zb2xlLCB3ZSBzaG91bGQgaW52b2tlIHRoZSBlbWVyZ2VuY3lfc3RvcCBlbmRwb2ludFxuICAgICAgaWYgKGNvbW1hbmQudHJpbSgpLnRvTG93ZXJDYXNlKCkgPT09ICdtMTEyJykge1xuICAgICAgICBTb2NrZXRBY3Rpb25zLnByaW50ZXJFbWVyZ2VuY3lTdG9wKClcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VuZEdjb2RlKGNvbW1hbmQpXG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gJydcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFbnRyeUNsaWNrIChjb21tYW5kOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAuY29uc29sZSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICB9XG5cbiAgLmNvbnNvbGUtaXRlbSB7XG4gICAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB9XG5cbiAgLmNvbnNvbGUtd3JhcHBlciB7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pO1xuICAgIGZvbnQtc2l6ZTogMC44MTI1cmVtO1xuICAgIGxpbmUtaGVpZ2h0OiAxLjY7XG4gICAgcGFkZGluZzogOHB4IDE2cHg7XG4gIH1cblxuICAuY29uc29sZS13cmFwcGVyLS1zbSB7IGZvbnQtc2l6ZTogMTFweDsgfVxuICAuY29uc29sZS13cmFwcGVyLS1sZyB7IGZvbnQtc2l6ZTogMTQuNXB4OyB9XG5cbiAgLmNvbnNvbGUtc2Nyb2xsZXIge1xuICAgIGhlaWdodDogMzAwcHg7XG4gIH1cbiAgLmNvbnNvbGUtc2Nyb2xsZXItZnVsbHNjcmVlbiB7XG4gICAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjQwcHgpO1xuICAgIGhlaWdodDogY2FsYygxMDBzdmggLSAyNDBweCk7XG4gIH1cblxuICAudi1pbnB1dCB7XG4gICAgZmxleDogMCAwIGF1dG87XG4gIH1cblxuICA6ZGVlcCgudnVlLXJlY3ljbGUtc2Nyb2xsZXJfX2l0ZW0td3JhcHBlcikge1xuICAgIG92ZXJmbG93OiByZXZlcnQ7XG4gIH1cblxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvY29uc29sZS9Db25zb2xlLnZ1ZSJ9