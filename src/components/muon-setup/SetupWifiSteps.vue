<template>
  <div class="muon-setup-steps">
    <!-- S1 Start (05 §3) -->
    <template v-if="screen === 'S1'">
      <p class="muon-setup-steps__title">
        Set up {{ display }}
      </p>
      <p class="muon-setup-steps__lede">
        <template v-if="overBluetooth">
          About three minutes. This computer stays on its own network and talks to {{ name }} over
          Bluetooth until {{ name }} is on Wi-Fi too.
        </template>
        <template v-else>
          About three minutes.
        </template>
      </p>
      <ol class="muon-setup-steps__plan">
        <li>Wi-Fi</li>
        <li>Name and updates</li>
        <li>Remote access, if you want it</li>
        <li>Last steps at the printer</li>
      </ol>
      <app-btn
        color="primary"
        block
        :loading="busy"
        data-tid="setup-start"
        @click="start"
      >
        Start
      </app-btn>
    </template>

    <!-- S3 Wi-Fi -->
    <template v-else-if="screen === 'S3'">
      <div class="muon-setup-steps__head">
        <p class="muon-setup-steps__title">
          Choose Wi-Fi
        </p>
        <v-btn
          small
          text
          :loading="scanning"
          data-tid="wifi-scan"
          @click="scan(true)"
        >
          Scan again
        </v-btn>
      </div>

      <div
        v-if="cable"
        class="muon-setup-steps__network is-card"
      >
        <span class="muon-setup-steps__network-name">Connected by cable · {{ cable }}</span>
        <v-btn
          small
          text
          :disabled="busy"
          @click="useCable"
        >
          Use this connection
        </v-btn>
      </div>

      <p
        v-if="scanError"
        class="muon-setup-steps__error"
      >
        {{ scanError }}
      </p>
      <p
        v-else-if="!scanning && !networks.length"
        class="muon-setup-steps__muted"
      >
        {{ name }} can't see any Wi-Fi networks. Scan again, or move it closer to the router.
      </p>

      <div
        v-for="n in networks"
        :key="n.ssid"
        class="muon-setup-steps__network"
        :class="{ 'is-open': selected === n.ssid, 'is-disabled': !!unusable(n) }"
      >
        <button
          type="button"
          class="muon-setup-steps__network-row"
          :disabled="!!unusable(n) || busy"
          :data-tid="`wifi-${n.ssid}`"
          @click="choose(n)"
        >
          <span class="muon-setup-steps__network-name">{{ n.ssid }}</span>
          <span class="muon-setup-steps__network-meta">
            {{ unusable(n) || networkMeta(n) }}
          </span>
        </button>
        <form
          v-if="selected === n.ssid"
          class="muon-setup-steps__join"
          @submit.prevent="join(n)"
        >
          <v-text-field
            v-if="needsPassword(n)"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            dense
            outlined
            hide-details="auto"
            :error-messages="passwordError"
            :append-icon="showPassword ? '$eyeOff' : '$eye'"
            data-tid="wifi-password"
            @click:append="showPassword = !showPassword"
          />
          <app-btn
            color="primary"
            type="submit"
            :loading="busy"
            :disabled="needsPassword(n) && !password"
            data-tid="wifi-connect"
          >
            Connect
          </app-btn>
        </form>
      </div>

      <p
        v-if="writeError"
        class="muon-setup-steps__error"
      >
        {{ writeError }}
      </p>

      <div
        v-if="confirmSkip"
        class="muon-setup-steps__confirm"
      >
        <p>{{ name }} will stay offline. You can connect it later from its screen.</p>
        <v-btn
          small
          text
          @click="confirmSkip = false"
        >
          Back
        </v-btn>
        <v-btn
          small
          text
          color="primary"
          :loading="busy"
          @click="skipNetwork"
        >
          Skip Wi-Fi
        </v-btn>
      </div>
      <v-btn
        v-else
        small
        text
        class="muon-setup-steps__skip"
        @click="confirmSkip = true"
      >
        Skip for now
      </v-btn>
    </template>

    <!-- S4 Joining -->
    <template v-else-if="screen === 'S4'">
      <p class="muon-setup-steps__title">
        Joining {{ joiningSsid }}
      </p>
      <ul class="muon-setup-steps__checklist">
        <li
          v-for="item in checklist"
          :key="item.label"
          :class="`is-${item.status}`"
        >
          <v-progress-circular
            v-if="item.status === 'now'"
            indeterminate
            size="12"
            width="2"
          />
          <v-icon
            v-else-if="item.status === 'done'"
            x-small
          >
            $check
          </v-icon>
          <span>{{ item.label }}</span>
        </li>
      </ul>
      <v-btn
        v-if="state && state.op && state.op.kind === 'join'"
        small
        text
        :loading="busy"
        @click="cancelJoin"
      >
        Cancel
      </v-btn>
    </template>

    <!-- S4r Result, and the region line (§3.1) -->
    <template v-else-if="screen === 'S4r' && state">
      <template v-if="joinError">
        <p
          class="muon-setup-steps__title"
          data-tid="join-error"
        >
          {{ joinError }}
        </p>
        <div class="muon-setup-steps__actions">
          <app-btn
            color="primary"
            @click="tryAgain"
          >
            Try again
          </app-btn>
          <v-btn
            text
            @click="chooseAnother"
          >
            Choose another network
          </v-btn>
        </div>
      </template>
      <template v-else>
        <p
          class="muon-setup-steps__title"
          data-tid="join-done"
        >
          {{ name }} is on {{ network.ssid || 'the network' }}
        </p>
        <p class="muon-setup-steps__muted">
          {{ network.addresses.join(', ') }}<template v-if="network.hostname_local">
            · {{ network.hostname_local }}
          </template>
        </p>
        <p
          v-if="network.internet === false"
          class="muon-setup-steps__muted"
        >
          No internet. Printing over the network works; updates and remote access are off.
        </p>
        <p
          v-if="network.internet === 'portal'"
          class="muon-setup-steps__error"
        >
          {{ network.ssid }} needs a sign-in page, which a printer can't complete. Printing over this
          network works, but updates and remote access won't.
        </p>
        <template v-if="!network.region_confirmed">
          <p class="muon-setup-steps__region">
            Region: <strong>{{ countryName(regionCountry) }}</strong>
          </p>
          <p
            v-if="network.region_error"
            class="muon-setup-steps__error"
          >
            {{ regionError }}
          </p>
          <p class="muon-setup-steps__muted">
            To choose another region, use {{ name }}'s screen.
          </p>
          <app-btn
            color="primary"
            :loading="busy || !!(state.op && state.op.kind === 'region_apply')"
            :disabled="!regionCountry"
            data-tid="region-confirm"
            @click="confirmRegion"
          >
            Confirm
          </app-btn>
        </template>
        <app-btn
          v-else
          color="primary"
          data-tid="join-continue"
          @click="acknowledge"
        >
          Continue
        </app-btn>
      </template>
    </template>

    <!-- S8, S10: done -->
    <template v-else-if="screen === 'S8' || screen === 'S10'">
      <p class="muon-setup-steps__title">
        {{ name }} is set up
      </p>
      <slot name="done" />
    </template>

    <!-- S5 to S7, S9: the steps this page does not draw yet (FL-3). The panel
         can finish every step on its own. -->
    <template v-else>
      <p class="muon-setup-steps__title">
        <template v-if="network.addresses.length">
          {{ name }} is on {{ network.ssid || 'the network' }}.
        </template>
        Carry on at {{ name }}'s screen: it shows the next step.
      </p>
      <slot name="elsewhere" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { SetupHttpError, type SetupClient } from '@/services/muon-setup/client'
