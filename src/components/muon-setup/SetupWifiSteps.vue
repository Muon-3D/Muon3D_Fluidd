<template>
  <div class="muon-setup-steps">
    <!-- S1 Start (05 §3) -->
    <setup-step-card
      v-if="screen === 'S1'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="`Set up ${display}`"
      sub="About three minutes. Keep this page open until it says you're done."
    >
      <p
        v-if="overBluetooth"
        class="muon-setup-steps__lede"
      >
        This computer stays on its own network and talks to {{ name }} over
        Bluetooth until {{ name }} is on Wi-Fi too.
      </p>
      <ol class="muon-setup-steps__plan">
        <li>Wi-Fi</li>
        <li>Name and updates</li>
        <li>Your account, if you want remote access</li>
        <li>Last steps at the printer</li>
      </ol>
      <p
        v-if="writeError"
        class="muon-setup-steps__error"
      >
        {{ writeError }}
      </p>
      <template #footer>
        <app-btn
          color="primary"
          :loading="busy"
          data-tid="setup-start"
          @click="start"
        >
          Start
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S3 Wi-Fi: the chosen network opens its password field in place -->
    <setup-step-card
      v-else-if="screen === 'S3'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      title="Choose Wi-Fi"
      :sub="`${name} uses it to take prints and fetch updates.`"
    >
      <div class="muon-setup-steps__head">
        <span class="muon-setup-steps__muted">
          {{ scanning ? 'Looking for networks…' : `${networks.length} networks nearby` }}
        </span>
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
          data-tid="wifi-cable"
          @click="useCable"
        >
          Use this connection
        </v-btn>
      </div>

      <p
        v-if="scanError"
        class="muon-setup-steps__error"
        data-tid="wifi-scan-error"
      >
        {{ scanError }}
      </p>
      <p
        v-else-if="!scanning && !networks.length"
        class="muon-setup-steps__muted"
        data-tid="wifi-none"
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
          :aria-pressed="selected === n.ssid ? 'true' : 'false'"
          :data-tid="`wifi-${n.ssid}`"
          @click="choose(n)"
        >
          <span class="muon-setup-steps__network-name">{{ n.ssid }}</span>
          <span class="muon-setup-steps__network-meta">
            {{ unusable(n) || networkMeta(n) }}
          </span>
        </button>
        <form
          v-if="selected === n.ssid && needsPassword(n)"
          class="muon-setup-steps__join"
          @submit.prevent="join(n)"
        >
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :label="`Password for ${n.ssid}`"
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
        </form>
      </div>

      <p
        v-if="writeError"
        class="muon-setup-steps__error"
        data-tid="write-error"
      >
        {{ writeError }}
      </p>

      <div
        v-if="confirmSkip"
        class="muon-setup-steps__confirm"
        data-tid="wifi-skip-confirm"
      >
        <p>{{ name }} will stay offline. You can connect it later from its screen.</p>
        <v-btn
          small
          text
          @click="confirmSkip = false"
        >
          Keep Wi-Fi
        </v-btn>
        <v-btn
          small
          text
          color="primary"
          :loading="busy"
          data-tid="wifi-skip-yes"
          @click="skipNetwork"
        >
          Skip Wi-Fi
        </v-btn>
      </div>

      <template #footer>
        <v-btn
          v-if="!confirmSkip"
          text
          data-tid="wifi-skip"
          @click="confirmSkip = true"
        >
          Skip for now
        </v-btn>
        <app-btn
          color="primary"
          :loading="busy"
          :disabled="!selectedNetwork || (needsPassword(selectedNetwork) && !password)"
          data-tid="wifi-connect"
          @click="selectedNetwork && join(selectedNetwork)"
        >
          Connect and continue
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S4 Joining -->
    <setup-step-card
      v-else-if="screen === 'S4'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="`Joining ${joiningSsid}`"
      sub="This takes up to a minute."
    >
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
      <template
        v-if="state && state.op && state.op.kind === 'join'"
        #footer
      >
        <v-btn
          text
          :loading="busy"
          data-tid="join-cancel"
          @click="cancelJoin"
        >
          Cancel
        </v-btn>
      </template>
    </setup-step-card>

    <!-- S4r Result: the join failed -->
    <setup-step-card
      v-else-if="screen === 'S4r' && state && joinError"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      title="Wi-Fi didn't connect"
    >
      <p
        class="muon-setup-steps__error"
        data-tid="join-error"
      >
        {{ joinError }}
      </p>
      <template #footer>
        <v-btn
          text
          data-tid="join-another"
          @click="chooseAnother"
        >
          Choose another network
        </v-btn>
        <app-btn
          color="primary"
          data-tid="join-retry"
          @click="tryAgain"
        >
          Try again
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S4r Result: joined, and the region line (§3.1) -->
    <setup-step-card
      v-else-if="screen === 'S4r' && state"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      title="Wi-Fi connected"
    >
      <p
        class="muon-setup-steps__done"
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
      </template>
      <template #footer>
        <app-btn
          v-if="!network.region_confirmed"
          color="primary"
          :loading="busy || !!(state.op && state.op.kind === 'region_apply')"
          :disabled="!regionCountry"
          data-tid="region-confirm"
          @click="confirmRegion"
        >
          Confirm
        </app-btn>
        <app-btn
          v-else
          color="primary"
          data-tid="join-continue"
          @click="acknowledge"
        >
          Continue
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S5 Name -->
    <setup-step-card
      v-else-if="screen === 'S5' && cursor === 'name'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      title="Name your printer"
      sub="It shows up with this name in Control and on your network."
    >
      <form @submit.prevent="saveName">
        <v-text-field
          v-model="nameDraft"
          label="Printer name"
          autocomplete="off"
          outlined
          dense
          hide-details="auto"
          :placeholder="state ? state.steps.name.derived : ''"
          data-tid="name-field"
        />
      </form>
      <p
        v-if="writeError"
        class="muon-setup-steps__error"
        data-tid="write-error"
      >
        {{ writeError }}
      </p>
      <template #footer>
        <v-btn
          v-if="previous"
          text
          class="setup-step__back"
          :disabled="busy"
          data-tid="setup-back"
          @click="goBack"
        >
          Back
        </v-btn>
        <app-btn
          color="primary"
          :loading="busy"
          :disabled="!nameDraft.trim()"
          data-tid="name-save"
          @click="saveName"
        >
          Continue
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S5 Updates -->
    <setup-step-card
      v-else-if="screen === 'S5' && cursor === 'update' && state"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="update.available ? 'Update available' : `${name} is up to date`"
      :sub="update.available
        ? `${name} runs ${update.current}. ${update.available} is ready to install; it takes a few minutes.`
        : `${name} runs ${update.current}.`"
    >
      <p
        v-if="update.error"
        class="muon-setup-steps__error"
        data-tid="update-error"
      >
        {{ name }} couldn't install the update. You can try again, or update later from Settings.
      </p>
      <p
        v-if="writeError"
        class="muon-setup-steps__error"
        data-tid="write-error"
      >
        {{ writeError }}
      </p>
      <template #footer>
        <v-btn
          v-if="previous"
          text
          class="setup-step__back"
          :disabled="busy"
          data-tid="setup-back"
          @click="goBack"
        >
          Back
        </v-btn>
        <v-btn
          v-if="update.available"
          text
          :disabled="busy"
          data-tid="update-later"
          @click="updateLater"
        >
          Later
        </v-btn>
        <app-btn
          color="primary"
          :loading="busy"
          data-tid="update-go"
          @click="update.available ? installUpdate() : updateLater()"
        >
          {{ update.available ? 'Install update' : 'Continue' }}
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S5 Your account (remote access) -->
    <setup-step-card
      v-else-if="screen === 'S5' && state"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      title="Your account"
      :sub="`Link ${name} to your Muon3D account to watch and print from anywhere.`"
    >
      <div
        class="muon-setup-steps__choices"
        role="radiogroup"
        aria-label="Remote access"
      >
        <button
          v-for="option in remoteOptions"
          :key="option.mode"
          type="button"
          role="radio"
          class="muon-setup-steps__network muon-setup-steps__network-row"
          :class="{ 'is-open': remoteChoice === option.mode, 'is-disabled': !!option.disabled }"
          :aria-checked="remoteChoice === option.mode ? 'true' : 'false'"
          :disabled="!!option.disabled || busy"
          :data-tid="`remote-${option.mode}`"
          @click="remoteChoice = option.mode"
        >
          <span class="muon-setup-steps__network-name">{{ option.title }}</span>
          <span class="muon-setup-steps__network-meta">{{ option.disabled || option.detail }}</span>
        </button>
      </div>
      <p
        v-if="remote.error"
        class="muon-setup-steps__error"
        data-tid="remote-error"
      >
        {{ remoteError }}
      </p>
      <p
        v-if="writeError"
        class="muon-setup-steps__error"
        data-tid="write-error"
      >
        {{ writeError }}
      </p>
      <template #footer>
        <v-btn
          v-if="previous"
          text
          class="setup-step__back"
          :disabled="busy"
          data-tid="setup-back"
          @click="goBack"
        >
          Back
        </v-btn>
        <v-btn
          text
          :disabled="busy"
          data-tid="remote-skip"
          @click="chooseRemote('later')"
        >
          Skip for now
        </v-btn>
        <app-btn
          color="primary"
          :loading="busy"
          :disabled="!remoteChoice"
          data-tid="remote-continue"
          @click="remoteChoice && chooseRemote(remoteChoice)"
        >
          Continue
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S5u Installing the update -->
    <setup-step-card
      v-else-if="screen === 'S5u'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="`Updating ${name}`"
      sub="Keep it switched on. It restarts when it's done, and this page carries on."
    >
      <v-progress-linear
        :indeterminate="updateProgress === null"
        :value="updateProgress === null ? 0 : updateProgress"
        rounded
        data-tid="update-progress"
      />
    </setup-step-card>

    <!-- S6 Linking with a code -->
    <setup-step-card
      v-else-if="screen === 'S6'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="`Link ${name} to your account`"
      :sub="linkSub"
    >
      <template v-if="link && link.phase === 'code'">
        <p
          class="muon-setup-steps__code"
          data-tid="link-code"
          :aria-label="`Code ${link.code.split('').join(' ')}`"
        >
          {{ link.code }}
        </p>
        <a
          class="muon-setup-steps__link"
          :href="link.url"
          target="_blank"
          rel="noopener"
          data-tid="link-open"
        >Open the link page</a>
      </template>
      <p
        v-else-if="link && link.phase === 'failed'"
        class="muon-setup-steps__error"
        data-tid="link-failed"
      >
        Linking didn't finish. Try again, or skip and link {{ name }} later from Control.
      </p>
      <v-progress-circular
        v-else
        indeterminate
        size="20"
        width="2"
      />
      <p
        v-if="writeError"
        class="muon-setup-steps__error"
        data-tid="write-error"
      >
        {{ writeError }}
      </p>
      <template #footer>
        <v-btn
          text
          class="setup-step__back"
          :disabled="busy"
          data-tid="link-cancel"
          @click="cancelLink"
        >
          Back
        </v-btn>
        <v-btn
          text
          :disabled="busy"
          data-tid="remote-skip"
          @click="chooseRemote('later')"
        >
          Skip for now
        </v-btn>
        <app-btn
          v-if="link && link.phase === 'failed'"
          color="primary"
          :loading="busy"
          data-tid="link-retry"
          @click="chooseRemote('cloud')"
        >
          Try again
        </app-btn>
      </template>
    </setup-step-card>

    <!-- S7 First calibration: each item happens at the printer -->
    <setup-step-card
      v-else-if="screen === 'S7'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      title="First calibration"
      :sub="`These happen at ${name}. Follow its screen; this page moves on by itself.`"
    >
      <ul class="muon-setup-steps__checklist muon-setup-steps__ready">
        <li
          v-for="item in readyItems"
          :key="item.id"
          :class="`is-${item.status}`"
          :data-tid="`ready-${item.id}`"
        >
          <v-progress-circular
            v-if="item.running"
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
          <span class="muon-setup-steps__ready-title">{{ item.title }}</span>
          <span class="muon-setup-steps__network-meta">{{ item.note }}</span>
          <v-btn
            v-if="item.skippable"
            x-small
            text
            :disabled="busy"
            :data-tid="`ready-skip-${item.id}`"
            @click="skipReadyItem(item.id)"
          >
            Skip
          </v-btn>
        </li>
      </ul>
      <p
        v-if="writeError"
        class="muon-setup-steps__error"
        data-tid="write-error"
      >
        {{ writeError }}
      </p>
      <template
        v-if="previous"
        #footer
      >
        <v-btn
          text
          class="setup-step__back"
          :disabled="busy"
          data-tid="setup-back"
          @click="goBack"
        >
          Back
        </v-btn>
      </template>
    </setup-step-card>

    <!-- S8, S10: done -->
    <setup-step-card
      v-else-if="screen === 'S8' || screen === 'S10'"
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="`${name} is set up`"
      sub="It's ready for its first print."
    >
      <slot name="done" />
    </setup-step-card>

    <!-- S9: the printer's screen is in charge. The panel can finish every step on its own. -->
    <setup-step-card
      v-else
      :eyebrow="eyebrow"
      :flat="overBluetooth"
      :title="`Carry on at ${name}'s screen`"
      :sub="network.addresses.length ? `${name} is on ${network.ssid || 'the network'}.` : ''"
    >
      <p class="muon-setup-steps__muted">
        Someone is setting {{ name }} up at the printer. This page follows along.
      </p>
      <slot name="elsewhere" />
    </setup-step-card>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { SetupHttpError, type SetupClient } from '@/services/muon-setup/client'
