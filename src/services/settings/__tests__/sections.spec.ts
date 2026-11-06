import { describe, expect, it } from 'vitest'
import { MOVED_TO_ACCOUNT, SETTINGS_SECTIONS, openSettingsSection, searchSettingsSections, settingsSectionFor, visibleSettingsSections } from '../sections'
import { readFileSync } from 'node:fs'
import { PAGE_KEYS } from '@/router/printerSections'

const simple = { components: ['update_manager', 'muon_access'] }
const withTimelapse = { components: ['update_manager', 'muon_access', 'timelapse'] }

const ids = (c: typeof simple) => visibleSettingsSections(c).map(s => s.id)

describe("Settings' sections", () => {
  it('shows every supported settings section', () => {
    const expected = [
      'general', 'network', 'access', 'updates', 'cameras', 'materials', 'macros',
      'console', 'files', 'toolhead', 'gcodePreview', 'developer', 'system'
    ]
    expect(ids(simple)).toEqual(expected)
  })

  it('adds only the sections backed by printer capabilities', () => {
    expect(ids(withTimelapse)).toEqual([
      'general', 'network', 'access', 'updates', 'cameras', 'materials', 'macros', 'timelapse',
      'console', 'files', 'toolhead', 'gcodePreview', 'developer', 'system'
    ])
  })

  it('leave out Updates and People without the printer parts behind them', () => {
    expect(ids({ components: [] })).not.toContain('updates')
    expect(ids({ components: [] })).not.toContain('access')
  })

  it('open from any of their cards\' anchors', () => {
    const sections = visibleSettingsSections(withTimelapse)
    expect(settingsSectionFor('#theme', sections)?.id).toBe('general')
    expect(settingsSectionFor('#auth', sections)?.id).toBe('access')
    expect(settingsSectionFor('#editor', sections)?.id).toBe('files')
  })

  it('open nothing for no anchor, or a section not shown', () => {
    expect(settingsSectionFor('', visibleSettingsSections(simple))).toBeNull()
    expect(settingsSectionFor('#console', visibleSettingsSections(simple))?.id).toBe('console')
  })

  it("hold G U's anchor, so the key opens Updates", () => {
    const updates = PAGE_KEYS.find(k => k.key === 'u')!
    expect(settingsSectionFor(updates.hash!, visibleSettingsSections(simple))?.id).toBe('updates')
  })

  it("send the Library's old address to the account, where its settings are now (KAN-532)", () => {
    expect(SETTINGS_SECTIONS.map(s => s.id)).not.toContain('library')
    expect(settingsSectionFor('#library', visibleSettingsSections(withTimelapse))).toBeNull()
    expect(MOVED_TO_ACCOUNT.library).toBe('/account/library')
  })

  it('give every card one home', () => {
    const anchors = SETTINGS_SECTIONS.flatMap(s => s.anchors)
    expect(new Set(anchors).size).toBe(anchors.length)
  })
})

describe('the section an address opens', () => {
  it('is only one the printer shows', () => {
    expect(openSettingsSection('#versions', { components: ['update_manager'] })?.label).toBe('Updates')
    expect(openSettingsSection('#versions', { components: [] })).toBeNull()
    expect(openSettingsSection('#timelapse', simple)).toBeNull()
    expect(openSettingsSection('#camera', { components: [] })?.id).toBe('cameras')
  })
})

describe("Settings' list lines and search", () => {
  it('give every section an icon the frame draws and a line saying what it is for', () => {
    const icons = readFileSync('src/components/ui/FrameIcon.vue', 'utf8')
    for (const s of SETTINGS_SECTIONS) {
      expect(s.blurb.length, s.id).toBeGreaterThan(5)
      expect(icons, `${s.id} icon ${s.icon}`).toMatch(new RegExp(`\\s${s.icon}: \\[`))
    }
  })

  it('search by name, by what it is for, or by another word for it', () => {
    const all = visibleSettingsSections(withTimelapse)
    expect(searchSettingsSections(all, '').length).toBe(all.length)
    expect(searchSettingsSections(all, 'wi-fi').map(s => s.id)).toEqual(['network'])
    expect(searchSettingsSections(all, 'password').map(s => s.id)).toEqual(['access'])
    expect(searchSettingsSections(all, 'restart').map(s => s.id)).toEqual(['system'])
    expect(searchSettingsSections(all, 'zzzz')).toEqual([])
  })
})
