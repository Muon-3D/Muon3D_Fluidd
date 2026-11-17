<template>
  <div
    class="printers"
    :class="{ 'printers--phone': isMobileViewport }"
  >
    <deletion-notice
      v-if="deletionPending"
      tid="printers-deletion"
    />
    <!-- Nothing saved, linked or found yet: the empty state helps find the first printer. -->
    <printers-welcome
      v-if="showWelcome"
      :signed-in="!!account"
      :searching="searching"
      :network="scanNetwork || ''"
      :bluetooth-search="bluetoothSearch"
      :bluetooth-off="bluetoothOff"
      :blocked-by-page="!!blockedByPage"
      @rescan="rescan"
      @look-nearby="onLookNearby"
      @address="instanceDialogOpen = true"
      @sign-in="accountDialog = true"
    />

    <template v-else>
      <printers-header
        :summary="summary"
        :search.sync="query"
        :view="view"
        :show-search="page.counts.printers > 1"
        :show-view="!!page.counts.printers"
        :bluetooth-search="bluetoothSearch"
        :bluetooth-off="bluetoothOff"
        :bluetooth-insecure="bluetoothInsecure"
        @update:view="setView"
        @add="addSheetOpen = true"
        @connect-bluetooth="onConnectOverBluetooth"
      />

      <p
        v-if="searching && !page.found.length"
        class="printers__looking"
        data-tid="printers-looking"
      >
        <v-progress-circular
          indeterminate
          size="11"
          width="2"
        />
        Looking{{ scanNetwork ? ` on ${scanNetwork}` : '' }} for printers…
      </p>
      <p
        v-if="secureSite"
        class="printers__secure"
        data-tid="found-secure"
      >
        <template v-if="openLinks.length">
          Control doesn't scan your network from this secure page. Open a printer on your network in a new tab:
          <a
            v-for="link in openLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener"
            data-tid="open-on-network"
          >{{ link.name }}: Open on this network</a>
        </template>
        <template v-else>
          Control doesn't scan your network from this secure page. A printer on your network can be opened by its address, or over Bluetooth.
        </template>
      </p>
      <p
        v-if="blockedByPage"
        class="note"
        data-tid="blocked-by-page"
      >
        This browser won't let this page reach printers by their IP address, because the page was opened by
        name. Add a printer by its name instead, as shown on its screen, such as muon-walnut-8987.
        <template v-if="blockedByPage.ownUrl">
          Or <a :href="blockedByPage.ownUrl">open this printer by its IP address</a>, which can reach them all.
        </template>
      </p>

      <!-- Printing now leads: a printer shows in one place, so groups say which of theirs print above. -->
      <printers-section
        v-if="printingNow.length && view !== 'bench'"
        title="Printing now"
        :count="printingNow.length"
        :note="nextToFinish || ''"
        data-tid="printing-now"
      >
        <printing-now-card
          v-if="printingNow.length === 1 && !isMobileViewport"
          :tile="printingNow[0]"
          variant="wide"
          :thumbnail="thumbnailFor(printingNow[0])"
          :controllable="!!printingNow[0].entry.active"
          :busy="controlBusy"
          @open="openEntry(printingNow[0].entry)"
          @pause="control(pausePrint)"
          @resume="control(resumePrint)"
          @stop="control(cancelPrint)"
        />
        <div
          v-else
          class="printers__now"
        >
          <printing-now-card
            v-for="tile in printingNow"
            :key="tile.key"
            :tile="tile"
            variant="card"
            :thumbnail="thumbnailFor(tile)"
            :controllable="!!tile.entry.active"
            :busy="controlBusy"
            @open="openEntry(tile.entry)"
            @pause="control(pausePrint)"
            @resume="control(resumePrint)"
            @stop="control(cancelPrint)"
          />
        </div>
      </printers-section>

      <!-- Your groups, then the printers saved in this browser. -->
      <!-- The Bench (KAN-2257, control-ctx): each group is a bench, the printers drawn standing on it. -->
      <template v-if="view === 'bench'">
        <printer-bench
          v-for="g in shownGroups"
          :key="g.id"
          :bench-id="g.id"
          :kind="g.id === 'shared' ? 'shelf' : 'bench'"
          :title="g.name"
          :tiles="groupTiles[g.id]"
          :over="dropTarget === g.id"
          :data-tid="`group-${g.id}`"
          @dragover.native.prevent="onDragOver(g)"
          @dragleave.native="dropTarget = null"
          @drop.native.prevent="onDrop(g)"
        >
          <template #title>
            <input
              v-if="renaming === g.id"
              ref="rename"
              class="printers__rename"
              :value="renameDraft"
              aria-label="Bench name"
              @input="onRenameInput"
              @keydown.enter="finishRename(g.id)"
              @keydown.esc="renaming = null"
              @blur="finishRename(g.id)"
            >
            <h2
              v-else
              class="printers__bench-name"
            >
              {{ g.name }}
            </h2>
          </template>
          <template #actions>
            <v-menu
              v-if="g.editable"
              left
              offset-y
            >
              <template #activator="{ on, attrs }">
                <button
                  type="button"
                  class="icon-btn"
                  aria-label="Bench options"
                  v-bind="attrs"
                  v-on="on"
                >
                  <frame-icon name="more" />
                </button>
              </template>
              <v-list dense>
                <v-list-item @click="startRename(g.id)">
                  <v-list-item-title>Rename</v-list-item-title>
                </v-list-item>
                <v-list-item @click="removeGroup(g.id)">
                  <v-list-item-title class="error--text">
                    Remove bench
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <bench-printer
            v-for="tile in groupTiles[g.id]"
            :key="tile.key"
            :tile="tile"
            :actions="benchActionsByKey[tile.key]"
            :draggable="canGroup && !!tile.entry.cloud"
            :draw-on="drawOn"
            @open="openEntry(tile.entry)"
            @action="onBenchAction(tile, $event)"
            @dragstart="onDragStart(tile)"
            @dragend="onDragEnd"
          />
        </printer-bench>
        <div
          v-if="canGroup && !query"
          class="printers__new-bench"
          :class="{ 'printers__new-bench--over': dropTarget === newBench }"
          role="button"
          tabindex="0"
          aria-label="New bench"
          data-tid="new-bench"
          @dragenter.prevent="onDragOverNew"
          @dragover.prevent="onDragOverNew"
          @dragleave="dropTarget = null"
          @drop.prevent="onDropNew"
          @click="addGroup"
          @keydown.enter.prevent="addGroup"
          @keydown.space.prevent="addGroup"
        >
          <svg
            viewBox="0 0 300 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          ><path d="M6 12H294M22 12V38M278 12V38" /></svg>
          <span>+ New bench</span>
          <small>Drop a printer here to start one</small>
        </div>
        <printer-bench
          v-if="foundShown.length"
          bench-id="found"
          kind="door"
          title="Found nearby · not yours yet"
          caption="They wait here until you add them. Nothing is sent to them."
          :tiles="foundShown"
          :searching="searching"
          data-tid="found"
        >
          <template #actions>
            <span
              v-if="searching"
              class="printers__looking"
            >
              <v-progress-circular
                indeterminate
                size="11"
                width="2"
              />
              Looking{{ scanNetwork ? ` on ${scanNetwork}` : '' }}…
            </span>
          </template>
          <bench-printer
            v-for="tile in foundShown"
            :key="tile.key"
            :tile="tile"
            :actions="benchActionsByKey[tile.key]"
            found
            :draw-on="drawOn"
            @action="onFoundRow(tile, $event)"
          />
        </printer-bench>
        <p
          v-if="otherShown.length && mixedContentBlocked"
          class="foreign-warning"
        >
          {{ mixedContentNote }}
        </p>
        <printer-bench
          v-if="otherShown.length"
          bench-id="other"
          kind="shelf"
          title="Other brands"
          icon="printer"
          :tiles="otherShown"
          data-tid="other-printers"
        >
          <bench-printer
            v-for="tile in otherShown"
            :key="tile.key"
            :tile="tile"
            :actions="otherActions"
            :draw-on="drawOn"
            @open="openForeign(tile)"
            @action="onOtherAction(tile, $event)"
          />
        </printer-bench>
        <printer-bench
          v-if="offlineShown.length"
          bench-id="offline"
          kind="shelf"
          icon="printer"
          title="Offline"
          :tiles="offlineShown"
          data-tid="offline"
        >
          <bench-printer
            v-for="tile in offlineShown"
            :key="tile.key"
            :tile="tile"
            :actions="benchActionsByKey[tile.key]"
            :draw-on="drawOn"
            @open="openEntry(tile.entry)"
            @action="onBenchAction(tile, $event)"
          />
        </printer-bench>
      </template>

      <template v-else>
        <printers-section
          v-for="g in shownGroups"
          :key="g.id"
          :count="groupTiles[g.id].length"
          :note="groupNote(g)"
          :class="{ 'printers__section--drop': dropTarget === g.id }"
          :data-tid="`group-${g.id}`"
          @dragover.native.prevent="onDragOver(g)"
          @dragleave.native="dropTarget = null"
          @drop.native.prevent="onDrop(g)"
        >
          <template #title>
            <input
              v-if="renaming === g.id"
              ref="rename"
              class="printers__rename"
              :value="renameDraft"
              aria-label="Group name"
              @input="onRenameInput"
              @keydown.enter="finishRename(g.id)"
              @keydown.esc="renaming = null"
              @blur="finishRename(g.id)"
            >
            <h2
              v-else
              class="printers__group-name"
            >
              {{ g.name }}
            </h2>
          </template>
          <template #actions>
            <v-menu
              v-if="g.editable"
              left
              offset-y
            >
              <template #activator="{ on, attrs }">
                <button
                  type="button"
                  class="icon-btn"
                  aria-label="Group options"
                  v-bind="attrs"
                  v-on="on"
                >
                  <frame-icon name="more" />
                </button>
              </template>
              <v-list dense>
                <v-list-item @click="startRename(g.id)">
                  <v-list-item-title>Rename</v-list-item-title>
                </v-list-item>
                <v-list-item @click="removeGroup(g.id)">
                  <v-list-item-title class="error--text">
                    Remove group
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <div :class="gridClass">
            <printer-tile-card
              v-for="tile in groupTiles[g.id]"
              :key="tile.key"
              :tile="tile"
              :variant="tileVariant"
              :stage-height="150"
              :actions="actionsFor(tile.entry)"
              :busy="busyKey === tile.key"
              :draggable="canGroup && !!tile.entry.cloud"
              @open="openEntry(tile.entry)"
              @action="onAction(tile.entry, $event)"
              @dragstart="onDragStart(tile)"
              @dragend="onDragEnd"
            />
            <div
              v-if="(g.editable || g.id === 'ungrouped') && (dragging || !g.tiles.length)"
              class="drop-hint"
            >
              <frame-icon name="plus" />
              <span>{{ dropHint(g) }}</span>
            </div>
          </div>
        </printers-section>

        <!-- Found nearby, not yours yet: hidden when nothing is found. -->
        <printers-section
          v-if="foundShown.length"
          title="Found nearby · not yours yet"
          :count="foundShown.length"
          data-tid="found"
        >
          <template #actions>
            <span
              v-if="searching"
              class="printers__looking"
            >
              <v-progress-circular
                indeterminate
                size="11"
                width="2"
              />
              Looking{{ scanNetwork ? ` on ${scanNetwork}` : '' }}…
            </span>
          </template>
          <found-list
            :tiles="foundShown"
            :actions-for="foundActionsFor"
            :busy-key="busyKey"
            @action="onFoundRow"
          />
        </printers-section>

        <printers-section
          v-if="otherShown.length"
          title="Other brands"
          :count="otherShown.length"
          note="Not M1s, saved in this browser only. They never go through Muon3D's servers."
          data-tid="other-printers"
        >
          <p
            v-if="mixedContentBlocked"
            class="foreign-warning"
          >
            {{ mixedContentNote }}
          </p>
          <other-printers
            :tiles="otherShown"
            @open="openForeign"
            @forget="forgetForeignPrinter"
          />
        </printers-section>

        <!-- Offline is last and dimmed, with its reason. -->
        <printers-section
          v-if="offlineShown.length"
          title="Offline"
          :count="offlineShown.length"
          muted
          data-tid="offline"
        >
          <offline-list
            :tiles="offlineShown"
            :actions-for="offlineActionsFor"
            @action="onOfflineRow"
          />
        </printers-section>
      </template>

      <!-- Nothing matches: say so, and how to get back, in every view. -->
      <div
        v-if="!deletionPending && query && !anyShown"
        class="printers__none"
        data-tid="printers-none"
      >
        <span class="printers__none-icon"><frame-icon name="search" /></span>
        <b>No printer matches "{{ query }}"</b>
        <span>Search looks at a printer's name, state and group.</span>
        <button
          type="button"
          class="btn btn--sm"
          @click="query = ''"
        >
          Clear search
        </button>
      </div>

      <div
        v-if="!account"
        class="inset"
      >
        <frame-icon name="cloud" />
        <span class="inset__text">
          Sign in to reach these from anywhere, sort them into groups and hear when a print finishes.
          <span class="dim">Optional.</span>
        </span>
        <button
          type="button"
          class="btn btn--sm"
          data-tid="sign-in"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>

      <!-- The Bench has its own "+ New bench" drop target in place of this. -->
      <button
        v-if="canGroup && view !== 'bench'"
        type="button"
        class="new-group"
        data-tid="new-group"
        @click="addGroup"
      >
        <frame-icon
          name="plus"
          small
        />
        New group
      </button>
    </template>

    <p
      v-if="notice"
      class="note"
    >
      {{ notice }}
      <a
        v-if="noticeLink"
        :href="noticeLink"
        target="_blank"
        rel="noopener"
        data-tid="notice-link"
      >{{ noticeLink }}</a>
    </p>
    <p
      v-if="nearby.error"
      class="note note--error"
    >
      {{ nearby.error }}
    </p>
    <p
      v-if="activationError"
      class="note note--error"
    >
      {{ activationError }}
      <template v-if="activationFallback">
        <a :href="activationFallback">Open the printer's own page</a> instead.
      </template>
    </p>

    <add-printer-sheet
      v-model="addSheetOpen"
      :bluetooth-search="bluetoothSearch"
      :bluetooth-off="bluetoothOff"
      :searching="searching"
      :network="scanNetwork || ''"
      :found="page.found.length"
      @look-nearby="addSheetOpen = false; onLookNearby()"
      @rescan="rescan"
      @address="addSheetOpen = false; instanceDialogOpen = true"
    />
    <add-instance-dialog
      v-if="instanceDialogOpen"
      v-model="instanceDialogOpen"
      :found="foundChoices"
      :searching="searching"
      @resolve="openInstance"
      @pick="onPickFound"
      @saved="refreshForeignPrinters"
    />
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
      @signed-in="onSignedIn"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
      :initial-printer-id="linkPrinterId"
      :initial-host="linkHost"
    />
    <access-request-dialog
      v-if="accessDialog && accessAsk && accessClient"
      v-model="accessDialog"
      :client="accessClient"
      :ask="accessAsk"
      :printer-name="accessName"
      @answered="onAccessAnswered"
    />
    <bluetooth-setup-dialog
      v-if="setupDialog && setupPrinter"
      v-model="setupDialog"
      :printer="setupPrinter"
      @finished="rescan"
      @pair="pairNearbyPrinter"
    />
  </div>
