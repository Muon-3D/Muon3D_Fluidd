<template>
  <bluetooth-sheet
    :value="open"
    :step="step"
    :persistent="phase === 'connecting' || phase === 'setup'"
    label="Set up over Bluetooth"
    close-tid="ble-setup-close"
    @close="open = false"
  >
    <!-- setup-ble-connecting -->
    <div
      v-if="phase === 'connecting'"
      data-tid="setup-ble-connecting"
    >
      <setup-step-card
        flat
        title="Find your printer"
        sub="Turn the printer on and keep it within a few metres of this device."
      >
        <bluetooth-printer-row
          :name="printerName"
          line="New, not set up"
          busy="Connecting…"
        />
        <p class="muon-ble-setup__body muon-ble-setup__after">
          This computer stays on its own network and talks to {{ shortName }} over Bluetooth.
        </p>
        <template #footer>
          <app-btn
            text
            class="setup-step__back"
            data-tid="ble-use-other"
            @click="useOtherWay"
          >
            Use the network or a code instead
          </app-btn>
        </template>
      </setup-step-card>
    </div>

    <!-- setup-ble-compare -->
    <div
      v-else-if="phase === 'compare'"
      data-tid="setup-ble-compare"
    >
      <setup-step-card
        flat
        title="Check the code"
        :sub="`${shortName}'s screen shows six characters. They must be the same as these.`"
      >
        <bluetooth-code-boxes
          :code="code"
          data-tid="ble-sas"
        />
        <template #footer>
          <v-btn
            text
            data-tid="ble-sas-mismatch"
            @click="theyDiffer"
          >
            They don't match
          </v-btn>
          <app-btn
            color="primary"
            data-tid="ble-sas-match"
            @click="theyMatch"
          >
            They match
          </app-btn>
        </template>
      </setup-step-card>
    </div>

    <!-- setup-ble-mismatch -->
    <div
      v-else-if="phase === 'mismatch'"
      data-tid="setup-ble-mismatch"
    >
      <setup-step-card
        flat
        title="That wasn't your printer"
        sub="The codes were different, so this page hung up and sent nothing."
      >
        <p class="muon-ble-setup__body">
          Set {{ shortName }} up through its own Wi-Fi instead, where what answers over Bluetooth
          doesn't matter.
        </p>
        <template #footer>
          <v-btn
            text
            @click="connect"
          >
            Try Bluetooth again
          </v-btn>
          <app-btn
            color="primary"
            @click="phase = 'hotspot'"
          >
            Use its Wi-Fi instead
          </app-btn>
        </template>
      </setup-step-card>
    </div>

    <!-- setup-ble-failed, and the other reasons a session did not start -->
    <div
      v-else-if="phase === 'failed'"
      data-tid="setup-ble-failed"
    >
      <setup-step-card
        flat
        :title="failure === 'set-up' ? `${shortName} is set up already` : failure === 'unsupported'
          ? `This page can't set printers up over Bluetooth yet` : `Couldn't reach ${shortName}`"
      >
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
        <template
          v-if="failure !== 'set-up'"
          #footer
        >
          <v-btn
            :text="failure !== 'unsupported'"
            :color="failure === 'unsupported' ? 'primary' : undefined"
            data-tid="ble-use-wifi"
            @click="phase = 'hotspot'"
          >
            Use its Wi-Fi instead
          </v-btn>
          <app-btn
            v-if="failure !== 'unsupported'"
            color="primary"
            data-tid="ble-retry"
            @click="connect"
          >
            Try again
          </app-btn>
        </template>
      </setup-step-card>
    </div>

    <!-- The hotspot route: it does not depend on what answers over Bluetooth. -->
    <div
      v-else-if="phase === 'hotspot'"
      data-tid="setup-ble-hotspot"
    >
      <setup-step-card
        flat
        :title="`Set ${shortName} up on its Wi-Fi`"
        :sub="`Or scan the QR code on ${shortName}'s screen with the Muon3D app.`"
      >
        <ol class="muon-ble-setup__steps">
          <li>Join the Wi-Fi network <strong>{{ hotspotName }}</strong> on this computer.</li>
          <li>Open <strong>http://10.42.0.1/setup</strong>.</li>
        </ol>
      </setup-step-card>
    </div>

    <!-- After "They match": the steps, over the same connection. -->
    <div
      v-else-if="phase === 'setup' && client"
      data-tid="setup-ble-steps"
    >
      <setup-wifi-steps
        :client="client"
        over-bluetooth
        @installing="installing = true"
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
      <setup-step-card
        flat
        :title="updateRestart ? `${shortName} is restarting to finish its update` : `The Bluetooth connection to ${shortName} dropped`"
      >
        <p class="muon-ble-setup__body">
          <template v-if="updateRestart">
            The Bluetooth link ends while it restarts. Carry on at its screen, or search again in a
            few minutes to find it.
          </template>
          <template v-else-if="joinedWifi">
            {{ shortName }} is on {{ joinedWifi }}. Search again to find it there, or carry on at its
            screen.
          </template>
          <template v-else>
            Bring this computer closer and try again, or use {{ shortName }}'s Wi-Fi instead.
          </template>
        </p>
        <template #footer>
          <v-btn
            text
            @click="finish"
          >
            Back to the list
          </v-btn>
          <app-btn
            v-if="!joinedWifi && !updateRestart"
            color="primary"
            @click="connect"
          >
            Try again
          </app-btn>
        </template>
      </setup-step-card>
    </div>
  </bluetooth-sheet>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue, Watch } from 'vue-property-decorator'
import SetupStepCard from '@/components/muon-setup/SetupStepCard.vue'
import BluetoothSheet from './BluetoothSheet.vue'
import BluetoothCodeBoxes from './BluetoothCodeBoxes.vue'
import BluetoothPrinterRow from './BluetoothPrinterRow.vue'
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
 *
 * Laid out as the Bluetooth sheet (v3 `bluetooth` storyboard): step 1 finds
 * the printer and checks the code, step 2 is setup's own steps over the same
 * connection, step 3 is the printer set up.
 */
@Component({ components: { BluetoothSheet, BluetoothCodeBoxes, BluetoothPrinterRow, SetupStepCard, SetupWifiSteps } })
export default class BluetoothSetupDialog extends Vue {
  @VModel({ type: Boolean })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly printer!: NearbyPrinter

  /** For tests: what `connectForSetup` is. */
  @Prop({ type: Function, default: connectForSetup })
  readonly connector!: typeof connectForSetup

  phase: Phase = 'connecting'
  /** An update was started over this link: the printer restarts and the link ends. */
  installing = false
  updateRestart = false
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

  get step (): number {
    if (this.phase === 'setup') return setupState.state?.state === 'complete' ? 3 : 2
    return this.phase === 'lost' ? 2 : 1
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
    this.installing = false
    this.updateRestart = false
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

  /** The other ways in: the printer's own Wi-Fi, or the QR code on its screen. Hangs up first. */
  async useOtherWay () {
    await this.hangUp()
    this.phase = 'hotspot'
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
    // An install restarts the printer, so its link going is expected, not a fault.
    this.updateRestart = this.installing || setupState.state?.op?.kind === 'update_install'
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
  &__body {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
    margin: 0 0 12px;
  }

  &__after {
    margin: 12px 0 0;
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
}
</style>
