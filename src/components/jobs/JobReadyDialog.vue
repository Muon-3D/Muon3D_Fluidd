<template>
  <v-dialog
    :value="open"
    max-width="420"
    content-class="job-ready__dialog"
    @input="!$event && close()"
  >
    <div
      class="job-ready"
      data-tid="job-ready"
    >
      <!-- A G-code file: ready to print. -->
      <template v-if="mode === 'gcode'">
        <div class="job-ready__head">
          <h2>Ready to print</h2>
          <button
            type="button"
            aria-label="Close"
            @click="close"
          >
            <frame-icon name="x" />
          </button>
        </div>
        <div class="job-ready__picture">
          <img
            v-if="job && job.thumbnail"
            :src="job.thumbnail"
            alt=""
          >
          <v-progress-circular
            v-else-if="!job"
            indeterminate
            size="28"
            width="3"
          />
          <frame-icon
            v-else
            name="jobs"
            large
          />
        </div>
        <b class="job-ready__title">{{ job ? job.title : titleOf(filename) }}</b>
        <span class="job-ready__facts">{{ job ? job.facts : 'Reading what the slicer wrote…' }}</span>
        <ul
          v-if="checks.length"
          class="job-ready__checks"
        >
          <li
            v-for="check in checks"
            :key="check.text"
            :class="{ 'job-ready__check--warn': !check.ok }"
          >
            <v-icon x-small>
              {{ check.ok ? '$check' : '$warning' }}
            </v-icon>
            {{ check.text }}
          </li>
        </ul>
        <button
          type="button"
          class="cbtn cbtn--primary cbtn--wide job-ready__go"
          :disabled="!job || !klippyReady || (busy && !canQueue)"
          data-tid="job-ready-print"
          @click="go"
        >
          {{ busy ? (canQueue ? `Add to queue · starts after ${printingTitle || 'this print'}` : 'The printer is busy') : 'Print now' }}
        </button>
        <button
          type="button"
          class="cbtn cbtn--wide"
          data-tid="job-ready-keep"
          @click="close"
        >
          Just keep it
        </button>
      </template>

      <!-- A model: it has to be sliced first. -->
      <template v-else>
        <div class="job-ready__head">
          <h2>
            <frame-icon name="slice" />
            {{ models.length === 1 ? models[0] : `${models.length} models` }}
          </h2>
          <button
            type="button"
            aria-label="Close"
            @click="close"
          >
            <frame-icon name="x" />
          </button>
        </div>
        <p
          v-if="sliceable.length"
          class="job-ready__about"
        >
          A model has to be sliced before it can print. Open Slice and
          {{ sliceable.length === 1 ? 'it opens' : 'they open' }} there, ready to slice for {{ printerName }}.
        </p>
        <p
          v-if="unsliceable.length"
          class="job-ready__about"
          data-tid="job-ready-unsliceable"
        >
          Slice can't open {{ unsliceable.join(', ') }}: it takes STL, OBJ and 3MF. Export {{ unsliceable.length === 1 ? 'it' : 'them' }} as one of those from your CAD program first.
        </p>
        <p class="job-ready__about job-ready__about--dim">
          Nothing is sent to the printer until you slice and print.
        </p>
        <button
          v-if="slicer && sliceable.length"
          type="button"
          class="cbtn cbtn--primary cbtn--wide"
          data-tid="job-ready-open-slice"
          @click="openInSlice"
        >
          Open Slice
        </button>
        <p
          v-else-if="sliceable.length"
          class="job-ready__about"
        >
          This printer doesn't serve Slice yet. slicer.muon3d.com slices the same way.
        </p>
        <button
          type="button"
          class="cbtn cbtn--wide"
          @click="close"
        >
          Close
        </button>
      </template>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import JobsMixin, { type JobFile } from '@/mixins/jobs'
import { EventBus } from '@/eventBus'
import { jobTitle, readyChecks, type ReadyCheck } from '@/services/jobs/model'
import { slicerPresence } from '@/services/slicer-bridge/slicerUrl'
import { holdModels, isSlicerModel } from '@/services/slicer-bridge/handover'

