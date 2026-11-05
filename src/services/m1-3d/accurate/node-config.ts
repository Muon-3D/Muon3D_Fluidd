/**
 * Which node of the accurate M1 GLB moves, along which axis, how far. This is
 * the one place that changes when the model is re-fitted: the animation code
 * (node-binding.ts) only knows roles. The numbers are from the asset's README
 * (src/assets/m1/README.md), checked against the GLB's own node transforms in
 * __tests__/klipper-map.spec.ts.
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

export const ACCURATE_M1: AccurateModelConfig = {
  scale: 1,
  // Local z runs to world -X, so a negative travel makes state +1 go to world +X (nozzle X -101.6 ... +102.8).
  headX: { node: 'M1_X_Carriage', axis: 'z', travel: -102.2 },
  // Local x runs to world +Z, toward the front (nozzle Z -92.0 ... +87.9).
  headZ: { node: 'M1_Y_Gantry', axis: 'x', travel: 89.95 },
  // State 0 is the lowest the bed goes (plate top -76.8); the GLB sits at 0.5103 (plate top 0).
  bedHeight: { node: 'M1_Z_Stage', axis: 'y', travel: 150.5, zero: -0.5103 }
}
