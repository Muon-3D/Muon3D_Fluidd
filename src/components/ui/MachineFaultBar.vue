<template>
  <div
    v-if="faults.length"
    class="fault-bar"
    role="alert"
    data-tid="machine-fault-bar"
  >
    <div
      v-for="f in faults"
      :key="f.code"
      class="fault-bar__row"
      :data-tid="`machine-fault-${f.code}`"
    >
      <div class="fault-bar__words">
        <span
          class="fault-bar__text"
          data-tid="machine-fault-text"
        >{{ wordsFor(f) }}</span>
        <span
          v-if="f.detail && !relatched"
          class="fault-bar__detail"
          data-tid="machine-fault-detail"
        >{{ f.detail }}</span>
      </div>
      <button
        v-if="f.canReset && canReset"
        type="button"
        class="cbtn cbtn--primary"
        :disabled="busy"
        :aria-busy="busy ? 'true' : 'false'"
        data-tid="machine-fault-reset"
        @click="ask"
      >
        {{ labels.reset }}
      </button>
    </div>
    <p
      v-if="printingNote"
      class="fault-bar__message fault-bar__message--quiet"
      data-tid="machine-fault-printing"
    >
      {{ labels.whilePrinting }}
    </p>
    <p
      v-if="message"
      class="fault-bar__message"
      data-tid="machine-fault-message"
    >
      {{ message }}
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import {
  machineFaults,
  RelatchTracker,
  printRunning,
  resetAvailable,
  BED_POWER_CODE,
  RESET_GCODE,
  type MachineFault
} from '@/services/machine-faults/faults'
import {
  BED_POWER_AGAIN,
  RESET_CANCEL,
  RESET_FAILED,
  RESET_LABEL,
  RESET_MESSAGE,
  RESET_TITLE,
  RESET_WHILE_PRINTING
} from '@/services/machine-faults/strings'

/**
 * The printer's machine faults at the top of Overview and Control (KAN-3418),
 * from `m1_machine.faults`, in the panel's words. Bed power cut offers Reset:
 * it asks first, then sends one Z_POWER_RESET. If the fault comes back (the
 * cause is still there) it says so and does not offer Reset again. Klipper
 * refuses the reset during a print, so Reset is not offered then. The banner
 * is driven by the printer's report only: it goes when the fault goes, for
 * whatever reason, never because Reset was pressed.
 */
@Component({})
export default class MachineFaultBar extends Mixins(StateMixin) {
  // One tracker for the page: Overview and Control never show at once.
  static tracker = Vue.observable(new RelatchTracker())

  busy = false
  message = ''
  timer: ReturnType<typeof setInterval> | null = null

  readonly labels = { reset: RESET_LABEL, whilePrinting: RESET_WHILE_PRINTING }

  get tracker (): RelatchTracker {
    return MachineFaultBar.tracker
  }

  get faults (): MachineFault[] {
    return machineFaults(this.$store.state.printer.printer)
  }

  get bedFault (): boolean {
    return this.faults.some(f => f.code === BED_POWER_CODE)
  }

  get relatched (): boolean {
    return this.tracker.relatched
  }

  get printing (): boolean {
    return printRunning(this.printerState)
  }

  get canReset (): boolean {
    return resetAvailable(this.faults, this.printerState) && !this.relatched
  }

  get printingNote (): boolean {
    return this.bedFault && this.printing
  }

  wordsFor (f: MachineFault): string {
    return f.code === BED_POWER_CODE && this.relatched ? BED_POWER_AGAIN : f.text
  }

  @Watch('bedFault')
  onBedFault (present: boolean) {
    this.tracker.observe(present, Date.now())
  }

  created () {
    this.tracker.observe(this.bedFault, Date.now())
    this.timer = setInterval(() => this.tracker.tick(Date.now()), 500)
  }

  beforeDestroy () {
    if (this.timer) clearInterval(this.timer)
  }

  async ask () {
    if (this.busy) return
    this.busy = true
    try {
      const yes = await this.$confirm(RESET_MESSAGE, {
        title: RESET_TITLE,
        buttonTrueText: RESET_LABEL,
        buttonFalseText: RESET_CANCEL
      })
      if (!yes) return
      this.message = ''
      await this.reset()
    } finally {
      this.busy = false
    }
  }

  /** One Z_POWER_RESET. A refusal is shown in the printer's own words. */
  async reset () {
    let refusal = ''
    const stop = this.$store.subscribeAction(action => {
      const payload = action.payload as { message?: unknown, __request__?: { params?: { script?: unknown } } } | undefined
      if (action.type === 'socket/onSocketError' && payload?.__request__?.params?.script === RESET_GCODE) {
        refusal = typeof payload.message === 'string' ? payload.message : ''
      }
    })
    try {
      this.tracker.resetSent(Date.now())
      const answer = await this.$socket.emit('printer.gcode.script', {
        dispatch: 'console/onGcodeScript',
        params: { script: RESET_GCODE }
      })
      if (answer === undefined) this.message = refusal || RESET_FAILED
    } finally {
      stop()
    }
  }
}
</script>

<style lang="scss" scoped>
.fault-bar {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--m3d-danger);
  border-radius: 10px;
  background: var(--m3d-surface);
  color: var(--m3d-text);
  font-size: 14px;
}
.fault-bar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.fault-bar__row + .fault-bar__row { margin-top: 8px; }
.fault-bar__words { display: flex; flex-direction: column; gap: 2px; }
.fault-bar__text { font-weight: 600; }
.fault-bar__detail { font-size: 13px; opacity: 0.8; }
.fault-bar__message {
  margin: 8px 0 0;
  color: var(--m3d-danger);
  font-size: 13px;
}
.fault-bar__message--quiet { color: var(--m3d-text); opacity: 0.8; }
</style>
