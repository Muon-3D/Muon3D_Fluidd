/**
 * The pictures of the files on the printer Fluidd is on, when Fluidd reaches
 * that printer through Muon3D. Its API address is then a placeholder that is
 * never dialled (services/muon-cloud/origin.ts), so an <img> linked to it
 * never loads: the picture is read through Fluidd's own HTTP client, which
 * carries the request to the printer, and shown from an object URL.
 *
 * On this network a picture is still linked, so the browser caches it.
 */
import Vue from 'vue'

/** Reads a picture: a path such as `/server/files/gcodes/.thumbs/cube.png?date=…`. */
export type PictureRead = (path: string) => Promise<Blob>

export const printerPictures = Vue.observable({
  /** By printer and path: an object URL, or null when it couldn't be read. */
  urls: {} as Record<string, string | null>
})

const reading = new Map<string, Promise<void>>()

async function load (key: string, path: string, read: PictureRead) {
  try {
    Vue.set(printerPictures.urls, key, URL.createObjectURL(await read(path)))
  } catch {
    Vue.set(printerPictures.urls, key, null)
  }
}

/**
 * The picture at `path` on `printer` (any name that tells the printers
 * apart), or null until it has been read, and when it can't be. The first
 * ask reads it; the answer arrives through `printerPictures`, which is
 * reactive, so a getter that asked is asked again.
 */
export function printerPicture (printer: string, path: string, read: PictureRead): string | null {
  const key = `${printer}|${path}`
  if (key in printerPictures.urls) return printerPictures.urls[key]
  if (!reading.has(key)) {
    reading.set(key, load(key, path, read).finally(() => reading.delete(key)))
  }
  return null
}
