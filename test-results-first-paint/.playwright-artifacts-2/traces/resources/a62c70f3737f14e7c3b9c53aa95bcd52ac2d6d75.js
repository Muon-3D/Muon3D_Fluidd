/* unplugin-vue-components disabled */var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { Component, Prop, Watch, Ref, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { merge, cloneDeepWith } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import BrowserMixin from "/src/mixins/browser.ts";
let BedMeshChart = class extends Mixins(BrowserMixin) {
  data;
  graphics;
  options;
  height;
  chart;
  get flatSurface() {
    return this.$store.state.mesh.flatSurface;
  }
  get bedSize() {
    return this.$store.getters["printer/getBedSize"];
  }
  onFlatSurfaceChange(value) {
    const type = value ? "legendSelect" : "legendUnSelect";
    this.chart.dispatchAction({
      type,
      name: "mesh_matrix_flat"
    });
    this.chart.dispatchAction({
      type,
      name: "probed_matrix_flat"
    });
  }
  beforeDestroy() {
    if (typeof window === "undefined") return;
    this.chart.dispose();
  }
  get opts() {
    const darkMode = this.$store.state.config.uiSettings.theme.isDark;
    const fontColor = darkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)";
    const fontSize = this.isMobileViewport ? 14 : 16;
    const labelBackground = darkMode ? "rgba(10,10,10,0.90)" : "rgba(255,255,255,0.90)";
    const opacity = 0.1;
    const lineColor = darkMode ? "#ffffff" : "#000000";
    const visualMap = {
      itemWidth: this.isMobileViewport ? 15 : 25,
      itemHeight: this.isMobileViewport ? 140 : 280
    };
    const axisCommon = {
      nameTextStyle: {
        color: fontColor
      },
      axisPointer: {
        lineStyle: {
          color: lineColor,
          opacity: 0.65
        },
        label: {
          margin: 16,
          color: fontColor,
          fontSize
        }
      },
      axisTick: {
        lineStyle: {
          color: lineColor,
          opacity
        }
      },
      axisLine: {
        lineStyle: {
          color: lineColor,
          opacity,
          width: 2
        }
      },
      axisLabel: {
        textStyle: {
          color: fontColor,
          fontSize
        }
      },
      splitLine: {
        lineStyle: {
          color: lineColor,
          opacity
        }
      }
    };
    const graphic = cloneDeepWith(this.graphics, (g) => {
      switch (g.type) {
        case "text":
          return {
            ...g,
            style: {
              ...g.style,
              fill: fontColor,
              fontSize
            }
          };
        default:
          return void 0;
      }
    });
    const opts = {
      legend: {
        show: false
      },
      textStyle: {
        fontFamily: this.$store.getters["config/getChartFontFamily"]
      },
      darkMode,
      tooltip: {
        backgroundColor: labelBackground,
        borderColor: labelBackground,
        textStyle: {
          color: fontColor,
          fontSize: 18
        },
        formatter: (params) => {
          let text = "";
          if (params.value && Array.isArray(params.value)) {
            text += `
              <div>
                <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  ${this.$filters.prettyCase(params.seriesName)}
                </span>
                <div style="clear: both"></div>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  x: ${params.value[0].toFixed(4)}
                </span>
                <div style="clear: both"></div>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  y: ${params.value[1].toFixed(4)}
                </span>
                <div style="clear: both"></div>
                <span style="font-size:16px;color:${fontColor};font-weight:400;margin-left:2px">
                  z: ${params.value[2].toFixed(4)}
                </span>
                <div style="clear: both"></div>
              </div>
              `;
          }
          return text;
        }
      },
      visualMap: {
        type: "continuous",
        textStyle: {
          color: fontColor,
          fontSize
        },
        realtime: true,
        calculable: true,
        show: true,
        top: 0,
        right: "auto",
        bottom: "auto",
        left: 0,
        dimension: 2,
        precision: 4,
        inRange: {
          color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]
        },
        ...visualMap
      },
      xAxis3D: {
        type: "value",
        min: this.bedSize?.minX,
        max: this.bedSize?.maxX,
        ...axisCommon
      },
      yAxis3D: {
        type: "value",
        min: this.bedSize?.minY,
        max: this.bedSize?.maxY,
        ...axisCommon
      },
      zAxis3D: {
        type: "value",
        min: -0.5,
        max: 0.5,
        ...axisCommon
      },
      grid3D: {
        viewControl: {
          // distance: 100,
          rotateSensitivity: 1.8,
          zoomSensitivity: 2,
          rotateMouseButton: "left",
          panMouseButton: "right"
        }
      },
      graphic,
      series: [...this.data]
    };
    merge(opts, this.options);
    return opts;
  }
  async copyImage() {
    const image = await fetch(this.chart.getDataURL({ type: "png", backgroundColor: "#262629" }));
    const blob = await image.blob();
    const data = [
      new ClipboardItem({ "image/png": blob })
    ];
    await navigator.clipboard.write(data);
  }
};
__decorateClass([
  Prop({ type: Array, required: true })
], BedMeshChart.prototype, "data", 2);
__decorateClass([
  Prop({ type: Array, default: () => [] })
], BedMeshChart.prototype, "graphics", 2);
__decorateClass([
  Prop({ type: Object, default: () => {
  } })
], BedMeshChart.prototype, "options", 2);
__decorateClass([
  Prop({ type: String, default: "100%" })
], BedMeshChart.prototype, "height", 2);
__decorateClass([
  Ref("chart")
], BedMeshChart.prototype, "chart", 2);
__decorateClass([
  Watch("flatSurface")
], BedMeshChart.prototype, "onFlatSurfaceChange", 1);
BedMeshChart = __decorateClass([
  Component({})
], BedMeshChart);
const _sfc_main = BedMeshChart;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "chart", style: { "height": _vm.height } }, [_c("e-chart", { ref: "chart", attrs: { "option": _vm.opts, "update-options": { notMerge: false }, "init-options": { renderer: "canvas" }, "autoresize": "" } })], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/components/widgets/bedmesh/BedMeshChart.vue?vue&type=style&index=0&scoped=9cb6b549&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "9cb6b549",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/widgets/bedmesh/BedMeshChart.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTtBQUVBO0FBQ0E7QUFJQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFHQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFBQSxRQUNBO0FBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFFQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUEsZ0lBRUE7QUFBQSxvREFDQTtBQUFBLG9CQUNBO0FBQUE7QUFBQTtBQUFBLG9EQUdBO0FBQUEsdUJBQ0E7QUFBQTtBQUFBO0FBQUEsb0RBR0E7QUFBQSx1QkFDQTtBQUFBO0FBQUE7QUFBQSxvREFHQTtBQUFBLHVCQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQUtBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0E7QUFBQTtBQUFBLFVBRUE7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFFQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBRUE7QUFBQSxFQUNBO0FBQ0E7QUEvTkE7QUFBQSxFQURBO0FBQUEsR0FEQSxhQUVBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FKQSxhQUtBO0FBR0E7QUFBQSxFQURBO0FBQUE7QUFBQSxHQVBBLGFBUUE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVZBLGFBV0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQWJBLGFBY0E7QUFXQTtBQUFBLEVBREE7QUFBQSxHQXhCQSxhQXlCQTtBQXpCQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJCZWRNZXNoQ2hhcnQudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cbiAgPGRpdlxuICAgIGNsYXNzPVwiY2hhcnRcIlxuICAgIDpzdHlsZT1cInsgJ2hlaWdodCc6IGhlaWdodCB9XCJcbiAgPlxuICAgIDxlLWNoYXJ0XG4gICAgICByZWY9XCJjaGFydFwiXG4gICAgICA6b3B0aW9uPVwib3B0c1wiXG4gICAgICA6dXBkYXRlLW9wdGlvbnM9XCJ7IG5vdE1lcmdlOiBmYWxzZSB9XCJcbiAgICAgIDppbml0LW9wdGlvbnM9XCJ7IHJlbmRlcmVyOiAnY2FudmFzJyB9XCJcbiAgICAgIGF1dG9yZXNpemVcbiAgICAvPlxuXG4gICAgPCEtLSA8cHJlPmxlZ2VuZHM6IHt7IG9wdHMubGVnZW5kIH19PC9wcmU+IC0tPlxuXG4gICAgPCEtLSA8cHJlPnNlcmllczoge3sgb3B0cy5zZXJpZXMubGVuZ3RoIH19PC9wcmU+IC0tPlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz0ndHMnPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBQcm9wLCBXYXRjaCwgUmVmLCBNaXhpbnMgfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHR5cGUgeyBFQ2hhcnRzLCBFQ2hhcnRzT3B0aW9uLCBHcmFwaGljQ29tcG9uZW50T3B0aW9uIH0gZnJvbSAnZWNoYXJ0cydcbmltcG9ydCB7IG1lcmdlLCBjbG9uZURlZXBXaXRoIH0gZnJvbSAnbG9kYXNoLWVzJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IHR5cGUgeyBCZWRTaXplIH0gZnJvbSAnQC9zdG9yZS9wcmludGVyL3R5cGVzJ1xuXG5AQ29tcG9uZW50KHt9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmVkTWVzaENoYXJ0IGV4dGVuZHMgTWl4aW5zKEJyb3dzZXJNaXhpbikge1xuICBAUHJvcCh7IHR5cGU6IEFycmF5LCByZXF1aXJlZDogdHJ1ZSB9KVxuICByZWFkb25seSBkYXRhITogW11cblxuICBAUHJvcCh7IHR5cGU6IEFycmF5PEdyYXBoaWNDb21wb25lbnRPcHRpb24+LCBkZWZhdWx0OiAoKSA9PiBbXSB9KVxuICByZWFkb25seSBncmFwaGljcyE6IEdyYXBoaWNDb21wb25lbnRPcHRpb25bXVxuXG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCBkZWZhdWx0OiAoKSA9PiB7fSB9KVxuICByZWFkb25seSBvcHRpb25zITogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJzEwMCUnIH0pXG4gIHJlYWRvbmx5IGhlaWdodCE6IHN0cmluZ1xuXG4gIEBSZWYoJ2NoYXJ0JylcbiAgcmVhZG9ubHkgY2hhcnQhOiBFQ2hhcnRzXG5cbiAgZ2V0IGZsYXRTdXJmYWNlICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUubWVzaC5mbGF0U3VyZmFjZVxuICB9XG5cbiAgZ2V0IGJlZFNpemUgKCk6IEJlZFNpemUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldEJlZFNpemUnXSBhcyBCZWRTaXplIHwgdW5kZWZpbmVkXG4gIH1cblxuICBAV2F0Y2goJ2ZsYXRTdXJmYWNlJylcbiAgb25GbGF0U3VyZmFjZUNoYW5nZSAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCB0eXBlID0gdmFsdWUgPyAnbGVnZW5kU2VsZWN0JyA6ICdsZWdlbmRVblNlbGVjdCdcbiAgICB0aGlzLmNoYXJ0LmRpc3BhdGNoQWN0aW9uKHtcbiAgICAgIHR5cGUsXG4gICAgICBuYW1lOiAnbWVzaF9tYXRyaXhfZmxhdCdcbiAgICB9KVxuICAgIHRoaXMuY2hhcnQuZGlzcGF0Y2hBY3Rpb24oe1xuICAgICAgdHlwZSxcbiAgICAgIG5hbWU6ICdwcm9iZWRfbWF0cml4X2ZsYXQnXG4gICAgfSlcbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuXG4gICAgdGhpcy5jaGFydC5kaXNwb3NlKClcbiAgfVxuXG4gIGdldCBvcHRzICgpOiBFQ2hhcnRzT3B0aW9uIHtcbiAgICAvLyBJZiBvcHRpb25zIGluY2x1ZGVzIHNlcmllcyBkYXRhLCByaXAgaXQgb3V0IHNvIHdlIGNhbiBtZXJnZSBpdCB3aXRoXG4gICAgLy8gdGhlIGdpdmVuIHNlcmllcyBpbiBvdXIgaW5pdGlhbCBvcHRpb25zLlxuICAgIGNvbnN0IGRhcmtNb2RlID0gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MudGhlbWUuaXNEYXJrXG5cbiAgICBjb25zdCBmb250Q29sb3IgPSAoZGFya01vZGUpID8gJ3JnYmEoMjU1LDI1NSwyNTUsMC42NSknIDogJ3JnYmEoMCwwLDAsMC40NSknXG4gICAgY29uc3QgZm9udFNpemUgPSAodGhpcy5pc01vYmlsZVZpZXdwb3J0KSA/IDE0IDogMTZcbiAgICBjb25zdCBsYWJlbEJhY2tncm91bmQgPSAoZGFya01vZGUpID8gJ3JnYmEoMTAsMTAsMTAsMC45MCknIDogJ3JnYmEoMjU1LDI1NSwyNTUsMC45MCknXG4gICAgY29uc3Qgb3BhY2l0eSA9IDAuMTBcbiAgICBjb25zdCBsaW5lQ29sb3IgPSAoZGFya01vZGUpID8gJyNmZmZmZmYnIDogJyMwMDAwMDAnXG4gICAgY29uc3QgdmlzdWFsTWFwID0ge1xuICAgICAgaXRlbVdpZHRoOiAodGhpcy5pc01vYmlsZVZpZXdwb3J0KSA/IDE1IDogMjUsXG4gICAgICBpdGVtSGVpZ2h0OiAodGhpcy5pc01vYmlsZVZpZXdwb3J0KSA/IDE0MCA6IDI4MFxuICAgIH1cblxuICAgIGNvbnN0IGF4aXNDb21tb24gPSB7XG4gICAgICBuYW1lVGV4dFN0eWxlOiB7XG4gICAgICAgIGNvbG9yOiBmb250Q29sb3JcbiAgICAgIH0sXG4gICAgICBheGlzUG9pbnRlcjoge1xuICAgICAgICBsaW5lU3R5bGU6IHtcbiAgICAgICAgICBjb2xvcjogbGluZUNvbG9yLFxuICAgICAgICAgIG9wYWNpdHk6IDAuNjVcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWw6IHtcbiAgICAgICAgICBtYXJnaW46IDE2LFxuICAgICAgICAgIGNvbG9yOiBmb250Q29sb3IsXG4gICAgICAgICAgZm9udFNpemVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGF4aXNUaWNrOiB7XG4gICAgICAgIGxpbmVTdHlsZToge1xuICAgICAgICAgIGNvbG9yOiBsaW5lQ29sb3IsXG4gICAgICAgICAgb3BhY2l0eVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYXhpc0xpbmU6IHtcbiAgICAgICAgbGluZVN0eWxlOiB7XG4gICAgICAgICAgY29sb3I6IGxpbmVDb2xvcixcbiAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgIHdpZHRoOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBheGlzTGFiZWw6IHtcbiAgICAgICAgdGV4dFN0eWxlOiB7XG4gICAgICAgICAgY29sb3I6IGZvbnRDb2xvcixcbiAgICAgICAgICBmb250U2l6ZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc3BsaXRMaW5lOiB7XG4gICAgICAgIGxpbmVTdHlsZToge1xuICAgICAgICAgIGNvbG9yOiBsaW5lQ29sb3IsXG4gICAgICAgICAgb3BhY2l0eVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZ3JhcGhpYyA9IGNsb25lRGVlcFdpdGgodGhpcy5ncmFwaGljcywgZyA9PiB7XG4gICAgICBzd2l0Y2ggKGcudHlwZSkge1xuICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZyxcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgIC4uLmcuc3R5bGUsXG4gICAgICAgICAgICAgIGZpbGw6IGZvbnRDb2xvcixcbiAgICAgICAgICAgICAgZm9udFNpemVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBvcHRzOiBFQ2hhcnRzT3B0aW9uID0ge1xuICAgICAgbGVnZW5kOiB7XG4gICAgICAgIHNob3c6IGZhbHNlXG4gICAgICB9LFxuICAgICAgdGV4dFN0eWxlOiB7XG4gICAgICAgIGZvbnRGYW1pbHk6IHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXRDaGFydEZvbnRGYW1pbHknXVxuICAgICAgfSxcbiAgICAgIGRhcmtNb2RlLFxuICAgICAgdG9vbHRpcDoge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGxhYmVsQmFja2dyb3VuZCxcbiAgICAgICAgYm9yZGVyQ29sb3I6IGxhYmVsQmFja2dyb3VuZCxcbiAgICAgICAgdGV4dFN0eWxlOiB7XG4gICAgICAgICAgY29sb3I6IGZvbnRDb2xvcixcbiAgICAgICAgICBmb250U2l6ZTogMThcbiAgICAgICAgfSxcbiAgICAgICAgZm9ybWF0dGVyOiAocGFyYW1zOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgdGV4dCA9ICcnXG4gICAgICAgICAgaWYgKHBhcmFtcy52YWx1ZSAmJiBBcnJheS5pc0FycmF5KHBhcmFtcy52YWx1ZSkpIHtcbiAgICAgICAgICAgIHRleHQgKz0gYFxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPVwiZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLXJpZ2h0OjRweDtib3JkZXItcmFkaXVzOjEwcHg7d2lkdGg6MTBweDtoZWlnaHQ6MTBweDtiYWNrZ3JvdW5kLWNvbG9yOiR7cGFyYW1zLmNvbG9yfTtcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9XCJmb250LXNpemU6MTZweDtjb2xvcjoke2ZvbnRDb2xvcn07Zm9udC13ZWlnaHQ6NDAwO21hcmdpbi1sZWZ0OjJweFwiPlxuICAgICAgICAgICAgICAgICAgJHt0aGlzLiRmaWx0ZXJzLnByZXR0eUNhc2UocGFyYW1zLnNlcmllc05hbWUpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGhcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT1cImZvbnQtc2l6ZToxNnB4O2NvbG9yOiR7Zm9udENvbG9yfTtmb250LXdlaWdodDo0MDA7bWFyZ2luLWxlZnQ6MnB4XCI+XG4gICAgICAgICAgICAgICAgICB4OiAke3BhcmFtcy52YWx1ZVswXS50b0ZpeGVkKDQpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGhcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT1cImZvbnQtc2l6ZToxNnB4O2NvbG9yOiR7Zm9udENvbG9yfTtmb250LXdlaWdodDo0MDA7bWFyZ2luLWxlZnQ6MnB4XCI+XG4gICAgICAgICAgICAgICAgICB5OiAke3BhcmFtcy52YWx1ZVsxXS50b0ZpeGVkKDQpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGhcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT1cImZvbnQtc2l6ZToxNnB4O2NvbG9yOiR7Zm9udENvbG9yfTtmb250LXdlaWdodDo0MDA7bWFyZ2luLWxlZnQ6MnB4XCI+XG4gICAgICAgICAgICAgICAgICB6OiAke3BhcmFtcy52YWx1ZVsyXS50b0ZpeGVkKDQpfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGhcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIGBcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRleHRcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHZpc3VhbE1hcDoge1xuICAgICAgICB0eXBlOiAnY29udGludW91cycsXG4gICAgICAgIHRleHRTdHlsZToge1xuICAgICAgICAgIGNvbG9yOiBmb250Q29sb3IsXG4gICAgICAgICAgZm9udFNpemVcbiAgICAgICAgfSxcbiAgICAgICAgcmVhbHRpbWU6IHRydWUsXG4gICAgICAgIGNhbGN1bGFibGU6IHRydWUsXG4gICAgICAgIHNob3c6IHRydWUsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6ICdhdXRvJyxcbiAgICAgICAgYm90dG9tOiAnYXV0bycsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIGRpbWVuc2lvbjogMixcbiAgICAgICAgcHJlY2lzaW9uOiA0LFxuICAgICAgICBpblJhbmdlOiB7XG4gICAgICAgICAgY29sb3I6IFsnIzMxMzY5NScsICcjNDU3NWI0JywgJyM3NGFkZDEnLCAnI2FiZDllOScsICcjZTBmM2Y4JywgJyNmZmZmYmYnLCAnI2ZlZTA5MCcsICcjZmRhZTYxJywgJyNmNDZkNDMnLCAnI2Q3MzAyNycsICcjYTUwMDI2J11cbiAgICAgICAgfSxcbiAgICAgICAgLi4udmlzdWFsTWFwXG4gICAgICB9LFxuICAgICAgeEF4aXMzRDoge1xuICAgICAgICB0eXBlOiAndmFsdWUnLFxuICAgICAgICBtaW46IHRoaXMuYmVkU2l6ZT8ubWluWCxcbiAgICAgICAgbWF4OiB0aGlzLmJlZFNpemU/Lm1heFgsXG4gICAgICAgIC4uLmF4aXNDb21tb25cbiAgICAgIH0sXG4gICAgICB5QXhpczNEOiB7XG4gICAgICAgIHR5cGU6ICd2YWx1ZScsXG4gICAgICAgIG1pbjogdGhpcy5iZWRTaXplPy5taW5ZLFxuICAgICAgICBtYXg6IHRoaXMuYmVkU2l6ZT8ubWF4WSxcbiAgICAgICAgLi4uYXhpc0NvbW1vblxuICAgICAgfSxcbiAgICAgIHpBeGlzM0Q6IHtcbiAgICAgICAgdHlwZTogJ3ZhbHVlJyxcbiAgICAgICAgbWluOiAtMC41LFxuICAgICAgICBtYXg6IDAuNSxcbiAgICAgICAgLi4uYXhpc0NvbW1vblxuICAgICAgfSxcbiAgICAgIGdyaWQzRDoge1xuICAgICAgICB2aWV3Q29udHJvbDoge1xuICAgICAgICAgIC8vIGRpc3RhbmNlOiAxMDAsXG4gICAgICAgICAgcm90YXRlU2Vuc2l0aXZpdHk6IDEuOCxcbiAgICAgICAgICB6b29tU2Vuc2l0aXZpdHk6IDIsXG4gICAgICAgICAgcm90YXRlTW91c2VCdXR0b246ICdsZWZ0JyxcbiAgICAgICAgICBwYW5Nb3VzZUJ1dHRvbjogJ3JpZ2h0J1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZ3JhcGhpYyxcbiAgICAgIHNlcmllczogWy4uLnRoaXMuZGF0YV1cbiAgICB9XG5cbiAgICAvLyBNZXJnZSB0aGUgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIGdpdmVuIHByb3AuXG4gICAgbWVyZ2Uob3B0cywgdGhpcy5vcHRpb25zKVxuICAgIHJldHVybiBvcHRzXG4gIH1cblxuICBhc3luYyBjb3B5SW1hZ2UgKCkge1xuICAgIGNvbnN0IGltYWdlID0gYXdhaXQgZmV0Y2godGhpcy5jaGFydC5nZXREYXRhVVJMKHsgdHlwZTogJ3BuZycsIGJhY2tncm91bmRDb2xvcjogJyMyNjI2MjknIH0pKVxuXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IGltYWdlLmJsb2IoKVxuXG4gICAgY29uc3QgZGF0YSA9IFtcbiAgICAgIG5ldyBDbGlwYm9hcmRJdGVtKHsgJ2ltYWdlL3BuZyc6IGJsb2IgfSlcbiAgICBdXG5cbiAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlKGRhdGEpXG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz0nc2Nzcycgc2NvcGVkPlxuICAuY2hhcnQge1xuICAgIG1hcmdpbi10b3A6IDE2cHg7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgLy8gaGVpZ2h0OiA2MjVweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3dpZGdldHMvYmVkbWVzaC9CZWRNZXNoQ2hhcnQudnVlIn0=