/**
 * For a device that only sends a message: conservative message -> code
 * matches. Each pattern is anchored on wording the emitter really prints, and
 * a message that matches none stays uncoded. Add a line here only when the
 * book entry's emitter is verified; keep patterns narrow.
 */
export interface MessageMatcher {
  code: string;
  pattern: RegExp;
}

export const MESSAGE_MATCHERS: MessageMatcher[] = [
  { code: 'MU-HOMING-0001', pattern: /\bhome taps disagree\b/i },
  { code: 'MU-HOMING-0002', pattern: /\bno trigger on probe after full movement\b/i },
  { code: 'MU-MOTION-0001', pattern: /\bnozzle is touching the plate\b/i },
  { code: 'MU-NETWORK-0001', pattern: /\bsending stopped by peer\b/i },
  { code: 'MU-HEAT-0001', pattern: /\bheater \S+ not heating at expected rate\b/i }
]
