<template>
  <div
    class="ons"
    data-tid="owner-network-settings"
  >
    <button
      type="button"
      class="ons__toggle"
      :aria-expanded="open ? 'true' : 'false'"
      data-tid="owner-network-toggle"
      @click="open = !open"
    >
      <span>Who can change the network</span>
      <span aria-hidden="true">{{ open ? '−' : '+' }}</span>
    </button>

    <div
      v-if="open"
      class="ons__body"
    >
      <p class="ons__note">
        Choose how this printer's Wi-Fi and hotspot may be changed, depending on how you are connected to it.
      </p>
      <p
        v-if="readOnly"
        class="ons__note ons__note--lock"
        data-tid="owner-network-readonly"
      >
        You are connected over the internet, so these can only be changed from Bluetooth or from the printer's own network.
      </p>

      <label
        v-for="row in rows"
        :key="row.key"
        class="ons__row"
      >
        <span class="ons__label">
          {{ row.label }}
          <small v-if="currentKey === row.key">You are here</small>
        </span>
        <select
          :value="settings[row.key]"
          :disabled="readOnly || saving"
          :data-tid="`owner-network-${row.key}`"
          @change="pick(row.key, $event)"
        >
          <option
            v-for="choice in choices"
            :key="choice.value"
            :value="choice.value"
          >
            {{ choice.label }}
          </option>
        </select>
      </label>

      <p
        v-if="error"
        class="ons__error"
        role="alert"
        data-tid="owner-network-error"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { useOwnerNetwork } from '@/services/muon-cloud/useOwnerNetwork'
import { networkErrorOf, type NetworkRule, type NetworkSettings } from '@/services/muon-cloud/ownerNetwork'

type RuleKey = 'fromBle' | 'fromLocal' | 'fromRelay'

/**
 * The owner's three rules, behind a "Who can change the network" expander.
 * Rendered only when the owner routes answered (see useOwnerNetwork).
 */
@Component
export default class OwnerNetworkSettings extends Vue {
  owner = useOwnerNetwork()
  open = false
  saving = false
  error = ''

  readonly rows: Array<{ key: RuleKey, label: string }> = [
    { key: 'fromBle', label: 'Over Bluetooth' },
    { key: 'fromLocal', label: 'On the same network' },
    { key: 'fromRelay', label: 'Over the internet' }
  ]

  readonly choices: Array<{ value: NetworkRule, label: string }> = [
    { value: 'allow', label: 'Allow' },
    { value: 'reauth', label: 'Ask me to sign in again' },
    { value: 'deny', label: 'Block' }
  ]

  get settings (): NetworkSettings {
    return this.owner.network.settings as NetworkSettings
  }

  get readOnly (): boolean {
    return this.owner.network.rulesReadOnly
  }

  /** Which row is the connection this page is using. */
  get currentKey (): RuleKey | null {
    switch (this.owner.network.currentPath) {
      case 'ble': return 'fromBle'
      case 'local': return 'fromLocal'
      case 'relay':
      case 'direct_wan': return 'fromRelay'
      default: return null
    }
  }

  pick (key: RuleKey, event: Event) {
    return this.choose(key, (event.target as HTMLSelectElement).value as NetworkRule)
  }

  async choose (key: RuleKey, value: NetworkRule) {
    if (this.readOnly || value === this.settings[key]) return
    this.saving = true
    this.error = ''
    try {
      await this.owner.save({ [key]: value })
    } catch (e) {
      this.error = networkErrorOf(e).message
      // Put the select back on the rule that is still in force.
      this.$forceUpdate()
    }
    this.saving = false
  }
}
</script>

<style lang="scss" scoped>
  .ons {
    border-top: 1px solid var(--m3d-border);
    padding-top: 10px;
  }

  .ons__toggle {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
  }

  .ons__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 6px;
  }

  .ons__note,
  .ons__error {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .ons__note--lock {
    color: var(--m3d-text);
  }

  .ons__error {
    color: var(--m3d-danger);
  }

  .ons__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }

  .ons__label small {
    display: block;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .ons__row select {
    max-width: 55%;
    padding: 8px 10px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;

    &:disabled {
      opacity: 0.55;
    }
  }
</style>
