import { test, expect } from '../fixtures'
import { PRESETS, usePrinter } from './printer'

for (const muon of [true, false]) {
  for (const dev of [false, true]) {
    test(`Reverse Z note: Muon=${muon}, Developer mode=${dev}`, async ({ page, open }, testInfo) => {
      const components = ['database', 'file_manager', 'klippy_apis', 'machine', ...(muon ? ['muon_protection', 'aux_api_proxy'] : [])]
      const printer = await usePrinter(page, PRESETS.idleHomed(), { components, ticks: false })
      await page.route('**/server/aux/dev_mode*', route => route.fulfill({ json: { enabled: dev, guard_armed: false } }))
      await open('/settings#toolhead')
      const settings = page.getByTestId('moving-settings')
      await expect(settings).toBeVisible()
      const note = settings.getByTestId('moving-no-reverse-z')
      if (muon) {
        await expect(note).toHaveText('On a Muon printer, Z direction is fixed to protect the plate.')
        await expect(note).toBeVisible()
        await expect(settings.getByTestId('moving-reverse-z')).toHaveCount(0)
      } else {
        await expect(note).toHaveCount(0)
        await expect(settings.getByTestId('moving-reverse-z')).toBeVisible()
      }
      if (!dev && process.env.E2E_SCREENSHOT_DIR) await settings.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/2022-${muon ? 'muon' : 'other'}-${testInfo.project.name}.png` })
      expect(printer.gcode).toEqual([])
      expect(printer.calls.filter(c => /^(printer\.(firmware_restart|restart|emergency_stop)|machine\.(reboot|shutdown))$/.test(c.method))).toEqual([])
    })
  }
}
