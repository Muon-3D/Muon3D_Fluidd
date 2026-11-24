import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOKEN_KEY } from '@/services/muon-cloud/api'
import { AdminError, adminAvailable, BACKGROUND_HEADER } from '../client'
import { endpointMissing, obs, obsFailure } from '../obs'
import { countdown, formatValue } from '../format'
import { isStaff, staffLevel } from '../membership'
import { cloudState } from '@/services/muon-cloud/state'
import { ABSOLUTE_WARN_S, IDLE_WARN_S, TOUCH_EVERY_MS, absoluteLeft, apply, confirm, end, idleLeft, inferReason, load, noteFailure, noteInput, portal, resetForTests, showsPortal, stay, tick, touchIfActive, warning } from '../session'

const reply = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => (body === undefined ? '' : JSON.stringify(body)) })
const SECOND = 1000
const at = (offsetS: number, base = Date.now()) => Math.floor(base / SECOND) + offsetS
const session = (abs: number, idle: number, base = Date.now()) => ({ actor: 'staff', staff_expires_at: at(abs, base), staff_idle_expires_at: at(idle, base), server_time: Math.floor(base / SECOND) })

beforeEach(() => {
  vi.stubGlobal('location', new URL('https://control.muon3d.com/admin'))
  localStorage.setItem(TOKEN_KEY, 'ordinary-session')
  resetForTests()
  cloudState.ready = true
  cloudState.account = { id: 'a1', email: 'jack@example.test', name: 'Jack', created_at: 1, staff: true }
})
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('the two session limits (D-204)', () => {
  it('warns 2 minutes before the idle limit and 5 minutes before the absolute limit, idle first', () => {
    const base = Date.now()
    apply(session(3600, 900, base), base)
    expect(warning()).toBe('')
    portal.now = base + (900 - IDLE_WARN_S + 1) * SECOND
    expect(warning()).toBe('idle')
    apply(session(ABSOLUTE_WARN_S - 1, 900, base), base)
    expect(warning()).toBe('absolute')
    apply(session(ABSOLUTE_WARN_S - 1, 60, base), base)
    expect(warning()).toBe('idle')
  })
  it('reads both limits against the console clock, not the browser clock', () => {
    const base = Date.now()
    apply({ actor: 'staff', staff_expires_at: Math.floor(base / SECOND) + 3600 + 600, staff_idle_expires_at: Math.floor(base / SECOND) + 900 + 600, server_time: Math.floor(base / SECOND) + 600 }, base)
    expect(Math.round(absoluteLeft())).toBe(3600)
    expect(Math.round(idleLeft())).toBe(900)
  })
  it('ends the session on whichever limit passes first, and keeps the page (phase ended, not signed out)', () => {
    const base = Date.now()
    apply(session(3600, 900, base), base)
    tick(base + 899 * SECOND)
    expect(portal.phase).toBe('open')
    tick(base + 901 * SECOND)
    expect(portal.phase).toBe('ended')
    expect(portal.endReason).toBe('idle')
    expect(showsPortal(portal.phase)).toBe(true)
    apply(session(600, 900, base), base)
    tick(base + 601 * SECOND)
    expect(portal.endReason).toBe('absolute')
  })
  it('infers the limit from the clocks only when the console did not say', () => {
    expect(inferReason({ absoluteEnd: 10, idleEnd: 20 })).toBe('absolute')
    expect(inferReason({ absoluteEnd: 30, idleEnd: 20 })).toBe('idle')
  })
  it('uses the console\'s reason when a call fails, and a lapsed session never reads as signed out', () => {
    apply(session(3600, 900))
    expect(noteFailure(new AdminError('x', 403, true, 'console.staff.reauth_required', 'idle'))).toBe(true)
    expect(portal.phase).toBe('ended'); expect(portal.endReason).toBe('idle')
    resetForTests(); apply(session(3600, 900))
    noteFailure(new AdminError('x', 403, true, 'console.staff.reauth_required', 'ended'))
    expect(portal.endReason).toBe('ended')
    resetForTests(); apply(session(3600, 900))
    noteFailure(new AdminError('x', 403, false, 'console.staff.required'))
    expect(portal.phase).toBe('not-staff')
    resetForTests(); apply(session(3600, 900))
    noteFailure(new AdminError('x', 401, true))
    expect(portal.phase).toBe('signed-out')
  })
  it('a console without the idle limit shows only the absolute one', () => {
    apply({ actor: 'staff', staff_expires_at: at(3600) })
    expect(warning()).toBe('')
    tick(Date.now() + 3000 * SECOND)
    expect(portal.phase).toBe('open')
  })
})

