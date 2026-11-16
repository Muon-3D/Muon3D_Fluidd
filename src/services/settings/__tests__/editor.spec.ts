import { describe, it, expect } from 'vitest'
import { defaultState } from '@/store/config/state'
import { EDITOR_FONT_PX, editorFontPx, editorTextSize, saveAndRestartLine, saveAndRestartMode } from '../editor'

describe('Files and editor settings', () => {
  it('Save and restart is Ask and the text Normal until someone changes them', () => {
    const editor = defaultState().uiSettings.editor
    expect(editor.saveAndRestart).toBe('ask')
    expect(editor.textSize).toBe('normal')
  })

  it('keeps the top bar\'s Save and restart where it was saved', () => {
    expect(defaultState().uiSettings.general.showSaveConfigAndRestart).toBe(true)
  })

  it('reads a missing or unknown Save and restart as Ask', () => {
    expect(saveAndRestartMode(undefined)).toBe('ask')
    expect(saveAndRestartMode('sometimes')).toBe('ask')
    expect(saveAndRestartMode('always')).toBe('always')
    expect(saveAndRestartMode('never')).toBe('never')
  })

  it('says what each choice does', () => {
    expect(saveAndRestartLine('ask')).toMatch(/asks/)
    expect(saveAndRestartLine('always')).toMatch(/at once/)
    expect(saveAndRestartLine('never')).toMatch(/only writes/)
  })

  it('Small, Normal and Large are three sizes, Normal the editor\'s old 16px', () => {
    expect(EDITOR_FONT_PX.normal).toBe(16)
    expect(EDITOR_FONT_PX.small).toBeLessThan(16)
    expect(EDITOR_FONT_PX.large).toBeGreaterThan(16)
    expect(editorTextSize('huge')).toBe('normal')
    expect(editorFontPx(undefined)).toBe(16)
    expect(editorFontPx('large')).toBe(EDITOR_FONT_PX.large)
  })
})
