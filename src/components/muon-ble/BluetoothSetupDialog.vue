<template>
  <v-dialog
    v-model="open"
    max-width="480"
    :persistent="phase === 'connecting' || phase === 'setup'"
  >
    <v-card class="muon-ble-setup">
      <div class="muon-ble-setup__top">
        <span class="muon-ble-setup__pill">
          <v-icon x-small>$bluetooth</v-icon>
          Over Bluetooth
        </span>
        <v-spacer />
        <v-btn
          icon
          small
          data-tid="ble-setup-close"
          @click="open = false"
        >
          <v-icon small>
            $close
          </v-icon>
        </v-btn>
      </div>

      <v-card-text>
        <!-- setup-ble-connecting -->
        <div
          v-if="phase === 'connecting'"
          data-tid="setup-ble-connecting"
        >
          <p class="muon-ble-setup__eyebrow">
            {{ printerName }} · nearby
          </p>
          <p class="muon-ble-setup__title">
            <v-progress-circular
              indeterminate
              size="16"
              width="2"
              class="mr-2"
            />
            Connecting over Bluetooth…
          </p>
          <p class="muon-ble-setup__body">
            Keep this computer near {{ shortName }}. It stays on its own network.
          </p>
        </div>

        <!-- setup-ble-compare -->
        <div
          v-else-if="phase === 'compare'"
          data-tid="setup-ble-compare"
        >
          <p class="muon-ble-setup__title">
            Check the code
          </p>
          <p class="muon-ble-setup__body">
            {{ shortName }}'s screen shows six characters. They must be the same as these.
          </p>
          <div
            class="muon-ble-setup__code"
            data-tid="ble-sas"
            :aria-label="code.split('').join(' ')"
          >
            <span
              v-for="(ch, i) in code.split('')"
              :key="i"
              :class="{ 'is-gap': i === 3 }"
            >{{ ch }}</span>
          </div>
          <div class="muon-ble-setup__actions">
            <app-btn
              color="primary"
              data-tid="ble-sas-match"
              @click="theyMatch"
            >
              They match
            </app-btn>
            <v-btn
              text
              data-tid="ble-sas-mismatch"
              @click="theyDiffer"
            >
              They don't match
            </v-btn>
          </div>
        </div>

        <!-- setup-ble-mismatch -->
        <div
          v-else-if="phase === 'mismatch'"
          data-tid="setup-ble-mismatch"
        >
          <p class="muon-ble-setup__title">
            That wasn't your printer
          </p>
          <p class="muon-ble-setup__body">
            The codes were different, so this page hung up and sent nothing.
          </p>
          <p class="muon-ble-setup__body">
            Set {{ shortName }} up through its own Wi-Fi instead, where what answers over Bluetooth
            doesn't matter.
          </p>
          <div class="muon-ble-setup__actions">
            <app-btn
              color="primary"
              @click="phase = 'hotspot'"
            >
              Use its Wi-Fi instead
            </app-btn>
            <v-btn
              text
              @click="connect"
            >
              Try Bluetooth again
            </v-btn>
          </div>
        </div>

        <!-- setup-ble-failed, and the other reasons a session did not start -->
        <div
          v-else-if="phase === 'failed'"
          data-tid="setup-ble-failed"
        >
          <p class="muon-ble-setup__title">
            {{ failure === 'set-up' ? `${shortName} is set up already` : failure === 'unsupported'
              ? "This page can't set printers up over Bluetooth yet" : `Couldn't reach ${shortName}` }}
          </p>
          <p class="muon-ble-setup__body">
            <template v-if="failure === 'set-up'">
              {{ shortName }} only takes a new connection over Bluetooth before it is set up. Join the
              network it's on, or link it to your account at the printer.
            </template>
            <template v-else-if="failure === 'unsupported'">
              The Muon3D console hasn't been updated for Bluetooth yet. Use {{ shortName }}'s Wi-Fi
              instead.
            </template>
            <template v-else-if="failure === 'busy'">
              Another device is connected to {{ shortName }}. Try again once it has finished, or use
              {{ shortName }}'s Wi-Fi instead.
            </template>
            <template v-else>
              {{ shortName }} stopped answering over Bluetooth. Bring this computer closer, or use
              {{ shortName }}'s Wi-Fi instead.
            </template>
          </p>
          <div class="muon-ble-setup__actions">
            <app-btn
              v-if="failure !== 'set-up' && failure !== 'unsupported'"
              color="primary"
              data-tid="ble-retry"
              @click="connect"
            >
              Try again
            </app-btn>
            <v-btn
              v-if="failure !== 'set-up'"
              :text="failure !== 'unsupported'"
              :color="failure === 'unsupported' ? 'primary' : undefined"
              data-tid="ble-use-wifi"
              @click="phase = 'hotspot'"
            >
              Use its Wi-Fi instead
            </v-btn>
          </div>
        </div>

        <!-- The hotspot route: it does not depend on what answers over Bluetooth. -->
        <div
          v-else-if="phase === 'hotspot'"
          data-tid="setup-ble-hotspot"
        >
          <p class="muon-ble-setup__title">
            Set {{ shortName }} up on its Wi-Fi
          </p>
          <ol class="muon-ble-setup__steps">
            <li>Join the Wi-Fi network <strong>{{ hotspotName }}</strong> on this computer.</li>
            <li>Open <strong>http://10.42.0.1/setup</strong>.</li>
          </ol>
          <p class="muon-ble-setup__body">
            Or scan the QR code on {{ shortName }}'s screen with the Muon3D app.
          </p>
        </div>

        <!-- After "They match": the steps, over the same connection. -->
        <div
          v-else-if="phase === 'setup' && client"
          data-tid="setup-ble-steps"
        >
          <setup-wifi-steps
            :client="client"
            over-bluetooth
          >
            <template #done>
              <p class="muon-ble-setup__body">
                {{ shortName }} is on its Wi-Fi. Search again to open it from this page.
              </p>
              <app-btn
                color="primary"
                @click="finish"
              >
                Back to the list
              </app-btn>
            </template>
            <template #elsewhere>
              <app-btn
                text
                @click="finish"
              >
                Back to the list
              </app-btn>
            </template>
          </setup-wifi-steps>
        </div>

        <!-- The connection ended before setup finished. -->
        <div
          v-else-if="phase === 'lost'"
          data-tid="setup-ble-lost"
        >
          <p class="muon-ble-setup__title">
            The Bluetooth connection to {{ shortName }} dropped
          </p>
          <p class="muon-ble-setup__body">
            <template v-if="joinedWifi">
              {{ shortName }} is on {{ joinedWifi }}. Search again to find it there, or carry on at its
              screen.
            </template>
            <template v-else>
              Bring this computer closer and try again, or use {{ shortName }}'s Wi-Fi instead.
            </template>
          </p>
          <div class="muon-ble-setup__actions">
            <app-btn
              v-if="!joinedWifi"
              color="primary"
              @click="connect"
            >
              Try again
            </app-btn>
            <v-btn
              text
              @click="finish"
            >
              Back to the list
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue, Watch } from 'vue-property-decorator'
import SetupWifiSteps from '@/components/muon-setup/SetupWifiSteps.vue'
import { connectForSetup, type BleSetupFailure, type BleSetupSession } from '@/services/muon-ble/setup'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'
import { createSetupClient, type SetupClient } from '@/services/muon-setup/client'
import { applyState, resetSetupState, setLocal, setupState } from '@/services/muon-setup/state'