import { pageLanguageFor } from '@/services/muon-setup/language'
import { screenFor, type ScreenId } from '@/services/muon-setup/screen'
import { setLocal, setupState } from '@/services/muon-setup/state'
import type { SetupNetwork, SetupResult, SetupState } from '@/services/muon-setup/types'
import { joinErrorCopy, validPsk, writeErrorCopy } from '@/services/muon-setup/wifiCopy'

const JOIN_PHASES = ['saving', 'associating', 'authenticating', 'dhcp', 'internet_check', 'update_check']

/**
 * The Wi-Fi part of first-run setup (05-phone-setup-page.md §3: S1, S3, S4
 * and S4r), for any page with a `SetupClient`: the hosted page setting a
 * printer up over Bluetooth now, and the `/setup` page when FL-3 mounts it.
 * Which screen shows is `screenFor`'s answer alone; this component keeps no
 * step order. Other network (S3b), enterprise Wi-Fi and the region picker
 * are left to the printer's screen until FL-3.
 */
@Component
export default class SetupWifiSteps extends Vue {
  @Prop({ type: Object, required: true })
  readonly client!: SetupClient

  @Prop({ type: Boolean, default: false })
  readonly overBluetooth!: boolean

  networks: SetupNetwork[] = []
  cable: string | null = null
  scanning = false
  scanError: string | null = null
  selected: string | null = null
  password = ''
  showPassword = false
  passwordError: string | null = null
  busy = false
  writeError: string | null = null
  confirmSkip = false
  languages: string[] = []

