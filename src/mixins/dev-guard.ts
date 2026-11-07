import { Component, Mixins } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import { DEV_ONLY_NOTE, devOnlyLocked } from '@/services/dev-guard'

/**
 * For a control that sends a command Klipper#112 only allows in developer
 * mode. `devOnlyLocked` is true when it must be hidden or disabled with
 * `devOnlyNote` beside it, and the send itself must check `devOnlyLocked` too.
 */
@Component
export default class DevGuardMixin extends Mixins(MuonGatesMixin) {
  get devOnlyLocked (): boolean {
    return devOnlyLocked({
      isMuon: this.isMuonPrinter,
      guardDevMode: this.$store.state.printer?.printer?.muon_guard?.dev_mode,
      gateDevMode: this.devModeEnabled
    })
  }

  get devOnlyNote (): string {
    return DEV_ONLY_NOTE
  }
}
