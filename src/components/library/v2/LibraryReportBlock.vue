<template>
  <div
    class="mrep"
    data-tid="library-report-block"
  >
    <button
      type="button"
      class="mlib-link"
      data-tid="library-print-report"
      @click="openReport"
    >
      Report this model
    </button>
    <button
      type="button"
      class="mlib-link"
      data-tid="library-print-block"
      @click="openBlock"
    >
      Block {{ who }}
    </button>

    <section
      v-if="reporting"
      class="mrep__panel"
      role="dialog"
      aria-label="Report this model"
      data-tid="library-report-dialog"
    >
      <template v-if="!reported">
        <h3>Report this model</h3>
        <form
          data-tid="library-report-form"
          @submit.prevent="sendReport"
        >
          <label>
            Reason
            <select
              v-model="reason"
              data-tid="library-report-reason"
            >
              <option value="">Choose a reason</option>
              <option
                v-for="r in reasons"
                :key="r.value"
                :value="r.value"
              >{{ r.label }}</option>
            </select>
          </label>
          <p
            v-if="reason === 'copyright'"
            class="mlib-muted"
            data-tid="library-report-copyright-note"
          >
            A copyright claim is passed on to the uploader, with your email, because the law expects that.
          </p>
          <label>
            Reply email
            <input
              v-model="email"
              type="email"
              maxlength="254"
              data-tid="library-report-email"
            >
          </label>
          <label>
            Details (optional)
            <textarea
              v-model="details"
              maxlength="2000"
              rows="4"
              data-tid="library-report-details"
            />
          </label>
          <p class="mlib-muted">
            Staff review every report. A report does not hide the model by itself. The uploader is not told who reported, except for a copyright claim.
          </p>
          <p
            v-if="error"
            class="mrep__error"
            role="alert"
            data-tid="library-report-error"
          >
            {{ error }}
          </p>
          <div class="mrep__acts">
            <button
              type="button"
              class="mlib-btn"
              data-tid="library-report-cancel"
              @click="closeReport"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="mlib-btn mlib-btn--primary"
              :disabled="busy"
              data-tid="library-report-send"
            >
              Send report
            </button>
          </div>
        </form>
      </template>
      <div
        v-else
        data-tid="library-report-done"
      >
        <h3>Thank you for letting us know</h3>
        <p>
          Staff will get the report and it will be reviewed. The uploader is not told who reported,
          except for a copyright claim, which the law expects us to pass on. You will be told the outcome by email.
        </p>
        <button
          type="button"
          class="mlib-btn"
          @click="closeReport"
        >
          Close
        </button>
      </div>
    </section>

    <section
      v-if="blocking"
      class="mrep__panel"
      role="dialog"
      aria-label="Block this maker"
      data-tid="library-block-confirm"
    >
      <template v-if="!blocked">
        <h3>Block {{ who }}?</h3>
        <p>
          You will not see {{ who }}'s shares in the community. They cannot share with you, remix your prints or post makes on them.
          Printer access does not change.
        </p>
        <p
          v-if="blockError"
          class="mrep__error"
          role="alert"
          data-tid="library-block-error"
        >
          {{ blockError }}
        </p>
        <div class="mrep__acts">
          <button
            type="button"
            class="mlib-btn"
            data-tid="library-block-cancel"
            @click="blocking = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="mlib-btn mlib-btn--primary"
            :disabled="busy"
            data-tid="library-block-go"
            @click="block"
          >
            Block
          </button>
        </div>
      </template>
      <div
        v-else
        data-tid="library-block-done"
      >
        <h3>{{ who }} is blocked</h3>
        <p>You will not see their shares, and they cannot share with you, remix your prints or post makes on them.</p>
        <button
          type="button"
          class="mlib-btn"
          @click="blocking = false"
        >
          Close
        </button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { describeLibraryError, LibraryError, type ReportReason } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'
import { cloudState } from '@/services/muon-cloud/state'

/** The service's reasons (community_surfaces.rs), worded as the Library web words them. */
const REASONS: Array<{ value: ReportReason, label: string }> = [
  { value: 'weapon', label: 'Weapons' },
  { value: 'illegal', label: 'Illegal content' },
  { value: 'copyright', label: 'Copyright infringement' },
  { value: 'licence', label: 'Licence concern' },
  { value: 'personal_data', label: 'Personal information' },
  { value: 'safety', label: 'Safety concern' }
]