import { pageLanguageFor } from '@/services/muon-setup/language'
import { screenFor, type ScreenId } from '@/services/muon-setup/screen'
import { frameSteps, previousStep } from '@/services/muon-setup/steps'
import { setLocal, setupState } from '@/services/muon-setup/state'
import type { LinkState, SetupNetwork, SetupResult, SetupState, StepId } from '@/services/muon-setup/types'
import { joinErrorCopy, validPsk, writeErrorCopy } from '@/services/muon-setup/wifiCopy'
import SetupStepCard from './SetupStepCard.vue'

type RemoteMode = 'local' | 'cloud' | 'later'

const READY_TITLES: Record<string, string> = {
  transport_clips: 'Take out the transport clips',
  self_test: 'Run the self-test',
  load_filament: 'Load filament'
}

const JOIN_PHASES = ['saving', 'associating', 'authenticating', 'dhcp', 'internet_check', 'update_check']

/**
 * First-run setup's steps (05-phone-setup-page.md §3), each in the shared
 * step card, for any page with a `SetupClient`: `/setup` on the printer's
 * hotspot, and Control setting a printer up over Bluetooth. Which screen
 * shows is `screenFor`'s answer alone; this component keeps no step order.
 * Steps that need someone at the printer (the first calibration, other
 * network, enterprise Wi-Fi and the region picker) stay on its screen.
 */
