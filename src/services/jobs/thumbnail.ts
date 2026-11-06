/**
 * Where a job's thumbnail is, and how Jobs gets it onto the page.
 *
 * On the same network (or a printer added by address) the picture is a plain
 * address. Over the remote route (Muon3D / Iroh) there is no address to link:
 * Fluidd's API origin is a placeholder that is never dialled, so the picture
 * is read as bytes through the transport and shown from an object URL.
 */
import Vue from 'vue'

interface ThumbnailMeta {
  width?: number;
  size?: number;
  relative_path?: string;
}

const segments = (path: string) => path.split('/').filter(Boolean).map(encodeURIComponent).join('/')

/**
 * The request path of a job's largest thumbnail, `dir` being the job's folder
 * inside gcodes (empty at the top). Each segment is encoded, so a `#` or `?` in
 * a folder or file name stays part of the name. Empty when it has none.
 */
export function jobThumbnailPath (meta: { thumbnails?: ThumbnailMeta[] }, dir: string): string {
  const usable = (meta.thumbnails ?? []).filter(t => t.relative_path)
  if (!usable.length) return ''
  const biggest = usable.reduce((a, b) => ((a.size ?? a.width ?? 0) >= (b.size ?? b.width ?? 0) ? a : b))
  return `/server/files/gcodes/${segments(`${dir}/${biggest.relative_path}`)}`
}

export const remoteThumbnails = Vue.observable({
  /** By printer, path and file date: an object URL, or null once reads kept failing. */
  urls: {} as Record<string, string | null>,
  /** How many reads of each have failed so far; a read asks again until MAX_TRIES. */
  failures: {} as Record<string, number>
})

/** A read that fails is tried again, so one dropped request doesn't leave a job without its picture for good. */
export const MAX_TRIES = 3
export const RETRY_AFTER_MS = 1500
/** Reads running at once: a page of jobs would otherwise open one stream each. */
export const MAX_READING = 4

/** The printer answered that the picture isn't there (or isn't ours to read): asking again won't change that. */
const isGone = (error: unknown) => {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  return status === 404 || status === 401 || status === 403
}

const reading = new Set<string>()
const waiting: Array<() => void> = []
let running = 0

function pump () {
  while (running < MAX_READING && waiting.length) {
    running++
    waiting.shift()!()
  }
}

/**
 * The object URL of a thumbnail read through `read`, or '' until it has been
 * read (and for good if it couldn't be). The first ask starts the read; the
 * answer arrives through `remoteThumbnails`, which is reactive.
 */
export function remoteJobThumbnail (
  printer: string,
  path: string,
  date: number,
  read: (path: string) => Promise<Blob>
): string {
  const key = `${printer}|${path}|${date}`
  // Ask reactively, so a retry that fails again wakes the caller to ask again.
  const failures = remoteThumbnails.failures[key] ?? 0
  if (key in remoteThumbnails.urls) return remoteThumbnails.urls[key] ?? ''
  if (!reading.has(key)) {
    reading.add(key)
    waiting.push(() => {
      read(path)
        .then(blob => Vue.set(remoteThumbnails.urls, key, URL.createObjectURL(blob)))
        .catch((error: unknown) => {
          if (isGone(error) || failures + 1 >= MAX_TRIES) {
            Vue.set(remoteThumbnails.urls, key, null)
          } else {
            setTimeout(() => {
              reading.delete(key)
              Vue.set(remoteThumbnails.failures, key, failures + 1)
            }, RETRY_AFTER_MS)
          }
        })
        .finally(() => {
          running--
          if (key in remoteThumbnails.urls) reading.delete(key)
          pump()
        })
    })
    pump()
  }
  return ''
}
