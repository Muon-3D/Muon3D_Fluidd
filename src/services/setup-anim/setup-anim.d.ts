export type SetupStep = 'toolhead' | 'spine' | 'lever' | 'plate'

export const SETUP_STEPS: SetupStep[]
export const SETUP_MESSAGES: Record<SetupStep, { title: string, hint: string }>
export const LOOP_MS: Record<SetupStep, number>
export const SETUP_THEMES: Record<'dark' | 'light', { bg: string, ink: string, mute: string, accent: string }>

export function nextSetupStep (missing: SetupStep[] | Set<SetupStep>): SetupStep | null

export interface DrawSetupOptions {
  size?: number
  theme?: 'dark' | 'light'
  reducedMotion?: boolean
  accent?: string
  ink?: string
  mute?: string
  bg?: string
  background?: boolean
  label?: boolean
  fonts?: { title?: string, hint?: string }
}

export function drawSetup (ctx: CanvasRenderingContext2D, step: SetupStep, tMs: number, opts?: DrawSetupOptions): void
