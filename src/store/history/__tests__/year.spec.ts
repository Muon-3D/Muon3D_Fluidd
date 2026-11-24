import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { mutations } from '../mutations'
import { getters } from '../getters'
import { defaultState } from '../state'
import type { HistoryState } from '../types'
import { SocketActions } from '@/api/socketActions'

vi.mock('@/api/socketActions', () => ({
  SocketActions: { serverHistoryYear: vi.fn(), serverHistoryList: vi.fn(), serverHistoryTotals: vi.fn() }
}))

type Fn = (...args: any[]) => any

/** A store of just this module: state, its mutations, and actions that can dispatch to each other. */
function makeStore () {
  const state: HistoryState = defaultState()
  const commit = (name: string, payload?: unknown) => (mutations as Record<string, Fn>)[name](state, payload)
  const dispatch = (name: string, payload?: unknown) => (actions as Record<string, Fn>)[name]({ state, commit, dispatch }, payload)
  return { state, commit, dispatch }
}

const asked = () => (SocketActions.serverHistoryYear as unknown as ReturnType<typeof vi.fn>).mock.calls

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 12, 15))
  asked().length = 0
  ;(SocketActions.serverHistoryYear as unknown as ReturnType<typeof vi.fn>).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loading the year', () => {
  it('starts idle, then loading once asked, with the first Monday and the limit', async () => {
    const s = makeStore()
    expect(s.state.yearStatus).toBe('idle')
    await s.dispatch('loadYear')
    expect(s.state.yearStatus).toBe('loading')
    expect(asked()).toHaveLength(1)
    expect(asked()[0][1]).toBe(5000)
    expect(asked()[0][0]).toBe(new Date(2025, 10, 10).getTime() / 1000)
  })

  it('is ready when the list arrives, and keeps its count', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', { count: 6200, jobs: [{ job_id: 'a' }] })
    expect(s.state.yearStatus).toBe('ready')
    expect(s.state.yearJobs).toHaveLength(1)
    expect(s.state.yearCount).toBe(6200)
    expect(s.state.yearDay).toBe('2026-11-12')
    expect((getters.getYear as Fn)(s.state)).toEqual({ status: 'ready', count: 6200 })
  })

  it('does not ask again on a later visit or reconnect the same day', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', { count: 1, jobs: [{ job_id: 'a' }] })
    await s.dispatch('loadYear')
    await s.dispatch('loadYear')
    expect(asked()).toHaveLength(1)
  })

  it('does not ask twice while a request is out', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('loadYear')
    expect(asked()).toHaveLength(1)
  })

  it('asks again when the date has rolled over, still showing the old year meanwhile', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', { count: 1, jobs: [{ job_id: 'a' }] })
    vi.setSystemTime(new Date(2026, 10, 13, 9))
    await s.dispatch('loadYear')
    expect(asked()).toHaveLength(2)
    expect(s.state.yearStatus).toBe('ready')
    expect(s.state.yearJobs).toHaveLength(1)
  })

  it('is an error when there is no answer in 15 seconds, and Retry asks again', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    vi.advanceTimersByTime(14_000)
    expect(s.state.yearStatus).toBe('loading')
    vi.advanceTimersByTime(1500)
    expect(s.state.yearStatus).toBe('error')
    await s.dispatch('loadYear', { force: true })
    expect(s.state.yearStatus).toBe('loading')
    expect(asked()).toHaveLength(2)
  })

  it('is an error when the reply has no list', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', {})
    expect(s.state.yearStatus).toBe('error')
  })

  it('an empty reply is ready with nothing in it', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', { count: 0, jobs: [] })
    expect(s.state.yearStatus).toBe('ready')
    expect(s.state.yearJobs).toEqual([])
  })
})

describe('keeping the year current', () => {
  it('asks again, quietly, when a print finishes and a year is on screen', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', { count: 1, jobs: [{ job_id: 'a' }] })
    await s.dispatch('onHistoryChange', { action: 'finished', job: { job_id: 'a' } })
    expect(asked()).toHaveLength(2)
    expect(s.state.yearStatus).toBe('ready')
  })

  it('asks for nothing when no year was ever loaded (the flag is off)', async () => {
    const s = makeStore()
    await s.dispatch('onHistoryChange', { action: 'finished', job: { job_id: 'a' } })
    expect(asked()).toHaveLength(0)
  })

  it('a print being added is not a reason to ask', async () => {
    const s = makeStore()
    await s.dispatch('loadYear')
    await s.dispatch('onYearList', { count: 1, jobs: [] })
    await s.dispatch('onHistoryChange', { action: 'added', job: { job_id: 'b' } })
    expect(asked()).toHaveLength(1)
  })
})
