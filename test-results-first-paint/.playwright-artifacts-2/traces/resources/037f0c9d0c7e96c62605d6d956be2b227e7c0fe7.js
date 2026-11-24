/* unplugin-vue-components disabled */import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import { Component, Prop, Vue, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
const REFRESH_MS = 5e3;
let CameraThumb = class extends Vue {
  camera;
  off;
  tick = 0;
  failed = false;
  loaded = false;
  timer;
  get src() {
    const address = this.camera.snapshot_url;
    if (!address) return "";
    try {
      const url = new URL(address, document.URL);
      url.searchParams.set("cacheBust", String(this.tick));
      return url.toString();
    } catch {
      return "";
    }
  }
  get transform() {
    const parts = [];
    if (this.camera.flip_horizontal) parts.push("scaleX(-1)");
    if (this.camera.flip_vertical) parts.push("scaleY(-1)");
    if (this.camera.rotation) parts.push(`rotate(${this.camera.rotation}deg)`);
    return parts.join(" ") || "none";
  }
  onAddress() {
    this.failed = false;
    this.loaded = false;
  }
  mounted() {
    this.tick = Date.now();
    this.timer = window.setInterval(() => {
      if (document.hidden || this.off) return;
      this.tick = Date.now();
    }, REFRESH_MS);
  }
  beforeDestroy() {
    window.clearInterval(this.timer);
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], CameraThumb.prototype, "camera", 2);
__decorateClass([
  Prop({ type: Boolean })
], CameraThumb.prototype, "off", 2);
__decorateClass([
  Watch("camera.snapshot_url")
], CameraThumb.prototype, "onAddress", 1);
CameraThumb = __decorateClass([
  Component({})
], CameraThumb);
const _sfc_main = CameraThumb;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "cthumb", class: { "cthumb--off": _vm.off }, attrs: { "data-tid": "camera-thumb" } }, [_vm.src && !_vm.failed && !_vm.off ? _c("img", { style: { transform: _vm.transform }, attrs: { "src": _vm.src, "alt": "" }, on: { "load": function($event) {
    _vm.loaded = true;
  }, "error": function($event) {
    _vm.failed = true;
  } } }) : _vm._e(), _vm.off ? _c("span", { staticClass: "cthumb__note" }, [_vm._v("Off")]) : _vm.failed ? _c("span", { staticClass: "cthumb__note cthumb__note--none", attrs: { "data-tid": "camera-thumb-none" } }, [_c(__unplugin_components_0, { attrs: { "name": "camera" } }), _vm._v(" No picture ")], 1) : _vm._e(), _vm.loaded && !_vm.failed && !_vm.off ? _c("span", { staticClass: "cthumb__live" }, [_c("i"), _vm._v(" Live")]) : _vm._e()]);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/settings/cameras/CameraThumb.vue?vue&type=style&index=0&scoped=417c921b&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "417c921b",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/cameras/CameraThumb.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFrQ0E7QUFJQTtBQVFBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUEvQ0E7QUFBQSxFQURBO0FBQUEsR0FEQSxZQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxZQUtBO0FBNEJBO0FBQUEsRUFEQTtBQUFBLEdBaENBLFlBaUNBO0FBakNBO0FBQUEsRUFEQTtBQUFBLEdBQ0EiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNhbWVyYVRodW1iLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxkaXZcbiAgICBjbGFzcz1cImN0aHVtYlwiXG4gICAgOmNsYXNzPVwieyAnY3RodW1iLS1vZmYnOiBvZmYgfVwiXG4gICAgZGF0YS10aWQ9XCJjYW1lcmEtdGh1bWJcIlxuICA+XG4gICAgPGltZ1xuICAgICAgdi1pZj1cInNyYyAmJiAhZmFpbGVkICYmICFvZmZcIlxuICAgICAgOnNyYz1cInNyY1wiXG4gICAgICA6c3R5bGU9XCJ7IHRyYW5zZm9ybSB9XCJcbiAgICAgIGFsdD1cIlwiXG4gICAgICBAbG9hZD1cImxvYWRlZCA9IHRydWVcIlxuICAgICAgQGVycm9yPVwiZmFpbGVkID0gdHJ1ZVwiXG4gICAgPlxuICAgIDxzcGFuXG4gICAgICB2LWlmPVwib2ZmXCJcbiAgICAgIGNsYXNzPVwiY3RodW1iX19ub3RlXCJcbiAgICA+T2ZmPC9zcGFuPlxuICAgIDxzcGFuXG4gICAgICB2LWVsc2UtaWY9XCJmYWlsZWRcIlxuICAgICAgY2xhc3M9XCJjdGh1bWJfX25vdGUgY3RodW1iX19ub3RlLS1ub25lXCJcbiAgICAgIGRhdGEtdGlkPVwiY2FtZXJhLXRodW1iLW5vbmVcIlxuICAgID5cbiAgICAgIDxmcmFtZS1pY29uIG5hbWU9XCJjYW1lcmFcIiAvPlxuICAgICAgTm8gcGljdHVyZVxuICAgIDwvc3Bhbj5cbiAgICA8c3BhblxuICAgICAgdi1pZj1cImxvYWRlZCAmJiAhZmFpbGVkICYmICFvZmZcIlxuICAgICAgY2xhc3M9XCJjdGh1bWJfX2xpdmVcIlxuICAgID48aSAvPiBMaXZlPC9zcGFuPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSwgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBXZWJjYW1Db25maWcgfSBmcm9tICdAL3N0b3JlL3dlYmNhbXMvdHlwZXMnXG5cbi8qKiBIb3cgb2Z0ZW4gYSB0aHVtYm5haWwgYXNrcyBmb3IgYSBuZXcgcGljdHVyZS4gKi9cbmNvbnN0IFJFRlJFU0hfTVMgPSA1MDAwXG5cbi8qKlxuICogQSBjYW1lcmEncyB0aHVtYm5haWw6IGl0cyBzbmFwc2hvdCBhZGRyZXNzLCBkcmF3biB3aXRoIHRoZSBjYW1lcmEncyBvd25cbiAqIHJvdGF0aW9uIGFuZCBmbGlwcywgcmVmcmVzaGVkIG5vdyBhbmQgdGhlbi4gQW4gYWRkcmVzcyB0aGF0IGRvZXNuJ3QgYW5zd2VyXG4gKiBzaG93cyBcIk5vIHBpY3R1cmVcIiBpbnN0ZWFkIG9mIGEgYnJva2VuIGltYWdlLlxuICovXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2FtZXJhVGh1bWIgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgY2FtZXJhITogV2ViY2FtQ29uZmlnXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IG9mZj86IGJvb2xlYW5cblxuICB0aWNrID0gMFxuICBmYWlsZWQgPSBmYWxzZVxuICBsb2FkZWQgPSBmYWxzZVxuICB0aW1lcjogbnVtYmVyIHwgdW5kZWZpbmVkXG5cbiAgZ2V0IHNyYyAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5jYW1lcmEuc25hcHNob3RfdXJsXG4gICAgaWYgKCFhZGRyZXNzKSByZXR1cm4gJydcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChhZGRyZXNzLCBkb2N1bWVudC5VUkwpXG4gICAgICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnY2FjaGVCdXN0JywgU3RyaW5nKHRoaXMudGljaykpXG4gICAgICByZXR1cm4gdXJsLnRvU3RyaW5nKClcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIGdldCB0cmFuc2Zvcm0gKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW11cbiAgICBpZiAodGhpcy5jYW1lcmEuZmxpcF9ob3Jpem9udGFsKSBwYXJ0cy5wdXNoKCdzY2FsZVgoLTEpJylcbiAgICBpZiAodGhpcy5jYW1lcmEuZmxpcF92ZXJ0aWNhbCkgcGFydHMucHVzaCgnc2NhbGVZKC0xKScpXG4gICAgaWYgKHRoaXMuY2FtZXJhLnJvdGF0aW9uKSBwYXJ0cy5wdXNoKGByb3RhdGUoJHt0aGlzLmNhbWVyYS5yb3RhdGlvbn1kZWcpYClcbiAgICByZXR1cm4gcGFydHMuam9pbignICcpIHx8ICdub25lJ1xuICB9XG5cbiAgQFdhdGNoKCdjYW1lcmEuc25hcHNob3RfdXJsJylcbiAgb25BZGRyZXNzICgpIHtcbiAgICB0aGlzLmZhaWxlZCA9IGZhbHNlXG4gICAgdGhpcy5sb2FkZWQgPSBmYWxzZVxuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy50aWNrID0gRGF0ZS5ub3coKVxuICAgIHRoaXMudGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LmhpZGRlbiB8fCB0aGlzLm9mZikgcmV0dXJuXG4gICAgICB0aGlzLnRpY2sgPSBEYXRlLm5vdygpXG4gICAgfSwgUkVGUkVTSF9NUylcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMudGltZXIpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIiBzY29wZWQ+XG4gIC5jdGh1bWIge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICBmbGV4OiBub25lO1xuICAgIHdpZHRoOiAxMzJweDtcbiAgICBhc3BlY3QtcmF0aW86IDE2IC8gOTtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZDogIzE2MTcxYTtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggdmFyKC0tbTNkLWJvcmRlcik7XG5cbiAgICBpbWcge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICBvYmplY3QtZml0OiBjb3ZlcjtcbiAgICB9XG4gIH1cblxuICAuY3RodW1iLS1vZmYgaW1nIHtcbiAgICBmaWx0ZXI6IGdyYXlzY2FsZSgxKSBicmlnaHRuZXNzKDAuNDUpO1xuICB9XG5cbiAgLmN0aHVtYl9fbm90ZSB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGluc2V0OiAwO1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICB9XG5cbiAgLmN0aHVtYl9fbm90ZS0tbm9uZSB7XG4gICAgYWxpZ24tY29udGVudDogY2VudGVyO1xuICAgIGp1c3RpZnktaXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDJweDtcbiAgICBmb250LXNpemU6IDExcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgfVxuXG4gIC5jdGh1bWJfX2xpdmUge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDZweDtcbiAgICBsZWZ0OiA2cHg7XG4gICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDRweDtcbiAgICBwYWRkaW5nOiAxcHggNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgIGJhY2tncm91bmQ6IGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1tM2Qtc3VjY2VzcykgMjQlLCByZ2IoMCAwIDAgLyA0MCUpKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXN1Y2Nlc3MpO1xuICAgIGZvbnQtc2l6ZTogMTBweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuXG4gICAgaSB7XG4gICAgICB3aWR0aDogNXB4O1xuICAgICAgaGVpZ2h0OiA1cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICBiYWNrZ3JvdW5kOiBjdXJyZW50Y29sb3I7XG4gICAgfVxuICB9XG5cbiAgQG1lZGlhIChtYXgtd2lkdGg6IDcwMHB4KSB7XG4gICAgLmN0aHVtYiB7XG4gICAgICB3aWR0aDogOTZweDtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvY29tcG9uZW50cy9zZXR0aW5ncy9jYW1lcmFzL0NhbWVyYVRodW1iLnZ1ZSJ9