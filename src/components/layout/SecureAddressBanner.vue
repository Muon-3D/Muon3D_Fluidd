<template>
  <div
    v-if="origin && !dismissed"
    class="secure-address"
    role="status"
    aria-live="polite"
    data-tid="secure-address"
  >
    <frame-icon
      name="lock"
      class="secure-address__icon"
    />
    <div class="secure-address__text">
      <strong>A secure address is available for this printer</strong>
      <span>Same page, encrypted. Your browser shows a lock.</span>
    </div>
    <span class="secure-address__actions">
      <app-btn
        small
        color="primary"
        data-tid="secure-address-switch"
        @click="go"
      >
        Switch
      </app-btn>
      <app-btn
        small
        text
        data-tid="secure-address-stay"
        @click="stay"
      >
        Stay here
      </app-btn>
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import {
  asksToStay,
  couldHaveSecureAddress,
  declinedSwitch,
  findSecureOrigin,
  secureUrl,
  setSwitchesAutomatically,
  switchDecision,
  switchesAutomatically
} from '@/services/secure-origin'

/**
 * On the printer's plain-HTTP page, once this browser has proved that the
 * printer's secure address answers (KAN-2198): one calm line offering to move
 * there. A browser moves by itself unless a person chose "stay here" (KAN-5110), but only when
 * the proof came soon after load and no upload is running, and never once `?secure=off` was used.
 * Nothing shows, and nothing is asked of the network, on any other page.
 */
@Component({})
export default class SecureAddressBanner extends Vue {
  origin: string | null = null
  dismissed = false
  gone = false

  async created () {
    if (!couldHaveSecureAddress()) return
    if (asksToStay()) {
      setSwitchesAutomatically(false)
      return
    }
    if (declinedSwitch()) return
    const started = Date.now()
    const origin = await findSecureOrigin()
    // The app may have replaced this banner while the probes ran.
    if (!origin || this.gone) return
    const uploads: { complete?: boolean, cancelled?: boolean }[] = this.$store?.state?.files?.uploads ?? []
    const busy = uploads.some(u => !u.complete && !u.cancelled)
    if (switchDecision({ auto: switchesAutomatically(), elapsedMs: Date.now() - started, busy }) === 'switch') {
      // Same tab, and only an origin the probe just proved.
      window.location.replace(secureUrl(origin))
      return
    }
    this.origin = origin
  }

  beforeDestroy () {
    this.gone = true
  }

  go () {
    if (!this.origin) return
    setSwitchesAutomatically(true)
    window.location.assign(secureUrl(this.origin))
  }

  stay () {
    setSwitchesAutomatically(false)
    this.dismissed = true
  }
}
</script>

<style lang="scss" scoped>
  .secure-address {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 16px;
    border-radius: 16px;
    color: var(--m3d-text);
    background: var(--m3d-surface);
  }

  .secure-address__icon {
    flex: none;
    color: var(--m3d-text-muted);
  }

  .secure-address__text {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 2px 10px;
    min-width: 0;
    font-size: 14px;

    span {
      color: var(--m3d-text-muted);
    }
  }

  .secure-address__actions {
    display: flex;
    flex: none;
    gap: 8px;
  }
</style>
