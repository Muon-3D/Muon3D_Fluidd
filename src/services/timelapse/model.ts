import { jobTitle } from '@/services/jobs/model'

const VIDEO = /\.(mp4|webm|mkv|mov|gif)$/i
/** The pictures moonraker-timelapse (or a person) may leave beside a video, the usual first. */
const PICTURE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const FRAMES = /\.zip$/i

export interface TimelapseItem {
  name: string;
  kind: 'video' | 'frames';
  /** The picture moonraker-timelapse saves beside a video, under the same name. */
  thumbnail: string | null;
  title: string;
  when: string | null;
  size: number;
  modified: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * moonraker-timelapse names its output timelapse_<the G-code's name>_<YYYYMMDD>_<HHMM>:
 * the print's name, and when it rendered. Anything else keeps its file name.
 */
export function timelapseName (file: string): { title: string, when: string | null } {
  const m = /^timelapse_(.+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})\.[^.]+$/.exec(file)
  if (!m) return { title: file.replace(/\.[^.]+$/, ''), when: null }
  const [, name, , month, day, hour, minute] = m
  return { title: jobTitle(`${name}.gcode`), when: `${Number(day)} ${MONTHS[Number(month) - 1]} ${hour}:${minute}` }
}

/** The videos and saved frames in the timelapse folder, newest first, each with its picture if there is one. */
export function timelapseItems (files: Array<{ filename: string, size: number, modified: number }>): TimelapseItem[] {
  const names = new Set(files.map(f => f.filename))
  return files
    .filter(f => VIDEO.test(f.filename) || FRAMES.test(f.filename))
    .map(f => {
      const base = f.filename.replace(/\.[^.]+$/, '')
      const picture = PICTURE_EXTENSIONS.map(ext => `${base}${ext}`).find(name => names.has(name))
      return {
        name: f.filename,
        kind: VIDEO.test(f.filename) ? 'video' as const : 'frames' as const,
        thumbnail: picture ?? null,
        ...timelapseName(f.filename),
        size: f.size,
        modified: f.modified
      }
    })
    .sort((a, b) => b.modified - a.modified)
}

/** The file of frame `n` (from 1), in the frames folder: frame000042.jpg. */
export function frameFile (n: number, lastFile: string): string {
  const ext = lastFile.split('.').pop() || 'jpg'
  return `frame${String(n).padStart(6, '0')}.${ext}`
}

/** What the renderer is doing, for people, or null when it's idle. */
export function renderText (status: { status: string, progress?: number, count?: number } | undefined): string | null {
  if (!status) return null
  if (status.status === 'started') return `Starting to render${status.count ? ` ${status.count} frames` : ''}…`
  if (status.status === 'running') return `Rendering… ${Math.round(status.progress ?? 0)}%`
  return null
}

/** For the Timelapse header: how many videos the printer keeps, and the space the folder takes. */
export function timelapseSummary (files: Array<{ filename: string, size: number }>): { videos: number, bytes: number } {
  return {
    videos: files.filter(f => VIDEO.test(f.filename)).length,
    bytes: files.reduce((sum, f) => sum + (f.size || 0), 0)
  }
}

/** A video's new file name, its extension kept, and the picture saved beside it renamed to match. */
export function renamedTimelapse (item: { name: string, thumbnail: string | null }, title: string): { name: string, thumbnail: string | null } | null {
  const ext = item.name.match(/\.[^.]+$/)?.[0] ?? ''
  // The extension typed once is the video's own; a dot in a name ("0.2mm_PLA") is part of the name.
  const typed = title.trim()
  const withoutExt = ext && typed.toLowerCase().endsWith(ext.toLowerCase()) ? typed.slice(0, -ext.length) : typed
  const base = withoutExt.replace(/[/\\]/g, '_')
  if (!base) return null
  const name = `${base}${ext}`
  if (name === item.name) return null
  // The picture keeps its own extension: it is not always a .jpg.
  const pictureExt = item.thumbnail?.match(/\.[^.]+$/)?.[0] ?? '.jpg'
  return { name, thumbnail: item.thumbnail ? `${base}${pictureExt}` : null }
}