  get state (): SetupState | null {
    return setupState.state
  }

  get screen (): ScreenId {
    return screenFor(setupState.state, setupState.local)
  }

  get name (): string {
    return this.state?.printer.name ?? 'The printer'
  }

  get display (): string {
    return this.state?.printer.display ?? this.name
  }

  get network (): SetupState['steps']['network'] {
    return this.state?.steps.network ?? {
      status: 'pending',
      kind: null,
      ssid: null,
      addresses: [],
      hostname_local: null,
      internet: null,
      error: null,
      region_confirmed: false,
      region_error: null
    }
  }

  get joiningSsid (): string {
    return this.state?.op?.target ?? this.selected ?? this.network.ssid ?? 'the network'
  }

  get checklist () {
    const op = this.state?.op
    const at = JOIN_PHASES.indexOf(String(op?.phase ?? 'saving'))
    const step = (label: string, phase: string) => {
      const i = JOIN_PHASES.indexOf(phase)
      return { label, status: at > i ? 'done' : at === i ? 'now' : 'next' }
    }
    const items = [
      step('Password accepted', 'authenticating'),
      step('Got an address', 'dhcp'),
      step('Checking internet', 'internet_check'),
      step('Checking for updates', 'update_check')
    ]
    if (op?.kind === 'region_apply') items.unshift({ label: 'Setting the region', status: 'now' })
    return items
  }

  get joinError (): string | null {
    const error = this.network.error
    if (!error || error.code === 'portal_required') return null
    const ssid = String(error.detail?.ssid ?? this.network.ssid ?? 'the network')
    return joinErrorCopy(error, this.name, ssid)
  }

  get regionCountry (): string | null {
    return this.state?.region.detected_country ?? null
  }

  get regionError (): string {
    const code = this.network.region_error?.code
    if (code === 'region_busy') return 'The Wi-Fi radio is busy. Try again in a moment.'
    if (code === 'needs_reregistration') return 'This printer needs re-registering. Contact support.'
    return 'We could not apply that region.'
  }

  @Watch('screen', { immediate: true })
  onScreen (screen: ScreenId, before?: ScreenId) {
    if (screen === 'S3' && before !== 'S3') this.scan(true)
  }

  created () {
    this.client.options()
      .then(o => { this.languages = (o.languages ?? []).map(l => l.code) })
      .catch(() => {})
  }

