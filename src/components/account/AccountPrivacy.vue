<template>
  <div
    class="acct-section"
    data-tid="account-privacy"
  >
    <div class="acct-head">
      <h1>Your data</h1>
      <p class="acct-head__sub">
        Ask for a copy of everything Muon3D holds about you, or close your account.
      </p>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="A copy of your data"
    >
      <div class="acct-card__title">
        <h2>A copy of your data</h2>
      </div>
      <div class="acct-list">
        <div class="acct-row">
          <frame-icon
            name="download"
            small
          />
          <div class="acct-row__label">
            <b>Request a copy</b>
            <span>We gather it, check it's you, and email you a link. It usually takes under a day, and never more than 30 days.</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm lib-btn--pri"
            :disabled="busy"
            data-tid="privacy-request"
            @click="openRequest"
          >
            Request…
          </button>
        </div>
      </div>
    </section>

    <p
      v-if="note"
      class="acct-note acct-note--info"
      role="status"
      data-tid="privacy-export-note"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ note }}</span>
    </p>

    <section
      v-if="requests.length"
      class="lib-surface acct-card"
      aria-label="Requests"
      data-tid="privacy-requests"
    >
      <div class="acct-card__title">
        <h2>Requests · {{ requests.length }}</h2>
      </div>
      <div class="acct-list">
        <div
          v-for="request in requests"
          :key="request.id"
          class="acct-row priv__req"
          :class="{ 'priv__req--lit': request.id === litId, 'priv__req--ended': stageOf(request) === null }"
          :data-tid="`privacy-request-${request.id}`"
        >
          <frame-icon
            :name="request.status === 'ready' ? 'download' : 'clock'"
            small
          />
          <div class="acct-row__label">
            <b>Your data · requested {{ askedText(request) }}</b>
            <span>{{ requestLine(request) }}</span>
            <span
              v-if="request.status === 'ready'"
              data-tid="privacy-download-soon"
            ><b>Download:</b> not available yet.</span>
            <ol
              v-if="stageOf(request) !== null"
              class="priv__stages"
              :aria-label="`Stage: ${stages[stageOf(request) || 0]}`"
              data-tid="privacy-stages"
            >
              <li
                v-for="(stage, i) in stages"
                :key="stage"
                :class="{ 'priv__stage--done': i < (stageOf(request) || 0), 'priv__stage--on': i === stageOf(request) }"
              >
                {{ stage }}
              </li>
            </ol>
          </div>
          <span
            class="priv__pill"
            :class="`priv__pill--${request.status}`"
          >{{ statusText(request) }}</span>
        </div>
      </div>
    </section>
    <p class="acct-muted priv__small">
      Only you can request it, and only from a signed-in session that has just checked it's you. The email links back to this page, never to the file. Download links last 7 days.
    </p>

    <section
      class="lib-surface acct-card"
      aria-label="What we hold"
      data-tid="privacy-held"
    >
      <div class="acct-card__title">
        <h2>What we hold</h2>
      </div>
      <div class="acct-list">
        <div
          v-for="row in held"
          :key="row.title"
          class="acct-row"
        >
          <div class="acct-row__label">
            <b>{{ row.title }}</b>
            <span>{{ row.text }}</span>
          </div>
          <span
            v-if="row.size"
            class="acct-muted priv__size"
          >{{ row.size }}</span>
        </div>
      </div>
    </section>

    <section
      class="lib-surface acct-card"
      aria-label="How long we keep things"
      data-tid="privacy-retention"
    >
      <div class="acct-card__title">
        <h2>How long we keep things</h2>
        <span class="acct-card__aside">Also in every copy</span>
      </div>
      <div class="acct-list">
        <div
          v-for="row in retention"
          :key="row.key"
          class="priv__ret"
        >
          <span>{{ row.label }}</span>
          <span class="acct-muted">{{ row.value }}</span>
        </div>
        <p
          v-if="!retention.length"
          class="acct-muted priv__reading"
        >
          {{ retentionError || 'Reading…' }}
        </p>
      </div>
    </section>

    <p
      v-if="error"
      class="acct-error"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {{ error }}
    </p>

    <m3-dialog
      :value="sheet !== null"
      :title="sheet === 'you' ? 'Confirm it\'s you' : 'Request a copy of your data'"
      max-width="460"
      :persistent="busy"
      aria-label="Request a copy of your data"
      data-tid="privacy-sheet"
      @close="closeSheet"
    >
      <p class="priv__step">
        Step {{ sheet === 'you' ? 2 : 1 }} of 2
      </p>
      <template v-if="sheet === 'what'">
        <p class="m3-dlg__text">
          Pick what you want. We'll email you when it's ready. Nothing downloads now.
        </p>
        <div class="priv__parts">
          <label class="priv__part">
            <input
              type="checkbox"
              class="acct-checkbox"
              :checked="everything"
              data-tid="privacy-part-everything"
              @change="onEverything"
            >
            <span><b>Everything</b></span>
          </label>
          <label
            v-for="part in parts"
            :key="part.id"
            class="priv__part"
          >
            <input
              v-model="chosen"
              type="checkbox"
              class="acct-checkbox"
              :value="part.id"
              :data-tid="`privacy-part-${part.id}`"
            >
            <span>
              <b>{{ part.label }}</b>
              <span
                v-if="part.text"
                class="acct-muted"
              >{{ part.text }}{{ part.id === 'library' && librarySize ? ` · about ${librarySize}` : '' }}</span>
            </span>
          </label>
        </div>
        <fieldset class="priv__format">
          <legend>Format</legend>
          <label
            v-for="f in formats"
            :key="f.id"
            class="priv__seg"
            :class="{ 'priv__seg--on': format === f.id }"
          >
            <input
              v-model="format"
              type="radio"
              class="sr-only"
              name="privacy-format"
              :value="f.id"
              :data-tid="`privacy-format-${f.id}`"
            >{{ f.label }}
          </label>
        </fieldset>
      </template>
      <template v-else-if="sheet === 'you'">
        <p class="m3-dlg__text">
          {{ twoStep
            ? 'Request copy checks it\'s you, with your passkey or your password and the code from your authenticator app.'
            : 'Request copy checks it\'s you, with your passkey or your password.' }}
        </p>
        <p
          v-if="!twoStep"
          class="acct-note"
          data-tid="privacy-email-link-soon"
        >
          <frame-icon
            name="info"
            small
          />
          <span><b>Not available yet:</b> confirming by an email link instead. Turn on 2-step in Sign-in and security for the code check.</span>
        </p>
        <p class="acct-note">
          <frame-icon
            name="shield"
            small
          />
          <span>We'll also tell you by email, so you'd know if someone else asked.</span>
        </p>
      </template>

      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          :disabled="busy"
          data-tid="privacy-sheet-back"
          @click="sheet === 'you' ? (sheet = 'what') : closeSheet()"
        >
          {{ sheet === 'you' ? 'Back' : 'Cancel' }}
        </button>
        <button
          v-if="sheet === 'what'"
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!chosen.length"
          data-tid="privacy-continue"
          @click="sheet = 'you'"
        >
          Continue
        </button>
        <button
          v-else
          type="button"
          class="cbtn cbtn--primary"
          :disabled="busy"
          data-tid="privacy-send"
          @click="send"
        >
          Request copy
        </button>
      </template>
    </m3-dialog>

    <reauth-dialog
      v-bind="reauthProps"
      v-on="reauthOn"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import AccountReauthMixin from '@/mixins/account-reauth'
