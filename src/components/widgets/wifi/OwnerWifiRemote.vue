<template>
  <div
    class="owr"
    data-tid="owner-wifi"
  >
    <p
      v-if="notice"
      class="owr__notice"
      role="status"
      data-tid="owner-wifi-notice"
    >
      {{ notice }}
    </p>

    <template v-else>
      <header class="owr__head">
        <p class="owr__note">
          {{ current ? `On ${current.ssid} · signal ${current.signal}%` : 'Not on a Wi-Fi network' }}
        </p>
        <button
          type="button"
          class="owr__refresh"
          :disabled="loading || !!pending"
          data-tid="owner-wifi-refresh"
          @click="load"
        >
          Look again
        </button>
      </header>

      <p
        v-if="loading && !rows.length"
        class="owr__note"
      >
        Asking the printer for its networks…
      </p>

      <div
        v-if="rows.length"
        class="owr__list"
        data-tid="owner-wifi-list"
      >
        <div
          v-for="row in rows"
          :key="row.ssid"
          class="owr__row"
          :data-ssid="row.ssid"
        >
          <span class="owr__name">
            <b>{{ row.ssid }}</b>
            <span>{{ row.state }}</span>
          </span>
          <span class="owr__actions">
            <button
              v-if="!row.inUse"
              type="button"
              class="owr__link"
              :disabled="!!pending"
              @click="ask('wifi_connect', row.ssid)"
            >
              Connect
            </button>
            <button
              v-if="row.saved"
              type="button"
              class="owr__link owr__link--danger"
              :disabled="!!pending"
              @click="ask('wifi_forget', row.ssid)"
            >
              Forget
            </button>
          </span>
        </div>
      </div>

      <div
        v-if="pending"
        class="owr__confirm"
        :class="{ 'owr__confirm--warn': pending.warning.level === 'warn' }"
        role="group"
        aria-label="Confirm the change"
        data-tid="owner-wifi-confirm"
      >
        <h3 data-tid="owner-wifi-warning-title">
          {{ pending.warning.title }}
        </h3>
        <p data-tid="owner-wifi-warning">
          {{ pending.warning.message }}
        </p>
        <input
          v-if="pending.needsPassword"
          v-model="password"
          type="password"
          class="owr__input"
          autocomplete="off"
          aria-label="Wi-Fi password"
          placeholder="Wi-Fi password"
          data-tid="owner-wifi-password"
          @keyup.enter="proceed"
        >
        <div class="owr__buttons">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="busy"
            data-tid="owner-wifi-cancel"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="busy || (pending.needsPassword && !password)"
            data-tid="owner-wifi-proceed"
            @click="proceed"
          >
            {{ pending.kind === 'wifi_forget' ? 'Forget it' : 'Connect' }}
          </button>
        </div>
      </div>

      <p
        v-if="message"
        class="owr__note"
        role="status"
        data-tid="owner-wifi-message"
      >
        {{ message }}
      </p>
      <p
        v-if="error"
        class="owr__error"
        role="alert"
        data-tid="owner-wifi-error"
      >
        {{ error }}
      </p>

      <change-countdown
        v-if="countdown"
        @kept="onCountdownEnd('Kept. The change is permanent.')"
        @expired="onCountdownEnd('Time is up. The printer is going back to how it was.')"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ChangeCountdown from './ChangeCountdown.vue'
import { useHotspotCheck } from '@/aux_api/useHotspotCheck'
import { useOwnerNetwork } from '@/services/muon-cloud/useOwnerNetwork'
import {
  confirmRouteSupported,
  networkErrorOf,
  warningFor,
  wifiConnect,
  wifiCurrent,
  wifiForget,
  wifiSaved,
  wifiScan,
  type ChangeWarning,
  type NetworkErrorKind,
  type NetworkPath,
  type RemoteWifiNetwork
} from '@/services/muon-cloud/ownerNetwork'

const { onHotspot } = useHotspotCheck()

interface Pending {
  kind: 'wifi_connect' | 'wifi_forget';
  ssid: string;
  warning: ChangeWarning;
  needsPassword: boolean;
}

/**
 * Wi-Fi for the printer's owner over the connection to the printer, when the
 * printer's own Aux API is closed to this page (KAN-1565). Lists, joins and
 * forgets through `/muon-link/network/wifi/*`, warning first when the change
 * could cut the connection in use.
 */
@Component({ components: { ChangeCountdown } })
export default class OwnerWifiRemote extends Vue {
  owner = useOwnerNetwork()
  networks: RemoteWifiNetwork[] = []
  savedNames: string[] = []
  current: { ssid: string, signal: number } | null = null
  loading = false
  busy = false
  blocked: NetworkErrorKind | null = null
  pending: Pending | null = null
  password = ''
  message = ''
  error = ''
  countdown = false

  mounted () {
    this.load()
  }

