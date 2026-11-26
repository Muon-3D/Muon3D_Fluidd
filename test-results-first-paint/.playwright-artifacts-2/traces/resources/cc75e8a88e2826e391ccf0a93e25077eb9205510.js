import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState as getDefaultState } from "/src/store/layout/state.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, getDefaultState());
  },
  /**
   * Inits the layout from moonraker.
   * This merge strategy should account for supported components
   * being the default state, and newly added components users may not
   * have in their moonraker db.
   */
  setInitLayout(state, payload) {
    if (payload && Object.keys(payload).length > 0) {
      const defaultState = getDefaultState();
      for (const [layoutKey, defaultLayout] of Object.entries(defaultState.layouts)) {
        if (!payload.layouts[layoutKey]) {
          payload.layouts[layoutKey] = defaultLayout;
        }
      }
      const migratableLayoutKeys = ["dashboard"];
      for (const [layoutKey, currentLayout] of Object.entries(payload.layouts)) {
        for (const [containerKey, components] of Object.entries(currentLayout)) {
          currentLayout[containerKey] = components.filter((card) => card != null);
        }
        const migratableLayoutKey = migratableLayoutKeys.find((key) => layoutKey.startsWith(key));
        if (migratableLayoutKey) {
          const defaultLayout = defaultState.layouts[migratableLayoutKey];
          const defaultComponentIds = Object.values(defaultLayout).flat().map((card) => card.id);
          const currentComponentIds = Object.values(currentLayout).flat().map((card) => card.id);
          for (const [containerKey, defaultContainerComponents] of Object.entries(defaultLayout)) {
            const currentContainerComponents = currentLayout[containerKey] || [];
            currentLayout[containerKey] = [
              ...currentContainerComponents.filter((component) => defaultComponentIds.includes(component.id)),
              ...defaultContainerComponents.filter((component) => !currentComponentIds.includes(component.id))
            ];
          }
        }
        if (layoutKey.startsWith("diagnostics")) {
          const diagnostics = currentLayout;
          for (const diagnosticsCardConfigs of Object.values(diagnostics)) {
            for (const diagnosticsCardConfig of diagnosticsCardConfigs) {
              for (const axis of diagnosticsCardConfig.axes) {
                for (const metric of axis.metrics) {
                  metric.style.fillColor = metric.style.fillColor ?? null;
                }
              }
            }
          }
        }
      }
      Object.assign(state, payload);
    }
  },
  setLayoutChange(state, payload) {
    Vue.set(state.layouts, payload.name, payload.value);
  },
  /**
   * Updates a layout config item.
   */
  setUpdateConfig(state, payload) {
    Vue.set(state.layouts[payload.name][payload.container], payload.i, payload.value);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSBhcyBnZXREZWZhdWx0U3RhdGUgfSBmcm9tICcuL3N0YXRlJ1xuaW1wb3J0IHR5cGUgeyBMYXlvdXRDb25maWcsIExheW91dFN0YXRlLCBMYXlvdXRzIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgRGlhZ25vc3RpY3NDYXJkQ29udGFpbmVyIH0gZnJvbSAnLi4vZGlhZ25vc3RpY3MvdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBtdXRhdGlvbnM6IE11dGF0aW9uVHJlZTxMYXlvdXRTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBzdGF0ZVxuICAgKi9cbiAgc2V0UmVzZXQgKHN0YXRlKSB7XG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwgZ2V0RGVmYXVsdFN0YXRlKCkpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEluaXRzIHRoZSBsYXlvdXQgZnJvbSBtb29ucmFrZXIuXG4gICAqIFRoaXMgbWVyZ2Ugc3RyYXRlZ3kgc2hvdWxkIGFjY291bnQgZm9yIHN1cHBvcnRlZCBjb21wb25lbnRzXG4gICAqIGJlaW5nIHRoZSBkZWZhdWx0IHN0YXRlLCBhbmQgbmV3bHkgYWRkZWQgY29tcG9uZW50cyB1c2VycyBtYXkgbm90XG4gICAqIGhhdmUgaW4gdGhlaXIgbW9vbnJha2VyIGRiLlxuICAgKi9cbiAgc2V0SW5pdExheW91dCAoc3RhdGUsIHBheWxvYWQ6IExheW91dFN0YXRlKSB7XG4gICAgaWYgKHBheWxvYWQgJiYgT2JqZWN0LmtleXMocGF5bG9hZCkubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZGVmYXVsdFN0YXRlID0gZ2V0RGVmYXVsdFN0YXRlKClcblxuICAgICAgLy8gYWRkIG5ldyBsYXlvdXRzXG4gICAgICBmb3IgKGNvbnN0IFtsYXlvdXRLZXksIGRlZmF1bHRMYXlvdXRdIG9mIE9iamVjdC5lbnRyaWVzKGRlZmF1bHRTdGF0ZS5sYXlvdXRzKSkge1xuICAgICAgICBpZiAoIXBheWxvYWQubGF5b3V0c1tsYXlvdXRLZXldKSB7XG4gICAgICAgICAgcGF5bG9hZC5sYXlvdXRzW2xheW91dEtleV0gPSBkZWZhdWx0TGF5b3V0XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gbWlncmF0ZSBleGlzdGluZyBsYXlvdXRzXG4gICAgICBjb25zdCBtaWdyYXRhYmxlTGF5b3V0S2V5cyA9IFsnZGFzaGJvYXJkJ11cblxuICAgICAgZm9yIChjb25zdCBbbGF5b3V0S2V5LCBjdXJyZW50TGF5b3V0XSBvZiBPYmplY3QuZW50cmllcyhwYXlsb2FkLmxheW91dHMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2NvbnRhaW5lcktleSwgY29tcG9uZW50c10gb2YgT2JqZWN0LmVudHJpZXMoY3VycmVudExheW91dCkpIHtcbiAgICAgICAgICBjdXJyZW50TGF5b3V0W2NvbnRhaW5lcktleV0gPSBjb21wb25lbnRzXG4gICAgICAgICAgICAuZmlsdGVyKGNhcmQgPT4gY2FyZCAhPSBudWxsKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWlncmF0YWJsZUxheW91dEtleSA9IG1pZ3JhdGFibGVMYXlvdXRLZXlzLmZpbmQoa2V5ID0+IGxheW91dEtleS5zdGFydHNXaXRoKGtleSkpXG5cbiAgICAgICAgaWYgKG1pZ3JhdGFibGVMYXlvdXRLZXkpIHtcbiAgICAgICAgICBjb25zdCBkZWZhdWx0TGF5b3V0ID0gZGVmYXVsdFN0YXRlLmxheW91dHNbbWlncmF0YWJsZUxheW91dEtleV1cbiAgICAgICAgICBjb25zdCBkZWZhdWx0Q29tcG9uZW50SWRzID0gT2JqZWN0LnZhbHVlcyhkZWZhdWx0TGF5b3V0KS5mbGF0KCkubWFwKGNhcmQgPT4gY2FyZC5pZClcbiAgICAgICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SWRzID0gT2JqZWN0LnZhbHVlcyhjdXJyZW50TGF5b3V0KS5mbGF0KCkubWFwKGNhcmQgPT4gY2FyZC5pZClcblxuICAgICAgICAgIGZvciAoY29uc3QgW2NvbnRhaW5lcktleSwgZGVmYXVsdENvbnRhaW5lckNvbXBvbmVudHNdIG9mIE9iamVjdC5lbnRyaWVzKGRlZmF1bHRMYXlvdXQpKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q29udGFpbmVyQ29tcG9uZW50cyA9IGN1cnJlbnRMYXlvdXRbY29udGFpbmVyS2V5XSB8fCBbXVxuXG4gICAgICAgICAgICBjdXJyZW50TGF5b3V0W2NvbnRhaW5lcktleV0gPSBbXG4gICAgICAgICAgICAgIC4uLmN1cnJlbnRDb250YWluZXJDb21wb25lbnRzLmZpbHRlcihjb21wb25lbnQgPT4gZGVmYXVsdENvbXBvbmVudElkcy5pbmNsdWRlcyhjb21wb25lbnQuaWQpKSxcbiAgICAgICAgICAgICAgLi4uZGVmYXVsdENvbnRhaW5lckNvbXBvbmVudHMuZmlsdGVyKGNvbXBvbmVudCA9PiAhY3VycmVudENvbXBvbmVudElkcy5pbmNsdWRlcyhjb21wb25lbnQuaWQpKVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRpYWdub3N0aWNzIHNwZWNpZmljIGxheW91dCB1cGRhdGVzXG4gICAgICAgIGlmIChsYXlvdXRLZXkuc3RhcnRzV2l0aCgnZGlhZ25vc3RpY3MnKSkge1xuICAgICAgICAgIGNvbnN0IGRpYWdub3N0aWNzID0gY3VycmVudExheW91dCBhcyBEaWFnbm9zdGljc0NhcmRDb250YWluZXJcblxuICAgICAgICAgIGZvciAoY29uc3QgZGlhZ25vc3RpY3NDYXJkQ29uZmlncyBvZiBPYmplY3QudmFsdWVzKGRpYWdub3N0aWNzKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBkaWFnbm9zdGljc0NhcmRDb25maWcgb2YgZGlhZ25vc3RpY3NDYXJkQ29uZmlncykge1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGF4aXMgb2YgZGlhZ25vc3RpY3NDYXJkQ29uZmlnLmF4ZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG1ldHJpYyBvZiBheGlzLm1ldHJpY3MpIHtcbiAgICAgICAgICAgICAgICAgIG1ldHJpYy5zdHlsZS5maWxsQ29sb3IgPSBtZXRyaWMuc3R5bGUuZmlsbENvbG9yID8/IG51bGxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwgcGF5bG9hZClcbiAgICB9XG4gIH0sXG5cbiAgc2V0TGF5b3V0Q2hhbmdlIChzdGF0ZSwgcGF5bG9hZDogeyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBMYXlvdXRzIH0pIHtcbiAgICBWdWUuc2V0KHN0YXRlLmxheW91dHMsIHBheWxvYWQubmFtZSwgcGF5bG9hZC52YWx1ZSlcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlcyBhIGxheW91dCBjb25maWcgaXRlbS5cbiAgICovXG4gIHNldFVwZGF0ZUNvbmZpZyAoc3RhdGUsIHBheWxvYWQ6IHsgbmFtZTogc3RyaW5nOyBjb250YWluZXI6IHN0cmluZzsgaTogbnVtYmVyOyB2YWx1ZTogTGF5b3V0Q29uZmlnIH0pIHtcbiAgICBWdWUuc2V0KHN0YXRlLmxheW91dHNbcGF5bG9hZC5uYW1lXVtwYXlsb2FkLmNvbnRhaW5lcl0sIHBheWxvYWQuaSwgcGF5bG9hZC52YWx1ZSlcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFFaEIsU0FBUyxnQkFBZ0IsdUJBQXVCO0FBSXpDLGFBQU0sWUFBdUM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUlsRCxTQUFVLE9BQU87QUFDZixXQUFPLE9BQU8sT0FBTyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ3hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxjQUFlLE9BQU8sU0FBc0I7QUFDMUMsUUFBSSxXQUFXLE9BQU8sS0FBSyxPQUFPLEVBQUUsU0FBUyxHQUFHO0FBQzlDLFlBQU0sZUFBZSxnQkFBZ0I7QUFHckMsaUJBQVcsQ0FBQyxXQUFXLGFBQWEsS0FBSyxPQUFPLFFBQVEsYUFBYSxPQUFPLEdBQUc7QUFDN0UsWUFBSSxDQUFDLFFBQVEsUUFBUSxTQUFTLEdBQUc7QUFDL0Isa0JBQVEsUUFBUSxTQUFTLElBQUk7QUFBQSxRQUMvQjtBQUFBLE1BQ0Y7QUFHQSxZQUFNLHVCQUF1QixDQUFDLFdBQVc7QUFFekMsaUJBQVcsQ0FBQyxXQUFXLGFBQWEsS0FBSyxPQUFPLFFBQVEsUUFBUSxPQUFPLEdBQUc7QUFDeEUsbUJBQVcsQ0FBQyxjQUFjLFVBQVUsS0FBSyxPQUFPLFFBQVEsYUFBYSxHQUFHO0FBQ3RFLHdCQUFjLFlBQVksSUFBSSxXQUMzQixPQUFPLFVBQVEsUUFBUSxJQUFJO0FBQUEsUUFDaEM7QUFFQSxjQUFNLHNCQUFzQixxQkFBcUIsS0FBSyxTQUFPLFVBQVUsV0FBVyxHQUFHLENBQUM7QUFFdEYsWUFBSSxxQkFBcUI7QUFDdkIsZ0JBQU0sZ0JBQWdCLGFBQWEsUUFBUSxtQkFBbUI7QUFDOUQsZ0JBQU0sc0JBQXNCLE9BQU8sT0FBTyxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksVUFBUSxLQUFLLEVBQUU7QUFDbkYsZ0JBQU0sc0JBQXNCLE9BQU8sT0FBTyxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksVUFBUSxLQUFLLEVBQUU7QUFFbkYscUJBQVcsQ0FBQyxjQUFjLDBCQUEwQixLQUFLLE9BQU8sUUFBUSxhQUFhLEdBQUc7QUFDdEYsa0JBQU0sNkJBQTZCLGNBQWMsWUFBWSxLQUFLLENBQUM7QUFFbkUsMEJBQWMsWUFBWSxJQUFJO0FBQUEsY0FDNUIsR0FBRywyQkFBMkIsT0FBTyxlQUFhLG9CQUFvQixTQUFTLFVBQVUsRUFBRSxDQUFDO0FBQUEsY0FDNUYsR0FBRywyQkFBMkIsT0FBTyxlQUFhLENBQUMsb0JBQW9CLFNBQVMsVUFBVSxFQUFFLENBQUM7QUFBQSxZQUMvRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBR0EsWUFBSSxVQUFVLFdBQVcsYUFBYSxHQUFHO0FBQ3ZDLGdCQUFNLGNBQWM7QUFFcEIscUJBQVcsMEJBQTBCLE9BQU8sT0FBTyxXQUFXLEdBQUc7QUFDL0QsdUJBQVcseUJBQXlCLHdCQUF3QjtBQUMxRCx5QkFBVyxRQUFRLHNCQUFzQixNQUFNO0FBQzdDLDJCQUFXLFVBQVUsS0FBSyxTQUFTO0FBQ2pDLHlCQUFPLE1BQU0sWUFBWSxPQUFPLE1BQU0sYUFBYTtBQUFBLGdCQUNyRDtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBRUEsYUFBTyxPQUFPLE9BQU8sT0FBTztBQUFBLElBQzlCO0FBQUEsRUFDRjtBQUFBLEVBRUEsZ0JBQWlCLE9BQU8sU0FBMkM7QUFDakUsUUFBSSxJQUFJLE1BQU0sU0FBUyxRQUFRLE1BQU0sUUFBUSxLQUFLO0FBQUEsRUFDcEQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGdCQUFpQixPQUFPLFNBQThFO0FBQ3BHLFFBQUksSUFBSSxNQUFNLFFBQVEsUUFBUSxJQUFJLEVBQUUsUUFBUSxTQUFTLEdBQUcsUUFBUSxHQUFHLFFBQVEsS0FBSztBQUFBLEVBQ2xGO0FBQ0Y7IiwibmFtZXMiOltdfQ==