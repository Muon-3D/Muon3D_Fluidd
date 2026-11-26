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
import { appInit } from "/src/init.ts";
import { activateCloudPrinter } from "/src/services/muon-cloud/activate.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { remoteRouteLabel } from "/src/services/muon-ble/link.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
let ReconnectMixin = class extends Mixins(StateMixin) {
  /** Ticks each second, so a countdown moves. */
  now = Date.now();
  tick = null;
  mounted() {
    this.tick = window.setInterval(() => {
      this.now = Date.now();
    }, 1e3);
  }
  beforeDestroy() {
    if (this.tick !== null) window.clearInterval(this.tick);
  }
  get activeInstance() {
    return this.$store.getters["config/getCurrentInstance"];
  }
  get viaCloud() {
    return !!cloudState.activePrinterId && isManagedApiUrl(this.activeInstance?.apiUrl ?? "");
  }
  /** The printer's name as people say it: Boxwood. */
  get printerName() {
    const shown = this.$store.getters["config/getDisplayName"];
    const slug = activeSlug();
    return printerNameParts(slug ?? shown ?? "the printer").name;
  }
  /** Where it is being reached: its address on this network, or the account. */
  get address() {
    if (this.viaCloud) return remoteRouteLabel(cloudState.activePrinterId);
    try {
      return new URL(this.activeInstance?.apiUrl ?? "").host;
    } catch {
      return "";
    }
  }
  /** Whether the socket client is waiting out its backoff before the next try. */
  get retryPending() {
    return this.$store.state.socket.connecting && this.now > 0 && !!this.$socket?.retryPending;
  }
  /** Milliseconds until the next try, or null when none is waiting. */
  get retryInMs() {
    const at = this.retryPending ? this.$socket?.nextRetryAt : null;
    return at ? Math.max(0, at - this.now) : null;
  }
  tryNow() {
    if (this.$socket?.retryPending) this.$socket.retryNow();
    else this.reconnect();
  }
  async reconnect() {
    const printerId = cloudState.activePrinterId;
    if (printerId && this.viaCloud) {
      await activateCloudPrinter(printerId).catch(() => {
      });
      return;
    }
    const config = await appInit(this.activeInstance, this.$store.state.config.hostConfig);
    if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
      this.$socket.connect(config.apiConfig.socketUrl);
    }
  }
};
ReconnectMixin = __decorateClass([
  Component({})
], ReconnectMixin);
export {
  ReconnectMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlY29ubmVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE1peGlucyB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICcuL3N0YXRlJ1xuaW1wb3J0IHsgYXBwSW5pdCB9IGZyb20gJ0AvaW5pdCdcbmltcG9ydCB7IGFjdGl2YXRlQ2xvdWRQcmludGVyIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FjdGl2YXRlJ1xuaW1wb3J0IHsgY2xvdWRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCB7IHJlbW90ZVJvdXRlTGFiZWwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2xpbmsnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgYWN0aXZlU2x1ZyB9IGZyb20gJ0Avc2VydmljZXMvcHJpbnRlci1wYWdlcydcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMgfSBmcm9tICdAL3V0aWwvcHJpbnRlci1uYW1lJ1xuXG4vKipcbiAqIFRyeWluZyB0aGUgcHJpbnRlciBhZ2FpbiwgZm9yIHRoZSBjb25uZWN0aW9uJ3MgYmFyIGFuZCBzY3JlZW46IG5vdywgd2hlblxuICogdGhlIHNvY2tldCBjbGllbnQgaXMgd2FpdGluZyBvdXQgaXRzIGJhY2tvZmYsIG9yIGZyb20gdGhlIHN0YXJ0IHdoZW4gaXRcbiAqIGhhcyBzdG9wcGVkLiBBIGNsb3VkIHByaW50ZXIgaGFzIG5vIGFkZHJlc3Mgb2YgaXRzIG93bjsgaXRzIHNvY2tldCBjb21lc1xuICogb3ZlciBJcm9oLCBzbyBpdCBpcyBvcGVuZWQgYWdhaW4gdGhyb3VnaCB0aGUgYWNjb3VudC5cbiAqL1xuQENvbXBvbmVudCh7fSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY29ubmVjdE1peGluIGV4dGVuZHMgTWl4aW5zKFN0YXRlTWl4aW4pIHtcbiAgLyoqIFRpY2tzIGVhY2ggc2Vjb25kLCBzbyBhIGNvdW50ZG93biBtb3Zlcy4gKi9cbiAgbm93ID0gRGF0ZS5ub3coKVxuICB0aWNrOiBudW1iZXIgfCBudWxsID0gbnVsbFxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMudGljayA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7IHRoaXMubm93ID0gRGF0ZS5ub3coKSB9LCAxMDAwKVxuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgaWYgKHRoaXMudGljayAhPT0gbnVsbCkgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy50aWNrKVxuICB9XG5cbiAgZ2V0IGFjdGl2ZUluc3RhbmNlICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldEN1cnJlbnRJbnN0YW5jZSddIGFzIHsgYXBpVXJsOiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcgfSB8IG51bGxcbiAgfVxuXG4gIGdldCB2aWFDbG91ZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQgJiYgaXNNYW5hZ2VkQXBpVXJsKHRoaXMuYWN0aXZlSW5zdGFuY2U/LmFwaVVybCA/PyAnJylcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlcidzIG5hbWUgYXMgcGVvcGxlIHNheSBpdDogQm94d29vZC4gKi9cbiAgZ2V0IHByaW50ZXJOYW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNob3duID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgY29uc3Qgc2x1ZyA9IGFjdGl2ZVNsdWcoKVxuICAgIHJldHVybiBwcmludGVyTmFtZVBhcnRzKHNsdWcgPz8gc2hvd24gPz8gJ3RoZSBwcmludGVyJykubmFtZVxuICB9XG5cbiAgLyoqIFdoZXJlIGl0IGlzIGJlaW5nIHJlYWNoZWQ6IGl0cyBhZGRyZXNzIG9uIHRoaXMgbmV0d29yaywgb3IgdGhlIGFjY291bnQuICovXG4gIGdldCBhZGRyZXNzICgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnZpYUNsb3VkKSByZXR1cm4gcmVtb3RlUm91dGVMYWJlbChjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZClcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBVUkwodGhpcy5hY3RpdmVJbnN0YW5jZT8uYXBpVXJsID8/ICcnKS5ob3N0XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgc29ja2V0IGNsaWVudCBpcyB3YWl0aW5nIG91dCBpdHMgYmFja29mZiBiZWZvcmUgdGhlIG5leHQgdHJ5LiAqL1xuICBnZXQgcmV0cnlQZW5kaW5nICgpOiBib29sZWFuIHtcbiAgICAvLyBSZWFkIHRoZSBzdG9yZSAoYW5kIHRoZSBjbG9jaykgc28gdGhpcyByZWNvbXB1dGVzIGFzIHRoZXkgY2hhbmdlLlxuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5zb2NrZXQuY29ubmVjdGluZyAmJiB0aGlzLm5vdyA+IDAgJiYgISF0aGlzLiRzb2NrZXQ/LnJldHJ5UGVuZGluZ1xuICB9XG5cbiAgLyoqIE1pbGxpc2Vjb25kcyB1bnRpbCB0aGUgbmV4dCB0cnksIG9yIG51bGwgd2hlbiBub25lIGlzIHdhaXRpbmcuICovXG4gIGdldCByZXRyeUluTXMgKCk6IG51bWJlciB8IG51bGwge1xuICAgIGNvbnN0IGF0ID0gdGhpcy5yZXRyeVBlbmRpbmcgPyB0aGlzLiRzb2NrZXQ/Lm5leHRSZXRyeUF0IDogbnVsbFxuICAgIHJldHVybiBhdCA/IE1hdGgubWF4KDAsIGF0IC0gdGhpcy5ub3cpIDogbnVsbFxuICB9XG5cbiAgdHJ5Tm93ICgpIHtcbiAgICBpZiAodGhpcy4kc29ja2V0Py5yZXRyeVBlbmRpbmcpIHRoaXMuJHNvY2tldC5yZXRyeU5vdygpXG4gICAgZWxzZSB0aGlzLnJlY29ubmVjdCgpXG4gIH1cblxuICBhc3luYyByZWNvbm5lY3QgKCkge1xuICAgIGNvbnN0IHByaW50ZXJJZCA9IGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkXG4gICAgaWYgKHByaW50ZXJJZCAmJiB0aGlzLnZpYUNsb3VkKSB7XG4gICAgICBhd2FpdCBhY3RpdmF0ZUNsb3VkUHJpbnRlcihwcmludGVySWQpLmNhdGNoKCgpID0+IHt9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGFwcEluaXQodGhpcy5hY3RpdmVJbnN0YW5jZSBhcyBuZXZlciwgdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmhvc3RDb25maWcpXG4gICAgaWYgKGNvbmZpZy5hcGlDb25maWcuc29ja2V0VXJsICYmIGNvbmZpZy5hcGlDb25uZWN0ZWQgJiYgY29uZmlnLmFwaUF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIHRoaXMuJHNvY2tldC5jb25uZWN0KGNvbmZpZy5hcGlDb25maWcuc29ja2V0VXJsKVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxXQUFXLGNBQWM7QUFDbEMsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsd0JBQXdCO0FBU2pDLElBQXFCLGlCQUFyQixjQUE0QyxPQUFPLFVBQVUsRUFBRTtBQUFBO0FBQUEsRUFFN0QsTUFBTSxLQUFLLElBQUk7QUFBQSxFQUNmLE9BQXNCO0FBQUEsRUFFdEIsVUFBVztBQUNULFNBQUssT0FBTyxPQUFPLFlBQVksTUFBTTtBQUFFLFdBQUssTUFBTSxLQUFLLElBQUk7QUFBQSxJQUFFLEdBQUcsR0FBSTtBQUFBLEVBQ3RFO0FBQUEsRUFFQSxnQkFBaUI7QUFDZixRQUFJLEtBQUssU0FBUyxLQUFNLFFBQU8sY0FBYyxLQUFLLElBQUk7QUFBQSxFQUN4RDtBQUFBLEVBRUEsSUFBSSxpQkFBa0I7QUFDcEIsV0FBTyxLQUFLLE9BQU8sUUFBUSwyQkFBMkI7QUFBQSxFQUN4RDtBQUFBLEVBRUEsSUFBSSxXQUFxQjtBQUN2QixXQUFPLENBQUMsQ0FBQyxXQUFXLG1CQUFtQixnQkFBZ0IsS0FBSyxnQkFBZ0IsVUFBVSxFQUFFO0FBQUEsRUFDMUY7QUFBQTtBQUFBLEVBR0EsSUFBSSxjQUF1QjtBQUN6QixVQUFNLFFBQVEsS0FBSyxPQUFPLFFBQVEsdUJBQXVCO0FBQ3pELFVBQU0sT0FBTyxXQUFXO0FBQ3hCLFdBQU8saUJBQWlCLFFBQVEsU0FBUyxhQUFhLEVBQUU7QUFBQSxFQUMxRDtBQUFBO0FBQUEsRUFHQSxJQUFJLFVBQW1CO0FBQ3JCLFFBQUksS0FBSyxTQUFVLFFBQU8saUJBQWlCLFdBQVcsZUFBZTtBQUNyRSxRQUFJO0FBQ0YsYUFBTyxJQUFJLElBQUksS0FBSyxnQkFBZ0IsVUFBVSxFQUFFLEVBQUU7QUFBQSxJQUNwRCxRQUFRO0FBQ04sYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLElBQUksZUFBeUI7QUFFM0IsV0FBTyxLQUFLLE9BQU8sTUFBTSxPQUFPLGNBQWMsS0FBSyxNQUFNLEtBQUssQ0FBQyxDQUFDLEtBQUssU0FBUztBQUFBLEVBQ2hGO0FBQUE7QUFBQSxFQUdBLElBQUksWUFBNEI7QUFDOUIsVUFBTSxLQUFLLEtBQUssZUFBZSxLQUFLLFNBQVMsY0FBYztBQUMzRCxXQUFPLEtBQUssS0FBSyxJQUFJLEdBQUcsS0FBSyxLQUFLLEdBQUcsSUFBSTtBQUFBLEVBQzNDO0FBQUEsRUFFQSxTQUFVO0FBQ1IsUUFBSSxLQUFLLFNBQVMsYUFBYyxNQUFLLFFBQVEsU0FBUztBQUFBLFFBQ2pELE1BQUssVUFBVTtBQUFBLEVBQ3RCO0FBQUEsRUFFQSxNQUFNLFlBQWE7QUFDakIsVUFBTSxZQUFZLFdBQVc7QUFDN0IsUUFBSSxhQUFhLEtBQUssVUFBVTtBQUM5QixZQUFNLHFCQUFxQixTQUFTLEVBQUUsTUFBTSxNQUFNO0FBQUEsTUFBQyxDQUFDO0FBQ3BEO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUyxNQUFNLFFBQVEsS0FBSyxnQkFBeUIsS0FBSyxPQUFPLE1BQU0sT0FBTyxVQUFVO0FBQzlGLFFBQUksT0FBTyxVQUFVLGFBQWEsT0FBTyxnQkFBZ0IsT0FBTyxrQkFBa0I7QUFDaEYsV0FBSyxRQUFRLFFBQVEsT0FBTyxVQUFVLFNBQVM7QUFBQSxJQUNqRDtBQUFBLEVBQ0Y7QUFDRjtBQWxFcUIsaUJBQXJCO0FBQUEsRUFEQyxVQUFVLENBQUMsQ0FBQztBQUFBLEdBQ1E7QUFBckI7QUFBQSxFQUFPLGtCQWpCUDtBQUFBOyIsIm5hbWVzIjpbXX0=