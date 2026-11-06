<template>
  <div
    class="cc"
    role="status"
    data-tid="change-countdown"
  >
    <p class="cc__text">
      <b>Keep this change?</b>
      If you can still see this page, it worked. The printer goes back to how it was on its own
      in <span data-tid="change-countdown-left">{{ left }}</span> seconds unless you keep it.
    </p>
    <p
      v-if="error"
      class="cc__error"
      data-tid="change-countdown-error"
    >
      {{ error }}
    </p>
    <button
      type="button"
      class="cbtn cbtn--primary"
      :disabled="busy"
      data-tid="change-keep"
      @click="keep"
    >
      Keep this change
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CONFIRM_SECONDS, confirmNetworkChange } from '@/services/muon-cloud/ownerNetwork'

/**
 * The 90 second confirm-or-revert countdown after a change that can drop the
 * link. A parent shows it only when `confirmRouteSupported()` (KAN-1565).
 */
@Component
export default class ChangeCountdown extends Vue {
  @Prop({ type: Number, default: CONFIRM_SECONDS }) readonly seconds!: number

  left = CONFIRM_SECONDS
  busy = false
  error = ''
  private timer: ReturnType<typeof setInterval> | null = null

  mounted () {
    this.left = this.seconds
    this.timer = setInterval(() => {
      this.left = Math.max(0, this.left - 1)
      if (this.left === 0) {
        this.stop()
        this.$emit('expired')
      }
    }, 1000)
  }

  beforeDestroy () {
    this.stop()
  }

  private stop () {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async keep () {
    this.busy = true
    this.error = ''
    try {
      await confirmNetworkChange()
      this.stop()
      this.$emit('kept')
    } catch (e) {
      this.error = (e as Error).message
    }
    this.busy = false
  }
}
</script>

<style lang="scss" scoped>
  .cc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
  }

  .cc__text,
  .cc__error {
    margin: 0;
  }

  .cc__error {
    color: var(--m3d-danger);
  }
</style>
