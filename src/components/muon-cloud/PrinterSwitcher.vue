<template>
  <div class="muon-switcher">
    <template v-if="account && cloudPrinters.length">
      <div class="muon-switcher__heading">
        <v-icon
          x-small
          class="mr-1"
        >
          {{ icons.cloud }}
        </v-icon>
        Cloud
        <span class="muon-switcher__hint">{{ account.email }}</span>
      </div>
      <button
        v-for="p in cloudPrinters"
        :key="p.id"
        type="button"
        class="muon-switcher__item"
        :class="{ 'is-active': activeCloudId === p.id, 'is-offline': !p.online }"
        @click="pickCloud(p.id)"
      >
        <div class="muon-switcher__row">
          <span
            class="muon-switcher__dot"
            :class="`is-${tone(status(p.id), p.online)}`"
          />
          <span class="muon-switcher__name">{{ p.name }}</span>
          <span class="muon-switcher__badge is-cloud">Cloud</span>
          <v-progress-circular
            v-if="switching === p.id"
            indeterminate
            size="14"
            width="2"
            class="ml-2"
          />
        </div>
        <div class="muon-switcher__meta">
          {{ summary(status(p.id), p.online) }}
        </div>
        <div
          v-if="temps(status(p.id))"
          class="muon-switcher__meta muon-switcher__mono"
        >
          {{ temps(status(p.id)) }}
        </div>
        <v-progress-linear
          v-if="isPrinting(status(p.id))"
          :value="percent(status(p.id))"
          height="3"
          rounded
          class="mt-2"
        />
      </button>
    </template>

    <div class="muon-switcher__heading">
      <v-icon
        x-small
        class="mr-1"
      >
        {{ icons.lan }}
      </v-icon>
      Local
      <span class="muon-switcher__hint">this network</span>
    </div>
    <div
      v-for="(instance, index) in localInstances"
      :key="index"
      class="muon-switcher__item"
      :class="{ 'is-active': instance.active && !activeCloudId }"
      role="button"
      tabindex="0"
      @click="pickLocal(instance)"
      @keydown.enter="pickLocal(instance)"
    >
      <div class="muon-switcher__row">
        <span
          class="muon-switcher__dot"
          :class="instance.active && !activeCloudId ? `is-${localTone}` : 'is-idle'"
        />
        <span class="muon-switcher__name">{{ instance.name }}</span>
        <span class="muon-switcher__badge">Local</span>
        <v-spacer />
        <v-btn
          v-if="!(instance.active && !activeCloudId) && !instance.discovered"
          icon
          x-small
          @click.stop="removeInstance(instance)"
        >
          <v-icon x-small>
            $delete
          </v-icon>
        </v-btn>
      </div>
      <div class="muon-switcher__meta">
        <template v-if="instance.active && !activeCloudId && socketConnected">
          {{ localSummary }}
        </template>
        <template v-else>
          {{ hostOf(instance.apiUrl) }}
        </template>
      </div>
      <div
        v-if="instance.active && !activeCloudId && localTemps"
        class="muon-switcher__meta muon-switcher__mono"
      >
        {{ localTemps }}
      </div>
    </div>
    <button
      v-for="p in foundPrinters"
      :key="p.host"
      type="button"
      class="muon-switcher__item is-found"
      @click="pickFound(p)"
    >
      <div class="muon-switcher__row">
        <span class="muon-switcher__dot is-idle" />
        <span class="muon-switcher__name">{{ p.name }}</span>
        <span class="muon-switcher__badge">Found</span>
      </div>
      <div class="muon-switcher__meta">
        {{ p.host }} · connect
      </div>
    </button>
    <div
      v-if="!localInstances.length && !foundPrinters.length"
      class="muon-switcher__empty"
    >
      {{ scanning ? 'Looking for printers on this network…' : 'No printers added on this network.' }}
    </div>

    <div class="muon-switcher__actions">
      <app-btn
        v-if="account"
        small
        text
        color="primary"
        @click="linkDialog = true"
      >
        <v-icon
          small
          left
        >
          {{ icons.link }}
        </v-icon>
        Link a printer
      </app-btn>
      <app-btn
        v-else
        small
        text
        color="primary"
        @click="accountDialog = true"
      >
        <v-icon
          small
          left
        >
          {{ icons.cloud }}
        </v-icon>
        Sign in to reach printers anywhere
      </app-btn>
      <v-btn
        small
        text
        @click="instanceDialogOpen = true"
      >
        <v-icon
          small
          left
        >
          $plus
        </v-icon>
        Add a local printer
      </v-btn>
    </div>

    <v-alert
      v-if="activationError"
      type="error"
      dense
      text
      class="ma-3"
    >
      {{ activationError }}
    </v-alert>

    <add-instance-dialog
      v-if="instanceDialogOpen"
      v-model="instanceDialogOpen"
      @resolve="pickLocal"
    />
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
    />
    <v-divider class="mt-2" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { mdiCloudOutline, mdiLan, mdiLinkVariantPlus } from '@mdi/js'
