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
/** Pictures kept as object URLs; the oldest go (and are revoked) past this. */
export const MAX_CACHED = 300

/** The printer answered that the picture isn't there (or isn't ours to read): asking again won't change that. */
const isGone = (error: unknown) => {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  return status === 404 || status === 401 || status === 403
}

export const thumbnailKey = (printer: string, path: string, date: number) => `${printer}|${path}|${date}`

/** The same picture whatever its date: a changed file replaces its old one. */
const baseOf = (key: string) => key.slice(0, key.lastIndexOf('|'))

const reading = new Set<string>()
const waiting: Array<{ key: string, start: () => void }> = []
/** Keys holding an answer (a URL or null), oldest first. */
const kept: string[] = []
let running = 0

function pump () {
  while (running < MAX_READING && waiting.length) {
    running++
    waiting.shift()!.start()
  }
}

/** Lets go of an answer: revokes its object URL and makes the picture ask afresh. */
function forget (key: string) {
  const url = remoteThumbnails.urls[key]
  if (url) URL.revokeObjectURL(url)
  Vue.delete(remoteThumbnails.urls, key)
  Vue.delete(remoteThumbnails.failures, key)
  const i = kept.indexOf(key)
  if (i >= 0) kept.splice(i, 1)
}

function keep (key: string, url: string | null) {
  // An older date of this file is replaced, not kept beside it.
  const base = baseOf(key)
  for (const old of kept.filter(k => k !== key && baseOf(k) === base)) forget(old)
  Vue.set(remoteThumbnails.urls, key, url)
  kept.push(key)
  while (kept.length > MAX_CACHED) forget(kept[0])
}

/** Jobs was opened again: pictures that gave up get another go. */
export function retryFailedThumbnails () {
  for (const key of Object.keys(remoteThumbnails.urls)) {
    if (remoteThumbnails.urls[key] === null) forget(key)
  }
}

/** A row that is gone no longer needs its picture: a read still waiting its turn is dropped. */
export function cancelQueuedThumbnail (key: string) {
  const i = waiting.findIndex(w => w.key === key)
  if (i >= 0) {
    waiting.splice(i, 1)
    reading.delete(key)
  }
}

/** Forgets everything, revoking every object URL. */
export function clearRemoteThumbnails () {
  for (const key of [...kept]) forget(key)
  for (const key of Object.keys(remoteThumbnails.urls)) forget(key)
  remoteThumbnails.failures = {}
  waiting.length = 0
  reading.clear()
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
  const key = thumbnailKey(printer, path, date)
  // Ask reactively, so a retry that fails again wakes the caller to ask again.
  const failures = remoteThumbnails.failures[key] ?? 0
  if (key in remoteThumbnails.urls) return remoteThumbnails.urls[key] ?? ''
  if (!reading.has(key)) {
    reading.add(key)
    waiting.push({
      key,
      start: () => {
        read(path)
          .then(blob => keep(key, URL.createObjectURL(blob)))
          .catch((error: unknown) => {
            if (isGone(error) || failures + 1 >= MAX_TRIES) {
              keep(key, null)
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
      }
    })
    pump()
  }
  return ''
}
