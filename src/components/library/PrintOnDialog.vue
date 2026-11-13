<template>
  <m3-dialog
    :value="!!item"
    :eyebrow="shared ? 'Print from Discover' : 'Print from your Library'"
    :title="item ? item.name : ''"
    :persistent="sending"
    :close-disabled="sending"
    max-width="560"
    content-class="print-on-frame"
    data-tid="print-on"
    @close="close"
  >
    <!-- No printers yet: say so once, with where to add one. -->
    <div
      v-if="!rows.length"
      class="print-on__none"
      data-tid="print-on-none"
    >
      <p class="m3-dlg__text">
        There are no printers in your account yet.
      </p>
      <router-link
        to="/"
        class="lib-btn lib-btn--sm"
        data-tid="print-on-add-printer"
        @click.native="close"
      >
        Add a printer ›
      </router-link>
    </div>

    <!-- Each printer once: what it has loaded, what it is doing, whether this print fits it. -->
    <div
      v-else
      class="print-on__list"
      role="radiogroup"
      aria-label="Printer"
    >
      <div
        v-for="row in rows"
        :key="row.id"
        class="print-on__row"
        :class="{
          'print-on__row--on': chosenRow && chosenRow.id === row.id,
          'print-on__row--off': row.tone === 'off' || row.action === 'reslice'
        }"
        :role="choosable(row) ? 'radio' : undefined"
        :aria-checked="choosable(row) ? (!!chosenRow && chosenRow.id === row.id ? 'true' : 'false') : undefined"
        :aria-label="choosable(row) ? `${row.name}: ${row.status}` : undefined"
        :tabindex="choosable(row) ? 0 : undefined"
        :data-tid="`print-on-${row.slug}`"
        @click="choose(row)"
        @keydown.enter.self.prevent="choose(row)"
        @keydown.space.self.prevent="choose(row)"
      >
        <span
          class="print-on__icon"
          aria-hidden="true"
        ><frame-icon name="printer" /></span>
        <span class="print-on__text">
          <span class="print-on__name">{{ row.name }}<span
            v-if="row.active"
            class="print-on__here"
          > · here</span></span>
          <span
            class="print-on__line"
            data-tid="print-on-fit"
          >{{ line(row) }}</span>
        </span>
        <button
          v-if="row.action === 'reslice'"
          type="button"
          class="lib-pill lib-pill--warn print-on__pill-btn"
          :disabled="sending"
          data-tid="print-on-reslice"
          @click.stop="reslice(row)"
        >
          {{ row.reslice }}
        </button>
        <span
          v-else
          class="lib-pill"
          :class="{ 'lib-pill--ok': row.tone === 'ok', 'lib-pill--run': row.tone === 'run' }"
        >{{ row.status }}</span>
      </div>
    </div>

    <!-- Print now only: the plate must be clear. A queued print waits for it anyway. -->
    <div
      v-if="asksPlate && chosenRow"
      class="print-on__plate-box"
    >
      <label
        class="print-on__plate"
        data-tid="print-on-plate"
      >
        <input
          v-model="plateClear"
          type="checkbox"
          role="switch"
          :aria-checked="plateClear ? 'true' : 'false'"
          aria-describedby="print-on-plate-why"
          :disabled="sending"
        >
        <span
          class="print-on__switch"
          aria-hidden="true"
        />
        The plate on {{ chosenRow.name }} is clear
      </label>
      <p
        id="print-on-plate-why"
        class="print-on__why"
        data-tid="print-on-plate-why"
      >
        {{ $t('app.plate_check.why') }}
      </p>
    </div>

    <p
      v-if="step"
      class="m3-dlg__note print-on__step"
      role="status"
    >
      <v-progress-circular
        indeterminate
        size="14"
        width="2"
      />
      {{ step }}
    </p>
    <p
      v-if="error"
      class="m3-dlg__error"
      role="alert"
    >
      {{ error }}
    </p>

    <template #actions>
      <button
        v-if="rows.length"
        type="button"
        class="print-on__save"
        :disabled="!chosenRow || sending"
        data-tid="print-on-save"
        @click="go('save')"
      >
        Save to the printer only
      </button>
      <span class="m3-dlg__grow" />
      <button
        type="button"
        class="lib-btn"
        :disabled="sending"
        data-tid="print-on-cancel"
        @click="close"
      >
        Cancel
      </button>
      <button
        v-if="rows.length"
        type="button"
        class="lib-btn lib-btn--pri"
        :disabled="!canGo"
        data-tid="print-on-print"
        @click="go('print')"
      >
        {{ chosenRow && chosenRow.action === 'queue' ? 'Add to queue' : 'Print now' }}
      </button>
      <p
        class="print-on__fine"
        data-tid="print-on-fine"
      >
        {{ shared ? 'The file is checked against what its maker published, then sent' : 'The file comes from your Library and is sent' }}
        to {{ chosenRow ? chosenRow.name : 'the printer' }} itself.
        <template v-if="rows.length && !sending">
          Another printer?
          <router-link
            to="/"
            @click.native="close"
          >
            Add a printer ›
          </router-link>
        </template>
      </p>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PrintOnMixin from '@/mixins/print-on'
