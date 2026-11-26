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
import { Component, Mixins } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import StateMixin from "/src/mixins/state.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import { inspectTypedGcode } from "/src/services/console/typed-gcode.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { printerTransportBinding } from "/src/services/managed-session/httpTransportBinding.ts";
import { isManagedApiUrl } from "/src/services/muon-cloud/origin.ts";
import { grantedRoleFor } from "/src/services/muon-ble/granted-role.ts";
import { remoteRouteLabel } from "/src/services/muon-ble/link.ts";
let TypedCommandsMixin = class extends Mixins(StateMixin) {
  commandRefusal = "";
  get commandTarget() {
    return JSON.stringify([
      this.$store.state.config.apiUrl,
      cloudState.activePrinterId,
      this.$route?.params?.printer ?? null,
      cloudState.account?.id ?? null
    ]);
  }
  get commandControlAvailable() {
    if (!this.socketConnected || !this.apiConnected || !this.authenticated) return false;
    const remote = isManagedApiUrl(this.$store.state.config.apiUrl);
    if (remote !== printerTransportBinding.remote) return false;
    if (!remote) return true;
    const held = cloudState.printers.find((p) => p.id === cloudState.activePrinterId);
    if (held) return held.role === "operator";
    const id = cloudState.activePrinterId;
    return !!id && remoteRouteLabel(id) === "Via Bluetooth" && grantedRoleFor(id) === "operator";
  }
  get restartRefusal() {
    if (!this.commandControlAvailable) return "Not sent. Connect to a printer you can control first.";
    if (this.printerBusy) return "Not sent. Wait until the printer has finished and is no longer paused or busy.";
    if (this.printerState === "loading" && !["error", "shutdown"].includes(this.klippyState.toLowerCase())) return "Not sent. Wait for the printer status before restarting.";
    return "";
  }
  async confirmCommandRestart(kind = "restart") {
    this.commandRefusal = this.restartRefusal;
    if (this.commandRefusal) return false;
    const target = this.commandTarget;
    const ok = await this.$confirm(kind === "save" ? "Saving keeps the new results in printer.cfg. Klipper restarts to use them. The printer must be idle." : "Klipper reloads its settings. The printer must be idle before it can restart.", {
      title: kind === "save" ? "Save the results?" : "Restart Klipper?",
      buttonTrueText: kind === "save" ? "Save and restart Klipper" : "Restart",
      buttonFalseText: "Keep running",
      danger: true
    });
    if (!ok) return false;
    this.commandRefusal = target !== this.commandTarget ? "Not sent. The selected printer or account changed. Try again." : this.restartRefusal;
    return !this.commandRefusal;
  }
  async sendTypedGcode(gcode) {
    this.commandRefusal = "";
    if (!gcode.trim()) return false;
    if (!this.commandControlAvailable) {
      this.commandRefusal = "Not sent. Connect to a printer you can control first.";
      return false;
    }
    const batch = inspectTypedGcode(gcode, this.$store.state.printer.printer.configfile);
    this.commandRefusal = batch.refusal ?? "";
    if (this.commandRefusal) return false;
    if (batch.savesConfig && (!this.klippyConnected || !this.klippyReady)) {
      this.commandRefusal = "Not sent. Klipper must be running to save settings.";
      return false;
    }
    if (!this.klippyConnected && !(batch.restarts && batch.onlyRestarts)) {
      this.commandRefusal = "Not sent. Klipper is not connected.";
      return false;
    }
    if (batch.restarts && !await this.confirmCommandRestart()) return false;
    if (batch.savesConfig && (!this.klippyConnected || !this.klippyReady)) {
      this.commandRefusal = "Not sent. Klipper must be running to save settings.";
      return false;
    }
    if (!this.klippyConnected && !batch.onlyRestarts) {
      this.commandRefusal = "Not sent. Klipper is not connected.";
      return false;
    }
    this.commandRefusal = inspectTypedGcode(gcode, this.$store.state.printer.printer.configfile).refusal ?? "";
    if (this.commandRefusal) return false;
    if (gcode.toLowerCase() === "m112") SocketActions.printerEmergencyStop();
    this.sendGcode(gcode);
    return true;
  }
};
TypedCommandsMixin = __decorateClass([
  Component
], TypedCommandsMixin);
export {
  TypedCommandsMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInR5cGVkLWNvbW1hbmRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTWl4aW5zIH0gZnJvbSAndnVlLXByb3BlcnR5LWRlY29yYXRvcidcbmltcG9ydCBTdGF0ZU1peGluIGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgeyBTb2NrZXRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvc29ja2V0QWN0aW9ucydcbmltcG9ydCB7IGluc3BlY3RUeXBlZEdjb2RlIH0gZnJvbSAnQC9zZXJ2aWNlcy9jb25zb2xlL3R5cGVkLWdjb2RlJ1xuaW1wb3J0IHsgY2xvdWRTdGF0ZSB9IGZyb20gJ0Avc2VydmljZXMvbXVvbi1jbG91ZC9zdGF0ZSdcbmltcG9ydCB7IHByaW50ZXJUcmFuc3BvcnRCaW5kaW5nIH0gZnJvbSAnQC9zZXJ2aWNlcy9tYW5hZ2VkLXNlc3Npb24vaHR0cFRyYW5zcG9ydEJpbmRpbmcnXG5pbXBvcnQgeyBpc01hbmFnZWRBcGlVcmwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvb3JpZ2luJ1xuaW1wb3J0IHsgZ3JhbnRlZFJvbGVGb3IgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2dyYW50ZWQtcm9sZSdcbmltcG9ydCB7IHJlbW90ZVJvdXRlTGFiZWwgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL2xpbmsnXG5cbi8qKiBUeXBlZCBlbnRyeSBwb2ludHMgc2hhcmUgdGhpcyBwcmVmbGlnaHQvc2VuZCBwYXRoOyBwYW5lbC1nZW5lcmF0ZWQgRy1jb2RlIHN0YXlzIGluIFN0YXRlTWl4aW4uICovXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUeXBlZENvbW1hbmRzTWl4aW4gZXh0ZW5kcyBNaXhpbnMoU3RhdGVNaXhpbikge1xuICBjb21tYW5kUmVmdXNhbCA9ICcnXG5cbiAgZ2V0IGNvbW1hbmRUYXJnZXQgKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KFtcbiAgICAgIHRoaXMuJHN0b3JlLnN0YXRlLmNvbmZpZy5hcGlVcmwsXG4gICAgICBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZCxcbiAgICAgIHRoaXMuJHJvdXRlPy5wYXJhbXM/LnByaW50ZXIgPz8gbnVsbCxcbiAgICAgIGNsb3VkU3RhdGUuYWNjb3VudD8uaWQgPz8gbnVsbFxuICAgIF0pXG4gIH1cblxuICBnZXQgY29tbWFuZENvbnRyb2xBdmFpbGFibGUgKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5zb2NrZXRDb25uZWN0ZWQgfHwgIXRoaXMuYXBpQ29ubmVjdGVkIHx8ICF0aGlzLmF1dGhlbnRpY2F0ZWQpIHJldHVybiBmYWxzZVxuICAgIGNvbnN0IHJlbW90ZSA9IGlzTWFuYWdlZEFwaVVybCh0aGlzLiRzdG9yZS5zdGF0ZS5jb25maWcuYXBpVXJsKVxuICAgIGlmIChyZW1vdGUgIT09IHByaW50ZXJUcmFuc3BvcnRCaW5kaW5nLnJlbW90ZSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFyZW1vdGUpIHJldHVybiB0cnVlIC8vIEV4aXN0aW5nIExBTiBhdXRoZW50aWNhdGlvbjsgTW9vbnJha2VyIHJlbWFpbnMgdGhlIGF1dGhvcml0eS5cbiAgICBjb25zdCBoZWxkID0gY2xvdWRTdGF0ZS5wcmludGVycy5maW5kKHAgPT4gcC5pZCA9PT0gY2xvdWRTdGF0ZS5hY3RpdmVQcmludGVySWQpXG4gICAgaWYgKGhlbGQpIHJldHVybiBoZWxkLnJvbGUgPT09ICdvcGVyYXRvcidcbiAgICAvLyBObyBhY2NvdW50IGhvbGRzIGl0OiBhbiBPcGVuIHByaW50ZXIncyBPcGVyYXRvciBndWVzdCBvdmVyIEJsdWV0b290aCAoRC0xNjYsIEtBTi00MzA5KS4gTmV2ZXIgb3ZlciB0aGUgcmVsYXkuXG4gICAgY29uc3QgaWQgPSBjbG91ZFN0YXRlLmFjdGl2ZVByaW50ZXJJZFxuICAgIHJldHVybiAhIWlkICYmIHJlbW90ZVJvdXRlTGFiZWwoaWQpID09PSAnVmlhIEJsdWV0b290aCcgJiYgZ3JhbnRlZFJvbGVGb3IoaWQpID09PSAnb3BlcmF0b3InXG4gIH1cblxuICBnZXQgcmVzdGFydFJlZnVzYWwgKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmNvbW1hbmRDb250cm9sQXZhaWxhYmxlKSByZXR1cm4gJ05vdCBzZW50LiBDb25uZWN0IHRvIGEgcHJpbnRlciB5b3UgY2FuIGNvbnRyb2wgZmlyc3QuJ1xuICAgIGlmICh0aGlzLnByaW50ZXJCdXN5KSByZXR1cm4gJ05vdCBzZW50LiBXYWl0IHVudGlsIHRoZSBwcmludGVyIGhhcyBmaW5pc2hlZCBhbmQgaXMgbm8gbG9uZ2VyIHBhdXNlZCBvciBidXN5LidcbiAgICAvLyBBIGtub3duIEtsaXBwZXIgZXJyb3Ivc2h1dGRvd24gY2FuIGJlIHJlY292ZXJlZCBldmVuIGJlZm9yZSBwcmludCBzdGF0dXMgbG9hZHMuXG4gICAgaWYgKHRoaXMucHJpbnRlclN0YXRlID09PSAnbG9hZGluZycgJiYgIVsnZXJyb3InLCAnc2h1dGRvd24nXS5pbmNsdWRlcyh0aGlzLmtsaXBweVN0YXRlLnRvTG93ZXJDYXNlKCkpKSByZXR1cm4gJ05vdCBzZW50LiBXYWl0IGZvciB0aGUgcHJpbnRlciBzdGF0dXMgYmVmb3JlIHJlc3RhcnRpbmcuJ1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgYXN5bmMgY29uZmlybUNvbW1hbmRSZXN0YXJ0IChraW5kOiAncmVzdGFydCcgfCAnc2F2ZScgPSAncmVzdGFydCcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gdGhpcy5yZXN0YXJ0UmVmdXNhbFxuICAgIGlmICh0aGlzLmNvbW1hbmRSZWZ1c2FsKSByZXR1cm4gZmFsc2VcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmNvbW1hbmRUYXJnZXRcbiAgICBjb25zdCBvayA9IGF3YWl0IHRoaXMuJGNvbmZpcm0oa2luZCA9PT0gJ3NhdmUnID8gJ1NhdmluZyBrZWVwcyB0aGUgbmV3IHJlc3VsdHMgaW4gcHJpbnRlci5jZmcuIEtsaXBwZXIgcmVzdGFydHMgdG8gdXNlIHRoZW0uIFRoZSBwcmludGVyIG11c3QgYmUgaWRsZS4nIDogJ0tsaXBwZXIgcmVsb2FkcyBpdHMgc2V0dGluZ3MuIFRoZSBwcmludGVyIG11c3QgYmUgaWRsZSBiZWZvcmUgaXQgY2FuIHJlc3RhcnQuJywge1xuICAgICAgdGl0bGU6IGtpbmQgPT09ICdzYXZlJyA/ICdTYXZlIHRoZSByZXN1bHRzPycgOiAnUmVzdGFydCBLbGlwcGVyPycsIGJ1dHRvblRydWVUZXh0OiBraW5kID09PSAnc2F2ZScgPyAnU2F2ZSBhbmQgcmVzdGFydCBLbGlwcGVyJyA6ICdSZXN0YXJ0JywgYnV0dG9uRmFsc2VUZXh0OiAnS2VlcCBydW5uaW5nJywgZGFuZ2VyOiB0cnVlXG4gICAgfSlcbiAgICBpZiAoIW9rKSByZXR1cm4gZmFsc2VcbiAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gdGFyZ2V0ICE9PSB0aGlzLmNvbW1hbmRUYXJnZXQgPyAnTm90IHNlbnQuIFRoZSBzZWxlY3RlZCBwcmludGVyIG9yIGFjY291bnQgY2hhbmdlZC4gVHJ5IGFnYWluLicgOiB0aGlzLnJlc3RhcnRSZWZ1c2FsXG4gICAgcmV0dXJuICF0aGlzLmNvbW1hbmRSZWZ1c2FsXG4gIH1cblxuICBhc3luYyBzZW5kVHlwZWRHY29kZSAoZ2NvZGU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRoaXMuY29tbWFuZFJlZnVzYWwgPSAnJ1xuICAgIGlmICghZ2NvZGUudHJpbSgpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXRoaXMuY29tbWFuZENvbnRyb2xBdmFpbGFibGUpIHtcbiAgICAgIHRoaXMuY29tbWFuZFJlZnVzYWwgPSAnTm90IHNlbnQuIENvbm5lY3QgdG8gYSBwcmludGVyIHlvdSBjYW4gY29udHJvbCBmaXJzdC4nXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgY29uc3QgYmF0Y2ggPSBpbnNwZWN0VHlwZWRHY29kZShnY29kZSwgdGhpcy4kc3RvcmUuc3RhdGUucHJpbnRlci5wcmludGVyLmNvbmZpZ2ZpbGUpXG4gICAgdGhpcy5jb21tYW5kUmVmdXNhbCA9IGJhdGNoLnJlZnVzYWwgPz8gJydcbiAgICBpZiAodGhpcy5jb21tYW5kUmVmdXNhbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGJhdGNoLnNhdmVzQ29uZmlnICYmICghdGhpcy5rbGlwcHlDb25uZWN0ZWQgfHwgIXRoaXMua2xpcHB5UmVhZHkpKSB7XG4gICAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gJ05vdCBzZW50LiBLbGlwcGVyIG11c3QgYmUgcnVubmluZyB0byBzYXZlIHNldHRpbmdzLidcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoIXRoaXMua2xpcHB5Q29ubmVjdGVkICYmICEoYmF0Y2gucmVzdGFydHMgJiYgYmF0Y2gub25seVJlc3RhcnRzKSkge1xuICAgICAgdGhpcy5jb21tYW5kUmVmdXNhbCA9ICdOb3Qgc2VudC4gS2xpcHBlciBpcyBub3QgY29ubmVjdGVkLidcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoYmF0Y2gucmVzdGFydHMgJiYgIWF3YWl0IHRoaXMuY29uZmlybUNvbW1hbmRSZXN0YXJ0KCkpIHJldHVybiBmYWxzZVxuICAgIGlmIChiYXRjaC5zYXZlc0NvbmZpZyAmJiAoIXRoaXMua2xpcHB5Q29ubmVjdGVkIHx8ICF0aGlzLmtsaXBweVJlYWR5KSkge1xuICAgICAgdGhpcy5jb21tYW5kUmVmdXNhbCA9ICdOb3Qgc2VudC4gS2xpcHBlciBtdXN0IGJlIHJ1bm5pbmcgdG8gc2F2ZSBzZXR0aW5ncy4nXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKCF0aGlzLmtsaXBweUNvbm5lY3RlZCAmJiAhYmF0Y2gub25seVJlc3RhcnRzKSB7XG4gICAgICB0aGlzLmNvbW1hbmRSZWZ1c2FsID0gJ05vdCBzZW50LiBLbGlwcGVyIGlzIG5vdCBjb25uZWN0ZWQuJ1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIC8vIFJlLXJlYWQgY29uZmlnIGFmdGVyIGEgY29uZmlybWF0aW9uIGFzIHdlbGwgYXMgY29ubmVjdGlvbiwgaWRlbnRpdHkgYW5kIGJ1c3kgc3RhdGUuXG4gICAgdGhpcy5jb21tYW5kUmVmdXNhbCA9IGluc3BlY3RUeXBlZEdjb2RlKGdjb2RlLCB0aGlzLiRzdG9yZS5zdGF0ZS5wcmludGVyLnByaW50ZXIuY29uZmlnZmlsZSkucmVmdXNhbCA/PyAnJ1xuICAgIGlmICh0aGlzLmNvbW1hbmRSZWZ1c2FsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoZ2NvZGUudG9Mb3dlckNhc2UoKSA9PT0gJ20xMTInKSBTb2NrZXRBY3Rpb25zLnByaW50ZXJFbWVyZ2VuY3lTdG9wKClcbiAgICB0aGlzLnNlbmRHY29kZShnY29kZSlcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLFdBQVcsY0FBYztBQUNsQyxPQUFPLGdCQUFnQjtBQUN2QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLGtCQUFrQjtBQUMzQixTQUFTLCtCQUErQjtBQUN4QyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHdCQUF3QjtBQUlqQyxJQUFxQixxQkFBckIsY0FBZ0QsT0FBTyxVQUFVLEVBQUU7QUFBQSxFQUNqRSxpQkFBaUI7QUFBQSxFQUVqQixJQUFJLGdCQUF5QjtBQUMzQixXQUFPLEtBQUssVUFBVTtBQUFBLE1BQ3BCLEtBQUssT0FBTyxNQUFNLE9BQU87QUFBQSxNQUN6QixXQUFXO0FBQUEsTUFDWCxLQUFLLFFBQVEsUUFBUSxXQUFXO0FBQUEsTUFDaEMsV0FBVyxTQUFTLE1BQU07QUFBQSxJQUM1QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsSUFBSSwwQkFBb0M7QUFDdEMsUUFBSSxDQUFDLEtBQUssbUJBQW1CLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxLQUFLLGNBQWUsUUFBTztBQUMvRSxVQUFNLFNBQVMsZ0JBQWdCLEtBQUssT0FBTyxNQUFN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