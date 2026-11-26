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
import { Component, Prop, Ref, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
let CameraMixin = class extends Vue {
  camera;
  crossorigin;
  streamingElement;
  cameraTransformStyle = "";
  animating = false;
  onCamera() {
    this.stopPlayback();
    this.checkPlayback();
  }
  get apiUrl() {
    return this.$store.state.config.apiUrl;
  }
  get cameraStyle() {
    return {
      transform: this.cameraTransformStyle || void 0
    };
  }
  createTransform() {
    const element = this.streamingElement;
    const { rotation, flip_horizontal, flip_vertical } = this.camera;
    const transformsArray = [];
    const { clientWidth, clientHeight } = element;
    const scale = rotation === 0 || rotation === 180 || clientHeight === 0 || clientWidth === 0 ? 1 : clientHeight < clientWidth ? clientHeight / clientWidth : clientWidth / clientHeight;
    if (scale !== 1 || flip_horizontal) {
      transformsArray.push(`scaleX(${flip_horizontal ? -scale : scale})`);
    }
    if (scale !== 1 || flip_vertical) {
      transformsArray.push(`scaleY(${flip_vertical ? -scale : scale})`);
    }
    if (rotation !== 0) {
      transformsArray.push(`rotate(${rotation}deg`);
    }
    return transformsArray.join(" ");
  }
  updateCameraTransformStyle() {
    requestAnimationFrame(() => {
      if (!this.animating) {
        return;
      }
      if (this.streamingElement) {
        this.cameraTransformStyle = this.createTransform();
      }
      this.updateCameraTransformStyle();
    });
  }
  created() {
    this.animating = true;
    this.updateCameraTransformStyle();
  }
  mounted() {
    document.addEventListener("visibilitychange", this.checkPlayback, false);
    this.checkPlayback();
  }
  beforeDestroy() {
    this.animating = false;
    document.removeEventListener("visibilitychange", this.checkPlayback);
    this.stopPlayback();
  }
  checkPlayback() {
    if (!document.hidden) {
      this.startPlayback();
    } else {
      this.stopPlayback();
    }
  }
  buildAbsoluteUrl(url) {
    const { origin } = new URL(document.URL);
    return new URL(url, origin);
  }
  startPlayback() {
  }
  stopPlayback() {
  }
};
__decorateClass([
  Prop({ type: Object, required: true })
], CameraMixin.prototype, "camera", 2);
__decorateClass([
  Prop({ type: String })
], CameraMixin.prototype, "crossorigin", 2);
__decorateClass([
  Ref("streamingElement")
], CameraMixin.prototype, "streamingElement", 2);
__decorateClass([
  Watch("camera")
], CameraMixin.prototype, "onCamera", 1);
CameraMixin = __decorateClass([
  Component
], CameraMixin);
export {
  CameraMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhbWVyYS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IENvbXBvbmVudCwgUHJvcCwgUmVmLCBXYXRjaCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IFdlYmNhbUNvbmZpZyB9IGZyb20gJ0Avc3RvcmUvd2ViY2Ftcy90eXBlcydcblxuQENvbXBvbmVudFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2FtZXJhTWl4aW4gZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IE9iamVjdCwgcmVxdWlyZWQ6IHRydWUgfSlcbiAgcmVhZG9ubHkgY2FtZXJhITogV2ViY2FtQ29uZmlnXG5cbiAgQFByb3AoeyB0eXBlOiBTdHJpbmcgfSlcbiAgcmVhZG9ubHkgY3Jvc3NvcmlnaW4/OiAnYW5vbnltb3VzJyB8ICd1c2UtY3JlZGVudGlhbHMnIHwgJydcblxuICBAUmVmKCdzdHJlYW1pbmdFbGVtZW50JylcbiAgcmVhZG9ubHkgc3RyZWFtaW5nRWxlbWVudCE6IEhUTUxJbWFnZUVsZW1lbnQgfCBIVE1MSUZyYW1lRWxlbWVudCB8IEhUTUxWaWRlb0VsZW1lbnRcblxuICBjYW1lcmFUcmFuc2Zvcm1TdHlsZSA9ICcnXG4gIGFuaW1hdGluZyA9IGZhbHNlXG5cbiAgQFdhdGNoKCdjYW1lcmEnKVxuICBvbkNhbWVyYSAoKSB7XG4gICAgdGhpcy5zdG9wUGxheWJhY2soKVxuICAgIHRoaXMuY2hlY2tQbGF5YmFjaygpXG4gIH1cblxuICBnZXQgYXBpVXJsICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsIGFzIHN0cmluZ1xuICB9XG5cbiAgZ2V0IGNhbWVyYVN0eWxlICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHJhbnNmb3JtOiB0aGlzLmNhbWVyYVRyYW5zZm9ybVN0eWxlIHx8IHVuZGVmaW5lZFxuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZVRyYW5zZm9ybSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5zdHJlYW1pbmdFbGVtZW50XG4gICAgY29uc3QgeyByb3RhdGlvbiwgZmxpcF9ob3Jpem9udGFsLCBmbGlwX3ZlcnRpY2FsIH0gPSB0aGlzLmNhbWVyYVxuICAgIGNvbnN0IHRyYW5zZm9ybXNBcnJheTogc3RyaW5nW10gPSBbXVxuXG4gICAgY29uc3QgeyBjbGllbnRXaWR0aCwgY2xpZW50SGVpZ2h0IH0gPSBlbGVtZW50XG5cbiAgICBjb25zdCBzY2FsZSA9IChcbiAgICAgIHJvdGF0aW9uID09PSAwIHx8XG4gICAgICByb3RhdGlvbiA9PT0gMTgwIHx8XG4gICAgICBjbGllbnRIZWlnaHQgPT09IDAgfHxcbiAgICAgIGNsaWVudFdpZHRoID09PSAwXG4gICAgKVxuICAgICAgPyAxXG4gICAgICA6IGNsaWVudEhlaWdodCA8IGNsaWVudFdpZHRoXG4gICAgICAgID8gY2xpZW50SGVpZ2h0IC8gY2xpZW50V2lkdGhcbiAgICAgICAgOiBjbGllbnRXaWR0aCAvIGNsaWVudEhlaWdodFxuXG4gICAgaWYgKHNjYWxlICE9PSAxIHx8IGZsaXBfaG9yaXpvbnRhbCkge1xuICAgICAgdHJhbnNmb3Jtc0FycmF5LnB1c2goYHNjYWxlWCgke2ZsaXBfaG9yaXpvbnRhbCA/IC1zY2FsZSA6IHNjYWxlfSlgKVxuICAgIH1cblxuICAgIGlmIChzY2FsZSAhPT0gMSB8fCBmbGlwX3ZlcnRpY2FsKSB7XG4gICAgICB0cmFuc2Zvcm1zQXJyYXkucHVzaChgc2NhbGVZKCR7ZmxpcF92ZXJ0aWNhbCA/IC1zY2FsZSA6IHNjYWxlfSlgKVxuICAgIH1cblxuICAgIGlmIChyb3RhdGlvbiAhPT0gMCkge1xuICAgICAgdHJhbnNmb3Jtc0FycmF5LnB1c2goYHJvdGF0ZSgke3JvdGF0aW9ufWRlZ2ApXG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYW5zZm9ybXNBcnJheS5qb2luKCcgJylcbiAgfVxuXG4gIHVwZGF0ZUNhbWVyYVRyYW5zZm9ybVN0eWxlICgpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmFuaW1hdGluZykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RyZWFtaW5nRWxlbWVudCkge1xuICAgICAgICB0aGlzLmNhbWVyYVRyYW5zZm9ybVN0eWxlID0gdGhpcy5jcmVhdGVUcmFuc2Zvcm0oKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnVwZGF0ZUNhbWVyYVRyYW5zZm9ybVN0eWxlKClcbiAgICB9KVxuICB9XG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgdGhpcy5hbmltYXRpbmcgPSB0cnVlXG4gICAgdGhpcy51cGRhdGVDYW1lcmFUcmFuc2Zvcm1TdHlsZSgpXG4gIH1cblxuICBtb3VudGVkICgpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5jaGVja1BsYXliYWNrLCBmYWxzZSlcbiAgICB0aGlzLmNoZWNrUGxheWJhY2soKVxuICB9XG5cbiAgYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLmNoZWNrUGxheWJhY2spXG4gICAgdGhpcy5zdG9wUGxheWJhY2soKVxuICB9XG5cbiAgY2hlY2tQbGF5YmFjayAoKSB7XG4gICAgaWYgKCFkb2N1bWVudC5oaWRkZW4pIHtcbiAgICAgIHRoaXMuc3RhcnRQbGF5YmFjaygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcFBsYXliYWNrKClcbiAgICB9XG4gIH1cblxuICBidWlsZEFic29sdXRlVXJsICh1cmw6IHN0cmluZykge1xuICAgIGNvbnN0IHsgb3JpZ2luIH0gPSBuZXcgVVJMKGRvY3VtZW50LlVSTClcblxuICAgIHJldHVybiBuZXcgVVJMKHVybCwgb3JpZ2luKVxuICB9XG5cbiAgc3RhcnRQbGF5YmFjayAoKSB7XG4gICAgLy8gbm9vcFxuICB9XG5cbiAgc3RvcFBsYXliYWNrICgpIHtcbiAgICAvLyBub29wXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLE9BQU8sU0FBUztBQUNoQixTQUFTLFdBQVcsTUFBTSxLQUFLLGFBQWE7QUFJNUMsSUFBcUIsY0FBckIsY0FBeUMsSUFBSTtBQUFBLEVBRWxDO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUVULHVCQUF1QjtBQUFBLEVBQ3ZCLFlBQVk7QUFBQSxFQUdaLFdBQVk7QUFDVixTQUFLLGFBQWE7QUFDbEIsU0FBSyxjQUFjO0FBQUEsRUFDckI7QUFBQSxFQUVBLElBQUksU0FBa0I7QUFDcEIsV0FBTyxLQUFLLE9BQU8sTUFBTSxPQUFPO0FBQUEsRUFDbEM7QUFBQSxFQUVBLElBQUksY0FBZTtBQUNqQixXQUFPO0FBQUEsTUFDTCxXQUFXLEtBQUssd0JBQXdCO0FBQUEsSUFDMUM7QUFBQSxFQUNGO0FBQUEsRUFFQSxrQkFBMkI7QUFDekIsVUFBTSxVQUFVLEtBQUs7QUFDckIsVUFBTSxFQUFFLFVBQVUsaUJBQWlCLGNBQWMsSUFBSSxLQUFLO0FBQzFELFVBQU0sa0JBQTRCLENBQUM7QUFFbkMsVUFBTSxFQUFFLGFBQWEsYUFBYSxJQUFJO0FBRXRDLFVBQU0sUUFDSixhQUFhLEtBQ2IsYUFBYSxPQUNiLGlCQUFpQixLQUNqQixnQkFBZ0IsSUFFZCxJQUNBLGVBQWUsY0FDYixlQUFlLGNBQ2YsY0FBYztBQUVwQixRQUFJLFVBQVUsS0FBSyxpQkFBaUI7QUFDbEMsc0JBQWdCLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxRQUFRLEtBQUssR0FBRztBQUFBLElBQ3BFO0FBRUEsUUFBSSxVQUFVLEtBQUssZUFBZTtBQUNoQyxzQkFBZ0IsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQVEsS0FBSyxHQUFHO0FBQUEsSUFDbEU7QUFFQSxRQUFJLGFBQWEsR0FBRztBQUNsQixzQkFBZ0IsS0FBSyxVQUFVLFFBQVEsS0FBSztBQUFBLElBQzlDO0FBRUEsV0FBTyxnQkFBZ0IsS0FBSyxHQUFHO0FBQUEsRUFDakM7QUFBQSxFQUVBLDZCQUE4QjtBQUM1QiwwQkFBc0IsTUFBTTtBQUMxQixVQUFJLENBQUMsS0FBSyxXQUFXO0FBQ25CO0FBQUEsTUFDRjtBQUVBLFVBQUksS0FBSyxrQkFBa0I7QUFDekIsYUFBSyx1QkFBdUIsS0FBSyxnQkFBZ0I7QUFBQSxNQUNuRDtBQUVBLFdBQUssMkJBQTJCO0FBQUEsSUFDbEMsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFVBQVc7QUFDVCxTQUFLLFlBQVk7QUFDakIsU0FBSywyQkFBMkI7QUFBQSxFQUNsQztBQUFBLEVBRUEsVUFBVztBQUNULGFBQVMsaUJBQWlCLG9CQUFvQixLQUFLLGVBQWUsS0FBSztBQUN2RSxTQUFLLGNBQWM7QUFBQSxFQUNyQjtBQUFBLEVBRUEsZ0JBQWlCO0FBQ2YsU0FBSyxZQUFZO0FBQ2pCLGFBQVMsb0JBQW9CLG9CQUFvQixLQUFLLGFBQWE7QUFDbkUsU0FBSyxhQUFhO0FBQUEsRUFDcEI7QUFBQSxFQUVBLGdCQUFpQjtBQUNmLFFBQUksQ0FBQyxTQUFTLFFBQVE7QUFDcEIsV0FBSyxjQUFjO0FBQUEsSUFDckIsT0FBTztBQUNMLFdBQUssYUFBYTtBQUFBLElBQ3BCO0FBQUEsRUFDRjtBQUFBLEVBRUEsaUJBQWtCLEtBQWE7QUFDN0IsVUFBTSxFQUFFLE9BQU8sSUFBSSxJQUFJLElBQUksU0FBUyxHQUFHO0FBRXZDLFdBQU8sSUFBSSxJQUFJLEtBQUssTUFBTTtBQUFBLEVBQzVCO0FBQUEsRUFFQSxnQkFBaUI7QUFBQSxFQUVqQjtBQUFBLEVBRUEsZUFBZ0I7QUFBQSxFQUVoQjtBQUNGO0FBL0dXO0FBQUEsRUFEUixLQUFLLEVBQUUsTUFBTSxRQUFRLFVBQVUsS0FBSyxDQUFDO0FBQUEsR0FEbkIsWUFFVjtBQUdBO0FBQUEsRUFEUixLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFBQSxHQUpILFlBS1Y7QUFHQTtBQUFBLEVBRFIsSUFBSSxrQkFBa0I7QUFBQSxHQVBKLFlBUVY7QUFNVDtBQUFBLEVBREMsTUFBTSxRQUFRO0FBQUEsR0FiSSxZQWNuQjtBQWRtQixjQUFyQjtBQUFBLEVBREM7QUFBQSxHQUNvQjtBQUFyQjtBQUFBLEVBQU8sZUFMUDtBQUFBOyIsIm5hbWVzIjpbXX0=