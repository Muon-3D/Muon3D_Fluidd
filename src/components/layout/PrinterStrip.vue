<template>
  <div
    ref="strip"
    class="printer-strip"
    :class="{ 'printer-strip--phone': phone }"
    :data-tid="presentation === 'strip' ? 'printer-strip' : 'printer-switcher-classic'"
    role="navigation"
    aria-label="Printers"
  >
    <printer-switch-button
      :phone="phone"
      :screen-state="presentation === 'strip' ? currentState : undefined"
      :foreign-screen="isNonMuon"
    />
    <template v-if="presentation === 'strip'">
      <button
        v-for="entry in shown"
        :key="entry.key"
        type="button"
        class="printer-strip__printer"
        data-tid="strip-printer"
        :data-key="entry.key"
        :title="`${entry.name} · ${label(entry)}`"
        :aria-label="`Open ${entry.name}, ${label(entry)}`"
        :disabled="!!busyKey"
        @click="choose(entry)"
      >
        <printer-screen
          :state="state(entry)"
          :foreign="!!entry.foreign"
        />
      </button>
      <v-menu
        v-model="open"
        :disabled="!extraCount"
        eager
        offset-y
        :close-on-content-click="false"
        :min-width="phone ? 280 : 400"
        :max-width="phone ? 350 : 440"
        max-height="calc(100vh - 100px)"
        content-class="printer-strip__menu"
      >
        <template #activator="{ on, attrs }">
          <button
            v-show="extraCount"
            type="button"
            class="printer-strip__more"
            data-tid="strip-overflow"
            :aria-label="`${extraCount} more printers`"
            v-bind="attrs"
            v-on="on"
          >
            +{{ extraCount }}
          </button>
        </template>
        <printer-switcher
          ref="picker"
          :visible="open"
          :list-visible="open"
          :exclude-keys="excluded"
          :extra-entries="foreign"
          :screen-state-for="state"
          separate-shared
          @click="open = false"
        />
      </v-menu>
      <div
        v-if="notice"
        role="alert"
        class="printer-strip__error"
      >
        {{ notice }}
        <button
          type="button"
          aria-label="Dismiss printer message"
          @click="notice = null"
        >
          ×
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PrinterEntriesMixin from '@/mixins/printer-entries'
import PrinterSwitchButton from './PrinterSwitchButton.vue'
import PrinterScreen from './PrinterScreen.vue'
import PrinterSwitcher from '@/components/muon-cloud/PrinterSwitcher.vue'
import { foreignEntries, type DirectoryEntry } from '@/services/muon-cloud/directory'
import { cloudState } from '@/services/muon-cloud/state'
import { liveForeign } from '@/services/foreign-printers/live'
import { foreignRecordForSlug } from '@/services/printer-pages'
import { STRIP_LABELS, stripCapacity, stripEntries, stripState, type StripState } from '@/services/muon-cloud/printer-strip'
import type { PrinterStatus } from '@/services/muon-cloud/status'
import { startup } from '@/services/startup/heard'

@Component({ components: { PrinterSwitchButton, PrinterScreen, PrinterSwitcher } })
export default class PrinterStrip extends Mixins(PrinterEntriesMixin) {
  @Prop({ type: Boolean }) readonly phone!: boolean
  @Prop({ type: String, default: 'strip' }) readonly presentation!: 'strip' | 'switcher'

  width = 180
  open = false
  observer: ResizeObserver | null = null

  get currentForeign () { return foreignRecordForSlug(this.$route.params.printer) }
  get isNonMuon (): boolean { return !!this.currentForeign || this.$store.getters['server/isMuonPrinter'] === false }

  get foreign (): DirectoryEntry[] {
    return foreignEntries(liveForeign.records.filter(r => r.id !== this.currentForeign?.id).map(record => ({ record, status: liveForeign.status[record.id] ?? null })))
  }

  get entries (): DirectoryEntry[] { return stripEntries([...this.directory.cloud, ...this.directory.local, ...this.foreign]) }
  get shown (): DirectoryEntry[] { return this.entries.slice(0, stripCapacity(this.width, this.entries.length, this.directory.found.length)) }
  get excluded (): string[] { return [...this.directory.cloud, ...this.directory.local].filter(e => e.active).concat(this.shown).map(e => e.key) }
  get extraCount (): number { return this.entries.length - this.shown.length + this.directory.found.length }

  get currentState (): StripState {
    if (this.currentForeign) {
      const entry = foreignEntries([{ record: this.currentForeign, status: liveForeign.status[this.currentForeign.id] ?? null }])[0]
      return this.state(entry)
    }
    if (!this.socketConnected) return startup.heard ? 'asleep' : 'new'
    const health = !this.authenticated ? 'locked' : !this.klippyReady ? 'error' : this.printerPaused ? 'paused' : this.printerPrinting ? 'printing' : 'online'
    const printer = this.$store.state.printer.printer
    return stripState(health, { state: this.klippyReady ? this.printerState : `klipper ${this.klippyState}`, extruder: printer[printer.toolhead?.extruder ?? 'extruder'], bed: printer.heater_bed })
  }

  state (entry: DirectoryEntry): StripState {
    const f = entry.foreign?.status
    const nozzle = f?.temps.find(t => t.id === 'nozzle')
    const plate = f?.temps.find(t => t.id === 'bed')
    const status: Pick<PrinterStatus, 'state' | 'extruder' | 'bed'> | undefined = f
      ? { state: f.state, extruder: nozzle ? { temperature: nozzle.actual, target: nozzle.target ?? 0 } : undefined, bed: plate ? { temperature: plate.actual, target: plate.target ?? 0 } : undefined }
      : entry.cloud ? cloudState.status[entry.cloud.id] : entry.lan?.health?.status
    return stripState(entry.health, status)
  }

  label (entry: DirectoryEntry): string { return STRIP_LABELS[this.state(entry)] }

  async choose (entry: DirectoryEntry) {
    const picker = this.$refs.picker as PrinterSwitcher | undefined
    if (!picker) return
    this.busyKey = entry.key
    this.notice = null
    try {
      await picker.openListedEntry(entry)
      this.notice = picker.activationError || picker.notice
    } catch {
      this.notice = `Couldn't open ${entry.name}. Try again from the printer switcher.`
    } finally {
      this.busyKey = null
    }
  }

  onResize () {
    const el = this.$refs.strip as HTMLElement
    this.width = el.clientWidth
  }

  mounted () {
    this.onResize()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', this.onResize)
      return
    }
    this.observer = new ResizeObserver(this.onResize)
    this.observer.observe(this.$refs.strip as HTMLElement)
  }

  beforeDestroy () {
    this.observer?.disconnect()
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style lang="scss" scoped>
.printer-strip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 1 470px;
  width: 470px;
  min-width: 100px;
  max-width: 470px;
}
.printer-strip--phone { flex: 1 1 0; width: 0; max-width: none; min-width: 0; }
.printer-strip__printer, .printer-strip__more {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--m3d-text);
  &:hover { background: var(--m3d-fill); }
  &:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 1px; }
}
.printer-strip__more { border: 1px solid var(--m3d-border-strong); font-size: 13px; font-weight: 600; }
.printer-strip__error {
  position: absolute;
  z-index: 20;
  top: 100%;
  width: min(350px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid var(--m3d-danger);
  border-radius: 12px;
  background: var(--m3d-surface);
  color: var(--m3d-text);
  font-size: 13px;
  button { float: right; padding: 0 8px; }
}
</style>