/**
 * After a file arrives, by drop or Upload. G-code: what it is, what to
 * know before it prints (what it was sliced for, its material, whether
 * the printer is free), and Print now or Add to queue. A model: Open Slice
 * opens it in the slicer (services/slicer-bridge/handover.ts).
 */
@Component({})
export default class JobReadyDialog extends Mixins(JobsMixin) {
  open = false
  mode: 'gcode' | 'model' = 'gcode'
  filename = ''
  models: string[] = []

  created () {
    EventBus.bus.$on('job-ready', this.showJob)
    EventBus.bus.$on('model-dropped', this.showModels)
  }

  beforeDestroy () {
    EventBus.bus.$off('job-ready', this.showJob)
    EventBus.bus.$off('model-dropped', this.showModels)
  }

  showJob (filename: string) {
    this.mode = 'gcode'
    this.filename = filename
    this.open = true
    this.loadFiles()
  }

  /** The model files dropped or picked: kept (not reactive) until Open Slice or the next drop. */
  modelFiles: readonly File[] = []

  showModels (files: File[]) {
    this.mode = 'model'
    this.modelFiles = Object.freeze([...files])
    this.models = files.map(f => f.name)
    this.open = true
  }

  /** The models the slicer opens (STL, OBJ, 3MF), and the ones it can't (STEP). */
  get sliceable (): string[] {
    return this.models.filter(isSlicerModel)
  }

  get unsliceable (): string[] {
    return this.models.filter(name => !isSlicerModel(name))
  }

  /**
   * Open Slice: the models it opens go with it (KAN-2191), and /slice hands
   * them to the slicer once it is welcomed. Too many or too large to hand
   * over: the person is told which, and stays here.
   */
  openInSlice () {
    const problem = holdModels(this.modelFiles.filter(f => isSlicerModel(f.name)))
    if (problem) {
      EventBus.$emit(problem, { type: 'warning', timeout: 10000 })
      return
    }
    this.modelFiles = []
    this.close()
    this.$router.push(this.slicePath).catch(() => {})
    // Already on /slice: the open page takes them now.
    EventBus.bus.$emit('models-held')
  }

  close () {
    this.open = false
  }

  /** The file, once the printer lists it with what the slicer wrote. */
  get job (): JobFile | null {
    return this.jobFiles.find(j => j.path === this.filename) ?? null
  }

  @Watch('job')
  onJob (job: JobFile | null) {
    // The printer reads the slicer's notes a moment after the upload.
    if (job && !job.facts && this.open) window.setTimeout(() => this.loadFiles(), 1500)
  }

  get checks (): ReadyCheck[] {
    if (!this.job) return []
    return readyChecks(this.job.file, this.job.filename, this.loadedFilament, this.printerName, this.busy)
  }

  get printingTitle (): string {
    return this.jobFile ? jobTitle(this.jobFile) : ''
  }

  titleOf (filename: string): string {
    return jobTitle(filename)
  }

  get slicer (): boolean {
    return slicerPresence.state === 'present'
  }

  get slicePath (): string {
    return this.pagePath('/slice')
  }

  async go () {
    if (!this.job) return
    const job = this.job
    this.close()
    if (this.busy) await this.addToQueue(job)
    else await this.printAgain(job.path)
  }
}
</script>

<style lang="scss" scoped>
  .job-ready {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border-radius: 26px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .job-ready__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      font-size: 17px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    button {
      display: inline-flex;
      color: var(--m3d-text-muted);
    }
  }

  .job-ready__picture {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 220px;
    border-radius: 18px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);
    color: var(--m3d-text-subtle);

    img {
      width: 80%;
      height: 80%;
      object-fit: contain;
    }
  }

  .job-ready__title {
    font-size: 20px;
  }

  .job-ready__facts {
    margin-top: -8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .job-ready__checks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    list-style: none;
    font-size: 13px;

    li {
      display: flex;
      align-items: center;
      gap: 8px;

      .v-icon {
        color: var(--m3d-success) !important;
      }
    }
  }

  .job-ready__check--warn .v-icon {
    color: var(--m3d-warning) !important;
  }

  .job-ready__go {
    height: 48px;
  }

  .job-ready__about {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .job-ready__about--dim {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }
</style>

<style lang="scss">
  .v-dialog.job-ready__dialog {
    overflow: visible;
    box-shadow: none;
  }
</style>
