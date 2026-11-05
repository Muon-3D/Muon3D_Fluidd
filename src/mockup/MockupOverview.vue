<template>
  <div
    class="mq"
    :class="{ 'mq--edit': edit, 'mq--phone': phone }"
    data-tid="mockup-overview"
  >
    <!-- Page head -->
    <div class="mq-head">
      <h1 class="mq-title">
        Overview
      </h1>
      <span class="mq-head__grow" />
      <template v-if="edit">
        <button
          type="button"
          class="cbtn"
          data-tid="edit-reset"
        >
          Reset layout
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="edit-done"
        >
          <frame-icon
            name="check"
            small
          />Done
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="cbtn"
          data-tid="edit-open"
        >
          <frame-icon
            name="pencil"
            small
          />Edit
        </button>
      </template>
    </div>

    <!-- Edit mode: what it does, and the tiles that are not on the page yet. -->
    <section
      v-if="edit"
      class="mq-tray"
      data-tid="add-tile-tray"
    >
      <div class="mq-tray__head">
        <b>Add tile</b>
        <span>Drag a tile onto the page, or tap it to add it at the end. Drag the grip to move a tile, the corner to resize it. Saved for you, on Boxwood.</span>
      </div>
      <div class="mq-tray__chips">
        <button
          v-for="t in trayTiles"
          :key="t.label"
          type="button"
          class="mq-chip mq-chip--add"
        >
          <frame-icon
            :name="t.icon"
            small
          />{{ t.label }}<frame-icon
            name="plus"
            small
          />
        </button>
      </div>
    </section>

    <div class="mq-grid">
      <!-- Main view: the live 3D printer, or the camera when the printer has one -->
      <section
        class="mq-tile mq-tile--stage"
        data-tid="tile-stage"
      >
        <template v-if="showCamera">
          <div class="mq-cam">
            <svg
              viewBox="0 0 640 400"
              preserveAspectRatio="xMidYMid slice"
              class="mq-cam__svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="mqwall"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0"
                    stop-color="#3c4448"
                  />
                  <stop
                    offset="1"
                    stop-color="#242a2d"
                  />
                </linearGradient>
                <linearGradient
                  id="mqplate"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0"
                    stop-color="#6e777b"
                  />
                  <stop
                    offset="1"
                    stop-color="#343b3e"
                  />
                </linearGradient>
                <linearGradient
                  id="mqvase"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0"
                    stop-color="#2a8f8a"
                  />
                  <stop
                    offset="0.45"
                    stop-color="#80d6d1"
                  />
                  <stop
                    offset="1"
                    stop-color="#2a8f8a"
                  />
                </linearGradient>
              </defs>
              <rect
                width="640"
                height="400"
                fill="url(#mqwall)"
              />
              <rect
                x="40"
                y="70"
                width="560"
                height="22"
                rx="6"
                fill="#1b2022"
              />
              <rect
                x="296"
                y="70"
                width="48"
                height="90"
                rx="8"
                fill="#161a1c"
              />
              <rect
                x="304"
                y="150"
                width="32"
                height="38"
                rx="4"
                fill="#9aa4a8"
              />
              <path
                d="M120 360 L200 262 H440 L520 360 Z"
                fill="url(#mqplate)"
              />
              <path
                d="M268 332 Q320 348 372 332 L360 262 Q320 252 280 262 Z"
                fill="url(#mqvase)"
              />
              <ellipse
                cx="320"
                cy="262"
                rx="40"
                ry="9"
                fill="#1c4f4c"
              />
              <g
                stroke="#0b2f2d"
                stroke-width="1"
                opacity="0.5"
              >
                <path d="M272 276 Q320 289 368 276" />
                <path d="M274 290 Q320 303 366 290" />
                <path d="M277 304 Q320 317 363 304" />
                <path d="M281 318 Q320 331 359 318" />
              </g>
            </svg>
            <span class="mq-cam__live"><i /> Live · Boxwood camera</span>
            <span class="mq-cam__spec">1280 × 720 · 15 fps</span>
          </div>
        </template>
        <overview-stage
          v-else
          class="mq-stage"
        />

        <div
          v-if="hasCamera"
          class="mq-seg"
          role="group"
          aria-label="Main view"
          data-tid="view-toggle"
        >
          <button
            type="button"
            :class="{ on: !showCamera }"
            :aria-pressed="!showCamera"
          >
            <frame-icon
              name="printer"
              small
            />3D view
          </button>
          <button
            type="button"
            :class="{ on: showCamera }"
            :aria-pressed="showCamera"
          >
            <frame-icon
              name="camera2"
              small
            />Camera
          </button>
        </div>
        <template v-if="edit">
          <span class="mq-grip"><i /><i /><i /><i /><i /><i /></span>
          <span class="mq-resize" />
        </template>
      </section>

      <!-- Print job: no empty space under it. The filament tile sits right below. -->
      <section
        class="mq-tile mq-tile--job"
        data-tid="tile-job"
      >
        <div class="mq-tile__head">
          <span class="mq-tile__title">Print job</span>
          <span class="mq-pill mq-pill--ok"><i />Printing</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.job"
            :edit="edit"
          />
        </div>
        <div class="mq-job">
          <div class="mq-job__thumb">
            <svg
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <path
                d="M14 22 L32 14 L50 22 L50 44 L32 52 L14 44 Z"
                fill="none"
                stroke="var(--m3d-accent)"
                stroke-width="2.4"
                stroke-linejoin="round"
              />
              <path
                d="M14 22 L32 30 L50 22 M32 30 V52"
                fill="none"
                stroke="var(--m3d-accent)"
                stroke-width="2"
                opacity="0.55"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="mq-job__text">
            <b>{{ fileName }}</b>
            <span>PLA Matte Teal · 0.4 nozzle · 0.20 mm layers</span>
          </div>
        </div>
        <div class="mq-job__bar">
          <span class="mq-job__pct">{{ progressPct }}<small>%</small></span>
          <span class="mq-job__layer">Layer 27 of 63</span>
        </div>
        <div class="mq-bar"><i :style="{ width: progressPct + '%' }" /></div>
        <div class="mq-job__stats">
          <div><span>Elapsed</span><b>40 min</b></div>
          <div><span>Remaining</span><b>48 min</b></div>
          <div><span>Done at</span><b>18:11</b></div>
        </div>
        <div class="mq-job__actions">
          <button
            type="button"
            class="cbtn cbtn--grow"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden="true"
            ><rect
              x="6"
              y="5"
              width="4"
              height="14"
              rx="1.2"
            /><rect
              x="14"
              y="5"
              width="4"
              height="14"
              rx="1.2"
            /></svg>Pause
          </button>
          <button
            type="button"
            class="cbtn cbtn--grow cbtn--danger"
          >
            Stop print
          </button>
        </div>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <!-- Filament: what is loaded, by type and colour. The printer does not track how much is left. -->
      <section
        class="mq-tile mq-tile--filament"
        data-tid="tile-filament"
      >
        <div class="mq-tile__head">
          <span class="mq-tile__title">Filament</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.filament"
            :edit="edit"
          />
        </div>
        <div class="mq-slots">
          <div
            v-for="s in slots"
            :key="s.n"
            class="mq-slot"
            :class="{ 'mq-slot--on': s.active, 'mq-slot--empty': !s.type }"
          >
            <span
              class="mq-slot__spool"
              :style="s.color ? { background: s.color, color: s.ink } : null"
            >
              <frame-icon
                name="spool"
                large
              />
            </span>
            <span class="mq-slot__text">
              <b>{{ s.type || 'Empty' }}</b>
              <span>{{ s.name || 'Slot ' + s.n }}</span>
            </span>
            <span
              v-if="s.active"
              class="mq-slot__tag"
            >In use</span>
          </div>
        </div>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <!-- Instrument tiles -->
      <section
        class="mq-tile mq-tile--hotend"
        :class="{ 'mq-tile--pop': pop === 'hotend' }"
        data-tid="tile-hotend"
      >
        <button
          type="button"
          class="mq-door"
          :aria-expanded="pop === 'hotend'"
        >
          <span class="mq-tile__head">
            <frame-icon
              name="nozzle"
              small
            />
            <span class="mq-tile__title">Hotend</span>
            <span class="mq-head__grow" />
            <span
              class="mq-state"
              :class="'mq-state--' + hotend.tone"
            >{{ hotend.state }}</span>
          </span>
          <span class="mq-value">{{ hotend.temp }}°<small>/ {{ hotend.target }}°</small></span>
          <span class="mq-bar mq-bar--thin"><i :style="{ width: hotend.bar + '%' }" /></span>
        </button>
        <more-menu
          class="mq-more-abs"
          :items="menus.hotend"
          :edit="edit"
        />
        <heat-popover
          v-if="pop === 'hotend'"
          kind="hotend"
          :temp="hotend.temp"
          :target="hotend.target"
        />
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--bed"
        :class="{ 'mq-tile--pop': pop === 'bed' }"
        data-tid="tile-bed"
      >
        <button
          type="button"
          class="mq-door"
          :aria-expanded="pop === 'bed'"
        >
          <span class="mq-tile__head">
            <frame-icon
              name="thermometer"
              small
            />
            <span class="mq-tile__title">Bed</span>
            <span class="mq-head__grow" />
            <span
              class="mq-state"
              :class="'mq-state--' + bed.tone"
            >{{ bed.state }}</span>
          </span>
          <span class="mq-value">{{ bed.temp }}°<small>/ {{ bed.target }}°</small></span>
          <span class="mq-bar mq-bar--thin"><i :style="{ width: bed.bar + '%' }" /></span>
        </button>
        <more-menu
          class="mq-more-abs"
          :items="menus.bed"
          :edit="edit"
        />
        <heat-popover
          v-if="pop === 'bed'"
          kind="bed"
          :temp="bed.temp"
          :target="bed.target"
        />
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--fans"
        data-tid="tile-fans"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="fan"
            small
          />
          <span class="mq-tile__title">Fans</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.fans"
            :edit="edit"
          />
        </div>
        <span class="mq-value">{{ partFan }}%<small>part</small></span>
        <span class="mq-sub">Aux 0% · Hotend fan on</span>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--speed"
        data-tid="tile-speed"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="pulse"
            small
          />
          <span class="mq-tile__title">Speed / flow</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.speed"
            :edit="edit"
          />
        </div>
        <span class="mq-value">{{ speed }}%<small>/ {{ flow }}%</small></span>
        <span class="mq-sub">Pressure advance 0.042</span>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--jog"
        data-tid="tile-jog"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="control"
            small
          />
          <span class="mq-tile__title">Jog</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.jog"
            :edit="edit"
          />
        </div>
        <div class="mq-jog">
          <div class="mq-pad">
            <button
              type="button"
              class="mq-pad__b mq-pad__n"
              aria-label="Y plus"
            >
              <frame-icon name="chevronUp" />
            </button>
            <button
              type="button"
              class="mq-pad__b mq-pad__w"
              aria-label="X minus"
            >
              <frame-icon name="chevronLeft" />
            </button>
            <button
              type="button"
              class="mq-pad__b mq-pad__c"
              aria-label="Home XY"
            >
              <frame-icon name="home" />
            </button>
            <button
              type="button"
              class="mq-pad__b mq-pad__e"
              aria-label="X plus"
            >
              <frame-icon name="chevronRight" />
            </button>
            <button
              type="button"
              class="mq-pad__b mq-pad__s"
              aria-label="Y minus"
            >
              <frame-icon name="chevronDown" />
            </button>
          </div>
          <div class="mq-zcol">
            <button
              type="button"
              class="mq-pad__b"
              aria-label="Z up"
            >
              <frame-icon name="chevronUp" />
            </button>
            <span class="mq-zcol__l">Z</span>
            <button
              type="button"
              class="mq-pad__b"
              aria-label="Z down"
            >
              <frame-icon name="chevronDown" />
            </button>
          </div>
        </div>
        <div class="mq-jog__foot">
          <seg-picker
            :options="steps"
            :value="1"
            label="Step"
            accent
            fill
          />
        </div>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--pos"
        data-tid="tile-position"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="expand"
            small
          />
          <span class="mq-tile__title">Position</span>
          <span class="mq-head__grow" />
          <span class="mq-state mq-state--ok">Homed</span>
          <more-menu
            :items="menus.position"
            :edit="edit"
          />
        </div>
        <div class="mq-xyz">
          <div
            v-for="a in axes"
            :key="a.k"
          >
            <span>{{ a.k }}</span><b>{{ a.v }}</b><small>mm</small>
          </div>
        </div>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--zoff"
        data-tid="tile-zoffset"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="firstLayer"
            small
          />
          <span class="mq-tile__title">Z offset</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.zoffset"
            :edit="edit"
          />
        </div>
        <div class="mq-zoff">
          <span class="mq-value">{{ zoffset }}<small>mm</small></span>
          <span class="mq-step">
            <button
              type="button"
              class="mq-round"
              aria-label="Lower the nozzle by 0.005"
            ><frame-icon
              name="minus"
              small
            /></button>
            <button
              type="button"
              class="mq-round"
              aria-label="Raise the nozzle by 0.005"
            ><frame-icon
              name="plus"
              small
            /></button>
          </span>
        </div>
        <span class="mq-sub">Saved in config · steps of 0.005</span>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--macros"
        data-tid="tile-macros"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="pulse"
            small
          />
          <span class="mq-tile__title">Macros</span>
          <span class="mq-head__grow" />
          <more-menu
            :items="menus.macros"
            :edit="edit"
          />
        </div>
        <div class="mq-chips">
          <button
            v-for="m in macros"
            :key="m"
            type="button"
            class="mq-chip"
          >
            {{ m }}
          </button>
          <button
            type="button"
            class="mq-chip mq-chip--more"
          >
            All macros (24)
          </button>
        </div>
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <section
        class="mq-tile mq-tile--graph"
        data-tid="tile-graph"
      >
        <div class="mq-tile__head">
          <frame-icon
            name="pulse"
            small
          />
          <span class="mq-tile__title">Temperatures</span>
          <span class="mq-head__grow" />
          <seg-picker
            class="mq-range"
            :options="ranges"
            :value="5"
            label="Time range"
          />
          <more-menu
            :items="menus.graph"
            :edit="edit"
          />
        </div>
        <div class="mq-track">
          <span
            v-for="t in tracked"
            :key="t.label"
            class="mq-track__chip"
          ><i :style="{ background: t.color }" />{{ t.label }}<b>{{ t.v }}</b></span>
          <button
            type="button"
            class="mq-track__chip mq-track__chip--add"
          >
            <frame-icon
              name="plus"
              small
            />Track more (9)
          </button>
        </div>
        <thermal-chart
          v-if="chartReady"
          height="250px"
        />
        <div
          v-else
          class="mq-chart-wait"
        />
        <span
          v-if="edit"
          class="mq-grip"
        ><i /><i /><i /><i /><i /><i /></span>
        <span
          v-if="edit"
          class="mq-resize"
        />
      </section>

      <div
        v-if="edit"
        class="mq-ghost"
      >
        Drop here
      </div>
    </div>
  </div>
