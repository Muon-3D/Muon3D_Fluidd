<template>
  <header
    class="app-page-header"
    :class="{ 'app-page-header--phone': isMobileViewport, 'app-page-header--jobs': jobsHome }"
  >
    <div class="app-page-header__row">
      <div class="app-page-header__titles">
        <div class="app-page-header__title-row">
          <router-link
            v-if="back"
            :to="back.to"
            class="app-page-header__back"
            :aria-label="`Back to ${back.label}`"
            data-tid="page-back"
          >
            <frame-icon name="chevronLeft" />
          </router-link>
          <router-link
            v-if="bedPage"
            :to="healthTo"
            class="app-page-header__back"
            aria-label="Back to Health"
            data-tid="bed-back"
          >
            <frame-icon name="chevronLeft" />
          </router-link>
          <h1
            class="app-page-header__title"
            data-tid="page-title"
          >
            <span
              v-if="titlePending"
              class="app-page-header__pending"
              role="img"
              aria-label="Finding the printer's name"
              data-tid="page-title-pending"
            />
            <template v-else>
              {{ title }}
            </template>
          </h1>
          <tone-pill
            v-if="overviewHome"
            :tone="pillTone"
          >
            {{ pillText }}
          </tone-pill>
        </div>
        <p
          v-if="subtitle"
          class="app-page-header__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="app-page-header__actions">
        <control-actions v-if="currentSection && currentSection.id === 'control' && !isMobileViewport" />
        <overview-actions v-if="overviewHome && !foreignRecord && !isMobileViewport" />
        <printer-page-menu v-if="overviewHome && !foreignRecord" />
        <jobs-actions v-if="jobsHome" />
        <timelapse-actions v-if="timelapseHome" />
        <preview-actions v-if="previewPage" />
        <maintenance-actions
          v-if="maintenancePages"
          :page="bedPage ? 'bed' : 'health'"
        />
        <console-actions v-if="currentSection && currentSection.id === 'console'" />
        <files-actions v-if="currentSection && currentSection.id === 'files' && isMobileViewport" />
        <camera-actions v-if="currentSection && currentSection.id === 'camera'" />
        <router-link
          v-if="settingsSection && settingsSection.id === 'console' && !isMobileViewport"
          :to="consoleTo"
          class="cbtn cbtn--ghost"
          data-tid="settings-open-console"
        >
          <frame-icon
            name="console"
            small
          />
          Open Console
        </router-link>
        <router-link
          v-if="settingsSection && settingsSection.id === 'files' && !isMobileViewport"
          :to="filesTo"
          class="cbtn cbtn--ghost"
          data-tid="settings-open-files"
        >
          <frame-icon
            name="files"
            small
          />
          Open Files
        </router-link>
        <router-link
          v-if="settingsSection && settingsSection.id === 'cameras' && !isMobileViewport"
          :to="addCameraTo"
          class="cbtn cbtn--primary"
          data-tid="settings-add-camera"
        >
          <frame-icon
            name="plus"
            small
          />
          Add a camera
        </router-link>
        <router-link
          v-if="settingsSection && settingsSection.id === 'timelapse' && !isMobileViewport"
          :to="videosTo"
          class="cbtn cbtn--ghost"
          data-tid="settings-open-videos"
        >
          <frame-icon
            name="clock"
            small
          />
          Videos
        </router-link>
        <charts-actions v-if="chartsHome" />
      </div>
    </div>
    <nav
      v-if="tabs.length > 1"
      class="app-page-header__tabs"
      :aria-label="`${title} pages`"
    >
      <router-link
        v-for="page in tabs"
        :key="page.path"
        :to="pageTo(page)"
        class="app-page-header__tab"
        :class="{ 'app-page-header__tab--on': isOn(page) }"
        :aria-current="isOn(page) ? 'page' : undefined"
      >
        {{ page.label }}
      </router-link>
    </nav>
  </header>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import { remoteRouteLabel } from '@/services/muon-ble/link'
