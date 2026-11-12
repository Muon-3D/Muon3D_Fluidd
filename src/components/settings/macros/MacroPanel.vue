<template>
  <section
    id="macros"
    class="mpanel"
    data-tid="macro-panel"
    @keydown.esc="clear"
    @keydown="onPanelKey"
    @click="onPanelClick"
  >
    <header class="mpanel__head">
      <div>
        <h2>Quick commands</h2>
        <p>Which quick commands Control shows, in which section, and what they're called</p>
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
            :placeholder="`Search ${allMacros.length} quick commands`"
            aria-label="Find a quick command"
          >
        </label>
        <button
          type="button"
          class="cbtn"
          data-tid="macro-add-category"
          :disabled="locked"
          @click="addCategory()"
        >
          <frame-icon
            name="plus"
            small
          />
          New section
        </button>
      </div>
    </header>

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
      {{ connected ? 'This printer has no quick commands yet. A [gcode_macro] in its config shows here.' : 'The printer isn\'t connected, so its quick commands can\'t be listed yet.' }}
    </p>

    <div
      class="mpanel__list"
      data-tid="macro-list"
    >
      <div
        class="mpanel__bar"
        :class="{ 'mpanel__bar--on': selected.length }"
        data-tid="macro-toolbar"
      >
        <template v-if="selected.length">
          <b data-tid="macro-selected-count">{{ selected.length }} selected</b>
          <button
            type="button"
            class="cbtn"
            data-tid="macro-toolbar-move"
            :disabled="locked"
            @click="moveFor = [...selected]"
          >
            Move to…
          </button>
          <button
            type="button"
            class="cbtn"
            data-tid="macro-toolbar-show"
            :disabled="locked"
            @click="setSelectedVisible(true)"
          >
            Show
          </button>
          <button
            type="button"
            class="cbtn"
            data-tid="macro-toolbar-hide"
            :disabled="locked"
            @click="setSelectedVisible(false)"
          >
            Hide
          </button>
          <button
            type="button"
            class="cbtn mpanel__done"
            data-tid="macro-toolbar-done"
            @click="clear"
          >
            Done
          </button>
        </template>
        <span
          v-else
          class="mpanel__hint"
        >Click selects · Ctrl/Shift adds · drag between sections · double-click opens</span>
      </div>

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
        <header
          class="mpanel__section-head"
          :draggable="section.id !== '0' && !locked ? 'true' : 'false'"
          :data-tid="`macro-section-head-${section.id}`"
          @dragstart="onSectionDragStart($event, section.id)"
          @dragend="onDragEnd"
        >
          <span
            v-if="section.id !== '0'"
            class="mpanel__grip"
            aria-hidden="true"
          />
          <h3>{{ section.name }}</h3>
          <span
            class="mpanel__count"
            :data-tid="`macro-section-count-${section.id}`"
          >{{ section.visible }} of {{ countOf(section) }} shown</span>
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
                :disabled="locked"
                @click="renameCategory(section)"
              >
                <v-list-item-title>Rename…</v-list-item-title>
              </v-list-item>
              <v-list-item
                :disabled="!section.count || locked"
                data-tid="macro-section-all-on"
                @click="setAllVisible(section, true)"
              >
                <v-list-item-title>Show all</v-list-item-title>
              </v-list-item>
              <v-list-item
                :disabled="!section.count || locked"
                data-tid="macro-section-all-off"
                @click="setAllVisible(section, false)"
              >
                <v-list-item-title>Hide all</v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="section.id !== '0'"
                data-tid="macro-category-remove"
                :disabled="locked"
                @click="removeCategory(section)"
              >
                <v-list-item-title>Remove</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </header>
        <div
          role="listbox"
          aria-multiselectable="true"
          :aria-label="section.name"
          class="mpanel__rows"
        >
          <div
            v-for="m in section.macros"
            :key="m.name"
            role="option"
            class="mpanel__row"
            :class="{ 'mpanel__row--selected': isSelected(m.name), 'mpanel__row--dragging': dragging.includes(m.name) }"
            :aria-selected="isSelected(m.name) ? 'true' : 'false'"
            :tabindex="m.name === focusName ? 0 : -1"
            :data-tid="`macro-row-${m.name}`"
            :draggable="locked ? 'false' : 'true'"
            @mousedown="onRowMouseDown"
            @click="onRowClick($event, m.name)"
            @dblclick="open(m)"
            @keydown="onKey($event, m)"
            @touchstart.passive="onPressStart(m.name)"
            @touchmove.passive="onPressEnd"
            @touchend="onPressEnd"
            @contextmenu="pressed && $event.preventDefault()"
            @dragstart="onDragStart($event, m.name)"
            @dragend="onDragEnd"
            @dragover="onDragOver($event, section.id)"
            @drop.stop="onDrop($event, section.id, m.name)"
          >
            <span
              class="mpanel__grip"
              aria-hidden="true"
            />
            <input
              type="checkbox"
              class="mpanel__check"
              :checked="isSelected(m.name)"
              :aria-label="`Select ${titleOf(m)}`"
              :data-tid="`macro-check-${m.name}`"
              @click.stop="toggle(m.name)"
              @dblclick.stop
            >
            <span
              class="mpanel__dot"
              :style="m.color ? { background: m.color } : undefined"
              aria-hidden="true"
            />
            <div class="mpanel__what">
              <b>{{ titleOf(m) }}</b>
              <span>{{ m.name.toUpperCase() }}{{ placeText(m.name) }}</span>
            </div>
            <span
              v-if="m.disabledWhilePrinting"
              class="mpanel__chip"
            >Not while printing</span>
            <v-switch
              :input-value="m.visible"
              hide-details
              dense
              class="mpanel__shown mt-0 pt-0"
              :aria-label="`Show ${titleOf(m)} on the dashboard`"
              :disabled="locked"
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
                  data-tid="macro-details"
                  @click="open(m)"
                >
                  <v-list-item-title>Open…</v-list-item-title>
                </v-list-item>
                <v-list-item
                  data-tid="macro-move"
                  :disabled="locked"
                  @click="moveFor = [m.name]"
                >
                  <v-list-item-title>Move to…</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <template v-if="section.id === '0'">
            <div
              v-for="name in shownHidden"
              :key="name"
              class="mpanel__row mpanel__row--hidden"
              :data-tid="`macro-hidden-${name}`"
            >
              <span
                class="mpanel__grip"
                aria-hidden="true"
              />
              <span
                class="mpanel__dot"
                aria-hidden="true"
              />
              <div class="mpanel__what">
                <b class="mpanel__mono">{{ name.toUpperCase() }}</b>
                <span>Starts with _ : hidden from everyone, can't be shown</span>
              </div>
              <frame-icon
                name="lock"
                small
                aria-label="Can't be shown"
              />
            </div>
            <button
              v-if="hiddenMacros.length > shownHidden.length"
              type="button"
              class="mpanel__more-rows"
              data-tid="macro-hidden-more"
              @click="allHidden = true"
            >
              + {{ hiddenMacros.length - shownHidden.length }} more
            </button>
          </template>
          <p
            v-if="!section.macros.length && !(section.id === '0' && hiddenMacros.length)"
            class="mpanel__empty"
          >
            {{ query ? 'None found here.' : 'None yet. Drag a command here, or use its Move to….' }}
          </p>
        </div>
      </section>
    </div>

    <p class="mpanel__foot">
      Shown commands appear in Quick commands and in Quick actions, in this order. Sections are saved on the printer, for everyone.
    </p>

    <p
      v-if="!editable"
      class="mpanel__note"
      data-tid="macro-edit-readonly"
    >
      <b>Editing what a command does</b> needs developer mode on a Muon printer. Non-Muon printers open the file straight away.
      <router-link :to="developerTo">
        Developer mode ›
      </router-link>
    </p>

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
      :title="moveFor.length === 1 ? `Move ${titleOfName(moveFor[0])} to` : `Move ${moveFor.length} commands to`"
      max-width="360"
      no-actions
      @input="moveFor = $event ? moveFor : null"
    >
      <v-list data-tid="macro-move-to">
        <v-list-item
          v-for="section in sections"
          :key="section.id"
          :data-tid="`macro-move-to-${section.id}`"
          :disabled="allIn(moveFor, section.id)"
          @click="moveTo(moveFor, section.id)"
        >
          <v-list-item-title>{{ section.name }}</v-list-item-title>
          <v-list-item-action v-if="allIn(moveFor, section.id)">
            <frame-icon
              name="check"
              small
            />
          </v-list-item-action>
        </v-list-item>
        <v-list-item
          data-tid="macro-move-to-new"
          @click="addCategory(moveFor)"
        >
          <v-list-item-title>New section…</v-list-item-title>
        </v-list-item>
      </v-list>
    </app-dialog>
    <macro-sheet
      v-if="sheetMacro"
      :key="sheetMacro.name"
      :macro="sheetMacro"
      :sections="sections"
      :section-id="sectionOf(sheetMacro)"
      :place="placeOf(sheetMacro.name)"
      :editable="editable"
      :read-only="locked"
      :developer-to="developerTo"
      @move="moveTo([sheetMacro.name], $event)"
      @edit="openInEditor(sheetMacro.name)"
      @close="sheetFor = null"
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
import MacroSheet from './MacroSheet.vue'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import { macroPlacesOn } from '@/services/macros/places'
import type { MacroPlace } from '@/services/macros/locate'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import type { Macro, MacroCategory } from '@/store/macros/types'
import { macroSections, macrosMovedTo, rangeOf, sectionsMoved, type MacroSection } from './macro-sections'

