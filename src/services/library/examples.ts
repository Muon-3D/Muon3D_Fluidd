/**
 * Example prints for Discover while nothing is published (KAN-1199). Jack
 * (2 Nov) wants to see the shelves full. They are Muon3D's twelve official
 * examples (model service `data/examples/manifest.json`, renders copied from
 * there), the same prints `seed-examples` publishes. Once the service answers
 * with real shelves, these are not shown.
 */
import { LIBRARY_URL, type DiscoverCard, type DiscoverShelf } from './discover'
import xyzCalibrationCube from '@/assets/library-examples/xyz-calibration-cube.png'
import firstLayerCheck from '@/assets/library-examples/first-layer-check.png'
import overhangTest from '@/assets/library-examples/overhang-test.png'
import deskCableClip from '@/assets/library-examples/desk-cable-clip.png'
import phoneStand from '@/assets/library-examples/phone-stand.png'
import utilityWallHook from '@/assets/library-examples/utility-wall-hook.png'
import twistedVase from '@/assets/library-examples/twisted-vase.png'
import deskOrganiserTray from '@/assets/library-examples/desk-organiser-tray.png'
import bagClip from '@/assets/library-examples/bag-clip.png'
import hexCoaster from '@/assets/library-examples/hex-coaster.png'
import hexKeychainTag from '@/assets/library-examples/hex-keychain-tag.png'
import controlKnob from '@/assets/library-examples/control-knob.png'

interface Example {
  key: string;
  title: string;
  minutes: number;
  grams: number;
  material: string;
  picture: string;
  /** Calibration and test prints: the first shelf. */
  start: boolean;
}

const EXAMPLES: Example[] = [
  { key: 'xyz-calibration-cube', title: 'XYZ calibration cube, 20 mm', minutes: 19, grams: 4.4, material: 'PLA', picture: xyzCalibrationCube, start: true },
  { key: 'first-layer-check', title: 'First-layer check, 60 mm', minutes: 4, grams: 0.3, material: 'PLA', picture: firstLayerCheck, start: true },
  { key: 'overhang-test', title: 'Overhang test, 20 to 70 degrees', minutes: 8, grams: 1.5, material: 'PLA', picture: overhangTest, start: true },
  { key: 'desk-cable-clip', title: 'Desk cable clip', minutes: 5, grams: 0.7, material: 'PETG or PLA', picture: deskCableClip, start: false },
  { key: 'phone-stand', title: 'Phone stand', minutes: 131, grams: 35.2, material: 'PLA', picture: phoneStand, start: false },
  { key: 'utility-wall-hook', title: 'Utility wall hook', minutes: 23, grams: 5.8, material: 'PETG or PLA', picture: utilityWallHook, start: false },
  { key: 'twisted-vase', title: 'Twisted vase (vase mode)', minutes: 101, grams: 20.7, material: 'PLA or PETG', picture: twistedVase, start: false },
  { key: 'desk-organiser-tray', title: 'Desk organiser tray', minutes: 88, grams: 25.5, material: 'PLA', picture: deskOrganiserTray, start: false },
  { key: 'bag-clip', title: 'Slide-on bag clip', minutes: 16, grams: 4.2, material: 'PLA or PETG', picture: bagClip, start: false },
  { key: 'hex-coaster', title: 'Honeycomb coaster', minutes: 42, grams: 13.0, material: 'PLA or PETG', picture: hexCoaster, start: false },
  { key: 'hex-keychain-tag', title: 'Hex keychain tag', minutes: 7, grams: 1.9, material: 'PLA', picture: hexKeychainTag, start: false },
  { key: 'control-knob', title: 'Ridged control knob, 6 mm shaft', minutes: 28, grams: 7.2, material: 'PLA or PETG', picture: controlKnob, start: false }
]

const time = (minutes: number) => minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`

function exampleCard (example: Example): DiscoverCard {
  return {
    key: `example:${example.key}`,
    title: example.title,
    byline: 'Muon3D · example',
    facts: [time(example.minutes), `${Math.round(example.grams)} g`, example.material].join(' · '),
    picture: example.picture,
    href: `${LIBRARY_URL}/search?q=${encodeURIComponent(example.title)}&sources=muon3d`,
    tested: false
  }
}

/** Two shelves: the calibration prints first, then the useful ones. */
export function exampleShelves (): DiscoverShelf[] {
  return [
    { id: 'examples-start', title: 'Start here: calibration prints', cards: EXAMPLES.filter(e => e.start).map(exampleCard) },
    { id: 'examples', title: 'Example prints', cards: EXAMPLES.filter(e => !e.start).map(exampleCard) }
  ]
}
