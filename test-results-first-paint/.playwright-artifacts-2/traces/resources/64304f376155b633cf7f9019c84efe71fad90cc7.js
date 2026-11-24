import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/M3Toast.vue";
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
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
import M3Toast from "/src/components/ui/M3Toast.vue";
import { activationState } from "/src/services/muon-cloud/activate.ts";
import { applyUpdateWhenIdle } from "/src/util/service-worker-update.ts";
import { watchForNewBuild } from "/src/util/build-update.ts";
import { appPainted } from "/src/services/startup/idle.ts";
import { serviceWorkerAllowed, serviceWorkerMustGo, unregisterServiceWorkers } from "/src/util/service-worker-policy.ts";
let RegisterServiceWorker = class extends Vue {
  updateSW = null;
  needRefresh = false;
  gone = false;
  stopWatching = () => {
  };
  onOfflineReady() {
    consola.debug("[PWA] ready for offline work");
    EventBus.$emit(this.$tc("app.general.msg.offline_ready"), { timeout: 5e3 });
  }
  onNeedRefresh() {
    consola.debug("[PWA] needs refresh");
    const { immediate } = applyUpdateWhenIdle(
      () => activationState.switching !== null,
      () => this.updateServiceWorker()
    );
    this.needRefresh = !immediate;
  }
  onRegistered(registration) {
    consola.debug("[PWA] registered", registration);
    this.stopWatching();
    this.stopWatching = watchForNewBuild({
      running: import.meta.env.BUILD_COMMIT ?? "",
      update: () => registration ? registration.update() : Promise.resolve(),
      onNewer: () => this.onNewer()
    });
  }
  onNewer() {
    consola.debug("[PWA] a newer build is being served");
    const { immediate } = applyUpdateWhenIdle(
      () => activationState.switching !== null,
      () => this.updateServiceWorker()
    );
    this.needRefresh = !immediate;
  }
  beforeDestroy() {
    this.gone = true;
    this.stopWatching();
  }
  onRegisterError(e) {
    consola.error("[PWA] registration error", e);
  }
  updateServiceWorker() {
    const activated = this.updateSW ? this.updateSW(true) : Promise.resolve();
    Promise.resolve(activated).catch(() => {
    }).then(() => window.location.reload());
  }
  async mounted() {
    if (!serviceWorkerAllowed()) {
      if (serviceWorkerMustGo()) await unregisterServiceWorkers().catch(() => {
      });
      return;
    }
    try {
      await Promise.race([appPainted(), new Promise((resolve) => setTimeout(resolve, 8e3))]);
      await new Promise((resolve) => {
        const ric = window.requestIdleCallback;
        if (ric) ric(() => resolve(), { timeout: 4e3 });
        else setTimeout(resolve, 1e3);
      });
      if (this.gone) return;
      const { registerSW } = await import("/@vite-plugin-pwa/virtual:pwa-register");
      this.updateSW = registerSW({
        immediate: true,
        onOfflineReady: this.onOfflineReady,
        onNeedRefresh: this.onNeedRefresh,
        onRegistered: this.onRegistered,
        onRegisterError: this.onRegisterError
      });
    } catch {
      consola.error("[PWA] disabled");
    }
  }
};
RegisterServiceWorker = __decorateClass([
  Component({ components: { M3Toast } })
], RegisterServiceWorker);
const _sfc_main = RegisterServiceWorker;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "position": "bottom", "data-tid": "needs-refresh" }, scopedSlots: _vm._u([{ key: "action", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "data-tid": "needs-refresh-reload" }, on: { "click": _vm.updateServiceWorker } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.btn.reload")) + " ")])];
  }, proxy: true }]), model: { value: _vm.needRefresh, callback: function($$v) {
    _vm.needRefresh = $$v;
  }, expression: "needRefresh" } }, [_vm._v(" " + _vm._s(_vm.$t("app.general.msg.needs_refresh")) + " ")]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  null,
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/common/RegisterServiceWorker.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFHQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUdBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFHQTtBQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFBQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxZQUNBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEzRkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUmVnaXN0ZXJTZXJ2aWNlV29ya2VyLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxtMy10b2FzdFxuICAgIHYtbW9kZWw9XCJuZWVkUmVmcmVzaFwiXG4gICAgcG9zaXRpb249XCJib3R0b21cIlxuICAgIGRhdGEtdGlkPVwibmVlZHMtcmVmcmVzaFwiXG4gID5cbiAgICB7eyAkdCgnYXBwLmdlbmVyYWwubXNnLm5lZWRzX3JlZnJlc2gnKSB9fVxuICAgIDx0ZW1wbGF0ZSAjYWN0aW9uPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICBkYXRhLXRpZD1cIm5lZWRzLXJlZnJlc2gtcmVsb2FkXCJcbiAgICAgICAgQGNsaWNrPVwidXBkYXRlU2VydmljZVdvcmtlclwiXG4gICAgICA+XG4gICAgICAgIHt7ICR0KCdhcHAuZ2VuZXJhbC5idG4ucmVsb2FkJykgfX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvdGVtcGxhdGU+XG4gIDwvbTMtdG9hc3Q+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBWdWUgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgY29uc29sYSB9IGZyb20gJ2NvbnNvbGEnXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgTTNUb2FzdCBmcm9tICdAL2NvbXBvbmVudHMvdWkvTTNUb2FzdC52dWUnXG5pbXBvcnQgeyBhY3RpdmF0aW9uU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvYWN0aXZhdGUnXG5pbXBvcnQgeyBhcHBseVVwZGF0ZVdoZW5JZGxlIH0gZnJvbSAnQC91dGlsL3NlcnZpY2Utd29ya2VyLXVwZGF0ZSdcbmltcG9ydCB7IHdhdGNoRm9yTmV3QnVpbGQgfSBmcm9tICdAL3V0aWwvYnVpbGQtdXBkYXRlJ1xuaW1wb3J0IHsgYXBwUGFpbnRlZCB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9pZGxlJ1xuaW1wb3J0IHsgc2VydmljZVdvcmtlckFsbG93ZWQsIHNlcnZpY2VXb3JrZXJNdXN0R28sIHVucmVnaXN0ZXJTZXJ2aWNlV29ya2VycyB9IGZyb20gJ0AvdXRpbC9zZXJ2aWNlLXdvcmtlci1wb2xpY3knXG5cbkBDb21wb25lbnQoeyBjb21wb25lbnRzOiB7IE0zVG9hc3QgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVnaXN0ZXJTZXJ2aWNlV29ya2VyIGV4dGVuZHMgVnVlIHtcbiAgdXBkYXRlU1c6ICgocmVsb2FkUGFnZT86IGJvb2xlYW4pID0+IFByb21pc2U8dm9pZD4pIHwgbnVsbCA9IG51bGxcbiAgbmVlZFJlZnJlc2ggPSBmYWxzZVxuICBnb25lID0gZmFsc2VcbiAgc3RvcFdhdGNoaW5nOiAoKSA9PiB2b2lkID0gKCkgPT4ge31cblxuICBvbk9mZmxpbmVSZWFkeSAoKSB7XG4gICAgY29uc29sYS5kZWJ1ZygnW1BXQV0gcmVhZHkgZm9yIG9mZmxpbmUgd29yaycpXG4gICAgRXZlbnRCdXMuJGVtaXQodGhpcy4kdGMoJ2FwcC5nZW5lcmFsLm1zZy5vZmZsaW5lX3JlYWR5JyksIHsgdGltZW91dDogNTAwMCB9KVxuICB9XG5cbiAgb25OZWVkUmVmcmVzaCAoKSB7XG4gICAgY29uc29sYS5kZWJ1ZygnW1BXQV0gbmVlZHMgcmVmcmVzaCcpXG4gICAgLy8gS0FOLTEyNzk6IGFwcGx5IHRoZSBuZXcgd29ya2VyIHVuYXNrZWQsIHVubGVzcyBhIHByaW50ZXIgaXMgbWlkLXN3aXRjaDtcbiAgICAvLyB0aGVuIHRoZSB0b2FzdCBzdGF5cyB1cCBhbmQgdGhlIHVwZGF0ZSBsYW5kcyB3aGVuIHRoZSBzd2l0Y2ggaXMgZG9uZS5cbiAgICBjb25zdCB7IGltbWVkaWF0ZSB9ID0gYXBwbHlVcGRhdGVXaGVuSWRsZShcbiAgICAgICgpID0+IGFjdGl2YXRpb25TdGF0ZS5zd2l0Y2hpbmcgIT09IG51bGwsXG4gICAgICAoKSA9PiB0aGlzLnVwZGF0ZVNlcnZpY2VXb3JrZXIoKVxuICAgIClcbiAgICB0aGlzLm5lZWRSZWZyZXNoID0gIWltbWVkaWF0ZVxuICB9XG5cbiAgb25SZWdpc3RlcmVkIChyZWdpc3RyYXRpb24/OiBTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uKSB7XG4gICAgY29uc29sYS5kZWJ1ZygnW1BXQV0gcmVnaXN0ZXJlZCcsIHJlZ2lzdHJhdGlvbilcbiAgICAvLyBJLTE1OTogbG9vayBmb3IgYSBuZXdlciB3b3JrZXIgYW5kIGEgbmV3ZXIgYnVpbGQgb24gZm9jdXMsIHdoZW4gdGhlIHRhYlxuICAgIC8vIGlzIHNob3duIGFuZCBldmVyeSBmZXcgbWludXRlczsgYSBzdGFsZSB0YWIgbm8gbG9uZ2VyIHdhaXRzIGZvciBhIGNsaWNrLlxuICAgIHRoaXMuc3RvcFdhdGNoaW5nKClcbiAgICB0aGlzLnN0b3BXYXRjaGluZyA9IHdhdGNoRm9yTmV3QnVpbGQoe1xuICAgICAgcnVubmluZzogaW1wb3J0Lm1ldGEuZW52LkJVSUxEX0NPTU1JVCA/PyAnJyxcbiAgICAgIHVwZGF0ZTogKCkgPT4gcmVnaXN0cmF0aW9uID8gcmVnaXN0cmF0aW9uLnVwZGF0ZSgpIDogUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgICBvbk5ld2VyOiAoKSA9PiB0aGlzLm9uTmV3ZXIoKVxuICAgIH0pXG4gIH1cblxuICBvbk5ld2VyICgpIHtcbiAgICBjb25zb2xhLmRlYnVnKCdbUFdBXSBhIG5ld2VyIGJ1aWxkIGlzIGJlaW5nIHNlcnZlZCcpXG4gICAgY29uc3QgeyBpbW1lZGlhdGUgfSA9IGFwcGx5VXBkYXRlV2hlbklkbGUoXG4gICAgICAoKSA9PiBhY3RpdmF0aW9uU3RhdGUuc3dpdGNoaW5nICE9PSBudWxsLFxuICAgICAgKCkgPT4gdGhpcy51cGRhdGVTZXJ2aWNlV29ya2VyKClcbiAgICApXG4gICAgdGhpcy5uZWVkUmVmcmVzaCA9ICFpbW1lZGlhdGVcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuZ29uZSA9IHRydWVcbiAgICB0aGlzLnN0b3BXYXRjaGluZygpXG4gIH1cblxuICBvblJlZ2lzdGVyRXJyb3IgKGU6IHVua25vd24pIHtcbiAgICBjb25zb2xhLmVycm9yKCdbUFdBXSByZWdpc3RyYXRpb24gZXJyb3InLCBlKVxuICB9XG5cbiAgdXBkYXRlU2VydmljZVdvcmtlciAoKSB7XG4gICAgLy8gVGhlIG5ldyB3b3JrZXIgc2tpcHMgd2FpdGluZyBieSBpdHNlbGYgKHN3LnRzKSwgc28gdGhlcmUgbWF5IGJlIG5vbmUgdG9cbiAgICAvLyBhY3RpdmF0ZTogdGhlIHJlbG9hZCBpcyB3aGF0IGxvYWRzIHRoZSBuZXcgYnVpbGQuXG4gICAgY29uc3QgYWN0aXZhdGVkID0gdGhpcy51cGRhdGVTVyA/IHRoaXMudXBkYXRlU1codHJ1ZSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIFByb21pc2UucmVzb2x2ZShhY3RpdmF0ZWQpLmNhdGNoKCgpID0+IHt9KS50aGVuKCgpID0+IHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKSlcbiAgfVxuXG4gIGFzeW5jIG1vdW50ZWQgKCkge1xuICAgIC8vIEtBTi0yMTk4OiBhIHByaW50ZXIgc2VydmVzIHRoaXMgcGFnZSBpdHNlbGY7IG5vIHdvcmtlciBjYWNoZXMgaXQuXG4gICAgaWYgKCFzZXJ2aWNlV29ya2VyQWxsb3dlZCgpKSB7XG4gICAgICBpZiAoc2VydmljZVdvcmtlck11c3RHbygpKSBhd2FpdCB1bnJlZ2lzdGVyU2VydmljZVdvcmtlcnMoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0cnkge1xuICAgICAgLy8gS0FOLTUxMDE6IGluc3RhbGxpbmcgdGhlIHdvcmtlciBkb3dubG9hZHMgdGhlIHdob2xlIG9mZmxpbmUgc2V0ICh0aGVcbiAgICAgIC8vIHZpZXdlciwgdGhlIDNEIG1vZGVsLCBldmVyeSBwYWdlKS4gVGhhdCBpcyBiYWNrZ3JvdW5kIHdvcms6IGl0IHN0YXJ0c1xuICAgICAgLy8gb25seSBvbmNlIHRoZSBmaXJzdCBwYWdlIGhhcyBwYWludGVkIGFuZCB0aGUgYnJvd3NlciBpcyBpZGxlLCBuZXZlclxuICAgICAgLy8gd2hpbGUgdGhlIGZpcnN0IGxvYWQgaXMgc3RpbGwgZmV0Y2hpbmcuIC9zZXR1cCBtb3VudHMgd2l0aG91dCB0aGUgYXBwLFxuICAgICAgLy8gc28gdGhlIHdhaXQgaXMgY2FwcGVkLlxuICAgICAgYXdhaXQgUHJvbWlzZS5yYWNlKFthcHBQYWludGVkKCksIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA4MDAwKSldKVxuICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IHJpYyA9ICh3aW5kb3cgYXMgV2luZG93ICYgeyByZXF1ZXN0SWRsZUNhbGxiYWNrPzogKGNiOiAoKSA9PiB2b2lkLCBvcHRzPzogeyB0aW1lb3V0OiBudW1iZXIgfSkgPT4gdm9pZCB9KS5yZXF1ZXN0SWRsZUNhbGxiYWNrXG4gICAgICAgIGlmIChyaWMpIHJpYygoKSA9PiByZXNvbHZlKCksIHsgdGltZW91dDogNDAwMCB9KVxuICAgICAgICBlbHNlIHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMClcbiAgICAgIH0pXG4gICAgICBpZiAodGhpcy5nb25lKSByZXR1cm5cbiAgICAgIGNvbnN0IHsgcmVnaXN0ZXJTVyB9ID0gYXdhaXQgaW1wb3J0KCd2aXJ0dWFsOnB3YS1yZWdpc3RlcicpXG5cbiAgICAgIHRoaXMudXBkYXRlU1cgPSByZWdpc3RlclNXKHtcbiAgICAgICAgaW1tZWRpYXRlOiB0cnVlLFxuICAgICAgICBvbk9mZmxpbmVSZWFkeTogdGhpcy5vbk9mZmxpbmVSZWFkeSxcbiAgICAgICAgb25OZWVkUmVmcmVzaDogdGhpcy5vbk5lZWRSZWZyZXNoLFxuICAgICAgICBvblJlZ2lzdGVyZWQ6IHRoaXMub25SZWdpc3RlcmVkLFxuICAgICAgICBvblJlZ2lzdGVyRXJyb3I6IHRoaXMub25SZWdpc3RlckVycm9yXG4gICAgICB9KVxuICAgIH0gY2F0Y2gge1xuICAgICAgY29uc29sYS5lcnJvcignW1BXQV0gZGlzYWJsZWQnKVxuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9jb21tb24vUmVnaXN0ZXJTZXJ2aWNlV29ya2VyLnZ1ZSJ9