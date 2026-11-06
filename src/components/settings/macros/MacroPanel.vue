<template>
  <section
    id="macros"
    class="mpanel"
    data-tid="macro-panel"
  >
    <header class="mpanel__head">
      <div>
        <h2>Macros</h2>
        <p>{{ headline }}</p>
      </div>
      <div class="mpanel__tools">
        <label class="mpanel__find">
          <frame-icon
            name="search"
            small
          />
          <input
            v-model="query"
            type="search"
            placeholder="Find"
            aria-label="Find a macro"
          >
        </label>
        <button
          type="button"
          class="cbtn"
          data-tid="macro-add-category"
          :disabled="!connected"
          @click="addCategory"
        >
          <frame-icon
            name="plus"
            small
          />
          Add a category
        </button>
      </div>
    </header>

    <p
      v-if="!editable"
      class="mpanel__note"
      data-tid="macro-edit-readonly"
    >
      Developer mode is off, so each macro opens to read. Turn developer mode on to change them.
      <router-link :to="developerTo">
        Developer mode
      </router-link>
    </p>

    <p class="mpanel__hint">
      Click a macro to choose it, double-click (or Enter) to open it, and drag it to another section to move it.
    </p>

    <p
      v-if="allMacros.length && !connected"
      class="mpanel__note"
      data-tid="macro-panel-offline"
    >
      The printer isn't connected, so these can't be moved or hidden until it's back.
    </p>
    <p
      v-if="!allMacros.length"
      class="mpanel__note"
      data-tid="macro-panel-empty"
    >
      {{ connected ? 'This printer has no macros yet. A [gcode_macro] in its config shows here.' : 'The printer isn\'t connected, so its macros can\'t be listed.' }}
    </p>

    <section
      v-for="section in sections"
      :key="section.id"
      class="mpanel__section"
      :class="{ 'mpanel__section--drop': dropOn === section.id }"
      :data-tid="`macro-section-${section.id}`"
      :data-section="section.name"
      @dragover="onDragOver($event, section.id)"
      @dragleave="onDragLeave($event, section.id)"
      @drop="onDrop($event, section.id)"
    >
      <header class="mpanel__section-head">
        <h3>
          {{ section.name }}
          <span :data-tid="`macro-section-count-${section.id}`">{{ section.visible }} of {{ section.count }} shown</span>
        </h3>
        <v-menu
          offset-y
          left
        >
          <template #activator="{ on, attrs }">
            <button
              type="button"
              class="mpanel__more"
              :aria-label="`${section.name}: more`"
              :data-tid="`macro-section-menu-${section.id}`"
              v-bind="attrs"
              v-on="on"
            >
              <frame-icon
                name="more"
                small
              />
            </button>
          </template>
          <v-list dense>
            <v-list-item
              v-if="section.id !== '0'"
              data-tid="macro-category-rename"
              @click="renameCategory(section)"
            >
              <v-list-item-title>Rename…</v-list-item-title>
            </v-list-item>
            <v-list-item
              :disabled="!section.count"
              data-tid="macro-section-all-on"
              @click="setAllVisible(section, true)"
            >
              <v-list-item-title>Show all on the dashboard</v-list-item-title>
            </v-list-item>
            <v-list-item
              :disabled="!section.count"
              data-tid="macro-section-all-off"
              @click="setAllVisible(section, false)"
            >
              <v-list-item-title>Hide all from the dashboard</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="section.id !== '0'"
              data-tid="macro-category-remove"
              @click="removeCategory(section)"
            >
              <v-list-item-title>Remove the category</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </header>

      <div
        role="listbox"
        :aria-label="section.name"
        class="mpanel__rows"
      >
        <div
          v-for="m in section.macros"
          :key="m.name"
          role="option"
          class="mpanel__row"
          :class="{ 'mpanel__row--selected': selected === m.name, 'mpanel__row--dragging': dragging === m.name }"
          :aria-selected="selected === m.name ? 'true' : 'false'"
          :tabindex="selected === m.name || (!selected && m.name === firstName) ? 0 : -1"
          :data-tid="`macro-row-${m.name}`"
          :draggable="connected ? 'true' : 'false'"
          @click="select(m.name)"
          @dblclick="open(m)"
          @keydown="onKey($event, m)"
          @dragstart="onDragStart($event, m.name)"
          @dragend="onDragEnd"
          @dragover="onDragOver($event, section.id)"
          @drop.stop="onDrop($event, section.id, m.name)"
        >
          <div class="mpanel__what">
            <b>{{ titleOf(m) }}</b>
            <span>{{ m.name }}{{ placeText(m.name) }}</span>
          </div>
          <v-switch
            :input-value="m.visible"
            hide-details
            dense
            class="mpanel__shown mt-0 pt-0"
            :aria-label="`Show ${titleOf(m)} on the dashboard`"
            :disabled="!connected"
            :data-tid="`macro-visible-${m.name}`"
            @click.native.stop
            @dblclick.native.stop
            @change="setVisible(m, $event)"
          />
          <v-menu
            offset-y
            left
          >
            <template #activator="{ on, attrs }">
              <button
                type="button"
                class="mpanel__more"
                :aria-label="`${titleOf(m)}: more`"
                :data-tid="`macro-menu-${m.name}`"
                v-bind="attrs"
                @dblclick.stop
                v-on="on"
              >
                <frame-icon
                  name="more"
                  small
                />
              </button>
            </template>
            <v-list dense>
              <v-list-item
                :disabled="!placeOf(m.name)"
                data-tid="macro-open"
                @click="openInEditor(m.name)"
              >
                <v-list-item-title>{{ editable ? 'Open in the editor' : 'Open to read' }}</v-list-item-title>
              </v-list-item>
              <v-list-item
                data-tid="macro-details"
                @click="openDetails(m)"
              >
                <v-list-item-title>Details…</v-list-item-title>
              </v-list-item>
              <v-list-item
                data-tid="macro-move"
                :disabled="!connected"
                @click="moveFor = m"
              >
                <v-list-item-title>Move to…</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <p
          v-if="!section.macros.length"
          class="mpanel__empty"
        >
          {{ query ? 'None found here.' : 'None yet. Drag a macro here, or use its Move to….' }}
        </p>
      </div>
    </section>

    <p
      v-if="error"
      class="mpanel__note"
      data-tid="macro-panel-error"
    >
      {{ error }}
      <button
        type="button"
        class="cbtn"
        @click="load"
      >
        Try again
      </button>
    </p>

    <app-dialog
      v-if="moveFor"
      :value="!!moveFor"
      :title="`Move ${titleOf(moveFor)} to`"
      max-width="360"
      no-actions
      @input="moveFor = $event ? moveFor : null"
    >
      <v-list data-tid="macro-move-to">
        <v-list-item
          v-for="section in sections"
          :key="section.id"
          :disabled="sectionOf(moveFor) === section.id"
          :data-tid="`macro-move-to-${section.id}`"
          @click="moveTo(moveFor.name, section.id)"
        >
          <v-list-item-title>{{ section.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </app-dialog>

    <macro-settings-dialog
      v-if="details"
      :key="details.name"
      :value="!!details"
      :macro="details"
      @input="details = $event ? details : null"
    />

    <macro-category-dialog
      v-if="categoryDialog.open"
      v-model="categoryDialog.open"
      :title="categoryDialog.title"
      :label="$t('app.general.label.name')"
      :name="categoryDialog.name"
      @save="categoryDialog.save"
    />
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MacroCategoryDialog from './MacroCategoryDialog.vue'
import MacroSettingsDialog from './MacroSettingsDialog.vue'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import { macroPlacesOn } from '@/services/macros/places'
import type { MacroPlace } from '@/services/macros/locate'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import type { Macro, MacroCategory } from '@/store/macros/types'
import { macroSections, macrosMovedTo, type MacroSection } from './macro-sections'

/**
 * Settings › Macros, as one panel: every category a section, and
 * Uncategorised the last. A macro is chosen with a click and opened (in
 * the Files editor, at its [gcode_macro] line) with a double-click or
 * Enter; dragged, or moved with its Move to…, into another section; and
 * shown on, or hidden from, the dashboard. With developer mode off the
 * macros open to read: the Muon3D defaults can't be changed.
 */
@Component({
  components: { MacroCategoryDialog, MacroSettingsDialog }
})
export default class MacroPanel extends Mixins(StateMixin) {
  query = ''
  places: Map<string, MacroPlace> = new Map()
  error = ''
  dev = devModeState
  selected: string | null = null
  dragging: string | null = null
  dropOn: string | null = null
  moveFor: Macro | null = null
  details: Macro | null = null
  categoryDialog: { open: boolean, title: string, name: string, save: (name: string) => void } = {
    open: false,
    title: '',
    name: '',
    save: () => undefined
  }

  mounted () {
    refreshDevMode().then(() => this.load())
  }

  get connected (): boolean {
    return this.$store.state.socket.open === true
  }

  get registered (): string[] {
    return (this.$store.state.server.info.registered_directories as string[] | undefined) ?? []
  }

  /** Where the macros are read from: the editable copy in developer mode, else the defaults the printer runs. */
  get root (): string {
    if (this.dev.enabled || !this.registered.includes('defaults')) return 'config'
    return 'defaults'
  }

  /** The config folder is the printer's to change unless developer mode says it's off (an M1's copy is read only then). */
  get editable (): boolean {
    return this.root === 'config' && this.dev.enabled !== false
  }

  @Watch('root')
  onRoot () {
    this.load()
  }

  async load () {
    this.error = ''
    try {
      this.places = await macroPlacesOn(this.root)
    } catch {
      this.error = 'The printer didn\'t list its config files, so the macros can\'t be opened yet.'
    }
  }

  get allMacros (): Macro[] {
    return this.$store.getters['macros/getMacros'] as Macro[]
  }

  get sections (): MacroSection[] {
    return macroSections(
      this.$store.getters['macros/getCategories'] as MacroCategory[],
      (id: string) => this.$store.getters['macros/getMacrosByCategory'](id) as Macro[],
      this.$t('app.general.label.uncategorized').toString(),
      this.query
    )
  }

  get headline (): string {
    const n = this.allMacros.length
    const c = this.sections.length
    return `${n} ${n === 1 ? 'macro' : 'macros'} in ${c} ${c === 1 ? 'section' : 'sections'}`
  }

  get order (): Macro[] {
    return this.sections.flatMap(s => s.macros)
  }

  get firstName (): string | undefined {
    return this.order[0]?.name
  }

  titleOf (m: Macro): string {
    return m.alias || m.name.toUpperCase()
  }

  sectionOf (m: Macro): string {
    return m.categoryId && m.category ? m.categoryId : '0'
  }

  placeOf (name: string): MacroPlace | undefined {
    return this.places.get(name.toUpperCase())
  }

  /** " · macros/filament.cfg:49", or nothing until it's found. */
  placeText (name: string): string {
    const place = this.placeOf(name)
    return place ? ` · ${place.path}:${place.line}` : ''
  }

  get developerTo (): string {
    return `${scopedPath('/settings', activeSlug())}#developer`
  }

  select (name: string) {
    this.selected = name
  }

  /** Opens it where it's written; one not found in the config files opens its details. */
  open (m: Macro) {
    this.selected = m.name
    if (this.placeOf(m.name)) this.openInEditor(m.name)
    else this.openDetails(m)
  }

  openInEditor (name: string) {
    const place = this.placeOf(name)
    if (!place) return
    this.$router.push({
      path: scopedPath('/configure', activeSlug()),
      query: { open: `${place.root}/${place.path}`, line: String(place.line) }
    })
  }

  openDetails (m: Macro) {
    this.details = m
  }

  onKey (event: KeyboardEvent, m: Macro) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter') {
      event.preventDefault()
      this.open(m)
      return
    }
    if (event.key === ' ') {
      event.preventDefault()
      this.select(m.name)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const i = this.order.findIndex(o => o.name === m.name)
    const next = this.order[i + (event.key === 'ArrowDown' ? 1 : -1)]
    if (!next) return
    this.select(next.name)
    this.$nextTick(() => {
      (this.$el.querySelector(`[data-tid=${JSON.stringify(`macro-row-${next.name}`)}]`) as HTMLElement | null)?.focus()
    })
  }

  onDragStart (event: DragEvent, name: string) {
    this.dragging = name
    this.selected = name
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', name)
    }
  }

  onDragEnd () {
    this.dragging = null
    this.dropOn = null
  }

  onDragOver (event: DragEvent, sectionId: string) {
    if (!this.dragging) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    this.dropOn = sectionId
  }

  onDragLeave (event: DragEvent, sectionId: string) {
    const to = event.relatedTarget as Node | null
    if (to && (event.currentTarget as HTMLElement).contains(to)) return
    if (this.dropOn === sectionId) this.dropOn = null
  }

  onDrop (event: DragEvent, sectionId: string, before?: string) {
    const name = this.dragging || event.dataTransfer?.getData('text/plain')
    this.onDragEnd()
    if (!name || !this.connected) return
    event.preventDefault()
    this.moveTo(name, sectionId, before)
  }

  /** Moves the macro into the section, before `before` (or last), and saves the section's order. */
  moveTo (name: string, sectionId: string, before?: string) {
    this.moveFor = null
    const macros = macrosMovedTo(
      this.allMacros,
      (id: string) => this.$store.getters['macros/getMacrosByCategory'](id) as Macro[],
      name,
      sectionId,
      before
    )
    if (!macros) return
    this.selected = name
    this.$store.dispatch('macros/saveAllOrder', macros)
  }

  setVisible (m: Macro, visible: boolean) {
    this.$store.dispatch('macros/saveMacro', { ...m, visible: !!visible })
  }

  setAllVisible (section: MacroSection, visible: boolean) {
    const macros = this.$store.getters['macros/getMacrosByCategory'](section.id) as Macro[]
    this.$store.dispatch(visible ? 'macros/saveAllOn' : 'macros/saveAllOff', macros)
  }

  addCategory () {
    this.categoryDialog = {
      open: true,
      title: this.$t('app.general.label.add_category').toString(),
      name: '',
      save: (name: string) => this.$store.dispatch('macros/addCategory', name)
    }
  }

  renameCategory (section: MacroSection) {
    this.categoryDialog = {
      open: true,
      title: this.$t('app.general.label.edit_category').toString(),
      name: section.name,
      save: (name: string) => this.$store.dispatch('macros/editCategory', { id: section.id, name })
    }
  }

  removeCategory (section: MacroSection) {
    this.$store.dispatch('macros/removeCategory', { id: section.id, name: section.name })
  }
}
</script>

