import { afterEach, describe, expect, it } from 'vitest'
import { announceAccount, currentAccount, onAccountChange, onAccountCleared, SIGNED_OUT } from '../account-events'

const stops: Array<() => void> = []
afterEach(() => {
  while (stops.length) stops.pop()!()
  announceAccount(SIGNED_OUT)
})

describe('announceAccount', () => {
  it('still clears the cache, and tells the other listeners, when a listener throws', () => {
    const order: string[] = []
    stops.push(onAccountChange(() => { throw new Error('a listener broke') }))
    stops.push(onAccountChange(next => order.push(`heard ${next.id}`)))
    stops.push(onAccountCleared(() => order.push('cache cleared')))
    expect(() => announceAccount({ signedIn: true, id: 'acct-jack', name: 'Jack' })).not.toThrow()
    expect(order).toEqual(['heard acct-jack', 'cache cleared'])
    expect(currentAccount().id).toBe('acct-jack')
  })

  it('clears the cache even when a forgetter before it throws', () => {
    const order: string[] = []
    stops.push(onAccountCleared(() => { throw new Error('a forgetter broke') }))
    stops.push(onAccountCleared(() => order.push('second forgotten')))
    announceAccount({ signedIn: false, id: null, name: null })
    expect(order).toEqual(['second forgotten'])
  })
})