describe('activity: at most one touch a minute, only after input', () => {
  it('sends nothing without input, one touch with it, and not again inside the minute', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(session(3500, 900)))
    vi.stubGlobal('fetch', fetch)
    const base = Date.now()
    apply(session(3600, 600, base), base)
    await touchIfActive(base + TOUCH_EVERY_MS + 1)
    expect(fetch).not.toHaveBeenCalled()
    noteInput()
    await touchIfActive(base + TOUCH_EVERY_MS - 1)
    expect(fetch).not.toHaveBeenCalled()
    await touchIfActive(base + TOUCH_EVERY_MS + 1)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe('https://control.muon3d.com/v1/admin/session/touch')
    expect(fetch.mock.calls[0][1].headers[BACKGROUND_HEADER]).toBeUndefined()
    noteInput()
    await touchIfActive(Date.now() + 1000)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('"Stay signed in" counts at once', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(session(3000, 900)))
    vi.stubGlobal('fetch', fetch)
    apply(session(3600, 60))
    await stay()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(Math.round(idleLeft())).toBe(900)
  })
  it('reads the session as a background call that never counts as activity', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(session(3600, 900)))
    vi.stubGlobal('fetch', fetch)
    await load()
    expect(fetch.mock.calls[0][0]).toBe('https://control.muon3d.com/v1/admin/session')
    expect(fetch.mock.calls[0][1].headers[BACKGROUND_HEADER]).toBe('1')
    expect(portal.phase).toBe('open')
  })
})

describe('the states', () => {
  it.each([
    [403, 'console.staff.required', 'not-staff'],
    [403, 'console.staff.reauth_required', 'not-confirmed']
  ])('maps %s %s to %s with no passkey prompt', async (status, code, phase) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ code }, status as number)))
    await load()
    expect(portal.phase).toBe(phase)
  })
  it('signed out with no stored token asks nothing', async () => {
    localStorage.clear()
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await load()
    expect(portal.phase).toBe('signed-out'); expect(fetch).not.toHaveBeenCalled()
  })
  it('a console that cannot be reached is not "Staff only"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await load()
    expect(portal.phase).toBe('unreachable')
  })
  it('409 from the passkey options is "Add a passkey first"; a cancelled ceremony stays on the card', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ code: 'console.passkey.none' }, 409)))
    await confirm()
    expect(portal.phase).toBe('no-passkey')
    resetForTests()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ ceremony_id: 'c', options: { publicKey: { challenge: 'YQ' } }, expires_at: Date.now() / 1000 + 60 })))
    vi.stubGlobal('navigator', { credentials: { get: async () => { throw new DOMException('no', 'NotAllowedError') } } })
    portal.phase = 'not-confirmed'
    await confirm()
    expect(portal.phase).toBe('not-confirmed'); expect(portal.failed).toBe(true)
  })
  it('End session ends the staff session only, and keeps the page', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(undefined, 204))
    vi.stubGlobal('fetch', fetch)
    apply(session(3600, 900))
    await end()
    expect(fetch.mock.calls[0][0]).toBe('https://control.muon3d.com/v1/admin/session/end')
    expect(portal.phase).toBe('ended'); expect(portal.endReason).toBe('ended')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('ordinary-session')
  })
})

