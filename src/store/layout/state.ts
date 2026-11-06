import type { LayoutState } from './types'
import { v4 as uuidv4 } from 'uuid'
import type { DiagnosticsCardConfig, DiagnosticsCardContainer } from '@/store/diagnostics/types'

/**
 * Maintains the state of our page layouts.
 * Maintains;
 * - Position of card.
 * - If card is collapsed or not.
 * - If card is enabled or not.
 */
export const defaultState = (): LayoutState => {
  return {
    layouts: {
      dashboard: {
        container1: [
          { id: 'printer-status-card', enabled: true, collapsed: false },
          { id: 'spoolman-card', enabled: true, collapsed: false },
          { id: 'camera-card', enabled: true, collapsed: false },
          { id: 'toolhead-card', enabled: true, collapsed: false },
          { id: 'macros-card', enabled: true, collapsed: false },
          { id: 'outputs-card', enabled: true, collapsed: false },
          { id: 'runout-sensors-card', enabled: false, collapsed: false },
          { id: 'printer-limits-card', enabled: true, collapsed: false },
          { id: 'retract-card', enabled: true, collapsed: false }
        ],
        container2: [
          { id: 'temperature-card', enabled: true, collapsed: false },
          { id: 'sensors-card', enabled: true, collapsed: false },
          { id: 'console-card', enabled: true, collapsed: false },
          { id: 'jobs-card', enabled: true, collapsed: false },
          { id: 'job-queue-card', enabled: false, collapsed: false },
          { id: 'gcode-preview-card', enabled: true, collapsed: false },
          { id: 'bed-mesh-card', enabled: false, collapsed: false }
        ]
      },
      diagnostics: {
        container1: [{
          id: uuidv4(),
          enabled: true,
          title: 'Temperatures',
          collapsed: false,
          height: 200,
          icon: 'thermometer',
          axes: [{
            enabled: true,
            unit: '°C',
            showLegend: true,
            metrics: [
              { collector: 'printer.extruder.temperature', name: 'Nozzle', style: { lineStyle: 'solid', lineColor: '#ff9f0a', fillColor: null, fillOpacity: 0, displayLegend: true } },
              { collector: 'printer.extruder.target', name: 'Nozzle target', style: { lineStyle: 'dashed', lineColor: '#ff9f0a', fillColor: null, fillOpacity: 0, displayLegend: false } },
              { collector: 'printer.heater_bed.temperature', name: 'Bed', style: { lineStyle: 'solid', lineColor: '#30b0c7', fillColor: null, fillOpacity: 0, displayLegend: true } },
              { collector: 'printer.heater_bed.target', name: 'Bed target', style: { lineStyle: 'dashed', lineColor: '#30b0c7', fillColor: null, fillOpacity: 0, displayLegend: false } }
            ]
          }]
        }, {
          id: uuidv4(),
          enabled: true,
          title: 'MCU load',
          collapsed: false,
          height: 200,
          icon: 'chip',
          axes: [{
            enabled: true,
            unit: '%',
            showLegend: true,
            min: 0,
            metrics: [
              { collector: '100 * (printer.mcu.last_stats.mcu_task_avg + 3 * printer.mcu.last_stats.mcu_task_stddev) / 0.0025', name: 'Load', style: { lineStyle: 'solid', lineColor: '#af52de', fillColor: null, fillOpacity: 0, displayLegend: true } },
              { collector: '100 * printer.mcu.last_stats.mcu_awake / 5', name: 'Awake', style: { lineStyle: 'dotted', lineColor: '#5e5ce6', fillColor: null, fillOpacity: 0, displayLegend: true } }
            ]
          }]
        }, {
          id: uuidv4(),
          enabled: true,
          title: 'Fans',
          collapsed: false,
          height: 200,
          icon: 'fan',
          axes: [{
            enabled: true,
            unit: '%',
            showLegend: true,
            min: 0,
            max: 100,
            metrics: [
              { collector: '100 * printer.fan.speed', name: 'Part fan', style: { lineStyle: 'solid', lineColor: '#34c759', fillColor: null, fillOpacity: 0, displayLegend: true } }
            ]
          }]
        }, {
          id: uuidv4(),
          enabled: true,
          title: 'Speed and flow',
          collapsed: false,
          height: 200,
          icon: 'motion',
          axes: [{
            enabled: true,
            unit: 'mm/s',
            showLegend: true,
            metrics: [{
              collector: 'printer.motion_report.live_velocity',
              name: 'Velocity',
              style: { lineStyle: 'solid', lineColor: '#2196f3', fillColor: null, fillOpacity: 0, displayLegend: true }
            }, {
              collector: 'printer.toolhead.max_velocity',
              name: 'Max Velocity',
              style: { lineStyle: 'dotted', lineColor: '#0075d2', fillColor: null, fillOpacity: 0, displayLegend: false }
            }]
          }, {
            enabled: true,
            unit: 'mm³/s',
            showLegend: true,
            max: 20,
            metrics: [{
              collector: 'printer.motion_report.live_extruder_velocity * Math.PI * ' +
                '(printer.configfile.settings.extruder.filament_diameter / 2) ** 2',
              name: 'Flow',
              style: { lineStyle: 'solid', lineColor: '#b12f36', fillColor: null, fillOpacity: 5, displayLegend: true }
            }, {
              collector: '12',
              name: 'Max Flow',
              style: { lineStyle: 'dashed', lineColor: '#820007', fillColor: null, fillOpacity: 0, displayLegend: false }
            }]
          }]
        }, {
          id: uuidv4(),
          enabled: true,
          title: 'Pressure and load cell',
          collapsed: false,
          height: 200,
          icon: 'sliders',
          axes: [{
            enabled: true,
            unit: 's',
            showLegend: true,
            metrics: [{
              collector: 'printer.extruder?.pressure_advance ?? null',
              name: 'Pressure advance',
              style: { lineStyle: 'solid', lineColor: '#ffd60a', fillColor: null, fillOpacity: 0, displayLegend: true }
            }]
          }, {
            enabled: true,
            unit: 'g',
            showLegend: true,
            metrics: [{
              collector: 'printer.load_cell?.force_g ?? null',
              name: 'Probe force',
              style: { lineStyle: 'solid', lineColor: '#ff9f0a', fillColor: null, fillOpacity: 0, displayLegend: true }
            }]
          }]
        }]
      } as DiagnosticsCardContainer
    }
  }
}

/** What a new chart, or a new line on one, starts as: the default Speed and flow chart's. */
export const newChartTemplate = (): DiagnosticsCardConfig => {
  const charts = defaultState().layouts.diagnostics.container1 as DiagnosticsCardConfig[]
  return charts.find(c => c.title === 'Speed and flow') ?? charts[0]
}

export const state = defaultState()
