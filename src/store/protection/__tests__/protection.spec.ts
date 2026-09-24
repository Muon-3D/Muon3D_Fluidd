import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isLockedPath,
  isProtectedSurface,
  moonrakerErrorMessage,
  parseProtectionStatus
} from '../helpers'
import { getters } from '../getters'
import { actions } from '../actions'
import { actions as socketActions } from '@/store/socket/actions'
import { actions as versionActions } from '@/store/version/actions'
import type { ProtectionState, ProtectionStatus } from '../types'

const socket = vi.hoisted(() => ({
  serverMuonGetProtection: vi.fn(),
  machineUpdateStatus: vi.fn(),
  serverInfo: vi.fn()
}))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const emit = vi.hoisted(() => vi.fn())
vi.mock('@/eventBus', () => ({ EventBus: { $emit: emit } }))

/** Moonraker's answer, exactly as `server.muon.get_protection` returns it. */
const moonraker = (level: unknown, callerHasIdentity = false) => ({
  level,
  name: level === 1 ? 'protected' : 'open',
  protected_surfaces: ['/server/aux', '/machine/update'],
  excluded_surfaces: ['/server/aux/dev_mode'],
  caller_has_identity: callerHasIdentity,
  changeable_by_caller: false
})

const status = (level: 0 | 1, callerHasIdentity = false): ProtectionStatus =>
  parseProtectionStatus(moonraker(level, callerHasIdentity)) as ProtectionStatus

const call = (action: unknown, context: object, payload?: unknown) =>
  (action as (context: object, payload?: unknown) => Promise<void>)(context, payload)

/**
 * The protection getters against a state, live as Vuex's are: an action that
 * reads a getter after a commit sees the committed state.
 */
