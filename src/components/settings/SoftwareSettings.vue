<template>
  <div
    id="versions"
    class="soft"
    data-tid="software-settings"
  >
    <section
      class="soft__panel soft__hero"
      data-tid="software-hero"
    >
      <header class="soft__head">
        <span
          class="soft__hero-ico"
          :class="`soft__hero-ico--${chip.tone}`"
        >
          <frame-icon :name="heroIcon" />
        </span>
        <div class="soft__titles">
          <span
            class="soft__eyebrow"
            :class="`soft__chip--${chip.tone}`"
            data-tid="software-state"
          >{{ chip.text }}</span>
          <h2 data-tid="software-hero-title">
            {{ heroTitle }}
          </h2>
          <p data-tid="software-hero-sub">
            {{ heroSub }}
          </p>
        </div>
        <button
          type="button"
          class="cbtn cbtn--sm soft__check"
          :disabled="checking || active"
          data-tid="software-check"
          @click="check"
        >
          <frame-icon
            name="refresh"
            small
          />
          {{ checking ? 'Checking…' : 'Check now' }}
        </button>
      </header>

      <p
        v-if="!status"
        class="soft__note"
      >
        {{ unavailableText }}
      </p>

      <template v-else>
        <div
          v-if="active"
          class="soft__progress"
          data-tid="software-progress"
        >
          <span class="soft__bar"><i :style="{ width: `${progress ?? 0}%` }" /></span>
          <router-link
            :to="updatingTo"
            class="soft__link"
          >
            See progress
          </router-link>
        </div>

        <p
          v-if="outcomeText"
          class="soft__note soft__note--warn"
          data-tid="software-outcome"
        >
          {{ outcomeText }}
        </p>

        <details
          v-if="available && status.release_notes"
          class="soft__notes"
          data-tid="software-whats-new"
        >
          <summary>
            <b>What's new</b>
            <span>{{ notesTeaser }}</span>
          </summary>
          <p>{{ status.release_notes }}</p>
        </details>

        <p
          v-if="restartReady"
          class="soft__note"
          data-tid="software-staged"
        >
          {{ stagedText }}
        </p>

        <p
          v-else-if="available"
          class="soft__note"
          data-tid="software-how-long"
        >
          Writing the update takes 10 to 40 minutes over Wi-Fi while {{ printerName }} keeps working; then it restarts for a few minutes. Not while printing.
        </p>

        <div
          v-if="queued"
          class="soft__queued"
          data-tid="software-queued"
        >
          <frame-icon
            name="clock"
            small
          />
          <span>{{ queuedText }}</span>
          <button
            type="button"
            class="cbtn cbtn--sm cbtn--ghost"
            data-tid="software-queued-cancel"
            @click="cancelQueued"
          >
            Cancel
          </button>
        </div>

        <div
          v-if="!active && (restartReady || (available && !queued))"
          class="soft__actions"
        >
          <button
            v-if="restartReady"
            type="button"
            class="cbtn cbtn--primary soft__go"
            :disabled="!!restartWhy"
            :title="restartWhy"
            data-tid="software-restart"
            @click="restartToUpdate"
          >
            Restart now to update
          </button>
          <button
            v-else
            type="button"
            class="cbtn cbtn--primary soft__go"
            :disabled="!canAskInstall"
            :title="askBlocked"
            data-tid="software-install"
            @click="openInstall"
          >
            Install…
          </button>
          <span
            v-if="restartReady && restartWhy"
            class="soft__why"
            data-tid="software-restart-why"
          >{{ restartWhy }}</span>
          <span
            v-else-if="!restartReady && askBlocked"
            class="soft__why"
            data-tid="software-install-why"
          >{{ askBlocked }}</span>
        </div>
        <p
          v-if="installRefusal"
          class="soft__note soft__note--warn"
          data-tid="software-install-refusal"
        >
          {{ installRefusal }}
        </p>
      </template>
    </section>

    <h3 class="soft__section">
      How updates arrive
    </h3>
    <section
      class="soft__panel"
      data-tid="software-policy"
    >
      <template v-if="autoInstall !== null">
        <div class="soft__row">
          <div class="soft__titles">
            <h3>Automatic updates</h3>
            <p data-tid="software-auto-text">
              {{ autoText }}
            </p>
          </div>
          <toggle-switch
            :value="autoInstall"
            :disabled="saving !== ''"
            label="Automatic updates"
            data-tid="software-auto"
            @input="setFlag('auto', $event)"
          />
        </div>
        <div
          v-if="presence !== null"
          class="soft__row"
        >
          <div class="soft__titles">
            <h3>Confirm on the printer before installing</h3>
            <p>Someone presses the knob on the printer before a new version installs.</p>
          </div>
          <toggle-switch
            :value="presence"
            :disabled="saving !== ''"
            label="Confirm on the printer before installing"
            data-tid="software-presence"
            @input="setFlag('presence', $event)"
          />
        </div>
        <p
          v-if="policyNote"
          class="soft__note soft__note--warn"
          data-tid="software-policy-note"
        >
          {{ policyNote }}
        </p>
      </template>
      <p
        v-else
        class="soft__note"
        data-tid="software-policy-unknown"
      >
        {{ policyLoaded ? "This printer doesn't report its update settings yet." : 'Asking the printer…' }}
      </p>
      <div class="soft__row">
        <div class="soft__titles">
          <h3>Tell me when one is ready</h3>
          <p>A notice in the bell at the top.</p>
        </div>
        <toggle-switch
          :value="enableNotifications"
          label="Tell me when an update is ready"
          @input="enableNotifications = $event"
        />
      </div>
      <div
        class="soft__row"
        data-tid="software-channel"
      >
        <div class="soft__titles">
          <h3>Channel</h3>
          <p>Stable. A Beta channel comes here when there is one.</p>
        </div>
        <span class="soft__value">Stable</span>
      </div>
    </section>

    <h3 class="soft__section">
      History
    </h3>
    <section
      class="soft__panel"
      data-tid="software-history"
    >
      <div
        v-for="(entry, i) in history"
        :key="`${entry.at}-${i}`"
        class="soft__row soft__hist"
        :data-outcome="entry.outcome"
        data-tid="software-history-row"
      >
        <span
          class="soft__hist-ico"
          :class="`soft__hist-ico--${entry.outcome}`"
        >
          <frame-icon
            :name="entry.outcome === 'updated' ? 'check' : 'refresh'"
            small
          />
        </span>
        <div class="soft__titles">
          <h3>{{ entryVersion(entry) }}</h3>
          <p>{{ entryLine(entry) }}</p>
        </div>
      </div>
      <p
        v-if="!history.length"
        class="soft__note"
        data-tid="software-history-empty"
      >
        {{ installed !== 'unknown' ? `On ${installed}. Updates installed from here are listed here.` : 'Updates installed from here are listed here.' }}
      </p>
    </section>

    <template v-if="others.length">
      <h3 class="soft__section">
        Developer mode only
      </h3>
      <locked-row
        v-if="othersLocked"
        label="Other software"
        reason-text="Update Klipper, Moonraker or system packages on their own. On a Muon printer this can break the matched set."
        data-tid="software-others-locked"
      />
      <task-fold
        v-else
        v-model="otherSoftwareOpen"
        fold-id="settings-other-software"
        title="Other software"
        summary="What else this printer's updater looks after"
        class="soft__panel"
        data-tid="software-others"
      >
        <div
          v-for="c in others"
          :key="c.key"
          class="soft__row"
        >
          <div class="soft__titles">
            <h3>{{ c.title }}</h3>
            <p>{{ c.text }}</p>
          </div>
          <button
            v-if="c.update"
            type="button"
            class="cbtn"
            :disabled="busy || !!otherUpdateBlocked"
            :title="otherUpdateBlocked"
            @click="updateOther(c.key)"
          >
            Update
          </button>
        </div>
      </task-fold>
    </template>

    <v-dialog
      v-model="installDialog"
      max-width="460"
    >
      <div
        v-if="installDialog"
        class="soft__dialog"
        data-tid="software-install-dialog"
      >
        <h3>Install {{ heroTitle }}?</h3>
        <p>{{ printerName }} restarts at the end, for about 3 minutes. Everyone using it sees "Updating".</p>
        <div
          class="soft__when"
          role="radiogroup"
          aria-label="When to install"
        >
          <button
            v-for="w in whenOptions"
            :key="w.value"
            type="button"
            role="radio"
            class="soft__when-row"
            :aria-checked="when === w.value"
            :disabled="!!w.why"
            :data-tid="`software-install-${w.value}`"
            @click="when = w.value"
          >
            <span class="soft__titles">
              <b>{{ w.label }}</b>
              <small>{{ w.why || w.line }}</small>
            </span>
            <span class="soft__tick">
              <frame-icon
                v-if="when === w.value"
                name="check"
                small
              />
            </span>
          </button>
        </div>
        <div class="soft__dialog-buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            data-tid="software-install-cancel"
            @click="installDialog = false"
          >
            Not now
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!when"
            data-tid="software-install-go"
            @click="confirmWhen"
          >
            Install
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import TypedCommandsMixin from '@/mixins/typed-commands'
import { SocketActions } from '@/api/socketActions'
import { ACTIVE_PHASES, bannerVisible, commitPending, isStaged, stagedUnverified, versionLabel } from '@/services/updates/model'
import { currentOutcome, installStarted, poll, updateWatch } from '@/services/updates/watch'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import TaskFold from '@/components/control/TaskFold.vue'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import LockedRow from '@/components/settings/gates/LockedRow.vue'
import MuonGatesMixin from '@/mixins/muon-gates'
import { afterPrint, cancelAfterPrint, loadAfterPrint, otaComponent, queueAfterPrint, type QueuedInstall } from '@/services/updates/after-print'
import { historyLine, loadHistory, printerHistory, updateHistory, type HistoryEntry } from '@/services/updates/history'
import {
  AUTO_INSTALL_PATH, AUTO_OFF_TEXT, AUTO_ON_TEXT, KNOB_TEXT, PRESENCE_PATH, STAGED_TEXT,
  anyHot, flagOf, needsKnob, restartBlocked, stagedReady, type PolicyStatus
} from '@/services/updates/policy'
import { isPanelOnlyRefusal, panelOnlyMessage } from '@/services/wifi/panel-only'
import type { Heater } from '@/store/printer/types'

