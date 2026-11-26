export const MACRO_DEFAULTS = {
  alias: "",
  visible: true,
  disabledWhilePrinting: false,
  color: "",
  categoryId: "0",
  order: void 0
};
export const getters = {
  /**
   * Returns all available macros, transformed.
   * Should include the macro's config.
   */
  getMacros: (state, getters2, rootState) => {
    const macros = Object.keys(rootState.printer.printer).filter((key) => /^gcode_macro (?!_)/.test(key)).map((key) => {
      const lowerCaseKey = key.toLocaleLowerCase();
      const name = lowerCaseKey.split(" ", 2)[1];
      const config = rootState.printer.printer.configfile.settings[lowerCaseKey];
      const stored = state.stored.find((macro2) => macro2.name === name);
      const variables = rootState.printer.printer[key];
      const macro = {
        ...MACRO_DEFAULTS,
        name,
        ...stored,
        variables,
        config
      };
      if (stored?.categoryId) {
        const category = state.categories.find((category2) => category2.id === stored.categoryId);
        if (category) {
          macro.category = category;
        } else {
          macro.categoryId = "0";
        }
      }
      return macro;
    });
    return macros;
  },
  getMacroByName: (state, getters2) => (...names) => {
    const macros = getters2.getMacros;
    for (const name of names) {
      const macro = macros.find((macro2) => macro2.name === name);
      if (macro) {
        return macro;
      }
    }
  },
  // Gets visible macros, transformed. Should include the macro's config.
  // Is only used on the dashboard. Grouped by category.
  getVisibleMacros: (state, getters2) => {
    const defaultCategory = { id: "0", name: null };
    const categories = [...state.categories, defaultCategory];
    return categories.map(({ id, name }) => ({
      id,
      name,
      macros: getters2.getMacrosByCategory(id).filter((macro) => macro.visible)
    })).filter((category) => category.macros.length > 0).sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
  },
  /**
   * Returns all macros, transformed - given a category.
   * If no category is passed, return all those that are uncategorized.
   */
  getMacrosByCategory: (state, getters2) => (categoryId) => {
    const id = !categoryId ? "0" : categoryId;
    const macros = getters2.getMacros;
    return macros.filter((macro) => macro.categoryId === id).sort((a, b) => {
      if (a.order !== void 0 && b.order !== void 0 && a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });
  },
  /**
   * Returns a list of configured categories, and the count of macros inside of
   * them.
   */
  getCategories: (state, getters2) => {
    const categories = state.categories.map((category) => {
      const { id, name, order } = category;
      const macros = getters2.getMacrosByCategory(id);
      const count = macros.length;
      const visible = macros.filter((macro) => macro.visible).length;
      return {
        id,
        name,
        order,
        visible,
        count
      };
    }).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name));
    return categories;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgTWFjcm8sIE1hY3Jvc1N0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBNQUNST19ERUZBVUxUUyA9IHtcbiAgYWxpYXM6ICcnLFxuICB2aXNpYmxlOiB0cnVlLFxuICBkaXNhYmxlZFdoaWxlUHJpbnRpbmc6IGZhbHNlLFxuICBjb2xvcjogJycsXG4gIGNhdGVnb3J5SWQ6ICcwJyxcbiAgb3JkZXI6IHVuZGVmaW5lZFxufVxuXG5leHBvcnQgY29uc3QgZ2V0dGVyczogR2V0dGVyVHJlZTxNYWNyb3NTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgYXZhaWxhYmxlIG1hY3JvcywgdHJhbnNmb3JtZWQuXG4gICAqIFNob3VsZCBpbmNsdWRlIHRoZSBtYWNybydzIGNvbmZpZy5cbiAgICovXG4gIGdldE1hY3JvczogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUpID0+IHtcbiAgICBjb25zdCBtYWNyb3MgPSBPYmplY3Qua2V5cyhyb290U3RhdGUucHJpbnRlci5wcmludGVyKVxuICAgICAgLmZpbHRlcihrZXkgPT4gL15nY29kZV9tYWNybyAoPyFfKS8udGVzdChrZXkpKVxuICAgICAgLm1hcChrZXkgPT4ge1xuICAgICAgICBjb25zdCBsb3dlckNhc2VLZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKVxuICAgICAgICBjb25zdCBuYW1lID0gbG93ZXJDYXNlS2V5LnNwbGl0KCcgJywgMilbMV1cbiAgICAgICAgY29uc3QgY29uZmlnID0gcm9vdFN0YXRlLnByaW50ZXIucHJpbnRlci5jb25maWdmaWxlLnNldHRpbmdzW2xvd2VyQ2FzZUtleV1cbiAgICAgICAgY29uc3Qgc3RvcmVkID0gc3RhdGUuc3RvcmVkLmZpbmQobWFjcm8gPT4gbWFjcm8ubmFtZSA9PT0gbmFtZSlcbiAgICAgICAgY29uc3QgdmFyaWFibGVzID0gcm9vdFN0YXRlLnByaW50ZXIucHJpbnRlcltrZXldXG5cbiAgICAgICAgY29uc3QgbWFjcm86IE1hY3JvID0ge1xuICAgICAgICAgIC4uLk1BQ1JPX0RFRkFVTFRTLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgLi4uc3RvcmVkLFxuICAgICAgICAgIHZhcmlhYmxlcyxcbiAgICAgICAgICBjb25maWdcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBjYXRlZ29yaWVzLCBpbmNsIHRob3NlIHRoYXQgbm8gbG9uZ2VyIGV4aXN0LlxuICAgICAgICBpZiAoc3RvcmVkPy5jYXRlZ29yeUlkKSB7XG4gICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBzdGF0ZS5jYXRlZ29yaWVzLmZpbmQoY2F0ZWdvcnkgPT4gY2F0ZWdvcnkuaWQgPT09IHN0b3JlZC5jYXRlZ29yeUlkKVxuXG4gICAgICAgICAgaWYgKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICBtYWNyby5jYXRlZ29yeSA9IGNhdGVnb3J5XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1hY3JvLmNhdGVnb3J5SWQgPSAnMCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWFjcm9cbiAgICAgIH0pXG5cbiAgICByZXR1cm4gbWFjcm9zXG4gIH0sXG5cbiAgZ2V0TWFjcm9CeU5hbWU6IChzdGF0ZSwgZ2V0dGVycykgPT4gKC4uLm5hbWVzOiBzdHJpbmdbXSkgPT4ge1xuICAgIGNvbnN0IG1hY3JvcyA9IGdldHRlcnMuZ2V0TWFjcm9zIGFzIE1hY3JvW11cblxuICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykge1xuICAgICAgY29uc3QgbWFjcm8gPSBtYWNyb3MuZmluZChtYWNybyA9PiBtYWNyby5uYW1lID09PSBuYW1lKVxuXG4gICAgICBpZiAobWFjcm8pIHtcbiAgICAgICAgcmV0dXJuIG1hY3JvXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIEdldHMgdmlzaWJsZSBtYWNyb3MsIHRyYW5zZm9ybWVkLiBTaG91bGQgaW5jbHVkZSB0aGUgbWFjcm8ncyBjb25maWcuXG4gIC8vIElzIG9ubHkgdXNlZCBvbiB0aGUgZGFzaGJvYXJkLiBHcm91cGVkIGJ5IGNhdGVnb3J5LlxuICBnZXRWaXNpYmxlTWFjcm9zOiAoc3RhdGUsIGdldHRlcnMpID0+IHtcbiAgICBjb25zdCBkZWZhdWx0Q2F0ZWdvcnkgPSB7IGlkOiAnMCcsIG5hbWU6IG51bGwgfVxuICAgIGNvbnN0IGNhdGVnb3JpZXMgPSBbLi4uc3RhdGUuY2F0ZWdvcmllcywgZGVmYXVsdENhdGVnb3J5XVxuXG4gICAgcmV0dXJuIGNhdGVnb3JpZXNcbiAgICAgIC5tYXAoKHsgaWQsIG5hbWUgfSkgPT4gKHtcbiAgICAgICAgaWQsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIG1hY3JvczogZ2V0dGVycy5nZXRNYWNyb3NCeUNhdGVnb3J5KGlkKS5maWx0ZXIoKG1hY3JvOiBNYWNybykgPT4gbWFjcm8udmlzaWJsZSkgYXMgTWFjcm9bXVxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKGNhdGVnb3J5ID0+IGNhdGVnb3J5Lm1hY3Jvcy5sZW5ndGggPiAwKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgaWYgKCFhLm5hbWUpIHJldHVybiAxXG4gICAgICAgIGlmICghYi5uYW1lKSByZXR1cm4gLTFcblxuICAgICAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKVxuICAgICAgfSlcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgbWFjcm9zLCB0cmFuc2Zvcm1lZCAtIGdpdmVuIGEgY2F0ZWdvcnkuXG4gICAqIElmIG5vIGNhdGVnb3J5IGlzIHBhc3NlZCwgcmV0dXJuIGFsbCB0aG9zZSB0aGF0IGFyZSB1bmNhdGVnb3JpemVkLlxuICAgKi9cbiAgZ2V0TWFjcm9zQnlDYXRlZ29yeTogKHN0YXRlLCBnZXR0ZXJzKSA9PiAoY2F0ZWdvcnlJZD86IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGlkID0gIWNhdGVnb3J5SWRcbiAgICAgID8gJzAnXG4gICAgICA6IGNhdGVnb3J5SWRcblxuICAgIGNvbnN0IG1hY3JvcyA9IGdldHRlcnMuZ2V0TWFjcm9zIGFzIE1hY3JvW11cblxuICAgIHJldHVybiBtYWNyb3NcbiAgICAgIC5maWx0ZXIobWFjcm8gPT4gbWFjcm8uY2F0ZWdvcnlJZCA9PT0gaWQpXG4gICAgICAuc29ydCgoYTogTWFjcm8sIGI6IE1hY3JvKSA9PiB7XG4gICAgICAgIC8vIFNvcnRzIHByZWZlcnJlbnRpYWxseSBieSBvcmRlciwgdGhlbiBieSBuYW1lXG4gICAgICAgIC8vIFRoaXMgb2ZmZXJzIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCBtYWNyb3MgdGhhdCBoYXZlIG5vIG9yZGVyXG4gICAgICAgIGlmICgoYS5vcmRlciAhPT0gdW5kZWZpbmVkICYmIGIub3JkZXIgIT09IHVuZGVmaW5lZCkgJiYgYS5vcmRlciAhPT0gYi5vcmRlcikge1xuICAgICAgICAgIHJldHVybiBhLm9yZGVyIC0gYi5vcmRlclxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSlcbiAgICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBsaXN0IG9mIGNvbmZpZ3VyZWQgY2F0ZWdvcmllcywgYW5kIHRoZSBjb3VudCBvZiBtYWNyb3MgaW5zaWRlIG9mXG4gICAqIHRoZW0uXG4gICAqL1xuICBnZXRDYXRlZ29yaWVzOiAoc3RhdGUsIGdldHRlcnMpID0+IHtcbiAgICBjb25zdCBjYXRlZ29yaWVzID0gc3RhdGUuY2F0ZWdvcmllc1xuICAgICAgLm1hcChjYXRlZ29yeSA9PiB7XG4gICAgICAgIGNvbnN0IHsgaWQsIG5hbWUsIG9yZGVyIH0gPSBjYXRlZ29yeVxuXG4gICAgICAgIGNvbnN0IG1hY3JvcyA9IGdldHRlcnMuZ2V0TWFjcm9zQnlDYXRlZ29yeShpZCkgYXMgTWFjcm9bXVxuICAgICAgICBjb25zdCBjb3VudCA9IG1hY3Jvcy5sZW5ndGhcbiAgICAgICAgY29uc3QgdmlzaWJsZSA9IG1hY3Jvc1xuICAgICAgICAgIC5maWx0ZXIobWFjcm8gPT4gbWFjcm8udmlzaWJsZSlcbiAgICAgICAgICAubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIG9yZGVyLFxuICAgICAgICAgIHZpc2libGUsXG4gICAgICAgICAgY291bnRcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYS5vcmRlciA/PyBJbmZpbml0eSkgLSAoYi5vcmRlciA/PyBJbmZpbml0eSkgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSlcblxuICAgIHJldHVybiBjYXRlZ29yaWVzXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBSU8sYUFBTSxpQkFBaUI7QUFBQSxFQUM1QixPQUFPO0FBQUEsRUFDUCxTQUFTO0FBQUEsRUFDVCx1QkFBdUI7QUFBQSxFQUN2QixPQUFPO0FBQUEsRUFDUCxZQUFZO0FBQUEsRUFDWixPQUFPO0FBQ1Q7QUFFTyxhQUFNLFVBQThDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU16RCxXQUFXLENBQUMsT0FBT0EsVUFBUyxjQUFjO0FBQ3hDLFVBQU0sU0FBUyxPQUFPLEtBQUssVUFBVSxRQUFRLE9BQU8sRUFDakQsT0FBTyxTQUFPLHFCQUFxQixLQUFLLEdBQUcsQ0FBQyxFQUM1QyxJQUFJLFNBQU87QUFDVixZQUFNLGVBQWUsSUFBSSxrQkFBa0I7QUFDM0MsWUFBTSxPQUFPLGFBQWEsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO0FBQ3pDLFlBQU0sU0FBUyxVQUFVLFFBQVEsUUFBUSxXQUFXLFNBQVMsWUFBWTtBQUN6RSxZQUFNLFNBQVMsTUFBTSxPQUFPLEtB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