const LONG_PRESS_MS = 500
const HIDDEN_SHOWN = 3

/**
 * Settings › Macros, as one list: every category a section (a header row
 * with a grip, its count and a ··· menu), and Uncategorised the last.
 * Selection follows File Explorer: click selects one, Ctrl-click toggles,
 * Shift-click selects a range, a checkbox (or, on a phone, a long-press)
 * selects without a keyboard, and the toolbar acts on the selection.
 * Macros are dragged, or moved with Move to…, between sections. A
 * double-click or Enter opens the macro's sheet, with its code read-only.
 */
@Component({
  components: { MacroCategoryDialog, MacroSheet }
})
export default class MacroPanel extends Mixins(StateMixin) {
  query = ''
  places: Map<string, MacroPlace> = new Map()
  error = ''
  dev = devModeState
  selected: string[] = []
  anchor: string | null = null
  focused: string | null = null
  dragging: string[] = []
  draggingSection: string | null = null
  dropOn: string | null = null
  moveFor: string[] | null = null
  sheetFor: string | null = null
  allHidden = false
  pressTimer = 0
  pressed = false
  /** Set by a long-press: taps then add to the selection, as on a phone's file list. */
  picking = false
  categoryDialog: { open: boolean, title: string, name: string, save: (name: string) => void } = {
    open: false,
    title: '',
    name: '',
    save: () => undefined
  }

