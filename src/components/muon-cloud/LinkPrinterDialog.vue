<template>
  <v-dialog
    v-model="open"
    max-width="480"
    :persistent="step === 'confirm'"
  >
    <v-card class="muon-cloud-dialog">
      <template v-if="step === 'choose'">
        <v-card-title>Link a printer to your account</v-card-title>
        <v-card-subtitle
          v-if="lanUnavailable"
          class="pt-1"
        >
          Enter the six-digit code the printer's screen shows while it is linking,
          or scan its QR code with your phone.
        </v-card-subtitle>
        <v-card-subtitle
          v-else
          class="pt-1"
        >
          Pick a printer on this network and it asks you to confirm on its screen.
          Anywhere else, enter the six-digit code its screen shows.
        </v-card-subtitle>

        <v-card-text>
          <template v-if="!lanUnavailable">
            <div class="muon-cloud-dialog__label">
              On this network
              <v-spacer />
              <span
                v-if="scanning"
                class="muon-cloud-dialog__scan"
              >
                <v-progress-circular
                  indeterminate
                  size="11"
                  width="2"
                  class="mr-1"
                />
                Searching {{ scanNetwork }}
              </span>
              <v-btn
                v-else
                x-small
                text
                @click="rescan"
              >
                Search again
              </v-btn>
            </div>
            <v-list
              v-if="lanPrinters.length"
              dense
              class="mb-4 muon-cloud-dialog__list"
            >
              <v-list-item
                v-for="p in lanPrinters"
                :key="p.host"
                :disabled="busy || !canLink(p)"
                @click="linkLan(p)"
              >
                <v-list-item-icon>
                  <v-progress-circular
                    v-if="linking === p.host"
                    indeterminate
                    size="20"
                    width="2"
                  />
                  <v-icon v-else>
                    {{ icons.printer }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ p.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ p.host }} · {{ lanStatus(p) }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <div
              v-else
              class="muon-cloud-dialog__empty mb-4"
            >
              {{ scanning ? 'Looking for Muon3D printers…' : 'No Muon3D printers answered on this network.' }}
            </div>
          </template>

          <div class="muon-cloud-dialog__label">
            Or enter the code on the printer's screen
          </div>
          <v-otp-input
            v-model="code"
            length="6"
            type="number"
            :disabled="busy"
            @finish="claim({ code })"
          />
          <div class="text-caption text--secondary mt-1">
            Scanning the QR code on the screen with your phone opens this page with the code filled in.
          </div>
          <v-alert
            v-if="error"
            type="error"
            dense
            text
            class="mt-3 mb-0"
          >
            {{ error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="open = false"
          >
            Cancel
          </v-btn>
          <app-btn
            color="primary"
            :disabled="code.length !== 6"
            :loading="busy && !linking"
            @click="claim({ code })"
          >
            Link
          </app-btn>
        </v-card-actions>
      </template>

      <template v-else-if="step === 'confirm'">
        <v-card-title>Confirm on the printer</v-card-title>
        <v-card-text>
          <div class="muon-cloud-confirm">
            <v-progress-circular
              indeterminate
              size="36"
              width="3"
              color="primary"
            />
            <div>
              <div class="text-subtitle-1">
                {{ claimed && claimed.name }}
              </div>
              <div class="text-body-2 text--secondary">
                The printer's screen is asking whether to link it to
                <strong>{{ accountEmail }}</strong>. Turn the knob to <strong>Confirm</strong> and press it.
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="reset"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </template>

      <template v-else-if="step === 'done'">
        <v-card-title>{{ claimed && claimed.name }} is linked</v-card-title>
        <v-card-text>
          You can reach it from anywhere you are signed in. It appears under
          <strong>Cloud</strong> in the printer list and in <strong>Fleet</strong>.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="open = false"
          >
            Close
          </v-btn>
          <app-btn
            color="primary"
            @click="openPrinter"
          >
            Open it now
          </app-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue, Watch } from 'vue-property-decorator'
import { cloudApi } from '@/services/muon-cloud/api'
import { cloudState, refreshPrinters } from '@/services/muon-cloud/state'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import {
  discoverPrinters,
  discoveryState,
  refreshLinkStates,
  startLanLink,
  type LanPrinter
} from '@/services/muon-cloud/discovery'

@Component({})
export default class LinkPrinterDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: '' })
  readonly initialCode!: string

  step: 'choose' | 'confirm' | 'done' = 'choose'
  code = ''
  busy = false
  error: string | null = null
  claimed: { printer_id: string, name: string } | null = null
  linking: string | null = null
  timer: number | null = null
  icons = { printer: '$printer3d' }

  get accountEmail () {
    return cloudState.account?.email ?? ''
  }

  get lanPrinters (): LanPrinter[] {
    return discoveryState.found
  }

  get scanning () {
    return discoveryState.scanning
  }

  get scanNetwork () {
    return discoveryState.network
  }

  get lanUnavailable () {
    return discoveryState.unavailable
  }

  created () {
    this.code = (this.initialCode || '').replace(/\D/g, '').slice(0, 6)
    if (this.code.length === 6) this.claim({ code: this.code })
    refreshLinkStates().catch(() => {})
    discoverPrinters().catch(() => {})
  }

  beforeDestroy () {
    this.stopPolling()
  }

  @Watch('open')
  onOpen (value: boolean) {
    if (!value) this.stopPolling()
  }

  rescan () {
    discoverPrinters(true).catch(() => {})
  }

  canLink (p: LanPrinter) {
    return ['unlinked', 'code', 'failed', 'connecting'].includes(p.link.phase)
  }

  lanStatus (p: LanPrinter) {
    switch (p.link.phase) {
      case 'unlinked': return 'link it now'
      case 'connecting': return 'starting…'
      case 'code': return 'showing a code · link it now'
      case 'offer': return 'waiting for confirmation on its screen'
      case 'failed': return 'could not reach the Muon3D service · try again'
      case 'linked':
        return p.link.account && p.link.account === this.accountEmail
          ? 'already in your account'
          : 'linked to another account'
      default: return 'needs an update before it can link'
    }
  }

  /** Starts the link on a printer on this network, reads its code, and claims it. */
  async linkLan (p: LanPrinter) {
    if (this.busy) return
    this.error = null
    this.busy = true
    this.linking = p.host
    try {
      const code = p.link.phase === 'code' && p.link.code ? p.link.code : await startLanLink(p.apiUrl)
      this.busy = false
      await this.claim({ code })
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.busy = false
      this.linking = null
    }
  }

  async claim (what: { code?: string, printer_id?: string }) {
    if (this.busy) return
    this.error = null
    this.busy = true
    try {
      const claimed = await cloudApi.claim(what)
      this.claimed = { printer_id: claimed.printer_id, name: claimed.name }
      this.step = 'confirm'
      this.startPolling()
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.busy = false
    }
  }

  startPolling () {
    this.stopPolling()
    this.timer = window.setInterval(async () => {
      if (!this.claimed) return
      try {
        const { state } = await cloudApi.linkState(this.claimed.printer_id)
        if (state === 'linked') {
          this.stopPolling()
          await refreshPrinters()
          refreshLinkStates().catch(() => {})
          this.step = 'done'
        } else if (state === 'declined' || state === 'expired') {
          this.stopPolling()
          this.error = state === 'declined'
            ? 'The link was declined on the printer.'
            : 'The code expired. Start again.'
          this.step = 'choose'
          this.code = ''
          refreshLinkStates().catch(() => {})
        }
      } catch { /* keep waiting */ }
    }, 1500)
  }

  stopPolling () {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  reset () {
    this.stopPolling()
    this.step = 'choose'
    this.code = ''
    this.claimed = null
  }

  async openPrinter () {
    const id = this.claimed?.printer_id
    this.open = false
    if (id) await activateCloudPrinter(id).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.muon-cloud-dialog {
  &__label {
    display: flex;
    align-items: center;
    min-height: 24px;
    margin-bottom: 6px;
    font-size: var(--m3d-text-2xs, 11px);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--m3d-text-muted);
  }

  &__scan {
    display: inline-flex;
    align-items: center;
    font-family: var(--m3d-font-mono);
    letter-spacing: 0;
    text-transform: none;
  }

  &__list {
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: transparent;
  }

  &__empty {
    padding: 12px;
    border: 1px dashed var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
  }
}

.muon-cloud-confirm {
  display: flex;
  gap: 16px;
  align-items: center;
}
</style>
