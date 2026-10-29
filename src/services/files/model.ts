/** How Files shows one of the printer's folders (Moonraker's roots). */
export interface RootGroup {
  title: string;
  note: string;
  /** Logs are downloaded, not opened: they run to megabytes. */
  download: boolean;
}

/**
 * MuonOS's roots: `defaults` is the shipped M1 config (read only, replaced
 * by updates); `config` is developer mode's own copy of it, which the
 * printer runs instead while developer mode is on; `calibration` is this
 * printer's own calibration and settings, kept through updates.
 */
export function rootGroup (root: string): RootGroup {
  switch (root) {
    case 'config': return { title: 'Your copy of the configuration', note: 'developer mode', download: false }
    case 'calibration': return { title: 'This printer\'s settings', note: 'editable', download: false }
    case 'defaults': return { title: 'Muon3D defaults', note: 'read only · they come with updates', download: false }
    case 'logs': return { title: 'Logs', note: 'download to read', download: true }
    case 'docs': return { title: 'Docs', note: 'read only', download: false }
    default: return { title: root.charAt(0).toUpperCase() + root.slice(1).replace(/_/g, ' '), note: '', download: false }
  }
}

/** The order Files lists its folders in: yours, then the defaults, then the rest. */
export function orderRoots (roots: string[]): string[] {
  const first = ['config', 'calibration', 'defaults', 'logs', 'docs']
  const rank = (r: string) => (first.includes(r) ? first.indexOf(r) : first.length)
  return [...roots].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** Files' headings: Fluidd's list of folders, grouped. */
export type SectionId = 'yours' | 'defaults' | 'other'

export const SECTIONS: { id: SectionId, title: string }[] = [
  { id: 'yours', title: 'Your configuration' },
  { id: 'defaults', title: 'Defaults' },
  { id: 'other', title: 'Other files' }
]

export function rootSection (root: string): SectionId {
  if (root === 'config' || root === 'calibration') return 'yours'
  if (root === 'defaults') return 'defaults'
  return 'other'
}

/**
 * The one root whose files can go back to a default. Developer mode copies
 * `defaults` into it whole, so a file there has its default at the same
 * path. `calibration` has no reset: it holds what this printer measured.
 */
export const RESETTABLE_ROOT = 'config'

/** The printer keeps its backups of your copy in it; they aren't compared. */
const NOT_COMPARED = /^backups\//

export interface ListedFile {
  path: string;
  size: number;
  modified: number;
}

/**
 * How a file in your copy stands against the defaults, from the two
 * listings alone: `changed` when the sizes differ; `same` when size and
 * time both match (the printer's copy keeps the defaults' times); `check`
 * when only the time differs, so the contents decide; `yours` when there's
 * no default at that path.
 */
export type DefaultState = 'same' | 'changed' | 'check' | 'yours'

export function compareWithDefaults (mine: ListedFile[], defaults: ListedFile[]): Record<string, DefaultState> {
  const byPath = new Map(defaults.map(f => [f.path, f]))
  const out: Record<string, DefaultState> = {}
  for (const f of mine) {
    if (NOT_COMPARED.test(f.path)) continue
    const d = byPath.get(f.path)
    if (!d) out[f.path] = 'yours'
    else if (d.size !== f.size) out[f.path] = 'changed'
    else out[f.path] = d.modified === f.modified ? 'same' : 'check'
  }
  return out
}

/** Asked after a file goes back to its default: the restart that makes the printer use it. */
export function resetRestartNote (printerName: string, printing: boolean): string {
  return printing
    ? `${printerName} uses it after Klipper restarts, and restarting stops the print. Restart once it's done.`
    : `${printerName} uses it after Klipper restarts. It isn't printing, so it's safe now.`
}

const TEXT = /\.(cfg|conf|txt|md|json|ya?ml|ini|py|sh|log|csv|toml)$/i

/** Opened in the editor: text files under 2 MB. The rest download. */
export function opensInEditor (name: string, size: number): boolean {
  return TEXT.test(name) && size <= 2_000_000
}

/** What restarting after a save stops, and whether now's a good time. */
export function restartNote (service: string | null, printerName: string, printing: boolean): string {
  if (!service) return ''
  const what = service === 'klipper' ? 'Klipper' : service === 'moonraker' ? 'Moonraker' : service
  if (service !== 'klipper') return `Saving and restarting restarts ${what}.`
  return printing
    ? `Restarting Klipper stops a print. ${printerName} is printing: save now, and restart once it's done.`
    : `Restarting Klipper stops a print. ${printerName} isn't printing, so it's safe now.`
}

/** Lines that differ between what's saved and what's in the editor, counted simply line by line. */
export function changedLines (saved: string, edited: string): number {
  const a = saved.split('\n')
  const b = edited.split('\n')
  let changed = Math.abs(a.length - b.length)
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) changed++
  return changed
}

/** A name a file or folder can take here: no slashes, not empty, not dot or dot-dot. */
export function validName (name: string): boolean {
  const n = name.trim()
  return !!n && n !== '.' && n !== '..' && !/[\\/]/.test(n)
}
