import Vue from 'vue'

/**
 * Which of Files' two panes a phone shows: the page header's "Config files |
 * Other files" choice, and the page under it. A desktop shows both.
 */
export type FilesPane = 'config' | 'other'

export const filesView = Vue.observable({ pane: 'config' as FilesPane, sheetOpen: false })