  get path (): NetworkPath {
    return this.owner.network.currentPath ?? 'relay'
  }

  /** What to say instead of the list: sign in again, or blocked. */
  get notice (): string {
    if (this.blocked === 'reauth_required') {
      return this.path === 'relay' || this.path === 'direct_wan'
        ? 'Sign in again required to change Wi-Fi over the internet.'
        : 'Sign in again required to change Wi-Fi from here.'
    }
    if (this.blocked === 'path_disabled') return 'Blocked in your network settings.'
    return ''
  }

  get rows () {
    const saved = new Set(this.savedNames)
    const currentSsid = this.current?.ssid
    const byName = new Map<string, { ssid: string, inUse: boolean, saved: boolean, secured: boolean, state: string, signal: number }>()
    for (const n of this.networks) {
      const inUse = n.inUse || n.ssid === currentSsid
      byName.set(n.ssid, {
        ssid: n.ssid,
        inUse,
        saved: saved.has(n.ssid),
        secured: n.secured,
        signal: n.signal,
        state: inUse ? 'Connected' : saved.has(n.ssid) ? 'Saved · joins without a password' : n.secured ? 'Needs a password' : 'Open'
      })
    }
    // Saved networks the printer cannot hear from where it is still need a Forget.
    for (const name of saved) {
      if (!byName.has(name)) {
        byName.set(name, { ssid: name, inUse: name === currentSsid, saved: true, secured: true, signal: 0, state: name === currentSsid ? 'Connected' : 'Saved · out of range' })
      }
    }
    return [...byName.values()].sort((a, b) => Number(b.inUse) - Number(a.inUse) || b.signal - a.signal)
  }

  async load () {
    this.loading = true
    this.error = ''
    try {
      const [networks, saved, current] = await Promise.all([wifiScan(), wifiSaved(), wifiCurrent()])
      this.networks = networks
      this.savedNames = saved
      this.current = current
      this.blocked = null
    } catch (e) {
      this.handle(e)
    }
    this.loading = false
  }

  private handle (e: unknown) {
    const err = networkErrorOf(e)
    if (err.kind === 'reauth_required' || err.kind === 'path_disabled') {
      this.blocked = err.kind
      this.pending = null
      return
    }
    this.error = err.message
  }

  /** Check which path this connection is on now, then say what the change risks. */
  async ask (kind: Pending['kind'], ssid: string) {
    this.message = ''
    this.error = ''
    this.password = ''
    // The connection can move between Bluetooth, the network and the internet.
    await this.owner.detect(true)
    const row = this.rows.find(r => r.ssid === ssid)
    this.pending = {
      kind,
      ssid,
      needsPassword: kind === 'wifi_connect' && !!row && row.secured && !row.saved,
      warning: warningFor({
        kind,
        path: this.path,
        onHotspot: onHotspot.value,
        isCurrentNetwork: ssid === this.current?.ssid
      })
    }
  }

  cancel () {
    this.pending = null
    this.password = ''
  }

  async proceed () {
    const pending = this.pending
    if (!pending || this.busy) return
    this.busy = true
    this.error = ''
    try {
      if (pending.kind === 'wifi_connect') {
        const outcome = await wifiConnect(pending.ssid, this.password || undefined)
        this.message = outcome.restored
          ? `Couldn't join ${pending.ssid}, so the printer went back to its old network.`
          : `Joining ${pending.ssid}…`
        this.countdown = !outcome.restored && pending.warning.mayDropLink && confirmRouteSupported()
      } else {
        await wifiForget(pending.ssid)
        this.message = `Forgot ${pending.ssid}.`
        this.countdown = pending.warning.mayDropLink && confirmRouteSupported()
      }
      this.pending = null
      await this.load()
    } catch (e) {
      this.handle(e)
    }
    this.password = ''
    this.busy = false
  }

  onCountdownEnd (message: string) {
    this.countdown = false
    this.message = message
  }
}
</script>

<style lang="scss" scoped>
  .owr {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .owr__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .owr__note,
  .owr__error,
  .owr__notice {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .owr__notice {
    padding: 12px 14px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .owr__error {
    color: var(--m3d-danger);
  }

  .owr__refresh,
  .owr__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
    }
  }

  .owr__link--danger {
    color: var(--m3d-danger);
  }

  .owr__list {
    display: flex;
    flex-direction: column;

    > .owr__row + .owr__row {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .owr__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 52px;
  }

  .owr__name {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 15px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .owr__actions {
    display: inline-flex;
    flex: none;
    gap: 14px;
  }

  .owr__confirm {
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

  .owr__confirm--warn {
    border-color: var(--m3d-warning);
  }

  .owr__input {
    padding: 10px 12px;
    border: 1px solid var(--m3d-border-strong);
    border-radius: 10px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font-size: 14px;
  }

  .owr__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
