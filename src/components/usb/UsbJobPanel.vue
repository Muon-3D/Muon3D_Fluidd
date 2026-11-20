<template>
  <section
    class="ujob"
    :class="`ujob--${job.state}`"
    data-tid="usb-job"
    :data-state="job.state"
  >
    <header class="ujob__head">
      <b data-tid="usb-job-headline">{{ headline }}</b>
      <span
        class="ujob__pct"
        data-tid="usb-job-percent"
      >{{ percent }}%</span>
      <button
        v-if="running"
        type="button"
        class="cbtn cbtn--sm"
        :disabled="cancelling"
        data-tid="usb-job-cancel"
        @click="$emit('cancel')"
      >
        {{ cancelling ? 'Cancelling…' : 'Cancel' }}
      </button>
      <button
        v-else
        type="button"
        class="cbtn cbtn--sm"
        data-tid="usb-job-dismiss"
        @click="$emit('dismiss')"
      >
        Close
      </button>
    </header>

    <div
      class="ujob__bar"
      role="progressbar"
      aria-label="Copy progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent"
    >
      <i :style="{ width: `${percent}%` }" />
    </div>
    <p class="ujob__sub">
      {{ bytes(job.bytesDone) }} of {{ bytes(job.bytesTotal) }}
      <template v-if="running && job.current">
        · {{ leaf(job.current) }}
      </template>
    </p>

    <ul
      v-if="job.items.length"
      class="ujob__items"
      data-tid="usb-job-items"
    >
      <li
        v-for="item in job.items"
        :key="item.path"
        class="ujob__item"
        :class="`ujob__item--${item.state}`"
        data-tid="usb-job-item"
        :data-state="item.state"
      >
        <span class="ujob__name">{{ item.path }}</span>
        <span class="ujob__state">{{ stateWords(item.state) }}</span>
        <span
          v-if="item.state === 'copying' || item.state === 'done'"
          class="ujob__bytes"
        >{{ bytes(item.bytesDone) }} / {{ bytes(item.bytesTotal) }}</span>
        <span
          v-if="item.error"
          class="ujob__why"
          data-tid="usb-job-item-error"
        >{{ reason(item.error) }}</span>
        <i
          v-if="item.state === 'copying' && item.bytesTotal"
          class="ujob__mini"
        ><b :style="{ width: `${pct(item.bytesDone, item.bytesTotal)}%` }" /></i>
      </li>
    </ul>

    <ul
      v-if="extraProblems.length"
      class="ujob__items"
      data-tid="usb-job-problems"
    >
      <li
        v-for="problem in extraProblems"
        :key="`${problem.kind}-${problem.path}`"
        class="ujob__item ujob__item--failed"
      >
        <span class="ujob__name">{{ problem.path }}</span>
        <span class="ujob__why">{{ reason(problem.reason) }}</span>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { UsbJob } from '@/services/usb/types'
import { bytesWords, itemStateWords, isRunning, jobHeadline, percentOf, reasonWords } from '@/services/usb/words'

/** The copy that is running (or was last), with each file's progress and, in plain words, what went wrong with any. */
@Component
export default class UsbJobPanel extends Vue {
  @Prop({ type: Object, required: true }) readonly job!: UsbJob
  @Prop({ type: Boolean, default: false }) readonly cancelling!: boolean

  readonly bytes = bytesWords
  readonly reason = reasonWords
  readonly stateWords = itemStateWords
  readonly pct = percentOf

  get running (): boolean { return isRunning(this.job) }
  get headline (): string { return jobHeadline(this.job) }

  get percent (): number {
    if (this.job.state === 'done') return 100
    if (this.job.bytesTotal) return percentOf(this.job.bytesDone, this.job.bytesTotal)
    return percentOf(this.job.filesDone, this.job.filesTotal)
  }

  /** Skipped and failed files the item list doesn't already show (a long job carries no item list). */
  get extraProblems (): Array<{ kind: string, path: string, reason: string }> {
    const shown = new Set(this.job.items.map(i => i.path))
    return [
      ...this.job.skipped.map(p => ({ kind: 'skipped', ...p })),
      ...this.job.errors.map(p => ({ kind: 'error', ...p }))
    ].filter(p => !shown.has(p.path))
  }

  leaf (path: string): string {
    return path.split('/').pop() || path
  }
}
</script>

<style lang="scss" scoped>
  .ujob {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 18px;
    background: var(--m3d-surface);
  }

  .ujob__head {
    display: flex;
    align-items: center;
    gap: 10px;

    b {
      flex: 1;
      min-width: 0;
      font-size: 15px;
    }
  }

  .ujob__pct {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .ujob__bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-fill);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--m3d-accent);
      transition: width 0.3s ease;
    }
  }

  .ujob--failed .ujob__bar i,
  .ujob--cancelled .ujob__bar i {
    background: var(--m3d-warning);
  }

  .ujob--done .ujob__bar i {
    background: var(--m3d-success);
  }

  .ujob__sub {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .ujob__items {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 220px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .ujob__item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 10px;
    padding: 6px 8px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    font-size: 13px;
  }

  .ujob__name {
    flex: 1 1 160px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ujob__state,
  .ujob__bytes {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .ujob__why {
    flex-basis: 100%;
    color: var(--m3d-warning);
    font-size: 12px;
  }

  .ujob__item--done .ujob__state {
    color: var(--m3d-success);
  }

  .ujob__item--failed .ujob__state {
    color: var(--m3d-danger);
  }

  .ujob__mini {
    flex-basis: 100%;
    height: 3px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-fill);

    b {
      display: block;
      height: 100%;
      background: var(--m3d-accent);
    }
  }
</style>
