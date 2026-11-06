<template>
  <div
    class="lprint"
    :class="{ 'lprint--phone': isMobileViewport }"
    data-tid="library-own-print"
  >
    <header class="lprint__head">
      <div class="lprint__titles">
        <router-link
          :to="yoursTo"
          class="lprint__back"
          data-tid="library-own-back"
        >
          ‹ Yours
        </router-link>
        <h1
          v-if="item && signedIn"
          data-tid="library-print-name"
        >
          {{ item.name }}
        </h1>
        <p
          v-if="item && signedIn"
          class="lprint__line"
          data-tid="library-own-line"
        >
          {{ headLine }}
        </p>
      </div>
      <div
        v-if="item && signedIn"
        class="lprint__acts"
      >
        <button
          v-if="item.versioned"
          type="button"
          class="lib-btn"
          data-tid="library-open-slice"
          @click="openInSlice(item)"
        >
          Open in Slice
        </button>
        <router-link
          v-if="item.versioned"
          :to="{ path: libraryTo, query: { view: 'mine', share: item.id, from: 'print' } }"
          class="lib-btn"
          data-tid="library-own-share"
        >
          Share…
        </router-link>
        <v-menu
          left
          offset-y
        >
          <template #activator="{ on, attrs }">
            <button
              type="button"
              class="lib-btn lib-btn--sq"
              aria-label="More"
              data-tid="library-print-more"
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
              data-tid="library-rename"
              @click="rename(item)"
            >
              <v-list-item-title>Rename</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="item.versioned"
              data-tid="library-copy"
              @click="copy(item)"
            >
              <v-list-item-title>Save as copy</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-for="setup in item.setups || []"
              :key="setup.file_id"
              data-tid="library-download-gcode"
              @click="downloadGcode(item, setup)"
            >
              <v-list-item-title>
                {{ (item.setups || []).length > 1 ? `Download G-code (${setup.material}, ${setup.nozzle_mm} mm)` : 'Download G-code' }}
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="item.project_file_id"
              data-tid="library-download-project"
              @click="downloadProject(item)"
            >
              <v-list-item-title>Download project (.3mf)</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              data-tid="library-delete"
              @click="removeHere"
            >
              <v-list-item-title class="lprint__danger">
                Delete…
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </header>

    <section
      v-if="!signedIn"
      class="lib-empty lib-surface lprint__state"
    >
      <h2>Sign in to see your Library</h2>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>
    </section>
    <section
      v-else-if="readError && !item"
      class="lib-empty lib-surface lprint__state"
      role="alert"
      data-tid="library-own-error"
    >
      <h2>Your Library didn't answer</h2>
      <p>{{ readError }}</p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="library-own-retry"
          @click="reload"
        >
          Try again
        </button>
      </div>
    </section>
    <section
      v-else-if="libraryOff"
      class="lib-empty lib-surface lprint__state"
      data-tid="library-own-off"
    >
      <h2>Your Library is off</h2>
      <p>Your prints are kept only while it is on.</p>
      <div class="lib-empty__actions">
        <router-link
          :to="yoursTo"
          class="lib-btn"
        >
          Go to Yours
        </router-link>
      </div>
    </section>
    <section
      v-else-if="missing && !item"
      class="lib-empty lib-surface lprint__state"
      data-tid="library-print-missing"
    >
      <h2>This print isn't in your Library</h2>
      <p>It may have been deleted, on this or another device.</p>
      <div class="lib-empty__actions">
        <router-link
          :to="yoursTo"
          class="lib-btn"
        >
          Back to Yours
        </router-link>
      </div>
    </section>
    <p
      v-else-if="!item"
      class="lprint__note"
      role="status"
    >
      Reading the print…
    </p>

    <template v-else>
      <div class="lprint__grid">
        <!-- Its picture. -->
        <div class="lprint__tile lprint__stage">
          <img
            v-if="picture"
            :src="picture"
            :alt="item.name"
          >
          <frame-icon
            v-else
            name="library"
            large
          />
        </div>

        <!-- Print: the facts, your printers with what each has loaded, one primary. -->
        <section
          class="lprint__tile"
          aria-label="Print"
          data-tid="library-own-print-tile"
        >
          <header class="lprint__tile-head">
            <frame-icon
              name="printer"
              small
            />
            <h2>Print</h2>
            <span class="lprint__grow" />
            <span
              v-if="readyHere && activePrinter"
              class="lib-pill lib-pill--ok"
              data-tid="library-own-ready"
            >Ready on {{ activePrinter.name }}</span>
          </header>
          <dl
            v-if="specs.length"
            class="lprint__specs"
          >
            <div
              v-for="s in specs"
              :key="s.label"
            >
              <dt>{{ s.label }}</dt><dd>{{ s.value }}</dd>
            </div>
          </dl>
          <template v-if="item.versioned">
            <printer-fit-list
              :item="item"
              @print="printOn(item, $event.id)"
              @reslice="reslice"
            />
            <button
              type="button"
              class="lib-btn lib-btn--lg lib-btn--pri lprint__go"
              data-tid="library-print-on"
              @click="printOn(item, readyHere && activePrinter ? activePrinter.id : null)"
            >
              <frame-icon
                name="printer"
                small
              />
              {{ readyHere && activePrinter ? `Print on ${activePrinter.name}` : 'Print on…' }}
            </button>
          </template>
          <p
            v-else
            class="lprint__note"
          >
            A model from the app: slice it to print it.
          </p>
        </section>
      </div>

      <div class="lprint__grid lprint__grid--half">
        <section
          v-if="versionRows.length"
          class="lprint__tile"
          aria-label="Versions"
          data-tid="library-versions"
        >
          <header class="lprint__tile-head">
            <frame-icon
              name="copy"
              small
            />
            <h2>Versions</h2>
            <span class="lprint__grow" />
            <span class="lprint__note">The last 10 are kept</span>
          </header>
          <div class="lprint__list">
            <div
              v-for="row in versionRows"
              :key="row.number"
              class="lprint__row"
            >
              <span class="lprint__row-text">
                <b>Version {{ row.number }}<template v-if="row.line"> · {{ row.line }}</template></b>
                <span>{{ row.when }} · {{ row.origin }}</span>
              </span>
              <span
                v-if="row.current"
                class="lib-pill lib-pill--run"
              >Current</span>
              <button
                v-else
                type="button"
                class="lib-btn lib-btn--sm"
                :disabled="busy"
                data-tid="library-restore"
                @click="restore(row)"
              >
                Restore
              </button>
            </div>
          </div>
        </section>

        <section
          class="lprint__tile"
          aria-label="Printed"
          data-tid="library-own-printed"
        >
          <header class="lprint__tile-head">
            <frame-icon
              name="clock"
              small
            />
            <h2>Printed</h2>
          </header>
          <div
            v-if="runRows.length"
            class="lprint__list"
          >
            <div
              v-for="row in runRows"
              :key="row.id"
              class="lprint__row"
            >
              <span class="lprint__row-text">
                <b>{{ row.title }}</b>
                <span>{{ row.line }}</span>
              </span>
              <span
                v-if="row.status"
                class="lib-pill"
                :class="{ 'lib-pill--ok': row.tone === 'ok', 'lib-pill--run': row.tone === 'run', 'lprint__pill--bad': row.tone === 'bad' }"
              >{{ row.status }}</span>
            </div>
          </div>
          <p
            v-if="moreRuns"
            class="lprint__note"
            data-tid="library-own-more-runs"
          >
            {{ printedTimes }} in all; the latest are listed.
          </p>
          <p
            v-else-if="!runRows.length && (item.printed_count || 0) > 0"
            class="lprint__note"
          >
            {{ printedTimes }}<template v-if="item.last_printer_name">
              , last on {{ item.last_printer_name }} {{ lastPrinted }}
            </template>.
          </p>
          <p
            v-else-if="!runRows.length"
            class="lprint__note"
          >
            Print it on any of your printers, and each print is listed here.
          </p>
        </section>
      </div>

      <p
        v-if="error"
        class="lprint__note lprint__note--error"
        role="alert"
      >
        {{ error }}
      </p>
    </template>

    <print-on-dialog
      :item="printing"
      :prefer="preferPrinter"
      @close="printing = null"
    />

    <file-name-dialog
      v-if="naming"
      :value="true"
      :title="naming.mode === 'rename' ? 'Rename' : 'Save as copy'"
      :label="naming.mode === 'rename' ? 'Name' : 'Name of the copy'"
      :name="naming.mode === 'rename' ? naming.item.name : `${naming.item.name} copy`"
      @input="!$event && (naming = null)"
      @save="saveName"
    />

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import LibraryPrintMixin from '@/mixins/library-print'
import PrinterFitList from '@/components/library/PrinterFitList.vue'
import PrintOnDialog from '@/components/library/PrintOnDialog.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'

