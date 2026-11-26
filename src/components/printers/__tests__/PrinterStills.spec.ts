import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PrinterStage from '../PrinterStage.vue'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'

const root = path.resolve(__dirname, '../../../..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')
const stills = ['idle', 'printing'].flatMap(state => [`m1-accurate-${state}.webp`, `m1-accurate-${state}-thumb.webp`])

describe('printer preview stills (control-polish 4.2)', () => {
  it('PrinterStage and PrinterThumb import the accurate-model stills, not the old JPGs', () => {
    for (const file of ['src/components/printers/PrinterStage.vue', 'src/components/ui/PrinterThumb.vue']) {
      const source = read(file)
      expect(source).toMatch(/m1-accurate-idle(-thumb)?\.webp/)
      expect(source).toMatch(/m1-accurate-printing(-thumb)?\.webp/)
      expect(source).not.toMatch(/m1\/m1-(idle|printing|offline)(-thumb)?\.jpg/)
      expect(source).not.toContain('mix-blend-mode')
    }
  })

  it('the stills exist within the spec budget and the old JPGs are gone', () => {
    for (const file of stills) {
      const size = statSync(path.join(root, 'src/assets/m1', file)).size
      expect(size).toBeGreaterThan(500)
      expect(size).toBeLessThanOrEqual(file.includes('thumb') ? 4 * 1024 : 60 * 1024)
    }
    for (const old of ['idle', 'printing', 'offline']) {
      expect(() => statSync(path.join(root, `src/assets/m1/m1-${old}.jpg`))).toThrow()
      expect(() => statSync(path.join(root, `src/assets/m1/m1-${old}-thumb.jpg`))).toThrow()
    }
  })

  it('the stage CSS reads the theme tokens', () => {
    const css = read('src/components/printers/PrinterStage.vue')
    for (const token of ['--m3d-stage-hi', '--m3d-stage-glow', '--m3d-stage-grid', '--m3d-stage-shadow']) expect(css).toContain(token)
    const theme = read('src/scss/muon3d.scss')
    for (const token of ['--m3d-stage-grid', '--m3d-stage-glow', '--m3d-stage-shadow']) expect(theme.split(token).length - 1).toBe(2)
  })

  it('each state shows a still; offline reuses the idle one', () => {
    const src = (component: any, state: string) => mount(component, { propsData: { state } }).find('img').attributes('src')
    for (const component of [PrinterStage, PrinterThumb]) {
      expect(src(component, 'idle')).not.toBe(src(component, 'printing'))
      expect(src(component, 'offline')).toBe(src(component, 'idle'))
    }
  })
})
