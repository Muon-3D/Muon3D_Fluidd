<template>
  <div
    class="ohr"
    data-tid="owner-hotspot"
  >
    <p
      v-if="notice"
      class="ohr__notice"
      role="status"
      data-tid="owner-hotspot-notice"
    >
      {{ notice }}
    </p>

    <template v-else>
      <p class="ohr__note">
        Change the hotspot's name or password. The printer may ask someone to approve it on its screen.
      </p>

      <form
        v-if="!waiting"
        class="ohr__form"
        @submit.prevent="ask"
      >
        <label class="ohr__field">
          <span>New name</span>
          <input
            v-model="ssid"
            type="text"
            autocomplete="off"
            placeholder="Leave empty to keep the name"
            data-tid="owner-hotspot-ssid"
          >
        </label>
        <p
          v-if="ssidProblem"
          class="ohr__error"
          data-tid="owner-hotspot-ssid-problem"
        >
          {{ ssidProblem }}
        </p>
        <label class="ohr__check">
          <input
            v-model="generate"
            type="checkbox"
            data-tid="owner-hotspot-generate"
          >
          <span>Let the printer make a new password</span>
        </label>
        <label
          v-if="!generate"
          class="ohr__field"
        >
          <span>New password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="Leave empty to keep the password"
            data-tid="owner-hotspot-password"
          >
        </label>
        <p
          v-if="passwordProblem"
          class="ohr__error"
          data-tid="owner-hotspot-password-problem"
        >
          {{ passwordProblem }}
        </p>
        <button
          type="submit"
          class="cbtn cbtn--primary"
          :disabled="!canAsk"
          data-tid="owner-hotspot-ask"
        >
          Change the hotspot
        </button>
      </form>

      <div
        v-if="warning && !waiting"
        class="ohr__confirm"
        :class="{ 'ohr__confirm--warn': warning.level === 'warn' }"
        role="group"
        aria-label="Confirm the change"
        data-tid="owner-hotspot-confirm"
      >
        <h3>{{ warning.title }}</h3>
        <p data-tid="owner-hotspot-warning">
          {{ warning.message }}
        </p>
        <div class="ohr__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="busy"
            data-tid="owner-hotspot-cancel"
            @click="warning = null"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="busy"
            data-tid="owner-hotspot-proceed"
            @click="send"
          >
            Ask the printer
          </button>
        </div>
      </div>

      <p
        v-if="waiting"
        class="ohr__waiting"
        role="status"
        data-tid="owner-hotspot-waiting"
      >
        <template v-if="approvalRequired">
          <b>Press the knob on the printer to approve.</b>
          Nothing changes until someone does.
        </template>
        <template v-else>
          Applying the change…
        </template>
      </p>

      <p
        v-if="outcome"
        class="ohr__note"
        role="status"
        data-tid="owner-hotspot-outcome"
      >
        {{ outcome }}
      </p>
      <p
        v-if="error"
        class="ohr__error"
        role="alert"
        data-tid="owner-hotspot-error"
      >
        {{ error }}
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { useHotspotCheck } from '@/aux_api/useHotspotCheck'
import { useOwnerNetwork } from '@/services/muon-cloud/useOwnerNetwork'
import {
  describeHotspotOutcome,
  HOTSPOT_POLL_MS,
  passwordProblemOf,
  ssidProblemOf,
  hotspotChange,
  hotspotChangeState,
  networkErrorOf,
  warningFor,
  type ChangeWarning,
  type HotspotChange,
  type NetworkErrorKind
} from '@/services/muon-cloud/ownerNetwork'

const { onHotspot } = useHotspotCheck()

@Component
export default class OwnerHotspotRemote extends Vue {
  owner = useOwnerNetwork()
  ssid = ''
  password = ''
  generate = false
  warning: ChangeWarning | null = null
  busy = false
  waiting = false
  approvalRequired = false
  blocked: NetworkErrorKind | null = null
  outcome = ''
  error = ''
  private disposed = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private challengeId = ''

  beforeDestroy () {
    this.disposed = true
    this.password = ''
    this.stopPolling()
  }

