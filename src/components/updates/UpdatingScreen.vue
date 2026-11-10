<template>
  <div
    class="upd"
    :class="`upd--${tone}`"
    :data-tid="`updating-${stage}`"
    role="status"
    aria-live="polite"
  >
    <section class="stile upd__card">
      <header class="stile__head">
        <frame-icon
          :name="stage === 'updated' ? 'check' : tone === 'bad' ? 'alert' : 'download'"
          class="upd__ico"
        />
        <h2 class="upd__title">
          {{ headline.title }}
        </h2>
        <span
          v-if="busy"
          class="stile__aside"
        >
          <tone-pill tone="run">Step {{ stepNow }} of {{ steps.length }}</tone-pill>
        </span>
      </header>

      <div
        v-if="percent !== null"
        class="upd__big"
        data-tid="updating-percent"
      >
        {{ percent }}<small> %</small>
      </div>
      <div
        v-if="stage !== 'idle'"
        class="sbar upd__bar"
        :class="{ 'upd__bar--wait': spinning }"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="percent !== null ? percent : undefined"
        aria-label="Update progress"
      >
        <i :style="{ width: `${spinning ? 30 : Math.round(dash / 327 * 100)}%` }" />
      </div>

      <p class="upd__text">
        {{ headline.text }}
      </p>
      <p
        v-if="errorText"
        class="upd__error"
      >
        {{ errorText }}
      </p>

      <ol
        v-if="stage !== 'idle'"
        class="slist upd__steps"
      >
        <li
          v-for="(s, n) in steps"
          :key="s.id"
          class="srow"
          :class="`upd__step--${s.state}`"
        >
          <span class="upd__st">
            <frame-icon
              v-if="s.state === 'done'"
              name="check"
              small
            />
            <span
              v-else-if="s.state === 'now'"
              class="upd__dot"
            />
            <template v-else>{{ n + 1 }}</template>
          </span>
          <span class="srow__text">
            <span class="srow__t">{{ s.label }}</span>
          </span>
          <span class="srow__v">{{ s.state === 'done' ? 'Done' : s.state === 'now' ? 'Now' : 'Waiting' }}</span>
        </li>
      </ol>

      <p
        v-if="fromText || toText"
        class="upd__versions"
      >
        <span v-if="fromText">{{ fromText }}</span>
        <frame-icon
          v-if="fromText && toText"
          name="chevronRight"
          small
        />
        <b v-if="toText">{{ toText }}</b>
      </p>

      <div
        v-if="busy"
        class="scallout"
        data-tid="updating-warning"
      >
        <frame-icon name="alert" />
        <div>
          <b>Do not power off.</b> The printer restarts once by itself near the end. Prints cannot start until it is done.
        </div>
      </div>

      <div class="upd__actions">
        <button
          v-if="stage === 'updated'"
          type="button"
          class="cbtn cbtn--primary"
          data-tid="updating-reload"
          @click="reload"
        >
          Reload
        </button>
        <button
          v-if="tone === 'bad' || stage === 'updated'"
          type="button"
          class="cbtn"
          data-tid="updating-done"
          @click="done"
        >
          Back to {{ printerName }}
        </button>
        <button
          v-if="canLeave"
          type="button"
          class="cbtn cbtn--ghost"
          data-tid="updating-leave"
          @click="leave"
        >
          <frame-icon
            name="home"
            small
          />
          Back to Overview
        </button>
        <span
          v-if="offline"
          class="upd__waiting"
        >Waiting for {{ printerName }}…</span>
      </div>
      <p
        v-if="canLeave && busy"
        class="stile__note"
      >
        You can leave this page: the update keeps going, and the bar at the top shows it.
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import TonePill from '@/components/printers/TonePill.vue'
import { updateHeadline, updateSteps, versionLabel, type SessionPhase, type UpdateStep } from '@/services/updates/model'
import { currentOutcome, forgetInstall, updateWatch } from '@/services/updates/watch'

type Stage = SessionPhase | 'offline' | 'late'

/**
 * The printer updating, from the press to the outcome: the new version
 * being written (with its progress), the restart (while the printer can't
 * answer, with no progress to show), the check that it works, and how it
 * ended. The connection screens show it while the printer restarts; it is
 * also the page an install opens, where it sits inside the frame (the sidebar
 * and top bar still work) and leaves the page open to go back: the update
 * keeps going without it.
 */
@Component({ components: { TonePill } })
export default class UpdatingScreen extends Vue {
  /** Shown because the printer can't be reached: 'updating', or 'updating-late' past its budget. */
  @Prop({ type: String, default: null })
  readonly offlineState!: 'updating' | 'updating-late' | null

  @Prop({ type: String, default: 'the printer' })
  readonly printerName!: string

  /** On the page (not the restart screen): offers a way back to Overview, without ending the install. */
  @Prop({ type: Boolean, default: false })
  readonly canLeave!: boolean

  get remembered () {
    return updateWatch.remembered
  }

  get offline (): boolean {
    return !!this.offlineState
  }

