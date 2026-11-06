<template>
  <div
    class="printer-opening"
    data-tid="printer-opening"
  >
    <template v-if="missing">
      <v-icon
        x-large
        class="mb-4 printer-opening__icon"
      >
        $printer3d
      </v-icon>
      <h2 class="printer-opening__title">
        No printer called {{ slug }} here
      </h2>
      <p class="printer-opening__text">
        This browser doesn't know that printer. It may be on another network,
        saved in another browser, or linked to another account.
      </p>
      <v-btn
        color="primary"
        to="/"
        data-tid="printer-opening-all"
      >
        All printers
      </v-btn>
    </template>

    <template v-else-if="error">
      <v-icon
        x-large
        class="mb-4 printer-opening__icon"
      >
        $alertCircle
      </v-icon>
      <h2 class="printer-opening__title">
        {{ presence === 'offline' ? 'Offline' : `Couldn't open ${name}` }}
      </h2>
      <p class="printer-opening__text">
        {{ error }}
      </p>
      <div class="printer-opening__actions">
        <v-btn
          v-if="fallbackUrl"
          color="primary"
          :href="fallbackUrl"
        >
          Open its own page
        </v-btn>
        <span
          v-if="pairingOffer"
          class="printer-opening__hint"
          data-tid="pair-hint"
        >Open Settings &gt; Add a device on the printer first.</span>
        <v-btn
          v-if="pairingOffer"
          color="primary"
          data-tid="pair-offer"
          @click="pair"
        >
          Pair this browser
        </v-btn>
        <v-btn
          text
          @click="retry"
        >
          Try again
        </v-btn>
        <v-btn
          text
          to="/"
        >
          All printers
        </v-btn>
      </div>
    </template>

    <template v-else>
      <v-progress-circular
        indeterminate
        size="40"
        width="3"
        color="primary"
        class="mb-4"
      />
      <h2 class="printer-opening__title">
        {{ presence === 'reconnecting' ? 'Reconnecting…' : `Opening ${name}…` }}
      </h2>
    </template>

    <approval-wait-dialog
      v-if="approval"
      :key="approvalKey"
      :watch="approval"
      :printer-name="name"
      @close="approval = null"
      @retry="retry"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { activationState } from '@/services/muon-cloud/activate'
import type { ApprovalWatch } from '@/services/muon-cloud/approval'
import { cloudState } from '@/services/muon-cloud/state'
import { consolePresence, type CloudPresence } from '@/services/muon-cloud/presence'
import { startPairing } from '@/services/muon-ble/pairing'
import ApprovalWaitDialog from '@/components/muon-cloud/ApprovalWaitDialog.vue'
import { openPrinterAt, printerPagesState, resolveSlug } from '@/services/printer-pages'

const approvalIds = new WeakMap<ApprovalWatch, number>()
let approvalCount = 0

/**
 * Shown on a printer's page while Fluidd is on another printer: opening the
 * one the address names, or why it can't. Never the last printer's page under
 * this printer's address.
 */
@Component({ components: { ApprovalWaitDialog } })
export default class PrinterOpening extends Vue {
  @Prop({ type: String, required: true })
  readonly slug!: string

  get presence (): CloudPresence {
    const target = resolveSlug(this.slug)
    const printer = target?.kind === 'cloud' ? cloudState.printers.find(p => p.id === target.printerId) : undefined
    const status = printer ? cloudState.status[printer.id] : undefined
    return printer ? consolePresence(printer, status?.updatedAt ?? Date.now()) : 'online'
  }

  get name (): string {
    const target = resolveSlug(this.slug)
    if (target?.kind === 'local') return target.instance.name || this.slug
    if (target?.kind === 'cloud') return cloudState.printers.find(p => p.id === target.printerId)?.name ?? this.slug
    return this.slug
  }

  /** Only once the account's printers are known: one of them may be it. */
  get missing (): boolean {
    return printerPagesState.missing === this.slug && (cloudState.ready || !cloudState.account)
  }

  /** The printer is holding this browser until its owner answers (I-170). */
  get approval (): ApprovalWatch | null {
    return activationState.approval
  }

  set approval (watch: ApprovalWatch | null) {
    activationState.approval = watch
  }

  /** A new wait is a new dialog, not the last one with new props. */
  get approvalKey (): number {
    if (!this.approval) return 0
    if (!approvalIds.has(this.approval)) approvalIds.set(this.approval, ++approvalCount)
    return approvalIds.get(this.approval) as number
  }

  get error (): string | null {
    return activationState.switching ? null : activationState.error
  }

  get fallbackUrl (): string | null {
    return activationState.fallbackUrl
  }

  /** The printer that refused this browser over Bluetooth, when it is the one this page opens. */
  get pairingOffer (): string | null {
    const target = resolveSlug(this.slug)
    const id = activationState.pairing
    return id && target?.kind === 'cloud' && target.printerId === id ? id : null
  }

  pair () {
    if (this.pairingOffer) startPairing(this.pairingOffer).catch(() => {})
  }

  retry () {
    activationState.approval = null
    activationState.error = null
    openPrinterAt(this.slug).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.printer-opening {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  padding: 24px;
}

.printer-opening__icon {
  opacity: .6;
}

.printer-opening__title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}

.printer-opening__text {
  max-width: 440px;
  opacity: .75;
  margin-bottom: 20px;
}

.printer-opening__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
</style>
