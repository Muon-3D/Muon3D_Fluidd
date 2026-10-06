<template>
  <app-dialog
    v-model="open"
    :title="title"
    max-width="420"
  >
    <v-card-text class="pt-4">
      <template v-if="phase === 'asking'">
        <div class="d-flex align-center">
          <v-progress-circular
            indeterminate
            size="18"
            width="2"
            class="mr-3"
          />
          Asking {{ printerName }}…
        </div>
      </template>

      <template v-else-if="phase === 'pending'">
        <p class="mb-3">
          {{ printerName }} is asking on its screen now. Press the knob to allow it, or turn it to refuse.
        </p>
        <div
          class="access-code"
          data-tid="access-code"
        >
          {{ request && request.code }}
        </div>
        <p class="text-body-2 secondary--text mb-0">
          The printer shows the same code. It stops asking after {{ secondsLeft }} s.
        </p>
      </template>

      <v-alert
        v-else
        :type="phase === 'allowed' ? 'success' : phase === 'failed' ? 'error' : 'info'"
        dense
        text
        class="mb-0"
        data-tid="access-outcome"
      >
        {{ outcome }}
      </v-alert>
    </v-card-text>

    <template #actions>
      <v-spacer />
      <v-btn
        v-if="phase === 'pending' || phase === 'asking'"
        text
        @click="cancel"
      >
        Cancel
      </v-btn>
      <v-btn
        v-else
        text
        color="primary"
        @click="open = false"
      >
        Close
      </v-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'
import {
  AccessUnavailable,
  type AccessAsk,
  type AccessClient,
  type AccessRequest
} from '@/services/muon-access/api'

type Phase = 'asking' | 'pending' | 'allowed' | 'refused' | 'expired' | 'failed'

/** How often the answer is asked for. The panel gives up after two minutes. */
const POLL_MS = 2000

/**
 * Asks a printer's panel to allow one thing (access-model 2.5, ACC-6/17):
 * a change of entry, or this browser being let in (`join`). Only from the
 * printer's home network; the panel answers, and the first answer wins.
 */
@Component({})
export default class AccessRequestDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Object, required: true })
  readonly client!: AccessClient

  @Prop({ type: Object, required: true })
  readonly ask!: AccessAsk

  @Prop({ type: String, required: true })
  readonly printerName!: string

  phase: Phase = 'asking'
  request: AccessRequest | null = null
  error = ''
  now = Date.now()
  timer: number | null = null
  /** Closed or cancelled. A request that comes back after this is withdrawn. */
  gone = false

  get title () {
    return this.ask.kind === 'join' ? 'Ask for access' : 'Confirm on the printer'
  }

  get secondsLeft () {
    if (!this.request) return 0
    return Math.max(0, Math.round((this.request.expiresAt - this.now) / 1000))
  }

  get outcome () {
    switch (this.phase) {
      case 'allowed':
        return this.ask.kind === 'join'
          ? `${this.printerName} let you in. Connect to it from the printer list.`
          : `${this.printerName} allowed the change.`
      case 'refused':
        return `${this.printerName} refused.`
      case 'expired':
        return 'Nobody answered at the printer in time. Ask again when someone is beside it.'
      default:
        return this.error
    }
  }

  async mounted () {
    try {
      const request = await this.client.request(this.ask, 'Muon3D Fluidd')
      if (this.gone) {
        // Closed while the printer was still being asked: take it off the screen.
        this.client.cancelRequest(request.requestId).catch(() => {})
        return
      }
      this.request = request
      this.phase = 'pending'
      this.timer = window.setInterval(() => this.poll(), POLL_MS)
    } catch (error) {
      if (this.gone) return
      this.phase = 'failed'
      this.error = error instanceof AccessUnavailable
        ? `${this.printerName}'s software cannot take requests yet. Ask its owner to let you in.`
        : (error as Error).message
    }
  }

  beforeDestroy () {
    this.gone = true
    this.stop()
    // Leaving while it is still asking takes the question off the printer's screen.
    if (this.phase === 'pending' && this.request) this.client.cancelRequest(this.request.requestId).catch(() => {})
  }

  stop () {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  async poll () {
    this.now = Date.now()
    if (!this.request || this.phase !== 'pending') return
    try {
      const status = await this.client.requestStatus(this.request.requestId)
      if (this.phase !== 'pending' || status === 'pending') return
      this.phase = status
      this.stop()
      this.$emit('answered', status)
    } catch { /* ask again next time */ }
  }

  async cancel () {
    this.gone = true
    this.stop()
    if (this.request && this.phase === 'pending') await this.client.cancelRequest(this.request.requestId).catch(() => {})
    this.phase = 'expired'
    this.open = false
  }
}
</script>

<style lang="scss" scoped>
.access-code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-align: center;
  padding: 12px 0;
  margin-bottom: 12px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 10px;
}
</style>
