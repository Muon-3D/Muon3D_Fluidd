/**
 * Overview: the live M1 shows the printer's plate, toolhead and Z column as
 * Harry's printer-state machine (Klipper's m1_machine) reports them, playing
 * each change, and goes by each sensor on a printer without it.
 *
 * The stage's element marks what the model last drew (M1Live.markDrawn):
 * data-plate, data-toolhead and data-column hold the clip's name while it
 * plays (remove, detach, fit…) and the state once it ends.
 *
 * The accurate model hangs headless Chromium's software WebGL, so on Windows
 * the browser gets the real GPU; elsewhere (CI) the page asks for the simple
 * model, which draws the same accessory timeline.
 */
import { test, expect } from '../fixtures'

// About the 3D stage: it needs WebGL, which the e2e fixtures turn off by default (KAN-2781).
test.use({ webgl: true })
import { usePrinter, PRESETS } from './printer'

// E2E_M1_SIMPLE=1 tries the simple model's path on Windows too.
const GPU = process.platform === 'win32' && process.env.E2E_M1_SIMPLE !== '1'

test.use({
  launchOptions: GPU ? { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } : {}
})

type Conditions = Record<string, unknown>

/** m1_machine's status, as klippy/extras/m1_machine.py get_status gives it. */
function machine (conditions: Conditions = {}) {
  return {
    m1_machine: {
      activity: 'idle',
      conditions: {
        column: 'locked',
        bed_power: 'ready',
        bed_power_reason: '',
        plate: 'present',
        toolhead: 'connected',
        hotend: 'ok',
        filament: 'present',
        fan_fault: false,
        plate_cleared: true,
        ...conditions
      },
      missing: {},
      ready: {},
      faults: [],
      pause_reason: null,
      plate_cleared: true,
      saved_fan: 0
    }
  }
}

test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

// On CI's phone project the stage never appears within 60 s (software WebGL); it passes locally on phone.
// Quarantined there until that is found (proj-3d, 7 Nov); desktop CI still runs both tests.
test.fixme(({ isMobile }) => isMobile && !!process.env.CI, 'the stage never appears on CI phone (software WebGL); passes locally')

test('the model plays the column, plate and toolhead as m1_machine reports them, and sends nothing', async ({ page, open }) => {
  test.setTimeout(150_000)
  const idle = PRESETS.idleHomed({ position: [100, 90, 40] })
  const printer = await usePrinter(page, { ...idle, ...machine() })
  await open('/')

  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(stage).toHaveAttribute('data-model', GPU ? 'accurate' : 'simple')
  await expect(stage).toHaveAttribute('data-state-source', 'm1_machine')
  await expect(stage).toHaveAttribute('data-column', 'locked')
  await expect(stage).toHaveAttribute('data-plate', 'on')
  await expect(stage).toHaveAttribute('data-toolhead', 'connected')

  // The stem lifted out, apart from the plate.
  printer.report({ ...idle, ...machine({ column: 'absent', bed_power: 'off' }) })
  await expect(stage).toHaveAttribute('data-played', /\bcolumn:remove\b/)
  await expect(stage).toHaveAttribute('data-plate', 'on')
  await expect(stage).toHaveAttribute('data-column', 'absent')

  // Fitted with its lever up, then locked.
  printer.report({ ...idle, ...machine({ column: 'unlocked', bed_power: 'off' }) })
  await expect(stage).toHaveAttribute('data-played', /\bcolumn:fit\b/)
  await expect(stage).toHaveAttribute('data-column', 'unlocked')
  printer.report({ ...idle, ...machine({ column: 'locked' }) })
  await expect(stage).toHaveAttribute('data-column', 'locked')

  // The plate off and back.
  printer.report({ ...idle, ...machine({ plate: 'absent' }) })
  await expect(stage).toHaveAttribute('data-played', /\bplate:remove\b/)
  await expect(stage).toHaveAttribute('data-plate', 'off')
  await expect(stage).toHaveAttribute('data-column', 'locked')
  printer.report({ ...idle, ...machine({ plate: 'present' }) })
  await expect(stage).toHaveAttribute('data-played', /\bplate:return-/)
  await expect(stage).toHaveAttribute('data-plate', 'on')

  // The toolhead unplugged and back.
  printer.report({ ...idle, ...machine({ toolhead: 'disconnected' }) })
  await expect(stage).toHaveAttribute('data-played', /\btoolhead:detach\b/)
  await expect(stage).toHaveAttribute('data-toolhead', 'disconnected')
  printer.report({ ...idle, ...machine({ toolhead: 'connected' }) })
  await expect(stage).toHaveAttribute('data-played', /\btoolhead:attach\b/)
  await expect(stage).toHaveAttribute('data-toolhead', 'connected')

  // The fan fault is marked on the stage (the model has no fan to show it on).
  printer.report({ ...idle, ...machine({ fan_fault: true }) })
  await expect(stage).toHaveAttribute('data-fan-fault', 'yes')

  // Display only: nothing went to the printer.
  expect(printer.gcode).toEqual([])
  expect(printer.calls.filter(c => c.method === 'printer.gcode.script')).toEqual([])
})

test('without m1_machine the model goes by each sensor', async ({ page, open }) => {
  test.setTimeout(150_000)
  const idle = PRESETS.idleHomed({ position: [100, 90, 40] })
  const sensors = (bedRemoved: boolean, toolheadGone: boolean) => ({
    ...idle,
    bed_removal_detector: { bedRemoved },
    'mcu toolhead': { non_critical_disconnected: toolheadGone }
  })
  const printer = await usePrinter(page, sensors(false, false))
  await open('/')

  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(stage).toHaveAttribute('data-state-source', 'sensors')
  await expect(stage).toHaveAttribute('data-plate', 'on')

  printer.report(sensors(true, false))
  await expect(stage).toHaveAttribute('data-plate', 'off')
  printer.report(sensors(true, true))
  await expect(stage).toHaveAttribute('data-toolhead', 'disconnected')
  // No column sensing on these printers: shown fitted.
  await expect(stage).toHaveAttribute('data-column', 'locked')
  expect(printer.gcode).toEqual([])
})
