import type { EditorTextSize, SaveAndRestart } from '@/services/settings/editor'
import type { ConsoleConfig } from '@/services/console/settings'
import type { AppTablePartialHeader } from '@/types/tableheaders'
import type { FileFilterType } from '../files/types'

export interface ConfigState {
  [key: string]: any;
  apiUrl: string;
  socketUrl: string;
  authKey: string;
  discovered: boolean;
  containerColumnCount: number;
  instances: InstanceConfig[];
  lanInstances: InstanceConfig[];
  uiSettings: UiSettings;
  hostConfig: HostConfig;
  /** Whose personal settings apply (quickCommandsKey of the signed-in account), once known. */
  personalKey: string | null;
  /** The printer-wide values of the personal settings, as loaded, under anyone's own. */
  sharedPersonal: PersonalSettings | null;
}

export interface UiSettings {
  general: GeneralConfig;
  theme: ThemeConfig;
  editor: EditorConfig;
  dashboard: DashboardConfig;
  tableHeaders: AppTableConfiguredHeaders;
  gcodePreview: GcodePreviewConfig;
  fileSystem: FileSystemConfig;
  toolhead: ToolheadConfig;
  spoolman: SpoolmanConfig;
  maintenance: MaintenanceConfig;
  overview: OverviewConfig;
  console: ConsoleConfig;
  /** Each person's Control layout on this printer, the same shape as Overview's. */
  control: OverviewConfig;
  /** Each person's own Look and Ask before on this printer, by quickCommandsKey(account). */
  personal: Record<string, PersonalSettings>;
}

/** Each person's Overview layout on this printer, by key (see services/overview/layout), as saved by Edit mode. */
export interface OverviewConfig {
  layouts: Record<string, unknown>;
}

/** When each of Maintenance's checks last ran from Fluidd, in ms, by check (bedMesh, shaper, ...). */
export interface MaintenanceConfig {
  lastRun: Record<string, number>;
}

export interface ToolheadConfig {
  forceMove: boolean;
  extrudeSpeed: number;
  extrudeLength: number;
}

export interface SpoolmanConfig {
  autoSpoolSelectionDialog: boolean;
  autoOpenQRDetectionCamera: string | null;
  autoSelectSpoolOnMatch: boolean;
  preferDeviceCamera: boolean;
  warnOnNotEnoughFilament: boolean;
  warnOnFilamentTypeMismatch: boolean;
  selectionDialogSortOrder: {
    key: string | null;
    desc: boolean | null;
  },
  remainingFilamentUnit: 'weight' | 'length'
}

export interface HostConfig {
  endpoints: string[];
  blacklist: string[];
  hosted: boolean;
  themePresets: ThemePreset[];
}

export interface SupportedLocale {
  name: string;
  code: string;
}

export interface GeneralConfig {
  instanceName: string;
  locale: string;
  chartVisible: boolean;
  hideTempWaits: boolean;
  axis: Axis;
  defaultExtrudeLength: number;
  defaultExtrudeSpeed: number;
  defaultToolheadMoveLength: number;
  defaultToolheadXYSpeed: number;
  defaultToolheadZSpeed: number;
  toolheadControlStyle: ToolheadControlStyle;
  toolheadMoveDistances: number[];
  toolheadXYMoveDistances: number[];
  toolheadZMoveDistances: number[];
  toolheadCircleXYMoveDistances: number[];
  toolheadCircleZMoveDistances: number[];
  toolheadCircleXYHomingEnabled: boolean;
  useGcodeCoords: boolean;
  zAdjustDistances: number[];
  enableVersionNotifications: boolean;
  confirmOnEstop: boolean;
  confirmOnPowerDeviceChange: boolean;
  confirmOnSaveConfigAndRestart: boolean;
  sectionsToIgnorePendingConfigurationChanges: string[];
  dateFormat: string;
  timeFormat: string;
  enableKeyboardShortcuts: boolean;
  textSortOrder: TextSortOrder;
  showRateOfChange: boolean;
  showRelativeHumidity: boolean;
  showBarometricPressure: boolean;
  showGasResistance: boolean;
  showSaveConfigAndRestart: boolean;
  showUploadAndPrint: boolean;
  flipConsoleLayout: boolean;
  cameraFullscreenAction: CameraFullscreenAction;
  /** Camera uids in the order they are listed and switched through; cameras not named go last, by name. */
  cameraOrder: string[];
  topNavPowerToggle: null | string;
  showManualProbeDialogAutomatically: boolean;
  showBedScrewsAdjustDialogAutomatically: boolean;
  showScrewsTiltAdjustDialogAutomatically: boolean;
  forceMoveToggleWarning: boolean;
  printInProgressLayout: PrintInProgressLayout;
  printProgressCalculation: PrintProgressCalculation[];
  printEtaCalculation: PrintEtaCalculation[];
  enableDiagnostics: boolean;
  /** Overview shows a 3D view / Camera switch when a camera is configured. */
  overviewCameraToggle: boolean;
  thumbnailSize: number;
  colorPickerValueRange: ColorPickerValueRange;
  /** The material loaded, for a printer without [save_variables] (the M1 keeps it there as muon_material). */
  loadedMaterial: string | null;
  /** Its colour, "#RRGGBB", likewise (the M1 keeps it as muon_material_color). */
  loadedMaterialColour: string | null;
  /** Material picker favorites; null uses the common-material defaults, [] deliberately pins none. */
  pinnedMaterials: string[] | null;
}

