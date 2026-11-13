import { LIMITS, MODELS_OPEN_FEATURE, type ModelsOpen } from './vendor/printer-client/bridge/protocol'

/**
 * Models handed to Slice (KAN-2191). A model dropped on a printer's page, or
 * picked with Upload, is the slicer's, not a file for the printer: Open Slice
 * holds the File objects here, /slice opens, and once the slicer is welcomed
 * it is sent them (printer-bridge/1's models.open, printer-client 0.5.0) and
 * they are let go, so a reload of /slice never adds them again. If /slice
 * can't hand them over (no slicer, or one that never says hello) they are let
 * go too, and the person is told to use the slicer's Add model. Held in this
 * page only: a model never leaves the person's computer except into the
 * slicer's frame.
 */

/**
 * The model files the slicer opens: its own list (muon3d-slicer
 * web/src/components/fileTypes.ts MODEL_EXTENSIONS: stl, obj, 3mf). A STEP
 * file is a model too (services/jobs/model.ts isModelFile), but the slicer
 * can't open one, so it is never promised to Slice.
 */
export const SLICER_MODEL_EXTENSIONS = ['stl', 'obj', '3mf'] as const

/** What Upload's picker takes besides G-code: the models Slice opens. */
export const MODEL_ACCEPT = SLICER_MODEL_EXTENSIONS.map(ext => `.${ext}`)

const SLICEABLE = new RegExp(`\\.(${SLICER_MODEL_EXTENSIONS.join('|')})$`, 'i')

/** Whether the slicer opens `name` (an STL, OBJ or 3MF). */
export function isSlicerModel (name: string): boolean {
  return SLICEABLE.test(name)
}

let held: File[] = []

/**
 * Why `files` can't go to Slice in one models.open, checked before any byte
 * is read: more than LIMITS.paths files, or more than LIMITS.uploadBytes in
 * all. Null: they can.
 */
export function holdProblem (files: readonly File[]): string | null {
  if (files.length > LIMITS.paths) {
    return `Slice opens at most ${LIMITS.paths} models at once, and these are ${files.length}. Open fewer at a time.`
  }
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (total > LIMITS.uploadBytes) {
    return `These models are ${Math.ceil(total / (1024 * 1024))} MiB together; Slice takes ${LIMITS.uploadBytes / (1024 * 1024)} MiB at once. Open fewer at a time.`
  }
  return null
}

/** Holds `files` for the next /slice; the problem (holdProblem) instead when they can't go, and nothing is held. */
export function holdModels (files: readonly File[]): string | null {
  const problem = holdProblem(files)
  held = problem ? [] : [...files]
  return problem
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
 * held, or no slicer welcomed yet (they stay held), unless `giveUp`: then
 * there will be none (no slicer here, or it never said hello), and they are
 * let go as `not-taken`.
 */
export async function handOverModels (bridge: ModelsBridge | null | undefined, giveUp = false): Promise<HandOver> {
  const files = held
  if (!files.length) return 'none'
  if (!bridge?.connected) {
    if (!giveUp) return 'none'
    dropHeldModels()
    return 'not-taken'
  }
  dropHeldModels()
  if (!bridge.clientFeatures.includes(MODELS_OPEN_FEATURE)) return 'not-taken'
  return bridge.modelsOpen(await modelsOpenData(files)) ? 'sent' : 'not-taken'
}

/** What the person is told when the models can't go to the slicer. */
export function addModelText (names: readonly string[]): string {
  return `This slicer can't take a model from here yet: add ${names.join(', ')} with Add model.`
}