</template>

<script lang="ts">
import { visibleInterval } from '@/util/visible-interval'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import PrinterEntriesMixin from '@/mixins/printer-entries'
import BrowserMixin from '@/mixins/browser'
import FilesMixin from '@/mixins/files'
import { cloudPrinterConnection, cloudState, saveLayout } from '@/services/muon-cloud/state'
import { discoverPrinters, discoveryState, lanAddresses, lanFetch, lanOpenLinks, pageIsSecure, refreshCloudNearby, refreshKnownPrinters, refreshLanStatus } from '@/services/muon-cloud/discovery'
import { afterFirstPaint } from '@/services/startup/idle'
import { loadedRecord } from '@/services/muon-cloud/status'
import { jobPicture } from '@/services/printers-page/pictures'
import { foreignEntries, savedUpdates, type Directory, type DirectoryEntry } from '@/services/muon-cloud/directory'
import { startNearby, stopNearby } from '@/services/muon-ble/nearby'
import { printerHomePath, foreignSlugForId } from '@/services/printer-pages'
import { saveSnapshotPrinters, snapshotPrinter } from '@/services/startup/snapshot'
import {
  needsYou,
  printersPage,
  type PrintersPage,
  type PrinterTile,
  type TileGroup,
  type TileJob
} from '@/services/printers-page/model'
import type { TimeEstimates } from '@/store/printer/types'
import { shortDuration } from '@/util/short-duration'
import { eventTargetIsContentEditable } from '@/util/event-helpers'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'
import BluetoothSetupDialog from '@/components/muon-ble/BluetoothSetupDialog.vue'
import AccessRequestDialog from '@/components/muon-access/AccessRequestDialog.vue'
import PrintersHeader from '@/components/printers/PrintersHeader.vue'
import PrintersSection from '@/components/printers/PrintersSection.vue'
import PrinterBench from '@/components/printers/PrinterBench.vue'
import BenchPrinter, { type BenchAction } from '@/components/printers/BenchPrinter.vue'
import PrintersWelcome from '@/components/printers/PrintersWelcome.vue'
import AddPrinterSheet from '@/components/printers/AddPrinterSheet.vue'
import FoundList from '@/components/printers/FoundList.vue'
import OfflineList from '@/components/printers/OfflineList.vue'
import OtherPrinters from '@/components/printers/OtherPrinters.vue'
import PrinterTileCard from '@/components/printers/PrinterTileCard.vue'
import PrintingNowCard from '@/components/printers/PrintingNowCard.vue'
import type { FoundChoice } from '@/components/common/AddInstanceDialog.vue'
import { liveForeign, loadForeign, connectAll, forget as forgetForeign } from '@/services/foreign-printers/live'
import { blocksForeignHttp } from '@/util/browser-family'
import { pageBlocksPrinter } from '@/util/page-blocks-printer'

