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
          <h2>Developer mode</h2>
          <p
            :class="{ 'devm__state--on': state.enabled === true }"
            data-tid="developer-mode-state"
          >
            {{ stateLine }}
          </p>
        </div>
        <toggle-switch
          v-if="mayAsk && state.enabled !== null"
          :value="!!state.enabled"
          label="Developer mode"
          :disabled="state.enabled === null || busy"
          data-tid="developer-mode-switch"
          @input="toggle"
        />
      </header>

      <template v-if="state.enabled !== null">
        <p
          class="devm__text"
          data-tid="developer-mode-what"
        >
          {{ whatLine }}
        </p>

        <div
          v-if="sshAddress"
          class="devm__ssh"
          data-tid="developer-mode-ssh"
        >
          <div class="devm__ssh-text">
            <span>SSH address</span>
            <code data-tid="developer-mode-ssh-address">{{ sshAddress }}</code>
          </div>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="developer-mode-ssh-copy"
            @click="copySsh"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>

        <p
          v-if="!adminBuild"
          class="devm__warranty"
          data-tid="developer-mode-warranty"
        >
          <frame-icon
            name="alert"
            small
          />
          <span>{{ warrantyLine }}</span>
        </p>

        <p
          v-if="mayAsk"
          class="devm__text"
          data-tid="developer-mode-off-how"
        >
          {{ offLine }}
        </p>
        <p
          v-else-if="notAsking"
          class="devm__note"
          data-tid="developer-mode-who"
        >
          {{ notAsking }}
        </p>

        <div
          v-if="state.enabled"
          class="devm__actions"
          data-tid="developer-mode-while-on"
        >
          <button
            type="button"
            class="cbtn cbtn--ghost devm__small"
            :disabled="busy"
            data-tid="developer-backup"
            @click="backupConfig"
          >
            Back up the configuration
          </button>
          <button
            type="button"
            class="cbtn cbtn--ghost devm__small"
            :disabled="busy"
            data-tid="developer-reset"
            @click="restoreDefaults"
          >
            Start again from the Muon3D defaults
          </button>
        </div>
      </template>
    </div>

    <v-dialog
      v-model="changeDialog"
      max-width="480"
      :persistent="awaiting"
    >
      <div
        class="devm__dialog"
        :data-tid="target ? 'developer-enable-dialog' : 'developer-disable-dialog'"
      >
        <h3>{{ target ? 'Turn on developer mode' : 'Turn off developer mode' }}</h3>
        <template v-if="target">
          <template v-if="firstRelease">
            <p data-tid="developer-terms">
              {{ waiverText || $t('app.general.dev_mode.modal-1') }}
            </p>
            <template v-if="!waiverText">
              <p>{{ $t('app.general.dev_mode.modal-2') }}</p>
              <p>{{ $t('app.general.dev_mode.modal-3') }}</p>
            </template>
            <label class="devm__accept">
              <input
                v-model="accepted"
                type="checkbox"
                :disabled="busy"
                data-tid="developer-accept"
              >
              <span>{{ $t('app.general.dev_mode.modal-checkbox-message') }}</span>
            </label>
          </template>
          <p v-else>
            Your copy of the configuration comes back, and the printer runs it.
          </p>
        </template>
        <template v-else>
          <p>{{ $t('app.general.dev_mode.disable-modal-1') }}</p>
          <p>{{ $t('app.general.dev_mode.disable-modal-2') }}</p>
        </template>
        <div
          v-if="awaiting"
          class="devm__press"
          data-tid="developer-press-knob"
        >
          <span class="devm__pulse" />
          <div>
            <b>Confirm on the printer</b>
            <span v-if="consentInstruction">{{ consentInstruction }}</span>
            <span>{{ $t('app.general.dev_mode.consent-expires', { seconds: secondsRemaining }) }}</span>
          </div>
        </div>
        <p
          v-if="errorMessage"
          class="devm__error"
          data-tid="developer-error"
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
            :disabled="loading || awaiting || (target && firstRelease && !accepted)"
            data-tid="developer-confirm"
            @click="confirmChange"
          >
            {{ target ? 'Turn on' : 'Turn off' }}
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
  requestChange,
  completeChange,
  readAnswer,
  whoMayAsk,
  whyNot,
  DevModeRefused,
  type DevModeAsking
} from '@/services/dev-mode/request'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

/** How often the browser asks whether the printer's screen has been answered. */
const CONSENT_POLL_MS = 1500

/**
 * Settings › Developer mode: whether it's on, a way out, and whether turning
 * it on ends the warranty (release builds), and, on an admin build only, the
 * SSH address. With it on: back up the config or start again from the defaults.
 *
 * Both ways are done from here, over any route (KAN-3604), through
 * Moonraker's request route (services/dev-mode/request). Only the FIRST
 * release of the warranty is confirmed on the printer's screen: Control reads
 * the terms, takes the owner's acceptance, then shows "Confirm on the printer"
 * and waits. Once it has been on before, the printer takes a change without
 * a challenge and Control does not wait. On a linked printer the switch is
 * the owner's alone, so nobody else is shown it.
 */
