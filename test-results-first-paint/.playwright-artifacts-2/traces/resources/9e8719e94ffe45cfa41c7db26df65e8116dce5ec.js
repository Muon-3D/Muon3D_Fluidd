import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import vuetify from "/src/plugins/vuetify.ts";
import { Globals } from "/src/globals.ts";
export const getters = {
  /**
   * Returns our actual chart data
   */
  getChartData: (state) => {
    return state.chart;
  },
  /**
   * Returns currently selected legends
   */
  getSelectedLegends: (state) => {
    return state.selectedLegends;
  },
  /**
   * Return the charts retention.
   */
  getChartRetention: (state, getters2, rootState, rootGetters) => {
    const config = rootGetters["server/getConfig"];
    return config.data_store?.temperature_store_size ?? config.server?.temperature_store_size ?? Globals.CHART_HISTORY_RETENTION;
  },
  /**
   * Return base chart options given a chart type.
   */
  getBaseChartOptions: (state, getters2, rootState, rootGetters) => (tooltipSuffix = {}) => {
    const isDark = rootState.config.uiSettings.theme.isDark;
    const isMobile = vuetify.framework.breakpoint.mobile;
    const fontColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)";
    const fontSize = isMobile ? 13 : 14;
    const lineStyle = {
      color: isDark ? "#ffffff" : "#000000",
      opacity: 0.05
    };
    const pointerStyle = {
      color: isDark ? "#ffffff" : "#000000",
      opacity: 0.5
    };
    const grid = {
      show: true,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"
    };
    const tooltip = {
      backgroundColor: isDark ? "rgba(15,15,15,0.75)" : "rgba(255,255,255,0.75)",
      borderColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)",
      textStyle: {
        color: fontColor,
        fontSize
      }
    };
    const theme = vuetify.framework.theme.currentTheme;
    const color = [
      theme.primary,
      theme.accent,
      theme.info
    ];
    return {
      color,
      grid,
      textStyle: {
        fontFamily: rootGetters["config/getChartFontFamily"]
      },
      tooltip: {
        ...tooltip,
        show: true,
        trigger: "axis",
        position: ["-8px", "-8px"],
        formatter: (params) => {
          let title = false;
          let text = "<div>";
          params.forEach((param) => {
            const xDimension = param.dimensionNames[param.encode.x];
            const yDimension = param.dimensionNames[param.encode.y];
            const ySuffix = tooltipSuffix[yDimension] || "";
            if (xDimension && yDimension && param.seriesName) {
              if (!title) {
                text += `
                  <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                    ${Vue.$filters.formatTimeWithSeconds(param.value[xDimension])}
                  </span>
                  `;
                title = true;
              }
              text += `
                  <div style="white-space: nowrap;">
                    ${param.marker}
                    <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                      ${Vue.$filters.prettyCase(param.seriesName)}:
                    </span>
                    <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                      ${param.value[yDimension]}${ySuffix}
                    </span>
                    <div style="clear: both"></div>
                  </div>
                  <div style="clear: both"></div>
                `;
            }
          });
          text += "</div>";
          return text;
        }
      },
      xAxis: {
        type: "time",
        boundaryGap: false,
        min: (value) => {
          return value.max - 600 * 1e3;
        },
        // min: 'dataMin',
        max: "dataMax",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false, formatter: "{value}%" },
        splitLine: { show: true, lineStyle },
        axisPointer: { lineStyle: pointerStyle }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: (value) => {
          return value.max <= 100 ? 100 : value.max;
        },
        axisLabel: { show: false, formatter: "{value}%" },
        splitLine: { show: true, lineStyle }
      }
    };
  },
  /**
   * Returb base chart series configuration based on a type
   */
  getBaseSeries: () => (options) => {
    const o = {
      type: "line",
      smooth: true,
      animation: false,
      showSymbol: false,
      symbol: "emptyCircle",
      areaStyle: { type: "solid", opacity: 0.3 },
      lineStyle: { type: "solid", width: 1.5, opacity: 1 },
      emphasis: {
        lineStyle: { width: 1.5 }
      },
      ...options
    };
    return o;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgdnVldGlmeSBmcm9tICdAL3BsdWdpbnMvdnVldGlmeSdcbmltcG9ydCB0eXBlIHsgR2V0dGVyVHJlZSB9IGZyb20gJ3Z1ZXgnXG5pbXBvcnQgdHlwZSB7IENoYXJ0U3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBSb290U3RhdGUgfSBmcm9tICcuLi90eXBlcydcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgdHlwZSB7IEVDaGFydHNPcHRpb24gfSBmcm9tICdlY2hhcnRzJ1xuXG5leHBvcnQgY29uc3QgZ2V0dGVyczogR2V0dGVyVHJlZTxDaGFydFN0YXRlLCBSb290U3RhdGU+ID0ge1xuICAvKipcbiAgICogUmV0dXJucyBvdXIgYWN0dWFsIGNoYXJ0IGRhdGFcbiAgICovXG4gIGdldENoYXJ0RGF0YTogKHN0YXRlKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLmNoYXJ0XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgY3VycmVudGx5IHNlbGVjdGVkIGxlZ2VuZHNcbiAgICovXG4gIGdldFNlbGVjdGVkTGVnZW5kczogKHN0YXRlKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLnNlbGVjdGVkTGVnZW5kc1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGNoYXJ0cyByZXRlbnRpb24uXG4gICAqL1xuICBnZXRDaGFydFJldGVudGlvbjogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUsIHJvb3RHZXR0ZXJzKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0gcm9vdEdldHRlcnNbJ3NlcnZlci9nZXRDb25maWcnXVxuICAgIHJldHVybiBjb25maWcuZGF0YV9zdG9yZT8udGVtcGVyYXR1cmVfc3RvcmVfc2l6ZSA/P1xuICAgICAgY29uZmlnLnNlcnZlcj8udGVtcGVyYXR1cmVfc3RvcmVfc2l6ZSA/P1xuICAgICAgR2xvYmFscy5DSEFSVF9ISVNUT1JZX1JFVEVOVElPTlxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYmFzZSBjaGFydCBvcHRpb25zIGdpdmVuIGEgY2hhcnQgdHlwZS5cbiAgICovXG4gIGdldEJhc2VDaGFydE9wdGlvbnM6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlLCByb290R2V0dGVycykgPT4gKHRvb2x0aXBTdWZmaXg6IHsgW2luZGV4OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9KSA9PiB7XG4gICAgLy8gQ29tbW9uIHByb3BlcnRpZXMgYWNyb3NzIGFsbCBjaGFydCB0eXBlcy5cbiAgICBjb25zdCBpc0RhcmsgPSByb290U3RhdGUuY29uZmlnLnVpU2V0dGluZ3MudGhlbWUuaXNEYXJrXG4gICAgY29uc3QgaXNNb2JpbGUgPSB2dWV0aWZ5LmZyYW1ld29yay5icmVha3BvaW50Lm1vYmlsZVxuXG4gICAgY29uc3QgZm9udENvbG9yID0gKGlzRGFyaykgPyAncmdiYSgyNTUsMjU1LDI1NSwwLjY1KScgOiAncmdiYSgwLDAsMCwwLjQ1KSdcbiAgICBjb25zdCBmb250U2l6ZSA9IChpc01vYmlsZSkgPyAxMyA6IDE0XG5cbiAgICBjb25zdCBsaW5lU3R5bGUgPSB7XG4gICAgICBjb2xvcjogKGlzRGFyaykgPyAnI2ZmZmZmZicgOiAnIzAwMDAwMCcsXG4gICAgICBvcGFjaXR5OiAwLjA1XG4gICAgfVxuXG4gICAgY29uc3QgcG9pbnRlclN0eWxlID0ge1xuICAgICAgY29sb3I6IChpc0RhcmspID8gJyNmZmZmZmYnIDogJyMwMDAwMDAnLFxuICAgICAgb3BhY2l0eTogMC41XG4gICAgfVxuXG4gICAgY29uc3QgZ3JpZCA9IHtcbiAgICAgIHNob3c6IHRydWUsXG4gICAgICBib3JkZXJXaWR0aDogMSxcbiAgICAgIGJvcmRlckNvbG9yOiAoaXNEYXJrKSA/ICdyZ2JhKDI1NSwyNTUsMjU1LDAuMjUpJyA6ICdyZ2JhKDAsMCwwLDAuMTUpJ1xuICAgIH1cblxuICAgIGNvbnN0IHRvb2x0aXAgPSB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IChpc0RhcmspID8gJ3JnYmEoMTUsMTUsMTUsMC43NSknIDogJ3JnYmEoMjU1LDI1NSwyNTUsMC43NSknLFxuICAgICAgYm9yZGVyQ29sb3I6IChpc0RhcmspID8gJ3JnYmEoMCwwLDAsMC44NSknIDogJ3JnYmEoMjU1LDI1NSwyNTUsMC44NSknLFxuICAgICAgdGV4dFN0eWxlOiB7XG4gICAgICAgIGNvbG9yOiBmb250Q29sb3IsXG4gICAgICAgIGZvbnRTaXplXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGhlbWUgPSB2dWV0aWZ5LmZyYW1ld29yay50aGVtZS5jdXJyZW50VGhlbWVcbiAgICBjb25zdCBjb2xvciA9IFtcbiAgICAgIHRoZW1lLnByaW1hcnksXG4gICAgICB0aGVtZS5hY2NlbnQsXG4gICAgICB0aGVtZS5pbmZvXG4gICAgXVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbG9yLFxuICAgICAgZ3JpZCxcbiAgICAgIHRleHRTdHlsZToge1xuICAgICAgICBmb250RmFtaWx5OiByb290R2V0dGVyc1snY29uZmlnL2dldENoYXJ0Rm9udEZhbWlseSddXG4gICAgICB9LFxuICAgICAgdG9vbHRpcDoge1xuICAgICAgICAuLi50b29sdGlwLFxuICAgICAgICBzaG93OiB0cnVlLFxuICAgICAgICB0cmlnZ2VyOiAnYXhpcycsXG4gICAgICAgIHBvc2l0aW9uOiBbJy04cHgnLCAnLThweCddLFxuICAgICAgICBmb3JtYXR0ZXI6IChwYXJhbXM6IGFueSkgPT4ge1xuICAgICAgICAgIGxldCB0aXRsZSA9IGZhbHNlXG4gICAgICAgICAgbGV0IHRleHQgPSAnPGRpdj4nXG4gICAgICAgICAgcGFyYW1zXG4gICAgICAgICAgICAuZm9yRWFjaCgocGFyYW06IGFueSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB4RGltZW5zaW9uID0gcGFyYW0uZGltZW5zaW9uTmFtZXNbcGFyYW0uZW5jb2RlLnhdXG4gICAgICAgICAgICAgIGNvbnN0IHlEaW1lbnNpb24gPSBwYXJhbS5kaW1lbnNpb25OYW1lc1twYXJhbS5lbmNvZGUueV1cbiAgICAgICAgICAgICAgY29uc3QgeVN1ZmZpeCA9IHRvb2x0aXBTdWZmaXhbeURpbWVuc2lvbl0gfHwgJydcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHhEaW1lbnNpb24gJiZcbiAgICAgICAgICAgICAgICB5RGltZW5zaW9uICYmXG4gICAgICAgICAgICAgICAgcGFyYW0uc2VyaWVzTmFtZVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICB0ZXh0ICs9IGBcbiAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPVwiZm9udC1zaXplOiR7Zm9udFNpemV9cHg7Y29sb3I6JHtmb250Q29sb3J9O2ZvbnQtd2VpZ2h0OjQwMDttYXJnaW4tbGVmdDoycHhcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtWdWUuJGZpbHRlcnMuZm9ybWF0VGltZVdpdGhTZWNvbmRzKHBhcmFtLnZhbHVlW3hEaW1lbnNpb25dKX1cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgICAgIHRpdGxlID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZXh0ICs9IGBcbiAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJ3aGl0ZS1zcGFjZTogbm93cmFwO1wiPlxuICAgICAgICAgICAgICAgICAgICAke3BhcmFtLm1hcmtlcn1cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9XCJmb250LXNpemU6JHtmb250U2l6ZX1weDtjb2xvcjoke2ZvbnRDb2xvcn07Zm9udC13ZWlnaHQ6NDAwO21hcmdpbi1sZWZ0OjJweFwiPlxuICAgICAgICAgICAgICAgICAgICAgICR7VnVlLiRmaWx0ZXJzLnByZXR0eUNhc2UocGFyYW0uc2VyaWVzTmFtZSl9OlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPVwiZmxvYXQ6cmlnaHQ7bWFyZ2luLWxlZnQ6MjBweDtmb250LXNpemU6JHtmb250U2l6ZX1weDtjb2xvcjoke2ZvbnRDb2xvcn07Zm9udC13ZWlnaHQ6OTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgJHtwYXJhbS52YWx1ZVt5RGltZW5zaW9uXX0ke3lTdWZmaXh9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImNsZWFyOiBib3RoXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJjbGVhcjogYm90aFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB0ZXh0ICs9ICc8L2Rpdj4nXG4gICAgICAgICAgcmV0dXJuIHRleHRcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHhBeGlzOiB7XG4gICAgICAgIHR5cGU6ICd0aW1lJyxcbiAgICAgICAgYm91bmRhcnlHYXA6IGZhbHNlLFxuICAgICAgICBtaW46ICh2YWx1ZTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlLm1heCAtICg2MDAgKiAxMDAwKVxuICAgICAgICB9LFxuICAgICAgICAvLyBtaW46ICdkYXRhTWluJyxcbiAgICAgICAgbWF4OiAnZGF0YU1heCcsXG4gICAgICAgIGF4aXNMaW5lOiB7IHNob3c6IGZhbHNlIH0sXG4gICAgICAgIGF4aXNUaWNrOiB7IHNob3c6IGZhbHNlIH0sXG4gICAgICAgIGF4aXNMYWJlbDogeyBzaG93OiBmYWxzZSwgZm9ybWF0dGVyOiAne3ZhbHVlfSUnIH0sXG4gICAgICAgIHNwbGl0TGluZTogeyBzaG93OiB0cnVlLCBsaW5lU3R5bGUgfSxcbiAgICAgICAgYXhpc1BvaW50ZXI6IHsgbGluZVN0eWxlOiBwb2ludGVyU3R5bGUgfVxuICAgICAgfSxcbiAgICAgIHlBeGlzOiB7XG4gICAgICAgIHR5cGU6ICd2YWx1ZScsXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiAodmFsdWUubWF4IDw9IDEwMClcbiAgICAgICAgICAgID8gMTAwXG4gICAgICAgICAgICA6IHZhbHVlLm1heFxuICAgICAgICB9LFxuICAgICAgICBheGlzTGFiZWw6IHsgc2hvdzogZmFsc2UsIGZvcm1hdHRlcjogJ3t2YWx1ZX0lJyB9LFxuICAgICAgICBzcGxpdExpbmU6IHsgc2hvdzogdHJ1ZSwgbGluZVN0eWxlIH1cbiAgICAgIH1cbiAgICB9IGFzIEVDaGFydHNPcHRpb25cbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJiIGJhc2UgY2hhcnQgc2VyaWVzIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gYSB0eXBlXG4gICAqL1xuICBnZXRCYXNlU2VyaWVzOiAoKSA9PiAob3B0aW9uczogYW55KSA9PiB7XG4gICAgY29uc3QgbyA9IHtcbiAgICAgIHR5cGU6ICdsaW5lJyxcbiAgICAgIHNtb290aDogdHJ1ZSxcbiAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICBzaG93U3ltYm9sOiBmYWxzZSxcbiAgICAgIHN5bWJvbDogJ2VtcHR5Q2lyY2xlJyxcbiAgICAgIGFyZWFTdHlsZTogeyB0eXBlOiAnc29saWQnLCBvcGFjaXR5OiAwLjMgfSxcbiAgICAgIGxpbmVTdHlsZTogeyB0eXBlOiAnc29saWQnLCB3aWR0aDogMS41LCBvcGFjaXR5OiAxIH0sXG4gICAgICBlbXBoYXNpczoge1xuICAgICAgICBsaW5lU3R5bGU6IHsgd2lkdGg6IDEuNSB9XG4gICAgICB9LFxuICAgICAgLi4ub3B0aW9uc1xuICAgIH1cbiAgICByZXR1cm4gb1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sU0FBUztBQUNoQixPQUFPLGFBQWE7QUFJcEIsU0FBUyxlQUFlO0FBR2pCLGFBQU0sVUFBNkM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUl4RCxjQUFjLENBQUMsVUFBVTtBQUN2QixXQUFPLE1BQU07QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxvQkFBb0IsQ0FBQyxVQUFVO0FBQzdCLFdBQU8sTUFBTTtBQUFBLEVBQ2Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLG1CQUFtQixDQUFDLE9BQU9BLFVBQVMsV0FBVyxnQkFBZ0I7QUFDN0QsVUFBTSxTQUFTLFlBQVksa0JBQWtCO0FBQzdDLFdBQU8sT0FBTyxZQUFZLDBCQUN4QixPQUFPLFFBQVEsMEJBQ2YsUUFBUTtBQUFBLEVBQ1o7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLHFCQUFxQixDQUFDLE9BQU9BLFVBQVMsV0FBVyxnQkFBZ0IsQ0FBQyxnQkFBNkMsQ0FBQyxNQUFNO0FBRXBILFVBQU0sU0FBUyxVQUFVLE9BQU8sV0FBVyxNQUFNO0FBQ2pELFVBQU0sV0FBVyxRQUFRLFVBQVUsV0FBVztBQUU5QyxVQUFNLFlBQWEsU0FBVSwyQkFBMkI7QUFDeEQsVUFBTSxXQUFZLFdBQVksS0FBSztBQUVuQyxVQUFNLFlBQVk7QUFBQSxNQUNoQixPQUFRLFNBQVUsWUFBWTtBQUFBLE1BQzlCLFNBQVM7QUFBQSxJQUNYO0FBRUEsVUFBTSxlQUFlO0FBQUEsTUFDbkIsT0FBUSxTQUFVLFlBQVk7QUFBQSxNQUM5QixTQUFTO0FBQUEsSUFDWDtBQUVBLFVBQU0sT0FBTztBQUFBLE1BQ1gsTUFBTTtBQUFBLE1BQ04sYUFBYTtBQUFBLE1BQ2IsYUFBYyxTQUFVLDJCQUEyQjtBQUFBLElBQ3JEO0FBRUEsVUFBTSxVQUFVO0FBQUEsTUFDZCxpQkFBa0IsU0FBVSx3QkFBd0I7QUFBQSxNQUNwRCxhQUFjLFNBQVUscUJBQXFCO0FBQUEsTUFDN0MsV0FBVztBQUFBLFFBQ1QsT0FBTztBQUFBLFFBQ1A7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBUSxRQUFRLFVBQVUsTUFBTTtBQUN0QyxVQUFNLFFBQVE7QUFBQSxNQUNaLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBRUEsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQSxXQUFXO0FBQUEsUUFDVCxZQUFZLFlBQVksMkJBQTJCO0FBQUEsTUFDckQ7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLEdBQUc7QUFBQSxRQUNILE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxRQUNULFVBQVUsQ0FBQyxRQUFRLE1BQU07QUFBQSxRQUN6QixXQUFXLENBQUMsV0FBZ0I7QUFDMUIsY0FBSSxRQUFRO0FBQ1osY0FBSSxPQUFPO0FBQ1gsaUJBQ0csUUFBUSxDQUFDLFVBQWU7QUFDdkIsa0JBQU0sYUFBYSxNQUFNLGVBQWUsTUFBTSxPQUFPLENBQUM7QUFDdEQsa0JBQU0sYUFBYSxNQUFNLGVBQWUsTUFBTSxPQUFPLENBQUM7QUFDdEQsa0JBQU0sVUFBVSxjQUFjLFVBQVUsS0FBSztBQUM3QyxnQkFDRSxjQUNBLGNBQ0EsTUFBTSxZQUNOO0FBQ0Esa0JBQUksQ0FBQyxPQUFPO0FBQ1Ysd0JBQVE7QUFBQSwyQ0FDaUIsUUFBUSxZQUFZLFNBQVM7QUFBQSxzQkFDbEQsSUFBSSxTQUFTLHNCQUFzQixNQUFNLE1BQU0sVUFBVSxDQUFDLENBQUM7QUFBQTtBQUFBO0FBRy9ELHdCQUFRO0FBQUEsY0FDVjtBQUNBLHNCQUFRO0FBQUE7QUFBQSxzQkFFRixNQUFNLE1BQU07QUFBQSw2Q0FDVyxRQUFRLFlBQVksU0FBUztBQUFBLHdCQUNsRCxJQUFJLFNBQVMsV0FBVyxNQUFNLFVBQVUsQ0FBQztBQUFBO0FBQUEsMEVBRVMsUUFBUSxZQUFZLFNBQVM7QUFBQSx3QkFDL0UsTUFBTSxNQUFNLFVBQVUsQ0FBQyxHQUFHLE9BQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNM0M7QUFBQSxVQUNGLENBQUM7QUFDSCxrQkFBUTtBQUNSLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLE1BQU07QUFBQSxRQUNOLGFBQWE7QUFBQSxRQUNiLEtBQUssQ0FBQyxVQUFlO0FBQ25CLGlCQUFPLE1BQU0sTUFBTyxNQUFNO0FBQUEsUUFDNUI7QUFBQTtBQUFBLFFBRUEsS0FBSztBQUFBLFFBQ0wsVUFBVSxFQUFFLE1BQU0sTUFBTTtBQUFBLFFBQ3hCLFVBQVUsRUFBRSxNQUFNLE1BQU07QUFBQSxRQUN4QixXQUFXLEVBQUUsTUFBTSxPQUFPLFdBQVcsV0FBVztBQUFBLFFBQ2hELFdBQVcsRUFBRSxNQUFNLE1BQU0sVUFBVTtBQUFBLFFBQ25DLGFBQWEsRUFBRSxXQUFXLGFBQWE7QUFBQSxNQUN6QztBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsTUFBTTtBQUFBLFFBQ04sS0FBSztBQUFBLFFBQ0wsS0FBSyxDQUFDLFVBQWU7QUFDbkIsaUJBQVEsTUFBTSxPQUFPLE1BQ2pCLE1BQ0EsTUFBTTtBQUFBLFFBQ1o7QUFBQSxRQUNBLFdBQVcsRUFBRSxNQUFNLE9BQU8sV0FBVyxXQUFXO0FBQUEsUUFDaEQsV0FBVyxFQUFFLE1BQU0sTUFBTSxVQUFVO0FBQUEsTUFDckM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsZUFBZSxNQUFNLENBQUMsWUFBaUI7QUFDckMsVUFBTSxJQUFJO0FBQUEsTUFDUixNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxZQUFZO0FBQUEsTUFDWixRQUFRO0FBQUEsTUFDUixXQUFXLEVBQUUsTUFBTSxTQUFTLFNBQVMsSUFBSTtBQUFBLE1BQ3pDLFdBQVcsRUFBRSxNQUFNLFNBQVMsT0FBTyxLQUFLLFNBQVMsRUFBRTtBQUFBLE1BQ25ELFVBQVU7QUFBQSxRQUNSLFdBQVcsRUFBRSxPQUFPLElBQUk7QUFBQSxNQUMxQjtBQUFBLE1BQ0EsR0FBRztBQUFBLElBQ0w7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsIm5hbWVzIjpbImdldHRlcnMiXX0=