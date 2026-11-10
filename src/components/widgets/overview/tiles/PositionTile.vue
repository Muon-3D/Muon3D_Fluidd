<template>
  <tile-shell
    tile="position"
    title="Position"
    icon="expand"
    :state="homedText"
    :tone="homed ? 'ok' : 'warm'"
    :menu="menu"
    :open="open"
    :class="['po', `po--${size}`]"
    @toggle="open = !open"
  >
    <span class="po__xyz">
      <span
        v-for="a in axes"
        :key="a.k"
        class="po__axis"
        data-tid="axis"
      >
        <span>{{ a.k }}</span><b>{{ a.v }}</b><small v-if="size !== 'S'">mm</small>
      </span>
    </span>
    <span
      v-if="size === 'L'"
      class="po__homes po__homes--inline"
      data-tid="position-homes"
    >
      <button
        type="button"
        class="cbtn"
        :disabled="!canHome"
        @click="home('Z')"
      >Home Z</button>
      <button
        type="button"
        class="cbtn"
        :disabled="!canHome"
        @click="home()"
      >Home all</button>
    </span>

    <template #popover>
      <div
        :key="panelTarget"
        class="po__pop"
      >
        <div class="po__homes">
          <button
            type="button"
            class="cbtn"
            :disabled="!canHome"
            data-tid="home-xy"
            @click="home()"
          >
            Home all
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="!canHome"
            data-tid="home-z"
            @click="home('Z')"
          >
            Home Z
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="!canHome"
            data-tid="home-all"
            @click="home()"
          >
            Home all
          </button>
        </div>
        <div class="po__go">
          <label
            v-for="(axis, i) in ['X', 'Y', 'Z']"
            :key="axis"
            class="po__field"
          >
            <span>{{ axis }} · {{ axisMin[i] }} to {{ axisMax[i] }}</span>
            <number-field
              :value="goTo[i] !== null ? goTo[i] : position[i]"
              :decimals="2"
              :min="axisMin[i]"
              :max="axisMax[i]"
              :label="`${axis} to go to`"
              :disabled="!controlReady || busy || !isHomed(axis)"
              @change="setGoTo(i, $event)"
            />
          </label>
        </div>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!canGo"
          data-tid="move-go"
          @click="go"
        >
          Go there
        </button>
        <p class="ot__note">
          Homed {{ homedAxes || 'none' }} · head at {{ xySpeed }} mm/s · plate at {{ zSpeed }} mm/s. Nothing moves while a print runs.
        </p>
      </div>
    </template>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import type { TileMenuItem } from '@/services/overview/tiles'
import TileShell from './TileShell.vue'
import NumberField from '@/components/control/NumberField.vue'

/**
 * Where the head is, live, and whether it is homed. Tapping opens homing
 * and a go-to-here form (Control, the same checks). Motors off and the
 * endstops are behind the three dots.
 */
@Component({ components: { TileShell, NumberField } })
export default class PositionTile extends Mixins(OverviewMixin) {
  open = false
  goTo: Array<number | null> = [null, null, null]
  goTarget = ''

  @Watch('panelTarget')
  clearDraft () { this.goTo = [null, null, null]; this.open = false }

  get known (): boolean {
    const p = this.toolhead.position
    return Array.isArray(p) && p.slice(0, 3).every(Number.isFinite)
  }

  get homed (): boolean { return this.known && this.isHomed('XYZ') }

  get homedText (): string {
    if (this.homed) return 'Homed'
    return this.homedAxes ? `Homed ${this.homedAxes.split('').join(' ')}` : 'Not homed'
  }

  get axes (): Array<{ k: string, v: string }> {
    const p = this.position
    return [
      { k: 'X', v: this.known ? p[0].toFixed(1) : '—' },
      { k: 'Y', v: this.known ? p[1].toFixed(1) : '—' },
      { k: 'Z', v: this.known ? p[2].toFixed(2) : '—' }
    ]
  }

  get canHome (): boolean { return this.controlReady && !this.busy }

  setGoTo (i: number, value: number) {
    if (!this.goTo.some(v => v !== null)) this.goTarget = this.panelTarget
    this.goTo.splice(i, 1, value)
  }

  get canGo (): boolean {
    return this.controlReady && !this.busy && this.goTo.some(v => v !== null) && this.goTarget === this.panelTarget &&
      this.goTo.every((v, i) => v === null || (Number.isFinite(v) && v >= this.axisMin[i] && v <= this.axisMax[i] && this.isHomed('XYZ'[i])))
  }

  go () {
    if (!this.canGo) return
    const [X, Y, Z] = this.goTo
    this.moveTo({ X: X ?? undefined, Y: Y ?? undefined, Z: Z ?? undefined })
    this.goTo = [null, null, null]
  }

  get menu (): TileMenuItem[] {
    return [
      { id: 'motors', label: 'Turn motors off', disabled: !this.controlReady || this.busy, action: () => this.motorsOff() },
      { id: 'endstops', label: 'Endstops…', to: this.pagePath('/maintenance') }
    ]
  }
}
</script>

<style lang="scss">
.po__xyz { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.po__axis { display: flex; flex-direction: column; padding: 8px 12px; border-radius: 14px; background: var(--m3d-surface-2); }
.po__axis span { color: var(--m3d-accent); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.po__axis b { font-family: var(--m3d-font-mono); font-size: 20px; font-weight: 500; font-variant-numeric: tabular-nums; }
.po__axis small { color: var(--m3d-text-subtle); font-size: 11px; }
.po__pop { display: flex; flex-direction: column; gap: 12px; }
.po__homes { display: flex; flex-wrap: wrap; gap: 8px; }
.po__homes--inline { margin-top: 10px; }
.po--S .po__xyz { flex-direction: column; gap: 0; }
.po__go { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.po__field { display: flex; flex-direction: column; gap: 4px; color: var(--m3d-text-muted); font-size: 11.5px; }
</style>