export type ToolheadControlStyle = 'cross' | 'bars' | 'circle'

export type TextSortOrder = 'default' | 'numeric-prefix' | 'version'

export type CameraFullscreenAction = 'embed' | 'rawstream';

export type PrintInProgressLayout = 'default' | 'compact'

export type ColorPickerValueRange = 'absolute' | 'percentage'

export type PrintProgressCalculation = 'file' | 'fileAbsolute' | 'slicer' | 'filament' | 'layers'

export type PrintEtaCalculation = 'file' | 'slicer'

// Glass is the only interface style: neutral surfaces, system colours and a
// glass chrome (src/scss/muon3d-glass.scss). A printer that saved 'flat' (the
// retired style) is read as glass.
export type UiStyle = 'glass'

// Config stored in moonraker db
/** Dark, Light, or Auto (follows the device's prefers-color-scheme). */
export type ThemeMode = 'dark' | 'light' | 'auto'

export interface ThemeConfig {
  color: string;
  /** What is showing now; with mode 'auto', the device's choice. */
  isDark: boolean;
  /** Missing on a theme saved before Auto: isDark says which. */
  mode?: ThemeMode;
  logo: ThemeLogo;
  backgroundLogo: boolean;
  style: UiStyle;
}

/** The Look and Ask before settings someone changed for themselves on this printer. */
export interface PersonalSettings {
  theme?: Partial<Pick<ThemeConfig, 'color' | 'isDark' | 'mode'>>;
  general?: Partial<Pick<GeneralConfig, 'confirmOnEstop' | 'confirmOnSaveConfigAndRestart' | 'confirmOnPowerDeviceChange' | 'showUploadAndPrint'>>;
}

// Config defined in host
export interface ThemePreset {
  name: string;
  color: string;
  isDark: boolean;
  logo: ThemeLogo;
}

export interface ThemeLogo {
  src: string;
  dark?: string;
  light?: string;
}

export type RestoreViewState = 'never' | 'session' | 'local'

export interface EditorConfig {
  confirmDirtyEditorClose: boolean;
  autoEditExtensions: string[];
  restoreViewState: RestoreViewState,
  codeLens: boolean;
  /** What Save and restart does in the editor (KAN-1994). */
  saveAndRestart: SaveAndRestart;
  /** The editor's text size (KAN-1995). */
  textSize: EditorTextSize;
}

export interface Axis {
  [key: string]: AxisConfig;
}

export interface AxisConfig {
  inverted: boolean;
}

export interface DashboardConfig {
  tempPresets: TemperaturePreset[];
}

export interface SaveByPath {
  path: string;
  value: string | boolean | number;
  server?: boolean;
}

export interface InitConfig {
  apiConfig: ApiConfig | InstanceConfig;
  hostConfig?: HostConfig;
  apiConnected?: boolean;
  apiAuthenticated?: boolean;
}

export interface ApiConfig {
  apiUrl: string;
  socketUrl: string;
  authKey?: string;
}

// Saved to localstorage.
export interface InstanceConfig extends ApiConfig {
  name: string;
  active: boolean;
  discovered?: boolean;
  /**
   * The printer's Iroh EndpointId, from `/server/muon/identity` (KAN-403).
   * It names the printer, not the address, so a saved printer that moves to
   * a new address, or is also in the account, still lists once.
   */
  endpointId?: string;
  /**
   * The printer's own `.local` name, kept so a page that may not reach IPv4
   * addresses can still find a printer saved by IP (see `pageBlocksLanIpv4`).
   */
  mdnsHost?: string;
}

export interface TemperaturePreset {
  id: number;
  name: string;
  values: TemperaturePresetValues;
  gcode?: string;
  /** default: one of the four every printer has; library: copied from the library; own: made or changed here. */
  origin?: 'default' | 'library' | 'own';
  libraryId?: string;
  /** Where the numbers came from, e.g. "Polymaker PolyLite PLA". */
  source?: string;
  type?: string;
  colour?: string;
  /** Part-cooling fan, 0-100 %. */
  partFan?: number;
  /** The maker's published [min, max] ranges, in °C. */
  maker?: { nozzle?: [number, number], bed?: [number, number] };
}

export interface TemperaturePresetValues {
  [key: string]: TemperaturePresetValue;
}

export interface TemperaturePresetValue {
  value: number;
  type: 'fan' | 'heater';
  active: boolean;
}

export interface AppTableConfiguredHeaders {
  [root: string]: AppTablePartialHeader[];
}

export interface GcodePreviewConfig {
  extrusionLineWidth: number;
  moveLineWidth: number;
  retractionIconSize: number;
  drawOrigin: boolean;
  drawBackground: boolean;
  /** Retired: animations are now this device's (m1-3d/device-settings); a saved `false` is carried over once. */
  showAnimations: boolean;
  minLayerHeight: number;
  autoLoadOnPrintStart: boolean;
  autoLoadMobileOnPrintStart: boolean;
  autoFollowOnFileLoad: boolean;
  hideSinglePartBoundingBox: boolean;
  autoZoom: boolean;
  /** What a preview starts out showing: travel moves and retractions (each file's Show menu can change it). */
  showMoves: boolean;
  showRetractions: boolean;
  flip: {
    horizontal: boolean;
    vertical: boolean;
  };
}

export interface FileSystemConfig {
  activeFilters: Record<string, FileFilterType[]>;
  sortBy: Record<string, string | null>;
  sortDesc: Record<string, boolean | null>;
}
