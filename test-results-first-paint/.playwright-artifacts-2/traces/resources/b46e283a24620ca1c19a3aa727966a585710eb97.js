import _Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import VueRouter from "/.vite-e2e/4291/deps/vue-router.js?v=9b9fafc7";
import { camelCase, startCase, capitalize, isFinite, upperFirst } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import { TinyColor } from "/.vite-e2e/4291/deps/@ctrl_tinycolor.js?v=9b9fafc7";
import { DateFormats, Globals, TimeFormats, Waits } from "/src/globals.ts";
import i18n from "/src/plugins/i18n.ts";
import store from "/src/store/index.ts";
import versionStringCompare from "/src/util/version-string-compare.ts";
const getNestedValue = (obj, path, fallback) => {
  const last = path.length - 1;
  if (last < 0) return obj === void 0 ? fallback : obj;
  for (let i = 0; i < last; i++) {
    if (obj == null) {
      return fallback;
    }
    obj = obj[path[i]];
  }
  if (obj == null) return fallback;
  return obj[path[last]] === void 0 ? fallback : obj[path[last]];
};
const getObjectValueByPath = (obj, path, fallback) => {
  if (obj == null || !path || typeof path !== "string") return fallback;
  if (obj[path] !== void 0) return obj[path];
  path = path.replace(/\[(\w+)\]/g, ".$1");
  path = path.replace(/^\./, "");
  return getNestedValue(obj, path.split("."), fallback);
};
export const Filters = {
  /**
   * Formats a time to 00h 00m 00s
   * Expects to be passed seconds.
   */
  formatCounterSeconds: (seconds) => {
    seconds = +seconds;
    if (isNaN(seconds) || !isFinite(seconds)) seconds = 0;
    let isNeg = false;
    if (seconds < 0) {
      seconds = Math.abs(seconds);
      isNeg = true;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 3600 % 60);
    let r = s + "s";
    r = m + "m " + r;
    if (h > 0) r = h + "h " + r;
    return isNeg ? "-" + r : r;
  },
  getNavigatorLocales: () => {
    return navigator.languages ?? [navigator.language];
  },
  getAllLocales: () => {
    return [
      i18n.locale,
      ...Filters.getNavigatorLocales()
    ];
  },
  getDateFormat: (override) => {
    return {
      locales: Filters.getAllLocales(),
      ...DateFormats[override ?? store.state.config.uiSettings.general.dateFormat]
    };
  },
  getTimeFormat: (override) => {
    return {
      locales: Filters.getAllLocales(),
      ...TimeFormats[override ?? store.state.config.uiSettings.general.timeFormat]
    };
  },
  formatDate: (value, options) => {
    const date = new Date(value);
    const dateFormat = Filters.getDateFormat();
    return date.toLocaleDateString(dateFormat.locales, {
      ...dateFormat.options,
      ...options
    });
  },
  formatTime: (value, options) => {
    const date = new Date(value);
    const timeFormat = Filters.getTimeFormat();
    return date.toLocaleTimeString(timeFormat.locales, {
      ...timeFormat.options,
      ...options
    });
  },
  formatTimeWithSeconds: (value, options) => {
    return Filters.formatTime(value, {
      second: "2-digit",
      ...options
    });
  },
  formatDateTime: (value, options) => {
    const timeFormat = Filters.getTimeFormat();
    const dateFormat = Filters.getDateFormat();
    if (timeFormat.locales !== dateFormat.locales) {
      return Filters.formatDate(value, options) + " " + Filters.formatTime(value, options);
    }
    const date = new Date(value);
    return date.toLocaleDateString(dateFormat.locales, {
      ...dateFormat.options,
      ...timeFormat.options,
      ...options
    });
  },
  formatRelativeTimeToNow(value, options) {
    return Filters.formatRelativeTimeToDate(value, Date.now(), options);
  },
  formatRelativeTimeToDate(value, value2, options) {
    let v = Math.floor(+new Date(value) / 1e3);
    let v2 = Math.floor(+new Date(value2) / 1e3);
    const units = [
      { unit: "second", limit: 60 },
      { unit: "minute", limit: 60 },
      { unit: "hour", limit: 24 },
      { unit: "day", limit: 30 },
      { unit: "month", limit: 12 },
      { unit: "year", limit: -1 }
    ];
    for (const { unit, limit } of units) {
      if (limit === -1 || Math.abs(v - v2) < limit) {
        return Filters.formatRelativeTime(v - v2, unit, options);
      }
      v = Math.floor(v / limit);
      v2 = Math.floor(v2 / limit);
    }
  },
  formatRelativeTime(value, unit, options) {
    const rtf = new Intl.RelativeTimeFormat(Filters.getAllLocales(), {
      numeric: "auto",
      ...options
    });
    return rtf.format(value, unit);
  },
  formatAbsoluteDateTime: (value, options) => {
    if (Filters.isToday(value)) {
      return Filters.formatTime(value, options);
    }
    if (Filters.isThisYear(value)) {
      return Filters.formatDateTime(value, {
        year: void 0,
        ...options
      });
    }
    return Filters.formatDateTime(value, options);
  },
  isToday: (value) => {
    const date = new Date(value);
    const today = /* @__PURE__ */ new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  },
  isThisMonth: (value) => {
    const date = new Date(value);
    const today = /* @__PURE__ */ new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  },
  isThisYear: (value) => {
    const date = new Date(value);
    const today = /* @__PURE__ */ new Date();
    return date.getFullYear() === today.getFullYear();
  },
  upperFirst: (value) => {
    return upperFirst(value);
  },
  prettyCase: (value) => {
    return value.replace(/_/g, " ").split(" ").filter((x) => x).map(Filters.upperFirst).join(" ");
  },
  /**
   * Formats a string into camel case.
   */
  camelCase: (string) => {
    return camelCase(string);
  },
  /**
   * Formats a string into start case.
   */
  startCase: (string) => {
    return startCase(string);
  },
  /**
   * Converts the first character to upper case and the rest lower case, removing underscores.
   * TEST_STRING -> Teststring
   */
  capitalize: (string) => {
    string = Filters.camelCase(string);
    return capitalize(string);
  },
  /**
   * Formats a number (in bytes) to a human readable file size.
   */
  getReadableFileSizeString(fileSizeInBytes) {
    let i = -1;
    const byteUnits = [" kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB"];
    if (fileSizeInBytes === 0) return `0${byteUnits[0]}`;
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);
    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  },
  /**
   * Formats a number (in bytes/sec) to a human readable data rate.
   */
  getReadableDataRateString(dataRateInBytesPerSec) {
    let i = -1;
    const byteUnits = [" kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB"];
    if (dataRateInBytesPerSec === 0) return `0${byteUnits[0]}`;
    do {
      dataRateInBytesPerSec = dataRateInBytesPerSec / 1024;
      i++;
    } while (dataRateInBytesPerSec > 1024);
    return Math.max(dataRateInBytesPerSec, 0.2).toFixed(1) + byteUnits[i] + "/Sec";
  },
  /**
   * Formats a number representing mm to human readable distance.
   */
  getReadableLengthString(lengthInMm, showMicrons = false) {
    if (lengthInMm === void 0 || lengthInMm === null) {
      return "-";
    }
    if (lengthInMm >= 1e3) return (lengthInMm / 1e3).toFixed(2) + " m";
    if (lengthInMm > 100) return (lengthInMm / 10).toFixed(1) + " cm";
    if (lengthInMm < 0.1 && showMicrons) return (lengthInMm * 1e3).toFixed(0) + " μm";
    return lengthInMm.toFixed(1) + " mm";
  },
  /**
   * Formats a number representing g to human readable weight.
   */
  getReadableWeightString(weightInG) {
    if (weightInG === void 0 || weightInG === null) {
      return "-";
    }
    if (weightInG >= 1e3) return (weightInG / 1e3).toFixed(2) + " kg";
    return weightInG.toFixed(2) + " g";
  },
  /**
   * Formats a number (in Hz) to a human readable frequency.
   */
  getReadableFrequencyString(frequencyInHz) {
    let i = 0;
    const frequencyUnits = [" Hz", " kHz", " MHz", " GHz", " THz"];
    while (frequencyInHz >= 1e3) {
      frequencyInHz = frequencyInHz / 1e3;
      i++;
    }
    return frequencyInHz.toFixed() + frequencyUnits[i];
  },
  /**
   * Formats a number (in ohms) to a human readable resistance.
   */
  getReadableResistanceString(resistanceInOhms) {
    let i = 0;
    const resistanceUnits = [" Ω", " kΩ", " MΩ", " GΩ", " TΩ"];
    while (resistanceInOhms >= 1e3) {
      resistanceInOhms = resistanceInOhms / 1e3;
      i++;
    }
    return resistanceInOhms.toFixed(1) + resistanceUnits[i];
  },
  /**
   * Formats a number (in hPa) to human readable atmospheric pressure.
   */
  getReadableAtmosphericPressureString(pressumeInHPa) {
    return pressumeInHPa.toFixed(1) + " hPa";
  },
  /**
   * The filesystem sorter. This is copied from vuetify, and modified to ensure our directories
   * are always sorted to the top.
   */
  fileSystemSort(items, sortBy, sortDesc, locale, textSortOrder) {
    if (sortBy === null || !sortBy.length) return items;
    const stringCollator = new Intl.Collator(locale, { sensitivity: "accent", usage: "sort" });
    return items.sort((a, b) => {
      if (a.type === "directory" && (a.dirname === ".." || b.type !== "directory")) return -1;
      if (b.type === "directory" && (b.dirname === ".." || a.type !== "directory")) return 1;
      for (let i = 0; i < sortBy.length; i++) {
        const sortKey = sortBy[i];
        const sortValues = [
          getObjectValueByPath(a, sortKey),
          getObjectValueByPath(b, sortKey)
        ];
        if (sortValues[0] === sortValues[1]) {
          continue;
        }
        if (sortDesc[i]) {
          sortValues.reverse();
        }
        if (sortValues.every((x) => typeof x === "number" && !isNaN(x))) {
          return sortValues[0] - sortValues[1];
        }
        const sortValuesAsString = sortValues.map((s) => (s || "").toString());
        if (textSortOrder === "numeric-prefix") {
          const [sortA, sortB] = sortValuesAsString.map((s) => s.match(/^\d+/));
          if (sortA && sortB && sortA[0] !== sortB[0]) {
            return +sortA[0] - +sortB[0];
          }
        } else if (textSortOrder === "version") {
          return versionStringCompare(sortValuesAsString[0], sortValuesAsString[1]);
        }
        return stringCollator.compare(sortValuesAsString[0], sortValuesAsString[1]);
      }
      return 0;
    });
  },
  /**
   * Determines API urls from a base url
   */
  getApiUrls(apiUrl) {
    if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
      apiUrl = `http://${apiUrl}`;
    }
    if (apiUrl.endsWith("/")) {
      apiUrl = apiUrl.slice(0, -1);
    }
    const socketUrl = new URL(apiUrl);
    socketUrl.protocol = socketUrl.protocol === "https:" ? "wss://" : "ws://";
    socketUrl.pathname += socketUrl.pathname.endsWith("/") ? "websocket" : "/websocket";
    return {
      apiUrl,
      socketUrl: socketUrl.toString()
    };
  },
  /**
   * Tells us if a color is considered dark or light
   */
  isColorDark(color) {
    const t = new TinyColor(color).getBrightness();
    return t / 255 * 100 <= 50;
  },
  /**
   * Simple approach to route somewhere when we don't necessarily want
   * route matching via :to
   */
  routeTo(router, path) {
    if (router.currentRoute.fullPath !== path) router.push(path);
  },
  /**
   * Converts a given weight (in grams) to its corresponding length (in mm)
   */
  convertFilamentWeightToLength(weight, density, diameter) {
    return weight / density / (Math.PI * (diameter / 2) ** 2) * 1e3;
  }
};
export const Rules = {
  required(v) {
    return (v ?? "") !== "" || i18n.t("app.general.simple_form.error.required");
  },
  numberValid(v) {
    return !isNaN(+(v ?? NaN)) || i18n.t("app.general.simple_form.error.invalid_number");
  },
  numberGreaterThan(min) {
    return (v) => v > min || i18n.t("app.general.simple_form.error.min", { min: `> ${min}` });
  },
  numberGreaterThanOrEqual(min) {
    return (v) => v >= min || i18n.t("app.general.simple_form.error.min", { min });
  },
  numberGreaterThanOrEqualOrZero(min) {
    return (v) => +v === 0 || v >= min || i18n.t("app.general.simple_form.error.min_or_0", { min });
  },
  numberGreaterThanOrZero(min) {
    return (v) => +v === 0 || v > min || i18n.t("app.general.simple_form.error.min_or_0", { min: `> ${min}` });
  },
  numberLessThan(max) {
    return (v) => v < max || i18n.t("app.general.simple_form.error.max", { max: `< ${max}` });
  },
  numberLessThanOrEqual(max) {
    return (v) => v <= max || i18n.t("app.general.simple_form.error.max", { max });
  },
  numberLessThanOrEqualOrZero(max) {
    return (v) => +v === 0 || v <= max || i18n.t("app.general.simple_form.error.max", { max });
  },
  numberLessThanOrZero(max) {
    return (v) => +v === 0 || v < max || i18n.t("app.general.simple_form.error.max", { max });
  },
  lengthGreaterThanOrEqual(min) {
    return (v) => v.length >= min || i18n.t("app.general.simple_form.error.min", { min });
  },
  lengthLessThanOrEqual(max) {
    return (v) => v.length <= max || i18n.t("app.general.simple_form.error.max", { max });
  },
  numberArrayValid(v) {
    return !v.some((i) => i === "" || isNaN(+(i ?? NaN))) || i18n.t("app.general.simple_form.error.arrayofnums");
  },
  passwordNotEqualUsername(username) {
    return (v) => v.toLowerCase() !== (username ?? "").toLowerCase() || i18n.t("app.general.simple_form.error.password_username");
  },
  aspectRatioValid(v) {
    return /^\d+\s*[:/]\s*\d+$/.test(v) || i18n.t("app.general.simple_form.error.invalid_aspect");
  },
  regExpPatternValid(v) {
    try {
      new RegExp(v);
      return true;
    } catch (e) {
      return i18n.t("app.general.simple_form.error.invalid_expression");
    }
  },
  regExpValid(regExp, errorMessage) {
    return (v) => regExp.test(v) || errorMessage || "Invalid";
  }
};
export const FiltersPlugin = {
  install(Vue) {
    Vue.prototype.$filters = Filters;
    Vue.prototype.$rules = Rules;
    Vue.prototype.$globals = Globals;
    Vue.prototype.$waits = Waits;
    Vue.$filters = Filters;
    Vue.$rules = Rules;
    Vue.$globals = Globals;
    Vue.$waits = Waits;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF9WdWUgZnJvbSAndnVlJ1xuaW1wb3J0IFZ1ZVJvdXRlciBmcm9tICd2dWUtcm91dGVyJ1xuaW1wb3J0IHsgY2FtZWxDYXNlLCBzdGFydENhc2UsIGNhcGl0YWxpemUsIGlzRmluaXRlLCB1cHBlckZpcnN0IH0gZnJvbSAnbG9kYXNoLWVzJ1xuaW1wb3J0IHR5cGUgeyBBcGlDb25maWcsIFRleHRTb3J0T3JkZXIgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7IFRpbnlDb2xvciB9IGZyb20gJ0BjdHJsL3Rpbnljb2xvcidcbmltcG9ydCB7IERhdGVGb3JtYXRzLCBHbG9iYWxzLCBUaW1lRm9ybWF0cywgV2FpdHMsIHR5cGUgRGF0ZVRpbWVGb3JtYXQgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgaTE4biBmcm9tICdAL3BsdWdpbnMvaTE4bidcbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRlUmVzdWx0IH0gZnJvbSAndnVlLWkxOG4nXG5pbXBvcnQgc3RvcmUgZnJvbSAnQC9zdG9yZSdcbmltcG9ydCB0eXBlIHsgRmlsZUJyb3dzZXJFbnRyeSB9IGZyb20gJ0Avc3RvcmUvZmlsZXMvdHlwZXMnXG5pbXBvcnQgdmVyc2lvblN0cmluZ0NvbXBhcmUgZnJvbSAnQC91dGlsL3ZlcnNpb24tc3RyaW5nLWNvbXBhcmUnXG5cbi8qKlxuICogY3JlZGl0OiB0YWtlbiBmcm9tIFZ1ZXRpZnkgc291cmNlXG4gKi9cbmNvbnN0IGdldE5lc3RlZFZhbHVlID0gKG9iajogYW55LCBwYXRoOiAoc3RyaW5nIHwgbnVtYmVyKVtdLCBmYWxsYmFjaz86IGFueSk6IGFueSA9PiB7XG4gIGNvbnN0IGxhc3QgPSBwYXRoLmxlbmd0aCAtIDFcblxuICBpZiAobGFzdCA8IDApIHJldHVybiBvYmogPT09IHVuZGVmaW5lZCA/IGZhbGxiYWNrIDogb2JqXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXN0OyBpKyspIHtcbiAgICBpZiAob2JqID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxsYmFja1xuICAgIH1cbiAgICBvYmogPSBvYmpbcGF0aFtpXV1cbiAgfVxuXG4gIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbGxiYWNrXG5cbiAgcmV0dXJuIG9ialtwYXRoW2xhc3RdXSA9PT0gdW5kZWZpbmVkID8gZmFsbGJhY2sgOiBvYmpbcGF0aFtsYXN0XV1cbn1cblxuLyoqXG4gKiBjcmVkaXQ6IHRha2VuIGZyb20gVnVldGlmeSBzb3VyY2VcbiAqL1xuY29uc3QgZ2V0T2JqZWN0VmFsdWVCeVBhdGggPSAob2JqOiBhbnksIHBhdGg6IHN0cmluZywgZmFsbGJhY2s/OiBhbnkpOiBhbnkgPT4ge1xuICAvLyBjcmVkaXQ6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjQ5MTQ2My9hY2Nlc3NpbmctbmVzdGVkLWphdmFzY3JpcHQtb2JqZWN0cy13aXRoLXN0cmluZy1rZXkjY29tbWVudDU1Mjc4NDEzXzY0OTE2MjFcbiAgaWYgKG9iaiA9PSBudWxsIHx8ICFwYXRoIHx8IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbGxiYWNrXG4gIGlmIChvYmpbcGF0aF0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIG9ialtwYXRoXVxuICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXFsoXFx3KylcXF0vZywgJy4kMScpIC8vIGNvbnZlcnQgaW5kZXhlcyB0byBwcm9wZXJ0aWVzXG4gIHBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC4vLCAnJykgLy8gc3RyaXAgYSBsZWFkaW5nIGRvdFxuICByZXR1cm4gZ2V0TmVzdGVkVmFsdWUob2JqLCBwYXRoLnNwbGl0KCcuJyksIGZhbGxiYWNrKVxufVxuXG5leHBvcnQgY29uc3QgRmlsdGVycyA9IHtcblxuICAvKipcbiAgICogRm9ybWF0cyBhIHRpbWUgdG8gMDBoIDAwbSAwMHNcbiAgICogRXhwZWN0cyB0byBiZSBwYXNzZWQgc2Vjb25kcy5cbiAgICovXG4gIGZvcm1hdENvdW50ZXJTZWNvbmRzOiAoc2Vjb25kczogbnVtYmVyIHwgc3RyaW5nKSA9PiB7XG4gICAgc2Vjb25kcyA9ICtzZWNvbmRzXG4gICAgaWYgKGlzTmFOKHNlY29uZHMpIHx8ICFpc0Zpbml0ZShzZWNvbmRzKSkgc2Vjb25kcyA9IDBcbiAgICBsZXQgaXNOZWcgPSBmYWxzZVxuICAgIGlmIChzZWNvbmRzIDwgMCkge1xuICAgICAgc2Vjb25kcyA9IE1hdGguYWJzKHNlY29uZHMpXG4gICAgICBpc05lZyA9IHRydWVcbiAgICB9XG4gICAgY29uc3QgaCA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDM2MDApXG4gICAgY29uc3QgbSA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDM2MDAgLyA2MClcbiAgICBjb25zdCBzID0gTWF0aC5mbG9vcihzZWNvbmRzICUgMzYwMCAlIDYwKVxuXG4gICAgbGV0IHIgPSBzICsgJ3MnIC8vIGFsd2F5cyBzaG93IHNlY29uZHNcbiAgICByID0gbSArICdtICcgKyByIC8vIGFsd2F5cyBzaG93IG1pbnV0ZXNcbiAgICBpZiAoaCA+IDApIHIgPSBoICsgJ2ggJyArIHIgLy8gb25seSBzaG93IGhvdXJzIGlmIHJlbGV2ZW50XG5cbiAgICByZXR1cm4gKGlzTmVnKSA/ICctJyArIHIgOiByXG4gIH0sXG5cbiAgZ2V0TmF2aWdhdG9yTG9jYWxlczogKCkgPT4ge1xuICAgIHJldHVybiBuYXZpZ2F0b3IubGFuZ3VhZ2VzID8/IFtuYXZpZ2F0b3IubGFuZ3VhZ2VdXG4gIH0sXG5cbiAgZ2V0QWxsTG9jYWxlczogKCkgPT4ge1xuICAgIHJldHVybiBbXG4gICAgICBpMThuLmxvY2FsZSxcbiAgICAgIC4uLkZpbHRlcnMuZ2V0TmF2aWdhdG9yTG9jYWxlcygpXG4gICAgXVxuICB9LFxuXG4gIGdldERhdGVGb3JtYXQ6IChvdmVycmlkZT86IHN0cmluZyk6IERhdGVUaW1lRm9ybWF0ID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbG9jYWxlczogRmlsdGVycy5nZXRBbGxMb2NhbGVzKCksXG4gICAgICAuLi5EYXRlRm9ybWF0c1tvdmVycmlkZSA/PyBzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmRhdGVGb3JtYXRdXG4gICAgfVxuICB9LFxuXG4gIGdldFRpbWVGb3JtYXQ6IChvdmVycmlkZT86IHN0cmluZyk6IERhdGVUaW1lRm9ybWF0ID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbG9jYWxlczogRmlsdGVycy5nZXRBbGxMb2NhbGVzKCksXG4gICAgICAuLi5UaW1lRm9ybWF0c1tvdmVycmlkZSA/PyBzdG9yZS5zdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLnRpbWVGb3JtYXRdXG4gICAgfVxuICB9LFxuXG4gIGZvcm1hdERhdGU6ICh2YWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgRGF0ZSwgb3B0aW9ucz86IEludGwuRGF0ZVRpbWVGb3JtYXRPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKVxuICAgIGNvbnN0IGRhdGVGb3JtYXQgPSBGaWx0ZXJzLmdldERhdGVGb3JtYXQoKVxuXG4gICAgcmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKGRhdGVGb3JtYXQubG9jYWxlcywge1xuICAgICAgLi4uZGF0ZUZvcm1hdC5vcHRpb25zLFxuICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG4gIH0sXG5cbiAgZm9ybWF0VGltZTogKHZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBEYXRlLCBvcHRpb25zPzogSW50bC5EYXRlVGltZUZvcm1hdE9wdGlvbnMpID0+IHtcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodmFsdWUpXG4gICAgY29uc3QgdGltZUZvcm1hdCA9IEZpbHRlcnMuZ2V0VGltZUZvcm1hdCgpXG5cbiAgICByZXR1cm4gZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcodGltZUZvcm1hdC5sb2NhbGVzLCB7XG4gICAgICAuLi50aW1lRm9ybWF0Lm9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zXG4gICAgfSlcbiAgfSxcblxuICBmb3JtYXRUaW1lV2l0aFNlY29uZHM6ICh2YWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgRGF0ZSwgb3B0aW9ucz86IEludGwuRGF0ZVRpbWVGb3JtYXRPcHRpb25zKSA9PiB7XG4gICAgcmV0dXJuIEZpbHRlcnMuZm9ybWF0VGltZSh2YWx1ZSwge1xuICAgICAgc2Vjb25kOiAnMi1kaWdpdCcsXG4gICAgICAuLi5vcHRpb25zXG4gICAgfSlcbiAgfSxcblxuICBmb3JtYXREYXRlVGltZTogKHZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBEYXRlLCBvcHRpb25zPzogSW50bC5EYXRlVGltZUZvcm1hdE9wdGlvbnMpID0+IHtcbiAgICBjb25zdCB0aW1lRm9ybWF0ID0gRmlsdGVycy5nZXRUaW1lRm9ybWF0KClcbiAgICBjb25zdCBkYXRlRm9ybWF0ID0gRmlsdGVycy5nZXREYXRlRm9ybWF0KClcblxuICAgIGlmICh0aW1lRm9ybWF0LmxvY2FsZXMgIT09IGRhdGVGb3JtYXQubG9jYWxlcykge1xuICAgICAgcmV0dXJuIEZpbHRlcnMuZm9ybWF0RGF0ZSh2YWx1ZSwgb3B0aW9ucykgKyAnICcgKyBGaWx0ZXJzLmZvcm1hdFRpbWUodmFsdWUsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKVxuXG4gICAgcmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKGRhdGVGb3JtYXQubG9jYWxlcywge1xuICAgICAgLi4uZGF0ZUZvcm1hdC5vcHRpb25zLFxuICAgICAgLi4udGltZUZvcm1hdC5vcHRpb25zLFxuICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG4gIH0sXG5cbiAgZm9ybWF0UmVsYXRpdmVUaW1lVG9Ob3cgKHZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBEYXRlLCBvcHRpb25zPzogSW50bC5SZWxhdGl2ZVRpbWVGb3JtYXRPcHRpb25zKSB7XG4gICAgcmV0dXJuIEZpbHRlcnMuZm9ybWF0UmVsYXRpdmVUaW1lVG9EYXRlKHZhbHVlLCBEYXRlLm5vdygpLCBvcHRpb25zKVxuICB9LFxuXG4gIGZvcm1hdFJlbGF0aXZlVGltZVRvRGF0ZSAodmFsdWU6IG51bWJlciB8IHN0cmluZyB8IERhdGUsIHZhbHVlMjogbnVtYmVyIHwgc3RyaW5nIHwgRGF0ZSwgb3B0aW9ucz86IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0T3B0aW9ucykge1xuICAgIGxldCB2ID0gTWF0aC5mbG9vcigrbmV3IERhdGUodmFsdWUpIC8gMTAwMClcbiAgICBsZXQgdjIgPSBNYXRoLmZsb29yKCtuZXcgRGF0ZSh2YWx1ZTIpIC8gMTAwMClcblxuICAgIGNvbnN0IHVuaXRzOiB7IHVuaXQ6IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0VW5pdCwgbGltaXQ6IG51bWJlciB9W10gPSBbXG4gICAgICB7IHVuaXQ6ICdzZWNvbmQnLCBsaW1pdDogNjAgfSxcbiAgICAgIHsgdW5pdDogJ21pbnV0ZScsIGxpbWl0OiA2MCB9LFxuICAgICAgeyB1bml0OiAnaG91cicsIGxpbWl0OiAyNCB9LFxuICAgICAgeyB1bml0OiAnZGF5JywgbGltaXQ6IDMwIH0sXG4gICAgICB7IHVuaXQ6ICdtb250aCcsIGxpbWl0OiAxMiB9LFxuICAgICAgeyB1bml0OiAneWVhcicsIGxpbWl0OiAtMSB9XG4gICAgXVxuXG4gICAgZm9yIChjb25zdCB7IHVuaXQsIGxpbWl0IH0gb2YgdW5pdHMpIHtcbiAgICAgIGlmIChsaW1pdCA9PT0gLTEgfHwgTWF0aC5hYnModiAtIHYyKSA8IGxpbWl0KSB7XG4gICAgICAgIHJldHVybiBGaWx0ZXJzLmZvcm1hdFJlbGF0aXZlVGltZSh2IC0gdjIsIHVuaXQsIG9wdGlvbnMpXG4gICAgICB9XG5cbiAgICAgIHYgPSBNYXRoLmZsb29yKHYgLyBsaW1pdClcbiAgICAgIHYyID0gTWF0aC5mbG9vcih2MiAvIGxpbWl0KVxuICAgIH1cbiAgfSxcblxuICBmb3JtYXRSZWxhdGl2ZVRpbWUgKHZhbHVlOiBudW1iZXIsIHVuaXQ6IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0VW5pdCwgb3B0aW9ucz86IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0T3B0aW9ucykge1xuICAgIGNvbnN0IHJ0ZiA9IG5ldyBJbnRsLlJlbGF0aXZlVGltZUZvcm1hdChGaWx0ZXJzLmdldEFsbExvY2FsZXMoKSwge1xuICAgICAgbnVtZXJpYzogJ2F1dG8nLFxuICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG5cbiAgICByZXR1cm4gcnRmLmZvcm1hdCh2YWx1ZSwgdW5pdClcbiAgfSxcblxuICBmb3JtYXRBYnNvbHV0ZURhdGVUaW1lOiAodmFsdWU6IG51bWJlciB8IHN0cmluZyB8IERhdGUsIG9wdGlvbnM/OiBJbnRsLlJlbGF0aXZlVGltZUZvcm1hdE9wdGlvbnMpID0+IHtcbiAgICBpZiAoRmlsdGVycy5pc1RvZGF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIEZpbHRlcnMuZm9ybWF0VGltZSh2YWx1ZSwgb3B0aW9ucylcbiAgICB9XG5cbiAgICBpZiAoRmlsdGVycy5pc1RoaXNZZWFyKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIEZpbHRlcnMuZm9ybWF0RGF0ZVRpbWUodmFsdWUsIHtcbiAgICAgICAgeWVhcjogdW5kZWZpbmVkLFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBGaWx0ZXJzLmZvcm1hdERhdGVUaW1lKHZhbHVlLCBvcHRpb25zKVxuICB9LFxuXG4gIGlzVG9kYXk6ICh2YWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgRGF0ZSkgPT4ge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSh2YWx1ZSlcbiAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKClcblxuICAgIHJldHVybiBkYXRlLmdldERhdGUoKSA9PT0gdG9kYXkuZ2V0RGF0ZSgpICYmXG4gICAgICBkYXRlLmdldE1vbnRoKCkgPT09IHRvZGF5LmdldE1vbnRoKCkgJiZcbiAgICAgIGRhdGUuZ2V0RnVsbFllYXIoKSA9PT0gdG9kYXkuZ2V0RnVsbFllYXIoKVxuICB9LFxuXG4gIGlzVGhpc01vbnRoOiAodmFsdWU6IG51bWJlciB8IHN0cmluZyB8IERhdGUpID0+IHtcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodmFsdWUpXG4gICAgY29uc3QgdG9kYXkgPSBuZXcgRGF0ZSgpXG5cbiAgICByZXR1cm4gZGF0ZS5nZXRNb250aCgpID09PSB0b2RheS5nZXRNb250aCgpICYmXG4gICAgICBkYXRlLmdldEZ1bGxZZWFyKCkgPT09IHRvZGF5LmdldEZ1bGxZZWFyKClcbiAgfSxcblxuICBpc1RoaXNZZWFyOiAodmFsdWU6IG51bWJlciB8IHN0cmluZyB8IERhdGUpID0+IHtcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodmFsdWUpXG4gICAgY29uc3QgdG9kYXkgPSBuZXcgRGF0ZSgpXG5cbiAgICByZXR1cm4gZGF0ZS5nZXRGdWxsWWVhcigpID09PSB0b2RheS5nZXRGdWxsWWVhcigpXG4gIH0sXG5cbiAgdXBwZXJGaXJzdDogKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gdXBwZXJGaXJzdCh2YWx1ZSlcbiAgfSxcblxuICBwcmV0dHlDYXNlOiAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiB2YWx1ZVxuICAgICAgLnJlcGxhY2UoL18vZywgJyAnKVxuICAgICAgLnNwbGl0KCcgJylcbiAgICAgIC5maWx0ZXIoeCA9PiB4KVxuICAgICAgLm1hcChGaWx0ZXJzLnVwcGVyRmlyc3QpXG4gICAgICAuam9pbignICcpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEZvcm1hdHMgYSBzdHJpbmcgaW50byBjYW1lbCBjYXNlLlxuICAgKi9cbiAgY2FtZWxDYXNlOiAoc3RyaW5nOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gY2FtZWxDYXNlKHN0cmluZylcbiAgfSxcblxuICAvKipcbiAgICogRm9ybWF0cyBhIHN0cmluZyBpbnRvIHN0YXJ0IGNhc2UuXG4gICAqL1xuICBzdGFydENhc2U6IChzdHJpbmc6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiBzdGFydENhc2Uoc3RyaW5nKVxuICB9LFxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgZmlyc3QgY2hhcmFjdGVyIHRvIHVwcGVyIGNhc2UgYW5kIHRoZSByZXN0IGxvd2VyIGNhc2UsIHJlbW92aW5nIHVuZGVyc2NvcmVzLlxuICAgKiBURVNUX1NUUklORyAtPiBUZXN0c3RyaW5nXG4gICAqL1xuICBjYXBpdGFsaXplOiAoc3RyaW5nOiBzdHJpbmcpID0+IHtcbiAgICBzdHJpbmcgPSBGaWx0ZXJzLmNhbWVsQ2FzZShzdHJpbmcpXG4gICAgcmV0dXJuIGNhcGl0YWxpemUoc3RyaW5nKVxuICB9LFxuXG4gIC8qKlxuICAgKiBGb3JtYXRzIGEgbnVtYmVyIChpbiBieXRlcykgdG8gYSBodW1hbiByZWFkYWJsZSBmaWxlIHNpemUuXG4gICAqL1xuICBnZXRSZWFkYWJsZUZpbGVTaXplU3RyaW5nIChmaWxlU2l6ZUluQnl0ZXM6IG51bWJlcikge1xuICAgIGxldCBpID0gLTFcbiAgICBjb25zdCBieXRlVW5pdHMgPSBbJyBrQicsICcgTUInLCAnIEdCJywgJyBUQicsICdQQicsICdFQicsICdaQicsICdZQiddXG4gICAgaWYgKGZpbGVTaXplSW5CeXRlcyA9PT0gMCkgcmV0dXJuIGAwJHtieXRlVW5pdHNbMF19YFxuICAgIGRvIHtcbiAgICAgIGZpbGVTaXplSW5CeXRlcyA9IGZpbGVTaXplSW5CeXRlcyAvIDEwMjRcbiAgICAgIGkrK1xuICAgIH0gd2hpbGUgKGZpbGVTaXplSW5CeXRlcyA+IDEwMjQpXG5cbiAgICByZXR1cm4gTWF0aC5tYXgoZmlsZVNpemVJbkJ5dGVzLCAwLjEpLnRvRml4ZWQoMSkgKyBieXRlVW5pdHNbaV1cbiAgfSxcblxuICAvKipcbiAgICogRm9ybWF0cyBhIG51bWJlciAoaW4gYnl0ZXMvc2VjKSB0byBhIGh1bWFuIHJlYWRhYmxlIGRhdGEgcmF0ZS5cbiAgICovXG4gIGdldFJlYWRhYmxlRGF0YVJhdGVTdHJpbmcgKGRhdGFSYXRlSW5CeXRlc1BlclNlYzogbnVtYmVyKSB7XG4gICAgbGV0IGkgPSAtMVxuICAgIGNvbnN0IGJ5dGVVbml0cyA9IFsnIGtCJywgJyBNQicsICcgR0InLCAnIFRCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ11cbiAgICBpZiAoZGF0YVJhdGVJbkJ5dGVzUGVyU2VjID09PSAwKSByZXR1cm4gYDAke2J5dGVVbml0c1swXX1gXG4gICAgZG8ge1xuICAgICAgZGF0YVJhdGVJbkJ5dGVzUGVyU2VjID0gZGF0YVJhdGVJbkJ5dGVzUGVyU2VjIC8gMTAyNFxuICAgICAgaSsrXG4gICAgfSB3aGlsZSAoZGF0YVJhdGVJbkJ5dGVzUGVyU2VjID4gMTAyNClcblxuICAgIHJldHVybiBNYXRoLm1heChkYXRhUmF0ZUluQnl0ZXNQZXJTZWMsIDAuMikudG9GaXhlZCgxKSArIGJ5dGVVbml0c1tpXSArICcvU2VjJ1xuICB9LFxuXG4gIC8qKlxuICAgKiBGb3JtYXRzIGEgbnVtYmVyIHJlcHJlc2VudGluZyBtbSB0byBodW1hbiByZWFkYWJsZSBkaXN0YW5jZS5cbiAgICovXG4gIGdldFJlYWRhYmxlTGVuZ3RoU3RyaW5nIChsZW5ndGhJbk1tOiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsLCBzaG93TWljcm9ucyA9IGZhbHNlKSB7XG4gICAgaWYgKGxlbmd0aEluTW0gPT09IHVuZGVmaW5lZCB8fCBsZW5ndGhJbk1tID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gJy0nXG4gICAgfVxuXG4gICAgaWYgKGxlbmd0aEluTW0gPj0gMTAwMCkgcmV0dXJuIChsZW5ndGhJbk1tIC8gMTAwMCkudG9GaXhlZCgyKSArICcgbSdcbiAgICBpZiAobGVuZ3RoSW5NbSA+IDEwMCkgcmV0dXJuIChsZW5ndGhJbk1tIC8gMTApLnRvRml4ZWQoMSkgKyAnIGNtJ1xuICAgIGlmIChsZW5ndGhJbk1tIDwgMC4xICYmIHNob3dNaWNyb25zKSByZXR1cm4gKGxlbmd0aEluTW0gKiAxMDAwKS50b0ZpeGVkKDApICsgJyDOvG0nXG4gICAgcmV0dXJuIGxlbmd0aEluTW0udG9GaXhlZCgxKSArICcgbW0nXG4gIH0sXG5cbiAgLyoqXG4gICAqIEZvcm1hdHMgYSBudW1iZXIgcmVwcmVzZW50aW5nIGcgdG8gaHVtYW4gcmVhZGFibGUgd2VpZ2h0LlxuICAgKi9cbiAgZ2V0UmVhZGFibGVXZWlnaHRTdHJpbmcgKHdlaWdodEluRzogbnVtYmVyIHwgdW5kZWZpbmVkIHwgbnVsbCkge1xuICAgIGlmICh3ZWlnaHRJbkcgPT09IHVuZGVmaW5lZCB8fCB3ZWlnaHRJbkcgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiAnLSdcbiAgICB9XG5cbiAgICBpZiAod2VpZ2h0SW5HID49IDEwMDApIHJldHVybiAod2VpZ2h0SW5HIC8gMTAwMCkudG9GaXhlZCgyKSArICcga2cnXG4gICAgcmV0dXJuIHdlaWdodEluRy50b0ZpeGVkKDIpICsgJyBnJ1xuICB9LFxuXG4gIC8qKlxuICAgKiBGb3JtYXRzIGEgbnVtYmVyIChpbiBIeikgdG8gYSBodW1hbiByZWFkYWJsZSBmcmVxdWVuY3kuXG4gICAqL1xuICBnZXRSZWFkYWJsZUZyZXF1ZW5jeVN0cmluZyAoZnJlcXVlbmN5SW5IejogbnVtYmVyKSB7XG4gICAgbGV0IGkgPSAwXG4gICAgY29uc3QgZnJlcXVlbmN5VW5pdHMgPSBbJyBIeicsICcga0h6JywgJyBNSHonLCAnIEdIeicsICcgVEh6J11cbiAgICB3aGlsZSAoZnJlcXVlbmN5SW5IeiA+PSAxMDAwKSB7XG4gICAgICBmcmVxdWVuY3lJbkh6ID0gZnJlcXVlbmN5SW5IeiAvIDEwMDBcbiAgICAgIGkrK1xuICAgIH1cbiAgICByZXR1cm4gZnJlcXVlbmN5SW5Iei50b0ZpeGVkKCkgKyBmcmVxdWVuY3lVbml0c1tpXVxuICB9LFxuXG4gIC8qKlxuICAgKiBGb3JtYXRzIGEgbnVtYmVyIChpbiBvaG1zKSB0byBhIGh1bWFuIHJlYWRhYmxlIHJlc2lzdGFuY2UuXG4gICAqL1xuICBnZXRSZWFkYWJsZVJlc2lzdGFuY2VTdHJpbmcgKHJlc2lzdGFuY2VJbk9obXM6IG51bWJlcikge1xuICAgIGxldCBpID0gMFxuICAgIGNvbnN0IHJlc2lzdGFuY2VVbml0cyA9IFsnIOKEpicsICcga+KEpicsICcgTeKEpicsICcgR+KEpicsICcgVOKEpiddXG4gICAgd2hpbGUgKHJlc2lzdGFuY2VJbk9obXMgPj0gMTAwMCkge1xuICAgICAgcmVzaXN0YW5jZUluT2htcyA9IHJlc2lzdGFuY2VJbk9obXMgLyAxMDAwXG4gICAgICBpKytcbiAgICB9XG4gICAgcmV0dXJuIHJlc2lzdGFuY2VJbk9obXMudG9GaXhlZCgxKSArIHJlc2lzdGFuY2VVbml0c1tpXVxuICB9LFxuXG4gIC8qKlxuICAgKiBGb3JtYXRzIGEgbnVtYmVyIChpbiBoUGEpIHRvIGh1bWFuIHJlYWRhYmxlIGF0bW9zcGhlcmljIHByZXNzdXJlLlxuICAgKi9cbiAgZ2V0UmVhZGFibGVBdG1vc3BoZXJpY1ByZXNzdXJlU3RyaW5nIChwcmVzc3VtZUluSFBhOiBudW1iZXIpIHtcbiAgICByZXR1cm4gcHJlc3N1bWVJbkhQYS50b0ZpeGVkKDEpICsgJyBoUGEnXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoZSBmaWxlc3lzdGVtIHNvcnRlci4gVGhpcyBpcyBjb3BpZWQgZnJvbSB2dWV0aWZ5LCBhbmQgbW9kaWZpZWQgdG8gZW5zdXJlIG91ciBkaXJlY3Rvcmllc1xuICAgKiBhcmUgYWx3YXlzIHNvcnRlZCB0byB0aGUgdG9wLlxuICAgKi9cbiAgZmlsZVN5c3RlbVNvcnQgKFxuICAgIGl0ZW1zOiBGaWxlQnJvd3NlckVudHJ5W10sXG4gICAgc29ydEJ5OiBzdHJpbmdbXSxcbiAgICBzb3J0RGVzYzogYm9vbGVhbltdLFxuICAgIGxvY2FsZTogc3RyaW5nLFxuICAgIHRleHRTb3J0T3JkZXI6IFRleHRTb3J0T3JkZXJcbiAgKSB7XG4gICAgaWYgKHNvcnRCeSA9PT0gbnVsbCB8fCAhc29ydEJ5Lmxlbmd0aCkgcmV0dXJuIGl0ZW1zXG4gICAgY29uc3Qgc3RyaW5nQ29sbGF0b3IgPSBuZXcgSW50bC5Db2xsYXRvcihsb2NhbGUsIHsgc2Vuc2l0aXZpdHk6ICdhY2NlbnQnLCB1c2FnZTogJ3NvcnQnIH0pXG4gICAgcmV0dXJuIGl0ZW1zLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGlmIChhLnR5cGUgPT09ICdkaXJlY3RvcnknICYmIChhLmRpcm5hbWUgPT09ICcuLicgfHwgYi50eXBlICE9PSAnZGlyZWN0b3J5JykpIHJldHVybiAtMVxuICAgICAgaWYgKGIudHlwZSA9PT0gJ2RpcmVjdG9yeScgJiYgKGIuZGlybmFtZSA9PT0gJy4uJyB8fCBhLnR5cGUgIT09ICdkaXJlY3RvcnknKSkgcmV0dXJuIDFcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3J0QnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc29ydEtleSA9IHNvcnRCeVtpXVxuXG4gICAgICAgIGNvbnN0IHNvcnRWYWx1ZXMgPSBbXG4gICAgICAgICAgZ2V0T2JqZWN0VmFsdWVCeVBhdGgoYSwgc29ydEtleSksXG4gICAgICAgICAgZ2V0T2JqZWN0VmFsdWVCeVBhdGgoYiwgc29ydEtleSlcbiAgICAgICAgXVxuXG4gICAgICAgIC8vIElmIHZhbHVlcyBhcmUgZXF1YWwsIGNvbnRpbnVlXG4gICAgICAgIGlmIChzb3J0VmFsdWVzWzBdID09PSBzb3J0VmFsdWVzWzFdKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHNvcnRpbmcgZGVzY2VuZGluZywgcmV2ZXJzZSB2YWx1ZXNcbiAgICAgICAgaWYgKHNvcnREZXNjW2ldKSB7XG4gICAgICAgICAgc29ydFZhbHVlcy5yZXZlcnNlKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHZhbHVlcyBhcmUgb2YgdHlwZSBudW1iZXIsIGNvbXBhcmUgYXMgbnVtYmVyXG4gICAgICAgIGlmIChzb3J0VmFsdWVzLmV2ZXJ5KHggPT4gdHlwZW9mICh4KSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHgpKSkge1xuICAgICAgICAgIHJldHVybiBzb3J0VmFsdWVzWzBdIC0gc29ydFZhbHVlc1sxXVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc29ydFZhbHVlc0FzU3RyaW5nID0gc29ydFZhbHVlc1xuICAgICAgICAgIC5tYXAocyA9PiAocyB8fCAnJykudG9TdHJpbmcoKSBhcyBzdHJpbmcpXG5cbiAgICAgICAgaWYgKHRleHRTb3J0T3JkZXIgPT09ICdudW1lcmljLXByZWZpeCcpIHtcbiAgICAgICAgICBjb25zdCBbc29ydEEsIHNvcnRCXSA9IHNvcnRWYWx1ZXNBc1N0cmluZ1xuICAgICAgICAgICAgLm1hcChzID0+IHMubWF0Y2goL15cXGQrLykpXG5cbiAgICAgICAgICAvLyBJZiBhcmUgbnVtYmVyIHByZWZpeGVkLCBjb21wYXJlIHByZWZpeGVzIGFzIG51bWJlclxuICAgICAgICAgIGlmIChzb3J0QSAmJiBzb3J0QiAmJiBzb3J0QVswXSAhPT0gc29ydEJbMF0pIHtcbiAgICAgICAgICAgIHJldHVybiArc29ydEFbMF0gLSArc29ydEJbMF1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGV4dFNvcnRPcmRlciA9PT0gJ3ZlcnNpb24nKSB7XG4gICAgICAgICAgcmV0dXJuIHZlcnNpb25TdHJpbmdDb21wYXJlKHNvcnRWYWx1ZXNBc1N0cmluZ1swXSwgc29ydFZhbHVlc0FzU3RyaW5nWzFdKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0cmluZ0NvbGxhdG9yLmNvbXBhcmUoc29ydFZhbHVlc0FzU3RyaW5nWzBdLCBzb3J0VmFsdWVzQXNTdHJpbmdbMV0pXG4gICAgICB9XG4gICAgICByZXR1cm4gMFxuICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgQVBJIHVybHMgZnJvbSBhIGJhc2UgdXJsXG4gICAqL1xuICBnZXRBcGlVcmxzIChhcGlVcmw6IHN0cmluZyk6IEFwaUNvbmZpZyB7XG4gICAgaWYgKFxuICAgICAgIWFwaVVybC5zdGFydHNXaXRoKCdodHRwOi8vJykgJiZcbiAgICAgICFhcGlVcmwuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKVxuICAgICkge1xuICAgICAgYXBpVXJsID0gYGh0dHA6Ly8ke2FwaVVybH1gXG4gICAgfVxuXG4gICAgaWYgKGFwaVVybC5lbmRzV2l0aCgnLycpKSB7XG4gICAgICBhcGlVcmwgPSBhcGlVcmwuc2xpY2UoMCwgLTEpXG4gICAgfVxuXG4gICAgY29uc3Qgc29ja2V0VXJsID0gbmV3IFVSTChhcGlVcmwpXG5cbiAgICBzb2NrZXRVcmwucHJvdG9jb2wgPSBzb2NrZXRVcmwucHJvdG9jb2wgPT09ICdodHRwczonXG4gICAgICA/ICd3c3M6Ly8nXG4gICAgICA6ICd3czovLydcbiAgICBzb2NrZXRVcmwucGF0aG5hbWUgKz0gc29ja2V0VXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcvJylcbiAgICAgID8gJ3dlYnNvY2tldCdcbiAgICAgIDogJy93ZWJzb2NrZXQnXG5cbiAgICByZXR1cm4ge1xuICAgICAgYXBpVXJsLFxuICAgICAgc29ja2V0VXJsOiBzb2NrZXRVcmwudG9TdHJpbmcoKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVGVsbHMgdXMgaWYgYSBjb2xvciBpcyBjb25zaWRlcmVkIGRhcmsgb3IgbGlnaHRcbiAgICovXG4gIGlzQ29sb3JEYXJrIChjb2xvcjogc3RyaW5nKSB7XG4gICAgY29uc3QgdCA9IG5ldyBUaW55Q29sb3IoY29sb3IpLmdldEJyaWdodG5lc3MoKVxuICAgIHJldHVybiAoKHQgLyAyNTUpICogMTAwKSA8PSA1MFxuICB9LFxuXG4gIC8qKlxuICAgKiBTaW1wbGUgYXBwcm9hY2ggdG8gcm91dGUgc29tZXdoZXJlIHdoZW4gd2UgZG9uJ3QgbmVjZXNzYXJpbHkgd2FudFxuICAgKiByb3V0ZSBtYXRjaGluZyB2aWEgOnRvXG4gICAqL1xuICByb3V0ZVRvIChyb3V0ZXI6IFZ1ZVJvdXRlciwgcGF0aDogc3RyaW5nKSB7XG4gICAgaWYgKHJvdXRlci5jdXJyZW50Um91dGUuZnVsbFBhdGggIT09IHBhdGgpIHJvdXRlci5wdXNoKHBhdGgpXG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgZ2l2ZW4gd2VpZ2h0IChpbiBncmFtcykgdG8gaXRzIGNvcnJlc3BvbmRpbmcgbGVuZ3RoIChpbiBtbSlcbiAgICovXG4gIGNvbnZlcnRGaWxhbWVudFdlaWdodFRvTGVuZ3RoICh3ZWlnaHQ6IG51bWJlciwgZGVuc2l0eTogbnVtYmVyLCBkaWFtZXRlcjogbnVtYmVyKSB7XG4gICAgLy8gbFttbV0gPSBtW2ddL0RbZy9jbcKzXS9BW21twrJdKigxMDAwbW3Csy9jbcKzKVxuICAgIHJldHVybiB3ZWlnaHQgLyBkZW5zaXR5IC8gKE1hdGguUEkgKiAoZGlhbWV0ZXIgLyAyKSAqKiAyKSAqIDEwMDBcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgUnVsZXMgPSB7XG4gIHJlcXVpcmVkICh2OiB1bmtub3duKSB7XG4gICAgcmV0dXJuICgodiA/PyAnJykgIT09ICcnKSB8fCBpMThuLnQoJ2FwcC5nZW5lcmFsLnNpbXBsZV9mb3JtLmVycm9yLnJlcXVpcmVkJylcbiAgfSxcblxuICBudW1iZXJWYWxpZCAodjogdW5rbm93bikge1xuICAgIHJldHVybiAhaXNOYU4oKyh2ID8/IE5hTikpIHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IuaW52YWxpZF9udW1iZXInKVxuICB9LFxuXG4gIG51bWJlckdyZWF0ZXJUaGFuIChtaW46IG51bWJlcikge1xuICAgIHJldHVybiAodjogbnVtYmVyKSA9PiB2ID4gbWluIHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWluJywgeyBtaW46IGA+ICR7bWlufWAgfSlcbiAgfSxcblxuICBudW1iZXJHcmVhdGVyVGhhbk9yRXF1YWwgKG1pbjogbnVtYmVyKSB7XG4gICAgcmV0dXJuICh2OiBudW1iZXIpID0+IHYgPj0gbWluIHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWluJywgeyBtaW4gfSlcbiAgfSxcblxuICBudW1iZXJHcmVhdGVyVGhhbk9yRXF1YWxPclplcm8gKG1pbjogbnVtYmVyKSB7XG4gICAgcmV0dXJuICh2OiBudW1iZXIpID0+ICt2ID09PSAwIHx8IHYgPj0gbWluIHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWluX29yXzAnLCB7IG1pbiB9KVxuICB9LFxuXG4gIG51bWJlckdyZWF0ZXJUaGFuT3JaZXJvIChtaW46IG51bWJlcikge1xuICAgIHJldHVybiAodjogbnVtYmVyKSA9PiArdiA9PT0gMCB8fCB2ID4gbWluIHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWluX29yXzAnLCB7IG1pbjogYD4gJHttaW59YCB9KVxuICB9LFxuXG4gIG51bWJlckxlc3NUaGFuIChtYXg6IG51bWJlcikge1xuICAgIHJldHVybiAodjogbnVtYmVyKSA9PiB2IDwgbWF4IHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWF4JywgeyBtYXg6IGA8ICR7bWF4fWAgfSlcbiAgfSxcblxuICBudW1iZXJMZXNzVGhhbk9yRXF1YWwgKG1heDogbnVtYmVyKSB7XG4gICAgcmV0dXJuICh2OiBudW1iZXIpID0+IHYgPD0gbWF4IHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWF4JywgeyBtYXggfSlcbiAgfSxcblxuICBudW1iZXJMZXNzVGhhbk9yRXF1YWxPclplcm8gKG1heDogbnVtYmVyKSB7XG4gICAgcmV0dXJuICh2OiBudW1iZXIpID0+ICt2ID09PSAwIHx8IHYgPD0gbWF4IHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWF4JywgeyBtYXggfSlcbiAgfSxcblxuICBudW1iZXJMZXNzVGhhbk9yWmVybyAobWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gKHY6IG51bWJlcikgPT4gK3YgPT09IDAgfHwgdiA8IG1heCB8fCBpMThuLnQoJ2FwcC5nZW5lcmFsLnNpbXBsZV9mb3JtLmVycm9yLm1heCcsIHsgbWF4IH0pXG4gIH0sXG5cbiAgbGVuZ3RoR3JlYXRlclRoYW5PckVxdWFsIChtaW46IG51bWJlcikge1xuICAgIHJldHVybiAodjogc3RyaW5nIHwgdW5rbm93bltdKSA9PiB2Lmxlbmd0aCA+PSBtaW4gfHwgaTE4bi50KCdhcHAuZ2VuZXJhbC5zaW1wbGVfZm9ybS5lcnJvci5taW4nLCB7IG1pbiB9KVxuICB9LFxuXG4gIGxlbmd0aExlc3NUaGFuT3JFcXVhbCAobWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gKHY6IHN0cmluZyB8IHVua25vd25bXSkgPT4gdi5sZW5ndGggPD0gbWF4IHx8IGkxOG4udCgnYXBwLmdlbmVyYWwuc2ltcGxlX2Zvcm0uZXJyb3IubWF4JywgeyBtYXggfSlcbiAgfSxcblxuICBudW1iZXJBcnJheVZhbGlkICh2OiB1bmtub3duW10pIHtcbiAgICByZXR1cm4gIXYuc29tZShpID0+IGkgPT09ICcnIHx8IGlzTmFOKCsoaSA/PyBOYU4pKSkgfHwgaTE4bi50KCdhcHAuZ2VuZXJhbC5zaW1wbGVfZm9ybS5lcnJvci5hcnJheW9mbnVtcycpXG4gIH0sXG5cbiAgcGFzc3dvcmROb3RFcXVhbFVzZXJuYW1lICh1c2VybmFtZT86IHN0cmluZyB8IG51bGwpIHtcbiAgICByZXR1cm4gKHY6IHN0cmluZykgPT4gKHYudG9Mb3dlckNhc2UoKSAhPT0gKHVzZXJuYW1lID8/ICcnKS50b0xvd2VyQ2FzZSgpKSB8fCBpMThuLnQoJ2FwcC5nZW5lcmFsLnNpbXBsZV9mb3JtLmVycm9yLnBhc3N3b3JkX3VzZXJuYW1lJylcbiAgfSxcblxuICBhc3BlY3RSYXRpb1ZhbGlkICh2OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gL15cXGQrXFxzKls6L11cXHMqXFxkKyQvLnRlc3QodikgfHwgaTE4bi50KCdhcHAuZ2VuZXJhbC5zaW1wbGVfZm9ybS5lcnJvci5pbnZhbGlkX2FzcGVjdCcpXG4gIH0sXG5cbiAgcmVnRXhwUGF0dGVyblZhbGlkICh2OiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ld1xuICAgICAgbmV3IFJlZ0V4cCh2KVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gaTE4bi50KCdhcHAuZ2VuZXJhbC5zaW1wbGVfZm9ybS5lcnJvci5pbnZhbGlkX2V4cHJlc3Npb24nKVxuICAgIH1cbiAgfSxcblxuICByZWdFeHBWYWxpZCAocmVnRXhwOiBSZWdFeHAsIGVycm9yTWVzc2FnZTogc3RyaW5nIHwgVHJhbnNsYXRlUmVzdWx0KSB7XG4gICAgcmV0dXJuICh2OiBzdHJpbmcpID0+IHJlZ0V4cC50ZXN0KHYpIHx8IGVycm9yTWVzc2FnZSB8fCAnSW52YWxpZCdcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgRmlsdGVyc1BsdWdpbiA9IHtcbiAgaW5zdGFsbCAoVnVlOiB0eXBlb2YgX1Z1ZSkge1xuICAgIFZ1ZS5wcm90b3R5cGUuJGZpbHRlcnMgPSBGaWx0ZXJzXG4gICAgVnVlLnByb3RvdHlwZS4kcnVsZXMgPSBSdWxlc1xuICAgIFZ1ZS5wcm90b3R5cGUuJGdsb2JhbHMgPSBHbG9iYWxzXG4gICAgVnVlLnByb3RvdHlwZS4kd2FpdHMgPSBXYWl0c1xuICAgIFZ1ZS4kZmlsdGVycyA9IEZpbHRlcnNcbiAgICBWdWUuJHJ1bGVzID0gUnVsZXNcbiAgICBWdWUuJGdsb2JhbHMgPSBHbG9iYWxzXG4gICAgVnVlLiR3YWl0cyA9IFdhaXRzXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ3Z1ZS90eXBlcy92dWUnIHtcbiAgaW50ZXJmYWNlIFZ1ZSB7XG4gICAgJGZpbHRlcnM6IHR5cGVvZiBGaWx0ZXJzO1xuICAgICRydWxlczogdHlwZW9mIFJ1bGVzO1xuICAgICRnbG9iYWxzOiB0eXBlb2YgR2xvYmFscztcbiAgICAkd2FpdHM6IHR5cGVvZiBXYWl0cztcbiAgfVxuXG4gIGludGVyZmFjZSBWdWVDb25zdHJ1Y3RvciB7XG4gICAgJGZpbHRlcnM6IHR5cGVvZiBGaWx0ZXJzO1xuICAgICRydWxlczogdHlwZW9mIFJ1bGVzO1xuICAgICRnbG9iYWxzOiB0eXBlb2YgR2xvYmFscztcbiAgICAkd2FpdHM6IHR5cGVvZiBXYWl0cztcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFVBQVU7QUFDakIsT0FBTyxlQUFlO0FBQ3RCLFNBQVMsV0FBVyxXQUFXLFlBQVksVUFBVSxrQkFBa0I7QUFFdkUsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxhQUFhLFNBQVMsYUFBYSxhQUFrQztBQUM5RSxPQUFPLFVBQVU7QUFFakIsT0FBTyxXQUFXO0FBRWxCLE9BQU8sMEJBQTBCO0FBS2pDLE1BQU0saUJBQWlCLENBQUMsS0FBVSxNQUEyQixhQUF3QjtBQUNuRixRQUFNLE9BQU8sS0FBSyxTQUFTO0FBRTNCLE1BQUksT0FBTyxFQUFHLFFBQU8sUUFBUSxTQUFZLFdBQVc7QUFFcEQsV0FBUyxJQUFJLEdBQUcsSUFBSSxNQUFNLEtBQUs7QUFDN0IsUUFBSSxPQUFPLE1BQU07QUFDZixhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sSUFBSSxLQUFLLENBQUMsQ0FBQztBQUFBLEVBQ25CO0FBRUEsTUFBSSxPQUFPLEtBQU0sUUFBTztBQUV4QixTQUFPLElBQUksS0FBSyxJQUFJLENBQUMsTUFBTSxTQUFZLFdBQVcsSUFBSSxLQUFLLElBQUksQ0FBQztBQUNsRTtBQUtBLE1BQU0sdUJBQXVCLENBQUMsS0FBVSxNQUFjLGFBQXdCO0FBRTVFLE1BQUksT0FBTyxRQUFRLENBQUMsUUFBUSxPQUFPLFNBQVMsU0FBVSxRQUFPO0FBQzdELE1BQUksSUFBSSxJQUFJLE1BQU0sT0FBVyxRQUFPLElBQUksSUFBSTtBQUM1QyxTQUFPLEtBQUssUUFBUSxjQUFjLEtBQUs7QUFDdkMsU0FBTyxLQUFLLFFBQVEsT0FBTyxFQUFFO0FBQzdCLFNBQU8sZUFBZSxLQUFLLEtBQUssTUFBTSxHQUFHLEdBQUcsUUFBUTtBQUN0RDtBQUVPLGFBQU0sVUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNckIsc0JBQXNCLENBQUMsWUFBNkI7QUFDbEQsY0FB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