</template>

<script>
import OverviewStage from '@/components/overview/OverviewStage.vue'
import ThermalChart from '@/components/widgets/thermals/ThermalChart.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import MoreMenu from './MockupMoreMenu.vue'
import HeatPopover from './MockupHeatPopover.vue'

const n = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d)

export default {
  components: { OverviewStage, ThermalChart, SegPicker, MoreMenu, HeatPopover },
  data: () => ({
    // Hard-coded: the layout editor and the tile menus are mockup-only.
    trayTiles: [
      { icon: 'mesh', label: 'Bed mesh' },
      { icon: 'console', label: 'Console' },
      { icon: 'plate', label: 'Exclude objects' },
      { icon: 'settings', label: 'Printer limits' },
      { icon: 'power', label: 'Power devices' },
      { icon: 'list', label: 'Job queue' },
      { icon: 'clock', label: 'Timelapse' }
    ],
    slots: [
      { n: 1, type: 'PLA', name: 'Matte Teal', color: '#80d6d1', ink: '#0b2f2d', active: true },
      { n: 2, type: 'PETG', name: 'Black', color: '#2b2f31', ink: '#e8ecee' },
      { n: 3, type: 'PLA', name: 'Signal White', color: '#e8ecee', ink: '#1d1d1f' },
      { n: 4, type: '', name: '', color: '' }
    ],
    macros: ['Park toolhead', 'Purge line', 'Clean nozzle', 'Level bed', 'Load filament', 'Unload filament', 'Preheat PLA'],
    steps: [{ value: 0.1, label: '0.1' }, { value: 1, label: '1' }, { value: 10, label: '10' }, { value: 100, label: '100' }],
    ranges: [{ value: 1, label: '1m' }, { value: 5, label: '5m' }, { value: 15, label: '15m' }, { value: 60, label: '1h' }],
    tracked: [
      { label: 'Hotend', color: '#ff9f43', v: '214.8°' },
      { label: 'Bed', color: '#5ac8fa', v: '60.0°' },
      { label: 'Chamber', color: '#bf5af2', v: '31.2°' },
      { label: 'Toolhead', color: '#30d158', v: '33.0°' },
      { label: 'Part fan', color: '#ffd60a', v: '70%' }
    ],
    menus: {
      job: ['Exclude objects…', 'Reprint from history…', 'Job queue (2)', 'Time estimates…'],
      filament: ['Load or unload…', 'Change filament during the print', 'Filament sensors…', 'Spoolman…'],
      hotend: ['Show on graph', 'PID tune and limits…', 'Load or unload…', 'Presets…'],
      bed: ['Show on graph', 'PID tune and limits…', 'Bed mesh…', 'Presets…'],
      fans: ['All fans and outputs…', 'Fan curves…'],
      speed: ['Pressure advance…', 'Speed and acceleration limits…', 'Retraction…'],
      jog: ['Extrude and retract…', 'Turn motors off', 'Bed screws and tilt…', 'Axis step sizes…'],
      position: ['Home X, Y or Z…', 'Park toolhead', 'Endstops…', 'Toolhead limits…'],
      zoffset: ['Step size…', 'Save to config', 'Run probe calibration…'],
      macros: ['Manage macros…', 'Hide or show macros…', 'Reorder…'],
      graph: ['Tracked sensors…', 'Temperature presets…', 'Smoothing and units…', 'Export CSV']
    }
  }),
  computed: {
    chartReady () {
      const st = this.$store.state
      return !!(st.socket.acceptingNotifications && st.socket.ready && st.charts.ready)
    },
    q () { return this.$route.query },
    edit () { return this.q.edit === '1' },
    hasCamera () { return this.q.cam === '1' },
    showCamera () { return this.hasCamera && this.q.view === 'camera' },
    pop () { return this.q.pop || '' },
    phone () { return this.$vuetify.breakpoint.smAndDown },
    p () { return this.$store.state.printer.printer || {} },
    fileName () { return (this.p.print_stats && this.p.print_stats.filename) || 'M1_bracket_PLA_0.2mm.gcode' },
    progressPct () {
      const v = this.p.virtual_sdcard && this.p.virtual_sdcard.progress
      return Math.round(n(v, 0.45) * 100)
    },
    hotend () { return this.heater(this.p.extruder, 214.8, 215) },
    bed () { return this.heater(this.p.heater_bed, 60, 60) },
    partFan () { return Math.round(n(this.p.fan && this.p.fan.speed, 0.7) * 100) },
    speed () { return Math.round(n(this.p.gcode_move && this.p.gcode_move.speed_factor, 1) * 100) },
    flow () { return Math.round(n(this.p.gcode_move && this.p.gcode_move.extrude_factor, 0.98) * 100) },
    zoffset () {
      const o = this.p.gcode_move && this.p.gcode_move.homing_origin
      const v = n(o && o[2], -0.045)
      return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3)
    },
    axes () {
      const t = (this.p.toolhead && this.p.toolhead.position) || []
      return [{ k: 'X', v: n(t[0], 120.4).toFixed(1) }, { k: 'Y', v: n(t[1], 98.2).toFixed(1) }, { k: 'Z', v: n(t[2], 12.6).toFixed(2) }]
    }
  },
  methods: {
    heater (h, dt, dg) {
      const t = n(h && h.temperature, dt)
      const g = n(h && h.target, dg)
      const ok = Math.abs(t - g) < 3
      return {
        temp: t.toFixed(1),
        target: Math.round(g),
        bar: g ? Math.min(100, (t / g) * 100) : 0,
        state: g ? (ok ? 'At temperature' : 'Heating') : 'Off',
        tone: g ? (ok ? 'ok' : 'warm') : 'off'
      }
    }
  }
}
</script>

