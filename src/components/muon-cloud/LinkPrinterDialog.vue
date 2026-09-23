<template>
  <v-dialog
    v-model="open"
    max-width="460"
    :persistent="step === 'confirm'"
  >
    <v-card class="muon-cloud-dialog">
      <template v-if="step === 'choose'">
        <v-card-title>Link a printer to your account</v-card-title>
        <v-card-subtitle class="pt-1">
          On the printer's network, pick it below and the code fills in by itself.
          Anywhere else, enter the six-digit code the printer's screen shows, or scan its QR code.
        </v-card-subtitle>

        <v-card-text>
          <template v-if="local.available">
            <div class="muon-cloud-dialog__label">
              This printer
            </div>
            <v-list
              dense
              class="mb-3 muon-cloud-dialog__list"
            >
              <v-list-item
                :disabled="busy || local.linked"
                @click="linkLocal"
              >
                <v-list-item-icon>
                  <v-icon>{{ icons.printer }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ local.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ local.linked ? `Already linked to ${local.account}` : 'Connected on this network · link it now' }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>

          <template v-if="nearby.length">
            <div class="muon-cloud-dialog__label">
              Waiting to link near you
            </div>
            <v-list
              dense
              class="mb-3 muon-cloud-dialog__list"
            >
              <v-list-item
                v-for="p in nearby"
                :key="p.printer_id"
                @click="claim({ printer_id: p.printer_id })"
              >
                <v-list-item-icon>
                  <v-icon>{{ icons.printer }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ p.name }}</v-list-item-title>
                  <v-list-item-subtitle>Tap to link</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>

          <div class="muon-cloud-dialog__label">
            Enter the code on the printer's screen
          </div>
          <v-otp-input
            v-model="code"
            length="6"
            type="number"
            :disabled="busy"
            @finish="claim({ code })"
          />
          <div class="text-caption text--secondary mt-1">
            Or scan the QR code with your phone. It opens this page with the code filled in.
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
            :loading="busy"
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
import { mdiPrinter3d } from '@mdi/js'
import { cloudApi } from '@/services/muon-cloud/api'
import { cloudState, refreshPrinters } from '@/services/muon-cloud/state'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'

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
  nearby: Array<{ printer_id: string, name: string }> = []
  local = { available: false, linked: false, account: '', name: '' }
  timer: number | null = null
  icons = { printer: mdiPrinter3d }

  get accountEmail () {
    return cloudState.account?.email ?? ''
  }

  created () {
    this.code = (this.initialCode || '').replace(/\D/g, '').slice(0, 6)
    if (this.code.length === 6) this.claim({ code: this.code })
    this.findNearby()
    this.probeLocal()
  }

  /** Whether Fluidd is connected to a Muon printer on this network that can start a link. */
  async probeLocal () {
    if (cloudState.activePrinterId || !this.$store.state.socket.open) return
    try {
      const response = await this.$httpClient.get('/server/muon/link')
      const s = response.data?.result ?? response.data
      if (!s || s.phase === 'unavailable') return
      this.local = {
        available: true,
        linked: s.phase === 'linked',
        account: s.account ?? '',
        name: this.$store.state.config.uiSettings.general.instanceName || 'This printer'
      }
    } catch { /* an older printer, or not a Muon printer */ }
  }

  /** Starts the link on the connected printer, reads its code, and claims it. */
  async linkLocal () {
    this.error = null
    this.busy = true
    try {
      await this.$httpClient.post('/server/muon/link/start')
      let code = ''
      for (let i = 0; i < 20 && !code; i++) {
        await new Promise(resolve => setTimeout(resolve, 750))
        const response = await this.$httpClient.get('/server/muon/link')
        const s = response.data?.result ?? response.data
        if (s?.phase === 'code') code = s.code
        if (s?.phase === 'failed') throw new Error(s.message)
      }
      if (!code) throw new Error('The printer did not get a code from the Muon service.')
      this.busy = false
      await this.claim({ code })
    } catch (error) {
      const e = error as any
      this.error = e?.response?.data?.error?.message ?? e?.message ?? String(error)
    } finally {
      this.busy = false
    }
  }

  beforeDestroy () {
    this.stopPolling()
  }

  @Watch('open')
  onOpen (value: boolean) {
    if (!value) this.stopPolling()
  }

  /** Printers on this network that are showing a code right now. */
  async findNearby () {
    const ids: string[] = []
    try {
      const response = await this.$httpClient.get('/server/muon/identity')
      const r = response.data?.result ?? response.data
      const id = r?.endpoint_id ?? r?.iroh_endpoint_id
      if (typeof id === 'string') ids.push(id)
    } catch { /* not a Muon printer, or not on this network */ }
    if (!ids.length) return
    try {
      this.nearby = (await cloudApi.nearby(ids)).waiting
    } catch { /* nothing waiting */ }
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
          this.step = 'done'
        } else if (state === 'declined' || state === 'expired') {
          this.stopPolling()
          this.error = state === 'declined'
            ? 'The link was declined on the printer.'
            : 'The code expired. Start again on the printer.'
          this.step = 'choose'
          this.code = ''
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
