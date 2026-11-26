/* unplugin-vue-components disabled */import __unplugin_components_16 from "/src/components/ui/M3Dialog.vue";
import __unplugin_components_15 from "/src/components/ui/M3Dialog.vue";
import __unplugin_components_14 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_13 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_12 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_11 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_10 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_9 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_8 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_7 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_6 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_1 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_0 from "/src/components/ui/FrameIcon.vue";
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
import MuonGatesMixin from "/src/mixins/muon-gates.ts";
import M3Dialog from "/src/components/ui/M3Dialog.vue";
import ToggleSwitch from "/src/components/control/ToggleSwitch.vue";
import ApiKeyDialog from "/src/components/settings/auth/ApiKeyDialog.vue";
import AccessRequestDialog from "/src/components/muon-access/AccessRequestDialog.vue";
import { connectedEndpointId, sameEndpoint } from "/src/services/people-access/identity.ts";
import {
  currentPrinterAccess
} from "/src/services/muon-access/api.ts";
import { cloudApi } from "/src/services/muon-cloud/api.ts";
import { cloudState, refreshPrinters } from "/src/services/muon-cloud/state.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { remoteRouteLabel } from "/src/services/muon-ble/link.ts";
import { networkRouteLabel } from "/src/services/hotspot/model.ts";
import { accountApi } from "/src/services/account/api.ts";
import { accountState, describe, loadApprovals } from "/src/services/account/state.ts";
import { isMissing } from "/src/services/account/client.ts";
import { dayText } from "/src/services/account/model.ts";
import { ownAvatar, publicAvatarUrl } from "/src/services/account/avatar.ts";
import PhotoFace from "/src/components/account/profile/PhotoFace.vue";
import { activeSlug } from "/src/services/printer-pages/index.ts";
import { currentPrinterNewDevices } from "/src/services/muon-access/newDevices.ts";
import { printerNameParts } from "/src/util/printer-name.ts";
import {
  ROLE_TABLE,
  ROLE_WORDS,
  accessViewer,
  accountAccessPath,
  printerGroups,
  roleSummary
} from "/src/services/people-access/model.ts";
import "/src/scss/muon3d-account.scss";
const PRESET_WORDS = { relaxed: "Relaxed", standard: "Standard", strict: "Strict" };
let PeopleAccessSettings = class extends Mixins(MuonGatesMixin) {
  client = currentPrinterAccess();
  state = null;
  capabilities = {};
  printerError = "";
  loading = false;
  busy = false;
  message = "";
  dialog = "";
  dialogError = "";
  form = { email: "", role: "viewer", until: "" };
  inviteMode = "email";
  linkForm = { lifetime: "1d", maxUses: null, role: "viewer", approveEach: false };
  madeLink = null;
  LINK_LASTS = [
    { value: "1h", label: "1 hour" },
    { value: "1d", label: "1 day" },
    { value: "7d", label: "7 days" },
    { value: "none", label: "Until I end it" }
  ];
  LINK_USES = [
    { value: 1, label: "1 person" },
    { value: 5, label: "5 people" },
    { value: 25, label: "25 people" },
    { value: null, label: "No limit" }
  ];
  changing = null;
  shares = [];
  invites = [];
  links = [];
  apiKeyOpen = false;
  renderKey = 0;
  /** The EndpointId the connected printer reports about itself, read with the rest. */
  reportedEndpoint = null;
  /** What the printer holds for "Allow new devices to ask" (I-170); null hides the switch. */
  acceptRequests = null;
  newDevices = currentPrinterNewDevices();
  asking = null;
  /** The ask dialog is mounted only while open, so closing it withdraws the request. */
  askingOpen = false;
  mounted() {
    this.refresh();
  }
  /**
   * Which printer the answers belong to. Everything read is that printer's:
   * a switch to another printer, or a reconnect, drops it and reads again, and
   * an answer that arrives for the previous printer is ignored.
   */
  get printerKey() {
    return `${this.$store.state.config.apiUrl ?? ""}|${this.cloudPrinterId ?? ""}`;
  }
  onPrinterChange() {
    this.forget();
    this.refresh();
  }
  onReconnect(connected) {
    if (connected) this.refresh();
    else this.forget();
  }
  /** Nothing known: no owner, role, rules or lists, so nothing owner-only shows. */
  forget() {
    this.state = null;
    this.capabilities = {};
    this.reportedEndpoint = null;
    this.shares = [];
    this.invites = [];
    this.links = [];
    this.dialog = "";
    this.changing = null;
    this.apiKeyOpen = false;
    this.askingOpen = false;
    this.asking = null;
  }
  /** The account's name for the printer acted on: what every console action and its confirm names. */
  get accountPrinterName() {
    return this.cloudPrinter?.name ?? this.printerName;
  }
  get printerName() {
    return printerNameParts(this.$store.getters["config/getDisplayName"]).name || "This printer";
  }
  /** The account's printer Fluidd is on: through Muon3D, or a saved one that said its EndpointId. */
  get cloudPrinterId() {
    const apiUrl = this.$store.state.config.apiUrl;
    if (!apiUrl) return null;
    if (isManagedApiUrl(apiUrl)) return cloudState.activePrinterId;
    const instances = this.$store.state.config.instances ?? [];
    return instances.find((i) => i.apiUrl === apiUrl)?.endpointId ?? null;
  }
  /**
   * The account's record of the printer connected, only once that printer has
   * said it is that one. Through Muon3D the connection is to that id; on the
   * network a saved address can belong to another printer now (DHCP), so the
   * printer's own EndpointId must match, or the console's groups stay hidden
   * and nothing is sent to the wrong printer's people. Names aren't compared:
   * renaming in Account doesn't rename the printer's own screen.
   */
  get cloudPrinter() {
    if (!cloudState.account) return null;
    const id = this.cloudPrinterId;
    const record = id ? cloudState.printers.find((p) => p.id === id) ?? null : null;
    if (!record) return null;
    if (isManagedApiUrl(this.$store.state.config.apiUrl)) return record;
    return sameEndpoint(record.id, this.reportedEndpoint) ? record : null;
  }
  /** Owner, operator or viewer: the printer's owner and your level there, else the console. Never from "may manage access". */
  get viewer() {
    const printer = this.state ? { owner: this.state.owner, level: this.state.you.level, role: this.state.you.role } : null;
    const cloud = this.cloudPrinter ? { shared: !!this.cloudPrinter.shared, role: this.cloudPrinter.role } : null;
    return accessViewer(printer, cloud, cloudState.account?.email ?? null);
  }
  /**
   * The printer lets this browser change its rules now: the shared gate
   * (`canManageAccess`, #296) and this page's own read for this printer must
   * both say yes. Refused, failed, unknown or not yet asked is no.
   */
  get canManage() {
    return this.canManageAccess === true && this.capabilities.protection === "allowed";
  }
  /** The console's owner calls apply: a printer this account linked. */
  get cloudOwned() {
    return !!this.cloudPrinter && !this.cloudPrinter.shared;
  }
  get approvals() {
    const id = this.cloudPrinter?.id;
    return (accountState.approvals ?? []).filter((a) => a.printer_id === id && a.state === "pending");
  }
  get waitingCount() {
    return this.approvals.length + this.invites.length;
  }
  get groups() {
    if (!this.viewer) return [];
    return printerGroups(this.viewer, {
      cloud: this.viewer === "owner" ? this.cloudOwned : !!this.cloudPrinter,
      canManage: this.canManage,
      waiting: this.waitingCount,
      links: this.links.length,
      olderTools: this.$store.getters["server/componentSupport"]("authorization"),
      canAsk: !!this.state && this.capabilities.protection === "ask"
    });
  }
  shows(group) {
    return this.groups.includes(group);
  }
  roleWord(role) {
    return ROLE_WORDS[role] ?? role;
  }
  letterOf(text) {
    return (text || "?").charAt(0).toUpperCase();
  }
  day(seconds) {
    return dayText(seconds);
  }
  get ownerName() {
    if (this.viewer === "owner" && cloudState.account) return cloudState.account.name || cloudState.account.email;
    const owner = this.state?.owner;
    if (owner?.name) return owner.name;
    if (owner?.email) return owner.email;
    const sharer = this.cloudPrinter?.sharer?.display_name || this.cloudPrinter?.shared_by;
    if (sharer) return sharer;
    if (owner?.kind === "none") return "No owner yet";
    return "Not known yet";
  }
  get ownerFirstName() {
    const name = this.ownerName;
    return name === "Not known yet" || name === "No owner yet" ? "the owner" : name.split(/[\s@]/)[0];
  }
  get ownerEmail() {
    if (this.viewer === "owner" && cloudState.account) return cloudState.account.email;
    return this.state?.owner.email ?? "";
  }
  /** Your own photo when you are the owner here (one fetch, shared with the top bar); others' photos aren't known. */
  get ownerPhoto() {
    return this.viewer === "owner" ? ownAvatar.url : null;
  }
  publicPhoto(url) {
    return publicAvatarUrl(url);
  }
  get ownerLetter() {
    return this.letterOf(this.ownerName);
  }
  get youLine() {
    const ends = this.cloudPrinter?.ends_at;
    return `You're ${this.viewer === "operator" ? "an Operator" : "a Viewer"}${ends ? ` until ${dayText(ends)}` : ""}`;
  }
  get remote() {
    return !!cloudState.activePrinterId && isManagedApiUrl(this.$store.state.config.apiUrl);
  }
  /** How this browser reached the printer, as the rest of Control words it. */
  get routeText() {
    return this.remote ? remoteRouteLabel(cloudState.activePrinterId) : networkRouteLabel();
  }
  get canDoLine() {
    return roleSummary(this.viewer ?? "viewer");
  }
  get roleTable() {
    return ROLE_TABLE;
  }
  get presetWord() {
    const preset = this.state?.levelsPreset ?? "";
    return PRESET_WORDS[preset] ?? preset;
  }
  get lockLine() {
    return this.viewer === "viewer" ? "Viewers don't see the list of people. The owner's settings are hidden." : "Invites, requests, links, devices, rules and the key are the owner's and are hidden.";
  }
  get peopleRows() {
    return this.shares.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name || "",
      photo: publicAvatarUrl(s.avatar_url),
      letter: this.letterOf(s.name || s.email),
      role: s.role,
      endsAt: s.ends_at ?? null,
      line: [s.name ? s.email : "", s.ends_at ? `Access ends ${dayText(s.ends_at)}` : s.accepted === false ? "Not signed in yet" : `Since ${dayText(s.created_at)}`].filter(Boolean).join(" \xB7 ")
    }));
  }
  get shareId() {
    return this.cloudPrinter?.share_id ?? null;
  }
  get developerLine() {
    const state = this.devModeEnabled ? "On. " : "";
    return `${state}The first time it's turned on, the printer's screen confirms it.`;
  }
  get developerTo() {
    const slug = activeSlug();
    return `${slug ? `/${slug}` : ""}/settings#developer`;
  }
  accountTo(section) {
    return accountAccessPath(section);
  }
  linkLine(link) {
    const parts = [this.roleWord(link.role)];
    if (link.max_uses === 1) parts.push("single use");
    else if (link.max_uses) parts.push(`${link.uses ?? 0} of ${link.max_uses} uses`);
    parts.push(link.expires_at ? `ends ${dayText(link.expires_at)}` : "no end date");
    if (link.approve_each) parts.push("you let each person in");
    return parts.join(" \xB7 ");
  }
  async refresh() {
    const key = this.printerKey;
    this.loading = true;
    let state = null;
    let capabilities = {};
    let printerError = "";
    const managed = isManagedApiUrl(this.$store.state.config.apiUrl);
    const endpoint = managed ? Promise.resolve(null) : connectedEndpointId();
    try {
      [state, capabilities] = await Promise.all([this.client.get(), this.client.capabilities()]);
    } catch (error) {
      state = null;
      capabilities = {};
      printerError = error.message;
    }
    if (cloudState.account) await refreshPrinters().catch(() => {
    });
    const reported = await endpoint;
    if (key !== this.printerKey) return;
    this.reportedEndpoint = reported;
    this.state = state;
    this.capabilities = capabilities;
    this.printerError = printerError;
    this.loading = false;
    this.renderKey++;
    await this.loadAcceptRequests(key);
    await this.refreshCloud();
  }
  /** Asked only of a browser that may change the rules; an older printer or a refusal leaves the switch out. */
  async loadAcceptRequests(key = this.printerKey) {
    let held = null;
    if (this.canManage) held = await this.newDevices.get().catch(() => null);
    if (key === this.printerKey) this.acceptRequests = held;
  }
  /** Nothing changes on screen until the printer says so; a refusal shows its words. */
  async saveAcceptRequests(value) {
    await this.run(async () => {
      this.acceptRequests = await this.newDevices.set(value);
    });
    this.renderKey++;
  }
  /** The console's people, invites, links and requests for this printer: its owner's only. */
  async refreshCloud() {
    const key = this.printerKey;
    const p = this.cloudPrinter;
    if (!p || p.shared || this.viewer !== "owner") return;
    loadApprovals().catch(() => {
    });
    const [shares, invites, links] = await Promise.all([
      accountApi.shares(p.id).then((r) => r.shares).catch(() => []),
      accountApi.invites(p.id).then((r) => r.invites).catch(() => []),
      accountApi.links(p.id).then((r) => r.links).catch(() => [])
    ]);
    if (key !== this.printerKey) return;
    this.shares = shares;
    this.invites = invites;
    this.links = links;
  }
  async run(what, done, inDialog = false) {
    this.busy = true;
    this.message = "";
    this.dialogError = "";
    try {
      await what();
      if (done) this.message = done;
      return true;
    } catch (error) {
      const text = isMissing(error) ? "Not available yet." : describe(error);
      if (inDialog) this.dialogError = text;
      else this.message = text;
      return false;
    } finally {
      this.busy = false;
    }
  }
  /** A printer setting: says plainly when the printer did not take it, then shows what it holds. */
  async apply(change) {
    await this.run(async () => {
      if (!await change()) throw new Error("Not changed: only the owner can change this.");
    });
    await this.refresh();
  }
  changeEntry(entry) {
    if (!this.state || this.state.entry === entry || entry !== "open" && entry !== "protected") return;
    const chosen = entry;
    return this.apply(() => this.client.setEntry(chosen));
  }
  changeData(event) {
    const mode = event.target.value;
    if (mode !== "shared" && mode !== "accounts" && mode !== "both") return;
    const chosen = mode;
    return this.apply(() => this.client.setData(chosen));
  }
  roleHas(row, role) {
    return role === "owner" || role === "operator" || role === "viewer" ? row[role] : false;
  }
  openInvite() {
    this.form = { email: "", role: "viewer", until: "" };
    this.inviteMode = "email";
    this.linkForm = { lifetime: "1d", maxUses: null, role: "viewer", approveEach: false };
    this.madeLink = null;
    this.dialogError = "";
    this.dialog = "invite";
  }
  /** A date input's day as the console's end of that day, or null for never. */
  untilToEnds(until) {
    return until ? Math.floor((/* @__PURE__ */ new Date(`${until}T23:59:59`)).getTime() / 1e3) : null;
  }
  /** A date input's value for an end time, in the viewer's own day. */
  dayInput(endsAt) {
    return endsAt ? new Date(endsAt * 1e3).toLocaleDateString("en-CA") : "";
  }
  /** The end date in the role dialog: the person's own exact end unless the day was changed. */
  roleEnds(row) {
    return this.form.until === this.dayInput(row.endsAt) ? row.endsAt : this.untilToEnds(this.form.until);
  }
  /** "Share a link", as the phone app does: the console makes it, and it is listed with a Copy. */
  async makeLink() {
    const p = this.cloudPrinter;
    if (!p) return;
    const f = this.linkForm;
    let made = null;
    const ok = await this.run(async () => {
      made = (await accountApi.createLink(p.id, { lifetime: f.lifetime, max_uses: f.maxUses, role: f.role, approve_each: f.approveEach })).link;
    }, void 0, true);
    if (ok && made) {
      this.madeLink = made;
      this.refreshCloud();
    }
  }
  async invite() {
    const p = this.cloudPrinter;
    if (!p) return;
    const email = this.form.email.trim();
    const endsAt = this.untilToEnds(this.form.until);
    if (await this.run(() => accountApi.share(p.id, email, this.form.role, endsAt), `${email} can use ${p.name}. We've emailed them.`, true)) {
      this.dialog = "";
      this.refreshCloud();
    }
  }
  openRole(row) {
    this.changing = row;
    this.form.role = row.role;
    this.form.until = this.dayInput(row.endsAt);
    this.dialogError = "";
    this.dialog = "role";
  }
  async changeRole() {
    const p = this.cloudPrinter;
    const row = this.changing;
    if (!p || !row) return;
    const role = this.form.role;
    const endsAt = this.roleEnds(row);
    if (await this.run(() => accountApi.share(p.id, row.email, role, endsAt), `${row.email} is ${role === "viewer" ? "a Viewer" : "an Operator"} now${endsAt ? `, until ${dayText(endsAt)}` : ""}.`, true)) {
      this.dialog = "";
      this.changing = null;
      this.refreshCloud();
    }
  }
  async removePerson(row) {
    const p = this.cloudPrinter;
    if (!p) return;
    const key = this.printerKey;
    const sure = await this.$confirm(`${row.email} loses access to ${p.name} now, from every device. Their account and other printers aren't touched.`, {
      title: `Remove ${row.email} from ${p.name}?`,
      buttonTrueText: "Remove",
      danger: true
    });
    if (!sure || !this.stillOn(key, p.id)) return;
    await this.run(() => accountApi.removeShare(p.id, row.id), `${row.email} can't use ${p.name} any more.`);
    this.refreshCloud();
  }
  async answer(request, allow) {
    const who = request.requester?.email ?? "Someone";
    await this.run(() => accountApi.answerApproval(request.id, allow), allow ? `${who} can use ${this.printerName} now.` : "Refused.");
    await loadApprovals().catch(() => {
    });
    this.refreshCloud();
  }
  async resend(invite) {
    const p = this.cloudPrinter;
    if (!p) return;
    await this.run(() => accountApi.sendInvite(p.id, invite.email, invite.role, invite.ends_at), `Invitation sent to ${invite.email}.`);
    this.refreshCloud();
  }
  async cancelInvite(invite) {
    const p = this.cloudPrinter;
    if (!p) return;
    const key = this.printerKey;
    const sure = await this.$confirm(`${invite.email} won't be able to join ${p.name} with it.`, {
      title: `Cancel this invite to ${p.name}?`,
      buttonTrueText: "Cancel invite",
      danger: true
    });
    if (!sure || !this.stillOn(key, p.id)) return;
    await this.run(() => accountApi.withdrawInvite(p.id, invite.id), "Invite cancelled.");
    this.refreshCloud();
  }
  async endLink(link) {
    const key = this.printerKey;
    const sure = await this.$confirm("Nobody can join with it any more. People who already joined keep their access.", {
      title: "End this invite link?",
      buttonTrueText: "End link",
      danger: true
    });
    if (!sure || key !== this.printerKey) return;
    await this.run(() => accountApi.revokeLink(link.printer_id, link.id), "That invite link no longer works. People who joined with it keep their access.");
    this.refreshCloud();
  }
  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.message = "Link copied.";
    } catch {
      this.message = "Copying didn't work in this browser.";
    }
  }
  async unlink() {
    const p = this.cloudPrinter;
    if (!p) return;
    const key = this.printerKey;
    const sure = await this.$confirm(`${p.name} leaves your account: you can't reach it from outside your home, and everyone you share it with loses access. It keeps working on your network, and you can link it again at its screen.`, {
      title: `Unlink ${p.name}?`,
      buttonTrueText: "Unlink",
      danger: true
    });
    if (!sure || !this.stillOn(key, p.id)) return;
    if (await this.run(() => cloudApi.unlinkPrinter(p.id), `${p.name} is unlinked.`)) await refreshPrinters().catch(() => {
    });
  }
  async leave() {
    const p = this.cloudPrinter;
    const shareId = this.shareId;
    if (!p || !shareId) return;
    const key = this.printerKey;
    const sure = await this.$confirm(`You'll lose access to ${p.name} from all your devices. ${this.ownerFirstName === "the owner" ? "The owner" : this.ownerFirstName} would need to invite you again. The owner can't leave; they unlink instead.`, {
      title: `Leave ${p.name}?`,
      buttonTrueText: "Leave",
      danger: true
    });
    if (!sure || !this.stillOn(key, p.id)) return;
    if (await this.run(() => accountApi.removeShare(p.id, shareId), `You've left ${p.name}.`)) await refreshPrinters().catch(() => {
    });
  }
  /** After a confirm: still the same printer, still that account printer. A switch while it was open cancels the action. */
  stillOn(key, printerId) {
    return key === this.printerKey && this.cloudPrinter?.id === printerId;
  }
  /** The printer lets this browser ask its own screen to change who can get in (protection: ask). */
  askAtPrinter() {
    if (!this.state) return;
    this.asking = { kind: "entry", entry: this.state.entry === "open" ? "protected" : "open" };
    this.askingOpen = true;
  }
  /** Signed out on a printer an account owns: the owner's groups need the owner signed in. */
  get signInHint() {
    return !cloudState.account && this.state?.owner.kind === "account";
  }
};
__decorateClass([
  Watch("printerKey")
], PeopleAccessSettings.prototype, "onPrinterChange", 1);
__decorateClass([
  Watch("socketConnected")
], PeopleAccessSettings.prototype, "onReconnect", 1);
PeopleAccessSettings = __decorateClass([
  Component({ components: { M3Dialog, ToggleSwitch, ApiKeyDialog, AccessRequestDialog, PhotoFace } })
], PeopleAccessSettings);
const _sfc_main = PeopleAccessSettings;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "pa", attrs: { "id": "access", "data-tid": "people-access" } }, [_c("header", { staticClass: "pa__head" }, [_c("div", [_c("h2", [_vm._v("People and access")]), _c("p", [_vm._v("Who can use " + _vm._s(_vm.printerName) + " and what they can do.")]), _c("router-link", { staticClass: "pa-lnk", attrs: { "to": _vm.accountTo("printers"), "data-tid": "pa-account-link" } }, [_vm._v(" Your own devices and apps are in Account"), _c(__unplugin_components_0, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 1), _vm.viewer === "owner" && _vm.cloudOwned ? _c("button", { staticClass: "lib-btn lib-btn--pri", attrs: { "type": "button", "data-tid": "pa-invite" }, on: { "click": _vm.openInvite } }, [_c(__unplugin_components_1, { attrs: { "name": "userPlus", "small": "" } }), _vm._v("Invite someone ")], 1) : _vm._e()]), _vm.loading && !_vm.viewer ? _c("p", { staticClass: "pa__muted", attrs: { "data-tid": "pa-loading" } }, [_vm._v(" Reading who can use " + _vm._s(_vm.printerName) + "\u2026 ")]) : !_vm.viewer ? _c("p", { staticClass: "pa__note", attrs: { "data-tid": "pa-unknown" } }, [_vm._v(" " + _vm._s(_vm.printerName) + " didn't say who you are here. " + _vm._s(_vm.printerError) + " ")]) : [_c("div", { staticClass: "pa-list pa-own", attrs: { "data-tid": "pa-you" } }, [_c("div", { staticClass: "pa-row" }, [_c("span", { staticClass: "pa-av pa-av--lg", attrs: { "data-tid": "pa-owner-face" } }, [_c("photo-face", { attrs: { "photo": _vm.ownerPhoto, "letter": _vm.ownerLetter } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("span", { staticClass: "pa-eyebrow" }, [_vm._v("Owner")]), _c("b", { attrs: { "data-tid": "pa-owner" } }, [_vm._v(_vm._s(_vm.ownerName))]), _vm.viewer !== "owner" && _vm.youLine ? _c("span", { attrs: { "data-tid": "pa-you-line" } }, [_vm._v(_vm._s(_vm.youLine))]) : _vm._e()])]), _c("div", { staticClass: "pa-own__pills" }, [_c("span", { staticClass: "lib-pill lib-pill--run", attrs: { "data-tid": "pa-you-role" } }, [_c(__unplugin_components_2, { attrs: { "name": "user", "small": "" } }), _vm._v("You: " + _vm._s(_vm.roleWord(_vm.viewer).toLowerCase()))], 1), _c("span", { staticClass: "lib-pill" }, [_c(__unplugin_components_3, { attrs: { "name": _vm.remote ? "cloud" : "home", "small": "" } }), _vm._v(_vm._s(_vm.routeText))], 1)])]), _vm.shows("people") ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" People \xB7 " + _vm._s(_vm.peopleRows.length + 1) + " ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-people" } }, [_c("div", { staticClass: "pa-row" }, [_c("span", { staticClass: "pa-av" }, [_c("photo-face", { attrs: { "photo": _vm.ownerPhoto, "letter": _vm.ownerLetter } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v(_vm._s(_vm.ownerName) + " "), _c("span", { staticClass: "pa__muted" }, [_vm._v("\xB7 you")])]), _vm.ownerEmail ? _c("span", [_vm._v(_vm._s(_vm.ownerEmail))]) : _vm._e()]), _c("span", { staticClass: "lib-pill lib-pill--run" }, [_vm._v("Owner")])]), _vm._l(_vm.peopleRows, function(row) {
    return _c("div", { key: row.id, staticClass: "pa-row", attrs: { "data-tid": "pa-person" } }, [_c("span", { staticClass: "pa-av pa-av--b", attrs: { "data-tid": "pa-person-face" } }, [_c("photo-face", { attrs: { "photo": row.photo, "letter": row.letter } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v(_vm._s(row.name || row.email))]), _c("span", [_vm._v(_vm._s(row.line))])]), _c("span", { staticClass: "pa-row__acts" }, [_c("span", { staticClass: "lib-pill" }, [_vm._v(_vm._s(_vm.roleWord(row.role)))]), _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--ghost", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-person-role" }, on: { "click": function($event) {
      return _vm.openRole(row);
    } } }, [_vm._v("Change role")]), _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--danger", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-person-remove" }, on: { "click": function($event) {
      return _vm.removePerson(row);
    } } }, [_vm._v("Remove\u2026")])])]);
  }), !_vm.peopleRows.length ? _c("div", { staticClass: "pa-empty", attrs: { "data-tid": "pa-people-empty" } }, [_c("span", { staticClass: "pa-empty__ico" }, [_c(__unplugin_components_4, { attrs: { "name": "user" } })], 1), _c("b", [_vm._v("Only you so far")]), _c("span", [_vm._v("Invite someone to print or watch.")]), _c("button", { staticClass: "lib-btn lib-btn--pri lib-btn--sm", attrs: { "type": "button" }, on: { "click": _vm.openInvite } }, [_vm._v(" Invite someone ")])]) : _vm._e()], 2)] : _vm._e(), _vm.shows("waiting") ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" Waiting for you \xB7 " + _vm._s(_vm.waitingCount) + " ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-waiting" } }, [_vm._l(_vm.approvals, function(request) {
    return _c("div", { key: request.id, staticClass: "pa-row", attrs: { "data-tid": "pa-request" } }, [_c("span", { staticClass: "pa-av pa-av--d" }, [_c("photo-face", { attrs: { "photo": _vm.publicPhoto(request.requester && request.requester.avatar_url), "letter": _vm.letterOf(request.requester && request.requester.name || request.requester && request.requester.email) } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v(_vm._s(request.requester && (request.requester.name || request.requester.email) || "Someone") + " wants to join as " + _vm._s(_vm.roleWord(request.role)))]), _c("span", [_vm._v("Used your invite link \xB7 lapses " + _vm._s(_vm.day(request.expires_at)))])]), _c("span", { staticClass: "pa-row__acts" }, [_c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--ghost", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-request-refuse" }, on: { "click": function($event) {
      return _vm.answer(request, false);
    } } }, [_vm._v("Refuse")]), _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--pri", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-request-allow" }, on: { "click": function($event) {
      return _vm.answer(request, true);
    } } }, [_vm._v("Let in")])])]);
  }), _vm._l(_vm.invites, function(invite) {
    return _c("div", { key: invite.id, staticClass: "pa-row", attrs: { "data-tid": "pa-pending-invite" } }, [_c("span", { staticClass: "pa-av pa-av--d" }, [_vm._v("@")]), _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v(_vm._s(invite.email))]), _c("span", [_vm._v("Invited as " + _vm._s(_vm.roleWord(invite.role)) + " " + _vm._s(_vm.day(invite.created_at)) + " \xB7 not joined yet")])]), _c("span", { staticClass: "pa-row__acts" }, [_c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--ghost", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-invite-resend" }, on: { "click": function($event) {
      return _vm.resend(invite);
    } } }, [_vm._v("Resend")]), _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--ghost", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-invite-cancel" }, on: { "click": function($event) {
      return _vm.cancelInvite(invite);
    } } }, [_vm._v("Cancel invite")])])]);
  })], 2)] : _vm._e(), _vm.shows("links") ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" Invite links \xB7 " + _vm._s(_vm.links.length) + " ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-links" } }, _vm._l(_vm.links, function(link) {
    return _c("div", { key: link.id, staticClass: "pa-row", attrs: { "data-tid": "pa-link" } }, [_c("span", { staticClass: "pa-ico" }, [_c(__unplugin_components_5, { attrs: { "name": "link" } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", { staticClass: "pa-mono" }, [_vm._v(_vm._s(link.url || link.name || "Invite link"))]), _c("span", [_vm._v(_vm._s(_vm.linkLine(link)))])]), _c("span", { staticClass: "pa-row__acts" }, [link.url ? _c("button", { staticClass: "lib-btn lib-btn--sm", attrs: { "type": "button" }, on: { "click": function($event) {
      return _vm.copy(link.url);
    } } }, [_vm._v("Copy")]) : _vm._e(), _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--danger", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-link-end" }, on: { "click": function($event) {
      return _vm.endLink(link);
    } } }, [_vm._v("End")])])]);
  }), 0)] : _vm._e(), _vm.shows("devices") ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" Devices on this printer ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-devices" } }, [_c("div", { staticClass: "pa-row pa-row--soon" }, [_c("span", { staticClass: "pa-ico" }, [_c(__unplugin_components_6, { attrs: { "name": "devices" } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Not available yet")]), _c("span", [_vm._v(_vm._s(_vm.printerName) + " can't list the phones, browsers and agents it has let in yet, so they can't be removed from here.")])])])]), _c("div", { staticClass: "pa-gh" }, [_c("span", [_vm._v("Removing a device here will only remove it from " + _vm._s(_vm.printerName) + ".")]), _c("router-link", { staticClass: "pa-lnk", attrs: { "to": _vm.accountTo("devices"), "data-tid": "pa-devices-account" } }, [_vm._v(" Manage your own devices in Account"), _c(__unplugin_components_7, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 1)] : _vm._e(), _vm.shows("peopleReadOnly") ? [_c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-people-readonly" } }, [_c("div", { staticClass: "pa-row" }, [_c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("People")]), _c("span", [_vm._v(_vm._s(_vm.ownerName) + " (Owner), you (" + _vm._s(_vm.roleWord(_vm.viewer)) + "). The rest of the list isn't available yet.")])])])])] : _vm._e(), _vm.shows("canDo") ? [_c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-can-do" } }, [_c("div", { staticClass: "pa-row" }, [_c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("What you can do")]), _c("span", [_vm._v(_vm._s(_vm.canDoLine))])])]), _vm.shows("needToPrint") ? _c("div", { staticClass: "pa-row", attrs: { "data-tid": "pa-need-to-print" } }, [_c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Need to print?")]), _c("span", [_vm._v("Only the owner can change your role. Ask " + _vm._s(_vm.ownerFirstName) + ".")])])]) : _vm._e()])] : _vm._e(), _vm.shows("yourDevices") ? [_c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-your-devices" } }, [_c("div", { staticClass: "pa-row" }, [_c("span", { staticClass: "pa-ico" }, [_c(__unplugin_components_8, { attrs: { "name": "devices" } })], 1), _vm._m(0), _c("router-link", { staticClass: "pa-lnk", attrs: { "to": _vm.accountTo("devices"), "data-tid": "pa-your-devices-account" } }, [_vm._v(" In Account"), _c(__unplugin_components_9, { attrs: { "name": "chevronRight", "small": "" } })], 1)], 1)])] : _vm._e(), _vm.shows("entry") && _vm.state ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" Who can get in ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-entry" } }, [_c("div", { staticClass: "pa-row" }, [_vm._m(1), _c("span", { key: `entry-${_vm.renderKey}`, staticClass: "pa-seg", attrs: { "role": "group", "aria-label": "Who can get in" } }, _vm._l(["open", "protected"], function(entry) {
    return _c("button", { key: entry, class: { "pa-seg--on": _vm.state.entry === entry }, attrs: { "type": "button", "aria-pressed": _vm.state.entry === entry ? "true" : "false", "disabled": _vm.busy, "data-tid": `pa-entry-${entry}` }, on: { "click": function($event) {
      return _vm.changeEntry(entry);
    } } }, [_vm._v(_vm._s(entry === "open" ? "Open" : "Protected"))]);
  }), 0)]), _vm.acceptRequests !== null ? _c("div", { staticClass: "pa-row" }, [_vm._m(2), _c("toggle-switch", { key: `accept-${_vm.renderKey}`, attrs: { "value": _vm.acceptRequests, "label": "Allow new devices to ask", "disabled": _vm.busy, "data-tid": "pa-accept-requests" }, on: { "input": function($event) {
    return _vm.saveAcceptRequests(!!$event);
  } } })], 1) : _c("div", { staticClass: "pa-row pa-row--soon" }, [_vm._m(3)]), _c("div", { staticClass: "pa-row" }, [_vm._m(4), _c("select", { key: `data-${_vm.renderKey}`, staticClass: "pa-select", attrs: { "disabled": _vm.busy, "aria-label": "Where prints go", "data-tid": "pa-data" }, domProps: { "value": _vm.state.dataMode }, on: { "change": _vm.changeData } }, [_c("option", { attrs: { "value": "shared" } }, [_vm._v(" One shared drive ")]), _c("option", { attrs: { "value": "accounts" } }, [_vm._v(" A drive for each person ")]), _c("option", { attrs: { "value": "both" } }, [_vm._v(" Both ")])])]), _c("div", { staticClass: "pa-row" }, [_vm._m(5), _c("toggle-switch", { key: `private-${_vm.renderKey}`, attrs: { "value": _vm.state.privateUploads, "label": "Private uploads", "disabled": _vm.busy, "data-tid": "pa-private" }, on: { "input": function($event) {
    _vm.apply(() => _vm.client.setPrivateUploads(!!$event));
  } } })], 1)])] : _vm._e(), _vm.shows("askAtPrinter") && _vm.state ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" Who can get in ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-ask-at-printer" } }, [_c("div", { staticClass: "pa-row" }, [_c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("This printer is " + _vm._s(_vm.state.entry === "open" ? "Open" : "Protected"))]), _c("span", [_vm._v("From here, changing it is asked at the printer's own screen, which shows a code to compare.")])]), _c("button", { staticClass: "lib-btn lib-btn--sm", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-ask-at-printer-button" }, on: { "click": _vm.askAtPrinter } }, [_vm._v(" Ask at the printer ")])])])] : _vm._e(), _vm.shows("roles") ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" What each role can do ")]), _c("div", { staticClass: "pa-list pa-roles", attrs: { "data-tid": "pa-roles" } }, _vm._l(_vm.roleTable, function(row) {
    return _c("div", { key: row.id, staticClass: "pa-row", attrs: { "data-role-row": row.id } }, [_c("span", { staticClass: "pa-row__text" }, [_vm._v(_vm._s(row.label))]), _c("span", { staticClass: "pa-who" }, _vm._l(["owner", "operator", "viewer"], function(role) {
      return _c("span", { key: role, class: { "pa-who--y": _vm.roleHas(row, role) } }, [_vm._v(_vm._s(_vm.roleWord(role)))]);
    }), 0)]);
  }), 0), _vm.state && _vm.state.levelsPreset ? _c("p", { staticClass: "pa-gh", attrs: { "data-tid": "pa-roles-preset" } }, [_vm._v(" This is the table Muon printers move to. Until " + _vm._s(_vm.printerName) + `'s software fixes its levels to it, its own "` + _vm._s(_vm.presetWord) + '" preset decides. ')]) : _vm._e()] : _vm._e(), _vm.shows("olderTools") ? [_c("div", { staticClass: "pa-gt" }, [_vm._v(" For older tools ")]), _c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-older-tools" } }, [_c("div", { staticClass: "pa-row" }, [_c("span", { staticClass: "pa-ico" }, [_c(__unplugin_components_10, { attrs: { "name": "key" } })], 1), _vm._m(6), _c("button", { staticClass: "lib-btn lib-btn--sm", attrs: { "type": "button", "data-tid": "pa-api-key" }, on: { "click": function($event) {
    _vm.apiKeyOpen = true;
  } } }, [_vm._v(" Show ")])])])] : _vm._e(), _vm.shows("developer") || _vm.shows("unlink") ? _c("div", { staticClass: "pa-list pa-last" }, [_vm.shows("developer") ? _c("router-link", { staticClass: "pa-row pa-row--link", attrs: { "to": _vm.developerTo, "data-tid": "pa-developer" } }, [_c("span", { staticClass: "pa-ico" }, [_c(__unplugin_components_11, { attrs: { "name": "code" } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Developer mode")]), _c("span", [_vm._v(_vm._s(_vm.developerLine))])]), _c(__unplugin_components_12, { attrs: { "name": "chevronRight", "small": "" } })], 1) : _vm._e(), _vm.shows("unlink") ? _c("div", { staticClass: "pa-row", attrs: { "data-tid": "pa-unlink" } }, [_c("span", { staticClass: "pa-ico pa-ico--red" }, [_c(__unplugin_components_13, { attrs: { "name": "link" } })], 1), _c("div", { staticClass: "pa-row__text" }, [_c("b", { staticClass: "pa-red" }, [_vm._v("Unlink " + _vm._s(_vm.accountPrinterName) + " from your account")]), _c("span", [_vm._v("Everyone you share it with loses access. It keeps working on your network.")])]), _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--danger", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-unlink-button" }, on: { "click": _vm.unlink } }, [_vm._v(" Unlink\u2026 ")])]) : _vm._e()], 1) : _vm._e(), _vm.shows("leave") ? [_c("div", { staticClass: "pa-list", attrs: { "data-tid": "pa-leave" } }, [_c("div", { staticClass: "pa-row" }, [_c("div", { staticClass: "pa-row__text" }, [_c("b", { staticClass: "pa-red" }, [_vm._v("Leave " + _vm._s(_vm.accountPrinterName))]), !_vm.shareId ? _c("span", [_vm._v("Leaving from here isn't available yet for this printer.")]) : _vm._e()]), _vm.shareId ? _c("button", { staticClass: "lib-btn lib-btn--sm lib-btn--danger", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-leave-button" }, on: { "click": _vm.leave } }, [_vm._v(" Leave\u2026 ")]) : _vm._e()])])] : _vm._e(), _vm.viewer !== "owner" ? _c("p", { staticClass: "pa-lock", attrs: { "data-tid": "pa-lock" } }, [_c(__unplugin_components_14, { attrs: { "name": "lock", "small": "" } }), _vm._v(" " + _vm._s(_vm.lockLine) + " ")], 1) : _vm._e()], _vm.signInHint ? _c("p", { staticClass: "pa__note", attrs: { "data-tid": "pa-sign-in" } }, [_vm._v(" Sign in to manage people on " + _vm._s(_vm.printerName) + ": who's in, invites and links are kept with the owner's account. "), _c("router-link", { staticClass: "pa-lnk", attrs: { "to": "/sign-in" } }, [_vm._v(" Sign in ")])], 1) : _vm._e(), _vm.message ? _c("p", { staticClass: "pa__note", attrs: { "role": "status", "data-tid": "pa-message" } }, [_vm._v(" " + _vm._s(_vm.message) + " ")]) : _vm._e(), _c(__unplugin_components_15, { attrs: { "value": _vm.dialog === "invite", "title": `Invite someone to ${_vm.accountPrinterName}`, "persistent": _vm.busy, "max-width": "460" }, on: { "close": function($event) {
    _vm.dialog = "";
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.dialog = "";
    } } }, [_vm._v(" " + _vm._s(_vm.madeLink ? "Done" : "Cancel") + " ")]), _vm.inviteMode === "email" ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": !_vm.form.email.includes("@") || _vm.busy, "data-tid": "pa-invite-send" }, on: { "click": _vm.invite } }, [_vm._v(" Send invite ")]) : !_vm.madeLink ? _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": _vm.busy, "data-tid": "pa-link-make" }, on: { "click": _vm.makeLink } }, [_vm._v(" Make link ")]) : _vm._e()];
  }, proxy: true }]) }, [_c("p", { staticClass: "m3-dlg__text" }, [_vm._v(" " + _vm._s(_vm.inviteMode === "email" ? "By email: it appears in their account, and you can take it back any time." : "Share a link: anyone with it can join until it runs out, and you can end it any time.") + " ")]), _c("span", { staticClass: "pa-seg pa-seg--dlg", attrs: { "role": "group", "aria-label": "How" } }, [_c("button", { class: { "pa-seg--on": _vm.inviteMode === "email" }, attrs: { "type": "button", "aria-pressed": _vm.inviteMode === "email" ? "true" : "false", "data-tid": "pa-invite-email-tab", "disabled": _vm.busy }, on: { "click": function($event) {
    _vm.inviteMode = "email";
  } } }, [_vm._v("Email")]), _c("button", { class: { "pa-seg--on": _vm.inviteMode === "link" }, attrs: { "type": "button", "aria-pressed": _vm.inviteMode === "link" ? "true" : "false", "data-tid": "pa-invite-link-tab", "disabled": _vm.busy }, on: { "click": function($event) {
    _vm.inviteMode = "link";
  } } }, [_vm._v("Link")])]), _vm.inviteMode === "link" ? [_vm.madeLink ? _c("div", { staticClass: "m3-field", attrs: { "data-tid": "pa-link-made" } }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("Your link")]), _c("b", { staticClass: "pa-mono", attrs: { "data-tid": "pa-link-made-url" } }, [_vm._v(_vm._s(_vm.madeLink.url))]), _c("p", { staticClass: "pa__muted" }, [_vm._v(" " + _vm._s(_vm.linkLine(_vm.madeLink)) + " ")]), _c("button", { staticClass: "lib-btn lib-btn--sm", attrs: { "type": "button", "data-tid": "pa-link-made-copy" }, on: { "click": function($event) {
    return _vm.copy(_vm.madeLink.url || "");
  } } }, [_vm._v(" Copy link ")])]) : [_c("div", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("Link lasts")]), _c("div", { staticClass: "pa-opt" }, _vm._l(_vm.LINK_LASTS, function(o) {
    return _c("button", { key: o.value, class: { "pa-opt--on": _vm.linkForm.lifetime === o.value }, attrs: { "type": "button", "aria-pressed": _vm.linkForm.lifetime === o.value ? "true" : "false", "data-tid": `pa-link-lasts-${o.value}` }, on: { "click": function($event) {
      _vm.linkForm.lifetime = o.value;
    } } }, [_c("b", [_vm._v(_vm._s(o.label))])]);
  }), 0)]), _c("div", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("People who can use it")]), _c("div", { staticClass: "pa-opt" }, _vm._l(_vm.LINK_USES, function(o) {
    return _c("button", { key: o.label, class: { "pa-opt--on": _vm.linkForm.maxUses === o.value }, attrs: { "type": "button", "aria-pressed": _vm.linkForm.maxUses === o.value ? "true" : "false", "data-tid": `pa-link-uses-${o.value === null ? "any" : o.value}` }, on: { "click": function($event) {
      _vm.linkForm.maxUses = o.value;
    } } }, [_c("b", [_vm._v(_vm._s(o.label))])]);
  }), 0)]), _c("div", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("They can")]), _c("div", { staticClass: "pa-opt" }, _vm._l(["operator", "viewer"], function(role) {
    return _c("button", { key: role, class: { "pa-opt--on": _vm.linkForm.role === role }, attrs: { "type": "button", "aria-pressed": _vm.linkForm.role === role ? "true" : "false", "data-tid": `pa-link-role-${role}` }, on: { "click": function($event) {
      _vm.linkForm.role = role;
    } } }, [_c("b", [_vm._v(_vm._s(_vm.roleWord(role)))]), _c("span", [_vm._v(_vm._s(role === "operator" ? "Print, heat and move" : "Watch only"))])]);
  }), 0)]), _c("label", { staticClass: "pa-check" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.linkForm.approveEach, expression: "linkForm.approveEach" }], attrs: { "type": "checkbox", "data-tid": "pa-link-approve" }, domProps: { "checked": Array.isArray(_vm.linkForm.approveEach) ? _vm._i(_vm.linkForm.approveEach, null) > -1 : _vm.linkForm.approveEach }, on: { "change": function($event) {
    var $$a = _vm.linkForm.approveEach, $$el = $event.target, $$c = $$el.checked ? true : false;
    if (Array.isArray($$a)) {
      var $$v = null, $$i = _vm._i($$a, $$v);
      if ($$el.checked) {
        $$i < 0 && _vm.$set(_vm.linkForm, "approveEach", $$a.concat([$$v]));
      } else {
        $$i > -1 && _vm.$set(_vm.linkForm, "approveEach", $$a.slice(0, $$i).concat($$a.slice($$i + 1)));
      }
    } else {
      _vm.$set(_vm.linkForm, "approveEach", $$c);
    }
  } } }), _vm._v(" Approve each person: you let them in before they join ")])]] : _vm._e(), _vm.inviteMode === "email" ? _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("Email")]), _c("span", { staticClass: "m3-field__box" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.form.email, expression: "form.email" }], attrs: { "type": "email", "aria-label": "Email", "data-tid": "pa-invite-email" }, domProps: { "value": _vm.form.email }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.form, "email", $event.target.value);
  } } })])]) : _vm._e(), _vm.inviteMode === "email" ? _c("div", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("They can")]), _c("div", { staticClass: "pa-opt" }, _vm._l(["operator", "viewer"], function(role) {
    return _c("button", { key: role, class: { "pa-opt--on": _vm.form.role === role }, attrs: { "type": "button", "aria-pressed": _vm.form.role === role ? "true" : "false", "data-tid": `pa-invite-${role}` }, on: { "click": function($event) {
      _vm.form.role = role;
    } } }, [_c("b", [_vm._v(_vm._s(_vm.roleWord(role)))]), _c("span", [_vm._v(_vm._s(role === "operator" ? "Print, heat and move" : "Watch only"))])]);
  }), 0)]) : _vm._e(), _vm.inviteMode === "email" ? _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("Access ends "), _c("span", { staticClass: "pa__muted" }, [_vm._v("(leave empty for never)")])]), _c("span", { staticClass: "m3-field__box" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.form.until, expression: "form.until" }], attrs: { "type": "date", "aria-label": "Access ends" }, domProps: { "value": _vm.form.until }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.form, "until", $event.target.value);
  } } })])]) : _vm._e(), _vm.dialogError ? _c("p", { staticClass: "m3-dlg__error", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.dialogError) + " ")]) : _vm._e()], 2), _c(__unplugin_components_16, { attrs: { "value": _vm.dialog === "role", "title": "Change role", "persistent": _vm.busy }, on: { "close": function($event) {
    _vm.dialog = "";
  } }, scopedSlots: _vm._u([{ key: "actions", fn: function() {
    return [_c("button", { staticClass: "cbtn cbtn--ghost", attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.dialog = "";
    } } }, [_vm._v(" Cancel ")]), _c("button", { staticClass: "cbtn cbtn--primary", attrs: { "type": "button", "disabled": _vm.busy || !_vm.changing || _vm.form.role === _vm.changing.role && _vm.roleEnds(_vm.changing) === _vm.changing.endsAt, "data-tid": "pa-role-save" }, on: { "click": _vm.changeRole } }, [_vm._v(" Save ")])];
  }, proxy: true }]) }, [_c("p", { staticClass: "m3-dlg__text" }, [_vm._v(" What " + _vm._s(_vm.changing && _vm.changing.email) + " can do on " + _vm._s(_vm.accountPrinterName) + ", and when it ends. ")]), _c("div", { staticClass: "pa-opt" }, _vm._l(["operator", "viewer"], function(role) {
    return _c("button", { key: role, class: { "pa-opt--on": _vm.form.role === role }, attrs: { "type": "button", "aria-pressed": _vm.form.role === role ? "true" : "false", "data-tid": `pa-role-${role}` }, on: { "click": function($event) {
      _vm.form.role = role;
    } } }, [_c("b", [_vm._v(_vm._s(_vm.roleWord(role)))]), _c("span", [_vm._v(_vm._s(role === "operator" ? "Print, heat and move" : "Watch only"))])]);
  }), 0), _c("label", { staticClass: "m3-field" }, [_c("span", { staticClass: "m3-field__label" }, [_vm._v("Access ends "), _c("span", { staticClass: "pa__muted" }, [_vm._v("(leave empty for never)")])]), _c("span", { staticClass: "m3-field__box" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.form.until, expression: "form.until" }], attrs: { "type": "date", "aria-label": "Access ends", "data-tid": "pa-role-until" }, domProps: { "value": _vm.form.until }, on: { "input": function($event) {
    if ($event.target.composing) return;
    _vm.$set(_vm.form, "until", $event.target.value);
  } } })])]), _vm.dialogError ? _c("p", { staticClass: "m3-dlg__error", attrs: { "role": "alert" } }, [_vm._v(" " + _vm._s(_vm.dialogError) + " ")]) : _vm._e()]), _vm.apiKeyOpen ? _c("api-key-dialog", { model: { value: _vm.apiKeyOpen, callback: function($$v) {
    _vm.apiKeyOpen = $$v;
  }, expression: "apiKeyOpen" } }) : _vm._e(), _vm.askingOpen && _vm.asking ? _c("access-request-dialog", { attrs: { "client": _vm.client, "ask": _vm.asking, "printer-name": _vm.printerName }, on: { "answered": _vm.refresh }, model: { value: _vm.askingOpen, callback: function($$v) {
    _vm.askingOpen = $$v;
  }, expression: "askingOpen" } }) : _vm._e()], 2);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Your devices")]), _c("span", [_vm._v("The devices you use here, signed out or removed everywhere, are in Account.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("This printer is")]), _c("span", [_vm._v("Protected: only people you let in. Open: anyone on the same network is an Operator.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Allow new devices to ask")]), _c("span", [_vm._v("A new phone or browser can ask to connect, and you accept or reject it at the printer.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Allow new devices to ask")]), _c("span", [_vm._v("Not available on this printer yet.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Where prints go")]), _c("span", [_vm._v("One shared drive, a drive for each person, or both.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Private uploads")]), _c("span", [_vm._v("Others can't see or reprint someone's uploads. It doesn't hide a file from someone holding the printer.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "pa-row__text" }, [_c("b", [_vm._v("Moonraker API key")]), _c("span", [_vm._v("For tools that predate Muon3D accounts. Full access, no end date. Turning it off isn't available yet.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/settings/people-access/PeopleAccessSettings.vue?vue&type=style&index=0&scoped=2943a5db&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "2943a5db",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/settings/people-access/PeopleAccessSettings.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbzZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLE9BTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUtBO0FBQ0E7QUFhQTtBQWVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxJQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUNBO0FBQUEsUUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBLHNDQUNBLDJFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUVBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQUEsYUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUEsVUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBR0E7QUFDQTtBQUNBO0FBQUEsSUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLElBQ0E7QUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFHQTtBQUNBO0FBQUEsRUFDQTtBQUNBO0FBNWZBO0FBQUEsRUFEQTtBQUFBLEdBbERBLHFCQW1EQTtBQU1BO0FBQUEsRUFEQTtBQUFBLEdBeERBLHFCQXlEQTtBQXpEQTtBQUFBLEVBREE7QUFBQSxHQUNBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJQZW9wbGVBY2Nlc3NTZXR0aW5ncy52dWUiXSwic291cmNlc0NvbnRlbnQiOlsiPHRlbXBsYXRlPlxuICA8c2VjdGlvblxuICAgIGlkPVwiYWNjZXNzXCJcbiAgICBjbGFzcz1cInBhXCJcbiAgICBkYXRhLXRpZD1cInBlb3BsZS1hY2Nlc3NcIlxuICA+XG4gICAgPGhlYWRlciBjbGFzcz1cInBhX19oZWFkXCI+XG4gICAgICA8ZGl2PlxuICAgICAgICA8aDI+UGVvcGxlIGFuZCBhY2Nlc3M8L2gyPlxuICAgICAgICA8cD5XaG8gY2FuIHVzZSB7eyBwcmludGVyTmFtZSB9fSBhbmQgd2hhdCB0aGV5IGNhbiBkby48L3A+XG4gICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgIDp0bz1cImFjY291bnRUbygncHJpbnRlcnMnKVwiXG4gICAgICAgICAgY2xhc3M9XCJwYS1sbmtcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGEtYWNjb3VudC1saW5rXCJcbiAgICAgICAgPlxuICAgICAgICAgIFlvdXIgb3duIGRldmljZXMgYW5kIGFwcHMgYXJlIGluIEFjY291bnQ8ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cImNoZXZyb25SaWdodFwiXG4gICAgICAgICAgICBzbWFsbFxuICAgICAgICAgIC8+XG4gICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdi1pZj1cInZpZXdlciA9PT0gJ293bmVyJyAmJiBjbG91ZE93bmVkXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1wcmlcIlxuICAgICAgICBkYXRhLXRpZD1cInBhLWludml0ZVwiXG4gICAgICAgIEBjbGljaz1cIm9wZW5JbnZpdGVcIlxuICAgICAgPlxuICAgICAgICA8ZnJhbWUtaWNvblxuICAgICAgICAgIG5hbWU9XCJ1c2VyUGx1c1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5JbnZpdGUgc29tZW9uZVxuICAgICAgPC9idXR0b24+XG4gICAgPC9oZWFkZXI+XG5cbiAgICA8cFxuICAgICAgdi1pZj1cImxvYWRpbmcgJiYgIXZpZXdlclwiXG4gICAgICBjbGFzcz1cInBhX19tdXRlZFwiXG4gICAgICBkYXRhLXRpZD1cInBhLWxvYWRpbmdcIlxuICAgID5cbiAgICAgIFJlYWRpbmcgd2hvIGNhbiB1c2Uge3sgcHJpbnRlck5hbWUgfX3igKZcbiAgICA8L3A+XG5cbiAgICA8cFxuICAgICAgdi1lbHNlLWlmPVwiIXZpZXdlclwiXG4gICAgICBjbGFzcz1cInBhX19ub3RlXCJcbiAgICAgIGRhdGEtdGlkPVwicGEtdW5rbm93blwiXG4gICAgPlxuICAgICAge3sgcHJpbnRlck5hbWUgfX0gZGlkbid0IHNheSB3aG8geW91IGFyZSBoZXJlLiB7eyBwcmludGVyRXJyb3IgfX1cbiAgICA8L3A+XG5cbiAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgPCEtLSBZb3UsIHRoZSBvd25lciBhbmQgaG93IHlvdSdyZSBjb25uZWN0ZWQgLS0+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwicGEtbGlzdCBwYS1vd25cIlxuICAgICAgICBkYXRhLXRpZD1cInBhLXlvdVwiXG4gICAgICA+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJwYS1hdiBwYS1hdi0tbGdcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1vd25lci1mYWNlXCJcbiAgICAgICAgICA+PHBob3RvLWZhY2VcbiAgICAgICAgICAgIDpwaG90bz1cIm93bmVyUGhvdG9cIlxuICAgICAgICAgICAgOmxldHRlcj1cIm93bmVyTGV0dGVyXCJcbiAgICAgICAgICAvPjwvc3Bhbj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhLWV5ZWJyb3dcIj5Pd25lcjwvc3Bhbj5cbiAgICAgICAgICAgIDxiIGRhdGEtdGlkPVwicGEtb3duZXJcIj57eyBvd25lck5hbWUgfX08L2I+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICB2LWlmPVwidmlld2VyICE9PSAnb3duZXInICYmIHlvdUxpbmVcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLXlvdS1saW5lXCJcbiAgICAgICAgICAgID57eyB5b3VMaW5lIH19PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBhLW93bl9fcGlsbHNcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3M9XCJsaWItcGlsbCBsaWItcGlsbC0tcnVuXCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwicGEteW91LXJvbGVcIlxuICAgICAgICAgID48ZnJhbWUtaWNvblxuICAgICAgICAgICAgbmFtZT1cInVzZXJcIlxuICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAvPllvdToge3sgcm9sZVdvcmQodmlld2VyKS50b0xvd2VyQ2FzZSgpIH19PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGliLXBpbGxcIj48ZnJhbWUtaWNvblxuICAgICAgICAgICAgOm5hbWU9XCJyZW1vdGUgPyAnY2xvdWQnIDogJ2hvbWUnXCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz57eyByb3V0ZVRleHQgfX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gT3duZXI6IHBlb3BsZSAtLT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2hvd3MoJ3Blb3BsZScpXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwYS1ndFwiPlxuICAgICAgICAgIFBlb3BsZSDCtyB7eyBwZW9wbGVSb3dzLmxlbmd0aCArIDEgfX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cInBhLWxpc3RcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGEtcGVvcGxlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGEtYXZcIj48cGhvdG8tZmFjZVxuICAgICAgICAgICAgICA6cGhvdG89XCJvd25lclBob3RvXCJcbiAgICAgICAgICAgICAgOmxldHRlcj1cIm93bmVyTGV0dGVyXCJcbiAgICAgICAgICAgIC8+PC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj57eyBvd25lck5hbWUgfX0gPHNwYW4gY2xhc3M9XCJwYV9fbXV0ZWRcIj7CtyB5b3U8L3NwYW4+PC9iPlxuICAgICAgICAgICAgICA8c3BhbiB2LWlmPVwib3duZXJFbWFpbFwiPnt7IG93bmVyRW1haWwgfX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGliLXBpbGwgbGliLXBpbGwtLXJ1blwiPk93bmVyPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtZm9yPVwicm93IGluIHBlb3BsZVJvd3NcIlxuICAgICAgICAgICAgOmtleT1cInJvdy5pZFwiXG4gICAgICAgICAgICBjbGFzcz1cInBhLXJvd1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInBhLXBlcnNvblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgY2xhc3M9XCJwYS1hdiBwYS1hdi0tYlwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwicGEtcGVyc29uLWZhY2VcIlxuICAgICAgICAgICAgPjxwaG90by1mYWNlXG4gICAgICAgICAgICAgIDpwaG90bz1cInJvdy5waG90b1wiXG4gICAgICAgICAgICAgIDpsZXR0ZXI9XCJyb3cubGV0dGVyXCJcbiAgICAgICAgICAgIC8+PC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj57eyByb3cubmFtZSB8fCByb3cuZW1haWwgfX08L2I+XG4gICAgICAgICAgICAgIDxzcGFuPnt7IHJvdy5saW5lIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhLXJvd19fYWN0c1wiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImxpYi1waWxsXCI+e3sgcm9sZVdvcmQocm93LnJvbGUpIH19PC9zcGFuPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJsaWItYnRuIGxpYi1idG4tLXNtIGxpYi1idG4tLWdob3N0XCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLXBlcnNvbi1yb2xlXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJvcGVuUm9sZShyb3cpXCJcbiAgICAgICAgICAgICAgPkNoYW5nZSByb2xlPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImxpYi1idG4gbGliLWJ0bi0tc20gbGliLWJ0bi0tZGFuZ2VyXCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLXBlcnNvbi1yZW1vdmVcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cInJlbW92ZVBlcnNvbihyb3cpXCJcbiAgICAgICAgICAgICAgPlJlbW92ZeKApjwvYnV0dG9uPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtaWY9XCIhcGVvcGxlUm93cy5sZW5ndGhcIlxuICAgICAgICAgICAgY2xhc3M9XCJwYS1lbXB0eVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInBhLXBlb3BsZS1lbXB0eVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwYS1lbXB0eV9faWNvXCI+PGZyYW1lLWljb24gbmFtZT1cInVzZXJcIiAvPjwvc3Bhbj5cbiAgICAgICAgICAgIDxiPk9ubHkgeW91IHNvIGZhcjwvYj5cbiAgICAgICAgICAgIDxzcGFuPkludml0ZSBzb21lb25lIHRvIHByaW50IG9yIHdhdGNoLjwvc3Bhbj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1wcmkgbGliLWJ0bi0tc21cIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJvcGVuSW52aXRlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgSW52aXRlIHNvbWVvbmVcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvdGVtcGxhdGU+XG5cbiAgICAgIDwhLS0gT3duZXI6IHdhaXRpbmcgZm9yIHlvdSAtLT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2hvd3MoJ3dhaXRpbmcnKVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGEtZ3RcIj5cbiAgICAgICAgICBXYWl0aW5nIGZvciB5b3Ugwrcge3sgd2FpdGluZ0NvdW50IH19XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJwYS1saXN0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLXdhaXRpbmdcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1mb3I9XCJyZXF1ZXN0IGluIGFwcHJvdmFsc1wiXG4gICAgICAgICAgICA6a2V5PVwicmVxdWVzdC5pZFwiXG4gICAgICAgICAgICBjbGFzcz1cInBhLXJvd1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInBhLXJlcXVlc3RcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGEtYXYgcGEtYXYtLWRcIj48cGhvdG8tZmFjZVxuICAgICAgICAgICAgICA6cGhvdG89XCJwdWJsaWNQaG90byhyZXF1ZXN0LnJlcXVlc3RlciAmJiByZXF1ZXN0LnJlcXVlc3Rlci5hdmF0YXJfdXJsKVwiXG4gICAgICAgICAgICAgIDpsZXR0ZXI9XCJsZXR0ZXJPZigocmVxdWVzdC5yZXF1ZXN0ZXIgJiYgcmVxdWVzdC5yZXF1ZXN0ZXIubmFtZSkgfHwgKHJlcXVlc3QucmVxdWVzdGVyICYmIHJlcXVlc3QucmVxdWVzdGVyLmVtYWlsKSlcIlxuICAgICAgICAgICAgLz48L3NwYW4+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICAgIDxiPnt7IChyZXF1ZXN0LnJlcXVlc3RlciAmJiAocmVxdWVzdC5yZXF1ZXN0ZXIubmFtZSB8fCByZXF1ZXN0LnJlcXVlc3Rlci5lbWFpbCkpIHx8ICdTb21lb25lJyB9fSB3YW50cyB0byBqb2luIGFzIHt7IHJvbGVXb3JkKHJlcXVlc3Qucm9sZSkgfX08L2I+XG4gICAgICAgICAgICAgIDxzcGFuPlVzZWQgeW91ciBpbnZpdGUgbGluayDCtyBsYXBzZXMge3sgZGF5KHJlcXVlc3QuZXhwaXJlc19hdCkgfX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGEtcm93X19hY3RzXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImxpYi1idG4gbGliLWJ0bi0tc20gbGliLWJ0bi0tZ2hvc3RcIlxuICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwicGEtcmVxdWVzdC1yZWZ1c2VcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImFuc3dlcihyZXF1ZXN0LCBmYWxzZSlcIlxuICAgICAgICAgICAgICA+UmVmdXNlPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImxpYi1idG4gbGliLWJ0bi0tc20gbGliLWJ0bi0tcHJpXCJcbiAgICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLXJlcXVlc3QtYWxsb3dcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImFuc3dlcihyZXF1ZXN0LCB0cnVlKVwiXG4gICAgICAgICAgICAgID5MZXQgaW48L2J1dHRvbj5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWZvcj1cImludml0ZSBpbiBpbnZpdGVzXCJcbiAgICAgICAgICAgIDprZXk9XCJpbnZpdGUuaWRcIlxuICAgICAgICAgICAgY2xhc3M9XCJwYS1yb3dcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1wZW5kaW5nLWludml0ZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwYS1hdiBwYS1hdi0tZFwiPkA8L3NwYW4+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICAgIDxiPnt7IGludml0ZS5lbWFpbCB9fTwvYj5cbiAgICAgICAgICAgICAgPHNwYW4+SW52aXRlZCBhcyB7eyByb2xlV29yZChpbnZpdGUucm9sZSkgfX0ge3sgZGF5KGludml0ZS5jcmVhdGVkX2F0KSB9fSDCtyBub3Qgam9pbmVkIHlldDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwYS1yb3dfX2FjdHNcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbSBsaWItYnRuLS1naG9zdFwiXG4gICAgICAgICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1pbnZpdGUtcmVzZW5kXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJyZXNlbmQoaW52aXRlKVwiXG4gICAgICAgICAgICAgID5SZXNlbmQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbSBsaWItYnRuLS1naG9zdFwiXG4gICAgICAgICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1pbnZpdGUtY2FuY2VsXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJjYW5jZWxJbnZpdGUoaW52aXRlKVwiXG4gICAgICAgICAgICAgID5DYW5jZWwgaW52aXRlPC9idXR0b24+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPCEtLSBPd25lcjogaW52aXRlIGxpbmtzIC0tPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCJzaG93cygnbGlua3MnKVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGEtZ3RcIj5cbiAgICAgICAgICBJbnZpdGUgbGlua3Mgwrcge3sgbGlua3MubGVuZ3RoIH19XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJwYS1saXN0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWxpbmtzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtZm9yPVwibGluayBpbiBsaW5rc1wiXG4gICAgICAgICAgICA6a2V5PVwibGluay5pZFwiXG4gICAgICAgICAgICBjbGFzcz1cInBhLXJvd1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInBhLWxpbmtcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGEtaWNvXCI+PGZyYW1lLWljb24gbmFtZT1cImxpbmtcIiAvPjwvc3Bhbj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dfX3RleHRcIj5cbiAgICAgICAgICAgICAgPGIgY2xhc3M9XCJwYS1tb25vXCI+e3sgbGluay51cmwgfHwgbGluay5uYW1lIHx8ICdJbnZpdGUgbGluaycgfX08L2I+XG4gICAgICAgICAgICAgIDxzcGFuPnt7IGxpbmtMaW5lKGxpbmspIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhLXJvd19fYWN0c1wiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1pZj1cImxpbmsudXJsXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImxpYi1idG4gbGliLWJ0bi0tc21cIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImNvcHkobGluay51cmwpXCJcbiAgICAgICAgICAgICAgPkNvcHk8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbSBsaWItYnRuLS1kYW5nZXJcIlxuICAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgICAgIGRhdGEtdGlkPVwicGEtbGluay1lbmRcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImVuZExpbmsobGluaylcIlxuICAgICAgICAgICAgICA+RW5kPC9idXR0b24+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPCEtLSBPd25lcjogZGV2aWNlcyBvbiB0aGlzIHByaW50ZXIgKEozLCBuZWVkcyB0aGUgcHJpbnRlcikgLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dzKCdkZXZpY2VzJylcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBhLWd0XCI+XG4gICAgICAgICAgRGV2aWNlcyBvbiB0aGlzIHByaW50ZXJcbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cInBhLWxpc3RcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGEtZGV2aWNlc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93IHBhLXJvdy0tc29vblwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwYS1pY29cIj48ZnJhbWUtaWNvbiBuYW1lPVwiZGV2aWNlc1wiIC8+PC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj5Ob3QgYXZhaWxhYmxlIHlldDwvYj5cbiAgICAgICAgICAgICAgPHNwYW4+e3sgcHJpbnRlck5hbWUgfX0gY2FuJ3QgbGlzdCB0aGUgcGhvbmVzLCBicm93c2VycyBhbmQgYWdlbnRzIGl0IGhhcyBsZXQgaW4geWV0LCBzbyB0aGV5IGNhbid0IGJlIHJlbW92ZWQgZnJvbSBoZXJlLjwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBhLWdoXCI+XG4gICAgICAgICAgPHNwYW4+UmVtb3ZpbmcgYSBkZXZpY2UgaGVyZSB3aWxsIG9ubHkgcmVtb3ZlIGl0IGZyb20ge3sgcHJpbnRlck5hbWUgfX0uPC9zcGFuPlxuICAgICAgICAgIDxyb3V0ZXItbGlua1xuICAgICAgICAgICAgOnRvPVwiYWNjb3VudFRvKCdkZXZpY2VzJylcIlxuICAgICAgICAgICAgY2xhc3M9XCJwYS1sbmtcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1kZXZpY2VzLWFjY291bnRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIE1hbmFnZSB5b3VyIG93biBkZXZpY2VzIGluIEFjY291bnQ8ZnJhbWUtaWNvblxuICAgICAgICAgICAgICBuYW1lPVwiY2hldnJvblJpZ2h0XCJcbiAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8IS0tIE9wZXJhdG9yOiB0aGUgcGVvcGxlLCByZWFkLW9ubHkgLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dzKCdwZW9wbGVSZWFkT25seScpXCI+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cInBhLWxpc3RcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGEtcGVvcGxlLXJlYWRvbmx5XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dfX3RleHRcIj5cbiAgICAgICAgICAgICAgPGI+UGVvcGxlPC9iPlxuICAgICAgICAgICAgICA8c3Bhbj57eyBvd25lck5hbWUgfX0gKE93bmVyKSwgeW91ICh7eyByb2xlV29yZCh2aWV3ZXIpIH19KS4gVGhlIHJlc3Qgb2YgdGhlIGxpc3QgaXNuJ3QgYXZhaWxhYmxlIHlldC48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8IS0tIE1lbWJlcjogd2hhdCB5b3UgY2FuIGRvIC0tPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCJzaG93cygnY2FuRG8nKVwiPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJwYS1saXN0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWNhbi1kb1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICAgIDxiPldoYXQgeW91IGNhbiBkbzwvYj5cbiAgICAgICAgICAgICAgPHNwYW4+e3sgY2FuRG9MaW5lIH19PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgdi1pZj1cInNob3dzKCduZWVkVG9QcmludCcpXCJcbiAgICAgICAgICAgIGNsYXNzPVwicGEtcm93XCJcbiAgICAgICAgICAgIGRhdGEtdGlkPVwicGEtbmVlZC10by1wcmludFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj5OZWVkIHRvIHByaW50PzwvYj5cbiAgICAgICAgICAgICAgPHNwYW4+T25seSB0aGUgb3duZXIgY2FuIGNoYW5nZSB5b3VyIHJvbGUuIEFzayB7eyBvd25lckZpcnN0TmFtZSB9fS48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8IS0tIE9wZXJhdG9yOiB5b3VyIGRldmljZXMgaGVyZSAtLT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2hvd3MoJ3lvdXJEZXZpY2VzJylcIj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwicGEtbGlzdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS15b3VyLWRldmljZXNcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd1wiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwYS1pY29cIj48ZnJhbWUtaWNvbiBuYW1lPVwiZGV2aWNlc1wiIC8+PC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj5Zb3VyIGRldmljZXM8L2I+XG4gICAgICAgICAgICAgIDxzcGFuPlRoZSBkZXZpY2VzIHlvdSB1c2UgaGVyZSwgc2lnbmVkIG91dCBvciByZW1vdmVkIGV2ZXJ5d2hlcmUsIGFyZSBpbiBBY2NvdW50Ljwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHJvdXRlci1saW5rXG4gICAgICAgICAgICAgIDp0bz1cImFjY291bnRUbygnZGV2aWNlcycpXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJwYS1sbmtcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLXlvdXItZGV2aWNlcy1hY2NvdW50XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgSW4gQWNjb3VudDxmcmFtZS1pY29uXG4gICAgICAgICAgICAgICAgbmFtZT1cImNoZXZyb25SaWdodFwiXG4gICAgICAgICAgICAgICAgc21hbGxcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPCEtLSBPd25lcjogd2hvIGNhbiBnZXQgaW4gLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dzKCdlbnRyeScpICYmIHN0YXRlXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwYS1ndFwiPlxuICAgICAgICAgIFdobyBjYW4gZ2V0IGluXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJwYS1saXN0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWVudHJ5XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dfX3RleHRcIj5cbiAgICAgICAgICAgICAgPGI+VGhpcyBwcmludGVyIGlzPC9iPlxuICAgICAgICAgICAgICA8c3Bhbj5Qcm90ZWN0ZWQ6IG9ubHkgcGVvcGxlIHlvdSBsZXQgaW4uIE9wZW46IGFueW9uZSBvbiB0aGUgc2FtZSBuZXR3b3JrIGlzIGFuIE9wZXJhdG9yLjwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgOmtleT1cImBlbnRyeS0ke3JlbmRlcktleX1gXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJwYS1zZWdcIlxuICAgICAgICAgICAgICByb2xlPVwiZ3JvdXBcIlxuICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiV2hvIGNhbiBnZXQgaW5cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1mb3I9XCJlbnRyeSBpbiBbJ29wZW4nLCAncHJvdGVjdGVkJ11cIlxuICAgICAgICAgICAgICAgIDprZXk9XCJlbnRyeVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgOmNsYXNzPVwieyAncGEtc2VnLS1vbic6IHN0YXRlLmVudHJ5ID09PSBlbnRyeSB9XCJcbiAgICAgICAgICAgICAgICA6YXJpYS1wcmVzc2VkPVwic3RhdGUuZW50cnkgPT09IGVudHJ5ID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICAgICAgOmRpc2FibGVkPVwiYnVzeVwiXG4gICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHBhLWVudHJ5LSR7ZW50cnl9YFwiXG4gICAgICAgICAgICAgICAgQGNsaWNrPVwiY2hhbmdlRW50cnkoZW50cnkpXCJcbiAgICAgICAgICAgICAgPnt7IGVudHJ5ID09PSAnb3BlbicgPyAnT3BlbicgOiAnUHJvdGVjdGVkJyB9fTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIHYtaWY9XCJhY2NlcHRSZXF1ZXN0cyAhPT0gbnVsbFwiXG4gICAgICAgICAgICBjbGFzcz1cInBhLXJvd1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj5BbGxvdyBuZXcgZGV2aWNlcyB0byBhc2s8L2I+XG4gICAgICAgICAgICAgIDxzcGFuPkEgbmV3IHBob25lIG9yIGJyb3dzZXIgY2FuIGFzayB0byBjb25uZWN0LCBhbmQgeW91IGFjY2VwdCBvciByZWplY3QgaXQgYXQgdGhlIHByaW50ZXIuPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgICAgICA6a2V5PVwiYGFjY2VwdC0ke3JlbmRlcktleX1gXCJcbiAgICAgICAgICAgICAgOnZhbHVlPVwiYWNjZXB0UmVxdWVzdHNcIlxuICAgICAgICAgICAgICBsYWJlbD1cIkFsbG93IG5ldyBkZXZpY2VzIHRvIGFza1wiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLWFjY2VwdC1yZXF1ZXN0c1wiXG4gICAgICAgICAgICAgIEBpbnB1dD1cInNhdmVBY2NlcHRSZXF1ZXN0cyghISRldmVudClcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWVsc2VcbiAgICAgICAgICAgIGNsYXNzPVwicGEtcm93IHBhLXJvdy0tc29vblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj5BbGxvdyBuZXcgZGV2aWNlcyB0byBhc2s8L2I+XG4gICAgICAgICAgICAgIDxzcGFuPk5vdCBhdmFpbGFibGUgb24gdGhpcyBwcmludGVyIHlldC48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICAgIDxiPldoZXJlIHByaW50cyBnbzwvYj5cbiAgICAgICAgICAgICAgPHNwYW4+T25lIHNoYXJlZCBkcml2ZSwgYSBkcml2ZSBmb3IgZWFjaCBwZXJzb24sIG9yIGJvdGguPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgIDprZXk9XCJgZGF0YS0ke3JlbmRlcktleX1gXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJwYS1zZWxlY3RcIlxuICAgICAgICAgICAgICA6dmFsdWU9XCJzdGF0ZS5kYXRhTW9kZVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiV2hlcmUgcHJpbnRzIGdvXCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1kYXRhXCJcbiAgICAgICAgICAgICAgQGNoYW5nZT1cImNoYW5nZURhdGFcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2hhcmVkXCI+XG4gICAgICAgICAgICAgICAgT25lIHNoYXJlZCBkcml2ZVxuICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImFjY291bnRzXCI+XG4gICAgICAgICAgICAgICAgQSBkcml2ZSBmb3IgZWFjaCBwZXJzb25cbiAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJib3RoXCI+XG4gICAgICAgICAgICAgICAgQm90aFxuICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dfX3RleHRcIj5cbiAgICAgICAgICAgICAgPGI+UHJpdmF0ZSB1cGxvYWRzPC9iPlxuICAgICAgICAgICAgICA8c3Bhbj5PdGhlcnMgY2FuJ3Qgc2VlIG9yIHJlcHJpbnQgc29tZW9uZSdzIHVwbG9hZHMuIEl0IGRvZXNuJ3QgaGlkZSBhIGZpbGUgZnJvbSBzb21lb25lIGhvbGRpbmcgdGhlIHByaW50ZXIuPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8dG9nZ2xlLXN3aXRjaFxuICAgICAgICAgICAgICA6a2V5PVwiYHByaXZhdGUtJHtyZW5kZXJLZXl9YFwiXG4gICAgICAgICAgICAgIDp2YWx1ZT1cInN0YXRlLnByaXZhdGVVcGxvYWRzXCJcbiAgICAgICAgICAgICAgbGFiZWw9XCJQcml2YXRlIHVwbG9hZHNcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1wcml2YXRlXCJcbiAgICAgICAgICAgICAgQGlucHV0PVwiYXBwbHkoKCkgPT4gY2xpZW50LnNldFByaXZhdGVVcGxvYWRzKCEhJGV2ZW50KSlcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8IS0tIE93bmVyLCBmcm9tIGF3YXk6IHRoZSBwcmludGVyIGxldHMgaXRzIG93biBzY3JlZW4gYmUgYXNrZWQgKHByb3RlY3Rpb246IGFzaykgLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dzKCdhc2tBdFByaW50ZXInKSAmJiBzdGF0ZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGEtZ3RcIj5cbiAgICAgICAgICBXaG8gY2FuIGdldCBpblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwicGEtbGlzdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS1hc2stYXQtcHJpbnRlclwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICAgIDxiPlRoaXMgcHJpbnRlciBpcyB7eyBzdGF0ZS5lbnRyeSA9PT0gJ29wZW4nID8gJ09wZW4nIDogJ1Byb3RlY3RlZCcgfX08L2I+XG4gICAgICAgICAgICAgIDxzcGFuPkZyb20gaGVyZSwgY2hhbmdpbmcgaXQgaXMgYXNrZWQgYXQgdGhlIHByaW50ZXIncyBvd24gc2NyZWVuLCB3aGljaCBzaG93cyBhIGNvZGUgdG8gY29tcGFyZS48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbVwiXG4gICAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgICBkYXRhLXRpZD1cInBhLWFzay1hdC1wcmludGVyLWJ1dHRvblwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImFza0F0UHJpbnRlclwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIEFzayBhdCB0aGUgcHJpbnRlclxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPCEtLSBPd25lcjogdGhlIHJvbGUgdGFibGUgLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dzKCdyb2xlcycpXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwYS1ndFwiPlxuICAgICAgICAgIFdoYXQgZWFjaCByb2xlIGNhbiBkb1xuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwicGEtbGlzdCBwYS1yb2xlc1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS1yb2xlc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICB2LWZvcj1cInJvdyBpbiByb2xlVGFibGVcIlxuICAgICAgICAgICAgOmtleT1cInJvdy5pZFwiXG4gICAgICAgICAgICBjbGFzcz1cInBhLXJvd1wiXG4gICAgICAgICAgICA6ZGF0YS1yb2xlLXJvdz1cInJvdy5pZFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwYS1yb3dfX3RleHRcIj57eyByb3cubGFiZWwgfX08L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhLXdob1wiPlxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIHYtZm9yPVwicm9sZSBpbiBbJ293bmVyJywgJ29wZXJhdG9yJywgJ3ZpZXdlciddXCJcbiAgICAgICAgICAgICAgICA6a2V5PVwicm9sZVwiXG4gICAgICAgICAgICAgICAgOmNsYXNzPVwieyAncGEtd2hvLS15Jzogcm9sZUhhcyhyb3csIHJvbGUpIH1cIlxuICAgICAgICAgICAgICA+e3sgcm9sZVdvcmQocm9sZSkgfX08L3NwYW4+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cFxuICAgICAgICAgIHYtaWY9XCJzdGF0ZSAmJiBzdGF0ZS5sZXZlbHNQcmVzZXRcIlxuICAgICAgICAgIGNsYXNzPVwicGEtZ2hcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGEtcm9sZXMtcHJlc2V0XCJcbiAgICAgICAgPlxuICAgICAgICAgIFRoaXMgaXMgdGhlIHRhYmxlIE11b24gcHJpbnRlcnMgbW92ZSB0by4gVW50aWwge3sgcHJpbnRlck5hbWUgfX0ncyBzb2Z0d2FyZSBmaXhlcyBpdHMgbGV2ZWxzIHRvIGl0LCBpdHMgb3duIFwie3sgcHJlc2V0V29yZCB9fVwiIHByZXNldCBkZWNpZGVzLlxuICAgICAgICA8L3A+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8IS0tIE93bmVyOiBmb3Igb2xkZXIgdG9vbHMgLS0+XG4gICAgICA8dGVtcGxhdGUgdi1pZj1cInNob3dzKCdvbGRlclRvb2xzJylcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBhLWd0XCI+XG4gICAgICAgICAgRm9yIG9sZGVyIHRvb2xzXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJwYS1saXN0XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLW9sZGVyLXRvb2xzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1yb3dcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGEtaWNvXCI+PGZyYW1lLWljb24gbmFtZT1cImtleVwiIC8+PC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgICA8Yj5Nb29ucmFrZXIgQVBJIGtleTwvYj5cbiAgICAgICAgICAgICAgPHNwYW4+Rm9yIHRvb2xzIHRoYXQgcHJlZGF0ZSBNdW9uM0QgYWNjb3VudHMuIEZ1bGwgYWNjZXNzLCBubyBlbmQgZGF0ZS4gVHVybmluZyBpdCBvZmYgaXNuJ3QgYXZhaWxhYmxlIHlldC48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbVwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwicGEtYXBpLWtleVwiXG4gICAgICAgICAgICAgIEBjbGljaz1cImFwaUtleU9wZW4gPSB0cnVlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgU2hvd1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC90ZW1wbGF0ZT5cblxuICAgICAgPCEtLSBPd25lcjogZGV2ZWxvcGVyIG1vZGUsIGFuZCB1bmxpbmsgLS0+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCJzaG93cygnZGV2ZWxvcGVyJykgfHwgc2hvd3MoJ3VubGluaycpXCJcbiAgICAgICAgY2xhc3M9XCJwYS1saXN0IHBhLWxhc3RcIlxuICAgICAgPlxuICAgICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgICB2LWlmPVwic2hvd3MoJ2RldmVsb3BlcicpXCJcbiAgICAgICAgICA6dG89XCJkZXZlbG9wZXJUb1wiXG4gICAgICAgICAgY2xhc3M9XCJwYS1yb3cgcGEtcm93LS1saW5rXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWRldmVsb3BlclwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhLWljb1wiPjxmcmFtZS1pY29uIG5hbWU9XCJjb2RlXCIgLz48L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgPGI+RGV2ZWxvcGVyIG1vZGU8L2I+XG4gICAgICAgICAgICA8c3Bhbj57eyBkZXZlbG9wZXJMaW5lIH19PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxmcmFtZS1pY29uXG4gICAgICAgICAgICBuYW1lPVwiY2hldnJvblJpZ2h0XCJcbiAgICAgICAgICAgIHNtYWxsXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJzaG93cygndW5saW5rJylcIlxuICAgICAgICAgIGNsYXNzPVwicGEtcm93XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLXVubGlua1wiXG4gICAgICAgID5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBhLWljbyBwYS1pY28tLXJlZFwiPjxmcmFtZS1pY29uIG5hbWU9XCJsaW5rXCIgLz48L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBhLXJvd19fdGV4dFwiPlxuICAgICAgICAgICAgPGIgY2xhc3M9XCJwYS1yZWRcIj5Vbmxpbmsge3sgYWNjb3VudFByaW50ZXJOYW1lIH19IGZyb20geW91ciBhY2NvdW50PC9iPlxuICAgICAgICAgICAgPHNwYW4+RXZlcnlvbmUgeW91IHNoYXJlIGl0IHdpdGggbG9zZXMgYWNjZXNzLiBJdCBrZWVwcyB3b3JraW5nIG9uIHlvdXIgbmV0d29yay48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cImxpYi1idG4gbGliLWJ0bi0tc20gbGliLWJ0bi0tZGFuZ2VyXCJcbiAgICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS11bmxpbmstYnV0dG9uXCJcbiAgICAgICAgICAgIEBjbGljaz1cInVubGlua1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgVW5saW5r4oCmXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWVtYmVyOiBsZWF2ZSAtLT5cbiAgICAgIDx0ZW1wbGF0ZSB2LWlmPVwic2hvd3MoJ2xlYXZlJylcIj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwicGEtbGlzdFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS1sZWF2ZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtcm93X190ZXh0XCI+XG4gICAgICAgICAgICAgIDxiIGNsYXNzPVwicGEtcmVkXCI+TGVhdmUge3sgYWNjb3VudFByaW50ZXJOYW1lIH19PC9iPlxuICAgICAgICAgICAgICA8c3BhbiB2LWlmPVwiIXNoYXJlSWRcIj5MZWF2aW5nIGZyb20gaGVyZSBpc24ndCBhdmFpbGFibGUgeWV0IGZvciB0aGlzIHByaW50ZXIuPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHYtaWY9XCJzaGFyZUlkXCJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbSBsaWItYnRuLS1kYW5nZXJcIlxuICAgICAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICAgICAgZGF0YS10aWQ9XCJwYS1sZWF2ZS1idXR0b25cIlxuICAgICAgICAgICAgICBAY2xpY2s9XCJsZWF2ZVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIExlYXZl4oCmXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3RlbXBsYXRlPlxuXG4gICAgICA8cFxuICAgICAgICB2LWlmPVwidmlld2VyICE9PSAnb3duZXInXCJcbiAgICAgICAgY2xhc3M9XCJwYS1sb2NrXCJcbiAgICAgICAgZGF0YS10aWQ9XCJwYS1sb2NrXCJcbiAgICAgID5cbiAgICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgICBuYW1lPVwibG9ja1wiXG4gICAgICAgICAgc21hbGxcbiAgICAgICAgLz5cbiAgICAgICAge3sgbG9ja0xpbmUgfX1cbiAgICAgIDwvcD5cbiAgICA8L3RlbXBsYXRlPlxuXG4gICAgPHBcbiAgICAgIHYtaWY9XCJzaWduSW5IaW50XCJcbiAgICAgIGNsYXNzPVwicGFfX25vdGVcIlxuICAgICAgZGF0YS10aWQ9XCJwYS1zaWduLWluXCJcbiAgICA+XG4gICAgICBTaWduIGluIHRvIG1hbmFnZSBwZW9wbGUgb24ge3sgcHJpbnRlck5hbWUgfX06IHdobydzIGluLCBpbnZpdGVzIGFuZCBsaW5rcyBhcmUga2VwdCB3aXRoIHRoZSBvd25lcidzIGFjY291bnQuXG4gICAgICA8cm91dGVyLWxpbmtcbiAgICAgICAgdG89XCIvc2lnbi1pblwiXG4gICAgICAgIGNsYXNzPVwicGEtbG5rXCJcbiAgICAgID5cbiAgICAgICAgU2lnbiBpblxuICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICA8L3A+XG5cbiAgICA8cFxuICAgICAgdi1pZj1cIm1lc3NhZ2VcIlxuICAgICAgY2xhc3M9XCJwYV9fbm90ZVwiXG4gICAgICByb2xlPVwic3RhdHVzXCJcbiAgICAgIGRhdGEtdGlkPVwicGEtbWVzc2FnZVwiXG4gICAgPlxuICAgICAge3sgbWVzc2FnZSB9fVxuICAgIDwvcD5cblxuICAgIDxtMy1kaWFsb2dcbiAgICAgIDp2YWx1ZT1cImRpYWxvZyA9PT0gJ2ludml0ZSdcIlxuICAgICAgOnRpdGxlPVwiYEludml0ZSBzb21lb25lIHRvICR7YWNjb3VudFByaW50ZXJOYW1lfWBcIlxuICAgICAgOnBlcnNpc3RlbnQ9XCJidXN5XCJcbiAgICAgIG1heC13aWR0aD1cIjQ2MFwiXG4gICAgICBAY2xvc2U9XCJkaWFsb2cgPSAnJ1wiXG4gICAgPlxuICAgICAgPHAgY2xhc3M9XCJtMy1kbGdfX3RleHRcIj5cbiAgICAgICAge3sgaW52aXRlTW9kZSA9PT0gJ2VtYWlsJyA/ICdCeSBlbWFpbDogaXQgYXBwZWFycyBpbiB0aGVpciBhY2NvdW50LCBhbmQgeW91IGNhbiB0YWtlIGl0IGJhY2sgYW55IHRpbWUuJyA6ICdTaGFyZSBhIGxpbms6IGFueW9uZSB3aXRoIGl0IGNhbiBqb2luIHVudGlsIGl0IHJ1bnMgb3V0LCBhbmQgeW91IGNhbiBlbmQgaXQgYW55IHRpbWUuJyB9fVxuICAgICAgPC9wPlxuICAgICAgPHNwYW5cbiAgICAgICAgY2xhc3M9XCJwYS1zZWcgcGEtc2VnLS1kbGdcIlxuICAgICAgICByb2xlPVwiZ3JvdXBcIlxuICAgICAgICBhcmlhLWxhYmVsPVwiSG93XCJcbiAgICAgID5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ3BhLXNlZy0tb24nOiBpbnZpdGVNb2RlID09PSAnZW1haWwnIH1cIlxuICAgICAgICAgIDphcmlhLXByZXNzZWQ9XCJpbnZpdGVNb2RlID09PSAnZW1haWwnID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS1pbnZpdGUtZW1haWwtdGFiXCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICBAY2xpY2s9XCJpbnZpdGVNb2RlID0gJ2VtYWlsJ1wiXG4gICAgICAgID5FbWFpbDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgOmNsYXNzPVwieyAncGEtc2VnLS1vbic6IGludml0ZU1vZGUgPT09ICdsaW5rJyB9XCJcbiAgICAgICAgICA6YXJpYS1wcmVzc2VkPVwiaW52aXRlTW9kZSA9PT0gJ2xpbmsnID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS1pbnZpdGUtbGluay10YWJcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3lcIlxuICAgICAgICAgIEBjbGljaz1cImludml0ZU1vZGUgPSAnbGluaydcIlxuICAgICAgICA+TGluazwvYnV0dG9uPlxuICAgICAgPC9zcGFuPlxuICAgICAgPHRlbXBsYXRlIHYtaWY9XCJpbnZpdGVNb2RlID09PSAnbGluaydcIj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHYtaWY9XCJtYWRlTGlua1wiXG4gICAgICAgICAgY2xhc3M9XCJtMy1maWVsZFwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJwYS1saW5rLW1hZGVcIlxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fbGFiZWxcIj5Zb3VyIGxpbms8L3NwYW4+XG4gICAgICAgICAgPGJcbiAgICAgICAgICAgIGNsYXNzPVwicGEtbW9ub1wiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInBhLWxpbmstbWFkZS11cmxcIlxuICAgICAgICAgID57eyBtYWRlTGluay51cmwgfX08L2I+XG4gICAgICAgICAgPHAgY2xhc3M9XCJwYV9fbXV0ZWRcIj5cbiAgICAgICAgICAgIHt7IGxpbmtMaW5lKG1hZGVMaW5rKSB9fVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwibGliLWJ0biBsaWItYnRuLS1zbVwiXG4gICAgICAgICAgICBkYXRhLXRpZD1cInBhLWxpbmstbWFkZS1jb3B5XCJcbiAgICAgICAgICAgIEBjbGljaz1cImNvcHkobWFkZUxpbmsudXJsIHx8ICcnKVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQ29weSBsaW5rXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dGVtcGxhdGUgdi1lbHNlPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtMy1maWVsZFwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fbGFiZWxcIj5MaW5rIGxhc3RzPC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhLW9wdFwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdi1mb3I9XCJvIGluIExJTktfTEFTVFNcIlxuICAgICAgICAgICAgICAgIDprZXk9XCJvLnZhbHVlXCJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICA6Y2xhc3M9XCJ7ICdwYS1vcHQtLW9uJzogbGlua0Zvcm0ubGlmZXRpbWUgPT09IG8udmFsdWUgfVwiXG4gICAgICAgICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImxpbmtGb3JtLmxpZmV0aW1lID09PSBvLnZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJ1wiXG4gICAgICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHBhLWxpbmstbGFzdHMtJHtvLnZhbHVlfWBcIlxuICAgICAgICAgICAgICAgIEBjbGljaz1cImxpbmtGb3JtLmxpZmV0aW1lID0gby52YWx1ZVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Yj57eyBvLmxhYmVsIH19PC9iPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtMy1maWVsZFwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fbGFiZWxcIj5QZW9wbGUgd2hvIGNhbiB1c2UgaXQ8L3NwYW4+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGEtb3B0XCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB2LWZvcj1cIm8gaW4gTElOS19VU0VTXCJcbiAgICAgICAgICAgICAgICA6a2V5PVwiby5sYWJlbFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgOmNsYXNzPVwieyAncGEtb3B0LS1vbic6IGxpbmtGb3JtLm1heFVzZXMgPT09IG8udmFsdWUgfVwiXG4gICAgICAgICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImxpbmtGb3JtLm1heFVzZXMgPT09IG8udmFsdWUgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgcGEtbGluay11c2VzLSR7by52YWx1ZSA9PT0gbnVsbCA/ICdhbnknIDogby52YWx1ZX1gXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJsaW5rRm9ybS5tYXhVc2VzID0gby52YWx1ZVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Yj57eyBvLmxhYmVsIH19PC9iPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtMy1maWVsZFwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fbGFiZWxcIj5UaGV5IGNhbjwvc3Bhbj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYS1vcHRcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHYtZm9yPVwicm9sZSBpbiBbJ29wZXJhdG9yJywgJ3ZpZXdlciddXCJcbiAgICAgICAgICAgICAgICA6a2V5PVwicm9sZVwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgOmNsYXNzPVwieyAncGEtb3B0LS1vbic6IGxpbmtGb3JtLnJvbGUgPT09IHJvbGUgfVwiXG4gICAgICAgICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImxpbmtGb3JtLnJvbGUgPT09IHJvbGUgPyAndHJ1ZScgOiAnZmFsc2UnXCJcbiAgICAgICAgICAgICAgICA6ZGF0YS10aWQ9XCJgcGEtbGluay1yb2xlLSR7cm9sZX1gXCJcbiAgICAgICAgICAgICAgICBAY2xpY2s9XCJsaW5rRm9ybS5yb2xlID0gcm9sZVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Yj57eyByb2xlV29yZChyb2xlKSB9fTwvYj48c3Bhbj57eyByb2xlID09PSAnb3BlcmF0b3InID8gJ1ByaW50LCBoZWF0IGFuZCBtb3ZlJyA6ICdXYXRjaCBvbmx5JyB9fTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJwYS1jaGVja1wiPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHYtbW9kZWw9XCJsaW5rRm9ybS5hcHByb3ZlRWFjaFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgIGRhdGEtdGlkPVwicGEtbGluay1hcHByb3ZlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgIEFwcHJvdmUgZWFjaCBwZXJzb246IHlvdSBsZXQgdGhlbSBpbiBiZWZvcmUgdGhleSBqb2luXG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8bGFiZWxcbiAgICAgICAgdi1pZj1cImludml0ZU1vZGUgPT09ICdlbWFpbCdcIlxuICAgICAgICBjbGFzcz1cIm0zLWZpZWxkXCJcbiAgICAgID5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fbGFiZWxcIj5FbWFpbDwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fYm94XCI+PGlucHV0XG4gICAgICAgICAgdi1tb2RlbD1cImZvcm0uZW1haWxcIlxuICAgICAgICAgIHR5cGU9XCJlbWFpbFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIkVtYWlsXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWludml0ZS1lbWFpbFwiXG4gICAgICAgID48L3NwYW4+XG4gICAgICA8L2xhYmVsPlxuICAgICAgPGRpdlxuICAgICAgICB2LWlmPVwiaW52aXRlTW9kZSA9PT0gJ2VtYWlsJ1wiXG4gICAgICAgIGNsYXNzPVwibTMtZmllbGRcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm0zLWZpZWxkX19sYWJlbFwiPlRoZXkgY2FuPC9zcGFuPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGEtb3B0XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdi1mb3I9XCJyb2xlIGluIFsnb3BlcmF0b3InLCAndmlld2VyJ11cIlxuICAgICAgICAgICAgOmtleT1cInJvbGVcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICA6Y2xhc3M9XCJ7ICdwYS1vcHQtLW9uJzogZm9ybS5yb2xlID09PSByb2xlIH1cIlxuICAgICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImZvcm0ucm9sZSA9PT0gcm9sZSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgICAgOmRhdGEtdGlkPVwiYHBhLWludml0ZS0ke3JvbGV9YFwiXG4gICAgICAgICAgICBAY2xpY2s9XCJmb3JtLnJvbGUgPSByb2xlXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Yj57eyByb2xlV29yZChyb2xlKSB9fTwvYj48c3Bhbj57eyByb2xlID09PSAnb3BlcmF0b3InID8gJ1ByaW50LCBoZWF0IGFuZCBtb3ZlJyA6ICdXYXRjaCBvbmx5JyB9fTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxsYWJlbFxuICAgICAgICB2LWlmPVwiaW52aXRlTW9kZSA9PT0gJ2VtYWlsJ1wiXG4gICAgICAgIGNsYXNzPVwibTMtZmllbGRcIlxuICAgICAgPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm0zLWZpZWxkX19sYWJlbFwiPkFjY2VzcyBlbmRzIDxzcGFuIGNsYXNzPVwicGFfX211dGVkXCI+KGxlYXZlIGVtcHR5IGZvciBuZXZlcik8L3NwYW4+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIm0zLWZpZWxkX19ib3hcIj48aW5wdXRcbiAgICAgICAgICB2LW1vZGVsPVwiZm9ybS51bnRpbFwiXG4gICAgICAgICAgdHlwZT1cImRhdGVcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJBY2Nlc3MgZW5kc1wiXG4gICAgICAgID48L3NwYW4+XG4gICAgICA8L2xhYmVsPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cImRpYWxvZ0Vycm9yXCJcbiAgICAgICAgY2xhc3M9XCJtMy1kbGdfX2Vycm9yXCJcbiAgICAgICAgcm9sZT1cImFsZXJ0XCJcbiAgICAgID5cbiAgICAgICAge3sgZGlhbG9nRXJyb3IgfX1cbiAgICAgIDwvcD5cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgQGNsaWNrPVwiZGlhbG9nID0gJydcIlxuICAgICAgICA+XG4gICAgICAgICAge3sgbWFkZUxpbmsgPyAnRG9uZScgOiAnQ2FuY2VsJyB9fVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtaWY9XCJpbnZpdGVNb2RlID09PSAnZW1haWwnXCJcbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjbGFzcz1cImNidG4gY2J0bi0tcHJpbWFyeVwiXG4gICAgICAgICAgOmRpc2FibGVkPVwiIWZvcm0uZW1haWwuaW5jbHVkZXMoJ0AnKSB8fCBidXN5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWludml0ZS1zZW5kXCJcbiAgICAgICAgICBAY2xpY2s9XCJpbnZpdGVcIlxuICAgICAgICA+XG4gICAgICAgICAgU2VuZCBpbnZpdGVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWVsc2UtaWY9XCIhbWFkZUxpbmtcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1wcmltYXJ5XCJcbiAgICAgICAgICA6ZGlzYWJsZWQ9XCJidXN5XCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLWxpbmstbWFrZVwiXG4gICAgICAgICAgQGNsaWNrPVwibWFrZUxpbmtcIlxuICAgICAgICA+XG4gICAgICAgICAgTWFrZSBsaW5rXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L20zLWRpYWxvZz5cblxuICAgIDxtMy1kaWFsb2dcbiAgICAgIDp2YWx1ZT1cImRpYWxvZyA9PT0gJ3JvbGUnXCJcbiAgICAgIHRpdGxlPVwiQ2hhbmdlIHJvbGVcIlxuICAgICAgOnBlcnNpc3RlbnQ9XCJidXN5XCJcbiAgICAgIEBjbG9zZT1cImRpYWxvZyA9ICcnXCJcbiAgICA+XG4gICAgICA8cCBjbGFzcz1cIm0zLWRsZ19fdGV4dFwiPlxuICAgICAgICBXaGF0IHt7IGNoYW5naW5nICYmIGNoYW5naW5nLmVtYWlsIH19IGNhbiBkbyBvbiB7eyBhY2NvdW50UHJpbnRlck5hbWUgfX0sIGFuZCB3aGVuIGl0IGVuZHMuXG4gICAgICA8L3A+XG4gICAgICA8ZGl2IGNsYXNzPVwicGEtb3B0XCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWZvcj1cInJvbGUgaW4gWydvcGVyYXRvcicsICd2aWV3ZXInXVwiXG4gICAgICAgICAgOmtleT1cInJvbGVcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIDpjbGFzcz1cInsgJ3BhLW9wdC0tb24nOiBmb3JtLnJvbGUgPT09IHJvbGUgfVwiXG4gICAgICAgICAgOmFyaWEtcHJlc3NlZD1cImZvcm0ucm9sZSA9PT0gcm9sZSA/ICd0cnVlJyA6ICdmYWxzZSdcIlxuICAgICAgICAgIDpkYXRhLXRpZD1cImBwYS1yb2xlLSR7cm9sZX1gXCJcbiAgICAgICAgICBAY2xpY2s9XCJmb3JtLnJvbGUgPSByb2xlXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxiPnt7IHJvbGVXb3JkKHJvbGUpIH19PC9iPjxzcGFuPnt7IHJvbGUgPT09ICdvcGVyYXRvcicgPyAnUHJpbnQsIGhlYXQgYW5kIG1vdmUnIDogJ1dhdGNoIG9ubHknIH19PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGxhYmVsIGNsYXNzPVwibTMtZmllbGRcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fbGFiZWxcIj5BY2Nlc3MgZW5kcyA8c3BhbiBjbGFzcz1cInBhX19tdXRlZFwiPihsZWF2ZSBlbXB0eSBmb3IgbmV2ZXIpPC9zcGFuPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJtMy1maWVsZF9fYm94XCI+PGlucHV0XG4gICAgICAgICAgdi1tb2RlbD1cImZvcm0udW50aWxcIlxuICAgICAgICAgIHR5cGU9XCJkYXRlXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiQWNjZXNzIGVuZHNcIlxuICAgICAgICAgIGRhdGEtdGlkPVwicGEtcm9sZS11bnRpbFwiXG4gICAgICAgID48L3NwYW4+XG4gICAgICA8L2xhYmVsPlxuICAgICAgPHBcbiAgICAgICAgdi1pZj1cImRpYWxvZ0Vycm9yXCJcbiAgICAgICAgY2xhc3M9XCJtMy1kbGdfX2Vycm9yXCJcbiAgICAgICAgcm9sZT1cImFsZXJ0XCJcbiAgICAgID5cbiAgICAgICAge3sgZGlhbG9nRXJyb3IgfX1cbiAgICAgIDwvcD5cbiAgICAgIDx0ZW1wbGF0ZSAjYWN0aW9ucz5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiY2J0biBjYnRuLS1naG9zdFwiXG4gICAgICAgICAgQGNsaWNrPVwiZGlhbG9nID0gJydcIlxuICAgICAgICA+XG4gICAgICAgICAgQ2FuY2VsXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJjYnRuIGNidG4tLXByaW1hcnlcIlxuICAgICAgICAgIDpkaXNhYmxlZD1cImJ1c3kgfHwgIWNoYW5naW5nIHx8IChmb3JtLnJvbGUgPT09IGNoYW5naW5nLnJvbGUgJiYgcm9sZUVuZHMoY2hhbmdpbmcpID09PSBjaGFuZ2luZy5lbmRzQXQpXCJcbiAgICAgICAgICBkYXRhLXRpZD1cInBhLXJvbGUtc2F2ZVwiXG4gICAgICAgICAgQGNsaWNrPVwiY2hhbmdlUm9sZVwiXG4gICAgICAgID5cbiAgICAgICAgICBTYXZlXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L20zLWRpYWxvZz5cblxuICAgIDxhcGkta2V5LWRpYWxvZ1xuICAgICAgdi1pZj1cImFwaUtleU9wZW5cIlxuICAgICAgdi1tb2RlbD1cImFwaUtleU9wZW5cIlxuICAgIC8+XG5cbiAgICA8YWNjZXNzLXJlcXVlc3QtZGlhbG9nXG4gICAgICB2LWlmPVwiYXNraW5nT3BlbiAmJiBhc2tpbmdcIlxuICAgICAgdi1tb2RlbD1cImFza2luZ09wZW5cIlxuICAgICAgOmNsaWVudD1cImNsaWVudFwiXG4gICAgICA6YXNrPVwiYXNraW5nXCJcbiAgICAgIDpwcmludGVyLW5hbWU9XCJwcmludGVyTmFtZVwiXG4gICAgICBAYW5zd2VyZWQ9XCJyZWZyZXNoXCJcbiAgICAvPlxuICA8L3NlY3Rpb24+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0IGxhbmc9XCJ0c1wiPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBNaXhpbnMsIFdhdGNoIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBNdW9uR2F0ZXNNaXhpbiBmcm9tICdAL21peGlucy9tdW9uLWdhdGVzJ1xuaW1wb3J0IE0zRGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy91aS9NM0RpYWxvZy52dWUnXG5pbXBvcnQgVG9nZ2xlU3dpdGNoIGZyb20gJ0AvY29tcG9uZW50cy9jb250cm9sL1RvZ2dsZVN3aXRjaC52dWUnXG5pbXBvcnQgQXBpS2V5RGlhbG9nIGZyb20gJ0AvY29tcG9uZW50cy9zZXR0aW5ncy9hdXRoL0FwaUtleURpYWxvZy52dWUnXG5pbXBvcnQgQWNjZXNzUmVxdWVzdERpYWxvZyBmcm9tICdAL2NvbXBvbmVudHMvbXVvbi1hY2Nlc3MvQWNjZXNzUmVxdWVzdERpYWxvZy52dWUnXG5pbXBvcnQgeyBjb25uZWN0ZWRFbmRwb2ludElkLCBzYW1lRW5kcG9pbnQgfSBmcm9tICdAL3NlcnZpY2VzL3Blb3BsZS1hY2Nlc3MvaWRlbnRpdHknXG5pbXBvcnQge1xuICBjdXJyZW50UHJpbnRlckFjY2VzcyxcbiAgdHlwZSBBY2Nlc3NBc2ssXG4gIHR5cGUgQWNjZXNzRW50cnksXG4gIHR5cGUgQWNjZXNzU3RhdGUsXG4gIHR5cGUgRGF0YU1vZGUsXG4gIHR5cGUgQ2FwYWJpbGl0eVxufSBmcm9tICdAL3NlcnZpY2VzL211b24tYWNjZXNzL2FwaSdcbmltcG9ydCB7IGNsb3VkQXBpLCB0eXBlIENsb3VkUHJpbnRlciB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9hcGknXG5pbXBvcnQgeyBjbG91ZFN0YXRlLCByZWZyZXNoUHJpbnRlcnMgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgcmVtb3RlUm91dGVMYWJlbCB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1ibGUvbGluaydcbmltcG9ydCB7IG5ldHdvcmtSb3V0ZUxhYmVsIH0gZnJvbSAnQC9zZXJ2aWNlcy9ob3RzcG90L21vZGVsJ1xuaW1wb3J0IHsgYWNjb3VudEFwaSwgdHlwZSBJbnZpdGVMaW5rLCB0eXBlIEpvaW5BcHByb3ZhbCwgdHlwZSBQcmludGVySW52aXRlLCB0eXBlIFByaW50ZXJTaGFyZSB9IGZyb20gJ0Avc2VydmljZXMvYWNjb3VudC9hcGknXG5pbXBvcnQgeyBhY2NvdW50U3RhdGUsIGRlc2NyaWJlLCBsb2FkQXBwcm92YWxzIH0gZnJvbSAnQC9zZXJ2aWNlcy9hY2NvdW50L3N0YXRlJ1xuaW1wb3J0IHsgaXNNaXNzaW5nIH0gZnJvbSAnQC9zZXJ2aWNlcy9hY2NvdW50L2NsaWVudCdcbmltcG9ydCB7IGRheVRleHQgfSBmcm9tICdAL3NlcnZpY2VzL2FjY291bnQvbW9kZWwnXG5pbXBvcnQgeyBvd25BdmF0YXIsIHB1YmxpY0F2YXRhclVybCB9IGZyb20gJ0Avc2VydmljZXMvYWNjb3VudC9hdmF0YXInXG5pbXBvcnQgUGhvdG9GYWNlIGZyb20gJ0AvY29tcG9uZW50cy9hY2NvdW50L3Byb2ZpbGUvUGhvdG9GYWNlLnZ1ZSdcbmltcG9ydCB7IGFjdGl2ZVNsdWcgfSBmcm9tICdAL3NlcnZpY2VzL3ByaW50ZXItcGFnZXMnXG5pbXBvcnQgeyBjdXJyZW50UHJpbnRlck5ld0RldmljZXMgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYWNjZXNzL25ld0RldmljZXMnXG5pbXBvcnQgeyBwcmludGVyTmFtZVBhcnRzIH0gZnJvbSAnQC91dGlsL3ByaW50ZXItbmFtZSdcbmltcG9ydCB0eXBlIHsgSW5zdGFuY2VDb25maWcgfSBmcm9tICdAL3N0b3JlL2NvbmZpZy90eXBlcydcbmltcG9ydCB7XG4gIFJPTEVfVEFCTEUsXG4gIFJPTEVfV09SRFMsXG4gIGFjY2Vzc1ZpZXdlcixcbiAgYWNjb3VudEFjY2Vzc1BhdGgsXG4gIHByaW50ZXJHcm91cHMsXG4gIHJvbGVTdW1tYXJ5LFxuICB0eXBlIEFjY2Vzc1ZpZXdlcixcbiAgdHlwZSBBY2NvdW50QWNjZXNzU2VjdGlvbixcbiAgdHlwZSBQcmludGVyR3JvdXAsXG4gIHR5cGUgUm9sZVJvd1xufSBmcm9tICdAL3NlcnZpY2VzL3Blb3BsZS1hY2Nlc3MvbW9kZWwnXG5pbXBvcnQgJ0Avc2Nzcy9tdW9uM2QtYWNjb3VudC5zY3NzJ1xuXG5pbnRlcmZhY2UgUGVyc29uUm93IHtcbiAgaWQ6IHN0cmluZztcbiAgZW1haWw6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBwaG90bzogc3RyaW5nIHwgbnVsbDtcbiAgbGV0dGVyOiBzdHJpbmc7XG4gIHJvbGU6IHN0cmluZztcbiAgZW5kc0F0OiBudW1iZXIgfCBudWxsO1xuICBsaW5lOiBzdHJpbmc7XG59XG5cbmNvbnN0IFBSRVNFVF9XT1JEUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgcmVsYXhlZDogJ1JlbGF4ZWQnLCBzdGFuZGFyZDogJ1N0YW5kYXJkJywgc3RyaWN0OiAnU3RyaWN0JyB9XG5cbi8qKlxuICogU2V0dGluZ3Mg4oC6IFBlb3BsZSBhbmQgYWNjZXNzIG9uIGEgTXVvbiBwcmludGVyIChDb250cm9sIHYzLFxuICogUEVPUExFLUFDQ0VTUy5tZCwgYGFjY2Vzcy1wcmludGVyYCk6IHRoZSBvd25lciwgdGhlIHBlb3BsZSBhbmQgd2hhdCBlYWNoXG4gKiByb2xlIGNhbiBkbywgdGhlIGpvaW4gcmVxdWVzdHMsIGludml0ZXMgYW5kIGxpbmtzIHdhaXRpbmcsIHRoZSBlbnRyeSBhbmRcbiAqIGZpbGUgcnVsZXMsIHRoZSBvbGRlci10b29scyBrZXksIGRldmVsb3BlciBtb2RlJ3Mgcm93IGFuZCBVbmxpbmsuIEEgbWVtYmVyXG4gKiBzZWVzIHRoZWlyIG93biByb2xlLCB3aGF0IHRoZXkgY2FuIGRvIGFuZCBMZWF2ZTsgdGhlIG93bmVyJ3MgZ3JvdXBzIGFyZVxuICogaGlkZGVuIGZyb20gdGhlbSwgbm90IGdyZXllZC5cbiAqXG4gKiBOb3RoaW5nIGhlcmUgZGVjaWRlcyB3aG8gbWF5IGRvIHdoYXQuIFdoYXQgdGhpcyBicm93c2VyIGlzIGNvbWVzIGZyb20gdGhlXG4gKiBwcmludGVyIChgbXVvbl9hY2Nlc3NgIGNhcGFiaWxpdGllcykgYW5kIHRoZW4gdGhlIGNvbnNvbGU7IGV2ZXJ5IGNoYW5nZSBpc1xuICogdGhlIHByaW50ZXIncyBvciB0aGUgY29uc29sZSdzIG93biBjYWxsLCB3aGljaCByZWZ1c2VzIHdoYXQgaXQgbXVzdC5cbiAqL1xuQENvbXBvbmVudCh7IGNvbXBvbmVudHM6IHsgTTNEaWFsb2csIFRvZ2dsZVN3aXRjaCwgQXBpS2V5RGlhbG9nLCBBY2Nlc3NSZXF1ZXN0RGlhbG9nLCBQaG90b0ZhY2UgfSB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGVvcGxlQWNjZXNzU2V0dGluZ3MgZXh0ZW5kcyBNaXhpbnMoTXVvbkdhdGVzTWl4aW4pIHtcbiAgY2xpZW50ID0gY3VycmVudFByaW50ZXJBY2Nlc3MoKVxuICBzdGF0ZTogQWNjZXNzU3RhdGUgfCBudWxsID0gbnVsbFxuICBjYXBhYmlsaXRpZXM6IFJlY29yZDxzdHJpbmcsIENhcGFiaWxpdHk+ID0ge31cbiAgcHJpbnRlckVycm9yID0gJydcbiAgbG9hZGluZyA9IGZhbHNlXG4gIGJ1c3kgPSBmYWxzZVxuICBtZXNzYWdlID0gJydcbiAgZGlhbG9nOiAnJyB8ICdpbnZpdGUnIHwgJ3JvbGUnID0gJydcbiAgZGlhbG9nRXJyb3IgPSAnJ1xuICBmb3JtID0geyBlbWFpbDogJycsIHJvbGU6ICd2aWV3ZXInLCB1bnRpbDogJycgfVxuICBpbnZpdGVNb2RlOiAnZW1haWwnIHwgJ2xpbmsnID0gJ2VtYWlsJ1xuICBsaW5rRm9ybTogeyBsaWZldGltZTogJzFoJyB8ICcxZCcgfCAnN2QnIHwgJ25vbmUnLCBtYXhVc2VzOiAxIHwgNSB8IDI1IHwgbnVsbCwgcm9sZTogc3RyaW5nLCBhcHByb3ZlRWFjaDogYm9vbGVhbiB9ID0geyBsaWZldGltZTogJzFkJywgbWF4VXNlczogbnVsbCwgcm9sZTogJ3ZpZXdlcicsIGFwcHJvdmVFYWNoOiBmYWxzZSB9XG4gIG1hZGVMaW5rOiBJbnZpdGVMaW5rIHwgbnVsbCA9IG51bGxcbiAgcmVhZG9ubHkgTElOS19MQVNUUyA9IFtcbiAgICB7IHZhbHVlOiAnMWgnLCBsYWJlbDogJzEgaG91cicgfSwgeyB2YWx1ZTogJzFkJywgbGFiZWw6ICcxIGRheScgfSwgeyB2YWx1ZTogJzdkJywgbGFiZWw6ICc3IGRheXMnIH0sIHsgdmFsdWU6ICdub25lJywgbGFiZWw6ICdVbnRpbCBJIGVuZCBpdCcgfVxuICBdIGFzIGNvbnN0XG5cbiAgcmVhZG9ubHkgTElOS19VU0VTID0gW1xuICAgIHsgdmFsdWU6IDEsIGxhYmVsOiAnMSBwZXJzb24nIH0sIHsgdmFsdWU6IDUsIGxhYmVsOiAnNSBwZW9wbGUnIH0sIHsgdmFsdWU6IDI1LCBsYWJlbDogJzI1IHBlb3BsZScgfSwgeyB2YWx1ZTogbnVsbCwgbGFiZWw6ICdObyBsaW1pdCcgfVxuICBdIGFzIGNvbnN0XG5cbiAgY2hhbmdpbmc6IFBlcnNvblJvdyB8IG51bGwgPSBudWxsXG4gIHNoYXJlczogUHJpbnRlclNoYXJlW10gPSBbXVxuICBpbnZpdGVzOiBQcmludGVySW52aXRlW10gPSBbXVxuICBsaW5rczogSW52aXRlTGlua1tdID0gW11cbiAgYXBpS2V5T3BlbiA9IGZhbHNlXG4gIHJlbmRlcktleSA9IDBcbiAgLyoqIFRoZSBFbmRwb2ludElkIHRoZSBjb25uZWN0ZWQgcHJpbnRlciByZXBvcnRzIGFib3V0IGl0c2VsZiwgcmVhZCB3aXRoIHRoZSByZXN0LiAqL1xuICByZXBvcnRlZEVuZHBvaW50OiBzdHJpbmcgfCBudWxsID0gbnVsbFxuICAvKiogV2hhdCB0aGUgcHJpbnRlciBob2xkcyBmb3IgXCJBbGxvdyBuZXcgZGV2aWNlcyB0byBhc2tcIiAoSS0xNzApOyBudWxsIGhpZGVzIHRoZSBzd2l0Y2guICovXG4gIGFjY2VwdFJlcXVlc3RzOiBib29sZWFuIHwgbnVsbCA9IG51bGxcbiAgbmV3RGV2aWNlcyA9IGN1cnJlbnRQcmludGVyTmV3RGV2aWNlcygpXG4gIGFza2luZzogQWNjZXNzQXNrIHwgbnVsbCA9IG51bGxcbiAgLyoqIFRoZSBhc2sgZGlhbG9nIGlzIG1vdW50ZWQgb25seSB3aGlsZSBvcGVuLCBzbyBjbG9zaW5nIGl0IHdpdGhkcmF3cyB0aGUgcmVxdWVzdC4gKi9cbiAgYXNraW5nT3BlbiA9IGZhbHNlXG5cbiAgbW91bnRlZCAoKSB7XG4gICAgdGhpcy5yZWZyZXNoKClcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGljaCBwcmludGVyIHRoZSBhbnN3ZXJzIGJlbG9uZyB0by4gRXZlcnl0aGluZyByZWFkIGlzIHRoYXQgcHJpbnRlcidzOlxuICAgKiBhIHN3aXRjaCB0byBhbm90aGVyIHByaW50ZXIsIG9yIGEgcmVjb25uZWN0LCBkcm9wcyBpdCBhbmQgcmVhZHMgYWdhaW4sIGFuZFxuICAgKiBhbiBhbnN3ZXIgdGhhdCBhcnJpdmVzIGZvciB0aGUgcHJldmlvdXMgcHJpbnRlciBpcyBpZ25vcmVkLlxuICAgKi9cbiAgZ2V0IHByaW50ZXJLZXkgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwgPz8gJyd9fCR7dGhpcy5jbG91ZFByaW50ZXJJZCA/PyAnJ31gXG4gIH1cblxuICBAV2F0Y2goJ3ByaW50ZXJLZXknKVxuICBvblByaW50ZXJDaGFuZ2UgKCkge1xuICAgIHRoaXMuZm9yZ2V0KClcbiAgICB0aGlzLnJlZnJlc2goKVxuICB9XG5cbiAgQFdhdGNoKCdzb2NrZXRDb25uZWN0ZWQnKVxuICBvblJlY29ubmVjdCAoY29ubmVjdGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGNvbm5lY3RlZCkgdGhpcy5yZWZyZXNoKClcbiAgICBlbHNlIHRoaXMuZm9yZ2V0KClcbiAgfVxuXG4gIC8qKiBOb3RoaW5nIGtub3duOiBubyBvd25lciwgcm9sZSwgcnVsZXMgb3IgbGlzdHMsIHNvIG5vdGhpbmcgb3duZXItb25seSBzaG93cy4gKi9cbiAgZm9yZ2V0ICgpIHtcbiAgICB0aGlzLnN0YXRlID0gbnVsbFxuICAgIHRoaXMuY2FwYWJpbGl0aWVzID0ge31cbiAgICB0aGlzLnJlcG9ydGVkRW5kcG9pbnQgPSBudWxsXG4gICAgdGhpcy5zaGFyZXMgPSBbXVxuICAgIHRoaXMuaW52aXRlcyA9IFtdXG4gICAgdGhpcy5saW5rcyA9IFtdXG4gICAgdGhpcy5kaWFsb2cgPSAnJ1xuICAgIHRoaXMuY2hhbmdpbmcgPSBudWxsXG4gICAgdGhpcy5hcGlLZXlPcGVuID0gZmFsc2VcbiAgICB0aGlzLmFza2luZ09wZW4gPSBmYWxzZVxuICAgIHRoaXMuYXNraW5nID0gbnVsbFxuICB9XG5cbiAgLyoqIFRoZSBhY2NvdW50J3MgbmFtZSBmb3IgdGhlIHByaW50ZXIgYWN0ZWQgb246IHdoYXQgZXZlcnkgY29uc29sZSBhY3Rpb24gYW5kIGl0cyBjb25maXJtIG5hbWVzLiAqL1xuICBnZXQgYWNjb3VudFByaW50ZXJOYW1lICgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNsb3VkUHJpbnRlcj8ubmFtZSA/PyB0aGlzLnByaW50ZXJOYW1lXG4gIH1cblxuICBnZXQgcHJpbnRlck5hbWUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByaW50ZXJOYW1lUGFydHModGhpcy4kc3RvcmUuZ2V0dGVyc1snY29uZmlnL2dldERpc3BsYXlOYW1lJ10gYXMgc3RyaW5nKS5uYW1lIHx8ICdUaGlzIHByaW50ZXInXG4gIH1cblxuICAvKiogVGhlIGFjY291bnQncyBwcmludGVyIEZsdWlkZCBpcyBvbjogdGhyb3VnaCBNdW9uM0QsIG9yIGEgc2F2ZWQgb25lIHRoYXQgc2FpZCBpdHMgRW5kcG9pbnRJZC4gKi9cbiAgZ2V0IGNsb3VkUHJpbnRlcklkICgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBhcGlVcmw6IHN0cmluZyA9IHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmxcbiAgICBpZiAoIWFwaVVybCkgcmV0dXJuIG51bGxcbiAgICBpZiAoaXNNYW5hZ2VkQXBpVXJsKGFwaVVybCkpIHJldHVybiBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZFxuICAgIGNvbnN0IGluc3RhbmNlcyA9ICh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuaW5zdGFuY2VzID8/IFtdKSBhcyBJbnN0YW5jZUNvbmZpZ1tdXG4gICAgcmV0dXJuIGluc3RhbmNlcy5maW5kKGkgPT4gaS5hcGlVcmwgPT09IGFwaVVybCk/LmVuZHBvaW50SWQgPz8gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBhY2NvdW50J3MgcmVjb3JkIG9mIHRoZSBwcmludGVyIGNvbm5lY3RlZCwgb25seSBvbmNlIHRoYXQgcHJpbnRlciBoYXNcbiAgICogc2FpZCBpdCBpcyB0aGF0IG9uZS4gVGhyb3VnaCBNdW9uM0QgdGhlIGNvbm5lY3Rpb24gaXMgdG8gdGhhdCBpZDsgb24gdGhlXG4gICAqIG5ldHdvcmsgYSBzYXZlZCBhZGRyZXNzIGNhbiBiZWxvbmcgdG8gYW5vdGhlciBwcmludGVyIG5vdyAoREhDUCksIHNvIHRoZVxuICAgKiBwcmludGVyJ3Mgb3duIEVuZHBvaW50SWQgbXVzdCBtYXRjaCwgb3IgdGhlIGNvbnNvbGUncyBncm91cHMgc3RheSBoaWRkZW5cbiAgICogYW5kIG5vdGhpbmcgaXMgc2VudCB0byB0aGUgd3JvbmcgcHJpbnRlcidzIHBlb3BsZS4gTmFtZXMgYXJlbid0IGNvbXBhcmVkOlxuICAgKiByZW5hbWluZyBpbiBBY2NvdW50IGRvZXNuJ3QgcmVuYW1lIHRoZSBwcmludGVyJ3Mgb3duIHNjcmVlbi5cbiAgICovXG4gIGdldCBjbG91ZFByaW50ZXIgKCk6IChDbG91ZFByaW50ZXIgJiB7IHNoYXJlX2lkPzogc3RyaW5nIH0pIHwgbnVsbCB7XG4gICAgaWYgKCFjbG91ZFN0YXRlLmFjY291bnQpIHJldHVybiBudWxsXG4gICAgY29uc3QgaWQgPSB0aGlzLmNsb3VkUHJpbnRlcklkXG4gICAgY29uc3QgcmVjb3JkID0gaWQgPyBjbG91ZFN0YXRlLnByaW50ZXJzLmZpbmQocCA9PiBwLmlkID09PSBpZCkgPz8gbnVsbCA6IG51bGxcbiAgICBpZiAoIXJlY29yZCkgcmV0dXJuIG51bGxcbiAgICBpZiAoaXNNYW5hZ2VkQXBpVXJsKHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwpKSByZXR1cm4gcmVjb3JkXG4gICAgcmV0dXJuIHNhbWVFbmRwb2ludChyZWNvcmQuaWQsIHRoaXMucmVwb3J0ZWRFbmRwb2ludCkgPyByZWNvcmQgOiBudWxsXG4gIH1cblxuICAvKiogT3duZXIsIG9wZXJhdG9yIG9yIHZpZXdlcjogdGhlIHByaW50ZXIncyBvd25lciBhbmQgeW91ciBsZXZlbCB0aGVyZSwgZWxzZSB0aGUgY29uc29sZS4gTmV2ZXIgZnJvbSBcIm1heSBtYW5hZ2UgYWNjZXNzXCIuICovXG4gIGdldCB2aWV3ZXIgKCk6IEFjY2Vzc1ZpZXdlciB8IG51bGwge1xuICAgIGNvbnN0IHByaW50ZXIgPSB0aGlzLnN0YXRlID8geyBvd25lcjogdGhpcy5zdGF0ZS5vd25lciwgbGV2ZWw6IHRoaXMuc3RhdGUueW91LmxldmVsLCByb2xlOiB0aGlzLnN0YXRlLnlvdS5yb2xlIH0gOiBudWxsXG4gICAgY29uc3QgY2xvdWQgPSB0aGlzLmNsb3VkUHJpbnRlciA/IHsgc2hhcmVkOiAhIXRoaXMuY2xvdWRQcmludGVyLnNoYXJlZCwgcm9sZTogdGhpcy5jbG91ZFByaW50ZXIucm9sZSB9IDogbnVsbFxuICAgIHJldHVybiBhY2Nlc3NWaWV3ZXIocHJpbnRlciwgY2xvdWQsIGNsb3VkU3RhdGUuYWNjb3VudD8uZW1haWwgPz8gbnVsbClcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcHJpbnRlciBsZXRzIHRoaXMgYnJvd3NlciBjaGFuZ2UgaXRzIHJ1bGVzIG5vdzogdGhlIHNoYXJlZCBnYXRlXG4gICAqIChgY2FuTWFuYWdlQWNjZXNzYCwgIzI5NikgYW5kIHRoaXMgcGFnZSdzIG93biByZWFkIGZvciB0aGlzIHByaW50ZXIgbXVzdFxuICAgKiBib3RoIHNheSB5ZXMuIFJlZnVzZWQsIGZhaWxlZCwgdW5rbm93biBvciBub3QgeWV0IGFza2VkIGlzIG5vLlxuICAgKi9cbiAgZ2V0IGNhbk1hbmFnZSAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY2FuTWFuYWdlQWNjZXNzID09PSB0cnVlICYmIHRoaXMuY2FwYWJpbGl0aWVzLnByb3RlY3Rpb24gPT09ICdhbGxvd2VkJ1xuICB9XG5cbiAgLyoqIFRoZSBjb25zb2xlJ3Mgb3duZXIgY2FsbHMgYXBwbHk6IGEgcHJpbnRlciB0aGlzIGFjY291bnQgbGlua2VkLiAqL1xuICBnZXQgY2xvdWRPd25lZCAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5jbG91ZFByaW50ZXIgJiYgIXRoaXMuY2xvdWRQcmludGVyLnNoYXJlZFxuICB9XG5cbiAgZ2V0IGFwcHJvdmFscyAoKTogSm9pbkFwcHJvdmFsW10ge1xuICAgIGNvbnN0IGlkID0gdGhpcy5jbG91ZFByaW50ZXI/LmlkXG4gICAgcmV0dXJuIChhY2NvdW50U3RhdGUuYXBwcm92YWxzID8/IFtdKS5maWx0ZXIoYSA9PiBhLnByaW50ZXJfaWQgPT09IGlkICYmIGEuc3RhdGUgPT09ICdwZW5kaW5nJylcbiAgfVxuXG4gIGdldCB3YWl0aW5nQ291bnQgKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYXBwcm92YWxzLmxlbmd0aCArIHRoaXMuaW52aXRlcy5sZW5ndGhcbiAgfVxuXG4gIGdldCBncm91cHMgKCk6IFByaW50ZXJHcm91cFtdIHtcbiAgICBpZiAoIXRoaXMudmlld2VyKSByZXR1cm4gW11cbiAgICByZXR1cm4gcHJpbnRlckdyb3Vwcyh0aGlzLnZpZXdlciwge1xuICAgICAgY2xvdWQ6IHRoaXMudmlld2VyID09PSAnb3duZXInID8gdGhpcy5jbG91ZE93bmVkIDogISF0aGlzLmNsb3VkUHJpbnRlcixcbiAgICAgIGNhbk1hbmFnZTogdGhpcy5jYW5NYW5hZ2UsXG4gICAgICB3YWl0aW5nOiB0aGlzLndhaXRpbmdDb3VudCxcbiAgICAgIGxpbmtzOiB0aGlzLmxpbmtzLmxlbmd0aCxcbiAgICAgIG9sZGVyVG9vbHM6IHRoaXMuJHN0b3JlLmdldHRlcnNbJ3NlcnZlci9jb21wb25lbnRTdXBwb3J0J10oJ2F1dGhvcml6YXRpb24nKSBhcyBib29sZWFuLFxuICAgICAgY2FuQXNrOiAhIXRoaXMuc3RhdGUgJiYgdGhpcy5jYXBhYmlsaXRpZXMucHJvdGVjdGlvbiA9PT0gJ2FzaydcbiAgICB9KVxuICB9XG5cbiAgc2hvd3MgKGdyb3VwOiBQcmludGVyR3JvdXApOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5ncm91cHMuaW5jbHVkZXMoZ3JvdXApXG4gIH1cblxuICByb2xlV29yZCAocm9sZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gUk9MRV9XT1JEU1tyb2xlIGFzIEFjY2Vzc1ZpZXdlcl0gPz8gcm9sZVxuICB9XG5cbiAgbGV0dGVyT2YgKHRleHQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICAgIHJldHVybiAodGV4dCB8fCAnPycpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpXG4gIH1cblxuICBkYXkgKHNlY29uZHM6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGRheVRleHQoc2Vjb25kcylcbiAgfVxuXG4gIGdldCBvd25lck5hbWUgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudmlld2VyID09PSAnb3duZXInICYmIGNsb3VkU3RhdGUuYWNjb3VudCkgcmV0dXJuIGNsb3VkU3RhdGUuYWNjb3VudC5uYW1lIHx8IGNsb3VkU3RhdGUuYWNjb3VudC5lbWFpbFxuICAgIGNvbnN0IG93bmVyID0gdGhpcy5zdGF0ZT8ub3duZXJcbiAgICBpZiAob3duZXI/Lm5hbWUpIHJldHVybiBvd25lci5uYW1lXG4gICAgaWYgKG93bmVyPy5lbWFpbCkgcmV0dXJuIG93bmVyLmVtYWlsXG4gICAgY29uc3Qgc2hhcmVyID0gdGhpcy5jbG91ZFByaW50ZXI/LnNoYXJlcj8uZGlzcGxheV9uYW1lIHx8IHRoaXMuY2xvdWRQcmludGVyPy5zaGFyZWRfYnlcbiAgICBpZiAoc2hhcmVyKSByZXR1cm4gc2hhcmVyXG4gICAgaWYgKG93bmVyPy5raW5kID09PSAnbm9uZScpIHJldHVybiAnTm8gb3duZXIgeWV0J1xuICAgIHJldHVybiAnTm90IGtub3duIHlldCdcbiAgfVxuXG4gIGdldCBvd25lckZpcnN0TmFtZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5vd25lck5hbWVcbiAgICByZXR1cm4gbmFtZSA9PT0gJ05vdCBrbm93biB5ZXQnIHx8IG5hbWUgPT09ICdObyBvd25lciB5ZXQnID8gJ3RoZSBvd25lcicgOiBuYW1lLnNwbGl0KC9bXFxzQF0vKVswXVxuICB9XG5cbiAgZ2V0IG93bmVyRW1haWwgKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudmlld2VyID09PSAnb3duZXInICYmIGNsb3VkU3RhdGUuYWNjb3VudCkgcmV0dXJuIGNsb3VkU3RhdGUuYWNjb3VudC5lbWFpbFxuICAgIHJldHVybiB0aGlzLnN0YXRlPy5vd25lci5lbWFpbCA/PyAnJ1xuICB9XG5cbiAgLyoqIFlvdXIgb3duIHBob3RvIHdoZW4geW91IGFyZSB0aGUgb3duZXIgaGVyZSAob25lIGZldGNoLCBzaGFyZWQgd2l0aCB0aGUgdG9wIGJhcik7IG90aGVycycgcGhvdG9zIGFyZW4ndCBrbm93bi4gKi9cbiAgZ2V0IG93bmVyUGhvdG8gKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnZpZXdlciA9PT0gJ293bmVyJyA/IG93bkF2YXRhci51cmwgOiBudWxsXG4gIH1cblxuICBwdWJsaWNQaG90byAodXJsOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHB1YmxpY0F2YXRhclVybCh1cmwpXG4gIH1cblxuICBnZXQgb3duZXJMZXR0ZXIgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubGV0dGVyT2YodGhpcy5vd25lck5hbWUpXG4gIH1cblxuICBnZXQgeW91TGluZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlbmRzID0gdGhpcy5jbG91ZFByaW50ZXI/LmVuZHNfYXRcbiAgICByZXR1cm4gYFlvdSdyZSAke3RoaXMudmlld2VyID09PSAnb3BlcmF0b3InID8gJ2FuIE9wZXJhdG9yJyA6ICdhIFZpZXdlcid9JHtlbmRzID8gYCB1bnRpbCAke2RheVRleHQoZW5kcyl9YCA6ICcnfWBcbiAgfVxuXG4gIGdldCByZW1vdGUgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIWNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkICYmIGlzTWFuYWdlZEFwaVVybCh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsKVxuICB9XG5cbiAgLyoqIEhvdyB0aGlzIGJyb3dzZXIgcmVhY2hlZCB0aGUgcHJpbnRlciwgYXMgdGhlIHJlc3Qgb2YgQ29udHJvbCB3b3JkcyBpdC4gKi9cbiAgZ2V0IHJvdXRlVGV4dCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdGUgPyByZW1vdGVSb3V0ZUxhYmVsKGNsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkKSA6IG5ldHdvcmtSb3V0ZUxhYmVsKClcbiAgfVxuXG4gIGdldCBjYW5Eb0xpbmUgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJvbGVTdW1tYXJ5KHRoaXMudmlld2VyID8/ICd2aWV3ZXInKVxuICB9XG5cbiAgZ2V0IHJvbGVUYWJsZSAoKSB7XG4gICAgcmV0dXJuIFJPTEVfVEFCTEVcbiAgfVxuXG4gIGdldCBwcmVzZXRXb3JkICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHByZXNldCA9IHRoaXMuc3RhdGU/LmxldmVsc1ByZXNldCA/PyAnJ1xuICAgIHJldHVybiBQUkVTRVRfV09SRFNbcHJlc2V0XSA/PyBwcmVzZXRcbiAgfVxuXG4gIGdldCBsb2NrTGluZSAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy52aWV3ZXIgPT09ICd2aWV3ZXInXG4gICAgICA/IFwiVmlld2VycyBkb24ndCBzZWUgdGhlIGxpc3Qgb2YgcGVvcGxlLiBUaGUgb3duZXIncyBzZXR0aW5ncyBhcmUgaGlkZGVuLlwiXG4gICAgICA6ICdJbnZpdGVzLCByZXF1ZXN0cywgbGlua3MsIGRldmljZXMsIHJ1bGVzIGFuZCB0aGUga2V5IGFyZSB0aGUgb3duZXJcXCdzIGFuZCBhcmUgaGlkZGVuLidcbiAgfVxuXG4gIGdldCBwZW9wbGVSb3dzICgpOiBQZXJzb25Sb3dbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhcmVzLm1hcChzID0+ICh7XG4gICAgICBpZDogcy5pZCxcbiAgICAgIGVtYWlsOiBzLmVtYWlsLFxuICAgICAgbmFtZTogcy5uYW1lIHx8ICcnLFxuICAgICAgcGhvdG86IHB1YmxpY0F2YXRhclVybChzLmF2YXRhcl91cmwpLFxuICAgICAgbGV0dGVyOiB0aGlzLmxldHRlck9mKHMubmFtZSB8fCBzLmVtYWlsKSxcbiAgICAgIHJvbGU6IHMucm9sZSxcbiAgICAgIGVuZHNBdDogcy5lbmRzX2F0ID8/IG51bGwsXG4gICAgICBsaW5lOiBbcy5uYW1lID8gcy5lbWFpbCA6ICcnLCBzLmVuZHNfYXQgPyBgQWNjZXNzIGVuZHMgJHtkYXlUZXh0KHMuZW5kc19hdCl9YCA6IHMuYWNjZXB0ZWQgPT09IGZhbHNlID8gJ05vdCBzaWduZWQgaW4geWV0JyA6IGBTaW5jZSAke2RheVRleHQocy5jcmVhdGVkX2F0KX1gXS5maWx0ZXIoQm9vbGVhbikuam9pbignIMK3ICcpXG4gICAgfSkpXG4gIH1cblxuICBnZXQgc2hhcmVJZCAoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuY2xvdWRQcmludGVyPy5zaGFyZV9pZCA/PyBudWxsXG4gIH1cblxuICBnZXQgZGV2ZWxvcGVyTGluZSAoKTogc3RyaW5nIHtcbiAgICAvLyBUaGUgZ2F0ZSdzIGFuc3dlciBmb3IgdGhpcyBwcmludGVyIChkZXZNb2RlU3RhdGUgaXMgb25lIGdsb2JhbCB0aGF0IGNhbiBob2xkIGFub3RoZXIgcHJpbnRlcidzKS5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuZGV2TW9kZUVuYWJsZWQgPyAnT24uICcgOiAnJ1xuICAgIHJldHVybiBgJHtzdGF0ZX1UaGUgZmlyc3QgdGltZSBpdCdzIHR1cm5lZCBvbiwgdGhlIHByaW50ZXIncyBzY3JlZW4gY29uZmlybXMgaXQuYFxuICB9XG5cbiAgZ2V0IGRldmVsb3BlclRvICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNsdWcgPSBhY3RpdmVTbHVnKClcbiAgICByZXR1cm4gYCR7c2x1ZyA/IGAvJHtzbHVnfWAgOiAnJ30vc2V0dGluZ3MjZGV2ZWxvcGVyYFxuICB9XG5cbiAgYWNjb3VudFRvIChzZWN0aW9uOiBBY2NvdW50QWNjZXNzU2VjdGlvbik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGFjY291bnRBY2Nlc3NQYXRoKHNlY3Rpb24pXG4gIH1cblxuICBsaW5rTGluZSAobGluazogSW52aXRlTGluayk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFydHMgPSBbdGhpcy5yb2xlV29yZChsaW5rLnJvbGUpXVxuICAgIGlmIChsaW5rLm1heF91c2VzID09PSAxKSBwYXJ0cy5wdXNoKCdzaW5nbGUgdXNlJylcbiAgICBlbHNlIGlmIChsaW5rLm1heF91c2VzKSBwYXJ0cy5wdXNoKGAke2xpbmsudXNlcyA/PyAwfSBvZiAke2xpbmsubWF4X3VzZXN9IHVzZXNgKVxuICAgIHBhcnRzLnB1c2gobGluay5leHBpcmVzX2F0ID8gYGVuZHMgJHtkYXlUZXh0KGxpbmsuZXhwaXJlc19hdCl9YCA6ICdubyBlbmQgZGF0ZScpXG4gICAgaWYgKGxpbmsuYXBwcm92ZV9lYWNoKSBwYXJ0cy5wdXNoKCd5b3UgbGV0IGVhY2ggcGVyc29uIGluJylcbiAgICByZXR1cm4gcGFydHMuam9pbignIMK3ICcpXG4gIH1cblxuICBhc3luYyByZWZyZXNoICgpIHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLnByaW50ZXJLZXlcbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlXG4gICAgbGV0IHN0YXRlOiBBY2Nlc3NTdGF0ZSB8IG51bGwgPSBudWxsXG4gICAgbGV0IGNhcGFiaWxpdGllczogUmVjb3JkPHN0cmluZywgQ2FwYWJpbGl0eT4gPSB7fVxuICAgIGxldCBwcmludGVyRXJyb3IgPSAnJ1xuICAgIGNvbnN0IG1hbmFnZWQgPSBpc01hbmFnZWRBcGlVcmwodGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybClcbiAgICBjb25zdCBlbmRwb2ludCA9IG1hbmFnZWQgPyBQcm9taXNlLnJlc29sdmUobnVsbCkgOiBjb25uZWN0ZWRFbmRwb2ludElkKClcbiAgICB0cnkge1xuICAgICAgW3N0YXRlLCBjYXBhYmlsaXRpZXNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW3RoaXMuY2xpZW50LmdldCgpLCB0aGlzLmNsaWVudC5jYXBhYmlsaXRpZXMoKV0pXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIEEgcmVmdXNhbCBvciBmYWlsdXJlICg0MDMsIHRpbWVvdXQsIDV4eCkgaXMgXCJub3QgYWxsb3dlZFwiOiBub3RoaW5nIGl0IHdvdWxkIGdhdGUgc2hvd3MuXG4gICAgICBzdGF0ZSA9IG51bGxcbiAgICAgIGNhcGFiaWxpdGllcyA9IHt9XG4gICAgICBwcmludGVyRXJyb3IgPSAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2VcbiAgICB9XG4gICAgaWYgKGNsb3VkU3RhdGUuYWNjb3VudCkgYXdhaXQgcmVmcmVzaFByaW50ZXJzKCkuY2F0Y2goKCkgPT4ge30pXG4gICAgY29uc3QgcmVwb3J0ZWQgPSBhd2FpdCBlbmRwb2ludFxuICAgIGlmIChrZXkgIT09IHRoaXMucHJpbnRlcktleSkgcmV0dXJuXG4gICAgdGhpcy5yZXBvcnRlZEVuZHBvaW50ID0gcmVwb3J0ZWRcbiAgICB0aGlzLnN0YXRlID0gc3RhdGVcbiAgICB0aGlzLmNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllc1xuICAgIHRoaXMucHJpbnRlckVycm9yID0gcHJpbnRlckVycm9yXG4gICAgdGhpcy5sb2FkaW5nID0gZmFsc2VcbiAgICB0aGlzLnJlbmRlcktleSsrXG4gICAgYXdhaXQgdGhpcy5sb2FkQWNjZXB0UmVxdWVzdHMoa2V5KVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaENsb3VkKClcbiAgfVxuXG4gIC8qKiBBc2tlZCBvbmx5IG9mIGEgYnJvd3NlciB0aGF0IG1heSBjaGFuZ2UgdGhlIHJ1bGVzOyBhbiBvbGRlciBwcmludGVyIG9yIGEgcmVmdXNhbCBsZWF2ZXMgdGhlIHN3aXRjaCBvdXQuICovXG4gIGFzeW5jIGxvYWRBY2NlcHRSZXF1ZXN0cyAoa2V5ID0gdGhpcy5wcmludGVyS2V5KSB7XG4gICAgbGV0IGhlbGQ6IGJvb2xlYW4gfCBudWxsID0gbnVsbFxuICAgIGlmICh0aGlzLmNhbk1hbmFnZSkgaGVsZCA9IGF3YWl0IHRoaXMubmV3RGV2aWNlcy5nZXQoKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgIGlmIChrZXkgPT09IHRoaXMucHJpbnRlcktleSkgdGhpcy5hY2NlcHRSZXF1ZXN0cyA9IGhlbGRcbiAgfVxuXG4gIC8qKiBOb3RoaW5nIGNoYW5nZXMgb24gc2NyZWVuIHVudGlsIHRoZSBwcmludGVyIHNheXMgc287IGEgcmVmdXNhbCBzaG93cyBpdHMgd29yZHMuICovXG4gIGFzeW5jIHNhdmVBY2NlcHRSZXF1ZXN0cyAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBhd2FpdCB0aGlzLnJ1bihhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFjY2VwdFJlcXVlc3RzID0gYXdhaXQgdGhpcy5uZXdEZXZpY2VzLnNldCh2YWx1ZSlcbiAgICB9KVxuICAgIHRoaXMucmVuZGVyS2V5KytcbiAgfVxuXG4gIC8qKiBUaGUgY29uc29sZSdzIHBlb3BsZSwgaW52aXRlcywgbGlua3MgYW5kIHJlcXVlc3RzIGZvciB0aGlzIHByaW50ZXI6IGl0cyBvd25lcidzIG9ubHkuICovXG4gIGFzeW5jIHJlZnJlc2hDbG91ZCAoKSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5wcmludGVyS2V5XG4gICAgY29uc3QgcCA9IHRoaXMuY2xvdWRQcmludGVyXG4gICAgaWYgKCFwIHx8IHAuc2hhcmVkIHx8IHRoaXMudmlld2VyICE9PSAnb3duZXInKSByZXR1cm5cbiAgICBsb2FkQXBwcm92YWxzKCkuY2F0Y2goKCkgPT4ge30pXG4gICAgY29uc3QgW3NoYXJlcywgaW52aXRlcywgbGlua3NdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgYWNjb3VudEFwaS5zaGFyZXMocC5pZCkudGhlbihyID0+IHIuc2hhcmVzKS5jYXRjaCgoKSA9PiBbXSksXG4gICAgICBhY2NvdW50QXBpLmludml0ZXMocC5pZCkudGhlbihyID0+IHIuaW52aXRlcykuY2F0Y2goKCkgPT4gW10pLFxuICAgICAgYWNjb3VudEFwaS5saW5rcyhwLmlkKS50aGVuKHIgPT4gci5saW5rcykuY2F0Y2goKCkgPT4gW10pXG4gICAgXSlcbiAgICBpZiAoa2V5ICE9PSB0aGlzLnByaW50ZXJLZXkpIHJldHVyblxuICAgIHRoaXMuc2hhcmVzID0gc2hhcmVzXG4gICAgdGhpcy5pbnZpdGVzID0gaW52aXRlc1xuICAgIHRoaXMubGlua3MgPSBsaW5rc1xuICB9XG5cbiAgYXN5bmMgcnVuICh3aGF0OiAoKSA9PiBQcm9taXNlPHVua25vd24+LCBkb25lPzogc3RyaW5nLCBpbkRpYWxvZyA9IGZhbHNlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhpcy5idXN5ID0gdHJ1ZVxuICAgIHRoaXMubWVzc2FnZSA9ICcnXG4gICAgdGhpcy5kaWFsb2dFcnJvciA9ICcnXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHdoYXQoKVxuICAgICAgaWYgKGRvbmUpIHRoaXMubWVzc2FnZSA9IGRvbmVcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBpc01pc3NpbmcoZXJyb3IpID8gJ05vdCBhdmFpbGFibGUgeWV0LicgOiBkZXNjcmliZShlcnJvcilcbiAgICAgIGlmIChpbkRpYWxvZykgdGhpcy5kaWFsb2dFcnJvciA9IHRleHRcbiAgICAgIGVsc2UgdGhpcy5tZXNzYWdlID0gdGV4dFxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuYnVzeSA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLyoqIEEgcHJpbnRlciBzZXR0aW5nOiBzYXlzIHBsYWlubHkgd2hlbiB0aGUgcHJpbnRlciBkaWQgbm90IHRha2UgaXQsIHRoZW4gc2hvd3Mgd2hhdCBpdCBob2xkcy4gKi9cbiAgYXN5bmMgYXBwbHkgKGNoYW5nZTogKCkgPT4gUHJvbWlzZTxib29sZWFuPikge1xuICAgIGF3YWl0IHRoaXMucnVuKGFzeW5jICgpID0+IHtcbiAgICAgIGlmICghYXdhaXQgY2hhbmdlKCkpIHRocm93IG5ldyBFcnJvcignTm90IGNoYW5nZWQ6IG9ubHkgdGhlIG93bmVyIGNhbiBjaGFuZ2UgdGhpcy4nKVxuICAgIH0pXG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoKClcbiAgfVxuXG4gIGNoYW5nZUVudHJ5IChlbnRyeTogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlIHx8IHRoaXMuc3RhdGUuZW50cnkgPT09IGVudHJ5IHx8IChlbnRyeSAhPT0gJ29wZW4nICYmIGVudHJ5ICE9PSAncHJvdGVjdGVkJykpIHJldHVyblxuICAgIGNvbnN0IGNob3NlbiA9IGVudHJ5IGFzIEFjY2Vzc0VudHJ5XG4gICAgcmV0dXJuIHRoaXMuYXBwbHkoKCkgPT4gdGhpcy5jbGllbnQuc2V0RW50cnkoY2hvc2VuKSlcbiAgfVxuXG4gIGNoYW5nZURhdGEgKGV2ZW50OiBFdmVudCkge1xuICAgIGNvbnN0IG1vZGUgPSAoZXZlbnQudGFyZ2V0IGFzIEhUTUxTZWxlY3RFbGVtZW50KS52YWx1ZVxuICAgIGlmIChtb2RlICE9PSAnc2hhcmVkJyAmJiBtb2RlICE9PSAnYWNjb3VudHMnICYmIG1vZGUgIT09ICdib3RoJykgcmV0dXJuXG4gICAgY29uc3QgY2hvc2VuID0gbW9kZSBhcyBEYXRhTW9kZVxuICAgIHJldHVybiB0aGlzLmFwcGx5KCgpID0+IHRoaXMuY2xpZW50LnNldERhdGEoY2hvc2VuKSlcbiAgfVxuXG4gIHJvbGVIYXMgKHJvdzogUm9sZVJvdywgcm9sZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHJvbGUgPT09ICdvd25lcicgfHwgcm9sZSA9PT0gJ29wZXJhdG9yJyB8fCByb2xlID09PSAndmlld2VyJyA/IHJvd1tyb2xlXSA6IGZhbHNlXG4gIH1cblxuICBvcGVuSW52aXRlICgpIHtcbiAgICB0aGlzLmZvcm0gPSB7IGVtYWlsOiAnJywgcm9sZTogJ3ZpZXdlcicsIHVudGlsOiAnJyB9XG4gICAgdGhpcy5pbnZpdGVNb2RlID0gJ2VtYWlsJ1xuICAgIHRoaXMubGlua0Zvcm0gPSB7IGxpZmV0aW1lOiAnMWQnLCBtYXhVc2VzOiBudWxsLCByb2xlOiAndmlld2VyJywgYXBwcm92ZUVhY2g6IGZhbHNlIH1cbiAgICB0aGlzLm1hZGVMaW5rID0gbnVsbFxuICAgIHRoaXMuZGlhbG9nRXJyb3IgPSAnJ1xuICAgIHRoaXMuZGlhbG9nID0gJ2ludml0ZSdcbiAgfVxuXG4gIC8qKiBBIGRhdGUgaW5wdXQncyBkYXkgYXMgdGhlIGNvbnNvbGUncyBlbmQgb2YgdGhhdCBkYXksIG9yIG51bGwgZm9yIG5ldmVyLiAqL1xuICB1bnRpbFRvRW5kcyAodW50aWw6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB1bnRpbCA/IE1hdGguZmxvb3IobmV3IERhdGUoYCR7dW50aWx9VDIzOjU5OjU5YCkuZ2V0VGltZSgpIC8gMTAwMCkgOiBudWxsXG4gIH1cblxuICAvKiogQSBkYXRlIGlucHV0J3MgdmFsdWUgZm9yIGFuIGVuZCB0aW1lLCBpbiB0aGUgdmlld2VyJ3Mgb3duIGRheS4gKi9cbiAgZGF5SW5wdXQgKGVuZHNBdDogbnVtYmVyIHwgbnVsbCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGVuZHNBdCA/IG5ldyBEYXRlKGVuZHNBdCAqIDEwMDApLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tQ0EnKSA6ICcnXG4gIH1cblxuICAvKiogVGhlIGVuZCBkYXRlIGluIHRoZSByb2xlIGRpYWxvZzogdGhlIHBlcnNvbidzIG93biBleGFjdCBlbmQgdW5sZXNzIHRoZSBkYXkgd2FzIGNoYW5nZWQuICovXG4gIHJvbGVFbmRzIChyb3c6IFBlcnNvblJvdyk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmZvcm0udW50aWwgPT09IHRoaXMuZGF5SW5wdXQocm93LmVuZHNBdCkgPyByb3cuZW5kc0F0IDogdGhpcy51bnRpbFRvRW5kcyh0aGlzLmZvcm0udW50aWwpXG4gIH1cblxuICAvKiogXCJTaGFyZSBhIGxpbmtcIiwgYXMgdGhlIHBob25lIGFwcCBkb2VzOiB0aGUgY29uc29sZSBtYWtlcyBpdCwgYW5kIGl0IGlzIGxpc3RlZCB3aXRoIGEgQ29weS4gKi9cbiAgYXN5bmMgbWFrZUxpbmsgKCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLmNsb3VkUHJpbnRlclxuICAgIGlmICghcCkgcmV0dXJuXG4gICAgY29uc3QgZiA9IHRoaXMubGlua0Zvcm1cbiAgICBsZXQgbWFkZTogSW52aXRlTGluayB8IG51bGwgPSBudWxsXG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLnJ1bihhc3luYyAoKSA9PiB7XG4gICAgICBtYWRlID0gKGF3YWl0IGFjY291bnRBcGkuY3JlYXRlTGluayhwLmlkLCB7IGxpZmV0aW1lOiBmLmxpZmV0aW1lLCBtYXhfdXNlczogZi5tYXhVc2VzLCByb2xlOiBmLnJvbGUsIGFwcHJvdmVfZWFjaDogZi5hcHByb3ZlRWFjaCB9KSkubGlua1xuICAgIH0sIHVuZGVmaW5lZCwgdHJ1ZSlcbiAgICBpZiAob2sgJiYgbWFkZSkge1xuICAgICAgdGhpcy5tYWRlTGluayA9IG1hZGVcbiAgICAgIHRoaXMucmVmcmVzaENsb3VkKClcbiAgICB9XG4gIH1cblxuICBhc3luYyBpbnZpdGUgKCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLmNsb3VkUHJpbnRlclxuICAgIGlmICghcCkgcmV0dXJuXG4gICAgY29uc3QgZW1haWwgPSB0aGlzLmZvcm0uZW1haWwudHJpbSgpXG4gICAgY29uc3QgZW5kc0F0ID0gdGhpcy51bnRpbFRvRW5kcyh0aGlzLmZvcm0udW50aWwpXG4gICAgaWYgKGF3YWl0IHRoaXMucnVuKCgpID0+IGFjY291bnRBcGkuc2hhcmUocC5pZCwgZW1haWwsIHRoaXMuZm9ybS5yb2xlLCBlbmRzQXQpLCBgJHtlbWFpbH0gY2FuIHVzZSAke3AubmFtZX0uIFdlJ3ZlIGVtYWlsZWQgdGhlbS5gLCB0cnVlKSkge1xuICAgICAgdGhpcy5kaWFsb2cgPSAnJ1xuICAgICAgdGhpcy5yZWZyZXNoQ2xvdWQoKVxuICAgIH1cbiAgfVxuXG4gIG9wZW5Sb2xlIChyb3c6IFBlcnNvblJvdykge1xuICAgIHRoaXMuY2hhbmdpbmcgPSByb3dcbiAgICB0aGlzLmZvcm0ucm9sZSA9IHJvdy5yb2xlXG4gICAgdGhpcy5mb3JtLnVudGlsID0gdGhpcy5kYXlJbnB1dChyb3cuZW5kc0F0KVxuICAgIHRoaXMuZGlhbG9nRXJyb3IgPSAnJ1xuICAgIHRoaXMuZGlhbG9nID0gJ3JvbGUnXG4gIH1cblxuICBhc3luYyBjaGFuZ2VSb2xlICgpIHtcbiAgICBjb25zdCBwID0gdGhpcy5jbG91ZFByaW50ZXJcbiAgICBjb25zdCByb3cgPSB0aGlzLmNoYW5naW5nXG4gICAgaWYgKCFwIHx8ICFyb3cpIHJldHVyblxuICAgIGNvbnN0IHJvbGUgPSB0aGlzLmZvcm0ucm9sZVxuICAgIGNvbnN0IGVuZHNBdCA9IHRoaXMucm9sZUVuZHMocm93KVxuICAgIGlmIChhd2FpdCB0aGlzLnJ1bigoKSA9PiBhY2NvdW50QXBpLnNoYXJlKHAuaWQsIHJvdy5lbWFpbCwgcm9sZSwgZW5kc0F0KSwgYCR7cm93LmVtYWlsfSBpcyAke3JvbGUgPT09ICd2aWV3ZXInID8gJ2EgVmlld2VyJyA6ICdhbiBPcGVyYXRvcid9IG5vdyR7ZW5kc0F0ID8gYCwgdW50aWwgJHtkYXlUZXh0KGVuZHNBdCl9YCA6ICcnfS5gLCB0cnVlKSkge1xuICAgICAgdGhpcy5kaWFsb2cgPSAnJ1xuICAgICAgdGhpcy5jaGFuZ2luZyA9IG51bGxcbiAgICAgIHRoaXMucmVmcmVzaENsb3VkKClcbiAgICB9XG4gIH1cblxuICBhc3luYyByZW1vdmVQZXJzb24gKHJvdzogUGVyc29uUm93KSB7XG4gICAgY29uc3QgcCA9IHRoaXMuY2xvdWRQcmludGVyXG4gICAgaWYgKCFwKSByZXR1cm5cbiAgICBjb25zdCBrZXkgPSB0aGlzLnByaW50ZXJLZXlcbiAgICBjb25zdCBzdXJlID0gYXdhaXQgdGhpcy4kY29uZmlybShgJHtyb3cuZW1haWx9IGxvc2VzIGFjY2VzcyB0byAke3AubmFtZX0gbm93LCBmcm9tIGV2ZXJ5IGRldmljZS4gVGhlaXIgYWNjb3VudCBhbmQgb3RoZXIgcHJpbnRlcnMgYXJlbid0IHRvdWNoZWQuYCwge1xuICAgICAgdGl0bGU6IGBSZW1vdmUgJHtyb3cuZW1haWx9IGZyb20gJHtwLm5hbWV9P2AsXG4gICAgICBidXR0b25UcnVlVGV4dDogJ1JlbW92ZScsXG4gICAgICBkYW5nZXI6IHRydWVcbiAgICB9KVxuICAgIGlmICghc3VyZSB8fCAhdGhpcy5zdGlsbE9uKGtleSwgcC5pZCkpIHJldHVyblxuICAgIGF3YWl0IHRoaXMucnVuKCgpID0+IGFjY291bnRBcGkucmVtb3ZlU2hhcmUocC5pZCwgcm93LmlkKSwgYCR7cm93LmVtYWlsfSBjYW4ndCB1c2UgJHtwLm5hbWV9IGFueSBtb3JlLmApXG4gICAgdGhpcy5yZWZyZXNoQ2xvdWQoKVxuICB9XG5cbiAgYXN5bmMgYW5zd2VyIChyZXF1ZXN0OiBKb2luQXBwcm92YWwsIGFsbG93OiBib29sZWFuKSB7XG4gICAgY29uc3Qgd2hvID0gcmVxdWVzdC5yZXF1ZXN0ZXI/LmVtYWlsID8/ICdTb21lb25lJ1xuICAgIGF3YWl0IHRoaXMucnVuKCgpID0+IGFjY291bnRBcGkuYW5zd2VyQXBwcm92YWwocmVxdWVzdC5pZCwgYWxsb3cpLCBhbGxvdyA/IGAke3dob30gY2FuIHVzZSAke3RoaXMucHJpbnRlck5hbWV9IG5vdy5gIDogJ1JlZnVzZWQuJylcbiAgICBhd2FpdCBsb2FkQXBwcm92YWxzKCkuY2F0Y2goKCkgPT4ge30pXG4gICAgdGhpcy5yZWZyZXNoQ2xvdWQoKVxuICB9XG5cbiAgYXN5bmMgcmVzZW5kIChpbnZpdGU6IFByaW50ZXJJbnZpdGUpIHtcbiAgICBjb25zdCBwID0gdGhpcy5jbG91ZFByaW50ZXJcbiAgICBpZiAoIXApIHJldHVyblxuICAgIGF3YWl0IHRoaXMucnVuKCgpID0+IGFjY291bnRBcGkuc2VuZEludml0ZShwLmlkLCBpbnZpdGUuZW1haWwsIGludml0ZS5yb2xlLCBpbnZpdGUuZW5kc19hdCksIGBJbnZpdGF0aW9uIHNlbnQgdG8gJHtpbnZpdGUuZW1haWx9LmApXG4gICAgdGhpcy5yZWZyZXNoQ2xvdWQoKVxuICB9XG5cbiAgYXN5bmMgY2FuY2VsSW52aXRlIChpbnZpdGU6IFByaW50ZXJJbnZpdGUpIHtcbiAgICBjb25zdCBwID0gdGhpcy5jbG91ZFByaW50ZXJcbiAgICBpZiAoIXApIHJldHVyblxuICAgIGNvbnN0IGtleSA9IHRoaXMucHJpbnRlcktleVxuICAgIGNvbnN0IHN1cmUgPSBhd2FpdCB0aGlzLiRjb25maXJtKGAke2ludml0ZS5lbWFpbH0gd29uJ3QgYmUgYWJsZSB0byBqb2luICR7cC5uYW1lfSB3aXRoIGl0LmAsIHtcbiAgICAgIHRpdGxlOiBgQ2FuY2VsIHRoaXMgaW52aXRlIHRvICR7cC5uYW1lfT9gLFxuICAgICAgYnV0dG9uVHJ1ZVRleHQ6ICdDYW5jZWwgaW52aXRlJyxcbiAgICAgIGRhbmdlcjogdHJ1ZVxuICAgIH0pXG4gICAgaWYgKCFzdXJlIHx8ICF0aGlzLnN0aWxsT24oa2V5LCBwLmlkKSkgcmV0dXJuXG4gICAgYXdhaXQgdGhpcy5ydW4oKCkgPT4gYWNjb3VudEFwaS53aXRoZHJhd0ludml0ZShwLmlkLCBpbnZpdGUuaWQpLCAnSW52aXRlIGNhbmNlbGxlZC4nKVxuICAgIHRoaXMucmVmcmVzaENsb3VkKClcbiAgfVxuXG4gIGFzeW5jIGVuZExpbmsgKGxpbms6IEludml0ZUxpbmspIHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLnByaW50ZXJLZXlcbiAgICBjb25zdCBzdXJlID0gYXdhaXQgdGhpcy4kY29uZmlybSgnTm9ib2R5IGNhbiBqb2luIHdpdGggaXQgYW55IG1vcmUuIFBlb3BsZSB3aG8gYWxyZWFkeSBqb2luZWQga2VlcCB0aGVpciBhY2Nlc3MuJywge1xuICAgICAgdGl0bGU6ICdFbmQgdGhpcyBpbnZpdGUgbGluaz8nLFxuICAgICAgYnV0dG9uVHJ1ZVRleHQ6ICdFbmQgbGluaycsXG4gICAgICBkYW5nZXI6IHRydWVcbiAgICB9KVxuICAgIGlmICghc3VyZSB8fCBrZXkgIT09IHRoaXMucHJpbnRlcktleSkgcmV0dXJuXG4gICAgYXdhaXQgdGhpcy5ydW4oKCkgPT4gYWNjb3VudEFwaS5yZXZva2VMaW5rKGxpbmsucHJpbnRlcl9pZCwgbGluay5pZCksICdUaGF0IGludml0ZSBsaW5rIG5vIGxvbmdlciB3b3Jrcy4gUGVvcGxlIHdobyBqb2luZWQgd2l0aCBpdCBrZWVwIHRoZWlyIGFjY2Vzcy4nKVxuICAgIHRoaXMucmVmcmVzaENsb3VkKClcbiAgfVxuXG4gIGFzeW5jIGNvcHkgKHRleHQ6IHN0cmluZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KVxuICAgICAgdGhpcy5tZXNzYWdlID0gJ0xpbmsgY29waWVkLidcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IFwiQ29weWluZyBkaWRuJ3Qgd29yayBpbiB0aGlzIGJyb3dzZXIuXCJcbiAgICB9XG4gIH1cblxuICBhc3luYyB1bmxpbmsgKCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLmNsb3VkUHJpbnRlclxuICAgIGlmICghcCkgcmV0dXJuXG4gICAgY29uc3Qga2V5ID0gdGhpcy5wcmludGVyS2V5XG4gICAgY29uc3Qgc3VyZSA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oYCR7cC5uYW1lfSBsZWF2ZXMgeW91ciBhY2NvdW50OiB5b3UgY2FuJ3QgcmVhY2ggaXQgZnJvbSBvdXRzaWRlIHlvdXIgaG9tZSwgYW5kIGV2ZXJ5b25lIHlvdSBzaGFyZSBpdCB3aXRoIGxvc2VzIGFjY2Vzcy4gSXQga2VlcHMgd29ya2luZyBvbiB5b3VyIG5ldHdvcmssIGFuZCB5b3UgY2FuIGxpbmsgaXQgYWdhaW4gYXQgaXRzIHNjcmVlbi5gLCB7XG4gICAgICB0aXRsZTogYFVubGluayAke3AubmFtZX0/YCxcbiAgICAgIGJ1dHRvblRydWVUZXh0OiAnVW5saW5rJyxcbiAgICAgIGRhbmdlcjogdHJ1ZVxuICAgIH0pXG4gICAgaWYgKCFzdXJlIHx8ICF0aGlzLnN0aWxsT24oa2V5LCBwLmlkKSkgcmV0dXJuXG4gICAgaWYgKGF3YWl0IHRoaXMucnVuKCgpID0+IGNsb3VkQXBpLnVubGlua1ByaW50ZXIocC5pZCksIGAke3AubmFtZX0gaXMgdW5saW5rZWQuYCkpIGF3YWl0IHJlZnJlc2hQcmludGVycygpLmNhdGNoKCgpID0+IHt9KVxuICB9XG5cbiAgYXN5bmMgbGVhdmUgKCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLmNsb3VkUHJpbnRlclxuICAgIGNvbnN0IHNoYXJlSWQgPSB0aGlzLnNoYXJlSWRcbiAgICBpZiAoIXAgfHwgIXNoYXJlSWQpIHJldHVyblxuICAgIGNvbnN0IGtleSA9IHRoaXMucHJpbnRlcktleVxuICAgIGNvbnN0IHN1cmUgPSBhd2FpdCB0aGlzLiRjb25maXJtKGBZb3UnbGwgbG9zZSBhY2Nlc3MgdG8gJHtwLm5hbWV9IGZyb20gYWxsIHlvdXIgZGV2aWNlcy4gJHt0aGlzLm93bmVyRmlyc3ROYW1lID09PSAndGhlIG93bmVyJyA/ICdUaGUgb3duZXInIDogdGhpcy5vd25lckZpcnN0TmFtZX0gd291bGQgbmVlZCB0byBpbnZpdGUgeW91IGFnYWluLiBUaGUgb3duZXIgY2FuJ3QgbGVhdmU7IHRoZXkgdW5saW5rIGluc3RlYWQuYCwge1xuICAgICAgdGl0bGU6IGBMZWF2ZSAke3AubmFtZX0/YCxcbiAgICAgIGJ1dHRvblRydWVUZXh0OiAnTGVhdmUnLFxuICAgICAgZGFuZ2VyOiB0cnVlXG4gICAgfSlcbiAgICBpZiAoIXN1cmUgfHwgIXRoaXMuc3RpbGxPbihrZXksIHAuaWQpKSByZXR1cm5cbiAgICBpZiAoYXdhaXQgdGhpcy5ydW4oKCkgPT4gYWNjb3VudEFwaS5yZW1vdmVTaGFyZShwLmlkLCBzaGFyZUlkKSwgYFlvdSd2ZSBsZWZ0ICR7cC5uYW1lfS5gKSkgYXdhaXQgcmVmcmVzaFByaW50ZXJzKCkuY2F0Y2goKCkgPT4ge30pXG4gIH1cblxuICAvKiogQWZ0ZXIgYSBjb25maXJtOiBzdGlsbCB0aGUgc2FtZSBwcmludGVyLCBzdGlsbCB0aGF0IGFjY291bnQgcHJpbnRlci4gQSBzd2l0Y2ggd2hpbGUgaXQgd2FzIG9wZW4gY2FuY2VscyB0aGUgYWN0aW9uLiAqL1xuICBzdGlsbE9uIChrZXk6IHN0cmluZywgcHJpbnRlcklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4ga2V5ID09PSB0aGlzLnByaW50ZXJLZXkgJiYgdGhpcy5jbG91ZFByaW50ZXI/LmlkID09PSBwcmludGVySWRcbiAgfVxuXG4gIC8qKiBUaGUgcHJpbnRlciBsZXRzIHRoaXMgYnJvd3NlciBhc2sgaXRzIG93biBzY3JlZW4gdG8gY2hhbmdlIHdobyBjYW4gZ2V0IGluIChwcm90ZWN0aW9uOiBhc2spLiAqL1xuICBhc2tBdFByaW50ZXIgKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZSkgcmV0dXJuXG4gICAgdGhpcy5hc2tpbmcgPSB7IGtpbmQ6ICdlbnRyeScsIGVudHJ5OiB0aGlzLnN0YXRlLmVudHJ5ID09PSAnb3BlbicgPyAncHJvdGVjdGVkJyA6ICdvcGVuJyB9XG4gICAgdGhpcy5hc2tpbmdPcGVuID0gdHJ1ZVxuICB9XG5cbiAgLyoqIFNpZ25lZCBvdXQgb24gYSBwcmludGVyIGFuIGFjY291bnQgb3duczogdGhlIG93bmVyJ3MgZ3JvdXBzIG5lZWQgdGhlIG93bmVyIHNpZ25lZCBpbi4gKi9cbiAgZ2V0IHNpZ25JbkhpbnQgKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhY2xvdWRTdGF0ZS5hY2NvdW50ICYmIHRoaXMuc3RhdGU/Lm93bmVyLmtpbmQgPT09ICdhY2NvdW50J1xuICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCIgc2NvcGVkPlxuICAucGEge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBnYXA6IDA7XG4gIH1cblxuICAucGFfX2hlYWQge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMTZweDtcblxuICAgIGgyIHtcbiAgICAgIG1hcmdpbjogMCAwIDRweDtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgcCB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIH1cblxuICAgIGEge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC5wYV9fbXV0ZWQge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgfVxuXG4gIC5wYV9fbm90ZSB7XG4gICAgbWFyZ2luOiAxMnB4IDAgMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuXG4gIC5wYS1ndCB7XG4gICAgbWFyZ2luOiAyMnB4IDAgOHB4O1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgZm9udC1zaXplOiAxMXB4O1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMWVtO1xuICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIH1cblxuICAucGEtbGlzdCB7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogdmFyKC0tbTNkLXJhZGl1cy1tZCwgMTZweCk7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLXN1cmZhY2UpO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG5cbiAgICAmICsgJiB7XG4gICAgICBtYXJnaW4tdG9wOiAxMnB4O1xuICAgIH1cbiAgfVxuXG4gIC5wYS1saXN0ID4gKiArICoge1xuICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1tM2QtYm9yZGVyKTtcbiAgfVxuXG4gIC5wYS1yb3cge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDEycHg7XG4gICAgbWluLWhlaWdodDogNTZweDtcbiAgICBwYWRkaW5nOiAxMHB4IDE2cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIH1cblxuICAucGEtcm93LS1saW5rOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtaG92ZXIpO1xuICB9XG5cbiAgLnBhLXJvd19fdGV4dCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4OiAxIDEgYXV0bztcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMnB4O1xuICAgIG1pbi13aWR0aDogMDtcblxuICAgIGIge1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICAgIH1cblxuICAgIHNwYW4ge1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICB9XG4gIH1cblxuICAucGEtcm93X19hY3RzIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICBnYXA6IDZweDtcbiAgfVxuXG4gIC5wYS1yb3ctLXNvb24gLnBhLXJvd19fdGV4dCBiIHtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICB9XG5cbiAgLnBhLW93biB7XG4gICAgcGFkZGluZy1ib3R0b206IDEycHg7XG5cbiAgICAucGEtcm93IHtcbiAgICAgIGJvcmRlcjogMDtcbiAgICB9XG4gIH1cblxuICAucGEtb3duX19waWxscyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgZ2FwOiA4cHg7XG4gICAgcGFkZGluZzogMCAxNnB4O1xuICAgIGJvcmRlcjogMCAhaW1wb3J0YW50O1xuICB9XG5cbiAgLnBhLWV5ZWJyb3cge1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1zdWJ0bGUpICFpbXBvcnRhbnQ7XG4gICAgZm9udC1zaXplOiAxMXB4ICFpbXBvcnRhbnQ7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICBsZXR0ZXItc3BhY2luZzogMC4xZW07XG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgfVxuXG4gIC5wYS1hdiB7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBmbGV4OiBub25lO1xuICAgIHBsYWNlLWl0ZW1zOiBjZW50ZXI7XG4gICAgd2lkdGg6IDM2cHg7XG4gICAgaGVpZ2h0OiAzNnB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC1hY2NlbnQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICB9XG5cbiAgLnBhLWF2LS1sZyB7XG4gICAgd2lkdGg6IDQ4cHg7XG4gICAgaGVpZ2h0OiA0OHB4O1xuICAgIGZvbnQtc2l6ZTogMThweDtcbiAgfVxuXG4gIC5wYS1hdi0tYiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwtMik7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0KTtcbiAgfVxuXG4gIC5wYS1hdi0tZCB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gIH1cblxuICAucGEtaWNvIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGZsZXg6IG5vbmU7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogMzZweDtcbiAgICBoZWlnaHQ6IDM2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgfVxuXG4gIC5wYS1pY28tLXJlZCxcbiAgLnBhLXJlZCB7XG4gICAgY29sb3I6IHZhcigtLW0zZC1kYW5nZXIpICFpbXBvcnRhbnQ7XG4gIH1cblxuICAucGEtbW9ubyB7XG4gICAgZm9udC1mYW1pbHk6IHZhcigtLW0zZC1mb250LW1vbm8pO1xuICB9XG5cbiAgLnBhLWNoZWNrIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiA4cHg7XG4gICAgbWFyZ2luLXRvcDogMTBweDtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gIH1cblxuICAucGEtZ2gge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC13cmFwOiB3cmFwO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBnYXA6IDhweDtcbiAgICBtYXJnaW46IDhweCAycHggMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuXG4gIC5wYS1sbmsge1xuICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDJweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLWFjY2VudCkgIWltcG9ydGFudDtcbiAgICBmb250LXNpemU6IDEzcHg7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIH1cblxuICAucGEtc2VnIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBmbGV4OiBub25lO1xuICAgIHBhZGRpbmc6IDJweDtcbiAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1tM2QtcmFkaXVzLXBpbGwsIDk5OXB4KTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbCk7XG5cbiAgICBidXR0b24ge1xuICAgICAgbWluLWhlaWdodDogMzBweDtcbiAgICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLW0zZC1yYWRpdXMtcGlsbCwgOTk5cHgpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgfVxuXG4gICAgYnV0dG9uOmRpc2FibGVkIHtcbiAgICAgIG9wYWNpdHk6IDAuNjtcbiAgICB9XG5cbiAgICAucGEtc2VnLS1vbiB7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLnBhLXNlZy0tZGxnIHtcbiAgICBtYXJnaW4tYm90dG9tOiA4cHg7XG4gIH1cblxuICAucGEtc2VsZWN0IHtcbiAgICBmbGV4OiBub25lO1xuICAgIG1pbi1oZWlnaHQ6IDMycHg7XG4gICAgcGFkZGluZzogNHB4IDEwcHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tbTNkLWJvcmRlci1zdHJvbmcpO1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2Qtc3VyZmFjZS0yKTtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQpO1xuICAgIGZvbnQ6IGluaGVyaXQ7XG4gICAgZm9udC1zaXplOiAxM3B4O1xuICB9XG5cbiAgLnBhLXJvbGVzIC5wYS1yb3cge1xuICAgIG1pbi1oZWlnaHQ6IDQ0cHg7XG4gIH1cblxuICAucGEtd2hvIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXg6IG5vbmU7XG4gICAgZ2FwOiA0cHg7XG5cbiAgICBzcGFuIHtcbiAgICAgIHBhZGRpbmc6IDNweCA4cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1maWxsLTIpO1xuICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LXN1YnRsZSk7XG4gICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICBmb250LXdlaWdodDogNzAwO1xuICAgIH1cblxuICAgIC5wYS13aG8tLXkge1xuICAgICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWFjY2VudC1zb2Z0KTtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtYWNjZW50KTtcbiAgICB9XG4gIH1cblxuICAucGEtb3B0IHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmcjtcbiAgICBnYXA6IDhweDtcblxuICAgIGJ1dHRvbiB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgICAgcGFkZGluZzogMTJweDtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDE0cHg7XG4gICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1tM2QtZmlsbC0yKTtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuXG4gICAgICBzcGFuIHtcbiAgICAgICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgfVxuICAgIH1cblxuICAgIC5wYS1vcHQtLW9uIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1hY2NlbnQtc29mdCk7XG4gICAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggdmFyKC0tbTNkLWFjY2VudC1saW5lLCB2YXIoLS1tM2QtYWNjZW50KSk7XG4gICAgfVxuICB9XG5cbiAgLnBhLWVtcHR5IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBnYXA6IDRweDtcbiAgICBwYWRkaW5nOiAyNHB4IDE2cHg7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5cbiAgICBiIHtcbiAgICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgfVxuXG4gICAgYnV0dG9uIHtcbiAgICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gICAgfVxuICB9XG5cbiAgLnBhLWVtcHR5X19pY28ge1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICB3aWR0aDogNDBweDtcbiAgICBoZWlnaHQ6IDQwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogNnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbTNkLWZpbGwpO1xuICB9XG5cbiAgLnBhLWxhc3Qge1xuICAgIG1hcmdpbi10b3A6IDE2cHg7XG4gIH1cblxuICAucGEtbG9jayB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogNnB4O1xuICAgIG1hcmdpbjogMTJweCAycHggMDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3NldHRpbmdzL3Blb3BsZS1hY2Nlc3MvUGVvcGxlQWNjZXNzU2V0dGluZ3MudnVlIn0=