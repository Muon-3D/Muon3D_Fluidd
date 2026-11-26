import { Globals } from "/src/globals.ts";
import { DEFAULT_UI_STYLE } from "/src/util/ui-style.ts";
import { defaultConsoleConfig } from "/src/services/console/settings.ts";
import { defaultMaterials } from "/src/store/config/default-materials.ts";
export const defaultState = () => {
  return {
    apiUrl: "",
    socketUrl: "",
    authKey: "",
    discovered: false,
    containerColumnCount: 2,
    personalKey: null,
    sharedPersonal: null,
    hostConfig: {
      endpoints: [],
      blacklist: [],
      hosted: false,
      themePresets: []
    },
    instances: [],
    lanInstances: [],
    uiSettings: {
      general: {
        instanceName: Globals.APP_NAME,
        locale: "en",
        chartVisible: true,
        hideTempWaits: true,
        axis: {
          x: { inverted: false },
          y: { inverted: false },
          z: { inverted: false }
        },
        defaultExtrudeLength: 10,
        defaultExtrudeSpeed: 5,
        defaultToolheadMoveLength: 1,
        defaultToolheadXYSpeed: 130,
        defaultToolheadZSpeed: 10,
        toolheadControlStyle: "cross",
        toolheadMoveDistances: [0.1, 1, 10, 25, 50, 100],
        toolheadXYMoveDistances: [1, 10, 50],
        toolheadZMoveDistances: [0.1, 1, 10],
        toolheadCircleXYMoveDistances: [1, 10, 25, 50],
        toolheadCircleZMoveDistances: [0.1, 1, 10, 50],
        toolheadCircleXYHomingEnabled: false,
        useGcodeCoords: false,
        zAdjustDistances: [5e-3, 0.01, 0.025, 0.05],
        enableVersionNotifications: true,
        confirmOnEstop: false,
        confirmOnPowerDeviceChange: false,
        confirmOnSaveConfigAndRestart: true,
        sectionsToIgnorePendingConfigurationChanges: [],
        dateFormat: "iso",
        timeFormat: "iso",
        enableKeyboardShortcuts: true,
        textSortOrder: "default",
        showRateOfChange: false,
        showRelativeHumidity: true,
        showBarometricPressure: true,
        showGasResistance: true,
        showSaveConfigAndRestart: true,
        showUploadAndPrint: true,
        flipConsoleLayout: false,
        cameraFullscreenAction: "embed",
        cameraOrder: [],
        topNavPowerToggle: null,
        showManualProbeDialogAutomatically: true,
        showBedScrewsAdjustDialogAutomatically: true,
        showScrewsTiltAdjustDialogAutomatically: true,
        forceMoveToggleWarning: true,
        printInProgressLayout: "default",
        printProgressCalculation: ["file"],
        printEtaCalculation: ["file"],
        enableDiagnostics: false,
        overviewCameraToggle: true,
        thumbnailSize: 32,
        colorPickerValueRange: "absolute",
        loadedMaterial: null,
        loadedMaterialColour: null,
        pinnedMaterials: null,
        quickCommands: null
      },
      theme: {
        isDark: true,
        logo: {
          src: "logo_fluidd.svg"
        },
        color: "#80D6D1",
        backgroundLogo: false,
        style: DEFAULT_UI_STYLE
      },
      editor: {
        confirmDirtyEditorClose: true,
        autoEditExtensions: [".cfg", ".conf", ".ini", ".log", ".sh", ".txt"],
        restoreViewState: "session",
        codeLens: true,
        saveAndRestart: "ask",
        textSize: "normal"
      },
      dashboard: {
        tempPresets: defaultMaterials()
      },
      tableHeaders: {
        gcodes_dashboard: [
          { value: "first_layer_extr_temp", visible: false },
          { value: "first_layer_bed_temp", visible: false },
          { value: "chamber_temp", visible: false },
          { value: "history.total_duration", visible: false },
          { value: "history.print_duration", visible: false },
          { value: "estimated_time", visible: false },
          { value: "nozzle_diameter", visible: false },
          { value: "slicer_version", visible: false },
          { value: "slicer", visible: false },
          { value: "history.filament_used", visible: false },
          { value: "filament_name", visible: false },
          { value: "filament_type", visible: false },
          { value: "filament_total", visible: false },
          { value: "filament_weight_total", visible: false },
          { value: "object_height", visible: false },
          { value: "first_layer_height", visible: false },
          { value: "layer_height", visible: false }
        ],
        gcodes_jobs: [
          { value: "first_layer_height", visible: false },
          { value: "history.filament_used", visible: false },
          { value: "slicer_version", visible: false },
          { value: "history.print_duration", visible: false },
          { value: "chamber_temp", visible: false },
          { value: "first_layer_extr_temp", visible: false },
          { value: "first_layer_bed_temp", visible: false }
        ],
        history: [
          { value: "print_duration", visible: false },
          { value: "filament_used", visible: false }
        ],
        job_queue: [
          { value: "time_added", visible: true },
          { value: "time_in_queue", visible: false }
        ],
        spoolman: []
      },
      gcodePreview: {
        extrusionLineWidth: 0.3,
        moveLineWidth: 0.1,
        retractionIconSize: 0.6,
        drawOrigin: true,
        drawBackground: true,
        showAnimations: true,
        minLayerHeight: 0.1,
        autoLoadOnPrintStart: false,
        autoLoadMobileOnPrintStart: false,
        autoFollowOnFileLoad: true,
        hideSinglePartBoundingBox: false,
        autoZoom: false,
        showMoves: true,
        showRetractions: true,
        flip: {
          horizontal: false,
          vertical: true
        }
      },
      fileSystem: {
        showHiddenFiles: false,
        activeFilters: {},
        sortBy: {},
        sortDesc: {}
      },
      toolhead: {
        forceMove: false,
        extrudeSpeed: -1,
        extrudeLength: -1
      },
      spoolman: {
        autoSpoolSelectionDialog: true,
        autoOpenQRDetectionCamera: null,
        autoSelectSpoolOnMatch: false,
        preferDeviceCamera: false,
        warnOnNotEnoughFilament: true,
        warnOnFilamentTypeMismatch: true,
        selectionDialogSortOrder: {
          key: "last_used",
          desc: false
        },
        remainingFilamentUnit: "weight"
      },
      maintenance: {
        lastRun: {}
      },
      overview: {
        layouts: {}
      },
      control: {
        layouts: {}
      },
      personal: {},
      console: defaultConsoleConfig()
    }
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29uZmlnU3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB7IERFRkFVTFRfVUlfU1RZTEUgfSBmcm9tICdAL3V0aWwvdWktc3R5bGUnXG5pbXBvcnQgeyBkZWZhdWx0Q29uc29sZUNvbmZpZyB9IGZyb20gJ0Avc2VydmljZXMvY29uc29sZS9zZXR0aW5ncydcbmltcG9ydCB7IGRlZmF1bHRNYXRlcmlhbHMgfSBmcm9tICcuL2RlZmF1bHQtbWF0ZXJpYWxzJ1xuXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0YXRlID0gKCk6IENvbmZpZ1N0YXRlID0+IHtcbiAgcmV0dXJuIHtcbiAgICBhcGlVcmw6ICcnLFxuICAgIHNvY2tldFVybDogJycsXG4gICAgYXV0aEtleTogJycsXG4gICAgZGlzY292ZXJlZDogZmFsc2UsXG4gICAgY29udGFpbmVyQ29sdW1uQ291bnQ6IDIsXG4gICAgcGVyc29uYWxLZXk6IG51bGwsXG4gICAgc2hhcmVkUGVyc29uYWw6IG51bGwsXG4gICAgaG9zdENvbmZpZzoge1xuICAgICAgZW5kcG9pbnRzOiBbXSxcbiAgICAgIGJsYWNrbGlzdDogW10sXG4gICAgICBob3N0ZWQ6IGZhbHNlLFxuICAgICAgdGhlbWVQcmVzZXRzOiBbXVxuICAgIH0sXG4gICAgaW5zdGFuY2VzOiBbXSxcbiAgICBsYW5JbnN0YW5jZXM6IFtdLFxuICAgIHVpU2V0dGluZ3M6IHtcbiAgICAgIGdlbmVyYWw6IHtcbiAgICAgICAgaW5zdGFuY2VOYW1lOiBHbG9iYWxzLkFQUF9OQU1FLFxuICAgICAgICBsb2NhbGU6ICdlbicsXG4gICAgICAgIGNoYXJ0VmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgaGlkZVRlbXBXYWl0czogdHJ1ZSxcbiAgICAgICAgYXhpczoge1xuICAgICAgICAgIHg6IHsgaW52ZXJ0ZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgeTogeyBpbnZlcnRlZDogZmFsc2UgfSxcbiAgICAgICAgICB6OiB7IGludmVydGVkOiBmYWxzZSB9XG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHRFeHRydWRlTGVuZ3RoOiAxMCxcbiAgICAgICAgZGVmYXVsdEV4dHJ1ZGVTcGVlZDogNSxcbiAgICAgICAgZGVmYXVsdFRvb2xoZWFkTW92ZUxlbmd0aDogMS4wLFxuICAgICAgICBkZWZhdWx0VG9vbGhlYWRYWVNwZWVkOiAxMzAsXG4gICAgICAgIGRlZmF1bHRUb29saGVhZFpTcGVlZDogMTAsXG4gICAgICAgIHRvb2xoZWFkQ29udHJvbFN0eWxlOiAnY3Jvc3MnLFxuICAgICAgICB0b29saGVhZE1vdmVEaXN0YW5jZXM6IFswLjEsIDEsIDEwLCAyNSwgNTAsIDEwMF0sXG4gICAgICAgIHRvb2xoZWFkWFlNb3ZlRGlzdGFuY2VzOiBbMSwgMTAsIDUwXSxcbiAgICAgICAgdG9vbGhlYWRaTW92ZURpc3RhbmNlczogWzAuMSwgMSwgMTBdLFxuICAgICAgICB0b29saGVhZENpcmNsZVhZTW92ZURpc3RhbmNlczogWzEsIDEwLCAyNSwgNTBdLFxuICAgICAgICB0b29saGVhZENpcmNsZVpNb3ZlRGlzdGFuY2VzOiBbMC4xLCAxLCAxMCwgNTBdLFxuICAgICAgICB0b29saGVhZENpcmNsZVhZSG9taW5nRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIHVzZUdjb2RlQ29vcmRzOiBmYWxzZSxcbiAgICAgICAgekFkanVzdERpc3RhbmNlczogWzAuMDA1LCAwLjAxLCAwLjAyNSwgMC4wNTBdLFxuICAgICAgICBlbmFibGVWZXJzaW9uTm90aWZpY2F0aW9uczogdHJ1ZSxcbiAgICAgICAgY29uZmlybU9uRXN0b3A6IGZhbHNlLFxuICAgICAgICBjb25maXJtT25Qb3dlckRldmljZUNoYW5nZTogZmFsc2UsXG4gICAgICAgIGNvbmZpcm1PblNhdmVDb25maWdBbmRSZXN0YXJ0OiB0cnVlLFxuICAgICAgICBzZWN0aW9uc1RvSWdub3JlUGVuZGluZ0NvbmZpZ3VyYXRpb25DaGFuZ2VzOiBbXSxcbiAgICAgICAgZGF0ZUZvcm1hdDogJ2lzbycsXG4gICAgICAgIHRpbWVGb3JtYXQ6ICdpc28nLFxuICAgICAgICBlbmFibGVLZXlib2FyZFNob3J0Y3V0czogdHJ1ZSxcbiAgICAgICAgdGV4dFNvcnRPcmRlcjogJ2RlZmF1bHQnLFxuICAgICAgICBzaG93UmF0ZU9mQ2hhbmdlOiBmYWxzZSxcbiAgICAgICAgc2hvd1JlbGF0aXZlSHVtaWRpdHk6IHRydWUsXG4gICAgICAgIHNob3dCYXJvbWV0cmljUHJlc3N1cmU6IHRydWUsXG4gICAgICAgIHNob3dHYXNSZXNpc3RhbmNlOiB0cnVlLFxuICAgICAgICBzaG93U2F2ZUNvbmZpZ0FuZFJlc3RhcnQ6IHRydWUsXG4gICAgICAgIHNob3dVcGxvYWRBbmRQcmludDogdHJ1ZSxcbiAgICAgICAgZmxpcENvbnNvbGVMYXlvdXQ6IGZhbHNlLFxuICAgICAgICBjYW1lcmFGdWxsc2NyZWVuQWN0aW9uOiAnZW1iZWQnLFxuICAgICAgICBjYW1lcmFPcmRlcjogW10sXG4gICAgICAgIHRvcE5hdlBvd2VyVG9nZ2xlOiBudWxsLFxuICAgICAgICBzaG93TWFudWFsUHJvYmVEaWFsb2dBdXRvbWF0aWNhbGx5OiB0cnVlLFxuICAgICAgICBzaG93QmVkU2NyZXdzQWRqdXN0RGlhbG9nQXV0b21hdGljYWxseTogdHJ1ZSxcbiAgICAgICAgc2hvd1NjcmV3c1RpbHRBZGp1c3REaWFsb2dBdXRvbWF0aWNhbGx5OiB0cnVlLFxuICAgICAgICBmb3JjZU1vdmVUb2dnbGVXYXJuaW5nOiB0cnVlLFxuICAgICAgICBwcmludEluUHJvZ3Jlc3NMYXlvdXQ6ICdkZWZhdWx0JyxcbiAgICAgICAgcHJpbnRQcm9ncmVzc0NhbGN1bGF0aW9uOiBbJ2ZpbGUnXSxcbiAgICAgICAgcHJpbnRFdGFDYWxjdWxhdGlvbjogWydmaWxlJ10sXG4gICAgICAgIGVuYWJsZURpYWdub3N0aWNzOiBmYWxzZSxcbiAgICAgICAgb3ZlcnZpZXdDYW1lcmFUb2dnbGU6IHRydWUsXG4gICAgICAgIHRodW1ibmFpbFNpemU6IDMyLFxuICAgICAgICBjb2xvclBpY2tlclZhbHVlUmFuZ2U6ICdhYnNvbHV0ZScsXG4gICAgICAgIGxvYWRlZE1hdGVyaWFsOiBudWxsLFxuICAgICAgICBsb2FkZWRNYXRlcmlhbENvbG91cjogbnVsbCxcbiAgICAgICAgcGlubmVkTWF0ZXJpYWxzOiBudWxsLFxuICAgICAgICBxdWlja0NvbW1hbmRzOiBudWxsXG4gICAgICB9LFxuICAgICAgdGhlbWU6IHtcbiAgICAgICAgaXNEYXJrOiB0cnVlLFxuICAgICAgICBsb2dvOiB7XG4gICAgICAgICAgc3JjOiAnbG9nb19mbHVpZGQuc3ZnJ1xuICAgICAgICB9LFxuICAgICAgICBjb2xvcjogJyM4MEQ2RDEnLFxuICAgICAgICBiYWNrZ3JvdW5kTG9nbzogZmFsc2UsXG4gICAgICAgIHN0eWxlOiBERUZBVUxUX1VJX1NUWUxFXG4gICAgICB9LFxuICAgICAgZWRpdG9yOiB7XG4gICAgICAgIGNvbmZpcm1EaXJ0eUVkaXRvckNsb3NlOiB0cnVlLFxuICAgICAgICBhdXRvRWRpdEV4dGVuc2lvbnM6IFsnLmNmZycsICcuY29uZicsICcuaW5pJywgJy5sb2cnLCAnLnNoJywgJy50eHQnXSxcbiAgICAgICAgcmVzdG9yZVZpZXdTdGF0ZTogJ3Nlc3Npb24nLFxuICAgICAgICBjb2RlTGVuczogdHJ1ZSxcbiAgICAgICAgc2F2ZUFuZFJlc3RhcnQ6ICdhc2snLFxuICAgICAgICB0ZXh0U2l6ZTogJ25vcm1hbCdcbiAgICAgIH0sXG4gICAgICBkYXNoYm9hcmQ6IHtcbiAgICAgICAgdGVtcFByZXNldHM6IGRlZmF1bHRNYXRlcmlhbHMoKVxuICAgICAgfSxcbiAgICAgIHRhYmxlSGVhZGVyczoge1xuICAgICAgICBnY29kZXNfZGFzaGJvYXJkOiBbXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpcnN0X2xheWVyX2V4dHJfdGVtcCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpcnN0X2xheWVyX2JlZF90ZW1wJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnY2hhbWJlcl90ZW1wJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnaGlzdG9yeS50b3RhbF9kdXJhdGlvbicsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2hpc3RvcnkucHJpbnRfZHVyYXRpb24nLCB2aXNpYmxlOiBmYWxzZSB9LFxuICAgICAgICAgIHsgdmFsdWU6ICdlc3RpbWF0ZWRfdGltZScsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ25venpsZV9kaWFtZXRlcicsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ3NsaWNlcl92ZXJzaW9uJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnc2xpY2VyJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnaGlzdG9yeS5maWxhbWVudF91c2VkJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnZmlsYW1lbnRfbmFtZScsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpbGFtZW50X3R5cGUnLCB2aXNpYmxlOiBmYWxzZSB9LFxuICAgICAgICAgIHsgdmFsdWU6ICdmaWxhbWVudF90b3RhbCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpbGFtZW50X3dlaWdodF90b3RhbCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ29iamVjdF9oZWlnaHQnLCB2aXNpYmxlOiBmYWxzZSB9LFxuICAgICAgICAgIHsgdmFsdWU6ICdmaXJzdF9sYXllcl9oZWlnaHQnLCB2aXNpYmxlOiBmYWxzZSB9LFxuICAgICAgICAgIHsgdmFsdWU6ICdsYXllcl9oZWlnaHQnLCB2aXNpYmxlOiBmYWxzZSB9XG4gICAgICAgIF0sXG4gICAgICAgIGdjb2Rlc19qb2JzOiBbXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpcnN0X2xheWVyX2hlaWdodCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2hpc3RvcnkuZmlsYW1lbnRfdXNlZCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ3NsaWNlcl92ZXJzaW9uJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnaGlzdG9yeS5wcmludF9kdXJhdGlvbicsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2NoYW1iZXJfdGVtcCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpcnN0X2xheWVyX2V4dHJfdGVtcCcsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ2ZpcnN0X2xheWVyX2JlZF90ZW1wJywgdmlzaWJsZTogZmFsc2UgfVxuICAgICAgICBdLFxuICAgICAgICBoaXN0b3J5OiBbXG4gICAgICAgICAgeyB2YWx1ZTogJ3ByaW50X2R1cmF0aW9uJywgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICB7IHZhbHVlOiAnZmlsYW1lbnRfdXNlZCcsIHZpc2libGU6IGZhbHNlIH1cbiAgICAgICAgXSxcbiAgICAgICAgam9iX3F1ZXVlOiBbXG4gICAgICAgICAgeyB2YWx1ZTogJ3RpbWVfYWRkZWQnLCB2aXNpYmxlOiB0cnVlIH0sXG4gICAgICAgICAgeyB2YWx1ZTogJ3RpbWVfaW5fcXVldWUnLCB2aXNpYmxlOiBmYWxzZSB9XG4gICAgICAgIF0sXG4gICAgICAgIHNwb29sbWFuOiBbXVxuICAgICAgfSxcbiAgICAgIGdjb2RlUHJldmlldzoge1xuICAgICAgICBleHRydXNpb25MaW5lV2lkdGg6IDAuMyxcbiAgICAgICAgbW92ZUxpbmVXaWR0aDogMC4xLFxuICAgICAgICByZXRyYWN0aW9uSWNvblNpemU6IDAuNixcbiAgICAgICAgZHJhd09yaWdpbjogdHJ1ZSxcbiAgICAgICAgZHJhd0JhY2tncm91bmQ6IHRydWUsXG4gICAgICAgIHNob3dBbmltYXRpb25zOiB0cnVlLFxuICAgICAgICBtaW5MYXllckhlaWdodDogMC4xLFxuICAgICAgICBhdXRvTG9hZE9uUHJpbnRTdGFydDogZmFsc2UsXG4gICAgICAgIGF1dG9Mb2FkTW9iaWxlT25QcmludFN0YXJ0OiBmYWxzZSxcbiAgICAgICAgYXV0b0ZvbGxvd09uRmlsZUxvYWQ6IHRydWUsXG4gICAgICAgIGhpZGVTaW5nbGVQYXJ0Qm91bmRpbmdCb3g6IGZhbHNlLFxuICAgICAgICBhdXRvWm9vbTogZmFsc2UsXG4gICAgICAgIHNob3dNb3ZlczogdHJ1ZSxcbiAgICAgICAgc2hvd1JldHJhY3Rpb25zOiB0cnVlLFxuICAgICAgICBmbGlwOiB7XG4gICAgICAgICAgaG9yaXpvbnRhbDogZmFsc2UsXG4gICAgICAgICAgdmVydGljYWw6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZpbGVTeXN0ZW06IHtcbiAgICAgICAgc2hvd0hpZGRlbkZpbGVzOiBmYWxzZSxcbiAgICAgICAgYWN0aXZlRmlsdGVyczoge30sXG4gICAgICAgIHNvcnRCeToge30sXG4gICAgICAgIHNvcnREZXNjOiB7fVxuICAgICAgfSxcbiAgICAgIHRvb2xoZWFkOiB7XG4gICAgICAgIGZvcmNlTW92ZTogZmFsc2UsXG4gICAgICAgIGV4dHJ1ZGVTcGVlZDogLTEsXG4gICAgICAgIGV4dHJ1ZGVMZW5ndGg6IC0xXG4gICAgICB9LFxuICAgICAgc3Bvb2xtYW46IHtcbiAgICAgICAgYXV0b1Nwb29sU2VsZWN0aW9uRGlhbG9nOiB0cnVlLFxuICAgICAgICBhdXRvT3BlblFSRGV0ZWN0aW9uQ2FtZXJhOiBudWxsLFxuICAgICAgICBhdXRvU2VsZWN0U3Bvb2xPbk1hdGNoOiBmYWxzZSxcbiAgICAgICAgcHJlZmVyRGV2aWNlQ2FtZXJhOiBmYWxzZSxcbiAgICAgICAgd2Fybk9uTm90RW5vdWdoRmlsYW1lbnQ6IHRydWUsXG4gICAgICAgIHdhcm5PbkZpbGFtZW50VHlwZU1pc21hdGNoOiB0cnVlLFxuICAgICAgICBzZWxlY3Rpb25EaWFsb2dTb3J0T3JkZXI6IHtcbiAgICAgICAgICBrZXk6ICdsYXN0X3VzZWQnLFxuICAgICAgICAgIGRlc2M6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHJlbWFpbmluZ0ZpbGFtZW50VW5pdDogJ3dlaWdodCdcbiAgICAgIH0sXG4gICAgICBtYWludGVuYW5jZToge1xuICAgICAgICBsYXN0UnVuOiB7fVxuICAgICAgfSxcbiAgICAgIG92ZXJ2aWV3OiB7XG4gICAgICAgIGxheW91dHM6IHt9XG4gICAgICB9LFxuICAgICAgY29udHJvbDoge1xuICAgICAgICBsYXlvdXRzOiB7fVxuICAgICAgfSxcbiAgICAgIHBlcnNvbmFsOiB7fSxcbiAgICAgIGNvbnNvbGU6IGRlZmF1bHRDb25zb2xlQ29uZmlnKClcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0YXRlID0gZGVmYXVsdFN0YXRlKClcbiJdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsd0JBQXdCO0FBRTFCLGFBQU0sZUFBZSxNQUFtQjtBQUM3QyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixzQkFBc0I7QUFBQSxJQUN0QixhQUFhO0FBQUEsSUFDYixnQkFBZ0I7QUFBQSxJQUNoQixZQUFZO0FBQUEsTUFDVixXQUFXLENBQUM7QUFBQSxNQUNaLFdBQVcsQ0FBQztBQUFBLE1BQ1osUUFBUTtBQUFBLE1BQ1IsY0FBYyxDQUFDO0FBQUEsSUFDakI7QUFBQSxJQUNBLFdBQVcsQ0FBQztBQUFBLElBQ1osY0FBYyxDQUFDO0FBQUEsSUFDZixZQUFZO0FBQUEsTUFDVixTQUFT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