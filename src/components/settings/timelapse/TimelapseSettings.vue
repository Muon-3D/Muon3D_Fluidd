<template>
  <div
    id="timelapse"
    class="m3-sets"
    data-tid="timelapse-settings"
  >
    <p
      v-if="!connected"
      class="m3-set__intro"
      data-tid="timelapse-offline"
    >
      The printer isn't connected, so these can't be changed until it's back.
    </p>
    <fieldset
      class="m3-sets__fieldset"
      :disabled="!connected"
    >
      <section class="m3-set">
        <h2 class="m3-set__title">
          Filming
        </h2>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Film every print</b>
            <span>{{ sub('enabled', 'Each layer adds about 2 s to the print.') }}</span>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="!!settings.enabled"
              :disabled="blocked('enabled')"
              label="Film every print"
              data-tid="timelapse-setting-enabled"
              @input="post({ enabled: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Camera</b>
            <span v-if="blocked('camera')">{{ managed }}</span>
          </div>
          <div
            class="m3-set__control m3-set__control--wide"
            data-tid="timelapse-camera"
          >
            <v-select
              outlined
              dense
              hide-details
              :items="cameras"
              :value="settings.camera"
              :disabled="blocked('camera')"
              @change="post({ camera: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Take a frame</b>
            <span>{{ sub('mode', 'Each layer moves the head out of the shot. Every few seconds keeps printing.') }}</span>
          </div>
          <div class="m3-set__control">
            <seg-picker
              :value="settings.mode"
              :options="modes"
              :disabled="blocked('mode')"
              label="Take a frame"
              data-tid="timelapse-mode"
              @input="post({ mode: $event })"
            />
          </div>
        </div>
        <div
          v-if="hyperlapse"
          class="m3-set__row"
        >
          <div class="m3-set__label">
            <b>Seconds between frames</b>
            <span v-if="blocked('hyperlapse_cycle')">{{ managed }}</span>
          </div>
          <div class="m3-set__control">
            <number-field
              :value="num(settings.hyperlapse_cycle)"
              unit="s"
              :min="1"
              :disabled="blocked('hyperlapse_cycle')"
              label="Seconds between frames"
              data-tid="timelapse-cycle"
              @change="post({ hyperlapse_cycle: $event })"
            />
          </div>
        </div>
        <template v-if="!hyperlapse">
          <div
            class="m3-set__row"
            data-tid="timelapse-parkhead-row"
          >
            <div class="m3-set__label">
              <b>Move the head out of the shot</b>
              <span>{{ sub('parkhead', 'Parks it for each frame, so the print is in view.') }}</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="!!settings.parkhead"
                :disabled="blocked('parkhead')"
                label="Move the head out of the shot"
                data-tid="timelapse-parkhead"
                @input="post({ parkhead: $event })"
              />
            </div>
          </div>
          <template v-if="settings.parkhead">
            <div
              class="m3-set__row"
              data-tid="timelapse-parkpos-row"
            >
              <div class="m3-set__label">
                <b>Where it parks</b>
                <span v-if="blocked('parkpos')">{{ managed }}</span>
              </div>
              <div
                v-if="muon && !devModeEnabled"
                class="m3-set__control tset__value"
                data-tid="timelapse-parkpos-muon"
              >
                Muon default
              </div>
              <div
                v-else
                class="m3-set__control m3-set__control--wide"
                data-tid="timelapse-parkpos"
              >
                <v-select
                  outlined
                  dense
                  hide-details
                  :items="parkPositions"
                  :value="settings.parkpos"
                  :disabled="blocked('parkpos')"
                  @change="post({ parkpos: $event })"
                />
              </div>
            </div>
            <div class="m3-set__row">
              <div class="m3-set__label">
                <b>How long it waits there</b>
                <span v-if="blocked('park_time')">{{ managed }}</span>
              </div>
              <div class="m3-set__control">
                <number-field
                  :value="ms(settings.park_time)"
                  unit="ms"
                  :min="0"
                  :disabled="blocked('park_time')"
                  label="How long it waits there"
                  @change="post({ park_time: $event / 1000 })"
                />
              </div>
            </div>
          </template>
        </template>
      </section>

      <section class="m3-set">
        <h2 class="m3-set__title">
          The video
        </h2>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Length</b>
            <span v-if="renderBlocked">{{ managed }}</span>
            <span v-else-if="!videoLength && settings.variable_fps">Now {{ settings.targetlength }} s.</span>
            <span v-else-if="!videoLength">Now every frame at {{ settings.output_framerate }} fps.</span>
          </div>
          <div class="m3-set__control">
            <seg-picker
              :value="videoLength"
              :options="lengths"
              :disabled="renderBlocked"
              label="Length"
              data-tid="timelapse-length"
              @input="setLength"
            />
          </div>
        </div>
        <div
          v-if="settings.variable_fps"
          class="m3-set__row"
        >
          <div class="m3-set__label">
            <b>Frame rate, between</b>
            <span>{{ sub('variable_fps_min', 'Sped up or slowed to fit the length.') }}</span>
          </div>
          <div class="m3-set__control tset__pair">
            <number-field
              :value="num(settings.variable_fps_min)"
              unit="fps"
              :min="1"
              :disabled="blocked('variable_fps_min')"
              label="Lowest frame rate"
              @change="post({ variable_fps_min: $event })"
            />
            <number-field
              :value="num(settings.variable_fps_max)"
              unit="fps"
              :min="1"
              :disabled="blocked('variable_fps_max')"
              label="Highest frame rate"
              @change="post({ variable_fps_max: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Hold the finished print</b>
            <span>{{ sub('duplicatelastframe', 'Repeats the last frame at the end.') }}</span>
          </div>
          <div class="m3-set__control">
            <number-field
              :value="num(settings.duplicatelastframe)"
              unit="frames"
              :min="0"
              :disabled="blocked('duplicatelastframe')"
              label="Hold the finished print"
              data-tid="timelapse-hold"
              @change="post({ duplicatelastframe: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Quality</b>
            <span>{{ sub('constant_rate_factor', `CRF ${settings.constant_rate_factor}: lower is sharper and bigger.`) }}</span>
          </div>
          <div class="m3-set__control">
            <seg-picker
              :value="videoQuality"
              :options="qualities"
              :disabled="blocked('constant_rate_factor')"
              label="Quality"
              data-tid="timelapse-quality"
              @input="setQuality"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Keep the single frames</b>
            <span>{{ sub('saveframes', 'A zip of every frame, next to the video.') }}</span>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="!!settings.saveframes"
              :disabled="blocked('saveframes')"
              label="Keep the single frames"
              data-tid="timelapse-saveframes"
              @input="post({ saveframes: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Make the video when the print ends</b>
            <span v-if="blocked('autorender')">{{ managed }}</span>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="!!settings.autorender"
              :disabled="blocked('autorender')"
              label="Make the video when the print ends"
              data-tid="timelapse-setting-autorender"
              @input="post({ autorender: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Use the last frame as the picture</b>
            <span>{{ sub('previewimage', 'The video\'s picture in Timelapse.') }}</span>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="!!settings.previewimage"
              :disabled="blocked('previewimage')"
              label="Use the last frame as the picture"
              @input="post({ previewimage: $event })"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Start again</b>
            <span>These settings back to how they came, except those set in moonraker.conf.</span>
          </div>
          <div class="m3-set__control">
            <button
              type="button"
              class="cbtn cbtn--ghost"
              data-tid="timelapse-reset"
              @click="handleReset"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section
        class="m3-set"
        data-tid="timelapse-developer"
      >
        <h2 class="m3-set__title">
          {{ muon ? 'Developer mode only' : 'Parking and G-code' }}
        </h2>
        <div
          v-if="muon && !devModeEnabled"
          class="tset__locked"
        >
          <locked-row
            label="Custom park position, Z-hop and park speed"
            reason-text="An M1 parks where the camera sees the whole plate."
          />
          <locked-row label="Retract and push back while parked" />
          <locked-row label="Delay compensation and verbose G-code" />
        </div>
        <template v-else>
          <div
            v-if="muon"
            class="m3-set__row"
          >
            <div class="m3-set__label">
              <b>Where it parks</b>
            </div>
            <div class="m3-set__control tset__value">
              Above, under Filming
            </div>
          </div>
          <div
            v-if="customPark"
            class="m3-set__row"
          >
            <div class="m3-set__label">
              <b>Custom park position</b>
              <span>{{ sub('park_custom_pos_x', 'X and Y, mm.') }}</span>
            </div>
            <div class="m3-set__control tset__pair">
              <number-field
                v-if="settings.parkpos !== 'y_only'"
                :value="num(settings.park_custom_pos_x)"
                unit="mm"
                :min="bed.minX"
                :max="bed.maxX"
                :disabled="blocked('park_custom_pos_x')"
                label="Park X"
                @change="post({ park_custom_pos_x: $event })"
              />
              <number-field
                v-if="settings.parkpos !== 'x_only'"
                :value="num(settings.park_custom_pos_y)"
                unit="mm"
                :min="bed.minY"
                :max="bed.maxY"
                :disabled="blocked('park_custom_pos_y')"
                label="Park Y"
                @change="post({ park_custom_pos_y: $event })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Z-hop while parked</b>
              <span v-if="blocked('park_custom_pos_dz')">{{ managed }}</span>
            </div>
            <div class="m3-set__control">
              <number-field
                :value="num(settings.park_custom_pos_dz)"
                unit="mm"
                :min="0"
                :decimals="1"
                :disabled="blocked('park_custom_pos_dz')"
                label="Z-hop while parked"
                data-tid="timelapse-zhop"
                @change="post({ park_custom_pos_dz: $event })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Park speed</b>
              <span v-if="blocked('park_travel_speed')">{{ managed }}</span>
            </div>
            <div class="m3-set__control">
              <number-field
                :value="num(settings.park_travel_speed)"
                unit="mm/s"
                :min="1"
                :disabled="blocked('park_travel_speed')"
                label="Park speed"
                @change="post({ park_travel_speed: $event })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Retract while parked</b>
              <span>{{ sub('park_retract_distance', 'Length and speed.') }}</span>
            </div>
            <div class="m3-set__control tset__pair">
              <number-field
                :value="num(settings.park_retract_distance)"
                unit="mm"
                :min="0"
                :decimals="1"
                :disabled="blocked('park_retract_distance')"
                label="Retract length"
                @change="post({ park_retract_distance: $event })"
              />
              <number-field
                :value="num(settings.park_retract_speed)"
                unit="mm/s"
                :min="1"
                :disabled="blocked('park_retract_speed')"
                label="Retract speed"
                @change="post({ park_retract_speed: $event })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Push back after parking</b>
              <span>{{ sub('park_extrude_distance', 'Length and speed.') }}</span>
            </div>
            <div class="m3-set__control tset__pair">
              <number-field
                :value="num(settings.park_extrude_distance)"
                unit="mm"
                :min="0"
                :decimals="1"
                :disabled="blocked('park_extrude_distance')"
                label="Push-back length"
                @change="post({ park_extrude_distance: $event })"
              />
              <number-field
                :value="num(settings.park_extrude_speed)"
                unit="mm/s"
                :min="1"
                :disabled="blocked('park_extrude_speed')"
                label="Push-back speed"
                @change="post({ park_extrude_speed: $event })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Use firmware retract</b>
              <span>{{ sub('fw_retract', 'G10/G11 instead of the lengths above.') }}</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="!!settings.fw_retract"
                :disabled="blocked('fw_retract')"
                label="Use firmware retract"
                @input="post({ fw_retract: $event })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Delay compensation</b>
              <span>{{ sub('stream_delay_compensation', 'Waits for the camera\'s stream to catch up.') }}</span>
            </div>
            <div class="m3-set__control">
              <number-field
                :value="ms(settings.stream_delay_compensation)"
                unit="ms"
                :min="0"
                :disabled="blocked('stream_delay_compensation')"
                label="Delay compensation"
                data-tid="timelapse-delay"
                @change="post({ stream_delay_compensation: $event / 1000 })"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Verbose G-code</b>
              <span>{{ sub('gcode_verbose', 'Timelapse macros echo what they do in the console.') }}</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="!!settings.gcode_verbose"
                :disabled="blocked('gcode_verbose')"
                label="Verbose G-code"
                data-tid="timelapse-verbose"
                @input="post({ gcode_verbose: $event })"
              />
            </div>
          </div>
        </template>
      </section>
    </fieldset>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import NumberField from '@/components/control/NumberField.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import LockedRow from '@/components/settings/gates/LockedRow.vue'
