/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cardSaves, clearCardSaves, readCardSave, toggleCardSave } from '../card-saves'

const client = vi.hoisted(() => ({ savesOf: vi.fn(), save: vi.fn(), unsave: vi.fn() }))
vi.mock('../store', () => ({ libraryClient: () => client }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  clearCardSaves()
  client.savesOf.mockResolvedValue({ saves: [] })
  client.save.mockResolvedValue({ id: 'saved-one' })
  client.unsave.mockResolvedValue(null)
})
afterEach(() => { vi.useRealTimers() })

describe('the card heart shares the existing save contract', () => {
  it('batches duplicate cards and reads both saved and empty state', async () => {
    client.savesOf.mockResolvedValue({ saves: [{ target: { id: 'one' }, save_id: 'saved-one' }] })
    readCardSave('one'); readCardSave('one'); readCardSave('two')
    await vi.runAllTimersAsync()
    expect(client.savesOf).toHaveBeenCalledOnce()
    expect(client.savesOf).toHaveBeenCalledWith(['one', 'two'])
    expect(cardSaves.ids).toEqual({ one: 'saved-one', two: null })
  })
  it('saves, then unsaves, without a separate like', async () => {
    await toggleCardSave('one')
    expect(client.save).toHaveBeenCalledWith('one')
    expect(cardSaves.ids.one).toBe('saved-one')
    await toggleCardSave('one')
    expect(client.unsave).toHaveBeenCalledWith('saved-one')
    expect(cardSaves.ids.one).toBeNull()
  })
  it('keeps catalogue slugs distinct and uses the same save API for them', async () => {
    readCardSave('cube', 'catalogue')
    await vi.runAllTimersAsync()
    expect(client.savesOf).toHaveBeenCalledWith(['cube'], 'catalogue')
    await toggleCardSave('cube', 'catalogue')
    expect(client.save).toHaveBeenCalledWith('cube', 'catalogue')
    expect(cardSaves.ids['catalogue:cube']).toBe('saved-one')
  })
  it('keeps the heart unchanged on failure and allows a retry', async () => {
    client.save.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await toggleCardSave('one')
    expect(cardSaves.ids.one).toBeUndefined()
    expect(cardSaves.errors.one).toBeTruthy()
    expect(cardSaves.busy.one).toBe(false)
    await toggleCardSave('one')
    expect(cardSaves.ids.one).toBe('saved-one')
    expect(cardSaves.errors.one).toBe('')
  })
  it('does not let a late save response leak into the next signed-in session', async () => {
    let resolve!: (value: { id: string }) => void
    client.save.mockReturnValue(new Promise(_resolve => { resolve = _resolve }))
    const pending = toggleCardSave('one')
    clearCardSaves()
    resolve({ id: 'old-account-save' })
    await pending
    expect(cardSaves.ids).toEqual({})
  })
})
