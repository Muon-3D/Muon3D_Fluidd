import { describe, expect, it } from 'vitest'
import { entryOf, readPairingEntry } from '../entry'

const answering = (status: number, body: unknown) => ({
  fetch: async () => ({ status, body: new TextEncoder().encode(typeof body === 'string' ? body : JSON.stringify(body)) })
})

describe('how a printer lets a stranger in (D-166)', () => {
  it('reads "open" as open', () => {
    expect(entryOf({ accepting: true, entry: 'open' })).toBe('open')
  })

  it.each([
    ['protected', { entry: 'protected' }],
    ['a missing entry', { accepting: true }],
    ['an unknown word', { entry: 'wide-open' }],
    ['a different case', { entry: 'Open' }],
    ['a boolean', { entry: true }],
    ['nothing', null]
  ])('reads %s as protected, never as open', (_name, body) => {
    expect(entryOf(body)).toBe('protected')
  })

  it('reads the answer of GET /pairing over a session', async () => {
    expect(await readPairingEntry(answering(200, { entry: 'open' }))).toBe('open')
    expect(await readPairingEntry(answering(200, { entry: 'protected' }))).toBe('protected')
    expect(await readPairingEntry(answering(200, {}))).toBe('protected')
  })

  it('reads an error, an unreadable body or a dropped session as protected', async () => {
    expect(await readPairingEntry(answering(404, { entry: 'open' }))).toBe('protected')
    expect(await readPairingEntry(answering(200, 'not json'))).toBe('protected')
    expect(await readPairingEntry({ fetch: async () => { throw new Error('connection lost') } })).toBe('protected')
  })
})