type Phase = 'connecting' | 'compare' | 'mismatch' | 'failed' | 'hotspot' | 'setup' | 'lost'

/**
 * Setup over Bluetooth from the hosted page (ADR 0032 D7; WS-16 batch 8's
 * `setup-ble-*` screens, in Fluidd's dialog). The computer stays on its own
 * network. Nothing but reads of the setup state goes to the printer until the
 * person says the codes match; those reads also keep the code on the
 * printer's screen.
 */
@Component({ components: { SetupWifiSteps } })
export default class BluetoothSetupDialog extends Vue {
  @VModel({ type: Boolean })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly printer!: NearbyPrinter

  /** For tests: what `connectForSetup` is. */
  @Prop({ type: Function, default: connectForSetup })
  readonly connector!: typeof connectForSetup

  phase: Phase = 'connecting'
  failure: BleSetupFailure | null = null
  code = ''
  client: SetupClient | null = null
  private session: BleSetupSession | null = null
  /** Bumped by every attempt, so a late answer from an earlier one is dropped. */
  private attempt = 0

  get printerName (): string {
    return this.printer.display || this.printer.localName || 'Printer'
  }

  /** "Walnut", as the screens say it. */
  get shortName (): string {
    return this.printerName.split(' · ')[0]
  }

  get hotspotName (): string {
    return this.printer.localName ? `Muon-${this.printer.localName}` : 'Muon-…'
  }