type View = 'cards' | 'list' | 'bench'

/** An Other brands printer on the Bench: open it, or have this browser forget it. */
const OTHER_ACTIONS: BenchAction[] = [{ id: 'open', label: 'Open' }, { id: 'forget', label: 'Forget' }]

/** How often the printers already known are asked again while the page is open. */
const HEALTH_EVERY_MS = 15_000
/** How often what the printers found on this network are doing is read again: a print moves. */
const STATUS_EVERY_MS = 3_000
const VIEW_KEY = 'muon3d.printers.view'

function readView (): View {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'list' || v === 'bench' ? v : 'cards'
  } catch {
    return 'cards'
  }
}

/**
 * Printers (`/`): every printer, in one place (U1, U6). What is printing
 * now leads, the whole width for one and side by side for several; then
 * your groups; then what was found on this network, large, whether or not
 * you're signed in; then what is offline. With nothing yet, it welcomes
 * and helps find the first printer.
 */
@Component({
  components: {
    DeletionNotice: () => import('@/components/account/DeletionNotice.vue'),
    CloudAccountDialog,
    LinkPrinterDialog,
    BluetoothSetupDialog,
    AccessRequestDialog,
    PrintersHeader,
    PrintersSection,
    PrinterBench,
    BenchPrinter,
    PrintersWelcome,
    AddPrinterSheet,
    FoundList,
    OfflineList,
    OtherPrinters,
    PrinterTileCard,
    PrintingNowCard
  }
})
export default class Printers extends Mixins(PrinterEntriesMixin, BrowserMixin, FilesMixin) {
  query = ''
  /** A print control was just used: the next one waits a moment (a double click is one). */
  controlBusy = false
  view: View = readView()
  /** The Bench's drawings draw themselves on the first arrival only, not on every refresh. */
  drawOn = true
  readonly newBench = 'new-bench'
  readonly otherActions = OTHER_ACTIONS
  readonly mixedContentNote = "Firefox and Safari block this page (https) from talking to a printer on plain http — that's mixed content. Chrome can reach printers on your network: open Control in Chrome."
  addSheetOpen = false
  dragging: string | null = null
  dropTarget: string | null = null
  renaming: string | null = null
  /**
   * The name being typed, kept here rather than read back from the input: a re-render of the groups (a printer going
   * offline, under load) can recreate the input, which then held the old name, and Enter saved that (#362's e2e).
   */
  renameDraft = ''
  timer: (() => void) | null = null
  /** Set on destroy, so a sweep still waiting for the first paint doesn't start. */
  gone = false
  statusTimer: (() => void) | null = null

