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
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { SocketActions } from "/src/api/socketActions.ts";
import { Component } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let StateMixin = class extends Vue {
  get authenticated() {
    return this.$store.getters["auth/getAuthenticated"];
  }
  get socketConnected() {
    return this.$store.getters["socket/getConnectionState"];
  }
  get apiConnected() {
    return this.$store.getters["socket/getApiConnected"];
  }
  get socketConnecting() {
    return this.$store.getters["socket/getConnectingState"];
  }
  get klippyReady() {
    return this.$store.getters["printer/getKlippyReady"];
  }
  get klippyConnected() {
    return this.$store.getters["printer/getKlippyConnected"];
  }
  get hasWarnings() {
    return this.$store.getters["printer/getHasWarnings"];
  }
  get klippyState() {
    return this.$store.getters["printer/getKlippyState"];
  }
  get klippyStateMessage() {
    return this.$store.getters["printer/getKlippyStateMessage"];
  }
  // Return the printer state
  get printerState() {
    return this.$store.getters["printer/getPrinterState"];
  }
  // Returns a boolean indicating if the printer is busy.
  get printerBusy() {
    const printerState = this.printerState.toLowerCase();
    return printerState === "printing" || printerState === "paused" || printerState === "busy";
  }
  // Returns a boolean indicating if the printer is paused.
  get printerPaused() {
    return this.printerState.toLowerCase() === "paused";
  }
  /**
   * Returns a boolean indicating of the printer is printing.
   * (versus busy in some other way...)
   */
  get printerPrinting() {
    return this.printerState.toLowerCase() === "printing";
  }
  /**
   * Indicates if we have a valid wait(s).
   * Supports a single string or a list of.
   */
  hasWait(wait) {
    return this.$store.getters["wait/hasWait"](wait);
  }
  /**
   * Indicates if we have any waits.
   */
  get hasWaits() {
    return this.$store.getters["wait/hasWaits"];
  }
  /**
   * Indicates if we have any waits prefixed by.
   */
  hasWaitsBy(prefix) {
    return this.$store.getters["wait/hasWaitsBy"](prefix);
  }
  /**
   * Send a gcode script.
   */
  sendGcode(gcode, wait) {
    SocketActions.printerGcodeScript(gcode, wait);
    this.addConsoleEntry(gcode);
  }
  sendMoveGcode(movementGcode, rate, absolute = false, wait) {
    const gcode = `SAVE_GCODE_STATE NAME=_ui_movement
G9${absolute ? 0 : 1}
G1 ${movementGcode} F${rate * 60}
RESTORE_GCODE_STATE NAME=_ui_movement`;
    this.sendGcode(gcode, wait);
  }
  sendExtrudeGcode(amount, rate, wait) {
    const gcode = `SAVE_GCODE_STATE NAME=_ui_retract
M83
G1 E${amount} F${rate * 60}
RESTORE_GCODE_STATE NAME=_ui_retract`;
    this.sendGcode(gcode, wait);
  }
  addConsoleEntry(message) {
    this.$store.dispatch("console/onAddConsoleEntry", { message, type: "command" });
  }
  async emergencyStop() {
    const confirmOnEstop = this.$store.state.config.uiSettings.general.confirmOnEstop;
    const result = !confirmOnEstop || await this.$confirm(
      "Everything stops at once: the print, the heaters and the motors. The printer then has to restart before it can do anything else.",
      { title: "Stop the printer now?", buttonTrueText: "Stop now", buttonFalseText: "Keep going", danger: true }
    );
    if (result) {
      SocketActions.printerEmergencyStop();
    }
  }
  async cancelPrint() {
    const result = await this.$confirm(
      "The print stops and can't be picked up again. What has printed stays on the plate: take it off before the next print.",
      { title: "Cancel this print?", buttonTrueText: "Cancel the print", buttonFalseText: "Keep printing", danger: true }
    );
    if (result) {
      SocketActions.printerPrintCancel();
      this.addConsoleEntry("CANCEL_PRINT");
    }
  }
  pausePrint() {
    SocketActions.printerPrintPause();
    this.addConsoleEntry("PAUSE");
  }
  resumePrint() {
    SocketActions.printerPrintResume();
    this.addConsoleEntry("RESUME");
  }
  homeAll() {
    this.sendGcode("G28", this.$waits.onHomeAll);
  }
};
StateMixin = __decorateClass([
  Component
], StateMixin);
export {
  StateMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0ZU1peGluIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IGF1dGhlbnRpY2F0ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydhdXRoL2dldEF1dGhlbnRpY2F0ZWQnXSBhcyBib29sZWFuXG4gIH1cblxuICBnZXQgc29ja2V0Q29ubmVjdGVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snc29ja2V0L2dldENvbm5lY3Rpb25TdGF0ZSddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIGdldCBhcGlDb25uZWN0ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzb2NrZXQvZ2V0QXBpQ29ubmVjdGVkJ10gYXMgYm9vbGVhblxuICB9XG5cbiAgZ2V0IHNvY2tldENvbm5lY3RpbmcgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydzb2NrZXQvZ2V0Q29ubmVjdGluZ1N0YXRlJ10gYXMgYm9vbGVhblxuICB9XG5cbiAgZ2V0IGtsaXBweVJlYWR5ICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRLbGlwcHlSZWFkeSddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIGdldCBrbGlwcHlDb25uZWN0ZWQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEtsaXBweUNvbm5lY3RlZCddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIGdldCBoYXNXYXJuaW5ncyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0SGFzV2FybmluZ3MnXSBhcyBib29sZWFuXG4gIH1cblxuICBnZXQga2xpcHB5U3RhdGUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0S2xpcHB5U3RhdGUnXSBhcyBzdHJpbmdcbiAgfVxuXG4gIGdldCBrbGlwcHlTdGF0ZU1lc3NhZ2UgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0S2xpcHB5U3RhdGVNZXNzYWdlJ10gYXMgc3RyaW5nXG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIHByaW50ZXIgc3RhdGVcbiAgZ2V0IHByaW50ZXJTdGF0ZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1sncHJpbnRlci9nZXRQcmludGVyU3RhdGUnXSBhcyBzdHJpbmdcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIHByaW50ZXIgaXMgYnVzeS5cbiAgZ2V0IHByaW50ZXJCdXN5ICgpIHtcbiAgICBjb25zdCBwcmludGVyU3RhdGUgPSB0aGlzLnByaW50ZXJTdGF0ZS50b0xvd2VyQ2FzZSgpXG5cbiAgICByZXR1cm4gKFxuICAgICAgcHJpbnRlclN0YXRlID09PSAncHJpbnRpbmcnIHx8XG4gICAgICBwcmludGVyU3RhdGUgPT09ICdwYXVzZWQnIHx8XG4gICAgICBwcmludGVyU3RhdGUgPT09ICdidXN5J1xuICAgIClcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIHByaW50ZXIgaXMgcGF1c2VkLlxuICBnZXQgcHJpbnRlclBhdXNlZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRlclN0YXRlLnRvTG93ZXJDYXNlKCkgPT09ICdwYXVzZWQnXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gaW5kaWNhdGluZyBvZiB0aGUgcHJpbnRlciBpcyBwcmludGluZy5cbiAgICogKHZlcnN1cyBidXN5IGluIHNvbWUgb3RoZXIgd2F5Li4uKVxuICAgKi9cbiAgZ2V0IHByaW50ZXJQcmludGluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucHJpbnRlclN0YXRlLnRvTG93ZXJDYXNlKCkgPT09ICdwcmludGluZydcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgd2UgaGF2ZSBhIHZhbGlkIHdhaXQocykuXG4gICAqIFN1cHBvcnRzIGEgc2luZ2xlIHN0cmluZyBvciBhIGxpc3Qgb2YuXG4gICAqL1xuICBoYXNXYWl0ICh3YWl0OiBzdHJpbmcgfCBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWyd3YWl0L2hhc1dhaXQnXSh3YWl0KSBhcyBib29sZWFuXG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHdlIGhhdmUgYW55IHdhaXRzLlxuICAgKi9cbiAgZ2V0IGhhc1dhaXRzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snd2FpdC9oYXNXYWl0cyddIGFzIGJvb2xlYW5cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgd2UgaGF2ZSBhbnkgd2FpdHMgcHJlZml4ZWQgYnkuXG4gICAqL1xuICBoYXNXYWl0c0J5IChwcmVmaXg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWyd3YWl0L2hhc1dhaXRzQnknXShwcmVmaXgpIGFzIGJvb2xlYW5cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgZ2NvZGUgc2NyaXB0LlxuICAgKi9cbiAgc2VuZEdjb2RlIChnY29kZTogc3RyaW5nLCB3YWl0Pzogc3RyaW5nKSB7XG4gICAgU29ja2V0QWN0aW9ucy5wcmludGVyR2NvZGVTY3JpcHQoZ2NvZGUsIHdhaXQpXG4gICAgdGhpcy5hZGRDb25zb2xlRW50cnkoZ2NvZGUpXG4gIH1cblxuICBzZW5kTW92ZUdjb2RlIChtb3ZlbWVudEdjb2RlOiBzdHJpbmcsIHJhdGU6IG51bWJlciwgYWJzb2x1dGUgPSBmYWxzZSwgd2FpdD86IHN0cmluZykge1xuICAgIGNvbnN0IGdjb2RlID0gYFNBVkVfR0NPREVfU1RBVEUgTkFNRT1fdWlfbW92ZW1lbnRcbkc5JHthYnNvbHV0ZSA/IDAgOiAxfVxuRzEgJHttb3ZlbWVudEdjb2RlfSBGJHtyYXRlICogNjB9XG5SRVNUT1JFX0dDT0RFX1NUQVRFIE5BTUU9X3VpX21vdmVtZW50YFxuXG4gICAgdGhpcy5zZW5kR2NvZGUoZ2NvZGUsIHdhaXQpXG4gIH1cblxuICBzZW5kRXh0cnVkZUdjb2RlIChhbW91bnQ6IG51bWJlciwgcmF0ZTogbnVtYmVyLCB3YWl0Pzogc3RyaW5nKSB7XG4gICAgY29uc3QgZ2NvZGUgPSBgU0FWRV9HQ09ERV9TVEFURSBOQU1FPV91aV9yZXRyYWN0XG5NODNcbkcxIEUke2Ftb3VudH0gRiR7cmF0ZSAqIDYwfVxuUkVTVE9SRV9HQ09ERV9TVEFURSBOQU1FPV91aV9yZXRyYWN0YFxuXG4gICAgdGhpcy5zZW5kR2NvZGUoZ2NvZGUsIHdhaXQpXG4gIH1cblxuICBhZGRDb25zb2xlRW50cnkgKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdjb25zb2xlL29uQWRkQ29uc29sZUVudHJ5JywgeyBtZXNzYWdlLCB0eXBlOiAnY29tbWFuZCcgfSlcbiAgfVxuXG4gIGFzeW5jIGVtZXJnZW5jeVN0b3AgKCkge1xuICAgIGNvbnN0IGNvbmZpcm1PbkVzdG9wID0gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5jb25maXJtT25Fc3RvcFxuXG4gICAgY29uc3QgcmVzdWx0ID0gKFxuICAgICAgIWNvbmZpcm1PbkVzdG9wIHx8XG4gICAgICBhd2FpdCB0aGlzLiRjb25maXJtKFxuICAgICAgICAnRXZlcnl0aGluZyBzdG9wcyBhdCBvbmNlOiB0aGUgcHJpbnQsIHRoZSBoZWF0ZXJzIGFuZCB0aGUgbW90b3JzLiBUaGUgcHJpbnRlciB0aGVuIGhhcyB0byByZXN0YXJ0IGJlZm9yZSBpdCBjYW4gZG8gYW55dGhpbmcgZWxzZS4nLFxuICAgICAgICB7IHRpdGxlOiAnU3RvcCB0aGUgcHJpbnRlciBub3c/JywgYnV0dG9uVHJ1ZVRleHQ6ICdTdG9wIG5vdycsIGJ1dHRvbkZhbHNlVGV4dDogJ0tlZXAgZ29pbmcnLCBkYW5nZXI6IHRydWUgfVxuICAgICAgKVxuICAgIClcblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIFNvY2tldEFjdGlvbnMucHJpbnRlckVtZXJnZW5jeVN0b3AoKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNhbmNlbFByaW50ICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLiRjb25maXJtKFxuICAgICAgXCJUaGUgcHJpbnQgc3RvcHMgYW5kIGNhbid0IGJlIHBpY2tlZCB1cCBhZ2Fpbi4gV2hhdCBoYXMgcHJpbnRlZCBzdGF5cyBvbiB0aGUgcGxhdGU6IHRha2UgaXQgb2ZmIGJlZm9yZSB0aGUgbmV4dCBwcmludC5cIixcbiAgICAgIHsgdGl0bGU6ICdDYW5jZWwgdGhpcyBwcmludD8nLCBidXR0b25UcnVlVGV4dDogJ0NhbmNlbCB0aGUgcHJpbnQnLCBidXR0b25GYWxzZVRleHQ6ICdLZWVwIHByaW50aW5nJywgZGFuZ2VyOiB0cnVlIH1cbiAgICApXG5cbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBTb2NrZXRBY3Rpb25zLnByaW50ZXJQcmludENhbmNlbCgpXG4gICAgICB0aGlzLmFkZENvbnNvbGVFbnRyeSgnQ0FOQ0VMX1BSSU5UJylcbiAgICB9XG4gIH1cblxuICBwYXVzZVByaW50ICgpIHtcbiAgICBTb2NrZXRBY3Rpb25zLnByaW50ZXJQcmludFBhdXNlKClcbiAgICB0aGlzLmFkZENvbnNvbGVFbnRyeSgnUEFVU0UnKVxuICB9XG5cbiAgcmVzdW1lUHJpbnQgKCkge1xuICAgIFNvY2tldEFjdGlvbnMucHJpbnRlclByaW50UmVzdW1lKClcbiAgICB0aGlzLmFkZENvbnNvbGVFbnRyeSgnUkVTVU1FJylcbiAgfVxuXG4gIGhvbWVBbGwgKCkge1xuICAgIHRoaXMuc2VuZEdjb2RlKCdHMjgnLCB0aGlzLiR3YWl0cy5vbkhvbWVBbGwpXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLE9BQU8sU0FBUztBQUNoQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGlCQUFpQjtBQUcxQixJQUFxQixhQUFyQixjQUF3QyxJQUFJO0FBQUEsRUFDMUMsSUFBSSxnQkFBMEI7QUFDNUIsV0FBTyxLQUFLLE9BQU8sUUFBUSx1QkFBdUI7QUFBQSxFQUNwRDtBQUFBLEVBRUEsSUFBSSxrQkFBNEI7QUFDOUIsV0FBTyxLQUFLLE9BQU8sUUFBUSwyQkFBMkI7QUFBQSxFQUN4RDtBQUFBLEVBRUEsSUFBSSxlQUF5QjtBQUMzQixXQUFPLEtBQUssT0FBTyxRQUFRLHdCQUF3QjtBQUFBLEVBQ3JEO0FBQUEsRUFFQSxJQUFJLG1CQUE2QjtBQUMvQixXQUFPLEtBQUssT0FBTyxRQUFRLDJCQUEyQjtBQUFBLEVBQ3hEO0FBQUEsRUFFQSxJQUFJLGNBQXdCO0FBQzFCLFdBQU8sS0FBSyxPQUFPLFFBQVEsd0JBQXdCO0FBQUEsRUFDckQ7QUFBQSxFQUVBLElBQUksa0JBQTRCO0FBQzlCLFdBQU8sS0FBSyxPQUFPLFFBQVEsNEJBQTRCO0FBQUEsRUFDekQ7QUFBQSxFQUVBLElBQUksY0FBd0I7QUFDMUIsV0FBTyxLQUFLLE9BQU8sUUFBUSx3QkFBd0I7QUFBQSxFQUNyRDtBQUFBLEVBRUEsSUFBSSxjQUF1QjtBQUN6QixXQUFPLEtBQUssT0FBTyxRQUFRLHdCQUF3QjtBQUFBLEVBQ3JEO0FBQUEsRUFFQSxJQUFJLHFCQUE4QjtBQUNoQyxXQUFPLEtBQUssT0FBTyxRQUFRLCtCQUErQjtB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