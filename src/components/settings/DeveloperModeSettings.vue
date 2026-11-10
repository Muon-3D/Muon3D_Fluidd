<template>
  <section
    id="developer"
    class="devm"
    data-tid="developer-mode"
  >
    <div
      class="devm__card"
      :class="{ 'devm__card--on': state.enabled === true }"
      data-tid="developer-mode-card"
    >
      <header class="devm__head">
        <div class="devm__titles">
          <span
            class="devm__eyebrow"
            data-tid="developer-mode-eyebrow"
          >{{ eyebrow }}</span>
          <h2>Developer mode</h2>
          <p data-tid="developer-mode-state">
            {{ stateLine }}
          </p>
        </div>
        <toggle-switch
          v-if="mayAsk && state.enabled"
          :value="!!state.enabled"
          label="Developer mode"
          :disabled="state.enabled === null || busy"
          data-tid="developer-mode-switch"
          @input="toggle"
        />
      </header>
      <p
        class="devm__text"
        data-tid="developer-mode-who-line"
      >
        {{ whoLine }}
      </p>
      <p
        class="devm__warranty"
        data-tid="developer-mode-warranty"
      >
        <frame-icon
          name="alert"
          small
        />
        <span>The first time it's turned on, the warranty ends, even if you turn it off again. After that it's an ordinary switch.</span>
      </p>
      <p class="devm__text">
        Lets you change this printer's own configuration and macros. The Muon3D defaults stay as they are beside your copy, and turning it off goes back to them (your copy is kept for next time).
      </p>

      <div
        v-if="state.enabled === false"
        class="devm__goto"
        data-tid="developer-mode-go-to-printer"
      >
        <frame-icon
          name="gear"
          small
        />
        <div>
          <b>Go to the printer's screen to turn on developer mode</b>
          <span v-if="state.everEnabled">You have accepted the terms on this printer before. Turning it on again is still done at the printer: System, then Protection, then Developer mode. The printer decides whether it takes it.</span>
          <span v-else>On the printer: System, then Protection, then Developer mode. It is read and confirmed there, because turning it on ends the warranty.</span>
        </div>
      </div>

      <p
        v-if="notAsking && state.enabled"
        class="devm__note"
        data-tid="developer-mode-who"
      >
        {{ notAsking }}
      </p>

      <div
        class="devm__fuse"
        :class="`devm__fuse--${fuseTone}`"
        data-tid="developer-mode-fuse"
      >
        <frame-icon
          :name="fuseTone === 'warn' ? 'alert' : 'check'"
          small
        />
        <span>{{ fuseText }}</span>
      </div>
    </div>

    <h3 class="devm__h">
      What it unlocks · {{ unlocks.length }}
    </h3>
    <nav
      class="devm__list"
      aria-label="What developer mode unlocks"
      data-tid="developer-mode-unlocks"
    >
      <router-link
        v-for="u in unlocks"
        :key="u.id"
        :to="unlockTo(u.to)"
        class="devm__item"
        :data-tid="`developer-unlock-${u.id}`"
      >
        <span class="devm__item-text">
          <b>{{ u.title }}</b>
          <small>{{ u.where }}</small>
        </span>
        <frame-icon
          name="chevronRight"
          small
        />
      </router-link>
    </nav>

    <h3 class="devm__h">
      While it's on
    </h3>
    <div
      class="devm__actions"
      :class="{ 'devm__actions--off': !state.enabled }"
      data-tid="developer-mode-while-on"
    >
      <button
        type="button"
        class="cbtn cbtn--ghost"
        :disabled="busy || !state.enabled"
        data-tid="developer-backup"
        @click="backupConfig"
      >
        Back up the configuration
      </button>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        :disabled="busy || !state.enabled"
        data-tid="developer-reset"
        @click="restoreDefaults"
      >
        Start again from the Muon3D defaults
      </button>
      <small v-if="!state.enabled">Available once it is on.</small>
    </div>
    <p
      class="devm__text"
      data-tid="developer-mode-non-muon"
    >
      Not a Muon printer? There is no developer mode: everything here is simply on.
    </p>

    <v-dialog
      v-model="disableDialog"
      max-width="480"
      :persistent="awaiting"
    >
      <div
        class="devm__dialog"
        data-tid="developer-disable-dialog"
      >
        <h3>Turn off developer mode</h3>
        <p>{{ $t('app.general.dev_mode.disable-modal-1') }}</p>
        <p>{{ $t('app.general.dev_mode.disable-modal-2') }}</p>
        <div
          v-if="awaiting"
          class="devm__press"
          data-tid="developer-press-knob"
        >
          <span class="devm__pulse" />
          <div>
            <b>Confirm on the printer's screen</b>
            <span v-if="consentInstruction">{{ consentInstruction }}</span>
            <span>{{ $t('app.general.dev_mode.consent-expires', { seconds: secondsRemaining }) }}</span>
          </div>
        </div>
        <p
          v-if="errorMessage"
          class="devm__error"
        >
          {{ errorMessage }}
        </p>
        <div class="devm__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="loading"
            @click="closeDialogs"
          >
            {{ $t('app.general.btn.cancel') }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="loading || awaiting"
            data-tid="developer-disable"
            @click="confirmDisable"
          >
            Turn off
          </button>
        </div>
      </div>
    </v-dialog>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import consola from 'consola'
import { useAuxApi } from '@/aux_api/useAuxApi'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import {
  askToChange,
  completeChange,
  readAnswer,
  whoMayAsk,
  whyNot,
  DevModeRefused,
  type DevModeAsking
} from '@/services/dev-mode/request'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'
import { UNLOCKS, type Unlock } from '@/services/dev-mode/guidance'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

/** How often the browser asks whether the printer's screen has been answered. */
const CONSENT_POLL_MS = 1500

/**
 * Settings › Developer mode: whether it's on, a way out, and whether turning
 * it on marks the printer for good (the OTP fuse, which the development
 * fleet ships disarmed). With it on: edit macros, open the config, back it
 * up, or start again from the defaults.
 *
 * Turning it ON is not done from here (KAN-1739, KAN-1763): the printer
 * takes it only at its own screen, where the warranty release is read and
 * confirmed, so this page says to go there. Turning it OFF is still asked
 * for here and confirmed on the printer's screen (KAN-547), through
 * Moonraker's request route (services/dev-mode/request). On a linked printer
 * the switch is the owner's alone, so nobody else is shown it.
 */
@Component({ components: { ToggleSwitch } })
export default class DeveloperModeSettings extends Vue {
  api = useAuxApi().devMode
  state = devModeState

  /** Who may ask, as the printer said; null until it has. */
  asking: DevModeAsking | null = null
  askingError = ''
  disableDialog = false
  loading = false
  /** The change waiting on the printer's screen. */
  pending: { challengeId: string, enabled: boolean } | null = null
  consentInstruction = ''
  secondsRemaining = 0
  awaiting = false
  errorMessage = ''
  pollTimer: number | null = null
  countdownTimer: number | null = null
  /** Asks in a row the printer didn't answer. */
  pollFailures = 0

  mounted () {
    refreshDevMode()
    this.refreshAsking()
  }

  beforeDestroy () {
    this.stopWaiting()
  }

  get busy (): boolean {
    return this.loading || this.awaiting
  }

  get mayAsk (): boolean {
    return this.asking?.mayAsk === true
  }

  /** Why there is no switch, when there isn't one. */
  get notAsking (): string {
    if (this.state.enabled === null) return ''
    if (this.askingError) return this.askingError
    return whyNot(this.asking) ?? ''
  }

  get printerName (): string {
    return printerNameParts((this.$store?.getters['config/getDisplayName'] as string | undefined) ?? '').name || 'This printer'
  }

  get eyebrow (): string {
    if (this.state.enabled === null) return ''
    return this.state.enabled ? 'On' : 'Off'
  }

  get stateLine (): string {
    if (this.state.enabled === null) return 'Asking the printer…'
    if (this.state.enabled) return 'On: the printer runs your copy of its configuration'
    return 'Off: the printer runs the Muon3D configuration'
  }

  /** Who can change it, in one line; the printer's own refusal text is shown separately. */
  get whoLine (): string {
    if (this.state.enabled === null) return ''
    if (this.asking === null) return "Only the printer's owner can change developer mode. The first time it is turned on, the printer's own screen confirms it."
    const account = this.asking.owner.account
    const who = this.asking.owner.linked ? (account ? `Only ${account} (the owner)` : 'Only the owner') : 'Anyone, while nobody owns this printer,'
    return `${who} can change it. The first time it's turned on, ${this.printerName}'s own screen confirms it.`
  }

  get unlocks (): Unlock[] {
    return UNLOCKS
  }

  unlockTo (path: string): string {
    const [base, hash] = path.split('#')
    return `${scopedPath(base, activeSlug())}${hash ? `#${hash}` : ''}`
  }

  get fuseTone (): 'ok' | 'warn' | 'unknown' {
    if (this.state.otpArmed === false) return 'ok'
    if (this.state.otpArmed === true) return 'warn'
    return 'unknown'
  }

  get fuseText (): string {
    if (this.state.otpArmed === false) {
      return 'Not recorded on this printer: its fuse is disarmed, so you can turn developer mode on and off freely to try it.'
    }
    if (this.state.otpArmed === true) {
      return 'Turning it on is recorded on this printer for good, in a fuse that no update or reset clears. It can affect the warranty.'
    }
    return 'This printer doesn\'t say whether turning it on is recorded for good.'
  }

  /** The printer's own words for a failure, in preference to ours. */
  describe (err: unknown): string {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof (detail as { message?: unknown }).message === 'string') return (detail as { message: string }).message
    const message = (err as { message?: unknown })?.message
    return typeof message === 'string' ? message : String(err)
  }

  /** An older MuonOS has developer mode, but not the owner-confirmation route. */
  missingOwnerConfirmation (err: unknown): boolean {
    const status = (err as { status?: unknown, response?: { status?: unknown } })?.status ??
      (err as { response?: { status?: unknown } })?.response?.status
    return status === 404 || status === 501
  }

  /** Asks the printer who may ask, and for the waiver turning on agrees to. Asks nothing of its screen. */
  async refreshAsking () {
    try {
      this.asking = await whoMayAsk()
      this.askingError = ''
    } catch (err) {
      consola.debug('Cannot ask this printer for a developer-mode change:', err)
      this.asking = null
      this.askingError = this.describe(err)
    }
  }

  toggle () {
    if (!this.mayAsk || this.busy || !this.state.enabled) return
    this.errorMessage = ''
    this.disableDialog = true
  }

  closeDialogs () {
    this.stopWaiting()
    this.disableDialog = false
    this.errorMessage = ''
  }

  stopWaiting () {
    if (this.pollTimer !== null) window.clearInterval(this.pollTimer)
    if (this.countdownTimer !== null) window.clearInterval(this.countdownTimer)
    this.pollTimer = null
    this.countdownTimer = null
    this.awaiting = false
    this.pending = null
  }

  confirmDisable () {
    return this.ask(false)
  }

  /**
   * Puts the question (turn it off) on the printer's screen, then waits for
   * its answer.
   * Nothing changes until the person there confirms it and this browser
   * completes it; a request nobody answers just expires.
   */
  async ask (enabled: boolean) {
    this.errorMessage = ''
    this.loading = true
    let challenge
    try {
      challenge = await askToChange(enabled)
    } catch (err) {
      this.loading = false
      if (this.missingOwnerConfirmation(err)) {
        this.errorMessage = 'This printer software does not support owner confirmation yet. Developer mode was not changed.'
      } else {
        await this.refused(err)
      }
      return
    }
    this.loading = false
    this.pending = { challengeId: challenge.challengeId, enabled }
    this.consentInstruction = challenge.instruction
    this.secondsRemaining = Math.max(0, Math.round(challenge.expiresInSeconds))
    this.awaiting = true
    this.pollFailures = 0
    this.countdownTimer = window.setInterval(() => {
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1)
      if (this.secondsRemaining === 0) {
        this.stopWaiting()
        this.errorMessage = this.$t('app.general.dev_mode.consent-expired') as string
      }
    }, 1000)
    this.pollTimer = window.setInterval(() => { this.pollConsent().catch(() => undefined) }, CONSENT_POLL_MS)
  }

  /**
   * Asks whether the printer's screen was answered. Turned down there ends
   * the wait; a printer that stops answering is said so after a few tries
   * rather than waited on in silence.
   */
  async pollConsent () {
    const pending = this.pending
    if (!pending) return
    let answer
    try {
      answer = await readAnswer(pending.challengeId)
      this.pollFailures = 0
    } catch (err) {
      this.pollFailures++
      if (this.pollFailures >= 4) this.errorMessage = `The printer isn't saying whether its screen was answered: ${this.describe(err)}`
      return
    }
    if (answer.refused) {
      this.stopWaiting()
      this.errorMessage = 'Turned down at the printer. Nothing changed.'
      return
    }
    if (!answer.confirmed) return
    this.stopWaiting()
    this.loading = true
    try {
      await completeChange({
        enabled: pending.enabled,
        challengeId: pending.challengeId
      })
      this.disableDialog = false
    } catch (err) {
      await this.refused(err)
    } finally {
      this.loading = false
      await refreshDevMode()
    }
  }

  /** Says why the printer refused, and catches up with what it said. */
  async refused (err: unknown) {
    this.errorMessage = this.describe(err)
    if (!(err instanceof DevModeRefused)) return
    if (err.code === 'no_change') {
      await refreshDevMode()
      this.disableDialog = false
    } else if (err.code === 'owner_required' || err.code === 'owner_unknown') {
      await this.refreshAsking()
    } else if (err.code === 'panel_only') {
      // The printer wants this change made at its own screen (KAN-1739).
      this.errorMessage = 'The printer only takes this at its own screen. Go there: System, then Protection, then Developer mode.'
    }
  }

  async restoreDefaults () {
    const ok = await this.$confirm('Your copy of the configuration is backed up, then replaced with the Muon3D defaults, and Klipper restarts.', {
      title: 'Start again from the defaults?',
      buttonTrueText: 'Back up and replace',
      danger: true
    })
    if (!ok) return
    this.loading = true
    try {
      await this.api.refreshDevModeConfigDevModeRefreshPost()
    } catch (err) {
      this.notify('Start again from the defaults', err)
    } finally {
      this.loading = false
    }
  }

  async backupConfig () {
    this.loading = true
    try {
      await this.api.manualBackupDevModeBackupPost()
      this.$store.dispatch('notifications/pushNotification', { title: 'Config backed up', description: 'In the config folder, under backups.', type: 'success' })
    } catch (err) {
      this.notify('Back up the config', err)
    } finally {
      this.loading = false
    }
  }

  notify (title: string, err: unknown) {
    this.$store.dispatch('notifications/pushNotification', { title, description: this.describe(err), type: 'error' })
  }
}
</script>