  created () {
    // The drawings draw themselves as the page arrives, then stay drawn.
    window.setTimeout(() => { this.drawOn = false }, 1500)
    loadForeign().then(() => connectAll()).catch(() => {})
    if (new URLSearchParams(location.search).get('addPrinter') === '1') this.instanceDialogOpen = true
    // The console's list of printers on this network is one request, and its
    // printers are read at once. The sweep is 500 and more (every address on
    // two or three networks): it waits until the page has painted, so it
    // doesn't hold up the first load's own requests (KAN-525, 14 Oct 2026).
    refreshCloudNearby().catch(() => {})
    afterFirstPaint(() => {
      if (!this.gone) discoverPrinters(false, { nearby: false }).catch(() => {})
    })
    startNearby().catch(() => {})
    this.timer = visibleInterval(() => { refreshKnownPrinters().catch(() => {}) }, HEALTH_EVERY_MS)
    this.statusTimer = visibleInterval(() => { refreshLanStatus().catch(() => {}) }, STATUS_EVERY_MS)
    window.addEventListener('keydown', this.onDigit)
  }

  beforeDestroy () {
    this.gone = true
    this.timer?.()
    this.statusTimer?.()
    window.removeEventListener('keydown', this.onDigit)
    stopNearby()
  }

  /** The printers in the groups, in the order shown, each once: 1 to 9 open them. */
  get numbered (): PrinterTile[] {
    const seen = new Set<string>()
    const out: PrinterTile[] = []
    for (const t of this.printingNow) {
      if (!seen.has(t.key)) {
        seen.add(t.key)
        out.push(t)
      }
    }
    for (const g of this.shownGroups) {
      for (const t of this.groupTiles[g.id]) {
        if (!seen.has(t.key)) {
          seen.add(t.key)
          out.push(t)
        }
      }
    }
    return out
  }

