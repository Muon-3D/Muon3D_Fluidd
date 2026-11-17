import { expect, it } from 'vitest'
import { finishPoint, heatBands, heatState } from '../heat-stripe'
import type { ChartPoint } from '../model'

const now = 1800000000000
const sample = (seconds: number, temperature: number, target = 200): ChartPoint => ({ date: new Date(now + seconds * 1000), extruder: temperature, extruderTarget: target })

it.each([[20, 0, 'cold'], [220, 0, 'cold'], [100, 200, 'heating'], [194.9, 200, 'heating'], [195, 200, 'ready'], [205, 200, 'ready'], [205.1, 200, 'over']])('classifies %s / %s as %s', (temperature, target, state) => {
  expect(heatState(temperature as number, target as number)).toBe(state)
})

it('keeps ten minutes, orders reports oldest to newest and uses each reported target', () => {
  const points = [sample(0, 220), sample(-601, 200), sample(-600, 200), sample(-599, 20, 0), sample(-2, 150), sample(-1, 200), sample(1, 100)]
  const bands = heatBands(points, 'extruder', now)
  expect(bands.map(b => b.state)).toEqual(['cold', 'heating', 'ready', 'over'])
  expect(bands.map(b => b.x)).toEqual([0, 597, 598, 599])
  expect(bands.at(-1)).toMatchObject({ width: 1, temperature: 220, target: 200 })
})

it('coalesces adjacent equal states without filling missing seconds', () => {
  expect(heatBands([sample(-4, 150), sample(-3, 151), sample(0, 152)], 'extruder', now).map(b => [b.x, b.width])).toEqual([[595, 2], [599, 1]])
})

it('ignores empty, malformed, missing-target, unrelated and non-finite readings', () => {
  for (const points of [[], [{ date: new Date(), heater_bed: 60 }], [sample(0, NaN)], [sample(0, 10, Infinity)], [{ date: new Date(NaN), extruder: 10, extruderTarget: 200 }], [{ ...sample(0, 10), extruderTarget: undefined }] as unknown as ChartPoint[]]) {
    expect(heatBands(points, 'extruder', now)).toEqual([])
  }
})

it('the last report wins for a repeated timestamp', () => {
  expect(heatBands([sample(0, 100), sample(0, 200)], 'extruder', now)).toEqual([{ x: 599, width: 1, state: 'ready', temperature: 200, target: 200 }])
})

it.each([[0, 32, 11], [6, 53, 32], [12, 32, 53], [18, 11, 32]])('puts %s:00 at its 24-hour dial position', (hour, x, y) => {
  const point = finishPoint(new Date(2026, 10, 12, hour, 0).getTime())!
  expect(point.x).toBeCloseTo(x)
  expect(point.y).toBeCloseTo(y)
  expect(point.label).toContain('2026')
})

it.each([null, NaN, Infinity, 1e20])('has no made-up finish for %s', eta => {
  expect(finishPoint(eta)).toBeNull()
})
