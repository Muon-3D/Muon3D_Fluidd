import { test, expect, PRINTER } from '../fixtures'
import { overlay, PRESETS, usePrinter } from './printer'

for (const material of ['PETG', '']) {
  test(`shared filament information and idle actions match on both pages with ${material || 'no saved material'}`, async ({ page, open }, testInfo) => {
    const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), {
      save_variables: { variables: { muon_material: material, muon_material_colour: material ? '#336699' : '' } },
      extruder: { temperature: 24, can_extrude: false }
    }), { ticks: false })
    await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
    let information: string[] = []
    for (const path of ['/control', PRINTER]) {
      await open(path)
      const group = page.getByRole('group', { name: 'Filament information and actions', exact: true })
      await expect(group).toBeVisible()
      if (material) await expect(group.getByTestId('filament-type')).toHaveText(material)
      if (material) await expect(group.getByTestId('filament-swatch')).toHaveCSS('background-color', 'rgb(51, 102, 153)')
      const current = [await group.getByTestId('filament-type').innerText(), await group.getByTestId('filament-detail').innerText(), await group.getByTestId('filament-swatch').getAttribute('style') || '']
      if (!information.length) information = current
      else expect(current).toEqual(information)
      for (const name of ['Change filament', 'Load', 'Unload']) await expect(group.getByRole('button', { name, exact: true })).toBeVisible()
      await expect(group.getByRole('button', { name: /^Extrude by hand/ })).toHaveCount(path === '/control' ? 1 : 0)
      await group.getByRole('button', { name: 'Change filament', exact: true }).click()
      const panel = page.getByTestId('material-picker')
      await expect(panel).toBeVisible()
      await expect(page.getByTestId('material-load')).toBeVisible()
      await expect(page.getByTestId('material-unload')).toBeVisible()
      expect(printer.gcode).toEqual([])
      await panel.getByTestId('material-PETG').press('Escape')
      await expect(panel).toBeHidden()
      if (material && process.env.E2E_SCREENSHOT_DIR) await group.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/1712-${path === '/control' ? 'control' : 'overview'}-${testInfo.project.name}.png` })
    }
    expect(printer.calls.filter(c => /^printer\.(gcode\.script|emergency_stop|restart|firmware_restart|print\.)|^machine\.(reboot|services)/.test(c.method))).toEqual([])
  })
}