  onDigit (event: KeyboardEvent) {
    if (!this.$store.state.config.uiSettings.general.enableKeyboardShortcuts) return
    if (event.ctrlKey || event.metaKey || event.altKey || eventTargetIsContentEditable(event)) return
    if (!/^[1-9]$/.test(event.key)) return
    const tile = this.numbered[Number(event.key) - 1]
    if (!tile) return
    event.preventDefault()
    this.openEntry(tile.entry)
  }

  /** Opened from here, a printer's own page follows. */
  afterOpen () {
    this.$router.push(printerHomePath()).catch(() => {})
  }

  /** The print on the printer Fluidd is on now, from its own socket. */
  get activeJob (): TileJob | null {
    if (!this.printerPrinting && !this.printerPaused) return null
    const printer = this.$store.state.printer.printer
    const estimates = this.$store.getters['printer/getTimeEstimates'] as TimeEstimates
    const left = (estimates.eta - Date.now()) / 1000
    return {
      file: printer.print_stats?.filename || null,
      progress: Math.floor((this.$store.getters['printer/getPrintProgress'] as number) * 100),
      secondsLeft: left > 0 ? left : null,
      layer: (this.$store.getters['printer/getPrintLayer'] as number) || null,
      layers: (this.$store.getters['printer/getPrintLayers'] as number) || null,
      nozzle: typeof printer.extruder?.temperature === 'number' ? Math.round(printer.extruder.temperature) : null,
      bed: typeof printer.heater_bed?.temperature === 'number' ? Math.round(printer.heater_bed.temperature) : null,
      nozzleTarget: typeof printer.extruder?.target === 'number' ? printer.extruder.target : null,
      bedTarget: typeof printer.heater_bed?.target === 'number' ? printer.heater_bed.target : null,
      material: loadedRecord(printer.save_variables?.variables) ?? null
    }
  }

  get page (): PrintersPage {
    const directory: Directory = {
      ...this.directory,
      foreign: foreignEntries(liveForeign.records.map(r => ({ record: r, status: liveForeign.status[r.id] ?? null })))
    }
    return printersPage({
      directory,
      groups: this.account && !this.deletionPending ? cloudState.layout.groups : [],
      status: cloudState.status,
      activeJob: this.activeJob,
      signedIn: !!this.account
    })
  }

  get secureSite (): boolean {
    return pageIsSecure()
  }

  get openLinks () {
    return lanOpenLinks(cloudState.printers)
  }

  get mixedContentBlocked (): boolean {
    return blocksForeignHttp() && this.page.other.some(tile => pageBlocksPrinter(`http://${tile.entry.host}`))
  }

  openForeign (tile: PrinterTile) {
    const slug = foreignSlugForId(tile.entry.foreign!.record.id)
    if (slug) this.$router.push(`/${slug}`).catch(() => {})
  }

  async forgetForeignPrinter (tile: PrinterTile) {
    const name = tile.entry.foreign!.record.name
    if (await this.$confirm(`Control forgets ${name} in this browser.`, { title: `Forget ${name}?`, buttonTrueText: 'Forget', danger: true })) {
      await forgetForeign(tile.entry.foreign!.record.id)
    }
  }

  async refreshForeignPrinters () {
    const live = await import('@/services/foreign-printers/live')
    await live.refreshForeign()
    await live.connectAll()
  }

  /** The tiles kept for the next load's cached view (KAN-525), saved a second after the page settles. */
  snapshotTimer = 0

  @Watch('page')
  onPageSnapshot () {
    clearTimeout(this.snapshotTimer)
    this.snapshotTimer = window.setTimeout(() => {
      const tiles = [
        this.page.printingNow,
        this.page.groups.map(g => g.tiles),
        this.page.found,
        this.page.offline
      ].flat(2)
      const seen = new Set<string>()
      saveSnapshotPrinters(tiles.filter(t => t.key && !seen.has(t.key) && !!seen.add(t.key)).map(snapshotPrinter))
    }, 1000)
  }

