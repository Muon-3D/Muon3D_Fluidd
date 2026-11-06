import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { activeSlug } from '@/services/printer-pages'
import { gateState, refreshCanManageAccess, refreshGateDevMode, valueFor } from '@/services/gates'

/**
 * The gate answers a Settings page needs, in one place (see
 * src/components/settings/gates/README.md). It extends StateMixin, so
 * `printerBusy` and `printerPrinting` are here too, for gates such as
 * "no move or heat while printing".
 *
 * Every answer is for the printer on screen: it is unknown (null / false)
 * after a printer switch, a socket close or a reconnect, until asked again.
 */
@Component
export default class MuonGatesMixin extends Mixins(StateMixin) {
  /**
   * True when Moonraker reports a muon_access or muon_protection component,
   * false when it reports a list with neither, null until server.info has
   * been received for this printer.
   */
  get isMuonPrinter (): boolean | null {
    return this.$store.getters['server/isMuonPrinter'] as boolean | null
  }

  /** The printer these answers are for. */
  get gatePrinter (): string | null {
    return activeSlug()
  }

  /** True only when this printer has said developer mode is on. Unknown counts as off. */
  get devModeEnabled (): boolean {
    return valueFor('dev', this.gatePrinter) === true
  }

  /**
   * Whether this client may manage access (the printer reports
   * `protection: allowed`), or null while unknown. See CanManageAccess.
   */
  get canManageAccess (): boolean | null {
    return this.isMuonPrinter === true ? valueFor('manage', this.gatePrinter) : null
  }

  /** Changes on a switch, a reset and when server.info lands: asks again. */
  get gateToken (): string {
    return `${gateState.epoch}|${this.gatePrinter}|${this.isMuonPrinter}`
  }

  mounted () {
    this.askGates()
  }

  @Watch('gateToken')
  onGateToken () {
    this.askGates()
  }

  askGates () {
    if (this.gatePrinter === null) return
    if (valueFor('dev', this.gatePrinter) === null) refreshGateDevMode()
    if (this.isMuonPrinter === true &&
      this.$store.getters['server/componentSupport']('muon_access') &&
      valueFor('manage', this.gatePrinter) === null) {
      refreshCanManageAccess()
    }
  }
}