const gettersFor = (state: ProtectionState) => ({
  get isProtected (): boolean { return (getters.isProtected as any)(state) },
  get isLocked (): boolean { return (getters.isLocked as any)(state) }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('parseProtectionStatus', () => {
  it("reads Moonraker's answer", () => {
    expect(parseProtectionStatus(moonraker(1))).toEqual({
      level: 1,
      name: 'protected',
      protectedSurfaces: ['/server/aux', '/machine/update'],
      excludedSurfaces: ['/server/aux/dev_mode'],
      callerHasIdentity: false,
      changeableByCaller: false
    })
  })

  it('refuses anything that is not exactly a level', () => {
    // A notice drawn from a guess is worse than none: `true` or "1" must not
    // render as protected, and an unknown level must not render as open.
    for (const level of [2, -1, '1', true, null, undefined, 1.5]) {
      expect(parseProtectionStatus(moonraker(level))).toBeNull()
    }
    expect(parseProtectionStatus(null)).toBeNull()
    expect(parseProtectionStatus('protected')).toBeNull()
  })

  it('reads identity as absent unless Moonraker said true', () => {
    expect(parseProtectionStatus({ level: 1 })?.callerHasIdentity).toBe(false)
    expect(parseProtectionStatus({ ...moonraker(1), caller_has_identity: 'yes' })?.callerHasIdentity).toBe(false)
  })
})

describe('which surfaces are protected', () => {
  it.each([
    ['/server/aux', true],
    ['/server/aux/wifi/scan', true],
    ['machine.update.status', true],
    ['machine.update.upgrade', true],
    ['/server/aux/dev_mode', false],
    ['/server/aux/dev_mode/enable', false],
    // A sibling that shares the spelling is not below the prefix.
    ['/server/auxiliary', false],
    ['/machine/updates', false],
    ['printer.gcode.script', false],
    ['server.muon.get_protection', false]
  ])('%s -> %s', (path, expected) => {
    expect(isProtectedSurface(status(1), path)).toBe(expected)
    // Before Moonraker has answered, the shipped list is assumed.
    expect(isProtectedSurface(null, path)).toBe(expected)
  })

  it("follows Moonraker's list once it has one", () => {
    const narrower = { ...status(1), protectedSurfaces: ['/machine/update'] }
    expect(isProtectedSurface(narrower, '/server/aux/wifi/scan')).toBe(false)
  })

  it('locks a browser only at Level 1, and never a paired one', () => {
    expect(isLockedPath(status(0), '/server/aux/wifi/scan')).toBe(false)
    expect(isLockedPath(status(1, true), '/server/aux/wifi/scan')).toBe(false)
    expect(isLockedPath(status(1), '/server/aux/wifi/scan')).toBe(true)
    expect(isLockedPath(status(1), '/server/aux/dev_mode')).toBe(false)
    expect(isLockedPath(null, '/server/aux/wifi/scan')).toBe(false)
  })
})

describe('moonrakerErrorMessage', () => {
  it("prefers Moonraker's reason, then the Aux API's, then the status line", () => {
    const moonrakerRefusal = {
      response: { statusText: 'Forbidden', data: { error: { message: 'is protected on this printer' } } }
    }
    expect(moonrakerErrorMessage(moonrakerRefusal)).toBe('is protected on this printer')
    expect(moonrakerErrorMessage({ response: { statusText: 'Conflict', data: { detail: 'busy' } } })).toBe('busy')
    expect(moonrakerErrorMessage({ response: { statusText: 'Forbidden', data: {} } })).toBe('Forbidden')
    expect(moonrakerErrorMessage(new Error('Network Error'))).toBe('Network Error')
  })

  it('never answers with an empty string', () => {
    expect(moonrakerErrorMessage({ response: { statusText: '', data: { error: { message: ' ' } } }, message: 'fallback' }))
      .toBe('fallback')
  })
})

describe('the protection store', () => {
  it('is locked only when protected and this browser has no identity', () => {
    expect(gettersFor({ supported: true, status: status(0) })).toEqual({ isProtected: false, isLocked: false })
    expect(gettersFor({ supported: true, status: status(1) })).toEqual({ isProtected: true, isLocked: true })
    expect(gettersFor({ supported: true, status: status(1, true) })).toEqual({ isProtected: true, isLocked: false })
    expect(gettersFor({ supported: null, status: null })).toEqual({ isProtected: false, isLocked: false })
  })

  it('asks Moonraker for the level when the component is there', async () => {
    const commit = vi.fn()
    await call(actions.init, { commit })
    expect(commit).toHaveBeenCalledWith('setSupported', true)
    expect(socket.serverMuonGetProtection).toHaveBeenCalledTimes(1)
  })

  it('reloads the update panel when this browser stops being locked out', async () => {
    const state: ProtectionState = { supported: true, status: status(1) }
    const context = {
      commit: (_: string, payload: ProtectionStatus | null) => { state.status = payload },
      dispatch: vi.fn(),
      getters: gettersFor(state),
      rootGetters: { 'server/componentSupport': (name: string) => name === 'update_manager' }
    }

    await call(actions.onStatus, context, moonraker(0))
    expect(context.dispatch).toHaveBeenCalledWith('version/init', undefined, { root: true })

    context.dispatch.mockClear()
    await call(actions.onStatus, context, moonraker(0))
    expect(context.dispatch).not.toHaveBeenCalled()

    await call(actions.onStatus, context, moonraker(1))
    expect(context.dispatch).not.toHaveBeenCalled()
  })

  it('asks for the level again after a refusal, where the component exists', async () => {
    const dispatch = vi.fn()
    await call(actions.onRefused, { dispatch, state: { supported: true, status: null } })
    expect(dispatch).toHaveBeenCalledWith('init')

    dispatch.mockClear()
    await call(actions.onRefused, { dispatch, state: { supported: null, status: null } })
    expect(dispatch).not.toHaveBeenCalled()
  })
})

describe('a refusal on the socket', () => {
  const refusal = (method: string) => {
    const payload = { code: 403, message: `'/${method.split('.').join('/')}' is protected on this printer.` }
    Object.defineProperty(payload, '__request__', { enumerable: false, value: { id: 1, method } })
    return payload
  }
  const context = (supported: boolean | null) => ({
    commit: vi.fn(),
    dispatch: vi.fn(),
    rootState: { protection: { supported, status: supported ? status(1) : null } }
  })

  it("does not toast the update panel's background status request", async () => {
    const ctx = context(true)
    await call(socketActions.onSocketError, ctx, refusal('machine.update.status'))
    expect(emit).not.toHaveBeenCalled()
    expect(ctx.dispatch).toHaveBeenCalledWith('protection/onRefused', undefined, { root: true })
  })

  it("toasts Moonraker's reason for something the user asked for", async () => {
    const ctx = context(true)
    await call(socketActions.onSocketError, ctx, refusal('machine.update.upgrade'))
    expect(emit).toHaveBeenCalledWith("'/machine/update/upgrade' is protected on this printer.", { type: 'error' })
    expect(ctx.dispatch).toHaveBeenCalledWith('protection/onRefused', undefined, { root: true })
  })

  it('leaves an older image alone, where the floor refused updates outright', async () => {
    const ctx = context(null)
    await call(socketActions.onSocketError, ctx, refusal('machine.update.status'))
    expect(emit).toHaveBeenCalledTimes(1)
    expect(ctx.dispatch).not.toHaveBeenCalled()
  })

  it('leaves a 403 on anything unprotected to the existing path', async () => {
    const ctx = context(true)
    await call(socketActions.onSocketError, ctx, refusal('printer.gcode.script'))
    expect(emit).toHaveBeenCalledTimes(1)
    expect(ctx.dispatch).not.toHaveBeenCalled()
  })
})

describe('the update panel', () => {
  it('does not ask for update status while this browser is locked out', async () => {
    await call(versionActions.init, { rootGetters: { 'protection/isLocked': true } })
    expect(socket.machineUpdateStatus).not.toHaveBeenCalled()

    await call(versionActions.init, { rootGetters: { 'protection/isLocked': false } })
    expect(socket.machineUpdateStatus).toHaveBeenCalledTimes(1)
  })
})