@Component({ components: { SetupStepCard } })
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
  nameDraft = ''
  readyManifest: Array<Record<string, unknown>> = []
  remoteChoice: RemoteMode | null = null

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

  get cursor () {
    return this.state?.cursor ?? null
  }

  get eyebrow (): string {
    const steps = frameSteps(this.state, this.screen)
    const at = steps.findIndex(step => step.status === 'on')
    return at < 0 ? '' : `Step ${at + 1} of ${steps.length}`
  }

  /** Where Back goes: the printer's `goto` only takes an earlier done or skipped step. */
  get previous (): StepId | null {
    return previousStep(this.state)
  }

  get selectedNetwork (): SetupNetwork | null {
    return this.networks.find(n => n.ssid === this.selected) ?? null
  }

  get update (): SetupState['steps']['update'] {
    return this.state?.steps.update ?? { status: 'pending', current: '', available: null, error: null }
  }

  get updateProgress (): number | null {
    const progress = this.state?.op?.kind === 'update_install' ? this.state.op.progress : null
    return typeof progress === 'number' ? progress : null
  }

  get remote (): SetupState['steps']['remote'] {
    return this.state?.steps.remote ?? { status: 'pending', mode: null, link: null, error: null }
  }

  get link (): LinkState | null {
    return this.remote.link
  }

  /** Linking needs the internet and a synced clock (02 §5.9); say so rather than offer it. */
  get cloudBlocked (): string | null {
    if (!this.state) return null
    if (this.state.capabilities.cloud_link === false) return `${this.name} can't link to an account`
    if (this.network.internet !== true) return `Needs ${this.name} on the internet`
    if (this.state.clock.synced !== true) return `Waiting for ${this.name}'s clock to set`
    return null
  }

  get remoteOptions () {
    return [
      {
        mode: 'cloud' as const,
        title: 'Link to my Muon3D account',
        detail: 'See it and print from anywhere',
        disabled: this.cloudBlocked
      },
      {
        mode: 'local' as const,
        title: 'Only on this network',
        detail: 'Nothing leaves your network',
        disabled: null
      }
    ]
  }

  get remoteError (): string {
    const code = this.remote.error?.code
    if (code === 'no_internet') return `${this.name} needs the internet to link.`
    if (code === 'clock_unsynced') return `${this.name}'s clock isn't set yet. Try again in a moment.`
    return `${this.name} couldn't start linking. Try again, or skip for now.`
  }

  get linkSub (): string {
    const link = this.link
    if (link?.phase === 'code') return 'Enter this code on the link page, signed in to your Muon3D account.'
    if (link?.phase === 'offer') return `Confirm ${link.account} on ${this.name}'s screen.`
    if (link?.phase === 'linked') return `Linked to ${link.account}.`
    if (link?.phase === 'failed') return ''
    return 'Getting a code…'
  }

  get readyItems () {
    const manifest = this.readyManifest as Array<{ id?: string, required?: boolean }>
    // Until the manifest has loaded, nothing counts as optional.
    const required = new Set(manifest.length ? manifest.filter(i => i.required).map(i => i.id) : this.state?.steps.ready.items.map(i => i.id))
    const running = this.state?.op?.kind === 'ready_item' ? this.state.op.item : null
    return (this.state?.steps.ready.items ?? [])
      .filter(item => item.status !== 'hidden')
      .map(item => ({
        id: item.id,
        status: item.status,
        title: READY_TITLES[item.id] ?? item.id.replace(/_/g, ' '),
        running: running === item.id,
        note: running === item.id
          ? 'Running now'
          : item.status === 'done' ? 'Done' : item.status === 'skipped' ? 'Skipped' : item.status === 'failed' ? 'Failed: try again at the printer' : required.has(item.id) ? 'Needed' : 'Optional',
        // Required items always happen; the phone can only skip the optional ones.
        skippable: !required.has(item.id) && item.status === 'pending' && running !== item.id
      }))
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

  @Watch('cursor', { immediate: true })
  onCursor (cursor: string | null) {
    if (cursor === 'name') this.nameDraft = this.state?.steps.name.value || this.state?.steps.name.derived || ''
    if (cursor === 'remote') this.remoteChoice = this.cloudBlocked ? 'local' : 'cloud'
    this.writeError = null
  }

  @Watch('screen', { immediate: true })
  onScreen (screen: ScreenId, before?: ScreenId) {
    if (screen === 'S3' && before !== 'S3') this.scan(true)
  }

  created () {
    this.client.options()
      .then(o => {
        this.languages = (o.languages ?? []).map(l => l.code)
        this.readyManifest = o.ready_manifest?.items ?? []
      })
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

  goBack () {
    if (this.previous) return this.write('goto', { step: this.previous })
  }

  saveName () {
    const name = this.nameDraft.trim()
    if (name) return this.write('name', { name })
  }

  installUpdate () {
    return this.write('update', { action: 'install' })
  }

  updateLater () {
    return this.write('update', { action: 'later' })
  }

  chooseRemote (mode: RemoteMode) {
    return this.write('remote', { mode })
  }

  /** Back from the code: stop linking, and go back to the choice. */
  cancelLink () {
    return this.write('remote/cancel', {}, { rev: false })
  }

  skipReadyItem (item: string) {
    return this.write('ready', { action: 'skip', item })
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