@Component({ components: { ToggleSwitch } })
export default class DeveloperModeSettings extends Vue {
  api = useAuxApi().devMode
  state = devModeState

  /** Who may ask, as the printer said; null until it has. */
  asking: DevModeAsking | null = null
  askingError = ''
  changeDialog = false
  /** What the open dialog is about: true turns it on, false turns it off. */
  target = false
  accepted = false
  loading = false
  /** The change waiting on the printer's screen. */
  pending: { challengeId: string, enabled: boolean, waiverVersion?: string } | null = null
  consentInstruction = ''
  secondsRemaining = 0
  awaiting = false
  errorMessage = ''
  /** The SSH address was just copied. */
  copied = false
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

  get stateLine (): string {
    if (this.state.enabled === null) return 'Asking the printer…'
    return this.state.enabled ? 'On' : 'Off'
  }

  /**
   * An admin build: the printer says turning developer mode on needs no
   * warranty release (its guard is disarmed). Anything else, including an
   * answer that isn't there, counts as a release build, which fails closed:
   * the warranty line is shown and the SSH address is not.
   */
  get adminBuild (): boolean {
    return this.state.canManage === true && this.state.guardArmed === false && this.state.otpArmed !== true
  }

  /** What developer mode is and what it changes. */
  get whatLine (): string {
    if (this.state.enabled) {
      return 'The printer is running your copy of its configuration and macros. You can edit them and its files. The Muon3D defaults stay as they are beside your copy.'
    }
    return "Developer mode lets you change this printer's own configuration and macros, and edit its files. The Muon3D defaults stay as they are beside your copy."
  }

  /** Release builds only: the warranty. */
  get warrantyLine (): string {
    return this.state.enabled
      ? 'The warranty ended when you first turned this on.'
      : 'The first time you turn it on, the warranty ends, even if you turn it off again.'
  }

  get offLine (): string {
    return this.state.enabled
      ? 'Turn it off with the switch to go back to the Muon3D defaults. Your copy is kept for next time.'
      : 'Once it is on, you can turn it off any time with the switch. The printer then goes back to the Muon3D defaults, and your copy is kept.'
  }

  /**
   * The SSH address, on an admin build with developer mode on, and nowhere
   * else. Empty (so no row) unless the printer has said it is an admin build
   * AND given its own name.
   */
  get sshAddress (): string {
    if (!this.adminBuild || this.state.enabled !== true) return ''
    const host = ((this.$store?.state?.printer?.printer?.info?.hostname as string | undefined) ?? '').trim()
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(host)) return ''
    return `ssh root@${host}.local`
  }

  async copySsh () {
    try {
      await navigator.clipboard.writeText(this.sshAddress)
      this.copied = true
      window.setTimeout(() => { this.copied = false }, 1500)
    } catch (err) {
      consola.debug('Could not copy the SSH address:', err)
    }
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
    if (!this.mayAsk || this.busy || this.state.enabled === null) return
    this.errorMessage = ''
    this.accepted = false
    this.target = !this.state.enabled
    this.changeDialog = true
  }

  /** The first release of the warranty: the only change that waits for the printer's screen. */
  get firstRelease (): boolean {
    return this.target && !this.state.everEnabled
  }

  /** The printer's own terms, when it sends them; Control's wording otherwise. */
  get waiverText (): string {
    return this.asking?.waiver?.text ?? ''
  }

  closeDialogs () {
    this.stopWaiting()
    this.changeDialog = false
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

  confirmChange () {
    if (this.firstRelease && !this.accepted) return Promise.resolve()
    return this.ask(this.target)
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
    let asked
    try {
      asked = await requestChange(enabled)
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
    if (asked.kind === 'applied') {
      // The printer took it with nothing to confirm: only the first release waits for its screen.
      this.changeDialog = false
      await refreshDevMode()
      return
    }
    const challenge = asked.challenge
    this.pending = { challengeId: challenge.challengeId, enabled, waiverVersion: (challenge.waiver ?? this.asking?.waiver)?.version }
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
        challengeId: pending.challengeId,
        waiverVersion: pending.waiverVersion
      })
      this.changeDialog = false
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
      this.changeDialog = false
    } else if (err.code === 'owner_required' || err.code === 'owner_unknown') {
      await this.refreshAsking()
    } else if (err.code === 'panel_only') {
      // An older MuonOS that wants this change made at its own screen (KAN-1739).
      this.errorMessage = "This printer's software only takes this at its own screen: System, then Protection, then Developer mode. Control can't do it for it yet."
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

  .devm__state--on {
    color: var(--m3d-success, #57c08a) !important;
  }

  .devm__small {
    min-height: 0;
    padding: 7px 14px;
    font-size: 13px;
  }

  .devm__ssh {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 10px 10px 10px 14px;
    border-radius: 14px;
    background: var(--m3d-surface);
  }

  .devm__ssh-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    code {
      overflow-wrap: anywhere;
      font-family: var(--m3d-font-mono, ui-monospace, monospace);
      font-size: 14px;
    }
  }

  .devm__ssh .cbtn {
    flex: none;
  }

  .devm__text,
  .devm__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .devm__accept {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
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
