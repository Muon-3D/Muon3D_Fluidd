/** Logs are downloaded, not opened: they run to megabytes. */
export function downloadsOnly (root: string): boolean {
  return root === 'logs'
}

/** The order Files lists its folders in: the printer's own first. */
export function orderRoots (roots: string[]): string[] {
  const first = ['config', 'calibration', 'defaults', 'logs', 'docs']
  const rank = (r: string) => (first.includes(r) ? first.indexOf(r) : first.length)
  return [...roots].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

export interface ListedFile {
  path: string;
  size: number;
  modified: number;
}

export type DefaultState = 'same' | 'changed' | 'check' | 'yours'
export type DefaultTag = 'changed' | 'yours'

export function listedFiles (response: unknown): ListedFile[] {
  const files = Array.isArray(response) ? response : (response as { result?: unknown } | undefined)?.result
  if (!Array.isArray(files) || !files.every(f => f && typeof f.path === 'string' && Number.isFinite(f.size) && Number.isFinite(f.modified))) {
    throw new Error('The printer did not return a file listing')
  }
  return files
}

export function compareWithDefaults (mine: ListedFile[], defaults: ListedFile[]): Record<string, DefaultState> {
  const byPath = new Map(defaults.map(f => [f.path, f]))
  const states: Record<string, DefaultState> = Object.create(null)
  for (const file of mine) {
    if (file.path.startsWith('backups/')) continue
    const original = byPath.get(file.path)
    states[file.path] = !original
      ? 'yours'
      : original.size !== file.size
        ? 'changed'
        : original.modified === file.modified ? 'same' : 'check'
  }
  return states
}

export function defaultTags (states: Record<string, DefaultState>): Record<string, DefaultTag> {
  const tags: Record<string, DefaultTag> = Object.create(null)
  for (const [path, state] of Object.entries(states)) {
    if (state !== 'changed' && state !== 'yours') continue
    tags[path] = state
    if (state !== 'changed') continue
    const parts = path.split('/')
    for (let i = 1; i < parts.length; i++) tags[parts.slice(0, i).join('/')] = 'changed'
  }
  return tags
}

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

/** What a tap on a file does in Files: open it, or download it (logs, big files, non-text). */
export function tapDownloads (root: string, name: string, size: number): boolean {
  return downloadsOnly(root) || !opensInEditor(name, size)
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
