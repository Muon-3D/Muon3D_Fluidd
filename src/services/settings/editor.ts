/**
 * Files and editor (KAN-1994, KAN-1995): what Save and restart does in the
 * file editor, and how big the editor's text is.
 *
 * - ask: Save and restart says what changes and asks first.
 * - always: Save and restart saves and restarts at once.
 * - never: there is no Save and restart; Save only writes the file.
 */
export type SaveAndRestart = 'ask' | 'always' | 'never'
export type EditorTextSize = 'small' | 'normal' | 'large'

export const SAVE_AND_RESTART_OPTIONS: Array<{ value: SaveAndRestart, label: string }> = [
  { value: 'ask', label: 'Ask' },
  { value: 'always', label: 'Always' },
  { value: 'never', label: 'Never' }
]

export const TEXT_SIZE_OPTIONS: Array<{ value: EditorTextSize, label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' }
]

/** The editor's text, in px. Normal is the size it always had. */
export const EDITOR_FONT_PX: Record<EditorTextSize, number> = { small: 13, normal: 16, large: 20 }

export function saveAndRestartMode (value: unknown): SaveAndRestart {
  return value === 'always' || value === 'never' ? value : 'ask'
}

export function editorTextSize (value: unknown): EditorTextSize {
  return value === 'small' || value === 'large' ? value : 'normal'
}

export function editorFontPx (value: unknown): number {
  return EDITOR_FONT_PX[editorTextSize(value)]
}

/** What the Save and restart setting says it does, under its name. */
export function saveAndRestartLine (mode: SaveAndRestart): string {
  if (mode === 'always') return 'Save and restart saves the file and restarts at once.'
  if (mode === 'never') return 'Save only writes the file. Restart yourself when you are ready.'
  return 'Save and restart shows what changes, then asks before it restarts.'
}