/**
 * One of your prints (`/library/<id>`, Library v3 page 9): ‹ Yours, its
 * name and what happened to it; Open in Slice once, and the rest in ···
 * (Rename, Save as copy, downloads, Delete, which asks first). Its picture;
 * one Print tile with your printers and what each has loaded, and one
 * primary; its Versions and when it Printed. When it can't be read it says
 * why, with Retry. What it does is mixins/library-print.ts; only the look is here.
 */
@Component({ components: { PrinterFitList, PrintOnDialog, FileNameDialog, CloudAccountDialog } })
export default class LibraryPrint extends Mixins(LibraryPrintMixin, BrowserMixin) {}
</script>

<style lang="scss" scoped>
  .lprint {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 6px 12px 40px;
    color: var(--m3d-text);
  }

  .lprint--phone { padding: 4px 0 24px; }

  .lprint__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .lprint__titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    h1 {
      margin: 2px 0 0;
      overflow-wrap: anywhere;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.15;
    }
  }

  .lprint--phone .lprint__titles h1 { font-size: 22px; }

  .lprint__back {
    color: var(--m3d-accent) !important;
    font-size: 13px;
    text-decoration: none;
  }

  .lprint__line {
    margin: 4px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .lprint__acts {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lprint__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .lprint__grid--half { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }

  .lprint--phone .lprint__grid { grid-template-columns: minmax(0, 1fr); }

  @media (max-width: 1100px) {
    .lprint__grid { grid-template-columns: minmax(0, 1fr); }
  }

  .lprint__tile {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding: 16px;
    border-radius: 18px;
    background: var(--m3d-surface-2);
  }

  .lprint__tile-head {
    display: flex;
    align-items: center;
    gap: 8px;

    h2 { margin: 0; font-size: 16px; font-weight: 700; }
  }

  .lprint__grow { flex: 1 1 auto; }

  .lprint__stage {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;

    > img {
      width: 80%;
      height: 80%;
      object-fit: contain;
    }
  }

  .lprint__specs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 0;
    overflow: hidden;
    border-radius: 12px;
    background: var(--m3d-surface-3, rgba(255, 255, 255, 0.04));

    div {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
    }

    dt { color: var(--m3d-text-muted); }
    dd { margin: 0; font-weight: 700; }
  }

  .lprint__go { width: 100%; justify-content: center; }

  .lprint__list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    background: var(--m3d-surface-3, rgba(255, 255, 255, 0.04));
  }

  .lprint__row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;

    & + & { border-top: 1px solid var(--m3d-border); }
  }

  .lprint__row-text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    span { color: var(--m3d-text-muted); font-size: 12px; }
  }

  .lprint__pill--bad {
    background: color-mix(in srgb, var(--m3d-danger) 14%, transparent);
    color: var(--m3d-danger);
  }

  .lprint__state {
    max-width: 560px;
    width: 100%;
    margin: 24px auto 0;
  }

  .lprint__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .lprint__note--error { color: var(--m3d-danger); }

  .lprint__danger { color: var(--m3d-danger); }
</style>
