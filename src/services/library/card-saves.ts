import Vue from 'vue'
import { describeLibraryError } from './api'
import { libraryClient } from './store'

export const cardSaves = Vue.observable({ ids: {} as Record<string, string | null>, busy: {} as Record<string, boolean>, errors: {} as Record<string, string> })
const pending = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null
let generation = 0

export function clearCardSaves () {
  generation++
  pending.clear()
  cardSaves.ids = {}
  cardSaves.errors = {}
  cardSaves.busy = {}
}

export function cardSaveKey (id: string, kind: 'publication' | 'catalogue' = 'publication'): string { return kind === 'catalogue' ? `catalogue:${id}` : id }

export function readCardSave (targetId: string, kind: 'publication' | 'catalogue' = 'publication') {
  const id = cardSaveKey(targetId, kind)
  if (id in cardSaves.ids) return
  pending.add(id)
  if (timer) return
  timer = setTimeout(async () => {
    timer = null
    const targets = [...pending]
    pending.clear()
    const revision = generation
    for (const kind of ['publication', 'catalogue'] as const) {
      const ids = targets.filter(id => id.startsWith('catalogue:') === (kind === 'catalogue')).map(id => kind === 'catalogue' ? id.slice(10) : id)
      for (let offset = 0; offset < ids.length; offset += 50) {
        const batch = ids.slice(offset, offset + 50)
        try {
          const { saves } = kind === 'publication' ? await libraryClient().savesOf(batch) : await libraryClient().savesOf(batch, kind)
          if (revision !== generation) return
          for (const id of batch) { const key = cardSaveKey(id, kind); if (!cardSaves.busy[key] && !(key in cardSaves.ids)) Vue.set(cardSaves.ids, key, saves.find(s => s.target.id === id)?.save_id ?? null) }
        } catch { /* A save remains idempotent when the initial lookup is unavailable. */ }
      }
    }
  }, 0)
}

export async function toggleCardSave (targetId: string, kind: 'publication' | 'catalogue' = 'publication') {
  const id = cardSaveKey(targetId, kind)
  if (cardSaves.busy[id]) return
  const revision = generation
  Vue.set(cardSaves.busy, id, true)
  Vue.set(cardSaves.errors, id, '')
  try {
    const saved = cardSaves.ids[id]
    const next = saved ? (await libraryClient().unsave(saved), null) : (kind === 'publication' ? await libraryClient().save(targetId) : await libraryClient().save(targetId, kind)).id
    if (revision === generation) Vue.set(cardSaves.ids, id, next)
  } catch (error) {
    if (revision === generation) Vue.set(cardSaves.errors, id, describeLibraryError(error))
  } finally {
    if (revision === generation) Vue.set(cardSaves.busy, id, false)
  }
}