interface InstallSnapshot {
  target: unknown;
  component: string;
  from: string | null;
  to: string | null;
}

type When = 'now' | 'after'

interface OtherComponent {
  key: string;
  title: string;
  text: string;
  update: boolean;
}

/**
 * Settings › Updates: the printer's own software (MuonOS) as the printer's
 * Aux API reports it: what's installed, what's ready, when it last looked,
 * and Install, which opens the Updating page. Moonraker's update row for
 * MuonOS shows "?" for its versions (OtaDeploy), so this reads the Aux API.
 * Whatever else the updater looks after is available in a nearby fold.
 *
 * Automatic updates (KAN-1925): new versions always download in the
 * background; with the switch on, the printer installs a staged one the next
 * time it restarts, and "Restart now to update" does that now. Control never
 * restarts the printer on its own.
 */
@Component({ components: { ToggleSwitch, TaskFold, FrameIcon, LockedRow } })
export default class SoftwareSettings extends Mixins(TypedCommandsMixin, MuonGatesMixin) {
  checking = false
  otherSoftwareOpen = false
  installRefusal = ''
  autoInstall: boolean | null = null
  presence: boolean | null = null
  policyLoaded = false
  policyNote = ''
  saving = ''
  installDialog = false
  when: When | null = null
  pending: InstallSnapshot | null = null

