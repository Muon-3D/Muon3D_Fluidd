<template>
  <v-dialog
    :value="state.phase !== 'idle'"
    max-width="480"
    persistent
  >
    <v-card class="muon-ble-pair">
      <div class="muon-ble-pair__top">
        <span class="muon-ble-pair__pill">
          <v-icon x-small>$bluetooth</v-icon>
          Pair this browser
        </span>
        <v-spacer />
      </div>

      <v-card-text>
        <div
          v-if="state.phase === 'connecting'"
          data-tid="pair-connecting"
        >
          <p class="muon-ble-pair__title">
            <v-progress-circular
              indeterminate
              size="16"
              width="2"
              class="mr-2"
            />
            Connecting over Bluetooth…
          </p>
          <p class="muon-ble-pair__body">
            Keep this computer near the printer. It needs a pairing window open first: on its screen,
            open <strong>Settings &gt; Add a device</strong>.
          </p>
          <div class="muon-ble-pair__actions">
            <v-btn
              text
              data-tid="pair-cancel"
              @click="cancel"
            >
              Cancel
            </v-btn>
          </div>
        </div>

        <div
          v-else-if="state.phase === 'code'"
          data-tid="pair-code-step"
        >
          <p class="muon-ble-pair__title">
            Add Control on the printer
          </p>
          <ol class="muon-ble-pair__steps">
            <li>On the printer's screen, open <strong>Settings &gt; Add a device</strong>. It shows an 8-digit code.</li>
            <li>Check the printer shows these six characters:</li>
          </ol>
          <div
            class="muon-ble-pair__sas"
            data-tid="pair-sas"
          >
            {{ state.comparison }}
          </div>
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
          <div class="muon-ble-pair__actions">
            <v-btn
              color="primary"
              data-tid="pair-submit"
              @click="submit"
            >
              Pair
            </v-btn>
            <v-btn
              text
              data-tid="pair-cancel"
              @click="cancel"
            >
              Cancel
            </v-btn>
          </div>
        </div>

        <div
          v-else-if="state.phase === 'waiting'"
          data-tid="pair-waiting"
        >
          <p class="muon-ble-pair__title">
            <v-progress-circular
              indeterminate
              size="16"
              width="2"
              class="mr-2"
            />
            Confirm on the printer
          </p>
          <p class="muon-ble-pair__body">
            On the printer, check the six characters are
            <strong data-tid="pair-waiting-sas">{{ state.comparison }}</strong>, choose what Control may do, and press Confirm.
            This ends by itself after 2 minutes.
          </p>
          <div class="muon-ble-pair__actions">
            <v-btn
              text
              data-tid="pair-cancel"
              @click="cancel"
            >
              Cancel
            </v-btn>
          </div>
        </div>

        <div
          v-else
          data-tid="pair-failed"
        >
          <p class="muon-ble-pair__title">
            Pairing didn't finish
          </p>
          <p
            class="muon-ble-pair__body"
            data-tid="pair-message"
          >
            {{ state.message }}
          </p>
          <div class="muon-ble-pair__actions">
            <v-btn
              color="primary"
              data-tid="pair-retry"
              @click="retry"
            >
              Try again
            </v-btn>
            <v-btn
              text
              data-tid="pair-cancel"
              @click="cancel"
            >
              Close
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cancelPairing, pairingState, startPairing, submitPairingCode } from '@/services/muon-ble/pairing'

/**
 * Pairs this browser with a printer over Bluetooth (KAN-1253; SEC-7). The
 * person opens Add a device on the printer, reads the code off its screen and
 * confirms there. Control never asks for a role: the printer's panel does.
 */
@Component({})
export default class BluetoothPairDialog extends Vue {
  code = ''

  get state () {
    return pairingState
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
  &__top {
    display: flex;
    align-items: center;
    padding: 12px 12px 0 20px;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
    font-size: var(--m3d-text-xs);
    font-weight: var(--m3d-weight-semibold);

    .v-icon {
      color: inherit !important;
    }
  }

  &__title {
    display: flex;
    align-items: center;
    font-size: var(--m3d-text-lg);
    font-weight: var(--m3d-weight-semibold);
    color: var(--m3d-text);
    margin: 8px 0;
  }

  &__body,
  &__steps {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
    margin: 0 0 12px;
  }

  &__steps {
    padding-left: 20px;
  }

  &__sas {
    text-align: center;
    font-family: var(--m3d-font-mono);
    font-size: 28px;
    letter-spacing: 4px;
    margin: 8px 0 16px;
    color: var(--m3d-text);
  }

  &__error {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-danger, #d32f2f);
    margin: 8px 0 0;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }
}
</style>
