<template>
  <div
    v-if="reason || dropped"
    class="ble-fallback"
    role="status"
    aria-live="polite"
    data-tid="bluetooth-fallback"
  >
    <frame-icon
      name="wifi"
      class="ble-fallback__icon"
    />
    <div class="ble-fallback__text">
      <template v-if="dropped">
        <strong>Bluetooth dropped</strong>
        <span>{{ dropped }} Reconnect, or choose how to connect.</span>
      </template>
      <template v-else>
        <strong>Bluetooth didn't connect, using Muon3D instead</strong>
        <span>{{ reason }}</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { bluetoothDropped, bluetoothFellBack } from '@/services/muon-ble/link'

/**
 * Over the page when a printer opened through Muon3D though Bluetooth was
 * chosen (KAN-1396): the session is real, but it is not the route the person
 * asked for, so it says so rather than switching quietly.
 */
@Component({})
export default class BluetoothFallbackBanner extends Vue {
  get reason (): string | null {
    const id = cloudState.activePrinterId
    return id ? bluetoothFellBack(id) : null
  }

  /** The chosen Bluetooth route dropped mid-session (KAN-1913): never switched quietly. */
  get dropped (): string | null {
    const id = cloudState.activePrinterId
    return id ? bluetoothDropped(id) : null
  }
}
</script>

<style lang="scss" scoped>
  .ble-fallback {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 16px;
    border-radius: 16px;
    color: var(--m3d-text);
    background: color-mix(in srgb, var(--m3d-warning) 16%, var(--m3d-surface));
  }

  .ble-fallback__icon {
    flex: none;
    color: var(--m3d-warning);
  }

  .ble-fallback__text {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    min-width: 0;
    font-size: 14px;

    span {
      color: var(--m3d-text-muted);
    }
  }
</style>
