import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { devModeState } from '@/services/dev-mode/state'
import { ownerState } from '@/services/gates'

/**
 * The gate answers a Settings page needs, in one place (see
 * src/components/settings/gates/README.md). It extends StateMixin, so
 * `printerBusy` and `printerPrinting` are here too, for gates such as
 * "no move or heat while printing".
 */
@Component
export default class MuonGatesMixin extends Mixins(StateMixin) {
  /** True when Moonraker reports a muon_access or muon_protection component. */
  get isMuonPrinter (): boolean {
    return this.$store.getters['server/isMuonPrinter'] as boolean
  }

  /** True only when the printer has said developer mode is on. Unknown counts as off. */
  get devModeEnabled (): boolean {
    return devModeState.enabled === true
  }

  /** True/false once known; null while it is not (see OwnerOnly). */
  get isOwner (): boolean | null {
    return this.isMuonPrinter ? ownerState.isOwner : null
  }
}
