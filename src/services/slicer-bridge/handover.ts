import { LIMITS, MODELS_OPEN_FEATURE, type ModelsOpen } from './vendor/printer-client/bridge/protocol'

/**
 * Models handed to Slice (KAN-2191). A model dropped on a printer's page, or
 * picked with Upload, is the slicer's, not a file for the printer: Open Slice
 * holds the File objects here, /slice opens, and once the slicer is welcomed
 * it is sent them (printer-bridge/1's models.open, printer-client 0.5.0) and
 * they are let go, so a reload of /slice never adds them again. Held in this
 * page only: a model never leaves the person's computer except into the
 * slicer's frame.
 */

/** What Upload's picker takes besides G-code: the model files Slice adds. */
export const MODEL_ACCEPT = ['.stl', '.3mf', '.obj', '.step', '.stp']

let held: File[] = []

/** Holds `files` (at most printer-bridge's LIMITS.paths) for the next /slice. */
export function holdModels (files: readonly File[]): void {
  held = files.slice(0, LIMITS.paths)
}

/** The models held for /slice. */
export function heldModels (): readonly File[] {
  return held
}

/** Lets the held models go. */
export function dropHeldModels (): void {
  held = []
}

/** What models.open carries for `files`: each name and its bytes. */
export async function modelsOpenData (files: readonly File[]): Promise<ModelsOpen> {
  return { files: await Promise.all(files.map(async file => ({ name: file.name, bytes: await file.arrayBuffer() }))) }
}

/** The bridge as handOver needs it. */
export interface ModelsBridge {
  readonly connected: boolean
  readonly clientFeatures: readonly string[]
  modelsOpen (open: ModelsOpen): boolean
}

export type HandOver = 'none' | 'sent' | 'not-taken'

/**
 * Sends the held models to a welcomed slicer and lets them go: `sent`, or
 * `not-taken` for a slicer that predates models.open (or files it refused),
 * when the person must add them with the slicer's Add model. `none`: nothing
 * held, or no slicer welcomed yet (they stay held).
 */
export async function handOverModels (bridge: ModelsBridge | null | undefined): Promise<HandOver> {
  const files = held
  if (!files.length || !bridge?.connected) return 'none'
  dropHeldModels()
  if (!bridge.clientFeatures.includes(MODELS_OPEN_FEATURE)) return 'not-taken'
  return bridge.modelsOpen(await modelsOpenData(files)) ? 'sent' : 'not-taken'
}
