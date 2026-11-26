/* unplugin-vue-components disabled */import __unplugin_components_5 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_4 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_3 from "/src/components/ui/FrameIcon.vue";
import __unplugin_components_2 from "/src/components/ui/FrameIcon.vue";
import { VProgressCircular as __unplugin_components_1 } from "/.vite-e2e/4291/deps/vuetify_lib.js?v=9b9fafc7";
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
import { Component, Prop, Vue } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import BluetoothWhyText from "/src/components/printers/BluetoothWhyText.vue";
import ScanResults from "/src/components/printers/ScanResults.vue";
let PrintersWelcome = class extends Vue {
  signedIn;
  searching;
  network;
  bluetoothSearch;
  bluetoothOff;
  bluetoothWhy;
  blockedByPage;
  scanning;
};
__decorateClass([
  Prop({ type: Boolean })
], PrintersWelcome.prototype, "signedIn", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersWelcome.prototype, "searching", 2);
__decorateClass([
  Prop({ type: String, default: "" })
], PrintersWelcome.prototype, "network", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersWelcome.prototype, "bluetoothSearch", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersWelcome.prototype, "bluetoothOff", 2);
__decorateClass([
  Prop({ type: Object, default: null })
], PrintersWelcome.prototype, "bluetoothWhy", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersWelcome.prototype, "blockedByPage", 2);
__decorateClass([
  Prop({ type: Boolean })
], PrintersWelcome.prototype, "scanning", 2);
PrintersWelcome = __decorateClass([
  Component({ components: { BluetoothWhyText, ScanResults } })
], PrintersWelcome);
const _sfc_main = PrintersWelcome;
var _sfc_render = function render() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("section", { staticClass: "welcome", attrs: { "data-tid": "printers-welcome" } }, [_c("span", { staticClass: "welcome__icon" }, [_c(__unplugin_components_0, { attrs: { "name": "printers" } })], 1), _c("h1", { staticClass: "welcome__title", attrs: { "data-tid": "page-title" } }, [_vm._v(" No printers yet ")]), _c("p", { staticClass: "welcome__lead" }, [_vm._v(" Nothing has turned up on this network. Keep this page open while your printer starts: it appears here by itself. ")]), _c("button", { staticClass: "btn btn--primary", attrs: { "type": "button", "data-tid": "scan-printers", "disabled": _vm.scanning }, on: { "click": function($event) {
    return _vm.$emit("scan");
  } } }, [_vm._v(" " + _vm._s(_vm.scanning ? "Scanning\u2026" : "Scan for printers") + " ")]), _c("scan-results"), _c("div", { staticClass: "welcome__search" }, [_vm.searching ? _c(__unplugin_components_1, { attrs: { "indeterminate": "", "size": "16", "width": "2" } }) : _c(__unplugin_components_2, { attrs: { "name": "wifi", "small": "" } }), _c("span", { staticClass: "welcome__search-text" }, [_vm._v(" " + _vm._s(_vm.searching ? "Looking on this network\u2026" : "Nothing found on this network yet.") + " "), _vm.network ? _c("span", { staticClass: "dim" }, [_vm._v(" " + _vm._s(_vm.network))]) : _vm._e()]), _c("button", { staticClass: "btn btn--sm", attrs: { "type": "button", "disabled": _vm.searching, "data-tid": "search-again" }, on: { "click": function($event) {
    return _vm.$emit("rescan");
  } } }, [_vm._v(" Search again ")])], 1), _c("div", { staticClass: "rows welcome__ways" }, [_c("div", { staticClass: "row" }, [_c("span", { staticClass: "row__icon row__icon--accent" }, [_c(__unplugin_components_3, { attrs: { "name": "plus" } })], 1), _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v("Set up a new printer")]), _c("span", { staticClass: "row__sub welcome__wrap" }, [_vm._v(" Turn it on. It makes a Wi-Fi called "), _c("span", { staticClass: "mono" }, [_vm._v("Muon-")]), _vm._v(" and its name. Join that Wi-Fi and setup opens."), _vm.bluetoothSearch ? [_vm._v(" Or find it nearby over Bluetooth.")] : _vm._e()], 2)]), _vm.bluetoothSearch ? _c("button", { staticClass: "btn btn--primary btn--sm", attrs: { "type": "button", "data-tid": "look-nearby" }, on: { "click": function($event) {
    return _vm.$emit("look-nearby");
  } } }, [_vm._v(" " + _vm._s(_vm.bluetoothOff ? "Turn on Bluetooth search" : "Look nearby") + " ")]) : _vm._e()]), !_vm.bluetoothSearch ? _c("p", { staticClass: "welcome__bt-note", attrs: { "data-tid": "bluetooth-unavailable" } }, [_c("bluetooth-why-text", { attrs: { "why": _vm.bluetoothWhy } })], 1) : _vm.bluetoothOff ? _c("p", { staticClass: "welcome__bt-note", attrs: { "data-tid": "bluetooth-off" } }, [_c("bluetooth-why-text", { attrs: { "why": _vm.bluetoothWhy } })], 1) : _vm._e(), _c("div", { staticClass: "row" }, [_c("span", { staticClass: "row__icon" }, [_c(__unplugin_components_4, { attrs: { "name": "search" } })], 1), _vm._m(0), _c("button", { staticClass: "btn btn--sm", attrs: { "type": "button", "data-tid": "enter-address" }, on: { "click": function($event) {
    return _vm.$emit("address");
  } } }, [_vm._v(" Add by address ")])]), !_vm.signedIn ? _c("div", { staticClass: "row" }, [_c("span", { staticClass: "row__icon" }, [_c(__unplugin_components_5, { attrs: { "name": "cloud" } })], 1), _vm._m(1), _c("button", { staticClass: "btn btn--sm", attrs: { "type": "button", "data-tid": "sign-in" }, on: { "click": function($event) {
    return _vm.$emit("sign-in");
  } } }, [_vm._v(" Sign in ")])]) : _vm._e()]), _vm.blockedByPage ? _c("p", { staticClass: "note", attrs: { "data-tid": "blocked-by-page" } }, [_vm._v(" This browser won't let this page reach printers by their IP address, because the page was opened by name. Add a printer by its name instead, as shown on its screen, such as muon-walnut-8987. ")]) : _vm._e()], 1);
};
var _sfc_staticRenderFns = [function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v("Add one by its address")]), _c("span", { staticClass: "row__sub welcome__wrap" }, [_vm._v("It is on the printer's screen, such as muon-boxwood-367a.local or 192.168.1.20.")])]);
}, function() {
  var _vm = this, _c = _vm._self._c, _setup = _vm._self._setupProxy;
  return _c("div", { staticClass: "row__text" }, [_c("span", { staticClass: "row__title" }, [_vm._v("Sign in to reach your printers from anywhere")]), _c("span", { staticClass: "row__sub welcome__wrap" }, [_vm._v("Optional. You don't need an account to print on this network.")])]);
}];
_sfc_render._withStripped = true;
import "/src/components/printers/PrintersWelcome.vue?vue&type=style&index=0&scoped=18e02112&lang.scss";
import __normalizer from "/@id/__x00__plugin-vue2:normalizer";
var __component__ = /* @__PURE__ */ __normalizer(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "18e02112",
  null,
  null
);
__component__.options.__file = "C:/Users/jack/wt-5929-g1/src/components/printers/PrintersWelcome.vue";
export default __component__.exports;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQXlJQTtBQUNBO0FBQ0E7QUFTQTtBQUFBLEVBRUE7QUFBQSxFQUdBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFJQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBQ0E7QUF4QkE7QUFBQSxFQURBO0FBQUEsR0FEQSxnQkFFQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBSkEsZ0JBS0E7QUFHQTtBQUFBLEVBREE7QUFBQSxHQVBBLGdCQVFBO0FBR0E7QUFBQSxFQURBO0FBQUEsR0FWQSxnQkFXQTtBQUdBO0FBQUEsRUFEQTtBQUFBLEdBYkEsZ0JBY0E7QUFJQTtBQUFBLEVBREE7QUFBQSxHQWpCQSxnQkFrQkE7QUFHQTtBQUFBLEVBREE7QUFBQSxHQXBCQSxnQkFxQkE7QUFJQTtBQUFBLEVBREE7QUFBQSxHQXhCQSxnQkF5QkE7QUF6QkE7QUFBQSxFQURBO0FBQUEsR0FDQSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUHJpbnRlcnNXZWxjb21lLnZ1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8dGVtcGxhdGU+XG4gIDxzZWN0aW9uXG4gICAgY2xhc3M9XCJ3ZWxjb21lXCJcbiAgICBkYXRhLXRpZD1cInByaW50ZXJzLXdlbGNvbWVcIlxuICA+XG4gICAgPHNwYW4gY2xhc3M9XCJ3ZWxjb21lX19pY29uXCI+PGZyYW1lLWljb24gbmFtZT1cInByaW50ZXJzXCIgLz48L3NwYW4+XG4gICAgPGgxXG4gICAgICBjbGFzcz1cIndlbGNvbWVfX3RpdGxlXCJcbiAgICAgIGRhdGEtdGlkPVwicGFnZS10aXRsZVwiXG4gICAgPlxuICAgICAgTm8gcHJpbnRlcnMgeWV0XG4gICAgPC9oMT5cbiAgICA8cCBjbGFzcz1cIndlbGNvbWVfX2xlYWRcIj5cbiAgICAgIE5vdGhpbmcgaGFzIHR1cm5lZCB1cCBvbiB0aGlzIG5ldHdvcmsuIEtlZXAgdGhpcyBwYWdlIG9wZW4gd2hpbGUgeW91ciBwcmludGVyIHN0YXJ0czogaXQgYXBwZWFycyBoZXJlIGJ5IGl0c2VsZi5cbiAgICA8L3A+XG5cbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzPVwiYnRuIGJ0bi0tcHJpbWFyeVwiXG4gICAgICBkYXRhLXRpZD1cInNjYW4tcHJpbnRlcnNcIlxuICAgICAgOmRpc2FibGVkPVwic2Nhbm5pbmdcIlxuICAgICAgQGNsaWNrPVwiJGVtaXQoJ3NjYW4nKVwiXG4gICAgPlxuICAgICAge3sgc2Nhbm5pbmcgPyAnU2Nhbm5pbmfigKYnIDogJ1NjYW4gZm9yIHByaW50ZXJzJyB9fVxuICAgIDwvYnV0dG9uPlxuICAgIDxzY2FuLXJlc3VsdHMgLz5cblxuICAgIDxkaXYgY2xhc3M9XCJ3ZWxjb21lX19zZWFyY2hcIj5cbiAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyXG4gICAgICAgIHYtaWY9XCJzZWFyY2hpbmdcIlxuICAgICAgICBpbmRldGVybWluYXRlXG4gICAgICAgIHNpemU9XCIxNlwiXG4gICAgICAgIHdpZHRoPVwiMlwiXG4gICAgICAvPlxuICAgICAgPGZyYW1lLWljb25cbiAgICAgICAgdi1lbHNlXG4gICAgICAgIG5hbWU9XCJ3aWZpXCJcbiAgICAgICAgc21hbGxcbiAgICAgIC8+XG4gICAgICA8c3BhbiBjbGFzcz1cIndlbGNvbWVfX3NlYXJjaC10ZXh0XCI+XG4gICAgICAgIHt7IHNlYXJjaGluZyA/ICdMb29raW5nIG9uIHRoaXMgbmV0d29ya+KApicgOiAnTm90aGluZyBmb3VuZCBvbiB0aGlzIG5ldHdvcmsgeWV0LicgfX1cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICB2LWlmPVwibmV0d29ya1wiXG4gICAgICAgICAgY2xhc3M9XCJkaW1cIlxuICAgICAgICA+IHt7IG5ldHdvcmsgfX08L3NwYW4+XG4gICAgICA8L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjbGFzcz1cImJ0biBidG4tLXNtXCJcbiAgICAgICAgOmRpc2FibGVkPVwic2VhcmNoaW5nXCJcbiAgICAgICAgZGF0YS10aWQ9XCJzZWFyY2gtYWdhaW5cIlxuICAgICAgICBAY2xpY2s9XCIkZW1pdCgncmVzY2FuJylcIlxuICAgICAgPlxuICAgICAgICBTZWFyY2ggYWdhaW5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cInJvd3Mgd2VsY29tZV9fd2F5c1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19faWNvbiByb3dfX2ljb24tLWFjY2VudFwiPjxmcmFtZS1pY29uIG5hbWU9XCJwbHVzXCIgLz48L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyb3dfX3RleHRcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fdGl0bGVcIj5TZXQgdXAgYSBuZXcgcHJpbnRlcjwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fc3ViIHdlbGNvbWVfX3dyYXBcIj5cbiAgICAgICAgICAgIFR1cm4gaXQgb24uIEl0IG1ha2VzIGEgV2ktRmkgY2FsbGVkIDxzcGFuIGNsYXNzPVwibW9ub1wiPk11b24tPC9zcGFuPiBhbmQgaXRzIG5hbWUuIEpvaW4gdGhhdCBXaS1GaSBhbmRcbiAgICAgICAgICAgIHNldHVwIG9wZW5zLjx0ZW1wbGF0ZSB2LWlmPVwiYmx1ZXRvb3RoU2VhcmNoXCI+IE9yIGZpbmQgaXQgbmVhcmJ5IG92ZXIgQmx1ZXRvb3RoLjwvdGVtcGxhdGU+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtaWY9XCJibHVldG9vdGhTZWFyY2hcIlxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiYnRuIGJ0bi0tcHJpbWFyeSBidG4tLXNtXCJcbiAgICAgICAgICBkYXRhLXRpZD1cImxvb2stbmVhcmJ5XCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnbG9vay1uZWFyYnknKVwiXG4gICAgICAgID5cbiAgICAgICAgICB7eyBibHVldG9vdGhPZmYgPyAnVHVybiBvbiBCbHVldG9vdGggc2VhcmNoJyA6ICdMb29rIG5lYXJieScgfX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxwXG4gICAgICAgIHYtaWY9XCIhYmx1ZXRvb3RoU2VhcmNoXCJcbiAgICAgICAgY2xhc3M9XCJ3ZWxjb21lX19idC1ub3RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJibHVldG9vdGgtdW5hdmFpbGFibGVcIlxuICAgICAgPlxuICAgICAgICA8Ymx1ZXRvb3RoLXdoeS10ZXh0IDp3aHk9XCJibHVldG9vdGhXaHlcIiAvPlxuICAgICAgPC9wPlxuICAgICAgPHBcbiAgICAgICAgdi1lbHNlLWlmPVwiYmx1ZXRvb3RoT2ZmXCJcbiAgICAgICAgY2xhc3M9XCJ3ZWxjb21lX19idC1ub3RlXCJcbiAgICAgICAgZGF0YS10aWQ9XCJibHVldG9vdGgtb2ZmXCJcbiAgICAgID5cbiAgICAgICAgPGJsdWV0b290aC13aHktdGV4dCA6d2h5PVwiYmx1ZXRvb3RoV2h5XCIgLz5cbiAgICAgIDwvcD5cbiAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJyb3dfX2ljb25cIj48ZnJhbWUtaWNvbiBuYW1lPVwic2VhcmNoXCIgLz48L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyb3dfX3RleHRcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fdGl0bGVcIj5BZGQgb25lIGJ5IGl0cyBhZGRyZXNzPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicm93X19zdWIgd2VsY29tZV9fd3JhcFwiPkl0IGlzIG9uIHRoZSBwcmludGVyJ3Mgc2NyZWVuLCBzdWNoIGFzIG11b24tYm94d29vZC0zNjdhLmxvY2FsIG9yIDE5Mi4xNjguMS4yMC48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3M9XCJidG4gYnRuLS1zbVwiXG4gICAgICAgICAgZGF0YS10aWQ9XCJlbnRlci1hZGRyZXNzXCJcbiAgICAgICAgICBAY2xpY2s9XCIkZW1pdCgnYWRkcmVzcycpXCJcbiAgICAgICAgPlxuICAgICAgICAgIEFkZCBieSBhZGRyZXNzXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIHYtaWY9XCIhc2lnbmVkSW5cIlxuICAgICAgICBjbGFzcz1cInJvd1wiXG4gICAgICA+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicm93X19pY29uXCI+PGZyYW1lLWljb24gbmFtZT1cImNsb3VkXCIgLz48L3NwYW4+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyb3dfX3RleHRcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fdGl0bGVcIj5TaWduIGluIHRvIHJlYWNoIHlvdXIgcHJpbnRlcnMgZnJvbSBhbnl3aGVyZTwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInJvd19fc3ViIHdlbGNvbWVfX3dyYXBcIj5PcHRpb25hbC4gWW91IGRvbid0IG5lZWQgYW4gYWNjb3VudCB0byBwcmludCBvbiB0aGlzIG5ldHdvcmsuPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzPVwiYnRuIGJ0bi0tc21cIlxuICAgICAgICAgIGRhdGEtdGlkPVwic2lnbi1pblwiXG4gICAgICAgICAgQGNsaWNrPVwiJGVtaXQoJ3NpZ24taW4nKVwiXG4gICAgICAgID5cbiAgICAgICAgICBTaWduIGluXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPHBcbiAgICAgIHYtaWY9XCJibG9ja2VkQnlQYWdlXCJcbiAgICAgIGNsYXNzPVwibm90ZVwiXG4gICAgICBkYXRhLXRpZD1cImJsb2NrZWQtYnktcGFnZVwiXG4gICAgPlxuICAgICAgVGhpcyBicm93c2VyIHdvbid0IGxldCB0aGlzIHBhZ2UgcmVhY2ggcHJpbnRlcnMgYnkgdGhlaXIgSVAgYWRkcmVzcywgYmVjYXVzZSB0aGUgcGFnZSB3YXMgb3BlbmVkIGJ5XG4gICAgICBuYW1lLiBBZGQgYSBwcmludGVyIGJ5IGl0cyBuYW1lIGluc3RlYWQsIGFzIHNob3duIG9uIGl0cyBzY3JlZW4sIHN1Y2ggYXMgbXVvbi13YWxudXQtODk4Ny5cbiAgICA8L3A+XG4gIDwvc2VjdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQgbGFuZz1cInRzXCI+XG5pbXBvcnQgeyBDb21wb25lbnQsIFByb3AsIFZ1ZSB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgQmx1ZXRvb3RoV2h5VGV4dCBmcm9tICcuL0JsdWV0b290aFdoeVRleHQudnVlJ1xuaW1wb3J0IFNjYW5SZXN1bHRzIGZyb20gJy4vU2NhblJlc3VsdHMudnVlJ1xuaW1wb3J0IHR5cGUgeyBCbHVldG9vdGhXaHkgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3VuYXZhaWxhYmxlJ1xuXG4vKipcbiAqIFRoZSBlbXB0eSBzdGF0ZSAodjMgc2VjdGlvbiA2KTogYSBjZW50cmVkIGljb24gc3F1YXJlLCBvbmUgYm9sZCBsaW5lIGZvclxuICogd2hhdCBpcyBtaXNzaW5nLCBvbmUgbXV0ZWQgbGluZSBmb3IgaG93IHRvIGZpeCBpdCwgYW5kIHRoZSB3YXlzIHRvIGZpbmRcbiAqIHRoZSBmaXJzdCBwcmludGVyLlxuICovXG5AQ29tcG9uZW50KHsgY29tcG9uZW50czogeyBCbHVldG9vdGhXaHlUZXh0LCBTY2FuUmVzdWx0cyB9IH0pXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmludGVyc1dlbGNvbWUgZXh0ZW5kcyBWdWUge1xuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgc2lnbmVkSW4/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNlYXJjaGluZz86IGJvb2xlYW5cblxuICBAUHJvcCh7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSlcbiAgcmVhZG9ubHkgbmV0d29yayE6IHN0cmluZ1xuXG4gIEBQcm9wKHsgdHlwZTogQm9vbGVhbiB9KVxuICByZWFkb25seSBibHVldG9vdGhTZWFyY2g/OiBib29sZWFuXG5cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IGJsdWV0b290aE9mZj86IGJvb2xlYW5cblxuICAvKiogV2h5IEJsdWV0b290aCBjYW5ub3QgYmUgdXNlZCBoZXJlLCBzYWlkIHBsYWlubHkuICovXG4gIEBQcm9wKHsgdHlwZTogT2JqZWN0LCBkZWZhdWx0OiBudWxsIH0pXG4gIHJlYWRvbmx5IGJsdWV0b290aFdoeSE6IEJsdWV0b290aFdoeSB8IG51bGxcblxuICBAUHJvcCh7IHR5cGU6IEJvb2xlYW4gfSlcbiAgcmVhZG9ubHkgYmxvY2tlZEJ5UGFnZT86IGJvb2xlYW5cblxuICAvKiogQSBzY2FuIGlzIHJ1bm5pbmcgKEtBTi01NDA5KS4gKi9cbiAgQFByb3AoeyB0eXBlOiBCb29sZWFuIH0pXG4gIHJlYWRvbmx5IHNjYW5uaW5nPzogYm9vbGVhblxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiIHNjb3BlZD5cbiAgLndlbGNvbWUge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGdhcDogMTRweDtcbiAgICBtYXgtd2lkdGg6IDY0MHB4O1xuICAgIG1hcmdpbjogMCBhdXRvO1xuICAgIHBhZGRpbmctdG9wOiA0MHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgfVxuXG4gIC53ZWxjb21lX19pY29uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIHdpZHRoOiA2NHB4O1xuICAgIGhlaWdodDogNjRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxOHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG5cbiAgICBzdmcgeyB3aWR0aDogMzBweDsgaGVpZ2h0OiAzMHB4OyB9XG4gIH1cblxuICAud2VsY29tZV9fdGl0bGUge1xuICAgIG1hcmdpbjogMDtcbiAgICBmb250LXNpemU6IDIycHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC53ZWxjb21lX19sZWFkIHtcbiAgICBtYXJnaW46IDA7XG4gICAgY29sb3I6IHZhcigtLW0zZC10ZXh0LW11dGVkKTtcbiAgICBmb250LXNpemU6IDE1cHg7XG4gIH1cblxuICAud2VsY29tZV9fc2VhcmNoIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIHBhZGRpbmc6IDEycHggMTRweDtcbiAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLW0zZC1zdXJmYWNlLTIpO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dC1tdXRlZCk7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgfVxuXG4gIC53ZWxjb21lX19zZWFyY2gtdGV4dCB7XG4gICAgZmxleDogMSAxIDA7XG4gICAgbWluLXdpZHRoOiAwO1xuICAgIGNvbG9yOiB2YXIoLS1tM2QtdGV4dCk7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICB9XG5cbiAgLndlbGNvbWVfX3dheXMge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gIH1cblxuICAud2VsY29tZV9fd3JhcCB7XG4gICAgd2hpdGUtc3BhY2U6IG5vcm1hbDtcbiAgfVxuICAud2VsY29tZV9fYnQtbm90ZSB7XG4gICAgbWFyZ2luOiAwO1xuICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICBjb2xvcjogdmFyKC0tbTNkLXRleHQtbXV0ZWQpO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJmaWxlIjoiQzovVXNlcnMvamFjay93dC01OTI5LWcxL3NyYy9jb21wb25lbnRzL3ByaW50ZXJzL1ByaW50ZXJzV2VsY29tZS52dWUifQ==