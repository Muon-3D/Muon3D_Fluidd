export const getters = {
  /**
   * Determine if we have a specific wait, or list of waits active or not.
   */
  hasWait: (state) => (wait) => {
    if (Array.isArray(wait) && wait.length) {
      let waits = wait;
      waits = waits.filter((val) => state.waits.includes(val));
      return waits.length > 0;
    } else {
      wait = wait;
      return state.waits.includes(wait);
    }
  },
  /**
   * Determine if we have any waits.
   */
  hasWaits: (state) => {
    return state.waits.length > 0;
  },
  /**
   * Determine if we have any waits prefixed with...
   */
  hasWaitsBy: (state) => (prefix) => {
    const waits = state.waits.filter((wait) => wait.startsWith(prefix));
    return waits.length > 0;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgV2FpdFN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBnZXR0ZXJzOiBHZXR0ZXJUcmVlPFdhaXRTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB3ZSBoYXZlIGEgc3BlY2lmaWMgd2FpdCwgb3IgbGlzdCBvZiB3YWl0cyBhY3RpdmUgb3Igbm90LlxuICAgKi9cbiAgaGFzV2FpdDogKHN0YXRlKSA9PiAod2FpdDogc3RyaW5nIHwgc3RyaW5nW10pOiBib29sZWFuID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh3YWl0KSAmJiB3YWl0Lmxlbmd0aCkge1xuICAgICAgbGV0IHdhaXRzID0gd2FpdCBhcyBzdHJpbmdbXVxuICAgICAgd2FpdHMgPSB3YWl0cy5maWx0ZXIodmFsID0+IHN0YXRlLndhaXRzLmluY2x1ZGVzKHZhbCkpXG4gICAgICByZXR1cm4gKHdhaXRzLmxlbmd0aCA+IDApXG4gICAgfSBlbHNlIHtcbiAgICAgIHdhaXQgPSB3YWl0IGFzIHN0cmluZ1xuICAgICAgcmV0dXJuIHN0YXRlLndhaXRzLmluY2x1ZGVzKHdhaXQpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgd2UgaGF2ZSBhbnkgd2FpdHMuXG4gICAqL1xuICBoYXNXYWl0czogKHN0YXRlKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLndhaXRzLmxlbmd0aCA+IDBcbiAgfSxcblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHdlIGhhdmUgYW55IHdhaXRzIHByZWZpeGVkIHdpdGguLi5cbiAgICovXG4gIGhhc1dhaXRzQnk6IChzdGF0ZSkgPT4gKHByZWZpeDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3Qgd2FpdHMgPSBzdGF0ZS53YWl0cy5maWx0ZXIod2FpdCA9PiB3YWl0LnN0YXJ0c1dpdGgocHJlZml4KSlcbiAgICByZXR1cm4gd2FpdHMubGVuZ3RoID4gMFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUlPLGFBQU0sVUFBNEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUl2RCxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQXFDO0FBQ3hELFFBQUksTUFBTSxRQUFRLElBQUksS0FBSyxLQUFLLFFBQVE7QUFDdEMsVUFBSSxRQUFRO0FBQ1osY0FBUSxNQUFNLE9BQU8sU0FBTyxNQUFNLE1BQU0sU0FBUyxHQUFHLENBQUM7QUFDckQsYUFBUSxNQUFNLFNBQVM7QUFBQSxJQUN6QixPQUFPO0FBQ0wsYUFBTztBQUNQLGFBQU8sTUFBTSxNQUFNLFNBQVMsSUFBSTtBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsVUFBVSxDQUFDLFVBQVU7QUFDbkIsV0FBTyxNQUFNLE1BQU0sU0FBUztBQUFBLEVBQzlCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxZQUFZLENBQUMsVUFBVSxDQUFDLFdBQW1CO0FBQ3pDLFVBQU0sUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFRLEtBQUssV0FBVyxNQUFNLENBQUM7QUFDaEUsV0FBTyxNQUFNLFNBQVM7QUFBQSxFQUN4QjtBQUNGOyIsIm5hbWVzIjpbXX0=