  /** "7 printers · 2 printing · 1 found on this network": one muted line. */
  get summary (): string {
    const c = this.page.counts
    const parts = [c.printers === 1 ? '1 printer' : `${c.printers} printers`]
    if (c.printing) parts.push(`${c.printing} printing`)
    if (c.ready) parts.push(`${c.ready} ready`)
    if (c.needsYou) parts.push(`${c.needsYou} ${c.needsYou === 1 ? 'needs' : 'need'} you`)
    if (c.offline) parts.push(`${c.offline} offline`)
    if (c.found) parts.push(`${c.found} found on this network`)
    return parts.join(' · ')
  }

  /** What a search looks at: the name, the state in words, the line under it and the group. */
  matches (tile: PrinterTile): boolean {
    const q = this.query.trim().toLowerCase()
    if (!q) return true
    const words = [tile.name, tile.label, tile.state, tile.detail, tile.groupName ?? '', tile.entry.host ?? '', needsYou(tile.state) ? 'needs you' : '']
    return words.join(' ').toLowerCase().includes(q)
  }

  /** Nothing saved, linked or found, signed in or not: the empty state helps find the first printer. */
  get showWelcome (): boolean {
    return this.page.welcome || (!this.page.counts.printers && !this.page.found.length)
  }

  /** Printing and paused printers lead the page, and stay in their groups too, with their menu and drag. */
  get printingNow (): PrinterTile[] {
    return this.page.printingNow.filter(t => this.matches(t))
  }

  /** Without printers to search among, search is gone: a query left in it would hide everything. */
  @Watch('page.counts.printers')
  onPrinterCount (count: number) {
    if (count <= 1) this.query = ''
  }

  /** "next to finish: Walnut in 3m". */
  get nextToFinish (): string | null {
    const timed = this.printingNow.filter(t => t.state === 'printing' && t.job?.secondsLeft)
    if (timed.length < 2) return null
    const next = timed.reduce((a, b) => (a.job!.secondsLeft! <= b.job!.secondsLeft! ? a : b))
    return `next to finish: ${next.name} in ${shortDuration(next.job!.secondsLeft!)}`
  }

  /** A group's printers matching the search. */
  filtered (tiles: PrinterTile[]): PrinterTile[] {
    return tiles.filter(t => this.matches(t))
  }

  /** Each group's printers matching the search, worked out once per change rather than on every render. */
  get groupTiles (): Record<string, PrinterTile[]> {
    const tiles: Record<string, PrinterTile[]> = {}
    for (const g of this.page.groups) tiles[g.id] = this.filtered(g.tiles)
    return tiles
  }

  get shownGroups (): TileGroup[] {
    return this.page.groups.filter(g => {
      if (this.groupTiles[g.id].length) return true
      if (this.query) return false
      // Yours stay (to rename, remove or drop into); "Not in a group" only while dragging.
      return g.editable || (g.id === 'ungrouped' && !!this.dragging)
    })
  }

  /** "1 printing · 2 ready", and for your own groups how to rearrange them. */
  groupNote (g: TileGroup): string {
    let note = g.tiles.length ? g.summary : ''
    if (g.editable && !this.isMobileViewport) note = [note, 'drag printers in or out'].filter(Boolean).join(' · ')
    return note
  }

  get foundShown (): PrinterTile[] {
    return this.page.found.filter(t => this.matches(t))
  }

  get otherShown (): PrinterTile[] {
    return this.page.other.filter(t => this.matches(t))
  }

  get offlineShown (): PrinterTile[] {
    return this.page.offline.filter(t => this.matches(t))
  }

  get anyShown (): boolean {
    return !!(this.printingNow.length || this.shownGroups.length || this.foundShown.length || this.otherShown.length || this.offlineShown.length)
  }

  foundActionsFor (tile: PrinterTile) {
    return this.foundActions(tile.entry)
  }

  offlineActionsFor (tile: PrinterTile) {
    return this.actionsFor(tile.entry)
  }

  onFoundRow (tile: PrinterTile, id: string) {
    return this.onFoundAction(tile.entry, id)
  }

  onOfflineRow (tile: PrinterTile, id: string) {
    return this.onAction(tile.entry, id)
  }

  dropHint (g: TileGroup): string {
    if (g.id === 'ungrouped') return 'Drop a printer here to take it out of its group'
    return g.tiles.length ? 'Drop a printer here' : 'Drag printers here'
  }

  /** Grid or List, on every size. */
  get tileVariant (): 'card' | 'row' {
    return this.view === 'list' ? 'row' : 'card'
  }

  get gridClass (): string {
    return `printers__grid printers__grid--${this.tileVariant}`
  }

  /** Pause, resume or stop the print on the printer Fluidd is on, once per click however fast it is clicked. */
  control (action: () => unknown) {
    if (this.controlBusy) return
    this.controlBusy = true
    Promise.resolve(action.call(this)).catch(() => {}).finally(() => {
      window.setTimeout(() => { this.controlBusy = false }, 1200)
    })
  }

