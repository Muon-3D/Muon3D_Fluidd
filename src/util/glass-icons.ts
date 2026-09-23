import AppGlassIcon from '@/components/ui/AppGlassIcon.vue'

// Fluidd icon names the glass style draws as line icons, and the Lucide
// drawing for each (src/util/glass-icon-nodes.ts). They are the icons of the
// chrome, the card headers and the common actions; the rest stay Material.
export const glassIconNames: Record<string, string> = {
  dash: 'layout-grid',
  files: 'folder',
  cubeScan: 'box',
  console: 'square-terminal',
  history: 'history',
  video: 'clapperboard',
  tune: 'sliders-horizontal',
  codeJson: 'braces',
  chart: 'activity',
  wifi: 'wifi',
  desktopTower: 'server',
  cog: 'settings',
  printer3d: 'printer',
  printer3dNozzle: 'move',
  dots: 'ellipsis',
  menu: 'ellipsis',
  bell: 'bell',
  account: 'circle-user-round',
  estop: 'octagon-alert',
  powerOn: 'power',
  powerOff: 'power-off',
  progressUpload: 'upload',
  save: 'save',
  fire: 'flame',
  thermometer: 'thermometer',
  sensors: 'thermometer',
  fan: 'fan',
  motion: 'fan',
  bedMesh: 'grid-3x3',
  expandHorizontal: 'move-horizontal',
  limits: 'gauge',
  camera: 'camera',
  jobQueue: 'list-ordered',
  fileCode: 'file-code',
  accessPoint: 'radio-tower',
  retract: 'arrow-down-up',
  harddisk: 'hard-drive',
  chip: 'cpu',
  filament: 'disc-3',
  info: 'info',
  home: 'house',
  magnify: 'search',
  close: 'x',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  error: 'hand',
  warning: 'triangle-alert',
  pause: 'pause',
  resume: 'play',
  play: 'play',
  stop: 'square',
  cancelled: 'ban',
  refresh: 'refresh-cw',
  restart: 'rotate-ccw',
  reprint: 'repeat',
  download: 'download',
  fileUpload: 'upload',
  plus: 'plus',
  delete: 'trash-2',
  pencil: 'pencil',
  filter: 'funnel',
  up: 'arrow-up',
  down: 'arrow-down',
  tools: 'wrench',
  host: 'server',
  power: 'power',
  help: 'circle-help',
  reset: 'rotate-ccw',
  listStatus: 'list-x',
  accessPointOff: 'radio-tower-off',
  // The toolbar's Wi-Fi indicator. The Wi-Fi list's secured networks use
  // -lock variants, which have no line equivalent and stay Material.
  'wifi-strength-4': 'wifi',
  'wifi-strength-3': 'wifi-high',
  'wifi-strength-2': 'wifi-low',
  'wifi-strength-1': 'wifi-zero',
  'wifi-strength-off': 'wifi-off'
}

const flatIcons: Record<string, unknown> = {}

// Swaps Vuetify's icon for each name above between the Material path and the
// line icon. Vuetify's icon map is reactive, so every icon on screen follows.
export const applyGlassIcons = (values: Record<string, unknown>, glass: boolean) => {
  for (const [key, name] of Object.entries(glassIconNames)) {
    if (!(key in values)) continue

    if (!(key in flatIcons)) flatIcons[key] = values[key]

    values[key] = glass
      ? { component: AppGlassIcon, props: { name } }
      : flatIcons[key]
  }
}