import type { InstanceConfig } from '@/store/config/types'
import StateMixin from '@/mixins/state'
import { cloudState, type PrinterStatus } from '@/services/muon-cloud/state'
import {
  activateCloudPrinter,
  activateLocalPrinter,
  activationState,
  MANAGED_API_URL
} from '@/services/muon-cloud/activate'
import { discoverPrinters, discoveryState, instanceFor, type LanPrinter } from '@/services/muon-cloud/discovery'
import CloudAccountDialog from './CloudAccountDialog.vue'
import LinkPrinterDialog from './LinkPrinterDialog.vue'

@Component({ components: { CloudAccountDialog, LinkPrinterDialog } })
export default class PrinterSwitcher extends Mixins(StateMixin) {
  instanceDialogOpen = false
  accountDialog = false
  linkDialog = false
  icons = { cloud: mdiCloudOutline, lan: mdiLan, link: mdiLinkVariantPlus }

  get account () {
    return cloudState.account
  }

  get cloudPrinters () {
    return cloudState.printers
  }

  get activeCloudId () {
    return cloudState.activePrinterId
  }

  get switching () {
    return activationState.switching
  }

  get activationError () {
    return activationState.error
  }

  get localInstances (): InstanceConfig[] {
    const all: InstanceConfig[] = this.$store.getters['config/getInstances'] ?? []
    return all.filter(i => i.apiUrl !== MANAGED_API_URL)
  }

  get scanning () {
    return discoveryState.scanning
  }

  /** Printers the network search found that are not added yet. */
  get foundPrinters (): LanPrinter[] {
    const added = new Set(this.localInstances.map(i => this.hostOf(i.apiUrl)))
    return discoveryState.found.filter(p => !added.has(p.host))
  }

  mounted () {
    discoverPrinters().catch(() => {})
  }

  async pickFound (p: LanPrinter) {
    this.$emit('click')
    await activateLocalPrinter(instanceFor(p))
  }

  status (id: string): PrinterStatus | undefined {
    return cloudState.status[id]
  }

  isPrinting (s?: PrinterStatus) {
    return s?.reachable && (s.state === 'printing' || s.state === 'paused')
  }

  percent (s?: PrinterStatus) {
    return Math.round((s?.progress ?? 0) * 100)
  }

  tone (s: PrinterStatus | undefined, online: boolean) {
    if (!online || !s?.reachable) return 'offline'
    if (s.state === 'printing') return 'printing'
    if (s.state === 'paused') return 'paused'
    if (s.state === 'error' || s.state?.startsWith('klipper')) return 'error'
    return 'ready'
  }