import MuonGatesMixin from '@/mixins/muon-gates'
import { defaultWritableSettings } from '@/store/timelapse/state'
import type { ParkPosition, TimelapseSettings as TimelapseSettingsType, TimelapseWritableSettings } from '@/store/timelapse/types'
import type { WebcamConfig } from '@/store/webcams/types'
import type { BedSize } from '@/store/printer/types'
import { VIDEO_LENGTHS, VIDEO_QUALITIES, videoLengthOf, videoQualityOf, type VideoLength, type VideoQuality } from '@/services/settings/timelapse-video'

const PARK_POSITIONS: ParkPosition[] = ['front_left', 'front_right', 'center', 'back_left', 'back_right', 'x_only', 'y_only', 'custom']

/**
 * Settings › Timelapse (settings/timelapse.md): Filming, The video, and the
 * parking and G-code details, which a Muon printer keeps under Developer
 * mode. Whatever moonraker.conf sets stays visible but can't be changed.
 */
@Component({
  components: { NumberField, SegPicker, ToggleSwitch, LockedRow }
})
export default class TimelapseSettings extends Mixins(MuonGatesMixin) {
  readonly managed = 'Set in moonraker.conf'

  /** Unknown counts as Muon: the locks show until the printer says otherwise. */
  get muon (): boolean {
    return this.isMuonPrinter !== false
  }