<style lang="scss" scoped>
  .devm {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .devm__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 18px;
    background: var(--m3d-surface-2);
  }

  .devm__card--on {
    border: 1px solid var(--m3d-warning, #e8963c);
  }

  .devm__eyebrow {
    display: block;
    color: var(--m3d-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .devm__warranty {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-warning, #e8963c);
    font-size: 13px;
  }

  .devm__h {
    margin: 4px 0 -6px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .devm__list {
    display: flex;
    flex-direction: column;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    overflow: hidden;
  }

  .devm__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    color: var(--m3d-text);
    text-decoration: none;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .devm__item-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      font-size: 14px;
      font-weight: 600;
    }

    small {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .devm__actions--off {
    opacity: 0.6;
  }

  .devm__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .devm__titles {
    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .devm__text,
  .devm__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .devm__fuse {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    font-size: 13px;
  }

  .devm__fuse--ok {
    color: var(--m3d-success, #57c08a);
  }

  .devm__fuse--warn {
    color: var(--m3d-warning, #e8963c);
  }

  .devm__fuse--unknown {
    color: var(--m3d-text-muted);
  }

  .devm__goto {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .devm__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .devm__dialog {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);

    h3 {
      margin: 0;
      font-size: 18px;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .devm__press {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);

    div {
      display: flex;
      flex-direction: column;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .devm__pulse {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--m3d-accent);
    animation: devm-pulse 1.2s ease-in-out infinite;
  }

  @keyframes devm-pulse {
    50% { box-shadow: 0 0 0 8px rgb(128 214 209 / 0%); opacity: 0.5; }
  }

  .devm__error {
    color: var(--m3d-danger) !important;
  }

  .devm__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