<style lang="scss">
.mq { display: flex; flex-direction: column; gap: 16px; color: var(--m3d-text); }

.mq-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mq-title { margin: 0; font-size: 20px; font-weight: 600; }
.mq-head__sub { color: var(--m3d-text-muted); font-size: 13px; }
.mq-head__grow { flex: 1 1 auto; }

/* The grid: 12 columns on a computer, 2 on a phone. */
.mq-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.mq-grid .mq-tile--stage { grid-column: 1 / span 7; grid-row: 1 / span 2; min-height: 420px; padding: 0; overflow: hidden; }
.mq-tile--job { grid-column: 8 / span 5; grid-row: 1; }
.mq-tile--filament { grid-column: 8 / span 5; grid-row: 2; }
.mq-tile--hotend { grid-column: 1 / span 3; }
.mq-tile--bed { grid-column: 4 / span 3; }
.mq-tile--fans { grid-column: 7 / span 3; }
.mq-tile--speed { grid-column: 10 / span 3; }
.mq-tile--jog { grid-column: 1 / span 4; grid-row: span 2; }
.mq-tile--pos { grid-column: 5 / span 4; }
.mq-tile--zoff { grid-column: 9 / span 4; }
.mq-tile--macros { grid-column: 5 / span 8; }
.mq-tile--graph { grid-column: 1 / -1; }
.mq-ghost { grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; min-height: 64px; border: 2px dashed var(--m3d-accent); border-radius: 22px; background: var(--m3d-accent-soft); color: var(--m3d-accent); font-size: 13px; font-weight: 600; }

