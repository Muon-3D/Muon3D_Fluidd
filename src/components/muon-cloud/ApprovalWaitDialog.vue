<template>
  <app-dialog
    :value="visible"
    title="Waiting for approval"
    max-width="420"
    persistent
  >
    <v-card-text class="pt-4">
      <template v-if="!result">
        <p class="mb-3">
          Waiting for approval at the printer
        </p>
        <div
          class="approval-symbols"
          data-tid="approval-symbols"
        >
          {{ symbols }}
        </div>
        <p class="text-body-2 secondary--text mb-1">
          Check these match the printer's screen.
        </p>
        <p
          class="text-body-2 secondary--text mb-0"
          data-tid="approval-countdown"
        >
          {{ secondsLeft }} s left
        </p>
      </template>

      <v-alert
        v-else
        :type="result === 'admitted' ? 'success' : 'info'"
        dense
        text
        class="mb-0"
        data-tid="approval-outcome"
      >
        {{ outcomeText }}
      </v-alert>
    </v-card-text>

    <template #actions>
      <v-spacer />
      <v-btn
        v-if="!result"
        text
        data-tid="approval-cancel"
        @click="cancel"
      >
        Cancel
      </v-btn>
      <template v-else>
        <v-btn
          text
          data-tid="approval-close"
          @click="$emit('close')"
        >
          Close
        </v-btn>
        <v-btn
          v-if="result !== 'admitted'"
          text
          color="primary"
          data-tid="approval-retry"
          @click="$emit('retry')"
        >
          Try again
        </v-btn>
      </template>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { APPROVAL_WINDOW_S, APPROVAL_WORDS, type ApprovalOutcome, type ApprovalWatch } from '@/services/muon-cloud/approval'

/**
 * The wait after an unknown browser connects to a printer (I-170): the symbols
 * to compare with the printer's screen, a countdown, Cancel, and each way the
 * wait can end in plain words. The printer decides the end; the countdown is
 * only a reminder and never ends the wait itself.
 */
@Component({})
export default class ApprovalWaitDialog extends Vue {
  @Prop({ type: Object, required: true })
  readonly watch!: ApprovalWatch

  @Prop({ type: String, default: 'the printer' })
  readonly printerName!: string

  @Prop({ type: Number, default: APPROVAL_WINDOW_S })
  readonly windowSeconds!: number

  symbols: string | null = null
  result: ApprovalOutcome | null = null
  startedAt = 0
  now = 0
  timer: number | null = null
  gone = false

  get visible () {
    return this.symbols !== null || this.result !== null
  }

  get secondsLeft () {
    return Math.max(0, Math.ceil(this.windowSeconds - (this.now - this.startedAt) / 1000))
  }

  get outcomeText () {
    if (this.result === 'admitted') return `${this.printerName} let this device in.`
    return this.result ? APPROVAL_WORDS[this.result] : ''
  }

  created () {
    this.watch.pending.then(symbols => {
      if (this.gone || this.result) return
      this.symbols = symbols
      this.startedAt = this.now = Date.now()
      this.timer = window.setInterval(() => { this.now = Date.now() }, 1000)
    })
    this.watch.outcome.then(outcome => {
      if (this.gone) return
      this.stop()
      this.result = outcome
      this.$emit(outcome === 'admitted' ? 'admitted' : 'failed', outcome)
    })
  }

  beforeDestroy () {
    this.gone = true
    this.stop()
  }

  stop () {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  cancel () {
    this.gone = true
    this.stop()
    this.watch.cancel()
    this.$emit('close')
  }
}
</script>

<style lang="scss" scoped>
.approval-symbols {
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
