<template>
  <bluetooth-sheet
    :value="state.phase !== 'idle'"
    :step="step"
    :of="2"
    persistent
    label="Pair this browser"
    close-tid="pair-close"
    @close="cancel"
  >
    <setup-step-card
      v-if="state.phase === 'connecting'"
      flat
      title="Find your printer"
      sub="Turn the printer on and keep it within a few metres of this device."
      data-tid="pair-connecting"
    >
      <bluetooth-printer-row
        :name="printerName"
        line="Pairing this browser"
        busy="Connecting…"
      />
      <p class="muon-ble-pair__body">
        It needs a pairing window open first: on its screen, open <strong>Settings &gt; Add a device</strong>.
      </p>
      <template #footer>
        <app-btn
          text
          class="setup-step__back"
          data-tid="pair-cancel"
          @click="cancel"
        >
          Cancel
        </app-btn>
      </template>
    </setup-step-card>

    <setup-step-card
      v-else-if="state.phase === 'code'"
      flat
      title="Check the code"
      :sub="`Add Control on ${printerName}: on its screen, open Settings > Add a device. It shows an 8-digit code.`"
      data-tid="pair-code-step"
    >
      <p class="muon-ble-pair__label">
        {{ printerName }} shows these six characters too
      </p>
      <bluetooth-code-boxes
        :code="state.comparison"
        data-tid="pair-sas"
      />
      <v-text-field
        v-model="code"
        data-tid="pair-code"
        label="8-digit code from the printer"
        inputmode="numeric"
        autocomplete="off"
        outlined
        dense
        hide-details="auto"
        @keyup.enter="submit"
      />
      <p
        v-if="state.message"
        class="muon-ble-pair__error"
        data-tid="pair-message"
      >
        {{ state.message }}
      </p>
      <template #footer>
        <app-btn
          text
          class="setup-step__back"
          data-tid="pair-cancel"
          @click="cancel"
        >
          Cancel
        </app-btn>
        <app-btn
          color="primary"
          data-tid="pair-submit"
          @click="submit"
        >
          Pair
        </app-btn>
      </template>
    </setup-step-card>

    <setup-step-card
      v-else-if="state.phase === 'waiting'"
      flat
      title="Confirm on the printer"
      sub="Check its six characters are these, choose what Control may do, and press Confirm."
      data-tid="pair-waiting"
    >
      <bluetooth-code-boxes
        :code="state.comparison"
        data-tid="pair-waiting-sas"
      />
      <p class="muon-ble-pair__body muon-ble-pair__wait">
        <v-progress-circular
          indeterminate
          size="14"
          width="2"
        />
        Waiting for {{ printerName }}. This ends by itself after 2 minutes.
      </p>
      <template #footer>
        <app-btn
          text
          class="setup-step__back"
          data-tid="pair-cancel"
          @click="cancel"
        >
          Cancel
        </app-btn>
      </template>
    </setup-step-card>

    <setup-step-card
      v-else
      flat
      title="Pairing didn't finish"
      data-tid="pair-failed"
    >
      <p
        class="muon-ble-pair__body"
        data-tid="pair-message"
      >
        {{ state.message }}
      </p>
      <template #footer>
        <app-btn
          text
          class="setup-step__back"
          data-tid="pair-cancel"
          @click="cancel"
        >
          Close
        </app-btn>
        <app-btn
          color="primary"
          data-tid="pair-retry"
          @click="retry"
        >
          Try again
        </app-btn>
      </template>
    </setup-step-card>
  </bluetooth-sheet>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cancelPairing, pairingState, startPairing, submitPairingCode } from '@/services/muon-ble/pairing'
import { cloudState } from '@/services/muon-cloud/state'
import SetupStepCard from '@/components/muon-setup/SetupStepCard.vue'
import BluetoothSheet from './BluetoothSheet.vue'
import BluetoothCodeBoxes from './BluetoothCodeBoxes.vue'
import BluetoothPrinterRow from './BluetoothPrinterRow.vue'

/**
 * Pairs this browser with a printer over Bluetooth (KAN-1253; SEC-7). The
 * person opens Add a device on the printer, reads the code off its screen and
 * confirms there. Control never asks for a role: the printer's panel does.
 * Laid out as the Bluetooth sheet: find the printer, then check the code.
 */
@Component({ components: { BluetoothSheet, BluetoothCodeBoxes, BluetoothPrinterRow, SetupStepCard } })
export default class BluetoothPairDialog extends Vue {
  code = ''

  get state () {
    return pairingState
  }

  get printerName (): string {
    const id = pairingState.printerId
    return cloudState.printers.find(p => p.id === id)?.name || 'the printer'
  }

  /** Step 1 finds it; the code and the printer's Confirm are step 2. */
  get step (): number {
    return pairingState.phase === 'code' || pairingState.phase === 'waiting' ? 2 : 1
  }

  @Watch('state.phase')
  onPhase (phase: string) {
    if (phase === 'code' || phase === 'idle') this.code = ''
  }

  submit () {
    return submitPairingCode(this.code)
  }

  cancel () {
    cancelPairing()
  }

  retry () {
    const id = pairingState.printerId
    if (id) return startPairing(id)
  }
}
</script>

<style lang="scss" scoped>
.muon-ble-pair {
  &__label {
    margin: 0 0 8px;
    font-size: var(--m3d-text-xs);
    color: var(--m3d-text-muted);
    text-align: center;
  }

  &__body {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
    margin: 12px 0 0;
  }

  &__wait {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__error {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-danger, #d32f2f);
    margin: 8px 0 0;
  }
}
</style>
