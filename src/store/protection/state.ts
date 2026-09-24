import type { ProtectionState } from './types'

export const defaultState = (): ProtectionState => {
  return {
    supported: null,
    status: null
  }
}

export const state = defaultState()
