import { afterEach, describe, expect, it, vi } from 'vitest'
import { forgetGrantedRole, grantedRoleFor, readGrantedRole } from '../granted-role'

// 17.1 review: one failed read of the Operator grant left the phone read-only for the whole open.
const ID = 'a1b2c3d4'.repeat(8)
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const NO_WAIT = { delaysMs: [0, 0] }

afterEach(() => forgetGrantedRole(ID))

describe('reading the grant again after a transient failure', () => {
  it('gets the Operator grant on the 3rd try after two failed reads', async () => {
    const fetchPath = vi.fn()
      .mockRejectedValueOnce(new Error('link dropped'))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(ok({ entry: 'open' }))
    expect(await readGrantedRole(ID, fetchPath, NO_WAIT)).toBe('operator')
    expect(fetchPath).toHaveBeenCalledTimes(3)
    expect(grantedRoleFor(ID)).toBe('operator')
  })

  it('gives up after 3 tries and grants nothing', async () => {
    const fetchPath = vi.fn().mockRejectedValue(new Error('gone'))
    expect(await readGrantedRole(ID, fetchPath, NO_WAIT)).toBeNull()
    expect(fetchPath).toHaveBeenCalledTimes(3)
    expect(grantedRoleFor(ID)).toBeNull()
  })

  it('waits between tries', async () => {
    vi.useFakeTimers()
    try {
      const fetchPath = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(ok({ entry: 'open' }))
      const done = readGrantedRole(ID, fetchPath)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchPath).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(400)
      expect(await done).toBe('operator')
    } finally {
      vi.useRealTimers()
    }
  })

  // Negative controls: an answer from the printer is final, and is never asked again hoping for more.
  it('never retries a protected printer, and it never gets a role', async () => {
    const fetchPath = vi.fn().mockResolvedValue(ok({ entry: 'protected' }))
    expect(await readGrantedRole(ID, fetchPath, NO_WAIT)).toBeNull()
    expect(fetchPath).toHaveBeenCalledTimes(1)
  })

  it('never retries a refusal (403), and it never gets a role', async () => {
    const fetchPath = vi.fn().mockResolvedValue(new Response('{"entry":"open"}', { status: 403 }))
    expect(await readGrantedRole(ID, fetchPath, NO_WAIT)).toBeNull()
    expect(fetchPath).toHaveBeenCalledTimes(1)
    expect(grantedRoleFor(ID)).toBeNull()
  })

  it('a re-read after a reconnect keeps a held grant through a failed read, and drops it when the printer says protected', async () => {
    await readGrantedRole(ID, async () => ok({ entry: 'open' }), NO_WAIT)
    await readGrantedRole(ID, async () => { throw new Error('gone') }, { ...NO_WAIT, keep: true })
    expect(grantedRoleFor(ID)).toBe('operator')
    await readGrantedRole(ID, async () => ok({ entry: 'protected' }), { ...NO_WAIT, keep: true })
    expect(grantedRoleFor(ID)).toBeNull()
  })
})