import { clearHostOff, hostPower } from '@/services/system/restart'
import BrowserMixin from '@/mixins/browser'
import { pageMatches, type SectionPage } from '@/router/printerSections'
import { SECTION_COMPONENTS, openSettingsSection, type SettingsSection } from '@/services/settings/sections'
import ControlActions from '@/components/control/ControlActions.vue'
import OverviewActions from '@/components/overview/OverviewActions.vue'
import PrinterPageMenu from '@/components/overview/PrinterPageMenu.vue'
import MaintenanceActions from '@/components/maintenance/MaintenanceActions.vue'
import { maintenancePage } from '@/services/maintenance/page-state'
import { healthSummary } from '@/services/maintenance/health'
import { scopedPath } from '@/router/printerPagePaths'
import ConsoleActions from '@/components/console/ConsoleActions.vue'
import FilesActions from '@/components/files/FilesActions.vue'
import CameraActions from '@/components/camera/CameraActions.vue'
import { cameraPage } from '@/services/camera/page-state'
import JobsActions from '@/components/jobs/JobsActions.vue'
import TimelapseActions from '@/components/timelapse/TimelapseActions.vue'
import PreviewActions from '@/components/gcode-preview/PreviewActions.vue'
import { timelapseSummary } from '@/services/timelapse/model'
import { fileSize } from '@/services/jobs/model'
import { activeSlug, foreignRecordForSlug, isForeignSlug } from '@/services/printer-pages'
import type { AppFile, FileBrowserEntry } from '@/store/files/types'
import ChartsActions from '@/components/charts/ChartsActions.vue'
import { chartsPage } from '@/services/charts/page-state'
import { effectiveRange, rangeText } from '@/services/charts/model'
import { jobsPage } from '@/services/jobs/page-state'
import TonePill from '@/components/printers/TonePill.vue'
import PrinterStatusMixin from '@/mixins/printer-status'
import { cloudState } from '@/services/muon-cloud/state'
import { jobName } from '@/services/printers-page/model'
import { printerNameParts } from '@/util/printer-name'
import type { TileTone } from '@/services/printers-page/model'
import { liveForeign } from '@/services/foreign-printers/live'
import { emptyStatus } from '@/services/foreign-printers/adapters/base'
import { FOREIGN_STATE_LABELS, FOREIGN_STATE_TONES, type ForeignStatus } from '@/services/foreign-printers/types'

/**
 * A printer page's title on the left and its own actions on the right,
 * with the section's pages as tabs under it (Jobs: Jobs, Preview, History,
 * Timelapse).
 */
@Component({ components: { FilesActions, ChartsActions, ConsoleActions, CameraActions, JobsActions, TimelapseActions, PreviewActions, ControlActions, OverviewActions, PrinterPageMenu, MaintenanceActions, TonePill } })
export default class AppPageTitle extends Mixins(FrameMixin, BrowserMixin, PrinterStatusMixin) {
  get foreignRecord () {
    const slug = this.$route.params.printer
    return isForeignSlug(slug) ? foreignRecordForSlug(slug) : undefined
  }

  get foreignStatus (): ForeignStatus | null {
    return this.foreignRecord
      ? liveForeign.status[this.foreignRecord.id] ?? emptyStatus()
      : null
  }

  /** Overview is the printer's own page: it is named by the printer, with its state beside it. */
  get overviewHome (): boolean {
    return this.currentSection?.id === 'overview' && this.currentPage === '/'
  }

  /** Charts, under Overview: the shared time range and Add chart sit in its header. */
  get chartsHome (): boolean {
    return this.currentPage === '/diagnostics' && !this.foreignRecord
  }

  /** Overview is titled with the printer's name: a placeholder until it is known (KAN-2257). */
  get titlePending (): boolean {
    return this.overviewHome && !this.foreignRecord && this.nameWaiting
  }