  mounted () {
    poll()
    this.loadPolicy()
    this.loadKept()
  }

  @Watch('watchedPrinter')
  loadKept () {
    loadAfterPrint(this.watchedPrinter)
    loadHistory(this.watchedPrinter)
  }

  get watchedPrinter (): string {
    return updateWatch.printer
  }

  // -- the hero ---------------------------------------------------------------

  get heroIcon (): string {
    if (this.chip.tone === 'ok') return 'check'
    if (this.outcomeText) return 'alert'
    return 'download'
  }

  /** "MuonOS 6 November 2026": the one ready, else the one it has. */
  get heroTitle (): string {
    const v = this.available ? this.status?.target_version : this.status?.current_version
    return v ? `MuonOS ${versionLabel(v).text.split(' · ')[0]}` : 'MuonOS'
  }

  get heroSub (): string {
    if (!this.status) return "The printer's system, Klipper, its screen and Control, updated together."
    const have = versionLabel(this.status.current_version).text.split(' · ')[0]
    return this.available ? `You have ${have} · checked ${this.checkedText}` : `Up to date · checked ${this.checkedText}`
  }

  get notesTeaser (): string {
    const notes = (this.status?.release_notes ?? '').replace(/\s+/g, ' ').trim()
    return notes.length > 110 ? `${notes.slice(0, 107)}…` : notes
  }

