<template>
  <div class="file-system">
    <!-- <pre>selected: {{ selected }}</pre> -->
    <!-- <div class="bulk-actions" v-if="selected.length > 0">
      Some bulk actions.
    </div> -->

    <v-data-table
      ref="table"
      :value="selected"
      :headers="headers"
      :items="files"
      :dense="dense"
      disable-pagination
      :loading="loading"
      :custom-sort="customSort"
      :search="search"
      :show-select="bulkActions"
      :no-data-text="$t('app.file_system.msg.not_found')"
      :no-results-text="$t('app.file_system.msg.not_found')"
      item-key="name"
      height="100%"
      mobile-breakpoint="0"
      must-sort
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      hide-default-footer
      class="rounded-0"
      fixed-header
      @input="handleSelected"
    >
      <template #body="{ items, isSelected, select }">
        <tbody>
          <tr
            v-if="windowFor(items.length).padTop"
            class="fs-pad"
            aria-hidden="true"
            :style="{ height: `${windowFor(items.length).padTop}px` }"
          >
            <td :colspan="headers.length + 1" />
          </tr>
          <tr
            v-for="item in rows(items)"
            :key="item.name"
            :class="{
              'is-disabled': disabled,
              'v-data-table__selected': (isSelected(item) && item.name !== '..')
            }"
            :style="{ height: `${rowHeight}px` }"
            class="row-select px-1"
            :draggable="isItemDraggable(item)"
            @click.prevent="$emit('row-click', item, $event)"
            @contextmenu.prevent="$emit('row-click', item, $event)"
            @dragstart="handleDragStart(item, $event)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver(item, $event)"
            @dragenter.prevent
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop(item, $event)"
          >
            <td v-if="bulkActions">
              <v-simple-checkbox
                v-if="item.name !== '..'"
                v-ripple
                :value="isSelected(item)"
                color=""
                class="mt-1"
                @click.stop="select(item, !isSelected(item))"
              />
            </td>
            <td>
              <!-- icons are 16px small, or 24px for standard size. -->
              <v-layout
                justify-center
                class="no-pointer-events"
              >
                <v-icon
                  v-if="!item.thumbnails || !item.thumbnails.length"
                  :small="dense"
                  :color="(item.type === 'file') ? 'grey' : 'primary'"
                >
                  {{ getItemIcon(item) }}
                </v-icon>
                <img
                  v-else
                  :style="{'max-width': `${thumbnailSize}px`, 'max-height': `${thumbnailSize}px`}"
                  :src="getThumbUrl(item, root, item.path, thumbnailSize > 16, item.modified)"
                >
              </v-layout>
            </td>

            <td class="fs-name">
              {{ item.name }}
            </td>

            <td
              v-if="root === 'gcodes' && shows('estimated_time')"
              class="fs-cell"
            >
              <span v-if="item.estimated_time !== undefined">
                {{ $filters.formatCounterSeconds(item.estimated_time) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('filament_total')"
              class="fs-cell"
            >
              <span v-if="item.filament_total !== undefined">
                {{ $filters.getReadableLengthString(item.filament_total) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('filament_weight_total')"
              class="fs-cell"
            >
              <span v-if="item.filament_weight_total !== undefined">
                {{ $filters.getReadableWeightString(item.filament_weight_total) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('layer_height')"
              class="fs-cell"
            >
              <span v-if="item.layer_height !== undefined">
                {{ item.layer_height }} mm
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('object_height')"
              class="fs-cell"
            >
              <span v-if="item.object_height !== undefined">
                {{ $filters.getReadableLengthString(item.object_height) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('first_layer_height')"
              class="fs-cell"
            >
              <span v-if="item.first_layer_height !== undefined">
                {{ item.first_layer_height }} mm
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('filament_name')"
              class="fs-cell"
            >
              <span v-if="item.filament_name !== undefined">
                {{ item.filament_name }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('filament_type')"
              class="fs-cell"
            >
              <span v-if="item.filament_type !== undefined">
                {{ item.filament_type }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('history.filament_used')"
              class="fs-cell"
            >
              <span v-if="item.history && item.history.filament_used !== undefined">
                {{ $filters.getReadableLengthString(item.history.filament_used) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('nozzle_diameter')"
              class="fs-cell"
            >
              <span v-if="item.nozzle_diameter !== undefined">
                {{ item.nozzle_diameter }} mm
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('slicer')"
              class="fs-cell"
            >
              <span v-if="item.slicer !== undefined">
                {{ item.slicer }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('slicer_version')"
              class="fs-cell"
            >
              <span v-if="item.slicer_version !== undefined">
                {{ item.slicer_version }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('history.print_duration')"
              class="fs-cell"
            >
              <span v-if="item.history && item.history.print_duration !== undefined">
                {{ $filters.formatCounterSeconds(item.history.print_duration) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('history.total_duration')"
              class="fs-cell"
            >
              <span v-if="item.history && item.history.total_duration !== undefined">
                {{ $filters.formatCounterSeconds(item.history.total_duration) }}
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('first_layer_bed_temp')"
              class="fs-cell"
            >
              <span v-if="item.first_layer_bed_temp !== undefined">
                {{ item.first_layer_bed_temp }}<small>°C</small>
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('first_layer_extr_temp')"
              class="fs-cell"
            >
              <span v-if="item.first_layer_extr_temp !== undefined">
                {{ item.first_layer_extr_temp }}<small>°C</small>
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('chamber_temp')"
              class="fs-cell"
            >
              <span v-if="item.chamber_temp !== undefined">
                {{ item.chamber_temp }}<small>°C</small>
              </span>
            </td>

            <td
              v-if="root === 'gcodes' && shows('print_start_time')"
              class="fs-cell"
            >
              <span v-if="item.print_start_time !== undefined && item.print_start_time !== null">
                {{ $filters.formatDateTime(item.print_start_time * 1000) }}
              </span>
            </td>

            <td
              v-if="shows('modified')"
              class="fs-cell"
            >
              <span v-if="item.modified !== undefined && item.name !== '..'">
                {{ $filters.formatDateTime(item.modified * 1000) }}
              </span>
            </td>

            <td
              v-if="shows('size')"
              class="fs-cell"
            >
              <span v-if="item.size !== undefined && item.name !== '..'">
                {{ $filters.getReadableFileSizeString(item.size) }}
              </span>
            </td>

            <td
              v-if="shows('data-table-actions')"
              class="fs-more"
            >
              <button
                v-if="item.name !== '..'"
                type="button"
                class="fs-more__btn"
                :aria-label="`Actions for ${item.name}`"
                :disabled="disabled"
                data-tid="files-row-menu"
                @click.stop="openMenu(item, $event)"
              >
                <v-icon small>
                  $dots
                </v-icon>
              </button>
            </td>
          </tr><tr
            v-if="windowFor(items.length).padBottom"
            class="fs-pad"
            aria-hidden="true"
            :style="{ height: `${windowFor(items.length).padBottom}px` }"
          >
            <td :colspan="headers.length + 1" />
          </tr>
        </tbody>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel, PropSync } from 'vue-property-decorator'
import type Vue from 'vue'
import type { FileBrowserEntry, RootProperties } from '@/store/files/types'
import type { AppTableHeader } from '@/types'
import FilesMixin from '@/mixins/files'

import { SupportedImageFormats, SupportedVideoFormats } from '@/globals'
import { windowRows } from '@/services/files/manager'

@Component({})
export default class FileSystemBrowser extends Mixins(FilesMixin) {
  @VModel({ type: Array<FileBrowserEntry>, required: true })
    selected!: FileBrowserEntry[]

  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: Array<FileBrowserEntry>, required: true })
  readonly files!: FileBrowserEntry[]

  @Prop({ type: Boolean })
  readonly dense?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  // Currently defined list of headers.
  @Prop({ type: Array<AppTableHeader>, required: true })
  readonly headers!: AppTableHeader[]

  @Prop({ type: String })
  readonly search?: string

  @PropSync('dragState', { type: Boolean, required: true })
    dragStateModel!: boolean

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly bulkActions?: boolean

  dragItem: FileBrowserEntry | null = null
  ghost?: HTMLDivElement = undefined

  // Where the list is scrolled to, so a long folder only draws the rows in view.
  scrollTop = 0
  viewport = 600
  scroller: HTMLElement | null = null
  frame = 0
  resizeObserver: ResizeObserver | null = null

  mounted () {
    this.scroller = (this.$refs.table as Vue | undefined)?.$el.querySelector('.v-data-table__wrapper') ?? null
    this.scroller?.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.measure)
    // The pane can change size without the window changing (menus, panels, folds).
    if (this.scroller && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure())
      this.resizeObserver.observe(this.scroller)
    }
    this.measure()
  }

  beforeDestroy () {
    this.scroller?.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.measure)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    cancelAnimationFrame(this.frame)
  }

  onScroll () {
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.measure()
    })
  }

  measure () {
    if (!this.scroller) return
    this.scrollTop = this.scroller.scrollTop
    this.viewport = this.scroller.clientHeight || this.viewport
  }

  /** Every row is this tall, so the scrollbar can be worked out without drawing them. */
  get rowHeight (): number {
    return Math.max(this.dense ? 32 : 48, this.thumbnailSize + 12)
  }

  windowFor (total: number) {
    return windowRows({ total, scrollTop: this.scrollTop, viewport: this.viewport, rowHeight: this.rowHeight })
  }

  // Untyped like the table's own slot items: rows read metadata the entry types don't list.
  rows (items: any[]): any[] {
    const w = this.windowFor(items.length)
    return w.windowed ? items.slice(w.start, w.end) : items
  }

  /** One lookup per column, not one per cell. */
  get shownColumns (): Set<string> {
    return new Set(this.headers.map(header => (header.key ? header.key : header.value) as string))
  }

  shows (column: string): boolean {
    return this.shownColumns.has(column)
  }

  // The row's own menu, opened where its button is.
  openMenu (item: FileBrowserEntry, event: MouseEvent) {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    this.$emit('row-click', item, new MouseEvent('contextmenu', { clientX: box.right, clientY: box.bottom }))
  }

  // Is the history component enabled
  get showHistory () {
    return (
      this.$store.getters['server/componentSupport']('history') &&
      this.root === 'gcodes'
    )
  }

  get rootProperties (): RootProperties {
    return this.$store.getters['files/getRootProperties'](this.root) as RootProperties
  }

  get readonly () {
    return this.rootProperties.readonly
  }

  get thumbnailSize () {
    const thumbnailSize = this.$store.state.config.uiSettings.general.thumbnailSize

    return this.dense ? thumbnailSize / 2 : thumbnailSize
  }

  get textSortOrder () {
    return this.$store.state.config.uiSettings.general.textSortOrder
  }

  get draggedItems () {
    if (this.dragItem) {
      const filteredSelectedItems = this.selected
        .filter(item => item.name !== '..')

      const draggedItems = filteredSelectedItems.length > 0
        ? filteredSelectedItems
        : [this.dragItem]

      return draggedItems
    }

    return []
  }

  get sortBy () {
    return this.$store.state.config.uiSettings.fileSystem.sortBy[this.root] as string | null ?? 'modified'
  }

  set sortBy (value: string | null | undefined) {
    this.$store.dispatch('config/updateFileSystemSortBy', { root: this.root, value: value ?? null })
  }

  get sortDesc () {
    return this.$store.state.config.uiSettings.fileSystem.sortDesc[this.root] as boolean | null ?? true
  }

  set sortDesc (value: boolean | null | undefined) {
    this.$store.dispatch('config/updateFileSystemSortDesc', { root: this.root, value: value ?? null })
  }

  customSort (items: FileBrowserEntry[], sortBy: string[], sortDesc: boolean[], locale: string) {
    return this.$filters.fileSystemSort(items, sortBy, sortDesc, locale, this.textSortOrder)
  }

  handleSelected (selected: FileBrowserEntry[]) {
    if (selected.length === 1) {
      if (selected[0].name === '..') {
        selected = []
      } else {
        selected = this.files
          .filter(item => item.name === selected[0].name || item.name === '..')
      }
    }

    this.$emit('input', selected)
  }

  getItemIcon (item: FileBrowserEntry) {
    const readonly = !this.isItemWriteable(item)

    if (item.type === 'file') {
      if (item.extension === 'zip') {
        return readonly ? '$fileZipLock' : '$fileZip'
      } else if (
        SupportedImageFormats.includes(`.${item.extension}`) ||
            SupportedVideoFormats.includes(`.${item.extension}`)
      ) {
        return readonly ? '$fileImageLock' : '$fileImage'
      } else {
        return readonly ? '$fileLock' : '$file'
      }
    } else if (item.name === '..') {
      return '$folderUp'
    } else {
      return readonly ? '$folderLock' : '$folder'
    }
  }

  // Determines if a row is currently in a draggable state or not.
  isItemDraggable (item: FileBrowserEntry) {
    return (
      item.name !== '..' &&
      this.files.length > 0 &&
      (
        this.selected.length === 0 ||
        this.selected.includes(item)
      )
    )
  }

  isItemWriteable (item: FileBrowserEntry) {
    return (
      !this.readonly &&
      (
        item.permissions === undefined ||
        item.permissions.includes('w')
      )
    )
  }

  // Fake a drag image when the user drags a file or folder.
  handleDragStart (item: FileBrowserEntry, event: DragEvent) {
    if (this.dragStateModel !== true) {
      this.dragItem = item
      this.dragStateModel = true
    }

    if (event.dataTransfer) {
      const draggedItems = this.draggedItems

      this.ghost = document.createElement('div')
      this.ghost.classList.add('bulk-drag')
      this.ghost.classList.add((this.$vuetify.theme.dark) ? 'theme--dark' : 'theme--light')
      this.ghost.innerHTML = draggedItems.length > 1
        ? this.$tc('app.file_system.tooltip.items_count', draggedItems.length)
        : item.name
      document.body.appendChild(this.ghost)
      event.dataTransfer.effectAllowed = 'all'
      event.dataTransfer.setDragImage(this.ghost, 0, 0)

      this.$emit('drag-start', item, draggedItems, event.dataTransfer)
    }
  }

  // File was dropped on another table row.
  handleDrop (item: FileBrowserEntry, event: DragEvent) {
    this.handleDragLeave(event)

    if (
      item.type === 'directory' &&
      this.isItemWriteable(item) &&
      event.dataTransfer &&
      this.dragItem &&
      this.dragItem !== item
    ) {
      const draggedItems = this.draggedItems

      if (!draggedItems.includes(item)) {
        this.$emit('move', draggedItems, item)
      }
    }
  }

  // Handles highlighting rows as drag over them
  handleDragOver (item: FileBrowserEntry, event: DragEvent) {
    if (
      item.type === 'directory' &&
      this.isItemWriteable(item) &&
      event.dataTransfer &&
      this.dragItem &&
      this.dragItem !== item &&
      !this.draggedItems.includes(item)
    ) {
      event.preventDefault()

      event.dataTransfer.dropEffect = 'move'

      if (event.target instanceof HTMLElement) {
        let element: HTMLElement | null = event.target

        while (element) {
          if (element.tagName === 'TR') {
            element.classList.add('active')

            return
          }

          element = element.parentElement
        }
      }
    }
  }

  // Handles un highlighting rows as we drag out of them.
  handleDragLeave (event: DragEvent) {
    if (event.target instanceof HTMLElement) {
      let element: HTMLElement | null = event.target

      while (element) {
        if (element.tagName === 'TR') {
          element.classList.remove('active')

          return
        }

        element = element.parentElement
      }
    }
  }

  // Drag ended
  handleDragEnd () {
    const ghost = this.ghost

    if (ghost) {
      document.body.removeChild(ghost)
      this.ghost = undefined
    }

    this.dragItem = null
    this.dragStateModel = false
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  // Lighten up dark mode checkboxes.
  .theme--dark :deep(.v-simple-checkbox .v-icon) {
    color: rgba(map-deep-get($material-dark, 'inputs', 'box'), 0.25);
  }
</style>