  get title (): string {
    if (this.chartsHome) return 'Charts'
    if (this.overviewHome) return this.foreignRecord?.name ?? this.shownName
    if (this.previewPage) return this.previewFile?.filename.replace(/\.g(code)?$/i, '') || 'G-code preview'
    if (this.timelapseHome) return 'Timelapse'
    // Settings lists its own sections; Wi-Fi and System are named for themselves.
    if (this.currentSection?.id === 'settings') {
      const page = this.currentSection.pages.find(p => p.path !== '/settings' && this.isOn(p))
      if (page) return page.label
    }
    if (this.maintenancePages) return this.bedPage ? 'Bed' : 'Health'
    const section = this.settingsSection
    if (section && !(section.id === 'general' && !this.isMobileViewport)) return section.label
    return this.currentSection?.label ?? this.$route.name ?? ''
  }

  /** Settings' open section, by the address's anchor: it names the page, as a section's own header does. */
  get settingsSection (): SettingsSection | null {
    if (this.currentSection?.id !== 'settings' || this.currentPage !== '/settings') return null
    const supports = (name: string) => this.$store.getters['server/componentSupport'](name) as boolean
    return openSettingsSection(this.$route.hash, { components: SECTION_COMPONENTS.filter(supports) })
  }

  /** Maintenance's two pages are named for themselves: Health, and Bed with a way back to Health. */
  get maintenancePages (): boolean {
    return this.currentSection?.id === 'maintenance' && !this.foreignRecord
  }

  get bedPage (): boolean {
    return this.maintenancePages && this.currentPage === '/tune'
  }

  get healthTo (): string {
    return scopedPath('/maintenance', activeSlug())
  }

  get consoleTo (): string {
    return scopedPath('/console', activeSlug())
  }

  get addCameraTo (): { path: string, hash: string, query: { add: string } } {
    return { path: scopedPath('/settings', activeSlug()), hash: '#camera', query: { add: '1' } }
  }

  get videosTo (): string {
    return scopedPath('/timelapse', activeSlug())
  }

  get filesTo (): string {
    return scopedPath('/configure', activeSlug())
  }

  /** Jobs' own page: its header carries the search, the order and Upload, and History and Timelapse sit in its ··· menu. */
  get jobsHome (): boolean {
    return this.currentSection?.id === 'jobs' && this.currentPage === '/jobs' && !this.foreignRecord
  }

  /** Timelapse is a page to watch: its header counts the videos and links to its settings. */
  get timelapseHome (): boolean {
    return this.currentSection?.id === 'jobs' && this.currentPage === '/timelapse' && !this.foreignRecord
  }

  /** The G-code preview: its header names the file, with a way back to Jobs, Open another and Print this. */
  get previewPage (): boolean {
    return this.currentSection?.id === 'jobs' && this.currentPage === '/preview' && !this.foreignRecord
  }

  get jobsPath (): string {
    return scopedPath('/jobs', activeSlug())
  }

  /** The way back from a page that sits under another: the preview to Jobs, Timelapse to History (Jobs, when the printer keeps no history). */
  get back (): { to: string, label: string } | null {
    if (this.previewPage) return { to: this.jobsPath, label: 'Jobs' }
    if (this.timelapseHome) {
      if (this.$store.getters['server/componentSupport']('history')) return { to: scopedPath('/history', activeSlug()), label: 'History' }
      return { to: this.jobsPath, label: 'Jobs' }
    }
    return null
  }

  get previewFile (): AppFile | undefined {
    return this.$store.getters['gcodePreview/getFile'] as AppFile | undefined
  }

  get previewSubtitle (): string {
    const file = this.previewFile
    if (!file) return "Load what's printing, or open a file"
    const layers = (this.$store.getters['gcodePreview/getLayers'] as unknown[] | undefined)?.length ?? 0
    const parts = ['G-code preview']
    if (file.size) parts.push(fileSize(file.size))
    if (layers) parts.push(`${layers.toLocaleString()} ${layers === 1 ? 'layer' : 'layers'}`)
    const current = this.$store.state.printer.printer.current_file as AppFile | undefined
    const running = (this.printerPrinting || this.printerPaused) && !!current?.filename &&
      `${current.path}/${current.filename}` === `${file.path}/${file.filename}`
    if (running) parts.push('showing the running print')
    return parts.join(' · ')
  }