  get connected (): boolean {
    return this.$store.state.socket?.open === true
  }

  get settings (): Partial<TimelapseSettingsType> {
    return this.$store.getters['timelapse/getSettings'] ?? {}
  }

  blocked (key: keyof TimelapseWritableSettings): boolean {
    return !!this.$store.getters['timelapse/isBlockedSetting'](key)
  }

  sub (key: keyof TimelapseWritableSettings, text: string): string {
    return this.blocked(key) ? this.managed : text
  }

  num (value: unknown): number | null {
    return value === undefined || value === null || value === '' ? null : Number(value)
  }

  ms (seconds: unknown): number | null {
    const n = this.num(seconds)
    return n === null ? null : Math.round(n * 1000)
  }

  post (settings: Partial<TimelapseWritableSettings>) {
    SocketActions.machineTimelapseSetSettings(settings)
  }

  get hyperlapse (): boolean {
    return this.settings.mode === 'hyperlapse'
  }

  get modes (): SegOption[] {
    return [
      { value: 'layermacro', label: 'Each layer' },
      { value: 'hyperlapse', label: `Every ${this.settings.hyperlapse_cycle ?? 5} s` }
    ]
  }

  get cameras (): Array<{ text?: string, value: string, disabled: boolean }> {
    return (this.$store.getters['webcams/getWebcams'] as WebcamConfig[])
      .map(camera => ({ text: camera.name, value: camera.uid, disabled: !camera.enabled }))
  }

