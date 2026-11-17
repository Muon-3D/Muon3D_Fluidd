<template>
  <section
    class="welcome"
    data-tid="printers-welcome"
  >
    <span class="welcome__icon"><frame-icon name="printers" /></span>
    <h1
      class="welcome__title"
      data-tid="page-title"
    >
      No printers yet
    </h1>
    <p class="welcome__lead">
      Nothing has turned up on this network. Keep this page open while your printer starts: it appears here by itself.
    </p>

    <div class="welcome__search">
      <v-progress-circular
        v-if="searching"
        indeterminate
        size="16"
        width="2"
      />
      <frame-icon
        v-else
        name="wifi"
        small
      />
      <span class="welcome__search-text">
        {{ searching ? 'Looking on this network…' : 'Nothing found on this network yet.' }}
        <span
          v-if="network"
          class="dim"
        > {{ network }}</span>
      </span>
      <button
        type="button"
        class="btn btn--sm"
        :disabled="searching"
        data-tid="search-again"
        @click="$emit('rescan')"
      >
        Search again
      </button>
    </div>

    <div class="rows welcome__ways">
      <div class="row">
        <span class="row__icon row__icon--accent"><frame-icon name="plus" /></span>
        <div class="row__text">
          <span class="row__title">Set up a new printer</span>
          <span class="row__sub welcome__wrap">
            Turn it on. It makes a Wi-Fi called <span class="mono">Muon-</span> and its name. Join that Wi-Fi and
            setup opens.<template v-if="bluetoothSearch"> Or find it nearby over Bluetooth.</template>
          </span>
        </div>
        <button
          v-if="bluetoothSearch && !bluetoothOff"
          type="button"
          class="btn btn--primary btn--sm"
          data-tid="look-nearby"
          @click="$emit('look-nearby')"
        >
          Look nearby
        </button>
      </div>
      <div class="row">
        <span class="row__icon"><frame-icon name="search" /></span>
        <div class="row__text">
          <span class="row__title">Add one by its address</span>
          <span class="row__sub welcome__wrap">It is on the printer's screen, such as muon-boxwood-367a.local or 192.168.1.20.</span>
        </div>
        <button
          type="button"
          class="btn btn--sm"
          data-tid="enter-address"
          @click="$emit('address')"
        >
          Add by address
        </button>
      </div>
      <div
        v-if="!signedIn"
        class="row"
      >
        <span class="row__icon"><frame-icon name="cloud" /></span>
        <div class="row__text">
          <span class="row__title">Sign in to reach your printers from anywhere</span>
          <span class="row__sub welcome__wrap">Optional. You don't need an account to print on this network.</span>
        </div>
        <button
          type="button"
          class="btn btn--sm"
          data-tid="sign-in"
          @click="$emit('sign-in')"
        >
          Sign in
        </button>
      </div>
    </div>
    <p
      v-if="blockedByPage"
      class="note"
      data-tid="blocked-by-page"
    >
      This browser won't let this page reach printers by their IP address, because the page was opened by
      name. Add a printer by its name instead, as shown on its screen, such as muon-walnut-8987.
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * The empty state (v3 section 6): a centred icon square, one bold line for
 * what is missing, one muted line for how to fix it, and the ways to find
 * the first printer.
 */
@Component({})
export default class PrintersWelcome extends Vue {
  @Prop({ type: Boolean })
  readonly signedIn?: boolean

  @Prop({ type: Boolean })
  readonly searching?: boolean

  @Prop({ type: String, default: '' })
  readonly network!: string

  @Prop({ type: Boolean })
  readonly bluetoothSearch?: boolean

  @Prop({ type: Boolean })
  readonly bluetoothOff?: boolean

  @Prop({ type: Boolean })
  readonly blockedByPage?: boolean
}
</script>

<style lang="scss" scoped>
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    max-width: 640px;
    margin: 0 auto;
    padding-top: 40px;
    text-align: center;
  }

  .welcome__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    svg { width: 30px; height: 30px; }
  }

  .welcome__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
  }

  .welcome__lead {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 15px;
  }

  .welcome__search {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    text-align: left;
  }

  .welcome__search-text {
    flex: 1 1 0;
    min-width: 0;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .welcome__ways {
    width: 100%;
    text-align: left;
  }

  .welcome__wrap {
    white-space: normal;
  }
</style>
