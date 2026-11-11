import type { AppFile, FilesUpload, AppFileThumbnail, KlipperFileMeta } from '@/store/files/types'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import type { AxiosRequestConfig, AxiosProgressEvent } from 'axios'
import { httpClientActions } from '@/api/httpClientActions'
import type { FileWithPath } from '@/types'
import consola from 'consola'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { cloudState } from '@/services/muon-cloud/state'
import { remoteJobThumbnail } from '@/services/jobs/thumbnail'

/** What the small picture cache may hold over Muon3D: thumbnails and timelapse frames, never a whole job or video. */
const PICTURE = /\.(png|jpe?g|gif|webp|bmp)$/i

type UploadResponse = ReturnType<typeof httpClientActions.serverFilesUploadPost>

// A picker/drop action can be observed by more than one mounted upload surface.
// The File object identifies that one browser action; forget it after settlement
// so a later, deliberate upload or retry still reaches the printer.
const uploadsInFlight = new WeakMap<File, Map<string, UploadResponse>>()

@Component
export default class FilesMixin extends Vue {
  get apiUrl (): string {
    return this.$store.state.config.apiUrl as string
  }

  get isTrustedUser (): boolean {
    return this.$store.getters['auth/getCurrentUser']?.username === '_TRUSTED_USER_'
  }

  getThumbUrl (meta: KlipperFileMeta, root: string, path: string, large: boolean, date?: number) {
    const thumb = this.getThumb(meta, root, path, large, date)

    return thumb?.url ?? ''
  }

  getThumb (meta: KlipperFileMeta, root: string, path: string, large = true, date?: number): AppFileThumbnail | undefined {
    if (meta.thumbnails?.length) {
      const thumb = meta.thumbnails.reduce((a, b) => (a.size > b.size) === large ? a : b)

      if (thumb.relative_path) {
        const filepath = path ? `${root}/${path}` : root

        return {
          ...thumb,
          url: this.createFileUrl(thumb.relative_path, filepath, date)
        }
      }
    }
  }

  /**
   * Loads a gcode file and parses for the gcode-viewer.
   */
  async getGcode (file: AppFile) {
    const sizeInMB = file.size / 1024 / 1024

    const result = (
      sizeInMB < 100 ||
      await this.$confirm(
        this.$t('app.gcode.msg.confirm', {
          filename: file.filename,
          size: this.$filters.getReadableFileSizeString(file.size)
        }).toString(), {
          title: 'Load a large file?',
          buttonTrueText: 'Load it'
        })
    )

    if (result) {
      const path = file.path ? `gcodes/${file.path}` : 'gcodes'
      return await this.getFile<string>(file.filename, path, file.size, {
        responseType: 'text',
        transformResponse: [v => v]
      })
    }
  }

  /**
   * Will retrieve a file blob for independent processing.
   * @param filename The filename to retrieve
   * @param path The path to the file
   */
  async getFile<T = any> (filename: string, path: string, size = 0, options?: AxiosRequestConfig) {
    // Sort out the filepath
    const filepath = path ? `${path}/${filename}` : filename

    try {
      const abortController = new AbortController()

      // Add an entry to vuex indicating we're downloading a file.
      this.$store.dispatch('files/updateFileDownload', {
        filepath,
        size,
        loaded: 0,
        percent: 0,
        speed: 0,
        abortController
      })

      const response = await httpClientActions.serverFilesGet<T>(filepath, {
        ...options,
        signal: abortController.signal,
        onDownloadProgress: (event: AxiosProgressEvent) => {
          if (abortController.signal.aborted) {
            return
          }

          const progress = event.progress ?? (
            size > 0
              ? event.loaded / size
              : 0
          )

          const payload: any = {
            filepath,
            loaded: event.loaded,
            percent: Math.round(progress * 100),
            speed: event.rate ?? 0
          }

          if (event.total) {
            size = payload.size = event.total
          }

          this.$store.dispatch('files/updateFileDownload', payload)
        }
      })

      abortController.abort()

      return response
    } finally {
      this.$store.dispatch('files/removeFileDownload')
    }
  }

