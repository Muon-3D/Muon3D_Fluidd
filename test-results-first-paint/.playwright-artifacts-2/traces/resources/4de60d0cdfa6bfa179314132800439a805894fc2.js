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
import { Component, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import {
  MACRO_GROUPS,
  arrangeMacros,
  macroUse,
  topMacros
} from "/src/services/macros/arrange.ts";
import { normalisePicks, pickedMacros, quickCommandEligible, togglePick } from "/src/services/control/quick-command-picks.ts";
export const QUICK_COMMANDS_MAX = 11;
let MacrosMixin = class extends Vue {
  get arrangedMacros() {
    const configfile = this.$store.state.printer.printer.configfile ?? {};
    const settings = configfile.settings ?? {};
    const raw = configfile.config ?? {};
    const sources = Object.entries(settings).filter(([key]) => key.startsWith("gcode_macro ")).map(([key, s]) => ({
      name: key.slice("gcode_macro ".length),
      description: s.description,
      gcode: typeof s.gcode === "string" ? s.gcode : "",
      renameExisting: s.rename_existing || void 0
    }));
    const hooks = [];
    for (const [section, options] of Object.entries(raw)) {
      if (section.startsWith("gcode_macro ")) continue;
      for (const [option, value] of Object.entries(options ?? {})) {
        if ((option === "gcode" || option.endsWith("_gcode")) && typeof value === "string") hooks.push(value);
      }
    }
    const entries = this.$store.state.console.console;
    const sent = [
      ...entries.filter((e) => e.type === "command").map((e) => e.message),
      ...this.$store.state.console.commandHistory
    ];
    const used = macroUse(sent, sources.map((s) => s.name));
    const stored = new Map(this.$store.getters["macros/getMacros"].map((m) => [m.name.toUpperCase(), m]));
    return arrangeMacros(sources, hooks, used).filter((m) => !m.name.startsWith("_")).flatMap((m) => {
      const s = stored.get(m.name);
      if (s && !s.visible) return [];
      return [{
        ...m,
        userGroup: s?.category?.name ?? null,
        disabledWhilePrinting: !!s?.disabledWhilePrinting,
        color: s?.color ?? ""
      }];
    });
  }
  /** The groups in order, each sorted best first; groups set under Settings › Macros come first. */
  get macroGroups() {
    const groups = [];
    const userGroups = [...new Set(this.arrangedMacros.map((m) => m.userGroup).filter((g) => !!g))].sort();
    for (const label of userGroups) {
      groups.push({ id: `user:${label}`, label, macros: this.arrangedMacros.filter((m) => m.userGroup === label) });
    }
    for (const g of MACRO_GROUPS) {
      const macros = this.arrangedMacros.filter((m) => !m.userGroup && m.group === g.id);
      if (macros.length) groups.push({ id: g.id, label: g.label, macros });
    }
    return groups.map((g) => ({ ...g, macros: [...g.macros].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)) }));
  }
  /** The few to put first, a couple from each group. */
  topMacroList(count) {
    return topMacros(this.arrangedMacros, count);
  }
  /** What the person chose on the Macros page's Quick commands section (KAN-2122), or null for the automatic pick. */
  get quickCommandPicks() {
    return normalisePicks(this.$store.state.config?.uiSettings?.general?.quickCommands);
  }
  /** The names the automatic pick shows at the tile's largest. */
  get autoQuickCommandNames() {
    return this.topMacroList(QUICK_COMMANDS_MAX).map((m) => m.name);
  }
  /** The Quick commands to show, at most `count`: the person's picks in their order, else the automatic pick. */
  quickCommandList(count) {
    return pickedMacros(this.arrangedMacros.filter(quickCommandEligible), this.quickCommandPicks, (n) => this.topMacroList(n), count);
  }
  /** Tick or untick a command for Overview and Control; kept in the printer's settings. */
  setQuickCommand(name, on) {
    const value = togglePick(this.quickCommandPicks, name, on, this.autoQuickCommandNames);
    this.$store.dispatch("config/saveByPath", { path: "uiSettings.general.quickCommands", value, server: true });
  }
  macroGroupLabel(id) {
    return MACRO_GROUPS.find((g) => g.id === id)?.label ?? id;
  }
};
MacrosMixin = __decorateClass([
  Component
], MacrosMixin);
export {
  MacrosMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hY3Jvcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IE1hY3JvIH0gZnJvbSAnQC9zdG9yZS9tYWNyb3MvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IENvbnNvbGVFbnRyeSB9IGZyb20gJ0Avc3RvcmUvY29uc29sZS90eXBlcydcbmltcG9ydCB7XG4gIE1BQ1JPX0dST1VQUyxcbiAgYXJyYW5nZU1hY3JvcyxcbiAgbWFjcm9Vc2UsXG4gIHRvcE1hY3JvcyxcbiAgdHlwZSBBcnJhbmdlZE1hY3JvLFxuICB0eXBlIE1hY3JvR3JvdXBJZCxcbiAgdHlwZSBNYWNyb1NvdXJjZVxufSBmcm9tICdAL3NlcnZpY2VzL21hY3Jvcy9hcnJhbmdlJ1xuaW1wb3J0IHsgbm9ybWFsaXNlUGlja3MsIHBpY2tlZE1hY3JvcywgcXVpY2tDb21tYW5kRWxpZ2libGUsIHRvZ2dsZVBpY2ssIHR5cGUgUXVpY2tDb21tYW5kUGlja3MgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnRyb2wvcXVpY2stY29tbWFuZC1waWNrcydcblxuLyoqIFRoZSBtb3N0IHRoZSBRdWljayBjb21tYW5kcyB0aWxlIHNob3dzIChpdHMgbGFyZ2VzdCBzaXplKSwgYW5kIHRoZSBhdXRvbWF0aWMgcGljayB0aGUgTWFjcm9zIHBhZ2Ugc3RhcnRzIGZyb20uICovXG5leHBvcnQgY29uc3QgUVVJQ0tfQ09NTUFORFNfTUFYID0gMTFcblxuLyoqIEEgbWFjcm8gYXMgdGhlIHJlZGVzaWduIHNob3dzIGl0OiBhcnJhbmdlZCwgd2l0aCB3aGF0IFNldHRpbmdzIOKAuiBNYWNyb3Mgc2F5cyBhYm91dCBpdC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2hvd25NYWNybyBleHRlbmRzIEFycmFuZ2VkTWFjcm8ge1xuICAvKiogVGhlIGdyb3VwIGEgcGVyc29uIHB1dCBpdCBpbiB1bmRlciBTZXR0aW5ncyDigLogTWFjcm9zLCB3aGljaCB3aW5zIG92ZXIgdGhlIGF1dG9tYXRpYyBvbmUuICovXG4gIHVzZXJHcm91cDogc3RyaW5nIHwgbnVsbDtcbiAgZGlzYWJsZWRXaGlsZVByaW50aW5nOiBib29sZWFuO1xuICBjb2xvcjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNob3duTWFjcm9Hcm91cCB7XG4gIGlkOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIG1hY3JvczogU2hvd25NYWNyb1tdO1xufVxuXG4vKipcbiAqIFRoZSBwcmludGVyJ3MgbWFjcm9zLCBhcnJhbmdlZCAoc2VydmljZXMvbWFjcm9zL2FycmFuZ2UudHMpIGZyb20gd2hhdFxuICogS2xpcHBlciBwdWJsaXNoZXM6IGV2ZXJ5IGdjb2RlX21hY3JvJ3Mgc2V0dGluZ3MsIHRoZSByYXcgY29uZmlnJ3Mgb3RoZXJcbiAqIGhvb2tzLCBhbmQgd2hhdCB0aGlzIHByaW50ZXIncyBjb25zb2xlIGhhcyBydW4uIEEgbWFjcm8gaGlkZGVuIHVuZGVyXG4gKiBTZXR0aW5ncyDigLogTWFjcm9zIHN0YXlzIGhpZGRlbiwgYW5kIGEgZ3JvdXAgc2V0IHRoZXJlIHdpbnMuXG4gKi9cbkBDb21wb25lbnRcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hY3Jvc01peGluIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IGFycmFuZ2VkTWFjcm9zICgpOiBTaG93bk1hY3JvW10ge1xuICAgIGNvbnN0IGNvbmZpZ2ZpbGUgPSB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZSA/PyB7fVxuICAgIGNvbnN0IHNldHRpbmdzID0gKGNvbmZpZ2ZpbGUuc2V0dGluZ3MgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+PlxuICAgIGNvbnN0IHJhdyA9IChjb25maWdmaWxlLmNvbmZpZyA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgdW5rbm93bj4+XG4gICAgY29uc3Qgc291cmNlczogTWFjcm9Tb3VyY2VbXSA9IE9iamVjdC5lbnRyaWVzKHNldHRpbmdzKVxuICAgICAgLmZpbHRlcigoW2tleV0pID0+IGtleS5zdGFydHNXaXRoKCdnY29kZV9tYWNybyAnKSlcbiAgICAgIC5tYXAoKFtrZXksIHNdKSA9PiAoe1xuICAgICAgICBuYW1lOiBrZXkuc2xpY2UoJ2djb2RlX21hY3JvICcubGVuZ3RoKSxcbiAgICAgICAgZGVzY3JpcHRpb246IHMuZGVzY3JpcHRpb24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgICAgICBnY29kZTogdHlwZW9mIHMuZ2NvZGUgPT09ICdzdHJpbmcnID8gcy5nY29kZSA6ICcnLFxuICAgICAgICByZW5hbWVFeGlzdGluZzogKHMucmVuYW1lX2V4aXN0aW5nIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgfHwgdW5kZWZpbmVkXG4gICAgICB9KSlcbiAgICBjb25zdCBob29rczogc3RyaW5nW10gPSBbXVxuICAgIGZvciAoY29uc3QgW3NlY3Rpb24sIG9wdGlvbnNdIG9mIE9iamVjdC5lbnRyaWVzKHJhdykpIHtcbiAgICAgIGlmIChzZWN0aW9uLnN0YXJ0c1dpdGgoJ2djb2RlX21hY3JvICcpKSBjb250aW51ZVxuICAgICAgZm9yIChjb25zdCBbb3B0aW9uLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMob3B0aW9ucyA/PyB7fSkpIHtcbiAgICAgICAgaWYgKChvcHRpb24gPT09ICdnY29kZScgfHwgb3B0aW9uLmVuZHNXaXRoKCdfZ2NvZGUnKSkgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykgaG9va3MucHVzaCh2YWx1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZW50cmllcyA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29uc29sZSBhcyBDb25zb2xlRW50cnlbXVxuICAgIGNvbnN0IHNlbnQgPSBbXG4gICAgICAuLi5lbnRyaWVzLmZpbHRlcihlID0+IGUudHlwZSA9PT0gJ2NvbW1hbmQnKS5tYXAoZSA9PiBlLm1lc3NhZ2UpLFxuICAgICAgLi4uKHRoaXMuJHN0b3JlLnN0YXRlLmNvbnNvbGUuY29tbWFuZEhpc3RvcnkgYXMgc3RyaW5nW10pXG4gICAgXVxuICAgIGNvbnN0IHVzZWQgPSBtYWNyb1VzZShzZW50LCBzb3VyY2VzLm1hcChzID0+IHMubmFtZSkpXG4gICAgY29uc3Qgc3RvcmVkID0gbmV3IE1hcCgodGhpcy4kc3RvcmUuZ2V0dGVyc1snbWFjcm9zL2dldE1hY3JvcyddIGFzIE1hY3JvW10pLm1hcChtID0+IFttLm5hbWUudG9VcHBlckNhc2UoKSwgbV0pKVxuICAgIHJldHVybiBhcnJhbmdlTWFjcm9zKHNvdXJjZXMsIGhvb2tzLCB1c2VkKVxuICAgICAgLmZpbHRlcihtID0+ICFtLm5hbWUuc3RhcnRzV2l0aCgnXycpKVxuICAgICAgLmZsYXRNYXAobSA9PiB7XG4gICAgICAgIGNvbnN0IHMgPSBzdG9yZWQuZ2V0KG0ubmFtZSlcbiAgICAgICAgaWYgKHMgJiYgIXMudmlzaWJsZSkgcmV0dXJuIFtdXG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIC4uLm0sXG4gICAgICAgICAgdXNlckdyb3VwOiBzPy5jYXRlZ29yeT8ubmFtZSA/PyBudWxsLFxuICAgICAgICAgIGRpc2FibGVkV2hpbGVQcmludGluZzogISFzPy5kaXNhYmxlZFdoaWxlUHJpbnRpbmcsXG4gICAgICAgICAgY29sb3I6IHM/LmNvbG9yID8/ICcnXG4gICAgICAgIH1dXG4gICAgICB9KVxuICB9XG5cbiAgLyoqIFRoZSBncm91cHMgaW4gb3JkZXIsIGVhY2ggc29ydGVkIGJlc3QgZmlyc3Q7IGdyb3VwcyBzZXQgdW5kZXIgU2V0dGluZ3Mg4oC6IE1hY3JvcyBjb21lIGZpcnN0LiAqL1xuICBnZXQgbWFjcm9Hcm91cHMgKCk6IFNob3duTWFjcm9Hcm91cFtdIHtcbiAgICBjb25zdCBncm91cHM6IFNob3duTWFjcm9Hcm91cFtdID0gW11cbiAgICBjb25zdCB1c2VyR3JvdXBzID0gWy4uLm5ldyBTZXQodGhpcy5hcnJhbmdlZE1hY3Jvcy5tYXAobSA9PiBtLnVzZXJHcm91cCkuZmlsdGVyKChnKTogZyBpcyBzdHJpbmcgPT4gISFnKSldLnNvcnQoKVxuICAgIGZvciAoY29uc3QgbGFiZWwgb2YgdXNlckdyb3Vwcykge1xuICAgICAgZ3JvdXBzLnB1c2goeyBpZDogYHVzZXI6JHtsYWJlbH1gLCBsYWJlbCwgbWFjcm9zOiB0aGlzLmFycmFuZ2VkTWFjcm9zLmZpbHRlcihtID0+IG0udXNlckdyb3VwID09PSBsYWJlbCkgfSlcbiAgICB9XG4gICAgZm9yIChjb25zdCBnIG9mIE1BQ1JPX0dST1VQUykge1xuICAgICAgY29uc3QgbWFjcm9zID0gdGhpcy5hcnJhbmdlZE1hY3Jvcy5maWx0ZXIobSA9PiAhbS51c2VyR3JvdXAgJiYgbS5ncm91cCA9PT0gZy5pZClcbiAgICAgIGlmIChtYWNyb3MubGVuZ3RoKSBncm91cHMucHVzaCh7IGlkOiBnLmlkLCBsYWJlbDogZy5sYWJlbCwgbWFjcm9zIH0pXG4gICAgfVxuICAgIHJldHVybiBncm91cHMubWFwKGcgPT4gKHsgLi4uZywgbWFjcm9zOiBbLi4uZy5tYWNyb3NdLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpIH0pKVxuICB9XG5cbiAgLyoqIFRoZSBmZXcgdG8gcHV0IGZpcnN0LCBhIGNvdXBsZSBmcm9tIGVhY2ggZ3JvdXAuICovXG4gIHRvcE1hY3JvTGlzdCAoY291bnQ6IG51bWJlcik6IFNob3duTWFjcm9bXSB7XG4gICAgcmV0dXJuIHRvcE1hY3Jvcyh0aGlzLmFycmFuZ2VkTWFjcm9zLCBjb3VudCkgYXMgU2hvd25NYWNyb1tdXG4gIH1cblxuICAvKiogV2hhdCB0aGUgcGVyc29uIGNob3NlIG9uIHRoZSBNYWNyb3MgcGFnZSdzIFF1aWNrIGNvbW1hbmRzIHNlY3Rpb24gKEtBTi0yMTIyKSwgb3IgbnVsbCBmb3IgdGhlIGF1dG9tYXRpYyBwaWNrLiAqL1xuICBnZXQgcXVpY2tDb21tYW5kUGlja3MgKCk6IFF1aWNrQ29tbWFuZFBpY2tzIHtcbiAgICByZXR1cm4gbm9ybWFsaXNlUGlja3ModGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnPy51aVNldHRpbmdzPy5nZW5lcmFsPy5xdWlja0NvbW1hbmRzKVxuICB9XG5cbiAgLyoqIFRoZSBuYW1lcyB0aGUgYXV0b21hdGljIHBpY2sgc2hvd3MgYXQgdGhlIHRpbGUncyBsYXJnZXN0LiAqL1xuICBnZXQgYXV0b1F1aWNrQ29tbWFuZE5hbWVzICgpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMudG9wTWFjcm9MaXN0KFFVSUNLX0NPTU1BTkRTX01BWCkubWFwKG0gPT4gbS5uYW1lKVxuICB9XG5cbiAgLyoqIFRoZSBRdWljayBjb21tYW5kcyB0byBzaG93LCBhdCBtb3N0IGBjb3VudGA6IHRoZSBwZXJzb24ncyBwaWNrcyBpbiB0aGVpciBvcmRlciwgZWxzZSB0aGUgYXV0b21hdGljIHBpY2suICovXG4gIHF1aWNrQ29tbWFuZExpc3QgKGNvdW50OiBudW1iZXIpOiBTaG93bk1hY3JvW10ge1xuICAgIHJldHVybiBwaWNrZWRNYWNyb3ModGhpcy5hcnJhbmdlZE1hY3Jvcy5maWx0ZXIocXVpY2tDb21tYW5kRWxpZ2libGUpLCB0aGlzLnF1aWNrQ29tbWFuZFBpY2tzLCBuID0+IHRoaXMudG9wTWFjcm9MaXN0KG4pLCBjb3VudClcbiAgfVxuXG4gIC8qKiBUaWNrIG9yIHVudGljayBhIGNvbW1hbmQgZm9yIE92ZXJ2aWV3IGFuZCBDb250cm9sOyBrZXB0IGluIHRoZSBwcmludGVyJ3Mgc2V0dGluZ3MuICovXG4gIHNldFF1aWNrQ29tbWFuZCAobmFtZTogc3RyaW5nLCBvbjogYm9vbGVhbikge1xuICAgIGNvbnN0IHZhbHVlID0gdG9nZ2xlUGljayh0aGlzLnF1aWNrQ29tbWFuZFBpY2tzLCBuYW1lLCBvbiwgdGhpcy5hdXRvUXVpY2tDb21tYW5kTmFtZXMpXG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9zYXZlQnlQYXRoJywgeyBwYXRoOiAndWlTZXR0aW5ncy5nZW5lcmFsLnF1aWNrQ29tbWFuZHMnLCB2YWx1ZSwgc2VydmVyOiB0cnVlIH0pXG4gIH1cblxuICBtYWNyb0dyb3VwTGFiZWwgKGlkOiBNYWNyb0dyb3VwSWQpOiBzdHJpbmcge1xuICAgIHJldHVybiBNQUNST19HUk9VUFMuZmluZChnID0+IGcuaWQgPT09IGlkKT8ubGFiZWwgPz8gaWRcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLFdBQVc7QUFHL0I7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FJSztBQUNQLFNBQVMsZ0JBQWdCLGNBQWMsc0JBQXNCLGtCQUEwQztBQUdoRyxhQUFNLHFCQUFxQjtBQXVCbEMsSUFBcUIsY0FBckIsY0FBeUMsSUFBSTtBQUFBLEVBQzNDLElBQUksaUJBQWdDO0FBQ2xDLFVBQU0sYUFBYSxLQUFLLE9BQU8sTUFBTSxRQUFRLFFBQVEsY0FBYyxDQUFDO0FBQ3BFLFVBQU0sV0FBWSxXQUFXLFlBQVksQ0FBQztBQUMxQyxVQUFNLE1BQU8sV0FBVyxVQUFVLENBQUM7QUFDbkMsVUFBTSxVQUF5QixPQUFPLFFBQVEsUUFBUSxFQUNuRCxPQUFPLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxXQUFXLGNBQWMsQ0FBQyxFQUNoRCxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTztBQUFBLE1BQ2xCLE1BQU0sSUFBSSxNQUFNLGVBQWUsTUFBTTtBQUFBLE1BQ3JDLGFBQWEsRUFBRTtBQUFBLE1BQ2YsT0FBTyxPQUFPLEVBQUUsVUFBVSxXQUFXLEVBQUUsUUFBUTtBQUFBLE1BQy9DLGdCQUFpQixFQUFFLG1CQUEwQztBQUFBLElBQy9ELEVBQUU7QUFDSixVQUFNLFFBQWtCLENBQUM7QUFDekIsZUFBVyxDQUFDLFNBQVMsT0FBTyxLQUFLLE9BQU8sUUFBUSxHQUFHLEdBQUc7QUFDcEQsVUFBSSxRQUFRLFdBQVcsY0FBYyxFQUFHO0FBQ3hDLGlCQUFXLENBQUMsUUFBUSxL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