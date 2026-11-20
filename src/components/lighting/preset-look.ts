import { desaturate, type LightPreset } from '@/services/control/lights'

/** What a preset's box is painted with: its colours, a rainbow for Rainbow, green for Status. */
export function presetGradient (p: LightPreset): string {
  if (p.effect === 'rainbow') return 'linear-gradient(135deg,#ff5a5a,#ffd24a 30%,#4ae38a 55%,#4aa8ff 80%,#a06bff)'
  if (p.effect === 'status') return 'linear-gradient(135deg,#80d6d1,#30d158)'
  const colours = p.colors.map(c => desaturate(c, p.saturation))
  return colours.length === 1 ? colours[0] : `linear-gradient(135deg,${colours.join(',')})`
}
