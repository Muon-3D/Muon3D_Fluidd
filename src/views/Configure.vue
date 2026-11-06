<template>
  <div
    class="files-page"
    :class="{ 'files-page--phone': isMobileViewport }"
    data-tid="files-page"
  >
    <section
      v-if="!isMobileViewport || view.pane === 'config'"
      class="files-tile"
      data-tid="files-config"
    >
      <header class="files-tile__head">
        <h2><frame-icon name="code" /> Config files</h2>
        <seg-picker
          v-if="configRoots.length > 1"
          :options="configOptions"
          :value="configActive"
          label="Config folder"
          @input="configRoot = $event"
        />
      </header>
      <file-system
        ref="configFs"
        :roots="configRoots"
        :active-root="configActive"
        name="configure"
        tile
        bulk-actions
        class="files-tile__fs"
        @dirty="configDirty = $event"
      />
      <footer class="files-tile__foot">
        <router-link
          v-if="devMode !== null"
          :to="developerTo"
          data-tid="files-dev-mode"
        >
          {{ devMode ? 'Developer mode is on: the config folder is yours to change' : 'config is shown in Developer mode' }}
        </router-link>
      </footer>
    </section>

    <section
      v-if="!isMobileViewport || view.pane === 'other'"
      class="files-tile"
      data-tid="files-other"
    >
      <header class="files-tile__head">
        <h2><frame-icon name="folder" /> Other files</h2>
        <seg-picker
          v-if="otherRoots.length > 1"
          :options="otherOptions"
          :value="otherActive"
          label="Other folder"
          @input="otherRoot = $event"
        />
      </header>
      <file-system
        ref="otherFs"
        :roots="otherRoots"
        :active-root="otherActive"
        name="configure"
        tile
        bulk-actions
        class="files-tile__fs"
        @dirty="otherDirty = $event"
      />
      <footer
        v-if="otherRoots.length"
        class="files-tile__foot"
      >
        Logs, docs and examples are read only: no New or Upload
      </footer>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import type { NavigationGuardNext, Route } from 'vue-router'
import OverviewMixin from '@/mixins/overview'
import BrowserMixin from '@/mixins/browser'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { orderRoots } from '@/services/files/model'
import { filesView } from '@/services/files/view'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Files (Tools), as Fluidd had it: Config files (this printer's settings and
 * the Muon3D defaults, plus the whole config in Developer mode) beside Other
 * files (logs, docs and the rest), each a tile with its folders as a segment.
 * A file opens in the editor sheet. A phone shows one tile at a time, chosen
 * in the page header. `?open=config/macros/filament.cfg&line=49` opens a
 * file at a line (a macro's Edit).
 */
@Component({ components: { FileSystem, SegPicker } })
export default class Configure extends Mixins(OverviewMixin, BrowserMixin) {
  view = filesView
  configRoot = ''
  otherRoot = ''
  configDirty = false
  otherDirty = false

  /** An edit in the editor sheet that isn't saved. */
  get dirty (): boolean {
    return this.configDirty || this.otherDirty
  }

  get configRoots (): string[] {
    return orderRoots(['calibration', 'defaults', ...(this.devMode ? ['config'] : [])])
  }

  get otherRoots (): string[] {
    const registered = (this.$store.state.server.info.registered_directories as string[] | undefined) ?? []
    const skip = ['gcodes', 'timelapse', 'timelapse_frames', 'config', 'calibration', 'defaults']
    return orderRoots([...new Set(['logs', 'docs', ...registered])].filter(r => !skip.includes(r)))
  }

  get configActive (): string {
    return this.configRoots.includes(this.configRoot) ? this.configRoot : this.configRoots[0]
  }

  get otherActive (): string {
    return this.otherRoots.includes(this.otherRoot) ? this.otherRoot : this.otherRoots[0]
  }

  get configOptions (): SegOption[] {
    return this.configRoots.map(r => ({ value: r, label: r }))
  }

  get otherOptions (): SegOption[] {
    return this.otherRoots.map(r => ({ value: r, label: r }))
  }

  /** Whether developer mode is on, or null until the printer says. */
  get devMode (): boolean | null {
    return devModeState.enabled
  }

  get developerTo (): string {
    return `${scopedPath('/settings', activeSlug())}#developer`
  }

  /** `?open=root/dir/name.cfg&line=N`: opens that file, at that line. */
  @Watch('$route.query')
  async onOpenQuery () {
    const match = /^([^/]+)\/(?:(.*)\/)?([^/]+)$/.exec(String(this.$route.query.open ?? ''))
    if (!match) return
    const [, root, dir = '', name] = match
    const inConfig = this.configRoots.includes(root) || ['config', 'calibration', 'defaults'].includes(root)
    if (inConfig) this.configRoot = root
    else this.otherRoot = root
    this.view.pane = inConfig ? 'config' : 'other'
    await this.$nextTick()
    await this.$nextTick()
    const fs = (inConfig ? this.$refs.configFs : this.$refs.otherFs) as FileSystem | undefined
    await fs?.openPath(root, dir, name, Number(this.$route.query.line) || 0)
  }

  async mounted () {
    await refreshDevMode()
    await this.onOpenQuery()
  }

  // Leaving the page with edits that aren't saved asks first, whatever the setting for the editor's X.
  async beforeRouteLeave (_to: Route, _from: Route, next: NavigationGuardNext) {
    if (!this.dirty) return next()
    const leave = await this.$confirm("Your changes to it aren't saved. If you go on, they're lost.", {
      title: 'Drop your unsaved changes?',
      buttonTrueText: 'Drop changes',
      buttonFalseText: 'Keep editing',
      danger: true
    })
    next(leave ? undefined : false)
  }
}
</script>

<style lang="scss" scoped>
  .files-page {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 16px;
  }

  .files-tile {
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: calc(100svh - 250px);
    min-height: 480px;
    padding-top: 18px;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .files-tile--hidden {
    display: none;
  }

  .files-tile__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 0 18px 12px;

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }
  }

  .files-tile__fs {
    flex: 1 1 0;
    min-height: 0;
  }

  .files-tile__foot {
    padding: 12px 18px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);
    font-size: 12px;

    a {
      color: var(--m3d-text-muted);
    }
  }

  .files-page--phone {
    grid-template-columns: minmax(0, 1fr);

    .files-tile {
      height: calc(100svh - 300px);
    }
  }
</style>
