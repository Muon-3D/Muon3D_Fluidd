<template>
  <div
    class="jobs-actions"
    :class="{ 'jobs-actions--phone': isMobileViewport }"
    data-tid="jobs-actions"
  >
    <label
      v-if="!isMobileViewport"
      class="jobs-actions__find"
    >
      <frame-icon
        name="search"
        small
      />
      <input
        ref="find"
        v-model="page.query"
        type="search"
        placeholder="Search files"
        aria-label="Search files"
        data-tid="jobs-filter"
        @keydown.esc="page.query = ''"
      >
    </label>
    <button
      v-if="isMobileViewport"
      type="button"
      class="jobs-actions__round"
      :class="{ 'jobs-actions__round--on': page.searchOpen || !!page.query }"
      aria-label="Search files"
      data-tid="jobs-search-toggle"
      @click="toggleSearch"
    >
      <frame-icon name="search" />
    </button>
    <label
      v-if="isMobileViewport && (page.searchOpen || page.query)"
      class="jobs-actions__find jobs-actions__find--row"
    >
      <frame-icon
        name="search"
        small
      />
      <input
        ref="find"
        v-model="page.query"
        type="search"
        placeholder="Search files"
        aria-label="Search files"
        data-tid="jobs-filter"
        @keydown.esc="page.query = ''"
      >
    </label>
    <div
      class="jobs-actions__tools"
      role="toolbar"
      aria-label="Files"
      data-tid="jobs-toolbar"
    >
      <button
        type="button"
        class="cbtn"
        :disabled="!controlReady"
        data-tid="jobs-toolbar-new-folder"
        @click="page.folderTick++"
      >
        <frame-icon
          name="plus"
          small
        />
        New folder
      </button>
      <template v-if="page.selected">
        <button
          type="button"
          class="cbtn cbtn--ghost jobs-actions__count"
          :aria-label="`Clear the selection of ${page.selected}`"
          data-tid="jobs-sel-count"
          @click="page.clearTick++"
        >
          <frame-icon
            name="x"
            small
          />
          {{ page.selected }} selected
        </button>
        <button
          v-if="page.queueable"
          type="button"
          class="cbtn"
          :disabled="!controlReady"
          data-tid="jobs-sel-queue"
          @click="page.queueTick++"
        >
          {{ queueText }}
        </button>
        <button
          v-if="page.changeable"
          type="button"
          class="cbtn"
          :disabled="!controlReady"
          data-tid="jobs-sel-move"
          @click="page.moveTick++"
        >
          <frame-icon
            name="files"
            small
          />
          Move to
        </button>
        <button
          v-if="page.downloadable"
          type="button"
          class="jobs-actions__round"
          :aria-label="page.downloadable === 1 ? 'Download' : `Download ${page.downloadable} files`"
          title="Download"
          data-tid="jobs-sel-download"
          @click="page.downloadTick++"
        >
          <frame-icon name="download" />
        </button>
        <button
          v-if="page.changeable"
          type="button"
          class="jobs-actions__round jobs-actions__round--danger"
          :disabled="!controlReady"
          :aria-label="page.changeable === 1 ? 'Delete' : `Delete ${page.changeable} items`"
          title="Delete"
          data-tid="jobs-sel-delete"
          @click="page.deleteTick++"
        >
          <frame-icon name="trash" />
        </button>
        <span
          v-if="page.heldNote"
          class="jobs-actions__note"
          data-tid="jobs-sel-held"
        >{{ page.heldNote }}</span>
      </template>
    </div>
    <button
      type="button"
      class="cbtn cbtn--primary jobs-actions__upload"
      :disabled="!controlReady"
      data-tid="jobs-upload"
      @click="page.uploadTick++"
    >
      <frame-icon
        name="upload"
        small
      />
      Upload
    </button>
    <v-menu
      offset-y
      left
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="jobs-actions__round"
          aria-label="More about jobs"
          data-tid="jobs-more"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon name="more" />
        </button>
      </template>
      <v-list dense>
        <v-list-item
          v-for="item in links"
          :key="item.path"
          :to="pageTo(item)"
          :data-tid="`jobs-more-${item.label.toLowerCase()}`"
        >
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          :disabled="!controlReady"
          data-tid="jobs-new-folder"
          @click="page.folderTick++"
        >
          <v-list-item-title>New folder</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-subheader>Order by</v-subheader>
        <v-list-item
          v-for="item in moreSorts"
          :key="item.value"
          :input-value="page.sort === item.value"
          :data-tid="`jobs-sort-${item.value}`"
          @click="setSort(item.value)"
        >
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          :input-value="page.reverse"
          data-tid="jobs-reverse"
          @click="turnRound"
        >
          <v-list-item-title>{{ page.reverse ? 'Reversed' : 'Reverse order' }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import BrowserMixin from '@/mixins/browser'
import ControlMixin from '@/mixins/control'
import { MORE_SORTS, type JobsSort } from '@/services/jobs/list'
import { queueLabel } from '@/services/jobs/model'
import { jobsPage, setJobsSort } from '@/services/jobs/page-state'
import type { SectionPage } from '@/router/printerSections'

/**
 * Jobs' one toolbar, top right, as File Explorer has it: search, New folder,
 * and, only while something is selected, what can be done to the selection
 * (Move to, Download, Delete). Then Upload, the page's one primary button,
 * and a ··· menu with the pages Jobs used to show as tabs (History,
 * Timelapse) and the orders that have no column. The list's column
 * headers are the order.
 */
@Component({})
export default class JobsActions extends Mixins(FrameMixin, BrowserMixin, ControlMixin) {
  page = jobsPage

  get queueText (): string {
    return queueLabel(jobsPage.queueable)
  }

  get moreSorts () {
    return MORE_SORTS
  }

  setSort (sort: JobsSort) {
    setJobsSort(sort, false)
  }

  turnRound () {
    setJobsSort(jobsPage.sort, !jobsPage.reverse)
  }

  /** Pages of the Jobs section other than Jobs itself. */
  get links (): SectionPage[] {
    return this.currentSection ? this.pagesOf(this.currentSection).filter(p => p.path !== '/jobs') : []
  }

  toggleSearch () {
    jobsPage.searchOpen = !jobsPage.searchOpen
    if (jobsPage.searchOpen) this.$nextTick(() => (this.$refs.find as HTMLInputElement | undefined)?.focus())
  }

  mounted () {
    window.addEventListener('keydown', this.onWindowKey)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.onWindowKey)
  }

  /** "/" anywhere on the page goes to the search, unless something else is being typed in. */
  onWindowKey (event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
    if (document.querySelector('.v-dialog--active')) return
    event.preventDefault()
    jobsPage.searchOpen = true
    this.$nextTick(() => (this.$refs.find as HTMLInputElement | undefined)?.focus())
  }
}
</script>

<style lang="scss" scoped>
  .jobs-actions {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    min-width: 0;
  }

  .jobs-actions--phone {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .jobs-actions__find {
    display: inline-flex;
    align-items: center;
    flex: 0 1 220px;
    gap: 8px;
    min-width: 120px;
    height: 44px;
    padding: 0 14px;
    border-radius: 14px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  .jobs-actions__find--row {
    order: 9;
    flex: 1 1 100%;
    width: auto;
  }

  .jobs-actions__round {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .jobs-actions__tools {
    display: flex;
    flex: none;
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
  }

  .jobs-actions__count {
    padding: 0 12px;
  }

  .jobs-actions__note {
    max-width: 220px;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .jobs-actions__round--danger {
    background: color-mix(in srgb, var(--m3d-danger) 16%, transparent);
    color: var(--m3d-danger);
  }

  .jobs-actions__round:disabled {
    opacity: 0.45;
  }

  .jobs-actions--phone .jobs-actions__tools {
    order: 8;
    flex: 1 1 100%;
    flex-wrap: wrap;
  }

  .jobs-actions__round--on {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }
</style>