import type { TargetRow } from '@/services/library/print-targets'

/**
 * Print on… (Library v3, page 10): the print's name, then each printer in
 * the account once, with what it has loaded, what it is doing and whether
 * this print fits it (Ready, Queue, Re-slice); the plate switch for Print
 * now; Save to the printer only, Cancel and one primary. What it does is
 * mixins/print-on.ts; only the look is here.
 */
@Component({ components: { M3Dialog } })
export default class PrintOnDialog extends Mixins(PrintOnMixin) {
  /** It can be chosen: it prints now, or it queues. */
  choosable (row: TargetRow): boolean {
    return row.action === 'print' || row.action === 'queue'
  }

  /** "PLA loaded · 0.4 mm nozzle · 1h 12m · 18 g": what the row says about this print on it. */
  line (row: TargetRow): string {
    // Not what the pill already says ("Offline" once, not twice).
    const detail = row.detail === row.status ? '' : row.detail
    return [detail, row.action === 'reslice' ? '' : row.note].filter(Boolean).join(' · ')
  }
}
</script>

<style lang="scss" scoped>
  .print-on__list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .print-on__row {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    cursor: default;

    & + & { border-top: 1px solid var(--m3d-border); }

    &[role='radio'] { cursor: pointer; }

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: -2px;
    }
  }

  .print-on__row--on {
    background: var(--m3d-accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--m3d-accent);
  }

  .print-on__row--off .print-on__text { opacity: 0.7; }

  .print-on__icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-fill, rgba(255, 255, 255, 0.06));
  }

  .print-on__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .print-on__name { font-weight: 600; }

  .print-on__here {
    color: var(--m3d-text-subtle);
    font-weight: 400;
  }

  .print-on__line {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .print-on__pill-btn {
    border: 0;
    font: inherit;
    cursor: pointer;
  }

  .print-on__none {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .print-on__plate-box {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .print-on__why {
    margin: 6px 0 0 52px;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .print-on__plate {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    cursor: pointer;

    input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
    }

    input:focus-visible + .print-on__switch { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
  }

  .print-on__switch {
    position: relative;
    flex: none;
    width: 40px;
    height: 24px;
    border-radius: 12px;
    background: var(--m3d-border-strong);
    transition: background 0.15s;

    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.15s;
    }
  }

  input:checked + .print-on__switch {
    background: var(--m3d-success);

    &::after { transform: translateX(16px); }
  }

  .print-on__step {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .print-on__save {
    padding: 0;
    border: 0;
    background: none;
    color: var(--m3d-text-subtle);
    font: inherit;
    font-size: 13px;
    cursor: pointer;

    &:hover:not(:disabled) { color: var(--m3d-text); text-decoration: underline; }
    &:disabled { opacity: 0.5; cursor: default; }
  }

  .print-on__fine {
    flex-basis: 100%;
    margin: 4px 0 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;

    a { color: var(--m3d-accent); }
  }

  // The switch's slide and fade are decoration: off for anyone who asked for less motion.
  @media (prefers-reduced-motion: reduce) {
    .print-on__switch, .print-on__switch::after { transition: none; }
  }

  // A phone stacks the buttons, the one that does it on top (M3Dialog), then Cancel, then Save to the printer only, then the fine print.
  @media (max-width: 480px) {
    .print-on__save { order: -1; padding: 8px 0; }
    .print-on__fine { order: -2; }
  }
</style>
