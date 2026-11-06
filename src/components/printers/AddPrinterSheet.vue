<template>
  <v-dialog
    :value="value"
    max-width="480"
    :fullscreen="$vuetify.breakpoint.xsOnly"
    @input="$emit('input', $event)"
  >
    <div
      class="sheet"
      data-tid="add-printer-sheet"
    >
      <div class="sheet__head">
        <h2 class="sheet__title">
          Add a printer
        </h2>
        <button
          type="button"
          class="sheet__close"
          aria-label="Close"
          @click="$emit('input', false)"
        >
          <frame-icon name="x" />
        </button>
      </div>
      <p class="sheet__lead">
        Three ways to find it. Pick the one that matches where the printer is.
      </p>

      <div class="sheet__ways">
        <div
          v-if="bluetoothSearch && !bluetoothOff"
          class="sway"
        >
          <span class="sway__icon"><frame-icon name="bluetooth" /></span>
          <div class="sway__text">
            <span class="sway__title">Over Bluetooth</span>
            <span class="sway__about">A new printer, or one that is close. Turn it on and keep it near.</span>
          </div>
          <button
            type="button"
            class="sbtn sbtn--primary"
            data-tid="look-nearby"
            @click="$emit('look-nearby')"
          >
            Look nearby
          </button>
        </div>

        <div class="sway">
          <span class="sway__icon"><frame-icon name="wifi" /></span>
          <div class="sway__text">
            <span class="sway__title">On this network</span>
            <span class="sway__about">
              <template v-if="found">{{ found }} found. It's listed on the page, under Found on this network.</template>
              <template v-else-if="searching">Looking{{ network ? ` on ${network}` : '' }}…</template>
              <template v-else>Nothing new found yet.</template>
            </span>
          </div>
          <button
            type="button"
            class="sbtn"
            :disabled="searching"
            data-tid="search-again"
            @click="$emit('rescan')"
          >
            Search again
          </button>
        </div>

        <div class="sway">
          <span class="sway__icon"><frame-icon name="search" /></span>
          <div class="sway__text">
            <span class="sway__title">By its address</span>
            <span class="sway__about">It's on the printer's screen, such as muon-boxwood-367a.local or 192.168.1.20.</span>
          </div>
          <button
            type="button"
            class="sbtn"
            data-tid="enter-address"
            @click="$emit('address')"
          >
            Add by address
          </button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * Add printer (v3): one sheet with the ways in, so the page itself has one
 * primary button. Bluetooth, this network, or an address.
 */
@Component({})
export default class AddPrinterSheet extends Vue {
  @Prop({ type: Boolean })
  readonly value?: boolean

  @Prop({ type: Boolean })
  readonly bluetoothSearch?: boolean

  @Prop({ type: Boolean })
  readonly bluetoothOff?: boolean

  @Prop({ type: Boolean })
  readonly searching?: boolean

  @Prop({ type: String, default: '' })
  readonly network!: string

  @Prop({ type: Number, default: 0 })
  readonly found!: number
}
</script>

<style lang="scss" scoped>
  .sheet {
    min-height: 100%;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .sheet__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sheet__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .sheet__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--m3d-text-muted);
  }

  .sheet__lead {
    margin: 4px 0 16px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .sheet__ways {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sway {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
  }

  .sway__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .sway__text {
    display: flex;
    flex: 1 1 180px;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .sway__title { font-size: 15px; font-weight: 600; }
  .sway__about { color: var(--m3d-text-muted); font-size: 13px; }

  .sbtn {
    height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--m3d-fill-strong, var(--m3d-border-strong));
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;

    &:disabled { opacity: 0.5; }
  }

  .sbtn--primary {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }
</style>