  summary (s: PrinterStatus | undefined, online: boolean) {
    if (!online) return 'Offline'
    if (!s) return 'Connecting through Iroh…'
    if (!s.reachable) return s.error === 'offline' ? 'Offline' : `Unreachable: ${s.error}`
    const state = this.$filters.prettyCase(s.state ?? 'unknown')
    if (this.isPrinting(s)) return `${state} · ${this.percent(s)}% · ${s.filename ?? ''}`
    return state
  }

  temps (s?: PrinterStatus) {
    if (!s?.reachable || !s.extruder) return ''
    const e = s.extruder
    const b = s.bed
    const nozzle = `Nozzle ${e.temperature.toFixed(0)}/${e.target.toFixed(0)}°C`
    return b ? `${nozzle} · Bed ${b.temperature.toFixed(0)}/${b.target.toFixed(0)}°C` : nozzle
  }

  get localTone () {
    if (!this.socketConnected) return 'offline'
    if (this.printerPrinting) return 'printing'
    if (this.printerPaused) return 'paused'
    return this.klippyReady ? 'ready' : 'error'
  }

  get localSummary () {
    const state = this.$filters.prettyCase(this.printerState || 'unknown')
    if (this.printerPrinting) {
      const progress = Math.round((this.$store.getters['printer/getPrintProgress'] ?? 0) * 100)
      return `${state} · ${progress}%`
    }
    return state
  }

  get localTemps () {
    const printer = this.$store.state.printer.printer
    const e = printer.extruder
    const b = printer.heater_bed
    if (!e) return ''
    const nozzle = `Nozzle ${Number(e.temperature).toFixed(0)}/${Number(e.target).toFixed(0)}°C`
    return b ? `${nozzle} · Bed ${Number(b.temperature).toFixed(0)}/${Number(b.target).toFixed(0)}°C` : nozzle
  }

  hostOf (url: string) {
    try {
      return new URL(url).host
    } catch {
      return url
    }
  }

  removeInstance (instance: InstanceConfig) {
    this.$store.dispatch('config/removeInstance', instance)
  }

  async pickCloud (id: string) {
    this.$emit('click')
    if (cloudState.activePrinterId === id && !activationState.error) return
    await activateCloudPrinter(id).catch(() => {})
  }

  async pickLocal (instance: InstanceConfig) {
    this.$emit('click')
    if (instance.active && !cloudState.activePrinterId) return
    await activateLocalPrinter(instance)
  }
}
</script>

<style lang="scss" scoped>
.muon-switcher {
  padding: 4px 0 0;

  &__heading {
    display: flex;
    align-items: center;
    padding: 14px 16px 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  &__hint {
    margin-left: auto;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    opacity: 0.8;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item {
    display: block;
    width: calc(100% - 16px);
    margin: 0 8px 6px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(128, 128, 128, 0.18);
    text-align: left;
    cursor: pointer;
    color: inherit;
    background: transparent;
    transition: background 120ms ease, border-color 120ms ease;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
    }

    &.is-active {
      border-color: var(--v-primary-base);
      background: rgba(128, 128, 128, 0.06);
    }

    &.is-offline {
      opacity: 0.6;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-weight: 600;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid rgba(128, 128, 128, 0.4);
    opacity: 0.8;

    &.is-cloud {
      border-color: var(--v-primary-base);
      color: var(--v-primary-base);
      opacity: 1;
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
    background: #8a8a8a;

    &.is-ready { background: #3fb950; }
    &.is-printing { background: #2f81f7; box-shadow: 0 0 0 3px rgba(47, 129, 247, 0.25); }
    &.is-paused { background: #d29922; }
    &.is-error { background: #f85149; }
    &.is-offline, &.is-idle { background: #6e7681; }
  }

  &__meta {
    margin: 4px 0 0 16px;
    font-size: 12px;
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__mono {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 11px;
  }

  &__empty {
    padding: 4px 16px 8px;
    font-size: 12px;
    opacity: 0.6;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 8px;
  }
}
</style>