import ReauthDialog from './ReauthDialog.vue'
import { accountApi } from '@/services/account/api'
import { accountState, describe, loadMe } from '@/services/account/state'
import { dayText, whenText, type AccountSectionId } from '@/services/account/model'
import {
  EXPORT_PARTS,
  EXPORT_STAGES,
  exportIsOpen,
  exportStage,
  exportStatusText,
  exportTime,
  exportsFrom,
  exportsNewestFirst,
  type ExportFormat,
  type ExportPart,
  type ExportRequest
} from '@/services/account/plan-export'
import { LIBRARY_RETENTION, retentionRows, type RetentionRow } from '@/services/account/retention'
import { libraryState } from '@/services/library/store'
import { bytesText } from '@/services/library/format'

/**
 * Your data, to the 6 Nov storyboard (settings/account-data): a copy is a
 * request, not a download (Jack, 6 Nov). Ask for it (what and which format),
 * check it's you, then follow it on its row until the email says it's ready;
 * the email links here, never to the file. Below: what we hold and how long
 * we keep it, from the console's own statement (`GET /v1/retention`).
 */
@Component({ components: { M3Dialog, ReauthDialog } })
export default class AccountPrivacy extends Mixins(AccountReauthMixin) {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  rows: RetentionRow[] = []
  retentionError = ''
  busy = false
  error = ''
  note = ''
  list: ExportRequest[] = []
  sheet: 'what' | 'you' | null = null
  chosen: ExportPart[] = EXPORT_PARTS.map(p => p.id)
  format: ExportFormat = 'zip'
  readonly parts = EXPORT_PARTS
  readonly stages = EXPORT_STAGES
  readonly formats: Array<{ id: ExportFormat, label: string }> = [{ id: 'zip', label: 'ZIP (JSON + your files)' }, { id: 'json', label: 'JSON only' }]

