import Vue from 'vue'
import type { AuxUpdateStatus } from './model'

/**
 * Settings › Updates history: the installs and roll-backs this printer
 * reports (`history` on /update/status, when it has one), else the ones
 * this browser followed to their end, newest first.
 */
export type HistoryOutcome = 'updated' | 'rolled_back' | 'failed'

export interface HistoryEntry {
  version: string | null;
  outcome: HistoryOutcome;
  /** When it ended, ms. */
  at: number;
}

export const HISTORY_MAX = 10

export const updateHistory = Vue.observable({
  printer: '',
  entries: [] as HistoryEntry[]
})

const storageKey = (printer: string) => `muon3d.update.history.${printer}`

export function loadHistory (printer: string): HistoryEntry[] {
  if (printer === updateHistory.printer) return updateHistory.entries
  updateHistory.printer = printer
  try {
    const raw = localStorage.getItem(storageKey(printer))
    const list = raw ? JSON.parse(raw) : []
    updateHistory.entries = Array.isArray(list) ? list : []
  } catch {
    updateHistory.entries = []
  }
  return updateHistory.entries
}

/** An install this browser followed has ended: keep it (once). */
export function recordOutcome (printer: string, entry: HistoryEntry) {
  const entries = loadHistory(printer)
  if (entries.some(e => e.version === entry.version && e.outcome === entry.outcome && Math.abs(e.at - entry.at) < 60 * 60 * 1000)) return
  updateHistory.entries = [entry, ...entries].slice(0, HISTORY_MAX)
  try {
    localStorage.setItem(storageKey(printer), JSON.stringify(updateHistory.entries))
  } catch { /* private window */ }
}

const OUTCOMES: HistoryOutcome[] = ['updated', 'rolled_back', 'failed']

/** The printer's own list, when it reports one: `[{ version, outcome, finished_at }]`. */
export function printerHistory (status: AuxUpdateStatus | null): HistoryEntry[] | null {
  const list = (status as { history?: unknown } | null)?.history
  if (!Array.isArray(list)) return null
  return list
    .map(item => {
      const i = (item ?? {}) as { version?: string, outcome?: string, finished_at?: string }
      const at = i.finished_at ? Date.parse(i.finished_at) : NaN
      if (!OUTCOMES.includes(i.outcome as HistoryOutcome) || !Number.isFinite(at)) return null
      return { version: i.version ?? null, outcome: i.outcome as HistoryOutcome, at }
    })
    .filter((e): e is HistoryEntry => !!e)
    .sort((a, b) => b.at - a.at)
    .slice(0, HISTORY_MAX)
}

/** What a history row says. */
export function historyLine (entry: HistoryEntry, printerName: string): string {
  if (entry.outcome === 'updated') return 'Installed'
  if (entry.outcome === 'rolled_back') return `Didn't finish, so ${printerName} went back to the version it had`
  return "Didn't install; nothing changed"
}
