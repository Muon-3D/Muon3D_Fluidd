<template>
  <v-dialog
    :value="open"
    max-width="440"
    content-class="slicer-confirm"
    @input="handleInput"
  >
    <v-card
      v-if="request"
      role="dialog"
      aria-labelledby="slicer-confirm-title"
    >
      <v-card-title class="card-heading py-2">
        <span
          id="slicer-confirm-title"
          ref="title"
          tabindex="-1"
          class="focus--text text-wrap"
        >{{ title }}</span>
        <v-spacer />
        <v-btn
          fab
          text
          x-small
          class="ml-1"
          data-test="slicer-confirm-close"
          :aria-label="$t('app.general.btn.close')"
          @click="answer({ choice: 'upload-only' })"
        >
          <v-icon>$close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-3">
        <p
          v-if="more"
          class="mb-2"
          data-test="slicer-confirm-more"
        >
          {{ more }}
        </p>
        <v-checkbox
          v-if="asksPlateClear"
          v-model="plateClear"
          hide-details
          class="mt-0"
          data-test="slicer-confirm-plate"
          :label="$t('app.slicer.confirm.plate_clear')"
        />
      </v-card-text>

      <v-card-actions>
        <app-btn
          text
          data-test="slicer-confirm-upload"
          @click="answer({ choice: 'upload-only' })"
        >
          {{ $t('app.slicer.confirm.upload_only') }}
        </app-btn>
        <v-spacer />
        <app-btn
          color="primary"
          data-test="slicer-confirm-print"
          :disabled="asksPlateClear && !plateClear"
          @click="answer({ choice: 'print', plateClear })"
        >
          {{ request.mode === 'queue' ? $t('app.slicer.confirm.queue') : $t('app.slicer.confirm.print') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { ConfirmAnswer } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'
import type { PlateClearAsk, PrintMode } from '@/services/slicer-bridge/vendor/printer-client/bridge/protocol'

/** What the dialog asks: the files the slicer uploaded, for the printer Fluidd has selected. */
export interface PrintConfirmRequest {
  printer: string;
  paths: string[];
  mode: PrintMode;
  plateClear: PlateClearAsk;
}

/**
 * Fluidd's own confirmation for a print the slicer in /slice asks for
 * (printer-bridge/1's print.request): the slicer never starts a print, the
 * person does, here. "Print ‹file› on ‹printer›?" (and "and queue ‹n› more"
 * for the plates that follow it), or in queue mode "Queue ‹file› on
 * ‹printer›?" ("and ‹n› more"). "Plate is clear" is asked when the host
 * decided it must be (never for a queue entry), and Print stays off until it
 * is ticked. Upload only, ✕, Esc and a click outside all answer Upload only:
 * the files stay on the printer and nothing starts.
 *
 * Focus starts on the title, never on Print, so a key held or pressed twice
 * where the slicer's button was cannot confirm the print.
 */
@Component({})
export default class PrintConfirmDialog extends Vue {
  @Prop({ type: Object, default: null })
  readonly request!: PrintConfirmRequest | null

  plateClear = false
  answered = false

  get open (): boolean {
    return this.request !== null
  }

  get asksPlateClear (): boolean {
    return this.request?.mode === 'start' && this.request.plateClear === 'ask'
  }

  get title (): string {
    const request = this.request
    if (!request) return ''
    const values = { file: request.paths[0] ?? '', printer: request.printer }
    return request.mode === 'queue'
      ? this.$t('app.slicer.confirm.queue_title', values).toString()
      : this.$t('app.slicer.confirm.print_title', values).toString()
  }

  get more (): string {
    const request = this.request
    const n = request ? request.paths.length - 1 : 0
    if (!request || n < 1) return ''
    return request.mode === 'queue'
      ? this.$t('app.slicer.confirm.and_more', { n }).toString()
      : this.$t('app.slicer.confirm.and_queue_more', { n }).toString()
  }

  @Watch('request')
  onRequest (request: PrintConfirmRequest | null) {
    this.plateClear = false
    this.answered = false
    if (request) {
      this.$nextTick(() => (this.$refs.title as HTMLElement | undefined)?.focus())
    }
  }

  mounted () {
    if (this.request) this.onRequest(this.request)
  }

  /** The dialog closed itself (Esc, a click outside): Upload only. */
  handleInput (value: boolean) {
    if (!value) this.answer({ choice: 'upload-only' })
  }

  answer (answer: ConfirmAnswer) {
    if (!this.request || this.answered) return
    if (answer.choice === 'print' && this.asksPlateClear && !answer.plateClear) return
    this.answered = true
    this.$emit('answer', answer)
  }
}
</script>
