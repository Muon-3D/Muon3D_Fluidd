import Vue from 'vue'
import store from '../../src/store'
import { cloudState } from '../../src/services/muon-cloud/state'
import { discoveryState } from '../../src/services/muon-cloud/discovery'
import { liveForeign } from '../../src/services/foreign-printers/live'
import { setForeignRecords } from '../../src/services/foreign-printers/registry'

export async function seedStrip (count = 8) {
  while (!cloudState.ready) await new Promise(resolve => setTimeout(resolve, 20))
  setForeignRecords([])
  liveForeign.records = []
  cloudState.account = { id: 'strip-test', email: 'test@example.test', name: 'Test', created_at: 1 }
  cloudState.printers = Array.from({ length: count }, (_, i) => ({ id: `strip-${i}`, name: ['Elm', 'Ash', 'Yew', 'Oak', 'Larch', 'Cedar', 'Willow', 'Birch'][i] ?? `Printer ${i}`, model: 'M1', version: '1', linked_at: 1, last_seen: 0, online: i !== 5, online_since: 1, shared: i === 7, role: 'operator' as const }))
  cloudState.layout.groups = [{ id: 'bench', name: 'Workshop', printers: cloudState.printers.slice(0, 7).map(p => p.id) }]
  const states = ['printing', 'idle', 'idle', 'paused', 'klipper shutdown', 'idle', undefined, 'idle']
  cloudState.status = Object.fromEntries(cloudState.printers.map((p, i) => [p.id, { reachable: true, updatedAt: Date.now(), state: states[i], ...(i === 2 ? { extruder: { temperature: 30, target: 200 } } : {}) }]))
  delete cloudState.status['strip-6']
  discoveryState.finishedAt = Date.now()
  discoveryState.found = [{ name: 'Found printer', endpointId: 'found-strip', host: '192.0.2.11', apiUrl: 'http://192.0.2.11', link: { phase: 'unlinked' } }]
}

export function onlyState (index: number) {
  const p = cloudState.printers.find(p => p.id === `strip-${index}`)!
  cloudState.printers = [p]
}

export function addForeign () {
  const record = { id: 'strip-foreign', kind: 'moonraker' as const, name: 'Other maker', host: '192.0.2.12', via: 'direct' as const, formFactor: 'bed-slinger' as const, credentialsRef: null, addedAt: 1 }
  setForeignRecords([record])
  liveForeign.records = [record]
  Vue.set(liveForeign.status, record.id, { state: 'idle', message: null, file: null, progress: null, timeLeft: null, temps: [] })
  cloudState.printers = []
}

export function lightTheme () { return store.dispatch('config/updateTheme', { isDark: false }) }
