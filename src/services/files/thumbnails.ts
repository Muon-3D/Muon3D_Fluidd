/**
 * The pictures of the files on the printer Fluidd is on, when Fluidd reaches
 * that printer through Muon3D. Its API address is then a placeholder that is
 * never dialled (services/muon-cloud/origin.ts), so an <img> linked to it
 * never loads: the picture is read through Fluidd's own HTTP client, which
 * carries the request to the printer, and shown from an object URL.
 *
 * On this network a picture is still linked, so the browser caches it.
 *
 * The object URLs are shared by every page that shows the same picture, so
 * none is given back when one page goes. One is given back when its file
 * changes (another `?date=` for the same path), and when more than
 * PICTURES_KEPT are held, the least recently shown first. A picture given
 * back leaves the store without a redraw: an <img> already showing it keeps
 * what it drew, and reads it again only if it's drawn again.
 */
import Vue from 'vue'

/** Reads a picture: a path such as `/server/files/gcodes/.thumbs/cube.png?date=…`. */
export type PictureRead = (path: string) => Promise<Blob>

/** How many pictures are held at most. */
export const PICTURES_KEPT = 300

export const printerPictures = Vue.observable({
  /** By printer and path: an object URL, or null when it couldn't be read. */
  urls: {} as Record<string, string | null>
})

const reading = new Map<string, Promise<void>>()
/** The keys by when they were last shown, oldest first. */
const shown = new Map<string, true>()
/** By printer and path without its version: the version last asked for. */
const latest = new Map<string, string>()

const unversioned = (key: string) => key.replace(/\?.*$/, '')

function giveBack (key: string) {
  const url = printerPictures.urls[key]
  if (typeof url === 'string') URL.revokeObjectURL(url)
  // Not Vue.delete: nothing redraws to ask for it again.
  delete printerPictures.urls[key]
  shown.delete(key)
  if (latest.get(unversioned(key)) === key) latest.delete(unversioned(key))
}

function touch (key: string) {
  shown.delete(key)
  shown.set(key, true)
}

function keepWithinBound () {
  for (const key of shown.keys()) {
    if (Object.keys(printerPictures.urls).length <= PICTURES_KEPT) return
    if (key in printerPictures.urls) giveBack(key)
    else shown.delete(key)
  }
}

async function load (key: string, path: string, read: PictureRead) {
  let url: string | null = null
  try {
    url = URL.createObjectURL(await read(path))
  } catch { /* shown as none */ }
  const base = unversioned(key)
  if (latest.get(base) !== key) {
    // The file changed while this version was read.
    if (url) URL.revokeObjectURL(url)
    return
  }
  for (const other of Object.keys(printerPictures.urls)) {
    if (other !== key && unversioned(other) === base) giveBack(other)
  }
  Vue.set(printerPictures.urls, key, url)
  touch(key)
  keepWithinBound()
}

/**
 * The picture at `path` on `printer` (any name that tells the printers
 * apart), or null until it has been read, and when it can't be. The first
 * ask reads it; the answer arrives through `printerPictures`, which is
 * reactive, so a getter that asked is asked again.
 */
export function printerPicture (printer: string, path: string, read: PictureRead): string | null {
  const key = `${printer}|${path}`
  if (key in printerPictures.urls) {
    touch(key)
    return printerPictures.urls[key]
  }
  if (!reading.has(key)) {
    latest.set(unversioned(key), key)
    reading.set(key, load(key, path, read).finally(() => reading.delete(key)))
  }
  return null
}
