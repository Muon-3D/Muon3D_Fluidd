import Vue from 'vue'

export interface ManagedSessionBoundary {
  openSelectedPrinter (): Promise<void> | void
}

let boundary: ManagedSessionBoundary | null = null

export const managedSessionBoundaryState = Vue.observable({
  available: false
})

export function setManagedSessionBoundary (next: ManagedSessionBoundary | null) {
  boundary = next
  managedSessionBoundaryState.available = next !== null
}

export function getManagedSessionBoundary (): ManagedSessionBoundary | null {
  return boundary
}
