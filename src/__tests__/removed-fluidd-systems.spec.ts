/**
 * Fluidd's own dashboard, layout-edit mode, notification drawer and filament
 * setter are gone (Jack, 9 and 12 Nov: "do not leave them lurking in the
 * background"). This reads the source tree, so a revived one fails here:
 * the route that opens the Overview is called Overview, nothing can put the
 * app into layout-edit mode, and no "Set the filament" dialog exists.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '..')

function sources (dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (name === '__tests__' || name === 'locales' || name === 'node_modules') continue
      sources(path, out)
    } else if (/\.(ts|vue)$/.test(name)) out.push(path)
  }
  return out
}

const FILES = sources(SRC).map(path => ({ path, text: readFileSync(path, 'utf8') }))
const hits = (pattern: RegExp) => FILES.filter(f => pattern.test(f.text)).map(f => f.path.slice(SRC.length + 1))

describe('Fluidd systems our UI replaced are gone', () => {
  it('has no route or check named Dashboard', () => {
    expect(hits(/['"]Dashboard['"]/)).toEqual([])
  })

  it('has no layout-edit mode: no layoutMode state, no setLayoutMode, no in-layout card chrome', () => {
    expect(hits(/layoutMode|setLayoutMode|inLayout|in-layout/)).toEqual([])
  })

  it('has no old "Set the filament" dialog and no Fluidd notification drawer', () => {
    expect(hits(/Set the filament|FilamentSetter|AppNotificationMenu|NotificationsMenu/i)).toEqual([])
  })
})
