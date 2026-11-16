import { expect, it, vi } from 'vitest'
import { progressFavicon } from '../progress-favicon'

function stubCanvas () {
  const context = new Proxy({}, { get: () => () => undefined, set: () => true })
  const toDataURL = vi.fn((): string => `data:image/png;base64,${toDataURL.mock.calls.length}`)
  const create = vi.spyOn(document, 'createElement').mockImplementation(() => ({ getContext: () => context, toDataURL, width: 0, height: 0 }) as unknown as HTMLCanvasElement)
  return { toDataURL, create }
}

it('draws the icon once for a percentage, however often it is asked for', () => {
  const { toDataURL, create } = stubCanvas()
  const first = progressFavicon(42, '#abcdef')
  for (let i = 0; i < 50; i++) expect(progressFavicon(42, '#abcdef')).toBe(first)
  expect(toDataURL).toHaveBeenCalledTimes(1)
  create.mockRestore()
})

it('draws again when the percentage or the colour changes', () => {
  const { toDataURL, create } = stubCanvas()
  progressFavicon(10, '#111111')
  progressFavicon(11, '#111111')
  progressFavicon(11, '#222222')
  expect(toDataURL).toHaveBeenCalledTimes(3)
  create.mockRestore()
})
