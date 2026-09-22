import Vue from 'vue'
import { getManagedSessionBoundary, managedSessionBoundaryState } from './sessionBoundary'

export interface ManagedPreviewSession {
  workspaceName: string
  onboardingComplete: boolean
}

export interface ManagedConsoleState {
  session: ManagedPreviewSession | null
  error: string | null
}

export const managedConsoleState = Vue.observable<ManagedConsoleState>({
  session: null,
  error: null
})

export const managedPreviewState = {
  signIn (email: string, password: string) {
    const normalizedEmail = email.trim()
    managedConsoleState.error = null

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || password.length < 8) {
      managedConsoleState.error = 'Enter a valid email and an 8+ character password to continue the preview.'
      return false
    }

    // The preview deliberately retains no account identifier or credential.
    managedConsoleState.session = {
      workspaceName: '',
      onboardingComplete: false
    }
    return true
  },

  completeOnboarding (workspaceName: string) {
    const normalizedName = workspaceName.trim()
    managedConsoleState.error = null

    if (!managedConsoleState.session) {
      managedConsoleState.error = 'Start the managed preview before setting up a workspace.'
      return false
    }
    if (!normalizedName) {
      managedConsoleState.error = 'Enter a workspace name to continue the preview.'
      return false
    }

    managedConsoleState.session.workspaceName = normalizedName
    managedConsoleState.session.onboardingComplete = true
    return true
  },

  get canOpenSelectedPrinter () {
    return managedSessionBoundaryState.available && getManagedSessionBoundary() !== null
  },

  async openSelectedPrinter () {
    const boundary = getManagedSessionBoundary()
    managedConsoleState.error = null
    if (!boundary) {
      managedConsoleState.error = 'Managed printer access is not connected in this preview.'
      return false
    }

    await boundary.openSelectedPrinter()
    return true
  },

  signOut () {
    managedConsoleState.session = null
    managedConsoleState.error = null
  }
}