  get stage (): Stage {
    if (this.offlineState === 'updating-late') return 'late'
    if (this.offlineState === 'updating') return 'offline'
    return currentOutcome() ?? this.remembered?.phase ?? 'idle'
  }

  get tone (): 'busy' | 'good' | 'bad' | 'late' {
    if (this.stage === 'updated') return 'good'
    if (this.stage === 'rolled_back' || this.stage === 'failed') return 'bad'
    if (this.stage === 'late') return 'late'
    return 'busy'
  }

  get percent (): number | null {
    const p = this.stage === 'installing' ? this.remembered?.progress ?? updateWatch.status?.progress ?? null : null
    return typeof p === 'number' ? Math.max(0, Math.min(100, Math.round(p))) : null
  }

  get spinning (): boolean {
    return this.tone === 'busy' && this.percent === null
  }

  /** The arc: the progress while writing, a turning quarter otherwise, a full ring at the end. */
  get dash (): number {
    if (this.tone === 'good' || this.tone === 'bad') return 327
    if (this.percent !== null) return 327 * this.percent / 100
    return 82
  }

  get headline () {
    return updateHeadline(this.stage, this.percent, this.remembered?.to ?? null)
  }

  get steps (): UpdateStep[] {
    return updateSteps(this.stage)
  }

  get errorText (): string {
    if (this.tone !== 'bad') return ''
    return updateWatch.status?.session?.error?.message ?? ''
  }

  get fromText (): string {
    const v = this.remembered?.from
    return v ? versionLabel(v).text : ''
  }

  get toText (): string {
    const v = this.remembered?.to
    return v ? versionLabel(v).text : ''
  }

  /** The printer serves the new version's Fluidd too: load it. */
  reload () {
    forgetInstall()
    window.location.reload()
  }

  /** Which of the steps it is on, for "Step 2 of 4". */
  get stepNow (): number {
    const at = this.steps.findIndex(s => s.state === 'now')
    return at < 0 ? this.steps.length : at + 1
  }

  /** Under way: the bar moves, the warning shows. */
  get busy (): boolean {
    return this.stage !== 'idle' && (this.tone === 'busy' || this.tone === 'late')
  }

  /** Leaves the page; the update carries on, so nothing is forgotten. */
  leave () {
    this.$emit('leave')
  }

  done () {
    forgetInstall()
    this.$emit('done')
  }
}
</script>

<style lang="scss" scoped>
  .upd {
    display: flex;
    justify-content: center;
    padding: 24px 16px;
  }

  .upd__card {
    width: 100%;
    max-width: 620px;
  }

  .upd__ico {
    color: var(--m3d-accent) !important;
  }

  .upd--good .upd__ico {
    color: var(--m3d-success, #57c08a) !important;
  }

  .upd--bad .upd__ico {
    color: var(--m3d-danger, #e5534b) !important;
  }

  .upd--late .upd__ico {
    color: var(--m3d-warning, #e8963c) !important;
  }

  .upd__title {
    font-size: 18px;
  }

  .upd__big {
    font-size: 40px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;

    small {
      color: var(--m3d-text-muted);
      font-size: 18px;
      font-weight: 500;
    }
  }

  .upd__bar {
    height: 8px;

    i {
      transition: width 0.6s var(--m3d-ease, ease);
    }
  }

  .upd__bar--wait i {
    animation: upd-slide 1.6s ease-in-out infinite alternate;
  }

  .upd--good .upd__bar i {
    background: var(--m3d-success, #57c08a);
  }

  .upd--bad .upd__bar i {
    background: var(--m3d-danger, #e5534b);
  }

  .upd--late .upd__bar i {
    background: var(--m3d-warning, #e8963c);
  }

  @keyframes upd-slide {
    from { transform: translateX(0); }
    to { transform: translateX(233%); }
  }

  .upd__text {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .upd__error {
    margin: 0;
    color: var(--m3d-danger) !important;
    font-size: 14px;
  }

  .upd__steps {
    margin: 0;
    padding: 4px 14px;
    border-radius: 16px;
    background: var(--m3d-surface-2) !important;
    list-style: none;

    .srow {
      min-height: 48px;
      padding-right: 0;
      padding-left: 0;
    }

    .srow__v {
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 500;
    }
  }

  .upd__st {
    display: grid;
    flex: none;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--m3d-surface);
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-weight: 700;
  }

  .upd__step--done .upd__st {
    background: color-mix(in srgb, var(--m3d-success, #57c08a) 16%, transparent);
    color: var(--m3d-success, #57c08a);
  }

  .upd__step--now {
    .upd__st {
      background: var(--m3d-accent-soft);
    }

    .srow__v {
      color: var(--m3d-accent);
    }
  }

  .upd__step--next .srow__t {
    color: var(--m3d-text-muted);
  }

  .upd__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-accent);
    animation: upd-pulse 1.2s ease-in-out infinite;
  }

  @keyframes upd-pulse {
    50% { opacity: 0.35; }
  }

  .upd__versions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .upd__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .upd__waiting {
    align-self: center;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  :root.m3d-reduced-motion {
    .upd__bar--wait i,
    .upd__dot {
      animation: none;
    }
  }
</style>
