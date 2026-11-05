/**
 * Which node of the accurate M1 GLB moves, along which axis, how far. This is
 * the one place that changes when the model is re-fitted: the animation code
 * (node-binding.ts) only knows roles. Names, axes and travels are filled in
 * from the asset's README (src/assets/m1/README.md).
 */
export type Axis = 'x' | 'y' | 'z'

export interface NodeBinding {
  /** The node's name in the GLB. */
  node: string;
  /** The local axis it slides along. */
  axis: Axis;
  /** Millimetres (in the GLB's units) for a state value of 1; negative to run the other way. */
  travel: number;
  /** Added to the state value before scaling: the value at which the node sits at its modelled position. */
  zero?: number;
}

export interface AccurateModelConfig {
  /** Multiplier from the GLB's units to the stage's (millimetres). */
  scale: number;
  /** The head along the cross rail, state headX from -1 to 1. */
  headX: NodeBinding;
  /** The head along the trough, state headZ from -1 to 1. */
  headZ: NodeBinding;
  /** The bed's height, state z from 0 (lowest) to 1. */
  bedHeight: NodeBinding;
}

/** Placeholder names until the asset's README is merged; see the PR for the real ones. */
export const ACCURATE_M1: AccurateModelConfig = {
  scale: 1,
  headX: { node: 'head_x', axis: 'x', travel: 100 },
  headZ: { node: 'head_z', axis: 'z', travel: 92 },
  bedHeight: { node: 'bed_lift', axis: 'y', travel: 164 }
}
