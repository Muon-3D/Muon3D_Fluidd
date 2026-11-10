/** What the Console's line does with Enter, and whether the arrows are for history or for the caret. */

export interface EnterKey {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  isComposing?: boolean;
}

/** Enter sends the whole text; Shift Enter always adds a line. With "Enter sends" off, Enter adds a line. Ctrl or Cmd Enter always sends. */
export function enterAction (key: EnterKey, enterSends: boolean): 'send' | 'newline' {
  if (key.isComposing || key.shiftKey) return 'newline'
  if (key.ctrlKey || key.metaKey) return 'send'
  return enterSends ? 'send' : 'newline'
}

/** History answers the arrow only when the caret (no selection) is on the first line for up, or the last line for down. */
export function arrowIsHistory (direction: 'up' | 'down', value: string, selectionStart: number, selectionEnd: number): boolean {
  if (selectionStart !== selectionEnd) return false
  return direction === 'up'
    ? !value.slice(0, selectionStart).includes('\n')
    : !value.slice(selectionEnd).includes('\n')
}

/** Rows the line grows to before it scrolls. */
export const MAX_LINE_ROWS = 5