  /**
   * Will download a file by filepath via a standard browser link.
   * @param filename The filename to retrieve.
   * @param path The path to the file.
   */
  async downloadFile (filename: string, path: string) {
    // Grab a oneshot.
    try {
      const url = await this.createFileUrlWithToken(filename, path)

      // Create a link, handle its click - and finally remove it again.
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      link.setAttribute('target', '_blank')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => this.releaseFileUrl(url), 60_000)
    } catch {
      // Likely a 401.
    }
  }

  /**
   * Creates a url for a file by filepath.
   * Implements a oneshot.
   * @param filename The filename.
   * @param path The path to the file.
   * @returns The url for the requested file
   */
  createFileUrl (filename: string, path: string, date?: number) {
    const filepath = (path) ? `${path}/${filename}` : `${filename}`

    // Through Muon3D the printer has no address the browser can load. A
    // picture is read through the gateway into the small cache, '' until it
    // arrives (reactively, so an src updates). Anything else has no address
    // here: open it with createFileUrlWithToken, or downloadFile.
    if (this.throughMuon3d) {
      if (!PICTURE.test(filename)) return ''
      return remoteJobThumbnail(
        `${cloudState.account?.id ?? ''}|${cloudState.activePrinterId ?? ''}`,
        `/server/files/${encodeURI(filepath)}`,
        date ?? 0,
        async p => (await this.$httpClient.get(p, { responseType: 'blob' })).data as Blob
      )
    }

    // A cloud printer not yet reached has no address either.
    if (isManagedApiUrl(this.apiUrl)) return ''

    return `${this.apiUrl}/server/files/${encodeURI(filepath)}?date=${date || Date.now()}`
  }

  /** The printer is reached through Muon3D, not by its address: the same test the camera uses. */
  get throughMuon3d (): boolean {
    return printerTransportBinding.remote
  }

  /**
   * A URL that opens the file now. Through Muon3D the file is read once
   * through the gateway (not into the picture cache) and the URL is a blob
   * the caller owns: give it to releaseFileUrl when it's done with it.
   */
  async createFileUrlWithToken (filename: string, path: string, date?: number) {
    if (this.throughMuon3d) {
      const filepath = (path) ? `${path}/${filename}` : `${filename}`
      const response = await this.$httpClient.get(`/server/files/${encodeURI(filepath)}`, { responseType: 'blob' })
      return URL.createObjectURL(response.data as Blob)
    }

    const url = this.createFileUrl(filename, path, date)

    return this.isTrustedUser
      ? url
      : `${url}&token=${(await httpClientActions.accessOneshotTokenGet()).data.result}`
  }

  /** Lets go of a URL from createFileUrlWithToken: a blob is revoked, an address needs nothing. */
  releaseFileUrl (url: string | null | undefined) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  /**
   * Uploads a single file via moonraker.
   * @param file The file object. Contains the filename.
   * @param path The path we're uploading to.
   * @param root The root we're downloading from.
   * @param andPrint If we should attempt to print this file or not.
   * @param options Axios request options
   */
  uploadFile (file: File, path: string, root: string, andPrint: boolean, options?: AxiosRequestConfig): UploadResponse {
    const destination = `${root}\0${path}\0${andPrint}`
    let destinations = uploadsInFlight.get(file)
    const existing = destinations?.get(destination)
    if (existing) return existing

    if (!destinations) {
      destinations = new Map()
      uploadsInFlight.set(file, destinations)
    }

    const upload = this.performUploadFile(file, path, root, andPrint, options)
    destinations.set(destination, upload)
    upload.finally(() => {
      destinations?.delete(destination)
      if (!destinations?.size) uploadsInFlight.delete(file)
    }).catch(() => {})
    return upload
  }

  private async performUploadFile (file: File, path: string, root: string, andPrint: boolean, options?: AxiosRequestConfig) {
    const filepath = path
      ? `${path}/${file.name}`
      : file.name

    try {
      const abortController = new AbortController()

      this.$store.dispatch('files/updateFileUpload', {
        filepath,
        size: file.size,
        loaded: 0,
        percent: 0,
        speed: 0,
        cancelled: false,
        abortController
      })

      const response = await httpClientActions.serverFilesUploadPost(file, path, root, andPrint, {
        ...options,
        signal: abortController.signal,
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (abortController.signal.aborted) {
            return
          }

          this.$store.dispatch('files/updateFileUpload', {
            filepath,
            loaded: event.loaded,
            percent: event.progress ? Math.round(event.progress * 100) : 0,
            speed: event.rate ?? 0
          })
        }
      })

      abortController.abort()

      return response
    } finally {
      this.$store.dispatch('files/removeFileUpload', filepath)
    }
  }

  getFullPathAndFile (rootPath: string, file: File | FileWithPath): [string, File] {
    if ('path' in file) {
      return [
        [rootPath, file.path]
          .filter(path => !!path)
          .join('/'),
        file.file
      ]
    } else {
      return [
        rootPath,
        file
      ]
    }
  }

  // Upload some files.
  async uploadFiles (files: FileList | File[] | FileWithPath[], path: string, root: string, andPrint: boolean, canContinue: () => boolean = () => true): Promise<string[] | false> {
    const pendingFiles = Array.from(files as ArrayLike<File | FileWithPath>)
    // For each file, adds the associated state.
    for (const file of pendingFiles) {
      const [fullPath, fileObject] = this.getFullPathAndFile(path, file)

      const filepath = fullPath
        ? `${fullPath}/${fileObject.name}`
        : fileObject.name

      this.$store.dispatch('files/updateFileUpload', {
        filepath,
        size: fileObject.size,
        loaded: 0,
        percent: 0,
        speed: 0,
        unit: 'kB',
        cancelled: false
      })
    }

    // Async uploads cause issues in moonraker / klipper.
    // So instead, upload sequentially waiting for moonraker to finish
    // processing of each file.
    if (files.length > 1) andPrint = false
    // The files that really reached the printer: a cancelled or failed one is left out.
    const uploaded: string[] = []
    for (const [index, file] of pendingFiles.entries()) {
      const [fullPath, fileObject] = this.getFullPathAndFile(path, file)

      const filepath = fullPath
        ? `${fullPath}/${fileObject.name}`
        : fileObject.name

      // A caller whose commands belong to a captured printer/account checks
      // again after every awaited upload, before the next request is sent.
      if (!canContinue()) {
        for (const remaining of pendingFiles.slice(index)) {
          const [remainingPath, remainingFile] = this.getFullPathAndFile(path, remaining)
          this.$store.dispatch('files/removeFileUpload', remainingPath ? `${remainingPath}/${remainingFile.name}` : remainingFile.name)
        }
        return false
      }

      const fileState = this.$store.state.files.uploads.find((u: FilesUpload) => u.filepath === filepath)

      if (fileState && !fileState?.cancelled) {
        try {
          await this.uploadFile(fileObject, fullPath, root, andPrint)
          uploaded.push(filepath)
        } catch (error: unknown) {
          consola.error('[FileUpload] file', error)
        }
      } else {
        this.$store.dispatch('files/removeFileUpload', filepath)
      }
    }
    return uploaded
  }
}
