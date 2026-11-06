import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from './overview'
import { SocketActions } from '@/api/socketActions'
import type { AppFileWithMeta, FileBrowserEntry } from '@/store/files/types'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { jobThumbnailPath, remoteJobThumbnail, thumbnailKey } from '@/services/jobs/thumbnail'
import { jobFacts, jobTitle, isGcodeFile, printedBefore } from '@/services/jobs/model'

/** A G-code file on the printer, as Jobs shows it. */
export interface JobFile {
  key: string;
  /** Its path in gcodes/, as the printer prints it. */
  path: string;
  filename: string;
  title: string;
  facts: string;
  /**
   * The picture's address. Read only where it is drawn: over the remote route
   * each read opens a stream, so a file that isn't shown (filtered out, in
   * another folder) never asks for its picture.
   */
  readonly thumbnail: string;
  /** Names the picture's read over the remote route, so a row that is gone can drop it; '' when it has none. */
  thumbnailKey: string;
  printed: boolean;
  printing: boolean;
  modified: number;
  size: number;
  estimated_time?: number;
  /** Its last print, when it has one: the store gives an empty one when it hasn't. */
  history?: { job_id?: string };
  print_start_time?: number | null;
  file: AppFileWithMeta;
}

/**
 * What Jobs' panels share: the G-code files on the printer (loaded when
 * the page opens), their pictures and facts, and printing, queueing and
 * removing them. Printing goes the way the file browser's does, Spoolman
 * dialog included.
 */
@Component
export default class JobsMixin extends Mixins(OverviewMixin) {
  get root (): string {
    return 'gcodes'
  }

  loadFiles () {
    SocketActions.serverFilesGetDirectory(this.root, this.root)
  }

  get entries (): FileBrowserEntry[] {
    return (this.$store.getters['files/getDirectory'](this.root) as FileBrowserEntry[] | undefined) ?? []
  }

  get loaded (): boolean {
    return !!this.$store.getters['files/getDirectory'](this.root)
  }

  get jobFiles (): JobFile[] {
    return this.entries
      .filter((e): e is AppFileWithMeta => e.type === 'file' && isGcodeFile(e.filename))
      .map(f => this.toJobFile(f))
  }

  /** A G-code file from any folder's listing, as Jobs shows it. */
  toJobFile (f: AppFileWithMeta): JobFile {
    const printing = this.busy ? this.jobFile : ''
    const path = f.path ? `${f.path}/${f.filename}` : f.filename
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      key: path,
      path,
      filename: f.filename,
      title: jobTitle(f.filename),
      facts: jobFacts(f),
      get thumbnail () { return self.jobPictureUrl(f) },
      thumbnailKey: this.jobPictureKey(f),
      printed: printedBefore(f as never),
      printing: !!printing && printing === path,
      modified: f.modified,
      size: f.size,
      estimated_time: f.estimated_time,
      history: f.history as { job_id?: string } | undefined,
      print_start_time: (f as { print_start_time?: number | null }).print_start_time,
      file: f
    }
  }

  /**
   * The picture of a job: an address on this network, or, over the remote
   * route (where there is no address to link), the bytes read through the
   * transport and shown from an object URL.
   */
  jobPictureUrl (f: AppFileWithMeta): string {
    const path = jobThumbnailPath(f, f.path)
    if (!path) return ''
    const apiUrl = this.$store.state.config.apiUrl as string
    if (!isManagedApiUrl(apiUrl)) return `${apiUrl}${path}?date=${f.modified || Date.now()}`
    return remoteJobThumbnail(
      this.remotePrinterKey,
      path,
      f.modified,
      async p => (await this.$httpClient.get(p, { responseType: 'blob' })).data as Blob
    )
  }

  /** The remote read's key for a file's picture, or '' when it has none or is read by address. */
  jobPictureKey (f: AppFileWithMeta): string {
    const path = jobThumbnailPath(f, f.path)
    if (!path || !isManagedApiUrl(this.$store.state.config.apiUrl as string)) return ''
    return thumbnailKey(this.remotePrinterKey, path, f.modified)
  }

  get remotePrinterKey (): string {
    return `${cloudState.account?.id ?? ''}|${cloudState.activePrinterId ?? ''}`
  }

  get folders (): number {
    return this.entries.filter(e => e.type === 'directory' && e.name !== '..').length
  }

  get freeSpace (): string | null {
    const usage = this.$store.getters['files/getUsage'] as { free?: number } | undefined
    const free = usage?.free
    if (!free) return null
    return free > 1e9 ? `${(free / 1e9).toFixed(1)} GB free` : `${Math.round(free / 1e6)} MB free`
  }

  get canQueue (): boolean {
    return this.$store.getters['server/componentSupport']('job_queue') as boolean
  }

  /** Print now, or into the queue when the printer is busy and it has one. */
  async printOrQueue (job: JobFile) {
    if (!this.controlReady) return
    if (this.busy) {
      if (this.canQueue) await this.addToQueue(job)
      return
    }
    await this.printAgain(job.path)
  }

  async addToQueue (job: JobFile) {
    if (!this.controlReady || !this.canQueue) return
    await SocketActions.serverJobQueuePostJob([job.path])
  }

  async removeJob (job: JobFile): Promise<boolean> {
    const target = this.commandTarget
    const ok = await this.$confirm(`It's removed from ${this.printerName}. This can't be undone.`, { title: `Delete ${job.title}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok || target !== this.commandTarget || !this.controlReady) return false
    SocketActions.serverFilesDeleteFile(`${this.root}/${job.path}`)
    return true
  }

  downloadJob (job: JobFile) {
    this.downloadFile(job.filename, job.file.path ? `${this.root}/${job.file.path}` : this.root)
  }
}