  setView (view: View) {
    this.view = view
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // The choice holds for this visit.
    }
  }

  /**
   * The part's picture: for the printer Fluidd is on, from its own store;
   * for any other, read from that printer (on this network, or through
   * Muon3D) once per file.
   */
  thumbnailFor (tile: PrinterTile): string | null {
    if (tile.entry.active) {
      const file = this.$store.state.printer.printer.current_file
      if (!file?.thumbnails?.length) return null
      return this.getThumbUrl(file, 'gcodes', file.path, true, file.modified) ?? null
    }
    const filename = tile.job?.file
    if (!filename) return null
    const lan = tile.entry.lan
    if (lan && !tile.remote) return jobPicture(`lan:${lan.apiUrl}`, filename, path => lanFetch(`${lan.apiUrl}${path}`))
    const cloud = tile.entry.cloud
    if (cloud) return jobPicture(`cloud:${cloud.id}`, filename, async path => (await cloudPrinterConnection(cloud.id)).fetch(path))
    return null
  }

  /** What Add a printer offers in one tap: the printers found here that it can open. */
  get foundChoices (): FoundChoice[] {
    return this.page.found
      .filter(t => t.entry.row?.action === 'open' && !!t.entry.host)
      .map(t => ({ key: t.key, name: t.name, detail: t.entry.host ?? t.detail }))
  }

  onPickFound (key: string) {
    const tile = this.page.found.find(t => t.key === key)
    if (tile) this.openFoundEntry(tile.entry)
  }

  onFoundAction (e: DirectoryEntry, id: string) {
    if (id === 'set-up' || id === 'nearby-info') return this.openFoundEntry(e)
    return this.onAction(e, id)
  }

  // -- groups (the account's, U6) --------------------------------------------

  get canGroup (): boolean {
    return !!this.account && !this.deletionPending
  }

  persistGroups (groups: Array<{ id: string, name: string, printers: string[] }>) {
    saveLayout({ ...cloudState.layout, groups })
  }

  addGroup () {
    const id = `g${Date.now().toString(36)}`
    const groups = cloudState.layout.groups
    this.persistGroups([...groups, { id, name: `Group ${groups.length + 1}`, printers: [] }])
    this.startRename(id)
  }

  startRename (id: string) {
    this.renaming = id
    this.renameDraft = cloudState.layout.groups.find(g => g.id === id)?.name ?? ''
    this.$nextTick(() => {
      const input = (this.$refs.rename as HTMLInputElement[] | undefined)?.[0]
      input?.focus()
      input?.select()
    })
  }

  onRenameInput (event: Event) {
    this.renameDraft = (event.target as HTMLInputElement).value
  }

  finishRename (id: string) {
    if (this.renaming !== id) return
    this.renaming = null
    const name = this.renameDraft.trim()
    if (!name) return
    this.persistGroups(cloudState.layout.groups.map(g => (g.id === id ? { ...g, name } : g)))
  }

  removeGroup (id: string) {
    this.persistGroups(cloudState.layout.groups.filter(g => g.id !== id))
  }

  onDragStart (tile: PrinterTile) {
    this.dragging = tile.entry.cloud?.id ?? null
  }

  onDragEnd () {
    this.dragging = null
    this.dropTarget = null
  }

  onDragOver (g: TileGroup) {
    if (this.dragging && (g.editable || g.id === 'ungrouped')) this.dropTarget = g.id
  }

  // -- the Bench --------------------------------------------------------------

  /**
   * Each printer's hover actions, by tile key: worked out once per change, not
   * on every render, for the benches, Offline and (as its one thing to do) Found.
   */
  get benchActionsByKey (): Record<string, BenchAction[]> {
    const actions: Record<string, BenchAction[]> = {}
    for (const g of this.page.groups) for (const t of g.tiles) actions[t.key] = this.benchActions(t)
    for (const t of this.page.offline) actions[t.key] = this.benchActions(t)
    for (const t of this.page.found) actions[t.key] = this.foundOne(t)
    return actions
  }

  /**
   * On hover: Open, and what the printer most likely wants next, where Control can do it.
   * An offline printer also has what its Grid tile has: Remove, and Retry Bluetooth.
   */
  benchActions (tile: PrinterTile): BenchAction[] {
    const actions: BenchAction[] = [{ id: 'open', label: 'Open' }]
    if (tile.entry.active && tile.state === 'printing') actions.push({ id: 'pause', label: 'Pause', disabled: this.controlBusy })
    else if (tile.entry.active && tile.state === 'paused') actions.push({ id: 'resume', label: 'Resume', disabled: this.controlBusy })
    if (tile.state === 'offline') {
      for (const a of this.actionsFor(tile.entry)) {
        if (a.id === 'remove' || a.id === 'retry-bluetooth') actions.push({ id: a.id, label: a.label, disabled: a.disabled })
      }
    }
    return actions
  }

  onBenchAction (tile: PrinterTile, id: string) {
    if (id === 'open') return this.openEntry(tile.entry)
    if (id === 'pause') return this.control(this.pausePrint)
    if (id === 'resume') return this.control(this.resumePrint)
    return this.onAction(tile.entry, id)
  }

  onOtherAction (tile: PrinterTile, id: string) {
    return id === 'forget' ? this.forgetForeignPrinter(tile) : this.openForeign(tile)
  }

  /**
   * A printer found nearby that isn't yours has exactly one thing to do with
   * it: Set up a new one, Add one that is set up and linked to no one, or ask
   * the owner of one in another account.
   */
  foundOne (tile: PrinterTile): BenchAction[] {
    const e = tile.entry
    if (e.row?.action === 'set-up') return [{ id: 'set-up', label: 'Set up' }]
    const actions = this.foundActions(e)
    const ask = actions.find(a => a.id === 'ask')
    if (ask) return [{ id: 'ask', label: 'Ask its owner', disabled: ask.disabled }]
    const link = actions.find(a => a.id === 'link')
    if (link) return [{ id: 'link', label: 'Add', disabled: link.disabled }]
    const connect = actions.find(a => a.id === 'connect')
    if (connect) return [{ id: 'connect', label: 'Add', disabled: connect.disabled }]
    return []
  }

  onDragOverNew () {
    if (this.dragging) this.dropTarget = this.newBench
  }

  /** Dropped on "New bench": a new bench with this printer on it, named for renaming. */
  onDropNew () {
    const id = this.dragging
    this.onDragEnd()
    if (!id) return
    const groupId = `g${Date.now().toString(36)}`
    const groups = cloudState.layout.groups.map(x => ({ ...x, printers: x.printers.filter(p => p !== id) }))
    this.persistGroups([...groups, { id: groupId, name: `Bench ${groups.length + 1}`, printers: [id] }])
    this.startRename(groupId)
  }

  /** Into one of your groups, or out of them all onto Not in a group. */
  onDrop (g: TileGroup) {
    const id = this.dragging
    this.onDragEnd()
    if (!id || !(g.editable || g.id === 'ungrouped')) return
    const groups = cloudState.layout.groups.map(x => ({ ...x, printers: x.printers.filter(p => p !== id) }))
    const target = groups.find(x => x.id === g.id)
    if (target) target.printers.push(id)
    this.persistGroups(groups)
  }

  // -- keeping saved printers current ----------------------------------------

  /** A saved printer said who it is, or moved: keep the saved entry up to date. */
  @Watch('savedFound', { immediate: true })
  onFound () {
    for (const update of savedUpdates(this.savedInstances, discoveryState.found, !!discoveryState.blockedByPage)) {
      this.$store.dispatch('config/relocateInstance', update)
    }
  }

  get savedFound () {
    return discoveryState.found.map(l => `${l.endpointId}@${lanAddresses(l).join(',')}`).join(';')
  }
}
</script>