@media (max-width: 1099px) {
  .mq-grid .mq-tile--stage { grid-column: 1 / -1; grid-row: auto; min-height: 340px; }
  .mq-tile--job, .mq-tile--filament { grid-column: span 12; grid-row: auto; }
  .mq-tile--hotend { grid-column: span 6; }
  .mq-tile--bed { grid-column: span 6; }
  .mq-tile--fans { grid-column: span 6; }
  .mq-tile--speed { grid-column: span 6; }
  .mq-tile--jog { grid-column: span 12; grid-row: auto; }
  .mq-tile--pos { grid-column: span 6; }
  .mq-tile--zoff { grid-column: span 6; }
  .mq-tile--macros { grid-column: 1 / -1; }
}
@media (max-width: 599px) {
  .mq-grid { gap: 12px; }
  .mq-grid .mq-tile--stage { min-height: 300px; }
  .mq-tile--pos, .mq-tile--zoff { grid-column: 1 / -1; }
}

/* Tiles: the card every Overview panel is (surface, 22 px). */
.mq-tile {
  position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0;
  padding: 16px 18px; border-radius: 22px; background: var(--m3d-surface); color: var(--m3d-text);
}
.mq-tile__head { display: flex; align-items: center; gap: 8px; min-height: 28px; color: var(--m3d-text-muted); }
.mq-tile__title { color: var(--m3d-text); font-size: 15px; font-weight: 600; }
.mq-tile .frame-icon { color: var(--m3d-text-muted); }
.mq-value { font-family: var(--m3d-font-rounded); font-size: 30px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.mq-value small { margin-left: 6px; color: var(--m3d-text-muted); font-size: 14px; font-weight: 500; }
.mq-sub { color: var(--m3d-text-muted); font-size: 12.5px; }

.mq-door { all: unset; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: 100%; cursor: pointer; }
.mq-door:focus-visible { outline: 2px solid var(--m3d-focus-ring); outline-offset: 4px; border-radius: 12px; }
.mq-more-abs { position: absolute; top: 14px; right: 14px; }
.mq-more-abs ~ .mq-door .mq-state, .mq-tile--hotend .mq-door .mq-state, .mq-tile--bed .mq-door .mq-state { margin-right: 36px; }
.mq-tile--pop { z-index: 6; box-shadow: 0 0 0 1.5px var(--m3d-accent); }

.mq-state { padding: 2px 9px; border-radius: 999px; background: var(--m3d-fill-2); color: var(--m3d-text-muted); font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.mq-state--ok { background: color-mix(in srgb, var(--m3d-success) 16%, transparent); color: var(--m3d-success); }
.mq-state--warm { background: color-mix(in srgb, var(--m3d-warning) 16%, transparent); color: var(--m3d-warning); }
.mq-pill { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; background: var(--m3d-accent-soft); color: var(--m3d-accent); font-size: 12px; font-weight: 600; }
.mq-pill i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.mq-bar { height: 6px; border-radius: 999px; background: var(--m3d-ring-track); overflow: hidden; }
.mq-bar i { display: block; height: 100%; border-radius: inherit; background: var(--m3d-accent); }
.mq-bar--thin { height: 4px; }

/* Main view */
.mq-stage, .mq-cam { position: absolute; inset: 0; }
.mq-tile--stage .mq-stage.ov-stage { position: absolute; inset: 0; min-height: 0; border-radius: 0; }
.mq-cam { overflow: hidden; background: #242a2d; }
.mq-cam__svg { width: 100%; height: 100%; display: block; }
.mq-cam__live { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px; border-radius: 999px; background: rgb(255 255 255 / 92%); color: #121719; font-size: 12px; font-weight: 600; }
.mq-cam__live i { width: 7px; height: 7px; border-radius: 50%; background: #e0241f; }
.mq-cam__spec { position: absolute; bottom: 14px; left: 14px; padding: 3px 9px; border-radius: 999px; background: rgb(0 0 0 / 45%); color: #fff; font-family: var(--m3d-font-mono); font-size: 11px; }
.mq-seg { position: absolute; top: 12px; right: 12px; z-index: 3; display: inline-flex; padding: 3px; border-radius: 999px; background: var(--m3d-glass-thick); box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge); backdrop-filter: var(--m3d-glass-filter); }
.mq-seg button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 13px; border-radius: 999px; color: var(--m3d-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
.mq-seg button .frame-icon { color: inherit; }
.mq-seg button.on { background: var(--m3d-surface-2); color: var(--m3d-text); box-shadow: var(--m3d-shadow-control); }

/* Print job */
.mq-job { display: flex; align-items: center; gap: 14px; }
.mq-job__thumb { flex: none; display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 16px; background: var(--m3d-surface-2); }
.mq-job__thumb svg { width: 44px; height: 44px; }
.mq-job__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.mq-job__text b { overflow: hidden; font-size: 15px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.mq-job__text span { color: var(--m3d-text-muted); font-size: 12.5px; }
.mq-job__bar { display: flex; align-items: baseline; justify-content: space-between; margin-top: 4px; }
.mq-job__pct { color: var(--m3d-accent); font-family: var(--m3d-font-rounded); font-size: 40px; font-weight: 600; line-height: 1; }
.mq-job__pct small { font-size: 20px; }
.mq-job__layer { color: var(--m3d-text-muted); font-size: 13px; }
.mq-job__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
.mq-job__stats span { display: block; color: var(--m3d-text-subtle); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.mq-job__stats b { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.mq-job__actions { display: flex; gap: 8px; margin-top: 6px; }
.mq-tile--job .mq-tile__head .mq-head__grow { flex: 1 1 auto; }

/* Filament */
.mq-slots { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.mq-slot { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 6px 12px; border-radius: 16px; background: var(--m3d-surface-2); text-align: center; }
.mq-slot--on { box-shadow: inset 0 0 0 1.5px var(--m3d-accent); }
.mq-slot--empty { background: transparent; box-shadow: inset 0 0 0 1px var(--m3d-border); opacity: 0.8; }
.mq-slot__spool { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; color: var(--m3d-text-subtle); box-shadow: inset 0 0 0 1px rgb(128 128 128 / 45%); }
.mq-slot--empty .mq-slot__spool { box-shadow: inset 0 0 0 1.5px var(--m3d-border-strong); border-style: dashed; }
.mq-tile .mq-slot__spool .frame-icon { color: inherit; }
.mq-slot__spool svg { width: 28px; height: 28px; }
.mq-slot__text { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.mq-slot__text b { font-size: 14px; font-weight: 600; }
.mq-slot__text span { overflow: hidden; color: var(--m3d-text-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.mq-slot__tag { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); white-space: nowrap; padding: 1px 7px; border-radius: 999px; background: var(--m3d-accent-soft); color: var(--m3d-accent); font-size: 10.5px; font-weight: 600; }

/* Position, Z offset, macros */
.mq-xyz { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.mq-xyz > div { display: flex; flex-direction: column; padding: 8px 12px; border-radius: 14px; background: var(--m3d-surface-2); }
.mq-xyz span { color: var(--m3d-accent); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.mq-xyz b { font-family: var(--m3d-font-mono); font-size: 20px; font-weight: 500; font-variant-numeric: tabular-nums; }
.mq-xyz small { color: var(--m3d-text-subtle); font-size: 11px; }
.mq-zoff { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.mq-step { display: inline-flex; gap: 8px; }
.mq-round { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--m3d-surface-2); cursor: pointer; }
.mq-round .frame-icon { color: var(--m3d-text); }
.mq-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mq-chip { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 999px; background: var(--m3d-surface-2); color: var(--m3d-text); font-size: 13.5px; font-weight: 600; cursor: pointer; }
.mq-chip:hover { filter: brightness(1.12); }
.mq-chip--more { background: transparent; box-shadow: inset 0 0 0 1px var(--m3d-border-strong); color: var(--m3d-text-muted); }
.mq-chip--add { background: var(--m3d-accent-soft); color: var(--m3d-accent); }
.mq-chip--add .frame-icon { color: inherit; }

/* Jog pad */
.mq-jog { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 6px 0 2px; }
.mq-pad { display: grid; grid-template-columns: repeat(3, 52px); grid-template-rows: repeat(3, 52px); gap: 6px; }
.mq-pad__b { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 16px; background: var(--m3d-surface-2); cursor: pointer; }
.mq-pad__b .frame-icon { color: var(--m3d-text); }
.mq-pad__b:hover { filter: brightness(1.15); }
.mq-pad__n { grid-area: 1 / 2; } .mq-pad__w { grid-area: 2 / 1; } .mq-pad__c { grid-area: 2 / 2; background: var(--m3d-accent-soft); }
.mq-pad__c .frame-icon { color: var(--m3d-accent); }
.mq-pad__e { grid-area: 2 / 3; } .mq-pad__s { grid-area: 3 / 2; }
.mq-zcol { display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 6px; height: 166px; }
.mq-zcol__l { color: var(--m3d-text-muted); font-family: var(--m3d-font-mono); font-size: 12px; font-weight: 600; }
.mq-jog__foot { margin-top: auto; padding-top: 6px; }
.mq-range { max-width: 240px; }
.mq-chart-wait { height: 250px; }
/* Harness: in the light theme the chart's axis text comes out white on white on develop; shown legible here. A product bug to fix in the real build. */
.theme--light .mq-tile--graph .chart svg text { fill: var(--m3d-text-muted) !important; }

/* Graph */
.mq-track { display: flex; flex-wrap: wrap; gap: 8px; }
.mq-track__chip { display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px; border-radius: 999px; background: var(--m3d-surface-2); color: var(--m3d-text-muted); font-size: 12.5px; font-weight: 500; }
.mq-track__chip i { width: 9px; height: 9px; border-radius: 50%; }
.mq-track__chip b { color: var(--m3d-text); font-family: var(--m3d-font-mono); font-size: 12px; font-weight: 500; }
.mq-track__chip--add { background: transparent; box-shadow: inset 0 0 0 1px var(--m3d-border-strong); }

/* Edit mode */
.mq-tray { display: flex; flex-direction: column; gap: 10px; padding: 14px 18px; border-radius: 22px; background: var(--m3d-surface); box-shadow: inset 0 0 0 1px var(--m3d-border-strong); }
.mq-tray__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.mq-tray__head b { font-size: 15px; font-weight: 600; }
.mq-tray__head span { color: var(--m3d-text-muted); font-size: 13px; }
.mq-tray__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mq--edit .mq-tile { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3d-accent) 55%, transparent); }
.mq--edit .mq-tile--stage { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3d-accent) 55%, transparent); }
.mq--edit .mq-tile--stage::after { content: ''; position: absolute; inset: 0; border-radius: 22px; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3d-accent) 55%, transparent); pointer-events: none; z-index: 4; }
.mq--edit .mq-tile .mq-tile__head { padding-left: 26px; }
.mq--edit .mq-tile--stage .mq-seg { right: 12px; }
.mq--edit .ov-stage__badge { left: 50px !important; }
.mq-grip { position: absolute; top: 14px; left: 12px; z-index: 5; display: grid; grid-template-columns: repeat(2, 4px); gap: 3px; padding: 6px 5px; border-radius: 8px; background: var(--m3d-fill); cursor: grab; }
.mq-grip i { width: 4px; height: 4px; border-radius: 50%; background: var(--m3d-text-muted); }
.mq-resize { position: absolute; right: 8px; bottom: 8px; z-index: 5; width: 18px; height: 18px; border-radius: 6px; background: linear-gradient(135deg, transparent 0 48%, var(--m3d-accent) 48% 56%, transparent 56% 66%, var(--m3d-accent) 66% 74%, transparent 74%); cursor: nwse-resize; }

@media (max-width: 599px) {
  .mq-tile--hotend .mq-state, .mq-tile--bed .mq-state { display: none; }
  .mq-slots { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mq-value { font-size: 26px; }
  .mq-head__sub { flex-basis: 100%; order: 3; }
  .mq-pad { grid-template-columns: repeat(3, 56px); grid-template-rows: repeat(3, 56px); }
  .mq-pad__b { width: 56px; height: 56px; }
  .mq-zcol { height: 180px; }
}
</style>
