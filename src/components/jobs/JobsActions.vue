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
    <seg-picker
      :options="sorts"
      :value="page.sort"
      label="Order"
      @input="setSort"
    />
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
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import BrowserMixin from '@/mixins/browser'
import ControlMixin from '@/mixins/control'
import SegPicker from '@/components/control/SegPicker.vue'
import { JOBS_SORTS, type JobsSort } from '@/services/jobs/list'
import { jobsPage, setJobsSort } from '@/services/jobs/page-state'
import type { SectionPage } from '@/router/printerSections'

/**
 * Jobs' page actions, top right: search, the order, Upload, and a ··· menu
 * that holds the pages Jobs used to show as tabs (History, Timelapse).
 */
@Component({ components: { SegPicker } })
export default class JobsActions extends Mixins(FrameMixin, BrowserMixin, ControlMixin) {
  page = jobsPage

  get sorts () {
    return JOBS_SORTS
  }

  setSort (sort: JobsSort) {
    setJobsSort(sort)
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .jobs-actions--phone {
    justify-content: flex-start;
  }

  .jobs-actions__find {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 220px;
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

  .jobs-actions__round--on {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }
</style>