const newCommand = (): string => {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().replace(/-/g, '')
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

/** Report and Block for someone else's public print, in the app; the service decides who may. */
@Component
export default class LibraryReportBlock extends Vue {
  /** The print's id: the same id is the share the service reports and blocks by. */
  @Prop({ type: String, required: true }) readonly printId!: string
  /** The maker's name as the page shows it. */
  @Prop({ type: String, default: '' }) readonly maker!: string
  @Prop({ type: Boolean, default: false }) readonly signedIn!: boolean

  reasons = REASONS
  reporting = false
  reported = false
  reason: ReportReason | '' = ''
  email = ''
  details = ''
  error = ''
  busy = false
  blocking = false
  blocked = false
  blockError = ''
  /** One per open dialog: sending again after a failure is the same report, not a second one. */
  private command = ''

  get who (): string { return this.maker || 'this maker' }

  openReport () {
    if (!this.signedIn) { this.$emit('sign-in'); return }
    this.blocking = false
    this.reporting = true
    this.reported = false
    this.error = ''
    this.command = newCommand()
    if (!this.email) this.email = cloudState.account?.email ?? ''
  }

  closeReport () { this.reporting = false }

  openBlock () {
    if (!this.signedIn) { this.$emit('sign-in'); return }
    this.reporting = false
    this.blocking = true
    this.blocked = false
    this.blockError = ''
  }

  async sendReport () {
    if (this.busy) return
    if (!this.reason) { this.error = 'Choose a reason.'; return }
    if (!/.+@.+/.test(this.email)) { this.error = 'Give an email we can reply to.'; return }
    const label = REASONS.find(r => r.value === this.reason)?.label ?? ''
    // The service needs 8 to 2000 characters; with no details the reason is the report.
    const text = this.details.trim().length >= 8 ? this.details.trim() : `Reported as: ${label}.`
    this.busy = true
    this.error = ''
    try {
      const receipt = await libraryClient().reportPrint({ command: this.command, target: this.printId, target_kind: 'share', sender: this.email.trim(), reason: this.reason, text })
      if (receipt?.received !== true) throw new LibraryError('protocol', 'The report could not be confirmed.')
      this.reported = true
    } catch (error) {
      this.error = reportProblem(error)
    } finally { this.busy = false }
  }

  async block () {
    if (this.busy) return
    this.busy = true
    this.blockError = ''
    try {
      await libraryClient().blockMaker(this.printId)
      this.blocked = true
    } catch (error) {
      this.blockError = blockProblem(error)
    } finally { this.busy = false }
  }
}

function reportProblem (error: unknown): string {
  const status = error instanceof LibraryError ? error.status : 0
  if (status === 429) return 'Too many reports have been sent from here. Your details are kept. Try again tomorrow.'
  if (status === 404) return 'Reporting is not open yet. Your report has not been sent.'
  if (status === 401) return 'You were signed out. Sign in again, then send it. Your details are kept.'
  if (status === 400 && error instanceof LibraryError) return `${error.message} Your details are kept.`
  return `The report could not be sent. ${describeLibraryError(error)} Your details are kept; try again.`
}

function blockProblem (error: unknown): string {
  if (error instanceof LibraryError) {
    if (error.code === 'block_invalid') return 'You cannot block yourself.'
    if (error.status === 404) return 'This print or maker could not be found, so nothing was blocked.'
    if (error.status === 401) return 'You were signed out. Sign in again, then block.'
  }
  return `Nothing was blocked. ${describeLibraryError(error)}`
}
</script>

<style lang="scss" scoped>
.mrep { display: contents; }
.mrep__panel { flex-basis: 100%; margin-top: 12px; padding: 16px; border-radius: 12px; background: var(--m3d-surface, rgba(128, 128, 128, 0.12)); }
.mrep__panel h3 { margin: 0 0 8px; }
.mrep__panel label { display: block; margin: 8px 0; }
.mrep__panel select, .mrep__panel input, .mrep__panel textarea { display: block; width: 100%; margin-top: 4px; }
.mrep__acts { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
.mrep__error { color: var(--v-error-base, #e5484d); }
</style>
