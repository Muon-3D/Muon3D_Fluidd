/**
 * Settings' sections, as its list shows them. A section holds some of
 * Fluidd's settings cards, found by their anchors (`#theme` is in General),
 * or links to a page of its own (Wi-Fi, System).
 */
export type SettingsSectionId =
  'general' | 'network' | 'access' | 'updates' | 'cameras' | 'materials' | 'macros' |
  'timelapse' | 'spoolman' | 'console' | 'files' | 'toolhead' | 'gcodePreview' | 'developer' | 'system'

/** The Moonraker components a settings section can depend on. */
export const SECTION_COMPONENTS = ['authorization', 'update_manager', 'timelapse', 'spoolman', 'muon_access', 'muon_protection']

/** What decides whether a section shows. */
export interface SettingsContext {
  /** Moonraker components the printer has: authorization, update_manager, timelapse, spoolman, muon_access, muon_protection. */
  components: string[];
}

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  /** The cards' anchors, in order; the first is the section's own address. */
  anchors: string[];
  /** The line's icon, a FrameIcon name. */
  icon: string;
  /** What the section is for, under its title. */
  blurb: string;
  /** Other words a search for it should match. */
  keywords?: string[];
  /** A page of its own instead of cards. */
  page?: string;
  shows?: (c: SettingsContext) => boolean;
}

const has = (component: string) => (c: SettingsContext) => c.components.includes(component)

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'general', label: 'General', anchors: ['general', 'theme'], icon: 'settings', blurb: 'How Control looks and behaves on this printer', keywords: ['theme', 'language', 'units', 'name', 'backup', 'reset'] },
  { id: 'network', label: 'Wi-Fi and network', anchors: [], icon: 'wifi', blurb: "The printer's Wi-Fi and how it is reached", keywords: ['wifi', 'wi-fi', 'hotspot', 'ip', 'internet'], page: '/wifi' },
  {
    id: 'access',
    label: 'People and access',
    anchors: ['access', 'protection', 'auth'],
    icon: 'user',
    blurb: 'Who can use this printer, and how they sign in',
    keywords: ['people', 'login', 'password', 'users', 'owner', 'api key', 'protection'],
    shows: c => ['muon_access', 'muon_protection', 'authorization'].some(name => c.components.includes(name))
  },
  { id: 'updates', label: 'Updates', anchors: ['versions'], icon: 'download', blurb: "The printer's software and when it updates", keywords: ['update', 'version', 'upgrade', 'software'], shows: has('update_manager') },
  { id: 'cameras', label: 'Cameras', anchors: ['camera'], icon: 'camera', blurb: "The printer's cameras and how they stream", keywords: ['webcam', 'stream', 'video'] },
  { id: 'materials', label: 'Materials', anchors: ['presets'], icon: 'spool', blurb: 'Filament presets and temperatures', keywords: ['filament', 'preset', 'temperature', 'pla', 'petg'] },
  { id: 'macros', label: 'Macros', anchors: ['macros'], icon: 'macro', blurb: 'Which macros show, and in which category', keywords: ['gcode', 'quick actions', 'buttons'] },
  { id: 'timelapse', label: 'Timelapse', anchors: ['timelapse'], icon: 'clock', blurb: 'How print timelapses are made', keywords: ['video', 'render', 'frames'], shows: has('timelapse') },
  { id: 'spoolman', label: 'Spoolman', anchors: ['spoolman'], icon: 'spool', blurb: 'Your spool inventory', keywords: ['filament', 'spools'], shows: has('spoolman') },
  { id: 'console', label: 'Console', anchors: ['console'], icon: 'console', blurb: 'How the console reads and filters', keywords: ['terminal', 'filter', 'log'] },
  { id: 'files', label: 'Files and editor', anchors: ['browser', 'editor'], icon: 'files', blurb: 'How files are listed and edited', keywords: ['browser', 'editor', 'gcode', 'config'] },
  { id: 'toolhead', label: 'Moving and extruding', anchors: ['toolhead'], icon: 'control', blurb: "How Control's move pad, extrude buttons and macros behave", keywords: ['moving', 'extruding', 'speed', 'axis', 'homing', 'paper test'] },
  { id: 'gcodePreview', label: 'G-code preview', anchors: ['gcodePreview'], icon: 'jobs', blurb: 'How the G-code preview draws a print', keywords: ['layers', '3d', 'render', 'preview'] },
  { id: 'developer', label: 'Developer mode', anchors: ['developer'], icon: 'code', blurb: 'For people building on the printer', keywords: ['dev', 'developer', 'configuration'] },
  { id: 'system', label: 'System', anchors: [], icon: 'chip', blurb: "Restart, logs and the printer's health", keywords: ['restart', 'reboot', 'logs', 'shutdown', 'host'], page: '/system' }
]

/** The sections that show, each only where the printer has what it sets. */
export function visibleSettingsSections (c: SettingsContext): SettingsSection[] {
  return SETTINGS_SECTIONS.filter(s => !s.shows || s.shows(c))
}

/** The section an address opens on a printer with these components: only one that shows there, else null. */
export function openSettingsSection (hash: string, c: SettingsContext): SettingsSection | null {
  return settingsSectionFor(hash, visibleSettingsSections(c))
}

/**
 * Settings' sections that moved to the account (KAN-532): the Library's
 * settings are the account's, the same on every printer. An old address
 * (`/boxwood-367a/settings#library`) opens them there.
 */
export const MOVED_TO_ACCOUNT: Record<string, string> = { library: '/account/library' }

/**
 * The section an address opens: `#theme` is General, `#versions` Updates.
 * No anchor, or one that isn't shown, is null, so a phone shows the list
 * and a wider screen the first section.
 */
export function settingsSectionFor (hash: string, sections: SettingsSection[]): SettingsSection | null {
  const anchor = hash.replace(/^#/, '')
  if (!anchor) return null
  return sections.find(s => s.anchors.includes(anchor)) ?? null
}

/** The sections a search for `query` leaves: by name, blurb or keyword. An empty search leaves them all. */
export function searchSettingsSections (sections: SettingsSection[], query: string): SettingsSection[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return sections
  return sections.filter(s => {
    const hay = [s.label, s.blurb, ...(s.keywords ?? [])].join(' ').toLowerCase()
    return words.every(w => hay.includes(w))
  })
}
