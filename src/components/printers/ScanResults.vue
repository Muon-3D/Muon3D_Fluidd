<template>
  <section
    v-if="state.phase !== 'idle'"
    class="scan"
    data-tid="scan-results"
  >
    <p
      v-if="state.phase === 'scanning'"
      class="scan__progress"
      data-tid="scan-progress"
    >
      <v-progress-circular
        indeterminate
        size="14"
        width="2"
      />
      {{ progress }}
    </p>

    <div
      v-if="state.secure.length || state.local.length"
      class="rows"
    >
      <div
        v-for="p in state.secure"
        :key="`s-${p.id}`"
        class="row"
        data-tid="scan-secure"
      >
        <span class="row__icon"><frame-icon name="printer" /></span>
        <div class="row__text">
          <span class="row__title">{{ p.name }}</span>
          <span class="row__sub">On this network (secure)</span>
        </div>
        <a
          :href="p.url"
          class="btn btn--primary btn--sm"
          target="_self"
          data-tid="scan-open-secure"
        >Open</a>
      </div>
      <div
        v-for="p in state.local"
        :key="`l-${p.id}`"
        class="row"
        data-tid="scan-local"
      >
        <span class="row__icon"><frame-icon name="printer" /></span>
        <div class="row__text">
          <span class="row__title">{{ p.name }}</span>
          <span class="row__sub">On this network. No secure address yet.</span>
        </div>
        <a
          :href="p.url"
          class="btn btn--sm"
          target="_self"
          data-tid="scan-open-local"
        >Open {{ p.host }} (not secure)</a>
      </div>
    </div>

    <p
      v-if="state.heard"
      class="scan__line"
      data-tid="scan-bluetooth-found"
    >
      Found over Bluetooth: {{ state.heard.display || state.heard.localName }}
    </p>
    <p
      v-if="state.cloud === 'skipped' && state.cloudWhy"
      class="scan__note"
      data-tid="scan-cloud-skipped"
    >
      {{ state.cloudWhy }}
    </p>
    <p
      v-if="state.bluetooth === 'skipped' && state.bluetoothWhy"
      class="scan__note"
      data-tid="scan-bluetooth-skipped"
    >
      {{ state.bluetoothWhy }}
    </p>
    <p
      v-if="state.phase === 'done' && !found"
      class="scan__line"
      data-tid="scan-empty"
    >
      {{ empty }}
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { emptyLine, foundAnything, progressLine } from '@/services/scan/text'
import { scanState } from '@/services/scan/state'

/** What the scan found and what it is doing (KAN-5409). */
@Component({})
export default class ScanResults extends Vue {
  get state () {
    return scanState
  }

  get progress () {
    return progressLine(scanState)
  }

  get found () {
    return foundAnything(scanState)
  }

  get empty () {
    return emptyLine(scanState)
  }
}
</script>

<style lang="scss" scoped>
  .scan {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin-bottom: 14px;
    text-align: left;
  }

  .scan__progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .scan__line {
    margin: 0;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .scan__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
