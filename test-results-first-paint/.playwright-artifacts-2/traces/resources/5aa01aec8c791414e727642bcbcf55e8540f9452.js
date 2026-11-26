import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { get } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
import getKlipperType from "/src/util/get-klipper-type.ts";
import i18n from "/src/plugins/i18n.ts";
import { Globals } from "/src/globals.ts";
import isKeyOf from "/src/util/is-key-of.ts";
export const getters = {
  /**
   * Indicates if klippy is connected or not.
   */
  getKlippyReady: (state, getters2, rootState, rootGetters) => {
    const serverInfo = rootGetters["server/getInfo"];
    return serverInfo.klippy_state === "ready" && serverInfo.klippy_connected;
  },
  getKlippyConnected: (state, getters2, rootState, rootGetters) => {
    const serverInfo = rootGetters["server/getInfo"];
    return serverInfo.klippy_connected;
  },
  getKlippyState: (state, getters2, rootState, rootGetters) => {
    const serverInfo = rootGetters["server/getInfo"];
    return Vue.$filters.capitalize(serverInfo.klippy_state || "");
  },
  getKlippyStateMessage: (state, getters2, rootState, rootGetters) => {
    const serverInfo = rootGetters["server/getInfo"];
    if (serverInfo.klippy_connected === false) {
      return "Klippy not connected.";
    }
    if (state.printer.info.state_message && state.printer.info.state_message !== "") {
      return state.printer.info.state_message.trim().replace(/\r\n|\r|\n/g, "<br />");
    }
    if (state.printer.webhooks.state_message && state.printer.webhooks.state_message !== "") {
      return state.printer.webhooks.state_message.trim().replace(/\r\n|\r|\n/g, "<br />");
    }
    return "Unknown";
  },
  getKlippyApp: (state) => {
    const app = state.printer.info.app?.toLowerCase();
    const klippyApp = isKeyOf(app, Globals.SUPPORTED_SERVICES.klipper) ? app : "klipper";
    return {
      name: klippyApp,
      ...Globals.SUPPORTED_SERVICES.klipper[klippyApp]
    };
  },
  /**
   * Returns a string value indicating the state of the printer.
   */
  getPrinterState: (state) => {
    const state1 = state.printer.idle_timeout.state;
    const state2 = state.printer.print_stats.state;
    if (state1 && state2) {
      if (state2.toLowerCase() === "paused" || state2.toLowerCase() === "cancelled") {
        return state2.toLowerCase();
      }
      if (state1.toLowerCase() === "printing" && state2.toLowerCase() !== "printing") {
        return "busy";
      }
      return state1.toLowerCase();
    } else {
      return "loading";
    }
  },
  getFileRelativePrintProgress: (state) => {
    const { gcode_start_byte, gcode_end_byte, path, filename } = state.printer.current_file ?? {};
    const { file_position, progress } = state.printer.virtual_sdcard ?? {};
    const fullFilename = path ? `${path}/${filename}` : filename;
    if (gcode_start_byte && gcode_end_byte && file_position && fullFilename === state.printer.print_stats.filename) {
      if (file_position <= gcode_start_byte) return 0;
      if (file_position >= gcode_end_byte) return 1;
      const currentPosition = file_position - gcode_start_byte;
      const endPosition = gcode_end_byte - gcode_start_byte;
      if (currentPosition > 0 && endPosition > 0) return currentPosition / endPosition;
    }
    return progress || 0;
  },
  getFileAbsolutePrintProgress: (state) => {
    return state.printer.virtual_sdcard?.progress || 0;
  },
  getSlicerPrintProgress: (state) => {
    return state.printer.display_status.progress || 0;
  },
  getFilamentPrintProgress: (state) => {
    const { filament_used, filename: statsFilename } = state.printer.print_stats ?? {};
    const { filament_total, path, filename } = state.printer.current_file ?? {};
    const fullFilename = path ? `${path}/${filename}` : filename;
    if (filament_used != null && filament_total && fullFilename === statsFilename) {
      return filament_used / filament_total;
    }
    return state.printer.virtual_sdcard?.progress || 0;
  },
  getPrintProgress: (state, getters2, rootState) => {
    const printProgressCalculation = rootState.config.uiSettings.general.printProgressCalculation;
    const printProgressCalculationResults = printProgressCalculation.map((type) => {
      switch (type) {
        case "file":
          return getters2.getFileRelativePrintProgress;
        case "fileAbsolute":
          return getters2.getFileAbsolutePrintProgress;
        case "slicer":
          return getters2.getSlicerPrintProgress;
        case "filament":
          return getters2.getFilamentPrintProgress;
        case "layers":
          return getters2.getPrintLayers > 0 ? Math.min(1, Math.max(0, getters2.getPrintLayer / getters2.getPrintLayers)) : 0;
        default:
          return 0;
      }
    }).filter((result) => result > 0);
    const printProgress = printProgressCalculationResults.reduce((a, b) => a + b, 0) / printProgressCalculationResults.length || 0;
    return printProgress;
  },
  getPrintLayers: (state) => {
    const layersFromPrintStats = state.printer.print_stats.info?.total_layer;
    if (typeof layersFromPrintStats === "number") {
      return layersFromPrintStats;
    }
    const current_file = state.printer.current_file;
    if ("layer_count" in current_file) {
      return current_file.layer_count;
    } else if ("first_layer_height" in current_file && "layer_height" in current_file && "object_height" in current_file) {
      const lc = Math.ceil((current_file.object_height - current_file.first_layer_height) / current_file.layer_height + 1);
      if (lc > 0) return lc;
    }
    return 0;
  },
  getPrintLayer: (state) => {
    const layerFromPrintStats = state.printer.print_stats.info?.current_layer;
    if (typeof layerFromPrintStats === "number") {
      return layerFromPrintStats;
    }
    const current_file = state.printer.current_file;
    const duration = state.printer.print_stats.print_duration || 0;
    const pos = state.printer.gcode_move.gcode_position;
    if (current_file && duration > 0 && "first_layer_height" in current_file && "layer_height" in current_file && pos && pos.length >= 3) {
      const z = state.printer.gcode_move.gcode_position[2];
      const l = Math.ceil((z - current_file.first_layer_height) / current_file.layer_height + 1);
      if (l > 0) return l;
    }
    return 0;
  },
  getTimeEstimates: (state, getters2, rootGetters) => {
    const progress = getters2.getPrintProgress;
    const fileProgress = getters2.getFileRelativePrintProgress;
    const totalDuration = state.printer.print_stats?.total_duration ?? 0;
    const printDuration = state.printer.print_stats?.print_duration ?? 0;
    const fileLeft = printDuration > 0 && fileProgress > 0 ? printDuration / fileProgress - printDuration : 0;
    const currentFileStatus = state.printer.current_file?.history?.status;
    const currentFileTotalDuration = state.printer.current_file?.history?.total_duration;
    const actualLeft = currentFileStatus === "completed" && currentFileTotalDuration != null ? currentFileTotalDuration - printDuration : 0;
    const slicerTotal = state.printer.current_file?.estimated_time;
    const slicerLeft = slicerTotal != null && slicerTotal > 0 ? slicerTotal - printDuration : 0;
    const printEtaCalculation = rootGetters.config.uiSettings.general.printEtaCalculation;
    const printEtaCalculationResults = printEtaCalculation.map((type) => {
      switch (type) {
        case "file":
          return actualLeft > 0 ? actualLeft : fileLeft;
        case "slicer":
          return slicerLeft;
        default:
          return 0;
      }
    }).filter((result) => result > 0);
    const etaLeft = printEtaCalculationResults.reduce((a, b) => a + b, 0) / printEtaCalculationResults.length || 0;
    const eta = Date.now() + etaLeft * 1e3;
    return {
      progress: Math.floor(progress * 100),
      printDuration,
      totalDuration,
      slicerLeft,
      fileLeft,
      actualLeft,
      eta
    };
  },
  /**
   * Return system stats
   */
  getSystemStats: (state) => {
    return state.printer.system_stats;
  },
  /**
   * Return MCU's and their state
   */
  getMcus: (state) => {
    const mcus = [];
    Object.keys(state.printer).filter((key) => key.startsWith("mcu")).sort().forEach((key) => {
      mcus.push({
        name: key,
        ...state.printer[key]
      });
    });
    return mcus;
  },
  getHasExtruder: (state) => {
    return state.printer.extruder;
  },
  getHasMultipleExtruders: (state) => {
    return state.printer.extruder && state.printer.extruder1;
  },
  /**
  * Return known extruders, giving them a friendly name.
  */
  getExtruders: (state) => {
    const extruderCount = Object.keys(state.printer).filter((key) => /^extruder\d{0,2}$/.exec(key)).length;
    return [...Array(extruderCount).keys()].map((index) => ({
      key: `extruder${index === 0 ? "" : index}`,
      name: extruderCount === 1 ? "Extruder" : `Extruder ${index}`
    }));
  },
  // Return the current extruder along with its configuration.
  getActiveExtruder: (state, getters2) => {
    const name = state.printer.toolhead.extruder || "extruder";
    return getters2.getExtruderByName(name);
  },
  // Returns an extruder by name.
  getExtruderByName: (state, getters2) => (name) => {
    const e = state.printer[name] || void 0;
    const c = getters2.getPrinterSettings(name);
    if (!e || !c) return void 0;
    const { min_extrude_temp } = name === "extruder" ? c : getters2.getPrinterSettings("extruder");
    const extruder = {
      min_extrude_temp,
      config: { ...c },
      ...e
    };
    return extruder;
  },
  getExtruderSteppers: (state, getters2) => {
    const steppers = getters2.getSteppers;
    return steppers.filter((stepper) => stepper.key.startsWith("extruder_stepper "));
  },
  getSteppers: (state, getters2) => {
    const steppers = [];
    const stepperKeys = state.printer.motion_report.steppers ?? [];
    for (const item of stepperKeys) {
      const name = item.startsWith("stepper_") ? item.substring(8) : item.split(" ", 2).pop() || "";
      const e = state.printer[item];
      const c = getters2.getPrinterSettings(item);
      steppers.push({
        name,
        prettyName: Vue.$filters.prettyCase(name),
        key: item,
        enabled: state.printer.stepper_enable?.steppers[item],
        ...e,
        config: { ...c }
      });
    }
    return steppers;
  },
  getHasSteppersEnabled: (state, getters2) => {
    const steppers = getters2.getSteppers;
    return Object.values(steppers).some((stepper) => stepper.enabled == null || stepper.enabled);
  },
  /**
   * Given axes, returns a boolean indicating if the axes are homed.
   */
  getHomedAxes: (state) => (axes) => {
    return axes != null && axes.length > 0 && axes.split("").every((char) => state.printer.toolhead.homed_axes.includes(char));
  },
  getRunoutSensors: (state) => {
    const supportedSensors = ["filament_switch_sensor", "filament_motion_sensor"];
    const sensors = [];
    for (const item in state.printer) {
      const [type, nameFromSplit] = item.split(" ", 2);
      if (supportedSensors.includes(type)) {
        const name = nameFromSplit ?? item;
        const sensor = get(state.printer, item, void 0);
        sensors.push({
          name,
          prettyName: Vue.$filters.prettyCase(name),
          ...sensor
        });
      }
    }
    return sensors;
  },
  getEndstops: (state) => {
    const endstops = [];
    Object.keys(state.printer.endstops).sort().forEach((key) => {
      endstops.push({
        name: key,
        state: state.printer.endstops[key]
      });
    });
    return endstops;
  },
  getProbe: (state, getters2) => {
    const probe = state.printer.probe;
    if (probe && !probe.name) {
      const probeNames = [
        "bltouch",
        "smart_effector",
        "probe"
      ];
      for (const name of probeNames) {
        const probeSettings = getters2.getPrinterSettings(name);
        if (probeSettings?.z_offset !== void 0) {
          const probeWithName = {
            ...probe,
            name
          };
          return probeWithName;
        }
      }
    }
    return probe;
  },
  /**
   * Return available heaters
   */
  getHeaters: (state, getters2) => {
    const heaters = state.printer.heaters.available_heaters || [];
    if (heaters.length) {
      const r = [];
      heaters.forEach((e) => {
        const heater = state.printer[e];
        if (heater && Object.keys(heater).length > 0) {
          const config = getters2.getPrinterSettings(e);
          const keys = [
            "heater_generic"
          ];
          const [type, nameFromSplit] = e.split(" ", 2);
          const name = nameFromSplit && keys.includes(type) ? nameFromSplit : e;
          const color = Vue.$colorset.next(getKlipperType(e), e);
          const prettyName = Vue.$filters.prettyCase(name);
          r.push({
            ...heater,
            name,
            color,
            prettyName,
            key: e,
            minTemp: config?.min_temp,
            maxTemp: config?.max_temp
          });
        }
      });
      return r.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  },
  getAllLeds: (_, getters2) => {
    return getters2.getOutputs([
      "led",
      "neopixel",
      "dotstar"
    ]);
  },
  getAllFans: (_, getters2) => {
    return getters2.getOutputs([
      "temperature_fan",
      "controller_fan",
      "heater_fan",
      "power_fan",
      "fan_generic",
      "fan"
    ]);
  },
  /**
   * Return toolhead fans
   */
  getToolHeadFans: (_, getters2) => {
    return getters2.getOutputs([
      // 'temperature_fan',
      // 'controller_fan',
      "heater_fan",
      // 'fan_generic',
      "fan"
    ]);
  },
  getOtherFans: (_, getters2) => {
    return getters2.getOutputs([
      "temperature_fan",
      "controller_fan",
      // 'heater_fan',
      "power_fan",
      "fan_generic"
      // 'fan'
    ]);
  },
  /**
   * Return output pins
   */
  getPins: (_, getters2) => {
    const outputs = getters2.getOutputs([
      "output_pin",
      "pwm_tool",
      "pwm_cycle_time"
    ]);
    return outputs.sort((output) => output.pwm ? 1 : -1);
  },
  getPinByName: (state, getters2) => (name) => {
    const pins = getters2.getPins;
    return pins.find((pin) => pin.name === name);
  },
  /**
  * Return available fans and output pins
  */
  getOutputs: (state, getters2) => (filter) => {
    const fans = [
      "temperature_fan",
      "controller_fan",
      "heater_fan",
      "power_fan",
      "fan_generic",
      "fan"
    ];
    const outputPins = [
      "output_pin",
      "pwm_tool",
      "pwm_cycle_time"
    ];
    const leds = [
      "led",
      "neopixel",
      "dotstar"
    ];
    const controllable = [
      "fan",
      "fan_generic",
      "output_pin",
      "pwm_tool",
      "pwm_cycle_time",
      "led",
      "neopixel",
      "dotstar"
    ];
    const applyColor = [
      "temperature_fan"
    ];
    const filterByPrefix = [
      "output_pin",
      "pwm_tool",
      "pwm_cycle_time",
      "temperature_fan",
      "controller_fan",
      "heater_fan",
      "power_fan",
      "fan_generic",
      "led",
      "neopixel",
      "dotstar"
    ];
    const supportedTypes = filter && filter.length ? filter : [...fans, ...outputPins, ...leds];
    const pins = [];
    for (const pin in state.printer) {
      const [type, nameFromSplit] = pin.split(" ", 2);
      const name = nameFromSplit ?? pin;
      if (supportedTypes.includes(type) && (!filterByPrefix.includes(type) || !name.startsWith("_"))) {
        const prettyName = name === "fan" ? "Part Fan" : Vue.$filters.prettyCase(name);
        const color = applyColor.includes(type) ? Vue.$colorset.next(getKlipperType(pin), pin) : void 0;
        const config = getters2.getPrinterSettings(pin);
        let output = {
          ...state.printer[pin],
          ...getters2.getExtraSensorData(config?.sensor_type?.toLowerCase(), name),
          config: { ...config },
          name,
          prettyName,
          key: pin,
          color,
          type,
          controllable: controllable.includes(type)
        };
        if (fans.includes(type)) {
          output = {
            ...output,
            minTemp: config?.min_temp,
            maxTemp: config?.max_temp
          };
        }
        if (outputPins.includes(type)) {
          output = {
            ...output,
            pwm: config?.pwm ?? false,
            scale: config?.scale ?? 1,
            resetValue: config?.value ?? 0,
            controllable: config?.static_value ? false : controllable.includes(type)
          };
        }
        pins.push(output);
      }
    }
    return pins.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  },
  /**
   * Return available temperature probes / sensors.
   */
  getSensors: (state, getters2) => {
    const supportedSensors = [
      "temperature_sensor",
      "temperature_probe",
      "tmc2240",
      "z_thermal_adjust"
    ];
    const supportedDrivers = [
      "tmc2240"
    ];
    const sensors = Object.keys(state.printer).reduce((groups, item) => {
      const [type, nameFromSplit] = item.split(" ", 2);
      const name = nameFromSplit ?? item;
      if (supportedSensors.includes(type) && !name.startsWith("_")) {
        const prettyName = supportedDrivers.includes(type) ? i18n.t(
          "app.general.label.stepper_driver",
          {
            name: name.startsWith("stepper_") ? name.substring(8).toUpperCase() : Vue.$filters.prettyCase(name)
          }
        ) : Vue.$filters.prettyCase(name);
        const color = Vue.$colorset.next(getKlipperType(item), item);
        const config = getters2.getPrinterSettings(item);
        groups[name] = {
          ...state.printer[item],
          ...getters2.getExtraSensorData(config?.sensor_type?.toLowerCase(), name),
          config: { ...config },
          minTemp: config?.min_temp ?? null,
          maxTemp: config?.max_temp ?? null,
          name,
          key: item,
          prettyName,
          color,
          type
        };
      }
      return groups;
    }, {});
    return Object.values(sensors).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  },
  getExtraSensorData: (state) => (sensorType, name) => {
    const supportedSensors = [
      "aht10",
      "bme280",
      "htu21d",
      "nevermoresensor",
      "sht3x"
    ];
    if (supportedSensors.includes(sensorType)) {
      const sensor = state.printer[`${sensorType} ${name}`];
      if (sensor) {
        const { pressure, humidity, gas } = sensor;
        return {
          pressure,
          humidity,
          gas
        };
      }
    }
  },
  /**
   * Return a list of keys that represent something we may want
   * to chart.
   */
  getChartableSensors: (state) => {
    const keyGroups = [
      [
        "temperature_fan"
      ],
      [
        "temperature_probe",
        "z_thermal_adjust",
        "temperature_sensor"
      ],
      [
        "tmc2240"
      ]
    ];
    const printerKeys = Object.keys(state.printer);
    const sensors = keyGroups.flatMap((keyGroup) => {
      const keyGroupRegExpArray = keyGroup.map((x) => new RegExp(`^${x}(?! _)`));
      return printerKeys.filter((key) => keyGroupRegExpArray.some((x) => x.test(key))).sort((a, b) => a.localeCompare(b));
    });
    const heaters = [...state.printer.heaters.available_heaters].sort((a, b) => a.localeCompare(b));
    return [
      ...heaters,
      ...sensors
    ];
  },
  getBedScrews: (_, getters2) => {
    const config = getters2.getPrinterSettings("bed_screws");
    const screws = [];
    for (let index = 1; index <= 99; index++) {
      const key = `screw${index}`;
      const coords = config[key];
      if (!coords) {
        break;
      }
      const fine = config[`screw${index}_fine_adjust`];
      const name = config[`screw${index}_name`];
      const prettyName = Vue.$filters.prettyCase(name || i18n.t("app.general.label.screw_number", { index: index + 1 }));
      screws.push({
        key,
        name,
        prettyName,
        fine,
        x: coords[0],
        y: coords[1]
      });
    }
    return screws;
  },
  getScrewsTiltAdjust: (state, getters2) => {
    const config = getters2.getPrinterSettings("screws_tilt_adjust");
    const screws = [];
    const { results, ...rest } = state.printer.screws_tilt_adjust;
    for (let index = 1; index <= 99; index++) {
      const key = `screw${index}`;
      const result = results?.[key];
      if (!result) {
        break;
      }
      const coords = config[key];
      const name = config[`${key}_name`];
      const prettyName = Vue.$filters.prettyCase(name || i18n.t("app.general.label.screw_number", { index: index + 1 }));
      const [hours, minutes] = result.adjust.split(":").map(Number);
      const adjustMinutes = hours * 60 + minutes;
      screws.push({
        key,
        name,
        prettyName,
        ...result,
        adjustMinutes,
        x: coords[0],
        y: coords[1]
      });
    }
    return {
      ...rest,
      screws
    };
  },
  /**
   * Return a required setting from the printer.config object.
   */
  getPrinterSettings: (state) => (setting) => {
    if (state.printer && state.printer.configfile && state.printer.configfile.settings) {
      if (setting) return get(state.printer.configfile.settings, setting.toLowerCase(), void 0);
      return state.printer.configfile.settings;
    }
    return void 0;
  },
  getPrinterConfig: (state) => (config) => {
    if (state.printer && state.printer.configfile && state.printer.configfile.config) {
      if (config) return get(state.printer.configfile.config, config, void 0);
      return state.printer.configfile.config;
    }
    return void 0;
  },
  getHasWarnings: (state, getters2, rootState) => {
    if (rootState.socket && rootState.socket.open && rootState.socket.ready && (getters2.getPrinterWarnings.length > 0 || getters2.getKlipperWarnings.length > 0 || getters2.getMoonrakerFailedComponents.length > 0 || getters2.getMoonrakerWarnings.length > 0)) {
      return true;
    } else {
      return false;
    }
  },
  getPrinterWarnings: (state, getters2) => {
    const config = getters2.getPrinterConfig();
    const warnings = [];
    if (config && !("virtual_sdcard" in config)) {
      warnings.push({ message: "[virtual_sdcard] not found in printer configuration." });
    }
    if (config && !("pause_resume" in config)) {
      warnings.push({ message: "[pause_resume] not found in printer configuration." });
    }
    if (config && !("display" in config) && !("display_status" in config)) {
      warnings.push({ message: "[display_status] is required if you do not have a [display] defined." });
    }
    if (config && !("gcode_macro CANCEL_PRINT" in config)) {
      warnings.push({ message: "CANCEL_PRINT command not found in configuration." });
    }
    return warnings;
  },
  getKlipperWarnings: (state) => {
    return state.printer.configfile?.warnings || [];
  },
  getMoonrakerFailedComponents: (state, getters2, rootState, rootGetters) => {
    const serverInfo = rootGetters["server/getInfo"];
    return serverInfo.failed_components || [];
  },
  getMoonrakerWarnings: (state, getters2, rootState, rootGetters) => {
    const serverInfo = rootGetters["server/getInfo"];
    return serverInfo.warnings || [];
  },
  getSaveConfigPending: (state) => {
    const saveConfigPending = state.printer.configfile?.save_config_pending;
    return saveConfigPending || false;
  },
  getSaveConfigPendingItems: (state) => {
    const saveConfigPendingItems = state.printer.configfile?.save_config_pending_items;
    return saveConfigPendingItems || {};
  },
  getHasHomingOverride: (state, getters2) => {
    const config = getters2.getPrinterConfig();
    if (config && "homing_override" in config) {
      return true;
    } else {
      return false;
    }
  },
  getHasRoundBed: (_, getters2) => {
    const kinematics = getters2.getPrinterSettings("printer.kinematics") || "";
    return [
      "delta",
      "polar",
      "rotary_delta",
      "winch"
    ].includes(kinematics);
  },
  getBedSize: (state) => {
    const { axis_minimum, axis_maximum } = state.printer.toolhead;
    if (axis_minimum.length < 2 || axis_maximum.length < 2) {
      return void 0;
    }
    const [minX, minY] = axis_minimum;
    const [maxX, maxY] = axis_maximum;
    return {
      minX,
      minY,
      maxX,
      maxY
    };
  },
  getAvailableCommands: (state, getters2, rootState, rootGetters) => {
    const availableCommands = state.printer.gcode.commands;
    if (availableCommands) {
      return availableCommands;
    }
    const knownCommands = rootGetters["console/getAllKnownCommands"];
    return Object.entries(knownCommands).reduce((availableCommands2, [key, help]) => {
      availableCommands2[key] = { help };
      return availableCommands2;
    }, {});
  },
  getIsManualProbeActive: (state) => {
    return state.printer.manual_probe?.is_active || false;
  },
  getIsBedScrewsAdjustActive: (state) => {
    return state.printer.bed_screws?.is_active || false;
  },
  getHasScrewsTiltAdjustResults: (state) => {
    const { error, max_deviation, results } = state.printer.screws_tilt_adjust ?? {};
    return !error && max_deviation == null && results && Object.keys(results).length > 0;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgdHlwZSB7IEdldHRlclRyZWUgfSBmcm9tICd2dWV4J1xuaW1wb3J0IHR5cGUgeyBSb290U3RhdGUgfSBmcm9tICcuLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUHJpbnRlclN0YXRlLCBIZWF0ZXIsIEZhbiwgTGVkLCBPdXRwdXRQaW4sIFNlbnNvciwgUnVub3V0U2Vuc29yLCBLbm93bkV4dHJ1ZGVyLCBNQ1UsIEVuZHN0b3AsIFByb2JlLCBFeHRydWRlclN0ZXBwZXIsIEV4dHJ1ZGVyLCBFeHRydWRlckNvbmZpZywgUHJvYmVOYW1lLCBTdGVwcGVyLCBTY3Jld3NUaWx0QWRqdXN0U2NyZXcsIFNjcmV3c1RpbHRBZGp1c3QsIEJlZFNjcmV3cywgQmVkU2l6ZSwgR2NvZGVDb21tYW5kcywgVGltZUVzdGltYXRlcyB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgeyBnZXQgfSBmcm9tICdsb2Rhc2gtZXMnXG5pbXBvcnQgZ2V0S2xpcHBlclR5cGUgZnJvbSAnQC91dGlsL2dldC1rbGlwcGVyLXR5cGUnXG5pbXBvcnQgaTE4biBmcm9tICdAL3BsdWdpbnMvaTE4bidcbmltcG9ydCB0eXBlIHsgR2NvZGVIZWxwIH0gZnJvbSAnLi4vY29uc29sZS90eXBlcydcbmltcG9ydCB0eXBlIHsgU2VydmVySW5mbyB9IGZyb20gJy4uL3NlcnZlci90eXBlcydcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgaXNLZXlPZiBmcm9tICdAL3V0aWwvaXMta2V5LW9mJ1xuXG5leHBvcnQgY29uc3QgZ2V0dGVyczogR2V0dGVyVHJlZTxQcmludGVyU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBrbGlwcHkgaXMgY29ubmVjdGVkIG9yIG5vdC5cbiAgICovXG4gIGdldEtsaXBweVJlYWR5OiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpOiBib29sZWFuID0+IHtcbiAgICAvLyBWYWxpZCBzdGF0ZXMgYXJlO1xuICAgIC8vIHJlYWR5LCBzdGFydHVwLCBzaHV0ZG93biwgZXJyb3JcbiAgICBjb25zdCBzZXJ2ZXJJbmZvID0gcm9vdEdldHRlcnNbJ3NlcnZlci9nZXRJbmZvJ10gYXMgU2VydmVySW5mb1xuXG4gICAgcmV0dXJuIChcbiAgICAgIHNlcnZlckluZm8ua2xpcHB5X3N0YXRlID09PSAncmVhZHknICYmXG4gICAgICBzZXJ2ZXJJbmZvLmtsaXBweV9jb25uZWN0ZWRcbiAgICApXG4gIH0sXG5cbiAgZ2V0S2xpcHB5Q29ubmVjdGVkOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBzZXJ2ZXJJbmZvID0gcm9vdEdldHRlcnNbJ3NlcnZlci9nZXRJbmZvJ10gYXMgU2VydmVySW5mb1xuXG4gICAgcmV0dXJuIHNlcnZlckluZm8ua2xpcHB5X2Nvbm5lY3RlZFxuICB9LFxuXG4gIGdldEtsaXBweVN0YXRlOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IHNlcnZlckluZm8gPSByb290R2V0dGVyc1snc2VydmVyL2dldEluZm8nXSBhcyBTZXJ2ZXJJbmZvXG5cbiAgICByZXR1cm4gVnVlLiRmaWx0ZXJzLmNhcGl0YWxpemUoc2VydmVySW5mby5rbGlwcHlfc3RhdGUgfHwgJycpXG4gIH0sXG5cbiAgZ2V0S2xpcHB5U3RhdGVNZXNzYWdlOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpOiBzdHJpbmcgPT4ge1xuICAgIC8vIElmIHRoZXJlJ3MgYWJzb2x1dGVseSBubyBjb25uZWN0aW9uIHRvIGtsaXBwZXIsIHRoZW5cbiAgICAvLyBzYXkgc28uXG4gICAgY29uc3Qgc2VydmVySW5mbyA9IHJvb3RHZXR0ZXJzWydzZXJ2ZXIvZ2V0SW5mbyddIGFzIFNlcnZlckluZm9cbiAgICBpZiAoc2VydmVySW5mby5rbGlwcHlfY29ubmVjdGVkID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuICdLbGlwcHkgbm90IGNvbm5lY3RlZC4nXG4gICAgfVxuXG4gICAgLy8gSWYgYW4gZXh0ZXJuYWwgc291cmNlIGZpcmVzIGFuIGVzdG9wLCBvciB0aGUgY2xpZW50XG4gICAgLy8gaXMgcmVmcmVzaGVkIHdoaWxlIGtsaXBwZXIgaXMgZG93biAtIHRoZSB3ZWJob29rIGRhdGEgbWF5YmUgaW52YWxpZFxuICAgIC8vIGJ1dCB0aGUgcHJpbnRlciBpbmZvIHNob3VsZCBiZSBnb29kLlxuICAgIGlmIChcbiAgICAgIHN0YXRlLnByaW50ZXIuaW5mby5zdGF0ZV9tZXNzYWdlICYmXG4gICAgICBzdGF0ZS5wcmludGVyLmluZm8uc3RhdGVfbWVzc2FnZSAhPT0gJydcbiAgICApIHtcbiAgICAgIHJldHVybiBzdGF0ZS5wcmludGVyLmluZm8uc3RhdGVfbWVzc2FnZS50cmltKCkucmVwbGFjZSgvXFxyXFxufFxccnxcXG4vZywgJzxiciAvPicpXG4gICAgfVxuICAgIGlmIChcbiAgICAgIHN0YXRlLnByaW50ZXIud2ViaG9va3Muc3RhdGVfbWVzc2FnZSAmJlxuICAgICAgc3RhdGUucHJpbnRlci53ZWJob29rcy5zdGF0ZV9tZXNzYWdlICE9PSAnJ1xuICAgICkge1xuICAgICAgcmV0dXJuIHN0YXRlLnByaW50ZXIud2ViaG9va3Muc3RhdGVfbWVzc2FnZS50cmltKCkucmVwbGFjZSgvXFxyXFxufFxccnxcXG4vZywgJzxiciAvPicpXG4gICAgfVxuICAgIHJldHVybiAnVW5rbm93bidcbiAgfSxcblxuICBnZXRLbGlwcHlBcHA6IChzdGF0ZSkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IHN0YXRlLnByaW50ZXIuaW5mby5hcHA/LnRvTG93ZXJDYXNlKClcblxuICAgIGNvbnN0IGtsaXBweUFwcCA9IGlzS2V5T2YoYXBwLCBHbG9iYWxzLlNVUFBPUlRFRF9TRVJWSUNFUy5rbGlwcGVyKVxuICAgICAgPyBhcHBcbiAgICAgIDogJ2tsaXBwZXInXG5cbiAgICByZXR1cm4ge1xuICAgICAgbmFtZToga2xpcHB5QXBwLFxuICAgICAgLi4uR2xvYmFscy5TVVBQT1JURURfU0VSVklDRVMua2xpcHBlcltrbGlwcHlBcHBdXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHZhbHVlIGluZGljYXRpbmcgdGhlIHN0YXRlIG9mIHRoZSBwcmludGVyLlxuICAgKi9cbiAgZ2V0UHJpbnRlclN0YXRlOiAoc3RhdGUpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IHN0YXRlMSA9IHN0YXRlLnByaW50ZXIuaWRsZV90aW1lb3V0LnN0YXRlIC8vIHByaW50aW5nLCByZWFkeSwgaWRsZVxuICAgIGNvbnN0IHN0YXRlMiA9IHN0YXRlLnByaW50ZXIucHJpbnRfc3RhdHMuc3RhdGUgLy8gcHJpbnRpbmcsIHBhdXNlZCwgc3RhbmRieSwgY29tcGxldGUsIGNhbmNlbGxlZCwgZXJyb3JcbiAgICAvLyBJZiB0aGUgaWRsZSBzdGF0ZSBzYXlzIHdlJ3JlIHByaW50aW5nLCBidXQgdGhlIHByaW50X3N0YXRzIHNheSBvdGhlcndpc2UgLSB0aGVuXG4gICAgLy8gd2UncmUgcHJvYmFibHkgYnVzeSBtb3ZpbmcgdGhlIHRvb2xoZWFkIG9yIGRvaW5nIHNvbWUgb3RoZXIgcHJvY2Vzcy5cbiAgICAvLyBQb3NzaWJsZSB2YWx1ZXMgYXJlO1xuICAgIC8vIHByaW50aW5nLCBidXN5LCBwYXVzZWQsIGNhbmNlbGxlZCwgcmVhZHksIGlkbGUsIHN0YW5kYnlcbiAgICBpZiAoc3RhdGUxICYmIHN0YXRlMikge1xuICAgICAgaWYgKFxuICAgICAgICBzdGF0ZTIudG9Mb3dlckNhc2UoKSA9PT0gJ3BhdXNlZCcgfHxcbiAgICAgICAgc3RhdGUyLnRvTG93ZXJDYXNlKCkgPT09ICdjYW5jZWxsZWQnXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlMi50b0xvd2VyQ2FzZSgpXG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIHN0YXRlMS50b0xvd2VyQ2FzZSgpID09PSAncHJpbnRpbmcnICYmXG4gICAgICAgIHN0YXRlMi50b0xvd2VyQ2FzZSgpICE9PSAncHJpbnRpbmcnXG4gICAgICApIHtcbiAgICAgICAgLy8gVGhlIHByaW50ZXJzIGlkbGVfdGltZW91dCBjaGFuZ2VzIHRvIHByaW50aW5nIHdoZW4gaXQncyBidXN5IGFwcGx5aW5nXG4gICAgICAgIC8vIHNvbWUgY2hhbmdlIC0gYnV0IG5vdCBuZWNlc3NhcmlseSBwcmludGluZyBhbnl0aGluZy4gVGhpcyBzdGF0ZSBob3BlZnVsbHlcbiAgICAgICAgLy8gaGVscHMgYWxldmlhdGUgdGhhdCBjb25mdXNpb24uXG4gICAgICAgIHJldHVybiAnYnVzeSdcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdGF0ZTEudG9Mb3dlckNhc2UoKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ2xvYWRpbmcnXG4gICAgfVxuICB9LFxuXG4gIGdldEZpbGVSZWxhdGl2ZVByaW50UHJvZ3Jlc3M6IChzdGF0ZSk6IG51bWJlciA9PiB7XG4gICAgY29uc3QgeyBnY29kZV9zdGFydF9ieXRlLCBnY29kZV9lbmRfYnl0ZSwgcGF0aCwgZmlsZW5hbWUgfSA9IHN0YXRlLnByaW50ZXIuY3VycmVudF9maWxlID8/IHt9XG4gICAgY29uc3QgeyBmaWxlX3Bvc2l0aW9uLCBwcm9ncmVzcyB9ID0gc3RhdGUucHJpbnRlci52aXJ0dWFsX3NkY2FyZCA/PyB7fVxuXG4gICAgY29uc3QgZnVsbEZpbGVuYW1lID0gcGF0aCA/IGAke3BhdGh9LyR7ZmlsZW5hbWV9YCA6IGZpbGVuYW1lXG5cbiAgICBpZiAoZ2NvZGVfc3RhcnRfYnl0ZSAmJiBnY29kZV9lbmRfYnl0ZSAmJiBmaWxlX3Bvc2l0aW9uICYmIGZ1bGxGaWxlbmFtZSA9PT0gc3RhdGUucHJpbnRlci5wcmludF9zdGF0cy5maWxlbmFtZSkge1xuICAgICAgaWYgKGZpbGVfcG9zaXRpb24gPD0gZ2NvZGVfc3RhcnRfYnl0ZSkgcmV0dXJuIDBcbiAgICAgIGlmIChmaWxlX3Bvc2l0aW9uID49IGdjb2RlX2VuZF9ieXRlKSByZXR1cm4gMVxuXG4gICAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBmaWxlX3Bvc2l0aW9uIC0gZ2NvZGVfc3RhcnRfYnl0ZVxuICAgICAgY29uc3QgZW5kUG9zaXRpb24gPSBnY29kZV9lbmRfYnl0ZSAtIGdjb2RlX3N0YXJ0X2J5dGVcblxuICAgICAgaWYgKGN1cnJlbnRQb3NpdGlvbiA+IDAgJiYgZW5kUG9zaXRpb24gPiAwKSByZXR1cm4gY3VycmVudFBvc2l0aW9uIC8gZW5kUG9zaXRpb25cbiAgICB9XG5cbiAgICByZXR1cm4gcHJvZ3Jlc3MgfHwgMFxuICB9LFxuXG4gIGdldEZpbGVBYnNvbHV0ZVByaW50UHJvZ3Jlc3M6IChzdGF0ZSk6IG51bWJlciA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLnByaW50ZXIudmlydHVhbF9zZGNhcmQ/LnByb2dyZXNzIHx8IDBcbiAgfSxcblxuICBnZXRTbGljZXJQcmludFByb2dyZXNzOiAoc3RhdGUpOiBudW1iZXIgPT4ge1xuICAgIHJldHVybiBzdGF0ZS5wcmludGVyLmRpc3BsYXlfc3RhdHVzLnByb2dyZXNzIHx8IDBcbiAgfSxcblxuICBnZXRGaWxhbWVudFByaW50UHJvZ3Jlc3M6IChzdGF0ZSkgPT4ge1xuICAgIGNvbnN0IHsgZmlsYW1lbnRfdXNlZCwgZmlsZW5hbWU6IHN0YXRzRmlsZW5hbWUgfSA9IHN0YXRlLnByaW50ZXIucHJpbnRfc3RhdHMgPz8ge31cbiAgICBjb25zdCB7IGZpbGFtZW50X3RvdGFsLCBwYXRoLCBmaWxlbmFtZSB9ID0gc3RhdGUucHJpbnRlci5jdXJyZW50X2ZpbGUgPz8ge31cblxuICAgIGNvbnN0IGZ1bGxGaWxlbmFtZSA9IHBhdGggPyBgJHtwYXRofS8ke2ZpbGVuYW1lfWAgOiBmaWxlbmFtZVxuXG4gICAgaWYgKGZpbGFtZW50X3VzZWQgIT0gbnVsbCAmJiBmaWxhbWVudF90b3RhbCAmJiBmdWxsRmlsZW5hbWUgPT09IHN0YXRzRmlsZW5hbWUpIHtcbiAgICAgIHJldHVybiBmaWxhbWVudF91c2VkIC8gZmlsYW1lbnRfdG90YWxcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdGUucHJpbnRlci52aXJ0dWFsX3NkY2FyZD8ucHJvZ3Jlc3MgfHwgMFxuICB9LFxuXG4gIGdldFByaW50UHJvZ3Jlc3M6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlKTogbnVtYmVyID0+IHtcbiAgICBjb25zdCBwcmludFByb2dyZXNzQ2FsY3VsYXRpb24gPSByb290U3RhdGUuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5wcmludFByb2dyZXNzQ2FsY3VsYXRpb25cblxuICAgIGNvbnN0IHByaW50UHJvZ3Jlc3NDYWxjdWxhdGlvblJlc3VsdHMgPSBwcmludFByb2dyZXNzQ2FsY3VsYXRpb25cbiAgICAgIC5tYXAodHlwZSA9PiB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2ZpbGUnOlxuICAgICAgICAgICAgcmV0dXJuIGdldHRlcnMuZ2V0RmlsZVJlbGF0aXZlUHJpbnRQcm9ncmVzc1xuXG4gICAgICAgICAgY2FzZSAnZmlsZUFic29sdXRlJzpcbiAgICAgICAgICAgIHJldHVybiBnZXR0ZXJzLmdldEZpbGVBYnNvbHV0ZVByaW50UHJvZ3Jlc3NcblxuICAgICAgICAgIGNhc2UgJ3NsaWNlcic6XG4gICAgICAgICAgICByZXR1cm4gZ2V0dGVycy5nZXRTbGljZXJQcmludFByb2dyZXNzXG5cbiAgICAgICAgICBjYXNlICdmaWxhbWVudCc6XG4gICAgICAgICAgICByZXR1cm4gZ2V0dGVycy5nZXRGaWxhbWVudFByaW50UHJvZ3Jlc3NcblxuICAgICAgICAgIGNhc2UgJ2xheWVycyc6XG4gICAgICAgICAgICByZXR1cm4gZ2V0dGVycy5nZXRQcmludExheWVycyA+IDBcbiAgICAgICAgICAgICAgPyBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCBnZXR0ZXJzLmdldFByaW50TGF5ZXIgLyBnZXR0ZXJzLmdldFByaW50TGF5ZXJzKSlcbiAgICAgICAgICAgICAgOiAwXG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5maWx0ZXIocmVzdWx0ID0+IHJlc3VsdCA+IDApXG5cbiAgICBjb25zdCBwcmludFByb2dyZXNzID0gcHJpbnRQcm9ncmVzc0NhbGN1bGF0aW9uUmVzdWx0c1xuICAgICAgLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gcHJpbnRQcm9ncmVzc0NhbGN1bGF0aW9uUmVzdWx0cy5sZW5ndGggfHwgMFxuXG4gICAgcmV0dXJuIHByaW50UHJvZ3Jlc3NcbiAgfSxcblxuICBnZXRQcmludExheWVyczogKHN0YXRlKTogbnVtYmVyID0+IHtcbiAgICBjb25zdCBsYXllcnNGcm9tUHJpbnRTdGF0cyA9IHN0YXRlLnByaW50ZXIucHJpbnRfc3RhdHMuaW5mbz8udG90YWxfbGF5ZXJcbiAgICBpZiAodHlwZW9mIGxheWVyc0Zyb21QcmludFN0YXRzID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIGxheWVyc0Zyb21QcmludFN0YXRzXG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRfZmlsZSA9IHN0YXRlLnByaW50ZXIuY3VycmVudF9maWxlXG4gICAgaWYgKCdsYXllcl9jb3VudCcgaW4gY3VycmVudF9maWxlKSB7XG4gICAgICByZXR1cm4gY3VycmVudF9maWxlLmxheWVyX2NvdW50XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICdmaXJzdF9sYXllcl9oZWlnaHQnIGluIGN1cnJlbnRfZmlsZSAmJlxuICAgICAgJ2xheWVyX2hlaWdodCcgaW4gY3VycmVudF9maWxlICYmXG4gICAgICAnb2JqZWN0X2hlaWdodCcgaW4gY3VycmVudF9maWxlXG4gICAgKSB7XG4gICAgICBjb25zdCBsYyA9IE1hdGguY2VpbCgoY3VycmVudF9maWxlLm9iamVjdF9oZWlnaHQgLSBjdXJyZW50X2ZpbGUuZmlyc3RfbGF5ZXJfaGVpZ2h0KSAvIGN1cnJlbnRfZmlsZS5sYXllcl9oZWlnaHQgKyAxKVxuICAgICAgaWYgKGxjID4gMCkgcmV0dXJuIGxjXG4gICAgfVxuICAgIHJldHVybiAwXG4gIH0sXG5cbiAgZ2V0UHJpbnRMYXllcjogKHN0YXRlKTogbnVtYmVyID0+IHtcbiAgICBjb25zdCBsYXllckZyb21QcmludFN0YXRzID0gc3RhdGUucHJpbnRlci5wcmludF9zdGF0cy5pbmZvPy5jdXJyZW50X2xheWVyXG4gICAgaWYgKHR5cGVvZiBsYXllckZyb21QcmludFN0YXRzID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIGxheWVyRnJvbVByaW50U3RhdHNcbiAgICB9XG4gICAgY29uc3QgY3VycmVudF9maWxlID0gc3RhdGUucHJpbnRlci5jdXJyZW50X2ZpbGVcbiAgICBjb25zdCBkdXJhdGlvbiA9IHN0YXRlLnByaW50ZXIucHJpbnRfc3RhdHMucHJpbnRfZHVyYXRpb24gfHwgMFxuICAgIGNvbnN0IHBvcyA9IHN0YXRlLnByaW50ZXIuZ2NvZGVfbW92ZS5nY29kZV9wb3NpdGlvblxuICAgIGlmIChcbiAgICAgIGN1cnJlbnRfZmlsZSAmJlxuICAgICAgZHVyYXRpb24gPiAwICYmXG4gICAgICAnZmlyc3RfbGF5ZXJfaGVpZ2h0JyBpbiBjdXJyZW50X2ZpbGUgJiZcbiAgICAgICdsYXllcl9oZWlnaHQnIGluIGN1cnJlbnRfZmlsZSAmJlxuICAgICAgcG9zICYmXG4gICAgICBwb3MubGVuZ3RoID49IDNcbiAgICApIHtcbiAgICAgIGNvbnN0IHogPSBzdGF0ZS5wcmludGVyLmdjb2RlX21vdmUuZ2NvZGVfcG9zaXRpb25bMl1cbiAgICAgIGNvbnN0IGwgPSBNYXRoLmNlaWwoKHogLSBjdXJyZW50X2ZpbGUuZmlyc3RfbGF5ZXJfaGVpZ2h0KSAvIGN1cnJlbnRfZmlsZS5sYXllcl9oZWlnaHQgKyAxKVxuICAgICAgaWYgKGwgPiAwKSByZXR1cm4gbFxuICAgIH1cbiAgICByZXR1cm4gMFxuICB9LFxuXG4gIGdldFRpbWVFc3RpbWF0ZXM6IChzdGF0ZSwgZ2V0dGVycywgcm9vdEdldHRlcnMpOiBUaW1lRXN0aW1hdGVzID0+IHtcbiAgICBjb25zdCBwcm9ncmVzcyA9IGdldHRlcnMuZ2V0UHJpbnRQcm9ncmVzcyBhcyBudW1iZXJcbiAgICBjb25zdCBmaWxlUHJvZ3Jlc3MgPSBnZXR0ZXJzLmdldEZpbGVSZWxhdGl2ZVByaW50UHJvZ3Jlc3MgYXMgbnVtYmVyXG5cbiAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gc3RhdGUucHJpbnRlci5wcmludF9zdGF0cz8udG90YWxfZHVyYXRpb24gYXMgbnVtYmVyIHwgdW5kZWZpbmVkID8/IDBcbiAgICBjb25zdCBwcmludER1cmF0aW9uID0gc3RhdGUucHJpbnRlci5wcmludF9zdGF0cz8ucHJpbnRfZHVyYXRpb24gYXMgbnVtYmVyIHwgdW5kZWZpbmVkID8/IDBcblxuICAgIGNvbnN0IGZpbGVMZWZ0ID0gcHJpbnREdXJhdGlvbiA+IDAgJiYgZmlsZVByb2dyZXNzID4gMFxuICAgICAgPyBwcmludER1cmF0aW9uIC8gZmlsZVByb2dyZXNzIC0gcHJpbnREdXJhdGlvblxuICAgICAgOiAwXG5cbiAgICBjb25zdCBjdXJyZW50RmlsZVN0YXR1cyA9IHN0YXRlLnByaW50ZXIuY3VycmVudF9maWxlPy5oaXN0b3J5Py5zdGF0dXMgYXMgc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgY29uc3QgY3VycmVudEZpbGVUb3RhbER1cmF0aW9uID0gc3RhdGUucHJpbnRlci5jdXJyZW50X2ZpbGU/Lmhpc3Rvcnk/LnRvdGFsX2R1cmF0aW9uIGFzIG51bWJlciB8IHVuZGVmaW5lZFxuXG4gICAgY29uc3QgYWN0dWFsTGVmdCA9IGN1cnJlbnRGaWxlU3RhdHVzID09PSAnY29tcGxldGVkJyAmJiBjdXJyZW50RmlsZVRvdGFsRHVyYXRpb24gIT0gbnVsbFxuICAgICAgPyBjdXJyZW50RmlsZVRvdGFsRHVyYXRpb24gLSBwcmludER1cmF0aW9uXG4gICAgICA6IDBcblxuICAgIGNvbnN0IHNsaWNlclRvdGFsID0gc3RhdGUucHJpbnRlci5jdXJyZW50X2ZpbGU/LmVzdGltYXRlZF90aW1lIGFzIG51bWJlciB8IHVuZGVmaW5lZFxuXG4gICAgY29uc3Qgc2xpY2VyTGVmdCA9IHNsaWNlclRvdGFsICE9IG51bGwgJiYgc2xpY2VyVG90YWwgPiAwXG4gICAgICA/IHNsaWNlclRvdGFsIC0gcHJpbnREdXJhdGlvblxuICAgICAgOiAwXG5cbiAgICBjb25zdCBwcmludEV0YUNhbGN1bGF0aW9uID0gcm9vdEdldHRlcnMuY29uZmlnLnVpU2V0dGluZ3MuZ2VuZXJhbC5wcmludEV0YUNhbGN1bGF0aW9uXG5cbiAgICBjb25zdCBwcmludEV0YUNhbGN1bGF0aW9uUmVzdWx0cyA9IHByaW50RXRhQ2FsY3VsYXRpb25cbiAgICAgIC5tYXAodHlwZSA9PiB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2ZpbGUnOlxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgYWN0dWFsTGVmdCA+IDBcbiAgICAgICAgICAgICAgICA/IGFjdHVhbExlZnRcbiAgICAgICAgICAgICAgICA6IGZpbGVMZWZ0XG4gICAgICAgICAgICApXG5cbiAgICAgICAgICBjYXNlICdzbGljZXInOlxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlckxlZnRcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihyZXN1bHQgPT4gcmVzdWx0ID4gMClcblxuICAgIGNvbnN0IGV0YUxlZnQgPSBwcmludEV0YUNhbGN1bGF0aW9uUmVzdWx0c1xuICAgICAgLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gcHJpbnRFdGFDYWxjdWxhdGlvblJlc3VsdHMubGVuZ3RoIHx8IDBcblxuICAgIGNvbnN0IGV0YSA9IERhdGUubm93KCkgKyBldGFMZWZ0ICogMTAwMFxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2dyZXNzOiBNYXRoLmZsb29yKHByb2dyZXNzICogMTAwKSxcbiAgICAgIHByaW50RHVyYXRpb24sXG4gICAgICB0b3RhbER1cmF0aW9uLFxuICAgICAgc2xpY2VyTGVmdCxcbiAgICAgIGZpbGVMZWZ0LFxuICAgICAgYWN0dWFsTGVmdCxcbiAgICAgIGV0YVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIHN5c3RlbSBzdGF0c1xuICAgKi9cbiAgZ2V0U3lzdGVtU3RhdHM6IChzdGF0ZSkgPT4ge1xuICAgIHJldHVybiBzdGF0ZS5wcmludGVyLnN5c3RlbV9zdGF0c1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gTUNVJ3MgYW5kIHRoZWlyIHN0YXRlXG4gICAqL1xuICBnZXRNY3VzOiAoc3RhdGUpID0+IHtcbiAgICBjb25zdCBtY3VzOiBNQ1VbXSA9IFtdXG4gICAgT2JqZWN0LmtleXMoc3RhdGUucHJpbnRlcilcbiAgICAgIC5maWx0ZXIoa2V5ID0+IGtleS5zdGFydHNXaXRoKCdtY3UnKSlcbiAgICAgIC5zb3J0KClcbiAgICAgIC5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIG1jdXMucHVzaCh7XG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICAgIC4uLnN0YXRlLnByaW50ZXJba2V5XVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICByZXR1cm4gbWN1c1xuICB9LFxuXG4gIGdldEhhc0V4dHJ1ZGVyOiAoc3RhdGUpID0+IHtcbiAgICByZXR1cm4gc3RhdGUucHJpbnRlci5leHRydWRlclxuICB9LFxuXG4gIGdldEhhc011bHRpcGxlRXh0cnVkZXJzOiAoc3RhdGUpID0+IHtcbiAgICByZXR1cm4gKFxuICAgICAgc3RhdGUucHJpbnRlci5leHRydWRlciAmJlxuICAgICAgc3RhdGUucHJpbnRlci5leHRydWRlcjFcbiAgICApXG4gIH0sXG5cbiAgLyoqXG4gKiBSZXR1cm4ga25vd24gZXh0cnVkZXJzLCBnaXZpbmcgdGhlbSBhIGZyaWVuZGx5IG5hbWUuXG4gKi9cbiAgZ2V0RXh0cnVkZXJzOiAoc3RhdGUpID0+IHtcbiAgICBjb25zdCBleHRydWRlckNvdW50ID0gT2JqZWN0LmtleXMoc3RhdGUucHJpbnRlcilcbiAgICAgIC5maWx0ZXIoa2V5ID0+IC9eZXh0cnVkZXJcXGR7MCwyfSQvLmV4ZWMoa2V5KSlcbiAgICAgIC5sZW5ndGhcblxuICAgIHJldHVybiBbLi4uQXJyYXkoZXh0cnVkZXJDb3VudCkua2V5cygpXVxuICAgICAgLm1hcCgoaW5kZXgpOiBLbm93bkV4dHJ1ZGVyID0+ICh7XG4gICAgICAgIGtleTogYGV4dHJ1ZGVyJHtpbmRleCA9PT0gMCA/ICcnIDogaW5kZXh9YCxcbiAgICAgICAgbmFtZTogZXh0cnVkZXJDb3VudCA9PT0gMSA/ICdFeHRydWRlcicgOiBgRXh0cnVkZXIgJHtpbmRleH1gXG4gICAgICB9KSlcbiAgfSxcblxuICAvLyBSZXR1cm4gdGhlIGN1cnJlbnQgZXh0cnVkZXIgYWxvbmcgd2l0aCBpdHMgY29uZmlndXJhdGlvbi5cbiAgZ2V0QWN0aXZlRXh0cnVkZXI6IChzdGF0ZSwgZ2V0dGVycykgPT4ge1xuICAgIGNvbnN0IG5hbWUgPSBzdGF0ZS5wcmludGVyLnRvb2xoZWFkLmV4dHJ1ZGVyIHx8ICdleHRydWRlcidcbiAgICByZXR1cm4gZ2V0dGVycy5nZXRFeHRydWRlckJ5TmFtZShuYW1lKSBhcyBFeHRydWRlciB8IHVuZGVmaW5lZFxuICB9LFxuXG4gIC8vIFJldHVybnMgYW4gZXh0cnVkZXIgYnkgbmFtZS5cbiAgZ2V0RXh0cnVkZXJCeU5hbWU6IChzdGF0ZSwgZ2V0dGVycykgPT4gKG5hbWU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGUgPSBzdGF0ZS5wcmludGVyW25hbWVdIHx8IHVuZGVmaW5lZFxuICAgIGNvbnN0IGMgPSBnZXR0ZXJzLmdldFByaW50ZXJTZXR0aW5ncyhuYW1lKSBhcyBFeHRydWRlckNvbmZpZ1xuXG4gICAgLy8gSWYgd2UgY2FuJ3QgZmluZCB3aGF0IHdlIG5lZWQuLlxuICAgIGlmICghZSB8fCAhYykgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgLy8gSWYgd2UgaGF2ZSBvdGhlciBleHRydWRlcnMsIHRoZXkgbWF5IGluaGVyaXQgc29tZSBwcm9wZXJ0aWVzXG4gICAgLy8gZnJvbSB0aGUgZmlyc3QgZGVwZW5kaW5nIGhvdyB0aGV5J3JlIGRlZmluZWQuXG4gICAgY29uc3QgeyBtaW5fZXh0cnVkZV90ZW1wIH0gPSBuYW1lID09PSAnZXh0cnVkZXInXG4gICAgICA/IGNcbiAgICAgIDogZ2V0dGVycy5nZXRQcmludGVyU2V0dGluZ3MoJ2V4dHJ1ZGVyJykgYXMgRXh0cnVkZXJDb25maWdcblxuICAgIGNvbnN0IGV4dHJ1ZGVyOiBFeHRydWRlciA9IHtcbiAgICAgIG1pbl9leHRydWRlX3RlbXAsXG4gICAgICBjb25maWc6IHsgLi4uYyB9LFxuICAgICAgLi4uZVxuICAgIH1cblxuICAgIHJldHVybiBleHRydWRlclxuICB9LFxuXG4gIGdldEV4dHJ1ZGVyU3RlcHBlcnM6IChzdGF0ZSwgZ2V0dGVycyk6IEV4dHJ1ZGVyU3RlcHBlcltdID0+IHtcbiAgICBjb25zdCBzdGVwcGVycyA9IGdldHRlcnMuZ2V0U3RlcHBlcnMgYXMgU3RlcHBlcltdXG5cbiAgICByZXR1cm4gc3RlcHBlcnNcbiAgICAgIC5maWx0ZXIoKHN0ZXBwZXIpOiBzdGVwcGVyIGlzIEV4dHJ1ZGVyU3RlcHBlciA9PiBzdGVwcGVyLmtleS5zdGFydHNXaXRoKCdleHRydWRlcl9zdGVwcGVyICcpKVxuICB9LFxuXG4gIGdldFN0ZXBwZXJzOiAoc3RhdGUsIGdldHRlcnMpOiBTdGVwcGVyW10gPT4ge1xuICAgIGNvbnN0IHN0ZXBwZXJzOiBTdGVwcGVyW10gPSBbXVxuXG4gICAgY29uc3Qgc3RlcHBlcktleXM6IHN0cmluZ1tdID0gc3RhdGUucHJpbnRlci5tb3Rpb25fcmVwb3J0LnN0ZXBwZXJzID8/IFtdXG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc3RlcHBlcktleXMpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLnN0YXJ0c1dpdGgoJ3N0ZXBwZXJfJylcbiAgICAgICAgPyBpdGVtLnN1YnN0cmluZyg4KVxuICAgICAgICA6IGl0ZW0uc3BsaXQoJyAnLCAyKS5wb3AoKSB8fCAnJ1xuXG4gICAgICBjb25zdCBlID0gc3RhdGUucHJpbnRlcltpdGVtXVxuICAgICAgY29uc3QgYyA9IGdldHRlcnMuZ2V0UHJpbnRlclNldHRpbmdzKGl0ZW0pXG5cbiAgICAgIHN0ZXBwZXJzLnB1c2goe1xuICAgICAgICBuYW1lLFxuICAgICAgICBwcmV0dHlOYW1lOiBWdWUuJGZpbHRlcnMucHJldHR5Q2FzZShuYW1lKSxcbiAgICAgICAga2V5OiBpdGVtLFxuICAgICAgICBlbmFibGVkOiBzdGF0ZS5wcmludGVyLnN0ZXBwZXJfZW5hYmxlPy5zdGVwcGVyc1tpdGVtXSxcbiAgICAgICAgLi4uZSxcbiAgICAgICAgY29uZmlnOiB7IC4uLmMgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gc3RlcHBlcnNcbiAgfSxcblxuICBnZXRIYXNTdGVwcGVyc0VuYWJsZWQ6IChzdGF0ZSwgZ2V0dGVycyk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IHN0ZXBwZXJzID0gZ2V0dGVycy5nZXRTdGVwcGVycyBhcyBTdGVwcGVyW11cblxuICAgIHJldHVybiBPYmplY3QudmFsdWVzKHN0ZXBwZXJzKVxuICAgICAgLnNvbWUoc3RlcHBlciA9PiBzdGVwcGVyLmVuYWJsZWQgPT0gbnVsbCB8fCBzdGVwcGVyLmVuYWJsZWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEdpdmVuIGF4ZXMsIHJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIGF4ZXMgYXJlIGhvbWVkLlxuICAgKi9cbiAgZ2V0SG9tZWRBeGVzOiAoc3RhdGUpID0+IChheGVzPzogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIGF4ZXMgIT0gbnVsbCAmJlxuICAgICAgYXhlcy5sZW5ndGggPiAwICYmXG4gICAgICBheGVzLnNwbGl0KCcnKVxuICAgICAgICAuZXZlcnkoY2hhciA9PiBzdGF0ZS5wcmludGVyLnRvb2xoZWFkLmhvbWVkX2F4ZXMuaW5jbHVkZXMoY2hhcikpXG4gICAgKVxuICB9LFxuXG4gIGdldFJ1bm91dFNlbnNvcnM6IChzdGF0ZSk6IFJ1bm91dFNlbnNvcltdID0+IHtcbiAgICBjb25zdCBzdXBwb3J0ZWRTZW5zb3JzID0gWydmaWxhbWVudF9zd2l0Y2hfc2Vuc29yJywgJ2ZpbGFtZW50X21vdGlvbl9zZW5zb3InXVxuICAgIGNvbnN0IHNlbnNvcnM6IFJ1bm91dFNlbnNvcltdID0gW11cbiAgICBmb3IgKGNvbnN0IGl0ZW0gaW4gc3RhdGUucHJpbnRlcikge1xuICAgICAgY29uc3QgW3R5cGUsIG5hbWVGcm9tU3BsaXRdID0gaXRlbS5zcGxpdCgnICcsIDIpXG5cbiAgICAgIGlmIChzdXBwb3J0ZWRTZW5zb3JzLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lRnJvbVNwbGl0ID8/IGl0ZW1cbiAgICAgICAgY29uc3Qgc2Vuc29yID0gZ2V0KHN0YXRlLnByaW50ZXIsIGl0ZW0sIHVuZGVmaW5lZClcbiAgICAgICAgc2Vuc29ycy5wdXNoKHtcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIHByZXR0eU5hbWU6IFZ1ZS4kZmlsdGVycy5wcmV0dHlDYXNlKG5hbWUpLFxuICAgICAgICAgIC4uLnNlbnNvclxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2Vuc29yc1xuICB9LFxuXG4gIGdldEVuZHN0b3BzOiAoc3RhdGUpID0+IHtcbiAgICBjb25zdCBlbmRzdG9wczogRW5kc3RvcFtdID0gW11cbiAgICBPYmplY3Qua2V5cyhzdGF0ZS5wcmludGVyLmVuZHN0b3BzKVxuICAgICAgLnNvcnQoKVxuICAgICAgLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgZW5kc3RvcHMucHVzaCh7XG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICAgIHN0YXRlOiBzdGF0ZS5wcmludGVyLmVuZHN0b3BzW2tleV1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgcmV0dXJuIGVuZHN0b3BzXG4gIH0sXG5cbiAgZ2V0UHJvYmU6IChzdGF0ZSwgZ2V0dGVycyk6IFByb2JlIHwgdW5kZWZpbmVkID0+IHtcbiAgICBjb25zdCBwcm9iZSA9IHN0YXRlLnByaW50ZXIucHJvYmUgYXMgUHJvYmUgfCB1bmRlZmluZWRcblxuICAgIGlmIChwcm9iZSAmJiAhcHJvYmUubmFtZSkge1xuICAgICAgY29uc3QgcHJvYmVOYW1lcyA9IFtcbiAgICAgICAgJ2JsdG91Y2gnLFxuICAgICAgICAnc21hcnRfZWZmZWN0b3InLFxuICAgICAgICAncHJvYmUnXG4gICAgICBdIGFzIFByb2JlTmFtZVtdXG5cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBwcm9iZU5hbWVzKSB7XG4gICAgICAgIGNvbnN0IHByb2JlU2V0dGluZ3MgPSBnZXR0ZXJzLmdldFByaW50ZXJTZXR0aW5ncyhuYW1lKVxuXG4gICAgICAgIGlmIChwcm9iZVNldHRpbmdzPy56X29mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgcHJvYmVXaXRoTmFtZTogUHJvYmUgPSB7XG4gICAgICAgICAgICAuLi5wcm9iZSxcbiAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcHJvYmVXaXRoTmFtZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2JlXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybiBhdmFpbGFibGUgaGVhdGVyc1xuICAgKi9cbiAgZ2V0SGVhdGVyczogKHN0YXRlLCBnZXR0ZXJzKTogSGVhdGVyW10gPT4ge1xuICAgIGNvbnN0IGhlYXRlcnMgPSBzdGF0ZS5wcmludGVyLmhlYXRlcnMuYXZhaWxhYmxlX2hlYXRlcnMgfHwgW11cbiAgICBpZiAoXG4gICAgICBoZWF0ZXJzLmxlbmd0aFxuICAgICkge1xuICAgICAgY29uc3QgcjogSGVhdGVyW10gPSBbXVxuICAgICAgaGVhdGVycy5mb3JFYWNoKChlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgaGVhdGVyID0gc3RhdGUucHJpbnRlcltlXVxuICAgICAgICBpZiAoaGVhdGVyICYmIE9iamVjdC5rZXlzKGhlYXRlcikubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGdldHRlcnMuZ2V0UHJpbnRlclNldHRpbmdzKGUpXG4gICAgICAgICAgLy8gU29tZSBoZWF0ZXIgaXRlbXMgbWF5IGhhdmUgYSBwcmVmaXggZGV0ZXJtaW5pbmcgdHlwZS5cbiAgICAgICAgICAvLyBDaGVjayBmb3IgdGhlc2UgYW5kIHNwbGl0IGFzIG5lY2Vzc2FyeS5cbiAgICAgICAgICBjb25zdCBrZXlzID0gW1xuICAgICAgICAgICAgJ2hlYXRlcl9nZW5lcmljJ1xuICAgICAgICAgIF1cblxuICAgICAgICAgIGNvbnN0IFt0eXBlLCBuYW1lRnJvbVNwbGl0XSA9IGUuc3BsaXQoJyAnLCAyKVxuICAgICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lRnJvbVNwbGl0ICYmIGtleXMuaW5jbHVkZXModHlwZSlcbiAgICAgICAgICAgID8gbmFtZUZyb21TcGxpdFxuICAgICAgICAgICAgOiBlXG5cbiAgICAgICAgICBjb25zdCBjb2xvciA9IFZ1ZS4kY29sb3JzZXQubmV4dChnZXRLbGlwcGVyVHlwZShlKSwgZSlcbiAgICAgICAgICBjb25zdCBwcmV0dHlOYW1lID0gVnVlLiRmaWx0ZXJzLnByZXR0eUNhc2UobmFtZSlcblxuICAgICAgICAgIHIucHVzaCh7XG4gICAgICAgICAgICAuLi5oZWF0ZXIsXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY29sb3IsXG4gICAgICAgICAgICBwcmV0dHlOYW1lLFxuICAgICAgICAgICAga2V5OiBlLFxuICAgICAgICAgICAgbWluVGVtcDogY29uZmlnPy5taW5fdGVtcCxcbiAgICAgICAgICAgIG1heFRlbXA6IGNvbmZpZz8ubWF4X3RlbXBcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gci5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKVxuICAgIH1cbiAgICByZXR1cm4gW11cbiAgfSxcblxuICBnZXRBbGxMZWRzOiAoXywgZ2V0dGVycykgPT4ge1xuICAgIHJldHVybiBnZXR0ZXJzLmdldE91dHB1dHMoW1xuICAgICAgJ2xlZCcsXG4gICAgICAnbmVvcGl4ZWwnLFxuICAgICAgJ2RvdHN0YXInXG4gICAgXSlcbiAgfSxcblxuICBnZXRBbGxGYW5zOiAoXywgZ2V0dGVycykgPT4ge1xuICAgIHJldHVybiBnZXR0ZXJzLmdldE91dHB1dHMoW1xuICAgICAgJ3RlbXBlcmF0dXJlX2ZhbicsXG4gICAgICAnY29udHJvbGxlcl9mYW4nLFxuICAgICAgJ2hlYXRlcl9mYW4nLFxuICAgICAgJ3Bvd2VyX2ZhbicsXG4gICAgICAnZmFuX2dlbmVyaWMnLFxuICAgICAgJ2ZhbidcbiAgICBdKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdG9vbGhlYWQgZmFuc1xuICAgKi9cbiAgZ2V0VG9vbEhlYWRGYW5zOiAoXywgZ2V0dGVycykgPT4ge1xuICAgIHJldHVybiBnZXR0ZXJzLmdldE91dHB1dHMoW1xuICAgICAgLy8gJ3RlbXBlcmF0dXJlX2ZhbicsXG4gICAgICAvLyAnY29udHJvbGxlcl9mYW4nLFxuICAgICAgJ2hlYXRlcl9mYW4nLFxuICAgICAgLy8gJ2Zhbl9nZW5lcmljJyxcbiAgICAgICdmYW4nXG4gICAgXSlcbiAgfSxcblxuICBnZXRPdGhlckZhbnM6IChfLCBnZXR0ZXJzKSA9PiB7XG4gICAgcmV0dXJuIGdldHRlcnMuZ2V0T3V0cHV0cyhbXG4gICAgICAndGVtcGVyYXR1cmVfZmFuJyxcbiAgICAgICdjb250cm9sbGVyX2ZhbicsXG4gICAgICAvLyAnaGVhdGVyX2ZhbicsXG4gICAgICAncG93ZXJfZmFuJyxcbiAgICAgICdmYW5fZ2VuZXJpYydcbiAgICAgIC8vICdmYW4nXG4gICAgXSlcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIG91dHB1dCBwaW5zXG4gICAqL1xuICBnZXRQaW5zOiAoXywgZ2V0dGVycykgPT4ge1xuICAgIGNvbnN0IG91dHB1dHMgPSBnZXR0ZXJzLmdldE91dHB1dHMoW1xuICAgICAgJ291dHB1dF9waW4nLFxuICAgICAgJ3B3bV90b29sJyxcbiAgICAgICdwd21fY3ljbGVfdGltZSdcbiAgICBdKVxuICAgIHJldHVybiBvdXRwdXRzLnNvcnQoKG91dHB1dDogT3V0cHV0UGluKSA9PiBvdXRwdXQucHdtID8gMSA6IC0xKVxuICB9LFxuXG4gIGdldFBpbkJ5TmFtZTogKHN0YXRlLCBnZXR0ZXJzKSA9PiAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcGlucyA9IGdldHRlcnMuZ2V0UGlucyBhcyBPdXRwdXRQaW5bXVxuXG4gICAgcmV0dXJuIHBpbnMuZmluZChwaW4gPT4gcGluLm5hbWUgPT09IG5hbWUpXG4gIH0sXG5cbiAgLyoqXG4gICogUmV0dXJuIGF2YWlsYWJsZSBmYW5zIGFuZCBvdXRwdXQgcGluc1xuICAqL1xuICBnZXRPdXRwdXRzOiAoc3RhdGUsIGdldHRlcnMpID0+IChmaWx0ZXI/OiBzdHJpbmdbXSk6IEFycmF5PEZhbiB8IExlZCB8IE91dHB1dFBpbj4gPT4ge1xuICAgIC8vIEZhbnMuLlxuICAgIGNvbnN0IGZhbnMgPSBbXG4gICAgICAndGVtcGVyYXR1cmVfZmFuJyxcbiAgICAgICdjb250cm9sbGVyX2ZhbicsXG4gICAgICAnaGVhdGVyX2ZhbicsXG4gICAgICAncG93ZXJfZmFuJyxcbiAgICAgICdmYW5fZ2VuZXJpYycsXG4gICAgICAnZmFuJ1xuICAgIF1cblxuICAgIC8vIEdlbmVyaWMgcGlucy4uLlxuICAgIGNvbnN0IG91dHB1dFBpbnMgPSBbXG4gICAgICAnb3V0cHV0X3BpbicsXG4gICAgICAncHdtX3Rvb2wnLFxuICAgICAgJ3B3bV9jeWNsZV90aW1lJ1xuICAgIF1cblxuICAgIC8vIExFRHMuLi5cbiAgICBjb25zdCBsZWRzID0gW1xuICAgICAgJ2xlZCcsXG4gICAgICAnbmVvcGl4ZWwnLFxuICAgICAgJ2RvdHN0YXInXG4gICAgXVxuXG4gICAgLy8gQXJlIHRoZXkgY29udHJvbGxhYmxlP1xuICAgIGNvbnN0IGNvbnRyb2xsYWJsZSA9IFtcbiAgICAgICdmYW4nLFxuICAgICAgJ2Zhbl9nZW5lcmljJyxcbiAgICAgICdvdXRwdXRfcGluJyxcbiAgICAgICdwd21fdG9vbCcsXG4gICAgICAncHdtX2N5Y2xlX3RpbWUnLFxuICAgICAgJ2xlZCcsXG4gICAgICAnbmVvcGl4ZWwnLFxuICAgICAgJ2RvdHN0YXInXG4gICAgXVxuXG4gICAgLy8gU2hvdWxkIHdlIGFwcGx5IGEgY29sb3I/XG4gICAgY29uc3QgYXBwbHlDb2xvciA9IFtcbiAgICAgICd0ZW1wZXJhdHVyZV9mYW4nXG4gICAgXVxuXG4gICAgLy8gU2hvdWxkIHdlIGZpbHRlciB2aXNpYmxpdHkgYmFzZWQgb24gdGhlIF8gcHJlZml4P1xuICAgIGNvbnN0IGZpbHRlckJ5UHJlZml4ID0gW1xuICAgICAgJ291dHB1dF9waW4nLFxuICAgICAgJ3B3bV90b29sJyxcbiAgICAgICdwd21fY3ljbGVfdGltZScsXG4gICAgICAndGVtcGVyYXR1cmVfZmFuJyxcbiAgICAgICdjb250cm9sbGVyX2ZhbicsXG4gICAgICAnaGVhdGVyX2ZhbicsXG4gICAgICAncG93ZXJfZmFuJyxcbiAgICAgICdmYW5fZ2VuZXJpYycsXG4gICAgICAnbGVkJyxcbiAgICAgICduZW9waXhlbCcsXG4gICAgICAnZG90c3RhcidcbiAgICBdXG5cbiAgICBjb25zdCBzdXBwb3J0ZWRUeXBlcyA9IChmaWx0ZXIgJiYgZmlsdGVyLmxlbmd0aClcbiAgICAgID8gZmlsdGVyXG4gICAgICA6IFsuLi5mYW5zLCAuLi5vdXRwdXRQaW5zLCAuLi5sZWRzXVxuXG4gICAgY29uc3QgcGluczogQXJyYXk8RmFuIHwgTGVkIHwgT3V0cHV0UGluPiA9IFtdXG5cbiAgICBmb3IgKGNvbnN0IHBpbiBpbiBzdGF0ZS5wcmludGVyKSB7XG4gICAgICBjb25zdCBbdHlwZSwgbmFtZUZyb21TcGxpdF0gPSBwaW4uc3BsaXQoJyAnLCAyKVxuICAgICAgY29uc3QgbmFtZSA9IG5hbWVGcm9tU3BsaXQgPz8gcGluXG5cbiAgICAgIGlmIChcbiAgICAgICAgc3VwcG9ydGVkVHlwZXMuaW5jbHVkZXModHlwZSkgJiZcbiAgICAgICAgKCFmaWx0ZXJCeVByZWZpeC5pbmNsdWRlcyh0eXBlKSB8fCAhbmFtZS5zdGFydHNXaXRoKCdfJykpXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgcHJldHR5TmFtZSA9IG5hbWUgPT09ICdmYW4nXG4gICAgICAgICAgPyAnUGFydCBGYW4nIC8vIElmIHdlIGtub3cgaXRzIHRoZSBwYXJ0IGZhbi5cbiAgICAgICAgICA6IFZ1ZS4kZmlsdGVycy5wcmV0dHlDYXNlKG5hbWUpXG5cbiAgICAgICAgY29uc3QgY29sb3IgPSAoYXBwbHlDb2xvci5pbmNsdWRlcyh0eXBlKSlcbiAgICAgICAgICA/IFZ1ZS4kY29sb3JzZXQubmV4dChnZXRLbGlwcGVyVHlwZShwaW4pLCBwaW4pXG4gICAgICAgICAgOiB1bmRlZmluZWRcblxuICAgICAgICBjb25zdCBjb25maWcgPSBnZXR0ZXJzLmdldFByaW50ZXJTZXR0aW5ncyhwaW4pXG5cbiAgICAgICAgbGV0IG91dHB1dDogRmFuIHwgTGVkIHwgT3V0cHV0UGluID0ge1xuICAgICAgICAgIC4uLnN0YXRlLnByaW50ZXJbcGluXSxcbiAgICAgICAgICAuLi5nZXR0ZXJzLmdldEV4dHJhU2Vuc29yRGF0YShjb25maWc/LnNlbnNvcl90eXBlPy50b0xvd2VyQ2FzZSgpLCBuYW1lKSxcbiAgICAgICAgICBjb25maWc6IHsgLi4uY29uZmlnIH0sXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBwcmV0dHlOYW1lLFxuICAgICAgICAgIGtleTogcGluLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgY29udHJvbGxhYmxlOiAoY29udHJvbGxhYmxlLmluY2x1ZGVzKHR5cGUpKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZhbnMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgICBvdXRwdXQgPSB7XG4gICAgICAgICAgICAuLi5vdXRwdXQsXG4gICAgICAgICAgICBtaW5UZW1wOiBjb25maWc/Lm1pbl90ZW1wLFxuICAgICAgICAgICAgbWF4VGVtcDogY29uZmlnPy5tYXhfdGVtcFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvdXRwdXRQaW5zLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgICAgb3V0cHV0ID0ge1xuICAgICAgICAgICAgLi4ub3V0cHV0LFxuICAgICAgICAgICAgcHdtOiBjb25maWc/LnB3bSA/PyBmYWxzZSxcbiAgICAgICAgICAgIHNjYWxlOiBjb25maWc/LnNjYWxlID8/IDEsXG4gICAgICAgICAgICByZXNldFZhbHVlOiBjb25maWc/LnZhbHVlID8/IDAsXG4gICAgICAgICAgICBjb250cm9sbGFibGU6IGNvbmZpZz8uc3RhdGljX3ZhbHVlID8gZmFsc2UgOiBjb250cm9sbGFibGUuaW5jbHVkZXModHlwZSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwaW5zLnB1c2gob3V0cHV0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGluc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IGEudHlwZS5sb2NhbGVDb21wYXJlKGIudHlwZSkgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSlcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJuIGF2YWlsYWJsZSB0ZW1wZXJhdHVyZSBwcm9iZXMgLyBzZW5zb3JzLlxuICAgKi9cbiAgZ2V0U2Vuc29yczogKHN0YXRlLCBnZXR0ZXJzKTogU2Vuc29yW10gPT4ge1xuICAgIGNvbnN0IHN1cHBvcnRlZFNlbnNvcnMgPSBbXG4gICAgICAndGVtcGVyYXR1cmVfc2Vuc29yJyxcbiAgICAgICd0ZW1wZXJhdHVyZV9wcm9iZScsXG4gICAgICAndG1jMjI0MCcsXG4gICAgICAnel90aGVybWFsX2FkanVzdCdcbiAgICBdXG4gICAgY29uc3Qgc3VwcG9ydGVkRHJpdmVycyA9IFtcbiAgICAgICd0bWMyMjQwJ1xuICAgIF1cblxuICAgIGNvbnN0IHNlbnNvcnMgPSBPYmplY3Qua2V5cyhzdGF0ZS5wcmludGVyKVxuICAgICAgLnJlZHVjZSgoZ3JvdXBzLCBpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IFt0eXBlLCBuYW1lRnJvbVNwbGl0XSA9IGl0ZW0uc3BsaXQoJyAnLCAyKVxuICAgICAgICBjb25zdCBuYW1lID0gbmFtZUZyb21TcGxpdCA/PyBpdGVtXG5cbiAgICAgICAgaWYgKHN1cHBvcnRlZFNlbnNvcnMuaW5jbHVkZXModHlwZSkgJiYgIW5hbWUuc3RhcnRzV2l0aCgnXycpKSB7XG4gICAgICAgICAgY29uc3QgcHJldHR5TmFtZSA9IHN1cHBvcnRlZERyaXZlcnMuaW5jbHVkZXModHlwZSlcbiAgICAgICAgICAgID8gaTE4bi50KCdhcHAuZ2VuZXJhbC5sYWJlbC5zdGVwcGVyX2RyaXZlcicsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOlxuICAgICAgICAgICAgICAgICAgbmFtZS5zdGFydHNXaXRoKCdzdGVwcGVyXycpXG4gICAgICAgICAgICAgICAgICAgID8gbmFtZS5zdWJzdHJpbmcoOCkudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICA6IFZ1ZS4kZmlsdGVycy5wcmV0dHlDYXNlKG5hbWUpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IFZ1ZS4kZmlsdGVycy5wcmV0dHlDYXNlKG5hbWUpXG4gICAgICAgICAgY29uc3QgY29sb3IgPSBWdWUuJGNvbG9yc2V0Lm5leHQoZ2V0S2xpcHBlclR5cGUoaXRlbSksIGl0ZW0pXG4gICAgICAgICAgY29uc3QgY29uZmlnID0gZ2V0dGVycy5nZXRQcmludGVyU2V0dGluZ3MoaXRlbSlcblxuICAgICAgICAgIGdyb3Vwc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIC4uLnN0YXRlLnByaW50ZXJbaXRlbV0sXG4gICAgICAgICAgICAuLi5nZXR0ZXJzLmdldEV4dHJhU2Vuc29yRGF0YShjb25maWc/LnNlbnNvcl90eXBlPy50b0xvd2VyQ2FzZSgpLCBuYW1lKSxcbiAgICAgICAgICAgIGNvbmZpZzogeyAuLi5jb25maWcgfSxcbiAgICAgICAgICAgIG1pblRlbXA6IGNvbmZpZz8ubWluX3RlbXAgPz8gbnVsbCxcbiAgICAgICAgICAgIG1heFRlbXA6IGNvbmZpZz8ubWF4X3RlbXAgPz8gbnVsbCxcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBrZXk6IGl0ZW0sXG4gICAgICAgICAgICBwcmV0dHlOYW1lLFxuICAgICAgICAgICAgY29sb3IsXG4gICAgICAgICAgICB0eXBlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdyb3Vwc1xuICAgICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgU2Vuc29yPilcblxuICAgIHJldHVybiBPYmplY3QudmFsdWVzKHNlbnNvcnMpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS50eXBlLmxvY2FsZUNvbXBhcmUoYi50eXBlKSB8fCBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKVxuICB9LFxuXG4gIGdldEV4dHJhU2Vuc29yRGF0YTogKHN0YXRlKSA9PiAoc2Vuc29yVHlwZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBzdXBwb3J0ZWRTZW5zb3JzID0gW1xuICAgICAgJ2FodDEwJyxcbiAgICAgICdibWUyODAnLFxuICAgICAgJ2h0dTIxZCcsXG4gICAgICAnbmV2ZXJtb3Jlc2Vuc29yJyxcbiAgICAgICdzaHQzeCdcbiAgICBdXG5cbiAgICBpZiAoc3VwcG9ydGVkU2Vuc29ycy5pbmNsdWRlcyhzZW5zb3JUeXBlKSkge1xuICAgICAgY29uc3Qgc2Vuc29yID0gc3RhdGUucHJpbnRlcltgJHtzZW5zb3JUeXBlfSAke25hbWV9YF1cblxuICAgICAgaWYgKHNlbnNvcikge1xuICAgICAgICBjb25zdCB7IHByZXNzdXJlLCBodW1pZGl0eSwgZ2FzIH0gPSBzZW5zb3JcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHByZXNzdXJlLFxuICAgICAgICAgIGh1bWlkaXR5LFxuICAgICAgICAgIGdhc1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBsaXN0IG9mIGtleXMgdGhhdCByZXByZXNlbnQgc29tZXRoaW5nIHdlIG1heSB3YW50XG4gICAqIHRvIGNoYXJ0LlxuICAgKi9cbiAgZ2V0Q2hhcnRhYmxlU2Vuc29yczogKHN0YXRlKSA9PiB7XG4gICAgY29uc3Qga2V5R3JvdXBzID0gW1xuICAgICAgW1xuICAgICAgICAndGVtcGVyYXR1cmVfZmFuJ1xuICAgICAgXSxcbiAgICAgIFtcbiAgICAgICAgJ3RlbXBlcmF0dXJlX3Byb2JlJyxcbiAgICAgICAgJ3pfdGhlcm1hbF9hZGp1c3QnLFxuICAgICAgICAndGVtcGVyYXR1cmVfc2Vuc29yJ1xuICAgICAgXSxcbiAgICAgIFtcbiAgICAgICAgJ3RtYzIyNDAnXG4gICAgICBdXG4gICAgXVxuXG4gICAgY29uc3QgcHJpbnRlcktleXMgPSBPYmplY3Qua2V5cyhzdGF0ZS5wcmludGVyKVxuXG4gICAgY29uc3Qgc2Vuc29ycyA9IGtleUdyb3Vwcy5mbGF0TWFwKGtleUdyb3VwID0+IHtcbiAgICAgIGNvbnN0IGtleUdyb3VwUmVnRXhwQXJyYXkgPSBrZXlHcm91cFxuICAgICAgICAubWFwKHggPT4gbmV3IFJlZ0V4cChgXiR7eH0oPyEgXylgKSlcblxuICAgICAgcmV0dXJuIHByaW50ZXJLZXlzXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IGtleUdyb3VwUmVnRXhwQXJyYXkuc29tZSh4ID0+IHgudGVzdChrZXkpKSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEubG9jYWxlQ29tcGFyZShiKSlcbiAgICB9KVxuXG4gICAgY29uc3QgaGVhdGVycyA9IFsuLi5zdGF0ZS5wcmludGVyLmhlYXRlcnMuYXZhaWxhYmxlX2hlYXRlcnMgYXMgc3RyaW5nW11dXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5sb2NhbGVDb21wYXJlKGIpKVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLmhlYXRlcnMsXG4gICAgICAuLi5zZW5zb3JzXG4gICAgXVxuICB9LFxuXG4gIGdldEJlZFNjcmV3czogKF8sIGdldHRlcnMpID0+IHtcbiAgICBjb25zdCBjb25maWcgPSBnZXR0ZXJzLmdldFByaW50ZXJTZXR0aW5ncygnYmVkX3NjcmV3cycpXG4gICAgY29uc3Qgc2NyZXdzOiBCZWRTY3Jld3NbXSA9IFtdXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDE7IGluZGV4IDw9IDk5OyBpbmRleCsrKSB7XG4gICAgICBjb25zdCBrZXkgPSBgc2NyZXcke2luZGV4fWBcbiAgICAgIGNvbnN0IGNvb3JkcyA9IGNvbmZpZ1trZXldXG5cbiAgICAgIGlmICghY29vcmRzKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbmUgPSBjb25maWdbYHNjcmV3JHtpbmRleH1fZmluZV9hZGp1c3RgXVxuICAgICAgY29uc3QgbmFtZSA9IGNvbmZpZ1tgc2NyZXcke2luZGV4fV9uYW1lYF1cbiAgICAgIGNvbnN0IHByZXR0eU5hbWUgPSBWdWUuJGZpbHRlcnMucHJldHR5Q2FzZShuYW1lIHx8IGkxOG4udCgnYXBwLmdlbmVyYWwubGFiZWwuc2NyZXdfbnVtYmVyJywgeyBpbmRleDogaW5kZXggKyAxIH0pKVxuXG4gICAgICBzY3Jld3MucHVzaCh7XG4gICAgICAgIGtleSxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcHJldHR5TmFtZSxcbiAgICAgICAgZmluZSxcbiAgICAgICAgeDogY29vcmRzWzBdLFxuICAgICAgICB5OiBjb29yZHNbMV1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHNjcmV3c1xuICB9LFxuXG4gIGdldFNjcmV3c1RpbHRBZGp1c3Q6IChzdGF0ZSwgZ2V0dGVycykgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IGdldHRlcnMuZ2V0UHJpbnRlclNldHRpbmdzKCdzY3Jld3NfdGlsdF9hZGp1c3QnKVxuICAgIGNvbnN0IHNjcmV3czogU2NyZXdzVGlsdEFkanVzdFNjcmV3W10gPSBbXVxuXG4gICAgY29uc3QgeyByZXN1bHRzLCAuLi5yZXN0IH0gPSBzdGF0ZS5wcmludGVyLnNjcmV3c190aWx0X2FkanVzdFxuXG4gICAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8PSA5OTsgaW5kZXgrKykge1xuICAgICAgY29uc3Qga2V5ID0gYHNjcmV3JHtpbmRleH1gXG4gICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRzPy5ba2V5XVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb29yZHMgPSBjb25maWdba2V5XVxuICAgICAgY29uc3QgbmFtZSA9IGNvbmZpZ1tgJHtrZXl9X25hbWVgXVxuICAgICAgY29uc3QgcHJldHR5TmFtZSA9IFZ1ZS4kZmlsdGVycy5wcmV0dHlDYXNlKG5hbWUgfHwgaTE4bi50KCdhcHAuZ2VuZXJhbC5sYWJlbC5zY3Jld19udW1iZXInLCB7IGluZGV4OiBpbmRleCArIDEgfSkpXG4gICAgICBjb25zdCBbaG91cnMsIG1pbnV0ZXNdID0gcmVzdWx0LmFkanVzdFxuICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAubWFwKE51bWJlcilcbiAgICAgIGNvbnN0IGFkanVzdE1pbnV0ZXMgPSBob3VycyAqIDYwICsgbWludXRlc1xuXG4gICAgICBzY3Jld3MucHVzaCh7XG4gICAgICAgIGtleSxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcHJldHR5TmFtZSxcbiAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICBhZGp1c3RNaW51dGVzLFxuICAgICAgICB4OiBjb29yZHNbMF0sXG4gICAgICAgIHk6IGNvb3Jkc1sxXVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4ucmVzdCxcbiAgICAgIHNjcmV3c1xuICAgIH0gYXMgU2NyZXdzVGlsdEFkanVzdFxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSByZXF1aXJlZCBzZXR0aW5nIGZyb20gdGhlIHByaW50ZXIuY29uZmlnIG9iamVjdC5cbiAgICovXG4gIGdldFByaW50ZXJTZXR0aW5nczogKHN0YXRlKSA9PiAoc2V0dGluZzogc3RyaW5nKSA9PiB7XG4gICAgaWYgKFxuICAgICAgc3RhdGUucHJpbnRlciAmJlxuICAgICAgc3RhdGUucHJpbnRlci5jb25maWdmaWxlICYmXG4gICAgICBzdGF0ZS5wcmludGVyLmNvbmZpZ2ZpbGUuc2V0dGluZ3NcbiAgICApIHtcbiAgICAgIGlmIChzZXR0aW5nKSByZXR1cm4gZ2V0KHN0YXRlLnByaW50ZXIuY29uZmlnZmlsZS5zZXR0aW5ncywgc2V0dGluZy50b0xvd2VyQ2FzZSgpLCB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gc3RhdGUucHJpbnRlci5jb25maWdmaWxlLnNldHRpbmdzXG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfSxcblxuICBnZXRQcmludGVyQ29uZmlnOiAoc3RhdGUpID0+IChjb25maWc6IHN0cmluZykgPT4ge1xuICAgIGlmIChcbiAgICAgIHN0YXRlLnByaW50ZXIgJiZcbiAgICAgIHN0YXRlLnByaW50ZXIuY29uZmlnZmlsZSAmJlxuICAgICAgc3RhdGUucHJpbnRlci5jb25maWdmaWxlLmNvbmZpZ1xuICAgICkge1xuICAgICAgaWYgKGNvbmZpZykgcmV0dXJuIGdldChzdGF0ZS5wcmludGVyLmNvbmZpZ2ZpbGUuY29uZmlnLCBjb25maWcsIHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBzdGF0ZS5wcmludGVyLmNvbmZpZ2ZpbGUuY29uZmlnXG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfSxcblxuICBnZXRIYXNXYXJuaW5nczogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUpID0+IHtcbiAgICBpZiAoXG4gICAgICAocm9vdFN0YXRlLnNvY2tldCAmJiByb290U3RhdGUuc29ja2V0Lm9wZW4gJiYgcm9vdFN0YXRlLnNvY2tldC5yZWFkeSkgJiZcbiAgICAgIChnZXR0ZXJzLmdldFByaW50ZXJXYXJuaW5ncy5sZW5ndGggPiAwIHx8IGdldHRlcnMuZ2V0S2xpcHBlcldhcm5pbmdzLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgZ2V0dGVycy5nZXRNb29ucmFrZXJGYWlsZWRDb21wb25lbnRzLmxlbmd0aCA+IDAgfHwgZ2V0dGVycy5nZXRNb29ucmFrZXJXYXJuaW5ncy5sZW5ndGggPiAwKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9LFxuXG4gIGdldFByaW50ZXJXYXJuaW5nczogKHN0YXRlLCBnZXR0ZXJzKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0gZ2V0dGVycy5nZXRQcmludGVyQ29uZmlnKClcbiAgICBjb25zdCB3YXJuaW5ncyA9IFtdXG5cbiAgICBpZiAoY29uZmlnICYmICEoJ3ZpcnR1YWxfc2RjYXJkJyBpbiBjb25maWcpKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHsgbWVzc2FnZTogJ1t2aXJ0dWFsX3NkY2FyZF0gbm90IGZvdW5kIGluIHByaW50ZXIgY29uZmlndXJhdGlvbi4nIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZyAmJiAhKCdwYXVzZV9yZXN1bWUnIGluIGNvbmZpZykpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goeyBtZXNzYWdlOiAnW3BhdXNlX3Jlc3VtZV0gbm90IGZvdW5kIGluIHByaW50ZXIgY29uZmlndXJhdGlvbi4nIH0pXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgY29uZmlnICYmXG4gICAgICAhKCdkaXNwbGF5JyBpbiBjb25maWcpICYmICEoJ2Rpc3BsYXlfc3RhdHVzJyBpbiBjb25maWcpXG4gICAgKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHsgbWVzc2FnZTogJ1tkaXNwbGF5X3N0YXR1c10gaXMgcmVxdWlyZWQgaWYgeW91IGRvIG5vdCBoYXZlIGEgW2Rpc3BsYXldIGRlZmluZWQuJyB9KVxuICAgIH1cblxuICAgIGlmIChjb25maWcgJiYgISgnZ2NvZGVfbWFjcm8gQ0FOQ0VMX1BSSU5UJyBpbiBjb25maWcpKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHsgbWVzc2FnZTogJ0NBTkNFTF9QUklOVCBjb21tYW5kIG5vdCBmb3VuZCBpbiBjb25maWd1cmF0aW9uLicgfSlcbiAgICB9XG4gICAgcmV0dXJuIHdhcm5pbmdzXG4gIH0sXG5cbiAgZ2V0S2xpcHBlcldhcm5pbmdzOiAoc3RhdGUpID0+IHtcbiAgICByZXR1cm4gc3RhdGUucHJpbnRlci5jb25maWdmaWxlPy53YXJuaW5ncyB8fCBbXVxuICB9LFxuXG4gIGdldE1vb25yYWtlckZhaWxlZENvbXBvbmVudHM6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlLCByb290R2V0dGVycykgPT4ge1xuICAgIGNvbnN0IHNlcnZlckluZm8gPSByb290R2V0dGVyc1snc2VydmVyL2dldEluZm8nXSBhcyBTZXJ2ZXJJbmZvXG5cbiAgICByZXR1cm4gc2VydmVySW5mby5mYWlsZWRfY29tcG9uZW50cyB8fCBbXVxuICB9LFxuXG4gIGdldE1vb25yYWtlcldhcm5pbmdzOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpID0+IHtcbiAgICBjb25zdCBzZXJ2ZXJJbmZvID0gcm9vdEdldHRlcnNbJ3NlcnZlci9nZXRJbmZvJ10gYXMgU2VydmVySW5mb1xuXG4gICAgcmV0dXJuIHNlcnZlckluZm8ud2FybmluZ3MgfHwgW11cbiAgfSxcblxuICBnZXRTYXZlQ29uZmlnUGVuZGluZzogKHN0YXRlKTogYm9vbGVhbiA9PiB7XG4gICAgY29uc3Qgc2F2ZUNvbmZpZ1BlbmRpbmcgPSBzdGF0ZS5wcmludGVyLmNvbmZpZ2ZpbGU/LnNhdmVfY29uZmlnX3BlbmRpbmcgYXMgYm9vbGVhbiB8IHVuZGVmaW5lZFxuXG4gICAgcmV0dXJuIHNhdmVDb25maWdQZW5kaW5nIHx8IGZhbHNlXG4gIH0sXG5cbiAgZ2V0U2F2ZUNvbmZpZ1BlbmRpbmdJdGVtczogKHN0YXRlKTogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPT4ge1xuICAgIGNvbnN0IHNhdmVDb25maWdQZW5kaW5nSXRlbXMgPSBzdGF0ZS5wcmludGVyLmNvbmZpZ2ZpbGU/LnNhdmVfY29uZmlnX3BlbmRpbmdfaXRlbXMgYXMgUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gfCB1bmRlZmluZWRcblxuICAgIHJldHVybiBzYXZlQ29uZmlnUGVuZGluZ0l0ZW1zIHx8IHt9XG4gIH0sXG5cbiAgZ2V0SGFzSG9taW5nT3ZlcnJpZGU6IChzdGF0ZSwgZ2V0dGVycykgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IGdldHRlcnMuZ2V0UHJpbnRlckNvbmZpZygpXG4gICAgaWYgKGNvbmZpZyAmJiAoJ2hvbWluZ19vdmVycmlkZScgaW4gY29uZmlnKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9LFxuXG4gIGdldEhhc1JvdW5kQmVkOiAoXywgZ2V0dGVycyk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGtpbmVtYXRpY3MgPSBnZXR0ZXJzLmdldFByaW50ZXJTZXR0aW5ncygncHJpbnRlci5raW5lbWF0aWNzJykgfHwgJydcblxuICAgIHJldHVybiBbXG4gICAgICAnZGVsdGEnLFxuICAgICAgJ3BvbGFyJyxcbiAgICAgICdyb3RhcnlfZGVsdGEnLFxuICAgICAgJ3dpbmNoJ1xuICAgIF0uaW5jbHVkZXMoa2luZW1hdGljcylcbiAgfSxcblxuICBnZXRCZWRTaXplOiAoc3RhdGUpOiBCZWRTaXplIHwgdW5kZWZpbmVkID0+IHtcbiAgICBjb25zdCB7IGF4aXNfbWluaW11bSwgYXhpc19tYXhpbXVtIH0gPSBzdGF0ZS5wcmludGVyLnRvb2xoZWFkXG5cbiAgICBpZiAoXG4gICAgICBheGlzX21pbmltdW0ubGVuZ3RoIDwgMiB8fFxuICAgICAgYXhpc19tYXhpbXVtLmxlbmd0aCA8IDJcbiAgICApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBjb25zdCBbbWluWCwgbWluWV0gPSBheGlzX21pbmltdW1cbiAgICBjb25zdCBbbWF4WCwgbWF4WV0gPSBheGlzX21heGltdW1cblxuICAgIHJldHVybiB7XG4gICAgICBtaW5YLFxuICAgICAgbWluWSxcbiAgICAgIG1heFgsXG4gICAgICBtYXhZXG4gICAgfVxuICB9LFxuXG4gIGdldEF2YWlsYWJsZUNvbW1hbmRzOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpOiBHY29kZUNvbW1hbmRzID0+IHtcbiAgICBjb25zdCBhdmFpbGFibGVDb21tYW5kcyA9IHN0YXRlLnByaW50ZXIuZ2NvZGUuY29tbWFuZHMgYXMgR2NvZGVDb21tYW5kcyB8IG51bGxcblxuICAgIGlmIChhdmFpbGFibGVDb21tYW5kcykge1xuICAgICAgcmV0dXJuIGF2YWlsYWJsZUNvbW1hbmRzXG4gICAgfVxuXG4gICAgY29uc3Qga25vd25Db21tYW5kcyA9IHJvb3RHZXR0ZXJzWydjb25zb2xlL2dldEFsbEtub3duQ29tbWFuZHMnXSBhcyBHY29kZUhlbHBcblxuICAgIHJldHVybiBPYmplY3QuZW50cmllcyhrbm93bkNvbW1hbmRzKVxuICAgICAgLnJlZHVjZSgoYXZhaWxhYmxlQ29tbWFuZHMsIFtrZXksIGhlbHBdKSA9PiB7XG4gICAgICAgIGF2YWlsYWJsZUNvbW1hbmRzW2tleV0gPSB7IGhlbHAgfVxuXG4gICAgICAgIHJldHVybiBhdmFpbGFibGVDb21tYW5kc1xuICAgICAgfSwge30gYXMgR2NvZGVDb21tYW5kcylcbiAgfSxcblxuICBnZXRJc01hbnVhbFByb2JlQWN0aXZlOiAoc3RhdGUpID0+IHtcbiAgICByZXR1cm4gc3RhdGUucHJpbnRlci5tYW51YWxfcHJvYmU/LmlzX2FjdGl2ZSB8fCBmYWxzZVxuICB9LFxuXG4gIGdldElzQmVkU2NyZXdzQWRqdXN0QWN0aXZlOiAoc3RhdGUpID0+IHtcbiAgICByZXR1cm4gc3RhdGUucHJpbnRlci5iZWRfc2NyZXdzPy5pc19hY3RpdmUgfHwgZmFsc2VcbiAgfSxcblxuICBnZXRIYXNTY3Jld3NUaWx0QWRqdXN0UmVzdWx0czogKHN0YXRlKSA9PiB7XG4gICAgY29uc3QgeyBlcnJvciwgbWF4X2RldmlhdGlvbiwgcmVzdWx0cyB9ID0gc3RhdGUucHJpbnRlci5zY3Jld3NfdGlsdF9hZGp1c3QgPz8ge31cblxuICAgIHJldHVybiAoXG4gICAgICAhZXJyb3IgJiZcbiAgICAgIG1heF9kZXZpYXRpb24gPT0gbnVsbCAmJlxuICAgICAgcmVzdWx0cyAmJlxuICAgICAgT2JqZWN0LmtleXMocmVzdWx0cykubGVuZ3RoID4gMFxuICAgIClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFJaEIsU0FBUyxXQUFXO0FBQ3BCLE9BQU8sb0JBQW9CO0FBQzNCLE9BQU8sVUFBVTtBQUdqQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxhQUFhO0FBRWIsYUFBTSxVQUErQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSzFELGdCQUFnQixDQUFDLE9BQU9BLFVBQVMsV0FBVyxnQkFBeUI7QUFHbkUsVUFBTSxhQUFhLFlBQVksZ0JBQWdCO0FBRS9DLFdBQ0UsV0FBVyxpQkFBaUIsV0FDNUIsV0FBVztBQUFBLEVBRWY7QUFBQSxFQUVBLG9CQUFvQixDQUFDLE9BQU9BLFVBQVMsV0FBVyxnQkFBeUI7QUFDdkUsVUFBTSxhQUFhLFlBQVksZ0JBQWdCO0FBRS9DLFdBQU8sV0FBVztBQUFBLEVBQ3BCO0FBQUEsRUFFQSxnQkFBZ0IsQ0FBQyxPQUFPQSxVQUFTLFdB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U0EsU0FBUSxpQkFBaUI7QUFDeEMsUUFBSSxVQUFXLHFCQUFxQixRQUFTO0FBQzNDLGFBQU87QUFBQSxJQUNULE9BQU87QUFDTCxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLGdCQUFnQixDQUFDLEdBQUdBLGFBQXFCO0FBQ3ZDLFVBQU0sYUFBYUEsU0FBUSxtQkFBbUIsb0JBQW9CLEtBQUs7QUFFdkUsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQUUsU0FBUyxVQUFVO0FBQUEsRUFDdkI7QUFBQSxFQUVBLFlBQVksQ0FBQyxVQUErQjtBQUMxQyxVQUFNLEVBQUUsY0FBYyxhQUFhLElBQUksTUFBTSxRQUFRO0FBRXJELFFBQ0UsYUFBYSxTQUFTLEtBQ3RCLGFBQWEsU0FBUyxHQUN0QjtBQUNBLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJO0FBQ3JCLFVBQU0sQ0FBQyxNQUFNLElBQUksSUFBSTtBQUVyQixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxzQkFBc0IsQ0FBQyxPQUFPQSxVQUFTLFdBQVcsZ0JBQStCO0FBQy9FLFVBQU0sb0JBQW9CLE1BQU0sUUFBUSxNQUFNO0FBRTlDLFFBQUksbUJBQW1CO0FBQ3JCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxnQkFBZ0IsWUFBWSw2QkFBNkI7QUFFL0QsV0FBTyxPQUFPLFFBQVEsYUFBYSxFQUNoQyxPQUFPLENBQUNDLG9CQUFtQixDQUFDLEtBQUssSUFBSSxNQUFNO0FBQzFDLE1BQUFBLG1CQUFrQixHQUFHLElBQUksRUFBRSxLQUFLO0FBRWhDLGFBQU9BO0FBQUEsSUFDVCxHQUFHLENBQUMsQ0FBa0I7QUFBQSxFQUMxQjtBQUFBLEVBRUEsd0JBQXdCLENBQUMsVUFBVTtBQUNqQyxXQUFPLE1BQU0sUUFBUSxjQUFjLGFBQWE7QUFBQSxFQUNsRDtBQUFBLEVBRUEsNEJBQTRCLENBQUMsVUFBVTtBQUNyQyxXQUFPLE1BQU0sUUFBUSxZQUFZLGFBQWE7QUFBQSxFQUNoRDtBQUFBLEVBRUEsK0JBQStCLENBQUMsVUFBVTtBQUN4QyxVQUFNLEVBQUUsT0FBTyxlQUFlLFFBQVEsSUFBSSxNQUFNLFFBQVEsc0JBQXNCLENBQUM7QUFFL0UsV0FDRSxDQUFDLFNBQ0QsaUJBQWlCLFFBQ2pCLFdBQ0EsT0FBTyxLQUFLLE9BQU8sRUFBRSxTQUFTO0FBQUEsRUFFbEM7QUFDRjsiLCJuYW1lcyI6WyJnZXR0ZXJzIiwiYXZhaWxhYmxlQ29tbWFuZHMiXX0=