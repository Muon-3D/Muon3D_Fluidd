import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import VueRouter, {} from "/.vite-e2e/4291/deps/vue-router.js?v=9b9fafc7";
import { applyLegacyHash } from "/src/router/legacyHash.ts";
import { readSignedOut } from "/src/services/account/signed-out-note.ts";
import { activeSlugNow, foreignSlugNow } from "/src/router/printerSlugSource.ts";
import { noteAccountEntry } from "/src/services/account/came-from.ts";
import { PRINTER_PAGE_PATHS } from "/src/router/printerPagePaths.ts";
import { ROUTE_SLUG_PATTERN } from "/src/services/printer-pages/slug.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import Updating from "/src/views/Updating.vue";
import { isStaleChunkError, reloadForNewBuild } from "/src/util/stale-build.ts";
const Overview = () => import("/src/components/foreign/OverviewRoute.vue");
const Console = () => import("/src/views/Console.vue");
const GcodePreview = () => import("/src/views/GcodePreview.vue");
const Jobs = () => import("/src/components/foreign/JobsRoute.vue");
const Tune = () => import("/src/views/Tune.vue");
const Control = () => import("/src/views/Control.vue");
const Maintenance = () => import("/src/views/Maintenance.vue");
const Diagnostics = () => import("/src/views/Diagnostics.vue");
const Lighting = () => import("/src/views/Lighting.vue");
const History = () => import("/src/views/History.vue");
const Timelapse = () => import("/src/views/Timelapse.vue");
const Configure = () => import("/src/views/Configure.vue");
const Settings = () => import("/src/views/Settings.vue");
const MacroCategorySettings = () => import("/src/components/settings/macros/MacroCategorySettings.vue");
const Camera = () => import("/src/components/foreign/CameraRoute.vue");
const NotFound = () => import("/src/views/NotFound.vue");
const Login = () => import("/src/views/Login.vue");
const Icons = () => import("/src/views/Icons.vue");
const LinkLanding = () => import("/src/views/LinkLanding.vue");
const JoinLanding = () => import("/src/views/JoinLanding.vue");
const PrintHandoff = () => import("/src/views/PrintHandoff.vue");
Vue.use(VueRouter);
const isAuthenticated = () => router.app.$store.getters["auth/getAuthenticated"] || !router.app.$store.state.socket.apiConnected || isManagedApiUrl(router.app.$store.state.config.apiUrl);
const printerHome = () => {
  const slug = activeSlugNow();
  return slug ? `/${slug}` : "/";
};
const defaultRouteConfig = {
  beforeEnter: (to, from, next) => {
    const foreignRedirect = foreignPageRedirect(to);
    if (foreignRedirect) return next(foreignRedirect);
    if (to.params.printer && to.params.printer !== activeSlugNow()) {
      next();
    } else if (isAuthenticated()) {
      next();
    } else {
      next("/login");
    }
  },
  meta: {
    fileDropRoot: "gcodes"
  }
};
function foreignPageRedirect(to) {
  return foreignSlugNow(to.params.printer) && !["Overview", "Jobs", "Slice", "Camera"].includes(String(to.name)) ? `/${to.params.printer}` : null;
}
const P = `/:printer(${ROUTE_SLUG_PATTERN})`;
const printerRoutes = [
  {
    path: `${P}/print`,
    name: "Print hand-off",
    component: PrintHandoff,
    meta: { printerIndependent: true, frame: "printer" }
  },
  {
    path: P,
    name: "Overview",
    component: Overview,
    ...defaultRouteConfig
  },
  {
    path: `${P}/console`,
    name: "Console",
    component: Console,
    ...defaultRouteConfig
  },
  {
    path: `${P}/jobs`,
    name: "Jobs",
    component: Jobs,
    ...defaultRouteConfig
  },
  {
    path: `${P}/control`,
    name: "Control",
    component: Control,
    ...defaultRouteConfig
  },
  {
    path: `${P}/lighting`,
    name: "Lighting",
    component: Lighting,
    ...defaultRouteConfig
  },
  {
    path: `${P}/maintenance`,
    name: "Maintenance",
    component: Maintenance,
    ...defaultRouteConfig
  },
  {
    path: `${P}/tune`,
    name: "Tune",
    component: Tune,
    ...defaultRouteConfig
  },
  {
    path: `${P}/diagnostics`,
    name: "Diagnostics",
    component: Diagnostics,
    ...defaultRouteConfig
  },
  {
    path: `${P}/timelapse`,
    name: "Timelapse",
    component: Timelapse,
    ...defaultRouteConfig,
    meta: {
      fileDropRoot: "timelapse"
    }
  },
  {
    path: `${P}/history`,
    name: "History",
    component: History,
    ...defaultRouteConfig
  },
  // Wi-Fi and System are sections of Settings with pages of their own: they
  // open inside it, its list beside them (views/Settings.vue).
  {
    path: `${P}/wifi`,
    name: "Wifi",
    component: Settings,
    ...defaultRouteConfig
  },
  {
    path: `${P}/system`,
    name: "System",
    component: Settings,
    ...defaultRouteConfig
  },
  {
    // The printer updating. In the main chunk, not lazy: while the printer
    // restarts it can't serve a chunk (above).
    path: `${P}/updating`,
    name: "Updating",
    component: Updating,
    ...defaultRouteConfig
  },
  {
    // The Muon3D Slicer in a frame (views/Slice.vue). Lazy, so the slicer's
    // host loads only here. Its frame, with the person's plates, stays while
    // Fluidd switches printer (init.ts keeps this route then). No
    // fileDropRoot: a model dropped here is the slicer's, not an upload.
    path: `${P}/slice`,
    name: "Slice",
    component: () => import("/src/components/foreign/SliceRoute.vue"),
    beforeEnter: defaultRouteConfig.beforeEnter,
    meta: {
      printerIndependent: true,
      keepOnPrinterSwitch: true,
      // The printer's page all the same: the rail and the E-STOP stay (KAN-511).
      frame: "printer",
      // The slicer is framed with no Control layout mode (KAN-550).
      noMode: true,
      // The slicer fills the page under the bar, beside the rail.
      fullPage: true
    }
  },
  {
    // Your Library (KAN-521): the prints saved from Slice, the account's, so
    // the same whichever printer is open, drawn beside its rail. Lazy, as
    // Printers is: Print on… opens printers, and the services that do import
    // the router.
    path: `${P}/library`,
    name: "Library",
    component: () => import("/src/views/Library.vue"),
    meta: {
      printerIndependent: true,
      frame: "printer"
    }
  },
  {
    // One print: its picture, your printers, its versions.
    path: `${P}/library/:item`,
    name: "Library print",
    component: () => import("/src/views/LibraryPrint.vue"),
    meta: {
      printerIndependent: true,
      frame: "printer"
    }
  },
  {
    // Your account (KAN-532) is its own top-level page, never inside a
    // printer's view (Jack, 6 Nov): an old printer-scoped address opens it
    // there. The page keeps a way back to the printer that is open.
    path: `${P}/account/:section?`,
    name: "Account under a printer",
    redirect: (to) => ({ path: to.params.section ? `/account/${to.params.section}` : "/account", query: to.query, hash: to.hash })
  },
  {
    path: `${P}/configure`,
    name: "Configuration",
    component: Configure,
    ...defaultRouteConfig,
    meta: {}
  },
  {
    path: `${P}/settings`,
    name: "Settings",
    component: Settings,
    ...defaultRouteConfig,
    children: [
      {
        path: "macros/:categoryId",
        name: "Macros",
        component: MacroCategorySettings
      }
    ]
  },
  {
    path: `${P}/camera/:cameraId?`,
    name: "Camera",
    component: Camera,
    ...defaultRouteConfig
  },
  {
    path: `${P}/preview`,
    name: "Gcode Preview",
    component: GcodePreview,
    ...defaultRouteConfig
  }
];
const toPrinterPage = (to) => {
  const slug = activeSlugNow();
  return slug ? { path: `/${slug}${to.path}`, query: to.query, hash: to.hash } : "/";
};
const toLibraryOfActivePrinter = (to, from, next) => {
  const slug = activeSlugNow();
  if (slug && from.params.printer === slug) next({ path: `/${slug}${to.path}`, query: to.query, hash: to.hash });
  else next();
};
const LEGACY_PRINTER_PAGES = [
  ...PRINTER_PAGE_PATHS.filter((path) => !["/slice", "/camera", "/library", "/account"].includes(path)),
  "/settings/macros/:categoryId",
  "/camera",
  "/camera/:cameraId"
];
const routes = [
  {
    path: "/admin",
    name: "Admin",
    component: () => import("/src/views/Admin.vue"),
    meta: { printerIndependent: true }
  },
  {
    // Every printer: printing now, your groups, those found on this network
    // and those offline, and a welcome with none. A printer's own address
    // opens that printer instead (U2): see main.ts. Loaded on its own: it
    // lists printers through the services that open them, and those import
    // the router (activate -> init -> router), so a static import here is a
    // cycle, and the page's pictures stay out of every printer page's load.
    path: "/",
    name: "Printers",
    component: () => import("/src/views/Printers.vue"),
    // KAN-532: the console's /logout comes back here; a tab that has just
    // signed out goes on to say so.
    beforeEnter: (to, from, next) => readSignedOut() ? next({ path: "/signed-out", replace: true }) : next(),
    meta: {
      printerIndependent: true
    }
  },
  {
    // The fleet is the Printers page now.
    path: "/fleet",
    redirect: "/"
  },
  {
    path: "/welcome",
    redirect: "/"
  },
  {
    path: "/print",
    name: "Print hand-off (no printer)",
    component: PrintHandoff,
    meta: { printerIndependent: true }
  },
  // Your Library (KAN-521) with no printer open: with one, the same pages
  // under that printer, so the rail and the printer stay beside it.
  {
    path: "/library",
    name: "Library (no printer)",
    component: () => import("/src/views/Library.vue"),
    beforeEnter: toLibraryOfActivePrinter,
    meta: {
      printerIndependent: true
    }
  },
  {
    path: "/library/:item",
    name: "Library print (no printer)",
    component: () => import("/src/views/LibraryPrint.vue"),
    beforeEnter: toLibraryOfActivePrinter,
    meta: {
      printerIndependent: true
    }
  },
  // KAN-532: the pages the console's emails open (its links are
  // /#/account/<page>?token=, which legacyHash turns into these paths), and
  // signing out. No printer chrome, like /sign-in; before /account/:section?.
  {
    path: "/account/verify-email",
    name: "Email link",
    component: () => import("/src/views/AccountEmailLink.vue"),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: "/account/reset-password",
    name: "Password link",
    component: () => import("/src/views/AccountEmailLink.vue"),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: "/sign-out",
    name: "Sign out",
    component: () => import("/src/views/SignOut.vue"),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: "/signed-out",
    name: "Signed out",
    component: () => import("/src/views/SignedOut.vue"),
    meta: {
      printerIndependent: true
    }
  },
  // Your account (KAN-532): always top-level, with or without a printer open. Lazy.
  {
    path: "/account/:section?",
    name: "Account (no printer)",
    component: () => import("/src/views/Account.vue"),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: "/link",
    name: "Link a printer",
    component: LinkLanding,
    meta: {
      printerIndependent: true
    }
  },
  {
    // An invite link (AB-CON-1): the console sends /j/<code> here.
    path: "/join",
    name: "Join a printer",
    component: JoinLanding,
    meta: {
      printerIndependent: true
    }
  },
  {
    // The console's sign-in page (WEB-12): /authorize sends a browser with no
    // session here with `continue`. Lazy, and mounted without appInit.
    path: "/sign-in",
    name: "Sign in",
    component: () => import("/src/views/SignIn.vue"),
    meta: {
      printerIndependent: true
    }
  },
  {
    // First-run setup, served by the printer and opened by a phone's
    // captive-portal window. Lazy, so it paints before the rest of Fluidd
    // loads, and printer-independent, so it renders before any socket.
    path: "/setup",
    name: "setup",
    component: () => import("/src/views/Setup.vue"),
    meta: {
      printerIndependent: true
    }
  },
  {
    // The slicer works with no printer too (export only).
    path: "/slice",
    name: "Slice (no printer)",
    component: () => import("/src/views/Slice.vue"),
    beforeEnter: (to, from, next) => {
      const slug = activeSlugNow();
      if (slug) next({ path: `/${slug}/slice`, query: to.query, hash: to.hash });
      else next();
    },
    meta: {
      printerIndependent: true,
      keepOnPrinterSwitch: true,
      noMode: true,
      fullPage: true
    }
  },
  {
    // The printer's own user login (Moonraker), for the printer Fluidd is on.
    path: "/login",
    name: "Login",
    component: Login,
    beforeEnter: (to, from, next) => {
      if (isAuthenticated()) {
        next(printerHome());
      } else {
        next();
      }
    },
    meta: {
      fillHeight: true
    }
  },
  {
    path: "/icons",
    name: "Icons",
    component: Icons
  },
  {
    // /slicer is the network's, not Control's: the printer's nginx serves the
    // Muon3D Slicer there (http://muon3d.local/slicer, the one address typed
    // to slice and print on a printer). A link or push to it inside Control
    // leaves for the server, in this tab, instead of landing on the 404 page.
    // A first load of /slicer/ that got Control's index.html means this server
    // has no slicer: show the 404, never navigate again (that would loop).
    path: "/slicer/:rest*",
    name: "Slicer (the server)",
    component: NotFound,
    beforeEnter: (to, from, next) => {
      const here = from.matched.length > 0 || from.name != null;
      if (!here && to.path !== "/slicer") return next();
      next(false);
      window.location.replace((to.path === "/slicer" ? "/slicer/" : to.path) + to.fullPath.slice(to.path.length).split("#")[0]);
    }
  },
  ...LEGACY_PRINTER_PAGES.map((path) => ({ path, redirect: toPrinterPage })),
  ...printerRoutes,
  {
    path: "*",
    name: "404",
    component: NotFound
  }
];
applyLegacyHash();
const router = new VueRouter({
  mode: "history",
  base: "/",
  routes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition;
    if (to.name === "Settings" && from.name === "Settings") return { x: 0, y: 0 };
    if (to.hash) {
      return {
        selector: to.hash,
        offset: { x: 0, y: 60 },
        behavior: "smooth"
      };
    }
    return { x: 0, y: 0 };
  }
});
router.afterEach((to, from) => noteAccountEntry(to, from));
let pendingTarget;
router.beforeEach((to, from, next) => {
  pendingTarget = to.fullPath;
  const foreignRedirect = foreignPageRedirect(to);
  if (foreignRedirect) return next(foreignRedirect);
  router.app?.$store.commit("config/setContainerColumnCount", 2);
  next();
});
router.onError((error) => {
  if (isStaleChunkError(error)) reloadForNewBuild(pendingTarget);
});
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewBuild(pendingTarget)) event.preventDefault();
});
export default router;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUgZnJvbSAndnVlJ1xuaW1wb3J0IFZ1ZVJvdXRlciwgeyB0eXBlIE5hdmlnYXRpb25HdWFyZCwgdHlwZSBSb3V0ZUNvbmZpZywgdHlwZSBSb3V0ZSB9IGZyb20gJ3Z1ZS1yb3V0ZXInXG5pbXBvcnQgeyBhcHBseUxlZ2FjeUhhc2ggfSBmcm9tICcuL2xlZ2FjeUhhc2gnXG5pbXBvcnQgeyByZWFkU2lnbmVkT3V0IH0gZnJvbSAnQC9zZXJ2aWNlcy9hY2NvdW50L3NpZ25lZC1vdXQtbm90ZSdcbmltcG9ydCB7IGFjdGl2ZVNsdWdOb3csIGZvcmVpZ25TbHVnTm93IH0gZnJvbSAnLi9wcmludGVyU2x1Z1NvdXJjZSdcbmltcG9ydCB7IG5vdGVBY2NvdW50RW50cnkgfSBmcm9tICdAL3NlcnZpY2VzL2FjY291bnQvY2FtZS1mcm9tJ1xuaW1wb3J0IHsgUFJJTlRFUl9QQUdFX1BBVEhTIH0gZnJvbSAnLi9wcmludGVyUGFnZVBhdGhzJ1xuaW1wb3J0IHsgUk9VVEVfU0xVR19QQVRURVJOIH0gZnJvbSAnQC9zZXJ2aWNlcy9wcmludGVyLXBhZ2VzL3NsdWcnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IFVwZGF0aW5nIGZyb20gJ0Avdmlld3MvVXBkYXRpbmcudnVlJ1xuaW1wb3J0IHsgaXNTdGFsZUNodW5rRXJyb3IsIHJlbG9hZEZvck5ld0J1aWxkIH0gZnJvbSAnQC91dGlsL3N0YWxlLWJ1aWxkJ1xuXG4vLyBWaWV3cy4gRXZlcnkgcm91dGUgaXMgbGF6eSAoS0FOLTUyNSkgYnV0IFVwZGF0aW5nLCB3aGljaCBzdGF5cyBpbiB0aGUgbWFpblxuLy8gY2h1bms6IHdoaWxlIHRoZSBwcmludGVyIHJlc3RhcnRzIGludG8gYW4gdXBkYXRlIGl0IGNhbid0IHNlcnZlIGEgY2h1bmsuXG4vLyBUaGUgbGF6eSBvbmVzIHRoYXQgb3BlbiBwcmludGVycyBtdXN0IGJlIGxhenkgKGEgc3RhdGljIGltcG9ydCBpcyBhIGN5Y2xlOlxuLy8gdGhleSByZWFjaCBzZXJ2aWNlcy9wcmludGVyLXBhZ2VzLCB3aGljaCByZWFjaGVzIHRoaXMgcm91dGVyKTsgbm93IGFsbCBhcmUuXG5jb25zdCBPdmVydmlldyA9ICgpID0+IGltcG9ydCgnQC9jb21wb25lbnRzL2ZvcmVpZ24vT3ZlcnZpZXdSb3V0ZS52dWUnKVxuY29uc3QgQ29uc29sZSA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9Db25zb2xlLnZ1ZScpXG5jb25zdCBHY29kZVByZXZpZXcgPSAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvR2NvZGVQcmV2aWV3LnZ1ZScpXG5jb25zdCBKb2JzID0gKCkgPT4gaW1wb3J0KCdAL2NvbXBvbmVudHMvZm9yZWlnbi9Kb2JzUm91dGUudnVlJylcbmNvbnN0IFR1bmUgPSAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvVHVuZS52dWUnKVxuY29uc3QgQ29udHJvbCA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9Db250cm9sLnZ1ZScpXG5jb25zdCBNYWludGVuYW5jZSA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9NYWludGVuYW5jZS52dWUnKVxuY29uc3QgRGlhZ25vc3RpY3MgPSAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvRGlhZ25vc3RpY3MudnVlJylcbmNvbnN0IExpZ2h0aW5nID0gKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL0xpZ2h0aW5nLnZ1ZScpXG5jb25zdCBIaXN0b3J5ID0gKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL0hpc3RvcnkudnVlJylcbmNvbnN0IFRpbWVsYXBzZSA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9UaW1lbGFwc2UudnVlJylcbmNvbnN0IENvbmZpZ3VyZSA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9Db25maWd1cmUudnVlJylcbmNvbnN0IFNldHRpbmdzID0gKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL1NldHRpbmdzLnZ1ZScpXG5jb25zdCBNYWNyb0NhdGVnb3J5U2V0dGluZ3MgPSAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9tYWNyb3MvTWFjcm9DYXRlZ29yeVNldHRpbmdzLnZ1ZScpXG5jb25zdCBDYW1lcmEgPSAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9mb3JlaWduL0NhbWVyYVJvdXRlLnZ1ZScpXG5jb25zdCBOb3RGb3VuZCA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9Ob3RGb3VuZC52dWUnKVxuY29uc3QgTG9naW4gPSAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvTG9naW4udnVlJylcbmNvbnN0IEljb25zID0gKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL0ljb25zLnZ1ZScpXG5jb25zdCBMaW5rTGFuZGluZyA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9MaW5rTGFuZGluZy52dWUnKVxuY29uc3QgSm9pbkxhbmRpbmcgPSAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvSm9pbkxhbmRpbmcudnVlJylcbmNvbnN0IFByaW50SGFuZG9mZiA9ICgpID0+IGltcG9ydCgnQC92aWV3cy9QcmludEhhbmRvZmYudnVlJylcblxuVnVlLnVzZShWdWVSb3V0ZXIpXG5cbi8vIEEgY2xvdWQgcHJpbnRlciBpcyBuZXZlciBhc2tlZCBmb3IgTW9vbnJha2VyJ3MgbG9naW4gKGF1dGgvbG9nb3V0KS5cbmNvbnN0IGlzQXV0aGVudGljYXRlZCA9ICgpID0+IChcbiAgcm91dGVyLmFwcC4kc3RvcmUuZ2V0dGVyc1snYXV0aC9nZXRBdXRoZW50aWNhdGVkJ10gfHxcbiAgIXJvdXRlci5hcHAuJHN0b3JlLnN0YXRlLnNvY2tldC5hcGlDb25uZWN0ZWQgfHxcbiAgaXNNYW5hZ2VkQXBpVXJsKHJvdXRlci5hcHAuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwpXG4pXG5cbi8qKiBUaGUgY3VycmVudCBwcmludGVyJ3MgcGFnZSwgb3IgUHJpbnRlcnMgd2l0aCBubyBwcmludGVyLiAqL1xuY29uc3QgcHJpbnRlckhvbWUgPSAoKSA9PiB7XG4gIGNvbnN0IHNsdWcgPSBhY3RpdmVTbHVnTm93KClcbiAgcmV0dXJuIHNsdWcgPyBgLyR7c2x1Z31gIDogJy8nXG59XG5cbmNvbnN0IGRlZmF1bHRSb3V0ZUNvbmZpZzogUGFydGlhbDxSb3V0ZUNvbmZpZz4gPSB7XG4gIGJlZm9yZUVudGVyOiAodG8sIGZyb20sIG5leHQpID0+IHtcbiAgICBjb25zdCBmb3JlaWduUmVkaXJlY3QgPSBmb3JlaWduUGFnZVJlZGlyZWN0KHRvKVxuICAgIGlmIChmb3JlaWduUmVkaXJlY3QpIHJldHVybiBuZXh0KGZvcmVpZ25SZWRpcmVjdClcbiAgICAvLyBBIHBhZ2UgZm9yIGFub3RoZXIgcHJpbnRlciBvcGVucyB0aGF0IHByaW50ZXIgKHNlcnZpY2VzL3ByaW50ZXItcGFnZXMpOlxuICAgIC8vIHdoZXRoZXIgaXQgd2FudHMgYSBwYXNzd29yZCBpcyB0aGF0IHByaW50ZXIncyB0byBzYXksIG5vdCB0aGlzIG9uZSdzLlxuICAgIGlmICh0by5wYXJhbXMucHJpbnRlciAmJiB0by5wYXJhbXMucHJpbnRlciAhPT0gYWN0aXZlU2x1Z05vdygpKSB7XG4gICAgICBuZXh0KClcbiAgICB9IGVsc2UgaWYgKGlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICBuZXh0KClcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dCgnL2xvZ2luJylcbiAgICB9XG4gIH0sXG4gIG1ldGE6IHtcbiAgICBmaWxlRHJvcFJvb3Q6ICdnY29kZXMnXG4gIH1cbn1cblxuZnVuY3Rpb24gZm9yZWlnblBhZ2VSZWRpcmVjdCAodG86IFJvdXRlKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiBmb3JlaWduU2x1Z05vdyh0by5wYXJhbXMucHJpbnRlcikgJiYgIVsnT3ZlcnZpZXcnLCAnSm9icycsICdTbGljZScsICdDYW1lcmEnXS5pbmNsdWRlcyhTdHJpbmcodG8ubmFtZSkpXG4gICAgPyBgLyR7dG8ucGFyYW1zLnByaW50ZXJ9YFxuICAgIDogbnVsbFxufVxuXG4vKiogT25lIHByaW50ZXIncyBwYWdlczogL2JveHdvb2QtMzY3YSwgL2JveHdvb2QtMzY3YS9qb2JzIChVMSkuICovXG5jb25zdCBQID0gYC86cHJpbnRlcigke1JPVVRFX1NMVUdfUEFUVEVSTn0pYFxuXG5jb25zdCBwcmludGVyUm91dGVzOiBBcnJheTxSb3V0ZUNvbmZpZz4gPSBbXG4gIHtcbiAgICBwYXRoOiBgJHtQfS9wcmludGAsXG4gICAgbmFtZTogJ1ByaW50IGhhbmQtb2ZmJyxcbiAgICBjb21wb25lbnQ6IFByaW50SGFuZG9mZixcbiAgICBtZXRhOiB7IHByaW50ZXJJbmRlcGVuZGVudDogdHJ1ZSwgZnJhbWU6ICdwcmludGVyJyB9XG4gIH0sXG4gIHtcbiAgICBwYXRoOiBQLFxuICAgIG5hbWU6ICdPdmVydmlldycsXG4gICAgY29tcG9uZW50OiBPdmVydmlldyxcbiAgICAuLi5kZWZhdWx0Um91dGVDb25maWdcbiAgfSxcbiAge1xuICAgIHBhdGg6IGAke1B9L2NvbnNvbGVgLFxuICAgIG5hbWU6ICdDb25zb2xlJyxcbiAgICBjb21wb25lbnQ6IENvbnNvbGUsXG4gICAgLi4uZGVmYXVsdFJvdXRlQ29uZmlnXG4gIH0sXG4gIHtcbiAgICBwYXRoOiBgJHtQfS9qb2JzYCxcbiAgICBuYW1lOiAnSm9icycsXG4gICAgY29tcG9uZW50OiBKb2JzLFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZ1xuICB9LFxuICB7XG4gICAgcGF0aDogYCR7UH0vY29udHJvbGAsXG4gICAgbmFtZTogJ0NvbnRyb2wnLFxuICAgIGNvbXBvbmVudDogQ29udHJvbCxcbiAgICAuLi5kZWZhdWx0Um91dGVDb25maWdcbiAgfSxcbiAge1xuICAgIHBhdGg6IGAke1B9L2xpZ2h0aW5nYCxcbiAgICBuYW1lOiAnTGlnaHRpbmcnLFxuICAgIGNvbXBvbmVudDogTGlnaHRpbmcsXG4gICAgLi4uZGVmYXVsdFJvdXRlQ29uZmlnXG4gIH0sXG4gIHtcbiAgICBwYXRoOiBgJHtQfS9tYWludGVuYW5jZWAsXG4gICAgbmFtZTogJ01haW50ZW5hbmNlJyxcbiAgICBjb21wb25lbnQ6IE1haW50ZW5hbmNlLFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZ1xuICB9LFxuICB7XG4gICAgcGF0aDogYCR7UH0vdHVuZWAsXG4gICAgbmFtZTogJ1R1bmUnLFxuICAgIGNvbXBvbmVudDogVHVuZSxcbiAgICAuLi5kZWZhdWx0Um91dGVDb25maWdcbiAgfSxcbiAge1xuICAgIHBhdGg6IGAke1B9L2RpYWdub3N0aWNzYCxcbiAgICBuYW1lOiAnRGlhZ25vc3RpY3MnLFxuICAgIGNvbXBvbmVudDogRGlhZ25vc3RpY3MsXG4gICAgLi4uZGVmYXVsdFJvdXRlQ29uZmlnXG4gIH0sXG4gIHtcbiAgICBwYXRoOiBgJHtQfS90aW1lbGFwc2VgLFxuICAgIG5hbWU6ICdUaW1lbGFwc2UnLFxuICAgIGNvbXBvbmVudDogVGltZWxhcHNlLFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZyxcbiAgICBtZXRhOiB7XG4gICAgICBmaWxlRHJvcFJvb3Q6ICd0aW1lbGFwc2UnXG4gICAgfVxuICB9LFxuICB7XG4gICAgcGF0aDogYCR7UH0vaGlzdG9yeWAsXG4gICAgbmFtZTogJ0hpc3RvcnknLFxuICAgIGNvbXBvbmVudDogSGlzdG9yeSxcbiAgICAuLi5kZWZhdWx0Um91dGVDb25maWdcbiAgfSxcbiAgLy8gV2ktRmkgYW5kIFN5c3RlbSBhcmUgc2VjdGlvbnMgb2YgU2V0dGluZ3Mgd2l0aCBwYWdlcyBvZiB0aGVpciBvd246IHRoZXlcbiAgLy8gb3BlbiBpbnNpZGUgaXQsIGl0cyBsaXN0IGJlc2lkZSB0aGVtICh2aWV3cy9TZXR0aW5ncy52dWUpLlxuICB7XG4gICAgcGF0aDogYCR7UH0vd2lmaWAsXG4gICAgbmFtZTogJ1dpZmknLFxuICAgIGNvbXBvbmVudDogU2V0dGluZ3MsXG4gICAgLi4uZGVmYXVsdFJvdXRlQ29uZmlnXG4gIH0sXG4gIHtcbiAgICBwYXRoOiBgJHtQfS9zeXN0ZW1gLFxuICAgIG5hbWU6ICdTeXN0ZW0nLFxuICAgIGNvbXBvbmVudDogU2V0dGluZ3MsXG4gICAgLi4uZGVmYXVsdFJvdXRlQ29uZmlnXG4gIH0sXG4gIHtcbiAgICAvLyBUaGUgcHJpbnRlciB1cGRhdGluZy4gSW4gdGhlIG1haW4gY2h1bmssIG5vdCBsYXp5OiB3aGlsZSB0aGUgcHJpbnRlclxuICAgIC8vIHJlc3RhcnRzIGl0IGNhbid0IHNlcnZlIGEgY2h1bmsgKGFib3ZlKS5cbiAgICBwYXRoOiBgJHtQfS91cGRhdGluZ2AsXG4gICAgbmFtZTogJ1VwZGF0aW5nJyxcbiAgICBjb21wb25lbnQ6IFVwZGF0aW5nLFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZ1xuICB9LFxuICB7XG4gICAgLy8gVGhlIE11b24zRCBTbGljZXIgaW4gYSBmcmFtZSAodmlld3MvU2xpY2UudnVlKS4gTGF6eSwgc28gdGhlIHNsaWNlcidzXG4gICAgLy8gaG9zdCBsb2FkcyBvbmx5IGhlcmUuIEl0cyBmcmFtZSwgd2l0aCB0aGUgcGVyc29uJ3MgcGxhdGVzLCBzdGF5cyB3aGlsZVxuICAgIC8vIEZsdWlkZCBzd2l0Y2hlcyBwcmludGVyIChpbml0LnRzIGtlZXBzIHRoaXMgcm91dGUgdGhlbikuIE5vXG4gICAgLy8gZmlsZURyb3BSb290OiBhIG1vZGVsIGRyb3BwZWQgaGVyZSBpcyB0aGUgc2xpY2VyJ3MsIG5vdCBhbiB1cGxvYWQuXG4gICAgcGF0aDogYCR7UH0vc2xpY2VgLFxuICAgIG5hbWU6ICdTbGljZScsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0AvY29tcG9uZW50cy9mb3JlaWduL1NsaWNlUm91dGUudnVlJyksXG4gICAgYmVmb3JlRW50ZXI6IGRlZmF1bHRSb3V0ZUNvbmZpZy5iZWZvcmVFbnRlcixcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWUsXG4gICAgICBrZWVwT25QcmludGVyU3dpdGNoOiB0cnVlLFxuICAgICAgLy8gVGhlIHByaW50ZXIncyBwYWdlIGFsbCB0aGUgc2FtZTogdGhlIHJhaWwgYW5kIHRoZSBFLVNUT1Agc3RheSAoS0FOLTUxMSkuXG4gICAgICBmcmFtZTogJ3ByaW50ZXInLFxuICAgICAgLy8gVGhlIHNsaWNlciBpcyBmcmFtZWQgd2l0aCBubyBDb250cm9sIGxheW91dCBtb2RlIChLQU4tNTUwKS5cbiAgICAgIG5vTW9kZTogdHJ1ZSxcbiAgICAgIC8vIFRoZSBzbGljZXIgZmlsbHMgdGhlIHBhZ2UgdW5kZXIgdGhlIGJhciwgYmVzaWRlIHRoZSByYWlsLlxuICAgICAgZnVsbFBhZ2U6IHRydWVcbiAgICB9XG4gIH0sXG4gIHtcbiAgICAvLyBZb3VyIExpYnJhcnkgKEtBTi01MjEpOiB0aGUgcHJpbnRzIHNhdmVkIGZyb20gU2xpY2UsIHRoZSBhY2NvdW50J3MsIHNvXG4gICAgLy8gdGhlIHNhbWUgd2hpY2hldmVyIHByaW50ZXIgaXMgb3BlbiwgZHJhd24gYmVzaWRlIGl0cyByYWlsLiBMYXp5LCBhc1xuICAgIC8vIFByaW50ZXJzIGlzOiBQcmludCBvbuKApiBvcGVucyBwcmludGVycywgYW5kIHRoZSBzZXJ2aWNlcyB0aGF0IGRvIGltcG9ydFxuICAgIC8vIHRoZSByb3V0ZXIuXG4gICAgcGF0aDogYCR7UH0vbGlicmFyeWAsXG4gICAgbmFtZTogJ0xpYnJhcnknLFxuICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL0xpYnJhcnkudnVlJyksXG4gICAgbWV0YToge1xuICAgICAgcHJpbnRlckluZGVwZW5kZW50OiB0cnVlLFxuICAgICAgZnJhbWU6ICdwcmludGVyJ1xuICAgIH1cbiAgfSxcbiAge1xuICAgIC8vIE9uZSBwcmludDogaXRzIHBpY3R1cmUsIHlvdXIgcHJpbnRlcnMsIGl0cyB2ZXJzaW9ucy5cbiAgICBwYXRoOiBgJHtQfS9saWJyYXJ5LzppdGVtYCxcbiAgICBuYW1lOiAnTGlicmFyeSBwcmludCcsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvTGlicmFyeVByaW50LnZ1ZScpLFxuICAgIG1ldGE6IHtcbiAgICAgIHByaW50ZXJJbmRlcGVuZGVudDogdHJ1ZSxcbiAgICAgIGZyYW1lOiAncHJpbnRlcidcbiAgICB9XG4gIH0sXG4gIHtcbiAgICAvLyBZb3VyIGFjY291bnQgKEtBTi01MzIpIGlzIGl0cyBvd24gdG9wLWxldmVsIHBhZ2UsIG5ldmVyIGluc2lkZSBhXG4gICAgLy8gcHJpbnRlcidzIHZpZXcgKEphY2ssIDYgTm92KTogYW4gb2xkIHByaW50ZXItc2NvcGVkIGFkZHJlc3Mgb3BlbnMgaXRcbiAgICAvLyB0aGVyZS4gVGhlIHBhZ2Uga2VlcHMgYSB3YXkgYmFjayB0byB0aGUgcHJpbnRlciB0aGF0IGlzIG9wZW4uXG4gICAgcGF0aDogYCR7UH0vYWNjb3VudC86c2VjdGlvbj9gLFxuICAgIG5hbWU6ICdBY2NvdW50IHVuZGVyIGEgcHJpbnRlcicsXG4gICAgcmVkaXJlY3Q6IHRvID0+ICh7IHBhdGg6IHRvLnBhcmFtcy5zZWN0aW9uID8gYC9hY2NvdW50LyR7dG8ucGFyYW1zLnNlY3Rpb259YCA6ICcvYWNjb3VudCcsIHF1ZXJ5OiB0by5xdWVyeSwgaGFzaDogdG8uaGFzaCB9KVxuICB9LFxuICB7XG4gICAgcGF0aDogYCR7UH0vY29uZmlndXJlYCxcbiAgICBuYW1lOiAnQ29uZmlndXJhdGlvbicsXG4gICAgY29tcG9uZW50OiBDb25maWd1cmUsXG4gICAgLi4uZGVmYXVsdFJvdXRlQ29uZmlnLFxuICAgIG1ldGE6IHt9XG4gIH0sXG4gIHtcbiAgICBwYXRoOiBgJHtQfS9zZXR0aW5nc2AsXG4gICAgbmFtZTogJ1NldHRpbmdzJyxcbiAgICBjb21wb25lbnQ6IFNldHRpbmdzLFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZyxcbiAgICBjaGlsZHJlbjogW1xuICAgICAge1xuICAgICAgICBwYXRoOiAnbWFjcm9zLzpjYXRlZ29yeUlkJyxcbiAgICAgICAgbmFtZTogJ01hY3JvcycsXG4gICAgICAgIGNvbXBvbmVudDogTWFjcm9DYXRlZ29yeVNldHRpbmdzXG4gICAgICB9XG4gICAgXVxuICB9LFxuICB7XG4gICAgcGF0aDogYCR7UH0vY2FtZXJhLzpjYW1lcmFJZD9gLFxuICAgIG5hbWU6ICdDYW1lcmEnLFxuICAgIGNvbXBvbmVudDogQ2FtZXJhLFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZ1xuICB9LFxuICB7XG4gICAgcGF0aDogYCR7UH0vcHJldmlld2AsXG4gICAgbmFtZTogJ0djb2RlIFByZXZpZXcnLFxuICAgIGNvbXBvbmVudDogR2NvZGVQcmV2aWV3LFxuICAgIC4uLmRlZmF1bHRSb3V0ZUNvbmZpZ1xuICB9XG5dXG5cbi8qKlxuICogQW4gYWRkcmVzcyBmcm9tIGJlZm9yZSBhIHBhZ2UgcGVyIHByaW50ZXIgKC9qb2JzLCAvc2V0dGluZ3MjYXV0aCwgYSBQV0FcbiAqIHNob3J0Y3V0KTogdGhlIHNhbWUgcGFnZSBvZiB0aGUgcHJpbnRlciBGbHVpZGQgaXMgb24sIG9yIFByaW50ZXJzIHdoZW4gaXRcbiAqIGlzIG9uIG5vbmUuXG4gKi9cbmNvbnN0IHRvUHJpbnRlclBhZ2UgPSAodG86IFJvdXRlKSA9PiB7XG4gIGNvbnN0IHNsdWcgPSBhY3RpdmVTbHVnTm93KClcbiAgcmV0dXJuIHNsdWcgPyB7IHBhdGg6IGAvJHtzbHVnfSR7dG8ucGF0aH1gLCBxdWVyeTogdG8ucXVlcnksIGhhc2g6IHRvLmhhc2ggfSA6ICcvJ1xufVxuXG4vKipcbiAqIFRoZSBMaWJyYXJ5IHVuZGVyIHRoZSBwcmludGVyIEZsdWlkZCBpcyBvbiwgd2hlbiBpdCBpcyBvcGVuZWQgZnJvbSBvbmUgb2ZcbiAqIHRoYXQgcHJpbnRlcidzIG93biBwYWdlczogL2xpYnJhcnkgaXMgL2JveHdvb2QtMzY3YS9saWJyYXJ5LCBzbyBpdHMgcmFpbCBhbmRcbiAqIHByaW50ZXIgc3RheSBiZXNpZGUgaXQuIEZyb20gYW55d2hlcmUgZWxzZSAoQWxsIHByaW50ZXJzLCB0aGUgYWNjb3VudCwgYVxuICogZGlyZWN0IGFkZHJlc3MpIGl0IG9wZW5zIGF0IGl0cyBvd24gcm91dGUgd2l0aCBubyBwcmludGVyOiB0aGUgTGlicmFyeSBpc1xuICogdGhlIGFjY291bnQncyBhbmQgbmVlZHMgbm9uZSAoS0FOLTM1OTkpLlxuICovXG5jb25zdCB0b0xpYnJhcnlPZkFjdGl2ZVByaW50ZXI6IE5hdmlnYXRpb25HdWFyZCA9ICh0bywgZnJvbSwgbmV4dCkgPT4ge1xuICBjb25zdCBzbHVnID0gYWN0aXZlU2x1Z05vdygpXG4gIGlmIChzbHVnICYmIGZyb20ucGFyYW1zLnByaW50ZXIgPT09IHNsdWcpIG5leHQoeyBwYXRoOiBgLyR7c2x1Z30ke3RvLnBhdGh9YCwgcXVlcnk6IHRvLnF1ZXJ5LCBoYXNoOiB0by5oYXNoIH0pXG4gIGVsc2UgbmV4dCgpXG59XG5cbi8vIC9zbGljZSBhbmQgdGhlIExpYnJhcnkgaGF2ZSBwYWdlcyBvZiB0aGVpciBvd24gd2l0aCBubyBwcmludGVyICh0aGUgc2xpY2VyXG4vLyBleHBvcnRzIHdpdGhvdXQgb25lOyB0aGUgTGlicmFyeSBpcyB0aGUgYWNjb3VudCdzKS5cbmNvbnN0IExFR0FDWV9QUklOVEVSX1BBR0VTID0gW1xuICAuLi5QUklOVEVSX1BBR0VfUEFUSFMuZmlsdGVyKHBhdGggPT4gIVsnL3NsaWNlJywgJy9jYW1lcmEnLCAnL2xpYnJhcnknLCAnL2FjY291bnQnXS5pbmNsdWRlcyhwYXRoKSksXG4gICcvc2V0dGluZ3MvbWFjcm9zLzpjYXRlZ29yeUlkJyxcbiAgJy9jYW1lcmEnLFxuICAnL2NhbWVyYS86Y2FtZXJhSWQnXG5dXG5cbmNvbnN0IHJvdXRlczogQXJyYXk8Um91dGVDb25maWc+ID0gW1xuICB7XG4gICAgcGF0aDogJy9hZG1pbicsXG4gICAgbmFtZTogJ0FkbWluJyxcbiAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9BZG1pbi52dWUnKSxcbiAgICBtZXRhOiB7IHByaW50ZXJJbmRlcGVuZGVudDogdHJ1ZSB9XG4gIH0sXG4gIHtcbiAgICAvLyBFdmVyeSBwcmludGVyOiBwcmludGluZyBub3csIHlvdXIgZ3JvdXBzLCB0aG9zZSBmb3VuZCBvbiB0aGlzIG5ldHdvcmtcbiAgICAvLyBhbmQgdGhvc2Ugb2ZmbGluZSwgYW5kIGEgd2VsY29tZSB3aXRoIG5vbmUuIEEgcHJpbnRlcidzIG93biBhZGRyZXNzXG4gICAgLy8gb3BlbnMgdGhhdCBwcmludGVyIGluc3RlYWQgKFUyKTogc2VlIG1haW4udHMuIExvYWRlZCBvbiBpdHMgb3duOiBpdFxuICAgIC8vIGxpc3RzIHByaW50ZXJzIHRocm91Z2ggdGhlIHNlcnZpY2VzIHRoYXQgb3BlbiB0aGVtLCBhbmQgdGhvc2UgaW1wb3J0XG4gICAgLy8gdGhlIHJvdXRlciAoYWN0aXZhdGUgLT4gaW5pdCAtPiByb3V0ZXIpLCBzbyBhIHN0YXRpYyBpbXBvcnQgaGVyZSBpcyBhXG4gICAgLy8gY3ljbGUsIGFuZCB0aGUgcGFnZSdzIHBpY3R1cmVzIHN0YXkgb3V0IG9mIGV2ZXJ5IHByaW50ZXIgcGFnZSdzIGxvYWQuXG4gICAgcGF0aDogJy8nLFxuICAgIG5hbWU6ICdQcmludGVycycsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvUHJpbnRlcnMudnVlJyksXG4gICAgLy8gS0FOLTUzMjogdGhlIGNvbnNvbGUncyAvbG9nb3V0IGNvbWVzIGJhY2sgaGVyZTsgYSB0YWIgdGhhdCBoYXMganVzdFxuICAgIC8vIHNpZ25lZCBvdXQgZ29lcyBvbiB0byBzYXkgc28uXG4gICAgYmVmb3JlRW50ZXI6ICh0bywgZnJvbSwgbmV4dCkgPT4gKHJlYWRTaWduZWRPdXQoKSA/IG5leHQoeyBwYXRoOiAnL3NpZ25lZC1vdXQnLCByZXBsYWNlOiB0cnVlIH0pIDogbmV4dCgpKSxcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWVcbiAgICB9XG4gIH0sXG4gIHtcbiAgICAvLyBUaGUgZmxlZXQgaXMgdGhlIFByaW50ZXJzIHBhZ2Ugbm93LlxuICAgIHBhdGg6ICcvZmxlZXQnLFxuICAgIHJlZGlyZWN0OiAnLydcbiAgfSxcbiAge1xuICAgIHBhdGg6ICcvd2VsY29tZScsXG4gICAgcmVkaXJlY3Q6ICcvJ1xuICB9LFxuICB7XG4gICAgcGF0aDogJy9wcmludCcsXG4gICAgbmFtZTogJ1ByaW50IGhhbmQtb2ZmIChubyBwcmludGVyKScsXG4gICAgY29tcG9uZW50OiBQcmludEhhbmRvZmYsXG4gICAgbWV0YTogeyBwcmludGVySW5kZXBlbmRlbnQ6IHRydWUgfVxuICB9LFxuICAvLyBZb3VyIExpYnJhcnkgKEtBTi01MjEpIHdpdGggbm8gcHJpbnRlciBvcGVuOiB3aXRoIG9uZSwgdGhlIHNhbWUgcGFnZXNcbiAgLy8gdW5kZXIgdGhhdCBwcmludGVyLCBzbyB0aGUgcmFpbCBhbmQgdGhlIHByaW50ZXIgc3RheSBiZXNpZGUgaXQuXG4gIHtcbiAgICBwYXRoOiAnL2xpYnJhcnknLFxuICAgIG5hbWU6ICdMaWJyYXJ5IChubyBwcmludGVyKScsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvTGlicmFyeS52dWUnKSxcbiAgICBiZWZvcmVFbnRlcjogdG9MaWJyYXJ5T2ZBY3RpdmVQcmludGVyLFxuICAgIG1ldGE6IHtcbiAgICAgIHByaW50ZXJJbmRlcGVuZGVudDogdHJ1ZVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHBhdGg6ICcvbGlicmFyeS86aXRlbScsXG4gICAgbmFtZTogJ0xpYnJhcnkgcHJpbnQgKG5vIHByaW50ZXIpJyxcbiAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9MaWJyYXJ5UHJpbnQudnVlJyksXG4gICAgYmVmb3JlRW50ZXI6IHRvTGlicmFyeU9mQWN0aXZlUHJpbnRlcixcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWVcbiAgICB9XG4gIH0sXG4gIC8vIEtBTi01MzI6IHRoZSBwYWdlcyB0aGUgY29uc29sZSdzIGVtYWlscyBvcGVuIChpdHMgbGlua3MgYXJlXG4gIC8vIC8jL2FjY291bnQvPHBhZ2U+P3Rva2VuPSwgd2hpY2ggbGVnYWN5SGFzaCB0dXJucyBpbnRvIHRoZXNlIHBhdGhzKSwgYW5kXG4gIC8vIHNpZ25pbmcgb3V0LiBObyBwcmludGVyIGNocm9tZSwgbGlrZSAvc2lnbi1pbjsgYmVmb3JlIC9hY2NvdW50LzpzZWN0aW9uPy5cbiAge1xuICAgIHBhdGg6ICcvYWNjb3VudC92ZXJpZnktZW1haWwnLFxuICAgIG5hbWU6ICdFbWFpbCBsaW5rJyxcbiAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9BY2NvdW50RW1haWxMaW5rLnZ1ZScpLFxuICAgIG1ldGE6IHtcbiAgICAgIHByaW50ZXJJbmRlcGVuZGVudDogdHJ1ZVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHBhdGg6ICcvYWNjb3VudC9yZXNldC1wYXNzd29yZCcsXG4gICAgbmFtZTogJ1Bhc3N3b3JkIGxpbmsnLFxuICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL0FjY291bnRFbWFpbExpbmsudnVlJyksXG4gICAgbWV0YToge1xuICAgICAgcHJpbnRlckluZGVwZW5kZW50OiB0cnVlXG4gICAgfVxuICB9LFxuICB7XG4gICAgcGF0aDogJy9zaWduLW91dCcsXG4gICAgbmFtZTogJ1NpZ24gb3V0JyxcbiAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9TaWduT3V0LnZ1ZScpLFxuICAgIG1ldGE6IHtcbiAgICAgIHByaW50ZXJJbmRlcGVuZGVudDogdHJ1ZVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHBhdGg6ICcvc2lnbmVkLW91dCcsXG4gICAgbmFtZTogJ1NpZ25lZCBvdXQnLFxuICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL1NpZ25lZE91dC52dWUnKSxcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWVcbiAgICB9XG4gIH0sXG4gIC8vIFlvdXIgYWNjb3VudCAoS0FOLTUzMik6IGFsd2F5cyB0b3AtbGV2ZWwsIHdpdGggb3Igd2l0aG91dCBhIHByaW50ZXIgb3Blbi4gTGF6eS5cbiAge1xuICAgIHBhdGg6ICcvYWNjb3VudC86c2VjdGlvbj8nLFxuICAgIG5hbWU6ICdBY2NvdW50IChubyBwcmludGVyKScsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvQWNjb3VudC52dWUnKSxcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWVcbiAgICB9XG4gIH0sXG4gIHtcbiAgICBwYXRoOiAnL2xpbmsnLFxuICAgIG5hbWU6ICdMaW5rIGEgcHJpbnRlcicsXG4gICAgY29tcG9uZW50OiBMaW5rTGFuZGluZyxcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWVcbiAgICB9XG4gIH0sXG4gIHtcbiAgICAvLyBBbiBpbnZpdGUgbGluayAoQUItQ09OLTEpOiB0aGUgY29uc29sZSBzZW5kcyAvai88Y29kZT4gaGVyZS5cbiAgICBwYXRoOiAnL2pvaW4nLFxuICAgIG5hbWU6ICdKb2luIGEgcHJpbnRlcicsXG4gICAgY29tcG9uZW50OiBKb2luTGFuZGluZyxcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWVcbiAgICB9XG4gIH0sXG4gIHtcbiAgICAvLyBUaGUgY29uc29sZSdzIHNpZ24taW4gcGFnZSAoV0VCLTEyKTogL2F1dGhvcml6ZSBzZW5kcyBhIGJyb3dzZXIgd2l0aCBub1xuICAgIC8vIHNlc3Npb24gaGVyZSB3aXRoIGBjb250aW51ZWAuIExhenksIGFuZCBtb3VudGVkIHdpdGhvdXQgYXBwSW5pdC5cbiAgICBwYXRoOiAnL3NpZ24taW4nLFxuICAgIG5hbWU6ICdTaWduIGluJyxcbiAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9TaWduSW4udnVlJyksXG4gICAgbWV0YToge1xuICAgICAgcHJpbnRlckluZGVwZW5kZW50OiB0cnVlXG4gICAgfVxuICB9LFxuICB7XG4gICAgLy8gRmlyc3QtcnVuIHNldHVwLCBzZXJ2ZWQgYnkgdGhlIHByaW50ZXIgYW5kIG9wZW5lZCBieSBhIHBob25lJ3NcbiAgICAvLyBjYXB0aXZlLXBvcnRhbCB3aW5kb3cuIExhenksIHNvIGl0IHBhaW50cyBiZWZvcmUgdGhlIHJlc3Qgb2YgRmx1aWRkXG4gICAgLy8gbG9hZHMsIGFuZCBwcmludGVyLWluZGVwZW5kZW50LCBzbyBpdCByZW5kZXJzIGJlZm9yZSBhbnkgc29ja2V0LlxuICAgIHBhdGg6ICcvc2V0dXAnLFxuICAgIG5hbWU6ICdzZXR1cCcsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvU2V0dXAudnVlJyksXG4gICAgbWV0YToge1xuICAgICAgcHJpbnRlckluZGVwZW5kZW50OiB0cnVlXG4gICAgfVxuICB9LFxuICB7XG4gICAgLy8gVGhlIHNsaWNlciB3b3JrcyB3aXRoIG5vIHByaW50ZXIgdG9vIChleHBvcnQgb25seSkuXG4gICAgcGF0aDogJy9zbGljZScsXG4gICAgbmFtZTogJ1NsaWNlIChubyBwcmludGVyKScsXG4gICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvU2xpY2UudnVlJyksXG4gICAgYmVmb3JlRW50ZXI6ICh0bywgZnJvbSwgbmV4dCkgPT4ge1xuICAgICAgY29uc3Qgc2x1ZyA9IGFjdGl2ZVNsdWdOb3coKVxuICAgICAgaWYgKHNsdWcpIG5leHQoeyBwYXRoOiBgLyR7c2x1Z30vc2xpY2VgLCBxdWVyeTogdG8ucXVlcnksIGhhc2g6IHRvLmhhc2ggfSlcbiAgICAgIGVsc2UgbmV4dCgpXG4gICAgfSxcbiAgICBtZXRhOiB7XG4gICAgICBwcmludGVySW5kZXBlbmRlbnQ6IHRydWUsXG4gICAgICBrZWVwT25QcmludGVyU3dpdGNoOiB0cnVlLFxuICAgICAgbm9Nb2RlOiB0cnVlLFxuICAgICAgZnVsbFBhZ2U6IHRydWVcbiAgICB9XG4gIH0sXG4gIHtcbiAgICAvLyBUaGUgcHJpbnRlcidzIG93biB1c2VyIGxvZ2luIChNb29ucmFrZXIpLCBmb3IgdGhlIHByaW50ZXIgRmx1aWRkIGlzIG9uLlxuICAgIHBhdGg6ICcvbG9naW4nLFxuICAgIG5hbWU6ICdMb2dpbicsXG4gICAgY29tcG9uZW50OiBMb2dpbixcbiAgICBiZWZvcmVFbnRlcjogKHRvLCBmcm9tLCBuZXh0KSA9PiB7XG4gICAgICBpZiAoaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgbmV4dChwcmludGVySG9tZSgpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dCgpXG4gICAgICB9XG4gICAgfSxcbiAgICBtZXRhOiB7XG4gICAgICBmaWxsSGVpZ2h0OiB0cnVlXG4gICAgfVxuICB9LFxuICB7XG4gICAgcGF0aDogJy9pY29ucycsXG4gICAgbmFtZTogJ0ljb25zJyxcbiAgICBjb21wb25lbnQ6IEljb25zXG4gIH0sXG4gIHtcbiAgICAvLyAvc2xpY2VyIGlzIHRoZSBuZXR3b3JrJ3MsIG5vdCBDb250cm9sJ3M6IHRoZSBwcmludGVyJ3Mgbmdpbnggc2VydmVzIHRoZVxuICAgIC8vIE11b24zRCBTbGljZXIgdGhlcmUgKGh0dHA6Ly9tdW9uM2QubG9jYWwvc2xpY2VyLCB0aGUgb25lIGFkZHJlc3MgdHlwZWRcbiAgICAvLyB0byBzbGljZSBhbmQgcHJpbnQgb24gYSBwcmludGVyKS4gQSBsaW5rIG9yIHB1c2ggdG8gaXQgaW5zaWRlIENvbnRyb2xcbiAgICAvLyBsZWF2ZXMgZm9yIHRoZSBzZXJ2ZXIsIGluIHRoaXMgdGFiLCBpbnN0ZWFkIG9mIGxhbmRpbmcgb24gdGhlIDQwNCBwYWdlLlxuICAgIC8vIEEgZmlyc3QgbG9hZCBvZiAvc2xpY2VyLyB0aGF0IGdvdCBDb250cm9sJ3MgaW5kZXguaHRtbCBtZWFucyB0aGlzIHNlcnZlclxuICAgIC8vIGhhcyBubyBzbGljZXI6IHNob3cgdGhlIDQwNCwgbmV2ZXIgbmF2aWdhdGUgYWdhaW4gKHRoYXQgd291bGQgbG9vcCkuXG4gICAgcGF0aDogJy9zbGljZXIvOnJlc3QqJyxcbiAgICBuYW1lOiAnU2xpY2VyICh0aGUgc2VydmVyKScsXG4gICAgY29tcG9uZW50OiBOb3RGb3VuZCxcbiAgICBiZWZvcmVFbnRlcjogKHRvLCBmcm9tLCBuZXh0KSA9PiB7XG4gICAgICBjb25zdCBoZXJlID0gZnJvbS5tYXRjaGVkLmxlbmd0aCA+IDAgfHwgZnJvbS5uYW1lICE9IG51bGxcbiAgICAgIGlmICghaGVyZSAmJiB0by5wYXRoICE9PSAnL3NsaWNlcicpIHJldHVybiBuZXh0KClcbiAgICAgIG5leHQoZmFsc2UpXG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSgodG8ucGF0aCA9PT0gJy9zbGljZXInID8gJy9zbGljZXIvJyA6IHRvLnBhdGgpICsgdG8uZnVsbFBhdGguc2xpY2UodG8ucGF0aC5sZW5ndGgpLnNwbGl0KCcjJylbMF0pXG4gICAgfVxuICB9LFxuICAuLi5MRUdBQ1lfUFJJTlRFUl9QQUdFUy5tYXAocGF0aCA9PiAoeyBwYXRoLCByZWRpcmVjdDogdG9QcmludGVyUGFnZSB9KSksXG4gIC4uLnByaW50ZXJSb3V0ZXMsXG4gIHtcbiAgICBwYXRoOiAnKicsXG4gICAgbmFtZTogJzQwNCcsXG4gICAgY29tcG9uZW50OiBOb3RGb3VuZFxuICB9XG5dXG5cbi8vIEJlZm9yZSB0aGUgcm91dGVyIHJlYWRzIHRoZSBhZGRyZXNzOiBhbiBvbGQgaGFzaCBhZGRyZXNzICgvIy9qb2JzLCB0aGVcbi8vIHByaW50ZXIncyAvc2V0dXAgcmVkaXJlY3QgdG8gLyMvc2V0dXApIGJlY29tZXMgdGhlIHBhdGggaXQgbm93IGlzLlxuYXBwbHlMZWdhY3lIYXNoKClcblxuLy8gUGF0aCBhZGRyZXNzZXMgKC9qb2JzLCAvbGluaz9jb2RlPSksIHNlcnZlZCBmcm9tIHRoZSByb290IG9mIHRoZSBob3N0LiBUaGVcbi8vIHByaW50ZXIncyBuZ2lueCBhbmQgdGhlIGNvbnNvbGUgYW5zd2VyIGEgbmF2aWdhdGlvbiB0aGV5IGhhdmUgbm8gZmlsZSBmb3Jcbi8vIHdpdGggaW5kZXguaHRtbCwgYW5kIHRoZSBzZXJ2aWNlIHdvcmtlciBkb2VzIHRvbyBvbmNlIGluc3RhbGxlZC5cbmNvbnN0IHJvdXRlciA9IG5ldyBWdWVSb3V0ZXIoe1xuICBtb2RlOiAnaGlzdG9yeScsXG4gIGJhc2U6ICcvJyxcbiAgcm91dGVzLFxuICBzY3JvbGxCZWhhdmlvcjogKHRvLCBmcm9tLCBzYXZlZFBvc2l0aW9uKSA9PiB7XG4gICAgaWYgKHNhdmVkUG9zaXRpb24pIHJldHVybiBzYXZlZFBvc2l0aW9uXG4gICAgLy8gU2V0dGluZ3MnIHNlY3Rpb25zIGFyZSBpdHMgYW5jaG9yczogb25lIG9wZW5zIGF0IHRoZSB0b3AsIGluIHBsYWNlIG9mIHRoZSBsYXN0LlxuICAgIGlmICh0by5uYW1lID09PSAnU2V0dGluZ3MnICYmIGZyb20ubmFtZSA9PT0gJ1NldHRpbmdzJykgcmV0dXJuIHsgeDogMCwgeTogMCB9XG4gICAgaWYgKHRvLmhhc2gpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiB0by5oYXNoLFxuICAgICAgICBvZmZzZXQ6IHsgeDogMCwgeTogNjAgfSxcbiAgICAgICAgYmVoYXZpb3I6ICdzbW9vdGgnXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHg6IDAsIHk6IDAgfVxuICB9XG59KVxuXG4vLyBBY2NvdW50IHJlbWVtYmVycyB0aGUgcHJpbnRlciBwYWdlIGl0IHdhcyBvcGVuZWQgZnJvbSwgZm9yIGl0cyB3YXkgYmFjay5cbnJvdXRlci5hZnRlckVhY2goKHRvLCBmcm9tKSA9PiBub3RlQWNjb3VudEVudHJ5KHRvLCBmcm9tKSlcblxuLy8gV2hlcmUgdGhlIG5hdmlnYXRpb24gaW4gZmxpZ2h0IGlzIGdvaW5nLCBmb3IgYSBzdGFsZSBidWlsZCdzIHJlbG9hZCB0byBsYW5kIG9uLlxubGV0IHBlbmRpbmdUYXJnZXQ6IHN0cmluZyB8IHVuZGVmaW5lZFxuXG5yb3V0ZXIuYmVmb3JlRWFjaCgodG8sIGZyb20sIG5leHQpID0+IHtcbiAgcGVuZGluZ1RhcmdldCA9IHRvLmZ1bGxQYXRoXG4gIGNvbnN0IGZvcmVpZ25SZWRpcmVjdCA9IGZvcmVpZ25QYWdlUmVkaXJlY3QodG8pXG4gIGlmIChmb3JlaWduUmVkaXJlY3QpIHJldHVybiBuZXh0KGZvcmVpZ25SZWRpcmVjdClcbiAgcm91dGVyLmFwcD8uJHN0b3JlLmNvbW1pdCgnY29uZmlnL3NldENvbnRhaW5lckNvbHVtbkNvdW50JywgMilcbiAgbmV4dCgpXG59KVxuXG4vLyBLQU4tNTYyOiBldmVyeSByb3V0ZSBpcyBsYXp5LCBzbyBhIHRhYiBzdGlsbCBydW5uaW5nIHRoZSBidWlsZCBiZWZvcmUgYVxuLy8gZGVwbG95IGZhaWxzIHRvIGxvYWQgdGhlIG5leHQgcGFnZSBpdCBvcGVucywgYW5kIGNhbGxlcnMgdGhhdCBzd2FsbG93IHRoZVxuLy8gcmVqZWN0ZWQgcHVzaCBtYWtlIHRoYXQgXCJub3RoaW5nIGhhcHBlbnNcIi4gTG9hZCB0aGUgcGFnZSBhZnJlc2ggaW5zdGVhZC5cbnJvdXRlci5vbkVycm9yKChlcnJvcikgPT4ge1xuICBpZiAoaXNTdGFsZUNodW5rRXJyb3IoZXJyb3IpKSByZWxvYWRGb3JOZXdCdWlsZChwZW5kaW5nVGFyZ2V0KVxufSlcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd2aXRlOnByZWxvYWRFcnJvcicsIChldmVudCkgPT4ge1xuICBpZiAocmVsb2FkRm9yTmV3QnVpbGQocGVuZGluZ1RhcmdldCkpIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbn0pXG5cbmRlY2xhcmUgbW9kdWxlICd2dWUtcm91dGVyJyB7XG4gIGludGVyZmFjZSBSb3V0ZU1ldGEge1xuICAgIGZpbGxIZWlnaHQ/OiBib29sZWFuXG4gICAgZmlsZURyb3BSb290Pzogc3RyaW5nXG4gICAgcHJpbnRlckluZGVwZW5kZW50PzogYm9vbGVhblxuICAgIC8qKiBBIHByaW50ZXIgc3dpdGNoIChhcHBJbml0KSBsZWF2ZXMgdGhpcyByb3V0ZSB3aGVyZSBpdCBpcyBpbnN0ZWFkIG9mIGdvaW5nIHRvIHRoZSBkYXNoYm9hcmQuICovXG4gICAga2VlcE9uUHJpbnRlclN3aXRjaD86IGJvb2xlYW5cbiAgICAvKiogJ3ByaW50ZXInOiBkcmF3biBhcyB0aGUgcHJpbnRlcidzIHBhZ2UgKHRoZSByYWlsLCB0aGUgRS1TVE9QKSB0aG91Z2ggaXQgd29ya3Mgd2l0aG91dCBvbmUuICovXG4gICAgZnJhbWU/OiAncHJpbnRlcidcbiAgICAvKipcbiAgICAgKiBBbm90aGVyIGFwcCBmcmFtZWQgaGVyZSAoU2xpY2UsIGxhdGVyIERlc2lnbiksIHdoaWNoIHJlY2VpdmVzIG5vIENvbnRyb2wgbGF5b3V0IG1vZGUuXG4gICAgICogRW1iZWRkZWQgU2xpY2UgZGVsaWJlcmF0ZWx5IGhhcyBubyBDb250cm9sIGxheW91dCBtb2RlIChLQU4tNTUwKS5cbiAgICAgKi9cbiAgICBub01vZGU/OiBib29sZWFuXG4gICAgLyoqXG4gICAgICogQW5vdGhlciBhcHAgZnJhbWVkIGhlcmUgZmlsbHMgdGhlIHBhZ2U6IHRoZSB3aG9sZSB3aWR0aCBhbmQgaGVpZ2h0IHVuZGVyIHRoZSBiYXIsIGJlc2lkZSB0aGUgcmFpbCwgd2l0aCBub1xuICAgICAqIHBhZ2UgcGFkZGluZyBvciB3aWR0aCBsaW1pdCAoQXBwLnZ1ZSkuIFNsaWNlOiBvbmUgc2xpY2VyLCB0aGUgc2FtZSBhcyBzbGljZXIubXVvbjNkLmNvbSdzLCBkcmF3biBhcyB0aGUgcGFnZS5cbiAgICAgKi9cbiAgICBmdWxsUGFnZT86IGJvb2xlYW5cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXJcbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sbUJBQXVFO0FBQzlFLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsZUFBZSxzQkFBc0I7QUFDOUMsU0FBUyx3QkFBd0I7QUFDakMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyx1QkFBdUI7QUFDaEMsT0FBTyxjQUFjO0FBQ3JCLFNBQVMsbUJBQW1CLHlCQUF5QjtBQU1yRCxNQUFNLFdBQVcsTUFBTSxPQUFPLHdDQUF3QztBQUN0RSxNQUFNLFVBQVUsTUFBTSxPQUFPLHFCQUFxQjtBQUNsRCxNQUFNLGVBQWUsTUFBTSxPQUFPLDBCQUEwQjtBQUM1RCxNQUFNLE9BQU8sTUFBTSxPQUFPLG9DQUFvQztBQUM5RCxNQUFNLE9BQU8sTUFBTSxPQUFPLGtCQUFrQjtBQUM1QyxNQUFNLFVBQVUsTUFBTSxPQUFPLHFCQUFxQjtBQUNsRCxNQUFNLGNBQWMsTUFBTSxPQUFPLHlCQUF5QjtBQUMxRCxNQUFNLGNBQWMsTUFBTSxPQUFPLHlCQUF5QjtBQUMxRCxNQUFNLFdBQVcsTUFBTSxPQUFPLHNCQUFzQjtBQUNwRCxNQUFNLFVBQVUsTUFBTSxPQUFPLHFCQUFxQjtBQUNsRCxNQUFNLFlBQVksTUFBTSxPQUFPLHVCQUF1QjtBQUN0RCxNQUFNLFlBQVksTUFBTSxPQUFPLHVCQUF1QjtBQUN0RCxNQUFNLFdBQVcsTUFBTSxPQUFPLHNCQUFzQjtBQUNwRCxNQUFNLHdCQUF3QixNQUFNLE9BQU8sd0RBQXdEO0FBQ25HLE1BQU0sU0FBUyxNQUFNLE9BQU8sc0NBQXNDO0FBQ2xFLE1BQU0sV0FBVyxNQUFNLE9BQU8sc0JBQXNCO0FBQ3BELE1BQU0sUUFBUSxNQUFNLE9BQU8sbUJBQW1CO0FBQzlDLE1BQU0sUUFBUSxNQUFNLE9BQU8sbUJBQW1CO0FBQzlDLE1BQU0sY0FBYyxNQUFNLE9BQU8seUJBQXlCO0FBQzFELE1BQU0sY0FBYyxNQUFNLE9BQU8seUJBQXlCO0FBQzFELE1BQU0sZUFBZSxNQUFNLE9BQU8sMEJBQTBCO0FBRTVELElBQUksSUFBSSxTQUFTO0FBR2pCLE1BQU0sa0JBQWtCLE1BQ3RCLE9BQU8sSUFBSSxPQUFPLFFBQVEsdUJBQXVCLEtBQ2pELENBQUMsT0FBTyxJQUFJLE9BQU8sTUFBTSxPQUFPLGdCQUNoQyxnQkFBZ0IsT0FBTyxJQUFJLE9BQU8sTUFBTSxPQUFPLE1BQU07QUFJdkQsTUFBTSxjQUFjLE1BQU07QUFDeEIsUUFBTSxPQUFPLGNBQWM7QUFDM0IsU0FBTyxPQUFPLElBQUksSUFBSSxLQUFLO0FBQzdCO0FBRUEsTUFBTSxxQkFBMkM7QUFBQSxFQUMvQyxhQUFhLENBQUMsSUFBSSxNQUFNLFNBQVM7QUFDL0IsVUFBTSxrQkFBa0Isb0JBQW9CLEVBQUU7QUFDOUMsUUFBSSxnQkFBaUIsUUFBTyxLQUFLLGVBQWU7QUFHaEQsUUFBSSxHQUFHLE9BQU8sV0FBVyxHQUFHLE9BQU8sWUFBWSxjQUFjLEdBQUc7QUFDOUQsV0FBSztBQUFBLElBQ1AsV0FBVyxnQkFBZ0IsR0FBRztBQUM1QixXQUFLO0FBQUEsSUFDUCxPQUFPO0FBQ0wsV0FBSyxRQUFRO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLGNBQWM7QUFBQSxFQUNoQjtBQUNGO0FBRUEsU0FBUyxvQkFBcUIsSUFBMEI7QUFDdEQsU0FBTyxlQUFlLEdBQUcsT0FBTyxPQUFPLEtBQUssQ0FBQyxDQUFDLFlBQVksUUFBUSxTQUFTLFFBQVEsRUFBRSxTQUFTLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFDekcsSUFBSSxHQUFHLE9BQU8sT0FBTyxLQUNyQjtBQUNOO0FBR0EsTUFBTSxJQUFJLGFBQWEsa0JBQWtCO0FBRXpDLE1BQU0sZ0JBQW9DO0FBQUEsRUFDeEM7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxNQUFNLEVBQUUsb0JBQW9CLE1BQU0sT0FBTyxVQUFVO0FBQUEsRUFDckQ7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsSUFDSCxNQUFNO0FBQUEsTUFDSixjQUFjO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTSxHQUFHLENBQUM7QUFBQSxJQUNWLE1BQU07QUFBQSxJQUNOLFdBQVc7QUFBQSxJQUNYLEdBQUc7QUFBQSxFQUNMO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxHQUFHO0FBQUEsRUFDTDtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUEsSUFHRSxNQUFNLEdBQUcsQ0FBQztBQUFBLElBQ1YsTUFBTTtBQUFBLElBQ04sV0FBVztBQUFBLElBQ1gsR0FBRztBQUFBLEVBQ0w7QUFBQSxFQUNBO0FBQUE7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