  mounted () {
    refreshDevMode().then(() => this.load())
  }

  beforeDestroy () {
    clearTimeout(this.pressTimer)
  }

  get connected (): boolean {
    return this.$store.state.socket.open === true
  }

  get locked (): boolean {
    return !this.connected
  }

  get registered (): string[] {
    return (this.$store.state.server.info.registered_directories as string[] | undefined) ?? []
  }

  /** Where the macros are read from: the editable copy in developer mode, else the defaults the printer runs. */
  get root (): string {
    if (this.dev.enabled || !this.registered.includes('defaults')) return 'config'
    return 'defaults'
  }

  /** Edit in Files opens: a non-Muon printer's config, or a Muon's in developer mode. */
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
      this.error = 'The printer didn\'t list its config files, so where each command is written isn\'t known yet.'
    }
  }

  get allMacros (): Macro[] {
    return this.$store.getters['macros/getMacros'] as Macro[]
  }

  /** Macros whose names start with _: Klipper's helpers, hidden from everyone. */
  get hiddenMacros (): string[] {
    const q = this.query.trim().toLowerCase()
    return Object.keys(this.$store.state.printer.printer ?? {})
      .filter(key => /^gcode_macro _/.test(key))
      .map(key => key.slice('gcode_macro '.length))
      .filter(name => !q || name.toLowerCase().includes(q))
  }

  get shownHidden (): string[] {
    return this.allHidden ? this.hiddenMacros : this.hiddenMacros.slice(0, HIDDEN_SHOWN)
  }

  get sections (): MacroSection[] {
    return macroSections(
      this.$store.getters['macros/getCategories'] as MacroCategory[],
      (id: string) => this.$store.getters['macros/getMacrosByCategory'](id) as Macro[],
      this.$t('app.general.label.uncategorized').toString(),
      this.query
    )
  }

  countOf (section: MacroSection): number {
    return section.count + (section.id === '0' ? this.hiddenMacros.length : 0)
  }

  get order (): string[] {
    return this.sections.flatMap(s => s.macros.map(m => m.name))
  }

  /** The row that takes Tab: the one last chosen, else the first. */
  get focusName (): string | undefined {
    return this.focused && this.order.includes(this.focused) ? this.focused : this.order[0]
  }

  get sheetMacro (): Macro | undefined {
    return this.sheetFor ? this.allMacros.find(m => m.name === this.sheetFor) : undefined
  }

  macro (name: string): Macro | undefined {
    return this.allMacros.find(m => m.name === name)
  }

  titleOf (m: Macro): string {
    return m.alias || m.name.toUpperCase()
  }

  titleOfName (name: string): string {
    const m = this.macro(name)
    return m ? this.titleOf(m) : name
  }

  sectionOf (m: Macro): string {
    return m.categoryId && m.category ? m.categoryId : '0'
  }

  allIn (names: string[], sectionId: string): boolean {
    return names.every(n => {
      const m = this.macro(n)
      return m && this.sectionOf(m) === sectionId
    })
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

  isSelected (name: string): boolean {
    return this.selected.includes(name)
  }

  select (name: string) {
    this.selected = [name]
    this.anchor = name
    this.focused = name
  }

  toggle (name: string) {
    this.selected = this.isSelected(name) ? this.selected.filter(n => n !== name) : [...this.selected, name]
    this.anchor = name
    this.focused = name
  }

  clear () {
    this.selected = []
    this.anchor = null
    this.picking = false
  }

  /** Empty space anywhere in the panel (padding, gaps, headings) clears the selection; a row, button, field or menu keeps it. */
  onPanelClick (event: MouseEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('[role="option"], [role="menuitem"], button, a, input, textarea, select, label, .v-input, .v-menu__content')) return
    this.clear()
  }

  /** Ctrl+A (Cmd+A) selects every macro shown, unless the keys are going to a field. */
  onPanelKey (event: KeyboardEvent) {
    if (event.key.toLowerCase() !== 'a' || !(event.ctrlKey || event.metaKey) || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
    event.preventDefault()
    this.selected = [...this.order]
    this.anchor = this.order[0] ?? null
  }

  /** A shift-click selects a range; without this the browser also selects the text between. */
  onRowMouseDown (event: MouseEvent) {
    if (event.shiftKey) event.preventDefault()
  }

  onRowClick (event: MouseEvent, name: string) {
    if (this.pressed) {
      this.pressed = false
      return
    }
    if (event.shiftKey && this.anchor) {
      this.selected = rangeOf(this.order, this.anchor, name)
      this.focused = name
    } else if (event.ctrlKey || event.metaKey || this.picking) {
      this.toggle(name)
    } else {
      this.select(name)
    }
  }

  onPressStart (name: string) {
    clearTimeout(this.pressTimer)
    this.pressed = false
    this.pressTimer = window.setTimeout(() => {
      this.pressed = true
      this.picking = true
      if (!this.isSelected(name)) this.toggle(name)
    }, LONG_PRESS_MS)
  }

  onPressEnd () {
    clearTimeout(this.pressTimer)
  }

  open (m: Macro) {
    this.select(m.name)
    this.sheetFor = m.name
  }

  openInEditor (name: string) {
    const place = this.placeOf(name)
    if (!place || !this.editable) return
    this.$router.push({
      path: scopedPath('/configure', activeSlug()),
      query: { open: `${place.root}/${place.path}`, line: String(place.line) }
    })
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
      if (event.ctrlKey || event.metaKey) this.toggle(m.name)
      else this.select(m.name)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const i = this.order.indexOf(m.name)
    const next = this.order[i + (event.key === 'ArrowDown' ? 1 : -1)]
    if (!next) return
    if (event.shiftKey && this.anchor) {
      this.selected = rangeOf(this.order, this.anchor, next)
      this.focused = next
    } else {
      this.select(next)
    }
    this.$nextTick(() => {
      (this.$el.querySelector(`[data-tid=${JSON.stringify(`macro-row-${next}`)}]`) as HTMLElement | null)?.focus()
    })
  }

  /** Drags the selection when the row is in it, else just the row. */
  onDragStart (event: DragEvent, name: string) {
    if (this.locked) return
    if (!this.isSelected(name)) this.select(name)
    this.dragging = this.order.filter(n => this.isSelected(n))
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', this.dragging.join('\n'))
    }
  }

  onSectionDragStart (event: DragEvent, id: string) {
    if (id === '0' || this.locked) return
    this.draggingSection = id
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', `section:${id}`)
    }
  }

  onDragEnd () {
    this.dragging = []
    this.draggingSection = null
    this.dropOn = null
  }

  onDragOver (event: DragEvent, sectionId: string) {
    if (!this.dragging.length && !this.draggingSection) return
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
    const section = this.draggingSection
    const names = this.dragging.length ? this.dragging : (event.dataTransfer?.getData('text/plain') ?? '').split('\n').filter(n => n && !n.startsWith('section:'))
    this.onDragEnd()
    if (this.locked) return
    event.preventDefault()
    if (section) this.moveSection(section, sectionId)
    else if (names.length) this.moveTo(names, sectionId, before)
  }

  /** Puts the dragged section before the one it's dropped on (Uncategorised stays last). */
  moveSection (id: string, onto: string) {
    const ids = this.sections.map(s => s.id).filter(s => s !== '0')
    const next = sectionsMoved(ids, id, onto === '0' ? undefined : onto)
    if (next) this.$store.dispatch('macros/saveCategoryOrder', next)
  }

  /** Moves the macros into the section, before `before` (or last), and saves the section's order. */
  moveTo (names: string[], sectionId: string, before?: string) {
    this.moveFor = null
    const macros = macrosMovedTo(
      this.allMacros,
      (id: string) => this.$store.getters['macros/getMacrosByCategory'](id) as Macro[],
      names,
      sectionId,
      before
    )
    if (!macros) return
    this.$store.dispatch('macros/saveAllOrder', macros)
  }

  setVisible (m: Macro, visible: boolean) {
    this.$store.dispatch('macros/saveMacro', { ...m, visible: !!visible })
  }

  setSelectedVisible (visible: boolean) {
    const macros = this.selected.map(n => this.macro(n)).filter((m): m is Macro => !!m)
    if (macros.length) this.$store.dispatch(visible ? 'macros/saveAllOn' : 'macros/saveAllOff', macros)
  }

  setAllVisible (section: MacroSection, visible: boolean) {
    const macros = this.$store.getters['macros/getMacrosByCategory'](section.id) as Macro[]
    this.$store.dispatch(visible ? 'macros/saveAllOn' : 'macros/saveAllOff', macros)
  }

  /** A new section; from Move to…, the macros go into it. */
  addCategory (moving?: string[]) {
    this.moveFor = null
    this.categoryDialog = {
      open: true,
      title: 'New section',
      name: '',
      save: async (name: string) => {
        await this.$store.dispatch('macros/addCategory', name)
        const made = [...(this.$store.state.macros.categories as MacroCategory[])].reverse().find(c => c.name === name)
        if (moving?.length && made) this.moveTo(moving, made.id)
      }
    }
  }

  renameCategory (section: MacroSection) {
    this.categoryDialog = {
      open: true,
      title: 'Rename the section',
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

<style lang="scss" scoped>
  .mpanel__list { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: var(--m3d-surface-2); }
  .mpanel__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 44px; padding: 6px 12px; }
  .mpanel__bar--on { background: color-mix(in srgb, var(--m3d-accent) 14%, transparent); }
  .mpanel__done { margin-left: auto; }
  .mpanel__section-head { display: flex; align-items: center; gap: 8px; padding: 8px 12px; text-transform: uppercase; letter-spacing: .06em; font-size: 12px; color: var(--m3d-text-muted); }
  .mpanel__section-head h3 { flex: 1 1 auto; margin: 0; font-size: 12px; }
  .mpanel__section-head[draggable="true"] { cursor: grab; }
  .mpanel__count { font-size: 12px; text-transform: none; letter-spacing: 0; }
  .mpanel__grip { flex: none; width: 8px; height: 14px; opacity: .5; background-image: radial-gradient(currentColor 1.2px, transparent 1.3px); background-size: 4px 4px; }
  .mpanel__check { flex: none; width: 16px; height: 16px; accent-color: var(--m3d-accent); }
  .mpanel__row:not(.mpanel__row--selected):not(:hover) .mpanel__check { opacity: .35; }
  .mpanel__dot { flex: none; width: 10px; height: 10px; border-radius: 50%; background: var(--m3d-text-muted); }
  .mpanel__chip { flex: none; padding: 2px 8px; border-radius: 999px; background: var(--m3d-surface); color: var(--m3d-text-muted); font-size: 12px; }
  .mpanel__mono { font-family: var(--m3d-font-mono, monospace); }
  .mpanel__row--hidden { opacity: .75; cursor: default; }
  .mpanel__more-rows { padding: 8px 16px; text-align: left; color: var(--m3d-text-muted); font-size: 13px; cursor: pointer; }
  .mpanel__foot { margin: 0; color: var(--m3d-text-muted); font-size: 12px; }
  @media (hover: none) { .mpanel__check { opacity: 1 !important; } }
</style>