  get timelapseSubtitle (): string {
    const entries = this.$store.getters['files/getDirectory']('timelapse') as FileBrowserEntry[] | undefined
    if (!entries) return ''
    const files = entries.filter((e): e is AppFile => e.type === 'file')
    const { videos, bytes } = timelapseSummary(files)
    return `${videos} ${videos === 1 ? 'video' : 'videos'} · ${fileSize(bytes)} on ${printerNameParts(this.displayName).name}`
  }

  get pillTone (): TileTone {
    if (this.foreignStatus) return FOREIGN_STATE_TONES[this.foreignStatus.state]
    const tones: Record<string, TileTone> = { ok: 'ok', active: 'run', warn: 'warn', fault: 'err', off: 'off' }
    return tones[this.statusTone] ?? 'off'
  }

  @Watch('socketConnected')
  onSocketConnected (connected: boolean) {
    if (connected) clearHostOff()
  }

  get pillText (): string {
    if (this.foreignStatus) return FOREIGN_STATE_LABELS[this.foreignStatus.state]
    // Shut down from System: it is off, not lost.
    if (!this.socketConnected) return hostPower.offAt ? 'Off' : 'Offline'
    if (!this.klippyReady) return 'Not ready'
    return this.$filters.prettyCase(this.printerState || 'ready')
  }

  /** A line under the title, for a page that says what it holds. */
  get subtitle (): string {
    if (this.jobsHome) {
      const files = jobsPage.files
      const parts = [`${files} ${files === 1 ? 'file' : 'files'}${jobsPage.printerName ? ` on ${jobsPage.printerName}` : ''}`]
      if (jobsPage.free) parts.push(jobsPage.free)
      if (this.currentSection && this.pagesOf(this.currentSection).some(p => p.path === '/history' || p.path === '/timelapse')) {
        parts.push('History and Timelapse are in the ··· menu')
      }
      return parts.join(' · ')
    }
    if (this.bedPage) return `Mesh and probe for ${printerNameParts(this.displayName).name} · Maintenance`
    if (this.maintenancePages && this.currentPage === '/maintenance' && !this.isMobileViewport) {
      return maintenancePage.rows.length
        ? healthSummary(printerNameParts(this.displayName).name, maintenancePage.rows, maintenancePage.lastRun, Date.now())
        : "What keeps prints coming out right. Each check says when it last ran and whether it's due."
    }
    if (this.currentSection?.id === 'control' && this.currentPage === '/control') {
      const name = printerNameParts(this.displayName).name
      const file = this.$store.state.printer.printer.print_stats?.filename as string | undefined
      const head = `Move, heat and feed ${name} by hand`
      if (this.printerPrinting && file) return `${head} · printing ${jobName(file)}, so axes are locked while it runs`
      if (this.printerPaused && file) return `${head} · ${jobName(file)} is paused, so axes are locked`
      return head
    }
    if (this.currentSection?.id === 'console') return 'Send G-code and read what Klipper says back'
    if (this.timelapseHome && this.$store.getters['server/componentSupport']('timelapse')) return this.timelapseSubtitle
    if (this.previewPage) return this.previewSubtitle
    if (this.chartsHome) {
      const name = printerNameParts(this.displayName).name
      if (!this.$store.state.config.uiSettings.general.enableDiagnostics) return `Your own charts, from anything ${name} reports`
      const range = effectiveRange(chartsPage.range, this.$store.getters['charts/getChartRetention'] as number)
      return `Live diagnostics for ${name} · last ${rangeText(range)}`
    }
    if (this.currentSection?.id === 'camera') return cameraPage.subtitle
    if (this.currentSection?.id === 'files') return `${printerNameParts(this.displayName).name}'s config and other files · tap a file to edit it`
    if (this.isMobileViewport) return ''
    if (this.overviewHome) {
      if (this.foreignRecord) return ''
      const file = this.$store.state.printer.printer.print_stats?.filename as string | undefined
      const route = cloudState.activePrinterId ? remoteRouteLabel(cloudState.activePrinterId) : 'On this network'
      if ((this.printerPrinting || this.printerPaused) && file) {
        const duration = this.$store.state.printer.printer.print_stats?.total_duration as number | undefined
        const started = duration ? new Date(Date.now() - duration * 1000) : null
        const at = started ? ` · started ${String(started.getHours()).padStart(2, '0')}:${String(started.getMinutes()).padStart(2, '0')}` : ''
        return `${jobName(file)}${at}`
      }
      return route
    }
    if (this.currentPage === '/settings') {
      const section = this.settingsSection
      return section && section.id !== 'general' ? section.blurb : 'How Control looks and behaves on this printer'
    }
    if (this.currentPage === '/history') {
      return `Every print ${printerNameParts(this.displayName).name} has made`
    }
    return ''
  }

