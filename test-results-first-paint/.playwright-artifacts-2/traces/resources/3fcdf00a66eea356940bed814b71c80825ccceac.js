/* unplugin-vue-components disabled */import __unplugin_components_19 from "/src/components/ui/AppDragOverlay.vue";
import __unplugin_components_18 from "/src/components/layout/AppFooter.vue";
import __unplugin_components_17 from "/src/components/common/ActionCommandPromptDialog.vue";
import __unplugin_components_16 from "/src/components/common/UpdatingDialog.vue";
import __unplugin_components_15 from "/src/components/layout/CommandBar.vue";
import __unplugin_components_14 from "/src/components/common/KeyboardShortcutsDialog.vue";
import __unplugin_components_13 from "/src/components/layout/ConnectingScreen.vue";
import __unplugin_components_12 from "/src/components/common/RegisterServiceWorker.vue";
import __unplugin_components_11 from "/src/components/layout/SecureAddressBanner.vue";
import __unplugin_components_10 from "/src/components/layout/BluetoothFallbackBanner.vue";
import __unplugin_components_9 from "/src/components/layout/ConnectionBanner.vue";
import __unplugin_components_8 from "/src/components/layout/AppPageTitle.vue";
import { VContainer as __unplugin_components_7 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VMain as __unplugin_components_6 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import __unplugin_components_5 from "/src/components/layout/AppTabBar.vue";
import __unplugin_components_4 from "/src/components/common/FlashMessage.vue";
import __unplugin_components_3 from "/src/components/layout/AppBar.vue";
import __unplugin_components_2 from "/src/components/layout/AppRail.vue";
import { VApp as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
import { VApp as __unplugin_components_0 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Mixins, Watch } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { progressFavicon } from "/src/util/progress-favicon.ts";
import { EventBus } from "/src/eventBus.ts";
import StateMixin from "/src/mixins/state.ts";
import FilesMixin from "/src/mixins/files.ts";
import BrowserMixin from "/src/mixins/browser.ts";
import FileSystemDownloadDialog from "/src/components/widgets/filesystem/FileSystemDownloadDialog.vue";
import SpoolSelectionDialog from "/src/components/widgets/spoolman/SpoolSelectionDialog.vue";
import { getFilesFromDataTransfer, hasFilesInDataTransfer } from "/src/util/file-system-entry.ts";
import ActionCommandPromptDialog from "/src/components/common/ActionCommandPromptDialog.vue";
import KeyboardShortcutsDialog from "/src/components/common/KeyboardShortcutsDialog.vue";
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from "/src/util/event-helpers.ts";
import { isManagedConsolePath } from "/src/router/managedPath.ts";
import {
  activeSlug,
  foreignRecordForSlug,
  isActiveSlug,
  isForeignSlug,
  printerHomePath,
  printerPageNeedsLogin,
  samePageFor,
  stepPrinter
} from "/src/services/printer-pages/index.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import PrinterOpening from "/src/components/muon-cloud/PrinterOpening.vue";
import ConnectionBanner from "/src/components/layout/ConnectionBanner.vue";
import UploadProgress from "/src/components/jobs/UploadProgress.vue";
import ConnectingScreen from "/src/components/layout/ConnectingScreen.vue";
import UpdatingScreen from "/src/components/updates/UpdatingScreen.vue";
import UpdateBanner from "/src/components/updates/UpdateBanner.vue";
import { installStarted, printerLost, updateWatch, watchUpdates } from "/src/services/updates/watch.ts";
import { afterPrint, afterPrintDue, cancelAfterPrint, loadAfterPrint, otaComponent } from "/src/services/updates/after-print.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { bannerVisible, offlineScreen } from "/src/services/updates/model.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import { connectionView } from "/src/services/connection/view.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { accountQuickKey } from "/src/services/console/settings.ts";
import { bluetoothCarrying } from "/src/services/muon-ble/link.ts";
import { activationState } from "/src/services/muon-cloud/activate.ts";
import { consolePresence } from "/src/services/muon-cloud/presence.ts";
import FrameMixin from "/src/mixins/frame.ts";
import { ACCOUNT_KEY, ALL_PRINTERS_KEY, LIBRARY_KEY, PAGE_KEYS, pageLabel, sectionForKey } from "/src/router/printerSections.ts";
import { pageOfRoute, scopedPath } from "/src/router/printerPagePaths.ts";
import { GoKeys } from "/src/util/go-keys.ts";
import { isGcodeFile, isModelFile } from "/src/services/jobs/model.ts";
import JobReadyDialog from "/src/components/jobs/JobReadyDialog.vue";
import { loaderCanGo, rememberTheme, removeLoader, startupState } from "/src/services/startup/loader.ts";
import { firstPaintEnabled } from "/src/services/flags/index.ts";
import { firstPaintState, reportStartup } from "/src/services/startup/first-paint/state.ts";
import { ENTRY_MARK } from "/src/services/startup/first-paint/progress.ts";
import { saveSnapshotStatus } from "/src/services/startup/snapshot.ts";
import { deletionState, deletionBlocksView } from "/src/services/muon-cloud/deletion.ts";
import { Globals } from "/src/globals.ts";
let App = class extends Mixins(StateMixin, FrameMixin, FilesMixin, BrowserMixin) {
  get deletionPending() {
    return deletionState.deleteAfter !== null;
  }
  get deletionCloudView() {
    return this.deletionPending && deletionBlocksView(this.$route.name);
  }
  dragState = false;
  customBackgroundImageStyle = {};
  goKeys = new GoKeys();
  flashMessageState = {
    open: false,
    text: void 0,
    type: void 0
  };
  // Until the first navigation resolves, $route is still /. A lazy route such
  // as /setup would otherwise mount the whole shell for a moment, and the
  // printer switcher in it starts a network search the setup page must never
  // make (it may reach only the printer).
  routerReady = false;
  /** When App mounted, for the loader's 6 s hold on the connecting screen. */
  mountedAt = 0;
  created() {
    const ready = () => {
      this.routerReady = true;
    };
    this.$router.onReady(ready, ready);
  }
  /**
   * Whether the index.html loader can go (KAN-525): the first route resolved,
   * and a loader showing the cached last state doesn't wait on the connecting
   * screen past 6 s.
   */
  get loaderReady() {
    return loaderCanGo({
      routerReady: this.routerReady,
      screen: this.connection.screen,
      cachedShown: startupState.cachedShown,
      msSinceMount: performance.now() - this.mountedAt
    }) && !firstPaintState.holding;
  }
  /**
   * What start-up has really reached, for first paint's rim (KAN-5929). Only
   * with the flag on: off, it is null and nothing watches it.
   */
  get startupFacts() {
    if (!firstPaintEnabled()) return null;
    const info = this.$store.getters["server/getInfo"];
    return {
      loaderMark: ENTRY_MARK,
      routerReady: this.routerReady,
      screen: this.connection.screen,
      socketOpen: this.socketConnected,
      klippyState: info.klippy_state ?? "",
      klippyConnected: !!info.klippy_connected,
      socketReady: !!this.$store.state.socket.ready
    };
  }
  onStartupFacts(facts) {
    if (facts) reportStartup(facts);
  }
  onLoaderReady(ready) {
    if (ready) this.dismissLoader();
  }
  dismissLoader() {
    this.$nextTick(() => requestAnimationFrame(() => {
      removeLoader();
    }));
  }
  onThemeDark(isDark) {
    rememberTheme(isDark);
  }
  /** Whose Look and Ask before apply: the signed-in account's, else anyone's here. */
  get personalKey() {
    return accountQuickKey(cloudState);
  }
  onPersonalKey(key) {
    this.$store.dispatch("config/applyPersonal", key);
  }
  get theme() {
    return this.$store.state.config.uiSettings.theme;
  }
  get primaryColor() {
    return this.$vuetify.theme.currentTheme.primary?.toString() ?? "";
  }
  get primaryOffsetColor() {
    return this.$vuetify.theme.currentTheme["primary-offset"]?.toString() ?? "";
  }
  // Our app is in a loading state when the socket isn't quite ready, or
  // our translations are loading.
  get updating() {
    return this.$store.state.version.busy;
  }
  /**
   * A page for a printer Fluidd isn't on (yet): it shows that printer opening,
   * never the last printer's page under this printer's address.
   */
  get otherPrinterRoute() {
    const slug = this.$route.params.printer;
    return !!slug && !this.printerIndependentRoute && !isForeignSlug(slug) && !isActiveSlug(slug);
  }
  get foreignPrinterRoute() {
    return isForeignSlug(this.$route.params.printer);
  }
  get printerIndependentRoute() {
    return this.$route.meta?.printerIndependent === true;
  }
  /** A printer opened by its address asks for its own login once it is on (printerPageNeedsLogin). */
  get needsLogin() {
    return printerPageNeedsLogin({
      apiConnected: this.apiConnected,
      authenticated: this.authenticated,
      managed: this.cloudPrinter,
      routePrinter: this.$route.params.printer,
      routeName: this.$route.name,
      printerIndependent: this.printerIndependentRoute
    });
  }
  onNeedsLogin(needs) {
    if (needs) this.$router.replace("/login").catch(() => {
    });
  }
  /** The printer is reached through Muon3D, so it never has Moonraker's login. */
  get cloudPrinter() {
    return isManagedApiUrl(this.$store.state.config.apiUrl);
  }
  /**
   * The login page with nothing to sign in to: a cloud printer, or a
   * printer that turned out to let this browser in. Its own guard checks
   * only on the way in, so a page that went to /login while a printer was
   * opening stayed there after the printer answered.
   */
  get loginNotWanted() {
    return this.$route.name === "Login" && (this.cloudPrinter || this.authenticated && this.socketConnected);
  }
  onLoginNotWanted(leave) {
    if (leave) this.$router.replace(printerHomePath()).catch(() => {
    });
  }
  /** The printer has said nothing for a few seconds; the page stays up while Fluidd waits. */
  get socketStalled() {
    return this.$store.state.socket.stalled && this.$store.state.socket.open;
  }
  /** Fluidd has reached the printer it is on since it was chosen, so a drop keeps the page. */
  wasConnected = false;
  onSocketConnected(connected) {
    if (connected) this.wasConnected = true;
    if (connected && this.printerFrame) {
      this.watchPrinterUpdates();
    } else if (!connected && this.wasConnected) {
      printerLost();
    }
  }
  onPrinterFrame(frame) {
    if (frame && this.socketConnected) this.watchPrinterUpdates();
  }
  watchPrinterUpdates() {
    watchUpdates(activeSlug() ?? String(this.$store.state.config.apiUrl ?? ""), (url) => this.$httpClient.get(url, { validateStatus: () => true }), !!this.cloudPrinter);
  }
  /** "Install after this print": what it waits on. */
  get afterPrintKey() {
    return [updateWatch.printer, this.printerState, updateWatch.status?.target_version ?? "", afterPrint.printer, afterPrint.queued?.at ?? ""].join("|");
  }
  onAfterPrint() {
    if (!updateWatch.printer || !updateWatch.answered) return;
    const queued = loadAfterPrint(updateWatch.printer);
    if (!queued) return;
    const due = afterPrintDue(queued, this.printerState, updateWatch.status, Date.now());
    if (due === "drop") cancelAfterPrint();
    if (due !== "install" || !this.socketConnected || !this.klippyConnected) return;
    cancelAfterPrint();
    SocketActions.machineUpdateClient(otaComponent(this.$store.state.version.version_info));
    installStarted(queued.from, queued.to);
  }
  get displayName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name;
  }
  /** The bar over every page while the printer installs an update, but on the Updating page itself. */
  get showUpdateBanner() {
    if (this.foreignPrinterRoute) return false;
    const r = updateWatch.remembered;
    return bannerVisible(r, updateWatch.now, updateWatch.answered) && this.printerFrame && this.socketConnected && this.$route.name !== "Updating" && updateWatch.printer === (activeSlug() ?? "");
  }
  onPrinterChanged() {
    this.wasConnected = this.socketConnected;
  }
  /** What the connection shows: the page, a bar over it, or a screen of its own (services/connection/view). */
  get connection() {
    if (this.foreignPrinterRoute) return { page: true, stale: false, banner: null, screen: null };
    const printer = cloudState.printers.find((p) => p.id === cloudState.activePrinterId);
    const status = printer ? cloudState.status[printer.id] : void 0;
    const overBluetooth = !!printer && bluetoothCarrying(printer.id) && this.socketConnected && this.apiConnected;
    const silent = !!status && !status.reachable && status.error === "offline";
    const presence = !printer || overBluetooth ? "online" : silent ? "offline" : consolePresence(printer, status?.updatedAt ?? Date.now());
    return connectionView({
      socketConnected: this.socketConnected,
      apiConnected: this.apiConnected,
      authenticated: this.authenticated,
      // A cloud printer being opened is connecting for the whole switch: its
      // first reads take seconds over Iroh, and "Can't reach" showed meanwhile.
      socketConnecting: this.socketConnecting || !!activationState.switching && activationState.switching === cloudState.activePrinterId,
      wasConnected: this.wasConnected,
      stalled: this.socketStalled,
      printerIndependent: this.managedConsoleRoute || this.printerIndependentRoute,
      otherPrinter: this.otherPrinterRoute,
      cloudPresence: presence === "online" ? null : presence,
      updating: !this.socketConnected && updateWatch.printer === (activeSlug() ?? "") ? offlineScreen(updateWatch.remembered, updateWatch.now, updateWatch.answered) : null
    });
  }
  get managedConsoleRoute() {
    return isManagedConsolePath(this.$route.path);
  }
  // The rail is a printer's pages, so only a printer's page has it; Printers
  // and the account's pages use the whole width.
  get showRail() {
    return !this.managedConsoleRoute && this.printerFrame && !this.isMobileViewport;
  }
  /** The rail's width, as AppRail sets it: icons only below the lg breakpoint. */
  get railWidth() {
    return this.$vuetify.breakpoint.mdAndDown ? this.$globals.RAIL_WIDTH_COMPACT : this.$globals.RAIL_WIDTH;
  }
  // Not on /slice: the slicer in its frame has its own bar at the bottom.
  get showTabBar() {
    return !this.managedConsoleRoute && this.printerFrame && this.isMobileViewport && this.authenticated && this.socketConnected && !this.sliceRoute;
  }
  get sliceRoute() {
    return this.$route.name === "Slice" || this.$route.name === "Slice (no printer)";
  }
  /** A framed app that is the page (route meta fullPage: Slice): no padding or width limit, the height under the bar. */
  get fullPage() {
    return !this.managedConsoleRoute && this.$route.meta?.fullPage === true;
  }
  /** The bar's height (AppBar.vue), which a full page fills the rest under. */
  get headerHeight() {
    return this.isMobileViewport ? this.$globals.HEADER_HEIGHT_PHONE : this.$globals.HEADER_HEIGHT;
  }
  // Each printer page is named above its content, with its section's pages
  // as tabs. Not the slicer, which fills the page with its own bar; on a
  // phone the console and G-code preview keep that height for the tool.
  get showPageHeader() {
    if (!this.printerFrame || this.otherPrinterRoute || this.sliceRoute || this.$route.name?.startsWith("Library") || this.$route.name?.startsWith("Account")) return false;
    if (!this.connection.page || this.connection.screen) return false;
    return !(this.isMobileViewport && this.currentPage === "/");
  }
  get columnCount() {
    return this.$store.state.config.containerColumnCount;
  }
  get fileDropRoot() {
    if (this.foreignPrinterRoute) return false;
    return this.$route.meta?.fileDropRoot;
  }
  get loading() {
    return this.hasWait(this.$waits.onLoadLanguage);
  }
  // While a language loads, the shell is blank. Not on /slice: Fluidd's
  // settings are each printer's, so a switch of printer loads that printer's
  // language again, and a blank shell would unmount the slicer's frame, which
  // stays while Fluidd switches. The shell keeps the language it shows until
  // the new one has loaded, so nothing reads untranslated meanwhile.
  get blankedForLanguage() {
    return this.loading && !this.managedConsoleRoute && !this.sliceRoute;
  }
  get progress() {
    const progress = this.$store.getters["printer/getPrintProgress"];
    return Math.floor(progress * 100);
  }
  get pageTitle() {
    if (this.managedConsoleRoute) {
      return `Muon3D | ${this.$route.name ?? "Managed preview"}`;
    }
    const displayName = this.$store.getters["config/getDisplayName"];
    const instanceName = this.foreignPrinterRoute ? foreignRecordForSlug(this.$route.params.printer)?.name ?? "Other printer" : displayName && displayName !== Globals.PRODUCT_NAME ? printerNameParts(displayName).name : Globals.PRODUCT_NAME;
    const pageName = this.$route.params.printer ? pageLabel(pageOfRoute(this.$route)) ?? this.$route.name : this.$route.name;
    return [this.printerPrinting ? `[${this.progress}%]` : "", instanceName, pageName ?? ""].filter(Boolean).join(" | ");
  }
  get pageIcon() {
    if (this.managedConsoleRoute) return [];
    const iconDataUrl = this.printInProgressIconDataUrl || this.defaultIconDataUrl;
    return [
      {
        rel: "icon",
        type: "image/svg+xml",
        sizes: "32x32",
        href: iconDataUrl
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        sizes: "16x16",
        href: iconDataUrl
      }
    ];
  }
  get pageMeta() {
    return [
      {
        name: "theme-color",
        content: this.primaryColor
      }
    ];
  }
  get printInProgressIconDataUrl() {
    if (this.printerPrinting) return progressFavicon(this.progress, this.primaryColor);
  }
  get defaultIconDataUrl() {
    const logoWithColor = `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><g><path fill="${this.primaryOffsetColor}" d="m 14.853368,33.756571 11.61619,9.661168 c 0.130777,0.111917 0.271485,0.207659 0.419213,0.286738 v 0 l 0.0018,9.59e-4 0.04421,0.02288 0.01682,0.0084 0.03004,0.01466 0.02772,0.01301 0.02085,0.0096 0.03643,0.01614 0.0112,0.0048 c 0.261834,0.111457 0.538454,0.172946 0.816165,0.185089 v 0 l 0.0094,4.66e-4 0.04421,0.0014 0.01743,3.11e-4 0.03579,1.57e-4 0.03113,-1.57e-4 0.01976,-3.11e-4 0.04638,-0.0016 0.0066,-1.57e-4 c 0.278332,-0.01219 0.555886,-0.07379 0.818498,-0.185864 v 0 l 0.0076,-0.0031 0.04141,-0.01836 0.01581,-0.0072 0.03019,-0.01433 0.03192,-0.01548 0.01367,-0.0071 0.04375,-0.02273 0.0048,-0.0023 c 0.147428,-0.07893 0.287828,-0.174502 0.418278,-0.28627 v 0 L 40.390591,34.385713 46.037415,38.112852 27.999766,56 9.242502,37.397936 Z m 0.408314,-14.451202 11.425655,7.349201 c 0.406292,0.266969 0.859439,0.40053 1.312586,0.400687 0.452679,0 0.90536,-0.133247 1.311963,-0.400064 v 0 l 11.426278,-7.349045 8.736349,4.462197 -21.47459,17.859067 -21.47459,-17.86031 z M 27.999923,0 52.420045,8.9925786 27.999923,24.698769 3.579955,8.9913323 Z" /><path fill="${this.primaryColor}" d="m 28,0 -0.134766,0.05078125 h 0.150391 V 24.689453 L 52.419922,8.9921875 Z m 12.738281,19.306641 -11.425781,7.347656 -0.05859,0.03906 c -0.386465,0.238992 -0.812514,0.358329 -1.238281,0.361329 v 14.558595 l 21.45898,-17.845703 z m -0.347656,15.080078 -10.859375,9.03125 c -0.13045,0.111767 -0.270596,0.206206 -0.417969,0.285156 l -0.0059,0.002 -0.04297,0.02344 -0.01367,0.0078 -0.0332,0.01563 -0.0293,0.01367 -0.01563,0.0078 -0.04102,0.01758 -0.0078,0.0039 c -0.26261,0.112075 -0.540027,0.173357 -0.818359,0.185547 h -0.0078 l -0.04492,0.002 h -0.02148 -0.01563 V 55.984375 L 46.037109,38.113281 Z" /></g></svg>`;
    return `data:image/svg+xml;base64,${btoa(logoWithColor)}`;
  }
  get customStyleSheet() {
    return this.$store.getters["config/getCustomThemeFile"]("custom", [".css"]);
  }
  /**
   * The active printer's state kept for the next load's cached view
   * (KAN-525), at most once every 5 s; changes inside that are drawn by the
   * next one, and leaving the tab saves on the spot.
   */
  get snapshotStatusLine() {
    const p = this.$store.state.printer.printer;
    if (!p) return "";
    const progress = Math.floor(this.$store.getters["printer/getPrintProgress"] * 100);
    return [
      this.displayName,
      p.print_stats?.state ?? "",
      p.print_stats?.filename ?? "",
      progress,
      Math.round(p.extruder?.temperature ?? 0),
      Math.round(p.heater_bed?.temperature ?? 0)
    ].join("|");
  }
  snapshotSavedAt = 0;
  onSnapshotStatusLine(line) {
    if (!line) return;
    const now = Date.now();
    if (now - this.snapshotSavedAt < 5e3) return;
    this.snapshotSavedAt = now;
    this.saveSnapshotStatus();
  }
  saveSnapshotStatus() {
    const slug = activeSlug();
    const p = this.$store.state.printer.printer;
    if (!slug || !p) return;
    const progress = Math.floor(this.$store.getters["printer/getPrintProgress"] * 100);
    const state = p.print_stats?.state ?? "ready";
    saveSnapshotStatus(slug, {
      name: this.displayName,
      state,
      label: state === "printing" ? `${progress}%` : state === "paused" ? "Paused" : state.charAt(0).toUpperCase() + state.slice(1),
      file: p.print_stats?.filename || null,
      progress,
      nozzle: typeof p.extruder?.temperature === "number" ? Math.round(p.extruder.temperature) : null,
      bed: typeof p.heater_bed?.temperature === "number" ? Math.round(p.heater_bed.temperature) : null
    });
  }
  onVisibilitySave() {
    if (document.hidden) this.saveSnapshotStatus();
  }
  async onCustomStyleSheet(value) {
    if (!value) {
      return;
    }
    const url = await this.createFileUrlWithToken(value, "config");
    const oldCustomStylesheet = document.getElementById("customStylesheet");
    if (oldCustomStylesheet) {
      oldCustomStylesheet.setAttribute("href", url);
      return;
    }
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.type = "text/css";
    linkElement.id = "customStylesheet";
    linkElement.href = url;
    document.head.appendChild(linkElement);
  }
  get customBackgroundImage() {
    return this.$store.getters["config/getCustomThemeFile"]("background", [".png", ".jpg", ".jpeg", ".gif"]);
  }
  async onCustomBackgroundImage(value) {
    if (!value) {
      return;
    }
    const url = await this.createFileUrlWithToken(value, "config");
    this.customBackgroundImageStyle = {
      backgroundImage: `url(${url})`,
      backgroundSize: "cover",
      backgroundAttachment: "fixed",
      backgroundRepeat: "no-repeat"
    };
  }
  get enableKeyboardShortcuts() {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts;
  }
  mounted() {
    this.mountedAt = performance.now();
    setTimeout(() => {
      if (this.loaderReady) this.dismissLoader();
    }, 6e3);
    window.addEventListener("dragover", this.handleDragOver);
    window.addEventListener("dragenter", this.handleDragOver);
    window.addEventListener("dragleave", this.handleDragLeave);
    window.addEventListener("drop", this.handleDrop);
    window.addEventListener("keydown", this.handleKeyDown, false);
    document.addEventListener("visibilitychange", this.onVisibilitySave);
    this.darkQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    this.darkQuery?.addEventListener?.("change", this.onSystemDark);
    EventBus.bus.$on("flashMessage", (payload) => {
      this.flashMessageState.text = payload && payload.text || void 0;
      this.flashMessageState.type = payload && payload.type || void 0;
      this.flashMessageState.timeout = payload && payload.timeout !== void 0 ? payload.timeout : void 0;
      this.$set(this.flashMessageState, "action", payload?.action);
      this.flashMessageState.open = true;
    });
    const legacyElementsSelectors = [
      "link[rel*='icon'][type='image/png']",
      "meta[name='theme-color']"
    ];
    for (const legacyElementsSelector of legacyElementsSelectors) {
      const legacyElements = document.querySelectorAll(legacyElementsSelector);
      legacyElements.forEach((item) => {
        const parentElement = item.parentElement;
        if (parentElement) {
          parentElement.removeChild(item);
        }
      });
    }
  }
  beforeDestroy() {
    window.removeEventListener("dragover", this.handleDragOver);
    window.removeEventListener("dragenter", this.handleDragOver);
    window.removeEventListener("dragleave", this.handleDragLeave);
    window.removeEventListener("drop", this.handleDrop);
    window.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibilitySave);
    this.darkQuery?.removeEventListener?.("change", this.onSystemDark);
  }
  darkQuery = null;
  onSystemDark(event) {
    this.$store.dispatch("config/applySystemDark", event.matches);
  }
  handleDragOver(event) {
    if (this.fileDropRoot && event.dataTransfer && hasFilesInDataTransfer(event.dataTransfer)) {
      event.preventDefault();
      this.dragState = true;
      event.dataTransfer.dropEffect = "copy";
    }
  }
  handleDragLeave(event) {
    if (this.fileDropRoot) {
      event.preventDefault();
      if (event.target instanceof HTMLElement && event.target.className.includes("fluidd")) {
        this.dragState = false;
      }
    }
  }
  async handleDrop(event) {
    const root = this.fileDropRoot;
    if (root) {
      event.preventDefault();
      this.dragState = false;
      if (event.dataTransfer) {
        const files = await getFilesFromDataTransfer(event.dataTransfer);
        if (files) {
          const models = root === "gcodes" ? files.filter((f) => isModelFile(f.file.name)) : [];
          const rest = files.filter((f) => !models.includes(f));
          if (models.length) EventBus.bus.$emit("model-dropped", models.map((f) => f.file));
          if (!rest.length) return;
          const pathWithRoot = this.$store.getters["files/getCurrentPathByRoot"](root) || "";
          const path = pathWithRoot === root ? "" : pathWithRoot.substring(root.length + 1);
          const wait = `${this.$waits.onFileSystem}/${pathWithRoot}/`;
          this.$store.dispatch("wait/addWait", wait);
          const uploaded = await this.uploadFiles(rest, path, root, false);
          this.$store.dispatch("wait/removeWait", wait);
          const gcodes = rest.filter((f) => isGcodeFile(f.file.name) && !f.path && uploaded !== false && uploaded.includes(path ? `${path}/${f.file.name}` : f.file.name));
          if (root === "gcodes" && gcodes.length === 1) {
            EventBus.bus.$emit("job-ready", path ? `${path}/${gcodes[0].file.name}` : gcodes[0].file.name);
          }
        }
      }
    }
  }
  handleKeyDown(event) {
    if (!this.enableKeyboardShortcuts || this.connection.stale) {
      return;
    }
    const shortcut = keyboardEventToKeyboardShortcut(event);
    if (shortcut === "Ctrl+Shift+E") {
      if (this.foreignPrinterRoute) return;
      event.preventDefault();
      this.emergencyStop();
      return;
    }
    if (eventTargetIsContentEditable(event)) {
      return;
    }
    if (this.handleGoKey(event, shortcut)) {
      return;
    }
    switch (shortcut) {
      // The same page of the printer before or after this one.
      case "[":
      case "]": {
        const current = this.foreignPrinterRoute ? this.$route.params.printer : activeSlug();
        const next = this.printerFrame ? stepPrinter(current, shortcut === "]" ? 1 : -1) : null;
        if (next) {
          event.preventDefault();
          this.$router.push(samePageFor(this.$route, next)).catch(() => {
          });
        }
        return;
      }
      case "u":
        if (!this.foreignPrinterRoute && this.printerFrame && this.socketConnected) {
          event.preventDefault();
          EventBus.bus.$emit("upload-file");
        }
        return;
      case "f":
        if (this.$route.name === "Camera") {
          event.preventDefault();
          EventBus.bus.$emit("camera-fullscreen");
        }
        return;
    }
    if (this.foreignPrinterRoute || !this.klippyReady) {
      return;
    }
    switch (shortcut) {
      case "Shift+C":
        if (this.printerPrinting || this.printerPaused) {
          event.preventDefault();
          this.cancelPrint();
        }
        break;
      case "Shift+P":
        if (this.printerPrinting) {
          event.preventDefault();
          this.pausePrint();
        } else if (this.printerPaused) {
          event.preventDefault();
          this.resumePrint();
        }
        break;
      case "Shift+H":
        if (!this.printerPrinting) {
          event.preventDefault();
          this.homeAll();
        }
        break;
    }
  }
  /** G then a letter: G P every printer, G A your account, G O this printer's Overview, G J its Jobs. */
  handleGoKey(event, shortcut) {
    const step = this.goKeys.feed(shortcut, Date.now());
    if (!step) return false;
    event.preventDefault();
    if (step.kind === "start") return true;
    let to = null;
    if (step.key === ALL_PRINTERS_KEY) {
      to = "/";
    } else if (step.key === LIBRARY_KEY) {
      to = "/library";
    } else if (step.key === ACCOUNT_KEY) {
      to = scopedPath("/account", activeSlug());
    } else if (activeSlug() || this.foreignPrinterRoute) {
      const section = sectionForKey(step.key, this.sectionContext);
      const page = PAGE_KEYS.find((p) => p.key === step.key);
      if (section) to = this.sectionTo(section);
      else if (page && !this.foreignPrinterRoute) to = `${scopedPath(page.path, activeSlug())}${page.hash ?? ""}`;
    }
    if (to && to !== this.$route.fullPath) this.$router.push(to).catch(() => {
    });
    return true;
  }
};
__decorateClass([
  Watch("startupFacts", { immediate: true })
], App.prototype, "onStartupFacts", 1);
__decorateClass([
  Watch("loaderReady")
], App.prototype, "onLoaderReady", 1);
__decorateClass([
  Watch("theme.isDark", { immediate: true })
], App.prototype, "onThemeDark", 1);
__decorateClass([
  Watch("personalKey", { immediate: true })
], App.prototype, "onPersonalKey", 1);
__decorateClass([
  Watch("needsLogin")
], App.prototype, "onNeedsLogin", 1);
__decorateClass([
  Watch("loginNotWanted")
], App.prototype, "onLoginNotWanted", 1);
__decorateClass([
  Watch("socketConnected", { immediate: true })
], App.prototype, "onSocketConnected", 1);
__decorateClass([
  Watch("printerFrame")
], App.prototype, "onPrinterFrame", 1);
__decorateClass([
  Watch("afterPrintKey")
], App.prototype, "onAfterPrint", 1);
__decorateClass([
  Watch("$store.state.config.apiUrl")
], App.prototype, "onPrinterChanged", 1);
__decorateClass([
  Watch("snapshotStatusLine")
], App.prototype, "onSnapshotStatusLine", 1);
__decorateClass([
  Watch("customStyleSheet")
], App.prototype, "onCustomStyleSheet", 1);
__decorateClass([
  Watch("customBackgroundImage")
], App.prototype, "onCustomBackgroundImage", 1);
App = __decorateClass([
  Component({
    metaInfo() {
      return {
        title: this.pageTitle,
        link: this.pageIcon,
        meta: this.pageMeta
      };
    },
    components: {
      DeletionBanner: () => import("/src/components/account/DeletionBanner.vue"),
      BluetoothFallbackBanner: () => import("/src/components/layout/BluetoothFallbackBanner.vue"),
      SecureAddressBanner: () => import("/src/components/layout/SecureAddressBanner.vue"),
      DeletionNotice: () => import("/src/components/account/DeletionNotice.vue"),
      ConnectionBanner,
      UploadProgress,
      ConnectingScreen,
      UpdatingScreen,
      UpdateBanner,
      PrinterOpening,
      BluetoothPairDialog: () => import("/src/components/muon-ble/BluetoothPairDialog.vue"),
      ApprovalWaitHost: () => import("/src/components/muon-cloud/ApprovalWaitHost.vue"),
      JobReadyDialog,
      SpoolSelectionDialog,
      FileSystemDownloadDialog,
      ActionCommandPromptDialog,
      KeyboardShortcutsDialog
    }
  })
], App);
const _sfc_main = App;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return !_vm.routerReady || _vm.blankedForLanguage ? _c(__unplugin_components_0) : _c(__unplugin_components_1, { staticClass: "fluidd muon-shell", class: {
    "no-pointer-events": _vm.dragState,
    "muon-shell--tabbed": _vm.showTabBar,
    "muon-shell--rail": _vm.showRail
  }, style: _vm.showRail ? { "--muon-rail-width": `${_vm.railWidth}px` } : void 0 }, [_vm.showRail ? _c(__unplugin_components_2) : _vm._e(), !_vm.managedConsoleRoute ? _c(__unplugin_components_3) : _vm._e(), !_vm.managedConsoleRoute && _vm.flashMessageState ? _c(__unplugin_components_4, { attrs: { "text": _vm.flashMessageState.text, "type": _vm.flashMessageState.type, "timeout": _vm.flashMessageState.timeout, "action": _vm.flashMessageState.action }, model: { value: _vm.flashMessageState.open, callback: function($$v) {
    _vm.$set(_vm.flashMessageState, "open", $$v);
  }, expression: "flashMessageState.open" } }) : _vm._e(), _vm.showTabBar ? _c(__unplugin_components_5) : _vm._e(), _c(__unplugin_components_6, { staticClass: "muon-main", style: _vm.customBackgroundImageStyle }, [_c(__unplugin_components_7, { staticClass: "muon-content", class: {
    "fill-height": _vm.$route.meta?.fillHeight ?? false,
    "constrained-width pa-2 pa-sm-4": !_vm.fullPage,
    "muon-content--full": _vm.fullPage,
    [["single", "double", "triple", "quad"][_vm.columnCount - 1]]: true
  }, style: _vm.fullPage ? { "--muon-header-height": `${_vm.headerHeight}px` } : void 0, attrs: { "fluid": "" } }, [_vm.deletionPending ? _c("deletion-banner") : _vm._e(), _vm.showPageHeader ? _c(__unplugin_components_8, { class: { "muon-stale": _vm.connection.stale } }) : _vm._e(), _vm.connection.banner ? _c(__unplugin_components_9, { attrs: { "kind": _vm.connection.banner } }) : _vm._e(), _c(__unplugin_components_10), _c("upload-progress"), _c(__unplugin_components_11), _vm.showUpdateBanner ? _c("update-banner") : _vm._e(), _vm.deletionCloudView ? _c("deletion-notice") : _vm.otherPrinterRoute ? _c("printer-opening", { attrs: { "slug": _vm.$route.params.printer } }) : _vm.connection.page ? _c("router-view", { class: { "muon-stale": _vm.connection.stale }, attrs: { "aria-busy": _vm.connection.stale ? "true" : void 0, "inert": _vm.connection.stale ? "" : void 0 } }) : _vm._e(), _c(__unplugin_components_12)], 1), _vm.connection.screen === "updating" || _vm.connection.screen === "updating-late" ? _c("updating-screen", { attrs: { "offline-state": _vm.connection.screen, "printer-name": _vm.displayName } }) : _vm.connection.screen ? _c(__unplugin_components_13, { attrs: { "state": _vm.connection.screen } }) : _vm._e(), !_vm.managedConsoleRoute ? [_c(__unplugin_components_14), _c(__unplugin_components_15)] : _vm._e(), !_vm.managedConsoleRoute && !_vm.foreignPrinterRoute ? [_c("file-system-download-dialog"), _c(__unplugin_components_16), _c("spool-selection-dialog"), _c(__unplugin_components_17), _c("job-ready-dialog"), _c("bluetooth-pair-dialog"), _c("approval-wait-host")] : _vm._e()], 2), !_vm.managedConsoleRoute && !_vm.foreignPrinterRoute && !_vm.fullPage ? _c(__unplugin_components_18) : _vm._e(), !_vm.managedConsoleRoute ? _c(__unplugin_components_19, { attrs: { "message": _vm.$t("app.file_system.overlay.drag_files_folders_upload"), "icon": "$fileUpload" }, model: { value: _vm.dragState, callback: function($$v) {
    _vm.dragState = $$v;
  }, expression: "dragState" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [];
_sfc_render._withStripped = true;
import "/src/App.vue?vue&type=style&index=0&scoped=7a7a37b1&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "7a7a37b1",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/App.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQThCQTtBQUFBLEVBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUE7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUVBO0FBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUE7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUlBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUlBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUNBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0EsbUhBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBSUE7QUFDQSxpREFDQSxXQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsTUFHQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxrRkFDQSwrRUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQSxFQUlBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0Esc0ZBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0E7QUFFQTtBQUVBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQU1BO0FBQ0Esb0RBQ0EsNEVBQ0E7QUFDQTtBQUVBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUVBO0FBRUE7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBRUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBRUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0EsUUFDQSxxQkFDQSxzQkFDQSw0Q0FDQTtBQUNBO0FBRUE7QUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFFQSxVQUNBLHVDQUNBLDJDQUNBO0FBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBRUE7QUFHQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0EsK0NBQ0EsS0FDQTtBQUVBO0FBRUE7QUFFQTtBQUVBO0FBR0EsbUZBQ0E7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBRUE7QUFBQSxJQUNBO0FBRUE7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUE7QUFBQSxNQUVBO0FBQUEsTUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLFFBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsUUFDQTtBQUNBO0FBQUEsTUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLFFBQ0E7QUFDQTtBQUFBLElBQ0E7QUFFQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQUEsTUFDQTtBQUNBLFlBQ0Esd0JBQ0Esb0JBQ0E7QUFDQTtBQUVBO0FBQUEsUUFDQTtBQUNBO0FBQUEsTUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLFFBQ0E7QUFDQTtBQUVBO0FBQUEsUUFDQTtBQUNBO0FBQUEsTUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUFBLFFBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBRUE7QUFBQSxJQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsZUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFBQSxFQUNBO0FBQ0E7QUFscUJBO0FBQUEsRUFEQTtBQUFBLEdBaEVBLElBaUVBO0FBS0E7QUFBQSxFQURBO0FBQUEsR0FyRUEsSUFzRUE7QUFVQTtBQUFBLEVBREE7QUFBQSxHQS9FQSxJQWdGQTtBQVVBO0FBQUEsRUFEQTtBQUFBLEdBekZBLElBMEZBO0FBb0RBO0FBQUEsRUFEQTtBQUFBLEdBN0lBLElBOElBO0FBb0JBO0FBQUEsRUFEQTtBQUFBLEdBaktBLElBa0tBO0FBYUE7QUFBQSxFQURBO0FBQUEsR0E5S0EsSUErS0E7QUFZQTtBQUFBLEVBREE7QUFBQSxHQTFMQSxJQTJMQTtBQWNBO0FBQUEsRUFEQTtBQUFBLEdBeE1BLElBeU1BO0FBeUJBO0FBQUEsRUFEQTtBQUFBLEdBak9BLElBa09BO0FBa01BO0FBQUEsRUFEQTtBQUFBLEdBbmFBLElBb2FBO0FBOEJBO0FBQUEsRUFEQTtBQUFBLEdBamNBLElBa2NBO0FBNkJBO0FBQUEsRUFEQTtBQUFBLEdBOWRBLElBK2RBO0FBL2RBO0FBQUEsRUE1QkE7QUFBQSxJQUNBO0FBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDx2LWFwcCB2LWlmPVwiIXJvdXRlclJlYWR5IHx8IGJsYW5rZWRGb3JMYW5ndWFnZVwiIC8+XG4gIDx2LWFwcFxuICAgIHYtZWxzZVxuICAgIGNsYXNzPVwiZmx1aWRkIG11b24tc2hlbGxcIlxuICAgIDpjbGFzcz1cIntcbiAgICAgICduby1wb2ludGVyLWV2ZW50cyc6IGRyYWdTdGF0ZSxcbiAgICAgICdtdW9uLXNoZWxsLS10YWJiZWQnOiBzaG93VGFiQmFyLFxuICAgICAgJ211b24tc2hlbGwtLXJhaWwnOiBzaG93UmFpbFxuICAgIH1cIlxuICAgIDpzdHlsZT1cInNob3dSYWlsID8geyAnLS1tdW9uLXJhaWwtd2lkdGgnOiBgJHtyYWlsV2lkdGh9cHhgIH0gOiB1bmRlZmluZWRcIlxuICA+XG4gICAgPGFwcC1yYWlsIHYtaWY9XCJzaG93UmFpbFwiIC8+XG5cbiAgICA8YXBwLWJhciB2LWlmPVwiIW1hbmFnZWRDb25zb2xlUm91dGVcIiAvPlxuXG4gICAgPGZsYXNoLW1lc3NhZ2VcbiAgICAgIHYtaWY9XCIhbWFuYWdlZENvbnNvbGVSb3V0ZSAmJiBmbGFzaE1lc3NhZ2VTdGF0ZVwiXG4gICAgICB2LW1vZGVsPVwiZmxhc2hNZXNzYWdlU3RhdGUub3BlblwiXG4gICAgICA6dGV4dD1cImZsYXNoTWVzc2FnZVN0YXRlLnRleHRcIlxuICAgICAgOnR5cGU9XCJmbGFzaE1lc3NhZ2VTdGF0ZS50eXBlXCJcbiAgICAgIDp0aW1lb3V0PVwiZmxhc2hNZXNzYWdlU3RhdGUudGltZW91dFwiXG4gICAgICA6YWN0aW9uPVwiZmxhc2hNZXNzYWdlU3RhdGUuYWN0aW9uXCJcbiAgICAvPlxuXG4gICAgPGFwcC10YWItYmFyIHYtaWY9XCJzaG93VGFiQmFyXCIgLz5cblxuICAgIDx2LW1haW5cbiAgICAgIGNsYXNzPVwibXVvbi1tYWluXCJcbiAgICAgIDpzdHlsZT1cImN1c3RvbUJhY2tncm91bmRJbWFnZVN0eWxlXCJcbiAgICA+XG4gICAgICA8IS0tIDxwcmU+YXV0aGVudGljYXRlZCB7eyBhdXRoZW50aWNhdGVkIH19LCBzb2NrZXRDb25uZWN0ZWQge3sgc29ja2V0Q29ubmVjdGVkIH19LCBhcGlDb25uZWN0ZWQge3sgYXBpQ29ubmVjdGVkIH19PC9wcmU+IC0tPlxuICAgICAgPHYtY29udGFpbmVyXG4gICAgICAgIGZsdWlkXG4gICAgICAgIDpjbGFzcz1cIntcbiAgICAgICAgICAnZmlsbC1oZWlnaHQnOiAkcm91dGUubWV0YT8uZmlsbEhlaWdodCA/PyBmYWxzZSxcbiAgICAgICAgICAnY29uc3RyYWluZWQtd2lkdGggcGEtMiBwYS1zbS00JzogIWZ1bGxQYWdlLFxuICAgICAgICAgICdtdW9uLWNvbnRlbnQtLWZ1bGwnOiBmdWxsUGFnZSxcbiAgICAgICAgICBbWydzaW5nbGUnLCAnZG91YmxlJywgJ3RyaXBsZScsICdxdWFkJ11bY29sdW1uQ291bnQgLSAxXV06IHRydWVcbiAgICAgICAgfVwiXG4gICAgICAgIDpzdHlsZT1cImZ1bGxQYWdlID8geyAnLS1tdW9uLWhlYWRlci1oZWlnaHQnOiBgJHtoZWFkZXJIZWlnaHR9cHhgIH0gOiB1bmRlZmluZWRcIlxuICAgICAgICBjbGFzcz1cIm11b24tY29udGVudFwiXG4gICAgICA+XG4gICAgICAgIDxkZWxldGlvbi1iYW5uZXIgdi1pZj1cImRlbGV0aW9uUGVuZGluZ1wiIC8+XG4gICAgICAgIDxhcHAtcGFnZS10aXRsZVxuICAgICAgICAgIHYtaWY9XCJzaG93UGFnZUhlYWRlclwiXG4gICAgICAgICAgOmNsYXNzPVwieyAnbXVvbi1zdGFsZSc6IGNvbm5lY3Rpb24uc3RhbGUgfVwiXG4gICAgICAgIC8+XG5cbiAgICAgICAgPGNvbm5lY3Rpb24tYmFubmVyXG4gICAgICAgICAgdi1pZj1cImNvbm5lY3Rpb24uYmFubmVyXCJcbiAgICAgICAgICA6a2luZD1cImNvbm5lY3Rpb24uYmFubmVyXCJcbiAgICAgICAgLz5cblxuICAgICAgICA8Ymx1ZXRvb3RoLWZhbGxiYWNrLWJhbm5lciAvPlxuXG4gICAgICAgIDx1cGxvYWQtcHJvZ3Jlc3MgLz5cblxuICAgICAgICA8c2VjdXJlLWFkZHJlc3MtYmFubmVyIC8+XG5cbiAgICAgICAgPHVwZGF0ZS1iYW5uZXIgdi1pZj1cInNob3dVcGRhdGVCYW5uZXJcIiAvPlxuXG4gICAgICAgIDxkZWxldGlvbi1ub3RpY2Ugdi1pZj1cImRlbGV0aW9uQ2xvdWRWaWV3XCIgLz5cblxuICAgICAgICA8cHJpbnRlci1vcGVuaW5nXG4gICAgICAgICAgdi1lbHNlLWlmPVwib3RoZXJQcmludGVyUm91dGVcIlxuICAgICAgICAgIDpzbHVnPVwiJHJvdXRlLnBhcmFtcy5wcmludGVyXCJcbiAgICAgICAgLz5cblxuICAgICAgICA8cm91dGVyLXZpZXdcbiAgICAgICAgICB2LWVsc2UtaWY9XCJjb25uZWN0aW9uLnBhZ2VcIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ211b24tc3RhbGUnOiBjb25uZWN0aW9uLnN0YWxlIH1cIlxuICAgICAgICAgIDphcmlhLWJ1c3k9XCJjb25uZWN0aW9uLnN0YWxlID8gJ3RydWUnIDogdW5kZWZpbmVkXCJcbiAgICAgICAgICA6aW5lcnQ9XCJjb25uZWN0aW9uLnN0YWxlID8gJycgOiB1bmRlZmluZWRcIlxuICAgICAgICAvPlxuXG4gICAgICAgIDxyZWdpc3Rlci1zZXJ2aWNlLXdvcmtlciAvPlxuICAgICAgPC92LWNvbnRhaW5lcj5cblxuICAgICAgPHVwZGF0aW5nLXNjcmVlblxuICAgICAgICB2LWlmPVwiY29ubmVjdGlvbi5zY3JlZW4gPT09ICd1cGRhdGluZycgfHwgY29ubmVjdGlvbi5zY3JlZW4gPT09ICd1cGRhdGluZy1sYXRlJ1wiXG4gICAgICAgIDpvZmZsaW5lLXN0YXRlPVwiY29ubmVjdGlvbi5zY3JlZW5cIlxuICAgICAgICA6cHJpbnRlci1uYW1lPVwiZGlzcGxheU5hbWVcIlxuICAgICAgLz5cbiAgICAgIDxjb25uZWN0aW5nLXNjcmVlblxuICAgICAgICB2LWVsc2UtaWY9XCJjb25uZWN0aW9uLnNjcmVlblwiXG4gICAgICAgIDpzdGF0ZT1cImNvbm5lY3Rpb24uc2NyZWVuXCJcbiAgICAgIC8+XG5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwiIW1hbmFnZWRDb25zb2xlUm91dGVcIj5cbiAgICAgICAgPGtleWJvYXJkLXNob3J0Y3V0cy1kaWFsb2cgLz5cbiAgICAgICAgPGNvbW1hbmQtYmFyIC8+XG4gICAgICA8L3RlbXBsYXRlPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCIhbWFuYWdlZENvbnNvbGVSb3V0ZSAmJiAhZm9yZWlnblByaW50ZXJSb3V0ZVwiPlxuICAgICAgICA8ZmlsZS1zeXN0ZW0tZG93bmxvYWQtZGlhbG9nIC8+XG4gICAgICAgIDx1cGRhdGluZy1kaWFsb2cgLz5cbiAgICAgICAgPHNwb29sLXNlbGVjdGlvbi1kaWFsb2cgLz5cbiAgICAgICAgPGFjdGlvbi1jb21tYW5kLXByb21wdC1kaWFsb2cgLz5cbiAgICAgICAgPGpvYi1yZWFkeS1kaWFsb2cgLz5cblxuICAgICAgICA8Ymx1ZXRvb3RoLXBhaXItZGlhbG9nIC8+XG4gICAgICAgIDxhcHByb3ZhbC13YWl0LWhvc3QgLz5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC92LW1haW4+XG5cbiAgICA8IS0tIE5vdCB1bmRlciBhIGZ1bGwgcGFnZSAoU2xpY2UpOiB0aGUgYXBwIHJlYWNoZXMgdGhlIGJvdHRvbSBlZGdlOyBldmVyeSBvdGhlciBwYWdlIGtlZXBzIHRoZSBsaWNlbmNlcy4gLS0+XG4gICAgPGFwcC1mb290ZXIgdi1pZj1cIiFtYW5hZ2VkQ29uc29sZVJvdXRlICYmICFmb3JlaWduUHJpbnRlclJvdXRlICYmICFmdWxsUGFnZVwiIC8+XG5cbiAgICA8YXBwLWRyYWctb3ZlcmxheVxuICAgICAgdi1pZj1cIiFtYW5hZ2VkQ29uc29sZVJvdXRlXCJcbiAgICAgIHYtbW9kZWw9XCJkcmFnU3RhdGVcIlxuICAgICAgOm1lc3NhZ2U9XCIkdCgnYXBwLmZpbGVfc3lzdGVtLm92ZXJsYXkuZHJhZ19maWxlc19mb2xkZXJzX3VwbG9hZCcpXCJcbiAgICAgIGljb249XCIkZmlsZVVwbG9hZFwiXG4gICAgLz5cbiAgPC92LWFwcD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIE1peGlucywgV2F0Y2ggfSBmcm9tICd2dWUtcHJvcGVydHktZGVjb3JhdG9yJ1xuaW1wb3J0IHsgcHJvZ3Jlc3NGYXZpY29uIH0gZnJvbSAnQC91dGlsL3Byb2dyZXNzLWZhdmljb24nXG5pbXBvcnQgeyBFdmVudEJ1cyB9IGZyb20gJ0AvZXZlbnRCdXMnXG5pbXBvcnQgU3RhdGVNaXhpbiBmcm9tICdAL21peGlucy9zdGF0ZSdcbmltcG9ydCBGaWxlc01peGluIGZyb20gJ0AvbWl4aW5zL2ZpbGVzJ1xuaW1wb3J0IEJyb3dzZXJNaXhpbiBmcm9tICdAL21peGlucy9icm93c2VyJ1xuaW1wb3J0IHR5cGUgeyBMaW5rUHJvcGVydHlIcmVmLCBNZXRhUHJvcGVydHlOYW1lIH0gZnJvbSAndnVlLW1ldGEnXG5pbXBvcnQgRmlsZVN5c3RlbURvd25sb2FkRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy93aWRnZXRzL2ZpbGVzeXN0ZW0vRmlsZVN5c3RlbURvd25sb2FkRGlhbG9nLnZ1ZSdcbmltcG9ydCBTcG9vbFNlbGVjdGlvbkRpYWxvZyBmcm9tICdAL2NvbXBvbmVudHMvd2lkZ2V0cy9zcG9vbG1hbi9TcG9vbFNlbGVjdGlvbkRpYWxvZy52dWUnXG5pbXBvcnQgdHlwZSB7IEZsYXNoTWVzc2FnZSB9IGZyb20gJ0AvdHlwZXMnXG5pbXBvcnQgeyBnZXRGaWxlc0Zyb21EYXRhVHJhbnNmZXIsIGhhc0ZpbGVzSW5EYXRhVHJhbnNmZXIgfSBmcm9tICcuL3V0aWwvZmlsZS1zeXN0ZW0tZW50cnknXG5pbXBvcnQgdHlwZSB7IFRoZW1lQ29uZmlnIH0gZnJvbSAnQC9zdG9yZS9jb25maWcvdHlwZXMnXG5pbXBvcnQgQWN0aW9uQ29tbWFuZFByb21wdERpYWxvZyBmcm9tICcuL2NvbXBvbmVudHMvY29tbW9uL0FjdGlvbkNvbW1hbmRQcm9tcHREaWFsb2cudnVlJ1xuaW1wb3J0IEtleWJvYXJkU2hvcnRjdXRzRGlhbG9nIGZyb20gJy4vY29tcG9uZW50cy9jb21tb24vS2V5Ym9hcmRTaG9ydGN1dHNEaWFsb2cudnVlJ1xuaW1wb3J0IHsgZXZlbnRUYXJnZXRJc0NvbnRlbnRFZGl0YWJsZSwga2V5Ym9hcmRFdmVudFRvS2V5Ym9hcmRTaG9ydGN1dCB9IGZyb20gJy4vdXRpbC9ldmVudC1oZWxwZXJzJ1xuaW1wb3J0IHsgaXNNYW5hZ2VkQ29uc29sZVBhdGggfSBmcm9tICdAL3JvdXRlci9tYW5hZ2VkUGF0aCdcbmltcG9ydCB7XG4gIGFjdGl2ZVNsdWcsXG4gIGZvcmVpZ25SZWNvcmRGb3JTbHVnLFxuICBpc0FjdGl2ZVNsdWcsXG4gIGlzRm9yZWlnblNsdWcsXG4gIHByaW50ZXJIb21lUGF0aCxcbiAgcHJpbnRlclBhZ2VOZWVkc0xvZ2luLFxuICBzYW1lUGFnZUZvcixcbiAgc3RlcFByaW50ZXJcbn0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzJ1xuaW1wb3J0IHsgaXNNYW5hZ2VkQXBpVXJsIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL29yaWdpbidcbmltcG9ydCBQcmludGVyT3BlbmluZyBmcm9tICcuL2NvbXBvbmVudHMvbXVvbi1jbG91ZC9QcmludGVyT3BlbmluZy52dWUnXG5pbXBvcnQgQ29ubmVjdGlvbkJhbm5lciBmcm9tICcuL2NvbXBvbmVudHMvbGF5b3V0L0Nvbm5lY3Rpb25CYW5uZXIudnVlJ1xuaW1wb3J0IFVwbG9hZFByb2dyZXNzIGZyb20gJy4vY29tcG9uZW50cy9qb2JzL1VwbG9hZFByb2dyZXNzLnZ1ZSdcbmltcG9ydCBDb25uZWN0aW5nU2NyZWVuIGZyb20gJy4vY29tcG9uZW50cy9sYXlvdXQvQ29ubmVjdGluZ1NjcmVlbi52dWUnXG5pbXBvcnQgVXBkYXRpbmdTY3JlZW4gZnJvbSAnLi9jb21wb25lbnRzL3VwZGF0ZXMvVXBkYXRpbmdTY3JlZW4udnVlJ1xuaW1wb3J0IFVwZGF0ZUJhbm5lciBmcm9tICcuL2NvbXBvbmVudHMvdXBkYXRlcy9VcGRhdGVCYW5uZXIudnVlJ1xuaW1wb3J0IHsgaW5zdGFsbFN0YXJ0ZWQsIHByaW50ZXJMb3N0LCB1cGRhdGVXYXRjaCwgd2F0Y2hVcGRhdGVzIH0gZnJvbSAnQC9zZXJ2aWNlcy91cGRhdGVzL3dhdGNoJ1xuaW1wb3J0IHsgYWZ0ZXJQcmludCwgYWZ0ZXJQcmludER1ZSwgY2FuY2VsQWZ0ZXJQcmludCwgbG9hZEFmdGVyUHJpbnQsIG90YUNvbXBvbmVudCB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9hZnRlci1wcmludCdcbmltcG9ydCB7IFNvY2tldEFjdGlvbnMgfSBmcm9tICdAL2FwaS9zb2NrZXRBY3Rpb25zJ1xuaW1wb3J0IHsgYmFubmVyVmlzaWJsZSwgb2ZmbGluZVNjcmVlbiB9IGZyb20gJ0Avc2VydmljZXMvdXBkYXRlcy9tb2RlbCdcbmltcG9ydCB7IHByaW50ZXJOYW1lUGFydHMgfSBmcm9tICdAL3V0aWwvcHJpbnRlci1uYW1lJ1xuaW1wb3J0IHsgY29ubmVjdGlvblZpZXcsIHR5cGUgQ29ubmVjdGlvblZpZXcgfSBmcm9tICdAL3NlcnZpY2VzL2Nvbm5lY3Rpb24vdmlldydcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBhY2NvdW50UXVpY2tLZXkgfSBmcm9tICdAL3NlcnZpY2VzL2NvbnNvbGUvc2V0dGluZ3MnXG5pbXBvcnQgeyBibHVldG9vdGhDYXJyeWluZyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IGFjdGl2YXRpb25TdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9hY3RpdmF0ZSdcbmltcG9ydCB7IGNvbnNvbGVQcmVzZW5jZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9wcmVzZW5jZSdcbmltcG9ydCBGcmFtZU1peGluIGZyb20gJ0AvbWl4aW5zL2ZyYW1lJ1xuaW1wb3J0IHsgQUNDT1VOVF9LRVksIEFMTF9QUklOVEVSU19LRVksIExJQlJBUllfS0VZLCBQQUdFX0tFWVMsIHBhZ2VMYWJlbCwgc2VjdGlvbkZvcktleSB9IGZyb20gJ0Avcm91dGVyL3ByaW50ZXJTZWN0aW9ucydcbmltcG9ydCB7IHBhZ2VPZlJvdXRlLCBzY29wZWRQYXRoIH0gZnJvbSAnQC9yb3V0ZXIvcHJpbnRlclBhZ2VQYXRocydcbmltcG9ydCB7IEdvS2V5cyB9IGZyb20gJ0AvdXRpbC9nby1rZXlzJ1xuaW1wb3J0IHsgaXNHY29kZUZpbGUsIGlzTW9kZWxGaWxlIH0gZnJvbSAnQC9zZXJ2aWNlcy9qb2JzL21vZGVsJ1xuaW1wb3J0IEpvYlJlYWR5RGlhbG9nIGZyb20gJy4vY29tcG9uZW50cy9qb2JzL0pvYlJlYWR5RGlhbG9nLnZ1ZSdcbmltcG9ydCB7IGxvYWRlckNhbkdvLCByZW1lbWJlclRoZW1lLCByZW1vdmVMb2FkZXIsIHN0YXJ0dXBTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9sb2FkZXInXG5pbXBvcnQgeyBmaXJzdFBhaW50RW5hYmxlZCB9IGZyb20gJ0Avc2VydmljZXMvZmxhZ3MnXG5pbXBvcnQgeyBmaXJzdFBhaW50U3RhdGUsIHJlcG9ydFN0YXJ0dXAgfSBmcm9tICdAL3NlcnZpY2VzL3N0YXJ0dXAvZmlyc3QtcGFpbnQvc3RhdGUnXG5pbXBvcnQgeyBFTlRSWV9NQVJLLCB0eXBlIFN0YXJ0dXBGYWN0cyB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9maXJzdC1wYWludC9wcm9ncmVzcydcbmltcG9ydCB7IHNhdmVTbmFwc2hvdFN0YXR1cyB9IGZyb20gJ0Avc2VydmljZXMvc3RhcnR1cC9zbmFwc2hvdCdcbmltcG9ydCB7IGRlbGV0aW9uU3RhdGUsIGRlbGV0aW9uQmxvY2tzVmlldyB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9kZWxldGlvbidcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5cbkBDb21wb25lbnQ8QXBwPih7XG4gIG1ldGFJbmZvICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6IHRoaXMucGFnZVRpdGxlLFxuICAgICAgbGluazogdGhpcy5wYWdlSWNvbixcbiAgICAgIG1ldGE6IHRoaXMucGFnZU1ldGFcbiAgICB9XG4gIH0sXG4gIGNvbXBvbmVudHM6IHtcbiAgICBEZWxldGlvbkJhbm5lcjogKCkgPT4gaW1wb3J0KCdAL2NvbXBvbmVudHMvYWNjb3VudC9EZWxldGlvbkJhbm5lci52dWUnKSxcbiAgICBCbHVldG9vdGhGYWxsYmFja0Jhbm5lcjogKCkgPT4gaW1wb3J0KCdAL2NvbXBvbmVudHMvbGF5b3V0L0JsdWV0b290aEZhbGxiYWNrQmFubmVyLnZ1ZScpLFxuICAgIFNlY3VyZUFkZHJlc3NCYW5uZXI6ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL2xheW91dC9TZWN1cmVBZGRyZXNzQmFubmVyLnZ1ZScpLFxuICAgIERlbGV0aW9uTm90aWNlOiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9hY2NvdW50L0RlbGV0aW9uTm90aWNlLnZ1ZScpLFxuICAgIENvbm5lY3Rpb25CYW5uZXIsXG4gICAgVXBsb2FkUHJvZ3Jlc3MsXG4gICAgQ29ubmVjdGluZ1NjcmVlbixcbiAgICBVcGRhdGluZ1NjcmVlbixcbiAgICBVcGRhdGVCYW5uZXIsXG4gICAgUHJpbnRlck9wZW5pbmcsXG4gICAgQmx1ZXRvb3RoUGFpckRpYWxvZzogKCkgPT4gaW1wb3J0KCdAL2NvbXBvbmVudHMvbXVvbi1ibGUvQmx1ZXRvb3RoUGFpckRpYWxvZy52dWUnKSxcbiAgICBBcHByb3ZhbFdhaXRIb3N0OiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9tdW9uLWNsb3VkL0FwcHJvdmFsV2FpdEhvc3QudnVlJyksXG4gICAgSm9iUmVhZHlEaWFsb2csXG4gICAgU3Bvb2xTZWxlY3Rpb25EaWFsb2csXG4gICAgRmlsZVN5c3RlbURvd25sb2FkRGlhbG9nLFxuICAgIEFjdGlvbkNvbW1hbmRQcm9tcHREaWFsb2csXG4gICAgS2V5Ym9hcmRTaG9ydGN1dHNEaWFsb2dcbiAgfVxufSlcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcCBleHRlbmRzIE1peGlucyhTdGF0ZU1peGluLCBGcmFtZU1peGluLCBGaWxlc01peGluLCBCcm93c2VyTWl4aW4pIHtcbiAgZ2V0IGRlbGV0aW9uUGVuZGluZyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGRlbGV0aW9uU3RhdGUuZGVsZXRlQWZ0ZXIgIT09IG51bGxcbiAgfVxuXG4gIGdldCBkZWxldGlvbkNsb3VkVmlldyAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZXRpb25QZW5kaW5nICYmIGRlbGV0aW9uQmxvY2tzVmlldyh0aGlzLiRyb3V0ZS5uYW1lKVxuICB9XG5cbiAgZHJhZ1N0YXRlID0gZmFsc2VcbiAgY3VzdG9tQmFja2dyb3VuZEltYWdlU3R5bGU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICBnb0tleXMgPSBuZXcgR29LZXlzKClcblxuICBmbGFzaE1lc3NhZ2VTdGF0ZTogRmxhc2hNZXNzYWdlID0ge1xuICAgIG9wZW46IGZhbHNlLFxuICAgIHRleHQ6IHVuZGVmaW5lZCxcbiAgICB0eXBlOiB1bmRlZmluZWRcbiAgfVxuXG4gIC8vIFVudGlsIHRoZSBmaXJzdCBuYXZpZ2F0aW9uIHJlc29sdmVzLCAkcm91dGUgaXMgc3RpbGwgLy4gQSBsYXp5IHJvdXRlIHN1Y2hcbiAgLy8gYXMgL3NldHVwIHdvdWxkIG90aGVyd2lzZSBtb3VudCB0aGUgd2hvbGUgc2hlbGwgZm9yIGEgbW9tZW50LCBhbmQgdGhlXG4gIC8vIHByaW50ZXIgc3dpdGNoZXIgaW4gaXQgc3RhcnRzIGEgbmV0d29yayBzZWFyY2ggdGhlIHNldHVwIHBhZ2UgbXVzdCBuZXZlclxuICAvLyBtYWtlIChpdCBtYXkgcmVhY2ggb25seSB0aGUgcHJpbnRlcikuXG4gIHJvdXRlclJlYWR5ID0gZmFsc2VcbiAgLyoqIFdoZW4gQXBwIG1vdW50ZWQsIGZvciB0aGUgbG9hZGVyJ3MgNiBzIGhvbGQgb24gdGhlIGNvbm5lY3Rpbmcgc2NyZWVuLiAqL1xuICBtb3VudGVkQXQgPSAwXG5cbiAgY3JlYXRlZCAoKSB7XG4gICAgY29uc3QgcmVhZHkgPSAoKSA9PiB7IHRoaXMucm91dGVyUmVhZHkgPSB0cnVlIH1cbiAgICB0aGlzLiRyb3V0ZXIub25SZWFkeShyZWFkeSwgcmVhZHkpXG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgaW5kZXguaHRtbCBsb2FkZXIgY2FuIGdvIChLQU4tNTI1KTogdGhlIGZpcnN0IHJvdXRlIHJlc29sdmVkLFxuICAgKiBhbmQgYSBsb2FkZXIgc2hvd2luZyB0aGUgY2FjaGVkIGxhc3Qgc3RhdGUgZG9lc24ndCB3YWl0IG9uIHRoZSBjb25uZWN0aW5nXG4gICAqIHNjcmVlbiBwYXN0IDYgcy5cbiAgICovXG4gIGdldCBsb2FkZXJSZWFkeSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxvYWRlckNhbkdvKHtcbiAgICAgIHJvdXRlclJlYWR5OiB0aGlzLnJvdXRlclJlYWR5LFxuICAgICAgc2NyZWVuOiB0aGlzLmNvbm5lY3Rpb24uc2NyZWVuLFxuICAgICAgY2FjaGVkU2hvd246IHN0YXJ0dXBTdGF0ZS5jYWNoZWRTaG93bixcbiAgICAgIG1zU2luY2VNb3VudDogcGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLm1vdW50ZWRBdFxuICAgIH0pICYmICFmaXJzdFBhaW50U3RhdGUuaG9sZGluZ1xuICB9XG5cbiAgLyoqXG4gICAqIFdoYXQgc3RhcnQtdXAgaGFzIHJlYWxseSByZWFjaGVkLCBmb3IgZmlyc3QgcGFpbnQncyByaW0gKEtBTi01OTI5KS4gT25seVxuICAgKiB3aXRoIHRoZSBmbGFnIG9uOiBvZmYsIGl0IGlzIG51bGwgYW5kIG5vdGhpbmcgd2F0Y2hlcyBpdC5cbiAgICovXG4gIGdldCBzdGFydHVwRmFjdHMgKCk6IFN0YXJ0dXBGYWN0cyB8IG51bGwge1xuICAgIGlmICghZmlyc3RQYWludEVuYWJsZWQoKSkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBpbmZvID0gdGhpcy4kc3RvcmUuZ2V0dGVyc1snc2VydmVyL2dldEluZm8nXSBhcyB7IGtsaXBweV9zdGF0ZT86IHN0cmluZywga2xpcHB5X2Nvbm5lY3RlZD86IGJvb2xlYW4gfVxuICAgIHJldHVybiB7XG4gICAgICBsb2FkZXJNYXJrOiBFTlRSWV9NQVJLLFxuICAgICAgcm91dGVyUmVhZHk6IHRoaXMucm91dGVyUmVhZHksXG4gICAgICBzY3JlZW46IHRoaXMuY29ubmVjdGlvbi5zY3JlZW4sXG4gICAgICBzb2NrZXRPcGVuOiB0aGlzLnNvY2tldENvbm5lY3RlZCxcbiAgICAgIGtsaXBweVN0YXRlOiBpbmZvLmtsaXBweV9zdGF0ZSA/PyAnJyxcbiAgICAgIGtsaXBweUNvbm5lY3RlZDogISFpbmZvLmtsaXBweV9jb25uZWN0ZWQsXG4gICAgICBzb2NrZXRSZWFkeTogISF0aGlzLiRzdG9yZS5zdGF0ZS5zb2NrZXQucmVhZHlcbiAgICB9XG4gIH1cblxuICBAV2F0Y2goJ3N0YXJ0dXBGYWN0cycsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIG9uU3RhcnR1cEZhY3RzIChmYWN0czogU3RhcnR1cEZhY3RzIHwgbnVsbCkge1xuICAgIGlmIChmYWN0cykgcmVwb3J0U3RhcnR1cChmYWN0cylcbiAgfVxuXG4gIEBXYXRjaCgnbG9hZGVyUmVhZHknKVxuICBvbkxvYWRlclJlYWR5IChyZWFkeTogYm9vbGVhbikge1xuICAgIGlmIChyZWFkeSkgdGhpcy5kaXNtaXNzTG9hZGVyKClcbiAgfVxuXG4gIGRpc21pc3NMb2FkZXIgKCkge1xuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHJlbW92ZUxvYWRlcigpIH0pKVxuICB9XG5cbiAgLyoqIFRoZSB0aGVtZSB0aGUgbmV4dCBsb2FkJ3MgbG9hZGVyIHBhaW50cyBpbiAoaW5kZXguaHRtbCByZWFkcyBtdW9uM2QudGhlbWUpLiAqL1xuICBAV2F0Y2goJ3RoZW1lLmlzRGFyaycsIHsgaW1tZWRpYXRlOiB0cnVlIH0pXG4gIG9uVGhlbWVEYXJrIChpc0Rhcms6IGJvb2xlYW4pIHtcbiAgICByZW1lbWJlclRoZW1lKGlzRGFyaylcbiAgfVxuXG4gIC8qKiBXaG9zZSBMb29rIGFuZCBBc2sgYmVmb3JlIGFwcGx5OiB0aGUgc2lnbmVkLWluIGFjY291bnQncywgZWxzZSBhbnlvbmUncyBoZXJlLiAqL1xuICBnZXQgcGVyc29uYWxLZXkgKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBhY2NvdW50UXVpY2tLZXkoY2xvdWRTdGF0ZSlcbiAgfVxuXG4gIEBXYXRjaCgncGVyc29uYWxLZXknLCB7IGltbWVkaWF0ZTogdHJ1ZSB9KVxuICBvblBlcnNvbmFsS2V5IChrZXk6IHN0cmluZyB8IG51bGwpIHtcbiAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnY29uZmlnL2FwcGx5UGVyc29uYWwnLCBrZXkpXG4gIH1cblxuICBnZXQgdGhlbWUgKCk6IFRoZW1lQ29uZmlnIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MudGhlbWUgYXMgVGhlbWVDb25maWdcbiAgfVxuXG4gIGdldCBwcmltYXJ5Q29sb3IgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuJHZ1ZXRpZnkudGhlbWUuY3VycmVudFRoZW1lLnByaW1hcnk/LnRvU3RyaW5nKCkgPz8gJydcbiAgfVxuXG4gIGdldCBwcmltYXJ5T2Zmc2V0Q29sb3IgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuJHZ1ZXRpZnkudGhlbWUuY3VycmVudFRoZW1lWydwcmltYXJ5LW9mZnNldCddPy50b1N0cmluZygpID8/ICcnXG4gIH1cblxuICAvLyBPdXIgYXBwIGlzIGluIGEgbG9hZGluZyBzdGF0ZSB3aGVuIHRoZSBzb2NrZXQgaXNuJ3QgcXVpdGUgcmVhZHksIG9yXG4gIC8vIG91ciB0cmFuc2xhdGlvbnMgYXJlIGxvYWRpbmcuXG4gIGdldCB1cGRhdGluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHN0b3JlLnN0YXRlLnZlcnNpb24uYnVzeVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcGFnZSBmb3IgYSBwcmludGVyIEZsdWlkZCBpc24ndCBvbiAoeWV0KTogaXQgc2hvd3MgdGhhdCBwcmludGVyIG9wZW5pbmcsXG4gICAqIG5ldmVyIHRoZSBsYXN0IHByaW50ZXIncyBwYWdlIHVuZGVyIHRoaXMgcHJpbnRlcidzIGFkZHJlc3MuXG4gICAqL1xuICBnZXQgb3RoZXJQcmludGVyUm91dGUgKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHNsdWcgPSB0aGlzLiRyb3V0ZS5wYXJhbXMucHJpbnRlclxuICAgIHJldHVybiAhIXNsdWcgJiYgIXRoaXMucHJpbnRlckluZGVwZW5kZW50Um91dGUgJiYgIWlzRm9yZWlnblNsdWcoc2x1ZykgJiYgIWlzQWN0aXZlU2x1ZyhzbHVnKVxuICB9XG5cbiAgZ2V0IGZvcmVpZ25QcmludGVyUm91dGUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0ZvcmVpZ25TbHVnKHRoaXMuJHJvdXRlLnBhcmFtcy5wcmludGVyKVxuICB9XG5cbiAgZ2V0IHByaW50ZXJJbmRlcGVuZGVudFJvdXRlICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcm91dGUubWV0YT8ucHJpbnRlckluZGVwZW5kZW50ID09PSB0cnVlXG4gIH1cblxuICAvKiogQSBwcmludGVyIG9wZW5lZCBieSBpdHMgYWRkcmVzcyBhc2tzIGZvciBpdHMgb3duIGxvZ2luIG9uY2UgaXQgaXMgb24gKHByaW50ZXJQYWdlTmVlZHNMb2dpbikuICovXG4gIGdldCBuZWVkc0xvZ2luICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gcHJpbnRlclBhZ2VOZWVkc0xvZ2luKHtcbiAgICAgIGFwaUNvbm5lY3RlZDogdGhpcy5hcGlDb25uZWN0ZWQsXG4gICAgICBhdXRoZW50aWNhdGVkOiB0aGlzLmF1dGhlbnRpY2F0ZWQsXG4gICAgICBtYW5hZ2VkOiB0aGlzLmNsb3VkUHJpbnRlcixcbiAgICAgIHJvdXRlUHJpbnRlcjogdGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIsXG4gICAgICByb3V0ZU5hbWU6IHRoaXMuJHJvdXRlLm5hbWUsXG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRoaXMucHJpbnRlckluZGVwZW5kZW50Um91dGVcbiAgICB9KVxuICB9XG5cbiAgQFdhdGNoKCduZWVkc0xvZ2luJylcbiAgb25OZWVkc0xvZ2luIChuZWVkczogYm9vbGVhbikge1xuICAgIGlmIChuZWVkcykgdGhpcy4kcm91dGVyLnJlcGxhY2UoJy9sb2dpbicpLmNhdGNoKCgpID0+IHt9KVxuICB9XG5cbiAgLyoqIFRoZSBwcmludGVyIGlzIHJlYWNoZWQgdGhyb3VnaCBNdW9uM0QsIHNvIGl0IG5ldmVyIGhhcyBNb29ucmFrZXIncyBsb2dpbi4gKi9cbiAgZ2V0IGNsb3VkUHJpbnRlciAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTWFuYWdlZEFwaVVybCh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsKVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsb2dpbiBwYWdlIHdpdGggbm90aGluZyB0byBzaWduIGluIHRvOiBhIGNsb3VkIHByaW50ZXIsIG9yIGFcbiAgICogcHJpbnRlciB0aGF0IHR1cm5lZCBvdXQgdG8gbGV0IHRoaXMgYnJvd3NlciBpbi4gSXRzIG93biBndWFyZCBjaGVja3NcbiAgICogb25seSBvbiB0aGUgd2F5IGluLCBzbyBhIHBhZ2UgdGhhdCB3ZW50IHRvIC9sb2dpbiB3aGlsZSBhIHByaW50ZXIgd2FzXG4gICAqIG9wZW5pbmcgc3RheWVkIHRoZXJlIGFmdGVyIHRoZSBwcmludGVyIGFuc3dlcmVkLlxuICAgKi9cbiAgZ2V0IGxvZ2luTm90V2FudGVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcm91dGUubmFtZSA9PT0gJ0xvZ2luJyAmJiAodGhpcy5jbG91ZFByaW50ZXIgfHwgKHRoaXMuYXV0aGVudGljYXRlZCAmJiB0aGlzLnNvY2tldENvbm5lY3RlZCkpXG4gIH1cblxuICBAV2F0Y2goJ2xvZ2luTm90V2FudGVkJylcbiAgb25Mb2dpbk5vdFdhbnRlZCAobGVhdmU6IGJvb2xlYW4pIHtcbiAgICBpZiAobGVhdmUpIHRoaXMuJHJvdXRlci5yZXBsYWNlKHByaW50ZXJIb21lUGF0aCgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlciBoYXMgc2FpZCBub3RoaW5nIGZvciBhIGZldyBzZWNvbmRzOyB0aGUgcGFnZSBzdGF5cyB1cCB3aGlsZSBGbHVpZGQgd2FpdHMuICovXG4gIGdldCBzb2NrZXRTdGFsbGVkICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuc29ja2V0LnN0YWxsZWQgJiYgdGhpcy4kc3RvcmUuc3RhdGUuc29ja2V0Lm9wZW5cbiAgfVxuXG4gIC8qKiBGbHVpZGQgaGFzIHJlYWNoZWQgdGhlIHByaW50ZXIgaXQgaXMgb24gc2luY2UgaXQgd2FzIGNob3Nlbiwgc28gYSBkcm9wIGtlZXBzIHRoZSBwYWdlLiAqL1xuICB3YXNDb25uZWN0ZWQgPSBmYWxzZVxuXG4gIEBXYXRjaCgnc29ja2V0Q29ubmVjdGVkJywgeyBpbW1lZGlhdGU6IHRydWUgfSlcbiAgb25Tb2NrZXRDb25uZWN0ZWQgKGNvbm5lY3RlZDogYm9vbGVhbikge1xuICAgIGlmIChjb25uZWN0ZWQpIHRoaXMud2FzQ29ubmVjdGVkID0gdHJ1ZVxuICAgIC8vIFRoZSBwcmludGVyJ3Mgb3duIHVwZGF0ZTogd2F0Y2hlZCB3aGlsZSBjb25uZWN0ZWQsIGFuZCBhIGRyb3AgbWlkLWluc3RhbGwgaXMgcmVtZW1iZXJlZC5cbiAgICBpZiAoY29ubmVjdGVkICYmIHRoaXMucHJpbnRlckZyYW1lKSB7XG4gICAgICB0aGlzLndhdGNoUHJpbnRlclVwZGF0ZXMoKVxuICAgIH0gZWxzZSBpZiAoIWNvbm5lY3RlZCAmJiB0aGlzLndhc0Nvbm5lY3RlZCkge1xuICAgICAgcHJpbnRlckxvc3QoKVxuICAgIH1cbiAgfVxuXG4gIC8qKiBBIGxvYWQgc3RyYWlnaHQgb250byBhIHByaW50ZXIncyBwYWdlIGNhbiBjb25uZWN0IGJlZm9yZSB0aGUgcm91dGUgaGFzIGl0cyBwcmludGVyLiAqL1xuICBAV2F0Y2goJ3ByaW50ZXJGcmFtZScpXG4gIG9uUHJpbnRlckZyYW1lIChmcmFtZTogYm9vbGVhbikge1xuICAgIGlmIChmcmFtZSAmJiB0aGlzLnNvY2tldENvbm5lY3RlZCkgdGhpcy53YXRjaFByaW50ZXJVcGRhdGVzKClcbiAgfVxuXG4gIHdhdGNoUHJpbnRlclVwZGF0ZXMgKCkge1xuICAgIHdhdGNoVXBkYXRlcyhhY3RpdmVTbHVnKCkgPz8gU3RyaW5nKHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwgPz8gJycpLCB1cmwgPT4gdGhpcy4kaHR0cENsaWVudC5nZXQodXJsLCB7IHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlIH0pLCAhIXRoaXMuY2xvdWRQcmludGVyKVxuICB9XG5cbiAgLyoqIFwiSW5zdGFsbCBhZnRlciB0aGlzIHByaW50XCI6IHdoYXQgaXQgd2FpdHMgb24uICovXG4gIGdldCBhZnRlclByaW50S2V5ICgpOiBzdHJpbmcge1xuICAgIHJldHVybiBbdXBkYXRlV2F0Y2gucHJpbnRlciwgdGhpcy5wcmludGVyU3RhdGUsIHVwZGF0ZVdhdGNoLnN0YXR1cz8udGFyZ2V0X3ZlcnNpb24gPz8gJycsIGFmdGVyUHJpbnQucHJpbnRlciwgYWZ0ZXJQcmludC5xdWV1ZWQ/LmF0ID8/ICcnXS5qb2luKCd8JylcbiAgfVxuXG4gIEBXYXRjaCgnYWZ0ZXJQcmludEtleScpXG4gIG9uQWZ0ZXJQcmludCAoKSB7XG4gICAgaWYgKCF1cGRhdGVXYXRjaC5wcmludGVyIHx8ICF1cGRhdGVXYXRjaC5hbnN3ZXJlZCkgcmV0dXJuXG4gICAgY29uc3QgcXVldWVkID0gbG9hZEFmdGVyUHJpbnQodXBkYXRlV2F0Y2gucHJpbnRlcilcbiAgICBpZiAoIXF1ZXVlZCkgcmV0dXJuXG4gICAgY29uc3QgZHVlID0gYWZ0ZXJQcmludER1ZShxdWV1ZWQsIHRoaXMucHJpbnRlclN0YXRlLCB1cGRhdGVXYXRjaC5zdGF0dXMsIERhdGUubm93KCkpXG4gICAgaWYgKGR1ZSA9PT0gJ2Ryb3AnKSBjYW5jZWxBZnRlclByaW50KClcbiAgICBpZiAoZHVlICE9PSAnaW5zdGFsbCcgfHwgIXRoaXMuc29ja2V0Q29ubmVjdGVkIHx8ICF0aGlzLmtsaXBweUNvbm5lY3RlZCkgcmV0dXJuXG4gICAgY2FuY2VsQWZ0ZXJQcmludCgpXG4gICAgU29ja2V0QWN0aW9ucy5tYWNoaW5lVXBkYXRlQ2xpZW50KG90YUNvbXBvbmVudCh0aGlzLiRzdG9yZS5zdGF0ZS52ZXJzaW9uLnZlcnNpb25faW5mbykpXG4gICAgaW5zdGFsbFN0YXJ0ZWQocXVldWVkLmZyb20sIHF1ZXVlZC50bylcbiAgfVxuXG4gIGdldCBkaXNwbGF5TmFtZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJpbnRlck5hbWVQYXJ0cyh0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0RGlzcGxheU5hbWUnXSBhcyBzdHJpbmcpLm5hbWVcbiAgfVxuXG4gIC8qKiBUaGUgYmFyIG92ZXIgZXZlcnkgcGFnZSB3aGlsZSB0aGUgcHJpbnRlciBpbnN0YWxscyBhbiB1cGRhdGUsIGJ1dCBvbiB0aGUgVXBkYXRpbmcgcGFnZSBpdHNlbGYuICovXG4gIGdldCBzaG93VXBkYXRlQmFubmVyICgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5mb3JlaWduUHJpbnRlclJvdXRlKSByZXR1cm4gZmFsc2VcbiAgICBjb25zdCByID0gdXBkYXRlV2F0Y2gucmVtZW1iZXJlZFxuICAgIHJldHVybiBiYW5uZXJWaXNpYmxlKHIsIHVwZGF0ZVdhdGNoLm5vdywgdXBkYXRlV2F0Y2guYW5zd2VyZWQpICYmIHRoaXMucHJpbnRlckZyYW1lICYmIHRoaXMuc29ja2V0Q29ubmVjdGVkICYmXG4gICAgICB0aGlzLiRyb3V0ZS5uYW1lICE9PSAnVXBkYXRpbmcnICYmIHVwZGF0ZVdhdGNoLnByaW50ZXIgPT09IChhY3RpdmVTbHVnKCkgPz8gJycpXG4gIH1cblxuICBAV2F0Y2goJyRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsJylcbiAgb25QcmludGVyQ2hhbmdlZCAoKSB7XG4gICAgdGhpcy53YXNDb25uZWN0ZWQgPSB0aGlzLnNvY2tldENvbm5lY3RlZFxuICB9XG5cbiAgLyoqIFdoYXQgdGhlIGNvbm5lY3Rpb24gc2hvd3M6IHRoZSBwYWdlLCBhIGJhciBvdmVyIGl0LCBvciBhIHNjcmVlbiBvZiBpdHMgb3duIChzZXJ2aWNlcy9jb25uZWN0aW9uL3ZpZXcpLiAqL1xuICBnZXQgY29ubmVjdGlvbiAoKTogQ29ubmVjdGlvblZpZXcge1xuICAgIGlmICh0aGlzLmZvcmVpZ25QcmludGVyUm91dGUpIHJldHVybiB7IHBhZ2U6IHRydWUsIHN0YWxlOiBmYWxzZSwgYmFubmVyOiBudWxsLCBzY3JlZW46IG51bGwgfVxuICAgIGNvbnN0IHByaW50ZXIgPSBjbG91ZFN0YXRlLnByaW50ZXJzLmZpbmQocCA9PiBwLmlkID09PSBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZClcbiAgICAvLyBTdGF0dXMgcG9sbGluZyB0aWNrcyB0aGlzIHJlYWN0aXZlIGNsb2NrIGV2ZW4gZm9yIG9mZmxpbmUgcHJpbnRlcnMuXG4gICAgY29uc3Qgc3RhdHVzID0gcHJpbnRlciA/IGNsb3VkU3RhdGUuc3RhdHVzW3ByaW50ZXIuaWRdIDogdW5kZWZpbmVkXG4gICAgY29uc3Qgb3ZlckJsdWV0b290aCA9ICEhcHJpbnRlciAmJiBibHVldG9vdGhDYXJyeWluZyhwcmludGVyLmlkKSAmJiB0aGlzLnNvY2tldENvbm5lY3RlZCAmJiB0aGlzLmFwaUNvbm5lY3RlZFxuICAgIC8vIEktMTMzOiB0aGUgc3RhdHVzIHJlYWQgZ29pbmcgc2lsZW50IG9yIGZhaWxpbmcgdHdpY2UgaXMgT2ZmbGluZSB0b28sIHdpdGhpblxuICAgIC8vIHNlY29uZHM7IGFuZCBhIHByaW50ZXIgYW5zd2VyaW5nIG92ZXIgQmx1ZXRvb3RoIGlzIG5vdCBvZmZsaW5lIGJlY2F1c2UgdGhlXG4gICAgLy8gY29uc29sZSBjYW5ub3Qgc2VlIGl0LlxuICAgIGNvbnN0IHNpbGVudCA9ICEhc3RhdHVzICYmICFzdGF0dXMucmVhY2hhYmxlICYmIHN0YXR1cy5lcnJvciA9PT0gJ29mZmxpbmUnXG4gICAgY29uc3QgcHJlc2VuY2UgPSAhcHJpbnRlciB8fCBvdmVyQmx1ZXRvb3RoXG4gICAgICA/ICdvbmxpbmUnXG4gICAgICA6IHNpbGVudCA/ICdvZmZsaW5lJyA6IGNvbnNvbGVQcmVzZW5jZShwcmludGVyLCBzdGF0dXM/LnVwZGF0ZWRBdCA/PyBEYXRlLm5vdygpKVxuICAgIHJldHVybiBjb25uZWN0aW9uVmlldyh7XG4gICAgICBzb2NrZXRDb25uZWN0ZWQ6IHRoaXMuc29ja2V0Q29ubmVjdGVkLFxuICAgICAgYXBpQ29ubmVjdGVkOiB0aGlzLmFwaUNvbm5lY3RlZCxcbiAgICAgIGF1dGhlbnRpY2F0ZWQ6IHRoaXMuYXV0aGVudGljYXRlZCxcbiAgICAgIC8vIEEgY2xvdWQgcHJpbnRlciBiZWluZyBvcGVuZWQgaXMgY29ubmVjdGluZyBmb3IgdGhlIHdob2xlIHN3aXRjaDogaXRzXG4gICAgICAvLyBmaXJzdCByZWFkcyB0YWtlIHNlY29uZHMgb3ZlciBJcm9oLCBhbmQgXCJDYW4ndCByZWFjaFwiIHNob3dlZCBtZWFud2hpbGUuXG4gICAgICBzb2NrZXRDb25uZWN0aW5nOiB0aGlzLnNvY2tldENvbm5lY3RpbmcgfHwgKCEhYWN0aXZhdGlvblN0YXRlLnN3aXRjaGluZyAmJiBhY3RpdmF0aW9uU3RhdGUuc3dpdGNoaW5nID09PSBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCksXG4gICAgICB3YXNDb25uZWN0ZWQ6IHRoaXMud2FzQ29ubmVjdGVkLFxuICAgICAgc3RhbGxlZDogdGhpcy5zb2NrZXRTdGFsbGVkLFxuICAgICAgcHJpbnRlckluZGVwZW5kZW50OiB0aGlzLm1hbmFnZWRDb25zb2xlUm91dGUgfHwgdGhpcy5wcmludGVySW5kZXBlbmRlbnRSb3V0ZSxcbiAgICAgIG90aGVyUHJpbnRlcjogdGhpcy5vdGhlclByaW50ZXJSb3V0ZSxcbiAgICAgIGNsb3VkUHJlc2VuY2U6IHByZXNlbmNlID09PSAnb25saW5lJyA/IG51bGwgOiBwcmVzZW5jZSxcbiAgICAgIHVwZGF0aW5nOiAhdGhpcy5zb2NrZXRDb25uZWN0ZWQgJiYgdXBkYXRlV2F0Y2gucHJpbnRlciA9PT0gKGFjdGl2ZVNsdWcoKSA/PyAnJylcbiAgICAgICAgPyBvZmZsaW5lU2NyZWVuKHVwZGF0ZVdhdGNoLnJlbWVtYmVyZWQsIHVwZGF0ZVdhdGNoLm5vdywgdXBkYXRlV2F0Y2guYW5zd2VyZWQpXG4gICAgICAgIDogbnVsbFxuICAgIH0pXG4gIH1cblxuICBnZXQgbWFuYWdlZENvbnNvbGVSb3V0ZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTWFuYWdlZENvbnNvbGVQYXRoKHRoaXMuJHJvdXRlLnBhdGgpXG4gIH1cblxuICAvLyBUaGUgcmFpbCBpcyBhIHByaW50ZXIncyBwYWdlcywgc28gb25seSBhIHByaW50ZXIncyBwYWdlIGhhcyBpdDsgUHJpbnRlcnNcbiAgLy8gYW5kIHRoZSBhY2NvdW50J3MgcGFnZXMgdXNlIHRoZSB3aG9sZSB3aWR0aC5cbiAgZ2V0IHNob3dSYWlsICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMubWFuYWdlZENvbnNvbGVSb3V0ZSAmJiB0aGlzLnByaW50ZXJGcmFtZSAmJiAhdGhpcy5pc01vYmlsZVZpZXdwb3J0XG4gIH1cblxuICAvKiogVGhlIHJhaWwncyB3aWR0aCwgYXMgQXBwUmFpbCBzZXRzIGl0OiBpY29ucyBvbmx5IGJlbG93IHRoZSBsZyBicmVha3BvaW50LiAqL1xuICBnZXQgcmFpbFdpZHRoICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiR2dWV0aWZ5LmJyZWFrcG9pbnQubWRBbmREb3duID8gdGhpcy4kZ2xvYmFscy5SQUlMX1dJRFRIX0NPTVBBQ1QgOiB0aGlzLiRnbG9iYWxzLlJBSUxfV0lEVEhcbiAgfVxuXG4gIC8vIE5vdCBvbiAvc2xpY2U6IHRoZSBzbGljZXIgaW4gaXRzIGZyYW1lIGhhcyBpdHMgb3duIGJhciBhdCB0aGUgYm90dG9tLlxuICBnZXQgc2hvd1RhYkJhciAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLm1hbmFnZWRDb25zb2xlUm91dGUgJiYgdGhpcy5wcmludGVyRnJhbWUgJiYgdGhpcy5pc01vYmlsZVZpZXdwb3J0ICYmXG4gICAgICB0aGlzLmF1dGhlbnRpY2F0ZWQgJiYgdGhpcy5zb2NrZXRDb25uZWN0ZWQgJiYgIXRoaXMuc2xpY2VSb3V0ZVxuICB9XG5cbiAgZ2V0IHNsaWNlUm91dGUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRyb3V0ZS5uYW1lID09PSAnU2xpY2UnIHx8IHRoaXMuJHJvdXRlLm5hbWUgPT09ICdTbGljZSAobm8gcHJpbnRlciknXG4gIH1cblxuICAvKiogQSBmcmFtZWQgYXBwIHRoYXQgaXMgdGhlIHBhZ2UgKHJvdXRlIG1ldGEgZnVsbFBhZ2U6IFNsaWNlKTogbm8gcGFkZGluZyBvciB3aWR0aCBsaW1pdCwgdGhlIGhlaWdodCB1bmRlciB0aGUgYmFyLiAqL1xuICBnZXQgZnVsbFBhZ2UgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5tYW5hZ2VkQ29uc29sZVJvdXRlICYmIHRoaXMuJHJvdXRlLm1ldGE/LmZ1bGxQYWdlID09PSB0cnVlXG4gIH1cblxuICAvKiogVGhlIGJhcidzIGhlaWdodCAoQXBwQmFyLnZ1ZSksIHdoaWNoIGEgZnVsbCBwYWdlIGZpbGxzIHRoZSByZXN0IHVuZGVyLiAqL1xuICBnZXQgaGVhZGVySGVpZ2h0ICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmlzTW9iaWxlVmlld3BvcnQgPyB0aGlzLiRnbG9iYWxzLkhFQURFUl9IRUlHSFRfUEhPTkUgOiB0aGlzLiRnbG9iYWxzLkhFQURFUl9IRUlHSFRcbiAgfVxuXG4gIC8vIEVhY2ggcHJpbnRlciBwYWdlIGlzIG5hbWVkIGFib3ZlIGl0cyBjb250ZW50LCB3aXRoIGl0cyBzZWN0aW9uJ3MgcGFnZXNcbiAgLy8gYXMgdGFicy4gTm90IHRoZSBzbGljZXIsIHdoaWNoIGZpbGxzIHRoZSBwYWdlIHdpdGggaXRzIG93biBiYXI7IG9uIGFcbiAgLy8gcGhvbmUgdGhlIGNvbnNvbGUgYW5kIEctY29kZSBwcmV2aWV3IGtlZXAgdGhhdCBoZWlnaHQgZm9yIHRoZSB0b29sLlxuICBnZXQgc2hvd1BhZ2VIZWFkZXIgKCk6IGJvb2xlYW4ge1xuICAgIC8vIFRoZSBMaWJyYXJ5IGFuZCB0aGUgYWNjb3VudCAoS0FOLTUzMikgZHJhdyB0aGVpciBvd24gdGl0bGVzOiB0aGV5IGFyZW4ndCB0aGUgcHJpbnRlcidzIHNlY3Rpb25zLlxuICAgIGlmICghdGhpcy5wcmludGVyRnJhbWUgfHwgdGhpcy5vdGhlclByaW50ZXJSb3V0ZSB8fCB0aGlzLnNsaWNlUm91dGUgfHwgdGhpcy4kcm91dGUubmFtZT8uc3RhcnRzV2l0aCgnTGlicmFyeScpIHx8IHRoaXMuJHJvdXRlLm5hbWU/LnN0YXJ0c1dpdGgoJ0FjY291bnQnKSkgcmV0dXJuIGZhbHNlXG4gICAgLy8gU2hvd24gd2l0aCB0aGUgcGFnZTogd2hpbGUgY29ubmVjdGVkLCBhbmQgdGhyb3VnaCBhIGRyb3AsIHdoZW4gdGhlIHBhZ2Uga2VlcHMgaXRzIGxhc3Qgdmlldy5cbiAgICBpZiAoIXRoaXMuY29ubmVjdGlvbi5wYWdlIHx8IHRoaXMuY29ubmVjdGlvbi5zY3JlZW4pIHJldHVybiBmYWxzZVxuICAgIC8vIE9uIGEgcGhvbmUsIE92ZXJ2aWV3IGxlYWRzIHdpdGggdGhlIHByaW50ZXIgaXRzZWxmOyB0aGUgdG9wIGJhciBuYW1lcyBpdC5cbiAgICByZXR1cm4gISh0aGlzLmlzTW9iaWxlVmlld3BvcnQgJiYgdGhpcy5jdXJyZW50UGFnZSA9PT0gJy8nKVxuICB9XG5cbiAgZ2V0IGNvbHVtbkNvdW50ICgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuY29udGFpbmVyQ29sdW1uQ291bnQgYXMgbnVtYmVyXG4gIH1cblxuICBnZXQgZmlsZURyb3BSb290ICgpIHtcbiAgICBpZiAodGhpcy5mb3JlaWduUHJpbnRlclJvdXRlKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdGhpcy4kcm91dGUubWV0YT8uZmlsZURyb3BSb290XG4gIH1cblxuICBnZXQgbG9hZGluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaGFzV2FpdCh0aGlzLiR3YWl0cy5vbkxvYWRMYW5ndWFnZSlcbiAgfVxuXG4gIC8vIFdoaWxlIGEgbGFuZ3VhZ2UgbG9hZHMsIHRoZSBzaGVsbCBpcyBibGFuay4gTm90IG9uIC9zbGljZTogRmx1aWRkJ3NcbiAgLy8gc2V0dGluZ3MgYXJlIGVhY2ggcHJpbnRlcidzLCBzbyBhIHN3aXRjaCBvZiBwcmludGVyIGxvYWRzIHRoYXQgcHJpbnRlcidzXG4gIC8vIGxhbmd1YWdlIGFnYWluLCBhbmQgYSBibGFuayBzaGVsbCB3b3VsZCB1bm1vdW50IHRoZSBzbGljZXIncyBmcmFtZSwgd2hpY2hcbiAgLy8gc3RheXMgd2hpbGUgRmx1aWRkIHN3aXRjaGVzLiBUaGUgc2hlbGwga2VlcHMgdGhlIGxhbmd1YWdlIGl0IHNob3dzIHVudGlsXG4gIC8vIHRoZSBuZXcgb25lIGhhcyBsb2FkZWQsIHNvIG5vdGhpbmcgcmVhZHMgdW50cmFuc2xhdGVkIG1lYW53aGlsZS5cbiAgZ2V0IGJsYW5rZWRGb3JMYW5ndWFnZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubG9hZGluZyAmJiAhdGhpcy5tYW5hZ2VkQ29uc29sZVJvdXRlICYmICF0aGlzLnNsaWNlUm91dGVcbiAgfVxuXG4gIGdldCBwcm9ncmVzcyAoKTogbnVtYmVyIHtcbiAgICBjb25zdCBwcm9ncmVzcyA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRQcm9ncmVzcyddIGFzIG51bWJlclxuICAgIHJldHVybiBNYXRoLmZsb29yKHByb2dyZXNzICogMTAwKVxuICB9XG5cbiAgZ2V0IHBhZ2VUaXRsZSAoKSB7XG4gICAgaWYgKHRoaXMubWFuYWdlZENvbnNvbGVSb3V0ZSkge1xuICAgICAgcmV0dXJuIGBNdW9uM0QgfCAke3RoaXMuJHJvdXRlLm5hbWUgPz8gJ01hbmFnZWQgcHJldmlldyd9YFxuICAgIH1cblxuICAgIC8vIFRoZSBwcmludGVyJ3MgbmFtZSBhcyBwZW9wbGUga25vdyBpdCAoQm94d29vZCwgbm90IG11b24tYm94d29vZC0zNjdhKSxcbiAgICAvLyBhbmQgb25seSBvbmNlIHRoZSBwcmludGVyIGhhcyBzYWlkIGl0OyB0aGUgcGFnZSdzIG93biBuYW1lIGFzIHRoZSByYWlsXG4gICAgLy8gc2hvd3MgaXQgKE92ZXJ2aWV3LCBub3QgdGhlIHJvdXRlJ3MgaW50ZXJuYWwgbmFtZSk7IG5ldmVyIFwibnVsbFwiXG4gICAgLy8gKEtBTi0yMjU3KS5cbiAgICBjb25zdCBkaXNwbGF5TmFtZSA9IHRoaXMuJHN0b3JlLmdldHRlcnNbJ2NvbmZpZy9nZXREaXNwbGF5TmFtZSddIGFzIHN0cmluZ1xuICAgIGNvbnN0IGluc3RhbmNlTmFtZSA9IHRoaXMuZm9yZWlnblByaW50ZXJSb3V0ZVxuICAgICAgPyBmb3JlaWduUmVjb3JkRm9yU2x1Zyh0aGlzLiRyb3V0ZS5wYXJhbXMucHJpbnRlcik/Lm5hbWUgPz8gJ090aGVyIHByaW50ZXInXG4gICAgICA6IGRpc3BsYXlOYW1lICYmIGRpc3BsYXlOYW1lICE9PSBHbG9iYWxzLlBST0RVQ1RfTkFNRSA/IHByaW50ZXJOYW1lUGFydHMoZGlzcGxheU5hbWUpLm5hbWUgOiBHbG9iYWxzLlBST0RVQ1RfTkFNRVxuICAgIGNvbnN0IHBhZ2VOYW1lID0gdGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIgPyBwYWdlTGFiZWwocGFnZU9mUm91dGUodGhpcy4kcm91dGUpKSA/PyB0aGlzLiRyb3V0ZS5uYW1lIDogdGhpcy4kcm91dGUubmFtZVxuXG4gICAgcmV0dXJuIFt0aGlzLnByaW50ZXJQcmludGluZyA/IGBbJHt0aGlzLnByb2dyZXNzfSVdYCA6ICcnLCBpbnN0YW5jZU5hbWUsIHBhZ2VOYW1lID8/ICcnXS5maWx0ZXIoQm9vbGVhbikuam9pbignIHwgJylcbiAgfVxuXG4gIGdldCBwYWdlSWNvbiAoKTogTGlua1Byb3BlcnR5SHJlZltdIHtcbiAgICBpZiAodGhpcy5tYW5hZ2VkQ29uc29sZVJvdXRlKSByZXR1cm4gW11cblxuICAgIGNvbnN0IGljb25EYXRhVXJsID0gdGhpcy5wcmludEluUHJvZ3Jlc3NJY29uRGF0YVVybCB8fCB0aGlzLmRlZmF1bHRJY29uRGF0YVVybFxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgcmVsOiAnaWNvbicsXG4gICAgICAgIHR5cGU6ICdpbWFnZS9zdmcreG1sJyxcbiAgICAgICAgc2l6ZXM6ICczMngzMicsXG4gICAgICAgIGhyZWY6IGljb25EYXRhVXJsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWw6ICdpY29uJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3N2Zyt4bWwnLFxuICAgICAgICBzaXplczogJzE2eDE2JyxcbiAgICAgICAgaHJlZjogaWNvbkRhdGFVcmxcbiAgICAgIH1cbiAgICBdXG4gIH1cblxuICBnZXQgcGFnZU1ldGEgKCk6IE1ldGFQcm9wZXJ0eU5hbWVbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ3RoZW1lLWNvbG9yJyxcbiAgICAgICAgY29udGVudDogdGhpcy5wcmltYXJ5Q29sb3JcbiAgICAgIH1cbiAgICBdXG4gIH1cblxuICBnZXQgcHJpbnRJblByb2dyZXNzSWNvbkRhdGFVcmwgKCkge1xuICAgIGlmICh0aGlzLnByaW50ZXJQcmludGluZykgcmV0dXJuIHByb2dyZXNzRmF2aWNvbih0aGlzLnByb2dyZXNzLCB0aGlzLnByaW1hcnlDb2xvcilcbiAgfVxuXG4gIGdldCBkZWZhdWx0SWNvbkRhdGFVcmwgKCkge1xuICAgIGNvbnN0IGxvZ29XaXRoQ29sb3IgPSBgPHN2ZyB3aWR0aD1cIjU2XCIgaGVpZ2h0PVwiNTZcIiB2aWV3Qm94PVwiMCAwIDU2IDU2XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxnPjxwYXRoIGZpbGw9XCIke3RoaXMucHJpbWFyeU9mZnNldENvbG9yfVwiIGQ9XCJtIDE0Ljg1MzM2OCwzMy43NTY1NzEgMTEuNjE2MTksOS42NjExNjggYyAwLjEzMDc3NywwLjExMTkxNyAwLjI3MTQ4NSwwLjIwNzY1OSAwLjQxOTIxMywwLjI4NjczOCB2IDAgbCAwLjAwMTgsOS41OWUtNCAwLjA0NDIxLDAuMDIyODggMC4wMTY4MiwwLjAwODQgMC4wMzAwNCwwLjAxNDY2IDAuMDI3NzIsMC4wMTMwMSAwLjAyMDg1LDAuMDA5NiAwLjAzNjQzLDAuMDE2MTQgMC4wMTEyLDAuMDA0OCBjIDAuMjYxODM0LDAuMTExNDU3IDAuNTM4NDU0LDAuMTcyOTQ2IDAuODE2MTY1LDAuMTg1MDg5IHYgMCBsIDAuMDA5NCw0LjY2ZS00IDAuMDQ0MjEsMC4wMDE0IDAuMDE3NDMsMy4xMWUtNCAwLjAzNTc5LDEuNTdlLTQgMC4wMzExMywtMS41N2UtNCAwLjAxOTc2LC0zLjExZS00IDAuMDQ2MzgsLTAuMDAxNiAwLjAwNjYsLTEuNTdlLTQgYyAwLjI3ODMzMiwtMC4wMTIxOSAwLjU1NTg4NiwtMC4wNzM3OSAwLjgxODQ5OCwtMC4xODU4NjQgdiAwIGwgMC4wMDc2LC0wLjAwMzEgMC4wNDE0MSwtMC4wMTgzNiAwLjAxNTgxLC0wLjAwNzIgMC4wMzAxOSwtMC4wMTQzMyAwLjAzMTkyLC0wLjAxNTQ4IDAuMDEzNjcsLTAuMDA3MSAwLjA0Mzc1LC0wLjAyMjczIDAuMDA0OCwtMC4wMDIzIGMgMC4xNDc0MjgsLTAuMDc4OTMgMC4yODc4MjgsLTAuMTc0NTAyIDAuNDE4Mjc4LC0wLjI4NjI3IHYgMCBMIDQwLjM5MDU5MSwzNC4zODU3MTMgNDYuMDM3NDE1LDM4LjExMjg1MiAyNy45OTk3NjYsNTYgOS4yNDI1MDIsMzcuMzk3OTM2IFogbSAwLjQwODMxNCwtMTQuNDUxMjAyIDExLjQyNTY1NSw3LjM0OTIwMSBjIDAuNDA2MjkyLDAuMjY2OTY5IDAuODU5NDM5LDAuNDAwNTMgMS4zMTI1ODYsMC40MDA2ODcgMC40NTI2NzksMCAwLjkwNTM2LC0wLjEzMzI0NyAxLjMxMTk2MywtMC40MDAwNjQgdiAwIGwgMTEuNDI2Mjc4LC03LjM0OTA0NSA4LjczNjM0OSw0LjQ2MjE5NyAtMjEuNDc0NTksMTcuODU5MDY3IC0yMS40NzQ1OSwtMTcuODYwMzEgeiBNIDI3Ljk5OTkyMywwIDUyLjQyMDA0NSw4Ljk5MjU3ODYgMjcuOTk5OTIzLDI0LjY5ODc2OSAzLjU3OTk1NSw4Ljk5MTMzMjMgWlwiIC8+PHBhdGggZmlsbD1cIiR7dGhpcy5wcmltYXJ5Q29sb3J9XCIgZD1cIm0gMjgsMCAtMC4xMzQ3NjYsMC4wNTA3ODEyNSBoIDAuMTUwMzkxIFYgMjQuNjg5NDUzIEwgNTIuNDE5OTIyLDguOTkyMTg3NSBaIG0gMTIuNzM4MjgxLDE5LjMwNjY0MSAtMTEuNDI1NzgxLDcuMzQ3NjU2IC0wLjA1ODU5LDAuMDM5MDYgYyAtMC4zODY0NjUsMC4yMzg5OTIgLTAuODEyNTE0LDAuMzU4MzI5IC0xLjIzODI4MSwwLjM2MTMyOSB2IDE0LjU1ODU5NSBsIDIxLjQ1ODk4LC0xNy44NDU3MDMgeiBtIC0wLjM0NzY1NiwxNS4wODAwNzggLTEwLjg1OTM3NSw5LjAzMTI1IGMgLTAuMTMwNDUsMC4xMTE3NjcgLTAuMjcwNTk2LDAuMjA2MjA2IC0wLjQxNzk2OSwwLjI4NTE1NiBsIC0wLjAwNTksMC4wMDIgLTAuMDQyOTcsMC4wMjM0NCAtMC4wMTM2NywwLjAwNzggLTAuMDMzMiwwLjAxNTYzIC0wLjAyOTMsMC4wMTM2NyAtMC4wMTU2MywwLjAwNzggLTAuMDQxMDIsMC4wMTc1OCAtMC4wMDc4LDAuMDAzOSBjIC0wLjI2MjYxLDAuMTEyMDc1IC0wLjU0MDAyNywwLjE3MzM1NyAtMC44MTgzNTksMC4xODU1NDcgaCAtMC4wMDc4IGwgLTAuMDQ0OTIsMC4wMDIgaCAtMC4wMjE0OCAtMC4wMTU2MyBWIDU1Ljk4NDM3NSBMIDQ2LjAzNzEwOSwzOC4xMTMyODEgWlwiIC8+PC9nPjwvc3ZnPmBcblxuICAgIHJldHVybiBgZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCwke2J0b2EobG9nb1dpdGhDb2xvcil9YFxuICB9XG5cbiAgZ2V0IGN1c3RvbVN0eWxlU2hlZXQgKCkge1xuICAgIHJldHVybiB0aGlzLiRzdG9yZS5nZXR0ZXJzWydjb25maWcvZ2V0Q3VzdG9tVGhlbWVGaWxlJ10oJ2N1c3RvbScsIFsnLmNzcyddKVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBhY3RpdmUgcHJpbnRlcidzIHN0YXRlIGtlcHQgZm9yIHRoZSBuZXh0IGxvYWQncyBjYWNoZWQgdmlld1xuICAgKiAoS0FOLTUyNSksIGF0IG1vc3Qgb25jZSBldmVyeSA1IHM7IGNoYW5nZXMgaW5zaWRlIHRoYXQgYXJlIGRyYXduIGJ5IHRoZVxuICAgKiBuZXh0IG9uZSwgYW5kIGxlYXZpbmcgdGhlIHRhYiBzYXZlcyBvbiB0aGUgc3BvdC5cbiAgICovXG4gIGdldCBzbmFwc2hvdFN0YXR1c0xpbmUgKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcCA9IHRoaXMuJHN0b3JlLnN0YXRlLnByaW50ZXIucHJpbnRlclxuICAgIGlmICghcCkgcmV0dXJuICcnXG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBNYXRoLmZsb29yKCh0aGlzLiRzdG9yZS5nZXR0ZXJzWydwcmludGVyL2dldFByaW50UHJvZ3Jlc3MnXSBhcyBudW1iZXIpICogMTAwKVxuICAgIHJldHVybiBbXG4gICAgICB0aGlzLmRpc3BsYXlOYW1lLFxuICAgICAgcC5wcmludF9zdGF0cz8uc3RhdGUgPz8gJycsXG4gICAgICBwLnByaW50X3N0YXRzPy5maWxlbmFtZSA/PyAnJyxcbiAgICAgIHByb2dyZXNzLFxuICAgICAgTWF0aC5yb3VuZChwLmV4dHJ1ZGVyPy50ZW1wZXJhdHVyZSA/PyAwKSxcbiAgICAgIE1hdGgucm91bmQocC5oZWF0ZXJfYmVkPy50ZW1wZXJhdHVyZSA/PyAwKVxuICAgIF0uam9pbignfCcpXG4gIH1cblxuICBzbmFwc2hvdFNhdmVkQXQgPSAwXG5cbiAgQFdhdGNoKCdzbmFwc2hvdFN0YXR1c0xpbmUnKVxuICBvblNuYXBzaG90U3RhdHVzTGluZSAobGluZTogc3RyaW5nKSB7XG4gICAgaWYgKCFsaW5lKSByZXR1cm5cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgaWYgKG5vdyAtIHRoaXMuc25hcHNob3RTYXZlZEF0IDwgNTAwMCkgcmV0dXJuXG4gICAgdGhpcy5zbmFwc2hvdFNhdmVkQXQgPSBub3dcbiAgICB0aGlzLnNhdmVTbmFwc2hvdFN0YXR1cygpXG4gIH1cblxuICBzYXZlU25hcHNob3RTdGF0dXMgKCkge1xuICAgIGNvbnN0IHNsdWcgPSBhY3RpdmVTbHVnKClcbiAgICBjb25zdCBwID0gdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyXG4gICAgaWYgKCFzbHVnIHx8ICFwKSByZXR1cm5cbiAgICBjb25zdCBwcm9ncmVzcyA9IE1hdGguZmxvb3IoKHRoaXMuJHN0b3JlLmdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRQcm9ncmVzcyddIGFzIG51bWJlcikgKiAxMDApXG4gICAgY29uc3Qgc3RhdGUgPSAocC5wcmludF9zdGF0cz8uc3RhdGUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAncmVhZHknXG4gICAgc2F2ZVNuYXBzaG90U3RhdHVzKHNsdWcsIHtcbiAgICAgIG5hbWU6IHRoaXMuZGlzcGxheU5hbWUsXG4gICAgICBzdGF0ZSxcbiAgICAgIGxhYmVsOiBzdGF0ZSA9PT0gJ3ByaW50aW5nJyA/IGAke3Byb2dyZXNzfSVgIDogc3RhdGUgPT09ICdwYXVzZWQnID8gJ1BhdXNlZCcgOiBzdGF0ZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0YXRlLnNsaWNlKDEpLFxuICAgICAgZmlsZTogKHAucHJpbnRfc3RhdHM/LmZpbGVuYW1lIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgfHwgbnVsbCxcbiAgICAgIHByb2dyZXNzLFxuICAgICAgbm96emxlOiB0eXBlb2YgcC5leHRydWRlcj8udGVtcGVyYXR1cmUgPT09ICdudW1iZXInID8gTWF0aC5yb3VuZChwLmV4dHJ1ZGVyLnRlbXBlcmF0dXJlKSA6IG51bGwsXG4gICAgICBiZWQ6IHR5cGVvZiBwLmhlYXRlcl9iZWQ/LnRlbXBlcmF0dXJlID09PSAnbnVtYmVyJyA/IE1hdGgucm91bmQocC5oZWF0ZXJfYmVkLnRlbXBlcmF0dXJlKSA6IG51bGxcbiAgICB9KVxuICB9XG5cbiAgb25WaXNpYmlsaXR5U2F2ZSAoKSB7XG4gICAgaWYgKGRvY3VtZW50LmhpZGRlbikgdGhpcy5zYXZlU25hcHNob3RTdGF0dXMoKVxuICB9XG5cbiAgQFdhdGNoKCdjdXN0b21TdHlsZVNoZWV0JylcbiAgYXN5bmMgb25DdXN0b21TdHlsZVNoZWV0ICh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgdXJsID0gYXdhaXQgdGhpcy5jcmVhdGVGaWxlVXJsV2l0aFRva2VuKHZhbHVlLCAnY29uZmlnJylcblxuICAgIGNvbnN0IG9sZEN1c3RvbVN0eWxlc2hlZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VzdG9tU3R5bGVzaGVldCcpXG5cbiAgICBpZiAob2xkQ3VzdG9tU3R5bGVzaGVldCkge1xuICAgICAgb2xkQ3VzdG9tU3R5bGVzaGVldC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCB1cmwpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBsaW5rRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKVxuXG4gICAgbGlua0VsZW1lbnQucmVsID0gJ3N0eWxlc2hlZXQnXG4gICAgbGlua0VsZW1lbnQudHlwZSA9ICd0ZXh0L2NzcydcbiAgICBsaW5rRWxlbWVudC5pZCA9ICdjdXN0b21TdHlsZXNoZWV0J1xuICAgIGxpbmtFbGVtZW50LmhyZWYgPSB1cmxcblxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGlua0VsZW1lbnQpXG4gIH1cblxuICBnZXQgY3VzdG9tQmFja2dyb3VuZEltYWdlICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldEN1c3RvbVRoZW1lRmlsZSddKCdiYWNrZ3JvdW5kJywgWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLmdpZiddKVxuICB9XG5cbiAgQFdhdGNoKCdjdXN0b21CYWNrZ3JvdW5kSW1hZ2UnKVxuICBhc3luYyBvbkN1c3RvbUJhY2tncm91bmRJbWFnZSAodmFsdWU6IHN0cmluZykge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHVybCA9IGF3YWl0IHRoaXMuY3JlYXRlRmlsZVVybFdpdGhUb2tlbih2YWx1ZSwgJ2NvbmZpZycpXG5cbiAgICB0aGlzLmN1c3RvbUJhY2tncm91bmRJbWFnZVN0eWxlID0ge1xuICAgICAgYmFja2dyb3VuZEltYWdlOiBgdXJsKCR7dXJsfSlgLFxuICAgICAgYmFja2dyb3VuZFNpemU6ICdjb3ZlcicsXG4gICAgICBiYWNrZ3JvdW5kQXR0YWNobWVudDogJ2ZpeGVkJyxcbiAgICAgIGJhY2tncm91bmRSZXBlYXQ6ICduby1yZXBlYXQnXG4gICAgfVxuICB9XG5cbiAgZ2V0IGVuYWJsZUtleWJvYXJkU2hvcnRjdXRzICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5lbmFibGVLZXlib2FyZFNob3J0Y3V0c1xuICB9XG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5tb3VudGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIC8vIFRoZSBsb2FkZXIncyA2IHMgaG9sZCBvbiAnY29ubmVjdGluZycgbmVlZHMgYSB0aWNrIGV2ZW4gd2hlbiBub3RoaW5nIGNoYW5nZXMuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7IGlmICh0aGlzLmxvYWRlclJlYWR5KSB0aGlzLmRpc21pc3NMb2FkZXIoKSB9LCA2MDAwKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMuaGFuZGxlRHJhZ092ZXIpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIHRoaXMuaGFuZGxlRHJhZ092ZXIpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIHRoaXMuaGFuZGxlRHJhZ0xlYXZlKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5oYW5kbGVEcm9wKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlEb3duLCBmYWxzZSlcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5vblZpc2liaWxpdHlTYXZlKVxuICAgIHRoaXMuZGFya1F1ZXJ5ID0gdHlwZW9mIHdpbmRvdy5tYXRjaE1lZGlhID09PSAnZnVuY3Rpb24nID8gd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyayknKSA6IG51bGxcbiAgICB0aGlzLmRhcmtRdWVyeT8uYWRkRXZlbnRMaXN0ZW5lcj8uKCdjaGFuZ2UnLCB0aGlzLm9uU3lzdGVtRGFyaylcblxuICAgIC8vIHRoaXMub25Mb2FkTG9jYWxlKHRoaXMuJGkxOG4ubG9jYWxlKVxuICAgIEV2ZW50QnVzLmJ1cy4kb24oJ2ZsYXNoTWVzc2FnZScsIChwYXlsb2FkOiBGbGFzaE1lc3NhZ2UpID0+IHtcbiAgICAgIHRoaXMuZmxhc2hNZXNzYWdlU3RhdGUudGV4dCA9IChwYXlsb2FkICYmIHBheWxvYWQudGV4dCkgfHwgdW5kZWZpbmVkXG4gICAgICB0aGlzLmZsYXNoTWVzc2FnZVN0YXRlLnR5cGUgPSAocGF5bG9hZCAmJiBwYXlsb2FkLnR5cGUpIHx8IHVuZGVmaW5lZFxuICAgICAgdGhpcy5mbGFzaE1lc3NhZ2VTdGF0ZS50aW1lb3V0ID0gKHBheWxvYWQgJiYgcGF5bG9hZC50aW1lb3V0ICE9PSB1bmRlZmluZWQpID8gcGF5bG9hZC50aW1lb3V0IDogdW5kZWZpbmVkXG4gICAgICB0aGlzLiRzZXQodGhpcy5mbGFzaE1lc3NhZ2VTdGF0ZSwgJ2FjdGlvbicsIHBheWxvYWQ/LmFjdGlvbilcbiAgICAgIHRoaXMuZmxhc2hNZXNzYWdlU3RhdGUub3BlbiA9IHRydWVcbiAgICB9KVxuXG4gICAgY29uc3QgbGVnYWN5RWxlbWVudHNTZWxlY3RvcnMgPSBbXG4gICAgICBcImxpbmtbcmVsKj0naWNvbiddW3R5cGU9J2ltYWdlL3BuZyddXCIsXG4gICAgICBcIm1ldGFbbmFtZT0ndGhlbWUtY29sb3InXVwiXG4gICAgXVxuXG4gICAgZm9yIChjb25zdCBsZWdhY3lFbGVtZW50c1NlbGVjdG9yIG9mIGxlZ2FjeUVsZW1lbnRzU2VsZWN0b3JzKSB7XG4gICAgICBjb25zdCBsZWdhY3lFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwobGVnYWN5RWxlbWVudHNTZWxlY3RvcilcblxuICAgICAgbGVnYWN5RWxlbWVudHMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgY29uc3QgcGFyZW50RWxlbWVudCA9IGl0ZW0ucGFyZW50RWxlbWVudFxuXG4gICAgICAgIGlmIChwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgcGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChpdGVtKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMuaGFuZGxlRHJhZ092ZXIpXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIHRoaXMuaGFuZGxlRHJhZ092ZXIpXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIHRoaXMuaGFuZGxlRHJhZ0xlYXZlKVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5oYW5kbGVEcm9wKVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlEb3duKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLm9uVmlzaWJpbGl0eVNhdmUpXG4gICAgdGhpcy5kYXJrUXVlcnk/LnJlbW92ZUV2ZW50TGlzdGVuZXI/LignY2hhbmdlJywgdGhpcy5vblN5c3RlbURhcmspXG4gIH1cblxuICBkYXJrUXVlcnk6IE1lZGlhUXVlcnlMaXN0IHwgbnVsbCA9IG51bGxcblxuICBvblN5c3RlbURhcmsgKGV2ZW50OiBNZWRpYVF1ZXJ5TGlzdEV2ZW50KSB7XG4gICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2NvbmZpZy9hcHBseVN5c3RlbURhcmsnLCBldmVudC5tYXRjaGVzKVxuICB9XG5cbiAgaGFuZGxlRHJhZ092ZXIgKGV2ZW50OiBEcmFnRXZlbnQpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLmZpbGVEcm9wUm9vdCAmJlxuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyICYmXG4gICAgICBoYXNGaWxlc0luRGF0YVRyYW5zZmVyKGV2ZW50LmRhdGFUcmFuc2ZlcilcbiAgICApIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5kcmFnU3RhdGUgPSB0cnVlXG5cbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknXG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRHJhZ0xlYXZlIChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgaWYgKHRoaXMuZmlsZURyb3BSb290KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnQudGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiZcbiAgICAgICAgZXZlbnQudGFyZ2V0LmNsYXNzTmFtZS5pbmNsdWRlcygnZmx1aWRkJylcbiAgICAgICkge1xuICAgICAgICB0aGlzLmRyYWdTdGF0ZSA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgaGFuZGxlRHJvcCAoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmZpbGVEcm9wUm9vdFxuXG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5kcmFnU3RhdGUgPSBmYWxzZVxuXG4gICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZ2V0RmlsZXNGcm9tRGF0YVRyYW5zZmVyKGV2ZW50LmRhdGFUcmFuc2ZlcilcblxuICAgICAgICBpZiAoZmlsZXMpIHtcbiAgICAgICAgICAvLyBPbiBhIHByaW50ZXIncyBwYWdlcywgYSBtb2RlbCBpcyBTbGljZSdzIHRvIG9wZW4sIG5vdCBhIGZpbGUgdG9cbiAgICAgICAgICAvLyBrZWVwOyBHLWNvZGUgZ29lcyBpbiwgYW5kIG9uZSBmaWxlIG9uIGl0cyBvd24gaXMgb2ZmZXJlZCB0byBwcmludC5cbiAgICAgICAgICBjb25zdCBtb2RlbHMgPSByb290ID09PSAnZ2NvZGVzJyA/IGZpbGVzLmZpbHRlcihmID0+IGlzTW9kZWxGaWxlKGYuZmlsZS5uYW1lKSkgOiBbXVxuICAgICAgICAgIGNvbnN0IHJlc3QgPSBmaWxlcy5maWx0ZXIoZiA9PiAhbW9kZWxzLmluY2x1ZGVzKGYpKVxuICAgICAgICAgIC8vIFRoZSBGaWxlIG9iamVjdHMgZ28gd2l0aCBpdDogT3BlbiBTbGljZSBoYW5kcyB0aGVtIHRvIHRoZSBzbGljZXIgKEtBTi0yMTkxKS5cbiAgICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCkgRXZlbnRCdXMuYnVzLiRlbWl0KCdtb2RlbC1kcm9wcGVkJywgbW9kZWxzLm1hcChmID0+IGYuZmlsZSkpXG4gICAgICAgICAgaWYgKCFyZXN0Lmxlbmd0aCkgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBwYXRoV2l0aFJvb3QgPSB0aGlzLiRzdG9yZS5nZXR0ZXJzWydmaWxlcy9nZXRDdXJyZW50UGF0aEJ5Um9vdCddKHJvb3QpIGFzIHN0cmluZyB8fCAnJ1xuICAgICAgICAgIGNvbnN0IHBhdGggPSBwYXRoV2l0aFJvb3QgPT09IHJvb3RcbiAgICAgICAgICAgID8gJydcbiAgICAgICAgICAgIDogcGF0aFdpdGhSb290LnN1YnN0cmluZyhyb290Lmxlbmd0aCArIDEpXG5cbiAgICAgICAgICBjb25zdCB3YWl0ID0gYCR7dGhpcy4kd2FpdHMub25GaWxlU3lzdGVtfS8ke3BhdGhXaXRoUm9vdH0vYFxuXG4gICAgICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ3dhaXQvYWRkV2FpdCcsIHdhaXQpXG5cbiAgICAgICAgICBjb25zdCB1cGxvYWRlZCA9IGF3YWl0IHRoaXMudXBsb2FkRmlsZXMocmVzdCwgcGF0aCwgcm9vdCwgZmFsc2UpXG5cbiAgICAgICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnd2FpdC9yZW1vdmVXYWl0Jywgd2FpdClcblxuICAgICAgICAgIC8vIE9ubHkgYSBmaWxlIHRoYXQgcmVhbGx5IHVwbG9hZGVkIGlzIG9mZmVyZWQgdG8gcHJpbnQuXG4gICAgICAgICAgY29uc3QgZ2NvZGVzID0gcmVzdC5maWx0ZXIoZiA9PiBpc0djb2RlRmlsZShmLmZpbGUubmFtZSkgJiYgIWYucGF0aCAmJlxuICAgICAgICAgICAgdXBsb2FkZWQgIT09IGZhbHNlICYmIHVwbG9hZGVkLmluY2x1ZGVzKHBhdGggPyBgJHtwYXRofS8ke2YuZmlsZS5uYW1lfWAgOiBmLmZpbGUubmFtZSkpXG4gICAgICAgICAgaWYgKHJvb3QgPT09ICdnY29kZXMnICYmIGdjb2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIEV2ZW50QnVzLmJ1cy4kZW1pdCgnam9iLXJlYWR5JywgcGF0aCA/IGAke3BhdGh9LyR7Z2NvZGVzWzBdLmZpbGUubmFtZX1gIDogZ2NvZGVzWzBdLmZpbGUubmFtZSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVLZXlEb3duIChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmICghdGhpcy5lbmFibGVLZXlib2FyZFNob3J0Y3V0cyB8fCB0aGlzLmNvbm5lY3Rpb24uc3RhbGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHNob3J0Y3V0ID0ga2V5Ym9hcmRFdmVudFRvS2V5Ym9hcmRTaG9ydGN1dChldmVudClcblxuICAgIGlmIChzaG9ydGN1dCA9PT0gJ0N0cmwrU2hpZnQrRScpIHtcbiAgICAgIGlmICh0aGlzLmZvcmVpZ25QcmludGVyUm91dGUpIHJldHVyblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgICB0aGlzLmVtZXJnZW5jeVN0b3AoKVxuXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoZXZlbnRUYXJnZXRJc0NvbnRlbnRFZGl0YWJsZShldmVudCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh0aGlzLmhhbmRsZUdvS2V5KGV2ZW50LCBzaG9ydGN1dCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHN3aXRjaCAoc2hvcnRjdXQpIHtcbiAgICAgIC8vIFRoZSBzYW1lIHBhZ2Ugb2YgdGhlIHByaW50ZXIgYmVmb3JlIG9yIGFmdGVyIHRoaXMgb25lLlxuICAgICAgY2FzZSAnWyc6XG4gICAgICBjYXNlICddJzoge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5mb3JlaWduUHJpbnRlclJvdXRlID8gdGhpcy4kcm91dGUucGFyYW1zLnByaW50ZXIgOiBhY3RpdmVTbHVnKClcbiAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMucHJpbnRlckZyYW1lID8gc3RlcFByaW50ZXIoY3VycmVudCwgc2hvcnRjdXQgPT09ICddJyA/IDEgOiAtMSkgOiBudWxsXG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIHRoaXMuJHJvdXRlci5wdXNoKHNhbWVQYWdlRm9yKHRoaXMuJHJvdXRlLCBuZXh0KSkuY2F0Y2goKCkgPT4ge30pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ3UnOlxuICAgICAgICBpZiAoIXRoaXMuZm9yZWlnblByaW50ZXJSb3V0ZSAmJiB0aGlzLnByaW50ZXJGcmFtZSAmJiB0aGlzLnNvY2tldENvbm5lY3RlZCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBFdmVudEJ1cy5idXMuJGVtaXQoJ3VwbG9hZC1maWxlJylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cblxuICAgICAgY2FzZSAnZic6XG4gICAgICAgIGlmICh0aGlzLiRyb3V0ZS5uYW1lID09PSAnQ2FtZXJhJykge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBFdmVudEJ1cy5idXMuJGVtaXQoJ2NhbWVyYS1mdWxsc2NyZWVuJylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodGhpcy5mb3JlaWduUHJpbnRlclJvdXRlIHx8ICF0aGlzLmtsaXBweVJlYWR5KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzd2l0Y2ggKHNob3J0Y3V0KSB7XG4gICAgICBjYXNlICdTaGlmdCtDJzpcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMucHJpbnRlclByaW50aW5nIHx8XG4gICAgICAgICAgdGhpcy5wcmludGVyUGF1c2VkXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgICAgIHRoaXMuY2FuY2VsUHJpbnQoKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG5cbiAgICAgIGNhc2UgJ1NoaWZ0K1AnOlxuICAgICAgICBpZiAodGhpcy5wcmludGVyUHJpbnRpbmcpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgICAgICB0aGlzLnBhdXNlUHJpbnQoKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJpbnRlclBhdXNlZCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgICAgIHRoaXMucmVzdW1lUHJpbnQoKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG5cbiAgICAgIGNhc2UgJ1NoaWZ0K0gnOlxuICAgICAgICBpZiAoIXRoaXMucHJpbnRlclByaW50aW5nKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgICAgICAgdGhpcy5ob21lQWxsKClcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHIHRoZW4gYSBsZXR0ZXI6IEcgUCBldmVyeSBwcmludGVyLCBHIEEgeW91ciBhY2NvdW50LCBHIE8gdGhpcyBwcmludGVyJ3MgT3ZlcnZpZXcsIEcgSiBpdHMgSm9icy4gKi9cbiAgaGFuZGxlR29LZXkgKGV2ZW50OiBLZXlib2FyZEV2ZW50LCBzaG9ydGN1dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3RlcCA9IHRoaXMuZ29LZXlzLmZlZWQoc2hvcnRjdXQsIERhdGUubm93KCkpXG4gICAgaWYgKCFzdGVwKSByZXR1cm4gZmFsc2VcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgaWYgKHN0ZXAua2luZCA9PT0gJ3N0YXJ0JykgcmV0dXJuIHRydWVcblxuICAgIGxldCB0bzogc3RyaW5nIHwgbnVsbCA9IG51bGxcbiAgICBpZiAoc3RlcC5rZXkgPT09IEFMTF9QUklOVEVSU19LRVkpIHtcbiAgICAgIHRvID0gJy8nXG4gICAgfSBlbHNlIGlmIChzdGVwLmtleSA9PT0gTElCUkFSWV9LRVkpIHtcbiAgICAgIC8vIFRoZSByb3V0ZXIgc2VuZHMgaXQgdW5kZXIgYSBwcmludGVyIG9ubHkgZnJvbSB0aGF0IHByaW50ZXIncyBvd24gcGFnZXMuXG4gICAgICB0byA9ICcvbGlicmFyeSdcbiAgICB9IGVsc2UgaWYgKHN0ZXAua2V5ID09PSBBQ0NPVU5UX0tFWSkge1xuICAgICAgdG8gPSBzY29wZWRQYXRoKCcvYWNjb3VudCcsIGFjdGl2ZVNsdWcoKSlcbiAgICB9IGVsc2UgaWYgKGFjdGl2ZVNsdWcoKSB8fCB0aGlzLmZvcmVpZ25QcmludGVyUm91dGUpIHtcbiAgICAgIGNvbnN0IHNlY3Rpb24gPSBzZWN0aW9uRm9yS2V5KHN0ZXAua2V5LCB0aGlzLnNlY3Rpb25Db250ZXh0KVxuICAgICAgY29uc3QgcGFnZSA9IFBBR0VfS0VZUy5maW5kKHAgPT4gcC5rZXkgPT09IHN0ZXAua2V5KVxuICAgICAgaWYgKHNlY3Rpb24pIHRvID0gdGhpcy5zZWN0aW9uVG8oc2VjdGlvbilcbiAgICAgIGVsc2UgaWYgKHBhZ2UgJiYgIXRoaXMuZm9yZWlnblByaW50ZXJSb3V0ZSkgdG8gPSBgJHtzY29wZWRQYXRoKHBhZ2UucGF0aCwgYWN0aXZlU2x1ZygpKX0ke3BhZ2UuaGFzaCA/PyAnJ31gXG4gICAgfVxuICAgIGlmICh0byAmJiB0byAhPT0gdGhpcy4kcm91dGUuZnVsbFBhdGgpIHRoaXMuJHJvdXRlci5wdXNoKHRvKS5jYXRjaCgoKSA9PiB7fSlcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAubXVvbi1zaGVsbCB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWJnKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICB9XG5cbiAgLm11b24tbWFpbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWJnKTtcbiAgfVxuXG4gIC5tdW9uLWNvbnRlbnQge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB6LWluZGV4OiAxO1xuICB9XG5cbiAgLy8gQSBmcmFtZWQgYXBwIHRoYXQgaXMgdGhlIHBhZ2UgKFNsaWNlKTogdGhlIGhlaWdodCB1bmRlciB0aGUgYmFyLCBiYW5uZXJzIGFib3ZlIGl0LCB0aGUgYXBwIHRha2luZyB0aGUgcmVzdC5cbiAgLm11b24tY29udGVudC0tZnVsbCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIG1heC13aWR0aDogbm9uZTtcbiAgICBoZWlnaHQ6IGNhbGMoMTAwdmggLSB2YXIoLS1tdW9uLWhlYWRlci1oZWlnaHQsIDY0cHgpKTtcbiAgICBoZWlnaHQ6IGNhbGMoMTAwZHZoIC0gdmFyKC0tbXVvbi1oZWFkZXItaGVpZ2h0LCA2NHB4KSk7XG4gICAgcGFkZGluZzogMDtcbiAgfVxuXG4gIC8vIEEgcGFnZSBmcm9tIGJlZm9yZSB0aGUgY29ubmVjdGlvbiBkcm9wcGVkOiBpdHMgbnVtYmVycyBhcmUgb3V0IG9mIGRhdGVcbiAgLy8gYW5kIGl0cyBjb250cm9scyB3b3VsZCBzZW5kIGludG8gbm90aGluZywgc28gaXQgaXMgZ3JleWVkIGFuZCBzdGlsbC5cbiAgLm11b24tc3RhbGUge1xuICAgIGZpbHRlcjogZ3JheXNjYWxlKDAuNSk7XG4gICAgb3BhY2l0eTogMC41NTtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IDAuM3MgZWFzZTtcbiAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgfVxuXG4gIC8vIFRoZSBwYWdlIHN0YXJ0cyByaWdodCBvZiB0aGUgcmFpbCBmcm9tIGl0cyBmaXJzdCBwYWludC4gVnVldGlmeSBvbmx5XG4gIC8vIG1vdmVzIGl0IHRoZXJlIG9uY2UgdGhlIHJhaWwgaGFzIHJlZ2lzdGVyZWQgaXRzIHdpZHRoLCBhbmQgYSBwYWdlIHRoYXRcbiAgLy8gcGFpbnRzIGJlZm9yZSB0aGVuIChhIHNsb3cgcHJpbnRlciwgYSBidXN5IGZpcnN0IHJlbmRlcikgZHJldyB1bmRlciBpdC5cbiAgLy8gdi1tYWluIGFsc28gYW5pbWF0ZXMgaXRzIHBhZGRpbmcsIHNvIHRoZSBwYWdlIHNsaWQgb3V0IGZyb20gdW5kZXIgdGhlXG4gIC8vIHJhaWwgZm9yIGEgZmlmdGggb2YgYSBzZWNvbmQgd2hlbiB0aGUgcmFpbCBhcHBlYXJlZCAoZmlsbWVkIG9uIEJveHdvb2QpOlxuICAvLyB0aGUgcmFpbCBpcyB0aGVyZSBmcm9tIHRoZSBzdGFydCwgc28gbm90aGluZyBhbmltYXRlcy5cbiAgLm11b24tc2hlbGwtLXJhaWwgLm11b24tbWFpbiB7XG4gICAgcGFkZGluZy1sZWZ0OiB2YXIoLS1tdW9uLXJhaWwtd2lkdGgpICFpbXBvcnRhbnQ7XG4gIH1cblxuICAubXVvbi1tYWluIHtcbiAgICB0cmFuc2l0aW9uOiBub25lICFpbXBvcnRhbnQ7XG4gIH1cblxuICAvLyBSb29tIGZvciB0aGUgdGFiIGJhciwgc28gdGhlIGxhc3QgY2FyZCBjYW4gc2Nyb2xsIGNsZWFyIG9mIGl0LlxuICAubXVvbi1zaGVsbC0tdGFiYmVkIC5tdW9uLWNvbnRlbnQge1xuICAgIHBhZGRpbmctYm90dG9tOiBjYWxjKDk2cHggKyBlbnYoc2FmZS1hcmVhLWluc2V0LWJvdHRvbSkpICFpbXBvcnRhbnQ7XG4gIH1cbjwvc3R5bGU+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2phY2svd3QtNTkyOS1nMS9zcmMvQXBwLnZ1ZSJ9