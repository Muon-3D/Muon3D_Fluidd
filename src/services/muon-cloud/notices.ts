/**
 * The signed-in account's notices (I-147, muon-link-cloud #116). Fetched on
 * sign-in, when the window regains focus, and every five minutes; never in a
 * tight loop. The console is the authority: a notice counts as read only once
 * the console says so.
 */
import Vue from 'vue'
import { cloudApi, type Notice } from './api'

export const NOTICES_REFRESH_MS = 5 * 60 * 1000

export const noticeState = Vue.observable<{ items: Notice[], unread: number, error: string }>({ items: [], unread: 0, error: '' })

let timer: number | null = null
let users = 0
let inFlight: Promise<void> | null = null

export function resetNotices () {
  stopTimer()
  users = 0
  inFlight = null
  noticeState.items = []
  noticeState.unread = 0
  noticeState.error = ''
}

export function loadNotices (): Promise<void> {
  if (inFlight) return inFlight
  inFlight = cloudApi.notices().then(r => {
    noticeState.items = r.notices
    noticeState.unread = r.unread
    noticeState.error = ''
  }).catch(() => {
    // Keep what we have; the next focus or tick tries again.
    noticeState.error = 'Notices could not be loaded.'
  }).finally(() => { inFlight = null })
  return inFlight
}

export async function markNoticeRead (id: string): Promise<void> {
  const n = noticeState.items.find(x => x.id === id)
  if (!n || n.read_at !== null) return
  try {
    const r = await cloudApi.readNotice(id)
    n.read_at = r.notice.read_at ?? Math.floor(Date.now() / 1000)
    noticeState.unread = noticeState.items.filter(x => x.read_at === null).length
  } catch {
    // Stays unread; the console did not confirm.
  }
}

function onFocus () {
  loadNotices()
}

function stopTimer () {
  if (timer !== null) window.clearInterval(timer)
  timer = null
  window.removeEventListener('focus', onFocus)
}

/** Starts fetching for one mounted bell. Returns the stop function. */
export function watchNotices (): () => void {
  users++
  if (users === 1) {
    window.addEventListener('focus', onFocus)
    timer = window.setInterval(() => { loadNotices() }, NOTICES_REFRESH_MS)
  }
  loadNotices()
  return () => {
    users = Math.max(0, users - 1)
    if (users === 0) stopTimer()
  }
}
