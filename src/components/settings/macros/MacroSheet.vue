<template>
  <app-dialog
    :value="true"
    :title="title"
    :sub-title="subTitle"
    max-width="480"
    no-actions
    data-tid="macro-sheet"
    @input="!$event && $emit('close')"
  >
    <v-card-text class="pa-0">
      <p class="msheet__over">
        {{ sectionName }}
      </p>
      <app-setting title="Name in Control">
        <v-text-field
          :value="macro.alias"
          :placeholder="macro.name.toUpperCase()"
          dense
          filled
          hide-details
          aria-label="Name in Control"
          data-tid="macro-sheet-alias"
          :disabled="readOnly"
          @change="save({ alias: $event })"
        />
      </app-setting>
      <v-divider />
      <app-setting title="Section">
        <v-select
          :value="sectionId"
          :items="sections"
          item-value="id"
          item-text="name"
          dense
          filled
          hide-details
          aria-label="Section"
          data-tid="macro-sheet-section"
          :disabled="readOnly"
          @change="$emit('move', $event)"
        />
      </app-setting>
      <v-divider />
      <app-setting title="Colour">
        <app-btn
          outlined
          small
          color="primary"
          class="mr-1"
          :disabled="readOnly"
          @click="save({ color: '' })"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
        <app-color-picker
          :value="colour"
          :title="$t('app.general.btn.set_color')"
          :disabled="readOnly"
          @input="save({ color: $event })"
        />
      </app-setting>
      <v-divider />
      <app-setting title="Shown">
        <v-switch
          :input-value="macro.visible"
          class="mt-0 pt-0"
          hide-details
          aria-label="Shown"
          data-tid="macro-sheet-shown"
          :disabled="readOnly"
          @change="save({ visible: !!$event })"
        />
      </app-setting>
      <v-divider />
      <app-setting
        title="Not while printing"
        sub-title="Greyed out during a print"
      >
        <v-switch
          :input-value="!!macro.disabledWhilePrinting"
          class="mt-0 pt-0"
          hide-details
          aria-label="Not while printing"
          data-tid="macro-sheet-not-printing"
          :disabled="readOnly"
          @change="save({ disabledWhilePrinting: !!$event })"
        />
      </app-setting>
      <v-divider />
      <div class="msheet__code">
        <h3>What it does</h3>
        <pre
          data-tid="macro-sheet-code"
          aria-label="The command's code, read-only"
        >{{ code }}</pre>
      </div>
      <p
        v-if="editLock"
        class="msheet__lock"
        data-tid="macro-sheet-lock"
      >
        {{ editLock }}
        <router-link
          v-if="!editable"
          :to="developerTo"
        >
          Developer mode
        </router-link>
      </p>
      <div class="msheet__actions">
        <app-btn
          outlined
          :disabled="!!editLock"
          data-tid="macro-sheet-edit"
          @click="$emit('edit')"
        >
          <frame-icon
            v-if="!editable"
            name="lock"
            small
          />
          Edit in Files
        </app-btn>
        <app-btn
          color="primary"
          data-tid="macro-sheet-done"
          @click="$emit('close')"
        >
          Done
        </app-btn>
      </div>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { Macro } from '@/store/macros/types'
import type { MacroPlace } from '@/services/macros/locate'
import type { MacroSection } from './macro-sections'

/**
 * A macro, opened from Settings › Macros: what Control calls it, its
 * section, colour, whether it's shown and greyed out while printing, and
 * its code, read-only. Edit in Files opens the editor at its line, which
 * on a Muon printer needs developer mode.
 */
@Component({})
export default class MacroSheet extends Vue {
  @Prop({ type: Object, required: true })
  readonly macro!: Macro

  @Prop({ type: Array, required: true })
  readonly sections!: MacroSection[]

  @Prop({ type: String, required: true })
  readonly sectionId!: string

  @Prop({ type: Object })
  readonly place?: MacroPlace

  @Prop({ type: Boolean })
  readonly editable!: boolean

  @Prop({ type: Boolean })
  readonly readOnly!: boolean

  @Prop({ type: String, required: true })
  readonly developerTo!: string

  get title (): string {
    return this.macro.alias || this.macro.name.toUpperCase()
  }

  get subTitle (): string {
    const place = this.place ? ` · ${this.place.path} line ${this.place.line}` : ''
    return `${this.macro.name.toUpperCase()}${place}`
  }

  get sectionName (): string {
    return this.sections.find(s => s.id === this.sectionId)?.name ?? ''
  }

  get code (): string {
    const gcode = this.macro.config?.gcode
    return typeof gcode === 'string' && gcode.trim() ? gcode.trim() : 'The printer hasn\'t said what this command does.'
  }

  get colour (): string | undefined {
    return this.macro.color || this.$vuetify.theme.currentTheme.secondary?.toString()
  }

  /** Why Edit in Files can't open, or nothing when it can. */
  get editLock (): string {
    if (!this.editable) return 'Editing what a command does needs developer mode on a Muon printer.'
    if (!this.place) return 'This command wasn\'t found in the config files.'
    return ''
  }

  save (change: Partial<Macro>) {
    this.$store.dispatch('macros/saveMacro', { ...this.macro, ...change })
  }
}
</script>

<style lang="scss" scoped>
  .msheet__over {
    margin: 0;
    padding: 12px 16px 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  .msheet__code {
    padding: 12px 16px 0;

    h3 {
      margin: 0 0 6px;
      color: var(--m3d-text-muted);
      font-size: 12px;
      font-weight: 600;
    }

    pre {
      max-height: 240px;
      margin: 0;
      padding: 10px 12px;
      overflow: auto;
      border-radius: 12px;
      background: var(--m3d-surface-2);
      font-family: var(--m3d-font-mono, monospace);
      font-size: 12px;
      white-space: pre-wrap;
      user-select: text;
    }
  }

  .msheet__lock {
    margin: 10px 16px 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .msheet__actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 16px 16px;
  }
</style>
