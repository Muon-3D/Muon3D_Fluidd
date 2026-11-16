import { M1_VIEW } from '@/services/machine/orientation'

/**
 * The Z keys' words. On a Muon printer they say how the plate moves (the M1
 * prints upside down; M1_VIEW.zPlus says which way Z+ takes the plate), with
 * the axis in the tooltip. Other printers keep Z+ and Z−.
 */
export function zKeyWords (muon: boolean, zPlus: 'up' | 'down' = M1_VIEW.zPlus) {
  if (!muon) {
    return {
      up: { text: 'Z+', label: 'Z+', title: 'Z+' },
      down: { text: 'Z−', label: 'Z−', title: 'Z−' }
    }
  }
  const plus = zPlus === 'up' ? 'Plate up' : 'Plate down'
  const minus = zPlus === 'up' ? 'Plate down' : 'Plate up'
  return {
    up: { text: plus, label: `${plus} (Z+)`, title: 'Z+' },
    down: { text: minus, label: `${minus} (Z−)`, title: 'Z−' }
  }
}
