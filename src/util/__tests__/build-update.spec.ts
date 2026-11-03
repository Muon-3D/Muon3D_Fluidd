import { describe, expect, it, vi } from 'vitest'
import { fetchBuildCommit, watchForNewBuild } from '../build-update'

const RUNNING = 'a'.repeat(40)
const NEWER = 'b'.repeat(40)

describe('fetchBuildCommit', () => {
  it('reads build-info.json past every cache', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ commit: NEWER })))
    expect(await fetchBuildCommit(fetcher as any)).toBe(NEWER)
    expect(fetcher).toHaveBeenCalledWith('/build-info.json', { cache: 'no-store' })
  })

  it('returns null when the file is missing or not JSON', async () => {
    expect(await fetchBuildCommit((async () => new Response('x', { status: 404 })) as any)).toBeNull()
    expect(await fetchBuildCommit((async () => new Response('<html>')) as any)).toBeNull()
    expect(await fetchBuildCommit((async () => { throw new TypeError('offline') }) as any)).toBeNull()
  })
})

describe('watchForNewBuild', () => {
  const setup = (served: () => string | null) => {
    const doc = new EventTarget() as Document & { visibilityState: string }
    ;(doc as any).visibilityState = 'visible'
    const win = new EventTarget() as Window
    const onNewer = vi.fn()
    const update = vi.fn(async () => {})
    const stop = watchForNewBuild({
      running: RUNNING, check: async () => served(), onNewer, update, doc, win, intervalMs: 1000
    })
    return { doc, win, onNewer, update, stop }
  }

  it('reports a different build when the window gets focus, and asks the worker to update', async () => {
    const { win, onNewer, update, stop } = setup(() => NEWER)
    win.dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect(onNewer).toHaveBeenCalledWith(NEWER))
    expect(update).toHaveBeenCalled()
    stop()
  })

  it('checks when the tab becomes visible and on the interval', async () => {
    vi.useFakeTimers()
    let served = RUNNING
    const { doc, onNewer, stop } = setup(() => served)
    doc.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(onNewer).not.toHaveBeenCalled()
    served = NEWER
    await vi.advanceTimersByTimeAsync(1000)
    expect(onNewer).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(onNewer).toHaveBeenCalledTimes(1)
    stop()
    vi.useRealTimers()
  })

  it('ignores an unreadable answer', async () => {
    const { win, onNewer, stop } = setup(() => null)
    win.dispatchEvent(new Event('focus'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(onNewer).not.toHaveBeenCalled()
    stop()
  })
})
