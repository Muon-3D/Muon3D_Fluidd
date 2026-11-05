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
  /** By printer, path and file date: an object URL, or null once a read failed. */
  urls: {} as Record<string, string | null>
})

const reading = new Set<string>()

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
  if (key in remoteThumbnails.urls) return remoteThumbnails.urls[key] ?? ''
  if (!reading.has(key)) {
    reading.add(key)
    read(path)
      .then(blob => Vue.set(remoteThumbnails.urls, key, URL.createObjectURL(blob)))
      .catch(() => Vue.set(remoteThumbnails.urls, key, null))
      .finally(() => reading.delete(key))
  }
  return ''
}