  // -- install now or after this print ------------------------------------------

  get queued (): QueuedInstall | null {
    return afterPrint.printer === this.watchedPrinter ? afterPrint.queued : null
  }

  get queuedText (): string {
    const file = this.queued?.file ? ` (${this.queued.file.replace(/\.gcode$/i, '')})` : ''
    return `Installs after this print${file}. ${this.printerName} keeps printing until then.`
  }

  get printFile (): string | null {
    return this.$store.state.printer?.printer?.print_stats?.filename || null
  }

  /** Install… opens: everything but "printing", which offers "after this print" instead. */
  get askBlocked (): string {
    if (this.printerBusy && this.available && this.commandControlAvailable && this.klippyConnected && !this.active) return ''
    return this.installBlocked
  }

  get canAskInstall (): boolean {
    return this.available && !this.askBlocked
  }

  get whenOptions (): Array<{ value: When, label: string, line: string, why: string }> {
    const busy = this.printerBusy
    return [
      { value: 'now', label: 'Install now', line: 'Starts writing the update now.', why: busy ? 'Not while printing.' : '' },
      { value: 'after', label: 'Install after this print', line: this.printFile ? `When ${this.printFile.replace(/\.gcode$/i, '')} ends.` : 'When the print ends.', why: busy ? '' : 'Nothing is printing.' }
    ]
  }

  snapshot (): InstallSnapshot {
    return { target: this.commandTarget, component: this.otaKey, from: this.status?.current_version ?? null, to: this.status?.target_version ?? null }
  }

  openInstall () {
    this.installRefusal = this.askBlocked
    if (!this.canAskInstall) return
    this.pending = this.snapshot()
    this.when = this.printerBusy ? 'after' : 'now'
    this.installDialog = true
  }

  async confirmWhen () {
    const pending = this.pending
    const when = this.when
    this.installDialog = false
    if (!pending || !when) return
    if (when === 'now') await this.install(pending)
    else this.queueInstall(pending)
  }

  /** "After this print": kept until the print is over, then App sends it (services/updates/after-print). */
  queueInstall (pending: InstallSnapshot) {
    this.installRefusal = ''
    if (pending.target !== this.commandTarget) this.installRefusal = 'Not kept. The selected printer or account changed. Try again.'
    else if (pending.to !== (this.status?.target_version ?? null)) this.installRefusal = 'Not kept. The available version changed. Check again.'
    else if (!this.printerBusy) this.installRefusal = 'The print has ended: install it now instead.'
    else if (this.askBlocked) this.installRefusal = `Not kept. ${this.askBlocked}`
    if (this.installRefusal) return
    queueAfterPrint(this.watchedPrinter, { from: pending.from, to: pending.to, file: this.printFile, at: Date.now() })
  }

