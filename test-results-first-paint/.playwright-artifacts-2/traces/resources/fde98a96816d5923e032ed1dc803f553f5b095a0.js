export const LIBRARY_RETURN_HOSTS = ["library.muon3d.com", "staging.library.muon3d.com"];
export function libraryReturnUrl(value) {
  if (typeof value !== "string" || !value) return null;
  if (value.startsWith("/")) {
    return /^\/(?![/\\])[^\\\s\x00-\x1f\x7f]*$/.test(value) ? value : null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && LIBRARY_RETURN_HOSTS.includes(url.hostname) && url.port === "" ? url.href : null;
  } catch {
    return null;
  }
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const two = (n) => String(n).padStart(2, "0");
export function initialsOf(name, email) {
  const source = (name || "").trim() || (email || "").split("@")[0] || "?";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (!words.length) return "?";
  return Array.from(words[0])[0].toUpperCase();
}
export function dayText(seconds, now = Date.now()) {
  const d = new Date(seconds * 1e3);
  const year = d.getFullYear() === new Date(now).getFullYear() ? "" : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
}
export function whenText(seconds, now = Date.now()) {
  const d = new Date(seconds * 1e3);
  return `${dayText(seconds, now)}, ${two(d.getHours())}:${two(d.getMinutes())}`;
}
export function monthText(seconds) {
  const d = new Date(seconds * 1e3);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}
export function agoText(seconds, now = Date.now()) {
  if (!seconds) return "not since";
  const minutes = Math.max(0, Math.round((now / 1e3 - seconds) / 60));
  if (minutes < 2) return "now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  return dayText(seconds, now);
}
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const PROVIDERS = { apple: "Apple", google: "Google" };
export function providerName(provider) {
  return PROVIDERS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}
export function methodsLine(me) {
  const s2 = me.sign_in;
  if (!s2) return me.account.has_password ? "Password set" : "";
  const parts = [];
  if (s2.passkeys) parts.push(plural(s2.passkeys, "passkey"));
  parts.push(s2.two_step ? "Two-step sign-in on" : "Two-step sign-in off");
  for (const p of s2.identities) parts.push(`${providerName(p)} linked`);
  if (s2.password) parts.push("Password set");
  return parts.join(" · ");
}
export function securityHealth(me) {
  const s2 = me.sign_in ?? { password: !!me.account.has_password, passkeys: 0, identities: [], two_step: !!me.account.two_step };
  const ways = (s2.password ? 1 : 0) + s2.passkeys + s2.identities.length;
  const strong = s2.passkeys > 0 || s2.two_step;
  if (strong && ways >= 2) {
    const have = [];
    if (s2.passkeys) have.push(plural(s2.passkeys, "passkey"));
    if (s2.two_step) have.push("two-step sign-in is on");
    if (s2.two_step && typeof s2.recovery_left === "number") have.push(`${s2.recovery_left} recovery ${s2.recovery_left === 1 ? "code is" : "codes are"} left`);
    return { level: "good", title: "Well protected", line: `${listText(have).replace(/^./, (c) => c.toUpperCase())}.` };
  }
  if (!strong) {
    return { level: "weak", title: "Only a password protects this account", line: "Anyone who learns it can reach your printers. Add a passkey or turn on two-step sign-in." };
  }
  return { level: "fair", title: "One way in", line: "Add a second way to sign in." };
}
export function listText(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
export function clientName(clientId) {
  switch (clientId) {
    case "fluidd":
      return "Control";
    case "slicer":
      return "Slice";
    case "models":
      return "Muon3D models";
    case "library":
      return "Library";
    default:
      return clientId || null;
  }
}
const PHONE = /iphone|ipad|android|pixel|galaxy|phone/i;
function kindOf(s2) {
  if (s2.kind === "browser" || s2.client_id) return "browser";
  return PHONE.test(s2.device_label || s2.device) ? "phone" : "computer";
}
function labelOf(s2) {
  if (s2.device_label) return s2.device_label;
  if (s2.kind === "browser" || s2.device === "Web browser") return "A web browser";
  if (s2.device === "Unnamed device") return "A device with no name";
  return s2.device;
}
export function shortKey(key) {
  if (!key) return null;
  return key.length > 10 ? `${key.slice(0, 4)}…${key.slice(-4)}` : key;
}
export function devicesFrom(sessions) {
  const devices = [];
  const byParent = /* @__PURE__ */ new Map();
  const ordered = [...sessions].sort((a, b) => (a.kind === "browser" ? 0 : 1) - (b.kind === "browser" ? 0 : 1) || a.created_at - b.created_at);
  for (const s2 of ordered) {
    const root = s2.parent_id || s2.id;
    const into = byParent.get(root);
    const client = clientName(s2.client_id);
    if (into) {
      into.sessionIds.push(s2.id);
      if (client && !into.uses.includes(client)) into.uses = into.uses ? `${into.uses} and ${client}` : client;
      into.current = into.current || s2.current;
      into.lastUsedAt = Math.max(into.lastUsedAt ?? 0, s2.last_used_at ?? 0) || null;
      continue;
    }
    const kind = kindOf(s2);
    const leftover = s2.kind === "legacy" && s2.device === "Muon3D sign-in";
    const device = {
      id: s2.id,
      label: leftover ? "An old web sign-in" : labelOf(s2),
      kind,
      uses: leftover ? "Ends by itself" : client ?? (kind === "browser" ? "" : "Muon3D app"),
      current: s2.current,
      signedInAt: s2.created_at,
      lastUsedAt: s2.last_used_at,
      phoneKey: kind === "browser" ? null : shortKey(s2.endpoint_id),
      sessionIds: [s2.id],
      leftover
    };
    devices.push(device);
    byParent.set(root, device);
  }
  return devices.sort((a, b) => Number(b.current) - Number(a.current) || (b.lastUsedAt ?? b.signedInAt) - (a.lastUsedAt ?? a.signedInAt));
}
export function devicesLine(devices) {
  const names = devices.filter((d) => !d.leftover).map((d) => d.current ? "this browser" : d.label);
  const text = listText(names);
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}.` : "";
}
export function deviceCount(devices) {
  return devices.filter((d) => !d.leftover).length;
}
const s = (v) => typeof v === "string" ? v : "";
export function eventLine(e, printerName = (id) => id) {
  const d = e.detail ?? {};
  const printer = () => printerName(s(d.printer_id));
  switch (e.kind) {
    case "sign_in":
      return { icon: "signIn", text: d.method === "passkey" ? "Signed in with a passkey" : "Signed in" };
    case "sign_out":
      return { icon: "signOut", text: "Signed out" };
    case "signed_out_everywhere":
      return { icon: "signOut", text: "Signed out everywhere" };
    case "device_signed_out":
      return { icon: "signOut", text: "Signed a device out" };
    case "passkey_added":
      return { icon: "key", text: `Passkey added: ${s(d.name) || "a passkey"}` };
    case "passkey_removed":
      return { icon: "key", text: `Passkey removed: ${s(d.name) || "a passkey"}` };
    case "passkey_renamed":
      return { icon: "key", text: `Passkey renamed: ${s(d.name) || "a passkey"}` };
    case "password_changed":
      return { icon: "lock", text: "Password changed" };
    case "password_reset":
      return { icon: "lock", text: "Password reset from an email link" };
    case "two_step_on":
      return { icon: "shield", text: "Two-step sign-in turned on" };
    case "two_step_off":
      return { icon: "shield", text: "Two-step sign-in turned off" };
    case "recovery_code_used":
      return { icon: "shield", text: `A recovery code was used${typeof d.left === "number" ? `; ${d.left} left` : ""}` };
    case "recovery_codes_renewed":
      return { icon: "shield", text: "New recovery codes made" };
    case "email_change_requested":
      return { icon: "mail", text: `Asked to change the email address to ${s(d.to)}` };
    case "identity_linked":
      return { icon: "link", text: `${providerName(s(d.provider))} linked` };
    case "identity_unlinked":
      return { icon: "link", text: `${providerName(s(d.provider))} unlinked` };
    case "printer_shared":
      return { icon: "userPlus", text: `You let ${s(d.email)} use ${printer()}${d.role ? `, as ${d.role === "viewer" ? "a Viewer" : "an Operator"}` : ""}` };
    case "printer_invited":
      return { icon: "userPlus", text: `You invited ${s(d.email)} to use ${printer()}` };
    case "invite_accepted":
      return { icon: "userPlus", text: `${s(d.email)} accepted your invite to ${printer()}` };
    case "printer_unshared":
      return { icon: "userMinus", text: `${s(d.email)} can no longer use ${printer()}` };
    case "share_ended":
      return { icon: "userMinus", text: `${s(d.email)}'s access to ${printer()} ended` };
    case "join_requested":
      return { icon: "userPlus", text: `${s(d.email)} asked to use ${printer()}` };
    case "joined_by_link":
      return { icon: "userPlus", text: `${s(d.email)} joined ${printer()} with an invite link` };
    case "invite_link_created":
      return { icon: "link", text: `Invite link made for ${printer()}` };
    case "invite_link_revoked":
      return { icon: "link", text: `Invite link for ${printer()} turned off` };
    case "app_disconnected": {
      const n = typeof d.sessions === "number" ? d.sessions : 0;
      return { icon: "link", text: n ? `Disconnected a connected app and ended its ${n === 1 ? "sign-in" : `${n} sign-ins`}` : "Disconnected a connected app" };
    }
    case "refresh_token_reused":
      return { icon: "alert", text: "A sign-in was used twice, so it was ended" };
    case "deletion_requested":
      return { icon: "alert", text: "Deletion of the account asked for" };
    case "deletion_cancelled":
      return { icon: "alert", text: "Deletion of the account cancelled" };
    default:
      return { icon: "alert", text: e.kind.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) };
  }
}
export const ACCOUNT_NAV_GROUPS = ["You", "Access", "Everything else"];
export const ACCOUNT_SECTIONS = [
  { id: "overview", label: "Overview", icon: "user", built: true },
  { id: "profile", label: "Profile", icon: "idCard", built: true, group: "You" },
  { id: "security", label: "Sign-in and security", icon: "shield", built: true, group: "You" },
  { id: "printers", label: "Printers and access", icon: "printer", built: true, group: "Access" },
  { id: "sessions", label: "Your devices", icon: "devices", built: true, group: "Access" },
  { id: "apps", label: "Apps and agents", icon: "link", built: true, group: "Access" },
  // Merged into Apps and agents; its old address opens that page.
  { id: "tokens", label: "Access tokens", icon: "key", built: false },
  { id: "notifications", label: "Notifications", icon: "bell", built: true, group: "Everything else" },
  { id: "library", label: "Library and storage", icon: "library", built: true, group: "Everything else" },
  { id: "plan", label: "Plan", icon: "card", built: true, group: "Everything else" },
  { id: "privacy", label: "Your data", icon: "eye", built: true, group: "Everything else" },
  { id: "delete", label: "Delete account", icon: "trash", built: true }
];
export const ACCOUNT_SECTION_ALIASES = { devices: "sessions", tokens: "apps", data: "privacy" };
export function accountNavId(id) {
  return id === "delete" ? "privacy" : id;
}
export function accountSections() {
  return ACCOUNT_SECTIONS.filter((section) => section.built);
}
export function accountSectionFor(id) {
  const named = id && ACCOUNT_SECTION_ALIASES[id] || id;
  return accountSections().find((section) => section.id === named) ?? ACCOUNT_SECTIONS[0];
}
export function accountNav(sections = accountSections()) {
  return ACCOUNT_NAV_GROUPS.map((group) => ({ group, sections: sections.filter((section) => section.group === group) })).filter((entry) => entry.sections.length);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogV2hhdCB0aGUgQWNjb3VudCBwYWdlcyBzYXkgKEtBTi01MzIpLCB3b3JrZWQgb3V0IGZyb20gdGhlIGNvbnNvbGUnc1xuICogYW5zd2VyczogcGxhaW4gZnVuY3Rpb25zLCBzbyB0aGUgcGFnZXMgb25seSBsYXkgdGhlbSBvdXQgYW5kIHRoZSBydWxlcyBhcmVcbiAqIHRlc3RlZCBoZXJlLiBUaW1lcyBmcm9tIHRoZSBjb25zb2xlIGFyZSBzZWNvbmRzIHNpbmNlIHRoZSBlcG9jaC5cbiAqL1xuaW1wb3J0IHR5cGUgeyBBY2NvdW50RXZlbnQsIE1lLCBTZXNzaW9uIH0gZnJvbSAnLi9hcGknXG5cbi8qKiBQdWJsaWMgTGlicmFyeSBvcmlnaW5zIHRoYXQgbWF5IHNlbmQgc29tZWJvZHkgdG8gQWNjb3VudCBhbmQgcmVjZWl2ZSB0aGVtIGJhY2suICovXG5leHBvcnQgY29uc3QgTElCUkFSWV9SRVRVUk5fSE9TVFMgPSBbJ2xpYnJhcnkubXVvbjNkLmNvbScsICdzdGFnaW5nLmxpYnJhcnkubXVvbjNkLmNvbSddIGFzIGNvbnN0XG5cbi8qKlxuICogQWNjZXB0IGEgTGlicmFyeSByZXR1cm4gYWRkcmVzczogYW4gYWJzb2x1dGUsIGVuY3J5cHRlZCBVUkwgb24gYSBMaWJyYXJ5XG4gKiBob3N0LCBvciBhIHBhdGggb24gdGhpcyBzaXRlIHN0YXJ0aW5nIHdpdGggZXhhY3RseSBvbmUgXCIvXCIgKHRoZSBMaWJyYXJ5XG4gKiBpbnNpZGUgQ29udHJvbCwgYC9saWJyYXJ5P3ZpZXc9ZGlzY292ZXJgKS4gUGFyc2luZyB0aGUgVVJMIChyYXRoZXIgdGhhblxuICogY29tcGFyaW5nIHN0cmluZ3MpIHJlamVjdHMgdXNlcmluZm8gYW5kIHByb3RvY29sLXJlbGF0aXZlIFVSTCB0cmlja3MuIEFcbiAqIHBhdGggd2l0aCBcIi8vXCIsIGEgYmFja3NsYXNoLCB3aGl0ZXNwYWNlIG9yIGEgY29udHJvbCBjaGFyYWN0ZXIgaXMgcmVmdXNlZDpcbiAqIGJyb3dzZXJzIHJlYWQgXCIvXFxldmlsLmNvbVwiLCBvciBhIHRhYiBhZnRlciB0aGUgZmlyc3Qgc2xhc2gsIGFzIGFub3RoZXIgaG9zdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpYnJhcnlSZXR1cm5VcmwgKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICF2YWx1ZSkgcmV0dXJuIG51bGxcbiAgaWYgKHZhbHVlLnN0YXJ0c1dpdGgoJy8nKSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4XG4gICAgcmV0dXJuIC9eXFwvKD8hWy9cXFxcXSlbXlxcXFxcXHNcXHgwMC1cXHgxZlxceDdmXSokLy50ZXN0KHZhbHVlKSA/IHZhbHVlIDogbnVsbFxuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTCh2YWx1ZSlcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSAnaHR0cHM6JyAmJiAhdXJsLnVzZXJuYW1lICYmICF1cmwucGFzc3dvcmQgJiZcbiAgICAgIChMSUJSQVJZX1JFVFVSTl9IT1NUUyBhcyByZWFkb25seSBzdHJpbmdbXSkuaW5jbHVkZXModXJsLmhvc3RuYW1lKSAmJiB1cmwucG9ydCA9PT0gJydcbiAgICAgID8gdXJsLmhyZWZcbiAgICAgIDogbnVsbFxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmNvbnN0IE1PTlRIUyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVxuY29uc3QgTU9OVEhTX0xPTkcgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxuXG5jb25zdCB0d28gPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgJzAnKVxuXG4vKiogT25lIGluaXRpYWwgZm9yIGFuIGF2YXRhciwgZnJvbSB0aGUgbmFtZSBvciB0aGUgYWRkcmVzcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsc09mIChuYW1lOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLCBlbWFpbD86IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2UgPSAobmFtZSB8fCAnJykudHJpbSgpIHx8IChlbWFpbCB8fCAnJykuc3BsaXQoJ0AnKVswXSB8fCAnPydcbiAgY29uc3Qgd29yZHMgPSBzb3VyY2Uuc3BsaXQoL1tcXHMuXy1dKy8pLmZpbHRlcihCb29sZWFuKVxuICBpZiAoIXdvcmRzLmxlbmd0aCkgcmV0dXJuICc/J1xuICByZXR1cm4gQXJyYXkuZnJvbSh3b3Jkc1swXSlbMF0udG9VcHBlckNhc2UoKVxufVxuXG4vKiogXCIxMSBPY3RcIiwgd2l0aCB0aGUgeWVhciB3aGVuIGl0IGlzbid0IHRoaXMgb25lLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRheVRleHQgKHNlY29uZHM6IG51bWJlciwgbm93OiBudW1iZXIgPSBEYXRlLm5vdygpKTogc3RyaW5nIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKHNlY29uZHMgKiAxMDAwKVxuICBjb25zdCB5ZWFyID0gZC5nZXRGdWxsWWVhcigpID09PSBuZXcgRGF0ZShub3cpLmdldEZ1bGxZZWFyKCkgPyAnJyA6IGAgJHtkLmdldEZ1bGxZZWFyKCl9YFxuICByZXR1cm4gYCR7ZC5nZXREYXRlKCl9ICR7TU9OVEhTW2QuZ2V0TW9udGgoKV19JHt5ZWFyfWBcbn1cblxuLyoqIFwiMTEgT2N0LCAyMTowNFwiLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoZW5UZXh0IChzZWNvbmRzOiBudW1iZXIsIG5vdzogbnVtYmVyID0gRGF0ZS5ub3coKSk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShzZWNvbmRzICogMTAwMClcbiAgcmV0dXJuIGAke2RheVRleHQoc2Vjb25kcywgbm93KX0sICR7dHdvKGQuZ2V0SG91cnMoKSl9OiR7dHdvKGQuZ2V0TWludXRlcygpKX1gXG59XG5cbi8qKiBcIlNlcHRlbWJlciAyMDI2XCIuICovXG5leHBvcnQgZnVuY3Rpb24gbW9udGhUZXh0IChzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBkID0gbmV3IERhdGUoc2Vjb25kcyAqIDEwMDApXG4gIHJldHVybiBgJHtNT05USFNfTE9OR1tkLmdldE1vbnRoKCldfSAke2QuZ2V0RnVsbFllYXIoKX1gXG59XG5cbi8qKiBcIm5vd1wiLCBcIjUgbWludXRlcyBhZ29cIiwgXCIyIGhvdXJzIGFnb1wiLCBcIjExIE9jdFwiLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFnb1RleHQgKHNlY29uZHM6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsIG5vdzogbnVtYmVyID0gRGF0ZS5ub3coKSk6IHN0cmluZyB7XG4gIGlmICghc2Vjb25kcykgcmV0dXJuICdub3Qgc2luY2UnXG4gIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLm1heCgwLCBNYXRoLnJvdW5kKChub3cgLyAxMDAwIC0gc2Vjb25kcykgLyA2MCkpXG4gIGlmIChtaW51dGVzIDwgMikgcmV0dXJuICdub3cnXG4gIGlmIChtaW51dGVzIDwgNjApIHJldHVybiBgJHttaW51dGVzfSBtaW51dGVzIGFnb2BcbiAgY29uc3QgaG91cnMgPSBNYXRoLnJvdW5kKG1pbnV0ZXMgLyA2MClcbiAgaWYgKGhvdXJzIDwgMjQpIHJldHVybiBob3VycyA9PT0gMSA/ICdhbiBob3VyIGFnbycgOiBgJHtob3Vyc30gaG91cnMgYWdvYFxuICByZXR1cm4gZGF5VGV4dChzZWNvbmRzLCBub3cpXG59XG5cbmNvbnN0IHBsdXJhbCA9IChuOiBudW1iZXIsIG9uZTogc3RyaW5nLCBtYW55ID0gYCR7b25lfXNgKSA9PiBgJHtufSAke24gPT09IDEgPyBvbmUgOiBtYW55fWBcblxuY29uc3QgUFJPVklERVJTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBhcHBsZTogJ0FwcGxlJywgZ29vZ2xlOiAnR29vZ2xlJyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlck5hbWUgKHByb3ZpZGVyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gUFJPVklERVJTW3Byb3ZpZGVyXSA/PyBwcm92aWRlci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3ZpZGVyLnNsaWNlKDEpXG59XG5cbi8qKiBcIjIgcGFzc2tleXMgwrcgVHdvLXN0ZXAgc2lnbi1pbiBvbiDCtyBHb29nbGUgbGlua2VkIMK3IFBhc3N3b3JkIHNldFwiLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ldGhvZHNMaW5lIChtZTogTWUpOiBzdHJpbmcge1xuICBjb25zdCBzID0gbWUuc2lnbl9pblxuICBpZiAoIXMpIHJldHVybiBtZS5hY2NvdW50Lmhhc19wYXNzd29yZCA/ICdQYXNzd29yZCBzZXQnIDogJydcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW11cbiAgaWYgKHMucGFzc2tleXMpIHBhcnRzLnB1c2gocGx1cmFsKHMucGFzc2tleXMsICdwYXNza2V5JykpXG4gIHBhcnRzLnB1c2gocy50d29fc3RlcCA/ICdUd28tc3RlcCBzaWduLWluIG9uJyA6ICdUd28tc3RlcCBzaWduLWluIG9mZicpXG4gIGZvciAoY29uc3QgcCBvZiBzLmlkZW50aXRpZXMpIHBhcnRzLnB1c2goYCR7cHJvdmlkZXJOYW1lKHApfSBsaW5rZWRgKVxuICBpZiAocy5wYXNzd29yZCkgcGFydHMucHVzaCgnUGFzc3dvcmQgc2V0JylcbiAgcmV0dXJuIHBhcnRzLmpvaW4oJyDCtyAnKVxufVxuXG5leHBvcnQgdHlwZSBIZWFsdGggPSAnZ29vZCcgfCAnZmFpcicgfCAnd2VhaydcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eUhlYWx0aCB7XG4gIGxldmVsOiBIZWFsdGg7XG4gIC8qKiBcIldlbGwgcHJvdGVjdGVkXCIuICovXG4gIHRpdGxlOiBzdHJpbmc7XG4gIC8qKiBXaGF0J3MgdGhlcmUsIG9yIHdoYXQgdG8gZG8uICovXG4gIGxpbmU6IHN0cmluZztcbn1cblxuLyoqXG4gKiBIb3cgd2VsbCB0aGUgYWNjb3VudCBpcyBwcm90ZWN0ZWQuIEdvb2Q6IGEgcGFzc2tleSBvciB0d28tc3RlcCBzaWduLWluLFxuICogYW5kIG1vcmUgdGhhbiBvbmUgd2F5IGluLCBzbyBsb3NpbmcgYSBwaG9uZSBkb2Vzbid0IGxvY2sgdGhlIHBlcnNvbiBvdXQuXG4gKiBXZWFrOiBhIHBhc3N3b3JkIGFuZCBub3RoaW5nIGVsc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWN1cml0eUhlYWx0aCAobWU6IE1lKTogU2VjdXJpdHlIZWFsdGgge1xuICBjb25zdCBzID0gbWUuc2lnbl9pbiA/PyB7IHBhc3N3b3JkOiAhIW1lLmFjY291bnQuaGFzX3Bhc3N3b3JkLCBwYXNza2V5czogMCwgaWRlbnRpdGllczogW10sIHR3b19zdGVwOiAhIW1lLmFjY291bnQudHdvX3N0ZXAgfVxuICBjb25zdCB3YXlzID0gKHMucGFzc3dvcmQgPyAxIDogMCkgKyBzLnBhc3NrZXlzICsgcy5pZGVudGl0aWVzLmxlbmd0aFxuICBjb25zdCBzdHJvbmcgPSBzLnBhc3NrZXlzID4gMCB8fCBzLnR3b19zdGVwXG4gIGlmIChzdHJvbmcgJiYgd2F5cyA+PSAyKSB7XG4gICAgY29uc3QgaGF2ZTogc3RyaW5nW10gPSBbXVxuICAgIGlmIChzLnBhc3NrZXlzKSBoYXZlLnB1c2gocGx1cmFsKHMucGFzc2tleXMsICdwYXNza2V5JykpXG4gICAgaWYgKHMudHdvX3N0ZXApIGhhdmUucHVzaCgndHdvLXN0ZXAgc2lnbi1pbiBpcyBvbicpXG4gICAgaWYgKHMudHdvX3N0ZXAgJiYgdHlwZW9mIHMucmVjb3ZlcnlfbGVmdCA9PT0gJ251bWJlcicpIGhhdmUucHVzaChgJHtzLnJlY292ZXJ5X2xlZnR9IHJlY292ZXJ5ICR7cy5yZWNvdmVyeV9sZWZ0ID09PSAxID8gJ2NvZGUgaXMnIDogJ2NvZGVzIGFyZSd9IGxlZnRgKVxuICAgIHJldHVybiB7IGxldmVsOiAnZ29vZCcsIHRpdGxlOiAnV2VsbCBwcm90ZWN0ZWQnLCBsaW5lOiBgJHtsaXN0VGV4dChoYXZlKS5yZXBsYWNlKC9eLi8sIGMgPT4gYy50b1VwcGVyQ2FzZSgpKX0uYCB9XG4gIH1cbiAgaWYgKCFzdHJvbmcpIHtcbiAgICByZXR1cm4geyBsZXZlbDogJ3dlYWsnLCB0aXRsZTogJ09ubHkgYSBwYXNzd29yZCBwcm90ZWN0cyB0aGlzIGFjY291bnQnLCBsaW5lOiAnQW55b25lIHdobyBsZWFybnMgaXQgY2FuIHJlYWNoIHlvdXIgcHJpbnRlcnMuIEFkZCBhIHBhc3NrZXkgb3IgdHVybiBvbiB0d28tc3RlcCBzaWduLWluLicgfVxuICB9XG4gIHJldHVybiB7IGxldmVsOiAnZmFpcicsIHRpdGxlOiAnT25lIHdheSBpbicsIGxpbmU6ICdBZGQgYSBzZWNvbmQgd2F5IHRvIHNpZ24gaW4uJyB9XG59XG5cbi8qKiBcImEsIGIgYW5kIGNcIi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0VGV4dCAoaXRlbXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgaWYgKGl0ZW1zLmxlbmd0aCA8PSAxKSByZXR1cm4gaXRlbXMuam9pbignJylcbiAgcmV0dXJuIGAke2l0ZW1zLnNsaWNlKDAsIC0xKS5qb2luKCcsICcpfSBhbmQgJHtpdGVtc1tpdGVtcy5sZW5ndGggLSAxXX1gXG59XG5cbi8qKiBBIGNsaWVudCBvZiB0aGUgY2VudHJhbCBsb2dpbiwgYXMgcGVvcGxlIGtub3cgaXQuICovXG5leHBvcnQgZnVuY3Rpb24gY2xpZW50TmFtZSAoY2xpZW50SWQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcbiAgc3dpdGNoIChjbGllbnRJZCkge1xuICAgIGNhc2UgJ2ZsdWlkZCc6IHJldHVybiAnQ29udHJvbCdcbiAgICBjYXNlICdzbGljZXInOiByZXR1cm4gJ1NsaWNlJ1xuICAgIGNhc2UgJ21vZGVscyc6IHJldHVybiAnTXVvbjNEIG1vZGVscydcbiAgICBjYXNlICdsaWJyYXJ5JzogcmV0dXJuICdMaWJyYXJ5J1xuICAgIGRlZmF1bHQ6IHJldHVybiBjbGllbnRJZCB8fCBudWxsXG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRGV2aWNlS2luZCA9ICdicm93c2VyJyB8ICdwaG9uZScgfCAnY29tcHV0ZXInXG5cbi8qKiBPbmUgZGV2aWNlLCBhcyB0aGUgRGV2aWNlcyBwYWdlIGxpc3RzIGl0OiBhIGJyb3dzZXIncyBzaWduLWluIGFuZCB3aGF0IGl0IG9wZW5lZCwgb3IgYW4gYXBwLiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZXZpY2Uge1xuICBpZDogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBraW5kOiBEZXZpY2VLaW5kO1xuICAvKiogXCJDb250cm9sIGFuZCBTbGljZVwiLCBcIk11b24zRCBhcHBcIi4gKi9cbiAgdXNlczogc3RyaW5nO1xuICBjdXJyZW50OiBib29sZWFuO1xuICBzaWduZWRJbkF0OiBudW1iZXI7XG4gIGxhc3RVc2VkQXQ6IG51bWJlciB8IG51bGw7XG4gIC8qKiBUaGUgc2hvcnQgZm9ybSBvZiB0aGUgcGhvbmUncyBJcm9oIGtleSwgZm9yIGFuIGFwcCAoQVBQLTQ0KS4gKi9cbiAgcGhvbmVLZXk6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBFdmVyeSBzZXNzaW9uIHRoYXQgc2lnbmluZyB0aGlzIGRldmljZSBvdXQgZW5kcy4gKi9cbiAgc2Vzc2lvbklkczogc3RyaW5nW107XG4gIC8qKiBBIGxlZ2FjeSBzZXNzaW9uIHRoZSBvbGQgc2lnbi1pbiBwYWdlIGxlZnQgYmVoaW5kIChLQU4tNTMyKTogaXQgZW5kcyBieSBpdHNlbGYuICovXG4gIGxlZnRvdmVyOiBib29sZWFuO1xufVxuXG5jb25zdCBQSE9ORSA9IC9pcGhvbmV8aXBhZHxhbmRyb2lkfHBpeGVsfGdhbGF4eXxwaG9uZS9pXG5cbmZ1bmN0aW9uIGtpbmRPZiAoczogU2Vzc2lvbik6IERldmljZUtpbmQge1xuICBpZiAocy5raW5kID09PSAnYnJvd3NlcicgfHwgcy5jbGllbnRfaWQpIHJldHVybiAnYnJvd3NlcidcbiAgcmV0dXJuIFBIT05FLnRlc3Qocy5kZXZpY2VfbGFiZWwgfHwgcy5kZXZpY2UpID8gJ3Bob25lJyA6ICdjb21wdXRlcidcbn1cblxuZnVuY3Rpb24gbGFiZWxPZiAoczogU2Vzc2lvbik6IHN0cmluZyB7XG4gIGlmIChzLmRldmljZV9sYWJlbCkgcmV0dXJuIHMuZGV2aWNlX2xhYmVsXG4gIGlmIChzLmtpbmQgPT09ICdicm93c2VyJyB8fCBzLmRldmljZSA9PT0gJ1dlYiBicm93c2VyJykgcmV0dXJuICdBIHdlYiBicm93c2VyJ1xuICBpZiAocy5kZXZpY2UgPT09ICdVbm5hbWVkIGRldmljZScpIHJldHVybiAnQSBkZXZpY2Ugd2l0aCBubyBuYW1lJ1xuICByZXR1cm4gcy5kZXZpY2Vcbn1cblxuLyoqIGA3YzFl4oCmYTk0ZmAuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvcnRLZXkgKGtleTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIWtleSkgcmV0dXJuIG51bGxcbiAgcmV0dXJuIGtleS5sZW5ndGggPiAxMCA/IGAke2tleS5zbGljZSgwLCA0KX3igKYke2tleS5zbGljZSgtNCl9YCA6IGtleVxufVxuXG4vKipcbiAqIFRoZSBhY2NvdW50J3Mgc2Vzc2lvbnMgYXMgZGV2aWNlcy4gQSBicm93c2VyJ3MgY2VudHJhbCBzaWduLWluIGFuZCB0aGVcbiAqIENvbnRyb2wgYW5kIFNsaWNlIHNlc3Npb25zIGl0IG9wZW5lZCBhcmUgb25lIGRldmljZTogZ3JvdXBlZCBieVxuICogYHBhcmVudF9pZGAuIExhYmVscyBhcmUgZGVzY3JpcHRpb25zLCBuZXZlciBkZXZpY2UgaWRlbnRpdGllcy5cbiAqIFRoZSBzZXNzaW9uIHRoZSBvbGQgc2lnbi1pbiBwYWdlIGxlZnQgYmVoaW5kIChcIk11b24zRCBzaWduLWluXCIpXG4gKiBpcyBpdHMgb3duIHJvdywgbWFya2VkLCBzbyBpdCBjYW4gc3RpbGwgYmUgc2lnbmVkIG91dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldmljZXNGcm9tIChzZXNzaW9uczogU2Vzc2lvbltdKTogRGV2aWNlW10ge1xuICBjb25zdCBkZXZpY2VzOiBEZXZpY2VbXSA9IFtdXG4gIGNvbnN0IGJ5UGFyZW50ID0gbmV3IE1hcDxzdHJpbmcsIERldmljZT4oKVxuICBjb25zdCBvcmRlcmVkID0gWy4uLnNlc3Npb25zXS5zb3J0KChhLCBiKSA9PiAoYS5raW5kID09PSAnYnJvd3NlcicgPyAwIDogMSkgLSAoYi5raW5kID09PSAnYnJvd3NlcicgPyAwIDogMSkgfHwgYS5jcmVhdGVkX2F0IC0gYi5jcmVhdGVkX2F0KVxuICBmb3IgKGNvbnN0IHMgb2Ygb3JkZXJlZCkge1xuICAgIGNvbnN0IHJvb3QgPSBzLnBhcmVudF9pZCB8fCBzLmlkXG4gICAgY29uc3QgaW50byA9IGJ5UGFyZW50LmdldChyb290KVxuICAgIGNvbnN0IGNsaWVudCA9IGNsaWVudE5hbWUocy5jbGllbnRfaWQpXG4gICAgaWYgKGludG8pIHtcbiAgICAgIGludG8uc2Vzc2lvbklkcy5wdXNoKHMuaWQpXG4gICAgICBpZiAoY2xpZW50ICYmICFpbnRvLnVzZXMuaW5jbHVkZXMoY2xpZW50KSkgaW50by51c2VzID0gaW50by51c2VzID8gYCR7aW50by51c2VzfSBhbmQgJHtjbGllbnR9YCA6IGNsaWVudFxuICAgICAgaW50by5jdXJyZW50ID0gaW50by5jdXJyZW50IHx8IHMuY3VycmVudFxuICAgICAgaW50by5sYXN0VXNlZEF0ID0gTWF0aC5tYXgoaW50by5sYXN0VXNlZEF0ID8/IDAsIHMubGFzdF91c2VkX2F0ID8/IDApIHx8IG51bGxcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIGNvbnN0IGtpbmQgPSBraW5kT2YocylcbiAgICBjb25zdCBsZWZ0b3ZlciA9IHMua2luZCA9PT0gJ2xlZ2FjeScgJiYgcy5kZXZpY2UgPT09ICdNdW9uM0Qgc2lnbi1pbidcbiAgICBjb25zdCBkZXZpY2U6IERldmljZSA9IHtcbiAgICAgIGlkOiBzLmlkLFxuICAgICAgbGFiZWw6IGxlZnRvdmVyID8gJ0FuIG9sZCB3ZWIgc2lnbi1pbicgOiBsYWJlbE9mKHMpLFxuICAgICAga2luZCxcbiAgICAgIHVzZXM6IGxlZnRvdmVyID8gJ0VuZHMgYnkgaXRzZWxmJyA6IGNsaWVudCA/PyAoa2luZCA9PT0gJ2Jyb3dzZXInID8gJycgOiAnTXVvbjNEIGFwcCcpLFxuICAgICAgY3VycmVudDogcy5jdXJyZW50LFxuICAgICAgc2lnbmVkSW5BdDogcy5jcmVhdGVkX2F0LFxuICAgICAgbGFzdFVzZWRBdDogcy5sYXN0X3VzZWRfYXQsXG4gICAgICBwaG9uZUtleToga2luZCA9PT0gJ2Jyb3dzZXInID8gbnVsbCA6IHNob3J0S2V5KHMuZW5kcG9pbnRfaWQpLFxuICAgICAgc2Vzc2lvbklkczogW3MuaWRdLFxuICAgICAgbGVmdG92ZXJcbiAgICB9XG4gICAgZGV2aWNlcy5wdXNoKGRldmljZSlcbiAgICBieVBhcmVudC5zZXQocm9vdCwgZGV2aWNlKVxuICB9XG4gIC8vIFRoaXMgZGV2aWNlIGZpcnN0LCB0aGVuIHRoZSBtb3N0IHJlY2VudGx5IHVzZWQuXG4gIHJldHVybiBkZXZpY2VzLnNvcnQoKGEsIGIpID0+IE51bWJlcihiLmN1cnJlbnQpIC0gTnVtYmVyKGEuY3VycmVudCkgfHwgKGIubGFzdFVzZWRBdCA/PyBiLnNpZ25lZEluQXQpIC0gKGEubGFzdFVzZWRBdCA/PyBhLnNpZ25lZEluQXQpKVxufVxuXG4vKiogVGhlIGRldmljZXMsIG5vdCB0aGUgc2Vzc2lvbnMgb3IgdGhlIGxlZnRvdmVycywgaW4gd29yZHM6IFwiVGhpcyBicm93c2VyLCBKYWNrJ3MgaVBob25lIGFuZCBhIE1hY0Jvb2suXCIgKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXZpY2VzTGluZSAoZGV2aWNlczogRGV2aWNlW10pOiBzdHJpbmcge1xuICBjb25zdCBuYW1lcyA9IGRldmljZXMuZmlsdGVyKGQgPT4gIWQubGVmdG92ZXIpLm1hcChkID0+IGQuY3VycmVudCA/ICd0aGlzIGJyb3dzZXInIDogZC5sYWJlbClcbiAgY29uc3QgdGV4dCA9IGxpc3RUZXh0KG5hbWVzKVxuICByZXR1cm4gdGV4dCA/IGAke3RleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCl9JHt0ZXh0LnNsaWNlKDEpfS5gIDogJydcbn1cblxuLyoqIEhvdyBtYW55IGRldmljZXMgYXJlIHNpZ25lZCBpbiwgdGhlIGxlZnRvdmVycyBhc2lkZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXZpY2VDb3VudCAoZGV2aWNlczogRGV2aWNlW10pOiBudW1iZXIge1xuICByZXR1cm4gZGV2aWNlcy5maWx0ZXIoZCA9PiAhZC5sZWZ0b3ZlcikubGVuZ3RoXG59XG5cbmV4cG9ydCB0eXBlIEV2ZW50SWNvbiA9ICdzaWduSW4nIHwgJ3NpZ25PdXQnIHwgJ2tleScgfCAnc2hpZWxkJyB8ICd1c2VyUGx1cycgfCAndXNlck1pbnVzJyB8ICdtYWlsJyB8ICdsb2NrJyB8ICdhbGVydCcgfCAnbGluaydcblxuZXhwb3J0IGludGVyZmFjZSBFdmVudExpbmUge1xuICBpY29uOiBFdmVudEljb247XG4gIHRleHQ6IHN0cmluZztcbn1cblxuY29uc3QgcyA9ICh2OiB1bmtub3duKSA9PiAodHlwZW9mIHYgPT09ICdzdHJpbmcnID8gdiA6ICcnKVxuXG4vKiogT25lIGxpbmUgb2YgdGhlIGFjY291bnQncyBoaXN0b3J5LCBpbiB3b3Jkcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBldmVudExpbmUgKGU6IEFjY291bnRFdmVudCwgcHJpbnRlck5hbWU6IChpZDogc3RyaW5nKSA9PiBzdHJpbmcgPSBpZCA9PiBpZCk6IEV2ZW50TGluZSB7XG4gIGNvbnN0IGQgPSBlLmRldGFpbCA/PyB7fVxuICBjb25zdCBwcmludGVyID0gKCkgPT4gcHJpbnRlck5hbWUocyhkLnByaW50ZXJfaWQpKVxuICBzd2l0Y2ggKGUua2luZCkge1xuICAgIGNhc2UgJ3NpZ25faW4nOiByZXR1cm4geyBpY29uOiAnc2lnbkluJywgdGV4dDogZC5tZXRob2QgPT09ICdwYXNza2V5JyA/ICdTaWduZWQgaW4gd2l0aCBhIHBhc3NrZXknIDogJ1NpZ25lZCBpbicgfVxuICAgIGNhc2UgJ3NpZ25fb3V0JzogcmV0dXJuIHsgaWNvbjogJ3NpZ25PdXQnLCB0ZXh0OiAnU2lnbmVkIG91dCcgfVxuICAgIGNhc2UgJ3NpZ25lZF9vdXRfZXZlcnl3aGVyZSc6IHJldHVybiB7IGljb246ICdzaWduT3V0JywgdGV4dDogJ1NpZ25lZCBvdXQgZXZlcnl3aGVyZScgfVxuICAgIGNhc2UgJ2RldmljZV9zaWduZWRfb3V0JzogcmV0dXJuIHsgaWNvbjogJ3NpZ25PdXQnLCB0ZXh0OiAnU2lnbmVkIGEgZGV2aWNlIG91dCcgfVxuICAgIGNhc2UgJ3Bhc3NrZXlfYWRkZWQnOiByZXR1cm4geyBpY29uOiAna2V5JywgdGV4dDogYFBhc3NrZXkgYWRkZWQ6ICR7cyhkLm5hbWUpIHx8ICdhIHBhc3NrZXknfWAgfVxuICAgIGNhc2UgJ3Bhc3NrZXlfcmVtb3ZlZCc6IHJldHVybiB7IGljb246ICdrZXknLCB0ZXh0OiBgUGFzc2tleSByZW1vdmVkOiAke3MoZC5uYW1lKSB8fCAnYSBwYXNza2V5J31gIH1cbiAgICBjYXNlICdwYXNza2V5X3JlbmFtZWQnOiByZXR1cm4geyBpY29uOiAna2V5JywgdGV4dDogYFBhc3NrZXkgcmVuYW1lZDogJHtzKGQubmFtZSkgfHwgJ2EgcGFzc2tleSd9YCB9XG4gICAgY2FzZSAncGFzc3dvcmRfY2hhbmdlZCc6IHJldHVybiB7IGljb246ICdsb2NrJywgdGV4dDogJ1Bhc3N3b3JkIGNoYW5nZWQnIH1cbiAgICBjYXNlICdwYXNzd29yZF9yZXNldCc6IHJldHVybiB7IGljb246ICdsb2NrJywgdGV4dDogJ1Bhc3N3b3JkIHJlc2V0IGZyb20gYW4gZW1haWwgbGluaycgfVxuICAgIGNhc2UgJ3R3b19zdGVwX29uJzogcmV0dXJuIHsgaWNvbjogJ3NoaWVsZCcsIHRleHQ6ICdUd28tc3RlcCBzaWduLWluIHR1cm5lZCBvbicgfVxuICAgIGNhc2UgJ3R3b19zdGVwX29mZic6IHJldHVybiB7IGljb246ICdzaGllbGQnLCB0ZXh0OiAnVHdvLXN0ZXAgc2lnbi1pbiB0dXJuZWQgb2ZmJyB9XG4gICAgY2FzZSAncmVjb3ZlcnlfY29kZV91c2VkJzogcmV0dXJuIHsgaWNvbjogJ3NoaWVsZCcsIHRleHQ6IGBBIHJlY292ZXJ5IGNvZGUgd2FzIHVzZWQke3R5cGVvZiBkLmxlZnQgPT09ICdudW1iZXInID8gYDsgJHtkLmxlZnR9IGxlZnRgIDogJyd9YCB9XG4gICAgY2FzZSAncmVjb3ZlcnlfY29kZXNfcmVuZXdlZCc6IHJldHVybiB7IGljb246ICdzaGllbGQnLCB0ZXh0OiAnTmV3IHJlY292ZXJ5IGNvZGVzIG1hZGUnIH1cbiAgICBjYXNlICdlbWFpbF9jaGFuZ2VfcmVxdWVzdGVkJzogcmV0dXJuIHsgaWNvbjogJ21haWwnLCB0ZXh0OiBgQXNrZWQgdG8gY2hhbmdlIHRoZSBlbWFpbCBhZGRyZXNzIHRvICR7cyhkLnRvKX1gIH1cbiAgICBjYXNlICdpZGVudGl0eV9saW5rZWQnOiByZXR1cm4geyBpY29uOiAnbGluaycsIHRleHQ6IGAke3Byb3ZpZGVyTmFtZShzKGQucHJvdmlkZXIpKX0gbGlua2VkYCB9XG4gICAgY2FzZSAnaWRlbnRpdHlfdW5saW5rZWQnOiByZXR1cm4geyBpY29uOiAnbGluaycsIHRleHQ6IGAke3Byb3ZpZGVyTmFtZShzKGQucHJvdmlkZXIpKX0gdW5saW5rZWRgIH1cbiAgICBjYXNlICdwcmludGVyX3NoYXJlZCc6IHJldHVybiB7IGljb246ICd1c2VyUGx1cycsIHRleHQ6IGBZb3UgbGV0ICR7cyhkLmVtYWlsKX0gdXNlICR7cHJpbnRlcigpfSR7ZC5yb2xlID8gYCwgYXMgJHtkLnJvbGUgPT09ICd2aWV3ZXInID8gJ2EgVmlld2VyJyA6ICdhbiBPcGVyYXRvcid9YCA6ICcnfWAgfVxuICAgIGNhc2UgJ3ByaW50ZXJfaW52aXRlZCc6IHJldHVybiB7IGljb246ICd1c2VyUGx1cycsIHRleHQ6IGBZb3UgaW52aXRlZCAke3MoZC5lbWFpbCl9IHRvIHVzZSAke3ByaW50ZXIoKX1gIH1cbiAgICBjYXNlICdpbnZpdGVfYWNjZXB0ZWQnOiByZXR1cm4geyBpY29uOiAndXNlclBsdXMnLCB0ZXh0OiBgJHtzKGQuZW1haWwpfSBhY2NlcHRlZCB5b3VyIGludml0ZSB0byAke3ByaW50ZXIoKX1gIH1cbiAgICBjYXNlICdwcmludGVyX3Vuc2hhcmVkJzogcmV0dXJuIHsgaWNvbjogJ3VzZXJNaW51cycsIHRleHQ6IGAke3MoZC5lbWFpbCl9IGNhbiBubyBsb25nZXIgdXNlICR7cHJpbnRlcigpfWAgfVxuICAgIGNhc2UgJ3NoYXJlX2VuZGVkJzogcmV0dXJuIHsgaWNvbjogJ3VzZXJNaW51cycsIHRleHQ6IGAke3MoZC5lbWFpbCl9J3MgYWNjZXNzIHRvICR7cHJpbnRlcigpfSBlbmRlZGAgfVxuICAgIGNhc2UgJ2pvaW5fcmVxdWVzdGVkJzogcmV0dXJuIHsgaWNvbjogJ3VzZXJQbHVzJywgdGV4dDogYCR7cyhkLmVtYWlsKX0gYXNrZWQgdG8gdXNlICR7cHJpbnRlcigpfWAgfVxuICAgIGNhc2UgJ2pvaW5lZF9ieV9saW5rJzogcmV0dXJuIHsgaWNvbjogJ3VzZXJQbHVzJywgdGV4dDogYCR7cyhkLmVtYWlsKX0gam9pbmVkICR7cHJpbnRlcigpfSB3aXRoIGFuIGludml0ZSBsaW5rYCB9XG4gICAgY2FzZSAnaW52aXRlX2xpbmtfY3JlYXRlZCc6IHJldHVybiB7IGljb246ICdsaW5rJywgdGV4dDogYEludml0ZSBsaW5rIG1hZGUgZm9yICR7cHJpbnRlcigpfWAgfVxuICAgIGNhc2UgJ2ludml0ZV9saW5rX3Jldm9rZWQnOiByZXR1cm4geyBpY29uOiAnbGluaycsIHRleHQ6IGBJbnZpdGUgbGluayBmb3IgJHtwcmludGVyKCl9IHR1cm5lZCBvZmZgIH1cbiAgICBjYXNlICdhcHBfZGlzY29ubmVjdGVkJzoge1xuICAgICAgY29uc3QgbiA9IHR5cGVvZiBkLnNlc3Npb25zID09PSAnbnVtYmVyJyA/IGQuc2Vzc2lvbnMgOiAwXG4gICAgICByZXR1cm4geyBpY29uOiAnbGluaycsIHRleHQ6IG4gPyBgRGlzY29ubmVjdGVkIGEgY29ubmVjdGVkIGFwcCBhbmQgZW5kZWQgaXRzICR7biA9PT0gMSA/ICdzaWduLWluJyA6IGAke259IHNpZ24taW5zYH1gIDogJ0Rpc2Nvbm5lY3RlZCBhIGNvbm5lY3RlZCBhcHAnIH1cbiAgICB9XG4gICAgY2FzZSAncmVmcmVzaF90b2tlbl9yZXVzZWQnOiByZXR1cm4geyBpY29uOiAnYWxlcnQnLCB0ZXh0OiAnQSBzaWduLWluIHdhcyB1c2VkIHR3aWNlLCBzbyBpdCB3YXMgZW5kZWQnIH1cbiAgICBjYXNlICdkZWxldGlvbl9yZXF1ZXN0ZWQnOiByZXR1cm4geyBpY29uOiAnYWxlcnQnLCB0ZXh0OiAnRGVsZXRpb24gb2YgdGhlIGFjY291bnQgYXNrZWQgZm9yJyB9XG4gICAgY2FzZSAnZGVsZXRpb25fY2FuY2VsbGVkJzogcmV0dXJuIHsgaWNvbjogJ2FsZXJ0JywgdGV4dDogJ0RlbGV0aW9uIG9mIHRoZSBhY2NvdW50IGNhbmNlbGxlZCcgfVxuICAgIGRlZmF1bHQ6IHJldHVybiB7IGljb246ICdhbGVydCcsIHRleHQ6IGUua2luZC5yZXBsYWNlKC9fL2csICcgJykucmVwbGFjZSgvXi4vLCBjID0+IGMudG9VcHBlckNhc2UoKSkgfVxuICB9XG59XG5cbi8qKiBUaGUgQWNjb3VudCBhcmVhJ3Mgc2VjdGlvbnMsIGluIHRoZSBsaXN0J3Mgb3JkZXIuICovXG5leHBvcnQgdHlwZSBBY2NvdW50U2VjdGlvbklkID1cbiAgJ292ZXJ2aWV3JyB8ICdwcm9maWxlJyB8ICdzZWN1cml0eScgfCAnc2Vzc2lvbnMnIHwgJ3ByaW50ZXJzJyB8ICd0b2tlbnMnIHwgJ2FwcHMnIHwgJ25vdGlmaWNhdGlvbnMnIHwgJ2xpYnJhcnknIHwgJ3BsYW4nIHwgJ3ByaXZhY3knIHwgJ2RlbGV0ZSdcblxuZXhwb3J0IGludGVyZmFjZSBBY2NvdW50U2VjdGlvbiB7XG4gIGlkOiBBY2NvdW50U2VjdGlvbklkO1xuICBsYWJlbDogc3RyaW5nO1xuICBpY29uOiBzdHJpbmc7XG4gIC8qKiBJbiB0aGUgbGlzdCBvbmx5IG9uY2UgaXRzIHBhZ2UgZXhpc3RzLiAqL1xuICBidWlsdDogYm9vbGVhbjtcbiAgLyoqIFRoZSBuYXYgZ3JvdXAgaXQgc2l0cyBpbjogWW91LCBBY2Nlc3MsIEV2ZXJ5dGhpbmcgZWxzZSAoc2V0dGluZ3MvTUFQLm1kKS4gTm9uZTogcmVhY2hlZCBmcm9tIGFub3RoZXIgcGFnZS4gKi9cbiAgZ3JvdXA/OiBBY2NvdW50TmF2R3JvdXA7XG59XG5cbmV4cG9ydCB0eXBlIEFjY291bnROYXZHcm91cCA9ICdZb3UnIHwgJ0FjY2VzcycgfCAnRXZlcnl0aGluZyBlbHNlJ1xuXG5leHBvcnQgY29uc3QgQUNDT1VOVF9OQVZfR1JPVVBTOiBBY2NvdW50TmF2R3JvdXBbXSA9IFsnWW91JywgJ0FjY2VzcycsICdFdmVyeXRoaW5nIGVsc2UnXVxuXG4vKipcbiAqIFRoZSBuYXYgKENvbnRyb2wgdjMsIHNldHRpbmdzL01BUC5tZCBhbmQgUEVPUExFLUFDQ0VTUy5tZCBKMTIpOiBcIllvdXJcbiAqIGRldmljZXNcIiB3YXMgRGV2aWNlcyBhbmQgc2Vzc2lvbnM7IFwiQXBwcyBhbmQgYWdlbnRzXCIgaG9sZHMgQ29ubmVjdGVkIGFwcHNcbiAqIGFuZCBBY2Nlc3MgdG9rZW5zOyBcIllvdXIgZGF0YVwiIGhvbGRzIFByaXZhY3kgYW5kIERlbGV0ZSBhY2NvdW50LiBUaGVcbiAqIG92ZXJ2aWV3IGlzIHRoZSBsYW5kaW5nIHBhZ2UsIGFuZCBEZWxldGUgYWNjb3VudCBvcGVucyBmcm9tIFlvdXIgZGF0YS5cbiAqL1xuZXhwb3J0IGNvbnN0IEFDQ09VTlRfU0VDVElPTlM6IEFjY291bnRTZWN0aW9uW10gPSBbXG4gIHsgaWQ6ICdvdmVydmlldycsIGxhYmVsOiAnT3ZlcnZpZXcnLCBpY29uOiAndXNlcicsIGJ1aWx0OiB0cnVlIH0sXG4gIHsgaWQ6ICdwcm9maWxlJywgbGFiZWw6ICdQcm9maWxlJywgaWNvbjogJ2lkQ2FyZCcsIGJ1aWx0OiB0cnVlLCBncm91cDogJ1lvdScgfSxcbiAgeyBpZDogJ3NlY3VyaXR5JywgbGFiZWw6ICdTaWduLWluIGFuZCBzZWN1cml0eScsIGljb246ICdzaGllbGQnLCBidWlsdDogdHJ1ZSwgZ3JvdXA6ICdZb3UnIH0sXG4gIHsgaWQ6ICdwcmludGVycycsIGxhYmVsOiAnUHJpbnRlcnMgYW5kIGFjY2VzcycsIGljb246ICdwcmludGVyJywgYnVpbHQ6IHRydWUsIGdyb3VwOiAnQWNjZXNzJyB9LFxuICB7IGlkOiAnc2Vzc2lvbnMnLCBsYWJlbDogJ1lvdXIgZGV2aWNlcycsIGljb246ICdkZXZpY2VzJywgYnVpbHQ6IHRydWUsIGdyb3VwOiAnQWNjZXNzJyB9LFxuICB7IGlkOiAnYXBwcycsIGxhYmVsOiAnQXBwcyBhbmQgYWdlbnRzJywgaWNvbjogJ2xpbmsnLCBidWlsdDogdHJ1ZSwgZ3JvdXA6ICdBY2Nlc3MnIH0sXG4gIC8vIE1lcmdlZCBpbnRvIEFwcHMgYW5kIGFnZW50czsgaXRzIG9sZCBhZGRyZXNzIG9wZW5zIHRoYXQgcGFnZS5cbiAgeyBpZDogJ3Rva2VucycsIGxhYmVsOiAnQWNjZXNzIHRva2VucycsIGljb246ICdrZXknLCBidWlsdDogZmFsc2UgfSxcbiAgeyBpZDogJ25vdGlmaWNhdGlvbnMnLCBsYWJlbDogJ05vdGlmaWNhdGlvbnMnLCBpY29uOiAnYmVsbCcsIGJ1aWx0OiB0cnVlLCBncm91cDogJ0V2ZXJ5dGhpbmcgZWxzZScgfSxcbiAgeyBpZDogJ2xpYnJhcnknLCBsYWJlbDogJ0xpYnJhcnkgYW5kIHN0b3JhZ2UnLCBpY29uOiAnbGlicmFyeScsIGJ1aWx0OiB0cnVlLCBncm91cDogJ0V2ZXJ5dGhpbmcgZWxzZScgfSxcbiAgeyBpZDogJ3BsYW4nLCBsYWJlbDogJ1BsYW4nLCBpY29uOiAnY2FyZCcsIGJ1aWx0OiB0cnVlLCBncm91cDogJ0V2ZXJ5dGhpbmcgZWxzZScgfSxcbiAgeyBpZDogJ3ByaXZhY3knLCBsYWJlbDogJ1lvdXIgZGF0YScsIGljb246ICdleWUnLCBidWlsdDogdHJ1ZSwgZ3JvdXA6ICdFdmVyeXRoaW5nIGVsc2UnIH0sXG4gIHsgaWQ6ICdkZWxldGUnLCBsYWJlbDogJ0RlbGV0ZSBhY2NvdW50JywgaWNvbjogJ3RyYXNoJywgYnVpbHQ6IHRydWUgfVxuXVxuXG4vKiogQWRkcmVzc2VzIHRoYXQgbmFtZSBhIHNlY3Rpb24gYnkgYW5vdGhlciBuYW1lOiBgL2FjY291bnQvZGV2aWNlc2AgaXMgWW91ciBkZXZpY2VzLCBgL2FjY291bnQvdG9rZW5zYCBBcHBzIGFuZCBhZ2VudHMuICovXG5leHBvcnQgY29uc3QgQUNDT1VOVF9TRUNUSU9OX0FMSUFTRVM6IFJlY29yZDxzdHJpbmcsIEFjY291bnRTZWN0aW9uSWQ+ID0geyBkZXZpY2VzOiAnc2Vzc2lvbnMnLCB0b2tlbnM6ICdhcHBzJywgZGF0YTogJ3ByaXZhY3knIH1cblxuLyoqIFRoZSBuYXYgaXRlbSBhIHNlY3Rpb24gbGlnaHRzIHVwOiBEZWxldGUgYWNjb3VudCBzaXRzIGluc2lkZSBZb3VyIGRhdGEuICovXG5leHBvcnQgZnVuY3Rpb24gYWNjb3VudE5hdklkIChpZDogQWNjb3VudFNlY3Rpb25JZCk6IEFjY291bnRTZWN0aW9uSWQge1xuICByZXR1cm4gaWQgPT09ICdkZWxldGUnID8gJ3ByaXZhY3knIDogaWRcbn1cblxuLyoqIFRoZSBzZWN0aW9ucyB0aGUgbGlzdCBzaG93cy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY2NvdW50U2VjdGlvbnMgKCk6IEFjY291bnRTZWN0aW9uW10ge1xuICByZXR1cm4gQUNDT1VOVF9TRUNUSU9OUy5maWx0ZXIoc2VjdGlvbiA9PiBzZWN0aW9uLmJ1aWx0KVxufVxuXG4vKiogVGhlIHNlY3Rpb24gYW4gYWRkcmVzcyBuYW1lcywgb3IgdGhlIG92ZXJ2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjY291bnRTZWN0aW9uRm9yIChpZDogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IEFjY291bnRTZWN0aW9uIHtcbiAgY29uc3QgbmFtZWQgPSAoaWQgJiYgQUNDT1VOVF9TRUNUSU9OX0FMSUFTRVNbaWRdKSB8fCBpZFxuICByZXR1cm4gYWNjb3VudFNlY3Rpb25zKCkuZmluZChzZWN0aW9uID0+IHNlY3Rpb24uaWQgPT09IG5hbWVkKSA/PyBBQ0NPVU5UX1NFQ1RJT05TWzBdXG59XG5cbi8qKiBUaGUgbmF2J3MgZ3JvdXBzLCBlYWNoIHdpdGggaXRzIHNlY3Rpb25zIGluIG9yZGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjY291bnROYXYgKHNlY3Rpb25zOiBBY2NvdW50U2VjdGlvbltdID0gYWNjb3VudFNlY3Rpb25zKCkpOiBBcnJheTx7IGdyb3VwOiBBY2NvdW50TmF2R3JvdXAsIHNlY3Rpb25zOiBBY2NvdW50U2VjdGlvbltdIH0+IHtcbiAgcmV0dXJuIEFDQ09VTlRfTkFWX0dST1VQU1xuICAgIC5tYXAoZ3JvdXAgPT4gKHsgZ3JvdXAsIHNlY3Rpb25zOiBzZWN0aW9ucy5maWx0ZXIoc2VjdGlvbiA9PiBzZWN0aW9uLmdyb3VwID09PSBncm91cCkgfSkpXG4gICAgLmZpbHRlcihlbnRyeSA9PiBlbnRyeS5zZWN0aW9ucy5sZW5ndGgpXG59XG4iXSwibWFwcGluZ3MiOiJBQVFPLGFBQU0sdUJBQXVCLENBQUMsc0JBQXNCLDRCQUE0QjtBQVVoRixnQkFBUyxpQkFBa0IsT0FBK0I7QUFDL0QsTUFBSSxPQUFPLFVBQVUsWUFBWSxDQUFDLE1BQU8sUUFBTztBQUNoRCxNQUFJLE1BQU0sV0FBVyxHQUFHLEdBQUc7QUFFekIsV0FBTyxxQ0FBcUMsS0FBSyxLQUFLLElBQUksUUFBUTtBQUFBLEVBQ3BFO0FBQ0EsTUFBSTtBQUNGLFVBQU0sTUFBTSxJQUFJLElBQUksS0FBSztBQUN6QixXQUFPLElBQUksYUFBYSxZQUFZLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxZQUN2RCxxQkFBMkMsU0FBUyxJQUFJLFFBQVEsS0FBSyxJQUFJLFNBQVMs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