  created () {
    loadMe().catch(() => {})
    this.loadRequests()
    accountApi.retention()
      .then((statement) => { this.rows = retentionRows(statement) })
      .catch((error) => { this.retentionError = describe(error) })
  }

  /** The list is a convenience: a console without it, or one that fails, still takes a request. */
  loadRequests (made?: ExportRequest) {
    return accountApi.exports()
      .then((answer) => {
        const list = exportsFrom(answer)
        this.list = exportsNewestFirst(made?.id && !list.some(e => e.id === made.id) ? [made, ...list] : list)
      })
      .catch(() => {})
  }

  get requests (): ExportRequest[] { return this.list }

  get open (): ExportRequest | null { return this.list.find(exportIsOpen) ?? null }

  /** The email's link names its request: `/account/privacy?export=<id>`. */
  get litId (): string | null {
    const id = this.$route?.query?.export
    return typeof id === 'string' ? id : this.open?.id ?? null
  }

  get twoStep (): boolean {
    const me = accountState.me
    return me ? (me.sign_in?.two_step ?? me.account.two_step ?? false) : false
  }

  get email (): string { return accountState.me?.account.email ?? '' }

  get everything (): boolean { return this.chosen.length === EXPORT_PARTS.length }

  get librarySize (): string { return libraryState.usedBytes ? bytesText(libraryState.usedBytes) : '' }

  get held (): Array<{ title: string, text: string, size?: string }> {
    return [
      { title: 'Account and profile', text: 'Name, handle, email, photo, sign-in history' },
      { title: 'Printers and access', text: 'Printers you own or belong to, invites, devices, tokens (never the secret)' },
      { title: 'Library', text: 'Uploads, designs, collections, saves, makes, comments', size: this.librarySize },
      { title: 'Print history', text: 'Jobs sent through your account, with timings and outcomes' },
      { title: 'Not included', text: 'Files kept only on a printer (they never reach us), and camera video (it isn\'t stored)' }
    ]
  }

  get retention (): RetentionRow[] {
    return this.rows.length ? [...this.rows, ...LIBRARY_RETENTION] : []
  }

  stageOf (request: ExportRequest): number | null { return exportStage(request) }

  statusText (request: ExportRequest): string { return exportStatusText(request) }

  askedText (request: ExportRequest): string {
    const at = exportTime(request.requested_at)
    return at ? whenText(at) : 'recently'
  }

  requestLine (request: ExportRequest): string {
    const size = request.size_bytes ? bytesText(request.size_bytes) : ''
    const ends = exportTime(request.expires_at)
    switch (request.status) {
      case 'queued': return `Waiting to be gathered. We'll email ${this.email || 'you'} when it's ready.`
      case 'building': return `Being gathered. We'll email ${this.email || 'you'} when it's ready.`
      case 'ready': return [size, ends ? `link ends ${dayText(ends)}` : ''].filter(Boolean).join(' · ') || 'Ready'
      case 'failed': return "We couldn't finish it. Request a new copy."
      default: return [size, ends ? `link ended ${dayText(ends)}` : 'link ended'].filter(Boolean).join(' · ')
    }
  }

  onEverything (event: Event) {
    this.setEverything((event.target as HTMLInputElement).checked)
  }

  setEverything (on: boolean) {
    this.chosen = on ? EXPORT_PARTS.map(p => p.id) : []
  }