  get tabs (): SectionPage[] {
    // Timelapse and the preview are pages of their own: the preview goes back to Jobs, Timelapse to History, and both are in Jobs' ··· menu.
    if (!this.currentSection || this.currentSection.id === 'settings' || this.jobsHome || this.timelapseHome || this.previewPage || this.maintenancePages) return []
    return this.pagesOf(this.currentSection)
  }

  isOn (page: SectionPage): boolean {
    return pageMatches(this.currentPage, page.path)
  }
}
</script>

<style lang="scss" scoped>
  // The printer's name, while it isn't known: a drawn line the height of the
  // title, with the loading sheen (transform only).
  .app-page-header__pending {
    position: relative;
    display: inline-block;
    width: 7em;
    max-width: 60vw;
    height: 0.62em;
    border-radius: 0.31em;
    overflow: hidden;
    vertical-align: middle;
    background: var(--m3d-fill, rgb(128 128 128 / 20%));

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 20%, rgb(255 255 255 / 14%) 50%, transparent 80%);
      animation: app-page-header-sheen 1.4s var(--m3d-ease-standard, ease) infinite;
    }
  }

  @keyframes app-page-header-sheen {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }

  .app-page-header__back {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
  }

  .app-page-header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 4px 20px;
  }

  .app-page-header__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .app-page-header__titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .app-page-header__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .app-page-header__back {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
  }

  .app-page-header__subtitle {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .app-page-header__title {
    overflow: hidden;
    margin: 0;
    color: var(--m3d-text);
    font-family: var(--m3d-font-title, var(--m3d-font-sans));
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-page-header__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
  }

  .app-page-header__tabs {
    display: flex;
    gap: 2px;
    align-self: flex-start;
    max-width: 100%;
    padding: 3px;
    overflow-x: auto;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    scrollbar-width: none;
  }

  .app-page-header__tab {
    display: inline-flex;
    flex: none;
    align-items: center;
    height: 34px;
    padding: 0 14px;
    border-radius: 9px;
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      color: var(--m3d-text) !important;
    }
  }

  .app-page-header__tab--on {
    background: var(--m3d-fill-strong, var(--m3d-border-strong));
    color: var(--m3d-text) !important;
  }

  // Jobs: the header holds a toolbar. On a desktop it stays beside the title,
  // so picking a file never moves the list; on a phone it goes under the title.
  .app-page-header--jobs .app-page-header__actions {
    flex: 1 1 0;
    flex-wrap: nowrap;
    justify-content: flex-end;
    min-width: 0;
  }

  .app-page-header--jobs:not(.app-page-header--phone) .app-page-header__subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-page-header--jobs.app-page-header--phone .app-page-header__row {
    flex-wrap: wrap;
  }

  .app-page-header--jobs.app-page-header--phone .app-page-header__actions {
    flex-basis: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .app-page-header--phone {
    gap: 12px;

    .app-page-header__row {
      flex-wrap: wrap;
      align-items: flex-start;
    }

    padding: 4px 4px 14px;

    .app-page-header__title {
      font-size: 30px;
    }

    .app-page-header__tab {
      height: 36px;
    }
  }
</style>
