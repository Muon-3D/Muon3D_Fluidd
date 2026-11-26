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
let ServicesMixin = class extends Vue {
  get moonrakerServiceName() {
    return this.$store.state.server.system_info?.instance_ids?.moonraker || "moonraker";
  }
  /**
   * Resets the UI when restarting/resetting Klipper
   */
  async _klipperReset() {
    this.$store.commit("socket/setAcceptNotifications", false);
    await this.$store.dispatch("server/resetKlippy", void 0, { root: true });
    await this.$store.dispatch("reset", [
      "printer",
      "charts",
      "wait"
    ], { root: true });
  }
  /**
   * Reboot the klipper host.
   */
  hostReboot() {
    SocketActions.machineReboot();
  }
  /**
   * Shutdown the klipper host.
   */
  hostShutdown() {
    SocketActions.machineShutdown();
  }
  /**
   * Restart the klipper service itself.
   */
  async serviceRestartKlipper() {
    this.serviceRestartByName("klipper");
  }
  /**
   * Restart the moonraker service itself.
   */
  serviceRestartMoonraker() {
    this.serviceRestartByName(this.moonrakerServiceName);
  }
  /**
   * Restart a service by name.
   */
  async serviceRestartByName(name) {
    if (name === this.moonrakerServiceName) {
      SocketActions.serverRestart();
      this.$store.commit("socket/setSocketDisconnecting", true);
    } else {
      if (name === "klipper") {
        await this._klipperReset();
      }
      SocketActions.machineServicesRestart(name);
    }
  }
  /**
   * Start a service by name.
   */
  async serviceStartByName(name) {
    SocketActions.machineServicesStart(name);
  }
  /**
   * Stop a service by name.
   */
  async serviceStopByName(name) {
    if (name === this.moonrakerServiceName) {
      throw new Error("Stopping the moonraker service is not supported");
    } else {
      if (name === "klipper") {
        await this._klipperReset();
      }
      SocketActions.machineServicesStop(name);
    }
  }
  /**
   * Restart klippy / std restart.
   */
  async restartKlippy() {
    await this._klipperReset();
    SocketActions.printerRestart();
  }
  /**
   * Restart klippy and the mcu's.
   */
  async firmwareRestartKlippy() {
    await this._klipperReset();
    SocketActions.printerFirmwareRestart();
  }
};
ServicesMixin = __decorateClass([
  Component
], ServicesMixin);
export {
  ServicesMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2VzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2aWNlc01peGluIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IG1vb25yYWtlclNlcnZpY2VOYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5zZXJ2ZXIuc3lzdGVtX2luZm8/Lmluc3RhbmNlX2lkcz8ubW9vbnJha2VyIGFzIHN0cmluZyB8fCAnbW9vbnJha2VyJ1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgVUkgd2hlbiByZXN0YXJ0aW5nL3Jlc2V0dGluZyBLbGlwcGVyXG4gICAqL1xuICBhc3luYyBfa2xpcHBlclJlc2V0ICgpIHtcbiAgICB0aGlzLiRzdG9yZS5jb21taXQoJ3NvY2tldC9zZXRBY2NlcHROb3RpZmljYXRpb25zJywgZmFsc2UpXG4gICAgYXdhaXQgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ3NlcnZlci9yZXNldEtsaXBweScsIHVuZGVmaW5lZCwgeyByb290OiB0cnVlIH0pXG4gICAgYXdhaXQgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ3Jlc2V0JywgW1xuICAgICAgJ3ByaW50ZXInLFxuICAgICAgJ2NoYXJ0cycsXG4gICAgICAnd2FpdCdcbiAgICBdLCB7IHJvb3Q6IHRydWUgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWJvb3QgdGhlIGtsaXBwZXIgaG9zdC5cbiAgICovXG4gIGhvc3RSZWJvb3QgKCkge1xuICAgIFNvY2tldEFjdGlvbnMubWFjaGluZVJlYm9vdCgpXG4gIH1cblxuICAvKipcbiAgICogU2h1dGRvd24gdGhlIGtsaXBwZXIgaG9zdC5cbiAgICovXG4gIGhvc3RTaHV0ZG93biAoKSB7XG4gICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lU2h1dGRvd24oKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhcnQgdGhlIGtsaXBwZXIgc2VydmljZSBpdHNlbGYuXG4gICAqL1xuICBhc3luYyBzZXJ2aWNlUmVzdGFydEtsaXBwZXIgKCkge1xuICAgIHRoaXMuc2VydmljZVJlc3RhcnRCeU5hbWUoJ2tsaXBwZXInKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhcnQgdGhlIG1vb25yYWtlciBzZXJ2aWNlIGl0c2VsZi5cbiAgICovXG4gIHNlcnZpY2VSZXN0YXJ0TW9vbnJha2VyICgpIHtcbiAgICB0aGlzLnNlcnZpY2VSZXN0YXJ0QnlOYW1lKHRoaXMubW9vbnJha2VyU2VydmljZU5hbWUpXG4gIH1cblxuICAvKipcbiAgICogUmVzdGFydCBhIHNlcnZpY2UgYnkgbmFtZS5cbiAgICovXG4gIGFzeW5jIHNlcnZpY2VSZXN0YXJ0QnlOYW1lIChuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAobmFtZSA9PT0gdGhpcy5tb29ucmFrZXJTZXJ2aWNlTmFtZSkge1xuICAgICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJSZXN0YXJ0KClcbiAgICAgIHRoaXMuJHN0b3JlLmNvbW1pdCgnc29ja2V0L3NldFNvY2tldERpc2Nvbm5lY3RpbmcnLCB0cnVlKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmFtZSA9PT0gJ2tsaXBwZXInKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2tsaXBwZXJSZXNldCgpXG4gICAgICB9XG5cbiAgICAgIFNvY2tldEFjdGlvbnMubWFjaGluZVNlcnZpY2VzUmVzdGFydChuYW1lKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBhIHNlcnZpY2UgYnkgbmFtZS5cbiAgICovXG4gIGFzeW5jIHNlcnZpY2VTdGFydEJ5TmFtZSAobmFtZTogc3RyaW5nKSB7XG4gICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lU2VydmljZXNTdGFydChuYW1lKVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgYSBzZXJ2aWNlIGJ5IG5hbWUuXG4gICAqL1xuICBhc3luYyBzZXJ2aWNlU3RvcEJ5TmFtZSAobmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKG5hbWUgPT09IHRoaXMubW9vbnJha2VyU2VydmljZU5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU3RvcHBpbmcgdGhlIG1vb25yYWtlciBzZXJ2aWNlIGlzIG5vdCBzdXBwb3J0ZWQnKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmFtZSA9PT0gJ2tsaXBwZXInKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2tsaXBwZXJSZXNldCgpXG4gICAgICB9XG5cbiAgICAgIFNvY2tldEFjdGlvbnMubWFjaGluZVNlcnZpY2VzU3RvcChuYW1lKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXJ0IGtsaXBweSAvIHN0ZCByZXN0YXJ0LlxuICAgKi9cbiAgYXN5bmMgcmVzdGFydEtsaXBweSAoKSB7XG4gICAgYXdhaXQgdGhpcy5fa2xpcHBlclJlc2V0KClcbiAgICBTb2NrZXRBY3Rpb25zLnByaW50ZXJSZXN0YXJ0KClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXJ0IGtsaXBweSBhbmQgdGhlIG1jdSdzLlxuICAgKi9cbiAgYXN5bmMgZmlybXdhcmVSZXN0YXJ0S2xpcHB5ICgpIHtcbiAgICBhd2FpdCB0aGlzLl9rbGlwcGVyUmVzZXQoKVxuICAgIFNvY2tldEFjdGlvbnMucHJpbnRlckZpcm13YXJlUmVzdGFydCgpXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLE9BQU8sU0FBUztBQUNoQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGlCQUFpQjtBQUcxQixJQUFxQixnQkFBckIsY0FBMkMsSUFBSTtBQUFBLEVBQzdDLElBQUksdUJBQWdDO0FBQ2xDLFdBQU8sS0FBSyxPQUFPLE1BQU0sT0FBTyxhQUFhLGNBQWMsYUFBdUI7QUFBQSxFQUNwRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxnQkFBaUI7QUFDckIsU0FBSyxPQUFPLE9BQU8saUNBQWlDLEtBQUs7QUFDekQsVUFBTSxLQUFLLE9BQU8sU0FBUyxzQkFBc0IsUUFBVyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQzFFLFVBQU0sS0FBSyxPQUFPLFNBQVMsU0FBUztBQUFBLE1BQ2xDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLEdBQUcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxhQUFjO0FBQ1osa0JBQWMsY0FBYztBQUFBLEVBQzlCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxlQUFnQjtBQUNkLGtCQUFjLGdCQUFnQjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLHdCQUF5QjtBQUM3QixTQUFLLHFCQUFxQixTQUFTO0FBQUEsRUFDckM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLDBCQUEyQjtBQUN6QixTQUFLLHFCQUFxQixLQUFLLG9CQUFvQjtBQUFBLEVBQ3JEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLHFCQUFzQixNQUFjO0FBQ3hDLFFBQUksU0FBUyxLQUFLLHNCQUFzQjtBQUN0QyxvQkFBYyxjQUFjO0FBQzVCLFdBQUssT0FBTyxPQUFPLGlDQUFpQyxJQUFJO0FBQUEsSUFDMUQsT0FBTztBQUNMLFVBQUksU0FBUyxXQUFXO0FBQ3RCLGNBQU0sS0FBSyxjQUFjO0FBQUEsTUFDM0I7QUFFQSxvQkFBYyx1QkFBdUIsSUFBSTtBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxtQkFBb0IsTUFBYztBQUN0QyxrQkFBYyxxQkFBcUIsSUFBSTtBQUFBLEVBQ3pDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGtCQUFtQixNQUFjO0FBQ3JDLFFBQUksU0FBUyxLQUFLLHNCQUFzQjtBQUN0QyxZQUFNLElBQUksTUFBTSxpREFBaUQ7QUFBQSxJQUNuRSxPQUFPO0FBQ0wsVUFBSSxTQUFTLFdBQVc7QUFDdEIsY0FBTSxLQUFLLGNBQWM7QUFBQSxNQUMzQjtBQUVBLG9CQUFjLG9CQUFvQixJQUFJO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGdCQUFpQjtBQUNyQixVQUFNLEtBQUssY0FBYztBQUN6QixrQkFBYyxlQUFlO0FBQUEsRUFDL0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sd0JBQXlCO0FBQzdCLFVBQU0sS0FBSyxjQUFjO0FBQ3pCLGtCQUFjLHVCQUF1QjtBQUFBLEVBQ3ZDO0FBQ0Y7QUFuR3FCLGdCQUFyQjtBQUFBLEVBREM7QUFBQSxHQUNvQjtBQUFyQjtBQUFBLEVBQU8saUJBTFA7QUFBQTsiLCJuYW1lcyI6W119