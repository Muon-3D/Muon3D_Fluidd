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