  cancelQueued () {
    cancelAfterPrint()
  }

  // -- history ------------------------------------------------------------------

  get history (): HistoryEntry[] {
    return printerHistory(this.status) ?? (updateHistory.printer === this.watchedPrinter ? updateHistory.entries : [])
  }

  entryVersion (entry: HistoryEntry): string {
    return entry.version ? versionLabel(entry.version).text.split(' · ')[0] : 'An update'
  }

  entryLine (entry: HistoryEntry): string {
    const date = new Date(entry.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    return `${historyLine(entry, this.printerName)} · ${date}`
  }

  /** On a Muon printer the parts are updated together; one at a time is for developer mode. */
  get othersLocked (): boolean {
    return this.isMuonPrinter === true && !this.devModeEnabled
  }

  async loadPolicy () {
    const get = async (url: string) => {
      try {
        const r = await this.$httpClient.get(url, { validateStatus: () => true })
        return r.status >= 200 && r.status < 300 ? r.data : null
      } catch {
        return null
      }
    }
    const [auto, presence] = await Promise.all([get(AUTO_INSTALL_PATH), get(PRESENCE_PATH)])
    const status = this.status as PolicyStatus | null
    this.autoInstall = flagOf(auto, 'enabled') ?? (typeof status?.auto_install === 'boolean' ? status.auto_install : null)
    this.presence = flagOf(presence, 'required') ?? (typeof status?.install_presence_required === 'boolean' ? status.install_presence_required : null)
    this.policyLoaded = true
  }

  get autoText (): string {
    return this.autoInstall ? AUTO_ON_TEXT : AUTO_OFF_TEXT
  }

  /** Send the owner's choice; the printer keeps what it accepts and refuses the rest. */
  async setFlag (which: 'auto' | 'presence', value: boolean) {
    if (this.saving) return
    this.saving = which
    this.policyNote = ''
    const url = which === 'auto' ? AUTO_INSTALL_PATH : PRESENCE_PATH
    const body = which === 'auto' ? { enabled: value } : { required: value }
    try {
      const r = await this.$httpClient.post(url, body, { validateStatus: () => true })
      if (r.status === 202 || needsKnob(r.data)) {
        this.policyNote = `${KNOB_TEXT}. The setting changes when you do.`
      } else if (r.status >= 200 && r.status < 300) {
        const kept = flagOf(r.data, which === 'auto' ? 'enabled' : 'required') ?? value
        if (which === 'auto') this.autoInstall = kept
        else this.presence = kept
      } else if (isPanelOnlyRefusal({ response: r })) {
        this.policyNote = panelOnlyMessage('change how it updates')
      } else {
        this.policyNote = "The printer didn't take that change. Try again."
      }
    } catch {
      this.policyNote = "The printer didn't answer. Try again."
    } finally {
      this.saving = ''
    }
  }

  /** Staged, checked, and the printer installs it on its next restart. */
  get restartReady (): boolean {
    return !!this.autoInstall && this.available && stagedReady(this.status)
  }

  get stagedText (): string {
    return STAGED_TEXT
  }

  get hot (): boolean {
    return anyHot((this.$store.getters['printer/getHeaters'] as Heater[]) ?? [])
  }

  get restartWhy (): string {
    return restartBlocked({
      status: this.status,
      canControl: this.commandControlAvailable,
      klippyConnected: this.klippyConnected,
      printerState: this.printerState,
      hot: this.hot,
      active: this.active
    })
  }

  async restartToUpdate () {
    this.installRefusal = this.restartWhy
    if (!this.restartReady || this.restartWhy) return
    const target = this.commandTarget
    const component = this.otaKey
    const fromVersion = this.status?.current_version ?? null
    const toVersion = this.status?.target_version ?? null
    const ok = await this.$confirm(
      `${this.printerName} restarts into the new version now, which takes a few minutes. Don't turn it off until it is back.`,
      { title: 'Restart now to update?', buttonTrueText: 'Restart', buttonFalseText: 'Not now' }
    )
    if (!ok) return
    if (target !== this.commandTarget) this.installRefusal = 'Not sent. The selected printer or account changed. Try again.'
    else if (component !== this.otaKey) this.installRefusal = 'Not sent. The update component changed. Check again.'
    else if (toVersion !== (this.status?.target_version ?? null)) this.installRefusal = 'Not sent. The staged update changed. Check again.'
    else if (!this.restartReady || this.restartWhy) this.installRefusal = `Not sent. ${this.restartWhy || 'The update is no longer staged.'}`
    if (this.installRefusal) return
    // The printer's own install route: it activates the staged slot and
    // restarts, and keeps its presence gate (a knob press) when that is on.
    SocketActions.machineUpdateClient(component)
    installStarted(fromVersion, toVersion)
    if (this.presence) this.installRefusal = `${KNOB_TEXT}. The printer restarts when you do.`
    this.$router.push(this.updatingTo).catch(() => undefined)
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get status () {
    return updateWatch.status
  }

  get locked (): boolean {
    return this.$store.getters['protection/isLocked'] as boolean
  }

  get unavailableText (): string {
    if (this.locked) return 'Network protection is on, so updates are only managed from the printer\'s panel or a device paired with it.'
    return 'Asking the printer…'
  }

  /** What was remembered, but an install "under way" only if the printer has confirmed it in this page and it is within its time: a stale entry never blocks or badges anything. */
  get remembered () {
    const r = updateWatch.remembered
    if (r && ACTIVE_PHASES.includes(r.phase) && !bannerVisible(r, updateWatch.now, !!updateWatch.answered)) return null
    return r
  }

  get active (): boolean {
    return !!this.remembered && ACTIVE_PHASES.includes(this.remembered.phase)
  }

  get progress (): number | null {
    const p = this.remembered?.progress ?? this.status?.progress ?? null
    return typeof p === 'number' ? Math.round(Math.max(0, Math.min(100, p))) : null
  }

  get available (): boolean {
    return !!this.status?.update_available && !!this.status.target_version && this.status.target_version !== this.status.current_version
  }

  get installed (): string {
    return versionLabel(this.status?.current_version).text
  }

  get availableText (): string {
    return versionLabel(this.status?.target_version).text
  }

  get checkedText (): string {
    const at = this.status?.last_checked ? Date.parse(this.status.last_checked) : NaN
    if (!Number.isFinite(at)) return 'not yet'
    const minutes = Math.round((Date.now() - at) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`
  }

  get chip (): { text: string, tone: string } {
    if (!this.status) return { text: '…', tone: 'muted' }
    const phase = this.remembered?.phase
    if (phase === 'installing') return { text: this.progress !== null ? `Updating · ${this.progress}%` : 'Updating', tone: 'busy' }
    if (phase === 'preparing') return { text: 'Starting the update', tone: 'busy' }
    if (phase === 'rebooting') return { text: 'Restarting', tone: 'busy' }
    if (phase === 'verifying' || commitPending(this.status as never)) return { text: 'Checking the update', tone: 'busy' }
    // Staged on the spare slot and waiting for a person: a quiet badge, never "checking".
    if (this.restartReady) return { text: STAGED_TEXT, tone: 'warn' }
    if (isStaged(this.status as never)) return { text: 'Update ready to install', tone: 'warn' }
    if (this.available) return { text: 'Update ready', tone: 'warn' }
    return { text: 'Up to date', tone: 'ok' }
  }

  get outcomeText (): string {
    const o = currentOutcome()
    const message = this.status?.session?.error?.message
    if (o === 'rolled_back') return `The last update didn't complete, so the printer went back to the version it had.${message ? ` ${message}` : ''}`
    if (o === 'failed') return `The last update didn't install; nothing changed.${message ? ` ${message}` : ''}`
    if (this.status?.state === 'failed' && this.status.error) return this.status.error
    return ''
  }

  get installBlocked (): string {
    if (!this.commandControlAvailable) return 'Connect to a printer you can control first.'
    if (!this.klippyConnected) return 'Klipper is not connected.'
    if (this.printerBusy) return 'Not while printing.'
    if (this.active) return 'An update is already under way.'
    if (commitPending(this.status as never)) return 'The printer is still checking the last update.'
    // The staged record cannot prove the spare slot still holds that version (empty slot fingerprint, KAN-1364).
    if (stagedUnverified(this.status as never)) return "An update is staged, but it can't be checked from here yet. Install it from the printer's screen."
    return ''
  }

  get canInstall (): boolean {
    return this.available && !this.installBlocked && this.klippyConnected
  }

  get updatingTo (): string {
    return scopedPath('/updating', activeSlug())
  }

  /** The updater's name for MuonOS: the component of type ota. */
  get otaKey (): string {
    return otaComponent(this.$store.state.version.version_info)
  }

  /** Install now. From the Install dialog its snapshot is the confirmation; called alone, it asks first. */
  async install (asked?: InstallSnapshot) {
    this.installRefusal = this.installBlocked
    if (!this.canInstall) return
    this.installRefusal = ''
    const { target, component, from: fromVersion, to: toVersion } = asked ?? this.snapshot()
    if (!asked) {
      const ok = await this.$confirm(
        `${this.printerName} writes the new version while it keeps working, then restarts into it, which takes a few minutes. Don't turn it off until it is back.`,
        { title: 'Install the update now?', buttonTrueText: 'Install', buttonFalseText: 'Not now' }
      )
      if (!ok) return
    }
    if (target !== this.commandTarget) this.installRefusal = 'Not sent. The selected printer or account changed. Try again.'
    else if (component !== this.otaKey) this.installRefusal = 'Not sent. The update component changed. Check again.'
    else if (fromVersion !== (this.status?.current_version ?? null) || toVersion !== (this.status?.target_version ?? null)) this.installRefusal = 'Not sent. The available version changed. Check again.'
    else if (!this.available || this.installBlocked) this.installRefusal = `Not sent. ${this.installBlocked || 'The update is no longer available.'}`
    if (this.installRefusal) return
    SocketActions.machineUpdateClient(component)
    installStarted(fromVersion, toVersion)
    this.$router.push(this.updatingTo).catch(() => undefined)
  }

  async check () {
    this.checking = true
    try {
      SocketActions.machineUpdateRefresh(this.otaKey)
      await new Promise(resolve => setTimeout(resolve, 3000))
      await poll()
    } finally {
      this.checking = false
    }
  }

  get enableNotifications (): boolean {
    return this.$store.state.config.uiSettings.general.enableVersionNotifications
  }

  set enableNotifications (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.enableVersionNotifications', value, server: true })
  }

  get busy (): boolean {
    return !!this.$store.state.version.busy
  }

  get otherUpdateBlocked (): string {
    if (!this.commandControlAvailable) return 'Connect to a printer you can control first.'
    if (!this.klippyConnected) return 'Klipper is not connected.'
    if (this.printerBusy) return 'Not while printing.'
    return ''
  }

  /** Everything else the updater lists: the OS packages and any other client. */
  get others (): OtherComponent[] {
    const info = (this.$store.state.version.version_info ?? {}) as Record<string, Record<string, unknown>>
    const hasUpdate = this.$store.getters['version/hasUpdate'] as (key: string) => boolean
    return Object.entries(info)
      .filter(([, c]) => c.configured_type !== 'ota')
      .map(([key, c]) => {
        const update = hasUpdate(key)
        if (key === 'system') {
          const n = Number(c.package_count ?? 0)
          return { key, title: 'The system\'s packages', text: n ? `${n} to update` : 'Up to date', update }
        }
        const version = String(c.version ?? c.full_version_string ?? '')
        const remote = String(c.remote_version ?? '')
        return { key, title: key, text: update ? `${version} → ${remote}` : version || 'Up to date', update }
      })
  }

  async updateOther (key: string) {
    if (this.otherUpdateBlocked) return
    const target = this.commandTarget
    const ok = await this.$confirm('The printer must be idle. It may restart after this component is updated.', {
      title: `Update ${key}?`, buttonTrueText: 'Update', buttonFalseText: 'Not now'
    })
    if (!ok || target !== this.commandTarget || this.otherUpdateBlocked) return
    this.$store.dispatch('version/onUpdateStatus', { busy: true })
    if (key === 'system') SocketActions.machineUpdateSystem()
    else SocketActions.machineUpdateClient(key)
  }
}
</script>

<style lang="scss" scoped>
  .soft {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .soft__panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .soft__head,
  .soft__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .soft__row + .soft__row {
    padding-top: 12px;
    border-top: 1px solid var(--m3d-border);
  }

  .soft__titles {
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .soft__chip {
    flex: none;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    font-size: 13px;
    font-weight: 600;
  }

  .soft__chip--ok { color: var(--m3d-success, #57c08a); }
  .soft__chip--warn { color: var(--m3d-warning, #e8963c); }
  .soft__chip--busy { color: var(--m3d-accent); }
  .soft__chip--muted { color: var(--m3d-text-subtle); }

  .soft__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    margin: 0;

    div {
      padding: 10px 12px;
      border-radius: 14px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    dd {
      margin: 2px 0 0;
      font-size: 15px;
      font-weight: 600;
    }
  }

  .soft__progress {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .soft__bar {
    flex: 1 1 auto;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--m3d-accent);
      transition: width 0.6s var(--m3d-ease, ease);
    }
  }

  .soft__link {
    color: var(--m3d-accent) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .soft__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .soft__note--warn {
    color: var(--m3d-warning, #e8963c);
  }

  .soft__notes {
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    font-size: 14px;

    summary {
      cursor: pointer;
      font-weight: 600;
    }

    p {
      margin: 8px 0 0;
      white-space: pre-wrap;
    }
  }

  .soft__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .soft__why {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }
  .soft__section {
    margin: 6px 4px -6px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .soft__hero .soft__head {
    align-items: flex-start;
    justify-content: flex-start;
  }

  .soft__hero .soft__titles {
    flex: 1 1 auto;

    h2 {
      font-size: 20px;
    }
  }

  .soft__hero-ico {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-accent);
  }

  .soft__hero-ico--ok { color: var(--m3d-success, #57c08a); }

  .soft__eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .soft__check {
    flex: none;
  }

  .soft__go {
    flex: 1 1 auto;
    min-height: 44px;
  }

  .soft__value {
    color: var(--m3d-text-muted);
    font-size: 14px;
    font-weight: 600;
  }

  .soft__queued {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    font-size: 14px;

    span {
      flex: 1 1 auto;
    }
  }

  .soft__hist {
    justify-content: flex-start;
  }

  .soft__hist-ico {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-success, #57c08a);
  }

  .soft__hist-ico--rolled_back,
  .soft__hist-ico--failed { color: var(--m3d-warning, #e8963c); }

  .soft__dialog {
    padding: 22px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);

    h3 {
      margin: 0 0 6px;
      font-size: 19px;
    }

    p {
      margin: 0 0 14px;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .soft__when {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .soft__when-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 56px;
    padding: 10px 14px;
    color: var(--m3d-text);
    text-align: left;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }

    small {
      display: block;
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    &:disabled {
      opacity: 0.55;
    }
  }

  .soft__tick {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--m3d-border);
    border-radius: 6px;
    color: var(--m3d-accent);
  }

  .soft__dialog-buttons {
    display: flex;
    gap: 10px;
    margin-top: 16px;

    .cbtn {
      min-height: 44px;
    }

    .cbtn--primary {
      flex: 1 1 auto;
    }
  }
</style>
