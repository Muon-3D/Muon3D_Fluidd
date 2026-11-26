import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import VueI18n, {} from "/.vite-e2e/4291/deps/vue-i18n.js?v=9b9fafc7";
import { SupportedLocales } from "/src/globals.ts";
import getBrowserLocale from "/src/util/get-browser-locale.ts";
import messages from "/src/locales/en.yaml?import";
import { I18nLocales } from "/src/dynamicImports.ts";
Vue.use(VueI18n);
export const getStartingLocale = () => {
  const browserLocale = getBrowserLocale({ countryCodeOnly: true });
  if (browserLocale && SupportedLocales.findIndex((locale) => locale.code === browserLocale) >= 0) {
    return browserLocale;
  } else {
    return import.meta.env.VUE_APP_I18N_LOCALE || "en";
  }
};
const startingLocale = getStartingLocale();
const i18n = new VueI18n({
  locale: startingLocale,
  fallbackLocale: import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || "en",
  messages: {}
});
i18n.setLocaleMessage("en", messages);
const loadedLanguages = [];
export const loadLocaleMessagesAsync = async (locale) => {
  if (loadedLanguages.length > 0 && i18n.locale === locale) {
    return locale;
  }
  if (loadedLanguages.includes(locale)) {
    i18n.locale = locale;
    return locale;
  }
  try {
    const messages2 = await I18nLocales[locale]();
    i18n.setLocaleMessage(locale, messages2);
    loadedLanguages.push(locale);
    i18n.locale = locale;
    return locale;
  } catch {
    return i18n.locale;
  }
};
loadLocaleMessagesAsync(startingLocale);
export default i18n;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImkxOG4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgVnVlSTE4biwgeyB0eXBlIExvY2FsZSB9IGZyb20gJ3Z1ZS1pMThuJ1xuaW1wb3J0IHsgU3VwcG9ydGVkTG9jYWxlcyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCBnZXRCcm93c2VyTG9jYWxlIGZyb20gJ0AvdXRpbC9nZXQtYnJvd3Nlci1sb2NhbGUnXG5pbXBvcnQgbWVzc2FnZXMgZnJvbSAnQC9sb2NhbGVzL2VuLnlhbWwnXG5pbXBvcnQgeyBJMThuTG9jYWxlcyB9IGZyb20gJ0AvZHluYW1pY0ltcG9ydHMnXG5cblZ1ZS51c2UoVnVlSTE4bilcblxuLyoqXG4gKiBMb2FkcyB0aGUgc3RhcnRpbmcgbG9jYWxlIGZvciB0aGUgdXNlci5cbiAqL1xuZXhwb3J0IGNvbnN0IGdldFN0YXJ0aW5nTG9jYWxlID0gKCkgPT4ge1xuICBjb25zdCBicm93c2VyTG9jYWxlID0gZ2V0QnJvd3NlckxvY2FsZSh7IGNvdW50cnlDb2RlT25seTogdHJ1ZSB9KVxuICBpZiAoXG4gICAgYnJvd3NlckxvY2FsZSAmJlxuICAgIFN1cHBvcnRlZExvY2FsZXMuZmluZEluZGV4KGxvY2FsZSA9PiBsb2NhbGUuY29kZSA9PT0gYnJvd3NlckxvY2FsZSkgPj0gMCkge1xuICAgIHJldHVybiBicm93c2VyTG9jYWxlXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGltcG9ydC5tZXRhLmVudi5WVUVfQVBQX0kxOE5fTE9DQUxFIHx8ICdlbidcbiAgfVxufVxuXG5jb25zdCBzdGFydGluZ0xvY2FsZSA9IGdldFN0YXJ0aW5nTG9jYWxlKClcblxuY29uc3QgaTE4biA9IG5ldyBWdWVJMThuKHtcbiAgbG9jYWxlOiBzdGFydGluZ0xvY2FsZSxcbiAgZmFsbGJhY2tMb2NhbGU6IGltcG9ydC5tZXRhLmVudi5WVUVfQVBQX0kxOE5fRkFMTEJBQ0tfTE9DQUxFIHx8ICdlbicsXG4gIG1lc3NhZ2VzOiB7fVxufSlcblxuLy8gUHJlIGFwcGx5IHRoZSBlbiBsYW5ndWFnZSBmb3IgZmFsbGJhY2suXG5pMThuLnNldExvY2FsZU1lc3NhZ2UoJ2VuJywgbWVzc2FnZXMpXG5cbmNvbnN0IGxvYWRlZExhbmd1YWdlczogTG9jYWxlW10gPSBbXVxuXG5leHBvcnQgY29uc3QgbG9hZExvY2FsZU1lc3NhZ2VzQXN5bmMgPSBhc3luYyAobG9jYWxlOiBMb2NhbGUpID0+IHtcbiAgLy8gSWYgYWxyZWFkeSBsb2FkZWQsIGFuZCBjdXJyZW50bHkgc2VsZWN0ZWQuXG4gIGlmIChsb2FkZWRMYW5ndWFnZXMubGVuZ3RoID4gMCAmJiBpMThuLmxvY2FsZSA9PT0gbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZVxuICB9XG5cbiAgLy8gSWYgYWxyZWFkeSBsb2FkZWQsIGJ1dCBub3QgdGhlIGN1cnJlbnRseSBzZWxlY3RlZC5cbiAgaWYgKGxvYWRlZExhbmd1YWdlcy5pbmNsdWRlcyhsb2NhbGUpKSB7XG4gICAgaTE4bi5sb2NhbGUgPSBsb2NhbGVcbiAgICByZXR1cm4gbG9jYWxlXG4gIH1cblxuICAvLyBOb3QgbG9hZGVkXG4gIHRyeSB7XG4gICAgY29uc3QgbWVzc2FnZXMgPSBhd2FpdCBJMThuTG9jYWxlc1tsb2NhbGVdKClcblxuICAgIGkxOG4uc2V0TG9jYWxlTWVzc2FnZShsb2NhbGUsIG1lc3NhZ2VzKVxuICAgIGxvYWRlZExhbmd1YWdlcy5wdXNoKGxvY2FsZSlcbiAgICBpMThuLmxvY2FsZSA9IGxvY2FsZVxuICAgIHJldHVybiBsb2NhbGVcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGkxOG4ubG9jYWxlXG4gIH1cbn1cblxubG9hZExvY2FsZU1lc3NhZ2VzQXN5bmMoc3RhcnRpbmdMb2NhbGUpXG5cbmV4cG9ydCBkZWZhdWx0IGkxOG5cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBQ2hCLE9BQU8saUJBQThCO0FBQ3JDLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sc0JBQXNCO0FBQzdCLE9BQU8sY0FBYztBQUNyQixTQUFTLG1CQUFtQjtBQUU1QixJQUFJLElBQUksT0FBTztBQUtSLGFBQU0sb0JBQW9CLE1BQU07QUFDckMsUUFBTSxnQkFBZ0IsaUJBQWlCLEVBQUUsaUJBQWlCLEtBQUssQ0FBQztBQUNoRSxNQUNFLGlCQUNBLGlCQUFpQixVQUFVLFlBQVUsT0FBTyxTQUFTLGFBQWEsS0FBSyxHQUFHO0FBQzFFLFdBQU87QUFBQSxFQUNULE9BQU87QUFDTCxXQUFPLFlBQVksSUFBSSx1QkFBdUI7QUFBQSxFQUNoRDtBQUNGO0FBRUEsTUFBTSxpQkFBaUIsa0JBQWtCO0FBRXpDLE1BQU0sT0FBTyxJQUFJLFFBQVE7QUFBQSxFQUN2QixRQUFRO0FBQUEsRUFDUixnQkFBZ0IsWUFBWSxJQUFJLGdDQUFnQztBQUFBLEVBQ2hFLFVBQVUsQ0FBQztBQUNiLENBQUM7QUFHRCxLQUFLLGlCQUFpQixNQUFNLFFBQVE7QUFFcEMsTUFBTSxrQkFBNEIsQ0FBQztBQUU1QixhQUFNLDBCQUEwQixPQUFPLFdBQW1CO0FBRS9ELE1BQUksZ0JBQWdCLFNBQVMsS0FBSyxLQUFLLFdBQVcsUUFBUTtBQUN4RCxXQUFPO0FBQUEsRUFDVDtBQUdBLE1BQUksZ0JBQWdCLFNBQVMsTUFBTSxHQUFHO0FBQ3BDLFNBQUssU0FBUztBQUNkLFdBQU87QUFBQSxFQUNUO0FBR0EsTUFBSTtBQUNGLFVBQU1BLFlBQVcsTUFBTSxZQUFZLE1BQU0sRUFBRTtBQUUzQyxTQUFLLGlCQUFpQixRQUFRQSxTQUFRO0FBQ3RDLG9CQUFnQixLQUFLLE1BQU07QUFDM0IsU0FBSyxTQUFTO0FBQ2QsV0FBTztBQUFBLEVBQ1QsUUFBUTtBQUNOLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFDRjtBQUVBLHdCQUF3QixjQUFjO0FBRXRDLGVBQWU7IiwibmFtZXMiOlsibWVzc2FnZXMiXX0=