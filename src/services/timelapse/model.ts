import { jobTitle } from '@/services/jobs/model'

const VIDEO = /\.(mp4|webm|mkv|mov|gif)$/i
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
      const jpg = f.filename.replace(/\.[^.]+$/, '.jpg')
      return {
        name: f.filename,
        kind: VIDEO.test(f.filename) ? 'video' as const : 'frames' as const,
        thumbnail: names.has(jpg) ? jpg : null,
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
  const base = title.trim().replace(/\.[^.]+$/, '').replace(/[/\\]/g, '_')
  if (!base) return null
  const ext = item.name.match(/\.[^.]+$/)?.[0] ?? ''
  const name = `${base}${ext}`
  if (name === item.name) return null
  return { name, thumbnail: item.thumbnail ? `${base}.jpg` : null }
}