  openRequest () {
    this.error = ''
    if (this.open) {
      // One open request at a time: a second Request… shows the open one.
      this.note = `You already asked on ${this.askedText(this.open)}. We'll email you when it's ready.`
      return
    }
    this.note = ''
    this.chosen = EXPORT_PARTS.map(p => p.id)
    this.format = 'zip'
    this.sheet = 'what'
  }

  closeSheet () {
    if (this.busy) return
    this.sheet = null
  }

  async send () {
    if (this.busy || !this.chosen.length) return
    this.busy = true
    this.error = ''
    const choice = { parts: [...this.chosen], format: this.format }
    try {
      const answer = await this.withReauth(r => accountApi.requestExport(r, choice), {
        why: 'A copy of your data holds everything about your account, so we check it\'s you.',
        action: 'Request copy'
      })
      if (!answer) return
      this.sheet = null
      this.note = `Requested. We'll email ${this.email || 'you'} when it's ready, with a link back to this page.`
      if (answer.id) this.list = exportsNewestFirst([answer, ...this.list.filter(e => e.id !== answer.id)])
      await this.loadRequests(answer)
    } catch (error) {
      const status = (error as { status?: number })?.status
      this.sheet = null
      if (status === 404 || status === 405 || status === 501) this.note = 'Requesting a copy is not available yet.'
      else if (status === 409) { this.note = 'You already have a request open. We\'ll email you when it\'s ready.'; await this.loadRequests() } else if (status === 429) this.note = 'You can ask for a copy once a day. Try again tomorrow.'
      else this.error = describe(error)
    } finally {
      this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .acct-head__sub {
    margin: 4px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13.5px;
  }

  .priv__small {
    margin: -4px 0 0;
    font-size: 12px;
  }

  .priv__req {
    justify-content: flex-start;
    gap: 12px;

    > .acct-row__label {
      flex: 1 1 auto;
    }
  }

  .priv__req--lit {
    box-shadow: inset 3px 0 0 var(--m3d-accent);
    padding-left: 10px;
  }

  .priv__req--ended {
    opacity: 0.65;
  }

  .priv__stages {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
    font-size: 11.5px;
    color: var(--m3d-text-muted);

    li::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 5px;
      border: 1.5px solid var(--m3d-border-strong);
      border-radius: 50%;
      vertical-align: -1px;
    }

    .priv__stage--done::before {
      border-color: var(--m3d-accent);
      background: var(--m3d-accent);
    }

    .priv__stage--on {
      color: var(--m3d-text);
      font-weight: 600;

      &::before {
        border-color: var(--m3d-accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--m3d-accent) 25%, transparent);
      }
    }
  }

  .priv__pill {
    flex: none;
    padding: 2px 9px;
    border: 1px solid var(--m3d-border);
    border-radius: 99px;
    color: var(--m3d-text-muted);
    font-size: 11.5px;
    white-space: nowrap;
  }

  .priv__pill--building,
  .priv__pill--queued {
    border-color: color-mix(in srgb, var(--m3d-warn, #d49a2a) 60%, var(--m3d-border));
    color: var(--m3d-warn, #d49a2a);
  }

  .priv__pill--ready {
    border-color: var(--m3d-accent);
    color: var(--m3d-accent);
  }

  .priv__size {
    flex: none;
    font-size: 12.5px;
  }

  .priv__ret {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    padding: 9px 0;
    font-size: 13.5px;
  }

  .priv__reading {
    margin: 0;
    padding: 12px 0;
    font-size: 13px;
  }

  .priv__step {
    margin: 0 0 6px;
    color: var(--m3d-text-muted);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .priv__parts {
    display: grid;
    margin: 12px 0;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
  }

  .priv__part {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 11px 12px;
    font-size: 13.5px;
    cursor: pointer;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }

    > span {
      display: grid;
      gap: 2px;
      font-size: 12px;
    }

    b {
      font-size: 13.5px;
      font-weight: 500;
    }
  }

  .priv__format {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 0;
    border: 0;

    legend {
      margin-bottom: 6px;
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .priv__seg {
    padding: 6px 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 8px;
    font-size: 12.5px;
    cursor: pointer;

    &:focus-within {
      outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent));
      outline-offset: 2px;
    }
  }

  .priv__seg--on {
    border-color: var(--m3d-accent);
    background: var(--m3d-accent-soft);
  }
</style>