  get parkPositions (): Array<{ text: string, value: ParkPosition }> {
    return PARK_POSITIONS.map(value => ({ text: this.$tc(`app.timelapse.setting.parkpos.${value}`), value }))
  }

  get customPark (): boolean {
    return ['custom', 'x_only', 'y_only'].includes(this.settings.parkpos ?? '')
  }

  get bed (): BedSize {
    return this.$store.getters['printer/getBedSize'] ?? { minX: -Infinity, minY: -Infinity, maxX: Infinity, maxY: Infinity }
  }

  get renderBlocked (): boolean {
    return this.blocked('variable_fps') || this.blocked('targetlength') || this.blocked('output_framerate')
  }

  get lengths (): SegOption[] {
    return VIDEO_LENGTHS.map(l => ({ value: l.value, label: l.label }))
  }

  get videoLength (): VideoLength | null {
    return videoLengthOf(this.settings)
  }

  setLength (value: VideoLength) {
    const length = VIDEO_LENGTHS.find(l => l.value === value)
    if (length) this.post(length.settings)
  }

  get qualities (): SegOption[] {
    return VIDEO_QUALITIES.map(q => ({ value: q.value, label: q.label, title: `CRF ${q.crf}` }))
  }

  get videoQuality (): VideoQuality | null {
    return videoQualityOf(this.settings.constant_rate_factor)
  }

  setQuality (value: VideoQuality) {
    const quality = VIDEO_QUALITIES.find(q => q.value === value)
    if (quality) this.post({ constant_rate_factor: quality.crf })
  }

  handleReset () {
    const nonBlockedEntries = Object.entries(defaultWritableSettings())
      .filter(([key]) => !this.blocked(key as keyof TimelapseWritableSettings))
    this.post(Object.fromEntries(nonBlockedEntries))
  }
}
</script>

<style lang="scss" scoped>
  .m3-sets__fieldset {
    display: contents;
    border: 0;
  }

  .tset__value {
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .tset__pair {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .tset__locked {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 0 10px;
  }
</style>