  get joinedWifi (): string | null {
    const network = setupState.state?.steps.network
    return network && network.addresses.length ? network.ssid ?? 'its network' : null
  }

  created () {
    this.connect()
  }

  destroyed () {
    this.hangUp()
  }

  @Watch('open')
  onOpen (value: boolean) {
    if (!value) this.hangUp()
  }

  async connect () {
    await this.hangUp()
    const attempt = ++this.attempt
    this.phase = 'connecting'
    this.failure = null
    const result = await this.connector(this.printer)
    if (attempt !== this.attempt) {
      if (result.ok) result.session.close()
      return
    }
    if (!result.ok) {
      this.failure = result.reason
      this.phase = 'failed'
      return
    }
    const session = result.session
    this.session = session
    this.code = session.code
    resetSetupState()
    setLocal({ droveSetup: false, changingWifi: false, joinRev: null })
    applyState(session.state, { fromGet: true })
    const client = createSetupClient({ transport: session.transport, overBluetooth: true })
    this.client = client
    // Reads only, every 2 s: they carry the code to the printer's screen.
    client.start()
    this.phase = 'compare'
    session.closed.then(() => this.onDropped(attempt))
  }

  theyMatch () {
    this.phase = 'setup'
  }

  async theyDiffer () {
    await this.hangUp()
    this.phase = 'mismatch'
  }

  /** muon-link hangs a setup session up when setup completes, or the radio went. */
  onDropped (attempt: number) {
    if (attempt !== this.attempt || !this.session) return
    this.client?.stop()
    this.session = null
    if (this.phase !== 'compare' && this.phase !== 'setup') return
    this.phase = setupState.state?.state === 'complete' ? 'setup' : 'lost'
  }

  async hangUp () {
    this.attempt++
    this.client?.stop()
    const session = this.session
    this.session = null
    await session?.close().catch(() => {})
  }

  finish () {
    this.open = false
    this.$emit('finished')
  }
}
</script>

<style lang="scss" scoped>
.muon-ble-setup {
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

  &__eyebrow {
    font-size: var(--m3d-text-xs);
    color: var(--m3d-text-muted);
    margin: 8px 0 4px;
  }

  &__title {
    display: flex;
    align-items: center;
    font-size: var(--m3d-text-lg);
    font-weight: var(--m3d-weight-semibold);
    color: var(--m3d-text);
    margin: 8px 0;
  }

  &__body {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
    margin: 0 0 12px;
  }

  &__code {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin: 16px 0 20px;

    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 52px;
      border: 1px solid var(--m3d-border);
      border-radius: var(--m3d-radius-md);
      background: var(--m3d-surface-2);
      font-family: var(--m3d-font-mono);
      font-size: 26px;
      font-weight: var(--m3d-weight-semibold);
      color: var(--m3d-text);

      &.is-gap {
        margin-left: 12px;
      }
    }
  }

  &__steps {
    margin: 0 0 12px;
    padding-left: 20px;
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text);

    li {
      margin-bottom: 4px;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