describe('the staff signal from GET /v1/me (KAN-6113)', () => {
  it('reads true or "staff" as staff; "moderator", false, absent and anything else as not staff', () => {
    expect(isStaff({ staff: true })).toBe(true); expect(isStaff({ staff: 'staff' })).toBe(true)
    for (const staff of [false, 'moderator', 'admin', undefined, 1]) expect(isStaff({ staff: staff as never })).toBe(false)
    expect(staffLevel({ staff: 'moderator' })).toBe('moderator'); expect(isStaff(null)).toBe(false)
  })
  it('the guard shows "Staff only" with no request when the account is not staff or the console sends nothing', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    cloudState.account = { id: 'a1', email: 'x@example.test', name: 'X', created_at: 1 }
    await load()
    expect(portal.phase).toBe('not-staff'); expect(fetch).not.toHaveBeenCalled()
    cloudState.account = { id: 'a1', email: 'x@example.test', name: 'X', created_at: 1, staff: 'moderator' }
    await load()
    expect(portal.phase).toBe('not-staff'); expect(fetch).not.toHaveBeenCalled()
  })
  it('a local development console counts as hosted Control; a printer's own page does not', () => {
    expect(adminAvailable('http://localhost:8080/admin', 'http://localhost:8080')).toBe(true)
    expect(adminAvailable('http://localhost:8080/admin', 'https://control.muon3d.com')).toBe(false)
    expect(adminAvailable('http://m1.local/admin', 'http://m1.local')).toBe(false)
  })
})

describe('the data client', () => {
  it('sends panel ids only, as a background call when asked, and never PromQL', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ step_s: 30, results: {} }))
    vi.stubGlobal('fetch', fetch)
    await obs.query({ panels: ['ov-rps'], range: '6h' }, true)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://control.muon3d.com/v1/admin/obs/query')
    expect(init.headers[BACKGROUND_HEADER]).toBe('1')
    expect(JSON.parse(init.body)).toEqual({ panels: ['ov-rps'], range: '6h' })
  })
  it('treats a console without the endpoints as "not available", not as a failure of the session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ error: 'not found' }, 404)))
    const error = await obs.catalog().catch(e => e)
    expect(endpointMissing(error)).toBe(true)
    expect(obsFailure(error).missing).toBe(true)
    expect(noteFailure(error)).toBe(false)
    expect(obsFailure(new AdminError('x', 503, false, 'console.obs.unavailable')).missing).toBe(false)
  })
})

describe('formatting', () => {
  it('counts down as m:ss under ten minutes and mm:ss above', () => {
    expect(countdown(59 * 60 + 55)).toBe('59:55'); expect(countdown(9 * 60 + 5)).toBe('9:05'); expect(countdown(-3)).toBe('0:00')
  })
  it('formats durations, bytes and ratios', () => {
    expect(formatValue(250, 'ms')).toBe('250 ms'); expect(formatValue(1500, 'ms')).toBe('1.5 s')
    expect(formatValue(1536, 'bytes')).toBe('1.5 KiB'); expect(formatValue(0.456, '%')).toBe('0.46 %'); expect(formatValue(null)).toBe('—')
  })
})

describe('one staff session covers every action (D-204)', () => {
  const command = { command: '0123456789abcdef0123456789abcdef', action: 'hide', target: 'case-1', version: 3, reason: 'Review unsafe content', details: {} }
  it('a staff action asks for no second passkey while the session is open, and does when it is not', async () => {
    const { staffCommand } = await import('../client')
    const fetch = vi.fn().mockResolvedValue(reply({ saved: true }))
    vi.stubGlobal('fetch', fetch)
    apply(session(3600, 900))
    await staffCommand(command)
    expect(fetch.mock.calls.map(c => c[0])).toEqual(['https://control.muon3d.com/v1/admin/community'])
    resetForTests()
    fetch.mockReset()
    vi.stubGlobal('navigator', { credentials: { get: async () => { throw new DOMException('no', 'NotAllowedError') } } })
    fetch.mockResolvedValueOnce(reply({ ceremony_id: 'c', options: { publicKey: { challenge: 'YQ' } }, expires_at: Date.now() / 1000 + 60 }))
    await expect(staffCommand(command)).rejects.toBeTruthy()
    expect(fetch.mock.calls[0][0]).toBe('https://control.muon3d.com/v1/me/reauth/passkey/options')
  })
})
