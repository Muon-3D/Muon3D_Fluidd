import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import { pageOfRoute } from '@/router/printerPagePaths'
import { printerStatusWord } from '@/util/printer-status-word'
import { startup } from '@/services/startup/heard'
import { Globals } from '@/globals'
import { printerNameParts } from '@/util/printer-name'

export type PrinterStatusTone = 'ok' | 'active' | 'warn' | 'fault' | 'off'

// Page names for the glass style's toolbar and large titles. A route that is
// not listed falls back to its route name.
const pageTitleKeys: Record<string, string> = {
  '/jobs': 'app.general.title.jobs',
  '/preview': 'app.general.title.gcode_preview',
  '/console': 'app.general.title.console',
  '/history': 'app.general.title.history',
  '/timelapse': 'app.general.title.timelapse',
  '/tune': 'app.general.title.tune',
  '/configure': 'app.general.title.configure',
  '/diagnostics': 'app.general.title.diagnostics',
  '/wifi': 'app.general.title.wifi',
  '/system': 'app.general.title.system',
  '/settings': 'app.general.title.settings'
}

@Component
export default class PrinterStatusMixin extends Mixins(StateMixin) {
  get displayName (): string {
    return this.$store.getters['config/getDisplayName'] as string
  }

  get printProgress (): number {
    return Math.floor((this.$store.getters['printer/getPrintProgress'] as number) * 100)
  }

  get statusTone (): PrinterStatusTone {
    if (!this.socketConnected) return 'off'
    if (!this.klippyReady) {
      if (!this.klippyState) return 'off'
      return ['error', 'shutdown'].includes(this.klippyState) ? 'fault' : 'warn'
    }

    switch (this.printerState.toLowerCase()) {
      case 'printing':
      case 'busy':
        return 'active'
      case 'paused':
        return 'warn'
      case 'error':
      case 'cancelled':
        return 'fault'
      default:
        return 'ok'
    }
  }

  /**
   * Whether the printer's own name is known yet. Until the printer has said
   * (its saved name, or its network name), getDisplayName falls back to the
   * product name, which names no printer: the name is drawn as a placeholder
   * instead (KAN-2257).
   */
  get nameKnown (): boolean {
    const name = this.displayName.trim()
    return !!name && name !== Globals.PRODUCT_NAME
  }

  /** Still waiting to hear the name: draw a placeholder for it. */
  get nameWaiting (): boolean {
    return !this.nameKnown && !startup.heard
  }

  /**
   * The name to show: the printer's own, as people say it (Boxwood, not
   * muon-boxwood-367a). A printer that never answered is named from its
   * address in Control (/boxwood-367a/ is Boxwood), which came from its name.
   */
  get shownName (): string {
    if (this.nameKnown) return printerNameParts(this.displayName).name
    const slug = this.$route?.params?.printer
    return slug ? printerNameParts(slug).name : this.displayName
  }

  get statusText (): string {
    // Before the first answer the printer is being reached, not offline; and
    // an empty Klipper state means not yet reported, not "offline".
    if (!this.socketConnected) return startup.heard ? 'Offline' : 'Connecting…'
    if (!this.klippyReady) return this.klippyState ? `Klipper ${this.klippyState}` : 'Connecting…'

    const state = printerStatusWord(this.printerState)

    return this.printerPrinting ? `${state} · ${this.printProgress}%` : state
  }

  // Home is named by the printer; every other page by its own name.
  get pageTitle (): string {
    const section = `/${pageOfRoute(this.$route).split('/')[1]}`

    if (this.$route.name === 'Dashboard') return this.displayName

    const key = pageTitleKeys[section]

    return key ? this.$t(key).toString() : (this.$route.name ?? '')
  }

  get pageSubtitle (): string {
    return this.$route.name === 'Dashboard'
      ? this.statusText
      : `${this.displayName} · ${this.statusText}`
  }
}
