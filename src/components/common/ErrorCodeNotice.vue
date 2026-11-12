<template>
  <div
    class="error-notice"
    :class="`error-notice--${severity}`"
    data-tid="error-notice"
    :data-code="resolved.code || undefined"
  >
    <p class="error-notice__head">
      <b
        v-if="resolved.code"
        class="error-notice__code"
        data-tid="error-code"
      >{{ resolved.code }}</b>
      <span
        class="error-notice__short"
        data-tid="error-short"
      >{{ resolved.short }}</span>
    </p>

    <template v-if="resolved.entry">
      <details
        v-if="resolved.entry.what_to_do.length"
        class="error-notice__more"
        data-tid="error-what-to-do"
      >
        <summary>What to do</summary>
        <ol>
          <li
            v-for="(step, i) in resolved.entry.what_to_do"
            :key="i"
          >
            {{ step }}
          </li>
        </ol>
        <p v-if="resolved.entry.escalate">
          {{ resolved.entry.escalate }}
        </p>
      </details>
      <a
        v-if="docs"
        :href="docs"
        target="_blank"
        rel="noopener"
        class="error-notice__link"
        data-tid="error-docs"
      >More about {{ resolved.code }}</a>
    </template>

    <!-- Dev mode / admin: everything the device said. -->
    <pre
      v-if="showFull"
      class="error-notice__full"
      data-tid="error-full"
    >{{ resolved.full }}</pre>
    <!-- Unknown to the book: the original text is still there, under Details. -->
    <details
      v-else-if="!resolved.entry"
      class="error-notice__more"
      data-tid="error-details"
    >
      <summary>Details</summary>
      <pre class="error-notice__full">{{ safeText }}</pre>
    </details>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MuonGatesMixin from '@/mixins/muon-gates'
import { docsUrl, resolveError } from '@/services/error-codes'
import type { ResolvedError } from '@/services/error-codes'

/**
 * A failure as the user sees it (KAN-2085). A known error shows its code and
 * the book's one friendly line (with "What to do" and a docs link for public
 * entries). Dev mode and admins also see the printer's full message. Reading
 * those two states only: no gate is changed here.
 */
@Component({})
export default class ErrorCodeNotice extends Mixins(MuonGatesMixin) {
  @Prop({ type: String, default: '' })
  readonly code!: string

  @Prop({ type: String, default: '' })
  readonly message!: string

  @Prop({ type: String, default: '' })
  readonly detail!: string

  get resolved (): ResolvedError {
    return resolveError({ code: this.code, message: this.message, detail: this.detail })
  }

  get showFull (): boolean {
    return this.devModeEnabled || this.canManageAccess === true
  }

  get severity (): string {
    return this.resolved.entry?.severity ?? 'error'
  }

  get docs (): string | null {
    return docsUrl(this.resolved.entry)
  }

  /** The original text for a normal user: stack-trace lines dropped, length capped. */
  get safeText (): string {
    const lines = this.resolved.full.split('\n').filter(l => !/^\s*(at\s|File ").+/.test(l) && !/^Traceback/.test(l))
    const text = lines.join('\n').trim() || 'No further detail was reported.'
    return text.length > 400 ? `${text.slice(0, 400)}…` : text
  }
}
</script>

<style scoped>
  .error-notice__head { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: baseline; }
  .error-notice__code { font-family: ui-monospace, monospace; font-size: 12px; padding: 1px 6px; border-radius: 6px; background: var(--m3d-surface-2, rgba(128, 128, 128, 0.18)); }
  .error-notice__short { font-weight: 600; }
  .error-notice__more { margin-top: 6px; font-size: 13px; }
  .error-notice__more summary { cursor: pointer; }
  .error-notice__more ol { margin: 4px 0 4px 18px; padding: 0; }
  .error-notice__link { display: inline-block; margin-top: 6px; font-size: 13px; }
  .error-notice__full { margin: 6px 0 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; opacity: 0.85; }
</style>