<style lang="scss" scoped>
  .mpanel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .mpanel__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .mpanel__tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mpanel__find {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 160px;
    height: 32px;
    padding: 0 10px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 13px;
    }
  }

  .mpanel__note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 13px;

    a {
      color: var(--m3d-accent) !important;
      font-weight: 600;
    }
  }

  .mpanel__hint {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .mpanel__section {
    padding: 4px 10px 6px;
    border: 1px solid var(--m3d-border);
    border-radius: 14px;
  }

  .mpanel__section--drop {
    border-style: dashed;
    border-color: var(--m3d-accent);
  }

  .mpanel__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 6px 0 2px;
      color: var(--m3d-text-muted);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;

      span {
        margin-left: 6px;
        color: var(--m3d-text-subtle);
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
      }
    }
  }

  .mpanel__more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover,
    &:focus-visible {
      background: var(--m3d-surface-2);
    }
  }

  .mpanel__row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 0 6px;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: -2px;
    }
  }

  .mpanel__row--selected {
    background: var(--m3d-surface-2);
  }

  .mpanel__row--dragging {
    opacity: 0.5;
  }

  .mpanel__what {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;

    b {
      font-size: 14px;
      font-weight: 600;
    }

    span {
      overflow: hidden;
      color: var(--m3d-text-subtle);
      font-family: var(--m3d-font-mono);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .mpanel__shown {
    flex: 0 0 auto;
  }

  .mpanel__empty {
    margin: 0;
    padding: 10px 6px;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }
</style>
