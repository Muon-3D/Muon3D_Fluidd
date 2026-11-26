/* unplugin-vue-components disabled */import { VAlert as __unplugin_components_2 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VCardText as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_0 from "/src/components/ui/AppDialog.vue";
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
import { Component, Mixins, Ref, VModel } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import QrScanner from "/.vite-e2e/4291/deps/qr-scanner.js?v=9b9fafc7";
import CameraItem from "/src/components/widgets/camera/CameraItem.vue";
import BrowserMixin from "/src/mixins/browser.ts";
let QRReader = class extends Mixins(StateMixin, BrowserMixin) {
  dataPatterns = [
    /web\+spoolman:s-(\d+)/,
    /\/spool\/show\/(\d+)\/?/
  ];
  statusMessage = "info.howto";
  lastScanTimestamp = Date.now();
  processing = false;
  context;
  source;
  canvas;
  get camera() {
    if (this.source === "device") {
      return {
        name: this.$t("app.spoolman.label.device_camera").toString(),
        service: "device"
      };
    }
    return this.$store.getters["webcams/getWebcamById"](this.source);
  }
  get open() {
    return this.source !== null;
  }
  set open(state) {
    if (!state) {
      this.source = null;
    }
  }
  async mounted() {
    this.processing = true;
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.processing = false;
  }
  async handlePrinterCameraFrame(image) {
    if (this.processing) {
      return;
    }
    if (Date.now() - this.lastScanTimestamp < 100) {
      return;
    }
    this.processing = true;
    this.lastScanTimestamp = Date.now();
    if (image instanceof HTMLVideoElement) {
      this.canvas.width = image.videoWidth;
      this.canvas.height = image.videoHeight;
    } else {
      this.canvas.width = image.naturalWidth;
      this.canvas.height = image.naturalHeight;
    }
    if (!this.canvas.width || !this.canvas.height) {
      this.processing = false;
      return;
    }
    try {
      this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      const result = await QrScanner.scanImage(this.canvas, { returnDetailedScanResult: true });
      if (result.data) {
        this.handleCodeFound(result.data);
      }
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "SecurityError") {
          this.statusMessage = "error.cors";
        } else {
          this.statusMessage = "error.no_image_data";
        }
      }
    }
    this.processing = false;
  }
  get availableSpools() {
    return this.$store.getters["spoolman/getAvailableSpools"];
  }
  handleCodeFound(code) {
    const pattern = this.dataPatterns.find((pattern2) => pattern2.test(code));
    if (pattern) {
      const spoolId = code.match(pattern)?.[1];
      if (spoolId && !isNaN(Number(spoolId))) {
        const id = parseInt(spoolId);
        if (this.availableSpools.some((spool) => spool.id === id)) {
          this.$emit("detected", id);
        } else {
          this.statusMessage = "error.spool_not_existant";
        }
      } else {
        this.statusMessage = "warning.invalid_spool_id";
      }
    } else {
      this.statusMessage = "warning.code_not_recognized";
    }
  }
};
__decorateClass([
  VModel({ type: String, default: null })
], QRReader.prototype, "source", 2);
__decorateClass([
  Ref("canvas")
], QRReader.prototype, "canvas", 2);
QRReader = __decorateClass([
  Component({
    components: { CameraItem }
  })
], QRReader);
const _sfc_main = QRReader;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c(__unplugin_components_0, { attrs: { "no-actions": "", "width": _vm.isMobileViewport ? "100%" : "60vw", "title": _vm.$t("app.spoolman.title.scan_spool") }, model: { value: _vm.open, callback: function($$v) {
    _vm.open = $$v;
  }, expression: "open" } }, [_c(__unplugin_components_1, [_c(__unplugin_components_2, { attrs: { "type": _vm.statusMessage.split(".")[0] } }, [_vm._v(" " + _vm._s(_vm.$t(`app.spoolman.msg.${_vm.statusMessage}`)) + " ")]), _c("canvas", { ref: "canvas", attrs: { "hidden": true } }), _c("CameraItem", { attrs: { "camera": _vm.camera, "embedded": true, "crossorigin": "anonymous" }, on: { "frame": _vm.handlePrinterCameraFrame } })], 1)], 1);
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
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/spoolman/QRReader.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQTBCQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBS0E7QUFBQSxFQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUdBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFFQSw0Q0FBQUEsc0JBQUE7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBRUE7QUFBQSxRQUNBO0FBRUE7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQ0E7QUExR0E7QUFBQSxFQURBO0FBQUEsR0FYQSxTQVlBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FkQSxTQWVBO0FBZkE7QUFBQSxFQUhBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxHQUNBIiwibmFtZXMiOlsicGF0dGVybiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJRUlJlYWRlci52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8YXBwLWRpYWxvZ1xuICAgIHYtbW9kZWw9XCJvcGVuXCJcbiAgICBuby1hY3Rpb25zXG4gICAgOndpZHRoPVwiaXNNb2JpbGVWaWV3cG9ydCA/ICcxMDAlJyA6ICc2MHZ3J1wiXG4gICAgOnRpdGxlPVwiJHQoJ2FwcC5zcG9vbG1hbi50aXRsZS5zY2FuX3Nwb29sJylcIlxuICA+XG4gICAgPHYtY2FyZC10ZXh0PlxuICAgICAgPHYtYWxlcnQgOnR5cGU9XCJzdGF0dXNNZXNzYWdlLnNwbGl0KCcuJylbMF1cIj5cbiAgICAgICAge3sgJHQoYGFwcC5zcG9vbG1hbi5tc2cuJHtzdGF0dXNNZXNzYWdlfWApIH19XG4gICAgICA8L3YtYWxlcnQ+XG4gICAgICA8Y2FudmFzXG4gICAgICAgIHJlZj1cImNhbnZhc1wiXG4gICAgICAgIDpoaWRkZW49XCJ0cnVlXCJcbiAgICAgIC8+XG4gICAgICA8Q2FtZXJhSXRlbVxuICAgICAgICA6Y2FtZXJhPVwiY2FtZXJhXCJcbiAgICAgICAgOmVtYmVkZGVkPVwidHJ1ZVwiXG4gICAgICAgIGNyb3Nzb3JpZ2luPVwiYW5vbnltb3VzXCJcbiAgICAgICAgQGZyYW1lPVwiaGFuZGxlUHJpbnRlckNhbWVyYUZyYW1lXCJcbiAgICAgIC8+XG4gICAgPC92LWNhcmQtdGV4dD5cbiAgPC9hcHAtZGlhbG9nPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBsYW5nPVwidHNcIj5cbmltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zLCBSZWYsIFZNb2RlbCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCBRclNjYW5uZXIgZnJvbSAncXItc2Nhbm5lcidcbmltcG9ydCBDYW1lcmFJdGVtIGZyb20gJ0AvY29tcG9uZW50cy93aWRnZXRzL2NhbWVyYS9DYW1lcmFJdGVtLnZ1ZSdcbmltcG9ydCB0eXBlIHsgU3Bvb2wgfSBmcm9tICdAL3N0b3JlL3Nwb29sbWFuL3R5cGVzJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuXG5AQ29tcG9uZW50KHtcbiAgY29tcG9uZW50czogeyBDYW1lcmFJdGVtIH1cbn0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRUlJlYWRlciBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluLCBCcm93c2VyTWl4aW4pIHtcbiAgZGF0YVBhdHRlcm5zID0gW1xuICAgIC93ZWJcXCtzcG9vbG1hbjpzLShcXGQrKS8sXG4gICAgL1xcL3Nwb29sXFwvc2hvd1xcLyhcXGQrKVxcLz8vXG4gIF1cblxuICBzdGF0dXNNZXNzYWdlID0gJ2luZm8uaG93dG8nXG4gIGxhc3RTY2FuVGltZXN0YW1wID0gRGF0ZS5ub3coKVxuICBwcm9jZXNzaW5nID0gZmFsc2VcbiAgY29udGV4dCE6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuXG4gIEBWTW9kZWwoeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6IG51bGwgfSlcbiAgICBzb3VyY2UhOiBudWxsIHwgc3RyaW5nXG5cbiAgQFJlZignY2FudmFzJylcbiAgICBjYW52YXMhOiBIVE1MQ2FudmFzRWxlbWVudFxuXG4gIGdldCBjYW1lcmEgKCkge1xuICAgIGlmICh0aGlzLnNvdXJjZSA9PT0gJ2RldmljZScpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IHRoaXMuJHQoJ2FwcC5zcG9vbG1hbi5sYWJlbC5kZXZpY2VfY2FtZXJhJykudG9TdHJpbmcoKSxcbiAgICAgICAgc2VydmljZTogJ2RldmljZSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snd2ViY2Ftcy9nZXRXZWJjYW1CeUlkJ10odGhpcy5zb3VyY2UpXG4gIH1cblxuICBnZXQgb3BlbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlICE9PSBudWxsXG4gIH1cblxuICBzZXQgb3BlbiAoc3RhdGUpIHtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICB0aGlzLnNvdXJjZSA9IG51bGxcbiAgICB9XG4gIH1cblxuICBhc3luYyBtb3VudGVkICgpIHtcbiAgICB0aGlzLnByb2Nlc3NpbmcgPSB0cnVlXG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IHdpbGxSZWFkRnJlcXVlbnRseTogdHJ1ZSB9KSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRcbiAgICB0aGlzLnByb2Nlc3NpbmcgPSBmYWxzZVxuICB9XG5cbiAgYXN5bmMgaGFuZGxlUHJpbnRlckNhbWVyYUZyYW1lIChpbWFnZTogSFRNTFZpZGVvRWxlbWVudCB8IEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICAvLyBpZiBicm9rZW4gY2FudmFzIG9yIHN0aWxsIHByb2Nlc3NpbmdcbiAgICBpZiAodGhpcy5wcm9jZXNzaW5nKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBsaW1pdCB0byAxMCBzY2FuIGF0dGVtcHRzIHBlciBzZWNvbmRcbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMubGFzdFNjYW5UaW1lc3RhbXAgPCAxMDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMucHJvY2Vzc2luZyA9IHRydWVcbiAgICB0aGlzLmxhc3RTY2FuVGltZXN0YW1wID0gRGF0ZS5ub3coKVxuXG4gICAgaWYgKGltYWdlIGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkge1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSBpbWFnZS52aWRlb1dpZHRoXG4gICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBpbWFnZS52aWRlb0hlaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aFxuICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodFxuICAgIH1cblxuICAgIGlmICghdGhpcy5jYW52YXMud2lkdGggfHwgIXRoaXMuY2FudmFzLmhlaWdodCkge1xuICAgICAgLy8gbm8gaW1hZ2UgZHJhd24geWV0XG4gICAgICB0aGlzLnByb2Nlc3NpbmcgPSBmYWxzZVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBRclNjYW5uZXIuc2NhbkltYWdlKHRoaXMuY2FudmFzLCB7IHJldHVybkRldGFpbGVkU2NhblJlc3VsdDogdHJ1ZSB9KVxuICAgICAgaWYgKHJlc3VsdC5kYXRhKSB7IHRoaXMuaGFuZGxlQ29kZUZvdW5kKHJlc3VsdC5kYXRhKSB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uKSB7XG4gICAgICAgIGlmIChlcnIubmFtZSA9PT0gJ1NlY3VyaXR5RXJyb3InKSB7XG4gICAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlID0gJ2Vycm9yLmNvcnMnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlID0gJ2Vycm9yLm5vX2ltYWdlX2RhdGEnXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gbm8gUVIgY29kZSBmb3VuZFxuICAgIH1cbiAgICB0aGlzLnByb2Nlc3NpbmcgPSBmYWxzZVxuICB9XG5cbiAgZ2V0IGF2YWlsYWJsZVNwb29scyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLmdldHRlcnNbJ3Nwb29sbWFuL2dldEF2YWlsYWJsZVNwb29scyddXG4gIH1cblxuICBoYW5kbGVDb2RlRm91bmQgKGNvZGU6IHN0cmluZykge1xuICAgIC8vIHZhbGlkIFFSIGNvZGUgZm91bmRcbiAgICBjb25zdCBwYXR0ZXJuID0gdGhpcy5kYXRhUGF0dGVybnMuZmluZChwYXR0ZXJuID0+IHBhdHRlcm4udGVzdChjb2RlKSlcbiAgICBpZiAocGF0dGVybikge1xuICAgICAgLy8gY29kZSBtYXRjaGVzIG9uZSBvZiBrbm93biBwYXR0ZXJuc1xuICAgICAgY29uc3Qgc3Bvb2xJZCA9IGNvZGUubWF0Y2gocGF0dGVybik/LlsxXVxuICAgICAgaWYgKHNwb29sSWQgJiYgIWlzTmFOKE51bWJlcihzcG9vbElkKSkpIHtcbiAgICAgICAgLy8gdmFsaWQgc3Bvb2wgSURcbiAgICAgICAgY29uc3QgaWQgPSBwYXJzZUludChzcG9vbElkKVxuXG4gICAgICAgIGlmICh0aGlzLmF2YWlsYWJsZVNwb29scy5zb21lKChzcG9vbDogU3Bvb2wpID0+IHNwb29sLmlkID09PSBpZCkpIHtcbiAgICAgICAgICAvLyBzcG9vbCBleGlzdHMgaW4gc3Bvb2xtYW5cbiAgICAgICAgICB0aGlzLiRlbWl0KCdkZXRlY3RlZCcsIGlkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHNwb29sIGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UgPSAnZXJyb3Iuc3Bvb2xfbm90X2V4aXN0YW50J1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UgPSAnd2FybmluZy5pbnZhbGlkX3Nwb29sX2lkJ1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXR1c01lc3NhZ2UgPSAnd2FybmluZy5jb2RlX25vdF9yZWNvZ25pemVkJ1xuICAgIH1cbiAgfVxufVxuPC9zY3JpcHQ+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy93aWRnZXRzL3Nwb29sbWFuL1FSUmVhZGVyLnZ1ZSJ9