  get notice (): string {
    if (this.blocked === 'reauth_required') {
      return this.owner.network.currentPath === 'relay' || this.owner.network.currentPath === 'direct_wan'
        ? 'Sign in again required to change the hotspot over the internet.'
        : 'Sign in again required to change the hotspot from here.'
    }
    if (this.blocked === 'path_disabled') return 'Blocked in your network settings.'
    return ''
  }

  get ssidProblem (): string {
    return ssidProblemOf(this.ssid)
  }

  get passwordProblem (): string {
    return this.generate ? '' : passwordProblemOf(this.password)
  }

  get change (): HotspotChange {
    const change: HotspotChange = {}
    if (this.ssid) change.ssid = this.ssid
    if (this.generate) change.generate = true
    else if (this.password) change.password = this.password
    return change
  }

  get canAsk (): boolean {
    return Object.keys(this.change).length > 0 && !this.ssidProblem && !this.passwordProblem && !this.busy
  }

  async ask () {
    if (!this.canAsk) return
    this.error = ''
    this.outcome = ''
    // The connection can move between Bluetooth, the network and the internet.
    await this.owner.detect(true)
    this.warning = warningFor({
      kind: 'hotspot_change',
      path: this.owner.network.currentPath ?? 'relay',
      onHotspot: onHotspot.value
    })
  }

  async send () {
    if (this.busy) return
    this.busy = true
    this.error = ''
    try {
      const challenge = await hotspotChange(this.change)
      if (this.disposed) return
      this.challengeId = challenge.id
      this.warning = null
      this.waiting = true
      this.approvalRequired = false
      // The password is never kept past the request.
      this.password = ''
      this.poll(challenge.expiresAt)
    } catch (e) {
      this.handle(e)
    }
    this.busy = false
  }

  private poll (expiresAt: number | null) {
    this.timer = setTimeout(async () => {
      if (this.disposed) return
      try {
        const state = await hotspotChangeState(this.challengeId)
        if (this.disposed) return
        if (state === 'waiting') {
          this.approvalRequired = true
          // The printer says "expired" itself; this only stops asking if it never does.
          if (expiresAt !== null && Date.now() / 1000 > expiresAt + 30) return this.settle('expired')
          return this.poll(expiresAt)
        }
        this.settle(state)
      } catch (e) {
        if (this.disposed) return
        const err = networkErrorOf(e)
        // A dropped link or a slow printer is not an answer: keep asking.
        if (err.kind === 'failed' || err.kind === 'aux_timeout' || err.kind === 'aux_unavailable') return this.poll(expiresAt)
        this.waiting = false
        this.handle(e)
      }
    }, HOTSPOT_POLL_MS)
  }

  private settle (state: Parameters<typeof describeHotspotOutcome>[0]) {
    this.waiting = false
    this.outcome = describeHotspotOutcome(state)
    this.ssid = ''
    this.generate = false
  }

  private stopPolling () {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private handle (e: unknown) {
    if (this.disposed) return
    const err = networkErrorOf(e)
    if (err.kind === 'reauth_required' || err.kind === 'path_disabled') {
      this.blocked = err.kind
      this.warning = null
      return
    }
    this.error = err.message
    this.warning = null
  }
}
</script>

<style lang="scss" scoped>
  .ohr {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ohr__note,
  .ohr__error,
  .ohr__notice,
  .ohr__waiting {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .ohr__notice,
  .ohr__waiting {
    padding: 12px 14px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .ohr__error {
    color: var(--m3d-danger);
  }

  .ohr__form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ohr__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--m3d-text-muted);

    input {
      padding: 10px 12px;
      border: 1px solid var(--m3d-border-strong);
      border-radius: 10px;
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
      font-size: 14px;
    }
  }

  .ohr__check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .ohr__confirm {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 14px;
    background: var(--m3d-surface-2);

    h3 {
      margin: 0;
      font-size: 15px;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .ohr__confirm--warn {
    border-color: var(--m3d-warning);
  }

  .ohr__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
