<template>
  <section
    class="lib-surface acct-card acct-card--pad"
    aria-label="Your plan"
    data-tid="plan-summary"
  >
    <p
      v-if="reading"
      class="acct-muted"
      data-tid="plan-summary-reading"
    >
      Reading your plan…
    </p>
    <p
      v-else-if="soon"
      class="acct-muted"
      data-tid="plan-soon-note"
    >
      Your plan and credits are coming soon. Your printers work the same without them.
    </p>
    <p
      v-else-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>
    <template v-else-if="view">
      <b data-tid="plan-summary-line">{{ line }}</b>
      <span
        v-if="view.credits !== null"
        data-tid="plan-summary-credits"
      >{{ view.credits }} credits left</span>
      <span
        v-else
        class="acct-muted"
      >Credits aren't available right now.</span>
      <a
        v-if="view.link"
        class="lib-btn lib-btn--sm"
        :href="view.link"
        target="_blank"
        rel="noopener noreferrer"
        data-tid="plan-ledger"
      >See your credit history</a>
    </template>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { accountApi } from '@/services/account/api'
import { describe } from '@/services/account/state'
import { planLine, planView, type PlanView } from '@/services/account/plan-export'

/**
 * The plan the account console reports (`GET /v1/me/plan`): its name, the
 * credits left and when it renews or ends, with a link to the credit history
 * when the console gives one. A console without the route reads "coming soon".
 */
@Component
export default class AccountPlanSummary extends Vue {
  view: PlanView | null = null
  reading = true
  soon = false
  error = ''
  alive = true

  beforeDestroy () { this.alive = false }

  async created () {
    try {
      const view = planView(await accountApi.plan())
      if (this.alive) this.view = view
    } catch (error) {
      if (!this.alive) return
      const status = (error as { status?: number })?.status
      if (status === 404 || status === 405 || status === 501) this.soon = true
      else this.error = describe(error)
    } finally {
      this.reading = false
    }
  }

  get line (): string {
    return this.view ? planLine(this.view) : ''
  }
}
</script>

<style lang="scss" scoped>
  section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    font-size: 13.5px;
  }
</style>