<style lang="scss" src="@/components/printers/printers-ui.scss"></style>

<style lang="scss" scoped>
  .printers {
    display: flex;
    flex-direction: column;
    gap: 28px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 12px 16px 40px;
    color: var(--m3d-text);
  }

  .printers--phone {
    gap: 22px;
    padding: 4px 0 24px;
  }

  // -- the one grid: 4 across on desktop, 2 on a tablet and a phone (v3 section 7) ----

  .printers__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .printers__grid--row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);

    > * + * {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .printers__now {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  @media (max-width: 1023px) {
    .printers__grid--card {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 699px) {
    .printers__grid--card {
      gap: 12px;
    }

    .printers__now {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .printers__section--drop {
    box-shadow: 0 0 0 2px var(--m3d-accent), 0 0 0 10px var(--m3d-accent-soft);
  }

  .printers__group-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .printers--phone .printers__group-name {
    font-size: 17px;
  }

  .printers__bench-name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  // "New bench": a faint dashed bench with no box, which takes a dropped printer.
  .printers__new-bench {
    display: grid;
    justify-items: center;
    gap: 2px;
    margin-bottom: 14px;
    padding: 12px 20px 14px;
    color: var(--m3d-text-muted);
    cursor: copy;
    transition:
      color var(--m3d-motion-base) var(--m3d-ease-standard),
      transform var(--m3d-spring-snappy-duration) var(--m3d-spring-snappy);

    svg {
      width: 100%;
      height: 40px;
      fill: none;
      stroke: var(--m3d-border);
      stroke-width: 2;
      stroke-dasharray: 7 6;
      stroke-linecap: round;
      transition: stroke var(--m3d-motion-base) var(--m3d-ease-standard);

      path { vector-effect: non-scaling-stroke; }
    }

    span {
      margin-top: -34px;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--m3d-bg);
      font-size: 13px;
      font-weight: 600;
    }

    small {
      color: var(--m3d-text-subtle);
      font-size: 11.5px;
    }

    &:hover,
    &.printers__new-bench--over {
      color: var(--m3d-accent);

      svg { stroke: var(--m3d-accent); }
    }

    &.printers__new-bench--over { transform: scale(1.01); }

    // Only the bench itself takes the drag: moving over its words or line
    // would fire a dragleave and drop the highlight.
    > * { pointer-events: none; }
  }

  .printers__rename {
    min-width: 0;
    padding: 2px 8px;
    border: 0;
    border-radius: 8px;
    outline: 2px solid var(--m3d-accent);
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 20px;
    font-weight: 700;
  }

  .drop-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 120px;
    padding: 24px;
    border: 1.5px dashed var(--m3d-border-strong);
    border-radius: 22px;
    color: var(--m3d-text-subtle);
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  }

  .printers__grid--row .drop-hint {
    min-height: 60px;
    border: 0;
  }

  // -- states -----------------------------------------------------------------

  .printers__none {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 16px;
    color: var(--m3d-text-muted);
    text-align: center;

    b {
      color: var(--m3d-text);
      font-size: 16px;
    }
  }

  .printers__none-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
  }

  p.printers__looking {
    margin: 0;
  }

  .printers__looking {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .printers__secure {
    margin: 0;
    color: var(--m3d-text-muted);

    a {
      display: block;
      margin-top: 4px;
    }
  }

  .foreign-warning {
    margin: 0;
    color: var(--m3d-warning);
  }

  .inset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .inset__text {
    flex: 1 1 240px;
    font-size: 14px;
  }

  .new-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    padding: 8px 4px;
    color: var(--m3d-text-muted);
    font-size: 14px;
    font-weight: 600;

    &:hover {
      color: var(--m3d-text);
    }
  }
</style>