  countryName (code: string | null): string {
    if (!code) return 'not detected'
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
    } catch {
      return code
    }
  }

  unusable (n: SetupNetwork): string | null {
    if (!n.supported || n.security === 'wep') return 'Not supported'
    if (n.security === 'enterprise') return `Enterprise: set it up on ${this.name}'s screen`
    if (!n.channel_permitted) return `Its channel isn't allowed in ${this.name}'s region: use its screen`
    return null
  }

  networkMeta (n: SetupNetwork): string {
    const parts = [`${n.signal}%`, n.band ? `${n.band} GHz` : '']
    if (this.needsPassword(n)) parts.unshift('Secured')
    if (n.saved) parts.push('Saved')
    return parts.filter(Boolean).join(' · ')
  }

  needsPassword (n: SetupNetwork): boolean {
    return !['open', 'owe'].includes(n.security)
  }

  async scan (rescan: boolean) {
    this.scanning = true
    this.scanError = null
    try {
      const result = await this.client.networks(rescan)
      this.networks = result.networks ?? []
      this.cable = result.ethernet?.carrier ? result.ethernet.address : null
      if (!result.ok && result.error) this.scanError = `${this.name} couldn't scan for networks. Scan again.`
    } catch {
      this.scanError = `${this.name} didn't answer the scan. Scan again.`
    } finally {
      this.scanning = false
    }
  }

  choose (n: SetupNetwork) {
    if (this.selected !== n.ssid) {
      this.selected = n.ssid
      this.password = ''
      this.passwordError = null
    }
    this.writeError = null
  }

  /** Posts a write, and says why it was refused. Resolves to whether it went through. */
  async write (path: string, body: Record<string, unknown> = {}, opts?: { rev?: boolean }): Promise<boolean> {
    this.busy = true
    this.writeError = null
    try {
      const result: SetupResult | null = await this.client.post(path, body, opts)
      // No answer: the next state says what happened.
      if (!result) return true
      if (result.ok) return true
      this.writeError = writeErrorCopy(result.error, this.name)
      return false
    } catch (error) {
      this.writeError = error instanceof SetupHttpError
        ? `${this.name} refused that: ${error.message}`
        : String((error as Error)?.message ?? error)
      return false
    } finally {
      this.busy = false
    }
  }

  async start () {
    this.busy = true
    try {
      // The clock and time zone first: only this page knows the owner's (02 §5.4).
      await this.client.postClock()
      if (this.state?.steps.language.status === 'pending') {
        const code = pageLanguageFor(this.state, this.languages, navigator.languages ?? [navigator.language], null)
        await this.client.post('language', { code }).catch(() => null)
      }
      const claimed = await this.client.claimDriver()
      if (claimed && !claimed.ok) this.writeError = writeErrorCopy(claimed.error, this.name)
      else setLocal({ droveSetup: true })
    } catch (error) {
      this.writeError = String((error as Error)?.message ?? error)
    } finally {
      this.busy = false
    }
  }

  async join (n: SetupNetwork) {
    const psk = this.password
    if (this.needsPassword(n) && !validPsk(psk)) {
      this.passwordError = 'A Wi-Fi password is 8 to 63 characters, or 64 hexadecimal digits.'
      return
    }
    this.passwordError = null
    const rev = this.state?.rev ?? null
    const sent = await this.write('network', {
      kind: 'wifi',
      ssid: n.ssid,
      hidden: false,
      security: n.security,
      ...(this.needsPassword(n) ? { psk } : {}),
      region: null,
      eap: null
    })
    if (sent) setLocal({ joinRev: rev })
    // Never kept: the printer's NetworkManager is the only place it lives.
    this.password = ''
  }

  async useCable () {
    const rev = this.state?.rev ?? null
    if (await this.write('network', { kind: 'ethernet' })) setLocal({ joinRev: rev })
  }

  cancelJoin () {
    return this.write('network/cancel', {}, { rev: false })
  }

  async skipNetwork () {
    if (await this.write('skip', { step: 'network' })) this.confirmSkip = false
  }

  confirmRegion () {
    if (this.regionCountry) return this.write('region', { country: this.regionCountry })
  }

  /** Back to the list, with the same network open and its password field empty. */
  tryAgain () {
    const ssid = this.network.error?.detail?.ssid
    setLocal({ joinRev: null })
    if (typeof ssid === 'string') this.selected = ssid
    this.showPassword = true
  }

  chooseAnother () {
    setLocal({ joinRev: null })
    this.selected = null
  }

  acknowledge () {
    setLocal({ joinRev: null })
  }
}

</script>

<style lang="scss" scoped>
.muon-setup-steps {
  &__title {
    font-size: var(--m3d-text-lg);
    font-weight: var(--m3d-weight-semibold);
    color: var(--m3d-text);
    margin: 0 0 8px;
  }

  &__lede,
  &__muted {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
    margin: 0 0 12px;
  }

  &__error {
    font-size: var(--m3d-text-sm);
    color: var(--m3d-danger, #e5484d);
    margin: 8px 0;
  }

  &__plan {
    margin: 0 0 16px;
    padding-left: 20px;
    color: var(--m3d-text);
    font-size: var(--m3d-text-sm);

    li {
      margin-bottom: 4px;
    }
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__network {
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-md);
    background: var(--m3d-surface-2);
    margin-bottom: 8px;

    &.is-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
    }

    &.is-open {
      border-color: var(--m3d-accent-line);
    }

    &.is-disabled {
      opacity: 0.6;
    }
  }

  &__network-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: 0;
    color: inherit;
    text-align: left;
    cursor: pointer;

    &:disabled {
      cursor: default;
    }
  }

  &__network-name {
    font-weight: var(--m3d-weight-medium);
    color: var(--m3d-text);
  }

  &__network-meta {
    font-family: var(--m3d-font-mono);
    font-size: var(--m3d-text-xs);
    color: var(--m3d-text-muted);
  }

  &__join {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 0 12px 12px;
  }

  &__confirm {
    margin-top: 8px;
    font-size: var(--m3d-text-sm);
    color: var(--m3d-text-muted);
  }

  &__skip {
    margin-top: 4px;
  }

  &__checklist {
    list-style: none;
    padding: 0;
    margin: 0 0 12px;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: var(--m3d-text-sm);
      color: var(--m3d-text-muted);

      &.is-done,
      &.is-now {
        color: var(--m3d-text);
      }
    }
  }

  &__region {
    font-size: var(--m3d-text-sm);
    margin: 12px 0 4px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
